/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAPS4CLOUD_InvoicePayment_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Invoice payment document for SAPS4CLOUD ERP - system library",
  "require": [
    "Lib_ERP_InvoicePayment_V12.0.461.0",
    "Lib_AP_SAPS4Cloud_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Manager_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Invoice_Server_V12.0.461.0",
    "Lib_AP_UnpaidInvoices_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAPS4CLOUD;
        (function (SAPS4CLOUD) {
            var InvoicePayment = /** @class */ (function (_super) {
                __extends(InvoicePayment, _super);
                function InvoicePayment(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        SAPS4CLOUD: {
                            INVOICEPAYMENT: {
                                Create: null
                            }
                        }
                    });
                    // SAPS4CLOUD payment method mapping to possible values of the process combo box.
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
                        }
                    };
                    return _this;
                }
                InvoicePayment.prototype.GetDateFromOData = function (value) {
                    return new Date(parseInt(value.substr(6, value.length - 8), 10));
                };
                InvoicePayment.prototype.GetPaymentInformationFromSapResult = function (sapPayments, sapItem) {
                    return sapPayments[sapItem.CompanyCode + Sys.Helpers.String.SAP.NormalizeID(sapItem.AccountingDocument, 10) + sapItem.FiscalYear];
                };
                InvoicePayment.prototype.CompleteWithSap = function (paymentInformation, sapItem) {
                    if (sapItem) {
                        paymentInformation.sapDocId.companyCode = sapItem.CompanyCode;
                        paymentInformation.clearingDate = this.GetDateFromOData(sapItem.ClearingDate);
                        paymentInformation.SAPPaymentMethod = sapItem.PaymentMethod;
                        paymentInformation.paymentMethod = sapItem.PaymentMethod;
                        paymentInformation.paymentReference = sapItem.PaymentReference;
                    }
                };
                InvoicePayment.prototype.Create = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.InvoicePayment.docType, this.manager.definition.SAPS4CLOUD[Lib.ERP.InvoicePayment.docType].Create);
                };
                InvoicePayment.prototype.ExportUnpaidInvoices = function () {
                    // eslint-disable-next-line dot-notation
                    return Lib.AP["UnpaidInvoices"].exportFromQuery();
                };
                InvoicePayment.prototype.GetReversedInvoices = function () {
                    Log.Warn("SAPS4CLOUD ERP Manager do not manage reversed invoices during payment update");
                    return [];
                };
                InvoicePayment.prototype.GetSapQueryFilter = function (documentsNumber, fiscalYear, companyCode) {
                    var filter = [];
                    if (!documentsNumber || documentsNumber.length === 0) {
                        Log.Warn("Can't construct Sap query filter : no document number to query");
                    }
                    else {
                        if (fiscalYear) {
                            filter.push("FiscalYear eq '" + fiscalYear + "'");
                        }
                        if (companyCode) {
                            filter.push("CompanyCode eq '" + companyCode + "'");
                        }
                        filter.push("Supplier ne ''");
                        filter.push("IsCleared eq true");
                        filter.push("IsReversal ne true");
                        filter.push("(" + documentsNumber.reduce(function (prev, current) {
                            if (prev) {
                                prev += " or AccountingDocument eq '" + current + "'";
                            }
                            else {
                                prev = "AccountingDocument eq '" + current + "'";
                            }
                            return prev;
                        }, "") + ")");
                        return filter.join(" and ");
                    }
                    return null;
                };
                InvoicePayment.prototype.GetDocumentsToSearchOrderedByFiscalYearAndCompanyCode = function (sapPayments) {
                    var key, paymentInfo;
                    var count = 0;
                    var payInfosByFYearAndCC = { FI: {}, MM: {} };
                    for (key in sapPayments.FI) {
                        if (Object.prototype.hasOwnProperty.call(sapPayments.FI, key)) {
                            count++;
                            paymentInfo = sapPayments.FI[key];
                            if (!payInfosByFYearAndCC.FI[paymentInfo.sapDocId.fiscalYear]) {
                                payInfosByFYearAndCC.FI[paymentInfo.sapDocId.fiscalYear] = {};
                            }
                            if (!payInfosByFYearAndCC.FI[paymentInfo.sapDocId.fiscalYear][paymentInfo.sapDocId.companyCode]) {
                                payInfosByFYearAndCC.FI[paymentInfo.sapDocId.fiscalYear][paymentInfo.sapDocId.companyCode] = [];
                            }
                            payInfosByFYearAndCC.FI[paymentInfo.sapDocId.fiscalYear][paymentInfo.sapDocId.companyCode].push(paymentInfo.sapDocId.documentNumber);
                        }
                    }
                    for (key in sapPayments.MM) {
                        if (Object.prototype.hasOwnProperty.call(sapPayments.MM, key)) {
                            count++;
                            paymentInfo = sapPayments.MM[key];
                            if (!payInfosByFYearAndCC.MM[paymentInfo.MMDocId.fiscalYear]) {
                                payInfosByFYearAndCC.MM[paymentInfo.MMDocId.fiscalYear] = [];
                            }
                            payInfosByFYearAndCC.MM[paymentInfo.MMDocId.fiscalYear].push(paymentInfo.sapDocId.documentNumber);
                        }
                    }
                    if (count === 0) {
                        return null;
                    }
                    return payInfosByFYearAndCC;
                };
                InvoicePayment.prototype.GetPaymentInfosFromAccountingDocuments = function (sapPayments, documentsNumber, fiscalYear, companyCode) {
                    var filter = this.GetSapQueryFilter(documentsNumber, fiscalYear, companyCode);
                    if (filter) {
                        var queryParams = {
                            $select: "CompanyCode,FiscalYear,AccountingDocument,ClearingAccountingDocument,ClearingDate",
                            $filter: filter
                        };
                        var invoiceDocument = this.manager.GetDocument("INVOICE");
                        // eslint-disable-next-line dot-notation
                        var resultsAccDocs = Lib.AP["SAPS4Cloud"].GetPayments(invoiceDocument, queryParams);
                        if (resultsAccDocs && resultsAccDocs.length > 0) {
                            //get more infos from clearing document
                            var clearingAccountingDocuments = [];
                            for (var i in resultsAccDocs) {
                                if (Object.prototype.hasOwnProperty.call(resultsAccDocs, i)) {
                                    clearingAccountingDocuments.push(resultsAccDocs[i].ClearingAccountingDocument);
                                }
                            }
                            filter = this.GetSapQueryFilter(clearingAccountingDocuments, fiscalYear, companyCode);
                            if (filter) {
                                queryParams =
                                    {
                                        $select: "AccountingDocument,PaymentMethod,PaymentReference,PaymentMethodSupplement",
                                        $filter: filter
                                    };
                                // eslint-disable-next-line dot-notation
                                var resultsClearingDocs = Lib.AP["SAPS4Cloud"].GetPayments(invoiceDocument, queryParams);
                                this.CompletePaymentInformationWithResults(resultsAccDocs, resultsClearingDocs, sapPayments);
                            }
                        }
                    }
                };
                InvoicePayment.prototype.GetPayments = function (sapPayments, configuration) {
                    Lib.P2P.ChangeConfiguration(configuration);
                    var payInfosByFYearAndCC = this.GetDocumentsToSearchOrderedByFiscalYearAndCompanyCode(sapPayments);
                    if (payInfosByFYearAndCC) {
                        for (var fyearFI in payInfosByFYearAndCC.FI) {
                            if (Object.prototype.hasOwnProperty.call(payInfosByFYearAndCC.FI, fyearFI)) {
                                for (var ccFI in payInfosByFYearAndCC.FI[fyearFI]) {
                                    if (Object.prototype.hasOwnProperty.call(payInfosByFYearAndCC.FI[fyearFI], ccFI)) {
                                        this.GetPaymentInfosFromAccountingDocuments(sapPayments, payInfosByFYearAndCC.FI[fyearFI][ccFI], fyearFI, ccFI);
                                    }
                                }
                            }
                        }
                        for (var fyearMM in payInfosByFYearAndCC.MM) {
                            if (Object.prototype.hasOwnProperty.call(payInfosByFYearAndCC.MM, fyearMM)) {
                                this.GetPaymentInfosFromAccountingDocuments(sapPayments, payInfosByFYearAndCC.MM[fyearMM], fyearMM);
                            }
                        }
                    }
                    return sapPayments;
                };
                InvoicePayment.prototype.CompletePaymentInformationWithResults = function (resultsAccDocs, resultsClearingDocs, sapPayments) {
                    for (var i = 0; i < resultsAccDocs.length; i++) {
                        var sapItem = resultsAccDocs[i];
                        for (var idx in resultsClearingDocs) {
                            if (resultsClearingDocs[idx].AccountingDocument === sapItem.ClearingAccountingDocument) {
                                delete resultsClearingDocs[idx].AccountingDocument;
                                sapItem = Sys.Helpers.Extend(sapItem, resultsClearingDocs[idx]);
                                break;
                            }
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
                return InvoicePayment;
            }(Lib.ERP.InvoicePayment.Instance));
            SAPS4CLOUD.InvoicePayment = InvoicePayment;
        })(SAPS4CLOUD = ERP.SAPS4CLOUD || (ERP.SAPS4CLOUD = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAPS4CLOUD.Manager.documentFactories[Lib.ERP.InvoicePayment.docType] = function (manager) {
    return new Lib.ERP.SAPS4CLOUD.InvoicePayment(manager);
};
