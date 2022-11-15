/* LIB_DEFINITION{
  "name": "Lib_AP_MAPPING_UBL_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Lib_AP_Mapping_V12.0.461.0",
    "Lib_AP_Mapping_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
        * Mapper for an input UBL XML file to a Vendor Invoice form.
        * You can create your own mapper for a specific input file format.
        * Your mapper must extend the InvoiceDocument class (See {@link Lib.AP.Mapping.InvoiceDocument}), and register itself by calling <code>Lib.AP.MappingManager.Register(MyMapper);</code>.
        * @namespace Lib.AP.Mapping
        * @see {@link Lib.AP.MappingManager}
        * @see {@link Lib.AP.Mapping.InvoiceDocument}
        **/
        var Mapping;
        (function (Mapping) {
            function transformAmount(jsonDocHeader, originalAmount) {
                // Return a string for current template to work
                if (jsonDocHeader.InvoiceType === "381" && !Sys.Helpers.IsEmpty(originalAmount) && originalAmount.indexOf("-") === -1) {
                    // Credit memo with an amount not already signed
                    return "-" + originalAmount;
                }
                return originalAmount;
            }
            function translateUnitCode(jsonDocHeader, ISOUnitCode) {
                return Language.Translate(ISOUnitCode, false);
            }
            function getEmbeddedDocumentType(docType) {
                var splitted = docType.toLowerCase().split("|");
                return splitted[1] ? splitted[1] : "";
            }
            /**
            * Represents an invoice document. The invoice data are extracted from the given input UBL document (an IXMLDOMDocument object)
            * @class
            * @param {IXMLDOMDocument} xmlDom An input IXMLDOMDocument object
            * @memberof Lib.AP.MappingUBL
            **/
            var UBLInvoiceDocument = /** @class */ (function (_super) {
                __extends(UBLInvoiceDocument, _super);
                function UBLInvoiceDocument(xmlDom) {
                    var _this = _super.call(this) || this;
                    _this.regexFatturaPAVersion = /<FormatoTrasmissione>(.+)<\/FormatoTrasmissione>/;
                    _this.receptionMethod = "EDI";
                    _this.defaultTemplate = "%Templates%\\VendorInvoiceUBL.rpt";
                    _this.isTechnical = true;
                    _this.fatturaPAVersionToXslt = {
                        "Default": "fatturapa_v1.2.xsl",
                        "SDI11": "fatturapa_v1.1.xsl",
                        "FPR12": "fatturapa_v1.2.xsl"
                    };
                    _this.embeddedDocumentTypes = {
                        source: "source",
                        metadata: "metadata"
                    };
                    _this.EDISourceInformations = {
                        type: "",
                        version: "",
                        xslt: ""
                    };
                    _this.XPathToAttachmentInformations = [
                        {
                            XPath: "cac:Attachment/cbc:EmbeddedDocumentBinaryObject",
                            Field: "Content"
                        },
                        {
                            XPath: "cac:Attachment/cbc:EmbeddedDocumentBinaryObject",
                            Attribute: "mimeCode",
                            Field: "MimeType"
                        },
                        {
                            XPath: "cbc:ID",
                            Field: "Filename"
                        },
                        {
                            XPath: "cbc:DocumentType",
                            Field: "DocumentType"
                        }
                    ];
                    _this.XPathToHeaderFields = [
                        // invoice related
                        {
                            XPath: "cbc:ID",
                            Field: "InvoiceNumber"
                        },
                        {
                            XPath: "cbc:InvoiceTypeCode",
                            Field: "InvoiceType"
                        },
                        {
                            XPath: "cbc:IssueDate",
                            Field: "InvoiceDate",
                            Default: UBLInvoiceDocument.defaultDate
                        },
                        {
                            XPath: "cac:LegalMonetaryTotal/cbc:PayableAmount",
                            Field: "InvoiceAmount",
                            Transform: transformAmount
                        },
                        {
                            XPath: "cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount",
                            Field: "NetAmount",
                            Transform: transformAmount
                        },
                        {
                            XPath: "cac:TaxTotal/cbc:TaxAmount",
                            Field: "TaxAmount",
                            Transform: transformAmount
                        },
                        {
                            XPath: "cbc:DocumentCurrencyCode",
                            Field: "InvoiceCurrency"
                        },
                        {
                            XPath: "cbc:DueDate",
                            Field: "DueDate",
                            Default: UBLInvoiceDocument.defaultDate
                        },
                        // order fields
                        {
                            XPath: "cac:OrderReference/cbc:ID",
                            Field: "OrderNumber"
                        },
                        {
                            XPath: "cac:OrderReference/cbc:IssueDate",
                            Field: "OrderDate",
                            Default: UBLInvoiceDocument.defaultDate
                        },
                        // vendor fields
                        {
                            XPath: "cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name",
                            Field: "VendorName"
                        },
                        {
                            XPath: "cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:StreetName",
                            Field: "VendorStreet"
                        },
                        {
                            XPath: "cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:CityName",
                            Field: "VendorCity"
                        },
                        {
                            XPath: "cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:PostalZone",
                            Field: "VendorPostalCode"
                        },
                        {
                            XPath: "cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cac:Country/cbc:IdentificationCode",
                            Field: "VendorCountry"
                        },
                        {
                            XPath: "cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cbc:CompanyID",
                            Field: "VendorTaxCode"
                        },
                        {
                            XPath: "cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID",
                            Field: "VendorVATNumber"
                        },
                        // customer fields
                        {
                            XPath: "cac:AccountingCustomerParty/cac:Party/cac:PartyName/cbc:Name",
                            Field: "CustomerName"
                        },
                        {
                            XPath: "cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:StreetName",
                            Field: "CustomerStreet"
                        },
                        {
                            XPath: "cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:CityName",
                            Field: "CustomerCity"
                        },
                        {
                            XPath: "cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:PostalZone",
                            Field: "CustomerPostalCode"
                        },
                        {
                            XPath: "cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cac:Country/cbc:IdentificationCode",
                            Field: "CustomerCountry"
                        },
                        {
                            XPath: "cac:AccountingCustomerParty/cac:Party/cac:PartyTaxScheme/cbc:CompanyID",
                            Field: "CustomerTaxCode"
                        },
                        {
                            XPath: "cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID",
                            Field: "CustomerVATNumber"
                        },
                        {
                            XPath: "cac:PaymentTerms/cbc:Note",
                            Field: "PaymentTerms"
                        }
                    ];
                    _this.XPathToLineItemInformations = [
                        {
                            XPath: "cbc:ID",
                            Field: "ItemNumber"
                        },
                        {
                            XPath: "cac:Item/cbc:Name",
                            Field: "Description"
                        },
                        {
                            XPath: "cbc:LineExtensionAmount",
                            Field: "Amount",
                            Transform: transformAmount
                        },
                        {
                            XPath: "cbc:InvoicedQuantity",
                            Field: "Quantity"
                        },
                        {
                            XPath: "cbc:InvoicedQuantity",
                            Attribute: "unitCode",
                            Field: "Unit",
                            Transform: translateUnitCode
                        },
                        {
                            XPath: "cac:Price/cbc:PriceAmount",
                            Field: "UnitPrice",
                            Transform: transformAmount
                        },
                        {
                            XPath: "cac:OrderLineReference/cac:OrderReference/cbc:ID",
                            Field: "OrderNumber"
                        },
                        {
                            XPath: "cac:DespatchLineReference/cac:DocumentReference/cbc:ID",
                            Field: "DeliveryNote"
                        },
                        {
                            XPath: "cac:Item/cac:BuyersItemIdentification/cbc:ID",
                            Field: "PartNumber"
                        },
                        {
                            XPath: "cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cbc:ID",
                            Field: "TaxCode"
                        },
                        {
                            XPath: "cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cbc:Percent",
                            Field: "TaxRate"
                        }
                    ];
                    _this.XPathToTaxInformations = [
                        {
                            XPath: "cbc:TaxableAmount",
                            Field: "TaxableAmount",
                            Transform: transformAmount
                        },
                        {
                            XPath: "cbc:TaxAmount",
                            Field: "TaxAmount",
                            Transform: transformAmount
                        },
                        {
                            XPath: "cac:TaxCategory/cbc:ID",
                            Field: "TaxCode"
                        },
                        {
                            XPath: "cac:TaxCategory/cbc:Percent",
                            Field: "TaxRate"
                        }
                    ];
                    _this.XPathToPaymentInformations = [
                        {
                            XPath: "cbc:ID",
                            Field: "PaymentCondition"
                        },
                        {
                            XPath: "cbc:PaymentMeansID",
                            Field: "PaymentMode"
                        },
                        {
                            XPath: "cbc:PaymentTermsDetailsURI",
                            Field: "IBAN"
                        },
                        {
                            XPath: "cbc:PaymentTermsDetailsURI",
                            Attribute: "schemeAgencyID",
                            Field: "BIC"
                        },
                        {
                            XPath: "cbc:PaymentTermsDetailsURI",
                            Attribute: "schemeAgencyName",
                            Field: "PaymentInstitute"
                        }
                    ];
                    _this.xmlDom = xmlDom;
                    return _this;
                }
                /**
                * Extracts the data from the input file and fills the internal objects
                * @method
                **/
                UBLInvoiceDocument.prototype.Run = function () {
                    var _this = this;
                    var fillObjectFromXPath = function (xpathMappings, destinationObject, sourceXmlDom) {
                        for (var index = 0; index < xpathMappings.length; index++) {
                            var mapping = xpathMappings[index];
                            var node = sourceXmlDom.selectSingleNode(mapping.XPath);
                            var value = mapping.Default || null;
                            if (node) {
                                if (mapping.Attribute) {
                                    value = node.getAttribute(mapping.Attribute);
                                }
                                else {
                                    value = node.text;
                                }
                                if (typeof mapping.Transform === "function") {
                                    value = mapping.Transform(_this.jsonDoc.header, value);
                                }
                            }
                            destinationObject[mapping.Field] = value;
                        }
                    };
                    var fillTableFromXPath = function (xpathBaseNode, xpathMappings, destinationObject, sourceXmlDom, addEmptyEntry) {
                        var lines = sourceXmlDom.selectNodes(xpathBaseNode);
                        var item, index, mapping;
                        if (addEmptyEntry && lines.length === 0) {
                            item = {};
                            // add empty entry for mdb generation
                            for (index = 0; index < xpathMappings.length; index++) {
                                mapping = xpathMappings[index];
                                item[mapping.Field] = null;
                            }
                            destinationObject.push(item);
                        }
                        for (var i = 0; i < lines.length; i++) {
                            item = {};
                            for (index = 0; index < xpathMappings.length; index++) {
                                mapping = xpathMappings[index];
                                var node = lines.item(i).selectSingleNode(mapping.XPath);
                                var value = null;
                                if (node) {
                                    if (mapping.Attribute) {
                                        value = node.getAttribute(mapping.Attribute) ? node.getAttribute(mapping.Attribute) : "";
                                    }
                                    else {
                                        value = node.text;
                                    }
                                    if (typeof mapping.Transform === "function") {
                                        value = mapping.Transform(_this.jsonDoc.header, value);
                                    }
                                }
                                item[mapping.Field] = value;
                            }
                            destinationObject.push(item);
                        }
                    };
                    if (this.alreadyParsed === false) {
                        fillTableFromXPath.call(this, "//cac:AdditionalDocumentReference", this.XPathToAttachmentInformations, this.attachmentInformations, this.xmlDom, false);
                        fillObjectFromXPath.call(this, this.XPathToHeaderFields, this.jsonDoc.header, this.xmlDom);
                        fillTableFromXPath.call(this, "//cac:InvoiceLine", this.XPathToLineItemInformations, this.jsonDoc.tables.LineItems, this.xmlDom, true);
                        fillTableFromXPath.call(this, "cac:TaxTotal/cac:TaxSubtotal", this.XPathToTaxInformations, this.jsonDoc.tables.TaxInformations, this.xmlDom, true);
                        fillTableFromXPath.call(this, "//cac:PaymentTerms", this.XPathToPaymentInformations, this.jsonDoc.tables.PaymentInformations, this.xmlDom, true);
                        this.alreadyParsed = true;
                    }
                };
                /**
                * @method
                * @returns {String} The reception method
                **/
                UBLInvoiceDocument.prototype.GetReceptionMethod = function () {
                    return this.receptionMethod;
                };
                /**
                 * @method
                 * @returns {String} the default template name for conversion
                 */
                UBLInvoiceDocument.prototype.GetConversionTemplatePath = function () {
                    var defaultValue = this.defaultTemplate;
                    var customValue = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.MappingUBL.GetConversionTemplatePath", defaultValue);
                    return customValue || defaultValue;
                };
                UBLInvoiceDocument.prototype.SetEDIInformation = function (attachmentInformations, invoice) {
                    if (attachmentInformations && attachmentInformations.DocumentType && getEmbeddedDocumentType(attachmentInformations.DocumentType) === this.embeddedDocumentTypes.source) {
                        var content = invoice.GetContent();
                        var match = this.regexFatturaPAVersion.exec(content);
                        if (match && match[1]) {
                            this.EDISourceInformations.type = "fatturaPA";
                            this.EDISourceInformations.version = match[1];
                            this.EDISourceInformations.xslt = this.fatturaPAVersionToXslt[match[1]] ? this.fatturaPAVersionToXslt[match[1]] : this.fatturaPAVersionToXslt.Default;
                        }
                    }
                };
                UBLInvoiceDocument.prototype.SetProcessingLabel = function () {
                    if (this.EDISourceInformations.type === "fatturaPA") {
                        Variable.SetValueAsString("ProcessingLabel", "APITA");
                    }
                };
                UBLInvoiceDocument.prototype.GetXslTransformation = function (attachmentInformations) {
                    if (attachmentInformations && attachmentInformations.DocumentType && getEmbeddedDocumentType(attachmentInformations.DocumentType) === this.embeddedDocumentTypes.source) {
                        return this.EDISourceInformations.xslt;
                    }
                    return "";
                };
                UBLInvoiceDocument.prototype.GetThumbnailPreviewLogo = function (attachmentInformations) {
                    if (attachmentInformations && attachmentInformations.DocumentType && getEmbeddedDocumentType(attachmentInformations.DocumentType) === this.embeddedDocumentTypes.source) {
                        return "fatturaPA";
                    }
                    return "";
                };
                UBLInvoiceDocument.prototype.IsAttachmentTechnical = function (attachmentInformations) {
                    if (attachmentInformations && attachmentInformations.DocumentType && getEmbeddedDocumentType(attachmentInformations.DocumentType) === this.embeddedDocumentTypes.metadata) {
                        return true;
                    }
                    return false;
                };
                UBLInvoiceDocument.prototype.IsProcessDocumentTechnical = function () {
                    return this.isTechnical;
                };
                UBLInvoiceDocument.prototype.toJson = function () {
                    if (this.alreadyParsed) {
                        return this.jsonDoc;
                    }
                    return {
                        error: "toJson shouldn't be called before run"
                    };
                };
                UBLInvoiceDocument.defaultDate = "1900-01-01";
                return UBLInvoiceDocument;
            }(Mapping.InvoiceDocument));
            Mapping.UBLInvoiceDocument = UBLInvoiceDocument;
            /** @lends Lib.AP.MappingUBL */
            var UBLMapper = /** @class */ (function (_super) {
                __extends(UBLMapper, _super);
                function UBLMapper() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.NameSpace = 'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"';
                    return _this;
                }
                /**
                * Check if an input file is supported by this mapper
                * @param {string} fileContent String containing the content of the input file
                * @returns {boolean} True if the input file is supported by this mapper, false otherwise
                **/
                // eslint-disable-next-line class-methods-use-this
                UBLMapper.prototype.IsMyType = function (fileContent) {
                    return fileContent && typeof fileContent.indexOf === "function" && fileContent.indexOf("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2") >= 0;
                };
                /**
                * Returns an InvoiceDocument object referencing the input file
                * @param {File} inputFile File object of the input file
                * @returns {Lib.AP.MappingUBL.InvoiceDocument} An InvoiceDocument referencing the input file.
                **/
                UBLMapper.prototype.GetNewDocument = function (inputFile) {
                    try {
                        var xmlDom = Process.CreateXMLDOMElement(inputFile, this.NameSpace);
                        return new UBLInvoiceDocument(xmlDom);
                    }
                    catch (e) {
                        Log.Error("Failed to parse UBL file: " + e);
                    }
                    return null;
                };
                return UBLMapper;
            }(Mapping.Mapper));
            Mapping.UBLMapper = UBLMapper;
            Lib.AP.MappingManager.Register(new UBLMapper());
        })(Mapping = AP.Mapping || (AP.Mapping = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
