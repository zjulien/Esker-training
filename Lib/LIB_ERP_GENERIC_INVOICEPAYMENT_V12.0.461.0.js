/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_Generic_InvoicePayment_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Invoice payment document for Generic ERP - system library",
  "require": [
    "Lib_ERP_InvoicePayment_V12.0.461.0",
    "Lib_ERP_Generic_Manager_V12.0.461.0",
    "Lib_AP_UnpaidInvoices_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Generic;
        (function (Generic) {
            var InvoicePayment = /** @class */ (function (_super) {
                __extends(InvoicePayment, _super);
                function InvoicePayment(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        generic: {
                            INVOICEPAYMENT: {
                                Create: null
                            }
                        }
                    });
                    _this.PaymentMethods = null;
                    return _this;
                }
                InvoicePayment.prototype.Create = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.InvoicePayment.docType, this.manager.definition.generic[Lib.ERP.InvoicePayment.docType].Create);
                };
                InvoicePayment.prototype.ExportUnpaidInvoices = function () {
                    // eslint-disable-next-line dot-notation
                    return Lib.AP["UnpaidInvoices"].exportAttachToSFTP();
                };
                InvoicePayment.prototype.GetReversedInvoices = function () {
                    this.manager.NotifyError("Generic implementation do not support GetReversedInvoices function");
                    return [];
                };
                InvoicePayment.prototype.GetPayments = function () {
                    this.manager.NotifyError("Generic implementation do not support GetPayments function");
                    return null;
                };
                return InvoicePayment;
            }(Lib.ERP.InvoicePayment.Instance));
            Generic.InvoicePayment = InvoicePayment;
        })(Generic = ERP.Generic || (ERP.Generic = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.Generic.Manager.documentFactories[Lib.ERP.InvoicePayment.docType] = function (manager) {
    return new Lib.ERP.Generic.InvoicePayment(manager);
};
