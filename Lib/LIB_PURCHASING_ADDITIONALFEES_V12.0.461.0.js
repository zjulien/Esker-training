///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_AdditionalFees_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "[Sys/Sys_GenericAPI_Client]",
    "[Sys/Sys_GenericAPI_Server]",
    "Sys/Sys_Helpers"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var AdditionalFees;
        (function (AdditionalFees) {
            var cachedValues = {};
            function areCachedValues(companyCode, ids) {
                if (ids) {
                    ids.forEach(function (id) {
                        if (!cachedValues[companyCode] || !cachedValues[companyCode][id]) {
                            return false;
                        }
                        return true;
                    });
                }
                return false;
            }
            function QueryValues(companyCode, requiredIds) {
                cachedValues[companyCode] = cachedValues[companyCode] || {};
                var ids = [];
                if (requiredIds && !Sys.Helpers.IsArray(requiredIds)) {
                    ids = [requiredIds];
                }
                else {
                    ids = requiredIds;
                }
                // when we want the currencies, return cache value only if the currencies have been loaded
                if (areCachedValues(companyCode, ids)) {
                    return Sys.Helpers.Promise.Resolve(cachedValues[companyCode]);
                }
                if (!companyCode) {
                    return Sys.Helpers.Promise.Resolve(cachedValues[companyCode]);
                }
                var filter = "(&(|(CompanyCode__=" + companyCode + ")(CompanyCode__=))";
                ids.forEach(function (id) {
                    filter += "(AdditionalFeeID__=" + id + ")";
                });
                filter += ")";
                var options = {
                    table: "P2P - Additional Fee__",
                    filter: filter,
                    attributes: ["MaxAmount__", "AdditionalFeeID__", "CompanyCode__", "Description__"]
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResults) {
                    if (queryResults.length > 0) {
                        queryResults.forEach(function (r) {
                            if (!cachedValues[r.CompanyCode__]) {
                                cachedValues[r.CompanyCode__] = {};
                            }
                            cachedValues[r.CompanyCode__][r.AdditionalFeeID__] = {
                                AdditionalFeeID__: r.AdditionalFeeID__,
                                Description__: r.Description__,
                                MaxAmount__: r.MaxAmount__
                            };
                        });
                    }
                    return cachedValues[companyCode];
                })
                    .Catch(function () { return cachedValues[companyCode]; });
            }
            AdditionalFees.QueryValues = QueryValues;
            function GetValues(companyCode, additionalFeeID) {
                if (cachedValues[companyCode] && cachedValues[companyCode][additionalFeeID]) {
                    return cachedValues[companyCode][additionalFeeID];
                }
                return null;
            }
            AdditionalFees.GetValues = GetValues;
            function PushValues(companyCode, newFee) {
                if (!cachedValues[companyCode]) {
                    cachedValues[companyCode] = {};
                }
                cachedValues[companyCode][newFee.AdditionalFeeID__] = newFee;
            }
            AdditionalFees.PushValues = PushValues;
        })(AdditionalFees = Purchasing.AdditionalFees || (Purchasing.AdditionalFees = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
