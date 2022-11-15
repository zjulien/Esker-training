///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Report_DuplicateCheck_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Expense Report Duplicate Check common library",
  "require": [
    "Lib_V12.0.461.0",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Synchronizer",
    "[Sys/Sys_GenericAPI_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Report;
        (function (Report) {
            var DuplicateCheck;
            (function (DuplicateCheck) {
                function QueryDuplicate(expense) {
                    var expenseMSNEX, totalAmount, currency, date, originalOwnerId;
                    if (expense.ExpenseMSNEX__) {
                        // expense = row of the ExpensesTable__
                        expenseMSNEX = expense.ExpenseMSNEX__.GetValue();
                        totalAmount = expense.Amount__.GetValue();
                        currency = expense.Currency__.GetValue();
                        date = Sys.Helpers.Date.SafeDate2DBDate(expense.Date__.GetValue());
                        originalOwnerId = expense.OriginalOwnerId__.GetValue();
                    }
                    else if (expense.AddItem) {
                        // expense = Item of the ExpensesTable__
                        expenseMSNEX = expense.GetValue("ExpenseMSNEX__");
                        totalAmount = expense.GetValue("Amount__");
                        currency = expense.GetValue("Currency__");
                        date = Sys.Helpers.Date.SafeDate2DBDate(expense.GetValue("Date__"));
                        originalOwnerId = expense.GetValue("OriginalOwnerId__");
                    }
                    else {
                        // expense = Expense object got from DBQuery
                        expenseMSNEX = expense.GetValue("MSNEX");
                        totalAmount = expense.GetValue("TotalAmount__");
                        currency = expense.GetValue("TotalAmountCurrency__");
                        date = expense.GetValue("Date__");
                        originalOwnerId = expense.GetValue("OriginalOwnerId");
                    }
                    totalAmount = totalAmount || 0;
                    var filter = "(&(MsnEx!=" + expenseMSNEX + ")"
                        + "(TotalAmount__=" + totalAmount + ")"
                        + "(TotalAmountCurrency__=" + currency + ")"
                        + "(Date__=" + date + ")"
                        + "(|(ExpenseStatus__=To approve)(ExpenseStatus__=To control)(ExpenseStatus__=Validated)))";
                    if (Data.GetValue("ExpenseReportStatus__") === "Draft") {
                        filter = "(&(OriginalOwnerId=" + originalOwnerId + ")" + filter + ")";
                        // Check in the current Expenses table
                        var currentExpensesFilter_1 = "";
                        Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (line) {
                            if (line.GetValue("ExpenseMSNEX__") != expenseMSNEX &&
                                line.GetValue("Amount__") == totalAmount &&
                                line.GetValue("Currency__") == currency &&
                                Sys.Helpers.Date.SafeDate2DBDate(line.GetValue("Date__")) == date) {
                                currentExpensesFilter_1 += "(MsnEx=" + line.GetValue("ExpenseMSNEX__") + ")";
                            }
                        });
                        if (currentExpensesFilter_1) {
                            filter = "(|" + filter + currentExpensesFilter_1 + ")";
                        }
                    }
                    var deletedExpense = Sys.TechnicalData.GetValue("expensesDeleted");
                    if (deletedExpense) {
                        var deletedExpensesFilter_1 = "";
                        deletedExpense.forEach(function (exp) {
                            deletedExpensesFilter_1 += "(MsnEx!=".concat(exp.MSNEX, ")");
                        });
                        filter = "(&".concat(filter).concat(deletedExpensesFilter_1, ")");
                    }
                    var options = {
                        table: "CDNAME#Expense",
                        filter: filter,
                        attributes: ["ExpenseNumber__", "ExpenseType__", "Date__", "TotalAmount__", "TotalAmountCurrency__", "OwnerName__", "ValidationURL"],
                        sortOrder: "ExpenseNumber__ ASC",
                        maxRecords: 100
                    };
                    return Sys.GenericAPI.PromisedQuery(options);
                }
                DuplicateCheck.QueryDuplicate = QueryDuplicate;
                function CheckAllDuplicate() {
                    var expensesPromises = [];
                    Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (item) {
                        expensesPromises.push(QueryDuplicate(item));
                    });
                    return Sys.Helpers.Promise.All(expensesPromises)
                        .Then(function (results) {
                        var table = Data.GetTable("ExpensesTable__");
                        var duplicate = [];
                        results.forEach(function (result, i) {
                            if (result.length > 0) {
                                duplicate.push(table.GetItem(i));
                            }
                        });
                        return duplicate;
                    })
                        .Catch(function (error) {
                        Log.Error("An error occurred while checking expense duplicate: ".concat(error));
                        throw error;
                    });
                }
                DuplicateCheck.CheckAllDuplicate = CheckAllDuplicate;
                function IsDuplicateDetected() {
                    return Sys.Helpers.Promise.Create(function (resolve, reject) {
                        var table = Data.GetTable("ExpensesTable__");
                        function CheckNextDuplicate(i) {
                            if (i >= 0) {
                                QueryDuplicate(table.GetItem(i))
                                    .Then(function (results) {
                                    if (results.length > 0) {
                                        resolve(true);
                                    }
                                    else {
                                        CheckNextDuplicate(i - 1);
                                    }
                                })
                                    .Catch(function (error) {
                                    Log.Error("An error occurred while checking expense duplicate: ".concat(error));
                                    reject(error);
                                });
                            }
                            else {
                                resolve(false);
                            }
                        }
                        CheckNextDuplicate(table.GetItemCount() - 1);
                    });
                }
                DuplicateCheck.IsDuplicateDetected = IsDuplicateDetected;
                function IsDuplicateDetectedInList(expenseList) {
                    return Sys.Helpers.Promise.Create(function (resolve, reject) {
                        function CheckNextDuplicate(i) {
                            if (i >= 0) {
                                QueryDuplicate(expenseList[i])
                                    .Then(function (results) {
                                    if (results.length > 0) {
                                        resolve(true);
                                    }
                                    else {
                                        CheckNextDuplicate(i - 1);
                                    }
                                })
                                    .Catch(function (error) {
                                    Log.Error("An error occurred while checking expense duplicate: ".concat(error));
                                    reject(error);
                                });
                            }
                            else {
                                resolve(false);
                            }
                        }
                        CheckNextDuplicate(expenseList.length - 1);
                    });
                }
                DuplicateCheck.IsDuplicateDetectedInList = IsDuplicateDetectedInList;
            })(DuplicateCheck = Report.DuplicateCheck || (Report.DuplicateCheck = {}));
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
