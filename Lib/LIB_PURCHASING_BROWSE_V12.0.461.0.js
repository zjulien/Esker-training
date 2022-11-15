///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Browse_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing library",
  "require": [
    "Lib_P2P_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_P2P_Browse_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Browse;
        (function (Browse) {
            Browse.AddLib = Lib.AddLib;
            Browse.ExtendLib = Lib.ExtendLib;
            function InitSAPVariable() {
            }
            function Init() {
                Lib.P2P.Browse.Init("PAC");
                if (Lib.P2P.Browse.GetBrowseERPName() === "SAP") {
                    InitSAPVariable();
                }
                if (Controls.VendorName__ && Lib.P2P.IsPO()) {
                    // In PO, allow other vendors (for request vendor creation)
                    Controls.VendorName__.SetAllowTableValuesOnly(false);
                    Controls.VendorNumber__.SetAllowTableValuesOnly(false);
                }
            }
            Browse.Init = Init;
        })(Browse = Purchasing.Browse || (Purchasing.Browse = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
