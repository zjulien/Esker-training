///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Budget_FullRecovery_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Full recovery budget library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_Budget_V12.0.461.0",
    "Lib_Budget_Updater_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_Data"
  ]
}*/
var Lib;
(function (Lib) {
    var Budget;
    (function (Budget) {
        var FullRecoveryOperationDetailsTable = {
            name: "PurchasingFullBudgetRecoveryOperationDetails__",
            columns: {
                ToolRuidEx: "ToolRuidEx__",
                RequestTimestamp: "RequestTimestamp__",
                DocumentRuidEx: "DocumentRuidEx__",
                DocumentInitialState: "DocumentInitialState__",
                Status: "Status__",
                Details: "Details__"
            }
        };
        /**
         * Checks budget integrity on the specified document.
         * In an error level, we report all issues on budgetID that require a manual intervention: missing, multiple or unknown
         * In a warning level, we report all issues on budgetOperationDetails that can be fixed by re-creating operation details
         * @param document document to check. If none, we take the current one.
         * @param options options. Some options can be used in the GetBudget call.
         * @returns {Promise} resolved with a plain object containing lists of errors and warnings
         */
        function CheckBudgetIntegrity(document, options) {
            Log.Info("Checking budget integrity for document...");
            options = options || {};
            var result = {
                budgets: null,
                warnings: [],
                errors: []
            };
            var optionsToGetBudgets = {
                document: document,
                // before recovering budget, the initial budgetIDs can be wrong
                initialBudgetIDByItems: options.initialBudgetIDByItems,
                stateToDeduceImpactAction: GetDocumentStateToDeduceImpact(document),
                // always recompute budgetID wherever type of doc
                recomputeBudgetID: true
            };
            return Lib.Budget
                .GetBudgets(optionsToGetBudgets)
                .Then(function (budgets) {
                result.budgets = budgets;
                CheckBudgetID(document, budgets, result);
                CheckBudgetOperationDetails(budgets, result);
                return result;
            })
                .Catch(function (error) {
                result.errors.push({
                    type: "UNEXPECTED_ERROR",
                    details: error.toString()
                });
                return result;
            });
        }
        Budget.CheckBudgetIntegrity = CheckBudgetIntegrity;
        function CheckBudgetID(document, budgets, result) {
            var documentData = Sys.Helpers.IsUndefined(document) ? Data : document.GetFormData();
            var formTable = documentData.GetTable(budgets.sourceTypeConfig.formTable);
            Sys.Helpers.Data.ForEachTableItem(formTable, function (item, i) {
                if (!budgets.sourceTypeConfig.IsEmptyItem(item)) {
                    var itemBudgetID = budgets.byItemIndex[i];
                    if (itemBudgetID instanceof Lib.Budget.MissingBudgetIDError) {
                        var error_1 = itemBudgetID;
                        var details = Lib.Budget.Configuration.GetBudgetKeyColumns().map(function (budgetColumn) {
                            // special behaviour for PeriodCode
                            if (budgetColumn === "PeriodCode__") {
                                return "PeriodStart__ <= ".concat(error_1.budgetKeyColumns[budgetColumn], " <= PeriodEnd__");
                            }
                            return budgetColumn + "=" + error_1.budgetKeyColumns[budgetColumn];
                        }).join(", ");
                        // specified budgetID on record doesn't exist in database
                        if (error_1.budgetID) {
                            result.errors.push({
                                type: "UNKNOWN_BUDGETID",
                                details: [error_1.budgetID, details, i]
                            });
                        }
                        else {
                            result.errors.push({
                                type: "MISSING_BUDGETID|NO_BUDGET_IN_DB",
                                details: [details, i]
                            });
                        }
                    }
                    else if (itemBudgetID instanceof Lib.Budget.MultipleBudgetError) {
                        var error_2 = itemBudgetID;
                        var details = Lib.Budget.Configuration.GetBudgetKeyColumns().map(function (budgetColumn) {
                            return budgetColumn + "=" + error_2.budgetKeyColumns[budgetColumn];
                        }).join(", ");
                        result.errors.push({
                            type: "MULTIPLE_BUDGETID",
                            details: [error_2.budgetIDs.join(", "), details, i]
                        });
                    }
                    else if (!itemBudgetID) {
                        var details = Lib.Budget.Configuration.GetBudgetKeyColumns().map(function (budgetColumn) {
                            return budgetColumn + "=" + Lib.Budget.GetBudgetColumnValue(budgetColumn, documentData, item, budgets.sourceTypeConfig);
                        }).join(", ");
                        result.errors.push({
                            type: "MISSING_BUDGETID|INVALID_BUDGET",
                            details: [details, i]
                        });
                    }
                }
            });
        }
        function CheckBudgetOperationDetails(budgets, result) {
            // Error on operation details (impacts)
            Sys.Helpers.Object.ForEach(budgets.byBudgetID, function (budget, budgetID) {
                var impacted = Lib.Budget.Impact.HasFinalImpact(budget.Impact, budget.PreviousImpact);
                if (impacted) {
                    var hasImpact = budget.Impact && budget.Impact.HasImpact();
                    var hasPreviousImpact = budget.PreviousImpact && budget.PreviousImpact.HasImpact();
                    if (hasImpact && hasPreviousImpact) {
                        result.warnings.push({
                            type: "OPERATION_DETAILS|DIFF_IMPACTS",
                            details: budgetID
                        });
                    }
                    else if (hasImpact) {
                        result.warnings.push({
                            type: "OPERATION_DETAILS|MISSING_OPE",
                            details: budgetID
                        });
                    }
                    else {
                        result.warnings.push({
                            type: "OPERATION_DETAILS|IMPACTED_BY_ERROR",
                            details: budgetID
                        });
                    }
                }
            });
        }
        /**
         * Re-creates budget operation details for the specified document.
         * If any blocking error is detected this function returns a rejected promise.
         * If no issue is detected when checking budget this function does nothing and returns a resolved promise.
         * Otherwise (only warnings detected) we update budget in order to recreate operation details.
         * @param {object} [document] document impacting budget. If none, we take the current one.
         */
        function RecreateDocumentOperationDetails(document) {
            Log.Info("Re-creating the budget operation details for document...");
            return CheckBudgetIntegrity(document)
                .Then(function (resultOfCheckBudgetIntegrity) {
                if (resultOfCheckBudgetIntegrity.errors.length > 0) {
                    Log.Error("Some blocking errors on budget have been detected.");
                    throw new Error("Some blocking errors on budget. Details:\n" + JSON.stringify(resultOfCheckBudgetIntegrity.errors, null, 4));
                }
                else if (resultOfCheckBudgetIntegrity.warnings.length > 0) {
                    var optionsToUpdateBudgets = {
                        budgetAmountsToUpdate: false
                    };
                    return Lib.Budget
                        .UpdateBudgets(resultOfCheckBudgetIntegrity.budgets, optionsToUpdateBudgets)
                        .Then(function (updatedBudgets) {
                        Log.Info("Budget operation details recreation succeeded.");
                        return updatedBudgets.budgets;
                    });
                }
                else {
                    Log.Info("No issue detected => nothing to do");
                    return resultOfCheckBudgetIntegrity.budgets;
                }
            });
        }
        Budget.RecreateDocumentOperationDetails = RecreateDocumentOperationDetails;
        function FinalizeFullRecovery() {
            Log.Info("Finalizing full recovery");
            var documentRuidEx = Data.GetValue("RuidEx");
            var operationDetailsToUpdate = {
                Status: FullRecoveryStatus.Success
            };
            return UpdateFullRecoveryOperationDetails(documentRuidEx, operationDetailsToUpdate)
                .Then(function () {
                var serializedRecoveryData = Variable.GetValueAsString("FullBudgetRecoveryData");
                var recoveryData = (serializedRecoveryData && JSON.parse(serializedRecoveryData)) || {};
                // reset recovery data on document
                Variable.SetValueAsString("FullBudgetRecoveryData", "");
                // restore the original state of document
                if (recoveryData.originalState === 70) {
                    Log.Info("Restore document state as waiting for approval");
                    Process.PreventApproval();
                }
                else if (recoveryData.originalState === 90) {
                    Log.Info("Restore document state as being processed");
                    Process.WaitForUpdate();
                    Process.LeaveForm();
                }
                else {
                    Log.Info("Restore terminal state on document: " + recoveryData.originalState);
                    Data.SetValue("State", recoveryData.originalState);
                }
            });
        }
        Budget.FinalizeFullRecovery = FinalizeFullRecovery;
        function HandleErrorsOnFullRecovery(error) {
            Log.Error("Handling errors on a full recovery. Details: " + error.toString());
            var documentRuidEx = Data.GetValue("RuidEx");
            var operationDetailsToUpdate = {
                Status: FullRecoveryStatus.Error,
                Details: error.toString()
            };
            return UpdateFullRecoveryOperationDetails(documentRuidEx, operationDetailsToUpdate)
                .Then(function () {
                Process.PreventApproval();
            });
        }
        Budget.HandleErrorsOnFullRecovery = HandleErrorsOnFullRecovery;
        //////////////
        var FullRecoveryStatus;
        (function (FullRecoveryStatus) {
            FullRecoveryStatus[FullRecoveryStatus["Pending"] = 0] = "Pending";
            FullRecoveryStatus[FullRecoveryStatus["Success"] = 1] = "Success";
            FullRecoveryStatus[FullRecoveryStatus["Error"] = 2] = "Error";
        })(FullRecoveryStatus || (FullRecoveryStatus = {}));
        function UpdateFullRecoveryOperationDetails(documentRuidEx, operationDetailsToUpdate) {
            return Sys.Helpers.Promise.Create(function (resolve) {
                Log.Info("Updating full recovery operation details for documentRuidEx: " + documentRuidEx);
                var query = Process.CreateQueryAsProcessAdmin();
                query.Reset();
                query.AddAttribute("*");
                query.SetSpecificTable(FullRecoveryOperationDetailsTable.name);
                var filter = "(&(Status__=".concat(FullRecoveryStatus.Pending, ")(").concat(FullRecoveryOperationDetailsTable.columns.DocumentRuidEx, "=").concat(documentRuidEx, "))");
                query.SetFilter(filter);
                if (query.MoveFirst()) {
                    var record = query.MoveNextRecord();
                    while (record) {
                        var vars = record.GetVars();
                        if (Sys.Helpers.IsDefined(operationDetailsToUpdate.ToolRuidEx)) {
                            vars.AddValue_String(FullRecoveryOperationDetailsTable.columns.ToolRuidEx, operationDetailsToUpdate.ToolRuidEx, true);
                        }
                        if (Sys.Helpers.IsDefined(operationDetailsToUpdate.RequestTimestamp)) {
                            vars.AddValue_String(FullRecoveryOperationDetailsTable.columns.RequestTimestamp, operationDetailsToUpdate.RequestTimestamp, true);
                        }
                        if (Sys.Helpers.IsDefined(operationDetailsToUpdate.DocumentRuidEx)) {
                            vars.AddValue_String(FullRecoveryOperationDetailsTable.columns.DocumentRuidEx, operationDetailsToUpdate.DocumentRuidEx, true);
                        }
                        if (Sys.Helpers.IsDefined(operationDetailsToUpdate.Status)) {
                            vars.AddValue_String(FullRecoveryOperationDetailsTable.columns.Status, operationDetailsToUpdate.Status, true);
                        }
                        if (Sys.Helpers.IsDefined(operationDetailsToUpdate.Details)) {
                            vars.AddValue_String(FullRecoveryOperationDetailsTable.columns.Details, operationDetailsToUpdate.Details, true);
                        }
                        record.Commit();
                        if (record.GetLastError()) {
                            Log.Info("Unable to save Record: " + record.GetLastErrorMessage());
                        }
                        record = query.MoveNextRecord();
                    }
                }
                else {
                    Log.Info("Cannot select full recovery operation details. Details: " + query.GetLastErrorMessage());
                }
                resolve();
            });
        }
        function GetDocumentStateToDeduceImpact(document) {
            var currentState;
            var serializedRecoveryData;
            if (!document) {
                currentState = Data.GetValue("State");
                serializedRecoveryData = Variable.GetValueAsString("FullBudgetRecoveryData");
            }
            else {
                var vars = document.GetUninheritedVars();
                currentState = vars.GetValue_Long("State", 0);
                var extVars = document.GetExternalVars();
                serializedRecoveryData = extVars.GetValue_String("FullBudgetRecoveryData", 0);
            }
            var recoveryData = (serializedRecoveryData && JSON.parse(serializedRecoveryData)) || {};
            return (recoveryData.originalState || currentState).toString();
        }
    })(Budget = Lib.Budget || (Lib.Budget = {}));
})(Lib || (Lib = {}));
