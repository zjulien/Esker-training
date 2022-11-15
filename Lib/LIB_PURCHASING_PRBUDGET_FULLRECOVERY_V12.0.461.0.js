///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_PRBudget_FullRecovery_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_Purchasing_PRBudget_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Budget_FullRecovery_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_Data"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var PRBudget;
        (function (PRBudget) {
            function DoFullRecovery() {
                Log.Info("Doing a full budget recovery...");
                Lib.Budget
                    .RecreateDocumentOperationDetails()
                    .Then(function (budgets) { return budgets && UpdateBudgetIDInLineItems(budgets); })
                    .Then(UpdateBudgetIDInPRItems)
                    .Then(Lib.Budget.FinalizeFullRecovery)
                    .Catch(Lib.Budget.HandleErrorsOnFullRecovery);
            }
            PRBudget.DoFullRecovery = DoFullRecovery;
            ////////////
            function UpdateBudgetIDInLineItems(budgets) {
                Log.Info("Updating budget in the PR line items...");
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                    var budgetID = budgets.byItemIndex[i];
                    if (Sys.Helpers.IsString(budgetID)) {
                        item.SetValue("BudgetID__", budgetID);
                    }
                });
            }
            function UpdateBudgetIDInPRItems() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Updating budget in the table PR items...");
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.AddAttribute("*");
                    query.SetSpecificTable(Lib.Purchasing.Items.PRItemsDBInfo.table);
                    var filter = "(PRNumber__=".concat(Data.GetValue("RequisitionNumber__"), ")");
                    query.SetFilter(filter);
                    Log.Info("Selecting PR items with filter: " + filter);
                    if (query.MoveFirst()) {
                        var record = query.MoveNextRecord();
                        while (record) {
                            var vars = record.GetVars();
                            var lineNumber = vars.GetValue_String("LineNumber__", 0);
                            var lineItems = Data.GetTable("LineItems__");
                            for (var i = 0; i < lineItems.GetItemCount(); i++) {
                                var lineItem = lineItems.GetItem(i);
                                var lineItemNumber = lineItem.GetValue("LineItemNumber__");
                                if (lineNumber == lineItemNumber) {
                                    vars.AddValue_String("BudgetID__", lineItem.GetValue("BudgetID__"), true);
                                    record.Commit();
                                    if (record.GetLastError()) {
                                        Log.Error("Unable to save record");
                                        throw new Error("Unable to save record. Details:\n" + record.GetLastErrorMessage());
                                    }
                                    break;
                                }
                            }
                            record = query.MoveNextRecord();
                        }
                        if (!record && query.GetLastError()) {
                            Log.Error("Cannot select PR items.");
                            throw new Error("Cannot select PR items. Details:\n" + query.GetLastErrorMessage());
                        }
                    }
                    else {
                        Log.Error("Cannot select PR items.");
                        throw new Error("Cannot select PR items. Details:\n" + query.GetLastErrorMessage());
                    }
                    resolve();
                });
            }
        })(PRBudget = Purchasing.PRBudget || (Purchasing.PRBudget = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
