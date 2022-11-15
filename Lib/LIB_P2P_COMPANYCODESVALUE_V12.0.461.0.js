///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_P2P_CompanyCodesValue_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_P2P",
  "require": [
    "[Sys/Sys_GenericAPI_Client]",
    "[Sys/Sys_GenericAPI_Server]",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var CompanyCodesValue;
        (function (CompanyCodesValue) {
            var cachedValues, ccvaluesPromiseCache;
            if (Sys.ScriptInfo.IsMobileClient()) {
                var scope = Process.GetScriptingScope("global");
                cachedValues = scope.cachedValues = scope.cachedValues || {};
                ccvaluesPromiseCache = scope.ccvaluesPromiseCache = scope.ccvaluesPromiseCache || {};
            }
            else {
                cachedValues = {};
                ccvaluesPromiseCache = {};
            }
            var Currencies = /** @class */ (function () {
                function Currencies(companyCode) {
                    this.conversion = {};
                    this.definedCurrencies = [];
                    this.initPromise = null;
                    this.currenciesPromise = {};
                    this.companyCode = companyCode;
                }
                Currencies.prototype.IsDefined = function (currency) {
                    return this.definedCurrencies.indexOf(currency) !== -1;
                };
                /**
                 * We do not recommend using this method. Prefer the asynchronous version 'QueryRate' can retry to query missing currency.
                 */
                Currencies.prototype.GetRate = function (currency) {
                    if (this.conversion[currency]) {
                        return this.conversion[currency];
                    }
                    return null;
                };
                Currencies.prototype.QueryRate = function (currency) {
                    var _this = this;
                    if (!this.initPromise) {
                        this.Init();
                    }
                    return this.initPromise.then(function () {
                        if (currency && !(currency in _this.conversion)) {
                            return _this.currenciesPromise[currency] || _this.QueryMissingRate(currency);
                        }
                        return _this.GetRate(currency);
                    });
                };
                Currencies.prototype.Init = function () {
                    var _this = this;
                    var filter = Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", this.companyCode).toString();
                    var queryCurrenciesPromise = Sys.GenericAPI
                        .PromisedQuery({
                        table: "P2P - Exchange rate__",
                        filter: filter,
                        attributes: ["CurrencyFrom__"],
                        maxRecords: 100,
                        additionalOptions: {
                            queryOptions: "distinct=1"
                        }
                    })
                        .Then(function (result) {
                        _this.definedCurrencies = result.map(function (record) { return record.CurrencyFrom__; });
                    })
                        .Catch(function (reason) {
                        Log.Error("[Lib.P2P.CompanyCodesValue] query defined currencies failed, companyCode: ".concat(_this.companyCode, ", details: ").concat(reason));
                    });
                    var queryRatesPromise = Sys.GenericAPI
                        .PromisedQuery({
                        table: "P2P - Exchange rate__",
                        filter: filter,
                        attributes: ["CompanyCode__", "CurrencyFrom__", "Rate__", "RatioFrom__", "RatioTo__"],
                        sortOrder: "CompanyCode__ DESC",
                        maxRecords: 100
                    })
                        .Then(function (result) {
                        _this.conversion = {};
                        result.forEach(function (record) {
                            _this.conversion[record.CurrencyFrom__] = new Sys.Decimal(record.RatioTo__).div(record.RatioFrom__).mul(record.Rate__).toNumber();
                        });
                    })
                        .Catch(function (reason) {
                        Log.Error("[Lib.P2P.CompanyCodesValue] query currency rates failed, companyCode: ".concat(_this.companyCode, ", details: ").concat(reason));
                    });
                    this.initPromise = Sys.Helpers.Promise.All([queryCurrenciesPromise, queryRatesPromise]);
                };
                Currencies.prototype.QueryMissingRate = function (currency) {
                    var _this = this;
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", this.companyCode), Sys.Helpers.LdapUtil.FilterEqual("CurrencyFrom__", currency)).toString();
                    var queryMissingRatePromise = Sys.GenericAPI
                        .PromisedQuery({
                        table: "P2P - Exchange rate__",
                        filter: filter,
                        attributes: ["CompanyCode__", "CurrencyFrom__", "Rate__", "RatioFrom__", "RatioTo__"],
                        maxRecords: 1
                    })
                        .Then(function (result) {
                        var rate = null;
                        if (result.length > 0) {
                            var record = result[0];
                            rate = new Sys.Decimal(record.RatioTo__).div(record.RatioFrom__).mul(record.Rate__).toNumber();
                        }
                        _this.conversion[currency] = rate;
                        return rate;
                    })
                        .Catch(function (reason) {
                        Log.Error("[Lib.P2P.CompanyCodesValue] query missing currency rate failed, companyCode: ".concat(_this.companyCode, ", details: ").concat(reason));
                        _this.conversion[currency] = null;
                        return null;
                    });
                    this.currenciesPromise[currency] = queryMissingRatePromise;
                    return queryMissingRatePromise;
                };
                return Currencies;
            }());
            CompanyCodesValue.Currencies = Currencies;
            function QueryValues(companyCode, queryCurrencies, options) {
                /** return cached promise :
                * if the promise for the company code specified exit and :
                *	if the promise cached has queryCurrencies as true
                *   OR
                *	if queryCurrencies as parameter is false (and of course queryCurrencies from the promise cached is false also)
                */
                if (!ccvaluesPromiseCache[companyCode] || (queryCurrencies && !ccvaluesPromiseCache[companyCode].queryCurrencies)) {
                    if (!ccvaluesPromiseCache[companyCode]) {
                        ccvaluesPromiseCache[companyCode] = {};
                    }
                    ccvaluesPromiseCache[companyCode].queryCurrencies = queryCurrencies;
                    ccvaluesPromiseCache[companyCode].promise = Sys.Helpers.Promise.Create(function (resolve) {
                        // when we want the currencies, return cache value only if the currencies have been loaded
                        if (cachedValues[companyCode] && (!queryCurrencies || (cachedValues[companyCode] && cachedValues[companyCode].currencies && Object.keys(cachedValues[companyCode].currencies.conversion).length > 0))) {
                            resolve(cachedValues[companyCode]);
                        }
                        else if (companyCode) {
                            Sys.GenericAPI.Query("PurchasingCompanycodes__", "CompanyCode__=" + companyCode, ["CompanyCode__", "CompanyName__", "PurchasingOrganization__", "PurchasingGroup__", "DeliveryAddressID__", "Currency__", "ERP__", "Sub__", "Street__", "PostOfficeBox__", "City__", "PostalCode__", "Region__", "Country__", "PhoneNumber__", "FaxNumber__", "VATNumber__", "ContactEmail__", "SIRET__", "DefaultConfiguration__", "DefaultExpenseReportTypeID__", "DefaultExpenseReportType__"], function (result, error) {
                                if (!error && result[0]) {
                                    var r = result[0];
                                    cachedValues[companyCode] = {
                                        CompanyCode__: r.CompanyCode__,
                                        CompanyName__: r.CompanyName__,
                                        PurchasingOrganization__: r.PurchasingOrganization__,
                                        PurchasingGroup__: r.PurchasingGroup__,
                                        DeliveryAddressID__: r.DeliveryAddressID__,
                                        Currency__: r.Currency__,
                                        ERP__: r.ERP__,
                                        Sub__: r.Sub__,
                                        Street__: r.Street__,
                                        PostOfficeBox__: r.PostOfficeBox__,
                                        City__: r.City__,
                                        PostalCode__: r.PostalCode__,
                                        Region__: r.Region__,
                                        Country__: r.Country__,
                                        PhoneNumber__: r.PhoneNumber__,
                                        FaxNumber__: r.FaxNumber__,
                                        VATNumber__: r.VATNumber__,
                                        ContactEmail__: r.ContactEmail__,
                                        SIRET__: r.SIRET__,
                                        DefaultConfiguration__: r.DefaultConfiguration__ || "Default",
                                        DefaultExpenseReportTypeID__: r.DefaultExpenseReportTypeID__,
                                        DefaultExpenseReportType__: r.DefaultExpenseReportType__,
                                        currencies: new Currencies(companyCode)
                                    };
                                    if (!r.DefaultConfiguration__) {
                                        Log.Warn("The configuration is not defined in company code '" + companyCode + "' => default to configuration 'Default'.");
                                    }
                                    if (queryCurrencies) {
                                        cachedValues[companyCode].currencies.QueryRate().Then(function ( /*rate*/) {
                                            resolve(cachedValues[companyCode]);
                                        });
                                    }
                                    else {
                                        resolve(cachedValues[companyCode]);
                                    }
                                }
                                else {
                                    cachedValues[companyCode] = {};
                                    resolve(cachedValues[companyCode]);
                                }
                            }, "", 100, options);
                        }
                        else {
                            cachedValues[companyCode] = {};
                            resolve(cachedValues[companyCode]);
                        }
                    });
                }
                return ccvaluesPromiseCache[companyCode].promise;
            }
            CompanyCodesValue.QueryValues = QueryValues;
            function GetValues(companyCode) {
                if (cachedValues[companyCode]) {
                    return cachedValues[companyCode];
                }
                return {};
            }
            CompanyCodesValue.GetValues = GetValues;
        })(CompanyCodesValue = P2P.CompanyCodesValue || (P2P.CompanyCodesValue = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
