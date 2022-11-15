/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "Lib_AP_MAPPING_JSON_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Lib_AP_Mapping_V12.0.461.0",
    "Lib_AP_Mapping_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
        * Mapper for an input JSON file to a Vendor Invoice form.
        * You can create your own mapper for a specific input file format.
        * Your mapper must extend the InvoiceDocument class (See {@link Lib.AP.Mapping.InvoiceDocument}), and register itself by calling <code>Lib.AP.MappingManager.Register(MyMapper);</code>.
        * Your custom mapper must be included by the Vendor Invoice process or by a library loaded by the Vendor Invoice process (Lib_AP_Customisation_Extraction for example)
        * @namespace Lib.AP.Mapping
        * @see {@link Lib.AP.MappingManager}
        * @see {@link Lib.AP.Mapping.InvoiceDocument}
        **/
        var Mapping;
        (function (Mapping) {
            /**
            * Represents an invoice document. The invoice data are extracted from the given input JSON document (an JSON object)
            * @class
            * @param {JSON} jsonContent An input JSON object
            * @memberof Lib.AP.Mapping
            **/
            var JSONInvoiceDocument = /** @class */ (function (_super) {
                __extends(JSONInvoiceDocument, _super);
                function JSONInvoiceDocument(jsonContent) {
                    var _this = _super.call(this) || this;
                    _this.isTechnical = true;
                    _this.jsonContent = jsonContent;
                    return _this;
                }
                /**
                * Extracts the data from the input file and fills the internal objects
                * @method
                **/
                JSONInvoiceDocument.prototype.Run = function () {
                    if (this.alreadyParsed === false) {
                        this.attachmentInformations = this.jsonContent.Attachment;
                        this.jsonDoc = this.jsonContent;
                        this.alreadyParsed = true;
                    }
                };
                JSONInvoiceDocument.prototype.GetGlLines = function () {
                    return this.jsonDoc.tables.LineItems;
                };
                JSONInvoiceDocument.prototype.GetReceptionMethod = function () {
                    return this.jsonDoc.header.ReceptionMethod;
                };
                JSONInvoiceDocument.prototype.GetSourceDocument = function () {
                    return this.jsonDoc.header.SourceDocument;
                };
                JSONInvoiceDocument.prototype.GetCalculateTax = function () {
                    return this.jsonDoc.header.CalculateTax;
                };
                JSONInvoiceDocument.prototype.IsProcessDocumentTechnical = function () {
                    return this.isTechnical;
                };
                JSONInvoiceDocument.prototype.toJson = function () {
                    if (this.alreadyParsed) {
                        return this.jsonDoc;
                    }
                    return {
                        error: "toJson shouldn't be called before run"
                    };
                };
                return JSONInvoiceDocument;
            }(Mapping.InvoiceDocument));
            Mapping.JSONInvoiceDocument = JSONInvoiceDocument;
            /** @lends Lib.AP.MappingJSON */
            var JSONMapper = /** @class */ (function (_super) {
                __extends(JSONMapper, _super);
                function JSONMapper() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                /**
                * Check if an input file is supported by this mapper
                * @param {string} fileContent String containing the content of the input file
                * @returns {boolean} True if the input file is supported by this mapper, false otherwise
                **/
                JSONMapper.prototype.IsMyType = function (fileContent) {
                    try {
                        var jsonContent = JSON.parse(fileContent);
                        return !jsonContent.IsFromExpense;
                    }
                    catch (e) {
                        return false;
                    }
                };
                /**
                * Returns an JSONInvoiceDocument object referencing the input file
                * @param {File} inputFile File object of the input file
                * @returns {Lib.AP.MappingJSON.JSONInvoiceDocument} An JSONInvoiceDocument referencing the input file.
                **/
                JSONMapper.prototype.GetNewDocument = function (inputFile) {
                    try {
                        var jsonContent = JSON.parse(inputFile.GetContent());
                        return new JSONInvoiceDocument(jsonContent);
                    }
                    catch (e) {
                        Log.Error("Failed to parse JSON file: " + e);
                    }
                    return null;
                };
                return JSONMapper;
            }(Mapping.Mapper));
            Mapping.JSONMapper = JSONMapper;
            Lib.AP.MappingManager.Register(new JSONMapper());
        })(Mapping = AP.Mapping || (AP.Mapping = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
