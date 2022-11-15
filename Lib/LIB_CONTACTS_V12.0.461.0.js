///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Contacts_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library",
  "require": [
    "Lib_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Contacts;
    (function (Contacts) {
        var _query = null;
        function GetQuery() {
            if (!_query) {
                _query = Process.CreateQueryAsProcessAdmin();
            }
            else {
                _query.Reset();
            }
            return _query;
        }
        function Resetfunction() {
            if (_query) {
                _query = null;
            }
        }
        Contacts.Resetfunction = Resetfunction;
        ;
        function GetContactLoginList(contactEmail, companyId, contactTypeName, accountId) {
            var businessIdToContactLogin = {};
            if (contactEmail && companyId) {
                var queryFilter = void 0;
                if (contactEmail === companyId && accountId) {
                    queryFilter = "(&(Login=" + accountId + "$" + companyId + ")(" + contactTypeName + "=1))";
                }
                else {
                    queryFilter = "(&(EmailAddress=" + contactEmail + ")(" + contactTypeName + "=1))";
                }
                var query = GetQuery();
                query.SetSpecificTable("ODUSER");
                query.SetAttributesList("Login,BusinessPartnerID");
                query.SetFilter(queryFilter);
                query.SetOptionEx("FastSearch=1");
                query.SetSortOrder("Login ASC");
                if (query.MoveFirst()) {
                    var userRecord = query.MoveNextRecord();
                    while (userRecord) {
                        var userVars = userRecord.GetVars();
                        if (userVars) {
                            var businessPartnerId = userVars.GetValue_String("BusinessPartnerID", 0);
                            businessIdToContactLogin[businessPartnerId] = userVars.GetValue_String("Login", 0);
                        }
                        userRecord = query.MoveNextRecord();
                    }
                }
            }
            return businessIdToContactLogin;
        }
        Contacts.GetContactLoginList = GetContactLoginList;
        function GetContactLoginAndUser(contactEmail, companyId, contactTypeName, accountId) {
            if (contactEmail && companyId) {
                var fullyQualifiedLogin = false;
                var contactLogin = contactEmail;
                var contactUser = null;
                var contactLoginList = GetContactLoginList(contactEmail, companyId, contactTypeName, accountId);
                var numberOfCompaniesHavingEmailAddress = Object.keys(contactLoginList).length;
                if (numberOfCompaniesHavingEmailAddress > 0) {
                    if (contactLoginList[companyId]) {
                        contactUser = Users.GetUserAsProcessAdmin(contactLoginList[companyId]);
                        contactLogin = contactLoginList[companyId];
                        fullyQualifiedLogin = true;
                        Log.Info("User found with email [" + contactEmail + "] in customer company [" + companyId + "]");
                    }
                    else {
                        var atSignPosition = contactEmail.indexOf("@");
                        // Oracle EBS companyIds may look like: "99999/ABCDEFGH, IJ 999999999", so sanitize to create a valid contactLogin
                        var sanitizedCompanyId = companyId.replace(/\//g, ".").replace(/ /g, "_").replace(/[^a-zA-Z0-9-'_.@]/g, "");
                        contactLogin = contactEmail.substr(0, atSignPosition) + "." + sanitizedCompanyId + contactEmail.substring(atSignPosition);
                        Log.Info("User found with email [" + contactEmail + "] but associated to an other customer than [" + companyId + "]");
                    }
                }
                else {
                    Log.Info("No user found with email [" + contactEmail + "]");
                }
                return { login: contactLogin, user: contactUser, fullyQualifiedLogin: fullyQualifiedLogin };
            }
            return null;
        }
        Contacts.GetContactLoginAndUser = GetContactLoginAndUser;
        function GetOrCreateContactUser(accountId, emailAddress, companyId, companyName, customerTemplateName, contactTypeName, displayName) {
            if (!accountId || !emailAddress) {
                return null;
            }
            var atSignPosition = emailAddress.indexOf("@");
            if (atSignPosition === -1) {
                Log.Error("A valid email address must be provided");
                return null;
            }
            var contactLoginAndUser = GetContactLoginAndUser(emailAddress, companyId, contactTypeName, accountId);
            if (contactLoginAndUser === null || (contactLoginAndUser.login === null && contactLoginAndUser.user === null)) {
                return null;
            }
            if (contactLoginAndUser.user) {
                return contactLoginAndUser.user;
            }
            var userTemplateId = accountId + "$" + customerTemplateName;
            var userTemplate = Users.GetUserAsProcessAdmin(userTemplateId);
            if (userTemplate == null) {
                userTemplateId = accountId + "$recipientusertemplate";
                userTemplate = Users.GetUserAsProcessAdmin(userTemplateId);
            }
            if (userTemplate == null) {
                Log.Error("Could not create user for customer. Failed to retrieve user template.");
                return null;
            }
            var values = {
                Login: contactLoginAndUser.login,
                BusinessPartnerID: companyId,
                EmailAddress: emailAddress,
                displayName: displayName || emailAddress,
                Company: companyName,
                additionnalInformation: "",
                loginType: 0x10,
                password: "",
                CreationDateTime: "NOW()"
            };
            var user = userTemplate.Clone(contactLoginAndUser.login, values);
            return user;
        }
        Contacts.GetOrCreateContactUser = GetOrCreateContactUser;
    })(Contacts = Lib.Contacts || (Lib.Contacts = {}));
})(Lib || (Lib = {}));
