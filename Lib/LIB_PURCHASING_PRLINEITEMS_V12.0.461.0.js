/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
/*global localStorage*/
/// <reference path="../../PAC/Purchasing V2/Purchase Requisition process V2/typings_withDeleted/Controls_Purchase_Requisition_process_V2/index.d.ts"/>
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_PRLineItems_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_ShipTo_Client_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper_V12.0.461.0",
    "Lib_Purchasing_Punchout_PR_Client_V12.0.461.0",
    "Lib_Purchasing_Vendor_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Controls",
    "Sys/Sys_Helpers_Promise_tools",
    "Sys/Sys_OnDemand_Users",
    "Sys/Sys_GenericAPI_Client",
    "Sys/Sys_TechnicalData"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        ////////
        // Override std methods with the web specificities
        Lib.Purchasing.Items.PR.FillBuyerField = Sys.Helpers.Wrap(Lib.Purchasing.Items.PR.FillBuyerField, function (originalFn, item, buyerLogin, itemIndex) {
            return originalFn(item, buyerLogin, itemIndex).Then(function () {
                if (typeof itemIndex == "undefined") {
                    itemIndex = -1;
                }
                if (itemIndex == 0) {
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                }
                Purchasing.PRLineItems.Buyer.DelayCheckBuyers();
            });
        });
        ///////
        function AutoFillLineItemsWithEmptyValue(fieldName, value, options) {
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                var _a;
                if (!Lib.Purchasing.IsLineItemEmpty(item) && !item.GetValue(fieldName)) {
                    var extraCondition = options && options.extraCondition ? options.extraCondition(item) : true;
                    if (extraCondition) {
                        item.SetValue(fieldName, value);
                        (_a = options === null || options === void 0 ? void 0 : options.extraSetter) === null || _a === void 0 ? void 0 : _a.call(options, item);
                        Log.Info("Auto filled ".concat(fieldName, " of line item with index '").concat(i, "'"));
                    }
                }
            });
        }
        Purchasing.AutoFillLineItemsWithEmptyValue = AutoFillLineItemsWithEmptyValue;
        function RedirectToPunchout(items) {
            if (items && items.length == 1) {
                var item = items[0];
                if (item.punchoutConfig) {
                    Lib.Purchasing.Punchout.PR.OpenPunchoutSite(item.punchoutConfig, item.selectedItem);
                    return true;
                }
            }
            return false;
        }
        Purchasing.RedirectToPunchout = RedirectToPunchout;
        function CatalogCallback(storageValue) {
            Log.Info("Storage changed: " + JSON.stringify({
                "type": storageValue.type,
                "key": storageValue.key,
                "oldValue": storageValue.oldValue,
                "newValue": storageValue.newValue
            }));
            if (storageValue.newValue) {
                try {
                    var items = JSON.parse(storageValue.newValue);
                    if (!RedirectToPunchout(items)) {
                        Purchasing.PRLineItems.NumberOrDescription.OnSelectItems(items);
                    }
                    localStorage.removeItem(storageValue.key);
                }
                catch (e) {
                    Log.Error("INVALID NewValue : " + e.message);
                }
            }
        }
        Purchasing.CatalogCallback = CatalogCallback;
        function LoadItemsPriceCondition() {
            if (Data.GetValue("RequisitionStatus__").toUpperCase() === "TO COMPLETE" && !Lib.Purchasing.LayoutPR.IsReadOnly()) {
                var itemSelector_1 = [];
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    if (item.GetValue("ItemNumber__") && item.GetValue("VendorNumber__")) {
                        itemSelector_1.push({
                            ItemNumber__: item.GetValue("ItemNumber__"),
                            VendorNumber__: item.GetValue("VendorNumber__")
                        });
                    }
                });
                if (itemSelector_1.length > 0) {
                    return Lib.Purchasing.CatalogHelper.PopulateCacheConditionedPricingData(itemSelector_1)
                        .Then(function (hasChanged) {
                        if (hasChanged) {
                            for (var i = 0; i < Purchasing.PRLineItems.Count(); i++) {
                                Purchasing.PRLineItems.ComputeItemAmount(i);
                            }
                        }
                    });
                }
                return Sys.Helpers.Promise.Resolve();
            }
            return Sys.Helpers.Promise.Resolve();
        }
        Purchasing.LoadItemsPriceCondition = LoadItemsPriceCondition;
        Purchasing.PRLineItems = {
            displayNoMoreLinesWarning: true,
            fromUserChange: false,
            set leaveEmptyLine(value) {
                Lib.Purchasing.Items.PR.leaveEmptyLine = value;
            },
            get leaveEmptyLine() {
                return Lib.Purchasing.Items.PR.leaveEmptyLine;
            },
            LOCKED_FIELDS: ["ITEMUNITPRICE__", "ITEMNUMBER__", "SUPPLIERPARTID__", "ITEMDESCRIPTION__", "VENDORNAME__", "VENDORNUMBER__", "ITEMCURRENCY__", "ITEMUNIT__", "ITEMUNITDESCRIPTION__", "SUPPLYTYPENAME__", "SUPPLYTYPEID__", "LOCKED__"],
            // Used in LineItemsMissingBudgetKey to check that an item has a missing budget key
            REQUIRED_BUDGET_KEY_FIELDS: ["ItemCostCenterId__", "ItemGroup__", "CostType__"],
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
                }
            },
            DataToCopyOnAddItem: {
                "Warehouse": {
                    IsEmpty: function (newItem) {
                        return Sys.Helpers.IsEmpty(newItem.GetValue("WarehouseID__")) && Sys.Helpers.IsEmpty(newItem.GetValue("WarehouseName__"));
                    },
                    CopyData: function ( /*newItem: Typing.Purchase_Requisition_process_V2.Data.LineItems__.Item, previousItem: Typing.Purchase_Requisition_process_V2.Data.LineItems__.Item*/) {
                    }
                },
                "CostCenter": {
                    IsEmpty: function (newItem) {
                        return Sys.Helpers.IsEmpty(newItem.GetValue("ItemCostCenterId__")) && Sys.Helpers.IsEmpty(newItem.GetValue("ItemCostCenterName__"));
                    },
                    CopyData: function (newItem, previousItem) {
                        if (previousItem && previousItem.GetValue("ItemCostCenterId__") && previousItem.GetValue("ItemCostCenterName__")) {
                            newItem.SetValue("ItemCostCenterId__", previousItem.GetValue("ItemCostCenterId__"));
                            newItem.SetValue("ItemCostCenterName__", previousItem.GetValue("ItemCostCenterName__"));
                        }
                        else {
                            newItem.SetValue("ItemCostCenterId__", Lib.P2P.UserProperties.GetValues(User.loginId).CostCenter__);
                            newItem.SetValue("ItemCostCenterName__", Lib.P2P.UserProperties.GetValues(User.loginId).CostCenter__Description__);
                        }
                    }
                },
                "Vendor": {
                    IsEmpty: function (newItem) {
                        return Sys.Helpers.IsEmpty(newItem.GetValue("VendorNumber__")) && Sys.Helpers.IsEmpty(newItem.GetValue("VendorName__"));
                    },
                    CopyData: function (newItem, previousItem) {
                        if (Variable.GetValueAsString("lastExtractedVendorNumber") && Variable.GetValueAsString("lastExtractedVendorName")) {
                            newItem.SetValue("VendorNumber__", Variable.GetValueAsString("lastExtractedVendorNumber"));
                            newItem.SetValue("VendorName__", Variable.GetValueAsString("lastExtractedVendorName"));
                        }
                        else if (previousItem && previousItem.GetValue("VendorNumber__") && previousItem.GetValue("VendorName__") && !(newItem.GetValue("ItemNumber__") && newItem.GetValue("WarehouseID__"))) {
                            newItem.SetValue("VendorNumber__", previousItem.GetValue("VendorNumber__"));
                            newItem.SetValue("VendorName__", previousItem.GetValue("VendorName__"));
                        }
                    }
                },
                "FreeDimension1": {
                    IsEmpty: function (newItem) {
                        return Sys.Helpers.IsEmpty(newItem.GetValue("FreeDimension1__")) && Sys.Helpers.IsEmpty(newItem.GetValue("FreeDimension1ID__"));
                    },
                    CopyData: function (newItem, previousItem) {
                        if (previousItem && previousItem.GetValue("FreeDimension1__") && previousItem.GetValue("FreeDimension1ID__")) {
                            newItem.SetValue("FreeDimension1__", previousItem.GetValue("FreeDimension1__"));
                            newItem.SetValue("FreeDimension1ID__", previousItem.GetValue("FreeDimension1ID__"));
                        }
                    }
                },
                "ProjectCode": {
                    IsEmpty: function (newItem) {
                        return Sys.Helpers.IsEmpty(newItem.GetValue("ProjectCodeDescription__")) && Sys.Helpers.IsEmpty(newItem.GetValue("ProjectCode__"));
                    },
                    CopyData: function (newItem, previousItem) {
                        if (previousItem && previousItem.GetValue("ProjectCodeDescription__") && previousItem.GetValue("ProjectCode__")) {
                            newItem.SetValue("ProjectCodeDescription__", previousItem.GetValue("ProjectCodeDescription__"));
                            newItem.SetValue("ProjectCode__", previousItem.GetValue("ProjectCode__"));
                        }
                    }
                },
                "Currency": {
                    IsEmpty: function (newItem) {
                        return Sys.Helpers.IsEmpty(newItem.GetValue("ItemCurrency__")) && Sys.Helpers.IsEmpty(newItem.GetError("ItemCurrency__")) && newItem.GetError("ItemCurrency__") !== "The value could not be resolve";
                    },
                    CopyData: function (newItem, previousItem) {
                        newItem.SetValue("ItemCurrency__", (previousItem && previousItem.GetValue("ItemCurrency__")) || Variable.GetValueAsString("companyCurrency"));
                        Purchasing.PRLineItems.ExchangeRate.Set(newItem);
                    }
                },
                "UOM": {
                    IsEmpty: function (newItem) {
                        var quantityBased = Lib.Purchasing.Items.IsQuantityBasedItem(newItem);
                        return Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure") && quantityBased && Sys.Helpers.IsEmpty(newItem.GetValue("ItemUnit__"));
                    },
                    CopyData: function (newItem, previousItem) {
                        newItem.SetValue("ItemUnit__", (previousItem && previousItem.GetValue("ItemUnit__")) || Sys.Parameters.GetInstance("PAC").GetParameter("DefaultUnitOfMeasure"));
                    }
                }
            },
            GeneratePunchoutItemIn: function (resultData) {
                //@ts-ignore
                // eslint-disable-next-line no-undef
                var parser = new DOMParser();
                var xmlTemplate = '<ItemIn>\n\
	<ItemID>\n\t\t<SupplierPartID/>\n\t\t<SupplierPartAuxiliaryID/>\n\t</ItemID>\n\
	<ItemDetail>\n\
		<UnitPrice>\n\t\t\t<Money currency=""/>\n\t\t</UnitPrice>\n\
		<Description xml:lang="en-US" />\n\
		<UnitOfMeasure/>\n\
		<Classification domain="UNSPSC"/>\n\
		<ManufacturerPartID/>\n\
		<ManufacturerName/>\n\
	</ItemDetail>\n\
</ItemIn>';
                var itemInNode = parser.parseFromString(xmlTemplate, "application/xml");
                itemInNode.getElementsByTagName("SupplierPartID")[0].textContent = resultData.GetValue("ITEMNUMBER__") || "";
                var moneyNode = itemInNode.getElementsByTagName("Money")[0];
                if (Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled()) {
                    moneyNode.setAttribute("currency", resultData.GetValue("ITEMNUMBER__.CURRENCY__") || "");
                    moneyNode.textContent = resultData.GetValue("ITEMNUMBER__.UNITPRICE__") || "";
                    itemInNode.getElementsByTagName("SupplierPartAuxiliaryID")[0].textContent = resultData.GetValue("ITEMNUMBER__.SUPPLIERPARTAUXID__") || "";
                    itemInNode.getElementsByTagName("Description")[0].textContent = resultData.GetValue("LONGDESCRIPTION__") || "";
                }
                else {
                    moneyNode.setAttribute("currency", resultData.GetValue("ITEMCURRENCY__") || "");
                    moneyNode.textContent = resultData.GetValue("ITEMUNITPRICE__") || "";
                    itemInNode.getElementsByTagName("SupplierPartAuxiliaryID")[0].textContent = resultData.GetValue("ITEMSUPPLIERPARTAUXID__") || "";
                    itemInNode.getElementsByTagName("Description")[0].textContent = resultData.GetValue("ITEMLONGDESCRIPTION__") || "";
                }
                itemInNode.getElementsByTagName("UnitOfMeasure")[0].textContent = resultData.GetValue("UNITOFMEASURE__") || "";
                itemInNode.getElementsByTagName("Classification")[0].textContent = resultData.GetValue("UNSPSC__") || "";
                itemInNode.getElementsByTagName("ManufacturerPartID")[0].textContent = resultData.GetValue("MANUFACTURERPARTID__") || "";
                itemInNode.getElementsByTagName("ManufacturerName")[0].textContent = resultData.GetValue("MANUFACTURERNAME__") || "";
                var res = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.CustomizeTransparentPunchoutXml", itemInNode, resultData);
                if (res === false) {
                    // UE said no CXML for this item
                    return "";
                }
                return itemInNode.firstChild.outerHTML;
            },
            // Generate punchout cXML if vendor supports transparent punchout
            GenerateCXmlIfNeeded: function (tableItem, selectedItem) {
                Lib.Purchasing.Punchout.LoadConfigs()
                    .Then(function (punchoutSites) {
                    var vendorNumber = selectedItem.GetValue(Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled() ? "ITEMNUMBER__.VENDORNUMBER__" : "VENDORNUMBER__");
                    if (!Sys.Helpers.IsEmpty(vendorNumber) && punchoutSites && Sys.Helpers.Array.Find(punchoutSites, function (punchoutSite) {
                        return punchoutSite.SupplierID__ == vendorNumber && punchoutSite.TransparentPunchout__ == "1";
                    })) {
                        var cxml = Purchasing.PRLineItems.GeneratePunchoutItemIn(selectedItem);
                        tableItem.SetValue("ItemInCxml__", cxml);
                    }
                });
            },
            OnAddItem: function (item, index) {
                var promisesToWait = [];
                var previousItem = Sys.Helpers.IsNumeric(index) && index > 0 ? Data.GetTable("LineItems__").GetItem(index - 1) : null;
                //default Value
                Lib.Purchasing.ShipTo.OnAddItem(item, previousItem);
                for (var axe in Purchasing.PRLineItems.DataToCopyOnAddItem) {
                    if (Object.prototype.hasOwnProperty.call(Purchasing.PRLineItems.DataToCopyOnAddItem, axe)) {
                        if (Purchasing.PRLineItems.DataToCopyOnAddItem[axe].IsEmpty(item)) {
                            Purchasing.PRLineItems.DataToCopyOnAddItem[axe].CopyData(item, previousItem);
                        }
                    }
                }
                var isReplenishment = Lib.P2P.Inventory.IsReplenishmentRequest();
                item.SetValue("IsReplenishmentItem__", isReplenishment);
                if (isReplenishment) {
                    item.SetValue("WarehouseID__", Data.GetValue("WarehouseID__"));
                    item.SetValue("WarehouseName__", Data.GetValue("WarehouseName__"));
                }
                if (Lib.Purchasing.Vendor.IsSingleVendorMode()) {
                    item.SetValue("VendorName__", Lib.Purchasing.Vendor.GetSingleVendorName());
                    item.SetValue("VendorNumber__", Lib.Purchasing.Vendor.GetSingleVendorNumber());
                }
                //if PRLineItems.leaveEmptyLine is here because when comming from clipboard action we don't want to set a default SupplyType when the user explicitly put nothing
                if (Purchasing.PRLineItems.leaveEmptyLine && previousItem && Sys.Helpers.IsEmpty(item.GetValue("SupplyTypeID__")) && Sys.Helpers.IsEmpty(item.GetError("SupplyTypeName__"))) {
                    item.SetValue("SupplyTypeID__", previousItem.GetValue("SupplyTypeID__"));
                    promisesToWait.push(Purchasing.PRLineItems.SupplyType.FillInducedFields(item));
                    promisesToWait.push(Purchasing.PRLineItems.SupplyType.FillBuyerAndRecipient(item, index));
                }
                else if (Sys.Helpers.IsEmpty(item.GetValue("CostType__")) && !Sys.Helpers.IsEmpty(item.GetValue("ItemGLAccount__"))) {
                    promisesToWait.push(Lib.P2P.fillCostTypeFromGLAccount(item, "ItemGLAccount__")
                        .Then(function (resultItem) { return Sys.Helpers.Promise.All([
                        Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, resultItem),
                        Lib.Purchasing.LayoutPR.DelayRebuildWorkflow()
                    ]); }));
                }
                Lib.Purchasing.CheckPR.RequiredFields.CheckItemsDeliveryDates(Lib.Purchasing.LayoutPR.GetCurrentLayout(), {
                    specificItemIndex: index,
                    ignoreRequiredCheck: true
                });
                Lib.Purchasing.CheckPR.CheckOverorderedItem(item);
                promisesToWait.push(Purchasing.PRLineItems.UpdateHasCapex());
                promisesToWait.push(Purchasing.PRLineItems.Buyer.DelayCheckBuyers());
                Purchasing.PRLineItems.ComputeItemAmount(index);
                Purchasing.PRLineItems.SetLastLineItemType(item, index);
                promisesToWait.push(LoadItemsPriceCondition());
                promisesToWait.push(Lib.Purchasing.LayoutPR.UpdateLayout());
                return Sys.Helpers.Promise.All(promisesToWait);
            },
            SetLastLineItemType: function (item, index) {
                var lastIndex = Controls.LineItems__.GetItemCount() - 1;
                if (index < lastIndex) {
                    var lastItem = Controls.LineItems__.GetItem(lastIndex);
                    if (Lib.Purchasing.IsLineItemEmpty(lastItem)) {
                        lastItem.SetValue("ItemType__", item.GetValue("ItemType__"));
                    }
                }
                if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                    Lib.Purchasing.Items.UpdateItemTypeDependencies(Purchasing.PRLineItems.ItemTypeDependenciesVisibilities);
                }
            },
            SetRowButtonsVisibility: function (rowIndex) {
                var row = Controls.LineItems__.GetRow(rowIndex);
                var item = row.GetItem();
                if (item && Lib.Purchasing.IsLineItemEmpty(item)) {
                    Controls.LineItems__.HideTableRowDeleteForItem(rowIndex, true);
                    Controls.LineItems__.HideTableRowButtonDuplicateForItem(rowIndex, true);
                }
                else if (Lib.Purchasing.IsPunchoutItem(item)) { // we shall not duplicate a punchout line
                    Controls.LineItems__.HideTableRowDeleteForItem(rowIndex, false);
                    Controls.LineItems__.HideTableRowButtonDuplicateForItem(rowIndex, true);
                }
                else {
                    Controls.LineItems__.HideTableRowDeleteForItem(rowIndex, false);
                    Controls.LineItems__.HideTableRowButtonDuplicateForItem(rowIndex, false);
                }
            },
            OnRefreshRow: function (index) {
                var row = Controls.LineItems__.GetRow(index);
                var isReadOnly = Lib.Purchasing.LayoutPR.IsReadOnly();
                var isRequesterStep = Lib.Purchasing.LayoutPR.IsRequesterStep();
                var isBuyer = Lib.Purchasing.LayoutPR.IsBuyer();
                var isVendorReadonly = !isRequesterStep && !isBuyer;
                var isPunchoutLineRow = Lib.Purchasing.IsPunchoutRow(row);
                var isExternalPunchoutLineRow = isPunchoutLineRow && row.ItemOrigin__.GetValue() === "ExternalCatalog"; // punchout but not transparent punchout
                var isLocked = row.Locked__.IsChecked();
                var quantityBased = Lib.Purchasing.Items.IsQuantityBasedItem(row.GetItem());
                var itemTakenFromStock = Lib.P2P.Inventory.IsItemTakenFromStock(row.GetItem());
                row.ItemType__.SetReadOnly(!isRequesterStep || isPunchoutLineRow || isLocked);
                row.ItemNumber__.SetReadOnly(!isRequesterStep || isPunchoutLineRow || isLocked);
                row.SupplierPartID__.SetReadOnly(!isRequesterStep || isPunchoutLineRow || isLocked);
                row.ItemDescription__.SetReadOnly(!isRequesterStep || isPunchoutLineRow || isLocked);
                row.VendorName__.SetReadOnly(isReadOnly || isVendorReadonly || isPunchoutLineRow || isLocked);
                row.VendorNumber__.SetReadOnly(isReadOnly || isVendorReadonly || isPunchoutLineRow || isLocked);
                row.ItemCurrency__.SetReadOnly(!isRequesterStep || isPunchoutLineRow || isLocked);
                row.ItemNetAmount__.SetReadOnly(!isRequesterStep || isPunchoutLineRow || isLocked || quantityBased);
                row.ItemNetAmount__.SetRequired(!quantityBased);
                if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                    row.ItemQuantity__.Hide(!quantityBased);
                    row.ItemQuantity__.SetReadOnly(!isRequesterStep || isExternalPunchoutLineRow || !quantityBased); // Quantity should be editable for transparent punchout
                    row.ItemQuantity__.SetRequired(quantityBased);
                    row.ItemUnitPrice__.Hide(!quantityBased);
                    row.ItemUnitPrice__.SetReadOnly(!isRequesterStep || isPunchoutLineRow || isLocked || !quantityBased);
                    row.ItemUnitPrice__.SetRequired(quantityBased);
                }
                row.ItemOrderedAmount__.Hide(quantityBased);
                row.ItemOrderedQuantity__.Hide(!quantityBased);
                row.CanceledAmount__.Hide(quantityBased);
                row.CanceledQuantity__.Hide(!quantityBased);
                if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                    row.ItemUnit__.Hide(!quantityBased);
                    row.ItemUnit__.SetReadOnly(!isRequesterStep || isPunchoutLineRow || isLocked);
                }
                row.ItemUnitDescription__.SetReadOnly(!isRequesterStep || isPunchoutLineRow || isLocked);
                row.SupplyTypeID__.SetReadOnly(!isRequesterStep || isLocked);
                row.SupplyTypeName__.SetReadOnly(!isRequesterStep || isLocked);
                if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                    var serviceBased = Lib.Purchasing.Items.IsServiceBasedItem(row.GetItem());
                    row.ItemStartDate__.Hide(!serviceBased);
                    row.ItemStartDate__.SetReadOnly(!isRequesterStep || !serviceBased);
                    row.ItemStartDate__.SetRequired(serviceBased);
                    row.ItemEndDate__.Hide(!serviceBased);
                    row.ItemEndDate__.SetReadOnly(!isRequesterStep || !serviceBased);
                    row.ItemEndDate__.SetRequired(serviceBased);
                    row.ItemRequestedDeliveryDate__.Hide(serviceBased);
                }
                row.WarehouseName__.Hide(!itemTakenFromStock);
                Purchasing.PRLineItems.SetRowButtonsVisibility(index);
                Purchasing.PRLineItems.Budget.Refresh(index);
                Purchasing.PRLineItems.CheckItemBudgetVisibility(index);
                Purchasing.PRLineItems.Recipient.OnRefreshRow(index);
                Purchasing.PRLineItems.Buyer.OnRefreshRow(index);
                Purchasing.PRLineItems.PONumber.SetLink(row);
                Lib.Purchasing.ShipTo.OnRefreshRow(index);
            },
            OnDeleteItem: function (item, index) {
                if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                    Lib.Purchasing.Items.UpdateItemTypeDependencies(Purchasing.PRLineItems.ItemTypeDependenciesVisibilities);
                }
                Lib.Purchasing.CheckPR.CheckOverorderedItem(item);
                Purchasing.PRLineItems.ComputeAmounts();
                Purchasing.PRLineItems.Buyer.DelayCheckBuyers();
                if (index == 0) {
                    Log.Info("Rebuilding workflow as first line has been deleted...");
                    // We rebuild the workflow as the buyer of the first line is used and this line has been removed
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                }
                Purchasing.PRLineItems.UpdateHasCapex();
                Purchasing.PRLineItems.LeaveEmptyLine();
                Lib.Purchasing.LayoutPR.UpdateLayout();
            },
            UpdateHasCapex: function () {
                var promises = [];
                var hasCapex = false;
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item /*, i: number*/) {
                    if (item.GetValue("CostType__") == "CapEx") {
                        hasCapex = true;
                    }
                    return hasCapex;
                    //promises.push(
                    //	PRLineItems.Budget.Fill({ resetBudgetID: true }, item)
                    //);
                });
                Controls.HasCapex__.SetValue(hasCapex);
                Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                return Sys.Helpers.Promise.All(promises);
            },
            OnDuplicateItem: function (item, index, sourceItem, sourceIndex) {
                Lib.Purchasing.RemoveEmptyLineItem(Data.GetTable("LineItems__"));
                Purchasing.PRLineItems.ComputeItemAmount(index);
                Lib.Purchasing.CheckPR.CheckOverorderedItem(item);
                Purchasing.PRLineItems.Buyer.DelayCheckBuyers();
                if (sourceIndex == 0) {
                    Log.Info("Rebuilding workflow as first line might have been change...");
                    // We rebuild the workflow as the buyer of the first line is used and this line has been removed
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                }
                Purchasing.PRLineItems.LeaveEmptyLine();
                Purchasing.PRLineItems.SetLastLineItemType(item, index);
            },
            // disable glaccount for which the cost center is not accessible / disable non browsable recipient
            UpdateLayout: function () {
                if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                    Lib.Purchasing.Items.UpdateItemTypeDependencies(Purchasing.PRLineItems.ItemTypeDependenciesVisibilities);
                }
                for (var i = Controls.LineItems__.GetLineCount(true) - 1; i >= 0; i--) {
                    Purchasing.PRLineItems.OnRefreshRow(i);
                }
                return Purchasing.PRLineItems.Buyer.DelayCheckBuyers();
            },
            Count: function () {
                return Lib.Purchasing.Items.PR.Count();
            },
            LeaveEmptyLine: function () {
                var promisesToWait = [];
                var maxNbreLines = Controls.LineItems__.GetLineCount();
                var table = Data.GetTable("LineItems__");
                var itemCount = Purchasing.PRLineItems.Count();
                var lineCount = table.GetItemCount();
                if (itemCount <= maxNbreLines) {
                    if (Lib.Purchasing.LayoutPR.IsRequesterStep() && !Lib.Purchasing.LayoutPR.IsReadOnly()) {
                        if (itemCount === lineCount) {
                            if (itemCount === maxNbreLines) {
                                if (this.displayNoMoreLinesWarning) {
                                    this.displayNoMoreLinesWarning = false;
                                    Controls.LineItems__.HideTableRowButtonDuplicate(true);
                                    var Options_1 = {
                                        message: Language.Translate("You can not add more than {0} items", false, maxNbreLines),
                                        status: "warning"
                                    };
                                    var displayWarningInterval_1 = setInterval(function () {
                                        if (!Lib.Purchasing.LayoutPR.GlobalLayout.waitScreenDisplayed) {
                                            Popup.Snackbar(Options_1);
                                            clearInterval(displayWarningInterval_1);
                                        }
                                    }, 1000);
                                }
                            }
                            else {
                                Controls.LineItems__.HideTableRowButtonDuplicate(false);
                                table.AddItem();
                                this.displayNoMoreLinesWarning = true;
                            }
                            if (Purchasing.PRLineItems.fromUserChange && itemCount > 0) {
                                Purchasing.PRLineItems.fromUserChange = false;
                                itemCount--;
                                promisesToWait.push(Purchasing.PRLineItems.OnAddItem(table.GetItem(itemCount), itemCount));
                            }
                        }
                    }
                }
                Purchasing.PRLineItems.fromUserChange = false;
                return Sys.Helpers.Promise.All(promisesToWait);
            },
            Reset: function () {
                var table = Data.GetTable("LineItems__");
                var nblines = table.GetItemCount(), i, row;
                for (i = 0; i < nblines; i++) {
                    row = table.GetItem(0);
                    if (row) {
                        row.Remove();
                    }
                }
                Variable.SetValueAsString("lastExtractedVendorName", null);
                Variable.SetValueAsString("lastExtractedVendorNumber", null);
                Purchasing.PRLineItems.ComputeAmounts();
                Purchasing.PRLineItems.LeaveEmptyLine();
            },
            RequiredFields: {
                OnBlur: function () {
                    if (this.GetRow().GetLineNumber() === Data.GetTable("LineItems__").GetItemCount() && this.GetValue() == "") {
                        this.SetError("");
                    }
                }
            },
            CheckItemBudgetVisibility: function (index) {
                var row = Controls.LineItems__.GetRow(index);
                var isReviewer = Lib.Purchasing.LayoutPR.IsReviewer();
                var isApprover = Lib.Purchasing.LayoutPR.IsApprover();
                var isReadOnly = Lib.Purchasing.LayoutPR.IsReadOnly();
                var isBudgetDisabled = Lib.Budget.IsDisabled();
                var hasVisibilityOnCurrentBudget = Purchasing.PRLineItems.Budget.HasVisibilityOnCurrentBudget(row.GetItem());
                row.ItemGLAccount__.SetReadOnly(isReadOnly || (!isReviewer && (!isApprover || !hasVisibilityOnCurrentBudget)));
                row.ItemGLAccount__.Hide(!Sys.Parameters.GetInstance("PAC").GetParameter("DisplayGlAccount") || (!isReviewer && !hasVisibilityOnCurrentBudget));
                // FT-012944: The Expense category field should be visible and writable for the budget owner (not mandatory)
                row.ItemGroupDescription__.SetReadOnly(isReadOnly || !isApprover || !hasVisibilityOnCurrentBudget);
                row.ItemGroupDescription__.Hide(!Sys.Parameters.GetInstance("PAC").GetParameter("DisplayExpenseCategory") || !hasVisibilityOnCurrentBudget);
                var hideBudgetFields = isBudgetDisabled || !isApprover || isReadOnly || !hasVisibilityOnCurrentBudget;
                row.ItemBudgetCurrency__.Hide(hideBudgetFields);
                row.ItemBudgetInitial__.Hide(hideBudgetFields);
                row.BudgetID__.Hide(hideBudgetFields);
                row.ItemBudgetRemaining__.Hide(hideBudgetFields);
                row.ItemPeriodCode__.Hide(hideBudgetFields);
            },
            UpdateLineItemCopyFromClipboard: function (item, index, rowData) {
                var promises = [];
                promises.push(Purchasing.PRLineItems.SupplyType.UpdateSupplyTypeID(item));
                promises.push(Purchasing.PRLineItems.Vendor.UpdateVendorNumber(item));
                promises.push(Purchasing.PRLineItems.CostCenterName.UpdateCostCenterID(item));
                promises.push(Purchasing.PRLineItems.ProjectCodeDescription.UpdateID(item));
                return Sys.Helpers.Promise.All(promises)
                    .Then(function () { return Purchasing.PRLineItems.NumberOrDescription.UpdateNumberOrDescription(item); })
                    .Then(function () {
                    if (Lib.Purchasing.Items.IsAmountBasedItem(item) && !Sys.Helpers.IsEmpty(rowData.ItemNetAmount__)) {
                        item.SetValue("ItemNetAmount__", rowData.ItemNetAmount__);
                    }
                    // if glAcccount is set by User, Update ItemGroup then the Expense Category
                    if (!Sys.Helpers.IsEmpty(item.GetValue("ItemGLAccount__"))) {
                        Purchasing.PRLineItems.GLAccount.UpdateGroup(item);
                    }
                    //if supplyType is set by User, update induced Fields
                    if (!Sys.Helpers.IsEmpty(item.GetValue("SupplyTypeID__"))) {
                        Purchasing.PRLineItems.SupplyType.FillInducedFields(item, false, false);
                        Purchasing.PRLineItems.SupplyType.FillBuyerAndRecipient(item, index);
                    }
                    if (!Sys.Helpers.IsEmpty(item.GetValue("VendorNumber__")) && Sys.Helpers.IsEmpty(item.GetValue("VendorName__"))) {
                        Purchasing.PRLineItems.Vendor.UpdateVendorName(item);
                    }
                    // Set the RequestedDeliveryDate__ if the item has a lead time stored in the catalog
                    if (Sys.Helpers.IsEmpty(item.GetValue("ItemRequestedDeliveryDate__"))) {
                        Purchasing.PRLineItems.RequestedDeliveryDate.Set(item, index);
                    }
                    // Unit Price has been set/updated, need to recompute the net Amount
                    Purchasing.PRLineItems.ExchangeRate.Set(item);
                    // Update Tax Rate
                    Purchasing.PRLineItems.TaxCode.UpdateTaxRate(item);
                    if (!Sys.Helpers.IsEmpty(item.GetValue("ItemShipToCompany__"))) {
                        Lib.Purchasing.ShipTo.FillFromShipToCompany(item, index === 0);
                    }
                    if (Sys.Helpers.TryGetFunction("Lib.PR.Customization.Client.UpdateLineItemCopyFromClipboard")) {
                        Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.UpdateLineItemCopyFromClipboard");
                    }
                    Purchasing.PRLineItems.OnAddItem(item, index);
                    Purchasing.PRLineItems.OnRefreshRow(index);
                    var row = Controls.LineItems__.GetRow(index);
                    if (Lib.Purchasing.Items.IsServiceBasedItem(item)) {
                        if (!row.ItemStartDate__.GetValue() && rowData.ItemStartDate__) {
                            row.ItemStartDate__.SetText(rowData.ItemStartDate__);
                        }
                        if (!row.ItemEndDate__.GetValue() && rowData.ItemEndDate__) {
                            row.ItemEndDate__.SetText(rowData.ItemEndDate__);
                        }
                        item.SetValue("ItemRequestedDeliveryDate__", item.GetValue("ItemStartDate__"));
                    }
                    else if ((!row.Locked__.GetValue() || !row.LeadTime__.GetValue()) && !Sys.Helpers.IsEmpty(rowData.ItemRequestedDeliveryDate__)) {
                        row.ItemRequestedDeliveryDate__.SetText(rowData.ItemRequestedDeliveryDate__);
                    }
                });
            },
            Budget: (function () {
                var isOut = false;
                var isUndefined = false;
                var budgetVisibility = null;
                // ID used to manage concurrent FillBudget tasks
                var fillBudgetID = 0;
                return {
                    IsOut: function () {
                        if (Lib.Purchasing.OutOfBudgetBehavior.IsAllowed()) {
                            return false;
                        }
                        return isOut;
                    },
                    IsUndefined: function () {
                        if (Lib.Purchasing.UndefinedBudgetBehavior.IsAllowed()) {
                            return false;
                        }
                        return isUndefined;
                    },
                    // Returns true if current user has read access to the line items budget
                    // if no item specified, returns true if at least one line item has accessible key value
                    HasVisibilityOnCurrentBudget: function (item) {
                        if (Lib.Budget.IsDisabled()) {
                            return true;
                        }
                        if (budgetVisibility) {
                            if (budgetVisibility.CheckAll()) {
                                return true;
                            }
                            if (item) {
                                return budgetVisibility.CheckLineItem(item);
                            }
                            // returns true if at least une line item has accessible key value
                            var lineItems = Data.GetTable("LineItems__");
                            var count = lineItems.GetItemCount();
                            for (var i = 0; i < count; i++) {
                                item = lineItems.GetItem(i);
                                if (!Lib.Purchasing.IsLineItemEmpty(item)) {
                                    if (budgetVisibility.CheckLineItem(item)) {
                                        return true;
                                    }
                                }
                            }
                        }
                        return false;
                    },
                    Fill: function (options, currentItem) {
                        options = options || {};
                        if (Lib.Budget.IsDisabled()) {
                            return Sys.Helpers.Promise.Resolve();
                        }
                        if (options.resetBudgetID) {
                            this.ResetBudgetID(currentItem);
                        }
                        // keep in closure the current fillBudgetID
                        var myFillBudgetID = ++fillBudgetID;
                        Log.Info("Fill budget with ID " + myFillBudgetID);
                        Lib.Purchasing.LayoutPR.SetButtonsDisabled(true, "Start Budget.Fill");
                        var promisesBudgetVisibility = [];
                        if (budgetVisibility === null) {
                            Log.Info("Find available Cost centers for the current user");
                            Lib.Purchasing.LayoutPR.SetButtonsDisabled(true, "Init BudgetVisibility");
                            budgetVisibility = new Lib.Budget.Visibility({
                                login: User.loginId,
                                validationKeyColumns: Lib.P2P.GetBudgetValidationKeyColumns()
                            });
                            var promiseBudgetVisibility_1 = budgetVisibility.Ready()
                                .Then(function () {
                                Lib.Purchasing.LayoutPR.UpdateLayout();
                                Lib.Purchasing.LayoutPR.SetButtonsDisabled(false, "Init BudgetVisibility -> resolved");
                            })
                                .Catch(function () {
                                Lib.Purchasing.LayoutPR.SetButtonsDisabled(false, "Init BudgetVisibility -> rejected");
                            });
                            promisesBudgetVisibility.push(promiseBudgetVisibility_1);
                        }
                        // compute budget
                        var promiseBudgetVisibility = budgetVisibility.Ready()
                            .Then(function () {
                            // optimization if no visibility on budget.
                            if (!Purchasing.PRLineItems.Budget.HasVisibilityOnCurrentBudget()) {
                                Lib.Purchasing.LayoutPR.SetButtonsDisabled(false, "Compute Budget -> no visibility");
                            }
                            else {
                                Lib.Budget.GetBudgets({
                                    impactAction: "to approve",
                                    visibility: budgetVisibility
                                })
                                    .Then(function (budgets) {
                                    Log.Info("Ready to fill budget with current ID " + myFillBudgetID);
                                    if (myFillBudgetID === fillBudgetID) {
                                        isOut = false;
                                        isUndefined = false;
                                        Sys.Helpers.SilentChange(function () {
                                            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                                                if (!Lib.Purchasing.IsLineItemEmpty(item)) {
                                                    var budgetID = budgets.byItemIndex[i];
                                                    var BudgetVisibilityOnCurrentLine = budgetVisibility.CheckLineItem(item);
                                                    if (Sys.Helpers.IsString(budgetID)) {
                                                        var budget = budgets.byBudgetID[budgetID];
                                                        // we consider that the budget is no longer viewed when we recalculate the budget with the option resetBudgetID
                                                        // to true; ie something has changed: quantity, delivery date, cost center, etc.
                                                        var prevBudgetViewed = Sys.Helpers.Data.IsTrue(item.GetValue("ItemBudgetViewed__")) && !options.resetBudgetID;
                                                        var prevOutOfBudget = Sys.Helpers.Data.IsTrue(item.GetValue("OutOfBudget__"));
                                                        item.SetValue("ItemBudgetInitial__", budget.Budget__);
                                                        item.SetValue("BudgetID__", budgetID);
                                                        if (budget.Closed__ && !prevBudgetViewed) {
                                                            item.SetError("BudgetID__", "_This budget is closed");
                                                        }
                                                        else {
                                                            item.SetValue("ItemBudgetViewed__", true);
                                                        }
                                                        item.SetValue("ItemBudgetRemaining__", budget.Remaining__);
                                                        Lib.P2P.CompanyCodesValue.QueryValues(Controls.CompanyCode__.GetValue()).Then(function (CCValues) {
                                                            if (Object.keys(CCValues).length > 0) {
                                                                item.SetValue("ItemBudgetCurrency__", CCValues.Currency__);
                                                            }
                                                        });
                                                        item.SetValue("ItemPeriodCode__", budget.PeriodCode__);
                                                        var outOfBudget = budget.Remaining__ < 0;
                                                        if (outOfBudget) {
                                                            // We only consider PR is out of budget if :
                                                            //  - it's the first time someone approves this budget
                                                            //  - the document has been already approved with this negative remaining budget
                                                            if (!prevBudgetViewed || prevOutOfBudget) {
                                                                item.SetValue("OutOfBudget__", true);
                                                                isOut = true;
                                                            }
                                                        }
                                                        else {
                                                            item.SetValue("OutOfBudget__", false);
                                                        }
                                                    }
                                                    //budgetID is undefined when the user don't have the visibility on line, or when a key value is missing
                                                    //reset only when hte user has the visibility
                                                    else if (BudgetVisibilityOnCurrentLine && (budgetID instanceof Lib.Budget.MissingBudgetIDError || !budgetID)) {
                                                        item.SetValue("ItemBudgetInitial__", null);
                                                        item.SetValue("BudgetID__", null);
                                                        item.SetError("BudgetID__", "");
                                                        item.SetValue("ItemBudgetRemaining__", null);
                                                        item.SetValue("ItemBudgetCurrency__", null);
                                                        item.SetValue("ItemPeriodCode__", null);
                                                        item.SetValue("ItemBudgetViewed__", true);
                                                        item.SetValue("OutOfBudget__", false);
                                                        //Budget is undefined if at least 1 line for witch the user have visibility on has no budget defined
                                                        isUndefined = true;
                                                    }
                                                    else if (BudgetVisibilityOnCurrentLine && (budgetID instanceof Lib.Budget.MultipleBudgetError)) {
                                                        item.SetError("BudgetID__", "_Multiple budget item error");
                                                        item.SetValue("ItemBudgetInitial__", null);
                                                        item.SetValue("BudgetID__", null);
                                                        item.SetValue("ItemBudgetRemaining__", null);
                                                        item.SetValue("ItemBudgetCurrency__", null);
                                                        item.SetValue("ItemPeriodCode__", null);
                                                        item.SetValue("ItemBudgetViewed__", true);
                                                        item.SetValue("OutOfBudget__", false);
                                                    }
                                                }
                                            });
                                        });
                                        Purchasing.PRLineItems.Budget.Refresh(); // visual refresh
                                    }
                                    else {
                                        Log.Info("Ignore this task because another concurrent FillBudget is pending or done with this ID " + fillBudgetID);
                                    }
                                    Lib.Purchasing.LayoutPR.SetButtonsDisabled(false, "Compute Budget -> resolved");
                                })
                                    .Catch(function (error) {
                                    if (myFillBudgetID === fillBudgetID) {
                                        Log.Error("Retrieve budgets with error: " + error);
                                    }
                                    Lib.Purchasing.LayoutPR.SetButtonsDisabled(false, "Compute Budget -> rejected");
                                });
                            }
                        });
                        promisesBudgetVisibility.push(promiseBudgetVisibility);
                        return Sys.Helpers.Promise.All(promisesBudgetVisibility);
                    },
                    Refresh: function (index) {
                        if (Lib.Budget.IsDisabled()) {
                            return;
                        }
                        var table = Controls.LineItems__, row;
                        function UpdateCellStyle(cell) {
                            if (cell.GetValue() < 0) {
                                cell.AddStyle("text-highlight-warning");
                            }
                            else {
                                cell.RemoveStyle("text-highlight-warning");
                            }
                        }
                        if (index) {
                            row = table.GetRow(index);
                            UpdateCellStyle(row.ItemBudgetRemaining__);
                        }
                        else {
                            var i = void 0;
                            for (i = table.GetLineCount(true) - 1; i >= 0; i--) {
                                row = table.GetRow(i);
                                UpdateCellStyle(row.ItemBudgetRemaining__);
                            }
                        }
                    },
                    ResetBudgetID: function (currentRow) {
                        // reset budgetID: for instance budget is only driven by assignments
                        if (currentRow) {
                            if (currentRow.BudgetID__ == null) {
                                currentRow.SetValue("BudgetID__", null);
                                if (currentRow.GetItem() != null) {
                                    currentRow.SetError("BudgetID__", "");
                                }
                                currentRow.SetValue("ItemBudgetViewed__", false);
                                currentRow.SetValue("OutOfBudget__", false);
                            }
                            else {
                                currentRow.BudgetID__.SetValue(null);
                                if (currentRow.GetItem() != null) {
                                    currentRow.BudgetID__.SetError("");
                                }
                                currentRow.ItemBudgetViewed__.SetValue(false);
                                currentRow.OutOfBudget__.SetValue(false);
                            }
                        }
                    }
                };
            })(),
            NumberOrDescription: {
                itemsNumber: {},
                itemFieldsMapping: {
                    "ITEMDESCRIPTION__": "ItemDescription__",
                    "ITEMTAXCODE__.TAXRATE__": "ItemTaxRate__",
                    "ITEMTAXCODE__.NONDEDUCTIBLETAXRATE__": "NonDeductibleTaxRate__",
                    "ITEMGLACCOUNT__.GROUP__": "ItemGroup__",
                    "UNITOFMEASURE__.DESCRIPTION__": "ItemUnitDescription__",
                    "UNITOFMEASURE__": "ItemUnit__",
                    "VENDORNUMBER__.NAME__": "VendorName__",
                    "VENDORNUMBER__": "VendorNumber__",
                    "SUPPLYTYPEID__.NAME__": "SupplyTypeName__",
                    "SUPPLYTYPEID__.NOGOODSRECEIPT__": "NoGoodsReceipt__",
                    "SUPPLYTYPEID__.NOTIFYREQUESTERONRECEIPT__": "NotifyRequesterOnReceipt__"
                },
                itemFieldsMappingV2: {
                    "DESCRIPTION__": "ItemDescription__",
                    "GLACCOUNT__": "ItemGLAccount__",
                    "GLACCOUNT__.GROUP__": "ItemGroup__",
                    "ITEMNUMBER__.AVAILABLESTOCK__": "AvailableStock__",
                    "ITEMNUMBER__.CURRENCY__": "ITEMCURRENCY__",
                    "ITEMNUMBER__.CONTRACTRUIDEX__": "CONTRACTRUIDEX__",
                    "ITEMNUMBER__.CONTRACTNUMBER__": "CONTRACTNUMBER__",
                    "ITEMNUMBER__.CONTRACTNAME__": "CONTRACTNAME__",
                    "ITEMNUMBER__.LEADTIME__": "LeadTime__",
                    "ITEMNUMBER__.LOCKED__": "Locked__",
                    "ITEMNUMBER__.PUBLICPRICE__": "PublicPrice__",
                    "ITEMNUMBER__.PUNCHOUTSITENAME__": "PUNCHOUTSITENAME__",
                    "ITEMNUMBER__.SUPPLIERPARTAUXID__": "ITEMSUPPLIERPARTAUXID__",
                    "ITEMNUMBER__.SUPPLIERPARTID__": "SupplierPartID__",
                    "ITEMNUMBER__.UNITPRICE__": "ITEMUNITPRICE__",
                    "ITEMNUMBER__.VENDORNUMBER__.NAME__": "VendorName__",
                    "ITEMNUMBER__.VENDORNUMBER__": "VendorNumber__",
                    "ITEMNUMBER__.WAREHOUSENUMBER__.NAME__": "WarehouseName__",
                    "ITEMNUMBER__.WAREHOUSENUMBER__": "WarehouseID__",
                    "SUPPLYTYPEID__.NAME__": "SupplyTypeName__",
                    "SUPPLYTYPEID__.NOGOODSRECEIPT__": "NoGoodsReceipt__",
                    "SUPPLYTYPEID__.NOTIFYREQUESTERONRECEIPT__": "NotifyRequesterOnReceipt__",
                    "TAXCODE__.NONDEDUCTIBLETAXRATE__": "NonDeductibleTaxRate__",
                    "TAXCODE__.TAXRATE__": "ItemTaxRate__",
                    "TAXCODE__": "ItemTaxCode__",
                    "UNITOFMEASURE__.DESCRIPTION__": "ItemUnitDescription__",
                    "UNITOFMEASURE__": "ItemUnit__"
                },
                OnChange: function () {
                    Log.Info("Item number/description OnChange");
                    Purchasing.PRLineItems.fromUserChange = true;
                    var index = this.GetRow().GetLineNumber() - 1;
                    var item = this.GetItem();
                    if (Purchasing.PRLineItems.NumberOrDescription.itemsNumber[index]) {
                        if (Purchasing.PRLineItems.NumberOrDescription.itemsNumber[index] !== item.GetValue("ItemNumber__")) {
                            item.SetValue("ItemOrigin__", "FreeItem");
                        }
                        delete Purchasing.PRLineItems.NumberOrDescription.itemsNumber[index];
                    }
                    else {
                        item.SetValue("ItemOrigin__", "FreeItem");
                    }
                    //Will trigger OnAddItem, that will set quantity to 1, and will compute the amount
                    Purchasing.PRLineItems.LeaveEmptyLine();
                },
                $FillWithCatalogAttributes: function (selectedItem, tableItem) {
                    var multiSupplierItemsEnabled = Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled();
                    var attributes = multiSupplierItemsEnabled ? Lib.Purchasing.CatalogHelper.ProcurementItem.AttributesV2 : Lib.Purchasing.CatalogHelper.ProcurementItem.Attributes;
                    var mapping = multiSupplierItemsEnabled ? Purchasing.PRLineItems.NumberOrDescription.itemFieldsMappingV2 : Purchasing.PRLineItems.NumberOrDescription.itemFieldsMapping;
                    function FieldName2AttributeName(fieldName) {
                        var attrName;
                        Sys.Helpers.Object.Find(mapping, function (field, attribute) {
                            if (field === fieldName) {
                                attrName = attribute;
                                return true;
                            }
                            return false;
                        });
                        return attrName;
                    }
                    if (Lib.Purchasing.Vendor.IsSingleVendorMode()) {
                        var attrName = FieldName2AttributeName("VendorNumber__");
                        if (!attrName || selectedItem.GetValue(attrName) !== Lib.Purchasing.Vendor.GetSingleVendorNumber()) {
                            attrName = FieldName2AttributeName("ItemDescription__");
                            if (attrName) {
                                tableItem.SetValue("ItemDescription__", selectedItem.GetValue(attrName));
                            }
                            tableItem.SetValue("VendorName__", Lib.Purchasing.Vendor.GetSingleVendorName());
                            tableItem.SetValue("VendorNumber__", Lib.Purchasing.Vendor.GetSingleVendorNumber());
                            tableItem.SetValue("ItemOrigin__", "FreeItem");
                            return;
                        }
                    }
                    var isUnitOfMeasureEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure");
                    var isCostTypeEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayCostType");
                    Lib.Purchasing.CatalogHelper.PopulateCacheConditionedPricingData([{
                            ItemNumber__: selectedItem.GetValue("ITEMNUMBER__"),
                            VendorNumber__: selectedItem.GetValue("ITEMNUMBER__.VENDORNUMBER__"),
                            pricesData: selectedItem.GetValue("ITEMNUMBER__.PRICECONDITIONDATA__") ? JSON.parse(selectedItem.GetValue("ITEMNUMBER__.PRICECONDITIONDATA__")) : null
                        }]);
                    attributes.forEach(function (attribute) {
                        var upperAttribute = attribute.toUpperCase();
                        //Do not fill unit of measure if not enabled in order to let SAP decide wich unit of measur he want. (ST by default)
                        //Do not fill CostType if cost type is disabled
                        //Do not fill Contract fields if ContractInProcurement is disabled
                        if ((isUnitOfMeasureEnabled == true || upperAttribute.startsWith("UNITOFMEASURE__") == false)
                            && (isCostTypeEnabled == true || upperAttribute.startsWith("COSTTYPE__") == false)) {
                            if (Sys.Helpers.Data.FieldExistInTable("LineItems__", upperAttribute)) {
                                tableItem.SetValue(upperAttribute, selectedItem.GetValue(upperAttribute));
                            }
                            if (mapping[upperAttribute]) {
                                tableItem.SetValue(mapping[upperAttribute], selectedItem.GetValue(upperAttribute));
                            }
                        }
                    });
                    Lib.Purchasing.Items.PR.FillReportedCatalogAttributes(selectedItem, tableItem, Sys.Parameters.GetInstance("P2P").GetParameter("EnableMultiSupplierItem", false));
                },
                $OnSelectItem: function (selectedItem, tableItem, tableItemIndex) {
                    selectedItem.GetValue = selectedItem.GetValue || function (attribute) {
                        return this[attribute.toUpperCase()];
                    };
                    Lib.Purchasing.PRLineItems.NumberOrDescription.$FillWithCatalogAttributes(selectedItem, tableItem);
                    tableItem.SetValue("ItemQuantity__", selectedItem.GetValue("ITEMQUANTITY__") || 1);
                    Purchasing.PRLineItems.NumberOrDescription.itemsNumber[tableItemIndex] = selectedItem.GetValue("ItemNumber__");
                    Purchasing.PRLineItems.ExchangeRate.Set(tableItem);
                    Purchasing.PRLineItems.ComputeItemAmount(tableItemIndex);
                    // Set the RequestedDeliveryDate__ if the item has a lead time stored in the catalog
                    Purchasing.PRLineItems.RequestedDeliveryDate.Set(tableItem);
                    if (tableItem.GetValue("ItemGroup__")) {
                        //Item group come from "ITEMGLACCOUNT__.GROUP__", which is the default group for the catalog item's glAccount
                        Purchasing.PRLineItems.ExpenseCategory.Update(tableItem);
                        //Else it will be set by the group of the default glaccount of the supplyType
                    }
                    Purchasing.PRLineItems.GenerateCXmlIfNeeded(tableItem, selectedItem);
                    //supplyTypeId__ already set, now set all dependent empty fields
                    Purchasing.PRLineItems.SupplyType.FillInducedFields(tableItem, false, false);
                    Purchasing.PRLineItems.SupplyType.FillBuyerAndRecipient(tableItem, tableItemIndex);
                    //will call OnAddItem if it's a new item
                    Purchasing.PRLineItems.fromUserChange = true;
                    return Purchasing.PRLineItems.LeaveEmptyLine();
                },
                OnSelectItems: function (selectedItems) {
                    Log.Info("Item number/description OnSelectItems");
                    var promisesToWait = [];
                    var items;
                    if (Array.isArray(selectedItems) == false) {
                        items = [selectedItems];
                    }
                    else {
                        items = selectedItems;
                    }
                    var table = Data.GetTable("LineItems__");
                    var currentRowIndex = table.GetItemCount() - 1;
                    for (var i = 0; i < items.length; ++i) {
                        var item = items[i];
                        var currentItem = table.GetItem(currentRowIndex);
                        if (!currentItem || currentItem.GetValue("ItemDescription__")) {
                            var nbreNotAddedItems = items.length - i;
                            var maxLines = Controls.LineItems__.GetLineCount();
                            var errorMessage = Language.Translate(nbreNotAddedItems === 1 ? "_item has been ignored {0} {1}" : "_items have been ignored {0} {1}", false, nbreNotAddedItems, maxLines);
                            var Options = {
                                message: errorMessage,
                                status: "error",
                                timeout: 10000
                            };
                            Popup.Snackbar(Options);
                            break;
                        }
                        promisesToWait.push(Purchasing.PRLineItems.NumberOrDescription.$OnSelectItem(item, currentItem, currentRowIndex));
                        currentRowIndex++;
                    }
                    if (Controls.LineItems__.GetLineCount() == currentRowIndex) {
                        Purchasing.PRLineItems.OnRefreshRow(currentRowIndex - 1);
                    }
                    return Sys.Helpers.Promise.All(promisesToWait);
                },
                OnSelectItem: function (selectedItem) {
                    if (!selectedItem) {
                        Log.Info("OnSelectItem no Item was received");
                        return;
                    }
                    Log.Info("Item number/description OnSelectItem");
                    var currentRow = this.GetRow();
                    var currentItem = currentRow.GetItem();
                    var currentRowIndex = currentRow.GetLineNumber() - 1;
                    Purchasing.PRLineItems.NumberOrDescription.$OnSelectItem(selectedItem, currentItem, currentRowIndex);
                    Purchasing.PRLineItems.SetLastLineItemType(currentItem, currentRowIndex);
                },
                FillLineItemFromCatalog: function (tableItem, selectedItem) {
                    selectedItem.GetValue = selectedItem.GetValue || function (attribute) {
                        return this[attribute.toUpperCase()];
                    };
                    Lib.Purchasing.PRLineItems.NumberOrDescription.$FillWithCatalogAttributes(selectedItem, tableItem);
                    Purchasing.PRLineItems.GenerateCXmlIfNeeded(tableItem, selectedItem);
                },
                UpdateNumberOrDescription: function (item) {
                    var _a, _b;
                    if (item.GetValue("ItemNumber__") !== null || item.GetValue("ItemDescription__") !== null || item.GetValue("SupplierPartID__") !== null) {
                        var table = "PurchasingOrderedItems__";
                        var attributes = Lib.Purchasing.CatalogHelper.ProcurementItem.Attributes;
                        var descriptionField = "ItemDescription__";
                        var companyCodeField = "ItemCompanyCode__";
                        var multiSupplierItemEnabled = Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled();
                        if (multiSupplierItemEnabled) {
                            table = "P2P - CatalogItems__";
                            attributes = Lib.Purchasing.CatalogHelper.ProcurementItem.AttributesV2;
                            descriptionField = "Description__";
                            companyCodeField = "CompanyCode__";
                        }
                        var catalogItemFilter = [Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__", item.GetValue("ItemNumber__"))];
                        if (item.GetValue("ItemDescription__")) {
                            catalogItemFilter.push(Sys.Helpers.LdapUtil.FilterEqual(descriptionField, item.GetValue("ItemDescription__")));
                        }
                        if (item.GetValue("SupplierPartID__")) {
                            catalogItemFilter.push(Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__", item.GetValue("SupplierPartID__")));
                            catalogItemFilter.push(Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__.SupplierPartID__", item.GetValue("SupplierPartID__")));
                        }
                        var allConditions = [];
                        allConditions.push((_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, catalogItemFilter));
                        allConditions.push(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual(companyCodeField, Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual(companyCodeField, ""), Sys.Helpers.LdapUtil.FilterNotExist(companyCodeField)));
                        if (multiSupplierItemEnabled) {
                            if (item.GetValue("VendorNumber__")) {
                                allConditions.push(Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.VENDORNUMBER__", item.GetValue("VendorNumber__")));
                            }
                            else if (item.GetValue("WarehouseID__")) {
                                allConditions.push(Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", item.GetValue("WarehouseID__")));
                            }
                        }
                        var options = {
                            table: table,
                            filter: (_b = Sys.Helpers.LdapUtil).FilterAnd.apply(_b, allConditions).toString(),
                            attributes: attributes,
                            maxRecords: 2,
                            additionalOptions: "EnableJoin=1"
                        };
                        return Sys.GenericAPI.PromisedQuery(options)
                            .Then(function (results) {
                            if (results && results.length === 1) {
                                var result = results[0];
                                Purchasing.PRLineItems.NumberOrDescription.FillLineItemFromCatalog(item, result);
                                return Sys.Helpers.Promise.Resolve(result);
                            }
                            return Sys.Helpers.Promise.Resolve(null);
                        });
                    }
                    return Sys.Helpers.Promise.Resolve(null);
                }
            },
            Quantity: {
                OnChange: function () {
                    Purchasing.PRLineItems.fromUserChange = true;
                    var index = this.GetRow().GetLineNumber() - 1;
                    Lib.Purchasing.CheckPR.CheckOverorderedItem(this.GetItem());
                    Purchasing.PRLineItems.ComputeItemAmount(index);
                    Purchasing.PRLineItems.LeaveEmptyLine();
                }
            },
            RequestedDeliveryDate: {
                AddLeadTime: function (leadTime) {
                    return Lib.Purchasing.Items.AddLeadTime(leadTime);
                },
                Set: function (item, index) {
                    Lib.Purchasing.Items.PR.SetDeliveryDate(item, index);
                },
                OnChange: function () {
                    Purchasing.PRLineItems.fromUserChange = true;
                    var currentRow = this.GetRow();
                    var currentItem = this.GetItem();
                    if (Lib.Purchasing.CheckPR.RequiredFields.CheckItemsDeliveryDates(Lib.Purchasing.LayoutPR.GetCurrentLayout(), {
                        // return item index - call with inWholeTable (1-based API)
                        specificItemIndex: currentRow.GetLineNumber(/*inWholeTable*/ true) - 1
                    })) {
                        var hasLeadTime = !Sys.Helpers.IsEmpty(currentItem.GetValue("LeadTime__"));
                        if (hasLeadTime) {
                            Lib.Purchasing.Items.PR.CheckDeliveryDateBelowLeadTime(currentItem);
                        }
                        else {
                            AutoFillLineItemsWithEmptyValue("ItemRequestedDeliveryDate__", currentItem.GetValue("ItemRequestedDeliveryDate__"), {
                                extraCondition: function (emptyItem) { return !Lib.Purchasing.Items.IsServiceBasedItem(emptyItem); }
                            });
                        }
                        if (Lib.Purchasing.LayoutPR.IsApprover()) {
                            Log.Info("Update budget");
                            Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, currentItem);
                        }
                        else {
                            Purchasing.PRLineItems.Budget.ResetBudgetID(currentItem);
                        }
                    }
                    Purchasing.PRLineItems.LeaveEmptyLine();
                }
            },
            UnitPrice: {
                OnChange: function () {
                    Purchasing.PRLineItems.fromUserChange = true;
                    var index = this.GetRow().GetLineNumber() - 1;
                    Purchasing.PRLineItems.ComputeItemAmount(index);
                    Purchasing.PRLineItems.LeaveEmptyLine();
                }
            },
            ItemCurrency: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        var itemExchangeRate = parseFloat(item.GetValue("Rate__"));
                        var ratioFrom = parseFloat(item.GetValue("RatioFrom__"));
                        var ratioTo = parseFloat(item.GetValue("RatioTo__"));
                        var exchangeRate = new Sys.Decimal(itemExchangeRate).mul(ratioTo).div(ratioFrom).toNumber();
                        currentItem.SetValue("ItemExchangeRate__", exchangeRate);
                        var currency = item.GetValue("CurrencyFrom__");
                        AutoFillLineItemsWithEmptyValue("ItemCurrency__", currency);
                        var index = this.GetRow().GetLineNumber() - 1;
                        Purchasing.PRLineItems.ComputeItemAmount(index);
                        Purchasing.PRLineItems.LeaveEmptyLine();
                    }
                    else {
                        currentItem.SetValue("ItemExchangeRate__", "");
                        currentItem.SetError("ItemExchangeRate__", "The value could not be resolve");
                    }
                }
            },
            PONumber: {
                SetLink: function (row) {
                    if (!Sys.Helpers.IsEmpty(row.PONumber__.GetValue())) {
                        row.PONumber__.DisplayAs({ type: "Link" });
                    }
                },
                OnClick: function (OrderNumber) {
                    Controls.LineItems__.PONumber__.Wait(true);
                    var options = {
                        table: "CDNAME#Purchase order V2",
                        filter: Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", OrderNumber).toString(),
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
                            Popup.Alert("_Purchase order not found or access denied", false, null, "_Purchase order not found title");
                        }
                    })
                        .Catch(function ( /*error: string*/) {
                        Popup.Alert("_Purchase order not found or access denied", false, null, "_Purchase order not found title");
                    })
                        .Finally(function () {
                        Controls.LineItems__.PONumber__.Wait(false);
                    });
                }
            },
            ComputeItemAmount: function (index) {
                var item = Data.GetTable("LineItems__").GetItem(index);
                Lib.Purchasing.Items.PR.FillItemAmount(item);
                Purchasing.PRLineItems.ComputeAmounts();
            },
            delayedComputeAmounts: null,
            ComputeAmounts: function (forceRebuildWorkflow) {
                var _this = this;
                if (forceRebuildWorkflow === void 0) { forceRebuildWorkflow = false; }
                this.delayedComputeAmounts = this.delayedComputeAmounts || Sys.Helpers.Promise.Tools.Sleep(100)
                    .Then(function () {
                    ProcessInstance.SetSilentChange(true);
                    var res = Lib.Purchasing.Items.PR.FillTotalAmounts();
                    Controls.TotalNetAmount__.SetLabel(Language.Translate("_Total net amount", false, res.Currency));
                    Controls.TotalNetAmount__.Hide(!res.isMonoCurrency || !res.hasForeignCurrency);
                    _this.delayedComputeAmounts = null;
                    if (forceRebuildWorkflow || res.haveChanged) {
                        Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                    }
                    return null;
                })
                    .Finally(function () { return ProcessInstance.SetSilentChange(false); });
            },
            DisplayWarningSnackbar: function () {
                var Options = {
                    message: Language.Translate("_notEnoughStock", false),
                    timeout: 3000,
                    status: "warning"
                };
                Popup.Snackbar(Options);
            },
            ExchangeRate: {
                Set: function (item) {
                    Lib.Purchasing.Items.PR.FillExchangeRateField(item);
                }
            },
            NetAmount: {
                OnChange: function () {
                    Purchasing.PRLineItems.fromUserChange = true;
                    var index = this.GetRow().GetLineNumber() - 1;
                    Purchasing.PRLineItems.ComputeItemAmount(index);
                    Purchasing.PRLineItems.LeaveEmptyLine();
                }
            },
            GLAccount: (function () {
                var timeoutID = null;
                return {
                    OnSelectItem: function (item) {
                        var _this = this;
                        if (item) {
                            if (timeoutID) {
                                clearTimeout(timeoutID);
                            }
                            timeoutID = setTimeout(function () {
                                var currentItem = _this.GetItem();
                                currentItem.SetValue("ItemGroup__", item.GetValue("Group__"));
                                Purchasing.PRLineItems.ExpenseCategory.Update(currentItem)
                                    .Then(function () { return Lib.P2P.fillCostTypeFromGLAccount(currentItem, "ItemGLAccount__"); })
                                    .Then(function (resultItem) { return Sys.Helpers.Promise.All([
                                    Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, resultItem),
                                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow()
                                ]); });
                                timeoutID = null;
                            });
                        }
                        else {
                            var currentItem = this.GetItem();
                            currentItem.SetValue("ItemGroup__", "");
                            currentItem.SetError("ItemGroup__", "The value could not be resolve");
                        }
                    },
                    OnChange: function () {
                        var _this = this;
                        if (!timeoutID) {
                            timeoutID = setTimeout(function () {
                                var currentRow = _this.GetRow();
                                var currentItem = _this.GetItem();
                                if (!currentRow.ItemGroupDescription__.IsVisible()) {
                                    currentItem.SetValue("ItemGroup__", null);
                                    Purchasing.PRLineItems.ExpenseCategory.Update(currentItem);
                                }
                                Lib.P2P.fillCostTypeFromGLAccount(currentItem, "ItemGLAccount__")
                                    .Then(function (resultItem) { return Sys.Helpers.Promise.All([
                                    Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, resultItem),
                                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow()
                                ]); });
                                timeoutID = null;
                            });
                        }
                    },
                    UpdateGroup: function (item) {
                        var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Account__", item.GetValue("ItemGLAccount__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")));
                        var options = {
                            table: "AP - G/L accounts__",
                            filter: filter.toString(),
                            attributes: ["Group__", "CostType__"],
                            sortOrder: null,
                            maxRecords: 1
                        };
                        Sys.GenericAPI.PromisedQuery(options)
                            .Then(function (queryResult) {
                            item.SetValue("ItemGroup__", queryResult.length == 1 ? queryResult[0].Group__ : null);
                            if (Sys.Helpers.IsEmpty(item.GetValue("CostType__"))) {
                                item.SetValue("CostType__", queryResult.length == 1 ? queryResult[0].CostType__ : null);
                            }
                        })
                            .Catch(function ( /*error: string*/) {
                            item.SetValue("ItemGroup__", null);
                        })
                            .Finally(function () { return Purchasing.PRLineItems.ExpenseCategory.Update(item); })
                            .Finally(function () { return Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, item); });
                    }
                };
            })(),
            ProjectCode: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        currentItem.SetValue("ProjectCodeDescription__", item.GetValue("Description__"));
                        Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                    }
                    else {
                        currentItem.SetValue("ProjectCodeDescription__", "");
                        currentItem.SetError("ProjectCodeDescription__", "The value could not be resolved");
                    }
                },
                OnUnknownOrEmptyValue: function () {
                    var currentItem = this.GetItem();
                    currentItem.SetValue("ProjectCodeDescription__", null);
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                }
            },
            ProjectCodeDescription: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        currentItem.SetValue("ProjectCode__", item.GetValue("ProjectCode__"));
                        Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                    }
                    else {
                        currentItem.SetValue("ProjectCode__", "");
                        currentItem.SetError("ProjectCode__", "The value could not be resolved");
                    }
                },
                UpdateID: function (item) {
                    var projectDesc = item.GetValue("ProjectCodeDescription__");
                    if (projectDesc === null) {
                        return Sys.Helpers.Promise.Resolve(item);
                    }
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Description__", projectDesc), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__")));
                    var options = {
                        table: "P2P - Project codes__",
                        filter: filter.toString(),
                        attributes: ["ProjectCode__"],
                        sortOrder: null,
                        maxRecords: 2
                    };
                    return Sys.GenericAPI.PromisedQuery(options)
                        .Then(function (queryResult) {
                        var projectCode = null;
                        if (queryResult && queryResult.length != 0) {
                            if (queryResult.length == 1) {
                                projectCode = queryResult[0].ProjectCode__;
                            }
                            else {
                                // Vendor name ambiguous: multiple vendors have the same name
                                item.SetError("ProjectCodeDescription__", "The value could not be resolve");
                                item.SetError("ProjectCode__", "The value could not be resolve");
                            }
                        }
                        else {
                            item.SetError("ProjectCodeDescription__", "No project found");
                            item.SetError("ProjectCode__", "No project found");
                        }
                        item.SetValue("ProjectCode__", projectCode);
                        return item;
                    })
                        .Catch(function ( /*error: string*/) {
                        item.SetValue("ProjectCode__", null);
                        return item;
                    });
                },
                OnUnknownOrEmptyValue: function () {
                    var currentItem = this.GetItem();
                    currentItem.SetValue("ProjectCode__", null);
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                }
            },
            ExpenseCategory: {
                OnSelectItem: function (item) {
                    var expenseCategory = item.GetValue("ExpenseCategory__");
                    var currentItem = this.GetItem();
                    if (item) {
                        currentItem.SetValue("ItemGroup__", expenseCategory);
                        var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Group__", expenseCategory), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")));
                        // Fill ItemGLAccount__ if expense category only used for 1 GLAccount
                        var options = {
                            table: "AP - G/L accounts__",
                            filter: filter.toString(),
                            attributes: ["Account__"],
                            sortOrder: null,
                            maxRecords: 2
                        };
                        Sys.GenericAPI.PromisedQuery(options)
                            .Then(function (queryResult) {
                            currentItem.SetValue("ItemGLAccount__", queryResult.length == 1 ? queryResult[0].Account__ : null);
                            if (Sys.Helpers.IsEmpty(currentItem.GetValue("CostType__"))) {
                                return Lib.P2P.fillCostTypeFromGLAccount(currentItem, "ItemGLAccount__")
                                    .Then(function (resultItem) { return Sys.Helpers.Promise.All([
                                    Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, resultItem),
                                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow()
                                ]); });
                            }
                            return Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, currentItem);
                        })
                            .Catch(function ( /*error: string*/) {
                            currentItem.SetValue("ItemGLAccount__", null);
                        });
                    }
                    else {
                        currentItem.SetValue("ItemGLAccount__", "");
                        currentItem.SetError("ItemGLAccount__", "The value could not be resolve");
                    }
                },
                OnUnknownOrEmptyValue: function () {
                    var currentRow = this.GetRow();
                    var currentItem = this.GetItem();
                    currentItem.SetValue("ItemGroup__", null);
                    if (!currentRow.ItemGLAccount__.IsVisible()) {
                        currentItem.SetValue("ItemGLAccount__", null);
                    }
                    if (!currentRow.CostType__.IsVisible()) {
                        currentItem.SetValue("CostType__", null);
                        Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                    }
                    Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, currentItem);
                },
                Update: function (currentItem) {
                    return Lib.Purchasing.Items.PR.FillExpenseCategoryField(currentItem);
                }
            },
            CostCenterId: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        currentItem.SetValue("ItemCostCenterName__", item.GetValue("Description__"));
                        Purchasing.PRLineItems.Budget.ResetBudgetID(currentItem);
                        Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                    }
                    else {
                        currentItem.SetValue("ItemCostCenterName__", "");
                        currentItem.SetError("ItemCostCenterName__", "The value could not be resolve");
                    }
                },
                OnUnknownOrEmptyValue: function () {
                    var currentItem = this.GetItem();
                    currentItem.SetValue("ItemCostCenterName__", null);
                    Purchasing.PRLineItems.Budget.ResetBudgetID(currentItem);
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                },
                /*
                * return false if at least one row is correctly filled
                */
                IsEmpty: function () {
                    var table = Data.GetTable("LineItems__");
                    var count = Purchasing.PRLineItems.Count(), i, find = 0;
                    for (i = 0; i < count; i++) {
                        if (!Sys.Helpers.IsEmpty(table.GetItem(i).GetValue("ItemCostCenterId__"))) {
                            find += 1;
                        }
                    }
                    return find === 0;
                }
            },
            CostCenterName: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        Purchasing.PRLineItems.fromUserChange = true;
                        currentItem.SetValue("ItemCostCenterId__", item.GetValue("CostCenter__"));
                        this.SetValue(item.GetValue("Description__")); // In SAP, the description is always uppercase.
                        Purchasing.PRLineItems.LeaveEmptyLine();
                        Purchasing.PRLineItems.Budget.ResetBudgetID(currentItem);
                        Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                    }
                    else {
                        currentItem.SetValue("ItemCostCenterName__", "");
                        currentItem.SetError("ItemCostCenterName__", "The value could not be resolve");
                    }
                },
                OnUnknownOrEmptyValue: function () {
                    var currentItem = this.GetItem();
                    Purchasing.PRLineItems.fromUserChange = true;
                    currentItem.SetValue("ItemCostCenterId__", null);
                    Purchasing.PRLineItems.LeaveEmptyLine();
                    Purchasing.PRLineItems.Budget.ResetBudgetID(currentItem);
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                },
                UpdateCostCenterID: function (item) {
                    var costCenterName = item.GetValue("ItemCostCenterName__");
                    if (costCenterName === null) {
                        return Sys.Helpers.Promise.Resolve(item);
                    }
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Description__", costCenterName), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__")));
                    var options = {
                        table: "AP - Cost centers__",
                        filter: filter.toString(),
                        attributes: ["CostCenter__"],
                        sortOrder: null,
                        maxRecords: 2
                    };
                    return Sys.GenericAPI.PromisedQuery(options)
                        .Then(function (queryResult) {
                        var costCenterId = null;
                        if (queryResult && queryResult.length != 0) {
                            if (queryResult.length == 1) {
                                costCenterId = queryResult[0].CostCenter__;
                            }
                            else {
                                // Vendor name ambiguous: multiple vendors have the same name
                                item.SetError("ItemCostCenterName__", "The value could not be resolve");
                                item.SetError("ItemCostCenterId__", "The value could not be resolve");
                            }
                        }
                        else {
                            item.SetError("ItemCostCenterName__", "No cost center found");
                            item.SetError("ItemCostCenterId__", "No cost center found");
                        }
                        item.SetValue("ItemCostCenterId__", costCenterId);
                        return item;
                    })
                        .Catch(function ( /*error: string*/) {
                        item.SetValue("ItemCostCenterId__", null);
                        return item;
                    });
                }
            },
            WBSElement: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        currentItem.SetValue("WBSElementID__", item.GetValue("WBSElementID__"));
                        Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                    }
                    else {
                        currentItem.SetValue("WBSElementID__", "");
                        currentItem.SetError("WBSElementID__", "The value could not be resolved");
                    }
                },
                OnUnknownOrEmptyValue: function () {
                    var currentItem = this.GetItem();
                    currentItem.SetValue("WBSElementID__", null);
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                }
            },
            WBSElementID: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        currentItem.SetValue("WBSElement__", item.GetValue("Description__"));
                        Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                    }
                    else {
                        currentItem.SetValue("WBSElement__", "");
                        currentItem.SetError("WBSElement__", "The value could not be resolved");
                    }
                },
                OnUnknownOrEmptyValue: function () {
                    var currentItem = this.GetItem();
                    currentItem.SetValue("WBSElement__", null);
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                }
            },
            Vendor: {
                OnUnknownOrEmptyValue: function () {
                    Purchasing.PRLineItems.fromUserChange = true;
                    this.GetRow().VendorNumber__.SetValue("");
                    Variable.SetValueAsString("lastExtractedVendorName", null);
                    Variable.SetValueAsString("lastExtractedVendorNumber", null);
                    Purchasing.PRLineItems.LeaveEmptyLine();
                },
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        Purchasing.PRLineItems.fromUserChange = true;
                        currentItem.SetValue("VendorName__", item.GetValue("Name__"));
                        currentItem.SetValue("VendorNumber__", item.GetValue("Number__"));
                        Variable.SetValueAsString("lastExtractedVendorName", null);
                        Variable.SetValueAsString("lastExtractedVendorNumber", null);
                        Purchasing.PRLineItems.LeaveEmptyLine();
                    }
                    else {
                        currentItem.SetValue("VendorName__", "");
                        currentItem.SetError("VendorName__", "The value could not be resolve");
                    }
                },
                UpdateVendorName: function (item) {
                    if (Lib.Purchasing.Vendor.IsSingleVendorMode()) {
                        item.SetValue("VendorName__", Lib.Purchasing.Vendor.GetSingleVendorName());
                    }
                    else {
                        var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Number__", item.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__")));
                        var options = {
                            table: "AP - Vendors__",
                            filter: filter.toString(),
                            attributes: ["Name__"],
                            sortOrder: null,
                            maxRecords: 1
                        };
                        Sys.GenericAPI.PromisedQuery(options)
                            .Then(function (queryResult) {
                            item.SetValue("VendorName__", queryResult.length == 1 ? queryResult[0].Name__ : null);
                        })
                            .Catch(function ( /*error: string*/) {
                            item.SetValue("VendorName__", null);
                        });
                    }
                },
                UpdateVendorNumber: function (item) {
                    if (Lib.Purchasing.Vendor.IsSingleVendorMode()) {
                        item.SetValue("VendorNumber__", Lib.Purchasing.Vendor.GetSingleVendorNumber());
                        return Sys.Helpers.Promise.Resolve(item);
                    }
                    var vendorName = item.GetValue("VendorName__");
                    if (vendorName === null) {
                        return Sys.Helpers.Promise.Resolve(item);
                    }
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Name__", item.GetValue("vendorName__")), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__")));
                    var options = {
                        table: "AP - Vendors__",
                        filter: filter.toString(),
                        attributes: ["Number__"],
                        sortOrder: null,
                        maxRecords: 2
                    };
                    return Sys.GenericAPI.PromisedQuery(options)
                        .Then(function (queryResult) {
                        var vendorNumber = null;
                        if (queryResult && queryResult.length != 0) {
                            if (queryResult.length == 1) {
                                vendorNumber = queryResult[0].Number__;
                            }
                            else {
                                // Vendor name ambiguous: multiple vendors have the same name
                                item.SetError("VendorName__", "The value could not be resolve");
                                item.SetError("VendorNumber__", "The value could not be resolve");
                            }
                        }
                        else {
                            item.SetError("VendorName__", "No vendor found");
                            item.SetError("VendorNumber__", "No vendor found");
                        }
                        item.SetValue("VendorNumber__", vendorNumber);
                        return item;
                    })
                        .Catch(function ( /*error: string*/) {
                        item.SetValue("VendorNumber__", null);
                        return item;
                    });
                }
            },
            SupplyType: {
                FillInducedFields: function (item, forceDefaultGLAccount, forceDefaultCostType) {
                    return Lib.Purchasing.Items.PR.FillInducedFields(item, forceDefaultGLAccount, forceDefaultCostType)
                        .Then(function (supplyType) {
                        var promises = [];
                        var updateGLAccount = forceDefaultGLAccount !== false || Sys.Helpers.IsEmpty(item.GetValue("ItemGLAccount__"));
                        var updateCostType = forceDefaultCostType !== false || Sys.Helpers.IsEmpty(item.GetValue("CostType__"));
                        if (updateGLAccount || updateCostType) {
                            promises.push(Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, item));
                        }
                        if (updateCostType) {
                            promises.push(Lib.Purchasing.LayoutPR.DelayRebuildWorkflow());
                        }
                        return Sys.Helpers.Promise.All(promises);
                    });
                },
                FillBuyerAndRecipient: function (item, itemIndex) {
                    return Lib.Purchasing.Items.PR.FillBuyerAndRecipientFields(item, itemIndex);
                },
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        var itemIndex = this.GetRow().GetLineNumber() - 1;
                        Purchasing.PRLineItems.fromUserChange = true;
                        var id = item.GetValue("SupplyID__");
                        currentItem.SetValue("SupplyTypeID__", id);
                        Purchasing.PRLineItems.SupplyType.FillInducedFields(currentItem);
                        Purchasing.PRLineItems.SupplyType.FillBuyerAndRecipient(currentItem, itemIndex);
                        Purchasing.PRLineItems.LeaveEmptyLine();
                    }
                    else {
                        currentItem.SetValue("SupplyTypeName__", "");
                        currentItem.SetError("SupplyTypeName__", "The value could not be resolve");
                    }
                },
                OnUnknownOrEmptyValue: function () {
                    this.GetRow().SupplyTypeID__.SetValue("");
                },
                UpdateSupplyTypeID: function (item /*, line: number*/) {
                    var supplyTypeName = item.GetValue("SupplyTypeName__");
                    if (supplyTypeName === null) {
                        return Sys.Helpers.Promise.Resolve(item);
                    }
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Name__", supplyTypeName), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__")));
                    var options = {
                        table: "PurchasingSupply__",
                        filter: filter.toString(),
                        attributes: ["SupplyID__", "DefaultCostType__"],
                        sortOrder: null,
                        maxRecords: 2
                    };
                    return Sys.GenericAPI.PromisedQuery(options)
                        .Then(function (queryResult) {
                        var supplyTypeID = null;
                        var defaultCostType = null;
                        if (queryResult && queryResult.length != 0) {
                            if (queryResult.length == 1) {
                                supplyTypeID = queryResult[0].SupplyID__;
                                defaultCostType = queryResult[0].DefaultCostType__;
                            }
                            else {
                                // Supply name ambiguous: multiple vendors have the same name
                                item.SetError("SupplyTypeName__", "The value could not be resolve");
                                item.SetError("SupplyTypeID__", "The value could not be resolve");
                            }
                        }
                        else {
                            item.SetError("SupplyTypeName__", "No supply type found");
                            item.SetError("SupplyTypeID__", "No supply type found");
                        }
                        item.SetValue("SupplyTypeID__", supplyTypeID);
                        if (!item.GetValue("CostType__")) {
                            item.SetValue("CostType__", defaultCostType);
                            return Sys.Helpers.Promise.All([
                                Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true }, item),
                                Lib.Purchasing.LayoutPR.DelayRebuildWorkflow()
                            ])
                                .Then(function () { return item; });
                        }
                        return item;
                    })
                        .Catch(function ( /*error: string*/) {
                        item.SetValue("SupplyTypeID__", null);
                        return item;
                    });
                }
            },
            TaxCode: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        currentItem.SetValue("ItemTaxCode__", item.GetValue("TaxCode__"));
                        currentItem.SetValue("ItemTaxRate__", item.GetValue("TaxRate__"));
                        currentItem.SetValue("NonDeductibleTaxRate__", item.GetValue("NonDeductibleTaxRate__"));
                    }
                    else {
                        currentItem.SetValue("ItemTaxCode__", "");
                        currentItem.SetError("ItemTaxCode__", "The value could not be resolve");
                        currentItem.SetValue("ItemTaxRate__", null);
                        currentItem.SetValue("NonDeductibleTaxRate__", null);
                    }
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                },
                OnUnknownOrEmptyValue: function () {
                    var currentItem = this.GetItem();
                    currentItem.SetValue("ItemTaxRate__", null);
                    currentItem.SetValue("NonDeductibleTaxRate__", null);
                    Lib.Purchasing.LayoutPR.DelayRebuildWorkflow();
                },
                UpdateTaxRate: function (item) {
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("TaxCode__", item.GetValue("ItemTaxCode__")), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__")));
                    var options = {
                        table: "AP - Tax codes__",
                        filter: filter.toString(),
                        attributes: ["TaxRate__", "NonDeductibleTaxRate__"],
                        sortOrder: null,
                        maxRecords: 1
                    };
                    Sys.GenericAPI.PromisedQuery(options)
                        .Then(function (queryResult) {
                        item.SetValue("ItemTaxRate__", queryResult.length == 1 ? queryResult[0].TaxRate__ : null);
                        item.SetValue("NonDeductibleTaxRate__", queryResult.length == 1 ? queryResult[0].NonDeductibleTaxRate__ : null);
                    })
                        .Catch(function ( /*error: string*/) {
                        item.SetValue("ItemTaxRate__", null);
                        item.SetValue("NonDeductibleTaxRate__", null);
                    });
                }
            },
            Buyer: {
                CheckBuyers: function () {
                    Log.Info("Checking buyers");
                    var lineItems = Data.GetTable("LineItems__");
                    var count = lineItems.GetItemCount();
                    for (var i = 0; i < count; i++) // include 1st row too to reset error or add empty buyer error
                     {
                        var item = lineItems.GetItem(i);
                        if (Lib.Purchasing.IsLineItemEmpty(item)) {
                            // Ignore empty lines
                            continue;
                        }
                        var buyerLogin = item.GetValue("BuyerLogin__");
                        if (Sys.Helpers.IsEmpty(buyerLogin)) {
                            // Set error if empty and no error already present
                            if (Sys.Helpers.IsEmpty(item.GetError("BuyerName__"))) {
                                item.SetError("BuyerName__", Language.Translate("_Buyer {0} not found for this supply type", false, ""));
                            }
                        }
                        else {
                            // Reset error
                            item.SetError("BuyerName__", "");
                        }
                    }
                },
                DelayCheckBuyers: (function () {
                    var timer = 0;
                    var currentPromise = null;
                    var currentPromiseResolve = null;
                    var CheckBuyers = function () {
                        Log.Info("[DelayCheckBuyers] trigger");
                        timer = 0;
                        currentPromise = null;
                        Purchasing.PRLineItems.Buyer.CheckBuyers();
                        currentPromiseResolve();
                    };
                    return function () {
                        if (timer !== 0) {
                            // cancel previous call
                            Log.Info("[DelayCheckBuyers] start and cancel previous");
                            clearTimeout(timer);
                        }
                        timer = setTimeout(CheckBuyers, 200);
                        if (currentPromise === null) {
                            currentPromise = Sys.Helpers.Promise.Create(function (resolve) {
                                currentPromiseResolve = resolve;
                            });
                        }
                        return currentPromise;
                    };
                })(),
                Update: function (item, buyerLogin, itemIndex) {
                    Lib.Purchasing.Items.PR.FillBuyerField(item, buyerLogin, itemIndex);
                },
                OnRefreshRow: function (index) {
                    var row = Controls.LineItems__.GetRow(index);
                    var item = row.GetItem();
                    if (item && Lib.Purchasing.IsLineItemEmpty(item)) {
                        row.BuyerName__.SetError("");
                    }
                }
            },
            Recipient: {
                Update: function (item, recipientLogin) {
                    Lib.Purchasing.Items.PR.FillRecipientField(item, recipientLogin);
                },
                OnRefreshRow: function (index) {
                    var row = Controls.LineItems__.GetRow(index);
                    if (row.SupplyTypeID__.GetValue() && Lib.Purchasing.LayoutPR.IsRequesterStep()) {
                        Lib.Purchasing.CatalogHelper.SupplyTypesManager.Get(row.SupplyTypeID__.GetValue())
                            .Then(function (supplyType) {
                            var browsable = supplyType && supplyType.isRecipientBrowsable;
                            row.RecipientName__.SetReadOnly(!browsable);
                            // Set error if empty and no error already present
                            if (Sys.Helpers.IsEmpty(row.RecipientName__.GetValue()) && Sys.Helpers.IsEmpty(row.RecipientName__.GetError())) {
                                row.RecipientName__.SetError(Language.Translate("_Recipient {0} not found for this supply type", false, ""));
                            }
                        });
                    }
                }
            },
            ItemUnitDescription: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        Purchasing.PRLineItems.fromUserChange = true;
                        currentItem.SetValue("ItemUnit__", item.GetValue("UnitOfMeasure__"));
                        AutoFillLineItemsWithEmptyValue("ItemUnit__", item.GetValue("UnitOfMeasure__"), {
                            extraSetter: function (emptyItem) { return emptyItem.SetValue("ItemUnitDescription__", item.GetValue("Description__")); }
                        });
                        Purchasing.PRLineItems.LeaveEmptyLine();
                    }
                    else {
                        currentItem.SetValue("UnitOfMeasure__", "");
                        currentItem.SetError("UnitOfMeasure__", "The value could not be resolve");
                    }
                },
                OnChange: function () {
                    var currentItem = this.GetItem();
                    AutoFillLineItemsWithEmptyValue("ItemUnit__", currentItem.GetValue("ItemUnit__"), {
                        extraSetter: function (emptyItem) { return emptyItem.SetValue("ItemUnitDescription__", currentItem.GetValue("ItemUnitDescription__")); }
                    });
                }
            },
            ItemUnit: {
                OnSelectItem: function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        Purchasing.PRLineItems.fromUserChange = true;
                        currentItem.SetValue("ItemUnitDescription__", item.GetValue("Description__"));
                        AutoFillLineItemsWithEmptyValue("ItemUnit__", item.GetValue("ItemUnit__"), {
                            extraSetter: function (emptyItem) { return emptyItem.SetValue("ItemUnitDescription__", item.GetValue("Description__")); }
                        });
                        Purchasing.PRLineItems.LeaveEmptyLine();
                    }
                    else {
                        currentItem.SetValue("ItemUnit__", "");
                        currentItem.SetError("ItemUnit__", "The value could not be resolve");
                    }
                },
                OnChange: function () {
                    var currentItem = this.GetItem();
                    AutoFillLineItemsWithEmptyValue("ItemUnit__", currentItem.GetValue("ItemUnit__"), {
                        extraSetter: function (emptyItem) { return emptyItem.SetValue("ItemUnitDescription__", currentItem.GetValue("ItemUnitDescription__")); }
                    });
                }
            },
            ItemType: {
                /** @this ComboBox & IControlInTable<Controls.LineItems__.Row> */
                OnChange: function () {
                    if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                        Lib.Purchasing.Items.UpdateItemTypeDependencies(Purchasing.PRLineItems.ItemTypeDependenciesVisibilities);
                    }
                    var index = this.GetRow().GetLineNumber(true) - 1;
                    var item = this.GetItem();
                    var quantity = item.GetValue("ItemQuantity__");
                    if (!Lib.Purchasing.Items.IsAmountBasedItem(item) && item.GetValue("ItemUnitPrice__") === 1 && quantity > 1) {
                        item.SetValue("ItemUnitPrice__", quantity);
                        item.SetValue("ItemQuantity__", 1);
                    }
                    Purchasing.PRLineItems.ComputeItemAmount(index);
                    Purchasing.PRLineItems.OnRefreshRow(index);
                    Purchasing.PRLineItems.LeaveEmptyLine();
                    Purchasing.PRLineItems.SetLastLineItemType(item, index);
                }
            },
            CostType: {
                OnChange: function () {
                    Purchasing.PRLineItems.fromUserChange = true;
                    var currentItem = this.GetItem();
                    Purchasing.PRLineItems.Budget.ResetBudgetID(currentItem);
                    // The workflow is recomputed when HasCapex value is updated
                    Purchasing.PRLineItems.UpdateHasCapex();
                    Lib.Purchasing.PRLineItems.LeaveEmptyLine();
                }
            },
            CheckStartEndDate: function (item) {
                Purchasing.PRLineItems.fromUserChange = true;
                var startDate = item.GetValue("ItemStartDate__");
                var endDate = item.GetValue("ItemEndDate__");
                if (startDate && endDate) {
                    var msg = startDate > endDate ? "_The start date cannot be later than the end date" : "";
                    item.SetError("ItemStartDate__", msg);
                    item.SetError("ItemEndDate__", msg);
                }
                else {
                    if (startDate) {
                        item.SetError("ItemStartDate__", "");
                    }
                    if (endDate) {
                        item.SetError("ItemEndDate__", "");
                    }
                }
                Purchasing.PRLineItems.LeaveEmptyLine();
            },
            StartDate: {
                OnChange: function () {
                    var item = this.GetItem();
                    var startDate = item.GetValue("ItemStartDate__");
                    item.SetValue("ItemRequestedDeliveryDate__", startDate);
                    item.SetError("ItemRequestedDeliveryDate__", "");
                    item.SetWarning("ItemRequestedDeliveryDate__", "");
                    Purchasing.PRLineItems.CheckStartEndDate(item);
                    if (!item.GetError("ItemStartDate__")) {
                        AutoFillLineItemsWithEmptyValue("ItemStartDate__", startDate, {
                            extraCondition: function (emptyItem) { return Lib.Purchasing.Items.IsServiceBasedItem(emptyItem); },
                            extraSetter: function (emptyItem) {
                                emptyItem.SetValue("ItemRequestedDeliveryDate__", startDate);
                                emptyItem.SetError("ItemRequestedDeliveryDate__", "");
                                emptyItem.SetWarning("ItemRequestedDeliveryDate__", "");
                                Purchasing.PRLineItems.CheckStartEndDate(emptyItem);
                            }
                        });
                    }
                    Purchasing.PRLineItems.RequestedDeliveryDate.OnChange.call(this);
                }
            },
            EndDate: {
                OnChange: function () {
                    var item = this.GetItem();
                    Purchasing.PRLineItems.CheckStartEndDate(item);
                    if (!item.GetError("ItemEndDate__")) {
                        AutoFillLineItemsWithEmptyValue("ItemEndDate__", item.GetValue("ItemEndDate__"), {
                            extraCondition: function (emptyItem) { return Lib.Purchasing.Items.IsServiceBasedItem(emptyItem); }
                        });
                    }
                }
            }
        };
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
