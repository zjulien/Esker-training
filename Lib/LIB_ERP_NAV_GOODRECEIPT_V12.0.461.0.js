/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "Lib_ERP_NAV_GoodReceipt_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Good receipt document for NAV ERP - system library",
  "require": [
    "Lib_ERP_GoodReceipt_V12.0.461.0",
    "Lib_ERP_NAV_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var NAV;
        (function (NAV) {
            var GoodReceipt = /** @class */ (function (_super) {
                __extends(GoodReceipt, _super);
                function GoodReceipt(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        NAV: {
                            GR: {
                                Create: null,
                                AttachURL: null
                            }
                        }
                    });
                    return _this;
                }
                GoodReceipt.prototype.Create = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.GoodReceipt.docType, this.manager.definition.NAV[Lib.ERP.GoodReceipt.docType].Create);
                };
                GoodReceipt.prototype.AttachURL = function () {
                    if (Sys.Helpers.IsFunction(this.manager.definition.NAV[Lib.ERP.GoodReceipt.docType].AttachURL)) {
                        this.manager.definition.NAV[Lib.ERP.GoodReceipt.docType].AttachURL.call(this.manager);
                    }
                };
                GoodReceipt.prototype.CheckError = function () {
                    return false;
                };
                GoodReceipt.prototype.Retry = function () {
                    return true;
                };
                GoodReceipt.prototype.Cancel = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.GoodReceipt.docType, this.manager.definition.NAV[Lib.ERP.GoodReceipt.docType].Cancel);
                };
                return GoodReceipt;
            }(Lib.ERP.GoodReceipt.Instance));
            NAV.GoodReceipt = GoodReceipt;
        })(NAV = ERP.NAV || (ERP.NAV = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.NAV.Manager.documentFactories[Lib.ERP.GoodReceipt.docType] = function (manager) {
    return new Lib.ERP.NAV.GoodReceipt(manager);
};
