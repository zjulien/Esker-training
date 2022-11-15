/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CatalogHelper.ConditionedPricing_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_Purchasing_CatalogHelper",
  "require": [
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_LdapUtil",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "Lib_Purchasing_ConditionedPricing_V12.0.461.0",
    "LIB_P2P.Base_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var CatalogHelper;
        (function (CatalogHelper) {
            CatalogHelper.g_cache_ConditionedPricing = {};
            function GetItemUnitPrice(itemNumber, vendorNumber, itemQuantity, defaultUnitPrice, currency) {
                var conditionedPrice = CatalogHelper.g_cache_ConditionedPricing[itemNumber + vendorNumber];
                if (conditionedPrice && itemQuantity > 0) {
                    var roundPrice = Sys.Helpers.Round(conditionedPrice.ComputePrice(itemQuantity), currency.amountPrecision);
                    return Sys.Helpers.Round(roundPrice.div(itemQuantity), currency.unitPricePrecision);
                }
                return Sys.Helpers.IsNumeric(defaultUnitPrice) ? Sys.Helpers.Round(new Sys.Decimal(defaultUnitPrice), currency.unitPricePrecision) : null;
            }
            CatalogHelper.GetItemUnitPrice = GetItemUnitPrice;
            function GetItemPrice(itemNumber, vendorNumber, itemQuantity, defaultUnitPrice, currency) {
                var conditionedPrice = CatalogHelper.g_cache_ConditionedPricing[itemNumber + vendorNumber];
                if (conditionedPrice) {
                    return Sys.Helpers.Round(conditionedPrice.ComputePrice(itemQuantity), currency.amountPrecision);
                }
                return Sys.Helpers.IsNumeric(defaultUnitPrice) ? Sys.Helpers.Round(new Sys.Decimal(defaultUnitPrice || 0)
                    .mul(itemQuantity || 0), currency.amountPrecision) : null;
            }
            CatalogHelper.GetItemPrice = GetItemPrice;
            function PopulateCacheConditionedPricingData(items) {
                var _a;
                var hasChanged = false;
                var uniqueItemsToQuery = {};
                items.forEach(function (item) {
                    if (item.pricesData) {
                        CatalogHelper.g_cache_ConditionedPricing[item.ItemNumber__ + item.VendorNumber__] = Purchasing.ConditionedPricing.Factory.FromData(item.pricesData);
                    }
                    if (item.pricesData === null) {
                        CatalogHelper.g_cache_ConditionedPricing[item.ItemNumber__ + item.VendorNumber__] = null;
                    }
                    if (!(item.ItemNumber__ + item.VendorNumber__ in CatalogHelper.g_cache_ConditionedPricing)) {
                        uniqueItemsToQuery[item.ItemNumber__ + item.VendorNumber__] = {
                            ItemNumber__: item.ItemNumber__,
                            VendorNumber__: item.VendorNumber__
                        };
                    }
                });
                var itemsToQuery = Sys.Helpers.Object.Values(uniqueItemsToQuery);
                if (itemsToQuery.length > 0) {
                    var itemsFilterArray = itemsToQuery.map(function (item) { return Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__", item.ItemNumber__), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", item.VendorNumber__)); });
                    var filter = Sys.Helpers.LdapUtil.FilterAnd((_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, itemsFilterArray), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__") || ""), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__")));
                    return Sys.GenericAPI.PromisedQuery({
                        table: "P2P - VendorItems__",
                        filter: filter.toString(),
                        attributes: ["PRICECONDITIONDATA__", "ITEMNUMBER__", "ITEMUNITPRICE__", "ITEMTYPE__", "VENDORNUMBER__"],
                        maxRecords: 100
                    })
                        .Then(function (results) {
                        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                            var result = results_1[_i];
                            var key = result.ITEMNUMBER__ + result.VENDORNUMBER__;
                            if (result.PRICECONDITIONDATA__) {
                                hasChanged = true;
                                CatalogHelper.g_cache_ConditionedPricing[key] = Purchasing.ConditionedPricing.Factory.FromData(JSON.parse(result.PRICECONDITIONDATA__));
                            }
                            else if (result.ITEMTYPE__ == Lib.P2P.ItemType.QUANTITY_BASED) {
                                hasChanged = true;
                                CatalogHelper.g_cache_ConditionedPricing[key] = Purchasing.ConditionedPricing.Factory.FromData({
                                    type: Purchasing.ConditionedPricing.Type.UniquePricing,
                                    thresholds: [{
                                            threshold: 0,
                                            base: 0,
                                            unitPrice: result.ITEMUNITPRICE__ || 0
                                        }]
                                });
                            }
                            else {
                                CatalogHelper.g_cache_ConditionedPricing[key] = null;
                            }
                        }
                        return hasChanged;
                    });
                }
                return Sys.Helpers.Promise.Resolve(hasChanged);
            }
            CatalogHelper.PopulateCacheConditionedPricingData = PopulateCacheConditionedPricingData;
        })(CatalogHelper = Purchasing.CatalogHelper || (Purchasing.CatalogHelper = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
