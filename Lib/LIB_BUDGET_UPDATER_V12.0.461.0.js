///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Budget_Updater_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Budget updater library",
  "require": [
    "Lib_Budget_V12.0.461.0",
    "Sys/Sys_Decimal"
  ]
}*/
var Lib;
(function (Lib) {
    var Budget;
    (function (Budget) {
        /**
         * Max allowed duration of the budgets update (in seconds)
         */
        // Global variables
        Budget.budgetsUpdateDelay = 30;
        /**
         * Special errors
         */
        // Exposed classes
        var PreventConcurrentAccessError = /** @class */ (function (_super) {
            __extends(PreventConcurrentAccessError, _super);
            function PreventConcurrentAccessError() {
                var _this = _super.call(this) || this;
                // Fix 'this instanceof PreventConcurrentAccessError'
                // See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
                Sys.Helpers.Object.SetPrototypeOf(_this, PreventConcurrentAccessError.prototype);
                return _this;
            }
            return PreventConcurrentAccessError;
        }(Error));
        Budget.PreventConcurrentAccessError = PreventConcurrentAccessError;
        /**
         * Retrieves budget according to the specified options.
         * @param {object} budgets object returned by GetBudgets function.
         * @param {object} options
         * @param {number} [options.updateDelay] overrides the max allowed duration of the budgets update (in seconds)
         * @param {boolean} [options.budgetAmountsToUpdate=true] to false avoid to lock impacted budgets and update their amounts.
         * @returns {promise}
         */
        // Functions
        Budget.UpdateBudgets = (function () {
            function GetImpactedBudgets(result) {
                Sys.Helpers.Object.ForEach(result.budgets.byBudgetID, function (budget, budgetID) {
                    var impacted = Lib.Budget.Impact.HasFinalImpact(budget.Impact, budget.PreviousImpact);
                    if (impacted) {
                        Log.Info("Budget [" + budgetID + "] is impacted");
                        result.impactedBudgets[budgetID] = budget;
                    }
                });
            }
            function _UpdateBudgets(result) {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    Log.Info("Updating budget amounts...");
                    var filter = Lib.Budget.BuildFilterFromBudgets(result.impactedBudgets);
                    Query.Reset();
                    Query.SetFilter(filter);
                    Query.SetSpecificTable("PurchasingBudget__");
                    if (Query.MoveFirst()) {
                        var record = Query.MoveNextRecord();
                        var _loop_1 = function () {
                            var vars = record.GetVars();
                            var budgetID = vars.GetValue_String("BudgetID__", 0);
                            if (budgetID in result.impactedBudgets) {
                                var budget = result.impactedBudgets[budgetID];
                                var finalImpact = Lib.Budget.Impact.GetFinalImpact(budget.Impact, budget.PreviousImpact);
                                Log.Info("UpdateBudgets: impacting budget [" + budgetID + "] by: " + finalImpact.toString());
                                finalImpact.ForEachStep(function (step, impact) {
                                    var amount = vars.GetValue_Double(step, 0);
                                    vars.AddValue_Double(step, new Sys.Decimal(amount).add(impact).toNumber(), true);
                                });
                                record.Commit();
                                if (record.GetLastError()) {
                                    reject("Failed to update budget with budgetID: " + budgetID + ". Details: " + record.GetLastErrorMessage());
                                    return { value: void 0 };
                                }
                            }
                            record = Query.MoveNextRecord();
                        };
                        while (record) {
                            var state_1 = _loop_1();
                            if (typeof state_1 === "object")
                                return state_1.value;
                        }
                        resolve();
                    }
                    else {
                        reject("Cannot query budgets to update. Details: " + Query.GetLastErrorMessage());
                    }
                });
            }
            /**
             * Retrieves the value of VendorName__ / VendorNumber__ / Note__ and adds it to vars
             * @param vars
             * @param budget
             * @param result
             */
            function GetAdditionalInfo(vars, budget, result) {
                var formTable = result.budgets.documentData.GetTable(result.budgets.sourceTypeConfig.formTable);
                var vendorNames = [];
                var vendorNumbers = [];
                var notes = [];
                budget.Items.forEach(function (i) {
                    var itemData = formTable.GetItem(i);
                    vendorNames.push(Lib.Budget.GetBudgetColumnValue("VendorName__", result.budgets.documentData, itemData, result.budgets.sourceTypeConfig));
                    vendorNumbers.push(Lib.Budget.GetBudgetColumnValue("VendorNumber__", result.budgets.documentData, itemData, result.budgets.sourceTypeConfig));
                    notes.push(Lib.Budget.GetBudgetColumnValue("Note__", result.budgets.documentData, itemData, result.budgets.sourceTypeConfig));
                });
                // if the vendorName is unique, returns the vendorName / else returns an empty value
                var vendorName = vendorNames.length > 0 && vendorNames.every(function (val, _i, arr) { return val === arr[0]; }) ? vendorNames[0] : "";
                var vendorNumber = vendorNumbers.length > 0 && vendorNumbers.every(function (val, _i, arr) { return val === arr[0]; }) ? vendorNumbers[0] : "";
                var note = notes.length > 0 && notes.every(function (val, _i, arr) { return val === arr[0]; }) ? notes[0] : "";
                vars.AddValue_String("VendorName__", vendorName, true);
                vars.AddValue_String("VendorNumber__", vendorNumber, true);
                vars.AddValue_String("Note__", note, true);
            }
            function UpdateBudgetOperationDetails(result) {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    Log.Info("Updating the budget operation details...");
                    var ruidEx = Lib.Budget.GetBuiltinDocumentValue(result.options.document, "RuidEx");
                    var filter = "(&(OperationRuidex__=" + ruidEx + ")";
                    filter += Lib.Budget.BuildFilterFromBudgets(result.impactedBudgets);
                    filter += ")";
                    // shallow copy of the list in order to detect new budget impacts
                    var impactedBudgets = Sys.Helpers.Extend({}, result.impactedBudgets);
                    Query.Reset();
                    Query.SetFilter(filter);
                    Query.SetSpecificTable("PurchasingBudgetOperationDetails__");
                    if (Query.MoveFirst()) {
                        var record = Query.MoveNextRecord();
                        var _loop_2 = function () {
                            var vars = record.GetVars();
                            var budgetID = vars.GetValue_String("BudgetID__", 0);
                            // true if budget is impacted and at least one impact value does'nt equal zero / false if no impact or if the impact consists of all zeros
                            var mustCommitRecord = false;
                            if (budgetID in impactedBudgets) {
                                var budget = impactedBudgets[budgetID];
                                delete impactedBudgets[budgetID];
                                // update impact on budget
                                if (budget.Impact) {
                                    var finalImpact = Lib.Budget.Impact.GetFinalImpact(budget.Impact, budget.PreviousImpact);
                                    Log.Info("Updating budget operation details for [" + budgetID + "] by: " + finalImpact.toString());
                                    GetAdditionalInfo(vars, budget, result); // adds vendorName + vendorNumber + note
                                    finalImpact.ForEachStep(function (step, impact) {
                                        var amount = vars.GetValue_Double(step, 0);
                                        if (impact) {
                                            Log.Info("Operation details before impact: " + amount + " for step [" + step + "]");
                                        }
                                        var value = new Sys.Decimal(amount).add(impact).toNumber();
                                        vars.AddValue_Double(step, value, true);
                                        if (value !== 0) {
                                            mustCommitRecord = true;
                                        }
                                    });
                                }
                            }
                            if (mustCommitRecord) {
                                record.Commit();
                                if (record.GetLastError()) {
                                    reject("Failed to update budget operation details with operationRuidEx: " + ruidEx + " and budgetID: " + budgetID + ". Details: " + record.GetLastErrorMessage());
                                    return { value: void 0 };
                                }
                            }
                            // desimpact budget
                            else {
                                record.Delete();
                                if (record.GetLastError()) {
                                    reject("Failed to delete budget operation details with operationRuidEx: " + ruidEx + " and budgetID: " + budgetID + ". Details: " + record.GetLastErrorMessage());
                                    return { value: void 0 };
                                }
                            }
                            record = Query.MoveNextRecord();
                        };
                        while (record) {
                            var state_2 = _loop_2();
                            if (typeof state_2 === "object")
                                return state_2.value;
                        }
                        var _loop_3 = function (budgetID) {
                            if (Object.prototype.hasOwnProperty.call(impactedBudgets, budgetID)) {
                                var budget_1 = impactedBudgets[budgetID];
                                var newRecord = Process.CreateTableRecord("PurchasingBudgetOperationDetails__");
                                if (newRecord) {
                                    var operationID = Lib.Budget.GetBudgetColumnValue("OperationID__", result.budgets.documentData, null, result.budgets.sourceTypeConfig);
                                    var newVars_1 = newRecord.GetVars();
                                    newVars_1.AddValue_String("OperationRuidex__", ruidEx, true);
                                    newVars_1.AddValue_String("OperationID__", operationID, true);
                                    newVars_1.AddValue_String("SourceType__", result.budgets.sourceTypeConfig.sourceType, true);
                                    newVars_1.AddValue_String("SourceTypeName__", result.budgets.sourceTypeConfig.sourceType, true);
                                    newVars_1.AddValue_String("BudgetID__", budgetID, true);
                                    GetAdditionalInfo(newVars_1, budget_1, result); // adds vendorName + vendorNumber + note
                                    Lib.Budget.Configuration.GetBudgetKeyColumns().forEach(function (budgetColumn) {
                                        newVars_1.AddValue_String(budgetColumn, budget_1[budgetColumn], true);
                                    });
                                    Log.Info("Creating budget operation details for [" + budgetID + "] by new impact: " + budget_1.Impact.toString());
                                    // no need to compute finalImpact because no previous impact on this document
                                    budget_1.Impact.ForEachStep(function (step, impact) {
                                        newVars_1.AddValue_Double(step, impact, true);
                                    });
                                    newRecord.Commit();
                                    if (newRecord.GetLastError()) {
                                        reject("Failed to create budget operation details with operationRuidEx: " + ruidEx + " and budgetID: " + budgetID + ". Details: " + newRecord.GetLastErrorMessage());
                                        return { value: void 0 };
                                    }
                                }
                                else {
                                    reject("Failed to create budget operation details with operationRuidEx: " + ruidEx + " and budgetID: " + budgetID + ". Details: CreateTableRecord returns null.");
                                    return { value: void 0 };
                                }
                            }
                        };
                        // new Impact on budget
                        for (var budgetID in impactedBudgets) {
                            var state_3 = _loop_3(budgetID);
                            if (typeof state_3 === "object")
                                return state_3.value;
                        }
                        resolve();
                    }
                    else {
                        reject("Cannot query budget operation details to update. Details: " + Query.GetLastErrorMessage());
                    }
                });
            }
            return function (budgets, options) {
                // We promise here but everything is synchronous
                Log.Info("Update budget starting...");
                try {
                    options = options || {};
                    var result_1 = {
                        budgets: budgets,
                        impactedBudgets: {},
                        options: Sys.Helpers.Extend(options, budgets.options)
                    };
                    GetImpactedBudgets(result_1);
                    var promises_1 = [];
                    if (!Sys.Helpers.Object.IsEmptyPlainObject(result_1.impactedBudgets)) {
                        if (options.budgetAmountsToUpdate !== false) {
                            var criticalSection = Lib.Budget.GetCriticalSection(result_1.impactedBudgets);
                            var updateDelay = Sys.Helpers.IsDefined(options.updateDelay) ? options.updateDelay : Budget.budgetsUpdateDelay;
                            // Protect concurrent access on impacted budget
                            var lockOk = Process.PreventConcurrentAccess(criticalSection, function () {
                                promises_1.push(_UpdateBudgets(result_1));
                            }, null, updateDelay);
                            if (!lockOk) {
                                throw new PreventConcurrentAccessError();
                            }
                        }
                        promises_1.push(UpdateBudgetOperationDetails(result_1));
                    }
                    return Sys.Helpers.Promise.All(promises_1)
                        .Then(function () { return result_1; })
                        .Catch(function (error) {
                        Log.Error(error.toString());
                        throw error;
                    });
                }
                catch (e) {
                    Log.Error(e.toString());
                    return Sys.Helpers.Promise.Reject(e);
                }
            };
        })();
    })(Budget = Lib.Budget || (Lib.Budget = {}));
})(Lib || (Lib = {}));
