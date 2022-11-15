///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_UpdateWaitingGR_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Custom library to change behavior of Lib_AP_UpdateWaitingGR",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_Comment_Helper_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_CSVReader",
    "[Lib_AP_UpdateWaitingGR_Parameters_V12.0.461.0]"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var UpdateWaitingGR;
        (function (UpdateWaitingGR) {
            var recallNeeded;
            var g_erpManagers = {};
            var cachePODate = {};
            function resetCachePOdate() {
                cachePODate = {};
            }
            UpdateWaitingGR.resetCachePOdate = resetCachePOdate;
            function initConfiguration(configuration) {
                // create configuration
                Variable.SetValueAsString("CurrentConfigurationInstance", configuration);
                Sys.Parameters.GetInstance(configuration).Init({
                    Default: {}
                }, {
                    tableParameters: {
                        tableName: "AP - Application Settings__",
                        configuration: configuration,
                        mode: Sys.Parameters.Mode.SettingsAsColumns
                    },
                    defaultEnvironment: "Default"
                }, {});
            }
            UpdateWaitingGR.initConfiguration = initConfiguration;
            function getERPManager(configuration, ERP, msnEx) {
                var key = "".concat(configuration, "-").concat(ERP);
                if (!g_erpManagers[key]) {
                    Lib.AP.UpdateWaitingGR.initConfiguration(configuration);
                    // use generic by default
                    g_erpManagers[key] = Lib.ERP.CreateManager(ERP || "generic");
                    if (!g_erpManagers[key] && msnEx) {
                        // try to get the real value ot ERPName on invoice
                        Lib.ERP.CreateManagerFromRecord("CDNAME#Vendor invoice", "(MsnEx=".concat(msnEx, ")"), function (result) {
                            g_erpManagers[key] = result;
                        });
                    }
                    if (g_erpManagers[key] && g_erpManagers[key].Init) {
                        g_erpManagers[key].Init(configuration);
                    }
                }
                return g_erpManagers[key];
            }
            UpdateWaitingGR.getERPManager = getERPManager;
            function addDateTwoHours(date) {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 2, date.getMinutes(), date.getSeconds());
            }
            UpdateWaitingGR.addDateTwoHours = addDateTwoHours;
            function addInvoiceInMap(invoice, configuration, ERP, invoiceType, orderNumbers, companyCode, invoicesToAwake, options) {
                var ordersArray = Lib.AP.GetOrderNumbersAsArray(orderNumbers);
                if (!ordersArray || ordersArray.length === 0) {
                    return 0;
                }
                var newElementPosition = invoicesToAwake.length;
                invoicesToAwake.push({
                    MSNEX: invoice,
                    Keys: [],
                    LastPOEventDate: null,
                    InvoicesSharingKey: []
                });
                for (var _i = 0, ordersArray_1 = ordersArray; _i < ordersArray_1.length; _i++) {
                    var orderNumber = ordersArray_1[_i];
                    var key = [configuration, ERP, companyCode, orderNumber, invoiceType].join("|");
                    if (!Object.prototype.hasOwnProperty.call(cachePODate, key)) {
                        cachePODate[key] = Lib.AP.UpdateWaitingGR.determinePOLastEventDate(orderNumber, companyCode, invoiceType, configuration, ERP, options);
                    }
                    if (cachePODate[key]) {
                        invoicesToAwake[newElementPosition].Keys.push(key);
                        if (!invoicesToAwake[newElementPosition].LastPOEventDate || cachePODate[key].getTime() > invoicesToAwake[newElementPosition].LastPOEventDate.getTime()) {
                            invoicesToAwake[newElementPosition].LastPOEventDate = cachePODate[key];
                        }
                        for (var inv = 0; inv < invoicesToAwake.length - 1; inv++) {
                            for (var _a = 0, _b = invoicesToAwake[inv].Keys; _a < _b.length; _a++) {
                                var invoiceToWakeKey = _b[_a];
                                if (invoiceToWakeKey === key) {
                                    invoicesToAwake[inv].InvoicesSharingKey.push(invoice);
                                    invoicesToAwake[newElementPosition].InvoicesSharingKey.push(invoicesToAwake[inv].MSNEX);
                                }
                            }
                        }
                    }
                }
                if (!invoicesToAwake[newElementPosition].LastPOEventDate) {
                    invoicesToAwake.pop();
                }
                return ordersArray.length;
            }
            UpdateWaitingGR.addInvoiceInMap = addInvoiceInMap;
            var csvHelper = null;
            function wakeUpInvoicesFromCSV(options) {
                if (!csvHelper && !Variable.GetValueAsString(Sys.Helpers.CSVReader.GetSerializeIdentifier())) {
                    csvHelper = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                    csvHelper.ReturnSeparator = "\n";
                    // read first line (Header line) and guess the separator
                    csvHelper.GuessSeparator();
                }
                else {
                    csvHelper = Sys.Helpers.CSVReader.ReloadInstance("V2");
                }
                // Vector containing all invoices to awake and the key is configuration|ERP|invoiceType|companycode|orderNumber
                var invoicesToAwake = [];
                recallNeeded = false;
                var count = 0;
                // Reads Csv and generates a map with a maximum of entries to limit memory consumption
                var line = csvHelper.GetNextLine();
                while (line || line === "") {
                    var lineArray = csvHelper.GetCurrentLineArray();
                    if (lineArray) {
                        var msnEx = lineArray[0];
                        var lineERP = lineArray[3] ? lineArray[3] : "";
                        var lineConfiguration = lineArray[4] ? lineArray[4] : "Default";
                        var invoiceType = lineArray[5] ? lineArray[5] : "PO-Invoice";
                        // Get ERP manager and perform init if required
                        var erpMgr = Lib.AP.UpdateWaitingGR.getERPManager(lineConfiguration, lineERP, msnEx);
                        if (erpMgr) {
                            count += Lib.AP.UpdateWaitingGR.addInvoiceInMap(msnEx, lineConfiguration, lineERP, invoiceType, lineArray[1], lineArray[2], invoicesToAwake, options);
                            if (count >= options.maxElementsPerRecall) {
                                recallNeeded = true;
                                break;
                            }
                        }
                    }
                    line = csvHelper.GetNextLine();
                }
                return invoicesToAwake;
            }
            UpdateWaitingGR.wakeUpInvoicesFromCSV = wakeUpInvoicesFromCSV;
            function IsSharePOWithSelectedInvoices(invoiceList1, invoiceList2) {
                for (var _i = 0, invoiceList1_1 = invoiceList1; _i < invoiceList1_1.length; _i++) {
                    var inv1 = invoiceList1_1[_i];
                    for (var _a = 0, invoiceList2_1 = invoiceList2; _a < invoiceList2_1.length; _a++) {
                        var inv2 = invoiceList2_1[_a];
                        if (inv1 === inv2) {
                            return false;
                        }
                    }
                }
                return true;
            }
            function searchForInvoicesToWakeUp(invoicesToAwake) {
                var invoiceRemaining = true;
                while (invoiceRemaining) {
                    invoiceRemaining = false;
                    var selectedInvoices = [];
                    var POLastEventDate = void 0;
                    for (var _i = 0, invoicesToAwake_1 = invoicesToAwake; _i < invoicesToAwake_1.length; _i++) {
                        var inv = invoicesToAwake_1[_i];
                        if (inv.MSNEX) {
                            if (selectedInvoices.length === 0) {
                                selectedInvoices.push(inv.MSNEX);
                                POLastEventDate = inv.LastPOEventDate;
                                inv.MSNEX = null;
                            }
                            else if (inv.LastPOEventDate.getTime() === POLastEventDate.getTime() && IsSharePOWithSelectedInvoices(selectedInvoices, inv.InvoicesSharingKey)) {
                                selectedInvoices.push(inv.MSNEX);
                                inv.MSNEX = null;
                            }
                            else {
                                invoiceRemaining = true;
                            }
                        }
                    }
                    if (selectedInvoices.length > 0) {
                        Lib.AP.UpdateWaitingGR.validateVIPsCheckGoodsReceipt(selectedInvoices, POLastEventDate);
                    }
                }
            }
            UpdateWaitingGR.searchForInvoicesToWakeUp = searchForInvoicesToWakeUp;
            function determinePOLastEventDate(orderNumber, companyCode, invoiceType, configuration, ERP, options) {
                var lastEventDate = null;
                var erpMgr = Lib.AP.UpdateWaitingGR.getERPManager(configuration, ERP);
                var POAsFITranslate = Language.Translate(Lib.AP.InvoiceType.PO_INVOICE_AS_FI);
                if (erpMgr.ERPName === "SAP" && invoiceType === POAsFITranslate) {
                    erpMgr = Lib.AP.UpdateWaitingGR.getERPManager(configuration, "generic");
                }
                lastEventDate = erpMgr.GetDocument("INVOICE").GetLastPODateUpdate(orderNumber, {
                    companyCode: companyCode,
                    limitHistoryToLastDays: options.limitHistoryToLastDays
                });
                if (lastEventDate) {
                    Log.Info("PO#" + orderNumber + " - Last goods receipt entered on " + Sys.Helpers.Date.Date2DBDateTime(lastEventDate));
                    lastEventDate = Lib.AP.UpdateWaitingGR.addDateTwoHours(lastEventDate);
                }
                else {
                    Log.Info("PO#" + orderNumber + " - No goods receipt found " + (options.limitHistoryToLastDays > 0 ? "in the last " + options.limitHistoryToLastDays + " days" : ""));
                }
                return lastEventDate;
            }
            UpdateWaitingGR.determinePOLastEventDate = determinePOLastEventDate;
            function validateVIPsCheckGoodsReceipt(invoicesToUpdate, lastUpdateTime) {
                if (invoicesToUpdate && invoicesToUpdate.length > 0) {
                    var awakenInvoices = false;
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.SetSpecificTable("CDNAME#Vendor invoice");
                    // Must select all these attributes to be able to call custom action checkgoodsreceipt
                    query.AddAttribute("OwnerId");
                    query.AddAttribute("OwnerPb");
                    query.AddAttribute("MainAccountId");
                    query.AddAttribute("ProcessId");
                    query.AddAttribute("MsnEx");
                    query.AddAttribute("RuidEx");
                    query.AddAttribute("State");
                    query.AddAttribute("CompanyCode__");
                    query.AddAttribute("VendorNumber__");
                    query.AddAttribute("OrderNumber__");
                    query.SetOptionEx("FastSearch=1");
                    var dbLastUpdateTime = Sys.Helpers.Date.Date2DBDateTime(lastUpdateTime);
                    var filter = "&(|(MsnEx=" + invoicesToUpdate.join(")(MsnEx=") + "))(State=70)(InvoiceStatus__=Set aside)(AsideReason__=Waiting for goods receipt)(LastSavedDateTime<" + dbLastUpdateTime + ")";
                    query.SetFilter(filter);
                    if (query.MoveFirst()) {
                        var trn = query.MoveNext();
                        while (trn) {
                            if (Lib.AP.UpdateWaitingGR.callCheckGoodReceiptAction(trn)) {
                                awakenInvoices = true;
                            }
                            trn = query.MoveNext();
                        }
                        if (!awakenInvoices) {
                            Log.Info("No vendor invoice found matching " + filter);
                        }
                    }
                }
            }
            UpdateWaitingGR.validateVIPsCheckGoodsReceipt = validateVIPsCheckGoodsReceipt;
            function callCheckGoodReceiptAction(trn) {
                var vars = trn.GetVars(false);
                var msnEx = vars.GetValue("MSNEX", 0);
                var updated = false;
                // Call the validate action "checkgoodsreceipt" for the current transport, and set invoice priority to low
                vars.AddValue_String("RequestedActions", "approve|checkgoodsreceipt", true);
                vars.AddValue_String("NeedValidation", "0", true);
                vars.AddValue_Long("Priority", 8, true);
                trn.Validate("Check for goods receipts");
                if (trn.GetLastError() !== 0) {
                    Log.Error("Cannot apply check goods receipt action for VIP " + msnEx + " " + trn.GetLastErrorMessage());
                }
                else {
                    Log.Info("Checking for goods receipt for invoice " + msnEx);
                    updated = true;
                }
                return updated;
            }
            UpdateWaitingGR.callCheckGoodReceiptAction = callCheckGoodReceiptAction;
            function UpdateInvoicesWaitingForGR(options) {
                g_erpManagers = {};
                var invoicesToWakeUp = Lib.AP.UpdateWaitingGR.wakeUpInvoicesFromCSV(options);
                Lib.AP.UpdateWaitingGR.searchForInvoicesToWakeUp(invoicesToWakeUp);
                for (var erp in g_erpManagers) {
                    if (Object.prototype.hasOwnProperty.call(g_erpManagers, erp) && g_erpManagers[erp] && g_erpManagers[erp].Finalize) {
                        g_erpManagers[erp].Finalize();
                    }
                }
                if (recallNeeded) {
                    csvHelper.SerializeCurrentState();
                    return 0;
                }
                return 1;
            }
            UpdateWaitingGR.UpdateInvoicesWaitingForGR = UpdateInvoicesWaitingForGR;
        })(UpdateWaitingGR = AP.UpdateWaitingGR || (AP.UpdateWaitingGR = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
