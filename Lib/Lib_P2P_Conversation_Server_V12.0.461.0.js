///#GLOBALS Lib
/* LIB_DEFINITION{
  "name": "LIB_P2P_CONVERSATION_SERVER_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "P2P library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_P2P_Conversation_V12.0.461.0"
  ]
}*/
/**
 * Common P2P functions for conversations
 * @namespace Lib.P2P.Conversation
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Conversation;
        (function (Conversation) {
            function GetBusinessInfoFromVendorUser(vendor) {
                return {
                    Company: vendor.GetValue("Company"),
                    BusinessId: P2P.GetShortLoginFromUser(vendor),
                    BusinessIdFieldName: Lib.P2P.Conversation.BusinessIdFieldName.BusinessPartnerId,
                    OwnerID: vendor.GetValue("FullDn"),
                    OwnerPB: vendor.GetValue("OwnerPB")
                };
            }
            Conversation.GetBusinessInfoFromVendorUser = GetBusinessInfoFromVendorUser;
            function GetBusinessInfoFromInternalUser(user) {
                return {
                    Company: user.GetValue("Company"),
                    BusinessId: "",
                    BusinessIdFieldName: Lib.P2P.Conversation.BusinessIdFieldName.OwnerId,
                    OwnerID: user.GetValue("FullDn"),
                    OwnerPB: user.GetValue("OwnerPB")
                };
            }
            Conversation.GetBusinessInfoFromInternalUser = GetBusinessInfoFromInternalUser;
            /**
             * This method create a one-way conversation (other sides can be created later)
             */
            function InitConversationInfo(options, ruidEx, conversationId) {
                var extendedOptions = Sys.Helpers.Extend(true, {}, options);
                var redirectionPortalUserAddress = Lib.P2P.computeVendorEmailRedirection();
                if (redirectionPortalUserAddress) {
                    extendedOptions.portalUserRedirectionEmailAddress = redirectionPortalUserAddress;
                }
                var conversationInfo = {
                    Options: extendedOptions
                };
                if (ruidEx) {
                    conversationInfo.RuidEx = ruidEx;
                }
                if (conversationId) {
                    conversationInfo.ConversationID = conversationId;
                }
                return conversationInfo;
            }
            Conversation.InitConversationInfo = InitConversationInfo;
            function ExtendConversationWithBusinessInfo(conversationInfo, businessInfo) {
                var extendedConversationInfo = { Options: {} };
                extendedConversationInfo.Options.OwnerID = businessInfo.OwnerID;
                extendedConversationInfo.Options.OwnerPB = businessInfo.OwnerPB;
                extendedConversationInfo.BusinessId = businessInfo.BusinessId;
                extendedConversationInfo.BusinessIdFieldName = businessInfo.BusinessIdFieldName;
                extendedConversationInfo.RecipientCompany = businessInfo.RecipientCompany;
                return Sys.Helpers.Extend(true, {}, conversationInfo, extendedConversationInfo);
            }
            Conversation.ExtendConversationWithBusinessInfo = ExtendConversationWithBusinessInfo;
        })(Conversation = P2P.Conversation || (P2P.Conversation = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
