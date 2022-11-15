/* eslint-disable dot-notation,@typescript-eslint/no-unused-vars,class-methods-use-this,no-empty-function,no-lonely-if,no-else-return,no-return-assign */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CM_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Catalog Management library",
  "require": [
    "Lib_Purchasing_CM_V12.0.461.0",
    "Lib_Purchasing_CM_Workflow_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_P2P_Inventory_Server_V12.0.461.0",
    "[Lib_P2P_Customization_Common]",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_CSVReader",
    "Sys/Sys_GenericAPI_Server",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_TimeoutHelper"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var CM;
        (function (CM) {
            var LdapUtil = Sys.Helpers.LdapUtil;
            var TimeoutHelper = Sys.Helpers.TimeoutHelper;
            var CatalogHelper = Lib.Purchasing.CatalogHelper;
            var Inventory = Lib.P2P.Inventory;
            var ActionHandler = /** @class */ (function () {
                function ActionHandler() {
                }
                ActionHandler.prototype.Do_DeleteVendorItem = function (vendorItem) {
                    if (vendorItem === null || vendorItem === void 0 ? void 0 : vendorItem.IsFromWarehouse()) {
                        Log.Error("WarehouseItem can't be delete by import");
                        return "WarehouseItem can't be delete by import";
                    }
                    return vendorItem === null || vendorItem === void 0 ? void 0 : vendorItem.Delete();
                };
                ActionHandler.prototype.Do_DeleteBoth = function (catalogItem, vendorItem) {
                    if (catalogItem && CServerHelper.IsCatalogItemDeletable(catalogItem, vendorItem === null || vendorItem === void 0 ? void 0 : vendorItem.SourceNumber)) {
                        if (vendorItem === null || vendorItem === void 0 ? void 0 : vendorItem.IsFromWarehouse()) {
                            Log.Error("WarehouseItem can't be delete by import");
                            return "WarehouseItem can't be delete by import";
                        }
                        return catalogItem.Delete();
                    }
                    else {
                        return this.Do_DeleteVendorItem(vendorItem);
                    }
                };
                ActionHandler.prototype.Do_AddOrUpdateVendorItem = function (catalogItem, vendorItem) {
                    if (vendorItem === null || vendorItem === void 0 ? void 0 : vendorItem.IsFromWarehouse()) {
                        var error_1;
                        this.NewStockTackingAndSave(vendorItem, catalogItem.description, catalogItem.UOM)
                            .Catch(function (err) { return error_1 = err; }); // very ugly ='(, but laziness to change all the signatures of all actions
                        return error_1;
                    }
                    else {
                        return vendorItem === null || vendorItem === void 0 ? void 0 : vendorItem.SaveInDB(true);
                    }
                };
                ActionHandler.prototype.Do_AddOrUpdateBoth = function (catalogItem, vendorItem) {
                    var error = catalogItem === null || catalogItem === void 0 ? void 0 : catalogItem.SaveInDB(false);
                    if (error) {
                        return error;
                    }
                    if (vendorItem) {
                        vendorItem.itemNumber = catalogItem.itemNumber;
                        return this.Do_AddOrUpdateVendorItem(catalogItem, vendorItem);
                    }
                    return null;
                };
                ActionHandler.prototype.ForRevert_DeleteVendorItem = function (currentVendorItem) {
                    if (currentVendorItem === null || currentVendorItem === void 0 ? void 0 : currentVendorItem.IsFromWarehouse()) {
                        Log.Error("Revert not handle for WarehouseItem");
                        return "Revert not handle for WarehouseItem";
                    }
                    return currentVendorItem === null || currentVendorItem === void 0 ? void 0 : currentVendorItem.Delete();
                };
                ActionHandler.prototype.ForRevert_DeleteBoth = function (currentCatalogItem, currentVendorItem) {
                    if (currentCatalogItem && CServerHelper.IsCatalogItemDeletable(currentCatalogItem, currentVendorItem === null || currentVendorItem === void 0 ? void 0 : currentVendorItem.SourceNumber)) {
                        if (currentVendorItem === null || currentVendorItem === void 0 ? void 0 : currentVendorItem.IsFromWarehouse()) {
                            Log.Error("Revert not handle for WarehouseItem");
                            return "Revert not handle for WarehouseItem";
                        }
                        return currentCatalogItem.Delete();
                    }
                    else {
                        return this.ForRevert_DeleteVendorItem(currentVendorItem);
                    }
                };
                ActionHandler.prototype.ForRevert_AddOrUpdateVendorItem = function (previousVendorItem) {
                    if (previousVendorItem === null || previousVendorItem === void 0 ? void 0 : previousVendorItem.IsFromWarehouse()) {
                        Log.Error("Revert not handle for WarehouseItem");
                        return "Revert not handle for WarehouseItem";
                    }
                    return previousVendorItem === null || previousVendorItem === void 0 ? void 0 : previousVendorItem.SaveInDB(true);
                };
                ActionHandler.prototype.ForRevert_AddOrUpdateBoth = function (previousCatalogItem, previousVendorItem) {
                    var error = previousCatalogItem === null || previousCatalogItem === void 0 ? void 0 : previousCatalogItem.SaveInDB(false);
                    if (error) {
                        return error;
                    }
                    if (previousVendorItem) {
                        previousVendorItem.itemNumber = previousCatalogItem.itemNumber;
                        return this.ForRevert_AddOrUpdateVendorItem(previousVendorItem);
                    }
                    return null;
                };
                ActionHandler.prototype.NewStockTackingAndSave = function (vendorItem, itemName, unitOfMeasure) {
                    if (!vendorItem.IsFromWarehouse()) {
                        return Sys.Helpers.Promise.Resolve();
                    }
                    return vendorItem.QueryRealCurrentStock()
                        .Then(function (_a) {
                        var realCurrentStock = _a.currentStock;
                        vendorItem.stocktakingDateTime = new Date();
                        var stocktakingValue = vendorItem.currentStock;
                        var stocktakingBalancingValue = vendorItem.currentStock - realCurrentStock;
                        var movement = new Inventory.InventoryMovement();
                        movement.companyCode = vendorItem.companyCode;
                        movement.itemName = itemName;
                        movement.itemNumber = vendorItem.itemNumber;
                        movement.movementDateTime = vendorItem.stocktakingDateTime;
                        movement.movementOrigin = Data.GetValue("RUIDEX");
                        movement.movementType = "Stocktaking" /* Inventory.MovementType.Stocktaking */;
                        movement.movementValue = stocktakingValue;
                        movement.movementUnitPrice = vendorItem.unitPrice;
                        movement.currency = vendorItem.currency;
                        movement.unitOfMeasure = unitOfMeasure;
                        movement.warehouseID = vendorItem.warehouseNumber;
                        movement.warehouseName = vendorItem.warehouseName;
                        Inventory.CreateOrUpdateInventoryMovement(movement);
                        movement.movementType = "StocktakingBalancing" /* Inventory.MovementType.StocktakingBalancing */;
                        movement.movementValue = stocktakingBalancingValue;
                        movement.movementDateTime = new Date(vendorItem.stocktakingDateTime.getTime());
                        Inventory.CreateOrUpdateInventoryMovement(movement);
                        var saveError = vendorItem.SaveInDB();
                        if (saveError) {
                            throw saveError;
                        }
                        vendorItem.UpdateRealStockInDB(true, true, {
                            currentStock: vendorItem.currentStock,
                            totalPrice: new Sys.Decimal(vendorItem.currentStock || 0).mul(vendorItem.unitPrice || 0).toNumber(),
                            incomingStock: vendorItem.incomingStock,
                            reservedStock: vendorItem.reservedStock
                        });
                    });
                };
                return ActionHandler;
            }());
            var ActionAddedVendorItem = /** @class */ (function (_super) {
                __extends(ActionAddedVendorItem, _super);
                function ActionAddedVendorItem() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionAddedVendorItem.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_AddOrUpdateVendorItem(catalogItem, vendorItem);
                };
                ActionAddedVendorItem.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_DeleteVendorItem(currentVendorItem);
                };
                return ActionAddedVendorItem;
            }(ActionHandler));
            var ActionAddedCatalog = /** @class */ (function (_super) {
                __extends(ActionAddedCatalog, _super);
                function ActionAddedCatalog() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionAddedCatalog.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_AddOrUpdateBoth(catalogItem, null);
                };
                ActionAddedCatalog.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_DeleteBoth(currentCatalogItem, null);
                };
                return ActionAddedCatalog;
            }(ActionHandler));
            var ActionAddedBoth = /** @class */ (function (_super) {
                __extends(ActionAddedBoth, _super);
                function ActionAddedBoth() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionAddedBoth.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_AddOrUpdateBoth(catalogItem, vendorItem);
                };
                ActionAddedBoth.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_DeleteBoth(currentCatalogItem, currentVendorItem);
                };
                return ActionAddedBoth;
            }(ActionHandler));
            var ActionModifiedVendorItem = /** @class */ (function (_super) {
                __extends(ActionModifiedVendorItem, _super);
                function ActionModifiedVendorItem() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionModifiedVendorItem.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_AddOrUpdateVendorItem(catalogItem, vendorItem);
                };
                ActionModifiedVendorItem.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_AddOrUpdateVendorItem(previousVendorItem);
                };
                return ActionModifiedVendorItem;
            }(ActionHandler));
            var ActionModifiedCatalog = /** @class */ (function (_super) {
                __extends(ActionModifiedCatalog, _super);
                function ActionModifiedCatalog() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionModifiedCatalog.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_AddOrUpdateBoth(catalogItem, null);
                };
                ActionModifiedCatalog.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_AddOrUpdateBoth(previousCatalogItem, null);
                };
                return ActionModifiedCatalog;
            }(ActionHandler));
            var ActionModifiedBoth = /** @class */ (function (_super) {
                __extends(ActionModifiedBoth, _super);
                function ActionModifiedBoth() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionModifiedBoth.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_AddOrUpdateBoth(catalogItem, vendorItem);
                };
                ActionModifiedBoth.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_AddOrUpdateBoth(previousCatalogItem, previousVendorItem);
                };
                return ActionModifiedBoth;
            }(ActionHandler));
            var ActionModifiedCatalogAddVendorItem = /** @class */ (function (_super) {
                __extends(ActionModifiedCatalogAddVendorItem, _super);
                function ActionModifiedCatalogAddVendorItem() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionModifiedCatalogAddVendorItem.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_AddOrUpdateBoth(catalogItem, vendorItem);
                };
                ActionModifiedCatalogAddVendorItem.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_AddOrUpdateBoth(previousCatalogItem, null)
                        || this.ForRevert_DeleteVendorItem(currentVendorItem);
                };
                return ActionModifiedCatalogAddVendorItem;
            }(ActionHandler));
            var ActionDeletedVendorItem = /** @class */ (function (_super) {
                __extends(ActionDeletedVendorItem, _super);
                function ActionDeletedVendorItem() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionDeletedVendorItem.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_DeleteVendorItem(vendorItem);
                };
                ActionDeletedVendorItem.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_AddOrUpdateVendorItem(previousVendorItem);
                };
                return ActionDeletedVendorItem;
            }(ActionHandler));
            var ActionDeletedCatalog = /** @class */ (function (_super) {
                __extends(ActionDeletedCatalog, _super);
                function ActionDeletedCatalog() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionDeletedCatalog.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_DeleteBoth(catalogItem, null);
                };
                ActionDeletedCatalog.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_AddOrUpdateBoth(previousCatalogItem, null);
                };
                return ActionDeletedCatalog;
            }(ActionHandler));
            var ActionDeletedBoth = /** @class */ (function (_super) {
                __extends(ActionDeletedBoth, _super);
                function ActionDeletedBoth() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionDeletedBoth.prototype.DoAction = function (catalogItem, vendorItem) {
                    return this.Do_DeleteBoth(catalogItem, vendorItem);
                };
                ActionDeletedBoth.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return this.ForRevert_AddOrUpdateBoth(previousCatalogItem, previousVendorItem);
                };
                return ActionDeletedBoth;
            }(ActionHandler));
            var ActionNothing = /** @class */ (function (_super) {
                __extends(ActionNothing, _super);
                function ActionNothing() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                ActionNothing.prototype.DoAction = function (catalogItem, vendorItem) {
                    return null;
                };
                ActionNothing.prototype.RevertAction = function (currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem) {
                    return null;
                };
                return ActionNothing;
            }(ActionHandler));
            var ActionHandlerFactory = /** @class */ (function () {
                function ActionHandlerFactory() {
                    var _a;
                    this.handlers = {};
                    this.actionToHandlerMap = (_a = {},
                        _a["".concat(CM.ActionDone.Added, "_").concat(CM.ActionDone.Added)] = (ActionAddedBoth),
                        _a["".concat(CM.ActionDone.Added, "_").concat(CM.ActionDone.Nothing)] = (ActionAddedCatalog),
                        _a["".concat(CM.ActionDone.Modified, "_").concat(CM.ActionDone.Modified)] = (ActionModifiedBoth),
                        _a["".concat(CM.ActionDone.Modified, "_").concat(CM.ActionDone.Added)] = (ActionModifiedCatalogAddVendorItem),
                        _a["".concat(CM.ActionDone.Modified, "_").concat(CM.ActionDone.Nothing)] = (ActionModifiedCatalog),
                        _a["".concat(CM.ActionDone.Deleted, "_").concat(CM.ActionDone.Deleted)] = (ActionDeletedBoth),
                        _a["".concat(CM.ActionDone.Deleted, "_").concat(CM.ActionDone.Nothing)] = (ActionDeletedCatalog),
                        _a["".concat(CM.ActionDone.Nothing, "_").concat(CM.ActionDone.Added)] = (ActionAddedVendorItem),
                        _a["".concat(CM.ActionDone.Nothing, "_").concat(CM.ActionDone.Modified)] = (ActionModifiedVendorItem),
                        _a["".concat(CM.ActionDone.Nothing, "_").concat(CM.ActionDone.Deleted)] = (ActionDeletedVendorItem),
                        _a["".concat(CM.ActionDone.Nothing, "_").concat(CM.ActionDone.Nothing)] = (ActionNothing),
                        _a);
                }
                ActionHandlerFactory.prototype.Get = function (action) {
                    if (!this.handlers[action]) {
                        this.handlers[action] = new this.actionToHandlerMap[action]();
                    }
                    return this.handlers[action];
                };
                return ActionHandlerFactory;
            }());
            var CServerHelper = /** @class */ (function () {
                function CServerHelper(helper, helperWkf) {
                    this.linesToProcess = [];
                    this.tableValueExistenceCache = {};
                    this.supplyTypesCache = {};
                    this.supplyTypesCache2 = {};
                    this.companyCodeExistence = {};
                    this.helper = helper;
                    this.helperWkf = helperWkf;
                    this.actionHandlerFactory = new ActionHandlerFactory();
                    this.companyCode = Data.GetValue("CompanyCode__");
                    this.cmData = this.helper.GetExtractedData();
                    this.timeoutHelper = new TimeoutHelper();
                }
                CServerHelper.prototype.UpdateUNSPSCDependencies = function (result, vars, extractedData) {
                    var _this = this;
                    if (!Object.prototype.hasOwnProperty.call(extractedData, "SupplyTypeID")) {
                        var supplyTypeId_1 = result && result.length ? result[0].SupplyTypeId__ : "";
                        var customSupplyTypeId = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetSupplyTypeIdFromUNSPSC", extractedData.UNSPSC, supplyTypeId_1);
                        supplyTypeId_1 = customSupplyTypeId || supplyTypeId_1;
                        vars.AddValue_String("SupplyTypeID__", supplyTypeId_1, true);
                        // Fill Cost Type or Gl Account
                        if (!extractedData.CostType || !extractedData.GLAccount) {
                            if (Object.prototype.hasOwnProperty.call(this.supplyTypesCache, supplyTypeId_1)) {
                                if (!extractedData.CostType && this.supplyTypesCache[supplyTypeId_1].DefaultCostType__) {
                                    vars.AddValue_String("CostType__", this.supplyTypesCache[supplyTypeId_1].DefaultCostType__, true);
                                }
                                if (!extractedData.GLAccount && this.supplyTypesCache[supplyTypeId_1].DefaultGLAccount__) {
                                    vars.AddValue_String("ItemGLAccount__", this.supplyTypesCache[supplyTypeId_1].DefaultGLAccount__, true);
                                }
                            }
                            else {
                                var options = {
                                    table: "PurchasingSupply__",
                                    filter: "(&(SupplyID__=" + supplyTypeId_1 + ")(|(CompanyCode__=" + this.companyCode + ")(!(CompanyCode__=*))(CompanyCode__=)))",
                                    attributes: ["SupplyID__", "DefaultCostType__", "DefaultGLAccount__"],
                                    maxRecords: 1
                                };
                                Sys.GenericAPI.PromisedQuery(options)
                                    .Then(function (queryResult) {
                                    if (queryResult.length > 0 && queryResult[0]) {
                                        _this.supplyTypesCache[supplyTypeId_1] = queryResult[0];
                                        if (!extractedData.CostType && _this.supplyTypesCache[supplyTypeId_1].DefaultCostType__) {
                                            vars.AddValue_String("CostType__", _this.supplyTypesCache[supplyTypeId_1].DefaultCostType__, true);
                                        }
                                        if (!extractedData.GLAccount && _this.supplyTypesCache[supplyTypeId_1].DefaultGLAccount__) {
                                            vars.AddValue_String("ItemGLAccount__", _this.supplyTypesCache[supplyTypeId_1].DefaultGLAccount__, true);
                                        }
                                    }
                                    else {
                                        _this.supplyTypesCache[supplyTypeId_1] = null;
                                    }
                                });
                            }
                        }
                    }
                };
                CServerHelper.prototype.UpdateUNSPSCDependenciesV2 = function (result, catalogItem, extractedData) {
                    var _this = this;
                    if (!Object.prototype.hasOwnProperty.call(extractedData, "SupplyTypeID")) {
                        var supplyTypeId_2 = result && result.length ? result[0].SupplyTypeId__ : "";
                        var customSupplyTypeId = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetSupplyTypeIdFromUNSPSC", extractedData.UNSPSC, supplyTypeId_2);
                        supplyTypeId_2 = customSupplyTypeId || supplyTypeId_2;
                        catalogItem.supplytypeID = supplyTypeId_2;
                        // Fill Cost Type or Gl Account
                        if (!extractedData.CostType || !extractedData.GLAccount) {
                            if (Object.prototype.hasOwnProperty.call(this.supplyTypesCache2, supplyTypeId_2)) {
                                if (!extractedData.CostType && this.supplyTypesCache2[supplyTypeId_2].DefaultCostType__) {
                                    catalogItem.costType = this.supplyTypesCache2[supplyTypeId_2].DefaultCostType__;
                                }
                                if (!extractedData.GLAccount && this.supplyTypesCache2[supplyTypeId_2].DefaultGLAccount__) {
                                    catalogItem.glaccount = this.supplyTypesCache2[supplyTypeId_2].DefaultGLAccount__;
                                }
                            }
                            else {
                                var options = {
                                    table: "PurchasingSupply__",
                                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("SupplyID__", supplyTypeId_2), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", this.companyCode), Sys.Helpers.LdapUtil.FilterExist("CompanyCode__"), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""))).toString(),
                                    attributes: ["SupplyID__", "DefaultCostType__", "DefaultGLAccount__"],
                                    maxRecords: 1
                                };
                                Sys.GenericAPI.PromisedQuery(options)
                                    .Then(function (queryResult) {
                                    if (queryResult.length > 0 && queryResult[0]) {
                                        _this.supplyTypesCache2[supplyTypeId_2] = queryResult[0];
                                        if (!extractedData.CostType && _this.supplyTypesCache2[supplyTypeId_2].DefaultCostType__) {
                                            catalogItem.costType = _this.supplyTypesCache2[supplyTypeId_2].DefaultCostType__;
                                        }
                                        if (!extractedData.GLAccount && _this.supplyTypesCache2[supplyTypeId_2].DefaultGLAccount__) {
                                            catalogItem.glaccount = _this.supplyTypesCache2[supplyTypeId_2].DefaultGLAccount__;
                                        }
                                    }
                                    else {
                                        _this.supplyTypesCache2[supplyTypeId_2] = null;
                                    }
                                });
                            }
                        }
                    }
                };
                //Remove the part after the "&" of the vendor login
                CServerHelper.prototype.GetVendorShortLogin = function () {
                    var vendorLogin = Data.GetValue("RequesterLogin__");
                    if (vendorLogin && vendorLogin.indexOf("$") !== -1) {
                        vendorLogin = vendorLogin.substring(1 + vendorLogin.indexOf("$"));
                    }
                    return vendorLogin;
                };
                //Get all company code for the current vendor from AP - Vendors links__
                CServerHelper.prototype.GetVendorLinksInfos = function () {
                    var vendorLinksInfos = {};
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.SetSpecificTable("AP - Vendors links__");
                    query.SetAttributesList("CompanyCode__,Number__,Number__.Name__,CompanyCode__.CompanyName__");
                    query.SetFilter("ShortLoginPAC__=" + this.GetVendorShortLogin());
                    query.SetSortOrder("CompanyCode__.CompanyName__ ASC");
                    query.SetOptionEx("EnableJoin=1");
                    query.MoveFirst();
                    var firstRecord = true;
                    var record = query.MoveNextRecord();
                    while (record) {
                        var companyCode = record.GetVars().GetValue_String("CompanyCode__", 0);
                        var companyName = record.GetVars().GetValue_String("CompanyCode__.CompanyName__", 0);
                        var vendor = {
                            "CompanyName__": companyName ? companyName : companyCode,
                            "VendorNumber__": record.GetVars().GetValue_String("Number__", 0),
                            "VendorName__": record.GetVars().GetValue_String("Number__.Name__", 0)
                        };
                        if (!companyCode) {
                            vendorLinksInfos = {};
                            vendorLinksInfos["*"] = vendor;
                        }
                        vendorLinksInfos[companyCode] = vendor;
                        if (firstRecord) {
                            Data.SetValue("CompanyCode__", companyCode);
                            firstRecord = false;
                        }
                        Log.Info("Vendor Info retrieved for company code = " + companyCode + " is : " + JSON.stringify(vendor));
                        record = query.MoveNextRecord();
                    }
                    this.companyCode = this.GetLastCompanySelected() || Data.GetValue("CompanyCode__");
                    Data.SetValue("CompanyCode__", this.companyCode);
                    return vendorLinksInfos;
                };
                //Get the last company description selected in order to set the same value for the current Catalog management process
                CServerHelper.prototype.GetLastCompanySelected = function () {
                    var query = Process.CreateQuery();
                    query.Reset();
                    query.SetSpecificTable("CDNAME#Catalog management");
                    query.SetAttributesList("RUIDEX,SubmitDateTime,CompanyCode__,Status__");
                    query.SetSortOrder("SubmitDateTime DESC");
                    query.SetFilter("!(Status__=Draft)");
                    query.SetOptionEx("limit=1");
                    query.MoveFirst();
                    var record = query.MoveNextRecord();
                    if (record) {
                        return record.GetVars().GetValue_String("CompanyCode__", 0);
                    }
                    return null;
                };
                /**
                 * Only one CM can be sent into the WF
                 */
                CServerHelper.prototype.IsCMSubmitable = function () {
                    var query = Process.CreateQuery();
                    query.Reset();
                    query.SetSpecificTable("CDNAME#Catalog management");
                    query.SetAttributesList("RUIDEX,SubmitDateTime,Status__");
                    query.SetSortOrder("SubmitDateTime DESC");
                    query.SetFilter("(&(Status__=ToApprove)(CompanyCode__=" + Data.GetValue("CompanyCode__") + "))");
                    query.SetOptionEx("limit=1");
                    query.MoveFirst();
                    var record = query.MoveNextRecord();
                    return !record;
                };
                CServerHelper.prototype.IsValidDate = function (d) {
                    return d instanceof Date && !isNaN(d.getTime());
                };
                CServerHelper.prototype.IsValidCostType = function (c) {
                    return Sys.Helpers.IsEmpty(c) || c === "OpEx" || c === "CapEx";
                };
                CServerHelper.prototype.ParseConditionedPricing = function (lineObject) {
                    var conditionedPricing = Purchasing.ConditionedPricing.Factory.Get(lineObject[Purchasing.ConditionedPricing.CSVColumnName.type]);
                    delete lineObject[Purchasing.ConditionedPricing.CSVColumnName.type]; // prevent column to be added to ExtractedData
                    var counter = 0;
                    var thresholds = [];
                    while (lineObject[Purchasing.ConditionedPricing.CSVColumnName.threshold(++counter)]) {
                        var thresholdColumn = Purchasing.ConditionedPricing.CSVColumnName.threshold(counter);
                        var unitPriceColumn = Purchasing.ConditionedPricing.CSVColumnName.unitPrice(counter);
                        var baseColumn = Purchasing.ConditionedPricing.CSVColumnName.base(counter);
                        thresholds.push({
                            threshold: parseFloat(lineObject[thresholdColumn]),
                            unitPrice: parseFloat(lineObject[unitPriceColumn]),
                            base: parseFloat(lineObject[baseColumn])
                        });
                        // prevent columns to be added to ExtractedData
                        delete lineObject[thresholdColumn];
                        delete lineObject[unitPriceColumn];
                        delete lineObject[baseColumn];
                    }
                    conditionedPricing.SetThresholds(thresholds);
                    return JSON.stringify(conditionedPricing.ToData());
                };
                CServerHelper.prototype.TrimLineObject = function (lineObject) {
                    var keys = Object.keys(lineObject);
                    var keys_length = keys.length;
                    var value;
                    for (var i = 0; i < keys_length; i++) {
                        value = lineObject[keys[i]];
                        if (typeof value == "string") {
                            lineObject[keys[i]] = value.trim();
                        }
                    }
                };
                CServerHelper.prototype.CSVLineObjectIsEmpty = function (lineObject) {
                    if (!lineObject) {
                        return true;
                    }
                    for (var h in lineObject) {
                        if (!Sys.Helpers.IsFunction(lineObject[h])) {
                            if (lineObject[h]) {
                                return false;
                            }
                        }
                    }
                    return true;
                };
                CServerHelper.prototype.ExtractItemCustomField = function (item, lineObject) {
                    for (var keyField in lineObject) {
                        if (!(keyField in item.ExtractedData)
                            && !(this.helper.CSV_TO_EXTRACTED_DATA_MAPPING[keyField] in item.ExtractedData)
                            && !Sys.Helpers.IsEmpty(lineObject[keyField])
                            && !Sys.Helpers.IsFunction(lineObject[keyField])) {
                            item.ExtractedData[keyField] = lineObject[keyField];
                        }
                    }
                };
                CServerHelper.prototype.ExtractItems = function (csvReader) {
                    var items = {};
                    var itemsInError = [];
                    if (csvReader.Error) {
                        itemsInError.push(csvReader.Error);
                    }
                    var lineCount = 0;
                    var line = csvReader.Error ? null : csvReader.GetNextLine();
                    while (line !== null) {
                        lineCount++;
                        var lineObject = csvReader.GetCurrentLineObject();
                        if (!this.CSVLineObjectIsEmpty(lineObject)) {
                            var _a = this.GetLineObjectKeyIdentifier(lineObject), key = _a.key, keyType = _a.type;
                            Log.Info("Processing CSV line: " + key);
                            if (items[key]) {
                                itemsInError.push({
                                    LineNumber: lineCount,
                                    CSVLine: csvReader.GetCurrentLineArray().toString(),
                                    ErrorStatus: "_Duplicate line"
                                });
                            }
                            else {
                                try {
                                    this.TrimLineObject(lineObject);
                                    var csvErrorStatus = this.CheckLineObjectError(lineObject, key);
                                    if (csvErrorStatus) {
                                        // noinspection ExceptionCaughtLocallyJS
                                        throw csvErrorStatus;
                                    }
                                    var item = this.ExtractItem(lineObject, csvReader, key);
                                    item.UniqueKeyType = keyType;
                                    item.CSVLineNumber = lineCount;
                                    item.CSVLine = csvReader.GetCurrentLineArray().toString();
                                    items[key] = item;
                                }
                                catch (error) {
                                    itemsInError.push({
                                        LineNumber: lineCount,
                                        CSVLine: csvReader.GetCurrentLineArray().toString(),
                                        ErrorStatus: error.translationKey || error.message || error
                                    });
                                }
                            }
                        }
                        line = csvReader.GetNextLine();
                    }
                    Log.Info(lineCount + " lines parsed");
                    return {
                        items: items,
                        itemsInError: itemsInError
                    };
                };
                CServerHelper.prototype.PrepareImportJson = function () {
                    Log.Info("Build JSON from CSV");
                    var csvReader = this.GetCSVReader();
                    var _a = this.ExtractItems(csvReader), items = _a.items, itemsInError = _a.itemsInError;
                    var linesFilter = this.GetItemsFilter(items);
                    return this.CheckExistingItemAndSetActionToDo(items, linesFilter)
                        .Then(function (_a) {
                        var Lines = _a.Lines, ParsingError = _a.ParsingError;
                        return ({
                            Lines: Lines,
                            ParsingError: itemsInError.concat(ParsingError),
                            ProcessingError: []
                        });
                    });
                };
                CServerHelper.prototype.GetPreviousData = function (record) {
                    var vars = record.GetVars();
                    var catalogData = {};
                    var size = vars.GetNbAttributes();
                    for (var i = 0; i < size; ++i) {
                        var attrName = vars.GetAttribute(i);
                        if (attrName.endsWith("__")) {
                            catalogData[attrName] = vars.GetValue_String(attrName, 0);
                        }
                    }
                    return catalogData;
                };
                CServerHelper.IsCatalogItemDeletable = function (catalogItem, sourceNumberToIgnore) {
                    if (!(catalogItem === null || catalogItem === void 0 ? void 0 : catalogItem.ruidex)) {
                        return false;
                    }
                    var dependencies = sourceNumberToIgnore
                        ? catalogItem.vendorItems.filter(function (item) { return item.SourceNumber !== sourceNumberToIgnore; })
                        : catalogItem.vendorItems;
                    if (dependencies.length) {
                        Log.Warn("Catalog item can not be deleted : used in/by ".concat(dependencies.length, " other Warehouse(s) or Vendor(s)"));
                        return false;
                    }
                    return true;
                };
                CServerHelper.prototype.GetActionDone = function (catalogItem, vendorItem, csvItem) {
                    var usedSourceNumber = this.GetUsedSourceNumberProcessLine(csvItem);
                    var usedCompanyCode = this.GetUsedCompanyCodeProcessLine(csvItem);
                    switch (csvItem.ActionToDo) {
                        case CM.ActionToDo.Deleted:
                            if (!catalogItem) {
                                Log.Warn("Catalog Item does not exist. Nothing to delete");
                                return {
                                    catalogAction: CM.ActionDone.Nothing,
                                    catalogItem: null,
                                    supplierAction: CM.ActionDone.Nothing,
                                    vendorItem: null
                                };
                            }
                            else if (!vendorItem) {
                                if (CServerHelper.IsCatalogItemDeletable(catalogItem, null)) {
                                    return {
                                        catalogAction: CM.ActionDone.Deleted,
                                        catalogItem: catalogItem,
                                        supplierAction: CM.ActionDone.Nothing,
                                        vendorItem: null
                                    };
                                }
                                else {
                                    Log.Warn("Catalog Item can't be delete. Nothing to delete");
                                    return {
                                        catalogAction: CM.ActionDone.Nothing,
                                        catalogItem: catalogItem,
                                        supplierAction: CM.ActionDone.Nothing,
                                        vendorItem: null
                                    };
                                }
                            }
                            else {
                                if (CServerHelper.IsCatalogItemDeletable(catalogItem, vendorItem === null || vendorItem === void 0 ? void 0 : vendorItem.SourceNumber) &&
                                    (csvItem.UniqueKeyType === CM.UniqueKeyType.ByItemNumber || csvItem.UniqueKeyType === CM.UniqueKeyType.ByManufacturerPartID)) {
                                    return {
                                        catalogAction: CM.ActionDone.Deleted,
                                        catalogItem: catalogItem,
                                        supplierAction: CM.ActionDone.Deleted,
                                        vendorItem: vendorItem
                                    };
                                }
                                else {
                                    return {
                                        catalogAction: CM.ActionDone.Nothing,
                                        catalogItem: catalogItem,
                                        supplierAction: CM.ActionDone.Deleted,
                                        vendorItem: vendorItem
                                    };
                                }
                            }
                        case CM.ActionToDo.Added:
                        case CM.ActionToDo.Modified:
                            if (!catalogItem) {
                                var catalogItem_1 = new CatalogHelper.ProcurementItem();
                                catalogItem_1.companyCode = usedCompanyCode;
                                if (this.helperWkf.IsInternalUpdateRequest() && csvItem.ExtractedData.ItemNumber) {
                                    catalogItem_1.itemNumber = csvItem.ExtractedData.ItemNumber;
                                }
                                var vendorItem_1 = this.CreateNewVendorItem(catalogItem_1, usedSourceNumber);
                                return {
                                    catalogAction: CM.ActionDone.Added,
                                    catalogItem: catalogItem_1,
                                    supplierAction: CM.ActionDone.Added,
                                    vendorItem: vendorItem_1
                                };
                            }
                            else if (!vendorItem) {
                                var vendorItem_2 = this.CreateNewVendorItem(catalogItem, usedSourceNumber);
                                return {
                                    catalogAction: CM.ActionDone.Modified,
                                    catalogItem: catalogItem,
                                    supplierAction: CM.ActionDone.Added,
                                    vendorItem: vendorItem_2
                                };
                            }
                            else {
                                return {
                                    catalogAction: CM.ActionDone.Modified,
                                    catalogItem: catalogItem,
                                    supplierAction: CM.ActionDone.Modified,
                                    vendorItem: vendorItem
                                };
                            }
                        default:
                            throw Error("Invalid Action ToDo");
                    }
                };
                CServerHelper.prototype.DoAction = function (catalogAction, catalogItem, supplierAction, vendorItem, csvItem) {
                    var catalogActionWithRight = this.HandleCatalogActionRight(catalogAction);
                    var action = "".concat(catalogActionWithRight, "_").concat(supplierAction);
                    if (catalogItem) {
                        this.UpdateCatalogItemWithExtractedData(catalogItem, csvItem);
                    }
                    if (vendorItem) {
                        this.UpdateVendorItemWithExtractedData(vendorItem, csvItem);
                    }
                    Log.Info("Requested action <".concat(catalogAction, "_").concat(supplierAction, ">, action done: ").concat(action));
                    var error = this.actionHandlerFactory.Get(action).DoAction(catalogItem, vendorItem);
                    csvItem.ActionDone = { Catalog: catalogActionWithRight, Supplier: supplierAction };
                    csvItem.ExtractedData.ItemNumber = catalogItem === null || catalogItem === void 0 ? void 0 : catalogItem.itemNumber;
                    return error;
                };
                CServerHelper.prototype.ProcessLine = function (lineId, csvItem) {
                    var _this = this;
                    var filter = this.GetCatalogItemsFilterKeys(csvItem);
                    return CatalogHelper.GetItems([filter])
                        .Then(function (_a) {
                        var catalogItem = _a[0];
                        var usedSourceNumber = _this.GetUsedSourceNumberProcessLine(csvItem);
                        var vendorItem = catalogItem && usedSourceNumber
                            ? catalogItem.Find(usedSourceNumber)
                            : null;
                        csvItem.PreviousCatalogData = catalogItem === null || catalogItem === void 0 ? void 0 : catalogItem.GetRawData();
                        csvItem.PreviousSupplierData = vendorItem === null || vendorItem === void 0 ? void 0 : vendorItem.rawData;
                        var _b = _this.GetActionDone(catalogItem, vendorItem, csvItem), catalogAction = _b.catalogAction, catalogItemToUse = _b.catalogItem, supplierAction = _b.supplierAction, vendorItemToUse = _b.vendorItem;
                        var error = _this.DoAction(catalogAction, catalogItemToUse, supplierAction, vendorItemToUse, csvItem);
                        if (!error) {
                            csvItem.WriteDateTime = new Date();
                        }
                        else {
                            _this.cmData.ProcessingError.push({
                                LineId: lineId,
                                LineType: csvItem.ActionToDo,
                                ErrorStatus: "Commit : " + error
                            });
                        }
                        _this.timeoutHelper.NotifyIteration();
                    });
                };
                CServerHelper.prototype.ProcessLines = function () {
                    var _this = this;
                    Log.Info("Start ProcessLines for Catalog V2");
                    var promises = [];
                    this.linesToProcess.forEach(function (lineId) {
                        var csvItem = _this.cmData.Lines[lineId];
                        if (csvItem && Sys.Helpers.IsEmpty(csvItem.ActionDone)) {
                            promises.push(_this.ProcessLine(lineId, csvItem)
                                .Catch(function (error) {
                                Log.Error("ProcessLine: lineId: ".concat(lineId, ": ").concat(error));
                            }));
                        }
                    });
                    return Sys.Helpers.Promise.All(promises)
                        .Finally(function () {
                        Log.Info("End ProcessLines for Catalog V2");
                    });
                };
                CServerHelper.prototype.RevertLine = function (csvItem, lineId, currentCatalogItem) {
                    var usedVendorNumber = this.GetUsedSourceNumberForRevert(csvItem);
                    var currentVendorItem = currentCatalogItem && usedVendorNumber ? currentCatalogItem.Find(usedVendorNumber) : null;
                    var previousVendorItem = csvItem.PreviousSupplierData ? CatalogHelper.VendorItem.FromRawData(csvItem.PreviousSupplierData, true) : null;
                    var previousCatalogItem = csvItem.PreviousCatalogData ? CatalogHelper.ProcurementItem.FromRawData(csvItem.PreviousCatalogData) : null;
                    var actionDone = "".concat(csvItem.ActionDone.Catalog, "_").concat(csvItem.ActionDone.Supplier);
                    Log.Info("actionDone to revert: ".concat(actionDone));
                    var error = this.actionHandlerFactory.Get(actionDone).RevertAction(currentCatalogItem, previousCatalogItem, currentVendorItem, previousVendorItem);
                    if (!error) {
                        csvItem.WriteDateTime = new Date();
                    }
                    else {
                        this.cmData.ProcessingError.push({
                            LineId: lineId,
                            LineType: csvItem.ActionToDo,
                            ErrorStatus: "Revert: Commit: " + error
                        });
                    }
                    this.timeoutHelper.NotifyIteration();
                };
                CServerHelper.prototype.RevertLines = function () {
                    var _this = this;
                    Log.Info("Start RevertLines for Catalog V2");
                    var promises = [];
                    this.linesToProcess.reverse().forEach(function (lineId) {
                        var csvItem = _this.cmData.Lines[lineId];
                        if (csvItem && (csvItem.ActionDone.Catalog !== CM.ActionDone.Nothing || csvItem.ActionDone.Supplier !== CM.ActionDone.Nothing)) {
                            // Query Catalog Item
                            var filter_1 = {
                                itemNumber: csvItem.ExtractedData.ItemNumber
                            };
                            promises.push(CatalogHelper.GetItems([filter_1])
                                .Then(function (_a) {
                                var catalogItem = _a[0];
                                if (!catalogItem) {
                                    Log.Warn("No Catalog Item found with filter", JSON.stringify(filter_1));
                                }
                                return catalogItem;
                            })
                                .Then(function (catalogItem) {
                                _this.RevertLine(csvItem, lineId, catalogItem);
                            })
                                .Catch(function (error) {
                                Log.Error("RevertLine: lineId: ".concat(lineId, ": ").concat(error));
                            }));
                        }
                        else {
                            Log.Warn("Nothing to revert for item :", lineId);
                        }
                    });
                    return Sys.Helpers.Promise.All(promises)
                        .Finally(function () {
                        Log.Info("End RevertLines for Catalog V2");
                    });
                };
                CServerHelper.prototype.CompanyCodeExists = function (companyCode) {
                    var exists = false;
                    var key = companyCode;
                    if (Object.prototype.hasOwnProperty.call(this.companyCodeExistence, key)) {
                        exists = this.companyCodeExistence[key];
                    }
                    else {
                        var query = Process.CreateQueryAsProcessAdmin();
                        query.SetSpecificTable("PurchasingCompanycodes__");
                        var filter = Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode).toString();
                        query.SetFilter(filter);
                        if (query.MoveFirst() && query.MoveNext()) {
                            exists = true;
                        }
                        this.companyCodeExistence[key] = exists;
                    }
                    return exists;
                };
                CServerHelper.prototype.CurrencyExists = function (companyCode, currency) {
                    return this.TableValueExists("P2P - Exchange rate__", "CurrencyFrom__", currency, companyCode, true, true);
                };
                CServerHelper.prototype.UOMExists = function (companyCode, uom) {
                    return this.TableValueExists("P2P - UnitOfMeasure__", "UnitOfMeasure__", uom, companyCode, false, true);
                };
                CServerHelper.prototype.TableValueExists = function (tableName, tableKeyField, tableKeyValue, companyCode, allowEmptyCompanyCode, caseSensitive) {
                    if (allowEmptyCompanyCode === void 0) { allowEmptyCompanyCode = false; }
                    if (caseSensitive === void 0) { caseSensitive = false; }
                    var exists = false;
                    var key = companyCode + "_" + tableKeyValue;
                    if (!Object.prototype.hasOwnProperty.call(this.tableValueExistenceCache, tableName)) {
                        this.tableValueExistenceCache[tableName] = {};
                    }
                    var cache = this.tableValueExistenceCache[tableName];
                    if (Object.prototype.hasOwnProperty.call(cache, key)) {
                        exists = cache[key];
                    }
                    else {
                        var query = Process.CreateQueryAsProcessAdmin();
                        query.SetSpecificTable(tableName);
                        var filterCC = allowEmptyCompanyCode ?
                            Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode) :
                            Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode);
                        var filter = Sys.Helpers.LdapUtil.FilterAnd(filterCC, Sys.Helpers.LdapUtil.FilterEqual(tableKeyField, tableKeyValue)).toString();
                        query.SetFilter(filter);
                        var r = void 0;
                        if (query.MoveFirst() && (r = query.MoveNext())) {
                            if (caseSensitive) {
                                var rVars = r.GetUninheritedVars();
                                exists = rVars.GetValue_String(tableKeyField, 0) === tableKeyValue;
                            }
                            else {
                                exists = true;
                            }
                        }
                        cache[key] = exists;
                    }
                    return exists;
                };
                return CServerHelper;
            }());
            CM.CServerHelper = CServerHelper;
            var CServerHelperVendorItem = /** @class */ (function (_super) {
                __extends(CServerHelperVendorItem, _super);
                function CServerHelperVendorItem(helper, helperWkf) {
                    var _this = _super.call(this, helper, helperWkf) || this;
                    Log.Info("CServerHelperVendorItem");
                    _this.IsCatalogV2 = Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled();
                    _this.vendorNumberField = _this.IsCatalogV2 ? "ItemNumber__.VendorNumber__" : "VendorNumber__";
                    _this.vendorNumber = Data.GetValue("VendorNumber__");
                    _this.byItemNumberKeys = [
                        _this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ItemNumber
                    ];
                    _this.byManufacturerIDKeys = [
                        _this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ManufacturerID,
                        _this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ManufacturerName
                    ];
                    _this.bySupplierIDKeys = [
                        _this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.SupplierPartID,
                        _this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.SupplierAuxPartID
                    ];
                    _this.CatalogTableName = _this.IsCatalogV2 ? "P2P - CatalogItems__" : "PurchasingOrderedItems__";
                    _this.companyCodeField = _this.IsCatalogV2 ? "CompanyCode__" : "ItemCompanyCode__";
                    _this.itemNumberField = _this.IsCatalogV2 ? "ItemNumber__" : "ItemNumber__";
                    _this.supplierPartIDField = _this.IsCatalogV2 ? "ItemNumber__.SupplierPartID__" : "ItemNumber__";
                    _this.supplierPartAuxIDField = _this.IsCatalogV2 ? "ItemNumber__.SupplierPartAuxID__" : "ItemSupplierPartAuxID__";
                    _this.manufacturerIDField = "ManufacturerPartID__";
                    _this.manufacturerNameField = "ManufacturerName__";
                    return _this;
                }
                /**
                 * If we could not take the lock, return false
                 * @returns {boolean}
                 */
                CServerHelperVendorItem.prototype.ProcessedData = function (callBack) {
                    if (this.helperWkf.IsInternalUpdateRequest() && !this.IsCatalogV2) {
                        var CC_VN_pairs = {};
                        for (var lineId in this.cmData.Lines) {
                            if (Object.prototype.hasOwnProperty.call(this.cmData.Lines, lineId)) {
                                var key = this.cmData.Lines[lineId].ExtractedData.CompanyCode + "_" + this.cmData.Lines[lineId].ExtractedData.VendorNumber;
                                if (Object.prototype.hasOwnProperty.call(CC_VN_pairs, key)) {
                                    CC_VN_pairs[key][lineId] = this.cmData.Lines[lineId];
                                }
                                else {
                                    CC_VN_pairs[key] = {};
                                    CC_VN_pairs[key][lineId] = this.cmData.Lines[lineId];
                                }
                            }
                        }
                        //reset error before processing
                        this.cmData.ProcessingError = [];
                        for (var CC_VN in CC_VN_pairs) {
                            if (Object.prototype.hasOwnProperty.call(CC_VN_pairs, CC_VN)) {
                                this.linesToProcess = Object.keys(CC_VN_pairs[CC_VN]);
                                var tab = CC_VN.split("_");
                                var criticalSection = this.GetCriticalSection(tab[0], tab[1]);
                                // Protect concurrent access on impacted catalog
                                var lockOk = Process.PreventConcurrentAccess(criticalSection, callBack, null, 30);
                                if (!lockOk) {
                                    return false;
                                }
                            }
                        }
                    }
                    else {
                        //reset error before processing
                        this.cmData.ProcessingError = [];
                        this.linesToProcess = Object.keys(this.cmData.Lines);
                        if (this.IsCatalogV2) {
                            callBack(); // need wait promise, but we are in server side
                        }
                        else {
                            var criticalSection = this.GetCriticalSection(this.companyCode, this.vendorNumber);
                            // Protect concurrent access on impacted catalog
                            var lockOk = Process.PreventConcurrentAccess(criticalSection, callBack, null, 30);
                            if (!lockOk) {
                                return false;
                            }
                        }
                    }
                    this.helper.SetExtractedData(this.cmData);
                    return true;
                };
                /**
                 * Returns a critical section name to prevent concurrent access on catalog.
                 * @param {string} companyCode companyCode we want to lock
                 * @param {string} vendorNumber vendor number we want to lock
                 * @returns {string} critical section name
                 */
                CServerHelperVendorItem.prototype.GetCriticalSection = function (companyCode, vendorNumber) {
                    return "cataloglck" + companyCode + vendorNumber;
                };
                CServerHelperVendorItem.prototype.HandleCatalogActionRight = function (action) {
                    if (!this.helperWkf.IsInternalUpdateRequest()) {
                        switch (action) {
                            case CM.ActionDone.Modified:
                            case CM.ActionDone.Deleted:
                                return CM.ActionDone.Nothing;
                            default:
                                return action;
                        }
                    }
                    return action;
                };
                // TODO - PAC2 : on V2 Release : Refacto filter generation : Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled()
                CServerHelperVendorItem.prototype.GetItemFilter = function (item) {
                    var _a;
                    var itemFilter = [];
                    if (item.UniqueKeyType === CM.UniqueKeyType.ByItemNumber) {
                        itemFilter.push(LdapUtil.FilterEqual(this.itemNumberField, item.ExtractedData.ItemNumber));
                    }
                    else if (item.UniqueKeyType === CM.UniqueKeyType.ByManufacturerPartID) {
                        itemFilter.push(LdapUtil.FilterEqual(this.manufacturerIDField, item.ExtractedData.ManufacturerID), LdapUtil.FilterEqual(this.manufacturerNameField, item.ExtractedData.ManufacturerName));
                        if (this.helperWkf.IsInternalUpdateRequest()) {
                            itemFilter.push(LdapUtil.FilterEqual(this.companyCodeField, item.ExtractedData.CompanyCode));
                        }
                    }
                    else {
                        itemFilter.push(LdapUtil.FilterEqual(this.supplierPartIDField, item.ExtractedData.SupplierPartID));
                        itemFilter.push(LdapUtil.FilterEqual(this.supplierPartAuxIDField, item.ExtractedData.SupplierAuxPartID));
                        if (this.helperWkf.IsInternalUpdateRequest()) {
                            itemFilter.push(LdapUtil.FilterEqual(this.companyCodeField, item.ExtractedData.CompanyCode));
                            itemFilter.push(LdapUtil.FilterEqual(this.vendorNumberField, item.ExtractedData.VendorNumber));
                        }
                    }
                    return (_a = Sys.Helpers.LdapUtil).FilterAnd.apply(_a, itemFilter);
                };
                CServerHelperVendorItem.prototype.CreateNewVendorItem = function (catalogItem, usedSourceNumber) {
                    if (usedSourceNumber) {
                        var vendorItem = catalogItem.AddVendorItem();
                        vendorItem.vendorNumber = usedSourceNumber;
                        return vendorItem;
                    }
                    return null;
                };
                CServerHelperVendorItem.prototype.UpdateCatalogItemWithExtractedData = function (catalogItem, csvItem) {
                    var _this = this;
                    catalogItem.description = csvItem.ExtractedData.Name;
                    catalogItem.longDescription = csvItem.ExtractedData.Description;
                    catalogItem.manufacturerName = csvItem.ExtractedData.ManufacturerName;
                    catalogItem.manufacturerPartID = csvItem.ExtractedData.ManufacturerID;
                    catalogItem.UOM = csvItem.ExtractedData.UOM;
                    catalogItem.costType = csvItem.ExtractedData.CostType;
                    catalogItem.glaccount = csvItem.ExtractedData.GLAccount;
                    catalogItem.unspsc = csvItem.ExtractedData.UNSPSC;
                    catalogItem.image = csvItem.ExtractedData.img;
                    if (Sys.Parameters.GetInstance("PAC").GetParameter("DisplayItemType")) {
                        catalogItem.itemType = csvItem.ExtractedData.ItemType;
                    }
                    if (csvItem.ExtractedData.UNSPSC) {
                        Lib.Purchasing.Items.QueryUNSPSCSupplyType(csvItem.ExtractedData.UNSPSC)
                            .Then(function (result) {
                            _this.UpdateUNSPSCDependenciesV2(result, catalogItem, csvItem.ExtractedData);
                        });
                    }
                    Sys.Helpers.Object.ForEach(csvItem.ExtractedData, function (value, attr) {
                        // non mapped field only for internal requests
                        if (_this.helperWkf.IsInternalUpdateRequest() && !_this.helper.EXTRACTED_DATA_TO_CSV_MAPPING[attr]) {
                            var attribute = CatalogHelper.NormalizeAttribute(attr);
                            if (CatalogHelper.ProcurementItem.IsCSVCatalogAttribute(attribute)) {
                                catalogItem.customFields[attribute] = value;
                            }
                        }
                    });
                };
                CServerHelperVendorItem.prototype.UpdateVendorItemWithExtractedData = function (vendorItem, csvItem) {
                    var _this = this;
                    vendorItem.validityDate = csvItem.ExtractedData.StartDate
                        ? new Date(csvItem.ExtractedData.StartDate)
                        : null;
                    vendorItem.expirationDate = csvItem.ExtractedData.EndDate
                        ? new Date(csvItem.ExtractedData.EndDate)
                        : null;
                    vendorItem.priceConditionData = csvItem.ExtractedData.ConditionedPricing;
                    if (vendorItem.priceConditionData) {
                        var firstUnitPrice = Purchasing.ConditionedPricing.Factory.FromData(JSON.parse(vendorItem.priceConditionData)).GetFirstThresholdUnitPrice();
                        vendorItem.unitPrice = firstUnitPrice.toNumber();
                    }
                    else {
                        vendorItem.unitPrice = csvItem.ExtractedData.UnitPrice;
                    }
                    vendorItem.currency = csvItem.ExtractedData.Currency;
                    vendorItem.leadtime = csvItem.ExtractedData.LeadTime;
                    if (!vendorItem.ruidex) {
                        vendorItem.supplierPartID = csvItem.ExtractedData.SupplierPartID;
                        vendorItem.supplierPartAuxID = csvItem.ExtractedData.SupplierAuxPartID;
                    }
                    // non mapped field only for internal requests
                    if (this.helperWkf.IsInternalUpdateRequest()) {
                        Sys.Helpers.Object.ForEach(csvItem.ExtractedData, function (value, attr) {
                            // non mapped field only for internal requests
                            if (!_this.helper.EXTRACTED_DATA_TO_CSV_MAPPING[attr]) {
                                var attribute = CatalogHelper.NormalizeAttribute(attr);
                                if (CatalogHelper.VendorItem.IsCSVVendorAttribute(attribute)) {
                                    vendorItem.customFields[attribute] = value;
                                }
                            }
                        });
                    }
                };
                CServerHelperVendorItem.prototype.GetCatalogItemsFilterKeys = function (csvItem) {
                    var filter = {};
                    if (this.helperWkf.IsInternalUpdateRequest() && csvItem.UniqueKeyType === CM.UniqueKeyType.ByItemNumber) {
                        filter.itemNumber = csvItem.ExtractedData.ItemNumber;
                    }
                    else if (this.helperWkf.IsInternalUpdateRequest() && csvItem.UniqueKeyType === CM.UniqueKeyType.ByManufacturerPartID) {
                        filter.manufacturerID = csvItem.ExtractedData.ManufacturerID;
                        filter.manufacturerName = csvItem.ExtractedData.ManufacturerName;
                        filter.companyCode = this.helperWkf.IsInternalUpdateRequest() ? csvItem.ExtractedData.CompanyCode : this.companyCode;
                    }
                    else {
                        filter.companyCode = this.helperWkf.IsInternalUpdateRequest() ? csvItem.ExtractedData.CompanyCode : this.companyCode;
                        filter.supplierID = this.helperWkf.IsInternalUpdateRequest() ? csvItem.ExtractedData.VendorNumber : this.vendorNumber;
                        filter.supplierPartID = csvItem.ExtractedData.SupplierPartID;
                        filter.supplierPartAuxID = csvItem.ExtractedData.SupplierAuxPartID;
                    }
                    return filter;
                };
                CServerHelperVendorItem.prototype.ProcessLineV1 = function (lineId, csvItem) {
                    var _this = this;
                    var extractedData = csvItem.ExtractedData;
                    var record = this.GetRecord(lineId, csvItem);
                    if (record) {
                        csvItem.PreviousCatalogData = this.GetPreviousData(record);
                    }
                    if (csvItem.ActionToDo === CM.ActionToDo.Deleted) {
                        if (record) {
                            var ret = record.Delete();
                            if (ret) {
                                this.cmData.ProcessingError.push({
                                    LineId: lineId,
                                    LineType: CM.ActionDone.Deleted,
                                    ErrorStatus: "Delete : " + record.GetLastErrorMessage(),
                                    Error: ret
                                });
                            }
                            else {
                                csvItem.WriteDateTime = new Date();
                                csvItem.ActionDone.Supplier = CM.ActionDone.Deleted;
                            }
                        }
                        else {
                            csvItem.WriteDateTime = new Date();
                            csvItem.ActionDone.Supplier = CM.ActionDone.Nothing;
                        }
                    }
                    else {
                        var actionToDo = void 0;
                        if (!record) {
                            actionToDo = CM.ActionDone.Added;
                            record = Process.CreateTableRecordAsProcessAdmin(this.CatalogTableName);
                        }
                        else {
                            actionToDo = CM.ActionDone.Modified;
                        }
                        var vars_1 = record.GetVars();
                        for (var attr in extractedData) {
                            if (Object.prototype.hasOwnProperty.call(extractedData, attr)) {
                                if (this.helper.EXTRACTED_DATA_TO_CATALOG_MAPPING[attr]) {
                                    vars_1.AddValue_String(this.helper.EXTRACTED_DATA_TO_CATALOG_MAPPING[attr], extractedData[attr], true);
                                }
                                else if (this.helperWkf.IsInternalUpdateRequest()) {
                                    vars_1.AddValue_String(attr + "__", extractedData[attr], true);
                                }
                            }
                        }
                        if (this.helperWkf.IsInternalUpdateRequest()) {
                            if (Sys.Parameters.GetInstance("PAC").GetParameter("DisplayItemType")) {
                                vars_1.AddValue_String("ItemType__", extractedData.ItemType, true);
                            }
                        }
                        else {
                            vars_1.AddValue_String("ItemCompanyCode__", this.companyCode, true);
                            vars_1.AddValue_String("VendorNumber__", this.vendorNumber, true);
                        }
                        if (extractedData.UNSPSC) {
                            Lib.Purchasing.Items.QueryUNSPSCSupplyType(extractedData.UNSPSC)
                                .Then(function (result) {
                                _this.UpdateUNSPSCDependencies(result, vars_1, extractedData);
                            });
                        }
                        var ret = record.Commit();
                        if (ret) {
                            this.cmData.ProcessingError.push({
                                LineId: lineId,
                                LineType: csvItem.ActionToDo,
                                ErrorStatus: "Commit : " + record.GetLastErrorMessage(),
                                Error: ret
                            });
                        }
                        else {
                            csvItem.WriteDateTime = new Date();
                            csvItem.ActionDone = actionToDo;
                        }
                    }
                    this.timeoutHelper.NotifyIteration();
                };
                CServerHelperVendorItem.prototype.GetUsedSourceNumberProcessLine = function (csvItem) {
                    return this.helperWkf.IsInternalUpdateRequest() ? csvItem.ExtractedData.VendorNumber : this.vendorNumber;
                };
                CServerHelperVendorItem.prototype.GetUsedCompanyCodeProcessLine = function (csvItem) {
                    return this.helperWkf.IsInternalUpdateRequest() ? csvItem.ExtractedData.CompanyCode : this.companyCode;
                };
                CServerHelperVendorItem.prototype.ProcessLine = function (lineId, csvItem) {
                    if (this.IsCatalogV2) {
                        return _super.prototype.ProcessLine.call(this, lineId, csvItem);
                    }
                    else {
                        this.ProcessLineV1(lineId, csvItem);
                        return Sys.Helpers.Promise.Resolve();
                    }
                };
                CServerHelperVendorItem.prototype.GetUsedSourceNumberForRevert = function (csvItem) {
                    return csvItem.ActionDone.Supplier === CM.ActionDone.Added ? csvItem.ExtractedData.VendorNumber : csvItem.PreviousSupplierData["ITEMNUMBER__.VENDORNUMBER__"];
                };
                CServerHelperVendorItem.prototype.RevertLines = function () {
                    if (this.IsCatalogV2) {
                        return this.RevertLinesV2();
                    }
                    Log.Info("Start RevertLines");
                    for (var _i = 0, _a = this.linesToProcess; _i < _a.length; _i++) {
                        var lineId = _a[_i];
                        if (Object.prototype.hasOwnProperty.call(this.cmData.Lines, lineId)) {
                            var item = this.cmData.Lines[lineId];
                            var previousData = __assign(__assign({}, item.PreviousCatalogData), item.PreviousSupplierData);
                            var record = this.GetRecord(lineId, item);
                            if (item.ActionDone.Supplier === CM.ActionDone.Added) {
                                if (record) {
                                    var ret = record.Delete();
                                    if (ret) {
                                        this.cmData.ProcessingError.push({
                                            LineId: lineId,
                                            LineType: CM.ActionDone.Deleted,
                                            ErrorStatus: "Delete : " + record.GetLastErrorMessage(),
                                            Error: ret
                                        });
                                    }
                                }
                            }
                            else if (item.ActionDone.Supplier === CM.ActionDone.Modified || item.ActionDone.Supplier === CM.ActionDone.Deleted) {
                                if (!record) // item.ActionDone === "Deleted"
                                 {
                                    record = Process.CreateTableRecordAsProcessAdmin(this.CatalogTableName);
                                }
                                var vars = record.GetVars();
                                for (var attr in previousData) {
                                    if (Object.prototype.hasOwnProperty.call(previousData, attr)) {
                                        vars.AddValue_String(attr, previousData[attr], true);
                                    }
                                }
                                var ret = record.Commit();
                                if (ret) {
                                    this.cmData.ProcessingError.push({
                                        LineId: lineId,
                                        LineType: item.ActionToDo,
                                        ErrorStatus: "Commit : " + record.GetLastErrorMessage(),
                                        Error: ret
                                    });
                                }
                            }
                            this.timeoutHelper.NotifyIteration();
                        }
                    }
                    Log.Info("End RevertLines");
                    return Sys.Helpers.Promise.Resolve();
                };
                CServerHelperVendorItem.prototype.RevertLinesV2 = function () {
                    return _super.prototype.RevertLines.call(this);
                };
                CServerHelperVendorItem.prototype.GetRecord = function (lineId, item) {
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.SetSpecificTable("CDNAME#" + this.CatalogTableName);
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ItemCompanyCode__", this.helperWkf.IsInternalUpdateRequest() ? item.ExtractedData.CompanyCode : this.companyCode), Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__", item.ExtractedData.SupplierPartID), Sys.Helpers.LdapUtil.FilterEqual("ItemSupplierPartAuxID__", item.ExtractedData.SupplierAuxPartID), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", this.helperWkf.IsInternalUpdateRequest() ? item.ExtractedData.VendorNumber : this.vendorNumber)).toString();
                    query.SetFilter(filter);
                    if (!query.MoveFirst()) {
                        this.cmData.ProcessingError.push({
                            LineId: lineId,
                            LineType: item.ActionToDo,
                            ErrorStatus: "Find : " + query.GetLastErrorMessage(),
                            Error: query.GetLastError()
                        });
                    }
                    return query.MoveNextRecord();
                };
                CServerHelperVendorItem.prototype.CheckExistingItemAndSetActionToDo = function (items, ldapFilter) {
                    var _this = this;
                    // TODO - PAC2 : on V2 Release : Use CatalogHelper.GetItems : Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled()
                    var queryOptions = {
                        table: this.CatalogTableName,
                        filter: ldapFilter.toString(),
                        attributes: [this.itemNumberField, this.companyCodeField, this.vendorNumberField, this.supplierPartIDField, this.supplierPartAuxIDField],
                        additionalOptions: {
                            asAdmin: true
                        }
                    };
                    if (this.IsCatalogV2) {
                        queryOptions.additionalOptions.queryOptions = "EnableJoin=1";
                    }
                    return Sys.GenericAPI.PromisedQuery(queryOptions)
                        .Then(function (results) {
                        var _loop_1 = function (key) {
                            if (Object.prototype.hasOwnProperty.call(items, key)) {
                                var expectedCompanyCode_1 = _this.helperWkf.IsInternalUpdateRequest() ? items[key].ExtractedData.CompanyCode : _this.companyCode;
                                var expectedVendorNumber_1 = _this.helperWkf.IsInternalUpdateRequest() ? items[key].ExtractedData.VendorNumber : _this.vendorNumber;
                                var found = Sys.Helpers.Object.Find(results, function (data) {
                                    var resultFounded;
                                    if (items[key].UniqueKeyType === CM.UniqueKeyType.ByItemNumber) {
                                        resultFounded = data[_this.itemNumberField] == items[key].ExtractedData.ItemNumber;
                                    }
                                    else if (items[key].UniqueKeyType === CM.UniqueKeyType.ByManufacturerPartID) {
                                        resultFounded = data[_this.manufacturerIDField] == items[key].ExtractedData.ManufacturerID
                                            && data[_this.manufacturerNameField] === items[key].ExtractedData.ManufacturerName
                                            && data[_this.companyCodeField] == expectedCompanyCode_1;
                                    }
                                    else {
                                        resultFounded = data[_this.supplierPartIDField] == items[key].ExtractedData.SupplierPartID
                                            && data[_this.supplierPartAuxIDField] == items[key].ExtractedData.SupplierAuxPartID
                                            && data[_this.companyCodeField] == expectedCompanyCode_1
                                            && data[_this.vendorNumberField] == expectedVendorNumber_1;
                                    }
                                    return resultFounded;
                                });
                                if (items[key].ExtractedData.deleted) {
                                    items[key].ActionToDo = CM.ActionToDo.Deleted;
                                }
                                else if (found) {
                                    items[key].ActionToDo = CM.ActionToDo.Modified;
                                }
                                else {
                                    items[key].ActionToDo = CM.ActionToDo.Added;
                                }
                            }
                        };
                        for (var key in items) {
                            _loop_1(key);
                        }
                        return {
                            Lines: items,
                            ParsingError: []
                        };
                    });
                };
                CServerHelperVendorItem.prototype.Init = function () {
                    if (Sys.Helpers.IsEmpty(Variable.GetValueAsString("vendorLinksInfos"))) {
                        this.InitCompaniesAndVendorInfos();
                    }
                };
                CServerHelperVendorItem.prototype.InitCompaniesAndVendorInfos = function () {
                    var vendorLinksInfos = this.GetVendorLinksInfos();
                    Variable.SetValueAsString("vendorLinksInfos", JSON.stringify(vendorLinksInfos));
                    var companyCode = Data.GetValue("CompanyCode__");
                    if (vendorLinksInfos[companyCode]) {
                        Data.SetValue("VendorNumber__", vendorLinksInfos[companyCode]["VendorNumber__"]);
                        Data.SetValue("VendorName__", vendorLinksInfos[companyCode]["VendorName__"]);
                        Log.Info("VendorNumber found : " + Data.GetValue("VendorNumber__"));
                        Log.Info("VendorName found : " + Data.GetValue("VendorName__"));
                    }
                    else if (vendorLinksInfos["*"]) {
                        Data.SetValue("VendorNumber__", vendorLinksInfos["*"]["VendorNumber__"]);
                        Data.SetValue("VendorName__", vendorLinksInfos["*"]["VendorName__"]);
                        Log.Info("VendorNumber found : " + Data.GetValue("VendorNumber__"));
                        Log.Info("VendorName found : " + Data.GetValue("VendorName__"));
                    }
                    this.vendorNumber = Data.GetValue("VendorNumber__");
                };
                CServerHelperVendorItem.prototype.LineObjectToExtractedData = function (lineObject) {
                    var unitPrice = parseFloat(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UnitPrice]);
                    var leadTime = parseInt(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.LeadTime], 10);
                    var startDate = Sys.Helpers.Date.ISOSTringToDate(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.StartDate]);
                    var endDate = Sys.Helpers.Date.ISOSTringToDate(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.EndDate]);
                    return {
                        ItemNumber: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ItemNumber],
                        Name: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.Name],
                        Description: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.Description],
                        SupplierPartID: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.SupplierPartID],
                        SupplierAuxPartID: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.SupplierAuxPartID],
                        ManufacturerName: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ManufacturerName],
                        ManufacturerID: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ManufacturerID],
                        UnitPrice: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UnitPrice] ? unitPrice : null,
                        Currency: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.Currency],
                        LeadTime: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.LeadTime] ? leadTime : null,
                        UOM: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UOM],
                        UNSPSC: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UNSPSC],
                        StartDate: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.StartDate] ? Sys.Helpers.Date.Date2DBDate(startDate) : null,
                        EndDate: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.EndDate] ? Sys.Helpers.Date.Date2DBDate(endDate) : null,
                        img: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.img],
                        deleted: Sys.Helpers.String.ToBoolean(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.deleted]),
                        ConditionedPricing: lineObject[Purchasing.ConditionedPricing.CSVColumnName.type] ? this.ParseConditionedPricing(lineObject) : ""
                    };
                };
                CServerHelperVendorItem.prototype.GetLineObjectKeyIdentifier = function (lineObject) {
                    var lineCompanyCode = this.helperWkf.IsInternalUpdateRequest() ? lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CompanyCode] : this.companyCode;
                    var lineVendorID = this.helperWkf.IsInternalUpdateRequest() ? lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.VendorNumber] : this.vendorNumber;
                    var keyType;
                    var key;
                    if (this.helperWkf.IsInternalUpdateRequest() && this.HasItemNumberKey(lineObject)) {
                        keyType = CM.UniqueKeyType.ByItemNumber;
                        key = [
                            lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ItemNumber],
                            lineVendorID
                        ].join("-");
                    }
                    else if (this.helperWkf.IsInternalUpdateRequest() && this.HasManufacturerKey(lineObject)) {
                        keyType = CM.UniqueKeyType.ByManufacturerPartID;
                        key = [
                            lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ManufacturerID],
                            lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ManufacturerName],
                            lineCompanyCode,
                            lineVendorID
                        ].join("-");
                    }
                    else {
                        keyType = CM.UniqueKeyType.BySupplierPartID;
                        key = [
                            lineCompanyCode,
                            lineVendorID,
                            lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.SupplierPartID],
                            lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.SupplierAuxPartID]
                        ].join("-");
                    }
                    return {
                        key: key,
                        type: keyType
                    };
                };
                CServerHelperVendorItem.prototype.ExtractItem = function (lineObject, csvReader, key) {
                    var item = {
                        ExtractedData: this.LineObjectToExtractedData(lineObject),
                        UniqueKeyType: null,
                        CSVLineNumber: null,
                        CSVLine: csvReader.GetCurrentLineArray().toString()
                    };
                    if (this.helperWkf.IsInternalUpdateRequest()) {
                        item.ExtractedData.CostType = lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CostType];
                        item.ExtractedData.CompanyCode = lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CompanyCode];
                        item.ExtractedData.VendorNumber = lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.VendorNumber];
                        item.ExtractedData.ItemNumber = lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ItemNumber];
                        this.ExtractItemCustomField(item, lineObject);
                    }
                    return item;
                };
                CServerHelperVendorItem.prototype.GetItemsFilter = function (items) {
                    var _this = this;
                    var linesFilterArray = Object.keys(items)
                        .map(function (k) { return _this.GetItemFilter(items[k]); });
                    var linesFilter = LdapUtil.FilterOr.apply(LdapUtil, linesFilterArray);
                    var additionalFilters = [];
                    // TODO - PAC2 : on V2 Release : refacto filter generation : Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled()
                    if (!this.helperWkf.IsInternalUpdateRequest()) {
                        var ccFilter = LdapUtil.FilterEqual(this.companyCodeField, this.companyCode);
                        var vendorFilter = LdapUtil.FilterEqual(this.vendorNumberField, this.vendorNumber);
                        additionalFilters.push(ccFilter, vendorFilter);
                    }
                    if (this.IsCatalogV2) {
                        additionalFilters.push(LdapUtil.FilterOr(LdapUtil.FilterNotExist("ITEMNUMBER__.WAREHOUSENUMBER__"), LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", "")));
                    }
                    return additionalFilters.length ? LdapUtil.FilterAnd.apply(LdapUtil, __spreadArray(__spreadArray([], additionalFilters, false), [linesFilter], false)) : linesFilter;
                };
                CServerHelperVendorItem.prototype.CheckLineObjectError = function (lineObject, key) {
                    var unitPrice = parseFloat(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UnitPrice]);
                    var leadTime = parseInt(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.LeadTime], 10);
                    var startDate = Sys.Helpers.Date.ISOSTringToDate(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.StartDate]);
                    var endDate = Sys.Helpers.Date.ISOSTringToDate(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.EndDate]);
                    var lineCompanyCode = this.helperWkf.IsInternalUpdateRequest() ? lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CompanyCode] : this.companyCode;
                    var csvErrorStatus;
                    if ((csvErrorStatus = this.CSVLineHasValidUniqueIdentifier(lineObject, key)) !== null) {
                        return csvErrorStatus;
                    }
                    if (Sys.Helpers.String.ToBoolean(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.deleted])) {
                        //item will be deleted, no more check needed
                        return null;
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UnitPrice] && (isNaN(unitPrice) || unitPrice <= 0)) {
                        Log.Warn("Item " + key + " has invalid UnitPrice:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UnitPrice]);
                        return "_Invalid unit price";
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.LeadTime] && (isNaN(leadTime) || leadTime <= 0)) {
                        Log.Warn("Item " + key + " has invalid LeadTime:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.LeadTime]);
                        return "_Invalid LeadTime, required number";
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.StartDate] && !this.IsValidDate(startDate)) {
                        Log.Warn("Item " + key + " has invalid StartDate:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.StartDate]);
                        return "_Invalid StartDate, required YYYY-MM-DD format";
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.EndDate] && !this.IsValidDate(endDate)) {
                        Log.Warn("Item " + key + " has invalid EndDate:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.EndDate]);
                        return "_Invalid EndDate, required YYYY-MM-DD format";
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UNSPSC] && lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UNSPSC].length != 8) {
                        Log.Warn("Item " + key + " has invalid UNSPSC:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UNSPSC]);
                        return "_Invalid UNSPSC, UNSPSC has a length of 8 number";
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.Currency] && !this.CurrencyExists(lineCompanyCode, lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.Currency])) {
                        Log.Warn("Item " + key + " has invalid Currency:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.Currency]);
                        return "_Invalid Currency";
                    }
                    if (lineObject[Purchasing.ConditionedPricing.CSVColumnName.type]) {
                        if (!(lineObject[Purchasing.ConditionedPricing.CSVColumnName.type] in Purchasing.ConditionedPricing.Type)) {
                            Log.Warn("Item " + key + " has invalid Conditioned Pricing Type");
                            return "_Invalid Conditioned Pricing : Unknow type";
                        }
                        if (!lineObject[Purchasing.ConditionedPricing.CSVColumnName.threshold(1)]) {
                            Log.Warn("Item " + key + " has no Threshold for Conditioned Pricing");
                            return "_Invalid Conditioned Pricing : No threshold";
                        }
                    }
                    if (this.helperWkf.IsInternalUpdateRequest()) {
                        if (!this.IsValidCostType(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CostType])) {
                            Log.Warn("Item " + key + " has invalid Cost Type");
                            return "_Invalid Cost Type, required CapEx or OpEx or Empty";
                        }
                        if (!Sys.Helpers.IsEmpty(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UOM]) && !this.UOMExists(lineCompanyCode, lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UOM])) {
                            Log.Warn("Item " + key + " has invalid UOM");
                            return "_Invalid unit of measure";
                        }
                    }
                    return null;
                };
                CServerHelperVendorItem.prototype.VendorExists = function (companyCode, vendorNumber) {
                    return this.TableValueExists("AP - Vendors__", "Number__", vendorNumber, companyCode, false, true);
                };
                CServerHelperVendorItem.prototype.HasManufacturerKey = function (lineObject) {
                    var lineCompanyCode = this.helperWkf.IsInternalUpdateRequest() ? lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CompanyCode] : this.companyCode;
                    return !Sys.Helpers.IsEmpty(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ManufacturerID])
                        && (Sys.Helpers.IsEmpty(lineCompanyCode) || this.CompanyCodeExists(lineCompanyCode));
                };
                CServerHelperVendorItem.prototype.HasItemNumberKey = function (lineObject) {
                    return this.byItemNumberKeys.every(function (key) { return !Sys.Helpers.IsEmpty(lineObject[key]); });
                };
                CServerHelperVendorItem.prototype.HasSupplierKey = function (lineObject) {
                    var lineCompanyCode = this.helperWkf.IsInternalUpdateRequest() ? lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CompanyCode] : this.companyCode;
                    var lineVendorNumber = this.helperWkf.IsInternalUpdateRequest() ? lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.VendorNumber] : this.vendorNumber;
                    return !Sys.Helpers.IsEmpty(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.SupplierPartID])
                        && (Sys.Helpers.IsEmpty(lineCompanyCode) || this.CompanyCodeExists(lineCompanyCode))
                        && (Sys.Helpers.IsEmpty(lineVendorNumber) || this.VendorExists(lineCompanyCode, lineVendorNumber));
                };
                CServerHelperVendorItem.prototype.CSVLineHasValidUniqueIdentifier = function (lineObject, key) {
                    var isValid = false;
                    if (this.helperWkf.IsInternalUpdateRequest()) {
                        var lineCompanyCode = lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CompanyCode];
                        var lineVendorNumber = lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.VendorNumber];
                        if (!Sys.Helpers.IsEmpty(lineCompanyCode) && !this.CompanyCodeExists(lineCompanyCode)) {
                            Log.Warn("Item " + key + " references a company code that doesn't exist");
                            return "_CompanyCode doesn't exist";
                        }
                        if (!Sys.Helpers.IsEmpty(lineVendorNumber) && !this.VendorExists(lineCompanyCode, lineVendorNumber)) {
                            Log.Warn("Item " + key + " references a vendor that doesn't exist");
                            return "_Vendor doesn't exist";
                        }
                        isValid = this.HasItemNumberKey(lineObject) || this.HasManufacturerKey(lineObject);
                    }
                    if (!isValid && !this.HasSupplierKey(lineObject)) {
                        Log.Error("Item ".concat(key, " is missing unique identifier : ItemNumber, or CC + ManufacturerPartID + ManufacturerName, or CC + VendorNumber + SupplierPartID"));
                        return this.helperWkf.IsInternalUpdateRequest() ? "_Unique identifier required" : "_Portal Unique identifier required";
                    }
                    return null;
                };
                CServerHelperVendorItem.prototype.GetCSVReader = function () {
                    Log.Info("Get the input CSV reader");
                    // Read the first attachment "0" with the reader V2
                    var csvReader = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                    csvReader.ReturnSeparator = "\n";
                    // read first line (Header line) and guess the separator
                    csvReader.GuessSeparator();
                    // Check key here
                    var error = "";
                    if (this.IsCatalogV2) {
                        var hasIdentifier = false;
                        if (this.helperWkf.IsInternalUpdateRequest()) {
                            hasIdentifier = this.byItemNumberKeys.every(function (key) { return csvReader.GetHeaderIndex(key) > -1; })
                                || this.byManufacturerIDKeys.every(function (key) { return csvReader.GetHeaderIndex(key) > -1; });
                        }
                        hasIdentifier = hasIdentifier || this.bySupplierIDKeys.every(function (key) { return csvReader.GetHeaderIndex(key) > -1; });
                        if (!hasIdentifier) {
                            error = this.helperWkf.IsInternalUpdateRequest() ? "_Unique column identifier required" : "_Missing key column SupplierPartID or SupplierAuxPartID";
                        }
                    }
                    else {
                        if (!this.bySupplierIDKeys.every(function (key) { return csvReader.GetHeaderIndex(key) > -1; })) {
                            error = "_Missing key column SupplierPartID or SupplierAuxPartID";
                        }
                        if (this.helperWkf.IsInternalUpdateRequest()) {
                            var isByVendorNumberKey = [
                                this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CompanyCode,
                                this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.VendorNumber
                            ].every(function (key) { return csvReader.GetHeaderIndex(key) > -1; });
                            if (!isByVendorNumberKey) {
                                error = "_Missing key column CompanyCode or VendorNumber";
                            }
                        }
                    }
                    if (error) {
                        csvReader.Error = {
                            CSVLine: csvReader.GetCurrentLineArray().toString(),
                            LineNumber: 1,
                            ErrorStatus: error
                        };
                    }
                    return csvReader;
                };
                return CServerHelperVendorItem;
            }(CServerHelper));
            CM.CServerHelperVendorItem = CServerHelperVendorItem;
            var CServerHelperWarehouseItem = /** @class */ (function (_super) {
                __extends(CServerHelperWarehouseItem, _super);
                function CServerHelperWarehouseItem(helper, helperWkf, companyCode, warehouseId) {
                    var _this = _super.call(this, helper, helperWkf) || this;
                    Log.Info("CServerHelperWarehouseItem");
                    _this.warehouseId = warehouseId;
                    _this.companyCode = companyCode;
                    _this.cached_Currency = null;
                    return _this;
                }
                CServerHelperWarehouseItem.prototype.GetCSVReader = function () {
                    Log.Info("Get the input CSV reader");
                    // Read the first attachment "0" with the reader V2
                    var csvReader = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                    csvReader.ReturnSeparator = "\n";
                    // read first line (Header line) and guess the separator
                    csvReader.GuessSeparator();
                    if (csvReader.GetHeaderIndex(this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ItemNumber) === -1) {
                        csvReader.Error = {
                            CSVLine: csvReader.GetCurrentLineArray().toString(),
                            LineNumber: 1,
                            ErrorStatus: "_Item Number required"
                        };
                    }
                    return csvReader;
                };
                CServerHelperWarehouseItem.prototype.LineObjectToExtractedData = function (lineObject) {
                    var lineMinimumThreshold = lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.MinimumThreshold];
                    var lineExpectedStockLevel = lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ExpectedStockLevel];
                    var lineLeadTime = lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.LeadTime];
                    return {
                        ItemNumber: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ItemNumber],
                        CurrentStock: parseFloat(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CurrentStock]) || 0,
                        MinimumThreshold: lineMinimumThreshold ? parseFloat(lineMinimumThreshold) || 0 : null,
                        ExpectedStockLevel: lineExpectedStockLevel ? parseFloat(lineExpectedStockLevel) || 0 : null,
                        LeadTime: lineLeadTime ? parseInt(lineLeadTime, 10) || 0 : null,
                        UnitPrice: parseFloat(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UnitPrice]) || 0
                    };
                };
                CServerHelperWarehouseItem.prototype.CheckLineObjectError = function (lineObject, key) {
                    if (!lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ItemNumber]) {
                        return "_Item Number required";
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.WarehouseID] && Data.GetValue("WarehouseNumber__") && lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.WarehouseID] != Data.GetValue("WarehouseNumber__")) {
                        Log.Warn("Item " + key + " has another warehouse number");
                        return "_Invalid warehouseID";
                    }
                    if (!lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CurrentStock]) {
                        Log.Warn("Item " + key + " has no Current Stock");
                        return "_Current Stock required";
                    }
                    var currentStock = parseFloat(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CurrentStock]);
                    if (isNaN(currentStock) || currentStock < 0) {
                        Log.Warn("Item " + key + " has invalid Current Stock:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.CurrentStock]);
                        return "_Invalid Current Stock";
                    }
                    if (!lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UnitPrice]) {
                        Log.Warn("Item " + key + " has no Unit Price");
                        return "_WarehouseItem_unit_price_required";
                    }
                    var unitPrice = parseFloat(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UnitPrice]);
                    if (isNaN(unitPrice) || unitPrice < 0) {
                        Log.Warn("Item " + key + " has invalid Unit Price:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.UnitPrice]);
                        return "_Invalid warehouseItem Unit Price";
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.MinimumThreshold]) {
                        var minimumThreshold = parseFloat(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.MinimumThreshold]);
                        if (isNaN(minimumThreshold) || minimumThreshold < 0) {
                            Log.Warn("Item " + key + " has invalid Minimum Threshold:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.MinimumThreshold]);
                            return "_Invalid Minimum Threshold";
                        }
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ExpectedStockLevel]) {
                        var expectedStockLevel = parseFloat(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ExpectedStockLevel]);
                        if (isNaN(expectedStockLevel) || expectedStockLevel < 0) {
                            Log.Warn("Item " + key + " has invalid Expected StockLevel:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ExpectedStockLevel]);
                            return "_Invalid Expected StockLevel";
                        }
                    }
                    if (lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.LeadTime]) {
                        var leadTime = parseFloat(lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.LeadTime]);
                        if (isNaN(leadTime) || leadTime < 0) {
                            Log.Warn("Item " + key + " has invalid Lead Time:" + lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.LeadTime]);
                            return "_Invalid Lead Time";
                        }
                    }
                    return null;
                };
                CServerHelperWarehouseItem.prototype.GetLineObjectKeyIdentifier = function (lineObject) {
                    return {
                        key: lineObject[this.helper.EXTRACTED_DATA_TO_CSV_MAPPING.ItemNumber],
                        type: CM.UniqueKeyType.ByItemNumber
                    };
                };
                CServerHelperWarehouseItem.prototype.ExtractItem = function (lineObject, csvReader, key) {
                    var item = {
                        ExtractedData: this.LineObjectToExtractedData(lineObject),
                        CSVLine: csvReader.GetCurrentLineArray().toString(),
                        UniqueKeyType: null,
                        CSVLineNumber: null
                    };
                    this.ExtractItemCustomField(item, lineObject);
                    return item;
                };
                CServerHelperWarehouseItem.prototype.GetItemFilter = function (item) {
                    return LdapUtil.FilterEqual("ITEMNUMBER__", item.ExtractedData.ItemNumber);
                };
                CServerHelperWarehouseItem.prototype.HandleCatalogActionRight = function (action) {
                    switch (action) {
                        case CM.ActionDone.Added:
                        case CM.ActionDone.Modified:
                        case CM.ActionDone.Deleted:
                        case CM.ActionDone.Nothing:
                            return CM.ActionDone.Nothing;
                        default:
                            throw Error("Invalid ActionDone: " + action);
                    }
                };
                CServerHelperWarehouseItem.prototype.CheckItem = function (item, foundCatalogItem) {
                    if (!foundCatalogItem) {
                        return "_CatalogItem_must_already_exist";
                    }
                    if (foundCatalogItem["ITEMTYPE__"] !== Lib.P2P.ItemType.QUANTITY_BASED) {
                        return "_Only_Quantity_based_item_type_are_allow_in_warehouse";
                    }
                    return null;
                };
                CServerHelperWarehouseItem.prototype.CheckExistingItemAndSetActionToDo = function (items, ldapFilter) {
                    var _this = this;
                    return Sys.GenericAPI.PromisedQuery({
                        table: "P2P - CatalogItems__",
                        filter: ldapFilter.toString(),
                        attributes: [
                            "ITEMNUMBER__",
                            "COMPANYCODE__",
                            "ITEMNUMBER__.WAREHOUSENUMBER__",
                            "ITEMTYPE__"
                        ],
                        additionalOptions: {
                            asAdmin: true,
                            queryOptions: "EnableJoin=1"
                        }
                    })
                        .Then(function (results) {
                        var parsingError = [];
                        var keys = Object.keys(items);
                        var _loop_2 = function (key) {
                            var item = items[key];
                            var foundCatalogItem = Sys.Helpers.Object.Find(results, function (data) {
                                return data["ITEMNUMBER__"] === item.ExtractedData.ItemNumber;
                            });
                            var foundWarehouseItem = Sys.Helpers.Object.Find(results, function (data) {
                                return data["ITEMNUMBER__"] === item.ExtractedData.ItemNumber &&
                                    data["ITEMNUMBER__.WAREHOUSENUMBER__"] === _this.warehouseId;
                            });
                            if (foundWarehouseItem) {
                                item.ActionToDo = CM.ActionToDo.Modified;
                            }
                            else {
                                item.ActionToDo = CM.ActionToDo.Added;
                            }
                            var error = _this.CheckItem(item, foundCatalogItem);
                            if (error) {
                                parsingError.push({
                                    LineNumber: item.CSVLineNumber,
                                    CSVLine: item.CSVLine,
                                    ErrorStatus: error
                                });
                                delete items[key];
                            }
                        };
                        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                            var key = keys_1[_i];
                            _loop_2(key);
                        }
                        return {
                            Lines: items,
                            ParsingError: parsingError
                        };
                    });
                };
                CServerHelperWarehouseItem.prototype.GetItemsFilter = function (items) {
                    var _this = this;
                    var linesFilters = Object.keys(items)
                        .map(function (k) { return _this.GetItemFilter(items[k]); });
                    return LdapUtil.FilterAnd(LdapUtil.FilterEqual("COMPANYCODE__", this.companyCode), LdapUtil.FilterOr.apply(LdapUtil, linesFilters));
                };
                CServerHelperWarehouseItem.prototype.CreateNewVendorItem = function (catalogItem, usedSourceNumber) {
                    if (usedSourceNumber) {
                        var vendorItem = catalogItem.AddVendorItem();
                        vendorItem.warehouseNumber = usedSourceNumber;
                        return vendorItem;
                    }
                    return null;
                };
                CServerHelperWarehouseItem.prototype.GetWarehouseCurrency = function () {
                    var _this = this;
                    if (!this.cached_Currency) {
                        Sys.GenericAPI.PromisedQuery({
                            table: "PurchasingCompanycodes__",
                            filter: LdapUtil.FilterEqual("CompanyCode__", this.companyCode),
                            attributes: ["Currency__"],
                            maxRecords: 1
                        })
                            .Then(function (_a) {
                            var Currency__ = _a[0].Currency__;
                            return _this.cached_Currency = Currency__;
                        }); // Ugly ='(
                    }
                    return this.cached_Currency;
                };
                CServerHelperWarehouseItem.prototype.UpdateCatalogItemWithExtractedData = function (catalogItem, csvItem) {
                };
                CServerHelperWarehouseItem.prototype.UpdateVendorItemWithExtractedData = function (warehouseItem, csvItem) {
                    var _this = this;
                    warehouseItem.UpdateCurrentStockAndAvailable(csvItem.ExtractedData.CurrentStock);
                    warehouseItem.minimumThreshold = csvItem.ExtractedData.MinimumThreshold;
                    warehouseItem.expectedStockLevel = csvItem.ExtractedData.ExpectedStockLevel;
                    warehouseItem.leadtime = csvItem.ExtractedData.LeadTime;
                    warehouseItem.unitPrice = csvItem.ExtractedData.UnitPrice;
                    warehouseItem.currency = this.GetWarehouseCurrency();
                    Sys.Helpers.Object.ForEach(csvItem.ExtractedData, function (value, attr) {
                        if (!_this.helper.EXTRACTED_DATA_TO_CSV_MAPPING[attr]) {
                            var attribute = CatalogHelper.NormalizeAttribute(attr);
                            if (CatalogHelper.VendorItem.IsCSVWarehouseAttribute(attribute)) {
                                warehouseItem.customFields[attribute] = value;
                            }
                        }
                    });
                };
                CServerHelperWarehouseItem.prototype.GetCatalogItemsFilterKeys = function (csvItem) {
                    return {
                        itemNumber: csvItem.ExtractedData.ItemNumber
                    };
                };
                CServerHelperWarehouseItem.prototype.GetUsedSourceNumberProcessLine = function (csvItem) {
                    return this.warehouseId;
                };
                CServerHelperWarehouseItem.prototype.GetUsedCompanyCodeProcessLine = function (csvItem) {
                    return this.companyCode;
                };
                CServerHelperWarehouseItem.prototype.ProcessedData = function (callBack) {
                    this.cmData.ProcessingError = [];
                    this.linesToProcess = Object.keys(this.cmData.Lines);
                    callBack(); // need wait promise, but we are in server side
                    this.helper.SetExtractedData(this.cmData);
                    return true;
                };
                CServerHelperWarehouseItem.prototype.GetUsedSourceNumberForRevert = function (csvItem) {
                    return this.warehouseId;
                };
                CServerHelperWarehouseItem.prototype.RevertLines = function () {
                    // Revert not handle for warehouse
                    return Sys.Helpers.Promise.Reject("Revert not handle for warehouse");
                };
                CServerHelperWarehouseItem.prototype.Init = function () {
                };
                return CServerHelperWarehouseItem;
            }(CServerHelper));
            CM.CServerHelperWarehouseItem = CServerHelperWarehouseItem;
        })(CM = Purchasing.CM || (Purchasing.CM = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
