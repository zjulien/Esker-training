///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_POBudget_FullRecovery_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_Purchasing_POBudget_V12.0.461.0",
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
        var POBudget;
        (function (POBudget) {
            function DoFullRecovery() {
                Log.Info("Doing a full budget recovery...");
                UpdatePRBudgetIDInLineItems()
                    .Then(Lib.Budget.RecreateDocumentOperationDetails)
                    .Then(function (budgets) { return budgets && UpdateBudgetIDInLineItems(budgets); })
                    .Then(UpdateBudgetIDInPOItems)
                    .Then(UpdateBudgetIDInAPPOItems)
                    .Then(Lib.Budget.FinalizeFullRecovery)
                    .Catch(Lib.Budget.HandleErrorsOnFullRecovery);
            }
            POBudget.DoFullRecovery = DoFullRecovery;
            ////////////
            function UpdatePRBudgetIDInLineItems() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Updating PR budget ID in the PO line items...");
                    var PRBudgetIDByItems = Lib.Purchasing.POBudget.GetPRBudgetIDByItems(Data);
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                        var budgetID = PRBudgetIDByItems[i];
                        if (Sys.Helpers.IsDefined(budgetID)) {
                            item.SetValue("RequestedBudgetID__", budgetID);
                            item.SetValue("BudgetID__", budgetID);
                        }
                    });
                    resolve();
                });
            }
            function UpdateBudgetIDInLineItems(budgets) {
                Log.Info("Updating budget in the PO line items...");
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                    var budgetID = budgets.byItemIndex[i];
                    if (Sys.Helpers.IsString(budgetID)) {
                        item.SetValue("BudgetID__", budgetID);
                    }
                });
            }
            function UpdateBudgetIDInPOItems() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Updating budget in the table PO items...");
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.AddAttribute("*");
                    query.SetSpecificTable(Lib.Purchasing.Items.POItemsDBInfo.table);
                    var filter = "(PONumber__=".concat(Data.GetValue("OrderNumber__"), ")");
                    query.SetFilter(filter);
                    Log.Info("Selecting PO items with filter: " + filter);
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
                            Log.Error("Cannot select PO items.");
                            throw new Error("Cannot select PO items. Details:\n" + query.GetLastErrorMessage());
                        }
                    }
                    else {
                        Log.Error("Cannot select PO items.");
                        throw new Error("Cannot select PO items. Details:\n" + query.GetLastErrorMessage());
                    }
                    resolve();
                });
            }
            function UpdateBudgetIDInAPPOItems() {
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () {
                    var tableName = "AP - Purchase order - Items__";
                    if (Sys.Helpers.IsEmpty(Process.GetProcessID(tableName))) { // table doesn't exist
                        return;
                    }
                    Log.Info("Updating budget in the table AP - Purchase order - Items...");
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.AddAttribute("*");
                    query.SetSpecificTable(tableName);
                    var filter = "(OrderNumber__=".concat(Data.GetValue("OrderNumber__"), ")").AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    query.SetFilter(filter);
                    Log.Info("Selecting PO items with filter: " + filter);
                    if (query.MoveFirst()) {
                        var record = query.MoveNextRecord();
                        while (record) {
                            var vars = record.GetVars();
                            var lineNumber = vars.GetValue_String("ItemNumber__", 0);
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
                            Log.Error("Cannot select AP - PO items.");
                            throw new Error("Cannot select AP - PO items. Details:\n" + query.GetLastErrorMessage());
                        }
                    }
                    else {
                        Log.Error("Cannot select AP - PO items.");
                        throw new Error("Cannot select AP - PO items. Details:\n" + query.GetLastErrorMessage());
                    }
                });
            }
        })(POBudget = Purchasing.POBudget || (Purchasing.POBudget = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
