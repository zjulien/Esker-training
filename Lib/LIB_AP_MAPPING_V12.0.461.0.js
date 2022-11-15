/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "Lib_AP_MAPPING_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Lib_AP_VIPDATA_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
        * Abstract class for a mapper for any input file to a Vendor Invoice form.
        * You can create your own mapper for a specific input file format.
        * Your mapper must extend the InvoiceDocument class and register itself by calling <code>Lib.AP.MappingManager.Register(MyMapper);</code>.
        * @namespace Lib.AP.Mapping
        * @see {@link Lib.AP.MappingManager}
        **/
        var Mapping;
        (function (Mapping) {
            function checkExtensionConsistency(extensionToCheck, attachmentInformations, attachFileName) {
                var lastDot = attachFileName.lastIndexOf(".");
                var extension;
                //sometimes pdf is identified as xml
                if (attachmentInformations.DocumentType && attachmentInformations.DocumentType.toLowerCase().indexOf(extensionToCheck) !== -1) {
                    extension = "." + extensionToCheck;
                    attachFileName = attachFileName.substring(1, lastDot) + extension;
                }
                else if (lastDot > 0) {
                    extension = attachFileName.substr(lastDot);
                }
                return { "extension": extension, "attachFileName": attachFileName };
            }
            function attachFileFromZip(invoiceZip, attachFileName, asFirstAttach) {
                var compressedFile = Attach.GetCompressedFile(invoiceZip);
                if (compressedFile) {
                    var entries = compressedFile.GetEntries(false, true);
                    for (var i = 0; i < entries.length; i++) {
                        var extractedFile = entries[i].GetFile();
                        Attach.AttachTemporaryFile(extractedFile, {
                            name: attachFileName,
                            attachAsConverted: true,
                            attachAsFirst: asFirstAttach
                        });
                    }
                }
                else {
                    Log.Error("Extract attachment failed - GetCompressedFile failed");
                }
            }
            /**
            * Represents an invoice document. The invoice data are extracted from the given input JSON document (an JSON object)
            * @class
            * @param {JSON} jsonContent An input JSON object
            * @memberof Lib.AP.MappingJSON
            **/
            var InvoiceDocument = /** @class */ (function () {
                function InvoiceDocument() {
                    this.jsonDoc = new Lib.AP.VIPData();
                    /**
                    * Plain object containing the attachment information
                    * @member {Object}
                    **/
                    this.attachmentInformations = [];
                    /**
                    * Plain object containing the information needed to retrieve the vendor in the master data
                    * @member {Object}
                    **/
                    this.vendorInformations = {};
                    /**
                    * Plain object containing the invoice header fields
                    * @member {Object}
                    **/
                    this.headerFields = {};
                    /**
                    * Plain object containing the invoice line item fields
                    * @member {Object}
                    **/
                    this.invoiceLineItem = [];
                    this.alreadyParsed = false;
                }
                /**
                * Returns the payment method
                * @method
                * @returns {String} The invoice payment method
                **/
                InvoiceDocument.prototype.GetPaymentMethod = function () {
                    var PaymentInformations = this.jsonDoc.tables.PaymentInformations;
                    if (PaymentInformations && PaymentInformations.length > 0 && PaymentInformations[0].PaymentMode) {
                        return PaymentInformations[0].PaymentMode;
                    }
                    return null;
                };
                /**
                * Returns the vendor number
                * @method
                * @returns {String} The vendor number
                **/
                InvoiceDocument.prototype.GetVendorNumber = function () {
                    return this.jsonDoc.header.VendorNumber;
                };
                /**
                * Returns the vendor VAT number
                * @method
                * @returns {String} The invoice VAT number
                **/
                InvoiceDocument.prototype.GetVendorVATNumber = function () {
                    return this.jsonDoc.header.VendorVATNumber;
                };
                /**
                * Returns the vendor name
                * @method
                * @returns {String} The vendor name
                **/
                InvoiceDocument.prototype.GetVendorName = function () {
                    return this.jsonDoc.header.VendorName;
                };
                /**
                * Returns the customer VAT number
                * @method
                * @returns {String} The customer VAT number
                **/
                InvoiceDocument.prototype.GetCustomerVATNumber = function () {
                    return this.jsonDoc.header.CustomerVATNumber;
                };
                /**
                * Returns the invoice line items
                * @method
                * @returns {Array} The invoice line items
                **/
                InvoiceDocument.prototype.GetLineItems = function () {
                    return this.jsonDoc.tables.LineItems;
                };
                /**
                * Returns the invoice GL line items
                * @method
                * @returns {Array} The invoice GL line items
                **/
                InvoiceDocument.prototype.GetGlLines = function () {
                    return null;
                };
                /**
                * Returns the invoice attachments
                * @method
                * @returns {Array} The invoice attachments
                **/
                InvoiceDocument.prototype.GetAttachments = function () {
                    var attachsInfo = [];
                    if (Sys.Helpers.IsArray(this.attachmentInformations)) {
                        attachsInfo = this.attachmentInformations;
                    }
                    else if (typeof this.attachmentInformations === "object" && this.attachmentInformations.Filename) {
                        // Compatibility with mapping libs sprint <= 151 (single attachment object)
                        attachsInfo.push(this.attachmentInformations);
                    }
                    return attachsInfo;
                };
                /**
                * Returns the document date
                * @method
                * @returns {String} The invoice document date
                **/
                InvoiceDocument.prototype.GetDocumentDate = function () {
                    return this.jsonDoc.header.InvoiceDate;
                };
                /**
                * Returns the due date
                * @method
                * @returns {String} The invoice due date
                **/
                InvoiceDocument.prototype.GetDueDate = function () {
                    return this.jsonDoc.header.DueDate;
                };
                /**
                * @method
                * @returns {String} The invoice gross amount
                **/
                InvoiceDocument.prototype.GetGrossAmount = function () {
                    return this.jsonDoc.header.InvoiceAmount;
                };
                /**
                * @method
                * @returns {String} The invoice net amount
                **/
                InvoiceDocument.prototype.GetNetAmount = function () {
                    return this.jsonDoc.header.NetAmount;
                };
                /**
                * @method
                * @returns {String} The invoice document number
                **/
                InvoiceDocument.prototype.GetDocumentNumber = function () {
                    return this.jsonDoc.header.InvoiceNumber;
                };
                /**
                * @method
                * @returns {String} The invoice currency
                **/
                InvoiceDocument.prototype.GetCurrency = function () {
                    return this.jsonDoc.header.InvoiceCurrency;
                };
                /**
                * @method
                * @param {String} fieldName The header field name
                * @returns {HeaderFieldCandidate[]} An array of the candidates for the given header field
                **/
                InvoiceDocument.prototype.GetHeaderFieldCandidates = function (fieldName) {
                    var fieldValue = this.jsonDoc.header[fieldName];
                    if (fieldValue) {
                        return [
                            {
                                standardStringValue: fieldValue
                            }
                        ];
                    }
                    if (fieldName === "OrderNumber") {
                        var orderNumbers = [];
                        for (var i = 0; i < this.jsonDoc.tables.LineItems.length; i++) {
                            var item = this.jsonDoc.tables.LineItems[i];
                            if (item[fieldName]) {
                                var orderNumber = {
                                    standardStringValue: item[fieldName]
                                };
                                orderNumbers.push(orderNumber);
                            }
                        }
                        if (orderNumbers.length > 0) {
                            return orderNumbers;
                        }
                    }
                    return null;
                };
                /**
                * @method
                * @returns {String} The invoice unplanned costs
                **/
                InvoiceDocument.prototype.GetUnplannedCosts = function () {
                    return null;
                };
                /**
                * @method
                * @returns {String} The invoice tax amount
                **/
                InvoiceDocument.prototype.GetTaxAmount = function () {
                    return null;
                };
                /**
                * @method
                * @returns {String} The invoice tax rate
                **/
                InvoiceDocument.prototype.GetTaxRate = function () {
                    return null;
                };
                /**
                * @method
                * @returns {String} The invoice document type
                **/
                InvoiceDocument.prototype.GetDocumentType = function () {
                    return null;
                };
                /**
                * @method
                * @returns {String} The reception method
                **/
                InvoiceDocument.prototype.GetReceptionMethod = function () {
                    return "Scan/Other";
                };
                /**
                * @method
                * @returns {String} The reception method
                **/
                InvoiceDocument.prototype.GetSourceDocument = function () {
                    return null;
                };
                /**
                * @method
                * @returns {String} The conversion template path
                **/
                InvoiceDocument.prototype.GetConversionTemplatePath = function () {
                    return null;
                };
                /**
                * @method
                * @returns {Boolean}
                **/
                InvoiceDocument.prototype.GetCalculateTax = function () {
                    return true;
                };
                /**
                * @method
                * @param {Object} attachmentInformations The attachment information extracted from document
                * @param {File} invoice The handled attachment file
                **/
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                InvoiceDocument.prototype.SetEDIInformation = function (attachmentInformations, invoice) {
                    // do nthing.
                };
                /**
                * @method
                **/
                InvoiceDocument.prototype.SetProcessingLabel = function () {
                    // do nthing.
                };
                /**
                * @method
                * @param {Object} attachmentInformations The attachment information extracted from document
                * @returns {String} The xsl stylesheet to use for preview
                **/
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                InvoiceDocument.prototype.GetXslTransformation = function (attachmentInformations) {
                    return "";
                };
                /**
                * @method
                * @param {Object} attachmentInformations The attachment information extracted from document
                * @returns {Boolean}
                **/
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                InvoiceDocument.prototype.IsAttachmentTechnical = function (attachmentInformations) {
                    return false;
                };
                /**
                * @method
                * @param {Object} attachmentInformations The attachment information extracted from document
                * @returns {Boolean}
                **/
                InvoiceDocument.prototype.IsProcessDocumentTechnical = function () {
                    return false;
                };
                /**
                * @method
                * @param {Object} attachmentInformations The attachment information extracted from document
                * @returns {String} The logo to display on the file handler preview
                **/
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                InvoiceDocument.prototype.GetThumbnailPreviewLogo = function (attachmentInformations) {
                    return "";
                };
                InvoiceDocument.prototype.AttachEmbeddedDocuments = function (asFirstAttach, temporaryFile) {
                    try {
                        var mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
                        var attachsInfo = mapperDoc.GetAttachments();
                        for (var idx = 0; idx < attachsInfo.length; idx++) {
                            var attachmentInformations = attachsInfo[idx];
                            var attachFileName = attachmentInformations.Filename;
                            if (!attachFileName) {
                                attachFileName = "document" + (idx + 1);
                            }
                            var b64File = temporaryFile.CreateFile("b64", "ANSI");
                            temporaryFile.Append(b64File, attachmentInformations.Content);
                            var extension = void 0, invoice = void 0, result = void 0;
                            switch (attachmentInformations.MimeType) {
                                case "text/xml":
                                case "application/xml":
                                    {
                                        result = checkExtensionConsistency("pdf", attachmentInformations, attachFileName);
                                        extension = result.extension ? result.extension : ".xml";
                                        attachFileName = result.attachFileName ? result.attachFileName : attachFileName;
                                        invoice = b64File.ConvertFile({
                                            inputFormat: ".b64",
                                            outputFormat: extension
                                        });
                                        if (invoice) {
                                            mapperDoc.SetEDIInformation(attachmentInformations, invoice);
                                            Attach.AttachTemporaryFile(invoice, {
                                                name: attachFileName,
                                                attachAsConverted: true,
                                                attachAsFirst: asFirstAttach,
                                                isTechnical: mapperDoc.IsAttachmentTechnical(attachmentInformations),
                                                XSLStyleSheet: mapperDoc.GetXslTransformation(attachmentInformations),
                                                ThumbnailPreviewLogo: mapperDoc.GetThumbnailPreviewLogo(attachmentInformations)
                                            });
                                        }
                                        else {
                                            Log.Error("Extract attachment failed - Convert from base64 to " + extension);
                                        }
                                        break;
                                    }
                                case "application/zip":
                                    {
                                        invoice = b64File.ConvertFile({
                                            inputFormat: ".b64",
                                            outputFormat: ".zip"
                                        });
                                        if (invoice) {
                                            attachFileFromZip(invoice, attachFileName, asFirstAttach);
                                        }
                                        else {
                                            Log.Error("Extract attachment failed - Convert from base64 to zip");
                                        }
                                        break;
                                    }
                                case "application/pdf":
                                default:
                                    {
                                        result = checkExtensionConsistency("xml", attachmentInformations, attachFileName);
                                        extension = result.extension ? result.extension : ".pdf";
                                        attachFileName = result.attachFileName ? result.attachFileName : attachFileName;
                                        invoice = b64File.ConvertFile({
                                            inputFormat: ".b64",
                                            outputFormat: extension
                                        });
                                        if (invoice) {
                                            Attach.AttachTemporaryFile(invoice, {
                                                name: attachFileName,
                                                attachAsConverted: true,
                                                attachAsFirst: asFirstAttach,
                                                isTechnical: mapperDoc.IsAttachmentTechnical(attachmentInformations)
                                            });
                                        }
                                        else {
                                            Log.Error("Extract attachment failed - Convert from base64 to " + extension);
                                        }
                                        break;
                                    }
                            }
                            // Next attachments at the end of the list
                            asFirstAttach = false;
                        }
                    }
                    catch (err) {
                        Log.Warn("Error while trying to attach embedded document to process : " + err.message);
                    }
                };
                InvoiceDocument.prototype.toJson = function () {
                    if (this.alreadyParsed) {
                        return this.jsonDoc;
                    }
                    return {
                        error: "toJson shouldn't be called before run"
                    };
                };
                return InvoiceDocument;
            }());
            Mapping.InvoiceDocument = InvoiceDocument;
            var Mapper = /** @class */ (function () {
                function Mapper() {
                }
                return Mapper;
            }());
            Mapping.Mapper = Mapper;
        })(Mapping = AP.Mapping || (AP.Mapping = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
