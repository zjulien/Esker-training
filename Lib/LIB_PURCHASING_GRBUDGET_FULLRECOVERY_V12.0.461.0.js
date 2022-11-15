///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_GRBudget_FullRecovery_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_Purchasing_GRBudget_V12.0.461.0",
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
        var GRBudget;
        (function (GRBudget) {
            function DoFullRecovery() {
                Log.Info("Doing a full budget recovery...");
                UpdatePOBudgetIDInLineItems()
                    .Then(Lib.Budget.RecreateDocumentOperationDetails)
                    .Then(function (budgets) { return budgets && UpdateBudgetIDInLineItems(budgets); })
                    .Then(UpdateBudgetIDInGRItems)
                    .Then(Lib.Budget.FinalizeFullRecovery)
                    .Catch(Lib.Budget.HandleErrorsOnFullRecovery);
            }
            GRBudget.DoFullRecovery = DoFullRecovery;
            ////////////
            function UpdatePOBudgetIDInLineItems() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Updating PO budget ID in the GR line items...");
                    var POBudgetIDByItems = Lib.Purchasing.GRBudget.GetPOBudgetIDByItems(Data);
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                        var budgetID = POBudgetIDByItems[i];
                        if (Sys.Helpers.IsDefined(budgetID)) {
                            item.SetValue("POBudgetID__", budgetID);
                            item.SetValue("BudgetID__", budgetID);
                        }
                    });
                    resolve();
                });
            }
            function UpdateBudgetIDInLineItems(budgets) {
                Log.Info("Updating budget in the GR line items...");
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                    var budgetID = budgets.byItemIndex[i];
                    if (Sys.Helpers.IsString(budgetID)) {
                        item.SetValue("BudgetID__", budgetID);
                    }
                });
            }
            function UpdateBudgetIDInGRItems() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Updating budget in the table GR items...");
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.AddAttribute("*");
                    query.SetSpecificTable(Lib.Purchasing.Items.GRItemsDBInfo.table);
                    var filter = "(GRNumber__=".concat(Data.GetValue("GRNumber__"), ")");
                    query.SetFilter(filter);
                    Log.Info("Selecting GR items with filter: " + filter);
                    if (query.MoveFirst()) {
                        var record = query.MoveNextRecord();
                        while (record) {
                            var vars = record.GetVars();
                            var PONumber = vars.GetValue_String("OrderNumber__", 0);
                            var lineNumber = vars.GetValue_String("LineNumber__", 0);
                            var lineItems = Data.GetTable("LineItems__");
                            for (var i = 0; i < lineItems.GetItemCount(); i++) {
                                var lineItem = lineItems.GetItem(i);
                                var lineItemPONumber = lineItem.GetValue("OrderNumber__");
                                var lineItemNumber = lineItem.GetValue("LineNumber__");
                                if (PONumber == lineItemPONumber && lineNumber == lineItemNumber) {
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
                            Log.Error("Cannot select GR items.");
                            throw new Error("Cannot select GR items. Details:\n" + query.GetLastErrorMessage());
                        }
                    }
                    else {
                        Log.Error("Cannot select GR items.");
                        throw new Error("Cannot select GR items. Details:\n" + query.GetLastErrorMessage());
                    }
                    resolve();
                });
            }
        })(GRBudget = Purchasing.GRBudget || (Purchasing.GRBudget = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
