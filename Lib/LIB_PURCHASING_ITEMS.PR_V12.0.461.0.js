///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Items.PR_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_Purchasing_Items.",
  "require": [
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_OnDemand_Users",
    "Sys/Sys_Parameters",
    "Lib_P2P.Base_V12.0.461.0",
    "Lib_Purchasing.Base_V12.0.461.0",
    "Lib_Purchasing_Items.Base_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "Lib_P2P_CompanyCodesValue_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper.SupplyTypesManager_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper.ConditionedPricing_V12.0.461.0",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Items;
        (function (Items) {
            // keep this function in the original namespace Lib.Purchasing.Items
            function ComputePRAmounts(items) {
                var netAmountLocal = new Sys.Decimal(0);
                var count = items.length;
                var i, net, totalNetForeign = new Sys.Decimal(0), rowItem;
                var isMonoCurrency = true;
                var hasForeignCurrency = false;
                var previousCurrency;
                for (i = 0; i < count; i++) {
                    rowItem = items[i];
                    net = rowItem.GetValue("ItemNetAmount__");
                    if (!Sys.Helpers.IsEmpty(net)) {
                        var itemCurrency = rowItem.GetValue("ItemCurrency__");
                        isMonoCurrency = (i == 0) || (isMonoCurrency && (previousCurrency == itemCurrency));
                        if (itemCurrency && itemCurrency != Variable.GetValueAsString("companyCurrency")) {
                            if (isMonoCurrency) {
                                totalNetForeign = totalNetForeign.add(net);
                            }
                            net = new Sys.Decimal(net).mul(rowItem.GetValue("ItemExchangeRate__") || Data.GetValue("ExchangeRate__") || 1).toNumber();
                            hasForeignCurrency = true;
                        }
                        netAmountLocal = netAmountLocal.add(net);
                        previousCurrency = itemCurrency;
                    }
                }
                var totalNetAmount = isMonoCurrency && hasForeignCurrency ? totalNetForeign : netAmountLocal;
                var currency = isMonoCurrency && hasForeignCurrency ? previousCurrency : Variable.GetValueAsString("companyCurrency");
                return {
                    "netAmountLocal": netAmountLocal.toNumber(),
                    "isMonoCurrency": isMonoCurrency,
                    "hasForeignCurrency": hasForeignCurrency,
                    "TotalNetAmount": totalNetAmount.toNumber(),
                    "Currency": currency
                };
            }
            Items.ComputePRAmounts = ComputePRAmounts;
            // Specific methods for PR as fragment lib of the Lib_Purchasing_Items
            var PR;
            (function (PR) {
                var CurrencyFactory = Lib.P2P.Currency.Factory;
                PR.leaveEmptyLine = true;
                function Count() {
                    var table = Data.GetTable("LineItems__");
                    var count = 0, i, row;
                    for (i = table.GetItemCount() - 1; i >= 0; i--) {
                        row = table.GetItem(i);
                        if (!Lib.Purchasing.IsLineItemEmpty(row)) {
                            count++;
                        }
                        else if (PR.leaveEmptyLine) {
                            if (i !== table.GetItemCount() - 1) { // Removes empty row unless it is the last in the table
                                if (row.Remove()) {
                                    Log.Info("remove Line " + i + " ok");
                                }
                                else {
                                    Log.Info("remove Line " + i + " fail");
                                }
                            }
                        }
                    }
                    return count;
                }
                PR.Count = Count;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                function FillBuyerField(item, buyerLogin, itemIndex) {
                    Log.Info("FillBuyerField start");
                    if (Sys.Helpers.IsEmpty(buyerLogin)) {
                        buyerLogin = Data.GetValue("RequisitionInitiator__");
                    }
                    return Sys.OnDemand.Users.CacheByLogin.Get(buyerLogin, Lib.P2P.attributesForUserCache)
                        .Then(function (result) {
                        Log.Info("FillBuyerField: found " + buyerLogin);
                        var buyer = result[buyerLogin];
                        if (buyer.$error) {
                            Log.Error("UpdateBuyer: error on get properties: " + buyer.$error);
                            // Reset buyer login and name
                            item.SetValue("BuyerLogin__", "");
                            item.SetValue("BuyerName__", "");
                            item.SetError("BuyerName__", Language.Translate("_Buyer {0} not found for this supply type", false, buyerLogin));
                        }
                        else {
                            item.SetValue("BuyerLogin__", buyer.login);
                            item.SetValue("BuyerName__", buyer.displayname);
                        }
                    });
                }
                PR.FillBuyerField = FillBuyerField;
                function FillRecipientField(item, recipientLogin) {
                    if (Sys.Helpers.IsEmpty(recipientLogin)) {
                        recipientLogin = Data.GetValue("RequisitionInitiator__");
                    }
                    Log.Info("'Recipient '" + recipientLogin + "' lookup.");
                    if (recipientLogin) {
                        return Sys.OnDemand.Users.CacheByLogin.Get(recipientLogin, Lib.P2P.attributesForUserCache)
                            .Then(function (result) {
                            var recipient = result[recipientLogin];
                            if (recipient.$error) {
                                Log.Error("UpdateRecipient: error on get properties: " + recipient.$error);
                                // Reset Recipient login and name
                                item.SetValue("RecipientLogin__", "");
                                item.SetValue("RecipientName__", "");
                                item.SetError("RecipientName__", Language.Translate("_Recipient {0} not found for this supply type", false, recipientLogin));
                                return;
                            }
                            item.SetValue("RecipientLogin__", recipient.login);
                            item.SetValue("RecipientName__", recipient.displayname);
                            item.SetError("RecipientName__", "");
                        });
                    }
                    // Reset Recipient login and name
                    item.SetValue("RecipientLogin__", "");
                    item.SetValue("RecipientName__", "");
                    item.SetError("RecipientName__", Language.Translate("_Recipient {0} not found for this supply type", false, recipientLogin));
                    return Sys.Helpers.Promise.Resolve();
                }
                PR.FillRecipientField = FillRecipientField;
                function FillBuyerAndRecipientFields(item, itemIndex) {
                    var companyCode = Data.GetValue("CompanyCode__");
                    var supplyTypeId = item.GetValue("SupplyTypeID__");
                    if (!Sys.Helpers.IsEmpty(supplyTypeId) && !Sys.Helpers.IsEmpty(companyCode)) {
                        Log.Info("FillBuyerAndRecipientFields: Supply type with ID:'" + supplyTypeId + "' & Company Code ID: '" + companyCode + "' & index: " + itemIndex + " lookup.");
                        return Lib.Purchasing.CatalogHelper.SupplyTypesManager.Get(supplyTypeId)
                            .Then(function (supplyType) {
                            if (supplyType) {
                                Log.Info("Updating buyer and recipient");
                                return Sys.Helpers.Promise.All([
                                    Lib.Purchasing.Items.PR.FillBuyerField(item, supplyType.buyerLogin, itemIndex),
                                    Lib.Purchasing.Items.PR.FillRecipientField(item, supplyType.recipientLogin)
                                ]);
                            }
                            item.SetError("SupplyTypeName__", "Supply type '" + supplyTypeId + "' not found");
                            // Reset Recipient login and name
                            item.SetValue("RecipientLogin__", "");
                            item.SetValue("RecipientName__", "");
                            // Reset buyer login and name
                            item.SetValue("BuyerLogin__", "");
                            item.SetValue("BuyerName__", "");
                        });
                    }
                    // Reset Recipient login and name
                    item.SetValue("RecipientLogin__", "");
                    item.SetValue("RecipientName__", "");
                    // Reset buyer login and name
                    item.SetValue("BuyerLogin__", "");
                    item.SetValue("BuyerName__", "");
                    return Sys.Helpers.Promise.Resolve();
                }
                PR.FillBuyerAndRecipientFields = FillBuyerAndRecipientFields;
                function SetDeliveryDate(item, index) {
                    var defaultRequestedDeliveryDate = null;
                    var leadTime = item.GetValue("LeadTime__");
                    if (!Sys.Helpers.IsEmpty(leadTime)) {
                        defaultRequestedDeliveryDate = Items.AddLeadTime(leadTime);
                    }
                    else {
                        // Get last added item without a lead time
                        var table = Data.GetTable("LineItems__");
                        var currentRowIndex = index === void 0 ? table.GetItemCount() - 3 : index;
                        var lastKeyedDate = null;
                        var lastKeyedDateFound = false;
                        while (!lastKeyedDateFound && currentRowIndex >= 0) {
                            var rowLeadTime = table.GetItem(currentRowIndex).GetValue("LeadTime__");
                            if (Sys.Helpers.IsEmpty(rowLeadTime)) {
                                lastKeyedDateFound = true;
                                lastKeyedDate = table.GetItem(currentRowIndex).GetValue("ItemRequestedDeliveryDate__");
                            }
                            else {
                                currentRowIndex--;
                            }
                        }
                        if (!Sys.Helpers.IsEmpty(lastKeyedDate)) {
                            defaultRequestedDeliveryDate = new Date(lastKeyedDate);
                        }
                    }
                    item.SetValue("ItemRequestedDeliveryDate__", defaultRequestedDeliveryDate);
                }
                PR.SetDeliveryDate = SetDeliveryDate;
                function CheckDeliveryDateInPast(item) {
                    var ok = true;
                    var deliveryDate = item.GetValue("ItemRequestedDeliveryDate__");
                    var deliveryDateInPast = Sys.Helpers.Date.CompareDateToToday(deliveryDate) < 0;
                    if (deliveryDateInPast && !Lib.P2P.IsServiceBasedItem(item)) {
                        if (Sys.Parameters.GetInstance("PAC").GetParameter("AllowRequestedDeliveryDateInPast", false)) {
                            item.SetWarning("ItemRequestedDeliveryDate__", "_Warning date in the past");
                        }
                        else {
                            item.SetError("ItemRequestedDeliveryDate__", "_Error date in the past");
                            ok = false;
                        }
                    }
                    return ok;
                }
                PR.CheckDeliveryDateInPast = CheckDeliveryDateInPast;
                function UpdateRequestedDeliveryDateInPast() {
                    var atLeastOneDeliveryDateInPast = false;
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                        if (!Lib.Purchasing.IsLineItemEmpty(item)) {
                            var deliveryDate = item.GetValue("ItemRequestedDeliveryDate__");
                            var deliveryDateInPast = Sys.Helpers.Date.CompareDateToToday(deliveryDate) < 0;
                            item.SetValue("RequestedDeliveryDateInPast__", deliveryDateInPast);
                            atLeastOneDeliveryDateInPast = atLeastOneDeliveryDateInPast || deliveryDateInPast;
                        }
                    });
                    Data.SetValue("AtLeastOneRequestedDeliveryDateInPast__", atLeastOneDeliveryDateInPast);
                }
                PR.UpdateRequestedDeliveryDateInPast = UpdateRequestedDeliveryDateInPast;
                function CheckDeliveryDateBelowLeadTime(item) {
                    var newRequestedDeliveryDate = new Date(item.GetValue("ItemRequestedDeliveryDate__"));
                    var defaultRequestedDeliveryDate = Items.AddLeadTime(item.GetValue("LeadTime__"));
                    if (newRequestedDeliveryDate < defaultRequestedDeliveryDate) {
                        item.SetWarning("ItemRequestedDeliveryDate__", "_Warning the requested delivery date is too soon (expected {0} or later)", Language.FormatDate(defaultRequestedDeliveryDate));
                    }
                    else {
                        item.SetWarning("ItemRequestedDeliveryDate__", "");
                    }
                }
                PR.CheckDeliveryDateBelowLeadTime = CheckDeliveryDateBelowLeadTime;
                function FillItemAmount(item) {
                    if (Lib.P2P.IsAmountBasedItem(item)) {
                        var netAmount = item.GetValue("ItemNetAmount__");
                        if (!netAmount || netAmount === 0) {
                            netAmount = item.GetValue("ItemQuantity__");
                        }
                        item.SetValue("ItemQuantity__", netAmount || 0);
                        item.SetValue("ItemUnitPrice__", 1);
                        item.SetValue("ItemNetAmount__", netAmount || 0);
                    }
                    else {
                        var quantity = item.GetValue("ItemQuantity__");
                        if (item.IsNullOrEmpty("ItemQuantity__") || quantity === 0) {
                            item.SetValue("ItemQuantity__", 1);
                            quantity = 1;
                        }
                        var itemCurrency = CurrencyFactory.Get(item.GetValue("ItemCurrency__"));
                        var unitPrice = Lib.Purchasing.CatalogHelper.GetItemUnitPrice(item.GetValue("ItemNumber__"), item.GetValue("VendorNumber__"), quantity, item.GetValue("ItemUnitPrice__"), itemCurrency);
                        var price = Lib.Purchasing.CatalogHelper.GetItemPrice(item.GetValue("ItemNumber__"), item.GetValue("VendorNumber__"), quantity, item.GetValue("ItemUnitPrice__"), itemCurrency);
                        item.SetValue("ItemUnitPrice__", unitPrice === null || unitPrice === void 0 ? void 0 : unitPrice.toNumber());
                        item.SetValue("ItemNetAmount__", price === null || price === void 0 ? void 0 : price.toNumber());
                    }
                }
                PR.FillItemAmount = FillItemAmount;
                function FillTotalAmounts() {
                    Log.Info("FillTotalAmounts");
                    var table = Data.GetTable("LineItems__");
                    // Call Count() to remove empty lines (else we could have used a foreach loop)
                    var count = Count(), i;
                    var items = [];
                    for (i = 0; i < count; i++) {
                        items.push(table.GetItem(i));
                    }
                    var beforeTotalNetLocal = Data.GetValue("TotalNetLocalCurrency__");
                    var beforeTotalNetAmount = Data.GetValue("TotalNetAmount__");
                    var res = ComputePRAmounts(items);
                    Data.SetValue("Currency__", res.Currency);
                    Data.SetValue("TotalNetLocalCurrency__", res.netAmountLocal);
                    var companyCodeValues = Lib.P2P.CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__"));
                    Data.SetValue("TotalNetAmount__", res.TotalNetAmount);
                    if (companyCodeValues && companyCodeValues.currencies) {
                        var exchangeRate = companyCodeValues.currencies.GetRate(res.Currency);
                        Data.SetValue("ExchangeRate__", exchangeRate);
                    }
                    var afterTotalNetLocal = Data.GetValue("TotalNetLocalCurrency__");
                    var afterTotalNetAmount = Data.GetValue("TotalNetAmount__");
                    var haveChanged = beforeTotalNetLocal != afterTotalNetLocal || beforeTotalNetAmount != afterTotalNetAmount;
                    return __assign(__assign({}, res), { haveChanged: haveChanged });
                }
                PR.FillTotalAmounts = FillTotalAmounts;
                var cacheExpenseCategory = {};
                function QueryExpenseCategory(filter) {
                    if (!cacheExpenseCategory[filter]) {
                        var options = {
                            table: "P2P - Expense category__",
                            filter: filter,
                            attributes: ["Description__", "CostType__"],
                            sortOrder: null,
                            maxRecords: 1
                        };
                        cacheExpenseCategory[filter] = Sys.GenericAPI.PromisedQuery(options);
                    }
                    return cacheExpenseCategory[filter];
                }
                PR.QueryExpenseCategory = QueryExpenseCategory;
                function FillExpenseCategoryField(currentItem) {
                    var expenseCategoryId = currentItem.GetValue("ItemGroup__");
                    if (Sys.Helpers.IsEmpty(expenseCategoryId)) {
                        currentItem.SetValue("ItemGroupDescription__", null);
                        return Sys.Helpers.Promise.Resolve();
                    }
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ExpenseCategory__", expenseCategoryId), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")));
                    return QueryExpenseCategory(filter.toString())
                        .Then(function (queryResult) {
                        currentItem.SetValue("ItemGroupDescription__", queryResult.length == 1 ? queryResult[0].Description__ : null);
                        if (Sys.Helpers.IsEmpty(currentItem.GetValue("CostType__"))) {
                            currentItem.SetValue("CostType__", queryResult.length == 1 ? queryResult[0].CostType__ : null);
                        }
                    })
                        .Catch(function ( /*error: string*/) {
                        currentItem.SetValue("ItemGroupDescription__", null);
                    });
                }
                PR.FillExpenseCategoryField = FillExpenseCategoryField;
                function FillInducedFields(item, forceDefaultGLAccount, forceDefaultCostType) {
                    var supplyTypeID = item.GetValue("SupplyTypeID__");
                    if (supplyTypeID) {
                        return Lib.Purchasing.CatalogHelper.SupplyTypesManager.Get(supplyTypeID)
                            .Then(function (supplyType) {
                            if (supplyType) {
                                item.SetValue("SupplyTypeName__", supplyType.name);
                                item.SetValue("NoGoodsReceipt__", supplyType.noGoodsReceipt);
                                item.SetValue("NotifyRequesterOnReceipt__", supplyType.notifyRequesterOnReceipt);
                                if (forceDefaultGLAccount !== false || Sys.Helpers.IsEmpty(item.GetValue("ItemGLAccount__"))) {
                                    item.SetValue("ItemGLAccount__", supplyType.defaultGLAccount);
                                    item.SetValue("ItemGroup__", supplyType.defaultGLAccountGroup);
                                    FillExpenseCategoryField(item);
                                }
                                // Fill Cost type from item category if not filled from catalog
                                if (forceDefaultCostType !== false || Sys.Helpers.IsEmpty(item.GetValue("CostType__"))) {
                                    item.SetValue("CostType__", supplyType.defaultCostType);
                                }
                                if (!forceDefaultCostType && Sys.Helpers.IsEmpty(item.GetValue("CostType__"))) {
                                    Lib.P2P.fillCostTypeFromGLAccount(item, "ItemGLAccount__");
                                }
                                if (supplyType != null) {
                                    item.SetValue("SupplyTypeFullpath__", supplyType.GetPath());
                                }
                            }
                        });
                    }
                    return Sys.Helpers.Promise.Resolve();
                }
                PR.FillInducedFields = FillInducedFields;
                function FillReportedCatalogAttributes(selectedItem, item, useMultiSupplierFieldName) {
                    if (Sys.Helpers.IsEmpty(item.GetValue("SupplierPartID__"))) {
                        item.SetValue("SupplierPartID__", item.GetValue("ItemNumber__"));
                    }
                    item.SetValue("ItemOrigin__", "InternalCatalog");
                    //default value in case of upgrade
                    item.SetValue("ItemType__", selectedItem.GetValue("ItemType__") || Lib.P2P.ItemType.QUANTITY_BASED);
                    if (useMultiSupplierFieldName) {
                        item.SetValue("PublicPrice__", selectedItem.GetValue("ITEMNUMBER__.PUBLICPRICE__") || selectedItem.GetValue("ITEMNUMBER__.UNITPRICE__"));
                        if (Lib.P2P.IsAmountBasedItem(item)) {
                            item.SetValue("ItemNetAmount__", selectedItem.GetValue("ITEMNUMBER__.UNITPRICE__"));
                        }
                    }
                    else {
                        item.SetValue("PublicPrice__", selectedItem.GetValue("PublicPrice__") || selectedItem.GetValue("ItemUnitPrice__"));
                        if (Lib.P2P.IsAmountBasedItem(item)) {
                            item.SetValue("ItemNetAmount__", selectedItem.GetValue("ItemUnitPrice__"));
                        }
                    }
                }
                PR.FillReportedCatalogAttributes = FillReportedCatalogAttributes;
                function FillExchangeRateField(item) {
                    if (Lib.P2P.CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__")).currencies) {
                        var exchangeRate = Lib.P2P.CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__")).currencies.GetRate(item.GetValue("ItemCurrency__"));
                        item.SetValue("ItemExchangeRate__", exchangeRate);
                    }
                }
                PR.FillExchangeRateField = FillExchangeRateField;
            })(PR = Items.PR || (Items.PR = {}));
        })(Items = Purchasing.Items || (Purchasing.Items = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
