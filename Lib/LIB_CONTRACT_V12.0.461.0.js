///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Contract_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "P2P library",
  "require": [
    "Lib_Parameters_P2P_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Controls",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var g = Sys.Helpers.Globals;
        function ComputeEndDate(duration) {
            var startDate = Data.GetValue("StartDate__");
            var newEndDate = new Date(startDate.getTime());
            newEndDate.setMonth(startDate.getMonth() + duration);
            var diff = Sys.Helpers.Date.ComputeDeltaMonth(startDate, newEndDate);
            // If don't get the right number, set date to last day of previous month
            if (diff != duration) {
                newEndDate.setDate(0);
            }
            else {
                newEndDate.setDate(startDate.getDate() - 1);
            }
            Data.SetValue("EndDate__", newEndDate);
        }
        Contract.ComputeEndDate = ComputeEndDate;
        function IsContractOwnerOrBackup() {
            return IsContractOwner() || IsContractOwnerBackup();
        }
        Contract.IsContractOwnerOrBackup = IsContractOwnerOrBackup;
        function IsContractOwner() {
            if (Sys.ScriptInfo.IsClient()) {
                var contractOwnerLogin = Data.GetValue("OwnerLogin__");
                return !contractOwnerLogin
                    || g.User.loginId === contractOwnerLogin
                    || g.User.IsMemberOf(contractOwnerLogin);
            }
            return false;
        }
        Contract.IsContractOwner = IsContractOwner;
        function IsContractOwnerBackup() {
            if (Sys.ScriptInfo.IsClient()) {
                var contractOwnerLogin = Data.GetValue("OwnerLogin__");
                return !contractOwnerLogin
                    || g.User.IsBackupUserOf(contractOwnerLogin);
            }
            return false;
        }
        Contract.IsContractOwnerBackup = IsContractOwnerBackup;
        function IsContractRequesterOrBackup() {
            return IsContractRequester() || IsContractRequesterBackup();
        }
        Contract.IsContractRequesterOrBackup = IsContractRequesterOrBackup;
        function IsContractRequester() {
            if (Sys.ScriptInfo.IsClient()) {
                var contractRequesterLogin = Data.GetValue("RequesterLogin__");
                return !contractRequesterLogin
                    || g.User.loginId === contractRequesterLogin
                    || g.User.IsMemberOf(contractRequesterLogin);
            }
            return false;
        }
        Contract.IsContractRequester = IsContractRequester;
        function IsContractRequesterBackup() {
            if (Sys.ScriptInfo.IsClient()) {
                var contractRequesterLogin = Data.GetValue("RequesterLogin__");
                return !contractRequesterLogin
                    || g.User.IsBackupUserOf(contractRequesterLogin);
            }
            return false;
        }
        Contract.IsContractRequesterBackup = IsContractRequesterBackup;
        function QueryRelatedCatalogItems() {
            var options = {
                table: "PurchasingOrderedItems__",
                filter: Sys.Helpers.LdapUtil.FilterEqual("CONTRACTRUIDEX__", Data.GetValue("RUIDEx")).toString(),
                attributes: Lib.Purchasing.CatalogHelper.ProcurementItem.Attributes,
                maxRecords: 100,
                additionalOptions: {
                    bigQuery: { uniqueKeyName: "LongID" },
                    queryOptions: "EnableJoin=1"
                }
            };
            if (Sys.Parameters.GetInstance("P2P").GetParameter("EnableMultiSupplierItem")) {
                options.table = "P2P - CatalogItems__";
                options.filter = Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.CONTRACTRUIDEX__", Data.GetValue("RUIDEx")).toString();
                options.attributes = Lib.Purchasing.CatalogHelper.ProcurementItem.AttributesV2;
            }
            return Sys.GenericAPI.PromisedQuery(options);
        }
        Contract.QueryRelatedCatalogItems = QueryRelatedCatalogItems;
        function FillRelatedCatalogItems(items) {
            var tableName = "RelatedCatalogItems__";
            var table = Sys.ScriptInfo.IsServer() ? Data.GetTable(tableName) : Sys.Helpers.Globals.Controls[tableName];
            table.SetItemCount(0);
            if (items.length) {
                var mappings_1;
                if (Sys.Parameters.GetInstance("P2P").GetParameter("EnableMultiSupplierItem")) {
                    mappings_1 = {
                        "ItemUnit__": "UNITOFMEASURE__",
                        "ItemNumber__": "ITEMNUMBER__.SUPPLIERPARTID__",
                        "ItemDescription__": "DESCRIPTION__",
                        "ItemUnitPrice__": "ITEMNUMBER__.UNITPRICE__",
                        "ItemPublicPrice__": "ITEMNUMBER__.PUBLICPRICE__",
                        "ItemCurrency__": "ITEMNUMBER__.CURRENCY__",
                        "ItemCategory__": "SUPPLYTYPEID__.NAME__"
                    };
                }
                else {
                    mappings_1 = {
                        "ItemUnit__": "UNITOFMEASURE__",
                        "ItemPublicPrice__": "PUBLICPRICE__",
                        "ItemCategory__": "SUPPLYTYPEID__.NAME__"
                    };
                }
                Sys.Helpers.Array.ForEach(items, function (item) {
                    var tableItem = table.AddItem();
                    Sys.Helpers.Controls.ForEachTableColumn(tableName, function (field) {
                        var value = item[((mappings_1 === null || mappings_1 === void 0 ? void 0 : mappings_1[field]) || field).toUpperCase()];
                        if (!Sys.Helpers.IsEmpty(value)) {
                            tableItem.SetValue(field, value);
                        }
                    });
                });
            }
        }
        Contract.FillRelatedCatalogItems = FillRelatedCatalogItems;
        function QueryRelatedPOItems() {
            var options = {
                table: "CDLNAME#Purchase order V2.LineItems__",
                filter: Sys.Helpers.LdapUtil.FilterEqual("LINE_CONTRACTRUIDEX__", Data.GetValue("RUIDEx")).toString(),
                attributes: [
                    "ORDERNUMBER__",
                    "BUYERNAME__",
                    "OrderDate__",
                    "LINE_ITEMNUMBER__",
                    "LINE_ITEMDESCRIPTION__",
                    "LINE_ITEMQUANTITY__",
                    "LINE_ITEMNETAMOUNTLOCALCURRENCY__",
                    "LOCALCURRENCY__",
                    "ValidationURL"
                ],
                sortOrder: "OrderDate__ DESC",
                maxRecords: null,
                additionalOptions: {
                    bigQuery: { uniqueKeyName: "ORDERNUMBER__" },
                    recordBuilder: Sys.GenericAPI.BuildQueryResult,
                    fieldToTypeMap: {
                        ORDERNUMBER__: "string",
                        BUYERNAME__: "string",
                        OrderDate__: "date",
                        LINE_ITEMNUMBER__: "string",
                        LINE_ITEMDESCRIPTION__: "string",
                        LINE_ITEMQUANTITY__: "double",
                        LINE_ITEMNETAMOUNTLOCALCURRENCY__: "double",
                        LOCALCURRENCY__: "string",
                        ValidationURL: "string"
                    }
                }
            };
            return Sys.GenericAPI.PromisedQuery(options);
        }
        Contract.QueryRelatedPOItems = QueryRelatedPOItems;
        function QueryRelatedInvoice() {
            var options = {
                table: "CDNAME#Vendor invoice",
                filter: GetRelatedInvoiceFilter(),
                attributes: [
                    "__SUMCOUNT__:LocalInvoiceAmount__|__CURRENCY__:InvoiceCurrency__"
                ],
                maxRecords: null,
                additionalOptions: {
                    recordBuilder: Sys.GenericAPI.BuildQueryResult,
                    fieldToTypeMap: {
                        SUM: "double",
                        COUNT: "int",
                        CURRENCY: "string"
                    }
                }
            };
            return Sys.GenericAPI.PromisedQuery(options);
        }
        Contract.QueryRelatedInvoice = QueryRelatedInvoice;
        function GetRelatedInvoiceFilter() {
            return Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", Data.GetValue("ReferenceNumber__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__"))).toString();
        }
        Contract.GetRelatedInvoiceFilter = GetRelatedInvoiceFilter;
        function QueryRelatedPurchaseOrders() {
            var options = {
                table: "CDLNAME#Purchase order V2.LineItems__",
                filter: Sys.Helpers.LdapUtil.FilterEqual("LINE_CONTRACTRUIDEX__", Data.GetValue("RUIDEx")).toString(),
                attributes: [
                    "OrderNumber__",
                    "BUYERNAME__",
                    "OrderDate__",
                    "LOCALCURRENCY__",
                    "OrderStatus__",
                    "ValidationURL",
                    "SUM(LINE_ITEMNETAMOUNTLOCALCURRENCY__) 'SUM_LINE_ITEMNETAMOUNTLOCALCURRENCY__'"
                ],
                groupBy: [
                    "OrderNumber__",
                    "BUYERNAME__",
                    "OrderDate__",
                    "LOCALCURRENCY__",
                    "OrderStatus__",
                    "ValidationURL"
                ],
                sortOrder: "OrderDate__ DESC",
                maxRecords: 100,
                additionalOptions: {
                    recordBuilder: Sys.GenericAPI.BuildQueryResult,
                    fieldToTypeMap: {
                        OrderNumber__: "string",
                        BUYERNAME__: "string",
                        OrderDate__: "date",
                        LOCALCURRENCY__: "string",
                        OrderStatus__: "string",
                        ValidationURL: "string",
                        SUM_LINE_ITEMNETAMOUNTLOCALCURRENCY__: "double"
                    }
                }
            };
            return Sys.GenericAPI.PromisedQuery(options);
        }
        Contract.QueryRelatedPurchaseOrders = QueryRelatedPurchaseOrders;
        function FillTableItems(table, items, options) {
            if (options === void 0) { options = {}; }
            table.SetItemCount(0);
            if (items.length) {
                var fields_1 = Object.keys(items[0].fieldToTypeMap);
                Sys.Helpers.Array.ForEach(items, function (item) {
                    var tableItem = table.AddItem();
                    Sys.Helpers.Array.ForEach(fields_1, function (field) { var _a; return tableItem.SetValue(((_a = options.mappings) === null || _a === void 0 ? void 0 : _a[field]) || field, item.GetValue(field)); });
                });
            }
        }
        Contract.FillTableItems = FillTableItems;
        function IsDemoContract() {
            return Variable.GetValueAsString("ApplicationEnable") == "1";
        }
        Contract.IsDemoContract = IsDemoContract;
        Contract.StatusLabels = {
            Draft: "_Draft",
            ToValidate: "_ToValidate",
            Active: "_Active",
            Revoked: "_Revoked",
            Deleted: "_Deleted",
            Expired: "_Expired",
            Deprecated: "_Deprecated"
        };
        Contract.Status = {
            Draft: "Draft",
            ToValidate: "ToValidate",
            Active: "Active",
            Revoked: "Revoked",
            Deleted: "Deleted",
            Expired: "Expired",
            Deprecated: "Deprecated"
        };
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
