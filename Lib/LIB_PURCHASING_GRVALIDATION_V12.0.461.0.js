///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_GRValidation_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing library managing GR items",
  "require": [
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Decimal",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_ROItems_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "Sys/Sys_Helpers_Data",
    "[Lib_GR_Customization_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var GRValidation;
        (function (GRValidation) {
            /**
             * Returns all items in PO form by PR number.
             * @returns {object} items map by PR number
             */
            function GetPOItemsInForm() {
                var allPOItems = {};
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                    var poNumber = line.GetValue("OrderNumber__");
                    if (!(poNumber in allPOItems)) {
                        allPOItems[poNumber] = [];
                    }
                    allPOItems[poNumber].push(line);
                });
                return allPOItems;
            }
            /**
             * Call to check if a line in LineItems__ table as been over received.
             * @returns {boolean} true if succeeds, false if over received
             */
            function CheckOverReceivedItems() {
                var allPOItems = GetPOItemsInForm();
                var grNumber = Data.GetValue("GRNumber__");
                return Lib.Purchasing.Items.CheckOverReceivedItems(allPOItems, grNumber, "GR" /* Lib.Purchasing.Items.ItemType.GR */);
            }
            GRValidation.CheckOverReceivedItems = CheckOverReceivedItems;
            /**
             * Update (or create) document items when GR is Created.
             */
            GRValidation.SynchronizeItems = (function () {
                function InitComputedDataForGRItemsSynchronizeConfig(options) {
                    var status = Data.GetValue("GRStatus__");
                    var computedData = {
                        common: {},
                        byLine: {}
                    };
                    // Retrieves the table.
                    var myTable = Data.GetTable("LineItems__");
                    var itemCount = myTable.GetItemCount();
                    var i = 0;
                    // Parses all lines.
                    while (i < itemCount) {
                        // Gets the current table line.
                        var currentItem = myTable.GetItem(i);
                        var lineNumber = currentItem.GetValue("LineNumber__");
                        var receivedQuantity = currentItem.GetValue("ReceivedQuantity__");
                        var receivedAmount = currentItem.GetValue("NetAmount__");
                        var completed = currentItem.GetValue("DeliveryCompleted__");
                        if (receivedQuantity !== 0 || receivedAmount !== 0 || completed) {
                            i++;
                            var initialValues = {
                                "Status": status
                            };
                            if (!options.justUpdateItems) {
                                initialValues.InvoicedAmount = 0;
                                initialValues.InvoicedQuantity = 0;
                            }
                            computedData.byLine[lineNumber] = initialValues;
                        }
                        else {
                            // Deletes the line and updates the total count.
                            itemCount = currentItem.RemoveItem();
                        }
                    }
                    return Lib.Purchasing.Items.GRItemsSynchronizeConfig.computedData = computedData;
                }
                function Synchronize(options) {
                    options = options || {};
                    try {
                        InitComputedDataForGRItemsSynchronizeConfig(options);
                        Lib.Purchasing.Items.Synchronize(Lib.Purchasing.Items.GRItemsSynchronizeConfig);
                        if (!options.justUpdateItems) {
                            var poRUIDEx = options.poRuidEx || Data.GetValue("SourceRUID");
                            Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("Purchase order", poRUIDEx, "SynchronizeItems", JSON.stringify({ "actualRecipientDN": Data.GetValue("LastSavedOwnerId") || Data.GetValue("OwnerId") }));
                        }
                        else {
                            Log.Info("Don't resume PO to synchronize items (justUpdateItems option enabled).");
                        }
                        return true;
                    }
                    catch (e) {
                        Log.Error(e.toString());
                        Lib.CommonDialog.NextAlert.Define("_Items synchronization error", "_Items synchronization error message");
                        return false;
                    }
                }
                return function (options) {
                    return Sys.Helpers.Data.RollbackableSection(function (rollbackFn) {
                        return Synchronize(options) || rollbackFn();
                    });
                };
            })();
            GRValidation.OnEditOrder = (function () {
                function FillFormWithLastPOUpdates() {
                    Log.Info("Fill form with last PO updates");
                    return Lib.Purchasing.GRItems.FillGRForm(null, {
                        updateItems: true
                    });
                }
                function UpdateBudget() {
                    return Sys.Helpers.Promise.Create(function (resolve /*, reject: Function*/) {
                        Log.Info("Updating budget...");
                        if (!Lib.Purchasing.GRBudget.AsReceivedAfterPOEditing()) {
                            throw new Error("Error during updating budget");
                        }
                        resolve();
                    });
                }
                function SynchronizeItemsAfterUpdate(options) {
                    options.justUpdateItems = true;
                    return Sys.Helpers.Promise.Create(function (resolve /*, reject: Function*/) {
                        Log.Info("Synchronizing items...");
                        if (!Lib.Purchasing.GRValidation.SynchronizeItems(options)) {
                            throw new Error("Error during synchronizing budget");
                        }
                        resolve();
                    });
                }
                return function (options) {
                    Log.Info("OnEditOrder starting...");
                    var ret = true;
                    FillFormWithLastPOUpdates()
                        .Then(UpdateBudget)
                        .Then(function () { return SynchronizeItemsAfterUpdate(options); })
                        .Catch(function (reason) {
                        Log.Error("OnEditOrder in error. Details: " + reason);
                        Lib.CommonDialog.NextAlert.Define("_GR edition error", "_GR edition error message", { isError: true, behaviorName: "GREditionError" });
                        Process.PreventApproval();
                        ret = false;
                    });
                    return ret;
                };
            })();
            /**
             * Update items after having been notified by a RO
             * @param returnedPOLineNumbers list of line numbers having a return
             */
            function OnReturnOrder(returnedPOLineNumbers) {
                Log.Info("[OnReturnOrder] ".concat(JSON.stringify(returnedPOLineNumbers)));
                return Lib.Purchasing.ROItems.GetReturnOrderItems(Data.GetValue("CompanyCode__"), Sys.Helpers.LdapUtil.FilterEqual("Line_GoodsReceiptNumber__", Data.GetValue("GRNumber__")))
                    .Then(function (results) {
                    Log.Info("[OnReturnOrder] ".concat(results.length, " lines"));
                    return Lib.Purchasing.ROItems.GroupResultByPOLineNumber(results);
                })
                    .Then(function (returnedQuantityByPOLine) {
                    // Update table
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        var _a, _b;
                        var lineNumber = line.GetValue("LineNumber__");
                        var returnedQuantity = (_b = (_a = returnedQuantityByPOLine[lineNumber]) === null || _a === void 0 ? void 0 : _a.returnedQuantity) !== null && _b !== void 0 ? _b : 0;
                        line.SetValue("ReturnedQuantity__", returnedQuantity);
                        line.SetValue("ReturnedAmount__", new Sys.Decimal(returnedQuantity).mul(line.GetValue("UnitPrice__")).toNumber());
                        if (line.GetValue("DeliveryCompleted__") && Sys.Helpers.Array.IndexOf(returnedPOLineNumbers, lineNumber.toString()) >= 0) {
                            Log.Info("[OnReturnOrder] reopening line ".concat(lineNumber));
                            line.SetValue("DeliveryCompleted__", false);
                        }
                    });
                });
            }
            GRValidation.OnReturnOrder = OnReturnOrder;
            function UpdateExchangeRate() {
                var params = {
                    orderNumber: Data.GetValue("OrderNumber__")
                };
                Log.Info("Querying items for PO", params.orderNumber);
                return Lib.Purchasing.POItems.QueryPOItems(params)
                    .Then(function (poItems) {
                    Log.Info(poItems.length, " items retrieved");
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        var lineNumber = line.GetValue("LineNumber__");
                        var poItem = Sys.Helpers.Array.Find(poItems, function (item) {
                            return item.GetValue("LineNumber__") == lineNumber;
                        });
                        if (poItem) {
                            var grItemExchangeRate = line.GetValue("ExchangeRate__");
                            var poItemExchangeRate = poItem.GetValue("ExchangeRate__");
                            if (grItemExchangeRate != poItemExchangeRate) {
                                Log.Info("Updating exchange rate for GR item ", lineNumber, "  from <", grItemExchangeRate, "> to <", poItemExchangeRate, ">");
                                line.SetValue("ExchangeRate__", poItemExchangeRate);
                            }
                        }
                    });
                });
            }
            GRValidation.UpdateExchangeRate = UpdateExchangeRate;
        })(GRValidation = Purchasing.GRValidation || (Purchasing.GRValidation = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
