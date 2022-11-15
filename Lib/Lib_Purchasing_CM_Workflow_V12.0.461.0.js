/* eslint-disable class-methods-use-this */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CM_Workflow_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing Catalog common library used to manage document workflow",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_OnDemand_Users",
    "Sys/Sys_Helpers_Controls",
    "Sys/Sys_WorkflowController"
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
                var CHelperWorkflow = /** @class */ (function () {
                    function CHelperWorkflow() {
                        this.controller = Sys.WorkflowController.Create({ version: 1 });
                        this.parameters = {
                            actions: {
                                submit: {
                                    image: "Catalog_submit.png"
                                },
                                submitted: {
                                    image: "Catalog_submitted.png"
                                },
                                approve: {
                                    image: "Catalog_approve_or_reject.png"
                                },
                                approved: {
                                    image: "Catalog_approved.png"
                                },
                                reject: {},
                                rejected: {
                                    image: "Catalog_rejected.png"
                                }
                            },
                            roles: {
                                requester: {},
                                approver: {}
                            },
                            mappingTable: {
                                tableName: "WorkflowTable__",
                                columns: {
                                    WRKFUserName__: {
                                        data: "name"
                                    },
                                    WRKFRole__: {
                                        data: "role",
                                        translate: true
                                    },
                                    WRKFDate__: {
                                        data: "date"
                                    },
                                    WRKFComment__: {
                                        data: "comment"
                                    },
                                    WRKFAction__: {
                                        data: "action"
                                    },
                                    WRKFIsGroup__: {
                                        data: "isGroup"
                                    }
                                }
                            },
                            delayedData: {
                                isGroup: {
                                    type: "isGroupInfo",
                                    key: "login"
                                }
                            },
                            callbacks: {
                                OnError: function (msg) {
                                    Log.Info(msg);
                                }
                            }
                        };
                        this.requesterLogin = Data.GetValue("RequesterLogin__");
                        this.requesterName = Data.GetValue("RequesterName__");
                        if (Sys.ScriptInfo.IsServer()) {
                            var ownerUser = Lib.Purchasing.GetOwner();
                            this.requesterLogin = this.requesterLogin || ownerUser.GetVars().GetValue_String("login", 0);
                            this.requesterName = this.requesterName || ownerUser.GetVars().GetValue_String("displayName", 0);
                        }
                        this.ExtendWkfParameters(this.GetRolesParameters());
                    }
                    CHelperWorkflow.prototype.ApproverOnBuild = function (callback) {
                        // Options for GetStepResults call
                        var getStepsOptions = {
                            "debug": false,
                            "fields": {
                                "values": {
                                    "WorkflowType__": "catalogImportApproval",
                                    "RequisitionInitiator__": this.requesterLogin,
                                    "CatalogUpdateRequestType__": this.IsInternalUpdateRequest() ? "Internal" : "External"
                                }
                            },
                            success: function (approvers, ruleApplied) {
                                Log.Info("Catalog Import Approval Workflow, rule applied: " + ruleApplied);
                                approvers = Sys.Helpers.Array.Map(approvers, function (approver) {
                                    return approver.login;
                                });
                                Sys.OnDemand.Users.GetUsersFromLogins(approvers, ["displayname", "emailaddress"], function (users) {
                                    // Build a contributor object with user information.
                                    var contributors = Sys.Helpers.Array.Map(users, function (user) {
                                        return {
                                            contributorId: "approver" + user.login,
                                            role: "Approver",
                                            login: user.login,
                                            email: user.exists ? user.emailaddress : user.login,
                                            name: user.exists ? user.displayname : user.login,
                                            action: "approve"
                                        };
                                    });
                                    callback(contributors);
                                });
                            },
                            error: function (errorMessage) {
                                Log.Error("Approval Workflow, error: " + errorMessage);
                                Variable.SetValueAsString("MissingWorkflowRuleError", "true");
                                Variable.SetValueAsString("WorkflowErrorMessage", errorMessage);
                                callback([]);
                            }
                        };
                        // Get a list of approvers from the workflow rule.
                        Sys.WorkflowEngine.GetStepsResult(getStepsOptions);
                        return true;
                    };
                    CHelperWorkflow.prototype.RequesterOnbuild = function (callback) {
                        callback([
                            {
                                contributorId: "requester" + this.requesterLogin,
                                role: "Requester",
                                login: this.requesterLogin,
                                name: this.requesterName,
                                action: "submit"
                            }
                        ]);
                        return true;
                    };
                    CHelperWorkflow.prototype.ExtendWkfParameters = function (additionnalParameters) {
                        this.parameters = Sys.Helpers.Extend(true, this.parameters, additionnalParameters);
                    };
                    CHelperWorkflow.prototype.GetRolesParameters = function () {
                        return {
                            roles: {
                                requester: {
                                    // In this sample, the requester "role" has only one user, the form creator.
                                    OnBuild: this.RequesterOnbuild.bind(this)
                                },
                                approver: {
                                    // Obtains a list of approvers from the workflow rule.
                                    OnBuild: this.ApproverOnBuild.bind(this)
                                }
                            }
                        };
                    };
                    CHelperWorkflow.prototype.UpdateControlerParamters = function () {
                        this.controller.Define(this.parameters);
                    };
                    return CHelperWorkflow;
                }());
                Workflow.CHelperWorkflow = CHelperWorkflow;
                var CHelperWorkflowVendorItem = /** @class */ (function (_super) {
                    __extends(CHelperWorkflowVendorItem, _super);
                    function CHelperWorkflowVendorItem() {
                        var _this = _super.call(this) || this;
                        Log.Info("CHelperWorkflowVendorItem");
                        _this.isInternalUpdateRequest = Variable.GetValueAsString("CatalogManagmentType") === "internal";
                        return _this;
                    }
                    /**
                     * If the CMW process instance does not have a parent, it's internal (it has not been created by a Vendor)
                     */
                    CHelperWorkflowVendorItem.prototype.IsInternalUpdateRequest = function () {
                        return this.isInternalUpdateRequest;
                    };
                    return CHelperWorkflowVendorItem;
                }(CHelperWorkflow));
                Workflow.CHelperWorkflowVendorItem = CHelperWorkflowVendorItem;
                var CHelperWorkflowWarehouseItem = /** @class */ (function (_super) {
                    __extends(CHelperWorkflowWarehouseItem, _super);
                    function CHelperWorkflowWarehouseItem() {
                        var _this = _super.call(this) || this;
                        Log.Info("CHelperWorkflowWarehouseItem");
                        return _this;
                    }
                    CHelperWorkflowWarehouseItem.prototype.IsInternalUpdateRequest = function () {
                        return true;
                    };
                    return CHelperWorkflowWarehouseItem;
                }(CHelperWorkflow));
                Workflow.CHelperWorkflowWarehouseItem = CHelperWorkflowWarehouseItem;
            })(Workflow = CM.Workflow || (CM.Workflow = {}));
        })(CM = Purchasing.CM || (Purchasing.CM = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
