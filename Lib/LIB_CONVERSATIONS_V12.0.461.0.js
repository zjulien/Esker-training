/* LIB_DEFINITION{
  "name": "Lib_Conversations_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_Contacts_V12.0.461.0",
    "Sys/Sys_Helpers_Conversation"
  ]
}*/
var Lib;
(function (Lib) {
    var Conversations;
    (function (Conversations) {
        var _query = null;
        function Resetfunction() {
            if (_query) {
                _query = null;
            }
        }
        Conversations.Resetfunction = Resetfunction;
        ;
        function GetQuery() {
            if (!_query) {
                _query = Process.CreateQueryAsProcessAdmin();
            }
            else {
                _query.Reset();
            }
            return _query;
        }
        function BuildConversationInfo(settings, documentVars, recipientCompany, businessIdFieldName, businessId, conversationOptions) {
            if (!settings || !conversationOptions) {
                Log.Error("Missing settings to create non external conversation.");
                return null;
            }
            if (!settings.documentInfo) {
                if (!settings['relatedFormName'] || !settings['relatedFormIdentifierName']) {
                    Log.Error("Missing settings to create non external conversation.");
                    return null;
                }
                settings.documentInfo = {
                    processName: settings['relatedFormName'],
                    documentNumberFieldName: settings['relatedFormIdentifierName'],
                };
            }
            var documentId = settings.documentInfo.documentNumber ? settings.documentInfo.documentNumber : documentVars.GetValue_String(settings.documentInfo.documentNumberFieldName, 0);
            var conversationInfo = {
                ConversationTableName: settings.conversationTableName,
                RecipientCompany: recipientCompany,
                Options: conversationOptions,
                AdditionalProcesses: null,
                RuidEx: documentVars.GetValue_String("RUIDEX", 0),
                DocumentId: documentId,
                BusinessIdFieldName: businessIdFieldName,
                BusinessId: businessId
            };
            if (!conversationInfo.Options) {
                conversationInfo.Options = {};
            }
            if (!conversationInfo.Options.emailTemplate) {
                conversationInfo.Options.emailTemplate = settings.emailTemplateName;
            }
            return conversationInfo;
        }
        Conversations.BuildConversationInfo = BuildConversationInfo;
        function GetDocumentVars(formMsnex, processName) {
            var query = GetQuery();
            query.SetFilter("(MSNEX=" + formMsnex + ")");
            query.SetSpecificTable(processName);
            query.SetAttributesList("*");
            query.MoveFirst();
            var record = query.MoveNextRecord();
            if (record == null) {
                Log.Error("Failed retrieving related form with MSNEX = " + formMsnex);
                return null;
            }
            var vars = record.GetVars();
            if (vars == null) {
                Log.Error("Failed retrieving vars for related form with MSNEX = " + formMsnex);
                return null;
            }
            return vars;
        }
        Conversations.GetDocumentVars = GetDocumentVars;
        function GetExternalConversations(businessIdPrefix, ruidEx, conversationTableName) {
            var query = GetQuery();
            query.SetFilter("(&(documentruidex=" + ruidEx + ")(businessid=".concat(businessIdPrefix, "*)(deleted=0))"));
            query.SetSpecificTable(conversationTableName);
            query.SetAttributesList("*");
            query.MoveFirst();
            var conversationList = [];
            var record = query.MoveNextRecord();
            while (record) {
                var vars = record.GetVars();
                if (vars == null) {
                    Log.Error("Failed retrieving vars for conversation assiocated with document = " + ruidEx);
                    return null;
                }
                conversationList.push({
                    "ownerID": vars.GetValue_String("ownerid", 0),
                    "ownerPB": vars.GetValue_String("ownerpb", 0),
                    "id": vars.GetValue_String("id", 0),
                    "documentRuidex": vars.GetValue_String("documentruidex", 0),
                    "businessId": vars.GetValue_String("businessid", 0),
                    "businessIdFieldName": vars.GetValue_String("businessidfieldname", 0),
                    "recipientCompany": vars.GetValue_String("recipientcompany", 0),
                    "options": vars.GetValue_String("options", 0),
                    "documentId": vars.GetValue_String("documentid", 0)
                });
                record = query.MoveNextRecord();
            }
            return conversationList;
        }
        Conversations.GetExternalConversations = GetExternalConversations;
        function SetExternalContributors(FCI_KeyValues, emailAddress, displayName) {
            FCI_KeyValues["externalContributorId"] = emailAddress;
            FCI_KeyValues["externalContributorDisplayName"] = displayName;
        }
        function CreateConversation(conversationSettings, documentMsnex, messageText, messageSubject, recipientEmailAddress, recipientDisplayName, businessIdPrefix, //ex: "SDACONV__" for SDA
        businessIdFieldName, //ex: "custom"
        conversationOptions) {
            if (!conversationSettings || !conversationSettings.documentInfo || !documentMsnex || !businessIdFieldName || !conversationOptions) {
                return false;
            }
            var documentVars = this.GetDocumentVars(documentMsnex, conversationSettings.documentInfo.processName);
            if (!documentVars) {
                Log.Error("unable to retrieve document vars during conversation creation for document " + documentMsnex);
                return false;
            }
            var conversationInfo = this.BuildConversationInfo(conversationSettings, documentVars, recipientEmailAddress, businessIdFieldName, businessIdPrefix + recipientEmailAddress, conversationOptions);
            if (conversationInfo == null) {
                return false;
            }
            var conversationId = Conversation.Create(conversationInfo);
            var conversationFields = {
                Message: messageText,
                Subject: messageSubject,
                Type: "10"
            };
            if (Sys.Helpers.Conversation.PrepareKeyValuePairsForItem) {
                var useIncomingEmailInformation = conversationOptions.useIncomingEmailInformation;
                Sys.Helpers.Conversation.PrepareKeyValuePairsForItem(conversationFields, recipientEmailAddress, recipientDisplayName, useIncomingEmailInformation, SetExternalContributors);
            }
            Conversation.AddItem(conversationSettings.conversationTableName, conversationFields, conversationInfo.Options, conversationId, conversationInfo.BusinessId, conversationInfo.BusinessIdFieldName, conversationInfo.RuidEx);
            return true;
        }
        Conversations.CreateConversation = CreateConversation;
        function TransformExternalConversations(firstConversationSettings, secondConversationSettings, firstRuidex, secondRuidex, firstBusinessIdFieldName, secondBusinessIdFieldName, firstDocumentConversationOptions, secondDocumentConversationOptions, firstBusinessIdPrefix) {
            if (!firstConversationSettings || !firstConversationSettings.documentInfo
                || !secondConversationSettings || !secondConversationSettings.documentInfo) {
                Log.Error("TransformExternalConversations bad arguments");
                return false;
            }
            var firstDocumentMsnex;
            var secondDocumentMsnex;
            var firstProcessName;
            var secondProcessName;
            var pos = firstRuidex.lastIndexOf(".");
            if (!(pos == -1)) {
                firstProcessName = firstRuidex.substring(0, pos);
                firstDocumentMsnex = firstRuidex.substring(pos + 1);
            }
            else {
                Log.Error("Bad first RuidEx", firstRuidex);
                return false;
            }
            pos = secondRuidex.lastIndexOf(".");
            if (!(pos == -1)) {
                secondProcessName = secondRuidex.substring(0, pos);
                secondDocumentMsnex = secondRuidex.substring(pos + 1);
            }
            else {
                Log.Error("Bad second RuidEx", secondRuidex);
                return false;
            }
            var firstDocumentVars = this.GetDocumentVars(firstDocumentMsnex, firstProcessName);
            if (!firstDocumentVars) {
                return false;
            }
            var secondDocumentVars = this.GetDocumentVars(secondDocumentMsnex, secondProcessName);
            if (!secondDocumentVars) {
                return false;
            }
            var firstOwnerId = firstDocumentVars.GetValue_String("OwnerID", 0);
            var firstOwnerPb = firstDocumentVars.GetValue_String("OwnerPB", 0);
            var firstDocumentOwner = Users.GetUserAsProcessAdmin(firstOwnerId);
            if (!firstDocumentOwner) {
                return false;
            }
            var secondDocumentOwner = Users.GetUserAsProcessAdmin(secondDocumentVars.GetValue_String("OwnerID", 0));
            if (!secondDocumentOwner) {
                return false;
            }
            var firstConversationInfo = this.BuildConversationInfo(firstConversationSettings, firstDocumentVars, secondDocumentOwner.GetValue("Company"), firstBusinessIdFieldName, firstDocumentOwner.GetValue("AccountId"), firstDocumentConversationOptions);
            var secondConversationInfo = this.BuildConversationInfo(secondConversationSettings, secondDocumentVars, firstDocumentOwner.GetValue("Company"), secondBusinessIdFieldName, secondDocumentOwner.GetValue("BUSINESSPARTNERID"), secondDocumentConversationOptions);
            if (!firstConversationInfo || !secondConversationInfo) {
                return false;
            }
            firstConversationInfo.Options.OwnerID = firstOwnerId;
            firstConversationInfo.Options.OwnerPB = firstOwnerPb;
            var conversations = this.GetExternalConversations(firstBusinessIdPrefix, firstConversationInfo.RuidEx, firstConversationSettings.conversationTableName);
            for (var i = 0; i < conversations.length; i++) {
                var displayName = this.GetDisplayNameFromConversationOption(conversations[i]);
                var contactUser = Lib.Contacts.GetOrCreateContactUser(firstConversationInfo.BusinessId, conversations[i].recipientCompany, secondConversationInfo.BusinessId, firstConversationInfo.RecipientCompany, firstConversationSettings.contactTemplateName, firstConversationSettings.contactTypeName, displayName);
                var conversationOptions = null;
                try {
                    conversationOptions = JSON.parse(conversations[i].options);
                }
                catch (err) {
                    Log.Error("Failed to parse conversation options");
                }
                if (contactUser !== null) {
                    secondConversationInfo.Options.OwnerID = contactUser.GetValue("FullDn");
                    secondConversationInfo.Options.OwnerPB = contactUser.GetValue("OwnerPB");
                    secondConversationInfo.Options.recipientBlackList = secondConversationInfo.Options.recipientBlackList || [];
                    secondConversationInfo.Options.recipientBlackList.push(secondConversationInfo.Options.OwnerID);
                    if (conversationOptions && conversationOptions.emailSubject) {
                        firstConversationInfo.Options.emailSubject = conversationOptions.emailSubject;
                        secondConversationInfo.Options.emailSubject = conversationOptions.emailSubject;
                    }
                    firstConversationInfo.Options.emailAddress = conversations[i].recipientCompany;
                    Conversation.TransformExternal(conversations[i].id, firstConversationInfo, secondConversationInfo);
                }
                else {
                    Log.Error("contactUser could not be retrieved or created for conversation id : " + conversations[i].id);
                }
            }
            return true;
        }
        Conversations.TransformExternalConversations = TransformExternalConversations;
        function GetDisplayNameFromConversationOption(conversation) {
            if (!conversation.options) {
                return null;
            }
            try {
                var optionsObject = JSON.parse(conversation.options);
                if (optionsObject.externalContributors) {
                    for (var key in optionsObject.externalContributors) {
                        var contributor = optionsObject.externalContributors[key];
                        if (contributor.displayName) {
                            return contributor.displayName;
                        }
                    }
                }
            }
            catch (e) {
                Log.Error("GetDisplayNameFromConversationOption could not parse conversation options");
            }
            return null;
        }
        Conversations.GetDisplayNameFromConversationOption = GetDisplayNameFromConversationOption;
    })(Conversations = Lib.Conversations || (Lib.Conversations = {}));
})(Lib || (Lib = {}));
