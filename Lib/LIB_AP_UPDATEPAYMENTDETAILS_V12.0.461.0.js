///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_UpdatePaymentDetails_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Custom library to change behavior of Lib_AP_UpdatePaymentDetails",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_Comment_Helper_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_CSVReader",
    "[Lib_AP_UpdatePaymentDetails_Parameters_V12.0.461.0]"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var UpdatePaymentDetails;
        (function (UpdatePaymentDetails) {
            function csvLineSkipped(line, reason, isError) {
                var msg = "Skipped CSV line [" + line + "]: " + reason;
                if (isError) {
                    Log.Error(msg);
                }
                else {
                    Log.Warn(msg);
                }
            }
            UpdatePaymentDetails.csvHelper = null;
            UpdatePaymentDetails.erpMgr = null;
            // List of the mandatory CSV headers in the input file (the order doesn't matter).
            var CSVHeaders = ["Company code", "Vendor number", "Invoice number", "Payment date", "Payment method", "Payment reference"];
            var CSVHeadersToJson = {
                "Company code": "companyCode",
                "Vendor number": "vendorNumber",
                "Invoice number": "invoiceNumber",
                "Payment date": "paymentDate",
                "Payment method": "paymentMethod",
                "Payment reference": "paymentReference"
            };
            /**
             * Determine the current mode of the payment update
             * @return {string} The mode of execution (SingleInvoice, AdminList, CSV or none)
             */
            function GetMode() {
                var sourceRuid = Data.GetValue("SourceRUID");
                var ancestorsRuid = Variable.GetValueAsString("AncestorsRuid");
                if (Attach.GetNbAttach() > 0 && Attach.GetExtension(0).toLowerCase() === ".csv") {
                    Log.Info("'CSV' mode");
                    return "CSV";
                }
                else if (sourceRuid) {
                    Log.Info("'Single invoice' mode (SourceRUID=" + sourceRuid + ")");
                    return "SingleInvoice";
                }
                else if (ancestorsRuid) {
                    Log.Info("'From admin list' mode (AncestorsRuid=" + ancestorsRuid + ")");
                    return "AdminList";
                }
                return "none";
            }
            UpdatePaymentDetails.GetMode = GetMode;
            // This function checks if all CSV mapped names in the mapping can be found in the CSV headers
            function CheckCSVHeaders() {
                // Setup filename and do some checks
                var csvHelperTmp = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                csvHelperTmp.GuessSeparator();
                var nbAttach = Attach.GetNbAttach();
                if (nbAttach === 0) {
                    Log.Warn("No CSV attached");
                    return "_error_no_csv_attached";
                }
                if (!csvHelperTmp || !CSVHeaders) {
                    Log.Error("Invalid inputs in CheckCSVHeaders");
                    return "_error_bad_csv_headers";
                }
                for (var i = 0; i < CSVHeaders.length; i++) {
                    // Search this name in the header (if not null, can be null for hardcoded values)
                    if (csvHelperTmp.GetHeaderIndex(CSVHeaders[i]) < 0) {
                        Log.Warn("Bad CSV file headers : couldn't find column \"" + CSVHeaders[i] + "\" in the CSV headers.");
                        return "_error_bad_csv_headers";
                    }
                }
                return null;
            }
            UpdatePaymentDetails.CheckCSVHeaders = CheckCSVHeaders;
            /**
             * Create an intance of a CSVReader object with the parameters definition above
             * @return {object} An instance of Sys.Helpers.CSVReader
             */
            function CreateCSVHelper() {
                if (!Lib.AP.UpdatePaymentDetails.csvHelper) {
                    // Create helper on the first attachment
                    Lib.AP.UpdatePaymentDetails.csvHelper = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                    if (!Lib.AP.UpdatePaymentDetails.csvHelper) {
                        Log.Warn("Sys.Helpers.CSVReader.CreateInstance(0, \"V2\") is null");
                    }
                    Lib.AP.UpdatePaymentDetails.csvHelper.RemoveDoubleQuotes = true;
                    Lib.AP.UpdatePaymentDetails.csvHelper.GuessSeparator();
                }
            }
            UpdatePaymentDetails.CreateCSVHelper = CreateCSVHelper;
            function CreatePaymentsForUpdate(ruids) {
                var payments = {};
                var ruidexList = ruids.split("|");
                for (var i = 0; i < ruidexList.length; i++) {
                    var ruidex = ruidexList[i];
                    var invoice = {
                        paymentReference: Data.GetValue("PaymentReference__"),
                        paymentDate: Data.GetValue("PaymentDate__"),
                        paymentMethod: Data.GetValue("Payment_method__"),
                        valueFromCombo: true,
                        queryFilter: "Ruidex=" + ruidex
                    };
                    payments[ruidex] = invoice;
                }
                return payments;
            }
            UpdatePaymentDetails.CreatePaymentsForUpdate = CreatePaymentsForUpdate;
            function GetKeyFromRecord(record, fields) {
                var vars = record.GetUninheritedVars();
                var key = "";
                if (typeof fields === "string") {
                    key = vars.GetValue_String(fields, 0);
                }
                else {
                    for (var f in fields) {
                        if (Object.prototype.hasOwnProperty.call(fields, f)) {
                            if (key) {
                                key += "#";
                            }
                            key += vars.GetValue_String(fields[f], 0);
                        }
                    }
                }
                return key ? key.toUpperCase() : "";
            }
            UpdatePaymentDetails.GetKeyFromRecord = GetKeyFromRecord;
            /**
             * Create PaymentInformation object based on a CSV line
             * @param {object} lineObject A lineObject for extracting payment informations
             * @return {object} A PaymentInformation object
             */
            function CreatePaymentInformation(lineObject) {
                var payment = {};
                for (var i = 0; i < CSVHeaders.length; i++) {
                    var field = CSVHeaders[i];
                    if (!field) {
                        Log.Warn("The field: " + field + " does not exist or is empty");
                        return null;
                    }
                    var fldValue = lineObject.getValue(field);
                    if (typeof fldValue === "undefined") {
                        return null;
                    }
                    payment[CSVHeadersToJson[field]] = fldValue;
                }
                var escapeFilterValue = Sys.Helpers.String.EscapeValueForLdapFilter;
                payment.queryFilter = "&(Deleted=0)(State!=400)(State!=300)(State!=200)(CompanyCode__=" + escapeFilterValue(payment.companyCode) + ")(InvoiceNumber__=" + escapeFilterValue(payment.invoiceNumber) + ")(VendorNumber__=" + escapeFilterValue(payment.vendorNumber) + ")";
                return payment;
            }
            UpdatePaymentDetails.CreatePaymentInformation = CreatePaymentInformation;
            function GetCurrentUser() {
                var curUser = Users.GetUser(Variable.GetValueAsString("CurrentUserId"));
                if (!curUser) {
                    curUser = Users.GetUser(Data.GetValue("OwnerId"));
                }
                return curUser;
            }
            UpdatePaymentDetails.GetCurrentUser = GetCurrentUser;
            function GenerateCSVToJson(nbLines) {
                var allPayments = {};
                var updatedCount = 0;
                Lib.AP.UpdatePaymentDetails.CreateCSVHelper();
                Lib.AP.UpdatePaymentDetails.csvHelper.ForEach(function (line) {
                    var lineObject = Lib.AP.UpdatePaymentDetails.csvHelper.GetCurrentLineObject();
                    var key = lineObject.getValue("Company code") + "#" + lineObject.getValue("Vendor number") + "#" + lineObject.getValue("Invoice number");
                    key = key.toUpperCase();
                    if (!allPayments[key]) {
                        var payment = Lib.AP.UpdatePaymentDetails.CreatePaymentInformation(lineObject);
                        if (payment) {
                            allPayments[key] = payment;
                            updatedCount++;
                        }
                        else {
                            csvLineSkipped(line, "invalid format", true);
                        }
                    }
                    else {
                        csvLineSkipped(line, "duplicate key for CSV line");
                    }
                }, this, nbLines);
                Log.Info(updatedCount + " line(s) extracted from CSV.");
                return allPayments;
            }
            UpdatePaymentDetails.GenerateCSVToJson = GenerateCSVToJson;
            function GetPaymentMethod(PaymentDetails) {
                var defaultPaymentMethod = "Other";
                if (!PaymentDetails.paymentMethod || !PaymentDetails.paymentMethod.toLowerCase) {
                    return defaultPaymentMethod;
                }
                if (PaymentDetails.valueFromCombo) {
                    // The value was selected from the vendor invoice form, no need to use the payment mapping
                    return PaymentDetails.paymentMethod;
                }
                // Handle ERP-specific payment methods
                if (UpdatePaymentDetails.erpMgr) {
                    var paymentDocument = UpdatePaymentDetails.erpMgr.GetDocument("INVOICE_PAYMENTS");
                    // Keep the mapping value - do not normalize the value as the Vendor invoice possible values might have been customized.
                    return paymentDocument.GetPaymentMethodFromERPCode(PaymentDetails.paymentMethod, PaymentDetails.companyCode);
                }
                Log.Warn("GetPaymentMethod - No ERP Manager set - returning default payment method");
                return defaultPaymentMethod;
            }
            UpdatePaymentDetails.GetPaymentMethod = GetPaymentMethod;
            function updateInvoiceHistory(vars, curUserVars, options) {
                var fullUserStr = "";
                // In case of automatic update (like for scheduled reports), no user is added in invoice history
                if (!options || !options.automaticUpdate) {
                    fullUserStr = curUserVars.GetValue_String("FirstName", 0) + " " + curUserVars.GetValue_String("LastName", 0);
                }
                var newHistoryLine = Lib.AP.CommentHelper.ComputeHistoryLine(Language.Translate("_HistoryInvoicePaymentAction"), "", fullUserStr);
                vars.AddValue_String("History__", newHistoryLine + "\n" + vars.GetValue_String("History__", 0), true);
            }
            UpdatePaymentDetails.updateInvoiceHistory = updateInvoiceHistory;
            function updateInvoiceVars(vars, PaymentDetails, paymentMethod, curUser, options) {
                // Update VIP payment details
                vars.AddValue_String("InvoiceStatus__", Lib.AP.InvoiceStatus.Paid, true);
                vars.AddValue_String("PaymentReference__", PaymentDetails.paymentReference, true);
                vars.AddValue_String("PaymentMethod__", paymentMethod, true);
                vars.AddValue_Date("PaymentDate__", PaymentDetails.paymentDate, true);
                vars.AddValue_Long("PaidOnTime__", PaymentDetails.paidOnTime, true);
                // If the payment object provide additionalFields, update them
                var fieldList = PaymentDetails.additionalFields;
                if (fieldList) {
                    for (var field in fieldList) {
                        if (Object.prototype.hasOwnProperty.call(fieldList, field)) {
                            vars.AddValue_String(field, fieldList[field], true);
                        }
                    }
                }
                var curUserVars = curUser.GetVars();
                Lib.AP.UpdatePaymentDetails.updateInvoiceHistory(vars, curUserVars, options);
            }
            UpdatePaymentDetails.updateInvoiceVars = updateInvoiceVars;
            function updateVIPPayment(transport, vars, PaymentDetails, paymentMethod, curUser) {
                Lib.AP.UpdatePaymentDetails.updateInvoiceVars(vars, PaymentDetails, paymentMethod, curUser);
                try {
                    transport.Process();
                }
                catch (e) {
                    Log.Error("UpdateVIPAndCIPayment: Vendor invoice could not be updated: " + e);
                    return transport.GetLastErrorMessage();
                }
                return "";
            }
            UpdatePaymentDetails.updateVIPPayment = updateVIPPayment;
            function updateCIPayment(vars, PaymentDetails, paymentMethod, curUser) {
                var curUserVars = curUser.GetVars();
                var values = {
                    "RuidEx": vars.GetValue_String("PortalRuidEx__", 0),
                    "CompanyName__": curUserVars.GetValue_String("Company", 0),
                    "NetAmount__": vars.GetValue_String("NetAmount__", 0),
                    "Invoice_amount__": vars.GetValue_Double("InvoiceAmount__", 0),
                    "InvoiceCurrency__": vars.GetValue_String("InvoiceCurrency__", 0),
                    "InvoiceNumber__": vars.GetValue_String("InvoiceNumber__", 0),
                    "Invoice_date__": vars.GetValue_Date("InvoiceDate__", 0),
                    "PaymentDate__": PaymentDetails.paymentDate,
                    "PaymentMethod__": paymentMethod,
                    "PaymentReference__": PaymentDetails.paymentReference,
                    "VendorNumber__": vars.GetValue_String("VendorNumber__", 0),
                    "VendorName__": vars.GetValue_String("VendorName__", 0),
                    "CompanyCode__": vars.GetValue_String("CompanyCode__", 0)
                };
                // To avoid timezone error on formatting, add 13h
                if (values.Invoice_date__.setHours) {
                    values.Invoice_date__.setHours(13);
                }
                var field = Lib.AP.VendorPortal.GetParametersFromDataPayment(values, paymentMethod, Lib.AP.InvoiceStatus.ToPay);
                Lib.AP.VendorPortal.ValidationScriptBegins(field);
                field = Lib.AP.VendorPortal.GetParametersFromDataPayment(values, paymentMethod, Lib.AP.InvoiceStatus.Paid);
                var ci = Lib.AP.VendorPortal.ValidationScriptEnds(field);
                if (!ci.transport) {
                    // transport not found: it has been purged
                    return true;
                }
                else if (ci.updated && ci.transport) {
                    var subject = {
                        key: "_Customer invoice paid {0}",
                        parameters: [values.InvoiceNumber__]
                    };
                    Lib.AP.VendorPortal.NotifyVendor(ci.transport, subject, "AP-Vendor_InvoicePaid.htm", values, curUser);
                    return true;
                }
                return false;
            }
            UpdatePaymentDetails.updateCIPayment = updateCIPayment;
            function updateVIPAndCIPayment(transport, PaymentDetails, curUser, options) {
                var vars = transport.GetUninheritedVars();
                var ownerShipToken = "INV_UPD_PAYMENT" + vars.GetValue_String("RUIDEX", 0);
                if (options && options.testMode) {
                    Log.Info("TEST MODE - Invoice paid " + vars.GetValue_String("RUIDEX", 0) + " / " + vars.GetValue_String("PortalRuidEx__", 0));
                    return "";
                }
                if (Sys.Helpers.GetOwnershipIfNeeded(transport, ownerShipToken)) {
                    if (transport.GetLastError() !== 0) {
                        transport.ReleaseAsyncOwnership(ownerShipToken);
                        return transport.GetLastErrorMessage();
                    }
                    // Format some values
                    if (!(PaymentDetails.paymentDate instanceof Date)) {
                        PaymentDetails.paymentDate = Sys.Helpers.Date.ISOSTringToDate(PaymentDetails.paymentDate);
                    }
                    if (!PaymentDetails.companyCode) {
                        PaymentDetails.companyCode = vars.GetValue_String("CompanyCode__", 0);
                    }
                    var paymentMethod = Lib.AP.UpdatePaymentDetails.GetPaymentMethod(PaymentDetails);
                    PaymentDetails.paidOnTime = 0;
                    var dueDate = vars.GetValue_Date("DueDate__", 0);
                    if (dueDate) {
                        dueDate.setHours(PaymentDetails.paymentDate.getHours());
                    }
                    if (!dueDate || dueDate >= PaymentDetails.paymentDate) {
                        PaymentDetails.paidOnTime = 1;
                    }
                    // Update CI and VIP
                    try {
                        if (Lib.AP.UpdatePaymentDetails.updateCIPayment(vars, PaymentDetails, paymentMethod, curUser)) {
                            // Update VIP only if the CI was successfully updated.
                            // This way, the payment update will be retried on the next scheduled execution.
                            return Lib.AP.UpdatePaymentDetails.updateVIPPayment(transport, vars, PaymentDetails, paymentMethod, curUser);
                        }
                    }
                    finally {
                        transport.ReleaseAsyncOwnership(ownerShipToken);
                    }
                }
                return transport.GetLastErrorMessage();
            }
            UpdatePaymentDetails.updateVIPAndCIPayment = updateVIPAndCIPayment;
            function getQueryFilter(json) {
                var filter = "";
                var position = 1;
                for (var key in json) {
                    if (Object.prototype.hasOwnProperty.call(json, key)) {
                        var oneInvoice = json[key];
                        if (position === 1) {
                            filter = oneInvoice.queryFilter;
                            position++;
                        }
                        else if (position === 2) {
                            filter = "|(" + filter + ")(" + oneInvoice.queryFilter + ")";
                            position++;
                        }
                        else {
                            filter = filter + "(" + oneInvoice.queryFilter + ")";
                        }
                    }
                }
                return filter;
            }
            UpdatePaymentDetails.getQueryFilter = getQueryFilter;
            /**
            * @param {objects} paymentsUpdate : A dictionary of object which contains the informations to update the payment status of an invoice
            *		The mandatory properties of this object are
            *		{
            *			paymentDate: new Date(),
            *			paymentMethod: "",
            *			paymentReference: "",
            *			queryFilter: MSNEX=123 : A valid query filter to retreive the invoice to update
            *		}
            *		Optional properties
            *			additionalFields: Custom value to add to Vendor Invoice Processing record before payment update
            *		The property "paidOnTime" of the PaymentInfo object will be determined later by comparing the invoice due date and payment date.
            *
            * @param {string} processName : The kind of process to update (Vendor invoice, Vendor invoice)
            * @param {string/object} : The record values used to determine the key of the paymentsUpdate dictionnary
            * @param {object} options : Options to apply to the update.
            *			{
            *				automaticUpdate: false // Indique that the update is not done by a user.
            *			}
            **/
            function JSONToUpdatePaymentDetails(paymentsUpdate, curUser, processName, columnKeys, options) {
                function CountRecords(sTable, sFilter) {
                    var queryCount = Process.CreateQueryAsProcessAdmin();
                    queryCount.Reset();
                    queryCount.SetSpecificTable(sTable);
                    queryCount.SetSearchInArchive(true);
                    queryCount.SetFilter(sFilter);
                    queryCount.SetOptionEx("DoNotGetLocalDBFiles=1");
                    queryCount.SetOptionEx("FastSearch=-1");
                    return queryCount.GetRecordCount();
                }
                if (paymentsUpdate && Object.keys(paymentsUpdate).length === 0) {
                    Log.Warn("No payments update defined");
                    return true;
                }
                var cntSkipped = 0;
                var cntUpdated = 0;
                var BlockSize = 100; // Fetch by Block of 100 (same as CSV), lower it to enable the block splitting. Can resolve issues such as https://esker.lightning.force.com/lightning/r/RDScrumCase__c/a1Y4y000008UvKcEAK/view
                var table = "CDNAME#" + processName;
                var filter = Lib.AP.UpdatePaymentDetails.getQueryFilter(paymentsUpdate);
                var RecordCount = CountRecords(table, filter);
                var fetchedRecords = 0;
                var lastMsnEx = "";
                Log.Info("Record count: " + RecordCount);
                Data.SetValue("CountedRecords__", RecordCount);
                while (fetchedRecords < RecordCount) {
                    var realFilter = filter;
                    if (lastMsnEx != "") {
                        realFilter = "(&(msnex>".concat(lastMsnEx, ")(").concat(filter, "))");
                    }
                    var queryLoop = Process.CreateQueryAsProcessAdmin();
                    queryLoop.SetSpecificTable(table);
                    queryLoop.SetSearchInArchive(true);
                    queryLoop.SetAttributesList("InvoiceNumber__,VendorNumber__,InvoiceStatus__,PortalRuidEx__,RuidEx,ProcessId,NetAmount__,InvoiceAmount__,InvoiceDate__,InvoiceCurrency__,VendorName__,CompanyCode__,PaymentMethod__,PaymentReference__,msnex,State,History__,DueDate__");
                    queryLoop.SetSortOrder("msnex ASC");
                    queryLoop.SetFilter(realFilter);
                    queryLoop.SetOptionEx("Limit=" + BlockSize);
                    queryLoop.SetOptionEx("FastSearch=-1");
                    queryLoop.SetOptionEx("DoNotGetLocalDBFiles=1");
                    var transports = queryLoop.GetNTransports(BlockSize);
                    if (!transports) {
                        Log.Warn("NO FETCHED RECORDS");
                        break;
                    }
                    else {
                        var cTransports = transports.GetNbTransports();
                        Log.Verbose("FETCHED this loop " + cTransports + " RECORDS");
                        for (var iTrsp = 0; iTrsp < cTransports; iTrsp++) {
                            var transport = transports.GetTransport(iTrsp);
                            if (!transport) {
                                Log.Verbose("GetTransport(" + iTrsp + ") result in null object");
                                continue;
                            }
                            var vars = transport.GetUninheritedVars();
                            lastMsnEx = vars.GetValue_String("msnex", 0);
                            fetchedRecords++;
                            var key = Lib.AP.UpdatePaymentDetails.GetKeyFromRecord(transport, columnKeys);
                            Log.Verbose("FETCHED " + lastMsnEx + " with payment key : " + key);
                            if (paymentsUpdate[key]) {
                                var invoiceState = vars.GetValue_String("InvoiceStatus__", 0);
                                if (invoiceState === Lib.AP.InvoiceStatus.ToPay || invoiceState === Lib.AP.InvoiceStatus.BeingPaid) {
                                    var errorMessage = Lib.AP.UpdatePaymentDetails.updateVIPAndCIPayment(transport, paymentsUpdate[key], curUser, options);
                                    // eslint-disable-next-line max-depth
                                    if (!errorMessage) {
                                        cntUpdated++;
                                    }
                                    else {
                                        Log.Verbose(errorMessage);
                                        cntSkipped++;
                                    }
                                    /** Only delete the key if the invoice is to pay or paid
                                     * (in case of not-yet-treated duplicates invoices, we don't
                                     * want the key to be deleted before the real invoice is marked
                                     * as paid)
                                     */
                                    delete paymentsUpdate[key];
                                }
                                else if (invoiceState === Lib.AP.InvoiceStatus.Paid) {
                                    Log.Verbose("No need update for invoice " + transport.GetUninheritedVars().GetValue_String("ruidex", 0) + " : already in paid state");
                                    /** Only delete the key if the invoice is to pay or paid
                                     * (in case of not-yet-treated duplicates invoices, we don't
                                     * want the key to be deleted before the real invoice is marked
                                     * as paid)
                                     */
                                    delete paymentsUpdate[key];
                                }
                                else {
                                    cntSkipped++;
                                    Log.Verbose("Skipped invoice ".concat(transport.GetUninheritedVars().GetValue_String("ruidex", 0), " : invoice is not in to pay state. Actual state : ").concat(invoiceState));
                                }
                            }
                            else {
                                Log.Verbose("Skipped invoice " + transport.GetUninheritedVars().GetValue_String("ruidex", 0) + " : invoice with same vendor number and invoice number was already updated.");
                            }
                        }
                        if (cTransports == 0) {
                            break;
                        }
                    }
                }
                Log.Info("".concat(fetchedRecords, " invoices fetched on ").concat(RecordCount, " invoices founded with query"));
                Log.Info(cntUpdated + " invoice(s) payment details updated");
                // Log skipped lines
                for (var line in paymentsUpdate) {
                    if (Object.prototype.hasOwnProperty.call(paymentsUpdate, line)) {
                        csvLineSkipped(paymentsUpdate[line].queryFilter, " No invoice matching line");
                    }
                }
                if (cntSkipped === 0) {
                    return true;
                }
                return false;
            }
            UpdatePaymentDetails.JSONToUpdatePaymentDetails = JSONToUpdatePaymentDetails;
        })(UpdatePaymentDetails = AP.UpdatePaymentDetails || (AP.UpdatePaymentDetails = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
