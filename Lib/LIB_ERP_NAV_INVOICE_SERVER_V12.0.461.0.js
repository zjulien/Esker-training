/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_NAV_Invoice_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server Invoice document for Navision ERP - system library",
  "require": [
    "Lib_ERP_NAV_Manager_V12.0.461.0",
    "lib_ERP_Generic_Invoice_Server_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var NAV;
        (function (NAV) {
            var InvoiceServer = /** @class */ (function (_super) {
                __extends(InvoiceServer, _super);
                function InvoiceServer(manager) {
                    return _super.call(this, manager) || this;
                }
                InvoiceServer.prototype.GetRequiredFields = function (callback) {
                    // Get default required fields
                    var required = Lib.ERP.Generic.InvoiceServer.prototype.GetRequiredFields.call(this);
                    required.Header.InvoiceNumber__ = true;
                    if (callback) {
                        required = callback(required) || required;
                    }
                    return required;
                };
                InvoiceServer.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    return false;
                };
                /**
                 * Prohibit dynamic discounting for ERP NAV
                 * @returns {boolean} Always false
                 */
                InvoiceServer.prototype.IsDynamicDiscountingAllowed = function () {
                    return false;
                };
                return InvoiceServer;
            }(Lib.ERP.Generic.InvoiceServer));
            NAV.InvoiceServer = InvoiceServer;
        })(NAV = ERP.NAV || (ERP.NAV = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.NAV.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.NAV.InvoiceServer(manager);
};
