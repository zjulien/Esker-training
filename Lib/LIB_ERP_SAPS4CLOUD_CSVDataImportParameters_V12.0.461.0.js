/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "Lib_ERP_SAPS4CLOUD_CSVDataImportParameters_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "CSVDataImportParameters document for SAPS4CLOUD ERP - system library",
  "require": [
    "Lib_ERP_CSVDataImportParameters_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAPS4CLOUD;
        (function (SAPS4CLOUD) {
            var CSVDataImportParameters = /** @class */ (function (_super) {
                __extends(CSVDataImportParameters, _super);
                function CSVDataImportParameters(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.Parameters = {
                        Mapping: {
                        // TODO : add SAPS4CLOUD specific mapping files
                        //"Vendors": "mapping_Vendors__.xml"
                        }
                    };
                    return _this;
                }
                CSVDataImportParameters.prototype.GetJSON = function () {
                    return this.Parameters;
                };
                return CSVDataImportParameters;
            }(Lib.ERP.CSVDataImportParameters.Instance));
            SAPS4CLOUD.CSVDataImportParameters = CSVDataImportParameters;
        })(SAPS4CLOUD = ERP.SAPS4CLOUD || (ERP.SAPS4CLOUD = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAPS4CLOUD.Manager.documentFactories[Lib.ERP.CSVDataImportParameters.docType] = function (manager) {
    return new Lib.ERP.SAPS4CLOUD.CSVDataImportParameters(manager);
};
