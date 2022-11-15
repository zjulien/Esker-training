///#GLOBALS Lib Sys
/// <reference path="../../Expense/Expense Report/typings_withDeleted/Controls_Expense_Report/index.d.ts"/>
/* LIB_DEFINITION{
  "name": "Lib_Expense_Report_Workflow_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "ExpenseReport common library used to manage document workflow",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_Expense_Report_V12.0.461.0",
    "Lib_Expense_Report_Workflow_V12.0.461.0",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Object"
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
                var actions = Workflow.enums.actions;
                Workflow.additionalContributorsCache = JSON.parse(Variable.GetValueAsString("AdditionalContributors")) || {};
                /**
                 * Ask for workflow rebuild after 500ms. Meanwhile, disable submit button
                 */
                Workflow.DelayRebuildWorkflow = (function () {
                    var timer = 0;
                    return function () {
                        if (timer === 0) {
                            // Cannot submit when workflow update pending
                            Log.Info("[DelayRebuildWorkflow] start");
                            Lib.Expense.Report.SetButtonsDisabled(true);
                        }
                        else {
                            // cancel previous call
                            Log.Info("[DelayRebuildWorkflow] start and cancel previous");
                            clearTimeout(timer);
                        }
                        // Delay workflow rebuild
                        timer = setTimeout(function () {
                            Log.Info("[DelayRebuildWorkflow] trigger");
                            timer = 0;
                            Lib.Expense.Report.SetButtonsDisabled(false);
                            Lib.Expense.Report.Workflow.controller.Rebuild();
                        }, 500);
                    };
                })();
                function IsCurrentController() {
                    return !IsReadOnly() && g.Data.GetValue("ExpenseReportStatus__") === "To control";
                }
                function IsCurrentApprover() {
                    return !IsReadOnly() && g.Data.GetValue("ExpenseReportStatus__") === "To approve";
                }
                function IsCurrentContributor() {
                    var currentContributor = Workflow.controller.GetNbContributors() > 0 && Workflow.controller.GetContributorAt(Workflow.controller.GetContributorIndex());
                    if (currentContributor) {
                        return currentContributor.login === User.loginId || User.IsBackupUserOf(currentContributor.login) || User.IsMemberOf(currentContributor.login) ||
                            (Workflow.controller.GetContributorIndex() === 0 && Sys.Helpers.String.ToBoolean(g.Data.GetValue("CreatedOnBehalf")));
                    }
                    else {
                        //No Workflow yet, you should be the Requester, so you are the Current Contributor
                        return true;
                    }
                }
                Workflow.IsCurrentContributor = IsCurrentContributor;
                function IsOriginalOwner() {
                    return User.loginId === Lib.Expense.Report.GetExpenseItemsOriginalOwnerId();
                }
                Workflow.IsOriginalOwner = IsOriginalOwner;
                function IsReadOnly() {
                    return g.ProcessInstance.isReadOnly || !(User.profileRole === "accountManagement" || IsCurrentContributor());
                }
                Workflow.IsReadOnly = IsReadOnly;
                function InitPanel() {
                    function AllowModifyWorkflow() {
                        return IsCurrentController() || IsCurrentApprover();
                    }
                    g.Controls.Comments__.Hide(g.ProcessInstance.isReadOnly);
                    g.Controls.Comments__.SetPlaceholder(Language.Translate("_Enter your comment ..."));
                    g.Controls.ReportWorkflow__.SetWidth("100%");
                    g.Controls.ReportWorkflow__.SetExtendableColumn("WRKFComment__");
                    g.Controls.ReportWorkflow__.HideTableRowMenu(true);
                    g.Controls.ReportWorkflow__.Workflow_index__.Hide(true);
                    g.Controls.ReportWorkflow__.WRKFAction__.Hide(true);
                    g.Controls.ReportWorkflow__.WRKFIsGroup__.Hide(true);
                    g.Controls.ComputingWorkflow__.Hide(true);
                    g.Controls.ReportWorkflow__.HideTableRowAdd(false);
                    g.Controls.ReportWorkflow__.HideTableRowDelete(false);
                    g.Controls.ReportWorkflow__.SetReadOnly(!AllowModifyWorkflow());
                    Lib.Expense.Report.Workflow.SetAllColumnsToReadOnly();
                    function RefreshSubmitButtonLabel() {
                        var expenseReportStatus = g.Data.GetValue("ExpenseReportStatus__");
                        var buttonlabel = Language.Translate("_Approve");
                        if (expenseReportStatus == "To approve") {
                            if (Object.keys(Workflow.additionalContributorsCache).length > 0) {
                                buttonlabel = Language.Translate("_Approve & Forward");
                            }
                        }
                        else if (expenseReportStatus == "To control") {
                            if (Object.keys(Workflow.additionalContributorsCache).length > 0) {
                                buttonlabel = Language.Translate("_Request further approval");
                            }
                            else if (Workflow.IsLastController() && Lib.Expense.Report.IsRefundable()) {
                                buttonlabel = Language.Translate("_Approve and create an invoice");
                            }
                        }
                        g.Controls.SubmitExpenses.SetText(buttonlabel);
                    }
                    function ShouldAddMySelf() {
                        return Object.keys(Workflow.additionalContributorsCache).length === 0 && g.Data.GetValue("ExpenseReportStatus__") === "To control";
                    }
                    g.Controls.ReportWorkflow__.OnAddItem = function (item, tableIndex) {
                        item.Remove();
                        function browseUsers() {
                            return Sys.Helpers.Promise.Create(function (resolve) {
                                var additionalFilterArray = [];
                                additionalFilterArray.push("CUSTOMER=0");
                                additionalFilterArray.push("VENDOR=0");
                                Lib.P2P.Browse.BrowseUsers(null, null, additionalFilterArray, true).Then(resolve);
                            });
                        }
                        function buildContributor(browsedUser, role, action) {
                            var cId = Workflow.controller.CreateUniqueContributorId(browsedUser.login + role);
                            var fullContributor = {
                                //mandatory fields
                                contributorId: cId,
                                role: role,
                                //not mandatory fields
                                login: browsedUser.login,
                                email: browsedUser.emailAddress,
                                name: browsedUser.displayName,
                                action: action
                            };
                            return fullContributor;
                        }
                        browseUsers()
                            .Then(function (browsedUser) {
                            if (browsedUser) {
                                var sequenceIndex = Workflow.controller.GetSequenceIndexAt(tableIndex);
                                var contributor = buildContributor(browsedUser, "manager", actions.approval);
                                Workflow.controller.AddContributorAt(sequenceIndex, contributor);
                                if (ShouldAddMySelf()) {
                                    // Add current contributor at the end of the workflow again
                                    var currentContributor = Workflow.controller.GetContributorAt(sequenceIndex - 1);
                                    Workflow.controller.AddContributorAt(sequenceIndex + 1, currentContributor);
                                }
                                Workflow.additionalContributorsCache[contributor.contributorId] = contributor;
                                RefreshSubmitButtonLabel();
                            }
                        });
                    };
                    g.Controls.ReportWorkflow__.OnCheckIfItemDeletable = function (item, tableIndex) {
                        var sequenceIndex = Workflow.controller.GetSequenceIndexAt(tableIndex);
                        if (sequenceIndex >= 0) {
                            var idToDelete = Workflow.controller.GetContributorAt(sequenceIndex).contributorId;
                            if (Workflow.additionalContributorsCache[idToDelete]) {
                                return true;
                            }
                        }
                        return false;
                    };
                    g.Controls.ReportWorkflow__.OnDeleteItem = function (item, tableIndex) {
                        var sequenceIndex = Workflow.controller.GetSequenceIndexAt(tableIndex);
                        var idToDelete = Workflow.controller.GetContributorAt(sequenceIndex).contributorId;
                        if (Workflow.additionalContributorsCache[idToDelete]) {
                            delete Workflow.additionalContributorsCache[idToDelete];
                            Workflow.controller.RemoveAdditionalContributor(idToDelete);
                            if (ShouldAddMySelf()) {
                                // Only delete ourselves from the workflow if no additional contributors are left
                                idToDelete = Workflow.controller.GetContributorAt(sequenceIndex).contributorId;
                                Workflow.controller.RemoveAdditionalContributor(idToDelete);
                            }
                            RefreshSubmitButtonLabel();
                        }
                    };
                }
                Workflow.InitPanel = InitPanel;
                function SetAllColumnsToReadOnly() {
                    g.Controls.ReportWorkflow__.WRKFMarker__.SetReadOnly(true);
                    g.Controls.ReportWorkflow__.WRKFUserName__.SetReadOnly(true);
                    g.Controls.ReportWorkflow__.WRKFRole__.SetReadOnly(true);
                    g.Controls.ReportWorkflow__.WRKFComment__.SetReadOnly(true);
                    g.Controls.ReportWorkflow__.WRKFAction__.SetReadOnly(true);
                    g.Controls.ReportWorkflow__.Workflow_index__.SetReadOnly(true);
                    g.Controls.ReportWorkflow__.WRKFIsGroup__.SetReadOnly(true);
                }
                Workflow.SetAllColumnsToReadOnly = SetAllColumnsToReadOnly;
                function UpdateRowButtons(tableIndex) {
                    var sequenceIndex = Workflow.controller.GetSequenceIndexAt(tableIndex);
                    var contributorAtSequenceIndex = Workflow.controller.GetContributorAt(sequenceIndex);
                    var hideDelete = true;
                    var hideAdd = true;
                    if (contributorAtSequenceIndex && Workflow.additionalContributorsCache[contributorAtSequenceIndex.contributorId]) {
                        //this line is an added line : you can add from it or delete it.
                        hideDelete = false;
                        hideAdd = false;
                    }
                    else if ((contributorAtSequenceIndex
                        && contributorAtSequenceIndex.role === Workflow.enums.roles.manager
                        && contributorAtSequenceIndex.action === actions.approval)
                        ||
                            (Workflow.controller.IsCurrentContributorAt(tableIndex) && IsCurrentController())) {
                        //this line either a further approver or myself as a controller : you can add from it
                        hideAdd = false;
                    }
                    Controls.ReportWorkflow__.HideTableRowDeleteForItem(tableIndex, hideDelete);
                    Controls.ReportWorkflow__.HideTableRowAddForItem(tableIndex, hideAdd);
                }
                var postEnable = true;
                var blockingError = false;
                var clientParameters = {
                    mappingTable: {
                        OnRefreshRow: function (index) {
                            var table = g.Controls[this.mappingTable.tableName];
                            var row = table.GetRow(index);
                            if (row.WRKFAction__.GetValue()) //test if the line is not empty
                             {
                                row.WRKFRole__.SetImageURL(this.actions[row.WRKFAction__.GetValue()].image, false);
                                Lib.P2P.HighlightCurrentWorkflowStep(Workflow.controller, this.mappingTable.tableName, index);
                            }
                            row.WRKFUserName__.SetImageURL(Lib.P2P.GetP2PUserImage(row.WRKFIsGroup__.GetValue()), true);
                            UpdateRowButtons(index);
                        }
                    },
                    callbacks: {
                        OnError: function (msg) {
                            if (msg instanceof Sys.WorkflowEngine.Error) {
                                g.Popup.Alert(msg, true, null, "_Workflow error");
                                blockingError = true;
                                Log.Error(msg.toRawErrorString());
                            }
                            else if (msg instanceof Sys.WorkflowEngine.ErrorNoPopUp) {
                                blockingError = true;
                                Log.Error(msg.toRawErrorString());
                            }
                            else {
                                Log.Info("Workflow Error :" + msg);
                            }
                        },
                        OnBuilding: function () {
                            postEnable = true;
                            blockingError = false;
                            // START - ignore all changes on form during the workflow computation
                            g.ProcessInstance.SetSilentChange(true);
                            Lib.Expense.Report.SetButtonsDisabled(true);
                            g.Controls.ComputingWorkflow__.Hide(false);
                        },
                        OnBuilt: function () {
                            g.Controls.ComputingWorkflow__.Hide(true);
                            Lib.Expense.Report.SetButtonsDisabled(false);
                            Lib.P2P.HighlightCurrentWorkflowStep(Workflow.controller, this.mappingTable.tableName);
                            // The post button is enabled by default
                            var postEnabled = true;
                            // disable if any blocking error
                            postEnabled = postEnabled && blockingError !== true;
                            // Enables or disables the post button
                            if (postEnable !== postEnabled) {
                                postEnable = postEnabled;
                                Lib.Expense.Report.SetButtonsDisabled(!postEnabled, true);
                            }
                            // END - ignore all changes on form during the workflow computation
                            g.ProcessInstance.SetSilentChange(false);
                        },
                        OnBuildAborted: function () {
                            g.Controls.ComputingWorkflow__.Hide(true);
                            Lib.Expense.Report.SetButtonsDisabled(false);
                            // END - ignore all changes on form during the workflow computation
                            g.ProcessInstance.SetSilentChange(false);
                        }
                    }
                };
                Sys.Helpers.Extend(true, Lib.Expense.Report.Workflow.parameters, clientParameters);
            })(Workflow = Report.Workflow || (Report.Workflow = {}));
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
