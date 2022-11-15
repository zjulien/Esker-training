/* LIB_DEFINITION{
  "name": "Lib_AP_PredictionAPI_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server library containing helper to use prediction API",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_AP_V12.0.461.0",
    "Lib_FlexibleFormToJSON_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var PredictionAPI;
        (function (PredictionAPI) {
            function GetFormData() {
                var fieldsMapping = {
                    InvoiceNumber__: ["InvoiceNumber"],
                    InvoiceDate__: ["InvoiceDate"],
                    InvoiceAmount__: ["InvoiceAmount"],
                    InvoiceCurrency__: ["Currency"],
                    NetAmount__: ["InvoiceNetAmount"],
                    OrderNumber__: ["OrderNumber"]
                };
                var tablesMapping = {
                    LineItems__: {
                        Name: "lineItems",
                        Columns: {
                            Description__: ["Description"],
                            GLAccount__: ["GLA"],
                            LineType__: ["LineType"],
                            Amount__: ["Amount"],
                            Quantity__: ["Quantity"],
                            UnitPrice__: ["UnitPrice"],
                            TaxAmount__: ["TaxAmount"],
                            TaxCode__: ["TaxCode"],
                            TaxRate__: ["TaxRate"],
                            CostCenter__: ["CostCenter"],
                            CostType__: ["CostType"],
                            ProjectCode__: ["ProjectCode__"],
                            BusinessArea__: ["BusinessArea"],
                            BudgetID__: ["BudgetID"],
                            WBSElementID__: ["WBSElementID"],
                            InternalOrder__: ["InternalOrder"],
                            TaxJurisdiction__: ["JuridictionCode"],
                            TradingPartner__: ["TradingPartner"],
                            CompanyCode__: ["CompanyCode"],
                            Assignment__: ["AssignmentNumber"]
                        }
                    }
                };
                Lib.FlexibleFormToJSON.Serializer.SetMapping(fieldsMapping, tablesMapping);
                var result = Lib.FlexibleFormToJSON.Serializer.GetJSON(false, false, true);
                Lib.FlexibleFormToJSON.Serializer.SetMapping();
                Log.Info("Lib.FlexibleFormToJSON.Serializer.GetJSON() : ".concat(result));
                return result;
            }
            PredictionAPI.GetFormData = GetFormData;
        })(PredictionAPI = AP.PredictionAPI || (AP.PredictionAPI = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
