///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_GRBudget_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Budget library for GR",
  "require": [
    "Lib_Budget_V12.0.461.0",
    "Lib_Budget_Visibility_V12.0.461.0",
    "[Lib_Budget_Updater_V12.0.461.0]",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Promise"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var GRBudget;
        (function (GRBudget) {
            // STD Globals Object
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            var g = Sys.Helpers.Globals;
            var status2ImpactAction = {
                "To receive": "none",
                "Received": "received",
                "Canceled": "none"
            };
            Lib.Budget.ExtendConfiguration({
                GetBudgetKeyColumns: Lib.P2P.GetBudgetKeyColumns,
                sourceTypes: {
                    // Configuration used for the new document in package V2
                    "40": {
                        CheckSourceType: function (document) {
                            var isGR = false;
                            if (Sys.ScriptInfo.IsClient()) {
                                isGR = g.Process.GetName() === Lib.P2P.GetGRProcessName();
                            }
                            else {
                                var processID = document ? document.GetUninheritedVars().GetValue_String("ProcessId", 0) : g.Data.GetValue("ProcessId");
                                isGR = processID === g.Process.GetProcessID(Lib.P2P.GetGRProcessName());
                            }
                            return isGR;
                        },
                        IsEmptyItem: function ( /*item: Item*/) {
                            return false;
                        },
                        DeduceImpactAction: function (data, options) {
                            var state = parseInt(options.stateToDeduceImpactAction || Lib.Budget.GetBuiltinDocumentValue(options.document, "State"), 10);
                            var status = data.GetValue("GRStatus__");
                            return state <= 100 ? status2ImpactAction[status] || "unknown" : "none";
                        },
                        PrepareImpact: function (data, impactAction, item, i, options) {
                            if (impactAction === "received") {
                                var currencyLocal = CurrencyFactory.Get(data.GetValue("LocalCurrency__"));
                                var taxeAndExchangeFactor = new Sys.Decimal(item.GetValue("NonDeductibleTaxRate__") || 0)
                                    .div(100)
                                    .add(1)
                                    .mul(item.GetValue("ExchangeRate__") || data.GetValue("ExchangeRate__") || 1);
                                var deliveredUnitPriceWithTaxes = Sys.Helpers.Round(taxeAndExchangeFactor
                                    .mul(item.GetValue("UnitPrice__") || 0), currencyLocal.amountPrecision);
                                var openQuantity = new Sys.Decimal(item.GetValue("OpenQuantity__") || 0);
                                var receivedQuantity = new Sys.Decimal(item.GetValue("ReceivedQuantity__") || 0);
                                var returnedQuantity = new Sys.Decimal(item.GetValue("ReturnedQuantity__") || 0);
                                var deliveredQuantity = receivedQuantity.sub(returnedQuantity);
                                var deliveredAmount = Sys.Helpers.Round(deliveredQuantity
                                    .mul(deliveredUnitPriceWithTaxes), currencyLocal.amountPrecision);
                                var undeliveredAmount = new Sys.Decimal(0);
                                var isDeliveryCompleted = !!item.GetValue("DeliveryCompleted__");
                                var isOverDelivered = deliveredQuantity.toNumber() > openQuantity.toNumber();
                                if (isDeliveryCompleted || isOverDelivered) {
                                    undeliveredAmount = isOverDelivered ?
                                        openQuantity.sub(receivedQuantity).add(returnedQuantity) :
                                        openQuantity.sub(receivedQuantity);
                                    undeliveredAmount = Sys.Helpers.Round(undeliveredAmount.mul(deliveredUnitPriceWithTaxes), currencyLocal.amountPrecision);
                                }
                                // Keep the PO BudgetID on items (looks like PO)
                                // In some cases (checkBudgetIntegrity, before recovering), we need to specify
                                // the array of POBudgetID for items in options (initialBudgetIDByItems) because these
                                // IDs can be wrong...
                                var poBudgetID = item.GetValue("POBudgetID__") || item.GetValue("BudgetID__");
                                if (options.initialBudgetIDByItems) {
                                    var poBudgetIDFromOpt = options.initialBudgetIDByItems[i];
                                    if (Sys.Helpers.IsDefined(poBudgetIDFromOpt)) {
                                        poBudgetID = poBudgetIDFromOpt;
                                    }
                                }
                                var orderedImpact = poBudgetID
                                    ? deliveredAmount
                                        .mul(-1)
                                        .minus(undeliveredAmount)
                                        .toNumber()
                                    : 0; // unallocate budget only if there was a budget
                                var receivedImpact = deliveredAmount.toNumber();
                                if ("Canceled" === Data.GetValue("GRStatus__")) {
                                    orderedImpact = 0;
                                    receivedImpact = 0;
                                }
                                // Return two impacts because if the reception is in another fiscal period, we'll have to impact the Ordered of the original period and the Received in the new period
                                return new Lib.Budget.MultiImpact([
                                    {
                                        budgetID: poBudgetID,
                                        impact: new Lib.Budget.Impact({
                                            Ordered__: orderedImpact
                                        })
                                    },
                                    {
                                        budgetID: "",
                                        impact: new Lib.Budget.Impact({
                                            Received__: receivedImpact
                                        })
                                    }
                                ]);
                            }
                            else if (impactAction === "canceled" || impactAction === "none") {
                                // No budget impacts -> PreviousImpacts will restore budgets (for 'canceled' impactAction)
                                return new Lib.Budget.Impact();
                            }
                            return null;
                        },
                        recomputeBudgetID: true,
                        formTable: "LineItems__",
                        mappings: {
                            common: {
                                "OperationID__": "GRNumber__",
                                "CompanyCode__": "CompanyCode__",
                                "PeriodCode__": "DeliveryDate__",
                                "Note__": "Comment__",
                                "VendorName__": "VendorName__",
                                "VendorNumber__": "VendorNumber__"
                            },
                            byLine: {
                                "BudgetID__": "BudgetID__",
                                "CostCenter__": "CostCenterId__",
                                "Group__": "Group__"
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
                var table = budgets.documentData.GetTable(budgets.sourceTypeConfig.formTable);
                var _loop_1 = function (i) {
                    var budgetID = budgets.byItemIndex[i];
                    var item = table.GetItem(i);
                    if ((item.GetValue("ReceivedQuantity__") || item.GetValue("NetAmount__")) && (budgetID instanceof Lib.Budget.MissingBudgetIDError) && item.GetValue("BudgetID__")) {
                        // Item had a budget and has not a budget anymore because of the change of receipt date
                        if (budgets.documentData === Data) {
                            Data.SetError("DeliveryDate__", "_No budget allocated for this date");
                        }
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
                var table = budgets.documentData.GetTable(budgets.sourceTypeConfig.formTable);
                for (var i = 0; i < table.GetItemCount(); i++) {
                    var budgetID = budgets.byItemIndex[i];
                    if (Sys.Helpers.IsString(budgetID)) {
                        var item = table.GetItem(i);
                        var budget = budgets.byBudgetID[budgetID];
                        if ((item.GetValue("ReceivedQuantity__") || item.GetValue("NetAmount__")) && budget.Closed__ && item.GetValue("BudgetID__") !== budgetID) {
                            // Item budget has been changed to a closed budget which is not allowed
                            if (budgets.documentData === Data) {
                                Data.SetError("DeliveryDate__", "_Closed budget for this period");
                            }
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
                    var formTable = budgets.documentData.GetTable(budgets.sourceTypeConfig.formTable);
                    Sys.Helpers.Data.ForEachTableItem(formTable, function (item, i) {
                        var budgetID = budgets.byItemIndex[i];
                        if (Sys.Helpers.IsString(budgetID)) {
                            item.SetValue("BudgetID__", budgetID);
                        }
                    });
                }
            }
            function UpdateBudgets(options) {
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
                    Log.Error("[UpdateBudgets] Unexpected error: " + error);
                    throw error;
                });
                return Sys.Helpers.Promise.IsResolvedSync(promise);
            }
            function AsReceived(options) {
                return UpdateBudgets(Sys.Helpers.Extend(options || {}, {
                    impactAction: "received"
                }));
            }
            GRBudget.AsReceived = AsReceived;
            function AsReceivedAfterPOEditing(options) {
                //Reset BudgetID in order to recompute it
                var POBudgetIDByItems = Lib.Purchasing.GRBudget.GetPOBudgetIDByItems(Data);
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                    var budgetID = POBudgetIDByItems[i];
                    if (Sys.Helpers.IsDefined(budgetID)) {
                        item.SetValue("POBudgetID__", budgetID);
                        item.SetValue("BudgetID__", budgetID);
                    }
                });
                return UpdateBudgets(Sys.Helpers.Extend(options || {}, {
                    impactAction: "received"
                }));
            }
            GRBudget.AsReceivedAfterPOEditing = AsReceivedAfterPOEditing;
            function AsCanceled(options) {
                return UpdateBudgets(Sys.Helpers.Extend(options || {}, {
                    impactAction: "canceled"
                }));
            }
            GRBudget.AsCanceled = AsCanceled;
            function GetPOBudgetIDByItems(formData) {
                Log.Info("Querying PO budget ID for the GR line items...");
                var POBudgetIDByItems = [];
                var query = Process.CreateQueryAsProcessAdmin();
                query.Reset();
                query.AddAttribute("*");
                query.SetSpecificTable(Lib.Purchasing.Items.POItemsDBInfo.table);
                var filterParts = [];
                var lineItems = formData.GetTable("LineItems__");
                Sys.Helpers.Data.ForEachTableItem(lineItems, function (item) {
                    var PONumber = item.GetValue("OrderNumber__");
                    var POLineNumber = item.GetValue("LineNumber__");
                    filterParts.push("(&(PONumber__=" + PONumber + ")(LineNumber__=" + POLineNumber + "))");
                });
                var filter = "(|" + filterParts.join("") + ")";
                Log.Info("Selecting PO items with filter: " + filter);
                query.SetFilter(filter);
                query.MoveFirst();
                var record = query.MoveNextRecord();
                while (record) {
                    var vars = record.GetVars();
                    var itemPONumber = vars.GetValue_String("PONumber__", 0);
                    var itemPOLineNumber = vars.GetValue_String("LineNumber__", 0);
                    for (var i = 0; i < lineItems.GetItemCount(); i++) {
                        var lineItem = lineItems.GetItem(i);
                        var PONumber = lineItem.GetValue("OrderNumber__");
                        var POLineNumber = lineItem.GetValue("LineNumber__");
                        if (PONumber == itemPONumber && POLineNumber == itemPOLineNumber) {
                            var itemPOBudgetID = vars.GetValue_String("BudgetID__", 0);
                            POBudgetIDByItems[i] = itemPOBudgetID;
                            break;
                        }
                    }
                    record = query.MoveNextRecord();
                }
                return POBudgetIDByItems;
            }
            GRBudget.GetPOBudgetIDByItems = GetPOBudgetIDByItems;
        })(GRBudget = Purchasing.GRBudget || (Purchasing.GRBudget = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
