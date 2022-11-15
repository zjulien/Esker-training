///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_OrderNotifications_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing library managing Order Notifications",
  "require": [
    "Sys/Sys_Parameters",
    "Sys/Sys_Helpers",
    "Sys/Sys_EmailNotification",
    "Lib_P2P_Export_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var OrderNotifications;
        (function (OrderNotifications) {
            function InitCustomTag(buyerComment, msg) {
                if (msg === void 0) { msg = null; }
                var customTag = null;
                if (buyerComment.length > 0) {
                    customTag = {
                        "AdditionalMessage_START__": "",
                        "AdditionalMessage_END__": "",
                        "PortalUrl": "www.esker.fr",
                        "BuyerName__": Data.GetValue("BuyerName__")
                    };
                    customTag.AdditionalMessage = buyerComment;
                    if (msg) {
                        msg += "\r\n\r\n" + buyerComment;
                    }
                }
                else {
                    customTag = {
                        "AdditionalMessage_START__": "<!--",
                        "AdditionalMessage_END__": "-->"
                    };
                }
                return customTag;
            }
            OrderNotifications.InitCustomTag = InitCustomTag;
            /**
             * Attaches PO attachments to the email transport
             * @param {xTransport} email the email transport to attach the files to
             * @returns {void}
             */
            function AddAttachments(email, firstAttachmentOnly) {
                var sendAttachments = Sys.Parameters.GetInstance("PAC").GetParameter("SendPOAttachments") === true;
                var nbAttach = firstAttachmentOnly ? 1 : Attach.GetNbAttach();
                for (var i = 0; i < nbAttach; i++) {
                    var attachFile = Attach.GetConvertedFile(i) || Attach.GetInputFile(i);
                    if (attachFile) {
                        var type = Attach.GetValue(i, "Purchasing_DocumentType");
                        var name = Attach.GetName(i);
                        if (type === "PO") {
                            Log.Info("Attaching PO " + i + " to vendor notif: " + name);
                            Sys.EmailNotification.AddAttach(email, attachFile, Lib.P2P.Export.GetName("PO", "OrderNumber__", parseInt(Attach.GetValue(i, "Purchasing_DocumentRevisionVersion"), 10)));
                        }
                        else if (type !== "CSV" && sendAttachments) {
                            Log.Info("Attaching attachment " + i + " to vendor notif: " + name);
                            Sys.EmailNotification.AddAttach(email, attachFile, name);
                        }
                    }
                }
            }
            OrderNotifications.AddAttachments = AddAttachments;
            function SetCcEmailAddress(email, CcEmailAddress) {
                if (!Sys.Helpers.IsEmpty(CcEmailAddress)) {
                    CcEmailAddress = CcEmailAddress.split("\n").join(";");
                    Sys.EmailNotification.AddCC(email, CcEmailAddress, true);
                }
            }
            OrderNotifications.SetCcEmailAddress = SetCcEmailAddress;
        })(OrderNotifications = Purchasing.OrderNotifications || (Purchasing.OrderNotifications = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
