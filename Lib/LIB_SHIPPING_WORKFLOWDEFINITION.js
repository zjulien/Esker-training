/* LIB_DEFINITION{
  "name": "Lib_Shipping_WorkflowDefinition",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Shipping workflow management",
  "versionable": false,
  "require": [
    "Sys/Sys_Shipping_WorkflowDefinition",
    "Lib_V12.0.461.0"
  ]
}*/
///#GLOBALS Lib Sys
// Common part
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var WorkflowDefinition;
        (function (WorkflowDefinition) {
            function AddJSONTo(definitions) {
                definitions.push(Sys.Shipping.WorkflowDefinition.GetJSON(1));
            }
            WorkflowDefinition.AddJSONTo = AddJSONTo;
        })(WorkflowDefinition = Shipping.WorkflowDefinition || (Shipping.WorkflowDefinition = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
