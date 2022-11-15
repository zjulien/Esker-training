/* eslint-disable class-methods-use-this */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CM_Workflow_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing Catalog server library used to manage document workflow",
  "require": [
    "Lib_P2P_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_CM_Server_V12.0.461.0",
    "Lib_Purchasing_CM_Workflow_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_OnDemand_Users",
    "Sys/Sys_Helpers_Controls",
    "Sys/Sys_WorkflowController",
    "Sys/Sys_EmailNotification"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var CM;
        (function (CM) {
            var Workflow;
            (function (Workflow) {
                var CServerHelperWorkflow = /** @class */ (function () {
                    function CServerHelperWorkflow(helper, serverHelpers, helperWkf) {
                        this.vendorLogin = Lib.P2P.GetValidatorOrOwner().GetValue("AccountId") + "$" + Data.GetValue("RequesterLogin__");
                        this.helper = helper;
                        this.helperWkf = helperWkf;
                        this.serverHelper = serverHelpers;
                        this.vendorLogin = Lib.P2P.GetValidatorOrOwner().GetValue("AccountId") + "$" + Data.GetValue("RequesterLogin__");
                    }
                    CServerHelperWorkflow.prototype.GetWkfParameters = function () {
                        return {
                            actions: {
                                submit: {
                                    OnDone: this.SubmitOnDone.bind(this)
                                },
                                submitted: {},
                                approve: {
                                    OnDone: this.ApproveOnDone.bind(this)
                                },
                                approved: {},
                                reject: {
                                    OnDone: this.RejectOnDone.bind(this)
                                },
                                rejected: {}
                            }
                        };
                    };
                    CServerHelperWorkflow.prototype.SubmitOnDone = function (index) {
                        Log.Info("CServerHelperWorkflow: SubmitOnDone");
                        var nbSteps = this.helperWkf.controller.GetNbContributors();
                        var comment;
                        if (this.helperWkf.IsInternalUpdateRequest()) {
                            var currentContributor = this.helperWkf.controller.GetContributorAt(index);
                            comment = Lib.P2P.AddOnBehalfOf(currentContributor, Data.GetValue("Comments__"));
                            Data.SetValue("SubmissionDateTime__", new Date());
                            Data.SetValue("Status__", "ToApprove");
                        }
                        else {
                            comment = Language.Translate("_Catalog import request submitted by the vendor");
                        }
                        // In case there are no approvers in the workflow, approve the catalog import request and import the catalog.
                        // Otherwise, forward the request to the first validator.
                        if (index < nbSteps - 1) {
                            this.helperWkf.controller.NextContributor({
                                action: "submitted",
                                date: Data.GetValue("SubmissionDateTime__"),
                                comment: comment
                            });
                            var step = this.helperWkf.controller.GetContributorAt(this.helperWkf.controller.GetContributorIndex());
                            if (this.helperWkf.IsInternalUpdateRequest()) {
                                this.SendEmailNotification(step.login, "CM-ApproveRequestInternal.htm", true);
                            }
                            else {
                                this.SendEmailNotification(step.login, "CM-ApproveRequest.htm", true);
                            }
                            this.Forward();
                        }
                        else if (this.helperWkf.IsInternalUpdateRequest() || Variable.GetValueAsString("MissingWorkflowRuleError") !== "true") {
                            this.DoImport(comment);
                        }
                    };
                    CServerHelperWorkflow.prototype.ApproveOnDone = function (index) {
                        Log.Info("CServerHelperWorkflow: ApproveOnDone");
                        var nbSteps = this.helperWkf.controller.GetNbContributors();
                        var currentContributor = this.helperWkf.controller.GetContributorAt(index);
                        var comment = Lib.P2P.AddOnBehalfOf(currentContributor, Data.GetValue("Comments__"));
                        if (index < nbSteps - 1) {
                            this.helperWkf.controller.NextContributor({
                                action: "approved",
                                date: new Date(),
                                comment: comment
                            });
                            var step = this.helperWkf.controller.GetContributorAt(this.helperWkf.controller.GetContributorIndex());
                            if (this.helperWkf.IsInternalUpdateRequest()) {
                                this.SendEmailNotification(step.login, "CM-ApproveRequestInternal.htm", true);
                            }
                            else {
                                this.SendEmailNotification(step.login, "CM-ApproveRequest.htm", true);
                            }
                            this.Forward();
                        }
                        else {
                            this.DoImport(comment);
                        }
                    };
                    CServerHelperWorkflow.prototype.RejectOnDone = function () {
                        var rejectedDate = new Date();
                        var idx = this.helperWkf.controller.GetContributorIndex();
                        var currentContributor = this.helperWkf.controller.GetContributorAt(idx);
                        var comment = Lib.P2P.AddOnBehalfOf(currentContributor, Data.GetValue("Comments__"));
                        // Terminates the workflow and sets the message in the rejected state.
                        this.helperWkf.controller.EndWorkflow({
                            action: "rejected",
                            date: rejectedDate,
                            comment: comment
                        });
                        if (!this.helperWkf.IsInternalUpdateRequest()) {
                            this.UpdateParentProcess("CSVRejected", { rejectionReason: Data.GetValue("Comments__") });
                            // Notify the vendor that his import request has been rejected
                            this.SendEmailNotification(this.vendorLogin, "CM-Vendor_ImportReject.htm", true);
                        }
                        Data.SetValue("Reason__", Data.GetValue("Comments__"));
                        Data.SetValue("ValidationDateTime__", rejectedDate);
                        Data.SetValue("Status__", "Rejected");
                        Data.SetValue("Comments__", "");
                        Data.SetValue("State", 400);
                        Process.LeaveForm();
                    };
                    CServerHelperWorkflow.prototype.Forward = function () {
                        var idx = this.helperWkf.controller.GetContributorIndex();
                        var step = this.helperWkf.controller.GetContributorAt(idx);
                        Log.Info("Forwarding message to " + step.login + "(" + idx + ")");
                        Process.SetRight(step.login, "read");
                        Process.Forward(step.login);
                    };
                    CServerHelperWorkflow.prototype.UpdateParentProcess = function (action, data) {
                        var transport = Process.GetUpdatableTransportAsProcessAdmin(Variable.GetValueAsString("CMRUIDEX"));
                        var externalVars = transport.GetExternalVars();
                        if (data) {
                            var resumeWithActionData = JSON.stringify(data);
                            externalVars.AddValue_String("resumeWithActionData", resumeWithActionData, true);
                        }
                        externalVars.AddValue_String(CM.CHelper.EXTRACTEDDATAVARIABLE, Variable.GetValueAsString(CM.CHelper.EXTRACTEDDATAVARIABLE), true);
                        if (!transport.ResumeWithAction(action, false)) {
                            var transport2 = Process.GetUpdatableTransportAsProcessAdmin(Variable.GetValueAsString("CMRUIDEX"));
                            transport2.ResumeWithActionAsync(action);
                            Log.Info("ResumeWithAction " + action + " delayed " + Variable.GetValueAsString("CMRUIDEX"));
                        }
                    };
                    CServerHelperWorkflow.prototype.SendEmailNotification = function (login, template, backupUserAsCC) {
                        var options = {
                            userId: login,
                            template: template,
                            fromName: "_EskerCatalogManagement",
                            backupUserAsCC: !!backupUserAsCC,
                            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                        };
                        Sys.EmailNotification.SendEmailNotification(options);
                    };
                    CServerHelperWorkflow.prototype.DoImport = function (comment) {
                        var _this = this;
                        Log.Info("CServerHelperWorkflow: DoImport");
                        var nbreSteps = this.helperWkf.controller.GetNbContributors();
                        var bOK = this.serverHelper.ProcessedData(function () { return _this.serverHelper.ProcessLines(); });
                        bOK = bOK && this.helper.GetExtractedData().ProcessingError.length === 0;
                        if (bOK) {
                            var approvedDate = new Date();
                            // Does not forward to anyone, and lets the document be approved and go to the success state.
                            this.helperWkf.controller.EndWorkflow({
                                action: "approved",
                                date: approvedDate,
                                comment: comment
                            });
                            Data.SetValue("ValidationDateTime__", approvedDate);
                            Data.SetValue("Status__", "Approved");
                            Data.SetValue("State", 100);
                            Data.SetValue("Comments__", "");
                            if (!this.helperWkf.IsInternalUpdateRequest()) {
                                this.UpdateParentProcess("CSVApproved");
                                var step = this.helperWkf.controller.GetContributorAt(this.helperWkf.controller.GetContributorIndex());
                                this.SendEmailNotification(nbreSteps > 1 ? step.login : Data.GetValue("OwnerID"), "CM-CatalogManager_ImportSuccess.htm", true);
                                this.SendEmailNotification(this.vendorLogin, "CM-Vendor_ImportSuccess.htm", true);
                            }
                        }
                        else {
                            Variable.SetValueAsString("CSVProcessingError", "true");
                            Log.Error("Error while processing, no more retry");
                            if (!this.helperWkf.IsInternalUpdateRequest()) {
                                // Notify the buyer that the import has failed
                                var step = this.helperWkf.controller.GetContributorAt(this.helperWkf.controller.GetContributorIndex());
                                this.SendEmailNotification(nbreSteps > 1 ? step.login : Data.GetValue("OwnerID"), "CM-CatalogManager_ImportFail.htm", true);
                            }
                            Process.PreventApproval();
                        }
                    };
                    return CServerHelperWorkflow;
                }());
                Workflow.CServerHelperWorkflow = CServerHelperWorkflow;
                var CServerHelperWorkflowVendorItem = /** @class */ (function (_super) {
                    __extends(CServerHelperWorkflowVendorItem, _super);
                    function CServerHelperWorkflowVendorItem(helper, serverHelper, helperWkf) {
                        var _this = _super.call(this, helper, serverHelper, helperWkf) || this;
                        Log.Info("CServerHelperWorkflowVendorItem");
                        return _this;
                    }
                    return CServerHelperWorkflowVendorItem;
                }(CServerHelperWorkflow));
                Workflow.CServerHelperWorkflowVendorItem = CServerHelperWorkflowVendorItem;
                var CServerHelperWorkflowWarehouseItem = /** @class */ (function (_super) {
                    __extends(CServerHelperWorkflowWarehouseItem, _super);
                    function CServerHelperWorkflowWarehouseItem(helper, serverHelper, helperWkf) {
                        var _this = _super.call(this, helper, serverHelper, helperWkf) || this;
                        Log.Info("CServerHelperWorkflowWarehouseItem");
                        return _this;
                    }
                    return CServerHelperWorkflowWarehouseItem;
                }(CServerHelperWorkflow));
                Workflow.CServerHelperWorkflowWarehouseItem = CServerHelperWorkflowWarehouseItem;
            })(Workflow = CM.Workflow || (CM.Workflow = {}));
        })(CM = Purchasing.CM || (Purchasing.CM = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
