/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_EBS_Manager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "ERP Manager for EBS - system library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Object",
    "Lib_ERP_Manager_V12.0.461.0",
    "Lib_ERP_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var EBS;
        (function (EBS) {
            var Manager = /** @class */ (function (_super) {
                __extends(Manager, _super);
                function Manager() {
                    return _super.call(this, "EBS") || this;
                }
                Object.defineProperty(Manager.prototype, "documentFactories", {
                    get: function () {
                        return Manager.documentFactories;
                    },
                    enumerable: false,
                    configurable: true
                });
                Manager.documentFactories = {};
                return Manager;
            }(Lib.ERP.Manager.Instance));
            EBS.Manager = Manager;
        })(EBS = ERP.EBS || (ERP.EBS = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.Manager.factories.EBS = function () {
    return new Lib.ERP.EBS.Manager();
};
