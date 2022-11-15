///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_Workflow_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Shipping workflow management",
  "require": [
    "Lib_P2P_V12.0.461.0",
    "Lib_Shipping_V12.0.461.0",
    "Sys/Sys_WorkflowController"
  ]
}*/
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var Workflow;
        (function (Workflow) {
            /// EXPORTS
            Workflow.controller = Sys.WorkflowController.Create({ version: 1 });
            var Roles;
            (function (Roles) {
                Roles["reviewer"] = "reviewer";
                Roles["recipient"] = "recipient";
            })(Roles = Workflow.Roles || (Workflow.Roles = {}));
            var Actions;
            (function (Actions) {
                Actions["submission"] = "submission";
                Actions["submitted"] = "submitted";
                Actions["receive"] = "receive";
                Actions["received"] = "received";
            })(Actions = Workflow.Actions || (Workflow.Actions = {}));
            Workflow.notMergeableRoles = [Roles.reviewer];
            Workflow.parameters = {
                actions: {
                    submission: {
                        image: "ASN_approval_grey.png"
                    },
                    submitted: {
                        image: "ASN_approval.png"
                    },
                    receive: {
                        image: "ASN_reception_grey.png"
                    },
                    received: {
                        image: "ASN_reception.png"
                    }
                },
                roles: {
                    reviewer: {},
                    recipient: {}
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
            var rolesParameters = {
                roles: {
                    reviewer: {
                        OnBuild: function (callback) {
                            Log.Verbose("[Workflow.Onbuild] reviewer");
                            var getStepsOptions = {
                                "noRuleAppliedAction": "skip",
                                "debug": false,
                                "fields": {
                                    "values": {
                                        "WorkflowType__": "ASNReview",
                                        "ASNSourceType__": Data.GetValue("ASNSourceType__")
                                    }
                                },
                                success: function (approvers, ruleApplied) {
                                    approvers = Sys.Helpers.Array.Map(approvers, function (approver) {
                                        return approver.login;
                                    });
                                    Sys.OnDemand.Users.GetUsersFromLogins(approvers, Lib.P2P.attributesForUserCache, function (users) {
                                        var contributors = [];
                                        if (approvers.length === 0) {
                                            Log.Info("No reviewer defined, use account admin");
                                            GetAccountAdminUser(Lib.P2P.attributesForUserCache).Then(function (admin) {
                                                if (admin) {
                                                    Log.Info("Acount admin: " + admin.login);
                                                    contributors.push({
                                                        contributorId: admin.login + Roles.reviewer,
                                                        role: Roles.reviewer,
                                                        login: admin.login,
                                                        email: admin.emailaddress,
                                                        name: admin.displayname,
                                                        action: Actions.submission
                                                    });
                                                }
                                                else {
                                                    Lib.Shipping.Workflow.parameters.callbacks.OnError(new Sys.WorkflowEngine.Error("_Error finding account admin, please contact your administrator"));
                                                }
                                                callback(contributors);
                                            });
                                        }
                                        else {
                                            var displayMessageInexistentUser_1 = [];
                                            contributors = Sys.Helpers.Array.Map(users, function (user) {
                                                if (Sys.Helpers.Data.IsFalse(user.exists)) {
                                                    displayMessageInexistentUser_1.push(user.login);
                                                }
                                                return {
                                                    contributorId: user.login + Roles.reviewer,
                                                    role: Roles.reviewer,
                                                    login: user.login,
                                                    email: user.exists ? user.emailaddress : user.login,
                                                    name: user.exists ? user.displayname : user.login,
                                                    action: Actions.submission
                                                };
                                            });
                                            if (displayMessageInexistentUser_1.length > 0) {
                                                // Prevent approval if one or several users in the workflow don't exist
                                                // They are added in the workflow in order to see them
                                                Lib.Shipping.Workflow.parameters.callbacks.OnError(new Sys.WorkflowEngine.Error("_Inexistent reviewer {0}, please contact your administrator", displayMessageInexistentUser_1.join(", ")));
                                            }
                                            callback(contributors);
                                        }
                                    }, { asAdmin: true });
                                },
                                error: function (errorMessage) {
                                    Lib.Shipping.Workflow.parameters.callbacks.OnError(errorMessage);
                                    callback([]);
                                }
                            };
                            Sys.WorkflowEngine.GetStepsResult(getStepsOptions);
                            return true;
                        }
                    },
                    recipient: {
                        OnBuild: function (callback) {
                            Log.Verbose("[Workflow.Onbuild] recipient");
                            var allRecipientLoginsDistinct = Lib.Shipping.GetRecipients();
                            if (allRecipientLoginsDistinct.length === 0 || !allRecipientLoginsDistinct[0]) {
                                Log.Info("[Workflow.Onbuild] recipient -> No recipient login found, cannot build role");
                                callback([]);
                                return true;
                            }
                            Sys.OnDemand.Users.GetUsersFromLogins(allRecipientLoginsDistinct, Lib.P2P.attributesForUserCache, function (users) {
                                // Build a contributor object with user information.
                                var contributors = Sys.Helpers.Array.Map(users, function (recipient) {
                                    Log.Verbose("[Workflow.Onbuild] recipient -> role builded for login  ".concat(recipient.login));
                                    return {
                                        contributorId: recipient.login + Roles.recipient,
                                        role: Roles.recipient,
                                        login: recipient.login,
                                        email: recipient.exists ? recipient.emailaddress : recipient.login,
                                        name: recipient.exists ? recipient.displayname : recipient.login,
                                        action: Actions.receive,
                                        parallel: Roles.recipient
                                    };
                                });
                                callback(contributors);
                            }, { asAdmin: true });
                            return true;
                        }
                    }
                }
            };
            function Rebuild() {
                Log.Info("[Workflow.Rebuild]");
                Lib.Shipping.Workflow.Init().Then(function () {
                    var lib = Lib.Shipping.Workflow;
                    lib.controller.Rebuild([Lib.Shipping.Workflow.Roles.recipient]);
                });
            }
            Workflow.Rebuild = Rebuild;
            function getRolesSequence(addReviewStep) {
                if (addReviewStep === void 0) { addReviewStep = false; }
                var rolesSequence = [];
                var lib = Lib.Shipping.Workflow;
                if (addReviewStep) {
                    Log.Verbose("[Workflow.getRolesSequence] adding a reviewer step");
                    rolesSequence.push(lib.Roles.reviewer);
                }
                rolesSequence.push(lib.Roles.recipient);
                return rolesSequence;
            }
            function Init(addReviewStep) {
                if (addReviewStep === void 0) { addReviewStep = false; }
                Log.Verbose("[Workflow.init] addReviewStep = ".concat(addReviewStep));
                var lib = Lib.Shipping.Workflow;
                lib.controller.Define(lib.parameters);
                return Sys.Helpers.Promise.Create(function (resolve) {
                    if (lib.controller.GetNbContributors() == 0) {
                        var rolesSequence = getRolesSequence(addReviewStep);
                        lib.controller.SetRolesSequence(rolesSequence);
                        Log.Info("[Workflow.init] workflow initialized");
                    }
                    resolve();
                });
            }
            Workflow.Init = Init;
            var gAdminUser;
            function GetAccountAdminUser(fields) {
                if (gAdminUser) {
                    return Sys.Helpers.Promise.Resolve(gAdminUser);
                }
                var options = {
                    table: "ODProfile",
                    filter: "(Role=accountManagement)",
                    attributes: ["msn"],
                    maxRecords: 1
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (profileResults) {
                    return Sys.Helpers.Promise.Resolve(profileResults[0].msn);
                })
                    .Then(function (profileID) {
                    options =
                        {
                            table: "ODUSER",
                            filter: "(profileID=" + profileID + ")",
                            attributes: fields,
                            maxRecords: 1
                        };
                    return Sys.GenericAPI.PromisedQuery(options);
                })
                    .Then(function (userResults) {
                    gAdminUser = userResults[0];
                    return Sys.Helpers.Promise.Resolve(gAdminUser);
                })
                    .Catch(function (err) {
                    Log.Error("GetAccountAdminUser error: " + err);
                    return Sys.Helpers.Promise.Resolve(gAdminUser);
                });
            }
            function GetReviewerLogin() {
                var ctrl = Lib.Shipping.Workflow.controller;
                var currentContributor = ctrl.GetContributorAt(0);
                return Roles.reviewer === currentContributor.role ? currentContributor.login : null;
            }
            Workflow.GetReviewerLogin = GetReviewerLogin;
            function IsStepReviewer() {
                var ctrl = Lib.Shipping.Workflow.controller;
                var idx = ctrl.GetContributorIndex();
                var currentContributor = ctrl.GetContributorAt(idx);
                return Roles.reviewer === currentContributor.role;
            }
            Workflow.IsStepReviewer = IsStepReviewer;
            Sys.Helpers.Extend(true, Lib.Shipping.Workflow.parameters, rolesParameters);
        })(Workflow = Shipping.Workflow || (Shipping.Workflow = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
