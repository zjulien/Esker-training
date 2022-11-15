/* LIB_DEFINITION{
  "name": "Lib_VendorRegistration_CheckDuplicateVendor_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "VendorRegistration library",
  "require": [
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_Iban",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "Lib_VendorRegistration_Common_V12.0.461.0"
  ]
}*/
///#GLOBALS Lib Sys
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var CheckDuplicateVendor;
        (function (CheckDuplicateVendor) {
            CheckDuplicateVendor.KEY_PENDING_REGISTRATION_TO_CHECK = "PendingRegistrationToCheck";
            CheckDuplicateVendor.KEY_PENDING_REGISTRATION_DUPLICATES = "PendingRegistrationDuplicates";
            CheckDuplicateVendor.KEY_VENDORS_DUPLICATES = "VendorsDuplicates";
            // ===
            // Define data structure for check duplicates (useful for serialization & comparison)
            var ICompanyOfficersColumns = /** @class */ (function () {
                function ICompanyOfficersColumns() {
                }
                return ICompanyOfficersColumns;
            }());
            var PendingRegistrationToCompare = /** @class */ (function () {
                function PendingRegistrationToCompare() {
                    this.Company__ = "";
                    this.TaxID__ = "";
                    this.VendorRegistrationDUNSNumber__ = "";
                    this.CompanyOfficersTable__ = {
                        Email__: []
                    };
                    this.CompanyBankAccountsTable__ = {
                        BankIBAN__: []
                    };
                }
                return PendingRegistrationToCompare;
            }());
            CheckDuplicateVendor.PendingRegistrationToCompare = PendingRegistrationToCompare;
            var PendingRegistrationToValidate = /** @class */ (function (_super) {
                __extends(PendingRegistrationToValidate, _super);
                function PendingRegistrationToValidate() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                PendingRegistrationToValidate.create = function () {
                    var newRegistrationToValidate = new PendingRegistrationToValidate();
                    for (var prop in newRegistrationToValidate) {
                        if (Object.prototype.hasOwnProperty.call(newRegistrationToValidate, prop)) {
                            PendingRegistrationToValidate.loadField(newRegistrationToValidate, prop);
                        }
                    }
                    return newRegistrationToValidate;
                };
                PendingRegistrationToValidate.loadField = function (newRegistrationToValidate, fieldName) {
                    if (typeof newRegistrationToValidate[fieldName] === "string") {
                        var val = Data.GetValue(fieldName);
                        if (val) {
                            newRegistrationToValidate[fieldName] = val;
                        }
                    }
                    else if (typeof newRegistrationToValidate[fieldName] === "object") {
                        var table = Data.GetTable(fieldName);
                        for (var i = 0; i < table.GetItemCount(); i++) {
                            PendingRegistrationToValidate.loadItem(table.GetItem(i), newRegistrationToValidate, fieldName);
                        }
                    }
                };
                PendingRegistrationToValidate.loadItem = function (item, newRegistrationToValidate, tableName) {
                    if (item) {
                        for (var tableField in newRegistrationToValidate[tableName]) {
                            if (Object.prototype.hasOwnProperty.call(newRegistrationToValidate, tableName)) {
                                var columnValue = item.GetValue(tableField);
                                if (columnValue) {
                                    newRegistrationToValidate[tableName][tableField].push(columnValue);
                                }
                            }
                        }
                    }
                };
                PendingRegistrationToValidate.prototype.getDuplicatesBetween = function (toCompare) {
                    var duplicates = {
                        propertiesNames: new Array(),
                        tables: new Array()
                    };
                    var taxIdComparer = function (referentTaxId, taxIdToCompare) {
                        // TC TODO : replace with the appropriate Sys_Lib call
                        return referentTaxId && taxIdToCompare && referentTaxId === taxIdToCompare;
                    };
                    var dunsNumberComparer = function (referentDUNSNumber, DUNSNumberToCompare) {
                        return referentDUNSNumber && DUNSNumberToCompare && referentDUNSNumber === DUNSNumberToCompare;
                    };
                    var ibanComparer = function (referentIban, ibanToCompare) {
                        var normalizedReferentIban = Sys.Helpers.Iban.Normalize(referentIban, null);
                        var normalizedIbanToCompare = Sys.Helpers.Iban.Normalize(ibanToCompare, null);
                        if (!normalizedReferentIban || !normalizedIbanToCompare) {
                            return false;
                        }
                        return normalizedReferentIban === normalizedIbanToCompare;
                    };
                    if (this.Company__.toLowerCase() === toCompare.Company__.toLowerCase()) {
                        duplicates.propertiesNames.push("Company__");
                    }
                    if (taxIdComparer(this.TaxID__, toCompare.TaxID__)) {
                        duplicates.propertiesNames.push("TaxID__");
                    }
                    if (dunsNumberComparer(this.VendorRegistrationDUNSNumber__, toCompare.VendorRegistrationDUNSNumber__)) {
                        duplicates.propertiesNames.push("VendorRegistrationDUNSNumber__");
                    }
                    if (this.CompanyOfficersTable__ && toCompare.CompanyOfficersTable__) {
                        var officersDuplicates = {
                            name: "CompanyOfficersTable__",
                            duplicates: new Array()
                        };
                        var emailDuplicates = this.CompanyOfficersTable__.Email__.filter(function (referentEmail) { return toCompare.CompanyOfficersTable__.Email__.some(function (emailToCompare) { return referentEmail.toLowerCase() === emailToCompare.toLowerCase(); }); });
                        if (emailDuplicates.length > 0) {
                            officersDuplicates.duplicates = emailDuplicates.map(function (emailDuplicate) { return ({ column: "Email__", value: emailDuplicate }); });
                        }
                        if (officersDuplicates.duplicates.length > 0) {
                            duplicates.tables.push(officersDuplicates);
                        }
                    }
                    if (this.CompanyBankAccountsTable__ && toCompare.CompanyBankAccountsTable__) {
                        var bankAccountsDuplicates = {
                            name: "CompanyBankAccountsTable__",
                            duplicates: new Array()
                        };
                        var ibanDuplicates = this.CompanyBankAccountsTable__.BankIBAN__.filter(function (referentIban) { return toCompare.CompanyBankAccountsTable__.BankIBAN__.some(function (ibanToCompare) { return ibanComparer(referentIban, ibanToCompare); }); });
                        if (ibanDuplicates.length > 0) {
                            bankAccountsDuplicates.duplicates = ibanDuplicates.map(function (ibanDuplicate) { return ({ column: "BankIBAN__", value: ibanDuplicate }); });
                        }
                        if (bankAccountsDuplicates.duplicates.length > 0) {
                            duplicates.tables.push(bankAccountsDuplicates);
                        }
                    }
                    return duplicates.propertiesNames.length > 0 || duplicates.tables.length > 0 ? duplicates : null;
                };
                return PendingRegistrationToValidate;
            }(PendingRegistrationToCompare));
            CheckDuplicateVendor.PendingRegistrationToValidate = PendingRegistrationToValidate;
            function SetPendingRegistrationToCheck() {
                var vendorDataToCheck = Lib.VendorRegistration.CheckDuplicateVendor.PendingRegistrationToValidate.create();
                Variable.SetValueAsString(Lib.VendorRegistration.CheckDuplicateVendor.KEY_PENDING_REGISTRATION_TO_CHECK, JSON.stringify(vendorDataToCheck));
            }
            CheckDuplicateVendor.SetPendingRegistrationToCheck = SetPendingRegistrationToCheck;
            /**
             * @returns {Promise<IPendingRegistrationDuplicates>}
             */
            function GetFirstPendingRegistrationWithDuplicates(pendingRegistrationMsnEx) {
                var checkQueryResultDuplicationFn = function (results) {
                    for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                        var value = results_1[_i];
                        var pendingRegistrationToCompareJson = value.externalVariables[CheckDuplicateVendor.KEY_PENDING_REGISTRATION_TO_CHECK];
                        if (pendingRegistrationToCompareJson) {
                            var pendingRegistrationToCompare = void 0;
                            try {
                                pendingRegistrationToCompare = JSON.parse(pendingRegistrationToCompareJson);
                            }
                            catch (e) {
                                Log.Info("Unable to parse the data from the key '".concat(CheckDuplicateVendor.KEY_PENDING_REGISTRATION_TO_CHECK, "' in ExternalVars"));
                            }
                            if (pendingRegistrationToCompare) {
                                var pendingRegistrationToValidate = PendingRegistrationToValidate.create();
                                var pendingRegistrationDuplicates = pendingRegistrationToValidate.getDuplicatesBetween(pendingRegistrationToCompare);
                                if (pendingRegistrationDuplicates) {
                                    return pendingRegistrationDuplicates;
                                }
                            }
                        }
                    }
                    return null;
                };
                var options = {
                    table: "CDNAME#Vendor Registration",
                    filter: "(&(State<100)(Deleted=0)(!(MsnEx=".concat(pendingRegistrationMsnEx, ")))"),
                    attributes: [],
                    sortOrder: "SubmitDateTime__ ASC",
                    maxRecords: "no_limit",
                    additionalOptions: {
                        externalVars: [CheckDuplicateVendor.KEY_PENDING_REGISTRATION_TO_CHECK]
                    }
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (results) {
                    return checkQueryResultDuplicationFn(results);
                });
            }
            CheckDuplicateVendor.GetFirstPendingRegistrationWithDuplicates = GetFirstPendingRegistrationWithDuplicates;
            function SetPendingRegistrationDuplicates(registrationDuplicates) {
                if (registrationDuplicates) {
                    try {
                        var duplicatesJSON = JSON.stringify(registrationDuplicates);
                        Variable.SetValueAsString(CheckDuplicateVendor.KEY_PENDING_REGISTRATION_DUPLICATES, duplicatesJSON);
                    }
                    catch (e) {
                        Log.Info("Unable to parse the duplicates of pending registrations against the current pending registration");
                    }
                }
                else {
                    Variable.SetValueAsString(CheckDuplicateVendor.KEY_PENDING_REGISTRATION_DUPLICATES, "");
                }
            }
            CheckDuplicateVendor.SetPendingRegistrationDuplicates = SetPendingRegistrationDuplicates;
            /**
             * @returns {Promise<Array<IVendorsWithDuplicatesQuery>>}
             */
            function GetVendorsWithDuplicates(companyName, vatNumber, dunsNumber) {
                if (!companyName && !vatNumber && !dunsNumber) {
                    return Sys.Helpers.Promise.Resolve(null);
                }
                var fieldsFilters = new Array();
                if (companyName) {
                    fieldsFilters.push(Sys.Helpers.LdapUtil.FilterEqual("Name__", companyName).toString());
                }
                if (vatNumber) {
                    fieldsFilters.push(Sys.Helpers.LdapUtil.FilterEqual("VATNumber__", vatNumber).toString());
                }
                if (dunsNumber) {
                    fieldsFilters.push(Sys.Helpers.LdapUtil.FilterEqual("DUNSNumber__", dunsNumber).toString());
                }
                var options = {
                    table: "AP - Vendors__",
                    filter: Sys.Helpers.LdapUtil.FilterOr.apply(null, fieldsFilters).toString(),
                    attributes: ["CompanyCode__", "Number__", "Name__", "VATNumber__", "DUNSNumber__"],
                    sortOrder: null,
                    maxRecords: "no_limit"
                };
                return Sys.GenericAPI.PromisedQuery(options);
            }
            /**
             * @returns {Promise<Array<IVendorOfficersWithDuplicatesQuery>>}
             */
            function GetVendorOfficersWithDuplicates(emails) {
                if (!emails || emails.length === 0) {
                    return Sys.Helpers.Promise.Resolve(null);
                }
                var fieldsFilters = new Array();
                for (var _i = 0, emails_1 = emails; _i < emails_1.length; _i++) {
                    var email = emails_1[_i];
                    fieldsFilters.push(Sys.Helpers.LdapUtil.FilterEqual("Email__", email).toString());
                }
                var options = {
                    table: "AP - Vendors officers__",
                    filter: Sys.Helpers.LdapUtil.FilterOr.apply(null, fieldsFilters).toString(),
                    attributes: ["CompanyCode__", "VendorNumber__", "Email__"],
                    sortOrder: null,
                    maxRecords: "no_limit"
                };
                return Sys.GenericAPI.PromisedQuery(options);
            }
            /**
             * @returns {Promise<Array<IbankDetailsWithDuplicatesQuery>>}
             */
            function GetBankDetailsWithDuplicates(ibans) {
                if (!ibans || ibans.length === 0) {
                    return Sys.Helpers.Promise.Resolve(null);
                }
                var fieldsFilters = [];
                for (var _i = 0, ibans_1 = ibans; _i < ibans_1.length; _i++) {
                    var iban = ibans_1[_i];
                    fieldsFilters.push(Sys.Helpers.LdapUtil.FilterEqual("IBAN__", iban).toString());
                }
                var options = {
                    table: "AP - Bank details__",
                    filter: Sys.Helpers.LdapUtil.FilterOr.apply(null, fieldsFilters).toString(),
                    attributes: ["CompanyCode__", "VendorNumber__", "IBAN__"],
                    sortOrder: null,
                    maxRecords: "no_limit"
                };
                return Sys.GenericAPI.PromisedQuery(options);
            }
            /**
             * @returns {Promise<IVendorDuplicates>}
             */
            function GetAllVendorsWithDuplicates() {
                var pendingRegistrationToValidate = PendingRegistrationToValidate.create();
                var vendorDuplicates = {
                    vendorsInformations: new Array(),
                    propertiesNames: new Array(),
                    tables: new Array()
                };
                // Helper to know if the companyCode is mathing depending on the Wizard global option 'VendorManagementCompanyCodeGlobalSetting'
                var isCompanyCodeMatching = function isCompanyCodeMatching(info, companyCode) {
                    var emptyCompanyCodeMatch = (!Lib.VendorRegistration.Common.Parameters.IsVendorManagementCompanyCodeMandatory() &&
                        (!info.companyCode || !companyCode));
                    var companyCodeMatch = info.companyCode === companyCode;
                    return emptyCompanyCodeMatch || companyCodeMatch;
                };
                return GetVendorsWithDuplicates(pendingRegistrationToValidate.Company__, pendingRegistrationToValidate.TaxID__, pendingRegistrationToValidate.VendorRegistrationDUNSNumber__).then(function (duplicateVendorsCT) {
                    if (duplicateVendorsCT && duplicateVendorsCT.length > 0) {
                        var _loop_1 = function (duplicateVendorCT) {
                            if (vendorDuplicates.vendorsInformations.length === 0 ||
                                !vendorDuplicates.vendorsInformations.some(function (info) { return (isCompanyCodeMatching(info, duplicateVendorCT ? duplicateVendorCT.CompanyCode__ : "") &&
                                    info.vendorNumber === duplicateVendorCT.Number__); })) {
                                var vendorInformations = { companyCode: duplicateVendorCT.CompanyCode__, vendorNumber: duplicateVendorCT.Number__ };
                                vendorDuplicates.vendorsInformations.push(vendorInformations);
                            }
                        };
                        for (var _i = 0, duplicateVendorsCT_1 = duplicateVendorsCT; _i < duplicateVendorsCT_1.length; _i++) {
                            var duplicateVendorCT = duplicateVendorsCT_1[_i];
                            _loop_1(duplicateVendorCT);
                        }
                        if (duplicateVendorsCT.some(function (duplicateVendor) { return pendingRegistrationToValidate.Company__.toLowerCase() === duplicateVendor.Name__.toLowerCase(); })) {
                            vendorDuplicates.propertiesNames.push("Company__");
                        }
                        // TC TODO : do special comparison
                        if (duplicateVendorsCT.some(function (duplicateVendor) { return pendingRegistrationToValidate.TaxID__ === duplicateVendor.VATNumber__ && pendingRegistrationToValidate.TaxID__ !== ""; })) {
                            vendorDuplicates.propertiesNames.push("TaxID__");
                        }
                        if (duplicateVendorsCT.some(function (duplicateVendor) { return pendingRegistrationToValidate.VendorRegistrationDUNSNumber__ === duplicateVendor.DUNSNumber__ && pendingRegistrationToValidate.VendorRegistrationDUNSNumber__ !== ""; })) {
                            vendorDuplicates.propertiesNames.push("VendorRegistrationDUNSNumber__");
                        }
                    }
                    return GetVendorOfficersWithDuplicates(pendingRegistrationToValidate.CompanyOfficersTable__.Email__);
                }).then(function (duplicateVendorOfficersCT) {
                    if (duplicateVendorOfficersCT && duplicateVendorOfficersCT.length > 0) {
                        var duplicateOfficersTable = {
                            name: "CompanyOfficersTable__",
                            duplicates: new Array()
                        };
                        var _loop_2 = function (duplicateVendorOfficerCT) {
                            if (!vendorDuplicates.vendorsInformations.some(function (info) { return isCompanyCodeMatching(info, duplicateVendorOfficerCT ? duplicateVendorOfficerCT.CompanyCode__ : "") &&
                                info.vendorNumber === duplicateVendorOfficerCT.VendorNumber__; })) {
                                vendorDuplicates.vendorsInformations.push({
                                    companyCode: duplicateVendorOfficerCT.CompanyCode__,
                                    vendorNumber: duplicateVendorOfficerCT.VendorNumber__
                                });
                            }
                            duplicateOfficersTable.duplicates.push({
                                column: "Email__",
                                value: duplicateVendorOfficerCT.Email__
                            });
                        };
                        for (var _i = 0, duplicateVendorOfficersCT_1 = duplicateVendorOfficersCT; _i < duplicateVendorOfficersCT_1.length; _i++) {
                            var duplicateVendorOfficerCT = duplicateVendorOfficersCT_1[_i];
                            _loop_2(duplicateVendorOfficerCT);
                        }
                        vendorDuplicates.tables.push(duplicateOfficersTable);
                    }
                    return GetBankDetailsWithDuplicates(pendingRegistrationToValidate.CompanyBankAccountsTable__.BankIBAN__);
                }).then(function (duplicateBankDetailsCT) {
                    if (duplicateBankDetailsCT && duplicateBankDetailsCT.length > 0) {
                        var duplicateBankTable = {
                            name: "CompanyBankAccountsTable__",
                            duplicates: Array()
                        };
                        var _loop_3 = function (duplicateBankDetailCT) {
                            if (!vendorDuplicates.vendorsInformations.some(function (info) { return info.companyCode === duplicateBankDetailCT.CompanyCode__ &&
                                info.vendorNumber === duplicateBankDetailCT.VendorNumber__; })) {
                                vendorDuplicates.vendorsInformations.push({
                                    companyCode: duplicateBankDetailCT.CompanyCode__,
                                    vendorNumber: duplicateBankDetailCT.VendorNumber__
                                });
                            }
                            duplicateBankTable.duplicates.push({
                                column: "BankIBAN__",
                                value: duplicateBankDetailCT.IBAN__
                            });
                        };
                        for (var _i = 0, duplicateBankDetailsCT_1 = duplicateBankDetailsCT; _i < duplicateBankDetailsCT_1.length; _i++) {
                            var duplicateBankDetailCT = duplicateBankDetailsCT_1[_i];
                            _loop_3(duplicateBankDetailCT);
                        }
                        vendorDuplicates.tables.push(duplicateBankTable);
                    }
                    return Sys.Helpers.Promise.Resolve(vendorDuplicates.vendorsInformations.length > 0 ? vendorDuplicates : null);
                });
            }
            CheckDuplicateVendor.GetAllVendorsWithDuplicates = GetAllVendorsWithDuplicates;
            function SetVendorsDuplicates(vendorsDuplicates) {
                if (vendorsDuplicates) {
                    var vendorsDuplicatesJSON = JSON.stringify(vendorsDuplicates);
                    try {
                        Variable.SetValueAsString(CheckDuplicateVendor.KEY_VENDORS_DUPLICATES, vendorsDuplicatesJSON);
                    }
                    catch (e) {
                        Log.Info("Unable to parse the duplicates of vendors against the current pending registration");
                    }
                }
                else {
                    Variable.SetValueAsString(CheckDuplicateVendor.KEY_VENDORS_DUPLICATES, "");
                }
            }
            CheckDuplicateVendor.SetVendorsDuplicates = SetVendorsDuplicates;
            function ShouldCheckDuplicates() {
                return Data.GetValue("RegistrationType__") !== "update";
            }
            CheckDuplicateVendor.ShouldCheckDuplicates = ShouldCheckDuplicates;
            /**
             * @returns {Promise<boolean>}
             */
            function CheckAllDuplicates(pendingRegistrationMsnEx) {
                return GetAllVendorsWithDuplicates().then(function (vendorsDuplicates) {
                    if (vendorsDuplicates) {
                        SetVendorsDuplicates(vendorsDuplicates);
                    }
                    else {
                        SetVendorsDuplicates(null);
                    }
                    return Sys.Helpers.Promise.Resolve(vendorsDuplicates != null);
                }).then(function (vendorDuplicatesHasBeenFind) {
                    if (!vendorDuplicatesHasBeenFind) {
                        return GetFirstPendingRegistrationWithDuplicates(pendingRegistrationMsnEx).then(function (pendingRegistartionDuplications) {
                            if (pendingRegistartionDuplications) {
                                SetPendingRegistrationDuplicates(pendingRegistartionDuplications);
                            }
                            return Sys.Helpers.Promise.Resolve(pendingRegistartionDuplications != null);
                        });
                    }
                    SetPendingRegistrationDuplicates(null);
                    return Sys.Helpers.Promise.Resolve(true);
                });
            }
            CheckDuplicateVendor.CheckAllDuplicates = CheckAllDuplicates;
        })(CheckDuplicateVendor = VendorRegistration.CheckDuplicateVendor || (VendorRegistration.CheckDuplicateVendor = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
