///#GLOBALS Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_PurchaseOrder_Common_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "library: SAP FI post routines.",
  "require": [
    "Lib_Parameters_P2P_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_Promise"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var PurchaseOrder;
            (function (PurchaseOrder) {
                var PlannedDeliveryCost = /** @class */ (function () {
                    /**
                     *
                     */
                    function PlannedDeliveryCost(sapDeliveryCost) {
                        // set default values
                        this.ConditionType = "";
                        this.ItemNumber = "";
                        this.AccountNumber = "";
                        this.LocalCurrency = "";
                        this.ForeignCurrency = "";
                        this.LocalDeliveredAmount = 0;
                        this.ForeignDeliveredAmount = 0;
                        this.DeliveredQuantity = 0;
                        this.LocalInvoicedAmount = 0;
                        this.ForeignInvoicedAmount = 0;
                        this.InvoicedQuantity = 0;
                        if (sapDeliveryCost) {
                            this.ConditionType = sapDeliveryCost.KSCHL;
                            this.ItemNumber = sapDeliveryCost.EBELP;
                            this.LocalCurrency = sapDeliveryCost.HSWAE;
                            this.ForeignCurrency = sapDeliveryCost.WAERS;
                            this.AccountNumber = sapDeliveryCost.LIFNR;
                            if (sapDeliveryCost.SHKZG === "H") {
                                this.LocalDeliveredAmount = parseFloat(sapDeliveryCost.DMBTR);
                                this.ForeignDeliveredAmount = parseFloat(sapDeliveryCost.WRBTR);
                                if (sapDeliveryCost.VGABE !== "3") {
                                    // We don't count quantities of subsequent debit/credit as invoiced quantities - FT-027088
                                    this.DeliveredQuantity = parseFloat(sapDeliveryCost.MENGE);
                                }
                            }
                            else {
                                this.LocalInvoicedAmount = parseFloat(sapDeliveryCost.DMBTR);
                                this.ForeignInvoicedAmount = parseFloat(sapDeliveryCost.WRBTR);
                                if (sapDeliveryCost.VGABE !== "3") {
                                    // We don't count quantities of subsequent debit/credit as invoiced quantities - FT-027088
                                    this.InvoicedQuantity = parseFloat(sapDeliveryCost.MENGE);
                                }
                            }
                        }
                    }
                    PlannedDeliveryCost.clone = function (other) {
                        var result = new PlannedDeliveryCost();
                        result.ConditionType = other.ConditionType;
                        result.ItemNumber = other.ItemNumber;
                        result.AccountNumber = other.AccountNumber;
                        result.LocalCurrency = other.LocalCurrency;
                        result.ForeignCurrency = other.ForeignCurrency;
                        result.LocalDeliveredAmount = other.LocalDeliveredAmount;
                        result.ForeignDeliveredAmount = other.ForeignDeliveredAmount;
                        result.DeliveredQuantity = other.DeliveredQuantity;
                        result.LocalInvoicedAmount = other.LocalInvoicedAmount;
                        result.ForeignInvoicedAmount = other.ForeignInvoicedAmount;
                        result.InvoicedQuantity = other.InvoicedQuantity;
                        return result;
                    };
                    return PlannedDeliveryCost;
                }());
                PurchaseOrder.PlannedDeliveryCost = PlannedDeliveryCost;
                /**
                * Class defining a PO item
                */
                var POItemData = /** @class */ (function () {
                    function POItemData(poNumber, poItem) {
                        this.Po_Number = poNumber;
                        this.Po_Item = poItem;
                        this.Quantity = 0;
                        this.Ret_Item = false;
                        this.Gr_Basediv = false;
                        this.Gr_Ind = false;
                        this.Conv_Den1 = 0;
                        this.Conv_Num1 = 0;
                        this.Item_Cat = "";
                        this.Est_Price = false;
                        this.Gr_Non_Val = false;
                        this.Net_Value = 0;
                        this.Unit = "";
                        this.Orderpr_Un = "";
                        this.Vendor = "";
                        this.Diff_Inv = "";
                        this.Short_Text = "";
                        this.Ref_Doc = "";
                        this.Iv_Qty = 0;
                        this.Iv_Qty_Po = 0;
                        this.Deliv_Qty = 0;
                        this.Val_Iv_For = 0;
                        this.Distribution = "";
                        this.ValidityPeriod_Start = "";
                        this.ValidityPeriod_End = "";
                    }
                    POItemData.prototype.IsServiceItem = function () {
                        return Lib.P2P.SAP.Soap.SAPValuesAreEqual(this.Item_Cat, "9");
                    };
                    POItemData.prototype.IsLimitItem = function () {
                        return Lib.P2P.SAP.Soap.SAPValuesAreEqual(this.Item_Cat, "1");
                    };
                    return POItemData;
                }());
                PurchaseOrder.POItemData = POItemData;
                //#region Planned Delivery Cost
                /**
                 * Cache of the PDC group by SAP query filter
                 * The cache value is an ESKMap<Array<ISAPDeliveryCost>> which correspond to the
                 * PDC group by Item Number
                 */
                PurchaseOrder._deliveryCostsCached = {};
                PurchaseOrder.cacheEKBE = {};
                /**
                 * Group an array of objects using a key
                 * @param {array} xs an array of objects
                 * @param {string} key a key
                 * @return an object associating a key to an array
                 */
                function GroupBy(xs, key) {
                    return xs.reduce(function (rv, x) {
                        (rv[x[key]] = rv[x[key]] || []).push(x);
                        return rv;
                    }, {});
                }
                PurchaseOrder.GroupBy = GroupBy;
                /**
                 * Get the array-formated pricing conditions from the configuration
                 * @return {string[]} an array of pricing condition codes (ex: ["FRA1", "FRB1"])
                 */
                function GetPlannedPricingConditions() {
                    var conditions = [];
                    var plannedPricingConditions = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("PlannedPricingConditions", "");
                    if (plannedPricingConditions) {
                        conditions = plannedPricingConditions.replace(/ /g, "").split("\n");
                    }
                    return conditions;
                }
                PurchaseOrder.GetPlannedPricingConditions = GetPlannedPricingConditions;
                /**
                * Create the SAPQuery filter depending on the pricing conditions
                * @param {string[]} conditions array of pricing condition codes
                * @return {string} a SAP filter
                */
                function CreatePricingConditionsFilter(conditions) {
                    var filter = "";
                    if (conditions.length) {
                        conditions.forEach(function (condition, idx) {
                            if (idx > 0) {
                                filter += " ".concat(Sys.Helpers.SAP.GetQuerySeparator(), " OR ");
                            }
                            filter += "KSCHL = '".concat(condition, "'");
                        });
                    }
                    return filter;
                }
                PurchaseOrder.CreatePricingConditionsFilter = CreatePricingConditionsFilter;
                /**
                 * Get the condition descriptions
                 * @return {Promise<IConditionTypeDescriptions[]>} a promise of condition descriptions
                 */
                function GetConditionTypeDescription() {
                    var sapConf = Variable.GetValueAsString("SAPConfiguration");
                    var saptable = "T685T";
                    var pcFilter = PurchaseOrder.CreatePricingConditionsFilter(PurchaseOrder.GetPlannedPricingConditions());
                    var filter = "(".concat(pcFilter, ") AND SPRAS = '%SAPCONNECTIONLANGUAGE%'");
                    var sapFieldToEskerField = {
                        KSCHL: "KSCHL",
                        VTEXT: "VTEXT"
                    };
                    if (PurchaseOrder._conditionTypeDescriptionsCache && Object.keys(PurchaseOrder._conditionTypeDescriptionsCache).length) {
                        // If a SAP call has already been made, return the cache description
                        Log.Info("GetConditionTypeDescription cached");
                        return Sys.Helpers.Promise.Resolve(PurchaseOrder._conditionTypeDescriptionsCache);
                    }
                    return Sys.Helpers.Promise.Create(function (resolve, reject) {
                        // Cache is empty, call SAP to retrieve descriptions
                        Sys.GenericAPI.SAPQuery(sapConf, saptable, filter, Object.keys(sapFieldToEskerField), SAPQueryCallback, 200, { handler: Lib.AP.SAP.UsesWebServices() ? Lib.AP.SAP.SAPQueryClientServerHandler() : null });
                        function SAPQueryCallback(result, error) {
                            if (error) {
                                Log.Error("SAP Query", error);
                                reject(error);
                                return;
                            }
                            PurchaseOrder._conditionTypeDescriptionsCache = result;
                            resolve(result);
                        }
                    });
                }
                PurchaseOrder.GetConditionTypeDescription = GetConditionTypeDescription;
                /**
                 * Queries the EKBZ table to get the delivery costs for the items of the PO and add them to it.
                 * Converts reference amounts if needed.
                 * @export
                 * @param {string} poNumber
                 * @param {PODetails} po
                 * @param {function} convertItemAmounts funcion taking a POItemData as input, converts its reference amounts and return a promise.
                 * @return {Promise<void>}
                 */
                function GetDeliveryCostsForPO(poNumber, po, convertItemAmounts) {
                    function getFilterForDeliveryCost(filterPoNumber, filterPoItems) {
                        var normalizedPoNumber = Sys.Helpers.String.SAP.NormalizeID(filterPoNumber, 10);
                        var itemNumbers = [];
                        // tslint:disable-next-line: forin
                        for (var key in filterPoItems) {
                            if (Object.prototype.hasOwnProperty.call(filterPoItems, key)) {
                                var poItem = filterPoItems[key];
                                if (!poItem.Cond_Type) {
                                    itemNumbers.push(Sys.Helpers.String.SAP.NormalizeID(poItem.Po_Item, 5));
                                }
                            }
                        }
                        var filterstr = ["EBELN = '".concat(normalizedPoNumber, "\"'")];
                        var separator = Sys.Helpers.SAP.GetQuerySeparator();
                        var filterItemNumbers = itemNumbers.join("' ".concat(separator, " OR EBELP = '"));
                        filterstr.push(" AND (EBELP = '".concat(filterItemNumbers, "')"));
                        var pricingConditionsFilter = PurchaseOrder.CreatePricingConditionsFilter(PurchaseOrder.GetPlannedPricingConditions());
                        filterstr.push(" AND (".concat(pricingConditionsFilter, ")"));
                        return filterstr.join(separator);
                    }
                    function getPOItem(items, itemNumber) {
                        if (items[itemNumber]) {
                            return items[itemNumber];
                        }
                        for (var _i = 0, _a = Object.keys(items); _i < _a.length; _i++) {
                            var key = _a[_i];
                            var poItem = items[key];
                            if (Lib.P2P.SAP.Soap.SAPValuesAreEqual(poItem.Po_Item, itemNumber)) {
                                return poItem;
                            }
                        }
                        return null;
                    }
                    function addResultToPO(resultPO, pdcs) {
                        var addingPromises = [];
                        var _loop_1 = function (pdc) {
                            var poItem = getPOItem(resultPO.PO_ITEMS, pdc.ItemNumber);
                            var pdcItem = CreateDeliveryCostItem(poItem, pdc, PurchaseOrder._conditionTypeDescriptionsCache);
                            var addingPromise = convertItemAmounts(pdcItem)
                                .Then(function () {
                                resultPO.PlannedDeliveryCosts.push(pdcItem);
                                resultPO.refPlannedDeliveryCostsAmount = pdcItem.refExpectedAmount + (resultPO.refPlannedDeliveryCostsAmount || 0);
                            });
                            addingPromises.push(addingPromise);
                        };
                        for (var _i = 0, pdcs_1 = pdcs; _i < pdcs_1.length; _i++) {
                            var pdc = pdcs_1[_i];
                            _loop_1(pdc);
                        }
                        return Sys.Helpers.Promise.All(addingPromises);
                    }
                    function GetExternalCurrencyFactor(currencies) {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            var factors = {};
                            var currencyFactorfilter = [];
                            var customExternalFactors = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAPCurrenciesExternalFactors");
                            currencies.forEach(function (currency) {
                                if (externalCurrencyFactors[currency]) {
                                    factors[currency] = externalCurrencyFactors[currency];
                                }
                                else if (customExternalFactors && customExternalFactors[currency]) {
                                    externalCurrencyFactors[currency] = customExternalFactors[currency];
                                    factors[currency] = externalCurrencyFactors[currency];
                                }
                                else {
                                    currencyFactorfilter.push("CURRKEY = '".concat(currency, "'"));
                                }
                            });
                            if (currencyFactorfilter.length === 0) {
                                resolve(factors);
                                return;
                            }
                            Sys.GenericAPI.SAPQuery(Variable.GetValueAsString("SAPConfiguration"), "TCURX", currencyFactorfilter.join(" OR "), ["CURRKEY", "CURRDEC"], function (result, error) {
                                if (error) {
                                    Log.Warn("Could not get external currency factor from SAP: (".concat(error, "), 1 will be used by default"));
                                }
                                else if (result && result.length > 0) {
                                    result.forEach(function (record) {
                                        externalCurrencyFactors[record.CURRKEY] = Sys.Helpers.String.SAP.ConvertDecimalToExternalFactor(record.CURRDEC);
                                    });
                                }
                                currencies.forEach(function (currency) {
                                    if (!externalCurrencyFactors[currency]) {
                                        externalCurrencyFactors[currency] = 1;
                                    }
                                    factors[currency] = externalCurrencyFactors[currency];
                                });
                                resolve(factors);
                            }, 100, { handler: Lib.AP.SAP.UsesWebServices() ? Lib.AP.SAP.SAPQueryClientServerHandler() : null });
                        });
                    }
                    function fetchAndApplyExternalCurrencyFactor(deliveryCosts) {
                        if (deliveryCosts.length > 0) {
                            var currencies = [deliveryCosts[0].LocalCurrency];
                            if (deliveryCosts[0].ForeignCurrency !== deliveryCosts[0].LocalCurrency) {
                                currencies.push(deliveryCosts[0].ForeignCurrency);
                            }
                            return GetExternalCurrencyFactor(currencies)
                                .then(function (factors) {
                                deliveryCosts.forEach(function (pdc) {
                                    pdc.LocalDeliveredAmount *= factors[deliveryCosts[0].LocalCurrency];
                                    pdc.LocalInvoicedAmount *= factors[deliveryCosts[0].LocalCurrency];
                                    pdc.ForeignDeliveredAmount *= factors[deliveryCosts[0].ForeignCurrency];
                                    pdc.ForeignInvoicedAmount *= factors[deliveryCosts[0].ForeignCurrency];
                                });
                            });
                        }
                        return Sys.Helpers.Promise.Resolve();
                    }
                    var poItems = po.PO_ITEMS;
                    var sapConf = Variable.GetValueAsString("SAPConfiguration");
                    var saptable = "EKBZ";
                    var filter = getFilterForDeliveryCost(poNumber, poItems);
                    var externalCurrencyFactors = {};
                    var sapFieldToEskerField = {
                        EBELN: "EBELN", EBELP: "EBELP",
                        STUNR: "STUNR", KSCHL: "KSCHL",
                        DMBTR: "DMBTR", WAERS: "WAERS",
                        MENGE: "MENGE", BPMNG: "BPMNG",
                        LIFNR: "LIFNR", WRBTR: "WRBTR",
                        SHKZG: "SHKZG", HSWAE: "HSWAE",
                        VGABE: "VGABE"
                    };
                    return Sys.Helpers.Promise.Create(function (resolve, reject) {
                        if (filter in PurchaseOrder._deliveryCostsCached) {
                            addResultToPO(po, PurchaseOrder._deliveryCostsCached[filter])
                                .Then(function () {
                                resolve();
                            });
                            return;
                        }
                        var rowSkip = 0;
                        var recordPerQuery = 200;
                        var ekbzRecords = [];
                        function query() {
                            var sapQueryOptions = null;
                            if (Sys.ScriptInfo.IsClient() && Lib.AP.SAP.UsesWebServices()) {
                                sapQueryOptions = { rowSkip: rowSkip, handler: Lib.AP.SAP.SAPQuery };
                            }
                            else {
                                sapQueryOptions = { rowSkip: rowSkip };
                            }
                            Sys.GenericAPI.SAPQuery(sapConf, saptable, filter, Object.keys(sapFieldToEskerField), SAPQueryCallback, recordPerQuery, { handler: Lib.AP.SAP.UsesWebServices() ? Lib.AP.SAP.SAPQueryClientServerHandler() : null });
                        }
                        function SAPQueryCallback(results, error) {
                            if (error) {
                                Log.Error("SAP Query", error);
                                reject(error);
                            }
                            else {
                                ekbzRecords.push.apply(ekbzRecords, results);
                                if (results.length === recordPerQuery) {
                                    // loop to fetch the rest
                                    rowSkip += results.length;
                                    return query();
                                }
                                var plannedDeliveryCosts_1 = GroupDeliveryCosts(ekbzRecords);
                                fetchAndApplyExternalCurrencyFactor(plannedDeliveryCosts_1)
                                    .Then(function () {
                                    // Cache
                                    PurchaseOrder._deliveryCostsCached[filter] = plannedDeliveryCosts_1;
                                    addResultToPO(po, plannedDeliveryCosts_1)
                                        .Then(function () {
                                        resolve();
                                    });
                                });
                            }
                        }
                        query();
                    });
                }
                PurchaseOrder.GetDeliveryCostsForPO = GetDeliveryCostsForPO;
                /**
                * Group delivery cost by item number and merge duplicate delivery cost having the same condition type
                * @param {ISAPDeliveryCost[]} results The list of delivery costs to group and filter
                */
                function GroupDeliveryCosts(deliveryCosts) {
                    var finalDeliveryCosts = [];
                    var groupedDeliveryCosts = GroupBy(deliveryCosts, "EBELP"); // group by item number (convert to a Javascript object)
                    // tslint:disable-next-line: forin
                    for (var itemNumber in groupedDeliveryCosts) {
                        if (Object.prototype.hasOwnProperty.call(groupedDeliveryCosts, itemNumber)) {
                            var pdcByConditionType = GroupBy(groupedDeliveryCosts[itemNumber], "KSCHL"); // then group by condition type (convert to a Javascript object)
                            // tslint:disable-next-line: forin
                            for (var condType in pdcByConditionType) {
                                if (Object.prototype.hasOwnProperty.call(pdcByConditionType, condType)) {
                                    finalDeliveryCosts.push(pdcByConditionType[condType].reduce(mergeDeliveryCost, null));
                                }
                            }
                        }
                    }
                    return finalDeliveryCosts;
                }
                PurchaseOrder.GroupDeliveryCosts = GroupDeliveryCosts;
                function mergeDeliveryCost(pdc, sapDeliveryCost) {
                    var otherPdc = new PlannedDeliveryCost(sapDeliveryCost);
                    if (pdc === null) {
                        return otherPdc;
                    }
                    var result = PlannedDeliveryCost.clone(pdc);
                    result.LocalDeliveredAmount += otherPdc.LocalDeliveredAmount;
                    result.ForeignDeliveredAmount += otherPdc.ForeignDeliveredAmount;
                    result.DeliveredQuantity += otherPdc.DeliveredQuantity;
                    result.LocalInvoicedAmount += otherPdc.LocalInvoicedAmount;
                    result.ForeignInvoicedAmount += otherPdc.ForeignInvoicedAmount;
                    result.InvoicedQuantity += otherPdc.InvoicedQuantity;
                    return result;
                }
                /**
                * Create a delivery cost item based on the associated PO Item
                * @param {object} poItem current po item informations
                * @param {SapQueryObject} deliveryCost current delivery cost
                * @param {object} pdcDescriptions poItem descriptions
                * @return {Item} the delivery cost line item
                */
                function CreateDeliveryCostItem(poItem, deliveryCost, pdcDescriptions) {
                    var itemDescription = poItem.Short_Text;
                    var pdcPOItem = Sys.Helpers.Clone(poItem);
                    var useLocal = deliveryCost.LocalCurrency === poItem.refCurrency;
                    pdcPOItem.refCurrency = useLocal ? deliveryCost.LocalCurrency : deliveryCost.ForeignCurrency;
                    // For browse
                    pdcPOItem.Deliv_Qty = deliveryCost.DeliveredQuantity;
                    pdcPOItem.refDeliveredAmount = useLocal ? deliveryCost.LocalDeliveredAmount : deliveryCost.ForeignDeliveredAmount;
                    pdcPOItem.refInvoicedAmount = useLocal ? deliveryCost.LocalInvoicedAmount : deliveryCost.ForeignInvoicedAmount;
                    pdcPOItem.Iv_Qty = deliveryCost.InvoicedQuantity;
                    pdcPOItem.Quantity = poItem.Quantity;
                    pdcPOItem.refOrderedAmount = 0;
                    // For line items table
                    pdcPOItem.refExpectedAmount = pdcPOItem.refDeliveredAmount - pdcPOItem.refInvoicedAmount;
                    pdcPOItem.refExpectedQuantity = pdcPOItem.Deliv_Qty - pdcPOItem.Iv_Qty;
                    pdcPOItem.refOpenInvoiceValue = pdcPOItem.refExpectedAmount;
                    pdcPOItem.refOpenInvoiceQuantity = pdcPOItem.refExpectedQuantity;
                    pdcPOItem.refNetValue = pdcPOItem.refDeliveredAmount / pdcPOItem.Deliv_Qty;
                    pdcPOItem.refNetPrice = pdcPOItem.refNetValue;
                    pdcPOItem.refPriceUnit = pdcPOItem.refNetPrice;
                    pdcPOItem.sapForeignCurrency = deliveryCost.ForeignCurrency;
                    pdcPOItem.Cond_Type = deliveryCost.ConditionType;
                    pdcPOItem.Vendor = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(deliveryCost.AccountNumber);
                    pdcPOItem.Ref_Doc = "";
                    pdcPOItem.Ref_Doc_No = "";
                    if (pdcDescriptions) {
                        var pdcDescription = pdcDescriptions.filter(function (v) { return Lib.P2P.SAP.Soap.SAPValuesAreEqual(v.KSCHL, pdcPOItem.Cond_Type); });
                        if (pdcDescription.length && typeof pdcDescription[0].VTEXT !== "undefined") {
                            pdcPOItem.Short_Text = pdcDescription[0].VTEXT;
                        }
                    }
                    else {
                        pdcPOItem.Short_Text = "".concat(Language.Translate("_Pricing Condition default description"), " ").concat(pdcPOItem.Cond_Type, " - ").concat(itemDescription);
                    }
                    return pdcPOItem;
                }
                PurchaseOrder.CreateDeliveryCostItem = CreateDeliveryCostItem;
                //#endregion
                function ComputeExpectedValues(item) {
                    item.refExpectedQuantity = item.refOpenInvoiceQuantity - item.refOpenGoodReceiptQuantity;
                    if (isNaN(item.refExpectedQuantity)) {
                        item.refExpectedQuantity = 0;
                    }
                    item.refExpectedAmount = item.refOpenInvoiceValue - item.refOpenGoodReceiptValue;
                    if (item.IsLimitItem() || item.IsServiceItem()) {
                        if (isNaN(item.Ivval_For)) {
                            item.Ivval_For = 0;
                            item.Ivval_Loc = 0;
                        }
                        item.refExpectedAmount = item.refNetValue - item.Ivval_For;
                    }
                    else if (isNaN(item.refExpectedAmount)) {
                        item.refExpectedAmount = 0;
                    }
                }
                PurchaseOrder.ComputeExpectedValues = ComputeExpectedValues;
                function ComputePassedValues(item) {
                    item.refOrderedAmount = item.refNetValue;
                    if (item.IsLimitItem() || item.IsServiceItem()) {
                        item.refDeliveredAmount = 0;
                        item.refInvoicedAmount = item.Val_Iv_For;
                    }
                    else if (item.Quantity !== 0) {
                        item.refDeliveredAmount = item.Deliv_Qty * item.refNetValue / item.Quantity;
                        item.refInvoicedAmount = item.Iv_Qty * item.refNetValue / item.Quantity;
                    }
                    else {
                        item.refDeliveredAmount = 0;
                        item.refInvoicedAmount = 0;
                    }
                }
                PurchaseOrder.ComputePassedValues = ComputePassedValues;
            })(PurchaseOrder = SAP.PurchaseOrder || (SAP.PurchaseOrder = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
