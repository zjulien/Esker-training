/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_P2P_Currency_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Sys/Sys_Decimal"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Currency;
        (function (Currency) {
            var CCurrency = /** @class */ (function () {
                function CCurrency(currencyPair, precision, fractionalPrecision) {
                    this.currencyPair = currencyPair;
                    this._precision = precision;
                    this._fractionalPrecision = fractionalPrecision || precision + 3;
                }
                Object.defineProperty(CCurrency.prototype, "unitPricePrecision", {
                    get: function () {
                        return this._fractionalPrecision;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(CCurrency.prototype, "amountPrecision", {
                    get: function () {
                        return this._precision;
                    },
                    enumerable: false,
                    configurable: true
                });
                return CCurrency;
            }());
            Currency.CCurrency = CCurrency;
            var CurrencyError = /** @class */ (function (_super) {
                __extends(CurrencyError, _super);
                function CurrencyError() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return CurrencyError;
            }(Error));
            Currency.CurrencyError = CurrencyError;
            var Factory = /** @class */ (function () {
                function Factory() {
                }
                Factory.Get = function (currencyPair) {
                    currencyPair = ("" + currencyPair).trim().toUpperCase();
                    return new CCurrency(currencyPair, Language.GetCurrencyPrecision(currencyPair));
                };
                return Factory;
            }());
            Currency.Factory = Factory;
        })(Currency = P2P.Currency || (P2P.Currency = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
