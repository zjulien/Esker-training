/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_JDE_InvoicePayment_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Invoice payment document for JDE ERP - system library",
  "require": [
    "Lib_ERP_InvoicePayment_V12.0.461.0",
    "Lib_ERP_JDE_Manager_V12.0.461.0",
    "Lib_AP_UnpaidInvoices_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var JDE;
        (function (JDE) {
            var InvoicePayment = /** @class */ (function (_super) {
                __extends(InvoicePayment, _super);
                function InvoicePayment(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        JDE: {
                            INVOICEPAYMENT: {
                                Create: null
                            }
                        }
                    });
                    _this.PaymentMethods = {
                        "default            (a/r & a/p)": "Other",
                        "check payment": "Check",
                        "a/p payments - br bradesco": "Other",
                        "bordero - brazil bradesco": "Other",
                        "bordero print - br bradesco": "Other",
                        "cash payment": "Cash",
                        "check + bordero - br bradesco": "Check",
                        "lcrm - magnetic draft": "Check",
                        "lcr - supplier draft w/acct #": "Check",
                        "bor - cust draft w/acct #": "Check",
                        "lcc - supplier draft wo/acct #": "Check",
                        "boc - cust draft wo/acct #": "Check",
                        "italian bank tape": "Other",
                        "create bank tapes - france": "Other",
                        "sweden bank file bgi": "Other",
                        "print z1 form": "Other",
                        "print foreign payments - z1": "Other",
                        "only payment order": "Other",
                        "check": "Check",
                        "credit card payment": "EFT",
                        "auto debits        (a/r only)": "EFT",
                        "bacs (uk eft)      (a/r & a/p)": "EFT",
                        "check - 8 3/4\"     (a/r & a/p)": "Check",
                        "draft by invoice   (a/r & a/p)": "Check",
                        "print checks - italian format": "Check",
                        "draft by statement (a/r only)": "Check",
                        "germany            (a/p only)": "Other",
                        "german bank diskette": "Other",
                        "elec funds-italy   (a/p only)": "EFT",
                        "france             (a/p only)": "Other",
                        "switzerland        (a/p only)": "Other",
                        "belgium            (a/p only)": "Other",
                        "contract checks    (a/r & a/p)": "Check",
                        "print checks - brazil": "Check",
                        "balance transfer": "Other",
                        "create paper transfer france": "Other",
                        "bank transfer - japan": "EFT",
                        "french payment print": "Other",
                        "summarized check run": "Check",
                        "elec funds transfer(a/r & a/p)": "EFT",
                        "uk check           (a/p only)": "Check",
                        "eft ppd format     (a/p only)": "EFT",
                        "check - 8 1/2\"     (a/p only)": "Check",
                        "edi remote draft   (a/r & a/p)": "Check",
                        "edi remote wire    (a/r & a/p)": "Check",
                        "edi remote check   (a/r & a/p)": "Check",
                        "48 hs.clearing draft": "Check",
                        ".": "Other",
                        "deferred check": "Check",
                        "24 hs.clearing draft": "Check"
                    };
                    return _this;
                }
                InvoicePayment.prototype.Create = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.InvoicePayment.docType, this.manager.definition.JDE[Lib.ERP.InvoicePayment.docType].Create);
                };
                InvoicePayment.prototype.ExportUnpaidInvoices = function () {
                    // eslint-disable-next-line dot-notation
                    return Lib.AP["UnpaidInvoices"].exportFromQuery();
                };
                InvoicePayment.prototype.GetReversedInvoices = function () {
                    this.manager.NotifyError("JDE implementation do not support GetReversedInvoices function");
                    return [];
                };
                InvoicePayment.prototype.GetPayments = function () {
                    this.manager.NotifyError("JDE implementation do not support GetPayments function");
                    return null;
                };
                return InvoicePayment;
            }(Lib.ERP.InvoicePayment.Instance));
            JDE.InvoicePayment = InvoicePayment;
        })(JDE = ERP.JDE || (ERP.JDE = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.JDE.Manager.documentFactories[Lib.ERP.InvoicePayment.docType] = function (manager) {
    return new Lib.ERP.JDE.InvoicePayment(manager);
};
