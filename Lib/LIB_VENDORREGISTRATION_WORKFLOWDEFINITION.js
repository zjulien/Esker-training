/* LIB_DEFINITION{
  "name": "Lib_VendorRegistration_WorkflowDefinition",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "VendorRegistration library",
  "versionable": false,
  "require": [
    "Sys/Sys_VendorRegistration_WorkflowDefinition",
    "Lib_V12.0.461.0"
  ]
}*/
///#GLOBALS Lib Sys
// Common part
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var WorkflowDefinition;
        (function (WorkflowDefinition) {
            var definition = {
                "fields": {
                    "VendorCategory__": {
                        "filter": [{ "field": "WorkflowType__", "operator": "===", "value": ["\"vendorRegistration\""] }],
                        "type": "string",
                        "browsableValues": {
                            "dialogTitle": "_Select a Vendor category",
                            "tableTitle": "VendorCategory__",
                            "headerText": null,
                            "table": "P2P - Vendor Category__",
                            "maxRowCount": 20,
                            "columns": {
                                "Code__": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_Code"
                                    },
                                    "storedValue": true
                                }
                            },
                            "searchCriterias": {
                                "Code__": {
                                    "niceName": {
                                        "languageKey": "_Code"
                                    },
                                    "required": false,
                                    "toUpper": true,
                                    "visible": true,
                                    "filterId": "Code__",
                                    "defaultValue": "",
                                    "autoAddAsterisk": true
                                }
                            }
                        }
                    }
                }
            };
            function AddJSONTo(definitions) {
                definitions.push(Sys.VendorRegistration.WorkflowDefinition.GetJSON(0));
                definitions.push(definition);
            }
            WorkflowDefinition.AddJSONTo = AddJSONTo;
        })(WorkflowDefinition = VendorRegistration.WorkflowDefinition || (VendorRegistration.WorkflowDefinition = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
