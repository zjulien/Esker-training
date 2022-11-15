///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_P2P_Managers_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Various managers helpers",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "[Sys/Sys_GenericAPI_Client]",
    "[Sys/Sys_GenericAPI_Server]",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
// Common interface
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Managers;
        (function (Managers) {
            function GetCostCentersFilter(costCenterFieldName) {
                if (costCenterFieldName === void 0) { costCenterFieldName = "CostCenter__"; }
                var costCentersList = [];
                var lineItems = Data.GetTable("LineItems__");
                var nbItems = lineItems.GetItemCount();
                for (var i = 0; i < nbItems; ++i) {
                    var item = lineItems.GetItem(i);
                    var value = item.GetValue(costCenterFieldName);
                    if (value && costCentersList.indexOf(value) === -1) {
                        costCentersList.push(value);
                    }
                }
                if (costCentersList.length > 0) {
                    var companyCodeFilter = Lib.P2P.GetCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    return Sys.Helpers.LdapUtil.FilterAnd("(".concat(companyCodeFilter, ")"), Sys.Helpers.LdapUtil.FilterIn("CostCenter__", costCentersList)).toString();
                }
                return null;
            }
            Managers.GetCostCentersFilter = GetCostCentersFilter;
            function GetCostCentersManagers(filter) {
                // Get the list of managers of cost centers from the Cost center table
                return Sys.GenericAPI.PromisedQuery({
                    table: "AP - Cost centers__",
                    filter: filter,
                    attributes: ["Manager__"]
                }).Then(function (listOfCCOwners) {
                    var loginList = [];
                    for (var _i = 0, listOfCCOwners_1 = listOfCCOwners; _i < listOfCCOwners_1.length; _i++) {
                        var ccRecord = listOfCCOwners_1[_i];
                        var manager = ccRecord.Manager__;
                        if (manager && loginList.indexOf(manager) === -1) {
                            loginList.push(manager);
                        }
                    }
                    return loginList;
                });
            }
            Managers.GetCostCentersManagers = GetCostCentersManagers;
            /**
             * retrieve all hierarchical managers logins of the given logins list.
             * Protected against infinite loop
             * @param contributorsLogin
             * @returns logins list of all managers
             */
            function GetManagersRecursively(contributorsLogin) {
                var allManagers = [];
                if (contributorsLogin && contributorsLogin.length > 0) {
                    var loginsAlreadyQueried_1 = __spreadArray([], contributorsLogin, true);
                    var loopOnManagers_1 = function (logins) {
                        return queryGetManagers(logins).Then(function (managers) {
                            var loginsForNextLoop = [];
                            managers.forEach(function (manager) {
                                if (manager && manager.ManagerLogin__ && loginsAlreadyQueried_1.indexOf(manager.ManagerLogin__) < 0) {
                                    loginsAlreadyQueried_1.push(manager.ManagerLogin__);
                                    allManagers.push(manager.ManagerLogin__);
                                    loginsForNextLoop.push(manager.ManagerLogin__);
                                }
                            });
                            if (loginsForNextLoop.length > 0) {
                                return loopOnManagers_1(loginsForNextLoop);
                            }
                            return Sys.Helpers.Promise.Resolve(allManagers);
                        });
                    };
                    return loopOnManagers_1(contributorsLogin);
                }
                return Sys.Helpers.Promise.Resolve(allManagers);
            }
            Managers.GetManagersRecursively = GetManagersRecursively;
            function queryGetManagers(logins) {
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterExist("ManagerLogin__"), Sys.Helpers.LdapUtil.FilterIn("UserLogin__", logins)).toString();
                return Sys.GenericAPI.PromisedQuery({
                    table: "P2P - User properties__",
                    filter: filter,
                    attributes: ["ManagerLogin__"]
                });
            }
        })(Managers = P2P.Managers || (P2P.Managers = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
