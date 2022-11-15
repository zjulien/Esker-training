///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_PickupValidation_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing library managing Pickup items",
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
        var PickupValidation;
        (function (PickupValidation) {
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
            PickupValidation.GetPOItemsInForm = GetPOItemsInForm;
            /**
             * Call to check if a line in LineItems__ table as been over received.
             * @returns {boolean} true if succeeds, false if over received
             */
            function CheckOverReceivedItems() {
                var allPOItems = GetPOItemsInForm();
                var pickupNumber = Data.GetValue("PickupNumber__");
                return Purchasing.Items.CheckOverReceivedItems(allPOItems, pickupNumber, "PICKUP" /* Items.ItemType.PICKUP */);
            }
            PickupValidation.CheckOverReceivedItems = CheckOverReceivedItems;
            /**
             * Update (or create) document items when GR is Created.
             */
            PickupValidation.SynchronizeItems = (function () {
                function InitComputedDataForPickupItemsSynchronizeConfig(options) {
                    var status = Data.GetValue("PickupStatus__");
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
                        var receivedQuantity = currentItem.GetValue("PickedUpQuantity__");
                        var receivedAmount = currentItem.GetValue("NetAmount__");
                        var completed = currentItem.GetValue("PickupCompleted__");
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
                    Purchasing.Items.PickupItemsSynchronizeConfig.computedData = computedData;
                }
                function Synchronize(options) {
                    if (options === void 0) { options = {}; }
                    try {
                        InitComputedDataForPickupItemsSynchronizeConfig(options);
                        if (Purchasing.Items.Synchronize(Purchasing.Items.PickupItemsSynchronizeConfig)) {
                            if (!options.justUpdateItems) {
                                //Notify all PO
                                var allPOItems = options.allPOItems || GetPOItemsInForm();
                                Sys.Helpers.Object.ForEach(allPOItems, function (poItems /*, poNumber: string*/) {
                                    Purchasing.Items.ResumeDocumentToSynchronizeItems("Purchase order", poItems[0].GetValue("PORUIDEX__"), "SynchronizeItems", JSON.stringify({ "actualRecipientDN": Data.GetValue("LastSavedOwnerID") || Data.GetValue("OwnerId") }));
                                });
                            }
                            else {
                                Log.Info("Don't resume PO to synchronize items (justUpdateItems option enabled).");
                            }
                            return true;
                        }
                        return false;
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
            function UpdateExchangeRate() {
                var _a;
                var allPOItems = GetPOItemsInForm();
                var linesFilters = [];
                Sys.Helpers.Object.ForEach(allPOItems, function (poItems, poNumber) {
                    var lineNumbers = poItems.map(function (item) { return item.GetValue("LineNumber__"); });
                    var pofilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("PONumber__", poNumber), Sys.Helpers.LdapUtil.FilterIn("LineNumber__", lineNumbers));
                    linesFilters.push(pofilter);
                });
                var params = {
                    additionnalFilters: [(_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, linesFilters)]
                };
                Log.Info("Querying items for PO", Object.keys(allPOItems).join(","));
                return Purchasing.POItems.QueryPOItems(params)
                    .Then(function (poItems) {
                    Log.Info(poItems.length, " items retrieved");
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        var lineNumber = line.GetValue("LineNumber__");
                        var orderNumber = line.GetValue("OrderNumber__");
                        var poItem = Sys.Helpers.Array.Find(poItems, function (item) {
                            return item.GetValue("LineNumber__") == lineNumber && item.GetValue("PONumber__") == orderNumber;
                        });
                        if (poItem) {
                            var pickupItemExchangeRate = line.GetValue("ExchangeRate__");
                            var poItemExchangeRate = poItem.GetValue("ExchangeRate__");
                            if (pickupItemExchangeRate != poItemExchangeRate) {
                                Log.Info("Updating exchange rate for GR item ", lineNumber, "  from <", pickupItemExchangeRate, "> to <", poItemExchangeRate, ">");
                                line.SetValue("ExchangeRate__", poItemExchangeRate);
                            }
                        }
                    });
                });
            }
            PickupValidation.UpdateExchangeRate = UpdateExchangeRate;
        })(PickupValidation = Purchasing.PickupValidation || (Purchasing.PickupValidation = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
