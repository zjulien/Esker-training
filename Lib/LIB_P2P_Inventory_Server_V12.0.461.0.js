/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_P2P_Inventory_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Server",
  "comment": "P2P library",
  "require": [
    "Lib_P2P_Inventory_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Inventory;
        (function (Inventory) {
            var ldaputil = Sys.Helpers.LdapUtil;
            function CreateOrUpdateInventoryMovement(inventoryMovement) {
                var record = GetInventoryMovementRecord(inventoryMovement);
                var newRecord = record || Process.CreateTableRecord("P2P - Inventory Movements__");
                if (newRecord) {
                    var newVars = newRecord.GetVars();
                    newVars.AddValue_String("CompanyCode__", inventoryMovement.companyCode, true);
                    newVars.AddValue_String("LineNumber__", inventoryMovement.lineNumber, true);
                    newVars.AddValue_String("MovementOrigin__", inventoryMovement.movementOrigin, true);
                    newVars.AddValue_String("ItemNumber__", inventoryMovement.itemNumber, true);
                    newVars.AddValue_String("WarehouseID__", inventoryMovement.warehouseID, true);
                    newVars.AddValue_String("MovementValue__", inventoryMovement.movementValue, true);
                    newVars.AddValue_String("MovementUnitPrice__", inventoryMovement.movementUnitPrice, true);
                    newVars.AddValue_String("Currency__", inventoryMovement.currency, true);
                    newVars.AddValue_Date("MovementDateTime__", new Date(Sys.Helpers.Date.ISOSTringToDate(newVars.GetValue_String("MovementDateTime__", 0)) || Date.now()), true);
                    newVars.AddValue_String("MovementType__", inventoryMovement.movementType, true);
                    newVars.AddValue_String("UnitOfMeasure__", inventoryMovement.unitOfMeasure, true);
                    Log.Info("Creating stock movement of ".concat(inventoryMovement.movementValue, " item of value  ").concat(inventoryMovement.movementUnitPrice, " for item number: ").concat(inventoryMovement.itemNumber, " for warehouse : ").concat(inventoryMovement.warehouseID, " with type : ").concat(inventoryMovement.movementType));
                    newRecord.Commit();
                    if (newRecord.GetLastError()) {
                        Log.Error("Failed to create Stock movement. Details: " + newRecord.GetLastErrorMessage());
                        return false;
                    }
                }
                else {
                    Log.Error("Failed to create Stock movement. Details: CreateTableRecord returns null.");
                    return false;
                }
                return true;
            }
            Inventory.CreateOrUpdateInventoryMovement = CreateOrUpdateInventoryMovement;
            function DeleteInventoryMovements(ruidEx) {
                return Lib.P2P.Inventory.InventoryMovement.QueryMovementsForRuidex(ruidEx)
                    .Then(function (inventoryMovements) {
                    Log.Info("Found", inventoryMovements.length, "movements to delete for ruidex", ruidEx);
                    inventoryMovements.forEach(function (inventoryMovement) {
                        inventoryMovement.record.Delete();
                        if (inventoryMovement.record.GetLastError()) {
                            Log.Error("Cannot delete item from inventory movement table. Details: " + inventoryMovement.record.GetLastErrorMessage());
                        }
                    });
                    return Sys.Helpers.Promise.Resolve(inventoryMovements);
                })
                    .Catch(function (err) {
                    Log.Error("Error while deleting Inventory Movements table: ".concat(JSON.stringify(err)));
                    return Sys.Helpers.Promise.Reject();
                });
            }
            Inventory.DeleteInventoryMovements = DeleteInventoryMovements;
            function GetInventoryMovementRecord(inventoryMovement) {
                var filter = [
                    ldaputil.FilterEqual("MovementOrigin__", inventoryMovement.movementOrigin)
                ];
                if (inventoryMovement.lineNumber) {
                    filter.push(ldaputil.FilterEqual("LineNumber__", inventoryMovement.lineNumber));
                }
                else {
                    filter.push(ldaputil.FilterEqual("WarehouseID__", inventoryMovement.warehouseID));
                    filter.push(ldaputil.FilterEqual("ItemNumber__", inventoryMovement.itemNumber));
                    filter.push(ldaputil.FilterEqual("MovementType__", inventoryMovement.movementType));
                }
                var queryOptions = {
                    table: "P2P - Inventory Movements__",
                    filter: ldaputil.FilterAnd.apply(ldaputil, filter).toString(),
                    attributes: ["*"],
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult
                    }
                };
                var res = null;
                Sys.GenericAPI.PromisedQuery(queryOptions)
                    .Then(function (queryResult) {
                    res = queryResult[0].record;
                })
                    .Catch(function () {
                    res = null;
                });
                return res;
            }
            function CreateOrUpdateForecastInventoryMovement(forecastMovement) {
                var record = GetForecastInventoryMovementRecord(forecastMovement);
                var newRecord = record || Process.CreateTableRecord("P2P - Forecast Inventory Movements__");
                if (newRecord) {
                    if (forecastMovement.replenishValue != 0 || forecastMovement.reservedValue != 0) {
                        var newVars = newRecord.GetVars();
                        newVars.AddValue_String("CompanyCode__", forecastMovement.companyCode, true);
                        newVars.AddValue_String("ItemNumber__", forecastMovement.itemNumber, true);
                        newVars.AddValue_String("LineNumber__", forecastMovement.lineNumber, true);
                        newVars.AddValue_String("warehouseID__", forecastMovement.warehouseID, true);
                        newVars.AddValue_String("ReplenishValue__", forecastMovement.replenishValue, true);
                        newVars.AddValue_String("ReservedValue__", forecastMovement.reservedValue, true);
                        newVars.AddValue_String("UnitOfMeasure__", forecastMovement.unitOfMeasure, true);
                        newVars.AddValue_Date("MovementDateTime__", new Date(Sys.Helpers.Date.ISOSTringToDate(newVars.GetValue_String("MovementDateTime__", 0)) || Date.now()), true);
                        newVars.AddValue_String("MovementOrigin__", forecastMovement.movementOrigin, true);
                        Log.Info("Creating forecast stock movement for item number: ".concat(forecastMovement.itemNumber, " for warehouse : ").concat(forecastMovement.warehouseID, " with resevered values \"").concat(forecastMovement.reservedValue, "\" and replenish value \"").concat(forecastMovement.replenishValue, "\""));
                        newRecord.Commit();
                    }
                    else if (record) {
                        Log.Info("Delete forecast stock movement for item number: ".concat(forecastMovement.itemNumber, " for warehouse : ").concat(forecastMovement.warehouseID));
                        newRecord.Delete();
                    }
                    if (newRecord.GetLastError()) {
                        Log.Error("Failed to create or update forecast stock movement. Details: " + newRecord.GetLastErrorMessage());
                        return false;
                    }
                }
                else {
                    Log.Error("Failed to create Stock movement. Details: CreateTableRecord returns null.");
                    return false;
                }
                return true;
            }
            Inventory.CreateOrUpdateForecastInventoryMovement = CreateOrUpdateForecastInventoryMovement;
            function DeleteForecastInventoryMovements(prRuidEx) {
                return Lib.P2P.Inventory.ForecastInventoryMovement.QueryMovementsForRuidex(prRuidEx)
                    .Then(function (forecastInventoryMovements) {
                    forecastInventoryMovements.forEach(function (forecastInventoryMovement) {
                        forecastInventoryMovement.record.Delete();
                        if (forecastInventoryMovement.record.GetLastError()) {
                            Log.Error("Cannot delete item from forecast inventory movement table. Details: " + forecastInventoryMovement.record.GetLastErrorMessage());
                        }
                    });
                    return Sys.Helpers.Promise.Resolve(forecastInventoryMovements);
                })
                    .Catch(function (err) {
                    Log.Error("Error while deleting Forecast Inventory Movements table: ".concat(JSON.stringify(err)));
                    return Sys.Helpers.Promise.Reject();
                });
            }
            Inventory.DeleteForecastInventoryMovements = DeleteForecastInventoryMovements;
            function GetForecastInventoryMovementRecord(forecastInventoryMovement) {
                var filter = [];
                filter.push(ldaputil.FilterEqual("MovementOrigin__", forecastInventoryMovement.movementOrigin));
                filter.push(ldaputil.FilterEqual("LineNumber__", forecastInventoryMovement.lineNumber));
                var queryOptions = {
                    table: "P2P - Forecast Inventory movements__",
                    filter: ldaputil.FilterAnd.apply(ldaputil, filter).toString(),
                    attributes: ["*"],
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult
                    }
                };
                var res = null;
                Sys.GenericAPI.PromisedQuery(queryOptions)
                    .Then(function (queryResult) {
                    res = queryResult[0].record;
                })
                    .Catch(function () {
                    res = null;
                });
                return res;
            }
            function UpdateInventoryStock(filters, updateOnError, itemsToCreate) {
                if (updateOnError === void 0) { updateOnError = false; }
                if (itemsToCreate === void 0) { itemsToCreate = {}; }
                var bOk = true;
                if (filters.length) {
                    var criticalSections_1 = [];
                    filters.forEach(function (f) {
                        criticalSections_1.push(GetCriticalSection(f.itemNumber, f.vendorNumber || f.warehouseNumber));
                    });
                    bOk = Process.PreventConcurrentAccess(criticalSections_1, function () {
                        Lib.Purchasing.CatalogHelper.GetVendorItems(filters)
                            .Then(function (vendorItems) {
                            vendorItems.forEach(function (vendorItem) {
                                vendorItem.QueryAndUpdateRealStockInDB(updateOnError)
                                    .Catch(function (reason) {
                                    bOk = false;
                                    Log.Error(reason);
                                    throw reason;
                                })
                                    .Finally(function () {
                                    var key = GetCriticalSection(vendorItem.itemNumber, vendorItem.vendorNumber || vendorItem.warehouseNumber);
                                    delete itemsToCreate[key];
                                });
                            });
                            if (!Sys.Helpers.Object.IsEmptyPlainObject(itemsToCreate) && bOk) {
                                Sys.Helpers.Object.ForEach(itemsToCreate, function (vendorItem) {
                                    vendorItem.QueryAndUpdateRealStockInDB(updateOnError)
                                        .Catch(function (reason) {
                                        bOk = false;
                                        Log.Error(reason);
                                        throw reason;
                                    });
                                });
                            }
                        });
                    }, null, 30) && bOk;
                }
                return bOk;
            }
            Inventory.UpdateInventoryStock = UpdateInventoryStock;
            function GetCriticalSection(itemNumber, sourceNumber) {
                return "inventorylock" + itemNumber + sourceNumber;
            }
            Inventory.GetCriticalSection = GetCriticalSection;
        })(Inventory = P2P.Inventory || (P2P.Inventory = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
