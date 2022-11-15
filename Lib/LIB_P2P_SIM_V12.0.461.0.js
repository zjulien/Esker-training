///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_P2P_SIM_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Supplier Information Management",
  "require": [
    "Lib_P2P_V12.0.461.0",
    "Sys/Sys_Helpers_Promise"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var SIM;
        (function (SIM) {
            function OpenCompanyDashboard(vendorNumber, companyCode) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var filter;
                    filter = "(&(|(CompanyCode__=)(!(CompanyCode__=*))(CompanyCode__=" + companyCode + "))(VendorNumber__=" + vendorNumber + "))";
                    Query.DBQuery(function () {
                        var queryResults = this;
                        var nbResults = queryResults.GetRecordsCount();
                        if (nbResults > 0) {
                            Process.OpenMessage(queryResults.GetQueryValue("RUIDEX", 0), true, true);
                            resolve(queryResults.GetQueryValue("RUIDEX", 0));
                        }
                        else {
                            Process.OpenLink({
                                url: "FlexibleForm.aspx?action=run&layout=_flexibleform&pName=Vendor_company_extended_properties__&companycode=" + encodeURIComponent(companyCode) + "&vendornumber=" + encodeURIComponent(vendorNumber) + "&quitOnClose=1",
                                inCurrentTab: false
                            });
                            resolve(null);
                        }
                    }, "Vendor_company_extended_properties__", "RUIDEX|CompanyCode__|VendorNumber__", filter, null, 1);
                });
            }
            SIM.OpenCompanyDashboard = OpenCompanyDashboard;
        })(SIM = P2P.SIM || (P2P.SIM = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
