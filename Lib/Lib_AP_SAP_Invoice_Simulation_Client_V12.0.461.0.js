///#GLOBALS Sys
/* LIB_DEFINITION{
  "name": "LIB_AP_SAP_INVOICE_SIMULATION_CLIENT_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "library: SAP FI post routines.",
  "require": [
    "Lib_AP_SAP_Client_V12.0.461.0",
    "Lib_AP_SAP_Invoice_Client_V12.0.461.0",
    "Lib_AP_SAP_Invoice_Logistic_Client_V12.0.461.0",
    "LIB_P2P_SAP_SOAP_Client_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Browse",
    "Sys/Sys_Helpers_Synchronizer",
    "Sys/Sys_Helpers_SAP_Client"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var Invoice;
            (function (Invoice) {
                var Simulate;
                (function (Simulate) {
                    function CommonReportInit() {
                        return {
                            IsInit: false,
                            CounterByType: {
                                errors: 0,
                                informations: 0,
                                success: 0,
                                warnings: 0
                            },
                            Header: { Title: Language.Translate("_Simulation results") },
                            MessageSet: {
                                warnings: {
                                    label: Language.Translate("_WARNINGS"),
                                    texts: []
                                },
                                errors: {
                                    label: Language.Translate("_ERRORS"),
                                    texts: []
                                },
                                informations: {
                                    label: Language.Translate("_INFOS"),
                                    texts: []
                                },
                                messages: {
                                    label: Language.Translate("_MESSAGE"),
                                    texts: []
                                }
                            }
                        };
                    }
                    Simulate.CommonReportInit = CommonReportInit;
                    function CommonParamsInit(isMM) {
                        var bapiParams;
                        if (isMM) {
                            bapiParams = {
                                EXPORTS: { HEADERDATA: {} },
                                TABLES: {
                                    ITEMDATA: [],
                                    GLACCOUNTDATA: [],
                                    ACCOUNTINGINFO: [],
                                    TAXDATA: [],
                                    WITHTAXDATA: [],
                                    ACCOUNTINGDATA: []
                                }
                            };
                        }
                        else {
                            bapiParams = {
                                EXPORTS: { DOCUMENTHEADER: {} },
                                TABLES: {
                                    ACCOUNTGL: [],
                                    ACCOUNTPAYABLE: [],
                                    ACCOUNTTAX: [],
                                    CURRENCYAMOUNT: [],
                                    ACCOUNTWT: []
                                }
                            };
                        }
                        return {
                            Baseline_Date: "",
                            Invoice_Payment_Terms: "",
                            Invoice_Payment_Block: "",
                            SimulateInvoiceTotalLineNumber: "999999",
                            TaxJurisdictionLength: 0,
                            bHideZeroAmountTaxes: true,
                            Subsequent_Doc: false,
                            IsSimulation: true,
                            Exception: "",
                            Bapi: bapiParams,
                            Accounts: {},
                            companyCodePeriods: {}
                        };
                    }
                    Simulate.CommonParamsInit = CommonParamsInit;
                    function HandleSimulationResults(jsonResult, params, callback) {
                        var responseErr;
                        if (jsonResult.ERRORS && jsonResult.ERRORS.length > 0) {
                            responseErr = jsonResult.ERRORS[0].err;
                        }
                        else if (jsonResult.GetQueryError) {
                            responseErr = jsonResult.GetQueryError();
                        }
                        if (responseErr) {
                            Sys.Helpers.SAP.SetLastError(responseErr);
                            params.Exception = Sys.Helpers.SAP.GetLastError();
                            callback("An exception occurred during simulation: " + params.Exception);
                        }
                        else {
                            params.Bapi = jsonResult;
                            callback();
                        }
                    }
                    // ----------------
                    // MM
                    function MMSimulate(callback, params, docType, simulationReport) {
                        Log.Info("MMSimulate...");
                        // Check parameters
                        if (!docType) {
                            Sys.Helpers.SAP.SetLastError("Accounting document type is missing");
                            params.Exception = Sys.Helpers.SAP.GetLastError();
                            callback(params.Exception);
                            return;
                        }
                        params.Doc_Type = docType;
                        function MMSimulateCallback(jsonResult) {
                            HandleSimulationResults(jsonResult, params, callback);
                        }
                        function MMProcessLinesCallback(lineProcessed) {
                            if (!lineProcessed) {
                                Log.Error("MMProcessLines failed");
                            }
                            // Call the simulation BAPI
                            var bapiName = Lib.P2P.SAP.Soap.GetBAPIName("Z_ESK_INCOMINGINVOICE_SIMULATE");
                            bapiName = bapiName ? bapiName : "Z_ESK_INCOMINGINVOICE_SIMULATE";
                            if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("DumpBAPICalls", false)) {
                                Log.Info("MM BAPI '".concat(bapiName, "' params:\n").concat(JSON.stringify(params)));
                            }
                            Lib.AP.SAP.SAPCallBapi(MMSimulateCallback, Variable.GetValueAsString("SAPConfiguration"), bapiName, params.Bapi);
                        }
                        function MMHeaderSetCallback() {
                            // Process invoice lines
                            Lib.AP.SAP.Invoice.Simulate.MMProcessLines(MMProcessLinesCallback, params, simulationReport);
                        }
                        // Process the Document Header
                        Lib.AP.SAP.Invoice.MMHeaderSet(MMHeaderSetCallback, params, simulationReport);
                    }
                    Simulate.MMSimulate = MMSimulate;
                    function MMProcessLines(callback, params, simulationReport) {
                        var itemNumberIdx = 1;
                        var idx = 0;
                        var lineItem;
                        var lineItems = Data.GetTable("LineItems__");
                        var lineSkippedCount = 0;
                        var lineSkippedStart = -1;
                        // get the items in the table
                        var logisticVerifier = Lib.AP.SAP.Invoice.Logistic.GetLogisticVerification();
                        // Extended withholding tax
                        Lib.AP.SAP.Invoice.MMAddWHT(params);
                        function addGLLines() {
                            // Add GL lines in second loop for line item number to be consistent with the simulation results
                            for (idx = lineSkippedStart; lineSkippedCount > 0 && idx < lineItems.GetItemCount(); idx++) {
                                lineItem = lineItems.GetItem(idx);
                                if (lineItem && Lib.P2P.InvoiceLineItem.IsGLLineItem(lineItem) && Lib.AP.SAP.Invoice.FIGLLineIsValid(params, lineItem, simulationReport)) {
                                    Lib.AP.SAP.Invoice.MMAddGLLine(params, lineItem, Sys.Helpers.SAP.BuildItemNumber(itemNumberIdx, 6, 1));
                                    itemNumberIdx++;
                                    lineSkippedCount--;
                                }
                            }
                            callback(itemNumberIdx !== 1);
                        }
                        function MMCheckPOLineCallback() {
                            itemNumberIdx++;
                            idx++;
                            addPOLine();
                        }
                        function MMAddPOLineCallback(newItem) {
                            if (!newItem || !newItem.item) {
                                Log.Error("Error during line item ".concat(itemNumberIdx, " processing..."));
                                callback(false);
                            }
                            else if (isDeliveryCost(newItem)) {
                                // Don't do any logistic check on delivery cost lines
                                MMCheckPOLineCallback();
                            }
                            else {
                                Lib.AP.SAP.Invoice.Simulate.MMCheckPOLine(MMCheckPOLineCallback, params, newItem.item, newItem.details, simulationReport, logisticVerifier);
                            }
                        }
                        function addPOLine() {
                            if (idx < lineItems.GetItemCount()) {
                                lineItem = lineItems.GetItem(idx);
                                if (lineItem && Lib.P2P.InvoiceLineItem.IsPOLineItem(lineItem) && Lib.P2P.InvoiceLineItem.IsPostable(lineItem)) {
                                    Lib.AP.SAP.Invoice.MMAddPOLine(params, lineItem, Sys.Helpers.SAP.BuildItemNumber(itemNumberIdx, 6, 1))
                                        .Then(MMAddPOLineCallback);
                                }
                                else {
                                    if (lineSkippedStart === -1) {
                                        lineSkippedStart = idx;
                                    }
                                    lineSkippedCount++;
                                    idx++;
                                    addPOLine();
                                }
                            }
                            else {
                                addGLLines();
                            }
                        }
                        function isDeliveryCost(newItem) {
                            return Boolean(newItem.item.COND_TYPE);
                        }
                        addPOLine();
                    }
                    Simulate.MMProcessLines = MMProcessLines;
                    function MMCheckPOLine(callback, params, item, itemDetails, simulationReport, logisticVerifier) {
                        var callbackExpected = 0;
                        function retrieveCustomizedMessageFromSAPCallback(msg) {
                            callbackExpected--;
                            // Filter out errors, because simulation will report them
                            if (msg && msg.Type !== "E" && msg.Type !== "A") {
                                // FT-020616 Filter expected different invoicing party, consider them as information when it matches the current VendorNumber__
                                if (msg.ApplicationArea === "M8" && msg.Number === "286" && Sys.Helpers.String.SAP.TrimLeadingZeroFromID(msg.Param1) === Sys.Helpers.String.SAP.TrimLeadingZeroFromID(Data.GetValue("VendorNumber__"))) {
                                    msg.Type = "I";
                                }
                                var poNumber = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(item.PO_NUMBER);
                                var poItem = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(item.PO_ITEM);
                                Sys.Helpers.SAP.AddMessage(simulationReport, "messages", item.INVOICE_DOC_ITEM, msg.ApplicationArea, msg.Type, msg.Number, Language.Translate("_Item '{0}'/'{1}': '{2}'", false, poNumber, poItem, msg.Text ? msg.Text.replace(/'/g, "&#180;") : ""), msg.Param1, msg.Param2, msg.Param3, msg.Param);
                            }
                            if (callbackExpected <= 0) {
                                callback();
                            }
                        }
                        function amountCheckCallback() {
                            // Note: The case where an item has a different Vendor from the header is not handled
                            var creditorCheckInput = Lib.AP.SAP.Invoice.Logistic.GetCreditorCheckInput(itemDetails, item.PO_NUMBER, itemDetails.Vendor);
                            logisticVerifier.CreditorCheck(params.Language, creditorCheckInput);
                            callbackExpected = logisticVerifier.CustomizedMessages.length;
                            if (callbackExpected > 0) {
                                for (var _i = 0, _a = logisticVerifier.CustomizedMessages; _i < _a.length; _i++) {
                                    var customizedMessage = _a[_i];
                                    logisticVerifier.RetrieveCustomizedMessageFromSAP(retrieveCustomizedMessageFromSAPCallback, customizedMessage);
                                }
                            }
                            else {
                                callback();
                            }
                        }
                        function quantityCheckCallback() {
                            var amountCheckInput = Lib.AP.SAP.Invoice.Logistic.GetAmountCheckInput(params, itemDetails, item.QUANTITY, item.ITEM_AMOUNT);
                            logisticVerifier.AmountCheck(amountCheckCallback, params.Language, amountCheckInput);
                        }
                        logisticVerifier.ResetCustomizedMessages();
                        var quantityCheckInput = Lib.AP.SAP.Invoice.Logistic.GetQuantityCheckInput(params, itemDetails, item.QUANTITY);
                        logisticVerifier.QuantityCheck(quantityCheckCallback, params.Language, quantityCheckInput);
                    }
                    Simulate.MMCheckPOLine = MMCheckPOLine;
                    function MMReportInit(simulationReport) {
                        // Test if the simulation report is already initialized.
                        if (!simulationReport.IsInit) {
                            //Initialize the columns to display in the line items.
                            simulationReport.Items = {
                                columns: {
                                    LINEITEM: Language.Translate("_Line Items"),
                                    IVDOC_LINEITEM: Language.Translate("_IVDOC LineItems"),
                                    ACCOUNT: Language.Translate("_G/L account"),
                                    ACCOUNT_SHORT_TEXT: Language.Translate("_G/L account description"),
                                    DESCRIPTION: Language.Translate("_Description"),
                                    COND_TYPE: Language.Translate("_PriceCondition"),
                                    PO_ITEM: Language.Translate("_PO_Item"),
                                    PO_NUMBER: Language.Translate("_PO_Number"),
                                    MATERIAL: Language.Translate("_Material"),
                                    QUANTITY: Language.Translate("_Quantity"),
                                    QTY_IN_PO: Language.Translate("_Quantity_In_PO"),
                                    QTY_TOTAL_INV: Language.Translate("_Quantity_Total_inv"),
                                    QTY_DELIVERED: Language.Translate("_Quantity_Delivered"),
                                    TAXCODE: Language.Translate("_Tax code"),
                                    TAXJURCODE: Language.Translate("_Jurisdiction code"),
                                    CURRENCY: Language.Translate("_Invoice currency"),
                                    AMOUNT: Language.Translate("_Amount"),
                                    ERRORS: Language.Translate("_Errors")
                                },
                                values: []
                            };
                            simulationReport.IsInit = true;
                        }
                    }
                    Simulate.MMReportInit = MMReportInit;
                    function MMReportAddSAPMessage(params, simulationReport, returnItem) {
                        var isError = false;
                        var itemNumber = "";
                        if (returnItem.TYPE === "E") {
                            isError = true;
                            if (Sys.Helpers.SAP.CheckReturn(returnItem, "E", "534", "M8")) {
                                itemNumber = params.SimulateInvoiceTotalLineNumber;
                            }
                        }
                        Sys.Helpers.SAP.AddMessage(simulationReport, "messages", itemNumber, returnItem.ID, returnItem.TYPE, returnItem.NUMBER.toString(), returnItem.MESSAGE, returnItem.MESSAGE_V1, returnItem.MESSAGE_V2, returnItem.MESSAGE_V3, returnItem.MESSAGE_V4);
                        return isError;
                    }
                    Simulate.MMReportAddSAPMessage = MMReportAddSAPMessage;
                    Simulate.foreignFactors = {};
                    function GetCurrencyForeignFactor(callback, baseCurrency, currency, sapDate) {
                        function readSAPTableCallback(result) {
                            var foreignFactor;
                            if (result && result.length > 0) {
                                foreignFactor = Sys.Helpers.String.SAP.Trim(result[0].FFACT);
                            }
                            if (Sys.Helpers.String.SAP.IsNumber(foreignFactor)) {
                                Lib.AP.SAP.Invoice.Simulate.foreignFactors[currency] = parseFloat(foreignFactor);
                            }
                            else {
                                Lib.AP.SAP.Invoice.Simulate.foreignFactors[currency] = 1;
                            }
                            callback(Lib.AP.SAP.Invoice.Simulate.foreignFactors[currency]);
                        }
                        if (Lib.AP.SAP.Invoice.Simulate.foreignFactors[currency]) {
                            callback(Lib.AP.SAP.Invoice.Simulate.foreignFactors[currency]);
                        }
                        else if (baseCurrency !== currency) {
                            var customForeignFactor = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAPForeignCurrenciesFactorForSimulation");
                            if (customForeignFactor && customForeignFactor[baseCurrency] && customForeignFactor[baseCurrency][currency]) {
                                Lib.AP.SAP.Invoice.Simulate.foreignFactors[currency] = customForeignFactor[baseCurrency][currency];
                                callback(Lib.AP.SAP.Invoice.Simulate.foreignFactors[currency]);
                            }
                            else {
                                //Query table TCURF
                                var options = "KURST = 'M' AND FCURR = '".concat(currency, "'\n AND TCURR = '").concat(baseCurrency, "' AND GDATU > '").concat(99999999 - parseFloat(sapDate), "'");
                                Lib.AP.SAP.ReadSAPTable(readSAPTableCallback, Variable.GetValueAsString("SAPConfiguration"), "TCURF", "FFACT", options, 1, 0, false);
                            }
                        }
                        else {
                            Lib.AP.SAP.Invoice.Simulate.foreignFactors[currency] = 1;
                            callback(Lib.AP.SAP.Invoice.Simulate.foreignFactors[currency]);
                        }
                    }
                    Simulate.GetCurrencyForeignFactor = GetCurrencyForeignFactor;
                    function MMReportAddLine(callback, params, simulationReport, accItem, curItem, invoiceAmount, companyCodeCurrency, itemData) {
                        var lineAmount = 0;
                        var accountType = Sys.Helpers.String.SAP.Trim(accItem.KOART);
                        var currentCurrency;
                        var accountDescription;
                        var item;
                        function getExternalCurrencyFactorCallback(factor) {
                            lineAmount = parseFloat(curItem.WRBTR) * factor;
                            item.CURRENCY = currentCurrency;
                            item.AMOUNT = Sys.Helpers.SAP.ConvertToDecimalFormat(lineAmount);
                            item.ERRORS = "";
                            if (itemData) {
                                item.COND_TYPE = itemData.COND_TYPE;
                                item.DESCRIPTION = itemData.ITEM_TEXT;
                            }
                            simulationReport.Items.values.push(item);
                            callback(lineAmount);
                        }
                        function updateSimulationReport() {
                            if (curItem) {
                                currentCurrency = curItem.WAERS;
                                Lib.AP.SAP.GetExternalCurrencyFactor(getExternalCurrencyFactorCallback, currentCurrency);
                            }
                            else {
                                item.ERRORS = "";
                                simulationReport.Items.values.push(item);
                                callback(lineAmount);
                            }
                        }
                        function MMGetQuantityForDocumentCallBack(quantity) {
                            item.QTY_DELIVERED = quantity;
                            updateSimulationReport();
                        }
                        function getMaterialDescriptionCallback(description) {
                            item.DESCRIPTION = description;
                            updateSimulationReport();
                        }
                        function getPoItemDataCallback(itemDetails) {
                            if (itemDetails) {
                                item.DESCRIPTION = itemDetails.Short_Text;
                                item.QTY_IN_PO = itemDetails.Quantity;
                                item.QTY_TOTAL_INV = parseFloat(itemDetails.Iv_Qty) + parseFloat(accItem.MENGE);
                                if (!itemDetails.Gr_Basediv) {
                                    item.QTY_DELIVERED = itemDetails.Deliv_Qty;
                                    updateSimulationReport();
                                }
                                else {
                                    Lib.AP.SAP.Invoice.Simulate.MMGetQuantityForDocument(MMGetQuantityForDocumentCallBack, params, accItem.ZEILE);
                                }
                            }
                            else {
                                item.DESCRIPTION = accItem.SGTXT;
                                updateSimulationReport();
                            }
                        }
                        function getGLAccountDescriptionCallback(result) {
                            accountDescription = result;
                            item = {
                                LINEITEM: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(accItem.POSNR),
                                IVDOC_LINEITEM: accItem.ZEILE,
                                ACCOUNT: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(accItem.HKONT),
                                ACCOUNT_SHORT_TEXT: accountDescription,
                                PO_ITEM: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(accItem.EBELP),
                                PO_NUMBER: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(accItem.EBELN),
                                MATERIAL: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(accItem.MATNR),
                                COND_TYPE: ""
                            };
                            if (parseFloat(accItem.MENGE) !== 0) {
                                item.QUANTITY = accItem.MENGE;
                            }
                            item.TAXCODE = accItem.MWSKZ;
                            item.TAXJURCODE = accItem.TXJCD;
                            if (accItem.EBELP && accItem.EBELN) {
                                Lib.AP.SAP.PurchaseOrder.GetPoItemData(getPoItemDataCallback, accItem.EBELN, accItem.EBELP);
                            }
                            else {
                                switch (accountType) {
                                    case "K":
                                        item.DESCRIPTION = Data.GetValue("VendorName__");
                                        updateSimulationReport();
                                        break;
                                    case "S":
                                        item.DESCRIPTION = accountDescription;
                                        updateSimulationReport();
                                        break;
                                    case "M":
                                        Lib.AP.SAP.GetMaterialDescriptionClient(getMaterialDescriptionCallback, accItem.MATNR, params.Language);
                                        break;
                                    default:
                                        item.DESCRIPTION = accItem.SGTXT;
                                        updateSimulationReport();
                                }
                            }
                        }
                        Lib.AP.SAP.GetGLAccountDescriptionClient(getGLAccountDescriptionCallback, accItem.BUKRS, accItem.HKONT, params.Language);
                    }
                    Simulate.MMReportAddLine = MMReportAddLine;
                    function GetItemInItemDataTable(params, invoiceDocItem) {
                        var itemDataTable = params.Bapi.TABLES.ITEMDATA;
                        for (var _i = 0, itemDataTable_1 = itemDataTable; _i < itemDataTable_1.length; _i++) {
                            var item = itemDataTable_1[_i];
                            if (item.INVOICE_DOC_ITEM === invoiceDocItem) {
                                return item;
                            }
                        }
                        return null;
                    }
                    Simulate.GetItemInItemDataTable = GetItemInItemDataTable;
                    function MMGetQuantityForDocument(callback, params, invoiceDocItem) {
                        function readSAPTableCallback(result) {
                            if (result && result.length > 0) {
                                callback(parseFloat(result[0].MENGE));
                            }
                            else {
                                callback("");
                            }
                        }
                        var item = Lib.AP.SAP.Invoice.Simulate.GetItemInItemDataTable(params, invoiceDocItem);
                        if (item) {
                            var filter = "EBELN = '".concat(item.PO_NUMBER, "'");
                            filter += " AND EBELP = '".concat(item.PO_ITEM, "'\n");
                            filter += " AND ( LFBNR = '".concat(item.REF_DOC, "' OR LFBNR = '").concat(item.SHEET_NO, "' )\n");
                            filter += " AND LFGJA = '".concat(item.REF_DOC_YEAR, "'\n");
                            filter += " AND LFPOS = '".concat(item.REF_DOC_IT, "'");
                            filter += " AND VGABE = '1'";
                            Lib.AP.SAP.ReadSAPTable(readSAPTableCallback, Variable.GetValueAsString("SAPConfiguration"), "EKBE", "MENGE", filter, 1, 0, false);
                        }
                        else {
                            callback("");
                        }
                    }
                    Simulate.MMGetQuantityForDocument = MMGetQuantityForDocument;
                    function MMReportAddLines(callback, params, simulationReport) {
                        // Add and lines to simulation report
                        var balance = 0;
                        var invoiceAmount = params.Bapi.EXPORTS.HEADERDATA.GROSS_AMOUNT;
                        var companyCode = params.Bapi.EXPORTS.HEADERDATA.COMP_CODE;
                        var companyCodeCurrency;
                        var accountingInfo;
                        var ACCOUNTINGINFOIdx;
                        function MMReportAddLineCallback(lineAmount) {
                            balance += lineAmount;
                            ACCOUNTINGINFOIdx++;
                            forEachAccountingInfo();
                        }
                        function forEachAccountingInfo() {
                            if (ACCOUNTINGINFOIdx < accountingInfo.length) {
                                var accItem = accountingInfo[ACCOUNTINGINFOIdx];
                                var curItem = null;
                                var itemData = Lib.AP.SAP.Invoice.Simulate.GetItemInItemDataTable(params, accItem.ZEILE);
                                var currencyInfo = params.Bapi.TABLES.CURRENCYINFO;
                                var CURRENCYINFOIdx = Sys.Helpers.SAP.FindByInTable(currencyInfo, "POSNR", accItem.POSNR);
                                if (CURRENCYINFOIdx >= 0) {
                                    curItem = currencyInfo[CURRENCYINFOIdx];
                                }
                                Lib.AP.SAP.Invoice.Simulate.MMReportAddLine(MMReportAddLineCallback, params, simulationReport, accItem, curItem, invoiceAmount, companyCodeCurrency, itemData);
                            }
                            else {
                                if (simulationReport.Items.values.length > 0) {
                                    var totalLineitem = {
                                        LINEITEM: params.SimulateInvoiceTotalLineNumber,
                                        IVDOC_LINEITEM: params.SimulateInvoiceTotalLineNumber,
                                        ACCOUNT_SHORT_TEXT: "BALANCE",
                                        CURRENCY: params.Bapi.EXPORTS.HEADERDATA.CURRENCY,
                                        AMOUNT: Sys.Helpers.SAP.ConvertToDecimalFormat(Sys.Helpers.SAP.Round(balance))
                                    };
                                    simulationReport.Items.values.push(totalLineitem);
                                }
                                callback();
                            }
                        }
                        function getCompanyCodeCurrencycallback(currencyResult) {
                            companyCodeCurrency = currencyResult;
                            accountingInfo = params.Bapi.TABLES.ACCOUNTINGINFO;
                            ACCOUNTINGINFOIdx = 0;
                            forEachAccountingInfo();
                        }
                        var sapQueryOptions = null;
                        if (Sys.ScriptInfo.IsClient() && Lib.AP.SAP.UsesWebServices()) {
                            sapQueryOptions = { handler: Lib.AP.SAP.SAPQuery };
                        }
                        Sys.Helpers.SAP.GetCompanyCodeCurrency(getCompanyCodeCurrencycallback, Variable.GetValueAsString("SAPConfiguration"), companyCode, sapQueryOptions);
                    }
                    Simulate.MMReportAddLines = MMReportAddLines;
                    function MMReport(callback, params, simulationReport) {
                        // Initialize simulation report table
                        Lib.AP.SAP.Invoice.Simulate.MMReportInit(simulationReport);
                        var hasErrors = Lib.AP.SAP.Invoice.Simulate.AddLastErrorOrExceptionMessage(simulationReport, params);
                        var RETURN0 = params.Bapi.TABLES.RETURN;
                        if (RETURN0) {
                            if (!hasErrors && RETURN0.length === 0 && simulationReport.MessageSet.messages.texts.length === 0) {
                                var successMsg = {
                                    TYPE: "S",
                                    NUMBER: "614",
                                    ID: "RW",
                                    MESSAGE: Language.Translate("_Document check - no errors")
                                };
                                params.Bapi.TABLES.RETURN.push(successMsg);
                            }
                            // Add messages to the report
                            for (var _i = 0, RETURN0_1 = RETURN0; _i < RETURN0_1.length; _i++) {
                                var retItem = RETURN0_1[_i];
                                hasErrors = Lib.AP.SAP.Invoice.Simulate.MMReportAddSAPMessage(params, simulationReport, retItem) || hasErrors;
                            }
                        }
                        if (!hasErrors) {
                            Lib.AP.SAP.Invoice.Simulate.MMReportAddLines(callback, params, simulationReport);
                        }
                        else {
                            callback();
                        }
                    }
                    Simulate.MMReport = MMReport;
                    // ----------------
                    // FI
                    /** FI Simulation functions **/
                    function FIComputePaymentTerms(callback, params, invoiceRefNumber, simulationReport) {
                        function readSAPTableCallback(result) {
                            var invPaymentTerms = null;
                            if (result && result.length > 0) {
                                invPaymentTerms = {
                                    baseLineDate: result[0].ZFBDT,
                                    paymentTerms: result[0].ZTERM,
                                    paymentBlock: result[0].ZLSPR
                                };
                            }
                            else {
                                var docNotFound = "".concat(invoiceRefNumber.documentNumber, " ").concat(invoiceRefNumber.companyCode, " ").concat(invoiceRefNumber.fiscalYear);
                                Log.Error("GetInvoicePaymentTerms: Document not found in BSEG: ".concat(docNotFound));
                            }
                            if (invPaymentTerms) {
                                // Notify changes in the simulation report
                                if (params.Baseline_Date !== invPaymentTerms.baseLineDate) {
                                    Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "W", "009", Language.Translate("_Replacing Baseline Date '{0}' by '{1}' during simulation", false, params.Baseline_Date, invPaymentTerms.baseLineDate), params.Baseline_Date, invPaymentTerms.baseLineDate, "", "");
                                    params.Baseline_Date = invPaymentTerms.baseLineDate;
                                }
                                if (params.Invoice_Payment_Terms !== invPaymentTerms.paymentTerms) {
                                    Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "W", "010", Language.Translate("_Replacing Payment Terms '{0}' by '{1}' during simulation", false, params.Invoice_Payment_Terms, invPaymentTerms.paymentTerms), params.Invoice_Payment_Terms, invPaymentTerms.paymentTerms, "", "");
                                    params.Invoice_Payment_Terms = invPaymentTerms.paymentTerms;
                                }
                                if (params.Invoice_Payment_Block !== invPaymentTerms.paymentBlock) {
                                    Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "W", "011", Language.Translate("_Replacing Payment Block '{0}' by '{1}' during simulation", false, params.Invoice_Payment_Block, invPaymentTerms.paymentBlock), params.Invoice_Payment_Block, invPaymentTerms.paymentBlock, "", "");
                                    params.Invoice_Payment_Block = invPaymentTerms.paymentBlock;
                                }
                            }
                            else {
                                var docNumber = "".concat(invoiceRefNumber.documentNumber, "-").concat(invoiceRefNumber.companyCode, "-").concat(invoiceRefNumber.fiscalYear);
                                Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "E", "008", Language.Translate("_Could not get payment terms for document number '{0}': {1}", false, docNumber, Sys.Helpers.SAP.GetLastError()), docNumber, Sys.Helpers.SAP.GetLastError(), "", "");
                            }
                            callback();
                        }
                        var filter = "BELNR = '".concat(invoiceRefNumber.documentNumber, "' AND BUKRS = '").concat(invoiceRefNumber.companyCode, "' AND GJAHR = '").concat(invoiceRefNumber.fiscalYear, "'");
                        Lib.AP.SAP.ReadSAPTable(readSAPTableCallback, Variable.GetValueAsString("SAPConfiguration"), "BSEG", "ZFBDT|ZTERM|ZLSPR", filter, 1, 0, false);
                    }
                    Simulate.FIComputePaymentTerms = FIComputePaymentTerms;
                    function FIGetGLAccountDescription(callback, params, taxAccount, itemNumberIdx) {
                        function bapiCallback(jsonResult) {
                            if ((!jsonResult.ERRORS || jsonResult.ERRORS.length === 0) && jsonResult.IMPORTS) {
                                var accDetail = jsonResult.IMPORTS.ACCOUNT_DETAIL;
                                if (accDetail) {
                                    if (accDetail.LONG_TEXT) {
                                        params.Accounts[jsonResult.EXPORTS.GLACCT] = accDetail.LONG_TEXT;
                                    }
                                    else {
                                        params.Accounts[jsonResult.EXPORTS.GLACCT] = accDetail.SHORT_TEXT;
                                    }
                                }
                            }
                            callback(itemNumberIdx);
                        }
                        var bapiParams = {
                            EXPORTS: {
                                COMPANYCODE: Data.GetValue("CompanyCode__"),
                                GLACCT: taxAccount.Gl_Account,
                                LANGUAGE: params.Language,
                                TEXT_ONLY: "X"
                            },
                            USECACHE: true
                        };
                        Lib.AP.SAP.SAPCallBapi(bapiCallback, Variable.GetValueAsString("SAPConfiguration"), "BAPI_GL_ACC_GETDETAIL", bapiParams);
                    }
                    Simulate.FIGetGLAccountDescription = FIGetGLAccountDescription;
                    function FICheckData(callback, params, simulationReport) {
                        // Alternative Payee not supported in simulation BAPI - Check it
                        var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                        var altPayeeNumber = Data.GetValue("AlternativePayee__");
                        function readSAPTableCallback(result) {
                            var found = false;
                            if (result && result.length > 0) {
                                var payee = Sys.Helpers.String.SAP.NormalizeID(altPayeeNumber, 10);
                                for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
                                    var res = result_1[_i];
                                    if (payee === res.EMPFK) {
                                        found = true;
                                        break;
                                    }
                                }
                            }
                            if (!found) {
                                Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "0000000001", "ESKAP", "E", "006", Language.Translate("_Payee {0} is not defined for account {1}", false, altPayeeNumber, vendorNumber), altPayeeNumber, vendorNumber, "", "");
                            }
                            callback();
                        }
                        if (altPayeeNumber) {
                            Lib.AP.SAP.ReadSAPTable(readSAPTableCallback, Variable.GetValueAsString("SAPConfiguration"), "LFZA", "EMPFK", "LIFNR = '".concat(vendorNumber, "'"), 0, 0, false);
                        }
                        else {
                            callback();
                        }
                    }
                    Simulate.FICheckData = FICheckData;
                    function FIProcessLines(callback, params, simulationReport) {
                        // Process the vendor account line item
                        Lib.AP.SAP.Invoice.FIAddVendorLine(params);
                        // Extended withholding tax
                        Lib.AP.SAP.Invoice.FIAddWHT(params);
                        var expectedCallback = 0;
                        function FIGetGLAccountDescriptionCallback(itemNumberIdx) {
                            expectedCallback--;
                            if (expectedCallback <= 0) {
                                callback(itemNumberIdx);
                            }
                        }
                        function FIAddTaxLinesCallback(itemNumberIdx, accountList) {
                            if (accountList && accountList.length > 0) {
                                expectedCallback = accountList.length;
                                for (var _i = 0, accountList_1 = accountList; _i < accountList_1.length; _i++) {
                                    var account = accountList_1[_i];
                                    Lib.AP.SAP.Invoice.Simulate.FIGetGLAccountDescription(FIGetGLAccountDescriptionCallback, params, account, itemNumberIdx);
                                }
                            }
                            else {
                                callback(itemNumberIdx);
                            }
                        }
                        function FIGetCompanyCodeLinesPeriodCallback() {
                            var itemNumberIdx = 1;
                            itemNumberIdx = Lib.AP.SAP.Invoice.FIAddGLLines(params, itemNumberIdx, simulationReport);
                            if (itemNumberIdx > 0) {
                                Lib.AP.SAP.Invoice.Simulate.FIAddTaxLines(FIAddTaxLinesCallback, params, itemNumberIdx, simulationReport);
                            }
                            else {
                                callback(itemNumberIdx);
                            }
                        }
                        Lib.AP.SAP.Invoice.FIGetCompanyCodeLinesPeriod(FIGetCompanyCodeLinesPeriodCallback, params);
                    }
                    Simulate.FIProcessLines = FIProcessLines;
                    function FIAddTaxLines(callback, params, itemNumberIdx, simulationReport) {
                        // Warn if no tax codes
                        var bTaxCodeFound = Lib.AP.SAP.Invoice.HasTaxAmounts(params);
                        if (!bTaxCodeFound && Data.GetValue("CalculateTax__")) {
                            var errMessage = Language.Translate("_No tax codes were specified even though the '{0}' checkbox is checked.", false, Language.Translate("_Calculate tax"));
                            Sys.Helpers.SAP.AddWarning(simulationReport, "", "ESKAP", "W", "015", errMessage, "", "", "", "");
                        }
                        return Lib.AP.SAP.Invoice.FIAddTaxLines(callback, params, itemNumberIdx, !Data.GetValue("CalculateTax__"), simulationReport);
                    }
                    Simulate.FIAddTaxLines = FIAddTaxLines;
                    function FISimulate(callback, params, docType, simulationReport, blockPayment) {
                        Log.Info("FISimulate...");
                        // Check parameters
                        if (!docType) {
                            Sys.Helpers.SAP.SetLastError("Accounting document type is missing");
                            params.Exception = Sys.Helpers.SAP.GetLastError();
                            callback(params.Exception);
                            return;
                        }
                        params.Doc_Type = docType;
                        function FISimulateCallback(jsonResult) {
                            HandleSimulationResults(jsonResult, params, callback);
                        }
                        function FIProcessLinesCallBack(lineProcessed) {
                            // Call the simulation BAPI
                            if (lineProcessed > 0) {
                                var bapiName = Lib.P2P.SAP.Soap.GetBAPIName("BAPI_ACC_DOCUMENT_CHECK");
                                bapiName = bapiName ? bapiName : "BAPI_ACC_DOCUMENT_CHECK";
                                if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("DumpBAPICalls", false)) {
                                    Log.Info("FI BAPI '".concat(bapiName, "' params:\n").concat(JSON.stringify(params)));
                                }
                                Lib.AP.SAP.SAPCallBapi(FISimulateCallback, Variable.GetValueAsString("SAPConfiguration"), bapiName, params.Bapi);
                            }
                            else {
                                callback("FIProcessLines failed");
                            }
                        }
                        function FICheckDataCallback() {
                            Lib.AP.SAP.Invoice.Simulate.FIProcessLines(FIProcessLinesCallBack, params, simulationReport);
                        }
                        function FIPrepareForLinesCallback() {
                            // Process invoice lines
                            Lib.AP.SAP.Invoice.Simulate.FICheckData(FICheckDataCallback, params, simulationReport);
                        }
                        function FIHeaderSetCallback() {
                            Lib.AP.SAP.Invoice.FIPrepareForLines(FIPrepareForLinesCallback, Lib.AP.SAP.Invoice.Simulate, params, simulationReport, blockPayment);
                        }
                        // Process the Document Header
                        Lib.AP.SAP.Invoice.FIHeaderSet(FIHeaderSetCallback, params);
                    }
                    Simulate.FISimulate = FISimulate;
                    function AddLastErrorOrExceptionMessage(simulationReport, params) {
                        var hasErrors = false;
                        // Add BAPI call exception on report (if any)
                        if (params.Exception.length > 0) {
                            Log.Error("Simulation Exception: " + params.Exception);
                            // An exception was returned by the BAPI Call, report it
                            Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "E", "013", params.Exception, "", "", "", "");
                            hasErrors = true;
                        }
                        return hasErrors;
                    }
                    Simulate.AddLastErrorOrExceptionMessage = AddLastErrorOrExceptionMessage;
                    function FIReportInit(simulationReport) {
                        // Test if the simulation report is already initialized.
                        if (!simulationReport.IsInit) {
                            //Initialize the columns to display in the line items.
                            simulationReport.Items = {
                                columns: {
                                    ITM_NUMBER: Language.Translate("_Line Items"),
                                    LINEITEM: Language.Translate("_Line Items"),
                                    ACCOUNT: Language.Translate("_G/L account"),
                                    ACCOUNT_SHORT_TEXT: Language.Translate("_G/L account description"),
                                    COST_CENTER: Language.Translate("_Cost center"),
                                    ORDER: Language.Translate("_InternalOrder_report"),
                                    ASSIGNMENT: Language.Translate("_Assignment"),
                                    TAXCODE: Language.Translate("_Tax code"),
                                    AMOUNT: Language.Translate("_Amount"),
                                    DESCRIPTION: Language.Translate("_Description"),
                                    ERRORS: Language.Translate("_Errors")
                                },
                                values: []
                            };
                            simulationReport.IsInit = true;
                        }
                    }
                    Simulate.FIReportInit = FIReportInit;
                    function FIReportAddLine(simulationReport, itemNumber, lineItem, account, accountShortText, costCenter, order, assignment, taxCode, amount, description) {
                        var item = {
                            ITM_NUMBER: itemNumber,
                            LINEITEM: lineItem.toString(),
                            ACCOUNT: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(account),
                            ACCOUNT_SHORT_TEXT: accountShortText,
                            COST_CENTER: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(costCenter),
                            ORDER: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(order),
                            ASSIGNMENT: assignment,
                            TAXCODE: taxCode,
                            AMOUNT: Sys.Helpers.SAP.ConvertToDecimalFormat(amount),
                            DESCRIPTION: description
                        };
                        simulationReport.Items.values.push(item);
                        return true;
                    }
                    Simulate.FIReportAddLine = FIReportAddLine;
                    function FIReportAddPayableLine(params, simulationReport, item, lineItem, amount) {
                        return Lib.AP.SAP.Invoice.Simulate.FIReportAddLine(simulationReport, 
                        /*itemNumber*/ item.ITEMNO_ACC, 
                        /*lineItem*/ lineItem, 
                        /*account*/ item.VENDOR_NO, 
                        /*accountShortText*/ Data.GetValue("VendorName__"), 
                        /*costCenter*/ "", 
                        /*order*/ "", 
                        /*assignment*/ item.ALLOC_NMBR, 
                        /*taxCode*/ " ", 
                        /*amount*/ amount, 
                        /*description*/ item.ITEM_TEXT);
                    }
                    Simulate.FIReportAddPayableLine = FIReportAddPayableLine;
                    function FIReportAddGLLine(params, simulationReport, item, lineItem, amount) {
                        return Lib.AP.SAP.Invoice.Simulate.FIReportAddLine(simulationReport, 
                        /*itemNumber*/ item.ITEMNO_ACC, 
                        /*lineItem*/ lineItem, 
                        /*account*/ item.GL_ACCOUNT, 
                        /*accountShortText*/ params.Accounts[item.GL_ACCOUNT], 
                        /*costCenter*/ item.COSTCENTER, 
                        /*order*/ item.ORDERID, 
                        /*assignment*/ item.ALLOC_NMBR, 
                        /*taxCode*/ item.TAX_CODE, 
                        /*amount*/ amount, 
                        /*description*/ item.ITEM_TEXT);
                    }
                    Simulate.FIReportAddGLLine = FIReportAddGLLine;
                    function FIReportAddTaxLine(params, simulationReport, item, lineItem, amount) {
                        if (!item.GL_ACCOUNT) {
                            // Do not show tax lines without GLAccount (happens when using jurisdiction codes)
                            return false;
                        }
                        return Lib.AP.SAP.Invoice.Simulate.FIReportAddLine(simulationReport, 
                        /*itemNumber*/ item.ITEMNO_ACC, 
                        /*lineItem*/ lineItem, 
                        /*account*/ item.GL_ACCOUNT, 
                        /*accountShortText*/ params.Accounts[item.GL_ACCOUNT], 
                        /*costCenter*/ "", 
                        /*order*/ "", 
                        /*assignment*/ "", 
                        /*taxCode*/ item.TAX_CODE, 
                        /*amount*/ amount, 
                        /*description*/ "");
                    }
                    Simulate.FIReportAddTaxLine = FIReportAddTaxLine;
                    function FIReportAddTable(params, simulationReport, tableName, lineCount) {
                        var bHideZeroAmount = false;
                        var reportAddLineFunc;
                        switch (tableName) {
                            case "ACCOUNTPAYABLE":
                                reportAddLineFunc = Lib.AP.SAP.Invoice.Simulate.FIReportAddPayableLine;
                                break;
                            case "ACCOUNTGL":
                                reportAddLineFunc = Lib.AP.SAP.Invoice.Simulate.FIReportAddGLLine;
                                break;
                            case "ACCOUNTTAX":
                                reportAddLineFunc = Lib.AP.SAP.Invoice.Simulate.FIReportAddTaxLine;
                                bHideZeroAmount = params.bHideZeroAmountTaxes;
                                break;
                            default:
                                return null;
                        }
                        var table = params.Bapi.TABLES[tableName];
                        Log.Info("Number of records ".concat(tableName, " Table: ").concat(table.length));
                        var total = 0.0;
                        for (var _i = 0, table_1 = table; _i < table_1.length; _i++) {
                            var item = table_1[_i];
                            var currencyAmount = params.Bapi.TABLES.CURRENCYAMOUNT;
                            var CURRENCYAMOUNT_Item_Idx = Sys.Helpers.SAP.FindByInTable(currencyAmount, "ITEMNO_ACC", item.ITEMNO_ACC);
                            if (CURRENCYAMOUNT_Item_Idx >= 0) {
                                var CURRENCYAMOUNT_Item = currencyAmount[CURRENCYAMOUNT_Item_Idx];
                                var lineAmount = CURRENCYAMOUNT_Item.AMT_DOCCUR;
                                if (lineAmount || !bHideZeroAmount) {
                                    lineCount++;
                                    if (reportAddLineFunc(params, simulationReport, item, lineCount, lineAmount)) {
                                        total += lineAmount;
                                    }
                                    else {
                                        lineCount--;
                                    }
                                }
                            }
                        }
                        return { "total": total, "nLines": lineCount };
                    }
                    Simulate.FIReportAddTable = FIReportAddTable;
                    function FIReportIgnoreMessage(simulationReport, returnItem) {
                        // ignore first error message
                        if (Sys.Helpers.SAP.CheckReturn(returnItem, "E", "609", "RW")) {
                            return true;
                        }
                        // Do not display success message if we have an error (from additional checks)
                        if (Sys.Helpers.SAP.CheckReturn(returnItem, "S", "614", "RW") && simulationReport.MessageSet.messages.texts.length > 0) {
                            return true;
                        }
                        return false;
                    }
                    Simulate.FIReportIgnoreMessage = FIReportIgnoreMessage;
                    function FIReportAddSAPMessage(params, simulationReport, returnItem, companyCode) {
                        if (!Lib.AP.SAP.Invoice.Simulate.FIReportIgnoreMessage(simulationReport, returnItem)) {
                            // Check for special messages
                            var message = void 0;
                            var itemNumber = "";
                            if (Sys.Helpers.SAP.CheckReturn(returnItem, "E", "702", "F5")) {
                                // Error on total line
                                message = "".concat(returnItem.MESSAGE, ": ").concat(Sys.Helpers.String.SAP.Trim(returnItem.MESSAGE_V2), " (").concat(Sys.Helpers.String.SAP.Trim(returnItem.MESSAGE_V3), ")");
                                itemNumber = params.SimulateInvoiceTotalLineNumber;
                            }
                            else if (Sys.Helpers.SAP.CheckReturn(returnItem, "S", "614", "RW")) {
                                // Translate the success message
                                message = Language.Translate("_Document check - no errors");
                                // Set itemNumber special value to get an OK icon on the total line
                                itemNumber = params.SimulateInvoiceTotalLineNumber;
                            }
                            else if (Sys.Helpers.SAP.CheckReturn(returnItem, "W", "281", "KI")) {
                                // Force error (Special trick to prevent batch Input errors)
                                returnItem.TYPE = "E";
                                message = returnItem.MESSAGE;
                                itemNumber = Lib.AP.SAP.Invoice.Simulate.GetItemnoAccFromError(returnItem, companyCode, params, simulationReport);
                            }
                            else {
                                message = returnItem.MESSAGE;
                                // Try to find if this message is related to a line
                                if (returnItem.TYPE === "A" || returnItem.TYPE === "E" || returnItem.TYPE === "W") {
                                    itemNumber = Lib.AP.SAP.Invoice.Simulate.GetItemnoAccFromError(returnItem, companyCode, params, simulationReport);
                                }
                            }
                            Sys.Helpers.SAP.AddToReport(simulationReport, itemNumber, returnItem.ID, returnItem.TYPE, returnItem.NUMBER.toString(), message, returnItem.MESSAGE_V1, returnItem.MESSAGE_V2, returnItem.MESSAGE_V3, returnItem.MESSAGE_V4);
                        }
                    }
                    Simulate.FIReportAddSAPMessage = FIReportAddSAPMessage;
                    function GetConfidenceBonus(tbs, tbsin, bonusConfidenceHigh, bonusConfidenceLow) {
                        if (!tbsin || !tbs) {
                            return 0;
                        }
                        if (tbsin === tbs) {
                            return bonusConfidenceHigh;
                        }
                        else if (tbsin.indexOf(tbs) >= 0) {
                            return bonusConfidenceLow;
                        }
                        else if (tbs.indexOf(tbsin) >= 0) {
                            return 1;
                        }
                        return 0;
                    }
                    Simulate.GetConfidenceBonus = GetConfidenceBonus;
                    function GetItemnoAccFromErrorConfidenceLevel(confidenceLevelParams, currentConfidenceLevel) {
                        var bonusConfidenceHigh = 10;
                        var bonusConfidenceLow = 5;
                        var i;
                        var newConfidenceLevel = currentConfidenceLevel;
                        var itemIdx = Sys.Helpers.SAP.FindByInTable(confidenceLevelParams.table, "ITEMNO_ACC", confidenceLevelParams.currentItemno);
                        if (itemIdx >= 0 && itemIdx < confidenceLevelParams.table.length) {
                            var item = confidenceLevelParams.table[itemIdx];
                            var strToBeSearchedIn = [];
                            for (i = 0; i < confidenceLevelParams.strToBeSearchedIn.length; ++i) {
                                strToBeSearchedIn.push(item[confidenceLevelParams.strToBeSearchedIn[i]]);
                            }
                            if (confidenceLevelParams.companyCode) {
                                strToBeSearchedIn.push(confidenceLevelParams.companyCode);
                            }
                            var tbsinidx = void 0;
                            for (tbsinidx = 0; tbsinidx < strToBeSearchedIn.length; tbsinidx++) {
                                strToBeSearchedIn[tbsinidx] = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(strToBeSearchedIn[tbsinidx]);
                            }
                            // special bonus
                            for (i = 0; i < confidenceLevelParams.emptyBonuses.length; ++i) {
                                if (item[confidenceLevelParams.emptyBonuses[i]] === "") {
                                    newConfidenceLevel = newConfidenceLevel + bonusConfidenceHigh;
                                    break;
                                }
                            }
                            for (tbsinidx = 0; tbsinidx < confidenceLevelParams.strToBeSearchedIn.length; tbsinidx++) {
                                var tbsin = confidenceLevelParams.strToBeSearchedIn[tbsinidx];
                                for (var _i = 0, _a = confidenceLevelParams.strToBeSearched; _i < _a.length; _i++) {
                                    var tbs = _a[_i];
                                    newConfidenceLevel += Lib.AP.SAP.Invoice.Simulate.GetConfidenceBonus(tbs, tbsin, bonusConfidenceHigh, bonusConfidenceLow);
                                }
                            }
                        }
                        return newConfidenceLevel;
                    }
                    Simulate.GetItemnoAccFromErrorConfidenceLevel = GetItemnoAccFromErrorConfidenceLevel;
                    function GetItemnoAccFromError_retrieveFromBestMatch(errorItem, params, companyCode) {
                        // Third - try to find the best match
                        var bestItemnoAcc = "";
                        if (errorItem) {
                            var bestConfidenceLevel = 0;
                            var confidenceLevelThreshold = 5;
                            var strToBeSearched = [errorItem.MESSAGE_V1, errorItem.MESSAGE_V2, errorItem.MESSAGE_V3, errorItem.MESSAGE_V4];
                            var currencyAmount = params.Bapi.TABLES.CURRENCYAMOUNT;
                            for (var _i = 0, currencyAmount_1 = currencyAmount; _i < currencyAmount_1.length; _i++) {
                                var currencyAmountItem = currencyAmount_1[_i];
                                var currentConfidenceLevel = 0;
                                var paramConfidenceLevel = {
                                    table: params.Bapi.TABLES.ACCOUNTGL,
                                    strToBeSearched: strToBeSearched,
                                    strToBeSearchedIn: ["ITEMNO_ACC", "GL_ACCOUNT", "TAX_CODE", "COSTCENTER", "BUS_AREA", "ORDERID", "ALLOC_NMBR", "WBS_ELEMENT"],
                                    currentItemno: currencyAmountItem.ITEMNO_ACC,
                                    emptyBonuses: ["GL_ACCOUNT"],
                                    companyCode: companyCode
                                };
                                currentConfidenceLevel = Lib.AP.SAP.Invoice.Simulate.GetItemnoAccFromErrorConfidenceLevel(paramConfidenceLevel, currentConfidenceLevel);
                                paramConfidenceLevel.table = params.Bapi.TABLES.ACCOUNTPAYABLE;
                                paramConfidenceLevel.strToBeSearchedIn = ["ITEMNO_ACC", "VENDOR_NO", "PMNT_BLOCK", "ALLOC_NMBR", "BUSINESSPLACE"];
                                paramConfidenceLevel.emptyBonuses = ["VENDOR_NO"];
                                paramConfidenceLevel.companyCode = null;
                                currentConfidenceLevel = Lib.AP.SAP.Invoice.Simulate.GetItemnoAccFromErrorConfidenceLevel(paramConfidenceLevel, currentConfidenceLevel);
                                paramConfidenceLevel.table = params.Bapi.TABLES.ACCOUNTTAX;
                                paramConfidenceLevel.strToBeSearchedIn = ["ITEMNO_ACC", "GL_ACCOUNT", "TAX_CODE"];
                                paramConfidenceLevel.emptyBonuses = ["GL_ACCOUNT", "TAX_CODE"];
                                currentConfidenceLevel = Lib.AP.SAP.Invoice.Simulate.GetItemnoAccFromErrorConfidenceLevel(paramConfidenceLevel, currentConfidenceLevel);
                                //store highest confidence level
                                if (currentConfidenceLevel >= confidenceLevelThreshold && currentConfidenceLevel > bestConfidenceLevel) {
                                    bestConfidenceLevel = currentConfidenceLevel;
                                    bestItemnoAcc = paramConfidenceLevel.currentItemno;
                                }
                            }
                        }
                        return bestItemnoAcc;
                    }
                    Simulate.GetItemnoAccFromError_retrieveFromBestMatch = GetItemnoAccFromError_retrieveFromBestMatch;
                    function GetItemnoAccFromError_retrieveFromErrorItemStructure(errorItem, simulationReport) {
                        // Second, direct approach, try to find the ItemNumber in the errorItem structure
                        if (errorItem) {
                            for (var _i = 0, _a = simulationReport.Items.values; _i < _a.length; _i++) {
                                var lineItem = _a[_i];
                                var lineItemNumber = lineItem.ITM_NUMBER;
                                if (lineItemNumber === errorItem.MESSAGE_V1 ||
                                    lineItemNumber === errorItem.MESSAGE_V2 ||
                                    lineItemNumber === errorItem.MESSAGE_V3 ||
                                    lineItemNumber === errorItem.MESSAGE_V4) {
                                    return lineItemNumber;
                                }
                            }
                        }
                        return "";
                    }
                    Simulate.GetItemnoAccFromError_retrieveFromErrorItemStructure = GetItemnoAccFromError_retrieveFromErrorItemStructure;
                    function GetItemnoAccFromError_retrieveFromParameterField(errorItem, params) {
                        var result = "";
                        // First, Check the Parameter field to see which parameter generated the error
                        if (errorItem && errorItem.PARAMETER && errorItem.PARAMETER !== "") {
                            //The parameter and row fields tells the line in the BAPI parameter that generated this error.
                            var table = params.Bapi.TABLES[errorItem.PARAMETER];
                            if (errorItem.ROW > 0 && table && errorItem.ROW <= table.length) {
                                result = table[errorItem.ROW - 1].ITEMNO_ACC;
                            }
                        }
                        return result;
                    }
                    Simulate.GetItemnoAccFromError_retrieveFromParameterField = GetItemnoAccFromError_retrieveFromParameterField;
                    function GetItemnoAccFromError(errorItem, companyCode, params, simulationReport) {
                        if (errorItem) {
                            Log.Info("--- GetItemnoAccFromError => ErrorItem parameter: ".concat(errorItem.PARAMETER, ", errorItem row: ").concat(errorItem.ROW));
                            Log.Info("--- --- message v1: ".concat(errorItem.MESSAGE_V1, ", message v2: ").concat(errorItem.MESSAGE_V2, ", message v3: ").concat(errorItem.MESSAGE_V3, ", message v4: ").concat(errorItem.MESSAGE_V4));
                        }
                        var result = Lib.AP.SAP.Invoice.Simulate.GetItemnoAccFromError_retrieveFromParameterField(errorItem, params);
                        if (!result) {
                            result = Lib.AP.SAP.Invoice.Simulate.GetItemnoAccFromError_retrieveFromErrorItemStructure(errorItem, simulationReport);
                        }
                        if (!result) {
                            result = Lib.AP.SAP.Invoice.Simulate.GetItemnoAccFromError_retrieveFromBestMatch(errorItem, params, companyCode);
                        }
                        return result;
                    }
                    Simulate.GetItemnoAccFromError = GetItemnoAccFromError;
                    function FIReport(callback, params, simulationReport) {
                        // Initialize simulation report table
                        Lib.AP.SAP.Invoice.Simulate.FIReportInit(simulationReport);
                        Lib.AP.SAP.Invoice.Simulate.AddLastErrorOrExceptionMessage(simulationReport, params);
                        // Add the line items in the simulation report
                        var idx = 0;
                        var balance = 0.0;
                        var companyCode = Data.GetValue("CompanyCode__");
                        // ACCOUNTPAYABLE
                        var res = Lib.AP.SAP.Invoice.Simulate.FIReportAddTable(params, simulationReport, "ACCOUNTPAYABLE", idx);
                        balance += res.total;
                        idx = res.nLines;
                        // ACCOUNTGL
                        res = Lib.AP.SAP.Invoice.Simulate.FIReportAddTable(params, simulationReport, "ACCOUNTGL", idx);
                        balance += res.total;
                        idx = res.nLines;
                        // ACCOUNTTAX
                        res = Lib.AP.SAP.Invoice.Simulate.FIReportAddTable(params, simulationReport, "ACCOUNTTAX", idx);
                        balance += res.total;
                        // Total line
                        var item = {
                            ITM_NUMBER: params.SimulateInvoiceTotalLineNumber,
                            ACCOUNT_SHORT_TEXT: Language.Translate("_Balance"),
                            AMOUNT: Sys.Helpers.SAP.ConvertToDecimalFormat(Sys.Helpers.SAP.Round(balance))
                        };
                        simulationReport.Items.values.push(item);
                        // SAP Messages
                        var RETURN0 = params.Bapi.TABLES.RETURN;
                        if (RETURN0) {
                            for (var _i = 0, RETURN0_2 = RETURN0; _i < RETURN0_2.length; _i++) {
                                var ret = RETURN0_2[_i];
                                Lib.AP.SAP.Invoice.Simulate.FIReportAddSAPMessage(params, simulationReport, ret, companyCode);
                            }
                        }
                        callback();
                    }
                    Simulate.FIReport = FIReport;
                    // Generate the output of the simulation for display in the web page
                    function SAPSimulationOutput(simulationReport, isMM) {
                        function itemHasMessageOfType(table, itemNumber, types) {
                            for (var _i = 0, table_2 = table; _i < table_2.length; _i++) {
                                var item = table_2[_i];
                                if (item.itemnumber === itemNumber) {
                                    for (var _a = 0, types_1 = types; _a < types_1.length; _a++) {
                                        var type = types_1[_a];
                                        if (item.type === type) {
                                            return true;
                                        }
                                    }
                                }
                            }
                            return false;
                        }
                        function itemHasErrors(report, itemNumber) {
                            var hasError = itemHasMessageOfType(report.MessageSet.errors.texts, itemNumber, ["E", "A"]);
                            if (!hasError) {
                                hasError = itemHasMessageOfType(report.MessageSet.warnings.texts, itemNumber, ["E", "A"]);
                            }
                            if (!hasError) {
                                hasError = itemHasMessageOfType(report.MessageSet.informations.texts, itemNumber, ["E", "A"]);
                            }
                            if (!hasError) {
                                hasError = itemHasMessageOfType(report.MessageSet.messages.texts, itemNumber, ["E", "A"]);
                            }
                            return hasError;
                        }
                        function itemHasWarnings(report, itemNumber) {
                            var hasWarning = itemHasMessageOfType(report.MessageSet.errors.texts, itemNumber, ["W"]);
                            if (!hasWarning) {
                                hasWarning = itemHasMessageOfType(report.MessageSet.warnings.texts, itemNumber, ["W"]);
                            }
                            if (!hasWarning) {
                                hasWarning = itemHasMessageOfType(report.MessageSet.informations.texts, itemNumber, ["W"]);
                            }
                            if (!hasWarning) {
                                hasWarning = itemHasMessageOfType(report.MessageSet.messages.texts, itemNumber, ["W"]);
                            }
                            return hasWarning;
                        }
                        function itemHasInfos(report, itemNumber) {
                            var hasInfo = itemHasMessageOfType(report.MessageSet.errors.texts, itemNumber, ["I"]);
                            if (!hasInfo) {
                                hasInfo = itemHasMessageOfType(report.MessageSet.warnings.texts, itemNumber, ["I"]);
                            }
                            if (!hasInfo) {
                                hasInfo = itemHasMessageOfType(report.MessageSet.informations.texts, itemNumber, ["I"]);
                            }
                            if (!hasInfo) {
                                hasInfo = itemHasMessageOfType(report.MessageSet.messages.texts, itemNumber, ["I"]);
                            }
                            return hasInfo;
                        }
                        function getLineIcon(report, itemNumber) {
                            var icon = "icon-success";
                            if (itemHasErrors(report, itemNumber)) {
                                icon = "icon-error";
                            }
                            else if (itemHasWarnings(report, itemNumber)) {
                                icon = "icon-warning";
                            }
                            else if (itemHasInfos(report, itemNumber)) {
                                icon = "icon-info";
                            }
                            return icon;
                        }
                        function getMessageIcon(type) {
                            var icon;
                            switch (type) {
                                case "E":
                                case "A":
                                    icon = "icon-error";
                                    break;
                                case "W":
                                    icon = "icon-warning";
                                    break;
                                case "S":
                                    icon = "icon-success";
                                    break;
                                case "I":
                                    icon = "icon-info";
                                    break;
                                default: icon = "";
                            }
                            return icon;
                        }
                        function getMessage(table, itemNumber) {
                            for (var _i = 0, table_3 = table; _i < table_3.length; _i++) {
                                var item = table_3[_i];
                                if (item.itemnumber === itemNumber) {
                                    return item.message;
                                }
                            }
                            return "";
                        }
                        function addMessage(table) {
                            var lines = "";
                            for (var _i = 0, table_4 = table; _i < table_4.length; _i++) {
                                var item = table_4[_i];
                                var title = "title='[".concat(item.id, "&#x20;").concat(item.number, "]'");
                                lines += "<tr><td><div class='".concat(getMessageIcon(item.type), "' ").concat(title, " align='absmiddle'></td><td id='").concat(item.type, "&#x20;").concat(item.number, "&#x20;").concat(item.id, "'>");
                                lines += item.message;
                                lines += "</td></tr>";
                            }
                            return lines;
                        }
                        function addMessages(report) {
                            var messages = "<div><table cellspacing='0' cellpadding='0' class='simulationTableSub'>";
                            messages += addMessage(report.MessageSet.errors.texts);
                            messages += addMessage(report.MessageSet.warnings.texts);
                            messages += addMessage(report.MessageSet.informations.texts);
                            messages += addMessage(report.MessageSet.messages.texts);
                            messages += "</table>";
                            return messages;
                        }
                        function addLineHeaderCell(cellValue) {
                            return "<td class='list_header_text' align='left'>".concat(cellValue ? cellValue : "&#xA0;", "</td>");
                        }
                        function addLineHeader(columns) {
                            var header = "";
                            if (columns) {
                                header = "<tr class='list_header'>";
                                header += addLineHeaderCell(columns.LINEITEM);
                                header += addLineHeaderCell(columns.ACCOUNT);
                                if (!isMM) {
                                    header += addLineHeaderCell(columns.ACCOUNT_SHORT_TEXT);
                                }
                                header += addLineHeaderCell(columns.DESCRIPTION);
                                if (isMM) {
                                    header += addLineHeaderCell(columns.COND_TYPE);
                                    header += addLineHeaderCell(columns.PO_NUMBER);
                                    header += addLineHeaderCell(columns.PO_ITEM);
                                    header += addLineHeaderCell(columns.MATERIAL);
                                    header += addLineHeaderCell(columns.QUANTITY);
                                    header += addLineHeaderCell(columns.QTY_IN_PO);
                                    header += addLineHeaderCell(columns.QTY_TOTAL_INV);
                                    header += addLineHeaderCell(columns.QTY_DELIVERED);
                                }
                                else {
                                    header += addLineHeaderCell(columns.COST_CENTER);
                                    header += addLineHeaderCell(columns.ORDER);
                                    header += addLineHeaderCell(columns.ASSIGNMENT);
                                }
                                header += addLineHeaderCell(columns.TAXCODE);
                                if (isMM) {
                                    header += addLineHeaderCell(columns.TAXJURCODE);
                                    header += addLineHeaderCell(columns.CURRENCY);
                                }
                                header += addLineHeaderCell(columns.AMOUNT);
                                header += addLineHeaderCell(columns.ERRORS);
                                header += "</tr>";
                            }
                            return header;
                        }
                        function addLineCell(cellValue, align, bStrong, additionalAttrs, spanValue) {
                            if (bStrong === void 0) { bStrong = false; }
                            if (!align) {
                                align = "left";
                            }
                            var td = [];
                            td.push("<td class='list_text' align='");
                            td.push(align);
                            td.push("'");
                            if (additionalAttrs) {
                                td.push(additionalAttrs);
                            }
                            td.push(">");
                            if (spanValue) {
                                td.push("<span title='".concat(spanValue, "'>"));
                            }
                            if (bStrong) {
                                td.push("<strong>");
                            }
                            if (cellValue || cellValue === 0) {
                                td.push(cellValue);
                            }
                            else {
                                td.push("&#xA0;");
                            }
                            if (bStrong) {
                                td.push("</strong>");
                            }
                            if (spanValue) {
                                td.push("</span>");
                            }
                            td.push("</td>");
                            return td.join("");
                        }
                        function addLines(report) {
                            var lines = "<table cellspacing='0' cellpadding='0' style='border-width: 1px; border-style: solid; border-color: white;' class='simulationTableSub'>";
                            if (report.Items.values.length > 0) {
                                lines += addLineHeader(report.Items.columns);
                                var lineClass = ["edr-L1 edr-L", "edr-L2 edr-L"];
                                for (var idx = 0; idx < report.Items.values.length; idx++) {
                                    var line = report.Items.values[idx];
                                    lines += "<tr class='".concat(lineClass[idx % 2], "'>");
                                    var itemNumber = isMM ? line.IVDOC_LINEITEM : line.ITM_NUMBER;
                                    itemNumber = Sys.Helpers.String.SAP.NormalizeID(itemNumber, 6);
                                    if (itemNumber === "999999") {
                                        // This is the total line
                                        lines += addLineCell(line.ACCOUNT_SHORT_TEXT, "right", true, " colspan='".concat(isMM ? "13" : "8", "'"));
                                        if (isMM) {
                                            lines += addLineCell(line.CURRENCY, "center");
                                        }
                                    }
                                    else if (isMM) {
                                        var shortDescription = line.DESCRIPTION && line.DESCRIPTION.length > 12 ? line.DESCRIPTION.substr(0, 12) + "..." : line.DESCRIPTION;
                                        lines += addLineCell(line.LINEITEM, "center");
                                        lines += addLineCell(line.ACCOUNT, "left", false, "", line.ACCOUNT_SHORT_TEXT);
                                        lines += addLineCell(shortDescription, "left", false, " style='white-space: nowrap;'", line.DESCRIPTION);
                                        lines += addLineCell(line.COND_TYPE);
                                        lines += addLineCell(line.PO_NUMBER);
                                        lines += addLineCell(line.PO_ITEM, "right");
                                        lines += addLineCell(line.MATERIAL);
                                        lines += addLineCell(line.QUANTITY, "right", true);
                                        lines += addLineCell(line.QTY_IN_PO, "right");
                                        lines += addLineCell(line.QTY_TOTAL_INV, "right");
                                        lines += addLineCell(line.QTY_DELIVERED, "right");
                                        lines += addLineCell(line.TAXCODE, "center");
                                        lines += addLineCell(line.TAXJURCODE, "center");
                                        lines += addLineCell(line.CURRENCY, "center");
                                    }
                                    else {
                                        lines += addLineCell(line.LINEITEM, "center");
                                        lines += addLineCell(line.ACCOUNT, "center");
                                        lines += addLineCell(line.ACCOUNT_SHORT_TEXT);
                                        lines += addLineCell(line.DESCRIPTION);
                                        lines += addLineCell(line.COST_CENTER);
                                        lines += addLineCell(line.ORDER);
                                        lines += addLineCell(line.ASSIGNMENT);
                                        lines += addLineCell(line.TAXCODE, "center");
                                    }
                                    lines += addLineCell(line.AMOUNT, "right", true, " style='white-space: nowrap;'");
                                    lines += "<td align='center'><div class='".concat(getLineIcon(report, itemNumber), "' title='").concat(getMessage(report.MessageSet.messages.texts, itemNumber), "'></div></td></tr>");
                                }
                            }
                            lines += "</table>";
                            return lines;
                        }
                        var html = addMessages(simulationReport);
                        html += addLines(simulationReport);
                        html += "</div>";
                        return html;
                    }
                    Simulate.SAPSimulationOutput = SAPSimulationOutput;
                    function SAPSimulate(callback, blockPayment, isMM) {
                        var params = Lib.AP.SAP.Invoice.Simulate.CommonParamsInit(isMM);
                        var simulationReport = Lib.AP.SAP.Invoice.Simulate.CommonReportInit();
                        var documentType = Lib.AP.SAP.GetDocumentType();
                        var simulateFunc = isMM ? Lib.AP.SAP.Invoice.Simulate.MMSimulate : Lib.AP.SAP.Invoice.Simulate.FISimulate;
                        var reportFunc = isMM ? Lib.AP.SAP.Invoice.Simulate.MMReport : Lib.AP.SAP.Invoice.Simulate.FIReport;
                        var SAPSimulationOutputFunc = Lib.AP.SAP.Invoice.Simulate.SAPSimulationOutput;
                        var simulationError = "";
                        var simulationResult;
                        function reportFuncCallback() {
                            simulationResult = SAPSimulationOutputFunc(simulationReport, isMM);
                            callback(simulationResult, simulationReport, simulationError);
                        }
                        function duplicateCheckCallback(sapDuplicateCandidates) {
                            if (sapDuplicateCandidates.length > 0) {
                                //Add error message if duplicate detected
                                var duplicateErrorMessage = "";
                                if (sapDuplicateCandidates.length < 6) {
                                    duplicateErrorMessage = Language.Translate("_SAP Duplicate found", false, sapDuplicateCandidates.join(", "));
                                }
                                else {
                                    sapDuplicateCandidates.length = 5;
                                    duplicateErrorMessage = Language.Translate("_SAP Duplicate found", false, sapDuplicateCandidates.join(", ")) + "...";
                                }
                                Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "E", "009", duplicateErrorMessage);
                            }
                            reportFunc(reportFuncCallback, params, simulationReport);
                        }
                        function sapSimulateCallback(error) {
                            simulationError = error;
                            if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPDuplicateCheck") === "1") {
                                Lib.AP.SAP.GetDuplicateInvoiceClient()
                                    .Then(duplicateCheckCallback);
                            }
                            else {
                                reportFunc(reportFuncCallback, params, simulationReport);
                            }
                        }
                        function getLanguageCallback(lang) {
                            params.Language = lang;
                            simulateFunc(sapSimulateCallback, params, documentType, simulationReport, blockPayment);
                        }
                        Lib.AP.SAP.SAPGetSAPLanguageSync(getLanguageCallback);
                    }
                    Simulate.SAPSimulate = SAPSimulate;
                    /**
                    * Ask for a simulation to an ERP
                    *
                    * @param {function} callback The callback to call to get the result. Two parameters:
                        - The result of the query:
                            [
                                {attr1:value, attr2:value, ... },
                                {attr1:value, attr2:value, ... },
                                ...
                            ]
                        - The error message if any (in this case the first parameter is null)
                    * @param {boolean} blockPayment the payment
                    * @param {integer} maxRecords The maximum number of records returned [0 ; 100].
                                /!\ if maxRecords is undefined, the default maxRecords is 1 contrarily to the server Query API.
                    * @param {string} options The query options separated by ','
                        or {json}
                                {
                                    queryOptions: {string} the query options separated by ','
                                    useConstantQueryCache: {boolean} use constant query cache (by default false)
                                }
                    */
                    function ERPSimulate(callback, blockPayment) {
                        function erpSimulateCallback(simulateResult, simulationReport, error) {
                            if (error) {
                                Log.Error(error);
                                if (!simulateResult) {
                                    simulateResult = Language.Translate("An unexpected error occurred with the SAP connectivity.");
                                }
                            }
                            callback(simulateResult, simulationReport);
                        }
                        Variable.SetValueAsString("SHOW_SIMULATION_POPUP", "");
                        Variable.SetValueAsString("Simulation_Report", "");
                        Sys.Helpers.SAP.SetLastError("");
                        // FI simulation for invoice types Non-PO Invoice and PO Invoice (as FI)
                        // MM simulation for invoice type Po Invoice
                        Lib.AP.SAP.Invoice.Simulate.SAPSimulate(erpSimulateCallback, blockPayment, Lib.AP.InvoiceType.isPOInvoice());
                    }
                    Simulate.ERPSimulate = ERPSimulate;
                })(Simulate = Invoice.Simulate || (Invoice.Simulate = {}));
            })(Invoice = SAP.Invoice || (SAP.Invoice = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
