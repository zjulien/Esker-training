/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_AP_PaymentRunProvider_Manager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Base manager for Payment Run Provider",
  "require": [
    "Sys/Sys_Helpers",
    "Lib_V12.0.461.0",
    "[Lib_AP_Customization_PaymentRunProvider]"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var PaymentRunProvider;
        (function (PaymentRunProvider) {
            var Manager;
            (function (Manager) {
                var InvoicePaymentStatus;
                (function (InvoicePaymentStatus) {
                    InvoicePaymentStatus["Paid"] = "Paid";
                    InvoicePaymentStatus["Pending"] = "Pending";
                    InvoicePaymentStatus["Rejected"] = "Rejected";
                    InvoicePaymentStatus["UserActionNeeded"] = "UserActionNeeded";
                })(InvoicePaymentStatus = Manager.InvoicePaymentStatus || (Manager.InvoicePaymentStatus = {}));
                var ProviderStatus;
                (function (ProviderStatus) {
                    ProviderStatus["NoError"] = "NoError";
                    ProviderStatus["Pending"] = "Pending";
                    ProviderStatus["ConfigurationError"] = "ConfigurationError";
                    ProviderStatus["UserActionNeeded"] = "UserActionNeeded";
                })(ProviderStatus = Manager.ProviderStatus || (Manager.ProviderStatus = {}));
                Manager.factories = {};
                var Instance = /** @class */ (function () {
                    function Instance(PaymentRunProviderName) {
                        this.PaymentRunProviderName = PaymentRunProviderName;
                        this.SetClientID("");
                        this.SetClientSecret("");
                        this.SetResponseLanguage("EN");
                        this.SetDefinition({
                            // global callbacks on error/warning notification
                            OnError: null,
                            OnWarning: null,
                            maxPaymentsStatusPollingRetries: 0
                        });
                        this.paymentRun = null;
                    }
                    Instance.prototype.IsAPIUp = function () {
                        return true;
                    };
                    /**
                     * Checks if the manager is authenticated to API and try to do it if needed
                     * @returns authentification status
                     */
                    Instance.prototype.IsAuthentified = function () {
                        return true;
                    };
                    Instance.prototype.Authentify = function () {
                        return null;
                    };
                    Instance.prototype.IsQueryPossible = function () {
                        if (!this.IsAuthentified()) {
                            var errorMessage = this.Authentify();
                            if (errorMessage) {
                                Log.Error("Could not authenticate to the ".concat(this.PaymentRunProviderName, " API"));
                                return false;
                            }
                        }
                        return true;
                    };
                    /**
                     * Common function to query the provider
                     * @param {THttpMethod} method Http verb expected by the endpoint
                     * @param {string} action key mapped with an endpoint (not relevant with custom urls)
                     * @param {HTTPRequestHeaders} headers http headers required by the provider api
                     * @param {number} expectedStatus http status expected on a nominal case
                     * @param {boolean} isAuthNeeded indicated if the endpoint requires authentification
                     * @param {string} [customUrl] override the url value for this query
                     * @returns the http response
                     */
                    Instance.prototype.QueryPaymentRunProvider = function (requestParams, expectedStatus) {
                        if (expectedStatus === void 0) { expectedStatus = 200; }
                        var httpRequest = Process.CreateHttpRequest();
                        var httpResponse = httpRequest.Call(requestParams);
                        return this.ProviderResponseHandler(httpResponse, requestParams, expectedStatus);
                    };
                    Instance.prototype.ProviderResponseHandler = function (httpResponse, requestParams, expectedStatus) {
                        if (!httpResponse) {
                            this.LogHttpCall(requestParams, httpResponse, "Unknown error");
                        }
                        else if (httpResponse.status !== expectedStatus) {
                            this.LogHttpCall(requestParams, httpResponse, httpResponse.lastErrorMessage);
                        }
                        else if (!httpResponse.data) {
                            this.LogHttpCall(requestParams, httpResponse, "Provider responded with expected status and no data");
                        }
                        else {
                            this.LogHttpCall(requestParams, httpResponse, "Provider responded");
                        }
                        return httpResponse;
                    };
                    Instance.prototype.GetPaymentRun = function () {
                        if (!this.paymentRun && Sys.Helpers.IsFunction(this.paymentRunFactory)) {
                            this.paymentRun = this.paymentRunFactory(this);
                        }
                        else {
                            Log.Error("No payment run defined for ".concat(this.PaymentRunProviderName));
                        }
                        return this.paymentRun;
                    };
                    Instance.prototype.LogHttpCall = function (requestParams, httpResponse, message) {
                        var isRequestInError = !httpResponse || !(httpResponse.status >= 200 && httpResponse.status < 300);
                        var logFunction = isRequestInError ? Log.Error : Log.Verbose;
                        if (message && isRequestInError) {
                            this.NotifyError(message);
                        }
                        else if (message) {
                            Log.Verbose("".concat(this.PaymentRunProviderName, " called: ").concat(message));
                        }
                        var requestURL = requestParams.url;
                        if (requestParams.urlSuffix) {
                            requestURL += requestParams.url.slice(-1) === "/" || requestParams.urlSuffix.charAt(0) === "/" ? "" : "/";
                            requestURL += requestParams.urlSuffix;
                        }
                        logFunction("".concat(this.PaymentRunProviderName, " called, request url: ").concat(requestURL, " with method: ").concat(requestParams.method, " "));
                        logFunction("".concat(this.PaymentRunProviderName, " called, request datas: ").concat(requestParams.data, " "));
                        logFunction("".concat(this.PaymentRunProviderName, " called, response: ").concat(httpResponse.status, " ").concat(httpResponse.lastErrorMessage, " "));
                        logFunction("".concat(this.PaymentRunProviderName, " called, response data: ").concat(httpResponse.data, " "));
                    };
                    Instance.prototype.NotifyError = function (msg) {
                        if (Sys.Helpers.IsFunction(this.definition.OnError)) {
                            this.definition.OnError.call(this, msg);
                        }
                        else {
                            Log.Error(msg);
                        }
                    };
                    Instance.prototype.NotifyWarning = function (msg) {
                        if (Sys.Helpers.IsFunction(this.definition.OnWarning)) {
                            this.definition.OnWarning.call(this, msg);
                        }
                        else {
                            Log.Warn(msg);
                        }
                    };
                    Instance.prototype.GetClientID = function () {
                        return this.clientID;
                    };
                    Instance.prototype.GetClientSecret = function () {
                        return this.clientSecret;
                    };
                    Instance.prototype.GetResponseLanguage = function () {
                        return this.responseLanguage;
                    };
                    Instance.prototype.SetClientID = function (clientID) {
                        this.clientID = clientID;
                    };
                    Instance.prototype.SetClientSecret = function (clientSecret) {
                        this.clientSecret = clientSecret;
                    };
                    Instance.prototype.SetResponseLanguage = function (responseLanguage) {
                        this.responseLanguage = responseLanguage;
                    };
                    Instance.prototype.SetDefinition = function (definition) {
                        this.definition = definition;
                    };
                    Instance.prototype.ExtendDefinition = function (definition) {
                        Sys.Helpers.Extend(true, this.definition, definition);
                    };
                    Instance.prototype.GetProperty = function (property) {
                        return this.definition[property];
                    };
                    Instance.prototype.LoadCustomSettings = function () {
                        var customSettings = Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRunProvider.GetCustomSettings");
                        if (customSettings) {
                            this.ExtendDefinition(customSettings);
                        }
                    };
                    Instance.prototype.GetNextTryDelay = function () {
                        return {
                            delayInMillisecondsBetweenPaymentsStatusPolling: -1,
                            maxPaymentsStatusPollingRetries: -1
                        };
                    };
                    return Instance;
                }());
                Manager.Instance = Instance;
                var PaymentRun = /** @class */ (function () {
                    function PaymentRun() {
                    }
                    /**
                     * @returns a string containing data to send to the provider
                     */
                    PaymentRun.prototype.GetFormattedData = function () {
                        var data = this.GetData();
                        return Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRunProvider.GetFormattedData", data) || JSON.stringify(data);
                    };
                    return PaymentRun;
                }());
                Manager.PaymentRun = PaymentRun;
            })(Manager = PaymentRunProvider.Manager || (PaymentRunProvider.Manager = {}));
        })(PaymentRunProvider = AP.PaymentRunProvider || (AP.PaymentRunProvider = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
