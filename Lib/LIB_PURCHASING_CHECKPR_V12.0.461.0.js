///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CheckPR_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_ShipTo_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "Sys/Sys_Helpers",
    "[Lib_PR_Customization_Common]",
    "Lib_P2P_Inventory_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var CheckPR;
        (function (CheckPR) {
            var g_Data = Sys.Helpers.Globals.Data;
            // required line items
            CheckPR.requiredItems = ["ItemCostCenterName__",
                "ItemUnitPrice__",
                "ItemNetAmount__",
                "ItemQuantity__",
                "ItemDescription__",
                "SupplyTypeName__",
                "ItemCurrency__",
                "BuyerName__"];
            function SetRequiredItem(itemName, required) {
                if (required) {
                    this.requiredItems.push(itemName);
                }
                else {
                    Sys.Helpers.Array.Remove(this.requiredItems, function (item) {
                        return item === itemName;
                    });
                }
            }
            CheckPR.SetRequiredItem = SetRequiredItem;
            function MigrateOldToNewBehaviour() {
                if (!Lib.Purchasing.IsMultiShipTo() && !Lib.Purchasing.ShipTo.IsEmpty()) {
                    if (Variable.GetValueAsString("ShipToAddress") && !Sys.TechnicalData.GetValue("ShipToAddress")) {
                        Sys.TechnicalData.SetValue("ShipToAddress", JSON.parse(Variable.GetValueAsString("ShipToAddress") || null));
                    }
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                        if (Lib.Purchasing.ShipTo.IsEmptyItem(item)) {
                            Lib.Purchasing.ShipTo.FillItemFromHeader(item);
                        }
                    });
                }
            }
            /**
             * PS Can push Controls2Check by Role like this :
             * In Lib_PR_Customisation_Client
             * Lib.Purchasing.CheckPR.controls2CheckByRole[Lib.Purchasing.roleRequester] = ["ShipToAddress__","ShipToContact__"]
             */
            CheckPR.controls2CheckByRole = {};
            /**
             * @description Check required fields values on Purchase Requisition
             *
             * @returns a boolean value indicating that all required values have been set
             *
             * @example let requiredFields = new Lib.Purchasing.CheckPR.RequiredFields();
             *
             **/
            var RequiredFields;
            (function (RequiredFields) {
                function allowRequestedDeliveryDateInPast() {
                    return Sys.Parameters.GetInstance("PAC")
                        .GetParameter("AllowRequestedDeliveryDateInPast", false);
                }
                RequiredFields.allowRequestedDeliveryDateInPast = allowRequestedDeliveryDateInPast;
                function CheckItemDeliveryDate(item, options, isRequired, isReadOnly) {
                    var ok = true;
                    if (!Lib.Purchasing.IsLineItemEmpty(item)) {
                        var deliveryDate = item.GetValue("ItemRequestedDeliveryDate__");
                        var serviceBased = Lib.Purchasing.Items.IsServiceBasedItem(item);
                        if (serviceBased && options.ignoreRequiredCheck !== true && isRequired) {
                            if (!item.GetValue("ItemStartDate__")) {
                                item.SetError("ItemStartDate__", "This field is required!");
                                ok = false;
                            }
                            if (!item.GetValue("ItemEndDate__")) {
                                item.SetError("ItemEndDate__", "This field is required!");
                                ok = false;
                            }
                        }
                        if (Sys.Helpers.IsEmpty(deliveryDate)) {
                            if (options.ignoreRequiredCheck !== true && isRequired) {
                                item.SetError("ItemRequestedDeliveryDate__", "This field is required!");
                                ok = false;
                            }
                        }
                        else if (!isReadOnly) {
                            if (!Lib.Purchasing.Items.PR.CheckDeliveryDateInPast(item)) {
                                ok = false;
                            }
                        }
                    }
                    return ok;
                }
                function CheckItemsDeliveryDates(currentRole, options) {
                    options = options || {};
                    var table = g_Data.GetTable("LineItems__");
                    // case requester submiting a QR
                    var isReadOnly = Lib.Purchasing.RequestedDeliveryDate.IsReadOnly(currentRole);
                    var isRequired = Lib.Purchasing.RequestedDeliveryDate.IsRequired(currentRole);
                    var ok = true;
                    if (Sys.Helpers.IsNumeric(options.specificItemIndex)) {
                        var item = table.GetItem(options.specificItemIndex);
                        if (item) {
                            ok = CheckItemDeliveryDate(item, options, isRequired, isReadOnly);
                        }
                    }
                    else {
                        var count = table.GetItemCount();
                        for (var i = 0; i < count; i++) {
                            var item = table.GetItem(i);
                            if (!CheckItemDeliveryDate(item, options, isRequired, isReadOnly)) {
                                ok = false;
                            }
                        }
                    }
                    if (!isReadOnly) {
                        Lib.Purchasing.Items.PR.UpdateRequestedDeliveryDateInPast();
                    }
                    return ok;
                }
                RequiredFields.CheckItemsDeliveryDates = CheckItemsDeliveryDates;
                function CheckTotal( /*currentRole: string*/) {
                    // the buyer (quote) has to set the amount of the purchase requisition, if no quote, the requester has to set the amount
                    var table = g_Data.GetTable("LineItems__");
                    var isUnitOfMeasureEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure");
                    // case requester submiting a QR
                    var ok = true;
                    var count = table.GetItemCount();
                    var _loop_1 = function (i) {
                        var item = table.GetItem(i);
                        var isAmountBased = Lib.Purchasing.Items.IsAmountBasedItem(item);
                        var allRequiredItems = Lib.Purchasing.CheckPR.requiredItems;
                        Sys.Helpers.Array.ForEach(allRequiredItems, function (reqItem) {
                            if (Sys.Helpers.IsEmpty(item.GetValue(reqItem))) {
                                item.SetError(reqItem, "This field is required!");
                                ok = false;
                            }
                        });
                        if (isAmountBased) {
                            if (item.GetValue("ItemNetAmount__") <= 0) {
                                item.SetError("ItemNetAmount__", "Value is not allowed!");
                                ok = false;
                            }
                            item.SetValue("ItemUnit__", "");
                            item.SetValue("ItemUnitDescription__", "");
                        }
                        else {
                            if (isUnitOfMeasureEnabled && Sys.Helpers.IsEmpty(item.GetValue("ItemUnit__"))) {
                                item.SetError("ItemUnit__", "This field is required!");
                                ok = false;
                            }
                            if (item.GetValue("ItemQuantity__") <= 0) {
                                item.SetError("ItemQuantity__", "Value is not allowed!");
                                ok = false;
                            }
                        }
                        if (!Sys.Helpers.IsEmpty(item.GetError("ItemGLAccount__"))) {
                            item.SetValue("ItemGLAccount__", "");
                        }
                    };
                    for (var i = 0; i < count; i++) {
                        _loop_1(i);
                    }
                    return ok;
                }
                RequiredFields.CheckTotal = CheckTotal;
                function CheckRequiredFields(currentRole) {
                    var ok = true;
                    if (Lib.Purchasing.CheckPR.controls2CheckByRole[currentRole]) {
                        var controls = Lib.Purchasing.CheckPR.controls2CheckByRole[currentRole];
                        for (var i = 0; i < controls.length; i++) {
                            if (Sys.Helpers.IsEmpty(g_Data.GetValue(controls[i]))) {
                                g_Data.SetError(controls[i], "This field is required!");
                                ok = false;
                            }
                        }
                    }
                    return ok;
                }
                RequiredFields.CheckRequiredFields = CheckRequiredFields;
                function CheckItemsTakenFromStock() {
                    var bok = true;
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                        if (Lib.P2P.Inventory.IsItemTakenFromStock(item) && Lib.P2P.Inventory.IsReplenishmentRequest()) {
                            bok = false;
                            item.SetError("ItemDescription__", "_CannotAddItemFromWarehouseInReplenishment");
                        }
                        else if (item.GetError("ItemDescription__") == Language.Translate("_CannotAddItemFromWarehouseInReplenishment", false)) {
                            item.SetError("ItemDescription__", "");
                        }
                    });
                    return bok;
                }
                RequiredFields.CheckItemsTakenFromStock = CheckItemsTakenFromStock;
                function CheckUpdatedItems(doNotCheckLeadTime) {
                    var _a;
                    var table = g_Data.GetTable("LineItems__");
                    var multiSupplierItemsEnabled = Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled();
                    var QueryItems = function (filter) {
                        var tableName = multiSupplierItemsEnabled
                            ? "P2P - CatalogItems__"
                            : "PurchasingOrderedItems__";
                        var attributes = multiSupplierItemsEnabled
                            ? [
                                "ItemNumber__",
                                "ItemNumber__.ValidityDate__",
                                "ItemNumber__.ExpirationDate__",
                                "ItemNumber__.LeadTime__"
                            ]
                            : [
                                "ItemNumber__",
                                "ValidityDate__",
                                "ExpirationDate__",
                                "LeadTime__"
                            ];
                        var options = {
                            table: tableName,
                            filter: filter,
                            attributes: attributes,
                            additionalOptions: {
                                bigQuery: true,
                                queryOptions: "EnableJoin=1"
                            }
                        };
                        return Sys.GenericAPI.PromisedQuery(options);
                    };
                    var requisitionStatus = Data.GetValue("RequisitionStatus__");
                    if (requisitionStatus !== "To receive" && requisitionStatus !== "Received" && requisitionStatus !== "Rejected" && requisitionStatus !== "Canceled") {
                        var items_1 = [];
                        var filter = [];
                        var companyCodeField = multiSupplierItemsEnabled ? "CompanyCode__" : "ItemCompanyCode__";
                        for (var i = 0; i < table.GetItemCount(); i++) {
                            var item = table.GetItem(i);
                            if (!Lib.Purchasing.IsLineItemEmpty(item)) {
                                var itemID = item.GetValue("ItemNumber__");
                                items_1[i] = item;
                                var itemFilter = void 0;
                                if (multiSupplierItemsEnabled) {
                                    itemFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__", itemID), Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.VENDORNUMBER__", item.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", item.GetValue("WarehouseID__"))));
                                }
                                else {
                                    itemFilter = Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__", itemID);
                                }
                                filter.push(itemFilter);
                            }
                        }
                        var queryItemsFilter = Sys.Helpers.LdapUtil.FilterAnd((_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, filter), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual(companyCodeField, Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual(companyCodeField, ""), Sys.Helpers.LdapUtil.FilterNotExist(companyCodeField)));
                        if (filter.length) {
                            return QueryItems(queryItemsFilter.toString())
                                .Then(function (results) {
                                if (results) {
                                    items_1.forEach(function (item) {
                                        var result = results.filter(function (res) { return res.ItemNumber__ === item.GetValue("ItemNumber__"); });
                                        if (result.length > 0) {
                                            result = result[0];
                                            // Check item after update
                                            var date = new Date();
                                            date.setHours(0, 0, 0, 0);
                                            if (((result.ExpirationDate__ || result["ItemNumber__.ExpirationDate__"]) && Sys.Helpers.Date.CompareDate(date, new Date(result.ExpirationDate__ || result["ItemNumber__.ExpirationDate__"])) > 0)
                                                || ((result.ValidityDate__ || result["ItemNumber__.ValidityDate__"]) && Sys.Helpers.Date.CompareDate(date, new Date(result.ValidityDate__ || result["ItemNumber__.ValidityDate__"])) < 0)) {
                                                item.SetError("ItemDescription__", "_Item not available");
                                            }
                                            else {
                                                if (item.GetError("ItemDescription__") === Language.Translate("_Item not available", false)) {
                                                    item.SetError("ItemDescription__", "");
                                                }
                                                if (!doNotCheckLeadTime && requisitionStatus !== "To approve" && item.GetValue("ItemRequestedDeliveryDate__")) {
                                                    var itemDeliveryDate = new Date(item.GetValue("ItemRequestedDeliveryDate__"));
                                                    item.SetValue("LeadTime__", result.LeadTime__ || result["ItemNumber__.LeadTime__"]);
                                                    date.setDate(date.getDate() + parseInt(result.LeadTime__ || result["ItemNumber__.LeadTime__"], 10));
                                                    if (Sys.Helpers.Date.CompareDate(itemDeliveryDate, date) < 0) {
                                                        item.SetWarning("ItemRequestedDeliveryDate__", "_Warning the requested delivery date is too soon (expected {0} or later)", Language.FormatDate(date));
                                                    }
                                                    else {
                                                        item.SetWarning("ItemRequestedDeliveryDate__", "");
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                        }
                        return Sys.Helpers.Promise.Resolve();
                    }
                }
                RequiredFields.CheckUpdatedItems = CheckUpdatedItems;
                function CheckAll(currentRole) {
                    var table = g_Data.GetTable("LineItems__");
                    Lib.Purchasing.RemoveEmptyLineItem(table);
                    MigrateOldToNewBehaviour();
                    // Checks everything, even if one fails
                    var ok = true;
                    ok = CheckTotal() && ok;
                    ok = CheckItemsDeliveryDates(currentRole) && ok;
                    ok = CheckItemsTakenFromStock() && ok;
                    ok = CheckRequiredFields(currentRole) && ok;
                    ok = Lib.Purchasing.ShipTo.CheckDeliveryAddress(currentRole) && ok;
                    if (Sys.Helpers.TryGetFunction("Lib.PR.Customization.Common.OnValidateForm")) {
                        var customIsValid = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Common.OnValidateForm", ok);
                        if (typeof customIsValid === "boolean") {
                            return Sys.Helpers.Promise.Resolve(customIsValid);
                        }
                        else if (Sys.Helpers.Promise.IsPromise(customIsValid)) {
                            return customIsValid;
                        }
                    }
                    return Sys.Helpers.Promise.Resolve(ok);
                }
                RequiredFields.CheckAll = CheckAll;
            })(RequiredFields = CheckPR.RequiredFields || (CheckPR.RequiredFields = {}));
            function CheckOverorderedItem(item) {
                if (!Lib.P2P.Inventory.IsEnabled()) {
                    return true;
                }
                if (Sys.ScriptInfo.IsServer()) {
                    return CheckOverorderedItemServerSide();
                }
                return CheckOverorderedItemClientSide(item);
            }
            CheckPR.CheckOverorderedItem = CheckOverorderedItem;
            function CheckOverorderedItemServerSide() {
                var bok = true;
                var itemsByItemNumber = [];
                var vendorItemFilter = [];
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    if (Lib.P2P.Inventory.IsItemTakenFromStock(item)) {
                        var index = item.GetValue("ItemNumber__") + item.GetValue("WarehouseID__");
                        if (!itemsByItemNumber[index]) {
                            vendorItemFilter.push({
                                companyCode: Data.GetValue("CompanyCode__"),
                                itemNumber: item.GetValue("ItemNumber__"),
                                warehouseNumber: item.GetValue("WarehouseID__")
                            });
                            itemsByItemNumber[index] = {
                                items: [],
                                itemNumber: item.GetValue("ItemNumber__"),
                                warehouseNumber: item.GetValue("WarehouseID__"),
                                requestedQuantity: 0
                            };
                        }
                        itemsByItemNumber[index].items.push(item);
                        itemsByItemNumber[index].requestedQuantity += item.GetValue("ItemQuantity__");
                    }
                });
                if (vendorItemFilter.length > 0) {
                    Lib.Purchasing.CatalogHelper.GetVendorItems(vendorItemFilter)
                        .Then(function (vendorItems) {
                        vendorItems.forEach(function (vendorItem) {
                            var index = vendorItem.itemNumber + vendorItem.warehouseNumber;
                            var itemByItemNumber = itemsByItemNumber[index];
                            if (new Sys.Decimal(vendorItem.availableStock).lessThan(itemByItemNumber.requestedQuantity)) {
                                Log.Error("Item " + vendorItem.itemNumber + " from warehouse " + vendorItem.warehouseNumber + " is overordered");
                                itemByItemNumber.items.forEach(function (item) {
                                    item.SetError("ItemQuantity__", Language.Translate("_NoStockAvailable", false, vendorItem.availableStock));
                                    item.SetValue("AvailableStock__", vendorItem.availableStock);
                                    bok = false;
                                });
                            }
                            else {
                                itemByItemNumber.items.forEach(function (item) {
                                    item.SetError("ItemQuantity__", "");
                                });
                            }
                        });
                    })
                        .Catch(function (e) {
                        Log.Error("Failed to check available quantity for items" + e);
                        bok = false;
                    });
                }
                return bok;
            }
            function CheckOverorderedItemClientSide(itemToCheck) {
                var bok = true;
                var itemsByItemNumber = {};
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    var currentItemNumber = item.GetValue("ItemNumber__");
                    if (Lib.P2P.Inventory.IsItemTakenFromStock(item)) {
                        if (!itemToCheck || (itemToCheck && itemToCheck.GetValue("ItemNumber__") == currentItemNumber && itemToCheck.GetValue("WarehouseID__") == item.GetValue("WarehouseID__"))) {
                            var index = currentItemNumber + item.GetValue("WarehouseID__");
                            if (!itemsByItemNumber[index]) {
                                itemsByItemNumber[index] = { items: [], requestedQty: 0, stock: 0 };
                            }
                            itemsByItemNumber[index].items.push(item);
                            itemsByItemNumber[index].requestedQty += item.GetValue("ItemQuantity__");
                            itemsByItemNumber[index].stock = item.GetValue("AvailableStock__");
                        }
                    }
                });
                Sys.Helpers.Object.ForEach(itemsByItemNumber, function (itemByItemNumber) {
                    itemByItemNumber.items.forEach(function (item) {
                        if (itemByItemNumber.requestedQty > itemByItemNumber.stock) {
                            item.SetError("ItemQuantity__", Language.Translate("_NoStockAvailable", false, itemByItemNumber.stock));
                            bok = false;
                        }
                        else {
                            item.SetError("ItemQuantity__", "");
                        }
                    });
                });
                return bok;
            }
            function IsSingleVendor() {
                var table = g_Data.GetTable("LineItems__");
                var count = table.GetItemCount();
                if (count <= 1) {
                    return true;
                }
                var vendorRef = table.GetItem(0).GetValue("VendorName__");
                for (var i = 1; i < count; i++) {
                    var item = table.GetItem(i);
                    if (item.GetValue("VendorName__") !== vendorRef) {
                        return false;
                    }
                }
                return true;
            }
            CheckPR.IsSingleVendor = IsSingleVendor;
        })(CheckPR = Purchasing.CheckPR || (Purchasing.CheckPR = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
