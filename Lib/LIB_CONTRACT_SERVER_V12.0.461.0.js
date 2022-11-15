///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Contract_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "P2P library",
  "require": [
    "Lib_Parameters_P2P_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_LdapUtil",
    "[Sys/Sys_GenericAPI_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var GetUserName = (function () {
            var loginCache = {};
            return function (login) {
                if (loginCache[login]) {
                    return loginCache[login];
                }
                var queryResult = [];
                var queryError;
                Sys.GenericAPI.PromisedQuery({
                    table: "ODUSER",
                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Login", login), Sys.Helpers.LdapUtil.FilterEqual("Customer", "0"), Sys.Helpers.LdapUtil.FilterEqual("Vendor", "0")).toString(),
                    attributes: ["DisplayName"],
                    maxRecords: 1,
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult
                    }
                })
                    .Then(function (result) { return queryResult = result; })
                    .Catch(function (error) { return queryError = error; });
                if (queryError) {
                    if (queryError instanceof Error) {
                        throw queryError;
                    }
                    throw new Error(queryError);
                }
                if (!queryResult.length) {
                    throw Language.Translate("_user_not_found", true, login);
                }
                Log.Info("Found ".concat(queryResult.length, " user"));
                var userName = queryResult[0].GetValue("DisplayName");
                loginCache[login] = userName;
                return userName;
            };
        })();
        var GetVendorInfo = (function () {
            var vendorCache = {};
            var makeCacheKey = function (companyCode, vendorNumber) { return "".concat(companyCode, "__CACHE_SEPARATOR__").concat(vendorNumber); };
            return function (companyCode, vendorNumber) {
                var _a;
                var cacheKey = makeCacheKey(companyCode, vendorNumber);
                if (vendorCache[cacheKey]) {
                    return vendorCache[cacheKey];
                }
                var queryResult = [];
                var queryError;
                Sys.GenericAPI.PromisedQuery({
                    table: "AP - Vendors__",
                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Number__", vendorNumber), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__"))).toString(),
                    attributes: ["Name__", "Number__", "Sub__", "Street__", "PostOfficeBox__", "City__", "PostalCode__", "Region__", "Country__", "Email__", "PhoneNumber__", "Website__", "OpeningHours__"],
                    maxRecords: 1,
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult
                    }
                })
                    .Then(function (result) { return queryResult = result; })
                    .Catch(function (error) { return queryError = error; });
                if (queryError) {
                    if (queryError instanceof Error) {
                        throw queryError;
                    }
                    throw new Error(queryError);
                }
                if (!queryResult.length) {
                    throw Language.Translate("_vendor_not_found", true, vendorNumber, companyCode);
                }
                Log.Info("Found ".concat(queryResult.length, " vendor"));
                var vendorAddress = {
                    "ToName": queryResult[0].GetValue("Name__"),
                    "ToSub": queryResult[0].GetValue("Sub__"),
                    "ToMail": queryResult[0].GetValue("Street__"),
                    "ToPostal": queryResult[0].GetValue("PostalCode__"),
                    "ToCountry": queryResult[0].GetValue("Country__"),
                    "ToState": queryResult[0].GetValue("Region__"),
                    "ToCity": queryResult[0].GetValue("City__"),
                    "ToPOBox": queryResult[0].GetValue("PostOfficeBox__")
                };
                var vendorFormattedAddress = (_a = Data.CheckPostalAddress(true, vendorAddress, queryResult[0].GetValue("Country__"), "")
                    .FormattedBlockAddress) === null || _a === void 0 ? void 0 : _a.replace(/^[^\r\n]+(\r|\n)+/, "");
                var vendorInfo = {
                    VendorAddress__: vendorFormattedAddress,
                    VendorName__: queryResult[0].GetValue("Name__"),
                    VendorNumber__: queryResult[0].GetValue("Number__"),
                    VendorEmail__: queryResult[0].GetValue("Email__"),
                    VendorPhone__: queryResult[0].GetValue("PhoneNumber__"),
                    VendorWebsite__: queryResult[0].GetValue("Website__"),
                    VendorOpeningHours__: queryResult[0].GetValue("OpeningHours__")
                };
                vendorCache[cacheKey] = vendorInfo;
                return vendorInfo;
            };
        })();
        function ResolveFieldDependecies(fields) {
            var ret = {};
            ret.InitialEndDate__ = fields.InitialEndDate__ || fields.EndDate__;
            ret.InitialStartDate__ = fields.InitialStartDate__ || fields.StartDate__;
            var newEndDate = Sys.Helpers.Date.ISOSTringToDateEx(fields.EndDate__);
            var priorNotice = Number.parseInt(fields.PriorNotice__, 10);
            var resiliationDate = newEndDate;
            resiliationDate.setDate(newEndDate.getDate() - priorNotice);
            ret.ResiliationDate__ = Sys.Helpers.Date.Date2DBDate(resiliationDate);
            var timeOfNotification = Number.parseInt(fields.RenewalReminderDays__, 10);
            resiliationDate.setDate(resiliationDate.getDate() - timeOfNotification);
            ret.NotificationDate__ = Sys.Helpers.Date.Date2DBDate(resiliationDate);
            ret.Duration__ = Sys.Helpers.Date.ComputeDeltaMonth(Sys.Helpers.Date.ISOSTringToDateEx(fields.StartDate__), Sys.Helpers.Date.ISOSTringToDateEx(fields.EndDate__)).toString(10);
            ret.OwnerNiceName__ = GetUserName(fields.OwnerLogin__);
            ret.RequesterNiceName__ = GetUserName(fields.RequesterLogin__);
            ret = __assign(__assign({}, ret), GetVendorInfo(fields.CompanyCode__, fields.VendorNumber__));
            Log.Info("ResolveFieldDependecies : " + JSON.stringify(ret));
            return ret;
        }
        Contract.ResolveFieldDependecies = ResolveFieldDependecies;
        var ContractStatus;
        (function (ContractStatus) {
            ContractStatus[ContractStatus["NEW_CONTRACT"] = 1] = "NEW_CONTRACT";
            ContractStatus[ContractStatus["EXISTINGCONTRACT"] = 2] = "EXISTINGCONTRACT";
            ContractStatus[ContractStatus["ISMYCHILD"] = 4] = "ISMYCHILD";
        })(ContractStatus = Contract.ContractStatus || (Contract.ContractStatus = {}));
        function ContractAlreadyExist(contractIdentifer) {
            var ret = ContractStatus.NEW_CONTRACT;
            // SAME COMPANY
            // SAME VENDOR
            // SAME CONTRACT NUMBER
            // ????STILL ACTIVE to manage amendement.
            var options = {
                table: "CDNAME#P2P - Contract",
                filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", contractIdentifer.CompanyCode__), Sys.Helpers.LdapUtil.FilterEqual("ReferenceNumber__", contractIdentifer.ReferenceNumber__), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", contractIdentifer.VendorNumber__)
                //, Sys.Helpers.LdapUtil.FilterGreaterOrEqual("EndDate__", "NOW()")
                ),
                attributes: ["SOURCERUID"],
                maxRecords: 1,
                additionalOptions: {
                    recordBuilder: Sys.GenericAPI.BuildQueryResult,
                    searchInArchive: true,
                    asAdmin: true
                }
            };
            Sys.GenericAPI.PromisedQuery(options).Then(function (result) {
                Log.Info("Found ".concat(result.length, " contract"));
                if (result.length) {
                    ret = ContractStatus.EXISTINGCONTRACT;
                    // Is my son ?
                    if (result[0].GetValue("SOURCERUID") == Data.GetValue("RUIDEX")) {
                        ret |= ContractStatus.ISMYCHILD;
                    }
                }
            });
            return ret;
        }
        Contract.ContractAlreadyExist = ContractAlreadyExist;
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
