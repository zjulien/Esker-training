///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_P2P_CONVERSATION_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "P2P library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_P2P_V12.0.461.0"
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
            var Options;
            (function (Options) {
                function GetPurchaseOrder(emailCustomTags) {
                    return {
                        // addPreviousMessageTags: true,
                        allowAttachments: false,
                        emailCustomTags: emailCustomTags,
                        emailOptionsAppliedToCurrentParty: true,
                        emailTemplate: "Conversation_MissedPurchasingItem.htm",
                        notifyByEmail: true,
                        notifyOnlyRecipient: true
                    };
                }
                Options.GetPurchaseOrder = GetPurchaseOrder;
                function GetCustomerOrder(emailCustomTags, doSendNotif) {
                    return {
                        // addPreviousMessageTags: true,
                        allowAttachments: false,
                        emailCustomTags: emailCustomTags,
                        emailOptionsAppliedToCurrentParty: true,
                        emailTemplate: "Conversation_MissedPurchasingItem.htm",
                        notifyByEmail: doSendNotif,
                        notifyOnlyRecipient: true
                    };
                }
                Options.GetCustomerOrder = GetCustomerOrder;
                function GetVendorRegistrationForInternalUser(emailCustomTags) {
                    return {
                        // addPreviousMessageTags: true,
                        allowAttachments: true,
                        emailCustomTags: emailCustomTags,
                        emailOptionsAppliedToCurrentParty: true,
                        emailTemplate: "AP-Vendor_RegistrationConversationInternal.htm",
                        ignoreDocumentOwner: true,
                        notifyByEmail: true,
                        notifyOnlyRecipient: true
                    };
                }
                Options.GetVendorRegistrationForInternalUser = GetVendorRegistrationForInternalUser;
                function GetVendorRegistrationForVendorUser(emailCustomTags) {
                    return {
                        // addPreviousMessageTags: true,
                        allowAttachments: true,
                        emailCustomTags: emailCustomTags,
                        emailOptionsAppliedToCurrentParty: true,
                        emailTemplate: "AP-Vendor_RegistrationConversationVendor.htm",
                        ignoreDocumentOwner: true,
                        notifyByEmail: true,
                        notifyOnlyRecipient: true
                    };
                }
                Options.GetVendorRegistrationForVendorUser = GetVendorRegistrationForVendorUser;
                function GetVendorStatementMatchingForInternalUser(emailCustomTags) {
                    return {
                        emailOptionsAppliedToCurrentParty: true,
                        addPreviousMessageTags: true,
                        allowAttachments: true,
                        emailCustomTags: emailCustomTags,
                        emailTemplate: "AP-Vendor_RegistrationConversationInternal.htm",
                        ignoreDocumentOwner: true,
                        notifyByEmail: true,
                        notifyOnlyRecipient: true
                    };
                }
                Options.GetVendorStatementMatchingForInternalUser = GetVendorStatementMatchingForInternalUser;
                function GetVendorStatementMatchingForVendorUser() {
                    return {
                        emailOptionsAppliedToCurrentParty: true,
                        addPreviousMessageTags: true,
                        allowAttachments: true,
                        emailTemplate: "AP-Vendor_StatementConversationVendor.htm",
                        ignoreDocumentOwner: true,
                        notifyByEmail: true,
                        notifyOnlyRecipient: true
                    };
                }
                Options.GetVendorStatementMatchingForVendorUser = GetVendorStatementMatchingForVendorUser;
                /**
                 * Used for Return Order and Return Order Vendor
                 */
                function GetReturnOrder() {
                    return {
                        emailOptionsAppliedToCurrentParty: true,
                        ignoreIfExists: false,
                        notifyAllUsersInGroup: true,
                        notifyByEmail: true
                    };
                }
                Options.GetReturnOrder = GetReturnOrder;
                /**
                 * Used for Advanced Shipping Notice and Advanced Shipping Notice Vendor
                 */
                function GetAdvancedShippingNotice() {
                    return {
                        emailOptionsAppliedToCurrentParty: true,
                        ignoreIfExists: false,
                        notifyAllUsersInGroup: true,
                        notifyByEmail: true
                    };
                }
                Options.GetAdvancedShippingNotice = GetAdvancedShippingNotice;
                /**
                 * Used for Vendor Invoice and Customer Invoice
                 */
                function GetInvoice() {
                    return {
                        //addPreviousMessageTags: true,
                        allowAttachments: true,
                        notifyAllUsersInGroup: true,
                        emailOptionsAppliedToCurrentParty: true,
                        notifyByEmail: true,
                        notifyOnlyRecipient: true
                    };
                }
                Options.GetInvoice = GetInvoice;
            })(Options = Conversation.Options || (Conversation.Options = {}));
            Conversation.TableName = "Conversation__";
            Conversation.BusinessIdFieldName = {
                BusinessPartnerId: "BusinessPartnerId",
                AccountId: "account_id",
                OwnerId: "OwnerId"
            };
        })(Conversation = P2P.Conversation || (P2P.Conversation = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
