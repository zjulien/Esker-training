///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ROItems_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Common",
  "comment": "Purchasing library managing RO (return order) items",
  "require": [
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_Data",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ROItems;
        (function (ROItems) {
            function GroupResultByPOLineNumber(results) {
                var _a;
                // sum returned quantities by PO line number
                var returnedQuantityByPOLine = {};
                for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                    var result = results_1[_i];
                    var poLineReturn = (_a = returnedQuantityByPOLine[result.Line_POLineNumber__]) !== null && _a !== void 0 ? _a : {
                        returnedQuantity: 0,
                        latestReturnDate: new Date("01/01/1970")
                    };
                    poLineReturn.returnedQuantity = new Sys.Decimal(poLineReturn.returnedQuantity)
                        .add(result.Line_ReturnedQuantity__)
                        .toNumber();
                    poLineReturn.latestReturnDate = Sys.Helpers.Date.Max(Sys.Helpers.Date.ISOSTringToDate(result.SubmitDateTime), poLineReturn.latestReturnDate);
                    returnedQuantityByPOLine[result.Line_POLineNumber__] = poLineReturn;
                }
                Log.Verbose("[GroupResultByPOLineNumber] returnedQuantityByPOLine: ".concat(JSON.stringify(returnedQuantityByPOLine)));
                return returnedQuantityByPOLine;
            }
            ROItems.GroupResultByPOLineNumber = GroupResultByPOLineNumber;
            function GetReturnOrderItems(companyCode, filter) {
                var queryParams = {
                    table: "CDLNAME#Return Order.LineItems__",
                    attributes: ["SubmitDateTime", "OrderNumber__", "RONumber__", "Line_GoodsReceiptNumber__", "Line_POLineNumber__", "Line_ReturnedQuantity__"],
                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), filter).toString(),
                    maxRecords: 100,
                    additionalOptions: {
                        asAdmin: true
                    }
                };
                Log.Info("Filter: ".concat(queryParams.filter));
                // Fetch quantity returned from RO
                return Sys.GenericAPI.PromisedQuery(queryParams)
                    .Then(function (results) {
                    Log.Info("[GetReturnOrderItems] ".concat(results.length, " lines"));
                    return results;
                });
            }
            ROItems.GetReturnOrderItems = GetReturnOrderItems;
        })(ROItems = Purchasing.ROItems || (Purchasing.ROItems = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
