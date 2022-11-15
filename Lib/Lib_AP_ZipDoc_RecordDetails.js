/**
 * @file Lib.AP.ZipDoc.RecordDetails library
 */
/**
 * Specific AP ZipDoc function to generate audit files
 * For the Download document feature
 * @class Lib.AP.ZipDoc.RecordDetails
*/
/* LIB_DEFINITION
{
    "name": "Lib_AP_ZipDoc_RecordDetails",
    "libraryType": "LIB",
    "scriptType": "SERVER",
    "comment": "AP serializers for the record details generation",
    "require": ["Sys/Sys_Helpers_CDL", "Sys/Sys_Helpers_MAudit", "Sys/Sys_Helpers_Conversation"]
}
*/
///#GLOBALS Lib Sys
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var ZipDoc;
        (function (ZipDoc) {
            var RecordDetails;
            (function (RecordDetails) {
                RecordDetails.Context = {
                    workflow: {},
                    maudit: {},
                    conversation: {}
                };
                function getFakeHashForDemo(baseHash) {
                    if (baseHash) {
                        var halfIdx = Math.floor(baseHash.length / 2);
                        var hashArr1 = baseHash.substr(0, halfIdx).split("");
                        var hashArr2 = baseHash.substr(halfIdx).split("");
                        return hashArr1.reverse().join("") + hashArr2.reverse().join("");
                    }
                    return "168e081f77dab224b0b21423457be628";
                }
                function getDisplayName(userID) {
                    var user = Users.GetUser(userID);
                    if (user) {
                        var dislpayName = user.GetValue("DisplayName");
                        if (!dislpayName) {
                            dislpayName = user.GetValue("Login");
                            if (user.GetValue("Vendor") === "1") {
                                dislpayName = dislpayName.split("$")[1];
                            }
                        }
                        return dislpayName;
                    }
                    return userID;
                }
                function getDateAsString(date, userTimeZone, timeFormat) {
                    if (userTimeZone === void 0) { userTimeZone = true; }
                    if (timeFormat === void 0) { timeFormat = "ShortTime"; }
                    if (!date) {
                        Log.Warn("Some dates are not yet filled on the expense report. Regrenerating the zip later should solve the problem.");
                        return "";
                    }
                    var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    return currentUser ? currentUser.GetFormattedDate(date, {
                        dateFormat: "ShortDate",
                        timeFormat: timeFormat,
                        timeZone: userTimeZone ? "User" : "Local"
                    }) : date.toLocaleString();
                }
                /**
                 * Translate a LazyTranslation stringify object. If the object is not valid,
                 * considered it is a simple string value for compatibility reason
                 *
                 * @param {ESKMap<string>} translations List of translation from the source process
                 * @param {string} text A stringify LazyTranslationString object to translate
                 * @returns {string} The translation of the text parameter
                 */
                function formatLazyTranslationString(translations, text) {
                    var lazyTranslation;
                    // Check if this is a valid lazyTranslation or a simple string
                    if (text && text.indexOf("{") === 0 && text.indexOf("translationKey") !== -1) {
                        try {
                            lazyTranslation = JSON.parse(text);
                        }
                        catch (_a) {
                            lazyTranslation = null;
                        }
                    }
                    if (lazyTranslation && lazyTranslation.translationKey) {
                        return formatLazyTranslation(translations, lazyTranslation);
                    }
                    return Sys.ZipDoc.RecordDetails.GetProcessTranslation(translations, text);
                }
                /**
                 * Return the translation from a LazyTranslation object
                 *
                 * @param {ESKMap<string>} translations List of translation from the source process
                 * @param {LazyTranslationString} lazyTranslation The object to translate
                 * @returns {string} The translation of the LazyTranslation object
                 */
                function formatLazyTranslation(translations, lazyTranslation) {
                    var translatedParameters = new Array();
                    if (lazyTranslation.parameters) {
                        lazyTranslation.parameters.forEach(function (p) {
                            if (typeof p === "object") {
                                translatedParameters.push(formatLazyTranslation(translations, p));
                            }
                            else {
                                translatedParameters.push(p);
                            }
                        });
                    }
                    return Sys.ZipDoc.RecordDetails.GetProcessTranslation(translations, lazyTranslation.translationKey, translatedParameters.length > 0 ? translatedParameters : null);
                }
                function formatMultilineText(text) {
                    return text.replace(/(\r\n)|\n/g, "<br>");
                }
                function getWorkflowDataToJSON(processID, msnEXs, translations) {
                    var workflowData = {};
                    var records = Sys.Helpers.CDL.getCDLRecords({
                        processID: processID,
                        tableName: "ApproversList__",
                        sourceMSNEXs: msnEXs,
                        fields: ["Line_Approver__", "Line_ApproverLabelRole__", "Line_ApprovalDate__", "Line_ApproverComment__"]
                    });
                    if (records) {
                        var _loop_1 = function (recordForMsnex) {
                            if (records[recordForMsnex]) {
                                var lines_1 = [];
                                records[recordForMsnex].forEach(function (record) {
                                    var line = [];
                                    if (!record.Line_ApprovalDate__) {
                                        line.push("<font color=\"lightgray\">".concat(record.Line_Approver__, "</font>"));
                                        line.push("<font color=\"lightgray\">".concat(record.Line_ApproverLabelRole__, "</font>"));
                                        line.push("&nbsp;");
                                        line.push("&nbsp;");
                                    }
                                    else {
                                        var dateStr = getDateAsString(record.Line_ApprovalDate__);
                                        line.push(record.Line_Approver__);
                                        line.push(record.Line_ApproverLabelRole__);
                                        line.push(dateStr.replace(/ /g, "&nbsp;"));
                                        line.push(record.Line_ApproverComment__ ? formatLazyTranslationString(translations, formatMultilineText(record.Line_ApproverComment__)) : "&nbsp");
                                    }
                                    lines_1.push(line);
                                });
                                workflowData[recordForMsnex] = lines_1;
                            }
                        };
                        for (var recordForMsnex in records) {
                            _loop_1(recordForMsnex);
                        }
                    }
                    return workflowData;
                }
                function getConversationDataToJSON(processID, msnEXs) {
                    var conversationData = {};
                    var records = Sys.Helpers.Conversation.getConversationRecordsFromProcessId(processID, msnEXs);
                    if (records) {
                        var _loop_2 = function (recordForRuidex) {
                            if (records[recordForRuidex]) {
                                var lines_2 = [];
                                records[recordForRuidex].forEach(function (record) {
                                    var line = [];
                                    var conversationUserName = getDisplayName(record.ownerID);
                                    var dateStr = getDateAsString(record.creationDate);
                                    line.push(conversationUserName);
                                    line.push(dateStr.replace(/ /g, "&nbsp;"));
                                    line.push(formatMultilineText(record.message));
                                    lines_2.push(line);
                                });
                                conversationData[recordForRuidex] = lines_2;
                            }
                        };
                        for (var recordForRuidex in records) {
                            _loop_2(recordForRuidex);
                        }
                    }
                    return conversationData;
                }
                function getMAuditDataToJSON(processID, msnEXs, translations) {
                    var mauditData = {};
                    var records = Sys.Helpers.MAudit.getMauditRecordsFromProcessId(processID, msnEXs);
                    if (records) {
                        var _loop_3 = function (recordForMsnex) {
                            if (records[recordForMsnex]) {
                                var lines_3 = [];
                                records[recordForMsnex].forEach(function (record) {
                                    var line = [];
                                    var auditUserName = getDisplayName(record.UserID);
                                    var dateStr = getDateAsString(record.AuditDate);
                                    line.push(auditUserName);
                                    line.push(Sys.ZipDoc.RecordDetails.GetProcessTranslation(translations, record.AuditTypeTranslation));
                                    line.push(dateStr.replace(/ /g, "&nbsp;"));
                                    line.push(Sys.Helpers.MAudit.GetMauditDecription(record, translations));
                                    lines_3.push(line);
                                });
                                mauditData[recordForMsnex] = lines_3;
                            }
                        };
                        for (var recordForMsnex in records) {
                            _loop_3(recordForMsnex);
                        }
                    }
                    return mauditData;
                }
                /**
                 * Create the json object for generate "vendor invoice" process audit file.
                 * @param {string} processID current processID delt
                 * @param {string[]} msnEXs list of msnEXs for the current processID
                 * @param {ESKMap<string>} translations Object that contains all the translations of the process
                 * @memberOf  Lib.AP.ZipDoc.RecordDetails
                 */
                function InitForVIP(processID, msnEXs, translations) {
                    RecordDetails.Context.workflow = getWorkflowDataToJSON(processID, msnEXs, translations);
                    RecordDetails.Context.maudit = getMAuditDataToJSON(processID, msnEXs, translations);
                    RecordDetails.Context.conversation = getConversationDataToJSON(processID, msnEXs);
                }
                RecordDetails.InitForVIP = InitForVIP;
                /**
                 * Create the json object for generate "vendor invoice" process audit file.
                 * @param {xVars} transportVars [xVars]{@link https://doc.esker.com/eskerondemand/cv_ly/en/manager/Content/ProcessingScripts/xEDDAPI/xVars/xVars_Object.html} object representing the variables of the current transport
                 * @param {ESKMap<string>} translations Object that contains all the translations of the process
                 * @param {string[]} filenames list of current transport attachment filenames
                 * @param {string} md5Hash hash of the current transport
                 * @param {string[]} md5FileHashes list of hashes for each attachment of the transport
                 * @param {Sys.ZipDoc.RecordDetails.IConverterOptions} options
                 * @return {Sys.ZipDoc.RecordDetails.Details} The JSON view of the current flexible form
                 * @memberOf  Lib.AP.ZipDoc.RecordDetails
                 */
                function VipToJson(transportVars, translations, filenames, md5Hash, md5FileHashes, options) {
                    var contextForCurrentVIP = {
                        workflow: null,
                        maudit: null,
                        conversation: null
                    };
                    var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    var invoiceDate = transportVars.GetValue_Date("InvoiceDate__", 0);
                    var msnex = transportVars.GetValue_String("MSNEX", 0);
                    var ruidex = transportVars.GetValue_String("RUIDEX", 0);
                    var archiveDate = transportVars.GetValue_Date("ArchiveDateTime", 0);
                    var archiveDuration = transportVars.GetValue_String("ArchiveDuration", 0);
                    //#region Handle demo accounts values
                    if (options && options.isInDemoAccount) {
                        var state = transportVars.GetValue_Long("State", 0);
                        // no previous information of archive has been found and the processing is finished
                        if (!archiveDate && !md5Hash && (!archiveDuration || archiveDuration === "2" || archiveDuration === "0") && state >= 100) {
                            var parameters = null;
                            if (options && options.externalVars) {
                                var parametersAsStr = options.externalVars.GetValue_String("tableParameters", 0);
                                parameters = parametersAsStr ? JSON.parse(parametersAsStr) : null;
                            }
                            archiveDate = transportVars.GetValue_Date("CompletionDateTime", 0);
                            md5Hash = "".concat(getFakeHashForDemo(md5FileHashes[0]), "(sample)");
                            if (parameters && parameters.ArchiveDurationInMonths && parameters.ArchiveDurationInMonths !== "2" && parameters.ArchiveDurationInMonths !== "0") {
                                // demo account with archive duration set on configuration
                                archiveDuration = parameters.ArchiveDurationInMonths;
                            }
                            else {
                                // default value for demo samples
                                archiveDuration = "132";
                            }
                        }
                    }
                    //#enregion Handle demo accounts values
                    var GetProcessTranslation = function (key) {
                        return Sys.ZipDoc.RecordDetails.GetProcessTranslation(translations, key);
                    };
                    var receptionMethod = transportVars.GetValue_String("ReceptionMethod__", 0);
                    var digitalSignature = transportVars.GetValue_String("DigitalSignature__", 0);
                    // To transform value to key trad
                    switch (digitalSignature) {
                        case "":
                            digitalSignature = null;
                            break;
                        case "Verified": // Specific case because '_Verified' is not the 'Verified' key trad due to a modification of trad label
                            digitalSignature = "_Signature".concat(digitalSignature);
                            break;
                        default:
                            digitalSignature = "_".concat(digitalSignature);
                    }
                    if (Lib.AP.ZipDoc.RecordDetails.Context.workflow[msnex]) {
                        contextForCurrentVIP.workflow = Lib.AP.ZipDoc.RecordDetails.Context.workflow[msnex];
                    }
                    if (Lib.AP.ZipDoc.RecordDetails.Context.maudit[msnex]) {
                        contextForCurrentVIP.maudit = Lib.AP.ZipDoc.RecordDetails.Context.maudit[msnex];
                    }
                    if (Lib.AP.ZipDoc.RecordDetails.Context.conversation[ruidex]) {
                        contextForCurrentVIP.conversation = Lib.AP.ZipDoc.RecordDetails.Context.conversation[ruidex];
                    }
                    var resultJson = {
                        title: "".concat(Language.Translate("_Record details"), " ").concat(GetProcessTranslation("_Invoice"), " id: ").concat(transportVars.GetValue_String("MSNEX", 0)),
                        categories: []
                    };
                    resultJson.categories.push({
                        title: GetProcessTranslation("_Vendor Information"),
                        fields: [
                            [
                                {
                                    t: null,
                                    v: "".concat(transportVars.GetValue_String("VendorNumber__", 0), " - ").concat(transportVars.GetValue_String("VendorName__", 0))
                                },
                                {
                                    t: null,
                                    v: transportVars.GetValue_String("VendorStreet__", 0)
                                },
                                {
                                    t: null,
                                    v: "".concat(transportVars.GetValue_String("VendorZipCode__", 0), " ").concat(transportVars.GetValue_String("VendorCity__", 0))
                                }
                            ]
                        ]
                    });
                    var invoiceProcessing = {
                        title: GetProcessTranslation("_Invoice Processing"),
                        fields: [
                            [
                                {
                                    t: GetProcessTranslation("_ReceptionMethod"),
                                    v: GetProcessTranslation(receptionMethod)
                                }
                            ]
                        ]
                    };
                    if (receptionMethod === "Email") {
                        invoiceProcessing.fields[0].push({
                            t: GetProcessTranslation("_From"),
                            v: transportVars.GetValue_String("FromAddress", 0)
                        });
                    }
                    if (digitalSignature) {
                        invoiceProcessing.fields.push([
                            {
                                t: GetProcessTranslation("_DigitalSignature"),
                                v: GetProcessTranslation(digitalSignature)
                            }
                        ]);
                    }
                    resultJson.categories.push(invoiceProcessing);
                    resultJson.categories.push({
                        title: GetProcessTranslation("_Invoice Details"),
                        fields: [
                            [
                                {
                                    t: GetProcessTranslation("_Invoice number"),
                                    v: transportVars.GetValue_String("InvoiceNumber__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_Net amount"),
                                    v: currentUser.GetFormattedNumber(transportVars.GetValue_Double("NetAmount__", 0))
                                },
                                {
                                    t: GetProcessTranslation("_Invoice currency"),
                                    v: transportVars.GetValue_String("InvoiceCurrency__", 0)
                                }
                            ],
                            [
                                {
                                    t: GetProcessTranslation("_Invoice date"),
                                    v: invoiceDate ? getDateAsString(invoiceDate, false, "None") : ""
                                },
                                {
                                    t: GetProcessTranslation("_Tax amount"),
                                    v: currentUser.GetFormattedNumber(transportVars.GetValue_Double("TaxAmount__", 0))
                                },
                                {
                                    t: GetProcessTranslation("_Invoice status"),
                                    v: GetProcessTranslation(transportVars.GetValue_String("InvoiceStatus__", 0))
                                }
                            ],
                            [
                                {
                                    t: GetProcessTranslation("_ERP Invoice number"),
                                    v: transportVars.GetValue_String("ERPInvoiceNumber__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_Invoice amount"),
                                    v: currentUser.GetFormattedNumber(transportVars.GetValue_Double("InvoiceAmount__", 0))
                                }
                            ]
                        ]
                    });
                    if (archiveDate) {
                        var archiveString = "_ArchiveDuration_" + (archiveDuration === "2" || archiveDuration === "0" ? 0 : Number(archiveDuration) / 12);
                        resultJson.categories.push({
                            title: GetProcessTranslation("_Archive Details"),
                            fields: [
                                [
                                    {
                                        t: GetProcessTranslation("_Archive Duration"),
                                        v: GetProcessTranslation(archiveString)
                                    },
                                    {
                                        t: GetProcessTranslation("_Achive Hash"),
                                        v: md5Hash ? md5Hash : ""
                                    }
                                ],
                                [
                                    {
                                        t: GetProcessTranslation("_Archive Date"),
                                        v: currentUser.GetFormattedDate(archiveDate, { dateFormat: "ShortDate", timeFormat: "ShortTime", timeZone: "User" })
                                    }
                                ]
                            ]
                        });
                    }
                    if (filenames && filenames.length > 0) {
                        resultJson.categories.push({
                            title: Language.Translate("_Record attachments"),
                            filenames: filenames,
                            hashes: md5FileHashes ? md5FileHashes.map(function (h) {
                                return {
                                    t: GetProcessTranslation("_Achive Hash"),
                                    v: h || ""
                                };
                            }) : null
                        });
                    }
                    if (contextForCurrentVIP.workflow && contextForCurrentVIP.workflow.length > 0) {
                        resultJson.categories.push({
                            title: GetProcessTranslation("_Payment Approval"),
                            tables: [
                                {
                                    headers: [
                                        GetProcessTranslation("_User"),
                                        GetProcessTranslation("_ApproverLabelRole"),
                                        GetProcessTranslation("_Date"),
                                        GetProcessTranslation("_ApproverComment")
                                    ],
                                    lines: contextForCurrentVIP.workflow
                                }
                            ]
                        });
                    }
                    if (contextForCurrentVIP.maudit && contextForCurrentVIP.maudit.length > 0) {
                        resultJson.categories.push({
                            title: GetProcessTranslation("_Audits"),
                            tables: [
                                {
                                    headers: [
                                        GetProcessTranslation("_User"),
                                        GetProcessTranslation("_AuditType"),
                                        GetProcessTranslation("_Date"),
                                        GetProcessTranslation("_AuditDescription")
                                    ],
                                    lines: contextForCurrentVIP.maudit
                                }
                            ]
                        });
                    }
                    if (contextForCurrentVIP.conversation && contextForCurrentVIP.conversation.length > 0) {
                        resultJson.categories.push({
                            title: GetProcessTranslation("_Conversation"),
                            tables: [
                                {
                                    headers: [
                                        GetProcessTranslation("_User"),
                                        GetProcessTranslation("_Date"),
                                        GetProcessTranslation("_Message")
                                    ],
                                    lines: contextForCurrentVIP.conversation
                                }
                            ]
                        });
                    }
                    return resultJson;
                }
                RecordDetails.VipToJson = VipToJson;
            })(RecordDetails = ZipDoc.RecordDetails || (ZipDoc.RecordDetails = {}));
        })(ZipDoc = AP.ZipDoc || (AP.ZipDoc = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
/**
 * Declaration of a specific converter to json for the process "Vendor invoice".
 * To declare your own converter/template, in your library Lib.Custom.ZipDoc.RecordDetails, you can set another converter for process as follow:
 * Sys.ZipDoc.RecordDetails.ConvertToJson["My process name"] = myMethodReference;
 * Your converter will be run by the finalizationscript.js of the sysprocess "Zip Documents".
 * @type Sys.ZipDoc.RecordDetails.ConverterToJson
 * @memberOf Lib.AP.ZipDoc.RecordDetails
 */
Sys.ZipDoc.RecordDetails.ConvertToJson["Vendor invoice"] = Lib.AP.ZipDoc.RecordDetails.VipToJson;
Sys.ZipDoc.RecordDetails.InitFunctionsMap["Vendor invoice"] = Lib.AP.ZipDoc.RecordDetails.InitForVIP;
