/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_InvoiceExporter_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Base Invoice exporter document for ERP - system library",
  "require": [
    "Lib_ERP_V12.0.461.0",
    "Lib_ERP_Manager_V12.0.461.0",
    "Lib_AP_ExportInvoice_V12.0.461.0",
    "Lib_AP_WorkflowCtrl_V12.0.461.0",
    "Lib_AP_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var InvoiceExporter;
        (function (InvoiceExporter) {
            InvoiceExporter.docType = "INVOICEEXPORTER";
            var Instance = /** @class */ (function (_super) {
                __extends(Instance, _super);
                function Instance(manager) {
                    var _this = _super.call(this) || this;
                    _this.manager = manager;
                    return _this;
                }
                //////////////////////////////////////////
                // Public Lib.ERP.InvoiceExporter interface (virtual)
                //////////////////////////////////////////
                Instance.prototype.GetModifiedNodeNameMappings = function () {
                    return {};
                };
                Instance.prototype.GetFieldValuesMapping = function () {
                    return {
                        "InvoiceType__": {
                            "PO Invoice (as FI)": "Non-PO Invoice"
                        }
                    };
                };
                Instance.prototype.GetExportInvoiceImage = function () {
                    return true;
                };
                Instance.prototype.GetExportMode = function () {
                    return 0;
                };
                Instance.prototype.GetFieldsRules = function (invoiceType) {
                    var fieldRules = {
                        includedFields: [],
                        excludedFields: [
                            "ActiveHoldsCount__", "LastHoldReleaseDate__", "ArchiveProcessLink__", "ArchiveRuidEx__", "ERPAckRuidEx__", "AsideReason__", "BackToAPReason__",
                            "Balance__", "BudgetExportStatus__", "CodingTemplate__", "Comment__", "Configuration__", "CurrentAttachmentFlag__", "CurrentException__",
                            "DigitalSignature__", "DisableMobileActions__", "DuplicateCheckAlertLevel__", "ERPInvoiceNumber__",
                            "ERPPostingError__", "EstimatedLatePaymentFee__", "ExtractedNetAmount__", "HoldingComment__",
                            "Investment__", "InvoiceStatus__", "LastArchiveEditionDate__", "LastArchiveEditor__", "LastExportDate__",
                            "LastPaymentApprovalExportDate__", "LastValidatorName__", "LastValidatorUserId__",
                            "LocalEstimatedLatePaymentFee__", "PaymentApprovalMode__", "PaymentDate__", "PaymentMethod__", "PaymentReference__",
                            "PortalRuidEx__", "PostedBy__", "RejectReason__", "ScheduledAction__", "ScheduledActionDate__", "SourceDocument__", "TouchlessPossible__",
                            "VendorContactEmail__", "VendorEmail__", "WithholdingTax__", "WorkflowInitiator__", "WorkflowStep__", "HeaderDNExtracted__",
                            "GoodIssue__", "ERPClearingDocumentNumber__", "ERPMMInvoiceNumber__", "SubsequentDocument__", "ExtractedIBAN__",
                            "AutomaticallyModifiedFieldsCount__", "ManuallyModifiedFieldsCount__", "PaidOnTime__", "HasBeenOnHold__",
                            "CorporateInvoiceAmount__", "CorporateNetAmount__", "CorporateTaxAmount__", "CorporateCurrency__", "CorporateExchangeRate__", "CorporateEstimatedDiscountAmount__",
                            "CorporateEstimatedLatePaymentFee__", "ExtractedVendorTaxID__", "LayoutIdentifier__", "EstimatedLatePaymentDays__",
                            "QuantityMismatchException__", "UDCException__", "NotCompliantException__", "WorkflowErrorException__", "OtherException__", "CompanyIdentificationException__",
                            "VendorIdentificationException__", "MissingHeaderException__", "MissingLineFieldException__", "InvoiceNotBalanceException__", "InvalidValueException__",
                            "DataToConfirmException__", "DuplicateInvoiceException__", "PriceMismatchException__", "BusinessUnit__"
                        ]
                    };
                    if (invoiceType === "Non-PO Invoice" || invoiceType === "PO Invoice (as FI)") {
                        fieldRules.excludedFields.push("TouchlessEnabled__");
                        fieldRules.excludedFields.push("TouchlessDone__");
                    }
                    return fieldRules;
                };
                Instance.prototype.GetTablesRules = function () {
                    return [
                        {
                            name: "ApproversList__",
                            requiredColumns: ["ApproverID__"],
                            excludedColumns: ["ApproverAction__", "LineMarker__", "WorkflowIndex__", "WRKFIsGroup__", "ApprovalRequestDate__", "ActualApprover__", "WRKFParallelMarker__"]
                        },
                        { name: "ExtractedLineItems__", excludedFullTable: true },
                        { name: "Holds__", excludedFullTable: true },
                        {
                            name: "LineItems__",
                            excludedConditionalColumns: {
                                fieldConditional: "LineType__",
                                conditionalTable: {
                                    PO: {
                                        excludedColumns: ["IsLocalPO__", "CompanyCode__", "VendorNumber__", "OpenAmount__", "OpenQuantity__", "ExpectedAmount__", "ExpectedQuantity__", "PartNumber__", "UnitPrice__", "Group__",
                                            "Buyer__", "Receiver__", "WBSElement__", "WBSElementID__", "TradingPartner__", "BudgetID__", "DifferentInvoicingParty__", "AcctAssCat__", "GoodIssue__", "NoGoodsReceipt__", "UnitOfMeasureCode__", "PriceCondition__",
                                            "ProjectCode__", "ProjectCodeDescription__", "CostType__", "PreviousBudgetID__", "ItemType__", "MultiTaxRates__", "Keyword__", "TechnicalDetails__", "FreeDimension1__", "FreeDimension1ID__", "NonDeductibleTaxRate__"]
                                    },
                                    GL: {
                                        excludedColumns: ["IsLocalPO__", "CompanyCode__", "VendorNumber__", "OpenAmount__", "OpenQuantity__", "ExpectedAmount__", "ExpectedQuantity__", "PartNumber__", "UnitPrice__", "Group__",
                                            "Buyer__", "Receiver__", "ItemNumber__", "OrderNumber__", "GoodsReceipt__", "DeliveryNote__", "Quantity__", "WBSElement__", "WBSElementID__", "TradingPartner__", "BudgetID__", "DifferentInvoicingParty__",
                                            "AcctAssCat__", "GoodIssue__", "NoGoodsReceipt__", "UnitOfMeasureCode__", "PriceCondition__", "ProjectCode__", "ProjectCodeDescription__", "CostType__", "PreviousBudgetID__", "ItemType__", "MultiTaxRates__", "Keyword__", "TechnicalDetails__", "FreeDimension1__", "FreeDimension1ID__", "NonDeductibleTaxRate__"]
                                    },
                                    POGL: {
                                        excludedColumns: ["IsLocalPO__", "CompanyCode__", "VendorNumber__", "OpenAmount__", "OpenQuantity__", "ExpectedAmount__", "ExpectedQuantity__", "PartNumber__", "UnitPrice__", "Group__",
                                            "Buyer__", "Receiver__", "ItemNumber__", "OrderNumber__", "GoodsReceipt__", "DeliveryNote__", "Quantity__", "WBSElement__", "WBSElementID__", "TradingPartner__", "BudgetID__", "DifferentInvoicingParty__",
                                            "AcctAssCat__", "GoodIssue__", "NoGoodsReceipt__", "UnitOfMeasureCode__", "PriceCondition__", "ProjectCode__", "ProjectCodeDescription__", "PreviousBudgetID__", "ItemType__", "MultiTaxRates__", "Keyword__", "TechnicalDetails__", "FreeDimension1__", "FreeDimension1ID__", "NonDeductibleTaxRate__"]
                                    }
                                }
                            }
                        },
                        { name: "BankDetails__", excludedFullTable: true },
                        { name: "ExtendedWithholdingTax__", excludedFullTable: true }
                    ];
                };
                Instance.prototype.GetFilename = function () {
                    return null;
                };
                Instance.prototype.ShouldExportXML = function (postCondition, endCondition, updateCondition) {
                    return updateCondition || endCondition || (postCondition && !Data.GetValue("ERPPostingDate__") && !Data.GetValue("ManualLink__"));
                };
                /**
                 * Attach the invoice image file to a CopyFile transport.
                 * @param {object} transport A xTransport on which the file will be attached
                 * @param {string} exportImageFormat the expected format (TIF or PDF)
                 * @param {string} attachName The name of the attachment
                 */
                Instance.prototype.AttachInvoiceImageFile = function (transport, exportImageFormat, attachName) {
                    var documentImageFile = Lib.AP.InvoiceExporter.GetDocumentImage();
                    if (documentImageFile && documentImageFile.length > 0) {
                        var attach = transport.AddAttach();
                        attach.SetAttachFile(documentImageFile);
                        var attachVars = attach.GetVars();
                        attachVars.AddValue_String("AttachOutputName", attachName, true);
                        attachVars.AddValue_String("AttachOutputFormat", exportImageFormat.toLowerCase(), true);
                    }
                };
                /**
                 * Customize the invoice xml file
                 * @memberof Lib.AP.InvoiceExporter
                 * @param {ConversionLib} flexibleFormToXMLConverter the converter used to generate XML from flexible form
                 * @param {File} xmlTempFile the xml file
                 */
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Instance.prototype.CustomiseInvoiceXmlFile = function (flexibleFormToXMLConverter, xmlTempFile) {
                    // do nothing;
                };
                /**
                 * Customize the invoice xml doc
                 * @memberof Lib.AP.InvoiceExporter
                 * @param {ConversionLib} flexibleFormToXMLConverter the converter used to generate XML from flexible form
                 * @param {Document} xmlDoc the xml doc
                 */
                Instance.prototype.CustomiseInvoiceXmlDoc = function (flexibleFormToXMLConverter, xmlDoc) {
                    // FT-025653 - Dynamic discounting with generic ERP
                    if (Lib.ERP.InvoiceExporter.isDynamicDiscountingUpdated()) {
                        flexibleFormToXMLConverter.AddNode(xmlDoc, "InvoiceAmountWithDiscount__", Variable.GetValueAsString("InvoiceAmountWithDiscount__"));
                        flexibleFormToXMLConverter.AddNode(xmlDoc, "DiscountPercent__", Variable.GetValueAsString("DiscountPercent__"));
                    }
                };
                return Instance;
            }(Lib.ERP.Manager.Document));
            InvoiceExporter.Instance = Instance;
            /**
             * Check dynamic discounting is proposed by vendor before create xml file
             * @returns {boolean}
             */
            function isDynamicDiscountingUpdated() {
                var isDynamicDiscountingAllowed = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.IsDynamicDiscountingAllowed");
                if (typeof isDynamicDiscountingAllowed !== "boolean") {
                    isDynamicDiscountingAllowed = Lib.AP.GetInvoiceDocument().IsDynamicDiscountingAllowed();
                }
                return !!Data.GetValue("ERPPostingDate__")
                    && (Lib.AP.isProviderCorpayEnabled() || isDynamicDiscountingAllowed)
                    && Variable.GetValueAsString("EnableDynamicDiscounting") === "1"
                    && Lib.AP.InvoiceExporter.roleCurrentContributor === Lib.AP.WorkflowCtrl.roles.vendor;
            }
            InvoiceExporter.isDynamicDiscountingUpdated = isDynamicDiscountingUpdated;
        })(InvoiceExporter = ERP.InvoiceExporter || (ERP.InvoiceExporter = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
