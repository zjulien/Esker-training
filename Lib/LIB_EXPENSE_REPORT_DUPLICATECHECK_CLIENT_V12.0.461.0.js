///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Report_DuplicateCheck_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Expense Report Duplicate Check client library",
  "require": [
    "Sys/Sys_GenericAPI_Client",
    "Lib_Expense_Report_DuplicateCheck_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Report;
        (function (Report) {
            var DuplicateCheck;
            (function (DuplicateCheck) {
                var DuplicateDetailsDialog = {
                    ExpenseNumber: null,
                    Result: null,
                    OnAccept: null,
                    ViewLinkDisplayed: true,
                    CreatorDisplayed: false,
                    RequesterDisplayed: false,
                    /**
                    * Creates the table that will contains all the duplicate expenses
                    * @param {Dialog} dialog The Dialog object in which the table will be displayed
                    * @param {string} tableName The expected name of the table to create
                    * @return {IControlTable} The created table
                    */
                    CreateResultTable: function (dialog, tableName) {
                        var table = dialog.AddTable(tableName);
                        table.AddTextColumn("ExpenseNumber", "_ExpenseNumber", 100);
                        table.AddTextColumn("ExpenseType", "_ExpenseType", 160);
                        table.AddDateColumn("ExpenseDate", "_Date", 80);
                        table.AddDecimalColumn("ExpenseAmount", "_TotalAmount", 90);
                        table.AddTextColumn("ExpenseCurrency", "_TotalAmountCurrency", 60);
                        if (DuplicateDetailsDialog.RequesterDisplayed) {
                            table.AddTextColumn("ExpenseOwner", "_OwnerName", 160);
                        }
                        if (DuplicateDetailsDialog.CreatorDisplayed) {
                            table.AddTextColumn("ExpenseCreator", "_Created by", 160);
                        }
                        if (DuplicateDetailsDialog.ViewLinkDisplayed !== false) {
                            var link = table.AddLinkColumn("View", " ", 50);
                            link.SetText("_View");
                            link.SetURL("");
                        }
                        table.SetReadOnly(true);
                        table.SetRowToolsHidden(true);
                        return table;
                    },
                    /**
                    * Fills a line item from a duplicate expense
                    * @param {Item} item The line item to fill
                    * @param {any} duplicate A duplicate expense which contains the requested informations
                    */
                    FillResultItem: function (item, duplicate) {
                        item.SetValue("ExpenseNumber", duplicate.ExpenseNumber__);
                        item.SetValue("ExpenseType", duplicate.ExpenseType__);
                        item.SetValue("ExpenseDate", duplicate.Date__);
                        item.SetValue("ExpenseAmount", duplicate.TotalAmount__);
                        item.SetValue("ExpenseCurrency", duplicate.TotalAmountCurrency__);
                        if (DuplicateDetailsDialog.RequesterDisplayed) {
                            item.SetValue("ExpenseOwner", duplicate.OwnerName__);
                        }
                        if (DuplicateDetailsDialog.CreatorDisplayed) {
                            item.SetValue("ExpenseCreator", duplicate.CreatorDisplayName);
                        }
                    },
                    /**
                    * This function fills the duplicate check popup
                    * @param {Dialog} dialog The Dialog object to fill
                    */
                    FillAlertDuplicateDialog: function (dialog) {
                        var duplicateWarning = dialog.AddTitle("duplicateLabel1", "");
                        duplicateWarning.SetText(Language.Translate("_Expense {0} may be a duplicate of the following expenses", false, DuplicateDetailsDialog.ExpenseNumber));
                        var table = DuplicateDetailsDialog.CreateResultTable(dialog, "duplicateTable");
                        table.SetItemCount(DuplicateDetailsDialog.Result.length);
                        for (var i = 0; i < DuplicateDetailsDialog.Result.length; i++) {
                            DuplicateDetailsDialog.FillResultItem(table.GetItem(i), DuplicateDetailsDialog.Result[i]);
                        }
                        if (DuplicateDetailsDialog.OnAccept) {
                            dialog.AddDescription("confirmMessage").SetText("_Please confirm your expense");
                        }
                    },
                    /**
                    * This function handles all events from the popup
                    * @param {Dialog} dialog The Dialog from which event are raised
                    * @param {string} tabId The index of the tab from which event are raised
                    * @param {string} event The event name raised
                    * @param {IControl} control The control which raised the event
                    */
                    HandleAlertDuplicateDialog: function (dialog, tabId, event, control) {
                        if (control.GetType() === "Link" && event === "OnClick") {
                            var lineNumber = control.GetRow().GetLineNumber() - 1;
                            if (lineNumber < DuplicateDetailsDialog.Result.length) {
                                control.SetURL(DuplicateDetailsDialog.Result[lineNumber].ValidationURL + "&ReadOnly=1&OnQuit=Close");
                            }
                        }
                    },
                    Popup: function (expenseNumber, duplicates, onAccept, options) {
                        if (options === void 0) { options = {}; }
                        this.ExpenseNumber = expenseNumber;
                        this.Result = duplicates;
                        this.OnAccept = onAccept;
                        this.ViewLinkDisplayed = options.viewLinkDisplayed !== false;
                        this.CreatorDisplayed = options.creatorDisplayed === true;
                        this.RequesterDisplayed = options.requesterDisplayed === true;
                        Popup.Dialog("_Duplicate detected", null, this.FillAlertDuplicateDialog, onAccept, null, this.HandleAlertDuplicateDialog, null);
                    }
                };
                function PopupDuplicate(expenseNumber, duplicates, onAccept, options) {
                    if (options === void 0) { options = {}; }
                    DuplicateDetailsDialog.Popup(expenseNumber, duplicates, onAccept, options);
                }
                DuplicateCheck.PopupDuplicate = PopupDuplicate;
                function CheckDuplicate() {
                    return Sys.Helpers.Promise.Create(function (resolve, reject) {
                        var expensesPromises = [];
                        Sys.Helpers.Controls.ForEachTableRow(Controls.ExpensesTable__, function (row) {
                            expensesPromises.push(DuplicateCheck.QueryDuplicate(row));
                        });
                        Sys.Helpers.Promise.All(expensesPromises)
                            .Then(function (results) {
                            var duplicate = [];
                            results.forEach(function (result, i) {
                                if (result.length > 0) {
                                    duplicate.push(Controls.ExpensesTable__.GetRow(i));
                                }
                            });
                            resolve(duplicate);
                        })
                            .Catch(function (error) {
                            Log.Error("An error occurred while checking expense duplicate: ".concat(error));
                            reject(error);
                        });
                    });
                }
                DuplicateCheck.CheckDuplicate = CheckDuplicate;
                var previousQueryToAdd = Sys.Helpers.Promise.Resolve(), expenseNumberToAdd = [];
                function CheckDuplicateBeforeAdd(expense, onEnd) {
                    var expenseNumber = expense.GetValue("ExpenseNumber__");
                    if (expenseNumberToAdd.indexOf(expenseNumber) !== -1) {
                        return;
                    }
                    expenseNumberToAdd.push(expenseNumber);
                    previousQueryToAdd = previousQueryToAdd.Finally(function () {
                        return DuplicateCheck.QueryDuplicate(expense)
                            .Then(function (results) {
                            if (results.length > 0) {
                                PopupDuplicate(expenseNumber, results, function () {
                                    if (onEnd) {
                                        onEnd(true);
                                    }
                                });
                            }
                            else if (onEnd) {
                                onEnd(false);
                            }
                        })
                            .Catch(function (error) {
                            Log.Error("An error occurred while checking duplicate for expense ".concat(expenseNumber, ": ").concat(error));
                            if (onEnd) {
                                onEnd(error);
                            }
                        })
                            .Finally(function () {
                            var index = expenseNumberToAdd.indexOf(expenseNumber);
                            if (index !== -1) {
                                expenseNumberToAdd.splice(index, 1);
                            }
                        });
                    });
                }
                DuplicateCheck.CheckDuplicateBeforeAdd = CheckDuplicateBeforeAdd;
                function DisplayDuplicateIndicator(row, duplicate) {
                    if (!row.ExpenseMSNEX__) {
                        // row is Item of the ExpensesTable__ or Expense object got from DBQuery
                        var expMSNEX_1 = row.AddItem ? row.GetValue("ExpenseMSNEX__") : row.GetValue("MSNEX");
                        row = Sys.Helpers.Controls.FindTableRow(Controls.ExpensesTable__, function (r) { return r.ExpenseMSNEX__.GetValue() === expMSNEX_1; });
                    }
                    if (row) {
                        row.Duplicate__.SetIconURL(duplicate ? "Exp_duplicate_indicator.png" : "");
                        row.Duplicate__.SetDisabled(!duplicate);
                    }
                }
                DuplicateCheck.DisplayDuplicateIndicator = DisplayDuplicateIndicator;
                function ResetDuplicateIndicators() {
                    Sys.Helpers.Controls.ForEachTableRow(Controls.ExpensesTable__, function (row) {
                        DisplayDuplicateIndicator(row, false);
                    });
                }
                DuplicateCheck.ResetDuplicateIndicators = ResetDuplicateIndicators;
                function DisplayDuplicateIndicators(rows) {
                    rows.forEach(function (row) {
                        DisplayDuplicateIndicator(row, true);
                    });
                }
                DuplicateCheck.DisplayDuplicateIndicators = DisplayDuplicateIndicators;
                function UpdateBanner(topMessageWarning, duplicate) {
                    if (duplicate === true) {
                        topMessageWarning.Add(Language.Translate("_Banner duplicate detected", true));
                    }
                    else if (duplicate === false) {
                        topMessageWarning.Remove(Language.Translate("_Banner duplicate detected", true));
                    }
                }
                function UpdateDuplicateWarning(topMessageWarning, duplicate) {
                    if (duplicate === true || duplicate === false) {
                        UpdateBanner(topMessageWarning, duplicate);
                    }
                    else {
                        DuplicateCheck.IsDuplicateDetected().Then(function (d) { UpdateBanner(topMessageWarning, d); });
                    }
                }
                DuplicateCheck.UpdateDuplicateWarning = UpdateDuplicateWarning;
            })(DuplicateCheck = Report.DuplicateCheck || (Report.DuplicateCheck = {}));
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
