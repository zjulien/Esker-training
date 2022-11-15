/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_EBS_PurchaseOrder_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchase order document for EBS ERP - system library",
  "require": [
    "Lib_ERP_PurchaseOrder_V12.0.461.0",
    "Lib_ERP_EBS_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var EBS;
        (function (EBS) {
            var PurchaseOrder = /** @class */ (function (_super) {
                __extends(PurchaseOrder, _super);
                function PurchaseOrder(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        EBS: {
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
                    return this.manager.SimpleDocCreation(Lib.ERP.PurchaseOrder.docType, this.manager.definition.EBS[Lib.ERP.PurchaseOrder.docType].Create);
                };
                PurchaseOrder.prototype.Change = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.PurchaseOrder.docType, this.manager.definition.EBS[Lib.ERP.PurchaseOrder.docType].Change);
                };
                PurchaseOrder.prototype.AttachURL = function () {
                    if (Sys.Helpers.IsFunction(this.manager.definition.EBS[Lib.ERP.PurchaseOrder.docType].AttachURL)) {
                        this.manager.definition.EBS[Lib.ERP.PurchaseOrder.docType].AttachURL.call(this.manager);
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
            EBS.PurchaseOrder = PurchaseOrder;
        })(EBS = ERP.EBS || (ERP.EBS = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.EBS.Manager.documentFactories[Lib.ERP.PurchaseOrder.docType] = function (manager) {
    return new Lib.ERP.EBS.PurchaseOrder(manager);
};
