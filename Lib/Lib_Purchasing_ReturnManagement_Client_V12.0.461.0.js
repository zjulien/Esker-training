///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ReturnManagement_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Client side lib for Return Management",
  "require": [
    "Lib_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ReturnManagement;
        (function (ReturnManagement) {
            ReturnManagement.defaultROToPaneMapping = {
                "RONumber__": "RONumber__",
                "ROReturnDate__": "ReturnDate__",
                "RequesterName__": "RequesterName__"
            };
            //#region Items
            ReturnManagement.Items = {
                GRNumber: {
                    SetLink: function (row) {
                        row.GoodsReceiptNumber__.DisplayAs({ type: "Link" });
                    },
                    OnClick: function () {
                        Controls.LineItems__.GoodsReceiptNumber__.Wait(true);
                        var options = {
                            table: "CDNAME#Goods receipt V2",
                            filter: "GRNumber__=" + this.GetValue(),
                            attributes: ["MsnEx", "ValidationURL"],
                            sortOrder: null,
                            maxRecords: 1
                        };
                        return Sys.GenericAPI.PromisedQuery(options)
                            .Then(function (queryResult) {
                            if (queryResult.length == 1) {
                                Process.OpenLink(queryResult[0].ValidationURL + "&OnQuit=Close");
                            }
                            else {
                                Popup.Alert("_Goods receipt not found or access denied", false, null, "_Goods receipt not found title");
                            }
                        })
                            .Catch(function ( /*error: string*/) {
                            Popup.Alert("_Goods receipt not found or access denied", false, null, "_Goods receipt not found title");
                        })
                            .Finally(function () {
                            Controls.LineItems__.GoodsReceiptNumber__.Wait(false);
                        });
                    }
                }
            };
            //#endregion
            function InitRelatedROPane(ROTable, ROPane, fromPO, mapping) {
                if (fromPO === void 0) { fromPO = false; }
                if (mapping === void 0) { mapping = ReturnManagement.defaultROToPaneMapping; }
                ROPane.Hide(true);
                var orderNumberField = fromPO ? "OrderNumber__" : "Sales_Order_Number__";
                //return order links
                var items;
                var onClickROLine = function () {
                    if (fromPO) {
                        Process.OpenLink(items[this.GetRow().GetLineNumber(true) - 1].ValidationUrl + "&OnQuit=Close");
                    }
                    else {
                        Process.OpenLink({ url: items[this.GetRow().GetLineNumber(true) - 1].ValidationUrl + "&OnQuit=Back", inCurrentTab: true });
                    }
                };
                ROTable.RONumber__.OnClick = onClickROLine;
                ROTable.OnRefreshRow = function (index) {
                    RefreshRow(ROTable.GetRow(index));
                };
                //Fill return order pane with related return orders
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var table = fromPO ? "CDNAME#Return Order" : "CDNAME#Return Order Vendor";
                    var ROQueryOptions = {
                        table: table,
                        filter: "(OrderNumber__=" + Data.GetValue(orderNumberField) + ")",
                        attributes: ["RONumber__", "RequesterName__", "ReturnDate__", "ValidationUrl"],
                        maxRecords: 100
                    };
                    Sys.GenericAPI.PromisedQuery(ROQueryOptions)
                        .Then(function (queryResults) {
                        if (queryResults.length > 0) {
                            //update RO list
                            Sys.Helpers.SilentChange(function () {
                                ROTable.SetItemCount(queryResults.length);
                                queryResults.forEach(function (returnOrder, index) {
                                    var newItem = ROTable.GetItem(index);
                                    Sys.Helpers.Object.ForEach(mapping, function (val, key) { return newItem.SetValue(key, returnOrder[val]); });
                                });
                            });
                            //update links
                            Sys.Helpers.Controls.ForEachTableRow(ROTable, function (row) {
                                RefreshRow(row);
                            });
                        }
                        items = queryResults;
                        resolve(queryResults.length);
                    })
                        .Catch(reject);
                });
            }
            ReturnManagement.InitRelatedROPane = InitRelatedROPane;
            function RefreshRow(row) {
                row.RONumber__.DisplayAs({ type: "Link" });
            }
            ReturnManagement.RefreshRow = RefreshRow;
        })(ReturnManagement = Purchasing.ReturnManagement || (Purchasing.ReturnManagement = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
