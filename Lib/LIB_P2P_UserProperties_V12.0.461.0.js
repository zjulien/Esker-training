///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_P2P_UserProperties_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "P2P library",
  "require": [
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var UserProperties;
        (function (UserProperties) {
            //export only for Unit testing purpose
            UserProperties.cachedValues = {};
            UserProperties.cachedValuesByUserNumber = {};
            var CUserProperties = /** @class */ (function () {
                function CUserProperties(dbRecord) {
                    var _a;
                    this.UserLogin__ = "";
                    this.CompanyCode__ = "";
                    this.UserNumber__ = "";
                    this.CostCenter__ = "";
                    this.CostCenter__Description__ = "";
                    this.DefaultWarehouse__ = "";
                    this.DefaultWarehouseName__ = "";
                    this.AllowedCompanyCodes__ = "";
                    this.allowedCompanyCodesString = null;
                    this.HasCompanyCard__ = false;
                    if (dbRecord) {
                        this.UserLogin__ = dbRecord.UserLogin__;
                        this.CompanyCode__ = dbRecord.CompanyCode__;
                        this.UserNumber__ = dbRecord.UserNumber__;
                        this.CostCenter__ = dbRecord.CostCenter__;
                        this.CostCenter__Description__ = dbRecord["CostCenter__.Description__"];
                        this.DefaultWarehouse__ = dbRecord.DefaultWarehouse__;
                        this.DefaultWarehouseName__ = dbRecord["DefaultWarehouse__.WarehouseName___"];
                        this.AllowedCompanyCodes__ = dbRecord.AllowedCompanyCodes__;
                        this.AllowedWarehouses__ = ((_a = dbRecord.AllowedWarehouses__) === null || _a === void 0 ? void 0 : _a.split(/\r?\n/).filter(function (n) { return n; })) || [];
                        this.HasCompanyCard__ = dbRecord.HasCompanyCard__ == "1";
                    }
                }
                CUserProperties.prototype.GetAllowedCompanyCodes = function () {
                    if (!this.allowedCompanyCodesString) {
                        var list = this.AllowedCompanyCodes__.split(";");
                        list.push(this.CompanyCode__);
                        var uniqueCCList_1 = [];
                        Sys.Helpers.Array.ForEach(list, function (cc) {
                            if (!Sys.Helpers.IsEmpty(cc) && uniqueCCList_1.indexOf(cc) < 0) {
                                uniqueCCList_1.push(cc);
                            }
                        });
                        this.allowedCompanyCodesString = uniqueCCList_1.join("\n");
                    }
                    return this.allowedCompanyCodesString;
                };
                return CUserProperties;
            }());
            UserProperties.CUserProperties = CUserProperties;
            function QueryValues(userLogin) {
                if (UserProperties.cachedValues[userLogin]) {
                    return Sys.Helpers.Promise.Resolve(UserProperties.cachedValues[userLogin]);
                }
                if (!userLogin) {
                    UserProperties.cachedValues[userLogin] = new CUserProperties();
                    return Sys.Helpers.Promise.Resolve(UserProperties.cachedValues[userLogin]);
                }
                var attributes = ["UserLogin__",
                    "CompanyCode__",
                    "UserNumber__",
                    "CostCenter__",
                    "CostCenter__.Description__",
                    "DefaultWarehouse__",
                    "DefaultWarehouse__.Name__",
                    "AllowedCompanyCodes__",
                    "AllowedWarehouses__",
                    "HasCompanyCard__"];
                return Sys.GenericAPI.PromisedQuery({
                    table: "P2P - User properties__",
                    filter: "(" + "UserLogin__=" + userLogin + ")",
                    attributes: attributes,
                    maxRecords: 100,
                    additionalOptions: "EnableJoin=1"
                })
                    .Then(function (result) {
                    UserProperties.cachedValues[userLogin] = new CUserProperties(result[0]);
                    if (UserProperties.cachedValues[userLogin].UserNumber__) {
                        UserProperties.cachedValuesByUserNumber[result[0].UserNumber__] = new CUserProperties(result[0]);
                    }
                    return UserProperties.cachedValues[userLogin];
                })
                    .Catch(function (error) {
                    UserProperties.cachedValues[userLogin] = new CUserProperties();
                    return UserProperties.cachedValues[userLogin];
                });
            }
            UserProperties.QueryValues = QueryValues;
            UserProperties.QueryNoResult = "No result";
            function QueryValuesByUserNumber(userNumber) {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var userProperties = GetValuesByUserNumber(userNumber);
                    if (userProperties) {
                        resolve(userProperties);
                    }
                    else if (userNumber) {
                        var attributes = ["UserLogin__",
                            "CompanyCode__",
                            "UserNumber__",
                            "CostCenter__",
                            "CostCenter__.Description__",
                            "DefaultWarehouse__",
                            "DefaultWarehouse__.Name__",
                            "AllowedCompanyCodes__",
                            "AllowedWarehouses__",
                            "HasCompanyCard__"];
                        Sys.GenericAPI.Query("P2P - User properties__", "(" + "UserNumber__=" + userNumber + ")", attributes, function (result, error) {
                            if (!error && result.length > 0) {
                                UserProperties.cachedValuesByUserNumber[userNumber] = new CUserProperties(result[0]);
                                if (UserProperties.cachedValuesByUserNumber[userNumber].UserLogin__) {
                                    UserProperties.cachedValues[result[0].UserLogin__] = new CUserProperties(result[0]);
                                }
                                resolve(UserProperties.cachedValuesByUserNumber[userNumber]);
                            }
                            else if (!error) {
                                reject(UserProperties.QueryNoResult);
                            }
                            else {
                                reject(error);
                            }
                        }, "", 1, "EnableJoin=1");
                    }
                    else {
                        reject("Couldn't search by falsy user number (\"\", null, undefined), userNumber parameter value" + userNumber);
                    }
                });
            }
            UserProperties.QueryValuesByUserNumber = QueryValuesByUserNumber;
            function GetValuesByUserNumber(userNumber) {
                if (userNumber) {
                    if (UserProperties.cachedValuesByUserNumber[userNumber]) {
                        return UserProperties.cachedValuesByUserNumber[userNumber];
                    }
                    var userLoginWithThisUserNumber = Object.keys(UserProperties.cachedValues).filter(function (key) { return UserProperties.cachedValues[key].UserNumber__ == userNumber; });
                    if (userLoginWithThisUserNumber.length > 0) {
                        //Two Users should not have the same userNumber, so consider always have found only one
                        UserProperties.cachedValuesByUserNumber[userNumber] = UserProperties.cachedValues[userLoginWithThisUserNumber[0]];
                        return UserProperties.cachedValuesByUserNumber[userNumber];
                    }
                }
                return null;
            }
            UserProperties.GetValuesByUserNumber = GetValuesByUserNumber;
            function GetValues(userLogin) {
                if (UserProperties.cachedValues[userLogin]) {
                    return UserProperties.cachedValues[userLogin];
                }
                return new CUserProperties();
            }
            UserProperties.GetValues = GetValues;
        })(UserProperties = P2P.UserProperties || (P2P.UserProperties = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
