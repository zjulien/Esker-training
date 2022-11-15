///#GLOBALS Lib Sys
/// <reference path="../../AP/Vendor Invoice Processing/typings_withDeleted/Controls_AP_VIP/index.d.ts"/>
// Sys_EmailNotification is optional, so it is loaded only on server side
/* LIB_DEFINITION{
  "name": "Lib_AP_WorkflowCtrl_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Lib_ERP_Invoice_V12.0.461.0",
    "Lib_AP_V12.0.461.0",
    "[Sys/Sys_PushNotification]",
    "Lib_AP_Comment_Helper_V12.0.461.0",
    "Lib_ERP_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_P2P_Managers_V12.0.461.0",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_WorkflowController",
    "Sys/Sys_helpers_date",
    "Sys/Sys_WorkflowEngine",
    "[Lib_Workflow_Customization_Common]",
    "[Lib_AP_Customization_Common]",
    "Lib_Parameters_P2P_V12.0.461.0",
    "[Sys/Sys_EmailNotification]",
    "[Lib_AP_Extraction_V12.0.461.0]",
    "[Lib_AP_Customization_HTMLScripts]",
    "LIB_AP_ANOMALYDETECTION_V12.0.461.0",
    "Lib_P2P_Conversation_V12.0.461.0",
    "[Lib_AP_Customization_Validation]"
  ]
}*/
var Lib;
(function (Lib) {
    var g = Sys.Helpers.Globals;
    var AP;
    (function (AP) {
        /**
        * @namespace Lib.AP.WorkflowCtrl
        */
        var WorkflowCtrl;
        (function (WorkflowCtrl) {
            WorkflowCtrl.NotificationCtrl = {
                GetCustomTags: function (fullName, approver) {
                    var approverVars = approver.GetVars();
                    var approverLanguage = approverVars.GetValue_String("Language", 0);
                    var labelNetAmount = Language.TranslateInto("_Net amount", approverLanguage, false);
                    if (labelNetAmount === "_Net amount") {
                        labelNetAmount = Language.TranslateInto("_Net amount", "EN", false);
                    }
                    var exception = Data.GetValue("CurrentException__");
                    if (exception) {
                        exception = " (" + exception + ")";
                    }
                    var validationURL = Data.GetValue("ValidationUrl");
                    var autoValidationURL = "";
                    if (Sys.Parameters.GetInstance("AP").GetParameter("WorkflowEnableAutoApproveFromNotifications", "1") === "1") {
                        autoValidationURL = Process.GetProcessActionURL(Data.GetValue("ruidex"), "approve|submitAutomatically", "approvalConfirmation");
                    }
                    var SSO_URL = Sys.Parameters.GetInstance("P2P").GetParameter("SSO_URL", null);
                    if (!Sys.Helpers.IsEmpty(SSO_URL)) {
                        validationURL = SSO_URL + "&ReturnUrl=" + encodeURIComponent(validationURL);
                        autoValidationURL = autoValidationURL ? SSO_URL + "&ReturnUrl=" + encodeURIComponent(autoValidationURL) : "";
                    }
                    return {
                        "ApproverDisplayName": fullName,
                        "InvoiceNumber": Data.GetValue("InvoiceNumber__"),
                        "VendorName": Data.GetValue("VendorName__"),
                        "InvoiceAmount": approver.GetFormattedNumber(Data.GetValue("NetAmount__")),
                        "Currency": Data.GetValue("InvoiceCurrency__"),
                        "LabelNetAmount": labelNetAmount,
                        "ValidationUrl": validationURL,
                        "AutoValidationUrl": autoValidationURL,
                        "Exception": exception
                    };
                },
                EmailNotifyContributor: function (userStep) {
                    var template = "AP-PaymentApproval.htm";
                    var subject = "An invoice is waiting for payment approval.";
                    if (userStep.role === Lib.AP.WorkflowCtrl.roles.controller) {
                        template = "AP-Review.htm";
                        subject = "An invoice is waiting for review.";
                    }
                    var contributor = Lib.AP.WorkflowCtrl.usersObject.GetUser(userStep.login);
                    if (contributor) {
                        if (Sys.ScriptInfo.IsServer()) {
                            var tags = this.GetCustomTags(userStep.name, contributor);
                            var email = Sys.EmailNotification.CreateEmailWithUser({
                                user: contributor,
                                subject: subject,
                                template: template,
                                customTags: tags,
                                escapeCustomTags: true,
                                backupUserAsCC: true,
                                sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                            });
                            if (email) {
                                var approverLanguage = contributor.GetVars().GetValue_String("Language", 0);
                                Sys.EmailNotification.AddSender(email, "notification@eskerondemand.com", Language.TranslateInto("Esker Accounts payable", approverLanguage, false));
                                Sys.EmailNotification.SendEmail(email);
                            }
                        }
                    }
                    else {
                        Log.Warn("contributor with login '" + userStep.login + "' not found");
                    }
                },
                NotifyContributorOnMobile: function (userStep) {
                    var contributor = Lib.AP.WorkflowCtrl.usersObject.GetUser(userStep.login);
                    if (contributor) {
                        if (Sys.ScriptInfo.IsServer()) {
                            var tags = this.GetCustomTags(userStep.name, contributor);
                            // Send push notifications if enabled
                            if (Process.GetProcessDefinition().PushNotification === true) {
                                // to check
                                var pushNotificationType = (Sys.Parameters.GetInstance("AP").GetParameter("PushNotificationType", "") ||
                                    Sys.Parameters.GetInstance("P2P").GetParameter("PushNotificationType", "") ||
                                    "").toLowerCase();
                                Log.Info("Sending " + pushNotificationType + " push notification");
                                if (pushNotificationType === "short" || pushNotificationType === "full") {
                                    Sys.PushNotification.SendNotifToUser({
                                        user: contributor,
                                        id: pushNotificationType === "short" ? Process.GetProcessID() : Data.GetValue("ruidex"),
                                        template: "AP-PushNotif_Review_" + pushNotificationType + ".txt",
                                        customTags: tags,
                                        sendToBackupUser: true
                                    });
                                }
                            }
                        }
                    }
                },
                NotifyEndOfContributionOnMobile: function (userStep) {
                    if (Sys.ScriptInfo.IsServer()) {
                        // On mobile, only apprvers and reviewers can approve the invoice
                        if (userStep.role === Lib.AP.WorkflowCtrl.roles.approver || userStep.role === Lib.AP.WorkflowCtrl.roles.controller) {
                            // Send push notifications if enabled
                            if (Process.GetProcessDefinition().PushNotification === true) {
                                var contributor = Lib.AP.WorkflowCtrl.usersObject.GetUser(userStep.login);
                                if (contributor) {
                                    Log.Info("Notifying the end of approval contribution step on mobile. A silent push notif will be sent to: ".concat(userStep.login, " (and backup user if needed)"));
                                    Sys.PushNotification.SendNotifToUser({
                                        user: contributor,
                                        id: Data.GetValue("ruidex"),
                                        sendToBackupUser: true,
                                        silent: true
                                    });
                                }
                            }
                        }
                    }
                }
            };
            WorkflowCtrl.ExpirationHelper = {
                ResetValidity: function (startDate, monthsToAdd) {
                    if (monthsToAdd === void 0) { monthsToAdd = 16; }
                    // Set the ValidityDateTime as in the extraction script (SubmitDateTime + 16 months)
                    if (!startDate) {
                        startDate = Data.GetValue("SubmitDateTime");
                    }
                    var validityDT = startDate;
                    validityDT.setMonth(validityDT.getMonth() + monthsToAdd);
                    Data.SetValue("ValidityDateTime", validityDT);
                    Process.SetAutoValidateOnExpiration(true);
                },
                OnExpiration: function (sequenceStep, actionName) {
                    if (actionName === "clearingTimeout") {
                        addToWorkflow(sequenceStep, workflowUIParameters.actions.ERPIntegrationError.GetName(), "_Clearing creation in timeout", true, Language.CreateLazyTranslation("_Clearing error"), function (currentContributorName, currentActions, contributionData) {
                            Lib.AP.CommentHelper.AddLine(Language.Translate("_Clearing error"), Language.Translate("_Clearing creation in timeout"));
                        });
                    }
                    else if (Lib.AP.ERPAcknowledgment.IsWaitingForERPAcknowledgment()) {
                        this.ResetValidity();
                        // No pending transaction
                        Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                        ERPIntegrationHelper.SetInvoiceInTimeout();
                        addToWorkflow(sequenceStep, workflowUIParameters.actions.ERPIntegrationError.GetName(), "_ERP integration in timeout", true, Language.CreateLazyTranslation("_ERP posting error"), function (currentContributorName, currentActions, contributionData) {
                            if (currentActions) {
                                var touchless = Data.GetValue("TouchlessDone__");
                                // remove this
                                Lib.AP.CommentHelper.AddLine(Language.TranslateLazyTranslation(currentActions), Lib.AP.CommentHelper.GetReliableComment(), touchless ? null : currentContributorName);
                            }
                            Lib.AP.CommentHelper.AddLine(Language.Translate("_ERP posting error"), Data.GetValue("ERPPostingError__"));
                        });
                    } // If we reach the end of the validity, we enter a 6-months "grace period" by setting the Variable IsExtendedValidityPeriod
                    else if (Variable.GetValueAsString("IsExtendedValidityPeriod") !== "true") {
                        this.ResetValidity(new Date(), 6);
                        Variable.SetValueAsString("IsExtendedValidityPeriod", "true");
                        var invoiceStatus = Data.GetValue("InvoiceStatus__");
                        switch (invoiceStatus) {
                            case Lib.AP.InvoiceStatus.OnHold:
                                Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApprove);
                                Data.SetValue("AsideReason__", "");
                                break;
                            case Lib.AP.InvoiceStatus.SetAside:
                                Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToVerify);
                                Data.SetValue("AsideReason__", "");
                                break;
                            default:
                                break;
                        }
                        addToWorkflow(sequenceStep, workflowUIParameters.actions.inactivity.GetName(), "", false, Language.CreateLazyTranslation("_Inactivity"), function (currentContributorName, currentActions, contributionData) {
                            Lib.AP.CommentHelper.AddLine(Language.Translate("_Inactivity"), "");
                        });
                    }
                    else // Else, the variable IsExtendedValidityPeriod is set, it means the "grace period" already happened, so the invoice is expired
                     {
                        Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.Expired);
                        var contributionData = getContributionData(sequenceStep, workflowUIParameters.actions.expiration.GetName(), null, {
                            action: Language.CreateLazyTranslation("_Expiration"),
                            reason: "",
                            noUser: true
                        });
                        Lib.AP.CommentHelper.AddLine(Language.Translate("_Expiration"), "");
                        Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributionData);
                        Data.SetValue("State", 100);
                    }
                    // Expiration can happen because:
                    // - ERP Ack timeout
                    // - The validityDateTime was not properly reset due to a script exception.
                    // - The invoice has reach the 16 months timeout
                    // - The invoice has reach the 6 month extended validity timeout
                    // - In vendor invoice clearing: no clearing received from SAP, timeout
                    // In all cases prevent approval to avoid the form to end in success.
                    // It will end in error in the next pass in case of a real expiration.
                    Process.PreventApproval();
                }
            };
            /**
            * Helper for ERP integration functions
            **/
            var ERPIntegrationHelper = {
                /**
                * This function put the invoice in a waiting state for ERP integration.
                **/
                WaitForERPIntegration: function () {
                    Log.Info("Lib.AP.WorkflowCtrl - WaitForERPAck");
                    // Add an expiration timeout
                    var validityDate = new Date();
                    // Set the default timeout to 24 hours
                    validityDate.setHours(validityDate.getHours() + 24);
                    // Call the user exit in case of overriden validity date
                    var customValidityDate = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SetERPWaitingValidityDate", validityDate);
                    Data.SetValue("ValidityDateTime", customValidityDate && customValidityDate instanceof Date ? customValidityDate : validityDate);
                    Process.SetAutoValidateOnExpiration(true);
                    Transaction.Delete("UPDATE_PO_ON_INTEGRATION_ERROR");
                    // Wait for ERP ack
                    Process.WaitForUpdate();
                },
                IsInError: function () {
                    return Boolean(Data.GetValue("ERPPostingError__"));
                },
                ResetError: function () {
                    Data.SetValue("ERPPostingError__", "");
                },
                SetInvoiceInError: function () {
                    Data.SetValue("ERPPostingDate__", "");
                    Data.SetValue("ERPLinkingDate__", "");
                    if (Variable.GetValueAsString("AutoDeterminedPostingDate")) {
                        Data.SetValue("PostingDate__", null);
                        Lib.AP.RestoreComputedPaymentTermsDate();
                        Variable.SetValueAsString("AutoDeterminedPostingDate", null);
                    }
                },
                SetInvoiceInTimeout: function () {
                    Data.SetValue("ERPPostingError__", Language.Translate("_ERP integration in timeout"));
                    if (Variable.GetValueAsString("ERPIntegrationTimeout") === "") {
                        Variable.SetValueAsString("ERPIntegrationTimeout", (new Date()).toString());
                    }
                    ERPIntegrationHelper.SetInvoiceInError();
                }
            };
            function registerAContributor(contributorLogin) {
                if (Sys.Helpers.Array.IndexOf(Lib.AP.WorkflowCtrl.contributorsAdded, contributorLogin) === -1) {
                    Lib.AP.WorkflowCtrl.contributorsAdded.push(contributorLogin);
                }
            }
            function addActionInComment(comment, action, reason, by) {
                if (reason) {
                    action = Language.CreateLazyTranslation("{0} ({1})", action, Language.CreateLazyTranslation(reason));
                }
                return Lib.AP.CommentHelper.ComputeLazyHistoryLine(action, comment, by, true);
            }
            /**
            * Return the LastValidatorUserId__ user, or the Owner User if there is no LastValidatorUserId__ define
            */
            function getValidatorUser() {
                var lastValidatorID = Data.GetValue("LastValidatorUserId__");
                if (!lastValidatorID) {
                    lastValidatorID = Data.GetValue("OwnerID");
                }
                return Lib.AP.WorkflowCtrl.usersObject.GetUser(lastValidatorID);
            }
            function getOnBehalfValidator(sequenceStep, returnUser) {
                var lastValidator = getValidatorUser();
                if (lastValidator) {
                    var lastValidatorVars = lastValidator.GetVars();
                    var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                    if (currentContributor && currentContributor.login !== lastValidatorVars.GetValue_String("Login", 0)) {
                        if (returnUser) {
                            return lastValidator;
                        }
                        return lastValidatorVars.GetValue_String("DisplayName", 0);
                    }
                }
                return returnUser ? null : "";
            }
            function addOnBehalfOf(sequenceStep, comment) {
                var validator = getOnBehalfValidator(sequenceStep, true);
                var workflowActionAndComment = comment;
                if (validator) {
                    var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                    var prefix = void 0;
                    if (validator.IsMemberOf(Data.GetValue("OwnerId"))) {
                        prefix = validator.GetValue("DisplayName");
                    }
                    else {
                        var currOwner = currentContributor.name;
                        var owner = Lib.P2P.GetOwner();
                        if (owner.GetValue("IsGroup") === "1") {
                            var query = Process.CreateQuery();
                            query.SetSpecificTable("ODUSERGROUP");
                            var users = validator.GetBackedUpUsers();
                            var filter_1 = "(&(GROUPOWNERID=" + owner.GetValue("FullDN") + ")(UserOwnerID[=](";
                            Sys.Helpers.Array.ForEach(users, function (key) {
                                filter_1 += Sys.Helpers.String.EscapeValueForLdapFilterForINClause(key);
                                filter_1 += ",";
                            });
                            filter_1 += ")))";
                            query.SetFilter(filter_1);
                            query.SetAttributesList("UserOwnerID");
                            query.SetOptionEx("Limit=1");
                            var record = query.MoveFirst() ? query.MoveNextRecord() : null;
                            if (record) {
                                var ownerid = record.GetVars().GetValue_String("UserOwnerID", 0);
                                var realUser = g.Users.GetUser(ownerid);
                                if (realUser) {
                                    currOwner = realUser.GetValue("DisplayName");
                                }
                            }
                        }
                        prefix = Language.CreateLazyTranslation("_{0} on behalf of {1}", validator.GetValue("DisplayName"), currOwner);
                    }
                    if (comment) {
                        workflowActionAndComment = Language.CreateLazyTranslation("{0}:\n{1}", prefix, comment);
                    }
                    else {
                        workflowActionAndComment = prefix;
                    }
                }
                return workflowActionAndComment;
            }
            function getOwnershipDate(getPostingDate, login, currentParallel, sequenceStep) {
                var date = null;
                var prevContributor = sequenceStep - 1 > 0 ? Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep - 1) : null;
                var approversList = Data.GetTable(workflowUIParameters.mappingTable.tableName);
                if (approversList && approversList.GetItemCount() > 0) {
                    var i = approversList.GetItemCount() - 1;
                    while (!date && i > -1) {
                        var line = approversList.GetItem(i);
                        if (!getPostingDate && line.GetValue("ApproverID__") !== login && line.GetValue("ApproverAction__") !== workflowUIParameters.actions.proposeEarlyPayment.GetName()) {
                            if (currentParallel && prevContributor && currentParallel === prevContributor.parallel) {
                                date = prevContributor.startingDate;
                            }
                            else {
                                date = line.GetValue("ApprovalDate__");
                            }
                        }
                        else if (getPostingDate && line.GetValue("ApproverAction__") === workflowUIParameters.actions.post.GetName()) {
                            // Get starting date from APEnd
                            date = line.GetValue("ApprovalDate__");
                        }
                        i--;
                    }
                }
                return date || Data.GetValue("SubmitDateTime");
            }
            WorkflowCtrl.getOwnershipDate = getOwnershipDate;
            function getContributionData(sequenceStep, newAction, newComment, commentPrefixes) {
                var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                currentContributor.action = newAction;
                currentContributor.date = new Date();
                currentContributor.approved = true;
                var isProposalDiscountAction = newAction === workflowUIParameters.actions.proposeEarlyPayment.GetName();
                currentContributor.startingDate = getOwnershipDate(isProposalDiscountAction, currentContributor.login, currentContributor.parallel, sequenceStep);
                var validator = getOnBehalfValidator(sequenceStep, true);
                if (validator) {
                    currentContributor.actualApprover = validator.GetVars().GetValue_String("Login", 0);
                }
                if (commentPrefixes && commentPrefixes.action) {
                    newComment = addActionInComment(newComment, commentPrefixes.action, commentPrefixes.reason, commentPrefixes.onBehalfOf && !commentPrefixes.noUser ? addOnBehalfOf(sequenceStep) : null);
                }
                if (newComment) {
                    var previousComment = currentContributor.comment;
                    var newCommentFormatted = newComment;
                    if (previousComment) {
                        newCommentFormatted = Language.CreateLazyTranslation("{0}\n{1}", newCommentFormatted, previousComment);
                    }
                    currentContributor.comment = newCommentFormatted;
                }
                return currentContributor;
            }
            /**
             * @param {string} sequenceStep SequenceStep to get contributor
             * @param {string} action Action
             * @param {string} reason Reason for the action log
             * @param {boolean} keepHistoryComment keep history comment before adding new comment in workflow
             * @param {string} actionComment Action to log in workflow
             * @param {string} addCommentCallback Callback can be used to inject legacy code to fill the History__ field
             */
            function addToWorkflow(sequenceStep, action, reason, keepHistoryComment, actionComment, addCommentCallback) {
                var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                var currentActions = getCurrentActions(currentContributor, sequenceStep, false);
                var postHistory = keepHistoryComment ? Lib.AP.CommentHelper.ComputeLazyHistoryLine(currentActions, Lib.AP.CommentHelper.GetReliableComment(), getOnBehalfValidator(sequenceStep), true) : null;
                var contributionData = getContributionData(sequenceStep, action, postHistory, {
                    action: actionComment,
                    reason: reason,
                    noUser: true
                });
                addCommentCallback(currentContributor.name, currentActions, contributionData);
                Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep, contributionData);
                forward();
            }
            function GetExtraUsersWithReadRights(workflowContributors) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var loginList = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.Workflow.GetListOfExtraUsersWithReadRight", workflowContributors);
                    if (!loginList) {
                        loginList = [];
                        // By default, get the list of cost centers from the line items
                        var filter = Lib.P2P.Managers.GetCostCentersFilter();
                        if (filter) {
                            Lib.P2P.Managers.GetCostCentersManagers(filter).Then(function (list) { return resolve(list); });
                        }
                        else {
                            resolve(loginList);
                        }
                    }
                    else {
                        resolve(loginList);
                    }
                });
            }
            /**
             * @param {string} sequenceStep SequenceStep to get contributor
             * @param {string} action Action
             */
            function proposeEarlyPayment(sequenceStep, action) {
                // Get infos about discounts
                var discountParams = JSON.parse(Variable.GetValueAsString("DiscountParameters"));
                addToWorkflow(sequenceStep, action, null, false, Language.CreateLazyTranslation("_{0} discount applied to payment before {1}", discountParams.discountAmount, discountParams.dateLimit), function (currentContributorName, currentActions, contributionData) {
                    Log.Info("shortLogin , shortLogin ", discountParams.shortLogin);
                    contributionData.role = Lib.AP.WorkflowCtrl.roles.vendor;
                    contributionData.contributorId = "".concat(discountParams.shortLogin).concat(contributionData.role);
                    contributionData.email = Data.GetValue("VendorContactEmail__");
                    contributionData.login = discountParams.shortLogin;
                    contributionData.name = discountParams.vendorName;
                    contributionData.isGroup = false;
                    // Add new line
                    Lib.AP.CommentHelper.AddLine(Language.Translate("_Early payment proposal requested"), "");
                });
            }
            function giveRightToContributors(action) {
                // Do not reset existing rights, past controllers are no longer contributors in the workflow and need to retain read rights
                var contributorsLogin = [];
                // Set right for contributors
                for (var i = 0; i < Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors(); i++) {
                    var step = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(i);
                    if (step && (step.role === Lib.AP.WorkflowCtrl.roles.approver || step.role === Lib.AP.WorkflowCtrl.roles.controller)) {
                        contributorsLogin.push(step.login);
                        Process.SetRight(step.login, action);
                        registerAContributor(step.login);
                    }
                }
                GetExtraUsersWithReadRights(contributorsLogin)
                    .Then(function (listOfUsers) {
                    // Give read right to extra users
                    for (var _i = 0, listOfUsers_1 = listOfUsers; _i < listOfUsers_1.length; _i++) {
                        var login = listOfUsers_1[_i];
                        Process.AddRight(login, action);
                        registerAContributor(login);
                    }
                    // Give read rights to the managers of all users with read rights
                    var union = Sys.Helpers.Array.Union(contributorsLogin, listOfUsers);
                    Lib.AP.WorkflowCtrl.GiveRightReadToManagers(union);
                })
                    .Catch(function (err) {
                    Log.Error("GetExtraUsersWithReadRights error: ".concat(err));
                });
            }
            WorkflowCtrl.giveRightToContributors = giveRightToContributors;
            function giveRightToParallelContributors(action) {
                var nextContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex());
                var nextContributors = Lib.AP.WorkflowCtrl.workflowUI.GetParallelContributorsOf(nextContributor, true);
                nextContributors.forEach(function (contributor) {
                    if (contributor && (contributor.role === Lib.AP.WorkflowCtrl.roles.approver || contributor.role === Lib.AP.WorkflowCtrl.roles.controller)) {
                        Log.Info("Grant ".concat(action, " right to approver: ").concat(contributor.login));
                        Process.AddRight(contributor.login, action);
                        registerAContributor(contributor.login);
                    }
                });
            }
            function forward() {
                // Gives read rights for every contributor
                giveRightToContributors("read");
                giveRightToParallelContributors("validate");
                var idx = Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex();
                var step = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(idx);
                if (step && step.login) {
                    Log.Info("Lib.AP.WorkflowCtrl - Forwarding to " + step.login);
                    if (!Process.Forward(step.login)) {
                        workflowUIParameters.callbacks.OnError(Language.Translate("_Failed to forward"));
                    }
                    else {
                        registerAContributor(step.login);
                    }
                }
            }
            function getNextContributor(sequenceStep) {
                if (sequenceStep < Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors() - 1) {
                    return Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep + 1);
                }
                return null;
            }
            function goToNextStep(contributionData) {
                var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex());
                var nextContributor = getNextContributor(Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex());
                if (nextContributor) {
                    Lib.AP.WorkflowCtrl.workflowUI.NextContributor(contributionData);
                    forward();
                    if (nextContributor.role === Lib.AP.WorkflowCtrl.roles.approver || nextContributor.role === Lib.AP.WorkflowCtrl.roles.controller) {
                        if (Sys.Parameters.GetInstance("AP").GetParameter("WorkflowEnableNewInvoiceNotifications") === "1") {
                            notifyNextContributors(currentContributor, nextContributor);
                        }
                        WorkflowCtrl.NotificationCtrl.NotifyContributorOnMobile(nextContributor);
                    }
                }
                else {
                    giveRightToContributors("read");
                }
                return nextContributor;
            }
            // Send a mail notification for next contributor(s) (can be sevaral contributors if the worfklow is parallel)
            function notifyNextContributors(currentContributor, nextContributor) {
                var nextContributors = [];
                if (nextContributor.parallel && nextContributor.parallel === currentContributor.parallel) {
                    // contributors are part of the same parallel block, do nothing
                }
                else if (nextContributor.parallel) {
                    // next step is parallel, send the mail notification to everyone
                    nextContributors = Lib.AP.WorkflowCtrl.workflowUI.GetParallelContributorsOf(nextContributor, true);
                }
                else {
                    // nominal case
                    nextContributors = [nextContributor];
                }
                // Send mail notifications
                for (var _i = 0, nextContributors_1 = nextContributors; _i < nextContributors_1.length; _i++) {
                    var contributor = nextContributors_1[_i];
                    WorkflowCtrl.NotificationCtrl.EmailNotifyContributor(contributor);
                }
            }
            function getCurrentAction_ManualLink(currentActions, removePreAction) {
                if (Data.GetValue("ERPPostingError__")) {
                    Variable.SetValueAsString("DraftInERP", "1");
                    Data.SetValue("ERPPostingError__", "");
                    Data.SetValue("ERPPostingDate__", new Date());
                    currentActions.push(Language.CreateLazyTranslation("_Marked as resolved"));
                    removePreAction = false;
                }
                else {
                    currentActions.push(Language.CreateLazyTranslation("_Linked"));
                }
                return removePreAction;
            }
            function getCurrentActions(currentContributor, sequenceStep, touchless, pRequestApproval) {
                var currentActions = new Array();
                if (currentContributor.role === WorkflowCtrl.roles.apStart || currentContributor.role === WorkflowCtrl.roles.apEnd) {
                    var removePreAction = Lib.AP.WorkflowCtrl.alreadyPosted || pRequestApproval;
                    // Direct Post or WorkflowPost
                    if (Data.GetValue("ManualLink__")) {
                        removePreAction = getCurrentAction_ManualLink(currentActions, removePreAction);
                    }
                    else if (Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                        currentActions.push(touchless ? Language.CreateLazyTranslation("_Verified automatically") : Language.CreateLazyTranslation("_Verified"));
                    }
                    else {
                        currentActions.push(touchless ? Language.CreateLazyTranslation("_Validated automatically") : Language.CreateLazyTranslation("_Validated"));
                    }
                    if (removePreAction) {
                        // Special case: posted with workflow, backToAP, then workflow emptied
                        currentActions.pop();
                    }
                    var nextContributor = getNextContributor(sequenceStep);
                    if (nextContributor && nextContributor.role === WorkflowCtrl.roles.approver) {
                        currentActions.push(Language.CreateLazyTranslation("_Payment approval requested"));
                    }
                    else if (nextContributor && nextContributor.role === WorkflowCtrl.roles.controller) {
                        currentActions.push(touchless ? Language.CreateLazyTranslation("_Review requested automatically") : Language.CreateLazyTranslation("_Review requested"));
                    }
                    else if (Data.GetValue("ManualLink__") || Lib.AP.WorkflowCtrl.alreadyPosted) {
                        currentActions.push(Language.CreateLazyTranslation("_PaymentApproved"));
                    }
                }
                else if (Data.GetActionName().toLowerCase() === "autoapproverecurringinvoice" && currentContributor.role === WorkflowCtrl.roles.approver) {
                    // autoposting recurring invoice as desired by the current contributor
                    currentActions.push(Language.CreateLazyTranslation("_PaymentAutoApproved as recurring invoice"));
                }
                else if (Data.GetActionName().toLowerCase() === "adminlist") {
                    // reviewer or approver from an adminList
                    currentActions.push(Language.CreateLazyTranslation("_Approved without reviewing"));
                }
                else if (currentContributor.role === WorkflowCtrl.roles.approver) {
                    currentActions.push(touchless ? Language.CreateLazyTranslation("_PaymentAutoApproved") : Language.CreateLazyTranslation("_PaymentApproved"));
                }
                else {
                    // Reviewer
                    currentActions.push(touchless ? Language.CreateLazyTranslation("_InvoiceAutoReviewed") : Language.CreateLazyTranslation("_InvoiceReviewed"));
                }
                if (currentActions.length > 0) {
                    return currentActions.reduce(function (previous, current) {
                        if (previous == null) {
                            return current;
                        }
                        return Language.CreateLazyTranslation("{0}\n{1}", previous, current);
                    });
                }
                return null;
            }
            function updateHistoryOnPost(actions) {
                if (actions) {
                    Lib.AP.CommentHelper.UpdateHistory(actions);
                }
            }
            function erpPaymentBlockError(sequenceStep, contributionData) {
                // Unblock payment failed
                Variable.SetValueAsString("removeWorkflowActions", "true");
                // Add step to log error
                var errContributor = buildContributor(Lib.AP.WorkflowCtrl.GetWorkflowInitiator(), Lib.AP.WorkflowCtrl.roles.apEnd, "toUnblockPayment");
                Lib.AP.WorkflowCtrl.workflowUI.AddContributorAt(Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors(), errContributor);
                // Approver did approve - forward to AP specialist
                goToNextStep(contributionData);
                // Add step for the AP to retry (or not) the unblock payment
                var apContributor = buildContributor(Lib.AP.WorkflowCtrl.GetWorkflowInitiator(), Lib.AP.WorkflowCtrl.roles.apEnd, "toUnblockPayment");
                Lib.AP.WorkflowCtrl.workflowUI.AddContributorAt(Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors(), apContributor);
                // log error and go to the AP step
                var unblockPaymentError = Data.GetError("ERPInvoiceNumber__");
                var errorContributionData = getContributionData(sequenceStep + 1, workflowUIParameters.actions.unblockPaymentError.GetName(), Language.CreateLazyTranslation("{0}\n{1}", Language.CreateLazyTranslation("_Failed to unblock payment"), unblockPaymentError));
                Lib.AP.WorkflowCtrl.workflowUI.NextContributor(errorContributionData);
            }
            // Can be called directly onPost or when receiving an ERPAck
            function completePost(invoicePosted, sequenceStep, touchless) {
                var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                var currentActions = getCurrentActions(currentContributor, sequenceStep, touchless);
                var contributionData = getContributionData(sequenceStep, workflowUIParameters.actions.post.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                    action: currentActions,
                    noUser: touchless,
                    onBehalfOf: true
                });
                var nextContributor = goToNextStep(contributionData);
                if (nextContributor) {
                    // Post First
                    Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApprove);
                }
                else {
                    // Direct Post
                    if (Lib.AP.WorkflowCtrl.alreadyPosted) {
                        contributionData = getContributionData(sequenceStep, workflowUIParameters.actions.approve.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                            action: currentActions,
                            noUser: touchless,
                            onBehalfOf: true
                        });
                    }
                    // When manual linking and no approvers, never try to unblock payment
                    if (Data.GetValue("ManualLink__")) {
                        Data.SetValue("ERPPaymentBlocked__", false);
                    }
                    var ERPPaymentBlocked = Data.GetValue("ERPPaymentBlocked__");
                    if (ERPPaymentBlocked) {
                        erpPaymentBlockError(sequenceStep, contributionData);
                    }
                    else {
                        Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributionData);
                    }
                    Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToPay);
                }
                updateHistoryOnPost(currentActions);
                var isSAP = Lib.ERP.IsSAP();
                if (isSAP && Lib.AP.InvoiceType.isPOGLInvoice()) {
                    // eslint-disable-next-line dot-notation
                    Lib.AP["TablesUpdater"].Update(false, Lib.AP.GetInvoiceDocument().ShouldUpdateVendorNumberOnPOHeaderAndItems());
                }
                if (!Data.GetValue("ERPPostingDate__")) {
                    Data.SetValue("ERPPostingDate__", new Date());
                }
                if (Data.GetValue("ERPPostingError__")) {
                    Data.SetValue("ERPPostingError__", "");
                }
                if (invoicePosted && Lib.AP.WorkflowCtrl.budgetManager && Lib.AP.WorkflowCtrl.budgetManager.IsBudgetEnable()) {
                    if (Lib.AP.WorkflowCtrl.budgetManager.Updater.AsInvoiced()) {
                        Data.SetValue("BudgetExportStatus__", "success");
                    }
                }
                else if (Lib.AP.WorkflowCtrl.budgetManager) {
                    //Budget is disable
                    Data.SetValue("BudgetExportStatus__", "ignored");
                }
                if (!Data.GetValue("PostedBy__")) {
                    var user = getValidatorUser();
                    if (user) {
                        Data.SetValue("PostedBy__", user.GetVars().GetValue_String("login", 0));
                    }
                }
            }
            function performLegalArchiving() {
                if (Sys.Parameters.GetInstance("AP").GetParameter("LegalArchiving") === "1") {
                    if (!Data.GetValue("ArchiveRuidEx__")) {
                        Lib.LegalArchiving.SetArchiveProviderSolution("AP");
                        Lib.LegalArchiving.SetArchiveProcessName("Vendor invoice legal archive");
                        var archiveProcessRuidEx = Lib.LegalArchiving.Archive();
                        if (archiveProcessRuidEx) {
                            Data.SetValue("ArchiveRuidEx__", archiveProcessRuidEx);
                            var validationURL = Data.GetValue("ValidationUrl");
                            var ruidEx = Data.GetValue("RuidEx").replace("#", "%23");
                            archiveProcessRuidEx = archiveProcessRuidEx.replace("#", "%23");
                            var processArchiveURL = validationURL.replace(ruidEx, archiveProcessRuidEx);
                            Data.SetValue("ArchiveProcessLink__", processArchiveURL);
                        }
                    }
                }
            }
            function waitForClearing(sequenceStep) {
                Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.WaitForClearing);
                var contributionData = getContributionData(sequenceStep, workflowUIParameters.actions.waitForClearing.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                    action: Language.CreateLazyTranslation("_Wait for clearing history"),
                    onBehalfOf: true
                });
                Lib.AP.CommentHelper.UpdateHistory(Language.CreateLazyTranslation("_Wait for clearing history"), true);
                // To remove contributors after waiting for clearing
                Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ControllersList", []);
                var allowRebuildState = Lib.AP.WorkflowCtrl.workflowUI.RebuildAllowed();
                Lib.AP.WorkflowCtrl.workflowUI.AllowRebuild(true);
                Lib.AP.WorkflowCtrl.workflowUI.Restart(contributionData);
                Lib.AP.WorkflowCtrl.Rebuild(true, true, "workflowReviewEnd");
                Lib.AP.WorkflowCtrl.workflowUI.AllowRebuild(allowRebuildState);
                //It could be better to define a validate date time by now + 16 months?
                var validityDate = new Date();
                validityDate.setHours(validityDate.getHours() + 24);
                Data.SetValue("ValidityDateTime", validityDate);
                Process.SetAutoValidateOnExpiration(true);
                Process.WaitForUpdate();
            }
            function post(sequenceStep, touchless) {
                if (Transaction.Read(Lib.ERP.Invoice.transaction.keys.post) === Lib.ERP.Invoice.transaction.values.beforePost) {
                    Log.Warn("Redis key " + Lib.ERP.Invoice.transaction.keys.post + " equal to " + Lib.ERP.Invoice.transaction.values.beforePost + " : Invoice may have been already posted");
                    Process.PreventApproval();
                    Lib.CommonDialog.NextAlert.Define("_PostingErrorTitle", "_PostingErrorDescription", {
                        isError: true
                    });
                    //Clean transaction lock when displaying popup
                    Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                    return false;
                }
                var nextContributor = null;
                var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                if (currentContributor && currentContributor.role === WorkflowCtrl.roles.apStart) {
                    Data.SetValue("VerificationDate__", new Date());
                    Process.SaveAutolearningData();
                    // eslint-disable-next-line dot-notation
                    Lib.AP["Extraction"].CrossReference.SaveERPValues();
                    nextContributor = getNextContributor(sequenceStep);
                    if (nextContributor && nextContributor.role === WorkflowCtrl.roles.approver) {
                        // Check anomaly detection on invoice amount if option enabled
                        Lib.AP.AnomalyDetection.CheckIfNewAnomalyDetectionIsNeeded();
                        Data.SetValue("PaymentApprovalStatus__", "Pending");
                    }
                    else if (!nextContributor && Data.GetValue("PaymentApprovalStatus__") === "Pending") {
                        /** We wanted someone to approve the payment at some point, but they've been deleted
                         * So we must approve payment that'd been blocked previously
                         * (posting "pending" in the erp blocks the payment) */
                        Log.Info("Approve payment that had been blocked before workflow deletion");
                        Data.SetValue("PaymentApprovalStatus__", "Approved");
                    }
                    else {
                        Data.SetValue("PaymentApprovalStatus__", "Not requested");
                    }
                }
                var invoicePosted = true;
                var manualLink = Data.GetValue("ManualLink__");
                // eslint-disable-next-line dot-notation
                if (Lib.AP["InvoiceExporter"]) {
                    // eslint-disable-next-line dot-notation
                    invoicePosted = Lib.AP["InvoiceExporter"].ExportIfNeeded(currentContributor.role, nextContributor === null);
                }
                performLegalArchiving();
                Lib.AP.NotifySDA();
                if (!manualLink && invoicePosted && !Lib.ERP.IsSAP() && Variable.GetValueAsString("WaitForERPAck") === "true") {
                    ERPIntegrationHelper.WaitForERPIntegration();
                }
                else {
                    completePost(true, sequenceStep, touchless);
                    Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                }
                return null;
            }
            function Approve(sequenceStep, actionName, autoApprove) {
                function autoApproveIfNextIsSameApprover() {
                    var role = nextContributor.role;
                    var currentUserOwnerId = Data.GetValue("LastValidatorUserId__");
                    var currentUser = Lib.AP.WorkflowCtrl.usersObject.GetUser(currentUserOwnerId);
                    var currentUserLogin = currentUser.GetVars().GetValue_String("Login", 0);
                    while (nextContributor && nextContributor.role === role && currentUserLogin === nextContributor.login /* || isBackupUserOfNextContributor(currentUser, nextContributor)*/) {
                        Log.Info("Auto approve step " + sequenceStep + " for " + nextContributor.login);
                        Lib.AP.WorkflowCtrl.workflowUI.NextContributor(contributionData);
                        sequenceStep = Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex();
                        action = getCurrentActions(currentContributor, sequenceStep, true);
                        contributionData = getContributionData(sequenceStep, actionName, Lib.AP.CommentHelper.GetReliableComment(), {
                            onBehalfOf: true,
                            action: action,
                            reason: wkfException
                        });
                        nextContributor = getNextContributor(sequenceStep);
                        Lib.AP.CommentHelper.UpdateHistory(action, false, false, false, "CurrentException__");
                    }
                }
                function approveToAPEnd() {
                    if (wkfException) {
                        // Exception cycle has been completed
                        Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToVerify);
                        Data.SetValue("CurrentException__", "");
                        Variable.SetValueAsString("isExtractionReviewException", "");
                    }
                    else {
                        Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToPost);
                    }
                    if (currentContributor.role === WorkflowCtrl.roles.controller || Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                        //Review workflow ended, use APEnd as new APStart
                        var defaultApEnd = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("workflowApEnd");
                        if (defaultApEnd) {
                            Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("workflowInitiator", defaultApEnd);
                        }
                        var allowBuildOfApprovers = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.OnBuildOfApprovers");
                        if (typeof allowBuildOfApprovers !== "boolean") {
                            allowBuildOfApprovers = true;
                        }
                        Lib.AP.WorkflowCtrl.additionalApprovers = Lib.AP.WorkflowCtrl.workflowUI.GetAdditionalContributors("approver");
                        Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ControllersList", []);
                        var allowRebuildState = Lib.AP.WorkflowCtrl.workflowUI.RebuildAllowed();
                        Lib.AP.WorkflowCtrl.workflowUI.AllowRebuild(true);
                        Lib.AP.WorkflowCtrl.workflowUI.Restart(contributionData);
                        Lib.AP.WorkflowCtrl.Rebuild(allowBuildOfApprovers, true, "workflowReviewEnd");
                        Lib.AP.WorkflowCtrl.workflowUI.AllowRebuild(allowRebuildState);
                        if (!allowBuildOfApprovers) {
                            Lib.AP.WorkflowCtrl.IncludeAdditionalApprovers(Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ApproversList"));
                        }
                        forward();
                    }
                    else {
                        Data.SetValue("PaymentApprovalStatus__", "Approved");
                        goToNextStep(contributionData);
                    }
                }
                function approveToNext() {
                    if (!Lib.AP.InvoiceType.isConsignmentInvoice()) {
                        Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApprove);
                    }
                    else {
                        Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApproveBeforeClearing);
                    }
                    goToNextStep(contributionData);
                }
                function lastApprove() {
                    if (Lib.AP.InvoiceType.isConsignmentInvoice()) {
                        waitForClearing(sequenceStep);
                    }
                    else {
                        // Post First mode - last approver approved
                        var ERPPaymentBlocked = Data.GetValue("ERPPaymentBlocked__");
                        if (ERPPaymentBlocked) {
                            erpPaymentBlockError(sequenceStep, contributionData);
                        }
                        else {
                            // Workflow completed
                            Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributionData);
                        }
                        Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToPay);
                        Data.SetValue("PaymentApprovalStatus__", "Approved");
                        // eslint-disable-next-line dot-notation
                        if (Lib.AP["InvoiceExporter"]) {
                            // Export Invoice
                            // eslint-disable-next-line dot-notation
                            Lib.AP["InvoiceExporter"].ExportIfNeeded(contributionData.role, true);
                        }
                    }
                }
                var wkfException = Data.GetValue("CurrentException__");
                var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                var action = getCurrentActions(currentContributor, sequenceStep);
                var contributionData = getContributionData(sequenceStep, actionName, Lib.AP.CommentHelper.GetReliableComment(), {
                    onBehalfOf: true,
                    noUser: autoApprove && currentContributor.role === WorkflowCtrl.roles.approver,
                    action: action,
                    reason: wkfException
                });
                var isActionShouldRebuildWorkflow = Data.GetActionDevice() === "mobile" && Sys.Helpers.String.ToBoolean(Variable.GetValueAsString("WorkflowImpacted"));
                // rebuild workflow only when user is a reviewer from mobile app and workflow is impacted
                if (currentContributor.role === WorkflowCtrl.roles.controller && isActionShouldRebuildWorkflow) {
                    Lib.AP.WorkflowCtrl.Rebuild(true, false, "mobileAppRebuild");
                }
                giveRightToContributors("read");
                var nextContributor = getNextContributor(Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex());
                Lib.AP.CommentHelper.UpdateHistory(action, false, false, false, "CurrentException__");
                if (nextContributor && (nextContributor.role === WorkflowCtrl.roles.controller || nextContributor.role === WorkflowCtrl.roles.approver)) {
                    autoApproveIfNextIsSameApprover();
                }
                if (nextContributor) {
                    if (nextContributor.role === WorkflowCtrl.roles.apEnd) {
                        approveToAPEnd();
                    }
                    else if (nextContributor.role === WorkflowCtrl.roles.controller || nextContributor.role === WorkflowCtrl.roles.approver) {
                        approveToNext();
                    }
                }
                else {
                    lastApprove();
                }
                WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
            }
            function requestApproval(sequenceStep, autoForwardToApprover, actionName) {
                var wkfException = Data.GetValue("CurrentException__");
                var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                var action = getCurrentActions(currentContributor, sequenceStep, autoForwardToApprover, true);
                var contributionData = getContributionData(sequenceStep, actionName, Lib.AP.CommentHelper.GetReliableComment(), {
                    action: action,
                    reason: wkfException,
                    onBehalfOf: true
                });
                var nextContributor = goToNextStep(contributionData);
                if (nextContributor.role === WorkflowCtrl.roles.controller || nextContributor.role === WorkflowCtrl.roles.approver) {
                    // Check anomaly detection on invoice amount if option enabled
                    Lib.AP.AnomalyDetection.CheckIfNewAnomalyDetectionIsNeeded();
                    // compatibility mobile apps
                    Lib.AP.CommentHelper.UpdateHistory(action, false, false, false, "CurrentException__");
                    Data.SetValue("VerificationDate__", new Date());
                    Process.SaveAutolearningData();
                    // eslint-disable-next-line dot-notation
                    Lib.AP["Extraction"].CrossReference.SaveERPValues();
                    /** If the next contributor is an approver, we block the payment that we post in the ERP
                     * until approval; else the payment should not be blocked
                     */
                    if (nextContributor.role === WorkflowCtrl.roles.approver) {
                        Data.SetValue("PaymentApprovalStatus__", "Pending");
                    }
                    if (!Lib.AP.InvoiceType.isConsignmentInvoice()) {
                        Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApprove);
                    }
                    else {
                        Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApproveBeforeClearing);
                    }
                    WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
                }
                else {
                    workflowUIParameters.callbacks.OnError("requestApproval action called, but no approver set after current contributor");
                }
            }
            function isBalanceInThreshold() {
                var threshold = parseFloat(Variable.GetValueAsString("BalanceThreshold"));
                var balance = Data.GetValue("Balance__");
                return Math.abs(balance) <= threshold;
            }
            function isFieldSet(fieldName) {
                return typeof Data.GetValue(fieldName) !== "undefined";
            }
            function isLineNotPostable(line) {
                return !Lib.P2P.InvoiceLineItem.IsPostable(line);
            }
            function workflowShouldBeComputed(ignoreBalance) {
                var compute = isFieldSet("CompanyCode__") && isFieldSet("InvoiceAmount__") && isFieldSet("InvoiceCurrency__") && isFieldSet("VendorNumber__") && isFieldSet("InvoiceDate__");
                if (compute && !ignoreBalance) {
                    compute = isBalanceInThreshold();
                }
                return compute;
            }
            // HTML Page script
            function highlightCurrentStep(row, actionDone) {
                if (Data.GetValue("State") < 100) {
                    if (actionDone) {
                        row.RemoveStyle("highlight");
                        row.LineMarker__.SetImageURL();
                    }
                    else {
                        var tableIndex = parseInt(row[workflowUIParameters.mappingTable.workflowIndex].GetValue(), 10);
                        if (!Lib.AP.WorkflowCtrl.processInstanceObject.isReadOnly) {
                            // from the current position, locat the first previous line != current contributor
                            var role = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                            var tableIndexOrg = tableIndex;
                            var contributor = void 0;
                            do {
                                var sequenceIndex = Lib.AP.WorkflowCtrl.workflowUI.GetSequenceIndexAt(tableIndex--);
                                contributor = sequenceIndex >= 0 ? Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceIndex) : null;
                            } while (tableIndex >= 0 && contributor && contributor.role === role && contributor.login === Lib.AP.WorkflowCtrl.userObject.loginId);
                            tableIndex++;
                            // go down to the current contributor
                            while (tableIndex < tableIndexOrg && !Lib.AP.WorkflowCtrl.workflowUI.IsCurrentContributorAt(tableIndex)) {
                                tableIndex++;
                            }
                        }
                        if (Lib.AP.WorkflowCtrl.workflowUI.IsCurrentContributorAt(tableIndex)) {
                            row.AddStyle("highlight");
                            // Add an image to the left of the user name
                            row.LineMarker__.SetImageURL("AP_WorkflowArrow.png", false);
                        }
                        else {
                            row.RemoveStyle("highlight");
                            // Remove previous image
                            row.LineMarker__.SetImageURL();
                        }
                    }
                }
            }
            function cleanManuallyAddedFlagsInList(listName) {
                var list = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue(listName);
                if (!list) {
                    return false;
                }
                for (var i = 0; i < list.length; ++i) {
                    if (list[i].manuallyAdded) {
                        delete list[i].manuallyAdded;
                    }
                }
                Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue(listName, list);
                return true;
            }
            function cleanManuallyAddedFlags() {
                cleanManuallyAddedFlagsInList("ApproversList");
                cleanManuallyAddedFlagsInList("ControllersList");
            }
            function isFirstInvoiceContributorAddedManually(ContributorsList) {
                if (ContributorsList && ContributorsList.length >= 1 && "manuallyAdded" in ContributorsList[0]) {
                    return ContributorsList[0].manuallyAdded;
                }
                return false;
            }
            function getFirstInvoiceApprover() {
                var firstInvoiceApprover = "";
                var ApproversList = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ApproversList");
                if (isFirstInvoiceContributorAddedManually(ApproversList)) {
                    firstInvoiceApprover = ApproversList[0].login;
                }
                return firstInvoiceApprover;
            }
            function getFirstInvoiceController() {
                var firstInvoiceController = "";
                var ControllersList = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ControllersList");
                if (isFirstInvoiceContributorAddedManually(ControllersList)) {
                    firstInvoiceController = ControllersList[0].login;
                }
                return firstInvoiceController;
            }
            function getContributor(role, login) {
                var contributor = null;
                var listName = role === Lib.AP.WorkflowCtrl.roles.controller ? "ControllersList" : "ApproversList";
                var listToUse = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue(listName);
                if (listToUse) {
                    for (var i = 0; i < listToUse.length; i++) {
                        if (listToUse[i].login === login) {
                            contributor = listToUse[i];
                            break;
                        }
                    }
                }
                return contributor;
            }
            /**
            * OnBuild functions
            **/
            function validateUserExists(user, contributor) {
                if (user.exists === false) {
                    contributor.errors = contributor.errors || {};
                    contributor.errors.name = Language.Translate("User not found", false);
                    return false;
                }
                contributor.errors = contributor.errors || {};
                delete contributor.errors.name;
                return true;
            }
            function buildContributor(user, role, action) {
                var cId = Lib.AP.WorkflowCtrl.workflowUI.CreateUniqueContributorId(user.login + role);
                var contributor = {
                    //mandatory fields
                    contributorId: cId,
                    role: role,
                    //not mandatory fields
                    login: user.login,
                    email: user.emailAddress,
                    name: user.displayName,
                    action: action,
                    addedByRole: Lib.AP.WorkflowCtrl.GetCurrentStepRole(),
                    actualApprover: user.login
                };
                // Parallel contributors handling
                if (user.originalValues && user.originalValues.parallel) {
                    contributor.parallel = "".concat(role, "_").concat(user.originalValues.stepIndex, "_").concat(user.originalValues.parallelIndex);
                }
                validateUserExists(user, contributor);
                var customContributor = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.ExtendContributor", contributor, user);
                return Sys.Helpers.Extend({}, contributor, customContributor);
            }
            function onBuildAPStart(callback) {
                var role = WorkflowCtrl.roles.apStart;
                var action = workflowUIParameters.actions.toVerify.GetName();
                if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(WorkflowCtrl.roles.approver) <= 0) {
                    // Direct Post - change action
                    action = workflowUIParameters.actions.toPost.GetName();
                }
                var apClerk = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("workflowInitiator");
                if (!apClerk) {
                    apClerk = {
                        login: "",
                        emailAddress: "",
                        displayName: ""
                    };
                    if (Lib.AP.WorkflowCtrl.userObject) {
                        // From HTML page script
                        apClerk.login = Lib.AP.WorkflowCtrl.userObject.loginId;
                        apClerk.displayName = Lib.AP.WorkflowCtrl.userObject.fullName;
                        apClerk.emailAddress = Lib.AP.WorkflowCtrl.userObject.emailAddress;
                    }
                    else if (Lib.AP.WorkflowCtrl.usersObject) {
                        // From server scripts
                        var usr = Lib.AP.WorkflowCtrl.usersObject.GetUser(Data.GetValue("OwnerId"));
                        var userVars = usr.GetVars();
                        apClerk.login = userVars.GetValue_String("Login", 0);
                        apClerk.displayName = userVars.GetValue_String("DisplayName", 0);
                        apClerk.emailAddress = userVars.GetValue_String("EmailAddress", 0);
                    }
                    Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("workflowInitiator", apClerk);
                }
                callback([buildContributor(apClerk, role, action)]);
                return true;
            }
            function onBuildAPEnd(callback) {
                var role = WorkflowCtrl.roles.apEnd;
                var action = workflowUIParameters.actions.toPost.GetName();
                var apClerk = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("workflowInitiator");
                var defaultAPEnd = Sys.Parameters.GetInstance("AP").GetParameter("DefaultAPClerkEnd", "");
                var controllersList = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ControllersList");
                var manuallyAddedControllers = Lib.AP.WorkflowCtrl.workflowUI.GetAdditionalContributors("controller");
                if ((!controllersList || controllersList.length === 0) && (!manuallyAddedControllers || manuallyAddedControllers.length === 0) && (!defaultAPEnd || defaultAPEnd === apClerk.login)) {
                    callback([]);
                }
                else if (defaultAPEnd) {
                    Sys.OnDemand.Users.GetUsersFromLogins([defaultAPEnd], ["login", "displayname", "emailaddress"], function (users) {
                        Sys.Helpers.Array.ForEach(users, function (u) {
                            if (u.login === defaultAPEnd) {
                                var apEnd = { login: u.login, emailAddress: u.emailaddress, displayName: u.displayname };
                                callback([buildContributor(apEnd, role, action)]);
                                Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("workflowApEnd", apEnd);
                            }
                        });
                    });
                }
                else {
                    callback([buildContributor(apClerk, role, action)]);
                }
                return true;
            }
            function onBuildApprover(callback, list, role, action) {
                // Init workflow if balance is equal to 0 and the invoice type is Non-PO
                var approvers = [];
                if (list && Sys.Helpers.IsArray(list)) {
                    Sys.Helpers.Array.ForEach(list, function (user) {
                        Log.Info("New approver: " + user.login);
                        approvers.push(buildContributor(user, role, action));
                    });
                }
                callback(approvers);
                return true;
            }
            function onBuildController(callback, list, role, action) {
                // Init workflow if balance is equal to 0 and the invoice type is Non-PO
                var controllers = [];
                if (list && Sys.Helpers.IsArray(list)) {
                    Sys.Helpers.Array.ForEach(list, function (user) {
                        Log.Info("New controller: " + user.login);
                        controllers.push(buildContributor(user, role, action));
                    });
                }
                callback(controllers);
                return true;
            }
            function handleCurrentUserInParallelBlock(contributors) {
                var firstContributor = contributors[0];
                if (firstContributor && firstContributor.parallel && contributors.length > 1) {
                    var currentUserIndex = contributors
                        .map(function (contributor) { return Lib.P2P.CurrentUserMatchesLogin(contributor.login, Sys.Helpers.Globals.User || Lib.P2P.GetValidatorOrOwner()); })
                        .indexOf(true);
                    if (currentUserIndex !== -1) {
                        var currentUser = contributors[currentUserIndex];
                        if (currentUser.parallel === firstContributor.parallel) {
                            contributors.splice(currentUserIndex, 1);
                            contributors.unshift(currentUser);
                        }
                    }
                }
            }
            /**
            * Display or hide add/delete button on the workflow line
            **/
            function setActionsButtonsForWorkflowRow(table, row, contributor) {
                // Early return when processInstanceObject is read only or workflow has ended
                if (Lib.AP.WorkflowCtrl.processInstanceObject.isReadOnly || Lib.AP.WorkflowCtrl.IsEnded()) {
                    table.HideTableRowAddForItem(row.GetLineNumber() - 1, true);
                    table.HideTableRowDeleteForItem(row.GetLineNumber() - 1, true);
                    row.Approver__.SetBrowsable(false);
                    return;
                }
                var showAdd = true;
                var showDelete = true;
                var currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                if (currentRole !== Lib.AP.WorkflowCtrl.roles.apStart) {
                    var tableIndex = row[workflowUIParameters.mappingTable.workflowIndex].GetValue();
                    var sequenceIndex = Lib.AP.WorkflowCtrl.workflowUI.GetSequenceIndexAt(tableIndex);
                    var nextContributor = getNextContributor(sequenceIndex);
                    // Allow delete of any additional contributor (except myself)
                    showDelete = contributor.isAdditional &&
                        !contributor.parallel &&
                        !Lib.AP.WorkflowCtrl.workflowUI.IsCurrentContributorAt(row) &&
                        allowDeleteBasedOnAddedRole(contributor, currentRole);
                    /* allow add :
                    - after any additional contributor
                    - after last approver
                    - before any additional contributor
                    - after last controller (before AP end)*/
                    showAdd = !Lib.AP.WorkflowCtrl.workflowUI.IsContributorInParallelBlock(tableIndex, true) &&
                        (contributor.isAdditional ||
                            !nextContributor ||
                            nextContributor.isAdditional ||
                            nextContributor.role === Lib.AP.WorkflowCtrl.roles.apEnd);
                }
                // if AP start, then AP Start and AP End are not deletable
                else {
                    if (contributor.role === Lib.AP.WorkflowCtrl.roles.apStart) {
                        showDelete = false;
                        showAdd = Lib.AP.WorkflowCtrl.allowApprovers || !Data.GetValue("ManualLink__");
                    }
                    // Prevent AP Start from adding contributors inside parallel blocks
                    var tableIndex = row[workflowUIParameters.mappingTable.workflowIndex].GetValue();
                    showAdd = showAdd && !Lib.AP.WorkflowCtrl.workflowUI.IsContributorInParallelBlock(tableIndex, true);
                }
                if (contributor.role === Lib.AP.WorkflowCtrl.roles.apEnd) {
                    showDelete = false;
                    showAdd = Lib.AP.WorkflowCtrl.allowApprovers;
                }
                table.HideTableRowAddForItem(row.GetLineNumber() - 1, !showAdd);
                table.HideTableRowDeleteForItem(row.GetLineNumber() - 1, !showDelete);
                row.Approver__.SetBrowsable(showDelete);
            }
            /**
            * Return true if the contributor was added by a role prior to the role
            */
            function allowDeleteBasedOnAddedRole(contributor, currentRole) {
                if (!contributor || !contributor.addedByRole || !currentRole) {
                    return true;
                }
                var orderedRoles = [
                    Lib.AP.WorkflowCtrl.roles.apStart,
                    Lib.AP.WorkflowCtrl.roles.controller,
                    Lib.AP.WorkflowCtrl.roles.apEnd,
                    Lib.AP.WorkflowCtrl.roles.approver
                ];
                var indexAddedByRole = orderedRoles.indexOf(contributor.addedByRole);
                var indexCurrentRole = orderedRoles.indexOf(currentRole);
                var indexContributorRole = orderedRoles.indexOf(contributor.role);
                // If a role was not found, in doubt return true
                if (indexAddedByRole === -1 || indexCurrentRole === -1) {
                    return true;
                }
                // Delete is allowed for role prior to the contributor role
                // and for role prior to the role of the user who added the contributor
                if (indexCurrentRole <= indexContributorRole && indexCurrentRole <= indexAddedByRole) {
                    return true;
                }
                return false;
            }
            var workflowUIDefaultParameters = {
                actions: {
                    toVerify: {
                        image: "AP_WorkflowRequestOrPost.png"
                    },
                    toPost: {
                        image: "AP_WorkflowRequestOrPost.png"
                    },
                    toApprove: {
                        image: "AP_WorkflowApproveOrRejectGrey.png"
                    },
                    newApprover: {},
                    newController: {},
                    inactivity: {
                        image: "AP_WorkflowInactivity.png"
                    },
                    proposeEarlyPayment: {
                        OnDone: function (sequenceStep) {
                            proposeEarlyPayment(sequenceStep, workflowUIParameters.actions.proposeEarlyPayment.GetName());
                        },
                        image: "AP_WorkflowDiscountOn.svg"
                    },
                    expiration: {
                        image: "AP_WorkflowExpiration.png"
                    },
                    reject: {
                        OnDone: function (sequenceStep) {
                            Lib.AP.CommentHelper.ResetReasonExcept("RejectReason__");
                            var action = Language.CreateLazyTranslation("_InvoiceRejected");
                            var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                            var contributionData = getContributionData(sequenceStep, this.actions.reject.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                                action: action,
                                reason: Data.GetValue("RejectReason__"),
                                onBehalfOf: true
                            });
                            Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributionData);
                            WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
                            Lib.AP.CommentHelper.UpdateHistory(action, false, false, false, "RejectReason__");
                            Lib.AP.NotifySDA();
                            Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.Rejected);
                            Data.SetValue("State", 400);
                        },
                        image: "AP_WorkflowReject.png"
                    },
                    autoReject: {
                        OnDone: function (sequenceStep) {
                            Lib.AP.CommentHelper.ResetReasonExcept("RejectReason__");
                            var action = Language.CreateLazyTranslation("_InvoiceAutomaticallyRejected");
                            var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                            var contributionData = getContributionData(sequenceStep, this.actions.reject.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                                action: action,
                                reason: Data.GetValue("RejectReason__"),
                                onBehalfOf: true
                            });
                            Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributionData);
                            WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
                            Lib.AP.CommentHelper.UpdateHistory(action, false, false, false, "RejectReason__");
                            Lib.AP.NotifySDA();
                            Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.Rejected);
                            Data.SetValue("State", 400);
                        },
                        image: "AP_WorkflowReject.png"
                    },
                    requestApproval: {
                        // Approve First - AP forwards invoice in the workflow
                        OnDone: function (sequenceStep) {
                            requestApproval(sequenceStep, false, this.actions.requestApproval.GetName());
                        },
                        image: "AP_WorkflowSubmit.png"
                    },
                    requestApprovalForConsigment: {
                        // Approve First - AP forwards invoice in the workflow
                        OnDone: function (sequenceStep) {
                            requestApproval(sequenceStep, false, this.actions.requestApproval.GetName());
                        },
                        image: "AP_WorkflowSubmit.png"
                    },
                    autoRequestApproval: {
                        // Approve First - AP forwards invoice in the workflow
                        OnDone: function (sequenceStep) {
                            requestApproval(sequenceStep, true, this.actions.autoRequestApproval.GetName());
                        },
                        image: "AP_WorkflowSubmit.png"
                    },
                    post: {
                        OnDone: function (sequenceStep) {
                            post(sequenceStep, false);
                        },
                        image: "AP_WorkflowAP.png"
                    },
                    completePost: {
                        OnDone: function (sequenceStep) {
                            completePost(true, sequenceStep);
                        }
                    },
                    postTouchless: {
                        OnDone: function (sequenceStep) {
                            post(sequenceStep, true);
                        }
                    },
                    postAndRequestApproval: {
                        OnDone: function (sequenceStep) {
                            post(sequenceStep, false);
                        }
                    },
                    autoPostAndRequestApproval: {
                        OnDone: function (sequenceStep) {
                            post(sequenceStep, true);
                        }
                    },
                    setAside: {
                        OnDone: function (sequenceStep) {
                            Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.SetAside);
                            var action = Language.CreateLazyTranslation("_Set aside history");
                            var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                            var contributionData = getContributionData(sequenceStep, this.actions.setAside.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                                action: action,
                                reason: Data.GetValue("AsideReason__"),
                                onBehalfOf: true
                            });
                            Lib.AP.CommentHelper.UpdateHistory(action, true);
                            if (contributionData.role === Lib.AP.WorkflowCtrl.roles.apStart) {
                                Lib.AP.WorkflowCtrl.workflowUI.Restart(contributionData);
                            }
                            else {
                                Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep, contributionData);
                            }
                            WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
                        },
                        image: "AP_WorkflowSetAside.png"
                    },
                    approve: {
                        OnDone: function (sequenceStep) {
                            Approve(sequenceStep, this.actions.approve.GetName(), false);
                        },
                        image: "AP_WorkflowApproval.png"
                    },
                    autoApprove: {
                        OnDone: function (sequenceStep) {
                            Approve(sequenceStep, this.actions.approve.GetName(), true);
                        },
                        image: "AP_WorkflowApproval.png"
                    },
                    backToPrevious: {
                        OnDone: function (sequenceStep) {
                            Lib.AP.CommentHelper.ResetReasonExcept();
                            if (!Lib.AP.InvoiceType.isConsignmentInvoice()) {
                                Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApprove);
                            }
                            else {
                                Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApproveBeforeClearing);
                            }
                            var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                            var currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                            var previousContributor = Lib.AP.WorkflowCtrl.GetPreviousContributor(currentRole);
                            if (Sys.Parameters.GetInstance("AP").GetParameter("WorkflowEnableNewInvoiceNotifications") === "1") {
                                WorkflowCtrl.NotificationCtrl.EmailNotifyContributor(previousContributor);
                            }
                            WorkflowCtrl.NotificationCtrl.NotifyContributorOnMobile(previousContributor);
                            var contributionData = getContributionData(sequenceStep, this.actions.backToPrevious.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                                onBehalfOf: true,
                                action: Language.CreateLazyTranslation("_Back to previous history")
                            });
                            Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep - 1, contributionData);
                            Lib.AP.CommentHelper.UpdateHistory(Language.CreateLazyTranslation("_Back to previous"));
                            WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
                            forward();
                        },
                        image: "AP_WorkflowBack.png"
                    },
                    backToAP: {
                        OnDone: function (sequenceStep) {
                            Lib.AP.CommentHelper.ResetReasonExcept("BackToAPReason__");
                            var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                            Variable.SetValueAsString("DoNotCheckDuplicates", "0");
                            Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToVerify);
                            var contributionData = getContributionData(sequenceStep, this.actions.backToAP.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                                onBehalfOf: true,
                                action: Language.CreateLazyTranslation("_Back to AP history"),
                                reason: Data.GetValue("BackToAPReason__")
                            });
                            Lib.AP.WorkflowCtrl.workflowUI.Restart(contributionData);
                            Lib.AP.CommentHelper.UpdateHistory(Language.CreateLazyTranslation("_Back to AP"), false, false, false, "BackToAPReason__");
                            forward();
                            WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
                        },
                        image: "AP_WorkflowBacktoAP.png"
                    },
                    requestFurtherApproval: {
                        OnDone: function (sequenceStep) {
                            Lib.AP.CommentHelper.ResetReasonExcept();
                            // Send to further approver/controller
                            var actionLabel;
                            var currentContributorRole = Lib.AP.WorkflowCtrl.workflowUI.GetRoleAt(sequenceStep);
                            if (currentContributorRole === Lib.AP.WorkflowCtrl.roles.controller) {
                                actionLabel = Language.CreateLazyTranslation("_Add controller requested");
                            }
                            else {
                                actionLabel = Language.CreateLazyTranslation("_Add approver requested");
                            }
                            var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                            // Next approver has already been added in customscript
                            var contributionData = getContributionData(sequenceStep + 1, this.actions.requestFurtherApproval.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                                onBehalfOf: true,
                                action: actionLabel
                            });
                            // Next approver has already been added in customscript. Contributor at current index is "further approver".
                            Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep, contributionData);
                            forward();
                            if (Sys.Parameters.GetInstance("AP").GetParameter("WorkflowEnableNewInvoiceNotifications") === "1") {
                                WorkflowCtrl.NotificationCtrl.EmailNotifyContributor(currentContributor);
                            }
                            WorkflowCtrl.NotificationCtrl.NotifyContributorOnMobile(currentContributor);
                            WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
                            Lib.AP.CommentHelper.UpdateHistory(actionLabel);
                            Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApprove);
                        },
                        image: "AP_WorkflowSubmit.png"
                    },
                    onHold: {
                        OnDone: function (sequenceStep) {
                            Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.OnHold);
                            Process.PreventApproval();
                            var action = Language.CreateLazyTranslation("_Set on hold history");
                            var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                            var contributionData = getContributionData(sequenceStep, this.actions.onHold.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                                onBehalfOf: true,
                                action: action,
                                reason: Data.GetValue("AsideReason__")
                            });
                            Lib.AP.CommentHelper.UpdateHistory(action, true);
                            Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep, contributionData);
                            WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
                        },
                        image: "AP_WorkflowOnHold.png"
                    },
                    ERPIntegrationError: {
                        image: "AP_WorkflowIntegrationError.png"
                    },
                    continueAfterERPAck: {
                        OnDone: function (sequenceStep) {
                            // ERP Ack received - Reset transaction so that AP can repost with fixes
                            Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                            WorkflowCtrl.ExpirationHelper.ResetValidity();
                            var touchless = Data.GetValue("TouchlessDone__");
                            var postShouldBeCompleted = true;
                            if (ERPIntegrationHelper.IsInError()) {
                                postShouldBeCompleted = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.BypassERPError", Data.GetValue("ERPPostingError__"), Data.GetValue("ERPInvoiceNumber__"));
                                if (!postShouldBeCompleted) {
                                    ERPIntegrationHelper.SetInvoiceInError();
                                }
                                var contributionData = void 0;
                                var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                                var currentActions = getCurrentActions(currentContributor, sequenceStep, touchless);
                                var comment = Lib.AP.CommentHelper.GetReliableComment();
                                if (comment) {
                                    // Keep post comment before posting error description
                                    var postHistory = Lib.AP.CommentHelper.ComputeLazyHistoryLine(currentActions, comment, getOnBehalfValidator(sequenceStep), true);
                                    var integrationErrorHistory = Lib.AP.CommentHelper.ComputeLazyHistoryLine(Language.CreateLazyTranslation("_ERP posting error"), Language.CreateLazyTranslation("{0}", Data.GetValue("ERPPostingError__")), null, true);
                                    contributionData = getContributionData(sequenceStep, workflowUIParameters.actions.ERPIntegrationError.GetName(), Language.CreateLazyTranslation("{0}\n{1}", postHistory, integrationErrorHistory));
                                }
                                else {
                                    contributionData = getContributionData(sequenceStep, workflowUIParameters.actions.ERPIntegrationError.GetName(), Language.CreateLazyTranslation("{0}", Data.GetValue("ERPPostingError__")), {
                                        action: Language.CreateLazyTranslation("_ERP posting error")
                                    });
                                }
                                // revert po Items values if required
                                var shouldUpdateTables = !Lib.ERP.IsSAP() &&
                                    (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.DeactivateLocalPOTableUpdates") !== true) &&
                                    (Lib.AP.InvoiceType.isPOInvoice() || Lib.AP.InvoiceType.isPOGLInvoice()) &&
                                    !Transaction.Read("UPDATE_PO_ON_INTEGRATION_ERROR");
                                if (shouldUpdateTables) {
                                    // eslint-disable-next-line dot-notation
                                    Lib.AP["TablesUpdater"].Update(true, Lib.AP.GetInvoiceDocument().ShouldUpdateVendorNumberOnPOHeaderAndItems());
                                    Transaction.Write("UPDATE_PO_ON_INTEGRATION_ERROR", "1");
                                }
                                Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep, contributionData);
                                if (!postShouldBeCompleted) {
                                    forward();
                                }
                                if (currentActions) {
                                    Lib.AP.CommentHelper.AddLine(currentActions[0], Lib.AP.CommentHelper.GetReliableComment(), touchless ? null : currentContributor.name);
                                }
                                Lib.AP.CommentHelper.AddLine(Language.Translate("_ERP posting error"), Data.GetValue("ERPPostingError__"));
                            }
                            //manage holds
                            if (Variable.GetValueAsString("ScheduledActionParameters")) {
                                Lib.AP.WorkflowCtrl.manageHolds();
                            }
                            if (postShouldBeCompleted) {
                                ERPIntegrationHelper.ResetError();
                                completePost(true, sequenceStep, touchless);
                            }
                            Lib.AP.ERPAcknowledgment.SendActionToErpAcknowledgmentProcess(Data.GetValue("ERPAckRuidEx__"), Lib.AP.ERPAcknowledgment.Actions.ErpAcknowledgmentProcessed);
                        }
                    },
                    onExpiration: {
                        OnDone: function (sequenceStep) {
                            WorkflowCtrl.ExpirationHelper.OnExpiration(sequenceStep, "onExpiration");
                        }
                    },
                    checkGoodsReceipt: {
                        OnDone: function (sequenceStep) {
                            // Check if new GR have been received
                            var checkGRResult;
                            if (Lib.ERP.IsSAP() && !Lib.AP.InvoiceType.isPOGLInvoice()) {
                                // eslint-disable-next-line dot-notation
                                checkGRResult = Lib.AP.SAP.PurchaseOrder["CheckGoodsReceipt"]();
                            }
                            else {
                                // eslint-disable-next-line dot-notation
                                checkGRResult = Lib.AP.PurchaseOrder["CheckGoodsReceipt"]();
                            }
                            if (checkGRResult && checkGRResult.orderNumbers.length > 0) {
                                Log.Info("New GR found, line items were updated and invoice is set back To Verify");
                                var orderNumbersString = checkGRResult.orderNumbers.length === 1 ? checkGRResult.orderNumbers : checkGRResult.orderNumbers.join(", ");
                                Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToVerify);
                                Data.SetValue("AsideReason__", "");
                                var comment = !checkGRResult.deliveryNotes || checkGRResult.deliveryNotes.length === 0 ? Language.CreateLazyTranslation("_Goods receipt updated for the following orders :{0}", orderNumbersString) : Language.CreateLazyTranslation("_Goods receipts ({1}) updated for the following orders :{0}", orderNumbersString, checkGRResult.deliveryNotes.join(", "));
                                var contributionData = getContributionData(sequenceStep, this.actions.checkGoodsReceipt.GetName(), comment);
                                Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep, contributionData);
                                Lib.AP.CommentHelper.UpdateHistory(comment, false, true, true);
                            }
                        },
                        image: "AP_WorkflowBacktoAP.png"
                    },
                    onHoldExpiration: {
                        OnDone: function (sequenceStep) {
                            Log.Info("Action call after on Hold expiration, invoice is set back To Approve");
                            Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApprove);
                            Data.SetValue("Comment__", "");
                            Data.SetValue("AsideReason__", "");
                            var comment = Language.CreateLazyTranslation("_OnHold status expires");
                            var contributionData = getContributionData(sequenceStep, this.actions.onHoldExpiration.GetName(), comment);
                            Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep, contributionData);
                            forward();
                        },
                        image: "AP_OnHoldExpiration.png"
                    },
                    toUnblockPayment: {
                        image: "AP_UnblockPayment.png"
                    },
                    unblockPaymentError: {
                        image: "AP_UnblockPaymentFailed.png"
                    },
                    unblockPaymentManually: {
                        OnDone: function (sequenceStep) {
                            var contributionData = getContributionData(sequenceStep, workflowUIParameters.actions.unblockPaymentManually.GetName(), null, {
                                action: Language.CreateLazyTranslation("unblockPaymentManually"),
                                noUser: true
                            });
                            contributionData.comment = Language.CreateLazyTranslation("_UnblockPaymentSkipped");
                            Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributionData);
                        },
                        image: "AP_UnblockPaymentRecovered.png"
                    },
                    unblockPaymentRetry: {
                        OnDone: function (sequenceStep) {
                            var contributionData = getContributionData(sequenceStep, workflowUIParameters.actions.unblockPaymentRetry.GetName(), null, {
                                action: Language.CreateLazyTranslation("unblockPaymentRetry"),
                                noUser: true
                            });
                            contributionData.comment = Language.CreateLazyTranslation("_Unblock payment recovered automatically");
                            Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributionData);
                        },
                        image: "AP_UnblockPaymentRecovered.png"
                    },
                    edit: {
                        image: "AP_InvoiceEdited.png"
                    },
                    reverseInvoice: {
                        OnDone: function (sequenceStep) {
                            Data.SetValue("InvoiceStatus__", "Reversed");
                            var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                            var user = {
                                login: currentContributor.login,
                                emailAddress: currentContributor.email,
                                displayName: currentContributor.displayName
                            };
                            var lastValidator = getValidatorUser();
                            if (lastValidator) {
                                user.login = lastValidator.GetValue("Login");
                                user.displayName = lastValidator.GetValue("DisplayName");
                                user.emailAddress = lastValidator.GetValue("EmailAddress");
                            }
                            AddReverseInvoiceInformation(user, true);
                        },
                        image: "AP_ReversedInvoice.png"
                    },
                    waitForClearing: {
                        OnDone: function (sequenceStep) {
                            waitForClearing(sequenceStep);
                        },
                        image: "AP_ReversedInvoice.png"
                    },
                    clearingDone: {
                        OnDone: function (sequenceStep) {
                            var action = Language.CreateLazyTranslation("_Clearing done");
                            Log.Info("Action call after clearingDone, invoice is set to To Pay");
                            Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.ToPay);
                            var contributionData = getContributionData(sequenceStep, this.actions.setAside.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                                action: action,
                                onBehalfOf: true
                            });
                            Lib.AP.CommentHelper.UpdateHistory(action, true);
                            Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributionData);
                        },
                        image: "AP_ReversedInvoice.png"
                    },
                    clearingTimeout: {
                        OnDone: function (sequenceStep) {
                            // Restore validityDateTime, expirationBehavior
                            WorkflowCtrl.ExpirationHelper.OnExpiration(sequenceStep, "clearingTimeout");
                        },
                        image: "AP_WorkflowIntegrationError.png"
                    }
                },
                mappingTable: {
                    workflowIndex: "WorkflowIndex__",
                    tableName: "ApproversList__",
                    columns: {
                        Approver__: {
                            data: "name"
                        },
                        ApproverID__: {
                            data: "login"
                        },
                        ApproverLabelRole__: {
                            data: "role",
                            translate: true
                        },
                        ApprovalDate__: {
                            data: "date"
                        },
                        Approved__: {
                            // For mobile apps compatibility
                            data: "approved"
                        },
                        ApproverComment__: {
                            data: "comment"
                        },
                        ApproverAction__: {
                            data: "action"
                        },
                        WRKFIsGroup__: {
                            data: "isGroup"
                        },
                        ApprovalRequestDate__: {
                            data: "startingDate"
                        },
                        ActualApprover__: {
                            data: "actualApprover"
                        }
                    },
                    // HTML Page script
                    OnRefreshRow: function (index) {
                        var table = Lib.AP.WorkflowCtrl.controlsObject[this.mappingTable.tableName];
                        var row = table.GetRow(index);
                        if (!row || !row.ApproverAction__.GetValue()) {
                            return;
                        }
                        row.Approver__.SetImageURL(Lib.P2P.GetP2PUserImage(row.WRKFIsGroup__.GetValue()), true);
                        var sequenceIndex = Lib.AP.WorkflowCtrl.workflowUI.GetTableIndex();
                        var tableIndex = row[this.mappingTable.workflowIndex].GetValue();
                        if (tableIndex < sequenceIndex) {
                            // refresh of rows containning the history
                            // TODO: user/group image for past approvers
                            if (row.ApproverAction__.GetValue()) {
                                row.ApproverLabelRole__.SetImageURL(this.actions[row.ApproverAction__.GetValue()].image, false);
                            }
                            table.HideTableRowAddForItem(index, true);
                            table.HideTableRowDeleteForItem(index, true);
                            row.Approver__.SetBrowsable(false);
                            highlightCurrentStep(row, true);
                        }
                        else {
                            var contributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(row);
                            if (contributor) {
                                setActionsButtonsForWorkflowRow(table, row, contributor);
                                row.ApproverLabelRole__.SetImageURL(this.actions[contributor.action].image, false);
                                highlightCurrentStep(row, Boolean(contributor.date));
                            }
                        }
                        // parallel workflow image handling
                        var image = Lib.AP.WorkflowCtrl.workflowUI.GetParallelImageType(tableIndex);
                        if (image !== null) {
                            row.WRKFParallelMarker__.SetImageURL("P2P_Workflow_parallel_".concat(image, ".png"), false);
                        }
                        else {
                            // remove image if any
                            row.WRKFParallelMarker__.SetImageURL();
                        }
                        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnRefreshApproversListRowEnd", this, table, row, index);
                    }
                },
                roles: {
                    apStart: {
                        OnBuild: function (callback) {
                            return onBuildAPStart(callback);
                        }
                    },
                    apEnd: {
                        OnBuild: function (callback) {
                            return onBuildAPEnd(callback);
                        }
                    },
                    controller: {
                        OnBuild: function (callback) {
                            return onBuildController(callback, Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ControllersList"), Lib.AP.WorkflowCtrl.roles.controller, this.actions.toApprove.GetName());
                        }
                    },
                    approver: {
                        OnBuild: function (callback) {
                            return onBuildApprover(callback, Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ApproversList"), Lib.AP.WorkflowCtrl.roles.approver, this.actions.toApprove.GetName());
                        }
                    }
                },
                delayedData: {
                    isGroup: {
                        type: "isGroupInfo",
                        key: "login"
                    }
                },
                buildingCounter: 0,
                callbacks: {
                    OnError: function (msg) {
                        if (typeof Process.PreventApproval !== "undefined") {
                            // server-side only
                            Process.PreventApproval();
                        }
                        // alerts immediatly when possible to any errors from WorkflowEngine (only)
                        if (Sys.ScriptInfo.IsClient() && msg instanceof Sys.WorkflowEngine.Error) {
                            Sys.Helpers.Globals.Popup.Alert(msg, true, null, "_Error");
                            Log.Error(msg.toRawErrorString());
                        }
                        else {
                            Variable.SetValueAsString("WorkflowError", msg);
                            Log.Error(msg);
                        }
                    },
                    OnBuilding: function () {
                        if (Lib.AP.WorkflowCtrl.controlsObject && Lib.AP.WorkflowCtrl.layoutHelper) {
                            this.buildingCounter++;
                            Lib.AP.WorkflowCtrl.layoutHelper.DisableButtons(true, "WKFBuilding");
                            Lib.AP.WorkflowCtrl.controlsObject.ComputingWorkflow__.Hide(false);
                            Lib.AP.WorkflowCtrl.processInstanceObject.SetSilentChange(true);
                        }
                    },
                    OnBuilt: function () {
                        if (Lib.AP.WorkflowCtrl.controlsObject && Lib.AP.WorkflowCtrl.layoutHelper) {
                            while (this.buildingCounter > 0) {
                                this.buildingCounter--;
                                Lib.AP.WorkflowCtrl.layoutHelper.DisableButtons(false, "WKFBuilding");
                            }
                            Lib.AP.WorkflowCtrl.controlsObject.ComputingWorkflow__.Hide(true);
                            Lib.AP.WorkflowCtrl.processInstanceObject.SetSilentChange(false);
                            Lib.AP.WorkflowCtrl.layoutHelper.UpdateButtonBar();
                            Lib.AP.WorkflowCtrl.UpdateLayout();
                            // Reset required because columns can be required dependant on the workflow
                            Lib.AP.WorkflowCtrl.layoutHelper.RecomputeRequired();
                            // Display error message for empty required columns
                            Lib.AP.WorkflowCtrl.layoutHelper.RevalidateLineItems();
                        }
                    },
                    OnValidateContributor: function (contributor, doneCallback) {
                        Lib.P2P.CompleteUsersInformations([contributor], ["displayname"], function (users) {
                            if (users && users.length > 0) {
                                var localContributor = getContributor(contributor.role, contributor.login);
                                if (localContributor) {
                                    localContributor.exists = users[0].exists;
                                }
                                doneCallback(validateUserExists(users[0], contributor));
                            }
                        });
                    }
                }
            };
            var customWorkflowUIParameters = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.ExtendWorkflowParameters", workflowUIDefaultParameters, getContributionData);
            var workflowUIParameters = Sys.Helpers.Extend({}, workflowUIDefaultParameters, customWorkflowUIParameters);
            // Globals
            WorkflowCtrl.processInstanceObject = null;
            WorkflowCtrl.controlsObject = null;
            WorkflowCtrl.userObject = null;
            WorkflowCtrl.usersObject = null;
            // Helpers
            WorkflowCtrl.budgetManager = null;
            WorkflowCtrl.layoutHelper = null;
            // Lib workflow object
            WorkflowCtrl.workflowUI = null;
            WorkflowCtrl.allowApprovers = true;
            WorkflowCtrl.additionalApprovers = null;
            WorkflowCtrl.exceptionApprovers = null;
            // Available roles
            WorkflowCtrl.roles = {
                apStart: "_Role APStart",
                controller: "_Role controller",
                apEnd: "_Role APEnd",
                approver: "_Role approver",
                vendor: "_Role vendor"
            };
            // List of contributors (all login with at least read right) added
            WorkflowCtrl.contributorsAdded = null;
            // Helper variables to avoid repetition of strings
            var mergerFunction = "Lib.Workflow.Customization.Common.OverrideMerger";
            /**
             * Initializes the workflow control for AP.
             * @memberof Lib.AP.WorkflowCtrl
             * @export
             * @param {Object} [controlsObj] Flexible Form's Controls object.
             * @param {Object} [userObj] Flexible Form's User object.
             * @param {Object} [processInstanceObj] Flexible Form's ProcessInstance object.
             * @param {Object} [layoutHelperObj] processus' LayoutHelpers object.
             * @param {Object} [erpInvoiceDocument] processus' InvoiceDocument object.
             */
            function Init(controlsObj, userObj, processInstanceObj, layoutHelperObj, erpInvoiceDocument) {
                Lib.AP.WorkflowCtrl.controlsObject = controlsObj;
                Lib.AP.WorkflowCtrl.userObject = userObj;
                Lib.AP.WorkflowCtrl.processInstanceObject = processInstanceObj;
                Lib.AP.WorkflowCtrl.layoutHelper = layoutHelperObj;
                Lib.AP.WorkflowCtrl.contributorsAdded = [];
                if (typeof erpInvoiceDocument === "object") {
                    Lib.AP.WorkflowCtrl.allowApprovers = erpInvoiceDocument.AllowApprovers();
                }
                else {
                    Lib.AP.WorkflowCtrl.allowApprovers = true;
                }
                if (Lib.AP.WorkflowCompatibility) {
                    Lib.AP.WorkflowCompatibility.MigrateWorkflow(Sys.WorkflowController.Create(Data, Variable, Language, Lib.AP.WorkflowCtrl.controlsObject, WorkflowCtrl.userObject), Data.GetTable(workflowUIParameters.mappingTable.tableName));
                }
                Lib.AP.WorkflowCtrl.workflowUI = Sys.WorkflowController.Create(Data, Variable, Language, Lib.AP.WorkflowCtrl.controlsObject, WorkflowCtrl.userObject);
                Lib.AP.WorkflowCtrl.workflowUI.Define(workflowUIParameters);
                if (Lib.AP.WorkflowCtrl.controlsObject && (Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex() > 0 || Lib.AP.WorkflowCtrl.processInstanceObject.isReadOnly)) {
                    Lib.AP.WorkflowCtrl.controlsObject[workflowUIParameters.mappingTable.tableName].HideTableRowDeleteForItem(-1, true);
                }
            }
            WorkflowCtrl.Init = Init;
            /**
             * Updates the layout according the current workflow step.
             * @memberof Lib.AP.WorkflowCtrl
             */
            function UpdateLayout() {
                if (Lib.AP.WorkflowCtrl.controlsObject) {
                    var approversTableCtrl = Lib.AP.WorkflowCtrl.controlsObject[workflowUIParameters.mappingTable.tableName];
                    approversTableCtrl.SetWidth("100%");
                    approversTableCtrl.SetExtendableColumn("ApproverComment__");
                    // Make sure that at least the last 4 steps and the current step is displayed by default
                    // and that following steps are displayed (upon to 5)
                    var tIdx1 = Lib.AP.WorkflowCtrl.workflowUI.GetTableIndex() - 4;
                    tIdx1 = tIdx1 < 0 ? 0 : tIdx1;
                    var tIdx2 = approversTableCtrl.GetItemCount() - 10;
                    if (approversTableCtrl.GetItemCount() >= 10) {
                        approversTableCtrl.DisplayItem(approversTableCtrl.GetItemCount() - 1);
                        approversTableCtrl.DisplayItem(tIdx1 < tIdx2 ? tIdx1 : tIdx2);
                    }
                    else {
                        approversTableCtrl.DisplayItem(0);
                    }
                }
            }
            WorkflowCtrl.UpdateLayout = UpdateLayout;
            /**
             * Includes a list of approvers.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {Sys.WorkflowController.IWorkflowUser[]} approverList
             * @returns {Sys.WorkflowController.IWorkflowUser[]}
             */
            function IncludeAdditionalApprovers(approverList) {
                if (Lib.AP.WorkflowCtrl.additionalApprovers) {
                    var allowBuildOfApprovers = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.OnBuildOfApprovers");
                    if (typeof allowBuildOfApprovers !== "boolean") {
                        allowBuildOfApprovers = true;
                    }
                    moveAdditionalApproversToApproversList(allowBuildOfApprovers, approverList);
                }
                return approverList;
            }
            WorkflowCtrl.IncludeAdditionalApprovers = IncludeAdditionalApprovers;
            /**
             * Pushes the additional approvers at the end of the approvers list or the list of contributors.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {boolean} allowBuildOfApprovers True to add to the user to the ApproversList, false to add them using the AddContributorAt method (as manual user added).
             * @param {Sys.WorkflowController.IWorkflowUser[]} approverList The current approverList where the contributor will be added if allowBuildOfApprovers is True.
            */
            function moveAdditionalApproversToApproversList(allowBuildOfApprovers, approverList) {
                for (var _i = 0, _a = Lib.AP.WorkflowCtrl.additionalApprovers; _i < _a.length; _i++) {
                    var additional = _a[_i];
                    if (!additional) {
                        continue;
                    }
                    if (!allowBuildOfApprovers) {
                        var additionals = Lib.AP.WorkflowCtrl.workflowUI.GetAdditionalContributors("approver");
                        Lib.AP.WorkflowCtrl.workflowUI.AddContributorAt(additionals ? additionals.length + 1 : 1, additional, "approver");
                    }
                    else {
                        approverList.push({
                            login: additional.login,
                            emailAddress: additional.email,
                            displayName: additional.name
                        });
                    }
                }
                Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ApproversList", approverList);
                delete Lib.AP.WorkflowCtrl.additionalApprovers;
            }
            /**
             * Includes a list of approvers for exceptions.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {Sys.WorkflowController.IWorkflowUser[]} approverList
             * @returns {Sys.WorkflowController.IWorkflowUser[]}
             */
            function IncludeExceptionApprovers(approverList) {
                Log.Info("WorkflowCtrl.IncludeExceptionApprovers");
                if (Lib.AP.WorkflowCtrl.exceptionApprovers) {
                    approverList = Lib.AP.WorkflowCtrl.exceptionApprovers.concat(approverList);
                    Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ApproversList", approverList);
                    delete Lib.AP.WorkflowCtrl.exceptionApprovers;
                }
                return approverList;
            }
            WorkflowCtrl.IncludeExceptionApprovers = IncludeExceptionApprovers;
            /**
            * Return the users who already approved and the current user for a role.
            * The active role must the same as the requested role else the returned
            * list will be empty.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {string} role The role of the users to returned.
             * @returns {Sys.WorkflowController.IWorkflowUser[]} An array of users.
            */
            function GetUsersToKeepOnRoleUpdate(role) {
                return Lib.AP.WorkflowCtrl.workflowUI.GetUsersToKeepOnRoleUpdate(role, function (contributor) {
                    // The manually added contributor are directly inserted in the ControllerList instead of
                    // being still considered as manually and added at the end
                    if (contributor.isAdditional === true) {
                        Lib.AP.WorkflowCtrl.workflowUI.RemoveAdditionalContributor(contributor.contributorId);
                    }
                });
            }
            WorkflowCtrl.GetUsersToKeepOnRoleUpdate = GetUsersToKeepOnRoleUpdate;
            /**
             * Merges two lists of users and merge the last user of the previousList with the first
            * user of the newList if it is the same.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {Sys.WorkflowController.IWorkflowUser[]} previousList The previous active contributors for this role.
             * @param {Sys.WorkflowController.IWorkflowUser[]} newList The previous active contributors for this role.
             * @returns {Sys.WorkflowController.IWorkflowUser[]} The merged list.
            */
            function MergeRecomputedActiveRole(previousList, newList) {
                return Lib.AP.WorkflowCtrl.workflowUI.MergeRecomputedActiveRole(previousList, newList);
            }
            WorkflowCtrl.MergeRecomputedActiveRole = MergeRecomputedActiveRole;
            /**
             * Constructs the default options used to create the fields mapping.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {object[]} lineItems The Table that store the LineItems.
             * @param {string} workflowType define the type of workflow.
             * @param {function} function to retrieve the first controller login on the workflow.
             * @returns {Lib.P2P.MappingOptions} A MappingOptions with default values for approvers.
            */
            function GetContributorsDefaultMapping(lineItems, workflowType, firstControllerFunction) {
                var values = {
                    "WorkflowType__": workflowType
                };
                if (workflowType === "invoiceExceptionForApprovers" || workflowType === "paymentApproval") {
                    values.FirstInvoiceApprover__ = firstControllerFunction();
                }
                else if (workflowType === "invoiceException" || workflowType === "invoiceReview") {
                    values.FirstInvoiceController__ = firstControllerFunction();
                }
                return {
                    exchangeRate: Data.GetValue("ExchangeRate__"),
                    lineItems: lineItems,
                    amountColumnName: "Amount__",
                    baseFieldsMapping: {
                        "values": values
                    },
                    keepEmpty: true
                };
            }
            WorkflowCtrl.GetContributorsDefaultMapping = GetContributorsDefaultMapping;
            /**
             * Checks that the workflow definition contains the Dimension fields.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {boolean} True is dimension is available, false if not.
            */
            function IsDimensionAvailable() {
                var available = false;
                Sys.WorkflowDefinition.Extend({
                    dbRules: false,
                    success: function (workflowDefinition) {
                        available = typeof workflowDefinition.fields.GroupByDimension__ !== "undefined";
                    }
                });
                return available;
            }
            WorkflowCtrl.IsDimensionAvailable = IsDimensionAvailable;
            /**
             * Computes the fields mapping used to build the workflow.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {Lib.P2P.MappingOptions} mapping a base mapping to be completed and used to build the mapping.
             * @param {string} workflowRole define the kind of workflow to be compute.
             * @param {boolean} groupingByDimensions a boolean to specified if we are grouping by dimensions (append Cost center and G/L Account dimensions to workflow computation).
             * @returns {any[]} fields mapping.
            */
            function GetContributorsWorkflowFieldsMapping(mapping, workflowRole, groupingByDimensions) {
                var fieldsMapping;
                var userExitMapping = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.OnBuildFieldsMapping", workflowRole, mapping.baseFieldsMapping, mapping);
                if (userExitMapping) {
                    fieldsMapping = userExitMapping;
                }
                else if (groupingByDimensions) {
                    mapping.fieldsDefinition = {
                        "computationFieldName": "WorkflowAmount__"
                    };
                    // User exit not implemented, create the mapping based on the axis Cost Center and G/Laccount
                    mapping.keyColumnName = "CostCenter__";
                    mapping.tableColumnName = "CostCenter__";
                    fieldsMapping = Lib.P2P.BuildFieldsMappingGeneric(mapping);
                    if (Lib.AP.WorkflowCtrl.IsDimensionAvailable()) {
                        mapping.keyColumnName = "GLAccount__";
                        mapping.tableColumnName = "Account__";
                        var fieldsGL = Lib.P2P.BuildFieldsMappingGeneric(mapping);
                        fieldsMapping = fieldsMapping.concat(fieldsGL);
                    }
                }
                else {
                    fieldsMapping = Lib.P2P.BuildFieldsMappingFromLineItems(mapping);
                }
                return fieldsMapping;
            }
            WorkflowCtrl.GetContributorsWorkflowFieldsMapping = GetContributorsWorkflowFieldsMapping;
            function GetApprovers(compute, callback, guessException) {
                if (compute && !Lib.AP.WorkflowCtrl.allowApprovers) {
                    Log.Info("Package is configured to avoid approvers in the worklow (Lib.AP.WorkflowCtrl.allowApprovers=false), LIB.AP.WorkflowCtrl.GetApprovers function is called but no approver will be added in the workflow.");
                }
                Log.Info("WorkflowCtrl.GetApprovers");
                compute = compute && Lib.AP.WorkflowCtrl.allowApprovers;
                var done = false;
                // Init workflow if balance is equal to 0 and the invoice type is Non-PO
                if (compute && workflowShouldBeComputed()) {
                    var lineItems = Data.GetTable("LineItems__");
                    if (lineItems && lineItems.GetItemCount() > 0) {
                        var manualException = Variable.GetValueAsString("manualExceptionType") === "_WorkflowType_Invoice exception for approvers";
                        Lib.AP.WorkflowCtrl.GetApproversForException(lineItems, guessException, manualException, callback);
                        done = true;
                    }
                }
                if (!done) {
                    callback();
                }
            }
            WorkflowCtrl.GetApprovers = GetApprovers;
            function GetApproversForApproval(lineItems, callback) {
                var approvalWorkflowCB = function (list /*, ruleApplied*/) {
                    handleCurrentUserInParallelBlock(list);
                    list = Lib.AP.WorkflowCtrl.IncludeAdditionalApprovers(list);
                    list = Lib.AP.WorkflowCtrl.IncludeExceptionApprovers(list);
                    Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ApproversList", list);
                    callback();
                };
                var mapping = Lib.AP.WorkflowCtrl.GetContributorsDefaultMapping(lineItems, "paymentApproval", getFirstInvoiceApprover);
                var merger = Sys.Helpers.TryCallFunction(mergerFunction, "AP-approvers");
                if (!merger) {
                    // FT-022747 - Support for parallel workflow for invoice approval
                    // Use parallel-enabled merger when at least one applied workflow rule is parallel.
                    merger = "ReversedByLevelParallelOnlyIfNecessary";
                }
                // Compute workflow
                var options = {
                    fields: Lib.AP.WorkflowCtrl.GetContributorsWorkflowFieldsMapping(mapping, "AP-approvers", true),
                    allowNoCCOwner: true,
                    companyCodeIsOptional: true,
                    merger: merger,
                    success: approvalWorkflowCB,
                    error: function (errorMessage) {
                        workflowUIParameters.callbacks.OnError(errorMessage);
                        callback();
                    }
                };
                Log.Info("call to P2P.GetApprovalWorkflow");
                Variable.SetValueAsString("WorkflowError", "");
                Lib.P2P.GetApprovalWorkflow(options, Lib.AP.WorkflowCtrl.layoutHelper);
            }
            WorkflowCtrl.GetApproversForApproval = GetApproversForApproval;
            function GetApproversForException(lineItems, guessException, isManualException, callback) {
                var controlWorkflowCB = function (list, ruleApplied) {
                    if (ruleApplied || isManualException) {
                        Lib.AP.WorkflowCtrl.exceptionApprovers = list;
                        var currentException = Data.GetValue("CurrentException__");
                        if (!currentException) {
                            Data.SetValue("CurrentException__", typeof ruleApplied === "undefined" ? "" : ruleApplied);
                            Variable.SetValueAsString("manualExceptionType", "_WorkflowType_Invoice exception for approvers");
                        }
                    }
                    if (!ruleApplied
                        && !Variable.GetValueAsString("isExtractionReviewException")
                        && Variable.GetValueAsString("manualExceptionType") != "_WorkflowType_Invoice exception") {
                        Data.SetValue("CurrentException__", "");
                    }
                    Lib.AP.WorkflowCtrl.GetApproversForApproval(lineItems, callback);
                };
                var mapping = Lib.AP.WorkflowCtrl.GetContributorsDefaultMapping(lineItems, "invoiceExceptionForApprovers", getFirstInvoiceApprover);
                mapping.columns = [["OrderNumber__", "PONumber__"], "Buyer__", "Receiver__", "ExpectedQuantity__", "Quantity__", "ExpectedAmount__", "Amount__"];
                mapping.emptyCheckFunction = isLineNotPostable;
                var merger = Sys.Helpers.TryCallFunction(mergerFunction, "AP-approvers");
                // Compute workflow
                var options = {
                    fields: Lib.AP.WorkflowCtrl.GetContributorsWorkflowFieldsMapping(mapping, "AP-approvers", false),
                    noRuleAppliedAction: "skip",
                    allowNoCCOwner: true,
                    companyCodeIsOptional: true,
                    merger: merger,
                    success: controlWorkflowCB,
                    error: function (errorMessage) {
                        workflowUIParameters.callbacks.OnError(errorMessage);
                        callback();
                    }
                };
                if (isManualException) {
                    // force rule in manual mode
                    mapping.baseFieldsMapping.values.WorkflowRuleName__ = Data.GetValue("CurrentException__");
                }
                Lib.P2P.GetApprovalWorkflow(options, Lib.AP.WorkflowCtrl.layoutHelper);
            }
            WorkflowCtrl.GetApproversForException = GetApproversForException;
            function GetControllersWorkflow(mapping, groupingByDimensions, forException, successCallback, errorCallback, nbRulesToApply) {
                var merger = Sys.Helpers.TryCallFunction(mergerFunction, "AP-controllers");
                if (!merger) {
                    // FT-022747 - Support for parallel workflow for invoice approval
                    // Use parallel-enabled merger when at least one applied workflow rule is parallel.
                    merger = "ReversedByLevelParallelOnlyIfNecessary";
                }
                var options = {
                    fields: Lib.AP.WorkflowCtrl.GetContributorsWorkflowFieldsMapping(mapping, "AP-controllers", groupingByDimensions),
                    noRuleAppliedAction: forException ? "skip" : "error",
                    allowNoCCOwner: true,
                    companyCodeIsOptional: true,
                    merger: merger,
                    success: successCallback,
                    nbRulesToApply: nbRulesToApply,
                    error: function (errorMessage) {
                        workflowUIParameters.callbacks.OnError(errorMessage);
                        errorCallback();
                    }
                };
                Variable.SetValueAsString("WorkflowError", "");
                if (options.fields && options.fields.length > 0) {
                    Log.Info("call to P2P.GetApprovalWorkflow");
                    Lib.P2P.GetApprovalWorkflow(options, Lib.AP.WorkflowCtrl.layoutHelper);
                }
                else {
                    // reset workflow
                    successCallback([]);
                }
            }
            WorkflowCtrl.GetControllersWorkflow = GetControllersWorkflow;
            function GetControllersForReview(lineItems, callback) {
                var usersToKeep = Lib.AP.WorkflowCtrl.GetUsersToKeepOnRoleUpdate(Lib.AP.WorkflowCtrl.roles.controller);
                var controlWorkflowCB = function (list /*, ruleApplied*/) {
                    if (usersToKeep) {
                        list = Lib.AP.WorkflowCtrl.MergeRecomputedActiveRole(usersToKeep, list);
                    }
                    handleCurrentUserInParallelBlock(list);
                    Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ControllersList", list);
                    callback();
                };
                var mapping = Lib.AP.WorkflowCtrl.GetContributorsDefaultMapping(lineItems, "invoiceReview", getFirstInvoiceController);
                Lib.AP.WorkflowCtrl.GetControllersWorkflow(mapping, true, true, controlWorkflowCB, callback);
            }
            WorkflowCtrl.GetControllersForReview = GetControllersForReview;
            function GetControllersForException(lineItems, guessException, isManualException, callback) {
                var usersToKeep = Lib.AP.WorkflowCtrl.GetUsersToKeepOnRoleUpdate(Lib.AP.WorkflowCtrl.roles.controller);
                var controlWorkflowCB = function (list, ruleApplied) {
                    if (guessException) {
                        Data.SetValue("CurrentException__", typeof ruleApplied === "undefined" ? "" : ruleApplied);
                    }
                    if (ruleApplied || isManualException) {
                        if (ruleApplied && guessException) {
                            Variable.SetValueAsString("isExtractionReviewException", true);
                        }
                        else {
                            Variable.SetValueAsString("isExtractionReviewException", "");
                        }
                        if (usersToKeep) {
                            list = Lib.AP.WorkflowCtrl.MergeRecomputedActiveRole(usersToKeep, list);
                        }
                        handleCurrentUserInParallelBlock(list);
                        Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ControllersList", list);
                        callback();
                    }
                    else {
                        Lib.AP.WorkflowCtrl.GetControllersForReview(lineItems, callback);
                    }
                };
                var mapping = Lib.AP.WorkflowCtrl.GetContributorsDefaultMapping(lineItems, "invoiceException", getFirstInvoiceController);
                mapping.columns = [["OrderNumber__", "PONumber__"], "Buyer__", "Receiver__", "ExpectedQuantity__", "Quantity__", "ExpectedAmount__", "Amount__", "TechnicalDetails__"];
                mapping.emptyCheckFunction = isLineNotPostable;
                if (isManualException) {
                    // force rule in manual mode
                    mapping.baseFieldsMapping.values.WorkflowRuleName__ = Data.GetValue("CurrentException__");
                }
                Lib.AP.WorkflowCtrl.GetControllersWorkflow(mapping, false, true, controlWorkflowCB, callback, 1);
            }
            WorkflowCtrl.GetControllersForException = GetControllersForException;
            function GetControllers(compute, guessException, callback) {
                Log.Info("WorkflowCtrl.GetControllers");
                var done = false;
                // Init workflow if balance is equal to 0 and the invoice type is Non-PO
                if (compute && workflowShouldBeComputed(true) && Data.GetValue("State") < 100) {
                    var lineItems = Data.GetTable("LineItems__");
                    if (lineItems && lineItems.GetItemCount() > 0) {
                        var exception = Data.GetValue("CurrentException__");
                        var manualException = exception && !guessException && Variable.GetValueAsString("manualExceptionType") != "_WorkflowType_Invoice exception for approvers";
                        if (guessException || manualException) {
                            Lib.AP.WorkflowCtrl.GetControllersForException(lineItems, guessException, manualException, callback);
                        }
                        else {
                            Lib.AP.WorkflowCtrl.GetControllersForReview(lineItems, callback);
                        }
                        done = true;
                    }
                }
                if (!done) {
                    callback();
                }
            }
            WorkflowCtrl.GetControllers = GetControllers;
            function updateSerializedWorkflowUsersList(role, serializedListName) {
                var contributorsList = Lib.AP.WorkflowCtrl.workflowUI.GetContributorsByRole(role);
                var serializedWorkflowUsersList = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue(serializedListName);
                if (contributorsList && serializedWorkflowUsersList) {
                    var newSerializedWorkflowUsersList = contributorsList.map(function (contributor) {
                        return Sys.Helpers.Array.Find(serializedWorkflowUsersList, function (element) {
                            return element.login === contributor.login;
                        });
                    });
                    Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue(serializedListName, newSerializedWorkflowUsersList);
                }
            }
            function UpdateParallelWorkflowCurrentUser(currentUser) {
                Lib.AP.WorkflowCtrl.workflowUI.UpdateParallelWorkflowCurrentUser(currentUser);
                // we also need to reorder serialized controller list
                updateSerializedWorkflowUsersList("controller", "ControllersList");
                // we also need to reorder serialized approvers list
                updateSerializedWorkflowUsersList("approver", "ApproversList");
            }
            WorkflowCtrl.UpdateParallelWorkflowCurrentUser = UpdateParallelWorkflowCurrentUser;
            /**
             * Initializes the roles sequences for the current workflow.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {boolean} computeApprovers flag to determine if approvers should be rebuilt.
             * @param {boolean} computeControllers flag to determine if controllers should be rebuilt.
             * @param {boolean} guessException flag to determine if we should guess exception workflow.
             */
            function InitRolesSequence(computeApprovers, computeControllers, guessException) {
                if (Lib.AP.WorkflowCtrl.processInstanceObject && Lib.AP.WorkflowCtrl.processInstanceObject.isEditing) {
                    return;
                }
                if (Sys.Parameters.GetInstance("AP").GetParameter("WorkflowDisableRules") === "1") {
                    computeApprovers = false;
                    computeControllers = false;
                }
                var nExpectedCallbackCalls = 2;
                var getContributorsCallback = function () {
                    if (computeApprovers || computeControllers) {
                        // display the current approver step before recomputing the workflow
                        Lib.AP.WorkflowCtrl.UpdateLayout();
                    }
                    // Refresh workflow table only once all responses are received
                    nExpectedCallbackCalls--;
                    if (nExpectedCallbackCalls === 0) {
                        Lib.AP.WorkflowCtrl.workflowUI.AllowRebuild(true);
                        Lib.AP.WorkflowCtrl.workflowUI.SetRolesSequence(["apStart", "controller", "apEnd", "approver"]);
                    }
                };
                Lib.AP.WorkflowCtrl.GetControllers(computeControllers, guessException, getContributorsCallback);
                Lib.AP.WorkflowCtrl.GetApprovers(computeApprovers, getContributorsCallback, guessException);
            }
            WorkflowCtrl.InitRolesSequence = InitRolesSequence;
            /**
             * Enables/disables the workflow rebuilding.
             * @param {boolean} allowRebuild
             */
            function AllowRebuild(allowRebuild) {
                Lib.AP.WorkflowCtrl.workflowUI.AllowRebuild(allowRebuild);
            }
            WorkflowCtrl.AllowRebuild = AllowRebuild;
            function SetObject(name, obj) {
                Lib.AP.WorkflowCtrl[name] = obj;
            }
            WorkflowCtrl.SetObject = SetObject;
            /**
             * Performs specified workflow action.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {string} actionName action to perform.
             */
            function DoAction(actionName) {
                Log.Info("DoAction " + actionName);
                cleanManuallyAddedFlags();
                Lib.AP.WorkflowCtrl.workflowUI.DoAction(actionName);
            }
            WorkflowCtrl.DoAction = DoAction;
            var timer = 0;
            /**
             * Rebuilds the workflow in a delayed way.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {boolean} computeApprovers flag to determine if approvers should be rebuilt.
             * @param {boolean} computeControllers flag to determine if controllers should be rebuilt.
             * @param {boolean} guessException flag to determine if we should guess exception workflow.
             */
            function DelayRebuildWorkflow(computeApprovers, computeControllers, guessException) {
                if (Lib.AP.WorkflowCtrl.IsEnded()) {
                    return;
                }
                if (timer === 0) {
                    // Cannot submit when workflow update pending
                    Log.Info("[DelayRebuildWorkflow] start");
                    if (Lib.AP.WorkflowCtrl.controlsObject && Lib.AP.WorkflowCtrl.layoutHelper) {
                        Lib.AP.WorkflowCtrl.layoutHelper.DisableButtons(true, "WKFDelayBuilding");
                        Lib.AP.WorkflowCtrl.controlsObject.ComputingWorkflow__.Hide(false);
                    }
                }
                else {
                    // cancel previous call
                    Log.Info("[DelayRebuildWorkflow] start and cancel previous");
                    clearTimeout(timer);
                }
                // Delay workflow rebuild
                timer = setTimeout(function () {
                    Log.Info("[DelayRebuildWorkflow] trigger (" + computeApprovers + ", " + computeControllers + ", " + guessException + ")");
                    timer = 0;
                    if (Lib.AP.WorkflowCtrl.layoutHelper) {
                        Lib.AP.WorkflowCtrl.layoutHelper.DisableButtons(false, "WKFDelayBuilding");
                    }
                    var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex());
                    if (currentContributor && (currentContributor.role === Lib.AP.WorkflowCtrl.roles.apStart || currentContributor.role === Lib.AP.WorkflowCtrl.roles.controller)) {
                        Lib.AP.WorkflowCtrl.InitRolesSequence(computeApprovers, computeControllers, guessException);
                    }
                    else {
                        Lib.AP.WorkflowCtrl.controlsObject.ComputingWorkflow__.Hide(true);
                    }
                }, 500);
            }
            WorkflowCtrl.DelayRebuildWorkflow = DelayRebuildWorkflow;
            /**
             * Rebuilds the workflow.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {boolean} computeApprovers flag to determine if approvers should be rebuilt.
             * @param {boolean} computeControllers flag to determine if controllers should be rebuilt.
             * @param {string} [actionName] action triggering the event.
             */
            function Rebuild(computeApprovers, computeControllers, actionName) {
                if (Lib.AP.WorkflowCtrl.processInstanceObject && (Lib.AP.WorkflowCtrl.processInstanceObject.isReadOnly || Lib.AP.WorkflowCtrl.processInstanceObject.isEditing)) {
                    // Never rebuild in readonly or editing
                    return;
                }
                // disable review workflow in draft mode (ERPAck with both id and error)
                if (Lib.AP.DraftInERP()) {
                    computeControllers = false;
                }
                if (actionName) {
                    //call to deprecated client side only user exit
                    var deprecatedComputeControllersUserExit = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.Workflow.OnBuildOfReviewers", {
                        name: actionName
                    }, computeControllers);
                    var computeControllersUserExit = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.OnBuildOfReviewers", {
                        name: actionName
                    }, computeControllers);
                    if (typeof computeControllersUserExit === "boolean") {
                        computeControllers = computeControllersUserExit;
                    }
                    else if (typeof deprecatedComputeControllersUserExit === "boolean") {
                        computeControllers = deprecatedComputeControllersUserExit;
                    }
                    var allowBuildOfApprovers = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.OnBuildOfApprovers");
                    if (typeof allowBuildOfApprovers === "boolean") {
                        computeApprovers = allowBuildOfApprovers;
                    }
                }
                var guessExceptionStandard = Lib.AP.isActionAutoComplete();
                var guessExceptionUE = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.AutoGuessException", {
                    name: actionName
                }, computeControllers, computeApprovers);
                var guessException = typeof guessExceptionUE !== "boolean" ? guessExceptionStandard : guessExceptionUE;
                if (Lib.AP.WorkflowCtrl.processInstanceObject) {
                    Lib.AP.WorkflowCtrl.DelayRebuildWorkflow(computeApprovers, computeControllers, guessException);
                }
                else {
                    // No delay in server side scripts
                    Lib.AP.WorkflowCtrl.InitRolesSequence(computeApprovers, computeControllers, guessException);
                }
            }
            WorkflowCtrl.Rebuild = Rebuild;
            /**
             * Updates workflow when the cost center is updated.
             * @memberof Lib.AP.WorkflowCtrl
             */
            function UpdateWorkflowOnCostCenterUpdate() {
                Lib.AP.WorkflowCtrl.UpdateWorkflowOnDimensionUpdate("costCenterUpdated");
            }
            WorkflowCtrl.UpdateWorkflowOnCostCenterUpdate = UpdateWorkflowOnCostCenterUpdate;
            /**
             * Updates workflow when the G/L account is updated.
             * @memberof Lib.AP.WorkflowCtrl
             */
            function UpdateWorkflowOnAccountUpdate() {
                Lib.AP.WorkflowCtrl.UpdateWorkflowOnDimensionUpdate("glAccountUpdated");
            }
            WorkflowCtrl.UpdateWorkflowOnAccountUpdate = UpdateWorkflowOnAccountUpdate;
            /**
             * Updates workflow when a dimension is updated.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {string} actionName the action triggering the event.
             */
            function UpdateWorkflowOnDimensionUpdate(actionName) {
                if (Lib.AP.InvoiceType.isGLInvoice()) {
                    var currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                    if (currentRole === Lib.AP.WorkflowCtrl.roles.apStart || currentRole === Lib.AP.WorkflowCtrl.roles.controller) {
                        Lib.AP.WorkflowCtrl.Rebuild(true, currentRole === Lib.AP.WorkflowCtrl.roles.apStart, actionName);
                    }
                }
                cleanManuallyAddedFlags();
            }
            WorkflowCtrl.UpdateWorkflowOnDimensionUpdate = UpdateWorkflowOnDimensionUpdate;
            /**
             * Manages active holds.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {number} the number of active holds remaining.
             */
            function manageHolds() {
                //manage Holds
                var ScheduledActionParameters = Variable.GetValueAsString("ScheduledActionParameters");
                var ERPHoldsTable = Data.GetTable("Holds__");
                if (!ScheduledActionParameters) {
                    ERPHoldsTable.SetItemCount(0);
                    return 0;
                }
                var holds = JSON.parse(ScheduledActionParameters);
                var activeHoldsCount = 0;
                var lastHoldRelease = null;
                var header;
                if (!Array.isArray(holds)) {
                    ERPHoldsTable.SetItemCount(1);
                    for (header in holds) {
                        if (Object.prototype.hasOwnProperty.call(holds, header)) {
                            ERPHoldsTable.GetItem(0).SetValue(header, holds[header]);
                        }
                    }
                    if (!holds.ReleaseDate__) {
                        activeHoldsCount++;
                    }
                    else if (!lastHoldRelease || lastHoldRelease.getTime() < Sys.Helpers.Date.ISOSTringToDate(holds.ReleaseDate__).getTime()) {
                        lastHoldRelease = Sys.Helpers.Date.ISOSTringToDate(holds.ReleaseDate__);
                    }
                }
                else {
                    ERPHoldsTable.SetItemCount(holds.length);
                    for (var i = 0; i < holds.length; i++) {
                        var lineToAdd = holds[i];
                        for (header in lineToAdd) {
                            if (Object.prototype.hasOwnProperty.call(lineToAdd, header)) {
                                ERPHoldsTable.GetItem(i).SetValue(header, lineToAdd[header]);
                            }
                        }
                        if (!lineToAdd.ReleaseDate__) {
                            activeHoldsCount++;
                        }
                        else if (!lastHoldRelease || lastHoldRelease.getTime() < Sys.Helpers.Date.ISOSTringToDate(lineToAdd.ReleaseDate__).getTime()) {
                            lastHoldRelease = Sys.Helpers.Date.ISOSTringToDate(lineToAdd.ReleaseDate__);
                        }
                    }
                }
                Data.SetValue("ActiveHoldsCount__", activeHoldsCount);
                if (lastHoldRelease) {
                    Data.SetValue("LastHoldReleaseDate__", lastHoldRelease);
                }
                return activeHoldsCount;
            }
            WorkflowCtrl.manageHolds = manageHolds;
            /**
             * Computes the index of additional contributor for the specified role based on the specified index.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {string} role
             * @param {number} contributorIndex
             * @returns {number}
             */
            function ComputeAdditionalContributorIndex(role, contributorIndex) {
                if (role === Lib.AP.WorkflowCtrl.roles.approver) {
                    // Compute the index of the user in the role (index = ApStart - Controllers - APEnd - approvers)
                    return contributorIndex - Lib.AP.WorkflowCtrl.GetNbControllers() - Lib.AP.WorkflowCtrl.GetNbApprovers(true);
                }
                // Compute the index of the user in the role (index = ApStart - Controllers)
                return contributorIndex - Lib.AP.WorkflowCtrl.GetNbControllers(true);
            }
            WorkflowCtrl.ComputeAdditionalContributorIndex = ComputeAdditionalContributorIndex;
            /**
             * Updates the status of the invoice and add a line in the invoice history for reversing.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {Sys.WorkflowController.IWorkflowUser} user Information about the user who reversed the invoice (login, emailAddress, displayName).
            */
            function AddReverseInvoiceInformation(user, shouldEndWorkflow) {
                if (shouldEndWorkflow === void 0) { shouldEndWorkflow = false; }
                var comment = addActionInComment(Lib.AP.CommentHelper.GetReliableComment(), Language.CreateLazyTranslation("_Reverse invoice history"));
                Data.SetValue("Comment__", "");
                var contributor = buildContributor(user, Lib.AP.WorkflowCtrl.roles.apEnd, workflowUIParameters.actions.reverseInvoice.GetName());
                contributor.date = new Date();
                contributor.approved = true;
                contributor.comment = comment;
                if (shouldEndWorkflow) {
                    Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributor);
                }
                else {
                    Lib.AP.WorkflowCtrl.workflowUI.AddPostWorkflowContributor(contributor);
                }
            }
            WorkflowCtrl.AddReverseInvoiceInformation = AddReverseInvoiceInformation;
            /**
             * Updates the status of the invoice and add a line in the invoice history.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {Sys.WorkflowController.IWorkflowUser} user Information about the user who reversed the invoice (login, emailAddress, displayName).
             * @param {string} roleUser Information about the user's role
             * @param {string} action Information about the action activated
             * @param {string} actionComment
            */
            function UpdateAndAddPostWorkflowContributor(user, roleUser, action, actionComment) {
                var comment = addActionInComment(Lib.AP.CommentHelper.GetReliableComment(), actionComment);
                Data.SetValue("Comment__", "");
                var contributor = buildContributor(user, roleUser, action);
                contributor.date = new Date();
                contributor.approved = true;
                contributor.comment = comment;
                if ("startingDate" in user) {
                    contributor.startingDate = user.startingDate;
                }
                if ("isGroup" in user) {
                    contributor.isGroup = user.isGroup;
                }
                Lib.AP.WorkflowCtrl.workflowUI.AddPostWorkflowContributor(contributor);
            }
            WorkflowCtrl.UpdateAndAddPostWorkflowContributor = UpdateAndAddPostWorkflowContributor;
            /**
             * Adds a new contributor at the specified index.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {number} tableIndex the index where to add the new contributor.
             * @param {Sys.WorkflowController.IWorkflowUser} approver
             * @param {string} [role] the role of the contributor to add, if not specified it will be determined by the contributor just before.
             */
            function AddContributorAt(tableIndex, approver, role) {
                var contributorIndex = Lib.AP.WorkflowCtrl.workflowUI.GetSequenceIndexAt(tableIndex);
                if (!role) {
                    // Guess role from insert position: approver by default, controller if current index is controller
                    role = Lib.AP.WorkflowCtrl.GetNextRole(tableIndex - 1);
                }
                // Check if we may apply workflow rules on manually added contributors
                var allowBuildOfApprovers = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.OnBuildOfApprovers");
                if (typeof allowBuildOfApprovers !== "boolean") {
                    allowBuildOfApprovers = true;
                }
                // If computation of approver is disable, force the AddContributorAt usage
                if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() !== Lib.AP.WorkflowCtrl.roles.apStart || (role === Lib.AP.WorkflowCtrl.roles.approver && !allowBuildOfApprovers)) {
                    // Workflow is already started, rebuild is not allowed, add an additional approver
                    // Insert the contributor as additional if it is inserted among other additional ones. Exception: insertion before myself ("request further approval")
                    var currentPosition = Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex();
                    if (contributorIndex > currentPosition || (contributorIndex < currentPosition && Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(contributorIndex).isAdditional)) {
                        var workflowUIRole = role === Lib.AP.WorkflowCtrl.roles.approver ? "approver" : "controller";
                        contributorIndex = Lib.AP.WorkflowCtrl.ComputeAdditionalContributorIndex(role, contributorIndex);
                        Lib.AP.WorkflowCtrl.workflowUI.AddContributorAt(contributorIndex, buildContributor(approver, role, workflowUIParameters.actions.toApprove.GetName()), workflowUIRole);
                    }
                    else {
                        Lib.AP.WorkflowCtrl.workflowUI.AddContributorAt(contributorIndex, buildContributor(approver, role, workflowUIParameters.actions.toApprove.GetName()));
                    }
                    if (role === Lib.AP.WorkflowCtrl.roles.approver && !allowBuildOfApprovers) {
                        // force a rebuild to validate all roles are correctly created
                        Lib.AP.WorkflowCtrl.Rebuild(false, false, "approverAdded");
                    }
                }
                else {
                    // Use the correct list according to role
                    var listName = role === Lib.AP.WorkflowCtrl.roles.controller ? "ControllersList" : "ApproversList";
                    var listToUse = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue(listName);
                    approver.manuallyAdded = true;
                    var baseIdx = Lib.AP.WorkflowCtrl.workflowUI.GetRoleSequenceIndex(role);
                    if (!listToUse) {
                        listToUse = [];
                    }
                    var isFirstContributor = listToUse.length === 0;
                    listToUse.splice(contributorIndex - baseIdx, 0, approver);
                    Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue(listName, listToUse);
                    if (role === Lib.AP.WorkflowCtrl.roles.controller) {
                        Lib.AP.WorkflowCtrl.Rebuild(false, isFirstContributor && !Data.GetValue("CurrentException__"), "reviewerAdded");
                    }
                    if (role === Lib.AP.WorkflowCtrl.roles.approver) {
                        Lib.AP.WorkflowCtrl.Rebuild(isFirstContributor, false, "approverAdded");
                    }
                }
            }
            WorkflowCtrl.AddContributorAt = AddContributorAt;
            /**
             * Determines if  the contributor at a specified index and with a specified role is deletable or not.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {number} tableIndex the index of the contributor to check.
             * @param {string} role the role of the contributor to check.
             * @returns {boolean}
             */
            function IsContributorDeletableWithRole(tableIndex, role) {
                var contributorIndex = Lib.AP.WorkflowCtrl.workflowUI.GetSequenceIndexAt(tableIndex);
                if (contributorIndex >= 0) {
                    var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(contributorIndex);
                    if (currentContributor && currentContributor.role === role) {
                        return true;
                    }
                }
                return false;
            }
            WorkflowCtrl.IsContributorDeletableWithRole = IsContributorDeletableWithRole;
            /**
             * Removes the contributor at a specified index.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {number} tableIndex the index of the contributor to remove.
             * @returns {boolean} always true
             */
            function RemoveContributorAt(tableIndex) {
                var contributorIndex = Lib.AP.WorkflowCtrl.workflowUI.GetSequenceIndexAt(tableIndex);
                var role = Lib.AP.WorkflowCtrl.workflowUI.GetRoleAt(contributorIndex);
                // Check if we may apply workflow rules on manually added approvers
                var allowBuildOfApprovers = true;
                var contributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(contributorIndex);
                // Validate the contributor was manually added and is an approver
                if (contributor && contributor.role === Lib.AP.WorkflowCtrl.roles.approver) {
                    var userExitAllowBuildOfApprovers = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.OnBuildOfApprovers");
                    if (typeof userExitAllowBuildOfApprovers === "boolean") {
                        allowBuildOfApprovers = userExitAllowBuildOfApprovers;
                    }
                }
                if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() !== Lib.AP.WorkflowCtrl.roles.apStart || !allowBuildOfApprovers) {
                    Lib.AP.WorkflowCtrl.workflowUI.RemoveAdditionalContributor(contributor.contributorId);
                }
                else {
                    var baseIdx = void 0;
                    if (role === Lib.AP.WorkflowCtrl.roles.approver) {
                        baseIdx = Lib.AP.WorkflowCtrl.workflowUI.GetRoleSequenceIndex(Lib.AP.WorkflowCtrl.roles.approver);
                        var ApproversList = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ApproversList");
                        ApproversList.splice(contributorIndex - baseIdx, 1);
                        Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ApproversList", ApproversList);
                    }
                    if (role === Lib.AP.WorkflowCtrl.roles.controller) {
                        baseIdx = Lib.AP.WorkflowCtrl.workflowUI.GetRoleSequenceIndex(Lib.AP.WorkflowCtrl.roles.controller);
                        var controllersList = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ControllersList");
                        controllersList.splice(contributorIndex - baseIdx, 1);
                        Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ControllersList", controllersList);
                    }
                }
                // For AP Start, force a rebuilt to update the others roles (apEnd may be deleted for the last reviewer)
                if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart) {
                    Lib.AP.WorkflowCtrl.Rebuild(false, false, "contributorRemoved");
                }
                return true;
            }
            WorkflowCtrl.RemoveContributorAt = RemoveContributorAt;
            /**
             * Updates the contributor at a specified index. If an AP start contributor is updated the workflow is rebuild.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {number} tableIndex the index of the contributor to update
             * @param {Sys.WorkflowController.IWorkflowUser} contributor the new contributor
             * @returns {number}
             */
            function UpdateContributorAt(tableIndex, contributor) {
                var contributorIndex = Lib.AP.WorkflowCtrl.workflowUI.GetSequenceIndexAt(tableIndex);
                var role = Lib.AP.WorkflowCtrl.workflowUI.GetRoleAt(contributorIndex);
                // Check if we may apply workflow rules on manually added contributors
                var allowBuildOfApprovers = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.OnBuildOfApprovers");
                if (typeof allowBuildOfApprovers !== "boolean") {
                    allowBuildOfApprovers = true;
                }
                if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() !== Lib.AP.WorkflowCtrl.roles.apStart || (role === Lib.AP.WorkflowCtrl.roles.approver && !allowBuildOfApprovers)) {
                    var oldContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(contributorIndex);
                    var workflowUIRole = role === Lib.AP.WorkflowCtrl.roles.approver ? "approver" : "controller";
                    Lib.AP.WorkflowCtrl.workflowUI.RemoveAdditionalContributor(oldContributor.contributorId);
                    contributorIndex = Lib.AP.WorkflowCtrl.ComputeAdditionalContributorIndex(role, contributorIndex);
                    Lib.AP.WorkflowCtrl.workflowUI.AddContributorAt(contributorIndex, buildContributor(contributor, role, workflowUIParameters.actions.toApprove.GetName()), workflowUIRole);
                }
                else {
                    contributor.manuallyAdded = true;
                    var baseIdx = void 0;
                    if (role === Lib.AP.WorkflowCtrl.roles.approver) {
                        baseIdx = Lib.AP.WorkflowCtrl.workflowUI.GetRoleSequenceIndex(Lib.AP.WorkflowCtrl.roles.approver);
                        var ApproversList = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ApproversList");
                        ApproversList[contributorIndex - baseIdx] = contributor;
                        Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ApproversList", ApproversList);
                    }
                    if (role === Lib.AP.WorkflowCtrl.roles.controller) {
                        baseIdx = Lib.AP.WorkflowCtrl.workflowUI.GetRoleSequenceIndex(Lib.AP.WorkflowCtrl.roles.controller);
                        var controllersList = Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("ControllersList");
                        controllersList[contributorIndex - baseIdx] = contributor;
                        Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ControllersList", controllersList);
                    }
                }
                // For AP Start, force a rebuilt to update the others roles (apEnd may be deleted for the last reviewer)
                if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart) {
                    Lib.AP.WorkflowCtrl.Rebuild(false, false, "updateContributor");
                }
            }
            WorkflowCtrl.UpdateContributorAt = UpdateContributorAt;
            /**
             * Retrieves the current step index in the workflow table.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {number}
             */
            function GetCurrentStep() {
                // return the "table index"
                return Lib.AP.WorkflowCtrl.workflowUI.GetTableIndex();
            }
            WorkflowCtrl.GetCurrentStep = GetCurrentStep;
            /**
             * Retrieves the login of the workflow initiator in a structured object.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {{ login: string }} a result object containing a login attribute with the workflow initiator login.
             */
            function GetWorkflowInitiator() {
                return Lib.AP.WorkflowCtrl.workflowUI.GetSerializedValue("workflowInitiator");
            }
            WorkflowCtrl.GetWorkflowInitiator = GetWorkflowInitiator;
            /**
             * Determines if the current contributor is the last one matching the specified role.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {string} role the role to verify.
             * @returns {boolean}
             */
            function IsLastContributorWithRole(role) {
                var currentIdx = Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex();
                var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(currentIdx);
                if (currentContributor.role === role) {
                    var nextContributor = getNextContributor(currentIdx);
                    if (nextContributor && nextContributor.role === currentContributor.role) {
                        return false;
                    }
                    return true;
                }
                return false;
            }
            WorkflowCtrl.IsLastContributorWithRole = IsLastContributorWithRole;
            /**
             * Determines if the current contributor has low privilage AP or not.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {boolean}
             */
            function IsCurrentContributorLowPrivilegeAP() {
                var lowPrivilegeAP = false;
                var defaultAPEnd = Sys.Parameters.GetInstance("AP").GetParameter("DefaultAPClerkEnd", "");
                if (defaultAPEnd && Lib.AP.WorkflowCtrl.CurrentStepIsApStart()) {
                    var apStartContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex());
                    if (apStartContributor) {
                        if (apStartContributor.login !== defaultAPEnd) {
                            lowPrivilegeAP = true;
                        }
                    }
                }
                return lowPrivilegeAP;
            }
            WorkflowCtrl.IsCurrentContributorLowPrivilegeAP = IsCurrentContributorLowPrivilegeAP;
            /**
             * Retrieves the number of approvers.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {boolean} excludeAdditionals flag to exclude or not the additionnal contributors in the count.
             * @returns {number}
             */
            function GetNbApprovers(excludeAdditionals) {
                var n = 0;
                for (var i = 0; i < Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors(); i++) {
                    var step = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(i);
                    if (step.role === Lib.AP.WorkflowCtrl.roles.approver && (!excludeAdditionals || !step.isAdditional)) {
                        n++;
                    }
                }
                return n;
            }
            WorkflowCtrl.GetNbApprovers = GetNbApprovers;
            /**
             * Retrieves the number of controllers.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {boolean} excludeAdditionals flag to exclude or not the additionnal contributors in the count.
             * @returns {number}
             */
            function GetNbControllers(excludeAdditionals) {
                var n = 0;
                for (var i = 0; i < Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors(); i++) {
                    var step = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(i);
                    if (step.role === Lib.AP.WorkflowCtrl.roles.controller && (!excludeAdditionals || !step.isAdditional)) {
                        n++;
                    }
                }
                return n;
            }
            WorkflowCtrl.GetNbControllers = GetNbControllers;
            /**
             * Retrieves the number of contributors matching the specified role remaining in the workflow.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {string} role the role to filter on.
             * @returns {number}
             */
            function GetNbRemainingContributorWithRole(role) {
                var n = 0;
                for (var i = Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex(); i < Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors(); i++) {
                    var step = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(i);
                    if (step.role === role) {
                        n++;
                    }
                }
                return n;
            }
            WorkflowCtrl.GetNbRemainingContributorWithRole = GetNbRemainingContributorWithRole;
            /**
             * Retrieves the number of controllers remaining in the workflow.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {number}
             */
            function GetNbRemainingControllers() {
                return Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(WorkflowCtrl.roles.controller);
            }
            WorkflowCtrl.GetNbRemainingControllers = GetNbRemainingControllers;
            /**
             * Retrieves the number of approvers remaining in the workflow.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {number}
             */
            function GetNbRemainingApprovers() {
                return Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(WorkflowCtrl.roles.approver);
            }
            WorkflowCtrl.GetNbRemainingApprovers = GetNbRemainingApprovers;
            /**
             * Determines if the worklow is ended or not.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {boolean}
             */
            function IsEnded() {
                var varWrkFinished = Variable.GetValueAsString("removeWorkflowActions");
                return (varWrkFinished && varWrkFinished.toLowerCase() === "true") || Lib.AP.WorkflowCtrl.workflowUI.IsEnded();
            }
            WorkflowCtrl.IsEnded = IsEnded;
            /**
             * Retrieves the step role of the specified index.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {number} tableIndex the index to look for.
             * @returns {string} next step role.
             */
            function GetStepRole(tableIndex) {
                // translate the index into the sequence one
                var sequenceIndex = Lib.AP.WorkflowCtrl.workflowUI.GetSequenceIndexAt(tableIndex);
                return Lib.AP.WorkflowCtrl.workflowUI.GetRoleAt(sequenceIndex);
            }
            WorkflowCtrl.GetStepRole = GetStepRole;
            /**
             * Retrieves the next step role.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {string} next step role.
             */
            function GetNextStepRole() {
                var idx = Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex() + 1;
                if (idx < Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors()) {
                    return Lib.AP.WorkflowCtrl.workflowUI.GetRoleAt(idx);
                }
                return "";
            }
            WorkflowCtrl.GetNextStepRole = GetNextStepRole;
            /**
             * Retrieves current step role.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {string} current step role.
             */
            function GetCurrentStepRole() {
                return Lib.AP.WorkflowCtrl.workflowUI.GetCurrentStepRole();
            }
            WorkflowCtrl.GetCurrentStepRole = GetCurrentStepRole;
            function IsCurrentContributorParallel() {
                return Lib.AP.WorkflowCtrl.workflowUI.IsCurrentContributorParallel();
            }
            WorkflowCtrl.IsCurrentContributorParallel = IsCurrentContributorParallel;
            /**
             * Retrieves the previous contibutor matching the specied role.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {string} role the role of the contributor to retrieve.
             * @returns {Sys.WorkflowController.IWorkflowContributor} the retrieve contributor or null if no contributor found.
             */
            function GetPreviousContributor(role) {
                // Find previous contributor in current sequence
                var idx = Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex();
                if (idx > 0) {
                    var previousContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(idx - 1);
                    if (previousContributor && previousContributor.role === role) {
                        return previousContributor;
                    }
                }
                return null;
            }
            WorkflowCtrl.GetPreviousContributor = GetPreviousContributor;
            /**
             * Determines if the action Back to previous is possible or not.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {boolean}
             */
            function BackToPreviousPossible() {
                var currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                var previous = Lib.AP.WorkflowCtrl.GetPreviousContributor(currentRole);
                return previous !== null;
            }
            WorkflowCtrl.BackToPreviousPossible = BackToPreviousPossible;
            /**
             * Returns the role of the step after the specified index in the workflow.
             * @memberof Lib.AP.WorkflowCtrl
             * @param {number} index position to look after in the workflow.
             * @returns {string} the next role to come, null if it cannot be determined.
             */
            function GetNextRole(index) {
                var indexRole = Lib.AP.WorkflowCtrl.GetStepRole(index);
                var nextRole;
                switch (indexRole) {
                    case Lib.AP.WorkflowCtrl.roles.apStart:
                        if (!Lib.AP.WorkflowCtrl.allowApprovers) {
                            nextRole = Lib.AP.WorkflowCtrl.roles.controller;
                        }
                        else if (Data.GetValue("ERPPostingDate__") || Data.GetValue("ManualLink__")) {
                            // if the invoice is already posted we can add only an approver
                            nextRole = Lib.AP.WorkflowCtrl.roles.approver;
                        }
                        else if (Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors() > 1 && Lib.AP.WorkflowCtrl.GetStepRole(Lib.AP.WorkflowCtrl.workflowUI.GetTableIndex() + 1) === Lib.AP.WorkflowCtrl.roles.controller) {
                            // if there is a controller after apStart: add a controller (assuming apStart is always at the first position of the sequence)
                            nextRole = Lib.AP.WorkflowCtrl.roles.controller;
                        }
                        else {
                            // otherwise: if there is no controller and invoice not posted: indetermination, the function will return null.
                            nextRole = null;
                        }
                        break;
                    case Lib.AP.WorkflowCtrl.roles.controller:
                        nextRole = Lib.AP.WorkflowCtrl.roles.controller;
                        break;
                    case Lib.AP.WorkflowCtrl.roles.approver:
                    case Lib.AP.WorkflowCtrl.roles.apEnd:
                        nextRole = Lib.AP.WorkflowCtrl.roles.approver;
                        break;
                    default:
                        nextRole = null;
                        break;
                }
                return nextRole;
            }
            WorkflowCtrl.GetNextRole = GetNextRole;
            /**
             * Determines if the current worklow step correpsond to the the role AP Start or not.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {boolean}
             */
            function CurrentStepIsApStart() {
                return Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart;
            }
            WorkflowCtrl.CurrentStepIsApStart = CurrentStepIsApStart;
            /**
             * Determines if the current worklow step correpsond to the the role AP End or not.
             * @memberof Lib.AP.WorkflowCtrl
             * @returns {boolean}
             */
            function CurrentStepIsApEnd() {
                return Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apEnd || (Lib.AP.WorkflowCtrl.CurrentStepIsApStart() && Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0);
            }
            WorkflowCtrl.CurrentStepIsApEnd = CurrentStepIsApEnd;
            function GiveRightReadToManagers(contributorsLogin) {
                if (contributorsLogin && contributorsLogin.length > 0) {
                    Log.Info("Giving rights read to managers");
                    return Lib.P2P.Managers.GetManagersRecursively(contributorsLogin).Then(function (managers) {
                        var loginList = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.Workflow.UpdateListOfManagersWithReadRight", contributorsLogin, managers);
                        managers = loginList || managers;
                        if (managers && managers.length > 0) {
                            for (var _i = 0, managers_1 = managers; _i < managers_1.length; _i++) {
                                var manager = managers_1[_i];
                                Process.SetRight(manager, "read");
                                Log.Info("Set right read to manager : ".concat(manager));
                                registerAContributor(manager);
                            }
                        }
                        return Sys.Helpers.Promise.Resolve();
                    });
                }
                return Sys.Helpers.Promise.Resolve();
            }
            WorkflowCtrl.GiveRightReadToManagers = GiveRightReadToManagers;
        })(WorkflowCtrl = AP.WorkflowCtrl || (AP.WorkflowCtrl = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
