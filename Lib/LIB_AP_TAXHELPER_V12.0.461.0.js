///#GLOBALS DatabaseHelpers Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_TaxHelper_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "library: helpers for updating AP tables.",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Sys/Sys_Parameters",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var TaxHelper;
        (function (TaxHelper) {
            var taxList = {};
            function getTaxRateFromCache(taxCode, callback, item) {
                if (taxCode in taxList) {
                    callback(item, taxList[taxCode].taxRates, taxList[taxCode].nonDeductibleTaxRates, taxList[taxCode].roundingPriorities);
                }
                else {
                    callback(item, 0.0, []);
                }
            }
            function getTaxRateFromDb(taxCode, companyCode, invoiceCurrency, callback, item) {
                var splittedTaxCode = splitTaxCode(taxCode);
                var filter = "";
                if (splittedTaxCode.length > 1) {
                    for (var _i = 0, splittedTaxCode_1 = splittedTaxCode; _i < splittedTaxCode_1.length; _i++) {
                        var tc = splittedTaxCode_1[_i];
                        filter += "(TaxCode__=".concat(tc, ")");
                    }
                    filter = "|".concat(filter);
                }
                else {
                    filter = "TaxCode__=".concat(taxCode);
                }
                filter = filter.AddCompanyCodeFilter(companyCode);
                var setCacheAndApplyCallbackWithResult = function (results /*, err?: string*/) {
                    var taxRates = [];
                    var descriptions = [];
                    var roundingPriorities = [];
                    var nonDeductibleTaxRates = [];
                    for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                        var result = results_1[_i];
                        taxRates.push(parseFloat(result.TaxRate__));
                        descriptions.push(result.Description__);
                        roundingPriorities.push(result.TaxRoundingPriority__);
                        nonDeductibleTaxRates.push(parseFloat(result.NonDeductibleTaxRate__) || 0);
                    }
                    taxList[taxCode] = {
                        description: descriptions,
                        taxRates: taxRates,
                        roundingPriorities: roundingPriorities,
                        nonDeductibleTaxRates: nonDeductibleTaxRates
                    };
                    getTaxRateFromCache(taxCode, callback, item);
                };
                Sys.GenericAPI.Query("AP - Tax codes__", filter, ["TaxCode__", "TaxRate__", "Description__", "TaxRoundingPriority__", "NonDeductibleTaxRate__"], setCacheAndApplyCallbackWithResult, null, 100, { asAdmin: true });
            }
            function IsMultiTaxCode(taxCode) {
                var multiJurisdictionSeparator = getMultipleTaxesSeparator();
                if (useMultipleTaxes() &&
                    taxCode &&
                    typeof taxCode === "string" &&
                    taxCode
                        .replace("\\" + multiJurisdictionSeparator, "")
                        .replace(multiJurisdictionSeparator + multiJurisdictionSeparator, "")
                        .search(multiJurisdictionSeparator) !== -1) {
                    return true;
                }
                return false;
            }
            TaxHelper.IsMultiTaxCode = IsMultiTaxCode;
            function splitTaxCode(taxCode) {
                var taxCodes = [];
                if (IsMultiTaxCode(taxCode)) {
                    var multiJurisdictionSeparator = getMultipleTaxesSeparator();
                    var concatenedTaxCodes = taxCode;
                    var nextSeparatorOccurrence = concatenedTaxCodes.indexOf(multiJurisdictionSeparator);
                    var currentTaxCode = "";
                    while (nextSeparatorOccurrence > -1) {
                        if (nextSeparatorOccurrence === 0
                            || nextSeparatorOccurrence === concatenedTaxCodes.length - 1
                            || concatenedTaxCodes.charAt(nextSeparatorOccurrence - 1) === "\\"
                            || concatenedTaxCodes.charAt(nextSeparatorOccurrence + 1) === multiJurisdictionSeparator) {
                            currentTaxCode = currentTaxCode + concatenedTaxCodes.substring(0, nextSeparatorOccurrence + 1);
                        }
                        else {
                            currentTaxCode = currentTaxCode + concatenedTaxCodes.substring(0, nextSeparatorOccurrence);
                            taxCodes.push(currentTaxCode);
                            currentTaxCode = "";
                        }
                        concatenedTaxCodes = concatenedTaxCodes.substring(nextSeparatorOccurrence + 1);
                        nextSeparatorOccurrence = concatenedTaxCodes.indexOf(multiJurisdictionSeparator);
                    }
                    currentTaxCode = currentTaxCode + concatenedTaxCodes;
                    if (currentTaxCode.length > 0) {
                        taxCodes.push(currentTaxCode);
                    }
                }
                else {
                    taxCodes.push(taxCode);
                }
                return taxCodes;
            }
            TaxHelper.splitTaxCode = splitTaxCode;
            function getTaxRate(taxCode, taxJurisdiction, companyCode, invoiceCurrency, callback, item /*,
            params?: any*/) {
                if (taxCode) {
                    if (taxCode in taxList) {
                        getTaxRateFromCache(taxCode, callback, item);
                    }
                    else {
                        getTaxRateFromDb(taxCode, companyCode, invoiceCurrency, callback, item);
                    }
                }
                else {
                    callback(item, 0.0, []);
                }
            }
            TaxHelper.getTaxRate = getTaxRate;
            function computeTaxAmount(amount, taxRate, callback, item) {
                callback(item, Lib.AP.ApplyTaxRate(amount, taxRate, item !== undefined ? item.GetValue("MultiTaxRates__") : ""));
            }
            TaxHelper.computeTaxAmount = computeTaxAmount;
            function computeHeaderTaxAmount() {
                var calculateTax = Data.GetValue("CalculateTax__");
                var manualLink = Data.GetValue("ManualLink__");
                var taxamount = 0;
                var taxKey;
                var map = {};
                var tablineitems = Data.GetTable("LineItems__");
                var nLines = tablineitems.GetItemCount();
                for (var i = 0; i < nLines; i++) {
                    var item = tablineitems.GetItem(i);
                    if (calculateTax && !manualLink) {
                        // SAP method of calculation: sum up for each tax code, round, then sum.
                        var amount = item.GetValue("Amount__");
                        var taxCode = item.GetValue("TaxCode__");
                        var taxJurisdiction = item.GetValue("TaxJurisdiction__");
                        var taxRate = item.GetValue("TaxRate__");
                        var multiTaxRates = item.GetValue("MultiTaxRates__");
                        taxKey = taxCode + taxJurisdiction;
                        map[taxKey] = map[taxKey] || { amount: 0, sumRounded: 0, rate: taxRate, lineValues: [], multitaxrate: "" };
                        map[taxKey].amount += amount;
                        var taxAmt = Lib.AP.RoundWithAmountPrecision(Lib.AP.ApplyTaxRate(amount, taxRate, multiTaxRates));
                        item.SetValue("TaxAmount__", taxAmt);
                        item.SetWarning("TaxAmount__", "");
                        map[taxKey].sumRounded += taxAmt;
                        map[taxKey].lineValues.push({ "index": i, "taxAmount": taxAmt });
                        if (map[taxKey].multitaxrate === "") {
                            map[taxKey].multitaxrate = multiTaxRates;
                        }
                    }
                    else {
                        taxamount += item.GetValue("TaxAmount__");
                        item.SetWarning("TaxAmount__", "");
                    }
                }
                for (taxKey in map) {
                    if (map[taxKey] && map[taxKey].amount) {
                        var taxLineAmount = Lib.AP.ApplyTaxRate(map[taxKey].amount, map[taxKey].rate, map[taxKey].multitaxrate, true);
                        var roundedSum = Lib.AP.RoundWithAmountPrecision(taxLineAmount);
                        taxamount += roundedSum;
                        if (calculateTax && roundedSum !== map[taxKey].sumRounded) {
                            // Dispatch rounding error on first line for the current tax key
                            var firstLineValues = map[taxKey].lineValues[0];
                            var firstLineForTaxKey = tablineitems.GetItem(firstLineValues.index);
                            var fixedValue = Lib.AP.RoundWithAmountPrecision(firstLineValues.taxAmount + roundedSum - map[taxKey].sumRounded);
                            if (fixedValue !== firstLineValues.taxAmount) {
                                Log.Info("Adjusting tax amount on line #" + firstLineValues.index + " with tax code " + taxKey + " to match the computed header tax amount");
                                firstLineForTaxKey.SetWarning("TaxAmount__", "_tax amount rounded for balancing global tax amount");
                                firstLineForTaxKey.SetValue("TaxAmount__", fixedValue);
                            }
                        }
                    }
                }
                return taxamount;
            }
            TaxHelper.computeHeaderTaxAmount = computeHeaderTaxAmount;
            function getMultipleTaxesSeparator() {
                var customMultipleTaxesSeparator = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.CustomizeMultipleTaxesSeparator");
                if (customMultipleTaxesSeparator) {
                    return customMultipleTaxesSeparator;
                }
                return "/";
            }
            TaxHelper.getMultipleTaxesSeparator = getMultipleTaxesSeparator;
            function useMultipleTaxes() {
                if (Sys.Parameters.GetInstance("AP").GetParameter("MultiTaxesOnALineItem") === "1") {
                    var customUseMultipleTaxes = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SetInvoiceUseMultipleTaxes");
                    if (customUseMultipleTaxes != null) {
                        return customUseMultipleTaxes;
                    }
                    return true;
                }
                return false;
            }
            TaxHelper.useMultipleTaxes = useMultipleTaxes;
            function setTaxRate(item, taxRates, nonDeductibleTaxRates, roundingModes) {
                var taxRate = Array.isArray(taxRates) ? taxRates.reduce(function (acc, curr) { return acc + curr; }, 0) : taxRates;
                var nonDeductibletaxRate = Array.isArray(nonDeductibleTaxRates) ? nonDeductibleTaxRates.reduce(function (acc, curr) { return acc + curr; }, 0) : nonDeductibleTaxRates;
                item.SetValue("TaxRate__", taxRate);
                item.SetValue("NonDeductibleTaxRate__", nonDeductibletaxRate);
                var obj_ret = {
                    taxRates: taxRates,
                    taxRoundingModes: roundingModes
                };
                if (Array.isArray(nonDeductibleTaxRates) && nonDeductibleTaxRates.length > 0) {
                    obj_ret.nonDeductibleTaxRates = nonDeductibleTaxRates;
                }
                else if (typeof nonDeductibleTaxRates == "number" && nonDeductibleTaxRates != 0) {
                    obj_ret.nonDeductibleTaxRates = nonDeductibleTaxRates;
                }
                item.SetValue("MultiTaxRates__", JSON.stringify(obj_ret));
                var splittedTaxCode = splitTaxCode(item.GetValue("TaxCode__"));
                var roundingModesLength = roundingModes ? roundingModes.length : 0;
                if (splittedTaxCode.length > 1 && splittedTaxCode.length !== roundingModesLength) {
                    item.SetCategorizedError("TaxCode__", Lib.AP.TouchlessException.InvalidValue, "Field value does not belong to table!");
                    return taxRate;
                }
                var sameTaxRoundingModes = roundingModes && roundingModes.length > 1
                    ? roundingModes.every(function (mode) { return mode === roundingModes[0]; })
                    : true;
                item.SetWarning("TaxCode__", sameTaxRoundingModes ? "" : "_Tax codes are incompatible, tax rate might be wrong");
                return taxRate;
            }
            TaxHelper.setTaxRate = setTaxRate;
        })(TaxHelper = AP.TaxHelper || (AP.TaxHelper = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
