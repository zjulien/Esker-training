/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_EBS_Invoice_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Client Invoice document for EBS ERP - system library",
  "require": [
    "Lib_ERP_EBS_Manager_V12.0.461.0",
    "Lib_ERP_Generic_Invoice_Client_V12.0.461.0",
    "LIB_AP_V12.0.461.0"
  ]
}*/
// Class EBSERPInvoiceLayout : Layout
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var EBS;
        (function (EBS) {
            var InvoiceLayout = /** @class */ (function (_super) {
                __extends(InvoiceLayout, _super);
                function InvoiceLayout(parentContainer) {
                    var _this = _super.call(this, parentContainer) || this;
                    _this.GetPostAndRequestApprovalManualLinkLabel = function () {
                        if (Lib.AP.DraftInERP()) {
                            return "_Mark as resolved and Request Approval";
                        }
                        return "_Archive and Request Approval";
                    };
                    _this.GetPostManualLinkLabel = function () {
                        if (Lib.AP.DraftInERP()) {
                            return "_Mark as resolved";
                        }
                        return "_Archive";
                    };
                    _this.UpdateLayoutForManualLink = function () {
                        if (Lib.AP.DraftInERP()) {
                            Controls.ERPInvoiceNumber__.SetReadOnly(true);
                        }
                        else {
                            Lib.ERP.Generic.InvoiceLayout.prototype.UpdateLayoutForManualLink();
                        }
                    };
                    return _this;
                }
                InvoiceLayout.prototype.Init = function () {
                    // Hide unmanaged fields
                    Lib.ERP.Generic.InvoiceLayout.prototype.Init.call(this);
                    Controls.CalculateTax__.Hide(true);
                    Controls.LineItems__.TaxCode__.SetAllowTableValuesOnly(false);
                };
                InvoiceLayout.prototype.Reset = function () {
                    // Restore unmanaged fields
                    Lib.ERP.Generic.InvoiceLayout.prototype.Reset.call(this);
                    Controls.CalculateTax__.Hide(true);
                    Controls.LineItems__.TaxCode__.SetAllowTableValuesOnly(false);
                };
                return InvoiceLayout;
            }(Lib.ERP.Generic.InvoiceLayout));
            EBS.InvoiceLayout = InvoiceLayout;
            var InvoiceClient = /** @class */ (function (_super) {
                __extends(InvoiceClient, _super);
                function InvoiceClient(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.IsBankDetailsSelectionDisabled = function () {
                        return Boolean(Variable.GetValueAsString("DefaultAlternativePayee") || Data.GetValue("AlternativePayee__"));
                    };
                    _this.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                        return false;
                    };
                    _this.GetDefaultVendorNumberForPOBrowse = function () {
                        var vendorNumber = Controls.VendorNumber__.GetValue();
                        if (vendorNumber) {
                            vendorNumber = vendorNumber.split("/")[0] + "/*";
                        }
                        return vendorNumber;
                    };
                    _this.layout = new Lib.ERP.EBS.InvoiceLayout(_this);
                    // avoid heriting analytics axis from generic connector, should be done both server and client side
                    _this.analyticAxis = Lib.ERP.Invoice.commonAnalyticAxis;
                    return _this;
                }
                InvoiceClient.prototype.GetRequiredFields = function (callback) {
                    // Get default required fields
                    var required = Lib.ERP.Generic.InvoiceClient.prototype.GetRequiredFields.call(this);
                    required.Header.InvoiceNumber__ = true;
                    required.LineItems__.TaxCode__ = false;
                    if (callback) {
                        required = callback(required) || required;
                    }
                    return required;
                };
                return InvoiceClient;
            }(Lib.ERP.Generic.InvoiceClient));
            EBS.InvoiceClient = InvoiceClient;
        })(EBS = ERP.EBS || (ERP.EBS = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.EBS.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.EBS.InvoiceClient(manager);
};
