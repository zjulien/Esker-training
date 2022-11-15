/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAP_InvoicePayment_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Invoice payment document for SAP ERP - system library",
  "require": [
    "Lib_ERP_InvoicePayment_V12.0.461.0",
    "Lib_ERP_SAP_Manager_V12.0.461.0",
    "Lib_AP_UnpaidInvoices_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAP;
        (function (SAP) {
            var InvoicePayment = /** @class */ (function (_super) {
                __extends(InvoicePayment, _super);
                function InvoicePayment(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.clearingDocCache = {};
                    _this.clearingDocCheckNumberCache = {};
                    // paymentInformation helpers
                    _this.GetSapReversedInvoicesFilter = function (paymentInformation) {
                        return "BELNR = '" + paymentInformation.MMDocId.documentNumber + "' AND GJAHR = '" + paymentInformation.MMDocId.fiscalYear + "'";
                    };
                    _this.CompleteWithSap = function (paymentInformation, sapItem) {
                        if (sapItem) {
                            paymentInformation.sapDocId.companyCode = sapItem.BUKRS;
                            paymentInformation.clearingDate = Sys.Helpers.Date.ShortDateStringToDate(sapItem.AUGDT);
                            paymentInformation.SAPPaymentMethod = sapItem.ZLSCH;
                            paymentInformation.paymentMethod = sapItem.ZLSCH;
                            paymentInformation.paymentReference = sapItem.KIDNO;
                        }
                    };
                    _this.GetSapQueryFilter = function (paymentInformation, isReversed) {
                        var filter = [];
                        if (paymentInformation.sapDocId.companyCode) {
                            filter.push("BUKRS = '" + paymentInformation.sapDocId.companyCode + "'");
                        }
                        if (paymentInformation.sapDocId.documentNumber) {
                            filter.push("BELNR = '" + paymentInformation.sapDocId.documentNumber + "'");
                        }
                        if (paymentInformation.sapDocId.fiscalYear) {
                            filter.push("GJAHR = '" + paymentInformation.sapDocId.fiscalYear + "'");
                        }
                        if (!isReversed) {
                            if (paymentInformation.vendorNumber) {
                                filter.push("(" +
                                    "LIFNR = '" + Sys.Helpers.String.SAP.NormalizeID(paymentInformation.vendorNumber, 10) + "'" +
                                    " OR FILKD = '" + Sys.Helpers.String.SAP.NormalizeID(paymentInformation.vendorNumber, 10) + "'" +
                                    ")");
                            }
                            else {
                                Log.Warn("You are using a deprecated version of the payment update, with 'BUZEI = 1' in the filter.", "To upgrade to the new version with LIFNR in the filter, just add 'Vendor number' as the last column", "of the report 'AP - Invoices pending payment update'");
                                filter.push("BUZEI = 1");
                            }
                        }
                        return filter.join("\n AND ");
                    };
                    _this.GetPaymentInformationFromSapResult = function (sapPayments, sapItem) {
                        return sapPayments[Sys.Helpers.String.SAP.Trim(sapItem.BUKRS) + sapItem.BELNR + sapItem.GJAHR];
                    };
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        SAP: {
                            INVOICEPAYMENT: {
                                Create: null
                            }
                        }
                    });
                    // SAP payment method mapping to possible values of the process combo box.
                    // if not in the map "Other" will be selected
                    _this.PaymentMethods = {
                        // Default mapping for all company codes
                        "*": {
                            "C": "Check",
                            "O": "Check",
                            "S": "Check",
                            "1": "Credit card",
                            "4": "Credit card",
                            "0": "EFT",
                            "5": "EFT",
                            "8": "EFT",
                            "9": "EFT",
                            "$": "EFT",
                            "&": "EFT",
                            "A": "EFT",
                            "D": "EFT",
                            "L": "EFT",
                            "M": "EFT",
                            "P": "EFT",
                            "T": "EFT",
                            "U": "EFT",
                            "V": "EFT",
                            "W": "EFT",
                            "X": "EFT",
                            "Y": "EFT",
                            "Z": "EFT"
                        },
                        // Company code specific mapping (overrides the default mapping)
                        "2200": {
                            "1": "Other"
                        }
                    };
                    return _this;
                }
                InvoicePayment.prototype.Create = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.InvoicePayment.docType, this.manager.definition.SAP[Lib.ERP.InvoicePayment.docType].Create);
                };
                InvoicePayment.prototype.ExportUnpaidInvoices = function () {
                    // eslint-disable-next-line dot-notation
                    return Lib.AP["UnpaidInvoices"].exportFromQuery();
                };
                InvoicePayment.prototype.GetReversedInvoices = function (payment) {
                    if (Sys.ScriptInfo.IsClient()) {
                        this.manager.NotifyError("SAP implementation do not support GetReversedInvoices function client side");
                        return null;
                    }
                    var reversedInvoices = [];
                    var fields = "BELNR|GJAHR";
                    var options = this.ComputeReversedInvoicesSapFilter(payment.MM);
                    if (options) {
                        var resultsMM = Lib.AP.SAP.ReadSAPTable(this.manager.bapiMgr.Add("RFC_READ_TABLE"), "RBKP", fields, options, 0, 0, false, { "useCache": false });
                        if (resultsMM && resultsMM.length > 0) {
                            for (var _i = 0, resultsMM_1 = resultsMM; _i < resultsMM_1.length; _i++) {
                                var resultMM = resultsMM_1[_i];
                                reversedInvoices.push(Lib.AP.CreateInvoiceDocumentObject(true, resultMM.BELNR, resultMM.GJAHR));
                            }
                        }
                    }
                    fields = fields + "|BUKRS";
                    options = this.ComputeSapFilter(payment, true);
                    if (options) {
                        var resultsFI = Lib.AP.SAP.ReadSAPTable(this.manager.bapiMgr.Add("RFC_READ_TABLE"), "BKPF", fields, options, 0, 0, false, { "useCache": false });
                        if (resultsFI && resultsFI.length > 0) {
                            for (var _a = 0, resultsFI_1 = resultsFI; _a < resultsFI_1.length; _a++) {
                                var resultFI = resultsFI_1[_a];
                                reversedInvoices.push(Lib.AP.CreateInvoiceDocumentObject(true, resultFI.BELNR, resultFI.GJAHR, resultFI.BUKRS));
                            }
                        }
                    }
                    return reversedInvoices;
                };
                InvoicePayment.prototype.GetPayments = function (sapPayments, configuration) {
                    if (Sys.ScriptInfo.IsClient()) {
                        this.manager.NotifyError("SAP implementation do not support GetPayments function client side");
                        return null;
                    }
                    Lib.P2P.ChangeConfiguration(configuration);
                    var fields = "BUKRS|GJAHR|BELNR|AUGBL|AUGDT|ZLSCH|KIDNO";
                    var options = this.ComputeSapFilter(sapPayments);
                    if (options) {
                        var results = Lib.AP.SAP.ReadSAPTable(this.manager.bapiMgr.Add("RFC_READ_TABLE"), "BSAK", fields, options, 0, 0, false, { "useCache": false });
                        if (results && results.length > 0) {
                            this.CompletePaymentInformationWithResults(results, sapPayments);
                        }
                    }
                    return sapPayments;
                };
                // !paymentInformation helpers
                InvoicePayment.prototype.ComputeReversedInvoicesSapFilter = function (sapPayments) {
                    var count = 0;
                    var filters = [];
                    for (var key in sapPayments) {
                        if (Object.prototype.hasOwnProperty.call(sapPayments, key)) {
                            count++;
                            var filter = this.GetSapReversedInvoicesFilter(sapPayments[key]);
                            if (filter) {
                                filters.push(filter);
                            }
                        }
                    }
                    if (count === 0) {
                        return null;
                    }
                    return (filters.length > 1 ? "( " : "") + "( " + filters.join(" )\n OR ( ") + (filters.length > 1 ? " )" : "") + " ) AND STBLG <> ''";
                };
                InvoicePayment.prototype.GetCheckNumberFromClearingDocument = function (sapItem) {
                    var cachekey = sapItem.BUKRS + sapItem.GJAHR + sapItem.AUGBL;
                    if (!this.clearingDocCheckNumberCache[cachekey]) {
                        var options = "ZBUKR = '" + sapItem.BUKRS + "'\n AND GJAHR = '" + sapItem.GJAHR + "'\n AND VBLNR = '" + sapItem.AUGBL + "'";
                        var results = Lib.AP.SAP.ReadSAPTable(this.manager.bapiMgr.Add("RFC_READ_TABLE"), "PAYR", "CHECT", options, 1, 0, false, { "useCache": false });
                        if (results && results.length > 0) {
                            this.clearingDocCheckNumberCache[cachekey] = results[0].CHECT;
                        }
                    }
                    if (this.clearingDocCheckNumberCache[cachekey]) {
                        return this.clearingDocCheckNumberCache[cachekey];
                    }
                    return "";
                };
                InvoicePayment.prototype.GetPaymentMethodFromClearingDocument = function (sapItem) {
                    var cachekey = sapItem.BUKRS + sapItem.GJAHR + sapItem.AUGBL;
                    if (!this.clearingDocCache[cachekey]) {
                        var options = "BUKRS = '" + sapItem.BUKRS + "'\n AND GJAHR = '" + sapItem.GJAHR + "'\n AND BELNR = '" + sapItem.AUGBL + "'";
                        var results = Lib.AP.SAP.ReadSAPTable(this.manager.bapiMgr.Add("RFC_READ_TABLE"), "BSAK", "ZLSCH", options, 1, 0, false, { "useCache": false });
                        if (results && results.length > 0) {
                            this.clearingDocCache[cachekey] = results[0].ZLSCH;
                        }
                    }
                    if (this.clearingDocCache[cachekey]) {
                        return this.clearingDocCache[cachekey];
                    }
                    return "";
                };
                /**
                 * Use the SAP informations to complete the PaymentInformation
                 * @param {object[]} sapResults The list of paid invoices in SAP
                 * @param {object} sapPayments The PaymentInformation to complete
                 * @param {object} erpManager The ErpManager used to access SAP
                 */
                InvoicePayment.prototype.CompletePaymentInformationWithResults = function (sapResults, sapPayments) {
                    var i;
                    for (i = 0; i < sapResults.length; i++) {
                        var sapItem = sapResults[i];
                        if (!Sys.Helpers.String.SAP.Trim(sapItem.ZLSCH)) {
                            sapItem.ZLSCH = this.GetPaymentMethodFromClearingDocument(sapItem);
                        }
                        // For check payment, use the check number if no payment reference is set on the document
                        if (!Sys.Helpers.String.SAP.Trim(sapItem.KIDNO) && this.GetPaymentMethodFromERPCode(sapItem.ZLSCH, sapItem.BUKRS) === "Check") {
                            sapItem.KIDNO = this.GetCheckNumberFromClearingDocument(sapItem);
                        }
                        var paymentInformations = this.GetPaymentInformationFromSapResult(sapPayments.FI, sapItem);
                        if (!paymentInformations && sapPayments.MM) {
                            paymentInformations = this.GetPaymentInformationFromSapResult(sapPayments.MM, sapItem);
                        }
                        if (paymentInformations) {
                            this.CompleteWithSap(paymentInformations, sapItem);
                        }
                    }
                };
                InvoicePayment.prototype.ComputeSapFilter = function (sapPayments, isReversed) {
                    var key, filter;
                    var count = 0;
                    var filters = [];
                    for (key in sapPayments.FI) {
                        if (Object.prototype.hasOwnProperty.call(sapPayments.FI, key)) {
                            count++;
                            filter = this.GetSapQueryFilter(sapPayments.FI[key], isReversed);
                            if (filter) {
                                filters.push("( " + filter + " )");
                            }
                        }
                    }
                    if (!isReversed) {
                        for (key in sapPayments.MM) {
                            if (Object.prototype.hasOwnProperty.call(sapPayments.MM, key)) {
                                count++;
                                filter = this.GetSapQueryFilter(sapPayments.MM[key], isReversed);
                                if (filter) {
                                    filters.push("( " + filter + " )");
                                }
                            }
                        }
                    }
                    if (count === 0) {
                        return null;
                    }
                    filter = filters.join("\n OR ");
                    if (isReversed) {
                        filter = "(" + filter + ") AND STBLG <> ''";
                    }
                    return filter;
                };
                return InvoicePayment;
            }(Lib.ERP.InvoicePayment.Instance));
            SAP.InvoicePayment = InvoicePayment;
        })(SAP = ERP.SAP || (ERP.SAP = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAP.Manager.documentFactories[Lib.ERP.InvoicePayment.docType] = function (manager) {
    return new Lib.ERP.SAP.InvoicePayment(manager);
};
