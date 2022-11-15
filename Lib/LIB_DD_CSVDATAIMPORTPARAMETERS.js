/* LIB_DEFINITION{
  "name": "Lib_DD_CSVDataImportParameters",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Custom library extending Lib_CSVDataImportParameters",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Lib_V12.0.461.0"
  ]
}*/
///#GLOBALS Lib Sys
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        var CSVDataImportParameters;
        (function (CSVDataImportParameters) {
            CSVDataImportParameters.Parameters = {
                CsvHasHeader: true,
                FileNamePattern: ".*",
                /* possible values:
                 * "full" - if the csv represent the whole content of the table
                 * "incremental" - if the csv represent a subset of the table */
                ReplicationMode: "full",
                ClearTable: false,
                NoDelete: true,
                NoUpdate: false,
                NoInsert: false
            };
            function GetErpId(fileName) {
                //Useless for recipients import
                return "";
            }
            CSVDataImportParameters.GetErpId = GetErpId;
            function GetTableName(fileName) {
                return "ODUSER";
            }
            CSVDataImportParameters.GetTableName = GetTableName;
            function GetMappingFile(tableName) {
                return "mapping_recipients.xml";
            }
            CSVDataImportParameters.GetMappingFile = GetMappingFile;
            function GetJSON() {
                return this.Parameters;
            }
            CSVDataImportParameters.GetJSON = GetJSON;
        })(CSVDataImportParameters = DD.CSVDataImportParameters || (DD.CSVDataImportParameters = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
