/* LIB_DEFINITION{
  "name": "Lib_AP_Budget_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Budget library for Invoice",
  "require": [
    "Lib_Budget_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "[Lib_Budget_Updater_V12.0.461.0]",
    "Lib_P2P_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "Sys/Sys_Decimal"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Budget;
        (function (Budget) {
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            Lib.Budget.ExtendConfiguration({
                GetBudgetKeyColumns: Lib.P2P.GetBudgetKeyColumns,
                sourceTypes: {
                    // Configuration used for the new document in package V2
                    "30": {
                        CheckSourceType: function (document) {
                            if (Sys.ScriptInfo.IsClient()) {
                                return Process.GetName() === "Vendor invoice";
                            }
                            var processID = document ? document.GetUninheritedVars().GetValue_String("ProcessId", 0) : Data.GetValue("ProcessId");
                            return processID === Process.GetProcessID("Vendor invoice");
                        },
                        IsEmptyItem: function (item) {
                            return Lib.P2P.InvoiceLineItem.IsEmpty(item);
                        },
                        DeduceImpactAction: function (data, options) {
                            var postingDate = data.GetValue("ERPPostingDate__");
                            var state = parseInt(options.stateToDeduceImpactAction || Lib.Budget.GetBuiltinDocumentValue(options.document, "State"), 10);
                            var status = data.GetValue("InvoiceStatus__");
                            return postingDate && state <= 100 && status != "Rejected" ? "invoiced" : "none";
                        },
                        PrepareImpact: function (data, impactAction, item /*, i*/) {
                            var amountFactor = 1;
                            if (impactAction === "none") {
                                return new Lib.Budget.Impact();
                            }
                            else if (impactAction === "invoiceReversed") {
                                amountFactor = -1;
                            }
                            var currencyLocal = CurrencyFactory.Get(data.GetValue("LocalCurrency__"));
                            var taxeAndExchangeFactor = new Sys.Decimal(item.GetValue("NonDeductibleTaxRate__") || 0)
                                .div(100)
                                .add(1)
                                .mul(item.GetValue("ItemExchangeRate__") || data.GetValue("ExchangeRate__") || 1);
                            var invoiceAmount = Sys.Helpers.Round(taxeAndExchangeFactor
                                .mul(item.GetValue("Amount__") || 0), currencyLocal.amountPrecision);
                            if (Lib.P2P.InvoiceLineItem.IsGLLineItem(item)) {
                                return new Lib.Budget.Impact({
                                    InvoicedNonPO__: invoiceAmount.mul(amountFactor).toNumber()
                                });
                            }
                            // Round buy amountPrecision and not unitPricePrecision, because in PO we can receive one item by one
                            var unitPriceWithTaxeAndExchangeRate = Sys.Helpers.Round(taxeAndExchangeFactor
                                .mul(item.GetValue("UnitPrice__") || 0), currencyLocal.amountPrecision);
                            var previousBudgetID = item.GetValue("PreviousBudgetID__");
                            var expectedInvoicedAmount = Sys.Helpers.Round(unitPriceWithTaxeAndExchangeRate.mul(item.GetValue("Quantity__") || 0), currencyLocal.amountPrecision);
                            // The impact on the Received column can not exceed the previously received amount
                            // So no need to know that it's the last reception
                            // We need to know if there will be no more invoices to correct the Received column
                            // in case not all received items will be invoiced
                            // Since we don't have the information, we consider that all received items will be invoiced
                            // If needed, the invoice now contains a deliveryCompleted column
                            var noGoodsReceiptVal = item.GetValue("NoGoodsReceipt__");
                            if (noGoodsReceiptVal === true || noGoodsReceiptVal === "1") {
                                return new Lib.Budget.MultiImpact([
                                    {
                                        budgetID: previousBudgetID,
                                        impact: new Lib.Budget.Impact({
                                            Ordered__: expectedInvoicedAmount.mul(-1).mul(amountFactor).toNumber()
                                        })
                                    },
                                    {
                                        budgetID: "",
                                        impact: new Lib.Budget.Impact({
                                            InvoicedPO__: invoiceAmount.mul(amountFactor).toNumber()
                                        })
                                    }
                                ]);
                            }
                            return new Lib.Budget.MultiImpact([
                                {
                                    budgetID: previousBudgetID,
                                    impact: new Lib.Budget.Impact({
                                        Received__: expectedInvoicedAmount.mul(-1).mul(amountFactor).toNumber()
                                    })
                                },
                                {
                                    budgetID: "",
                                    impact: new Lib.Budget.Impact({
                                        InvoicedPO__: invoiceAmount.mul(amountFactor).toNumber()
                                    })
                                }
                            ]);
                        },
                        formTable: "LineItems__",
                        mappings: {
                            common: {
                                "OperationID__": "InvoiceNumber__",
                                "CompanyCode__": "CompanyCode__",
                                "Note__": "InvoiceDescription__",
                                "VendorNumber__": "VendorNumber__",
                                "VendorName__": "VendorName__"
                            },
                            byLine: {
                                "BudgetID__": "BudgetID__",
                                "PeriodCode__": getInvoiceImpactDate,
                                "CostCenter__": "CostCenter__",
                                "Group__": "Group__"
                            }
                        }
                    }
                }
            });
            var poDataCache = {};
            /**
             * Return the receipt or requested receipt date for a specific item
             */
            function getItemReceiptDate(invoiceItem) {
                // add a local cache for the purchase order data
                poDataCache = poDataCache || {};
                var orderNumber = invoiceItem.GetValue("OrderNumber__");
                if (!poDataCache[orderNumber]) {
                    poDataCache[orderNumber] = Lib.P2P.QueryPOFormData(orderNumber);
                }
                var poData = poDataCache[orderNumber];
                var receiptDate = null;
                if (poData) {
                    // Use the requested receipt date for unreceived item (on PO form)
                    // we find the most recent delivery date
                    var table = poData.GetTable("LineItems__");
                    for (var i = 0; i < table.GetItemCount(); i++) {
                        var line = table.GetItem(i);
                        var reqDeliveryDate = Sys.Helpers.Date.ISOSTringToDate(line.GetValue("ItemRequestedDeliveryDate__"));
                        if (reqDeliveryDate && (!receiptDate || Sys.Helpers.Date.CompareDate(receiptDate, reqDeliveryDate) > 0)) {
                            receiptDate = reqDeliveryDate;
                        }
                    }
                }
                return Sys.Helpers.Date.Date2DBDate(receiptDate);
            }
            /**
             * Return the date for the BudgetImpact object based on invoice line type
             **/
            function getInvoiceImpactDate(item, data) {
                var impactDate;
                var postingDate = data.GetValue("PostingDate__");
                if (!postingDate) {
                    var extPostingDate = new Date(Variable.GetValueAsString("PostingDate__"));
                    if (extPostingDate) {
                        postingDate = extPostingDate;
                        Log.Warn("The posting date is empty and the budget is executed with a posting date posting date found in external variable");
                    }
                    else {
                        postingDate = new Date();
                        Log.Warn("The posting date is empty and the budget is executed with a posting date equal to today");
                    }
                }
                if (Lib.P2P.InvoiceLineItem.IsGLLineItem(item)) {
                    impactDate = postingDate instanceof Date ? Sys.Helpers.Date.Date2DBDate(postingDate) : postingDate;
                }
                else {
                    impactDate = getItemReceiptDate(item);
                    if (!impactDate) {
                        impactDate = postingDate instanceof Date ? Sys.Helpers.Date.Date2DBDate(postingDate) : postingDate;
                    }
                }
                return impactDate;
            }
            function FillItemBudgetID(budgets) {
                // for PO item, BudgetID__ is filled in customScript from "AP - Purchase order - Items__"
                // for Non PO item, BudgetID__ is known after GetBudgets during UpdateBudgets --> filling
                // Do nothing in recovery
                if (!(budgets.options && budgets.options.document)) {
                    var formTable = budgets.sourceTypeConfig.formTable;
                    Sys.Helpers.Data.ForEachTableItem(formTable, function (item, i) {
                        var budgetID = budgets.byItemIndex[i];
                        if (Sys.Helpers.IsString(budgetID)) {
                            item.SetValue("BudgetID__", budgetID);
                        }
                    });
                }
            }
            function UpdateBudgets(options) {
                var promise = Sys.Helpers.Promise.Create(function (resolve, reject) {
                    Lib.Budget.GetBudgets(options)
                        .Then(function (budgets) {
                        FillItemBudgetID(budgets);
                        Lib.Budget.UpdateBudgets(budgets)
                            .Then(resolve)
                            .Catch(function (error) {
                            if (error instanceof Lib.Budget.PreventConcurrentAccessError) {
                                Lib.CommonDialog.NextAlert.Define("_Budget update error", "_ValidationErrorBudgetLocked");
                            }
                            reject(error);
                        });
                    })
                        .Catch(reject);
                });
                promise.Catch(function (error) {
                    Log.Error("[UpdateBudgets] Unexpected error: " + error);
                });
                return Sys.Helpers.Promise.IsResolvedSync(promise);
            }
            function AsInvoiced(transport) {
                return UpdateBudgets({
                    impactAction: "invoiced",
                    checkRemainingBudgets: false,
                    document: transport
                });
            }
            Budget.AsInvoiced = AsInvoiced;
            function AsInvoiceReversed(transport) {
                return UpdateBudgets({
                    impactAction: "invoiceReversed",
                    checkRemainingBudgets: false,
                    document: transport
                });
            }
            Budget.AsInvoiceReversed = AsInvoiceReversed;
            function GetPreviousBudgetIDByItems(formData) {
                Log.Info("Querying previous budget ID for the PO line items...");
                var previousBudgetIDByItems = [];
                var tableName = "AP - Purchase order - Items__";
                if (!Sys.Helpers.IsEmpty(Process.GetProcessID(tableName))) {
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.AddAttribute("*");
                    query.SetSpecificTable(tableName);
                    var filterParts_1 = [];
                    var lineItems = formData.GetTable("LineItems__");
                    Sys.Helpers.Data.ForEachTableItem(lineItems, function (item) {
                        if (!Lib.P2P.InvoiceLineItem.IsGLLineItem(item)) {
                            var orderNumber = item.GetValue("OrderNumber__");
                            var itemNumber = item.GetValue("ItemNumber__");
                            filterParts_1.push("(&(OrderNumber__=".concat(orderNumber, ")(ItemNumber__=").concat(itemNumber, "))"));
                        }
                    });
                    var filter = "(|".concat(filterParts_1.join(""), ")").AddCompanyCodeFilter(formData.GetValue("CompanyCode__"));
                    Log.Info("Selecting items with filter: " + filter);
                    query.SetFilter(filter);
                    query.MoveFirst();
                    var record = query.MoveNextRecord();
                    while (record) {
                        var vars = record.GetVars();
                        var orderNumberOnRecord = vars.GetValue_String("OrderNumber__", 0);
                        var itemNumberOnRecord = vars.GetValue_String("ItemNumber__", 0);
                        for (var i = 0; i < lineItems.GetItemCount(); i++) {
                            var lineItem = lineItems.GetItem(i);
                            var orderNumberOnLineItem = lineItem.GetValue("OrderNumber__");
                            var itemNumberOnLineItem = lineItem.GetValue("ItemNumber__");
                            if (orderNumberOnRecord == orderNumberOnLineItem && itemNumberOnRecord == itemNumberOnLineItem) {
                                var previousBudgetID = vars.GetValue_String("BudgetID__", 0);
                                previousBudgetIDByItems[i] = previousBudgetID;
                                break;
                            }
                        }
                        record = query.MoveNextRecord();
                    }
                }
                return previousBudgetIDByItems;
            }
            Budget.GetPreviousBudgetIDByItems = GetPreviousBudgetIDByItems;
        })(Budget = AP.Budget || (AP.Budget = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
