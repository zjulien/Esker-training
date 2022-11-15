/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_NAV_InvoicePayment_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Invoice payment document for Navision ERP - system library",
  "require": [
    "Lib_ERP_InvoicePayment_V12.0.461.0",
    "Lib_ERP_NAV_Manager_V12.0.461.0",
    "Lib_AP_UnpaidInvoices_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var NAV;
        (function (NAV) {
            var InvoicePayment = /** @class */ (function (_super) {
                __extends(InvoicePayment, _super);
                function InvoicePayment(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        NAV: {
                            INVOICEPAYMENT: {
                                Create: null
                            }
                        }
                    });
                    _this.PaymentMethods =
                        {
                            "cash": "Cash",
                            "account": "Other",
                            "bank": "EFT",
                            "giro": "EFT",
                            "intercom": "EFT",
                            "cheque": "Check",
                            "banque": "EFT",
                            "courant": "Other",
                            "prelev": "EFT",
                            "trésorerie": "Cash",
                            "virement": "EFT",
                            "ach": "EFT"
                        };
                    return _this;
                }
                InvoicePayment.prototype.Create = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.InvoicePayment.docType, this.manager.definition.NAV[Lib.ERP.InvoicePayment.docType].Create);
                };
                InvoicePayment.prototype.ExportUnpaidInvoices = function () {
                    // eslint-disable-next-line dot-notation
                    return Lib.AP["UnpaidInvoices"].groupAndExportToSFTP(2);
                };
                InvoicePayment.prototype.GetReversedInvoices = function () {
                    this.manager.NotifyError("NAV implementation do not support GetReversedInvoices function");
                    return [];
                };
                InvoicePayment.prototype.GetPayments = function () {
                    this.manager.NotifyError("NAV implementation do not support GetPayments function");
                    return null;
                };
                return InvoicePayment;
            }(Lib.ERP.InvoicePayment.Instance));
            NAV.InvoicePayment = InvoicePayment;
        })(NAV = ERP.NAV || (ERP.NAV = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.NAV.Manager.documentFactories[Lib.ERP.InvoicePayment.docType] = function (manager) {
    return new Lib.ERP.NAV.InvoicePayment(manager);
};
