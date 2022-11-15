///#GLOBALS Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_PurchaseOrder_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: SAP FI post routines.",
  "require": [
    "Lib_AP_SAP_Server_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP",
    "Lib_AP_SAP_PurchaseOrder_Common_V12.0.461.0"
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
                var g_BapiParameters = null;
                var PurchaseOrderParameters = /** @class */ (function (_super) {
                    __extends(PurchaseOrderParameters, _super);
                    function PurchaseOrderParameters(bapiController) {
                        var _this = _super.call(this) || this;
                        _this.maxItemsCountPerPO = 300;
                        _this.cachePODetails = {};
                        _this.BapiController = bapiController ? bapiController : Lib.AP.SAP.GetNewBapiController();
                        return _this;
                    }
                    PurchaseOrderParameters.prototype.ResetParameters = function () {
                        // BAPI
                        this.cachePODetails = {};
                        this.BapiController.ResetAllBapis();
                    };
                    PurchaseOrderParameters.prototype.Init = function (pSapControl) {
                        this.AddBapi(Lib.P2P.SAP.Soap.GetBAPIName("RFC_READ_TABLE"));
                        this.AddBapi("BAPI_PO_GETDETAIL");
                        this.AddBapi("Z_ESK_CONV_TO_FOREIGN_CURRENCY");
                        this.AddBapi("BAPI_GL_ACC_GETDETAIL");
                        return this.BapiController.Init(pSapControl);
                    };
                    PurchaseOrderParameters.prototype.IsConnected = function () {
                        return Boolean(this.BapiController.GetBapiManager() && this.BapiController.GetBapiManager().Connected);
                    };
                    return PurchaseOrderParameters;
                }(Lib.AP.SAP.SAPParameters));
                PurchaseOrder.PurchaseOrderParameters = PurchaseOrderParameters;
                function setCustomDimensions(item, details, tableName, checkNameInForm) {
                    var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                    if (customDimensions && customDimensions.poSAPItems) {
                        if (customDimensions.poSAPItems[tableName]) {
                            for (var indexCustomPoItem = 0; indexCustomPoItem < customDimensions.poSAPItems[tableName].length; indexCustomPoItem++) {
                                var poSAPItem = customDimensions.poSAPItems[tableName][indexCustomPoItem];
                                if (poSAPItem && !Sys.Helpers.IsEmpty(poSAPItem.nameInSAP) && !(checkNameInForm && Sys.Helpers.IsEmpty(poSAPItem.nameInForm))) {
                                    var itemValue = item.GetValue(poSAPItem.nameInSAP) || "";
                                    var formatter = poSAPItem.fieldFormatter;
                                    if (itemValue && typeof formatter === "function") {
                                        itemValue = formatter(itemValue);
                                    }
                                    details[poSAPItem.nameInSAP] = itemValue;
                                }
                            }
                        }
                    }
                }
                PurchaseOrder.checkLineItems = false;
                function mapDeliveryNoteToArray(mapDeliveryNotes) {
                    var array = [];
                    for (var deliveryNoteKey in mapDeliveryNotes) {
                        if (Object.prototype.hasOwnProperty.call(mapDeliveryNotes, deliveryNoteKey)) {
                            array.push({
                                deliveryNote: deliveryNoteKey,
                                updateDate: mapDeliveryNotes[deliveryNoteKey]
                            });
                        }
                    }
                    function sortDeliveryNote(a, b) {
                        if (a.updateDate.getTime() === b.updateDate.getTime()) {
                            return 0;
                        }
                        return a.updateDate.getTime() < b.updateDate.getTime() ? 1 : -1;
                    }
                    array.sort(sortDeliveryNote);
                    return array;
                }
                PurchaseOrder.mapDeliveryNoteToArray = mapDeliveryNoteToArray;
                function addDateTwoHours(input) {
                    return new Date(input.getFullYear(), input.getMonth(), input.getDate(), input.getHours() + 2, input.getMinutes());
                }
                PurchaseOrder.addDateTwoHours = addDateTwoHours;
                function FillLinesFromPO(orderNumber, poDetails, deliveryNotes, checkLines) {
                    function updateResultCounter(result) {
                        if (result.lineUpdated === true) {
                            resultCount.updatedLines++;
                        }
                        else if (result.lineAdded === true) {
                            resultCount.newLines++;
                        }
                        if (result.lineProcessed) {
                            resultCount.linesProcessed.push(result.lineProcessed);
                        }
                    }
                    Lib.AP.SAP.PurchaseOrder.checkLineItems = checkLines;
                    var emptyReturn = { newLines: 0, updatedLines: 0, linesProcessed: [] };
                    if (!poDetails || !poDetails.PO_ITEMS) {
                        return emptyReturn;
                    }
                    var params = Lib.AP.SAP.PurchaseOrder.GetBapiParameters();
                    if (!params) {
                        Log.Error("Lib.AP.SAP.PurchaseOrder.FillLinesFromPO - Failed to initialize BAPI parameters");
                        return emptyReturn;
                    }
                    var bAddAllPOLines = Variable.GetValueAsString("AddAllPOLines") === "true";
                    var currentPOItemIdx = 0, currentPOItem = "";
                    var resultCount = {
                        newLines: 0,
                        updatedLines: 0,
                        linesProcessed: new Array()
                    };
                    var firstLineChecked = true;
                    for (var key in poDetails.PO_ITEMS) {
                        if (Object.prototype.hasOwnProperty.call(poDetails.PO_ITEMS, key)) {
                            //Remove first empty line
                            if (firstLineChecked && Data.GetTable("LineItems__").GetItemCount() === 1 && Lib.P2P.InvoiceLineItem.IsEmpty(Data.GetTable("LineItems__").GetItem(0))) {
                                Data.GetTable("LineItems__").SetItemCount(0);
                                firstLineChecked = false;
                            }
                            var item = poDetails.PO_ITEMS[key];
                            var deliveryNoteOK = true;
                            if (item.Ref_Doc_No && item.Ref_Doc_No !== "" && deliveryNotes && deliveryNotes.length > 0) {
                                deliveryNoteOK = false;
                                for (var i = 0; i < deliveryNotes.length; i++) {
                                    if (item.Ref_Doc_No.toLowerCase() === deliveryNotes[i].toLowerCase()) {
                                        deliveryNoteOK = true;
                                        break;
                                    }
                                }
                            }
                            if ((bAddAllPOLines || item.refExpectedAmount !== 0) && deliveryNoteOK) {
                                if (item.Gr_Basediv) {
                                    Data.SetValue("GRIV__", true);
                                    // Limit the number of lines, distributed equally along the PO lines
                                    if (currentPOItem !== item.Po_Item) {
                                        currentPOItemIdx = 0;
                                        currentPOItem = item.Po_Item;
                                    }
                                    else if (++currentPOItemIdx >= params.maxItemsCountPerPO / poDetails.PO_ITEM_HISTORY_TOTALS.Count) {
                                        continue;
                                    }
                                }
                                var res = void 0;
                                if (item.Po_Item in poDetails.AccountAssignments) {
                                    res = Lib.AP.SAP.PurchaseOrder.parseAccountAssignement(orderNumber, item, poDetails, params);
                                }
                                else {
                                    res = Lib.AP.SAP.PurchaseOrder.InsertOrUpdatePOLine(orderNumber, item, poDetails, params);
                                }
                                updateResultCounter(res);
                            }
                            else if (item.refExpectedAmount === 0) {
                                // Specific case, when checking if GR is received and the line ExpectedAmount is 0
                                // - In GRIV, We want to delete lines with ExpectedAmount = 0
                                // - In MM, We want to update Expected/Open Quantity/Amount to 0
                                var line = null;
                                if (Lib.AP.SAP.PurchaseOrder.checkLineItems) {
                                    line = Lib.AP.SAP.PurchaseOrder.SearchPOLine(orderNumber, item.Po_Item, item.Ref_Doc);
                                }
                                if (line) {
                                    if (item.Gr_Basediv) {
                                        // Should never go here since the GR lines with 0 ExpectedAmount are filtered before
                                        line.RemoveItem();
                                    }
                                    else {
                                        line.SetValue("OpenAmount__", item.refOpenInvoiceValue);
                                        line.SetValue("OpenQuantity__", item.refOpenInvoiceQuantity);
                                        line.SetValue("ExpectedAmount__", item.refExpectedAmount);
                                        line.SetValue("ExpectedQuantity__", item.refExpectedQuantity);
                                        resultCount.linesProcessed.push(line);
                                    }
                                }
                                else {
                                    Log.Info("Discarding PO#" + orderNumber + " line #" + item.Po_Item + " (no expected amount and quantity)");
                                }
                            }
                        }
                    }
                    if (poDetails.PlannedDeliveryCosts && poDetails.PlannedDeliveryCosts.length > 0) {
                        Lib.AP.SAP.PurchaseOrder.checkLineItems = true;
                        for (var _i = 0, _a = poDetails.PlannedDeliveryCosts; _i < _a.length; _i++) {
                            var pdc = _a[_i];
                            var pdcRes = Lib.AP.SAP.PurchaseOrder.InsertOrUpdatePOLine(orderNumber, pdc, poDetails, params);
                            updateResultCounter(pdcRes);
                        }
                        Lib.AP.SAP.PurchaseOrder.checkLineItems = checkLines;
                    }
                    return resultCount;
                }
                PurchaseOrder.FillLinesFromPO = FillLinesFromPO;
                function parseAccountAssignement(orderNumber, item, poDetails, params) {
                    var ret = {
                        lineUpdated: false,
                        lineAdded: false
                    };
                    for (var itemAcctAss in poDetails.AccountAssignments) {
                        if (itemAcctAss === item.Po_Item) {
                            var currItemAcctAss = poDetails.AccountAssignments[itemAcctAss];
                            for (var i = 0; i < currItemAcctAss.length; i++) {
                                var acctAss = currItemAcctAss[i];
                                var tempPo = Sys.Helpers.Clone(poDetails);
                                tempPo.AccountAssignments = {};
                                tempPo.AccountAssignments[item.Po_Item] = [acctAss];
                                ret = Lib.AP.SAP.PurchaseOrder.InsertOrUpdatePOLine(orderNumber, item, tempPo, params);
                            }
                        }
                    }
                    return ret;
                }
                PurchaseOrder.parseAccountAssignement = parseAccountAssignement;
                function getLastTenHistoryDeliveryNotes(minDateTime, poDetails) {
                    var mapDeliveryNotes = {};
                    if (minDateTime && poDetails) {
                        var poItemHistory = poDetails.PO_ITEM_HISTORY;
                        for (var idx = 0; idx < poItemHistory.Count; ++idx) {
                            var hist = poItemHistory.Get(idx);
                            var deliveryNote = hist.GetValue("REF_DOC_NO");
                            if (!deliveryNote) {
                                continue;
                            }
                            var grDate = hist.GetValue("ENTRY_DATE");
                            var grTime = hist.GetValue("ENTRY_TIME");
                            var grDateTime = Lib.AP.SAP.FormatDateFromSAP(grDate, grTime);
                            grDateTime = Lib.AP.SAP.PurchaseOrder.addDateTwoHours(grDateTime);
                            if (grDateTime > minDateTime && hist.GetValue("HIST_TYPE") === "E" && (!mapDeliveryNotes[deliveryNote] || mapDeliveryNotes[deliveryNote] < grDateTime)) {
                                mapDeliveryNotes[deliveryNote] = grDateTime;
                            }
                        }
                        return Lib.AP.SAP.PurchaseOrder.mapDeliveryNoteToArray(mapDeliveryNotes);
                    }
                    return [];
                }
                PurchaseOrder.getLastTenHistoryDeliveryNotes = getLastTenHistoryDeliveryNotes;
                function CreateNewPOLine(orderNumber, item, poDetails, params) {
                    var obj = {
                        getTaxRateParameters: params,
                        taxCode: item.Tax_Code,
                        jurisdictionCode: item.Tax_Jur_Cd,
                        orderNumber: orderNumber,
                        buyer: item.Buyer,
                        receiver: item.Receiver,
                        itemNumber: item.Po_Item,
                        description: item.Short_Text,
                        deliveryNote: item.Ref_Doc_No,
                        goodReceipt: item.Ref_Doc,
                        vendorNumber: item.Vendor,
                        diffInv: item.Diff_Inv,
                        partNumber: item.Material,
                        unitPrice: item.refNetPrice,
                        AcctAssCat: item.AcctAssCat,
                        Distribution: item.Distribution,
                        glAccount: "",
                        costCenter: "",
                        noGoodsReceipt: !item.Gr_Ind
                    };
                    var acctAss = Lib.AP.SAP.PurchaseOrder.GetAccountAssignmentInfo(poDetails.AccountAssignments, item);
                    if (acctAss) {
                        obj.glAccount = acctAss.G_L_ACCT;
                        obj.costCenter = acctAss.COST_CTR;
                        obj.businessArea = acctAss.BUS_AREA;
                        obj.internalOrder = acctAss.ORDER_NO;
                        obj.wbsElement = acctAss.WBS_ELEM_E;
                    }
                    Lib.AP.SAP.PurchaseOrder.AddCustomDimensions(obj, item, acctAss);
                    return Lib.AP.AddPOLine(obj);
                }
                PurchaseOrder.CreateNewPOLine = CreateNewPOLine;
                function AddCustomDimension(obj, item, dimensionsArray) {
                    if (!obj.customDimensions) {
                        obj.customDimensions = {};
                    }
                    for (var indexCustomPoItem = 0; indexCustomPoItem < dimensionsArray.length; indexCustomPoItem++) {
                        var sapItem = dimensionsArray[indexCustomPoItem];
                        if (sapItem && !Sys.Helpers.IsEmpty(sapItem.nameInForm) && !Sys.Helpers.IsEmpty(sapItem.nameInSAP)) {
                            var itemValue = item[sapItem.nameInSAP] || "";
                            var formatter = sapItem.fieldFormatter;
                            if (itemValue && typeof formatter === "function") {
                                itemValue = formatter(itemValue);
                            }
                            obj.customDimensions[sapItem.nameInForm] = itemValue;
                        }
                    }
                }
                PurchaseOrder.AddCustomDimension = AddCustomDimension;
                function AddCustomDimensions(obj, item, acctAss) {
                    var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                    if (customDimensions && customDimensions.poSAPItems) {
                        for (var key in customDimensions.poSAPItems) {
                            if (Object.prototype.hasOwnProperty.call(customDimensions.poSAPItems, key)) {
                                var poDetailsElement = void 0;
                                switch (key) {
                                    case "PO_ITEMS":
                                    case "PO_HEADER":
                                    case "PO_ADDRESS":
                                        poDetailsElement = item;
                                        break;
                                    case "PO_ITEM_ACCOUNT_ASSIGNMENT":
                                        poDetailsElement = acctAss;
                                        break;
                                    default:
                                        Log.Error("customDimensions.poSAPItems." + key + " not supported yet in GetCustomDimensions");
                                }
                                if (poDetailsElement && customDimensions.poSAPItems[key].length) {
                                    Lib.AP.SAP.PurchaseOrder.AddCustomDimension(obj, poDetailsElement, customDimensions.poSAPItems[key]);
                                }
                            }
                        }
                    }
                }
                PurchaseOrder.AddCustomDimensions = AddCustomDimensions;
                function SearchPOLine(orderNumber, itemNumber, goodReceipt, pricingCondtion) {
                    var table = Data.GetTable("LineItems__");
                    //Look for existing line
                    for (var i = 0; i < table.GetItemCount(); i++) {
                        var line = table.GetItem(i);
                        if (Lib.AP.LineMatch(line, orderNumber, itemNumber, goodReceipt, "", pricingCondtion)) {
                            return line;
                        }
                    }
                    return null;
                }
                PurchaseOrder.SearchPOLine = SearchPOLine;
                //Return true if an existing line is updated
                function InsertOrUpdatePOLine(orderNumber, item, poDetails, params) {
                    var res = { lineUpdated: false, lineAdded: false, lineProcessed: null };
                    var line = null;
                    if (Lib.AP.SAP.PurchaseOrder.checkLineItems) {
                        line = Lib.AP.SAP.PurchaseOrder.SearchPOLine(orderNumber, item.Po_Item, item.Ref_Doc, item.Cond_Type);
                    }
                    if (!line) {
                        line = Lib.AP.SAP.PurchaseOrder.CreateNewPOLine(orderNumber, item, poDetails, params);
                        res.lineAdded = true;
                    }
                    if (line) {
                        var oldAmount = parseFloat(line.GetValue("ExpectedAmount__")) || 0;
                        var oldQtt = parseFloat(line.GetValue("ExpectedQuantity__")) || 0;
                        line.SetValue("OpenAmount__", item.refOpenInvoiceValue);
                        line.SetValue("OpenQuantity__", item.refOpenInvoiceQuantity);
                        line.SetValue("ExpectedAmount__", item.refExpectedAmount);
                        line.SetValue("ExpectedQuantity__", item.refExpectedQuantity);
                        line.SetValue("PriceCondition__", item.Cond_Type ? item.Cond_Type : "");
                        if (poDetails && poDetails.AccountAssignments) {
                            var acctAss = Lib.AP.SAP.PurchaseOrder.GetAccountAssignmentInfo(poDetails.AccountAssignments, item);
                            if (acctAss && acctAss.QUANTITY && acctAss.DISTR_PERC) {
                                var quantity = line.GetValue("ExpectedQuantity__") > 0 ? line.GetValue("ExpectedQuantity__") * acctAss.DISTR_PERC / 100 : "";
                                var amount = line.GetValue("ExpectedAmount__") > 0 ? line.GetValue("ExpectedAmount__") * acctAss.DISTR_PERC / 100 : "";
                                line.SetValue("Amount__", amount);
                                line.SetValue("Quantity__", quantity);
                            }
                        }
                        var newAmount = parseFloat(line.GetValue("ExpectedAmount__")) || 0;
                        var newQtt = parseFloat(line.GetValue("ExpectedQuantity__")) || 0;
                        res.lineUpdated = !res.lineAdded && (newAmount > oldAmount || newQtt > oldQtt);
                    }
                    if (Lib.AP.SAP.PurchaseOrder.checkLineItems || res.lineUpdated || res.lineAdded) {
                        res.lineProcessed = line;
                    }
                    return res;
                }
                PurchaseOrder.InsertOrUpdatePOLine = InsertOrUpdatePOLine;
                function FinalizeBapiParameters() {
                    if (g_BapiParameters) {
                        g_BapiParameters.Finalize();
                        g_BapiParameters = null;
                    }
                }
                PurchaseOrder.FinalizeBapiParameters = FinalizeBapiParameters;
                function GetBapiParameters() {
                    if (!g_BapiParameters || !g_BapiParameters.IsConnected()) {
                        g_BapiParameters = Lib.AP.SAP.PurchaseOrder.InitParameters();
                    }
                    return g_BapiParameters;
                }
                PurchaseOrder.GetBapiParameters = GetBapiParameters;
                function GetNewParameters(bapiController) {
                    return new PurchaseOrderParameters(bapiController);
                }
                PurchaseOrder.GetNewParameters = GetNewParameters;
                function InitParameters(bapiController) {
                    var params = Lib.AP.SAP.PurchaseOrder.GetNewParameters(bapiController);
                    var sapControl = null;
                    if (bapiController && bapiController.sapControl) {
                        sapControl = bapiController.sapControl;
                    }
                    else if (!Lib.AP.SAP.UsesWebServices()) {
                        sapControl = Sys.Helpers.SAP.GetSAPControl();
                    }
                    if (params && !params.Init(sapControl)) {
                        params.Finalize();
                        return null;
                    }
                    return params;
                }
                PurchaseOrder.InitParameters = InitParameters;
                function NewPOItemData(poNumber, poItem) {
                    return new Lib.AP.SAP.PurchaseOrder.POItemData(poNumber, poItem);
                }
                PurchaseOrder.NewPOItemData = NewPOItemData;
                function GetPONumberFromDeliveryNote(params, deliveryNote) {
                    if (!params) {
                        return null;
                    }
                    var poNumbers = [];
                    var results = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "ZESK_DELIV_NOTES", "EBELN", "XBLNR = '".concat(deliveryNote, "'"), 0, 0, false, { "useCache": false });
                    if (results) {
                        for (var i = 0; i < results.length; ++i) {
                            if (results[i].EBELN && poNumbers.indexOf(results[i].EBELN) < 0) {
                                poNumbers.push(results[i].EBELN);
                            }
                        }
                    }
                    return poNumbers;
                }
                PurchaseOrder.GetPONumberFromDeliveryNote = GetPONumberFromDeliveryNote;
                function GetPOInvoicingPlanNumbersAndReceivers(params, poNumber) {
                    if (!params) {
                        return null;
                    }
                    var invoicingPlanNumbers = "";
                    var receivers = {};
                    var results = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "EKPO", "FPLNR|EBELP|AFNAM", "EBELN = '".concat(poNumber, "'"), 0, 0, false, { "useCache": false });
                    if (results) {
                        for (var i = 0; i < results.length; ++i) {
                            // Plan numbers
                            if (Sys.Helpers.String.SAP.Trim(results[i].FPLNR) && results[i].EBELP) {
                                invoicingPlanNumbers += results[i].FPLNR + results[i].EBELP;
                            }
                            // Receivers
                            if (results[i].AFNAM && results[i].EBELP) {
                                receivers[results[i].EBELP] = results[i].AFNAM;
                            }
                        }
                    }
                    return {
                        invoicingPlanNumbers: invoicingPlanNumbers,
                        receivers: receivers
                    };
                }
                PurchaseOrder.GetPOInvoicingPlanNumbersAndReceivers = GetPOInvoicingPlanNumbersAndReceivers;
                function CacheIncludes(cachedParams, askedParams) {
                    for (var param in askedParams) {
                        if (Object.prototype.hasOwnProperty.call(askedParams, param) && askedParams[param] && !cachedParams[param]) {
                            // If we ask for param, but it is not in cache, we have to query for the missing part
                            return false;
                        }
                    }
                    return true;
                }
                PurchaseOrder.CacheIncludes = CacheIncludes;
                var externalCurrencyExchangeRate = {};
                function GetExternalCurrencyExchangeRate(bapiController, localCurrency, foreignCurrency, translationDate) {
                    var externalExchangeRate = 1;
                    var externalAmount = 10000;
                    var mapKey = "".concat(localCurrency, "_").concat(foreignCurrency, "_").concat(translationDate);
                    if (!localCurrency || !foreignCurrency || localCurrency === foreignCurrency) {
                        return externalExchangeRate;
                    }
                    else if (externalCurrencyExchangeRate[mapKey]) {
                        return externalCurrencyExchangeRate[mapKey];
                    }
                    var convResult = Lib.AP.SAP.ConvertToForeignCurrencyServer(bapiController, externalAmount, localCurrency, foreignCurrency, translationDate, 0, "M", true);
                    if (convResult) {
                        if (convResult.ExchangeRate < 0) {
                            externalExchangeRate = parseInt(convResult.LocalFactor, 10) / (Math.abs(convResult.ExchangeRate) * parseInt(convResult.ForeignFactor, 10));
                        }
                        else {
                            externalExchangeRate = parseInt(convResult.LocalFactor, 10) * convResult.ExchangeRate / parseInt(convResult.ForeignFactor, 10);
                        }
                    }
                    externalCurrencyExchangeRate[mapKey] = externalExchangeRate;
                    return externalCurrencyExchangeRate[mapKey];
                }
                PurchaseOrder.GetExternalCurrencyExchangeRate = GetExternalCurrencyExchangeRate;
                function ConvertItemAmounts(bapiController, item, exchangeRateDate, newCurrency) {
                    var update = false;
                    var exchangeRate = Lib.AP.SAP.PurchaseOrder.GetExternalCurrencyExchangeRate(bapiController, newCurrency, item.refCurrency, exchangeRateDate);
                    if (exchangeRate !== 1) {
                        item.refDeliveredAmount = Lib.AP.ApplyExchangeRate(item.refDeliveredAmount, exchangeRate, true);
                        item.refExpectedAmount = Lib.AP.ApplyExchangeRate(item.refExpectedAmount, exchangeRate, true);
                        item.refInvoicedAmount = Lib.AP.ApplyExchangeRate(item.refInvoicedAmount, exchangeRate, true);
                        item.refNetPrice = Lib.AP.ApplyExchangeRate(item.refNetPrice, exchangeRate, true);
                        item.refNetValue = Lib.AP.ApplyExchangeRate(item.refNetValue, exchangeRate, true);
                        item.refNondItax = Lib.AP.ApplyExchangeRate(item.refNondItax, exchangeRate, true);
                        item.refOpenGoodReceiptValue = Lib.AP.ApplyExchangeRate(item.refOpenGoodReceiptValue, exchangeRate, true);
                        item.refOpenInvoiceValue = Lib.AP.ApplyExchangeRate(item.refOpenInvoiceValue, exchangeRate, true);
                        item.refOrderedAmount = Lib.AP.ApplyExchangeRate(item.refOrderedAmount, exchangeRate, true);
                        item.refPriceUnit = Lib.AP.ApplyExchangeRate(item.refPriceUnit, exchangeRate, true);
                        update = true;
                    }
                    if (item.refCurrency !== newCurrency) {
                        item.refCurrency = newCurrency;
                        update = true;
                    }
                    return update;
                }
                PurchaseOrder.ConvertItemAmounts = ConvertItemAmounts;
                function ConvertPoAmounts(bapiController, poDetails, newCurrency) {
                    var update = false;
                    var exchangeRate = Lib.AP.SAP.PurchaseOrder.GetExternalCurrencyExchangeRate(bapiController, newCurrency, poDetails.refCurrency, poDetails.PO_HEADER.GetValue("DOC_DATE"));
                    if (exchangeRate !== 1) {
                        Log.Info("Invoice currency different from PO currency, converting amounts from PO to invoice currency.");
                        // Header amounts
                        poDetails.refDeliveredAmount = Lib.AP.ApplyExchangeRate(poDetails.refDeliveredAmount, exchangeRate, true);
                        poDetails.refInvoicedAmount = Lib.AP.ApplyExchangeRate(poDetails.refInvoicedAmount, exchangeRate, true);
                        poDetails.refOrderedAmount = Lib.AP.ApplyExchangeRate(poDetails.refOrderedAmount, exchangeRate, true);
                        poDetails.refPlannedDeliveryCostsAmount = Lib.AP.ApplyExchangeRate(poDetails.refPlannedDeliveryCostsAmount, exchangeRate, true);
                        update = true;
                    }
                    if (poDetails.refCurrency !== newCurrency) {
                        poDetails.refCurrency = newCurrency;
                        update = true;
                    }
                    // Items
                    Object.keys(poDetails.PO_ITEMS).forEach(function (key) {
                        var poItem = poDetails.PO_ITEMS[key];
                        update = Lib.AP.SAP.PurchaseOrder.ConvertItemAmounts(bapiController, poItem, poDetails.PO_HEADER.GetValue("DOC_DATE"), newCurrency) || update;
                    });
                    // Planned delivery costs
                    Object.keys(poDetails.PlannedDeliveryCosts).forEach(function (key) {
                        var pdc = poDetails.PlannedDeliveryCosts[key];
                        update = Lib.AP.SAP.PurchaseOrder.ConvertItemAmounts(bapiController, pdc, poDetails.PO_HEADER.GetValue("DOC_DATE"), newCurrency) || update;
                    });
                    return update;
                }
                PurchaseOrder.ConvertPoAmounts = ConvertPoAmounts;
                function GetDetails(params, poNumber, ignoreGRIV, itemByPo) {
                    var returnPO = null;
                    var updateCache = false;
                    if (params) {
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
                        var refCurrency = Data.GetValue("InvoiceCurrency__");
                        // First search in cache
                        if (poNumber in params.cachePODetails && Lib.AP.SAP.PurchaseOrder.CacheIncludes(params.cachePODetails[poNumber].config, config)) {
                            returnPO = params.cachePODetails[poNumber].po;
                        }
                        else if (Lib.AP.SAP.PurchaseOrder.GetPODetailsCall(params, poNumber, config)) {
                            returnPO = Lib.AP.SAP.PurchaseOrder.GetPODetailsFromBAPIResult(params, poNumber, ignoreGRIV, itemByPo, refCurrency);
                            updateCache = true;
                        }
                        if (returnPO) {
                            updateCache = Lib.AP.SAP.PurchaseOrder.ConvertPoAmounts(params.BapiController, returnPO, refCurrency) || updateCache;
                            // Fill cache
                            if (updateCache) {
                                params.cachePODetails[poNumber] = {
                                    "config": config,
                                    "po": returnPO
                                };
                            }
                        }
                    }
                    return returnPO;
                }
                PurchaseOrder.GetDetails = GetDetails;
                function GetPODetailsFromBAPIResult(params, poNumber, ignoreGRIV, itemByPo, refCurrency) {
                    var returnPO = null;
                    if (params) {
                        var itemDetails = void 0;
                        var imports = params.GetBapi("BAPI_PO_GETDETAIL").ImportsPool;
                        var tables = params.GetBapi("BAPI_PO_GETDETAIL").TablesPool;
                        returnPO = {
                            PO_HEADER: imports.Get("PO_HEADER"),
                            PO_ITEM_HISTORY: tables.Get("PO_ITEM_HISTORY"),
                            PO_ITEM_HISTORY_TOTALS: tables.Get("PO_ITEM_HISTORY_TOTALS"),
                            AccountAssignments: {},
                            PlannedDeliveryCosts: [],
                            // These are never used
                            PO_ADDRESS: imports.Get("PO_ADDRESS"),
                            EXTENSIONOUT: tables.Get("EXTENSIONOUT"),
                            PO_HEADER_TEXTS: tables.Get("PO_HEADER_TEXTS"),
                            PO_ITEM_CONFIRMATIONS: tables.Get("PO_ITEM_CONFIRMATIONS"),
                            PO_ITEM_CONTRACT_LIMITS: tables.Get("PO_ITEM_CONTRACT_LIMITS"),
                            PO_ITEM_LIMITS: tables.Get("PO_ITEM_LIMITS"),
                            PO_ITEM_SCHEDULES: tables.Get("PO_ITEM_SCHEDULES"),
                            PO_ITEM_SERVICES: tables.Get("PO_ITEM_SERVICES"),
                            PO_ITEM_SRV_ACCASS_VALUES: tables.Get("PO_ITEM_SRV_ACCASS_VALUES"),
                            PO_ITEM_TEXTS: tables.Get("PO_ITEM_TEXTS"),
                            PO_SERVICES_TEXTS: tables.Get("PO_SERVICES_TEXTS"),
                            sapForeignCurrency: refCurrency,
                            refCurrency: refCurrency,
                            refOrderedAmount: 0,
                            refDeliveredAmount: 0,
                            refInvoicedAmount: 0,
                            refPlannedDeliveryCostsAmount: 0
                        };
                        if (returnPO.PO_HEADER) {
                            returnPO.PO_HEADER.SetValue("VENDOR", Sys.Helpers.String.SAP.TrimLeadingZeroFromID(returnPO.PO_HEADER.GetValue("VENDOR")));
                            returnPO.sapForeignCurrency = returnPO.PO_HEADER.GetValue("CURRENCY") || refCurrency;
                        }
                        var acctAssignemnts = tables.Get("PO_ITEM_ACCOUNT_ASSIGNMENT");
                        for (var a = 0; a < acctAssignemnts.Count; a++) {
                            var acctAss = acctAssignemnts.Get(a);
                            var obj = {
                                PO_ITEM: acctAss.GetValue("PO_ITEM"),
                                G_L_ACCT: acctAss.GetValue("G_L_ACCT") ? Sys.Helpers.String.SAP.TrimLeadingZeroFromID(acctAss.GetValue("G_L_ACCT")) : "",
                                COST_CTR: acctAss.GetValue("COST_CTR") ? Sys.Helpers.String.SAP.TrimLeadingZeroFromID(acctAss.GetValue("COST_CTR")) : "",
                                ORDER_NO: acctAss.GetValue("ORDER_NO") ? Sys.Helpers.String.SAP.TrimLeadingZeroFromID(acctAss.GetValue("ORDER_NO")) : "",
                                BUS_AREA: acctAss.GetValue("BUS_AREA") || "",
                                WBS_ELEM_E: acctAss.GetValue("WBS_ELEM_E") || "",
                                QUANTITY: acctAss.GetValue("QUANTITY") || 0,
                                DISTR_PERC: acctAss.GetValue("DISTR_PERC") || null,
                                SERIAL_NO: acctAss.GetValue("SERIAL_NO") || "",
                                NETWORK: acctAss.GetValue("NETWORK") ? Sys.Helpers.String.SAP.TrimLeadingZeroFromID(acctAss.GetValue("NETWORK")) : "",
                                PROFIT_CTR: acctAss.GetValue("PROFIT_CTR") ? Sys.Helpers.String.SAP.TrimLeadingZeroFromID(acctAss.GetValue("PROFIT_CTR")) : "",
                                FUNC_AREA: acctAss.GetValue("FUNC_AREA") || "",
                                CO_AREA: acctAss.GetValue("CO_AREA") || ""
                            };
                            setCustomDimensions(acctAss, obj, "PO_ITEM_ACCOUNT_ASSIGNMENT", true);
                            if (!(obj.PO_ITEM in returnPO.AccountAssignments)) {
                                returnPO.AccountAssignments[obj.PO_ITEM] = [];
                            }
                            returnPO.AccountAssignments[obj.PO_ITEM].push(obj);
                        }
                        //Get Total History by item
                        var historyTotalsTable = {};
                        var poItemHistoryTotals = returnPO.PO_ITEM_HISTORY_TOTALS;
                        var length = poItemHistoryTotals.Count;
                        for (var i = 0; i < length; i++) {
                            var historyTotal = poItemHistoryTotals.Get(i);
                            if (historyTotal.GetValue("SERIAL_NO") === "00" && !historyTotalsTable[historyTotal.GetValue("PO_ITEM")]) {
                                historyTotalsTable[historyTotal.GetValue("PO_ITEM")] = historyTotal;
                            }
                        }
                        var ekpoResult = Lib.AP.SAP.PurchaseOrder.GetPOInvoicingPlanNumbersAndReceivers(params, poNumber);
                        returnPO.InvoicingPlanNumbers = ekpoResult.invoicingPlanNumbers;
                        returnPO.Receivers = ekpoResult.receivers;
                        returnPO.PO_ITEMS = {};
                        var poItems = tables.Get("PO_ITEMS");
                        var count = 0;
                        for (var idxPoItems = 0; idxPoItems < poItems.Count; idxPoItems++) {
                            var poItem = poItems.Get(idxPoItems);
                            // If GR-Based IV, check we received goods...
                            if (Sys.Helpers.String.SAP.Trim(poItem.GetValue("GR_BASEDIV")).length > 0 && !ignoreGRIV) {
                                count += Lib.AP.SAP.PurchaseOrder.DuplicatePoItemsDetailsByGoodsReceipt(params, poNumber, poItems, poItem, returnPO);
                            }
                            else {
                                itemDetails = Lib.AP.SAP.PurchaseOrder.GetPOItemDataDetails(params, poNumber, poItem, returnPO, historyTotalsTable);
                                if (!itemByPo || itemByPo[poNumber].indexOf(itemDetails.Po_Item) !== -1) {
                                    returnPO.PO_ITEMS[itemDetails.Po_Item] = itemDetails;
                                    returnPO.refOrderedAmount += itemDetails.refOrderedAmount;
                                    if (itemDetails.Quantity !== 0) {
                                        returnPO.refDeliveredAmount += itemDetails.refDeliveredAmount;
                                        returnPO.refInvoicedAmount += itemDetails.refInvoicedAmount;
                                    }
                                    if (itemDetails.ExpectedAmount !== 0) {
                                        count++;
                                    }
                                }
                            }
                            if (count >= params.maxItemsCountPerPO) {
                                Log.Info("Stop getting PO details because maxItemsCountPerPO has been reached (" + params.maxItemsCountPerPO + ")");
                                break;
                            }
                        }
                        if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("PlannedPricingConditions", "")) {
                            getPlannedDeliveryCosts(params.BapiController, returnPO, poNumber);
                        }
                    }
                    return returnPO;
                }
                PurchaseOrder.GetPODetailsFromBAPIResult = GetPODetailsFromBAPIResult;
                function getPlannedDeliveryCosts(bapiController, po, poNumber) {
                    function convertItemAmounts(item) {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            Lib.AP.SAP.PurchaseOrder.ConvertItemAmounts(bapiController, item, po.PO_HEADER.GetValue("DOC_DATE"), po.refCurrency);
                            resolve(item);
                        });
                    }
                    Lib.AP.SAP.PurchaseOrder.GetConditionTypeDescription().Then(function () { return Lib.AP.SAP.PurchaseOrder.GetDeliveryCostsForPO(poNumber, po, convertItemAmounts); });
                }
                function DuplicatePoItemsDetailsByGoodsReceipt(params, poNumber, poItems, poItem, returnPO) {
                    var purchaseItemHistorics = Lib.AP.SAP.PurchaseOrder.GetHistoricsPerPurchasingDocument(params, poNumber, poItem.GetValue("PO_ITEM"));
                    var itemDetails = Lib.AP.SAP.PurchaseOrder.GetPOItemDataDetailsPerGoodReceipt(params, poNumber, poItem, returnPO, purchaseItemHistorics, params.maxItemsCountPerPO / poItems.Count);
                    for (var i = 0; i < itemDetails.length; i++) {
                        returnPO.PO_ITEMS[itemDetails[i].Ref_Doc + itemDetails[i].Po_Item] = itemDetails[i];
                        returnPO.refOrderedAmount += itemDetails[i].refOrderedAmount;
                        if (itemDetails[i].Quantity !== 0) {
                            returnPO.refDeliveredAmount += itemDetails[i].refDeliveredAmount;
                            returnPO.refInvoicedAmount += itemDetails[i].refInvoicedAmount;
                        }
                    }
                    return itemDetails.length;
                }
                PurchaseOrder.DuplicatePoItemsDetailsByGoodsReceipt = DuplicatePoItemsDetailsByGoodsReceipt;
                // This option will be efficient only if PO do not have lot of goods receipts and invoices
                var EKBEcacheEnabled = false;
                function GetHistoricsPerPurchasingDocument(params, poNumber, itemNumber, refDoc, refDocIt, refDocYear) {
                    var historics = [];
                    var filter = "EBELN = '" + Sys.Helpers.String.SAP.NormalizeID(poNumber, 10) + "'";
                    if (!EKBEcacheEnabled) {
                        filter += " AND EBELP = '" + itemNumber + "'";
                    }
                    if (refDoc) {
                        filter += " AND LFBNR = '" + refDoc + "'\n";
                    }
                    if (refDocIt) {
                        filter += " AND LFPOS = '" + refDocIt + "'\n";
                    }
                    if (refDocYear) {
                        filter += " AND LFGJA = '" + refDocYear + "'";
                    }
                    var results;
                    if (EKBEcacheEnabled && Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter]) {
                        results = Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter];
                    }
                    else {
                        // reset cache (no need to keep previous PO caches)
                        Lib.AP.SAP.PurchaseOrder.cacheEKBE = {};
                        var fields = "EBELP|BWART|WEORA|ZEKKN|VGABE|BEWTP|MENGE|DMBTR|WRBTR|SHKZG|ELIKZ|XBLNR|LFGJA|LFBNR|LFPOS|REEWR|HSWAE|REFWR|WAERS";
                        var bapi = params.GetBapi("RFC_READ_TABLE");
                        results = Lib.AP.SAP.ReadSAPTable(bapi, "EKBE", fields, filter, 0, 0, false, { "useCache": false });
                        if (EKBEcacheEnabled) {
                            Lib.AP.SAP.PurchaseOrder.cacheEKBE[filter] = results;
                        }
                    }
                    if (results) {
                        for (var i = 0; i < results.length; ++i) {
                            var result = results[i];
                            var resultNumber = Sys.Helpers.String.SAP.Trim(result.EBELP);
                            if (resultNumber === itemNumber) {
                                var factor_for = Lib.AP.SAP.GetExternalCurrencyFactor(params, result.WAERS);
                                var factor_loc = Lib.AP.SAP.GetExternalCurrencyFactor(params, result.HSWAE);
                                var val_forcur = parseFloat(result.WRBTR) * factor_for;
                                var ivval_for = parseFloat(result.REFWR) * factor_for;
                                var val_loccur = parseFloat(result.DMBTR) * factor_loc;
                                var ivval_loc = parseFloat(result.REEWR) * factor_loc;
                                var poItemHistory = {
                                    PO_ITEM: resultNumber,
                                    MOVE_TYPE: Sys.Helpers.String.SAP.Trim(result.BWART),
                                    WEORA: Sys.Helpers.String.SAP.Trim(result.WEORA),
                                    SERIAL_NO: Sys.Helpers.String.SAP.Trim(result.ZEKKN),
                                    PROCESS_ID: Sys.Helpers.String.SAP.Trim(result.VGABE),
                                    HIST_TYPE: Sys.Helpers.String.SAP.Trim(result.BEWTP),
                                    QUANTITY: parseFloat(result.MENGE),
                                    VAL_LOCCUR: parseFloat(val_loccur.toFixed(4)),
                                    VAL_FORCUR: parseFloat(val_forcur.toFixed(4)),
                                    DB_CR_IND: Sys.Helpers.String.SAP.Trim(result.SHKZG),
                                    NO_MORE_GR: Sys.Helpers.String.SAP.Trim(result.ELIKZ),
                                    REF_DOC_NO: Sys.Helpers.String.SAP.Trim(result.XBLNR),
                                    REF_DOC_YR: Sys.Helpers.String.SAP.Trim(result.LFGJA),
                                    REF_DOC: Sys.Helpers.String.SAP.Trim(result.LFBNR),
                                    REF_DOC_IT: Sys.Helpers.String.SAP.Trim(result.LFPOS),
                                    IVVAL_LOC: parseFloat(ivval_loc.toFixed(4)),
                                    IVVAL_FOR: parseFloat(ivval_for.toFixed(4)),
                                    CURRENCY_LOC: Sys.Helpers.String.SAP.Trim(result.HSWAE),
                                    CURRENCY_FOR: Sys.Helpers.String.SAP.Trim(result.WAERS)
                                };
                                historics.push(poItemHistory);
                            }
                        }
                    }
                    return historics;
                }
                PurchaseOrder.GetHistoricsPerPurchasingDocument = GetHistoricsPerPurchasingDocument;
                function GetConfigValue(cfg, param) {
                    if (cfg && cfg[param]) {
                        return "X";
                    }
                    return " ";
                }
                PurchaseOrder.GetConfigValue = GetConfigValue;
                function GetPODetailsCall(params, poNumber, config) {
                    if (!poNumber || !params || !params.GetBapi("BAPI_PO_GETDETAIL")) {
                        Sys.Helpers.SAP.SetLastError("Bapi not initialized or invalid parameters");
                        return false;
                    }
                    var exports = params.GetBapi("BAPI_PO_GETDETAIL").ExportsPool;
                    exports.Set("PURCHASEORDER", Sys.Helpers.String.SAP.NormalizeID(poNumber, 10));
                    exports.Set("ACCOUNT_ASSIGNMENT", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Account_Assignment"));
                    exports.Set("CONFIRMATIONS", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Confirmations"));
                    exports.Set("EXTENSIONS", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Extensions"));
                    exports.Set("HEADER_TEXTS", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Header_Texts"));
                    exports.Set("HISTORY", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "History"));
                    exports.Set("ITEMS", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Items"));
                    exports.Set("ITEM_TEXTS", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Item_Texts"));
                    exports.Set("SCHEDULES", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Schedules"));
                    exports.Set("SERVICES", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Services"));
                    exports.Set("SERVICE_TEXTS", Lib.AP.SAP.PurchaseOrder.GetConfigValue(config, "Service_Texts"));
                    var exception = params.GetBapi("BAPI_PO_GETDETAIL").Call();
                    if (exception) {
                        Sys.Helpers.SAP.SetLastError(exception);
                    }
                    else {
                        var RETURN0 = params.GetTable("BAPI_PO_GETDETAIL", "RETURN");
                        if (!Sys.Helpers.SAP.ExtractErrors(RETURN0)) {
                            return true;
                        }
                    }
                    return false;
                }
                PurchaseOrder.GetPODetailsCall = GetPODetailsCall;
                function GetPOItemDataDetails(params, poNumber, sapPOItem, po, sapHistoryTotalsTable) {
                    var itemDetails = null;
                    if (params) {
                        itemDetails = new Lib.AP.SAP.PurchaseOrder.POItemData(poNumber, sapPOItem.GetValue("PO_ITEM"));
                        itemDetails.AcctAssCat = sapPOItem.GetValue("ACCTASSCAT");
                        itemDetails.Buyer = po.PO_HEADER.GetValue("CREATED_BY");
                        itemDetails.Conv_Den1 = sapPOItem.GetValue("CONV_DEN1");
                        itemDetails.Conv_Num1 = sapPOItem.GetValue("CONV_NUM1");
                        itemDetails.Del_Compl = Sys.Helpers.String.SAP.Trim(sapPOItem.GetValue("DEL_COMPL")).length > 0;
                        itemDetails.Delete_Ind = Sys.Helpers.String.SAP.Trim(sapPOItem.GetValue("DELETE_IND")).length > 0;
                        itemDetails.Diff_Inv = po.PO_HEADER.GetValue("DIFF_INV");
                        itemDetails.Distribution = sapPOItem.GetValue("DISTRIB");
                        itemDetails.Doc_Cat = po.PO_HEADER.GetValue("DOC_CAT");
                        itemDetails.Est_Price = Sys.Helpers.String.SAP.Trim(sapPOItem.GetValue("EST_PRICE")).length > 0;
                        itemDetails.Final_Inv = Sys.Helpers.String.SAP.Trim(sapPOItem.GetValue("FINAL_INV")).length > 0;
                        itemDetails.Gr_Basediv = Sys.Helpers.String.SAP.Trim(sapPOItem.GetValue("GR_BASEDIV")).length > 0;
                        itemDetails.Gr_Ind = Sys.Helpers.String.SAP.Trim(sapPOItem.GetValue("GR_IND")).length > 0;
                        itemDetails.Gr_Non_Val = Sys.Helpers.String.SAP.Trim(sapPOItem.GetValue("GR_NON_VAL")).length > 0;
                        itemDetails.InvoicingPlanNumbers = Lib.AP.SAP.PurchaseOrder.ExtractItemPlanNumber(sapPOItem.GetValue("PO_ITEM"), po.InvoicingPlanNumbers);
                        itemDetails.Ir_Ind = Sys.Helpers.String.SAP.Trim(sapPOItem.GetValue("IR_IND")).length > 0;
                        itemDetails.Item_Cat = sapPOItem.GetValue("ITEM_CAT");
                        itemDetails.Material = sapPOItem.GetValue("MATERIAL");
                        itemDetails.Net_Price = sapPOItem.GetValue("NET_PRICE");
                        itemDetails.Net_Value = sapPOItem.GetValue("NET_VALUE");
                        itemDetails.Nond_Itax = sapPOItem.GetValue("NOND_ITAX");
                        itemDetails.Orderpr_Un = sapPOItem.GetValue("ORDERPR_UN");
                        itemDetails.Po_Item = sapPOItem.GetValue("PO_ITEM");
                        itemDetails.Po_Number = sapPOItem.GetValue("PO_NUMBER");
                        itemDetails.Price_Unit = sapPOItem.GetValue("PRICE_UNIT");
                        itemDetails.Quantity = sapPOItem.GetValue("QUANTITY");
                        itemDetails.Receiver = po.Receivers[sapPOItem.GetValue("PO_ITEM")] || "";
                        itemDetails.Ref_Doc = "";
                        itemDetails.Ref_Doc_No = "";
                        itemDetails.Ret_Item = Sys.Helpers.String.SAP.Trim(sapPOItem.GetValue("RET_ITEM")).length > 0;
                        itemDetails.Short_Text = sapPOItem.GetValue("SHORT_TEXT");
                        itemDetails.Tax_Code = sapPOItem.GetValue("TAX_CODE");
                        itemDetails.Tax_Jur_Cd = sapPOItem.GetValue("TAX_JUR_CD");
                        itemDetails.Unit = sapPOItem.GetValue("UNIT");
                        itemDetails.ValidityPeriod_End = po.PO_HEADER.GetValue("VPER_END");
                        itemDetails.ValidityPeriod_Start = po.PO_HEADER.GetValue("VPER_START");
                        itemDetails.Vend_Mat = sapPOItem.GetValue("VEND_MAT");
                        itemDetails.Vendor = po.PO_HEADER.GetValue("VENDOR");
                        itemDetails.sapForeignCurrency = po.sapForeignCurrency;
                        itemDetails.refCurrency = itemDetails.sapForeignCurrency;
                        itemDetails.refNetPrice = itemDetails.Net_Price;
                        itemDetails.refPriceUnit = itemDetails.Price_Unit;
                        itemDetails.refNondItax = itemDetails.Nond_Itax;
                        itemDetails.refNetValue = itemDetails.Net_Value;
                        itemDetails.refOrderedAmount = 0;
                        itemDetails.refDeliveredAmount = 0;
                        itemDetails.refInvoicedAmount = 0;
                        setCustomDimensions(sapPOItem, itemDetails, "PO_ITEMS", false);
                        setCustomDimensions(po.PO_HEADER, itemDetails, "PO_HEADER", false);
                        setCustomDimensions(po.PO_ADDRESS, itemDetails, "PO_ADDRESS", false);
                        if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.TrimPartNumberLeadingZeros", itemDetails)) {
                            itemDetails.Material = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(sapPOItem.GetValue("MATERIAL"));
                        }
                        Lib.AP.SAP.PurchaseOrder.GetHistoryTotalsItemInfo(sapHistoryTotalsTable, itemDetails);
                        if (itemDetails.Gr_Non_Val) {
                            Lib.AP.SAP.PurchaseOrder.GetHistoryItemInfo(params, po.PO_HEADER, po.PO_ITEM_HISTORY, itemDetails);
                        }
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenValues(params, itemDetails);
                        Lib.AP.SAP.PurchaseOrder.ComputeExpectedValues(itemDetails);
                        Lib.AP.SAP.PurchaseOrder.ComputePassedValues(itemDetails);
                        Lib.AP.SAP.PurchaseOrder.ConvertItemAmounts(params.BapiController, itemDetails, po.PO_HEADER.GetValue("DOC_DATE"), po.refCurrency);
                    }
                    return itemDetails;
                }
                PurchaseOrder.GetPOItemDataDetails = GetPOItemDataDetails;
                function CloneObject(objToClone) {
                    var clone = {};
                    for (var att in objToClone) {
                        if (Object.prototype.hasOwnProperty.call(objToClone, att)) {
                            clone[att] = objToClone[att];
                        }
                    }
                    return clone;
                }
                PurchaseOrder.CloneObject = CloneObject;
                function GetPOItemDataDetailsPerGoodReceipt(params, poNumber, poItem, po, purchaseItemHistorics, maxCount) {
                    var items = [];
                    var refDoc = {};
                    var itemNumber = poItem.GetValue("PO_ITEM");
                    var baseItemDetails = Lib.AP.SAP.PurchaseOrder.GetPOItemDataDetails(params, poNumber, poItem, po);
                    var length = purchaseItemHistorics.length;
                    var options = {
                        bapiController: params.BapiController,
                        refCurrency: po.refCurrency,
                        exchangeRateDate: po.PO_HEADER.GetValue("DOC_DATE")
                    };
                    var i;
                    for (i = 0; i < length; i++) {
                        if (items.length >= maxCount) {
                            break;
                        }
                        var history = purchaseItemHistorics[i];
                        var historyKey = history.REF_DOC + "-" + history.REF_DOC_IT + "-" + history.REF_DOC_YR;
                        if (history.PO_ITEM === itemNumber && !Object.prototype.hasOwnProperty.call(refDoc, historyKey)) {
                            // Don't create several items for the same REF_DOC
                            refDoc[historyKey] = history;
                            // Create the default PoItemData (clone baseItemDetails to avoid multiple access to SAP Proxy)
                            var itemDetails = Lib.AP.SAP.PurchaseOrder.CloneObject(baseItemDetails);
                            if (itemDetails.Gr_Basediv) {
                                itemDetails.Del_Compl = history.NO_MORE_GR.length > 0;
                                itemDetails.Ref_Doc_No = history.REF_DOC_NO;
                                itemDetails.Ref_Doc = "".concat(history.REF_DOC, "-").concat(history.REF_DOC_IT, "-").concat(history.REF_DOC_YR);
                                // totals are expressed in invoice currency (options.refCurrency)
                                var totals = Lib.AP.SAP.PurchaseOrder.ComputeTotalsForGR(history, purchaseItemHistorics, itemDetails, options);
                                Lib.AP.SAP.PurchaseOrder.UpdateValuesOfGRItem(itemDetails, totals);
                            }
                            if (itemDetails.refExpectedAmount !== 0) {
                                items.push(itemDetails);
                            }
                        }
                    }
                    return items;
                }
                PurchaseOrder.GetPOItemDataDetailsPerGoodReceipt = GetPOItemDataDetailsPerGoodReceipt;
                function GetPoItemData(params, poNumber, itemNumber, ignoreGRIV, itemByPo) {
                    if (!params || !poNumber || !itemNumber) {
                        return null;
                    }
                    //First search in cache
                    var item = Lib.AP.SAP.PurchaseOrder.GetPoItemDataFromCache(params, poNumber, itemNumber);
                    if (item) {
                        return item;
                    }
                    //Query SAP, fill cache and return poItem from cache
                    Lib.AP.SAP.PurchaseOrder.GetDetails(params, poNumber, ignoreGRIV, itemByPo);
                    return Lib.AP.SAP.PurchaseOrder.GetPoItemDataFromCache(params, poNumber, itemNumber);
                }
                PurchaseOrder.GetPoItemData = GetPoItemData;
                function GetPoItemDataFromCache(params, poNumber, itemNumber) {
                    if (params.cachePODetails[poNumber]) {
                        var po = params.cachePODetails[poNumber].po;
                        if (po && po.PO_ITEMS && po.PO_ITEMS[itemNumber]) {
                            return po.PO_ITEMS[itemNumber];
                        }
                    }
                    return null;
                }
                PurchaseOrder.GetPoItemDataFromCache = GetPoItemDataFromCache;
                function GetGRForeignValue(item) {
                    var grFValue = item.Gr_Non_Val ? item.H_Val_Gr_For : item.Val_Gr_For;
                    if (isNaN(grFValue)) {
                        grFValue = 0;
                    }
                    return grFValue;
                }
                PurchaseOrder.GetGRForeignValue = GetGRForeignValue;
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
                function ComputeOpenInvoiceValuesForPlan(params, item) {
                    item.refOpenInvoiceQuantity = 0;
                    item.refOpenInvoiceValue = 0;
                    var scheduledValue = 0;
                    if (item.InvoicingPlanNumbers !== "$") {
                        var filter = "FPLNR = '" + item.InvoicingPlanNumbers + "' AND FAREG <> '4' AND FAREG <> '5'";
                        var results = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "FPLT", "FAKWR", filter, 0, 0, false, { "useCache": false });
                        if (results) {
                            for (var i = 0; i < results.length; i++) {
                                scheduledValue += parseFloat(Sys.Helpers.String.SAP.Trim(results[i].FAKWR));
                            }
                        }
                    }
                    if (scheduledValue >= item.Val_Iv_For && !item.Final_Inv) {
                        item.refOpenInvoiceQuantity = item.Val_Iv_For === 0 ? item.Quantity : 0;
                        item.refOpenInvoiceValue = scheduledValue - item.Val_Iv_For;
                    }
                }
                PurchaseOrder.ComputeOpenInvoiceValuesForPlan = ComputeOpenInvoiceValuesForPlan;
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
                function ComputeOpenValues(params, item) {
                    item.refOpenGoodReceiptQuantity = 0;
                    item.refOpenGoodReceiptValue = 0;
                    item.refOpenInvoiceQuantity = 0;
                    item.refOpenInvoiceValue = 0;
                    if (item.Doc_Cat === "K" || item.Doc_Cat === "A" || item.Quantity === 0 || item.Delete_Ind) {
                        return false;
                    }
                    if (!item.Del_Compl) {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenGRValues(item);
                    }
                    if (item.InvoicingPlanNumbers.length > 0) {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenInvoiceValuesForPlan(params, item);
                    }
                    else if (item.IsServiceItem() || (item.IsLimitItem() && item.refNetValue !== 0)) {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenInvoiceValuesForServiceOrLimit(item);
                    }
                    else {
                        Lib.AP.SAP.PurchaseOrder.ComputeOpenInvoiceValues(item);
                    }
                    return true;
                }
                PurchaseOrder.ComputeOpenValues = ComputeOpenValues;
                function GetAccountAssignmentInfo(accountAssignments, item) {
                    if (item.Po_Item in accountAssignments) {
                        return accountAssignments[item.Po_Item][0];
                    }
                    return null;
                }
                PurchaseOrder.GetAccountAssignmentInfo = GetAccountAssignmentInfo;
                function GetHistoryItemGRInfo(params, history, item) {
                    // Entry sheet number
                    var filter = "LBLNI = '" + history.GetValue("MAT_DOC") + "'";
                    var results = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "ESSR", "KZABN", filter, 1, 0, false, { "useCache": false });
                    if (results && results.length > 0 && Sys.Helpers.String.SAP.Trim(results[0].KZABN).length > 0) {
                        item.H_Val_Gr_Loc += history.GetValue("VAL_LOCCUR");
                        item.H_Val_Gr_For += history.GetValue("VAL_FORCUR");
                    }
                }
                PurchaseOrder.GetHistoryItemGRInfo = GetHistoryItemGRInfo;
                function GetHistoryItemInvoiceInfo(params, poHeader, history, item) {
                    if (params) {
                        var foreignHistoryAmount = history.GetValue("VAL_FORCUR");
                        var localeHistoryAmount = history.GetValue("VAL_LOCCUR");
                        // Conversion in purchase order currency
                        if (history.GetValue("CURRENCY") && item.refCurrency && history.GetValue("CURRENCY") !== item.refCurrency) {
                            foreignHistoryAmount = localeHistoryAmount;
                            var rate = 0;
                            // Indicator: Fixing of exchange rate?
                            if (poHeader.GetValue("EX_RATE_FX").length > 0) {
                                rate = poHeader.GetValue("EXCH_RATE");
                            }
                            var res = Lib.AP.SAP.ConvertToForeignCurrencyServer(params.BapiController, foreignHistoryAmount, history.GetValue("CURRENCY"), item.refCurrency, poHeader.GetValue("DOC_DATE"), rate, "M", true);
                            if (res) {
                                foreignHistoryAmount = res.ForeignAmount;
                            }
                        }
                        if (history.GetValue("DB_CR_IND") === "S") {
                            item.Val_Iv_For += foreignHistoryAmount;
                            item.Val_Iv_Loc += localeHistoryAmount;
                        }
                        else {
                            item.Val_Iv_For -= foreignHistoryAmount;
                            item.Val_Iv_Loc -= localeHistoryAmount;
                        }
                    }
                    else {
                        item.Val_Iv_For = 0;
                        item.Val_Iv_Loc = 0;
                    }
                }
                PurchaseOrder.GetHistoryItemInvoiceInfo = GetHistoryItemInvoiceInfo;
                function GetHistoryItemInfo(params, poHeader, histories, item) {
                    if (params) {
                        for (var i = 0; i < histories.Count; i++) {
                            var history = histories.Get(i);
                            if (history.GetValue("PO_ITEM") === item.Po_Item && history.GetValue("REF_DOC_NO") === item.REF_DOC_NO && history.GetValue("REF_DOC_YR") === item.REF_DOC_YR) {
                                // Service entry sheet
                                if (history.GetValue("PROCESS_ID") === "9") {
                                    Lib.AP.SAP.PurchaseOrder.GetHistoryItemGRInfo(params, history, item);
                                }
                                // Invoice Receipt || Subseq. Debit/Credit
                                if (history.GetValue("PROCESS_ID") === "2" || history.GetValue("PROCESS_ID") === "3") {
                                    Lib.AP.SAP.PurchaseOrder.GetHistoryItemInvoiceInfo(params, poHeader, history, item);
                                }
                            }
                        }
                    }
                }
                PurchaseOrder.GetHistoryItemInfo = GetHistoryItemInfo;
                function GetHistoryTotalsItemInfo(historyTotals, item) {
                    if (historyTotals) {
                        var historyTotal = historyTotals[item.Po_Item];
                        if (historyTotal && historyTotal.GetValue("SERIAL_NO") === "00") {
                            item.Iv_Qty = historyTotal.GetValue("IV_QTY");
                            item.Iv_Qty_Po = historyTotal.GetValue("IV_QTY_PO");
                            item.Deliv_Qty = historyTotal.GetValue("DELIV_QTY");
                            item.Val_Iv_For = historyTotal.GetValue("VAL_IV_FOR");
                            item.Val_Iv_Loc = historyTotal.GetValue("VAL_IV_LOC");
                            item.Ivval_Loc = historyTotal.GetValue("IVVAL_LOC");
                            item.Ivval_For = historyTotal.GetValue("IVVAL_FOR");
                            item.Val_Gr_Loc = historyTotal.GetValue("VAL_GR_LOC");
                            item.Val_Gr_For = historyTotal.GetValue("VAL_GR_FOR");
                        }
                    }
                }
                PurchaseOrder.GetHistoryTotalsItemInfo = GetHistoryTotalsItemInfo;
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
                /**
                 * Computes totals amounts and quantity for the goods reception. Amounts are expressed in the refCurrency specified in the options
                 * @memberof Lib.AP.SAP.PurchaseOrder
                 * @param {PurchaseOrderParameters} PurchaseOrderParameters parameteters for calling bapis
                 * @param {POItemHistory} purchaseItemHistory the current historic dealt with
                 * @param {POItemHistory[]} purchaseItemHistorics all retrieved historics for the current PO Item
                 * @param {POItemData} poItem the internal structure describing the PO Item
                 * @param {ComputeTotalsForGROptions} options options mainly for exchange rate computation
                 * @returns {TotalsForGR} totals amounts in specific currency and quantities to consider
                 */
                function ComputeTotalsForGR(purchaseItemHistory, purchaseItemHistorics, poItem, options) {
                    var totals = {
                        totalInvoicedAmount: 0,
                        totalInvoicedQty: 0,
                        totalDeliveredAmount: 0,
                        totalDeliveredQty: 0
                    };
                    var purchaseItemHistoryKey = purchaseItemHistory.PO_ITEM + purchaseItemHistory.REF_DOC +
                        purchaseItemHistory.REF_DOC_IT + purchaseItemHistory.REF_DOC_YR;
                    for (var idx = 0; idx < purchaseItemHistorics.length; idx++) {
                        var aPoItemHistory = purchaseItemHistorics[idx];
                        var historyKey = aPoItemHistory.PO_ITEM + aPoItemHistory.REF_DOC + aPoItemHistory.REF_DOC_IT + aPoItemHistory.REF_DOC_YR;
                        if (purchaseItemHistoryKey === historyKey) {
                            if (aPoItemHistory.PROCESS_ID === "1") {
                                Lib.AP.SAP.PurchaseOrder.ComputeTotalsOfGoodsReceipt(totals, aPoItemHistory, poItem, options);
                            }
                            else if (aPoItemHistory.PROCESS_ID === "2") {
                                Lib.AP.SAP.PurchaseOrder.ComputeTotalsOfInvoicesReceipt(totals, aPoItemHistory, options);
                            }
                        }
                    }
                    return totals;
                }
                PurchaseOrder.ComputeTotalsForGR = ComputeTotalsForGR;
                /**
                 * Computes totals amounts and quantity for reception. Amounts are expressed in the invoice currency passed as argument
                 * @memberof Lib.AP.SAP.PurchaseOrder
                 * @param {TotalsForGR} totals the structure containing the cumulated totals
                 * @param {POItemHistory} aPoItemHistory structure with a SAP PO Item history object
                 * @param {POItemData} poItem structure with the PO item informations (from SAP and Esker)
                 * @param {ComputeTotalsForGROptions} options
                 */
                function ComputeTotalsOfGoodsReceipt(totals, aPoItemHistory, poItem, options) {
                    // poItem ref* amounts are expressed in invoice currency
                    var itemQty = poItem.Quantity;
                    var itemNondItax = poItem.refNondItax;
                    var itemUnitPrice = poItem.refNetPrice;
                    var itemNetValue = poItem.refNetValue;
                    var poItemHistoryValue = aPoItemHistory.VAL_FORCUR;
                    // convert amount in invoice currency if needed.
                    var historyExchangeRate = Lib.AP.SAP.PurchaseOrder.GetExternalCurrencyExchangeRate(options.bapiController, options.refCurrency, aPoItemHistory.CURRENCY_FOR, options.exchangeRateDate);
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
                    if (itemQty > 0 && itemNondItax > 0) {
                        DeliveredAmount -= aPoItemHistory.QUANTITY * itemNondItax / itemQty;
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
                }
                PurchaseOrder.ComputeTotalsOfGoodsReceipt = ComputeTotalsOfGoodsReceipt;
                /**
                 * Computes totals amounts and quantity for invoicing. Amounts are expressed in the invoice currency passed as argument
                 * @memberof Lib.AP.SAP.PurchaseOrder
                 * @param {TotalsForGR} totals the structure containing the cumulated totals
                 * @param {POItemHistory} aPoItemHistory structure with a SAP PO Item history object
                 * @param {string} invoiceCurrency the reference currency to express totals amounts in
                 * @param { number } foreignExRate cpnversion rate from POItem foreign currency to invoice currency
                 */
                function ComputeTotalsOfInvoicesReceipt(totals, aPoItemHistory, options) {
                    var ivval = aPoItemHistory.IVVAL_FOR;
                    var exchangeRate = Lib.AP.SAP.PurchaseOrder.GetExternalCurrencyExchangeRate(options.bapiController, options.refCurrency, aPoItemHistory.CURRENCY_FOR, options.exchangeRateDate);
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
                }
                PurchaseOrder.ComputeTotalsOfInvoicesReceipt = ComputeTotalsOfInvoicesReceipt;
                function UpdateValuesOfGRItem(itemDetails, totals) {
                    itemDetails.refExpectedQuantity = totals.totalDeliveredQty - totals.totalInvoicedQty;
                    itemDetails.refExpectedAmount = totals.totalDeliveredAmount - totals.totalInvoicedAmount;
                    itemDetails.refOpenInvoiceQuantity = itemDetails.refExpectedQuantity;
                    itemDetails.refOpenInvoiceValue = itemDetails.refExpectedAmount;
                    itemDetails.Deliv_Qty = totals.totalDeliveredQty;
                    itemDetails.Iv_Qty = totals.totalInvoicedQty;
                }
                PurchaseOrder.UpdateValuesOfGRItem = UpdateValuesOfGRItem;
                function CheckGoodsReceipt() {
                    var orderNumbers = Lib.AP.GetOrderNumbersAsArray();
                    var params, poDetails, res;
                    var orderNumbersUpdated = [];
                    var deliveryNotes = [];
                    if (!Lib.AP.InvoiceType.isPOInvoice() || orderNumbers.length === 0) {
                        return null;
                    }
                    params = Lib.AP.SAP.PurchaseOrder.GetBapiParameters();
                    for (var i = 0; i < orderNumbers.length; i++) {
                        Log.Info("Checking for new goods receipt for order #" + orderNumbers[i] + " since " + Sys.Helpers.Date.Date2DBDateTime(Data.GetValue("LastSavedDateTime")));
                        poDetails = Lib.AP.SAP.PurchaseOrder.GetDetails(params, orderNumbers[i]);
                        res = Lib.AP.SAP.PurchaseOrder.FillLinesFromPO(orderNumbers[i], poDetails, null, true);
                        if (res.updatedLines > 0 || res.newLines > 0) {
                            orderNumbersUpdated.push(orderNumbers[i]);
                        }
                        Lib.AP.ClearUnprocessedLineItems(orderNumbers[i], res.linesProcessed);
                        if (deliveryNotes.length < 10) {
                            var orderNumberDeliveryNotes = Lib.AP.SAP.PurchaseOrder.getLastTenHistoryDeliveryNotes(Data.GetValue("LastSavedDateTime"), poDetails);
                            for (var j = 0; j < orderNumberDeliveryNotes.length; ++j) {
                                if (deliveryNotes.indexOf(orderNumberDeliveryNotes[j].deliveryNote) === -1) {
                                    deliveryNotes.push(orderNumberDeliveryNotes[j].deliveryNote);
                                    if (deliveryNotes.length === 10) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    Lib.AP.SAP.PurchaseOrder.FinalizeBapiParameters();
                    return {
                        orderNumbers: orderNumbersUpdated,
                        deliveryNotes: deliveryNotes
                    };
                }
                PurchaseOrder.CheckGoodsReceipt = CheckGoodsReceipt;
            })(PurchaseOrder = SAP.PurchaseOrder || (SAP.PurchaseOrder = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
