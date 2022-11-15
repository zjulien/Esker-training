///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_TaxHelper_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "library: SAP AP routines",
  "require": [
    "[Lib_AP_SAP_Client_V12.0.461.0]",
    "[Lib_AP_SAP_Server_V12.0.461.0]",
    "[Sys/Sys_Helpers_SAP]",
    "[Sys/Sys_Helpers_SAP_Client]",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var TaxHelper;
            (function (TaxHelper) {
                TaxHelper.taxList = {};
                TaxHelper.SAPTaxFromNetBapi = null;
                function getTaxRateFromSAP(taxCode, taxJurisdiction, companyCode, invoiceCurrency, params, callback, item) {
                    var result = null;
                    if (!Lib.AP.SAP.TaxHelper.SAPTaxFromNetBapi) {
                        Lib.AP.SAP.TaxHelper.SAPTaxFromNetBapi = Lib.AP.SAP.GetNewSAPTaxFromNetBapi();
                    }
                    if (Lib.AP.SAP.TaxHelper.SAPTaxFromNetBapi && ((params && params.IsConnected()) || Lib.AP.SAP.TaxHelper.SAPTaxFromNetBapi.SAPConfiguration)) {
                        try {
                            var optionalBapiManager = !Lib.AP.SAP.TaxHelper.SAPTaxFromNetBapi.SAPConfiguration ? params.BapiController.GetBapiManager() : null;
                            return Lib.AP.SAP.TaxHelper.SAPTaxFromNetBapi.GetTaxRateFromTaxCode(optionalBapiManager, companyCode, taxCode, taxJurisdiction, invoiceCurrency, callback, item);
                        }
                        catch (err) {
                            Sys.GenericAPI.LogError("SAP Request error " + taxCode + " : " + err);
                            params.BapiController.Finalize();
                            params.BapiController.Init(Lib.AP.SAP.UsesWebServices() ? null : Sys.Helpers.SAP.GetSAPControl());
                        }
                    }
                    if (callback) {
                        callback(item, result);
                    }
                    return result;
                }
                TaxHelper.getTaxRateFromSAP = getTaxRateFromSAP;
                function getTaxRate(taxCode, taxJurisdiction, companyCode, invoiceCurrency, callback, item, params) {
                    if (taxCode) {
                        if (taxCode in Lib.AP.SAP.TaxHelper.taxList) {
                            if (callback) {
                                callback(item, Lib.AP.SAP.TaxHelper.taxList[taxCode].rate, []);
                            }
                            return Lib.AP.SAP.TaxHelper.taxList[taxCode].rate;
                        }
                        // InitParameters not defined in client side
                        // eslint-disable-next-line dot-notation
                        if (!params && Lib.AP.SAP.PurchaseOrder["GetBapiParameters"]) {
                            // eslint-disable-next-line dot-notation
                            params = Lib.AP.SAP.PurchaseOrder["GetBapiParameters"]();
                        }
                        var setCacheTaxRate = function (it, taxRate) {
                            if (taxRate !== null) {
                                Lib.AP.SAP.TaxHelper.taxList[taxCode] = { rate: taxRate };
                                if (callback) {
                                    callback(it, taxRate, []);
                                }
                                return taxRate;
                            }
                            if (callback) {
                                callback(it, 0.0, []);
                            }
                            return 0.0;
                        };
                        return Lib.AP.SAP.TaxHelper.getTaxRateFromSAP(taxCode, taxJurisdiction, companyCode, invoiceCurrency, params, setCacheTaxRate, item);
                    }
                    if (callback) {
                        callback(item, 0.0, []);
                    }
                    return 0.0;
                }
                TaxHelper.getTaxRate = getTaxRate;
                function computeTaxAmount(amount, taxRate, callback, item) {
                    callback(item, Lib.AP.ApplyTaxRate(amount, taxRate, item !== undefined ? item.GetValue("MultiTaxRates__") : ""));
                }
                TaxHelper.computeTaxAmount = computeTaxAmount;
                function setTaxRate(item, taxRates, nonDeductibleTaxRates, roundingModes) {
                    var taxRate = Array.isArray(taxRates) ? taxRates.reduce(function (acc, curr) { return acc + curr; }, 0) : taxRates;
                    var nonDeductibletaxRate = Array.isArray(nonDeductibleTaxRates) ? nonDeductibleTaxRates.reduce(function (acc, curr) { return acc + curr; }, 0) : nonDeductibleTaxRates;
                    item.SetValue("TaxRate__", taxRate);
                    item.SetValue("NonDeductibleTaxRate__", nonDeductibletaxRate);
                    return taxRate;
                }
                TaxHelper.setTaxRate = setTaxRate;
            })(TaxHelper = SAP.TaxHelper || (SAP.TaxHelper = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
