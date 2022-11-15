/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_Generic_Invoice_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server Invoice document for generic ERP - system library",
  "require": [
    "Sys/Sys_Helpers_String",
    "Lib_AP_V12.0.461.0",
    "Lib_AP_Extraction_V12.0.461.0",
    "Lib_AP_TaxHelper_V12.0.461.0",
    "Lib_ERP_Generic_Manager_V12.0.461.0",
    "lib_ERP_Generic_Invoice_V12.0.461.0",
    "Lib_P2P_FirstTimeRecognition_Vendor_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Generic;
        (function (Generic) {
            var InvoiceServer = /** @class */ (function (_super) {
                __extends(InvoiceServer, _super);
                function InvoiceServer(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.LoadTemplate = function (extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, computeCallback, noResultsCallback) {
                        Lib.AP.Parameters.LoadTemplate(extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, Lib.AP.TaxHelper, computeCallback, Lib.AP.UpdateGLCCDescriptions, noResultsCallback);
                    };
                    return _this;
                }
                InvoiceServer.prototype.InitDefaultValues = function () {
                    // do nothing
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
                    var isPurchasingEnabled = Sys.Parameters.GetInstance("P2P").GetParameter("enablepurchasingglobalsetting", "0");
                    return Sys.Helpers.String.ToBoolean(isPurchasingEnabled);
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
                    // do nothing
                };
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                InvoiceServer.prototype.ValidateData = function (_actionName, _actionType) {
                    return true;
                };
                /**
                 * Runs specific behavior on matching criteria
                 * @param {string} actionType
                 * @param {string} actionName
                 * @param {Sys.WorkflowController.IWorkflowContributor} [actionContributor]
                 */
                InvoiceServer.prototype.OnValidationActionEnd = function ( /*actionType: string, actionName: string | "", actionContributor: Sys.WorkflowController.IWorkflowContributor | null*/) {
                    // do nothing
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
                return InvoiceServer;
            }(Lib.ERP.Generic.Invoice));
            Generic.InvoiceServer = InvoiceServer;
        })(Generic = ERP.Generic || (ERP.Generic = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.Generic.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.Generic.InvoiceServer(manager);
};
