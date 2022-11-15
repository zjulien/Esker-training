///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_P2P_CONVERSATION_CLIENT_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "P2P library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_P2P_Conversation_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_String"
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
            Conversation.defaultOptions = {
                gatherMessagesOfGroups: [],
                allowAttachments: true
            };
            function ExtendConversationInfoWithBusinessInfo(conversationInfo, fromUser) {
                return Sys.Helpers.Extend({}, conversationInfo, fromUser ? {
                    BusinessId: fromUser.BusinessId,
                    BusinessIdFieldName: fromUser.BusinessIdFieldName
                } : {});
            }
            Conversation.ExtendConversationInfoWithBusinessInfo = ExtendConversationInfoWithBusinessInfo;
            /**
            * This method create a one-way conversation (other sides can be created later)
            */
            function InitPartyInfo(options, ruidEx, conversationId) {
                var extendedOptions = Sys.Helpers.Extend(true, {}, options);
                var redirectionPortalUserAddress = Lib.P2P.computeVendorEmailRedirection();
                if (redirectionPortalUserAddress) {
                    extendedOptions.portalUserRedirectionEmailAddress = redirectionPortalUserAddress;
                }
                var partyInfo = {
                    Options: extendedOptions
                };
                if (ruidEx) {
                    partyInfo.RuidEx = ruidEx;
                }
                if (conversationId) {
                    partyInfo.ConversationID = conversationId;
                }
                return partyInfo;
            }
            Conversation.InitPartyInfo = InitPartyInfo;
            function ExtendPartyWithVendorBusinessInfo(partyInfo, businessInfo) {
                var extendedPartyInfo = {};
                // On client side, businessId is compute from OwnerLogin
                extendedPartyInfo.BusinessIdFieldName = businessInfo.BusinessIdFieldName;
                extendedPartyInfo.OwnerLogin = businessInfo.OwnerLogin;
                extendedPartyInfo.RecipientCompany = businessInfo.RecipientCompany;
                return Sys.Helpers.Extend({}, partyInfo, extendedPartyInfo);
            }
            Conversation.ExtendPartyWithVendorBusinessInfo = ExtendPartyWithVendorBusinessInfo;
            function GetBusinessInfoFromUser(user) {
                if (user.isVendor) {
                    return {
                        BusinessIdFieldName: Lib.P2P.Conversation.BusinessIdFieldName.BusinessPartnerId,
                        BusinessId: user.loginId // if multiple users, businessId should be businessPartnerId
                    };
                }
                return {
                    BusinessIdFieldName: Lib.P2P.Conversation.BusinessIdFieldName.OwnerId,
                    BusinessId: "" // Empty, businessId is computed from ownerId
                };
            }
            Conversation.GetBusinessInfoFromUser = GetBusinessInfoFromUser;
        })(Conversation = P2P.Conversation || (P2P.Conversation = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
