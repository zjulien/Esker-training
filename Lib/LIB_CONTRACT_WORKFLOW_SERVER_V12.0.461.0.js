///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Contract_Workflow_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Server",
  "comment": "P2P library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Contract_Workflow",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_PushNotification",
    "Sys/Sys_EmailNotification",
    "Sys/Sys_OnDemand_Users"
  ]
}*/
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Workflow;
        (function (Workflow) {
            var validationDate = null;
            var g_initialComment = Data.GetValue("Comments__");
            function NextContributorExist() {
                var nextContributor = Lib.Contract.Workflow.Controller.GetContributorAt(Lib.Contract.Workflow.Controller.GetContributorIndex() + 1);
                if (nextContributor && Users.GetUser(nextContributor.login) == null) {
                    Lib.CommonDialog.NextAlert.Define("_Workflow error", "_Invalid user '{0}' in worflow, please contact your administrator", null, nextContributor.login);
                    return false;
                }
                else if (!nextContributor) {
                    return false;
                }
                return true;
            }
            function AddSharedWith(comment) {
                var prefix = Language.Translate("_Shared with", false, Variable.GetValueAsString("AdvisorName"));
                if (comment) {
                    return prefix + ": " + comment;
                }
                return prefix;
            }
            function GetContributionData(sequenceStep, newAction, commentOptions) {
                var currentContributor = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep);
                currentContributor.action = newAction;
                if (validationDate === null) {
                    currentContributor.date = new Date();
                    validationDate = currentContributor.date;
                }
                else {
                    currentContributor.date = validationDate;
                }
                currentContributor.actualApprover = Sys.Helpers.String.ExtractLoginFromDN(Lib.P2P.GetValidatorOrOwnerLogin());
                var wkfComment = Data.GetValue("Comments__");
                if (commentOptions) {
                    if (commentOptions.comment) {
                        wkfComment = commentOptions.comment;
                    }
                    if (commentOptions.sharedWith) {
                        wkfComment = AddSharedWith(wkfComment);
                    }
                    if (commentOptions.onBehalfOf) {
                        wkfComment = Lib.P2P.AddOnBehalfOf(currentContributor, wkfComment);
                    }
                }
                if (wkfComment) {
                    var previousComment = currentContributor.comment;
                    var newCommentFormatted = wkfComment;
                    if (previousComment && previousComment.length > 0) {
                        newCommentFormatted += "\n" + previousComment;
                    }
                    Data.SetValue("Comments__", "");
                    currentContributor.comment = newCommentFormatted;
                }
                return currentContributor;
            }
            function ResetAdvisorList() {
                var list = Variable.GetValueAsString("AdvisorLoginList");
                if (list) {
                    var logins = list.split("\n");
                    for (var i = 0; i < logins.length; i++) {
                        Log.Info("Grant read right to advisor: " + logins[i]);
                        Process.SetRight(logins[i], "read");
                    }
                }
                Variable.SetValueAsString("AdvisorLoginList", "");
            }
            function GiveRightToApprovers() {
                Log.Info("Reset rights");
                Process.ResetRights();
                var lastSaveOwnerID = Data.GetValue("LastSavedOwnerID");
                Log.Info("Grant read right to LastSavedOwnerID: " + lastSaveOwnerID);
                Process.AddRight(lastSaveOwnerID, "read");
                // always give the "write" right to the contract owner
                var contractOwnerLogin = Data.GetValue("OwnerLogin__");
                Log.Info("Grant read right to OwnerLogin__: " + contractOwnerLogin);
                Process.AddRight(contractOwnerLogin, "write");
                // always give the "write" right to the contract requester
                if (Lib.Contract.Workflow.Controller.GetNbContributors() > 0) {
                    Log.Info("Grant write right to contract requester: " + Lib.Contract.Workflow.Controller.GetContributorAt(0).login);
                    Process.AddRight(Lib.Contract.Workflow.Controller.GetContributorAt(0).login, "write");
                }
                // Skips initiator : starts at 1
                for (var i = 1; i < Lib.Contract.Workflow.Controller.GetNbContributors(); i++) {
                    var step = Lib.Contract.Workflow.Controller.GetContributorAt(i);
                    Log.Info("Grant read right to approver: " + step.login);
                    Process.AddRight(step.login, "read");
                }
            }
            function ChangeOwner(idx) {
                if (idx == null) {
                    idx = Lib.Contract.Workflow.Controller.GetContributorIndex();
                }
                Log.Info("change owner idx :" + idx);
                var step = Lib.Contract.Workflow.Controller.GetContributorAt(idx);
                Process.ChangeOwner(step.login);
                if (idx == 1) {
                    GiveRightToApprovers();
                }
            }
            function AutoApproveIfNextIsSameUser(sequenceStep, nextContributor, contributionData) {
                var currentUser = Lib.P2P.GetValidatorOrOwner();
                var currentUserLogin = currentUser.GetValue("Login");
                var forwarded = false;
                if (Variable.GetValueAsString("FromCatalogManagement") !== "1") {
                    while (nextContributor && currentUserLogin === nextContributor.login) {
                        forwarded = true;
                        Log.Info("Auto approve step " + sequenceStep + " for " + nextContributor.login);
                        Lib.Contract.Workflow.Controller.NextContributor(contributionData);
                        ChangeOwner(); // Need to change owner in order to be coherent with the current contributor
                        sequenceStep = Lib.Contract.Workflow.Controller.GetContributorIndex();
                        var actionName = null;
                        var autoComment = null;
                        switch (nextContributor.action) {
                            case Lib.Contract.Workflow.Parameters.actions.approval.GetName():
                            default:
                                actionName = Lib.Contract.Workflow.Parameters.actions.approved.GetName();
                                autoComment = Language.Translate("_Contract auto approved");
                                break;
                        }
                        contributionData = GetContributionData(sequenceStep, actionName, { comment: autoComment, onBehalfOf: true });
                        nextContributor = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep + 1);
                    }
                }
                return {
                    forwarded: forwarded,
                    sequenceStep: sequenceStep,
                    nextContributor: nextContributor,
                    contributionData: contributionData
                };
            }
            function GoToNextStep(contributionData) {
                Lib.Contract.Workflow.Controller.NextContributor(contributionData);
                var nextContributor = Lib.Contract.Workflow.Controller.GetContributorAt(Lib.Contract.Workflow.Controller.GetContributorIndex());
                var nextContributors = Lib.Contract.Workflow.Controller.GetParallelContributorsOf(nextContributor, true);
                nextContributors.forEach(function (contributor) {
                    Log.Info("Grant validate right to approver: " + contributor.login);
                    Process.AddRight(contributor.login, "validate");
                    if (!contributor.additionalProperties || !contributor.additionalProperties.startingDate) {
                        Lib.Contract.Workflow.Controller.UpdateAdditionalContributorData(contributor.contributorId, { startingDate: new Date(contributionData.date) });
                    }
                });
                ChangeOwner();
            }
            function GetCustomTags() {
                return {
                    Name__: Data.GetValue("Name__"),
                    ReferenceNumber__: Data.GetValue("ReferenceNumber__"),
                    OwnerNiceName__: Lib.Contract.Workflow.Controller.GetContributorAt(0).name,
                    Last_Comments__: g_initialComment,
                    VendorName__: Data.GetValue("VendorName__")
                };
            }
            Workflow.GetCustomTags = GetCustomTags;
            function SendEmailNotification(step, subject, template, backupUserAsCC, tags) {
                //if you change this structure, plz update the sample in lib_PR_Customization_Server
                var options = {
                    userId: step.login,
                    subject: subject,
                    template: template,
                    customTags: tags,
                    fromName: "_EskerContract",
                    backupUserAsCC: !!backupUserAsCC,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                };
                Sys.EmailNotification.SendEmailNotification(options);
            }
            Workflow.SendEmailNotification = SendEmailNotification;
            function NotifyEndOfContributionOnMobile(contributor) {
                // On mobile, only approvers can approve the contract
                if (contributor.role === Lib.Contract.Workflow.roleApprover) {
                    // Send push notifications if enabled
                    if (Process.GetProcessDefinition().PushNotification === true) {
                        var user = Users.GetUser(contributor.login);
                        if (user) {
                            Log.Info("Notifying the end of approval contribution step on mobile. A silent push notif will be sent to: ".concat(contributor.login, " (and backup user if needed)"));
                            Sys.PushNotification.SendNotifToUser({
                                user: user,
                                id: Data.GetValue("ruidex"),
                                sendToBackupUser: true,
                                silent: true
                            });
                        }
                    }
                }
            }
            function InitConfiguration(companyCode) {
                return Lib.P2P.CompanyCodesValue.QueryValues(companyCode).Then(function (CCValues) {
                    var configurationName = "Default";
                    if (Object.keys(CCValues).length > 0) {
                        configurationName = CCValues.DefaultConfiguration__;
                    }
                    else {
                        Log.Error("The requested company code is not in the company code table.");
                    }
                    return Lib.P2P.ChangeConfiguration(configurationName);
                });
            }
            function Approved(sequenceStep, comment) {
                Data.SetValue("ContractStatus__", Lib.Contract.Status.Active);
                Log.Info(" Contract workflow -- Action: approved -- SeqenceStep: " + sequenceStep);
                var contributionData = GetContributionData(sequenceStep, Lib.Contract.Workflow.Parameters.actions.approved.GetName(), { onBehalfOf: true, comment: comment });
                Lib.Contract.Workflow.Controller.EndWorkflow(contributionData);
                var ownerLogin = Data.GetValue("OwnerLogin__");
                var requesterLogin = Data.GetValue("RequesterLogin__");
                Log.Info("Set read right to contract requester ".concat(requesterLogin));
                Process.SetRight(requesterLogin, "read");
                Log.Info("Set read right to contract owner ".concat(ownerLogin));
                Process.SetRight(ownerLogin, "read");
                Log.Info("Change contract document owner to ".concat(ownerLogin));
                Process.ChangeOwner(ownerLogin);
                Variable.SetValueAsString("ContractOwner", ownerLogin);
                var currentUser = Lib.P2P.GetValidatorOrOwner();
                var currentUserLogin = currentUser.GetValue("Login");
                var tags = GetCustomTags();
                tags.Description__ = Data.GetValue("Description__");
                tags.LastApprover__ = currentUser.GetValue("DisplayName");
                var requester = Lib.Contract.Workflow.Controller.GetContributorAt(0);
                // send a notification to the requester if it differs from the current user
                if (currentUserLogin !== requester.login && Variable.GetValueAsString("FromCatalogManagement") !== "1") {
                    SendEmailNotification(requester, "_A contract has been activated", "Contract_Email_Validate.htm", false, tags);
                }
                // send a notification to the contract owner if it differs from the current user and the requester
                if (currentUserLogin !== ownerLogin && requester.login !== ownerLogin && Variable.GetValueAsString("FromCatalogManagement") !== "1") {
                    SendEmailNotification({ login: ownerLogin }, "_A contract has been activated", "Contract_Email_Validate.htm", false, tags);
                }
                var approvalDate = new Date();
                Log.Info("Contract approved: " + approvalDate);
                Data.SetValue("ApprovedDate__", approvalDate);
                // Set read right to
                InitConfiguration(Data.GetValue("CompanyCode__")).Then(function () {
                    var contractViewer = Sys.Parameters.GetInstance("PAC").GetParameter("ContractViewer");
                    if (contractViewer) {
                        Log.Info("Set read right to contract viewer ".concat(contractViewer));
                        Process.SetRight(contractViewer, "read");
                    }
                });
                ResetAdvisorList();
                if (Lib.Contract.Amendment.IsAmendment()) {
                    Lib.Contract.Amendment.DeprecatePreviousContractVersion();
                }
                return true;
            }
            function SubmitImpl(params) {
                var nextContributor = null;
                var contributionData = null;
                var lastStepComment = null;
                var isLastStep = false;
                var bok = NextContributorExist();
                if (bok) {
                    var currentContributor = Lib.Contract.Workflow.Controller.GetContributorAt(params.sequenceStep);
                    nextContributor = Lib.Contract.Workflow.Controller.GetContributorAt(params.sequenceStep + 1);
                    contributionData = GetContributionData(params.sequenceStep, params.actionName, { onBehalfOf: true });
                    var autoApproveReturn = AutoApproveIfNextIsSameUser(params.sequenceStep, nextContributor, contributionData);
                    params.sequenceStep = autoApproveReturn.sequenceStep;
                    nextContributor = autoApproveReturn.nextContributor;
                    contributionData = autoApproveReturn.contributionData;
                    if (!nextContributor) {
                        isLastStep = true;
                        lastStepComment = Language.Translate("_Contract auto approved");
                    }
                    else if (currentContributor.role !== nextContributor.role) {
                        ResetAdvisorList();
                    }
                }
                else {
                    isLastStep = true;
                }
                if (isLastStep) {
                    // End the workflow
                    bok = Approved(params.sequenceStep, lastStepComment);
                }
                else {
                    var tags = GetCustomTags();
                    var currentContributor = Lib.Contract.Workflow.Controller.GetContributorAt(params.sequenceStep);
                    SendEmailNotification(nextContributor, "_A contract is waiting for your action", "Contract_Email_NotifNextApprover.htm", true, tags);
                    // Send push notifications if enabled
                    if (Process.GetProcessDefinition().PushNotification === true) {
                        var pushNotificationType = (Sys.Parameters.GetInstance("PAC").GetParameter("PushNotificationType") || Sys.Parameters.GetInstance("P2P").GetParameter("PushNotificationType") || "").toLowerCase();
                        Log.Info("Sending " + pushNotificationType + " push notification");
                        if (pushNotificationType == "short" || pushNotificationType == "full") {
                            if (!nextContributor.additionalProperties || !nextContributor.additionalProperties.pushNotifSent) {
                                Sys.PushNotification.SendNotifToUser({
                                    user: Users.GetUser(nextContributor.login),
                                    id: pushNotificationType == "short" ? Process.GetProcessID() : Data.GetValue("ruidex"),
                                    template: "Contract_PushNotif_NotifNextApprover_" + pushNotificationType + ".txt",
                                    customTags: tags,
                                    sendToBackupUser: true
                                });
                                Lib.Contract.Workflow.Controller.UpdateAdditionalContributorData(nextContributor.contributorId, { pushNotifSent: true });
                            }
                        }
                    }
                    GoToNextStep(contributionData);
                    NotifyEndOfContributionOnMobile(currentContributor);
                    Process.PreventApproval();
                }
                Process.LeaveForm();
                return bok;
            }
            var serverParameters = {
                actions: {
                    submission: {
                        OnDone: function (sequenceStep) {
                            Data.SetValue("ContractSubmissionDateTime__", new Date());
                            Data.SetValue("ContractStatus__", Lib.Contract.Status.ToValidate);
                            Log.Info(" Contract workflow -- Action: submission -- SeqenceStep: " + sequenceStep);
                            var nextContributor = null;
                            var contributionData = null;
                            var lastStepComment = null;
                            var isLastStep = false;
                            var bok = NextContributorExist();
                            if (bok) {
                                contributionData = GetContributionData(sequenceStep, this.actions.submitted.GetName(), { onBehalfOf: true });
                                nextContributor = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep + 1);
                                ResetAdvisorList();
                                var autoApproveReturn = AutoApproveIfNextIsSameUser(sequenceStep, nextContributor, contributionData);
                                sequenceStep = autoApproveReturn.sequenceStep;
                                nextContributor = autoApproveReturn.nextContributor;
                                contributionData = autoApproveReturn.contributionData;
                                var currentContributor = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep);
                                if (Variable.GetValueAsString("FromCatalogManagement") !== "1") {
                                    var tags = GetCustomTags();
                                    SendEmailNotification(currentContributor, "_A contract has been created", "Contract_Email_FirstNotif.htm", false, tags);
                                }
                                if (!nextContributor) {
                                    // Trigger the end of the workflow
                                    isLastStep = true;
                                    lastStepComment = Language.Translate("_Contract auto approved");
                                }
                            }
                            else {
                                isLastStep = true;
                            }
                            if (isLastStep) {
                                bok = Approved(sequenceStep, lastStepComment);
                            }
                            else {
                                var tags = GetCustomTags();
                                var currentContributor = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep);
                                SendEmailNotification(nextContributor, "_A contract is waiting for your action", "Contract_Email_NotifNextApprover.htm", true, tags);
                                // Send push notifications if enabled
                                if (Process.GetProcessDefinition().PushNotification === true) {
                                    var pushNotificationType = (Sys.Parameters.GetInstance("PAC").GetParameter("PushNotificationType") || Sys.Parameters.GetInstance("P2P").GetParameter("PushNotificationType") || "").toLowerCase();
                                    Log.Info("Sending " + pushNotificationType + " push notification");
                                    if (pushNotificationType == "short" || pushNotificationType == "full") {
                                        if (!nextContributor.additionalProperties || !nextContributor.additionalProperties.pushNotifSent) {
                                            Sys.PushNotification.SendNotifToUser({
                                                user: Users.GetUser(nextContributor.login),
                                                id: pushNotificationType == "short" ? Process.GetProcessID() : Data.GetValue("ruidex"),
                                                template: "Contract_PushNotif_NotifNextApprover_" + pushNotificationType + ".txt",
                                                customTags: tags,
                                                sendToBackupUser: true
                                            });
                                            Lib.Contract.Workflow.Controller.UpdateAdditionalContributorData(nextContributor.contributorId, { pushNotifSent: true });
                                        }
                                    }
                                }
                                GoToNextStep(contributionData);
                                NotifyEndOfContributionOnMobile(currentContributor);
                                Process.PreventApproval();
                            }
                            Process.LeaveForm();
                            return bok;
                        }
                    },
                    submitted: {},
                    forward: {
                        OnDone: function (sequenceStep) {
                            Log.Info(" Contract workflow -- Action: approveAndForward -- SeqenceStep: " + sequenceStep);
                            var bok = SubmitImpl({
                                sequenceStep: sequenceStep,
                                actionName: this.actions.forward.GetName()
                            });
                            return bok;
                        }
                    },
                    approval: {
                        OnDone: function (sequenceStep) {
                            Log.Info(" Contract workflow -- Action: approval -- SeqenceStep: " + sequenceStep);
                            var bok = SubmitImpl({
                                sequenceStep: sequenceStep,
                                actionName: this.actions.approved.GetName()
                            });
                            return bok;
                        }
                    },
                    share: {
                        OnDone: function (sequenceStep) {
                            var advisor = {
                                login: Variable.GetValueAsString("AdvisorLogin"),
                                name: Variable.GetValueAsString("AdvisorName"),
                                email: Variable.GetValueAsString("AdvisorEmail")
                            };
                            // add the current advisor in advisor list
                            var list = Variable.GetValueAsString("AdvisorLoginList");
                            list = list ? advisor.login + "\n" + list : advisor.login;
                            Variable.SetValueAsString("AdvisorLoginList", list);
                            var contributionData = GetContributionData(sequenceStep, this.actions.share.GetName(), { comment: g_initialComment, sharedWith: true, onBehalfOf: true });
                            var tags = GetCustomTags();
                            tags.LastValidatorName__ = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep).name;
                            SendEmailNotification(advisor, "_A contract has been shared", "Contract_Email_NotifShare.htm", true, tags);
                            Log.Info("Grand all right to advisor: " + advisor.login);
                            Process.SetRight(advisor.login, "all"); // Advisor can modify the comment
                            Lib.Contract.Workflow.Controller.AddContributorAt(sequenceStep + 1, Lib.Contract.Workflow.Controller.GetContributorAt(Lib.Contract.Workflow.Controller.GetContributorIndex()));
                            Lib.Contract.Workflow.Controller.NextContributor(contributionData);
                            Process.DisableChecks();
                            Process.PreventApproval();
                            Process.LeaveForm();
                            return true;
                        }
                    },
                    comment: {
                        OnDone: function (sequenceStep) {
                            var requesterOfInformations = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep);
                            // Add the step of advisor here. Previously done in the custom script.
                            // We do it here now in order to reduce the crash window between the both calls to workfow (AddContributorAt and NextContributor).
                            var advisor = {
                                login: Variable.GetValueAsString("AdvisorLogin"),
                                name: Variable.GetValueAsString("AdvisorName"),
                                email: Variable.GetValueAsString("AdvisorEmail")
                            };
                            Lib.Contract.Workflow.Controller.AddContributorAt(sequenceStep, {
                                //mandatory fields
                                contributorId: advisor.login + "_Role advisor",
                                role: "_Role advisor",
                                //not mandatory fields
                                login: advisor.login,
                                name: advisor.name,
                                email: advisor.email,
                                action: this.actions.comment.GetName()
                            });
                            var contributionData = GetContributionData(sequenceStep, this.actions.commentDone.GetName(), g_initialComment);
                            var tags = GetCustomTags();
                            tags.LastValidatorName__ = advisor.name;
                            SendEmailNotification(requesterOfInformations, "_Your shared contract has been answered", "Contract_Email_NotifShareAnswer.htm", true, tags);
                            Lib.Contract.Workflow.Controller.NextContributor(contributionData);
                            Process.DisableChecks();
                            Process.PreventApproval();
                            Process.LeaveForm();
                        }
                    },
                    commentDone: {},
                    approved: {},
                    modifyContract: {
                        OnDone: function (sequenceStep) {
                            Log.Info(" Contract workflow -- Action: modifyContract -- SeqenceStep: " + sequenceStep);
                            var contributionData = GetContributionData(0, this.actions.modifyContract.GetName());
                            var currentContributor = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep);
                            contributionData.comment = Language.Translate("_Has modified Contract", false) + "\n" + g_initialComment;
                            Data.SetValue("Comments__", "");
                            ResetAdvisorList();
                            var tags = GetCustomTags();
                            tags.LastValidatorName__ = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep).name;
                            Lib.Contract.Workflow.Controller.Restart(contributionData);
                            Data.SetValue("ContractStatus__", Lib.Contract.Status.Draft);
                            var nextContributor = Lib.Contract.Workflow.Controller.GetContributorAt(0);
                            // mail to send went recall from requester
                            SendEmailNotification(currentContributor, "_A contract has been recalled", "Contract_Email_NotifRecall.htm", false, tags);
                            NotifyEndOfContributionOnMobile(currentContributor);
                            Process.Forward(nextContributor.login);
                        }
                    },
                    sentBack: {
                        OnDone: function (sequenceStep) {
                            Log.Info(" Contract workflow -- Action: sentBack -- SeqenceStep: " + sequenceStep);
                            var lastValidatorName = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep).name;
                            var currentContributor = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep);
                            var contributionData = GetContributionData(sequenceStep, this.actions.sentBack.GetName(), { onBehalfOf: true });
                            ResetAdvisorList();
                            Lib.Contract.Workflow.Controller.Restart(contributionData);
                            Data.SetValue("ContractStatus__", Lib.Contract.Status.Draft);
                            var nextContributor = Lib.Contract.Workflow.Controller.GetContributorAt(0);
                            var tags = GetCustomTags();
                            tags.LastValidatorName__ = lastValidatorName;
                            SendEmailNotification(nextContributor, "_A Contract must be verified", "Contract_Email_NotifBack.htm", false, tags);
                            NotifyEndOfContributionOnMobile(currentContributor);
                            Process.Forward(nextContributor.login);
                            Process.LeaveForm();
                        }
                    },
                    deleted: {
                        OnDone: function (sequenceStep) {
                            Log.Info(" Contract workflow -- Action: deleted -- SeqenceStep: " + sequenceStep);
                            var contributionData = GetContributionData(0, this.actions.deleted.GetName());
                            var currentContributor = Lib.Contract.Workflow.Controller.GetContributorAt(sequenceStep);
                            // mail to send on contract deletion
                            var tags = GetCustomTags();
                            SendEmailNotification(currentContributor, "_A contract has been deleted", "Contract_Email_NotifCancel.htm", false, tags);
                            NotifyEndOfContributionOnMobile(currentContributor);
                            ResetAdvisorList();
                            Lib.Contract.Workflow.Controller.EndWorkflow(contributionData);
                            Data.SetValue("ContractStatus__", Lib.Contract.Status.Deleted);
                            Process.Cancel();
                            Process.LeaveForm();
                        }
                    }
                }
            };
            Sys.Helpers.Extend(true, Lib.Contract.Workflow.Parameters, serverParameters);
        })(Workflow = Contract.Workflow || (Contract.Workflow = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
