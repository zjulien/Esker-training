/* LIB_DEFINITION{
  "name": "LIB_DD_XMLEXTRACTION_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Extraction from XML documents",
  "require": [
    "SYS/SYS_DD",
    "SYS/SYS_HELPERS_DATE",
    "Lib_DD_V12.0.461.0"
  ]
}*/
/**
 * @namespace Lib.DD.XMLExtraction
 */
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        var XMLExtraction;
        (function (XMLExtraction) {
            var settings = {
                namespaces: null,
                xmlToProcessAttachIndex: -1,
                xmlFileToProcess: null
            };
            function getXMLToProcessAttachIndex() {
                var nbAttach = Attach.GetNbAttach();
                if (nbAttach <= 0) {
                    return -1;
                }
                if (settings.xmlToProcessAttachIndex !== -1) {
                    return settings.xmlToProcessAttachIndex;
                }
                for (var i = 0; i < nbAttach; i++) {
                    var attach = Attach.GetAttach(i);
                    var attachVars = attach.GetVars();
                    if (attachVars.GetValue_String("XMLToProcess", 0) === "1") {
                        return i;
                    }
                }
                return -1;
            }
            function createXmlDoc() {
                var xmlFileToProcess = settings.xmlFileToProcess;
                if (!xmlFileToProcess) {
                    var attachIndex = getXMLToProcessAttachIndex();
                    if (attachIndex >= 0) {
                        xmlFileToProcess = Attach.GetInputFile(attachIndex);
                    }
                }
                if (xmlFileToProcess) {
                    var namespaces = settings.namespaces || Sys.DD.GetXmlNameSpaces(xmlFileToProcess.GetContent());
                    return namespaces ?
                        Process.CreateXMLDOMElement(xmlFileToProcess, namespaces) :
                        Process.CreateXMLDOMElement(xmlFileToProcess);
                }
                throw "XML attach to process not found";
            }
            function extract(rootNode, relativeXPath, transformFunction, aggregateFunction, alwaysTrim) {
                var value;
                var node;
                var callTransformFunction = function (currentValue) {
                    if (transformFunction) {
                        return transformFunction(currentValue);
                    }
                    return currentValue;
                };
                if (aggregateFunction) {
                    value = null;
                    var nodes = rootNode.selectNodes(relativeXPath);
                    for (var iNode = 0; iNode < nodes.length; iNode++) {
                        node = nodes.item(iNode);
                        var nodeValue = null;
                        if (node) {
                            nodeValue = node.text;
                            if (alwaysTrim) {
                                nodeValue = nodeValue.trim();
                            }
                        }
                        nodeValue = callTransformFunction(nodeValue);
                        value = iNode === 0 ? nodeValue : aggregateFunction(value, nodeValue);
                    }
                }
                else {
                    node = rootNode.selectSingleNode(relativeXPath);
                    value = null;
                    if (node) {
                        value = node.text;
                        if (this.alwaysTrim) {
                            value = value.trim();
                        }
                    }
                    value = callTransformFunction(value);
                }
                return value;
            }
            /**
             * @lends Lib.DD.XMLExtraction
             */
            XMLExtraction.xmlDoc = null;
            /**
             * Allows to enable/disable the trimming of all extracted values. Default: `true`
             */
            XMLExtraction.alwaysTrim = true;
            function ShortStringToDate(dateString) {
                return dateString ?
                    Sys.Helpers.Date.ShortDateStringToDate(dateString) :
                    null;
            }
            XMLExtraction.ShortStringToDate = ShortStringToDate;
            function ISOStringToDate(dateString) {
                return dateString ?
                    Sys.Helpers.Date.ISOSTringToDateEx(dateString) :
                    null;
            }
            XMLExtraction.ISOStringToDate = ISOStringToDate;
            /**
             * Builtin transform function used to convert an extracted values to a `Date`
             * The supported formats are: `YYYY-MM-DD hh:mm:ss`, `YYYY/MM/DD hh:mm:ss`, `YYYY-MM-DD`, `YYYYMMDD`
             * @param {string} dateString string to be converted to `Date`
             * @returns {Date|null}
             */
            function StringToDate(dateString) {
                return (dateString && dateString.length === 8) ?
                    this.ShortStringToDate(dateString) :
                    this.ISOStringToDate(dateString);
            }
            XMLExtraction.StringToDate = StringToDate;
            /**
             * Builtin transform function used to convert an extracted values to a `number`
             * @param {string} decimalString string to be converted to `number`
             * @returns {number|null}
             */
            function StringToDecimal(decimalString) {
                return decimalString !== null ?
                    parseFloat(decimalString) :
                    null;
            }
            XMLExtraction.StringToDecimal = StringToDecimal;
            /**
             * Builtin helper which builds a transform function used map extracted values
             * @param {object} map javascript object (JSON) which will be used as map
             * @returns {function}
             */
            function Map(map) {
                return function (key) {
                    if (map.hasOwnProperty(key)) {
                        return map[key];
                    }
                    return key;
                };
            }
            XMLExtraction.Map = Map;
            /**
             * Checks if current process has an XML `Attach` that should be extracted. (the `Attach` has a variable `XMLToProcess` set to `1`)
             * @returns {boolean}
             */
            function HasXMLToProcessAttach() {
                return getXMLToProcessAttachIndex() >= 0;
            }
            XMLExtraction.HasXMLToProcessAttach = HasXMLToProcessAttach;
            /**
             * @param {string} xPath XPath matching the XML node (element or attribute) to extract
             * @param {string?} fieldName process field name to be set. If `null` no fileld will be set
             * @param {function?} transformFunction function used to convert the extracted value. If `null` no conversion will be done
             * @param {function?} aggregateFunction if multiple nodes match the XPath it's used to aggregates the values. If `null` no conversion will be done
             * @returns {object} extracted value
             */
            function Extract(xPath, fieldName, transformFunction, aggregateFunction) {
                this.xmlDoc = this.xmlDoc || createXmlDoc();
                var value = extract(this.xmlDoc, xPath, transformFunction, aggregateFunction, this.alwaysTrim);
                if (fieldName && value !== null) {
                    Data.SetValue(fieldName, value);
                }
                return value;
            }
            XMLExtraction.Extract = Extract;
            /**
             * @param {string} linesXPath XPath matching multiple XML nodes to extract
             * @param {string} tableName process table name to be filled
             * @param {function} lineCallback function witch will be called for each line, with two parameters: a function to be used to extract a cell (extractCell)
             * 			value and the corresponding table item. The "extractCell" function takes the same parameters as the Extract function :
             * 			(xPath, fieldName, transformFunction, aggregateFunction). The xPath sould be relative to `linesXPath`
             */
            function ExtractTable(linesXPath, tableName, lineCallback) {
                var table = Data.GetTable(tableName);
                if (table) {
                    var xmlLines = this.xmlDoc.selectNodes(linesXPath);
                    var xmlLine;
                    var tableItem;
                    var callback = function (relativeXPath, columnName, transformFunction, aggregateFunction) {
                        var value = extract(xmlLine, relativeXPath, transformFunction, aggregateFunction, this.alwaysTrim);
                        if (columnName && value !== null) {
                            tableItem.SetValue(columnName, value);
                        }
                        return value;
                    };
                    for (var iLine = 0; iLine < xmlLines.length; iLine++) {
                        xmlLine = xmlLines.item(iLine);
                        if (table.GetItemCount() <= iLine) {
                            table.AddItem(false);
                        }
                        tableItem = table.GetItem(iLine);
                        lineCallback(callback, tableItem, xmlLine);
                    }
                }
                else {
                    Log.Warn("ExtractTable : Table'" + tableName + "' was not found in Data");
                }
            }
            XMLExtraction.ExtractTable = ExtractTable;
            /**
            * Allows to specify the Objkectof the XML to process in the attachments list.
            * @param {File} xmlFile File Object of the Xml to Process
            */
            function SetXMLFileToProcess(xmlFile) {
                settings.xmlFileToProcess = xmlFile;
                this.xmlDoc = null;
            }
            XMLExtraction.SetXMLFileToProcess = SetXMLFileToProcess;
        })(XMLExtraction = DD.XMLExtraction || (DD.XMLExtraction = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
