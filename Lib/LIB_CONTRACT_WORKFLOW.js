///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Contract_Workflow",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "P2P library",
  "require": [
    "Lib_Contract_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Workflow;
        (function (Workflow) {
            Workflow.additionalContributorsCache = JSON.parse(Variable.GetValueAsString("AdditionalContributors") || "{}");
            Workflow.Controller = Sys.WorkflowController.Create({ version: 1 });
            Workflow.roleRequester = "_Role requester";
            Workflow.roleApprover = "_Role approver";
            Workflow.sequenceRoleRequester = "requester";
            Workflow.sequenceRoleApprover = "approver";
            function UpdateRolesSequence() {
                var newRolesSequence = ["requester", "approver"];
                Workflow.Controller.SetRolesSequence(newRolesSequence);
            }
            Workflow.UpdateRolesSequence = UpdateRolesSequence;
            function HasAdditionalContributors() {
                return !Sys.Helpers.Object.IsEmptyPlainObject(Workflow.additionalContributorsCache);
            }
            Workflow.HasAdditionalContributors = HasAdditionalContributors;
            function RemoveAllAdditionalContributors() {
                for (var contributorId in Workflow.additionalContributorsCache) {
                    if (Object.prototype.hasOwnProperty.call(Workflow.additionalContributorsCache, contributorId)) {
                        Workflow.Controller.RemoveAdditionalContributor(contributorId);
                    }
                }
                Workflow.additionalContributorsCache = {};
                Variable.SetValueAsString("AdditionalContributors", JSON.stringify(Workflow.additionalContributorsCache));
            }
            Workflow.RemoveAllAdditionalContributors = RemoveAllAdditionalContributors;
            function SetButtonsDisabled(disabled, callee) {
                if (Sys.ScriptInfo.IsClient()) {
                    var SubmitButtonDisabler = Sys.Helpers.Controls.ControlDisabler(Sys.Helpers.Globals.Controls.Approve, true);
                    SubmitButtonDisabler.SetDisabled(disabled, callee);
                }
            }
            Workflow.SetButtonsDisabled = SetButtonsDisabled;
            Workflow.DelayRebuildWorkflow = (function () {
                var timer = 0;
                return function () {
                    if (timer === 0) {
                        // Cannot submit when workflow update pending
                        Log.Info("[DelayRebuildWorkflow] start");
                        if (Lib.Contract.Workflow.SetButtonsDisabled) {
                            SetButtonsDisabled(true, "DelayRebuildWorkflow");
                        }
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
                        SetButtonsDisabled(false, "DelayRebuildWorkflow");
                        RemoveAllAdditionalContributors();
                        Workflow.Controller.Rebuild();
                    }, 500);
                };
            })();
            Workflow.Parameters = {
                actions: {
                    submission: {
                        image: "Contract_submit_grey.png"
                    },
                    submitted: {
                        image: "Contract_submit.png"
                    },
                    approval: {
                        image: "Contract_approve_or_reject_grey.png"
                    },
                    approved: {
                        image: "Contract_approval.png"
                    },
                    forward: {
                        image: "Contract_Forward.png"
                    },
                    modifyContract: {
                        image: "Contract_back.png"
                    },
                    rejected: {
                        image: "Contract_reject.png"
                    },
                    sentBack: {
                        image: "Contract_back.png"
                    },
                    deleted: {
                        image: "Contract_cancel.png"
                    },
                    share: {
                        image: "Contract_share.png"
                    },
                    comment: {
                        image: "Contract_comments_grey.png"
                    },
                    commentDone: {
                        image: "Contract_comments.png"
                    }
                },
                roles: {
                    requester: {
                        OnBuild: function (callback) {
                            callback([{
                                    //mandatory fields
                                    contributorId: Data.GetValue("RequesterLogin__") + Workflow.roleRequester,
                                    role: Workflow.roleRequester,
                                    //not mandatory fields
                                    login: Data.GetValue("RequesterLogin__"),
                                    name: Data.GetValue("RequesterNiceName__"),
                                    action: this.actions.submission.GetName()
                                }]);
                            return true;
                        }
                    },
                    approver: {
                        // Obtains a list of approvers from the workflow rule.
                        OnBuild: function (callback) {
                            // Options for GetStepResults call
                            var getStepsOptions = {
                                "noRuleAppliedAction": "skip",
                                "debug": false,
                                "fields": {
                                    "values": {
                                        "WorkflowType__": "ContractApproval",
                                        "OwnerLogin__": Data.GetValue("OwnerLogin__"),
                                        "FromCatalogManagement__": Variable.GetValueAsString("FromCatalogManagement"),
                                        "CatalogManagementImportStatus__": Variable.GetValueAsString("CatalogManagementImportStatus")
                                    }
                                },
                                success: function (approvers, ruleApplied) {
                                    Log.Info("Contract Approval Workflow, rule applied: " + ruleApplied);
                                    approvers = Sys.Helpers.Array.Map(approvers, function (approver) {
                                        return approver.login;
                                    });
                                    Sys.OnDemand.Users.GetUsersFromLogins(approvers, ["displayname", "emailaddress"], function (users) {
                                        // Build a contributor object with user information.
                                        var contributors = Sys.Helpers.Array.Map(users, function (user) {
                                            return {
                                                contributorId: user.login + Workflow.roleApprover,
                                                role: Workflow.roleApprover,
                                                login: user.login,
                                                email: user.exists ? user.emailaddress : user.login,
                                                name: user.exists ? user.displayname : user.login,
                                                action: "approval"
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
                        }
                    }
                },
                mappingTable: {
                    tableName: "ApproversList__",
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
                        },
                        WRKFRequestDateTime__: {
                            data: "startingDate"
                        },
                        WRKFActualApprover__: {
                            data: "actualApprover"
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
                        Log.Error(msg);
                    },
                    OnBuilding: function () {
                    },
                    OnBuilt: function () {
                    }
                }
            };
            function Init() {
                Workflow.Controller.Define(Lib.Contract.Workflow.Parameters);
            }
            Workflow.Init = Init;
            function DoCurrentContributorAction() {
                var idx = Workflow.Controller.GetContributorIndex();
                var contributor = Workflow.Controller.GetContributorAt(idx);
                Workflow.Controller.DoAction(contributor.action);
                var newAdditionalContributorsCache = {};
                Variable.SetValueAsString("AdditionalContributors", JSON.stringify(newAdditionalContributorsCache));
            }
            Workflow.DoCurrentContributorAction = DoCurrentContributorAction;
        })(Workflow = Contract.Workflow || (Contract.Workflow = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
