///#GLOBALS Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_PurchaseOrder_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "library: SAP Purchase order routines.",
  "require": [
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_AP_SAP_Client_V12.0.461.0",
    "Lib_P2P_SAP_SOAP_Client_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP_Client",
    "Lib_AP_SAP_PurchaseOrder_Common_V12.0.461.0",
    "Sys/Sys_GenericAPI_Client",
    "Sys/Sys_ScriptInfo_Client"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var PurchaseOrder;
            (function (PurchaseOrder) {
                PurchaseOrder.maxQueryRecords = 200;
                PurchaseOrder.maxGRLineLoop = 25;
                PurchaseOrder.cachePODetails = {};
                PurchaseOrder.fieldsEKBE = "EBELP|BWART|WEORA|ZEKKN|VGABE|BEWTP|MENGE|DMBTR|WRBTR|SHKZG|ELIKZ|XBLNR|LFGJA|LFBNR|LFPOS|REEWR|HSWAE|REFWR|WAERS";
                PurchaseOrder.lastError = null;
                function SetLastError(message, isTechnical) {
                    if (message) {
                        Log.Error(message);
                    }
                    if (isTechnical) {
                        message = Language.Translate("An unexpected error occurred with the SAP connectivity.");
                    }
                    Lib.AP.SAP.PurchaseOrder.lastError = message;
                }
                PurchaseOrder.SetLastError = SetLastError;
                function GetLastError() {
                    return Lib.AP.SAP.PurchaseOrder.lastError;
                }
                PurchaseOrder.GetLastError = GetLastError;
                function GetPODetailsCacheKey(poNumber, invoiceCurrency) {
                    return "".concat(poNumber, "_").concat(invoiceCurrency);
                }
                PurchaseOrder.GetPODetailsCacheKey = GetPODetailsCacheKey;
                function ExtractErrors(bapiReturns) {
                    if (!bapiReturns) {
                        return false;
                    }
                    var hasErrors = false;
                    for (var idx = 0; idx < bapiReturns.length; idx++) {
                        var returnType = bapiReturns[idx].TYPE;
                        if (returnType === "E" || returnType === "A") {
                            if (hasErrors || Lib.AP.SAP.PurchaseOrder.lastError) {
                                Lib.AP.SAP.PurchaseOrder.lastError += "\n";
                                Lib.AP.SAP.PurchaseOrder.lastError += "[" + idx + "] " + bapiReturns[idx].MESSAGE;
                            }
                            else {
                                Lib.AP.SAP.PurchaseOrder.lastError = "[" + idx + "] " + bapiReturns[idx].MESSAGE;
                            }
                            hasErrors = true;
                        }
                    }
                    Lib.AP.SAP.PurchaseOrder.SetLastError(Lib.AP.SAP.PurchaseOrder.lastError);
                    return hasErrors;
                }
                PurchaseOrder.ExtractErrors = ExtractErrors;
                function NewPOItemData(poNumber, poItem) {
                    return new Lib.AP.SAP.PurchaseOrder.POItemData(poNumber, poItem);
                }
                PurchaseOrder.NewPOItemData = NewPOItemData;
                function GetPOInvoicingPlanNumbersAndReceivers(callback, poNumber) {
                    /** @this QueryResult */
                    var resultsCallBack = function () {
                        var returnItem = {
                            invoicingPlanNumbers: "",
                            receivers: {}
                        };
                        for (var i = 0; i < this.GetRecordsCount(); ++i) {
                            // Plan numbers
                            var fplnr = this.GetQueryValue("FPLNR", i);
                            var ebelp = this.GetQueryValue("EBELP", i);
                            if (Sys.Helpers.String.SAP.Trim(fplnr) && ebelp) {
                                returnItem.invoicingPlanNumbers += fplnr + ebelp;
                            }
                            // Receivers
                            var afnam = this.GetQueryValue("AFNAM", i);
                            if (afnam && ebelp) {
                                returnItem.receivers[ebelp] = afnam;
                            }
                        }
                        callback(returnItem);
                    };
                    Lib.AP.SAP.SAPQuery(resultsCallBack, Variable.GetValueAsString("SAPConfiguration"), "EKPO", "FPLNR|EBELP|AFNAM", "EBELN = '" + poNumber + "'", Lib.AP.SAP.PurchaseOrder.maxQueryRecords);
                }
                PurchaseOrder.GetPOInvoicingPlanNumbersAndReceivers = GetPOInvoicingPlanNumbersAndReceivers;
                function CacheIncludes(cachedParams, askedParams) {
                    for (var param in askedParams) {
                        if (Object.prototype.hasOwnProperty.call(askedParams, param) && (!cachedParams || (askedParams[param] && !cachedParams[param]))) {
                            // If we ask for param, but it is not in cache, we have to query for the missing part
                            return false;
                        }
                    }
                    return true;
                }
                PurchaseOrder.CacheIncludes = CacheIncludes;
                var externalCurrencyExchangeRatePending = {};
                var externalCurrencyExchangeRate = {};
                function GetExternalCurrencyExchangeRate(localCurrency, foreignCurrency, translationDate) {
                    return Sys.Helpers.Promise.Create(function (exchangeCallback) {
                        var externalExchangeRate = 1;
                        var externalAmount = 10000;
                        var mapKey = "".concat(localCurrency, "_").concat(foreignCurrency, "_").concat(translationDate);
                        function callbackConvertToForeignCurrency(params) {
                            if (params) {
                                if (params.ExchangeRate < 0) {
                                    externalExchangeRate = parseInt(params.LocalFactor, 10) / (Math.abs(params.ExchangeRate) * parseInt(params.ForeignFactor, 10));
                                }
                                else if (!!params.LocalFactor && !!params.ExchangeRate && !!params.ForeignFactor) {
                                    externalExchangeRate = parseInt(params.LocalFactor, 10) * params.ExchangeRate / parseInt(params.ForeignFactor, 10);
                                }
                                else {
                                    var message = "Failed to convert to foreign currency";
                                    Lib.AP.SAP.PurchaseOrder.SetLastError(message);
                                    Log.Error(Lib.AP.SAP.PurchaseOrder.GetLastError());
                                }
                            }
                            externalCurrencyExchangeRate[mapKey] = externalExchangeRate;
                            externalCurrencyExchangeRatePending[mapKey].forEach(function (exchangeCallbackFunc) {
                                exchangeCallbackFunc(externalCurrencyExchangeRate[mapKey]);
                            });
                            externalCurrencyExchangeRatePending[mapKey] = [];
                        }
                        if (!localCurrency || !foreignCurrency || localCurrency === foreignCurrency) {
                            exchangeCallback(externalExchangeRate);
                        }
                        else if (externalCurrencyExchangeRate[mapKey]) {
                            exchangeCallback(externalCurrencyExchangeRate[mapKey]);
                        }
                        else if (externalCurrencyExchangeRatePending[mapKey] && externalCurrencyExchangeRatePending[mapKey].length > 0) {
                            externalCurrencyExchangeRatePending[mapKey].push(exchangeCallback);
                        }
                        else {
                            if (!externalCurrencyExchangeRatePending[mapKey]) {
                                externalCurrencyExchangeRatePending[mapKey] = [];
                            }
                            externalCurrencyExchangeRatePending[mapKey].push(exchangeCallback);
                            Lib.AP.SAP.ConvertToForeignCurrencyClient(callbackConvertToForeignCurrency, externalAmount, localCurrency, foreignCurrency, translationDate, 0, "M", true);
                        }
                    });
                }
                PurchaseOrder.GetExternalCurrencyExchangeRate = GetExternalCurrencyExchangeRate;
                function ConvertItemAmounts(item, exchangeRateDate, newCurrency) {
                    return Lib.AP.SAP.PurchaseOrder.GetExternalCurrencyExchangeRate(newCurrency, item.refCurrency, exchangeRateDate)
                        .Then(function (exchangeRate) {
                        if (exchangeRate !== 1) {
                            item.refOpenInvoiceValue = Lib.AP.ApplyExchangeRate(item.refOpenInvoiceValue, exchangeRate, true);
                            item.refDeliveredAmount = Lib.AP.ApplyExchangeRate(item.refDeliveredAmount, exchangeRate, true);
                            item.refExpectedAmount = Lib.AP.ApplyExchangeRate(item.refExpectedAmount, exchangeRate, true);
                            item.refInvoicedAmount = Lib.AP.ApplyExchangeRate(item.refInvoicedAmount, exchangeRate, true);
                            item.refOrderedAmount = Lib.AP.ApplyExchangeRate(item.refOrderedAmount, exchangeRate, true);
                            item.refOpenGoodReceiptValue = Lib.AP.ApplyExchangeRate(item.refOpenGoodReceiptValue, exchangeRate, true);
                            item.refNetPrice = Lib.AP.ApplyExchangeRate(item.refNetPrice, exchangeRate, true);
                            item.refNondItax = Lib.AP.ApplyExchangeRate(item.refNondItax, exchangeRate, true);
                            item.refPriceUnit = Lib.AP.ApplyExchangeRate(item.refPriceUnit, exchangeRate, true);
                            item.refNetValue = Lib.AP.ApplyExchangeRate(item.refNetValue, exchangeRate, true);
                        }
                        item.refCurrency = newCurrency;
                        return item;
                    });
                }
                PurchaseOrder.ConvertItemAmounts = ConvertItemAmounts;
                function GetDetails(callback, poNumber, refCurrency, ignoreCache) {
                    if (ignoreCache === void 0) { ignoreCache = false; }
                    var config = {
                        Account_Assignment: true,
                        Confirmations: false,
                        Extensions: false,
                        Header_Texts: false,
                        History: true,
                        Item_Texts: false,
                        Items: true,
                        Schedules: false,
                        Service_Texts: false,
                        Services: false
                    };
                    var cachePoDetailKey = GetPODetailsCacheKey(poNumber, refCurrency);
                    function getPODetailsFromBAPICallback(poDetails) {
                        function callbackExchangeRate(exchangeRate) {
                            poDetails.refCurrency = refCurrency;
                            if (exchangeRate !== 1) {
                                //Header amounts
                                poDetails.refDeliveredAmount = Lib.AP.ApplyExchangeRate(poDetails.refDeliveredAmount, exchangeRate, true);
                                poDetails.refInvoicedAmount = Lib.AP.ApplyExchangeRate(poDetails.refInvoicedAmount, exchangeRate, true);
                                poDetails.refOrderedAmount = Lib.AP.ApplyExchangeRate(poDetails.refOrderedAmount, exchangeRate, true);
                            }
                            // Items
                            var itemPromises = [];
                            Object.keys(poDetails.PO_ITEMS).forEach(function (key) {
                                itemPromises.push(Lib.AP.SAP.PurchaseOrder.ConvertItemAmounts(poDetails.PO_ITEMS[key], poDetails.PO_HEADER.DOC_DATE, refCurrency));
                            });
                            Sys.Helpers.Promise.All(itemPromises)
                                .Then(function () {
                                // Planned delivery costs
                                if (poDetails.PlannedDeliveryCosts.length > 0) {
                                    poDetails.refPlannedDeliveryCostsAmount = Lib.AP.ApplyExchangeRate(poDetails.refPlannedDeliveryCostsAmount, exchangeRate, true);
                                    poDetails.PlannedDeliveryCosts.reduce(function (p, pdc) {
                                        return p.Then(function () {
                                            return Lib.AP.SAP.PurchaseOrder.ConvertItemAmounts(pdc, poDetails.PO_HEADER.DOC_DATE, refCurrency);
                                        });
                                    }, Sys.Helpers.Promise.Resolve())
                                        .Then(function () {
                                        Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePoDetailKey].po = poDetails;
                                        callback(Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePoDetailKey].po, poNumber);
                                    });
                                }
                                else {
                                    Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePoDetailKey].po = poDetails;
                                    callback(Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePoDetailKey].po, poNumber);
                                }
                            });
                        }
                        Lib.AP.SAP.PurchaseOrder.GetExternalCurrencyExchangeRate(refCurrency, poDetails.refCurrency, poDetails.PO_HEADER.DOC_DATE)
                            .Then(callbackExchangeRate);
                    }
                    function getPODetailsCallback(jsonOutputData) {
                        if (jsonOutputData) {
                            if (jsonOutputData.ERRORS && jsonOutputData.ERRORS.length > 0) {
                                Lib.AP.SAP.PurchaseOrder.SetLastError(jsonOutputData.ERRORS[0].err);
                            }
                            if (typeof jsonOutputData.GetQueryError !== "undefined" && jsonOutputData.GetQueryError()) {
                                Lib.AP.SAP.PurchaseOrder.SetLastError(jsonOutputData.GetQueryError());
                            }
                            else if (jsonOutputData.TABLES && !Lib.AP.SAP.PurchaseOrder.ExtractErrors(jsonOutputData.TABLES.RETURN)) {
                                Lib.AP.SAP.PurchaseOrder.GetPODetailsFromBAPIResult(getPODetailsFromBAPICallback, jsonOutputData, poNumber, refCurrency);
                                return;
                            }
                        }
                        Log.Error("GetDetails BAPI request error : " + Lib.AP.SAP.PurchaseOrder.GetLastError() + " PO#:" + poNumber);
                        Lib.AP.SAP.PurchaseOrder.SetLastError(null);
                        callback(null, poNumber);
                    }
                    // First search in cache
                    if (!ignoreCache && cachePoDetailKey in Lib.AP.SAP.PurchaseOrder.cachePODetails &&
                        Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePoDetailKey].po && Lib.AP.SAP.PurchaseOrder.CacheIncludes(Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePoDetailKey].config, config)) {
                        callback(Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePoDetailKey].po, poNumber);
                    }
                    else {
                        Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePoDetailKey] = {
                            po: null,
                            config: config
                        };
                        Lib.AP.SAP.PurchaseOrder.GetPODetailsCall(getPODetailsCallback, poNumber, config);
                    }
                }
                PurchaseOrder.GetDetails = GetDetails;
                function GetPODetailsFromBAPIResult(callback, jsonOutputData, poNumber, refCurrency) {
                    var returnPO = {
                        PO_ADDRESS: jsonOutputData.IMPORTS.PO_ADDRESS,
                        PO_HEADER: jsonOutputData.IMPORTS.PO_HEADER,
                        EXTENSIONOUT: jsonOutputData.TABLES.EXTENSIONOUT,
                        PO_HEADER_TEXTS: jsonOutputData.TABLES.PO_HEADER_TEXTS,
                        PO_ITEM_ACCOUNT_ASSIGNMENT: jsonOutputData.TABLES.PO_ITEM_ACCOUNT_ASSIGNMENT,
                        PO_ITEM_CONFIRMATIONS: jsonOutputData.TABLES.PO_ITEM_CONFIRMATIONS,
                        PO_ITEM_CONTRACT_LIMITS: jsonOutputData.TABLES.PO_ITEM_CONTRACT_LIMITS,
                        PO_ITEM_HISTORY_TOTALS: jsonOutputData.TABLES.PO_ITEM_HISTORY_TOTALS,
                        PO_ITEM_HISTORY: jsonOutputData.TABLES.PO_ITEM_HISTORY,
                        PO_ITEM_LIMITS: jsonOutputData.TABLES.PO_ITEM_LIMITS,
                        PO_ITEM_SCHEDULES: jsonOutputData.TABLES.PO_ITEM_SCHEDULES,
                        PO_ITEM_SERVICES: jsonOutputData.TABLES.PO_ITEM_SERVICES,
                        PO_ITEM_SRV_ACCASS_VALUES: jsonOutputData.TABLES.PO_ITEM_SRV_ACCASS_VALUES,
                        PO_ITEM_TEXTS: jsonOutputData.TABLES.PO_ITEM_TEXTS,
                        ORIGINALS_PO_ITEM: {},
                        PlannedDeliveryCosts: [],
                        sapForeignCurrency: refCurrency,
                        refCurrency: refCurrency,
                        refOrderedAmount: 0,
                        refDeliveredAmount: 0,
                        refInvoicedAmount: 0,
                        refPlannedDeliveryCostsAmount: 0
                    };
                    if (returnPO.PO_HEADER) {
                        returnPO.PO_HEADER.VENDOR = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(jsonOutputData.IMPORTS.PO_HEADER.VENDOR);
                        returnPO.sapForeignCurrency = returnPO.PO_HEADER.CURRENCY || refCurrency;
                    }
                    function getPODetailsFromBAPIResultInvoicingPlanNumbersCallback(result) {
                        returnPO.InvoicingPlanNumbers = result.invoicingPlanNumbers;
                        returnPO.Receivers = result.receivers;
                        returnPO.OrderDate = returnPO.PO_HEADER.DOC_DATE;
                        returnPO.PO_ITEMS = {};
                        var poItems = jsonOutputData.TABLES.PO_ITEMS;
                        returnPO.PoItemCount = poItems.length;
                        function getPODetailsFromBAPIResultCallback(item, idx, maxItemLoop, token) {
                            returnPO.PO_ITEMS[item.Po_Item] = item;
                            returnPO.refOrderedAmount += item.refOrderedAmount;
                            if (item.Quantity !== 0) {
                                returnPO.refDeliveredAmount += item.refDeliveredAmount;
                                returnPO.refInvoicedAmount += item.refInvoicedAmount;
                            }
                            getPODetailsFromBAPIResultLoop(idx + 1, maxItemLoop, token);
                        }
                        function getPODetailsFromBAPIResultLoop(idxPoItems, maxItemLoop, token) {
                            if (idxPoItems <= maxItemLoop) {
                                Lib.AP.SAP.PurchaseOrder.GetPOItemDataDetails(getPODetailsFromBAPIResultCallback, poNumber, poItems, idxPoItems, returnPO, maxItemLoop, token);
                            }
                            else if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("PlannedPricingConditions", "")) {
                                getPlannedDeliveryCosts(token);
                            }
                            else {
                                // use token to notify its job is finished
                                token.Use();
                            }
                        }
                        function getPlannedDeliveryCosts(token) {
                            function convertItemAmounts(item) {
                                return ConvertItemAmounts(item, returnPO.PO_HEADER.DOC_DATE, returnPO.refCurrency);
                            }
                            Lib.AP.SAP.PurchaseOrder.GetConditionTypeDescription()
                                .Then(function () {
                                Lib.AP.SAP.PurchaseOrder.GetDeliveryCostsForPO(poNumber, returnPO, convertItemAmounts).Then(function () { return token.Use(); });
                            });
                        }
                        // AP - FT-012034 - Fix stack overflow when browsing large orders
                        //Init lets
                        var maxLoopSize = Lib.AP.SAP.PurchaseOrder.maxQueryRecords;
                        var nbLoop = Math.ceil(poItems.length / maxLoopSize);
                        //Create a synchronizer in order to split poItems parsing
                        var synchronizer = Sys.Helpers.Synchronizer.Create(function () {
                            returnPO.PO_SERVICES_TEXTS = jsonOutputData.TABLES.PO_SERVICES_TEXTS;
                            callback(returnPO);
                        });
                        var _loop_1 = function (i) {
                            synchronizer.Register(function (token) {
                                var start = i * maxLoopSize;
                                var end = Math.min(start + maxLoopSize, poItems.length) - 1;
                                getPODetailsFromBAPIResultLoop(start, end, token);
                            }, { "async": true });
                        };
                        //Register sync function
                        for (var i = 0; i < nbLoop; i++) {
                            _loop_1(i);
                        }
                        //start synchronizer
                        synchronizer.Start();
                    }
                    // Fill asynchronously returnPO.InvoicingPlanNumbers
                    Lib.AP.SAP.PurchaseOrder.GetPOInvoicingPlanNumbersAndReceivers(getPODetailsFromBAPIResultInvoicingPlanNumbersCallback, poNumber);
                }
                PurchaseOrder.GetPODetailsFromBAPIResult = GetPODetailsFromBAPIResult;
                function GetConfigValue(cfg, param) {
                    if (cfg && cfg[param]) {
                        return "X";
                    }
                    return " ";
                }
                PurchaseOrder.GetConfigValue = GetConfigValue;
                function GetPODetailsCall(callback, poNumber, config) {
                    if (!poNumber) {
                        callback(null);
                        return;
                    }
                    var exports = {
                        EXPORTS: {
                            "PURCHASEORDER": Sys.Helpers.String.SAP.NormalizeID(poNumber, 10),
                            "ACCOUNT_ASSIGNMENT": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Account_Assignment"),
                            "CONFIRMATIONS": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Confirmations"),
                            "EXTENSIONS": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Extensions"),
                            "HEADER_TEXTS": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Header_Texts"),
                            "HISTORY": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "History"),
                            "ITEMS": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Items"),
                            "ITEM_TEXTS": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Item_Texts"),
                            "SCHEDULES": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Schedules"),
                            "SERVICES": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Services"),
                            "SERVICE_TEXTS": Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Service_Texts")
                        }
                    };
                    Lib.AP.SAP.SAPCallBapi(callback, Variable.GetValueAsString("SAPConfiguration"), "BAPI_PO_GETDETAIL", exports);
                }
                PurchaseOrder.GetPODetailsCall = GetPODetailsCall;
                function CreatePOItemDetailsFromPOItem(poNumber, poItem, po) {
                    var poItemData = new Lib.AP.SAP.PurchaseOrder.POItemData(poNumber, poItem.PO_ITEM);
                    poItemData.AcctAssCat = poItem.ACCTASSCAT;
                    poItemData.Buyer = po.PO_HEADER.CREATED_BY;
                    poItemData.Conv_Den1 = poItem.CONV_DEN1;
                    poItemData.Conv_Num1 = poItem.CONV_NUM1;
                    poItemData.Del_Compl = Sys.Helpers.String.SAP.Trim(poItem.DEL_COMPL).length > 0;
                    poItemData.Delete_Ind = Sys.Helpers.String.SAP.Trim(poItem.DELETE_IND).length > 0;
                    poItemData.Diff_Inv = po.PO_HEADER.DIFF_INV;
                    poItemData.Distribution = poItem.DISTRIB;
                    poItemData.Doc_Cat = po.PO_HEADER.DOC_CAT;
                    poItemData.Est_Price = Sys.Helpers.String.SAP.Trim(poItem.EST_PRICE).length > 0;
                    poItemData.Final_Inv = Sys.Helpers.String.SAP.Trim(poItem.FINAL_INV).length > 0;
                    poItemData.Gr_Basediv = Sys.Helpers.String.SAP.Trim(poItem.GR_BASEDIV).length > 0;
                    poItemData.Gr_Ind = Sys.Helpers.String.SAP.Trim(poItem.GR_IND).length > 0;
                    poItemData.Gr_Non_Val = Sys.Helpers.String.SAP.Trim(poItem.GR_NON_VAL).length > 0;
                    poItemData.Ir_Ind = Sys.Helpers.String.SAP.Trim(poItem.IR_IND).length > 0;
                    poItemData.Item_Cat = poItem.ITEM_CAT;
                    poItemData.Material = poItem.MATERIAL;
                    poItemData.Net_Price = poItem.NET_PRICE;
                    poItemData.Net_Value = poItem.NET_VALUE;
                    poItemData.Nond_Itax = poItem.NOND_ITAX;
                    poItemData.Orderpr_Un = poItem.ORDERPR_UN;
                    poItemData.Po_Item = poItem.PO_ITEM;
                    poItemData.Po_Number = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(poItem.PO_NUMBER);
                    poItemData.Price_Unit = poItem.PRICE_UNIT;
                    poItemData.Quantity = poItem.QUANTITY;
                    poItemData.Receiver = po.Receivers[poItem.PO_ITEM];
                    poItemData.Ref_Doc = "";
                    poItemData.Ref_Doc_No = "";
                    poItemData.Ret_Item = Sys.Helpers.String.SAP.Trim(poItem.RET_ITEM).length > 0;
                    poItemData.sapForeignCurrency = po.PO_HEADER.CURRENCY;
                    poItemData.Short_Text = poItem.SHORT_TEXT;
                    poItemData.Tax_Code = poItem.TAX_CODE;
                    poItemData.Tax_Jur_Cd = poItem.TAX_JUR_CD;
                    poItemData.Unit = poItem.UNIT;
                    poItemData.ValidityPeriod_End = po.PO_HEADER.VPER_END;
                    poItemData.ValidityPeriod_Start = po.PO_HEADER.VPER_START;
                    poItemData.Vend_Mat = poItem.VEND_MAT;
                    poItemData.Vendor = po.PO_HEADER.VENDOR;
                    poItemData.refCurrency = poItemData.sapForeignCurrency;
                    poItemData.refNetPrice = poItemData.Net_Price;
                    poItemData.refPriceUnit = poItemData.Price_Unit;
                    poItemData.refNondItax = poItemData.Nond_Itax;
                    poItemData.refNetValue = poItemData.Net_Value;
                    var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                    if (customDimensions) {
                        for (var key in customDimensions.poSAPItems) {
                            if (Object.prototype.hasOwnProperty.call(customDimensions.poSAPItems, key)) {
                                var poDetailsElement = null;
                                switch (key) {
                                    case "PO_ITEMS":
                                        poDetailsElement = poItem;
                                        break;
                                    case "PO_HEADER":
                                    case "PO_ADDRESS":
                                        poDetailsElement = po[key];
                                        break;
                                    case "PO_ITEM_ACCOUNT_ASSIGNMENT":
                                        break;
                                    default:
                                        Log.Error("customDimensions.poSAPItems." + key + " not supported yet in GetCustomDimensions");
                                }
                                if (poDetailsElement) {
                                    for (var indexCustomPoItem = 0; indexCustomPoItem < customDimensions.poSAPItems[key].length; indexCustomPoItem++) {
                                        var poSAPItem = customDimensions.poSAPItems[key][indexCustomPoItem];
                                        if (poSAPItem && !Sys.Helpers.IsEmpty(poSAPItem.nameInSAP)) {
                                            var itemValue = poDetailsElement[poSAPItem.nameInSAP] || "";
                                            var formatter = poSAPItem.fieldFormatter;
                                            if (itemValue && typeof formatter === "function") {
                                                itemValue = formatter(itemValue);
                                            }
                                            poItemData[poSAPItem.nameInSAP] = itemValue;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.TrimPartNumberLeadingZeros", poItemData)) {
                        poItemData.Material = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(poItem.MATERIAL);
                    }
                    return ConvertItemAmounts(poItemData, po.PO_HEADER.DOC_DATE, po.refCurrency);
                }
                PurchaseOrder.CreatePOItemDetailsFromPOItem = CreatePOItemDetailsFromPOItem;
                function GetPOItemDataDetails(callback, poNumber, poItems, idx, po, maxItemLoop, token) {
                    var poItem = poItems[idx];
                    function getPOItemDataDetailsOpenValuesCallback(item) {
                        Lib.AP.SAP.PurchaseOrder.ComputeExpectedValues(item);
                        Lib.AP.SAP.PurchaseOrder.ComputePassedValues(item);
                        ConvertItemAmounts(item, po.PO_HEADER.DOC_DATE, po.refCurrency)
                            .Then(function () {
                            callback(item, idx, maxItemLoop, token);
                        });
                    }
                    function getPOItemDataDetailsCallback(item) {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenValues(getPOItemDataDetailsOpenValuesCallback, item);
                    }
                    po.ORIGINALS_PO_ITEM[poItem.PO_ITEM] = poItem;
                    Lib.AP.SAP.PurchaseOrder.CreatePOItemDetailsFromPOItem(poNumber, poItem, po)
                        .Then(function (itemDetails) {
                        itemDetails.InvoicingPlanNumbers = Lib.AP.SAP.PurchaseOrder.ExtractItemPlanNumber(poItem.PO_ITEM, po.InvoicingPlanNumbers);
                        Lib.AP.SAP.PurchaseOrder.GetHistoryTotalsItemInfo(po.PO_ITEM_HISTORY_TOTALS, itemDetails);
                        if (itemDetails.Gr_Non_Val) {
                            var poItemHistory = po.PO_ITEM_HISTORY.filter(function (history) { return Lib.P2P.SAP.Soap.SAPValuesAreEqual(history.PO_ITEM, itemDetails.Po_Item); });
                            Lib.AP.SAP.PurchaseOrder.GetHistoryItemInfo(getPOItemDataDetailsCallback, po.PO_HEADER, poItemHistory, itemDetails);
                        }
                        else {
                            getPOItemDataDetailsCallback(itemDetails);
                        }
                    });
                }
                PurchaseOrder.GetPOItemDataDetails = GetPOItemDataDetails;
                function FillHistoricsFromEKBEQueryResult(callback, filter, itemNumberFilter) {
                    var historics = [];
                    var arrayResult = Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter];
                    // recursively call getNexts when the SAP currency factor has not been yet retrieved
                    // in the other case just pursue sequentially
                    function getNexts(externalFactor, counters) {
                        for (var l = counters.arrayIdx; l < arrayResult.length; l++) {
                            var qResult = arrayResult[l];
                            var count = qResult.GetRecordsCount();
                            for (var i = counters.recordIdx; i < count; ++i) {
                                var itemNumber = Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("EBELP", i));
                                if (itemNumberFilter && itemNumber === itemNumberFilter) {
                                    var currency_for = qResult.GetQueryValue("WAERS", i);
                                    var currency_loc = qResult.GetQueryValue("HSWAE", i);
                                    if (!Lib.AP.SAP.externalCurrencyFactors[currency_for]) {
                                        // SAP currency factor retrieved yet, get it and redo the current step
                                        Lib.AP.SAP.GetExternalCurrencyFactor(getNexts, currency_for, {
                                            arrayIdx: l,
                                            recordIdx: i
                                        });
                                        return;
                                    }
                                    if (!Lib.AP.SAP.externalCurrencyFactors[currency_loc]) {
                                        // SAP currency factor retrieved yet, get it and redo the current step
                                        Lib.AP.SAP.GetExternalCurrencyFactor(getNexts, currency_loc, {
                                            arrayIdx: l,
                                            recordIdx: i
                                        });
                                        return;
                                    }
                                    var factor_for = Lib.AP.SAP.externalCurrencyFactors[currency_for];
                                    var factor_loc = Lib.AP.SAP.externalCurrencyFactors[currency_loc];
                                    var val_forcur = parseFloat(qResult.GetQueryValue("WRBTR", i)) * factor_for;
                                    var val_loccur = parseFloat(qResult.GetQueryValue("DMBTR", i)) * factor_loc;
                                    var ivval_for = parseFloat(qResult.GetQueryValue("REFWR", i)) * factor_for;
                                    var ivval_loc = parseFloat(qResult.GetQueryValue("REEWR", i)) * factor_loc;
                                    var poItemHistory = {
                                        PO_ITEM: itemNumber,
                                        MOVE_TYPE: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("BWART", i)),
                                        WEORA: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("WEORA", i)),
                                        SERIAL_NO: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("ZEKKN", i)),
                                        PROCESS_ID: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("VGABE", i)),
                                        HIST_TYPE: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("BEWTP", i)),
                                        QUANTITY: parseFloat(qResult.GetQueryValue("MENGE", i)),
                                        VAL_FORCUR: parseFloat(val_forcur.toFixed(4)),
                                        VAL_LOCCUR: parseFloat(val_loccur.toFixed(4)),
                                        DB_CR_IND: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("SHKZG", i)),
                                        NO_MORE_GR: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("ELIKZ", i)),
                                        REF_DOC_NO: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("XBLNR", i)),
                                        REF_DOC_YR: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("LFGJA", i)),
                                        REF_DOC: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("LFBNR", i)),
                                        REF_DOC_IT: Sys.Helpers.String.SAP.Trim(qResult.GetQueryValue("LFPOS", i)),
                                        IVVAL_FOR: parseFloat(ivval_for.toFixed(4)),
                                        IVVAL_LOC: parseFloat(ivval_loc.toFixed(4)),
                                        CURRENCY_LOC: currency_loc,
                                        CURRENCY_FOR: currency_for
                                    };
                                    historics.push(poItemHistory);
                                }
                            }
                        }
                        callback(historics);
                    }
                    getNexts(null, {
                        arrayIdx: 0,
                        recordIdx: 0
                    });
                }
                PurchaseOrder.FillHistoricsFromEKBEQueryResult = FillHistoricsFromEKBEQueryResult;
                var EKBEcacheEnabled = false;
                function GetHistoricsPerPurchasingDocument(callback, poNumber, itemNumber, refDoc, refDocIt, refDocYear) {
                    var rowSkip = 0;
                    var filter = "EBELN = '" + Sys.Helpers.String.SAP.NormalizeID(poNumber, 10) + "'";
                    if (!EKBEcacheEnabled) {
                        filter += " AND EBELP = '" + itemNumber + "'";
                    }
                    if (refDoc) {
                        filter += " AND LFBNR = '" + refDoc + "' |";
                    }
                    if (refDocIt) {
                        filter += " AND LFPOS = '" + refDocIt + "' |";
                    }
                    if (refDocYear) {
                        filter += " AND LFGJA = '" + refDocYear + "'";
                    }
                    function query() {
                        Lib.AP.SAP.SAPQuery(queryResultsCallback, Variable.GetValueAsString("SAPConfiguration"), "EKBE", Lib.AP.SAP.PurchaseOrder.fieldsEKBE, filter, Lib.AP.SAP.PurchaseOrder.maxQueryRecords, rowSkip);
                    }
                    function processQueryResults() {
                        Lib.AP.SAP.PurchaseOrder.FillHistoricsFromEKBEQueryResult(callback, filter, itemNumber);
                    }
                    /** @this queryResultsCallback */
                    function queryResultsCallback() {
                        if (!Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter]) {
                            Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter] = [];
                        }
                        Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter].push(this);
                        if (this.GetRecordsCount() < Lib.AP.SAP.PurchaseOrder.maxQueryRecords) {
                            processQueryResults();
                        }
                        else {
                            // Read all lines by blocks of 200 records
                            rowSkip += this.GetRecordsCount();
                            query();
                        }
                    }
                    if (Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter]) {
                        processQueryResults();
                    }
                    else {
                        query();
                    }
                }
                PurchaseOrder.GetHistoricsPerPurchasingDocument = GetHistoricsPerPurchasingDocument;
                function GetHistoricsPerPurchasingDocumentForBrowse(poNumber, poItem, po, deliveryNotes, returnCallback, addPOItemAction, poItemLists) {
                    var rowSkip = 0;
                    var isLimitReached = false;
                    // fetch all PO document history at once (optimization when adding a PO from the PO Header tab of the browse page)
                    var filter = "EBELN = '" + Sys.Helpers.String.SAP.NormalizeID(poNumber, 10) + "'";
                    if (addPOItemAction) {
                        // The user selected a specific PO line item, fetch history for this line only
                        filter += " AND EBELP = '" + poItem.PO_ITEM + "'";
                    }
                    else if (poItemLists && poItemLists.length > 0) {
                        filter += " AND EBELP IN ('" + poItemLists.join("',|'") + "')";
                    }
                    // Filter by delivery notes
                    if (deliveryNotes && deliveryNotes.length > 0) {
                        filter += " AND XBLNR IN ('" + deliveryNotes.join("',|'") + "')";
                    }
                    function query() {
                        Lib.AP.SAP.SAPQuery(queryResultsCallback, Variable.GetValueAsString("SAPConfiguration"), "EKBE", Lib.AP.SAP.PurchaseOrder.fieldsEKBE, filter, Lib.AP.SAP.PurchaseOrder.maxQueryRecords, rowSkip);
                    }
                    /** @this queryResultsCallback */
                    function queryResultsCallback() {
                        if (!Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter]) {
                            Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter] = [];
                        }
                        Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter].push(this);
                        if (Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter].length < Lib.AP.SAP.PurchaseOrder.maxGRLineLoop) {
                            if (this.GetRecordsCount() < Lib.AP.SAP.PurchaseOrder.maxQueryRecords) {
                                processQueryResults();
                            }
                            else {
                                // Read all lines by blocks of 200 records
                                rowSkip += this.GetRecordsCount();
                                query();
                            }
                        }
                        else {
                            isLimitReached = true;
                            processQueryResults();
                        }
                    }
                    function fillHistoricCallback(historics) {
                        Lib.AP.SAP.PurchaseOrder.GetPOItemDataDetailsPerGoodReceipt(poNumber, poItem, po, historics)
                            .Then(function (itemDetails) {
                            if (returnCallback) {
                                returnCallback(itemDetails, isLimitReached);
                            }
                        });
                    }
                    function processQueryResults() {
                        Lib.AP.SAP.PurchaseOrder.FillHistoricsFromEKBEQueryResult(fillHistoricCallback, filter, poItem ? poItem.PO_ITEM : null);
                    }
                    if (Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter]) {
                        processQueryResults();
                    }
                    else {
                        query();
                    }
                }
                PurchaseOrder.GetHistoricsPerPurchasingDocumentForBrowse = GetHistoricsPerPurchasingDocumentForBrowse;
                function GetPoItemData(callback, poNumber, itemNumber) {
                    function getDetailsCallback(poResult) {
                        if (poResult && poResult.PO_ITEMS && poResult.PO_ITEMS[itemNumber]) {
                            callback(poResult.PO_ITEMS[itemNumber]);
                        }
                        else {
                            callback(null);
                        }
                    }
                    if (!poNumber || !itemNumber) {
                        callback(null);
                    }
                    else {
                        //Query SAP, fill cache and return poItem from cache
                        Lib.AP.SAP.PurchaseOrder.GetDetails(getDetailsCallback, poNumber, Data.GetValue("InvoiceCurrency__"));
                    }
                }
                PurchaseOrder.GetPoItemData = GetPoItemData;
                function GetAccountAssignmentInfo(accountAssignments, item) {
                    for (var i = 0; i < accountAssignments.length; i++) {
                        var acctAss = accountAssignments[i];
                        if (Lib.P2P.SAP.Soap.SAPValuesAreEqual(acctAss.PO_ITEM, item.Po_Item)) {
                            return acctAss;
                        }
                    }
                    return null;
                }
                PurchaseOrder.GetAccountAssignmentInfo = GetAccountAssignmentInfo;
                function ConvertToForeignCurrency(nextCallback, value, currencyKey, foreignCurrencyKey, translationDate, exchangeRate, typeOfRate, bUseExchangeRatesTable) {
                    function convertToForeignCurrencyCallback(jsonOutputData) {
                        if (!jsonOutputData.ERRORS ||
                            jsonOutputData.ERRORS.length === 0) {
                            if (nextCallback) {
                                nextCallback(jsonOutputData.IMPORTS.FOREIGN_AMOUNT);
                            }
                        }
                        else {
                            if (jsonOutputData.ERRORS && jsonOutputData.ERRORS.length > 0) {
                                var message = Language.Translate("_Currency rate %1 / %2 rate type %3 for %4 not maintained in the system settings", false, foreignCurrencyKey, currencyKey, "M", translationDate);
                                Lib.AP.SAP.PurchaseOrder.SetLastError(message);
                                Log.Error(Lib.AP.SAP.PurchaseOrder.GetLastError());
                            }
                            Lib.AP.SAP.PurchaseOrder.SetLastError(null);
                        }
                        if (nextCallback) {
                            nextCallback(value);
                        }
                    }
                    function fillConvertToForeignCurrencyParametersAndExecuteBAPI(client) {
                        var exports = {
                            EXPORTS: {
                                CLIENT: client,
                                DATE: translationDate,
                                FOREIGN_CURRENCY: foreignCurrencyKey,
                                LOCAL_AMOUNT: value,
                                LOCAL_CURRENCY: currencyKey,
                                RATE: exchangeRate,
                                READ_TCURR: bUseExchangeRatesTable ? "X" : "",
                                TYPE_OF_RATE: typeOfRate
                            }
                        };
                        Lib.AP.SAP.SAPCallBapi(convertToForeignCurrencyCallback, Variable.GetValueAsString("SAPConfiguration"), "Z_ESK_CONV_TO_FOREIGN_CURRENCY", exports);
                    }
                    Lib.AP.SAP.GetSAPClient().Then(function (sapClient) {
                        fillConvertToForeignCurrencyParametersAndExecuteBAPI(sapClient);
                    });
                    return null;
                }
                PurchaseOrder.ConvertToForeignCurrency = ConvertToForeignCurrency;
                function ComputeTotalsForGR(purchaseItemHistory, purchaseItemHistorics, poItem, options) {
                    var totals = {
                        totalInvoicedAmount: 0,
                        totalInvoicedQty: 0,
                        totalDeliveredAmount: 0,
                        totalDeliveredQty: 0
                    };
                    var purchaseItemHistoryKey = purchaseItemHistory.PO_ITEM + purchaseItemHistory.REF_DOC +
                        purchaseItemHistory.REF_DOC_IT + purchaseItemHistory.REF_DOC_YR;
                    var computePromises = [];
                    for (var idx = 0; idx < purchaseItemHistorics.length; idx++) {
                        var aPoItemHistory = purchaseItemHistorics[idx];
                        var historyKey = aPoItemHistory.PO_ITEM + aPoItemHistory.REF_DOC + aPoItemHistory.REF_DOC_IT + aPoItemHistory.REF_DOC_YR;
                        if (purchaseItemHistoryKey === historyKey) {
                            if (aPoItemHistory.PROCESS_ID === "1") {
                                var computePromise = Lib.AP.SAP.PurchaseOrder.ComputeTotalsOfGoodsReceipt(totals, aPoItemHistory, poItem, options);
                                computePromises.push(computePromise);
                            }
                            else if (aPoItemHistory.PROCESS_ID === "2") {
                                var computePromise = Lib.AP.SAP.PurchaseOrder.ComputeTotalsOfInvoicesReceipt(totals, aPoItemHistory, options);
                                computePromises.push(computePromise);
                            }
                        }
                    }
                    return Sys.Helpers.Promise.All(computePromises)
                        .Then(function () {
                        return totals;
                    });
                }
                PurchaseOrder.ComputeTotalsForGR = ComputeTotalsForGR;
                function UpdateValuesOfGRItem(poItemData, totals) {
                    poItemData.refExpectedQuantity = totals.totalDeliveredQty - totals.totalInvoicedQty;
                    poItemData.refExpectedAmount = totals.totalDeliveredAmount - totals.totalInvoicedAmount;
                    poItemData.refOpenInvoiceQuantity = poItemData.refExpectedQuantity;
                    poItemData.refOpenInvoiceValue = poItemData.refExpectedAmount;
                    poItemData.Deliv_Qty = totals.totalDeliveredQty;
                    poItemData.Iv_Qty = totals.totalInvoicedQty;
                }
                PurchaseOrder.UpdateValuesOfGRItem = UpdateValuesOfGRItem;
                function IsOpenInvoiceItem(poItemData) {
                    return !(poItemData.Final_Inv || (poItemData.refOpenInvoiceQuantity === 0 && poItemData.refOpenInvoiceValue === 0));
                }
                PurchaseOrder.IsOpenInvoiceItem = IsOpenInvoiceItem;
                function IsOpenInvoice(po) {
                    if (typeof po.Final_Inv === "undefined") {
                        po.Final_Inv = true;
                        for (var itemNumber in po.PO_ITEMS) {
                            if (Lib.AP.SAP.PurchaseOrder.IsOpenInvoiceItem(po.PO_ITEMS[itemNumber])) {
                                po.Final_Inv = false;
                                break;
                            }
                        }
                    }
                    return !po.Final_Inv;
                }
                PurchaseOrder.IsOpenInvoice = IsOpenInvoice;
                //Internal function
                function GetPOItemDataDetailsPerGoodReceipt(poNumber, poItem, po, purchaseItemHistorics) {
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        var items = [];
                        var refDoc = {};
                        purchaseItemHistorics.reduce(function (p, history) {
                            return p.Then(function () {
                                var historyKey = "".concat(history.REF_DOC, "-").concat(history.REF_DOC_IT, "-").concat(history.REF_DOC_YR);
                                if (Lib.P2P.SAP.Soap.SAPValuesAreEqual(history.PO_ITEM, poItem.PO_ITEM) &&
                                    !Object.prototype.hasOwnProperty.call(refDoc, historyKey)) {
                                    // Don't create several items for the same REF_DOC
                                    refDoc[historyKey] = history;
                                    var options_1 = {
                                        refCurrency: po.refCurrency,
                                        exchangeRateDate: po.PO_HEADER.DOC_DATE
                                    };
                                    return Lib.AP.SAP.PurchaseOrder.CreatePOItemDetailsFromPOItem(poNumber, poItem, po)
                                        .Then(function (poItemData) {
                                        if (poItemData.Gr_Basediv) {
                                            poItemData.Del_Compl = Sys.Helpers.String.SAP.Trim(poItem.DEL_COMPL).length > 0;
                                            poItemData.Ref_Doc_No = history.REF_DOC_NO;
                                            poItemData.Ref_Doc = historyKey;
                                            return Lib.AP.SAP.PurchaseOrder.ComputeTotalsForGR(history, purchaseItemHistorics, poItemData, options_1)
                                                .Then(function (totals) {
                                                Lib.AP.SAP.PurchaseOrder.UpdateValuesOfGRItem(poItemData, totals);
                                                items.push(poItemData);
                                            });
                                        }
                                        return p;
                                    });
                                }
                                return p;
                            });
                        }, Sys.Helpers.Promise.Resolve())
                            .Then(function () {
                            resolve(items);
                        });
                    });
                }
                PurchaseOrder.GetPOItemDataDetailsPerGoodReceipt = GetPOItemDataDetailsPerGoodReceipt;
                //Internal function
                function GetGRForeignValue(item) {
                    var grFValue = item.Gr_Non_Val ? item.H_Val_Gr_For : item.Val_Gr_For;
                    if (isNaN(grFValue)) {
                        grFValue = 0;
                    }
                    return grFValue;
                }
                PurchaseOrder.GetGRForeignValue = GetGRForeignValue;
                //Internal function
                function ComputeOpenGRValuesForService(item) {
                    item.refOpenGoodReceiptQuantity = 1;
                    item.refOpenGoodReceiptValue = 0;
                    if (!item.InvoicingPlanNumbers) {
                        var val_gr_for = Lib.AP.SAP.PurchaseOrder.GetGRForeignValue(item);
                        if (item.refNetValue > val_gr_for) {
                            item.refOpenGoodReceiptValue = item.refNetValue - val_gr_for;
                        }
                    }
                }
                PurchaseOrder.ComputeOpenGRValuesForService = ComputeOpenGRValuesForService;
                //Internal function
                function ComputeOpenGRValues(item) {
                    item.refOpenGoodReceiptQuantity = 0;
                    item.refOpenGoodReceiptValue = 0;
                    if (item.IsServiceItem()) {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenGRValuesForService(item);
                    }
                    else if (item.Gr_Ind) {
                        item.refOpenGoodReceiptQuantity = item.Quantity - Math.abs(item.Deliv_Qty + (item.Blocked_Qy ? item.Blocked_Qy : 0));
                        if (item.refOpenGoodReceiptQuantity < 0) {
                            item.refOpenGoodReceiptQuantity = 0;
                        }
                        if (!item.InvoicingPlanNumbers) {
                            item.refOpenGoodReceiptValue = item.refOpenGoodReceiptQuantity * item.refNetValue / item.Quantity;
                        }
                    }
                }
                PurchaseOrder.ComputeOpenGRValues = ComputeOpenGRValues;
                //Internal function
                function ComputeOpenInvoiceValuesForPlan(callback, item) {
                    item.refOpenInvoiceQuantity = 0;
                    item.refOpenInvoiceValue = 0;
                    function updateOpenValuesFromScheduleValue(scheduledValue) {
                        if (scheduledValue >= item.Val_Iv_For && !item.Final_Inv) {
                            item.refOpenInvoiceQuantity = item.Val_Iv_For === 0 ? item.Quantity : 0;
                            item.refOpenInvoiceValue = scheduledValue - item.Val_Iv_For;
                        }
                        callback(item);
                    }
                    /** @this computeOpenInvoiceValuesForPlanCallback */
                    function computeOpenInvoiceValuesForPlanCallback() {
                        var scheduledValue = 0;
                        for (var i = 0; i < this.GetRecordsCount(); i++) {
                            scheduledValue += parseFloat(Sys.Helpers.String.SAP.Trim(this.GetQueryValue("FAKWR", i)));
                        }
                        updateOpenValuesFromScheduleValue(scheduledValue);
                    }
                    if (item.InvoicingPlanNumbers !== "$") {
                        var options = "FPLNR = '".concat(item.InvoicingPlanNumbers, "' AND FAREG <> '4' AND FAREG <> '5'");
                        Lib.AP.SAP.SAPQuery(computeOpenInvoiceValuesForPlanCallback, Variable.GetValueAsString("SAPConfiguration"), "FPLT", "FAKWR", options, Lib.AP.SAP.PurchaseOrder.maxQueryRecords);
                    }
                    else {
                        updateOpenValuesFromScheduleValue(0);
                    }
                }
                PurchaseOrder.ComputeOpenInvoiceValuesForPlan = ComputeOpenInvoiceValuesForPlan;
                //Internal function
                function ComputeOpenInvoiceValuesForServiceOrLimit(item) {
                    item.refOpenInvoiceQuantity = 0;
                    item.refOpenInvoiceValue = 0;
                    var val_gr_for = Lib.AP.SAP.PurchaseOrder.GetGRForeignValue(item);
                    // if budget value larger than incoming goods value compare to net value
                    var comparisonValue = item.Net_Value > val_gr_for && !item.Del_Compl ? item.Net_Value : val_gr_for;
                    if (item.Val_Iv_For < comparisonValue && !item.Final_Inv) {
                        item.refOpenInvoiceQuantity = 1;
                        item.refOpenInvoiceValue = comparisonValue - item.Val_Iv_For;
                    }
                }
                PurchaseOrder.ComputeOpenInvoiceValuesForServiceOrLimit = ComputeOpenInvoiceValuesForServiceOrLimit;
                //Internal function
                function ComputeOpenInvoiceValues(item) {
                    item.refOpenInvoiceQuantity = 0;
                    item.refOpenInvoiceValue = 0;
                    if (!item.Final_Inv && item.Ir_Ind) {
                        // Quantity of goods received
                        var h_deliv_qty = Math.abs(item.Deliv_Qty);
                        // Quantity invoiced
                        var h_iv_qty = Math.abs(item.Iv_Qty);
                        if (item.Gr_Ind && (item.Del_Compl || h_deliv_qty > item.Quantity)) {
                            item.refOpenInvoiceQuantity = h_deliv_qty - h_iv_qty;
                        }
                        else {
                            item.refOpenInvoiceQuantity = item.Quantity - h_iv_qty;
                        }
                        if (item.refOpenInvoiceQuantity > 0) {
                            item.refOpenInvoiceValue = item.refOpenInvoiceQuantity * item.refNetValue / item.Quantity;
                            if (item.refOpenInvoiceValue > 99999999999.99) {
                                item.refOpenInvoiceValue = 99999999999.99;
                            }
                        }
                        else {
                            item.refOpenInvoiceQuantity = 0;
                        }
                    }
                }
                PurchaseOrder.ComputeOpenInvoiceValues = ComputeOpenInvoiceValues;
                //Internal function
                function ComputeOpenValues(callback, item) {
                    item.refOpenGoodReceiptQuantity = 0;
                    item.refOpenGoodReceiptValue = 0;
                    item.refOpenInvoiceQuantity = 0;
                    item.refOpenInvoiceValue = 0;
                    if (item.Doc_Cat === "K" || item.Doc_Cat === "A" || item.Quantity === 0 || item.Delete_Ind) {
                        callback(item);
                        return false;
                    }
                    if (!item.Del_Compl) {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenGRValues(item);
                    }
                    if (item.InvoicingPlanNumbers.length > 0) {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenInvoiceValuesForPlan(callback, item);
                        return true;
                    }
                    else if (item.IsServiceItem() || (item.IsLimitItem() && item.Net_Value !== 0)) {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenInvoiceValuesForServiceOrLimit(item);
                    }
                    else {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenInvoiceValues(item);
                    }
                    callback(item);
                    return true;
                }
                PurchaseOrder.ComputeOpenValues = ComputeOpenValues;
                //Internal function
                function GetHistoryItemGRInfo(callback, idx, histories, item) {
                    /** @this getHistoryItemGRInfoCallback */
                    function getHistoryItemGRInfoCallback() {
                        if (this.GetRecordsCount() > 0 && Sys.Helpers.String.SAP.Trim(this.GetQueryValue("KZABN", 0)).length > 0) {
                            item.H_Val_Gr_Loc += histories[idx].VAL_LOCCUR;
                            item.H_Val_Gr_For += histories[idx].VAL_FORCUR;
                        }
                        callback();
                    }
                    // Entry sheet number
                    Lib.AP.SAP.SAPQuery(getHistoryItemGRInfoCallback, Variable.GetValueAsString("SAPConfiguration"), "ESSR", "KZABN", "LBLNI = '".concat(histories[idx].MAT_DOC, "'"));
                }
                PurchaseOrder.GetHistoryItemGRInfo = GetHistoryItemGRInfo;
                //Internal function
                function GetHistoryItemInvoiceInfo(callback, idx, poHeader, histories, item) {
                    function getHistoryItemInvoiceInfoCallBack(resForeignAmount) {
                        if (histories[idx].DB_CR_IND === "S") {
                            item.Val_Iv_For += resForeignAmount;
                            item.Val_Iv_Loc += histories[idx].VAL_LOCCUR;
                        }
                        else {
                            item.Val_Iv_For -= resForeignAmount;
                            item.Val_Iv_Loc -= histories[idx].VAL_LOCCUR;
                        }
                        callback(idx + 1, poHeader, histories, item);
                    }
                    // Conversion in purchase order currency
                    if (histories[idx].CURRENCY !== item.refCurrency) {
                        var historyAmount = histories[idx].VAL_LOCCUR;
                        if (histories[idx].CURRENCY && item.refCurrency) {
                            var rate = 0;
                            // Indicator: Fixing of exchange rate?
                            if (poHeader.EX_RATE_FX.length > 0) {
                                rate = poHeader.EXCH_RATE;
                            }
                            Lib.AP.SAP.PurchaseOrder.ConvertToForeignCurrency(getHistoryItemInvoiceInfoCallBack, historyAmount, histories[idx].CURRENCY, item.refCurrency, poHeader.DOC_DATE, rate, "M", true);
                        }
                        else {
                            getHistoryItemInvoiceInfoCallBack(historyAmount);
                        }
                    }
                    else {
                        getHistoryItemInvoiceInfoCallBack(histories[idx].VAL_FORCUR);
                    }
                }
                PurchaseOrder.GetHistoryItemInvoiceInfo = GetHistoryItemInvoiceInfo;
                //Internal function
                function GetHistoryItemInfo(callback, poHeader, poItemHistory, itemDetails) {
                    function getHistoryItemInfoCallback(idx, header, histories, item) {
                        if (idx >= histories.length) {
                            callback(item);
                            return;
                        }
                        var history = histories[idx];
                        function getHistoryItemInfoSubCallback() {
                            // deal with Invoice value
                            if (history.PROCESS_ID === "2" || history.PROCESS_ID === "3") {
                                Lib.AP.SAP.PurchaseOrder.GetHistoryItemInvoiceInfo(getHistoryItemInfoCallback, idx, header, histories, item);
                            }
                            else {
                                getHistoryItemInfoCallback(idx + 1, header, histories, item);
                            }
                        }
                        // deal with GR value
                        if (history.PROCESS_ID === "9") {
                            Lib.AP.SAP.PurchaseOrder.GetHistoryItemGRInfo(getHistoryItemInfoSubCallback, idx, histories, item);
                        }
                        else {
                            getHistoryItemInfoSubCallback();
                        }
                    }
                    getHistoryItemInfoCallback(0, poHeader, poItemHistory, itemDetails);
                }
                PurchaseOrder.GetHistoryItemInfo = GetHistoryItemInfo;
                //Internal function
                function GetHistoryTotalsItemInfo(historyTotals, item) {
                    for (var i = 0; i < historyTotals.length; i++) {
                        var historyTotal = historyTotals[i];
                        if (Lib.P2P.SAP.Soap.SAPValuesAreEqual(historyTotal.PO_ITEM, item.Po_Item)) {
                            item.Iv_Qty = historyTotal.IV_QTY;
                            item.Iv_Qty_Po = historyTotal.IV_QTY_PO;
                            item.Deliv_Qty = historyTotal.DELIV_QTY;
                            item.Val_Iv_Loc = historyTotal.VAL_IV_LOC;
                            item.Val_Iv_For = historyTotal.VAL_IV_FOR;
                            item.Ivval_Loc = historyTotal.IVVAL_LOC;
                            item.Ivval_For = historyTotal.IVVAL_FOR;
                            item.Val_Gr_Loc = historyTotal.VAL_GR_LOC;
                            item.Val_Gr_For = historyTotal.VAL_GR_FOR;
                            break;
                        }
                    }
                }
                PurchaseOrder.GetHistoryTotalsItemInfo = GetHistoryTotalsItemInfo;
                //Internal function
                function ExtractItemPlanNumber(itemNumber, planNumber) {
                    if (!planNumber) {
                        return "";
                    }
                    var idx = 0;
                    while (idx < planNumber.length) {
                        if (planNumber.substr(idx + 10, 5) === itemNumber) {
                            return Sys.Helpers.String.SAP.Trim(planNumber.substr(idx, 10));
                        }
                        idx += 15;
                    }
                    return "";
                }
                PurchaseOrder.ExtractItemPlanNumber = ExtractItemPlanNumber;
                //Internal function
                function ComputeTotalsOfGoodsReceipt(totals, aPoItemHistory, poItem, options) {
                    return Lib.AP.SAP.PurchaseOrder.GetExternalCurrencyExchangeRate(options.refCurrency, aPoItemHistory.CURRENCY_FOR, options.exchangeRateDate)
                        .Then(function (historyExchangeRate) {
                        var poItemHistoryValue = aPoItemHistory.VAL_FORCUR;
                        var itemQuantity = poItem.Quantity;
                        var itemNetValue = poItem.refNetValue;
                        var itemUnitPrice = poItem.refNetPrice;
                        var itemNondItax = poItem.refNondItax;
                        if (historyExchangeRate !== 1) {
                            // prefer local amounts only if it match the currency to avoid extra conversions.
                            if (aPoItemHistory.CURRENCY_LOC === options.refCurrency) {
                                poItemHistoryValue = aPoItemHistory.VAL_LOCCUR;
                            }
                            else {
                                poItemHistoryValue = Lib.AP.ApplyExchangeRate(poItemHistoryValue, historyExchangeRate, true);
                            }
                        }
                        // form this point amounts are expressed in invoice currency
                        var DeliveredAmount = poItemHistoryValue;
                        if (itemQuantity > 0 && itemNondItax > 0) {
                            DeliveredAmount -= aPoItemHistory.QUANTITY * itemNondItax / itemQuantity;
                        }
                        /*
                        Movement type 107: Goods receipt to valuated blocked stock
                        Movement type 108: Goods receipt to valuated blocked stock - reversal (for movement type 107)
                        Movement type 109: Goods receipt from valuated blocked stock
                        Movement type 110: Goods receipt from valuated blocked stock - reversal (for movement type 109)
                        */
                        if (aPoItemHistory.MOVE_TYPE === "107" || aPoItemHistory.MOVE_TYPE === "108") {
                            if (aPoItemHistory.WEORA === "X") {
                                // Keep amount, and compute the corresponding quantity
                                if (itemUnitPrice > 0 && itemNetValue > 0) {
                                    aPoItemHistory.QUANTITY = DeliveredAmount / itemUnitPrice;
                                }
                            }
                            else {
                                // ignore amount (valuated blocked stock)
                                DeliveredAmount = 0;
                            }
                        }
                        else if (aPoItemHistory.MOVE_TYPE === "109" || aPoItemHistory.MOVE_TYPE === "110" || !poItemHistoryValue) {
                            if (aPoItemHistory.WEORA === "X") {
                                // ignore 109 and 110 (already included in 107 / 108)
                                DeliveredAmount = 0;
                                aPoItemHistory.QUANTITY = 0;
                            }
                            else {
                                // compute delivery amount based on GR quantity and PO unit price
                                DeliveredAmount = aPoItemHistory.QUANTITY * itemUnitPrice;
                            }
                        }
                        // reversed history
                        if (aPoItemHistory.HIST_TYPE === "E" && aPoItemHistory.DB_CR_IND === "H") {
                            totals.totalDeliveredQty -= aPoItemHistory.QUANTITY;
                            totals.totalDeliveredAmount -= DeliveredAmount;
                        }
                        else {
                            totals.totalDeliveredQty += aPoItemHistory.QUANTITY;
                            totals.totalDeliveredAmount += DeliveredAmount;
                        }
                    });
                }
                PurchaseOrder.ComputeTotalsOfGoodsReceipt = ComputeTotalsOfGoodsReceipt;
                //Internal function
                function ComputeTotalsOfInvoicesReceipt(totals, aPoItemHistory, options) {
                    return Lib.AP.SAP.PurchaseOrder.GetExternalCurrencyExchangeRate(options.refCurrency, aPoItemHistory.CURRENCY_FOR, options.exchangeRateDate)
                        .Then(function (exchangeRate) {
                        var ivval = aPoItemHistory.IVVAL_FOR;
                        if (exchangeRate !== 1) {
                            if (aPoItemHistory.CURRENCY_LOC === options.refCurrency) {
                                ivval = aPoItemHistory.IVVAL_LOC;
                            }
                            else {
                                ivval = Lib.AP.ApplyExchangeRate(ivval, exchangeRate, true);
                            }
                        }
                        // Get sum of invoiced quantities/amount for this GR (in the PO/local currency)
                        if (aPoItemHistory.DB_CR_IND === "H") {
                            totals.totalInvoicedQty -= aPoItemHistory.QUANTITY;
                            totals.totalInvoicedAmount -= ivval;
                        }
                        else {
                            totals.totalInvoicedQty += aPoItemHistory.QUANTITY;
                            totals.totalInvoicedAmount += ivval;
                        }
                    });
                }
                PurchaseOrder.ComputeTotalsOfInvoicesReceipt = ComputeTotalsOfInvoicesReceipt;
            })(PurchaseOrder = SAP.PurchaseOrder || (SAP.PurchaseOrder = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
