/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_JDE_Invoice_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server Invoice document for JDE ERP - system library",
  "require": [
    "Lib_ERP_JDE_Manager_V12.0.461.0",
    "lib_ERP_Generic_Invoice_Server_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var JDE;
        (function (JDE) {
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
                    if (callback) {
                        required = callback(required) || required;
                    }
                    return required;
                };
                InvoiceServer.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    return false;
                };
                /**
                 * Prohibit dynamic discounting for ERP JDE
                 * @returns {boolean} Always false
                 */
                InvoiceServer.prototype.IsDynamicDiscountingAllowed = function () {
                    return false;
                };
                return InvoiceServer;
            }(Lib.ERP.Generic.InvoiceServer));
            JDE.InvoiceServer = InvoiceServer;
        })(JDE = ERP.JDE || (ERP.JDE = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.JDE.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.JDE.InvoiceServer(manager);
};
