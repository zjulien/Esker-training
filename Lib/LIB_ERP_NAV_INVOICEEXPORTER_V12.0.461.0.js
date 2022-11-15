/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_NAV_InvoiceExporter_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Invoice exporter document for Navision ERP - system library",
  "require": [
    "Lib_ERP_InvoiceExporter_V12.0.461.0",
    "Lib_ERP_NAV_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var NAV;
        (function (NAV) {
            var InvoiceExporter = /** @class */ (function (_super) {
                __extends(InvoiceExporter, _super);
                function InvoiceExporter(manager) {
                    return _super.call(this, manager) || this;
                }
                InvoiceExporter.prototype.GetFieldValuesMapping = function () {
                    return {
                        "InvoiceType__": {
                            "PO Invoice (as FI)": "Non-PO Invoice"
                        },
                        "LineItems__.LineType__": {
                            "POGL": "GL"
                        }
                    };
                };
                InvoiceExporter.prototype.GetExportMode = function () {
                    return 1;
                };
                InvoiceExporter.prototype.GetFieldsRules = function () {
                    var fields = {
                        includedFields: [
                            "CompanyCode__", "DueDate__", "ERPPostingDate__", "ExchangeRate__", "GRIV__", "History__", "InvoiceAmount__", "InvoiceCurrency__", "InvoiceDate__",
                            "InvoiceNumber__", "InvoiceType__", "InvoiceLastExportDate__", "LocalCurrency__", "LocalInvoiceAmount__", "LocalNetAmount__", "LocalTaxAmount__", "NetAmount__",
                            "OrderNumber__", "PaymentApprovalStatus__", "ApprovedPaymentDate__", "PaymentTerms__", "PostingDate__", "ReceptionMethod__", "TaxAmount__", "VendorCity__",
                            "VendorCountry__", "VendorName__", "VendorNumber__", "VendorRegion__", "VendorStreet__", "VendorZipCode__", "VerificationDate__", "Amount__"
                        ],
                        excludedFields: []
                    };
                    if (Data.GetValue("ManualLink__")) {
                        fields.includedFields.push("ERPInvoiceNumber__");
                    }
                    if (Lib.ERP.InvoiceExporter.isDynamicDiscountingUpdated()) {
                        fields.includedFields.push("DiscountLimitDate__");
                        fields.includedFields.push("EstimatedDiscountAmount__");
                        fields.includedFields.push("LocalEstimatedDiscountAmount__");
                    }
                    return fields;
                };
                InvoiceExporter.prototype.GetTablesRules = function () {
                    var tables = [
                        {
                            name: "LineItems__",
                            includedColumns: ["Amount__", "CCDescription__", "CostCenter__", "Description__", "GLAccount__", "GLDescription__", "GoodsReceipt__", "ItemNumber__", "LineType__", "OrderNumber__",
                                "Quantity__", "TaxAmount__", "TaxCode__", "TaxRate__"],
                            excludedColumns: []
                        }
                    ];
                    if (Sys.Parameters.GetInstance("AP").GetParameter("CodingEnableProjectCode") === "1") {
                        tables[0].includedColumns.push("ProjectCode__");
                    }
                    return tables;
                };
                InvoiceExporter.prototype.GetFilename = function () {
                    if (Data.GetValue("ManualLink__")) {
                        return "Invoice" + Data.GetValue("MSN") + "_Archive";
                    }
                    return null;
                };
                InvoiceExporter.prototype.GetExportInvoiceImage = function () {
                    return !Data.GetValue("ManualLink__");
                };
                return InvoiceExporter;
            }(Lib.ERP.InvoiceExporter.Instance));
            NAV.InvoiceExporter = InvoiceExporter;
        })(NAV = ERP.NAV || (ERP.NAV = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.NAV.Manager.documentFactories[Lib.ERP.InvoiceExporter.docType] = function (manager) {
    return new Lib.ERP.NAV.InvoiceExporter(manager);
};
