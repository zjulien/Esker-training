///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_WorkflowPO_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Sys/Sys_Helpers"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var WorkflowPO;
        (function (WorkflowPO) {
            // STD Globals Object
            var g = Sys.Helpers.Globals;
            function ResolveLogin(login) {
                var referenceValue = typeof g.User !== "undefined" ? g.User.loginId : Lib.P2P.GetOwner().GetValue("login");
                var firstDot = referenceValue.indexOf(".");
                var firstAt = referenceValue.indexOf("@");
                if (firstDot < firstAt) {
                    referenceValue = referenceValue.substr(firstDot + 1);
                }
                return login.replace("%[reference:login:demosubstring]", referenceValue);
            }
            function OnBuildBuyer(role, action) {
                Log.Info("OnBuildBuyer(callback, role, action)");
                if (!Sys.Helpers.IsEmpty(g.Data.GetValue("BuyerLogin__"))) {
                    return [{
                            contributorId: g.Data.GetValue("BuyerLogin__") + role,
                            role: role,
                            login: g.Data.GetValue("BuyerLogin__"),
                            email: g.Data.GetValue("BuyerLogin__"),
                            name: g.Data.GetValue("BuyerName__"),
                            action: action
                        }];
                }
                return [];
            }
            function OnBuildTreasurer(role, action) {
                Log.Info("OnBuildTreasurer(callback, role, action)");
                var Login = ResolveLogin(Sys.Parameters.GetInstance("PAC").GetParameter("TreasurerLogin"));
                Log.Info("'Login '" + Login + "' lookup.");
                var findInArray = function (array, callback) {
                    for (var idx in array) {
                        if (callback(array[idx])) {
                            return array[idx];
                        }
                    }
                    return null;
                };
                return Sys.GenericAPI.PromisedQuery({
                    table: "ODUSER",
                    filter: "login=" + Login,
                    attributes: ["login", "displayname", "emailaddress"],
                    maxRecords: 2,
                    sortOrder: "login"
                })
                    .Then(function (result) {
                    if (result.length === 0) {
                        return [];
                    }
                    var element = findInArray(result, function (e) { return e.login === Login; });
                    if (!element) {
                        return [];
                    }
                    return [{
                            //mandatory fields
                            contributorId: element.login + role,
                            role: role,
                            //not mandatory fields
                            login: element.login,
                            email: element.emailaddress,
                            name: element.displayname,
                            action: action
                        }];
                })
                    .Catch(function () { return []; });
            }
            function UpdateRolesSequence(downPaymentAsked) {
                if (downPaymentAsked) {
                    WorkflowPO.workflow.SetRolesSequence(["buyer", "treasurer"]);
                }
                else {
                    WorkflowPO.workflow.SetRolesSequence(["buyer"]);
                }
            }
            WorkflowPO.UpdateRolesSequence = UpdateRolesSequence;
            /**
                * @exports WorkflowPO
                * @memberof Lib.Purchasing
                */
            WorkflowPO.Parameters = {
                actions: {
                    doReceipt: {
                        image: "PR_reception_grey.png"
                    },
                    received: {
                        image: "PR_reception_shipto.png"
                    },
                    doDownPayment: {
                        image: "PO_doDownpayment_grey.png"
                    },
                    downPaymentDone: {
                        image: "PO_doDownPayment.png"
                    },
                    doOrder: {
                        image: "PR_order_grey.png"
                    },
                    ordered: {
                        image: "PR_order.png"
                    },
                    canceled: {
                        image: "PR_cancel.png"
                    },
                    rejected: {
                        image: "PR_reject.png"
                    }
                },
                roles: {
                    buyer: {
                        OnBuildPromise: function (previousStepContributorsList, dryRunBuildParams) {
                            return Sys.Helpers.Promise.Resolve(OnBuildBuyer(Lib.Purchasing.roleBuyer, this.actions.doOrder.GetName()));
                        }
                    },
                    treasurer: {
                        OnBuildPromise: function (previousStepContributorsList, dryRunBuildParams) {
                            return OnBuildTreasurer(Lib.Purchasing.roleTreasurer, this.actions.doDownPayment.GetName());
                        }
                    }
                },
                mappingTable: {
                    tableName: "POWorkflow__",
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
            WorkflowPO.workflow = Sys.WorkflowController.Create({ version: 2 });
        })(WorkflowPO = Purchasing.WorkflowPO || (Purchasing.WorkflowPO = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
