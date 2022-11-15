///#GLOBALS Sys
/* LIB_DEFINITION{
  "name": "LIB_AP_VIPData_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "library: Describe vendor invoice structure",
  "require": [
    "Lib_AP_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var VIPHeader = /** @class */ (function () {
            function VIPHeader() {
                this.InvoiceNumber = "";
                this.InvoiceType = "";
                this.InvoiceDate = "";
                this.InvoiceAmount = "";
                this.NetAmount = "";
                this.TaxAmount = "";
                this.InvoiceCurrency = "";
                this.DueDate = "";
                this.OrderNumber = "";
                this.OrderDate = "";
                this.VendorName = "";
                this.VendorAddress = "";
                this.VendorStreet = "";
                this.VendorCity = "";
                this.VendorPostalCode = "";
                this.VendorCountry = "";
                this.VendorTaxCode = "";
                this.VendorVATNumber = "";
                this.CustomerName = "";
                this.CustomerAddress = "";
                this.CustomerStreet = "";
                this.CustomerCity = "";
                this.CustomerPostalCode = "";
                this.CustomerCountry = "";
                this.CustomerTaxCode = "";
                this.CustomerVATNumber = "";
                this.PaymentTerms = "";
                this.SpecificMentions = "";
                this.ReceptionMethod = "";
                this.SourceDocument = "";
            }
            return VIPHeader;
        }());
        AP.VIPHeader = VIPHeader;
        var VIPLineItem = /** @class */ (function () {
            function VIPLineItem() {
                this.ItemNumber = "";
                this.Description = "";
                this.Amount = "";
                this.Quantity = "";
                this.Unit = "";
                this.UnitPrice = "";
                this.OrderNumber = "";
                this.DeliveryNote = "";
                this.PartNumber = "";
                this.TaxCode = "";
                this.TaxRate = "";
                this.GLAccount = "";
                this.CostCenter = "";
                this.TaxAmount = "";
                this.SESIdentifier = "";
                this.NonDeductibleTaxRate = "";
                this.ProjectCode = "";
            }
            return VIPLineItem;
        }());
        AP.VIPLineItem = VIPLineItem;
        var VIPTaxInformation = /** @class */ (function () {
            function VIPTaxInformation() {
                this.TaxableAmount = "";
                this.TaxAmount = "";
                this.TaxCode = "";
                this.TaxRate = "";
            }
            return VIPTaxInformation;
        }());
        AP.VIPTaxInformation = VIPTaxInformation;
        var VIPPaymentInformations = /** @class */ (function () {
            function VIPPaymentInformations() {
                this.PaymentCondition = "";
                this.PaymentMode = "";
                this.IBAN = "";
                this.BIC = "";
                this.PaymentInstitute = "";
            }
            return VIPPaymentInformations;
        }());
        AP.VIPPaymentInformations = VIPPaymentInformations;
        var VIPTables = /** @class */ (function () {
            function VIPTables() {
                this.LineItems = new Array();
                this.TaxInformations = new Array();
                this.PaymentInformations = new Array();
            }
            return VIPTables;
        }());
        AP.VIPTables = VIPTables;
        var VIPData = /** @class */ (function () {
            function VIPData() {
                this.header = new VIPHeader();
                this.logo = {};
                this.companyInfo = {};
                this.tables = new VIPTables();
            }
            return VIPData;
        }());
        AP.VIPData = VIPData;
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
