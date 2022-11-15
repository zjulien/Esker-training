///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_Workflow_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Shipping workflow management on client side",
  "require": [
    "Lib_Shipping_V12.0.461.0",
    "Lib_Shipping_Workflow_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var Workflow;
        (function (Workflow) {
            function InitPanel() {
                var lib = Lib.Shipping.Workflow;
                lib.controller.UpdateParallelWorkflowCurrentUser();
                lib.controller.Define(lib.parameters);
                Controls.WorkflowPanel.Hide(false);
                Controls.Comments__.Hide(ProcessInstance.isReadOnly);
                Controls.Comments__.SetPlaceholder(Language.Translate("_Enter your comment ..."));
                Controls.WorkflowTable__.SetWidth("100%");
                Controls.WorkflowTable__.SetExtendableColumn("WRKFComment__");
                Controls.WorkflowTable__.HideTableRowMenu(true);
                Controls.WorkflowTable__.WRKFParallelMarker__.SetReadOnly(true);
                Controls.ComputingWorkflow__.Hide(true);
            }
            Workflow.InitPanel = InitPanel;
            var clientParameters = {
                mappingTable: {
                    OnRefreshRow: function (index) {
                        var table = Controls[this.mappingTable.tableName];
                        var row = table.GetRow(index);
                        if (row.WRKFAction__.GetValue()) //test if the line is not empty
                         {
                            row.WRKFRole__.SetImageURL(this.actions[row.WRKFAction__.GetValue()].image, false);
                            Lib.P2P.HighlightCurrentWorkflowStep(Workflow.controller, this.mappingTable.tableName, index, Workflow.notMergeableRoles, true);
                        }
                        var image = Workflow.controller.GetParallelImageType(index);
                        if (image !== null) {
                            row.WRKFParallelMarker__.SetImageURL("P2P_Workflow_parallel_".concat(image, ".png"), false);
                        }
                        else {
                            // remove image if any
                            row.WRKFParallelMarker__.SetImageURL();
                        }
                        row.WRKFUserName__.SetImageURL(Lib.P2P.GetP2PUserImage(row.WRKFIsGroup__.GetValue()), true);
                    }
                },
                callbacks: {
                    OnError: function (msg) {
                        if (msg instanceof Sys.WorkflowEngine.Error) {
                            Popup.Alert(msg, true, null, "_Workflow error");
                            Log.Error(msg.toRawErrorString());
                        }
                        else if (msg instanceof Sys.WorkflowEngine.ErrorNoPopUp) {
                            Log.Error(msg.toRawErrorString());
                        }
                        else {
                            Log.Info("Workflow Error :" + msg);
                        }
                    },
                    OnBuilding: function () {
                        // START - ignore all changes on form during the workflow computation
                        ProcessInstance.SetSilentChange(true);
                        Controls.ComputingWorkflow__.Hide(false);
                    },
                    OnBuilt: function () {
                        Controls.ComputingWorkflow__.Hide(true);
                        Lib.P2P.HighlightCurrentWorkflowStep(Workflow.controller, this.mappingTable.tableName, null, Workflow.notMergeableRoles);
                        // END - ignore all changes on form during the workflow computation
                        ProcessInstance.SetSilentChange(false);
                    },
                    OnBuildAborted: function () {
                        Controls.ComputingWorkflow__.Hide(true);
                        // END - ignore all changes on form during the workflow computation
                        ProcessInstance.SetSilentChange(false);
                    }
                }
            };
            Sys.Helpers.Extend(true, Lib.Shipping.Workflow.parameters, clientParameters);
        })(Workflow = Shipping.Workflow || (Shipping.Workflow = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
