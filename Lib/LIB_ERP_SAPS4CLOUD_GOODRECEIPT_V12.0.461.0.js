/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAPS4CLOUD_GoodReceipt_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Good receipt document for SAPS4CLOUD ERP - system library",
  "require": [
    "Lib_ERP_GoodReceipt_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAPS4CLOUD;
        (function (SAPS4CLOUD) {
            var GoodReceipt = /** @class */ (function (_super) {
                __extends(GoodReceipt, _super);
                function GoodReceipt(manager) {
                    var _this = _super.call(this, manager) || this;
                    // define user exists entry points
                    _this.manager.ExtendDefinition({
                        SAPS4CLOUD: {
                            GR: {
                                Create: null,
                                AttachURL: null
                            }
                        }
                    });
                    return _this;
                }
                GoodReceipt.prototype.Create = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.GoodReceipt.docType, this.manager.definition.SAPS4CLOUD[Lib.ERP.GoodReceipt.docType].Create);
                };
                GoodReceipt.prototype.AttachURL = function () {
                    if (Sys.Helpers.IsFunction(this.manager.definition.SAPS4CLOUD[Lib.ERP.GoodReceipt.docType].AttachURL)) {
                        this.manager.definition.SAPS4CLOUD[Lib.ERP.GoodReceipt.docType].AttachURL.call(this.manager);
                    }
                };
                GoodReceipt.prototype.CheckError = function () {
                    return false;
                };
                GoodReceipt.prototype.Retry = function () {
                    return true;
                };
                GoodReceipt.prototype.Cancel = function () {
                    return this.manager.SimpleDocCreation(Lib.ERP.GoodReceipt.docType, this.manager.definition.SAPS4CLOUD[Lib.ERP.GoodReceipt.docType].Cancel);
                };
                return GoodReceipt;
            }(Lib.ERP.GoodReceipt.Instance));
            SAPS4CLOUD.GoodReceipt = GoodReceipt;
        })(SAPS4CLOUD = ERP.SAPS4CLOUD || (ERP.SAPS4CLOUD = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAPS4CLOUD.Manager.documentFactories[Lib.ERP.GoodReceipt.docType] = function (manager) {
    return new Lib.ERP.SAPS4CLOUD.GoodReceipt(manager);
};
