///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_GRItems_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library to manage items in GR",
  "require": [
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_String",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_POItems_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0"
  ]
}*/
// Common interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var GRItems;
        (function (GRItems) {
            // Members declaration and implementation
            var POItemsDBInfo = Lib.Purchasing.Items.POItemsDBInfo;
            function FindAutoReceiveOrderDataItem(lineNumber, dataItems) {
                // type not checked because ItemPOLineNumber__ is not a number
                return Sys.Helpers.Array.Find(dataItems, function (item) { return (item === null || item === void 0 ? void 0 : item.ItemPOLineNumber__) == lineNumber; });
            }
            function QueryAlreadyReceivedItems(dbPOItems) {
                var PONumber = dbPOItems[0].GetValue("PONumber__");
                var grItemsFilter = "(&(!(Status__=Canceled))(OrderNumber__=" + PONumber + "))";
                return Lib.Purchasing.Items.GetItemsForDocument(Lib.Purchasing.Items.GRItemsDBInfo, grItemsFilter, "LineNumber__");
            }
            function LoadForeignData(dbPOItems) {
                return Lib.Purchasing.Items.LoadForeignData(dbPOItems, POItemsDBInfo);
            }
            /**
             * Fill the form according to the selected PO items by the specified filter.
             * @param {?Lib.Purchasing.POItems.POItemsQueryParameters} queryPOParams used for querying POItems
             * @param {?FillFormOptions} formOptions used for filling Process (header and items)
             * @param {?AutoReceiveOrderData} autoReceiveOrderData additionnal data used for prefilling data (autoreceipt and created from ASN)
             * @returns {promise}
             */
            function FillForm(queryPOParams, formOptions, autoReceiveOrderData) {
                if (formOptions === void 0) { formOptions = null; }
                if (autoReceiveOrderData === void 0) { autoReceiveOrderData = null; }
                if (Sys.ScriptInfo.IsServer()) {
                    Process.EnableScriptMode(false);
                }
                return Lib.Purchasing.POItems.QueryPOItems(queryPOParams)
                    .Then(function (dbPOItems) { return Sys.Helpers.Promise.All([
                    QueryAlreadyReceivedItems(dbPOItems),
                    LoadForeignData(dbPOItems),
                    Sys.Helpers.Promise.Resolve(dbPOItems)
                ]); })
                    .Then(function (_a) {
                    var grItems = _a[0], foreignData = _a[1], dbPOItems = _a[2];
                    var fillOptions = {
                        fillItem: formOptions.fillItem,
                        updateItems: formOptions.updateItems,
                        foreignData: foreignData,
                        grItems: grItems,
                        autoReceiveOrderData: autoReceiveOrderData
                    };
                    return formOptions.fillForm(dbPOItems, fillOptions, autoReceiveOrderData);
                })
                    .Then(function (fieldsInError) {
                    var _a;
                    if (fieldsInError.length > 0) {
                        // Reject with error message of the first field
                        throw ((_a = formOptions.errorMap) === null || _a === void 0 ? void 0 : _a[fieldsInError[0]]) ||
                            "Some items have different values on the following fields: " + fieldsInError.join(", ");
                    }
                })
                    .Finally(function () {
                    // We re-enable the script mode
                    if (Sys.ScriptInfo.IsServer()) {
                        Process.EnableScriptMode(true);
                    }
                });
            }
            function GetGRNumbers(additionnalFilters) {
                var _a;
                var filter = Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", Data.GetValue("OrderNumber__"));
                if (additionnalFilters === null || additionnalFilters === void 0 ? void 0 : additionnalFilters.length) {
                    filter = (_a = Sys.Helpers.LdapUtil).FilterAnd.apply(_a, __spreadArray([filter], additionnalFilters, false));
                }
                Log.Info("Selecting GR items with filter: " + filter.toString());
                return Lib.Purchasing.Items.GetItemsForDocument(Lib.Purchasing.Items.GRItemsDBInfo, filter.toString(), "GRNumber__")
                    .Then(function (grItems) { return Object.keys(grItems); });
            }
            GRItems.GetGRNumbers = GetGRNumbers;
            //#region GOODS RECEIPT
            function FillGR(dbPOItems, fillOptions, autoReceiveOrderData) {
                var fieldsInError = Lib.Purchasing.Items.FillFormItems(dbPOItems, Lib.Purchasing.Items.POItemsToGR, fillOptions);
                // Set comment from the user exit (if exist)
                if (autoReceiveOrderData) {
                    if (autoReceiveOrderData.Comment) {
                        Data.SetValue("Comment__", autoReceiveOrderData.Comment);
                    }
                    // Set develivery date from the user exit (if exist)
                    if (autoReceiveOrderData.DeliveryDate) {
                        Data.SetValue("DeliveryDate__", autoReceiveOrderData.DeliveryDate);
                    }
                    // Set develivery note from the user exit (if exist)
                    if (autoReceiveOrderData.DeliveryNote) {
                        Data.SetValue("DeliveryNote__", autoReceiveOrderData.DeliveryNote);
                    }
                    if (autoReceiveOrderData.ASNNumber) {
                        Data.SetValue("ASNNumber__", autoReceiveOrderData.ASNNumber);
                    }
                }
                var deliveryDate = Data.GetValue("DeliveryDate__");
                if (!deliveryDate) {
                    Data.SetValue("DeliveryDate__", new Date());
                }
                var status = Data.GetValue("GRStatus__");
                if (status !== "Received") {
                    Data.SetValue("GRStatus__", "To receive");
                }
                Lib.Purchasing.ShipTo.MigrateOldShipToCompanyBehavior();
                return Lib.Purchasing.SetERPByCompanyCode(Data.GetValue("CompanyCode__"))
                    .Then(function () {
                    Lib.P2P.InitSAPConfiguration(Lib.ERP.GetERPName(), "PAC");
                    return fieldsInError;
                });
            }
            /**
             * Fill extra fields on PO items. This function is set as option when calling FillFormItems function.
             * @param {object} dbItem current po item in database
             * @param {object} item current gr item in form
             * @param {object} options options used to fill items
             */
            function CompleteGRFormItem(dbItem, item, options) {
                var _a, _b;
                var recipientLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("RecipientDN__"));
                if (Sys.ScriptInfo.IsClient()) {
                    var currentUser = Sys.Helpers.Globals.User;
                    var shouldReceiveItem = currentUser.loginId.toUpperCase() === recipientLogin.toUpperCase()
                        || currentUser.IsMemberOf(recipientLogin)
                        || currentUser.IsBackupUserOf(recipientLogin);
                    if (!Lib.P2P.IsAdmin() && !shouldReceiveItem) {
                        return false;
                    }
                }
                if (Sys.Helpers.IsEmpty(item.GetValue("SupplierPartID__"))) {
                    item.SetValue("SupplierPartID__", item.GetValue("Number__"));
                }
                var lineNumber = dbItem.GetValue("LineNumber__");
                var alreadyReceivedQty = new Sys.Decimal(0);
                var alreadyReceivedAmnt = new Sys.Decimal(0);
                var alreadyReturnedQty = new Sys.Decimal(0);
                var deliveryCompleted = false;
                if (options && options.grItems) {
                    var grItemsForLine = options.grItems[lineNumber];
                    if (grItemsForLine) {
                        grItemsForLine.forEach(function (grItem) {
                            if (grItem.GetValue("DeliveryCompleted__")) {
                                deliveryCompleted = true;
                            }
                            alreadyReceivedQty = alreadyReceivedQty.add(grItem.GetValue("Quantity__") || 0);
                            alreadyReceivedAmnt = alreadyReceivedAmnt.add(grItem.GetValue("Amount__") || 0);
                            alreadyReturnedQty = alreadyReturnedQty.add(grItem.GetValue("ReturnedQuantity__") || 0);
                        });
                    }
                }
                if (deliveryCompleted) {
                    return false;
                }
                var orderedQuantity = new Sys.Decimal(dbItem.GetValue("OrderedQuantity__") || 0);
                var orderedAmount = new Sys.Decimal(dbItem.GetValue("NetAmount__"));
                //returned quantity not updated from RO (beware of delay)
                var lineOpenQuantity = orderedQuantity.minus(alreadyReceivedQty).add(alreadyReturnedQty);
                var lineOpenAmount = orderedAmount.minus(alreadyReceivedAmnt);
                item.SetValue("OpenQuantity__", Math.max(0, lineOpenQuantity.toNumber())); // Qty can never be negative
                item.SetValue("ItemOpenAmount__", lineOpenAmount.toNumber());
                item.SetValue("POBudgetID__", dbItem.GetValue("BudgetID__"));
                if (options.autoReceiveOrderData) // only two possible case : equal to 'null' -> return false or equal to 'json object' -> return true
                 {
                    if (((_b = (_a = options.autoReceiveOrderData) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                        var dataItem = FindAutoReceiveOrderDataItem(lineNumber, options.autoReceiveOrderData.items);
                        if (dataItem === null || dataItem === void 0 ? void 0 : dataItem.ReceivedQuantity__) {
                            var receivedQuantity = new Sys.Decimal(dataItem.ReceivedQuantity__ || 0);
                            var itemUnitPrice = new Sys.Decimal(dbItem.GetValue("ItemUnitPrice__") || 0);
                            var netAmount = itemUnitPrice.mul(receivedQuantity);
                            item.SetValue("ReceivedQuantity__", receivedQuantity.toNumber());
                            item.SetValue("NetAmount__", netAmount.toNumber());
                        }
                        var isOverDeliveryAllowed = Sys.Helpers.TryCallFunction("Lib.GR.Customization.Common.AllowOverdelivery", item);
                        var isDeliveryCompleted = isOverDeliveryAllowed ? false : item.GetValue("ReceivedQuantity__") >= item.GetValue("OpenQuantity__");
                        item.SetValue("DeliveryCompleted__", isDeliveryCompleted);
                    }
                    else {
                        item.SetValue("ReceivedQuantity__", item.GetValue("OpenQuantity__"));
                        item.SetValue("NetAmount__", item.GetValue("ItemOpenAmount__"));
                        item.SetValue("DeliveryCompleted__", true);
                    }
                }
                var requesterLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("RequesterDN__"));
                Sys.OnDemand.Users.CacheByLogin.Get(requesterLogin, Lib.P2P.attributesForUserCache).Then(function (result) {
                    var user = result[requesterLogin];
                    if (!user.$error) {
                        Sys.Helpers.SilentChange(function () {
                            item.SetValue("RequesterName__", user.displayname ? user.displayname : user.login);
                        });
                    }
                });
                Sys.OnDemand.Users.CacheByLogin.Get(recipientLogin, Lib.P2P.attributesForUserCache).Then(function (result) {
                    var user = result[recipientLogin];
                    if (!user.$error) {
                        Sys.Helpers.SilentChange(function () {
                            item.SetValue("RecipientName__", user.displayname ? user.displayname : user.login);
                        });
                    }
                });
                return true;
            }
            GRItems.CompleteGRFormItem = CompleteGRFormItem;
            /**
             * Fill the goods receipt form according to the selected PO items by the specified filter.
             * @param {?Lib.Purchasing.POItems.POItemsQueryParameters} queryPOParams used for querying POItems
             * @param {?Lib.Purchasing.Items.FillFormItemsOptions} fillOptions used for filling Process (header and items)
             * @param {?AutoReceiveOrderData} autoReceiveOrderData additionnal data used for prefilling data (autoreceipt and created from ASN)
             * @returns {promise}
             */
            function FillGRForm(queryPOParams, fillOptions, autoReceiveOrderData) {
                if (fillOptions === void 0) { fillOptions = null; }
                if (autoReceiveOrderData === void 0) { autoReceiveOrderData = null; }
                Log.Time("Lib.Purchasing.GRItems.FillGRForm");
                var formOptions = __assign(__assign({}, fillOptions), { fillItem: (fillOptions === null || fillOptions === void 0 ? void 0 : fillOptions.fillItem) || CompleteGRFormItem, fillForm: FillGR, errorMap: Lib.Purchasing.Items.POItemsToGR.errorMessages });
                return FillForm(queryPOParams, formOptions, autoReceiveOrderData)
                    .Finally(function () {
                    Log.TimeEnd("Lib.Purchasing.GRItems.FillGRForm");
                });
            }
            GRItems.FillGRForm = FillGRForm;
            //#endregion GOODS RECEIPT
            //#region PICKUP
            function FillPickup(dbPOItems, fillOptions) {
                var fieldsInError = Lib.Purchasing.Items.FillFormItems(dbPOItems, Lib.Purchasing.Items.POItemsToPickup, fillOptions);
                if (!Data.GetValue("PickupDate__")) {
                    Data.SetValue("PickupDate__", new Date());
                }
                if (Data.GetValue("PickupStatus__") !== "Received") {
                    Data.SetValue("PickupStatus__", "To receive");
                }
                Lib.Purchasing.ShipTo.MigrateOldShipToCompanyBehavior();
                return Sys.Helpers.Promise.Resolve(fieldsInError);
            }
            /**
             * Fill extra fields on Pickup items. This function is set as option when calling FillFormItems function.
             * @param {object} dbItem current po item in database
             * @param {object} item current gr item in form
             * @param {object} options options used to fill items
             */
            function CompletePickupFormItem(dbItem, item, options) {
                var recipientLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("RecipientDN__"));
                var ownerLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("OWNERID"));
                if (Sys.ScriptInfo.IsClient()) {
                    var currentUser = Sys.Helpers.Globals.User;
                    var shouldPickupItem = currentUser.loginId.toUpperCase() === ownerLogin.toUpperCase()
                        || currentUser.IsMemberOf(ownerLogin)
                        || currentUser.IsBackupUserOf(ownerLogin);
                    if (!Lib.P2P.IsAdmin() && !shouldPickupItem) {
                        return false;
                    }
                }
                var lineNumber = dbItem.GetValue("LineNumber__");
                var alreadyPickedUpQty = new Sys.Decimal(0);
                var alreadyPickedUpAmnt = new Sys.Decimal(0);
                var pickupCompleted = false;
                if (options && options.grItems) {
                    var grItemsForLine = options.grItems[lineNumber];
                    if (grItemsForLine) {
                        grItemsForLine.forEach(function (grItem) {
                            if (grItem.GetValue("DeliveryCompleted__")) {
                                Log.Info("Pickup completed for GRItem " + lineNumber);
                                pickupCompleted = true;
                            }
                            alreadyPickedUpQty = alreadyPickedUpQty.add(grItem.GetValue("Quantity__") || 0);
                            alreadyPickedUpAmnt = alreadyPickedUpAmnt.add(grItem.GetValue("Amount__") || 0);
                        });
                    }
                }
                if (pickupCompleted) {
                    return false;
                }
                var orderedQuantity = new Sys.Decimal(dbItem.GetValue("OrderedQuantity__") || 0);
                var orderedAmount = new Sys.Decimal(dbItem.GetValue("NetAmount__"));
                var lineOpenQuantity = orderedQuantity.minus(alreadyPickedUpQty);
                var lineOpenAmount = orderedAmount.minus(alreadyPickedUpAmnt);
                item.SetValue("OpenQuantity__", Math.max(0, lineOpenQuantity.toNumber())); // Qty can never be negative
                item.SetValue("ItemOpenAmount__", lineOpenAmount.toNumber());
                item.SetValue("POBudgetID__", dbItem.GetValue("BudgetID__"));
                var requesterLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("RequesterDN__"));
                Sys.OnDemand.Users.CacheByLogin.Get(requesterLogin, Lib.P2P.attributesForUserCache).Then(function (result) {
                    var user = result[requesterLogin];
                    if (!user.$error) {
                        Sys.Helpers.SilentChange(function () {
                            item.SetValue("RequesterName__", user.displayname ? user.displayname : user.login);
                        });
                    }
                });
                Sys.OnDemand.Users.CacheByLogin.Get(recipientLogin, Lib.P2P.attributesForUserCache).Then(function (result) {
                    var user = result[recipientLogin];
                    if (!user.$error) {
                        Sys.Helpers.SilentChange(function () {
                            item.SetValue("RecipientName__", user.displayname ? user.displayname : user.login);
                        });
                    }
                });
                return true;
            }
            GRItems.CompletePickupFormItem = CompletePickupFormItem;
            /**
             * Fill the pick up form according to the selected PO items by the specified filter.
             * @param {?Lib.Purchasing.POItems.POItemsQueryParameters} queryPOParams used for querying POItems
             * @param {?Lib.Purchasing.Items.FillFormItemsOptions} fillOptions used for filling Process (header and items)
             * @returns {promise}
             */
            function FillPickupForm(queryPOParams, fillOptions) {
                if (fillOptions === void 0) { fillOptions = null; }
                Log.Time("Lib.Purchasing.GRItems.FillPickupForm");
                var formOptions = __assign(__assign({}, fillOptions), { fillItem: (fillOptions === null || fillOptions === void 0 ? void 0 : fillOptions.fillItem) || CompletePickupFormItem, fillForm: FillPickup, errorMap: Lib.Purchasing.Items.POItemsToPickup.errorMessages });
                return FillForm(queryPOParams, formOptions)
                    .Finally(function () {
                    Log.TimeEnd("Lib.Purchasing.GRItems.FillPickupForm");
                });
            }
            GRItems.FillPickupForm = FillPickupForm;
            //#endregion PICKUP
        })(GRItems = Purchasing.GRItems || (Purchasing.GRItems = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
