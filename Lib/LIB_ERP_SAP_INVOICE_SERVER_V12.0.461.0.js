/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAP_Invoice_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server Invoice document for SAP ERP - system library",
  "require": [
    "Lib_AP_Extraction_V12.0.461.0",
    "Lib_AP_SAP_V12.0.461.0",
    "Lib_AP_SAP_TaxHelper_V12.0.461.0",
    "Lib_ERP_SAP_Manager_V12.0.461.0",
    "Lib_ERP_SAP_Invoice_V12.0.461.0",
    "Lib_P2P_FirstTimeRecognition_Vendor_V12.0.461.0",
    "Sys/Sys_Helpers_SAP"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAP;
        (function (SAP) {
            var InvoiceServer = /** @class */ (function (_super) {
                __extends(InvoiceServer, _super);
                /**
                 * @namespace Lib.ERP.SAP.InvoiceServer
                 * @memberof Lib.ERP
                 */
                function InvoiceServer(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.LoadTemplate = function (extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, computeCallback, noResultsCallback) {
                        Lib.AP.Parameters.LoadTemplate(extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, Lib.AP.SAP.TaxHelper, computeCallback, Lib.AP.SAP.UpdateGLCCDescriptions, noResultsCallback);
                    };
                    return _this;
                }
                InvoiceServer.prototype.InitDefaultValues = function () {
                    // do nothing;
                };
                InvoiceServer.prototype.GetLastPODateUpdate = function (poNumber, options) {
                    if (poNumber) {
                        var fields = "CPUDT|CPUTM|LFBNR";
                        var filter = "EBELN = '".concat(poNumber, "' AND BEWTP = 'E'");
                        if (options.limitHistoryToLastDays > 0) {
                            // limit the results to the last N days (no need to fetch the whole history)
                            var sapDateLimit = new Date();
                            sapDateLimit.setDate(sapDateLimit.getDate() - options.limitHistoryToLastDays);
                            filter += " AND CPUDT > '" + Sys.Helpers.SAP.FormatToSAPDateTimeFormat(sapDateLimit) + "'";
                        }
                        var results = Lib.AP.SAP.ReadSAPTable(this.manager.bapiMgr.Add("RFC_READ_TABLE"), "EKBE", fields, filter, 0, 0, false, {
                            "useCache": false
                        });
                        return Sys.Helpers.SAP.MaxCPUDTCPUTM(results);
                    }
                    Log.Error("SAP Check impossible for PO#" + poNumber);
                    return null;
                };
                InvoiceServer.prototype.GetExtendedWithholdingTax = function (vendorNumber) {
                    // resolve the current sap language
                    // Serverside requests are blocking so we can outscope the lang given by the callback
                    var lang = "";
                    var user = Sys.Helpers.Globals.Users.GetUser(Data.GetValue("ValidationOwnerID"));
                    if (!user) {
                        user = Sys.Helpers.Globals.Users.GetUser(Data.GetValue("OwnerID"));
                    }
                    var userLanguage = (user === null || user === void 0 ? void 0 : user.GetValue("Language").toUpperCase()) || "EN";
                    function languageCallback(ISOlang) {
                        lang = ISOlang;
                    }
                    Lib.AP.SAP.SAPGetISOLanguage(languageCallback, null);
                    var filter = "BUKRS = '" + Data.GetValue("CompanyCode__") + "'";
                    filter += " AND LIFNR = '" + Sys.Helpers.String.SAP.NormalizeID(vendorNumber, 10) + "'";
                    var results = Lib.AP.SAP.ReadSAPTable(this.manager.bapiMgr.Add("RFC_READ_TABLE"), "LFBW", "WT_WITHCD|WITHT", filter, 0, 0, false, { "useCache": false });
                    if (results && results.length > 0) {
                        Log.Info("WHT retrieved");
                        var whtTable = Data.GetTable("ExtendedWithholdingTax__");
                        // Parse the retrieved records
                        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                            var item = results_1[_i];
                            var whtTableItem = whtTable.AddItem(true);
                            // For each record, retrieve the attribute value...
                            var whTaxCode = item.WT_WITHCD;
                            var whTaxType = item.WITHT;
                            // Fill the table with the retrieved values
                            whtTableItem.SetValue("WHTCode__", whTaxCode);
                            whtTableItem.SetValue("WHTType__", whTaxType);
                            var filterWHTDescription = "WT_WITHCD = '".concat(whTaxCode, "'");
                            filterWHTDescription += "\n AND WITHT = '".concat(whTaxType, "'");
                            if (userLanguage !== lang) {
                                filterWHTDescription += "\n AND ( SPRAS = '".concat(lang, "' OR SPRAS = '").concat(userLanguage, "' )");
                            }
                            else {
                                filterWHTDescription += "\n AND SPRAS = '".concat(lang, "'");
                            }
                            filterWHTDescription += "\n AND LAND1 = '".concat(Data.GetValue("VendorCountry__"), "'");
                            var descriptionResult = Lib.AP.SAP.ReadSAPTable(this.manager.bapiMgr.Add("RFC_READ_TABLE"), "T059ZT", "TEXT40|SPRAS", filterWHTDescription, 2, 0, false, { "useCache": false });
                            if (descriptionResult && descriptionResult.length > 0) {
                                var idDescription = 0;
                                if (descriptionResult.length === 2 && Sys.Helpers.String.SAP.Trim(descriptionResult[1].SPRAS) === lang) {
                                    idDescription = 1;
                                }
                                whtTableItem.SetValue("WHTDescription__", Sys.Helpers.String.SAP.Trim(descriptionResult[idDescription].TEXT40));
                            }
                        }
                    }
                };
                InvoiceServer.prototype.ComputePaymentAmountsAndDates = function (computeAmounts, computeDates, keepUserEnteredDates) {
                    if (keepUserEnteredDates === void 0) { keepUserEnteredDates = false; }
                    var companyCode = Data.GetValue("CompanyCode__");
                    var paymentTerms = Data.GetValue("PaymentTerms__");
                    var invoiceDate = Data.GetValue("InvoiceDate__");
                    var vendorNumber = Data.GetValue("VendorNumber__");
                    var isCreditNote = Lib.AP.IsCreditNote();
                    if (!isCreditNote && companyCode && vendorNumber && paymentTerms && invoiceDate && this.manager.bapiMgr) {
                        var dueDate = null;
                        var discountDate = null;
                        var discountRate = 0;
                        var postingDate = Data.GetValue("PostingDate__");
                        var baselineDate = Data.GetValue("BaselineDate__");
                        var invoiceAmount = Data.GetValue("InvoiceAmount__");
                        var bapiComputeDueDate = this.manager.bapiMgr.Add("Z_ESK_DETERMINE_DUE_DATE");
                        if (bapiComputeDueDate) {
                            var exports = bapiComputeDueDate.ExportsPool;
                            exports.Set("I_BLDAT", Lib.AP.SAP.FormatToSAPDateTimeFormat(invoiceDate));
                            exports.Set("I_BUDAT", Lib.AP.SAP.FormatToSAPDateTimeFormat(postingDate));
                            exports.Set("I_ZFBDT", Lib.AP.SAP.FormatToSAPDateTimeFormat(baselineDate));
                            exports.Set("I_ZTERM", paymentTerms);
                            exports.Set("I_LIFNR", Sys.Helpers.String.SAP.NormalizeID(vendorNumber, 10));
                            exports.Set("I_BUKRS", companyCode);
                            exports.Set("I_KOART", "D");
                            exports.Set("I_SHKZG", invoiceAmount && invoiceAmount < 0 ? "H" : "S");
                            var exception = bapiComputeDueDate.Call();
                            if (!exception) {
                                var imports = bapiComputeDueDate.ImportsPool;
                                dueDate = imports.GetValue("E_FAEDE");
                                var dateDetails = bapiComputeDueDate.ImportsPool.Get("DATEDETAILS");
                                if (!dateDetails) {
                                    Log.Warn("The function module Z_ESK_DETERMINE_DUE_DATE is not up to date on SAP server.");
                                }
                                else {
                                    discountRate = imports.GetValue("DISCOUNT1");
                                    discountDate = discountRate > 0 ? dateDetails.GetValue("SK1DT") : null;
                                }
                            }
                        }
                        else {
                            Log.Warn("The function module Z_ESK_DETERMINE_DUE_DATE is missing on SAP server.");
                        }
                        if (computeDates) {
                            if (dueDate) {
                                dueDate = Sys.Helpers.SAP.FormatDateFromSAP(dueDate);
                            }
                            else {
                                dueDate = "";
                            }
                            if (discountDate) {
                                discountDate = Sys.Helpers.SAP.FormatDateFromSAP(discountDate);
                            }
                            else {
                                discountDate = "";
                            }
                            if (!keepUserEnteredDates || Data.IsEmpty("DueDate__")) {
                                Data.SetValue("DueDate__", dueDate);
                            }
                            if (!keepUserEnteredDates || Data.IsEmpty("DiscountLimitDate__")) {
                                Data.SetValue("DiscountLimitDate__", discountDate);
                            }
                        }
                        if (computeAmounts) {
                            if (discountRate > 0) {
                                var estimatedDiscountAmount = Data.GetValue("NetAmount__") * (discountRate / 100);
                                Data.SetValue("EstimatedDiscountAmount__", estimatedDiscountAmount);
                                Data.SetValue("LocalEstimatedDiscountAmount__", estimatedDiscountAmount * Data.GetValue("ExchangeRate__"));
                            }
                            else {
                                Data.SetValue("EstimatedDiscountAmount__", "");
                                Data.SetValue("LocalEstimatedDiscountAmount__", "");
                            }
                        }
                    }
                    else {
                        if (computeDates) {
                            Data.SetValue("DueDate__", "");
                            Data.SetValue("DiscountLimitDate__", "");
                        }
                        if (computeAmounts) {
                            Data.SetValue("EstimatedDiscountAmount__", "");
                            Data.SetValue("LocalEstimatedDiscountAmount__", "");
                            Data.SetValue("EstimatedLatePaymentFee__", "");
                            Data.SetValue("LocalEstimatedLatePaymentFee__", "");
                        }
                    }
                    Lib.ERP.SAP.InvoiceServer.prototype.ComputeLatePaymentFee();
                };
                /**
                * When a valid PO is found, search for the associated vendor
                * @memberof Lib.ERP.Invoice
                * @param {string} companyCode The associated company code
                * @param {string} vendorNumber The vendor number found from the PO
                * @param {string} vendorName The vendor name found from the PO
                * @param {string} taxID The tax ID found from the PO
                * @param {Function} fillVendorFieldsFromQueryResult The callback to call when a valid vendor is found
                * to fill the Vendor panel
                */
                InvoiceServer.prototype.SearchVendorNumber = function (companyCode, vendorNumber, vendorName, fillVendorFieldsFromQueryResult, taxID) {
                    var res = Lib.P2P.FirstTimeRecognition_Vendor.SearchVendorNumber(companyCode, vendorNumber, vendorName, fillVendorFieldsFromQueryResult, taxID);
                    // If not found search in SAP If SAP mode
                    if (!res) {
                        Lib.AP.SAP.GetVendorDetailsFromSAP(companyCode, vendorNumber, vendorName, taxID);
                    }
                    return true;
                };
                InvoiceServer.prototype.SearchVendorFromPO = function (companyCode, vendorNumber, vendorName, fillVendorFieldsFromQueryResult, taxID) {
                    return this.SearchVendorNumber(companyCode, vendorNumber, vendorName, fillVendorFieldsFromQueryResult, taxID);
                };
                InvoiceServer.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    return true;
                };
                InvoiceServer.prototype.FormatOrderNumberCandidates = function (orderNumbersCandidates) {
                    return orderNumbersCandidates;
                };
                InvoiceServer.prototype.ValidateOrdersAndFillPO = function (orderNumberCandidates, searchVendorNumber, type, ERPConnected, reconcileInvoiceWithPO) {
                    var res = Lib.AP.Extraction.ValidateOrdersAndFillPO(orderNumberCandidates, searchVendorNumber, type, ERPConnected);
                    if (res && typeof reconcileInvoiceWithPO === "function") {
                        return reconcileInvoiceWithPO();
                    }
                    return res;
                };
                InvoiceServer.prototype.FillGLLines = function () {
                    return Lib.AP.Extraction.FillGLLines();
                };
                InvoiceServer.prototype.UpdateGLLineFromMapperDocument = function (item) {
                    Lib.AP.SAP.UpdateGLCCDescriptions(item);
                };
                /**
                 * Saves template
                 * @param {string} table tableName
                 * @param {IData} data data to save
                 * @param {Sys.Helpers.Database} dataBaseHelper helper
                 */
                InvoiceServer.prototype.SaveTemplate = function (table, data, dataBaseHelper) {
                    Lib.AP.Parameters.SaveTemplate(table, data, dataBaseHelper);
                };
                /**
                 * Specific behavior on ending extraction
                 */
                InvoiceServer.prototype.EndExtraction = function () {
                    // do nothing
                };
                InvoiceServer.prototype.ValidateData = function ( /*actionName: string, actionType: string*/) {
                    return true;
                };
                /**
                 * Runs specific behavior on matching criteria
                 * @param {string} actionType
                 * @param {string} actionName
                 * @param {Sys.WorkflowController.IWorkflowContributor} [actionContributor]
                 */
                InvoiceServer.prototype.OnValidationActionEnd = function ( /*actionType: string, actionName: string | "", actionContributor: Sys.WorkflowController.IWorkflowContributor | null*/) {
                    // do nothing
                };
                /**
                 * Reconciles invoice with PO
                 */
                InvoiceServer.prototype.ReconcileInvoice = function () {
                    Lib.AP.Reconciliation.reconcileInvoice();
                };
                /**
                 * Updates balance
                 */
                InvoiceServer.prototype.UpdateBalance = function () {
                    Lib.AP.UpdateBalance(Lib.AP.TaxHelper.computeHeaderTaxAmount);
                };
                return InvoiceServer;
            }(Lib.ERP.SAP.Invoice));
            SAP.InvoiceServer = InvoiceServer;
        })(SAP = ERP.SAP || (ERP.SAP = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAP.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.SAP.InvoiceServer(manager);
};
