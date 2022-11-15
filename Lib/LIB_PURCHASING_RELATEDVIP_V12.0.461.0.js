///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_RelatedVIP_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library to handle invoice information about PO items",
  "require": [
    "Lib_Purchasing_V12.0.461.0"
  ]
}*/
// Common interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var RelatedVIP;
        (function (RelatedVIP) {
            function IsGRFullyInvoiced() {
                var _a;
                var items = {};
                var lineIndexFilter = [];
                var orderNumber = Data.GetValue("OrderNumber__");
                var maxRecCount = Math.min(Data.GetTable("LineItems__").GetItemCount(), 100);
                var poItemsTableName = "AP - Purchase order - Items__";
                var companyCode = Data.GetValue("CompanyCode__");
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    var lineNum = item.GetValue("LineNumber__");
                    if (lineNum) {
                        items[lineNum] = { receivedAmount: item.GetValue("NetAmount__"), receivedQuantity: item.GetValue("ReceivedQuantity__") };
                    }
                });
                if (!Sys.Helpers.Object.IsEmptyPlainObject(items)) {
                    var lineNumbers = Object.keys(items);
                    if (lineNumbers.length === 1) {
                        lineIndexFilter.push(Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__", lineNumbers[0]));
                    }
                    else if (lineNumbers.length > 1) {
                        lineIndexFilter.push(Sys.Helpers.LdapUtil.FilterIn("ItemNumber__", lineNumbers));
                    }
                    maxRecCount = Math.min(maxRecCount, lineNumbers.length);
                    Log.Info("IsFullyInvoiced fromGRForm: consider PO#" + orderNumber + " lines " + lineNumbers.join(", "));
                }
                lineIndexFilter.push(Sys.Helpers.LdapUtil.FilterEqual("IsLocalPO__", "1"));
                lineIndexFilter.push(Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber));
                lineIndexFilter.push(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode));
                var options = {
                    table: poItemsTableName,
                    filter: (_a = Sys.Helpers.LdapUtil).FilterAnd.apply(_a, lineIndexFilter).toString(),
                    attributes: [
                        "OrderNumber__", "ItemNumber__", "ItemType__",
                        "GRIV__", "NoGoodsReceipt__", "ItemNumber__",
                        "OrderedQuantity__", "OrderedAmount__",
                        "DeliveredQuantity__", "DeliveredAmount__",
                        "InvoicedQuantity__", "InvoicedAmount__"
                    ],
                    sortOrder: "OrderNumber__ ASC, ItemNumber__ ASC",
                    maxRecords: maxRecCount,
                    additionalOptions: {
                        bigQuery: maxRecCount > 100,
                        queryOptions: "FastSearch=1"
                    }
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResults) {
                    var isFullyInvoiced = true;
                    if (queryResults.length > 0) {
                        queryResults.some(function (r) {
                            var amountBased = r.ItemType__ === "AmountBased";
                            var orderedQuantity = r.OrderedQuantity__ ? parseFloat(r.OrderedQuantity__) : 0;
                            var invoicedQuantity = r.InvoicedQuantity__ ? parseFloat(r.InvoicedQuantity__) : 0;
                            var orderedAmount = r.OrderedAmount__ ? parseFloat(r.OrderedAmount__) : 0;
                            var invoicedAmount = r.InvoicedAmount__ ? parseFloat(r.InvoicedAmount__) : 0;
                            var refField, currField, refName;
                            var grRequired = r.GRIV__ && r.NoGoodsReceipt__ !== "1";
                            if (amountBased) {
                                refField = grRequired ? items[r.ItemNumber__].receivedAmount : orderedAmount;
                                currField = invoicedAmount;
                                refName = grRequired ? "Delivered amount" : "Ordered amount";
                            }
                            else {
                                refField = grRequired ? items[r.ItemNumber__].receivedQuantity : orderedQuantity;
                                currField = invoicedQuantity;
                                refName = grRequired ? "Delivered quantity" : "Ordered quantity";
                            }
                            if (currField < refField) {
                                Log.Info("PO " + orderNumber + " is not fully invoiced based on data stored in table '" + poItemsTableName + "':\nLine " + r.ItemNumber__ + ": " + refName + " (" + refField + ") >= " + currField + " (Invoiced)");
                                isFullyInvoiced = false;
                            }
                        });
                    }
                    return isFullyInvoiced;
                })
                    .Catch(function () {
                    Log.Info("Error while retrieving PO details to know if " + orderNumber + " is fully invoiced");
                });
            }
            RelatedVIP.IsGRFullyInvoiced = IsGRFullyInvoiced;
            function HasInvoices() {
                var orderNumber = Data.GetValue("OrderNumber__");
                var options = {
                    table: "AP - Purchase order - Items__",
                    filter: Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber).toString(),
                    attributes: ["InvoicedQuantity__", "InvoicedAmount__"],
                    sortOrder: "InvoicedQuantity__ DESC, InvoicedAmount__ DESC"
                };
                options.filter = options.filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResults) {
                    if (queryResults.length != 0 && (queryResults[0].InvoicedQuantity__ > 0 || queryResults[0].InvoicedAmount__ > 0)) {
                        return true;
                    }
                    return false;
                });
            }
            RelatedVIP.HasInvoices = HasInvoices;
            /**
             * Check if purchase order invoiced amount matches the received or ordered amount, depending on the GR mode
             * @param {boolean} checkBillingCompleted optionnal parameter to check if the PO is billing completed on AP side
             */
            function IsPOFullyInvoiced(checkBillingCompleted) {
                if (checkBillingCompleted === void 0) { checkBillingCompleted = false; }
                var orderStatus = Data.GetValue("OrderStatus__");
                if (orderStatus !== "Received") {
                    return Sys.Helpers.Promise.Resolve(false);
                }
                var queryParameters = BuildFullInvoicedQueryParameters();
                return Sys.GenericAPI.PromisedQuery(queryParameters)
                    .Then(function (queryResults) {
                    var areItemsFullyInvoiced = true;
                    if (queryResults.length > 0) {
                        var isPOFullyInvoiced = queryResults.some(function (result) {
                            //all items on a billing completed PO should be also billing completed
                            //so find one billing completed should be enough
                            if (checkBillingCompleted && result.NoMoreInvoiceExpected__ === "1") {
                                return true;
                            }
                            var receivedAmount = result.DeliveredAmount__ ? parseFloat(result.DeliveredAmount__) : 0;
                            var invoicedAmount = result.InvoicedAmount__ ? parseFloat(result.InvoicedAmount__) : 0;
                            if (invoicedAmount < receivedAmount) {
                                areItemsFullyInvoiced = false;
                            }
                        }) || areItemsFullyInvoiced;
                        return isPOFullyInvoiced;
                    }
                    return false;
                })
                    .Catch(function (error) {
                    Log.Error("IsPOFullyInvoiced - error when trying to retrieve AP PO items information : ".concat(error));
                    return Sys.Helpers.Promise.Resolve(false);
                });
            }
            RelatedVIP.IsPOFullyInvoiced = IsPOFullyInvoiced;
            function BuildFullInvoicedQueryParameters() {
                var orderNumber = Data.GetValue("OrderNumber__");
                var maxRecords = Math.min(Data.GetTable("LineItems__").GetItemCount(), 100);
                var lineNumbers = [];
                var POItemsTableName = "AP - Purchase order - Items__";
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    var lineNumber = item.GetValue("LineItemNumber__");
                    lineNumbers.push(lineNumber);
                });
                var queryParameters = {
                    table: POItemsTableName,
                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterIn("ItemNumber__", lineNumbers), Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber)).toString(),
                    attributes: [
                        "OrderNumber__", "ItemNumber__",
                        "NoMoreInvoiceExpected__",
                        "DeliveredAmount__", "InvoicedAmount__"
                    ],
                    maxRecords: maxRecords,
                    additionalOptions: {
                        queryOptions: "FastSearch=1"
                    }
                };
                return queryParameters;
            }
            function BuildBillingCompletedQueryParameters() {
                var orderNumber = Data.GetValue("OrderNumber__");
                if (Sys.Helpers.IsEmpty(orderNumber)) {
                    return null;
                }
                var maxRecords = Math.min(Data.GetTable("LineItems__").GetItemCount(), 100);
                var lineNumbers = [];
                var POItemsTableName = "AP - Purchase order - Items__";
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    var lineNumber = item.GetValue("LineNumber__");
                    lineNumbers.push(lineNumber);
                });
                if (lineNumbers.length === 0) {
                    return null;
                }
                var queryParameters = {
                    table: POItemsTableName,
                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterIn("ItemNumber__", lineNumbers), Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber)).toString(),
                    attributes: [
                        "OrderNumber__", "ItemNumber__",
                        "NoMoreInvoiceExpected__"
                    ],
                    maxRecords: maxRecords,
                    additionalOptions: {
                        queryOptions: "FastSearch=1"
                    }
                };
                return queryParameters;
            }
            /**
             * Check if the purchase order related to the GR is billing completed
             * check is done on AP PO Items and its considered billing completed if at least one of the GR items is billing completed
             */
            function IsPOBillingCompletedFromGR() {
                var queryParameters = BuildBillingCompletedQueryParameters();
                if (Sys.Helpers.IsEmpty(queryParameters)) {
                    return Sys.Helpers.Promise.Resolve(false);
                }
                return Sys.GenericAPI.PromisedQuery(queryParameters)
                    .Then(function (queryResults) {
                    if (queryResults.length > 0) {
                        var isPOBillingCompleted = queryResults.some(function (result) {
                            //all items on a billing completed PO should be also billing completed
                            //so find one billing completed should be enough
                            return result.NoMoreInvoiceExpected__ === "1";
                        });
                        return isPOBillingCompleted;
                    }
                    return false;
                })
                    .Catch(function (error) {
                    Log.Error("IsPOBillingCompletedFromGR - error when trying to retrieve AP PO items information : ".concat(error));
                    return Sys.Helpers.Promise.Resolve(false);
                });
            }
            RelatedVIP.IsPOBillingCompletedFromGR = IsPOBillingCompletedFromGR;
        })(RelatedVIP = Purchasing.RelatedVIP || (Purchasing.RelatedVIP = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
