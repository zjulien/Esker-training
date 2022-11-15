/* LIB_DEFINITION{
  "name": "Lib_AP_PurchaseOrder_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "AP Library",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_TaxHelper_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var PurchaseOrder;
        (function (PurchaseOrder) {
            function GetBuyerAndReceiverFromPO(orderNumber) {
                var ret = {
                    buyer: "",
                    receiver: "",
                    diffInv: "",
                    customDimensions: {}
                };
                var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                var queryCallback = function (result, error) {
                    if (error) {
                        Log.Error("GetBuyerAndReceiverFromPO - First MoveNextRecord failed: " + error);
                    }
                    else if (result && result.length > 0) {
                        var record = result[0];
                        ret.buyer = record.Buyer__;
                        ret.receiver = record.Receiver__;
                        ret.diffInv = record.DifferentInvoicingParty__;
                        if (customDimensions && customDimensions.poHeader) {
                            for (var _i = 0, _a = customDimensions.poHeader; _i < _a.length; _i++) {
                                var customPoHeaderDimension = _a[_i];
                                ret.customDimensions[customPoHeaderDimension.nameInForm] = record[customPoHeaderDimension.nameInTable];
                            }
                        }
                    }
                };
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__"))).toString();
                var attributes = ["OrderNumber__", "Buyer__", "Receiver__", "DifferentInvoicingParty__"];
                if (customDimensions && customDimensions.poHeader) {
                    for (var _i = 0, _a = customDimensions.poHeader; _i < _a.length; _i++) {
                        var customPoHeaderDimension = _a[_i];
                        attributes.push(customPoHeaderDimension.nameInTable);
                    }
                }
                Sys.GenericAPI.Query(Lib.P2P.TableNames.POHeaders, filter, attributes, queryCallback, null, 1);
                return ret;
            }
            PurchaseOrder.GetBuyerAndReceiverFromPO = GetBuyerAndReceiverFromPO;
            function ComputeExpectedAndOpenValues(poItemVars, grItemVars) {
                function getValueAsFloat(itemVars, fieldname) {
                    return parseFloat(itemVars.GetValue_String(fieldname, 0) || "0");
                }
                function getValueAsBoolean(itemVars, fieldname) {
                    var fieldValue = itemVars.GetValue_Long(fieldname, 0);
                    return Sys.Helpers.IsEmpty(fieldValue) ? false : Boolean(fieldValue);
                }
                var invoiceLine = {};
                if (grItemVars) {
                    invoiceLine.openAmount = invoiceLine.expectedAmount = getValueAsFloat(grItemVars, "Amount__") - getValueAsFloat(grItemVars, "InvoicedAmount__");
                    invoiceLine.openQuantity = invoiceLine.expectedQuantity = getValueAsFloat(grItemVars, "Quantity__") - getValueAsFloat(grItemVars, "InvoicedQuantity__");
                    invoiceLine.deliveryNote = grItemVars.GetValue_String("DeliveryNote__", 0);
                    invoiceLine.goodReceipt = grItemVars.GetValue_String("GRNumber__", 0);
                    invoiceLine.noGoodsReceipt = false;
                }
                else {
                    invoiceLine.openAmount = getValueAsFloat(poItemVars, "OrderedAmount__") - getValueAsFloat(poItemVars, "InvoicedAmount__");
                    invoiceLine.openQuantity = getValueAsFloat(poItemVars, "OrderedQuantity__") - getValueAsFloat(poItemVars, "InvoicedQuantity__");
                    invoiceLine.expectedAmount = getValueAsFloat(poItemVars, "DeliveredAmount__") - getValueAsFloat(poItemVars, "InvoicedAmount__");
                    invoiceLine.expectedQuantity = getValueAsFloat(poItemVars, "DeliveredQuantity__") - getValueAsFloat(poItemVars, "InvoicedQuantity__");
                    invoiceLine.noGoodsReceipt = getValueAsBoolean(poItemVars, "NoGoodsReceipt__");
                }
                return invoiceLine;
            }
            PurchaseOrder.ComputeExpectedAndOpenValues = ComputeExpectedAndOpenValues;
            function CompleteInvoiceLine(invoiceLine, poItemVars, orderNumber, type, diffInv) {
                invoiceLine.orderNumber = orderNumber;
                invoiceLine.type = type;
                invoiceLine.itemNumber = poItemVars.GetValue_String("ItemNumber__", 0);
                invoiceLine.description = poItemVars.GetValue_String("Description__", 0);
                invoiceLine.taxCode = poItemVars.GetValue_String("TaxCode__", 0);
                invoiceLine.vendorNumber = poItemVars.GetValue_String("VendorNumber__", 0);
                invoiceLine.diffInv = diffInv;
                invoiceLine.partNumber = poItemVars.GetValue_String("PartNumber__", 0);
                invoiceLine.glAccount = poItemVars.GetValue_String("GLAccount__", 0);
                invoiceLine.costCenter = poItemVars.GetValue_String("CostCenter__", 0);
                invoiceLine.wbsElement = poItemVars.GetValue_String("WBSElement__", 0);
                invoiceLine.wbsElementID = poItemVars.GetValue_String("WBSElementID__", 0);
                invoiceLine.internalOrder = poItemVars.GetValue_String("InternalOrder__", 0);
                invoiceLine.unitPrice = poItemVars.GetValue_Double("UnitPrice__", 0);
                invoiceLine.orderedAmount = poItemVars.GetValue_Double("OrderedAmount__", 0);
                invoiceLine.orderedQuantity = poItemVars.GetValue_Double("OrderedQuantity__", 0);
                invoiceLine.previousBudgetID = poItemVars.GetValue_String("BudgetID__", 0);
                invoiceLine.isLocalPO = Boolean(poItemVars.GetValue_Long("IsLocalPO__", 0));
                invoiceLine.receiver = poItemVars.GetValue_String("Receiver__", 0);
                invoiceLine.taxRate = poItemVars.GetValue_Double("TaxRate__", 0);
                invoiceLine.nonDeductibleTaxRate = poItemVars.GetValue_Double("NonDeductibleTaxRate__", 0);
                invoiceLine.noGoodsReceipt = Boolean(poItemVars.GetValue_Long("NoGoodsReceipt__", 0));
                invoiceLine.unitOfMeasureCode = poItemVars.GetValue_String("UnitOfMeasureCode__", 0);
                invoiceLine.costType = poItemVars.GetValue_String("CostType__", 0);
                invoiceLine.itemType = poItemVars.GetValue_String("ItemType__", 0);
                invoiceLine.projectCode = poItemVars.GetValue_String("ProjectCode__", 0);
                invoiceLine.freeDimension1 = poItemVars.GetValue_String("FreeDimension1__", 0);
                invoiceLine.freeDimension1ID = poItemVars.GetValue_String("FreeDimension1ID__", 0);
                return invoiceLine;
            }
            PurchaseOrder.CompleteInvoiceLine = CompleteInvoiceLine;
            function AddBuyerAndReceiverInInvoiceLine(invoiceLine, buyer, receiver, orderNumber) {
                if (buyer && receiver) {
                    invoiceLine.buyer = buyer;
                    invoiceLine.receiver = receiver;
                }
                else {
                    var retBuyerReceiver = Lib.AP.PurchaseOrder.GetBuyerAndReceiverFromPO(orderNumber);
                    invoiceLine.buyer = buyer ? buyer : retBuyerReceiver.buyer;
                    if (!invoiceLine.receiver) {
                        invoiceLine.receiver = receiver ? receiver : retBuyerReceiver.receiver;
                    }
                    if (retBuyerReceiver.diffInv) {
                        invoiceLine.diffInv = retBuyerReceiver.diffInv;
                    }
                    invoiceLine.customDimensions = retBuyerReceiver.customDimensions;
                }
            }
            PurchaseOrder.AddBuyerAndReceiverInInvoiceLine = AddBuyerAndReceiverInInvoiceLine;
            function FillLine(poItemVars, grItemVars, orderNumber, ret, type, buyer, receiver, diffInv, customPOHeaderVars) {
                var invoiceLine = Lib.AP.PurchaseOrder.ComputeExpectedAndOpenValues(poItemVars, grItemVars);
                var addPoLine = invoiceLine.expectedAmount !== 0 || invoiceLine.expectedQuantity !== 0;
                var addPoLineUE = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.PurchaseOrder.AddPoLine", addPoLine, poItemVars, grItemVars);
                addPoLine = typeof addPoLineUE === "boolean" ? addPoLineUE : addPoLine;
                // Only add the lines which are expected to be invoiced
                if (addPoLine) {
                    Lib.AP.PurchaseOrder.CompleteInvoiceLine(invoiceLine, poItemVars, orderNumber, type, diffInv);
                    Lib.AP.PurchaseOrder.AddBuyerAndReceiverInInvoiceLine(invoiceLine, buyer, receiver, orderNumber);
                    // Custom dimensions
                    var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                    if (customDimensions && (customDimensions.poItems || customDimensions.grItems || customDimensions.poHeader)) {
                        invoiceLine.customDimensions = invoiceLine.customDimensions || {};
                        if (customDimensions.poItems && poItemVars) {
                            for (var _i = 0, _a = Object.keys(customDimensions.poItems); _i < _a.length; _i++) {
                                var i = _a[_i];
                                invoiceLine.customDimensions[customDimensions.poItems[i].nameInForm] = poItemVars.GetValue(customDimensions.poItems[i].nameInTable, 0);
                            }
                        }
                        if (customDimensions.grItems && grItemVars) {
                            for (var _b = 0, _c = Object.keys(customDimensions.grItems); _b < _c.length; _b++) {
                                var i = _c[_b];
                                invoiceLine.customDimensions[customDimensions.grItems[i].nameInForm] = grItemVars.GetValue(customDimensions.grItems[i].nameInTable, 0);
                            }
                        }
                        if (customDimensions.poHeader && customPOHeaderVars) {
                            for (var _d = 0, _e = customDimensions.poHeader; _d < _e.length; _d++) {
                                var headerField = _e[_d];
                                invoiceLine.customDimensions[headerField.nameInForm] = customPOHeaderVars.GetValue(headerField.nameInTable, 0);
                            }
                        }
                    }
                    // Add line item in invoice
                    var poLine = Lib.AP.UpdateOrAddPOLine(invoiceLine);
                    if (ret && (poLine.updated || poLine.added)) {
                        if (invoiceLine.deliveryNote && ret.deliveryNotes.indexOf(invoiceLine.deliveryNote) < 0) {
                            ret.deliveryNotes.push(invoiceLine.deliveryNote);
                        }
                        if (orderNumber && ret.orderNumbers.indexOf(orderNumber) < 0) {
                            ret.orderNumbers.push(orderNumber);
                        }
                    }
                    return poLine.item;
                }
                return null;
            }
            PurchaseOrder.FillLine = FillLine;
            function AddOrUpdateLineFromPO(recordVars, orderNumber, ret) {
                var tabReturn = [];
                var returnItem = Lib.AP.PurchaseOrder.FillLine(recordVars, null, orderNumber, ret);
                if (returnItem) {
                    tabReturn.push(returnItem);
                }
                return tabReturn;
            }
            PurchaseOrder.AddOrUpdateLineFromPO = AddOrUpdateLineFromPO;
            function AddOrUpdateLineFromGRItems(recordVars, orderNumber, ret) {
                var tabReturn = [];
                var lineNumber = recordVars.GetValue_String("ItemNumber__", 0);
                var queryForGoodReceipt = Process.CreateQuery();
                queryForGoodReceipt.Reset();
                queryForGoodReceipt.SetAttributesList("*");
                queryForGoodReceipt.SetSpecificTable("P2P - Goods receipt - Items__");
                var filter = "&(!(Status__=Canceled))(OrderNumber__=" + orderNumber + ")(LineNumber__=" + lineNumber + ")";
                filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                queryForGoodReceipt.SetFilter(filter);
                queryForGoodReceipt.SetSortOrder("GRNumber__ ASC");
                if (queryForGoodReceipt.MoveFirst()) {
                    var record = queryForGoodReceipt.MoveNextRecord();
                    while (record) {
                        var grItemVars = record.GetVars();
                        var returnItem = Lib.AP.PurchaseOrder.FillLine(recordVars, grItemVars, orderNumber, ret);
                        if (returnItem) {
                            tabReturn.push(returnItem);
                        }
                        record = queryForGoodReceipt.MoveNextRecord();
                    }
                }
                return tabReturn;
            }
            PurchaseOrder.AddOrUpdateLineFromGRItems = AddOrUpdateLineFromGRItems;
            function CheckGoodsReceipt() {
                var ret = {
                    orderNumbers: [],
                    deliveryNotes: []
                };
                if (!Lib.AP.InvoiceType.isPOInvoice() && !Lib.AP.InvoiceType.isPOGLInvoice()) {
                    return ret;
                }
                var filter;
                var orderNumbers = Lib.AP.GetOrderNumbersAsArray();
                var query = Process.CreateQuery();
                var poItemsByPO = {};
                if (!orderNumbers || orderNumbers.length <= 0) {
                    Log.Warn("CheckGoodsReceipt : no order number found.");
                    return ret;
                }
                query.SetSpecificTable("AP - Purchase order - Items__");
                query.SetAttributesList("*");
                query.SetSortOrder("OrderNumber__ ASC, ItemNumber__ ASC");
                if (orderNumbers.length === 1) {
                    filter = "(&(OrderNumber__=" + orderNumbers + ")(CompanyCode__=" + Data.GetValue("CompanyCode__") + "))";
                }
                else {
                    filter = "(&(|(OrderNumber__=" + orderNumbers.join(")(OrderNumber__=") + "))(CompanyCode__=" + Data.GetValue("CompanyCode__") + "))";
                }
                query.SetFilter(filter);
                if (!query.MoveFirst()) {
                    Log.Error("MoveFirst failed: " + Query.GetLastErrorMessage());
                    return ret;
                }
                // Retrieves the first record and checks for any error.
                var record = query.MoveNextRecord();
                if (query.GetLastError()) {
                    Log.Error("CheckGoodsReceipt - First MoveNextRecord failed: " + query.GetLastErrorMessage());
                    return ret;
                }
                else if (!record) {
                    Log.Warn("CheckGoodsReceipt - No record found!");
                    return ret;
                }
                while (record) {
                    var recordVars = record.GetVars();
                    var orderNumber = recordVars.GetValue_String("OrderNumber__", 0);
                    var grivByLineAvailable = recordVars.GetValue_Long("GRIV__", 0) === 1 && Lib.P2P.IsGRIVEnabledByLine();
                    if (Lib.P2P.IsGRIVEnabledGlobally() || grivByLineAvailable) {
                        if (!poItemsByPO[orderNumber]) {
                            poItemsByPO[orderNumber] = Lib.AP.PurchaseOrder.AddOrUpdateLineFromGRItems(recordVars, orderNumber, ret);
                        }
                        else {
                            poItemsByPO[orderNumber] = poItemsByPO[orderNumber].concat(Lib.AP.PurchaseOrder.AddOrUpdateLineFromGRItems(recordVars, orderNumber, ret));
                        }
                    }
                    else if (!poItemsByPO[orderNumber]) {
                        poItemsByPO[orderNumber] = Lib.AP.PurchaseOrder.AddOrUpdateLineFromPO(recordVars, orderNumber, ret);
                    }
                    else {
                        poItemsByPO[orderNumber] = poItemsByPO[orderNumber].concat(Lib.AP.PurchaseOrder.AddOrUpdateLineFromPO(recordVars, orderNumber, ret));
                    }
                    // Retrieves the next record.
                    record = query.MoveNextRecord();
                }
                // Clean lines not matching any line in the master data
                for (var j = 0; j < orderNumbers.length; j++) {
                    if (!poItemsByPO[orderNumbers[j]]) {
                        poItemsByPO[orderNumbers[j]] = [];
                    }
                    Lib.AP.ClearUnprocessedLineItems(orderNumbers[j], poItemsByPO[orderNumbers[j]]);
                }
                return ret;
            }
            PurchaseOrder.CheckGoodsReceipt = CheckGoodsReceipt;
            function loadTableLine(lineItems, i, poLine) {
                var row = lineItems.GetItem(i);
                if (row.GetValue("LineType__") === Lib.P2P.LineType.PO) {
                    var orderNumber = row.GetValue("OrderNumber__");
                    var lineNumber = row.GetValue("ItemNumber__");
                    var goodReceiptNumber = row.GetValue("GoodsReceipt__");
                    if (!goodReceiptNumber) {
                        if (!poLine.poItems[orderNumber]) {
                            poLine.poItems[orderNumber] = {};
                        }
                        poLine.poItems[orderNumber][lineNumber] = { "lineOnTable": i };
                    }
                    else {
                        if (!poLine.grItems[orderNumber]) {
                            poLine.grItems[orderNumber] = {};
                        }
                        if (!poLine.grItems[orderNumber][lineNumber]) {
                            poLine.grItems[orderNumber][lineNumber] = {};
                        }
                        poLine.grItems[orderNumber][lineNumber][goodReceiptNumber] = { "lineOnTable": i };
                    }
                }
            }
            PurchaseOrder.loadTableLine = loadTableLine;
            function UpdateExpectedValuesOnPOLine() {
                var apShouldCheckInvoice = false;
                function GetRoundValueWithPrecision(value, rowItem, fieldName) {
                    var properties = rowItem.GetProperties(fieldName);
                    var precision = properties.precision || 2;
                    return Sys.Helpers.Round(value, precision);
                }
                var updatePOLine = function (lineIdx, poItemValues) {
                    var _a;
                    var row = lineItems.GetItem(lineIdx);
                    var valueToVerify = {
                        ExpectedAmount__: GetRoundValueWithPrecision(poItemValues.expectedAmount, row, "ExpectedAmount__"),
                        ExpectedQuantity__: GetRoundValueWithPrecision(poItemValues.expectedQuantity, row, "ExpectedQuantity__"),
                        OpenAmount__: GetRoundValueWithPrecision(poItemValues.openAmount, row, "OpenAmount__"),
                        OpenQuantity__: GetRoundValueWithPrecision(poItemValues.openQuantity, row, "OpenQuantity__"),
                        NoGoodsReceipt__: (_a = poItemValues.noGoodsReceipt) !== null && _a !== void 0 ? _a : false
                    };
                    for (var val in valueToVerify) {
                        if (row.GetValue(val) !== valueToVerify[val]) {
                            row.SetValue(val, valueToVerify[val]);
                            if ((val.indexOf("Amount__") > -1 && valueToVerify[val] < row.GetValue("Amount__")) ||
                                (val.indexOf("Quantity__") > -1 && valueToVerify[val] < row.GetValue("Quantity__"))) {
                                apShouldCheckInvoice = true;
                            }
                        }
                    }
                };
                var po, filter, record, recordVars, orderNumber;
                var poLine = {
                    poItems: {},
                    grItems: {}
                };
                var lineItems = Data.GetTable("LineItems__");
                for (var i = 0; i < lineItems.GetItemCount(); i++) {
                    Lib.AP.PurchaseOrder.loadTableLine(lineItems, i, poLine);
                }
                // Update the values on the po line items
                var orderNumbers = [];
                for (var _i = 0, _a = Object.keys(poLine.poItems); _i < _a.length; _i++) {
                    po = _a[_i];
                    orderNumbers.push(po);
                }
                if (orderNumbers.length > 0) {
                    var query = Process.CreateQuery();
                    query.SetSpecificTable("AP - Purchase order - Items__");
                    query.SetAttributesList("OrderNumber__,ItemNumber__,OrderedAmount__,DeliveredAmount__,InvoicedAmount__,OrderedQuantity__,DeliveredQuantity__,InvoicedQuantity__,NoGoodsReceipt__");
                    if (orderNumbers.length === 1) {
                        filter = ("(OrderNumber__=" + orderNumbers[0] + ")").AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    }
                    else {
                        filter = ("(|(OrderNumber__=" + orderNumbers.join(")(OrderNumber__=") + "))").AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    }
                    query.SetFilter(filter);
                    query.MoveFirst();
                    record = query.MoveNextRecord();
                    while (record) {
                        recordVars = record.GetVars();
                        orderNumber = recordVars.GetValue_String("OrderNumber__", 0);
                        var LineNumber = recordVars.GetValue_String("ItemNumber__", 0);
                        var poLineFound = poLine.poItems[orderNumber][LineNumber];
                        if (poLineFound) {
                            var poItemValues = Lib.AP.PurchaseOrder.ComputeExpectedAndOpenValues(recordVars, null);
                            updatePOLine(poLineFound.lineOnTable, poItemValues);
                            poLine.poItems[orderNumber][LineNumber] = null;
                        }
                        record = query.MoveNextRecord();
                    }
                    for (var _b = 0, _c = Object.keys(poLine.poItems); _b < _c.length; _b++) {
                        po = _c[_b];
                        for (var _d = 0, _e = Object.keys(poLine.poItems[po]); _d < _e.length; _d++) {
                            var lineNumber = _e[_d];
                            // po line not found in db
                            var poLineNotFound = poLine.poItems[po][lineNumber];
                            if (poLineNotFound) {
                                // consider all expected/open amount/quantity are 0
                                updatePOLine(poLineNotFound.lineOnTable, { expectedAmount: 0, expectedQuantity: 0, openAmount: 0, openQuantity: 0 });
                                lineItems.GetItem(poLineNotFound.lineOnTable).SetWarning("Description__", "_PO line does not exist anymore");
                            }
                        }
                    }
                }
                // Update values on the GR line items
                for (var _f = 0, _g = Object.keys(poLine.grItems); _f < _g.length; _f++) {
                    po = _g[_f];
                    var queryForGoodReceipt = Process.CreateQuery();
                    for (var _h = 0, _j = Object.keys(poLine.grItems[po]); _h < _j.length; _h++) {
                        var lineNumber = _j[_h];
                        queryForGoodReceipt.Reset();
                        queryForGoodReceipt.SetSpecificTable("P2P - Goods receipt - Items__");
                        queryForGoodReceipt.SetAttributesList("OrderNumber__,LineNumber__,GRNumber__,Amount__,InvoicedAmount__,Quantity__,InvoicedQuantity__");
                        filter = ("(&(OrderNumber__=" + po + ")(LineNumber__=" + lineNumber + "))").AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                        queryForGoodReceipt.SetFilter(filter);
                        queryForGoodReceipt.MoveFirst();
                        record = queryForGoodReceipt.MoveNextRecord();
                        while (record) {
                            recordVars = record.GetVars();
                            orderNumber = recordVars.GetValue_String("OrderNumber__", 0);
                            var GRNumber = recordVars.GetValue_String("GRNumber__", 0);
                            var grLineFound = poLine.grItems[orderNumber][lineNumber][GRNumber];
                            if (grLineFound) {
                                var poItemValues = Lib.AP.PurchaseOrder.ComputeExpectedAndOpenValues(null, recordVars);
                                updatePOLine(grLineFound.lineOnTable, poItemValues);
                                poLine.grItems[orderNumber][lineNumber][GRNumber] = null;
                            }
                            record = queryForGoodReceipt.MoveNextRecord();
                        }
                        for (var _k = 0, _l = Object.keys(poLine.grItems[po][lineNumber]); _k < _l.length; _k++) {
                            var GRNumber = _l[_k];
                            var grLineNotFound = poLine.grItems[po][lineNumber][GRNumber];
                            // gr line not found in db
                            if (grLineNotFound) {
                                // consider all expected/open amount/quantity are 0
                                updatePOLine(grLineNotFound.lineOnTable, { expectedAmount: 0, expectedQuantity: 0, openAmount: 0, openQuantity: 0 });
                                lineItems.GetItem(grLineNotFound.lineOnTable).SetWarning("Description__", "_GR line does not exist anymore");
                            }
                        }
                    }
                }
                return apShouldCheckInvoice;
            }
            PurchaseOrder.UpdateExpectedValuesOnPOLine = UpdateExpectedValuesOnPOLine;
        })(PurchaseOrder = AP.PurchaseOrder || (AP.PurchaseOrder = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
