///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_UnpaidInvoices_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Custom library to change behavior of Lib_AP_UnpaidInvoices",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Sys/Sys_Helpers_CSVReader"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var UnpaidInvoices;
        (function (UnpaidInvoices) {
            var debug = false;
            var outputSplitSeparator = ";";
            // warning: crlf is not supported (known issue between eskjscript and cdconn)
            var outputReturnSeparator = "\n";
            var csvReaderHelper = null;
            // Processing options
            var groupingColumnIndex;
            var defaultCSVFilename;
            var headerForNewFile;
            var numberOfCSVLinesPerLoop;
            var temporaryFiles = {};
            // Variables used to manage the state of the export
            var currentExportState;
            var NOT_FINISHED = 0;
            var ALL_INVOICE_PROCESSED = 1;
            function outputLog(msg) {
                if (debug) {
                    Log.Info(msg);
                }
            }
            // TemporaryFile management
            function createNewTemporaryFile(csvFileName) {
                var tempFile = TemporaryFile.CreateFile("csv", "UTF8");
                temporaryFiles[csvFileName] = tempFile;
                // Add header line
                TemporaryFile.Append(tempFile, headerForNewFile);
                return tempFile;
            }
            function getTempFileFromFileName(groupingValue) {
                outputLog("->getTempFileFromFileName: " + groupingValue);
                if (!groupingValue) {
                    return null;
                }
                if (!Object.prototype.hasOwnProperty.call(temporaryFiles, groupingValue)) {
                    temporaryFiles[groupingValue] = createNewTemporaryFile(groupingValue);
                }
                return temporaryFiles[groupingValue];
            }
            function writeLineArrayToCSV(lineArray, csvFileName) {
                var file = getTempFileFromFileName(csvFileName);
                var line = outputReturnSeparator;
                for (var i = 0; i < lineArray.length; i++) {
                    if (line.length > outputReturnSeparator.length) {
                        line += outputSplitSeparator;
                    }
                    line += lineArray[i];
                }
                TemporaryFile.Append(file, line);
            }
            // CSV Helper
            function createCSVReaderHelper(attachIndex) {
                if (csvReaderHelper) {
                    return csvReaderHelper;
                }
                if (!Variable.GetValueAsString(Sys.Helpers.CSVReader.GetSerializeIdentifier())) {
                    csvReaderHelper = Sys.Helpers.CSVReader.CreateInstance(attachIndex, "V2");
                    // Scheduled reports uses crlf but Attach.GetContent returns lf (known issue between eskjscript and cdconn)
                    csvReaderHelper.ReturnSeparator = "\n";
                    csvReaderHelper.GuessSeparator();
                }
                else {
                    csvReaderHelper = Sys.Helpers.CSVReader.ReloadInstance("V2");
                }
                return csvReaderHelper;
            }
            /**
             * Check if the attachment is in a valid format
             * @param {Number} attachIndex The index of the attachment to verify
             * @returns {Boolean} true is the first attachment is a CSV file
             */
            function isAttachValid(attachIndex) {
                if (attachIndex >= Attach.GetNbAttach()) {
                    Log.Error("Invalid attach index");
                    return false;
                }
                var attachExtension = Attach.GetExtension(attachIndex);
                if (attachExtension && attachExtension.toLowerCase() !== ".csv") {
                    Log.Error("Expect csv extension");
                    return false;
                }
                var readerHelper = createCSVReaderHelper(attachIndex);
                if (readerHelper.GetHeadersObject().length <= groupingColumnIndex) {
                    Log.Error("The grouping column (index ".concat(groupingColumnIndex, ") is missing"));
                    return false;
                }
                return true;
            }
            // Split the attach file on a column index
            function splitAttachByGroupingColumn(attachIndex) {
                outputLog("->splitAttachByGroupingColumn");
                var readerHelper = createCSVReaderHelper(attachIndex);
                setHeaderForNewFileFromLineObject(readerHelper.GetHeadersObject());
                var line;
                do {
                    line = readerHelper.GetNextLine();
                    if (line) {
                        var lineArray = readerHelper.GetCurrentLineArray();
                        if (lineArray) {
                            writeLineArrayToCSV(lineArray, lineArray[groupingColumnIndex]);
                        }
                    }
                } while (line || line === "");
                outputLog("splitAttachByGroupingColumn->");
            }
            function setHeaderForNewFileFromLineObject(csvHeaders) {
                for (var i = 0; i < csvHeaders.length; i++) {
                    if (headerForNewFile.length > 0) {
                        headerForNewFile += outputSplitSeparator;
                    }
                    headerForNewFile += csvHeaders[i];
                }
            }
            // Get data from Query to generate CSV file
            function generateCSVByQuery(attachIndex) {
                var msnExArray = getMsnExFromCsv(attachIndex);
                var dataToExport = msnExArray && msnExArray.length > 0;
                if (dataToExport) {
                    queryAndCreateCSVFile(msnExArray);
                }
                return dataToExport;
            }
            function getMsnExFromCsv(attachIndex, firstOnly) {
                var msnExArray = [];
                var readerHelper = createCSVReaderHelper(attachIndex);
                var msnexIndex = readerHelper.GetHeadersObject().length - 1;
                function addNextMsnEx() {
                    var line = readerHelper.GetNextLine();
                    if (line) {
                        var lineArray = readerHelper.GetCurrentLineArray();
                        if (lineArray) {
                            msnExArray.push(lineArray[msnexIndex]);
                        }
                    }
                    return line !== null;
                }
                var found = addNextMsnEx();
                if (!firstOnly) {
                    while (found && readerHelper.GetCurrentLineNumber() % numberOfCSVLinesPerLoop !== 0) {
                        found = addNextMsnEx();
                    }
                    currentExportState = found ? NOT_FINISHED : ALL_INVOICE_PROCESSED;
                }
                return msnExArray;
            }
            function getQueryFilter(msnExArray) {
                //Expected filter : (|(MSNEX=123)(MSNEX=456)(MSNEX=789))
                var filter = [];
                if (msnExArray.length > 1) {
                    filter.push("(|");
                }
                for (var i = 0; i < msnExArray.length; i++) {
                    filter.push("(MSNEX=".concat(msnExArray[i], ")"));
                }
                if (msnExArray.length > 1) {
                    filter.push(")");
                }
                outputLog(filter.join(""));
                return filter.join("");
            }
            function queryAndCreateCSVFile(msnExArray) {
                outputLog("->queryAndCreateCSVFile");
                var query = Process.CreateQueryAsProcessAdmin();
                query.Reset();
                var attributes = ["RuidEx", "ERPInvoiceNumber__", "CompanyCode__", "VendorNumber__", "InvoiceNumber__", "InvoiceType__"];
                headerForNewFile = ["RUID", "ERPID", "Company code", "Vendor number", "Invoice number", "Invoice type"].join(outputSplitSeparator);
                query.SetAttributesList("RuidEx,ERPInvoiceNumber__,CompanyCode__,VendorNumber__,InvoiceNumber__,InvoiceType__");
                query.SetSpecificTable("CDNAME#Vendor invoice");
                query.SetSearchInArchive(true);
                query.SetFilter(getQueryFilter(msnExArray));
                try {
                    if (query.MoveFirst()) {
                        loopOnQueryResult(query, attributes);
                    }
                    else {
                        Log.Error("Cannot read query result");
                    }
                }
                catch (e) {
                    Log.Error("An exception occured : " + e);
                }
                outputLog("queryAndCreateCSVFile->");
            }
            function loopOnQueryResult(query, attributes) {
                var transport = query.MoveNext();
                while (transport) {
                    var vars = transport.GetUninheritedVars();
                    var line = [];
                    for (var i = 0; i < attributes.length; i++) {
                        line.push(vars.GetValue_String(attributes[i], 0));
                    }
                    writeLineArrayToCSV(line, defaultCSVFilename);
                    transport = query.MoveNext();
                }
            }
            // Copy file to SFTP management
            function getSFTPTransport(fileName) {
                var transport = Process.CreateTransport("Copy");
                var vars = transport.GetUninheritedVars();
                vars.AddValue_String("CopyPath", "SFTP2", true);
                vars.AddValue_String("CopyFileName", "invoices\\Out_UnpaidInvoices\\" + fileName, true);
                return transport;
            }
            function copyTempFilesToSFTP() {
                for (var groupingValue in temporaryFiles) {
                    if (Object.prototype.hasOwnProperty.call(temporaryFiles, groupingValue)) {
                        var fileName = "".concat(groupingValue, "_").concat(Date.now(), ".csv");
                        var transport = getSFTPTransport(fileName);
                        transport.AddAttachEx(temporaryFiles[groupingValue]);
                        transport.Process();
                        TemporaryFile.Delete(temporaryFiles[groupingValue]);
                    }
                }
                temporaryFiles = {};
            }
            function copyAttachToSFTP(attachIndex) {
                var fileName = "".concat(defaultCSVFilename, "_").concat(Date.now(), ".csv");
                var transport = getSFTPTransport(fileName);
                transport.AddAttachEx(Attach.GetInputFile(attachIndex));
                transport.Process();
            }
            // Main functions
            function init() {
                csvReaderHelper = null;
                headerForNewFile = "";
                temporaryFiles = {};
                numberOfCSVLinesPerLoop = Variable.GetValueAsString("NumberOfCSVLinesPerLoop");
                if (!numberOfCSVLinesPerLoop) {
                    numberOfCSVLinesPerLoop = 500;
                }
                defaultCSVFilename = "UnpaidInvoices";
                groupingColumnIndex = -1;
                currentExportState = NOT_FINISHED;
            }
            function validateCSV() {
                var attachIndex = 0;
                var error = "";
                if (Attach.GetNbAttach() <= 0) {
                    error = "Missing CSV file";
                }
                else if (groupingColumnIndex !== -1 && !isAttachValid(attachIndex)) {
                    error = "Invalid CSV file";
                }
                if (error) {
                    Log.Error(error);
                    Process.Exit(200);
                    return false;
                }
                return true;
            }
            function exportAttachToSFTP() {
                init();
                if (validateCSV()) {
                    copyAttachToSFTP(0);
                }
                return ALL_INVOICE_PROCESSED;
            }
            UnpaidInvoices.exportAttachToSFTP = exportAttachToSFTP;
            function groupAndExportToSFTP(groupingColumn) {
                init();
                if (groupingColumn && groupingColumn >= 0) {
                    groupingColumnIndex = groupingColumn;
                }
                if (validateCSV()) {
                    splitAttachByGroupingColumn(0);
                    copyTempFilesToSFTP();
                }
                return ALL_INVOICE_PROCESSED;
            }
            UnpaidInvoices.groupAndExportToSFTP = groupAndExportToSFTP;
            function exportFromQuery() {
                init();
                if (validateCSV()) {
                    var dataToExport = generateCSVByQuery(0);
                    if (dataToExport) {
                        copyTempFilesToSFTP();
                        if (currentExportState === NOT_FINISHED) {
                            csvReaderHelper.SerializeCurrentState();
                        }
                    }
                }
                return currentExportState;
            }
            UnpaidInvoices.exportFromQuery = exportFromQuery;
            function getFirstMsnEx() {
                if (isAttachValid(0)) {
                    var msnexArr = getMsnExFromCsv(0, true);
                    if (msnexArr) {
                        return msnexArr[0];
                    }
                }
                return null;
            }
            UnpaidInvoices.getFirstMsnEx = getFirstMsnEx;
        })(UnpaidInvoices = AP.UnpaidInvoices || (AP.UnpaidInvoices = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
