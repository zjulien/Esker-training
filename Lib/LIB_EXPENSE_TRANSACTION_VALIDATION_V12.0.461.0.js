///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Transaction_Validation_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Expense Transaction validation lib",
  "require": [
    "Sys/Sys_Helpers_Data",
    "LIB_P2P_V12.0.461.0",
    "Lib_Expense_V12.0.461.0",
    "Lib_Expense_Transaction_V12.0.461.0",
    "Lib_Expense_Report_V12.0.461.0",
    "Sys/Sys_EmailNotification",
    "[Lib_Expense_Transaction_Customization_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Transaction;
        (function (Transaction) {
            var Validation;
            (function (Validation) {
                function SendNotificationToReviewer(reviewerLogin) {
                    Log.Info("[Validation.SendNotificationToReviewer] with reviewerLogin: ".concat(reviewerLogin));
                    var toUser = Users.GetUserAsProcessAdmin(reviewerLogin);
                    var template = "Transaction_Email_NotifTransactionParserReviewer_V2_XX.htm";
                    var nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                    if (nextAlert === null || nextAlert === void 0 ? void 0 : nextAlert.isError) {
                        template = "Transaction_Email_NotifTransactionParserReviewerWithError_V2_XX.htm";
                    }
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
                Validation.SendNotificationToReviewer = SendNotificationToReviewer;
                function CreateAllEmployeeTransactionCD() {
                    var ret = true;
                    var logins = {};
                    Sys.Helpers.Data.ForEachTableItem("LineTransaction__", function (item) {
                        var login = item.GetValue("EmployeeLogin__");
                        if (Sys.Helpers.IsEmpty(login)) {
                            ret = false;
                        }
                        else if (!Object.prototype.hasOwnProperty.call(logins, login)) {
                            logins[login] = [item];
                        }
                        else {
                            logins[login].push(item);
                        }
                    });
                    for (var login in logins) {
                        if (Lib.Expense.Transaction.Validation.CreateEmployeeTransactionCD(login, logins[login]) == "") {
                            ret = false;
                        }
                    }
                    return ret;
                }
                Validation.CreateAllEmployeeTransactionCD = CreateAllEmployeeTransactionCD;
                function CreateEmployeeTransactionCD(employeeLogin, transactions) {
                    try {
                        Log.Info("Generating Employee Transaction for employee :" + employeeLogin);
                        var childCD = Process.CreateProcessInstanceForUser(Lib.P2P.GetEmployeeTransactionsProcessName(), employeeLogin, 2 /* ChildProcessType.Notification */, true);
                        if (childCD) {
                            var fromUser = Lib.P2P.GetValidatorOrOwner();
                            var autoCompleteFromTransactionParser_1 = {
                                "RUIDEXTransactionParser": Data.GetValue("RUIDEX"),
                                "EmployeeLogin__": transactions[0].GetValue("EmployeeLogin__"),
                                "EmployeeID__": transactions[0].GetValue("EmployeeID__"),
                                "EmployeeName__": transactions[0].GetValue("EmployeeName__"),
                                transactions: [],
                                "emailNotification": {
                                    sendNotification: false,
                                    fromName: fromUser.GetValue("DisplayName"),
                                    accountLogo: fromUser.GetLogoPath()
                                },
                                "Right": Users.GetUser(Data.GetValue("OwnerId")).GetValue("login")
                            };
                            Sys.Helpers.Array.ForEach(transactions, function (item) {
                                var dataTransaction = {
                                    "TransactionID__": item.GetValue("TransactionID__"),
                                    "ExpenseDescription__": item.GetValue("ExpenseDescription__"),
                                    "BilledAmount__": item.GetValue("BilledAmount__"),
                                    "BilledCurrencyCode__": item.GetValue("BilledCurrencyCode__"),
                                    "ISOBilledCurrencyCode__": item.GetValue("ISOBilledCurrencyCode__"),
                                    "CurrencyExchangeRate__": item.GetValue("CurrencyExchangeRate__"),
                                    "LocalAmount__": item.GetValue("LocalAmount__"),
                                    "LocalCurrencyCode__": item.GetValue("LocalCurrencyCode__"),
                                    "ISOLocalCurrencyCode__": item.GetValue("ISOLocalCurrencyCode__"),
                                    "MerchantCategory__": item.GetValue("MerchantCategory__"),
                                    "MerchantName__": item.GetValue("MerchantName__"),
                                    "TransactionDate__": item.GetValue("TransactionDate__")
                                };
                                autoCompleteFromTransactionParser_1.transactions.push(dataTransaction);
                            });
                            var vars = childCD.GetUninheritedVars();
                            var isTouchLess = Sys.Helpers.TryCallFunction("Lib.Expense.Transaction.Customization.Server.getAutoCreateExpenses");
                            // Vars needs to be added before "Process()", but only if touchless
                            if (isTouchLess) {
                                Log.Info("auto validating employee transactions");
                                vars.AddValue_String("RequestedActions", "approve|", true);
                                vars.AddValue_String("NeedValidation", "0", true);
                            }
                            else {
                                autoCompleteFromTransactionParser_1.emailNotification.sendNotification = true;
                            }
                            vars.AddValue_String("TechnicalData__", JSON.stringify({ autoCompleteFromTransactionParser: autoCompleteFromTransactionParser_1 }), true);
                            childCD.Process();
                            return vars.GetValue_String("RUIDEX", 0);
                        }
                        Log.Error("Could not create the next process");
                        return "";
                    }
                    catch (e) {
                        Log.Info("Employee Transactions process does not exist");
                        return "";
                    }
                }
                Validation.CreateEmployeeTransactionCD = CreateEmployeeTransactionCD;
                function CreateExpense(transactionLine) {
                    try {
                        Log.Info("Generating Expense from transaction ID :" + transactionLine.GetValue("TransactionID__"));
                        if (!transactionLine.GetValue("ExpenseNumber__")) {
                            var childCD = Process.CreateProcessInstanceForUser(Lib.P2P.GetExpenseProcessName(), Data.GetValue("EmployeeLogin__"), 2 /* ChildProcessType.Notification */, true);
                            if (childCD) {
                                var autoCompleteFromTransactionEmployee = {
                                    "RUIDEXTransactionEmployee": Data.GetValue("RUIDEX"),
                                    "TransactionID__": transactionLine.GetValue("TransactionID__"),
                                    "TransactionDescription__": transactionLine.GetValue("TransactionDescription__"),
                                    "BilledAmount__": transactionLine.GetValue("BilledAmount__"),
                                    "BilledCurrencyCode__": transactionLine.GetValue("BilledCurrencyCode__"),
                                    "ISOBilledCurrencyCode__": transactionLine.GetValue("ISOBilledCurrencyCode__"),
                                    "CurrencyExchangeRate__": transactionLine.GetValue("CurrencyExchangeRate__"),
                                    "LocalAmount__": transactionLine.GetValue("LocalAmount__"),
                                    "LocalCurrencyCode__": transactionLine.GetValue("LocalCurrencyCode__"),
                                    "ISOLocalCurrencyCode__": transactionLine.GetValue("ISOLocalCurrencyCode__"),
                                    "MerchantCategory__": transactionLine.GetValue("MerchantCategory__"),
                                    "MerchantName__": transactionLine.GetValue("MerchantName__"),
                                    "TransactionDate__": transactionLine.GetValue("TransactionDate__")
                                };
                                var vars = childCD.GetUninheritedVars();
                                var expenseNumber = Lib.Expense.NextNumber("Expense", "Status__", undefined, Lib.P2P.GetExpenseProcessName());
                                vars.AddValue_String("ExpenseNumber__", expenseNumber, true);
                                transactionLine.SetValue("ExpenseNumber__", expenseNumber);
                                transactionLine.SetAllowTableValuesOnly("ExpenseNumber__", false);
                                vars.AddValue_String("TechnicalData__", JSON.stringify({ autoCompleteFromTransactionEmployee: autoCompleteFromTransactionEmployee }), true);
                                childCD.Process();
                                return vars.GetValue_String("RUIDEX", 0);
                            }
                            Log.Info("Not create expense because it already have one linked");
                            return "";
                        }
                        Log.Error("Could not create the next process");
                        return "";
                    }
                    catch (e) {
                        Log.Info("Employee Transactions process does not exist");
                        return "";
                    }
                }
                Validation.CreateExpense = CreateExpense;
                function CreateAllExpenses() {
                    var ret = true;
                    var expensesToCreateFromLine = [];
                    Sys.Helpers.Data.ForEachTableItem("TransactionItems__", function (item) {
                        if (item.GetValue("ExpenseCreationMode__") == Lib.Expense.Transaction.ExpenseCreationMode.New && !item.GetValue("ExpenseCreated__")) {
                            expensesToCreateFromLine.push(item);
                        }
                    });
                    expensesToCreateFromLine.forEach(function (transactionLine) {
                        var RUIDEXExpense = Lib.Expense.Transaction.Validation.CreateExpense(transactionLine);
                        if (RUIDEXExpense == "") {
                            ret = false;
                        }
                        else {
                            transactionLine.SetValue("ExpenseRUIDEX__", RUIDEXExpense);
                            transactionLine.SetValue("ExpenseCreated__", true);
                        }
                    });
                    return ret;
                }
                Validation.CreateAllExpenses = CreateAllExpenses;
                //export _TransactionExistingExpense
                function LinkAllExpenses() {
                    var ret = true;
                    var expensesToLinkFromLine = [];
                    Sys.Helpers.Data.ForEachTableItem("TransactionItems__", function (item) {
                        if (item.GetValue("ExpenseCreationMode__") == Lib.Expense.Transaction.ExpenseCreationMode.Existing && !item.GetValue("ExpenseCreated__")) {
                            expensesToLinkFromLine.push(item);
                        }
                    });
                    expensesToLinkFromLine.forEach(function (transactionLine, index) {
                        var RUIDEXExpense = Lib.Expense.Transaction.Validation.LinkExpense(transactionLine, index);
                        if (RUIDEXExpense == "") {
                            ret = false;
                        }
                        else {
                            transactionLine.SetValue("ExpenseRUIDEX__", RUIDEXExpense);
                            transactionLine.SetValue("ExpenseCreated__", true);
                        }
                    });
                    return ret;
                }
                Validation.LinkAllExpenses = LinkAllExpenses;
                function LinkExpense(transactionLine, index) {
                    Log.Info("Linking expense ".concat(transactionLine.GetValue("ExpenseNumber__"), " with transaction line ").concat(index));
                    var query = Process.CreateQuery();
                    query.Reset();
                    query.SetSpecificTable("CDNAME#Expense");
                    query.SetAttributesList("*");
                    query.SetFilter(Lib.Expense.Report.GetExpensesFilter([transactionLine.GetValue("ExpenseNumber__")]));
                    if (!query.MoveFirst()) {
                        Log.Error("Error querying expense: ".concat(query.GetLastErrorMessage()));
                        return "";
                    }
                    var expense = query.MoveNext();
                    if (query.GetRecordCount() != 1) {
                        Log.Error("Error querying expense " + transactionLine.GetValue("ExpenseNumber__") + " nb result != 1, nbresult =" + query.GetRecordCount());
                        return "";
                    }
                    var vars = expense.GetUninheritedVars();
                    var strOriginalTechnicalData = vars.GetValue_String("TechnicalData__", 0);
                    var jsonTechnicalData = strOriginalTechnicalData ? JSON.parse(strOriginalTechnicalData) : {};
                    var autoCompleteFromTransactionEmployee = {
                        "RUIDEXTransactionEmployee": Data.GetValue("RUIDEX"),
                        "TransactionID__": transactionLine.GetValue("TransactionID__"),
                        "TransactionDescription__": transactionLine.GetValue("TransactionDescription__"),
                        "BilledAmount__": transactionLine.GetValue("BilledAmount__"),
                        "BilledCurrencyCode__": transactionLine.GetValue("BilledCurrencyCode__"),
                        "ISOBilledCurrencyCode__": transactionLine.GetValue("ISOBilledCurrencyCode__"),
                        "CurrencyExchangeRate__": transactionLine.GetValue("CurrencyExchangeRate__"),
                        "LocalAmount__": transactionLine.GetValue("LocalAmount__"),
                        "LocalCurrencyCode__": transactionLine.GetValue("LocalCurrencyCode__"),
                        "ISOLocalCurrencyCode__": transactionLine.GetValue("ISOLocalCurrencyCode__"),
                        "MerchantCategory__": transactionLine.GetValue("MerchantCategory__"),
                        "MerchantName__": transactionLine.GetValue("MerchantName__"),
                        "TransactionDate__": transactionLine.GetValue("TransactionDate__")
                    };
                    jsonTechnicalData.autoCompleteFromTransactionEmployee = autoCompleteFromTransactionEmployee;
                    vars.AddValue_String("TechnicalData__", JSON.stringify(jsonTechnicalData), true);
                    var status = vars.GetValue_String("ExpenseStatus__", 0);
                    if (status == "To submit" || status == "Draft") {
                        var state = vars.GetValue_Long("State", 0);
                        if (state == 50) {
                            Log.Error("Current state of expense is 50, need to resubmit this one when state of expenses has change");
                            return "";
                        }
                        else if (state == 70) {
                            vars.AddValue_String("RequestedActions", "approve|FromTransaction_LinkExpenseToTransaction", true);
                            vars.AddValue_String("NeedValidation", "0", true);
                            expense.Validate("Expense update triggered by employee transaction"); // we may also do something if validation fails
                        }
                        else {
                            Log.Error("[LinkExpense] Expense not linked due to Unexpected state :" + state);
                        }
                    }
                    else {
                        Log.Info("[LinkExpense] Expense not linked due to Fonctional status :" + status);
                    }
                    return vars.GetValue_String("RUIDEX", 0);
                }
                Validation.LinkExpense = LinkExpense;
            })(Validation = Transaction.Validation || (Transaction.Validation = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
