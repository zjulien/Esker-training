/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_Invoice_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base Invoice document for ERP - system library",
  "require": [
    "Lib_ERP_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "[LIB_AP_CONTRACT_V12.0.461.0]"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Invoice;
        (function (Invoice) {
            var ActionPostHelper = /** @class */ (function () {
                function ActionPostHelper() {
                }
                ActionPostHelper.prototype.Init = function (touchless) {
                    Lib.AP.CommentHelper.ResetReasonExcept();
                    Data.SetValue("CurrentAttachmentFlag__", Attach.GetNbAttach());
                    if (!Data.GetValue("PostingDate__")) {
                        Lib.AP.ComputeAndSetBackdatingTargetDate();
                        Variable.SetValueAsString("AutoDeterminedPostingDate", "true");
                        this.invoiceDocument.ComputePaymentAmountsAndDates(false, true, true);
                    }
                    if (!touchless && Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart) {
                        //Update last used value for Non PO Invoices
                        Lib.ERP.Invoice.saveLastUsedValues();
                        Lib.ERP.Invoice.saveInvoiceProcessingParameters();
                    }
                };
                ActionPostHelper.prototype.DirectPost = function (touchless) {
                    Log.Info("Workflow completed - direct posting ...");
                    this.Init(touchless);
                    if (touchless) {
                        Lib.AP.WorkflowCtrl.DoAction("postTouchless");
                    }
                    else if (Lib.AP.InvoiceType.isConsignmentInvoice()) {
                        Lib.AP.WorkflowCtrl.DoAction("waitForClearing");
                    }
                    else {
                        Lib.AP.WorkflowCtrl.DoAction("post");
                    }
                };
                ActionPostHelper.prototype.WorkflowPost = function (currentRole, touchless) {
                    this.Init(touchless);
                    Log.Info(" --- WorkflowPost current role = " + currentRole);
                    if (currentRole === Lib.AP.WorkflowCtrl.roles.apStart || currentRole === Lib.AP.WorkflowCtrl.roles.apEnd) {
                        var alreadyPosted = Data.GetValue("ManualLink__");
                        if (alreadyPosted) {
                            Log.Info(" --- WorkflowPost : Manual Link (Do not post)");
                        }
                        if (!alreadyPosted && !Data.GetValue("ERPPostingDate__") && Lib.AP.WorkflowCtrl.GetNextStepRole() !== Lib.AP.WorkflowCtrl.roles.controller) {
                            if (!Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                                if (Lib.AP.InvoiceType.isConsignmentInvoice()) {
                                    Lib.AP.WorkflowCtrl.DoAction("waitForClearing");
                                }
                                else if (!touchless) {
                                    Lib.AP.WorkflowCtrl.DoAction("postAndRequestApproval");
                                }
                                else {
                                    Lib.AP.WorkflowCtrl.DoAction("autoPostAndRequestApproval");
                                }
                            }
                            else if (!touchless) {
                                Lib.AP.WorkflowCtrl.DoAction("approve");
                            }
                            else {
                                Lib.AP.WorkflowCtrl.DoAction("autoApprove");
                            }
                        }
                        else if (!touchless) {
                            Lib.AP.WorkflowCtrl.DoAction("requestApproval");
                        }
                        else {
                            Lib.AP.WorkflowCtrl.DoAction("autoRequestApproval");
                        }
                    }
                    else if (currentRole === Lib.AP.WorkflowCtrl.roles.controller) {
                        Lib.AP.WorkflowCtrl.DoAction("approve");
                    }
                    else if (currentRole === Lib.AP.WorkflowCtrl.roles.approver) {
                        if (!touchless) {
                            Lib.AP.WorkflowCtrl.DoAction("approve");
                        }
                        else {
                            Lib.AP.WorkflowCtrl.DoAction("autoApprove");
                        }
                    }
                    else {
                        Process.PreventApproval();
                    }
                };
                /**
                * Main function which decide the best function to call in case of a Post
                * @param {boolean} touchless True if we are in a touchless processing
                **/
                ActionPostHelper.prototype.Perform = function (erpInvoiceManager, touchless) {
                    this.invoiceDocument = erpInvoiceManager;
                    var currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                    if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0 && Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) === 0
                        && !Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                        Log.Info(" --- Perform DirectPost");
                        this.DirectPost(touchless);
                    }
                    else {
                        Log.Info(" --- Perform WorkflowPost");
                        this.WorkflowPost(currentRole, touchless);
                    }
                };
                return ActionPostHelper;
            }());
            Invoice.docType = "INVOICE";
            Invoice.transaction = {
                keys: {
                    post: "INVOICE_POSTING",
                    imageUrl: "IMAGE_URL",
                    validationUrl: "VALIDATION_URL",
                    documentId: "DOCUMENTID",
                    invoicesUpdatedWithClearDocNumber: "INVOICES_UPDATED_WITH_CLEAR_DOC_NUMBER"
                },
                values: {
                    beforePost: "BEFORE_POST",
                    afterPost: "AFTER_POST",
                    urlAttached: "URL_ATTACHED"
                }
            };
            function saveInvoiceProcessingParameters() {
                Lib.AP.Parameters.SaveParameters(Data, Sys.Helpers.Database);
            }
            Invoice.saveInvoiceProcessingParameters = saveInvoiceProcessingParameters;
            function saveLastUsedValues() {
                Lib.AP.Parameters.SaveTemplate(Lib.AP.Parameters.LineItemsPatternTable.LastUsedValues, Data, Sys.Helpers.Database);
            }
            Invoice.saveLastUsedValues = saveLastUsedValues;
            /**
             * Specific check to validate PO lines item
             * @memberof Lib.ERP.Invoice
             * @private
             * @param {Item} item The line item to validate
             */
            function validatePOLineItem(item) {
                var hasError = false;
                // Check amount and quantity integrity, both should be specified.
                // If one is missing an error is raised.
                // We don't need to check if the both are empty as such lines have been removed by customscript on post
                if (item.IsNullOrEmpty("Amount__") && !item.IsNullOrEmpty("Quantity__")) {
                    item.SetCategorizedError("Amount__", Lib.AP.TouchlessException.MissingLineField, "This field is required!");
                    hasError = true;
                }
                else if (!item.IsNullOrEmpty("Amount__") && item.IsNullOrEmpty("Quantity__") && !Data.GetValue("SubsequentDocument__")) {
                    item.SetCategorizedError("Quantity__", Lib.AP.TouchlessException.MissingLineField, "This field is required!");
                    hasError = true;
                }
                // Check for order number or good issue number in case of manual typing error
                if (Lib.P2P.InvoiceLineItem.IsPOGLLineItem(item) && !Data.IsNullOrEmpty("GoodIssue__")) {
                    if (item.IsNullOrEmpty("GoodIssue__")) {
                        item.SetCategorizedError("GoodIssue__", Lib.AP.TouchlessException.MissingLineField, "This field is required!");
                        hasError = true;
                    }
                }
                else if (item.IsNullOrEmpty("OrderNumber__")) {
                    item.SetCategorizedError("OrderNumber__", Lib.AP.TouchlessException.MissingLineField, "This field is required!");
                    hasError = true;
                }
                // Check that selected PO vendor (on line) match selected vendor (in header)
                var diffInvoicingParty = item.GetValue("DifferentInvoicingParty__");
                if (Lib.ERP.IsSAP()) {
                    diffInvoicingParty = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(item.GetValue("DifferentInvoicingParty__"));
                }
                var validVendorNumber = [item.GetValue("VendorNumber__") || null, diffInvoicingParty || null];
                var vendorNumber = Data.GetValue("VendorNumber__");
                var idx = Sys.Helpers.Array.FindIndex(validVendorNumber, function (id) {
                    return id && id.toLowerCase() === vendorNumber.toLowerCase();
                });
                if (!vendorNumber || idx === -1) {
                    item.SetWarning("OrderNumber__", "_This order number is not associated to the current vendor");
                }
                return !hasError;
            }
            Invoice.validatePOLineItem = validatePOLineItem;
            Invoice.commonAnalyticAxis = ["CostCenter__", "GLAccount__", "TaxCode__"];
            var FieldPropertyResolver = /** @class */ (function () {
                function FieldPropertyResolver() {
                    this.LineItems__ = {};
                    this.Header = {};
                }
                FieldPropertyResolver.prototype.resolver = function (propertyValueAsBooleanOrPredicate) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    if (propertyValueAsBooleanOrPredicate instanceof Function) {
                        return propertyValueAsBooleanOrPredicate.apply(this, args);
                    }
                    return propertyValueAsBooleanOrPredicate === true;
                };
                FieldPropertyResolver.prototype.foreach = function (cb) {
                    if (this.Header) {
                        for (var field in this.Header) {
                            if (Object.prototype.hasOwnProperty.call(this.Header, field)) {
                                cb(null, field, this.resolver(this.Header[field]));
                            }
                        }
                    }
                    if (this.LineItems__) {
                        for (var field in this.LineItems__) {
                            if (Object.prototype.hasOwnProperty.call(this.LineItems__, field)) {
                                cb("LineItems__", field, this.resolver(this.LineItems__[field]));
                            }
                        }
                    }
                };
                return FieldPropertyResolver;
            }());
            var RequiredFieldResolver = /** @class */ (function (_super) {
                __extends(RequiredFieldResolver, _super);
                function RequiredFieldResolver() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                RequiredFieldResolver.prototype.isRequired = function (propertyValueAsBooleanOrPredicate) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    return this.resolver.apply(this, __spreadArray([propertyValueAsBooleanOrPredicate], args, false));
                };
                return RequiredFieldResolver;
            }(FieldPropertyResolver));
            Invoice.RequiredFieldResolver = RequiredFieldResolver;
            var StoredInLocalTableFieldResolver = /** @class */ (function (_super) {
                __extends(StoredInLocalTableFieldResolver, _super);
                function StoredInLocalTableFieldResolver() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                StoredInLocalTableFieldResolver.prototype.isStoredInLocalTable = function (propertyValueAsBooleanOrPredicate) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    return this.resolver.apply(this, __spreadArray([propertyValueAsBooleanOrPredicate], args, false));
                };
                return StoredInLocalTableFieldResolver;
            }(FieldPropertyResolver));
            Invoice.StoredInLocalTableFieldResolver = StoredInLocalTableFieldResolver;
            var Instance = /** @class */ (function (_super) {
                __extends(Instance, _super);
                function Instance(manager) {
                    var _this = _super.call(this) || this;
                    // Define PostHelper object
                    _this.actionPostHelper = new ActionPostHelper();
                    _this.manager = manager;
                    _this.analyticAxis = [];
                    return _this;
                }
                Instance.prototype.Create = function () {
                    this.manager.NotifyError("Lib.ERP.Invoice do not support Create function");
                };
                Instance.prototype.GetTaxRate = function ( /*item, successCallback, errorCallback, finalCallback*/) {
                    this.manager.NotifyError("Lib.ERP.Invoice do not support GetTaxRate function");
                };
                Instance.prototype.ComputePaymentAmountsAndDates = function () {
                    this.manager.NotifyError("Lib.ERP.Invoice do not support ComputePaymentAmountsAndDates function");
                };
                Instance.prototype.ComputeLatePaymentFee = function () {
                    // Used only in SAP ERP - In generic ERPs, this code is refactored with ComputeDiscountAmount
                    Lib.AP.ComputeDiscountAmount(Data.GetValue("CompanyCode__"), Data.GetValue("PaymentTerms__"), Data.GetValue("NetAmount__"), Data.GetValue("ExchangeRate__"), function (_discountAmount, _localDiscountAmount, feeAmount, localFeeAmount) {
                        // In SAP discountAmount and localDiscountAmount are computed from SAP values
                        Data.SetValue("EstimatedLatePaymentFee__", feeAmount);
                        Data.SetValue("LocalEstimatedLatePaymentFee__", localFeeAmount);
                    });
                };
                Instance.prototype.AllowApprovers = function () {
                    return Sys.Parameters.GetInstance("AP").GetParameter("ShowApproverOption") === "" ? true : Sys.Parameters.GetInstance("AP").GetParameter("ShowApproverOption");
                };
                Instance.prototype.GetVendorBankDetails = function ( /*parameters, resultCallback*/) {
                    this.manager.NotifyError("Lib.ERP.Invoice do not support GetVendorBankDetails function");
                };
                Instance.prototype.SelectBankDetailsFromIBAN = function ( /*parameters*/) {
                    this.manager.NotifyError("Lib.ERP.Invoice do not support SelectBankDetailsFromIBAN function");
                };
                Instance.prototype.ValidateField = function ( /*item, field*/) {
                    return true;
                };
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Instance.prototype.IsMultiJurisdictionTaxCode = function (_item, _taxRate) {
                    return false;
                };
                /**
                 * Allow to customize the validation process of each line item before executing the requested action
                 * @memberof Lib.ERP.Invoice
                 * @param {Item} item The line item to validate
                 * @returns {boolean} '' The value true if the line item is valid else return false. Return true by default.
                 */
                Instance.prototype.ValidateLineItem = function (item) {
                    if (Lib.P2P.InvoiceLineItem.IsPOLineItem(item) || Lib.P2P.InvoiceLineItem.IsPOGLLineItem(item)) {
                        return Lib.ERP.Invoice.validatePOLineItem(item);
                    }
                    return true;
                };
                /**
                 * Return the list of the required fields based on the current invoice state
                 * @memberof Lib.ERP.Invoice
                 * @param {Lib.ERP.Invoice.GetRequiredFieldsCallback} [callback] An optional callback to customize the required fields
                 * @returns {RequiredFieldResolver} required An object containing all the required fields
                 */
                Instance.prototype.GetRequiredFields = function (callback) {
                    var required = new RequiredFieldResolver();
                    if (callback) {
                        required = callback(required) || required;
                    }
                    return required;
                };
                /**
                    * Return the list of the fields whom validity should be checked against the local tables
                    * @memberof Lib.ERP.Invoice
                    * @returns {StoredInLocalTableFieldResolvers} required An object containing all the required fields in the local tables
                    */
                Instance.prototype.GetStoredInLocalTableFields = function () {
                    return new StoredInLocalTableFieldResolver();
                };
                Instance.prototype.GetDemoCompanyCode = function () {
                    return "US01";
                };
                Instance.prototype.GetDefaultVendorNumberForPOBrowse = function () {
                    return Data.GetValue("VendorNumber__");
                };
                Instance.prototype.GetAnalyticAxis = function () {
                    return this.analyticAxis;
                };
                /**
                 * Client Only -> pending client instance
                 */
                Instance.prototype.OnPaymentTermsChange = function () {
                    var _this = this;
                    return function () {
                        _this.OnPaymentTermsChangeCallback();
                    };
                };
                Instance.prototype.OnPaymentTermsChangeCallback = function () {
                    // do nothing
                };
                /**
                 * Client Only -> pending client instance
                 */
                Instance.prototype.OnPostingDateChange = function () {
                    var _this = this;
                    return function () {
                        _this.OnPostingDateChangeCallback();
                    };
                };
                Instance.prototype.OnPostingDateChangeCallback = function () {
                    Lib.AP.GetInvoiceDocumentLayout().SetPostingDatePlaceholder();
                };
                Instance.prototype.OnInvoiceDateChange = function () {
                    var _this = this;
                    return function () {
                        _this.OnInvoiceDateChangeCallback();
                    };
                };
                Instance.prototype.OnInvoiceDateChangeCallback = function () {
                    Lib.AP.GetInvoiceDocumentLayout().InvoiceDateChange();
                    Sys.Helpers.TryCallFunction("Lib.AP.Contract.HandleContractValidity");
                };
                Instance.prototype.OnBaselineDateChange = function () {
                    var _this = this;
                    return function () {
                        _this.OnBaselineDateChangeCallback();
                    };
                };
                Instance.prototype.OnBaselineDateChangeCallback = function () {
                    // do nothing
                };
                Instance.prototype.UpdateLocalCurrency = function () {
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        function callbackUpdateLocalCurrency(result, error) {
                            if (!error && result && result.length > 0) {
                                Data.SetValue("LocalCurrency__", result[0].Currency__);
                            }
                            else {
                                //An error occured (companycode or currency selected may be empty or invalid), reset local currency
                                Log.Info("Failed to find company code currency, using invoice currency");
                                Data.SetValue("LocalCurrency__", Data.GetValue("InvoiceCurrency__"));
                            }
                            resolve();
                        }
                        Lib.P2P.ExchangeRate.GetCompanyCodeCurrency(Data.GetValue("CompanyCode__"), callbackUpdateLocalCurrency);
                    });
                };
                Instance.prototype.UpdateLocalAndCorporateAmounts = function () {
                    var exchangeRate = {
                        Local: parseFloat(Data.GetValue("ExchangeRate__")),
                        Corporate: parseFloat(Data.GetValue("CorporateExchangeRate__"))
                    };
                    function updateAmountsForFields(fieldName, type, baseValue) {
                        var value = baseValue;
                        if (isNaN(exchangeRate[type])) {
                            // force value to empty when no exchange rate retrieved
                            value = "";
                        }
                        else if (baseValue) {
                            value = new Sys.Decimal(baseValue).mul(exchangeRate[type]).toNumber();
                        }
                        Data.SetValue(type + fieldName, value);
                    }
                    function updateLocalAndCorporateForField(fieldName) {
                        var baseValue = Data.GetValue(fieldName);
                        updateAmountsForFields(fieldName, "Local", baseValue);
                        if (Data.GetValue("CorporateCurrency__")) {
                            updateAmountsForFields(fieldName, "Corporate", baseValue);
                        }
                    }
                    updateLocalAndCorporateForField("InvoiceAmount__");
                    updateLocalAndCorporateForField("TaxAmount__");
                    updateLocalAndCorporateForField("NetAmount__");
                    updateLocalAndCorporateForField("EstimatedDiscountAmount__");
                    updateLocalAndCorporateForField("EstimatedLatePaymentFee__");
                };
                return Instance;
            }(Lib.ERP.Manager.Document));
            Invoice.Instance = Instance;
        })(Invoice = ERP.Invoice || (ERP.Invoice = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
