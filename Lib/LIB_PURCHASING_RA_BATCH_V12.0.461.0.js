///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_RA_Batch_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Remittance Advice Batch library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_CSVReader",
    "Sys/Sys_GenericAPI_Server",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_TimeoutHelper"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var RA;
        (function (RA) {
            var Batch;
            (function (Batch) {
                Batch.extractedDataVariable = "ExtractedData";
                var extractedDataString = Variable.GetValueAsString(Batch.extractedDataVariable);
                var extractedData = Sys.Helpers.IsEmpty(extractedDataString) ? {} : JSON.parse(extractedDataString);
                function SetExternalData(newExtractedData) {
                    extractedDataString = newExtractedData ? JSON.stringify(newExtractedData) : null;
                    Variable.SetValueAsString(Batch.extractedDataVariable, extractedDataString);
                    extractedData = newExtractedData || {
                        Lines: [],
                        ParsingError: []
                    };
                }
                Batch.SetExternalData = SetExternalData;
            })(Batch = RA.Batch || (RA.Batch = {}));
        })(RA = Purchasing.RA || (Purchasing.RA = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
