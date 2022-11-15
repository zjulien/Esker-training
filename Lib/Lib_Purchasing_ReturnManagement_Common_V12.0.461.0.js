///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ReturnManagement_Common_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Common lib for Return Management",
  "require": [
    "Lib_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ReturnManagement;
        (function (ReturnManagement) {
            // eslint-disable-next-line no-empty-function
            function Noop() {
                Log.Info("[Noop]");
            }
            ReturnManagement.Noop = Noop;
        })(ReturnManagement = Purchasing.ReturnManagement || (Purchasing.ReturnManagement = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
