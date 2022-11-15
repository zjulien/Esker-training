/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "Lib_ERP_CSVDataImportParameters_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base CSVDataImportParameters document for ERP - system library",
  "require": [
    "Lib_ERP_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var CSVDataImportParameters;
        (function (CSVDataImportParameters) {
            CSVDataImportParameters.docType = "CSV_DATA_IMPORT_PARAMETERS";
            CSVDataImportParameters.defaultDefinition = {};
            var Instance = /** @class */ (function (_super) {
                __extends(Instance, _super);
                function Instance(manager) {
                    var _this = _super.call(this) || this;
                    _this.manager = manager;
                    return _this;
                }
                return Instance;
            }(Lib.ERP.Manager.Document));
            CSVDataImportParameters.Instance = Instance;
        })(CSVDataImportParameters = ERP.CSVDataImportParameters || (ERP.CSVDataImportParameters = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
