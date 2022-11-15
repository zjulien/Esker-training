/* LIB_DEFINITION{
  "name": "Lib_Conversations_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "library",
  "require": [
    "Sys/Sys_DD_Document"
  ]
}*/
var Lib;
(function (Lib) {
    var Conversations;
    (function (Conversations) {
        /**
         * Shows a popup for a user to send a conversation message/email to new or existing contacts
         * @param conversationControl - the conversation control on the view
         * @param templateMessagesTable - if templates are available, the name of the table
         * @param templateMessagesFilter - if templates are available, the filter to get appropriate templates
         * @param GetCustomerNumber - function that returns the customer number
         * @param GetCustomerName - function that returns the customer name
         * @param GetDefaultEmailAddress - function that returns the default email address (if available)
         * @param displayInitConversationWarning - true if a warning should be displayed about publishing a conversation on the customer portal
         * @param useQuickCustomerDisplay - true if we should display existing contacts in a table, instead of requring users to search a databasecombobox
         * @returns the conversationpopup object
         */
        function GetConversationPopup(conversationControl, templateMessagesTable, templateMessagesFilter, GetCustomerNumber, GetCustomerName, GetDefaultEmailAddress, displayInitConversationWarning, useQuickCustomerDisplay, GetDefaultCCEmailAddress) {
            var ControlNames = {
                HeaderErrorMessage: "HeaderErrorMessage",
                CustomerField: "Customer",
                ToField: "To",
                CCField: "CC",
                ContactTableField: "ContactTable",
                ContactTableSelectedCol: "ColSelected",
                ContactTableExistingContactCol: "ColExistingContact",
                ContactTableEmailCol: "ColEmail",
                ContactTableNameCol: "ColName",
                TemplateField: "Template",
                MessageField: "Message",
                WarningsField: "WarningMessages",
                ForwardedAttaches: "ForwardedAttaches",
                AttachmentsField: "Attachments",
                AddOriginalEmailContent: "AddOriginalEmailContent__"
            };
            var ConversationPopup = {
                ConversationControl: conversationControl,
                TemplatesCache: {},
                AllowSelectCustomer: false,
                SetBusinessId: false,
                WarningMessageAlreadyValidated: {},
                NumberOfConversations: 0,
                LastConversationId: null,
                NewMessage: null,
                EmailFieldIsReadOnly: false,
                DisplayCheckboxToAddOriginalEmail: false,
                ForceCreateConversationFromOriginalEmail: false,
                ForceCreateConversationFromNewMessage: false,
                _currentUser: undefined,
                NewCustomersEmailAddresses: null,
                EmailsNotAssociatedToCustomers: [],
                PreventNotifFromServerSide: false,
                EnableEmailCCRecipients: false,
                HideCustomerRequiredWarning: false,
                EnableAttachmentForwarding: true,
                ConsiderInternalAsExternal: false,
                UsersFilterOptions: { includeNoCustomers: false, includeGroups: false },
                ConversationIdToForward: "",
                // Calls the "callbackFunction" with a user object matching the login "login".
                // If the user is in cache, the callback will be call synchronously.
                // If the user isn't, the user will be query and given to the callback asynchronously.
                // In this second case, the value "null" can be passed if no user were found by the ownerID.
                GetCurrentCachedUser: function (login) {
                    if (ConversationPopup._currentUser === undefined) {
                        return Sys.GenericAPI.PromisedQuery({
                            table: "ODUSER",
                            filter: "(Login=" + login + ")",
                            maxRecords: 1,
                            attributes: ["Title", "FirstName", "MiddleName", "LastName", "DisplayName", "Description", "FaxNumber", "MobileNumber", "PhoneNumber", "Company", "Street", "POBox", "ZipCode", "City", "MailState", "Country", "MailSub"],
                            additionalOptions: { queryOptions: "FastSearch=1" }
                        }).Then(function (results) {
                            if (results.length > 0) {
                                ConversationPopup._currentUser =
                                    {
                                        login: login,
                                        title: results[0].Title,
                                        firstname: results[0].FirstName,
                                        middlename: results[0].MiddleName,
                                        lastname: results[0].LastName,
                                        displayname: results[0].DisplayName,
                                        description: results[0].Description,
                                        faxnumber: results[0].FaxNumber,
                                        mobilenumber: results[0].MobileNumber,
                                        phonenumber: results[0].PhoneNumber,
                                        company: results[0].Company,
                                        street: results[0].Street,
                                        pobox: results[0].POBox,
                                        zipcode: results[0].ZipCode,
                                        city: results[0].City,
                                        mailstate: results[0].MailState,
                                        country: results[0].Country,
                                        mailsub: results[0].MailSub
                                    };
                                return ConversationPopup._currentUser;
                            }
                            ConversationPopup._currentUser = null;
                            return Sys.Helpers.Promise.Reject("User ".concat(login, " not found"));
                        });
                    }
                    if (ConversationPopup._currentUser === null) {
                        return Sys.Helpers.Promise.Reject("User ".concat(login, " not found"));
                    }
                    return Sys.Helpers.Promise.Resolve(ConversationPopup._currentUser);
                },
                GetUsersFilterForChecking: function (emailAddresses, withBusinessPartnerId) {
                    var emailFilters = [];
                    for (var iAddress = 0; iAddress < emailAddresses.length; iAddress++) {
                        if (emailAddresses[iAddress]) {
                            emailFilters.push(Sys.Helpers.LdapUtil.FilterEqual("EmailAddress", emailAddresses[iAddress]));
                        }
                    }
                    var emailFilterPart = Sys.Helpers.LdapUtil.FilterOr.apply(null, emailFilters).toString();
                    var businessPartnerIdPart = "";
                    if (withBusinessPartnerId) {
                        var companyNumber = GetCustomerNumber();
                        businessPartnerIdPart = Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("BusinessPartnerId", companyNumber), Sys.Helpers.LdapUtil.FilterEqual("AccountId", User.accountId)).toString();
                    }
                    var groupFilter;
                    if (this.UsersFilterOptions.includeGroups) {
                        groupFilter = Sys.Helpers.LdapUtil.FilterEqualOrEmpty("IsGroup", "1").toString();
                    }
                    else {
                        groupFilter = Sys.Helpers.LdapUtil.FilterEqualOrEmpty("IsGroup", "0").toString();
                    }
                    var customerFilter;
                    if (this.UsersFilterOptions.includeNoCustomers) {
                        customerFilter = Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("Customer", "0"), Sys.Helpers.LdapUtil.FilterEqual("Customer", "1"));
                    }
                    else {
                        customerFilter = Sys.Helpers.LdapUtil.FilterEqual("Customer", "1");
                    }
                    return "(&(|(AccountLocked=0)(!(AccountLocked=*)))(|(Locked=0)(!(Locked=*)))(|(TechnicalUser=0)(!(TechnicalUser=*)))" + customerFilter + groupFilter + emailFilterPart + businessPartnerIdPart + ")";
                },
                GetUsersFilterForAutocompletion: function () {
                    var companyNumber = GetCustomerNumber();
                    var businessPartnerIdPart = "";
                    var notCurrentUser = "";
                    if (companyNumber) {
                        businessPartnerIdPart = Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("BusinessPartnerId", companyNumber), Sys.Helpers.LdapUtil.FilterEqual("AccountId", User.accountId)).toString();
                        notCurrentUser = Sys.Helpers.LdapUtil.FilterNotEqual("MSN", User.id).toString();
                    }
                    var groupFilter;
                    if (this.UsersFilterOptions.includeGroups) {
                        groupFilter = Sys.Helpers.LdapUtil.FilterEqualOrEmpty("IsGroup", "1").toString();
                    }
                    else {
                        groupFilter = Sys.Helpers.LdapUtil.FilterEqualOrEmpty("IsGroup", "0").toString();
                    }
                    var customerFilter;
                    if (this.UsersFilterOptions.includeNoCustomers) {
                        customerFilter = Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("Customer", "0"), Sys.Helpers.LdapUtil.FilterEqual("Customer", "1"));
                    }
                    else {
                        customerFilter = Sys.Helpers.LdapUtil.FilterEqual("Customer", "1");
                    }
                    return "(&(|(AccountLocked=0)(!(AccountLocked=*)))(|(Locked=0)(!(Locked=*)))(|(TechnicalUser=0)(!(TechnicalUser=*)))" + customerFilter + groupFilter + businessPartnerIdPart + notCurrentUser + ")";
                },
                /**
                 * For use when AllowSelectCustomer is true. Handles some complexities with the customer field, such as formatting the login
                 * value to strip the prefix we typically hide from the user, and to grab the company's display name for later use
                 * @param dialog - the dialog object
                 */
                SetCustomerNameNumberHelper: function (dialog) {
                    var companyNumber;
                    if (ConversationPopup.AllowSelectCustomer) {
                        var customerField = dialog.GetControl(ControlNames.CustomerField);
                        companyNumber = customerField.GetValue();
                        GetCustomerName = function () {
                            return "";
                        };
                        if (companyNumber) {
                            if (companyNumber.indexOf("$") > 0) {
                                //Format company number to only show the value after the $
                                companyNumber = companyNumber.split("$")[1];
                                customerField.SetAllowTableValuesOnly(false);
                                customerField.SetValue(companyNumber);
                                customerField.SetAllowTableValuesOnly(true);
                            }
                            //Grab the customer name to pass on for if/when we create a new contact
                            var queryCallback = function (results) {
                                if (results.length === 1) {
                                    GetCustomerName = function () {
                                        return results[0].Company;
                                    };
                                }
                            };
                            var customerFilter = "&(Customer=1)(|(IsContact=0)(IsCompany__=1))(Login=".concat(User.accountId, "$").concat(companyNumber, ")");
                            Sys.GenericAPI.Query("USERPORTAL", customerFilter, ["Company"], queryCallback, null, 1);
                        }
                        GetCustomerNumber = function () {
                            return companyNumber;
                        };
                    }
                    else {
                        companyNumber = GetCustomerNumber();
                    }
                    if (!useQuickCustomerDisplay) {
                        var toField = dialog.GetControl(ControlNames.ToField);
                        var filter = ConversationPopup.GetUsersFilterForAutocompletion();
                        toField.SetFilter(filter);
                        if (ConversationPopup.EnableEmailCCRecipients) {
                            var ccField = dialog.GetControl(ControlNames.CCField);
                            ccField.SetFilter(filter);
                        }
                    }
                    else {
                        var table_1 = dialog.GetControl(ControlNames.ContactTableField);
                        table_1.SetItemCount(0);
                        if (companyNumber) {
                            var queryCallback = function (results) {
                                if ((results === null || results === void 0 ? void 0 : results.length) > 0) {
                                    for (var i = 0; i < results.length; i++) {
                                        var result = results[i];
                                        var email = result.EmailAddress;
                                        if (!email) {
                                            continue;
                                        }
                                        var item = table_1.AddItem();
                                        item.SetValue(ControlNames.ContactTableEmailCol, email);
                                        item.SetValue(ControlNames.ContactTableNameCol, results[i].DisplayName);
                                        item.SetValue(ControlNames.ContactTableExistingContactCol, "true");
                                    }
                                }
                                table_1.AddItem(); //add one more item automatically, so user can enter a new contact
                            };
                            Sys.GenericAPI.Query("ODUSER", ConversationPopup.GetUsersFilterForAutocompletion(), ["DisplayName", "EmailAddress"], queryCallback, null, 25);
                        }
                        else {
                            table_1.AddItem();
                        }
                    }
                },
                OnHandleCallBackDialog: function (dialog, _tabId, event, control, param1 /*, param2: any*/) {
                    var name = control.GetName();
                    if (name === ControlNames.TemplateField && event === "OnChange") {
                        var messageControl_1 = dialog.GetControl(ControlNames.MessageField);
                        messageControl_1.SetValue(""); // reset message
                        var templateName = control.GetValue();
                        if (templateName) {
                            var foundTemplate = ConversationPopup.TemplatesCache[templateName];
                            if (foundTemplate) {
                                ConversationPopup.ReplaceTags(foundTemplate)
                                    .Then(function (message) {
                                    messageControl_1.SetValue(message);
                                });
                            }
                            else {
                                Log.Error("No template found for templateName '" + templateName + "'. Check query and TemplatesCache! ");
                            }
                        }
                    }
                    else if ((name === ControlNames.ToField && event === "OnChange")
                        || (name === ControlNames.CCField && event === "OnChange")) {
                        if (ConversationPopup.CheckEmailAddresses(dialog)) {
                            // Don't check for customer warnings if the email address(es) aren't valid
                            ConversationPopup.CheckCustomersWarnings(dialog);
                        }
                    }
                    else if (name === ControlNames.CustomerField && event === "OnChange") {
                        ConversationPopup.SetCustomerNameNumberHelper(dialog);
                        // Re-validate customer warnings after changing the customer
                        if (ConversationPopup.CheckEmailAddresses(dialog)) {
                            ConversationPopup.CheckCustomersWarnings(dialog);
                        }
                    }
                    else if (name === ControlNames.ContactTableField && event === "OnRefreshRow") {
                        var table = dialog.GetControl(ControlNames.ContactTableField);
                        var row = table.GetRow(param1); //param1 is the row number
                        var contactReadOnly = row.GetItem().GetValue(ControlNames.ContactTableExistingContactCol) === "true";
                        row[ControlNames.ContactTableEmailCol].SetReadOnly(contactReadOnly);
                        row[ControlNames.ContactTableNameCol].SetReadOnly(contactReadOnly);
                    }
                    else if (name === ControlNames.ContactTableEmailCol && event === "OnSetValue") {
                        var email = control.GetValue() || "";
                        var table = dialog.GetControl(ControlNames.ContactTableField);
                        var itemCount = table.GetItemCount();
                        for (var i = 0; i < itemCount; i++) {
                            var item = table.GetItem(i);
                            var itemEmail = item.GetValue(ControlNames.ContactTableEmailCol);
                            if (email === "" && !itemEmail) {
                                item.SetValue(ControlNames.ContactTableSelectedCol, false);
                            }
                            else if (email === itemEmail) {
                                if (i + 1 === itemCount) //make an autoadd row
                                 {
                                    table.AddItem();
                                    control.SetWarning("");
                                }
                                if (item.GetValue(ControlNames.ContactTableExistingContactCol) !== "true") {
                                    if (!Sys.Helpers.String.IsEmail(email)) {
                                        control.SetError("_Conversation email bad format");
                                        item.SetValue(ControlNames.ContactTableSelectedCol, false);
                                    }
                                    else {
                                        ConversationPopup.CheckCustomersWarnings(dialog, email, control);
                                        item.SetValue(ControlNames.ContactTableSelectedCol, true);
                                        // Need to manually handle the require on the "To" table
                                        // Selecting a recipient does not satisfy the require check on the table
                                        dialog.RequireControl(table, false);
                                        ConversationPopup.ClearHeaderErrorMessage(dialog);
                                    }
                                }
                                break;
                            }
                        }
                    }
                    else if (name === ControlNames.ContactTableSelectedCol && event === "OnSetValue") {
                        var anyRowHasValue = false;
                        var table = dialog.GetControl(ControlNames.ContactTableField);
                        for (var i = 0; i < table.GetItemCount(); i++) {
                            var item = table.GetItem(i);
                            if (item.GetValue(ControlNames.ContactTableSelectedCol) && item.GetValue(ControlNames.ContactTableEmailCol)) {
                                anyRowHasValue = true;
                                ConversationPopup.ClearHeaderErrorMessage(dialog);
                                break;
                            }
                        }
                        // Need to manually handle the require on the "To" table
                        // Selecting a recipient does not satisfy the require check on the table
                        dialog.RequireControl(table, !anyRowHasValue);
                    }
                },
                OnFillDialog: function (dialog) {
                    var headerErrorMessage = dialog.AddDescription(ControlNames.HeaderErrorMessage, "", 400);
                    headerErrorMessage.SetErrorStyle();
                    headerErrorMessage.SetImageURL("deny_red.png", true);
                    headerErrorMessage.Hide(true);
                    var customerNumber = GetCustomerNumber();
                    if (ConversationPopup.AllowSelectCustomer) {
                        var customerData = {
                            "TableName": "USERPORTAL",
                            "DisplayedColumns": "Company|City|MailState|Description",
                            "SavedColumn": "Login",
                            "CustomFilter": "&(|(IsContact=0)(IsCompany__=1))(!(|(!(Company=*))(Company=))))"
                        };
                        var customerField = dialog.AddDatabaseComboBox(ControlNames.CustomerField, "_Customer", 1000, customerData);
                        customerField.SetAutocompletable(true);
                        customerField.SetPrefillResult(true);
                        customerField.SetMaxRecords(20);
                        customerField.SetBrowsable(false);
                        customerField.SetSearchMode("contains");
                        customerField.SetAllowTableValuesOnly(false);
                        customerField.SetValue(customerNumber);
                        customerField.SetAllowTableValuesOnly(true);
                    }
                    if (!useQuickCustomerDisplay) {
                        var usersData = {
                            "TableName": "ODUSER",
                            "SortOrder": "ASC",
                            "DisplayedColumns": !ConversationPopup.AllowSelectCustomer ? "DisplayName|Customer|Login" : "DisplayName|Company",
                            "SavedColumn": "EmailAddress",
                            "Multiple": true,
                            "Free": true,
                            "Sort": "Customer:DESC|DisplayName:ASC|EmailAddress:ASC",
                            "DisplayFormat": "%%DisplayName%% <%%EmailAddress%%>",
                            "FreeEntryCheck": "^([a-zA-Z0-9-'_]+(\\.[a-zA-Z0-9-'_]+)*)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9-]+\\.)+))([a-zA-Z]{2,}|[0-9]{1,3})(\\]?)$",
                            "Separator": ";",
                            "Placeholder": Language.Translate("_SelectOrEnterAtLeastOneEmailAddress"),
                            "CustomFilter": ConversationPopup.GetUsersFilterForAutocompletion()
                        };
                        var toField = dialog.AddSelect2ComboBox(ControlNames.ToField, "_Conversation to", 1000, usersData);
                        dialog.AddSeparator();
                        if (!ConversationPopup.ConversationIdToForward) {
                            toField.SetValue(GetDefaultEmailAddress ? GetDefaultEmailAddress() : "");
                        }
                        if (ConversationPopup.EmailFieldIsReadOnly) {
                            toField.SetReadOnly(true);
                        }
                        dialog.RequireControl(toField);
                        if (ConversationPopup.EnableEmailCCRecipients) {
                            var CCField = dialog.AddSelect2ComboBox(ControlNames.CCField, "_Conversation cc", 1000, usersData);
                            dialog.AddSeparator();
                            CCField.SetValue(GetDefaultCCEmailAddress ? GetDefaultCCEmailAddress() : "");
                            if (ConversationPopup.EmailFieldIsReadOnly) {
                                CCField.SetReadOnly(true);
                            }
                        }
                    }
                    else {
                        var table = dialog.AddTable(ControlNames.ContactTableField, "_Conversation to");
                        table.HideTopNavigation(true);
                        table.HideBottomNavigation(true);
                        table.HideTableRowMenu(true);
                        table.HideTableRowAdd(true);
                        table.HideTableRowDuplicate(true);
                        table.AddCheckBoxColumn(ControlNames.ContactTableSelectedCol, "", 5);
                        table.AddTextColumn(ControlNames.ContactTableExistingContactCol, null, 0);
                        table.AddTextColumn(ControlNames.ContactTableEmailCol, "_Conversation email", 375);
                        table.AddTextColumn(ControlNames.ContactTableNameCol, "_Conversation name", 571);
                        if (customerNumber) {
                            ConversationPopup.SetCustomerNameNumberHelper(dialog);
                        }
                        else {
                            table.AddItem();
                        }
                        dialog.RequireControl(table);
                    }
                    var templateNames = Object.keys(ConversationPopup.TemplatesCache);
                    if (templateNames.length > 0) {
                        templateNames.sort();
                        var templateCb = dialog.AddComboBox(ControlNames.TemplateField, "_Conversation template");
                        templateCb.SetAvailableValues("=\n" + templateNames.map(function (name) { return name + "=" + name; }).join("\n"));
                    }
                    if (ConversationPopup.DisplayCheckboxToAddOriginalEmail) {
                        dialog.AddCheckBox(ControlNames.AddOriginalEmailContent, "_Add original email content");
                        dialog.GetControl(ControlNames.AddOriginalEmailContent).SetValue(true);
                    }
                    var messageTxt = dialog.AddMultilineText(ControlNames.MessageField, "_Conversation message", 1000);
                    messageTxt.SetLineCount(20);
                    dialog.RequireControl(messageTxt);
                    if (ConversationPopup.EnableAttachmentForwarding) {
                        var usersData = {
                            "Multiple": true,
                            "Free": false,
                            "Placeholder": Language.Translate("_chooseAttachToForward")
                        };
                        var forwardedAttachesField = dialog.AddSelect2ComboBox(ControlNames.ForwardedAttaches, "_ForwardedAttaches", 1000, usersData);
                        for (var i = 0; i < Attach.GetNbAttach(); i++) {
                            var attach = Attach.GetAttach(i);
                            var name = attach.GetNiceName(0);
                            var id = attach.GetId();
                            forwardedAttachesField.AddOption(id, name, false, "", "", true, false, "", true, false);
                        }
                        dialog.AddSeparator();
                    }
                    dialog.AddFileUploader(ControlNames.AttachmentsField, "_Conversation additional attachments");
                    var warningMessagesCtrl = dialog.AddDescription(ControlNames.WarningsField, "", 1000);
                    warningMessagesCtrl.SetWarningStyle();
                    ConversationPopup.CheckEmailAddresses(dialog);
                    ConversationPopup.CheckCustomersWarnings(dialog);
                },
                GetDisplayName: function (addressInfo, emailFrom, emailFromDisplayName) {
                    var displayName = "";
                    if (addressInfo.DISPLAYNAME) {
                        displayName = addressInfo.DISPLAYNAME;
                    }
                    else if (addressInfo.address == emailFrom && emailFromDisplayName) {
                        displayName = emailFromDisplayName;
                    }
                    return displayName;
                },
                OnCommitDialog: function (dialog) {
                    var primaryEmailAddress = "";
                    var primaryDisplayName = "";
                    var additionalRecipients = [];
                    var customerName = GetCustomerName();
                    var customerNumber = GetCustomerNumber();
                    //#region Handle multiple recipients
                    var addressesInfo;
                    var primaryRecipientInfo;
                    var emailContacts;
                    var externalContributors = [];
                    if (!useQuickCustomerDisplay) {
                        var emailFrom = Data.GetValue("Email_From__");
                        var emailFromDisplayName = Data.GetValue("Email_From_Display_Name__");
                        addressesInfo = ConversationPopup.GetEmailAddressesWithInfo(dialog);
                        for (var index = 0; index < addressesInfo.length; index++) {
                            var addressInfo = addressesInfo[index];
                            if (Sys.Helpers.String.IsEmail(addressInfo.address)) {
                                // External contributor
                                if (ConversationPopup.IsEmailExcluded(addressInfo.address)
                                    || (ConversationPopup.ConsiderInternalAsExternal &&
                                        (("CUSTOMER" in addressInfo) && addressInfo.CUSTOMER == "0"))) {
                                    externalContributors.push({
                                        emailAddress: addressInfo.address,
                                        displayName: ConversationPopup.GetDisplayName(addressInfo, emailFrom, emailFromDisplayName),
                                        emailTemplate: "Notify_Order_Conversation_NewMessage_ExternalContributor.htm",
                                        emailRecipientType: addressInfo.emailRecipientType,
                                        login: addressInfo.LOGIN
                                    });
                                    continue;
                                }
                                if (primaryEmailAddress === "") {
                                    primaryEmailAddress = addressInfo.address;
                                    primaryRecipientInfo = {
                                        type: addressInfo.CUSTOMER != "0" ? "CUSTOMER" : "",
                                        emailAddress: addressInfo.address,
                                        company: customerName,
                                        emailRecipientType: addressInfo.emailRecipientType
                                    };
                                }
                                else {
                                    additionalRecipients.push({
                                        type: addressInfo.CUSTOMER != "0" ? "CUSTOMER" : "",
                                        emailAddress: addressInfo.address,
                                        company: customerName,
                                        emailRecipientType: addressInfo.emailRecipientType
                                    });
                                }
                            }
                        }
                    }
                    else {
                        emailContacts = ConversationPopup.GetEmailContacts(dialog);
                        for (var index = 0; index < emailContacts.length; index++) {
                            var address = emailContacts[index].email;
                            var name = emailContacts[index].displayName;
                            if (Sys.Helpers.String.IsEmail(address)) {
                                // External contributor
                                if (ConversationPopup.IsEmailExcluded(address)) {
                                    externalContributors.push({
                                        emailAddress: address,
                                        emailTemplate: "Notify_Order_Conversation_NewMessage_ExternalContributor.htm"
                                    });
                                    continue;
                                }
                                if (primaryEmailAddress === "") {
                                    primaryEmailAddress = address;
                                    primaryDisplayName = name;
                                    primaryRecipientInfo = {
                                        type: "CUSTOMER",
                                        emailAddress: address,
                                        company: customerName
                                    };
                                }
                                else {
                                    additionalRecipients.push({
                                        type: "CUSTOMER",
                                        emailAddress: address,
                                        displayName: name,
                                        company: customerName
                                    });
                                }
                            }
                        }
                    }
                    var originalEmailAddress = Data.GetValue("Email_From__");
                    var originalSenderIsAnExternalContributor = externalContributors.some(function (externalContributor) {
                        return externalContributor.emailAddress === originalEmailAddress;
                    });
                    var messageOptions = {
                        emailAddress: primaryEmailAddress,
                        recipient: {
                            emailAddress: primaryEmailAddress,
                            displayName: primaryDisplayName,
                            company: customerName,
                            doNotCreateContact: originalSenderIsAnExternalContributor
                        },
                        externalContributors: externalContributors,
                        preventNotifFromServerSide: ConversationPopup.PreventNotifFromServerSide,
                        forwardedConversationId: ConversationPopup.ConversationIdToForward
                    };
                    var messageObject = {
                        Message: dialog.GetControl(ControlNames.MessageField).GetValue(),
                        Type: "10"
                    };
                    if (ConversationPopup.SetBusinessId) {
                        messageOptions.recipient.businessId = customerNumber;
                        additionalRecipients = additionalRecipients.map(function (recipient) {
                            recipient.businessId = customerNumber;
                            return recipient;
                        });
                    }
                    var attachments = dialog.GetControl(ControlNames.AttachmentsField).GetUploadedFiles().map(function (obj) { return obj._docId; });
                    var originalEmailData = Sys.DD.Document.ExtractEmailBodyAndDisplayName();
                    if (originalEmailData && originalEmailData.subject) {
                        messageObject.Subject = originalEmailData.subject;
                        if (ConversationPopup.ConversationIdToForward) {
                            messageObject.Subject = "FW: " + messageObject.Subject;
                        }
                    }
                    var shouldAddOriginalEmail = false;
                    if (ConversationPopup.DisplayCheckboxToAddOriginalEmail) {
                        shouldAddOriginalEmail = dialog.GetControl(ControlNames.AddOriginalEmailContent).GetValue();
                    }
                    else {
                        shouldAddOriginalEmail = ConversationPopup.NumberOfConversations === 0 && originalEmailData !== null;
                    }
                    var originalEmailBodyText = originalEmailData ? originalEmailData.emailBody : null;
                    if (originalEmailBodyText == null && shouldAddOriginalEmail) {
                        Log.Error("Failed extracting email body or it is empty");
                        shouldAddOriginalEmail = false;
                    }
                    var canAddAttachmentForwarding = true;
                    // Add email content to conversation
                    if (shouldAddOriginalEmail) {
                        var originalEmailSenderIsARecipient = originalSenderIsAnExternalContributor || originalEmailAddress === primaryEmailAddress || additionalRecipients.some(function (recipient) {
                            return recipient.emailAddress === originalEmailAddress;
                        });
                        var originalEmailSubject = originalEmailData ? originalEmailData.subject : null;
                        var originalEmailDisplayName = originalEmailData ? originalEmailData.displayName : null;
                        if (originalEmailSenderIsARecipient) {
                            var newMessageSubject = originalEmailSubject ? "RE: " + originalEmailSubject : "";
                            ConversationPopup.NewMessage = {
                                messageObject: {
                                    Message: messageObject.Message,
                                    Subject: newMessageSubject,
                                    Type: "10"
                                },
                                attachments: attachments
                            };
                            canAddAttachmentForwarding = false;
                            if (ConversationPopup.EnableAttachmentForwarding) {
                                var forwardedAttachesField = dialog.GetControl(ControlNames.ForwardedAttaches);
                                ConversationPopup.NewMessage.forwardedAttaches = forwardedAttachesField.GetValue();
                            }
                            messageObject = {
                                Message: originalEmailBodyText,
                                Subject: originalEmailSubject,
                                Type: "10"
                            };
                            if (messageOptions.emailAddress == primaryEmailAddress && originalEmailAddress != primaryEmailAddress && primaryRecipientInfo) {
                                //if the messageOptions.emailAddress is equal to the primaryEmailAddress we are going to erase the initial content of the messageOptions.emailAddress.
                                //We need to add this primaryEmailAddress to the additionalRecipients otherwise the primary will be lost and we will not create a new recipient if needed
                                additionalRecipients.splice(0, 0, primaryRecipientInfo);
                            }
                            var index_1 = -1;
                            var isOriginalEmailAddressInAdditonalRecipients = additionalRecipients.some(function (x, i) {
                                index_1 = i;
                                return x.emailAddress == originalEmailAddress;
                            });
                            if (isOriginalEmailAddressInAdditonalRecipients && index_1 >= 0) {
                                //if the original email address is already in the additionalRecipients we need to remove it as it will replace the messageOptions.recipient.emailAddress
                                additionalRecipients.splice(index_1, 1);
                            }
                            messageOptions.emailAddress = originalEmailAddress;
                            messageOptions.emailSubject = newMessageSubject;
                            messageOptions.sendAsRecipient = true;
                            messageOptions.recipient.emailAddress = originalEmailAddress;
                            messageOptions.recipient.displayName = originalEmailDisplayName;
                            //empty attachments
                            attachments = [];
                        }
                        else {
                            // if the original user is not a recipient we do not add the original message as first message (bubble) of the conversation
                            var subjectPrefix = originalSenderIsAnExternalContributor ? "RE: " : "FW: ";
                            var emailSubject = originalEmailSubject ? subjectPrefix + originalEmailSubject : "";
                            messageObject.Subject = emailSubject;
                            messageObject.originalMessage = {
                                senderDisplayName: originalEmailDisplayName,
                                senderEmail: originalEmailAddress,
                                emailSubject: originalEmailSubject,
                                emailDate: Sys.Helpers.Date.Date2DBDateTime(Data.GetValue("ReceivedDataTime")) || Sys.Helpers.Date.Date2DBDateTime(new Date()),
                                emailContent: originalEmailBodyText
                            };
                            messageOptions.emailSubject = emailSubject;
                        }
                    }
                    if (canAddAttachmentForwarding && ConversationPopup.EnableAttachmentForwarding) {
                        var forwardedAttachesField = dialog.GetControl(ControlNames.ForwardedAttaches);
                        messageOptions.forwardedAttaches = forwardedAttachesField.GetValue();
                    }
                    messageOptions.externalContributors = messageOptions.externalContributors.map(function (externalContributor) {
                        externalContributor.emailSubject = messageObject.Subject;
                        return externalContributor;
                    });
                    if (ConversationPopup.ShouldDisplayInitConversationWarning() && primaryEmailAddress !== "") {
                        ConversationPopup.OpenConversationPopupWarning(function () {
                            conversationControl.CreateConversationWithItem(messageObject, messageOptions, attachments, additionalRecipients);
                        });
                    }
                    else {
                        conversationControl.CreateConversationWithItem(messageObject, messageOptions, attachments, additionalRecipients);
                    }
                    var toField = dialog.GetControl(ControlNames.ToField);
                    if (toField) {
                        toField.InvalidateCache();
                    }
                },
                OnValidateDialog: function (dialog) {
                    var messageField = dialog.GetControl(ControlNames.MessageField);
                    if (!messageField.GetValue()) {
                        dialog.FocusControl(messageField);
                        return false;
                    }
                    var anyRecipientSelected = ConversationPopup.CheckAnyRecipientSelected(dialog);
                    var emailAddressesCorrectlyFormatted = ConversationPopup.CheckEmailAddresses(dialog);
                    return anyRecipientSelected && emailAddressesCorrectlyFormatted;
                },
                GetNewCustomersEmailAddresses: function (records, emailAddresses) {
                    var newCustomersEmailAddresses = [];
                    if (records) {
                        var dataBaseEmailAdresses = [];
                        for (var j = 0; j < records.length; j++) {
                            if (records[j].EmailAddress) {
                                dataBaseEmailAdresses.push(records[j].EmailAddress);
                            }
                        }
                        for (var iAddress = 0; iAddress < emailAddresses.length; iAddress++) {
                            var currentEmailAddress = emailAddresses[iAddress];
                            if (ConversationPopup.IsEmailExcluded(currentEmailAddress)) {
                                continue;
                            }
                            if (currentEmailAddress && dataBaseEmailAdresses.indexOf(currentEmailAddress) === -1) {
                                newCustomersEmailAddresses.push(currentEmailAddress);
                            }
                        }
                    }
                    return newCustomersEmailAddresses;
                },
                IsEmailExcluded: function (email) {
                    var excludedEmailAddresses = ConversationPopup.EmailsNotAssociatedToCustomers;
                    if (!excludedEmailAddresses) {
                        return false;
                    }
                    for (var index = 0; index < excludedEmailAddresses.length; index++) {
                        var excludedEmailAddress = excludedEmailAddresses[index];
                        if (excludedEmailAddress === email) {
                            return true;
                        }
                        if (excludedEmailAddress.startsWith("*") && email.endsWith(excludedEmailAddress.substr(1))) {
                            return true;
                        }
                    }
                    return false;
                },
                /**
                 * Checks entered email(s) for warnings, e.g. whether it's a new email address altogether, or if it's an email
                 * adress that's associated with a different customer
                 * @param dialog - the dialog object
                 * @param address - if provided, validates only the provided address vs all addresses. Pass in the control as well if using this param
                 * @param control - if provided, any warnings are added to this control instead of the warningMessage dialog. Pass in an address if using this param
                 */
                CheckCustomersWarnings: function (dialog, address, control) {
                    var addresses = address ? [address] : ConversationPopup.GetEmailAddresses(dialog);
                    var warnings = "";
                    function setWarning() {
                        if (control) {
                            control.SetWarning(warnings);
                        }
                        else {
                            var warningField = dialog.GetControl(ControlNames.WarningsField);
                            if (warningField) {
                                warningField.SetText(warnings);
                            }
                        }
                    }
                    function userQueryCallbackWithBusinessPartnerId(records) {
                        ConversationPopup.NewCustomersEmailAddresses = ConversationPopup.GetNewCustomersEmailAddresses(records, addresses);
                        if (ConversationPopup.NewCustomersEmailAddresses.length > 0) {
                            warnings += Language.Translate("_Conversation email linked to another customer") + "\n";
                            warnings += ConversationPopup.NewCustomersEmailAddresses.join(", ");
                        }
                        setWarning();
                        dialog.GetControl("ButtonOk").SetDisabled(false);
                    }
                    function userQueryCallbackWithoutBusinessPartnerId(records) {
                        ConversationPopup.NewCustomersEmailAddresses = ConversationPopup.GetNewCustomersEmailAddresses(records, addresses);
                        if (ConversationPopup.NewCustomersEmailAddresses.length > 0) {
                            if (ConversationPopup.NewCustomersEmailAddresses.length > 1) {
                                warnings += Language.Translate("_Conversation will create one or more new customers") + "\n";
                            }
                            else {
                                warnings += Language.Translate("_Conversation will create new customer") + "\n";
                            }
                            warnings += ConversationPopup.NewCustomersEmailAddresses.join(", ");
                            setWarning();
                            dialog.GetControl("ButtonOk").SetDisabled(false);
                        }
                        // If there is no new customer, query to check if contact is associated with another customer
                        else {
                            Sys.GenericAPI.Query("ODUSER", ConversationPopup.GetUsersFilterForChecking(addresses, true), ["EmailAddress"], userQueryCallbackWithBusinessPartnerId, null, "NO_LIMIT");
                        }
                    }
                    // Check if contact exists or is associated with a customer for all email addresses entered
                    if (addresses.length > 0 && GetCustomerNumber()) {
                        dialog.GetControl("ButtonOk").SetDisabled(true);
                        Sys.GenericAPI.Query("ODUSER", ConversationPopup.GetUsersFilterForChecking(addresses, false), ["EmailAddress", "Login"], userQueryCallbackWithoutBusinessPartnerId, null, "NO_LIMIT");
                    }
                    // If no email address is entered, skip checks
                    else {
                        setWarning();
                        dialog.GetControl("ButtonOk").SetDisabled(false);
                    }
                },
                CheckEmailAddresses: function (dialog) {
                    var _a;
                    var atLeastOneValidAddress = false;
                    if (!useQuickCustomerDisplay) {
                        var toField = dialog.GetControl(ControlNames.ToField);
                        var addresses = ConversationPopup.GetEmailAddresses(dialog);
                        if (addresses.length > 0) {
                            for (var iAddress = 0; iAddress < addresses.length; iAddress++) {
                                if (addresses[iAddress]) {
                                    if (!Sys.Helpers.String.IsEmail(addresses[iAddress])) {
                                        toField.SetError("_Conversation email bad format");
                                        return false;
                                    }
                                    atLeastOneValidAddress = true;
                                }
                            }
                        }
                        if (atLeastOneValidAddress) {
                            toField.SetError("");
                        }
                        else {
                            toField.SetError("_Conversation email bad format");
                        }
                    }
                    else {
                        var table = dialog.GetControl(ControlNames.ContactTableField);
                        var itemCount = table.GetItemCount();
                        var firstIndexDisplayed = ((_a = table.GetRow(0)) === null || _a === void 0 ? void 0 : _a.GetLineNumber(true)) - 1;
                        var lastIndexDisplayed = Math.min(firstIndexDisplayed + table.GetLineCount(true), table.GetItemCount()) - 1;
                        for (var i = 0; i < itemCount; i++) {
                            var item = table.GetItem(i);
                            var itemEmail = (item.GetValue(ControlNames.ContactTableEmailCol) || "").trim();
                            var selected = item.GetValue(ControlNames.ContactTableSelectedCol);
                            if (!itemEmail) {
                                item.SetValue(ControlNames.ContactTableSelectedCol, false);
                            }
                            else if (selected) {
                                if (item.GetValue(ControlNames.ContactTableExistingContactCol) !== "true") {
                                    var row = void 0;
                                    if (i >= firstIndexDisplayed && i <= lastIndexDisplayed) {
                                        row = table.GetRow(i - firstIndexDisplayed);
                                    }
                                    if (!Sys.Helpers.String.IsEmail(itemEmail)) {
                                        row === null || row === void 0 ? void 0 : row[ControlNames.ContactTableEmailCol].SetError("_Conversation email bad format");
                                        item.SetValue(ControlNames.ContactTableSelectedCol, false);
                                        return false;
                                    }
                                }
                                atLeastOneValidAddress = true;
                            }
                        }
                    }
                    return atLeastOneValidAddress;
                },
                CheckAnyRecipientSelected: function (dialog) {
                    if (!useQuickCustomerDisplay) {
                        return true;
                    }
                    var table = dialog.GetControl(ControlNames.ContactTableField);
                    var itemCount = table.GetItemCount();
                    var selectedRecipients = [];
                    for (var i = 0; i < itemCount; i++) {
                        var item = table.GetItem(i);
                        var itemEmail = (item.GetValue(ControlNames.ContactTableEmailCol) || "").trim();
                        var selected = item.GetValue(ControlNames.ContactTableSelectedCol);
                        if (selected && itemEmail !== "") {
                            selectedRecipients.push(item);
                        }
                    }
                    if (selectedRecipients.length == 0) {
                        var headerErrorMessage = dialog.GetControl(ControlNames.HeaderErrorMessage);
                        headerErrorMessage.Hide(false);
                        headerErrorMessage.SetText(Language.Translate("_Conversation no recipients selected"));
                        return false;
                    }
                    return true;
                },
                ClearHeaderErrorMessage: function (dialog) {
                    var headerErrorMessage = dialog.GetControl(ControlNames.HeaderErrorMessage);
                    headerErrorMessage.SetText("");
                    headerErrorMessage.Hide(true);
                },
                GetPopupTitle: function (popupTitle) {
                    if (popupTitle) {
                        return Language.Translate(popupTitle);
                    }
                    else if (ConversationPopup.AllowSelectCustomer || ConversationPopup.HideCustomerRequiredWarning) {
                        return Language.Translate("_Send message");
                    }
                    return Language.Translate("_Conversation send message to", false, GetCustomerName());
                },
                OpenConversationPopup: function (popupTitleKey) {
                    Popup.Dialog(this.GetPopupTitle(popupTitleKey), null, ConversationPopup.OnFillDialog, ConversationPopup.OnCommitDialog, ConversationPopup.OnValidateDialog, ConversationPopup.OnHandleCallBackDialog);
                },
                OnFillDialogWarning: function (dialog) {
                    if (!GetCustomerName) {
                        return;
                    }
                    dialog.AddDescription("ConversationWarningDescription__", Language.Translate("Display publish on portal warning for conversation", false, GetCustomerName()));
                },
                OnCommitDialogWarning: function (callback) {
                    var custNumber = GetCustomerNumber();
                    if (custNumber) {
                        ConversationPopup.WarningMessageAlreadyValidated[custNumber] = true;
                    }
                    callback();
                },
                OpenConversationPopupWarning: function (callback) {
                    var popupTitle = ConversationPopup.AllowSelectCustomer || ConversationPopup.HideCustomerRequiredWarning ?
                        Language.Translate("_Send message") :
                        Language.Translate("_Conversation send message to", false, GetCustomerName());
                    Popup.Dialog(popupTitle, null, ConversationPopup.OnFillDialogWarning, ConversationPopup.OnCommitDialogWarning.bind(null, callback), null);
                },
                OpenConversation: function (popupTitleKey) {
                    if (ConversationPopup.AllowSelectCustomer || ConversationPopup.HideCustomerRequiredWarning || (GetCustomerNumber() && GetCustomerName())) {
                        if (!templateMessagesTable) {
                            ConversationPopup.OpenConversationPopup(popupTitleKey);
                            return;
                        }
                        var templatesQueryResultHandler = function (records) {
                            ConversationPopup.TemplatesCache = {};
                            for (var recordIndex = 0; recordIndex < records.length; recordIndex++) {
                                var name = records[recordIndex].Name__;
                                var template = records[recordIndex].Template__;
                                if (name && template) {
                                    ConversationPopup.TemplatesCache[name] = template;
                                }
                            }
                            ConversationPopup.OpenConversationPopup(popupTitleKey);
                        };
                        Sys.GenericAPI.Query(templateMessagesTable, templateMessagesFilter, ["Name__", "Template__"], templatesQueryResultHandler, null, "NO_LIMIT", "FastSearch=-1");
                    }
                    else {
                        Popup.Alert("_Select a customer before starting a conversation", false, null, "_Select a customer before starting a conversation popup title");
                    }
                },
                GetTagName: function (tag) {
                    var match = tag.substr(2, tag.length - 3).match(/^[a-zA-Z_][0-9a-zA-Z_]*/);
                    return match && match[0];
                },
                GetTagConditionValue: function (tag, value) {
                    // tag with default value (when the value is empty): %[<control_name>||<default_value>]
                    // tag with replacement value (when the value is not empty): %[<control_name>&&<replacement_value>]
                    var match = tag.substr(2, tag.length - 3).match(/(\|\||&&).*/);
                    if (match) {
                        var condition = match[0];
                        if (condition[0] === "|") {
                            // "||": or condition
                            if (!value) {
                                value = condition.substr(2);
                            }
                        }
                        else if (value) {
                            // "&&": and condition
                            value = condition.substr(2);
                        }
                    }
                    return value;
                },
                ReplaceTag: function (tag) {
                    // tag: %[<control_name>]
                    var value = tag; // in case of error: leave the tag
                    var name = ConversationPopup.GetTagName(tag);
                    if (name) {
                        var control = Controls[name];
                        if (control) {
                            value = control.GetDisplayValue();
                            value = ConversationPopup.GetTagConditionValue(tag, value);
                        }
                        else if (name === "SelectedCustomer") {
                            //Special handling to allow for grabbing customer name when selection is available
                            value = GetCustomerName();
                            value = ConversationPopup.GetTagConditionValue(tag, value);
                        }
                    }
                    return value;
                },
                ReplaceUserTag: function (currentUser, tag) {
                    var value = tag; // in case of error: leave the tag
                    var match = tag.substr("%[currentuser:".length, tag.length - 3).match(/^[a-zA-Z_][0-9a-zA-Z_]*/);
                    if (match && match[0]) {
                        var name = match[0].toLocaleLowerCase();
                        if (Object.keys(currentUser).indexOf(name) !== -1) {
                            value = currentUser[name];
                        }
                    }
                    return value;
                },
                ReplaceCurrentUserTag: function (message) {
                    return ConversationPopup.GetCurrentCachedUser(User.loginId)
                        .Then(function (currentUser) {
                        return message.replace(/%\[[^\]]*\]/g, function (tag) { return ConversationPopup.ReplaceUserTag(currentUser, tag); });
                    });
                },
                ReplaceTags: function (template) {
                    var message = template.replace(/%\[[^\]]*\]/g, ConversationPopup.ReplaceTag);
                    if (template.indexOf("%[CurrentUser:") !== -1) {
                        return ConversationPopup.ReplaceCurrentUserTag(message);
                    }
                    return Sys.Helpers.Promise.Resolve(message);
                },
                GetEmailContacts: function (dialog) {
                    var elements = [];
                    var table = dialog.GetControl(ControlNames.ContactTableField);
                    for (var i = 0; i < table.GetItemCount(); i++) {
                        var item = table.GetItem(i);
                        if (item.GetValue(ControlNames.ContactTableSelectedCol)) {
                            var email = (item.GetValue(ControlNames.ContactTableEmailCol) || "").trim();
                            if (email) {
                                elements.push({ email: email, displayName: item.GetValue(ControlNames.ContactTableNameCol) });
                            }
                        }
                    }
                    return elements;
                },
                GetEmailAddresses: function (dialog) {
                    var elements = [];
                    if (!useQuickCustomerDisplay) {
                        var getEmailAddressesFromControl = function (controlName) {
                            // prevent trim on empty string
                            var addressesString = dialog.GetControl(controlName).GetValue();
                            if (!addressesString) {
                                return [];
                            }
                            return addressesString.trim().split(";");
                        };
                        elements = elements.concat(getEmailAddressesFromControl(ControlNames.ToField));
                        if (ConversationPopup.EnableEmailCCRecipients) {
                            elements = elements.concat(getEmailAddressesFromControl(ControlNames.CCField));
                        }
                    }
                    for (var i = 0; i < elements.length; i++) {
                        elements[i] = elements[i].trim();
                    }
                    return elements.filter(function (x) { return x !== ""; });
                },
                GetEmailAddressesWithInfo: function (dialog) {
                    var addresses = [];
                    if (!useQuickCustomerDisplay) {
                        var getAddressFromControl = function (control, emailRecipientType) {
                            if (control) {
                                var values_1 = control.GetValueWithInfo();
                                if (values_1) {
                                    var _loop_1 = function (v) {
                                        var value = values_1[v].value.trim();
                                        if (value) {
                                            var address_1 = { "address": value, "emailRecipientType": emailRecipientType };
                                            var keys = Object.keys(values_1[v]);
                                            keys.forEach(function (key) {
                                                address_1[key] = values_1[v][key];
                                            });
                                            addresses.push(address_1);
                                        }
                                    };
                                    for (var v = 0; v < values_1.length; v++) {
                                        _loop_1(v);
                                    }
                                }
                            }
                        };
                        getAddressFromControl(dialog.GetControl(ControlNames.ToField), "to");
                        if (ConversationPopup.EnableEmailCCRecipients) {
                            getAddressFromControl(dialog.GetControl(ControlNames.CCField), "cc");
                        }
                    }
                    return addresses;
                },
                ShouldDisplayInitConversationWarning: function () {
                    return displayInitConversationWarning && !ConversationPopup.WarningMessageAlreadyValidated[GetCustomerNumber()];
                },
                OnConversationsLoadedFinished: function (updateLastRowCallback) {
                    if (ConversationPopup.LastConversationId && ConversationPopup.NewMessage) {
                        var conversationHelper = Controls.ConversationListUI__.GetConversationHelper(ConversationPopup.LastConversationId);
                        var lastConversationId_1 = ConversationPopup.LastConversationId;
                        if (conversationHelper) {
                            conversationHelper.addItemCallback = function (fields) {
                                if (updateLastRowCallback) {
                                    updateLastRowCallback(fields, lastConversationId_1);
                                }
                            };
                            var options = {
                                emailAddress: ConversationPopup.NewMessage.emailAddress,
                                attachments: ConversationPopup.NewMessage.attachments,
                                forwardedAttaches: ConversationPopup.NewMessage.forwardedAttaches
                            };
                            conversationHelper.AddItem(ConversationPopup.NewMessage.messageObject, options);
                            ConversationPopup.NewMessage = null;
                            ConversationPopup.LastConversationId = null;
                        }
                    }
                }
            };
            return ConversationPopup;
        }
        Conversations.GetConversationPopup = GetConversationPopup;
    })(Conversations = Lib.Conversations || (Lib.Conversations = {}));
})(Lib || (Lib = {}));
