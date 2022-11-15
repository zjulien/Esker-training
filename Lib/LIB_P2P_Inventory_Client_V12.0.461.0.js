///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_P2P_Inventory_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "P2P library",
  "require": [
    "Lib_P2P_Inventory_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Inventory;
        (function (Inventory) {
            /**
             * Return true if the current user has the InventoryManager role.
             */
            function IsInventoryManager() {
                return User.IsBusinessRoleEnabled("InventoryManager");
            }
            Inventory.IsInventoryManager = IsInventoryManager;
            var ruidexCache = new Map();
            function OpenWarehouse(companyCode, warehouseID) {
                if (companyCode === void 0) { companyCode = Data.GetValue("CompanyCode__"); }
                if (warehouseID === void 0) { warehouseID = Data.GetValue("WarehouseID__"); }
                var key = "[".concat(companyCode, "]-").concat(warehouseID);
                if (ruidexCache.has(key) && ruidexCache.get(key)) {
                    var url = Sys.Helpers.GetFlexibleFormURL(ruidexCache.get(key), true);
                    Process.OpenLink({
                        url: url,
                        inCurrentTab: false
                    });
                }
                else if (companyCode && warehouseID) {
                    Inventory.Warehouse.GetRuidex(companyCode, warehouseID).Then(function (ruidex) {
                        if (ruidex) {
                            ruidexCache.set(key, ruidex);
                            OpenWarehouse(companyCode, warehouseID);
                        }
                    });
                }
                else {
                    Log.Error("Could not open warehouse <".concat(warehouseID, "> with company code <").concat(companyCode, ">"));
                }
            }
            Inventory.OpenWarehouse = OpenWarehouse;
        })(Inventory = P2P.Inventory || (P2P.Inventory = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
