/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_AP_PaymentRunProvider_NvoicePay_Manager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "PaymentRunProvider Manager for NvoicePay",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Object",
    "LIB_AP_V12.0.461.0",
    "Lib_AP_PaymentRunProvider_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var PaymentRunProvider;
        (function (PaymentRunProvider) {
            var NvoicePay;
            (function (NvoicePay) {
                var NvoicePayErrorMessage;
                (function (NvoicePayErrorMessage) {
                    NvoicePayErrorMessage["NoError"] = "NoError";
                    NvoicePayErrorMessage["Pending"] = "Pending";
                    // IsAPIUp = false
                    NvoicePayErrorMessage["TemporaryPostError"] = "TemporaryPostError";
                    NvoicePayErrorMessage["TemporaryPaymentPollingError"] = "TemporaryPaymentPollingError";
                    // Auth failed - configuration might be reloaded
                    NvoicePayErrorMessage["ConfigurationError"] = "ConfigurationError";
                    // Generic errors
                    NvoicePayErrorMessage["PostError"] = "PostError";
                    NvoicePayErrorMessage["PaymentPollingError"] = "PaymentPollingError";
                    // Specific errors (for an invoice or a payment)
                    NvoicePayErrorMessage["AwaitingRateApproval"] = "AwaitingRateApproval";
                    NvoicePayErrorMessage["InvoiceInError"] = "InvoiceInError";
                    NvoicePayErrorMessage["CanceledByProvider"] = "CanceledByProvider";
                })(NvoicePayErrorMessage = NvoicePay.NvoicePayErrorMessage || (NvoicePay.NvoicePayErrorMessage = {}));
                // Statuses returned by GetInvoiceBatch
                var paymentBatchStatusMapping = new Map([
                    ["ReturnFileReady", NvoicePayErrorMessage.NoError],
                    ["ValidationError", NvoicePayErrorMessage.PaymentPollingError],
                    // TODO : for now we consider DoneParsing status means payment batch has been voided
                    // but it's not the correct status and could lead to consider not yet processed batch to be considered as voided
                    ["DoneParsing", NvoicePayErrorMessage.CanceledByProvider]
                ]);
                // Payment statuses
                var paymentStatusesMapping = new Map([
                    ["Ready", NvoicePayErrorMessage.NoError],
                    ["International Processing", NvoicePayErrorMessage.NoError],
                    ["AwaitingRateApproval", NvoicePayErrorMessage.AwaitingRateApproval]
                ]);
                // Invoices statuses (from the ErrorInvoice node)
                var errorInvoiceMapping = new Map([
                    ["VendorResolutionFinished", NvoicePayErrorMessage.NoError]
                ]);
                var paymentMethodsMapping = new Map([
                    ["IWIRE", Lib.AP.PaymentMethod.EFT],
                    ["PrintCheck", Lib.AP.PaymentMethod.Check]
                ]);
                // Map NvoicePay specific errors with generic provider errors
                var ProviderStatusMapping = new Map([
                    [NvoicePayErrorMessage.NoError, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.NoError],
                    [NvoicePayErrorMessage.Pending, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.Pending],
                    // Errors that require reloading configuration settings
                    [NvoicePayErrorMessage.ConfigurationError, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.ConfigurationError],
                    // Other errors
                    [NvoicePayErrorMessage.AwaitingRateApproval, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.UserActionNeeded],
                    [NvoicePayErrorMessage.TemporaryPostError, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.UserActionNeeded],
                    [NvoicePayErrorMessage.TemporaryPaymentPollingError, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.UserActionNeeded],
                    [NvoicePayErrorMessage.PostError, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.UserActionNeeded],
                    [NvoicePayErrorMessage.PaymentPollingError, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.UserActionNeeded],
                    [NvoicePayErrorMessage.InvoiceInError, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.UserActionNeeded],
                    [NvoicePayErrorMessage.CanceledByProvider, Lib.AP.PaymentRunProvider.Manager.ProviderStatus.UserActionNeeded]
                ]);
                // This function returns a weight for every possible error message returned by NvoicePay.
                // It is used to determine witch one show if there's several invoices in different status.
                function GetErrorMessageWeight(message) {
                    switch (message) {
                        case undefined:
                            return -1;
                        case NvoicePayErrorMessage.NoError:
                            return 0;
                        case NvoicePayErrorMessage.Pending:
                            return 10;
                        case NvoicePayErrorMessage.AwaitingRateApproval:
                            return 50;
                        case NvoicePayErrorMessage.PostError:
                        case NvoicePayErrorMessage.TemporaryPostError:
                        case NvoicePayErrorMessage.PaymentPollingError:
                        case NvoicePayErrorMessage.TemporaryPaymentPollingError:
                        case NvoicePayErrorMessage.ConfigurationError:
                        case NvoicePayErrorMessage.InvoiceInError:
                        case NvoicePayErrorMessage.CanceledByProvider:
                        default:
                            return 100;
                    }
                }
                function WorstErrorMessage(status1, status2) {
                    var status1Weight = GetErrorMessageWeight(status1);
                    var status2Weight = GetErrorMessageWeight(status2);
                    return status1Weight > status2Weight ? status1 : status2;
                }
                NvoicePay.WorstErrorMessage = WorstErrorMessage;
                function tryGetExistingBatchID() {
                    return Data.GetValue("PaymentRunId__") || Transaction.Read("paymentBatchId");
                }
                var UrlAliases = /** @class */ (function () {
                    function UrlAliases(useDemoAPI) {
                        var aliasSuffix = useDemoAPI ? "DEMO" : "PROD";
                        if (useDemoAPI && !UrlAliases.IsNewIdendityServerAvailaible()) {
                            this.auth = "NVoicePay-Authent";
                        }
                        else {
                            this.auth = "NVoicePay-Authent-".concat(aliasSuffix);
                        }
                        this.api = "NVoicePay-API-".concat(aliasSuffix);
                        this.check = "NVoicePay-Check-".concat(aliasSuffix);
                    }
                    UrlAliases.IsNewIdendityServerAvailaible = function () {
                        // Starting Jan 31st 2022 the new URL for partners will be available
                        var now = new Date();
                        return now > new Date(2022, 0, 31, 12, 0, 0);
                    };
                    return UrlAliases;
                }());
                var Manager = /** @class */ (function (_super) {
                    __extends(Manager, _super);
                    function Manager() {
                        var _this = _super.call(this, "NvoicePay") || this;
                        _this.endpoints = {
                            postInvoiceBatch: "Invoice/uploadCompleteInvoiceBatch",
                            getReturnFile: "ReturnFile/getReturnFile",
                            getInvoiceBatch: "Invoice/getInvoiceBatch"
                        };
                        var apParameters = Sys.Parameters.GetInstance("AP");
                        _this.urlAliases = new UrlAliases(apParameters.GetParameter("UseNVoicePayDemoAPI", "") === "1");
                        _this.bankAccountId = apParameters.GetParameter("PaymentProviderBankAccountId", "");
                        _this.locationId = apParameters.GetParameter("PaymentProviderLocationId", "");
                        _this.companyId = apParameters.GetParameter("PaymentProviderCompanyId", "");
                        _this.SetClientID(apParameters.GetParameter("PaymentProviderLogin", ""));
                        _this.SetClientSecret(apParameters.GetParameter("PaymentProviderPassword", ""));
                        _this.SetResponseLanguage("EN");
                        _this.SetTokenExpirationDate(0);
                        _this.ExtendDefinition({
                            paymentPollingDelayBeforeReturnFile: 1000 * 60 * 5,
                            paymentPollingDelayAfterReturnFileFirstTry: 1000 * 60 * 5,
                            paymentPollingDelayAfterReturnFile: 1000 * 60 * 60 * 24,
                            maxPaymentPollingRetriesBeforeReturnFile: 5,
                            maxPaymentPollingRetriesAfterReturnFile: 30
                        });
                        _this.LoadCustomSettings();
                        return _this;
                    }
                    Manager.prototype.QueryPaymentRunProvider = function (requestParams) {
                        // Force the response to be JSON if the header wasn't set. Right now this is needed for getReturnFile, but used everywhere as a safety
                        requestParams.headers = requestParams.headers || {};
                        if (!requestParams.headers.Accept) {
                            requestParams.headers.Accept = "application/json";
                        }
                        return _super.prototype.QueryPaymentRunProvider.call(this, requestParams);
                    };
                    Manager.prototype.Post = function () {
                        // Check if the batch has already been posted
                        var existingBatchID = tryGetExistingBatchID();
                        if (existingBatchID) {
                            Data.SetValue("PaymentRunId__", existingBatchID);
                            if (!Data.GetValue("PaymentRunDate__")) {
                                Data.SetValue("PaymentRunDate__", new Date());
                                Data.SetValue("PaymentRunDateDisplay__", Data.GetValue("PaymentRunDate__").toLocaleDateString());
                            }
                            return this.GetDetailedStatus(NvoicePayErrorMessage.NoError);
                        }
                        if (!this.IsAPIUp()) {
                            return this.GetDetailedStatus(NvoicePayErrorMessage.TemporaryPostError);
                        }
                        if (!this.IsQueryPossible()) {
                            // Likely we couldn't authentificate to NvoicePay, it might be due to a configuration error on our side
                            return this.GetDetailedStatus(NvoicePayErrorMessage.ConfigurationError);
                        }
                        // Post
                        var response = this.QueryPaymentRunProvider({
                            method: "POST",
                            url: this.urlAliases.api,
                            urlSuffix: this.endpoints.postInvoiceBatch,
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer ".concat(this.GetToken())
                            },
                            data: this.GetPaymentRun().GetFormattedData()
                        });
                        if (!(response && response.status === 200 && response.data)) {
                            var msg = response ? "(HTTP Error ".concat(response.status, ")") : "";
                            Log.Error("Error while trying to post invoice batch ".concat(msg));
                            return this.GetDetailedStatus(NvoicePayErrorMessage.PostError);
                        }
                        var jsonResponseData = null;
                        try {
                            jsonResponseData = JSON.parse(response.data);
                        }
                        catch (e) {
                            Log.Error("Payment batch ID could not be retrieved");
                        }
                        if (jsonResponseData && jsonResponseData.paymentBatchID) {
                            Transaction.Write("paymentBatchId", jsonResponseData.paymentBatchID);
                            Data.SetValue("PaymentRunDate__", new Date());
                            Data.SetValue("PaymentRunDateDisplay__", Data.GetValue("PaymentRunDate__").toLocaleDateString());
                            Data.SetValue("PaymentRunId__", jsonResponseData.paymentBatchID);
                            return this.GetDetailedStatus(NvoicePayErrorMessage.NoError);
                        }
                        // Something gone wrong during post
                        return this.GetDetailedStatus(NvoicePayErrorMessage.PostError);
                    };
                    Manager.prototype.GetPaymentStatuses = function (paymentStatuses) {
                        if (!this.IsAPIUp()) {
                            return this.GetDetailedStatus(NvoicePayErrorMessage.TemporaryPaymentPollingError);
                        }
                        if (!this.IsQueryPossible()) {
                            // Likely we couldn't authentificate to NvoicePay, it might be due to a configuration error on our side
                            return this.GetDetailedStatus(NvoicePayErrorMessage.ConfigurationError);
                        }
                        var requestData = {
                            paymentBatchID: Data.GetValue("PaymentRunId__"),
                            companyID: this.GetCompanyId()
                        };
                        if (!this.IsReturnFileReady()) {
                            // If it's not already done, we want to check a return file is available by checking the payment batch status
                            var paymentBatchStatus = this.GetPaymentBatchStatus(requestData);
                            if (paymentBatchStatus.status !== Lib.AP.PaymentRunProvider.Manager.ProviderStatus.NoError) {
                                // if returnFile is not ready, there's no need yet to call the getReturnFile API
                                return paymentBatchStatus;
                            }
                            // returnFile is ready so we don't want to check it again the next time we would retrieve payment statuses
                            this.SetReturnFileAsReady();
                        }
                        this.IncrementTryCountSinceReturnFileReady();
                        // Poll return file
                        var returnFileContent = this.PollReturnFile(requestData);
                        if (!returnFileContent) {
                            // Could not poll returnfile
                            return this.GetDetailedStatus(NvoicePayErrorMessage.PaymentPollingError);
                        }
                        this.AttachReturnFile(returnFileContent);
                        var responseData = JSON.parse(returnFileContent);
                        var paymentBatchStatusToReturn = NvoicePayErrorMessage.NoError;
                        // Handle Payments node
                        paymentBatchStatusToReturn = this.HandleReturnFilePaymentsNode(responseData, paymentStatuses, paymentBatchStatusToReturn);
                        // Handle ErrorInvoices node
                        paymentBatchStatusToReturn = this.HandleReturnFileErrorInvoicesNode(responseData, paymentStatuses, paymentBatchStatusToReturn);
                        return this.GetDetailedStatus(paymentBatchStatusToReturn);
                    };
                    Manager.prototype.GetPaymentBatchStatus = function (requestData) {
                        requestData.includeInvoices = true;
                        var response = this.QueryPaymentRunProvider({
                            method: "POST",
                            url: this.urlAliases.api,
                            urlSuffix: this.endpoints.getInvoiceBatch,
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json",
                                "Authorization": "Bearer ".concat(this.GetToken())
                            },
                            data: JSON.stringify(requestData)
                        });
                        if (!(response && response.status === 200 && response.data)) {
                            var msg = response ? "(HTTP Error ".concat(response.status, ")") : "";
                            Log.Error("Error while trying to get payment batch status ".concat(msg));
                            return this.GetDetailedStatus(NvoicePayErrorMessage.PaymentPollingError);
                        }
                        try {
                            var responseData = JSON.parse(response.data);
                            return this.GetDetailedStatus(paymentBatchStatusMapping.get(responseData.status) || NvoicePayErrorMessage.Pending);
                        }
                        catch (exception) {
                            Log.Error("Invalid reponse from getInvoiceBatch API: ".concat(response.data));
                            return this.GetDetailedStatus(NvoicePayErrorMessage.PaymentPollingError);
                        }
                    };
                    Manager.prototype.PollReturnFile = function (requestData) {
                        var response = this.QueryPaymentRunProvider({
                            method: "POST",
                            url: this.urlAliases.api,
                            urlSuffix: this.endpoints.getReturnFile,
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json",
                                "Authorization": "Bearer ".concat(this.GetToken())
                            },
                            data: JSON.stringify(requestData)
                        });
                        if (!(response && response.status === 200 && response.data)) {
                            var msg = response ? "(HTTP Error ".concat(response.status, ")") : "";
                            Log.Error("Error while trying to post invoice batch ".concat(msg));
                            return null;
                        }
                        return response.data;
                    };
                    Manager.prototype.HandleReturnFilePaymentsNode = function (responseData, paymentStatuses, currentWorstErrorMessage) {
                        // With this we can use the same code whether Payment is an array or a single value
                        // This helps shortening and clarifying the function
                        var paymentList = Array.isArray(responseData.ReturnFile.Payments.Payment) ? responseData.ReturnFile.Payments.Payment : [responseData.ReturnFile.Payments.Payment];
                        // Loop through payments
                        for (var _i = 0, paymentList_1 = paymentList; _i < paymentList_1.length; _i++) {
                            var payment = paymentList_1[_i];
                            // See if the payment status is known, else consider the payment is pending
                            var paymentStatus = paymentStatusesMapping.get(payment.PaymentStatus) || NvoicePayErrorMessage.Pending;
                            currentWorstErrorMessage = WorstErrorMessage(currentWorstErrorMessage, paymentStatus);
                            if (paymentStatus === NvoicePayErrorMessage.NoError) {
                                // Payment successfull - set payment method
                                var paymentMethod = paymentMethodsMapping.get(payment.PaymentMethod) || Lib.AP.PaymentMethod.Other;
                                var invoiceList = Array.isArray(payment.Invoices.Invoice) ? payment.Invoices.Invoice : [payment.Invoices.Invoice];
                                for (var _a = 0, invoiceList_1 = invoiceList; _a < invoiceList_1.length; _a++) {
                                    var invoice = invoiceList_1[_a];
                                    var paymentInfos = {
                                        Status: PaymentRunProvider.Manager.InvoicePaymentStatus.Paid,
                                        PaymentMethod: paymentMethod,
                                        PaymentDate: payment.PaymentDate,
                                        PaymentReference: payment.ReferenceNumber
                                    };
                                    paymentStatuses.set(invoice.InvoiceRef, paymentInfos);
                                }
                            }
                        }
                        return currentWorstErrorMessage;
                    };
                    Manager.prototype.HandleReturnFileErrorInvoicesNode = function (responseData, paymentStatuses, currentWorstErrorMessage) {
                        if (responseData.ReturnFile.ErrorInvoices && responseData.ReturnFile.ErrorInvoices.ErrorInvoice) {
                            // Loop through invoices in error
                            // The node ErrorInvoice contains a list of invoices in error for the batch
                            // Based on our current knowledge those invoices are excluded on Nvoicepay side and no more actions can be done (excluded and wont be paid)
                            var errorInvoiceList = Array.isArray(responseData.ReturnFile.ErrorInvoices.ErrorInvoice) ?
                                responseData.ReturnFile.ErrorInvoices.ErrorInvoice : [responseData.ReturnFile.ErrorInvoices.ErrorInvoice];
                            for (var _i = 0, errorInvoiceList_1 = errorInvoiceList; _i < errorInvoiceList_1.length; _i++) {
                                var errorInvoice = errorInvoiceList_1[_i];
                                paymentStatuses.set(errorInvoice.InvoiceRef, {
                                    Status: PaymentRunProvider.Manager.InvoicePaymentStatus.Rejected,
                                    PaymentMethod: null,
                                    PaymentDate: null,
                                    PaymentReference: null,
                                    ErrorMessage: errorInvoice.ErrorMessage
                                });
                                var invoiceStatus = errorInvoiceMapping.get(errorInvoice.ErrorMessage)
                                    || NvoicePayErrorMessage.InvoiceInError;
                                currentWorstErrorMessage = WorstErrorMessage(currentWorstErrorMessage, invoiceStatus);
                            }
                        }
                        return currentWorstErrorMessage;
                    };
                    Manager.prototype.AttachReturnFile = function (returnFileData) {
                        var returnFile = TemporaryFile.CreateFile("json", "utf8");
                        if (!TemporaryFile.Append(returnFile, returnFileData)) {
                            Log.Error("Couldn't append return file data to temporary file");
                            return;
                        }
                        if (!Attach.AttachTemporaryFile(returnFile, "return_file_nvoicepay_" + new Date().toISOString())) {
                            Log.Error("Couldn't attach temporary file containing the return file data");
                        }
                    };
                    Manager.prototype.IsAPIUp = function () {
                        var response = this.QueryPaymentRunProvider({
                            method: "POST",
                            url: this.urlAliases.check
                        });
                        return response.status === 200;
                    };
                    Manager.prototype.IsAuthentified = function () {
                        return !!(this.GetToken() && this.GetTokenExpirationTimestamp() > Date.now());
                    };
                    Manager.prototype.Authentify = function () {
                        if (this.IsAuthentified()) {
                            return null;
                        }
                        var response = this.QueryPaymentRunProvider({
                            method: "POST",
                            url: this.urlAliases.auth,
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            data: "client_id=".concat(this.GetClientID(), "&client_secret=").concat(this.GetClientSecret(), "&grant_type=client_credentials")
                        });
                        if (response && response.status === 200 && response.data) {
                            var parsedData = null;
                            try {
                                parsedData = JSON.parse(response.data);
                            }
                            catch (e) {
                                return "Corpay authent exception: ".concat(e);
                            }
                            if (parsedData && parsedData.access_token) {
                                this.SetToken(parsedData.access_token);
                                this.SetTokenExpirationDate(Date.now() + (parsedData.expires_in * 1000));
                                Log.Info("Successful authentication to Corpay");
                                return null;
                            }
                        }
                        return "Corpay authent exception: bad response or no response data";
                    };
                    // Payment polling
                    Manager.prototype.GetNextTryDelay = function () {
                        var RetryDelay = {
                            delayInMillisecondsBetweenPaymentsStatusPolling: -1,
                            maxPaymentsStatusPollingRetries: -1
                        };
                        if (this.IsReturnFileReady()) {
                            RetryDelay.maxPaymentsStatusPollingRetries = this.GetMaxPaymentPollingRetriesAfterReturnFile();
                            if (this.IsFirstTrySinceReturnFileReady()) {
                                RetryDelay.delayInMillisecondsBetweenPaymentsStatusPolling = this.GetPaymentPollingDelayAfterReturnFileFirstTry();
                            }
                            else {
                                RetryDelay.delayInMillisecondsBetweenPaymentsStatusPolling = this.GetPaymentPollingDelayAfterReturnFile();
                            }
                        }
                        else {
                            RetryDelay.maxPaymentsStatusPollingRetries = this.GetMaxPaymentPollingRetriesBeforeReturnFile();
                            RetryDelay.delayInMillisecondsBetweenPaymentsStatusPolling = this.GetPaymentPollingDelayBeforeReturnFile();
                        }
                        return RetryDelay;
                    };
                    Manager.prototype.SetToken = function (token) {
                        this.token = token;
                    };
                    Manager.prototype.SetTokenExpirationDate = function (timestamp) {
                        this.tokenExpirationTimestamp = timestamp;
                    };
                    Manager.prototype.GetToken = function () {
                        return this.token;
                    };
                    Manager.prototype.GetTokenExpirationTimestamp = function () {
                        return this.tokenExpirationTimestamp;
                    };
                    Manager.prototype.GetCompanyId = function () {
                        return this.companyId;
                    };
                    Manager.prototype.GetBankAccountId = function () {
                        return this.bankAccountId;
                    };
                    Manager.prototype.GetLocationId = function () {
                        return this.locationId;
                    };
                    Manager.prototype.IsReturnFileReady = function () {
                        return Variable.GetValueAsString("NvoicepayReturnFileIsReady") === "1";
                    };
                    Manager.prototype.SetReturnFileAsReady = function () {
                        Variable.SetValueAsString("NvoicepayReturnFileIsReady", "1");
                        Variable.SetValueAsString("CurrentNumberOfRetries", "0");
                    };
                    Manager.prototype.IsFirstTrySinceReturnFileReady = function () {
                        return Variable.GetValueAsString("NvoicepayTryCountSinceReturnFileReady") === "0";
                    };
                    Manager.prototype.IncrementTryCountSinceReturnFileReady = function () {
                        var tryCountSinceReturnFileReady = parseInt(Variable.GetValueAsString("NvoicepayTryCountSinceReturnFileReady"), 10);
                        Variable.SetValueAsString("NvoicepayTryCountSinceReturnFileReady", (isNaN(tryCountSinceReturnFileReady) ? 0 : tryCountSinceReturnFileReady + 1).toString());
                    };
                    Manager.prototype.GetDetailedStatus = function (message) {
                        // Workaround - handling voided batches
                        // Always ignore the first "Batch cancelled" error
                        // This is because voided batches appears as "DoneParsing", like batches still in processing...
                        // Todo => remove this once we got a solution to identify voided batches
                        if (message === NvoicePayErrorMessage.CanceledByProvider) {
                            if (Variable.GetValueAsString("BatchWasDoneParsingLastTime") !== "1") {
                                Variable.SetValueAsString("BatchWasDoneParsingLastTime", "1");
                                message = NvoicePayErrorMessage.Pending;
                            }
                        }
                        return {
                            status: ProviderStatusMapping.get(message),
                            description: message
                        };
                    };
                    // Payment polling
                    Manager.prototype.GetPaymentPollingDelayBeforeReturnFile = function () {
                        return this.GetProperty("paymentPollingDelayBeforeReturnFile");
                    };
                    Manager.prototype.GetPaymentPollingDelayAfterReturnFileFirstTry = function () {
                        return this.GetProperty("paymentPollingDelayAfterReturnFileFirstTry");
                    };
                    Manager.prototype.GetPaymentPollingDelayAfterReturnFile = function () {
                        return this.GetProperty("paymentPollingDelayAfterReturnFile");
                    };
                    Manager.prototype.GetMaxPaymentPollingRetriesBeforeReturnFile = function () {
                        return this.GetProperty("maxPaymentPollingRetriesBeforeReturnFile");
                    };
                    Manager.prototype.GetMaxPaymentPollingRetriesAfterReturnFile = function () {
                        return this.GetProperty("maxPaymentPollingRetriesAfterReturnFile");
                    };
                    return Manager;
                }(PaymentRunProvider.Manager.Instance));
                NvoicePay.Manager = Manager;
                PaymentRunProvider.NvoicePay.Manager.prototype.paymentRunFactory = null;
            })(NvoicePay = PaymentRunProvider.NvoicePay || (PaymentRunProvider.NvoicePay = {}));
        })(PaymentRunProvider = AP.PaymentRunProvider || (AP.PaymentRunProvider = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
    Lib.AP.PaymentRunProvider.Manager.factories.NvoicePay = function () {
        return new Lib.AP.PaymentRunProvider.NvoicePay.Manager();
    };
})(Lib || (Lib = {}));
