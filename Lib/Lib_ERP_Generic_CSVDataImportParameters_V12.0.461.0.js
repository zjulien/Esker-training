/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "Lib_ERP_Generic_CSVDataImportParameters_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "CSVDataImportParameters document for generic ERP - system library",
  "require": [
    "Lib_ERP_CSVDataImportParameters_V12.0.461.0",
    "Lib_ERP_Generic_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Generic;
        (function (Generic) {
            var CSVDataImportParameters = /** @class */ (function (_super) {
                __extends(CSVDataImportParameters, _super);
                function CSVDataImportParameters(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.Parameters = {};
                    return _this;
                }
                //////////////////////////////////////////
                // Overrides Lib.ERP.CSVDataImportParameters interface
                //////////////////////////////////////////
                CSVDataImportParameters.prototype.GetJSON = function () {
                    return this.Parameters;
                };
                return CSVDataImportParameters;
            }(Lib.ERP.CSVDataImportParameters.Instance));
            Generic.CSVDataImportParameters = CSVDataImportParameters;
        })(Generic = ERP.Generic || (ERP.Generic = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.Generic.Manager.documentFactories[Lib.ERP.CSVDataImportParameters.docType] = function (manager) {
    return new Lib.ERP.Generic.CSVDataImportParameters(manager);
};
