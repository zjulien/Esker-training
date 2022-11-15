/**
 * @file Lib.AP.WorkflowCompatibility library. Requires Sys.WorkflowController
 */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_WorkflowCtrl_V12.0.461.0",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ],
  "name": "Lib_AP_WorkflowCompatibility_V12.0.461.0"
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var WorkflowCompatibility;
        (function (WorkflowCompatibility) {
            function buildContributor(user, role, action) {
                return {
                    //mandatory fields
                    contributorId: user.login + role,
                    role: role,
                    //not mandatory fields
                    login: user.login,
                    email: user.emailAddress,
                    name: user.displayName,
                    action: action
                };
            }
            var ValidActions;
            (function (ValidActions) {
                ValidActions["Validated"] = "_Validated";
                ValidActions["PaymentApprovalRequested"] = "_Payment approval requested";
                ValidActions["PaymentApproved"] = "_PaymentApproved";
                ValidActions["ApprovedWithoutReviewing"] = "_Approved without reviewing";
                ValidActions["BackToPrevious"] = "_Back to previous";
                ValidActions["BackToAP"] = "_Back to AP";
                ValidActions["Linked"] = "_Linked";
                ValidActions["AddApproverRequested"] = "_Add approver requested";
                ValidActions["InvoiceRejected"] = "_InvoiceRejected";
                ValidActions["SetAside"] = "_Set aside history";
                ValidActions["SetOnHold"] = "_Set on hold history";
                ValidActions["ERPPostingError"] = "_ERP posting error";
                ValidActions["GRUpdated"] = "_Goods receipt updated for the following orders :{0}";
                ValidActions["GRUpdatedDetails"] = "_Goods receipts ({1}) updated for the following orders :{0}";
            })(ValidActions || (ValidActions = {}));
            WorkflowCompatibility.workflowConvertersParameters = {
                workflowUI: null,
                workflowInitiator: null,
                oldContributors: null,
                currentHistory: null,
                actions: {
                    "_Validated": {
                        action: "post",
                        OnDone: function (sequenceStep) {
                            // Only impact workflow when no more action will be executed after,
                            // else the next action will impact the workflow (request approval or ERP error)
                            if (Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToPay || Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.Paid) {
                                WorkflowCompatibility.workflowConvertersParameters.workflowUI.EndWorkflow(WorkflowCompatibility.workflowConvertersParameters.GetContributionData(sequenceStep, "post"));
                            }
                        }
                    },
                    "_Payment approval requested": {
                        action: "requestApproval",
                        OnDone: function (sequenceStep) {
                            WorkflowCompatibility.workflowConvertersParameters.GoToNext(sequenceStep, "requestApproval");
                        }
                    },
                    "_PaymentApproved": {
                        action: "approve",
                        OnDone: function (sequenceStep) {
                            if (WorkflowCompatibility.workflowConvertersParameters.workflowUI.GetContributorAt(sequenceStep + 1)) {
                                WorkflowCompatibility.workflowConvertersParameters.GoToNext(sequenceStep, "approve");
                            }
                            else {
                                WorkflowCompatibility.workflowConvertersParameters.workflowUI.EndWorkflow(WorkflowCompatibility.workflowConvertersParameters.GetContributionData(sequenceStep, "approve"));
                            }
                        }
                    },
                    "_Approved without reviewing": {
                        action: "approve",
                        OnDone: function (sequenceStep) {
                            WorkflowCompatibility.workflowConvertersParameters.GoToNext(sequenceStep, "approve");
                        }
                    },
                    "_Back to previous": {
                        action: "backToPrevious",
                        OnDone: function (sequenceStep) {
                            WorkflowCompatibility.workflowConvertersParameters.BackTo(sequenceStep, sequenceStep - 1, "backToPrevious");
                        }
                    },
                    "_Back to AP": {
                        action: "backToAP"
                    },
                    "_Linked": {
                        action: "post"
                    },
                    "_Add approver requested": {
                        action: "requestFurtherApproval",
                        OnDone: function (sequenceStep) {
                            WorkflowCompatibility.workflowConvertersParameters.BackTo(sequenceStep + 1, sequenceStep, "requestFurtherApproval");
                        }
                    },
                    "_InvoiceRejected": {
                        action: "reject",
                        OnDone: function (sequenceStep) {
                            WorkflowCompatibility.workflowConvertersParameters.workflowUI.EndWorkflow(WorkflowCompatibility.workflowConvertersParameters.GetContributionData(sequenceStep, "reject"));
                        }
                    },
                    "_Set aside history": {
                        action: "setAside",
                        OnDone: function (sequenceStep) {
                            WorkflowCompatibility.workflowConvertersParameters.BackTo(sequenceStep, sequenceStep, "setAside");
                        }
                    },
                    "_Set on hold history": {
                        action: "onHold",
                        OnDone: function (sequenceStep) {
                            WorkflowCompatibility.workflowConvertersParameters.BackTo(sequenceStep, sequenceStep, "onHold");
                        }
                    },
                    "_ERP posting error": {
                        action: "ERPIntegrationError",
                        OnDone: function (sequenceStep) {
                            var sequenceToUpdate = sequenceStep > 0 ? sequenceStep - 1 : sequenceStep;
                            WorkflowCompatibility.workflowConvertersParameters.BackTo(sequenceToUpdate, sequenceToUpdate, "ERPIntegrationError");
                        }
                    },
                    "_Goods receipt updated for the following orders :{0}": {
                        action: "checkGoodsReceipt",
                        OnDone: function (sequenceStep) {
                            WorkflowCompatibility.workflowConvertersParameters.BackTo(sequenceStep, sequenceStep, "checkGoodsReceipt");
                        }
                    },
                    "_Goods receipts ({1}) updated for the following orders :{0}": {
                        action: "checkGoodsReceipt",
                        OnDone: function (sequenceStep) {
                            WorkflowCompatibility.workflowConvertersParameters.BackTo(sequenceStep, sequenceStep, "checkGoodsReceipt");
                        }
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
                        }
                    }
                },
                roles: {
                    apStart: {
                        OnBuild: function (callback) {
                            var ap = WorkflowCompatibility.workflowConvertersParameters.workflowInitiator;
                            WorkflowCompatibility.workflowConvertersParameters.workflowUI.SetSerializedValue("workflowInitiator", ap);
                            callback([buildContributor(ap, Lib.AP.WorkflowCtrl.roles.apStart, "toVerify")]);
                            return true;
                        }
                    },
                    apEnd: {
                        OnBuild: function (callback) {
                            if (!Lib.AP.WorkflowCompatibility.IsPostFirstApprovalMode() && WorkflowCompatibility.workflowConvertersParameters.oldContributors && WorkflowCompatibility.workflowConvertersParameters.oldContributors.length > 0) {
                                var ap = WorkflowCompatibility.workflowConvertersParameters.workflowInitiator;
                                callback([buildContributor(ap, Lib.AP.WorkflowCtrl.roles.apEnd, "toPost")]);
                                return true;
                            }
                            return false;
                        }
                    },
                    controller: {
                        OnBuild: function (callback) {
                            var approvers = [];
                            if (WorkflowCompatibility.workflowConvertersParameters.oldContributors && !Lib.AP.WorkflowCompatibility.IsPostFirstApprovalMode()) {
                                for (var i = 0; i < WorkflowCompatibility.workflowConvertersParameters.oldContributors.length; i++) {
                                    var contributor = WorkflowCompatibility.workflowConvertersParameters.oldContributors[i];
                                    approvers.push(buildContributor(contributor, Lib.AP.WorkflowCtrl.roles.controller, "toApprove"));
                                }
                                WorkflowCompatibility.workflowConvertersParameters.workflowUI.SetSerializedValue("ControllersList", WorkflowCompatibility.workflowConvertersParameters.oldContributors);
                            }
                            callback(approvers);
                            return true;
                        }
                    },
                    approver: {
                        OnBuild: function (callback) {
                            var approvers = [];
                            if (WorkflowCompatibility.workflowConvertersParameters.oldContributors && Lib.AP.WorkflowCompatibility.IsPostFirstApprovalMode()) {
                                for (var i = 0; i < WorkflowCompatibility.workflowConvertersParameters.oldContributors.length; i++) {
                                    var contributor = WorkflowCompatibility.workflowConvertersParameters.oldContributors[i];
                                    approvers.push(buildContributor(contributor, Lib.AP.WorkflowCtrl.roles.approver, "toApprove"));
                                }
                                WorkflowCompatibility.workflowConvertersParameters.workflowUI.SetSerializedValue("ApproversList", WorkflowCompatibility.workflowConvertersParameters.oldContributors);
                            }
                            callback(approvers);
                            return true;
                        }
                    }
                },
                delayedData: {
                    isGroup: {
                        type: "isGroupInfo",
                        key: "login"
                    }
                },
                callbacks: {},
                GetContributionData: function (sequenceStep, action) {
                    var currentContributor = WorkflowCompatibility.workflowConvertersParameters.workflowUI.GetContributorAt(sequenceStep);
                    currentContributor.action = action;
                    currentContributor.date = WorkflowCompatibility.workflowConvertersParameters.currentHistory.datetime;
                    currentContributor.approved = true;
                    currentContributor.comment = WorkflowCompatibility.workflowConvertersParameters.currentHistory.comment.trim();
                    return currentContributor;
                },
                GoToNext: function (sequenceStep, action) {
                    var contributionData = WorkflowCompatibility.workflowConvertersParameters.GetContributionData(sequenceStep, action);
                    WorkflowCompatibility.workflowConvertersParameters.workflowUI.NextContributor(contributionData);
                },
                BackTo: function (currentSequenceStep, backToSequenceStep, action) {
                    var contributionData = WorkflowCompatibility.workflowConvertersParameters.GetContributionData(currentSequenceStep, action);
                    WorkflowCompatibility.workflowConvertersParameters.workflowUI.BackTo(backToSequenceStep, contributionData);
                }
            };
            function addCommentLine(historyItem, newLine) {
                if (historyItem.comment) {
                    historyItem.comment += "\n";
                }
                historyItem.comment += newLine;
            }
            function isAPAction(historyItem) {
                var apActions = [ValidActions.PaymentApprovalRequested, ValidActions.InvoiceRejected, ValidActions.SetAside];
                return apActions.indexOf(historyItem.action) >= 0;
            }
            function isApprobationAction(historyItem) {
                return [ValidActions.BackToPrevious, ValidActions.BackToAP, ValidActions.SetOnHold, ValidActions.ApprovedWithoutReviewing, ValidActions.AddApproverRequested, ValidActions.PaymentApproved].indexOf(historyItem.action) !== -1;
            }
            WorkflowCompatibility.workflowUI = null;
            function IsCompatibilityMode() {
                if (!Variable.GetValueAsString("wkfdata") && (Data.GetValue("History__") || Data.GetTable("ApproversList__").GetItemCount() > 0)) {
                    return true;
                }
                return false;
            }
            WorkflowCompatibility.IsCompatibilityMode = IsCompatibilityMode;
            function MigrateWorkflow(wkfUI, wkfTableControl) {
                if (!Lib.AP.WorkflowCompatibility.IsCompatibilityMode()) {
                    return;
                }
                Lib.AP.WorkflowCompatibility.workflowUI = wkfUI;
                var invoiceHistoric = Lib.AP.WorkflowCompatibility.ExtractHistory(Data.GetValue("History__"));
                Lib.AP.WorkflowCompatibility.InitMigration(wkfTableControl, invoiceHistoric);
                Lib.AP.WorkflowCompatibility.CreateNewWorflow(invoiceHistoric);
            }
            WorkflowCompatibility.MigrateWorkflow = MigrateWorkflow;
            function IsPostFirstApprovalMode() {
                return Data.GetValue("PaymentApprovalMode__") === "PostFirst";
            }
            WorkflowCompatibility.IsPostFirstApprovalMode = IsPostFirstApprovalMode;
            function FormatAndTranslate(action, addBrackets, parametersArray) {
                var params = [action, addBrackets];
                for (var i = 0; i < parametersArray.length; ++i) {
                    params.push(parametersArray[i]);
                }
                Language.Translate.apply(this, params);
            }
            WorkflowCompatibility.FormatAndTranslate = FormatAndTranslate;
            function GetRoleForHistoryAction(historyItem) {
                if (!isApprobationAction(historyItem)) {
                    return Lib.AP.WorkflowCtrl.roles.apStart;
                }
                return Lib.AP.WorkflowCompatibility.IsPostFirstApprovalMode() ? Lib.AP.WorkflowCtrl.roles.approver : Lib.AP.WorkflowCtrl.roles.controller;
            }
            WorkflowCompatibility.GetRoleForHistoryAction = GetRoleForHistoryAction;
            function CopyPreHistoryLines(historyObj) {
                var input = [];
                var max = historyObj.lastAPIndex;
                if (historyObj.lastAPIndex === -1) {
                    max = historyObj.history.length;
                }
                for (var i = 0; i < max; i++) {
                    var historyStep = historyObj.history[i];
                    if (historyStep.action && WorkflowCompatibility.workflowConvertersParameters.actions[historyStep.action]) {
                        input.push({
                            action: WorkflowCompatibility.workflowConvertersParameters.actions[historyStep.action].action,
                            date: historyStep.datetime,
                            name: historyStep.user,
                            login: "",
                            role: Lib.AP.WorkflowCompatibility.GetRoleForHistoryAction(historyStep),
                            approved: true,
                            comment: historyStep.comment.trim()
                        });
                    }
                    else {
                        Log.Error("Unsupported action: " + historyStep.action);
                    }
                }
                Lib.AP.WorkflowCompatibility.workflowUI.InitialiseTableWithPastActions(input);
            }
            WorkflowCompatibility.CopyPreHistoryLines = CopyPreHistoryLines;
            function InitMigration(wkfTableControl, invoiceHistory) {
                WorkflowCompatibility.workflowConvertersParameters.workflowUI = Lib.AP.WorkflowCompatibility.workflowUI;
                WorkflowCompatibility.workflowConvertersParameters.oldContributors = Lib.AP.WorkflowCompatibility.GetContributorsFromOldWorkflow(wkfTableControl);
                // Async call in this function
                Lib.AP.WorkflowCompatibility.GetWorkflowInitiator(invoiceHistory);
            }
            WorkflowCompatibility.InitMigration = InitMigration;
            function GetWorkflowInitiator(invoiceHistory) {
                WorkflowCompatibility.workflowConvertersParameters.workflowInitiator =
                    {
                        login: Data.GetValue("WorkflowInitiator__"),
                        displayName: Data.GetValue("WorkflowInitiator__")
                    };
                if (!WorkflowCompatibility.workflowConvertersParameters.workflowInitiator.login) {
                    WorkflowCompatibility.workflowConvertersParameters.workflowInitiator.login = Data.GetValue("ownerid");
                }
                if (invoiceHistory && invoiceHistory.history.length > 0) {
                    WorkflowCompatibility.workflowConvertersParameters.workflowInitiator.displayName = invoiceHistory.history[0].user;
                }
                Sys.GenericAPI.Query("ODUSER", "LOGIN=" + WorkflowCompatibility.workflowConvertersParameters.workflowInitiator.login, ["DISPLAYNAME", "EMAILADDRESS"], Lib.AP.WorkflowCompatibility.CompleteWorkflowInitiator);
            }
            WorkflowCompatibility.GetWorkflowInitiator = GetWorkflowInitiator;
            function CompleteWorkflowInitiator(results) {
                if (results && results.length > 0) {
                    var needRebuild = WorkflowCompatibility.workflowConvertersParameters.workflowInitiator.displayName !== "";
                    WorkflowCompatibility.workflowConvertersParameters.workflowInitiator.displayName = results[0].DISPLAYNAME;
                    WorkflowCompatibility.workflowConvertersParameters.workflowInitiator.emailAddress = results[0].EMAILADDRESS;
                    if (needRebuild) {
                        WorkflowCompatibility.workflowConvertersParameters.workflowUI.Rebuild();
                    }
                }
                else {
                    WorkflowCompatibility.workflowConvertersParameters.workflowInitiator.emailAddress = "";
                }
            }
            WorkflowCompatibility.CompleteWorkflowInitiator = CompleteWorkflowInitiator;
            function CreateNewWorflow(invoiceHistoric) {
                Lib.AP.WorkflowCompatibility.workflowUI.Define(WorkflowCompatibility.workflowConvertersParameters);
                Lib.AP.WorkflowCompatibility.CopyPreHistoryLines(invoiceHistoric);
                Lib.AP.WorkflowCompatibility.workflowUI.SetRolesSequence(["apStart", "controller", "apEnd", "approver"]);
                Lib.AP.WorkflowCompatibility.ReplayWorkflowActions(invoiceHistoric);
            }
            WorkflowCompatibility.CreateNewWorflow = CreateNewWorflow;
            function GetContributorsFromOldWorkflow(wkfTableControl) {
                var contributors = [];
                if (!wkfTableControl) {
                    return contributors;
                }
                var approversCount = wkfTableControl.GetItemCount();
                for (var i = 0; i < approversCount; i++) {
                    var item = wkfTableControl.GetItem(i);
                    if (item.GetValue("Approver__")) {
                        contributors.push({
                            login: item.GetValue("ApproverID__"),
                            displayName: item.GetValue("Approver__"),
                            emailAddress: item.GetValue("ApproverEmail__"),
                            approved: item.GetValue("Approved__"),
                            action: "toApprove"
                        });
                    }
                }
                return contributors;
            }
            WorkflowCompatibility.GetContributorsFromOldWorkflow = GetContributorsFromOldWorkflow;
            function ExtractHistory(rawHistory) {
                // Extract each history element
                var result = {
                    history: [],
                    lastAPIndex: null
                };
                if (!rawHistory) {
                    return result;
                }
                var tmp = rawHistory.replace(/\r\n/g, "\n").split("\n");
                var currentItem = null;
                for (var i = 0; i < tmp.length; i++) {
                    var line = tmp[i];
                    if (line.search(/[0-9]{2}\/[0-9]{2}\/[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} - /) >= 0) {
                        // new history item
                        currentItem = Lib.AP.WorkflowCompatibility.ExtractHistoryLine(line);
                        result.history.push(currentItem);
                        if (result.lastAPIndex === null) {
                            if (isAPAction(currentItem)) {
                                result.lastAPIndex = result.history.length - 1;
                            }
                            else if (currentItem.action === ValidActions.BackToAP) {
                                // special case: back to AP
                                result.lastAPIndex = -1;
                            }
                        }
                    }
                    else {
                        // new comment line
                        addCommentLine(currentItem, line);
                    }
                }
                // reverse table
                result.history.reverse();
                if (result.lastAPIndex === null) {
                    result.lastAPIndex = 0;
                }
                else {
                    result.lastAPIndex = result.history.length - result.lastAPIndex - 1;
                }
                return result;
            }
            WorkflowCompatibility.ExtractHistory = ExtractHistory;
            function ExtractHistoryLine(historyLine) {
                // History line format: "<dd/mm/yyyy hh:mm:ss> - <action> by <user>[ :\r\ncomments]"
                var lineSplits = historyLine.split(" - ");
                var res = Lib.AP.WorkflowCompatibility.ExtractUserAndAction(lineSplits[1].split(" :")[0]);
                res.datetime = Lib.AP.WorkflowCompatibility.ParseCommentDate(lineSplits[0]);
                res.comment = lineSplits[1];
                return res;
            }
            WorkflowCompatibility.ExtractHistoryLine = ExtractHistoryLine;
            var ExtractUserAndActionRegexTable = {
                "^(.*) by (.*)$": "en",
                "^(.*) por (.*)$": "es",
                "^(.*) par (.*)$": "fr",
                "^(.*) da (.*)$": "it",
                "^(.*)，执行者：(.*)$": "zh-CN",
                "^(.*) \\((.*)\\)$": "de"
            };
            function ExtractUserAndAction(strUserAndAction) {
                var ret = {
                    action: null,
                    user: null
                };
                var res;
                var GRRes;
                for (var key in ExtractUserAndActionRegexTable) {
                    if (Object.prototype.hasOwnProperty.call(ExtractUserAndActionRegexTable, key)) {
                        res = strUserAndAction.match(key);
                        if (res) {
                            var asideRegex = res[1].match("^(.*) \\((.*)\\)$");
                            if (asideRegex) {
                                res[1] = asideRegex[1];
                            }
                            ret.action = Lib.AP.WorkflowCompatibility.GetActionKeyFromTranslatedAction(res[1], ExtractUserAndActionRegexTable[key]);
                            // Action not found, try to extract actions with parameters (Goods receipt)
                            if (!ret.action) {
                                GRRes = Lib.AP.WorkflowCompatibility.GetUpdateGRActionFromTranslatedAction(res[1], ExtractUserAndActionRegexTable[key]);
                                if (GRRes) {
                                    ret.action = GRRes.action;
                                }
                            }
                            ret.user = res[2];
                            return ret;
                        }
                    }
                }
                ret.action = Lib.AP.WorkflowCompatibility.GetActionKeyFromTranslatedAction(strUserAndAction);
                if (!ret.action) {
                    GRRes = Lib.AP.WorkflowCompatibility.GetUpdateGRActionFromTranslatedAction(strUserAndAction);
                    if (GRRes) {
                        ret.action = GRRes.action;
                    }
                }
                return ret;
            }
            WorkflowCompatibility.ExtractUserAndAction = ExtractUserAndAction;
            function ParseCommentDate(strDT) {
                var res = strDT.match(/([0-9]{2})\/([0-9]{2})\/([0-9]{4}) ([0-9]{2}):([0-9]{2}):([0-9]{2})/);
                if (!res ||
                    parseInt(res[2], 10) > 12 ||
                    parseInt(res[1], 10) > 31 ||
                    parseInt(res[4], 10) >= 24 ||
                    parseInt(res[5], 10) >= 60 ||
                    parseInt(res[6], 10) >= 61) {
                    return null;
                }
                return new Date(parseInt(res[3], 10), parseInt(res[2], 10) - 1, parseInt(res[1], 10), parseInt(res[4], 10), parseInt(res[5], 10), parseInt(res[6], 10));
            }
            WorkflowCompatibility.ParseCommentDate = ParseCommentDate;
            WorkflowCompatibility.reverseTranslationTable = {
                "default": {
                    "[_InvoiceRejected]": ValidActions.InvoiceRejected,
                    "[_Payment approval requested]": ValidActions.PaymentApprovalRequested,
                    "[_Set aside history]": ValidActions.SetAside,
                    "[_Back to previous]": ValidActions.BackToPrevious,
                    "[_Back to AP]": ValidActions.BackToAP,
                    "[_Set on hold history]": ValidActions.SetOnHold,
                    "[_Approved without reviewing]": ValidActions.ApprovedWithoutReviewing,
                    "[_Validated automatically]": "_Validated automatically",
                    "[_Validated]": ValidActions.Validated,
                    "[_PaymentApproved]": ValidActions.PaymentApproved,
                    "[_Add approver requested]": ValidActions.AddApproverRequested,
                    "[_ERP posting error]": ValidActions.ERPPostingError,
                    "[_Linked]": ValidActions.Linked
                },
                "en": {
                    "Rejected": ValidActions.InvoiceRejected,
                    "Payment approval requested": ValidActions.PaymentApprovalRequested,
                    "Set aside": ValidActions.SetAside,
                    "Back to previous": ValidActions.BackToPrevious,
                    "Back to AP": ValidActions.BackToAP,
                    "Put on hold": ValidActions.SetOnHold,
                    "Batch approval": ValidActions.ApprovedWithoutReviewing,
                    "Automatically posted": "_Validated automatically",
                    "Posted": ValidActions.Validated,
                    "Payment approved": ValidActions.PaymentApproved,
                    "Further approval requested": ValidActions.AddApproverRequested,
                    "ERP posting error": ValidActions.ERPPostingError,
                    "Linked to SAP": ValidActions.Linked
                },
                "de": {
                    "Abgelehnt": ValidActions.InvoiceRejected,
                    "Zahlungsgenehmigung angefordert": ValidActions.PaymentApprovalRequested,
                    // "Zurückgestellt": ValidActions.SetAside,
                    "Zurück zum vorherigen": ValidActions.BackToPrevious,
                    "Zurück zum Kreditorenbuchhalter": ValidActions.BackToAP,
                    "Zurückgestellt": ValidActions.SetOnHold,
                    "Stapelgenehmigung": ValidActions.ApprovedWithoutReviewing,
                    "Automatisch gebucht": "_Validated automatically",
                    "Gebucht": ValidActions.Validated,
                    "Zahlung genehmigt": ValidActions.PaymentApproved,
                    "Weitere Genehmigung angefordert": ValidActions.AddApproverRequested,
                    "ERP-Buchungsfehler": ValidActions.ERPPostingError,
                    "Verknüpft mit SAP": ValidActions.Linked
                },
                "fr": {
                    "Rejetée": ValidActions.InvoiceRejected,
                    "Approbation de paiement demandée": ValidActions.PaymentApprovalRequested,
                    "Écartée": ValidActions.SetAside,
                    "Retour au précédent": ValidActions.BackToPrevious,
                    "Retour comptable": ValidActions.BackToAP,
                    "Mise en attente": ValidActions.SetOnHold,
                    "Approbation de lot": ValidActions.ApprovedWithoutReviewing,
                    "Comptabilisée automatiquement": "_Validated automatically",
                    "Comptabilisée": ValidActions.Validated,
                    "Paiement approuvé": ValidActions.PaymentApproved,
                    "Approbation supplémentaire demandée": ValidActions.AddApproverRequested,
                    "Erreur de comptabilisation dans l'ERP": ValidActions.ERPPostingError,
                    "Lié à SAP": ValidActions.Linked
                },
                "it": {
                    "Rifiutata": ValidActions.InvoiceRejected,
                    "Approvazione pagamento richiesta": ValidActions.PaymentApprovalRequested,
                    "Scartata": ValidActions.SetAside,
                    "Rinvio al precedente": ValidActions.BackToPrevious,
                    "Rinvio al contabile": ValidActions.BackToAP,
                    "Sospeso": ValidActions.SetOnHold,
                    "Approvazione batch": ValidActions.ApprovedWithoutReviewing,
                    "Registrata automaticamente": "_Validated automatically",
                    "Registrata": ValidActions.Validated,
                    "Pagamento approvato": ValidActions.PaymentApproved,
                    "Approvazione aggiuntiva richiesta": ValidActions.AddApproverRequested,
                    "Errore di registrazione nel sistema ERP": ValidActions.ERPPostingError,
                    "Collegato con SAP": ValidActions.Linked
                },
                "es": {
                    "Rechazada": ValidActions.InvoiceRejected,
                    "Aprobación de pago solicitada": ValidActions.PaymentApprovalRequested,
                    "Descartada": ValidActions.SetAside,
                    "Reenvío al precedente": ValidActions.BackToPrevious,
                    "Reenvío al contable": ValidActions.BackToAP,
                    "Suspendida": ValidActions.SetOnHold,
                    "Aprobación de lote": ValidActions.ApprovedWithoutReviewing,
                    "Contabilizada automáticamente": "_Validated automatically",
                    "Contabilizada": ValidActions.Validated,
                    "Pago aprobado": ValidActions.PaymentApproved,
                    "Aprobación adicional solicitada": ValidActions.AddApproverRequested,
                    "Error de contabilización en el ERP": ValidActions.ERPPostingError,
                    "Enlazado con SAP": ValidActions.Linked
                },
                "zh-CN": {
                    "已拒绝": ValidActions.InvoiceRejected,
                    "已请求付款审批": ValidActions.PaymentApprovalRequested,
                    "搁置": ValidActions.SetAside,
                    "返回上一个": ValidActions.BackToPrevious,
                    "返回 AP": ValidActions.BackToAP,
                    "暂缓": ValidActions.SetOnHold,
                    "批量审批": ValidActions.ApprovedWithoutReviewing,
                    "已自动过账": "_Validated automatically",
                    "已过账": ValidActions.Validated,
                    "付款已批准": ValidActions.PaymentApproved,
                    "需要进一步审批": ValidActions.AddApproverRequested,
                    "ERP 过账错误": ValidActions.ERPPostingError,
                    "[_Linked]": ValidActions.Linked
                }
            };
            function GetActionKeyFromTranslatedAction_ex(translatedAction, language) {
                return Lib.AP.WorkflowCompatibility.reverseTranslationTable[language][translatedAction];
            }
            WorkflowCompatibility.GetActionKeyFromTranslatedAction_ex = GetActionKeyFromTranslatedAction_ex;
            function GetActionKeyFromTranslatedAction(translatedAction, language) {
                var actionKey = null;
                if (language && Lib.AP.WorkflowCompatibility.reverseTranslationTable[language]) {
                    actionKey = Lib.AP.WorkflowCompatibility.GetActionKeyFromTranslatedAction_ex(translatedAction, language);
                    if (!actionKey && language !== "default") {
                        actionKey = Lib.AP.WorkflowCompatibility.GetActionKeyFromTranslatedAction_ex(translatedAction, "default");
                    }
                }
                else {
                    for (var lang in Lib.AP.WorkflowCompatibility.reverseTranslationTable) {
                        if (Object.prototype.hasOwnProperty.call(Lib.AP.WorkflowCompatibility.reverseTranslationTable, lang)) {
                            actionKey = Lib.AP.WorkflowCompatibility.GetActionKeyFromTranslatedAction_ex(translatedAction, lang);
                            if (actionKey) {
                                return actionKey;
                            }
                        }
                    }
                }
                return actionKey;
            }
            WorkflowCompatibility.GetActionKeyFromTranslatedAction = GetActionKeyFromTranslatedAction;
            WorkflowCompatibility.reverseTranslationGRTable = {
                "default": {
                    "^\\[_Goods receipt updated for the following orders :(.*)\\]$": ValidActions.GRUpdated,
                    "^\\[_Goods receipts \\((.*)\\) updated for the following orders :(.*)\\]$": ValidActions.GRUpdatedDetails
                },
                "en": {
                    "^Updated based on delivery of order # (.*)$": ValidActions.GRUpdated,
                    "^Updated based on delivery of order # (.*) \\(corresponding delivery notes: (.*)\\)$": ValidActions.GRUpdatedDetails
                },
                "de": {
                    "^Aktualisiert nach Lieferung von Bestellung Nr. (.*)$": ValidActions.GRUpdated,
                    "^Aktualisiert nach Lieferung von Bestellung Nr. (.*) \\(entsprechende Lieferscheine: (.*)\\)$": ValidActions.GRUpdatedDetails
                },
                "fr": {
                    "^Mise à jour suite à la livraison de la commande n° (.*)$": ValidActions.GRUpdated,
                    "^Mise à jour suite à la livraison de la commande n° (.*) \\(bons de livraison correspondants : (.*)\\)$": ValidActions.GRUpdatedDetails
                },
                "it": {
                    "^Aggiornata in seguito alla consegna dell'ordine n\\. (.*)$": ValidActions.GRUpdated,
                    "^Aggiornata in seguito alla consegna dell'ordine n\\. (.*) \\(bolle di consegna corrispondenti: (.*)\\)$": ValidActions.GRUpdatedDetails
                },
                "es": {
                    "^Actualizada en base a la entrega del pedido n° (.*)$": ValidActions.GRUpdated,
                    "^Actualizada en base a la entrega del pedido n° (.*) \\(albaranes de entrega correspondientes: (.*)\\)$": ValidActions.GRUpdatedDetails
                }
            };
            function GetUpdateGRActionKeyFromTranslatedAction_ex(translatedAction, language) {
                for (var regex in WorkflowCompatibility.reverseTranslationGRTable[language]) {
                    if (Object.prototype.hasOwnProperty.call(WorkflowCompatibility.reverseTranslationGRTable[language], regex)) {
                        var ret = translatedAction.match(regex);
                        if (ret) {
                            return { action: WorkflowCompatibility.reverseTranslationGRTable[language][regex] };
                        }
                    }
                }
                return null;
            }
            WorkflowCompatibility.GetUpdateGRActionKeyFromTranslatedAction_ex = GetUpdateGRActionKeyFromTranslatedAction_ex;
            function GetUpdateGRActionFromTranslatedAction(translatedAction, language) {
                var actionKeyAndParams = null;
                if (language && WorkflowCompatibility.reverseTranslationGRTable[language]) {
                    actionKeyAndParams = Lib.AP.WorkflowCompatibility.GetUpdateGRActionKeyFromTranslatedAction_ex(translatedAction, language);
                    if (!actionKeyAndParams && language !== "default") {
                        actionKeyAndParams = Lib.AP.WorkflowCompatibility.GetUpdateGRActionKeyFromTranslatedAction_ex(translatedAction, "default");
                    }
                }
                else {
                    for (var lang in Lib.AP.WorkflowCompatibility.reverseTranslationTable) {
                        if (Object.prototype.hasOwnProperty.call(Lib.AP.WorkflowCompatibility.reverseTranslationTable, lang)) {
                            actionKeyAndParams = Lib.AP.WorkflowCompatibility.GetUpdateGRActionKeyFromTranslatedAction_ex(translatedAction, lang);
                            if (actionKeyAndParams) {
                                return actionKeyAndParams;
                            }
                        }
                    }
                }
                return actionKeyAndParams;
            }
            WorkflowCompatibility.GetUpdateGRActionFromTranslatedAction = GetUpdateGRActionFromTranslatedAction;
            function ReplayWorkflowActions(historic) {
                for (var i = historic.lastAPIndex; i < historic.history.length; i++) {
                    var history = historic.history[i];
                    WorkflowCompatibility.workflowConvertersParameters.currentHistory = history;
                    Lib.AP.WorkflowCompatibility.workflowUI.DoAction(history.action);
                }
            }
            WorkflowCompatibility.ReplayWorkflowActions = ReplayWorkflowActions;
        })(WorkflowCompatibility = AP.WorkflowCompatibility || (AP.WorkflowCompatibility = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
