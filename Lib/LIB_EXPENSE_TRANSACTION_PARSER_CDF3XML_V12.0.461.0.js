///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_TRANSACTION_PARSER_CDF3XML_V12.0.461.0",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Expense Transaction parser for CDF3 XML raw file server library",
  "require": [
    "Sys/Sys_Helpers_XMLExtraction",
    "Lib_Expense_Transaction_Parser_CDF3_Mapping_V12.0.461.0"
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
                var CDF3XML;
                (function (CDF3XML) {
                    function extractAll(indexOfcXMLFile) {
                        var mapping = Lib.Expense.Transaction.Parser.CDF3.getMapping();
                        var xmlFile = Attach.GetConvertedFile(indexOfcXMLFile);
                        Sys.Helpers.XMLExtraction.SetXMLFileToProcess(xmlFile);
                        mapping.transactionTable.forEach(function (table) {
                            Sys.Helpers.XMLExtraction.ExtractTable(table.XPath, table.Field, function (extractCell) {
                                table.XPathCells.forEach(function (cell) {
                                    extractCell(cell.XPath, cell.Field, cell.Transform, cell.AggregateFunction);
                                });
                            });
                        });
                        var transactionCount = Data.GetTable("LineTransaction__").GetItemCount();
                        if (transactionCount === 0) {
                            var warnNoLineMessage = "File does not contain any transaction";
                            Log.Warn(warnNoLineMessage);
                        }
                        Log.Info("".concat(transactionCount, " transaction lines where extracted"));
                    }
                    CDF3XML.extractAll = extractAll;
                    var _parser = {
                        IsCompatible: function (indexOfFile) {
                            //A file is a CDF3 XML raw file if on the first line we found CDF3 as a source format
                            var inboundSourceFormat = Attach.GetValueFromXPath(indexOfFile, "/CDFTransmissionFile/TransmissionHeader_1000/InboundSourceFormat");
                            return inboundSourceFormat === "CDF3";
                        },
                        RunParsing: function (indexOfFile) {
                            Log.Info("Using parser CDF3 XML for file " + indexOfFile);
                            //Extract field values using CDF3 mapping
                            extractAll(indexOfFile);
                            return true;
                        }
                    };
                    function getParser() {
                        return _parser;
                    }
                    CDF3XML.getParser = getParser;
                })(CDF3XML = Parser.CDF3XML || (Parser.CDF3XML = {}));
            })(Parser = Transaction.Parser || (Transaction.Parser = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
