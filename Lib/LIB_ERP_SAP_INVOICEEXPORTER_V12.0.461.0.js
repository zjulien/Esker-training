/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAP_InvoiceExporter_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Invoice exporter document for SAP ERP - system library",
  "require": [
    "Lib_ERP_InvoiceExporter_V12.0.461.0",
    "Lib_ERP_SAP_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAP;
        (function (SAP) {
            var InvoiceExporter = /** @class */ (function (_super) {
                __extends(InvoiceExporter, _super);
                function InvoiceExporter(manager) {
                    return _super.call(this, manager) || this;
                }
                InvoiceExporter.prototype.GetFieldValuesMapping = function () {
                    return null;
                };
                InvoiceExporter.prototype.GetTablesRules = function () {
                    var fieldRules = _super.prototype.GetTablesRules.call(this);
                    for (var i = 0; i < fieldRules.length; i++) {
                        if (fieldRules[i].name === "LineItems__") {
                            var POLine = fieldRules[i].excludedConditionalColumns.conditionalTable.PO.excludedColumns;
                            var GLLine = fieldRules[i].excludedConditionalColumns.conditionalTable.GL.excludedColumns;
                            POLine.splice(POLine.indexOf("CompanyCode__"), 1);
                            POLine.splice(POLine.indexOf("WBSElement__"), 1);
                            POLine.splice(POLine.indexOf("WBSElementID__"), 1);
                            GLLine.splice(GLLine.indexOf("CompanyCode__"), 1);
                            GLLine.splice(GLLine.indexOf("TradingPartner__"), 1);
                            GLLine.splice(GLLine.indexOf("WBSElement__"), 1);
                            GLLine.splice(GLLine.indexOf("WBSElementID__"), 1);
                        }
                    }
                    return fieldRules;
                };
                InvoiceExporter.prototype.ShouldExportXML = function ( /*postCondition: boolean, endCondition: boolean*/) {
                    var exportSAPInvoiceToXML = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("ExportSAPInvoiceToXML") === true;
                    return exportSAPInvoiceToXML && Lib.AP.InvoiceType.isPOGLInvoice();
                };
                return InvoiceExporter;
            }(Lib.ERP.InvoiceExporter.Instance));
            SAP.InvoiceExporter = InvoiceExporter;
        })(SAP = ERP.SAP || (ERP.SAP = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAP.Manager.documentFactories[Lib.ERP.InvoiceExporter.docType] = function (manager) {
    return new Lib.ERP.SAP.InvoiceExporter(manager);
};
