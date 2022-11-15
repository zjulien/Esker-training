///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Transaction_Parser_GL1076_ASCII_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Expense Transaction parser for ASCII GL1076 row file",
  "require": [
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Object",
    "Lib_Expense_Transaction_Parser_V12.0.461.0",
    "Lib_Expense_Transaction_Parser_GL1076_Mapping_V12.0.461.0"
  ]
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
                    var ASCII;
                    (function (ASCII) {
                        //#endregion
                        //#region Extractor Config
                        var headerExtractorConfig = {
                            "Record Type": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Global Client Origin Identifier": { start: 3, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Global Client Name": { start: 18, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Recipient Number": { start: 58, length: 9, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Report Name": { start: 67, length: 7, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Report Version Number": { start: 74, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Report Version Date": { start: 77, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File Creation Date/Time": { start: 85, length: 20, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Process Date": { start: 105, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File Version Number": { start: 113, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Message Text": { start: 116, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Number of Global Client Origin Identifiers": { start: 156, length: 4, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Run Date TimeStamp": { start: 160, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var marketExtractorConfig = {
                            "Record Type": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Market Code": { start: 3, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Client ID": { start: 6, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "ISO Numeric Country Code": { start: 30, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "IDC/IEC Indicator": { start: 33, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Client Organization Name": { start: 34, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Process Date": { start: 74, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Message Text": { start: 82, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Transaction Count": { start: 122, length: 9, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var transactionExtractorConfig = {
                            "Record Type": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Number": { start: 3, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billing Account Number": { start: 13, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billing Basic Control Account Number": { start: 32, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Requesting Control Account Number": { start: 51, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Market Code": { start: 70, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Global Client Origin Identifier": { start: 73, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Originating Basic Control Account Number": { start: 88, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Originating Card Member Account Number": { start: 107, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Line Item Detail (LID) Transaction ID": { start: 126, length: 18, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Record of Charge Identifier Number (ROC ID)": { start: 166, length: 13, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Bill Date": { start: 179, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Charge Date": { start: 187, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Business Process Date": { start: 195, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Sequence Number": { start: 203, length: 7, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Business Process Date (Julian YYDDD)": { start: 210, length: 5, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Batch Code": { start: 215, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Embossed Name": { start: 218, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Cost Center Code": { start: 248, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Employee ID": { start: 263, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Universal Number": { start: 278, length: 25, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Supplier Reference Number": { start: 303, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Reference Number": { start: 318, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Reference Number #2": { start: 338, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Reference Number #3": { start: 358, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Reference Number #4": { start: 378, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Ship to Postal Code": { start: 398, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member State/Province": { start: 413, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction ISO Country Code": { start: 419, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billed Currency Code": { start: 422, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billed Decimal Places Number": { start: 425, length: 1, justify: "Left", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Local Currency Code": { start: 426, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Local Decimal Places Number": { start: 429, length: 1, justify: "Left", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billed Amount Sign Indicator": { start: 430, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billed Amount": { start: 431, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 430, hasDecimalIndicator: true, whereIsDecimalIndicator: 425 },
                            "Billed Total Tax Sign Indicator": { start: 446, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billed Total Tax Amount": { start: 447, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 446, hasDecimalIndicator: true, whereIsDecimalIndicator: 425 },
                            "Local Charge Amount Sign Indicator": { start: 462, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Local Charge Amount": { start: 463, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 462, hasDecimalIndicator: true, whereIsDecimalIndicator: 429 },
                            "Local Tax Amount Sign Indicator": { start: 478, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Local Tax Amount ": { start: 479, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 478, hasDecimalIndicator: true, whereIsDecimalIndicator: 429 },
                            "Charge Description Line 1": { start: 494, length: 42, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Charge Description Line 2 ": { start: 536, length: 42, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Ticket Prefix": { start: 536, length: 4, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Ticket Number": { start: 540, length: 16, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Travel Departure Date": { start: 556, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Descriptive Bill Line 3": { start: 578, length: 42, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Passenger Name": { start: 578, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Class Code": { start: 609, length: 8, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Descriptive Bill Line 4": { start: 620, length: 42, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Ticket Routing": { start: 620, length: 24, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "IATA Carrier Code": { start: 645, length: 16, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "MIS Industry Code": { start: 662, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Genesis Detail Industry Code": { start: 664, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "SIC Code": { start: 667, length: 4, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Financial Category Code": { start: 671, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Type Code": { start: 672, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Fee Indicator": { start: 674, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Supplier Federal Tax Identifier": { start: 677, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Supplier Tax Class": { start: 707, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax (GST) Sign Indicator": { start: 709, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax (GST) Amount": { start: 710, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 48, hasDecimalIndicator: true, whereIsDecimalIndicator: 64 },
                            "Goods and Services Tax (GST) Decimal Places Number": { start: 725, length: 1, justify: "Left", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "ISO Merchant Category Code": { start: 726, length: 4, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var LIDHeaderExtractorConfig = {
                            "Record Type ": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "LID Transaction ID": { start: 3, length: 18, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Purchase Order Number": { start: 43, length: 22, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Invoice Number": { start: 65, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Original Invoice Number": { start: 80, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Invoice Discount Sign Indicator": { start: 95, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Invoice Discount Amount": { start: 96, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 95, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Freight Sign Indicator": { start: 111, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Freight Amount": { start: 112, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 111, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Handling Sign Indicator": { start: 127, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Handling Amount": { start: 128, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 127, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Miscellaneous Charges Sign Indicator": { start: 143, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Miscellaneous Charges Amount": { start: 144, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 143, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Ship To Country Code": { start: 159, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Ship From State/Province": { start: 174, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Ship From Postal Code": { start: 180, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax Point Date": { start: 195, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Requester Name": { start: 203, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Supplier Provincial Tax Identifier": { start: 243, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Customer National Identifier": { start: 273, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Value Added Tax Sign Indicator": { start: 293, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Value Added Tax (VAT) Amount": { start: 294, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 293, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Value Added Tax Rate": { start: 309, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Value Added Tax Exempt Code": { start: 325, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax Sign Indicator": { start: 326, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax (GST) Amount": { start: 327, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 326, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax Rate": { start: 342, length: 16, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax Exempt Code": { start: 358, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Provincial Sales Tax Sign Indicator": { start: 359, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Provincial Sales Tax (PST) Amount": { start: 360, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 359, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Provincial Sales Tax Rate": { start: 375, length: 16, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Provincial Sales Tax Exempt Code": { start: 391, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quebec Sales Tax Sign Indicator": { start: 392, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quebec Sales Tax (QST) Amount": { start: 393, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 392, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quebec Sales Tax Rate": { start: 408, length: 16, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quebec Sales Tax Exempt Code": { start: 424, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Harmonised Sales Tax Sign Indicator": { start: 425, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Harmonised Sales Tax (HST) Amount": { start: 426, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 425, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Harmonised Sales Tax Rate": { start: 441, length: 16, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Harmonised Sales Tax Exempt Code": { start: 457, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Taxable Amount Sign Indicator": { start: 458, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Taxable Amount": { start: 459, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 458, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Sign Indicator": { start: 474, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Tax Amount": { start: 475, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 474, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Tax Rate": { start: 490, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Tax Exempt Code": { start: 505, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Taxable Amount Sign Indicator": { start: 506, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Taxable Amount": { start: 507, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 506, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Tax Sign Indicator": { start: 522, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Tax Amount": { start: 523, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 522, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Tax Rate": { start: 538, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Tax Exempt Code": { start: 553, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Taxable Amount Sign Indicator": { start: 554, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Taxable Amount": { start: 555, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 554, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Tax Sign Indicator": { start: 570, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Tax Amount": { start: 571, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 570, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Tax Rate": { start: 586, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Tax Exempt Code": { start: 601, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Taxable Amount Sign Indicator": { start: 602, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Taxable Amount": { start: 603, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 602, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Tax Sign Indicator": { start: 618, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Tax Amount": { start: 619, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 618, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Tax Rate": { start: 634, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Tax Exempt Code": { start: 649, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Carrier Tracking Number": { start: 650, length: 50, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var vPaymentAuthorizationDataExtractorConfig = {
                            "Record Type ": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Matched Code 1": { start: 3, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Matched Code 2": { start: 4, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Account Number": { start: 5, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Unique ID": { start: 24, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Merchant Match Code": { start: 39, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Requestor User Identifier": { start: 40, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Amount": { start: 55, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Status Code": { start: 70, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Create Date": { start: 71, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Expiration Date": { start: 79, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Accounting Information 1 Text": { start: 87, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Accounting Information 2 Text": { start: 107, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Accounting Information 3 Text": { start: 127, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Authorized Amount": { start: 147, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Merchant Name": { start: 163, length: 23, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Authorization Code": { start: 186, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Open PreAuthorization Approval Code": { start: 192, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Effective Date": { start: 193, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Matched Transaction Amount": { start: 201, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Sequence Number": { start: 217, length: 7, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Business Process Date (Julian)": { start: 224, length: 5, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Batch Number": { start: 229, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Derived Requestor Code": { start: 232, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Partial Shipment Amount": { start: 247, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Partial Shipment Code": { start: 262, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Currency Code": { start: 263, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Maintained Amount": { start: 266, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Settled Debit Total Amount": { start: 282, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Settled Debit Count": { start: 298, length: 4, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var vPaymentAuthorizationUserExtractorConfig = {
                            "Record Type ": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "vPayment Token Account Number": { start: 3, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Unique ID": { start: 22, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Sequence Number": { start: 37, length: 7, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Business Process Date (Julian)": { start: 44, length: 5, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Batch Number": { start: 49, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 1": { start: 52, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 2": { start: 92, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 3": { start: 132, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 4": { start: 172, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 5": { start: 212, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 6": { start: 252, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 7": { start: 292, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 8": { start: 332, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 9": { start: 372, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 10": { start: 412, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 11": { start: 452, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "User Defined 12": { start: 492, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var vPaymentAuthorizationAccountingExtractorConfig = {
                            "Record Type ": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "vPayment Token Account Number": { start: 3, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "PreAuthorization Unique ID": { start: 22, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Sequence Number": { start: 37, length: 7, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Business Process date(Julian)": { start: 44, length: 5, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Batch Number": { start: 49, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Accounting 1": { start: 52, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Accounting 2": { start: 92, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Accounting 3": { start: 132, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Accounting 4": { start: 172, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Accounting 5": { start: 212, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Accounting 6": { start: 252, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Accounting 7": { start: 292, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Accounting 8": { start: 332, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var basicLIDProductInformationExtractorConfig = {
                            "Record Type ": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "LID Transaction ID": { start: 3, length: 18, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Sold By": { start: 21, length: 22, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "LID Line ID": { start: 43, length: 5, justify: "Left", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Line Identifier": { start: 48, length: 5, justify: "Left", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quantity Invoiced Sign Indicator": { start: 53, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quantity Invoiced": { start: 54, length: 16, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 53, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quantity Unit of Measure": { start: 70, length: 4, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Unit Price Sign Indicator": { start: 74, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Unit Price": { start: 75, length: 16, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 74, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Extended Amount Sign Indicator": { start: 91, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Extended Amount": { start: 92, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 91, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Line Value Sign Indicator": { start: 107, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Line Value Amount": { start: 108, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 107, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Item Description": { start: 123, length: 80, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Vendor Part Number": { start: 203, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Manufacturer Part Number": { start: 233, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Supplier Catalog Number": { start: 263, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "UN/SPSC Code": { start: 283, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Vendor/Manufacturer Name": { start: 313, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Lease/License Number": { start: 353, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Agreement Number": { start: 383, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Freight Sign Indicator": { start: 413, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Freight Amount": { start: 414, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 413, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Handling Sign Indicator": { start: 429, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Handling Amount": { start: 430, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 429, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Discount Sign Indicator": { start: 445, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Discount Amount": { start: 446, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 445, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Flat Rate Sign Indicator": { start: 461, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Flat Rate Amount": { start: 462, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 461, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Lost/Damaged Items Sign Indicator": { start: 477, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Lost/Damaged Items Amount": { start: 478, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 477, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "One Time Miscellaneous Charges Sign Indicator": { start: 493, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "One Time Miscellaneous Charges Amount": { start: 494, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 493, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Other Charges Sign Indicator": { start: 509, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Other Charges Amount": { start: 510, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 509, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Miscellaneous Charges Sign Indicator": { start: 525, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Miscellaneous Charges Amount": { start: 526, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 525, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Lease Cost Sign Indicator": { start: 541, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Lease Cost Amount": { start: 542, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 541, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Credit Sign Indicator": { start: 557, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Credit Amount": { start: 558, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 557, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Carrier Name": { start: 573, length: 163, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var LIDTaxExtractorConfig = {
                            "Record Type ": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "LID Transaction ID": { start: 3, length: 18, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "LID Line ID": { start: 43, length: 5, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Line Identifier": { start: 48, length: 5, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Taxable Amount Sign Indicator": { start: 53, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Taxable Amount": { start: 54, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 53, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Tax Sign Indicator": { start: 69, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Tax Amount": { start: 70, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 69, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Tax Rate": { start: 85, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Tax Exempt Code": { start: 101, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Value Added Tax Sign Indicator": { start: 102, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Value Added Tax (VAT) Amount": { start: 103, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 102, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Value Added Tax Rate": { start: 118, length: 16, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Value Added Tax Exempt Code": { start: 134, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax Sign Indicator": { start: 135, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax (GST) Amount": { start: 136, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 135, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax Rate": { start: 151, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax Exempt Code": { start: 167, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Provincial Sales Tax Sign Indicator": { start: 168, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Provincial Sales Tax (PST) Amount": { start: 169, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 168, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Provincial Sales Tax Rate": { start: 184, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Provincial Sales Tax Exempt Code": { start: 200, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quebec Sales Tax Sign Indicator": { start: 201, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quebec Sales Tax (QST) Amount": { start: 202, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 201, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quebec Sales Tax Rate": { start: 217, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Quebec Sales Tax Exempt Code": { start: 233, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Harmonised Sales Tax Sign Indicator": { start: 234, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Harmonised Sales Tax (HST) Amount": { start: 235, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 234, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Harmonised Sales Tax Rate": { start: 250, length: 16, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Harmonised Sales Tax Exempt Code": { start: 266, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Taxable Amount Sign Indicator": { start: 267, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Taxable Amount": { start: 268, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 267, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Sign Indicator": { start: 283, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Tax Amount": { start: 284, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 283, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Tax Rate": { start: 299, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 1 Tax Exempt Code": { start: 314, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Taxable Amount Sign Indicator": { start: 315, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Taxable Amount": { start: 316, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 315, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Tax Sign Indicator": { start: 331, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Tax Amount": { start: 332, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 331, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Tax Rate": { start: 347, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 2 Tax Exempt Code": { start: 362, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Taxable Amount Sign Indicator": { start: 363, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Taxable Amount": { start: 364, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 363, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Tax Sign Indicator": { start: 379, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Tax Amount": { start: 380, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 379, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Tax Rate": { start: 395, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 3 Tax Exempt Code": { start: 410, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Taxable Amount Sign Indicator": { start: 411, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Taxable Amount": { start: 412, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 411, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Tax Sign Indicator": { start: 427, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Tax Amount": { start: 428, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 427, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Tax Rate": { start: 443, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax 4 Tax Exempt Code": { start: 458, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var LIDPropertiesExtractorConfig = {
                            "Record Type ": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "LID Transaction ID": { start: 3, length: 18, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "LID Line ID": { start: 43, length: 5, justify: "Left", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Line Identifier": { start: 48, length: 5, justify: "Left", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Requisition Number": { start: 53, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Packing Slip Number": { start: 83, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Serial Number": { start: 113, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Client Material Number": { start: 143, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Client Asset Code": { start: 173, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Customer Reference Number": { start: 203, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tracking Number": { start: 233, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "MSDS Number": { start: 263, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Chemical Abstracts Svc Number": { start: 293, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Division Code": { start: 323, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "General Ledger Number": { start: 353, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Cost Center Number": { start: 383, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Location Code": { start: 413, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Project Number": { start: 443, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Work Order Number": { start: 473, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Department": { start: 503, length: 80, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Operation Fiscal Code": { start: 583, length: 5, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Operation Type": { start: 588, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Product Fiscal Classification Code": { start: 598, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var serviceEstablishmentInformationExtractorConfig = {
                            "Record Type ": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment (SE) Number": { start: 3, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment  Name 1": { start: 13, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Name 2": { start: 53, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Address 1": { start: 93, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Address 2": { start: 133, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Address 3": { start: 173, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment City Name": { start: 213, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment County Name": { start: 253, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment State/Province Code": { start: 273, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Postal Code": { start: 279, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Country Code": { start: 294, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Country Name": { start: 297, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Telephone": { start: 337, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Chain Code": { start: 352, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Genesis Major Industry Code": { start: 362, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Genesis Sub Industry Code": { start: 364, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Purchase Card Indicator": { start: 367, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Minority Code": { start: 369, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Tax Identifier": { start: 371, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Standard Industry Classification Code": { start: 401, length: 4, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Dun & Bradstreet Number": { start: 405, length: 9, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Corporate Status Code": { start: 414, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Chain Name": { start: 443, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Brand Name": { start: 473, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var trailerExtractorConfig = {
                            "Record Type ": { start: 1, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Record Count": { start: 3, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Global Client Origin Identifier": { start: 13, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File Creation Date/Time": { start: 28, length: 20, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Process Date": { start: 48, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        //#endregion
                        var RecordType;
                        (function (RecordType) {
                            RecordType["header"] = "FH";
                            RecordType["market"] = "00";
                            RecordType["transaction"] = "01";
                            RecordType["LIDHeader"] = "02";
                            RecordType["vPaymentAuthorizationData"] = "03";
                            RecordType["vPaymentAuthorizationUser"] = "04";
                            RecordType["vPaymentAuthorizationAccounting"] = "05";
                            RecordType["basicLIDProductInformation"] = "10";
                            RecordType["LIDTax"] = "11";
                            RecordType["LIDProperties"] = "12";
                            RecordType["serviceEstablishmentInformation"] = "30";
                            RecordType["trailer"] = "FT";
                        })(RecordType || (RecordType = {}));
                        function extractAll(indexOfFile, mapping) {
                            var contentLine = Attach.GetContentByLine(indexOfFile);
                            var transactionCount = 0;
                            var lineCount = 0;
                            var itemTransaction;
                            while (contentLine !== "") {
                                lineCount++;
                                if (contentLine.length !== 735) {
                                    var errorMessage = "Wrong line length at line ".concat(contentLine, " (expected 735, got ").concat(contentLine.length, "!");
                                    Log.Error(errorMessage);
                                    var errorLineLengthKey = "_Wrong line length GL1076";
                                    throw new Parser.TransactionLineError(errorLineLengthKey, lineCount);
                                }
                                else {
                                    var recordType = contentLine.substr(0, 2);
                                    if (recordType === RecordType.header) {
                                        extractSpecificLine(contentLine, lineCount, headerExtractorConfig, mapping.headerMapping);
                                    }
                                    else if (recordType === RecordType.market) {
                                        extractSpecificLine(contentLine, lineCount, marketExtractorConfig, mapping.marketMapping, mapping.marketTable);
                                    }
                                    else if (recordType === RecordType.transaction) {
                                        transactionCount++;
                                        itemTransaction = extractSpecificLine(contentLine, lineCount, transactionExtractorConfig, mapping.transactionMapping, mapping.transactionTable);
                                        calculateCurrencyExchangeRate(itemTransaction);
                                    }
                                    else if (recordType === RecordType.LIDHeader) {
                                        extractSpecificLine(contentLine, lineCount, LIDHeaderExtractorConfig, mapping.LIDHeaderMapping, mapping.LIDHeaderTable);
                                    }
                                    else if (recordType == RecordType.basicLIDProductInformation) {
                                        extractSpecificLine(contentLine, lineCount, basicLIDProductInformationExtractorConfig, mapping.basicLIDProductInformationMapping, mapping.basicLIDProductInformationTable);
                                    }
                                    else if (recordType == RecordType.LIDProperties) {
                                        extractSpecificLine(contentLine, lineCount, LIDPropertiesExtractorConfig, mapping.LIDPropertiesMapping, mapping.LIDPropertiesTable);
                                    }
                                    else if (recordType == RecordType.LIDTax) {
                                        extractSpecificLine(contentLine, lineCount, LIDTaxExtractorConfig, mapping.LIDTaxMapping, mapping.LIDTaxTable);
                                    }
                                    else if (recordType == RecordType.serviceEstablishmentInformation) {
                                        extractSpecificLine(contentLine, lineCount, serviceEstablishmentInformationExtractorConfig, mapping.serviceEstablishmentInformationMapping, null, itemTransaction);
                                    }
                                    else if (recordType === RecordType.trailer) {
                                        extractSpecificLine(contentLine, lineCount, trailerExtractorConfig, mapping.trailerMapping);
                                    }
                                    else if (recordType === RecordType.vPaymentAuthorizationAccounting) {
                                        extractSpecificLine(contentLine, lineCount, vPaymentAuthorizationAccountingExtractorConfig, mapping.vPaymentAuthorizationAccountingMapping, mapping.vPaymentAuthorizationAccountingTable);
                                    }
                                    else if (recordType === RecordType.vPaymentAuthorizationData) {
                                        extractSpecificLine(contentLine, lineCount, vPaymentAuthorizationDataExtractorConfig, mapping.vPaymentAuthorizationDataMapping, mapping.vPaymentAuthorizationDataTable);
                                    }
                                    else if (recordType == RecordType.vPaymentAuthorizationUser) {
                                        extractSpecificLine(contentLine, lineCount, vPaymentAuthorizationUserExtractorConfig, mapping.vPaymentAuthorizationUserMapping, mapping.vPaymentAuthorizationUserTable);
                                    }
                                    else {
                                        Log.Warn("[GL1076 parser] IGNORE : This type of record :" + recordType + " is not support for the moment");
                                    }
                                }
                                contentLine = Attach.GetContentByLine(indexOfFile);
                            }
                            if (transactionCount === 0) {
                                var warnNoLineMessage = "File does not contain any transaction";
                                Log.Warn(warnNoLineMessage);
                            }
                            Log.Info("".concat(transactionCount, " transaction lines where extracted"));
                            Attach.ResetGetContentByBlock(indexOfFile);
                        }
                        function extractSpecificLine(line, lineNumber, extractorConfig, mapping, tableName, toFill) {
                            var itemOrData = Data;
                            if (tableName) {
                                itemOrData = Data.GetTable(tableName).AddItem();
                            }
                            else if (toFill) {
                                itemOrData = toFill;
                            }
                            for (var pair in extractorConfig) {
                                if (Object.prototype.hasOwnProperty.call(extractorConfig, pair)) {
                                    extract(line, lineNumber, pair, extractorConfig[pair], mapping, itemOrData);
                                }
                            }
                            return itemOrData;
                        }
                        function extract(line, lineNumber, name, param, mapping, itemOrData) {
                            //We extract only fields asking by the mapping, if it's not saving processor time
                            if (Object.prototype.hasOwnProperty.call(mapping, name) && mapping[name]) {
                                var strExtract = line.substr(param.start - 1, param.length);
                                //In case this field is completely fill with filler because it doesn't have value, for exemple no Second Currency.
                                if (strExtract.trim() != "") {
                                    if (param.type === "decimal") {
                                        var sign = "+";
                                        if (param.hasSignIndicator) {
                                            sign = line.substr(param.whereIsSign - 1, 1);
                                            if (sign !== "+" && sign !== "-") {
                                                throw new Parser.SyntaxError(null, lineNumber, name, sign, "+,-");
                                            }
                                        }
                                        strExtract = sign + strExtract;
                                        var value = parseFloat(strExtract);
                                        if (isNaN(value)) {
                                            throw new Parser.ConversionError(null, lineNumber, name, "parseFloat", "NaN", strExtract);
                                        }
                                        if (param.hasDecimalIndicator) {
                                            var decimalIndicator = parseInt(line.substr(param.whereIsDecimalIndicator - 1, 1), 10);
                                            if (!isNaN(decimalIndicator)) {
                                                strExtract = strExtract.substr(0, strExtract.length - decimalIndicator) + "." + strExtract.substr(strExtract.length - decimalIndicator, decimalIndicator);
                                                value = parseFloat(strExtract);
                                            }
                                        }
                                        Log.Verbose("Decimal was calculated for the field " + name + ", the value calculated is " + value);
                                        Log.Verbose("Try to put in this value in :" + mapping[name]);
                                        itemOrData.SetValue(mapping[name], value);
                                    }
                                    else if (param.type === "date") {
                                        var date = void 0;
                                        //Julian Date YYDDD => CCYY-MM-DD
                                        if (param.length === 5) {
                                            //TODO if needed, else do not extract it
                                            strExtract = "2021-01-01";
                                        }
                                        //YYMMDD => CCYY-MM-DD Suppose CC == 20
                                        else if (param.length === 6) {
                                            strExtract = "20" + strExtract.substr(0, 2) + "-" + strExtract.substr(2, 2) + "-" + strExtract.substr(4, 2);
                                        }
                                        //CCYYMMDD => CCYY-MM-DD
                                        else if (param.length === 8) {
                                            strExtract = strExtract.substr(0, 4) + "-" + strExtract.substr(4, 2) + "-" + strExtract.substr(6, 2);
                                        }
                                        //CCYY-MM-DD
                                        var dateRegex = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/g;
                                        var matches = strExtract.match(dateRegex);
                                        if (!matches || matches.length == 0) {
                                            throw new Parser.SyntaxError(null, lineNumber, name, strExtract, "YYYY-MM-DD");
                                        }
                                        date = Sys.Helpers.Date.ISOSTringToDate(strExtract);
                                        Log.Verbose("Date was calculated for the field " + name + ", the value calculated is " + date);
                                        Log.Verbose("Try to put in this value in :" + mapping[name]);
                                        itemOrData.SetValue(mapping[name], date);
                                    }
                                    else if (param.type === "string") {
                                        var value = void 0;
                                        value = strExtract.trim(); //to follow the norm, we have to read param.justify and trim only other side (TODO if neeeded only)
                                        Log.Verbose("String was calculated for the field " + name + ", the value calculated is " + value);
                                        Log.Verbose("Try to put this value in :" + mapping[name]);
                                        itemOrData.SetValue(mapping[name], value);
                                    }
                                }
                            }
                            // To found if some fields is available in the extractor and not in the mapping (That could nerver happened)
                            else if (!Object.prototype.hasOwnProperty.call(mapping, name)) {
                                Log.Warn(" Field : " + name + " is not available in the mapping but is defined in the extractor configuration");
                            }
                        }
                        function calculateCurrencyExchangeRate(item) {
                            var billedAmount = new Sys.Decimal(item.GetValue("BilledAmount__") || 0);
                            var localAmount = new Sys.Decimal(item.GetValue("LocalAmount__") || 0);
                            if (!Sys.Helpers.IsEmpty(billedAmount) && !Sys.Helpers.IsEmpty(localAmount) && localAmount.toNumber() !== 0) {
                                item.SetValue("CurrencyExchangeRate__", billedAmount.div(localAmount).toNumber());
                            }
                        }
                        var _parser = {
                            IsCompatible: function (indexOfFile) {
                                //A file is a ASCII GL1076 row file if on the first line we found GL1076 at a specific position
                                var content = Attach.GetContentByLine(indexOfFile);
                                var compatible = content && content.length >= 73 && content.substr(66, 6) === "GL1076";
                                Attach.ResetGetContentByBlock(indexOfFile);
                                return compatible;
                            },
                            RunParsing: function (indexOfFile) {
                                Log.Info("Using parser GL1076 ASCII");
                                var mapping = Lib.Expense.Transaction.Parser.GL1076.getMapping();
                                extractAll(indexOfFile, mapping);
                                return true;
                            }
                        };
                        function getParser() {
                            return _parser;
                        }
                        ASCII.getParser = getParser;
                    })(ASCII = GL1076.ASCII || (GL1076.ASCII = {}));
                })(GL1076 = Parser.GL1076 || (Parser.GL1076 = {}));
            })(Parser = Transaction.Parser || (Transaction.Parser = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
