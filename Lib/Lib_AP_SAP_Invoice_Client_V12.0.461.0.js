///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_Invoice_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "library: SAP AP routines",
  "require": [
    "Lib_AP_SAP_Client_V12.0.461.0",
    "Lib_AP_SAP_Invoice_Common_V12.0.461.0",
    "Lib_AP_SAP_PurchaseOrder_Client_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP_Client",
    "[Lib_AP_Customization_HTMLScripts]"
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
                function DataSetValueIfExists(data, fieldName, sapName, uppercase) {
                    var value = Data.GetValue(fieldName);
                    if (value) {
                        if (uppercase && typeof value === "string") {
                            value = value.toUpperCase();
                        }
                        data[sapName] = value;
                    }
                }
                Invoice.DataSetValueIfExists = DataSetValueIfExists;
                function GetPaymentTerm(callback, vendorNumber, companyCode) {
                    function queryCallback(result) {
                        var paymentTerm = "";
                        if (result && result.length > 0) {
                            paymentTerm = result[0].ZTERM;
                            Data.SetValue("PaymentTerms__", paymentTerm);
                        }
                        callback(paymentTerm);
                    }
                    var invoicePaymentTerms = Data.GetValue("PaymentTerms__");
                    if (invoicePaymentTerms) {
                        callback(invoicePaymentTerms);
                    }
                    else {
                        Lib.AP.SAP.ReadSAPTable(queryCallback, Variable.GetValueAsString("SAPConfiguration"), "LFB1", "ZTERM", "LIFNR = '".concat(vendorNumber, "' AND BUKRS = '").concat(companyCode, "'"), 1, 0, false);
                    }
                }
                Invoice.GetPaymentTerm = GetPaymentTerm;
                function GetTaxProcedure(callback, companyCode) {
                    function queryCallback(result) {
                        var taxProcedure = "";
                        if (result && result.length > 0) {
                            taxProcedure = result[0].KALSM;
                        }
                        callback(taxProcedure);
                    }
                    Lib.AP.SAP.ReadSAPTable(queryCallback, Variable.GetValueAsString("SAPConfiguration"), "ZESK_TAXCODES", "KALSM", "BUKRS = '".concat(companyCode, "'"), 1, 0, false);
                }
                Invoice.GetTaxProcedure = GetTaxProcedure;
                function GetTaxJurisdictionStructure(callback, companyCode) {
                    function queryCallback(result) {
                        var length = 0;
                        var lineByLine = false;
                        if (result && result.length > 0) {
                            var l1 = result[0].LENG1;
                            var l2 = result[0].LENG2;
                            var l3 = result[0].LENG3;
                            var l4 = result[0].LENG4;
                            lineByLine = result[0].XTXIT === "X";
                            length = parseInt(l1, 10) + parseInt(l2, 10) + parseInt(l3, 10) + parseInt(l4, 10);
                        }
                        callback(length, lineByLine);
                    }
                    function getTaxProcedureCallback(taxProcedure) {
                        if (taxProcedure) {
                            Lib.AP.SAP.ReadSAPTable(queryCallback, Variable.GetValueAsString("SAPConfiguration"), "TTXD", "LENG1|LENG2|LENG3|LENG4|XTXIT", "KALSM = '".concat(taxProcedure, "'"), 1, 0, false);
                        }
                        else {
                            callback(0, false);
                        }
                    }
                    Lib.AP.SAP.Invoice.GetTaxProcedure(getTaxProcedureCallback, companyCode);
                }
                Invoice.GetTaxJurisdictionStructure = GetTaxJurisdictionStructure;
                /** MM Post and simulation common functions **/
                function MMHeaderSet(callback, params, simulationReport) {
                    var invoiceAmount = Data.GetValue("InvoiceAmount__");
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    var companyCode = Data.GetValue("CompanyCode__");
                    function endingMMHeaderSetCallBack() {
                        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.SAP.OnMMHeaderSet", params, params.Bapi.EXPORTS.HEADERDATA);
                        callback();
                    }
                    function getPaymentTermCallback(paymentTerm) {
                        params.Bapi.EXPORTS.HEADERDATA.PMNTTRMS = paymentTerm;
                        if (Data.GetValue("CalculateTax__")) {
                            params.Bapi.EXPORTS.HEADERDATA.CALC_TAX_IND = "X";
                            endingMMHeaderSetCallBack();
                        }
                        else {
                            Lib.AP.SAP.Invoice.MMAddTaxData(endingMMHeaderSetCallBack, params, simulationReport);
                        }
                    }
                    if (Data.GetValue("BaselineDate__") && Data.GetValue("BaselineDate__") !== "") {
                        params.Baseline_Date = Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("BaselineDate__"));
                    }
                    var postingDate = Data.GetValue("PostingDate__");
                    if (!postingDate) {
                        postingDate = new Date();
                    }
                    // Fill in Header Data
                    params.Bapi.EXPORTS.HEADERDATA = {
                        DOC_TYPE: params.Doc_Type,
                        DOC_DATE: Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("InvoiceDate__")),
                        DIFF_INV: vendorNumber,
                        COMP_CODE: companyCode,
                        CURRENCY: Data.GetValue("InvoiceCurrency__"),
                        REF_DOC_NO: Data.GetValue("InvoiceNumber__"),
                        GROSS_AMOUNT: Math.abs(invoiceAmount),
                        INVOICE_IND: invoiceAmount < 0 ? " " : "X",
                        PMNT_BLOCK: params.Invoice_Payment_Block,
                        BLINE_DATE: params.Baseline_Date,
                        ITEM_TEXT: Data.GetValue("InvoiceDescription__"),
                        PSTNG_DATE: Lib.AP.SAP.FormatToSAPDateTimeFormat(postingDate)
                    };
                    if (Data.GetValue("Investment__")) {
                        params.Bapi.EXPORTS.HEADERDATA.GOODS_AFFECTED = "X";
                    }
                    var selectedBankDetailsType = Lib.AP.SAP.GetSelectedBankDetailsType();
                    if (selectedBankDetailsType) {
                        params.Bapi.EXPORTS.HEADERDATA.PARTNER_BK = selectedBankDetailsType;
                    }
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(params.Bapi.EXPORTS.HEADERDATA, "HeaderText__", "HEADER_TXT");
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(params.Bapi.EXPORTS.HEADERDATA, "SAPPaymentMethod__", "PYMT_METH", true);
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(params.Bapi.EXPORTS.HEADERDATA, "Assignment__", "ALLOC_NMBR");
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(params.Bapi.EXPORTS.HEADERDATA, "BusinessArea__", "BUS_AREA", true);
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(params.Bapi.EXPORTS.HEADERDATA, "UnplannedDeliveryCosts__", "DEL_COSTS");
                    params.Subsequent_Doc = Data.GetValue("SubsequentDocument__");
                    // Invoice reference number
                    var invoiceRefNumber = Lib.AP.ParseInvoiceDocumentNumber(Data.GetValue("InvoiceReferenceNumber__"), true);
                    if (invoiceRefNumber) {
                        params.Bapi.EXPORTS.HEADERDATA.INV_REF_NO = invoiceRefNumber.documentNumber;
                        params.Bapi.EXPORTS.HEADERDATA.INV_YEAR = invoiceRefNumber.fiscalYear;
                    }
                    Lib.AP.SAP.Invoice.GetPaymentTerm(getPaymentTermCallback, vendorNumber, companyCode);
                }
                Invoice.MMHeaderSet = MMHeaderSet;
                function MMAddPOLine(params, line, itemNumber) {
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        var poNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("OrderNumber__"), 10);
                        var poItemNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("ItemNumber__"), 5);
                        var poItemToAdd = null;
                        var poItemData = null;
                        var accountingData = null;
                        function updateLineItems() {
                            // Always update lineItems with latest value from SAP
                            line.SetValue("OpenAmount__", Lib.AP.RoundWithDefaultPrecision(poItemData.refOpenInvoiceValue));
                            line.SetValue("OpenQuantity__", poItemData.refOpenInvoiceQuantity);
                            line.SetValue("ExpectedAmount__", Lib.AP.RoundWithDefaultPrecision(poItemData.refExpectedAmount));
                            line.SetValue("ExpectedQuantity__", poItemData.refExpectedQuantity);
                            params.Bapi.TABLES.ITEMDATA.push(poItemToAdd);
                            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.SAP.OnMMAddPOLine", params, line, poItemData, poItemToAdd);
                            resolve({ "item": poItemToAdd, "details": poItemData });
                        }
                        function getHistoricsPerPurchasingDocumentCallback(itemDetailedHistories) {
                            if (itemDetailedHistories && itemDetailedHistories.length > 0) {
                                var options = {
                                    refCurrency: Data.GetValue("InvoiceCurrency__"),
                                    exchangeRateDate: poItemData.OrderDate
                                };
                                Lib.AP.SAP.PurchaseOrder.ComputeTotalsForGR(itemDetailedHistories[0], itemDetailedHistories, poItemData, options)
                                    .Then(function (totals) {
                                    Lib.AP.SAP.PurchaseOrder.UpdateValuesOfGRItem(poItemData, totals);
                                    updateLineItems();
                                });
                            }
                            else {
                                updateLineItems();
                            }
                        }
                        function isDuplicate(item) {
                            if (!Lib.P2P.SAP.Soap.SAPValuesAreEqual(poNumber, item.PO_NUMBER) ||
                                !Lib.P2P.SAP.Soap.SAPValuesAreEqual(poItemNumber, item.PO_ITEM)) {
                                return false;
                            }
                            if (poItemData.Gr_Basediv) {
                                return line.GetValue("GoodsReceipt__") === [item.REF_DOC, item.REF_DOC_IT, item.REF_DOC_YEAR].join("-");
                            }
                            return true;
                        }
                        function getDeliveryCostItem(poDetails, condType) {
                            var pdcs = poDetails.PlannedDeliveryCosts;
                            var filteredPdcs = pdcs.filter(function (pdc) { return (Lib.P2P.SAP.Soap.SAPValuesAreEqual(pdc.Po_Number, poNumber) &&
                                Lib.P2P.SAP.Soap.SAPValuesAreEqual(pdc.Po_Item, poItemNumber) &&
                                pdc.Cond_Type === condType); });
                            return filteredPdcs.length ? filteredPdcs[0] : null;
                        }
                        function handleDuplicate(duplicate, isServiceItem, isLimitItem) {
                            duplicate.ITEM_AMOUNT += Math.abs(line.GetValue("Amount__"));
                            if (!isServiceItem && !isLimitItem) {
                                duplicate.QUANTITY += parseFloat(line.GetValue("Quantity__"));
                            }
                            resolve({ "item": duplicate, "details": poItemData });
                        }
                        function handleSubsequentDoc(isServiceItem, isLimitItem) {
                            poItemToAdd.DE_CRE_IND = "X";
                            if (isServiceItem || isLimitItem) {
                                poItemToAdd.QUANTITY = 0;
                            }
                            else {
                                // For subsequent document related to goods PO, in our experience we've always needed to force quantity to 1
                                // instead of using the open qty, but we are not 100% confident that this would work for all implementations
                                poItemToAdd.QUANTITY = 1;
                            }
                        }
                        function handleGRIVLines(isServiceItem) {
                            var completeWithGR = false;
                            var goodReceiptRef = line.GetValue("GoodsReceipt__");
                            if (goodReceiptRef) {
                                var splittedRef = goodReceiptRef.split("-");
                                if (splittedRef && splittedRef.length === 3) {
                                    var docNumber = splittedRef[0];
                                    var docLine = splittedRef[1];
                                    var docYear = splittedRef[2];
                                    poItemToAdd.REF_DOC_IT = docLine;
                                    poItemToAdd.REF_DOC_YEAR = docYear;
                                    if (isServiceItem) {
                                        poItemToAdd.SHEET_NO = docNumber;
                                    }
                                    else {
                                        poItemToAdd.REF_DOC = docNumber;
                                    }
                                    // Complete poItemData with GR related content
                                    poItemData.Ref_Doc = docNumber;
                                    Lib.AP.SAP.PurchaseOrder.GetHistoricsPerPurchasingDocument(getHistoricsPerPurchasingDocumentCallback, poNumber, poItemNumber, docNumber, docLine, docYear);
                                    completeWithGR = true;
                                }
                            }
                            return completeWithGR;
                        }
                        function getDetailsCallback(poResult) {
                            var poItemCondType = line.GetValue("PriceCondition__");
                            if (poResult) {
                                poItemData = poItemCondType ? getDeliveryCostItem(poResult, poItemCondType) : poResult.PO_ITEMS[poItemNumber];
                            }
                            else {
                                // In case of SAP connection error
                                poItemData = null;
                            }
                            if (!poItemData) {
                                var errMsg = "Lib.AP.SAP.PurchaseOrderDetails.GetDetails: item ".concat(poItemNumber, " with order number ").concat(poNumber);
                                errMsg += poItemCondType ? " and princing condition ".concat(poItemCondType) : "";
                                errMsg += " not found.";
                                Log.Error(errMsg);
                                resolve(null);
                                return;
                            }
                            // Set PO date for potential currency conversion
                            poItemData.OrderDate = poResult.PO_HEADER.DOC_DATE;
                            // Find if the line item is a "duplicate" one (for multiple account assignments)
                            var duplicate = Sys.Helpers.Array.Find(params.Bapi.TABLES.ITEMDATA, isDuplicate);
                            var invoiceDocItem = duplicate ? duplicate.INVOICE_DOC_ITEM : itemNumber;
                            accountingData = Sys.Helpers.Array.Filter(poResult.PO_ITEM_ACCOUNT_ASSIGNMENT, function (elt) { return Lib.P2P.SAP.Soap.SAPValuesAreEqual(elt.PO_ITEM, poItemNumber); });
                            var alreadyAdded = Sys.Helpers.Array.Filter(params.Bapi.TABLES.ACCOUNTINGDATA, function (elt) { return elt.INVOICE_DOC_ITEM === invoiceDocItem; });
                            var accountAssignmentFromPO = accountingData[alreadyAdded.length];
                            Lib.AP.SAP.AddAccountAssignmentLine(invoiceDocItem, accountAssignmentFromPO, poItemData, line, params.Subsequent_Doc, function (accountingLine) { return params.Bapi.TABLES.ACCOUNTINGDATA.push(accountingLine); });
                            var isServiceItem = poItemData.IsServiceItem();
                            var isLimitItem = poItemData.IsLimitItem();
                            if (duplicate && !poItemCondType) {
                                handleDuplicate(duplicate, isServiceItem, isLimitItem);
                                return;
                            }
                            var taxJurisdiction = line.GetValue("TaxJurisdiction__");
                            poItemToAdd = {
                                PO_NUMBER: poNumber,
                                PO_ITEM: poItemNumber,
                                TAX_CODE: Sys.Helpers.SAP.FormatTaxCode(line.GetValue("TaxCode__")),
                                TAXJURCODE: taxJurisdiction ? taxJurisdiction : "",
                                ITEM_AMOUNT: Math.abs(line.GetValue("Amount__")),
                                ITEM_TEXT: line.GetValue("Description__"),
                                INVOICE_DOC_ITEM: itemNumber
                            };
                            if (!isServiceItem && !isLimitItem) {
                                poItemToAdd.PO_UNIT = poItemData.Unit;
                                poItemToAdd.PO_PR_UOM = poItemData.Orderpr_Un;
                                var quantity = parseFloat(line.GetValue("Quantity__"));
                                if (!isNaN(quantity)) {
                                    poItemToAdd.QUANTITY = quantity;
                                }
                            }
                            // Subsequent Debit/Credit indicator
                            if (params.Subsequent_Doc) {
                                handleSubsequentDoc(isServiceItem, isLimitItem);
                            }
                            // Handle Planned delivery costs
                            if (poItemCondType) {
                                poItemToAdd.COND_TYPE = poItemCondType;
                            }
                            var completedWithGR = handleGRIVLines(isServiceItem);
                            if (!completedWithGR) {
                                updateLineItems();
                            }
                        }
                        Lib.AP.SAP.PurchaseOrder.GetDetails(getDetailsCallback, poNumber, Data.GetValue("InvoiceCurrency__"));
                    });
                }
                Invoice.MMAddPOLine = MMAddPOLine;
                function MMAddGLLine(params, line, itemNumber) {
                    var taxJurisdiction = line.GetValue("TaxJurisdiction__");
                    taxJurisdiction = taxJurisdiction ? taxJurisdiction.toUpperCase() : "";
                    var businessArea = line.GetValue("BusinessArea__");
                    businessArea = businessArea ? businessArea.toUpperCase() : "";
                    var compCode = line.GetValue("CompanyCode__");
                    compCode = compCode ? compCode : Data.GetValue("CompanyCode__");
                    var lineToAdd = {
                        //Fill in mandatory fields
                        INVOICE_DOC_ITEM: itemNumber,
                        GL_ACCOUNT: Sys.Helpers.String.SAP.NormalizeID(line.GetValue("GLAccount__"), 10),
                        COMP_CODE: compCode,
                        TAX_CODE: Sys.Helpers.SAP.FormatTaxCode(line.GetValue("TaxCode__")),
                        //Additional fields
                        ITEM_AMOUNT: Math.abs(line.GetValue("Amount__")),
                        TAXJURCODE: taxJurisdiction,
                        ITEM_TEXT: line.GetValue("Description__"),
                        COSTCENTER: Sys.Helpers.String.SAP.NormalizeID(line.GetValue("CostCenter__"), 10),
                        ORDERID: Sys.Helpers.String.SAP.NormalizeID(line.GetValue("InternalOrder__"), 12),
                        WBS_ELEM: line.GetValue("WBSElementID__") || line.GetValue("WBSElement__"),
                        BUS_AREA: businessArea,
                        ALLOC_NMBR: line.GetValue("Assignment__"),
                        DB_CR_IND: "S"
                    };
                    if (line.GetValue("Amount__") < 0) {
                        lineToAdd.DB_CR_IND = "H";
                    }
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.SAP.OnMMAddGLLine", params, line, lineToAdd);
                    params.Bapi.TABLES.GLACCOUNTDATA.push(lineToAdd);
                }
                Invoice.MMAddGLLine = MMAddGLLine;
                function MMAddTaxData(callback, params, simulationReport) {
                    var lineItems = Data.GetTable("LineItems__");
                    for (var idx = 0; idx < lineItems.GetItemCount(); idx++) {
                        var line = lineItems.GetItem(idx);
                        Lib.AP.SAP.Invoice.AddTaxAmount(params, Sys.Helpers.SAP.FormatTaxCode(line.GetValue("TaxCode__")), line.GetValue("TaxJurisdiction__"), "", line.GetValue("Amount__"), line.GetValue("TaxAmount__"));
                    }
                    var theoricTaxAmount = 0;
                    var invoiceCurrency;
                    // We should now have a table of the total amount of tax for each tax code.
                    // For each tax code add to the TAXDATA table in the BAPI Header the code and amount of tax.
                    var taxCodeValues, currentTaxCode, currentTaxJurisdiction, currentItemNumberTax;
                    var taxCodeSet = [];
                    for (var taxCodeId in Lib.AP.SAP.Invoice.GetAmountsByTaxAccount(params)) {
                        if (Object.prototype.hasOwnProperty.call(Lib.AP.SAP.Invoice.GetAmountsByTaxAccount(params), taxCodeId)) {
                            taxCodeSet.push(taxCodeId);
                        }
                    }
                    var taxCodeIdx = 0;
                    function getTaxAccountsCallback(taxAccountsList, amounts, tax) {
                        if (taxAccountsList) {
                            // compute theoric tax amount for this tax code
                            // (The sum on taxAccountsList should only be useful if TaxJurisdictionLength > 0)
                            var i = void 0;
                            for (i = 0; i < taxAccountsList.length; i++) {
                                theoricTaxAmount += taxAccountsList[i].Tax_Amount;
                            }
                            if (simulationReport && theoricTaxAmount !== amounts.taxAmount) {
                                // Warning: Amounts should be equal, may have balance errors...
                                var errorMessage = Language.Translate("_Tax entered incorrect (code '{0}', amount '{1}'), correct '{2}' '{3}'.", false, tax, Sys.Helpers.SAP.ConvertToDecimalFormat(amounts.taxAmount), Sys.Helpers.SAP.ConvertToDecimalFormat(theoricTaxAmount), invoiceCurrency);
                                Sys.Helpers.SAP.AddMessage(simulationReport, "messages", i, "ESKAP", "W", "707", errorMessage, tax, amounts.taxAmount.toString(), theoricTaxAmount.toString(), invoiceCurrency);
                            }
                        }
                        taxCodeIdx++;
                        forEachTaxCode();
                    }
                    function forEachTaxCode() {
                        if (taxCodeIdx < taxCodeSet.length) {
                            var taxKey = taxCodeSet[taxCodeIdx];
                            taxCodeValues = Lib.AP.SAP.Invoice.GetAmountForTaxKey(params, taxKey);
                            currentTaxCode = taxCodeValues.taxCode;
                            currentTaxJurisdiction = taxCodeValues.taxJurisdiction;
                            currentItemNumberTax = taxCodeValues.itemNumberTax;
                            var taxDataItem = {
                                TAX_AMOUNT: Math.abs(taxCodeValues.taxAmount),
                                TAX_CODE: currentTaxCode
                            };
                            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.SAP.OnMMAddTaxData", params, taxCodeValues, taxDataItem);
                            params.Bapi.TABLES.TAXDATA.push(taxDataItem);
                            var companyCode = Data.GetValue("CompanyCode__");
                            invoiceCurrency = Data.GetValue("InvoiceCurrency__");
                            var manualTax = !Data.GetValue("CalculateTax__");
                            if (manualTax) {
                                var getTaxAccounts = Lib.AP.SAP.GetTaxFromNetClient;
                                if (params.grossPosting) {
                                    getTaxAccounts = Lib.AP.SAP.GetTaxFromGrossClient;
                                }
                                getTaxAccounts(getTaxAccountsCallback, companyCode, currentTaxCode, currentTaxJurisdiction, currentItemNumberTax, invoiceCurrency, taxCodeValues.amount, taxCodeValues);
                            }
                            else {
                                taxCodeIdx++;
                                forEachTaxCode();
                            }
                        }
                        else {
                            callback();
                        }
                    }
                    forEachTaxCode();
                }
                Invoice.MMAddTaxData = MMAddTaxData;
                /** FI simulation common functions **/
                function FIHeaderSet(callback, params) {
                    function periodCallback(jsonResult) {
                        if (!jsonResult.ERRORS || jsonResult.ERRORS.length === 0) {
                            params.Bapi.EXPORTS.DOCUMENTHEADER.FISC_YEAR = jsonResult.IMPORTS.FISCAL_YEAR;
                            params.Bapi.EXPORTS.DOCUMENTHEADER.FIS_PERIOD = jsonResult.IMPORTS.FISCAL_PERIOD;
                        }
                        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.SAP.OnFIHeaderSet", params, params.Bapi.EXPORTS.DOCUMENTHEADER);
                        callback();
                    }
                    function userNameCallback(userName) {
                        params.Bapi.EXPORTS.DOCUMENTHEADER.USERNAME = userName;
                        var bapiParams = {
                            EXPORTS: {
                                COMPANYCODEID: Data.GetValue("CompanyCode__"),
                                POSTING_DATE: params.Bapi.EXPORTS.DOCUMENTHEADER.PSTNG_DATE
                            },
                            USECACHE: true
                        };
                        Lib.AP.SAP.SAPCallBapi(periodCallback, Variable.GetValueAsString("SAPConfiguration"), "BAPI_COMPANYCODE_GET_PERIOD", bapiParams);
                    }
                    var postingDate = Data.GetValue("PostingDate__");
                    if (!postingDate) {
                        postingDate = new Date();
                    }
                    // Object Id fields have to be empty
                    params.Bapi.EXPORTS.DOCUMENTHEADER = {
                        OBJ_TYPE: "",
                        OBJ_KEY: "",
                        OBJ_SYS: "",
                        AC_DOC_NO: "",
                        // Parameters - Document type and Business Transaction
                        DOC_TYPE: params.Doc_Type,
                        BUS_ACT: "RFBU",
                        // Fields from form
                        COMP_CODE: Data.GetValue("CompanyCode__"),
                        DOC_DATE: Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("InvoiceDate__")),
                        PSTNG_DATE: Lib.AP.SAP.FormatToSAPDateTimeFormat(postingDate),
                        REF_DOC_NO: Data.GetValue("InvoiceNumber__")
                    };
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(params.Bapi.EXPORTS.DOCUMENTHEADER, "HeaderText__", "HEADER_TXT");
                    if (Lib.AP.SAP.UsesWebServices()) {
                        var sapUser = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPWSUser");
                        userNameCallback(Sys.Helpers.Globals.User.erpUser || sapUser);
                    }
                    else {
                        Sys.Helpers.SAP.GetSAPUserName(userNameCallback, Variable.GetValueAsString("SAPConfiguration"));
                    }
                }
                Invoice.FIHeaderSet = FIHeaderSet;
                function FIPrepareForLines(callback, caller, params, simulationReport, blockPayment) {
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    if (Data.GetValue("BaselineDate__") && Data.GetValue("BaselineDate__") !== "") {
                        params.Baseline_Date = Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("BaselineDate__"));
                    }
                    if (blockPayment) {
                        params.Invoice_Payment_Block = Variable.GetValueAsString("InvoicePaymentBlock");
                    }
                    function fiComputePaymentTermsCallback() {
                        callback();
                    }
                    function getTaxJurisdictionStructureCallback(length, lineByLine) {
                        params.TaxJurisdictionLength = length;
                        params.TaxLineByLine = lineByLine;
                        var invoiceRefNumber = Lib.AP.ParseInvoiceDocumentNumber(Data.GetValue("InvoiceReferenceNumber__"), true);
                        if (invoiceRefNumber) {
                            caller.FIComputePaymentTerms(fiComputePaymentTermsCallback, params, invoiceRefNumber, simulationReport);
                        }
                        else {
                            if (Data.GetValue("InvoiceReferenceNumber__")) {
                                //Invalid invoice reference number
                                if (simulationReport) {
                                    Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "E", "007", Language.Translate("_Invalid invoice document number '{0}'", false, Data.GetValue("InvoiceReferenceNumber__")), "", "", "", "");
                                }
                                else {
                                    Log.Warn("Ignoring invalid value for InvoiceReferenceNumber__");
                                }
                            }
                            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.SAP.OnFIPrepareForLines", params, simulationReport);
                            callback();
                        }
                    }
                    function getPaymentTermCallback(paymentTerm) {
                        params.Invoice_Payment_Terms = paymentTerm;
                        Lib.AP.SAP.Invoice.GetTaxJurisdictionStructure(getTaxJurisdictionStructureCallback, Data.GetValue("CompanyCode__"));
                    }
                    Lib.AP.SAP.Invoice.GetPaymentTerm(getPaymentTermCallback, vendorNumber, Data.GetValue("CompanyCode__"));
                }
                Invoice.FIPrepareForLines = FIPrepareForLines;
                function FIAddVendorLine(params) {
                    //Process the vendor account line.
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    var itemNumber = "0000000001";
                    // ACCOUNTPAYABLE
                    var accountPayableItem = {
                        ITEMNO_ACC: itemNumber,
                        VENDOR_NO: vendorNumber,
                        BLINE_DATE: params.Baseline_Date,
                        PMNTTRMS: params.Invoice_Payment_Terms,
                        PMNT_BLOCK: params.Invoice_Payment_Block,
                        ITEM_TEXT: Data.GetValue("InvoiceDescription__")
                    };
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(accountPayableItem, "SAPPaymentMethod__", "PYMT_METH", true);
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(accountPayableItem, "Assignment__", "ALLOC_NMBR", true);
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(accountPayableItem, "BusinessArea__", "BUS_AREA", true);
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(accountPayableItem, "WithholdingTax__", "W_TAX_CODE", true);
                    if (!params.IsSimulation) {
                        // Alternative payee parameter only available in posting BAPI
                        var altPayeeNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("AlternativePayee__"), 10);
                        if (altPayeeNumber) {
                            accountPayableItem.ALT_PAYEE = altPayeeNumber;
                        }
                    }
                    var selectedBankDetailsType = Lib.AP.SAP.GetSelectedBankDetailsType();
                    if (selectedBankDetailsType) {
                        accountPayableItem.PARTNER_BK = selectedBankDetailsType;
                    }
                    // Vendor amount (always opposite sign)
                    var currencyAmountItem = {
                        CURRENCY: Data.GetValue("InvoiceCurrency__"),
                        ITEMNO_ACC: itemNumber,
                        AMT_DOCCUR: -Data.GetValue("InvoiceAmount__")
                    };
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.SAP.OnFIAddVendorLine", params, accountPayableItem, currencyAmountItem);
                    params.Bapi.TABLES.ACCOUNTPAYABLE.push(accountPayableItem);
                    params.Bapi.TABLES.CURRENCYAMOUNT.push(currencyAmountItem);
                }
                Invoice.FIAddVendorLine = FIAddVendorLine;
                function FIGetCompanyCodeLinesPeriod(callback, params) {
                    var lineCompanyCodes = [];
                    function periodCallback(jsonResult) {
                        if (jsonResult && (!jsonResult.ERRORS || jsonResult.ERRORS.length === 0)) {
                            var compCode = jsonResult.EXPORTS.COMPANYCODEID;
                            params.companyCodePeriods[compCode] = {
                                fiscalYear: jsonResult.IMPORTS.FISCAL_YEAR,
                                fiscalPeriod: jsonResult.IMPORTS.FISCAL_PERIOD
                            };
                        }
                        getPeriodByBAPI();
                    }
                    function getPeriodByBAPI() {
                        if (lineCompanyCodes.length === 0) {
                            callback();
                        }
                        else {
                            var lineCC = lineCompanyCodes.pop();
                            var bapiParams = {
                                EXPORTS: {
                                    COMPANYCODEID: lineCC,
                                    POSTING_DATE: params.Bapi.EXPORTS.DOCUMENTHEADER.PSTNG_DATE
                                },
                                USECACHE: true
                            };
                            Lib.AP.SAP.SAPCallBapi(periodCallback, Variable.GetValueAsString("SAPConfiguration"), "BAPI_COMPANYCODE_GET_PERIOD", bapiParams);
                        }
                    }
                    // Process line items
                    var lineItems = Data.GetTable("LineItems__");
                    for (var idx = 0; idx < lineItems.GetItemCount(); idx++) {
                        var line = lineItems.GetItem(idx);
                        var compCode = line.GetValue("CompanyCode__");
                        if (compCode && lineCompanyCodes.indexOf(compCode) === -1) {
                            lineCompanyCodes.push(compCode);
                        }
                    }
                    getPeriodByBAPI();
                }
                Invoice.FIGetCompanyCodeLinesPeriod = FIGetCompanyCodeLinesPeriod;
                function FIAddGLLine(params, line, itemNumber, itemNumberTaxIdx) {
                    // Process an account line
                    var lineCurrency = line.GetValue("InvoiceCurrency__");
                    var currency = lineCurrency ? lineCurrency : Data.GetValue("InvoiceCurrency__");
                    var accountNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("GLAccount__"), 10);
                    var costCenter = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("CostCenter__"), 10);
                    var lineCompCode = line.GetValue("CompanyCode__");
                    var compCode = lineCompCode ? lineCompCode : Data.GetValue("CompanyCode__");
                    var taxCode = Sys.Helpers.SAP.FormatTaxCode(line.GetValue("TaxCode__"));
                    var taxJurisdiction = line.GetValue("TaxJurisdiction__");
                    taxJurisdiction = taxJurisdiction ? taxJurisdiction.toUpperCase() : "";
                    var itemNumberTax = "";
                    if (params.TaxLineByLine) {
                        itemNumberTax = Sys.Helpers.SAP.BuildItemNumber(itemNumberTaxIdx, 6, 1);
                        itemNumberTaxIdx++;
                    }
                    // Accumulate tax amounts for later
                    Lib.AP.SAP.Invoice.AddTaxAmount(params, taxCode, taxJurisdiction, itemNumberTax, line.GetValue("Amount__"), line.GetValue("TaxAmount__"));
                    params.Accounts[accountNumber] = line.GetValue("GLDescription__");
                    // ACCOUNTGL
                    var accountGLItem = {
                        ITEMNO_ACC: itemNumber,
                        ITEMNO_TAX: itemNumberTax,
                        GL_ACCOUNT: accountNumber,
                        TAX_CODE: taxCode,
                        COSTCENTER: costCenter,
                        COMP_CODE: compCode,
                        ITEM_TEXT: line.GetValue("Description__"),
                        TAXJURCODE: taxJurisdiction,
                        BUS_AREA: line.GetValue("BusinessArea__"),
                        ALLOC_NMBR: line.GetValue("Assignment__"),
                        ORDERID: Sys.Helpers.String.SAP.NormalizeID(line.GetValue("InternalOrder__"), 12),
                        WBS_ELEMENT: line.GetValue("WBSElement__"),
                        TRADE_ID: Sys.Helpers.String.SAP.NormalizeID(line.GetValue("TradingPartner__"), 6)
                    };
                    if (lineCompCode && params.companyCodePeriods[lineCompCode]) {
                        accountGLItem.FIS_PERIOD = params.companyCodePeriods[lineCompCode].fiscalPeriod;
                        accountGLItem.FISC_YEAR = params.companyCodePeriods[lineCompCode].fiscalYear;
                    }
                    // CURRENCYAMOUNT
                    var currencyAmountItem = {
                        CURRENCY: currency,
                        ITEMNO_ACC: itemNumber,
                        AMT_DOCCUR: line.GetValue("Amount__")
                    };
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.SAP.OnFIAddGLLine", params, line, accountGLItem, currencyAmountItem);
                    params.Bapi.TABLES.ACCOUNTGL.push(accountGLItem);
                    params.Bapi.TABLES.CURRENCYAMOUNT.push(currencyAmountItem);
                    return itemNumberTaxIdx;
                }
                Invoice.FIAddGLLine = FIAddGLLine;
                function FIAddTaxLine(params, itemNumber, aTaxAccount, invoiceCurrency, computedTaxAmount, itemNumberTax) {
                    // CURRENCYAMOUNT
                    var currencyAmmountTax = {
                        CURRENCY: invoiceCurrency,
                        ITEMNO_ACC: itemNumber,
                        AMT_DOCCUR: computedTaxAmount
                    };
                    var amounts = Lib.AP.SAP.Invoice.GetAmountForTaxAccount(params, aTaxAccount, itemNumberTax);
                    if (params.grossPosting) {
                        currencyAmmountTax.AMT_BASE = aTaxAccount.Tax_Base_Amount;
                    }
                    else if (amounts) {
                        currencyAmmountTax.AMT_BASE = amounts.amount;
                    }
                    // ACCOUNTTAX
                    var accountTaxItem = {
                        ITEMNO_ACC: itemNumber,
                        ITEMNO_TAX: itemNumberTax ? itemNumberTax : "",
                        GL_ACCOUNT: aTaxAccount.Gl_Account,
                        TAX_CODE: aTaxAccount.Tax_Code,
                        TAXJURCODE: aTaxAccount.Taxjurcode,
                        ACCT_KEY: aTaxAccount.Acct_Key,
                        COND_KEY: aTaxAccount.Cond_Key,
                        TAX_RATE: aTaxAccount.Tax_Rate,
                        TAXJURCODE_DEEP: aTaxAccount.Taxjurcode_Deep,
                        TAXJURCODE_LEVEL: aTaxAccount.Taxjurcode_Level
                    };
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.SAP.OnFIAddTaxLine", params, aTaxAccount, accountTaxItem, currencyAmmountTax);
                    params.Bapi.TABLES.ACCOUNTTAX.push(accountTaxItem);
                    params.Bapi.TABLES.CURRENCYAMOUNT.push(currencyAmmountTax);
                }
                Invoice.FIAddTaxLine = FIAddTaxLine;
                function FIDispatchTaxAmount(params, aTaxAccount, totalAmountToDispatch, baseAmount, itemNumberTax) {
                    if (!aTaxAccount) {
                        return;
                    }
                    // Ignore useless tax lines
                    if (!aTaxAccount.Tax_Rate || !totalAmountToDispatch || !baseAmount) {
                        return;
                    }
                    // 1st pass: get the matching lines number
                    var nMatchingGLLines = 0;
                    var ACCOUNTGLIdx;
                    var ACCOUNTGL_Item;
                    var accountGL = params.Bapi.TABLES.ACCOUNTGL;
                    for (ACCOUNTGLIdx = 0; ACCOUNTGLIdx < accountGL.length; ACCOUNTGLIdx++) {
                        ACCOUNTGL_Item = accountGL[ACCOUNTGLIdx];
                        if (Lib.AP.SAP.Invoice.FIAccountGLMatch(ACCOUNTGL_Item, aTaxAccount, itemNumberTax)) {
                            nMatchingGLLines++;
                        }
                    }
                    // 2nd pass: dispatch the tax amount
                    var grossPostingFactor = params.grossPosting ? -1 : 1;
                    var amountToBeDispatched = totalAmountToDispatch;
                    for (ACCOUNTGLIdx = 0; ACCOUNTGLIdx < accountGL.length; ACCOUNTGLIdx++) {
                        ACCOUNTGL_Item = accountGL[ACCOUNTGLIdx];
                        if (Lib.AP.SAP.Invoice.FIAccountGLMatch(ACCOUNTGL_Item, aTaxAccount, itemNumberTax)) {
                            var currencyAmount = params.Bapi.TABLES.CURRENCYAMOUNT;
                            var CURRENCYAMOUNT_Item_Idx = Sys.Helpers.SAP.FindByInTable(currencyAmount, "ITEMNO_ACC", ACCOUNTGL_Item.ITEMNO_ACC);
                            if (CURRENCYAMOUNT_Item_Idx >= 0) {
                                var sum = void 0;
                                var CURRENCYAMOUNT_Item = currencyAmount[CURRENCYAMOUNT_Item_Idx];
                                // Avoid balance rounding errors
                                if (nMatchingGLLines === 1) {
                                    sum = CURRENCYAMOUNT_Item.AMT_DOCCUR;
                                    sum += amountToBeDispatched * grossPostingFactor;
                                }
                                else {
                                    sum = CURRENCYAMOUNT_Item.AMT_DOCCUR;
                                    var manualTaxRatio = sum / baseAmount;
                                    var manualTaxAmount = totalAmountToDispatch * manualTaxRatio;
                                    sum += Sys.Helpers.SAP.Round(manualTaxAmount * grossPostingFactor);
                                    amountToBeDispatched = amountToBeDispatched - Sys.Helpers.SAP.Round(manualTaxAmount);
                                }
                                CURRENCYAMOUNT_Item.AMT_DOCCUR = Sys.Helpers.SAP.Round(sum);
                                nMatchingGLLines--;
                            }
                        }
                    }
                }
                Invoice.FIDispatchTaxAmount = FIDispatchTaxAmount;
                function FIAddTaxLines(callback, params, itemNumberIdx, manualTax, simulationReport) {
                    var callbackExpected = !params || !params.AmountsByTaxCode ? 0 : Object.keys(params.AmountsByTaxCode).length;
                    var invoiceCurrency = Data.GetValue("InvoiceCurrency__");
                    var companyCode = Data.GetValue("CompanyCode__");
                    var errorMessage = "";
                    function getTaxAccountsCallback(taxAccountsList, amounts, tax, itemNumberTax) {
                        callbackExpected--;
                        if (taxAccountsList) {
                            var theoricTaxAmount = 0;
                            var taxAccIdx = void 0;
                            var aTaxAccount = void 0;
                            if (manualTax) {
                                // compute theoric tax amount for this tax code
                                // (The sum on taxAccountsList should only be useful if TaxJurisdictionLength > 0)
                                for (var i = 0; i < taxAccountsList.length; i++) {
                                    theoricTaxAmount += Lib.AP.RoundWithAmountPrecision(taxAccountsList[i].Tax_Amount);
                                }
                                // If theoric amount is 0, then tax amount impossible in this item (E 724 FF)
                                if (theoricTaxAmount === 0 && amounts.taxAmount !== 0) {
                                    errorMessage = Language.Translate("_Tax entry not possible in this item.");
                                    Lib.AP.SAP.Invoice.FISetManualTaxError(simulationReport, errorMessage, "724");
                                    callback(itemNumberIdx);
                                    return;
                                }
                                var sum = 0;
                                for (taxAccIdx = taxAccountsList.length - 1; taxAccIdx >= 0; taxAccIdx--) {
                                    aTaxAccount = taxAccountsList[taxAccIdx];
                                    taxAccountsList[taxAccIdx].computedTaxAmount = Lib.AP.RoundWithAmountPrecision(amounts.taxAmount * (aTaxAccount.Tax_Amount / theoricTaxAmount));
                                    sum += taxAccountsList[taxAccIdx].computedTaxAmount;
                                    if (taxAccIdx === 0) {
                                        // dispatch the leftover on first line (do not round to avoid balance issues)
                                        taxAccountsList[taxAccIdx].computedTaxAmount += amounts.taxAmount - sum;
                                    }
                                }
                            }
                            for (taxAccIdx = 0; taxAccIdx < taxAccountsList.length; taxAccIdx++) {
                                aTaxAccount = taxAccountsList[taxAccIdx];
                                var itemNumber = Sys.Helpers.SAP.BuildItemNumber(itemNumberIdx);
                                var computedTaxAmount = Lib.AP.RoundWithAmountPrecision(aTaxAccount.Tax_Amount);
                                if (manualTax && aTaxAccount.Tax_Rate !== 0) {
                                    // compute the tax amount for the current tax account
                                    computedTaxAmount = taxAccountsList[taxAccIdx].computedTaxAmount;
                                }
                                // Always add the tax lines (for correct dispatch in all tax levels)
                                Lib.AP.SAP.Invoice.FIAddTaxLine(params, itemNumber, aTaxAccount, invoiceCurrency, computedTaxAmount, itemNumberTax);
                                itemNumberIdx++;
                                // Ignore useless tax lines
                                if (aTaxAccount.Tax_Rate === 0) {
                                    continue;
                                }
                                if (manualTax && simulationReport && theoricTaxAmount !== amounts.taxAmount) {
                                    // Warning: Amounts should be equal, may have balance errors...
                                    errorMessage = Language.Translate("_Tax entered incorrect (code '{0}', amount '{1}'), correct '{2}' '{3}'.", false, tax, Sys.Helpers.SAP.ConvertToDecimalFormat(amounts.taxAmount), Sys.Helpers.SAP.ConvertToDecimalFormat(theoricTaxAmount), invoiceCurrency);
                                    Sys.Helpers.SAP.AddMessage(simulationReport, "messages", itemNumber, "ESKAP", "W", "707", errorMessage, tax, amounts.taxAmount.toString(), theoricTaxAmount.toString(), invoiceCurrency);
                                }
                                if (params.grossPosting || !aTaxAccount.Gl_Account) {
                                    // if Empty Tax G/L Account, tax amount should be dispatched within the items
                                    // or if gross posting, tax amount should be deducted from the items (to calculate net amounts)
                                    Lib.AP.SAP.Invoice.FIDispatchTaxAmount(params, aTaxAccount, computedTaxAmount, amounts.amount, itemNumberTax);
                                }
                            }
                        }
                        if (callbackExpected <= 0) {
                            callback(itemNumberIdx, taxAccountsList);
                        }
                    }
                    var noTaxAccounts = true;
                    // We have to create all tax lines from the tax codes set on GL lines
                    // Loop through each tax account for each tax code in the invoice
                    var AmountsByTaxCode = Lib.AP.SAP.Invoice.GetAmountsByTaxAccount(params);
                    for (var taxKey in AmountsByTaxCode) {
                        if (Object.prototype.hasOwnProperty.call(AmountsByTaxCode, taxKey)) {
                            noTaxAccounts = false;
                            var taxCodeAmounts = Lib.AP.SAP.Invoice.GetAmountForTaxKey(params, taxKey);
                            // Tax code may be concatenated with the jurisdiction code
                            var currentTaxCode = taxCodeAmounts.taxCode;
                            var currentTaxJurisdiction = taxCodeAmounts.taxJurisdiction;
                            var currentItemNumberTax = taxCodeAmounts.itemNumberTax;
                            // Check tax amount not greater than base amount
                            if (manualTax && Math.abs(taxCodeAmounts.taxAmount) > Math.abs(taxCodeAmounts.amount)) {
                                errorMessage = Language.Translate("_The tax amount must not be greater than the tax base.");
                                Lib.AP.SAP.Invoice.FISetManualTaxError(simulationReport, errorMessage, "747");
                                callback(itemNumberIdx);
                                return;
                            }
                            var getTaxAccounts = Lib.AP.SAP.GetTaxFromNetClient;
                            if (params.grossPosting) {
                                getTaxAccounts = Lib.AP.SAP.GetTaxFromGrossClient;
                            }
                            getTaxAccounts(getTaxAccountsCallback, companyCode, currentTaxCode, currentTaxJurisdiction, currentItemNumberTax, invoiceCurrency, taxCodeAmounts.amount, taxCodeAmounts);
                        }
                    }
                    if (noTaxAccounts) {
                        callback(itemNumberIdx);
                    }
                }
                Invoice.FIAddTaxLines = FIAddTaxLines;
                function FIAddWHT(params) {
                    if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("TaxesWithholdingTax", "") !== "Extended") {
                        return;
                    }
                    var lines = Data.GetTable("ExtendedWithholdingTax__");
                    for (var idx = 0; idx < lines.GetItemCount(); idx++) {
                        var whtLine = lines.GetItem(idx);
                        // Ignore invalid lines
                        if (!whtLine.GetValue("WHTCode__") || !whtLine.GetValue("WHTType__")) {
                            continue;
                        }
                        var whtItem = {
                            ITEMNO_ACC: "0000000001",
                            WT_CODE: whtLine.GetValue("WHTCode__") ? whtLine.GetValue("WHTCode__").toUpperCase() : null,
                            WT_TYPE: whtLine.GetValue("WHTType__") ? whtLine.GetValue("WHTType__").toUpperCase() : null,
                            BAS_AMT_TC: whtLine.GetValue("WHTBaseAmount__"),
                            MAN_AMT_TC: whtLine.GetValue("WHTTaxAmount__"),
                            BAS_AMT_IND: "X",
                            MAN_AMT_IND: whtLine.GetValue("WHTTaxAmountAuto__") ? " " : "X"
                        };
                        params.Bapi.TABLES.ACCOUNTWT.push(whtItem);
                    }
                }
                Invoice.FIAddWHT = FIAddWHT;
                function MMAddWHT(params) {
                    if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("TaxesWithholdingTax", "") !== "Extended") {
                        return;
                    }
                    var lines = Data.GetTable("ExtendedWithholdingTax__");
                    for (var idx = 0; idx < lines.GetItemCount(); idx++) {
                        var whtLine = lines.GetItem(idx);
                        var whtItem = {
                            SPLIT_KEY: "1",
                            WI_TAX_CODE: whtLine.GetValue("WHTCode__") ? whtLine.GetValue("WHTCode__").toUpperCase() : null,
                            WI_TAX_TYPE: whtLine.GetValue("WHTType__") ? whtLine.GetValue("WHTType__").toUpperCase() : null,
                            WI_TAX_BASE: whtLine.GetValue("WHTBaseAmount__"),
                            WI_TAX_AMT: whtLine.GetValue("WHTTaxAmount__")
                        };
                        params.Bapi.TABLES.WITHTAXDATA.push(whtItem);
                    }
                }
                Invoice.MMAddWHT = MMAddWHT;
            })(Invoice = SAP.Invoice || (SAP.Invoice = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
