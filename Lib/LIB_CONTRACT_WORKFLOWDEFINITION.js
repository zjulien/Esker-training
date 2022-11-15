/* LIB_DEFINITION{
  "name": "Lib_Contract_WorkflowDefinition",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Contract library",
  "versionable": false,
  "require": [
    "Sys/Sys_P2P_WorkflowDefinition",
    "Sys/Sys_Contract_WorkflowDefinition",
    "Lib_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var WorkflowDefinition;
        (function (WorkflowDefinition) {
            function AddJSONTo(definitions) {
                definitions.push(Sys.Contract.WorkflowDefinition.GetJSON(1));
            }
            WorkflowDefinition.AddJSONTo = AddJSONTo;
        })(WorkflowDefinition = Contract.WorkflowDefinition || (Contract.WorkflowDefinition = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
