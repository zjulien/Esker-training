///#GLOBALS Sys
/// <reference path="Lib_AP_VendorPortal.ts" />
/* LIB_DEFINITION{
  "name": "LIB_AP_VendorPortal_CreateFromFlipPO_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Fill a Customer invoice created from a FlipPO process",
  "require": [
    "LIB_AP_VendorPortal_CIData_V12.0.461.0",
    "[Lib_AP_Customization_VendorPortal]",
    "Sys/Sys_AP_Server"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var VendorPortal;
        (function (VendorPortal) {
            var CreateFromFlipPO;
            (function (CreateFromFlipPO) {
                var ciData;
                var invoiceOutputName = "Invoice";
                /**
                 * Get the CIData from the .json attachment and fill the customer invoice
                 * @param  {IData} customerInvoice
                 * @returns True if the customer invoice was filled, false in case of error
                 */
                function Fill(customerInvoice) {
                    if (customerInvoice === null) {
                        Log.Error("Missing Customer Invoice to fill");
                    }
                    ciData = readCiDataFromAttach();
                    if (ciData === null) {
                        Log.Error("Fill CI failed: Unable to read the attachment");
                        return false;
                    }
                    fillWithCIData(customerInvoice);
                    generateAndAttachPdf(invoiceOutputName);
                    customerInvoice.SetValue("CustomerInvoiceStatus__", Lib.AP.CIStatus.Draft);
                    Variable.SetValueAsString("customerInvoiceCompanyCode", ciData.CompanyCode__);
                    return true;
                }
                CreateFromFlipPO.Fill = Fill;
                /**
                * Retrieve the PDF index from the file name
                */
                function validatePDF(overrideValues) {
                    ciData = readCiDataFromAttach();
                    if (ciData === null) {
                        Log.Error("Validate PDF failed: Unable to read the attachment");
                        return false;
                    }
                    var nbAttach = Attach.GetNbAttach();
                    if (nbAttach > 0) {
                        for (var i = 0; i < nbAttach; i++) {
                            var attach = Attach.GetAttach(i);
                            var attachVars = attach.GetVars();
                            if (attachVars.GetValue_String("AttachOutputName", 0) === invoiceOutputName) {
                                return generateAndAttachPdf(invoiceOutputName, overrideValues, i);
                            }
                        }
                    }
                    return false;
                }
                CreateFromFlipPO.validatePDF = validatePDF;
                function signInvoice() {
                    if (!ciData) {
                        ciData = readCiDataFromAttach();
                        if (ciData === null) {
                            Log.Error("signInvoice failed: Unable to read the attachment");
                            return false;
                        }
                    }
                    var nbAttach = Attach.GetNbAttach();
                    if (nbAttach > 0) {
                        for (var i = 0; i < nbAttach; i++) {
                            var attach = Attach.GetAttach(i);
                            var attachVars = attach.GetVars();
                            if (attachVars.GetValue_String("AttachOutputName", 0) === invoiceOutputName) {
                                // Digitally sign the invoice
                                var signState = Sys.AP.Server.SignDocument("TrustWeaver", i, ciData.Vendor__.Country, ciData.BillTo__.Country);
                                if (signState === "SignatureDone") {
                                    Log.Info("Invoice Signed successfully: ");
                                    return true;
                                }
                                Log.Error("Unable do digitally sign the invoice:", signState);
                            }
                        }
                    }
                    return false;
                }
                CreateFromFlipPO.signInvoice = signInvoice;
                /**
                * Generate and attach a PDF File from a json
                */
                function generateAndAttachPdf(filename, overrideValues, indexToUpdate) {
                    var isAttached = false;
                    var error = "";
                    var reportTemplate = Lib.AP.VendorPortal.GetCurrentUser().GetTemplateFile("FlipPOInvoice.rpt");
                    Log.Info("Report file: " + reportTemplate.GetFileName());
                    if (reportTemplate) {
                        try {
                            var jsonFile = TemporaryFile.CreateFile("VIP.JSON", "utf16");
                            if (!jsonFile) {
                                Log.Error("Temporaty file creating failed: vip.json");
                                throw new Error("Couldn't create the json file");
                            }
                            TemporaryFile.Append(jsonFile, JSON.stringify(ciData.toVIPData(overrideValues)));
                            var cvtFile = jsonFile.ConvertFile({ conversionType: "crystal", report: reportTemplate });
                            if (!cvtFile) {
                                throw new Error("Crystal report error");
                            }
                            var index = indexToUpdate;
                            if (isNaN(index)) {
                                index = Attach.GetNbAttach();
                                isAttached = Attach.AttachTemporaryFile(cvtFile, {
                                    name: filename,
                                    attachAsConverted: false,
                                    attachAsFirst: true
                                });
                            }
                            else {
                                isAttached = Attach.AttachTemporaryFile(cvtFile, {
                                    name: filename,
                                    attachAsConverted: false,
                                    attachIndex: index
                                });
                            }
                            if (!isAttached) {
                                throw new Error("Couldn't attach the generated file");
                            }
                            // Enable OCR in VIP
                            Attach.SetValue(index, "AttachToProcess", 1);
                        }
                        catch (ex) {
                            error = "The document could not be formatted: " + ex;
                        }
                    }
                    else {
                        error = "The document could not be formatted: Template not found";
                    }
                    if (error) {
                        Log.Error(error);
                    }
                    return isAttached;
                }
                /**
                 * Retrieve the CIData from the attachment
                 * @returns A CIData instance based on the attachment, null in case of error
                 * or missing attachment
                 */
                function readCiDataFromAttach() {
                    var result = null;
                    //	Search for the attachment
                    var idx = Attach.GetNbAttach() - 1;
                    var file;
                    while (idx > -1) {
                        file = Attach.GetInputFile(idx);
                        if (file.GetExtension().toLowerCase() === ".json") {
                            break;
                        }
                        idx--;
                    }
                    // Extract the data
                    if (file != null) {
                        try {
                            result = Lib.AP.VendorPortal.createCIDataFromJSON(file.GetContent());
                        }
                        catch (e) {
                            result = null;
                        }
                    }
                    return result;
                }
                CreateFromFlipPO.readCiDataFromAttach = readCiDataFromAttach;
                /**
                 * Retrieve the variable data from the customer invoice form (the fields the vendor can modify on the form)
                 * @returns An object listing the user-modified fields
                 */
                function getCIDataFromForm() {
                    function getItemsValuesFromTable(tableName, lineItemMapping) {
                        var itemsValues;
                        var table = Data.GetTable(tableName);
                        if (table && table.GetItemCount() > 0) {
                            itemsValues = [];
                            var _loop_1 = function (rowIndex) {
                                var itemValues = {};
                                var item = table.GetItem(rowIndex);
                                Sys.Helpers.Object.ForEach(lineItemMapping, function (ciField) {
                                    itemValues[ciField] = item.GetValue(ciField);
                                });
                                itemsValues.push(itemValues);
                            };
                            for (var rowIndex = 0; rowIndex < table.GetItemCount(); rowIndex++) {
                                _loop_1(rowIndex);
                            }
                        }
                        return itemsValues;
                    }
                    var formData = {
                        Invoice_number__: Data.GetValue("Invoice_number__"),
                        Net_amount__: Data.GetValue("Net_amount__"),
                        Tax_amount__: Data.GetValue("Tax_amount__"),
                        Invoice_amount__: Data.GetValue("Invoice_amount__"),
                        Invoice_date__: Sys.Helpers.Date.ToUTCDate(Data.GetValue("Invoice_date__")),
                        CustomerInvoiceStatus__: "validated",
                        ReceptionMethod__: Data.GetValue("ReceptionMethod__")
                    };
                    formData.LineItems__ = getItemsValuesFromTable("LineItems__", Lib.AP.VendorPortal.lineItemMapping);
                    return formData;
                }
                CreateFromFlipPO.getCIDataFromForm = getCIDataFromForm;
                /**
                 * List the formatters used to describe the data on the customer invoice
                 * A formatter must have the following signature call: (contact: CustomerInvoiceContact) => string
                 */
                CreateFromFlipPO.Formatters = {
                    /**
                     * Format a CustomerInvoiceContact into a string
                     */
                    PostalAddress: function (contact) {
                        return contact.Address();
                    }
                };
                /**
                 * List the CIData properties to transform before setting the value on the CI
                 */
                CreateFromFlipPO.FieldsToTransform = {
                    "BillTo__": CreateFromFlipPO.Formatters.PostalAddress,
                    "Vendor__": CreateFromFlipPO.Formatters.PostalAddress
                };
                /**
                 * Set the fields of the CustomerInvoice with the values of the CIData
                 * Automatically set the value of a field of the CustomerInvoice that
                 * match a property name of the CIData.
                 * @param  {IData} customerInvoice The Customer invoice instance to fill
                 */
                function fillWithCIData(customerInvoice) {
                    fillFields(customerInvoice);
                }
                /**
                 * Loop on the fields of the customer invoice and fill them with the value of
                 * the matching property in ciData
                 * @param  {IData} customerInvoice The Customer invoice instance to fill
                 */
                function fillFields(customerInvoice) {
                    for (var i = 0; i < customerInvoice.GetNbFields(); i++) {
                        var fieldName = customerInvoice.GetFieldName(i);
                        if (ciData.hasOwnProperty(fieldName)) {
                            var field = ciData[fieldName];
                            var value = void 0;
                            if (CreateFromFlipPO.FieldsToTransform.hasOwnProperty(fieldName) && CreateFromFlipPO.FieldsToTransform[fieldName] instanceof Function) {
                                value = CreateFromFlipPO.FieldsToTransform[fieldName].call(this, field);
                            }
                            else {
                                value = field;
                            }
                            customerInvoice.SetValue(fieldName, value);
                        }
                        else if (fieldName === "Company__") {
                            customerInvoice.SetValue(fieldName, ciData.BillTo__.Name);
                        }
                    }
                    // Loops on line Items
                    var lineItems = ciData.LineItems__;
                    if (lineItems !== undefined && lineItems.length > 0) {
                        var table = Data.GetTable("LineItems__");
                        table.SetItemCount(lineItems.length);
                        for (var j = 0; j < lineItems.length; j++) {
                            var currentItem = table.GetItem(j);
                            for (var key in lineItems[j]) {
                                if (Object.prototype.hasOwnProperty.call(lineItems[j], key)) {
                                    currentItem.SetValue(key, lineItems[j][key]);
                                }
                            }
                        }
                    }
                }
                /**
                 * Return the next invoice number formatted with a pattern, and init the vendor's own sequence if needed
                 */
                function getNextInvoiceNumber() {
                    // Default invoice pattern
                    var pattern = "ESK$YYYY$-$seq$";
                    pattern = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.GetInvoiceNumberPattern", pattern) || pattern;
                    var invoiceSeqNumber = "";
                    var invoiceSeqId = "";
                    if (pattern.indexOf("$seq$") >= 0) {
                        // The pattern contains a sequence number
                        ciData = Lib.AP.VendorPortal.CreateFromFlipPO.readCiDataFromAttach();
                        if (!ciData) {
                            Log.Error("getNextInvoiceNumber - Failed to read JSON attachment");
                            return null;
                        }
                        var companyExtendedProperties = Lib.AP.VendorPortal.GetOrCreateCompanyExtendedProperties(ciData.VendorNumber__, ciData.CompanyCode__);
                        var companyExtendedPropertiesVars = companyExtendedProperties.GetVars();
                        invoiceSeqId = companyExtendedPropertiesVars.GetValue_String("InvoiceNumberSequenceId__", 0);
                        if (!invoiceSeqId) {
                            // Init vendor's own sequence
                            var seq = Process.GetSequence("InvoiceNbSeq");
                            invoiceSeqId = seq.GetNextValue();
                            companyExtendedPropertiesVars.AddValue_String("InvoiceNumberSequenceId__", invoiceSeqId, true);
                            companyExtendedProperties.Commit();
                        }
                        // Get next value of vendor's own sequence
                        invoiceSeqNumber = Process.GetSequence("V" + invoiceSeqId).GetNextValue();
                    }
                    var invoiceNumber = Lib.P2P.FormatSequenceNumber(invoiceSeqNumber, pattern, "");
                    if (!invoiceNumber) {
                        Log.Error("Failed to compute an invoiceNumber - Vendor SeqID=" + invoiceSeqId + " SeqNum=" + invoiceSeqNumber, " Pattern=" + pattern);
                    }
                    return invoiceNumber;
                }
                CreateFromFlipPO.getNextInvoiceNumber = getNextInvoiceNumber;
            })(CreateFromFlipPO = VendorPortal.CreateFromFlipPO || (VendorPortal.CreateFromFlipPO = {}));
        })(VendorPortal = AP.VendorPortal || (AP.VendorPortal = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
