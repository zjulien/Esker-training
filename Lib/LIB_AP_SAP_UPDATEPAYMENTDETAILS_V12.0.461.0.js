///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_UpdatePaymentDetails_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: SAP AP routines",
  "require": [
    "Lib_AP_SAP_Server_V12.0.461.0",
    "Lib_AP_UpdatePaymentDetails_V12.0.461.0",
    "Lib_ERP_SAP_Manager_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Manager_V12.0.461.0",
    "Sys/Sys_Parameters",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_CSVReader",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var UpdatePaymentDetails;
            (function (UpdatePaymentDetails) {
                var g_testMode = false;
                var g_debug = false;
                function debugLog(msg, o) {
                    if (g_debug || g_testMode) {
                        // By default the Debug__ field does not exist on the process
                        Data.SetValue("Debug__", Data.GetValue("Debug__") + "\n" + msg + ": " + JSON.stringify(o));
                    }
                }
                var invoicePaymentDocument = {
                    paymentDocument: {},
                    Get: function (configuration) {
                        if (!this.paymentDocument[configuration]) {
                            var erpManager = Lib.AP.SAP.UpdatePaymentDetails.GetErpManager(configuration);
                            if (erpManager) {
                                this.paymentDocument[configuration] = erpManager.GetDocument("INVOICE_PAYMENTS");
                            }
                        }
                        return this.paymentDocument[configuration];
                    }
                };
                var PaymentInformation = /** @class */ (function () {
                    function PaymentInformation(csvLineArray) {
                        this.msnex = null;
                        this.sapDocId = null;
                        this.MMDocId = null;
                        this.configuration = null;
                        // SAP payments informations
                        this.clearingDate = null;
                        this.paymentMethod = null;
                        this.SAPPaymentMethod = null;
                        this.paymentReference = null;
                        this.vendorNumber = null;
                        if (csvLineArray) {
                            this.InitFromCsv(csvLineArray);
                        }
                    }
                    PaymentInformation.prototype.InitFromCsv = function (csvLineArray) {
                        if (!csvLineArray) {
                            return;
                        }
                        this.msnex = csvLineArray[0];
                        this.sapDocId = Lib.AP.ParseInvoiceDocumentNumber(csvLineArray[1], true);
                        this.MMDocId = Lib.AP.ParseInvoiceDocumentNumber(csvLineArray[2], true);
                        this.configuration = csvLineArray[3];
                        // According to the sprint and as the reports are not upgradable, the vendor number is not always included.
                        // The last column is always the invoice date
                        if (csvLineArray.length > 5) {
                            this.vendorNumber = csvLineArray[4];
                        }
                    };
                    PaymentInformation.prototype.GetKey = function () {
                        if (this.sapDocId) {
                            return this.sapDocId.stringValue;
                        }
                        return null;
                    };
                    return PaymentInformation;
                }());
                UpdatePaymentDetails.PaymentInformation = PaymentInformation;
                UpdatePaymentDetails.erpManagers = {};
                function GetErpManager(configuration) {
                    if (!Lib.AP.SAP.UpdatePaymentDetails.erpManagers[configuration]) {
                        Variable.SetValueAsString("CurrentConfigurationInstance", configuration);
                        var instance = Sys.Parameters.GetInstance(configuration);
                        instance.Init({
                            Default: {}
                        }, {
                            tableParameters: {
                                tableName: "AP - Application Settings__",
                                configuration: configuration,
                                mode: Sys.Parameters.Mode.SettingsAsColumns
                            },
                            defaultEnvironment: "Default"
                        }, {});
                        var erpManager = Lib.ERP.CreateManager(instance.GetParameter("ERP"));
                        erpManager.Init(configuration);
                        Lib.AP.SAP.UpdatePaymentDetails.erpManagers[configuration] = erpManager;
                    }
                    return Lib.AP.SAP.UpdatePaymentDetails.erpManagers[configuration];
                }
                UpdatePaymentDetails.GetErpManager = GetErpManager;
                function FinalizeErpManagers() {
                    for (var configuration in Lib.AP.SAP.UpdatePaymentDetails.erpManagers) {
                        if (Object.prototype.hasOwnProperty.call(Lib.AP.SAP.UpdatePaymentDetails.erpManagers, configuration)) {
                            Lib.AP.SAP.UpdatePaymentDetails.erpManagers[configuration].Finalize();
                        }
                    }
                }
                UpdatePaymentDetails.FinalizeErpManagers = FinalizeErpManagers;
                function GetNewPaymentInformation(csvLineArray) {
                    return new PaymentInformation(csvLineArray);
                }
                UpdatePaymentDetails.GetNewPaymentInformation = GetNewPaymentInformation;
                UpdatePaymentDetails.csvHelper = null;
                /**
                 * Create an intance of a CSVReader object or reload the current instance
                 * @return {object} An instance of Sys.Helpers.CSVReader
                 */
                function CreateCSVHelper() {
                    if (!Lib.AP.SAP.UpdatePaymentDetails.csvHelper && !Variable.GetValueAsString(Sys.Helpers.CSVReader.GetSerializeIdentifier())) {
                        Lib.AP.SAP.UpdatePaymentDetails.csvHelper = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                        Lib.AP.SAP.UpdatePaymentDetails.csvHelper.ReturnSeparator = "\n";
                        // read first line (Header line) and guess the separtor
                        Lib.AP.SAP.UpdatePaymentDetails.csvHelper.GuessSeparator();
                    }
                    else {
                        Lib.AP.SAP.UpdatePaymentDetails.csvHelper = Sys.Helpers.CSVReader.ReloadInstance("V2");
                    }
                }
                UpdatePaymentDetails.CreateCSVHelper = CreateCSVHelper;
                /**
                * Read the CSV file and return the PaymentInformation group by SAP Document Number
                **/
                function GetPaymentsFromFile(options) {
                    var payments = null;
                    Lib.AP.SAP.UpdatePaymentDetails.CreateCSVHelper();
                    Lib.AP.SAP.UpdatePaymentDetails.csvHelper.ForEach(function () {
                        var payment = Lib.AP.SAP.UpdatePaymentDetails.GetNewPaymentInformation(Lib.AP.SAP.UpdatePaymentDetails.csvHelper.GetCurrentLineArray());
                        var paymentKey = payment.GetKey();
                        if (paymentKey) {
                            payments = payments || {};
                            payments[payment.configuration] = payments[payment.configuration] || { "MM": {}, "FI": {} };
                            if (payment.MMDocId) {
                                payments[payment.configuration].MM[paymentKey] = payment;
                            }
                            else {
                                payments[payment.configuration].FI[paymentKey] = payment;
                            }
                        }
                    }, Lib.AP.SAP.UpdatePaymentDetails, options ? options.maxElements : null);
                    return payments;
                }
                UpdatePaymentDetails.GetPaymentsFromFile = GetPaymentsFromFile;
                function CreatePayment(sapPayment) {
                    var paymentUpdate = {
                        paymentDate: sapPayment.clearingDate,
                        paymentMethod: sapPayment.paymentMethod,
                        companyCode: sapPayment.sapDocId.companyCode,
                        paymentReference: sapPayment.paymentReference,
                        queryFilter: "MSNEX=" + sapPayment.msnex,
                        additionalFields: {
                            "SAPPaymentMethod__": sapPayment.SAPPaymentMethod
                        }
                    };
                    return paymentUpdate;
                }
                UpdatePaymentDetails.CreatePayment = CreatePayment;
                function FillPaymentsForUpdate(allPayments, sapPaymentsType) {
                    for (var key in sapPaymentsType) {
                        if (Object.prototype.hasOwnProperty.call(sapPaymentsType, key)) {
                            var sapPayment = sapPaymentsType[key];
                            if (sapPayment.clearingDate) {
                                allPayments[sapPayment.msnex] = Lib.AP.SAP.UpdatePaymentDetails.CreatePayment(sapPayment);
                            }
                        }
                    }
                }
                UpdatePaymentDetails.FillPaymentsForUpdate = FillPaymentsForUpdate;
                function CreatePaymentsForUpdate(sapPayments) {
                    var allPayments = {};
                    Lib.AP.SAP.UpdatePaymentDetails.FillPaymentsForUpdate(allPayments, sapPayments.FI);
                    Lib.AP.SAP.UpdatePaymentDetails.FillPaymentsForUpdate(allPayments, sapPayments.MM);
                    return allPayments;
                }
                UpdatePaymentDetails.CreatePaymentsForUpdate = CreatePaymentsForUpdate;
                function ReverseVIPAndCI(msnex) {
                    // Reverse VIP invoices
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.SetSpecificTable("CDNAME#Vendor invoice");
                    query.SetAttributesList("InvoiceNumber__,VendorNumber__,InvoiceStatus__,PortalRuidEx__,RuidEx,ProcessId,NetAmount__,InvoiceAmount__,InvoiceDate__,InvoiceCurrency__,VendorName__,CompanyCode__,PaymentMethod__,PaymentReference__,msnex,State,History__");
                    query.SetSortOrder("InvoiceDate__ DESC");
                    query.SetSearchInArchive(true);
                    query.SetFilter("MSNEX=" + msnex);
                    if (query.MoveFirst()) {
                        var transport = query.MoveNext();
                        if (transport) {
                            var vars = transport.GetUninheritedVars();
                            if (vars) {
                                if (g_testMode) {
                                    Log.Info("TEST MODE - Invoice reversed " + vars.GetValue_String("RUIDEX", 0) + " / " + vars.GetValue_String("PortalRuidEx__", 0));
                                    return true;
                                }
                                // Update CI
                                var values = {
                                    Reversed: true,
                                    portal_ruidex__: vars.GetValue_String("PortalRuidEx__", 0),
                                    Invoice_status__: Lib.AP.InvoiceStatus.ToPay
                                };
                                Lib.AP.VendorPortal.ValidationScriptBegins(values);
                                values.Invoice_status__ = Lib.AP.InvoiceStatus.Rejected;
                                var ci = Lib.AP.VendorPortal.ValidationScriptEnds(values);
                                if (ci.transport && !ci.updated) {
                                    // Something went wrong when trying to update CI - return
                                    return false;
                                }
                                // Update VI
                                var ownerShipToken = "INV_REVERSED" + vars.GetValue_String("RUIDEX", 0);
                                if (Sys.Helpers.GetOwnershipIfNeeded(transport, ownerShipToken)) {
                                    vars.AddValue_String("InvoiceStatus__", Lib.AP.InvoiceStatus.Reversed, true);
                                    try {
                                        transport.Process();
                                    }
                                    catch (e) {
                                        Log.Error("ReverseVIPAndCI: Vendor invoice could not be updated: " + e);
                                        return false;
                                    }
                                    finally {
                                        transport.ReleaseAsyncOwnership(ownerShipToken);
                                    }
                                }
                                return true;
                            }
                        }
                    }
                    return false;
                }
                UpdatePaymentDetails.ReverseVIPAndCI = ReverseVIPAndCI;
                function ManagePaidInvoices(sapPayment, owner, invoicePaymentsDoc, configuration) {
                    var paymentsUpdate = null;
                    // 2. Check for paid invoices in SAP
                    var payments = invoicePaymentsDoc.GetPayments(sapPayment, configuration);
                    if (payments) {
                        paymentsUpdate = Lib.AP.SAP.UpdatePaymentDetails.CreatePaymentsForUpdate(payments);
                    }
                    if (paymentsUpdate) {
                        var options = { automaticUpdate: true, testMode: g_testMode };
                        debugLog("PaymentUpdates", paymentsUpdate);
                        Lib.AP.UpdatePaymentDetails.erpMgr = invoicePaymentsDoc.manager;
                        Lib.AP.UpdatePaymentDetails.JSONToUpdatePaymentDetails(paymentsUpdate, owner, "Vendor invoice", "MSNEX", options);
                    }
                }
                function ManageReversedInvoices(sapPayment, invoicePaymentsDoc) {
                    var cntUpdated = 0;
                    // 1. Check for reversed invoices in SAP
                    var reversedInvoices = invoicePaymentsDoc.GetReversedInvoices(sapPayment);
                    for (var i = 0; i < reversedInvoices.length; i++) {
                        var reversedInvoice = reversedInvoices[i];
                        if (reversedInvoice.isMM) {
                            // MM invoice - find invoice in sapPayments
                            for (var key in sapPayment.MM) {
                                if (reversedInvoice.documentNumber === sapPayment.MM[key].MMDocId.documentNumber) {
                                    if (Lib.AP.SAP.UpdatePaymentDetails.ReverseVIPAndCI(sapPayment.MM[key].msnex)) {
                                        cntUpdated++;
                                    }
                                    delete sapPayment.MM[key];
                                }
                            }
                        }
                        else if (reversedInvoice.stringValue in sapPayment.FI) {
                            // FI invoice
                            if (Lib.AP.SAP.UpdatePaymentDetails.ReverseVIPAndCI(sapPayment.FI[reversedInvoice.stringValue].msnex)) {
                                cntUpdated++;
                            }
                            delete sapPayment.FI[reversedInvoice.stringValue];
                        }
                    }
                    Log.Info(cntUpdated + " invoice(s) reversed");
                }
                /**
                * returns 0 NOT FINISHED
                * returns 1 FINISHED
                */
                function UpdateInvoices(updateInvoicesOptions) {
                    var nbLoop = 0;
                    var owner = Users.GetUser(Data.GetValue("OwnerId"));
                    var sapPayments = Lib.AP.SAP.UpdatePaymentDetails.GetPaymentsFromFile(updateInvoicesOptions);
                    while (sapPayments) {
                        debugLog("sapPayments", sapPayments);
                        for (var configuration in sapPayments) {
                            if (Object.prototype.hasOwnProperty.call(sapPayments, configuration)) {
                                var invoicePaymentsDocument = invoicePaymentDocument.Get(configuration);
                                Log.Info("Update payments for configuration: " + configuration);
                                ManageReversedInvoices(sapPayments[configuration], invoicePaymentsDocument);
                                ManagePaidInvoices(sapPayments[configuration], owner, invoicePaymentsDocument, configuration);
                                nbLoop++;
                                Lib.AP.SAP.UpdatePaymentDetails.csvHelper.SerializeCurrentState();
                                if (updateInvoicesOptions && updateInvoicesOptions.nbLoopsPerRecall && nbLoop >= updateInvoicesOptions.nbLoopsPerRecall) {
                                    Lib.AP.SAP.UpdatePaymentDetails.FinalizeErpManagers();
                                    return 0;
                                }
                            }
                        }
                        sapPayments = Lib.AP.SAP.UpdatePaymentDetails.GetPaymentsFromFile(updateInvoicesOptions);
                    }
                    Lib.AP.SAP.UpdatePaymentDetails.FinalizeErpManagers();
                    return 1;
                }
                UpdatePaymentDetails.UpdateInvoices = UpdateInvoices;
            })(UpdatePaymentDetails = SAP.UpdatePaymentDetails || (SAP.UpdatePaymentDetails = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
