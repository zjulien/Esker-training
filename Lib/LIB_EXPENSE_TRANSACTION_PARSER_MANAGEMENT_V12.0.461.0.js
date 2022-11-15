///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Transaction_Parser_Management_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Expense Transaction parsers management",
  "require": [
    "Sys/Sys_EmailNotification",
    "Sys/Sys_Helpers",
    "Lib_Expense_Transaction_V12.0.461.0",
    "Lib_Expense_Transaction_Parser_V12.0.461.0",
    "Lib_Expense_Transaction_Parser_GL1025_ASCII_V12.0.461.0",
    "Lib_Expense_Transaction_Parser_GL1076_ASCII_V12.0.461.0",
    "Lib_Expense_Transaction_Parser_CDF3XML_V12.0.461.0",
    "[Lib_Expense_Transaction_Customization_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Transaction;
        (function (Transaction) {
            var Parser;
            (function (Parser) {
                var Management;
                (function (Management) {
                    Management._parsers = [];
                    function GetParsers() {
                        return Management._parsers || [];
                    }
                    Management.GetParsers = GetParsers;
                    function SetParsers(parsers) {
                        Management._parsers = parsers;
                    }
                    Management.SetParsers = SetParsers;
                    function GetLastError() {
                        return Management._lastError;
                    }
                    Management.GetLastError = GetLastError;
                    function ResetError() {
                        Management._lastError = undefined;
                    }
                    Management.ResetError = ResetError;
                    function Init() {
                        //Customization parsers
                        Management._parsers = [];
                        Management._lastError = undefined;
                        var customParsers = Sys.Helpers.TryCallFunction("Lib.Expense.Transaction.Customization.Server.GetParsers");
                        if (customParsers) {
                            Management._parsers = Management._parsers.concat(customParsers);
                        }
                        //R&D parsers
                        Management._parsers.push(Lib.Expense.Transaction.Parser.GL1025.ASCII.getParser());
                        Management._parsers.push(Lib.Expense.Transaction.Parser.GL1076.ASCII.getParser());
                        Management._parsers.push(Lib.Expense.Transaction.Parser.CDF3XML.getParser());
                    }
                    Management.Init = Init;
                    function RunParsing(indexOfFileToParse) {
                        Management._lastError = undefined;
                        var parserFound = false;
                        var currentParserIndex = 0;
                        Log.Info("".concat(Management._parsers.length, " parser(s) found"));
                        for (currentParserIndex = 0; currentParserIndex < Management._parsers.length; currentParserIndex++) {
                            if (Management._parsers[currentParserIndex].IsCompatible(indexOfFileToParse)) {
                                Log.Info("Found a compatible parser (ID ".concat(currentParserIndex, ")"));
                                parserFound = true;
                                break;
                            }
                        }
                        if (!parserFound) {
                            Management._lastError = new Error("_No compatible parser found");
                        }
                        var parsingDone = false;
                        try {
                            if (parserFound) {
                                parsingDone = Management._parsers[currentParserIndex].RunParsing(indexOfFileToParse);
                                if (!parsingDone) {
                                    Management._lastError = new Error("_Unexpected error occurs during parsing");
                                }
                            }
                        }
                        catch (error) {
                            Management._lastError = error;
                        }
                        return parserFound && parsingDone;
                    }
                    Management.RunParsing = RunParsing;
                    function SendExtractionErrorNotification(login) {
                        Log.Info("[Lib.Expense.Transaction.Parser.Management.SendExtractionErrorNotification] to : ".concat(login));
                        var toUser = Users.GetUserAsProcessAdmin(login);
                        var template = "Transaction_Email_NotifTransactionParserReviewerWithError_V2_XX.htm";
                        var fromName = "_EskerExpenseManagement";
                        var customTags = {
                            DisplayName: toUser.GetValue("DisplayName")
                        };
                        var options = {
                            backupUserAsCC: true,
                            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                        };
                        Sys.EmailNotification.SendEmailNotificationWithUser(toUser, null, template, customTags, fromName, null, options);
                    }
                    Management.SendExtractionErrorNotification = SendExtractionErrorNotification;
                })(Management = Parser.Management || (Parser.Management = {}));
            })(Parser = Transaction.Parser || (Transaction.Parser = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
