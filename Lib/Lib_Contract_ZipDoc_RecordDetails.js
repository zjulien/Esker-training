/**
 * @file Lib.Contract.ZipDoc.RecordDetails library
 */
/**
 * Specific Contract ZipDoc function to generate audit files
 * For the Download document feature
 * @class Lib.Contract.ZipDoc.RecordDetails
*/
/* LIB_DEFINITION
{
    "name": "Lib_Contract_ZipDoc_RecordDetails",
    "libraryType": "LIB",
    "scriptType": "SERVER",
    "comment": "Contract serializers for the record details generation",
    "require": ["Sys/Sys_Helpers_CDL", "Sys/Sys_Helpers_MAudit", "Sys/Sys_Helpers_Conversation"]
}
*/
///#GLOBALS Lib Sys
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var ZipDoc;
        (function (ZipDoc) {
            var RecordDetails;
            (function (RecordDetails) {
                RecordDetails.Context = {
                    workflow: {},
                };
                /**
                 *
                 * @param date type Date or DateTime to get as a string
                 * @param isDateTime keep default value (false) for a Date / use true for DateTime
                 * @param timeFormat keep default value ("None") for a Date / use "ShortTime" or "None" for DateTime depending on whether we want to display the time or not
                 */
                function getDateAsString(date, isDateTime, timeFormat) {
                    if (isDateTime === void 0) { isDateTime = false; }
                    if (timeFormat === void 0) { timeFormat = "None"; }
                    if (!date) {
                        Log.Warn("Some dates are not yet filled on the contract. Regrenerating the zip later should solve the problem.");
                        return "";
                    }
                    var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    return currentUser ? currentUser.GetFormattedDate(date, {
                        dateFormat: "ShortDate",
                        timeFormat: timeFormat,
                        timeZone: isDateTime ? "User" : "Local"
                    }) : date.toLocaleString();
                }
                function formatMultilineText(text) {
                    return text.replace(/(\r\n)|\n/g, "<br>");
                }
                function getWorkflowDataToJSON(processID, msnEXs) {
                    var workflowData = {};
                    var records = Sys.Helpers.CDL.getCDLRecords({
                        processID: processID,
                        tableName: "ApproversList__",
                        sourceMSNEXs: msnEXs,
                        fields: ["Line_WRKFUserName__", "Line_WRKFRole__", "Line_WRKFDate__", "Line_WRKFComment__"]
                    });
                    if (records) {
                        var _loop_1 = function (recordForMsnex) {
                            if (records[recordForMsnex]) {
                                var lines_1 = [];
                                records[recordForMsnex].forEach(function (record) {
                                    var line = [];
                                    if (!record.Line_WRKFDate__) {
                                        line.push("<font color=\"darkgrey\">".concat(record.Line_WRKFUserName__, "</font>"));
                                        line.push("<font color=\"darkgrey\">".concat(record.Line_WRKFRole__, "</font>"));
                                        line.push("&nbsp;");
                                        line.push("&nbsp;");
                                    }
                                    else {
                                        var dateStr = getDateAsString(record.Line_WRKFDate__, true, "ShortTime");
                                        line.push(record.Line_WRKFUserName__);
                                        line.push(record.Line_WRKFRole__);
                                        line.push(dateStr.replace(/ /g, "&nbsp;"));
                                        line.push(record.Line_WRKFComment__ ? formatMultilineText(record.Line_WRKFComment__) : "&nbsp");
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
                /**
                 * Create the json object for generate "Contract" process audit file.
                 * @param {string} processID current processID delt
                 * @param {string[]} msnEXs list of msnEXs for the current processID
                 * @param {ESKMap<string>} translations Object that contains all the translations of the process
                 * @memberOf  Lib.Contract.ZipDoc.RecordDetails
                 */
                function InitForContract(processID, msnEXs, translations) {
                    RecordDetails.Context.workflow = getWorkflowDataToJSON(processID, msnEXs);
                }
                RecordDetails.InitForContract = InitForContract;
                /**
                 * Create the json object for generate "Contract" process audit file.
                 * @param {xVars} transportVars [xVars]{@link https://doc.esker.com/eskerondemand/cv_ly/en/manager/Content/ProcessingScripts/xEDDAPI/xVars/xVars_Object.html} object representing the variables of the current transport
                 * @param {ESKMap<string>} translations Object that contains all the translations of the process
                 * @param {string[]} filenames list of current transport attachment filenames
                 * @param {string} md5Hash hash of the current transport
                 * @param {string[]} md5FileHashes list of hashes for each attachment of the transport
                 * @param {Sys.ZipDoc.RecordDetails.IConverterOptions} options
                 * @return {Sys.ZipDoc.RecordDetails.Details} The JSON view of the current flexible form
                 * @memberOf  Lib.Contract.ZipDoc.RecordDetails
                 */
                function ContractoJson(transportVars, translations, filenames, md5Hash, md5FileHashes, options) {
                    var contextForCurrentContract = {
                        workflow: null
                    };
                    //const currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    var msnex = transportVars.GetValue_String("MSNEX", 0);
                    var GetProcessTranslation = function (key) {
                        return Sys.ZipDoc.RecordDetails.GetProcessTranslation(translations, key);
                    };
                    if (Lib.Contract.ZipDoc.RecordDetails.Context.workflow[msnex]) {
                        contextForCurrentContract.workflow = Lib.Contract.ZipDoc.RecordDetails.Context.workflow[msnex];
                    }
                    var resultJson = {
                        title: "".concat(Language.Translate("_Record details"), " ").concat(GetProcessTranslation("_Contract"), " id: ").concat(transportVars.GetValue_String("MSNEX", 0)),
                        categories: []
                    };
                    resultJson.categories.push({
                        title: GetProcessTranslation("_Contract Details"),
                        fields: [
                            [
                                {
                                    t: GetProcessTranslation("_Company code"),
                                    v: transportVars.GetValue_String("CompanyCode__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_Reference number"),
                                    v: transportVars.GetValue_String("ReferenceNumber__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_Description"),
                                    v: "<br>" + formatMultilineText(transportVars.GetValue_String("Description__", 0))
                                }
                            ],
                            [
                                {
                                    t: GetProcessTranslation("_OwnerNiceName"),
                                    v: transportVars.GetValue_String("OwnerNiceName__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_ContractName"),
                                    v: transportVars.GetValue_String("Name__", 0)
                                }
                            ]
                        ]
                    });
                    resultJson.categories.push({
                        title: GetProcessTranslation("_Vendor Contact"),
                        fields: [
                            [
                                {
                                    t: GetProcessTranslation("_Vendor number"),
                                    v: transportVars.GetValue_String("VendorNumber__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_Vendor address"),
                                    v: "<br>" + transportVars.GetValue_String("VendorAddress__", 0)
                                }
                            ],
                            [
                                {
                                    t: GetProcessTranslation("_Vendor name"),
                                    v: transportVars.GetValue_String("VendorName__", 0)
                                }
                            ]
                        ]
                    });
                    var tacitRenewal = transportVars.GetValue_String("TacitRenewal__", 0) == "1";
                    var initialStartDate = getDateAsString(transportVars.GetValue_Date("InitialStartDate__", 0));
                    var startDate = getDateAsString(transportVars.GetValue_Date("StartDate__", 0));
                    var nextOccurenceText = null;
                    var renewalTerm = transportVars.GetValue_Long("RenewalTerms__", 0);
                    var endDate = transportVars.GetValue_Date("EndDate__", 0);
                    if (!Sys.Helpers.IsEmpty(endDate) && !Sys.Helpers.IsEmpty(renewalTerm)) {
                        var nextStartDate = new Date(endDate.getTime());
                        nextStartDate.setDate(nextStartDate.getDate() + 1);
                        var nextEndDate = new Date(nextStartDate.getTime());
                        nextEndDate.setMonth(nextEndDate.getMonth() + renewalTerm);
                        nextEndDate.setDate(nextStartDate.getDate() - 1);
                        nextOccurenceText = getDateAsString(nextStartDate) + " -- " + getDateAsString(nextEndDate);
                    }
                    // Renewal true but still we are still in the first term
                    if (tacitRenewal && initialStartDate == startDate) {
                        resultJson.categories.push({
                            title: GetProcessTranslation("_Validity"),
                            fields: [
                                [
                                    {
                                        t: GetProcessTranslation("_Start date"),
                                        v: getDateAsString(transportVars.GetValue_Date("StartDate__", 0))
                                    },
                                    {
                                        t: GetProcessTranslation("_NotificationDate"),
                                        v: getDateAsString(transportVars.GetValue_Date("NotificationDate__", 0))
                                    },
                                    {
                                        t: GetProcessTranslation("_Next occurence"),
                                        v: nextOccurenceText
                                    }
                                ],
                                [
                                    {
                                        t: GetProcessTranslation("_End date"),
                                        v: getDateAsString(transportVars.GetValue_Date("EndDate__", 0))
                                    }
                                ]
                            ]
                        });
                    }
                    // Renewal true but we are in the second term
                    else if (tacitRenewal && initialStartDate != startDate) {
                        resultJson.categories.push({
                            title: GetProcessTranslation("_Validity"),
                            fields: [
                                [
                                    {
                                        t: GetProcessTranslation("_Start date"),
                                        v: getDateAsString(transportVars.GetValue_Date("StartDate__", 0))
                                    },
                                    {
                                        t: GetProcessTranslation("_Initial start date"),
                                        v: getDateAsString(transportVars.GetValue_Date("InitialStartDate__", 0))
                                    },
                                    {
                                        t: GetProcessTranslation("_NotificationDate"),
                                        v: getDateAsString(transportVars.GetValue_Date("NotificationDate__", 0))
                                    },
                                    {
                                        t: GetProcessTranslation("_Next occurence"),
                                        v: nextOccurenceText
                                    }
                                ],
                                [
                                    {
                                        t: GetProcessTranslation("_End date"),
                                        v: getDateAsString(transportVars.GetValue_Date("EndDate__", 0))
                                    },
                                    {
                                        t: GetProcessTranslation("_Initial end date"),
                                        v: getDateAsString(transportVars.GetValue_Date("InitialEndDate__", 0))
                                    }
                                ]
                            ]
                        });
                    }
                    // No renewal
                    else {
                        resultJson.categories.push({
                            title: GetProcessTranslation("_Validity"),
                            fields: [
                                [
                                    {
                                        t: GetProcessTranslation("_Start date"),
                                        v: getDateAsString(transportVars.GetValue_Date("StartDate__", 0))
                                    },
                                    {
                                        t: GetProcessTranslation("_NotificationDate"),
                                        v: getDateAsString(transportVars.GetValue_Date("NotificationDate__", 0))
                                    }
                                ],
                                [
                                    {
                                        t: GetProcessTranslation("_End date"),
                                        v: getDateAsString(transportVars.GetValue_Date("EndDate__", 0))
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
                                    t: GetProcessTranslation("_Digital fingerprint"),
                                    v: h || ""
                                };
                            }) : null
                        });
                    }
                    if (contextForCurrentContract.workflow && contextForCurrentContract.workflow.length > 0) {
                        resultJson.categories.push({
                            title: GetProcessTranslation("_ApprovalWorkflow"),
                            tables: [
                                {
                                    headers: [
                                        GetProcessTranslation("_WRKFUserName"),
                                        GetProcessTranslation("_WRKFRole"),
                                        GetProcessTranslation("_WRKFDate"),
                                        GetProcessTranslation("_WRKFComment")
                                    ],
                                    lines: contextForCurrentContract.workflow
                                }
                            ]
                        });
                    }
                    return resultJson;
                }
                RecordDetails.ContractoJson = ContractoJson;
            })(RecordDetails = ZipDoc.RecordDetails || (ZipDoc.RecordDetails = {}));
        })(ZipDoc = Contract.ZipDoc || (Contract.ZipDoc = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
/**
 * Declaration of a specific converter to json for the process "Contract".
 * To declare your own converter/template, in your library Lib.Custom.ZipDoc.RecordDetails, you can set another converter for process as follow:
 * Sys.ZipDoc.RecordDetails.ConvertToJson["My process name"] = myMethodReference;
 * Your converter will be run by the finalizationscript.js of the sysprocess "Zip Documents".
 * @type Sys.ZipDoc.RecordDetails.ConverterToJson
 * @memberOf Lib.Contract.ZipDoc.RecordDetails
 */
Sys.ZipDoc.RecordDetails.ConvertToJson["P2P - Contract"] = Lib.Contract.ZipDoc.RecordDetails.ContractoJson;
Sys.ZipDoc.RecordDetails.InitFunctionsMap["P2P - Contract"] = Lib.Contract.ZipDoc.RecordDetails.InitForContract;
