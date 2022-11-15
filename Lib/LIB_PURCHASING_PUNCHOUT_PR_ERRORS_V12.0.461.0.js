///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Punchout_PR_Errors_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Display punchout items in error",
  "require": []
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Punchout;
        (function (Punchout) {
            var Errors;
            (function (Errors) {
                ;
                var PunchoutErrors = /** @class */ (function () {
                    function PunchoutErrors() {
                    }
                    /**
                    * Creates the table that will contains all the errors
                    * @param {Dialog} dialog The Dialog object in which the table will be displayed
                    * @param {string} tableName The expected name of the table to create
                    * @return {IControlTable} The created table
                    */
                    PunchoutErrors.CreateResultTable = function (dialog, tableName) {
                        var table = dialog.AddTable(tableName);
                        table.AddTextColumn("ItemDescription", "_ItemDescription", 300);
                        var itemError = table.AddMultiLineColumn("ItemError", "_Error", 600);
                        itemError.SetOptions({ minNumberOfLines: 1, maxNumberOfLines: 2 });
                        table.SetReadOnly(true);
                        table.SetRowToolsHidden(true);
                        return table;
                    };
                    /**
                    * Fills a line item from an item in error
                    * @param item The line item to fill
                    * @param punchoutItem the item
                    */
                    PunchoutErrors.FillResultItem = function (item, punchoutItem) {
                        item.SetValue("ItemDescription", punchoutItem.item.description);
                        item.SetValue("ItemError", punchoutItem.error);
                    };
                    /**
                    * This function fills the popup
                    * @param {Dialog} dialog The Dialog object to fill
                    */
                    PunchoutErrors.FillAlertDialog = function (dialog) {
                        var label1 = dialog.AddTitle("label1", "");
                        label1.SetText(Language.Translate("_Some items involve unsupported conversions and cannot be added to the purchase requisition"));
                        dialog.SetHelpId(5067);
                        var table = PunchoutErrors.CreateResultTable(dialog, "errorsTable");
                        table.SetItemCount(PunchoutErrors.Result.length);
                        for (var i = 0; i < PunchoutErrors.Result.length; i++) {
                            PunchoutErrors.FillResultItem(table.GetItem(i), PunchoutErrors.Result[i]);
                        }
                    };
                    PunchoutErrors.Popup = function (errors) {
                        PunchoutErrors.Result = errors;
                        Popup.Dialog("_Items requiring conversions cannot be added to the purchase requisition", null, PunchoutErrors.FillAlertDialog, null, null, null, null);
                    };
                    PunchoutErrors.Result = null;
                    return PunchoutErrors;
                }());
                ;
                function PopupPunchoutErrors(errors) {
                    PunchoutErrors.Popup(errors);
                }
                Errors.PopupPunchoutErrors = PopupPunchoutErrors;
            })(Errors = Punchout.Errors || (Punchout.Errors = {}));
        })(Punchout = Purchasing.Punchout || (Purchasing.Punchout = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
