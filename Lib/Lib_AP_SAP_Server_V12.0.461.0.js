/* eslint-disable class-methods-use-this */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_SERVER_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: SAP AP routines",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP",
    "Lib_AP_SAP_V12.0.461.0",
    "Lib_P2P_SAP_SOAP_SERVER_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var SAPTaxFromNetBapiServer = /** @class */ (function (_super) {
                __extends(SAPTaxFromNetBapiServer, _super);
                function SAPTaxFromNetBapiServer() {
                    var _this = _super.call(this) || this;
                    _this.bapiTaxFromNet = null;
                    return _this;
                }
                SAPTaxFromNetBapiServer.prototype.AddBapi = function (SAPBapiMgr) {
                    if (SAPBapiMgr && SAPBapiMgr.Connected) {
                        this.bapiTaxFromNet = SAPBapiMgr.Add("Z_ESK_CALCULATE_TAX_FRM_NET");
                        if (this.bapiTaxFromNet) {
                            this.SetLastError("");
                            return true;
                        }
                        this.SetLastError("Failed to add bapi (Z_Esk_Calculate_Tax_Frm_Net): " + SAPBapiMgr.GetLastError());
                    }
                    else {
                        this.SetLastError("Failed to connect to bapi manager");
                    }
                    return false;
                };
                SAPTaxFromNetBapiServer.prototype.Init = function (SAPBapiMgr, companyCode, taxCode, taxJurisdiction, currency, baseAmount) {
                    if (this.AddBapi(SAPBapiMgr)) {
                        this.bapiTaxFromNet.ExportsPool.SetValue("I_BUKRS", companyCode);
                        this.bapiTaxFromNet.ExportsPool.SetValue("I_MWSKZ", taxCode);
                        this.bapiTaxFromNet.ExportsPool.SetValue("I_PROTOKOLL", "");
                        this.bapiTaxFromNet.ExportsPool.SetValue("I_PRSDT", "");
                        this.bapiTaxFromNet.ExportsPool.SetValue("I_TXJCD", taxJurisdiction);
                        this.bapiTaxFromNet.ExportsPool.SetValue("I_WAERS", currency);
                        this.bapiTaxFromNet.ExportsPool.SetValue("I_WRBTR", baseAmount);
                        this.bapiTaxFromNet.ExportsPool.SetValue("I_ZBD1P", 0.0);
                        return true;
                    }
                    this.bapiTaxFromNet = null;
                    return false;
                };
                SAPTaxFromNetBapiServer.prototype.addAccDataParameters = function (item) {
                    var userExitResult = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.ShouldAddAccDataParameterForTaxComputation");
                    if (!Sys.Helpers.IsBoolean(userExitResult) || !userExitResult || !item) {
                        return;
                    }
                    var accData = SAP.GetDefaultTaxAccDataFromItem(item);
                    var accDataUserExit = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.GetAccDataParameterForTaxComputation", accData, item);
                    if (accDataUserExit) {
                        // Replace the structure by the one provided in the user exit
                        accData = accDataUserExit;
                    }
                    if (accData) {
                        var I_ACCDATA = this.bapiTaxFromNet.ExportsPool.Get("I_ACCDATA");
                        // tslint:disable-next-line: forin
                        for (var p in accData) {
                            if (Object.prototype.hasOwnProperty.call(accData, p)) {
                                I_ACCDATA.SetValue(p, accData[p]);
                            }
                        }
                    }
                };
                SAPTaxFromNetBapiServer.prototype.ReadResults = function (taxCode) {
                    if (this.bapiTaxFromNet) {
                        var taxAccounts = [];
                        // Read the BAPI results
                        var tables = this.bapiTaxFromNet.TablesPool;
                        var T_Mwdat = tables.Get("T_MWDAT");
                        // Return all the tax lines, not only one.
                        // Ex: Payables invoice with interstate tax on sales/purchases.
                        // Interstate tax is the responsibility of the person making the
                        // purchase and is not paid to the vendor.
                        for (var idx = 0; idx < T_Mwdat.Count; idx++) {
                            var aTaxAccount = void 0;
                            aTaxAccount = Lib.AP.SAP.GetNewSAPTaxAccount(T_Mwdat.Get(idx), taxCode);
                            taxAccounts.push(aTaxAccount);
                        }
                        return taxAccounts;
                    }
                    this.SetLastError("ReadResults shouldn't be call before Init");
                    return null;
                };
                SAPTaxFromNetBapiServer.prototype.GetTaxRateFromTaxCode = function (SAPBapiMgr, companyCode, taxCode, taxJurisdiction, currency, callback, item) {
                    if (this.Init(SAPBapiMgr, companyCode, taxCode, taxJurisdiction, currency, 1000.0)) {
                        this.addAccDataParameters(item);
                        var exceptionMessage = this.bapiTaxFromNet.Call();
                        if (!exceptionMessage) {
                            var jsonParams = JSON.parse(this.bapiTaxFromNet.GetJsonParameters(false));
                            if (callback) {
                                callback(item, jsonParams.IMPORTS.E_FWSTE / 10, 0);
                            }
                            return jsonParams.IMPORTS.E_FWSTE / 10;
                        }
                        this.SetLastError("An exception occured during bapi call (Z_Esk_Calculate_Tax_Frm_Net, taxcode :" + taxCode + "): " + exceptionMessage);
                    }
                    if (callback) {
                        callback(item, null, null);
                    }
                    return null;
                };
                SAPTaxFromNetBapiServer.prototype.Calculate = function (SAPBapiMgr, companyCode, taxCode, taxJurisdiction, currency, baseAmount) {
                    if (this.Init(SAPBapiMgr, companyCode, taxCode, taxJurisdiction, currency, baseAmount)) {
                        var exceptionMessage = this.bapiTaxFromNet.Call();
                        if (exceptionMessage === "") {
                            return this.ReadResults(taxCode);
                        }
                        this.SetLastError("An exception occured during bapi call (Z_Esk_Calculate_Tax_Frm_Net): " + exceptionMessage);
                    }
                    return null;
                };
                SAPTaxFromNetBapiServer.prototype.GetLastError = function () {
                    return this.lastError;
                };
                SAPTaxFromNetBapiServer.prototype.SetLastError = function (error) {
                    if (error) {
                        Log.Error(error);
                    }
                    this.lastError = error;
                };
                return SAPTaxFromNetBapiServer;
            }(SAP.SAPTaxFromNetBapi));
            var SAPParameters = /** @class */ (function () {
                function SAPParameters() {
                    this.BapiController = null;
                }
                SAPParameters.prototype.AddBapi = function (sapName, name) {
                    if (this.BapiController) {
                        var bapi_1 = null;
                        if (Lib.AP.SAP.UsesWebServices()) {
                            // Server side script is synchronous, no need to return a promise for AddBapi
                            Lib.P2P.SAP.Soap.IsBapiConfiguredWS(sapName, name)
                                .Then(function (isConfiguredWS) {
                                if (isConfiguredWS) {
                                    bapi_1 = Lib.AP.SAP.GetNewBapiWS(sapName, name);
                                }
                                else {
                                    Sys.Helpers.SAP.SetLastError("Bapis WS not configured : ".concat(sapName, " / ").concat(name || "no alias"));
                                }
                            });
                        }
                        else {
                            bapi_1 = Lib.AP.SAP.GetNewBapi(sapName, name);
                        }
                        this.BapiController.AddBapi(bapi_1);
                        return bapi_1;
                    }
                    return null;
                };
                SAPParameters.prototype.GetBapi = function (bapiName) {
                    if (this.BapiController) {
                        return this.BapiController.GetBapi(bapiName);
                    }
                    return null;
                };
                SAPParameters.prototype.GetTable = function (bapiName, name) {
                    if (this.BapiController) {
                        var bapi = this.BapiController.GetBapi(bapiName);
                        if (bapi && bapi.TablesPool) {
                            return bapi.TablesPool.Get(name);
                        }
                    }
                    return null;
                };
                SAPParameters.prototype.GetExport = function (bapiName, name) {
                    if (this.BapiController) {
                        var bapi = this.BapiController.GetBapi(bapiName);
                        if (bapi && bapi.ExportsPool) {
                            return bapi.ExportsPool.Get(name);
                        }
                    }
                    return null;
                };
                SAPParameters.prototype.GetImport = function (bapiName, name) {
                    if (this.BapiController) {
                        var bapi = this.BapiController.GetBapi(bapiName);
                        if (bapi && bapi.ImportsPool) {
                            return bapi.ImportsPool.Get(name);
                        }
                    }
                    return null;
                };
                SAPParameters.prototype.ResetParameters = function () {
                    if (this.BapiController) {
                        this.BapiController.ResetAllBapis();
                    }
                };
                SAPParameters.prototype.Finalize = function () {
                    this.ResetParameters();
                    if (this.BapiController) {
                        this.BapiController.Finalize();
                    }
                };
                return SAPParameters;
            }());
            SAP.SAPParameters = SAPParameters;
            function GetNewBapi(sapName, name) {
                return new SAP.BAPI(sapName, name);
            }
            SAP.GetNewBapi = GetNewBapi;
            function GetNewBapiWS(sapName, name) {
                return new Lib.P2P.SAP.Soap.Server.BAPIWS(sapName, name);
            }
            SAP.GetNewBapiWS = GetNewBapiWS;
            function GetNewSAPParameters() {
                return new SAPParameters();
            }
            SAP.GetNewSAPParameters = GetNewSAPParameters;
            function GetCompanyCodePeriod(bapiCompanyCodeGetPeriod, companyCode, postingDate) {
                if (bapiCompanyCodeGetPeriod) {
                    var exports = bapiCompanyCodeGetPeriod.ExportsPool;
                    exports.Set("COMPANYCODEID", companyCode);
                    exports.Set("POSTING_DATE", postingDate);
                    bapiCompanyCodeGetPeriod.UseCache = true;
                    var exception = bapiCompanyCodeGetPeriod.Call();
                    if (!exception) {
                        var imports = bapiCompanyCodeGetPeriod.ImportsPool;
                        return {
                            Fiscal_Period: imports.Get("FISCAL_PERIOD"),
                            Fiscal_Year: imports.Get("FISCAL_YEAR")
                        };
                    }
                    Sys.Helpers.SAP.SetLastError("GetCompanyCodePeriod failed: " + exception);
                }
                return null;
            }
            SAP.GetCompanyCodePeriod = GetCompanyCodePeriod;
            function GetCompanyCodeCurrency(rfcReadTableBapi, companyCode) {
                var T001Results = Lib.AP.SAP.ReadSAPTable(rfcReadTableBapi, "T001", "WAERS", "BUKRS = '".concat(companyCode, "'"), 1, 0, false, { "useCache": true });
                if (T001Results && T001Results.length > 0) {
                    return Sys.Helpers.String.SAP.Trim(T001Results[0].WAERS);
                }
                return "";
            }
            SAP.GetCompanyCodeCurrency = GetCompanyCodeCurrency;
            function UpdateGLCCDescriptions(item) {
                if (!item) {
                    return;
                }
                var account = item.GetValue("GLAccount__"), description;
                var bapiParams = Lib.AP.SAP.PurchaseOrder.GetBapiParameters();
                var companyCode = Lib.AP.GetLineItemCompanyCode(item);
                if (account && bapiParams) {
                    description = Lib.AP.SAP.GetGLAccountDescriptionServer(bapiParams.GetBapi("BAPI_GL_ACC_GETDETAIL"), companyCode, account);
                    item.SetValue("GLDescription__", description);
                }
                var costCenter = item.GetValue("CostCenter__");
                if (costCenter && bapiParams) {
                    description = Lib.AP.SAP.GetCostCenterDescription(bapiParams.GetBapi(Lib.P2P.SAP.Soap.GetBAPIName("RFC_READ_TABLE")), companyCode, costCenter);
                    item.SetValue("CCDescription__", description);
                }
            }
            SAP.UpdateGLCCDescriptions = UpdateGLCCDescriptions;
            function GetGLAccountDescriptionServer(bapiGLAccGetDetail, companyCode, accountNO) {
                var userISOLang = "EN";
                Lib.AP.SAP.SAPGetISOLanguage(function (sapLang) {
                    userISOLang = sapLang;
                }, Lib.AP.SAP.EDW_LANGUAGE);
                // Check in cache first
                if (!SAP.glDescriptionsCache[companyCode]) {
                    Lib.AP.SAP.InitGLDescriptionCacheFromLines(companyCode);
                }
                if (SAP.glDescriptionsCache[companyCode][accountNO]) {
                    return SAP.glDescriptionsCache[companyCode][accountNO];
                }
                // description not in cache, we have to query SAP
                var accountDescription = "";
                if (bapiGLAccGetDetail) {
                    var exports = bapiGLAccGetDetail.ExportsPool;
                    exports.Set("COMPANYCODE", companyCode);
                    exports.Set("GLACCT", Sys.Helpers.String.SAP.NormalizeID(accountNO, 10));
                    exports.Set("LANGUAGE_ISO", userISOLang);
                    exports.Set("TEXT_ONLY", "X");
                    bapiGLAccGetDetail.UseCache = true;
                    var exception = bapiGLAccGetDetail.Call();
                    if (!exception) {
                        var imports = bapiGLAccGetDetail.ImportsPool;
                        var accDetail = imports.Get("ACCOUNT_DETAIL");
                        var longText = accDetail.GetValue("LONG_TEXT");
                        if (longText) {
                            accountDescription = longText;
                        }
                        else {
                            accountDescription = accDetail.GetValue("SHORT_TEXT");
                        }
                    }
                    // Add result to cache
                    SAP.glDescriptionsCache[companyCode][accountNO] = accountDescription;
                }
                return accountDescription;
            }
            SAP.GetGLAccountDescriptionServer = GetGLAccountDescriptionServer;
            function getLangs() {
                var userSAPLang, userISOLang, SAPLang, ISOLang;
                var userLangCalback = function (lang) {
                    userSAPLang = lang;
                };
                var langCalback = function (lang) {
                    SAPLang = lang;
                };
                Lib.AP.SAP.SAPGetISOLanguage(function (isoLang) {
                    ISOLang = isoLang;
                    SAP.ConvertISOLangCodeToSAPLangCode(langCalback, isoLang);
                }, null);
                Lib.AP.SAP.SAPGetISOLanguage(function (isoLang) {
                    userISOLang = isoLang;
                    SAP.ConvertISOLangCodeToSAPLangCode(userLangCalback, isoLang);
                }, Lib.AP.SAP.EDW_LANGUAGE);
                return [userISOLang, userSAPLang, ISOLang, SAPLang];
            }
            function GetCostCenterDescription(rfcReadTableBapi, companyCode, costCenter) {
                var description = "";
                if ((Lib.AP.SAP.UsesWebServices() || rfcReadTableBapi) && companyCode && costCenter) {
                    var nowDate = Sys.Helpers.Date.Date2RfcReadTableDate(new Date());
                    var sprasFilter = "";
                    var _a = getLangs(), userISOLang = _a[0], userSAPLang = _a[1], connectionISOLang = _a[2], connectionSAPLang = _a[3];
                    if (connectionISOLang === userISOLang) {
                        sprasFilter = "(SPRAS = '".concat(connectionSAPLang, "') ");
                    }
                    else {
                        sprasFilter = "(SPRAS = '".concat(connectionSAPLang, "' OR SPRAS = '").concat(userSAPLang, "') ");
                    }
                    var normalizedCostCenter = Sys.Helpers.String.SAP.NormalizeID(costCenter, 10);
                    var filter = "BUKRS = '".concat(companyCode, "' AND KOST1 = '").concat(normalizedCostCenter, "' \n AND ").concat(sprasFilter, " \n AND DATAB <= '").concat(nowDate, "' AND DATBI >= '").concat(nowDate, "'");
                    var results = Lib.AP.SAP.ReadSAPTable(rfcReadTableBapi, "M_KOSTN", "MCTXT|SPRAS", filter, 2, 0, false, { "useCache": true });
                    if (results && results.length > 0) {
                        var idDescription = 0;
                        if (results.length === 2 && Sys.Helpers.String.SAP.Trim(results[1].SPRAS) === userSAPLang) {
                            idDescription = 1;
                        }
                        description = Sys.Helpers.String.SAP.Trim(results[idDescription].MCTXT);
                    }
                }
                return description;
            }
            SAP.GetCostCenterDescription = GetCostCenterDescription;
            function GetInvoicePaymentTerms(rfcReadTableBapi, invoiceRefNumber, itemLine) {
                var invPaymentTerms = null;
                if (rfcReadTableBapi && invoiceRefNumber && invoiceRefNumber.companyCode && invoiceRefNumber.documentNumber && invoiceRefNumber.fiscalYear) {
                    var filter = "BELNR = '" + invoiceRefNumber.documentNumber + "' AND GJAHR = '" + invoiceRefNumber.fiscalYear + "'\n";
                    filter += " AND BUZEI = '" + itemLine + "' AND BUKRS = '" + invoiceRefNumber.companyCode + "'";
                    var BSEGResults = Lib.AP.SAP.ReadSAPTable(rfcReadTableBapi, "BSEG", "ZFBDT|ZTERM|ZLSPR", filter, 1, 0, false, { "useCache": false });
                    if (BSEGResults) {
                        if (BSEGResults.length > 0) {
                            invPaymentTerms = {
                                baseLineDate: Sys.Helpers.String.SAP.Trim(BSEGResults[0].ZFBDT),
                                paymentTerms: Sys.Helpers.String.SAP.Trim(BSEGResults[0].ZTERM),
                                paymentBlock: Sys.Helpers.String.SAP.Trim(BSEGResults[0].ZLSPR)
                            };
                        }
                        else {
                            var docNotFound = invoiceRefNumber.documentNumber + " " + invoiceRefNumber.companyCode + " " + invoiceRefNumber.fiscalYear;
                            Sys.Helpers.SAP.SetLastError("GetInvoicePaymentTerms: Document not found in BSEG: " + docNotFound);
                        }
                    }
                }
                return invPaymentTerms;
            }
            SAP.GetInvoicePaymentTerms = GetInvoicePaymentTerms;
            /**
            * SAP ReadSAPTable call to retrieve Material description
            */
            function GetMaterialDescriptionServer(rfcReadTableBapi, material, language) {
                if (rfcReadTableBapi) {
                    var filter = "MATNR = '" + material + "' AND SPRAS = '" + language + "'";
                    var MATNRResults = Lib.AP.SAP.ReadSAPTable(rfcReadTableBapi, "MAKT", "MAKTX", filter, 1, 0, false, { "useCache": true });
                    if (MATNRResults && MATNRResults.length > 0) {
                        return Sys.Helpers.String.SAP.Trim(MATNRResults[0].MAKTX);
                    }
                }
                return "";
            }
            SAP.GetMaterialDescriptionServer = GetMaterialDescriptionServer;
            Lib.AP.SAP.GetNewSAPTaxFromNetBapi = function () {
                return new SAPTaxFromNetBapiServer();
            };
            function GetTaxFromNetServer(SAPBapiMgr, companyCode, taxCode, taxJurisdiction, itemNumberTax, currency, baseAmount) {
                if (taxCode && Sys.Helpers.String.SAP.Trim(taxCode).length > 0) {
                    var sapTaxFromNetBapi = new SAPTaxFromNetBapiServer();
                    var taxAccounts = sapTaxFromNetBapi.Calculate(SAPBapiMgr, companyCode, taxCode, taxJurisdiction, currency, baseAmount);
                    if (taxAccounts) {
                        return taxAccounts;
                    }
                    Sys.Helpers.SAP.SetLastError(sapTaxFromNetBapi.GetLastError());
                }
                else {
                    Sys.Helpers.SAP.SetLastError("GetTaxFromNet, 'taxCode' is a required parameter");
                }
                return null;
            }
            SAP.GetTaxFromNetServer = GetTaxFromNetServer;
            function GetTaxFromGrossServer() {
                // Not implemented yet
                return null;
            }
            SAP.GetTaxFromGrossServer = GetTaxFromGrossServer;
            function AlternativePayeeCheck(rfcReadTableBapi, vendorNumber, altPayee) {
                if (rfcReadTableBapi && vendorNumber && altPayee) {
                    var LFZAResults = Lib.AP.SAP.ReadSAPTable(rfcReadTableBapi, "LFZA", "EMPFK", "LIFNR = '".concat(vendorNumber, "'"), 0, 0, false, { "useCache": false });
                    if (LFZAResults) {
                        var payee = Sys.Helpers.String.SAP.NormalizeID(altPayee, 10);
                        for (var i = 0; i < LFZAResults.length; i++) {
                            if (payee === LFZAResults[i].EMPFK) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }
            SAP.AlternativePayeeCheck = AlternativePayeeCheck;
            /**
            * convert value to foreign currency
            * @param {object} bapiController
            * @param {number} value the value to be checked
            * @param {string} companyCode
            * @param {string} currencyKey local currency
            * @param {string} foreignCurrencyKey foreign currency
            * @param {string} translationDate date of translation to retrieve the ratio between local and foreign
            * @param {number} exchangeRate specific rate to apply on conversion
            * @param {string} typeOfRate Type of rate: M=Average rate G=Bank buying rate B=bank selling rate
            * @param {boolean} bUseExchangeRatesTable indicate if rate should be used from exchange rates table (TCURR)
            * @returns {number|null}
            */
            function ConvertToForeignCurrencyServer(bapiController, value, currencyKey, foreignCurrencyKey, translationDate, exchangeRate, typeOfRate, bUseExchangeRatesTable) {
                var bapiConvToForeignCurrency = bapiController.GetBapi("Z_ESK_CONV_TO_FOREIGN_CURRENCY");
                if (bapiConvToForeignCurrency) {
                    var sapClient_1 = null;
                    Lib.AP.SAP.GetSAPClient(bapiController.sapControl)
                        .Then(function (sapClientResult) {
                        sapClient_1 = sapClientResult;
                    });
                    var exports = bapiConvToForeignCurrency.ExportsPool;
                    exports.Set("CLIENT", sapClient_1);
                    exports.Set("DATE", translationDate);
                    exports.Set("FOREIGN_CURRENCY", foreignCurrencyKey);
                    exports.Set("LOCAL_AMOUNT", value);
                    exports.Set("LOCAL_CURRENCY", currencyKey);
                    exports.Set("RATE", exchangeRate);
                    exports.Set("READ_TCURR", bUseExchangeRatesTable ? "X" : "");
                    exports.Set("TYPE_OF_RATE", typeOfRate);
                    var exception = bapiConvToForeignCurrency.Call();
                    if (!exception) {
                        var imports = bapiConvToForeignCurrency.ImportsPool;
                        return {
                            "DerivedRateType": imports.GetValue("DERIVED_RATE_TYPE"),
                            "ExchangeRate": imports.GetValue("EXCHANGE_RATE"),
                            "FixedRate": imports.GetValue("FIXED_RATE"),
                            "ForeignAmount": imports.GetValue("FOREIGN_AMOUNT"),
                            "ForeignFactor": imports.GetValue("FOREIGN_FACTOR"),
                            "LocalFactor": imports.GetValue("LOCAL_FACTOR")
                        };
                    }
                    var text = bapiController.sapi18n("_Currency rate %1 / %2 rate type %3 for %4 not maintained in the system settings", [foreignCurrencyKey, currencyKey, "M", translationDate]);
                    Sys.Helpers.SAP.SetLastError(text);
                }
                return null;
            }
            SAP.ConvertToForeignCurrencyServer = ConvertToForeignCurrencyServer;
            function GetVendorDetailsFromSAP(sCompanyCode, sVendorNumber, sVendorName, sTaxID) {
                if (!Variable.GetValueAsString("SAPConfiguration")) {
                    // SAPConfiguration is initiated by ERPManager init,
                    // So we try to init ERPManager if not defined
                    Lib.P2P.InitSAPConfiguration("SAP", "AP");
                }
                var params = Lib.AP.SAP.PurchaseOrder.GetBapiParameters();
                if (!params) {
                    Log.Error("extractionscript externalQueryFunction - Failed to initialize BAPI parameters");
                    return;
                }
                var filter = "BUKRS = '" + sCompanyCode + "'";
                if (sVendorName) {
                    filter += " AND MCOD1 = '" + Lib.AP.SAP.escapeToSQL(sVendorName).toUpperCase() + "'";
                }
                else if (sVendorNumber) {
                    filter += " AND LIFNR = '" + Sys.Helpers.String.SAP.NormalizeID(Lib.AP.SAP.escapeToSQL(sVendorNumber), 10) + "'";
                }
                else if (sTaxID) {
                    filter += " AND STCEG = '" + Lib.AP.SAP.escapeToSQL(sTaxID) + "'";
                }
                var attributes = "NAME1|LIFNR|STRAS|PSTLZ|REGIO|LAND1|ORT01|ZTERM|QSSKZ";
                var customFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetVendorCustomFields");
                if (customFields) {
                    Sys.Helpers.Array.ForEach(customFields, function (field) {
                        if (field.nameInSAP) {
                            attributes += "|" + field.nameInSAP;
                        }
                    });
                }
                var results = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "ZESK_VENDORS", attributes, filter, 0, 0, false, { "useCache": false });
                if (!results) {
                    Log.Error("RFC_READ_TABLE BAPI call on ZESK_VENDORS error: " + Sys.Helpers.SAP.GetLastError());
                    Log.Error("You might need to install the latest view definition on your SAP server");
                }
                else {
                    Lib.AP.SAP.FillVendorDetailsFromSAPResult(results);
                }
            }
            SAP.GetVendorDetailsFromSAP = GetVendorDetailsFromSAP;
            function FillVendorDetailsFromSAPResult(results) {
                if (results && results.length > 0) {
                    var item_1 = results[0];
                    Data.SetValue("VendorNumber__", Sys.Helpers.String.SAP.TrimLeadingZeroFromID(item_1.LIFNR));
                    Data.SetValue("VendorName__", Sys.Helpers.String.SAP.Trim(item_1.NAME1));
                    Data.SetValue("VendorStreet__", Sys.Helpers.String.SAP.Trim(item_1.STRAS));
                    Data.SetValue("VendorCity__", Sys.Helpers.String.SAP.Trim(item_1.ORT01));
                    Data.SetValue("VendorZipCode__", Sys.Helpers.String.SAP.Trim(item_1.PSTLZ));
                    Data.SetValue("VendorRegion__", Sys.Helpers.String.SAP.Trim(item_1.REGIO));
                    Data.SetValue("VendorCountry__", Sys.Helpers.String.SAP.Trim(item_1.LAND1));
                    Data.SetValue("PaymentTerms__", Sys.Helpers.String.SAP.Trim(item_1.ZTERM));
                    if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("TaxesWithholdingTax", "") === "Basic") {
                        Data.SetValue("WithholdingTax__", Sys.Helpers.String.SAP.Trim(item_1.QSSKZ));
                    }
                    else if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("TaxesWithholdingTax", "") === "Extended") {
                        Lib.AP.GetInvoiceDocument().GetExtendedWithholdingTax(item_1.LIFNR);
                    }
                    var customFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetVendorCustomFields");
                    if (customFields) {
                        Sys.Helpers.Array.ForEach(customFields, function (field) {
                            if (field.nameInSAP) {
                                Data.SetValue(field.nameInForm, Sys.Helpers.String.SAP.Trim(item_1[field.nameInSAP]));
                            }
                        });
                    }
                    Lib.AP.Extraction.FillVendorContactEmail();
                }
            }
            SAP.FillVendorDetailsFromSAPResult = FillVendorDetailsFromSAPResult;
            function GetDuplicateFIInvoice(params, duplicateCandidates, companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDate, invoiceCurrency, normalizedInvoiceAmount) {
                var filter = Lib.AP.SAP.GetDuplicateFIInvoiceFilter(companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDate, invoiceCurrency, normalizedInvoiceAmount);
                if (!Lib.AP.InvoiceType.isPOInvoice() || (normalizedInvoiceNumber && normalizedInvoiceAmount)) {
                    // First we get all duplicate FI invoices
                    var result = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "BSIP", "BELNR|BUKRS|GJAHR", filter, 0, 0, false, { "useCache": false });
                    if (result && result.length > 0) {
                        // Then we filter to get only duplicate FI invoices which are not reversed
                        filter = Lib.AP.SAP.GetDuplicateFIInvoiceNotReversedFilter(result, companyCode, normalizedInvoiceNumber, normalizedInvoiceDate, invoiceCurrency);
                        var resultBkpf = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "BKPF", "BELNR|BUKRS|GJAHR|AWKEY", filter, 0, 0, false, { "useCache": false });
                        if (resultBkpf && resultBkpf.length > 0) {
                            // Then we get the duplicated MM invoices which are reversed and match the list of duplicate FI invoices which are not reversed
                            filter = Lib.AP.SAP.GetDuplicateReversedMMInvoicesFilter(resultBkpf, companyCode);
                            if (filter) {
                                var resultRbkp = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "RBKP", "BELNR|BUKRS|GJAHR", filter, 0, 0, false, { "useCache": false });
                                // And we filter the list of FI invoices to remove the ones matching a reversed MM invoice (because it means the FI invoice is reversed too)
                                if (resultRbkp && resultRbkp.length > 0) {
                                    Lib.AP.SAP.FilterResultsOnAWKEY(resultBkpf, resultRbkp);
                                }
                            }
                            Lib.AP.SAP.AddDuplicateCandidates(resultBkpf, duplicateCandidates);
                        }
                    }
                }
            }
            SAP.GetDuplicateFIInvoice = GetDuplicateFIInvoice;
            function GetDuplicateMMInvoice(params, duplicateCandidates, companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDate, invoiceCurrency, normalizedInvoiceAmount) {
                var filter = Lib.AP.SAP.GetDuplicateMMInvoiceFilter(companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDate, invoiceCurrency, normalizedInvoiceAmount);
                if (!Lib.AP.InvoiceType.isPOInvoice() || (normalizedInvoiceNumber && normalizedInvoiceAmount)) {
                    var result = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "RBKP", "BELNR|BUKRS|GJAHR", filter, 0, 0, false, { "useCache": false });
                    Lib.AP.SAP.AddDuplicateCandidates(result, duplicateCandidates);
                }
            }
            SAP.GetDuplicateMMInvoice = GetDuplicateMMInvoice;
            function GetDuplicateFIParkedInvoice(params, duplicateCandidates, companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDate, invoiceCurrency) {
                // use inv # if it exists, otherwise do not run query
                if (normalizedInvoiceNumber) {
                    var filter = "BUKRS = '" + companyCode + "'";
                    filter += "\n AND BSTAT = 'V'";
                    filter += "\n AND BLDAT = '" + normalizedInvoiceDate + "'";
                    filter += "\n AND WAERS = '" + invoiceCurrency + "'";
                    filter += "\n AND XBLNR = '" + normalizedInvoiceNumber + "'";
                    var resultVBKPF = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "VBKPF", "WAERS|BELNR|BUKRS|GJAHR", filter, 0, 0, false, { "useCache": false });
                    if (resultVBKPF && resultVBKPF.length > 0) {
                        filter = Lib.AP.SAP.GetDuplicateFIparkedInvoiceFilter(resultVBKPF, companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDate);
                        var resultVBSEGK = Lib.AP.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "VBSEGK", "BELNR|BUKRS|GJAHR", filter, 0, 0, false, { "useCache": false });
                        Lib.AP.SAP.AddDuplicateCandidates(resultVBSEGK, duplicateCandidates);
                    }
                }
            }
            SAP.GetDuplicateFIParkedInvoice = GetDuplicateFIParkedInvoice;
            function GetDuplicateInvoiceServer(companyCode, invoiceType, invoiceNumber, vendorNumber, invoiceDate, invoiceAmount, invoiceCurrency) {
                var duplicateCandidates = [];
                if (companyCode && vendorNumber && invoiceDate && (invoiceAmount || invoiceNumber) && invoiceCurrency && invoiceType) {
                    var normalizedVendorNumber = Sys.Helpers.String.SAP.NormalizeID(vendorNumber, 10);
                    var normalizedInvoiceNumber = invoiceNumber ? Lib.AP.SAP.escapeToSQL(invoiceNumber.toUpperCase().substr(0, 16)) : null;
                    var normalizedInvoiceDateBAPI = Sys.Helpers.SAP.FormatToSAPDateTimeFormat(invoiceDate);
                    var normalizedInvoiceAmount = invoiceAmount ? invoiceAmount.toFixed(2) : null;
                    var params = Lib.AP.SAP.Invoice.Post.InitParameters(Lib.AP.SAP.UsesWebServices() ? null : Sys.Helpers.SAP.GetSAPControl());
                    if (params) {
                        // 1- Search in posted documents (FI)
                        Lib.AP.SAP.GetDuplicateFIInvoice(params, duplicateCandidates, companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDateBAPI, invoiceCurrency, normalizedInvoiceAmount);
                        // 2- Search for invoice receipts documents (MM)
                        Lib.AP.SAP.GetDuplicateMMInvoice(params, duplicateCandidates, companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDateBAPI, invoiceCurrency, normalizedInvoiceAmount);
                        // 3 - Search for parked documents (FI)
                        Lib.AP.SAP.GetDuplicateFIParkedInvoice(params, duplicateCandidates, companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDateBAPI, invoiceCurrency);
                    }
                }
                return duplicateCandidates;
            }
            SAP.GetDuplicateInvoiceServer = GetDuplicateInvoiceServer;
            SAP.externalCurrencyFactors = {};
            function GetExternalCurrencyFactor(params, currency) {
                if (!Lib.AP.SAP.externalCurrencyFactors[currency]) {
                    Lib.AP.SAP.externalCurrencyFactors[currency] = 1;
                    var customExternalFactors = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAPCurrenciesExternalFactors");
                    if (customExternalFactors && customExternalFactors[currency]) {
                        Lib.AP.SAP.externalCurrencyFactors[currency] = customExternalFactors[currency];
                    }
                    else if (params && params.GetBapi("RFC_READ_TABLE")) {
                        //Query table TCURX
                        var bapi = params.GetBapi("RFC_READ_TABLE");
                        var filter = "CURRKEY = '".concat(currency, "'");
                        var result = Lib.AP.SAP.ReadSAPTable(bapi, "TCURX", "CURRDEC", filter, 1, 0, false);
                        if (result && result.length > 0) {
                            var nbDecimals = Sys.Helpers.String.SAP.Trim(result[0].CURRDEC);
                            Lib.AP.SAP.externalCurrencyFactors[currency] = Sys.Helpers.String.SAP.ConvertDecimalToExternalFactor(nbDecimals);
                        }
                    }
                    else {
                        Log.Warn("Bapi not initialized to retrieve sap external factor for currency ".concat(currency, ", 1 will be used as default"));
                    }
                }
                return Lib.AP.SAP.externalCurrencyFactors[currency];
            }
            SAP.GetExternalCurrencyFactor = GetExternalCurrencyFactor;
            /**
             * Queries a table in SAP by calling RFC_READ_TABLE and returns the result.
             * @memberOf Sys.Helpers.SAP
             * @param {object} rfcReadTableBapi The RFC_READ_TABLE bapi object. Not required in webservice
             * @param {string} table The SAP table to query
             * @param {string} fields The list of fields to fetch (separated by |)
             * @param {string} options The filter for the query (max 70 characters per \n separeted lines)
             * @param {int} rowCount The number of rows to fetch
             * @param {int} rowSkip The number of rows to skip
             * @param {boolean} noData If true, no data will be fetched
             * @param {object} jsonOptions Options for the query ({ useCache: true } will use the SAPProxy cache for this query)
             * @return {array} An array of objects (each object containing a row). Or null in case of an error (check error with Sys.Helpers.GetLastError()).
             */
            Lib.AP.SAP.ReadSAPTable = function (rfcReadTableBapi, table, fields, options, rowCount, rowSkip, noData, jsonOptions) {
                if (Lib.AP.SAP.UsesWebServices()) {
                    var dumpBAPICalls = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("DumpBAPICalls", false);
                    return Lib.P2P.SAP.Soap.Server.Call_RFC_READ_TABLE_WSSync(table, fields, options, rowCount, rowSkip, noData, jsonOptions, dumpBAPICalls);
                }
                // else, RFC
                return Sys.Helpers.SAP.ReadSAPTable(rfcReadTableBapi, table, fields, options, rowCount, rowSkip, noData, jsonOptions);
            };
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
