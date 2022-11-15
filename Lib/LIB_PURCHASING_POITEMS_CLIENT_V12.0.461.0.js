///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_POItems_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Client",
  "comment": "Purchasing library to manage items in PO",
  "require": [
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_LdapUtil",
    "[Lib_CommonDialog_V12.0.461.0]",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_POItems_V12.0.461.0",
    "Lib_Purchasing_Vendor_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper_V12.0.461.0",
    "Lib_Purchasing_Punchout_PO_Client_V12.0.461.0",
    "Lib_Purchasing_ShipTo_Client_V12.0.461.0",
    "Lib_Purchasing_CheckPO_V12.0.461.0",
    "Lib_Purchasing_WorkflowPO_V12.0.461.0",
    "Lib_Purchasing_DownPayment_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "Lib_Purchasing_ReturnManagement_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var POItems;
        (function (POItems) {
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            var nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
            var itemsMap = {};
            var nextLineNumber = 0;
            POItems.g_isEditing = ProcessInstance.isEditing || (nextAlert && nextAlert.isError);
            POItems.showTax = false;
            POItems.g_hasValidGoodsReceipt = false;
            function normalizeValue(fieldValue) {
                // normalize multiline string values
                if (Sys.Helpers.IsString(fieldValue)) {
                    fieldValue = fieldValue.replace(/\r\n/g, "\n");
                }
                return fieldValue;
            }
            function CheckSection(fields, item) {
                var allEquals = true;
                var allInitialEmpty = true;
                Sys.Helpers.Object.ForEach(fields, function (field) {
                    allEquals = allEquals && normalizeValue(Data.GetValue(field)) === normalizeValue(item.GetValue(field));
                    allInitialEmpty = allInitialEmpty && !Data.GetValue(field);
                });
                return allEquals || allInitialEmpty;
            }
            function QueryAlreadyOrderedQuantity(dbItem) {
                var PRItemsSynchronizeConfig = Lib.Purchasing.Items.PRItemsSynchronizeConfig;
                var POItemsDBInfo = Lib.Purchasing.Items.POItemsDBInfo;
                if (!itemsMap[GetKey(dbItem)]) {
                    return Sys.Helpers.Promise.Resolve(null);
                }
                var poItemsFilter = "(&(Status__!=Canceled)(PRNumber__=" + dbItem.GetValue(PRItemsSynchronizeConfig.tableKey) + ")(PRLineNumber__=" + dbItem.GetValue(PRItemsSynchronizeConfig.lineKey) + "))";
                Log.Info("Fetching ordered information from PO Items: " + poItemsFilter);
                return Sys.GenericAPI.PromisedQuery({
                    table: POItemsDBInfo.table,
                    filter: poItemsFilter,
                    attributes: ["PONumber__", "PRNumber__", "PRLineNumber__", "OrderedQuantity__"],
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: POItemsDBInfo.fieldsMap
                    },
                    maxRecords: Lib.Purchasing.Items.MAXRECORDS
                })
                    .Then(function (dbPOItems) {
                    if (dbPOItems.length === 0) {
                        return null;
                    }
                    var poOrderedQty = {};
                    var poNumber = Data.GetValue("OrderNumber__");
                    dbPOItems.forEach(function (dbPOItem) {
                        var prNumber = dbPOItem.GetValue("PRNumber__");
                        var prItemNumber = dbPOItem.GetValue("PRLineNumber__");
                        var qty = dbPOItem.GetValue("OrderedQuantity__");
                        poOrderedQty[prNumber] = poOrderedQty[prNumber] || {};
                        poOrderedQty[prNumber][prItemNumber] = poOrderedQty[prNumber][prItemNumber] || 0;
                        if (dbPOItem.GetValue("PONumber__") !== poNumber) {
                            poOrderedQty[prNumber][prItemNumber] = new Sys.Decimal(poOrderedQty[prNumber][prItemNumber]).add(qty).toNumber();
                        }
                    });
                    return poOrderedQty;
                })
                    .Catch(function (error) {
                    throw "FillForm: error querying PO items for Quantity__ with filter. Details: " + error;
                })
                    .Finally(function () { return Log.TimeEnd("Lib.Purchasing.POItems.FillForm"); });
            }
            function AddSelectedItemToOrder(dbItem, checkQtyWith) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var dbItems = [dbItem];
                    var PRItemsToPO = Lib.Purchasing.Items.PRItemsToPO;
                    var options = {
                        // no foreign data needed (ignore vendor information)
                        foreignData: null,
                        // quantity to order is probably obsolete when user selects item.
                        // the check of quantity in validation script will detect over-ordered items.
                        checkQtyWith: checkQtyWith,
                        // common API used to fill an item
                        fillItem: Lib.Purchasing.POItems.CompleteFormItem,
                        // we keep all items in table
                        resetItems: false,
                        // fill only item fields not common ones
                        doNotFillCommonFields: true
                    };
                    Lib.Purchasing.Items.FillFormItems(dbItems, PRItemsToPO, options);
                    // Trigger event in order to refresh other information on form
                    // retrieve last item (new item just added)
                    var itemCount = Controls.LineItems__.GetItemCount();
                    if (itemCount > 0) {
                        var index = itemCount - 1;
                        var isMultiShipTo = Lib.Purchasing.IsMultiShipTo();
                        var vendorSectionAreEquals = CheckSection(["VendorName__", "VendorNumber__"], dbItem);
                        // multiShipTo : PO shipToAddress header is not used and therefore should not be compared
                        var shipToSectionAreEqualsOrIgnored = isMultiShipTo || CheckSection(["DeliveryAddressID__", "ShipToCompany__", "ShipToContact__", "ShipToPhone__", "ShipToEmail__"], dbItem);
                        var title = null, msg = null;
                        if (!vendorSectionAreEquals && !shipToSectionAreEqualsOrIgnored) {
                            title = "_Vendor and delivery address different";
                            msg = "_The vendor and the delivery address of the added item don't match the ones of the purchase order. Keep it?";
                        }
                        else if (!vendorSectionAreEquals) {
                            title = "_Vendor different";
                            msg = "_The vendor of the added item doesn't match the one of the purchase order. Keep it?";
                        }
                        else if (!shipToSectionAreEqualsOrIgnored) {
                            title = "_Delivery address different";
                            msg = "_The delivery address of the added item doesn't match the one of the purchase order. Keep it?";
                        }
                        if (title != null) {
                            Lib.CommonDialog.PopupYesCancel(function (action) {
                                if (action === "Cancel") {
                                    Controls.LineItems__.SetItemCount(itemCount - 1);
                                }
                                if (!Lib.Purchasing.IsMultiShipTo() && Lib.P2P.Inventory.HasReplenishmentItems(Data.GetTable("LineItems__"))) {
                                    Lib.Purchasing.ShipTo.SetHeaderToFirstReplenishmentAdress();
                                    Lib.Purchasing.ShipTo.UpdateLayout(Data.GetValue("OrderStatus__") !== "To order" || Lib.P2P.IsAdminNotOwner() || (!Lib.Purchasing.IsMultiShipTo() && Lib.P2P.Inventory.HasReplenishmentItems(Data.GetTable("LineItems__"))));
                                }
                                resolve();
                            }, title, msg, "_Yes", "_No");
                        }
                        var tableItem = Controls.LineItems__.GetItem(index);
                        if (Lib.Purchasing.Punchout.PO.IsEnabled()) {
                            Lib.Purchasing.Punchout.PO.CheckPunchoutItemValidity(tableItem);
                        }
                        Controls.LineItems__.OnAddItem(tableItem, index);
                        if (title == null) {
                            resolve();
                        }
                    }
                });
            }
            function InitAddItemsToOrderButton() {
                Controls.BrowsePRItems__.OnSelectItem = function (item) {
                    QueryAlreadyOrderedQuantity(item)
                        .Then(function (checkQtyWith) {
                        Lib.Purchasing.CatalogHelper.PopulateCacheConditionedPricingData([{
                                ItemNumber__: item.GetValue("ItemNumber__"),
                                VendorNumber__: Data.GetValue("VendorNumber__")
                            }])
                            .Then(function () {
                            return AddSelectedItemToOrder(item, checkQtyWith);
                        })
                            .Then(SetFilter);
                    });
                };
                Controls.AddItemsToOrderButton__.OnClick = function () {
                    SetFilter();
                    Controls.BrowsePRItems__.DoBrowse();
                };
                function SetFilter() {
                    var _a, _b;
                    // filter according to :
                    var allFilters = [];
                    // only items to order
                    allFilters.push(Sys.Helpers.LdapUtil.FilterEqual("Status__", "To order"));
                    // and items on which i'm buyer (ooto + groups)
                    allFilters.push(Sys.Helpers.LdapUtil.FilterEqual("BuyerDN__", "$submit-owner"));
                    if (!Sys.Helpers.IsEmpty(Data.GetValue("CompanyCode__"))) {
                        // same company code as already selected Items
                        allFilters.push(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")));
                    }
                    if (!Sys.Helpers.IsEmpty(Data.GetValue("Currency__"))) {
                        // same currency as already selected Items
                        allFilters.push(Sys.Helpers.LdapUtil.FilterEqual("Currency__", Data.GetValue("Currency__")));
                    }
                    // coherence with already selected items
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                        // do not select items already selected
                        var PRNumberFilter = Sys.Helpers.LdapUtil.FilterEqual("PRNumber__", item.GetValue("PRNumber__"));
                        var LineNumberFilter = Sys.Helpers.LdapUtil.FilterEqual("LineNumber__", item.GetValue("PRLineNumber__"));
                        allFilters.push(Sys.Helpers.LdapUtil.FilterNot(Sys.Helpers.LdapUtil.FilterAnd(PRNumberFilter, LineNumberFilter)));
                    });
                    var DeletedItemsFilter = [];
                    var lineChanges = Lib.Purchasing.POEdition.ChangesManager.GetChangedItems().LineItems__;
                    if (lineChanges) {
                        Sys.Helpers.Array.ForEach(lineChanges.Deleted, function (idx) {
                            var keys = idx.split("###");
                            var PRNumberFilter = Sys.Helpers.LdapUtil.FilterEqual("PRNumber__", keys[1]);
                            var LineNumberFilter = Sys.Helpers.LdapUtil.FilterEqual("LineNumber__", keys[2]);
                            DeletedItemsFilter.push(Sys.Helpers.LdapUtil.FilterAnd(PRNumberFilter, LineNumberFilter));
                        });
                    }
                    var filter = (_a = Sys.Helpers.LdapUtil).FilterAnd.apply(_a, allFilters);
                    filter = Sys.Helpers.LdapUtil.FilterOr(filter, (_b = Sys.Helpers.LdapUtil).FilterOr.apply(_b, DeletedItemsFilter));
                    Controls.BrowsePRItems__.SetFilter(filter.toString());
                }
            }
            POItems.InitAddItemsToOrderButton = InitAddItemsToOrderButton;
            function StockItemsNumberBeforeEdit() {
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    var lineItemNumber = parseInt(item.GetValue("LineItemNumber__"), 10);
                    itemsMap[GetKey(item)] = lineItemNumber;
                    if (nextLineNumber < lineItemNumber) {
                        nextLineNumber = lineItemNumber;
                    }
                });
            }
            POItems.StockItemsNumberBeforeEdit = StockItemsNumberBeforeEdit;
            function ReNumberLineItemAdd(item, isEditing) {
                if (isEditing) {
                    var lineNumber = itemsMap[GetKey(item)];
                    if (lineNumber) {
                        item.SetValue("LineItemNumber__", lineNumber);
                    }
                    else {
                        nextLineNumber += 10;
                        item.SetValue("LineItemNumber__", nextLineNumber);
                    }
                }
                else {
                    // re-number items
                    Lib.Purchasing.Items.NumberLineItems();
                }
            }
            POItems.ReNumberLineItemAdd = ReNumberLineItemAdd;
            function ReNumberLineItemRemove(item, index, isEditing) {
                if (isEditing) {
                    if (!itemsMap[GetKey(item)]) {
                        nextLineNumber -= 10;
                        var lineItemNumber = parseInt(item.GetValue("LineItemNumber__"), 10);
                        var lineItemsCount = Controls.LineItems__.GetItemCount();
                        for (var i = index; i < lineItemsCount; i++) {
                            Controls.LineItems__.GetItem(i).SetValue("LineItemNumber__", lineItemNumber);
                            lineItemNumber += 10;
                        }
                    }
                }
                else {
                    // re-number items
                    Lib.Purchasing.Items.NumberLineItems();
                }
            }
            POItems.ReNumberLineItemRemove = ReNumberLineItemRemove;
            function DisableButtonsIfNeeded() {
                var disable = Lib.Purchasing.IsLineItemsEmpty() || (Variable.GetValueAsString("ErrorTransmitPunchoutOrderToVendor") === "true");
                Controls.Preview_purchase_order.SetDisabled(disable);
                Controls.DownloadCrystalReportsDataFile.SetDisabled(disable);
                Controls.Submit_.SetDisabled(disable);
                Controls.RequestPayment.SetDisabled(disable);
                Controls.SaveEditOrder.SetDisabled(disable);
            }
            POItems.DisableButtonsIfNeeded = DisableButtonsIfNeeded;
            function ComputePriceCondition(item) {
                var itemNumber = item.GetValue("ItemNumber__");
                var itemCurrency = CurrencyFactory.Get(item.GetValue("ItemCurrency__"));
                var localCurrency = CurrencyFactory.Get(Data.GetValue("LocalCurrency__"));
                var itemQuantity = item.GetValue("ItemQuantity__");
                var unitPrice = Lib.Purchasing.CatalogHelper.GetItemUnitPrice(itemNumber, Data.GetValue("VendorNumber__"), itemQuantity, item.GetValue("ItemUnitPrice__"), itemCurrency);
                var price = Lib.Purchasing.CatalogHelper.GetItemPrice(itemNumber, Data.GetValue("VendorNumber__"), itemQuantity, item.GetValue("ItemUnitPrice__"), itemCurrency);
                item.SetValue("ItemNetAmount__", price === null || price === void 0 ? void 0 : price.toNumber());
                item.SetValue("ItemNetAmountLocalCurrency__", new Sys.Decimal(price || 0).mul(item.GetValue("ItemExchangeRate__") || Data.GetValue("ExchangeRate__") || 1)
                    .toFixed(localCurrency.amountPrecision));
                if (!Sys.Helpers.IsEmpty(item.GetValue("ItemUnitPrice__"))) {
                    item.SetValue("ItemUnitPrice__", unitPrice === null || unitPrice === void 0 ? void 0 : unitPrice.toNumber());
                }
                POItems.Items.Unit_Price.CheckAndFillDependancies(item);
            }
            POItems.ComputePriceCondition = ComputePriceCondition;
            function GetKey(item) {
                var PRLineNumer = item.GetValue("PRLineNumber__");
                if (!PRLineNumer) {
                    // if it's a PRItem
                    PRLineNumer = item.GetValue("LineNumber__");
                }
                return item.GetValue("PRNumber__") + "###" + PRLineNumer;
            }
            function IsLineWithReception(item) {
                var todayDate = new Date();
                todayDate.setUTCHours(12, 0, 0, 0);
                var noGoodsReceiptNeeded = item.GetValue("NoGoodsReceipt__") == true && Sys.Helpers.Date.CompareDate(todayDate, item.GetValue("ItemRequestedDeliveryDate__")) > 0;
                return item.GetValue("ItemDeliveryComplete__") == true ||
                    item.GetValue("ItemReceivedAmount__") > 0 ||
                    item.GetValue("ItemTotalDeliveredQuantity__") > 0 ||
                    noGoodsReceiptNeeded;
            }
            POItems.IsLineWithReception = IsLineWithReception;
            function InitReturnManagementFields() {
                ManageReturnedQuantityVisibility();
            }
            function ManageReturnedQuantityVisibility() {
                if (Lib.Purchasing.ReturnManagement.IsEnabled()) {
                    var totalReturnedQuantity_1 = 0;
                    Sys.Helpers.Controls.ForEachTableRow(Controls.LineItems__, function (row) {
                        totalReturnedQuantity_1 += row.ItemReturnQuantity__.GetValue();
                    });
                    Controls.LineItems__.ItemReturnQuantity__.Hide(totalReturnedQuantity_1 === 0);
                }
            }
            POItems.ManageReturnedQuantityVisibility = ManageReturnedQuantityVisibility;
            function HasNoGoodsReceipt() {
                var firstNoGoodsReceipt = Sys.Helpers.Data.FindTableItem("LineItems__", function (line) {
                    return line.GetValue("NoGoodsReceipt__") === true;
                });
                return firstNoGoodsReceipt != null;
            }
            POItems.HasNoGoodsReceipt = HasNoGoodsReceipt;
            function HasSomeEmptyOpenAmount() {
                var firstEmptyOpenAmount = Sys.Helpers.Data.FindTableItem("LineItems__", function (item) {
                    return item.GetValue("ItemOpenAmount__") === null;
                });
                return firstEmptyOpenAmount != null;
            }
            POItems.HasSomeEmptyOpenAmount = HasSomeEmptyOpenAmount;
            //#region Items
            POItems.Items = {
                InitLayout: function () {
                    var buyerLogin = Controls.BuyerLogin__.GetValue() || "";
                    var isAdmin = Lib.P2P.IsAdminNotOwner();
                    var isBuyerOrBackUpOrAdmin = User.loginId.toUpperCase() === buyerLogin.toUpperCase()
                        || User.IsMemberOf(buyerLogin)
                        || User.IsBackupUserOf(buyerLogin)
                        || isAdmin;
                    POItems.showTax = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayTaxCode") && isBuyerOrBackUpOrAdmin;
                    var error = Lib.Purchasing.POItems.IsLineItemsInError();
                    Controls.LineItems__.SetAtLeastOneLine(false);
                    Controls.LineItems__.SetWidth("100%");
                    Controls.LineItems__.SetExtendableColumn("ItemDescription__");
                    Controls.LineItems__.ItemNumber__.Hide(true);
                    Controls.LineItems__.SupplierPartID__.Hide(false);
                    Controls.LineItems__.ItemCurrency__.Hide(!error);
                    Controls.LineItems__.ItemCompanyCode__.Hide(!error);
                    Controls.LineItems__.ItemTaxCode__.Hide(!POItems.showTax);
                    Controls.LineItems__.ItemTaxCode__.SetRequired(POItems.showTax);
                    InitReturnManagementFields();
                    Lib.P2P.InitItemTypeControl();
                    Lib.Purchasing.POItems.InitAddItemsToOrderButton();
                    var status = Data.GetValue("OrderStatus__");
                    if (!isAdmin && status === "To order") {
                        // PO in state "To Order": allow to remove items from the list
                        Controls.LineItems__.SetReadOnly(false); //warning : this row reset all the column to their initial readOnly state.
                        Controls.LineItems__.SetRowToolsHidden(false);
                        Controls.LineItems__.ItemNetAmount__.SetLabel("_ItemToOrderAmount");
                    }
                    else {
                        var isEditing = !(status === "To receive" && POItems.g_isEditing);
                        Controls.LineItems__.SetReadOnly(isEditing);
                        Controls.LineItems__.SetRowToolsHidden(isEditing);
                        Controls.LineItems__.HideTableRowDelete(isEditing);
                        Controls.ItemsButtons.Hide(isEditing);
                        Controls.AddItemsToOrderButton__.Hide(!POItems.g_isEditing);
                    }
                    POItems.Items.UpdateLayout();
                },
                ItemTypeDependenciesVisibilities: {
                    "ItemStartDate__": {
                        "AmountBased": false, "QuantityBased": false, "ServiceBased": true
                    },
                    "ItemEndDate__": {
                        "AmountBased": false, "QuantityBased": false, "ServiceBased": true
                    },
                    "ItemRequestedDeliveryDate__": {
                        "AmountBased": true, "QuantityBased": true, "ServiceBased": false
                    },
                    "ItemQuantity__": {
                        "AmountBased": false, "QuantityBased": true, "ServiceBased": true
                    },
                    "ItemUnitPrice__": {
                        "AmountBased": false, "QuantityBased": true, "ServiceBased": true
                    },
                    "ItemUnit__": {
                        VisibleCondition: function () {
                            return Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure");
                        },
                        "AmountBased": false, "QuantityBased": true, "ServiceBased": true
                    },
                    "ItemUndeliveredQuantity__": {
                        VisibleCondition: function (status) {
                            return (status === "To receive" || status === "Auto receive") && ProcessInstance.state < 100 && ProcessInstance.state !== 50;
                        },
                        "AmountBased": false, "QuantityBased": true, "ServiceBased": true
                    },
                    "ItemTotalDeliveredQuantity__": {
                        VisibleCondition: function (status) {
                            return status !== "To order" && status !== "To pay" && status !== "Canceled" && status !== "Rejected";
                        },
                        "AmountBased": false, "QuantityBased": true, "ServiceBased": true
                    },
                    "OrderableQuantity__": {
                        VisibleCondition: function (status) {
                            return (POItems.g_isEditing && status === "To receive") || status === "To order";
                        },
                        "AmountBased": false, "QuantityBased": true, "ServiceBased": true
                    },
                    "ItemOpenAmount__": {
                        VisibleCondition: function (status) {
                            return (status === "To receive" || status === "Auto receive") && ProcessInstance.state < 100 && ProcessInstance.state !== 50;
                        },
                        "AmountBased": true, "QuantityBased": false, "ServiceBased": false,
                        ShowAllColumnCellsWhenOneCellIsVisible: true
                    },
                    "ItemReceivedAmount__": {
                        VisibleCondition: function (status) {
                            return status !== "To order" && status !== "To pay" && status !== "Canceled" && status !== "Rejected";
                        },
                        "AmountBased": true, "QuantityBased": false, "ServiceBased": false,
                        ShowAllColumnCellsWhenOneCellIsVisible: true
                    },
                    "OrderableAmount__": {
                        VisibleCondition: function (status) {
                            return (POItems.g_isEditing && status === "To receive") || status === "To order";
                        },
                        "AmountBased": true, "QuantityBased": false, "ServiceBased": false
                    }
                },
                UpdateLayout: function () {
                    var isUnitOfMeasureEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure");
                    Controls.LineItems__.ItemUnit__.SetRequired(isUnitOfMeasureEnabled);
                    Sys.Helpers.Controls.ForEachTableRow(Controls.LineItems__, function (row) {
                        POItems.Items.PRNumber.SetLink(row);
                        if (Lib.Purchasing.Items.IsAmountBasedItem(row.GetItem())) {
                            row.ItemUnit__.SetRequired(false);
                        }
                        else {
                            row.ItemUnit__.SetRequired(isUnitOfMeasureEnabled);
                        }
                    });
                    Lib.Purchasing.Items.UpdateItemTypeDependencies(POItems.Items.ItemTypeDependenciesVisibilities, Data.GetValue("OrderStatus__"));
                    Controls.NumberOfLines__.SetValue(Controls.LineItems__.GetItemCount());
                    Controls.OpenOrderLocalCurrency__.SetLabel(Language.Translate("_OpenOrderLocalCurrency", true, Data.GetValue("LocalCurrency__")));
                },
                OnRefreshRow: function (index) {
                    var row = Controls.LineItems__.GetRow(index);
                    POItems.Items.PRNumber.SetLink(row);
                    var isPunchoutLine = Lib.Purchasing.IsPunchoutRow(row);
                    var isLocked = row.Locked__.IsChecked();
                    var isAmountBasedItem = Lib.Purchasing.Items.IsAmountBasedItem(row.GetItem());
                    var serviceBased = Lib.Purchasing.Items.IsServiceBasedItem(row.GetItem());
                    var status = Data.GetValue("OrderStatus__");
                    if (status === "To receive" && POItems.g_isEditing) {
                        var todayDate = new Date();
                        todayDate.setUTCHours(12, 0, 0, 0);
                        var lineWithReception = IsLineWithReception(row.GetItem());
                        var lineCompletedReceived = row.NoGoodsReceipt__.IsChecked() ? Sys.Helpers.Date.CompareDate(todayDate, row.ItemRequestedDeliveryDate__.GetValue()) > 0 : row.ItemDeliveryComplete__.IsChecked();
                        row.ItemRequestedDeliveryDate__.SetReadOnly(lineCompletedReceived);
                        row.ItemQuantity__.SetReadOnly(isAmountBasedItem || lineWithReception);
                        row.ItemUnitPrice__.SetReadOnly(isAmountBasedItem || lineWithReception || isLocked);
                        row.ItemNetAmount__.SetReadOnly(!isAmountBasedItem || lineWithReception || isLocked);
                        row.ItemDescription__.SetReadOnly(isPunchoutLine || lineWithReception || isLocked);
                        row.ItemNumber__.SetReadOnly(isPunchoutLine || lineWithReception || isLocked);
                        row.SupplierPartID__.SetReadOnly(isPunchoutLine || lineWithReception || isLocked);
                        Controls.LineItems__.HideTableRowDeleteForItem(index, lineWithReception);
                    }
                    else if (status === "To order" && !Lib.P2P.IsAdminNotOwner()) {
                        row.ItemNumber__.SetReadOnly(isPunchoutLine || isLocked);
                        row.SupplierPartID__.SetReadOnly(isPunchoutLine || isLocked);
                        row.ItemDescription__.SetReadOnly(isPunchoutLine || isLocked);
                        row.ItemStartDate__.SetReadOnly(!serviceBased);
                        row.ItemEndDate__.SetReadOnly(!serviceBased);
                        row.ItemRequestedDeliveryDate__.SetReadOnly(isPunchoutLine);
                        row.ItemQuantity__.SetReadOnly(isPunchoutLine || isAmountBasedItem);
                        row.ItemUnitPrice__.SetReadOnly(isPunchoutLine || isAmountBasedItem || isLocked);
                        row.ItemNetAmount__.SetReadOnly(isPunchoutLine || !isAmountBasedItem || isLocked);
                        row.ItemUnit__.SetReadOnly(isPunchoutLine || isLocked);
                        row.ItemTaxCode__.SetReadOnly(false);
                    }
                    row.ItemUnitPrice__.Hide(isAmountBasedItem);
                    row.ItemQuantity__.Hide(isAmountBasedItem);
                    row.ItemTotalDeliveredQuantity__.Hide(isAmountBasedItem);
                    row.ItemUndeliveredQuantity__.Hide(isAmountBasedItem);
                    row.ItemUnit__.Hide(isAmountBasedItem);
                    row.OrderableAmount__.Hide(!isAmountBasedItem);
                    row.ItemStartDate__.Hide(!serviceBased);
                    row.ItemEndDate__.Hide(!serviceBased);
                    row.ItemRequestedDeliveryDate__.Hide(serviceBased);
                    if (Lib.Purchasing.Punchout.PO.IsEnabled()) {
                        Lib.Purchasing.Punchout.PO.CheckPunchoutRowValidity(row);
                        if (Lib.Purchasing.IsMultiShipTo()) {
                            var deliveryAddressID = Controls.LineItems__.GetRow(0).ItemDeliveryAddressID__.GetValue();
                            Lib.Purchasing.Punchout.PO.CheckDeliveryAddressID(row, deliveryAddressID);
                        }
                    }
                    Lib.Purchasing.ShipTo.OnRefreshRow(index);
                },
                OnAddItem: function (item, index) {
                    Lib.Purchasing.POItems.ReNumberLineItemAdd(item, POItems.g_isEditing);
                    ComputePriceCondition(item);
                    // Update total amount
                    Lib.Purchasing.CheckPO.CheckAdditionalFeesAmounts()
                        .Then(Lib.Purchasing.Items.ComputeTotalAmount)
                        // Total amount has changed, so update downpayment values if the user has filled it
                        .Then(Purchasing.DownPayment.Calculate)
                        .Then(Lib.Purchasing.POItems.FillTaxSummary)
                        .Then(function () {
                        Lib.Purchasing.CheckPO.CheckLeadTime(item);
                        Lib.Purchasing.CheckPO.CheckItemsDeliveryDates({
                            specificItemIndex: index
                        });
                    })
                        .Then(DisableButtonsIfNeeded)
                        .Then(POItems.Items.UpdateLayout);
                },
                OnDeleteItem: function (item, index) {
                    if (index == 0) {
                        //First line is deleted, we need to check if the CompanyCode and Currency of this PO need to be changed
                        if (Controls.LineItems__.GetRow(1) && Controls.LineItems__.GetRow(1).GetItem()) {
                            var companyCode = Controls.LineItems__.GetRow(1).GetItem().GetValue("ItemCompanyCode__");
                            var currency = Controls.LineItems__.GetRow(1).GetItem().GetValue("ItemCurrency__");
                            Log.Info("First line CompanyCode : " + companyCode);
                            Log.Info("First line Currency : " + currency);
                            if (companyCode !== Controls.CompanyCode__.GetValue()) {
                                Data.SetValue("CompanyCode__", companyCode);
                                Data.SetValue("Currency__", currency);
                                Lib.Purchasing.POItems.SetLocalCurrency();
                                Lib.Purchasing.DownPayment.UpdateDownpaymentLabels(currency);
                                Lib.Purchasing.POItems.CheckDataCoherency();
                            }
                            else if (currency !== Controls.Currency__.GetValue()) {
                                Data.SetValue("Currency__", currency);
                                Lib.Purchasing.DownPayment.UpdateDownpaymentLabels(currency);
                                Lib.Purchasing.POItems.CheckDataCoherency();
                            }
                        }
                        if (Lib.Purchasing.IsMultiShipTo() && Lib.Purchasing.Punchout.PO.IsEnabled()) {
                            Lib.Purchasing.ShipTo.CheckAllSameDeliveryAddress();
                        }
                    }
                    if (!Lib.Purchasing.IsMultiShipTo() && (Lib.P2P.Inventory.HasReplenishmentItems(Data.GetTable("LineItems__")) || Lib.P2P.Inventory.IsReplenishmentItem(item))) {
                        Lib.Purchasing.ShipTo.SetHeaderToFirstReplenishmentAdress();
                        Lib.Purchasing.ShipTo.UpdateLayout(Data.GetValue("OrderStatus__") !== "To order" || Lib.P2P.IsAdminNotOwner() || (!Lib.Purchasing.IsMultiShipTo() && Lib.P2P.Inventory.HasReplenishmentItems(Data.GetTable("LineItems__"))));
                    }
                    Lib.Purchasing.POItems.ReNumberLineItemRemove(item, index, POItems.g_isEditing);
                    ComputePriceCondition(item);
                    // Update total amount
                    Lib.Purchasing.CheckPO.CheckAdditionalFeesAmounts()
                        .Then(Lib.Purchasing.Items.ComputeTotalAmount)
                        // Total amount has changed, so update downpayment values if the user has filled it
                        .Then(Purchasing.DownPayment.Calculate)
                        .Then(Lib.Purchasing.POItems.FillTaxSummary)
                        .Then(DisableButtonsIfNeeded)
                        .Then(POItems.Items.UpdateLayout);
                },
                Description: {
                    OnChange: function () {
                        var CurrentLineRow = this.GetRow();
                        if (Lib.Purchasing.Punchout.PO.IsEnabled()) {
                            Lib.Purchasing.Punchout.PO.CheckPunchoutRowValidity(CurrentLineRow);
                            if (Lib.Purchasing.IsMultiShipTo()) {
                                var deliveryAddressID = Controls.LineItems__.GetRow(0).ItemDeliveryAddressID__.GetValue();
                                Lib.Purchasing.Punchout.PO.CheckDeliveryAddressID(CurrentLineRow, deliveryAddressID);
                            }
                        }
                    }
                },
                ItemQuantity: {
                    OnChange: function () {
                        var currentLineItem = this.GetItem();
                        if (Lib.Purchasing.CheckPO.CheckItemQuantity(currentLineItem)) {
                            // This is correct as long as we don't allow quantity edition after a partial reception on the line
                            currentLineItem.SetValue("ItemUndeliveredQuantity__", currentLineItem.GetValue("NoGoodsReceipt__") ? 0 : currentLineItem.GetValue("ItemQuantity__"));
                            POItems.Items.Unit_Price.OnChange.call(this);
                        }
                        else {
                            Controls.SaveEditOrder.SetDisabled(!!Process.ShowFirstError());
                        }
                    }
                },
                Unit_Price: {
                    CheckAndFillDependancies: function (item) {
                        var errorMsg = "";
                        var warningMsg = "";
                        var orderPrice = item.GetValue("ItemUnitPrice__");
                        if (Sys.Helpers.IsEmpty(orderPrice)) {
                            errorMsg = "This field is required!";
                        }
                        else if (orderPrice < 0) {
                            errorMsg = "_The unit price can't be negative";
                        }
                        else {
                            var orderQty = item.GetValue("ItemQuantity__") || 0;
                            var requestedUnitPrice = item.GetValue("ItemRequestedUnitPrice__") || 0;
                            var remainingQtyToOrder = (item.GetValue("ItemRequestedQuantity__") || 0) - orderQty;
                            var customChangeAllowed = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.IsItemUnitPriceChangeAllowed", item);
                            var changeAllowed = customChangeAllowed || (customChangeAllowed === null && Lib.Purchasing.CheckPO.IsItemPriceTolerated(requestedUnitPrice, requestedUnitPrice, orderPrice));
                            if (!changeAllowed) {
                                errorMsg = "_The price variance between purchase order and purchase requisition exceeds the tolerance limit";
                            }
                            else if (remainingQtyToOrder > 0) {
                                var itemCurrency = CurrencyFactory.Get(item.GetValue("ItemCurrency__"));
                                var remainingQtyUnitPrice = Lib.Purchasing.CatalogHelper.GetItemUnitPrice(item.GetValue("ItemNumber__"), Data.GetValue("VendorNumber__"), remainingQtyToOrder, requestedUnitPrice, itemCurrency);
                                var remainingUnitPriceAllowed = new Sys.Decimal(remainingQtyUnitPrice || 0).lessThanOrEqualTo(requestedUnitPrice);
                                if (!remainingUnitPriceAllowed) {
                                    warningMsg = Language.Translate("_The unit price ({0}) of the {1} remaining items to order will exceed the validated unit price of the purchase order ({2})", false, remainingQtyUnitPrice === null || remainingQtyUnitPrice === void 0 ? void 0 : remainingQtyUnitPrice.toNumber(), remainingQtyToOrder, requestedUnitPrice);
                                }
                            }
                        }
                        item.SetError("ItemUnitPrice__", errorMsg);
                        item.SetWarning("ItemUnitPrice__", warningMsg);
                        Controls.SaveEditOrder.SetDisabled(!!Process.ShowFirstError());
                        if (errorMsg == "") {
                            TotalNetAmount.Set();
                            POItems.Items.CalculateTaxAmount(item);
                        }
                    },
                    OnChange: function () {
                        var item = this.GetItem();
                        ComputePriceCondition(item);
                    }
                },
                NetAmount: {
                    OnChange: function () {
                        var item = this.GetItem();
                        var orderPrice = item.GetValue("ItemNetAmount__");
                        item.SetValue("ItemQuantity__", orderPrice);
                        item.SetValue("ItemUndeliveredQuantity__", orderPrice);
                        if (Sys.Helpers.IsEmpty(orderPrice)) {
                            item.SetError("ItemNetAmount__", "This field is required!");
                        }
                        else if (orderPrice < 0 || (orderPrice == 0 && Lib.Purchasing.Items.IsAmountBasedItem(item))) {
                            item.SetError("ItemNetAmount__", "_The unit price can't be negative");
                        }
                        else {
                            var requisitionPrice = item.GetValue("ItemRequestedAmount__");
                            var orderablePrice = item.GetValue("OrderableAmount__");
                            var customChangeAllowed = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.IsItemUnitPriceChangeAllowed", item);
                            var changeAllowed = customChangeAllowed || (customChangeAllowed === null && Lib.Purchasing.CheckPO.IsTotalPriceTolerated(requisitionPrice, orderablePrice, orderPrice));
                            if (!changeAllowed) {
                                item.SetError("ItemNetAmount__", "_The price variance between purchase order and purchase requisition exceeds the tolerance limit");
                            }
                            else {
                                item.SetError("ItemNetAmount__", "");
                                item.SetError("PRNumber__", "");
                                item.SetValue("ItemOpenAmount__", orderPrice);
                                item.SetValue("ItemNetAmountLocalCurrency__", Sys.Helpers.Round(new Sys.Decimal(orderPrice)
                                    .mul(item.GetValue("ItemExchangeRate__") || Data.GetValue("ExchangeRate__") || 0), CurrencyFactory.Get(Data.GetValue("LocalCurrency__")).amountPrecision).toNumber());
                                TotalNetAmount.Set();
                                POItems.Items.CalculateTaxAmount(item);
                            }
                        }
                        Controls.SaveEditOrder.SetDisabled(!!Process.ShowFirstError());
                    }
                },
                PRNumber: {
                    SetLink: function (row) {
                        row.PRNumber__.DisplayAs({ type: "Link" });
                    },
                    OnClick: function () {
                        Controls.LineItems__.PRNumber__.Wait(true);
                        var options = {
                            table: "CDNAME#Purchase requisition V2",
                            filter: "RequisitionNumber__=" + this.GetValue(),
                            attributes: ["MsnEx", "ValidationURL"],
                            sortOrder: null,
                            maxRecords: 1
                        };
                        Sys.GenericAPI.PromisedQuery(options)
                            .Then(function (queryResult) {
                            if (queryResult.length == 1) {
                                Process.OpenLink(queryResult[0].ValidationURL + "&OnQuit=Close");
                            }
                            else {
                                Popup.Alert("_Purchase requisition not found or access denied", false, null, "_Purchase requisition not found title");
                            }
                        })
                            .Catch(function ( /*error: string*/) {
                            Popup.Alert("_Purchase requisition not found or access denied", false, null, "_Purchase requisition not found title");
                        })
                            .Finally(function () {
                            Controls.LineItems__.PRNumber__.Wait(false);
                        });
                    }
                },
                TaxCode: {
                    Attributes: "TaxCode__|Description__|TaxRate__|NonDeductibleTaxRate__",
                    OnSelectItem: function (selectedItem) {
                        var item = this.GetItem();
                        item.SetValue("ItemTaxRate__", selectedItem.GetValue("TaxRate__"));
                        item.SetValue("NonDeductibleTaxRate__", selectedItem.GetValue("NonDeductibleTaxRate__"));
                        POItems.Items.CalculateTaxAmount(item);
                    }
                },
                GLAccount: (function () {
                    var timeoutID = null;
                    return {
                        OnSelectItem: function (item) {
                            var _this = this;
                            if (timeoutID) {
                                clearTimeout(timeoutID);
                            }
                            timeoutID = setTimeout(function () {
                                var currentRow = _this.GetRow();
                                if (Lib.Budget.IsEnabled() && Sys.Helpers.IsEmpty(item.GetValue("Group__"))) {
                                    _this.SetError("_No expense category associated with this GL Account");
                                }
                                currentRow.ItemGroup__.SetValue(item.GetValue("Group__"));
                                Controls.SaveEditOrder.SetDisabled(!!Process.ShowFirstError());
                                timeoutID = null;
                            });
                        },
                        OnChange: function () {
                            var _this = this;
                            if (!timeoutID) {
                                timeoutID = setTimeout(function () {
                                    var currentRow = _this.GetRow();
                                    currentRow.ItemGroup__.SetValue(null);
                                    timeoutID = null;
                                });
                            }
                        }
                    };
                })(),
                CalculateTaxAmount: function (item) {
                    var netAmount = item.GetValue("ItemNetAmount__") || item.GetValue("Price__") || 0;
                    item.SetValue("ItemTaxAmount__", new Sys.Decimal(netAmount).mul(item.GetValue("ItemTaxRate__") || 0).div(100).toNumber());
                    return Lib.Purchasing.POItems.FillTaxSummary();
                }
            };
            var TotalNetAmount = {
                Set: function () {
                    Log.Info("Set a new PO total net amount...");
                    // Save value of down payment amount before auto reset when setting total amount
                    Lib.Purchasing.Items.ComputeTotalAmount();
                    if (Lib.Purchasing.DownPayment.CurrentMasterControlName && !POItems.g_isEditing) {
                        Lib.Purchasing.DownPayment.Calculate();
                    }
                },
                OnChange: function () {
                    Lib.Purchasing.DownPayment.Calculate();
                }
            };
            //#endregion
        })(POItems = Purchasing.POItems || (Purchasing.POItems = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
