///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Budget_Recovery_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Budget library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_Budget_V12.0.461.0",
    "[Lib_AP_Budget_V12.0.461.0]",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Decimal"
  ]
}*/
var Lib;
(function (Lib) {
    var Budget;
    (function (Budget) {
        /**
         * Set all operation details amount to 0 for the specified RUID
         * @param {string} ruidEX
         * @returns {boolean} critical section array
         */
        function CleanOperationDetails(ruidEx, budgetIds) {
            var ret = true;
            if (!Sys.Helpers.IsEmpty(ruidEx)) {
                Log.Info("OperationDetails : clean operation for ruidEx: " + ruidEx);
                var filter = "(OperationRuidex__=" + ruidEx + ")";
                Query.Reset();
                Query.SetOptionEx("Limit=-1");
                Query.SetSpecificTable("PurchasingBudgetOperationDetails__");
                Query.SetFilter(filter);
                Log.Info("Delete from PurchasingBudgetOperationDetails__ where (OperationRuidex__=" + ruidEx + ")");
                if (Query.MoveFirst()) {
                    var record = Query.MoveNextRecord();
                    while (record) {
                        var vars = record.GetVars();
                        var budgetId = vars.GetValue_String("BudgetID__", 0);
                        if (budgetIds.indexOf(budgetId) == -1) {
                            budgetIds.push(budgetId);
                        }
                        vars.AddValue_Long("ToApprove__", 0, true);
                        vars.AddValue_Long("Comitted__", 0, true);
                        vars.AddValue_Long("Received__", 0, true);
                        vars.AddValue_Long("InvoicedPO__", 0, true);
                        vars.AddValue_Long("InvoicedNonPo__", 0, true);
                        record.Commit();
                        if (record.GetLastError()) {
                            Log.Info("Unable to save Record : " + record.GetLastErrorMessage() + ")");
                            ret = false;
                        }
                        record = Query.MoveNextRecord();
                    }
                }
                else {
                    Log.Info("Error : " + Query.GetLastErrorMessage());
                    ret = false;
                }
            }
            return ret;
        }
        Budget.CleanOperationDetails = CleanOperationDetails;
        function DeleteOperationDetails(ruidEx) {
            var ret = true;
            if (!Sys.Helpers.IsEmpty(ruidEx)) {
                Log.Info("OperationDetails : delete operation for ruidEx: " + ruidEx);
                var filter = "(OperationRuidex__=" + ruidEx + ")";
                Query.Reset();
                Query.SetOptionEx("Limit=-1");
                Query.SetSpecificTable("PurchasingBudgetOperationDetails__");
                Query.SetFilter(filter);
                Log.Info("Delete from PurchasingBudgetOperationDetails__ where (OperationRuidex__=" + ruidEx + ")");
                if (Query.MoveFirst()) {
                    var record = Query.MoveNextRecord();
                    while (record) {
                        record.Delete();
                        record = Query.MoveNextRecord();
                    }
                }
                else {
                    Log.Info("Error : " + Query.GetLastErrorMessage());
                    ret = false;
                }
            }
            return ret;
        }
        Budget.DeleteOperationDetails = DeleteOperationDetails;
        function ComputeBudgetFromOperationDetails(budgetID) {
            var ret = true;
            Log.Info("ComputeBudget : we compute all budgets from operation details for budget " + budgetID);
            var filter = Sys.Helpers.LdapUtil.FilterStrictEqual("BudgetID__", budgetID).toString();
            Log.Info("ComputeBudget : retrieve operation details and compute budget");
            Query.Reset();
            Query.SetOptionEx("Limit=-1");
            Query.SetSpecificTable("PurchasingBudgetOperationDetails__");
            Query.SetFilter(filter);
            // sort in order to ignore PR if PO has been already taken into account and to ignore PO if invoice...
            Query.SetSortOrder("SourceType__ DESC");
            var budget = {};
            Lib.Budget.Steps.forEach(function (attrName) {
                budget[attrName] = 0;
            });
            if (Query.MoveFirst()) {
                var record = Query.MoveNextRecord();
                var _loop_1 = function () {
                    var vars = record.GetVars();
                    Lib.Budget.Steps.forEach(function (attrName) {
                        budget[attrName] = new Sys.Decimal(budget[attrName]).add(vars.GetValue_Double(attrName, 0)).toNumber();
                    });
                    record = Query.MoveNextRecord();
                };
                while (record) {
                    _loop_1();
                }
            }
            else {
                ret = false;
            }
            Log.Info("ComputeBudget : save computed budget");
            //Save the correct value in the budget table
            Query.Reset();
            Query.SetSpecificTable("PurchasingBudget__");
            Query.SetFilter(filter);
            if (Query.MoveFirst()) {
                var record = Query.MoveNextRecord();
                var _loop_2 = function () {
                    var vars = record.GetVars();
                    Lib.Budget.Steps.forEach(function (attrName) {
                        vars.AddValue_Double(attrName, budget[attrName], true);
                    });
                    record.Commit();
                    if (record.GetLastError()) {
                        ret = false;
                    }
                    record = Query.MoveNextRecord();
                };
                while (record) {
                    _loop_2();
                }
            }
            return ret;
        }
        Budget.ComputeBudgetFromOperationDetails = ComputeBudgetFromOperationDetails;
        /**
         * Specific method allowing to recreate operation details for VIP.
         * @param ruidEx identifies the invoice to recover
         */
        function RecreateOperationDetails(ruidEx) {
            var ret = false;
            Log.Info("RecoveryBudget : recover for ruidEx: " + ruidEx);
            Query.Reset();
            Query.SetAttributesList("*,Datafile");
            //each item is unique base on its reference and its vendor
            Query.SetFilter("(RUIDEX=" + ruidEx + ")");
            if (Query.MoveFirst()) {
                var xTransport = Query.MoveNext();
                if (xTransport) {
                    ret = Lib.AP.Budget.AsInvoiced(xTransport);
                }
            }
            return ret;
        }
        Budget.RecreateOperationDetails = RecreateOperationDetails;
    })(Budget = Lib.Budget || (Lib.Budget = {}));
})(Lib || (Lib = {}));
