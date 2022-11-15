/* LIB_DEFINITION{
  "name": "Lib_AP_Budget_FullRecovery_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_AP_Budget_V12.0.461.0",
    "Lib_Budget_FullRecovery_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_Data"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Budget;
        (function (Budget) {
            function DoFullRecovery() {
                Log.Info("Doing a full budget recovery...");
                UpdatePreviousBudgetIDInLineItems()
                    .Then(Lib.Budget.RecreateDocumentOperationDetails)
                    .Then(function (budgets) { return budgets && UpdateBudgetIDInLineItems(budgets); })
                    .Then(Lib.Budget.FinalizeFullRecovery)
                    .Catch(Lib.Budget.HandleErrorsOnFullRecovery);
            }
            Budget.DoFullRecovery = DoFullRecovery;
            ////////////
            function UpdatePreviousBudgetIDInLineItems() {
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () {
                    Log.Info("Updating previous budget ID in the invoice line items...");
                    var previousBudgetIDByItems = Lib.AP.Budget.GetPreviousBudgetIDByItems(Data);
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                        var budgetID = previousBudgetIDByItems[i];
                        if (Sys.Helpers.IsDefined(budgetID)) {
                            item.SetValue("PreviousBudgetID__", budgetID);
                            item.SetValue("BudgetID__", budgetID);
                        }
                    });
                });
            }
            function UpdateBudgetIDInLineItems(budgets) {
                Log.Info("Updating budget in the VIP line items...");
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                    var budgetID = budgets.byItemIndex[i];
                    if (Sys.Helpers.IsString(budgetID)) {
                        item.SetValue("BudgetID__", budgetID);
                    }
                });
            }
        })(Budget = AP.Budget || (AP.Budget = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
