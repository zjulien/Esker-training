/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_EBS_InvoiceExporter_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Invoice exporter document for EBS ERP - system library",
  "require": [
    "Lib_ERP_InvoiceExporter_V12.0.461.0",
    "Lib_ERP_EBS_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var EBS;
        (function (EBS) {
            var InvoiceExporter = /** @class */ (function (_super) {
                __extends(InvoiceExporter, _super);
                function InvoiceExporter(manager) {
                    return _super.call(this, manager) || this;
                }
                return InvoiceExporter;
            }(Lib.ERP.InvoiceExporter.Instance));
            EBS.InvoiceExporter = InvoiceExporter;
        })(EBS = ERP.EBS || (ERP.EBS = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.EBS.Manager.documentFactories[Lib.ERP.InvoiceExporter.docType] = function (manager) {
    return new Lib.ERP.EBS.InvoiceExporter(manager);
};
