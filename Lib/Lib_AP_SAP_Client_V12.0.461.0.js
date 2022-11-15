/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "library: SAP AP routines",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_SAP_V12.0.461.0",
    "[Lib_AP_Customization_Common]",
    "Lib_P2P_SAP_SOAP_V12.0.461.0",
    "Lib_P2P_SAP_SOAP_Client_V12.0.461.0",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP_Client"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var SAPTaxFromNetBapiClient = /** @class */ (function (_super) {
                __extends(SAPTaxFromNetBapiClient, _super);
                function SAPTaxFromNetBapiClient() {
                    var _this = _super.call(this) || this;
                    _this.SAPConfiguration = Variable.GetValueAsString("SAPConfiguration");
                    return _this;
                }
                SAPTaxFromNetBapiClient.prototype.GetTaxRateFromTaxCode = function (bapiManager, companyCode, taxCode, taxJurisdiction, invoiceCurrency, successCallback, item, errorCallback, finalCallback) {
                    var I_ACCDATA = item ? GetAccDataParameter(item) : null;
                    var cachedValue = Lib.AP.SAP.g_taxCodesCache.Get(companyCode, taxCode, taxJurisdiction, invoiceCurrency, I_ACCDATA);
                    if (typeof cachedValue !== "undefined" && cachedValue !== null) {
                        successCallback(item, cachedValue, 0);
                        if (finalCallback) {
                            finalCallback();
                        }
                    }
                    else {
                        var bapiParams = {
                            "EXPORTS": {
                                "I_BUKRS": companyCode,
                                "I_MWSKZ": taxCode,
                                "I_PROTOKOLL": "",
                                "I_PRSDT": "",
                                "I_TXJCD": taxJurisdiction,
                                "I_WAERS": invoiceCurrency,
                                "I_WRBTR": 1000.0,
                                "I_ZBD1P": 0.0
                            }
                        };
                        if (I_ACCDATA) {
                            bapiParams.EXPORTS.I_ACCDATA = I_ACCDATA;
                        }
                        Lib.AP.SAP.SAPCallBapi(sapQueryCallback, this.SAPConfiguration, "Z_ESK_CALCULATE_TAX_FRM_NET", bapiParams);
                    }
                    function sapQueryCallback(jsonResult) {
                        if (jsonResult.ERRORS && jsonResult.ERRORS.length > 0) {
                            if (jsonResult.ERRORS[0].code === 3 && jsonResult.ERRORS[0].err === "Specify a tax jurisdiction key") {
                                Lib.AP.SAP.g_taxJurisdictionRequiredCache.Set(companyCode, true);
                                if (errorCallback) {
                                    errorCallback(item, "This field is required!", "TaxJurisdiction__", Lib.AP.TouchlessException.MissingLineField);
                                }
                            }
                            else if (errorCallback) {
                                errorCallback(item, jsonResult.ERRORS[0].err, "TaxCode__", Lib.AP.TouchlessException.Other);
                            }
                            else if (typeof Popup !== "undefined") {
                                Popup.Alert(jsonResult.ERRORS[0].err, true, null, "_Error while computing the tax amount");
                            }
                            Log.Error("Unable to get tax rate");
                            Lib.AP.SAP.g_taxCodesCache.clear();
                        }
                        else if (jsonResult.IMPORTS) {
                            var taxrate = jsonResult.IMPORTS.E_FWSTE / 10;
                            Lib.AP.SAP.g_taxCodesCache.Set(companyCode, taxCode, taxJurisdiction, invoiceCurrency, taxrate, I_ACCDATA);
                            successCallback(item, taxrate, []);
                        }
                        else if (errorCallback) {
                            errorCallback(item, "Z_ESK_CALCULATE_TAX_FRM_NET call failed." + JSON.stringify(jsonResult), "TaxCode__", Lib.AP.TouchlessException.Other);
                            Log.Error("Unable to get tax rate");
                            Lib.AP.SAP.g_taxCodesCache.clear();
                        }
                        if (finalCallback) {
                            finalCallback();
                        }
                    }
                };
                return SAPTaxFromNetBapiClient;
            }(SAP.SAPTaxFromNetBapi));
            SAP.SAPTaxFromNetBapiClient = SAPTaxFromNetBapiClient;
            // Store taxRate to avoid multiple queries
            SAP.g_taxCodesCache = {
                data: {},
                pendingQueries: [],
                BuildKey: function (companyCode, taxCode, juridiction, currency, I_ACCDATA) {
                    var tmpAccdata = I_ACCDATA ? JSON.stringify(I_ACCDATA, Object.keys(I_ACCDATA).sort()) : "";
                    return companyCode + "-" + taxCode + "-" + currency + "-" + juridiction + "-" + tmpAccdata;
                },
                Get: function (companyCode, taxCode, juridiction, currency, I_ACCDATA) {
                    return this.data[this.BuildKey(companyCode, taxCode, juridiction, currency, I_ACCDATA)];
                },
                Set: function (companyCode, taxCode, juridiction, currency, taxRate, I_ACCDATA) {
                    this.data[this.BuildKey(companyCode, taxCode, juridiction, currency, I_ACCDATA)] = taxRate;
                },
                isBapiParamsEquals: function (bapiParams, queryResultBapiParams) {
                    if (!bapiParams.EXPORTS) {
                        return false;
                    }
                    for (var p in bapiParams.EXPORTS) {
                        if (bapiParams.EXPORTS[p] !== queryResultBapiParams.EXPORTS[p]) {
                            // Check null/empty string
                            if (!bapiParams.EXPORTS[p] && queryResultBapiParams.EXPORTS[p]) {
                                return false;
                            }
                            if (bapiParams.EXPORTS[p] && !queryResultBapiParams.EXPORTS[p]) {
                                return false;
                            }
                            if (bapiParams.EXPORTS[p] && queryResultBapiParams.EXPORTS[p]) {
                                return false;
                            }
                        }
                    }
                    return true;
                },
                GetPendingQuery: function (bapiParams) {
                    var pendingQuery = null;
                    if (bapiParams.SAPBAPIPARAMS) {
                        try {
                            bapiParams = JSON.parse(bapiParams.SAPBAPIPARAMS);
                        }
                        catch (e) {
                            Log.Error("Error in parsing bapiParams: " + e);
                        }
                    }
                    for (var i = 0; i < this.pendingQueries.length; i++) {
                        var query = this.pendingQueries[i];
                        if (this.isBapiParamsEquals(bapiParams, query.bapiParams)) {
                            pendingQuery = query;
                            break;
                        }
                    }
                    return pendingQuery;
                },
                SetPendingQuery: function (bapiParams, callback, item) {
                    var o = this.GetPendingQuery(bapiParams) || {
                        bapiParams: bapiParams,
                        callbacks: [],
                        addCallback: function (cb, it) {
                            var c = {
                                callback: cb,
                                item: it
                            };
                            this.callbacks.push(c);
                        }
                    };
                    o.addCallback(callback, item);
                    this.pendingQueries.push(o);
                },
                clear: function () {
                    this.pendingQueries = [];
                }
            };
            SAP.g_taxJurisdictionRequiredCache = {
                data: {},
                Get: function (companyCode) {
                    return this.data[companyCode] ? this.data[companyCode] : false;
                },
                Set: function (companyCode, required) {
                    this.data[companyCode] = required;
                },
                IsDefined: function (companyCode) {
                    return this.data[companyCode] === true || this.data[companyCode] === false;
                }
            };
            /**
             * SAP ReadSAPTable call to retrieve Material description
             */
            function GetMaterialDescriptionClient(callback, material, language) {
                function readSAPTableCallback(result) {
                    if (result && result.length > 0) {
                        callback(Sys.Helpers.String.SAP.Trim(result[0].MAKTX));
                    }
                    else {
                        callback("");
                    }
                }
                var filter = "MATNR = '" + material + "' AND SPRAS = '" + language + "'";
                var readTAbleOptions = {
                    "doNotFetchAllResult": false,
                    "useCache": true
                };
                Lib.AP.SAP.ReadSAPTable(readSAPTableCallback, Variable.GetValueAsString("SAPConfiguration"), "MAKT", "MAKTX", filter, 1, 0, false, readTAbleOptions);
            }
            SAP.GetMaterialDescriptionClient = GetMaterialDescriptionClient;
            Lib.AP.SAP.GetNewSAPTaxFromNetBapi = function () {
                return new SAPTaxFromNetBapiClient();
            };
            function GetAccDataParameter(lineItem) {
                var userExitResult = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.ShouldAddAccDataParameterForTaxComputation");
                if (!Sys.Helpers.IsBoolean(userExitResult) || !userExitResult) {
                    return null;
                }
                var accData = SAP.GetDefaultTaxAccDataFromItem(lineItem);
                return Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.GetAccDataParameterForTaxComputation", accData, lineItem) || accData;
            }
            SAP.GetAccDataParameter = GetAccDataParameter;
            function GetTaxFromNetClient(callback, companyCode, taxCode, taxJurisdiction, itemNumberTax, currency, baseAmount, callbackParam) {
                function sapTaxFromNetBapiCallback(jsonResult) {
                    var taxAccounts = null;
                    if (!jsonResult.ERRORS || jsonResult.ERRORS.length === 0) {
                        taxAccounts = [];
                        // Read the BAPI results
                        if (jsonResult.TABLES) {
                            var MwdatTable = jsonResult.TABLES.T_MWDAT;
                            // Return all the tax lines, not only one.
                            // Ex: Payables invoice with interstate tax on sales/purchases.
                            // Interstate tax is the responsibility of the person making the
                            // purchase and is not paid to the vendor.
                            for (var idx = 0; idx < MwdatTable.length; idx++) {
                                var aTaxAccount = void 0;
                                aTaxAccount = Lib.AP.SAP.GetNewSAPTaxAccount(MwdatTable[idx], taxCode);
                                taxAccounts.push(aTaxAccount);
                            }
                        }
                    }
                    else {
                        Sys.Helpers.SAP.SetLastError(jsonResult.ERRORS[0].err);
                    }
                    callback(taxAccounts, callbackParam, taxCode, itemNumberTax);
                }
                if (taxCode && Sys.Helpers.String.SAP.Trim(taxCode).length > 0) {
                    var bapiParams = {
                        "EXPORTS": {
                            "I_BUKRS": companyCode,
                            "I_MWSKZ": taxCode,
                            "I_PROTOKOLL": "",
                            "I_PRSDT": "",
                            "I_TXJCD": taxJurisdiction,
                            "I_WAERS": currency,
                            "I_WRBTR": baseAmount,
                            "I_ZBD1P": 0.0
                        }
                    };
                    Lib.AP.SAP.SAPCallBapi(sapTaxFromNetBapiCallback, Variable.GetValueAsString("SAPConfiguration"), "Z_ESK_CALCULATE_TAX_FRM_NET", bapiParams);
                }
                else {
                    Log.Error("GetTaxFromNet, 'taxCode' is a required parameter");
                    callback(null, callbackParam, taxCode, itemNumberTax);
                }
            }
            SAP.GetTaxFromNetClient = GetTaxFromNetClient;
            function GetTaxFromGrossClient(callback, companyCode, taxCode, taxJurisdiction, itemNumberTax, currency, baseAmount, callbackParam) {
                // Not implemented yet
                callback(null, callbackParam, taxCode, itemNumberTax);
            }
            SAP.GetTaxFromGrossClient = GetTaxFromGrossClient;
            function GetFIDocumentIdFromMMDocumentId(callback, MMDocumentId, companyCode) {
                /** @this queryCallback */
                function queryCallback() {
                    var FIDocumentId = "";
                    if (!this.GetQueryError() && this.GetRecordsCount() > 0) {
                        FIDocumentId = Lib.AP.FormatInvoiceDocumentNumber(this.GetQueryValue("BELNR", 0), this.GetQueryValue("GJAHR", 0), companyCode);
                    }
                    callback(FIDocumentId);
                }
                var mm = Lib.AP.ParseInvoiceDocumentNumber(MMDocumentId, true);
                if (mm) {
                    var filter = Lib.AP.SAP.GetMMInvoiceDocumentTypeFilter();
                    if (filter) {
                        filter += "| AND ";
                    }
                    filter += "BUKRS = '" + companyCode + "' AND AWKEY = '" + mm.documentNumber + mm.fiscalYear + "' | AND GJAHR = '" + mm.fiscalYear + "'";
                    Lib.AP.SAP.SAPQuery(queryCallback, Variable.GetValueAsString("SAPConfiguration"), "BKPF", "BELNR|GJAHR", filter, 1, 0, false);
                }
                else {
                    callback(null);
                }
            }
            SAP.GetFIDocumentIdFromMMDocumentId = GetFIDocumentIdFromMMDocumentId;
            function GetMMDocumentIdFromFIDocumentId(callback, FIDocumentId) {
                /** @this queryCallback */
                function queryCallback() {
                    var MMDocumentId = "";
                    if (!this.GetQueryError() && this.GetRecordsCount() > 0) {
                        var refKey = this.GetQueryValue("AWKEY", 0);
                        // Note: AWKEY = FIInvoiceNumber + CompanyCode + FiscalYear --> Not MM invoice
                        if (refKey && refKey.length === 14) {
                            MMDocumentId = Lib.AP.FormatInvoiceDocumentNumber(refKey.substr(0, 10), refKey.substr(10));
                        }
                    }
                    callback(MMDocumentId);
                }
                var fi = Lib.AP.ParseInvoiceDocumentNumber(FIDocumentId, true);
                if (fi) {
                    var options = "BUKRS = '".concat(fi.companyCode, "' AND BELNR = '").concat(fi.documentNumber, "' AND GJAHR = '").concat(fi.fiscalYear, "'");
                    Lib.AP.SAP.SAPQuery(queryCallback, Variable.GetValueAsString("SAPConfiguration"), "BKPF", "AWKEY", options, 1, 0, false);
                }
                else {
                    callback(null);
                }
            }
            SAP.GetMMDocumentIdFromFIDocumentId = GetMMDocumentIdFromFIDocumentId;
            function GetFIDocument(callback, fields, options) {
                /** @this queryCallback */
                function queryCallback() {
                    if (this.GetQueryError() || this.GetRecordsCount() > 0) {
                        callback.apply(this);
                    }
                    else {
                        // Continue the searching in BSAK table
                        Lib.AP.SAP.SAPQuery(callback, Variable.GetValueAsString("SAPConfiguration"), "BSAK", fields, options, 1, 0);
                    }
                }
                // Search in BSIK table
                Lib.AP.SAP.SAPQuery(queryCallback, Variable.GetValueAsString("SAPConfiguration"), "BSIK", fields, options, 1, 0);
            }
            SAP.GetFIDocument = GetFIDocument;
            function GetMMDocument(callback, fields, options) {
                // Search in RBKP table
                Lib.AP.SAP.SAPQuery(callback, Variable.GetValueAsString("SAPConfiguration"), "RBKP", fields, options, 1, 0);
            }
            SAP.GetMMDocument = GetMMDocument;
            /**
            * convert value to foreign currency
            * @param {object} callback
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
            function ConvertToForeignCurrencyClient(callback, value, currencyKey, foreignCurrencyKey, translationDate, exchangeRate, typeOfRate, bUseExchangeRatesTable) {
                function convertToForeignCallback(jsonResult) {
                    if (!jsonResult.ERRORS || jsonResult.ERRORS.length === 0) {
                        callback({
                            "DerivedRateType": jsonResult.IMPORTS.DERIVED_RATE_TYPE,
                            "ExchangeRate": jsonResult.IMPORTS.EXCHANGE_RATE,
                            "FixedRate": jsonResult.IMPORTS.FIXED_RATE,
                            "ForeignAmount": jsonResult.IMPORTS.FOREIGN_AMOUNT,
                            "ForeignFactor": jsonResult.IMPORTS.FOREIGN_FACTOR,
                            "LocalFactor": jsonResult.IMPORTS.LOCAL_FACTOR
                        });
                        return;
                    }
                    Sys.Helpers.SAP.SetLastError(Language.Translate("_Currency rate %1 / %2 rate type %3 for %4 not maintained in the system settings", false, foreignCurrencyKey, currencyKey, "M", translationDate));
                    callback(null);
                }
                function sapClientCallback(sapClient) {
                    var bapiParams = {
                        EXPORTS: {
                            CLIENT: sapClient,
                            DATE: translationDate,
                            FOREIGN_CURRENCY: foreignCurrencyKey,
                            LOCAL_AMOUNT: value,
                            LOCAL_CURRENCY: currencyKey,
                            RATE: exchangeRate,
                            READ_TCURR: bUseExchangeRatesTable ? "X" : "",
                            TYPE_OF_RATE: typeOfRate
                        }
                    };
                    Lib.AP.SAP.SAPCallBapi(convertToForeignCallback, Variable.GetValueAsString("SAPConfiguration"), "Z_ESK_CONV_TO_FOREIGN_CURRENCY", bapiParams);
                }
                Lib.AP.SAP.GetSAPClient().Then(function (sapClient) {
                    sapClientCallback(sapClient);
                });
            }
            SAP.ConvertToForeignCurrencyClient = ConvertToForeignCurrencyClient;
            function GetGLAccountDescriptionClient(callback, companyCode, account, language) {
                function bapiCallback(jsonResult) {
                    var accountDescription = "";
                    if ((jsonResult && !jsonResult.ERRORS) || jsonResult.ERRORS.length === 0) {
                        var accDetail = jsonResult.IMPORTS.ACCOUNT_DETAIL;
                        if (accDetail.LONG_TEXT) {
                            accountDescription = accDetail.LONG_TEXT;
                        }
                        else {
                            accountDescription = accDetail.SHORT_TEXT;
                        }
                    }
                    Lib.AP.SAP.glDescriptionsCache[companyCode][account] = accountDescription;
                    callback(accountDescription);
                }
                // Check in cache first
                if (!Lib.AP.SAP.glDescriptionsCache[companyCode]) {
                    Lib.AP.SAP.InitGLDescriptionCacheFromLines(companyCode);
                }
                if (Lib.AP.SAP.glDescriptionsCache[companyCode][account]) {
                    callback(Lib.AP.SAP.glDescriptionsCache[companyCode][account]);
                }
                else {
                    var bapiParams = {
                        EXPORTS: {
                            COMPANYCODE: companyCode,
                            GLACCT: Sys.Helpers.String.SAP.NormalizeID(account, 10),
                            LANGUAGE: language,
                            TEXT_ONLY: "X"
                        },
                        USECACHE: true
                    };
                    Lib.AP.SAP.SAPCallBapi(bapiCallback, Variable.GetValueAsString("SAPConfiguration"), "BAPI_GL_ACC_GETDETAIL", bapiParams);
                }
            }
            SAP.GetGLAccountDescriptionClient = GetGLAccountDescriptionClient;
            function GetDuplicateFIInvoices(duplicateCandidates, sapConfig, sdp) {
                // 1- Search in posted documents (FI)
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var filter;
                    if (!Lib.AP.InvoiceType.isPOInvoice() || (sdp.normalizedInvoiceNumber && sdp.normalizedInvoiceAmount)) {
                        filter = Lib.AP.SAP.GetDuplicateFIInvoiceFilter(sdp.companyCode, sdp.normalizedInvoiceNumber, sdp.normalizedVendorNumber, sdp.normalizedInvoiceDate, sdp.invoiceCurrency, sdp.normalizedInvoiceAmount);
                        Lib.AP.SAP.PromisedReadSAPTable(sapConfig, "BSIP", "BELNR|BUKRS|GJAHR", filter, 0, 0, false, { useCache: false })
                            .Then(function (bsipResult) {
                            if (bsipResult && bsipResult.length > 0) {
                                filter = Lib.AP.SAP.GetDuplicateFIInvoiceNotReversedFilter(bsipResult, sdp.companyCode, sdp.normalizedInvoiceNumber, sdp.normalizedInvoiceDate, sdp.invoiceCurrency);
                                Lib.AP.SAP.PromisedReadSAPTable(sapConfig, "BKPF", "BELNR|BUKRS|GJAHR|AWKEY", filter, 0, 0, false, { useCache: false })
                                    .Then(function (bkpfResult) {
                                    if (bkpfResult.length > 0) {
                                        // Exclude reversed MM results
                                        filter = Lib.AP.SAP.GetDuplicateReversedMMInvoicesFilter(bkpfResult, sdp.companyCode);
                                        if (filter) {
                                            Lib.AP.SAP.PromisedReadSAPTable(sapConfig, "RBKP", "BELNR|BUKRS|GJAHR", filter, 0, 0, false, { useCache: false })
                                                .Then(function (rbkpResults) {
                                                Lib.AP.SAP.FilterResultsOnAWKEY(bkpfResult, rbkpResults);
                                                resolve(Lib.AP.SAP.AddDuplicateCandidates(bkpfResult, duplicateCandidates));
                                            })
                                                .Catch(function (error) {
                                                Log.Error("GetDuplicateFIInvoices - RBKP: ".concat(error));
                                                resolve(Lib.AP.SAP.AddDuplicateCandidates(bkpfResult, duplicateCandidates));
                                            });
                                        }
                                        else {
                                            resolve(Lib.AP.SAP.AddDuplicateCandidates(bkpfResult, duplicateCandidates));
                                        }
                                    }
                                    else {
                                        resolve(duplicateCandidates);
                                    }
                                })
                                    .Catch(function (error) {
                                    Log.Error("GetDuplicateFIInvoices - BKPF: ".concat(error));
                                    resolve(duplicateCandidates);
                                });
                            }
                            else {
                                resolve(duplicateCandidates);
                            }
                        })
                            .Catch(function (error) {
                            Log.Error("GetDuplicateFIInvoices - BSIP: ".concat(error));
                            resolve(duplicateCandidates);
                        });
                    }
                    else {
                        resolve(duplicateCandidates);
                    }
                });
            }
            function GetDuplicateMMInvoices(duplicateCandidates, sapConfig, sdp) {
                // 2- Search for invoice receipts documents (MM)
                return Sys.Helpers.Promise.Create(function (resolve) {
                    if (!Lib.AP.InvoiceType.isPOInvoice() || (sdp.normalizedInvoiceNumber && sdp.normalizedInvoiceAmount)) {
                        var filter = Lib.AP.SAP.GetDuplicateMMInvoiceFilter(sdp.companyCode, sdp.normalizedInvoiceNumber, sdp.normalizedVendorNumber, sdp.normalizedInvoiceDate, sdp.invoiceCurrency, sdp.normalizedInvoiceAmount);
                        Lib.AP.SAP.PromisedReadSAPTable(sapConfig, "RBKP", "BELNR|BUKRS|GJAHR", filter, 0, 0, false, { useCache: false })
                            .Then(function (result) {
                            resolve(Lib.AP.SAP.AddDuplicateCandidates(result, duplicateCandidates));
                        })
                            .Catch(function (error) {
                            Log.Error("GetDuplicateMMInvoices: ".concat(error));
                            resolve(duplicateCandidates);
                        });
                    }
                    else {
                        resolve(duplicateCandidates);
                    }
                });
            }
            function GetDuplicateFIParkedInvoices(duplicateCandidates, sapConfig, sdp) {
                // 3 - Search for parked documents (FI)
                return Sys.Helpers.Promise.Create(function (resolve) {
                    // use inv # if it exists, otherwise do not run query
                    if (sdp.normalizedInvoiceNumber) {
                        var filter_1 = "BUKRS = '".concat(sdp.companyCode, "'");
                        filter_1 += "\n AND BSTAT = 'V'";
                        filter_1 += "\n AND BLDAT = '".concat(sdp.normalizedInvoiceDate, "'");
                        filter_1 += "\n AND WAERS = '".concat(sdp.invoiceCurrency, "'");
                        filter_1 += "\n AND XBLNR = '".concat(sdp.normalizedInvoiceNumber, "'");
                        Lib.AP.SAP.PromisedReadSAPTable(sapConfig, "VBKPF", "WAERS|BELNR|BUKRS|GJAHR", filter_1, 0, 0, false, { useCache: false })
                            .Then(function (result) {
                            if (result && result.length > 0) {
                                filter_1 = Lib.AP.SAP.GetDuplicateFIparkedInvoiceFilter(result, sdp.companyCode, sdp.normalizedInvoiceNumber, sdp.normalizedVendorNumber, sdp.normalizedInvoiceDate);
                                Lib.AP.SAP.PromisedReadSAPTable(sapConfig, "VBSEGK", "BELNR|BUKRS|GJAHR", filter_1, 0, 0, false, { useCache: false })
                                    .Then(function (vbsegkResult) {
                                    resolve(Lib.AP.SAP.AddDuplicateCandidates(vbsegkResult, duplicateCandidates));
                                })
                                    .Catch(function (error) {
                                    Log.Error("GetDuplicateFIParkedInvoices - VBSEGK: ".concat(error));
                                    resolve(duplicateCandidates);
                                });
                            }
                            else {
                                resolve(duplicateCandidates);
                            }
                        })
                            .Catch(function (error) {
                            Log.Error("GetDuplicateFIParkedInvoices - VBKPF: ".concat(error));
                            resolve(duplicateCandidates);
                        });
                    }
                    else {
                        resolve(duplicateCandidates);
                    }
                });
            }
            function GetDuplicateInvoiceClient() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var sapConfig = Variable.GetValueAsString("SAPConfiguration");
                    var companyCode = Data.GetValue("CompanyCode__");
                    var invoiceType = Data.GetValue("InvoiceType__");
                    var invoiceNumber = Data.GetValue("InvoiceNumber__");
                    var vendorNumber = Data.GetValue("VendorNumber__");
                    var invoiceDate = Data.GetValue("InvoiceDate__");
                    var invoiceAmount = Data.GetValue("InvoiceAmount__");
                    var invoiceCurrency = Data.GetValue("InvoiceCurrency__");
                    var duplicateCandidates = [];
                    if (companyCode && vendorNumber && invoiceDate && (invoiceAmount || invoiceNumber) && invoiceCurrency && invoiceType) {
                        var duplicateParams_1 = {
                            companyCode: companyCode,
                            normalizedInvoiceNumber: invoiceNumber ? Lib.AP.SAP.escapeToSQL(invoiceNumber.toUpperCase().substr(0, 16)) : null,
                            normalizedVendorNumber: Sys.Helpers.String.SAP.NormalizeID(vendorNumber, 10),
                            normalizedInvoiceDate: Sys.Helpers.SAP.FormatToSAPDateTimeFormat(invoiceDate),
                            invoiceCurrency: invoiceCurrency,
                            normalizedInvoiceAmount: invoiceAmount ? invoiceAmount.toFixed(2) : null
                        };
                        // 1- Search in posted documents (FI)
                        GetDuplicateFIInvoices(duplicateCandidates, sapConfig, duplicateParams_1)
                            .Then(function (FIDuplicates) {
                            // 2- Search for invoice receipts documents (MM)
                            return GetDuplicateMMInvoices(FIDuplicates, sapConfig, duplicateParams_1);
                        })
                            .Then(function (FIAndMMDuplicates) {
                            // 3 - Search for parked documents (FI)
                            return GetDuplicateFIParkedInvoices(FIAndMMDuplicates, sapConfig, duplicateParams_1);
                        })
                            .Finally(function () {
                            resolve(duplicateCandidates);
                        });
                    }
                    else {
                        resolve(duplicateCandidates);
                    }
                });
            }
            SAP.GetDuplicateInvoiceClient = GetDuplicateInvoiceClient;
            SAP.externalCurrencyFactors = {};
            function GetExternalCurrencyFactor(callback, currency, options) {
                function readSAPTableCallback(result) {
                    var externalFactor = 1;
                    if (result && result.length > 0) {
                        var nbDecimals = Sys.Helpers.String.SAP.Trim(result[0].CURRDEC);
                        externalFactor = Sys.Helpers.String.SAP.ConvertDecimalToExternalFactor(nbDecimals);
                    }
                    Lib.AP.SAP.externalCurrencyFactors[currency] = externalFactor;
                    callback(Lib.AP.SAP.externalCurrencyFactors[currency], options);
                }
                if (Lib.AP.SAP.externalCurrencyFactors[currency]) {
                    callback(Lib.AP.SAP.externalCurrencyFactors[currency], options);
                }
                else {
                    var customExternalFactors = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAPCurrenciesExternalFactors");
                    if (customExternalFactors && customExternalFactors[currency]) {
                        Lib.AP.SAP.externalCurrencyFactors[currency] = customExternalFactors[currency];
                        callback(Lib.AP.SAP.externalCurrencyFactors[currency], options);
                    }
                    else {
                        //Query table TCURX
                        var filter = "CURRKEY = '".concat(currency, "'");
                        Lib.AP.SAP.ReadSAPTable(readSAPTableCallback, Variable.GetValueAsString("SAPConfiguration"), "TCURX", "CURRDEC", filter, 1, 0, false);
                    }
                }
            }
            SAP.GetExternalCurrencyFactor = GetExternalCurrencyFactor;
            /**
             * Read table content from SAP
             * In RFC, call Sys.Helpers.SAP.ReadSAPTable function
             * In WS, call Lib.P2P.SAP.Soap.Call_RFC_READ_TABLE_WS
             */
            function ReadSAPTable(callback, sapConfiguration, table, fields, filter, rowCount, rowSkip, noData, jsonOptions) {
                if (noData === void 0) { noData = false; }
                if (Lib.AP.SAP.UsesWebServices()) {
                    var dumpBAPICalls = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("DumpBAPICalls", false);
                    Lib.P2P.SAP.Soap.Call_RFC_READ_TABLE_WS(table, fields, filter, rowCount, rowSkip, noData, jsonOptions, dumpBAPICalls).Then(callback).Catch(callback);
                }
                else {
                    Sys.Helpers.SAP.ReadSAPTable(callback, sapConfiguration, table, fields, filter, rowCount, rowSkip, noData, jsonOptions);
                }
            }
            SAP.ReadSAPTable = ReadSAPTable;
            /**
             * Read table content from SAP
             * In RFC, call Sys.Helpers.SAP.ReadSAPTable function
             * In WS, call Lib.P2P.SAP.Soap.Call_RFC_READ_TABLE_WS
             */
            function PromisedReadSAPTable(sapConfiguration, table, fields, filter, rowCount, rowSkip, noData, jsonOptions) {
                if (noData === void 0) { noData = false; }
                if (Lib.AP.SAP.UsesWebServices()) {
                    var dumpBAPICalls = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("DumpBAPICalls", false);
                    return Lib.P2P.SAP.Soap.Call_RFC_READ_TABLE_WS(table, fields, filter, rowCount, rowSkip, noData, jsonOptions, dumpBAPICalls);
                }
                return Sys.Helpers.SAP.PromisedReadSAPTable(sapConfiguration, table, fields, filter, rowCount, rowSkip, noData, jsonOptions);
            }
            SAP.PromisedReadSAPTable = PromisedReadSAPTable;
            /**
             * Execute a query on SAP using RFC or Web Service based on configuration and mapping configuration
             */
            Lib.AP.SAP.SAPQuery = function (queryCallback, sapConf, table, fields, options, rowCount, rowSkip, noData, useCache) {
                if (noData === void 0) { noData = false; }
                if (useCache === void 0) { useCache = null; }
                if (Lib.AP.SAP.UsesWebServices()) {
                    Lib.P2P.SAP.Soap.Client.SAPQueryWS(queryCallback, sapConf, table, fields, options, rowCount, rowSkip, noData, useCache);
                }
                else {
                    Query.SAPQuery(queryCallback, sapConf, table, fields, options, rowCount, rowSkip, noData);
                }
            };
            /**
             * Call a BAPI in FRC or WS mode
             * In RFC, call Query.SAPCallBapi function
             * In WS, call Lib.P2P.SAP.Soap.CallSAPSOAPWS
             */
            function SAPCallBapi(sapCallBapiCallback, SAPConfiguration, bapiName, bapiParams) {
                var bapiAlias = Lib.P2P.SAP.Soap.GetBAPIName(bapiName);
                if (Lib.AP.SAP.UsesWebServices()) {
                    // Web service call needs bapiParams to define response structure or webservice will end in Error 500.
                    // Merge the Empty definition with parameters set in scripts
                    var resolvedBapiParams = Lib.P2P.SAP.Soap.MergeBapiParams(Lib.P2P.SAP.Soap.InitBapiParams(bapiName, bapiAlias)[bapiName], bapiParams);
                    Lib.P2P.SAP.Soap.Client.SAPCallBapiWS(sapCallBapiCallback, SAPConfiguration, bapiName, resolvedBapiParams);
                }
                else {
                    Query.SAPCallBapi(sapCallBapiCallback, SAPConfiguration, bapiName, bapiParams);
                }
            }
            SAP.SAPCallBapi = SAPCallBapi;
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
