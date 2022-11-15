/*eslint class-methods-use-this: ["warn", { "exceptMethods": ["CheckError", "Retry"] }] */
/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_EBS_GoodReceipt_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Good receipt document for EBS ERP - system library",
  "require": [
    "Lib_ERP_GoodReceipt_V12.0.461.0",
    "Lib_ERP_EBS_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var EBS;
        (function (EBS) {
            var GoodReceipt = /** @class */ (function (_super) {
                __extends(GoodReceipt, _super);
                function GoodReceipt(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        EBS: {
                            GR: {
                                Create: null,
                                AttachURL: null
                            }
                        }
                    });
                    return _this;
                }
                GoodReceipt.prototype.Create = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.GoodReceipt.docType, this.manager.definition.EBS[Lib.ERP.GoodReceipt.docType].Create);
                };
                GoodReceipt.prototype.AttachURL = function () {
                    if (Sys.Helpers.IsFunction(this.manager.definition.EBS[Lib.ERP.GoodReceipt.docType].AttachURL)) {
                        this.manager.definition.EBS[Lib.ERP.GoodReceipt.docType].AttachURL.call(this.manager);
                    }
                };
                GoodReceipt.prototype.CheckError = function () {
                    return false;
                };
                GoodReceipt.prototype.Retry = function () {
                    return true;
                };
                GoodReceipt.prototype.Cancel = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.GoodReceipt.docType, this.manager.definition.EBS[Lib.ERP.GoodReceipt.docType].Cancel);
                };
                return GoodReceipt;
            }(Lib.ERP.GoodReceipt.Instance));
            EBS.GoodReceipt = GoodReceipt;
        })(EBS = ERP.EBS || (ERP.EBS = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.EBS.Manager.documentFactories[Lib.ERP.GoodReceipt.docType] = function (manager) {
    return new Lib.ERP.EBS.GoodReceipt(manager);
};
