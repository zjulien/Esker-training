///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_DD_COMMON_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Common helpers",
  "require": []
}*/
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        var Common;
        (function (Common) {
            function CheckFeatureSet(familyPrefix) {
                var _a, _b, _c;
                var familyVariable = (_a = Variable.GetValueAsString("SDADocumentFamily")) !== null && _a !== void 0 ? _a : "";
                if (familyVariable.indexOf(familyPrefix) === 0) {
                    return true;
                }
                var familyField = (_b = Data.GetValue("Family__")) !== null && _b !== void 0 ? _b : "";
                if (familyField.indexOf(familyPrefix) === 0) {
                    return true;
                }
                var familyConfiguration = (_c = Sys.DD.GetParameter("Family__")) !== null && _c !== void 0 ? _c : "";
                if (familyConfiguration.indexOf(familyPrefix) === 0) {
                    return true;
                }
                return false;
            }
            Common.CheckFeatureSet = CheckFeatureSet;
        })(Common = DD.Common || (DD.Common = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
