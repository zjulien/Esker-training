///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Expense common library",
  "require": [
    "Lib_V12.0.461.0",
    "LIB_P2P_V12.0.461.0",
    "LIB_P2P_UserProperties_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "[Lib_Custom_Parameters]",
    "[Lib_P2P_Custom_Parameters]",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_String",
    "[Sys/Sys_Helpers_Controls]",
    "Sys/Sys_Helpers_Promise",
    "[Lib_Expense_Customization_Common]",
    "[Lib_Expense_Report_Customization_Common]",
    "Sys/Sys_Helpers"
  ]
}*/
/// <reference path="../../Expense/Expense/typings/Controls_Expense/index.d.ts"/>
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        function SetRightForExpenseViewer(expenseViewer) {
            if (Sys.Helpers.IsUndefined(expenseViewer)) {
                expenseViewer = Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("Expense").GetParameter("ExpenseViewer"));
            }
            if (expenseViewer) {
                Log.Info("Grant read right to expense viewer: " + expenseViewer);
                Process.AddRight(expenseViewer, "read");
            }
        }
        Expense.SetRightForExpenseViewer = SetRightForExpenseViewer;
        /**
         * Test - TO IMPROVE OR REMOVE
         */
        Expense.ControlsWatcher = Sys.ScriptInfo.IsClient() && (function () {
            var timeoutByControls = {};
            var watchedControls = {};
            function OnControlChange(name) {
                // is watched control ?
                var watchedControl = watchedControls[name];
                if (watchedControl) {
                    watchedControl.watchers.forEach(function (watcher) {
                        if (watcher.checkApplyingConditionFunc()) {
                            watcher.applyFunc();
                        }
                    });
                }
            }
            function Register(options) {
                options.controls.forEach(function (controlDecl) {
                    var control = Sys.Helpers.Globals.Controls[controlDecl.name];
                    if (control) {
                        var watchedControl = watchedControls[controlDecl.name];
                        // Not yet watched control
                        if (!watchedControl) {
                            watchedControls[controlDecl.name] = watchedControl = {
                                watchers: []
                            };
                            var fctToWrap = options.onlyUserChanges ? "OnChange" : "OnSetValue";
                            control[fctToWrap] = Sys.Helpers.Wrap(control[fctToWrap], function (originalFn) {
                                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                                OnControlChange(controlDecl.name);
                            });
                        }
                        var clonedOptions = Sys.Helpers.Extend(false, {}, options);
                        var firstPrecedence = 0;
                        var lastPrecedence = 0;
                        if (watchedControl.watchers.length > 0) {
                            firstPrecedence = watchedControl.watchers[0].precedence;
                            lastPrecedence = watchedControl.watchers[watchedControl.watchers.length - 1].precedence;
                        }
                        // determine precedence if undefined -> new watcher is more important then previous one
                        if (Sys.Helpers.IsUndefined(clonedOptions.precedence)) {
                            clonedOptions.precedence = firstPrecedence + 1;
                        }
                        // need sort ?
                        if (lastPrecedence <= clonedOptions.precedence && clonedOptions.precedence < firstPrecedence) {
                            watchedControl.watchers.push(clonedOptions);
                            watchedControl.watchers.sort(function (a, b) { return a.precedence - b.precedence; });
                        }
                        // Most important -> add first
                        else if (clonedOptions.precedence >= firstPrecedence) {
                            watchedControl.watchers.push(clonedOptions);
                        }
                        // Lest important -> add end
                        else {
                            watchedControl.watchers.splice(0, 0, clonedOptions);
                        }
                    }
                    else {
                        Log.Error("Unknown header control " + controlDecl.name);
                    }
                });
            }
            function Unregister(name) {
                throw new Error("Not yet implemented...");
            }
            function CheckAll() {
                Object.keys(watchedControls).forEach(function (name) {
                    OnControlChange(name);
                });
                // clear all timeouts
                Sys.Helpers.Object.ForEach(timeoutByControls, function (timeoutID) {
                    clearTimeout(timeoutID);
                });
                timeoutByControls = {};
            }
            // public interface
            return {
                Register: Register,
                Unregister: Unregister,
                CheckAll: CheckAll
            };
        })();
        /**
        * Create a next alert to advise user when we try to execute an unknown action.
        * Process will be in validation state and wait for an action of user.
        * @param {string} currentAction name of the executed action
        * @param {string} currentName sub-name of the executed action
        */
        function OnUnknownAction(currentAction, currentName) {
            var knownAction = Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Server.OnUnknownAction", currentAction, currentName);
            if (knownAction !== true) {
                OnUnexpectedError("Ignoring unknown action " + currentAction + "-" + currentName);
            }
        }
        Expense.OnUnknownAction = OnUnknownAction;
        /**
        * Create a next alert to advise user when we have any issue.
        * Process will be in validation state and wait for an action of user.
        * @param {string} err message of error
        */
        function OnUnexpectedError(err) {
            Log.Error(err);
            Lib.CommonDialog.NextAlert.Define("_Unexpected error", "_Unexpected error message", { isError: true, behaviorName: "onUnexpectedError" });
            if (Sys.ScriptInfo.IsServer()) {
                Sys.Helpers.Globals.Process.PreventApproval();
            }
        }
        Expense.OnUnexpectedError = OnUnexpectedError;
        var errorMsg = {
            "Expense": "_Error while retrieving a new expense number",
            "ExpenseReport": "_Error while retrieving a new expense report number",
            "Invoice": "_Error while retrieving a new invoice number"
        };
        var sequenceName = {
            "Expense": "NumExpense",
            "ExpenseReport": "NumExpR",
            "Invoice": "NumInvExpR"
        };
        var numberFormat = {
            "Expense": "60000$seq$",
            "ExpenseReport": "70000$seq$",
            "Invoice": "$prefix$-$YYYY$-$seq$"
        };
        var customGetNumberFunc = {
            "Expense": "Lib.Expense.Customization.Server.GetNumber",
            "ExpenseReport": "Lib.Expense.Report.Customization.Server.GetNumber",
            "Invoice": "Lib.Expense.Report.Customization.Server.GetInvoiceNumber"
        };
        function NextNumber(type, fieldNumber, prefix, onAnotherProcess) {
            var sNumber = "";
            var GetNumberFunc = Sys.Helpers.TryGetFunction(customGetNumberFunc[type]);
            if (GetNumberFunc) {
                sNumber = GetNumberFunc(sequenceName[type], prefix);
            }
            else {
                var sequence = onAnotherProcess ? Process.GetSequence(sequenceName[type], onAnotherProcess) : Process.GetSequence(sequenceName[type]);
                sNumber = sequence.GetNextValue();
                if (sNumber) {
                    sNumber = Lib.P2P.FormatSequenceNumber(sNumber, numberFormat[type], prefix);
                }
            }
            if (!sNumber) {
                if (fieldNumber) {
                    Data.SetError(fieldNumber, errorMsg[type]);
                }
                Log.Error(errorMsg[type]);
            }
            else {
                Log.Info(type + " number: " + sNumber);
            }
            return sNumber;
        }
        Expense.NextNumber = NextNumber;
        Expense.ExpenseSendableStatus = ["To submit"];
        function IsExpenseSubmittable(expenseStatus) {
            return Expense.ExpenseSendableStatus.indexOf(expenseStatus) >= 0;
        }
        Expense.IsExpenseSubmittable = IsExpenseSubmittable;
        function IsDraftExpense(expenseStatus) {
            return expenseStatus === "Draft";
        }
        Expense.IsDraftExpense = IsDraftExpense;
        function InitTechnicalFields() {
            // Serialize Parameters for PAC instance
            Sys.Parameters.GetInstance("P2P").Serialize();
            Sys.Parameters.GetInstance("Expense").Serialize();
            Lib.P2P.InitValidityDateTime("Expense", "ValidityDurationInMonths", "12");
            Lib.P2P.InitArchiveDuration("Expense", "ExpenseArchiveDurationInMonths");
        }
        Expense.InitTechnicalFields = InitTechnicalFields;
        Expense.expenseTypeTableToProcessFieldMapping = {
            "Name__": "ExpenseType__",
            "DefaultGLAccount__": "GLAccount__",
            "TaxCode1__": "TaxCode1__",
            "TaxRate1__": "TaxRate1__",
            "TaxCode2__": "TaxCode2__",
            "TaxRate2__": "TaxRate2__",
            "TaxCode3__": "TaxCode3__",
            "TaxRate3__": "TaxRate3__",
            "TaxCode4__": "TaxCode4__",
            "TaxRate4__": "TaxRate4__",
            "TaxCode5__": "TaxCode5__",
            "TaxRate5__": "TaxRate5__",
            "InputTaxRate__": "InputTaxRate__",
            "VendorFieldBehaviour__": "VendorFieldBehaviour__",
            "CommentTemplate__": "Description__",
            "Template__": "Template__",
            "BillableFieldBehaviour__": "BillableFieldBehaviour__",
            "CostCenterFieldBehaviour__": "CostCenterFieldBehaviour__",
            "ProjectCodeFieldBehaviour__": "ProjectCodeFieldBehaviour__",
            "ReceiptBehaviour__": "ReceiptBehaviour__"
        };
        Expense.metaTypeToExpenseTypeMapping = {
            "Restaurant": { template: "Restaurant" },
            "Fuel/Gas": { template: "Fuel/Gas" },
            "Hotel": { template: "Hotel" }
        };
        function FindExpenseType(params) {
            Log.Info("[Expense] >> FindExpenseType: ".concat(JSON.stringify(params)));
            var filterParts = [];
            if (params.filter) {
                filterParts.push(params.filter);
            }
            else {
                var companyCode = Data.GetValue("CompanyCode__");
                filterParts.push("(CompanyCode__=".concat(Sys.Helpers.String.EscapeValueForLdapFilter(companyCode), ")"));
                if (params.name) {
                    filterParts.push("(Name__=".concat(Sys.Helpers.String.EscapeValueForLdapFilter(params.name), ")"));
                }
                else if (params.metaType) {
                    var mapping = Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Common.GetMetaTypeToExpenseTypeMapping") || Expense.metaTypeToExpenseTypeMapping;
                    var expenseTypeData = mapping[params.metaType];
                    if (expenseTypeData === null || expenseTypeData === void 0 ? void 0 : expenseTypeData.expenseTypes) {
                        var namesFilter = expenseTypeData.expenseTypes.map(function (name) { return "(Name__=".concat(Sys.Helpers.String.EscapeValueForLdapFilter(name), ")"); });
                        filterParts.push("(|".concat(namesFilter.join(""), ")"));
                    }
                    else if (expenseTypeData === null || expenseTypeData === void 0 ? void 0 : expenseTypeData.template) {
                        filterParts.push("(Template__=".concat(Sys.Helpers.String.EscapeValueForLdapFilter(expenseTypeData.template), ")"));
                    }
                    else {
                        Log.Info("[Expense.FindExpenseType] no expenseType data mapping found for metaType: ".concat(params.metaType));
                        return Sys.Helpers.Promise.Resolve([]);
                    }
                }
                else {
                    Log.Error("[Expense.FindExpenseType] missing params");
                    return Sys.Helpers.Promise.Resolve([]);
                }
            }
            var attributes = Object.keys(Expense.expenseTypeTableToProcessFieldMapping);
            var filter = "(&".concat(filterParts.join(""), ")");
            Log.Verbose("[Expense.FindExpenseType] querying table with filter: ".concat(filter));
            return Sys.GenericAPI
                .PromisedQuery({
                table: "P2P - Expense type__",
                attributes: attributes,
                filter: filter,
                maxRecords: 100
            })
                .Catch(function (reason) {
                if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                    Log.Error("[Expense] << FindExpenseType. An error occured while querying expenseType: ".concat(reason));
                }
                return [];
            });
        }
        Expense.FindExpenseType = FindExpenseType;
        function OnSelectExpenseTypeItem(item) {
            Log.Info("[Expense] >> OnSelectExpenseTypeItem");
            var getter = Sys.Helpers.IsDefined(item.GetValue) ? function (name) { return item.GetValue(name); } : function (name) { return item[name]; };
            Object.keys(Expense.expenseTypeTableToProcessFieldMapping).forEach(function (name) {
                Data.SetValue(Expense.expenseTypeTableToProcessFieldMapping[name], getter(name));
            });
        }
        Expense.OnSelectExpenseTypeItem = OnSelectExpenseTypeItem;
        function GetExpenseHighlightingImage() {
            var image = "Exp_highlighting.png";
            return Sys.Helpers.Globals.Process.GetImageURL(image);
        }
        Expense.GetExpenseHighlightingImage = GetExpenseHighlightingImage;
        Expense.GetMileageInfo = (function () {
            var mileageRecordsMap = {};
            var QueryMileages = function (vehicleType, companyCode) {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var filter = "(&(CompanyCode__=".concat(companyCode, ")(VehicleType__=").concat(vehicleType, "))");
                    Sys.GenericAPI.Query("P2P - Mileage__", filter, ["*"], function (result, error) {
                        if (!error) {
                            resolve(result);
                        }
                        else {
                            reject(error);
                        }
                    }, "", "NO_LIMIT");
                });
            };
            return function (vehicleType, companyCode, date) {
                var key = companyCode + "_" + vehicleType;
                var mileageRecords = mileageRecordsMap[key];
                if (!mileageRecords) {
                    mileageRecords = mileageRecordsMap[key] = {};
                    mileageRecords.promise = QueryMileages(vehicleType, companyCode)
                        .Then(function (records) {
                        mileageRecords.records = records.sort(function (a, b) { return b.EFFECTIVEDATE__ > a.EFFECTIVEDATE__ ? 1 : -1; });
                    });
                }
                // When mileage records are ready, we can return the record for the specified date
                return mileageRecords.promise.Then(function () {
                    var strDate = Sys.Helpers.Date.Date2DBDate(date);
                    var mileageInfo = Sys.Helpers.Array.Find(mileageRecords.records, function (record) { return strDate >= record.EFFECTIVEDATE__; });
                    if (!mileageInfo) {
                        throw "No effective mileage found for date: " + strDate;
                    }
                    return mileageInfo;
                });
            };
        })();
        Expense.SaveButtonDisabler = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Controls.ControlDisabler(Sys.Helpers.Globals.Controls.Save) : null;
        function IsReadOnly() {
            if (Sys.ScriptInfo.IsClient()) {
                return !!Sys.Helpers.Globals.ProcessInstance.isReadOnly;
            }
            Log.Error("Not Implemented on server side");
            return null;
        }
        Expense.IsReadOnly = IsReadOnly;
        /**
        * Update fields which depend of controls in parameter
        * @param {Array<string>} controls
        */
        function UpdateControl(controls) {
            if (Sys.Helpers.IsEmpty(controls)) {
                controls = ["TotalAmount__"];
            }
            controls.forEach(function (control) {
                var _a, _b;
                if (control === "TotalAmount__" || control === "ExchangeRate__") {
                    Data.SetValue("LocalAmount__", new Sys.Decimal(Data.GetValue("TotalAmount__") || 0).mul(Data.GetValue("ExchangeRate__") || 1).toNumber());
                }
                if (control === "TotalAmount__" || control === "ExchangeRate__" || control === "LocalAmount__" || control === "Refundable__" || control === "ExpenseType__") {
                    FillReimbursableAmount();
                }
                if (control === "ExpenseType__") {
                    (_a = Lib.Expense.AIForExpenses) === null || _a === void 0 ? void 0 : _a.FillExpenseWithLastPredictions();
                }
                if ((control === "TotalAmount__" || control === "ExpenseType__") &&
                    !((_b = Lib.Expense.AIForExpenses) === null || _b === void 0 ? void 0 : _b.IsPredictableDataWithLastPredictions("Taxes"))) {
                    // The tax is computed when the expense type has only one tax code (only the tax code field is set)
                    if (!Sys.Helpers.IsEmpty(Data.GetValue("TaxCode1__")) && Sys.Helpers.IsEmpty(Data.GetValue("TaxCode2__"))) {
                        var preTaxAmount = Data.GetValue("TotalAmount__") / (1 + Data.GetValue("TaxRate1__") * 0.01);
                        Data.SetValue("TaxAmount1__", Data.GetValue("TotalAmount__") - preTaxAmount);
                    }
                }
            });
        }
        Expense.UpdateControl = UpdateControl;
        function GetCustomExchangeRate() {
            var customExchangeRate = Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Common.GetCustomExchangeRate");
            if (customExchangeRate) {
                return Sys.Helpers.Promise.Resolve(customExchangeRate);
            }
            return null;
        }
        Expense.GetCustomExchangeRate = GetCustomExchangeRate;
        function CheckCustomExchangeRate() {
            var customExchangeRate = Lib.Expense.GetCustomExchangeRate();
            if (customExchangeRate) {
                customExchangeRate.Then(function (exchangeRate) {
                    Data.SetValue("ExchangeRate__", exchangeRate);
                    Lib.Expense.UpdateControl(["ExchangeRate__"]);
                    Data.SetError("ExchangeRate__", "");
                })
                    .Catch(function (error) {
                    Log.Error("An error occured while get custom exchange rate: " + error);
                    Data.SetValue("ExchangeRate__", null);
                    Lib.Expense.UpdateControl(["ExchangeRate__"]);
                    Data.SetError("ExchangeRate__", "");
                });
                return true;
            }
            return false;
        }
        Expense.CheckCustomExchangeRate = CheckCustomExchangeRate;
        function SetTotalAmountCurrency(refreshCurrency, companyCode, currency) {
            Log.Info("[Expense] >> SetTotalAmountCurrency");
            if (!companyCode) {
                companyCode = Data.GetValue("CompanyCode__");
            }
            if (!currency) {
                currency = Data.GetValue("TotalAmountCurrency__");
            }
            else {
                refreshCurrency = true;
                Data.SetValue("TotalAmountCurrency__", currency);
            }
            return Lib.P2P.CompanyCodesValue.QueryValues(companyCode, true)
                .Then(function (CCValues) {
                if (!CCValues.currencies.IsDefined(currency)) {
                    Data.SetError("TotalAmountCurrency__", "_This currency is not defined for the company code '{0}'", companyCode);
                }
                else {
                    Data.SetError("TotalAmountCurrency__", "");
                    Data.SetValue("LocalCurrency__", CCValues.Currency__);
                }
                if (refreshCurrency) {
                    if (CCValues.Currency__ !== currency) {
                        if (!Lib.Expense.CheckCustomExchangeRate()) {
                            CCValues.currencies.QueryRate(currency)
                                .Then(function (rate) {
                                Data.SetValue("ExchangeRate__", rate);
                                Data.SetError("ExchangeRate__", "");
                                Lib.Expense.UpdateControl(["ExchangeRate__"]);
                            });
                        }
                    }
                    else {
                        Data.SetValue("ExchangeRate__", 1);
                    }
                    Lib.Expense.UpdateControl(["ExchangeRate__"]);
                }
            });
        }
        Expense.SetTotalAmountCurrency = SetTotalAmountCurrency;
        function GetCustomReimbursableAmount() {
            var customReimbursableAmount = Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Common.GetCustomReimbursableAmount");
            if (customReimbursableAmount || customReimbursableAmount === 0) // Allow to return 0
             {
                return Sys.Helpers.Promise.Resolve(customReimbursableAmount);
            }
            return null;
        }
        Expense.GetCustomReimbursableAmount = GetCustomReimbursableAmount;
        function CheckCustomReimbursableAmount() {
            var customReimbursableAmount = Lib.Expense.GetCustomReimbursableAmount();
            if (customReimbursableAmount) {
                customReimbursableAmount.Then(function (reimbursableAmount) {
                    Log.Info("Setting custom ReimbursableLocalAmount__ from UE: " + reimbursableAmount);
                    Data.SetValue("ReimbursableLocalAmount__", reimbursableAmount);
                    Data.SetValue("NonReimbursableLocalAmount__", new Sys.Decimal(Data.GetValue("LocalAmount__") || 0).sub(reimbursableAmount).toNumber());
                })
                    .Catch(function (error) {
                    Log.Error("An error occured while getting custom reimbursable amount: " + error);
                });
                return true;
            }
            return false;
        }
        Expense.CheckCustomReimbursableAmount = CheckCustomReimbursableAmount;
        /***
         * Fills the reimbursable amount for the expense:
         * - if the expense is not refundable: 0
         * - else (refundable amount):
         * -- use the custom reimbursable amount from the user exit GetCustomReimbursableAmount if provided
         * -- else use local amount
         */
        function FillReimbursableAmount() {
            if (!Data.GetValue("Refundable__")) {
                // Non refundable expense:
                var localAmount = Data.GetValue("LocalAmount__") || 0;
                Data.SetValue("ReimbursableLocalAmount__", 0);
                Data.SetValue("NonReimbursableLocalAmount__", localAmount);
            }
            else if (!CheckCustomReimbursableAmount()) {
                // No custom reimbursable amount, use local amount (as expense is refundable)
                var localAmount = Data.GetValue("LocalAmount__") || 0;
                Data.SetValue("ReimbursableLocalAmount__", localAmount);
                Data.SetValue("NonReimbursableLocalAmount__", 0);
            }
        }
        Expense.FillReimbursableAmount = FillReimbursableAmount;
        function LoadUserProperties(userLogin) {
            return function (token) {
                var companyCode = Data.GetValue("CompanyCode__");
                if (companyCode) {
                    if (token) {
                        token.Use();
                    }
                    return;
                }
                Lib.P2P.UserProperties.QueryValues(userLogin)
                    .Then(function (UserPropertiesValues) {
                    companyCode = UserPropertiesValues.CompanyCode__;
                    if (!companyCode) {
                        var allowedCompanyCodes = UserPropertiesValues.GetAllowedCompanyCodes().split("\n");
                        if (allowedCompanyCodes.length) {
                            companyCode = allowedCompanyCodes[0];
                        }
                    }
                    Data.SetValue("CompanyCode__", companyCode);
                    Data.SetValue("Refundable__", !UserPropertiesValues.HasCompanyCard__);
                    if (!Data.GetValue("CostCenterId__")) {
                        Data.SetValue("CostCenterId__", UserPropertiesValues.CostCenter__);
                    }
                    if (!Data.GetValue("CostCenterName__")) {
                        Data.SetValue("CostCenterName__", UserPropertiesValues.CostCenter__Description__);
                    }
                    Lib.P2P.CompanyCodesValue.QueryValues(companyCode, false)
                        .Then(function (CCValues) {
                        if (Object.keys(CCValues).length > 0) {
                            Sys.Parameters.GetInstance("Expense").Reload(CCValues.DefaultConfiguration__);
                        }
                        else {
                            Data.SetError("CompanyCode__", "_This CompanyCode does not exist in the table.");
                        }
                        Data.SetValue("TotalAmountCurrency__", CCValues.Currency__);
                        Data.SetValue("LocalCurrency__", CCValues.Currency__);
                        Data.SetValue("ExchangeRate__", 1);
                        if (token) {
                            Sys.Parameters.GetInstance("Expense").IsReady(function () {
                                token.Use();
                            });
                        }
                    });
                });
            };
        }
        Expense.LoadUserProperties = LoadUserProperties;
        function ChangeConfiguration(newConfiguration) {
            return Sys.Helpers.Promise.Create(function (resolve) {
                Sys.Parameters.GetInstance("Expense").Reload(newConfiguration);
                Sys.Parameters.GetInstance("Expense").IsReady(function () {
                    resolve();
                });
            });
        }
        Expense.ChangeConfiguration = ChangeConfiguration;
        var allowedToCreateExpenseOnBehalfOf = false;
        var allowedToCreateExpenseOnBehalfOfPromise = null;
        function IsAllowedToCreateExpenseOnBehalfOf() {
            WaitUntilAllowedToCreateExpenseOnBehalfOfIsReady();
            return allowedToCreateExpenseOnBehalfOf;
        }
        Expense.IsAllowedToCreateExpenseOnBehalfOf = IsAllowedToCreateExpenseOnBehalfOf;
        function WaitUntilAllowedToCreateExpenseOnBehalfOfIsReady() {
            if (allowedToCreateExpenseOnBehalfOfPromise === null) {
                allowedToCreateExpenseOnBehalfOfPromise = Sys.Helpers.Promise.Resolve()
                    .Then(function () { return Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Common.IsAllowedToCreateExpenseOnBehalfOf"); })
                    .Then(function (res) {
                    allowedToCreateExpenseOnBehalfOf = !!res;
                    return allowedToCreateExpenseOnBehalfOf;
                });
            }
            return allowedToCreateExpenseOnBehalfOfPromise;
        }
        Expense.WaitUntilAllowedToCreateExpenseOnBehalfOfIsReady = WaitUntilAllowedToCreateExpenseOnBehalfOfIsReady;
        function OwnerNameFieldIsVisible() {
            if (!Sys.ScriptInfo.IsClient()) {
                throw new Error("Client side only!");
            }
            if (Sys.Helpers.Globals.ProcessInstance.isReadOnly) {
                return Sys.Helpers.Globals.User.loginId !== Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OriginalOwnerId"));
            }
            if (IsAllowedToCreateExpenseOnBehalfOf()) {
                return true;
            }
            return Sys.Helpers.Globals.User.IsBackupUserOf(Data.GetValue("OriginalOwnerId")) ||
                Sys.Helpers.Globals.User.IsBackupUserOf(Data.GetValue("OwnerId")) ||
                Lib.P2P.IsAdminNotOwner();
        }
        Expense.OwnerNameFieldIsVisible = OwnerNameFieldIsVisible;
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
