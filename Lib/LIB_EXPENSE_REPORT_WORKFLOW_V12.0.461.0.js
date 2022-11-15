///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Report_Workflow_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "ExpenseReport common library used to manage document workflow",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "[Lib_P2P_Browse_V12.0.461.0]",
    "Lib_Expense_Report_V12.0.461.0",
    "[Sys/Sys_PushNotification]",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Object",
    "[Sys/Sys_EmailNotification]"
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
                Workflow.controller = Sys.WorkflowController.Create({ version: 1 });
                Workflow.parameters = {
                    actions: {
                        submission: {
                            image: "Report_submit_grey.png"
                        },
                        submitted: {
                            image: "Report_submit.png"
                        },
                        reSubmission: {
                            image: "Report_submit_grey.png"
                        },
                        approval: {
                            image: "Report_approve_or_reject_grey.png"
                        },
                        toControl: {
                            image: "Report_approval.png"
                        },
                        control: {
                            image: "Report_control_grey.png"
                        },
                        validated: {
                            image: "Report_control.png"
                        },
                        sentBack: {
                            image: "Report_back.png"
                        },
                        modifyReport: {
                            image: "Report_back.png"
                        },
                        deleted: {
                            image: "Report_delete.png"
                        },
                        forward: {
                            image: "Report_forward.png"
                        },
                        requestFurtherApproval: {
                            image: "Report_forward.png"
                        }
                    },
                    roles: {
                        user: {},
                        manager: {},
                        controller: {}
                    },
                    mappingTable: {
                        tableName: "ReportWorkflow__",
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
                        }
                    }
                };
                // public interface
                Workflow.enums = {
                    roles: Sys.Helpers.Object.ToEnum(Workflow.parameters.roles),
                    actions: Sys.Helpers.Object.ToEnum(Workflow.parameters.actions)
                };
                function IsLastController() {
                    var wkfController = Lib.Expense.Report.Workflow.controller;
                    var nextContributor = wkfController.GetContributorAt(wkfController.GetContributorIndex() + 1);
                    return !nextContributor;
                }
                Workflow.IsLastController = IsLastController;
                // Add roles to the parameters here to avoid circular dependency for enums roles and actions
                var g = Sys.Helpers.Globals;
                var roles = Workflow.enums.roles;
                var actions = Workflow.enums.actions;
                var rolesParameters = {
                    roles: {
                        user: {
                            OnBuild: function (callback) {
                                callback([{
                                        //mandatory fields
                                        contributorId: g.Data.GetValue("User__") + roles.user,
                                        role: roles.user,
                                        //not mandatory fields
                                        login: g.Data.GetValue("User__"),
                                        name: g.Data.GetValue("UserName__"),
                                        action: this.actions.submission.GetName()
                                    }]);
                                return true;
                            }
                        },
                        manager: {
                            OnBuild: function (callback) {
                                var mapping = {
                                    lineItems: Data.GetTable("ExpensesTable__"),
                                    costCenterColumnName: "CostCenter__",
                                    costCenterKeyName: "CostCenterId__",
                                    exchangeRate: "CurrencyRate__",
                                    amountColumnName: "Amount__",
                                    baseFieldsMapping: {
                                        "values": {
                                            "WorkflowType__": "expenseReportApproval",
                                            "WorkflowCurrency__": Lib.P2P.CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__")).Currency__,
                                            "RequisitionInitiator__": Data.GetValue("User__")
                                        }
                                    },
                                    keepEmpty: true,
                                    emptyCheckFunction: Lib.Expense.Report.IsLineEmpty
                                };
                                var fields = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.OnBuildFieldsMapping", "EXP-approvers", mapping.baseFieldsMapping, mapping) ||
                                    Lib.Expense.Report.BuildFieldsMapping(mapping);
                                var approvalWorkflowCB = function (list /*, ruleApplied, noMergedList*/) {
                                    var managers = [];
                                    var displayMessageInexistentUser = [];
                                    if (Sys.Helpers.IsArray(list) && list.length > 0) {
                                        list.forEach(function (user, i) {
                                            if ((managers.length !== 0 || (user.login !== g.Data.GetValue("User__") || g.Data.GetValue("CreatedOnBehalf")))) {
                                                managers.push({
                                                    //mandatory fields
                                                    contributorId: user.login + roles.manager,
                                                    role: roles.manager,
                                                    //not mandatory fields
                                                    login: user.login,
                                                    email: user.emailAddress,
                                                    name: user.displayName,
                                                    action: actions.approval
                                                });
                                                if (Sys.Helpers.Data.IsFalse(user.exists)) {
                                                    displayMessageInexistentUser.push(user.login);
                                                }
                                            }
                                            else {
                                                // Here we have: user.login === g.Data.GetValue("User__") && managers.length === 0
                                                // As the first approver is the submitting user, we skip its step
                                                // Remember it for debugging purpose
                                                Variable.SetValueAsString("ApproverSkipped", user.login);
                                            }
                                        });
                                    }
                                    if (displayMessageInexistentUser.length > 0) {
                                        // Prevent approval if one or several users in the workflow don't exist
                                        // They are added in the workflow in order to see them
                                        Lib.Expense.Report.Workflow.parameters.callbacks.OnError(new Sys.WorkflowEngine.Error("_Inexistent approver {0}, please contact your administrator", displayMessageInexistentUser.join(", ")));
                                    }
                                    callback(managers);
                                };
                                var options = {
                                    fields: fields,
                                    success: approvalWorkflowCB,
                                    merger: "ReversedByLevel",
                                    error: function (errorMessage, ruleApplied) {
                                        // Note: at the opening of a new expense report, because no expense selected, fields.length === 0
                                        if (ruleApplied || !fields || fields.length === 0) {
                                            Lib.Expense.Report.Workflow.parameters.callbacks.OnError(errorMessage);
                                        }
                                        else {
                                            Lib.Expense.Report.Workflow.parameters.callbacks.OnError(new Sys.WorkflowEngine.ErrorNoPopUp("_No manager, please contact your administrator"));
                                            if (Sys.ScriptInfo.IsClient()) {
                                                g.Popup.Alert("_No manager, please contact your administrator", true, null, "_Workflow error");
                                            }
                                        }
                                        callback([]);
                                    }
                                };
                                Lib.P2P.GetApprovalWorkflow(options);
                                return true;
                            }
                        },
                        controller: {
                            OnBuild: function (callback) {
                                var fieldsMapping = {
                                    "values": {
                                        "WorkflowType__": "expenseReportControl",
                                        "CompanyCode__": Lib.Expense.Report.GetExpenseItemsCompanyCode(),
                                        "WorkflowCurrency__": Lib.P2P.CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__")).Currency__,
                                        "RequisitionInitiator__": Data.GetValue("User__"),
                                        "WorkflowAmount__": Data.GetValue("TotalAmount__")
                                    }
                                };
                                var approvalWorkflowCB = function (list /*, ruleApplied, noMergedList*/) {
                                    var controllers = [];
                                    var displayMessageInexistentUser = [];
                                    if (Sys.Helpers.IsArray(list) && list.length > 0) {
                                        list.forEach(function (user, i) {
                                            controllers.push({
                                                //mandatory fields
                                                contributorId: user.login + roles.controller,
                                                role: roles.controller,
                                                //not mandatory fields
                                                login: user.login,
                                                email: user.emailAddress,
                                                name: user.displayName,
                                                action: actions.control
                                            });
                                            if (Sys.Helpers.Data.IsFalse(user.exists)) {
                                                displayMessageInexistentUser.push(user.login);
                                            }
                                        });
                                        if (displayMessageInexistentUser.length > 0) {
                                            // Prevent approval if one or several users in the workflow don't exist
                                            // They are added in the workflow in order to see them
                                            Lib.Expense.Report.Workflow.parameters.callbacks.OnError(new Sys.WorkflowEngine.Error("_Inexistent approver {0}, please contact your administrator", displayMessageInexistentUser.join(", ")));
                                        }
                                    }
                                    else {
                                        Lib.Expense.Report.Workflow.parameters.callbacks.OnError(new Sys.WorkflowEngine.Error("_No controller, please contact your administrator"));
                                    }
                                    callback(controllers);
                                };
                                var options = {
                                    fields: fieldsMapping,
                                    success: approvalWorkflowCB,
                                    error: function (errorMessage) {
                                        Lib.Expense.Report.Workflow.parameters.callbacks.OnError(new Sys.WorkflowEngine.Error("_No controller, please contact your administrator"));
                                        callback([]);
                                    }
                                };
                                Lib.P2P.GetApprovalWorkflow(options);
                                return true;
                            }
                        }
                    }
                };
                Sys.Helpers.Extend(true, Lib.Expense.Report.Workflow.parameters, rolesParameters);
            })(Workflow = Report.Workflow || (Report.Workflow = {}));
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
