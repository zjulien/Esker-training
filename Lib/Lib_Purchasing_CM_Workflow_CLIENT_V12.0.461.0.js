/* eslint-disable class-methods-use-this */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CM_Workflow_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing Catalog client library used to manage document workflow",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_CM_Workflow_V12.0.461.0",
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
                var CClientHelperWorkflow = /** @class */ (function () {
                    function CClientHelperWorkflow(helperWkf) {
                        this.cmReverter = {
                            creationErrorMessage: null,
                            resultNextAlertVariable: null,
                            table: null,
                            msnEx: null,
                            refreshStatusInterval: null,
                            queryPending: false,
                            ended: false,
                            resolve: null
                        };
                        this.helperWkf = helperWkf;
                    }
                    CClientHelperWorkflow.prototype.GetWkfParameters = function () {
                        return {
                            mappingTable: {
                                OnRefreshRow: this.MakeMappingTableOnRefreshRow()
                            },
                            callbacks: {
                                OnError: this.callbacksOnError.bind(this),
                                OnBuilding: this.callbacksOnBuilding.bind(this),
                                OnBuilt: this.callbacksOnBuilt.bind(this)
                            }
                        };
                    };
                    CClientHelperWorkflow.prototype.callbacksOnBuilt = function () {
                        // Called after the call to the OnBuild functions.
                        // Here you can do the opposite of the previous function.
                        ProcessInstance.SetSilentChange(false);
                    };
                    CClientHelperWorkflow.prototype.callbacksOnBuilding = function () {
                        // Called before the call to the OnBuild functions. Here you can:
                        // - Disable buttons
                        // - Display a waiting icon
                        // - etc.
                        ProcessInstance.SetSilentChange(true);
                    };
                    CClientHelperWorkflow.prototype.callbacksOnError = function (msg) {
                        Log.Info(msg);
                    };
                    CClientHelperWorkflow.prototype.MakeMappingTableOnRefreshRow = function () {
                        var that = this;
                        return function (index) {
                            var table = Controls[this.mappingTable.tableName];
                            var row = table.GetRow(index);
                            // Highlight the row and add a cursor in the first column if the process is not in a final state.
                            if (row.WRKFAction__.GetValue()) //test if the line is not empty
                             {
                                row.WRKFRole__.SetImageURL(this.actions[row.WRKFAction__.GetValue()].image, false);
                                Lib.P2P.HighlightCurrentWorkflowStep(that.helperWkf.controller, this.mappingTable.tableName, index);
                            }
                            row.WRKFUserName__.SetImageURL(Lib.P2P.GetP2PUserImage(row.WRKFIsGroup__.GetValue()), true);
                        };
                    };
                    CClientHelperWorkflow.prototype.InitWorkflowLayout = function () {
                        Controls.WorkflowTable__.SetWidth("100%");
                        Controls.WorkflowTable__.SetExtendableColumn("WRKFComment__");
                        Controls.WorkflowTable__.SetRowToolsHidden(true);
                        if (!ProcessInstance.isDebugActive) {
                            Controls.WorkflowTable__.WRKFAction__.Hide();
                            Controls.WorkflowTable__.Workflow_index__.Hide();
                        }
                    };
                    CClientHelperWorkflow.prototype.HideWaitScreen = function (hide) {
                        // async call just after boot
                        return Sys.Helpers.Promise.Resolve()
                            .Then(function () {
                            Controls.CompanyCode__.Wait(!hide);
                        });
                    };
                    CClientHelperWorkflow.prototype.CreateAndWaitForCMReverter = function () {
                        var _this = this;
                        return this.HideWaitScreen(false)
                            .Then(function () { return Sys.Helpers.Promise.Create(function (resolve) {
                            Process.CreateProcessInstance("Catalog Management Reverter", {
                                CMWRuidEx__: Data.GetValue("RuidEx"),
                                CMRuidEx__: Variable.GetValueAsString("CMRUIDEX"),
                                CompanyCode__: Data.GetValue("CompanyCode__"),
                                VendorNumber__: Data.GetValue("VendorNumber__"),
                                WarehouseNumber__: Data.GetValue("WarehouseNumber__")
                            }, {
                                Reverting: true
                            }, {
                                callback: function (data) {
                                    if (data.error) {
                                        _this.cmReverter.creationErrorMessage = data.errorMessage;
                                        resolve();
                                    }
                                    else {
                                        Log.Info("Canceler created with ruidEx: " + data.ruid);
                                        _this.cmReverter.table = data.ruid.replace(/\.[^\.]+$/, "");
                                        _this.cmReverter.msnEx = data.ruid.replace(/^[^\.]+\./, "");
                                        _this.cmReverter.resolve = resolve;
                                        // 2- Wait for the end of GR canceler (polling...)
                                        _this.cmReverter.refreshStatusInterval = setInterval(_this.RefreshCMReverterStatus.bind(_this), 2000);
                                    }
                                }
                            });
                        }); });
                    };
                    CClientHelperWorkflow.prototype.RefreshCMReverterStatus = function () {
                        if (!this.cmReverter.queryPending) {
                            this.cmReverter.queryPending = true;
                            Query.DBQuery(this.MakeOnRequestResult(), this.cmReverter.table, "State|EXTERNAL_VARIABLE_CommonDialog_NextAlert%FORMATTED", "msnex=" + this.cmReverter.msnEx, "", 1);
                        }
                    };
                    CClientHelperWorkflow.prototype.MakeOnRequestResult = function () {
                        var that = this;
                        return function () {
                            that.cmReverter.queryPending = false;
                            if (that.cmReverter.ended) {
                                return;
                            }
                            var err = this.GetQueryError();
                            if (err) {
                                Log.Error("Query Error: " + err);
                                return;
                            }
                            var recordsCount = this.GetRecordsCount();
                            if (recordsCount !== 1) {
                                return;
                            }
                            var state = this.GetQueryValue("State", 0);
                            if (state === 70 || state >= 100) {
                                that.cmReverter.ended = true;
                                clearInterval(that.cmReverter.refreshStatusInterval);
                                that.cmReverter.refreshStatusInterval = null;
                                that.cmReverter.resultNextAlertVariable = this.GetQueryValue("EXTERNAL_VARIABLE_CommonDialog_NextAlert%FORMATTED", 0);
                                that.cmReverter.resolve();
                            }
                        };
                    };
                    CClientHelperWorkflow.prototype.DisplayCMReverterResult = function () {
                        if (this.cmReverter.resultNextAlertVariable) {
                            Variable.SetValueAsString("CommonDialog_NextAlert", this.cmReverter.resultNextAlertVariable);
                        }
                        else {
                            var reason = "Unexpected error.";
                            if (this.cmReverter.creationErrorMessage) {
                                Log.Error("CM reverter creation error. Details: " + this.cmReverter.creationErrorMessage);
                                reason = this.cmReverter.creationErrorMessage;
                            }
                            Lib.CommonDialog.NextAlert.Define("_CM revert error", "_CM revert error message", {
                                isError: true,
                                behaviorName: "CMRevertFailure"
                            }, reason);
                        }
                        Lib.CommonDialog.NextAlert.Show({
                            "CMRevertSuccess": {
                                OnOK: function () {
                                    ProcessInstance.Quit("quit");
                                }
                            },
                            "CMRevertFailure": {
                                OnOK: function () {
                                    ProcessInstance.Quit("quit");
                                }
                            }
                        });
                        return this.HideWaitScreen(true);
                    };
                    CClientHelperWorkflow.prototype.Revert = function () {
                        var _this = this;
                        this.cmReverter = {
                            creationErrorMessage: null,
                            resultNextAlertVariable: null,
                            table: null,
                            msnEx: null,
                            refreshStatusInterval: null,
                            queryPending: false,
                            ended: false,
                            resolve: null
                        };
                        var createPromise = this.CreateAndWaitForCMReverter()
                            .Then(function () { return _this.DisplayCMReverterResult(); });
                        Sys.Helpers.Synchronizer.OnProgressFromPromise(createPromise, {
                            progressDelay: 15000,
                            userData: {
                                dialogTitle: "_Form awaiting CM cancel",
                                dialogMessage: "_Form awaiting CM cancel message"
                            }
                        });
                        return createPromise;
                    };
                    CClientHelperWorkflow.prototype.RevertManager = function () {
                        var revertMessage = "_This will revert all changes made to the catalog.";
                        Popup.Confirm(revertMessage, false, this.Revert.bind(this), null, "_Revert changes");
                    };
                    CClientHelperWorkflow.prototype.GetLastApprovedUpdateRequest = function () {
                        var queryOptions = {
                            table: "CDNAME#Catalog management workflow",
                            filter: this.GetLastApprovedUpdateRequestFilter(),
                            attributes: ["RUIDEX", "CompletionDateTime", "Status__"],
                            sortOrder: "CompletionDateTime DESC",
                            maxRecords: 1
                        };
                        return Sys.GenericAPI.PromisedQuery(queryOptions)
                            .Then(function (results) { return results.length > 0 ? results[0].RUIDEX : null; });
                    };
                    return CClientHelperWorkflow;
                }());
                Workflow.CClientHelperWorkflow = CClientHelperWorkflow;
                var CClientHelperWorkflowVendorItem = /** @class */ (function (_super) {
                    __extends(CClientHelperWorkflowVendorItem, _super);
                    function CClientHelperWorkflowVendorItem(helperWkf) {
                        var _this = _super.call(this, helperWkf) || this;
                        Log.Info("CClientHelperWorkflowVendorItem");
                        return _this;
                    }
                    CClientHelperWorkflowVendorItem.prototype.GetLastApprovedUpdateRequestFilter = function () {
                        var companyCode = Data.GetValue("CompanyCode__") || "";
                        var vendorNumber = Data.GetValue("VendorNumber__") || "";
                        return "(&(Status__=Approved)(CompanyCode__=" + companyCode + ")(VendorNumber__=" + vendorNumber + "))";
                    };
                    return CClientHelperWorkflowVendorItem;
                }(CClientHelperWorkflow));
                Workflow.CClientHelperWorkflowVendorItem = CClientHelperWorkflowVendorItem;
                var CClientHelperWorkflowWarehouseItem = /** @class */ (function (_super) {
                    __extends(CClientHelperWorkflowWarehouseItem, _super);
                    function CClientHelperWorkflowWarehouseItem(helperWkf) {
                        var _this = _super.call(this, helperWkf) || this;
                        Log.Info("CClientHelperWorkflowWarehouseItem");
                        return _this;
                    }
                    CClientHelperWorkflowWarehouseItem.prototype.GetLastApprovedUpdateRequestFilter = function () {
                        var companyCode = Data.GetValue("CompanyCode__") || "";
                        var warehouseNumber = Data.GetValue("WarehouseNumber__") || "";
                        return "(&(Status__=Approved)(CompanyCode__=" + companyCode + ")(WarehouseNumber__=" + warehouseNumber + "))";
                    };
                    return CClientHelperWorkflowWarehouseItem;
                }(CClientHelperWorkflow));
                Workflow.CClientHelperWorkflowWarehouseItem = CClientHelperWorkflowWarehouseItem;
            })(Workflow = CM.Workflow || (CM.Workflow = {}));
        })(CM = Purchasing.CM || (Purchasing.CM = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
