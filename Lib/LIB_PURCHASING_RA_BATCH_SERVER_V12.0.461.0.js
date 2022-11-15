///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_RA_Batch_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Remittance Advice Batch library",
  "require": [
    "Sys/Sys_Helpers_Date",
    "[Lib_P2P_Customization_Common]",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_CSVReader",
    "Sys/Sys_GenericAPI_Server",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_TimeoutHelper"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var RA;
        (function (RA) {
            var Batch;
            (function (Batch) {
                function GetCSVReader() {
                    Log.Info("Get the input CSV reader");
                    // Read the first attachment "0" with the reader V2
                    var csvReader = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                    csvReader.ReturnSeparator = "\n";
                    // read first line (Header line) and guess the separator
                    csvReader.GuessSeparator();
                    // Check key here
                    csvReader.InvoiceNumberIdx = csvReader.GetHeaderIndex("Invoice Number");
                    if (csvReader.InvoiceNumberIdx < 0) {
                        csvReader.Error = {
                            CSVLine: csvReader.GetCurrentLineArray().toString(),
                            LineNumber: 1,
                            ErrorStatus: "_Missing key column Invoice Number"
                        };
                    }
                    return csvReader;
                }
                Batch.GetCSVReader = GetCSVReader;
                function PrepareImportJson() {
                    Log.Info("Build JSON from CSV");
                    var csvReader = GetCSVReader();
                    var line = csvReader.GetNextLine();
                    var lineCount = 0;
                    var items = {};
                    var itemsInError = [];
                    var PaymentCreated = [];
                    if (csvReader.Error) {
                        itemsInError.push(csvReader.Error);
                    }
                    while (line !== null) {
                        var lineObject = csvReader.GetCurrentLineObject();
                        if (lineObject) {
                            var keyArray = [lineObject["Invoice Number"], lineObject["Supplier Name"], lineObject["Supplier Id"], lineObject["Payment Id"]];
                            var key = keyArray.join("-");
                            var PaymentId = lineObject["Payment Id"];
                            Log.Info("Processing CSV line: " + key);
                            if (items[key]) {
                                Log.Warn("Item " + key + " found twice in the CSV, skipping");
                                var csvError = {
                                    LineNumber: lineCount + 1,
                                    CSVLine: csvReader.GetCurrentLineArray().toString(),
                                    ErrorStatus: "_Duplicate line"
                                };
                                itemsInError.push(csvError);
                            }
                            else if (Sys.Helpers.IsEmpty(lineObject["Invoice Number"])) {
                                Log.Warn("Item " + key + " is missing key value Invoice Number");
                                var csvError = {
                                    LineNumber: lineCount + 1,
                                    CSVLine: csvReader.GetCurrentLineArray().toString(),
                                    ErrorStatus: "_Invoice Number required"
                                };
                                itemsInError.push(csvError);
                            }
                            else if (Sys.Helpers.IsEmpty(lineObject["Invoice Amount"])) {
                                Log.Warn("Item " + key + " is missing key value Invoice Amount");
                                var csvError = {
                                    LineNumber: lineCount + 1,
                                    CSVLine: csvReader.GetCurrentLineArray().toString(),
                                    ErrorStatus: "_Invoice Number required"
                                };
                                itemsInError.push(csvError);
                            }
                            else if (Sys.Helpers.IsEmpty(lineObject["Total Net Amount"])) {
                                Log.Warn("Item " + key + " is missing key value Total Net Amount");
                                var csvError = {
                                    LineNumber: lineCount + 1,
                                    CSVLine: csvReader.GetCurrentLineArray().toString(),
                                    ErrorStatus: "_Total Net Amount required"
                                };
                                itemsInError.push(csvError);
                            }
                            else if (Sys.Helpers.IsEmpty(lineObject["Payment Id"])) {
                                Log.Warn("Item " + key + " is missing key value Payment Id");
                                var csvError = {
                                    LineNumber: lineCount + 1,
                                    CSVLine: csvReader.GetCurrentLineArray().toString(),
                                    ErrorStatus: "_Payment Id required"
                                };
                                itemsInError.push(csvError);
                            }
                            else {
                                var InvoicesToAdd = PaymentCreated.indexOf(PaymentId) != -1 ? items[PaymentId].ExtractedData.Invoices : [];
                                var invoicesData = {
                                    InvoiceNumber: lineObject["Invoice Number"],
                                    DocumentNumber: lineObject["Document Number"],
                                    InvoiceDate: lineObject["Invoice Date"],
                                    NetAmount: parseInt(lineObject["Invoice Amount"], 10)
                                };
                                InvoicesToAdd.push(invoicesData);
                                items[PaymentId] = {
                                    ExtractedData: {
                                        PayerCompanyCode: lineObject["Company Code"],
                                        PayerCompany: "PayerCompany",
                                        PayerAddress: "PayerAdress",
                                        PaymentId: parseInt(PaymentId, 10),
                                        VendorCompanyCode: lineObject["Vendor Company Code"],
                                        VendorName: lineObject["Vendor Name"],
                                        VendorId: lineObject["Vendor Id"],
                                        PaymentDate: lineObject["Payment Date"],
                                        TotalNetAmount: parseInt(lineObject["Total Net Amount"], 10),
                                        PaymentMethodDescription: lineObject["Payment Method"],
                                        PaymentMethodCode: lineObject["Payment Method Code"],
                                        Currency: lineObject["Currency"],
                                        Invoices: InvoicesToAdd
                                    }
                                };
                                PaymentCreated.push(PaymentId);
                            }
                            lineCount++;
                        }
                        line = csvReader.GetNextLine();
                    }
                    var temp = JSON.stringify(items);
                    Log.Info(temp);
                    Log.Info(lineCount + " lines parsed");
                    return Sys.Helpers.Promise.Resolve(items);
                }
                Batch.PrepareImportJson = PrepareImportJson;
            })(Batch = RA.Batch || (RA.Batch = {}));
        })(RA = Purchasing.RA || (Purchasing.RA = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
