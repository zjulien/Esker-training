/* LIB_DEFINITION{
  "name": "Lib_AP_Reconciliation_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "AP Library",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_ERP_V12.0.461.0",
    "Sys/Sys_Helpers_ExtractTable",
    "[Lib_AP_SAP_TaxHelper_V12.0.461.0]",
    "[Lib_AP_TaxHelper_V12.0.461.0]",
    "[Lib_AP_Customization_Extraction]"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Reconciliation;
        (function (Reconciliation) {
            Reconciliation.ReconciliationType = {
                HeaderFooter: "HeaderFooter",
                LineItems: "LineItems"
            };
            function GetTaxHelper() {
                return Lib.ERP.IsSAP() ? Lib.AP.SAP.TaxHelper : Lib.AP.TaxHelper;
            }
            Reconciliation.GetTaxHelper = GetTaxHelper;
            function setTaxAmount(item, taxAmount) {
                item.SetValue("TaxAmount__", taxAmount);
            }
            Reconciliation.setTaxAmount = setTaxAmount;
            function fillLineItem(item) {
                Log.Warn("expected quantity : " + item.GetValue("ExpectedQuantity__"));
                if (item.GetValue("ExpectedQuantity__") !== 0) {
                    if (!item.GetValue("Quantity__")) {
                        item.SetValue("Quantity__", item.GetValue("ExpectedQuantity__"));
                    }
                    if (!item.GetValue("Amount__")) {
                        item.SetValue("Amount__", item.GetValue("ExpectedAmount__"));
                    }
                    Lib.AP.Reconciliation.GetTaxHelper().computeTaxAmount(item.GetValue("Amount__"), item.GetValue("TaxRate__"), Lib.AP.Reconciliation.setTaxAmount, item);
                    AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
                }
            }
            Reconciliation.fillLineItem = fillLineItem;
            function fillLinesItem(lineItems) {
                for (var j = 0; j < lineItems.GetItemCount(); j++) {
                    Lib.AP.Reconciliation.fillLineItem(lineItems.GetItem(j));
                }
            }
            Reconciliation.fillLinesItem = fillLinesItem;
            /**
             * Based on the HeaderFooterThreshold, this function determine the threshold value
             * based on the value or percentage sets in the parametr value
             * @param {number} totalExpectedAmount The sum of the extracted PO expected amounts. Only used
             * when the threshold is a percentage
             * @returns {number} The amount of the threshold
             */
            function getHeaderFooterThreshold(totalExpectedAmount) {
                var userExitValue = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.Reconciliation.GetHeaderFooterThreshold", totalExpectedAmount, Data.GetValue("InvoiceAmount__"));
                if (!Sys.Helpers.IsEmpty(userExitValue) && Sys.Helpers.IsNumeric(userExitValue)) {
                    return parseFloat(userExitValue);
                }
                var defaultValue = Sys.Helpers.IsNumeric(Variable.GetValueAsString("BalanceThreshold")) ? parseFloat(Variable.GetValueAsString("BalanceThreshold")) : 0.01;
                var currentValue = Sys.Parameters.GetInstance("AP").GetParameter("HeaderFooterThreshold", defaultValue.toString());
                // Determine if value or percentage
                if (Sys.Helpers.IsNumeric(currentValue)) {
                    return parseFloat(currentValue);
                }
                var percentageIndex = currentValue.indexOf("%");
                totalExpectedAmount = totalExpectedAmount || 0;
                if (percentageIndex !== -1) {
                    var extractedPercentage = currentValue.substr(0, percentageIndex).trim();
                    if (Sys.Helpers.IsNumeric(extractedPercentage)) {
                        return Math.abs(totalExpectedAmount * parseFloat(extractedPercentage) / 100);
                    }
                }
                return defaultValue;
            }
            Reconciliation.getHeaderFooterThreshold = getHeaderFooterThreshold;
            // PO Invoice
            // Pre fill the line items with the expected amounts and quantities if the invoice total matches the PO expected amounts perfectly
            function fillLinesWithPerfectMatch() {
                var sum = 0;
                var item;
                if (Data.GetValue("InvoiceAmount__")) {
                    var addTaxAmountToSum = function (it, taxAmount) {
                        sum += taxAmount;
                    };
                    var lineItems = Data.GetTable("LineItems__");
                    for (var i = 0; i < lineItems.GetItemCount(); i++) {
                        item = lineItems.GetItem(i);
                        sum += item.GetValue("ExpectedAmount__");
                        Lib.AP.Reconciliation.GetTaxHelper().computeTaxAmount(item.GetValue("ExpectedAmount__"), item.GetValue("TaxRate__"), addTaxAmountToSum, item);
                    }
                    var threshold = getHeaderFooterThreshold(sum);
                    if (Math.abs(Data.GetValue("InvoiceAmount__") - sum) <= threshold) {
                        Log.Info("The total Expected amount of the POs matches the extracted invoice amount. Fill lines with Expected quantities and amounts");
                        // Fill line items
                        Lib.AP.Reconciliation.fillLinesItem(lineItems);
                        Variable.SetValueAsString("ReconciledByHeader", "true");
                        return true;
                    }
                }
                return false;
            }
            Reconciliation.fillLinesWithPerfectMatch = fillLinesWithPerfectMatch;
            // PO Invoice
            // Pre fill the line items with the expected amounts and quantities even if the invoice total doesn't match the PO expected amounts perfectly
            function fillLinesWithoutPerfectMatch() {
                var lineItems = Data.GetTable("LineItems__");
                var lineCount = lineItems.GetItemCount();
                // Fill line items
                Lib.AP.Reconciliation.fillLinesItem(lineItems);
                if (lineCount > 0) {
                    Variable.SetValueAsString("ReconciledByHeader", "true");
                }
            }
            Reconciliation.fillLinesWithoutPerfectMatch = fillLinesWithoutPerfectMatch;
            function getReconciliationType() {
                var reconciliationTypeParam = Sys.Parameters.GetInstance("AP").GetParameter("ReconciliationType");
                // If parameter is set, use this value
                if (reconciliationTypeParam !== "") {
                    return reconciliationTypeParam;
                }
                // For compatibility reason for the older package, use the external variable value if set
                var extValue = Variable.GetValueAsString("Reconcile_HeaderFirst");
                if (!Sys.Helpers.IsEmpty(extValue)) {
                    return extValue.toLowerCase() === "true" ? Lib.AP.Reconciliation.ReconciliationType.HeaderFooter : Lib.AP.Reconciliation.ReconciliationType.LineItems;
                }
                //
                return Lib.AP.Reconciliation.ReconciliationType.HeaderFooter;
            }
            Reconciliation.getReconciliationType = getReconciliationType;
            function reconcileInvoice() {
                if (Variable.GetValueAsString("Mode") !== Lib.AP.CustomerInvoiceType.FlipPO && !Lib.AP.isActionAutoComplete()) {
                    var reconciliationType = getReconciliationType();
                    // if header first, try to reconcile on PO expected amounts and quantities if perfect matching on invoice amount,
                    // if failed or not in header first, try reconcile on extracted lines, then if failed fill lines with expected amounts and quantities
                    if ((reconciliationType === Lib.AP.Reconciliation.ReconciliationType.LineItems || !Lib.AP.Reconciliation.fillLinesWithPerfectMatch()) && !Lib.AP.Reconciliation.reconcile()) {
                        Lib.AP.Reconciliation.fillLinesWithoutPerfectMatch();
                    }
                }
                else {
                    Lib.AP.Reconciliation.reconcile();
                }
            }
            Reconciliation.reconcileInvoice = reconcileInvoice;
            /** ***************** **/
            /** RECONCILE HELPERS **/
            /** ***************** **/
            function highlightLineArea(lineItems, index) {
                var area = lineItems.GetArea(index);
                if (!area || area.width === 0 || area.height === 0) {
                    // The extraction script extracted the table
                    area = Sys.Helpers.ExtractTable.GetLineArea("ExtractedLineItems__", lineItems.GetItem(index));
                    if (area) {
                        area.Highlight(false);
                        area.Highlight(true, 0x333333, 0xFF0000);
                    }
                }
                else {
                    //The area is already highlighted in green by the teaching and cannot be unhighlighted.
                    //Thus the less ugly color for the new layer is 0xFF33FF (to obtain a grayish tint).
                    area.Highlight(true, 0xFF33FF, 0xFF0000);
                }
            }
            Reconciliation.highlightLineArea = highlightLineArea;
            function highlightUnreconciledLines(obj) {
                var startDate = new Date();
                Log.Info(">> Starting highlightUnreconciledLines...");
                var lineItems = Data.GetTable("ExtractedLineItems__");
                // The reconciled lines have been removed from obj.LinesExtracted, so all the remaining lines must be highlighted
                for (var i in obj.LinesExtracted) {
                    if (Object.prototype.hasOwnProperty.call(obj.LinesExtracted, i)) {
                        Lib.AP.Reconciliation.highlightLineArea(lineItems, obj.LinesExtracted[i].index);
                    }
                }
                var duration = new Date().getTime() - startDate.getTime();
                Log.Info("<< highlightUnreconciledLines finished (" + duration + "ms)");
            }
            Reconciliation.highlightUnreconciledLines = highlightUnreconciledLines;
            function readTableField(line, lineItem, fieldName, fieldsMapping, defaultValueFunc) {
                if (fieldsMapping[fieldName]) {
                    line[fieldName] = lineItem.GetValue(fieldsMapping[fieldName]);
                    if (!line[fieldName]) {
                        var dftValue = defaultValueFunc();
                        if (dftValue !== null) {
                            line[fieldName] = dftValue;
                        }
                    }
                }
            }
            function readTableLine(table, index, fieldsMapping) {
                var line = {};
                line.index = index;
                line.UnitPrice = NaN;
                var baseFieldsDefaultValues = {
                    "PONumber": function () {
                        return Lib.AP.GetFirstOrderNumber();
                    },
                    "DeliveryNote": function () {
                        return Data.GetValue("HeaderDNExtracted__");
                    },
                    "PartNumber": function () {
                        if (typeof line.PartNumber === "string") {
                            return line.PartNumber.replace(/\W+/g, "").toLowerCase();
                        }
                        return null;
                    },
                    "UnitPrice": function () {
                        if (fieldsMapping.Quantity && fieldsMapping.Amount) {
                            return Lib.P2P.ComputeUnitPrice(lineItem.GetValue(fieldsMapping.Amount), lineItem.GetValue(fieldsMapping.Quantity));
                        }
                        return null;
                    }
                };
                var lineItem = table.GetItem(index);
                for (var baseFld in baseFieldsDefaultValues) {
                    if (Object.prototype.hasOwnProperty.call(baseFieldsDefaultValues, baseFld)) {
                        readTableField(line, lineItem, baseFld, fieldsMapping, baseFieldsDefaultValues[baseFld]);
                    }
                }
                // Read any user exit fields
                for (var field in fieldsMapping) {
                    if (Object.prototype.hasOwnProperty.call(fieldsMapping, field) && typeof baseFieldsDefaultValues[field] === "undefined") {
                        line[field] = lineItem.GetValue(fieldsMapping[field]);
                    }
                }
                return line;
            }
            Reconciliation.readTableLine = readTableLine;
            function loadExtractedLines(obj, userExitMapEntries) {
                var extractedLineItems = Data.GetTable("ExtractedLineItems__");
                var map = {
                    PONumber: "OrderNumberExtracted__",
                    PartNumber: "PartNumberExtracted__",
                    UnitPrice: "UnitPriceExtracted__",
                    Quantity: "QuantityExtracted__",
                    Amount: "AmountExtracted__",
                    DeliveryNote: "DeliveryNoteExtracted__"
                };
                // Add user exit fields to map
                for (var _i = 0, userExitMapEntries_1 = userExitMapEntries; _i < userExitMapEntries_1.length; _i++) {
                    var additionalEntry = userExitMapEntries_1[_i];
                    if (!map[additionalEntry]) {
                        map[additionalEntry] = "".concat(additionalEntry, "Extracted__");
                    }
                }
                for (var i = 0; i < extractedLineItems.GetItemCount(); i++) {
                    obj.LinesExtracted[obj.LinesExtracted.length] = Lib.AP.Reconciliation.readTableLine(extractedLineItems, i, map);
                }
            }
            function loadPOLines(obj, userExitMapEntries) {
                if (obj.LinesExtracted.length > 0) {
                    var lineItems = Data.GetTable("LineItems__");
                    var map = { PONumber: "OrderNumber__", PartNumber: "PartNumber__", UnitPrice: "UnitPrice__", DeliveryNote: "DeliveryNote__" };
                    // Add user exit fields to map
                    for (var _i = 0, userExitMapEntries_2 = userExitMapEntries; _i < userExitMapEntries_2.length; _i++) {
                        var additionalEntry = userExitMapEntries_2[_i];
                        if (!map[additionalEntry]) {
                            map[additionalEntry] = additionalEntry === "Amount" || additionalEntry === "Quantity" ?
                                "Expected".concat(additionalEntry, "__") : "".concat(additionalEntry, "__");
                        }
                    }
                    for (var i = 0; i < lineItems.GetItemCount(); i++) {
                        obj.LinesFromPO.push(Lib.AP.Reconciliation.readTableLine(lineItems, i, map));
                    }
                }
            }
            function initializeReconcileObject() {
                var startDate = new Date();
                Log.Info(">> Starting initializeReconcileObject...");
                var obj = {};
                obj.LinesFromPO = [];
                obj.LinesExtracted = [];
                obj.LinesReconciled = [];
                obj.userExitAdditionalChecks = [];
                // Create list of keys and fields of user exit checked fields to be added to map
                var userExitKeyFieldComparers = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.Reconciliation.GetAdditionalReconciliationChecks") || [];
                var userExitMapEntries = [];
                obj.userExitAdditionalChecks = userExitKeyFieldComparers;
                for (var _i = 0, userExitKeyFieldComparers_1 = userExitKeyFieldComparers; _i < userExitKeyFieldComparers_1.length; _i++) {
                    var keyFieldComparer = userExitKeyFieldComparers_1[_i];
                    if (userExitMapEntries.indexOf(keyFieldComparer.key) === -1) {
                        userExitMapEntries.push(keyFieldComparer.key);
                    }
                    if (userExitMapEntries.indexOf(keyFieldComparer.field) === -1) {
                        userExitMapEntries.push(keyFieldComparer.field);
                    }
                }
                // Load extracted lines
                loadExtractedLines(obj, userExitMapEntries);
                // Load lines from PO
                loadPOLines(obj, userExitMapEntries);
                var duration = new Date().getTime() - startDate.getTime();
                Log.Info("<< initializeReconcileObject finished (" + duration + "ms)");
                return obj;
            }
            Reconciliation.initializeReconcileObject = initializeReconcileObject;
            function compareLines(line1, line2, key, field, compareFieldsCallback) {
                return line1[key] && line1[key] === line2[key] && compareFieldsCallback && compareFieldsCallback(line1[field], line2[field]) === 0;
            }
            Reconciliation.compareLines = compareLines;
            function reconcileMultipleGRs(matches, obj, i, nLinesExtracted, nLinesReconciled) {
                var setTaxAmountFromTaxRate = function (item, taxRate) {
                    if (item) {
                        Lib.AP.Reconciliation.GetTaxHelper().computeTaxAmount(item.GetValue("Amount__"), taxRate, Lib.AP.Reconciliation.setTaxAmount, item);
                    }
                    else {
                        Log.Warn("ReconcileMultipleGR: setTaxAmountFromTaxRate was passed null item");
                    }
                };
                var reconciled = false;
                var returnObj = {};
                if (matches.length > 1) {
                    Log.Info("Trying to reconcile with multiple GRs: ".concat(matches.length));
                    var totalQuantity = 0;
                    var lineItems = Data.GetTable("LineItems__");
                    var extractedLineItems = Data.GetTable("ExtractedLineItems__");
                    var extractedLineItem = extractedLineItems.GetItem(matches[0].LineExtractedIndex);
                    var extractedDeliveryNote = extractedLineItem.GetValue("DeliveryNoteExtracted__");
                    //Compute the total expected quantity
                    for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
                        var match = matches_1[_i];
                        var POitem = lineItems.GetItem(Number(match.LineFromPOIndex));
                        var PODeliveryNote = POitem.GetValue("DeliveryNote__");
                        if (!PODeliveryNote || !extractedDeliveryNote || PODeliveryNote === extractedDeliveryNote) {
                            totalQuantity += Number(POitem.GetValue("ExpectedQuantity__"));
                        }
                    }
                    //Total expected quantity = Quantity Extracted -> Reconcile
                    if (totalQuantity === extractedLineItem.GetValue("QuantityExtracted__")) {
                        for (var l = 0; l < matches.length; l++) {
                            obj.LinesFromPO.splice(matches[l].matchIdx - l, 1);
                            var lineItem = lineItems.GetItem(matches[l].LineFromPOIndex);
                            Log.Info("Reconcile line: ".concat(matches[l].LineFromPOIndex, " Ref: ").concat(lineItem.GetValue("PartNumber__"), " Exp Quant: ").concat(lineItem.GetValue("ExpectedQuantity__")));
                            //Fill the item amount/quantity field with the expected amount/quantity (UE needed?)
                            if (!lineItem.GetValue("Quantity__") || Lib.AP.isActionAutoComplete()) {
                                lineItem.SetValue("Quantity__", extractedLineItem.GetArea("QuantityExtracted__"), lineItem.GetValue("ExpectedQuantity__"));
                            }
                            if (!lineItem.GetValue("Amount__") || Lib.AP.isActionAutoComplete()) {
                                lineItem.SetValue("Amount__", extractedLineItem.GetArea("AmountExtracted__"), lineItem.GetValue("ExpectedAmount__"));
                            }
                            obj.LinesReconciled[obj.LinesReconciled.length] = matches[l];
                            if (Lib.AP.GetInvoiceDocument().IsMultiJurisdictionTaxCode(lineItem.GetValue("TaxCode__"), lineItem.GetValue("TaxRate__"))) {
                                setTaxAmountFromTaxRate(lineItem, lineItem.GetValue("TaxRate__"));
                            }
                            else {
                                Lib.AP.Reconciliation.GetTaxHelper().getTaxRate(lineItem.GetValue("TaxCode__"), lineItem.GetValue("TaxJurisdiction__"), Data.GetValue("CompanyCode__"), Data.GetValue("InvoiceCurrency__"), setTaxAmountFromTaxRate, lineItem);
                            }
                        }
                        reconciled = true;
                        obj.LinesExtracted.splice(i, 1);
                        i--;
                        nLinesExtracted--;
                        nLinesReconciled += matches.length;
                    }
                }
                returnObj = {
                    i: i,
                    nLinesExtracted: nLinesExtracted,
                    nLineReconciled: nLinesReconciled,
                    reconciled: reconciled
                };
                return returnObj;
            }
            Reconciliation.reconcileMultipleGRs = reconcileMultipleGRs;
            function reconcilePass(obj, passObj, compareFieldsCallback) {
                var startDate = new Date();
                Log.Info(">> reconcilePass on " + passObj.key + " with " + passObj.field + " starting (" + obj.LinesExtracted.length + " extracted line(s) to reconcile with " + obj.LinesFromPO.length + " line(s) from PO)");
                var nLineReconciled = 0;
                var nLinesExtracted = obj.LinesExtracted.length;
                for (var i = 0; i < nLinesExtracted; i++) {
                    var lineExtracted = obj.LinesExtracted[i];
                    var matches = [];
                    var matchIdx = -1;
                    var nLinesFromPO = obj.LinesFromPO.length;
                    for (var j = 0; j < nLinesFromPO; j++) {
                        var lineFromPO = obj.LinesFromPO[j];
                        if (Lib.AP.Reconciliation.compareLines(lineExtracted, lineFromPO, passObj.key, passObj.field, compareFieldsCallback)) {
                            matches[matches.length] = { LineExtractedIndex: obj.LinesExtracted[i].index, LineFromPOIndex: lineFromPO.index, matchIdx: j, reconciliationMethod: passObj };
                            matchIdx = j;
                        }
                    }
                    if (matches.length === 1) {
                        obj.LinesReconciled[obj.LinesReconciled.length] = matches[0];
                        // Remove reconciled lines for next loop and next pass
                        obj.LinesFromPO.splice(matchIdx, 1);
                        obj.LinesExtracted.splice(i, 1);
                        i--;
                        nLinesExtracted--;
                        nLineReconciled++;
                    }
                    else if (Sys.Parameters.GetInstance("AP").GetParameter("matchPOLineToMultipleGRs")) {
                        var res = Lib.AP.Reconciliation.reconcileMultipleGRs(matches, obj, i, nLinesExtracted, nLineReconciled);
                        if (res.reconciled) {
                            i = res.i;
                            nLinesExtracted = res.nLinesExtracted;
                            nLineReconciled = res.nLineReconciled;
                        }
                    }
                }
                var reconcilePassTime = new Date().getTime() - startDate.getTime();
                Log.Info("<< reconcilePass finished - " + nLineReconciled + " line(s) reconciled in " + reconcilePassTime + "ms");
                return obj;
            }
            Reconciliation.reconcilePass = reconcilePass;
            function setReconciledLines(obj) {
                var TaxHelper = Lib.AP.Reconciliation.GetTaxHelper();
                var startDate = new Date();
                Log.Info(">> Starting setReconciledLines...");
                var lineItems = Data.GetTable("LineItems__");
                var extractedLineItems = Data.GetTable("ExtractedLineItems__");
                var nLinesReconciled = obj.LinesReconciled.length;
                var setTaxRateAndTaxAmount = function (item, taxRates, nonDeductibleTaxRates, roundingModes) {
                    var taxRate = TaxHelper.setTaxRate(item, taxRates, nonDeductibleTaxRates, roundingModes);
                    TaxHelper.computeTaxAmount(item.GetValue("Amount__"), taxRate, Lib.AP.Reconciliation.setTaxAmount, item);
                };
                for (var i = 0; i < nLinesReconciled; i++) {
                    var lineReconciled = obj.LinesReconciled[i];
                    var lineItem = lineItems.GetItem(lineReconciled.LineFromPOIndex);
                    var extractedLineItem = extractedLineItems.GetItem(lineReconciled.LineExtractedIndex);
                    var haveReconciliationMethod = lineReconciled && lineReconciled.reconciliationMethod &&
                        lineReconciled.reconciliationMethod.field && lineReconciled.reconciliationMethod.key;
                    //Do not override user value except from autocomplete action (UE needed?)
                    if (!lineItem.GetValue("Quantity__") || Lib.AP.isActionAutoComplete()) {
                        lineItem.SetValue("Quantity__", extractedLineItem.GetArea("QuantityExtracted__") ? extractedLineItem.GetArea("QuantityExtracted__") : extractedLineItem.GetValue("QuantityExtracted__"));
                        if (haveReconciliationMethod) {
                            lineItem.SetComputedValueSource("Quantity__", Language.Translate("Line reconciled {0} {1}", false, lineReconciled.reconciliationMethod.field, lineReconciled.reconciliationMethod.key));
                        }
                    }
                    if (!lineItem.GetValue("Amount__") || Lib.AP.isActionAutoComplete()) {
                        lineItem.SetValue("Amount__", extractedLineItem.GetArea("AmountExtracted__") ? extractedLineItem.GetArea("AmountExtracted__") : extractedLineItem.GetValue("AmountExtracted__"));
                        if (haveReconciliationMethod) {
                            lineItem.SetComputedValueSource("Amount__", Language.Translate("Line reconciled {0} {1}", false, lineReconciled.reconciliationMethod.field, lineReconciled.reconciliationMethod.key));
                        }
                    }
                    TaxHelper.getTaxRate(lineItem.GetValue("TaxCode__"), lineItem.GetValue("TaxJurisdiction__"), Data.GetValue("CompanyCode__"), Data.GetValue("InvoiceCurrency__"), setTaxRateAndTaxAmount, lineItem);
                }
                var duration = new Date().getTime() - startDate.getTime();
                Log.Info("<< setReconciledLines finished (" + duration + "ms)");
            }
            Reconciliation.setReconciledLines = setReconciledLines;
            /* return true if one or more line are extracted */
            function reconcile() {
                var _unitPriceTolerance = parseFloat(Variable.GetValueAsString("Reconcile_UnitPriceTolerance"));
                if (isNaN(_unitPriceTolerance)) {
                    _unitPriceTolerance = 0.01;
                }
                function compareUnitPrice(unitPrice1, unitPrice2) {
                    if (isNaN(unitPrice1) || isNaN(unitPrice2)) {
                        return -1;
                    }
                    if (unitPrice1 === unitPrice2) {
                        return 0;
                    }
                    var tolerance = unitPrice1 * _unitPriceTolerance;
                    if (Math.abs(unitPrice2 - unitPrice1) < tolerance) {
                        return 0;
                    }
                    return -1;
                }
                function comparePartNumber(partNumber1, partNumber2) {
                    return partNumber1 && partNumber2 && partNumber1 === partNumber2 ? 0 : -1;
                }
                var startDate = new Date();
                Log.Info("Starting reconcile...");
                // Initialize reconcileObject
                var reconcileObject = Lib.AP.Reconciliation.initializeReconcileObject();
                if (reconcileObject.LinesExtracted.length > 0) {
                    // First pass check Delivery Note and Part Number
                    reconcileObject = Lib.AP.Reconciliation.reconcilePass(reconcileObject, { key: "DeliveryNote", field: "PartNumber" }, comparePartNumber);
                    // Second Pass check Delivery Note and Unit Price (with a tolerance) - if any remaining item to reconcile
                    if (reconcileObject.LinesExtracted.length > 0) {
                        reconcileObject = Lib.AP.Reconciliation.reconcilePass(reconcileObject, { key: "DeliveryNote", field: "UnitPrice" }, compareUnitPrice);
                    }
                    // Third pass check PO Number and Part Number
                    if (reconcileObject.LinesExtracted.length > 0) {
                        reconcileObject = Lib.AP.Reconciliation.reconcilePass(reconcileObject, { key: "PONumber", field: "PartNumber" }, comparePartNumber);
                    }
                    // Fourth Pass check PO Number and Unit Price (with a tolerance) - if any remaining item to reconcile
                    if (reconcileObject.LinesExtracted.length > 0) {
                        reconcileObject = Lib.AP.Reconciliation.reconcilePass(reconcileObject, { key: "PONumber", field: "UnitPrice" }, compareUnitPrice);
                    }
                    // Multiple passes for user exit checks
                    for (var _i = 0, _a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.Reconciliation.GetAdditionalReconciliationChecks") || []; _i < _a.length; _i++) {
                        var keyFieldComparer = _a[_i];
                        if (reconcileObject.LinesExtracted.length === 0) {
                            break;
                        }
                        reconcileObject = Lib.AP.Reconciliation.reconcilePass(reconcileObject, { key: keyFieldComparer.key, field: keyFieldComparer.field }, keyFieldComparer.comparer);
                    }
                    // Set reconciled values and areas in the line items table
                    Lib.AP.Reconciliation.setReconciledLines(reconcileObject);
                    Lib.AP.Reconciliation.highlightUnreconciledLines(reconcileObject);
                }
                var reconcileTime = new Date().getTime() - startDate.getTime();
                Log.Info("reconcile finished (" + reconcileTime + "ms)");
                return reconcileObject.LinesExtracted.length > 0 || reconcileObject.LinesReconciled.length > 0;
            }
            Reconciliation.reconcile = reconcile;
        })(Reconciliation = AP.Reconciliation || (AP.Reconciliation = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
