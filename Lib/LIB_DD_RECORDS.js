/* LIB_DEFINITION
{
    "name": "LIB_DD_RECORDS",
    "libraryType": "LIB",
    "scriptType": "SERVER",
    "comment": "DD Helpers for records handling",
    "require": [ "Sys/Sys_Helpers" ]
}
*/
/**
 * @namespace Lib.DD.Records
 */
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        var Records;
        (function (Records) {
            var UPDATE_RECORDS_FIELD_NAME = "UpdateRecordsInfos";
            /**
             * Record
             * @lends Lib.DD.Records
             */
            function GetRecord(settings) {
                var processQuery = (settings.asAdmin) ? Process.CreateQueryAsProcessAdmin() : Process.CreateQuery();
                processQuery.SetFilter(settings.filter);
                processQuery.SetSearchInArchive(true);
                var attributeList = Sys.Helpers.IsArray(settings.attributeList) ? settings.attributeList.join(",") : "*";
                processQuery.SetAttributesList(attributeList);
                var eddRecord = null;
                if (processQuery.MoveFirst()) {
                    eddRecord = processQuery.MoveNext();
                    if (!eddRecord) {
                        Log.Error("Lib.DD.Record.GetRecord: Did not find any record matching filter (filter=" + settings.filter + ")");
                    }
                }
                else {
                    Log.Error("Lib.DD.Record.GetRecord: Could not perform query on CD table : " + processQuery.GetLastError());
                }
                return eddRecord;
            }
            Records.GetRecord = GetRecord;
            function AddUpdateNotification(settings) {
                var notif = settings.transport.AddNotif(9);
                if (notif) {
                    var targetTable = "CD#" + Process.GetProcessID("Sys_Update Records");
                    var notifVars = notif.GetVars();
                    notifVars.AddValue_String("NotifyFilter", settings.notifyFilter, true);
                    if (settings.notifyEachTime) {
                        notifVars.AddValue_String("NotifyEachTime", "1", true);
                    }
                    notifVars.AddValue_String("NotifyTriggerName", "OnStateChanged", true);
                    notifVars.AddValue_String("NotifyAddressType", targetTable, true);
                    notifVars.AddValue_String("NotifyIncludeAttachments", "0", true);
                    notifVars.AddValue_String("OwnerID", Data.GetValue("OwnerId"), true);
                    notifVars.AddValue_String("NotifySubjectTemplate", settings.notifySubject, true);
                    // Now set the external vars for the process to be able to know what to do
                    var updateRecordsInfos = {
                        targetRuids: settings.ruidExToUpdate,
                        values: settings.varsToUpdate
                    };
                    var extVars = notifVars.CreateSubNode("ExternalVariables");
                    extVars.AddValue_String(UPDATE_RECORDS_FIELD_NAME, JSON.stringify(updateRecordsInfos), true);
                }
                else {
                    throw "Could not create update process as a notification on transport.";
                }
            }
            Records.AddUpdateNotification = AddUpdateNotification;
            function HandleUpdateNotification() {
                // Retrieve field from current process
                var infosString = Variable.GetValueAsString(UPDATE_RECORDS_FIELD_NAME);
                var infos;
                if (infosString) {
                    //RD00016076
                    infosString = infosString.replace(/(?:\r?\n)/g, "\\r\\n").replace(/<\s*c:crlf\s*\/\s*>/g, "");
                    // Convert to json
                    Log.Info("Lib.DD.Record.HandleUpdateNotification: " + UPDATE_RECORDS_FIELD_NAME + "=" + infosString);
                    infos = JSON.parse(infosString);
                    // Check data integrity
                    var targetRuids = infos.targetRuids;
                    var values = infos.values;
                    var extValues = infos.extValues;
                    var recomputeParentsState = infos.recomputeParentsState;
                    var attachToManage = infos.attachToManage;
                    var onRecordFound = null;
                    if (attachToManage) {
                        this.ExtractOnAttach(attachToManage, values);
                        if (attachToManage.action === "TRANSMIT_ATTACH") {
                            onRecordFound = function (eddRecord) {
                                var currentAttach = Attach.GetInputFile(0);
                                var newAttach = eddRecord.AddAttachEx(currentAttach);
                                var attachVars = newAttach.GetVars();
                                attachVars.AddValue_String("AttachManagement", "COPY", true);
                                for (var varName in attachToManage.attachVars) {
                                    var type = attachToManage.attachVars[varName].type;
                                    var value = attachToManage.attachVars[varName].value;
                                    AddValue(attachVars, varName, type, value);
                                }
                            };
                        }
                    }
                    if (targetRuids && values) {
                        // Launch update
                        this.UpdateRecords(targetRuids, values, extValues, onRecordFound, recomputeParentsState);
                        return;
                    }
                    Log.Error("Lib.DD.Record.HandleUpdateNotification: Missing or invalid data in " + UPDATE_RECORDS_FIELD_NAME);
                    return;
                }
                Log.Error("Lib.DD.Record.HandleUpdateNotification: " + UPDATE_RECORDS_FIELD_NAME + " external variable is missing or empty");
            }
            Records.HandleUpdateNotification = HandleUpdateNotification;
            function UpdateRecords(ruids, infos, externalInfos, onRecordFound, recomputeParentsState) {
                // Handle case where ruids are not in array format
                var ruidsArray = Sys.Helpers.IsArray(ruids) ? ruids : [ruids];
                // Prepare query data
                var attributes = BuildQueryAttributes(infos);
                var SetRecomputeParentState = function (eddRecord, oldState, recomputeParentsStateParam) {
                    if (recomputeParentsStateParam === "auto") {
                        var newState = eddRecord.GetUninheritedVars().GetValue_Long("State", 0);
                        if (oldState >= 100 && newState >= 100 && oldState !== newState) {
                            eddRecord.GetUninheritedVars().AddValue_String("RecomputeParentsState", "1", true);
                        }
                    }
                };
                // Launch query for each specified RUIDEX
                for (var i = 0; i < ruidsArray.length; i++) {
                    var recordRuid = ruidsArray[i];
                    var eddRecord = GetRecord({ filter: "RUIDEX=" + recordRuid, attributeList: attributes });
                    if (eddRecord) {
                        var oldState = eddRecord.GetUninheritedVars().GetValue_Long("State", 0);
                        UpdateRecordVars(eddRecord, infos, externalInfos);
                        SetRecomputeParentState(eddRecord, oldState, recomputeParentsState);
                        // Callback for specific processing
                        if (onRecordFound && typeof (onRecordFound) === "function") {
                            onRecordFound(eddRecord);
                        }
                        SafeRecordProcess(eddRecord, "Lib.DD.Record.UpdateRecords: Error updating record " + recordRuid);
                    }
                    else {
                        Log.Warn("Lib.DD.Record.ProcessUpdates: No record with ruidex " + recordRuid);
                    }
                }
            }
            Records.UpdateRecords = UpdateRecords;
            function SafeRecordProcess(eddRecord, errorMessage) {
                var processError = false;
                try {
                    eddRecord.Process();
                }
                catch (exception) {
                    Log.Error("Lib.DD.Record.SafeRecordProcess: Exception while processing record : \"" + exception + "\"");
                    processError = true;
                }
                if (!processError) {
                    // If not exception occurred during Process call, check the GetLastError value
                    var lastError = eddRecord.GetLastError();
                    if (lastError) {
                        Log.Error("Lib.DD.Record.SafeRecordProcess: Error while processing record : \"" + lastError + "\"");
                        processError = true;
                    }
                }
                // Thow an exception (may force a script retry)
                if (processError) {
                    throw errorMessage;
                }
            }
            Records.SafeRecordProcess = SafeRecordProcess;
            function ExtractOnAttach(attachToManage, values) {
                // vars
                var varsToExtract = attachToManage.varsToExtract;
                for (var varToExtract in varsToExtract) {
                    var area = varsToExtract[varToExtract].extractionArea;
                    var type = varsToExtract[varToExtract].type;
                    var action = varsToExtract[varToExtract].action;
                    var modifier = varsToExtract[varToExtract].modifier;
                    var extractedValue = Document.GetArea(area.page, area.x, area.y, area.width, area.height).toString();
                    if (!values.hasOwnProperty(varToExtract)) {
                        action = "EXTRACT"; // default
                    }
                    var value;
                    if (action === "REPLACE") {
                        var oldValue = values[varToExtract].value;
                        var prev = varsToExtract[varToExtract].stringToReplace;
                        value = oldValue.replace(prev, extractedValue);
                    }
                    else {
                        value = extractedValue;
                    }
                    if (modifier === "REMOVE_LINE_BREAK") {
                        value = value.replace("\n", " ").replace("\r", "");
                    }
                    values[varToExtract] = { type: type, value: value };
                }
            }
            Records.ExtractOnAttach = ExtractOnAttach;
            function BuildQueryAttributes(infos) {
                var attributes = ["MsnEx", "RUIDEX", "ProcessId", "ownerid"];
                if (infos) {
                    for (var infoName in infos) {
                        attributes.push(infoName);
                    }
                }
                return attributes;
            }
            function UpdateRecordVars(record, uninheritedInfos, externalInfos) {
                var eddRecordVars = record.GetUninheritedVars();
                var eddRecordExtVars = record.GetExternalVars();
                var updateVarsFromInfos = function (vars, infos) {
                    if (!infos) {
                        return;
                    }
                    for (var field in infos) {
                        var info = infos[field];
                        if (!info.getValueOnly) {
                            AddValue(vars, field, info.type, info.value);
                        }
                    }
                };
                updateVarsFromInfos(eddRecordVars, uninheritedInfos);
                updateVarsFromInfos(eddRecordExtVars, externalInfos);
            }
            function AddValue(vars, field, type, value) {
                switch (type) {
                    case "date":
                        vars.AddValue_Date(field, value, true);
                        break;
                    case "string":
                        vars.AddValue_String(field, value, true);
                        break;
                    case "long":
                        vars.AddValue_Long(field, value, true);
                        break;
                    case "double":
                        vars.AddValue_Double(field, value, true);
                        break;
                    default:
                        Log.Info("The type specified (" + type + ") is not in ['string', 'date', 'double', 'long']");
                        break;
                }
            }
        })(Records = DD.Records || (DD.Records = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
