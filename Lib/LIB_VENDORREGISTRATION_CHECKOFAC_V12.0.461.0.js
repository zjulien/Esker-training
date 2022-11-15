///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_VendorRegistration_CheckOFAC_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "VendorRegistration library",
  "require": [
    "Sys/Sys_Helpers_LdapUtil",
    "[Sys/Sys_OFAC_Server]",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "[Lib_AP_Customization_VendorRegistration]",
    "[Lib_VendorRegistration_Customization_Common]"
  ]
}*/
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var CheckOFAC;
        (function (CheckOFAC) {
            var OFACFieldsInWarning;
            var OFACSearchTag;
            (function (OFACSearchTag) {
                OFACSearchTag["Company"] = "Company";
                OFACSearchTag["VAT"] = "VAT#";
                OFACSearchTag["Contact"] = "Contact(s)";
            })(OFACSearchTag = CheckOFAC.OFACSearchTag || (CheckOFAC.OFACSearchTag = {}));
            function GetOFACMinScore() {
                var customMinScore = null;
                if (Sys.Helpers.TryGetFunction("Lib.AP.Customization.VendorRegistration.GetOFACMinScore")) {
                    // deprecated
                    customMinScore = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorRegistration.GetOFACMinScore");
                }
                else {
                    customMinScore = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Common.GetOFACMinScore");
                }
                if (customMinScore &&
                    !isNaN(customMinScore) &&
                    customMinScore >= 50 &&
                    customMinScore <= 100) {
                    return customMinScore;
                }
                return 80;
            }
            CheckOFAC.GetOFACMinScore = GetOFACMinScore;
            function CheckAllOFACLists() {
                var allOFACResults = [];
                OFACFieldsInWarning = { fields: [], tables: [] };
                allOFACResults = GetOFACListByCompanyName().concat(GetOFACListByVAT(), GetOFACListByContact());
                var OFACResults = DeleteDuplicates(allOFACResults);
                Log.Info("OFACResults : ".concat(OFACResults.length));
                SetOFACList(OFACResults, Sys.OFAC.Common.KEY_OFAC_LIST);
                SetOFACList(OFACFieldsInWarning, Sys.OFAC.Common.OFAC_RESULT_WARNING);
            }
            CheckOFAC.CheckAllOFACLists = CheckAllOFACLists;
            function GetLastOFACResults() {
                return Sys.Helpers.GetSerializedObjectFromVariable(Sys.OFAC.Common.KEY_OFAC_LIST, []);
            }
            CheckOFAC.GetLastOFACResults = GetLastOFACResults;
            function ResetOFACResults() {
                SetOFACList([], Sys.OFAC.Common.KEY_OFAC_LIST);
            }
            CheckOFAC.ResetOFACResults = ResetOFACResults;
            function GetLastOFACWarnings() {
                return Sys.Helpers.GetSerializedObjectFromVariable(Sys.OFAC.Common.OFAC_RESULT_WARNING, null);
            }
            CheckOFAC.GetLastOFACWarnings = GetLastOFACWarnings;
            function GetOFACListByCompanyName() {
                Log.Info("GetOFACListByCompanyName");
                var field = "Company__";
                var options = {
                    searchBy: Sys.OFAC.Server.OFACSearchBy.Name,
                    searchTag: OFACSearchTag.Company,
                    minScore: GetOFACMinScore(),
                    filter: {
                        type: Sys.OFAC.Common.OFACType.Entity,
                        country: Data.GetValue("Country__")
                    }
                };
                var queryValue = Data.GetValue(field).trim();
                var companyList = Sys.OFAC.Server.queryOFAC(queryValue, options);
                if (companyList && companyList.length > 0) {
                    OFACFieldsInWarning.fields.push(field);
                    return companyList;
                }
                return [];
            }
            function GetOFACListByVAT() {
                Log.Info("GetOFACListByVAT");
                var field = "TaxID__";
                var options = {
                    searchBy: Sys.OFAC.Server.OFACSearchBy.Id,
                    searchTag: OFACSearchTag.VAT,
                    minScore: GetOFACMinScore(),
                    filter: {
                        type: Sys.OFAC.Common.OFACType.Entity,
                        country: Data.GetValue("Country__")
                    }
                };
                var queryValue = Data.GetValue(field).trim();
                var vatList = Sys.OFAC.Server.queryOFAC(queryValue, options);
                if (vatList && vatList.length > 0) {
                    OFACFieldsInWarning.fields.push(field);
                    return vatList;
                }
                return [];
            }
            function GetOFACListByContact() {
                Log.Info("GetOFACListByContact");
                var field = "LastName__";
                var field2 = "FirstName__";
                var options = {
                    searchBy: Sys.OFAC.Server.OFACSearchBy.Name,
                    searchTag: OFACSearchTag.Contact,
                    minScore: GetOFACMinScore(),
                    filter: {
                        type: Sys.OFAC.Common.OFACType.Individual,
                        country: Data.GetValue("Country__")
                    }
                };
                var contactsList = [];
                var queryValue;
                var contactsTable = Data.GetTable("CompanyOfficersTable__");
                for (var i = 0; i < contactsTable.GetItemCount(); i++) {
                    var item = contactsTable.GetItem(i);
                    queryValue = "".concat(item.GetValue(field).trim(), " ").concat(item.GetValue(field2).trim());
                    var ofacMatches = Sys.OFAC.Server.queryOFAC(queryValue, options);
                    if (ofacMatches && ofacMatches.length > 0) {
                        OFACFieldsInWarning.tables.push({ name: "CompanyOfficersTable__", line: i, column: field });
                        OFACFieldsInWarning.tables.push({ name: "CompanyOfficersTable__", line: i, column: field2 });
                        contactsList = contactsList.concat(ofacMatches);
                    }
                }
                return contactsList;
            }
            function DeleteDuplicates(allOFACResults) {
                var cleanResults = new Array();
                var seen = {};
                var j = 0;
                for (var _i = 0, allOFACResults_1 = allOFACResults; _i < allOFACResults_1.length; _i++) {
                    var ofacResult = allOFACResults_1[_i];
                    var itemRes = ofacResult.id;
                    if (seen[itemRes] === undefined) {
                        seen[itemRes] = j;
                        cleanResults[j] = ofacResult;
                        j++;
                    }
                    else {
                        cleanResults[seen[itemRes]].searchTag = "".concat(cleanResults[seen[itemRes]].searchTag, " / ").concat(ofacResult.searchTag);
                    }
                }
                return cleanResults;
            }
            function SetOFACList(OFACList, key) {
                if (OFACList) {
                    try {
                        var OFACJson = JSON.stringify(OFACList);
                        Variable.SetValueAsString(key, OFACJson);
                    }
                    catch (e) {
                        Log.Info("Unable to parse the list OFAC against the current pending registration");
                    }
                }
                else {
                    Variable.SetValueAsString(key, "");
                }
            }
            /**
             * Get ofac results as a list grouped by the strings that matched ofac entries
             * @memberOf Lib.VendorRegistration.CheckOFAC
             * @param {Array.<Sys.OFAC.Common.OFACResult>} results Ofac results
             * @param {boolean} bHTML specify the format (HTML for the warning banner, else Plain text for the workflow history)
             * @return {string} grouped list
             */
            function FormatOFACDisplay(results, bHTML) {
                var endLine = bHTML ? "<br/>" : "\n-------------\n";
                var startToken = bHTML ? "<b>" : "\"";
                var endToken = bHTML ? "</b>" : "\"";
                var displayJSON = {};
                var display = "";
                // group results by search string
                results.forEach(function (result) {
                    if (displayJSON[result.originalString]) {
                        displayJSON[result.originalString][1] += " ; ".concat(startToken).concat(result.name).concat(endToken, " (").concat(result.score, ")");
                    }
                    else {
                        displayJSON[result.originalString] = ["".concat(startToken).concat(result.originalString).concat(endToken), "".concat(startToken).concat(result.name).concat(endToken, " (").concat(result.score, ")")];
                    }
                });
                for (var originalString in displayJSON) {
                    if (Object.prototype.hasOwnProperty.call(displayJSON, originalString)) {
                        display += Language.Translate("_{0}IsAPossibleMatchWith{1}", true, displayJSON[originalString][0], displayJSON[originalString][1]) + endLine;
                    }
                }
                return display;
            }
            CheckOFAC.FormatOFACDisplay = FormatOFACDisplay;
            function addRegistrationWarningField(fieldsToCheck, fldName, tableName) {
                if (tableName === void 0) { tableName = null; }
                var addInObject = fieldsToCheck;
                if (tableName) {
                    if (typeof fieldsToCheck[tableName] === "undefined") {
                        fieldsToCheck[tableName] = {};
                    }
                    addInObject = fieldsToCheck[tableName];
                }
                if (typeof addInObject[fldName] === "undefined") {
                    addInObject[fldName] = "";
                }
            }
            /**
             * This function is used to complete the list of fields to reset warnings when the vendor registration
             * form is displayed as a vendor
             * @param {object} fieldsToCheck The list of fields from the duplicate check lib
             * @returns {object} the completed fieldsToCheck object
             */
            function ExtendRegistrationWarningFields(fieldsToCheck) {
                if (!fieldsToCheck) {
                    return fieldsToCheck;
                }
                // Complete fieldsToCheck with Sys.OFAC.Common.OFAC_RESULT_WARNING
                var ofacWarnings = Lib.VendorRegistration.CheckOFAC.GetLastOFACWarnings();
                if (ofacWarnings) {
                    if (ofacWarnings.fields) {
                        ofacWarnings.fields.forEach(function (fld) {
                            addRegistrationWarningField(fieldsToCheck, fld);
                        });
                    }
                    if (ofacWarnings.tables) {
                        ofacWarnings.tables.forEach(function (tableFld) {
                            addRegistrationWarningField(fieldsToCheck, tableFld.column, tableFld.name);
                        });
                    }
                }
                return fieldsToCheck;
            }
            CheckOFAC.ExtendRegistrationWarningFields = ExtendRegistrationWarningFields;
        })(CheckOFAC = VendorRegistration.CheckOFAC || (VendorRegistration.CheckOFAC = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
