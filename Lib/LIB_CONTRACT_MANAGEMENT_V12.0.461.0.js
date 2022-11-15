///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Contract_Management_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "P2P library",
  "require": []
}*/
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Management;
        (function (Management) {
            var CSVFileType;
            (function (CSVFileType) {
                CSVFileType["CSV"] = "CSV";
                CSVFileType["ZIP"] = "ZIP";
            })(CSVFileType = Management.CSVFileType || (Management.CSVFileType = {}));
            var ProcessStatus;
            (function (ProcessStatus) {
                ProcessStatus["Draft"] = "Draft";
                ProcessStatus["Imported"] = "Imported";
                ProcessStatus["Canceled"] = "Canceled";
                ProcessStatus["Error"] = "Error";
                ProcessStatus["ToApprove"] = "ToApprove";
            })(ProcessStatus = Management.ProcessStatus || (Management.ProcessStatus = {}));
            Management.VARIABLE_PROP = {
                ContractsError__: "ContractsError__",
                Error__: "Error__"
            };
        })(Management = Contract.Management || (Contract.Management = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
