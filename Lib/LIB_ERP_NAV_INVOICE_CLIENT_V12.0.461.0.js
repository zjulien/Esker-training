/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_NAV_Invoice_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Client Invoice document for Navision ERP - system library",
  "require": [
    "Lib_ERP_NAV_Manager_V12.0.461.0",
    "Lib_ERP_Generic_Invoice_Client_V12.0.461.0",
    "LIB_AP_V12.0.461.0"
  ]
}*/
// Class NAVERPInvoiceLayout : Layout
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var NAV;
        (function (NAV) {
            var InvoiceLayout = /** @class */ (function (_super) {
                __extends(InvoiceLayout, _super);
                function InvoiceLayout(parentContainer) {
                    return _super.call(this, parentContainer) || this;
                }
                InvoiceLayout.prototype.Init = function () {
                    // Hide unmanaged fields
                    Lib.ERP.Generic.InvoiceLayout.prototype.Init.call(this);
                };
                InvoiceLayout.prototype.Reset = function () {
                    // Restore unmanaged fields
                    Lib.ERP.Generic.InvoiceLayout.prototype.Reset.call(this);
                };
                return InvoiceLayout;
            }(Lib.ERP.Generic.InvoiceLayout));
            NAV.InvoiceLayout = InvoiceLayout;
            var InvoiceClient = /** @class */ (function (_super) {
                __extends(InvoiceClient, _super);
                function InvoiceClient(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.layout = new Lib.ERP.NAV.InvoiceLayout(_this);
                    return _this;
                }
                InvoiceClient.prototype.GetRequiredFields = function (callback) {
                    // Get default required fields
                    var required = Lib.ERP.Generic.InvoiceClient.prototype.GetRequiredFields.call(this);
                    required.Header.InvoiceNumber__ = true;
                    if (callback) {
                        required = callback(required) || required;
                    }
                    return required;
                };
                InvoiceClient.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    return false;
                };
                return InvoiceClient;
            }(Lib.ERP.Generic.InvoiceClient));
            NAV.InvoiceClient = InvoiceClient;
        })(NAV = ERP.NAV || (ERP.NAV = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.NAV.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.NAV.InvoiceClient(manager);
};
