/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "Lib_ERP_NAV_PurchaseOrder_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchase order document for NAV ERP - system library",
  "require": [
    "Lib_ERP_PurchaseOrder_V12.0.461.0",
    "Lib_ERP_NAV_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var NAV;
        (function (NAV) {
            var PurchaseOrder = /** @class */ (function (_super) {
                __extends(PurchaseOrder, _super);
                function PurchaseOrder(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        NAV: {
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
                    return this.manager.SimpleDocCreation(Lib.ERP.PurchaseOrder.docType, this.manager.definition.NAV[Lib.ERP.PurchaseOrder.docType].Create);
                };
                PurchaseOrder.prototype.Change = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.PurchaseOrder.docType, this.manager.definition.NAV[Lib.ERP.PurchaseOrder.docType].Change);
                };
                PurchaseOrder.prototype.AttachURL = function () {
                    if (Sys.Helpers.IsFunction(this.manager.definition.NAV[Lib.ERP.PurchaseOrder.docType].AttachURL)) {
                        this.manager.definition.NAV[Lib.ERP.PurchaseOrder.docType].AttachURL.call(this.manager);
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
            NAV.PurchaseOrder = PurchaseOrder;
        })(NAV = ERP.NAV || (ERP.NAV = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.NAV.Manager.documentFactories[Lib.ERP.PurchaseOrder.docType] = function (manager) {
    return new Lib.ERP.NAV.PurchaseOrder(manager);
};
