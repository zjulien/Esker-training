///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Contract_Workflow_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "P2P library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Contract_Workflow",
    "LIB_P2P_Browse_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_OnDemand_Users",
    "Sys/Sys_Helpers_Controls",
    "Sys/Sys_Helpers_Object"
  ]
}*/
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Workflow;
        (function (Workflow) {
            var g_workflowPostEnable = true;
            var g_workflowBlockingError = false;
            var clientParameters = {
                roles: {},
                mappingTable: {
                    OnRefreshRow: function (index) {
                        var table = Controls[this.mappingTable.tableName];
                        var row = table.GetRow(index);
                        if (row.WRKFAction__.GetValue()) //test if the line is not empty
                         {
                            row.WRKFRole__.SetImageURL(this.actions[row.WRKFAction__.GetValue()].image, false);
                            Lib.P2P.HighlightCurrentWorkflowStep(Workflow.Controller, this.mappingTable.tableName, index);
                        }
                        row.WRKFUserName__.SetImageURL(Lib.P2P.GetP2PUserImage(row.WRKFIsGroup__.GetValue()), true);
                        function UpdateRowButtons(tableIndex) {
                            var sequenceIndex = Workflow.Controller.GetSequenceIndexAt(tableIndex);
                            var contributorAtSequenceIndex = Workflow.Controller.GetContributorAt(sequenceIndex);
                            var hideDelete = true;
                            var hideAdd = true;
                            if (contributorAtSequenceIndex && Workflow.additionalContributorsCache[contributorAtSequenceIndex.contributorId]) {
                                //this line is an added line : you can add from it or delete it.
                                hideDelete = false;
                                hideAdd = false;
                            }
                            else if (Workflow.Controller.IsCurrentContributorAt(tableIndex)) {
                                //this line is the current line : you can add from it
                                hideAdd = false;
                            }
                            else if (contributorAtSequenceIndex
                                && contributorAtSequenceIndex.role === Lib.Contract.Workflow.roleApprover
                                && contributorAtSequenceIndex.action === Lib.Contract.Workflow.Parameters.actions.approval.GetName()) {
                                //this is a furter approver : you can add from it
                                hideAdd = false;
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
                        // START - ignore all changes on form during the Controller computation
                        ProcessInstance.SetSilentChange(true);
                        Workflow.SetButtonsDisabled(true, "OnBuilding controller");
                        Controls.ComputingWorkflow__.Hide(false);
                    },
                    OnBuilt: function () {
                        Controls.ComputingWorkflow__.Hide(true);
                        Workflow.SetButtonsDisabled(false, "OnBuilt controller");
                        Lib.P2P.HighlightCurrentWorkflowStep(Workflow.Controller, this.mappingTable.tableName);
                        // The post button is enabled by default
                        var postEnabled = true;
                        // disable if any blocking error
                        postEnabled = postEnabled && g_workflowBlockingError !== true;
                        // Enables or disables the post button
                        if (g_workflowPostEnable !== postEnabled) {
                            g_workflowPostEnable = postEnabled;
                            Workflow.SetButtonsDisabled(!postEnabled, "OnBuilt controller error");
                        }
                        // END - ignore all changes on form during the Controller computation
                        ProcessInstance.SetSilentChange(false);
                    },
                    OnBuildAborted: function () {
                        Controls.ComputingWorkflow__.Hide(true);
                        Workflow.SetButtonsDisabled(false, "OnBuilt controller aborted");
                        // END - ignore all changes on form during the Controller computation
                        ProcessInstance.SetSilentChange(false);
                    }
                }
            };
            Sys.Helpers.Extend(true, Lib.Contract.Workflow.Parameters, clientParameters);
            function InitWorkflowPanel(updateLayoutOnAddDeleteContributor) {
                Controls.ApproversList__.SetWidth("100%");
                Controls.ApproversList__.SetExtendableColumn("WRKFComment__");
                Controls.ApproversList__.DisplayItem(Workflow.Controller.GetTableIndex());
                Controls.ApproversList__.HideTableRowMenu(true);
                Controls.ApproversList__.HideTableRowAdd(ProcessInstance.isEditing);
                Controls.ApproversList__.HideTableRowDelete(ProcessInstance.isEditing);
                Controls.Comments__.SetPlaceholder(Language.Translate("_Enter your comment ..."));
                Controls.Comments__.Hide(ProcessInstance.isReadOnly || ProcessInstance.isEditing || !(Lib.P2P.IsOwner() || Lib.P2P.IsAdminNotOwner() || User.IsBackupUserOf(Data.GetValue("ownerID"))));
                UpdateWorkflowPanel();
                Controls.ApproversList__.OnAddItem = function (item, tableIndex) {
                    item.Remove();
                    function addContributorBelow() {
                        browseUsers().Then(function (browsedUser) {
                            if (browsedUser) {
                                //ApproversList__ have insertLineBellow as option, so tableIndex is the index of the row ths user clicked on
                                var sequenceIndex = Workflow.Controller.GetSequenceIndexAt(tableIndex + 1);
                                var contributor = void 0;
                                contributor = buildContributor(browsedUser, Lib.Contract.Workflow.roleApprover, Lib.Contract.Workflow.Parameters.actions.approval.GetName(), Lib.Contract.Workflow.sequenceRoleApprover);
                                Workflow.Controller.AddContributorAt(sequenceIndex, contributor);
                                Workflow.additionalContributorsCache[contributor.contributorId] = contributor;
                                Variable.SetValueAsString("AdditionalContributors", JSON.stringify(Lib.Contract.Workflow.additionalContributorsCache));
                                updateLayoutOnAddDeleteContributor();
                            }
                        });
                    }
                    function browseUsers() {
                        var title = "_Approver Information";
                        var additionalFilterArray = [];
                        additionalFilterArray.push("CUSTOMER=0");
                        additionalFilterArray.push("VENDOR=0");
                        return Lib.P2P.Browse.BrowseUsers(title, null, additionalFilterArray, true);
                    }
                    function buildContributor(browsedUser, role, action, sequenceRole) {
                        var cId = Workflow.Controller.CreateUniqueContributorId(browsedUser.login + role);
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
                    addContributorBelow();
                };
                Controls.ApproversList__.OnCheckIfItemDeletable = function (item, tableIndex) {
                    var sequenceIndex = Workflow.Controller.GetSequenceIndexAt(tableIndex);
                    if (sequenceIndex >= 0) {
                        var idToDelete = Workflow.Controller.GetContributorAt(sequenceIndex).contributorId;
                        if (Workflow.additionalContributorsCache[idToDelete]) {
                            return true;
                        }
                    }
                    return false;
                };
                Controls.ApproversList__.OnDeleteItem = function (item, tableIndex) {
                    var sequenceIndex = Workflow.Controller.GetSequenceIndexAt(tableIndex);
                    var idToDelete = Workflow.Controller.GetContributorAt(sequenceIndex).contributorId;
                    if (Workflow.additionalContributorsCache[idToDelete]) {
                        delete Workflow.additionalContributorsCache[idToDelete];
                        Variable.SetValueAsString("AdditionalContributors", JSON.stringify(Lib.Contract.Workflow.additionalContributorsCache));
                        Workflow.Controller.RemoveAdditionalContributor(idToDelete);
                        updateLayoutOnAddDeleteContributor();
                    }
                };
            }
            Workflow.InitWorkflowPanel = InitWorkflowPanel;
            function UpdateWorkflowPanel() {
                Controls.ApproversList__.SetReadOnly(!IsCurrentContributor());
                Controls.ApproversList__.WRKFMarker__.SetReadOnly(true);
                Controls.ApproversList__.WRKFUserName__.SetReadOnly(true);
                Controls.ApproversList__.WRKFRole__.SetReadOnly(true);
                Controls.ApproversList__.WRKFComment__.SetReadOnly(true);
                Controls.ApproversList__.WRKFAction__.SetReadOnly(true);
                Controls.ApproversList__.Workflow_index__.SetReadOnly(true);
                Controls.ApproversList__.WRKFIsGroup__.SetReadOnly(true);
            }
            Workflow.UpdateWorkflowPanel = UpdateWorkflowPanel;
            function IsCurrentContributor() {
                var currentContributor = Workflow.Controller.GetNbContributors() > 0 && Workflow.Controller.GetContributorAt(Workflow.Controller.GetContributorIndex());
                if (currentContributor) {
                    return currentContributor.login === User.loginId
                        || User.IsBackupUserOf(currentContributor.login)
                        || User.IsMemberOf(currentContributor.login)
                        // If the current user is the admin and he's not the owner of the document,
                        // he can do the next contributor's actions (no matter who's the next contributor)
                        || Lib.P2P.IsAdminNotOwner();
                }
                else {
                    //No Workflow yet, you should be the Requester, so you are the Current Contributor
                    return true;
                }
            }
            Workflow.IsCurrentContributor = IsCurrentContributor;
        })(Workflow = Contract.Workflow || (Contract.Workflow = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
