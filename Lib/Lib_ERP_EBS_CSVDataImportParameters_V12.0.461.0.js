/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "Lib_ERP_EBS_CSVDataImportParameters_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "CSVDataImportParameters document for EBS ERP - system library",
  "require": [
    "Sys/Sys_Helpers_CSVReader",
    "Lib_ERP_CSVDataImportParameters_V12.0.461.0",
    "Lib_ERP_Generic_CSVDataImportParameters_V12.0.461.0",
    "Lib_ERP_EBS_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var EBS;
        (function (EBS) {
            var CSVDataImportParameters = /** @class */ (function (_super) {
                __extends(CSVDataImportParameters, _super);
                function CSVDataImportParameters(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.Parameters = {
                        ReplicationMode: "full"
                    };
                    return _this;
                }
                CSVDataImportParameters.prototype.GetJSON = function () {
                    return this.Parameters;
                };
                CSVDataImportParameters.prototype.GetMappingFile = function (tableName) {
                    return "mapping_EBS_" + tableName + "__.xml";
                };
                return CSVDataImportParameters;
            }(Lib.ERP.CSVDataImportParameters.Instance));
            EBS.CSVDataImportParameters = CSVDataImportParameters;
        })(EBS = ERP.EBS || (ERP.EBS = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.EBS.Manager.documentFactories[Lib.ERP.CSVDataImportParameters.docType] = function (manager) {
    return new Lib.ERP.EBS.CSVDataImportParameters(manager);
};
