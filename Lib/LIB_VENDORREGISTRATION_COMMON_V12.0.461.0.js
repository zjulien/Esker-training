/* LIB_DEFINITION{
  "name": "Lib_VendorRegistration_Common_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "VendorRegistration common library",
  "require": []
}*/
///#GLOBALS Lib Sys
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var Common;
        (function (Common) {
            var VendorManagementCompanyCodeGlobalSettings;
            (function (VendorManagementCompanyCodeGlobalSettings) {
                VendorManagementCompanyCodeGlobalSettings["OneCompanyCode"] = "OneCompanyCode";
                VendorManagementCompanyCodeGlobalSettings["AllCompanyCodes"] = "AllCompanyCodes";
            })(VendorManagementCompanyCodeGlobalSettings = Common.VendorManagementCompanyCodeGlobalSettings || (Common.VendorManagementCompanyCodeGlobalSettings = {}));
            Common.Parameters = {
                apParameters: Sys.Parameters.GetInstance("AP"),
                p2pParameters: Sys.Parameters.GetInstance("P2P"),
                IsERPIntegrationParameterEnabled: function () {
                    return Common.Parameters.apParameters.GetParameter("EnableVendorERPConnection", "0") === "1";
                },
                IsERPIntegrationWizardParameterEnabled: function () {
                    var externalVariable = Variable.GetValueAsString("EnableVendorERPConnection");
                    if (externalVariable === "1" || externalVariable === "0") {
                        Variable.SetValueAsString("EnableVendorERPConnection", null);
                        var defaultValue = Common.Parameters.apParameters.GetParameter("EnableVendorERPConnection", "0");
                        Variable.SetValueAsString("EnableVendorERPConnection", externalVariable);
                        return defaultValue === "1";
                    }
                    return Common.Parameters.apParameters.GetParameter("EnableVendorERPConnection", "0") === "1";
                },
                GetVendorManagementCompanyCodeBehavior: function () {
                    var param = Common.Parameters.p2pParameters.GetParameter("VendorManagementCompanyCodeGlobalSetting", VendorManagementCompanyCodeGlobalSettings.OneCompanyCode);
                    if (param !== VendorManagementCompanyCodeGlobalSettings.AllCompanyCodes) {
                        return VendorManagementCompanyCodeGlobalSettings.OneCompanyCode;
                    }
                    return VendorManagementCompanyCodeGlobalSettings.AllCompanyCodes;
                },
                IsVendorManagementCompanyCodeMandatory: function () {
                    var companyCodeBehavior = Lib.VendorRegistration.Common.Parameters.GetVendorManagementCompanyCodeBehavior();
                    return companyCodeBehavior === Lib.VendorRegistration.Common.VendorManagementCompanyCodeGlobalSettings.OneCompanyCode;
                },
                IsVendorERPConnectionEnabled: function () {
                    return Common.Parameters.apParameters.GetParameter("EnableVendorERPConnection", "0") === "1";
                },
                IsOFACEnabled: function () {
                    return Common.Parameters.apParameters.GetParameter("EnableOFACVerification", "0") === "1";
                },
                IsSisIDEnabled: function () {
                    return Common.Parameters.apParameters.GetParameter("EnableSiSid", "0") === "1";
                },
                GetSisIDLogin: function () {
                    return Common.Parameters.apParameters.GetParameter("SiSidLogin");
                },
                GetSisIDPassword: function () {
                    return Common.Parameters.apParameters.GetParameter("SiSidPassword");
                },
                NeedToWaitConfigQuery: function () {
                    if (Common.Parameters.apParameters.IsReady() &&
                        Common.Parameters.p2pParameters.IsReady() &&
                        Variable.GetValueAsString("tableParameters")) {
                        return false;
                    }
                    return true;
                },
                SynchronizeConfig: function () {
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        if (Common.Parameters.NeedToWaitConfigQuery()) {
                            // We need to wait for the AP and P2P configuration query response (the ERP (at least) is required before initializing the form)
                            Log.Info("Loading configuration...");
                            Common.Parameters.apParameters.IsReady(function () {
                                if (!Common.Parameters.p2pParameters.IsReady()) {
                                    Common.Parameters.p2pParameters.IsReady(resolve);
                                }
                                else {
                                    resolve();
                                }
                            });
                        }
                        else {
                            // Everything required to initialize the form is already set.
                            // Do not wait configuration query response.
                            resolve();
                        }
                    });
                }
            };
        })(Common = VendorRegistration.Common || (VendorRegistration.Common = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
