///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Contract_Amendment_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Server",
  "comment": "P2P library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_TechnicalData",
    "Lib_Contract_Amendment_V12.0.461.0",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Amendment;
        (function (Amendment) {
            function IsFieldToCopy(fieldName) {
                var fieldsToIgnore = ["technicaldata__", "contractstatus__", "requesterlogin__", "requesternicename__", "reasons__"];
                return fieldsToIgnore.indexOf(fieldName.toLowerCase()) < 0;
            }
            function CopyPreviousContractVars() {
                return Amendment.GetPreviousContractRecord()
                    .Then(function (previousContractRecord) {
                    var previousContractVars = previousContractRecord.GetVars();
                    var nbFields = Data.GetNbFields();
                    var previousValues = {};
                    for (var i = 0; i < nbFields; i++) {
                        var dataFieldName = Data.GetFieldName(i);
                        if (IsFieldToCopy(dataFieldName)) {
                            previousValues[dataFieldName] = previousContractVars.GetValue(dataFieldName, 0);
                            Data.SetValue(dataFieldName, previousValues[dataFieldName]);
                        }
                    }
                    Sys.TechnicalData.SetValue("previousValues", previousValues);
                    Data.SetValue("PreviousContractRUIDEX__", Variable.GetValueAsString("AncestorsRuid"));
                    Variable.SetValueAsString("AncestorsRuid", "");
                    Log.Info("Previous contract with contract name \"".concat(Data.GetValue("Name__"), "\" is \"").concat(Data.GetValue("PreviousContractRUIDEX__"), "\""));
                    Log.Info("Contract copied from previous contract with contract name \"".concat(Data.GetValue("Name__"), "\" and previous data stored in TechnicalData__"));
                    UpdateVersion();
                });
            }
            Amendment.CopyPreviousContractVars = CopyPreviousContractVars;
            function UpdateVersion() {
                Data.SetValue("Version__", Data.GetValue("Version__") + 1);
                Log.Info("Contract version updated to \"".concat(Data.GetValue("Version__"), "\""));
            }
            function UpdateCatalogItemToNewContractVersion() {
                var filter = "(ContractRUIDEX__=" + Data.GetValue("PreviousContractRUIDEX__") + "))";
                var options = {
                    table: "PurchasingOrderedItems__",
                    filter: filter,
                    attributes: ["RUIDEX"],
                    sortOrder: null,
                    maxRecords: 100,
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult
                    }
                };
                Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResult) {
                    Log.Info("Retrieved ".concat(queryResult.length, " items with reference previous contract version"));
                    queryResult.forEach(function (result) {
                        var record = Process.GetUpdatableTableRecord(result.GetValue("RUIDEX"));
                        var vars = record.GetVars();
                        vars.AddValue_String("ContractRUIDEX__", Data.GetValue("Ruidex"), true);
                        record.Commit();
                        if (record.GetLastError()) {
                            Log.Error("Failed to update Contract version for catalog item : '".concat(result.GetValue("RUIDEX"), "'. Details: ") + record.GetLastErrorMessage());
                        }
                    });
                })
                    .Catch(function (reason) {
                    Log.Error("Can't get Catalog items with filter \"".concat(filter, "\". Error : ").concat(reason));
                });
            }
            function DeprecatePreviousContractVersion() {
                Log.Info("Previous contract with contract name \"".concat(Data.GetValue("Name__"), "\" and RUIDEX \"").concat(Data.GetValue("PreviousContractRUIDEX__"), "\" is now deprecated"));
                var ctrTransport = Process.GetUpdatableTransportAsProcessAdmin(Data.GetValue("PreviousContractRUIDEX__"));
                //ResumeWithActionAsync works with record in state = 100 where ResumeWithAction does not. TODO : ResumeWithAction should work with record in state 100
                ctrTransport.ResumeWithActionAsync("AmendContract");
                UpdateCatalogItemToNewContractVersion();
            }
            Amendment.DeprecatePreviousContractVersion = DeprecatePreviousContractVersion;
        })(Amendment = Contract.Amendment || (Contract.Amendment = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
