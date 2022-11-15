///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Transaction_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Expense Transaction management",
  "require": []
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Transaction;
        (function (Transaction) {
            var ExpenseCreationMode;
            (function (ExpenseCreationMode) {
                ExpenseCreationMode["New"] = "TransactionNewExpense";
                ExpenseCreationMode["Personal"] = "TransactionPersonalExpense";
                ExpenseCreationMode["Existing"] = "TransactionExistingExpense";
            })(ExpenseCreationMode = Transaction.ExpenseCreationMode || (Transaction.ExpenseCreationMode = {}));
            Transaction.technicalDataToEmployeeTransactions = {
                "formTable": "TransactionItems__",
                "mappings": {
                    "header": {
                        // TechnicalData field name : Form field Name
                        "RUIDEXTransactionParser": "RUIDEXTransactionParser__",
                        "EmployeeLogin__": "EmployeeLogin__",
                        "EmployeeID__": "EmployeeID__",
                        "EmployeeName__": "EmployeeName__"
                    },
                    "byLine": {
                        // TechnicalData field name : Table Form field Name
                        "TransactionID__": "TransactionID__",
                        "ExpenseDescription__": "TransactionDescription__",
                        "BilledAmount__": "BilledAmount__",
                        "BilledCurrencyCode__": "BilledCurrencyCode__",
                        "ISOBilledCurrencyCode__": "ISOBilledCurrencyCode__",
                        "CurrencyExchangeRate__": "CurrencyExchangeRate__",
                        "LocalAmount__": "LocalAmount__",
                        "LocalCurrencyCode__": "LocalCurrencyCode__",
                        "ISOLocalCurrencyCode__": "ISOLocalCurrencyCode__",
                        "MerchantCategory__": "MerchantCategory__",
                        "MerchantName__": "MerchantName__",
                        "TransactionDate__": "TransactionDate__",
                        "ExpenseCreationMode__": "ExpenseCreationMode__"
                    }
                }
            };
            ;
            function ShowConsistencyWarnings(transaction, expense) {
                var mismatch = {
                    template: false,
                    amount: false,
                    currency: false,
                    date: false
                };
                // Compare each field (except if it's not set on expense)
                if (expense.Template__) {
                    var expenseTemplate = expense.Template__ ? expense.Template__ : "Standard";
                    var transactionTemplate = transaction.GetValue("Template__") ? transaction.GetValue("Template__") : "Standard";
                    mismatch.template = (expenseTemplate != transactionTemplate);
                }
                if (expense.TotalAmount__) {
                    mismatch.amount = (expense.TotalAmount__ != transaction.GetValue("LocalAmount__"));
                }
                if (expense.TotalAmountCurrency__) {
                    mismatch.currency = (expense.TotalAmountCurrency__ != transaction.GetValue("LocalCurrencyCode__"));
                }
                if (expense.Date__) {
                    mismatch.date = (expense.Date__ != Sys.Helpers.Date.SafeDate2DBDate(transaction.GetValue("TransactionDate__")));
                }
                // Create and display inconsistency message
                if (mismatch.template || mismatch.amount || mismatch.currency || mismatch.date) {
                    var fieldList = "";
                    if (mismatch.template) {
                        fieldList += "\n - " + Language.Translate("_TemplateInTransaction");
                    }
                    if (mismatch.amount) {
                        fieldList += "\n - " + Language.Translate("_TotalAmount_report");
                    }
                    if (mismatch.currency) {
                        fieldList += "\n - " + Language.Translate("_TotalAmountCurrency_report");
                    }
                    if (mismatch.date) {
                        fieldList += "\n - " + Language.Translate("_Date_report");
                    }
                    var message = Language.Translate("_Warning expense inconsistency", false, fieldList);
                    transaction.SetWarning("ExpenseNumber__", message);
                    return mismatch;
                }
            }
            Transaction.ShowConsistencyWarnings = ShowConsistencyWarnings;
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
