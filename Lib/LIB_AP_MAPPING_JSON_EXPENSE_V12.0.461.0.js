/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_AP_MAPPING_JSON_EXPENSE_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Lib_AP_Mapping_V12.0.461.0",
    "Lib_AP_Mapping_JSON_V12.0.461.0",
    "Lib_AP_Mapping_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
         * Mapper for an input Expense JSON file to a Vendor Invoice form.
         * You can create your own mapper for a specific input file format.
         * Your mapper must extend the InvoiceDocument class (See {@link Lib.AP.Mapping.InvoiceDocument}), and register itself by calling <code>Lib.AP.MappingManager.Register(MyMapper);</code>.
         * @namespace Lib.Expense.Mapping
         * @see {@link Lib.AP.MappingManager}
         * @see {@link Lib.AP.Mapping.InvoiceDocument}
         * @see {@link Lib.AP.Mapping.JSONInvoiceDocument}
         **/
        var Mapping;
        (function (Mapping) {
            /** @lends Lib.AP.MappingJSONExpense */
            var ExpenseJSONMapper = /** @class */ (function (_super) {
                __extends(ExpenseJSONMapper, _super);
                function ExpenseJSONMapper() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.SourceDocucmentLabel = "_ExpenseSourceDocumentLabel";
                    return _this;
                }
                /**
                 * Check if an input file is supported by this mapper
                 * @param {string} fileContent String containing the content of the input file
                 * @returns {boolean} True if the input file is supported by this mapper, false otherwise
                 **/
                ExpenseJSONMapper.prototype.IsMyType = function (fileContent) {
                    try {
                        if (fileContent === "Claims") {
                            return true;
                        }
                        var jsonContent = JSON.parse(fileContent);
                        return !!jsonContent.IsFromExpense;
                    }
                    catch (e) {
                        return false;
                    }
                };
                /** @this OnSourceDocucmentClick */
                ExpenseJSONMapper.prototype.OnSourceDocucmentClick = function () {
                    var callbackSearchPR = function () {
                        // eslint-disable-next-line no-invalid-this
                        var queryValue = this.GetQueryValue();
                        if (queryValue.Records && queryValue.Records.length > 0) {
                            Process.OpenLink(queryValue.Records[0][1] + "&OnQuit=Close");
                        }
                        else {
                            Sys.Helpers.Globals.Popup.Alert("_ExpenseReport not found or access denied", false, null, "_ExpenseReport not found title");
                        }
                    };
                    var attributes = "MsnEx|ValidationURL";
                    var filter = "ExpenseReportNumber__=" + this.GetValue();
                    Query.DBQuery(callbackSearchPR, "CDNAME#Expense Report", attributes, filter, "", 1);
                };
                /**
                 * Returns an InvoiceDocument object referencing the input file
                 * @param {File} inputFile File object of the input file
                 * @returns {Lib.AP.Mapping.JSONInvoiceDocument} An InvoiceDocument referencing the input file.
                 **/
                ExpenseJSONMapper.prototype.GetNewDocument = function (inputFile) {
                    try {
                        var jsonContent = JSON.parse(inputFile.GetContent());
                        return new Mapping.JSONInvoiceDocument(jsonContent);
                    }
                    catch (e) {
                        Log.Error("Failed to parse JSON file: " + e);
                    }
                    return null;
                };
                return ExpenseJSONMapper;
            }(Mapping.Mapper));
            Mapping.ExpenseJSONMapper = ExpenseJSONMapper;
            Lib.AP.MappingManager.Register(new ExpenseJSONMapper());
        })(Mapping = AP.Mapping || (AP.Mapping = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
