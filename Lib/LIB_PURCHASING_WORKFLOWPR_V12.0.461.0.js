///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_WorkflowPR_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_OnDemand_Users",
    "Sys/Sys_Helpers_Object",
    "Lib_P2P.Base_V12.0.461.0",
    "Lib_P2P.Workflow_V12.0.461.0",
    "Lib_P2P_CompanyCodesValue_V12.0.461.0",
    "Lib_Purchasing.Base_V12.0.461.0",
    "Lib_Purchasing.Workflow_V12.0.461.0",
    "Lib_Purchasing_WorkflowDefinition",
    "[Lib_Workflow_Customization_Common]"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var WorkflowPR;
        (function (WorkflowPR) {
            function OnBuildReviewer(previousStepContributorsList, role, action, sequenceRole, dryRunBuildParams) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var mapping = {
                        lineItems: Data.GetTable("LineItems__"),
                        costCenterColumnName: "CostCenter__",
                        costCenterKeyName: "ItemCostCenterId__",
                        exchangeRate: "ItemExchangeRate__",
                        glAccountColumnName: "Account__",
                        glKeyName: "ItemGLAccount__",
                        amountColumnName: "ItemNetAmount__",
                        baseFieldsMapping: {
                            "values": {
                                "WorkflowType__": "purchaseRequisitionPreApproval"
                            }
                        },
                        keepEmpty: false,
                        emptyCheckFunction: Lib.Purchasing.IsLineItemEmpty,
                        lineItemFieldsForWorkflow: Lib.Purchasing.WorkflowDefinition.GetLineItemFieldsForWorkflow()
                    };
                    var fields = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.OnBuildFieldsMapping", "PR-reviewers", mapping.baseFieldsMapping, mapping) ||
                        Lib.P2P.BuildFieldsMapping(mapping);
                    if (dryRunBuildParams === null || dryRunBuildParams === void 0 ? void 0 : dryRunBuildParams.infiniteAmount) {
                        fields.forEach(function (fieldsMapping) {
                            if (fieldsMapping.values) {
                                fieldsMapping.values.WorkflowAmount__ = 999999999999;
                            }
                        });
                    }
                    var reviewalWorkflowCB = function (list /*, ruleApplied, noMergedList*/) {
                        var _a;
                        var reviewers = [];
                        var inexistentUsers = [];
                        if (Sys.Helpers.IsArray(list)) {
                            Sys.Helpers.Array.ForEach(list, function (user) {
                                reviewers.push({
                                    //mandatory fields
                                    contributorId: user.login + role,
                                    role: role,
                                    sequenceRole: sequenceRole,
                                    //not mandatory fields
                                    login: user.login,
                                    email: user.emailAddress,
                                    name: user.displayName,
                                    action: action
                                });
                                if (!user.exists) {
                                    inexistentUsers.push(user.login);
                                }
                            });
                            // Prevent approval if one or several users in the workflow don't exist
                            // They are nonetheless added in the workflow in order to see them
                            if (inexistentUsers.length > 0) {
                                // Strange to bypass ? why don't we reject the promise ?
                                (_a = WorkflowPR.Parameters.callbacks) === null || _a === void 0 ? void 0 : _a.OnError(new Sys.WorkflowEngine.Error("_Invalid user '{0}', please contact your administrator", inexistentUsers.join(", ")));
                            }
                        }
                        resolve(reviewers);
                    };
                    var merger = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.OverrideMerger", "PR-reviewers");
                    if (!merger) {
                        merger = "ReversedByLevel";
                    }
                    var options = {
                        fields: fields,
                        allowNoCCOwner: false,
                        success: reviewalWorkflowCB,
                        merger: merger,
                        forceMerger: true,
                        error: function (errorMessage) {
                            var _a;
                            (_a = WorkflowPR.Parameters.callbacks) === null || _a === void 0 ? void 0 : _a.OnError(errorMessage);
                            resolve([]);
                        }
                    };
                    Lib.P2P.GetApprovalWorkflow(options);
                });
            }
            function OnBuildApprover(previousStepContributorsList, role, action, sequenceRole, dryRunBuildParams) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    if (AnyCostCenter()) {
                        var mapping = {
                            lineItems: Data.GetTable("LineItems__"),
                            costCenterColumnName: "CostCenter__",
                            costCenterKeyName: "ItemCostCenterId__",
                            exchangeRate: "ItemExchangeRate__",
                            glAccountColumnName: "Account__",
                            glKeyName: "ItemGLAccount__",
                            amountColumnName: "ItemNetAmount__",
                            baseFieldsMapping: {
                                "values": {
                                    "WorkflowType__": "purchaseRequisitionApproval",
                                    "WorkflowCurrency__": Lib.P2P.CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__")).Currency__
                                }
                            },
                            keepEmpty: false,
                            emptyCheckFunction: Lib.Purchasing.IsLineItemEmpty,
                            lineItemFieldsForWorkflow: Lib.Purchasing.WorkflowDefinition.GetLineItemFieldsForWorkflow()
                        };
                        var fields = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.OnBuildFieldsMapping", "PR-approvers", mapping.baseFieldsMapping, mapping) ||
                            Lib.P2P.BuildFieldsMapping(mapping);
                        if (dryRunBuildParams === null || dryRunBuildParams === void 0 ? void 0 : dryRunBuildParams.infiniteAmount) {
                            fields.forEach(function (fieldsMapping) {
                                if (fieldsMapping.values) {
                                    fieldsMapping.values.WorkflowAmount__ = 999999999999;
                                }
                            });
                        }
                        var approvalWorkflowCB = function (list /*, ruleApplied, noMergedList*/) {
                            var _a;
                            var approvers = [];
                            var inexistentUsers = [];
                            if (Sys.Helpers.IsArray(list)) {
                                Sys.Helpers.Array.ForEach(list, function (user) {
                                    // All requester occurences are removed from the apprval workflow if `RemoveRequesterFromApprovalWorkflow` is set
                                    // We don't want the same contributor to do two successive actions in the workflow, so :
                                    // 	- If there are no reviewers, requester can't be the first approver
                                    var isRequester = user.login === Data.GetValue("RequisitionInitiator__");
                                    var removeRequesterFromApprovalWorkflow = Sys.Parameters.GetInstance("PAC").GetParameter("RemoveRequesterFromApprovalWorkflow") === "1";
                                    var removeApprover = isRequester && removeRequesterFromApprovalWorkflow;
                                    if (!removeApprover) {
                                        approvers.push({
                                            //mandatory fields
                                            contributorId: user.login + role,
                                            role: role,
                                            sequenceRole: sequenceRole,
                                            //not mandatory fields
                                            login: user.login,
                                            email: user.emailAddress,
                                            name: user.displayName,
                                            action: action,
                                            parallel: user.originalValues.parallel ? "".concat(user.originalValues.stepIndex, "_").concat(user.originalValues.parallelIndex) : void 0
                                        });
                                        if (!user.exists) {
                                            inexistentUsers.push(user.login);
                                        }
                                    }
                                });
                                // Prevent approval if one or several users in the workflow don't exist
                                // They are nonetheless added in the workflow in order to see them
                                if (inexistentUsers.length > 0) {
                                    // Strange to bypass ? why don't we reject the promise ?
                                    (_a = WorkflowPR.Parameters.callbacks) === null || _a === void 0 ? void 0 : _a.OnError(new Sys.WorkflowEngine.Error("_Invalid user '{0}', please contact your administrator", inexistentUsers.join(", ")));
                                }
                            }
                            // If current user is in the approvers list and is in the list of first parallel approvers
                            // Move it to the top of the approvers list
                            var firstApprover = approvers[0];
                            if (firstApprover && firstApprover.parallel && approvers.length > 1) {
                                var currentUserIndex = approvers.map(function (contributor) { return Lib.P2P.CurrentUserMatchesLogin(contributor.login, Sys.Helpers.Globals.User || Lib.P2P.GetValidatorOrOwner()); }).indexOf(true);
                                if (currentUserIndex !== -1) {
                                    var currentUser = approvers[currentUserIndex];
                                    if (currentUser.parallel == firstApprover.parallel) {
                                        approvers.splice(currentUserIndex, 1);
                                        approvers.unshift(currentUser);
                                    }
                                }
                            }
                            resolve(approvers);
                        };
                        var merger = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.OverrideMerger", "PR-approvers");
                        if (!merger) {
                            merger = "ReversedByLevelParallel";
                        }
                        var options = {
                            fields: fields,
                            allowNoCCOwner: false,
                            success: approvalWorkflowCB,
                            merger: merger,
                            forceMerger: true,
                            error: function (errorMessage) {
                                var _a;
                                (_a = WorkflowPR.Parameters.callbacks) === null || _a === void 0 ? void 0 : _a.OnError(errorMessage);
                                resolve([]);
                            }
                        };
                        Lib.P2P.GetApprovalWorkflow(options);
                    }
                    else {
                        resolve([]);
                    }
                });
            }
            function OnBuildBuyer(previousStepContributorsList, role, action, sequenceRole) {
                var promises = [];
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    var buyerLogin = item.GetValue("BuyerLogin__");
                    if (!Sys.Helpers.IsEmpty(buyerLogin)) {
                        promises.push(Sys.OnDemand.Users.CacheByLogin.Get(buyerLogin, Lib.P2P.attributesForUserCache)
                            .Then(function (result) {
                            var _a;
                            var buyer = result[buyerLogin];
                            if (buyer.$error) {
                                Log.Error("OnBuildBuyer: error on get properties: " + buyer.$error);
                                // Strange to bypass ? why don't we reject the promise ?
                                (_a = WorkflowPR.Parameters.callbacks) === null || _a === void 0 ? void 0 : _a.OnError(new Sys.WorkflowEngine.Error("Unable to get buyer " + buyerLogin + ", Error : " + buyer.$error));
                                return Sys.Helpers.Promise.Resolve({});
                            }
                            return Sys.Helpers.Promise.Resolve({
                                contributorId: buyerLogin + role,
                                role: role,
                                sequenceRole: sequenceRole,
                                login: buyerLogin,
                                email: buyer.emailaddress,
                                name: buyer.displayname,
                                action: action,
                                parallel: "buyers"
                            });
                        }));
                    }
                });
                return Sys.Helpers.Promise.All(promises)
                    .Then(function (buyers) {
                    // remove empty buyers
                    buyers = Sys.Helpers.Array.Filter(buyers, function (item) { return !!item && item.contributorId; });
                    // remove duplicate buyers
                    buyers = Sys.Helpers.Array.GetDistinctArray(buyers, function (item) { return item.contributorId; });
                    return buyers;
                });
            }
            function AnyCostCenter() {
                var table = Data.GetTable("LineItems__");
                for (var i = table.GetItemCount() - 1; i >= 0; i--) {
                    var row = table.GetItem(i);
                    if (!Lib.Purchasing.IsLineItemEmpty(row) &&
                        !Sys.Helpers.IsEmpty(table.GetItem(i).GetValue("ItemCostCenterId__"))) {
                        return true;
                    }
                }
                return false;
            }
            WorkflowPR.Parameters = {
                actions: {
                    submission: {
                        image: "PR_submit_grey.png"
                    },
                    submitted: {
                        image: "PR_submit.png"
                    },
                    reviewal: {
                        image: "PR_approve_or_reject_grey.png"
                    },
                    reviewed: {
                        image: "PR_approval.png"
                    },
                    approval: {
                        image: "PR_approve_or_reject_grey.png"
                    },
                    approved: {
                        image: "PR_approval.png"
                    },
                    forward: {
                        image: "PR_forward.png"
                    },
                    reviewAndForward: {
                        image: "PR_forward.png"
                    },
                    rejected: {
                        image: "PR_reject.png"
                    },
                    sentBackAsReviewer: {
                        image: "PR_back.png"
                    },
                    sentBackAsApprover: {
                        image: "PR_back.png"
                    },
                    sentBackAsBuyer: {
                        image: "PR_back.png"
                    },
                    //keep it in case of upgrade from Sprint < 222 to Sprint > 222
                    sentBack: {
                        image: "PR_back.png"
                    },
                    modifyPR: {
                        image: "PR_back.png"
                    },
                    rfi: {
                        image: "PR_share.png"
                    },
                    comment: {
                        image: "PR_comments_grey.png"
                    },
                    commentDone: {
                        image: "PR_comments.png"
                    },
                    purchase: {
                        image: "PR_order_grey.png"
                    },
                    orderCreated: {
                        image: "PR_order.png"
                    },
                    orderCanceled: {
                        image: "PR_orderCanceled.png"
                    },
                    reception: {
                        image: "PR_reception_grey.png"
                    },
                    received: {
                        image: "PR_reception.png"
                    },
                    canceled: {
                        image: "PR_cancel.png"
                    },
                    remainingItemsCanceled: {
                        image: "PR_cancel.png"
                    },
                    itemsCanceled: {
                        image: "PR_cancel.png"
                    }
                },
                roles: {
                    requester: {
                        OnBuildPromise: function () {
                            return Sys.Helpers.Promise.Resolve([{
                                    //mandatory fields
                                    contributorId: Data.GetValue("RequisitionInitiator__") + Lib.Purchasing.roleRequester,
                                    role: Lib.Purchasing.roleRequester,
                                    sequenceRole: Lib.Purchasing.sequenceRoleRequester,
                                    //not mandatory fields
                                    login: Data.GetValue("RequisitionInitiator__"),
                                    name: Data.GetValue("RequesterName__"),
                                    action: this.actions.submission.GetName()
                                }]);
                        }
                    },
                    buyer: {
                        OnBuildPromise: function (previousStepContributorsList) {
                            return OnBuildBuyer(previousStepContributorsList, Lib.Purchasing.roleBuyer, this.actions.purchase.GetName(), Lib.Purchasing.sequenceRoleBuyer);
                        }
                    },
                    reviewer: {
                        OnBuildPromise: function (previousStepContributorsList, dryRunBuildParams) {
                            return OnBuildReviewer(previousStepContributorsList, Lib.Purchasing.roleReviewer, this.actions.reviewal.GetName(), Lib.Purchasing.sequenceRoleReviewer, dryRunBuildParams);
                        }
                    },
                    approver: {
                        OnBuildPromise: function (previousStepContributorsList, dryRunBuildParams) {
                            return OnBuildApprover(previousStepContributorsList, Lib.Purchasing.roleApprover, this.actions.approval.GetName(), Lib.Purchasing.sequenceRoleApprover, dryRunBuildParams);
                        }
                    }
                },
                mappingTable: {
                    tableName: "ApproversList__",
                    columns: {
                        WRKFUserName__: {
                            data: "name"
                        },
                        WRKFParallel__: {
                            data: "parallel"
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
                }
            };
        })(WorkflowPR = Purchasing.WorkflowPR || (Purchasing.WorkflowPR = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
