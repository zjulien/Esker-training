/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAPS4CLOUD_Manager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "ERP Manager for SAPS4CLOUD - system library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Object",
    "Lib_ERP_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAPS4CLOUD;
        (function (SAPS4CLOUD) {
            var Manager = /** @class */ (function (_super) {
                __extends(Manager, _super);
                function Manager() {
                    return _super.call(this, "SAPS4CLOUD") || this;
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
            SAPS4CLOUD.Manager = Manager;
        })(SAPS4CLOUD = ERP.SAPS4CLOUD || (ERP.SAPS4CLOUD = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.Manager.factories.SAPS4CLOUD = function () {
    return new Lib.ERP.SAPS4CLOUD.Manager();
};
