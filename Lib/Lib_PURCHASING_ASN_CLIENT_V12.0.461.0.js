///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ASN_client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Sys/Sys_GenericAPI_Client",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_Controls",
    "Sys/Sys_Helpers_Array"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ASN;
        (function (ASN) {
            /**
             * @exports Punchout
             * @memberof Lib.Purchasing
             */
            ASN.defaultASNToPaneMapping = {
                "ASNNumber__": "ASNNumber__",
                "ASNShippingDate__": "ShippingDate__",
                "ASNExpectedDeliveryDate__": "ExpectedDeliveryDate__",
                "ASNCarrier__": "Carrier__"
            };
            function InitRelatedASNPane(ASNTable, ASNPane, fromPO, mapping) {
                if (fromPO === void 0) { fromPO = false; }
                if (mapping === void 0) { mapping = ASN.defaultASNToPaneMapping; }
                ASNPane.Hide(true);
                ASNTable.SetWidth("100%");
                var items;
                // called from CO if !fromPO -> should search in Vendor ASN
                var table = fromPO ? "CDLNAME#Advanced Shipping Notice.LineItems__" : "CDLNAME#Advanced Shipping Notice Vendor.LineItems__";
                var onClickASNLine = function () {
                    if (fromPO) {
                        Process.OpenLink(items[this.GetRow().GetLineNumber(true) - 1].ValidationURL + "&OnQuit=Close");
                    }
                    else {
                        Process.OpenLink({
                            url: items[this.GetRow().GetLineNumber(true) - 1].ValidationURL + "&OnQuit=Back",
                            inCurrentTab: true
                        });
                    }
                };
                ASNTable.ASNNumber__.OnClick = onClickASNLine;
                ASNTable.ASNStatus__.OnClick = onClickASNLine;
                ASNTable.OnRefreshRow = function (index) {
                    refreshRow(ASNTable.GetRow(index));
                };
                var ASNQueryOptions = {
                    table: table,
                    filter: "(Line_ItemPONumber__=" + Data.GetValue("OrderNumber__") + ")",
                    attributes: ["ASNNumber__", "ShippingDate__", "ExpectedDeliveryDate__", "Status__", "Carrier__", "ValidationURL", "SourceMSNEX"],
                    maxRecords: null,
                    additionalOptions: {
                        bigQuery: {
                            uniqueKeyName: "SourceMSNEX"
                        }
                    }
                };
                if (fromPO) {
                    ASNQueryOptions.filter = "&" + ASNQueryOptions.filter + "(!(Status__=Draft))";
                }
                return Sys.GenericAPI.PromisedQuery(ASNQueryOptions)
                    .Then(function (queryResults) {
                    if (queryResults.length > 0) {
                        queryResults = Sys.Helpers.Array.GetDistinctArray(queryResults, function (asn) { return asn.SourceMSNEX; });
                        Sys.Helpers.SilentChange(function () {
                            ASNPane.Hide(false);
                            ASNTable.SetItemCount(queryResults.length);
                            queryResults.forEach(function (asn, index) {
                                var newItem = ASNTable.GetItem(index);
                                Sys.Helpers.Object.ForEach(mapping, function (val, key) { return newItem.SetValue(key, asn[val]); });
                                newItem.SetValue("ASNStatus__", Language.Translate("_ASN " + asn.Status__));
                            });
                            Sys.Helpers.Controls.ForEachTableRow(ASNTable, function (row) {
                                refreshRow(row);
                            });
                        });
                    }
                    items = queryResults;
                    return queryResults.length;
                });
            }
            ASN.InitRelatedASNPane = InitRelatedASNPane;
            function refreshRow(row) {
                row.ASNNumber__.DisplayAs({ type: "Link" });
                row.ASNStatus__.DisplayAs({ type: "Link" });
            }
        })(ASN = Purchasing.ASN || (Purchasing.ASN = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
