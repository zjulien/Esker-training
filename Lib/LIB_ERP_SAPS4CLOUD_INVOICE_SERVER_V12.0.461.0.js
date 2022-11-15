/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAPS4CLOUD_Invoice_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server Invoice document for SAPS4CLOUD ERP - system library",
  "require": [
    "Sys/Sys_Helpers_String",
    "Lib_AP_V12.0.461.0",
    "Lib_AP_Parameters_V12.0.461.0",
    "Lib_AP_WorkflowCtrl_V12.0.461.0",
    "Lib_AP_SAPS4Cloud_V12.0.461.0",
    "Lib_AP_Extraction_V12.0.461.0",
    "Lib_AP_TaxHelper_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Manager_V12.0.461.0",
    "lib_ERP_SAPS4CLOUD_Invoice_V12.0.461.0",
    "Lib_P2P_FirstTimeRecognition_Vendor_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAPS4CLOUD;
        (function (SAPS4CLOUD) {
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
                    if (!touchless && Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart) {
                        //Update last used value for Non PO Invoices
                        this.SaveLastUsedValues();
                        this.SaveInvoiceProcessingParameters();
                    }
                };
                ActionPostHelper.prototype.ERPAttachURLs = function (erpInvoiceDocument) {
                    var objectType = "BKPF";
                    var documentId = Data.GetValue("ERPInvoiceNumber__");
                    var objectTypeMM = "BUS2081";
                    var documentMMId = Data.GetValue("ERPMMInvoiceNumber__");
                    var validationURL = Data.GetValue("ValidationUrl");
                    if (validationURL) {
                        if (documentMMId && !Sys.Helpers.IsEmpty(documentMMId)) {
                            // Attach on MM document
                            objectType = objectTypeMM;
                            documentId = documentMMId;
                        }
                        var realDocumentID = documentId;
                        if (objectType === "BKPF" || objectType === "BUS2081" || objectType === "BUS2017") {
                            var parsedDocNumber = Sys.Helpers.SAP.ParseP2PDocumentNumber(documentId, true);
                            if (parsedDocNumber) {
                                realDocumentID = parsedDocNumber.stringValue;
                            }
                            else {
                                return "unrecognized documentID";
                            }
                        }
                        this.AttachURLsOnSAPDoc(erpInvoiceDocument, objectType, realDocumentID, validationURL);
                    }
                    else {
                        Log.Error("Validation URL invalid");
                    }
                    return "";
                };
                ActionPostHelper.prototype.GetProcessedDocumentIndex = function () {
                    var nbAttach = Attach.GetNbAttach();
                    for (var i = 0; i < nbAttach; i++) {
                        if (Attach.IsProcessedDocument(i)) {
                            return i;
                        }
                    }
                    return 0;
                };
                ActionPostHelper.prototype.AttachURLsOnSAPDoc = function (erpInvoiceDocument, objectType, documentId, validationURL) {
                    var attachResult;
                    // Attach image URL to the SAP document
                    if (Attach.GetNbAttach() > 0) {
                        var imageURL = validationURL.replace("ManageDocumentsCheck.link", "attach.file");
                        imageURL = imageURL.replace("ruid=", "id=");
                        imageURL = Sys.Helpers.String.AddURLParameter(imageURL, "attachment", this.GetProcessedDocumentIndex());
                        var imageURLFromTransaction = Transaction.Read(Lib.ERP.Invoice.transaction.keys.imageUrl);
                        if (imageURLFromTransaction !== imageURL) {
                            attachResult = Lib.AP.SAPS4Cloud.ERPAttachURLs(erpInvoiceDocument, objectType, documentId, imageURL, "Invoice image");
                            if (attachResult) {
                                Log.Error("Attach image URL Error: " + attachResult);
                            }
                            else {
                                Transaction.Write(Lib.ERP.Invoice.transaction.keys.imageUrl, imageURL);
                            }
                        }
                        else {
                            Log.Info("Image URL " + imageURL + " has been already attached");
                        }
                    }
                    // Attach form URL to the SAP document
                    var validationURLFromTransaction = Transaction.Read(Lib.ERP.Invoice.transaction.keys.validationUrl);
                    if (validationURLFromTransaction !== validationURL) {
                        attachResult = Lib.AP.SAPS4Cloud.ERPAttachURLs(erpInvoiceDocument, objectType, documentId, validationURL, "Invoice form");
                        if (attachResult) {
                            Log.Error("Attach form URL Error: " + attachResult);
                        }
                        else {
                            Transaction.Write(Lib.ERP.Invoice.transaction.keys.validationUrl, validationURL);
                        }
                    }
                    else {
                        Log.Info("Validation URL " + validationURL + " has been already attached");
                    }
                };
                ActionPostHelper.prototype.SAPPost = function (erpInvoiceDocument) {
                    if (Transaction.Read(Lib.ERP.Invoice.transaction.keys.post) === Lib.ERP.Invoice.transaction.values.beforePost) {
                        Log.Warn("Redis key " + Lib.ERP.Invoice.transaction.keys.post + " equal to " + Lib.ERP.Invoice.transaction.values.beforePost + " : Invoice may have been already posted");
                        Process.PreventApproval();
                        Lib.CommonDialog.NextAlert.Define("_PostingErrorTitle", "_PostingErrorDescription", { isError: true });
                        // Clean transaction lock when displaying popup
                        Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                    }
                    else {
                        var errors = null;
                        if (!Data.GetValue("ERPInvoiceNumber__")) {
                            Log.Info("SAP posting");
                            Data.SetValue("ERPPostingError__", "");
                            errors = Lib.AP.SAPS4Cloud.ERPPost(erpInvoiceDocument, this.ShouldBlockPayment());
                            if (errors) {
                                Data.SetValue("ERPPostingError__", errors);
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
                                this.ERPAttachURLs(erpInvoiceDocument);
                            }
                        }
                        else if (!Data.GetValue("ERPLinkingDate__")) {
                            Log.Info("SAP linking");
                            Data.SetValue("ERPLinkingDate__", new Date());
                            this.ERPAttachURLs(erpInvoiceDocument);
                        }
                        return !errors;
                    }
                    return false;
                };
                ActionPostHelper.prototype.DirectPost = function (erpInvoiceDocument, touchless) {
                    Log.Info("Workflow completed - direct posting ...");
                    this.Init(touchless);
                    var alreadyPosted = Data.GetValue("ERPLinkingDate__");
                    if (alreadyPosted || this.SAPPost(erpInvoiceDocument)) {
                        if (touchless) {
                            Lib.AP.WorkflowCtrl.DoAction("postTouchless");
                        }
                        else {
                            Lib.AP.WorkflowCtrl.DoAction("post");
                        }
                    }
                };
                ActionPostHelper.prototype.WorkflowPost = function (erpInvoiceDocument, currentRole, touchless) {
                    this.Init(touchless);
                    Log.Info(" --- WorkflowPost current role = " + currentRole);
                    if (currentRole === Lib.AP.WorkflowCtrl.roles.apStart || currentRole === Lib.AP.WorkflowCtrl.roles.apEnd) {
                        var alreadyPosted = Data.GetValue("ManualLink__");
                        if (alreadyPosted) {
                            Log.Info(" --- WorkflowPost : Manual Link (Do not post)");
                        }
                        if (!alreadyPosted && !Data.GetValue("ERPPostingDate__") && Lib.AP.WorkflowCtrl.GetNextStepRole() !== Lib.AP.WorkflowCtrl.roles.controller) {
                            if (!Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                                if (this.SAPPost(erpInvoiceDocument)) {
                                    if (!touchless) {
                                        Lib.AP.WorkflowCtrl.DoAction("postAndRequestApproval");
                                    }
                                    else {
                                        Lib.AP.WorkflowCtrl.DoAction("autoPostAndRequestApproval");
                                    }
                                }
                                // else posting error => do nothing
                            }
                            else {
                                Lib.AP.WorkflowCtrl.DoAction("approve");
                            }
                        }
                        else if (!touchless) {
                            Lib.AP.WorkflowCtrl.DoAction("requestApproval");
                        }
                        else {
                            Lib.AP.WorkflowCtrl.DoAction("autoRequestApproval");
                        }
                    }
                    else if (currentRole === Lib.AP.WorkflowCtrl.roles.controller || currentRole === Lib.AP.WorkflowCtrl.roles.approver) {
                        Lib.AP.WorkflowCtrl.DoAction("approve");
                    }
                    else {
                        Process.PreventApproval();
                    }
                };
                /**
                * Main function which decide the best function to call in case of a Post
                * @param {boolean} touchless True if we are in a touchless processing
                **/
                ActionPostHelper.prototype.Perform = function (erpInvoiceDocument, touchless) {
                    this.invoiceDocument = erpInvoiceDocument;
                    var currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                    if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0 && Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) === 0
                        && !Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                        Log.Info(" --- Perform DirectPost");
                        this.DirectPost(erpInvoiceDocument, touchless);
                    }
                    else {
                        Log.Info(" --- Perform WorkflowPost");
                        this.WorkflowPost(erpInvoiceDocument, currentRole, touchless);
                    }
                };
                // private function
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
            SAPS4CLOUD.ActionPostHelper = ActionPostHelper;
            var InvoiceServer = /** @class */ (function (_super) {
                __extends(InvoiceServer, _super);
                function InvoiceServer(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.manager.ExtendDefinition({
                        SAPS4CLOUD: {
                            INVOICE: {
                                GetLastWebServiceCallError: null,
                                GetWebServiceCallParameters: null
                            }
                        }
                    });
                    // reDefine PostHelper object
                    _this.actionPostHelper = new Lib.ERP.SAPS4CLOUD.ActionPostHelper();
                    return _this;
                }
                InvoiceServer.prototype.InitDefaultValues = function () {
                    // do nothing
                };
                InvoiceServer.prototype.Create = function (touchless) {
                    this.actionPostHelper.Perform(this, touchless);
                };
                InvoiceServer.prototype.SetLastError = function (result) {
                    this.lastWebServiceCallError = result.lastErrorMessage;
                    Log.Error("Error " + result.status + " - " + result.lastErrorMessage);
                };
                InvoiceServer.prototype.GetLastPODateUpdate = function (poNumber, options) {
                    var lastDate = null;
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.SetSpecificTable("AP - Purchase order - Items__");
                    query.SetFilter("&(OrderNumber__=" + poNumber + ")(CompanyCode__=" + options.companyCode + ")");
                    query.SetAttributesList("RecordLastWrite");
                    if (query.MoveFirst()) {
                        var record = query.MoveNextRecord();
                        while (record) {
                            var date = record.GetVars().GetValue_Date("RecordLastWrite", 0);
                            if (!lastDate || date > lastDate) {
                                lastDate = date;
                            }
                            record = query.MoveNextRecord();
                        }
                    }
                    return lastDate;
                };
                InvoiceServer.prototype.SearchVendorNumber = function (companyCode, vendorNumber, vendorName, fillVendorFieldsFromQueryResult, taxID) {
                    return Lib.P2P.FirstTimeRecognition_Vendor.SearchVendorNumber(companyCode, vendorNumber, vendorName, fillVendorFieldsFromQueryResult, taxID);
                };
                /**
                 * When a valid PO is found, search for the associated vendor
                 * @memberof Lib.ERP.Invoice
                 * @param {string} companyCode The associated company code
                 * @param {string} vendorNumber The vendor number found from the PO
                 * @param {string} vendorName The vendor name found from the PO
                 * @param {Function} fillVendorFieldsFromQueryResult The callback to call when a valid vendor is found
                 * @param {string} taxID The tax ID found from the PO
                 * to fill the Vendor panel
                 */
                InvoiceServer.prototype.SearchVendorFromPO = function (companyCode, vendorNumber, vendorName, fillVendorFieldsFromQueryResult, taxID) {
                    return this.SearchVendorNumber(companyCode, vendorNumber, vendorName, fillVendorFieldsFromQueryResult, taxID);
                };
                InvoiceServer.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    return true;
                };
                InvoiceServer.prototype.FormatOrderNumberCandidates = function (orderNumbersCandidates) {
                    return orderNumbersCandidates;
                };
                InvoiceServer.prototype.ValidateOrdersAndFillPO = function (orderNumberCandidates, searchVendorNumber, type, ERPConnected, reconcileInvoiceWithPO) {
                    var res = Lib.AP.Extraction.ValidateOrdersAndFillPO(orderNumberCandidates, searchVendorNumber, type, ERPConnected);
                    if (res && typeof reconcileInvoiceWithPO === "function") {
                        return reconcileInvoiceWithPO();
                    }
                    return res;
                };
                InvoiceServer.prototype.FillGLLines = function () {
                    return Lib.AP.Extraction.FillGLLines();
                };
                InvoiceServer.prototype.UpdateGLLineFromMapperDocument = function (item) {
                    Lib.AP.UpdateGLCCDescriptions(item);
                };
                InvoiceServer.prototype.LoadTemplate = function (extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, computeCallback, noResultsCallback) {
                    Lib.AP.Parameters.LoadTemplate(extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, Lib.AP.TaxHelper, computeCallback, Lib.AP.UpdateGLCCDescriptions, noResultsCallback);
                };
                /**
                 * Saves template
                 * @param {string} table tableName
                 * @param {IData} data data to save
                 * @param {Sys.Helpers.Database} dataBaseHelper helper
                 */
                InvoiceServer.prototype.SaveTemplate = function (table, data, dataBaseHelper) {
                    Lib.AP.Parameters.SaveTemplate(table, data, dataBaseHelper);
                };
                /**
                 * Specific behavior on ending extraction
                 */
                InvoiceServer.prototype.EndExtraction = function () {
                    return;
                };
                InvoiceServer.prototype.ValidateData = function ( /*actionName: string, actionType: string*/) {
                    return true;
                };
                /**
                 * Runs specific behavior on matching criteria
                 * @param {string} actionType
                 * @param {string} actionName
                 * @param {Sys.WorkflowController.IWorkflowContributor} [actionContributor]
                 */
                InvoiceServer.prototype.OnValidationActionEnd = function (actionType, actionName, actionContributor) {
                };
                /**
                 * Reconciles invoice with PO
                 */
                InvoiceServer.prototype.ReconcileInvoice = function () {
                    Lib.AP.Reconciliation.reconcileInvoice();
                };
                /**
                 * Updates balance
                 */
                InvoiceServer.prototype.UpdateBalance = function () {
                    Lib.AP.UpdateBalance(Lib.AP.TaxHelper.computeHeaderTaxAmount);
                };
                InvoiceServer.prototype.WebServiceCall = function (api, method, queryParams, headers, data) {
                    this.lastWebServiceCallError = "";
                    if (!headers) {
                        headers = {};
                    }
                    headers["Application-Interface-Key"] = "r9157625";
                    var parameters = this.GetWebServiceCallParameters(api, method, queryParams, headers, data);
                    if (typeof parameters === "string") {
                        Log.Error(parameters);
                        return null;
                    }
                    // Call web service
                    var ws = Process.CreateHttpRequest();
                    Lib.AP.SAPS4Cloud.addCSRFToken(parameters, this);
                    var result = ws.Call(parameters);
                    if (result.status >= 400) {
                        this.SetLastError(result);
                    }
                    return result;
                };
                InvoiceServer.prototype.AttachURLs = function () {
                    this.actionPostHelper.ERPAttachURLs(this);
                };
                return InvoiceServer;
            }(Lib.ERP.SAPS4CLOUD.Invoice));
            SAPS4CLOUD.InvoiceServer = InvoiceServer;
        })(SAPS4CLOUD = ERP.SAPS4CLOUD || (ERP.SAPS4CLOUD = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAPS4CLOUD.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.SAPS4CLOUD.InvoiceServer(manager);
};
