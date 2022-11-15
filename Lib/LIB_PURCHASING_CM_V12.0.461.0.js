///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CM_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Catalog Management library",
  "require": [
    "Sys/Sys_Helpers",
    "Lib_Purchasing_CatalogHelper_V12.0.461.0",
    "Lib_Purchasing_ConditionedPricing_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var CM;
        (function (CM) {
            var UniqueKeyType;
            (function (UniqueKeyType) {
                UniqueKeyType["ByItemNumber"] = "ByItemNumber";
                UniqueKeyType["ByManufacturerPartID"] = "ByManufacturerPartID";
                UniqueKeyType["BySupplierPartID"] = "BySupplierPartID";
            })(UniqueKeyType = CM.UniqueKeyType || (CM.UniqueKeyType = {}));
            var ActionToDo;
            (function (ActionToDo) {
                ActionToDo["Added"] = "Added";
                ActionToDo["Modified"] = "Modified";
                ActionToDo["Deleted"] = "Deleted";
            })(ActionToDo = CM.ActionToDo || (CM.ActionToDo = {}));
            var ActionDone;
            (function (ActionDone) {
                ActionDone["Added"] = "Added";
                ActionDone["Modified"] = "Modified";
                ActionDone["Deleted"] = "Deleted";
                ActionDone["Nothing"] = "Nothing";
            })(ActionDone = CM.ActionDone || (CM.ActionDone = {}));
            var CHelper = /** @class */ (function () {
                function CHelper() {
                    // Inverse the mapping
                    this.CSV_TO_EXTRACTED_DATA_MAPPING = {};
                    this.extractedDataString = Variable.GetValueAsString(CHelper.EXTRACTEDDATAVARIABLE);
                    this.extractedData = Sys.Helpers.IsEmpty(this.extractedDataString)
                        ? {
                            Lines: {},
                            ParsingError: [],
                            ProcessingError: []
                        }
                        : JSON.parse(this.extractedDataString);
                }
                CHelper.prototype.InitCsvToExtractedDataMapping = function () {
                    for (var key in this.EXTRACTED_DATA_TO_CSV_MAPPING) {
                        if (Object.prototype.hasOwnProperty.call(this.EXTRACTED_DATA_TO_CSV_MAPPING, key)) {
                            this.CSV_TO_EXTRACTED_DATA_MAPPING[this.EXTRACTED_DATA_TO_CSV_MAPPING[key]] = key;
                        }
                    }
                };
                CHelper.prototype.SetExtractedData = function (newExtractedData) {
                    this.extractedDataString = newExtractedData ? JSON.stringify(newExtractedData) : null;
                    Variable.SetValueAsString(CHelper.EXTRACTEDDATAVARIABLE, this.extractedDataString);
                    this.extractedData = newExtractedData || {
                        Lines: {},
                        ParsingError: [],
                        ProcessingError: []
                    };
                };
                CHelper.prototype.GetExtractedData = function () {
                    return this.extractedData;
                };
                CHelper.EXTRACTEDDATAVARIABLE = "ExtractedData";
                return CHelper;
            }());
            CM.CHelper = CHelper;
            var CHelperVendorItem = /** @class */ (function (_super) {
                __extends(CHelperVendorItem, _super);
                function CHelperVendorItem() {
                    var _this = _super.call(this) || this;
                    // TODO - PAC2 : remove on Catalog V2 release : Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled()
                    _this.EXTRACTED_DATA_TO_CATALOG_MAPPING = {
                        Name: "ItemDescription__",
                        Description: "ItemLongDescription__",
                        SupplierPartID: "ItemNumber__",
                        SupplierAuxPartID: "ItemSupplierPartAuxID__",
                        ManufacturerName: "ManufacturerName__",
                        ManufacturerID: "ManufacturerPartID__",
                        UnitPrice: "ItemUnitPrice__",
                        Currency: "ItemCurrency__",
                        LeadTime: "LeadTime__",
                        UOM: "UnitOfMeasure__",
                        UNSPSC: "UNSPSC__",
                        StartDate: "ValidityDate__",
                        EndDate: "ExpirationDate__",
                        CompanyCode: "ItemCompanyCode__",
                        VendorNumber: "VendorNumber__",
                        CostType: "CostType__",
                        img: "Image__"
                    };
                    _this.EXTRACTED_DATA_TO_CATALOGITEM_MAPPING = {
                        Name: "Description__",
                        Description: "LongDescription__",
                        ManufacturerName: "ManufacturerName__",
                        ManufacturerID: "ManufacturerPartID__",
                        UOM: "UnitOfMeasure__",
                        UNSPSC: "UNSPSC__",
                        CompanyCode: "CompanyCode__",
                        CostType: "CostType__",
                        img: "Image__"
                    };
                    _this.EXTRACTED_DATA_TO_VENDORITEM_MAPPING = {
                        SupplierPartID: "SupplierPartID__",
                        SupplierAuxPartID: "SupplierPartAuxID__",
                        UnitPrice: "UnitPrice__",
                        Currency: "Currency__",
                        LeadTime: "LeadTime__",
                        StartDate: "ValidityDate__",
                        EndDate: "ExpirationDate__",
                        VendorNumber: "VendorNumber__"
                    };
                    _this.EXTRACTED_DATA_TO_CSV_MAPPING = {
                        Name: "Name",
                        Description: "Description",
                        ItemNumber: "Item number",
                        SupplierPartID: "Supplier part ID",
                        SupplierAuxPartID: "Supplier auxiliary part ID",
                        ManufacturerName: "Manufacturer name",
                        ManufacturerID: "Manufacturer part ID",
                        UnitPrice: "Unit price",
                        Currency: "Currency",
                        LeadTime: "Lead time",
                        UOM: "Unit of measurement",
                        CostType: "Cost type",
                        UNSPSC: "UNSPSC",
                        StartDate: "Start date",
                        EndDate: "End date",
                        CompanyCode: "CompanyCode",
                        VendorNumber: "VendorNumber",
                        img: "Image",
                        deleted: "Delete"
                    };
                    Log.Info("CHelperVendorItem");
                    _this.InitCsvToExtractedDataMapping();
                    return _this;
                }
                return CHelperVendorItem;
            }(CHelper));
            CM.CHelperVendorItem = CHelperVendorItem;
            var CHelperWarehouseItem = /** @class */ (function (_super) {
                __extends(CHelperWarehouseItem, _super);
                function CHelperWarehouseItem() {
                    var _this = _super.call(this) || this;
                    _this.EXTRACTED_DATA_TO_CSV_MAPPING = {
                        ItemNumber: "Item number",
                        CurrentStock: "Current stock",
                        MinimumThreshold: "Reorder point",
                        ExpectedStockLevel: "Target stock level",
                        LeadTime: "Lead time",
                        UnitPrice: "Unit price",
                        WarehouseID: "Warehouse ID"
                    };
                    Log.Info("CHelperWarehouseItem");
                    _this.InitCsvToExtractedDataMapping();
                    return _this;
                }
                return CHelperWarehouseItem;
            }(CHelper));
            CM.CHelperWarehouseItem = CHelperWarehouseItem;
        })(CM = Purchasing.CM || (Purchasing.CM = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
