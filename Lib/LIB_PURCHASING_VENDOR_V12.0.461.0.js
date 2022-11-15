///#GLOBALS Lib Sys
/* globals setTimeout*/
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Vendor_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Parameters",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_ShipTo_V12.0.461.0",
    "Lib_ERP_V12.0.461.0",
    "Sys/Sys_TechnicalData"
  ]
}*/
// Common interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Vendor;
        (function (Vendor) {
            var g = Sys.Helpers.Globals;
            // Cache.
            var _vendorNumber;
            var _culture;
            var _language;
            /**
             * PS can add those line in Lib.P2P.Customization.Common
             * if(Lib.Purchasing && Lib.Purchasing.Vendor)
             * {
             * 		Lib.Purchasing.Vendor.defaultCountryCode = "US";
             * }
             */
            Vendor.defaultCountryCode = "";
            var lastSelectedVendorName = Data.GetValue("VendorName__");
            var vendorFieldsMapping = {
                "Number__": "VendorNumber__",
                "Name__": "VendorName__",
                "Email__": "VendorEmail__",
                "VATNumber__": "VendorVatNumber__",
                "FaxNumber__": "VendorFaxNumber__",
                "PaymentTermCode__": "PaymentTermCode__",
                "PaymentTermCode__.Description__": "PaymentTermDescription__"
            };
            function QueryVendorTableEmail(companyCode, vendorNumber) {
                var filter = "&(Number__=" + vendorNumber + ")(|(CompanyCode__=" + companyCode + ")(CompanyCode__=)(CompanyCode__!=*))";
                return Sys.GenericAPI.PromisedQuery({
                    table: "AP - Vendors__",
                    filter: filter,
                    attributes: ["Email__"],
                    maxRecords: 1
                })
                    .Then(function (result) {
                    return result && result.length > 0 ? result[0].Email__ : null;
                });
            }
            // Search firstly in ODUSER via "AP - Vendors links"
            // If not found or non email defined, use "AP - Vendors__"
            function QueryVendorContactEmail(companyCode, vendorNumber) {
                var accountId = Sys.ScriptInfo.IsClient() ? g.User.accountId : Lib.P2P.GetValidatorOrOwner().GetValue("AccountId");
                var filter = "&(Number__=" + vendorNumber + ")(|(CompanyCode__=" + companyCode + ")(CompanyCode__=)(CompanyCode__!=*))";
                return Sys.GenericAPI.PromisedQuery({
                    table: "AP - Vendors links__",
                    filter: filter,
                    attributes: ["ShortLoginPAC__", "ShortLogin__"],
                    maxRecords: 1
                })
                    .Then(function (result) {
                    if (!result || !result.length) {
                        throw "vendor contact email not found, empty result";
                    }
                    var vendorLogin = result[0].ShortLoginPAC__;
                    if (!vendorLogin) {
                        vendorLogin = result[0].ShortLogin__;
                    }
                    vendorLogin = accountId + "$" + vendorLogin;
                    var filter = "&(VENDOR=1)(Login=" + vendorLogin + ")";
                    return Sys.GenericAPI.PromisedQuery({
                        table: "ODUSER",
                        filter: filter,
                        attributes: ["EmailAddress", "Language", "Culture"],
                        maxRecords: 1
                    })
                        .Then(function (result2) {
                        _language = result2 && result2.length > 0 ? result2[0].Language : null;
                        _culture = result2 && result2.length > 0 ? result2[0].Culture : null;
                        if (_language != null && _culture != null) {
                            _vendorNumber = vendorNumber;
                        }
                        var email = result2 && result2.length > 0 ? result2[0].EmailAddress : null;
                        if (email) {
                            Variable.SetValueAsString("ContactLogin", vendorLogin);
                            return email;
                        }
                        Variable.SetValueAsString("ContactLogin", "");
                        return QueryVendorTableEmail(companyCode, vendorNumber);
                    });
                })
                    .Catch(function () { return QueryVendorTableEmail(companyCode, vendorNumber); });
            }
            function GetVendorInfo() {
                var lastSelectedVendorNumber = Data.GetValue("VendorNumber__");
                if (lastSelectedVendorNumber != _vendorNumber) {
                    _vendorNumber = Data.GetValue("VendorNumber__");
                    _culture = null;
                    _language = null;
                    return QueryVendorContactEmail(Data.GetValue("CompanyCode__"), _vendorNumber)
                        .Then(function () { return ({ culture: _culture, language: _language }); });
                }
                return Sys.Helpers.Promise.Resolve({ culture: _culture, language: _language });
            }
            Vendor.GetVendorInfo = GetVendorInfo;
            function OnChange() {
                // If we're here, then the user *manually* typed something in the vendor name that doesn't match any vendor in the database.
                // Then:
                //  - reset the new vendor request
                //  - set an error telling the vendor doesn't exists (only if we're the requester or the buyer)
                //
                if (Data.GetValue("VendorName__") !== lastSelectedVendorName) {
                    Log.Info("Vendor name changed to '" + Data.GetValue("VendorName__") + "'");
                    Variable.SetValueAsString("NewVendor__", "");
                    lastSelectedVendorName = Data.GetValue("VendorName__");
                    Reset();
                    Data.SetValue("VendorName__", lastSelectedVendorName);
                    if (!Sys.Helpers.IsEmpty(Data.GetValue("VendorName__"))) {
                        Data.SetError("VendorName__", Language.Translate("Unknown vendor"));
                    }
                }
            }
            Vendor.OnChange = OnChange;
            function OnSelectItem(item) {
                var vendorSelected = function () {
                    Log.Info("Vendor selected");
                    Variable.SetValueAsString("NewVendor__", "");
                    lastSelectedVendorName = Data.GetValue("VendorName__");
                    QueryVendorContactEmail(Data.GetValue("CompanyCode__"), item.GetValue("Number__"))
                        .Then(function (email) {
                        Fill(function (fieldName) {
                            return fieldName === "Email__" ? email : item.GetValue(fieldName);
                        });
                    });
                    // In Punchout mode, items must be in error if they don't match the selected vendor
                    if (Lib.Purchasing.Punchout && Lib.Purchasing.Punchout.PO && Lib.Purchasing.Punchout.PO.IsEnabled()) {
                        Lib.Purchasing.Punchout.PO.UpdatePane(item.GetValue("Number__"));
                    }
                };
                if (!Sys.Helpers.IsEmpty(Data.GetValue("PaymentTermCode__"))
                    || !Sys.Helpers.IsEmpty(Data.GetValue("VendorEmail__"))) {
                    var lastLastSelectedVendorName_1 = lastSelectedVendorName;
                    lastSelectedVendorName = Data.GetValue("VendorName__");
                    setTimeout(function () {
                        Lib.CommonDialog.PopupYesCancel(function (action) {
                            if (action === "Yes") {
                                vendorSelected();
                            }
                            else {
                                // Reset previous selected vendor
                                lastSelectedVendorName = lastLastSelectedVendorName_1;
                                Data.SetValue("VendorName__", lastSelectedVendorName);
                            }
                        }, "_Warning", "_Any fields related to the vendor will be reset. Are you sure you want to continue?", "_Yes", "_No");
                    });
                }
                else {
                    vendorSelected();
                }
            }
            Vendor.OnSelectItem = OnSelectItem;
            function IsEmpty() {
                return Sys.Helpers.IsEmpty(Data.GetValue("VendorNumber__"))
                    || Sys.Helpers.IsEmpty(Data.GetValue("VendorName__"))
                    || Sys.Helpers.IsEmpty(Data.GetValue("VendorAddress__"))
                    || Sys.Helpers.IsEmpty(Data.GetValue("VendorEmail__"));
            }
            Vendor.IsEmpty = IsEmpty;
            function FillPostalAddress(VendorAddress) {
                Log.Time("Vendor.FillPostalAddress");
                var fromCountryCode = Lib.Purchasing.Vendor.defaultCountryCode;
                if (VendorAddress.ForceCountry === "false") {
                    fromCountryCode = VendorAddress.ToCountry;
                }
                else if (!fromCountryCode) {
                    fromCountryCode = "US";
                }
                var options = {
                    "isVariablesAddress": true,
                    "address": VendorAddress,
                    "countryCode": fromCountryCode // Get country code from contract ModProvider
                };
                var OnVendorAddressFormatResult = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.OnVendorAddressFormat", options);
                if (OnVendorAddressFormatResult === false || OnVendorAddressFormatResult === null) {
                    return Sys.GenericAPI.PromisedCheckPostalAddress(options)
                        .Then(function (address) {
                        Log.Info("CheckPostalAddress input:  " + JSON.stringify(VendorAddress));
                        Log.Info("CheckPostalAddress output: " + JSON.stringify(address));
                        if (!Sys.Helpers.IsEmpty(address.LastErrorMessage)) {
                            Data.SetValue("VendorAddress__", "");
                            Data.SetWarning("VendorAddress__", Language.Translate("_Vendor address error:") + " " + address.LastErrorMessage);
                        }
                        else {
                            Data.SetValue("VendorAddress__", address.FormattedBlockAddress.replace(/^[^\r\n]+(\r|\n)+/, ""));
                        }
                        Log.TimeEnd("Vendor.FillPostalAddress");
                    });
                }
                Data.SetValue("VendorAddress__", OnVendorAddressFormatResult);
                //Formated by user exit
                return Sys.Helpers.Promise.Resolve();
            }
            Vendor.FillPostalAddress = FillPostalAddress;
            function Fill(GetValueFct) {
                Log.Time("Vendor.Fill");
                var field;
                for (field in vendorFieldsMapping) {
                    if (Object.prototype.hasOwnProperty.call(vendorFieldsMapping, field)) {
                        Data.SetValue(vendorFieldsMapping[field], GetValueFct(field) || "");
                    }
                }
                Data.SetError("VendorName__", "");
                var shipToVars = Sys.TechnicalData.GetValue("ShipToAddress");
                var sameCountry = shipToVars && (shipToVars.ToCountry == GetValueFct("Country__"));
                var VendorAddress = {
                    "ToName": "ToRemove",
                    "ToSub": GetValueFct("Sub__"),
                    "ToMail": GetValueFct("Street__"),
                    "ToPostal": GetValueFct("PostalCode__"),
                    "ToCountry": GetValueFct("Country__"),
                    "ToCountryCode": GetValueFct("Country__"),
                    "ToState": GetValueFct("Region__"),
                    "ToCity": GetValueFct("City__"),
                    "ToPOBox": GetValueFct("PostOfficeBox__"),
                    "ForceCountry": sameCountry ? "false" : "true"
                };
                Variable.SetValueAsString("VendorAddress", JSON.stringify(VendorAddress));
                var promises = [];
                promises.push(FillPostalAddress(VendorAddress));
                if (shipToVars) {
                    Log.Info("Filling shipto from vendor");
                    shipToVars.ForceCountry = VendorAddress.ForceCountry;
                    promises.push(Lib.Purchasing.ShipTo.FillFormattedPostalAddress(shipToVars));
                }
                return Sys.Helpers.Promise.All(promises)
                    .Then(function () {
                    Log.TimeEnd("Vendor.Fill");
                });
            }
            Vendor.Fill = Fill;
            function Reset() {
                var field;
                for (field in vendorFieldsMapping) {
                    if (Object.prototype.hasOwnProperty.call(vendorFieldsMapping, field)) {
                        Data.SetValue(vendorFieldsMapping[field], null);
                        Data.SetError(vendorFieldsMapping[field], "");
                    }
                }
                Data.SetValue("VendorAddress__", null);
                Data.SetError("VendorAddress__", "");
                Variable.SetValueAsString("VendorAddress", "");
            }
            Vendor.Reset = Reset;
            function QueryVendor(companyCode, vendorNumber) {
                function CompletVendorEmail(vendor) {
                    return QueryVendorContactEmail(companyCode, vendorNumber)
                        .Then(function (email) {
                        vendor.Email__ = email;
                        return vendor;
                    });
                }
                if (Lib.ERP.IsSAP() && Sys.Parameters.GetInstance("P2P_" + Lib.ERP.GetERPName()).GetParameter("BrowseMasterDataFromERP")) {
                    var sapField2FFFieldMapping_1 = {
                        BUKRS: "CompanyCode__",
                        NAME1: "Name__",
                        LIFNR: "Number__",
                        STRAS: "Street__",
                        PFACH: "PostOfficeBox__",
                        ORT01: "City__",
                        PSTLZ: "PostalCode__",
                        REGIO: "Region__",
                        LAND1: "Country__",
                        TELFX: "FaxNumber__",
                        STCEG: "VATNumber__",
                        ZTERM: "PaymentTermCode__"
                    };
                    var config_1 = Variable.GetValueAsString("SAPConfiguration");
                    var filter_1 = "BUKRS = '" + companyCode + "' AND LIFNR = '" + Sys.Helpers.String.SAP.NormalizeID(vendorNumber, 10) + "'";
                    var attributes_1 = [];
                    var sapField2TypeMapping = {};
                    for (var sapField in sapField2FFFieldMapping_1) {
                        if (Object.prototype.hasOwnProperty.call(sapField2FFFieldMapping_1, sapField)) {
                            attributes_1.push(sapField);
                            sapField2TypeMapping[sapField] = "string";
                        }
                    }
                    var options_1 = {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: sapField2TypeMapping,
                        handler: Lib.AP.SAP.UsesWebServices() ? Lib.AP.SAP.SAPQueryClientServerHandler() : null,
                    };
                    return Sys.GenericAPI.PromisedSAPQuery({
                        sapConf: config_1,
                        table: "ZESK_VENDORS",
                        filter: filter_1,
                        attributes: attributes_1,
                        additionalOptions: options_1,
                        maxRecords: 1
                    })
                        .Then(function (result) {
                        if (!result || result.length === 0) {
                            return null;
                        }
                        var record = result[0];
                        var resultInstance = {};
                        Sys.Helpers.Array.ForEach(attributes_1, function (sapField) {
                            var ffField = sapField2FFFieldMapping_1[sapField];
                            if (ffField) {
                                resultInstance[ffField] = record.GetValue(sapField);
                            }
                        });
                        resultInstance.Number__ = vendorNumber; // Query.SAPQuery returns the left 0 padded value. ex. 0000000300
                        if (resultInstance.PaymentTermCode__) {
                            // !! Description is language dependent
                            filter_1 = "ZTERM = '" + resultInstance.PaymentTermCode__ + "' AND SPRAS = '%SAPCONNECTIONLANGUAGE%'";
                            options_1.fieldToTypeMap = [{ TEXT1: "string" }];
                            options_1.handler = Lib.AP.SAP.UsesWebServices() ? Lib.AP.SAP.SAPQueryClientServerHandler() : null;
                            return Sys.GenericAPI.PromisedSAPQuery({
                                sapConf: config_1,
                                table: "T052U",
                                filter: filter_1,
                                attributes: ["TEXT1"],
                                additionalOptions: options_1,
                                maxRecords: 1
                            }).Then(function (result2) {
                                resultInstance["PaymentTermCode__.Description__"] = result2 && result2.length > 0 ? result2[0].GetValue("TEXT1") : "";
                                return CompletVendorEmail(resultInstance);
                            });
                        }
                        return CompletVendorEmail(resultInstance);
                    });
                }
                else {
                    var filter = "&(" + "Number__=" + vendorNumber + ")(|(CompanyCode__=" + companyCode + ")(CompanyCode__=)(CompanyCode__!=*))";
                    var fields = ["CompanyCode__", "Number__", "Name__", "Sub__", "Street__", "PostOfficeBox__", "City__", "PostalCode__", "Region__", "Country__", "Email__", "VATNumber__", "FaxNumber__", "PaymentTermCode__", "PaymentTermCode__.Description__"];
                    return Sys.GenericAPI.PromisedQuery({
                        table: "AP - Vendors__",
                        filter: filter,
                        attributes: fields,
                        additionalOptions: "EnableJoin=1",
                        maxRecords: 1
                    }).Then(function (result) {
                        if (!result || !result.length) {
                            return null;
                        }
                        return CompletVendorEmail(result[0]);
                    });
                }
            }
            Vendor.QueryVendor = QueryVendor;
            // Loads vendor informations from VendorNumber__
            function Init() {
                Log.Time("Vendor.Init");
                if (!Sys.Helpers.IsEmpty(Data.GetValue("VendorNumber__")) && Sys.Helpers.IsEmpty(Data.GetValue("VendorAddress__"))) {
                    return QueryVendor(Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"))
                        .Then(function (result) {
                        if (result) {
                            return Fill(function (fieldsName) { return result[fieldsName]; });
                        }
                        return Data.SetError("VendorName__", Language.Translate("Unknown vendor"));
                    })
                        .Catch(function (error) {
                        Log.Error("QueryVendor error: " + error);
                        if (Sys.ScriptInfo.IsClient()) {
                            Sys.Helpers.Globals.Popup.Alert(["_Error querying vendor message", error], false, null, "_Error querying vendor");
                        }
                        else {
                            Lib.CommonDialog.NextAlert.Define("_Error querying vendor", "_Error querying vendor message", { isError: false }, error);
                        }
                    })
                        .Finally(function () { return Log.TimeEnd("Vendor.Init"); });
                }
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () { return Log.TimeEnd("Vendor.Init"); });
            }
            Vendor.Init = Init;
            function EnableSingleVendorMode() {
                var vendorName;
                var vendorNumber = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Common.GetSingleVendorNumber");
                if (!vendorNumber) {
                    return Sys.Helpers.Promise.Reject("[EnableSingleVendorMode] Vendor number is mandatory to call this function");
                }
                return Lib.Purchasing.Vendor.QueryVendor(Data.GetValue("CompanyCode__"), vendorNumber)
                    .Then(function (result) {
                    if (!result) {
                        throw "[EnableSingleVendorMode] Unknown vendor with number : " + vendorNumber;
                    }
                    vendorName = result.Name__;
                    var addressMapping = {
                        "ToName": "ToRemove",
                        "ToSub": result.Sub__,
                        "ToMail": result.Street__,
                        "ToPostal": result.PostalCode__,
                        "ToCountry": result.Country__,
                        "ToCountryCode": result.Country__,
                        "ToState": result.Region__,
                        "ToCity": result.City__,
                        "ToPOBox": result.PostOfficeBox__,
                        "ForceCountry": "false" // TODO
                    };
                    return FillPostalAddress(addressMapping)
                        .Then(function () {
                        var vendorAddressWarning = Data.GetWarning("VendorAddress__");
                        if (vendorAddressWarning) {
                            throw "[EnableSingleVendorMode] FillPostalAddress has failed with vendorNumber (".concat(vendorNumber, "): ").concat(vendorAddressWarning);
                        }
                    });
                })
                    .Then(function () {
                    Data.SetValue("VendorNumber__", vendorNumber);
                    Data.SetValue("VendorName__", vendorName);
                    // Data.SetValue --> VendorAddress done in FillPostalAddress
                })
                    .Catch(function (reason) {
                    Log.Error(reason);
                    throw new Error("[EnableSingleVendorMode] QueryVendor error: " + reason);
                });
            }
            Vendor.EnableSingleVendorMode = EnableSingleVendorMode;
            function IsSingleVendorMode() {
                return !!Data.GetValue("VendorNumber__");
            }
            Vendor.IsSingleVendorMode = IsSingleVendorMode;
            function GetSingleVendorNumber() {
                return Data.GetValue("VendorNumber__");
            }
            Vendor.GetSingleVendorNumber = GetSingleVendorNumber;
            function GetSingleVendorName() {
                return Data.GetValue("VendorName__");
            }
            Vendor.GetSingleVendorName = GetSingleVendorName;
            function GetSingleVendorAddress() {
                return Data.GetValue("VendorAddress__");
            }
            Vendor.GetSingleVendorAddress = GetSingleVendorAddress;
            /**
             * CLIENT SIDE API
             */
            function OpenNewVendorRequestForm() {
                function fillNewVendorRequestDialog(dialog /*, tabId, event, control*/) {
                    var vendorNameCtrl = dialog.AddText("name", "_Vendor name", 230);
                    dialog.RequireControl(vendorNameCtrl);
                    var vendorAddressCtrl = dialog.AddMultilineText("address", "_Vendor address", 230);
                    dialog.RequireControl(vendorAddressCtrl);
                    vendorAddressCtrl.SetLineCount(4);
                    var vendorEmailCtrl = dialog.AddText("email", "_Vendor email", 230);
                    dialog.RequireControl(vendorEmailCtrl);
                    // fill with the values already set
                    if (Variable.GetValueAsString("NewVendor__") === "true") {
                        vendorNameCtrl.SetValue(Data.GetValue("VendorName__"));
                        vendorAddressCtrl.SetValue(Data.GetValue("VendorAddress__"));
                        vendorEmailCtrl.SetValue(Data.GetValue("VendorEmail__"));
                    }
                }
                function CommitNewVendorRequestDialog(dialog /*, tabId, event, control*/) {
                    Lib.Purchasing.Vendor.Reset(); // clear previous vendor info
                    Variable.SetValueAsString("NewVendor__", "true");
                    Data.SetValue("VendorName__", dialog.GetControl("name").GetValue());
                    Data.SetValue("VendorAddress__", dialog.GetControl("address").GetValue());
                    Data.SetValue("VendorEmail__", dialog.GetControl("email").GetValue());
                    Variable.SetValueAsString("ContactLogin", "");
                    Variable.SetValueAsString("VendorAddress", "");
                    Data.SetValue("VendorNumber__", "");
                    Data.SetError("VendorName__", "");
                    Log.Info("New vendor requested");
                }
                if (Sys.ScriptInfo.IsClient()) {
                    Sys.Helpers.Globals.Popup.Dialog("_New vendor request", null, fillNewVendorRequestDialog, CommitNewVendorRequestDialog);
                }
                else {
                    Log.Error("Not Implemented on server side");
                }
            }
            Vendor.OpenNewVendorRequestForm = OpenNewVendorRequestForm;
            /**
             * SERVER SIDE API
             */
            /**
             * This function build a login from candidateShortLogin, after removing all caracters != [a-z0-9_]
             * The accountId is not included
             * The login can only contain letters, numbers, dots (.), dashes (-), underscores (_) and arrobases (@).
             * Ex. BuildShortLogin(vendorName || vendorNumber)
             **/
            function BuildShortLogin(candidateShortLogin) {
                return candidateShortLogin;
            }
            function QueryVendorContact(email, emailIsLogin) {
                var login = g.Variable.GetValueAsString("ContactLogin");
                if (!login) {
                    // Search in ODUSER the vendor contact by email address
                    // We are in server script, so the query is synchronous.
                    var sAccountId = Lib.P2P.GetValidatorOrOwner().GetVars().GetValue_String("AccountId", 0);
                    var filter = emailIsLogin ?
                        "(Login=" + sAccountId + "$" + email.toLowerCase() + ")" :
                        "&(VENDOR=1)(EmailAddress=" + email + ")(Login=" + sAccountId + "$*)";
                    Log.Info("QueryVendorContact filter=" + filter);
                    Sys.GenericAPI.PromisedQuery({
                        table: "ODUSER",
                        filter: filter,
                        attributes: ["Login"],
                        additionalOptions: { queryOptions: "FastSearch=1" },
                        maxRecords: 1
                    })
                        .Then(function (result) {
                        if (result && result.length > 0) {
                            login = result[0].Login;
                            Log.Info("QueryVendorContact vendor found, login=" + login);
                        }
                    });
                    if (!login && !emailIsLogin) {
                        login = sAccountId + "$" + email.toLowerCase();
                    }
                }
                return g.Users.GetUserAsProcessAdmin(login);
            }
            Vendor.QueryVendorContact = QueryVendorContact;
            function GetVendorAttributes(poData, companyCode, vendorNumber, vendorEmail) {
                var attributes = {};
                var user = Lib.P2P.GetValidatorOrOwner();
                attributes.TimeZoneIdentifier = user.GetValue("TimeZoneIdentifier");
                attributes.TimeZoneIndex = user.GetValue("TimeZoneIndex");
                attributes.Language = user.GetValue("Language");
                attributes.Culture = user.GetValue("Culture");
                attributes.Company = poData.GetValue("VendorName__");
                attributes.EmailAddress = vendorEmail;
                if (vendorNumber) {
                    attributes.Description = vendorNumber;
                    // Try to fill other attributes from "AP - Vendors" table
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.SetSpecificTable("AP - Vendors__");
                    var queryFilter = "&(Number__=" + vendorNumber + ")(|(CompanyCode__=" + companyCode + ")(CompanyCode__=)(CompanyCode__!=*))";
                    query.SetFilter(queryFilter);
                    if (query.MoveFirst()) {
                        var record = query.MoveNextRecord();
                        if (record) {
                            var vars = record.GetVars();
                            attributes.Company = vars.GetValue_String("Name__", 0);
                            attributes.Sub = vars.GetValue_String("Sub__", 0);
                            attributes.Street = vars.GetValue_String("Street__", 0);
                            attributes.POBox = vars.GetValue_String("PostOfficeBox__", 0);
                            attributes.City = vars.GetValue_String("City__", 0);
                            attributes.ZipCode = vars.GetValue_String("PostalCode__", 0);
                            attributes.MailState = vars.GetValue_String("Region__", 0);
                            attributes.FaxNumber = vars.GetValue_String("FaxNumber__", 0);
                            attributes.Country = vars.GetValue_String("Country__", 0);
                            attributes.PhoneNumber = vars.GetValue_String("PhoneNumber__", 0);
                            attributes.EmailAddress = attributes.EmailAddress || vars.GetValue_String("Email__", 0);
                        }
                    }
                    return attributes;
                }
                else if (g.Variable.GetValueAsString("NewVendor__") == "true") {
                    return attributes;
                }
                return {};
            }
            function QueryVendorLink(companyCode, vendorNumber) {
                var filter = "&(Number__=" + vendorNumber + ")(|(CompanyCode__=" + companyCode + ")(CompanyCode__=)(CompanyCode__!=*))";
                var query = Process.CreateQuery();
                query.SetSpecificTable("AP - Vendors links__");
                query.SetFilter(filter);
                query.MoveFirst();
                return query.MoveNextRecord();
            }
            function CreateVendorContact(attributes) {
                var vendorContact = null;
                if (attributes.EmailAddress) // attributes.EmailAddress will be used as login
                 {
                    var accountId = Lib.P2P.GetValidatorOrOwner().GetValue("AccountId");
                    vendorContact = g.Users.GetUserAsProcessAdmin(accountId + "$_vendor_template_");
                    if (vendorContact) {
                        try {
                            var shortLogin = BuildShortLogin(attributes.EmailAddress);
                            vendorContact = vendorContact.Clone(shortLogin, attributes);
                        }
                        catch (ex) {
                            // when another process creating the same vendor by User.Clone at the same time,
                            // we may have constraint violation when creating it the second time.
                            // --> reset vendorContact = null to consider the vendor contact aleady exists
                            Log.Warn("Vendor contact clone failed: " + ex);
                            vendorContact = null;
                        }
                        if (!vendorContact) // the vendor contact aleady exists or could not be created
                         {
                            vendorContact = g.Users.GetUserAsProcessAdmin(accountId + "$" + attributes.EmailAddress);
                            // update vendor contact email address only when non email defined
                            if (vendorContact && !vendorContact.GetValue("EmailAddress")) {
                                vendorContact.SetValue("EmailAddress", attributes.EmailAddress);
                            }
                        }
                    }
                }
                return vendorContact;
            }
            function UpdateVendorContact(vendorContact, vendorNumber) {
                vendorContact.SetValue("Description", vendorNumber);
            }
            function CreateVendorLink(vendorContact, companyCode) {
                var shortLogin = vendorContact.GetValue("Login");
                if (shortLogin && shortLogin.indexOf("$") !== -1) {
                    shortLogin = shortLogin.substr(1 + shortLogin.indexOf("$"));
                }
                var vendorNumber = vendorContact.GetValue("Description");
                var record = QueryVendorLink(companyCode, vendorNumber);
                if (record) {
                    record.GetVars().AddValue_String("ShortLoginPAC__", shortLogin, true);
                    record.Commit();
                }
                else {
                    record = Process.CreateTableRecord("AP - Vendors links__");
                    if (record) {
                        var vars = record.GetVars();
                        vars.AddValue_String("Number__", vendorNumber, true);
                        vars.AddValue_String("CompanyCode__", companyCode, true);
                        vars.AddValue_String("ShortLoginPAC__", shortLogin, true);
                        record.Commit();
                    }
                }
                return record;
            }
            function GetVendorCultureAndLanguage(vendorInfos) {
                if (vendorInfos === void 0) { vendorInfos = {}; }
                if (vendorInfos.culture && vendorInfos.language) {
                    return Sys.Helpers.Promise.Resolve({
                        culture: vendorInfos.culture,
                        language: vendorInfos.language
                    });
                }
                if (Sys.ScriptInfo.IsServer()) {
                    var vendor = Lib.Purchasing.Vendor.GetVendorContact();
                    if (vendor) {
                        Log.Info("Using language and culture of vendor contact");
                        return Sys.Helpers.Promise.Resolve({
                            culture: vendorInfos.culture || vendor.GetVars().GetValue_String("Culture", 0),
                            language: vendorInfos.language || vendor.GetVars().GetValue_String("Language", 0)
                        });
                    }
                    return Sys.Helpers.Promise.Resolve({
                        culture: vendorInfos.culture,
                        language: vendorInfos.language
                    });
                }
                return Lib.Purchasing.Vendor.GetVendorInfo()
                    .Then(function (vendor) { return ({
                    culture: vendorInfos.culture || vendor.culture,
                    language: vendorInfos.language || vendor.language
                }); });
            }
            Vendor.GetVendorCultureAndLanguage = GetVendorCultureAndLanguage;
            /**
             * ServerSide Only
             */
            function GetVendorContact(poData, vendorEmail) {
                if (Sys.ScriptInfo.IsClient()) {
                    Log.Error("Not Implemented on client side");
                    return null;
                }
                poData = poData || g.Data;
                var emailIsLogin = !!vendorEmail;
                vendorEmail = vendorEmail || poData.GetValue("VendorEmail__");
                var autoCreateVendor = Sys.Parameters.GetInstance("PAC").GetParameter("AlwaysCreateVendor") === "1" && Sys.Parameters.GetInstance("PAC").GetParameter("EnablePortalAccountCreation") === "1";
                var vendorContact = null;
                var vendorNumber = poData.GetValue("VendorNumber__") || g.Variable.GetValueAsString("VendorNumber__");
                var companyCode = poData.GetValue("CompanyCode__");
                if (vendorEmail) {
                    vendorContact = QueryVendorContact(vendorEmail, emailIsLogin);
                    if (!vendorContact && autoCreateVendor) {
                        var attributes = GetVendorAttributes(poData, companyCode, vendorNumber, vendorEmail);
                        vendorContact = CreateVendorContact(attributes);
                    }
                    else if (vendorContact && Sys.Helpers.IsEmpty(vendorContact.GetValue("Description"))) {
                        UpdateVendorContact(vendorContact, vendorNumber);
                    }
                    if (vendorContact && vendorNumber) {
                        var record = QueryVendorLink(companyCode, vendorNumber);
                        if (!record || Sys.Helpers.IsEmpty(record.GetVars().GetValue_String("ShortLoginPAC__", 0))) {
                            CreateVendorLink(vendorContact, companyCode);
                        }
                    }
                }
                return vendorContact;
            }
            Vendor.GetVendorContact = GetVendorContact;
            function QueryPOTransmissionPreferences(companyCode, vendorNumber) {
                var options = {
                    table: "Vendor_company_extended_properties__",
                    filter: "(&(VendorNumber__=" + vendorNumber + ")(|(CompanyCode__=" + companyCode + ")(CompanyCode__=)(CompanyCode__!=*)))",
                    attributes: ["*"],
                    maxRecords: 1,
                    callback: function (res) { return res.length ? res[0] : null; }
                };
                return Sys.GenericAPI.PromisedQuery(options);
            }
            Vendor.QueryPOTransmissionPreferences = QueryPOTransmissionPreferences;
        })(Vendor = Purchasing.Vendor || (Purchasing.Vendor = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
