///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_PRBudget_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Budget library for PR",
  "require": [
    "Lib_Budget_V12.0.461.0",
    "Lib_Budget_Visibility_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "[Lib_Budget_Updater_V12.0.461.0]",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "Sys/Sys_Decimal"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var PRBudget;
        (function (PRBudget) {
            // STD Globals Object
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            var g = Sys.Helpers.Globals;
            var status2ImpactAction = {
                "To complete": "none",
                "To review": "to approve",
                "To approve": "to approve",
                "To order": "committed",
                "To receive": "committed",
                "Received": "committed",
                "Canceled": "none",
                "Rejected": "none"
            };
            function GetUnitPriceWithTaxeAndExchangeRate(item, data) {
                var currencyLocal = CurrencyFactory.Get(data.GetValue("LocalCurrency__"));
                var taxeAndExchangeFactor = new Sys.Decimal(item.GetValue("NonDeductibleTaxRate__") || 0)
                    .div(100)
                    .add(1)
                    .mul(item.GetValue("ItemExchangeRate__") || data.GetValue("ExchangeRate__") || 1);
                return Sys.Helpers.Round(taxeAndExchangeFactor
                    .mul(item.GetValue("ItemUnitPrice__") || 0), currencyLocal.amountPrecision);
            }
            Lib.Budget.ExtendConfiguration({
                GetBudgetKeyColumns: Lib.P2P.GetBudgetKeyColumns,
                sourceTypes: {
                    // Configuration used for the new document in package V2
                    "10": {
                        CheckSourceType: function (document) {
                            var isPR = false;
                            if (Sys.ScriptInfo.IsClient()) {
                                isPR = g.Process.GetName() === Lib.P2P.GetPRProcessName();
                            }
                            else {
                                var processID = document ? document.GetUninheritedVars().GetValue_String("ProcessId", 0) : g.Data.GetValue("ProcessId");
                                isPR = processID === g.Process.GetProcessID(Lib.P2P.GetPRProcessName());
                            }
                            return isPR;
                        },
                        IsEmptyItem: function (item) {
                            return Lib.Purchasing.IsLineItemEmpty(item);
                        },
                        ItemAmountInLocalCurrency: function (item, data) {
                            // For backward compatibility, fallback to exchangerate at header level if not defined at line level
                            var currencyLocal = CurrencyFactory.Get(data.GetValue("LocalCurrency__"));
                            var unitPriceWithTaxeAndExchangeRate = GetUnitPriceWithTaxeAndExchangeRate(item, data);
                            return Sys.Helpers.Round(unitPriceWithTaxeAndExchangeRate.mul(item.GetValue("ItemQuantity__") || 0), currencyLocal.amountPrecision).toNumber();
                        },
                        DeduceImpactAction: function (data, options) {
                            var state = parseInt(options.stateToDeduceImpactAction || Lib.Budget.GetBuiltinDocumentValue(options.document, "State"), 10);
                            var status = data.GetValue("RequisitionStatus__");
                            return state <= 100 ? status2ImpactAction[status] || "unknown" : "none";
                        },
                        PrepareImpact: function (data, impactAction, item /*, i*/) {
                            // No impact for warehouse items
                            if (Lib.P2P.Inventory.IsItemTakenFromStock(item)) {
                                return new Lib.Budget.Impact(); // no impact;
                            }
                            if (impactAction === "committed") {
                                return new Lib.Budget.Impact({
                                    Committed__: this.ItemAmountInLocalCurrency(item, data)
                                });
                            }
                            else if (impactAction === "none" ||
                                impactAction === "back to budget from committed" ||
                                impactAction === "back to budget from to approve") {
                                return new Lib.Budget.Impact(); // no impact
                            }
                            else if (impactAction === "unknown") {
                                return null;
                            }
                            else if (impactAction === "canceled item from committed") {
                                if (item.GetValue("ItemStatus__") === "Canceled") {
                                    return new Lib.Budget.Impact();
                                }
                                if (item.GetValue("CanceledQuantity__")) {
                                    var currencyLocal = CurrencyFactory.Get(data.GetValue("LocalCurrency__"));
                                    var unitPriceWithTaxeAndExchangeRate = GetUnitPriceWithTaxeAndExchangeRate(item, data);
                                    //impact only what is still requested
                                    var realRequestedQuantity = new Sys.Decimal(item.GetValue("ItemQuantity__") || 0)
                                        .minus(item.GetValue("CanceledQuantity__") || 0);
                                    return new Lib.Budget.Impact({
                                        Committed__: Sys.Helpers.Round(unitPriceWithTaxeAndExchangeRate
                                            .mul(realRequestedQuantity), currencyLocal.amountPrecision).toNumber()
                                    });
                                }
                                return new Lib.Budget.Impact({
                                    Committed__: this.ItemAmountInLocalCurrency(item, data)
                                });
                            }
                            // by default "to approve" and "back to approve"...
                            return new Lib.Budget.Impact({
                                ToApprove__: this.ItemAmountInLocalCurrency(item, data)
                            });
                        },
                        formTable: "LineItems__",
                        mappings: {
                            common: {
                                "OperationID__": "RequisitionNumber__",
                                "CompanyCode__": "CompanyCode__",
                                "Note__": "Reason__"
                            },
                            byLine: {
                                "BudgetID__": "BudgetID__",
                                "PeriodCode__": "ItemRequestedDeliveryDate__",
                                "CostCenter__": "ItemCostCenterId__",
                                "Group__": "ItemGroup__",
                                "VendorName__": "VendorName__",
                                "VendorNumber__": "VendorNumber__"
                            }
                        }
                    }
                }
            });
            /**
             * Returns true if every budget has been approved by a user with suffisant rights on budget.
             * @returns {boolean}
             */
            function IsBudgetViewedByEveryApprover() {
                if (Lib.Budget.IsDisabled()) {
                    return true;
                }
                var table = Data.GetTable("LineItems__");
                var count = table.GetItemCount();
                for (var i = 0; i < count; i++) {
                    var item = table.GetItem(i);
                    if (!item.GetValue("ItemBudgetViewed__")) {
                        Log.Info("This item has not been approved yet : " + item.GetValue("ItemCostCenterId__") + "_" + item.GetValue("ItemGLAccount__"));
                        return false;
                    }
                }
                return true;
            }
            PRBudget.IsBudgetViewedByEveryApprover = IsBudgetViewedByEveryApprover;
            function CheckUndefinedBudgets(budgets) {
                var allowUndefinedBudget = budgets.options.checkRemainingBudgets === false;
                var undefinedBudgets = [];
                var table = Data.GetTable("LineItems__");
                var _loop_1 = function (i) {
                    var budgetID = budgets.byItemIndex[i];
                    if (budgetID instanceof Lib.Budget.MissingBudgetIDError) {
                        var error_1 = budgetID;
                        var detailsTrc = Lib.Budget.Configuration.GetBudgetKeyColumns().map(function (budgetColumn) {
                            return budgetColumn + "=" + error_1.budgetKeyColumns[budgetColumn];
                        }).join(", ");
                        if (!allowUndefinedBudget && Lib.Purchasing.UndefinedBudgetBehavior.IsPrevented()) {
                            if (undefinedBudgets.length >= 5) {
                                undefinedBudgets.push(" - ...");
                                return "break";
                            }
                            undefinedBudgets.push(" - " + detailsTrc);
                        }
                        else {
                            Log.Warn("Undefined budget key with " + detailsTrc);
                        }
                    }
                };
                for (var i = 0; i < table.GetItemCount(); i++) {
                    var state_1 = _loop_1(i);
                    if (state_1 === "break")
                        break;
                }
                if (undefinedBudgets.length > 0) {
                    return {
                        $error: "_Missing Accounting period",
                        $params: undefinedBudgets.join("\n")
                    };
                }
                return {}; // OK!
            }
            PRBudget.CheckUndefinedBudgets = CheckUndefinedBudgets;
            function CheckRemainingBudgets(budgets) {
                if (budgets.options.checkRemainingBudgets !== false &&
                    ((budgets.options.impactAction === "to approve") || (budgets.options.impactAction === "committed"))) {
                    Log.Info("Checking remaining budget changes...");
                    var table = Data.GetTable("LineItems__");
                    for (var i = 0; i < table.GetItemCount(); i++) {
                        var budgetID = budgets.byItemIndex[i];
                        if (Sys.Helpers.IsString(budgetID)) {
                            var item = table.GetItem(i);
                            var budget = budgets.byBudgetID[budgetID];
                            // check if user has visibility on this budget if visibility has been defined
                            var visibility = budgets.options.visibilityForRemainingBudget || budgets.options.visibility;
                            if (visibility && !visibility.Check(budget)) {
                                Log.Error("No budget access right " + budgetID);
                                return {
                                    $error: "_No budget access right",
                                    $params: budgetID
                                };
                            }
                            var approvedRemaining = item.GetValue("ItemBudgetRemaining__");
                            approvedRemaining = parseFloat(approvedRemaining || "0");
                            var remaining = budget.Remaining__;
                            var diff = new Sys.Decimal(approvedRemaining).minus(remaining).abs().toNumber();
                            // Do not allow budget update if actual remaining value is different (to 10^-2) than approved remaining value.
                            if (diff >= 0.01) {
                                Log.Error("Budget update refused for budgetID " + budgetID + " because a difference has been detected between the approved and actual remaining budget. Approved: " + approvedRemaining + ", actual: " + remaining);
                                return {
                                    $error: "_ValidationErrorBudgetChanged",
                                    $params: budgetID
                                };
                            }
                        }
                    }
                }
                return {}; // OK!
            }
            PRBudget.CheckRemainingBudgets = CheckRemainingBudgets;
            function UpdateBudgets(options) {
                if (options.impactAction) {
                    Log.Info("Budget action: " + options.impactAction);
                }
                if (Lib.Budget.IsDisabled()) {
                    return true;
                }
                var promise = Lib.Budget.GetBudgets(options)
                    .Then(function (budgets) {
                    var ret = CheckUndefinedBudgets(budgets);
                    if (ret.$error) {
                        Lib.CommonDialog.NextAlert.Define("_Budget update error", ret.$error, null, ret.$params);
                        throw ret.$error;
                    }
                    ret = Lib.Purchasing.CheckMultipleBudgets(budgets);
                    if (ret.$error) {
                        Lib.CommonDialog.NextAlert.Define("_Budget update error", ret.$error, null, ret.$params);
                        throw ret.$error;
                    }
                    // When approving, check that the approved budget on the form hasn't changed
                    ret = CheckRemainingBudgets(budgets);
                    if (ret.$error) {
                        Lib.CommonDialog.NextAlert.Define("_Budget update error", ret.$error, null, ret.$params);
                        throw ret.$error;
                    }
                    return Lib.Budget.UpdateBudgets(budgets)
                        .Then(function (updatedBudgets) {
                        // reset budget columns
                        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item /*, i*/) {
                            item.SetValue("ItemPeriodCode__", "");
                            item.SetValue("ItemBudgetRemaining__", "");
                            item.SetValue("ItemBudgetInitial__", "");
                        });
                        return !!updatedBudgets;
                    })
                        .Catch(function (error) {
                        if (error instanceof Lib.Budget.PreventConcurrentAccessError) {
                            Lib.CommonDialog.NextAlert.Define("_Budget update error", "_ValidationErrorBudgetLocked");
                        }
                        throw error;
                    });
                })
                    .Catch(function (error) {
                    Log.Error("[UpdateBudgets] Unexpected error: " + error);
                    throw error;
                });
                return Sys.Helpers.Promise.IsResolvedSync(promise);
            }
            PRBudget.UpdateBudgets = UpdateBudgets;
            function AsCommitted() {
                return UpdateBudgets({
                    impactAction: "committed",
                    checkRemainingBudgets: false
                });
            }
            PRBudget.AsCommitted = AsCommitted;
            function AsBackToApprove() {
                return UpdateBudgets({
                    impactAction: "back to approve"
                });
            }
            PRBudget.AsBackToApprove = AsBackToApprove;
            function AsSubmitted() {
                return UpdateBudgets({
                    impactAction: "to approve",
                    checkRemainingBudgets: false
                });
            }
            PRBudget.AsSubmitted = AsSubmitted;
            function AsReviewed() {
                return UpdateBudgets({
                    impactAction: "to approve",
                    checkRemainingBudgets: false
                });
            }
            PRBudget.AsReviewed = AsReviewed;
            function AsToApprove() {
                var loginId = Lib.P2P.GetValidatorOrOwner().GetValue("Login");
                return UpdateBudgets({
                    impactAction: "to approve",
                    ignoreItemsWithoutBudgetID: true,
                    visibility: new Lib.Budget.Visibility({
                        login: loginId,
                        validationKeyColumns: Lib.P2P.GetBudgetValidationKeyColumns()
                    })
                });
            }
            PRBudget.AsToApprove = AsToApprove;
            function AsBackToBudgetFromCommitted() {
                return UpdateBudgets({
                    impactAction: "back to budget from committed"
                });
            }
            PRBudget.AsBackToBudgetFromCommitted = AsBackToBudgetFromCommitted;
            // Used when backing to budget from the "To review" status
            function AsBackToBudgetFromToApprove() {
                return UpdateBudgets({
                    impactAction: "back to budget from to approve"
                });
            }
            PRBudget.AsBackToBudgetFromToApprove = AsBackToBudgetFromToApprove;
            function AsCanceledItemFromCommitted() {
                return UpdateBudgets({
                    impactAction: "canceled item from committed"
                });
            }
            PRBudget.AsCanceledItemFromCommitted = AsCanceledItemFromCommitted;
        })(PRBudget = Purchasing.PRBudget || (Purchasing.PRBudget = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
