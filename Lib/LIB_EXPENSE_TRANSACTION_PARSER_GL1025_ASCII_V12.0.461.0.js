///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Transaction_Parser_GL1025_ASCII_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Expense Transaction parser for ASCII GL1025 row file",
  "require": [
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Object",
    "Lib_Expense_Transaction_Parser_V12.0.461.0",
    "Lib_Expense_Transaction_Parser_GL1025_Mapping_V12.0.461.0"
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
                var GL1025;
                (function (GL1025) {
                    var ASCII;
                    (function (ASCII) {
                        //#endregion
                        //#region Extractor Config
                        var headerExtractorConfig = {
                            "Record Type": { start: 1, length: 1, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Reporting Group": { start: 2, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Recipient Number": { start: 17, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Report Prefix": { start: 28, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Report Number": { start: 30, length: 5, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Client Data File Version": { start: 36, length: 4, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File Frequency Delivery Indicator ": { start: 41, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Data File Create Date": { start: 44, length: 10, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Data File Julian Date": { start: 55, length: 5, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File (Layout) Version Number": { start: 61, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File Version Date": { start: 64, length: 10, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File Type Indicator": { start: 75, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Record Count": { start: 78, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Neutral ISO Currency Code": { start: 94, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Neutral Currency - Decimal Place Indicator": { start: 97, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Daily Unbilled Amount - Neutral Currency": { start: 100, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 99, hasDecimalIndicator: true, whereIsDecimalIndicator: 97 },
                            "Total Card Member Balance - Neutral Currency": { start: 117, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 116, hasDecimalIndicator: true, whereIsDecimalIndicator: 97 },
                            "Data File Create Run Time": { start: 133, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Transaction Count": { start: 139, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var marketExtractorConfig = {
                            "Record Type": { start: 1, length: 1, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Data File Content Date": { start: 2, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Data File Content Date - Julian": { start: 10, length: 5, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "No Data Content Indicator": { start: 15, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Record Count": { start: 27, length: 10, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Market Code": { start: 37, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "ISO Currency Code - Primary Currency": { start: 40, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Decimal Place Indicator - Primary Currency": { start: 43, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "ISO Currency Code - Secondary Currency": { start: 44, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Decimal Place Indicator - Secondary Currency": { start: 47, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "ISO Currency Code - Neutral Currency": { start: 48, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Decimal Place Indicator - Neutral Currency": { start: 51, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Daily Unbilled Amount - Primary Currency": { start: 54, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 53, hasDecimalIndicator: true, whereIsDecimalIndicator: 43 },
                            "Total Daily Unbilled Amount - Secondary Currency": { start: 70, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 69, hasDecimalIndicator: true, whereIsDecimalIndicator: 47 },
                            "Total Daily Unbilled Amount - Neutral Currency": { start: 86, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 85, hasDecimalIndicator: true, whereIsDecimalIndicator: 51 },
                            "Total Card Member Balance - Primary Currency": { start: 103, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 102, hasDecimalIndicator: true, whereIsDecimalIndicator: 43 },
                            "Total Card Member Balance - Secondary Currency": { start: 119, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 118, hasDecimalIndicator: true, whereIsDecimalIndicator: 47 },
                            "Total Card Member Balance - Neutral Currency": { start: 135, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 134, hasDecimalIndicator: true, whereIsDecimalIndicator: 51 },
                            "Total Market Transaction Count": { start: 150, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var transactionExtractorConfig = {
                            "Record Type": { start: 1, length: 1, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Market Code": { start: 2, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Global Client Origin Identifier": { start: 5, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Requesting Control Account Number": { start: 25, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Requesting Control Account Name": { start: 49, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billing Basic Control Account Number": { start: 94, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billing Basic Control Account Name": { start: 113, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Account Type": { start: 153, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Originating Basic Control Account Number": { start: 159, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Originating Card Member Account Number": { start: 183, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Liability Code": { start: 204, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billing Account Number": { start: 208, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Last Name": { start: 228, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "First Name": { start: 258, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Middle Name": { start: 278, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Embossed Name": { start: 298, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Employee Id": { start: 328, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Basic Control Account Company Doing Business As Name": { start: 343, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Basic Control Account Company Legal Name": { start: 383, length: 50, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Requesting Control Account Company DBA Name": { start: 433, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Requesting Control Account Company Legal Name": { start: 473, length: 50, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Cost Center": { start: 523, length: 13, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Universal Number": { start: 541, length: 25, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Language Preference Code": { start: 571, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Business Process Date": { start: 574, length: 8, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Charge Date": { start: 589, length: 10, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Data File Date": { start: 600, length: 10, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Data File Julian Date": { start: 611, length: 5, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Bill Date": { start: 617, length: 10, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction ID": { start: 632, length: 50, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Reference Number": { start: 702, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Record Of Charge ID": { start: 724, length: 13, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billed Amount": { start: 738, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 737, hasDecimalIndicator: true, whereIsDecimalIndicator: 769 },
                            "Billed Tax Amount": { start: 754, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 737, hasDecimalIndicator: true, whereIsDecimalIndicator: 769 },
                            "Billed Decimal Place Indicator": { start: 769, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Billed Currency ISO Code": { start: 770, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Euro - Billed Amount": { start: 776, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 737, hasDecimalIndicator: true, whereIsDecimalIndicator: 807 },
                            "Euro - Billed Tax Amount": { start: 792, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 737, hasDecimalIndicator: true, whereIsDecimalIndicator: 807 },
                            "Euro - Billed Decimal Place Indicator": { start: 807, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Euro - Billed Currency ISO Code": { start: 808, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Local Charge Amount": { start: 812, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 737, hasDecimalIndicator: true, whereIsDecimalIndicator: 843 },
                            "Local Tax Amount ": { start: 828, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 737, hasDecimalIndicator: true, whereIsDecimalIndicator: 843 },
                            "Local Decimal Place Indicator": { start: 843, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Currency Exchange Rate": { start: 844, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Local Currency ISO Code": { start: 859, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Local Country ISO Code": { start: 862, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Neutral Currency Billed Amount": { start: 865, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 737, hasDecimalIndicator: true, whereIsDecimalIndicator: 880 },
                            "Neutral Currency Decimal Place Indicator": { start: 880, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Neutral ISO Currency Code": { start: 881, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Type Code": { start: 899, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Financial Category Code": { start: 903, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "MIS Industry Code": { start: 905, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Genesis Major Industry Code": { start: 914, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "SIC Code": { start: 918, length: 4, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "SIC Division Code": { start: 923, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Genesis Detail Industry Code": { start: 926, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Transaction Fee Indicator": { start: 944, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Charge Description Line 1": { start: 947, length: 45, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Charge Description Line 2 ": { start: 992, length: 45, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Charge Description Line 3": { start: 1037, length: 45, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Charge Description Line 4": { start: 1082, length: 45, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Charge Description Line 5": { start: 1127, length: 45, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Air Departure Date": { start: 1172, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Air Routing": { start: 1182, length: 100, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Air Class of Service": { start: 1282, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Air Carrier Code": { start: 1322, length: 42, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Travel Agency Air Ticket Issuer": { start: 1364, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Travel Agency Air Issuer City": { start: 1404, length: 35, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Travel Agency Air Issuer Region": { start: 1439, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Travel Agency Air Issuer Country Code (ISO)": { start: 1442, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Air Passenger Name": { start: 1445, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Travel Agency Identifier": { start: 1485, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Air Ticket Number": { start: 1495, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Flight Number": { start: 1510, length: 50, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Mileage": { start: 1560, length: 6, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Domestic or International Code": { start: 1591, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Predominant Carrier Code": { start: 1594, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Predominant Class Category Code": { start: 1597, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Predominant Supplier Class Code": { start: 1598, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Round-trip Indicator": { start: 1600, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Description of Charge": { start: 1172, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Guest Name": { start: 1202, length: 35, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Arrival Date": { start: 1237, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Depart Date": { start: 1247, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Stay Duration": { start: 1257, length: 4, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Room Rate": { start: 1261, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel City": { start: 1276, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel State Code": { start: 1306, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel State (Latin America/Caribbean Region)": { start: 1312, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Region ID": { start: 1332, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Country ID (ISO)": { start: 1335, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Phone Number": { start: 1338, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Hotel Folio Number": { start: 1353, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Rental Date": { start: 1172, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Return Date": { start: 1182, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Rental City": { start: 1192, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Rental State Code": { start: 1222, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Rental State (Latin America/Caribbean Region)": { start: 1228, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Rental Region ID": { start: 1248, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Rental Country ID (ISO)": { start: 1251, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Return City": { start: 1254, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Return State Code": { start: 1284, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Return State  (Latin America/Caribbean Region)": { start: 1290, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Return Region ID": { start: 1310, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Return Country ID (ISO)": { start: 1313, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Renter Name": { start: 1316, length: 35, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Rental Days": { start: 1351, length: 2, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Rental Agreement Number": { start: 1353, length: 14, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Car Rental Days 2": { start: 1398, length: 4, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "ISO Merchant Category Code": { start: 1678, length: 4, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "DDA Number (Demand Deposit Account )": { start: 1682, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Banking Routing Number": { start: 1712, length: 22, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Funds Access Log Date": { start: 1734, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Funds Access Log Time": { start: 1744, length: 8, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Machine Number": { start: 1752, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Terminal Location": { start: 1762, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Cash Batch Number ": { start: 1802, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Supplier Reference Number": { start: 1813, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment (SE) Number": { start: 1828, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Chain Name": { start: 1838, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Brand Name": { start: 1868, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment ABN Number / Tax Company ID": { start: 1898, length: 16, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment  Name 1": { start: 1914, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Name 2": { start: 1954, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Address Line 1": { start: 1998, length: 38, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Address Line 2": { start: 2036, length: 38, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Address Line 3": { start: 2074, length: 38, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Address Line 4": { start: 2112, length: 38, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment City Name": { start: 2150, length: 38, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Region Code": { start: 2188, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment State/Province Code": { start: 2191, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Postal Code": { start: 2197, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Country Name": { start: 2212, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Country Code": { start: 2252, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Corporate Status Code": { start: 2255, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Purchase Card Code": { start: 2256, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Sales Tax Collected Flag ('Y' or 'N')": { start: 2258, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Client Registered Business Number": { start: 2269, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Client  Registered Business Name": { start: 2289, length: 35, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Amex Registered Business Number": { start: 2324, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Capture Center Code": { start: 2344, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Corporation ID": { start: 2347, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Tax Evaluation Date": { start: 2353, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Goods and Services Tax": { start: 2364, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Service Establishment Supply Tax Class": { start: 2379, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Bill Cycle Code": { start: 2394, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var cardExtratorConfig = {
                            "Record Type ": { start: 1, length: 1, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Basic Control Account Number": { start: 2, length: 19, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Basic Control Account Name": { start: 21, length: 40, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Account Number": { start: 61, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Last Name": { start: 81, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "First Name": { start: 111, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Middle Name": { start: 131, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Embossed Name": { start: 151, length: 30, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Account Type": { start: 181, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Status Code": { start: 187, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Orignal Card Member Number": { start: 189, length: 20, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Cancel Code": { start: 209, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Liability Code": { start: 212, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Corporation ID": { start: 215, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Primary ISO Currency Code": { start: 221, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Decimal Place Indicator - Primary Currency": { start: 224, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Secondary ISO Currency Code": { start: 225, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Decimal Place Indicator - Secondary Currency": { start: 228, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Neutral ISO Currency Code": { start: 229, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Decimal Place Indicator - Neutral Currency": { start: 232, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Debit Record Balance - Primary Currency": { start: 235, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 234, hasDecimalIndicator: true, whereIsDecimalIndicator: 224 },
                            "Debit Record Balance - Secondary Currency": { start: 250, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 234, hasDecimalIndicator: true, whereIsDecimalIndicator: 228 },
                            "Debit Record Balance - Neutral Currency": { start: 265, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 234, hasDecimalIndicator: true, whereIsDecimalIndicator: 232 },
                            "Card Member Debit Record Count": { start: 280, length: 8, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Credit Record Balance - Primary Currency": { start: 290, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 289, hasDecimalIndicator: true, whereIsDecimalIndicator: 224 },
                            "Credit Record Balance - Secondary Currency": { start: 305, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 289, hasDecimalIndicator: true, whereIsDecimalIndicator: 228 },
                            "Credit Record Balance - Neutral Currency": { start: 320, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 289, hasDecimalIndicator: true, whereIsDecimalIndicator: 232 },
                            "Card Member Credit Record Count ": { start: 335, length: 8, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Card Member Balance - Primary Currency": { start: 345, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 344, hasDecimalIndicator: true, whereIsDecimalIndicator: 224 },
                            "Card Member Balance - Secondary Currency": { start: 361, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 360, hasDecimalIndicator: true, whereIsDecimalIndicator: 228 },
                            "Card Member Balance - Neutral Currency": { start: 377, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 376, hasDecimalIndicator: true, whereIsDecimalIndicator: 232 },
                            "Card Member Total Record Count": { start: 392, length: 8, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "GST Amount Total": { start: 402, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 401, hasDecimalIndicator: true, whereIsDecimalIndicator: 224 },
                            "GST Amount Total - Neutral Currency": { start: 417, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 401, hasDecimalIndicator: true, whereIsDecimalIndicator: 232 },
                            "Previous Card Member Balance - Primary Currency": { start: 434, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 433, hasDecimalIndicator: true, whereIsDecimalIndicator: 224 },
                            "Previous Card Member Balance - Secondary Currency": { start: 450, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 449, hasDecimalIndicator: true, whereIsDecimalIndicator: 228 },
                            "Previous Card Member Balance - Neutral Currency": { start: 466, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 465, hasDecimalIndicator: true, whereIsDecimalIndicator: 232 },
                            "Accumulated Card Member Debits - Primary Currency": { start: 483, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 482, hasDecimalIndicator: true, whereIsDecimalIndicator: 224 },
                            "Accumulated Card Member Debits - Secondary Currency": { start: 498, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 482, hasDecimalIndicator: true, whereIsDecimalIndicator: 228 },
                            "Accumulated Card Member Debits - Neutral Currency": { start: 513, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 482, hasDecimalIndicator: true, whereIsDecimalIndicator: 232 },
                            "Accumulated Debit Record Count": { start: 528, length: 8, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Accumulated Card Member Credits - Primary Currency": { start: 538, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 537, hasDecimalIndicator: true, whereIsDecimalIndicator: 224 },
                            "Accumulated Card Member Credits - Secondary Currency": { start: 553, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 537, hasDecimalIndicator: true, whereIsDecimalIndicator: 228 },
                            "Accumulated Card Member Credits - Neutral Currency": { start: 568, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 537, hasDecimalIndicator: true, whereIsDecimalIndicator: 232 },
                            "Accumulated Credit Record Count": { start: 583, length: 8, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Dollar Balance Conversion Rate": { start: 592, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: true, whereIsDecimalIndicator: 607 },
                            "Dollar Balance Conversion Rate - Decimal Place Indicator": { start: 607, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Dollar Balance Conversion Amount": { start: 609, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 608, hasDecimalIndicator: true, whereIsDecimalIndicator: 624 },
                            "Dollar Balance Conversion Amount - Decimal Place Indicator": { start: 624, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Bill Cycle Code": { start: 625, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        var trailerExtratorConfig = {
                            "Record Type": { start: 1, length: 1, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Reporting Group": { start: 2, length: 15, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Recipient Number": { start: 17, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Report Prefix": { start: 28, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Report Number": { start: 30, length: 5, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Client Data File Version": { start: 36, length: 4, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File Frequency Delivery Indicator ": { start: 41, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Data File Create Date": { start: 44, length: 10, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Data File Julian Date": { start: 55, length: 5, justify: "Left", type: "date", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File (Layout) Version Number": { start: 61, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File Version Date": { start: 64, length: 10, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "File Type Indicator": { start: 75, length: 2, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Record Count": { start: 78, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Neutral ISO Currency Code": { start: 94, length: 3, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Neutral Currency - Decimal Place Indicator": { start: 97, length: 1, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: 97 },
                            "Total Daily Unbilled Amount - Neutral Currency": { start: 100, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 99, hasDecimalIndicator: true, whereIsDecimalIndicator: null },
                            "Total Card Member Balance - Neutral Currency": { start: 117, length: 15, justify: "Right", type: "decimal", hasSignIndicator: true, whereIsSign: 116, hasDecimalIndicator: true, whereIsDecimalIndicator: 97 },
                            "Data File Create Run Time": { start: 133, length: 6, justify: "Left", type: "string", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null },
                            "Total Transaction Count": { start: 139, length: 15, justify: "Right", type: "decimal", hasSignIndicator: false, whereIsSign: null, hasDecimalIndicator: false, whereIsDecimalIndicator: null }
                        };
                        //#endregion
                        var RecordType;
                        (function (RecordType) {
                            RecordType[RecordType["header"] = 0] = "header";
                            RecordType[RecordType["market"] = 8] = "market";
                            RecordType[RecordType["transaction"] = 1] = "transaction";
                            RecordType[RecordType["card"] = 2] = "card";
                            RecordType[RecordType["vPayment"] = 3] = "vPayment";
                            RecordType[RecordType["trailer"] = 9] = "trailer";
                        })(RecordType || (RecordType = {}));
                        function extractAll(indexOfFile, mapping) {
                            var contentLine = Attach.GetContentByLine(indexOfFile);
                            var transactionCount = 0;
                            var lineCount = 0;
                            while (contentLine !== "") {
                                lineCount++;
                                if (contentLine.length !== 3000) {
                                    var errorMessage = "Wrong line length at line ".concat(contentLine, " (expected 3000, got ").concat(contentLine.length, "!");
                                    Log.Error(errorMessage);
                                    var errorLineLengthKey = "_Wrong line length";
                                    throw new Parser.TransactionLineError(errorLineLengthKey, lineCount);
                                }
                                else {
                                    var recordType = parseInt(contentLine.substr(0, 1), 10);
                                    if (recordType === RecordType.header) {
                                        extractSpecificLine(contentLine, lineCount, headerExtractorConfig, mapping.headerMapping);
                                    }
                                    else if (recordType === RecordType.market) {
                                        extractSpecificLine(contentLine, lineCount, marketExtractorConfig, mapping.marketMapping, mapping.marketTable);
                                    }
                                    else if (recordType === RecordType.transaction) {
                                        transactionCount++;
                                        extractSpecificLine(contentLine, lineCount, transactionExtractorConfig, mapping.transactionMapping, mapping.transactionTable);
                                    }
                                    else if (recordType === RecordType.card) {
                                        extractSpecificLine(contentLine, lineCount, cardExtratorConfig, mapping.cardMapping, mapping.cardTable);
                                    }
                                    else if (recordType === RecordType.trailer) {
                                        extractSpecificLine(contentLine, lineCount, trailerExtratorConfig, mapping.trailerMapping);
                                    }
                                    else if (recordType === RecordType.vPayment) {
                                        Log.Warn("This line is a vPayment line and is not currently support");
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
                        function extractSpecificLine(line, lineNumber, extractorConfig, mapping, tableName) {
                            var itemOrData = Data;
                            if (tableName) {
                                itemOrData = Data.GetTable(tableName).AddItem();
                            }
                            for (var pair in extractorConfig) {
                                if (Object.prototype.hasOwnProperty.call(extractorConfig, pair)) {
                                    extract(line, lineNumber, pair, extractorConfig[pair], mapping, itemOrData);
                                }
                            }
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
                        var _parser = {
                            IsCompatible: function (indexOfFile) {
                                //A file is a ASCII GL1025 row file if on the first line we found GL1025 at a specific position
                                var content = Attach.GetContentByLine(indexOfFile);
                                var compatible = content && content.length >= 34 && content.substr(27, 6) === "GL1025";
                                Attach.ResetGetContentByBlock(indexOfFile);
                                return compatible;
                            },
                            RunParsing: function (indexOfFile) {
                                Log.Info("Using parser GL1025 ASCII");
                                var mapping = Lib.Expense.Transaction.Parser.GL1025.getMapping();
                                extractAll(indexOfFile, mapping);
                                return true;
                            }
                        };
                        function getParser() {
                            return _parser;
                        }
                        ASCII.getParser = getParser;
                    })(ASCII = GL1025.ASCII || (GL1025.ASCII = {}));
                })(GL1025 = Parser.GL1025 || (Parser.GL1025 = {}));
            })(Parser = Transaction.Parser || (Transaction.Parser = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
