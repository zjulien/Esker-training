///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Contract_Amendment_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "P2P library",
  "require": [
    "Lib_Contract_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_TechnicalData",
    "Sys/Sys_Helpers_LdapUtil",
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
            var ContractAmendment = /** @class */ (function () {
                function ContractAmendment(queryResult) {
                    this.record = queryResult.record;
                    this.RUIDEX = queryResult.GetValue("RUIDEX");
                    this.Reasons__ = queryResult.GetValue("REASONS__");
                    this.Version__ = queryResult.GetValue("VERSION__");
                    this.ContractStatus__ = queryResult.GetValue("CONTRACTSTATUS__");
                    this.ContractSubmissionDateTime__ = queryResult.GetValue("CONTRACTSUBMISSIONDATETIME__");
                    this.StartDate__ = queryResult.GetValue("STARTDATE__");
                    this.CompanyCode__ = queryResult.GetValue("COMPANYCODE__");
                    this.Duration__ = queryResult.GetValue("DURATION__");
                    this.EndDate__ = queryResult.GetValue("ENDDATE__");
                    this.Description__ = queryResult.GetValue("DESCRIPTION__");
                    this.NAME__ = queryResult.GetValue("NAME__");
                    this.OwnerLogin__ = queryResult.GetValue("OWNERLOGIN__");
                    this.OwnerNiceName__ = queryResult.GetValue("OWNERNICENAME__");
                    this.ReferenceNumber__ = queryResult.GetValue("REFERENCENUMBER__");
                    try {
                        var data = queryResult.GetValue("TechnicalData__");
                        if (data != null && data != "") {
                            this.TechnicalData__ = JSON.parse(data);
                        }
                    }
                    catch (e) {
                        Log.Info(e);
                        this.TechnicalData__ = null;
                    }
                }
                return ContractAmendment;
            }());
            Amendment.ContractAmendment = ContractAmendment;
            function GetCurrentVersion() {
                return GetContractHistory()
                    .Then(function (contracts) {
                    var currentVersion;
                    contracts.forEach(function (contract) {
                        if (contract.ContractStatus__ === Lib.Contract.Status.Active) {
                            currentVersion = contract;
                        }
                    });
                    return currentVersion;
                });
            }
            Amendment.GetCurrentVersion = GetCurrentVersion;
            function HasAmendmentInProgress() {
                return GetContractHistory()
                    .Then(function (contracts) {
                    var hasAmendmentInProgress = false;
                    contracts.forEach(function (contract) {
                        if (contract.ContractStatus__ === Lib.Contract.Status.Draft
                            || contract.ContractStatus__ === Lib.Contract.Status.ToValidate) {
                            hasAmendmentInProgress = true;
                        }
                    });
                    return hasAmendmentInProgress;
                });
            }
            Amendment.HasAmendmentInProgress = HasAmendmentInProgress;
            function IsCurrentVersion() {
                return GetCurrentVersion().Then(function (currentContractVersion) {
                    if (!currentContractVersion) {
                        return true;
                    }
                    return currentContractVersion.RUIDEX === Data.GetValue("RUIDEX");
                });
            }
            Amendment.IsCurrentVersion = IsCurrentVersion;
            Amendment.g_getContractHistoryPromisesCache = {};
            function GetContractHistory() {
                var originalRUIDEX = Data.GetValue("OriginalContractRUIDEX__");
                var _getContractHistory = function () {
                    var editPORequestQueryOptions = {
                        table: "CDNAME#P2P - Contract",
                        filter: Sys.Helpers.LdapUtil.FilterEqual("OriginalContractRUIDEX__", originalRUIDEX).toString(),
                        attributes: [
                            "RUIDEX",
                            "STARTDATE__",
                            "VERSION__",
                            "COMPANYCODE__",
                            "CONTRACTSTATUS__",
                            "CONTRACTSUBMISSIONDATETIME__",
                            "DURATION__",
                            "ENDDATE__",
                            "DESCRIPTION__",
                            "NAME__",
                            "REASONS__",
                            "OWNERLOGIN__",
                            "OWNERNICENAME__",
                            "REFERENCENUMBER__"
                        ],
                        sortOrder: "VERSION__ DESC",
                        maxRecords: 100,
                        additionalOptions: {
                            recordBuilder: Sys.GenericAPI.BuildQueryResult,
                            searchInArchive: true,
                            asAdmin: true
                        }
                    };
                    return Sys.GenericAPI.PromisedQuery(editPORequestQueryOptions)
                        .Then(function (queryResults) {
                        return queryResults.map(function (queryResult) { return new ContractAmendment(queryResult); });
                    })
                        .Catch(function (reason) {
                        var errMessage = "Can't get contract history with OriginalContractRUIDEX \"".concat(originalRUIDEX, "\". Error : ").concat(reason);
                        Log.Error(errMessage);
                        throw errMessage;
                    });
                };
                return Amendment.g_getContractHistoryPromisesCache[originalRUIDEX] || (Amendment.g_getContractHistoryPromisesCache[originalRUIDEX] = _getContractHistory());
            }
            Amendment.GetContractHistory = GetContractHistory;
            function IsAmendment() {
                return !Sys.Helpers.IsEmpty(Data.GetValue("PreviousContractRUIDEX__"));
            }
            Amendment.IsAmendment = IsAmendment;
            function IsNewAmendment() {
                return !!Variable.GetValueAsString("AncestorsRuid");
            }
            Amendment.IsNewAmendment = IsNewAmendment;
            var g_previousContractRecord = null;
            function GetPreviousContractRecord() {
                if (g_previousContractRecord) {
                    return Sys.Helpers.Promise.Resolve(g_previousContractRecord);
                }
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("RuidEx", Variable.GetValueAsString("AncestorsRuid")), Sys.Helpers.LdapUtil.FilterEqual("Deleted", "0")).toString();
                var options = {
                    table: "CDNAME#P2P - Contract",
                    filter: filter,
                    attributes: ["*"],
                    sortOrder: null,
                    maxRecords: 1,
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult
                    }
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResult) {
                    g_previousContractRecord = queryResult[0].record;
                    return g_previousContractRecord;
                })
                    .Catch(function (reason) {
                    var errMessage = "Can't get previous contract with filter \"".concat(filter, "\". Error : ").concat(reason);
                    Log.Error(errMessage);
                    throw errMessage;
                });
            }
            Amendment.GetPreviousContractRecord = GetPreviousContractRecord;
        })(Amendment = Contract.Amendment || (Contract.Amendment = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
