/* LIB_DEFINITION{
  "name": "Lib_AP_CompanyCodeDetermination_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_AP_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var CompanyCodeDetermination;
        (function (CompanyCodeDetermination) {
            function queryAndSearchKeywords() {
                var matchingCompanyCodes = [];
                var filter = "(DeterminationKeyword__=*)";
                var attributes = ["CompanyCode__", "DeterminationKeyword__", "DefaultConfiguration__"];
                Sys.GenericAPI.Query("PurchasingCompanycodes__", filter, attributes, function (results, error) {
                    if (!error && results && results.length) {
                        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                            var result = results_1[_i];
                            if (!result.DeterminationKeyword__) {
                                continue;
                            }
                            var areaFound = Document.SearchString({
                                "valueToSearch": result.DeterminationKeyword__,
                                "type": "regexp",
                                "page": 0
                            });
                            if (areaFound && areaFound.length) {
                                matchingCompanyCodes.push({
                                    companyCode: result.CompanyCode__,
                                    area: areaFound[0],
                                    defaultConfiguration: result.DefaultConfiguration__
                                });
                            }
                        }
                    }
                });
                return matchingCompanyCodes;
            }
            function DetermineCompanyCodeFromKeywords() {
                var autoDeterminedResultString = Variable.GetValueAsString("AutoDeterminedResult");
                var matchingCompanyCodes = [];
                if (autoDeterminedResultString) {
                    try {
                        matchingCompanyCodes = JSON.parse(autoDeterminedResultString);
                        // The JSON.stringify/parse removes the methods of the Area object so we need to re-build it
                        for (var _i = 0, matchingCompanyCodes_1 = matchingCompanyCodes; _i < matchingCompanyCodes_1.length; _i++) {
                            var matchCC = matchingCompanyCodes_1[_i];
                            matchCC.area = Document.GetArea(matchCC.area.page, matchCC.area.x, matchCC.area.y, matchCC.area.width, matchCC.area.height);
                        }
                        Log.Info("Auto-determination of company code - ReExtracted with configuration: ".concat(Data.GetValue("Configuration__")));
                    }
                    catch (error) {
                        Log.Error("Failed to parse external variable AutoDeterminedResult: ".concat(error));
                    }
                    return matchingCompanyCodes;
                }
                var autoDetermination = Sys.Parameters.GetInstance("AP").GetParameter("AutomatedDeterminationCompanyCode");
                if (autoDetermination === "1") {
                    matchingCompanyCodes = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.CompanyCodeDetermination");
                    if (!matchingCompanyCodes) {
                        matchingCompanyCodes = queryAndSearchKeywords();
                    }
                }
                else {
                    return null;
                }
                return matchingCompanyCodes;
            }
            CompanyCodeDetermination.DetermineCompanyCodeFromKeywords = DetermineCompanyCodeFromKeywords;
            function ReExtract(matchingCompanyCode) {
                var newConfiguration = matchingCompanyCode[0].defaultConfiguration;
                Lib.P2P.ChangeConfiguration(newConfiguration).Then(function () {
                    Sys.Parameters.GetInstance("AP").Serialize();
                    Log.Info("Auto-determination of company code - ReExtract with configuration: ".concat(newConfiguration));
                    Process.ReExtract({
                        configuration: newConfiguration,
                        tableParameters: Variable.GetValueAsString("tableParameters"),
                        forwardToCorrectAP: "1",
                        AutoDeterminedResult: JSON.stringify(matchingCompanyCode)
                    });
                });
            }
            CompanyCodeDetermination.ReExtract = ReExtract;
            function GetMultipleMatchesWarning(matchingCompanyCodes) {
                if (matchingCompanyCodes.length > 1) {
                    var concatenatedCompanyCodes = matchingCompanyCodes.slice(1).map(function (matchingCC) { return matchingCC.companyCode; }).join(" ");
                    return Language.Translate("_multiple matching company codes : {0}", false, concatenatedCompanyCodes);
                }
                return "";
            }
            function GetCompanyCodeInfo() {
                var companyCodeInfo = {
                    companyCode: null,
                    companyCodeArea: null,
                    warningMessage: ""
                };
                // Try to determine the Company code based on the Keywords defined in P2P-Company Code table
                var matchingCompanyCodes = Lib.AP.CompanyCodeDetermination.DetermineCompanyCodeFromKeywords();
                if (matchingCompanyCodes && matchingCompanyCodes.length) {
                    var firstMatch = matchingCompanyCodes[0];
                    if (firstMatch.defaultConfiguration && firstMatch.defaultConfiguration !== Data.GetValue("Configuration__")) {
                        Lib.AP.CompanyCodeDetermination.ReExtract(matchingCompanyCodes);
                        return null;
                    }
                    companyCodeInfo.companyCode = firstMatch.companyCode;
                    companyCodeInfo.companyCodeArea = firstMatch.area;
                    companyCodeInfo.warningMessage = GetMultipleMatchesWarning(matchingCompanyCodes);
                }
                else {
                    // Fallback on the configuration
                    companyCodeInfo.companyCode = Sys.Parameters.GetInstance("AP").GetParameter("CompanyCode");
                    if (matchingCompanyCodes !== null) {
                        // Automated company code determination option was enabled
                        companyCodeInfo.warningMessage = Language.Translate("_using default company code", false);
                    }
                }
                return companyCodeInfo;
            }
            CompanyCodeDetermination.GetCompanyCodeInfo = GetCompanyCodeInfo;
        })(CompanyCodeDetermination = AP.CompanyCodeDetermination || (AP.CompanyCodeDetermination = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
