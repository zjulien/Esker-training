///#GLOBALS Lib Sys
/// <reference path="../../PAC/Purchasing V2/Purchase Requisition process V2/typings_withDeleted/Controls_Purchase_Requisition_process_V2/index.d.ts"/>
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_WorkflowPR_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing library",
  "require": [
    "Lib_Purchasing_WorkflowPR_V12.0.461.0",
    "Sys/Sys_Helpers_Controls"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var WorkflowPR;
        (function (WorkflowPR) {
            WorkflowPR.additionalContributorsCache = JSON.parse(Variable.GetValueAsString("AdditionalContributors")) || {};
            var controller = Lib.Purchasing.LayoutPR.WorkflowControllerInstance;
            function UpdateRolesSequence() {
                var newRolesSequence = [
                    Lib.Purchasing.sequenceRoleRequester,
                    Lib.Purchasing.sequenceRoleReviewer,
                    Lib.Purchasing.sequenceRoleApprover,
                    Lib.Purchasing.sequenceRoleBuyer
                ];
                controller.SetRolesSequence(newRolesSequence);
            }
            WorkflowPR.UpdateRolesSequence = UpdateRolesSequence;
            function GetNextRoleToAddManually(tableIndex) {
                var sequenceIndex = controller.GetSequenceIndexAt(tableIndex);
                var indexRole = controller.GetRoleAt(sequenceIndex);
                var supportedRolesAtIndex = [
                    Lib.Purchasing.roleRequester,
                    Lib.Purchasing.roleReviewer,
                    Lib.Purchasing.roleApprover
                ];
                if (supportedRolesAtIndex.indexOf(indexRole) === -1) {
                    throw new Error("[Lib.Purchasing.WorkflowPR.GetNextRoleToAddManually] cannot determine a role after the role: ".concat(indexRole));
                }
                var nextRole;
                if (indexRole === Lib.Purchasing.roleRequester || indexRole === Lib.Purchasing.roleReviewer) {
                    var nextIndexRole = controller.GetNbContributors() > (sequenceIndex + 1) ? controller.GetRoleAt(sequenceIndex + 1) : null;
                    if (nextIndexRole === Lib.Purchasing.roleReviewer) {
                        nextRole = Lib.Purchasing.roleReviewer;
                    }
                    else { // approver or none => ambiguity
                        nextRole = null;
                    }
                }
                else { // approver
                    nextRole = Lib.Purchasing.roleApprover;
                }
                return nextRole;
            }
            WorkflowPR.GetNextRoleToAddManually = GetNextRoleToAddManually;
            function InitWorkflowPanel() {
                Controls.ApproversList__.SetWidth("100%");
                Controls.ApproversList__.SetExtendableColumn("WRKFComment__");
                Controls.ApproversList__.DisplayItem(controller.GetTableIndex());
                Controls.ApproversList__.HideTableRowMenu(true);
                Controls.ApproversList__.HideTableRowAdd(false);
                Controls.ApproversList__.HideTableRowDelete(false);
                Controls.Comments__.Hide(Lib.Purchasing.LayoutPR.IsReadOnly());
                Controls.Comments__.SetPlaceholder(Language.Translate("_Enter your comment ..."));
                Controls.ApproversList__.OnAddItem = function (item, tableIndex) {
                    item.Remove();
                    function addContributorBelow(contributorRole) {
                        browseUsers(contributorRole).Then(function (browsedUser) {
                            if (browsedUser) {
                                //ApproversList__ have insertLineBellow as option, so tableIndex is the index of the row ths user clicked on
                                var sequenceIndex = controller.GetSequenceIndexAt(tableIndex + 1);
                                var contributor = void 0;
                                if (contributorRole === Lib.Purchasing.roleReviewer) {
                                    contributor = buildContributor(browsedUser, Lib.Purchasing.roleReviewer, Lib.Purchasing.WorkflowPR.Parameters.actions.reviewal.GetName(), Lib.Purchasing.sequenceRoleReviewer);
                                }
                                else { // approver
                                    contributor = buildContributor(browsedUser, Lib.Purchasing.roleApprover, Lib.Purchasing.WorkflowPR.Parameters.actions.approval.GetName(), Lib.Purchasing.sequenceRoleApprover);
                                }
                                controller.AddContributorAt(sequenceIndex, contributor);
                                WorkflowPR.additionalContributorsCache[contributor.contributorId] = contributor;
                                Variable.SetValueAsString("AdditionalContributors", JSON.stringify(Lib.Purchasing.WorkflowPR.additionalContributorsCache));
                                Lib.Purchasing.LayoutPR.UpdateButtonBar();
                            }
                        });
                    }
                    function browseUsers(role) {
                        var title = role === Lib.Purchasing.roleReviewer ? "_Reviewer Information" : "_Approver Information";
                        var additionalFilterArray = [];
                        additionalFilterArray.push("CUSTOMER=0");
                        additionalFilterArray.push("VENDOR=0");
                        return Lib.P2P.Browse.BrowseUsers(title, null, additionalFilterArray, true);
                    }
                    function buildContributor(browsedUser, role, action, sequenceRole) {
                        var cId = controller.CreateUniqueContributorId(browsedUser.login + role);
                        var fullContributor = {
                            //mandatory fields
                            contributorId: cId,
                            role: role,
                            sequenceRole: sequenceRole,
                            //not mandatory fields
                            login: browsedUser.login,
                            email: browsedUser.emailAddress,
                            name: browsedUser.displayName,
                            action: action
                        };
                        return fullContributor;
                    }
                    var nextRole = GetNextRoleToAddManually(tableIndex);
                    if (nextRole) {
                        addContributorBelow(nextRole);
                    }
                    else {
                        // Ambiguity: ask the user
                        Popup.Menu({
                            options: [
                                { label: "_Add a reviewer", value: Lib.Purchasing.roleReviewer },
                                { label: "_Add an approver", value: Lib.Purchasing.roleApprover }
                            ]
                        }, addContributorBelow);
                    }
                };
                Controls.ApproversList__.OnCheckIfItemDeletable = function (item, tableIndex) {
                    var sequenceIndex = controller.GetSequenceIndexAt(tableIndex);
                    if (sequenceIndex >= 0) {
                        var idToDelete = controller.GetContributorAt(sequenceIndex).contributorId;
                        if (WorkflowPR.additionalContributorsCache[idToDelete]) {
                            return true;
                        }
                    }
                    return false;
                };
                Controls.ApproversList__.OnDeleteItem = function (item, tableIndex) {
                    var sequenceIndex = controller.GetSequenceIndexAt(tableIndex);
                    var idToDelete = controller.GetContributorAt(sequenceIndex).contributorId;
                    if (WorkflowPR.additionalContributorsCache[idToDelete]) {
                        delete WorkflowPR.additionalContributorsCache[idToDelete];
                        Variable.SetValueAsString("AdditionalContributors", JSON.stringify(Lib.Purchasing.WorkflowPR.additionalContributorsCache));
                        controller.RemoveAdditionalContributor(idToDelete);
                        Lib.Purchasing.LayoutPR.UpdateButtonBar();
                    }
                };
                Sys.Helpers.Controls.ForEachTableRow(Controls.ApproversList__, function (row, index) {
                    Controls.ApproversList__.OnRefreshRow(index);
                });
            }
            WorkflowPR.InitWorkflowPanel = InitWorkflowPanel;
            function UpdateWorkflowPanel() {
                Controls.ApproversList__.SetReadOnly(!Lib.Purchasing.LayoutPR.AllowModifyWorkflow());
                Controls.ApproversList__.WRKFMarker__.SetReadOnly(true);
                Controls.ApproversList__.WRKFParallelMarker__.SetReadOnly(true);
                Controls.ApproversList__.WRKFUserName__.SetReadOnly(true);
                Controls.ApproversList__.WRKFRole__.SetReadOnly(true);
                Controls.ApproversList__.WRKFComment__.SetReadOnly(true);
                Controls.ApproversList__.WRKFAction__.SetReadOnly(true);
                Controls.ApproversList__.Workflow_index__.SetReadOnly(true);
                Controls.ApproversList__.WRKFIsGroup__.SetReadOnly(true);
            }
            WorkflowPR.UpdateWorkflowPanel = UpdateWorkflowPanel;
            function RemoveAllAdditionalContributors() {
                for (var contributorId in WorkflowPR.additionalContributorsCache) {
                    if (Object.prototype.hasOwnProperty.call(WorkflowPR.additionalContributorsCache, contributorId)) {
                        controller.RemoveAdditionalContributor(contributorId);
                    }
                }
                WorkflowPR.additionalContributorsCache = {};
                Variable.SetValueAsString("AdditionalContributors", JSON.stringify(Lib.Purchasing.WorkflowPR.additionalContributorsCache));
            }
            WorkflowPR.RemoveAllAdditionalContributors = RemoveAllAdditionalContributors;
            function HasAdditionalContributors() {
                return !Sys.Helpers.Object.IsEmptyPlainObject(WorkflowPR.additionalContributorsCache);
            }
            WorkflowPR.HasAdditionalContributors = HasAdditionalContributors;
            var g_workflowPostEnable = true;
            var g_workflowBlockingError = false;
            var clientParameters = {
                mappingTable: {
                    OnRefreshRow: function (index) {
                        var table = Controls[this.mappingTable.tableName];
                        var row = table.GetRow(index);
                        if (row.WRKFAction__.GetValue()) //test if the line is not empty
                         {
                            row.WRKFRole__.SetImageURL(this.actions[row.WRKFAction__.GetValue()].image, false);
                            Lib.P2P.HighlightCurrentWorkflowStep(controller, this.mappingTable.tableName, index);
                        }
                        var image = controller.GetParallelImageType(index);
                        if (image !== null) {
                            row.WRKFParallelMarker__.SetImageURL("P2P_Workflow_parallel_".concat(image, ".png"), false);
                        }
                        else {
                            // remove image if any
                            row.WRKFParallelMarker__.SetImageURL();
                        }
                        row.WRKFUserName__.SetImageURL(Lib.P2P.GetP2PUserImage(row.WRKFIsGroup__.GetValue()), true);
                        function UpdateRowButtons(tableIndex) {
                            var currentSequenceIndex = controller.GetContributorIndex();
                            var sequenceIndex = controller.GetSequenceIndexAt(tableIndex);
                            var contributorAtSequenceIndex = controller.GetContributorAt(sequenceIndex);
                            var parallelContributors = controller.GetParallelContributorsOf(contributorAtSequenceIndex);
                            var hideDelete = true;
                            var hideAdd = true;
                            if (sequenceIndex >= currentSequenceIndex) {
                                if (contributorAtSequenceIndex && WorkflowPR.additionalContributorsCache[contributorAtSequenceIndex.contributorId]) {
                                    //this line is an added line : you can add from it or delete it.
                                    hideDelete = false;
                                    hideAdd = false;
                                }
                                else if (contributorAtSequenceIndex
                                    && (contributorAtSequenceIndex.role === Lib.Purchasing.roleRequester ||
                                        contributorAtSequenceIndex.role === Lib.Purchasing.roleReviewer ||
                                        contributorAtSequenceIndex.role === Lib.Purchasing.roleApprover)
                                    && (parallelContributors.length > 0 && parallelContributors[parallelContributors.length - 1].contributorId === contributorAtSequenceIndex.contributorId)) {
                                    // we can add at each steps : no restriction
                                    hideAdd = false;
                                }
                            }
                            table.HideTableRowDeleteForItem(tableIndex, hideDelete);
                            table.HideTableRowAddForItem(tableIndex, hideAdd);
                        }
                        UpdateRowButtons(index);
                    }
                },
                callbacks: {
                    OnError: function (msg) {
                        if (msg instanceof Sys.WorkflowEngine.Error) {
                            Popup.Alert(msg, true, null, "_Workflow error");
                            g_workflowBlockingError = true;
                            Log.Error(msg.toRawErrorString());
                        }
                        else {
                            Log.Error(msg);
                        }
                    },
                    OnBuilding: function () {
                        g_workflowBlockingError = false;
                        // START - ignore all changes on form during the controller computation
                        ProcessInstance.SetSilentChange(true);
                        Lib.Purchasing.LayoutPR.SetButtonsDisabled(true, "On building controller");
                        Controls.ComputingWorkflow__.Hide(false);
                    },
                    OnBuilt: function () {
                        Controls.ComputingWorkflow__.Hide(true);
                        Lib.Purchasing.LayoutPR.SetButtonsDisabled(false, "On built controller");
                        Lib.P2P.HighlightCurrentWorkflowStep(controller, this.mappingTable.tableName);
                        // The post button is enabled by default
                        var postEnabled = true;
                        if (Lib.Purchasing.PRLineItems.Count() === 0) {
                            postEnabled = false;
                        }
                        // disable if any blocking error
                        postEnabled = postEnabled && g_workflowBlockingError !== true;
                        // Fill budget
                        if (Lib.Purchasing.LayoutPR.IsApprover() || Lib.Purchasing.LayoutPR.IsRequesterStep() || Lib.Purchasing.LayoutPR.IsReviewer()) {
                            Log.Info("Update budget");
                            Lib.Purchasing.PRLineItems.Budget.Fill({ resetBudgetID: true });
                        }
                        // Enables or disables the post button
                        if (g_workflowPostEnable !== postEnabled) {
                            g_workflowPostEnable = postEnabled;
                            Lib.Purchasing.LayoutPR.SetButtonsDisabled(!postEnabled, "On built controller -> error case");
                        }
                        Lib.Purchasing.LayoutPR.UpdateLayout();
                        // END - ignore all changes on form during the controller computation
                        ProcessInstance.SetSilentChange(false);
                    },
                    OnBuildAborted: function () {
                        Controls.ComputingWorkflow__.Hide(true);
                        Lib.Purchasing.LayoutPR.SetButtonsDisabled(false, "On build aborted");
                        // END - ignore all changes on form during the controller computation
                        ProcessInstance.SetSilentChange(false);
                    }
                }
            };
            Sys.Helpers.Extend(true, Lib.Purchasing.WorkflowPR.Parameters, clientParameters);
        })(WorkflowPR = Purchasing.WorkflowPR || (Purchasing.WorkflowPR = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
