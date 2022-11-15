///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_P2P_Inventory_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "P2P library",
  "require": [
    "Sys/Sys",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Inventory;
        (function (Inventory) {
            var ldaputil = Sys.Helpers.LdapUtil;
            var InventoryMovement = /** @class */ (function () {
                function InventoryMovement() {
                }
                InventoryMovement.QueryMovementsForRuidex = function (ruidex) {
                    var filter = "(MovementOrigin__=".concat(ruidex, ")");
                    return InventoryMovement.QueryMovements(filter);
                };
                InventoryMovement.QueryMovements = function (filter) {
                    var queryOptions = {
                        table: "P2P - Inventory Movements__",
                        filter: filter,
                        attributes: [
                            "RUIDEX",
                            "CompanyCode__",
                            "ItemNumber__.ItemDescription__",
                            "ItemNumber__",
                            "LineNumber__",
                            "MovementDateTime__",
                            "MovementOrigin__",
                            "MovementType__",
                            "MovementValue__",
                            "MovementUnitPrice__",
                            "Currency__",
                            "UnitOfMeasure__",
                            "WarehouseID__.Name__",
                            "WarehouseID__"
                        ],
                        sortOrder: "MovementDateTime__ DESC",
                        maxRecords: null,
                        additionalOptions: {
                            recordBuilder: Sys.GenericAPI.BuildQueryResult,
                            bigQuery: true,
                            queryOptions: "EnableJoin=1"
                        }
                    };
                    return Sys.GenericAPI.PromisedQuery(queryOptions)
                        .Then(function (queryResults) {
                        var movements = [];
                        queryResults.forEach(function (dbMovement) {
                            movements.push(InventoryMovement.FromQueryResult(dbMovement));
                        });
                        return Sys.Helpers.Promise.Resolve(movements);
                    }).Catch(function (err) {
                        Log.Error("Error while deleting Inventory Movements table: ".concat(JSON.stringify(err)));
                        return Sys.Helpers.Promise.Reject();
                    });
                };
                InventoryMovement.FromQueryResult = function (queryResult) {
                    var movement = new InventoryMovement();
                    movement.companyCode = queryResult.GetValue("CompanyCode__");
                    movement.itemName = queryResult.GetValue("ItemNumber__.ItemDescription__");
                    movement.itemNumber = queryResult.GetValue("ItemNumber__");
                    movement.lineNumber = queryResult.GetValue("LineNumber__");
                    movement.movementDateTime = new Date(queryResult.GetValue("MovementDateTime__"));
                    movement.movementOrigin = queryResult.GetValue("MovementOrigin__");
                    movement.movementType = queryResult.GetValue("MovementType__");
                    movement.movementValue = parseFloat(queryResult.GetValue("MovementValue__"));
                    movement.movementUnitPrice = parseFloat(queryResult.GetValue("MovementUnitPrice__"));
                    movement.currency = queryResult.GetValue("Currency__");
                    movement.unitOfMeasure = queryResult.GetValue("UnitOfMeasure__");
                    movement.warehouseID = queryResult.GetValue("WarehouseID__");
                    movement.warehouseName = queryResult.GetValue("WarehouseID__.Name__");
                    movement.record = queryResult.record;
                    return movement;
                };
                return InventoryMovement;
            }());
            Inventory.InventoryMovement = InventoryMovement;
            var ForecastInventoryMovement = /** @class */ (function () {
                function ForecastInventoryMovement() {
                    this.reservedValue = 0;
                    this.replenishValue = 0;
                }
                ForecastInventoryMovement.QueryMovementsForRuidex = function (ruidex) {
                    var filter = "(MovementOrigin__=".concat(ruidex, ")");
                    return ForecastInventoryMovement.QueryMovements(filter);
                };
                ForecastInventoryMovement.QueryMovements = function (filter) {
                    var queryOptions = {
                        table: "P2P - Forecast Inventory movements__",
                        filter: filter,
                        attributes: [
                            "RUIDEX",
                            "CompanyCode__",
                            "ItemNumber__",
                            "LineNumber__",
                            "WarehouseID__",
                            "ReservedValue__",
                            "ReplenishValue__",
                            "UnitOfMeasure__",
                            "MovementDateTime__",
                            "MovementOrigin__"
                        ],
                        sortOrder: "MovementDateTime__ DESC",
                        maxRecords: null,
                        additionalOptions: {
                            recordBuilder: Sys.GenericAPI.BuildQueryResult,
                            bigQuery: true
                        }
                    };
                    return Sys.GenericAPI.PromisedQuery(queryOptions)
                        .Then(function (queryResults) {
                        var movements = [];
                        queryResults.forEach(function (dbMovement) {
                            movements.push(ForecastInventoryMovement.FromQueryResult(dbMovement));
                        });
                        return Sys.Helpers.Promise.Resolve(movements);
                    }).Catch(function (err) {
                        Log.Error("Error while deleting Inventory Movements table: ".concat(JSON.stringify(err)));
                        return Sys.Helpers.Promise.Reject();
                    });
                };
                ForecastInventoryMovement.FromQueryResult = function (queryResult) {
                    var movement = new ForecastInventoryMovement();
                    movement.companyCode = queryResult.GetValue("CompanyCode__");
                    movement.itemNumber = queryResult.GetValue("ItemNumber__");
                    movement.lineNumber = queryResult.GetValue("LineNumber__");
                    movement.warehouseID = queryResult.GetValue("WarehouseID__");
                    movement.reservedValue = parseFloat(queryResult.GetValue("ReservedValue__"));
                    movement.replenishValue = parseFloat(queryResult.GetValue("ReplenishValue__"));
                    movement.unitOfMeasure = queryResult.GetValue("UnitOfMeasure__");
                    movement.movementDateTime = new Date(queryResult.GetValue("MovementDateTime__"));
                    movement.movementOrigin = queryResult.GetValue("MovementOrigin__");
                    movement.record = queryResult.record;
                    return movement;
                };
                return ForecastInventoryMovement;
            }());
            Inventory.ForecastInventoryMovement = ForecastInventoryMovement;
            function IsEnabled() {
                return Sys.Parameters.GetInstance("P2P").GetParameter("EnableInventoryManagement", false);
            }
            Inventory.IsEnabled = IsEnabled;
            function IsReplenishmentRequest() {
                return !!Data.GetValue("IsReplenishment__");
            }
            Inventory.IsReplenishmentRequest = IsReplenishmentRequest;
            function IsReplenishmentItem(item) {
                return !!(item && item.GetValue("ItemNumber__") && item.GetValue("WarehouseID__") && item.GetValue("IsReplenishmentItem__"));
            }
            Inventory.IsReplenishmentItem = IsReplenishmentItem;
            function HasReplenishmentItems(table) {
                for (var i = 0; i < table.GetItemCount(); i++) {
                    var item = table.GetItem(i);
                    if (IsReplenishmentItem(item)) {
                        return true;
                    }
                }
                return false;
            }
            Inventory.HasReplenishmentItems = HasReplenishmentItems;
            function IsItemTakenFromStock(item) {
                return !!item && item.GetValue("ItemNumber__") && item.GetValue("WarehouseID__") && !item.GetValue("IsReplenishmentItem__");
            }
            Inventory.IsItemTakenFromStock = IsItemTakenFromStock;
            function HasItemsTakenFromStock(table) {
                for (var i = 0; i < table.GetItemCount(); i++) {
                    var item = table.GetItem(i);
                    if (IsItemTakenFromStock(item)) {
                        return true;
                    }
                }
                return false;
            }
            Inventory.HasItemsTakenFromStock = HasItemsTakenFromStock;
            function IsInternalOrder() {
                return Variable.GetValueAsString("IsInternal") === "True";
            }
            Inventory.IsInternalOrder = IsInternalOrder;
            var Warehouse = /** @class */ (function () {
                function Warehouse() {
                }
                Warehouse.GetRuidex = function (CompanyCode, WarehouseID) {
                    Log.Info("Get warehouse ruidex with companyCode:" + CompanyCode + " and warehouseID: " + WarehouseID);
                    var filter = [
                        ldaputil.FilterEqual("CompanyCode__", CompanyCode),
                        ldaputil.FilterEqual("WarehouseID__", WarehouseID)
                    ];
                    var queryOptions = {
                        table: Warehouse.TABLE,
                        filter: ldaputil.FilterAnd.apply(ldaputil, filter).toString(),
                        attributes: ["RUIDEX"]
                    };
                    return Sys.GenericAPI.PromisedQuery(queryOptions)
                        .Then(function (queryResult) { return queryResult[0].RUIDEX; });
                };
                Warehouse.GetWarehouse = function (CompanyCode, WarehouseID) {
                    Log.Info("Get warehouse information with companyCode:" + CompanyCode + " and warehouseID: " + WarehouseID);
                    var filter = [];
                    filter.push(ldaputil.FilterEqual("CompanyCode__", CompanyCode));
                    filter.push(ldaputil.FilterEqual("WarehouseID__", WarehouseID));
                    var queryOptions = {
                        table: Warehouse.TABLE,
                        filter: ldaputil.FilterAnd.apply(ldaputil, filter).toString(),
                        attributes: ["CompanyCode__", "Description__", "Name__", "ShipToID__", "WarehouseID__", "WarehouseManagerLogin__"]
                    };
                    return Sys.GenericAPI.PromisedQuery(queryOptions)
                        .Then(function (queryResult) {
                        if (queryResult.length === 0) {
                            throw new Error("No Warehouse found with CompanyCode: ".concat(CompanyCode, " and WarehouseID: ").concat(WarehouseID));
                        }
                        return Warehouse.FromQueryResult(queryResult[0]);
                    });
                };
                Warehouse.FromQueryResult = function (queryResult) {
                    var warehouse = new Warehouse();
                    warehouse.companyCode = queryResult["CompanyCode__"];
                    warehouse.ID = queryResult["WarehouseID__"];
                    warehouse.name = queryResult["Name__"];
                    warehouse.shipToID = queryResult["ShipToID__"];
                    warehouse.description = queryResult["Description__"];
                    warehouse.warehouseManagerLogin = queryResult["WarehouseManagerLogin__"];
                    return warehouse;
                };
                Warehouse.TABLE = "P2P - Warehouse__";
                return Warehouse;
            }());
            Inventory.Warehouse = Warehouse;
        })(Inventory = P2P.Inventory || (P2P.Inventory = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
