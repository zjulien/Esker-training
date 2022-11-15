/* LIB_DEFINITION{
  "name": "LIB_CONTRACTDEMODATA_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Import JSON to auto create contract",
  "versionable": true,
  "require": [
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_OnDemand_Users",
    "Lib_Contract_Workflow_Server_V12.0.461.0"
  ]
}*/
///#GLOBALS Lib Sys
var Lib;
(function (Lib) {
    var ContractDemoData;
    (function (ContractDemoData) {
        function ExtractContractInfo() {
            var attachContent = Attach.GetContent(1);
            Log.Info("Import JSON information: " + attachContent);
            return JSON.parse(attachContent);
        }
        function WriteContractInfo(info) {
            var now = new Date();
            var owner = Data.GetValue("OwnerID");
            var ownerLogin = Sys.Helpers.String.ExtractLoginFromDN(owner);
            // looking for the best real admin with the same profile
            if (Sys.OnDemand.Users.IsServiceUser(ownerLogin)) {
                var ownerUser = Users.GetUser(owner);
                var realAdminUser = Sys.OnDemand.Users.TryGetBestRealUser(ownerUser);
                var realAdminUserLogin = realAdminUser.GetVars().GetValue_String("login", 0);
                owner = owner.replace(ownerLogin, realAdminUserLogin);
            }
            var splitArobace = owner.split("@");
            var splitDot = splitArobace[0].split(".");
            splitDot[0] = "cn=" + info.UserInfo.Login;
            splitArobace[0] = splitDot.join(".");
            var newOwner = splitArobace.join("@");
            var user = Users.GetUser(newOwner);
            for (var attr in info) {
                if (typeof info[attr] != "object") {
                    var value = info[attr].toString();
                    value = value.replace("<STARTYEAR>", now.getFullYear());
                    value = value.replace("<ENDYEAR>", now.getFullYear() + 3);
                    value = value.replace("<USERLOGIN>", user.GetValue("login"));
                    value = value.replace("<NOW>", Sys.Helpers.Date.Date2DBDateTime(now));
                    value = value.replace("<USERNAME>", user.GetValue("DisplayName"));
                    Data.SetValue(attr, value);
                }
            }
        }
        function QueryItemV1(itemNumber) {
            var query = Process.CreateQuery();
            query.SetSpecificTable("PurchasingOrderedItems__");
            var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__", itemNumber), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("ItemCompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("ItemCompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("ItemCompanyCode__")));
            query.SetFilter(filter.toString());
            return query;
        }
        function QueryItemV2(itemNumber, vendorNumber) {
            var query = Process.CreateQuery();
            query.SetSpecificTable("P2P - VendorItems__");
            var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("SupplierPartID__", itemNumber), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__")));
            query.SetFilter(filter.toString());
            return query;
        }
        function LinkItem(itemNumber, vendorNumber) {
            for (var i = 0; i < 5; ++i) {
                if (EditItemRecord(QueryItemV1(itemNumber))) {
                    break;
                }
                Log.Info("Wait for item " + itemNumber + " (60s) for catalog V1");
                Process.Sleep(60);
            }
            for (var i = 0; i < 5; ++i) {
                if (EditItemRecord(QueryItemV2(itemNumber, vendorNumber))) {
                    break;
                }
                Log.Info("Wait for item " + itemNumber + " (60s) for catalog V2");
                Process.Sleep(60);
            }
        }
        function EditItemRecord(query) {
            var DBFastAccess = 0x00210000;
            var DBDirtyRead = 0x00020000;
            query.SetAttributesList("RUIDEX");
            query.SetOptionEx("Limit=2");
            query.SetOptions(DBFastAccess | DBDirtyRead);
            if (query.MoveFirst()) {
                var record = query.MoveNextRecord();
                if (record) {
                    var vars = record.GetVars();
                    vars.AddValue_String("ContractName__", Data.GetValue("Name__"), true);
                    vars.AddValue_String("ContractNumber__", Data.GetValue("ReferenceNumber__"), true);
                    vars.AddValue_String("ContractRUIDEX__", Data.GetValue("RUIDEX"), true);
                    record.Commit();
                    return true;
                }
            }
            return false;
        }
        function LinkItems(info) {
            if (info.Items) {
                info.Items.forEach(function (itemNumber) {
                    LinkItem(itemNumber, info.VendorNumber__);
                });
            }
        }
        function ProcessWorkflow() {
            Data.SetValue("Comments__", Language.Translate("_workflow created automatically"));
            Lib.Contract.Workflow.Init();
            Lib.Contract.Workflow.UpdateRolesSequence();
            //do requester action
            Lib.Contract.Workflow.DoCurrentContributorAction();
            //do approver action
            Lib.Contract.Workflow.DoCurrentContributorAction();
            Data.SetValue("NeedValidation", 0);
        }
        function Init() {
            Process.DisableChecks();
            var info = ExtractContractInfo();
            WriteContractInfo(info);
            LinkItems(info);
            Attach.SetValue(1, "AttachToProcess", 0);
            Attach.SetTechnical(1, true);
            //Manage Items
            ProcessWorkflow();
        }
        ContractDemoData.Init = Init;
    })(ContractDemoData = Lib.ContractDemoData || (Lib.ContractDemoData = {}));
})(Lib || (Lib = {}));
