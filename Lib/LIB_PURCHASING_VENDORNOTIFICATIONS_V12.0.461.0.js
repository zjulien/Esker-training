///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_VendorNotifications_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing library managing vendor notifications",
  "require": [
    "Sys/Sys_Parameters",
    "Sys/Sys_Helpers",
    "Sys/Sys_EmailNotification",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_OrderNotifications_V12.0.461.0",
    "[Lib_VendorPortal_Customization_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var VendorNotifications;
        (function (VendorNotifications) {
            function CreateNotifToVendor(vendor, template, editMode) {
                var customTag = null;
                var vendorEmail = Data.GetValue("VendorEmail__");
                var emailAddress = Lib.P2P.computeVendorEmailRedirection(vendorEmail);
                if (editMode) {
                    vendorEmail = vendor;
                    if (Sys.Helpers.IsEmpty(vendorEmail)) // The notification is sent by "Custer Order" Extraction Script
                     {
                        return null;
                    }
                }
                else {
                    var msg = "".concat(Language.Translate("_SentTo"), " : ").concat(emailAddress);
                    customTag = Lib.Purchasing.OrderNotifications.InitCustomTag(Data.GetValue("BuyerComment__"), msg);
                    Lib.Purchasing.VendorNotifications.AddConversationItem(msg, Lib.Purchasing.ConversationTypes.Dialog);
                    if (Sys.Helpers.IsEmpty(vendorEmail) || vendor) // The notification is sent by "Custer Order" Extraction Script
                     {
                        return null;
                    }
                }
                // FT-009990: The language used by default for the email notif should be the language of the vendor contact first and then (if not well defined), the language of the buyer
                var userId = Data.GetValue("OwnerId");
                Sys.GenericAPI.PromisedQuery({
                    table: "ODUSER",
                    filter: "EMAILADDRESS=" + vendorEmail,
                    attributes: ["LOGIN"],
                    maxRecords: 1,
                    additionalOptions: { queryOptions: "FastSearch=1" }
                })
                    .Then(function (queryResult) {
                    if (queryResult.length > 0) {
                        userId = queryResult[0].LOGIN;
                    }
                });
                var emailOptions = {
                    emailAddress: emailAddress,
                    userId: userId,
                    subject: null,
                    template: template,
                    customTags: customTag
                };
                var doSendNotif = Sys.Helpers.TryCallFunction("Lib.VendorPortal.Customization.OnSendVendorNotification", emailOptions);
                if (doSendNotif !== false) {
                    var email = Sys.EmailNotification.CreateEmail(emailOptions);
                    var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    var CcEmailAddress = currentUser.GetValue("EmailAddress");
                    CcEmailAddress += "\n";
                    CcEmailAddress += Data.GetValue("EmailCarbonCopy__");
                    Lib.Purchasing.OrderNotifications.SetCcEmailAddress(email, CcEmailAddress);
                    return email;
                }
                return null;
            }
            VendorNotifications.CreateNotifToVendor = CreateNotifToVendor;
            function SendNotifForCOCreation() {
                var currUser = Users.GetUser(Variable.GetValueAsString("VendorLogin"));
                var buyerComment = Variable.GetValueAsString("BuyerComment__");
                var customTag = Lib.Purchasing.OrderNotifications.InitCustomTag(buyerComment);
                var curProcessRuid = Data.GetValue("RuidEx");
                customTag.PortalUrl = currUser.GetProcessURL(curProcessRuid, true);
                customTag.BuyerName__ = Variable.GetValueAsString("BuyerName__");
                var redirectionAddress = Lib.P2P.computeVendorEmailRedirection();
                var emailOptions = {
                    user: currUser,
                    emailAddress: redirectionAddress,
                    template: "Purchasing_Email_NotifVendorPortal.htm",
                    customTags: customTag,
                    escapeCustomTags: false,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                };
                var doSendNotif = Sys.Helpers.TryCallFunction("Lib.VendorPortal.Customization.OnSendVendorNotification", emailOptions);
                if (doSendNotif !== false) {
                    var email = Sys.EmailNotification.CreateEmailWithUser(emailOptions);
                    Lib.Purchasing.OrderNotifications.SetCcEmailAddress(email, Variable.GetValueAsString("EmailCarbonCopy__"));
                    if (Sys.Parameters.GetInstance("PAC").GetParameter("AlwaysAttachPurchaseOrder") === "1") {
                        Lib.Purchasing.OrderNotifications.AddAttachments(email, false);
                    }
                    Sys.EmailNotification.SendEmail(email);
                }
            }
            VendorNotifications.SendNotifForCOCreation = SendNotifForCOCreation;
            /**
             * Add a message intended for vendor to a conversation
             * Overload Lib.Purchasing.AddConversationItem to enforce specific vendor parameters:
             *  - enable/disable email notification through user exi
             *  - retrieve vendor email redirection if any
             */
            function AddConversationItem(msg, type, orderNumber, asUser) {
                var doSendNotif = Sys.Helpers.TryCallFunction("Lib.VendorPortal.Customization.OnSendVendorConversationNotification", msg, type);
                var redirectionAddress = Lib.P2P.computeVendorEmailRedirection();
                Lib.Purchasing.AddConversationItem(msg, type, doSendNotif !== false, orderNumber, asUser, redirectionAddress);
            }
            VendorNotifications.AddConversationItem = AddConversationItem;
        })(VendorNotifications = Purchasing.VendorNotifications || (Purchasing.VendorNotifications = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
