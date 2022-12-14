///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Transaction_Parser_GL1076_Mapping_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Mapping for the GL1076 name of field in specs to name in form",
  "require": []
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Transaction;
        (function (Transaction) {
            var Parser;
            (function (Parser) {
                var GL1076;
                (function (GL1076) {
                    var _mapping = {
                        headerMapping: {
                            "Record Type": null,
                            "Global Client Origin Identifier": null,
                            "Global Client Name": null,
                            "Recipient Number": null,
                            "Report Name": null,
                            "Report Version Number": null,
                            "Report Version Date": null,
                            "File Creation Date/Time": null,
                            "Process Date": null,
                            "File Version Number": null,
                            "Message Text": null,
                            "Number of Global Client Origin Identifiers": null,
                            "Run Date TimeStamp": null
                        },
                        marketMapping: {
                            "Record Type": null,
                            "Market Code": null,
                            "Client ID": null,
                            "ISO Numeric Country Code": null,
                            "IDC/IEC Indicator": null,
                            "Client Organization Name": null,
                            "Process Date": null,
                            "Message Text": null,
                            "Total Transaction Count": null
                        },
                        marketTable: null,
                        transactionMapping: {
                            "Record Type": null,
                            "Service Establishment Number": null,
                            "Billing Account Number": null,
                            "Billing Basic Control Account Number": null,
                            "Requesting Control Account Number": null,
                            "Market Code": null,
                            "Global Client Origin Identifier": null,
                            "Originating Basic Control Account Number": null,
                            "Originating Card Member Account Number": null,
                            "Line Item Detail (LID) Transaction ID": null,
                            "Record of Charge Identifier Number (ROC ID)": null,
                            "Bill Date": null,
                            "Charge Date": "TransactionDate__",
                            "Business Process Date": null,
                            "Transaction Sequence Number": "TransactionID__",
                            "Business Process Date (Julian YYDDD)": null,
                            "Batch Code": null,
                            "Card Member Embossed Name": "CardholderName__",
                            "Cost Center Code": null,
                            "Employee ID": "EmployeeID__",
                            "Universal Number": null,
                            "Supplier Reference Number": null,
                            "Card Member Reference Number": null,
                            "Card Member Reference Number #2": null,
                            "Card Member Reference Number #3": null,
                            "Card Member Reference Number #4": null,
                            "Ship to Postal Code": null,
                            "Card Member State/Province": null,
                            "Transaction ISO Country Code": null,
                            "Billed Currency Code": "BilledCurrencyCode__",
                            "Billed Decimal Places Number": null,
                            "Local Currency Code": "LocalCurrencyCode__",
                            "Local Decimal Places Number": null,
                            "Billed Amount Sign Indicator": null,
                            "Billed Amount": "BilledAmount__",
                            "Billed Total Tax Sign Indicator": null,
                            "Billed Total Tax Amount": null,
                            "Local Charge Amount Sign Indicator": null,
                            "Local Charge Amount": "LocalAmount__",
                            "Local Tax Amount Sign Indicator": null,
                            "Local Tax Amount ": null,
                            "Charge Description Line 1": "ExpenseDescription__",
                            "Charge Description Line 2 ": null,
                            "Ticket Prefix": null,
                            "Ticket Number": null,
                            "Travel Departure Date": null,
                            "Descriptive Bill Line 3": null,
                            "Passenger Name": null,
                            "Class Code": null,
                            "Descriptive Bill Line 4": null,
                            "Ticket Routing": null,
                            "IATA Carrier Code": null,
                            "MIS Industry Code": null,
                            "Genesis Detail Industry Code": null,
                            "SIC Code": null,
                            "Financial Category Code": null,
                            "Transaction Type Code": null,
                            "Transaction Fee Indicator": null,
                            "Supplier Federal Tax Identifier": null,
                            "Service Establishment Supplier Tax Class": null,
                            "Goods and Services Tax (GST) Sign Indicator": null,
                            "Goods and Services Tax (GST) Amount": null,
                            "Goods and Services Tax (GST) Decimal Places Number": null,
                            "ISO Merchant Category Code": "MerchantCategory__"
                        },
                        transactionTable: "LineTransaction__",
                        LIDHeaderMapping: {
                            "Record Type ": null,
                            "LID Transaction ID": null,
                            "Purchase Order Number": null,
                            "Invoice Number": null,
                            "Original Invoice Number": null,
                            "Total Invoice Discount Sign Indicator": null,
                            "Total Invoice Discount Amount": null,
                            "Freight Sign Indicator": null,
                            "Freight Amount": null,
                            "Handling Sign Indicator": null,
                            "Handling Amount": null,
                            "Miscellaneous Charges Sign Indicator": null,
                            "Miscellaneous Charges Amount": null,
                            "Ship To Country Code": null,
                            "Ship From State/Province": null,
                            "Ship From Postal Code": null,
                            "Tax Point Date": null,
                            "Requester Name": null,
                            "Supplier Provincial Tax Identifier": null,
                            "Customer National Identifier": null,
                            "Value Added Tax Sign Indicator": null,
                            "Value Added Tax (VAT) Amount": null,
                            "Value Added Tax Rate": null,
                            "Value Added Tax Exempt Code": null,
                            "Goods and Services Tax Sign Indicator": null,
                            "Goods and Services Tax (GST) Amount": null,
                            "Goods and Services Tax Rate": null,
                            "Goods and Services Tax Exempt Code": null,
                            "Provincial Sales Tax Sign Indicator": null,
                            "Provincial Sales Tax (PST) Amount": null,
                            "Provincial Sales Tax Rate": null,
                            "Provincial Sales Tax Exempt Code": null,
                            "Quebec Sales Tax Sign Indicator": null,
                            "Quebec Sales Tax (QST) Amount": null,
                            "Quebec Sales Tax Rate": null,
                            "Quebec Sales Tax Exempt Code": null,
                            "Harmonised Sales Tax Sign Indicator": null,
                            "Harmonised Sales Tax (HST) Amount": null,
                            "Harmonised Sales Tax Rate": null,
                            "Harmonised Sales Tax Exempt Code": null,
                            "Tax 1 Taxable Amount Sign Indicator": null,
                            "Tax 1 Taxable Amount": null,
                            "Tax 1 Sign Indicator": null,
                            "Tax 1 Tax Amount": null,
                            "Tax 1 Tax Rate": null,
                            "Tax 1 Tax Exempt Code": null,
                            "Tax 2 Taxable Amount Sign Indicator": null,
                            "Tax 2 Taxable Amount": null,
                            "Tax 2 Tax Sign Indicator": null,
                            "Tax 2 Tax Amount": null,
                            "Tax 2 Tax Rate": null,
                            "Tax 2 Tax Exempt Code": null,
                            "Tax 3 Taxable Amount Sign Indicator": null,
                            "Tax 3 Taxable Amount": null,
                            "Tax 3 Tax Sign Indicator": null,
                            "Tax 3 Tax Amount": null,
                            "Tax 3 Tax Rate": null,
                            "Tax 3 Tax Exempt Code": null,
                            "Tax 4 Taxable Amount Sign Indicator": null,
                            "Tax 4 Taxable Amount": null,
                            "Tax 4 Tax Sign Indicator": null,
                            "Tax 4 Tax Amount": null,
                            "Tax 4 Tax Rate": null,
                            "Tax 4 Tax Exempt Code": null,
                            "Carrier Tracking Number": null
                        },
                        LIDHeaderTable: null,
                        basicLIDProductInformationMapping: {
                            "Record Type ": null,
                            "LID Transaction ID": null,
                            "Sold By": null,
                            "LID Line ID": null,
                            "Line Identifier": null,
                            "Quantity Invoiced Sign Indicator": null,
                            "Quantity Invoiced": null,
                            "Quantity Unit of Measure": null,
                            "Unit Price Sign Indicator": null,
                            "Unit Price": null,
                            "Extended Amount Sign Indicator": null,
                            "Extended Amount": null,
                            "Total Line Value Sign Indicator": null,
                            "Total Line Value Amount": null,
                            "Item Description": null,
                            "Vendor Part Number": null,
                            "Manufacturer Part Number": null,
                            "Supplier Catalog Number": null,
                            "UN/SPSC Code": null,
                            "Vendor/Manufacturer Name": null,
                            "Lease/License Number": null,
                            "Service Agreement Number": null,
                            "Freight Sign Indicator": null,
                            "Freight Amount": null,
                            "Handling Sign Indicator": null,
                            "Handling Amount": null,
                            "Discount Sign Indicator": null,
                            "Discount Amount": null,
                            "Flat Rate Sign Indicator": null,
                            "Flat Rate Amount": null,
                            "Lost/Damaged Items Sign Indicator": null,
                            "Lost/Damaged Items Amount": null,
                            "One Time Miscellaneous Charges Sign Indicator": null,
                            "One Time Miscellaneous Charges Amount": null,
                            "Other Charges Sign Indicator": null,
                            "Other Charges Amount": null,
                            "Miscellaneous Charges Sign Indicator": null,
                            "Miscellaneous Charges Amount": null,
                            "Lease Cost Sign Indicator": null,
                            "Lease Cost Amount": null,
                            "Service Credit Sign Indicator": null,
                            "Service Credit Amount": null,
                            "Carrier Name": null
                        },
                        basicLIDProductInformationTable: null,
                        LIDTaxMapping: {
                            "Record Type ": null,
                            "LID Transaction ID": null,
                            "LID Line ID": null,
                            "Line Identifier": null,
                            "Total Taxable Amount Sign Indicator": null,
                            "Total Taxable Amount": null,
                            "Total Tax Sign Indicator": null,
                            "Total Tax Amount": null,
                            "Total Tax Rate": null,
                            "Total Tax Exempt Code": null,
                            "Value Added Tax Sign Indicator": null,
                            "Value Added Tax (VAT) Amount": null,
                            "Value Added Tax Rate": null,
                            "Value Added Tax Exempt Code": null,
                            "Goods and Services Tax Sign Indicator": null,
                            "Goods and Services Tax (GST) Amount": null,
                            "Goods and Services Tax Rate": null,
                            "Goods and Services Tax Exempt Code": null,
                            "Provincial Sales Tax Sign Indicator": null,
                            "Provincial Sales Tax (PST) Amount": null,
                            "Provincial Sales Tax Rate": null,
                            "Provincial Sales Tax Exempt Code": null,
                            "Quebec Sales Tax Sign Indicator": null,
                            "Quebec Sales Tax (QST) Amount": null,
                            "Quebec Sales Tax Rate": null,
                            "Quebec Sales Tax Exempt Code": null,
                            "Harmonised Sales Tax Sign Indicator": null,
                            "Harmonised Sales Tax (HST) Amount": null,
                            "Harmonised Sales Tax Rate": null,
                            "Harmonised Sales Tax Exempt Code": null,
                            "Tax 1 Taxable Amount Sign Indicator": null,
                            "Tax 1 Taxable Amount": null,
                            "Tax 1 Sign Indicator": null,
                            "Tax 1 Tax Amount": null,
                            "Tax 1 Tax Rate": null,
                            "Tax 1 Tax Exempt Code": null,
                            "Tax 2 Taxable Amount Sign Indicator": null,
                            "Tax 2 Taxable Amount": null,
                            "Tax 2 Tax Sign Indicator": null,
                            "Tax 2 Tax Amount": null,
                            "Tax 2 Tax Rate": null,
                            "Tax 2 Tax Exempt Code": null,
                            "Tax 3 Taxable Amount Sign Indicator": null,
                            "Tax 3 Taxable Amount": null,
                            "Tax 3 Tax Sign Indicator": null,
                            "Tax 3 Tax Amount": null,
                            "Tax 3 Tax Rate": null,
                            "Tax 3 Tax Exempt Code": null,
                            "Tax 4 Taxable Amount Sign Indicator": null,
                            "Tax 4 Taxable Amount": null,
                            "Tax 4 Tax Sign Indicator": null,
                            "Tax 4 Tax Amount": null,
                            "Tax 4 Tax Rate": null,
                            "Tax 4 Tax Exempt Code": null
                        },
                        LIDTaxTable: null,
                        LIDPropertiesMapping: {
                            "Record Type ": null,
                            "LID Transaction ID": null,
                            "LID Line ID": null,
                            "Line Identifier": null,
                            "Requisition Number": null,
                            "Packing Slip Number": null,
                            "Serial Number": null,
                            "Client Material Number": null,
                            "Client Asset Code": null,
                            "Customer Reference Number": null,
                            "Tracking Number": null,
                            "MSDS Number": null,
                            "Chemical Abstracts Svc Number": null,
                            "Division Code": null,
                            "General Ledger Number": null,
                            "Cost Center Number": null,
                            "Location Code": null,
                            "Project Number": null,
                            "Work Order Number": null,
                            "Department": null,
                            "Operation Fiscal Code": null,
                            "Operation Type": null,
                            "Product Fiscal Classification Code": null
                        },
                        LIDPropertiesTable: null,
                        vPaymentAuthorizationDataMapping: {
                            "Record Type ": null,
                            "Transaction Matched Code 1": null,
                            "Transaction Matched Code 2": null,
                            "Account Number": null,
                            "PreAuthorization Unique ID": null,
                            "Merchant Match Code": null,
                            "Requestor User Identifier": null,
                            "PreAuthorization Amount": null,
                            "PreAuthorization Status Code": null,
                            "PreAuthorization Create Date": null,
                            "PreAuthorization Expiration Date": null,
                            "User Accounting Information 1 Text": null,
                            "User Accounting Information 2 Text": null,
                            "User Accounting Information 3 Text": null,
                            "Authorized Amount": null,
                            "PreAuthorization Merchant Name": null,
                            "Authorization Code": null,
                            "Open PreAuthorization Approval Code": null,
                            "PreAuthorization Effective Date": null,
                            "Matched Transaction Amount": null,
                            "Transaction Sequence Number": null,
                            "Business Process Date (Julian)": null,
                            "Batch Number": null,
                            "Derived Requestor Code": null,
                            "Partial Shipment Amount": null,
                            "Partial Shipment Code": null,
                            "PreAuthorization Currency Code": null,
                            "PreAuthorization Maintained Amount": null,
                            "Settled Debit Total Amount": null,
                            "Settled Debit Count": null
                        },
                        vPaymentAuthorizationDataTable: null,
                        vPaymentAuthorizationUserMapping: {
                            "Record Type ": null,
                            "vPayment Token Account Number": null,
                            "PreAuthorization Unique ID": null,
                            "Transaction Sequence Number": null,
                            "Business Process Date (Julian)": null,
                            "Batch Number": null,
                            "User Defined 1": null,
                            "User Defined 2": null,
                            "User Defined 3": null,
                            "User Defined 4": null,
                            "User Defined 5": null,
                            "User Defined 6": null,
                            "User Defined 7": null,
                            "User Defined 8": null,
                            "User Defined 9": null,
                            "User Defined 10": null,
                            "User Defined 11": null,
                            "User Defined 12": null
                        },
                        vPaymentAuthorizationUserTable: null,
                        vPaymentAuthorizationAccountingMapping: {
                            "Record Type ": null,
                            "vPayment Token Account Number": null,
                            "PreAuthorization Unique ID": null,
                            "Transaction Sequence Number": null,
                            "Business Process Date (Julian)": null,
                            "Batch Number": null,
                            "Accounting 1": null,
                            "Accounting 2": null,
                            "Accounting 3": null,
                            "Accounting 4": null,
                            "Accounting 5": null,
                            "Accounting 6": null,
                            "Accounting 7": null,
                            "Accounting 8": null
                        },
                        vPaymentAuthorizationAccountingTable: null,
                        serviceEstablishmentInformationMapping: {
                            "Record Type ": null,
                            "Service Establishment (SE) Number": null,
                            "Service Establishment  Name 1": "MerchantName__",
                            "Service Establishment Name 2": null,
                            "Service Establishment Address 1": null,
                            "Service Establishment Address 2": null,
                            "Service Establishment Address 3": null,
                            "Service Establishment City Name": null,
                            "Service Establishment County Name": null,
                            "Service Establishment State/Province Code": null,
                            "Service Establishment Postal Code": null,
                            "Service Establishment Country Code": null,
                            "Service Establishment Country Name": null,
                            "Service Establishment Telephone": null,
                            "Service Establishment Chain Code": null,
                            "Genesis Major Industry Code": null,
                            "Genesis Sub Industry Code": null,
                            "Service Establishment Purchase Card Indicator": null,
                            "Service Establishment Minority Code": null,
                            "Service Establishment Tax Identifier": null,
                            "Standard Industry Classification Code": null,
                            "Dun & Bradstreet Number": null,
                            "Service Establishment Corporate Status Code": null,
                            "Service Establishment Chain Name": null,
                            "Service Establishment Brand Name": null
                        },
                        serviceEstablishmentInformationTable: null,
                        trailerMapping: {
                            "Record Type ": null,
                            "Total Record Count": null,
                            "Global Client Origin Identifier": null,
                            "File Creation Date/Time": null,
                            "Process Date": null
                        }
                    };
                    function getMapping() {
                        return _mapping;
                    }
                    GL1076.getMapping = getMapping;
                })(GL1076 = Parser.GL1076 || (Parser.GL1076 = {}));
            })(Parser = Transaction.Parser || (Transaction.Parser = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
