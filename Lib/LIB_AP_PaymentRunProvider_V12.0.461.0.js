/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_AP_PaymentRunProvider_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Payment Run Provider library",
  "require": [
    "Lib_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Parameters",
    "Sys/Sys_GenericAPI_Server",
    "Lib_AP_PaymentRunProvider_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var PaymentRunProvider;
        (function (PaymentRunProvider) {
            /**
             * Create a new Payment Run Provider Manager according to its name
             * @param {string} paymentRunProviderName Payment Provider Name. A factory with the same name must be registered
             * @returns {Lib.PaymentRunProvider.Manager.Instance|null}
             */
            function CreateManager(paymentRunProviderName) {
                var paymentRunProviderManager = null;
                if (Lib.AP.PaymentRunProvider.IsSupportedManager(paymentRunProviderName)) {
                    paymentRunProviderManager = Lib.AP.PaymentRunProvider.Manager.factories[paymentRunProviderName]();
                }
                else {
                    Log.Error("No Payment Run Provider manager defined for paymentRunProviderName: \"".concat(paymentRunProviderName, "\""));
                }
                return paymentRunProviderManager;
            }
            PaymentRunProvider.CreateManager = CreateManager;
            /**
            * Returns if an Payment Run Provider manager is registered with the specified Payment Run Provider name.
            * @param {string} PaymentRunProviderName the Payment Run Provider name to test.
            * @returns {boolean}
            */
            function IsSupportedManager(PaymentRunProviderName) {
                return Sys.Helpers.IsFunction(Lib.AP.PaymentRunProvider.Manager.factories[PaymentRunProviderName]);
            }
            PaymentRunProvider.IsSupportedManager = IsSupportedManager;
            var PaymentRun;
            (function (PaymentRun) {
                /**
                 * Define common functions have to be implemented to manage Payment Runs with a provider
                 */
                var Instance = /** @class */ (function (_super) {
                    __extends(Instance, _super);
                    function Instance(manager) {
                        var _this = _super.call(this) || this;
                        _this.manager = manager;
                        return _this;
                    }
                    return Instance;
                }(Lib.AP.PaymentRunProvider.Manager.PaymentRun));
                PaymentRun.Instance = Instance;
            })(PaymentRun = PaymentRunProvider.PaymentRun || (PaymentRunProvider.PaymentRun = {}));
        })(PaymentRunProvider = AP.PaymentRunProvider || (AP.PaymentRunProvider = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
