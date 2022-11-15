/**
 * @file Lib.ExpenseReport.ZipDoc.RecordDetails library
 */
/**
 * Specific Expense ZipDoc function to generate audit files
 * For the Download document feature
 * @class Lib.ExpenseReport.ZipDoc.RecordDetails
*/
/* LIB_DEFINITION
{
    "name": "Lib_Expense_Report_ZipDoc_RecordDetails",
    "libraryType": "LIB",
    "scriptType": "SERVER",
    "comment": "Expense Report serializers for the record details generation",
    "require": ["Sys/Sys_Helpers_CDL", "Sys/Sys_Helpers_MAudit", "Sys/Sys_Helpers_Conversation"]
}
*/
///#GLOBALS Lib Sys
var Lib;
(function (Lib) {
    var ExpenseReport;
    (function (ExpenseReport) {
        var ZipDoc;
        (function (ZipDoc) {
            var RecordDetails;
            (function (RecordDetails) {
                RecordDetails.Context = {
                    expenses: {},
                    workflow: {},
                };
                function getDateAsString(date, userTimeZone, timeFormat) {
                    if (userTimeZone === void 0) { userTimeZone = false; }
                    if (timeFormat === void 0) { timeFormat = "None"; }
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
                function formatMultilineText(text) {
                    return text.replace(/(\r\n)|\n/g, "<br>");
                }
                function getExpensesDataToJSON(processID, msnEXs) {
                    var expensesData = {};
                    var records = Sys.Helpers.CDL.getCDLRecords({
                        processID: processID,
                        tableName: "ExpensesTable__",
                        sourceMSNEXs: msnEXs,
                        fields: ["Line_ExpenseNumber__", "Line_Date__", "Line_ExpenseType__", "Line_LocalAmount__", "Line_LocalCurrency__", "Line_ExpenseDescription__"]
                    });
                    if (records) {
                        var _loop_1 = function (recordForMsnex) {
                            if (records[recordForMsnex]) {
                                var lines_1 = [];
                                records[recordForMsnex].forEach(function (record) {
                                    var line = [];
                                    var dateStr = getDateAsString(record.Line_Date__);
                                    line.push(record.Line_ExpenseNumber__);
                                    line.push(dateStr.replace(/ /g, "&nbsp;"));
                                    line.push(record.Line_ExpenseType__);
                                    line.push(record.Line_LocalAmount__);
                                    line.push(record.Line_LocalCurrency__);
                                    line.push(record.Line_ExpenseDescription__ ? formatMultilineText(record.Line_ExpenseDescription__) : "&nbsp");
                                    lines_1.push(line);
                                });
                                expensesData[recordForMsnex] = lines_1;
                            }
                        };
                        for (var recordForMsnex in records) {
                            _loop_1(recordForMsnex);
                        }
                    }
                    return expensesData;
                }
                function getWorkflowDataToJSON(processID, msnEXs) {
                    var workflowData = {};
                    var records = Sys.Helpers.CDL.getCDLRecords({
                        processID: processID,
                        tableName: "ReportWorkflow__",
                        sourceMSNEXs: msnEXs,
                        fields: ["Line_WRKFUserName__", "Line_WRKFRole__", "Line_WRKFDate__", "Line_WRKFComment__"]
                    });
                    if (records) {
                        var _loop_2 = function (recordForMsnex) {
                            if (records[recordForMsnex]) {
                                var lines_2 = [];
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
                                    lines_2.push(line);
                                });
                                workflowData[recordForMsnex] = lines_2;
                            }
                        };
                        for (var recordForMsnex in records) {
                            _loop_2(recordForMsnex);
                        }
                    }
                    return workflowData;
                }
                /**
                 * Create the json object for generate "expense report" process audit file.
                 * @param {string} processID current processID delt
                 * @param {string[]} msnEXs list of msnEXs for the current processID
                 * @param {ESKMap<string>} translations Object that contains all the translations of the process
                 * @memberOf  Lib.ExpenseReport.ZipDoc.RecordDetails
                 */
                function InitForExpenseReport(processID, msnEXs, translations) {
                    RecordDetails.Context.expenses = getExpensesDataToJSON(processID, msnEXs);
                    RecordDetails.Context.workflow = getWorkflowDataToJSON(processID, msnEXs);
                }
                RecordDetails.InitForExpenseReport = InitForExpenseReport;
                /**
                 * Create the json object for generate "expense report" process audit file.
                 * @param {xVars} transportVars [xVars]{@link https://doc.esker.com/eskerondemand/cv_ly/en/manager/Content/ProcessingScripts/xEDDAPI/xVars/xVars_Object.html} object representing the variables of the current transport
                 * @param {ESKMap<string>} translations Object that contains all the translations of the process
                 * @param {string[]} filenames list of current transport attachment filenames
                 * @param {string} md5Hash hash of the current transport
                 * @param {string[]} md5FileHashes list of hashes for each attachment of the transport
                 * @param {Sys.ZipDoc.RecordDetails.IConverterOptions} options
                 * @return {Sys.ZipDoc.RecordDetails.Details} The JSON view of the current flexible form
                 * @memberOf  Lib.ExpenseReport.ZipDoc.RecordDetails
                 */
                function ExpenseReportToJson(transportVars, translations, filenames, md5Hash, md5FileHashes, options) {
                    var contextForCurrentExpenseReport = {
                        expenses: null,
                        workflow: null
                    };
                    var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    var msnex = transportVars.GetValue_String("MSNEX", 0);
                    var GetProcessTranslation = function (key) {
                        return Sys.ZipDoc.RecordDetails.GetProcessTranslation(translations, key);
                    };
                    if (Lib.ExpenseReport.ZipDoc.RecordDetails.Context.workflow[msnex]) {
                        contextForCurrentExpenseReport.workflow = Lib.ExpenseReport.ZipDoc.RecordDetails.Context.workflow[msnex];
                    }
                    if (Lib.ExpenseReport.ZipDoc.RecordDetails.Context.expenses[msnex]) {
                        contextForCurrentExpenseReport.expenses = Lib.ExpenseReport.ZipDoc.RecordDetails.Context.expenses[msnex];
                    }
                    var resultJson = {
                        title: "".concat(Language.Translate("_Record details"), " ").concat(GetProcessTranslation("Expense Report"), " id: ").concat(transportVars.GetValue_String("MSNEX", 0)),
                        categories: []
                    };
                    resultJson.categories.push({
                        title: GetProcessTranslation("Expense Report"),
                        fields: [
                            [
                                {
                                    t: GetProcessTranslation("_ExpenseReportNumber"),
                                    v: transportVars.GetValue_String("ExpenseReportNumber__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_UserName"),
                                    v: transportVars.GetValue_String("UserName__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_UserNumber"),
                                    v: transportVars.GetValue_String("UserNumber__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_ExpenseReportDescription"),
                                    v: formatMultilineText(transportVars.GetValue_String("Description__", 0))
                                }
                            ],
                            [
                                {
                                    t: GetProcessTranslation("_ExpenseReportTypeName"),
                                    v: transportVars.GetValue_String("ExpenseReportTypeName__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_SubmissionDate"),
                                    v: getDateAsString(transportVars.GetValue_Date("SubmissionDate__", 0))
                                }
                            ]
                        ]
                    });
                    resultJson.categories.push({
                        title: GetProcessTranslation("_ExpenseInformation"),
                        fields: [
                            [
                                {
                                    t: GetProcessTranslation("_TotalAmount"),
                                    v: currentUser.GetFormattedNumber(transportVars.GetValue_Double("TotalAmount__", 0))
                                },
                                {
                                    t: GetProcessTranslation("_RefundableAmount"),
                                    v: currentUser.GetFormattedNumber(transportVars.GetValue_Double("RefundableAmount__", 0))
                                }
                            ],
                            [
                                {
                                    t: GetProcessTranslation("_CC_Currency"),
                                    v: transportVars.GetValue_String("CC_Currency__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_NonRefundableAmount"),
                                    v: currentUser.GetFormattedNumber(transportVars.GetValue_Double("NonRefundableAmount__", 0))
                                }
                            ]
                        ]
                    });
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
                    if (contextForCurrentExpenseReport.expenses && contextForCurrentExpenseReport.expenses.length > 0) {
                        resultJson.categories.push({
                            title: GetProcessTranslation("_Expenses"),
                            tables: [
                                {
                                    headers: [
                                        GetProcessTranslation("_ExpenseNumber"),
                                        GetProcessTranslation("_Date"),
                                        GetProcessTranslation("_ExpenseType"),
                                        GetProcessTranslation("_LocalAmount"),
                                        GetProcessTranslation(""),
                                        GetProcessTranslation("_ExpenseDescription")
                                    ],
                                    lines: contextForCurrentExpenseReport.expenses
                                }
                            ]
                        });
                    }
                    if (contextForCurrentExpenseReport.workflow && contextForCurrentExpenseReport.workflow.length > 0) {
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
                                    lines: contextForCurrentExpenseReport.workflow
                                }
                            ]
                        });
                    }
                    return resultJson;
                }
                RecordDetails.ExpenseReportToJson = ExpenseReportToJson;
            })(RecordDetails = ZipDoc.RecordDetails || (ZipDoc.RecordDetails = {}));
        })(ZipDoc = ExpenseReport.ZipDoc || (ExpenseReport.ZipDoc = {}));
    })(ExpenseReport = Lib.ExpenseReport || (Lib.ExpenseReport = {}));
})(Lib || (Lib = {}));
/**
 * Declaration of a specific converter to json for the process "Expense Report".
 * To declare your own converter/template, in your library Lib.Custom.ZipDoc.RecordDetails, you can set another converter for process as follow:
 * Sys.ZipDoc.RecordDetails.ConvertToJson["My process name"] = myMethodReference;
 * Your converter will be run by the finalizationscript.js of the sysprocess "Zip Documents".
 * @type Sys.ZipDoc.RecordDetails.ConverterToJson
 * @memberOf Lib.ExpenseReport.ZipDoc.RecordDetails
 */
Sys.ZipDoc.RecordDetails.ConvertToJson["Expense Report"] = Lib.ExpenseReport.ZipDoc.RecordDetails.ExpenseReportToJson;
Sys.ZipDoc.RecordDetails.InitFunctionsMap["Expense Report"] = Lib.ExpenseReport.ZipDoc.RecordDetails.InitForExpenseReport;
