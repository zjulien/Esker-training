///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Report_Workflow_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "ExpenseReport common library used to manage document workflow",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_Expense_Report_V12.0.461.0",
    "Lib_Expense_Report_Workflow_V12.0.461.0",
    "Lib_Expense_Report_InvoiceGeneration_V12.0.461.0",
    "Sys/Sys_PushNotification",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_EmailNotification"
  ]
}*/
// Common part
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Report;
        (function (Report) {
            var Workflow;
            (function (Workflow) {
                var g = Sys.Helpers.Globals;
                var roles = Workflow.enums.roles;
                var actions = Workflow.enums.actions;
                var newComment = Data.GetValue("Comments__");
                var GetContributionData = function (sequenceStep, newAction, newCom, commentPrefixes) {
                    var currentContributor = Workflow.controller.GetContributorAt(sequenceStep);
                    currentContributor.action = newAction;
                    currentContributor.date = new Date();
                    currentContributor.actualApprover = Sys.Helpers.String.ExtractLoginFromDN(Lib.P2P.GetValidatorOrOwnerLogin());
                    if (commentPrefixes) {
                        if (commentPrefixes.onBehalfOf) {
                            newCom = Lib.P2P.AddOnBehalfOf(currentContributor, newCom);
                        }
                        if (commentPrefixes.furtherApproval) {
                            var prefix = Language.Translate("_Requested further approval");
                            newCom = newCom.length > 0 ? prefix + "\n" + newCom : prefix;
                        }
                        if (commentPrefixes.modifyReport) {
                            var prefix = Language.Translate("_Expense report has been retrieved for modification");
                            newCom = newCom.length > 0 ? prefix + "\n" + newCom : prefix;
                        }
                    }
                    if (newCom) {
                        var previousComment = currentContributor.comment;
                        var newCommentFormatted = newCom;
                        if (previousComment && previousComment.length > 0) {
                            newCommentFormatted += "\n" + previousComment;
                        }
                        Data.SetValue("Comments__", "");
                        currentContributor.comment = newCommentFormatted;
                    }
                    return currentContributor;
                };
                var GoToNextStep = function (contributionData) {
                    Workflow.controller.NextContributor(contributionData);
                    var idx = Workflow.controller.GetContributorIndex();
                    var nextContributor = Workflow.controller.GetContributorAt(idx);
                    var nextContributors = Workflow.controller.GetParallelContributorsOf(nextContributor, true);
                    nextContributors.forEach(function (contributor) {
                        Log.Info("Grant validate right to approver: " + contributor.login);
                        Process.AddRight(contributor.login, "validate");
                        if (!contributor.additionalProperties || !contributor.additionalProperties.startingDate) {
                            Workflow.controller.UpdateAdditionalContributorData(contributor.contributorId, { startingDate: new Date(contributionData.date) });
                        }
                    });
                    Log.Info("forward_callback idx :" + idx);
                    Process.Forward(nextContributor.login);
                    Process.LeaveForm();
                    return nextContributor;
                };
                var GetExpenseStatusChecker = function (updatedStatus) {
                    return function (expense) {
                        var vars = expense.GetUninheritedVars();
                        return vars.GetValue_String("ExpenseStatus__", 0) !== updatedStatus;
                    };
                };
                function IsSubmissionAllowedByCustomization() {
                    var bok = true;
                    var res = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Server.OnExpenseReportSubmission");
                    if (res !== null) {
                        if (!Sys.Helpers.IsPlainObject(res)) {
                            Log.Error("Using default values since OnExpenseReportSubmission did not returned an object");
                            res = {};
                        }
                        if (res.allowValidation) {
                            bok = true;
                            Log.Info("OnExpenseReportSubmission => validation accepted");
                        }
                        else {
                            bok = false;
                            Log.Error("OnExpenseReportSubmission => validation refused with message: \"".concat(res.message, "\""));
                            Lib.CommonDialog.NextAlert.Define(res.title || "_Expense report creation error", res.message || "_Expense report creation error message", {
                                isError: Sys.Helpers.IsUndefined(res.isError) ? true : !!res.isError,
                                behaviorName: "OnExpenseReportSubmissionError"
                            });
                        }
                    }
                    else {
                        Log.Info("OnExpenseReportSubmission doesn't exists or returned null => validation accepted");
                    }
                    return bok;
                }
                var SubmitExpenses = function (context) {
                    Log.Info("Submitting expenses...");
                    var msnEx = Data.GetValue("MsnEx");
                    var originalOwnerLogin = Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OriginalOwnerID"));
                    var manager = null;
                    var contributors = [];
                    // skip the user (first contributor)
                    for (var i = 1; Workflow.controller && i < Workflow.controller.GetNbContributors(); i++) {
                        var step = Workflow.controller.GetContributorAt(i);
                        contributors.push(step.login);
                        if (!manager && step.role === roles.manager && step.login !== originalOwnerLogin) {
                            manager = step.login;
                        }
                    }
                    return Lib.Expense.Report.UpdateExpenses(context, "FromExpenseReport_Submit", {
                        contributors: contributors,
                        manager: manager
                    }, GetExpenseStatusChecker("To approve"), function (expense) {
                        var vars = expense.GetUninheritedVars();
                        vars.AddValue_String("ExpenseStatus__", "To approve", true);
                        vars.AddValue_String("ExpenseReportMsnEx__", msnEx, true);
                    });
                };
                var ApproveExpenses = function (context) {
                    Log.Info("Approving expenses...");
                    return Lib.Expense.Report.UpdateExpenses(context, "FromExpenseReport_Approve", {}, GetExpenseStatusChecker("To control"), function (expense) {
                        var vars = expense.GetUninheritedVars();
                        vars.AddValue_String("ExpenseStatus__", "To control", true);
                    });
                };
                var UpdateValidatedExpenses = function (context) {
                    return Lib.Expense.Report.UpdateExpenses(context, "FromExpenseReport_Validated", {}, GetExpenseStatusChecker("Validated"), function (expense) {
                        var vars = expense.GetUninheritedVars();
                        vars.AddValue_String("ExpenseStatus__", "Validated", true);
                    });
                };
                var BackToUserExpenses = function (context) {
                    Log.Info("Backing expenses to user...");
                    return Lib.Expense.Report.UpdateExpenses(context, "FromExpenseReport_BackToUser", {}, GetExpenseStatusChecker("To submit"), function (expense) {
                        var vars = expense.GetUninheritedVars();
                        vars.AddValue_String("ExpenseStatus__", "To submit", true);
                        vars.AddValue_String("ExpenseReportMsnEx__", "0", true); // "0" to force reset variable (with "", nothing is done)
                    });
                };
                var ForwardExpenses = function (context, action) {
                    Log.Info("Forwarding expenses, action: " + action);
                    var contributors = [];
                    var additionalContributors = Variable.GetValueAsString("AdditionalContributors");
                    if (!additionalContributors) {
                        return Sys.Helpers.Promise.Resolve(context);
                    }
                    Sys.Helpers.Object.ForEach(JSON.parse(additionalContributors), function (contributor) {
                        Log.Info("Grant read right to: " + contributor.login);
                        Process.SetRight(contributor.login, "read");
                        contributors.push(contributor.login);
                    });
                    return Lib.Expense.Report.UpdateExpenses(context, action, {
                        contributors: contributors
                    }, function (expense) { return true; }, null);
                };
                var RollbackExpenses = function (context) {
                    // The submission of the expense report just requested to update all expenses in state 90 (to approve),
                    // before arriving 90, the state goes through 50, in such case, the updating is not possible because:
                    // "cannot be saved because it has been changed by another user in the meantime."
                    var expense50 = Sys.Helpers.Array.Find(context.expenses, function (expense) {
                        var vars = expense.GetUninheritedVars();
                        var state = vars.GetValue_Long("State", 0);
                        return state === 50;
                    });
                    if (!expense50) {
                        RollbackSubmissionExpenses(context)
                            .Then(function () { return Variable.SetValueAsString("SubmissionFirstPartDone", "0"); })
                            .Catch(function (r) {
                            if (r instanceof Lib.Expense.Report.UpdateExpensesError) {
                                Lib.CommonDialog.NextAlert.Define("_Expense report creation error", "_Some expenses cannot be updated", { isError: true, behaviorName: "onUnexpectedError" });
                            }
                            else {
                                Lib.Expense.OnUnexpectedError(r);
                            }
                        });
                    }
                    else {
                        Log.Info("At least one expense in the expense repport is in state 50 and is not rollbackable -> PostValidation_Post");
                        Data.SetValue("ExpenseReportStatus__", "Draft");
                        Variable.SetValueAsString("SubmissionFirstPartDone", "2");
                        Process.RecallScript("PostValidation_Post", true);
                    }
                };
                var RollbackSubmissionExpenses = function (context) {
                    Log.Info("Rollbacking submission of expenses...");
                    var action = "FromExpenseReport_RollbackSubmit";
                    var msnEx = Data.GetValue("MsnEx");
                    return Lib.Expense.Report.UpdateExpenses(context, action, {}, function (expense) {
                        var vars = expense.GetUninheritedVars();
                        var expenseStatus = vars.GetValue_String("ExpenseStatus__", 0);
                        var expenseReportMsnEx = vars.GetValue_String("ExpenseReportMsnEx__", 0);
                        return expenseStatus !== "To submit" && expenseReportMsnEx === msnEx;
                    }, function (expense) {
                        var vars = expense.GetUninheritedVars();
                        vars.AddValue_String("RequestedActions", "approve|" + action, true);
                        vars.AddValue_String("ExpenseStatus__", "To submit", true);
                        vars.AddValue_String("ExpenseReportMsnEx__", "0", true); // "0" to force reset variable (with "", nothing is done)
                    });
                };
                var GetDefaultEmailNotificationCustomTags = function (recipientLogin) {
                    var user = Workflow.controller.GetContributorAt(0);
                    var userName = user.name;
                    var recipient = g.Users.GetUser(recipientLogin);
                    if (recipient != null) {
                        var lastValidator = Lib.P2P.GetValidatorOrOwner();
                        var lastValidatorName = lastValidator.GetValue("DisplayName");
                        var recipientName = recipient.GetValue("DisplayName");
                        return {
                            "UserName": userName,
                            "Number": Data.GetValue("ExpenseReportNumber__"),
                            "Description": Data.GetValue("Description__"),
                            "Currency": Data.GetValue("CC_Currency__"),
                            "Total": recipient.GetFormattedNumber(Data.GetValue("TotalAmount__")),
                            "Refundable": recipient.GetFormattedNumber(Data.GetValue("RefundableAmount__")),
                            "NonRefundable": recipient.GetFormattedNumber(Data.GetValue("NonRefundableAmount__")),
                            "DestinationFullName": recipientName,
                            "ValidationUrl": Data.GetValue("ValidationUrl"),
                            "LastValidatorName": lastValidatorName,
                            "Comment": newComment
                        };
                    }
                    Log.Warn("Recipient notification not found " + recipientLogin);
                    return {};
                };
                function NL2BRCustomTags(customTags) {
                    Sys.Helpers.Object.ForEach(customTags, function (val, key) {
                        customTags[key] = val.replace(/(\r\n)|\n/g, "<br>");
                    });
                    return customTags;
                }
                Workflow.SendEmailNotification = function (contributor, subject, template, backupUserAsCC) {
                    var login = contributor && contributor.login ? contributor.login : contributor;
                    var tags = GetDefaultEmailNotificationCustomTags(login);
                    tags = Sys.EmailNotification.EscapeCustomTags(tags);
                    tags = NL2BRCustomTags(tags);
                    //if you change this structure, plz update the sample in lib_PR_Customization_Server
                    var options = {
                        userId: login,
                        subject: subject,
                        template: template,
                        customTags: tags,
                        escapeCustomTags: false,
                        fromName: "_EskerExpenseManagement",
                        backupUserAsCC: !!backupUserAsCC,
                        sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                    };
                    var doSendNotif = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Server.OnSendEmailNotification", options);
                    if (doSendNotif !== false) {
                        Sys.EmailNotification.SendEmailNotification(options);
                    }
                };
                var SendPushNotification = function (nextContributor) {
                    // Send push notifications if enabled
                    if (Process.GetProcessDefinition().PushNotification === true) {
                        var pushNotificationType = (Sys.Parameters.GetInstance("Expense").GetParameter("PushNotificationType") || Sys.Parameters.GetInstance("P2P").GetParameter("PushNotificationType") || "").toLowerCase();
                        Log.Info("Sending " + pushNotificationType + " push notification");
                        if (pushNotificationType == "short" || pushNotificationType == "full") {
                            Sys.PushNotification.SendNotifToUser({
                                user: g.Users.GetUser(nextContributor.login),
                                id: pushNotificationType == "short" ? Process.GetProcessID() : Data.GetValue("ruidex"),
                                template: "ExpenseReport_PushNotif_NotifNextApprover_" + pushNotificationType + ".txt",
                                sendToBackupUser: true,
                                customTags: {
                                    "UserName__": Data.GetValue("UserName__"),
                                    "Description__": Data.GetValue("Description__"),
                                    "CC_Currency__": Data.GetValue("CC_Currency__"),
                                    "TotalAmount__": Data.GetValue("TotalAmount__"),
                                    "ExpenseReportNumber__": Data.GetValue("ExpenseReportNumber__")
                                }
                            });
                        }
                    }
                };
                Workflow.NotifyEndOfContributionOnMobile = function (contributor) {
                    // On mobile, only managers can approve the expense report
                    if (contributor.role === roles.manager) {
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
                    // notify the requester in order to refresh the "my expense reports" view
                    var requesterLogin = Data.GetValue("User__");
                    var requesterUser = Users.GetUser(requesterLogin);
                    if (requesterUser) {
                        Log.Info("Notifying the end of contribution step on mobile. A silent push notif will be sent to: ".concat(requesterLogin));
                        Sys.PushNotification.SendNotifToUser({
                            user: requesterUser,
                            id: Data.GetValue("ruidex"),
                            sendToBackupUser: false,
                            silent: true
                        });
                    }
                };
                var CatchErrors = function (reason, context) {
                    if (reason instanceof Lib.Expense.Report.QueryExpensesError || reason instanceof Lib.Expense.Report.MissingExpensesError) {
                        Lib.CommonDialog.NextAlert.Define("_Expense report update error", "_Some expenses cannot be found", { isError: true, behaviorName: "onUnexpectedError" });
                    }
                    else if (reason instanceof Lib.Expense.Report.LockExpensesError) {
                        Lib.CommonDialog.NextAlert.Define("_Expense report update error", "_Some expenses cannot be ownershipped", { isError: true, behaviorName: "onUnexpectedError" });
                    }
                    else if (reason instanceof Lib.Expense.Report.UpdateExpensesError) {
                        Lib.CommonDialog.NextAlert.Define("_Expense report update error", "_Some expenses cannot be updated", { isError: true, behaviorName: "onUnexpectedError" });
                    }
                    else if (reason instanceof Lib.Expense.Report.GenerateInvoiceError) {
                        Lib.CommonDialog.NextAlert.Define("_Expense report update error", "_Invoice cannot be generated", { isError: true, behaviorName: "onUnexpectedError" });
                    }
                    else {
                        Lib.Expense.OnUnexpectedError(reason);
                    }
                    return true; // error detected
                };
                var CatchErrorsOnSubmission = function (reason, context) {
                    var rollbackNeeded = true;
                    if (reason instanceof Lib.Expense.Report.QueryExpensesError || reason instanceof Lib.Expense.Report.MissingExpensesError) {
                        Lib.CommonDialog.NextAlert.Define("_Expense report creation error", "_Some expenses cannot be found");
                        rollbackNeeded = false;
                    }
                    else if (reason instanceof Lib.Expense.Report.AlreadySentExpensesError) {
                        Lib.CommonDialog.NextAlert.Define("_An expense is no longer sendable", "_The report can not be submitted because of the status of an expense");
                    }
                    else if (reason instanceof Lib.Expense.Report.LockExpensesError) {
                        Lib.CommonDialog.NextAlert.Define("_Expense report creation error", "_Some expenses cannot be ownershipped");
                    }
                    else if (reason instanceof Lib.Expense.Report.UpdateExpensesError) {
                        Lib.CommonDialog.NextAlert.Define("_Expense report creation error", "_Some expenses cannot be updated", { isError: true, behaviorName: "onUnexpectedError" });
                    }
                    else if (reason instanceof Lib.Expense.Report.CreatingPDFError) {
                        Lib.CommonDialog.NextAlert.Define("_Expense report creation error", "_Error generating PDF");
                    }
                    else {
                        Lib.Expense.OnUnexpectedError(reason);
                    }
                    if (rollbackNeeded) {
                        RollbackExpenses(context);
                    }
                    return true; // error detected
                };
                var Forward = function () {
                    var idx = Workflow.controller.GetContributorIndex();
                    Log.Info("forward_callback idx :" + idx);
                    var step = Workflow.controller.GetContributorAt(idx);
                    Process.Forward(step.login);
                    Process.LeaveForm();
                };
                // sequenceStep == 0 : the requester is doing a expense report modification
                var BackToRequester = function (sequenceStep) {
                    var bok = true;
                    var context = { expenseNumbers: Lib.Expense.Report.GetExpenseNumbersInForm() };
                    // Synchronous here ...
                    Lib.Expense.Report.QueryExpenses(context)
                        .Then(BackToUserExpenses)
                        .Catch(function (reason) { bok = !CatchErrors(reason, context); });
                    if (bok) {
                        Data.SetValue("ExpenseReportStatus__", "Draft");
                        var currentContributor = Workflow.controller.GetContributorAt(sequenceStep);
                        var contributionData = GetContributionData(sequenceStep, actions.sentBack, newComment, sequenceStep ? { onBehalfOf: true } : { modifyReport: true });
                        Workflow.controller.Restart(contributionData);
                        var nextContributor = Workflow.controller.GetContributorAt(0);
                        if (sequenceStep) {
                            var creatorOwner = Data.GetValue("CreatorOwnerID");
                            creatorOwner = creatorOwner ? Sys.Helpers.String.ExtractLoginFromDN(creatorOwner) : nextContributor.login;
                            Workflow.SendEmailNotification(creatorOwner, "_An expense report must be verified", "Expense_Email_NotifBack.htm");
                        }
                        else {
                            // Notify the current approver or controller
                            Workflow.SendEmailNotification(currentContributor, "_An expense report is being modified", "Expense_Email_NotifModifyReport.htm");
                        }
                        Workflow.NotifyEndOfContributionOnMobile(currentContributor);
                        Process.Forward(nextContributor.login);
                        if (sequenceStep) {
                            Process.LeaveForm();
                        }
                    }
                    return bok;
                };
                var lastError = null;
                var serverParameters = {
                    actions: {
                        submission: {
                            OnDone: function (sequenceStep) {
                                var bok = true;
                                var context = { expenseNumbers: Lib.Expense.Report.GetExpenseNumbersInForm() };
                                var submissionFirstPartDone = Variable.GetValueAsString("SubmissionFirstPartDone");
                                if (!submissionFirstPartDone || submissionFirstPartDone === "0") {
                                    bok = IsSubmissionAllowedByCustomization();
                                    if (bok) {
                                        // Synchronous here ...
                                        Lib.Expense.Report.QueryExpenses(context)
                                            .Then(Lib.Expense.Report.LockExpenses)
                                            .Then(Lib.Expense.Report.CheckExpenseNotAlreadySent)
                                            .Then(Lib.Expense.Report.SetExpenseReportNumber)
                                            .Then(SubmitExpenses)
                                            .Catch(function (reason) { bok = !CatchErrorsOnSubmission(reason, context); })
                                            // finally
                                            .Then(function () { return Lib.Expense.Report.UnlockExpenses(context); });
                                    }
                                    if (bok) {
                                        Lib.P2P.SetBillingInfo("ER001");
                                        Variable.SetValueAsString("SubmissionFirstPartDone", "1");
                                        Process.RecallScript("PostValidation_Post", true);
                                    }
                                }
                                else if (submissionFirstPartDone === "1") {
                                    var simulateMissingExpenses_1 = parseInt(Variable.GetValueAsString("SimulateMissingExpenses")) || 0;
                                    var simulateMissingExpensesCount_1 = simulateMissingExpenses_1 ? parseInt(Variable.GetValueAsString("SimulateMissingExpensesCount")) || 0 : 0;
                                    Lib.Expense.Report.QueryExpenses(context, simulateMissingExpensesCount_1 < simulateMissingExpenses_1)
                                        .Then(Lib.Expense.Report.AttachExpenseReportPDF)
                                        .Then(function () {
                                        Data.SetValue("SubmissionDate__", new Date());
                                        Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", function (line) {
                                            line.SetWarning("ExpenseNumber__", "");
                                        });
                                        var currentContributor = Workflow.controller.GetContributorAt(sequenceStep);
                                        var contributionData = GetContributionData(sequenceStep, actions.submitted, newComment, { onBehalfOf: true });
                                        if (!Variable.GetValueAsString("ERSubmissionDatetime")) {
                                            Variable.SetValueAsString("ERSubmissionDatetime", Sys.Helpers.Date.Date2DBDateTime(new Date()));
                                            // need to notify my-self ?
                                            Workflow.SendEmailNotification(Workflow.controller.GetContributorAt(sequenceStep), "_An expense report has been created", "Expense_Email_FirstNotifUser.htm");
                                        }
                                        Process.ResetRights();
                                        // Requester needs write right to modify the ER
                                        var step = Workflow.controller.GetContributorAt(0);
                                        Process.SetRight(step.login, "write");
                                        // All contributors can read this report
                                        for (var i = 1; i < Workflow.controller.GetNbContributors(); i++) {
                                            step = Workflow.controller.GetContributorAt(i);
                                            Log.Info("Grant read right to: " + step.login);
                                            Process.SetRight(step.login, "read");
                                        }
                                        var nextContributor = GoToNextStep(contributionData);
                                        if (nextContributor.role === roles.manager) {
                                            Data.SetValue("ExpenseReportStatus__", "To approve");
                                            Workflow.SendEmailNotification(nextContributor, "_An expense report is waiting for your action", "Expense_Email_NotifNextApprover.htm", true);
                                            SendPushNotification(nextContributor);
                                        }
                                        else {
                                            //No approver, switch directly to controler
                                            Data.SetValue("ExpenseReportStatus__", "To control");
                                        }
                                        Variable.SetValueAsString("SubmissionFirstPartDone", "0");
                                        if (simulateMissingExpenses_1) {
                                            Variable.SetValueAsString("SimulateMissingExpensesCount", "");
                                        }
                                        Workflow.NotifyEndOfContributionOnMobile(currentContributor);
                                    })
                                        .Catch(function (reason) {
                                        bok = false;
                                        if (reason instanceof Lib.Expense.Report.MissingExpensesError) {
                                            var count = parseInt(Variable.GetValueAsString("SubmissionRetryCount"), 10) || 0;
                                            if (count < 10) {
                                                Log.Info("At least one expense is currently being modified in the database -> PostValidation_Post " + count);
                                                Variable.SetValueAsString("SubmissionRetryCount", ++count);
                                                Process.RecallScript("PostValidation_Post", true);
                                            }
                                            else {
                                                Log.Info("At least one expense is currently being modified in the database and the max submission retry count is reached");
                                                Lib.CommonDialog.NextAlert.Define("_Expenses updating in progress", "_Some expenses are being updated", { isError: false, behaviorName: "MissingExpensesError" });
                                                Workflow.SendEmailNotification(Workflow.controller.GetContributorAt(0), "_An expense report submission is in progress", "Expense_Email_NotifRequesterInProgress.htm");
                                                // !!! Do not rollback expenses to allow the user to resumbit
                                                Variable.SetValueAsString("SubmissionRetryCount", "");
                                                if (simulateMissingExpenses_1) {
                                                    Variable.SetValueAsString("SimulateMissingExpensesCount", ++simulateMissingExpensesCount_1);
                                                }
                                            }
                                        }
                                        else {
                                            CatchErrorsOnSubmission(reason, context);
                                            Data.SetValue("ExpenseReportStatus__", "Draft");
                                        }
                                    });
                                }
                                else {
                                    // rollback expenses
                                    Lib.Expense.Report.QueryExpenses(context)
                                        .Then(function () { return RollbackExpenses(context); })
                                        .Catch(function (reason) { CatchErrorsOnSubmission(reason, context); });
                                    bok = false;
                                }
                                return bok;
                            }
                        },
                        approval: {
                            OnDone: function (sequenceStep) {
                                var autoApproveIfNextIsSameApprover = function () {
                                    var role = nextContributor.role;
                                    var currentUser = Lib.P2P.GetValidatorOrOwner();
                                    var currentUserLogin = currentUser.GetValue("Login");
                                    while (nextContributor && nextContributor.role === role && currentUserLogin === nextContributor.login) {
                                        Log.Info("Auto approve step " + sequenceStep + " for " + nextContributor.login);
                                        Workflow.controller.NextContributor(contributionData);
                                        Forward(); // Need to change owner in order to be coherent with the current contributor
                                        sequenceStep = Workflow.controller.GetContributorIndex();
                                        contributionData = GetContributionData(sequenceStep, actions.toControl, Language.Translate("_Expense report auto approved"), { onBehalfOf: true });
                                        nextContributor = Workflow.controller.GetContributorAt(sequenceStep + 1);
                                    }
                                };
                                var bok = true;
                                var currentContributor = Workflow.controller.GetContributorAt(sequenceStep);
                                var contributionData = GetContributionData(sequenceStep, actions.toControl, newComment, { onBehalfOf: true });
                                var nextContributor = Workflow.controller.GetContributorAt(sequenceStep + 1);
                                // If the nextContributor does not exist, set an error
                                if (nextContributor && Users.GetUser(nextContributor.login) == null) {
                                    Lib.CommonDialog.NextAlert.Define("_Expense report next approver error", "_Next approver does not exist");
                                    bok = false;
                                }
                                if (bok) {
                                    var context_1 = {};
                                    bok = ManageRemovedExpenses(context_1);
                                    if (nextContributor && nextContributor.role === roles.manager) {
                                        autoApproveIfNextIsSameApprover();
                                    }
                                    var approved = !nextContributor || nextContributor.role === roles.controller;
                                    if (bok && approved) {
                                        Log.Info("Expense report is approved.");
                                        context_1.expenseNumbers = context_1.expenseNumbers || Lib.Expense.Report.GetExpenseNumbersInForm();
                                        context_1.queryExpense = context_1.queryExpense || Lib.Expense.Report.QueryExpenses(context_1);
                                        // Synchronous here ...
                                        context_1.queryExpense.Then(ApproveExpenses)
                                            .Catch(function (reason) { bok = !CatchErrors(reason, context_1); });
                                        if (bok) {
                                            Data.SetValue("ExpenseReportStatus__", "To control");
                                            if (nextContributor) {
                                                nextContributor = GoToNextStep(contributionData);
                                                // There is a reminders for pending expense report controls, so we do not want to notify the controller
                                                // SendEmailNotification(nextContributor, "_An expense report is waiting for your action", "Expense_Email_NotifNextApprover.htm", true);
                                            }
                                        }
                                    }
                                    else {
                                        nextContributor = GoToNextStep(contributionData);
                                        Workflow.SendEmailNotification(nextContributor, "_An expense report is waiting for your action", "Expense_Email_NotifNextApprover.htm", true);
                                        SendPushNotification(nextContributor);
                                    }
                                    if (bok) {
                                        // Send notification to the requester when the expense report is approuved
                                        if (Sys.Parameters.GetInstance("Expense").GetParameter("SendApprovalNotificationToRequester") !== "none") {
                                            var initiator = Workflow.controller.GetContributorAt(0);
                                            Workflow.SendEmailNotification(initiator, "_An expense report has been approved", "Expense_Email_NotifRequesterAfterApprobation.htm");
                                        }
                                        Workflow.NotifyEndOfContributionOnMobile(currentContributor);
                                    }
                                }
                                return bok;
                            }
                        },
                        control: {
                            OnDone: function (sequenceStep) {
                                var bok = true;
                                var currentContributor = Workflow.controller.GetContributorAt(sequenceStep);
                                var nextContributor = Workflow.controller.GetContributorAt(sequenceStep + 1);
                                var validated = !nextContributor;
                                // If the nextContributor does not exist, set an error
                                if (nextContributor && Users.GetUser(nextContributor.login) == null) {
                                    Lib.CommonDialog.NextAlert.Define("_Expense report next approver error", "_Next approver does not exist");
                                    bok = false;
                                }
                                if (bok) {
                                    var context = {};
                                    bok = ManageRemovedExpenses(context);
                                    if (bok && validated) {
                                        Process.RecallScript("PostValidation_Validated", true);
                                    }
                                    else {
                                        var contributionData = GetContributionData(sequenceStep, actions.validated, newComment, { onBehalfOf: true });
                                        nextContributor = GoToNextStep(contributionData);
                                        // There is a reminders for pending expense report controls, so we do not want to notify the controller
                                        // SendEmailNotification(nextContributor, "_An expense report is waiting for your action", "Expense_Email_NotifNextApprover.htm", true);
                                    }
                                    Workflow.NotifyEndOfContributionOnMobile(currentContributor);
                                }
                                return bok;
                            }
                        },
                        sentBack: {
                            OnDone: function (sequenceStep) {
                                return BackToRequester(sequenceStep);
                            }
                        },
                        modifyReport: {
                            OnDone: function (sequenceStep) {
                                return BackToRequester(0);
                            }
                        },
                        deleted: {
                            OnDone: function (sequenceStep) {
                                var bok = true;
                                Data.SetValue("ExpenseReportStatus__", "Deleted");
                                var currentContributor = Workflow.controller.GetContributorAt(sequenceStep);
                                var contributionData = GetContributionData(sequenceStep, actions.deleted, newComment, { onBehalfOf: true });
                                Workflow.controller.EndWorkflow(contributionData);
                                // Delete message
                                Process.Cancel();
                                Process.LeaveForm();
                                Workflow.NotifyEndOfContributionOnMobile(currentContributor);
                                return bok;
                            }
                        },
                        forward: {
                            OnDone: function (sequenceStep) {
                                var context = {};
                                var bok = ManageRemovedExpenses(context);
                                if (bok) {
                                    context.expenseNumbers = context.expenseNumbers || Lib.Expense.Report.GetExpenseNumbersInForm();
                                    context.queryExpense = context.queryExpense || Lib.Expense.Report.QueryExpenses(context);
                                    context.queryExpense.Then(function () { return ForwardExpenses(context, "FromExpenseReport_Forward"); })
                                        .Catch(function (reason) { bok = !CatchErrors(reason, context); });
                                    var currentContributor = Workflow.controller.GetContributorAt(sequenceStep);
                                    var contributionData = GetContributionData(sequenceStep, actions.forward, newComment, { onBehalfOf: true });
                                    var nextContributor = GoToNextStep(contributionData);
                                    Workflow.SendEmailNotification(nextContributor, "_An expense report is waiting for your action", "Expense_Email_NotifNextApprover.htm", true);
                                    SendPushNotification(nextContributor);
                                    Variable.SetValueAsString("AdditionalContributors", "");
                                    // Send notification to the requester when the expense report is approuved
                                    if (Sys.Parameters.GetInstance("Expense").GetParameter("SendApprovalNotificationToRequester") !== "none") {
                                        var initiator = Workflow.controller.GetContributorAt(0);
                                        Workflow.SendEmailNotification(initiator, "_An expense report has been approved", "Expense_Email_NotifRequesterAfterApprobation.htm");
                                    }
                                    Workflow.NotifyEndOfContributionOnMobile(currentContributor);
                                }
                                return bok;
                            }
                        },
                        requestFurtherApproval: {
                            OnDone: function (sequenceStep) {
                                var context = {};
                                var bok = ManageRemovedExpenses(context);
                                if (bok) {
                                    context.expenseNumbers = context.expenseNumbers || Lib.Expense.Report.GetExpenseNumbersInForm();
                                    context.queryExpense = context.queryExpense || Lib.Expense.Report.QueryExpenses(context);
                                    context.queryExpense.Then(function () { return ForwardExpenses(context, "FromExpenseReport_RequestFurtherApproval"); })
                                        .Catch(function (reason) { bok = !CatchErrors(reason, context); });
                                    if (bok) {
                                        Data.SetValue("ExpenseReportStatus__", "To approve");
                                        var currentContributor = Workflow.controller.GetContributorAt(sequenceStep);
                                        var contributionData = GetContributionData(sequenceStep, actions.forward, newComment, { onBehalfOf: true });
                                        var nextContributor = GoToNextStep(contributionData);
                                        Workflow.SendEmailNotification(nextContributor, "_An expense report is waiting for your action", "Expense_Email_NotifNextApprover.htm", true);
                                        SendPushNotification(nextContributor);
                                        Variable.SetValueAsString("AdditionalContributors", "");
                                        Workflow.NotifyEndOfContributionOnMobile(currentContributor);
                                    }
                                }
                                return bok;
                            }
                        },
                        validated: {
                            OnDone: function (sequenceStep) {
                                Log.Info("Expense report is validated.");
                                var bok = true;
                                var context = { expenseNumbers: Lib.Expense.Report.GetExpenseNumbersInForm() };
                                // Synchronous here ...
                                var endTaskPromise = Lib.Expense.Report.QueryExpenses(context)
                                    .Then(function (promisedContext) {
                                    return Lib.Expense.Report.IsRefundable() ? Lib.Expense.Report.GenerateInvoice(promisedContext) : Sys.Helpers.Promise.Resolve(promisedContext);
                                })
                                    .Then(UpdateValidatedExpenses)
                                    .Catch(function (reason) { bok = !CatchErrors(reason, context); });
                                if (bok) {
                                    // Here, we check that the task promise is correctly resolved. When generating the invoice, we reload the configuration and wait if it is ready.
                                    // If any error, the internal callback is never called ... So the rest of the code is not executed.
                                    if (Sys.Helpers.Promise.IsResolvedSync(endTaskPromise)) {
                                        var contributionData = GetContributionData(sequenceStep, actions.validated, newComment, { onBehalfOf: true });
                                        Data.SetValue("ExpenseReportStatus__", "Validated");
                                        Workflow.SendEmailNotification(Workflow.controller.GetContributorAt(0), "_Your expense report has been validated", "Expense_Email_NotifUserValidation.htm");
                                        Workflow.controller.EndWorkflow(contributionData);
                                    }
                                    else {
                                        Log.Error("[ExpenseReport-ControlAction] the task promise hasn't been resolved");
                                        bok = false;
                                    }
                                }
                                return bok;
                            }
                        }
                    },
                    callbacks: {
                        OnError: function (msg) {
                            lastError = msg;
                            if (msg instanceof Sys.WorkflowEngine.Error) {
                                Log.Error(msg.toRawErrorString());
                            }
                            else {
                                Log.Info("Workflow Error :" + msg);
                            }
                        }
                    },
                    getLastError: function () {
                        return lastError;
                    }
                };
                function BuildEmailRollBackExpense(expensesDeleted) {
                    var fromName = Users.GetUser(Data.GetValue("OwnerId")).GetValue("DisplayName");
                    var baseUrl = Data.GetValue("ValidationUrl");
                    baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/"));
                    var tempCustomTags = {
                        Items__: "",
                        FromName: fromName,
                        PlurialItems: expensesDeleted.length > 1,
                        ViewUrl: baseUrl + "/View.link?tabName=_Expense&viewName=_Expense%20-%20To%20submit",
                        Comment: newComment
                    };
                    tempCustomTags = Sys.EmailNotification.EscapeCustomTags(tempCustomTags);
                    tempCustomTags = NL2BRCustomTags(tempCustomTags);
                    var itemsCount = expensesDeleted.length;
                    for (var i = 0; i < itemsCount; i++) {
                        tempCustomTags.Items__ += "<li><strong>".concat(Language.Translate("_ExpenseNumber"), ":</strong> ").concat(expensesDeleted[i].ExpenseNumber, "</li>");
                    }
                    var options = {
                        userId: Workflow.controller.GetContributorAt(0).login,
                        template: "Expense_Email_NotifExpensesRollBack.htm",
                        fromName: "_EskerExpenseManagement",
                        backupUserAsCC: false,
                        sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1",
                        customTags: tempCustomTags,
                        escapeCustomTags: false
                    };
                    return options;
                }
                function ManageRemovedExpenses(context) {
                    var bok = true;
                    // If the controller have remove an expense
                    var expensesDeleted = Sys.TechnicalData.GetValue("expensesDeleted") || [];
                    if (expensesDeleted.length) {
                        Log.Info("An expense has been deleted.");
                        context.expenseNumbers = Lib.Expense.Report.GetExpenseNumbersInForm();
                        context.queryExpense = Lib.Expense.Report.QueryExpenses(context);
                        /*await*/ context.queryExpense.Then(Lib.Expense.Report.ReviseExportReportPDF)
                            .Catch(function (reason) { bok = !CatchErrors(reason, context); });
                        if (bok) {
                            var removedItemContext_1 = { expenseNumbers: [] };
                            expensesDeleted.forEach(function (elem) {
                                removedItemContext_1.expenseNumbers.push(elem.ExpenseNumber);
                            });
                            /*await*/ Lib.Expense.Report.QueryExpenses(removedItemContext_1)
                                .Then(RollbackSubmissionExpenses)
                                .Then(function () {
                                Log.Info("Reset expensesDeleted in technicalData ...");
                                Sys.TechnicalData.SetValue("expensesDeleted", []);
                                Log.Info("Send notification for the rollback of expenses deleted ...");
                                var options = BuildEmailRollBackExpense(expensesDeleted);
                                var doSendNotif = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Server.OnSendEmailNotification", options);
                                if (doSendNotif !== false) {
                                    Sys.EmailNotification.SendEmailNotification(options);
                                }
                            })
                                .Catch(function (reason) { bok = !CatchErrors(reason, removedItemContext_1); });
                        }
                    }
                    return bok;
                }
                Sys.Helpers.Extend(true, Lib.Expense.Report.Workflow.parameters, serverParameters);
            })(Workflow = Report.Workflow || (Report.Workflow = {}));
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
