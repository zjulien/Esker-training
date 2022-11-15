/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "Lib_ERP_NAV_CSVDataImportParameters_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "CSVDataImportParameters document for NAV ERP - system library",
  "require": [
    "Sys/Sys_Helpers_CSVReader",
    "Lib_ERP_CSVDataImportParameters_V12.0.461.0",
    "Lib_ERP_Generic_CSVDataImportParameters_V12.0.461.0",
    "Lib_ERP_NAV_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var NAV;
        (function (NAV) {
            var CSVDataImportParameters = /** @class */ (function (_super) {
                __extends(CSVDataImportParameters, _super);
                function CSVDataImportParameters(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.mappingTable = {
                        "Companycodes": {
                            table: "PurchasingCompanycodes__",
                            fieldNameInFile: "Company_code__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "Costcenters": {
                            table: "AP - Cost centers__",
                            fieldNameInFile: "CompanyCode__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "Currencies": {
                            table: "P2P - Exchange rate__",
                            fieldNameInFile: "Company_code__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "GLaccount": {
                            table: "AP - G/L accounts__",
                            fieldNameInFile: "CompanyCode__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "Paymentterms": {
                            table: "AP - Payment terms__",
                            fieldNameInFile: "CompanyCode__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "PurchaseorderHeaders": {
                            table: "AP - Purchase order - Headers__",
                            fieldNameInFile: "CompanyCode__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "PurchaseorderItems": {
                            table: "AP - Purchase order - Items__",
                            fieldNameInFile: "CompanyCode__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "Taxcodes": {
                            table: "AP - Tax codes__",
                            fieldNameInFile: "CompanyCode__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "Vendors": {
                            table: "AP - Vendors__",
                            fieldNameInFile: "CompanyCode__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "GoodsReceiptItems": {
                            table: "P2P - Goods receipt - Items__",
                            fieldNameInFile: "CompanyCode__",
                            fieldNameInTable: "CompanyCode__"
                        },
                        "Bankdetails": {
                            table: "AP - Bank details__",
                            fieldNameInFile: "CompanyCode__",
                            fieldNameInTable: "CompanyCode__"
                        }
                    };
                    _this.Parameters = {
                        ReplicationMode: "full"
                    };
                    return _this;
                }
                CSVDataImportParameters.prototype.GetJSON = function () {
                    return this.Parameters;
                };
                CSVDataImportParameters.prototype.GetMappingFile = function (tableName) {
                    return "mapping_navision_" + tableName + "__.xml";
                };
                CSVDataImportParameters.prototype.GetReferenceFileName = function (tableName, erpId) {
                    var baseFileName = "%Misc%\\DO_NOT_DELETE_RefCSV_" + erpId + "_" + tableName;
                    if (!this.mappingTable[tableName]
                        || (!this.mappingTable[tableName].fieldNameInFile && !this.mappingTable[tableName].fieldNameInTable)) {
                        return baseFileName + ".csv";
                    }
                    var columnHeader = this.mappingTable[tableName].fieldNameInFile;
                    var csvHelper = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                    csvHelper.GuessSeparator();
                    csvHelper.ReturnSeparator = "\n";
                    // Ensure each defined columnHeader in MappingTable exists in the csv file
                    var columnIndex = csvHelper.GetHeaderIndex(columnHeader);
                    if (columnIndex === -1) {
                        return baseFileName + ".csv";
                    }
                    var line = csvHelper.GetNextLine();
                    if (!line) {
                        return baseFileName + ".csv";
                    }
                    var lineArray = csvHelper.GetCurrentLineArray();
                    return baseFileName + "_" + lineArray[columnIndex] + ".csv";
                };
                return CSVDataImportParameters;
            }(Lib.ERP.CSVDataImportParameters.Instance));
            NAV.CSVDataImportParameters = CSVDataImportParameters;
        })(NAV = ERP.NAV || (ERP.NAV = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.NAV.Manager.documentFactories[Lib.ERP.CSVDataImportParameters.docType] = function (manager) {
    return new Lib.ERP.NAV.CSVDataImportParameters(manager);
};
