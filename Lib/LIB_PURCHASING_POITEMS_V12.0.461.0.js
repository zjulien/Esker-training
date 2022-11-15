///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_POItems_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library to manage items in PO",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Decimal",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_Vendor_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "[Lib_Purchasing_Punchout_PO_Client_V12.0.461.0]",
    "[Lib_PO_Customization_Common]",
    "[Sys/Sys_Helpers_Browse]",
    "[Lib_CommonDialog_V12.0.461.0]"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var POItems;
        (function (POItems) {
            // Members declaration and implementation
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            var MAXRECORDS = Lib.Purchasing.Items.MAXRECORDS;
            var PRItemsSynchronizeConfig = Lib.Purchasing.Items.PRItemsSynchronizeConfig;
            var PRItemsDBInfo = Lib.Purchasing.Items.PRItemsDBInfo;
            var POItemsDBInfo = Lib.Purchasing.Items.POItemsDBInfo;
            var PRItemsToPO = Lib.Purchasing.Items.PRItemsToPO;
            POItems.customerInterestedItems = ["ItemNumber__", "ItemDescription__", "ItemRequestedDeliveryDate__", "ItemQuantity__",
                "ItemUnit__", "ItemUnitPrice__", "ItemNetAmount__", "ItemCurrency__", "ItemTaxCode__", "Deleted", "Added"];
            POItems.customerInterestedAdditionalFeesFields = ["AdditionalFeeDescription__", "Price__", "ItemTaxCode__", "Deleted", "Added"];
            /**
             * Fill extra fields on PO items. This function is set as option when calling FillFormItems function.
             * @param {object} dbItem current pr item in database
             * @param {object} item current po item in form
             * @param {object} options options used to fill items
             */
            function CompleteFormItem(dbItem, item, options) {
                var realOrderedQuantity = null;
                if (options && options.checkQtyWith
                    && Object.keys(options.checkQtyWith).length !== 0
                    && options.checkQtyWith[dbItem.GetValue(PRItemsSynchronizeConfig.tableKey)]
                    && options.checkQtyWith[dbItem.GetValue(PRItemsSynchronizeConfig.tableKey)][dbItem.GetValue(PRItemsSynchronizeConfig.lineKey)] != undefined) {
                    realOrderedQuantity = options.checkQtyWith[dbItem.GetValue(PRItemsSynchronizeConfig.tableKey)][dbItem.GetValue(PRItemsSynchronizeConfig.lineKey)];
                }
                if (Sys.Helpers.IsEmpty(item.GetValue("SupplierPartID__"))) {
                    item.SetValue("SupplierPartID__", item.GetValue("ItemNumber__"));
                }
                var orderedQuantity = realOrderedQuantity !== null ? realOrderedQuantity : dbItem.GetValue("OrderedQuantity__");
                var unitPrice = dbItem.GetValue("UnitPrice__");
                var noGoodsReceipt = dbItem.GetValue("NoGoodsReceipt__");
                noGoodsReceipt = Sys.Helpers.IsString(noGoodsReceipt) ? Sys.Helpers.String.ToBoolean(noGoodsReceipt) : noGoodsReceipt;
                var requestedQuantity = dbItem.GetValue("Quantity__");
                var requestedAmount = dbItem.GetValue("NetAmount__");
                item.SetValue("ItemRequestedQuantity__", requestedQuantity);
                item.SetValue("ItemRequestedAmount__", requestedAmount);
                var toOrderQuantity = new Sys.Decimal(requestedQuantity).minus(dbItem.GetValue("CanceledQuantity__") || 0).minus(orderedQuantity).toNumber();
                var currency = dbItem.GetValue("Currency__");
                var currencyPrecision = CurrencyFactory.Get(currency);
                var toOrderAmount = Sys.Helpers.Round(new Sys.Decimal(unitPrice).mul(toOrderQuantity), currencyPrecision.amountPrecision).toNumber();
                //used to check overOrder client Side
                item.SetValue("OrderableQuantity__", toOrderQuantity);
                item.SetValue("OrderableAmount__", toOrderAmount);
                item.SetValue("ItemQuantity__", toOrderQuantity);
                item.SetValue("ItemNetAmount__", toOrderAmount);
                item.SetValue("ItemNetAmountLocalCurrency__", new Sys.Decimal(toOrderAmount).mul(item.GetValue("ItemExchangeRate__")).toNumber());
                item.SetValue("ItemUndeliveredQuantity__", noGoodsReceipt ? 0 : toOrderQuantity);
                item.SetValue("ItemOpenAmount__", noGoodsReceipt ? 0 : toOrderAmount);
                if (toOrderQuantity <= 0) {
                    item.SetError("PRNumber__", "_Item over ordered {0}", toOrderQuantity);
                }
                item.SetValue("ItemRequestedUnitPrice__", unitPrice);
                item.SetValue("ItemTaxAmount__", new Sys.Decimal(toOrderAmount).mul(dbItem.GetValue("TaxRate__")).div(100).toNumber());
                item.SetValue("ItemTotalDeliveredQuantity__", 0);
                item.SetValue("ItemReceivedAmount__", 0);
                if (dbItem.GetValue("Status__") === "Canceled") {
                    item.SetError("PRNumber__", "_Item no longer orderable");
                }
                item.SetValue("ItemInitialRequestedDeliveryDate__", dbItem.GetValue("RequestedDeliveryDate__"));
                item.SetValue("RequestedBudgetID__", dbItem.GetValue("BudgetID__"));
                item.SetValue("ItemCurrency__", currency);
                if (Sys.Parameters.GetInstance("PAC").GetParameter("DisplayTaxCode") && item.IsNullOrEmpty("ItemTaxCode__")) {
                    item.SetError("ItemTaxCode__", "This field is required!");
                }
                Lib.Purchasing.ShipTo.MigrateOldShipToCompanyBehavior(item);
                var requesterLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("RequesterDN__"));
                Sys.OnDemand.Users.CacheByLogin.Get(requesterLogin, Lib.P2P.attributesForUserCache).Then(function (result) {
                    var user = result[requesterLogin];
                    if (!user.$error) {
                        item.SetValue("ItemRequester__", user.displayname ? user.displayname : user.login);
                    }
                });
                var recipientLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("RecipientDN__"));
                Sys.OnDemand.Users.CacheByLogin.Get(recipientLogin, Lib.P2P.attributesForUserCache).Then(function (result) {
                    var user = result[recipientLogin];
                    if (!user.$error) {
                        item.SetValue("ItemRecipient__", user.displayname ? user.displayname : user.login);
                    }
                });
                return true;
            }
            POItems.CompleteFormItem = CompleteFormItem;
            function FillTaxSummary() {
                var taxCount = 0;
                var taxSummary = {};
                var addTaxFromLine = function (line) {
                    var taxCode = line.GetValue("ItemTaxCode__");
                    var netAmount = line.GetValue("ItemNetAmount__");
                    netAmount = netAmount ? netAmount : line.GetValue("Price__"); // if it comes from additional fees
                    if (taxSummary[taxCode]) {
                        taxSummary[taxCode].netAmount = new Sys.Decimal(netAmount || 0).add(taxSummary[taxCode].netAmount || 0);
                    }
                    else if (netAmount) {
                        taxSummary[taxCode] = {
                            taxRate: line.GetValue("ItemTaxRate__"),
                            netAmount: new Sys.Decimal(netAmount || 0)
                        };
                        taxCount++;
                    }
                };
                Sys.Helpers.Data.ForEachTableItem("LineItems__", addTaxFromLine);
                Sys.Helpers.Data.ForEachTableItem("AdditionalFees__", addTaxFromLine);
                var filter = "";
                var totalTaxAmount = new Sys.Decimal(0);
                var taxTable = Data.GetTable("TaxSummary__");
                if (taxTable.GetItemCount() != taxCount) {
                    taxTable.SetItemCount(taxCount);
                }
                taxCount = 0;
                Sys.Helpers.Object.ForEach(taxSummary, function (summary, taxCode) {
                    var item = taxTable.GetItem(taxCount++);
                    var taxAmount = new Sys.Decimal(summary.netAmount || 0).mul(summary.taxRate || 0).div(100);
                    item.SetValue("TaxCode__", taxCode);
                    item.SetValue("TaxRate__", summary.taxRate);
                    item.SetValue("NetAmount__", summary.netAmount.toNumber());
                    item.SetValue("TaxAmount__", taxAmount.toNumber());
                    item.SetValue("TaxDescription__", "");
                    totalTaxAmount = totalTaxAmount.add(taxAmount);
                    filter += "(TaxCode__=" + taxCode + ")";
                });
                var promiseQuery = Sys.Helpers.Promise.Resolve();
                if (filter) {
                    filter = "(&(|(CompanyCode__=" + Data.GetValue("CompanyCode__") + ")(CompanyCode__=)(CompanyCode__!=*))(|" + filter + "))";
                    promiseQuery = Sys.GenericAPI.PromisedQuery({
                        table: "AP - Tax codes__",
                        filter: filter,
                        attributes: ["TaxCode__", "Description__"],
                        maxRecords: 100
                    })
                        .Then(function (result) {
                        if (result.length > 0) {
                            Sys.Helpers.Data.ForEachTableItem("TaxSummary__", function (item /*, i: number*/) {
                                var taxCode = item.GetValue("TaxCode__");
                                var foundTax = Sys.Helpers.Array.Find(result, function (tax) {
                                    return tax.TaxCode__ === taxCode;
                                });
                                if (foundTax) {
                                    item.SetValue("TaxDescription__", foundTax.Description__);
                                }
                            });
                        }
                    });
                }
                Data.SetValue("TotalTaxAmount__", totalTaxAmount.toNumber());
                Data.SetValue("TotalAmountIncludingVAT__", new Sys.Decimal(Data.GetValue("TotalNetAmount__")).add(totalTaxAmount).toNumber());
                return promiseQuery;
            }
            POItems.FillTaxSummary = FillTaxSummary;
            function QueryPRItems(context, filter) {
                return Sys.GenericAPI.PromisedQuery({
                    table: PRItemsDBInfo.table,
                    filter: filter,
                    attributes: ["*"],
                    sortOrder: context.options.orderByClause || "",
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: PRItemsDBInfo.fieldsMap,
                        bigQuery: true,
                        queryOptions: "ReturnNullAttributes=1"
                    }
                })
                    .Then(function (dbItems) {
                    if (dbItems.length === 0) {
                        throw "FillForm: cannot find any PR items with filter: " + filter;
                    }
                    // Before S152, client side edd queries do return technical fields ONLY on 1st record, so we disable the ordering
                    var allItemsHaveMsnOrMsnex = Sys.Helpers.Array.Every(dbItems, function (v) {
                        return v.GetValue("Msn") || v.GetValue("MsnEx");
                    });
                    if (Sys.Helpers.IsArray(context.options.orderByMsn) && allItemsHaveMsnOrMsnex) {
                        // by default we look for based on MsnEx
                        // If we don't find item based on this field the first time, we base on Msn
                        var searchOnMsnEx_1 = true;
                        dbItems = context.options.orderByMsn.map(function (msn) {
                            var foundItem;
                            if (searchOnMsnEx_1) {
                                foundItem = Sys.Helpers.Array.Find(dbItems, function (item) {
                                    return item.GetValue("MsnEx") === msn;
                                });
                            }
                            if (!foundItem) {
                                searchOnMsnEx_1 = false;
                                foundItem = Sys.Helpers.Array.Find(dbItems, function (item) {
                                    return item.GetValue("Msn") === msn;
                                });
                            }
                            return foundItem;
                        });
                    }
                    context.dbItems = dbItems;
                    return context;
                })
                    .Catch(function (error) {
                    throw "FillForm: error querying PR items with filter. Details: " + error;
                });
            }
            function QueryForeignData(context) {
                return Lib.Purchasing.Items.LoadForeignData(context.dbItems, PRItemsDBInfo)
                    .Then(function (foreignData) {
                    context.options.foreignData = foreignData;
                    return context;
                });
            }
            function QueryAlreadyOrderedQuantity(context) {
                var poItemsFilter = "(|";
                context.dbItems.forEach(function (dbItem /*, index: number*/) {
                    poItemsFilter += "(&(Status__!=Canceled)(Status__!=Rejected)(PRNumber__=" + dbItem.GetValue(PRItemsSynchronizeConfig.tableKey) + ")(PRLineNumber__=" + dbItem.GetValue(PRItemsSynchronizeConfig.lineKey) + "))";
                });
                poItemsFilter += ")";
                Log.Info("Fetching ordered information from PO Items: " + poItemsFilter);
                return Sys.GenericAPI.PromisedQuery({
                    table: POItemsDBInfo.table,
                    filter: poItemsFilter,
                    attributes: ["PRNumber__", "PRLineNumber__", "OrderedQuantity__"],
                    maxRecords: MAXRECORDS,
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: POItemsDBInfo.fieldsMap
                    }
                })
                    .Then(function (dbPOItems) {
                    if (dbPOItems.length !== 0) {
                        var poOrderedQty_1 = {};
                        dbPOItems.forEach(function (dbPOItem) {
                            var prNumber = dbPOItem.GetValue("PRNumber__");
                            var prItemNumber = dbPOItem.GetValue("PRLineNumber__");
                            var qty = dbPOItem.GetValue("OrderedQuantity__");
                            poOrderedQty_1[prNumber] = poOrderedQty_1[prNumber] || {};
                            poOrderedQty_1[prNumber][prItemNumber] = poOrderedQty_1[prNumber][prItemNumber] || 0;
                            poOrderedQty_1[prNumber][prItemNumber] = new Sys.Decimal(poOrderedQty_1[prNumber][prItemNumber]).add(qty).toNumber();
                        });
                        context.options.checkQtyWith = poOrderedQty_1;
                    }
                    return context;
                })
                    .Catch(function (error) {
                    throw "FillForm: error querying PO items for Quantity__ with filter. Details: " + error;
                });
            }
            function FillPOItems(context) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    context.fieldsInError = Lib.Purchasing.Items.FillFormItems(context.dbItems, PRItemsToPO, context.options);
                    resolve(context);
                });
            }
            function InitConfiguration(context) {
                if (context.dbItems.length > 0) {
                    var companyCode = Lib.Purchasing.Items.GetDBFieldValue(context.dbItems[0], "CompanyCode__", PRItemsToPO, context.options);
                    Data.SetValue("CompanyCode__", companyCode);
                }
                return Lib.Purchasing.SetERPByCompanyCode(Data.GetValue("CompanyCode__"))
                    .Then(function () {
                    Lib.P2P.InitSAPConfiguration(Lib.ERP.GetERPName(), "PAC");
                    return context;
                });
            }
            /**
             * Fill the purchase order form (header + items) according to the information stored in items.
             */
            function CompleteForm(context) {
                Lib.Purchasing.Items.ComputeTotalAmount();
                var promiseFillTaxSummary = FillTaxSummary();
                Data.SetValue("OrderStatus__", "To order");
                if (Sys.ScriptInfo.IsServer()) {
                    Data.SetValue("BuyerName__", Lib.Purchasing.GetOwner().GetValue("DisplayName"));
                    Data.SetValue("BuyerLogin__", Lib.Purchasing.GetOwner().GetValue("login"));
                }
                else {
                    Data.SetValue("BuyerName__", Sys.Helpers.Globals.User.fullName);
                    Data.SetValue("BuyerLogin__", Sys.Helpers.Globals.User.loginId);
                }
                var sectionsToClean = [];
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    sectionsToClean.push(Lib.Purchasing.Items.PRItemsToPO.mappings.common.VendorNumber__.sectionName);
                }
                else {
                    sectionsToClean.push(Lib.Purchasing.Items.PRItemsToPO.mappings.common.WarehouseID__.sectionName);
                }
                if (Lib.Purchasing.IsMultiShipTo()) {
                    sectionsToClean.push(Lib.Purchasing.Items.PRItemsToPO.mappings.common.ShipToCompany__.sectionName);
                }
                else if (Lib.P2P.Inventory.HasReplenishmentItems(Data.GetTable("LineItems__"))) {
                    Lib.Purchasing.ShipTo.SetHeaderToFirstReplenishmentAdress();
                }
                if (sectionsToClean.length > 0) {
                    Sys.Helpers.Object.ForEach(Lib.Purchasing.Items.PRItemsToPO.mappings.common, function (value) {
                        if (value.name && sectionsToClean.indexOf(value.sectionName) != -1) {
                            if (value.TechnicalData) {
                                Sys.TechnicalData.SetValue(value.name, "");
                            }
                            else {
                                Data.SetValue(value.name, "");
                                Data.SetError(value.name, "");
                            }
                        }
                    });
                }
                var promises = [promiseFillTaxSummary, Lib.Purchasing.Vendor.Init(), Lib.Purchasing.ShipTo.Init(), Lib.Purchasing.POItems.SetLocalCurrency()];
                return Sys.Helpers.Promise.All(promises)
                    .Then(function () { return context; });
            }
            function SetLocalCurrency() {
                var companyCode = Data.GetValue("CompanyCode__");
                if (!companyCode) {
                    return Sys.Helpers.Promise.Reject("Empty company code.");
                }
                return Lib.P2P.CompanyCodesValue.QueryValues(companyCode, true)
                    .Then(function (CCValues) {
                    if (Object.keys(CCValues).length > 0) {
                        var currency = CCValues.Currency__;
                        Data.SetValue("LocalCurrency__", currency);
                        return currency;
                    }
                    throw "This CompanyCode does not exist in the table.";
                });
            }
            POItems.SetLocalCurrency = SetLocalCurrency;
            function CheckError(context) {
                if (context.fieldsInError.length > 0) {
                    // Reject with error message of the first field
                    return Sys.Helpers.Promise.Reject(PRItemsToPO.errorMessages[context.fieldsInError[0]] ||
                        "Some items have different values on the following fields: " + context.fieldsInError.join(", "));
                }
                return Sys.Helpers.Promise.Resolve(context);
            }
            /**
             * Fill the purchase order form according to the selected PR items by the specified filter.
             * @param {string} filter selected DB items used to fill form items.
             * @param {object} options
             * @returns {promise}
             */
            function FillForm(filter, options) {
                Log.Time("Lib.Purchasing.POItems.FillForm");
                var context = {
                    options: null
                };
                context.options = options || {};
                context.options.fillItem = options.fillItem || CompleteFormItem;
                return QueryPRItems(context, filter) //add context.dbItems
                    .Then(QueryForeignData) //add context.options.foreignData
                    .Then(QueryAlreadyOrderedQuantity) //add context.options.checkQtyWith
                    .Then(InitConfiguration) // Use Setted CompanyCode
                    .Then(FillPOItems) // Add context.fieldsInError
                    .Then(CompleteForm) // Use Setted Configuration
                    .Then(CheckError) // check context.fieldsInError
                    .Finally(function () { return Log.TimeEnd("Lib.Purchasing.POItems.FillForm"); });
            }
            POItems.FillForm = FillForm;
            function UpdatePOFromGR(roItems, computedData) {
                Log.Info("Update PO items according to the GR items (goods) with number '" + Data.GetValue("OrderNumber__") + "'");
                var lineItems = Sys.Helpers.Data.GetTableAsArray("LineItems__");
                return GetGRItemsForOrder()
                    .Then(function (grItems) {
                    var todayDate = new Date();
                    todayDate.setUTCHours(12, 0, 0, 0);
                    var noGoodsReceiptItems = GetNonReceivedNoGoodsReceiptItems(todayDate, lineItems);
                    UpdatePOLineItemsFromGR(todayDate, lineItems, grItems, roItems, computedData);
                    var _a = UpdatePOHeader(todayDate, lineItems, grItems), hasGoodsReceipt = _a.hasGoodsReceipt, hasValidGoodsReceipt = _a.hasValidGoodsReceipt;
                    return Sys.Helpers.Promise.Resolve({
                        hasGoodsReceipt: hasGoodsReceipt,
                        hasValidGoodsReceipt: hasValidGoodsReceipt,
                        noGoodsReceiptItems: noGoodsReceiptItems
                    });
                })
                    .Catch(function (error) {
                    Log.Error("Error updating PO from GR items");
                    Log.Error(error);
                    throw new Error(error);
                });
            }
            POItems.UpdatePOFromGR = UpdatePOFromGR;
            function GetGRItemsForOrder() {
                var grItemsFilter = "(&(!(Status__=Canceled))(OrderNumber__=" + Data.GetValue("OrderNumber__") + "))";
                return Lib.Purchasing.Items.GetItemsForDocument(Lib.Purchasing.Items.GRItemsDBInfo, grItemsFilter, "LineNumber__");
            }
            function QueryAPPOItems(params) {
                var _a;
                var PONumber = params.PONumber, isNoGoodsReceipt = params.isNoGoodsReceipt, isInvoiced = params.isInvoiced;
                var filters = [];
                if (PONumber) {
                    filters.push(Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", PONumber));
                }
                if (typeof isNoGoodsReceipt !== "undefined") {
                    filters.push(Sys.Helpers.LdapUtil.FilterEqual("NoGoodsReceipt__", isNoGoodsReceipt ? "1" : "0"));
                }
                if (typeof isInvoiced !== "undefined" && !isInvoiced) {
                    filters.push(Sys.Helpers.LdapUtil.FilterLesserOrEqual("InvoicedAmount__", "0"));
                }
                var APPOItemsQueryParams = {
                    table: "AP - Purchase order - Items__",
                    attributes: ["ItemNumber__", "OrderNumber__", "NoGoodsReceipt__", "InvoicedAmount__"],
                    filter: (_a = Sys.Helpers.LdapUtil).FilterAnd.apply(_a, filters).toString()
                };
                return Sys.GenericAPI.PromisedQuery(APPOItemsQueryParams);
            }
            POItems.QueryAPPOItems = QueryAPPOItems;
            function GetNoGoodsReceiptItems(todayDate, lineItems, doNotCheckReceived, doNotCheckDate) {
                if (doNotCheckReceived === void 0) { doNotCheckReceived = false; }
                if (doNotCheckDate === void 0) { doNotCheckDate = false; }
                return lineItems.reduce(function (acc, line) {
                    var serviceDelivered = line.GetValue("NoGoodsReceipt__") && ((Sys.Helpers.Date.CompareDate(todayDate, line.GetValue("ItemRequestedDeliveryDate__")) > 0 || doNotCheckDate));
                    if (serviceDelivered && (!line.GetValue("ItemDeliveryComplete__") || doNotCheckReceived)) {
                        acc.push(line);
                    }
                    return acc;
                }, []);
            }
            function GetNonReceivedNoGoodsReceiptItems(todayDate, lineItems) {
                return GetNoGoodsReceiptItems(todayDate, lineItems);
            }
            function UpdatePOLineItemsFromGR(todayDate, lineItems, grItems, roItems, computedData) {
                lineItems.forEach(function (line) {
                    var _a;
                    var lineNumber = line.GetValue("LineItemNumber__");
                    var lineStatus = Data.GetValue("OrderStatus__");
                    var initAccumulator = {
                        lineReceivedQuantity: new Sys.Decimal(0),
                        lineReceivedAmount: new Sys.Decimal(0),
                        lineOpenQuantity: new Sys.Decimal(line.GetValue("NoGoodsReceipt__") ? 0 : line.GetValue("ItemQuantity__")),
                        lineOpenAmount: new Sys.Decimal(line.GetValue("NoGoodsReceipt__") ? 0 : line.GetValue("ItemNetAmount__")),
                        lineDeliveryDate: new Date("01/01/1970"),
                        lineLatestCreationDateTime: new Date("01/01/1970"),
                        lineDeliveryCompleted: false,
                        lineReturnedQuantity: new Sys.Decimal(0)
                    };
                    var grItemsForLine = grItems[lineNumber] || [];
                    var _b = grItemsForLine.reduce(function (acc, grItem) { return ({
                        lineReceivedQuantity: acc.lineReceivedQuantity.add(grItem.GetValue("Quantity__")),
                        lineReceivedAmount: acc.lineReceivedAmount.add(grItem.GetValue("Amount__")),
                        lineOpenQuantity: acc.lineOpenQuantity.minus(grItem.GetValue("Quantity__")),
                        lineOpenAmount: acc.lineOpenAmount.minus(grItem.GetValue("Amount__")),
                        lineDeliveryDate: Sys.Helpers.Date.CompareDate(grItem.GetValue("DeliveryDate__"), acc.lineDeliveryDate) > 0 ? grItem.GetValue("DeliveryDate__") : acc.lineDeliveryDate,
                        lineLatestCreationDateTime: Sys.Helpers.Date.Max(Sys.Helpers.Date.ISOSTringToDate(grItem.GetValue("CreationDateTime")), acc.lineLatestCreationDateTime),
                        lineDeliveryCompleted: acc.lineDeliveryCompleted || grItem.GetValue("DeliveryCompleted__"),
                        lineReturnedQuantity: acc.lineReturnedQuantity.add(grItem.GetValue("ReturnedQuantity__") || 0)
                    }); }, initAccumulator), lineReceivedQuantity = _b.lineReceivedQuantity, lineReceivedAmount = _b.lineReceivedAmount, lineOpenQuantity = _b.lineOpenQuantity, lineOpenAmount = _b.lineOpenAmount, lineDeliveryDate = _b.lineDeliveryDate, lineLatestCreationDateTime = _b.lineLatestCreationDateTime, lineDeliveryCompleted = _b.lineDeliveryCompleted, lineReturnedQuantity = _b.lineReturnedQuantity;
                    // if given, RO items takes precedence over GR items
                    if (roItems === null || roItems === void 0 ? void 0 : roItems[lineNumber]) {
                        lineReturnedQuantity = new Sys.Decimal((_a = roItems[lineNumber].returnedQuantity) !== null && _a !== void 0 ? _a : 0);
                        // reset delivery completed if any return posterior to latest receipt
                        if (Sys.Helpers.Date.CompareDate(roItems[lineNumber].latestReturnDate, lineLatestCreationDateTime) > 0) {
                            lineDeliveryCompleted = false;
                        }
                    }
                    // delivery completed means we can't receive any more, event after return
                    if (lineDeliveryCompleted) {
                        lineOpenQuantity = new Sys.Decimal(0);
                        lineOpenAmount = new Sys.Decimal(0);
                    }
                    else {
                        // open quantity cannot be negative
                        lineOpenQuantity = lineOpenQuantity.add(lineReturnedQuantity);
                        lineOpenQuantity = Sys.Decimal.max(0, lineOpenQuantity);
                        lineOpenAmount = lineOpenQuantity.mul(new Sys.Decimal(line.GetValue("ItemUnitPrice__") || 0));
                    }
                    var serviceDelivered = line.GetValue("NoGoodsReceipt__") && Sys.Helpers.Date.CompareDate(todayDate, line.GetValue("ItemRequestedDeliveryDate__")) > 0;
                    lineDeliveryCompleted = lineDeliveryCompleted || serviceDelivered;
                    lineDeliveryDate = serviceDelivered ? line.GetValue("ItemRequestedDeliveryDate__") : lineDeliveryDate;
                    // byline computed data
                    line.SetValue("ItemReceivedAmount__", lineReceivedAmount.toNumber());
                    line.SetValue("ItemOpenAmount__", lineOpenAmount.toNumber());
                    line.SetValue("ItemReturnQuantity__", lineReturnedQuantity.toNumber());
                    line.SetValue("ItemTotalDeliveredQuantity__", lineReceivedQuantity.toNumber());
                    line.SetValue("ItemUndeliveredQuantity__", lineOpenQuantity.toNumber());
                    line.SetValue("ItemDeliveryComplete__", lineDeliveryCompleted ? 1 : 0);
                    line.SetValue("ItemDeliveryDate__", Sys.Helpers.Date.CompareDate(lineDeliveryDate, new Date("01/01/1970")) == 0 ? "" : lineDeliveryDate);
                    if (lineDeliveryCompleted) {
                        lineStatus = "Received";
                    }
                    //Case return order have reOpen the line
                    else if (lineStatus == "Received") {
                        lineStatus = "To received";
                    }
                    if (computedData) {
                        Sys.Helpers.Extend(computedData.byLine[lineNumber], {
                            "Status": lineStatus
                        });
                    }
                });
            }
            function UpdatePOHeader(todayDate, lineItems, grItems) {
                var initAccumulator = {
                    hasGoodsReceipt: false,
                    deliveryDate: new Date("01/01/1970"),
                    openOrderLocalCurrency: new Sys.Decimal(0),
                    stillWaitingForReception: false
                };
                var _a = lineItems.reduce(function (acc, line) {
                    var lineNumber = line.GetValue("LineItemNumber__");
                    var grItemsForLine = grItems[lineNumber] || [];
                    var serviceDelivered = line.GetValue("NoGoodsReceipt__") && Sys.Helpers.Date.CompareDate(todayDate, line.GetValue("ItemRequestedDeliveryDate__")) > 0;
                    var lineDeliveryDate = line.GetValue("ItemDeliveryDate__");
                    var lineOpenQuantity = new Sys.Decimal(line.GetValue("ItemUndeliveredQuantity__") || 0);
                    var lineDeliveryCompleted = line.GetValue("ItemDeliveryComplete__");
                    return {
                        hasGoodsReceipt: serviceDelivered || acc.hasGoodsReceipt || grItemsForLine.length > 0,
                        deliveryDate: Sys.Helpers.Date.CompareDate(lineDeliveryDate, acc.deliveryDate) > 0 ? lineDeliveryDate : acc.deliveryDate,
                        openOrderLocalCurrency: acc.openOrderLocalCurrency.add(lineOpenQuantity.mul(line.GetValue("ItemUnitPrice__")).mul(line.GetValue("ItemExchangeRate__"))),
                        stillWaitingForReception: acc.stillWaitingForReception || !lineDeliveryCompleted
                    };
                }, initAccumulator), hasGoodsReceipt = _a.hasGoodsReceipt, deliveryDate = _a.deliveryDate, openOrderLocalCurrency = _a.openOrderLocalCurrency, stillWaitingForReception = _a.stillWaitingForReception;
                var status = Data.GetValue("OrderStatus__");
                // global status
                if (!hasGoodsReceipt) {
                    status = Data.GetValue("OrderStatus__");
                    // Can be received by NoGoodsReceived before and rollback from Manual reception
                    if (status == "Received") {
                        status = "To receive";
                    }
                }
                else if (stillWaitingForReception) {
                    status = "To receive";
                }
                else {
                    status = "Received";
                    Data.SetValue("DeliveredDate__", deliveryDate);
                }
                Log.Info("Set Order Status to '" + status + "' with openOrderLocalCurrency : '" + openOrderLocalCurrency.toNumber() + "'");
                Data.SetValue("OrderStatus__", status);
                Data.SetValue("OpenOrderLocalCurrency__", openOrderLocalCurrency.toNumber());
                var hasCanceledGoodsReceipt = !!Variable.GetValueAsString("LastCanceledReceptionData");
                return {
                    hasGoodsReceipt: hasGoodsReceipt || hasCanceledGoodsReceipt,
                    hasValidGoodsReceipt: hasGoodsReceipt
                };
            }
            /**
             * Returns all items in PO form by PR number.
             * @returns {object} items map by PR number
             */
            function GetPRItemsInForm() {
                var allPRItems = {};
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                    var prNumber = line.GetValue("PRNumber__");
                    if (!(prNumber in allPRItems)) {
                        allPRItems[prNumber] = [];
                    }
                    allPRItems[prNumber].push(line);
                });
                return allPRItems;
            }
            POItems.GetPRItemsInForm = GetPRItemsInForm;
            function UpdatePOExchangeRateFromPR() {
                var ret = UpdatePOExchangeRateFromPRInternal();
                Process.WaitForUpdate();
                Process.LeaveForm();
                return ret;
            }
            POItems.UpdatePOExchangeRateFromPR = UpdatePOExchangeRateFromPR;
            function UpdatePOExchangeRateFromPRInternal() {
                var allPRItems = GetPRItemsInForm();
                // Get the PR Items filter
                var prItemsFilter = "(|";
                Sys.Helpers.Object.ForEach(allPRItems, function (prItems, prNumber) {
                    prItems.forEach(function (prItem) {
                        prItemsFilter += "(&(PRNumber__=" + prNumber + ")(LineNumber__=" + prItem.GetValue("PRLineNumber__") + "))";
                    });
                });
                prItemsFilter += ")";
                return Lib.Purchasing.Items.GetItemsForDocument(Lib.Purchasing.Items.PRItemsDBInfo, prItemsFilter, "PRNumber__")
                    .Then(function (prItems) {
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        var prNumber = line.GetValue("PRNumber__");
                        var prLineNumber = line.GetValue("PRLineNumber__");
                        var prLine = null;
                        if (prItems && prItems[prNumber]) {
                            prLine = Sys.Helpers.Array.Find(prItems[prNumber], function (prL) {
                                return prL.GetValue("LineNumber__") == prLineNumber;
                            });
                        }
                        if (prLine) {
                            var exchangeRate = prLine.GetValue("ExchangeRate__");
                            line.SetValue("ItemExchangeRate__", exchangeRate);
                            var currency = Data.GetValue("LocalCurrency__");
                            var netAmount = line.GetValue("ItemNetAmount__");
                            var currencyPrecision = CurrencyFactory.Get(currency);
                            line.SetValue("ItemNetAmountLocalCurrency__", Sys.Helpers.Round(new Sys.Decimal(netAmount).mul(exchangeRate), currencyPrecision.amountPrecision).toNumber());
                        }
                    });
                });
            }
            function UpdatePOFromPR(editOrder) {
                if (editOrder === void 0) { editOrder = false; }
                var allPRItems = GetPRItemsInForm();
                // Get the PR Items filter
                var prItemsFilter = "(|";
                Sys.Helpers.Object.ForEach(allPRItems, function (prItems, prNumber) {
                    prItems.forEach(function (prItem) {
                        prItemsFilter += "(&(PRNumber__=" + prNumber + ")(LineNumber__=" + prItem.GetValue("PRLineNumber__") + "))";
                    });
                });
                prItemsFilter += ")";
                return Lib.Purchasing.Items.GetItemsForDocument(Lib.Purchasing.Items.PRItemsDBInfo, prItemsFilter, "PRNumber__")
                    .Then(function (prItems) {
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        var prNumber = line.GetValue("PRNumber__");
                        var prLineNumber = line.GetValue("PRLineNumber__");
                        var prLine = null;
                        if (prItems && prItems[prNumber]) {
                            prLine = Sys.Helpers.Array.Find(prItems[prNumber], function (prL) {
                                return prL.GetValue("LineNumber__") == prLineNumber;
                            });
                        }
                        var lineIsOrderable = false;
                        if (prLine) {
                            line.SetValue("OrderableQuantity__", prLine.GetValue("CanceledQuantity__"));
                            line.SetValue("OrderableAmount__", prLine.GetValue("CanceledAmount__"));
                            // check status
                            var isToOrder = Purchasing.PRStatus.ForPOWorkflow.indexOf(prLine.GetValue("Status__")) !== -1;
                            var isNotInPRWorkflow = Purchasing.PRStatus.ForPRWorkflow.indexOf(prLine.GetValue("Status__")) === -1;
                            lineIsOrderable = (editOrder && isNotInPRWorkflow) || (!editOrder && isToOrder);
                        }
                        if (!lineIsOrderable) {
                            line.SetError("PRNumber__", "_Item no longer orderable");
                        }
                    });
                });
            }
            function UpdatePOFromPO() {
                var allPRItems = GetPRItemsInForm();
                //Get the PO Items already created for each PR Items present in this Order to retrieve alreadyOrderedQuantity quantity
                var poItemsFilter = "(|";
                Sys.Helpers.Object.ForEach(allPRItems, function (prItems, prNumber) {
                    prItems.forEach(function (prItem) {
                        poItemsFilter += "(&(Status__!=Canceled)(Status__!=Rejected)(PRNumber__=" + prNumber + ")(PRLineNumber__=" + prItem.GetValue("PRLineNumber__") + "))";
                    });
                });
                poItemsFilter += ")";
                return Lib.Purchasing.Items.GetItemsForDocument(Lib.Purchasing.Items.POItemsDBInfo, poItemsFilter, "PRNumber__")
                    .Then(function (poItems) {
                    var poRuidex = Data.GetValue("RUIDEX");
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        var prNumber = line.GetValue("PRNumber__");
                        var prLineNumber = line.GetValue("PRLineNumber__");
                        var requestedQuantity = line.GetValue("ItemRequestedQuantity__");
                        //reset and set in UpdatePOFromPR with CanceledQuantity from pr item
                        var canceledQuantity = line.GetValue("OrderableQuantity__");
                        var orderedQuantity = line.GetValue("ItemQuantity__");
                        var alreadyOrderedQuantity = new Sys.Decimal(canceledQuantity || 0);
                        if (poItems && poItems[prNumber] && poItems[prNumber].length > 0) {
                            poItems[prNumber].forEach(function (poLine) {
                                // Ignore items from this PO
                                if (poLine.GetValue("PRLineNumber__") == prLineNumber && poLine.GetValue("PORUIDEX__") !== poRuidex) {
                                    alreadyOrderedQuantity = alreadyOrderedQuantity.add(poLine.GetValue("OrderedQuantity__"));
                                }
                            });
                        }
                        var orderableQuantity = new Sys.Decimal(requestedQuantity || 0).minus(alreadyOrderedQuantity).toNumber();
                        var orderableAmount = new Sys.Decimal(line.GetValue("ItemRequestedUnitPrice__") || 0).mul(orderableQuantity).toNumber();
                        line.SetValue("OrderableQuantity__", orderableQuantity);
                        line.SetValue("OrderableAmount__", orderableAmount);
                        if (Lib.Purchasing.Items.IsQuantityBasedItem(line)) {
                            var overOrderedQuantity = alreadyOrderedQuantity.add(orderedQuantity).minus(requestedQuantity);
                            if (overOrderedQuantity.greaterThan(0)) {
                                line.SetError("PRNumber__", "_Item over ordered {0}", overOrderedQuantity.toNumber());
                            }
                        }
                        else {
                            var customChangeAllowed = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.IsItemUnitPriceChangeAllowed", line);
                            var changeAllowed = customChangeAllowed || (customChangeAllowed === null && Lib.Purchasing.CheckPO.IsTotalPriceTolerated(requestedQuantity, orderableQuantity, orderedQuantity));
                            if (!changeAllowed) {
                                line.SetError("ItemNetAmount__", "_The price variance between purchase order and purchase requisition exceeds the tolerance limit");
                            }
                        }
                    });
                });
            }
            function UpdatePOFromPRAndPO(editOrder) {
                if (editOrder === void 0) { editOrder = false; }
                return UpdatePOFromPR(editOrder)
                    .Then(UpdatePOFromPO);
            }
            POItems.UpdatePOFromPRAndPO = UpdatePOFromPRAndPO;
            function CheckDataCoherency() {
                var currency = Data.GetValue("Currency__");
                var companyCode = Data.GetValue("CompanyCode__");
                var error = false;
                var displayTaxCode = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayTaxCode");
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    var hasCurrencyError = currency !== item.GetValue("ItemCurrency__");
                    var hasCompanyCodeError = companyCode !== item.GetValue("ItemCompanyCode__");
                    var hasTaxCodeError = displayTaxCode == true && item.IsNullOrEmpty("ItemTaxCode__");
                    item.SetError("ItemCurrency__", hasCurrencyError ? "_Only items with the same currency can be selected." : "");
                    item.SetError("ItemCompanyCode__", hasCompanyCodeError ? "_Only items from the same company can be selected." : "");
                    item.SetError("ItemTaxCode__", hasTaxCodeError ? "This field is required!" : "");
                    if (hasCurrencyError || hasCompanyCodeError || hasTaxCodeError) {
                        error = true;
                    }
                });
                return error;
            }
            POItems.CheckDataCoherency = CheckDataCoherency;
            function HasDeliveredItems() {
                var hasDeliveredItems = false;
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                    if (!line.GetValue("NoGoodsReceipt__") && line.GetValue("ItemUndeliveredQuantity__") == 0) {
                        hasDeliveredItems = true;
                    }
                });
                return hasDeliveredItems;
            }
            POItems.HasDeliveredItems = HasDeliveredItems;
            function HasNoGoodsReceiptItems(options) {
                var lineItems = Sys.Helpers.Data.GetTableAsArray("LineItems__");
                var todayDate = new Date();
                todayDate.setUTCHours(12, 0, 0, 0);
                // Query AP-PO Items to fetch invoiced items
                if (options.onlyNonInvoicedItems) {
                    var PONumber = Data.GetValue("OrderNumber__");
                    return QueryAPPOItems({ PONumber: PONumber, isInvoiced: false, isNoGoodsReceipt: true })
                        .Then(function (APPOItems) {
                        var noGRItems = GetNoGoodsReceiptItems(todayDate, lineItems, true, !options.onlyOutdatedItems);
                        // Removes items that are outdated but invoiced
                        var filteredNoGRItems = noGRItems.filter(function (noGRItem) { return APPOItems.find(function (APPOItem) { return APPOItem.ItemNumber__ === noGRItem.GetValue("LineItemNumber__").toString(); }); });
                        return filteredNoGRItems.length > 0;
                    });
                }
                return Sys.Helpers.Promise.Resolve(GetNoGoodsReceiptItems(todayDate, lineItems, true, !options.onlyOutdatedItems).length > 0);
            }
            POItems.HasNoGoodsReceiptItems = HasNoGoodsReceiptItems;
            function QueryPOItems(params) {
                var filters = [];
                var PONumber;
                var _a = params || {}, ancestorsid = _a.ancestorsid, orderNumber = _a.orderNumber, _b = _a.additionnalFilters, additionnalFilters = _b === void 0 ? [] : _b, orderByClause = _a.orderByClause;
                if (ancestorsid) {
                    filters.push(Sys.Helpers.LdapUtil.FilterEqual("PORUIDEX__", ancestorsid));
                }
                else {
                    PONumber = orderNumber || Variable.GetValueAsString("OrderNumber__");
                    if (PONumber) {
                        filters.push(Sys.Helpers.LdapUtil.FilterEqual("PONumber__", PONumber));
                    }
                }
                if (!(ancestorsid || PONumber || additionnalFilters.length > 0)) {
                    return Sys.Helpers.Promise.Reject("FillForm: error, no PO Number");
                }
                filters.push(Sys.Helpers.LdapUtil.FilterNotEqual("NoGoodsReceipt__", "true"));
                if (additionnalFilters.length > 0) {
                    filters = filters.concat(additionnalFilters);
                }
                var filter = Sys.Helpers.LdapUtil.FilterAnd.apply(null, filters);
                return Sys.GenericAPI.PromisedQuery({
                    table: POItemsDBInfo.table,
                    filter: filter.toString(),
                    attributes: ["*"],
                    sortOrder: orderByClause || "",
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: POItemsDBInfo.fieldsMap,
                        bigQuery: true
                    }
                })
                    .Then(function (dbItems) {
                    if (dbItems.length === 0) {
                        throw "FillForm: cannot find any PO items with filter: " + filter;
                    }
                    // need to sort by line number casted in integer (PO item LineNumber__ is a string...)
                    dbItems.sort(function (dbItem1, dbItem2) {
                        // Here GetValue returns integer because we provide a fieldToTypeMap to the recordBuilder
                        return dbItem1.GetValue("LineNumber__") - dbItem2.GetValue("LineNumber__");
                    });
                    return dbItems;
                })
                    .Catch(function (error) {
                    throw "FillForm: error querying PO items with filter. Details: " + error;
                });
            }
            POItems.QueryPOItems = QueryPOItems;
            function CheckContainsTypeItem(orderNumber) {
                if (!orderNumber) {
                    return Sys.Helpers.Promise.Reject("cannot check if PO contains order : missing PO number");
                }
                return Lib.Purchasing.POItems.QueryPOItems({ orderNumber: orderNumber }).Then(function (dbItems) {
                    var result = {
                        containsQuantityBasedItem: false,
                        containsAmountBasedItem: false,
                        containsServiceBasedItem: false
                    };
                    Sys.Helpers.Array.Every(dbItems, function (dbItem) {
                        switch (dbItem.GetValue("ItemType__")) {
                            case Lib.P2P.ItemType.QUANTITY_BASED:
                                result.containsQuantityBasedItem = true;
                                break;
                            case Lib.P2P.ItemType.AMOUNT_BASED:
                                result.containsAmountBasedItem = true;
                                break;
                            case Lib.P2P.ItemType.SERVICE_BASED:
                                result.containsServiceBasedItem = true;
                                break;
                            default:
                                break;
                        }
                        if (!result.containsServiceBasedItem) {
                            var allowed = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.AllowServiceEntrySheet", dbItem.GetValue("ContractNumber__"), dbItem.GetValue("CatalogReference__"), dbItem.GetValue("ItemType__"));
                            result.containsServiceBasedItem = allowed === true;
                        }
                    });
                    return result;
                }).Catch(function () { return false; });
            }
            POItems.CheckContainsTypeItem = CheckContainsTypeItem;
            function CheckIfOrderIsMultiShipTo(orderNumber) {
                if (Sys.Helpers.IsEmpty(orderNumber)) {
                    return Sys.Helpers.Promise.Reject("cannot check if PO contains order : missing PO number");
                }
                return Lib.Purchasing.POItems.QueryPOItems({ orderNumber: orderNumber })
                    .Then(function (dbItems) {
                    if (Lib.Purchasing.IsMultiShipTo()) {
                        var isAllSameAddress = Sys.Helpers.Array.Every(dbItems, function (item) {
                            return item.GetValue("ShipToCompany__") === dbItems[0].GetValue("ShipToCompany__") &&
                                item.GetValue("ShipToAddress__") === dbItems[0].GetValue("ShipToAddress__");
                        });
                        return !isAllSameAddress;
                    }
                    return false;
                })
                    .Catch(function () {
                    Log.Error("No item found for this order");
                    return false;
                });
            }
            POItems.CheckIfOrderIsMultiShipTo = CheckIfOrderIsMultiShipTo;
            function FillItems(queryParams, itemType) {
                return Lib.Purchasing.POItems.QueryPOItems(queryParams)
                    .Then(function (dbItems) {
                    Lib.Purchasing.Items.FillFormItems(dbItems, itemType);
                    return dbItems;
                });
            }
            POItems.FillItems = FillItems;
            function FillItemsInvoicedAmountAndQuantityFromAPPOItems(isBillingCompleted) {
                if (!isBillingCompleted) {
                    //no need to request items quantity and amount if we cancel the billing completed state
                    return Sys.Helpers.Promise.Resolve();
                }
                var options = {
                    table: "AP - Purchase order - Items__",
                    attributes: ["ItemNumber__", "OrderNumber__", "InvoicedQuantity__", "InvoicedAmount__"],
                    filter: Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", Data.GetValue("OrderNumber__"))
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResults) {
                    if (queryResults.length > 0) {
                        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                            for (var i = 0; i < queryResults.length; i++) {
                                if (queryResults[i].ItemNumber__ == item.GetValue("LineItemNumber__").toString()) {
                                    item.SetValue("ItemInvoicedQuantity__", queryResults[i].InvoicedQuantity__ ? queryResults[i].InvoicedQuantity__ : 0);
                                    item.SetValue("ItemInvoicedAmount__", queryResults[i].InvoicedAmount__ ? queryResults[i].InvoicedAmount__ : 0);
                                }
                            }
                        });
                    }
                    else {
                        Log.Error("FillItemsInvoicedAmountAndQuantityFromAPPOItems - No AP PO items found");
                        return Sys.Helpers.Promise.Reject("No AP PO items found");
                    }
                })
                    .Catch(function (error) {
                    Log.Error("FillItemsInvoicedAmountAndQuantityFromAPPOItems - Unable to query AP PO items : ".concat(error));
                    return Sys.Helpers.Promise.Reject("Unable to query AP PO items");
                });
            }
            POItems.FillItemsInvoicedAmountAndQuantityFromAPPOItems = FillItemsInvoicedAmountAndQuantityFromAPPOItems;
            function IsLineItemsInError() {
                var error = false;
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item /*, i*/) {
                    for (var itemName in PRItemsToPO.errorMessages) {
                        if (item.GetError(PRItemsToPO.mappings.byLine[itemName])) {
                            error = true;
                            break;
                        }
                    }
                    return error;
                });
                return error;
            }
            POItems.IsLineItemsInError = IsLineItemsInError;
            //#region BillingComplete
            function UpdateBillingCompletedOnPOItems(isBillingCompleted) {
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    item.SetValue("CheckBillingCompleted__", isBillingCompleted);
                });
            }
            POItems.UpdateBillingCompletedOnPOItems = UpdateBillingCompletedOnPOItems;
            function IsBillingCompleted() {
                // PO is considered as billing completed if at least one of items is billing completed because all items are set to billing completed
                return !!Sys.Helpers.Data.FindTableItem("LineItems__", function (item) {
                    return item.GetValue("CheckBillingCompleted__") === true;
                });
            }
            POItems.IsBillingCompleted = IsBillingCompleted;
            //#endregion
        })(POItems = Purchasing.POItems || (Purchasing.POItems = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
