/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CatalogHelper_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_ConditionedPricing_V12.0.461.0",
    "[Lib_P2P_Customization_Common]",
    "Lib_P2P_Currency_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper.SupplyTypesManager_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper.ConditionedPricing_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_LdapUtil",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "Sys/Sys_OnDemand_Users"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var CatalogHelper;
        (function (CatalogHelper) {
            var Factory = Lib.P2P.Currency.Factory;
            var ldaputil = Sys.Helpers.LdapUtil;
            // Load Catalog Customizations
            var _a = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetExtraCatalogProperties") || {}, _b = _a.catalogFields, customCatalogPrivateProps = _b === void 0 ? [] : _b, _c = _a.catalogCSVFields, customCatalogProps = _c === void 0 ? [] : _c, _d = _a.vendorFields, customVendorPrivateProps = _d === void 0 ? [] : _d, _e = _a.vendorCSVFields, customVendorProps = _e === void 0 ? [] : _e, _f = _a.warehouseFields, customWarehousePrivateProps = _f === void 0 ? [] : _f, _g = _a.warehouseCSVFields, customWarehouseProps = _g === void 0 ? [] : _g;
            function IsMultiSupplierItemEnabled() {
                return Sys.Parameters.GetInstance("P2P").GetParameter("EnableMultiSupplierItem", false);
            }
            CatalogHelper.IsMultiSupplierItemEnabled = IsMultiSupplierItemEnabled;
            function NormalizeAttribute(attribute) {
                attribute = attribute.trim().toUpperCase();
                if (!Sys.Helpers.String.endsWith("RUIDEX", attribute) && !Sys.Helpers.String.endsWith("__", attribute)) {
                    attribute += "__";
                }
                return attribute;
            }
            CatalogHelper.NormalizeAttribute = NormalizeAttribute;
            var VendorItem = /** @class */ (function () {
                function VendorItem(QueryResult, fromCatalogItemQuery) {
                    if (fromCatalogItemQuery === void 0) { fromCatalogItemQuery = false; }
                    var _this = this;
                    this.toDelete = false;
                    this._rawData = {};
                    // Used for CSV Import
                    this.customFields = {};
                    var prefix = fromCatalogItemQuery ? "ITEMNUMBER__." : "";
                    if (QueryResult) {
                        this.ruidex = QueryResult.GetValue(prefix + "RUIDEX");
                        this.companyCode = QueryResult.GetValue("COMPANYCODE__");
                        this.itemNumber = QueryResult.GetValue("ITEMNUMBER__");
                        this.supplierPartID = QueryResult.GetValue(prefix + "SUPPLIERPARTID__");
                        this.supplierPartAuxID = QueryResult.GetValue(prefix + "SUPPLIERPARTAUXID__");
                        this.unitPrice = new Sys.Decimal(QueryResult.GetValue(prefix + "UNITPRICE__") || 0).toNumber();
                        this.publicPrice = Sys.Helpers.IsNumeric(QueryResult.GetValue(prefix + "PUBLICPRICE__")) ? QueryResult.GetValue(prefix + "PUBLICPRICE__") : null;
                        this.currency = QueryResult.GetValue(prefix + "CURRENCY__");
                        this.punchoutsitename = QueryResult.GetValue(prefix + "PUNCHOUTSITENAME__");
                        this.leadtime = Sys.Helpers.IsNumeric(QueryResult.GetValue(prefix + "LEADTIME__")) ? QueryResult.GetValue(prefix + "LEADTIME__") : null;
                        this.expirationDate = QueryResult.GetValue(prefix + "EXPIRATIONDATE__");
                        this.validityDate = QueryResult.GetValue(prefix + "VALIDITYDATE__");
                        this.contractRuidex = QueryResult.GetValue(prefix + "CONTRACTRUIDEX__");
                        this.contractNumber = QueryResult.GetValue(prefix + "CONTRACTNUMBER__");
                        this.contractName = QueryResult.GetValue(prefix + "CONTRACTNAME__");
                        this.priceConditionData = QueryResult.GetValue(prefix + "PRICECONDITIONDATA__");
                        this.availableStock = parseFloat(QueryResult.GetValue(prefix + "AVAILABLESTOCK__")) || 0;
                        this.currentStock = parseFloat(QueryResult.GetValue(prefix + "CURRENTSTOCK__")) || 0;
                        this.reservedStock = parseFloat(QueryResult.GetValue(prefix + "RESERVEDSTOCK__")) || 0;
                        this.incomingStock = parseFloat(QueryResult.GetValue(prefix + "INCOMINGSTOCK__")) || 0;
                        this.stocktakingDateTime = QueryResult.GetValue(prefix + "STOCKTAKINGDATETIME__") || new Date();
                        this.minimumThreshold = Sys.Helpers.IsNumeric(QueryResult.GetValue(prefix + "MINIMUMTHRESHOLD__")) ? QueryResult.GetValue(prefix + "MINIMUMTHRESHOLD__") : null;
                        this.expectedStockLevel = Sys.Helpers.IsNumeric(QueryResult.GetValue(prefix + "EXPECTEDSTOCKLEVEL__")) ? QueryResult.GetValue(prefix + "EXPECTEDSTOCKLEVEL__") : null;
                        this.defaultReplenishmentVendorNumber = QueryResult.GetValue(prefix + "DEFAULTREPLENISHMENTVENDORNUMBER__");
                        this.defaultReplenishmentVendorName = QueryResult.GetValue(prefix + "DEFAULTREPLENISHMENTVENDORNUMBER__.NAME__");
                        this.vendorNumber = QueryResult.GetValue(prefix + "VENDORNUMBER__");
                        this.vendorName = QueryResult.GetValue(prefix + "VENDORNUMBER__.NAME__");
                        this.vendorSub = QueryResult.GetValue(prefix + "VENDORNUMBER__.SUB__");
                        this.vendorToPOBox = QueryResult.GetValue(prefix + "VENDORNUMBER__.POSTOFFICEBOX__");
                        this.vendorStreet = QueryResult.GetValue(prefix + "VENDORNUMBER__.STREET__");
                        this.vendorCity = QueryResult.GetValue(prefix + "VENDORNUMBER__.CITY__");
                        this.vendorPostalCode = QueryResult.GetValue(prefix + "VENDORNUMBER__.POSTALCODE__");
                        this.vendorRegion = QueryResult.GetValue(prefix + "VENDORNUMBER__.REGION__");
                        this.vendorCountry = QueryResult.GetValue(prefix + "VENDORNUMBER__.COUNTRY__");
                        this.warehouseNumber = QueryResult.GetValue(prefix + "WAREHOUSENUMBER__");
                        this.warehouseName = QueryResult.GetValue(prefix + "WAREHOUSENUMBER__.NAME__");
                        this.warehouseManager = QueryResult.GetValue(prefix + "WAREHOUSENUMBER__.WAREHOUSEMANAGERLOGIN__");
                        this.warehouseDescription = QueryResult.GetValue(prefix + "WAREHOUSENUMBER__.DESCRIPTION__");
                        this.locked = QueryResult.GetValue(prefix + "LOCKED__");
                        VendorItem.CustomAttributes.forEach(function (attr) {
                            var attribute = prefix + NormalizeAttribute(attr);
                            var value = QueryResult.GetValue(attribute);
                            if (value !== null) {
                                _this.customFields[attribute] = value;
                            }
                        });
                        VendorItem.Attributes.forEach(function (attribute) {
                            if (attribute === "COMPANYCODE__" || attribute === "ITEMNUMBER__") {
                                _this._rawData[attribute] = QueryResult.GetValue(attribute);
                            }
                            else {
                                _this._rawData[prefix + attribute] = QueryResult.GetValue(prefix + attribute);
                            }
                        });
                    }
                    else {
                        this.stocktakingDateTime = new Date();
                        this.locked = true;
                    }
                }
                Object.defineProperty(VendorItem.prototype, "rawData", {
                    get: function () {
                        return this._rawData;
                    },
                    enumerable: false,
                    configurable: true
                });
                VendorItem.FromRawData = function (rawData, fromCatalogItemQuery) {
                    if (fromCatalogItemQuery === void 0) { fromCatalogItemQuery = false; }
                    var fakeQueryResult = {
                        record: null,
                        fieldToTypeMap: {},
                        GetValue: function (field) {
                            return rawData[field];
                        }
                    };
                    return new VendorItem(fakeQueryResult, fromCatalogItemQuery);
                };
                VendorItem.IsCSVVendorAttribute = function (attribute) {
                    var attr = NormalizeAttribute(attribute);
                    return VendorItem.VendorCSVAttributes.indexOf(attr) > -1;
                };
                VendorItem.IsCSVWarehouseAttribute = function (attribute) {
                    var attr = NormalizeAttribute(attribute);
                    return VendorItem.WarehouseCSVAttributes.indexOf(attr) > -1;
                };
                VendorItem.prototype.UpdateFromFormData = function (item, itemNumber, isVendor) {
                    if (isVendor === void 0) { isVendor = true; }
                    this.itemNumber = itemNumber;
                    this.companyCode = Data.GetValue("CompanyCode__");
                    this.currency = item.GetValue("Currency__");
                    this.leadtime = item.IsNullOrEmpty("LeadTime__") ? null : item.GetValue("LeadTime__");
                    this.supplierPartID = item.GetValue("SupplierPartID__");
                    this.supplierPartAuxID = item.GetValue("SupplierPartAuxID__");
                    this.locked = true;
                    if (isVendor) {
                        this.expirationDate = item.GetValue("ExpirationDate__");
                        this.priceConditionData = item.GetValue("PriceConditionData__");
                        this.publicPrice = item.GetValue("PublicPrice__");
                        this.punchoutsitename = item.GetValue("PunchoutSiteName__");
                        this.validityDate = item.GetValue("ValidityDate__");
                        this.vendorNumber = item.GetValue("VendorNumber__");
                        this.unitPrice = item.GetValue("UnitPrice__");
                        this.contractName = item.GetValue("ContractName__");
                        this.contractRuidex = item.GetValue("ContractRUIDEX__");
                        this.contractNumber = item.GetValue("ContractNumber__");
                    }
                    else {
                        this.expectedStockLevel = item.GetValue("ExpectedStockLevel__");
                        this.minimumThreshold = item.GetValue("MinimumThreshold__");
                        this.warehouseNumber = item.GetValue("WarehouseNumber__");
                        this.defaultReplenishmentVendorNumber = item.GetValue("DefaultReplenishmentVendorNumber__");
                    }
                };
                VendorItem.prototype.UpdateFromReplenishmentData = function (item) {
                    this.companyCode = Data.GetValue("CompanyCode__");
                    this.currency = item.GetValue("Currency__");
                    this.warehouseNumber = item.GetValue("WarehouseID__");
                    this.warehouseName = item.GetValue("WarehouseName__");
                    this.unitPrice = item.GetValue("UnitPrice__");
                };
                VendorItem.prototype.UpdateCurrentStockAndAvailable = function (newCurrentStock) {
                    this.currentStock = newCurrentStock || 0;
                    this.availableStock = new Sys.Decimal(this.currentStock || 0)
                        .minus(this.reservedStock || 0)
                        .toNumber();
                };
                VendorItem.prototype.SaveInDB = function (updateStock) {
                    if (updateStock === void 0) { updateStock = false; }
                    var exists = !!this.ruidex;
                    var record = exists ? Process.GetUpdatableTableRecord(this.ruidex) : Process.CreateTableRecord("P2P - VendorItems__");
                    var error = "";
                    if (this.toDelete) {
                        error = this.Delete();
                    }
                    else if (record) {
                        var newVars_1 = record.GetVars();
                        newVars_1.AddValue_String("CompanyCode__", this.companyCode, true);
                        newVars_1.AddValue_String("Currency__", this.currency, true);
                        newVars_1.AddValue_String("ItemNumber__", this.itemNumber, true);
                        newVars_1.AddValue_String("Locked__", this.locked, true);
                        newVars_1.AddValue_String("UnitPrice__", this.unitPrice || "", true);
                        if (this.IsFromVendor()) {
                            newVars_1.AddValue_String("ContractName__", this.contractName, true);
                            newVars_1.AddValue_String("SupplierPartAuxID__", this.supplierPartAuxID, true);
                            newVars_1.AddValue_String("SupplierPartID__", this.supplierPartID, true);
                            newVars_1.AddValue_String("ContractNumber__", this.contractNumber, true);
                            newVars_1.AddValue_String("ContractRUIDEX__", this.contractRuidex, true);
                            newVars_1.AddValue_String("PriceConditionData__", this.priceConditionData, true);
                            newVars_1.AddValue_String("PunchoutSiteName__", this.punchoutsitename, true);
                            newVars_1.AddValue_String("VendorNumber__", this.vendorNumber, true);
                            newVars_1.AddValue_String("ExpirationDate__", Sys.Helpers.Date.Date2DBDate(this.expirationDate), true);
                            newVars_1.AddValue_String("ValidityDate__", Sys.Helpers.Date.Date2DBDate(this.validityDate), true);
                            newVars_1.AddValue_String("PublicPrice__", this.publicPrice || "", true);
                        }
                        else {
                            newVars_1.AddValue_String("WarehouseNumber__", this.warehouseNumber, true);
                            newVars_1.AddValue_Double("ExpectedStockLevel__", this.expectedStockLevel, true);
                            newVars_1.AddValue_Double("MinimumThreshold__", this.minimumThreshold, true);
                            if (updateStock) {
                                this.FeedVarsStock(newVars_1);
                            }
                            newVars_1.AddValue_String("DefaultReplenishmentVendorNumber__", this.defaultReplenishmentVendorNumber, true);
                            if (this.stocktakingDateTime) {
                                newVars_1.AddValue_String("StocktakingDateTime__", Sys.Helpers.Date.Date2DBDateTime(this.stocktakingDateTime), true);
                            }
                        }
                        Sys.Helpers.Object.ForEach(this.customFields, function (val, field) {
                            if (!newVars_1.GetValue_String(field, 0)) {
                                newVars_1.AddValue_String(field, val, true);
                            }
                        });
                        newVars_1.AddValue_String("LeadTime__", this.leadtime, true);
                        Log.Info("[Vendor Item ".concat(exists ? "Update" : "Creation", "] Number <").concat(this.itemNumber, "> | CompanyCode  <").concat(this.companyCode, "> | Vendor  <").concat(this.SourceNumber, ">"));
                        record.Commit();
                        this.ruidex = newVars_1.GetValue_String("ruidex", 0);
                        if (record.GetLastError()) {
                            error = "Failed to Create or Update item. Details: " + record.GetLastErrorMessage();
                            Log.Error(error);
                        }
                    }
                    else {
                        error = "[Vendor Item] Failed to get Table Record";
                        Log.Error(error);
                    }
                    return error;
                };
                VendorItem.prototype.FeedVarsStock = function (vars) {
                    vars.AddValue_String("CurrentStock__", this.currentStock, true);
                    vars.AddValue_String("AvailableStock__", this.availableStock, true);
                    vars.AddValue_String("ReservedStock__", this.reservedStock, true);
                    vars.AddValue_String("IncomingStock__", this.incomingStock, true);
                };
                VendorItem.prototype.SaveRealStockInDB = function (updateStocktakingDate) {
                    if (updateStocktakingDate === void 0) { updateStocktakingDate = false; }
                    if (this.ruidex) {
                        Log.Info("Update VendorItem in warehouse: ".concat(this.warehouseNumber, " for item: ").concat(this.itemNumber, " with values CurrentStock__=").concat(this.currentStock, ",AvailableStock__=").concat(this.availableStock, ",ReservedStock__=").concat(this.reservedStock, ",IncomingStock__=").concat(this.incomingStock, ",UnitPrice__=").concat(this.unitPrice));
                        var record = Process.GetUpdatableTableRecord(this.ruidex);
                        var vars = record.GetVars();
                        this.FeedVarsStock(vars);
                        vars.AddValue_String("UnitPrice__", this.unitPrice, true);
                        if (updateStocktakingDate) {
                            vars.AddValue_Date("StocktakingDateTime__", this.stocktakingDateTime, true);
                        }
                        record.Commit();
                        if (record.GetLastError()) {
                            Log.Error("Failed to update stock informations for VendorItem: WarehouseID '".concat(this.warehouseNumber, "', ItemNumber '").concat(this.itemNumber, "'. Details: ") + record.GetLastErrorMessage());
                            return false;
                        }
                        return true;
                    }
                    return false;
                };
                VendorItem.prototype.GetVendorAddress = function () {
                    var _this = this;
                    if (this.vendorAddress) {
                        return Sys.Helpers.Promise.Resolve(this.vendorAddress);
                    }
                    var options = {
                        "isVariablesAddress": true,
                        "address": {
                            "ToName": "ToRemove",
                            "ToSub": this.vendorSub,
                            "ToMail": this.vendorStreet,
                            "ToPostal": this.vendorPostalCode,
                            "ToCountry": this.vendorCountry,
                            "ToState": this.vendorRegion,
                            "ToCity": this.vendorCity,
                            "ToPOBox": this.vendorToPOBox,
                            "ForceCountry": true
                        },
                        "countryCode": "US"
                    };
                    return Sys.GenericAPI.PromisedCheckPostalAddress(options)
                        .Then(function (address) {
                        if (address.LastErrorMessage) {
                            throw address.LastErrorMessage;
                        }
                        _this.vendorAddress = address.FormattedBlockAddress.replace(/^[^\r\n]+(\r|\n)+/, "");
                        return Sys.Helpers.Promise.Resolve(_this.vendorAddress);
                    });
                };
                VendorItem.prototype.IsStocked = function () {
                    return this.IsFromWarehouse() && (this.currentStock > 0 || this.incomingStock > 0 || this.reservedStock > 0);
                };
                VendorItem.prototype.Delete = function () {
                    var record = Process.GetUpdatableTableRecord(this.ruidex);
                    Log.Info("[Vendor Item Delete] Number <".concat(this.itemNumber, "> | CompanyCode  <").concat(this.companyCode, "> | Vendor  <").concat(this.SourceNumber, ">"));
                    record.Delete();
                    var error = "";
                    if (record.GetLastError()) {
                        error = "Failed to delete Vendor Item. Details: " + record.GetLastErrorMessage();
                        Log.Error(error);
                    }
                    return error;
                };
                Object.defineProperty(VendorItem.prototype, "SourceNumber", {
                    get: function () {
                        return this.vendorNumber || this.warehouseNumber;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(VendorItem.prototype, "SourceName", {
                    get: function () {
                        return this.vendorName || this.warehouseName;
                    },
                    enumerable: false,
                    configurable: true
                });
                VendorItem.prototype.IsFromVendor = function () {
                    return !!this.vendorNumber;
                };
                VendorItem.prototype.IsFromWarehouse = function () {
                    return !!this.warehouseNumber;
                };
                VendorItem.prototype.QueryRealCurrentStock = function () {
                    var filterItemNumber = ldaputil.FilterEqual("ItemNumber__", this.itemNumber);
                    var filterWarehouse = ldaputil.FilterEqual("WarehouseID__", this.warehouseNumber);
                    var filterMovementDateTime = ldaputil.FilterGreaterOrEqual("MovementDatetime__", Sys.Helpers.Date.Date2DBDateTime(this.stocktakingDateTime));
                    var filterMovementType = ldaputil.FilterNotEqual("MovementType__", "StocktakingBalancing" /* MovementType.StocktakingBalancing */);
                    var queryCurrentStockOptions = {
                        table: "P2P - Inventory Movements__",
                        filter: ldaputil.FilterAnd(filterItemNumber, filterWarehouse, filterMovementDateTime, filterMovementType),
                        attributes: [
                            "ItemNumber__",
                            "WarehouseID__",
                            "SUM(MovementValue__) 'CURRENTSTOCK'",
                            "SUM(MovementValue__*MovementUnitPrice__) 'TOTALPRICE'"
                        ],
                        sortOrder: "ItemNumber__ ASC",
                        maxRecords: 100,
                        groupBy: ["ItemNumber__", "WarehouseID__"],
                        additionalOptions: {
                            queryOptions: "FastSearch=-1"
                        }
                    };
                    return Sys.GenericAPI.PromisedQuery(queryCurrentStockOptions)
                        .Then(function (queryResults) {
                        var _a, _b;
                        return ({
                            currentStock: parseFloat((_a = queryResults[0]) === null || _a === void 0 ? void 0 : _a.CURRENTSTOCK) || 0,
                            totalPrice: parseFloat((_b = queryResults[0]) === null || _b === void 0 ? void 0 : _b.TOTALPRICE) || 0
                        });
                    });
                };
                VendorItem.prototype.QueryRealForcastStock = function () {
                    var filterItemNumber = ldaputil.FilterEqual("ItemNumber__", this.itemNumber);
                    var filterWarehouse = ldaputil.FilterEqual("WarehouseID__", this.warehouseNumber);
                    var queryForecastStockOption = {
                        table: "P2P - Forecast Inventory Movements__",
                        filter: ldaputil.FilterAnd(filterItemNumber, filterWarehouse).toString(),
                        attributes: ["ItemNumber__", "WarehouseID__", "SUM(ReservedValue__) 'RESERVEDSTOCK'", "SUM(ReplenishValue__) 'INCOMINGSTOCK'"],
                        sortOrder: "ItemNumber__ ASC",
                        maxRecords: 100,
                        groupBy: ["ItemNumber__", "WarehouseID__"],
                        additionalOptions: {
                            queryOptions: "FastSearch=-1"
                        }
                    };
                    return Sys.GenericAPI.PromisedQuery(queryForecastStockOption)
                        .Then(function (queryResults) {
                        var _a, _b;
                        return ({
                            reservedStock: parseFloat((_a = queryResults[0]) === null || _a === void 0 ? void 0 : _a.RESERVEDSTOCK) || 0,
                            incomingStock: parseFloat((_b = queryResults[0]) === null || _b === void 0 ? void 0 : _b.INCOMINGSTOCK) || 0
                        });
                    });
                };
                VendorItem.prototype.QueryRealStock = function () {
                    return Sys.Helpers.Promise.All([this.QueryRealCurrentStock(), this.QueryRealForcastStock()])
                        .Then(function (_a) {
                        var currentStock = _a[0], ForcastStock = _a[1];
                        return (__assign(__assign({}, currentStock), ForcastStock));
                    });
                };
                VendorItem.prototype.UpdateRealStockInDB = function (updateOnError, updateStocktakingDate, _a) {
                    if (updateOnError === void 0) { updateOnError = false; }
                    if (updateStocktakingDate === void 0) { updateStocktakingDate = false; }
                    var currentStock = _a.currentStock, totalPrice = _a.totalPrice, reservedStock = _a.reservedStock, incomingStock = _a.incomingStock;
                    this.currentStock = currentStock || 0;
                    var currency = Factory.Get(this.currency);
                    this.unitPrice = Sys.Helpers.Round(new Sys.Decimal(totalPrice || 0)
                        .div(this.currentStock || 1), currency.unitPricePrecision).toNumber();
                    this.reservedStock = reservedStock || 0;
                    this.incomingStock = incomingStock || 0;
                    this.UpdateCurrentStockAndAvailable(this.currentStock);
                    if (!this.ruidex) {
                        var saveError = this.SaveInDB();
                        if (saveError) {
                            throw saveError;
                        }
                    }
                    if ((this.availableStock < 0 && !updateOnError) || !this.SaveRealStockInDB(updateStocktakingDate)) {
                        throw "Available stock for vendor item ".concat(this.itemNumber, " can't be updated: ")
                            + "AvailableStock=<".concat(this.availableStock, ">, Update on error=<").concat(updateOnError, ">");
                    }
                };
                VendorItem.prototype.QueryAndUpdateRealStockInDB = function (updateOnError, updateStocktakingDate) {
                    var _this = this;
                    if (updateOnError === void 0) { updateOnError = false; }
                    if (updateStocktakingDate === void 0) { updateStocktakingDate = false; }
                    if (this.IsFromWarehouse()) {
                        return this.QueryRealStock()
                            .Then(function (stockData) {
                            _this.UpdateRealStockInDB(updateOnError, updateStocktakingDate, stockData);
                        });
                    }
                    return Sys.Helpers.Promise.Resolve();
                };
                VendorItem.VendorCSVAttributes = [
                    "VENDORNUMBER__",
                    "SUPPLIERPARTID__",
                    "SUPPLIERPARTAUXID__",
                    "UNITPRICE__",
                    "CURRENCY__",
                    "LEADTIME__",
                    "EXPIRATIONDATE__",
                    "VALIDITYDATE__",
                    "CONTRACTNUMBER__",
                    "CONTRACTNAME__"
                ].concat(customVendorProps)
                    .map(NormalizeAttribute);
                VendorItem.WarehouseCSVAttributes = [
                    "WAREHOUSENUMBER__",
                    "CURRENTSTOCK__",
                    "RESERVEDSTOCK__",
                    "AVAILABLESTOCK__",
                    "INCOMINGSTOCK__",
                    "MINIMUMTHRESHOLD__",
                    "EXPECTEDSTOCKLEVEL__",
                    "STOCKTAKINGDATETIME__",
                    "LEADTIME__",
                    "UNITPRICE__",
                    "CURRENCY__"
                ].concat(customWarehouseProps)
                    .map(NormalizeAttribute);
                VendorItem.CustomAttributes = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], customVendorProps, true), customVendorPrivateProps, true), customWarehouseProps, true), customWarehousePrivateProps, true).map(NormalizeAttribute);
                //#region FULL ATTRIBUTES
                VendorItem.Attributes = [
                    "RUIDEX",
                    "COMPANYCODE__",
                    "ITEMNUMBER__",
                    "PUBLICPRICE__",
                    "PUNCHOUTSITENAME__",
                    "LOCKED__",
                    "CONTRACTRUIDEX__",
                    "DEFAULTREPLENISHMENTVENDORNUMBER__",
                    "PRICECONDITIONDATA__",
                    "VENDORNUMBER__.NAME__",
                    "VENDORNUMBER__.STREET__",
                    "VENDORNUMBER__.CITY__",
                    "VENDORNUMBER__.POSTALCODE__",
                    "VENDORNUMBER__.REGION__",
                    "VENDORNUMBER__.SUB__",
                    "VENDORNUMBER__.POSTOFFICEBOX__",
                    "VENDORNUMBER__.COUNTRY__",
                    "DEFAULTREPLENISHMENTVENDORNUMBER__.NAME__",
                    "WAREHOUSENUMBER__.NAME__",
                    "WAREHOUSENUMBER__.WAREHOUSEMANAGERLOGIN__",
                    "WAREHOUSENUMBER__.DESCRIPTION__"
                ].concat(VendorItem.VendorCSVAttributes, VendorItem.WarehouseCSVAttributes, customVendorPrivateProps, customWarehousePrivateProps).map(NormalizeAttribute);
                //#endregion FULL ATTRIBUTES
                VendorItem.fieldsMap = {
                    "UNITPRICE__": "double",
                    "PUBLICPRICE__": "double",
                    "LEADTIME__": "int",
                    "LOCKED__": "boolean",
                    "AVAILABLESTOCK__": "double",
                    "CURRENTSTOCK__": "double",
                    "RESERVEDSTOCK__": "double",
                    "INCOMINGSTOCK__": "double",
                    "STOCKTAKINGDATETIME__": "date",
                    "MINIMUMTHRESHOLD__": "double",
                    "EXPECTEDSTOCKLEVEL__": "double"
                };
                return VendorItem;
            }());
            CatalogHelper.VendorItem = VendorItem;
            var ProcurementItem = /** @class */ (function () {
                function ProcurementItem(QueryResults) {
                    var _this = this;
                    this._rawData = {};
                    // Used for CSV Import
                    this.customFields = {};
                    this.vendorItems = [];
                    if (QueryResults && QueryResults.length > 0) {
                        this.record = QueryResults[0].record;
                        this.ruidex = QueryResults[0].GetValue("RUIDEX");
                        this.companyCode = QueryResults[0].GetValue("COMPANYCODE__");
                        this.costType = QueryResults[0].GetValue("COSTTYPE__");
                        this.description = QueryResults[0].GetValue("DESCRIPTION__");
                        this.longDescription = QueryResults[0].GetValue("LONGDESCRIPTION__");
                        this.itemType = QueryResults[0].GetValue("ITEMTYPE__");
                        this.manufacturerName = QueryResults[0].GetValue("MANUFACTURERNAME__");
                        this.manufacturerPartID = QueryResults[0].GetValue("MANUFACTURERPARTID__");
                        this.unspsc = QueryResults[0].GetValue("UNSPSC__");
                        this.image = QueryResults[0].GetValue("IMAGE__");
                        this.grade = Sys.Helpers.IsNumeric(QueryResults[0].GetValue("GRADE__")) ? QueryResults[0].GetValue("GRADE__") : null;
                        this.grade_number = Sys.Helpers.IsNumeric(QueryResults[0].GetValue("GRADE_NUMBER__")) ? QueryResults[0].GetValue("GRADE_NUMBER__") : null;
                        this.tags = QueryResults[0].GetValue("TAGS__");
                        this.glaccount = QueryResults[0].GetValue("GLACCOUNT__");
                        this.glaccountGroup = QueryResults[0].GetValue("GLACCOUNT__.GROUP__");
                        this.itemNumber = QueryResults[0].GetValue("ITEMNUMBER__");
                        this.taxcode = QueryResults[0].GetValue("TAXCODE__");
                        this.taxcodeTaxrate = Sys.Helpers.IsNumeric(QueryResults[0].GetValue("TAXCODE__.TAXRATE__")) ? QueryResults[0].GetValue("TAXCODE__.TAXRATE__") : null;
                        this.taxcodeNonDeductibleTaxrate = QueryResults[0].GetValue("TAXCODE__.NONDEDUCTIBLETAXRATE__");
                        this.supplytypeID = QueryResults[0].GetValue("SUPPLYTYPEID__");
                        this.supplytypeIDName = QueryResults[0].GetValue("SUPPLYTYPEID__.NAME__");
                        this.supplytypeIDBuyerlogin = QueryResults[0].GetValue("SUPPLYTYPEID__.BUYERLOGIN__");
                        this.supplytypeIDRecipientlogin = QueryResults[0].GetValue("SUPPLYTYPEID__.RECIPIENTLOGIN__");
                        this.supplytypeIDDefaultGLAccount = QueryResults[0].GetValue("SUPPLYTYPEID__.DEFAULTGLACCOUNT__");
                        this.supplytypeIDDefaultCostType = QueryResults[0].GetValue("SUPPLYTYPEID__.DEFAULTCOSTTYPE__");
                        this.UOM = QueryResults[0].GetValue("UNITOFMEASURE__");
                        this.UOMDescription = QueryResults[0].GetValue("UNITOFMEASURE__.DESCRIPTION__");
                        this.supplytypeIDNogoodsreceipt = QueryResults[0].GetValue("SUPPLYTYPEID__.NOGOODSRECEIPT__");
                        this.supplytypeIDNotifyRequesterOnReceipt = QueryResults[0].GetValue("SUPPLYTYPEID__.NOTIFYREQUESTERONRECEIPT__");
                        ProcurementItem.CustomAttributes.forEach(function (attr) {
                            var attribute = NormalizeAttribute(attr);
                            var value = QueryResults[0].GetValue(attribute);
                            if (value !== null) {
                                _this.customFields[attribute] = value;
                            }
                        });
                        ProcurementItem.RawDataAttributes.forEach(function (attribute) {
                            _this._rawData[attribute] = QueryResults[0].GetValue(attribute);
                        });
                        QueryResults.forEach(function (QueryResult) {
                            if (QueryResult.GetValue("ITEMNUMBER__.VENDORNUMBER__") || QueryResult.GetValue("ITEMNUMBER__.WAREHOUSENUMBER__")) {
                                var newVendorItem = new VendorItem(QueryResult, true);
                                _this.vendorItems.push(newVendorItem);
                            }
                        });
                    }
                }
                ProcurementItem.prototype.GetRawData = function (supplierID) {
                    var vendorRawdata = supplierID ? this.Find(supplierID) : null;
                    return __assign(__assign({}, this._rawData), vendorRawdata === null || vendorRawdata === void 0 ? void 0 : vendorRawdata.rawData);
                };
                ProcurementItem.FromRawData = function (rawData) {
                    var fakeQueryResult = {
                        record: null,
                        fieldToTypeMap: {},
                        GetValue: function (field) {
                            return rawData[field];
                        }
                    };
                    return new ProcurementItem([fakeQueryResult]);
                };
                ProcurementItem.FromQueryResults = function (queryResults) {
                    var queryResultsByItemNumber = {};
                    var RUIDEX;
                    var queryResult;
                    var queryResults_length = queryResults.length;
                    for (var i = 0; i < queryResults_length; i++) {
                        queryResult = queryResults[i];
                        RUIDEX = queryResult.GetValue("RUIDEX");
                        queryResultsByItemNumber[RUIDEX] = queryResultsByItemNumber[RUIDEX] || [];
                        queryResultsByItemNumber[RUIDEX].push(queryResult);
                    }
                    return Object.keys(queryResultsByItemNumber)
                        .map(function (key) { return new ProcurementItem(queryResultsByItemNumber[key]); });
                };
                ProcurementItem.IsCSVCatalogAttribute = function (attribute) {
                    var attr = NormalizeAttribute(attribute);
                    return ProcurementItem.CSVAttributes.indexOf(attr) > -1;
                };
                ProcurementItem.GetCSVHeader = function (IsFromWarehouse, nbPriceConditionThresholds) {
                    var Attributes, CSVMapping;
                    if (IsFromWarehouse) {
                        Attributes = ProcurementItem.WarehouseCSVAttributes;
                        CSVMapping = ProcurementItem.WarehouseAttributesToCSVMapping;
                    }
                    else {
                        Attributes = ProcurementItem.VendorCSVAttributes;
                        CSVMapping = ProcurementItem.VendorAttributesToCSVMapping;
                    }
                    var standardHeaders = Attributes.map(function (attr) {
                        return CSVMapping[attr] || attr
                            .replace(/ITEMNUMBER__./g, "")
                            .replace(/__/g, "")
                            .toLowerCase()
                            .split(".")
                            .map(function (attr_part) {
                            return attr_part.length
                                ? attr_part.charAt(0).toUpperCase() + attr_part.slice(1)
                                : attr_part;
                        })
                            .join(" ");
                    });
                    var priceConditionHeader = [];
                    if (nbPriceConditionThresholds) {
                        priceConditionHeader.push(Purchasing.ConditionedPricing.CSVColumnName.type);
                        nbPriceConditionThresholds = (nbPriceConditionThresholds - 1) / 3;
                        for (var i = 1; i <= nbPriceConditionThresholds; i++) {
                            priceConditionHeader.push(Purchasing.ConditionedPricing.CSVColumnName.threshold(i));
                            priceConditionHeader.push(Purchasing.ConditionedPricing.CSVColumnName.unitPrice(i));
                            priceConditionHeader.push(Purchasing.ConditionedPricing.CSVColumnName.base(i));
                        }
                    }
                    return __spreadArray(__spreadArray([], standardHeaders, true), priceConditionHeader, true);
                };
                ProcurementItem.prototype.GetCSVLines = function (culture, IsFromWarehouse) {
                    var _this = this;
                    var vendorItemAttributes, catalogItemAttributes;
                    if (IsFromWarehouse) {
                        vendorItemAttributes = VendorItem.WarehouseCSVAttributes;
                        catalogItemAttributes = ProcurementItem.WarehouseHeaderAttributes;
                    }
                    else {
                        vendorItemAttributes = VendorItem.VendorCSVAttributes;
                        catalogItemAttributes = ProcurementItem.CSVAttributes;
                    }
                    vendorItemAttributes = vendorItemAttributes.map(function (attr) { return "ITEMNUMBER__." + attr; });
                    var procurementItemCSV = catalogItemAttributes.map(function (attr) { var _a; return ((_a = _this._rawData[attr]) === null || _a === void 0 ? void 0 : _a.toString()) || ""; });
                    var csvLines = this.vendorItems.map(function (vendorItem) {
                        var vendorItemCSV = vendorItemAttributes.map(function (attribute) {
                            var value = vendorItem.rawData[attribute];
                            var fieldMap = ProcurementItem.FieldsCSVExportMap[attribute];
                            return fieldMap ? fieldMap(value, culture) : (value === null || value === void 0 ? void 0 : value.toString()) || "";
                        });
                        if (vendorItem.rawData["ITEMNUMBER__.PRICECONDITIONDATA__"]) {
                            var priceCondition = JSON.parse(vendorItem.rawData["ITEMNUMBER__.PRICECONDITIONDATA__"]);
                            vendorItemCSV.push(priceCondition.type);
                            priceCondition.thresholds.forEach(function (threshold) {
                                vendorItemCSV.push("" + threshold.threshold);
                                vendorItemCSV.push("" + threshold.unitPrice);
                                vendorItemCSV.push("" + threshold.base);
                            });
                        }
                        return __spreadArray(__spreadArray([], procurementItemCSV, true), vendorItemCSV, true);
                    });
                    if (!this.vendorItems.length) {
                        csvLines.push(__spreadArray(__spreadArray([], procurementItemCSV, true), vendorItemAttributes.map(function () { return ""; }), true));
                    }
                    return csvLines;
                };
                ProcurementItem.prototype.Find = function (sourceNumber) {
                    return this.vendorItems.filter(function (item) { return item.SourceNumber == sourceNumber; })[0];
                };
                ProcurementItem.prototype.UpdateFromFormData = function () {
                    var _this = this;
                    var GetItem = function (supplierID) {
                        var vendorItem = _this.Find(supplierID);
                        if (vendorItem) {
                            vendorItem.toDelete = false;
                        }
                        else {
                            vendorItem = new VendorItem();
                            _this.vendorItems.push(vendorItem);
                        }
                        return vendorItem;
                    };
                    this.companyCode = Data.GetValue("CompanyCode__");
                    this.costType = Data.GetValue("CostType__");
                    this.description = Data.GetValue("Description__");
                    this.glaccount = Data.GetValue("GLAccount__");
                    this.grade = Data.GetValue("Grade__") || null;
                    this.grade_number = Data.GetValue("GradeNumber__") || null;
                    this.image = Data.GetValue("Image__");
                    this.itemType = Data.GetValue("ItemType__");
                    this.longDescription = Data.GetValue("LongDescription__");
                    this.manufacturerName = Data.GetValue("ManufacturerName__");
                    this.manufacturerPartID = Data.GetValue("ManufacturerPartID__");
                    this.supplytypeID = Data.GetValue("SupplyTypeID__");
                    this.tags = Data.GetValue("Tags__");
                    this.taxcode = Data.GetValue("TaxCode__");
                    this.UOM = Data.GetValue("UnitOfMeasure__");
                    this.unspsc = Data.GetValue("UNSPSC__");
                    // eslint-disable-next-line no-return-assign
                    this.vendorItems.forEach(function (vendorItem) { return vendorItem.toDelete = true; });
                    Sys.Helpers.Data.ForEachTableItem("VendorItems__", function (item) {
                        var vendorItem = GetItem(item.GetValue("VendorNumber__"));
                        vendorItem.UpdateFromFormData(item, _this.itemNumber);
                    });
                    Sys.Helpers.Data.ForEachTableItem("WarehouseItems__", function (item) {
                        var vendorItem = GetItem(item.GetValue("WarehouseNumber__"));
                        vendorItem.UpdateFromFormData(item, _this.itemNumber, false);
                    });
                };
                ProcurementItem.prototype.UpdateFromReplenishmentData = function (GRItem, prItem, punchoutItem) {
                    var _this = this;
                    var GetItem = function (supplierID) {
                        var item = _this.Find(supplierID);
                        if (item) {
                            item.toDelete = false;
                        }
                        else {
                            item = _this.AddVendorItem();
                        }
                        return item;
                    };
                    this.companyCode = Data.GetValue("CompanyCode__");
                    this.costType = GRItem.GetValue("CostType__");
                    this.description = GRItem.GetValue("Description__");
                    this.itemType = GRItem.GetValue("ItemType__");
                    this.UOM = GRItem.GetValue("ItemUnit__");
                    this.glaccount = prItem.GLAccount__;
                    this.supplytypeID = prItem.SupplyTypeId__;
                    this.manufacturerPartID = punchoutItem.ManufacturerPartID;
                    this.manufacturerName = punchoutItem.ManufacturerName;
                    var vendorItem = GetItem(GRItem.GetValue("WarehouseID__"));
                    vendorItem.UpdateFromReplenishmentData(GRItem);
                    if (!this.itemNumber) {
                        this.SetItemNumber();
                    }
                };
                ProcurementItem.prototype.AddVendorItem = function () {
                    var vendorItem = new VendorItem();
                    vendorItem.itemNumber = this.itemNumber;
                    vendorItem.companyCode = this.companyCode;
                    this.vendorItems.push(vendorItem);
                    return vendorItem;
                };
                ProcurementItem.prototype.SaveInDB = function (saveChildren) {
                    if (saveChildren === void 0) { saveChildren = true; }
                    var exists = !!this.ruidex;
                    var record = exists ? Process.GetUpdatableTableRecord(this.ruidex) : Process.CreateTableRecord("P2P - CatalogItems__");
                    if (!this.itemNumber) {
                        this.SetItemNumber();
                    }
                    var error = "";
                    if (record) {
                        var newVars_2 = record.GetVars();
                        newVars_2.AddValue_String("CompanyCode__", this.companyCode, true);
                        newVars_2.AddValue_String("CostType__", this.costType, true);
                        newVars_2.AddValue_String("Description__", this.description, true);
                        newVars_2.AddValue_String("GLAccount__", this.glaccount, true);
                        if (this.grade) {
                            newVars_2.AddValue_Double("Grade__", this.grade, true);
                        }
                        newVars_2.AddValue_String("GradeNumber__", this.grade_number, true);
                        newVars_2.AddValue_String("Image__", this.image, true);
                        newVars_2.AddValue_String("ItemNumber__", this.itemNumber, true);
                        newVars_2.AddValue_String("ItemType__", this.itemType, true);
                        newVars_2.AddValue_String("LongDescription__", this.longDescription, true);
                        newVars_2.AddValue_String("ManufacturerName__", this.manufacturerName, true);
                        newVars_2.AddValue_String("ManufacturerPartID__", this.manufacturerPartID, true);
                        newVars_2.AddValue_String("SupplyTypeID__", this.supplytypeID, true);
                        newVars_2.AddValue_String("Tags__", this.tags, true);
                        newVars_2.AddValue_String("TaxCode__", this.taxcode, true);
                        newVars_2.AddValue_String("UnitOfMeasure__", this.UOM, true);
                        newVars_2.AddValue_String("UNSPSC__", this.unspsc, true);
                        Sys.Helpers.Object.ForEach(this.customFields, function (val, field) {
                            if (!newVars_2.GetValue_String(field, 0)) {
                                newVars_2.AddValue_String(field, val, true);
                            }
                        });
                        Log.Info("[Catalog Item ".concat(exists ? "Update" : "Creation", "] Number <").concat(this.itemNumber, "> | CompanyCode  <").concat(this.companyCode, ">"));
                        record.Commit();
                        this.ruidex = newVars_2.GetValue_String("ruidex", 0);
                        if (record.GetLastError()) {
                            error = "Failed to Create or Update item. Details: " + record.GetLastErrorMessage();
                            Log.Error(error);
                        }
                    }
                    else {
                        error = "[Catalog Item] Failed to get Table Record";
                    }
                    if (!error && saveChildren) {
                        this.vendorItems.every(function (vendorItem) {
                            error = vendorItem.SaveInDB();
                            return !error;
                        });
                    }
                    return error;
                };
                ProcurementItem.prototype.IsStocked = function () {
                    return this.vendorItems.some(function (vendorItem) { return vendorItem.IsStocked(); });
                };
                ProcurementItem.prototype.Delete = function () {
                    var record = Process.GetUpdatableTableRecord(this.ruidex);
                    Log.Info("[Catalog Item Delete] Number <".concat(this.itemNumber, "> | CompanyCode  <").concat(this.companyCode, ">"));
                    record.Delete();
                    var error = "";
                    if (record.GetLastError()) {
                        error = "Failed to delete Catalog Item. Details: " + record.GetLastErrorMessage();
                        Log.Info(error);
                    }
                    else {
                        this.vendorItems.every(function (vendorItem) {
                            error = vendorItem.Delete();
                            return !error;
                        });
                    }
                    return error;
                };
                ProcurementItem.prototype.SetItemNumber = function () {
                    var _this = this;
                    this.itemNumber = ProcurementItem.GetNextAvailableNumber();
                    this.vendorItems.forEach(function (vendorItem) {
                        vendorItem.itemNumber = _this.itemNumber;
                    });
                };
                ProcurementItem.GetNextAvailableNumber = function () {
                    var itemNumberSequence = Process.GetSequence("ItemNumber");
                    return "IN-" + Sys.Helpers.String.PadLeft(itemNumberSequence.GetNextValue(), "0", 9);
                };
                //#region ATTRIBUTES
                ProcurementItem.Attributes = [
                    "RUIDEX",
                    "ITEMDESCRIPTION__",
                    "ITEMLONGDESCRIPTION__",
                    "ITEMTYPE__",
                    "ITEMUNITPRICE__",
                    "PUBLICPRICE__",
                    "ITEMCURRENCY__",
                    "ITEMNUMBER__",
                    "ITEMSUPPLIERPARTAUXID__",
                    "MANUFACTURERNAME__",
                    "MANUFACTURERPARTID__",
                    "PUNCHOUTSITENAME__",
                    "UNSPSC__",
                    "IMAGE__",
                    "VENDORNUMBER__",
                    "VENDORNUMBER__.NAME__",
                    "VENDORNUMBER__.STREET__",
                    "VENDORNUMBER__.CITY__",
                    "VENDORNUMBER__.POSTALCODE__",
                    "VENDORNUMBER__.REGION__",
                    "VENDORNUMBER__.COUNTRY__",
                    "SUPPLYTYPEID__",
                    "SUPPLYTYPEID__.NAME__",
                    "SUPPLYTYPEID__.BUYERLOGIN__",
                    "SUPPLYTYPEID__.RECIPIENTLOGIN__",
                    "SUPPLYTYPEID__.DEFAULTGLACCOUNT__",
                    "SUPPLYTYPEID__.DEFAULTCOSTTYPE__",
                    "SUPPLYTYPEID__.NOGOODSRECEIPT__",
                    "SUPPLYTYPEID__.NOTIFYREQUESTERONRECEIPT__",
                    "COSTTYPE__",
                    "ITEMGLACCOUNT__",
                    "ITEMGLACCOUNT__.GROUP__",
                    "ITEMTAXCODE__",
                    "ITEMTAXCODE__.TAXRATE__",
                    "ITEMTAXCODE__.NONDEDUCTIBLETAXRATE__",
                    "UNITOFMEASURE__",
                    "UNITOFMEASURE__.DESCRIPTION__",
                    "LEADTIME__",
                    "LOCKED__",
                    "GRADE__",
                    "GRADE_NUMBER__",
                    "ITEMTAGS__",
                    "CONTRACTRUIDEX__",
                    "CONTRACTNUMBER__",
                    "CONTRACTNAME__",
                    "PRICECONDITIONDATA__"
                ];
                ProcurementItem.CSVAttributes = [
                    "COMPANYCODE__",
                    "ITEMNUMBER__",
                    "DESCRIPTION__",
                    "LONGDESCRIPTION__",
                    "MANUFACTURERNAME__",
                    "MANUFACTURERPARTID__",
                    "COSTTYPE__",
                    "ITEMTYPE__",
                    "SUPPLYTYPEID__",
                    "UNSPSC__",
                    "GLACCOUNT__",
                    "TAXCODE__",
                    "UNITOFMEASURE__",
                    "IMAGE__"
                ].concat(customCatalogProps)
                    .map(NormalizeAttribute);
                ProcurementItem.RawDataAttributes = [
                    "RUIDEX",
                    "GRADE__",
                    "GRADENUMBER__",
                    "TAGS__",
                    "GLACCOUNT__.GROUP__",
                    "TAXCODE__.TAXRATE__",
                    "TAXCODE__.NONDEDUCTIBLETAXRATE__",
                    "SUPPLYTYPEID__.NAME__",
                    "SUPPLYTYPEID__.BUYERLOGIN__",
                    "SUPPLYTYPEID__.RECIPIENTLOGIN__",
                    "SUPPLYTYPEID__.DEFAULTGLACCOUNT__",
                    "SUPPLYTYPEID__.DEFAULTCOSTTYPE__",
                    "SUPPLYTYPEID__.NOGOODSRECEIPT__",
                    "SUPPLYTYPEID__.NOTIFYREQUESTERONRECEIPT__",
                    "UNITOFMEASURE__.DESCRIPTION__"
                ].concat(ProcurementItem.CSVAttributes).map(NormalizeAttribute);
                ProcurementItem.CustomAttributes = __spreadArray(__spreadArray([], customCatalogProps, true), customCatalogPrivateProps, true).map(NormalizeAttribute);
                ProcurementItem.AttributesV2 = ProcurementItem.RawDataAttributes.concat(VendorItem.Attributes.map(function (attr) { return "ITEMNUMBER__." + attr; }), customCatalogPrivateProps).map(NormalizeAttribute);
                //#endregion ATTRIBUTES
                //#region CSV
                ProcurementItem.WarehouseAttributesToCSVMapping = {
                    "ITEMNUMBER__": "Item number",
                    "DESCRIPTION__": "Description",
                    "ITEMNUMBER__.WAREHOUSENUMBER__": "Warehouse ID",
                    "ITEMNUMBER__.CURRENTSTOCK__": "Current stock",
                    "ITEMNUMBER__.RESERVEDSTOCK__": "Reserved stock",
                    "ITEMNUMBER__.AVAILABLESTOCK__": "Available stock",
                    "ITEMNUMBER__.INCOMINGSTOCK__": "Incoming stock",
                    "ITEMNUMBER__.MINIMUMTHRESHOLD__": "Reorder point",
                    "ITEMNUMBER__.EXPECTEDSTOCKLEVEL__": "Target stock level",
                    "ITEMNUMBER__.STOCKTAKINGDATETIME__": "Stocktaking datetime",
                    "ITEMNUMBER__.LEADTIME__": "Lead time",
                    "ITEMNUMBER__.UNITPRICE__": "Unit price",
                    "ITEMNUMBER__.CURRENCY__": "Currency"
                };
                ProcurementItem.WarehouseHeaderAttributes = [
                    "ITEMNUMBER__",
                    "DESCRIPTION__"
                ].concat(customCatalogProps)
                    .map(NormalizeAttribute);
                ProcurementItem.WarehouseCSVAttributes = ProcurementItem.WarehouseHeaderAttributes.concat(VendorItem.WarehouseCSVAttributes.map(function (attr) { return "ITEMNUMBER__." + attr; }));
                ProcurementItem.VendorCSVAttributes = ProcurementItem.CSVAttributes.concat(VendorItem.VendorCSVAttributes.map(function (attr) { return "ITEMNUMBER__." + attr; }));
                // must match EXTRACTED_DATA_TO_CSV_MAPPING Lib_Purchasing_CM
                ProcurementItem.VendorAttributesToCSVMapping = {
                    "DESCRIPTION__": "Name",
                    "ITEMNUMBER__": "Item number",
                    "LONGDESCRIPTION__": "Description",
                    "ITEMNUMBER__.SUPPLIERPARTID__": "Supplier part ID",
                    "ITEMNUMBER__.SUPPLIERPARTAUXID__": "Supplier auxiliary part ID",
                    "MANUFACTURERNAME__": "Manufacturer name",
                    "MANUFACTURERPARTID__": "Manufacturer part ID",
                    "ITEMNUMBER__.UNITPRICE__": "Unit price",
                    "ITEMNUMBER__.CURRENCY__": "Currency",
                    "ITEMNUMBER__.LEADTIME__": "Lead time",
                    "UNITOFMEASURE__": "Unit of measurement",
                    "COSTTYPE__": "Cost type",
                    "UNSPSC__": "UNSPSC",
                    "ITEMNUMBER__.VALIDITYDATE__": "Start date",
                    "ITEMNUMBER__.EXPIRATIONDATE__": "End date",
                    "COMPANYCODE__": "CompanyCode",
                    "ITEMNUMBER__.VENDORNUMBER__": "VendorNumber",
                    "IMAGE__": "Image"
                };
                //#endregion CSV
                ProcurementItem.fieldsMap = {
                    "ITEMNUMBER__.UNITPRICE__": "double",
                    "ITEMNUMBER__.PUBLICPRICE__": "double",
                    "GRADE__": "double",
                    "GRADE_NUMBER__": "int",
                    "ITEMNUMBER__.LEADTIME__": "int",
                    "ITEMNUMBER__.LOCKED__": "boolean",
                    "ITEMNUMBER__.AVAILABLESTOCK__": "double",
                    "ITEMNUMBER__.CURRENTSTOCK__": "double",
                    "ITEMNUMBER__.RESERVEDSTOCK__": "double",
                    "ITEMNUMBER__.INCOMINGSTOCK__": "double",
                    "ITEMNUMBER__.STOCKTAKINGDATETIME__": "date",
                    "ITEMNUMBER__.MINIMUMTHRESHOLD__": "double",
                    "ITEMNUMBER__.EXPECTEDSTOCKLEVEL__": "double",
                    "TAXCODE__.TAXRATE__": "double",
                    "TAXCODE__.NONDEDUCTIBLETAXRATE__": "double",
                    "SUPPLYTYPEID__.NOGOODSRECEIPT__": "boolean",
                    "SUPPLYTYPEID__.NOTIFYREQUESTERONRECEIPT__": "boolean"
                };
                ProcurementItem.FieldsCSVExportMap = {
                    "ITEMNUMBER__.STOCKTAKINGDATETIME__": function (value, culture) { return value ? Sys.Helpers.Date.ToLocaleDateEx(value, culture) : ""; }
                };
                return ProcurementItem;
            }());
            CatalogHelper.ProcurementItem = ProcurementItem;
            function GetItems(filter, additionalFilter) {
                var filterCatalogItems = [];
                filter.forEach(function (f) {
                    var currentFilter = [];
                    if (f.ruidex) {
                        currentFilter.push(ldaputil.FilterEqual("RUIDEX", f.ruidex));
                    }
                    if (f.companyCode) {
                        currentFilter.push(ldaputil.FilterEqual("COMPANYCODE__", f.companyCode));
                    }
                    if (f.itemNumber) {
                        currentFilter.push(ldaputil.FilterEqual("ITEMNUMBER__", f.itemNumber));
                    }
                    if (f.manufacturerID) {
                        currentFilter.push(ldaputil.FilterEqual("MANUFACTURERPARTID__", f.manufacturerID));
                    }
                    if (f.manufacturerName) {
                        currentFilter.push(ldaputil.FilterEqual("MANUFACTURERNAME__", f.manufacturerName));
                    }
                    if (f.description) {
                        currentFilter.push(ldaputil.FilterEqual("DESCRIPTION__", f.description));
                    }
                    if (f.supplierID) {
                        currentFilter.push(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.VENDORNUMBER__", f.supplierID), Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", f.supplierID)));
                    }
                    if (f.supplierPartID) {
                        currentFilter.push(ldaputil.FilterEqual("ITEMNUMBER__.SUPPLIERPARTID__", f.supplierPartID));
                    }
                    if (f.supplierPartAuxID) {
                        currentFilter.push(ldaputil.FilterEqual("ITEMNUMBER__.SUPPLIERPARTAUXID__", f.supplierPartAuxID));
                    }
                    filterCatalogItems.push(ldaputil.FilterAnd.apply(ldaputil, currentFilter));
                });
                var options = {
                    table: "P2P - CatalogItems__",
                    filter: ldaputil.FilterAnd(ldaputil.FilterOr.apply(ldaputil, filterCatalogItems), additionalFilter).toString(),
                    attributes: ProcurementItem.AttributesV2,
                    sortOrder: "ITEMNUMBER__ ASC,ITEMNUMBER__.VENDORNUMBER__.NAME__ ASC, ITEMNUMBER__.WAREHOUSENUMBER__.NAME__ ASC",
                    maxRecords: 100,
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: ProcurementItem.fieldsMap,
                        queryOptions: "EnableJoin=1"
                    }
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(ProcurementItem.FromQueryResults)
                    .Catch(function (err) {
                    var errMessage = "Error while Querying P2P - CatalogItems__ : ".concat(JSON.stringify(err));
                    Log.Error(errMessage);
                    throw err;
                });
            }
            CatalogHelper.GetItems = GetItems;
            function GetVendorItems(filter) {
                var filterVendorItems = [];
                filter.forEach(function (f) {
                    var filterItemNumber = ldaputil.FilterEqual("ITEMNUMBER__", f.itemNumber);
                    var filterCompanyCode = ldaputil.FilterEqual("COMPANYCODE__", f.companyCode);
                    var sourceFilter = [];
                    if (f.warehouseNumber) {
                        sourceFilter.push(ldaputil.FilterEqual("WAREHOUSENUMBER__", f.warehouseNumber));
                    }
                    if (f.vendorNumber) {
                        sourceFilter.push(ldaputil.FilterEqual("VENDORNUMBER__", f.vendorNumber));
                    }
                    filterVendorItems.push(ldaputil.FilterAnd(filterItemNumber, filterCompanyCode, ldaputil.FilterOr.apply(ldaputil, sourceFilter)));
                });
                var options = {
                    table: "P2P - VendorItems__",
                    filter: ldaputil.FilterOr.apply(ldaputil, filterVendorItems).toString(),
                    attributes: VendorItem.Attributes,
                    sortOrder: "VENDORNUMBER__.NAME__ ASC, WAREHOUSENUMBER__.NAME__ ASC",
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: VendorItem.fieldsMap,
                        queryOptions: "EnableJoin=1"
                    }
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResults) {
                    var vendorItems = [];
                    queryResults.forEach(function (queryResult) {
                        vendorItems.push(new VendorItem(queryResult));
                    });
                    return vendorItems;
                }).Catch(function (err) {
                    var errMessage = "Error while Querying P2P - VendorItems__ : ".concat(JSON.stringify(err));
                    Log.Error(errMessage);
                    throw err;
                });
            }
            CatalogHelper.GetVendorItems = GetVendorItems;
            function AvoidOverOrderStockQuantity(quantity, currentCartItem) {
                if (Lib.P2P.Inventory.IsEnabled() && currentCartItem["ITEMNUMBER__.WAREHOUSENUMBER__"] && quantity > parseInt(currentCartItem["ITEMNUMBER__.AVAILABLESTOCK__"], 10)) {
                    quantity = parseInt(currentCartItem["ITEMNUMBER__.AVAILABLESTOCK__"], 10);
                    return [quantity, true];
                }
                return [quantity, false];
            }
            CatalogHelper.AvoidOverOrderStockQuantity = AvoidOverOrderStockQuantity;
        })(CatalogHelper = Purchasing.CatalogHelper || (Purchasing.CatalogHelper = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
