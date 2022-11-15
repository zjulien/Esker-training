/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_JDE_Manager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "ERP Manager for JDE - system library",
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
        var JDE;
        (function (JDE) {
            var Manager = /** @class */ (function (_super) {
                __extends(Manager, _super);
                function Manager() {
                    return _super.call(this, "JDE") || this;
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
            JDE.Manager = Manager;
        })(JDE = ERP.JDE || (ERP.JDE = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.Manager.factories.JDE = function () {
    return new Lib.ERP.JDE.Manager();
};
