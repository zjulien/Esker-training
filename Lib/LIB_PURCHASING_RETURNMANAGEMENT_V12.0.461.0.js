///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ReturnManagement_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Common",
  "comment": "Purchasing library to manage return management",
  "require": [
    "Sys/Sys_Parameters"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ReturnManagement;
        (function (ReturnManagement) {
            function IsEnabled() {
                return Sys.Helpers.Data.IsTrue(Sys.Parameters.GetInstance("P2P").GetParameter("EnableReturnManagement", false));
            }
            ReturnManagement.IsEnabled = IsEnabled;
        })(ReturnManagement = Purchasing.ReturnManagement || (Purchasing.ReturnManagement = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
