///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "LIB_P2P.Base_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_P2P",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Parameters",
    "Sys/Sys_OnDemand_Users",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "[Lib_Version_V12.0.461.0]"
  ]
}*/
/**
 * Common P2P functions
 * @namespace Lib.P2P
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        /**
         * Table Names
         */
        P2P.TableNames = {
            TaxCodes: "AP - Tax codes__",
            POHeaders: "AP - Purchase order - Headers__",
            Vendors: "AP - Vendors__",
            AP_POItems: "AP - Purchase order - Items__"
        };
        /**
         * Line Types
         */
        P2P.LineType = {
            PO: "PO",
            GL: "GL",
            POGL: "POGL",
            CONSIGNMENT: "Consignment"
        };
        /**
         * Item types
         */
        var ItemType;
        (function (ItemType) {
            ItemType["AMOUNT_BASED"] = "AmountBased";
            ItemType["QUANTITY_BASED"] = "QuantityBased";
            ItemType["SERVICE_BASED"] = "ServiceBased";
        })(ItemType = P2P.ItemType || (P2P.ItemType = {}));
        P2P.TableAttributes = {
            Vendors: [
                "CompanyCode__",
                "City__",
                "Country__",
                "Currency__",
                "Email__",
                "FaxNumber__",
                "GeneralAccount__",
                "Name__",
                "Number__",
                "ParafiscalTax__",
                "PaymentTermCode__",
                "PhoneNumber__",
                "PostalCode__",
                "PostOfficeBox__",
                "PreferredInvoiceType__",
                "Region__",
                "ShowAlerts__",
                "Street__",
                "Sub__",
                "SupplierDue__",
                "TaxSystem__",
                "VATNumber__",
                "DUNSNumber__"
            ]
        };
        /**
         * Set of attributes to retrieve when query a user by login (in order to reduce the number of queries).
         * @memberof Lib.P2P
         * @constant
         */
        P2P.attributesForUserCache = [
            // general information
            "login", "displayname", "emailaddress", "isgroup",
            "phonenumber",
            // to format address
            "company", "street", "pobox", "zipcode", "city", "mailstate", "country", "mailsub", "pobox"
        ];
        var ConfigurationType;
        (function (ConfigurationType) {
            ConfigurationType["Test"] = "TEST";
            ConfigurationType["Prod"] = "PROD";
        })(ConfigurationType = P2P.ConfigurationType || (P2P.ConfigurationType = {}));
        /**
         * Check the connected user or the specified user matches the login
         */
        function CurrentUserMatchesLogin(login, currentUser) {
            currentUser = currentUser || Sys.Helpers.Globals.User;
            if (!currentUser) {
                throw new Error("No current user specified to test the login");
            }
            var currentUserLogin = currentUser.loginId || currentUser.GetValue("Login");
            return !!login &&
                (currentUserLogin.toLowerCase() === login.toLowerCase() ||
                    currentUser.IsMemberOf(login) ||
                    currentUser.IsBackupUserOf(login));
        }
        P2P.CurrentUserMatchesLogin = CurrentUserMatchesLogin;
        /*
         * users can be either a Users list (server side), or a single User (client side script)
         */
        function ResolveDemoLogin(login) {
            if (login && login.indexOf("%[reference:login:demosubstring]") !== -1) {
                // From sprint 171 variable SuffixAccount is available
                // If SuffixAccount is available, use it to resolve the login else do like before
                if (!Sys.Helpers.IsEmpty(Sys.Parameters.GetInstance("P2P").GetParameter("SuffixAccount"))) {
                    return login.replace("%[reference:login:demosubstring]", Sys.Parameters.GetInstance("P2P").GetParameter("SuffixAccount"));
                }
                var referenceValue = void 0;
                if (Sys.ScriptInfo.IsServer()) {
                    var ownerUser = Sys.Helpers.Globals.Users.GetUser(Sys.Helpers.Globals.Data.GetValue("OwnerId"));
                    if (ownerUser.GetValue("vendor") === "1") {
                        ownerUser = Sys.Helpers.Globals.Users.GetUserAsProcessAdmin(Sys.Helpers.String.ExtractLoginFromDN(Sys.Helpers.Globals.Data.GetValue("/process/OwnerId")));
                    }
                    referenceValue = ownerUser.GetValue("login");
                    // looking for the best real admin with the same profile
                    if (Sys.OnDemand.Users.IsServiceUser(referenceValue)) {
                        var realAdminUser = Sys.OnDemand.Users.TryGetBestRealUser(ownerUser);
                        referenceValue = realAdminUser.GetVars().GetValue_String("login", 0);
                    }
                }
                else {
                    referenceValue = Sys.Helpers.Globals.User.loginId;
                    if (Sys.OnDemand.Users.IsServiceUser(referenceValue)) {
                        throw new Error("Unable to resolve demo login with service user on client side");
                    }
                }
                var firstDot = referenceValue.indexOf(".");
                var firstAt = referenceValue.indexOf("@");
                if (firstDot < firstAt) {
                    referenceValue = referenceValue.substr(firstDot + 1);
                }
                login = login.replace("%[reference:login:demosubstring]", referenceValue);
            }
            return login;
        }
        P2P.ResolveDemoLogin = ResolveDemoLogin;
        function CompleteUsersInformations(users, fields, onDoneCallback) {
            //Keep track of the original array of object
            var originalUsers = users;
            // Keep only login
            var usersLogin = Sys.Helpers.Array.Map(users, function (v) {
                return v.login;
            });
            // Find users
            Sys.OnDemand.Users.GetUsersFromLogins(usersLogin, fields, function (fullUsers) {
                onDoneCallback(Sys.Helpers.Array.Map(fullUsers, function (user, index) {
                    return {
                        login: user.login,
                        emailAddress: user.exists ? user.emailaddress : user.login,
                        displayName: user.exists ? user.displayname : user.login,
                        originalValues: originalUsers[index],
                        exists: user.exists
                    };
                }));
            });
        }
        P2P.CompleteUsersInformations = CompleteUsersInformations;
        function GetPackageVersion(packageName) {
            return (Lib.Version && Lib.Version[packageName]) || 1;
        }
        P2P.GetPackageVersion = GetPackageVersion;
        function GetVersionedProcessName(packageName, processName) {
            var version = GetPackageVersion(packageName);
            return version >= 2 ? processName + " V" + version : processName;
        }
        P2P.GetVersionedProcessName = GetVersionedProcessName;
        function GetPRProcessName() {
            return GetVersionedProcessName("PAC", "Purchase requisition");
        }
        P2P.GetPRProcessName = GetPRProcessName;
        function GetPOProcessName() {
            return GetVersionedProcessName("PAC", "Purchase order");
        }
        P2P.GetPOProcessName = GetPOProcessName;
        function GetGRProcessName() {
            return GetVersionedProcessName("PAC", "Goods receipt");
        }
        P2P.GetGRProcessName = GetGRProcessName;
        function GetEmployeeTransactionsProcessName() {
            return "Employee Transactions";
        }
        P2P.GetEmployeeTransactionsProcessName = GetEmployeeTransactionsProcessName;
        function GetExpenseProcessName() {
            return "Expense";
        }
        P2P.GetExpenseProcessName = GetExpenseProcessName;
        function GetClientASNProcessName() {
            return "Advanced Shipping Notice";
        }
        P2P.GetClientASNProcessName = GetClientASNProcessName;
        function GetVendorASNProcessName() {
            return "Advanced Shipping Notice Vendor";
        }
        P2P.GetVendorASNProcessName = GetVendorASNProcessName;
        function GetReturnOrderProcessName() {
            return "Return Order";
        }
        P2P.GetReturnOrderProcessName = GetReturnOrderProcessName;
        function GetReturnOrderVendorProcessName() {
            return "Return Order Vendor";
        }
        P2P.GetReturnOrderVendorProcessName = GetReturnOrderVendorProcessName;
        function IsPR() {
            var processName = Lib.P2P.GetPRProcessName();
            return (Sys.ScriptInfo.IsClient() && Process.GetName() === processName) ||
                (Sys.ScriptInfo.IsServer() && Data.GetValue("ProcessId") === Process.GetProcessID(processName));
        }
        P2P.IsPR = IsPR;
        function IsPO() {
            var processName = Lib.P2P.GetPOProcessName();
            return (Sys.ScriptInfo.IsClient() && Process.GetName() === processName) ||
                (Sys.ScriptInfo.IsServer() && Data.GetValue("ProcessId") === Process.GetProcessID(processName));
        }
        P2P.IsPO = IsPO;
        function IsQuantityBasedItem(item) {
            return item ? item.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED : true;
        }
        P2P.IsQuantityBasedItem = IsQuantityBasedItem;
        function IsAmountBasedItem(item) {
            return item ? item.GetValue("ItemType__") === Lib.P2P.ItemType.AMOUNT_BASED : false;
        }
        P2P.IsAmountBasedItem = IsAmountBasedItem;
        function IsServiceBasedItem(item) {
            return item ? item.GetValue("ItemType__") === Lib.P2P.ItemType.SERVICE_BASED : false;
        }
        P2P.IsServiceBasedItem = IsServiceBasedItem;
        var glaccountToCostTypePromisedCache = {};
        function fillCostTypeFromGLAccount(item, glAccountField, costTypeField) {
            if (glAccountField === void 0) { glAccountField = "GLAccount__"; }
            if (costTypeField === void 0) { costTypeField = "CostType__"; }
            var filter = "(|(CompanyCode__=" + Data.GetValue("CompanyCode__") + ")(!(CompanyCode__=*))(CompanyCode__=))";
            var options = {
                table: "P2P - G/L account to Cost type__",
                filter: filter,
                attributes: ["FromGLAccount__", "ToGLAccount__", "CostType__"],
                maxRecords: "FULL_RESULT"
            };
            glaccountToCostTypePromisedCache[filter] = glaccountToCostTypePromisedCache[filter] || Sys.GenericAPI.PromisedQuery(options);
            return glaccountToCostTypePromisedCache[filter]
                .Then(function (results) {
                var find = false;
                if (results && results.length > 0) {
                    var glAccount = item.GetValue(glAccountField);
                    for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                        var result = results_1[_i];
                        if (glAccount <= result.ToGLAccount__ && glAccount >= result.FromGLAccount__) {
                            item.SetValue(costTypeField, result.CostType__);
                            find = true;
                            break;
                        }
                    }
                }
                if (!find) {
                    item.SetValue(costTypeField, "OpEx");
                }
                return Sys.Helpers.Promise.Resolve(item);
            });
        }
        P2P.fillCostTypeFromGLAccount = fillCostTypeFromGLAccount;
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
