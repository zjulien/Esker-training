///#GLOBALS Lib Sys
/// <reference path="../../PAC/Purchasing V2/Purchase Order process V2/typings_withDeleted/Controls_Purchase_Order_process_V2/index.d.ts"/>
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_EditPORequest_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing library to manage items in Edit PO Request process",
  "require": []
}*/
// Client interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var EditPORequest;
        (function (EditPORequest) {
            EditPORequest.defaultEditPORequestoPaneMapping = {
                "SubmitDateTime__": "SubmitDateTime",
                "Buyer__": "BuyerName__",
                "EditPORequestNumber__": "EPORNumber__"
            };
            function InitRelatedEditPORequestPanel(editPORequestTable, editPORequestPane, fromPO, mapping) {
                if (fromPO === void 0) { fromPO = false; }
                if (mapping === void 0) { mapping = EditPORequest.defaultEditPORequestoPaneMapping; }
                editPORequestPane.Hide(true);
                editPORequestTable.SetWidth("100%");
                var editPORequestItems;
                /** @this ShortText & IControlInTable<Purchase_Order_process_V2RelatedEditPORequestTableTableRow> */
                var OnClickEditPORequestLine = function () {
                    Process.OpenLink({
                        url: editPORequestItems[this.GetRow().GetLineNumber(true) - 1].ValidationURL + "&OnQuit=Back",
                        inCurrentTab: true
                    });
                };
                editPORequestTable.EditPORequestNumber__.OnClick = OnClickEditPORequestLine;
                editPORequestTable.Status__.OnClick = OnClickEditPORequestLine;
                editPORequestTable.OnRefreshRow = function (index) {
                    RefreshRow(editPORequestTable.GetRow(index));
                };
                var OrderNumber = Data.GetValue("OrderNumber__");
                var editPORequestQueryOptions = {
                    table: "CDNAME#EditPORequest",
                    filter: "(OrderNumber__=" + OrderNumber + ")",
                    attributes: ["EPORNumber__", "BuyerName__", "Status__", "SubmitDateTime", "ValidationURL"],
                    sortOrder: "SubmitDateTime DESC",
                    maxRecords: null,
                    additionalOptions: {
                        bigQuery: true
                    }
                };
                if (fromPO) {
                    editPORequestQueryOptions.filter = "&" + editPORequestQueryOptions.filter + "(!(Status__=Draft))";
                }
                return Sys.GenericAPI.PromisedQuery(editPORequestQueryOptions)
                    .Then(function (queryResults) {
                    editPORequestItems = queryResults;
                    if (queryResults.length > 0) {
                        Sys.Helpers.SilentChange(function () {
                            if (!fromPO) {
                                editPORequestPane.Hide(false);
                            }
                            editPORequestTable.SetItemCount(queryResults.length);
                            queryResults.forEach(function (editPO, index) {
                                var newItem = editPORequestTable.GetItem(index);
                                Sys.Helpers.Object.ForEach(mapping, function (val, key) { return newItem.SetValue(key, editPO[val]); });
                                newItem.SetValue("Status__", Language.Translate("_EditPORequestStatus_" + editPO.Status__));
                            });
                            Sys.Helpers.Controls.ForEachTableRow(editPORequestTable, function (row) {
                                RefreshRow(row);
                            });
                        });
                    }
                    return queryResults.length;
                });
            }
            EditPORequest.InitRelatedEditPORequestPanel = InitRelatedEditPORequestPanel;
            function RefreshRow(row) {
                row.EditPORequestNumber__.DisplayAs({ type: "Link" });
                row.Status__.DisplayAs({ type: "Link" });
            }
        })(EditPORequest = Purchasing.EditPORequest || (Purchasing.EditPORequest = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
