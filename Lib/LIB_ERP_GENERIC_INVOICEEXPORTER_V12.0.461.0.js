/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_Generic_InvoiceExporter_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Invoice exporter document for Generic ERP - system library",
  "require": [
    "Lib_ERP_InvoiceExporter_V12.0.461.0",
    "Lib_ERP_Generic_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Generic;
        (function (Generic) {
            var InvoiceExporter = /** @class */ (function (_super) {
                __extends(InvoiceExporter, _super);
                function InvoiceExporter(manager) {
                    return _super.call(this, manager) || this;
                }
                InvoiceExporter.prototype.GetTablesRules = function () {
                    var fieldRules = _super.prototype.GetTablesRules.call(this);
                    var withholdingTax = Sys.Parameters.GetInstance("AP").GetParameter("TaxesWithholdingTax", "");
                    var isExtendedWHT = withholdingTax === "Extended";
                    if (Sys.Parameters.GetInstance("AP").GetParameter("CodingEnableProjectCode") === "1") {
                        for (var _i = 0, fieldRules_1 = fieldRules; _i < fieldRules_1.length; _i++) {
                            var fieldRule = fieldRules_1[_i];
                            if (fieldRule.name === "LineItems__") {
                                var POLine = fieldRule.excludedConditionalColumns.conditionalTable.PO.excludedColumns;
                                var GLLine = fieldRule.excludedConditionalColumns.conditionalTable.GL.excludedColumns;
                                var POGLLine = fieldRule.excludedConditionalColumns.conditionalTable.POGL.excludedColumns;
                                POLine.splice(POLine.indexOf("ProjectCode__"), 1);
                                POLine.splice(POLine.indexOf("ProjectCodeDescription__"), 1);
                                GLLine.splice(GLLine.indexOf("ProjectCode__"), 1);
                                GLLine.splice(GLLine.indexOf("ProjectCodeDescription__"), 1);
                                POGLLine.splice(GLLine.indexOf("ProjectCode__"), 1);
                                POGLLine.splice(GLLine.indexOf("ProjectCodeDescription__"), 1);
                            }
                        }
                    }
                    if (isExtendedWHT) {
                        for (var _a = 0, fieldRules_2 = fieldRules; _a < fieldRules_2.length; _a++) {
                            var fieldRule = fieldRules_2[_a];
                            if (fieldRule.name === "ExtendedWithholdingTax__") {
                                fieldRule.excludedFullTable = false;
                            }
                        }
                    }
                    return fieldRules;
                };
                return InvoiceExporter;
            }(Lib.ERP.InvoiceExporter.Instance));
            Generic.InvoiceExporter = InvoiceExporter;
        })(Generic = ERP.Generic || (ERP.Generic = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.Generic.Manager.documentFactories[Lib.ERP.InvoiceExporter.docType] = function (manager) {
    return new Lib.ERP.Generic.InvoiceExporter(manager);
};
