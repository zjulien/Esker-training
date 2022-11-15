/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_GoodReceipt_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base good receipt document for ERP - system library",
  "require": [
    "Lib_ERP_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var GoodReceipt;
        (function (GoodReceipt) {
            GoodReceipt.docType = "GR";
            GoodReceipt.defaultDefinition = {};
            var Instance = /** @class */ (function (_super) {
                __extends(Instance, _super);
                function Instance(manager) {
                    var _this = _super.call(this) || this;
                    _this.manager = manager;
                    return _this;
                }
                return Instance;
            }(Lib.ERP.Manager.Document));
            GoodReceipt.Instance = Instance;
        })(GoodReceipt = ERP.GoodReceipt || (ERP.GoodReceipt = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
