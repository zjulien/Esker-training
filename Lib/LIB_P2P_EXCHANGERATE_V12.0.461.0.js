///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_P2P_ExchangeRate_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "P2P library",
  "require": [
    "Lib_P2P_V12.0.461.0",
    "Sys/Sys_Helpers_LdapUtil",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var ExchangeRate;
        (function (ExchangeRate) {
            ExchangeRate.ExchangeRatesTableName = "P2P - Exchange rate__";
            function GetCompanyCodeCurrency(companyCode, callback) {
                var companyCodeCurrency = null;
                var filter = Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode).toString();
                if (!callback) {
                    Sys.GenericAPI.Query("PurchasingCompanycodes__", filter, ["Currency__"], function (result, error) {
                        if (!error && result && result.length > 0) {
                            companyCodeCurrency = result[0].Currency__;
                        }
                    });
                }
                else {
                    Sys.GenericAPI.Query("PurchasingCompanycodes__", filter, ["Currency__"], callback);
                }
                return companyCodeCurrency;
            }
            ExchangeRate.GetCompanyCodeCurrency = GetCompanyCodeCurrency;
            function GetCompanyCodeCurrencies(companyCode, callback) {
                var currencies = [];
                var filter = Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode).toString();
                if (!callback) {
                    Sys.GenericAPI.Query(ExchangeRate.ExchangeRatesTableName, filter, ["CurrencyFrom__"], function (result, error) {
                        if (error || !result) {
                            return;
                        }
                        for (var i = 0; i < result.length; i++) {
                            var r = result[i];
                            if (currencies.indexOf(r.CurrencyFrom__) === -1) {
                                currencies.push(r.CurrencyFrom__);
                            }
                        }
                    }, "CompanyCode__ DESC", 100);
                }
                else {
                    Sys.GenericAPI.Query(ExchangeRate.ExchangeRatesTableName, filter, ["CurrencyFrom__"], callback, "CompanyCode__ DESC", 100);
                }
                return currencies;
            }
            ExchangeRate.GetCompanyCodeCurrencies = GetCompanyCodeCurrencies;
            function IsCurrencyDefinedForCompanyCode(companyCode, currency, callback) {
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("CurrencyFrom__", currency)).toString();
                var bExists = false;
                if (!callback) {
                    // Synchronous server side
                    Sys.GenericAPI.Query(ExchangeRate.ExchangeRatesTableName, filter, ["CurrencyFrom__"], function (result) {
                        bExists = Boolean(result && result.length > 0);
                    }, "", 1);
                }
                else {
                    // Asynchronous client side
                    Sys.GenericAPI.Query(ExchangeRate.ExchangeRatesTableName, filter, ["CurrencyFrom__"], callback, "", 1);
                }
                return bExists;
            }
            ExchangeRate.IsCurrencyDefinedForCompanyCode = IsCurrencyDefinedForCompanyCode;
            function GetExchangeRate(companyCode, currency, callback) {
                var exchangeRates = GetExchangeRates(companyCode, [currency], callback);
                return exchangeRates[currency];
            }
            ExchangeRate.GetExchangeRate = GetExchangeRate;
            /**
             * Retrieves the exchange rate fom companycode currency for specified currencies
             * @memberof Lib.P2P.ExchangeRate
             * @param companyCode Company code to retrieve the exchange rates from
             * @param currencies list of currencies for which the exchange rate should be retieved
             * @param [callback] a function to handle results in client side mode
             * @returns a map of exchange rates
             */
            function GetExchangeRates(companyCode, currencies, callback) {
                var exchangeRates = {};
                if (!currencies) {
                    if (callback) {
                        callback(null, "no currencies specified");
                    }
                    return null;
                }
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterIn("CurrencyFrom__", currencies)).toString();
                // set defautl rate to 1
                for (var i = 0; i < currencies.length; i++) {
                    exchangeRates[currencies[i]] = 1;
                }
                if (!callback) {
                    var companyCurrency_1 = Lib.P2P.ExchangeRate.GetCompanyCodeCurrency(companyCode);
                    Sys.GenericAPI.Query(ExchangeRate.ExchangeRatesTableName, filter, ["CurrencyFrom__", "Rate__", "RatioFrom__", "RatioTo__"], function (result, error) {
                        if (!error && result) {
                            for (var i = 0; i < result.length; i++) {
                                // if currency is the same has the company one let the exchange rate to 1 to avoid computation issue
                                if (companyCurrency_1 && companyCurrency_1 !== result[i].CurrencyFrom__) {
                                    exchangeRates[result[i].CurrencyFrom__] = Lib.P2P.ExchangeRate.ComputeExchangeRate(result[i].Rate__, result[i].RatioFrom__, result[i].RatioTo__);
                                }
                            }
                        }
                    }, "CompanyCode__ DESC", 100);
                }
                else {
                    Sys.GenericAPI.Query(ExchangeRate.ExchangeRatesTableName, filter, ["CurrencyFrom__", "Rate__", "RatioFrom__", "RatioTo__"], callback, "CompanyCode__ DESC", 100);
                }
                return exchangeRates;
            }
            ExchangeRate.GetExchangeRates = GetExchangeRates;
            function ComputeExchangeRate(rate, ratioFrom, ratioTo) {
                var nb_Rate = parseFloat(rate);
                var nb_RatioFrom = parseFloat(ratioFrom);
                var nb_RatioTo = parseFloat(ratioTo);
                if (!isNaN(nb_Rate) && !isNaN(nb_RatioFrom) && !isNaN(nb_RatioTo)) {
                    return new Sys.Decimal(parseFloat(rate)).mul(parseFloat(ratioTo)).div(parseFloat(ratioFrom)).toNumber();
                }
                return null;
            }
            ExchangeRate.ComputeExchangeRate = ComputeExchangeRate;
        })(ExchangeRate = P2P.ExchangeRate || (P2P.ExchangeRate = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
