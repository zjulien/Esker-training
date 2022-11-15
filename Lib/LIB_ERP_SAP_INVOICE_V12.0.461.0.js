/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAP_Invoice_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Invoice document for SAP ERP - system library",
  "require": [
    "Lib_ERP_Invoice_V12.0.461.0",
    "Lib_ERP_SAP_Manager_V12.0.461.0",
    "Lib_AP_WorkflowCtrl_V12.0.461.0",
    "Lib_AP_Parameters_V12.0.461.0",
    "Lib_AP_Comment_Helper_V12.0.461.0",
    "[Lib_AP_SAP_Client_V12.0.461.0]",
    "[Lib_AP_SAP_Server_V12.0.461.0]",
    "Sys/Sys_Helpers_Promise"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAP;
        (function (SAP) {
            var ActionPostHelper = /** @class */ (function () {
                function ActionPostHelper() {
                }
                ActionPostHelper.prototype.Init = function (touchless) {
                    Lib.AP.CommentHelper.ResetReasonExcept();
                    Data.SetValue("CurrentAttachmentFlag__", Attach.GetNbAttach());
                    if (!Data.GetValue("PostingDate__")) {
                        Lib.AP.ComputeAndSetBackdatingTargetDate();
                        this.invoiceDocument.ComputePaymentAmountsAndDates(false, true, true);
                        Variable.SetValueAsString("AutoDeterminedPostingDate", "true");
                    }
                    if (!touchless && Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart && !Data.GetValue("ManualLink__")) {
                        //Update last used value for Non PO Invoices
                        this.SaveLastUsedValues();
                        this.SaveInvoiceProcessingParameters();
                    }
                };
                ActionPostHelper.prototype.DirectPost = function (touchless) {
                    Log.Info("Workflow completed - direct posting ...");
                    this.Init(touchless);
                    var alreadyPosted = Data.GetValue("ERPLinkingDate__");
                    if (alreadyPosted || this.SAPPost()) {
                        if (touchless) {
                            Lib.AP.WorkflowCtrl.DoAction("postTouchless");
                        }
                        else {
                            Lib.AP.WorkflowCtrl.SetObject("alreadyPosted", alreadyPosted);
                            if (alreadyPosted && Variable.GetValueAsString("InvoicePaymentBlock")) {
                                // Special case : posted with workflow, backToAP, then workflow emptied
                                // Unblock Payment
                                this.SAPUnblockPayment();
                            }
                            if (Lib.AP.InvoiceType.isConsignmentInvoice()) {
                                Lib.AP.WorkflowCtrl.DoAction("waitForClearing");
                            }
                            else {
                                Lib.AP.WorkflowCtrl.DoAction("post");
                            }
                        }
                    }
                };
                ActionPostHelper.prototype.WorkflowPost = function (currentRole, touchless) {
                    this.Init(touchless);
                    Log.Info(" --- WorkflowPost current role = " + currentRole);
                    if (currentRole === Lib.AP.WorkflowCtrl.roles.apStart || currentRole === Lib.AP.WorkflowCtrl.roles.apEnd) {
                        var lowPrivilegeAp = Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP();
                        var nextRoleIsController = Lib.AP.WorkflowCtrl.GetNextStepRole() !== Lib.AP.WorkflowCtrl.roles.controller;
                        var shouldPost = !lowPrivilegeAp && !Data.GetValue("ERPLinkingDate__") && nextRoleIsController;
                        if (shouldPost && this.SAPPost()) {
                            if (Lib.AP.InvoiceType.isConsignmentInvoice()) {
                                if (Lib.AP.WorkflowCtrl.GetNbRemainingApprovers() > 0) {
                                    Lib.AP.WorkflowCtrl.DoAction("requestApprovalForConsigment");
                                }
                                else {
                                    Lib.AP.WorkflowCtrl.DoAction("waitForClearing");
                                }
                            }
                            else if (!touchless) {
                                Lib.AP.WorkflowCtrl.DoAction("postAndRequestApproval");
                            }
                            else {
                                Lib.AP.WorkflowCtrl.DoAction("autoPostAndRequestApproval");
                            }
                        }
                        else if (!shouldPost) {
                            if (lowPrivilegeAp && nextRoleIsController) {
                                Lib.AP.WorkflowCtrl.DoAction("approve");
                            }
                            else if (!touchless) {
                                Lib.AP.WorkflowCtrl.DoAction("requestApproval");
                            }
                            else {
                                Lib.AP.WorkflowCtrl.DoAction("autoRequestApproval");
                            }
                        }
                    }
                    else if (currentRole === Lib.AP.WorkflowCtrl.roles.controller) {
                        Lib.AP.WorkflowCtrl.DoAction("approve");
                    }
                    else if (currentRole === Lib.AP.WorkflowCtrl.roles.approver) {
                        var shouldTryToUnblockPayment = Variable.GetValueAsString("InvoicePaymentBlock");
                        if (shouldTryToUnblockPayment) {
                            var shouldUnblockPayment = false;
                            if (Lib.AP.WorkflowCtrl.GetNextStepRole() !== Lib.AP.WorkflowCtrl.roles.approver) {
                                shouldUnblockPayment = true;
                            }
                            else {
                                //store current approver login
                                var currentUserOwnerId = Data.GetValue("LastValidatorUserId__");
                                var currentUser = Lib.AP.WorkflowCtrl.usersObject.GetUser(currentUserOwnerId);
                                var currentUserLogin = currentUser.GetValue("Login");
                                //retrieve next user
                                var index = Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex();
                                var nextContributor = null;
                                //unblock payment if all next approval steps will be automatically approved (same login than current approver)
                                do {
                                    index = index + 1;
                                    if (index < Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors()) {
                                        nextContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(index);
                                    }
                                    else {
                                        //no more contributors => we reached the end of the workflow
                                        nextContributor = null;
                                    }
                                } while (nextContributor && nextContributor.role === Lib.AP.WorkflowCtrl.roles.approver && currentUserLogin === nextContributor.login);
                                if (!nextContributor) {
                                    shouldUnblockPayment = true;
                                }
                            }
                            if (shouldUnblockPayment) {
                                this.SAPUnblockPayment();
                            }
                        }
                        Lib.AP.WorkflowCtrl.DoAction("approve");
                    }
                };
                // main actionPost
                ActionPostHelper.prototype.Perform = function (erpInvoiceDocument, touchless) {
                    this.invoiceDocument = erpInvoiceDocument;
                    var currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                    if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0
                        && Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) === 0
                        && !Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                        this.DirectPost(touchless);
                    }
                    else {
                        this.WorkflowPost(currentRole, touchless);
                    }
                };
                // extraFunc
                ActionPostHelper.prototype.SAPPost = function () {
                    if (Transaction.Read(Lib.ERP.Invoice.transaction.keys.post) === Lib.ERP.Invoice.transaction.values.beforePost) {
                        Log.Warn("Redis key " + Lib.ERP.Invoice.transaction.keys.post + " equal to " + Lib.ERP.Invoice.transaction.values.beforePost + " : Invoice may have been already posted");
                        Process.PreventApproval();
                        Lib.CommonDialog.NextAlert.Define("_PostingErrorTitle", "_PostingErrorDescription", { isError: true });
                        //Clean transaction lock when displaying popup
                        Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                    }
                    else {
                        var errors = null;
                        if (!Data.GetValue("ERPPostingDate__")) {
                            Log.Info("SAP posting");
                            Data.SetValue("ERPPostingError__", "");
                            // eslint-disable-next-line dot-notation
                            errors = Lib.AP.SAP.Invoice["Post"].ERPPost(this.ShouldBlockPayment());
                            if (errors) {
                                // If posting date was automatically set, remove the value
                                if (Variable.GetValueAsString("AutoDeterminedPostingDate")) {
                                    Data.SetValue("PostingDate__", null);
                                    Lib.AP.RestoreComputedPaymentTermsDate();
                                    Variable.SetValueAsString("AutoDeterminedPostingDate", null);
                                }
                                Process.PreventApproval();
                            }
                            else {
                                var today = new Date();
                                Data.SetValue("ERPPostingDate__", today);
                                Data.SetValue("ERPLinkingDate__", today);
                                // eslint-disable-next-line dot-notation
                                Lib.AP.SAP.Invoice["Post"].ERPAttachURLs();
                            }
                        }
                        else if (!Data.GetValue("ERPLinkingDate__")) {
                            Log.Info("SAP linking");
                            Data.SetValue("ERPLinkingDate__", new Date());
                            // eslint-disable-next-line dot-notation
                            Lib.AP.SAP.Invoice["Post"].ERPAttachURLs();
                        }
                        return !errors;
                    }
                    return false;
                };
                /* eslint-disable class-methods-use-this */
                ActionPostHelper.prototype.SAPUnblockPayment = function (mode) {
                    var unblockPaymentDone = true;
                    if (mode !== "manual") {
                        var invoiceType = Data.GetValue("InvoiceType__");
                        var nb = invoiceType === "PO Invoice" ? Data.GetValue("ERPMMInvoiceNumber__") : Data.GetValue("ERPInvoiceNumber__");
                        // eslint-disable-next-line dot-notation
                        unblockPaymentDone = Lib.AP.SAP.Invoice["UnblockPayment"](nb);
                    }
                    if (unblockPaymentDone) {
                        Data.SetValue("ERPPostingError__", "");
                        Data.SetValue("ERPPaymentBlocked__", false);
                        Data.SetValue("ShortStatus", "");
                        if (mode === "manual") {
                            Lib.AP.WorkflowCtrl.DoAction("unblockPaymentManually");
                        }
                        else if (mode === "retry") {
                            Lib.AP.WorkflowCtrl.DoAction("unblockPaymentRetry");
                        }
                    }
                    else {
                        var sapError = Sys.Helpers.SAP.GetLastError();
                        Data.SetValue("ERPPostingError__", sapError);
                        Data.SetValue("ERPPaymentBlocked__", true);
                        Data.SetValue("ShortStatus", Language.Translate("_Failed to unblock payment"));
                        Process.Forward(Lib.AP.WorkflowCtrl.GetWorkflowInitiator().login);
                    }
                };
                ActionPostHelper.prototype.ShouldBlockPayment = function () {
                    return Variable.GetValueAsString("InvoicePaymentBlock") !== "" && Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) > 0;
                };
                ActionPostHelper.prototype.SaveInvoiceProcessingParameters = function () {
                    Lib.AP.Parameters.SaveParameters(Data, Sys.Helpers.Database);
                };
                ActionPostHelper.prototype.SaveLastUsedValues = function () {
                    Lib.AP.Parameters.SaveTemplate(Lib.AP.Parameters.LineItemsPatternTable.LastUsedValues, Data, Sys.Helpers.Database);
                };
                return ActionPostHelper;
            }());
            SAP.ActionPostHelper = ActionPostHelper;
            var Invoice = /** @class */ (function (_super) {
                __extends(Invoice, _super);
                function Invoice(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.bapiCalculateTax = null;
                    _this.actionPostHelper = new Lib.ERP.SAP.ActionPostHelper();
                    _this.analyticAxis = Lib.ERP.Invoice.commonAnalyticAxis.concat([
                        "Assignment__",
                        "BusinessArea__",
                        "InternalOrder__",
                        "TaxJurisdiction__",
                        "TradingPartner__",
                        "WBSElement__"
                    ]);
                    return _this;
                }
                //////////////////////////////////////////
                // Overrides Lib.ERP.Invoice interface
                //////////////////////////////////////////
                Invoice.prototype.Create = function (touchless) {
                    this.actionPostHelper.Perform(this, touchless);
                };
                /**
                    * Return the list of the fields whom validity should be checked against the local tables
                    * @returns {StoredInLocalTableFieldResolvers} required An object containing all the required fields in the local tables
                    */
                Invoice.prototype.GetStoredInLocalTableFields = function () {
                    // Get default required fields
                    var storedInLocalTableFields = _super.prototype.GetStoredInLocalTableFields.call(this);
                    storedInLocalTableFields.Header.VendorNumber__ = false;
                    storedInLocalTableFields.Header.VendorName__ = false;
                    storedInLocalTableFields.Header.PaymentTerms__ = false;
                    storedInLocalTableFields.Header.SAPPaymentMethod__ = false;
                    storedInLocalTableFields.Header.AlternativePayee__ = false;
                    storedInLocalTableFields.LineItems__.GLAccount__ = false;
                    storedInLocalTableFields.LineItems__.TaxCode__ = false;
                    storedInLocalTableFields.LineItems__.CostCenter__ = false;
                    storedInLocalTableFields.LineItems__.InternalOrder__ = false;
                    storedInLocalTableFields.LineItems__.WBSElement__ = false;
                    return storedInLocalTableFields;
                };
                Invoice.prototype.GetTaxRate = function (item, successCallback, errorCallback, finalCallback) {
                    if (!this.bapiCalculateTax) {
                        this.bapiCalculateTax = Lib.AP.SAP.GetNewSAPTaxFromNetBapi();
                    }
                    this.bapiCalculateTax.GetTaxRateFromTaxCode(null, Data.GetValue("CompanyCode__"), item.GetValue("TaxCode__"), item.GetValue("TaxJurisdiction__"), Data.GetValue("InvoiceCurrency__"), successCallback, item, errorCallback, finalCallback);
                };
                Invoice.prototype.GetTaxRateAsync = function (item) {
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    var that = this;
                    return Sys.Helpers.Promise.Create(function (resolve, reject) {
                        if (!that.bapiCalculateTax) {
                            that.bapiCalculateTax = Lib.AP.SAP.GetNewSAPTaxFromNetBapi();
                        }
                        that.bapiCalculateTax.GetTaxRateFromTaxCode(null, Data.GetValue("CompanyCode__"), item.GetValue("TaxCode__"), item.GetValue("TaxJurisdiction__"), Data.GetValue("InvoiceCurrency__"), function (cbItem, cbTaxRate) {
                            resolve({ "item": cbItem, "taxRate": cbTaxRate, "nonDeductibleTaxRate": 0 });
                        }, item, function (cbItem, error, errorField, category) {
                            reject({ "item": cbItem, "error": error, "errorField": errorField, "errorCategory": category });
                        });
                    });
                };
                Invoice.prototype.SAPUnblockPayment = function (mode) {
                    this.actionPostHelper.SAPUnblockPayment(mode);
                };
                /**
                 * Allow to select a bank details from an IBAN number
                 * @memberof Lib.ERP.Invoice
                 * @param {Object} parameters Informations about the vendor
                 * @param {string} parameters.companyCode
                 * @param {string} parameters.vendorNumber
                 * @param {string} parameters.iban
                 */
                Invoice.prototype.SelectBankDetailsFromIBAN = function (parameters, resultCallback) {
                    function selectBankDetails(vendorsBankAccounts, params) {
                        if (vendorsBankAccounts.length > 0) {
                            Variable.SetValueAsString("BankDetails_TypeSelected", vendorsBankAccounts[0].Type);
                            resultCallback(vendorsBankAccounts[0], { hasBankAccount: params && params.hasBankAccount, isSilentChange: params && params.isSilentChange });
                        }
                        else {
                            resultCallback(null, { hasBankAccount: params && params.hasBankAccount, isSilentChange: params && params.isSilentChange });
                        }
                    }
                    this.GetVendorBankDetails(parameters, selectBankDetails);
                };
                /**
                * Retrieve the bank details based on the vendor informations
                * @param {Object} parameters Informations about the vendor
                * @param {string} parameters.companyCode
                * @param {string} parameters.vendorNumber
                * @param {string} parameters.iban Optionnal. Only bank account with matching iban will be returned.
                * @param {function} resultCallback Callback to call to fill the result table
                */
                Invoice.prototype.GetVendorBankDetails = function (parameters, resultCallback) {
                    var bnkaDone = false;
                    var ibanDone = false;
                    var accountsByKey = {};
                    var sapQuerySeparator = Sys.ScriptInfo.IsServer() ? "\n" : "|";
                    function getAccountByKey(country, key, account) {
                        var accountKey = "".concat(Sys.Helpers.String.SAP.Trim(country), ";").concat(Sys.Helpers.String.SAP.Trim(key), ";").concat(Sys.Helpers.String.SAP.Trim(account));
                        if (!accountsByKey[accountKey]) {
                            accountsByKey[accountKey] =
                                {
                                    Country: country,
                                    Key: key,
                                    Name: null,
                                    Account: account,
                                    Holder: null,
                                    IBAN: null,
                                    Type: null
                                };
                        }
                        return accountsByKey[accountKey];
                    }
                    function updateAccountsName(country, key, bankName) {
                        for (var accKey in accountsByKey) {
                            if (Object.prototype.hasOwnProperty.call(accountsByKey, accKey)) {
                                var acc = accountsByKey[accKey];
                                if (acc.Country === country && acc.Key === key) {
                                    acc.Name = bankName;
                                }
                            }
                        }
                    }
                    function returnCompletedResults() {
                        var accounts = [];
                        var hasBankAccount = false;
                        if (bnkaDone && ibanDone) {
                            for (var accountKey in accountsByKey) {
                                if (Object.prototype.hasOwnProperty.call(accountsByKey, accountKey)) {
                                    hasBankAccount = true;
                                    if (!parameters.iban || parameters.iban === accountsByKey[accountKey].IBAN) {
                                        accounts.push(accountsByKey[accountKey]);
                                    }
                                }
                            }
                            resultCallback(accounts, { hasBankAccount: hasBankAccount, isSilentChange: parameters.isSilentChange });
                        }
                    }
                    function completeBNKAFilter(filter, banks, bankl) {
                        var banksFilter = "BANKS = '".concat(banks, "'");
                        var banklFilter = "BANKL = '".concat(bankl, "'");
                        if (filter) {
                            filter += " OR ".concat(sapQuerySeparator, " ");
                        }
                        filter += "( ".concat(banksFilter, " ").concat(sapQuerySeparator, " AND ").concat(banklFilter, " )");
                        return filter;
                    }
                    function completeIBANFilter(filter, banks, bankl, bankn, bkont, iban) {
                        var banksFilter = "BANKS = '".concat(banks, "'");
                        var banklFilter = "BANKL = '".concat(bankl, "'");
                        var banknFilter = "BANKN = '".concat(bankn, "'");
                        var bkontFilter = "BKONT = '".concat(bkont, "'");
                        var ibanFilter = "IBAN = '".concat(iban, "'");
                        if (filter) {
                            filter += " OR ".concat(sapQuerySeparator, " ");
                        }
                        filter += "( ".concat(banksFilter, " ").concat(sapQuerySeparator, " AND ").concat(banklFilter, " ").concat(sapQuerySeparator, " AND ").concat(banknFilter, " ").concat(sapQuerySeparator, " AND ").concat(bkontFilter);
                        if (iban) {
                            filter += " ".concat(sapQuerySeparator, " AND ").concat(ibanFilter);
                        }
                        filter += " )";
                        return filter;
                    }
                    function lfbkCallback(results, error) {
                        if (error) {
                            Log.Error(error);
                        }
                        else if (results.length > 0) {
                            var bnkaFilter = "";
                            var ibanFilter = "";
                            for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                                var result = results_1[_i];
                                var account = getAccountByKey(result.BANKS, result.BANKL, result.BANKN);
                                account.Holder = result.KOINH;
                                account.Type = result.BVTYP;
                                bnkaFilter = completeBNKAFilter(bnkaFilter, account.Country, account.Key);
                                ibanFilter = completeIBANFilter(ibanFilter, account.Country, account.Key, account.Account, result.BKONT, parameters.iban);
                            }
                            var sapQueryOptionsIban = {
                                handler: Lib.AP.SAP.UsesWebServices() ? Lib.AP.SAP.SAPQueryClientServerHandler() : null
                            };
                            Sys.GenericAPI.SAPQuery(Variable.GetValueAsString("SAPConfiguration"), "BNKA", bnkaFilter, ["BANKS", "BANKL", "BANKA"], bnkaCallback, 10, sapQueryOptionsIban);
                            Sys.GenericAPI.SAPQuery(Variable.GetValueAsString("SAPConfiguration"), "TIBAN", ibanFilter, ["BANKS", "BANKL", "BANKN", "IBAN"], ibanCallback, 10, sapQueryOptionsIban);
                        }
                        else {
                            bnkaDone = true;
                            ibanDone = true;
                            returnCompletedResults();
                        }
                    }
                    function bnkaCallback(results, error) {
                        if (error) {
                            Log.Error(error);
                            bnkaDone = true;
                        }
                        else {
                            for (var _i = 0, results_2 = results; _i < results_2.length; _i++) {
                                var result = results_2[_i];
                                updateAccountsName(result.BANKS, result.BANKL, result.BANKA);
                            }
                            bnkaDone = true;
                            returnCompletedResults();
                        }
                    }
                    function defaultAlternativePayeeCallback(results, error) {
                        Variable.SetValueAsString("DefaultAlternativePayee", "");
                        if (error) {
                            Log.Error(error);
                        }
                        else if (results.length > 0) {
                            Variable.SetValueAsString("DefaultAlternativePayee", results[0].LNRZA);
                        }
                        var filter = "LIFNR = '".concat(Sys.Helpers.String.SAP.NormalizeID(parameters.vendorNumber, 10), "'");
                        var LFBKSapQueryOptions = Lib.AP.SAP.UsesWebServices() ? { handler: Lib.AP.SAP.SAPQueryClientServerHandler() } : null;
                        Sys.GenericAPI.SAPQuery(Variable.GetValueAsString("SAPConfiguration"), "LFBK", filter, ["BANKS", "BANKL", "BANKN", "KOINH", "MANDT", "BKONT", "BVTYP"], lfbkCallback, 10, LFBKSapQueryOptions);
                    }
                    function ibanCallback(results, error) {
                        if (error) {
                            Log.Error(error);
                            ibanDone = true;
                        }
                        else {
                            for (var _i = 0, results_3 = results; _i < results_3.length; _i++) {
                                var result = results_3[_i];
                                var account = getAccountByKey(result.BANKS, result.BANKL, result.BANKN);
                                account.IBAN = result.IBAN;
                            }
                            ibanDone = true;
                            returnCompletedResults();
                        }
                    }
                    var defaultAlternativePayeeFilter = "BUKRS = '".concat(parameters.companyCode, "' AND LIFNR = '").concat(Sys.Helpers.String.SAP.NormalizeID(parameters.vendorNumber, 10), "'");
                    var sapQueryOptions = Lib.AP.SAP.UsesWebServices() ? { handler: Lib.AP.SAP.SAPQueryClientServerHandler(), silentChangeForCallback: parameters.isSilentChange } : { silentChangeForCallback: parameters.isSilentChange };
                    Sys.GenericAPI.SAPQuery(Variable.GetValueAsString("SAPConfiguration"), "ZESK_VENDORS", defaultAlternativePayeeFilter, ["LNRZA"], defaultAlternativePayeeCallback, 1, sapQueryOptions);
                };
                /**
                * Found vendor number based on IBANS informations
                * @param {Object} parameters Informations about the vendor
                * @param {string} parameters.companyCode
                * @param {string[]} parameters.ibans
                * @param {function} resultCallback Callback to call to fill the result table
                */
                Invoice.prototype.GetFirstVendorNumberFromIBANS = function (parameters, resultCallback) {
                    var sapQuerySeparator = Sys.ScriptInfo.IsServer() ? "\n" : "|";
                    var currentIban = null;
                    function lfbkCallback(results, error) {
                        if (error) {
                            Log.Error(error);
                        }
                        else if (results && results.length > 0) {
                            resultCallback(Sys.Helpers.String.SAP.TrimLeadingZeroFromID(results[0].LIFNR), currentIban);
                            return;
                        }
                        resultCallback();
                    }
                    function getLFBKFilter(banks, bankl, bankn) {
                        var banksFilter = "BANKS = '".concat(banks, "'");
                        var banklFilter = "BANKL = '".concat(bankl, "'");
                        var banknFilter = "BANKN = '".concat(bankn, "'");
                        return "( ".concat(banksFilter, " ").concat(sapQuerySeparator, " AND ").concat(banklFilter, " ").concat(sapQuerySeparator, " AND ").concat(banknFilter, " )");
                    }
                    function ibanCallback(results, error) {
                        if (error) {
                            Log.Error(error);
                        }
                        else if (results && results.length > 0) {
                            var result = results[0];
                            currentIban = result.IBAN;
                            var filter = getLFBKFilter(result.BANKS, result.BANKL, result.BANKN);
                            var LFBKSapQueryOptions = Lib.AP.SAP.UsesWebServices() ? { handler: Lib.AP.SAP.SAPQueryClientServerHandler() } : null;
                            Sys.GenericAPI.SAPQuery(Variable.GetValueAsString("SAPConfiguration"), "LFBK", filter, ["LIFNR"], lfbkCallback, 10, LFBKSapQueryOptions);
                            return;
                        }
                        resultCallback();
                    }
                    function getIBANSFilter(ibans) {
                        var filter = "";
                        for (var _i = 0, ibans_1 = ibans; _i < ibans_1.length; _i++) {
                            var iban = ibans_1[_i];
                            if (filter) {
                                filter = "".concat(filter, " ").concat(sapQuerySeparator, " OR ");
                            }
                            filter = "".concat(filter, "IBAN = '").concat(iban, "'");
                        }
                        return "( ".concat(filter, " )");
                    }
                    if (parameters.ibans && parameters.ibans.length >= 1) {
                        var filter = getIBANSFilter(parameters.ibans);
                        var sapQueryOptions = Lib.AP.SAP.UsesWebServices() ? { handler: Lib.AP.SAP.SAPQueryClientServerHandler() } : null;
                        Sys.GenericAPI.SAPQuery(Variable.GetValueAsString("SAPConfiguration"), "TIBAN", filter, ["MANDT", "BANKS", "BANKL", "BANKN", "IBAN"], ibanCallback, 1, sapQueryOptions);
                    }
                    else {
                        resultCallback();
                    }
                };
                Invoice.prototype.GetDemoCompanyCode = function () {
                    return "1000";
                };
                Invoice.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    return true;
                };
                /**
                    * Indicate if the local PO table should be updated
                    * @returns {boolean} true when it should update the local PO Table (always false)
                    */
                Invoice.prototype.ShouldUpdateLocalPOTable = function () {
                    return false;
                };
                /**
                 * SAP is connected for the POST.
                 * @returns {boolean} Always true
                 */
                Invoice.prototype.IsPostConnected = function () {
                    return true;
                };
                /**
                 * Prohibit dynamic discounting for ERP SAP
                 * @returns {boolean} Always false
                 */
                Invoice.prototype.IsDynamicDiscountingAllowed = function () {
                    return false;
                };
                return Invoice;
            }(Lib.ERP.Invoice.Instance));
            SAP.Invoice = Invoice;
        })(SAP = ERP.SAP || (ERP.SAP = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
