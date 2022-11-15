///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_POBudget_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Budget library for PO",
  "require": [
    "Lib_Budget_V12.0.461.0",
    "Lib_Budget_Visibility_V12.0.461.0",
    "[Lib_Budget_Updater_V12.0.461.0]",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Promise"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var POBudget;
        (function (POBudget) {
            // STD Globals Object
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            var g = Sys.Helpers.Globals;
            var status2ImpactAction = {
                "To order": "none",
                "To pay": "ordered",
                "To receive": "ordered",
                "Auto receive": "ordered",
                "Received": "ordered",
                "Canceled": "none",
                "Rejected": "none"
            };
            Lib.Budget.ExtendConfiguration({
                GetBudgetKeyColumns: Lib.P2P.GetBudgetKeyColumns,
                sourceTypes: {
                    // Configuration used for the new document in package V2
                    "20": {
                        CheckSourceType: function (document) {
                            var isPO = false;
                            if (Sys.ScriptInfo.IsClient()) {
                                isPO = g.Process.GetName() === Lib.P2P.GetPOProcessName();
                            }
                            else {
                                var processID = document ? document.GetUninheritedVars().GetValue_String("ProcessId", 0) : g.Data.GetValue("ProcessId");
                                isPO = processID === g.Process.GetProcessID(Lib.P2P.GetPOProcessName());
                            }
                            return isPO;
                        },
                        IsEmptyItem: function (item) {
                            return Lib.Purchasing.IsLineItemEmpty(item);
                        },
                        DeduceImpactAction: function (data, options) {
                            var state = parseInt(options.stateToDeduceImpactAction || Lib.Budget.GetBuiltinDocumentValue(options.document, "State"), 10);
                            var status = data.GetValue("OrderStatus__");
                            return state <= 100 ? status2ImpactAction[status] || "unknown" : "none";
                        },
                        PrepareImpact: function (data, impactAction, item, i, options) {
                            // No impact for warehouse items
                            if (Lib.P2P.Inventory.IsItemTakenFromStock(item)) {
                                return new Lib.Budget.Impact(); // no impact;
                            }
                            if (impactAction === "ordered") {
                                // In some cases (checkBudgetIntegrity, before recovering), we need to specify
                                // the array of PRBudgetID for items in options (initialBudgetIDByItems) because these
                                // IDs can be wrong...
                                var prBudgetID = item.GetValue("RequestedBudgetID__");
                                if (options.initialBudgetIDByItems) {
                                    var prBudgetIDFromOpt = options.initialBudgetIDByItems[i];
                                    if (Sys.Helpers.IsDefined(prBudgetIDFromOpt)) {
                                        prBudgetID = prBudgetIDFromOpt;
                                    }
                                }
                                //impact on PR is the (min(orderedQty , requestedQty)) * requested price as price can change, but quantity will always be good.
                                //at the end, all requested quantity will either be "ordered" or "canceled" (by the PR)
                                var allowSplitPRParam = Sys.Parameters.GetInstance("PAC").GetParameter("AllowSplitPRIntoMultiplePO", false);
                                var prQuantityToImpact = (!allowSplitPRParam || item.GetValue("ItemQuantity__") > item.GetValue("ItemRequestedQuantity__")) ? item.GetValue("ItemRequestedQuantity__") : item.GetValue("ItemQuantity__");
                                // Return two impacts because if the requested delivery date is changed and is in another fiscal period, we'll have to impact the Committed of the original period and the Ordered in the new period
                                var currencyLocal = CurrencyFactory.Get(data.GetValue("LocalCurrency__"));
                                var taxeAndExchangeFactor = new Sys.Decimal(item.GetValue("NonDeductibleTaxRate__") || 0)
                                    .div(100)
                                    .add(1)
                                    .mul(item.GetValue("ItemExchangeRate__") || data.GetValue("ExchangeRate__") || 1);
                                var requestedUnitPriceWithTaxesAndExchangeRate = Sys.Helpers.Round(taxeAndExchangeFactor
                                    .mul(item.GetValue("ItemRequestedUnitPrice__") || 0), currencyLocal.amountPrecision);
                                var orderedUnitPriceWithTaxesAndExchangeRate = Sys.Helpers.Round(taxeAndExchangeFactor
                                    .mul(item.GetValue("ItemUnitPrice__") || 0), currencyLocal.amountPrecision);
                                var orderedQty = new Sys.Decimal(item.GetValue("ItemQuantity__") || 0);
                                var receivedQty = new Sys.Decimal(item.GetValue("ItemTotalDeliveredQuantity__") || 0);
                                var returnedQty = new Sys.Decimal(item.GetValue("ItemReturnQuantity__") || 0);
                                var invoicedQty = new Sys.Decimal(item.GetValue("ItemInvoicedQuantity__") || 0);
                                var quantityImpactOnOrderedBudget = orderedQty;
                                var quantityImpactOnReceivedBudget = new Sys.Decimal(0);
                                var quantityInvoicedInAdvance = invoicedQty.sub(receivedQty.sub(returnedQty));
                                if (quantityInvoicedInAdvance.toNumber() > 0 && !item.GetValue("NoGoodsReceipt__")) {
                                    quantityImpactOnReceivedBudget = quantityInvoicedInAdvance;
                                    //If delivery complete, last GR already takes care of  cancelling remainging ordered budget
                                    // TODO : if GR is canceled, ItemDeliveryComplete__ is not updated yet because GR Canceler has not changed GR status to "canceled"
                                    // Idea : check resumeWith action name = canceled and determine which Items are impacted
                                    if (!item.GetValue("ItemDeliveryComplete__")) {
                                        quantityImpactOnOrderedBudget = receivedQty.sub(returnedQty);
                                    }
                                }
                                if (item.GetValue("CheckBillingCompleted__")) {
                                    if (item.GetValue("NoGoodsReceipt__")) {
                                        // If billing is closed, items without GR should remove invoiced qty from ordered
                                        quantityImpactOnOrderedBudget = invoicedQty;
                                    }
                                    else {
                                        // If billing is closed, items without GR should not make any adjustment on received qty
                                        quantityImpactOnReceivedBudget = receivedQty.sub(returnedQty).sub(invoicedQty).mul(-1);
                                    }
                                }
                                return new Lib.Budget.MultiImpact([
                                    {
                                        budgetID: prBudgetID,
                                        impact: new Lib.Budget.Impact({
                                            Committed__: prBudgetID ? Sys.Helpers.Round(requestedUnitPriceWithTaxesAndExchangeRate
                                                .mul(prQuantityToImpact), currencyLocal.amountPrecision).mul(-1).toNumber() : 0 // unallocate budget only if there was a budget
                                        })
                                    },
                                    {
                                        budgetID: "",
                                        impact: new Lib.Budget.Impact({
                                            Ordered__: Sys.Helpers.Round(orderedUnitPriceWithTaxesAndExchangeRate
                                                .mul(quantityImpactOnOrderedBudget), currencyLocal.amountPrecision).toNumber()
                                        })
                                    },
                                    {
                                        budgetID: "",
                                        impact: new Lib.Budget.Impact({
                                            Received__: Sys.Helpers.Round(orderedUnitPriceWithTaxesAndExchangeRate
                                                .mul(quantityImpactOnReceivedBudget), currencyLocal.amountPrecision).toNumber()
                                        })
                                    }
                                ]);
                            }
                            else if (impactAction === "none") {
                                return new Lib.Budget.Impact();
                            }
                            else if (impactAction === "canceled") {
                                // No budget impacts -> PreviousImpacts will restore budgets
                                return new Lib.Budget.Impact();
                            }
                            return null;
                        },
                        recomputeBudgetID: true,
                        formTable: "LineItems__",
                        mappings: {
                            common: {
                                "OperationID__": "OrderNumber__",
                                "CompanyCode__": "CompanyCode__",
                                "Note__": "BuyerComment__",
                                "VendorName__": "VendorName__",
                                "VendorNumber__": "VendorNumber__"
                            },
                            byLine: {
                                "BudgetID__": "BudgetID__",
                                "PeriodCode__": "ItemRequestedDeliveryDate__",
                                "CostCenter__": "ItemCostCenterId__",
                                "Group__": "ItemGroup__"
                            }
                        }
                    }
                }
            });
            function CheckUndefinedBudgets(budgets) {
                if (Lib.Purchasing.UndefinedBudgetBehavior.IsAllowed()) {
                    return {};
                }
                // UndefinedBudgetBehavior is set to warn or prevent, check for missing budgets and set an error on the line item
                var undefinedBudgets = [];
                var table = Data.GetTable("LineItems__");
                var _loop_1 = function (i) {
                    var budgetID = budgets.byItemIndex[i];
                    var item = table.GetItem(i);
                    if (budgetID instanceof Lib.Budget.MissingBudgetIDError && item.GetValue("BudgetID__")) {
                        // Item had a budget and has not a budget anymore because of the change of req delivery date or other
                        item.SetError("ItemDescription__", "_No budget allocated following user changes");
                        var error_1 = budgetID;
                        var detailsTrc = Lib.Budget.Configuration.GetBudgetKeyColumns().map(function (budgetColumn) {
                            return budgetColumn + "=" + error_1.budgetKeyColumns[budgetColumn];
                        }).join(", ");
                        if (undefinedBudgets.length >= 5) {
                            undefinedBudgets.push(" - ...");
                            return "break";
                        }
                        undefinedBudgets.push(" - " + detailsTrc);
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
            function CheckClosedBudgets(budgets) {
                var closedBudgets = [];
                var table = Data.GetTable("LineItems__");
                for (var i = 0; i < table.GetItemCount(); i++) {
                    var budgetID = budgets.byItemIndex[i];
                    if (Sys.Helpers.IsString(budgetID)) {
                        var item = table.GetItem(i);
                        var budget = budgets.byBudgetID[budgetID];
                        if (budget.Closed__ && item.GetValue("BudgetID__") !== budgetID) {
                            // Item budget has been changed to a closed budget which is not allowed
                            item.SetError("ItemRequestedDeliveryDate__", "_Closed budget for this period");
                            if (closedBudgets.length >= 5) {
                                closedBudgets.push(" - ...");
                                break;
                            }
                            closedBudgets.push(" - " + budgetID);
                        }
                    }
                }
                if (closedBudgets.length > 0) {
                    return {
                        $error: "_Closed budgets for accounting period",
                        $params: closedBudgets.join("\n")
                    };
                }
                return {}; // OK!
            }
            function FillItemBudgetID(budgets) {
                if (!(budgets.options && budgets.options.document)) // Do nothing in recovery
                 {
                    var formTable = budgets.sourceTypeConfig.formTable;
                    Sys.Helpers.Data.ForEachTableItem(formTable, function (item, i) {
                        var budgetID = budgets.byItemIndex[i];
                        if (Sys.Helpers.IsString(budgetID)) {
                            item.SetValue("BudgetID__", budgetID);
                        }
                    });
                }
            }
            function UpdateBudgets(options) {
                Log.Time("UpdateBudgets");
                if (Lib.Budget.IsDisabled()) {
                    Log.TimeEnd("UpdateBudgets");
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
                    ret = CheckClosedBudgets(budgets);
                    if (ret.$error) {
                        Lib.CommonDialog.NextAlert.Define("_Budget update error", ret.$error, null, ret.$params);
                        throw ret.$error;
                    }
                    FillItemBudgetID(budgets);
                    return Lib.Budget.UpdateBudgets(budgets)
                        .Catch(function (error) {
                        if (error instanceof Lib.Budget.PreventConcurrentAccessError) {
                            Lib.CommonDialog.NextAlert.Define("_Budget update error", "_ValidationErrorBudgetLocked");
                        }
                        throw error;
                    });
                })
                    .Catch(function (error) {
                    var errMessage = "[UpdateBudgets] Unexpected error: " + error;
                    Log.Error(errMessage);
                    throw error;
                })
                    .Finally(function () { return Log.TimeEnd("UpdateBudgets"); });
                return Sys.Helpers.Promise.IsResolvedSync(promise);
            }
            function AsOrdered() {
                return UpdateBudgets({
                    impactAction: "ordered"
                });
            }
            POBudget.AsOrdered = AsOrdered;
            function AsCanceled() {
                return UpdateBudgets({
                    impactAction: "canceled"
                });
            }
            POBudget.AsCanceled = AsCanceled;
            function AsOrderedAfterEditing() {
                // Restore BudgetID with the requested one in order to recompute it
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    item.SetValue("BudgetID__", item.GetValue("RequestedBudgetID__"));
                });
                return UpdateBudgets({
                    impactAction: "ordered"
                });
            }
            POBudget.AsOrderedAfterEditing = AsOrderedAfterEditing;
            function GetPRBudgetIDByItems(formData) {
                Log.Info("Querying PR budget ID for the PO line items...");
                var PRBudgetIDByItems = [];
                var query = Process.CreateQueryAsProcessAdmin();
                query.Reset();
                query.AddAttribute("*");
                query.SetSpecificTable(Lib.Purchasing.Items.PRItemsDBInfo.table);
                var filterParts = [];
                var lineItems = formData.GetTable("LineItems__");
                Sys.Helpers.Data.ForEachTableItem(lineItems, function (item) {
                    var PRNumber = item.GetValue("PRNumber__");
                    var PRLineNumber = item.GetValue("PRLineNumber__");
                    filterParts.push("(&(PRNumber__=" + PRNumber + ")(LineNumber__=" + PRLineNumber + "))");
                });
                var filter = "(|" + filterParts.join("") + ")";
                Log.Info("Selecting PR items with filter: " + filter);
                query.SetFilter(filter);
                query.MoveFirst();
                var record = query.MoveNextRecord();
                while (record) {
                    var vars = record.GetVars();
                    var itemPRNumber = vars.GetValue_String("PRNumber__", 0);
                    var itemPRLineNumber = vars.GetValue_String("LineNumber__", 0);
                    for (var i = 0; i < lineItems.GetItemCount(); i++) {
                        var lineItem = lineItems.GetItem(i);
                        var PRNumber = lineItem.GetValue("PRNumber__");
                        var PRLineNumber = lineItem.GetValue("PRLineNumber__");
                        if (PRNumber == itemPRNumber && PRLineNumber == itemPRLineNumber) {
                            var itemPRBudgetID = vars.GetValue_String("BudgetID__", 0);
                            PRBudgetIDByItems[i] = itemPRBudgetID;
                            break;
                        }
                    }
                    record = query.MoveNextRecord();
                }
                return PRBudgetIDByItems;
            }
            POBudget.GetPRBudgetIDByItems = GetPRBudgetIDByItems;
        })(POBudget = Purchasing.POBudget || (Purchasing.POBudget = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
