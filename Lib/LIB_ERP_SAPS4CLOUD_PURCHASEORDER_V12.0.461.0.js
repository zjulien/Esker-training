/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAPS4CLOUD_PurchaseOrder_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchase order document for SAPS4CLOUD ERP - system library",
  "require": [
    "Lib_ERP_PurchaseOrder_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAPS4CLOUD;
        (function (SAPS4CLOUD) {
            var PurchaseOrder = /** @class */ (function (_super) {
                __extends(PurchaseOrder, _super);
                function PurchaseOrder(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        SAPS4CLOUD: {
                            PO: {
                                Create: null,
                                Change: null,
                                AttachURL: null
                            }
                        }
                    });
                    return _this;
                }
                PurchaseOrder.prototype.Create = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.PurchaseOrder.docType, this.manager.definition.SAPS4CLOUD[Lib.ERP.PurchaseOrder.docType].Create);
                };
                PurchaseOrder.prototype.Change = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.PurchaseOrder.docType, this.manager.definition.SAPS4CLOUD[Lib.ERP.PurchaseOrder.docType].Change);
                };
                PurchaseOrder.prototype.AttachURL = function () {
                    if (Sys.Helpers.IsFunction(this.manager.definition.SAPS4CLOUD[Lib.ERP.PurchaseOrder.docType].AttachURL)) {
                        this.manager.definition.SAPS4CLOUD[Lib.ERP.PurchaseOrder.docType].AttachURL.call(this.manager);
                    }
                };
                PurchaseOrder.prototype.CheckError = function () {
                    return false;
                };
                PurchaseOrder.prototype.Retry = function () {
                    return true;
                };
                return PurchaseOrder;
            }(Lib.ERP.PurchaseOrder.Instance));
            SAPS4CLOUD.PurchaseOrder = PurchaseOrder;
        })(SAPS4CLOUD = ERP.SAPS4CLOUD || (ERP.SAPS4CLOUD = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAPS4CLOUD.Manager.documentFactories[Lib.ERP.PurchaseOrder.docType] = function (manager) {
    return new Lib.ERP.SAPS4CLOUD.PurchaseOrder(manager);
};
