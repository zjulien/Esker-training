///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_Workflow_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Shipping workflow management",
  "require": [
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_String",
    "Lib_Shipping_Workflow_V12.0.461.0",
    "Lib_Shipping_Validation_V12.0.461.0",
    "Lib_Shipping_Vendor_Server_V12.0.461.0",
    "Lib_P2P_Conversation_Server_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var Workflow;
        (function (Workflow) {
            var _isWorkflowInitialized = false;
            function LazyInitializeWorkflow() {
                if (!_isWorkflowInitialized) {
                    Log.Verbose("[Workflow.LazyInitializeWorkflow]");
                    var lib = Lib.Shipping.Workflow;
                    lib.controller.Define(lib.parameters);
                    _isWorkflowInitialized = true;
                }
            }
            function GetContributionData(sequenceStep, newAction, newCom, commentPrefixes) {
                Log.Verbose("[Workflow.GetContributionData]");
                var currentContributor = Workflow.controller.GetContributorAt(sequenceStep);
                currentContributor.action = newAction;
                currentContributor.date = new Date();
                currentContributor.actualApprover = Sys.Helpers.String.ExtractLoginFromDN(Lib.P2P.GetValidatorOrOwnerLogin());
                if (commentPrefixes) {
                    if (commentPrefixes.onBehalfOf) {
                        newCom = Lib.P2P.AddOnBehalfOf(currentContributor, newCom);
                    }
                    if (commentPrefixes.furtherApproval) {
                        var prefix = Language.Translate("_Requested further approval");
                        newCom = newCom.length > 0 ? prefix + "\n" + newCom : prefix;
                    }
                }
                if (newCom) {
                    var previousComment = currentContributor.comment;
                    var newCommentFormatted = newCom;
                    if (previousComment && previousComment.length > 0) {
                        newCommentFormatted += "\n" + previousComment;
                    }
                    Data.SetValue("Comments__", "");
                    currentContributor.comment = newCommentFormatted;
                }
                return currentContributor;
            }
            function SetStartingDateAndRight(date, addValidateRight) {
                if (addValidateRight === void 0) { addValidateRight = true; }
                date = date || new Date();
                var idx = Workflow.controller.GetContributorIndex();
                var currentContributor = Workflow.controller.GetContributorAt(idx);
                var contributors = Workflow.controller.GetParallelContributorsOf(currentContributor, true);
                if (contributors.length) {
                    Process.ChangeOwner(contributors[0].login);
                }
                contributors.forEach(function (contributor) {
                    if (addValidateRight) {
                        Log.Info("Grant validate right to receiver: " + contributor.login);
                        Process.AddRight(contributor.login, "validate");
                    }
                    if (!contributor.additionalProperties || !contributor.additionalProperties.startingDate) {
                        Workflow.controller.UpdateAdditionalContributorData(contributor.contributorId, { startingDate: new Date(date) });
                    }
                });
                return currentContributor;
            }
            Workflow.SetStartingDateAndRight = SetStartingDateAndRight;
            function ContributorExist(contributor) {
                if (contributor && Users.GetUser(contributor.login) == null) {
                    return false;
                }
                return true;
            }
            function GoToNextStep(contributionData, isLastStep) {
                if (isLastStep === void 0) { isLastStep = false; }
                Log.Verbose("[Workflow.GoToNextStep]");
                // Remove "validate" right
                var idx = Workflow.controller.GetContributorIndex();
                var currentContributor = Workflow.controller.GetContributorAt(idx);
                Process.SetRight(currentContributor.login, "read");
                if (isLastStep) {
                    Workflow.controller.EndWorkflow(contributionData);
                }
                else {
                    Workflow.controller.NextContributor(contributionData);
                    ForwardToRecipient(null, contributionData.date);
                }
            }
            function GiveRightOnConversationToUser(userLogin) {
                var conversationInfo = Lib.P2P.Conversation.InitConversationInfo(Lib.P2P.Conversation.Options.GetCustomerOrder({
                    OrderNumber__: Data.GetValue("Sales_Order_Number__")
                }, true));
                var internalUser = Users.GetUserAsProcessAdmin(userLogin);
                if (internalUser) {
                    var internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
                    var extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
                        BusinessId: internalUserInfo.BusinessId,
                        BusinessIdFieldName: internalUserInfo.BusinessIdFieldName,
                        OwnerID: internalUserInfo.OwnerID,
                        OwnerPB: internalUserInfo.OwnerPB,
                        RecipientCompany: Data.GetValue("VendorName__")
                    });
                    Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo);
                }
                else {
                    Log.Error("User ".concat(userLogin, " not found - not added to the conversation"));
                }
            }
            function ForwardToRecipient(loginID, date) {
                var contributor = SetStartingDateAndRight(date);
                Process.Forward(loginID || contributor.login);
                GiveRightOnConversationToUser(loginID || contributor.login);
                Process.LeaveForm();
                return contributor;
            }
            Workflow.ForwardToRecipient = ForwardToRecipient;
            function DoAction(actionName) {
                LazyInitializeWorkflow();
                var ctrl = Lib.Shipping.Workflow.controller;
                if (actionName) {
                    return ctrl.DoAction(actionName);
                }
                var idx = ctrl.GetContributorIndex();
                var currentContributor = ctrl.GetContributorAt(idx);
                Log.Info("[Workflow.Doaction] ".concat(currentContributor.action));
                if (currentContributor.action != undefined) {
                    return ctrl.DoAction(currentContributor.action);
                }
                return false;
            }
            Workflow.DoAction = DoAction;
            var serverParameters = {
                actions: {
                    rejection: {
                        OnDone: function (sequenceStep) {
                            Lib.Shipping.Validation.RejectASN();
                            var newComment = Data.GetValue("Comments__");
                            var contributionData = GetContributionData(sequenceStep, Workflow.Actions.submitted, newComment, { onBehalfOf: true });
                            GoToNextStep(contributionData, Workflow.controller.IsLastContributor());
                        }
                    },
                    submission: {
                        OnDone: function (sequenceStep) {
                            Log.Verbose("[Workflow.OnDone] submission");
                            var idx = Workflow.controller.GetContributorIndex();
                            var currentContributor = Workflow.controller.GetContributorAt(idx);
                            if (!ContributorExist(currentContributor)) {
                                Lib.Shipping.Workflow.parameters.callbacks.OnError(new Sys.WorkflowEngine.Error("_Inexistent reviewer {0}, please contact your administrator", currentContributor.login));
                                Process.PreventApproval();
                                return Sys.Helpers.Promise.Resolve();
                            }
                            var submitOptions = {};
                            var nextContributor = Workflow.controller.GetContributorAt(sequenceStep + 1);
                            submitOptions.lastReviewer = nextContributor && nextContributor.role !== Workflow.Roles.reviewer;
                            return Lib.Shipping.Validation.SubmitASN(submitOptions)
                                .Then(function () {
                                if (submitOptions.lastReviewer) {
                                    var ctrl = Lib.Shipping.Workflow.controller;
                                    ctrl.AllowRebuild(false);
                                }
                                var newComment = Data.GetValue("Comments__");
                                var contributionData = GetContributionData(sequenceStep, Workflow.Actions.submitted, newComment, { onBehalfOf: true });
                                GoToNextStep(contributionData, Workflow.controller.IsLastContributor());
                            })
                                .Catch(Lib.Shipping.Validation.HandleValidationError)
                                .Finally(Process.PreventApproval);
                        }
                    },
                    receive: {
                        OnDone: function (sequenceStep) {
                            var nextContributor = Workflow.controller.GetContributorAt(sequenceStep + 1);
                            Log.Info("[Workflow.OnDone] Receive");
                            return Lib.Shipping.Validation.ConfirmReceipt()
                                .Then(function () {
                                var newComment = Data.GetValue("Comments__");
                                var contributionData = GetContributionData(sequenceStep, Workflow.Actions.received, newComment, { onBehalfOf: true });
                                var autoApproveReturn = Workflow.controller.AutoApproveIfNextIsSameUser(Lib.P2P.GetValidatorOrOwner(), sequenceStep, nextContributor, contributionData, function (currentUser, aNextContributor) {
                                    return Lib.P2P.CurrentUserMatchesLogin(aNextContributor.login, currentUser) && aNextContributor.role === Workflow.Roles.recipient;
                                }, function () {
                                    // Remove "validate" right of skipped user
                                    var idx = Workflow.controller.GetContributorIndex();
                                    var skippedContributor = Workflow.controller.GetContributorAt(idx - 1);
                                    if (skippedContributor) {
                                        Process.SetRight(skippedContributor.login, "read");
                                    }
                                }, function () {
                                    return {
                                        actionName: Workflow.Actions.received,
                                        autoComment: Language.Translate("_ASN auto received")
                                    };
                                }, GetContributionData);
                                var lastReceiver = !autoApproveReturn.nextContributor;
                                if (lastReceiver) {
                                    Lib.Shipping.Workflow.controller.EndWorkflow(autoApproveReturn.contributionData);
                                    Lib.Shipping.Validation.LastReception();
                                }
                                else {
                                    GoToNextStep(autoApproveReturn.contributionData);
                                }
                                // Update Vendor ASN
                                Lib.Shipping.Vendor.Update(Data.GetValue("VendorASNRUIDEX__"));
                            })
                                .Catch(function (reason) {
                                if (reason instanceof Lib.Shipping.Validation.OverReceivedItemError) {
                                    Lib.CommonDialog.NextAlert.Define("_ConfirmReceipt_ErrorTitle", "_Error_Received qty outmatch ordered qty", {
                                        isError: true
                                    });
                                }
                                else {
                                    if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                                        Log.Error("[Validation.ReceiveOnDone] unexpected error: " + reason);
                                    }
                                    Lib.CommonDialog.NextAlert.Define("_ConfirmReceipt_ErrorTitle", "_ConfirmReceipt_ErrorMessage", {
                                        isError: true
                                    });
                                }
                                // Error, block reception
                                Process.PreventApproval();
                            });
                        }
                    }
                },
                callbacks: {
                    OnError: function (msg) {
                        if (msg instanceof Sys.WorkflowEngine.Error) {
                            Lib.CommonDialog.NextAlert.Define("_Workflow error", msg.toString(), {
                                isError: true,
                                behaviorName: "onUnexpectedError"
                            });
                            Log.Error(msg.toRawErrorString());
                        }
                        else if (msg instanceof Sys.WorkflowEngine.ErrorNoPopUp) {
                            Log.Error(msg.toRawErrorString());
                        }
                        else {
                            Log.Info("Workflow Error :" + msg);
                        }
                    }
                }
            };
            Sys.Helpers.Extend(true, Lib.Shipping.Workflow.parameters, serverParameters);
        })(Workflow = Shipping.Workflow || (Shipping.Workflow = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
