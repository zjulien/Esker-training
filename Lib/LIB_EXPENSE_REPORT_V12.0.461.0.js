///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Report_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Expense Report library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Expense_Report_Export_V12.0.461.0",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Synchronizer",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_LdapUtil",
    "[Sys/Sys_Helpers_Controls]",
    "Lib_P2P_Export_V12.0.461.0",
    "Lib_P2P_CompanyCodesValue_V12.0.461.0",
    "Lib_Expense_Report_TaxesComputations_V12.0.461.0",
    "[Lib_Expense_Report_Customization_Common]",
    "[Lib_Expense_Report_Customization_Server]"
  ]
}*/
/// <reference path="../../Expense/Expense Report/typings/Controls_Expense_Report/index.d.ts"/>
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Report;
        (function (Report) {
            var g = Sys.Helpers.Globals;
            var gc = g.Controls;
            var expenseMapping = {
                "ExpenseMSNEX__": "MSNEX",
                "ExpenseNumber__": "ExpenseNumber__",
                "Date__": "Date__",
                "ExpenseType__": "ExpenseType__",
                "ExpenseDescription__": "Description__",
                "VendorName__": "Vendor__",
                "LocalAmount__": "LocalAmount__",
                "Amount__": "TotalAmount__",
                "Currency__": "TotalAmountCurrency__",
                "CurrencyRate__": "ExchangeRate__",
                "CompanyCode__": "CompanyCode__",
                "GLAccount__": "GLAccount__",
                "Refundable__": "Refundable__",
                "CostCenterId__": "CostCenterId__",
                "ProjectCode__": "ProjectCode__",
                "Billable__": "Billable__",
                "OriginalOwnerId__": "OriginalOwnerId",
                "OwnerName__": "OwnerName__",
                "ReimbursableLocalAmount__": "ReimbursableLocalAmount__",
                "NonReimbursableLocalAmount__": "NonReimbursableLocalAmount__",
                "CreatedFromBankStatement__": "CreatedFromBankStatement__"
            };
            function GetExpenseFieldsMapping() {
                return Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Common.CustomizeExpenseFieldsMapping", expenseMapping) || expenseMapping;
            }
            Report.GetExpenseFieldsMapping = GetExpenseFieldsMapping;
            function GetExpenseFieldsName() {
                var returnMapping = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Common.CustomizeExpenseFieldsMapping", expenseMapping) || expenseMapping;
                return Sys.Helpers.Object.Values(returnMapping);
            }
            Report.GetExpenseFieldsName = GetExpenseFieldsName;
            function SetExpenseTableLine(rowItem, dbItem) {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var returnMapping = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Common.CustomizeExpenseFieldsMapping", expenseMapping) || expenseMapping;
                    Sys.Helpers.Object.ForEach(returnMapping, function (expenseFieldName, expenseReportFieldName) {
                        rowItem.SetValue(expenseReportFieldName, dbItem.GetValue(expenseFieldName) || "");
                    });
                    var expenseStatus = dbItem.GetValue("ExpenseStatus__");
                    if (Lib.Expense.IsDraftExpense(expenseStatus)) {
                        rowItem.SetError("ExpenseNumber__", "_Item in draft", expenseStatus);
                    }
                    else if (Sys.Helpers.IsEmpty(rowItem.GetWarning("ExpenseNumber__")) && !IsValidExpenseTaxAmount(dbItem)) {
                        rowItem.SetWarning("ExpenseNumber__", "_Warning tax amount expense report");
                    }
                    resolve();
                });
            }
            Report.SetExpenseTableLine = SetExpenseTableLine;
            function GetExpenseItemsCompanyCode() {
                var table = Data.GetTable("ExpensesTable__");
                var count = table.GetItemCount();
                return count > 0 ? table.GetItem(0).GetValue("CompanyCode__") : "";
            }
            Report.GetExpenseItemsCompanyCode = GetExpenseItemsCompanyCode;
            function GetExpenseItemsOriginalOwnerId() {
                if (Data.GetValue("state")) {
                    return Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OriginalOwnerId"));
                }
                if (Data.GetValue("User__")) {
                    return Data.GetValue("User__");
                }
                var table = Data.GetTable("ExpensesTable__");
                var count = table.GetItemCount();
                return count > 0 ? Sys.Helpers.String.ExtractLoginFromDN(table.GetItem(0).GetValue("OriginalOwnerId__")) : Data.GetValue("User__");
            }
            Report.GetExpenseItemsOriginalOwnerId = GetExpenseItemsOriginalOwnerId;
            function GetReimbursableAmount(row) {
                if (row.GetValue("ReimbursableLocalAmount__")) {
                    return row.GetValue("ReimbursableLocalAmount__");
                }
                else if (!row.GetValue("NonReimbursableLocalAmount__") && row.GetValue("Refundable__")) {
                    // ReimbursableLocalAmount__ and NonReimbursableLocalAmount__ are null (they can't be both at 0), expense report has been created before S207
                    // we use Refundable__ and LocalAmount__ for compatibility
                    return row.GetValue("LocalAmount__");
                }
                // Non refundable expense
                return 0;
            }
            Report.GetReimbursableAmount = GetReimbursableAmount;
            function UpdateAndCheckLines() {
                var table = Data.GetTable("ExpensesTable__");
                var count = table.GetItemCount();
                // Compute amount, check company code and currency of each line
                var cc_currency = Data.GetValue("CC_Currency__");
                var allExpensesInCCCurrency = true;
                var totalAmount = 0, refundableAmount = 0;
                var allCompanyCodeColumnsWithoutError = true;
                var allOriginalOwnerIdColumnsWithoutError = true;
                var companyCode = GetExpenseItemsCompanyCode();
                var originalOwnerId = GetExpenseItemsOriginalOwnerId();
                var reportCreationGroupingKey = Sys.Parameters.GetInstance("Expense").GetParameter("ReportCreationGroupingKey");
                var _loop_1 = function (i) {
                    var row = table.GetItem(i);
                    allExpensesInCCCurrency = allExpensesInCCCurrency && row.GetValue("Currency__") === cc_currency;
                    if (row.GetValue("CompanyCode__") === companyCode) {
                        totalAmount += row.GetValue("LocalAmount__");
                        refundableAmount += GetReimbursableAmount(row);
                        // Reset error
                        row.SetError("CompanyCode__", "");
                    }
                    else {
                        // Different company code, not allowed
                        row.SetError("CompanyCode__", "_Please remove this line as his company code in not the one used in this report");
                        allCompanyCodeColumnsWithoutError = false;
                    }
                    if (Sys.Helpers.IsEmpty(row.GetValue("CurrencyRate__"))) {
                        // No exchange rate defined between the expense currency and the company code currency
                        row.SetError("Currency__", "_This currency is not defined for the company code '{0}'", Data.GetValue("CompanyCode__"));
                    }
                    else {
                        row.SetError("Currency__", "");
                    }
                    if (Sys.Helpers.String.ExtractLoginFromDN(row.GetValue("OriginalOwnerId__")) === originalOwnerId) {
                        // Reset error
                        row.SetError("OwnerName__", "");
                    }
                    else {
                        // Different original owner id
                        row.SetError("OwnerName__", "_Please remove this line as his original owner in not the one used in this report");
                        allOriginalOwnerIdColumnsWithoutError = false;
                    }
                    if (!row.GetError("CompanyCode__") && !row.GetError("OwnerName__")) {
                        if (Sys.Helpers.IsString(reportCreationGroupingKey)) {
                            reportCreationGroupingKey = reportCreationGroupingKey.split(";");
                        }
                        if (Sys.Helpers.IsArray(reportCreationGroupingKey)) {
                            var returnMapping_1 = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Common.CustomizeExpenseFieldsMapping", expenseMapping) || expenseMapping;
                            reportCreationGroupingKey.forEach(function (groupingKey) {
                                Sys.Helpers.Object.ForEach(returnMapping_1, function (expenseFieldName, expenseReportFieldName) {
                                    if (groupingKey == expenseFieldName) {
                                        if (row.GetValue(expenseReportFieldName) != table.GetItem(0).GetValue(expenseReportFieldName)) {
                                            row.SetError(expenseReportFieldName, "_Please remove this line as this value is different from the reference");
                                        }
                                        else {
                                            row.SetError(expenseReportFieldName, "");
                                        }
                                    }
                                });
                            });
                            reportCreationGroupingKey.forEach(function (element) {
                                if (row.GetValue(element) != table.GetItem(0).GetValue(element)) {
                                    row.SetError(element, "_Please remove this line as this value is different from the reference");
                                }
                                else {
                                    row.SetError(element, "");
                                }
                            });
                        }
                    }
                };
                for (var i = 0; i < count; i++) {
                    _loop_1(i);
                }
                if (Sys.ScriptInfo.IsClient()) {
                    // Show original amount column only when at least one expense is not in the same currency as the company code
                    gc.ExpensesTable__.Amount__.Hide(allExpensesInCCCurrency);
                    gc.ExpensesTable__.Currency__.Hide(allExpensesInCCCurrency);
                    // Show company code column only when there is an error on the column
                    gc.ExpensesTable__.CompanyCode__.Hide(allCompanyCodeColumnsWithoutError);
                    // Show header company code only when there is an error
                    if (Sys.Helpers.IsEmpty(Data.GetValue("CompanyCode__"))) {
                        gc.CompanyCode__.SetError("_No company code has been configured for your user. Please contact your administrator.");
                        gc.CompanyCode__.Hide(false);
                    }
                    else {
                        gc.CompanyCode__.SetError("");
                        gc.CompanyCode__.Hide(true);
                    }
                    // Show original owner only when there is an error on the column
                    gc.ExpensesTable__.OwnerName__.Hide(allOriginalOwnerIdColumnsWithoutError);
                    if (!Data.GetValue("State")) {
                        g.ProcessInstance.CreateOnBehalfOf(originalOwnerId);
                    }
                }
                Data.SetValue("TotalAmount__", totalAmount);
                Data.SetValue("RefundableAmount__", refundableAmount);
                Data.SetValue("NonRefundableAmount__", totalAmount - refundableAmount);
                return allCompanyCodeColumnsWithoutError;
            }
            Report.UpdateAndCheckLines = UpdateAndCheckLines;
            function LoadCompanyCodesValue(forceReloadConfiguration) {
                if (forceReloadConfiguration === void 0) { forceReloadConfiguration = false; }
                var companyCode = Data.GetValue("CompanyCode__");
                return Lib.P2P.CompanyCodesValue.QueryValues(companyCode, true)
                    .Then(function (CCValues) {
                    if (Object.keys(CCValues).length <= 0) {
                        Data.SetError("CompanyCode__", "_This CompanyCode does not exist in the table.");
                    }
                    if (Sys.Helpers.IsEmpty(CCValues.Currency__)) {
                        Lib.CommonDialog.NextAlert.Define("_No currency error title", "_No currency has been defined for this CompanyCode.", { isError: true });
                        Data.SetValue("CC_Currency__", "");
                    }
                    else if (!CCValues.currencies.IsDefined(CCValues.Currency__)) {
                        Lib.CommonDialog.NextAlert.Define("_Invalid currency error title", "_Invalid currency has been defined for this CompanyCode.", { isError: true });
                        Data.SetValue("CC_Currency__", "");
                    }
                    else {
                        Data.SetValue("CC_Currency__", CCValues.Currency__);
                    }
                    if (Sys.Helpers.IsEmpty(Data.GetValue("ExpenseReportTypeID__"))) {
                        Data.SetValue("ExpenseReportTypeID__", CCValues.DefaultExpenseReportType__);
                    }
                    if (Sys.Helpers.IsEmpty(Variable.GetValueAsString("Configuration")) || forceReloadConfiguration) {
                        Variable.SetValueAsString("Configuration", CCValues.DefaultConfiguration__);
                        return Lib.Expense.ChangeConfiguration(CCValues.DefaultConfiguration__);
                    }
                    return Sys.Helpers.Promise.Resolve();
                });
            }
            Report.LoadCompanyCodesValue = LoadCompanyCodesValue;
            function SetHeaderFields() {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var table = Data.GetTable("ExpensesTable__");
                    var needResolve = 1;
                    function _resolve() {
                        if (--needResolve === 0) {
                            resolve();
                        }
                    }
                    if (table.GetItemCount() > 0) {
                        var rowItem = table.GetItem(0);
                        if (Data.GetValue("CompanyCode__") !== rowItem.GetValue("CompanyCode__")) {
                            Data.SetValue("CompanyCode__", rowItem.GetValue("CompanyCode__"));
                            ++needResolve;
                            LoadCompanyCodesValue(/* forceReloadConfiguration: */ true)
                                .Then(function () {
                                _resolve();
                            });
                        }
                        if (Sys.Helpers.IsEmpty(Data.GetValue("User__"))) {
                            var firstLineUserLogin = Sys.Helpers.String.ExtractLoginFromDN(rowItem.GetValue("OriginalOwnerId__"));
                            if (Sys.Helpers.IsEmpty(firstLineUserLogin) || Sys.Helpers.IsEmpty(rowItem.GetValue("OwnerName__"))) {
                                //In case of migration, some old Expenses can have an empty OriginalOwnerId or OwnerName__
                                if (Sys.ScriptInfo.IsClient()) {
                                    Data.SetValue("User__", g.User.loginId);
                                    Data.SetValue("UserName__", g.User.fullName);
                                }
                                else {
                                    //Server side: Do nothing for now
                                }
                            }
                            else {
                                Data.SetValue("User__", firstLineUserLogin);
                                Data.SetValue("UserName__", rowItem.GetValue("OwnerName__"));
                            }
                            ++needResolve;
                            Lib.P2P.UserProperties.QueryValues(Data.GetValue("User__"))
                                .Then(function (UserPropertiesValues) {
                                Data.SetValue("UserNumber__", UserPropertiesValues.UserNumber__);
                                _resolve();
                            });
                        }
                    }
                    _resolve();
                });
            }
            Report.SetHeaderFields = SetHeaderFields;
            function SetHeaderDependentTableLineFields() {
                var companyCode = Data.GetValue("CompanyCode__");
                return Lib.P2P.CompanyCodesValue.QueryValues(companyCode, true)
                    .Then(function (CCValues) {
                    Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (rowItem /*, i*/) {
                        rowItem.SetValue("LocalCurrency__", CCValues.Currency__);
                        rowItem.SetValue("CurrencyRate__", rowItem.GetValue("CurrencyRate__") || CCValues.currencies.GetRate(rowItem.GetValue("Currency__")));
                        rowItem.SetValue("LocalAmount__", rowItem.GetValue("LocalAmount__") || CCValues.currencies.GetRate(rowItem.GetValue("Currency__")) * rowItem.GetValue("Amount__"));
                    });
                });
            }
            Report.SetHeaderDependentTableLineFields = SetHeaderDependentTableLineFields;
            function IsLineEmpty(rowItem) {
                return Sys.Helpers.IsEmpty(rowItem.GetValue("ExpenseMSNEX__"));
            }
            Report.IsLineEmpty = IsLineEmpty;
            function RemoveLine(row) {
                if (typeof row.Remove === "undefined") {
                    row.RemoveItem();
                }
                else {
                    row.Remove();
                }
            }
            Report.RemoveLine = RemoveLine;
            function RemoveEmptyLine() {
                var table = Data.GetTable("ExpensesTable__");
                for (var i = 0; i < table.GetItemCount(); i++) {
                    var row = table.GetItem(i);
                    if (IsLineEmpty(row)) {
                        RemoveLine(row);
                    }
                }
            }
            Report.RemoveEmptyLine = RemoveEmptyLine;
            /*
            * Return true if updated
            */
            function CheckFieldsUpdated(rowItem, dbItem, tableExpense) {
                return dbItem.GetValue("LastSavedDateTime") > Data.GetValue("LastSavedDateTime");
                /*
                        let returnMapping = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Common.CustomizeExpenseFieldsMapping", expenseMapping) || expenseMapping;
                        let dbFields = Sys.Helpers.Object.Values(returnMapping);
                        let rowFields = Object.keys(returnMapping);

                        for (let i = 0; rowFields.length == dbFields.length && i < rowFields.length; i++)
                        {
                            // Compatibility : do not check if the value changed for fields LocalAmount__ and ExchangeRate__ when the value is null in the expense
                            if (!!dbFields[i] && !(Sys.Helpers.IsEmpty(dbItem.GetValue(dbFields[i])) && (dbFields[i] === "LocalAmount__" || dbFields[i] === "ExchangeRate__")))
                            {
                                if (!Sys.Helpers.Controls.CompareWithString(rowItem.GetValue(rowFields[i]), tableExpense[rowFields[i]].GetType(), dbItem.GetValue(dbFields[i])))
                                {
                                    return true;
                                }
                            }
                        }
                        return false;
                */
            }
            Report.CheckFieldsUpdated = CheckFieldsUpdated;
            function IsValidExpenseTaxAmount(item) {
                if (item.GetValue("InputTaxRate__") === "1") {
                    var hasAtleastOneTaxAmount = false;
                    var taxLines = [];
                    for (var i = 1; i <= 5; i++) {
                        if (!Sys.Helpers.IsEmpty(item.GetValue("TaxCode" + i + "__")) && !Sys.Helpers.IsEmpty(item.GetValue("TaxAmount" + i + "__"))) {
                            hasAtleastOneTaxAmount = true;
                            break;
                        }
                    }
                    if (hasAtleastOneTaxAmount) {
                        for (var i = 1; i <= 5; i++) {
                            if (!Sys.Helpers.IsEmpty(item.GetValue("TaxCode" + i + "__"))) {
                                var taxAmount = item.GetValue("TaxAmount" + i + "__");
                                var taxRate = item.GetValue("TaxRate" + i + "__");
                                taxLines.push({
                                    taxAmount: taxAmount ? taxAmount : 0,
                                    taxCode: item.GetValue("TaxCode" + i + "__"),
                                    taxRate: taxRate ? taxRate : 0
                                });
                            }
                        }
                        return Lib.Expense.Report.TaxesComputations.ComputeNetAmounts(taxLines, item.GetValue("TotalAmount__")) == Lib.Expense.Report.TaxesComputations.BalanceNetAmountsErrorCode.Success;
                    }
                }
                return true;
            }
            function FillExpensesTable(expensesList) {
                var expMSNEX = [];
                var table = Data.GetTable("ExpensesTable__");
                var nItems = table.GetItemCount();
                if (nItems > 0) {
                    Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (item /*, i*/) {
                        expMSNEX.push(item.GetValue("ExpenseMSNEX__"));
                    });
                }
                else {
                    Sys.Helpers.Array.ForEach(Sys.Helpers.IsDefined(expensesList) ? expensesList : g.ProcessInstance.selectedRuidFromView, function (ruid) {
                        var msnex = ruid.split(".")[1];
                        expMSNEX.push(msnex);
                    });
                    table.SetItemCount(expMSNEX.length);
                }
                var filter = "(MSNEX[=](" + expMSNEX.join(",") + "))";
                var attributesExpense = [
                    "ExpenseStatus__",
                    "ExpenseReportMsnEx__",
                    "InputTaxRate__",
                    "TaxAmount1__",
                    "TaxRate1__",
                    "TaxCode1__",
                    "TaxAmount2__",
                    "TaxRate2__",
                    "TaxCode2__",
                    "TaxAmount3__",
                    "TaxRate3__",
                    "TaxCode3__",
                    "TaxAmount4__",
                    "TaxRate4__",
                    "TaxCode4__",
                    "TaxAmount5__",
                    "TaxRate5__",
                    "TaxCode5__",
                    "ExpenseNumber__"
                ];
                var dbFields = GetExpenseFieldsName().concat(attributesExpense);
                dbFields.forEach(function (field, index) {
                    if (!field) {
                        dbFields.splice(index, 1);
                    }
                });
                var globalPromise = Sys.Helpers.Promise.Create(function (globalPromiseResolve, globalPromiseReject) {
                    dbFields.push("LastSavedDateTime");
                    Sys.GenericAPI.Query("CDNAME#Expense", filter, dbFields, function (results, error) {
                        var _a;
                        if (error) {
                            globalPromiseReject(error);
                            return;
                        }
                        var tableLinePromises = [];
                        var myMsnEx = Data.GetValue("MsnEx");
                        var backMSNEX = ((_a = Process === null || Process === void 0 ? void 0 : Process.GetURLParameter) === null || _a === void 0 ? void 0 : _a.call(Process, "backmsnex")) || "";
                        Data.SetValue("TotalAmount__", 0);
                        Data.SetValue("RefundableAmount__", 0);
                        Data.SetValue("NonRefundableAmount__", 0);
                        Sys.Helpers.Array.ForEach(results, function (result) {
                            var rowId = expMSNEX.indexOf(result.GetValue("MSNEX"));
                            var rowItem = table.GetItem(rowId);
                            if (nItems > 0) {
                                var expenseStatus = result.GetValue("ExpenseStatus__");
                                if (!Lib.Expense.IsExpenseSubmittable(expenseStatus)) {
                                    if (result.GetValue("ExpenseReportMsnEx__") !== myMsnEx) // ignore expense sent by me
                                     {
                                        var expenseNumber = result.GetValue("ExpenseNumber__");
                                        Log.Error("Expense with number: ".concat(expenseNumber, " is not submittable, status: ").concat(expenseStatus));
                                        rowItem.SetError("ExpenseNumber__", Lib.Expense.IsDraftExpense(expenseStatus) ? "_Item in draft" : "_Item no longer sendable", expenseStatus);
                                    }
                                }
                                else if (Sys.Helpers.IsEmpty(backMSNEX) || result.GetValue("MSNEX") == backMSNEX) {
                                    var validTaxAmount = IsValidExpenseTaxAmount(result);
                                    var warningMessage = rowItem.GetWarning("ExpenseNumber__") === Language.Translate("_Ownership on item cannot be taken") ? "_Ownership on item cannot be taken" : !validTaxAmount ? "_Warning tax amount expense report" : "";
                                    var updated = CheckFieldsUpdated(rowItem, result, gc === null || gc === void 0 ? void 0 : gc.ExpensesTable__);
                                    rowItem.SetWarning("ExpenseNumber__", updated ? "_Item has been updated" : warningMessage);
                                }
                            }
                            tableLinePromises.push(SetExpenseTableLine(rowItem, result));
                        });
                        Sys.Helpers.Promise.All(tableLinePromises)
                            .Then(SetHeaderFields)
                            .Then(SetHeaderDependentTableLineFields)
                            .Then(function () {
                            UpdateAndCheckLines();
                            globalPromiseResolve();
                        })
                            .Catch(function (reason) { return globalPromiseReject(reason); });
                    }, null, 100, { recordBuilder: Sys.GenericAPI.BuildQueryResult });
                });
                return globalPromise;
            }
            Report.FillExpensesTable = FillExpensesTable;
            function IsRefundable() {
                // Get the Refundable column from the expenses table
                var expenseReportIsRefundable = false;
                Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (line) {
                    expenseReportIsRefundable = expenseReportIsRefundable || GetReimbursableAmount(line) > 0;
                });
                Log.Info("Lib.Expense.Report.IsRefundable: ".concat(expenseReportIsRefundable));
                return expenseReportIsRefundable;
            }
            Report.IsRefundable = IsRefundable;
            function SplitTotalAmount() {
                var refundableAmount = 0, nonRefundableAmount = 0;
                Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (line) {
                    var itemRefundableAmount = GetReimbursableAmount(line);
                    refundableAmount += itemRefundableAmount;
                    nonRefundableAmount += line.GetValue("LocalAmount__") - itemRefundableAmount;
                });
                return {
                    "refundable": refundableAmount,
                    "nonRefundable": nonRefundableAmount
                };
            }
            Report.SplitTotalAmount = SplitTotalAmount;
            Report.GetExpenseNumbersInForm = function () {
                Log.Info("Getting expense numbers in form...");
                var allExpenses = [];
                Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (line) {
                    var expenseNumber = line.GetValue("ExpenseNumber__");
                    allExpenses.push(expenseNumber);
                });
                Log.Info("Returns: ".concat(allExpenses.join(", ")));
                return allExpenses;
            };
            Report.GetExpensesFilter = function (expenseNumbers) {
                Log.Info("Getting expenses filter...");
                var expenseItemsFilter = "(|";
                Sys.Helpers.Object.ForEach(expenseNumbers, function (expenseNumber) {
                    expenseItemsFilter += "(ExpenseNumber__=".concat(expenseNumber, ")");
                });
                expenseItemsFilter += ")";
                Log.Info("Returns: ".concat(expenseItemsFilter));
                return expenseItemsFilter;
            };
            /**
             * CLIENT ONLY
             */
            Report.TopMessageWarning = Sys.ScriptInfo.IsClient() ? Lib.P2P.TopMessageWarning(gc.TopPaneWarning, gc.TopMessageWarning__) : null;
            /**
             * CLIENT ONLY
             */
            Report.SubmitButtonDisabler = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Controls.ControlDisabler(gc.SubmitExpenses, true) : null;
            /**
             * CLIENT ONLY
             */
            Report.DeleteButtonDisabler = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Controls.ControlDisabler(gc.DeleteReport) : null;
            /**
             * CLIENT ONLY
             */
            function SetButtonsDisabled(disabled, onlyForSubmitButton) {
                if (Sys.ScriptInfo.IsClient()) {
                    Report.SubmitButtonDisabler.SetDisabled(disabled);
                    if (!onlyForSubmitButton) {
                        Report.DeleteButtonDisabler.SetDisabled(disabled);
                    }
                }
                else {
                    Log.Error("Not Implemented on server side");
                }
            }
            Report.SetButtonsDisabled = SetButtonsDisabled;
            /**
             * CLIENT ONLY
             */
            function IsReadOnly() {
                if (Sys.ScriptInfo.IsClient()) {
                    return !!Sys.Helpers.Globals.ProcessInstance.isReadOnly;
                }
                Log.Error("Not Implemented on server side");
                return null;
            }
            Report.IsReadOnly = IsReadOnly;
            function QueryExpenseReportType(companyCode) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var attributes = ["CompanyCode__", "ID__", "ExpenseReportTypeName__"];
                    Sys.GenericAPI.Query("P2P - Expense report type__", "(" + "CompanyCode__=" + companyCode + ")", attributes, function (result, error) {
                        if (!error) {
                            resolve(result);
                        }
                        else {
                            resolve(error);
                        }
                    }, "", 100, "EnableJoin=1");
                });
            }
            Report.QueryExpenseReportType = QueryExpenseReportType;
            function QueryExpenses(context, simulateMissingExpenses) {
                if (Sys.ScriptInfo.IsClient()) {
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        Log.Info("Querying expenses...");
                        var expenses = context.expenses = [];
                        var notOrderedExpenses = [];
                        Sys.GenericAPI.Query("CDNAME#Expense", Lib.Expense.Report.GetExpensesFilter(context.expenseNumbers), ["*"], function (result, error) {
                            if (!error) {
                                result.forEach(function (expense) {
                                    // Support upgrade: before S206, expenses haven't ReimbursableLocalAmount__ field, so fill it
                                    if (Sys.Helpers.IsUndefined(expense.REIMBURSABLELOCALAMOUNT__)) {
                                        var refundable = Sys.Helpers.Data.IsTrue(expense.REFUNDABLE__);
                                        expense.REIMBURSABLELOCALAMOUNT__ = refundable ? expense.LOCALAMOUNT__ : "0";
                                        expense.NONREIMBURSABLELOCALAMOUNT__ = refundable ? "0" : expense.LOCALAMOUNT__;
                                    }
                                    notOrderedExpenses[expense.EXPENSENUMBER__] = expense;
                                });
                                //add expenses in the same order as the table
                                context.expenseNumbers.forEach(function (expenseNumber) {
                                    expenses.push(notOrderedExpenses[expenseNumber]);
                                });
                            }
                            else {
                                Log.Error("Query error. Details: ".concat(error));
                                throw new Report.QueryExpensesError();
                            }
                            Log.Info("".concat(expenses.length, " expense(s) found."));
                            if (expenses.length !== context.expenseNumbers.length) {
                                Log.Error("Invalid number of expenses returned. Expected: ".concat(context.expenseNumbers.length));
                                throw new Report.MissingExpensesError();
                            }
                            resolve(context);
                        }, "", context.expenseNumbers.length);
                    });
                }
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Querying expenses...");
                    var expenses = context.expenses = [];
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.SetSpecificTable("CDNAME#Expense");
                    query.SetAttributesList("*");
                    query.SetFilter(Lib.Expense.Report.GetExpensesFilter(context.expenseNumbers));
                    if (!query.MoveFirst()) {
                        Log.Error("Error querying expenses: ".concat(query.GetLastErrorMessage()));
                        throw new Report.QueryExpensesError();
                    }
                    var expense, notOrderedExpenses = [];
                    var cachedCCValues = null;
                    while ((expense = query.MoveNext()) != null) {
                        var vars = expense.GetUninheritedVars();
                        var expenseNumber = vars.GetValue_String("ExpenseNumber__", 0);
                        // Support upgrade: before S175, expenses haven't LocalAmount__ but we need it, so compute it
                        if (!vars.GetNbValues("LocalAmount__")) {
                            var totalAmount = vars.GetValue_Double("TotalAmount__", 0);
                            if (!cachedCCValues) {
                                // Synchronous here
                                Lib.P2P.CompanyCodesValue.QueryValues(vars.GetValue_String("CompanyCode__", 0), true)
                                    // cachedCCValues is used as a cache, so the behaviour warned by ESLint is desired => rule deactivated for this line
                                    // eslint-disable-next-line no-loop-func
                                    .Then(function (CCValues) {
                                    // Store CCValues in single cache as expenses can't be of different company codes
                                    cachedCCValues = CCValues;
                                });
                            }
                            var currencyRate = vars.GetValue_Double("ExchangeRate__", 0) || cachedCCValues.currencies.GetRate(vars.GetValue_String("TotalAmountCurrency__", 0));
                            vars.AddValue_Double("LocalAmount__", currencyRate * totalAmount, true);
                        }
                        // Support upgrade: before S206, expenses haven't ReimbursableLocalAmount__ field, so fill it
                        if (!vars.GetNbValues("ReimbursableLocalAmount__")) {
                            var refundable = Sys.Helpers.Data.IsTrue(vars.GetValue_String("Refundable__", 0));
                            var localAmount = vars.GetValue_Double("LocalAmount__", 0);
                            vars.AddValue_Double("ReimbursableLocalAmount__", refundable ? localAmount : 0, true);
                            vars.AddValue_Double("NonReimbursableLocalAmount__", refundable ? 0 : localAmount, true);
                        }
                        notOrderedExpenses[expenseNumber] = expense;
                        if (simulateMissingExpenses) {
                            break;
                        }
                    }
                    //add expenses in the same order as the table
                    Sys.Helpers.Object.ForEach(context.expenseNumbers, function (expenseNumber) {
                        if (notOrderedExpenses[expenseNumber]) {
                            expenses.push(notOrderedExpenses[expenseNumber]);
                        }
                    });
                    Log.Info("".concat(expenses.length, " expense(s) found."));
                    if (expenses.length !== context.expenseNumbers.length) {
                        Log.Error("Invalid number of expenses returned. Expected: ".concat(context.expenseNumbers.length));
                        throw new Report.MissingExpensesError();
                    }
                    resolve(context);
                });
            }
            Report.QueryExpenses = QueryExpenses;
            Report.QueryExpensesError = function () { };
            Report.MissingExpensesError = function () { };
            Report.AlreadySentExpensesError = function () { };
            Report.LockExpensesError = function () { };
            Report.UpdateExpensesError = function () { };
            Report.CreatingPDFError = function (errorReason) {
                Log.Error(errorReason);
            };
            var lockExpensesTokenPrefix = "EXPR_LCK_";
            var lockExpensesTimeout = 20000;
            /**
             * SERVER ONLY
             */
            function LockExpenses(context) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    if (Sys.ScriptInfo.IsServer()) {
                        Log.Info("Taking ownership on expenses...");
                        var reportMsnEx_1 = Data.GetValue("MsnEx");
                        var errorByNumber_1 = {};
                        context.expenses.forEach(function (expense) {
                            var vars = expense.GetUninheritedVars();
                            var expenseNumber = vars.GetValue_String("ExpenseNumber__", 0);
                            Log.Info("Taking ownership on expense with number: ".concat(expenseNumber));
                            var token = lockExpensesTokenPrefix + reportMsnEx_1;
                            var errorCode = expense.GetAsyncOwnership(token, lockExpensesTimeout);
                            if (errorCode !== 0) {
                                Log.Error("Error on expense, code: ".concat(errorCode, ", message: ").concat(expense.GetLastErrorMessage()));
                                errorByNumber_1[expenseNumber] = true;
                            }
                        });
                        // Any error ?
                        if (!Sys.Helpers.Object.IsEmptyPlainObject(errorByNumber_1)) {
                            Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (line) {
                                var expenseNumber = line.GetValue("ExpenseNumber__");
                                if (expenseNumber in errorByNumber_1) {
                                    line.SetWarning("ExpenseNumber__", "_Ownership on item cannot be taken");
                                }
                            });
                            throw new Report.LockExpensesError();
                        }
                        resolve(context);
                    }
                    else {
                        throw "Not implemented on client side";
                    }
                });
            }
            Report.LockExpenses = LockExpenses;
            /**
             * SERVER ONLY
             */
            function UnlockExpenses(context) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    if (Sys.ScriptInfo.IsServer()) {
                        Log.Info("Releasing ownership on expenses...");
                        var reportMsnEx_2 = Data.GetValue("MsnEx");
                        context.expenses.forEach(function (expense) {
                            var vars = expense.GetUninheritedVars();
                            var expenseNumber = vars.GetValue_String("ExpenseNumber__", 0);
                            Log.Info("Releasing ownership on expense with number: ".concat(expenseNumber));
                            var token = lockExpensesTokenPrefix + reportMsnEx_2;
                            expense.ReleaseAsyncOwnership(token);
                        });
                        resolve(context);
                    }
                    else {
                        throw "Not implemented on client side";
                    }
                });
            }
            Report.UnlockExpenses = UnlockExpenses;
            /**
             * SERVER ONLY
             */
            function CheckExpenseNotAlreadySent(context) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    if (Sys.ScriptInfo.IsServer()) {
                        Log.Info("Checking if expenses can be reported...");
                        var msnEx_1 = Data.GetValue("MsnEx");
                        var errorByNumber_2 = {};
                        context.expenses.forEach(function (expense) {
                            var vars = expense.GetUninheritedVars();
                            var expenseNumber = vars.GetValue_String("ExpenseNumber__", 0);
                            var expenseStatus = vars.GetValue_String("ExpenseStatus__", 0);
                            var expenseReportMsnEx = vars.GetValue_String("ExpenseReportMsnEx__", 0);
                            // ignore expense already sent by me
                            if (expenseReportMsnEx !== msnEx_1) {
                                // check status
                                if (!Lib.Expense.IsExpenseSubmittable(expenseStatus)) {
                                    Log.Error("Expense with number: ".concat(expenseNumber, " is not submittable, status: ").concat(expenseStatus));
                                    errorByNumber_2[expenseNumber] = true;
                                }
                            }
                        });
                        // Any error ?
                        if (!Sys.Helpers.Object.IsEmptyPlainObject(errorByNumber_2)) {
                            Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (line) {
                                var expenseNumber = line.GetValue("ExpenseNumber__");
                                if (expenseNumber in errorByNumber_2) {
                                    line.SetError("ExpenseNumber__", "_Item no longer sendable");
                                }
                            });
                            throw new Report.AlreadySentExpensesError();
                        }
                        resolve(context);
                    }
                    else {
                        throw "Not implemented on client side";
                    }
                });
            }
            Report.CheckExpenseNotAlreadySent = CheckExpenseNotAlreadySent;
            /**
             * SERVER ONLY
             */
            function UpdateExpenses(context, action, actionData, needsToUpdateFn, updateFn) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    if (Sys.ScriptInfo.IsServer()) {
                        var expenseViewer = Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("Expense").GetParameter("ExpenseViewer"));
                        Log.Info("Updating reported expenses with expenseViewer: ".concat(expenseViewer));
                        actionData = __assign(__assign({}, actionData), { expenseViewer: expenseViewer });
                        var actionDataToSerialize_1 = JSON.stringify(actionData);
                        Log.Info("Updating reported expenses with action: ".concat(action, ", actionData: ").concat(actionDataToSerialize_1));
                        context.expenses.forEach(function (expense) {
                            var vars = expense.GetUninheritedVars();
                            var state = vars.GetValue_Long("State", 0);
                            var expenseNumber = vars.GetValue_String("ExpenseNumber__", 0);
                            if (needsToUpdateFn(expense)) {
                                Log.Info("Updating reported expense with number: ".concat(expenseNumber));
                                var externVars = expense.GetExternalVars();
                                externVars.AddValue_String("FromExpenseReport_ActionData", actionDataToSerialize_1, true);
                                if (updateFn) {
                                    updateFn(expense);
                                }
                                var updated = false;
                                if (state === 50) {
                                    var requestedActions = vars.GetValue_String("RequestedActions", 0);
                                    if (requestedActions === "approve|".concat(action)) {
                                        // action here is ignored
                                        expense.Process();
                                        updated = expense.GetLastError() === 0;
                                    }
                                    else {
                                        Log.Error("Cannot update expense due to an unexpected pending action: ".concat(requestedActions));
                                        throw new Report.UpdateExpensesError();
                                    }
                                }
                                else if (state === 70) {
                                    vars.AddValue_String("RequestedActions", "approve|" + action, true);
                                    vars.AddValue_String("NeedValidation", "0", true);
                                    vars.AddValue_Date("LastSavedDateTime", new Date(), true);
                                    vars.AddValue_String("LastSavedOwnerID", Data.GetValue("LastSavedOwnerID") || Data.GetValue("OwnerID"), true);
                                    vars.AddValue_String("LastSavedOwnerPB", Data.GetValue("LastSavedOwnerPB") || Data.GetValue("OwnerPB"), true);
                                    expense.Validate("Expense update triggered by report");
                                    updated = expense.GetLastError() === 0;
                                }
                                else if (state === 90) {
                                    updated = expense.ResumeWithAction(action, false);
                                }
                                else {
                                    Log.Error("Cannot update expense due to an unexpected state: ".concat(state));
                                    throw new Report.UpdateExpensesError();
                                }
                                if (!updated) {
                                    Log.Error("Update error on expense, code: ".concat(expense.GetLastError(), ", message: ").concat(expense.GetLastErrorMessage()));
                                    throw new Report.UpdateExpensesError();
                                }
                            }
                            else {
                                Log.Info("Expense already up to date, with number: ".concat(expenseNumber));
                            }
                        });
                        resolve(context);
                    }
                    else {
                        throw "Not implemented on client side";
                    }
                });
            }
            Report.UpdateExpenses = UpdateExpenses;
            var MergeExpensesToExpenseReport = function (context) {
                var pdfCommands = ["-merge %infile[1]% "];
                var conversionParams = { conversionType: "PDFA-3" };
                context.expenses.forEach(function (expense) {
                    var attaches = expense.GetAttachs(false);
                    var nbAttaches = attaches ? attaches.GetNbAttachs() : 0;
                    for (var i = 0; i < nbAttaches; i++) {
                        var attachIsTechnicalLong = attaches.GetAttach(i).GetVars().GetValue_Long("IsTechnical", 0);
                        if (attachIsTechnicalLong === undefined || attachIsTechnicalLong === 0) {
                            var expenseFile = attaches.GetAttach(i).GetConvertedFile(0);
                            if (expenseFile == null) {
                                expenseFile = attaches.GetAttach(i).GetInputFile(0);
                            }
                            if (expenseFile != null) {
                                Log.Info("Merging file " + expenseFile.GetFileName());
                                if (expenseFile.GetExtension().toLowerCase() !== ".pdf") {
                                    var converted = expenseFile.ConvertFile(conversionParams);
                                    pdfCommands.push(converted);
                                }
                                else {
                                    pdfCommands.push(expenseFile);
                                }
                            }
                            else {
                                Log.Warn("Unable to fetch attachment #" + i);
                            }
                        }
                    }
                });
                if (!Attach.PDFCommands(pdfCommands)) {
                    throw new Report.CreatingPDFError("Error in PDF command : " + pdfCommands);
                }
            };
            var GetAttachTemporaryFileOptions = function (revisionVersion) {
                if (revisionVersion === void 0) { revisionVersion = 0; }
                var name = Lib.P2P.Export.GetName("Expense.Report", "ExpenseReportNumber__", revisionVersion);
                var options = { name: name, attachAsConverted: true };
                // Check if ExpenseReport is already attached
                Log.Info("ExpenseReport revision version: " + revisionVersion);
                if (revisionVersion === 0) {
                    for (var i = Attach.GetNbAttach() - 1; i >= 0; i--) {
                        var type = Attach.GetValue(i, "Expense_DocumentType");
                        if (type === "ExpenseReport") {
                            Log.Info("ExpenseReport already attached: " + i);
                            options.attachIndex = 0;
                        }
                    }
                }
                else {
                    options.attachAsFirst = true;
                }
                return options;
            };
            /**
             * SERVER ONLY
             * @param context IExpensesContext
             */
            function AttachExpenseReportPDF(context, revisionVersion) {
                if (revisionVersion === void 0) { revisionVersion = 0; }
                return Sys.Helpers.Promise.Create(function (resolve) {
                    if (Sys.ScriptInfo.IsServer()) {
                        // First step - Get template file
                        var ExpenseReportTemplateInfos = Lib.Expense.Report.Export.GetExpenseReportTemplateInfos();
                        var user = Lib.P2P.GetValidatorOrOwner();
                        var ExpenseReport_TemplateFile = user.GetTemplateFile(ExpenseReportTemplateInfos.template, ExpenseReportTemplateInfos.escapedCompanyCode);
                        if (ExpenseReport_TemplateFile == null) {
                            throw new Report.CreatingPDFError("Failed to find template file: " + ExpenseReportTemplateInfos.template);
                        }
                        Log.Info("ExpenseReport_TemplateFile used: " + ExpenseReport_TemplateFile.GetFileName());
                        if (ExpenseReportTemplateInfos.fileFormat !== "RPT") // Crystal mode
                         {
                            throw new Report.CreatingPDFError("Error ExpenseReport template file format is not recognized or compatible");
                        }
                        Log.Info("Expense Report template detected as .RPT format");
                        // Generate JSON
                        var jsonFile_1 = g.TemporaryFile.CreateFile("ExpenseReport.json", "utf16");
                        if (!jsonFile_1) {
                            throw new Report.CreatingPDFError("Temporaty file creating failed: ExpenseReport.json");
                        }
                        Lib.Expense.Report.Export.CreateExpenseReportJsonString(context, ExpenseReportTemplateInfos, function (jsonString) {
                            g.TemporaryFile.Append(jsonFile_1, jsonString);
                        });
                        var iAttachExpenseReport = void 0;
                        var pdfFile = jsonFile_1.ConvertFile({ conversionType: "crystal", report: ExpenseReport_TemplateFile });
                        // Third step - Check if error(s) happened with PDF generation
                        if (!pdfFile) {
                            throw new Report.CreatingPDFError("Error converting template to pdf");
                        }
                        if (!Attach.AttachTemporaryFile(pdfFile, GetAttachTemporaryFileOptions(revisionVersion))) {
                            throw new Report.CreatingPDFError("Error creating ExpenseReport attachment");
                        }
                        iAttachExpenseReport = 0;
                        Attach.SetValue(iAttachExpenseReport, "Expense_DocumentType", "ExpenseReport");
                        MergeExpensesToExpenseReport(context);
                        Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Server.OnAttachExpenseReportPDF", iAttachExpenseReport);
                        resolve(context);
                    }
                    else {
                        throw "Not implemented on client side";
                    }
                });
            }
            Report.AttachExpenseReportPDF = AttachExpenseReportPDF;
            /**
             * SERVER ONLY
             */
            function ReviseExportReportPDF(context) {
                var revisionVersion = parseInt(Sys.TechnicalData.GetValue("revisionVersion") || "0", 10) + 1;
                Log.Info("ExpenseReport revision version: " + revisionVersion);
                return AttachExpenseReportPDF(context, revisionVersion)
                    .Then(function () {
                    Sys.TechnicalData.SetValue("revisionVersion", revisionVersion);
                    return context;
                });
            }
            Report.ReviseExportReportPDF = ReviseExportReportPDF;
            /**
             * SERVER ONLY
             * @param context IExpensesContext
             */
            function SetExpenseReportNumber(context) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    if (Sys.ScriptInfo.IsServer()) {
                        var expenseReportNumber = Data.GetValue("ExpenseReportNumber__");
                        if (!expenseReportNumber) {
                            expenseReportNumber = Lib.Expense.NextNumber("ExpenseReport", "ExpenseReportNumber__");
                            Data.SetValue("ExpenseReportNumber__", expenseReportNumber);
                        }
                        resolve(context);
                    }
                    else {
                        throw "Not implemented on client side";
                    }
                });
            }
            Report.SetExpenseReportNumber = SetExpenseReportNumber;
            /**
             * Build a multiple fields mapping according to the line items grouped by CostCenter (from PAC)
             * @memberof Lib.Expense.Report
             * @param {Lib.Expense.Report.MappingOptions} options The list of options
             *  exchangeRate: exchange rate (default is 1)
             *  lineItems: table object of line items
             *  costCenterColumnName: name of the Item CostCenter column
             *  amountColumnName: {string} name of the Item Amount column
             *  baseFieldsMapping: {object} common fields to extend with the generated mapping
             *  keepEmpty: {boolean} indicate if you want to keep the empty cost center line or not (default is false)
             *  emptyCheckFunction: {function} optional to check if a line should looked at or not
             */
            function BuildFieldsMapping(options) {
                // copy values on new object to keep original object free from added properties
                var optionsEx = {
                    lineItems: options.lineItems,
                    groupingName: options.groupingName,
                    exchangeRate: options.exchangeRate || 1,
                    amountColumnName: options.amountColumnName,
                    baseFieldsMapping: options.baseFieldsMapping,
                    keepEmpty: options.keepEmpty || false,
                    emptyCheckFunction: options.emptyCheckFunction,
                    fieldsDefinition: {
                        keyFieldName: "DimensionValue__",
                        computationFieldName: "WorkflowAmount__"
                    }
                };
                optionsEx.keyColumnName = options.costCenterKeyName;
                optionsEx.tableColumnName = options.costCenterColumnName;
                var fieldsCC = Lib.P2P.BuildFieldsMappingGeneric(optionsEx);
                return fieldsCC;
            }
            Report.BuildFieldsMapping = BuildFieldsMapping;
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
