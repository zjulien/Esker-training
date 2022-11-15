///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Transaction_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Expense Transaction management",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_technicaldata",
    "Sys/Sys_EmailNotification",
    "Lib_Expense_V12.0.461.0",
    "Lib_Expense_AIForExpenses_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Transaction;
        (function (Transaction) {
            var Server;
            (function (Server) {
                function CheckMandatoryFields(item) {
                    if (item === void 0) { item = null; }
                    var fieldNames = ["EmployeeName__", "EmployeeLogin__"];
                    var containsMissingField = false;
                    Sys.Helpers.Array.ForEach(fieldNames, function (fieldName) {
                        var isValueEmpty = item ? Sys.Helpers.IsEmpty(item.GetValue(fieldName)) : Sys.Helpers.IsEmpty(Data.GetValue(fieldName));
                        if (isValueEmpty) {
                            containsMissingField = true;
                            if (item) {
                                item.SetError(fieldName, "This field is required!");
                            }
                            else {
                                Data.SetError(fieldName, "This field is required!");
                            }
                        }
                    });
                    return containsMissingField;
                }
                Server.CheckMandatoryFields = CheckMandatoryFields;
                /// EXPORT
                function CheckMandatoryFieldsForFillingForm() {
                    Log.Info("[Transaction.CheckMandatoryFieldsForFillingForm]");
                    if (Data.GetTable("LineTransaction__").GetItemCount() === 0) {
                        Log.Info("[Transaction.CheckMandatoryFieldsForFillingForm] No item in form");
                        return true;
                    }
                    var containsMissingField = false;
                    Sys.Helpers.Data.ForEachTableItem("LineTransaction__", function (item) {
                        containsMissingField = Lib.Expense.Transaction.Server.CheckMandatoryFields(item);
                        return containsMissingField; // break loop
                    });
                    if (containsMissingField) {
                        Log.Info("[Transaction.CheckMandatoryFieldsForFillingForm] Mandatory fields are not filled correctly");
                    }
                    return !containsMissingField;
                }
                Server.CheckMandatoryFieldsForFillingForm = CheckMandatoryFieldsForFillingForm;
                function InitEmployeeTransaction() {
                    var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    Lib.P2P.UserProperties.QueryValues(currentUser.GetValue("Login"))
                        .Then(function (UserPropertiesValues) {
                        var companyCode = UserPropertiesValues.CompanyCode__;
                        if (!companyCode) {
                            var allowedCompanyCodes = UserPropertiesValues.GetAllowedCompanyCodes().split("\n");
                            if (allowedCompanyCodes.length) {
                                companyCode = allowedCompanyCodes[0];
                            }
                        }
                        Data.SetValue("CompanyCode__", companyCode);
                        return Lib.P2P.CompanyCodesValue.QueryValues(companyCode);
                    })
                        .Then(function (CCValues) {
                        if (Object.keys(CCValues).length > 0) {
                            return Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__, ["PAC", "Expense"]);
                        }
                        return null;
                    })
                        .Then(function () {
                        Data.SetValue("Status__", "ToValidate");
                        Lib.Expense.Transaction.Server.InitHeaderFromTechnicalData();
                        Lib.Expense.Transaction.Server.InitTransactionsFromTechnicalData();
                    });
                }
                Server.InitEmployeeTransaction = InitEmployeeTransaction;
                function InitHeaderFromTechnicalData() {
                    var _a;
                    Log.Info("[Transactions.CompleteTransactionsFromTechnicalData");
                    var dataFromTransaction = Sys.TechnicalData.GetValue("autoCompleteFromTransactionParser");
                    if (Sys.Helpers.IsEmpty(dataFromTransaction)) {
                        return;
                    }
                    Sys.Helpers.Object.ForEach(Transaction.technicalDataToEmployeeTransactions.mappings.header, function (formFieldName, technicalFieldName) {
                        if (!Sys.Helpers.IsEmpty(dataFromTransaction[technicalFieldName])) {
                            Data.SetValue(formFieldName, dataFromTransaction[technicalFieldName]);
                        }
                    });
                    if ((_a = dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.emailNotification) === null || _a === void 0 ? void 0 : _a.sendNotification) {
                        Lib.Expense.Transaction.Server.SendNotificationToEmployee(dataFromTransaction.EmployeeLogin__, dataFromTransaction.emailNotification);
                    }
                    if (dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.Right) {
                        Process.AddRight(dataFromTransaction.Right, "read");
                    }
                }
                Server.InitHeaderFromTechnicalData = InitHeaderFromTechnicalData;
                function InitTransactionsFromTechnicalData() {
                    var _a;
                    Log.Info("[Transactions.CompleteTransactionsFromTechnicalData");
                    var dataFromTransaction = Sys.TechnicalData.GetValue("autoCompleteFromTransactionParser");
                    if (((_a = dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.transactions) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                        var table_1 = Data.GetTable(Lib.Expense.Transaction.technicalDataToEmployeeTransactions.formTable);
                        table_1.SetItemCount(dataFromTransaction.transactions.length);
                        Sys.Helpers.Array.ForEach(dataFromTransaction.transactions, function (transaction) {
                            transaction.ParsedTransactionDate__ = Sys.Helpers.Date.ISOSTringToDate(transaction.TransactionDate__);
                        });
                        dataFromTransaction.transactions.sort(sortTransactionsByDate);
                        Sys.Helpers.Array.ForEach(dataFromTransaction.transactions, function (transactionItem, index) {
                            var item = table_1.GetItem(index);
                            Sys.Helpers.Object.ForEach(Lib.Expense.Transaction.technicalDataToEmployeeTransactions.mappings.byLine, function (formFieldName, technicalFieldName) {
                                if (!Sys.Helpers.IsEmpty(transactionItem[technicalFieldName])) {
                                    item.SetValue(formFieldName, transactionItem[technicalFieldName]);
                                }
                            });
                            GetTemplateFromMCCOrExpenseType(item.GetValue("MerchantCategory__"))
                                .Then(function (template) { return item.SetValue("Template__", template); });
                            if (Sys.Helpers.IsEmpty(item.GetValue("ExpenseCreationMode__"))) {
                                InitTransactionCreationMode(item);
                            }
                        });
                    }
                }
                Server.InitTransactionsFromTechnicalData = InitTransactionsFromTechnicalData;
                /**
                 * Returns the template name from table "P2P - Merchant Category Code...__ or P2P - Expense Type__"
                 * returns "" if the expense type is not found
                 */
                function GetTemplateFromMCCOrExpenseType(MCC) {
                    if (MCC) {
                        var companyCode_1 = Data.GetValue("CompanyCode__");
                        var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode_1), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("MerchantCodeCategory__", MCC));
                        return Sys.GenericAPI.PromisedQuery({
                            table: "P2P - MerchantCategoryCodeToExpenseType__",
                            attributes: ["ExpenseType__", "Template__"],
                            filter: filter.toString(),
                            maxRecords: 100,
                            additionalOptions: {
                                useConstantQueryCache: true
                            }
                        })
                            .Then(function (MerchantCategoryCodeToExpenseType) {
                            if (MerchantCategoryCodeToExpenseType.length === 1) {
                                if (MerchantCategoryCodeToExpenseType[0].ExpenseType__ || MerchantCategoryCodeToExpenseType[0].Template__) {
                                    if (MerchantCategoryCodeToExpenseType[0].Template__) {
                                        return MerchantCategoryCodeToExpenseType[0].Template__;
                                    }
                                    else if (MerchantCategoryCodeToExpenseType[0].ExpenseType__) {
                                        return GetTemplateFromExpenseType(MerchantCategoryCodeToExpenseType[0].ExpenseType__, companyCode_1);
                                    }
                                }
                            }
                            else if (MerchantCategoryCodeToExpenseType.length === 0) {
                                // MCC is unknown to us
                                return "";
                            }
                            else {
                                throw "Result of query on Merchant code category with couple [MCC, CC] [".concat(MCC, ",").concat(companyCode_1, "] has more than one result, result length: ").concat(MerchantCategoryCodeToExpenseType.length);
                            }
                        })
                            .Catch(function (reason) {
                            if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                                Log.Error("[Transaction] << GetTemplateFromMCCOrExpenseType. An error occured while querying MCC to Expense type: ".concat(reason));
                            }
                            return "";
                        });
                    }
                    return Sys.Helpers.Promise.Resolve("");
                }
                Server.GetTemplateFromMCCOrExpenseType = GetTemplateFromMCCOrExpenseType;
                /**
                 * Returns the template name from table "P2P - Expense type__"
                 * returns "" if the expense type is not found
                 */
                function GetTemplateFromExpenseType(expenseType, companyCode) {
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotEqual("CompanyCode__", "*")), Sys.Helpers.LdapUtil.FilterEqual("Name__", expenseType));
                    return Sys.GenericAPI.PromisedQuery({
                        table: "P2P - Expense type__",
                        attributes: ["Name__", "Template__"],
                        filter: filter.toString(),
                        maxRecords: 100,
                        additionalOptions: {
                            useConstantQueryCache: true
                        }
                    })
                        .Then(function (ExpenseTypeToTemplate) {
                        if (ExpenseTypeToTemplate.length === 0) {
                            Log.Warn("[GetTemplateFromExpenseType] No template found for ExpenseType__=\"".concat(expenseType, "\" and CompanyCode__=\"").concat(companyCode, "\""));
                            return "";
                        }
                        else if (ExpenseTypeToTemplate.length === 1) {
                            if (ExpenseTypeToTemplate[0].Template__) {
                                return ExpenseTypeToTemplate[0].Template__;
                            }
                            return "";
                        }
                        throw "Result of query on Expense type with couple [Exp_type, CC] [".concat(expenseType, ",").concat(companyCode, "] doesn't have only 1 result, result length: ").concat(ExpenseTypeToTemplate.length);
                    })
                        .Catch(function (reason) {
                        if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                            Log.Error("[Transaction] << GetTemplateFromMCCOrExpenseType. An error occured while querying Expense type to Template: ".concat(reason));
                        }
                        return "";
                    });
                }
                function InitTransactionCreationMode(item) {
                    return GetMatchingExpensesForTransaction(item.GetValue("TransactionDate__"), item.GetValue("LocalAmount__"), item.GetValue("LocalCurrencyCode__"), Data.GetValue("OwnerId"))
                        .Then(function (expenseList) {
                        Log.Info("[InitTransactionCreationMode] Found ".concat(expenseList.length, " matching expense for transaction ").concat(item.GetValue("TransactionID__")));
                        if (expenseList.length == 1) {
                            item.SetValue("ExpenseCreationMode__", Lib.Expense.Transaction.ExpenseCreationMode.Existing);
                            AssociateTransactionWithExpense(item, expenseList[0]);
                        }
                        else {
                            item.SetValue("ExpenseCreationMode__", Lib.Expense.Transaction.ExpenseCreationMode.New);
                        }
                    });
                }
                Server.InitTransactionCreationMode = InitTransactionCreationMode;
                function AssociateTransactionWithExpense(transactionItem, expense) {
                    transactionItem.SetValue("ExpenseNumber__", expense.ExpenseNumber__);
                    Transaction.ShowConsistencyWarnings(transactionItem, expense);
                }
                /**
                 * Returns a list of expenses matching the transaction on date, amount and currency
                 * returns [] if 0 matching expense are found
                 */
                function GetMatchingExpensesForTransaction(date, amount, currency, userDn) {
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Date__", Sys.Helpers.Date.Date2DBDate(date)), Sys.Helpers.LdapUtil.FilterEqual("TotalAmount__", amount.toString()), Sys.Helpers.LdapUtil.FilterEqual("TotalAmountCurrency__", currency), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterExist("Template__"), Sys.Helpers.LdapUtil.FilterEqual("Template__", "")), Sys.Helpers.LdapUtil.FilterEqual("OriginalOwnerId", userDn), Sys.Helpers.LdapUtil.FilterStrictlyLesser("State", "200"));
                    return Sys.GenericAPI.PromisedQuery({
                        table: "CDNAME#Expense",
                        attributes: ["ExpenseNumber__", "ExpenseType__", "Template__"],
                        filter: filter.toString(),
                        maxRecords: 100
                    })
                        .Catch(function (reason) {
                        if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                            Log.Error("[Transaction] << GetMatchingExpensesForTransaction. An error occured while querying matching expense: ".concat(reason));
                        }
                        return [];
                    });
                }
                function InitExpenseFromTransactionTechnicalData() {
                    Log.Info("[Transactions.InitExpenseFromTransactionTechnicalData");
                    var dataFromTransaction = Sys.TechnicalData.GetValue("autoCompleteFromTransactionEmployee");
                    var alreadyDone = Sys.TechnicalData.GetValue("autoCompleteFromTransactionUsed");
                    if (dataFromTransaction && !alreadyDone) {
                        var description_1 = [];
                        Data.SetValue("TotalAmountCurrency__", dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.LocalCurrencyCode__);
                        Data.SetValue("TotalAmount__", dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.LocalAmount__);
                        Data.SetValue("Date__", dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.TransactionDate__);
                        Data.SetValue("Vendor__", dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.MerchantName__);
                        Data.SetValue("CreatedFromBankStatement__", true);
                        Data.SetValue("TransactionId__", dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.TransactionID__);
                        var MCC_1 = dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.MerchantCategory__;
                        if (MCC_1) {
                            var filterParts = [];
                            var companyCode_2 = Data.GetValue("CompanyCode__");
                            var filterCC_1 = Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode_2), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotEqual("CompanyCode__", "*"));
                            filterParts.push(filterCC_1);
                            filterParts.push(Sys.Helpers.LdapUtil.FilterEqual("MerchantCodeCategory__", MCC_1));
                            Sys.GenericAPI.PromisedQuery({
                                table: "P2P - MerchantCategoryCodeToExpenseType__",
                                attributes: ["ExpenseType__", "Template__"],
                                filter: "(&".concat(filterParts.join(""), ")"),
                                maxRecords: 100
                            })
                                .Then(function (MerchantCategoryCodeToExpenseType) {
                                if (MerchantCategoryCodeToExpenseType.length === 1) {
                                    if (MerchantCategoryCodeToExpenseType[0].ExpenseType__ || MerchantCategoryCodeToExpenseType[0].Template__) {
                                        var filterPartsQueryExpenseType = [];
                                        filterPartsQueryExpenseType.push(filterCC_1);
                                        if (MerchantCategoryCodeToExpenseType[0].ExpenseType__) {
                                            filterPartsQueryExpenseType.push(Sys.Helpers.LdapUtil.FilterEqual("Name__", MerchantCategoryCodeToExpenseType[0].ExpenseType__));
                                        }
                                        else if (MerchantCategoryCodeToExpenseType[0].Template__) {
                                            filterPartsQueryExpenseType.push(Sys.Helpers.LdapUtil.FilterEqual("Template__", MerchantCategoryCodeToExpenseType[0].Template__));
                                        }
                                        Lib.Expense.FindExpenseType({
                                            filter: "(&".concat(filterPartsQueryExpenseType.join(""), ")")
                                        }).Then(SelectExpenseType);
                                        description_1.push(Data.GetValue("Description__"));
                                    }
                                }
                                else {
                                    throw "Result of query on Merchant code category with couple [MCC, CC] [" + MCC_1 + "," + companyCode_2 + "] doesn't have only 1 result, result length : " + MerchantCategoryCodeToExpenseType.length;
                                }
                            })
                                .Catch(function (reason) {
                                if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                                    Log.Error("[Transaction] << InitExpenseFromTransactionTechnicalData. An error occured while querying MCC to Expense type: ".concat(reason));
                                }
                                return [];
                            });
                        }
                        description_1.push(dataFromTransaction === null || dataFromTransaction === void 0 ? void 0 : dataFromTransaction.TransactionDescription__);
                        Data.SetValue("Description__", description_1.filter(function (word) { return word.trim(); }).join("\n"));
                        Sys.TechnicalData.SetValue("autoCompleteFromTransactionUsed", true);
                    }
                }
                Server.InitExpenseFromTransactionTechnicalData = InitExpenseFromTransactionTechnicalData;
                function SelectExpenseType(expenseTypeItems) {
                    Log.Info("[Transaction.SelectExpenseType] >> SelectExpenseType, expense type items found: ".concat(expenseTypeItems.length));
                    if (expenseTypeItems.length === 0) {
                        Log.Verbose("[Transaction.SelectExpenseType] no expense type matching the returned template");
                    }
                    else if (expenseTypeItems.length === 1) {
                        Log.Verbose("[Transaction.SelectExpenseType] one expense type returned by our query");
                        Data.SetValue("ExpenseType__", expenseTypeItems[0].Name__);
                        Lib.Expense.OnSelectExpenseTypeItem(expenseTypeItems[0]);
                    }
                    else {
                        Log.Verbose("[Transaction.SelectExpenseType] several expense types returned by our query");
                        var expenseTypes = expenseTypeItems.map(function (item) { return item.Name__; });
                        // A voir si on veut créer le notre pour les transactions
                        Lib.Expense.AIForExpenses.SetLastSuggestedExpenseTypes(expenseTypes);
                    }
                }
                Server.SelectExpenseType = SelectExpenseType;
                function sortTransactionsByDate(a, b) {
                    if (a.ParsedTransactionDate__.getTime() === b.ParsedTransactionDate__.getTime()) {
                        return 0;
                    }
                    return a.ParsedTransactionDate__.getTime() < b.ParsedTransactionDate__.getTime() ? 1 : -1;
                }
                function SendNotificationToEmployee(employeeLogin, emailNotification) {
                    Log.Info("[Server.SendNotificationToEmployee] with employeeLogin: ".concat(employeeLogin));
                    var toUser = Users.GetUserAsProcessAdmin(employeeLogin);
                    var template = "Transaction_Email_NotifEmployeeTransactionCreation_V2_XX.htm";
                    var fromName = "_EskerExpenseManagement";
                    var accountLogo = emailNotification.accountLogo;
                    var customTags = {
                        AccountLogo: accountLogo,
                        DisplayName: toUser.GetValue("DisplayName")
                    };
                    var options = {
                        backupUserAsCC: true,
                        sendToAllMembersIfGroup: false
                    };
                    Sys.EmailNotification.SendEmailNotificationWithUser(toUser, null, template, customTags, fromName, null, options);
                }
                Server.SendNotificationToEmployee = SendNotificationToEmployee;
            })(Server = Transaction.Server || (Transaction.Server = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
