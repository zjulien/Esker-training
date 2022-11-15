/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_InvoicePayment_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base Invoice Payment document for ERP - system library",
  "require": [
    "Lib_ERP_V12.0.461.0",
    "Lib_ERP_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var InvoicePayment;
        (function (InvoicePayment) {
            InvoicePayment.docType = "INVOICE_PAYMENTS";
            var Instance = /** @class */ (function (_super) {
                __extends(Instance, _super);
                function Instance(manager) {
                    var _this = _super.call(this) || this;
                    _this.manager = manager;
                    _this.PaymentMethods = {};
                    return _this;
                }
                Instance.prototype.GetPaymentMethods = function () {
                    return Sys.Helpers.TryCallFunction("Lib.AP.Customization.Payment.GetPaymentMethodMapping", this.manager.ERPName, this.PaymentMethods) || this.PaymentMethods;
                };
                Instance.prototype.GetPaymentMethodFromERPCode = function (paymentMethod, companyCode) {
                    var paymentMethodMapping = this.GetPaymentMethods();
                    if (!paymentMethodMapping) {
                        return paymentMethod;
                    }
                    if (companyCode && paymentMethodMapping[companyCode] && paymentMethodMapping[companyCode][paymentMethod]) {
                        return paymentMethodMapping[companyCode][paymentMethod];
                    }
                    if (paymentMethodMapping["*"] && paymentMethodMapping["*"][paymentMethod]) {
                        return paymentMethodMapping["*"][paymentMethod];
                    }
                    if (paymentMethodMapping[paymentMethod]) {
                        return paymentMethodMapping[paymentMethod];
                    }
                    if (paymentMethodMapping[paymentMethod.toLowerCase()]) {
                        return paymentMethodMapping[paymentMethod.toLowerCase()];
                    }
                    Log.Warn("GetPaymentMethodFromERPCode - '" + paymentMethod + "' not found in payment method map");
                    return "Other";
                };
                return Instance;
            }(Lib.ERP.Manager.Document));
            InvoicePayment.Instance = Instance;
        })(InvoicePayment = ERP.InvoicePayment || (ERP.InvoicePayment = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
