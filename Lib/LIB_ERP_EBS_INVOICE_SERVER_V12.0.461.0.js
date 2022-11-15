/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_EBS_Invoice_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server Invoice document for EBS ERP - system library",
  "require": [
    "Lib_ERP_EBS_Manager_V12.0.461.0",
    "lib_ERP_Generic_Invoice_Server_V12.0.461.0",
    "Lib_P2P_FirstTimeRecognition_Vendor_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var EBS;
        (function (EBS) {
            var InvoiceServer = /** @class */ (function (_super) {
                __extends(InvoiceServer, _super);
                function InvoiceServer(manager) {
                    var _this = _super.call(this, manager) || this;
                    // avoid heriting analytics axis from generic connector, should be done both server and client side
                    _this.analyticAxis = Lib.ERP.Invoice.commonAnalyticAxis;
                    return _this;
                }
                InvoiceServer.prototype.GetRequiredFields = function (callback) {
                    // Get default required fields
                    var required = Lib.ERP.Generic.InvoiceServer.prototype.GetRequiredFields.call(this);
                    required.Header.InvoiceNumber__ = true;
                    required.LineItems__.TaxCode__ = false;
                    if (callback) {
                        required = callback(required) || required;
                    }
                    return required;
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
                    var vendorFound = Lib.P2P.FirstTimeRecognition_Vendor.SearchVendorNumber(companyCode, vendorNumber, vendorName, fillVendorFieldsFromQueryResult, taxID);
                    if (!vendorFound) {
                        var filterNumber = vendorNumber;
                        var separatorIndex = filterNumber.indexOf("/");
                        if (separatorIndex !== -1) {
                            filterNumber = filterNumber.substr(0, separatorIndex + 1) + "*";
                            var filter = "Number__=" + filterNumber;
                            var attributes = Lib.AP.GetExtendedVendorAttributes();
                            Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filter.AddCompanyCodeFilter(companyCode), attributes, function (records) {
                                if (records && records.length === 1) {
                                    var invoicingVendorNumber = records[0].Number__;
                                    if (invoicingVendorNumber !== vendorNumber) {
                                        Log.Info("Use invoicing site vendor (" + invoicingVendorNumber + ") on behalf of purchasing site vendor (" + vendorNumber + ")");
                                    }
                                    fillVendorFieldsFromQueryResult(records[0]);
                                    vendorFound = true;
                                }
                                else {
                                    Log.Info("Multiple invoicing site vendors found for the purchasing site vendor (" + vendorNumber + ")");
                                }
                            });
                        }
                    }
                    return vendorFound;
                };
                InvoiceServer.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    return false;
                };
                /**
                 * Prohibit dynamic discounting for ERP EBS
                 * @returns {boolean} Always false
                 */
                InvoiceServer.prototype.IsDynamicDiscountingAllowed = function () {
                    return false;
                };
                return InvoiceServer;
            }(Lib.ERP.Generic.InvoiceServer));
            EBS.InvoiceServer = InvoiceServer;
        })(EBS = ERP.EBS || (ERP.EBS = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.EBS.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.EBS.InvoiceServer(manager);
};
