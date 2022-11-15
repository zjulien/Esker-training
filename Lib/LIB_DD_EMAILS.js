/* LIB_DEFINITION
{
    "name": "LIB_DD_EMAILS",
    "libraryType": "LIB",
    "scriptType": "SERVER",
    "comment": "DD Helpers Emails library",
    "require": [ "Sys/Sys_DD_Helpers", "Sys/Sys_Helpers", "Lib_DD_Customization_Deliveries" ]
}
*/
/**
 * @namespace Lib.DD.Emails
 */
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        var Emails;
        (function (Emails) {
            /**
             * @param {transport} email The email transport on which you want to customize the fromName
             * @param {string} fromName Name that will appear as sender on the email
             */
            function SetFromName(email, fromName) {
                if (!email || !fromName) {
                    return;
                }
                var sender = email.GetSender(true) || email.SetSender();
                sender.GetVars().AddValue_String("FromName", fromName, true);
            }
            Emails.SetFromName = SetFromName;
            /**
             * @param {transport} email The email transport on which you want to customize the fromName
             * @param {string} fromAddress Address that will appear as sender on the email
             */
            function SetFromAddress(email, fromAddress) {
                if (!email || !fromAddress) {
                    return;
                }
                email.GetUninheritedVars().AddValue_String("FromAddress", fromAddress, true);
            }
            Emails.SetFromAddress = SetFromAddress;
            /**
             * @param {string} fromCall Represents the point from which the function was called
             * @param {string} configName Name of the config used
             * @param {string} recipientId ID of the recipient
             * @return {object} the email properties
             */
            function GetEmailsProperties(fromCall) {
                var emailContext = {
                    "fromCall": fromCall.toUpperCase()
                };
                emailContext.configName = Data.GetValue("ConfigurationName__");
                emailContext.recipientId = Data.GetValue("Recipient_ID__");
                var emailsProperties = Sys.Helpers.TryCallFunction("Lib.DD.Customization.Deliveries.CustomizeEmails", emailContext);
                var senderDisplayName = Variable.GetValueAsString("Sender_displayName__");
                var senderEmail = Variable.GetValueAsString("Sender_email__");
                if (!emailsProperties && senderDisplayName && senderEmail) {
                    emailsProperties = {
                        "fromName": senderDisplayName,
                        "fromEmailAddress": senderEmail
                    };
                }
                return emailsProperties;
            }
            Emails.GetEmailsProperties = GetEmailsProperties;
            /**
             * @param {transport} email The email transport on which you want to customize the fromName & fromAddress
             * @param {object} emailProperties the emails properties given by the CustomizeEmails user exit
             */
            function SetSender(email, emailsProperties, notif) {
                if (emailsProperties) {
                    if (email && notif) {
                        var notifVars = email.GetVars();
                        if (emailsProperties.fromName) {
                            notifVars.AddValue_String("FromName", emailsProperties.fromName, true);
                        }
                        if (emailsProperties.fromEmailAddress) {
                            notifVars.AddValue_String("FromAddress", emailsProperties.fromEmailAddress, true);
                        }
                    }
                    else {
                        this.SetFromName(email, emailsProperties.fromName);
                        this.SetFromAddress(email, emailsProperties.fromEmailAddress);
                    }
                }
            }
            Emails.SetSender = SetSender;
            function GetWelcomeEmailLoginInfo(recipient) {
                var passwordUrl = recipient.passwordUrl;
                if (passwordUrl) {
                    var parametersObject = {
                        templateName: "DD_Welcome_PasswordUrl.txt",
                        replaceTags: true,
                        customTags: {
                            recipientId: recipient.recipientID,
                            passwordUrl: passwordUrl
                        }
                    };
                    return recipient.computeEmailTemplateContent(parametersObject);
                }
                return "";
            }
            Emails.GetWelcomeEmailLoginInfo = GetWelcomeEmailLoginInfo;
            function ShouldSendWelcomeEmailSeparately(deliveryMethod) {
                var concatWelcomeEmail = Sys.DD.GetParameter("ConcatWelcomeEmail");
                var alwaysSendNotification = Sys.DD.GetParameter("AlwaysSendNotification");
                var isDMPortal = deliveryMethod === "PORTAL";
                var isDMEmail = deliveryMethod === "SM";
                if (concatWelcomeEmail && !isDMEmail && !isDMPortal && !alwaysSendNotification) {
                    return true;
                }
                if (!concatWelcomeEmail) {
                    return true;
                }
                return false;
            }
            Emails.ShouldSendWelcomeEmailSeparately = ShouldSendWelcomeEmailSeparately;
            function emailProcess(config) {
                Log.Info(config.logText + config.destAddress);
                var email = Process.CreateTransport("mail", config.isChildTransport);
                var vars = email.GetUninheritedVars();
                vars.AddValue_String("EmailAddress", config.destAddress, true);
                if (config.PDFCommands) {
                    var copyStampLanguage = config.recipient.exists ? config.recipient.language : config.sender.language;
                    vars.AddValue_String("PDFCommands", "-rmsig %infile%\n" + Sys.DD.ComputeCopyStampPdfCommand(0, copyStampLanguage), true);
                }
                Sys.DD.Document.AddCommonFields(vars, config.subject, config.typeEmail, false, config.documentData, config.recipient, config.archiveDuration);
                if (Sys.DD.GetParameter("BounceBacks_Enable")) {
                    Sys.Helpers.BounceBack.SetBounceBack(email);
                }
                var customTags = {
                    recipientName: config.recipient.displayName
                };
                if (config.welcomeInformations) {
                    customTags.welcomeInformations = config.welcomeInformations;
                }
                if (config.customTags) {
                    for (var configObj in config.customTags) {
                        customTags[configObj] = config.customTags[configObj];
                    }
                }
                var paramsComputeEmailTEmplateContent = {
                    templateName: config.templateName,
                    replaceTags: true,
                    customTags: customTags
                };
                var templateContent;
                if (config.recipient.exists) {
                    templateContent = config.recipient.computeEmailTemplateContent(paramsComputeEmailTEmplateContent);
                }
                else {
                    templateContent = config.sender.computeEmailTemplateContent(paramsComputeEmailTEmplateContent);
                }
                Sys.Helpers.Attach.AttachHTML(email, config.templateName, templateContent);
                if (!config.notif) {
                    var outputFilenamePattern = Sys.DD.GetParameter("OutputFilenamePattern");
                    var attachmentName = "";
                    if (outputFilenamePattern) {
                        attachmentName = Sys.DD.Helpers.ComputeAttachmentName(outputFilenamePattern);
                    }
                    else {
                        var maindocumentAttachIndex = Sys.DD.Document.GetMainAttachmentIndex(config.documentData.ID);
                        attachmentName = Attach.GetName(maindocumentAttachIndex);
                    }
                    Sys.Helpers.Attach.AttachProcessDocument(email, attachmentName, config.mainAttachIndex);
                    // Now adding Additional attachments on email, if that is set in the wizard.
                    if (Sys.DD.GetParameter("AddAttachmentsWithEmail")) {
                        Sys.DD.Document.AttachAdditionalDocuments(email, config.mainAttachIndex);
                    }
                }
                // Add custom informations about the transport
                vars.AddValue_String("ToUser1", JSON.stringify({
                    "DD-transportType": config.transportType,
                    "DD-transportIsOriginal": config.transportIsOriginal
                }), true);
                Lib.DD.Emails.SetSender(email, config.emailsProperties);
                if (config.billing) {
                    Sys.DD.CopyBillingInfoTo(email);
                }
                Sys.Helpers.TryCallFunction("Lib.DD.Customization.Deliveries." + config.libName, email, config.callback);
                email.Process();
                if (email.GetLastError() !== 0) {
                    Variable.SetValueAsString("RoutingErrorMessage", email.GetLastErrorMessage());
                    return false;
                }
                return true;
            }
            Emails.emailProcess = emailProcess;
            function rerouteEmailProcess(rerouteEmailAddress) {
                Log.Info("rerouteEmailProcess " + rerouteEmailAddress);
                var email = Process.CreateTransport("mail");
                var vars = email.GetUninheritedVars();
                vars.AddValue_String("RerouteEmailAddress", rerouteEmailAddress, true);
                for (var iAttach = Attach.GetNbAttach() - 1; iAttach >= 0; iAttach--) {
                    var extension = Attach.GetExtension(iAttach);
                    if (extension === ".eml") {
                        var emailFrom = Attach.GetAttach(iAttach);
                        var emailVars = emailFrom.GetVars();
                        var attachOutputName = emailVars.GetValue_String("AttachOutputName", 0);
                        if (attachOutputName === "OriginalMessage" || attachOutputName.indexOf(Data.GetValue("MsnEx")) !== -1) {
                            var newattach = email.AddAttach();
                            newattach.GetVars().AddValue_String("AttachOutputFormat", ".eml", true);
                            newattach.GetVars().AddValue_String("AttachOutputName", "OriginalMessage", true);
                            newattach.SetAttachFile(emailFrom.GetAttachFile());
                            email.Process();
                            if (email.GetLastError() !== 0) {
                                Variable.SetValueAsString("RoutingErrorMessage", email.GetLastErrorMessage());
                                return false;
                            }
                            return true;
                        }
                    }
                }
                Log.Warn("OriginalMessage has not been found.");
                return false;
            }
            Emails.rerouteEmailProcess = rerouteEmailProcess;
        })(Emails = DD.Emails || (DD.Emails = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
