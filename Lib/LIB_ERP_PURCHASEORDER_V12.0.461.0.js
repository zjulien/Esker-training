/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_PurchaseOrder_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base purchase order document for ERP - system library",
  "require": [
    "Lib_ERP_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var PurchaseOrder;
        (function (PurchaseOrder) {
            PurchaseOrder.docType = "PO";
            PurchaseOrder.defaultDefinition = {};
            var Instance = /** @class */ (function () {
                function Instance(manager) {
                    this.manager = manager;
                }
                return Instance;
            }());
            PurchaseOrder.Instance = Instance;
        })(PurchaseOrder = ERP.PurchaseOrder || (ERP.PurchaseOrder = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
