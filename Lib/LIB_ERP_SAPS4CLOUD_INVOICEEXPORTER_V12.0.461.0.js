/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAPS4CLOUD_InvoiceExporter_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Invoice exporter document for SAPS4CLOUD ERP - system library",
  "require": [
    "Lib_ERP_InvoiceExporter_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAPS4CLOUD;
        (function (SAPS4CLOUD) {
            var InvoiceExporter = /** @class */ (function (_super) {
                __extends(InvoiceExporter, _super);
                function InvoiceExporter(manager) {
                    return _super.call(this, manager) || this;
                }
                InvoiceExporter.prototype.ShouldExportXML = function ( /*postCondition, endCondition*/) {
                    // Using direct web services calls
                    // No XML Export
                    return false;
                };
                return InvoiceExporter;
            }(Lib.ERP.InvoiceExporter.Instance));
            SAPS4CLOUD.InvoiceExporter = InvoiceExporter;
        })(SAPS4CLOUD = ERP.SAPS4CLOUD || (ERP.SAPS4CLOUD = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAPS4CLOUD.Manager.documentFactories[Lib.ERP.InvoiceExporter.docType] = function (manager) {
    return new Lib.ERP.SAPS4CLOUD.InvoiceExporter(manager);
};
