///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_TRANSACTION_PARSER_CDF3_MAPPING_V12.0.461.0",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Mapping for the CDF3 name of field in specs to name in form",
  "require": [
    "Lib_Expense_Transaction_Parser_V12.0.461.0"
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
                var CDF3;
                (function (CDF3) {
                    function floatingAmountParser(amount, exponent) {
                        return (parseInt(amount, 10) / Math.pow(10, parseInt(exponent, 10))).toString();
                    }
                    var EmployeeId = {
                        XPath: "../../AccountInformation_4300/EmployeeId | ./EmployeeId", Field: "EmployeeID__", AggregateFunction: function (accountEid, transactionEid) {
                            if (accountEid && transactionEid) {
                                if (accountEid != transactionEid) {
                                    Log.Info("Two differents Employee ID were given (".concat(accountEid, " in the account information field, ").concat(transactionEid, " in the transaction field)"));
                                }
                            }
                            return accountEid !== null && accountEid !== void 0 ? accountEid : transactionEid;
                        }
                    };
                    var NameOfCardHolder = { XPath: "../../AccountInformation_4300/NameLine1", Field: "CardholderName__" };
                    var CardAcceptorName = { XPath: "../CardAcceptor_5001/CardAcceptorName", Field: "MerchantName__" };
                    var CardAcceptorBusinessCode = { XPath: "../CardAcceptor_5001/CardAcceptorBusinessCode", Field: "MerchantCategory__" };
                    var ItemDescription = { XPath: "../LineItemDetailEntity/CorporateCardLineItemDetail_5010/ItemDescription", Field: "ExpenseDescription__" };
                    var ProcessorTransactionId = { XPath: "./ProcessorTransactionId", Field: "TransactionID__" };
                    var TransactionDate = { XPath: "./TransactionDate", Field: "TransactionDate__" };
                    var PostedConversionRate = { XPath: "./PostedConversionRate", Field: "CurrencyExchangeRate__" };
                    var PostedCurrencyCode = { XPath: "./PostedCurrencyCode", Field: "ISOBilledCurrencyCode__" };
                    var OriginalCurrencyCode = { XPath: "./OriginalCurrencyCode", Field: "ISOLocalCurrencyCode__" };
                    var AmountInOriginalCurrency = {
                        XPath: "./AmountInOriginalCurrency | ./AmountInOriginalCurrency/@CurrencyExponent", Field: "LocalAmount__", AggregateFunction: floatingAmountParser
                    };
                    var AmountInPostedCurrency = {
                        XPath: "./AmountInPostedCurrency | ./AmountInPostedCurrency/@CurrencyExponent", Field: "BilledAmount__", AggregateFunction: floatingAmountParser
                    };
                    var transactionTable = {
                        XPath: "//FinancialTransaction_5000", Field: "LineTransaction__",
                        XPathCells: [EmployeeId, CardAcceptorName, CardAcceptorBusinessCode, ItemDescription, TransactionDate, ProcessorTransactionId, PostedCurrencyCode, NameOfCardHolder, AmountInPostedCurrency, PostedConversionRate, AmountInOriginalCurrency, OriginalCurrencyCode]
                    };
                    CDF3._mapping = {
                        transactionTable: [transactionTable]
                    };
                    function getMapping() {
                        return CDF3._mapping;
                    }
                    CDF3.getMapping = getMapping;
                })(CDF3 = Parser.CDF3 || (Parser.CDF3 = {}));
            })(Parser = Transaction.Parser || (Transaction.Parser = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
