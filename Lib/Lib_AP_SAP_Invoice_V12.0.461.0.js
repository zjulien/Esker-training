///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_Invoice_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: SAP AP routines",
  "require": [
    "Lib_AP_SAP_Server_V12.0.461.0",
    "Lib_AP_SAP_Invoice_Common_V12.0.461.0",
    "[Lib_AP_SAP_PurchaseOrder_Client_V12.0.461.0]",
    "[Lib_AP_SAP_PurchaseOrder_Server_V12.0.461.0]",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP"
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
                // #region classes
                var InvoiceParameters = /** @class */ (function (_super) {
                    __extends(InvoiceParameters, _super);
                    function InvoiceParameters(isSimulation, isMM, isConsignment, isClearing) {
                        var _this = _super.call(this) || this;
                        _this.IsSimulation = !!isSimulation;
                        _this.IsMM = !!isMM;
                        _this.IsConsignment = !!isConsignment;
                        _this.IsClearing = !!isClearing;
                        _this.BapiController = Lib.AP.SAP.GetNewBapiController();
                        _this.ResetParameters();
                        // Flag to trace data transferred to/from SAP bapi
                        _this.bDebugBapiOutput = null;
                        // POST usage
                        _this.TaxJurisdictionLength = 0;
                        // SIMULATION usage
                        // Flag to hide zero amount tax items from simulation result
                        _this.bHideZeroAmountTaxes = true;
                        return _this;
                    }
                    InvoiceParameters.prototype.ResetParameters = function () {
                        if (this.IsSimulation) {
                            // Special ITM_NUMBER to identify the total line.
                            this.SimulateInvoiceTotalLineNumber = "999999";
                        }
                        if (this.IsMM) {
                            this.Subsequent_Doc = null;
                            if (!this.IsSimulation) {
                                this.Fiscalyear = null;
                                this.Invoicedocnumber = null;
                            }
                        }
                        this.Doc_Type = "";
                        this.Baseline_Date = "";
                        this.Invoice_Payment_Terms = "";
                        this.Invoice_Payment_Block = "";
                        this.BapiController.ResetAllBapis();
                        // Wrapper BAPI PO_GETDETAIL trough purchaseOrderDetails object
                        this.PurchaseOrderDetails = null;
                        // BAPI exception message
                        this.Exception = "";
                        this.InvoiceSpecialType = "";
                        this.InvoiceSpecialTypeAmount = 0;
                        this.AmountsByTaxCode = {};
                    };
                    InvoiceParameters.prototype.InitBAPI_ACC_PYMNTBLK_UPDATE_POST = function () {
                        var originalBAPIName = "BAPI_ACC_PYMNTBLK_UPDATE_POST";
                        var bapiName = Lib.P2P.SAP.Soap.GetBAPIName(originalBAPIName);
                        bapiName = bapiName ? bapiName : originalBAPIName;
                        this.AddBapi(bapiName, originalBAPIName);
                        return this.BapiController.InitBapi(originalBAPIName);
                    };
                    InvoiceParameters.prototype.InitBAPI_INCOMINGINVOICE_RELEASE = function () {
                        var originalBAPIName = "BAPI_INCOMINGINVOICE_RELEASE";
                        var bapiName = Lib.P2P.SAP.Soap.GetBAPIName(originalBAPIName);
                        bapiName = bapiName ? bapiName : originalBAPIName;
                        this.AddBapi(bapiName, originalBAPIName);
                        return this.BapiController.InitBapi(originalBAPIName);
                    };
                    InvoiceParameters.prototype.Init = function (pSapControl) {
                        if (this.IsMM) {
                            this.InitMM();
                        }
                        else {
                            this.InitFI();
                        }
                        this.AddBapi(Lib.P2P.SAP.Soap.GetBAPIName("RFC_READ_TABLE") || "RFC_READ_TABLE");
                        var res = this.BapiController.Init(pSapControl);
                        if (res && this.IsMM) {
                            this.PurchaseOrderDetails = Lib.AP.SAP.PurchaseOrder.InitParameters(this.BapiController);
                            return this.PurchaseOrderDetails !== null;
                        }
                        return res;
                    };
                    InvoiceParameters.prototype.InitFI = function () {
                        if (this.IsSimulation) {
                            this.AddBapi(Lib.P2P.SAP.Soap.GetBAPIName("BAPI_ACC_DOCUMENT_CHECK"), "BAPI_ACC_DOCUMENT");
                            this.AddBapi("BAPI_GL_ACC_GETDETAIL");
                        }
                        else {
                            this.AddBapi(Lib.P2P.SAP.Soap.GetBAPIName("BAPI_ACC_DOCUMENT_POST"), "BAPI_ACC_DOCUMENT");
                        }
                        if (this.IsConsignment) {
                            this.AddBapi("Z_ESK_UPDATE_RKWA");
                        }
                        else if (this.IsClearing) {
                            this.AddBapi("Z_ESK_CLEAR_DOCUMENTS");
                        }
                        this.AddBapi("BAPI_COMPANYCODE_GET_PERIOD");
                    };
                    InvoiceParameters.prototype.InitMM = function () {
                        if (this.IsSimulation) {
                            this.AddBapi(Lib.P2P.SAP.Soap.GetBAPIName("Z_ESK_INCOMINGINVOICE_SIMULATE"), "BAPI_INCOMINGINVOICE");
                            this.AddBapi("BAPI_MESSAGE_GETDETAIL");
                            this.AddBapi("BAPI_GL_ACC_GETDETAIL");
                            this.AddBapi("Z_ESK_CONV_TO_FOREIGN_CURRENCY");
                        }
                        else {
                            this.AddBapi(Lib.P2P.SAP.Soap.GetBAPIName("BAPI_INCOMINGINVOICE_CREATE"), "BAPI_INCOMINGINVOICE");
                        }
                    };
                    return InvoiceParameters;
                }(Lib.AP.SAP.SAPParameters));
                Invoice.InvoiceParameters = InvoiceParameters;
                // #endregion
                // #region public
                function GetNewParameters(isSimulation) {
                    return new InvoiceParameters(isSimulation, Lib.AP.InvoiceType.isPOInvoice(), Lib.AP.InvoiceType.isConsignmentInvoice(), Lib.AP.InvoiceType.isClearingDocument());
                }
                Invoice.GetNewParameters = GetNewParameters;
                /** FI/MM wrapper Post and simulation common functions **/
                function FinalizeParameters(params) {
                    if (params) {
                        params.Finalize();
                    }
                }
                Invoice.FinalizeParameters = FinalizeParameters;
                function UnblockPayment(documentId) {
                    Log.Info("UnblockPayment");
                    // Check arguments
                    var parsedDocNumber = Lib.AP.ParseInvoiceDocumentNumber(documentId, true);
                    if (!parsedDocNumber) {
                        Sys.Helpers.SAP.SetLastError("UnblockPayment invalid arguments.");
                        return false;
                    }
                    if (parsedDocNumber.isFI) {
                        return Lib.AP.SAP.Invoice.FIUnblockPayment(parsedDocNumber);
                    }
                    return Lib.AP.SAP.Invoice.MMUnblockPayment(parsedDocNumber);
                }
                Invoice.UnblockPayment = UnblockPayment;
                function GetVendorDefaultPaymentTerm(rfcReadTableBapi, vendorNumber, companyCode) {
                    var results = Lib.AP.SAP.ReadSAPTable(rfcReadTableBapi, "LFB1", "ZTERM", "LIFNR = '".concat(vendorNumber, "' AND BUKRS = '").concat(companyCode, "'"), 1, 0, false, { "useCache": true });
                    if (results && results.length > 0) {
                        return results[0].ZTERM;
                    }
                    return "";
                }
                Invoice.GetVendorDefaultPaymentTerm = GetVendorDefaultPaymentTerm;
                function DataSetValueIfExists(data, fieldName, sapName, uppercase) {
                    var value = Data.GetValue(fieldName);
                    if (value && value !== "") {
                        if (uppercase && typeof value === "string") {
                            value = value.toUpperCase();
                        }
                        data.SetValue(sapName, value);
                    }
                }
                Invoice.DataSetValueIfExists = DataSetValueIfExists;
                function GetPaymentTerm(params, vendorNumber, companyCode) {
                    var invoicePaymentTerms = Data.GetValue("PaymentTerms__");
                    if (invoicePaymentTerms) {
                        return invoicePaymentTerms;
                    }
                    // Use vendor default payment term
                    invoicePaymentTerms = Lib.AP.SAP.Invoice.GetVendorDefaultPaymentTerm(params.GetBapi("RFC_READ_TABLE"), vendorNumber, companyCode);
                    Data.SetValue("PaymentTerms__", invoicePaymentTerms);
                    return invoicePaymentTerms;
                }
                Invoice.GetPaymentTerm = GetPaymentTerm;
                function GetTaxProcedure(rfcReadTableBapi, companyCode) {
                    var results = Lib.AP.SAP.ReadSAPTable(rfcReadTableBapi, "ZESK_TAXCODES", "KALSM", "BUKRS = '".concat(companyCode, "'"), 1, 0, false, { "useCache": true });
                    if (results && results.length > 0) {
                        return results[0].KALSM;
                    }
                    return "";
                }
                Invoice.GetTaxProcedure = GetTaxProcedure;
                function GetTaxJurisdictionStructure(rfcReadTableBapi, companyCode) {
                    var taxProcedure = Lib.AP.SAP.Invoice.GetTaxProcedure(rfcReadTableBapi, companyCode);
                    if (taxProcedure) {
                        var results = Lib.AP.SAP.ReadSAPTable(rfcReadTableBapi, "TTXD", "LENG1|LENG2|LENG3|LENG4|XTXIT", "KALSM = '".concat(taxProcedure, "'"), 1, 0, false, { "useCache": true });
                        if (results && results.length > 0) {
                            var d = {
                                jurLength: parseInt(results[0].LENG1, 10) + parseInt(results[0].LENG2, 10) + parseInt(results[0].LENG3, 10) + parseInt(results[0].LENG4, 10),
                                lineByLine: results[0].XTXIT === "X"
                            };
                            return d;
                        }
                    }
                    return null;
                }
                Invoice.GetTaxJurisdictionStructure = GetTaxJurisdictionStructure;
                // in seconds
                var GetFIDocumentIdFromMMDocumentId_RetryDelay = 0.5;
                // 10 times max
                var GetFIDocumentIdFromMMDocumentId_MaxNbRetries = 10;
                function GetFIDocumentIdFromMMDocumentId(rfcReadTableBapi, MMDocumentId, companyCode) {
                    var FIDocumentId = "";
                    var mm = Lib.AP.ParseInvoiceDocumentNumber(MMDocumentId, true);
                    if (mm) {
                        var invoiceDocumentFilter = Lib.AP.SAP.GetMMInvoiceDocumentTypeFilter();
                        if (invoiceDocumentFilter) {
                            invoiceDocumentFilter += "\n AND ";
                        }
                        var filter = "".concat(invoiceDocumentFilter, "BUKRS = '").concat(companyCode, "'\n AND AWKEY = '").concat(mm.documentNumber).concat(mm.fiscalYear, "'\n AND GJAHR = '").concat(mm.fiscalYear, "'");
                        for (var nbRetries = 0; !FIDocumentId && nbRetries < GetFIDocumentIdFromMMDocumentId_MaxNbRetries; nbRetries++) {
                            var results = Lib.AP.SAP.ReadSAPTable(rfcReadTableBapi, "BKPF", "BELNR|GJAHR", filter, 1, 0, false, { "useCache": false });
                            if (results && results.length > 0) {
                                FIDocumentId = Lib.AP.FormatInvoiceDocumentNumber(results[0].BELNR, results[0].GJAHR, companyCode);
                            }
                            else {
                                Log.Info("GetFIDocumentIdFromMMDocumentId: retry needed (" + (nbRetries + 1) + "/" + GetFIDocumentIdFromMMDocumentId_MaxNbRetries + "). Sleep " + GetFIDocumentIdFromMMDocumentId_RetryDelay + " seconds.");
                                Process.Sleep(GetFIDocumentIdFromMMDocumentId_RetryDelay);
                            }
                        }
                    }
                    return FIDocumentId;
                }
                Invoice.GetFIDocumentIdFromMMDocumentId = GetFIDocumentIdFromMMDocumentId;
                function MMAddTaxData(params, simulationReport) {
                    var lineItems = Data.GetTable("LineItems__");
                    for (var idx = 0; idx < lineItems.GetItemCount(); idx++) {
                        var line = lineItems.GetItem(idx);
                        Lib.AP.SAP.Invoice.AddTaxAmount(params, line.GetValue("TaxCode__").toUpperCase(), line.GetValue("TaxJurisdiction__"), "", line.GetValue("Amount__"), line.GetValue("TaxAmount__"));
                    }
                    // We should now have a table of the total amount of tax for each tax code.
                    // For each tax code add to the TAXDATA table in the BAPI Header the code and amount of tax.
                    var TaxTable = params.GetTable("BAPI_INCOMINGINVOICE", "TAXDATA");
                    var taxCodeValues, TaxItem, currentTaxCode, currentTaxJurisdiction, currentItemNumberTax;
                    var AmountsByTaxCode = Lib.AP.SAP.Invoice.GetAmountsByTaxAccount(params);
                    for (var taxKey in AmountsByTaxCode) {
                        if (!Object.prototype.hasOwnProperty.call(AmountsByTaxCode, taxKey)) {
                            continue;
                        }
                        taxCodeValues = Lib.AP.SAP.Invoice.GetAmountForTaxKey(params, taxKey);
                        TaxItem = TaxTable.AddNew();
                        // Take care to ensure only the first 2 characters are taken
                        // Others may be using this array !
                        currentTaxCode = taxCodeValues.taxCode;
                        currentTaxJurisdiction = taxCodeValues.taxJurisdiction;
                        currentItemNumberTax = taxCodeValues.itemNumberTax;
                        TaxItem.SetValue("TAX_AMOUNT", Math.abs(taxCodeValues.taxAmount));
                        TaxItem.SetValue("TAX_CODE", currentTaxCode);
                        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnMMAddTaxData", params, taxCodeValues, TaxItem);
                        // Tax code may be concatenated with the jurisdiction code
                        var companyCode = Data.GetValue("CompanyCode__");
                        var invoiceCurrency = Data.GetValue("InvoiceCurrency__");
                        var manualTax = !Data.GetValue("CalculateTax__");
                        if (manualTax) {
                            var theoricTaxAmount = 0;
                            var getTaxAccounts = Lib.AP.SAP.GetTaxFromNetServer;
                            if (params.grossPosting) {
                                getTaxAccounts = Lib.AP.SAP.GetTaxFromGrossServer;
                            }
                            var taxAccountsList = getTaxAccounts(params.BapiController.GetBapiManager(), companyCode, currentTaxCode, currentTaxJurisdiction, currentItemNumberTax, invoiceCurrency, taxCodeValues.amount);
                            if (taxAccountsList) {
                                // compute theoric tax amount for this tax code
                                // (The sum on taxAccountsList should only be useful if TaxJurisdictionLength > 0)
                                var i = 0;
                                for (; i < taxAccountsList.length; i++) {
                                    theoricTaxAmount += taxAccountsList[i].Tax_Amount;
                                }
                                if (simulationReport && theoricTaxAmount !== taxCodeValues.taxAmount) {
                                    // Warning: Amounts should be equal, may have balance errors...
                                    var errorMessage = params.BapiController.sapi18n("_Tax entered incorrect (code %1, amount %2), correct %3 %4.", [currentTaxCode, Sys.Helpers.SAP.ConvertToDecimalFormat(params.BapiController.sapControl, taxCodeValues.taxAmount), Sys.Helpers.SAP.ConvertToDecimalFormat(params.BapiController.sapControl, theoricTaxAmount), invoiceCurrency]);
                                    Sys.Helpers.SAP.AddMessage(simulationReport, "messages", i.toString(), "ESKAP", "W", "707", errorMessage, currentTaxCode, taxCodeValues.taxAmount, theoricTaxAmount.toString(), invoiceCurrency);
                                }
                            }
                        }
                    }
                }
                Invoice.MMAddTaxData = MMAddTaxData;
                /** MM Post and simulation common functions **/
                function MMHeaderSet(params, simulationReport) {
                    var invoiceAmount = Data.GetValue("InvoiceAmount__");
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    var companyCode = Data.GetValue("CompanyCode__");
                    var baselineDate = Data.GetValue("BaselineDate__");
                    if (baselineDate && baselineDate.toString() !== "") {
                        params.Baseline_Date = Lib.AP.SAP.FormatToSAPDateTimeFormat(baselineDate);
                    }
                    // Fill in Header Data
                    var headerData = params.GetExport("BAPI_INCOMINGINVOICE", "HEADERDATA");
                    headerData.SetValue("DOC_TYPE", params.Doc_Type);
                    headerData.SetValue("DIFF_INV", vendorNumber);
                    headerData.SetValue("COMP_CODE", companyCode);
                    headerData.SetValue("CURRENCY", Data.GetValue("InvoiceCurrency__"));
                    headerData.SetValue("REF_DOC_NO", Data.GetValue("InvoiceNumber__"));
                    headerData.SetValue("DOC_DATE", Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("InvoiceDate__")));
                    headerData.SetValue("GROSS_AMOUNT", Math.abs(invoiceAmount));
                    headerData.SetValue("INVOICE_IND", invoiceAmount < 0 ? " " : "X");
                    headerData.SetValue("PMNTTRMS", Lib.AP.SAP.Invoice.GetPaymentTerm(params, vendorNumber, companyCode));
                    headerData.SetValue("PSTNG_DATE", Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("PostingDate__")));
                    headerData.SetValue("PMNT_BLOCK", params.Invoice_Payment_Block);
                    headerData.SetValue("BLINE_DATE", params.Baseline_Date);
                    headerData.SetValue("ITEM_TEXT", Data.GetValue("InvoiceDescription__"));
                    if (Data.GetValue("Investment__")) {
                        headerData.SetValue("GOODS_AFFECTED", "X");
                    }
                    var selectedBankDetailsType = Lib.AP.SAP.GetSelectedBankDetailsType();
                    if (selectedBankDetailsType) {
                        headerData.SetValue("PARTNER_BK", selectedBankDetailsType);
                    }
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(headerData, "SAPPaymentMethod__", "PYMT_METH", true);
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(headerData, "Assignment__", "ALLOC_NMBR");
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(headerData, "HeaderText__", "HEADER_TXT");
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(headerData, "BusinessArea__", "BUS_AREA", true);
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(headerData, "UnplannedDeliveryCosts__", "DEL_COSTS");
                    // No support (yet) for subsequent debit or credit
                    params.Subsequent_Doc = Data.GetValue("SubsequentDocument__");
                    if (Data.GetValue("CalculateTax__")) {
                        headerData.SetValue("CALC_TAX_IND", "X");
                    }
                    else {
                        Lib.AP.SAP.Invoice.MMAddTaxData(params, simulationReport);
                    }
                    /* No support (yet) for the following fields
                    headerData.SetValue("PMTMTHSUPL", Data.GetValue("PaymentMethodSup__"));
                    */
                    // Invoice reference number
                    var invoiceRefNumber = Lib.AP.ParseInvoiceDocumentNumber(Data.GetValue("InvoiceReferenceNumber__"), true);
                    if (invoiceRefNumber) {
                        headerData.SetValue("INV_REF_NO", invoiceRefNumber.documentNumber);
                        headerData.SetValue("INV_YEAR", invoiceRefNumber.fiscalYear);
                    }
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnMMHeaderSet", params, headerData);
                    return true;
                }
                Invoice.MMHeaderSet = MMHeaderSet;
                function MMAddPOLine(params, line, itemNumber, itemByPo) {
                    function findDuplicate(table) {
                        for (var i = 0; i < table.Count; i++) {
                            var e = table.Get(i);
                            if (Lib.P2P.SAP.Soap.SAPValuesAreEqual(poNumber, e.GetValue("PO_NUMBER")) &&
                                Lib.P2P.SAP.Soap.SAPValuesAreEqual(poItemNumber, e.GetValue("PO_ITEM"))) {
                                if (poItemData.Gr_Basediv) {
                                    if (line.GetValue("GoodsReceipt__") === [e.GetValue("REF_DOC"), e.GetValue("REF_DOC_IT"), e.GetValue("REF_DOC_YEAR")].join("-")) {
                                        return e;
                                    }
                                }
                                else {
                                    return e;
                                }
                            }
                        }
                        return null;
                    }
                    function getDeliveryCostItem(poDetails, condType) {
                        var pdcs = poDetails.PlannedDeliveryCosts;
                        var filteredPdcs = pdcs.filter(function (pdc) {
                            return Lib.P2P.SAP.Soap.SAPValuesAreEqual(pdc.Po_Number, poNumber) &&
                                Lib.P2P.SAP.Soap.SAPValuesAreEqual(pdc.Po_Item, poItemNumber) &&
                                pdc.Cond_Type === condType;
                        });
                        return filteredPdcs.length ? filteredPdcs[0] : null;
                    }
                    var itemDataTable = params.GetTable("BAPI_INCOMINGINVOICE", "ITEMDATA");
                    var poItemCondType = line.GetValue("PriceCondition__");
                    var poNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("OrderNumber__"), 10);
                    var poItemNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("ItemNumber__"), 5);
                    var poResult = Lib.AP.SAP.PurchaseOrder.GetDetails(params.PurchaseOrderDetails, poNumber, true, itemByPo);
                    if (!poResult) {
                        Log.Error("Lib.AP.SAP.PurchaseOrderDetails.GetDetails: not result");
                        return null;
                    }
                    var poItemData = poItemCondType ? getDeliveryCostItem(poResult, poItemCondType) : poResult.PO_ITEMS[poItemNumber];
                    if (!poItemData) {
                        Log.Error("Lib.AP.SAP.PurchaseOrderDetails.GetDetails: item " + line.GetValue("ItemNumber__") + " not found");
                        return null;
                    }
                    // Find if the line item is a "duplicate" one (for multiple account assignments)
                    var duplicate = findDuplicate(itemDataTable);
                    var invoiceDocItem = duplicate ? duplicate.GetValue("INVOICE_DOC_ITEM") : itemNumber;
                    var accountingDataTable = params.GetTable("BAPI_INCOMINGINVOICE", "ACCOUNTINGDATA");
                    // Add account assignment
                    var accountAssignmentFromPO = null;
                    if (poResult.AccountAssignments[poItemNumber]) {
                        var alreadyAdded = 0;
                        for (var i = 1; i <= accountingDataTable.Count; i++) {
                            if (accountingDataTable.GetValue(i, "INVOICE_DOC_ITEM") === invoiceDocItem) {
                                alreadyAdded++;
                            }
                        }
                        accountAssignmentFromPO = poResult.AccountAssignments[poItemNumber][alreadyAdded];
                    }
                    Lib.AP.SAP.AddAccountAssignmentLine(invoiceDocItem, accountAssignmentFromPO, poItemData, line, params.Subsequent_Doc, function (accountingLine) {
                        var accountAssignment = accountingDataTable.AddNew();
                        for (var f in accountingLine) {
                            if (Object.prototype.hasOwnProperty.call(accountingLine, f)) {
                                accountAssignment.SetValue(f, accountingLine[f]);
                            }
                        }
                    });
                    var isServiceItem = poItemData.IsServiceItem();
                    var isLimitItem = poItemData.IsLimitItem();
                    if (duplicate && !poItemCondType) {
                        duplicate.SetValue("ITEM_AMOUNT", duplicate.GetValue("ITEM_AMOUNT") + line.GetValue("Amount__"));
                        if (!isServiceItem && !isLimitItem) {
                            duplicate.SetValue("QUANTITY", duplicate.GetValue("QUANTITY") + line.GetValue("Quantity__"));
                        }
                        return {
                            item: duplicate,
                            details: poItemData
                        };
                    }
                    var item = itemDataTable.AddNew();
                    var taxJurisdiction = line.GetValue("TaxJurisdiction__");
                    // Set the PO number & the PO Item number
                    item.SetValue("PO_NUMBER", poNumber);
                    item.SetValue("PO_ITEM", poItemNumber);
                    item.SetValue("TAX_CODE", line.GetValue("TaxCode__").toUpperCase());
                    item.SetValue("TAXJURCODE", taxJurisdiction ? taxJurisdiction : "");
                    item.SetValue("ITEM_AMOUNT", Math.abs(line.GetValue("Amount__")));
                    item.SetValue("ITEM_TEXT", line.GetValue("Description__"));
                    item.SetValue("INVOICE_DOC_ITEM", itemNumber);
                    if (!isServiceItem && !isLimitItem) {
                        item.SetValue("PO_UNIT", poItemData.Unit);
                        item.SetValue("PO_PR_UOM", poItemData.Orderpr_Un);
                        item.SetValue("QUANTITY", line.GetValue("Quantity__"));
                    }
                    // Subsequent Debit/Credit indicator
                    if (params.Subsequent_Doc) {
                        item.SetValue("DE_CRE_IND", "X");
                        if (isServiceItem || isLimitItem) {
                            item.SetValue("QUANTITY", 0);
                        }
                        else {
                            // For subsequent document related to goods PO, in our experience we've always needed to force quantity to 1
                            // instead of using the open qty, but we are not 100% confident that this would work for all implementations
                            item.SetValue("QUANTITY", 1);
                        }
                    }
                    // GR/IV lines
                    var goodReceiptRef = line.GetValue("GoodsReceipt__");
                    if (goodReceiptRef) {
                        var splittedRef = goodReceiptRef.split("-");
                        if (splittedRef && splittedRef.length === 3) {
                            var docNumber = splittedRef[0];
                            var docLine = splittedRef[1];
                            var docYear = splittedRef[2];
                            item.SetValue("REF_DOC_IT", docLine);
                            item.SetValue("REF_DOC_YEAR", docYear);
                            if (isServiceItem) {
                                item.SetValue("SHEET_NO", docNumber);
                            }
                            else {
                                item.SetValue("REF_DOC", docNumber);
                            }
                            // Complete poItemData with GR related content
                            poItemData.Ref_Doc = docNumber;
                            var itemDetailedHistories = Lib.AP.SAP.PurchaseOrder.GetHistoricsPerPurchasingDocument(params, poNumber, poItemNumber, docNumber, docLine, docYear);
                            if (itemDetailedHistories && itemDetailedHistories.length > 0) {
                                var options = {
                                    bapiController: params.PurchaseOrderDetails.BapiController,
                                    refCurrency: poItemData.refCurrency,
                                    exchangeRateDate: poResult.PO_HEADER.GetValue("DOC_DATE")
                                };
                                var totals = Lib.AP.SAP.PurchaseOrder.ComputeTotalsForGR(itemDetailedHistories[0], itemDetailedHistories, poItemData, options);
                                Lib.AP.SAP.PurchaseOrder.UpdateValuesOfGRItem(poItemData, totals);
                            }
                        }
                    }
                    // Handle Planned delivery costs
                    if (poItemCondType) {
                        item.SetValue("COND_TYPE", poItemCondType);
                    }
                    // Always update lineItems with latest value from SAP
                    line.SetValue("OpenAmount__", Lib.AP.RoundWithDefaultPrecision(poItemData.refOpenInvoiceValue));
                    line.SetValue("OpenQuantity__", poItemData.refOpenInvoiceQuantity);
                    line.SetValue("ExpectedAmount__", Lib.AP.RoundWithDefaultPrecision(poItemData.refExpectedAmount));
                    line.SetValue("ExpectedQuantity__", poItemData.refExpectedQuantity);
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnMMAddPOLine", params, line, poItemData, item);
                    return {
                        item: item,
                        details: poItemData
                    };
                }
                Invoice.MMAddPOLine = MMAddPOLine;
                function MMAddGLLine(params, line, itemNumber) {
                    var glAccountItem = params.GetTable("BAPI_INCOMINGINVOICE", "GLACCOUNTDATA").AddNew();
                    var taxJurisdiction = line.GetValue("TaxJurisdiction__");
                    taxJurisdiction = taxJurisdiction ? taxJurisdiction.toUpperCase() : "";
                    var compCode = line.GetValue("CompanyCode__");
                    compCode = compCode ? compCode : Data.GetValue("CompanyCode__");
                    //Fill in mandatory fields
                    glAccountItem.SetValue("INVOICE_DOC_ITEM", itemNumber);
                    glAccountItem.SetValue("GL_ACCOUNT", Sys.Helpers.String.SAP.NormalizeID(line.GetValue("GLAccount__"), 10));
                    glAccountItem.SetValue("TAX_CODE", Sys.Helpers.SAP.FormatTaxCode(line.GetValue("TaxCode__")));
                    if (line.GetValue("Amount__") < 0) {
                        glAccountItem.SetValue("DB_CR_IND", "H");
                    }
                    else {
                        glAccountItem.SetValue("DB_CR_IND", "S");
                    }
                    //Additional fields
                    glAccountItem.SetValue("ITEM_AMOUNT", Math.abs(line.GetValue("Amount__")));
                    glAccountItem.SetValue("TAXJURCODE", taxJurisdiction);
                    glAccountItem.SetValue("ITEM_TEXT", line.GetValue("Description__"));
                    glAccountItem.SetValue("COSTCENTER", Sys.Helpers.String.SAP.NormalizeID(line.GetValue("CostCenter__"), 10));
                    glAccountItem.SetValue("COMP_CODE", compCode);
                    glAccountItem.SetValue("ORDERID", Sys.Helpers.String.SAP.NormalizeID(line.GetValue("InternalOrder__"), 12));
                    glAccountItem.SetValue("WBS_ELEM", line.GetValue("WBSElementID__") || line.GetValue("WBSElement__"));
                    var businessArea = line.GetValue("BusinessArea__");
                    glAccountItem.SetValue("BUS_AREA", businessArea ? businessArea.toUpperCase() : "");
                    glAccountItem.SetValue("ALLOC_NMBR", line.GetValue("Assignment__"));
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnMMAddGLLine", params, line, glAccountItem);
                    return { item: glAccountItem };
                }
                Invoice.MMAddGLLine = MMAddGLLine;
                function MMUnblockPayment(parsedDocNumber) {
                    var params = Lib.AP.SAP.Invoice.GetNewParameters();
                    try {
                        var bapiManagerInitiated = false;
                        var bapiManager = null;
                        if (Lib.AP.SAP.UsesWebServices()) {
                            bapiManagerInitiated = params.BapiController.InitBapiWSManager();
                            bapiManager = params.BapiController.bapiWSManager;
                        }
                        else {
                            var sapControl = Sys.Helpers.SAP.GetSAPControl();
                            bapiManagerInitiated = params.BapiController.InitBapiManager(sapControl);
                            bapiManager = params.BapiController.GetBapiManager();
                        }
                        if (!bapiManagerInitiated || !params.InitBAPI_INCOMINGINVOICE_RELEASE()) {
                            Sys.Helpers.SAP.SetLastError("UnblockPayment failed to initialize BAPI.");
                            return false;
                        }
                        // Unblock invoice payment
                        params.GetBapi("BAPI_INCOMINGINVOICE_RELEASE").ExportsPool.SetValue("INVOICEDOCNUMBER", parsedDocNumber.documentNumber);
                        params.GetBapi("BAPI_INCOMINGINVOICE_RELEASE").ExportsPool.SetValue("FISCALYEAR", parsedDocNumber.fiscalYear);
                        params.Exception = params.GetBapi("BAPI_INCOMINGINVOICE_RELEASE").Call();
                        if (params.Exception) {
                            Sys.Helpers.SAP.SetLastError(params.Exception);
                        }
                        else {
                            var commitResult = bapiManager.CommitWork();
                            if (commitResult) {
                                var RETURN0 = params.GetBapi("BAPI_INCOMINGINVOICE_RELEASE").TablesPool.Get("RETURN");
                                if (!Sys.Helpers.SAP.ExtractErrors(RETURN0)) {
                                    return true;
                                }
                            }
                            else {
                                Sys.Helpers.SAP.SetLastError("Commit failed: " + bapiManager.GetLastError());
                            }
                        }
                    }
                    finally {
                        params.Finalize();
                    }
                    return false;
                }
                Invoice.MMUnblockPayment = MMUnblockPayment;
                /** FI Post and simulation common functions **/
                function FIHeaderSet(params) {
                    // Object Id fields have to be empty
                    var docHeader = params.GetExport("BAPI_ACC_DOCUMENT", "DOCUMENTHEADER");
                    docHeader.SetValue("OBJ_TYPE", "");
                    docHeader.SetValue("OBJ_KEY", "");
                    docHeader.SetValue("OBJ_SYS", "");
                    docHeader.SetValue("AC_DOC_NO", "");
                    // Parameters - Document type and Business Transaction
                    docHeader.SetValue("DOC_TYPE", params.Doc_Type);
                    docHeader.SetValue("BUS_ACT", "RFBU");
                    // Fields from form
                    docHeader.SetValue("COMP_CODE", Data.GetValue("CompanyCode__"));
                    docHeader.SetValue("DOC_DATE", Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("InvoiceDate__")));
                    docHeader.SetValue("PSTNG_DATE", Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("PostingDate__")));
                    docHeader.SetValue("REF_DOC_NO", params.refId ? params.refId : Data.GetValue("InvoiceNumber__"));
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(docHeader, "HeaderText__", "HEADER_TXT");
                    if (Lib.AP.SAP.UsesWebServices()) {
                        var sapUser = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPWSUser");
                        var user = Sys.Helpers.Globals.Users.GetUser(Data.GetValue("ValidationOwnerID"));
                        if (!user) {
                            user = Sys.Helpers.Globals.Users.GetUser(Data.GetValue("OwnerID"));
                        }
                        var userERPLogin = user ? user.GetValue("erpUser") : null;
                        docHeader.SetValue("USERNAME", userERPLogin || sapUser);
                    }
                    else {
                        docHeader.SetValue("USERNAME", Sys.Helpers.SAP.GetSAPUserName(params.BapiController.sapControl, Variable.GetValueAsString("SAPConfiguration")));
                    }
                    // Computed fields
                    var period = Lib.AP.SAP.GetCompanyCodePeriod(params.GetBapi("BAPI_COMPANYCODE_GET_PERIOD"), Data.GetValue("CompanyCode__"), Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("PostingDate__") || new Date()));
                    if (period) {
                        docHeader.SetValue("FISC_YEAR", period.Fiscal_Year);
                        docHeader.SetValue("FIS_PERIOD", period.Fiscal_Period);
                    }
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnFIHeaderSet", params, docHeader);
                    return true;
                }
                Invoice.FIHeaderSet = FIHeaderSet;
                function FIAddVendorLinesForClearing(params, itemNumberIdx) {
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    var lineItems = Data.GetTable("LineItems__");
                    var refDocNumber;
                    var currency = Data.GetValue("InvoiceCurrency__");
                    for (var idx = 0; idx < lineItems.GetItemCount(); idx++) {
                        var line = lineItems.GetItem(idx);
                        var lineType = line.GetValue("LineType__");
                        if (lineType === "Vendor") {
                            var description = line.GetValue("InvoiceDescription__");
                            var invoiceDate = line.GetValue("InvoiceDate__");
                            var amount = line.GetValue("Amount__");
                            if (!refDocNumber) {
                                refDocNumber = line.GetValue("DocumentNumber__");
                            }
                            Lib.AP.SAP.Invoice.FIAddInvoiceLineForClearing(params, amount, currency, vendorNumber, itemNumberIdx++, description, invoiceDate);
                        }
                    }
                    Lib.AP.SAP.Invoice.FIAddVendorLineForClearing(params, itemNumberIdx++);
                    return itemNumberIdx;
                }
                Invoice.FIAddVendorLinesForClearing = FIAddVendorLinesForClearing;
                function FIAddInvoiceLineForClearing(params, amount, currency, vendorNumber, itemNumberIdx, description, invoiceDate) {
                    //Process the vendor account line.
                    var itemNumber = Sys.Helpers.SAP.BuildItemNumber(itemNumberIdx);
                    // ACCOUNTPAYABLE
                    var accPayable = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTPAYABLE").AddNew();
                    accPayable.SetValue("ITEMNO_ACC", itemNumber);
                    accPayable.SetValue("VENDOR_NO", vendorNumber);
                    accPayable.SetValue("BLINE_DATE", Lib.AP.SAP.FormatToSAPDateTimeFormat(invoiceDate));
                    accPayable.SetValue("ITEM_TEXT", description);
                    var curAmount;
                    // Vendor amount (always opposite sign)
                    curAmount = params.GetTable("BAPI_ACC_DOCUMENT", "CURRENCYAMOUNT").AddNew();
                    curAmount.SetValue("CURRENCY", currency);
                    curAmount.SetValue("ITEMNO_ACC", itemNumber);
                    curAmount.SetValue("AMT_DOCCUR", -amount);
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnFIAddVendorLine", params, accPayable, curAmount);
                }
                Invoice.FIAddInvoiceLineForClearing = FIAddInvoiceLineForClearing;
                function FIAddVendorLineForClearing(params, itemNumberIdx) {
                    var itemNumber = Sys.Helpers.SAP.BuildItemNumber(itemNumberIdx);
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    var amount = Data.GetValue("InvoiceAmount__");
                    // ACCOUNTPAYABLE
                    var acc = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTGL").AddNew();
                    acc.SetValue("ITEMNO_ACC", itemNumber);
                    acc.SetValue("VENDOR_NO", vendorNumber);
                    acc.SetValue("ACCT_KEY", "Z28");
                    acc.SetValue("ACCT_TYPE", "K");
                    // Vendor amount
                    var curAmount = params.GetTable("BAPI_ACC_DOCUMENT", "CURRENCYAMOUNT").AddNew();
                    curAmount.SetValue("CURRENCY", Data.GetValue("InvoiceCurrency__"));
                    curAmount.SetValue("ITEMNO_ACC", itemNumber);
                    curAmount.SetValue("AMT_DOCCUR", amount);
                }
                Invoice.FIAddVendorLineForClearing = FIAddVendorLineForClearing;
                function FIAddVendorLine(params) {
                    //Process the vendor account line.
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    var itemNumber = "0000000001";
                    // ACCOUNTPAYABLE
                    var accPayable = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTPAYABLE").AddNew();
                    accPayable.SetValue("ITEMNO_ACC", itemNumber);
                    accPayable.SetValue("VENDOR_NO", vendorNumber);
                    accPayable.SetValue("BLINE_DATE", params.Baseline_Date);
                    accPayable.SetValue("PMNTTRMS", params.Invoice_Payment_Terms);
                    accPayable.SetValue("PMNT_BLOCK", params.Invoice_Payment_Block);
                    accPayable.SetValue("ITEM_TEXT", Data.GetValue("InvoiceDescription__"));
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(accPayable, "SAPPaymentMethod__", "PYMT_METH", true);
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(accPayable, "Assignment__", "ALLOC_NMBR");
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(accPayable, "BusinessArea__", "BUS_AREA", true);
                    Lib.AP.SAP.Invoice.DataSetValueIfExists(accPayable, "WithholdingTax__", "W_TAX_CODE", true);
                    if (!params.IsSimulation) {
                        // Alternative payee parameter only available in posting BAPI
                        var altPayeeNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("AlternativePayee__"), 10);
                        if (altPayeeNumber) {
                            accPayable.SetValue("ALT_PAYEE", altPayeeNumber);
                        }
                    }
                    var selectedBankDetailsType = Lib.AP.SAP.GetSelectedBankDetailsType();
                    if (selectedBankDetailsType) {
                        accPayable.SetValue("PARTNER_BK", selectedBankDetailsType);
                    }
                    var curAmount;
                    // Vendor amount (always opposite sign)
                    curAmount = params.GetTable("BAPI_ACC_DOCUMENT", "CURRENCYAMOUNT").AddNew();
                    curAmount.SetValue("CURRENCY", Data.GetValue("InvoiceCurrency__"));
                    curAmount.SetValue("ITEMNO_ACC", itemNumber);
                    var amount = params.InvoiceSpecialType === "settlement" ? params.InvoiceSpecialTypeAmount : Data.GetValue("InvoiceAmount__");
                    curAmount.SetValue("AMT_DOCCUR", -amount);
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnFIAddVendorLine", params, accPayable, curAmount);
                }
                Invoice.FIAddVendorLine = FIAddVendorLine;
                function FIAddGLLine(params, line, itemNumber, itemNumberTaxIdx) {
                    // Process an account line
                    var lineCurrency = line.GetValue("InvoiceCurrency__");
                    var currency = lineCurrency ? lineCurrency : Data.GetValue("InvoiceCurrency__");
                    var accountNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("GLAccount__"), 10);
                    var costCenter = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("CostCenter__"), 10);
                    var compCode = line.GetValue("CompanyCode__");
                    var postingPeriod;
                    if (compCode) {
                        postingPeriod = Lib.AP.SAP.GetCompanyCodePeriod(params.GetBapi("BAPI_COMPANYCODE_GET_PERIOD"), compCode, Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("PostingDate__") || new Date()));
                    }
                    else {
                        compCode = Data.GetValue("CompanyCode__");
                    }
                    var taxCode = Sys.Helpers.SAP.FormatTaxCode(line.GetValue("TaxCode__"));
                    var taxJurisdiction = line.GetValue("TaxJurisdiction__");
                    var amount = line.GetValue("Amount__");
                    var taxAmount = line.GetValue("TaxAmount__");
                    var taxRate = line.GetValue("TaxRate__");
                    var computeTaxAmount = false;
                    if (params.InvoiceSpecialType === "settlement") {
                        var multiTaxRates = line.GetValue("MultiTaxRates__");
                        amount = line.GetValue("ExpectedAmount__");
                        taxAmount = Lib.AP.RoundWithAmountPrecision(Lib.AP.ApplyTaxRate(amount, taxRate, multiTaxRates));
                        params.InvoiceSpecialTypeAmount += amount;
                        computeTaxAmount = Data.GetValue("CalculateTax__");
                    }
                    else if (params.InvoiceSpecialType === "clearing") {
                        amount = -amount;
                        taxAmount = -taxAmount;
                    }
                    taxJurisdiction = taxJurisdiction ? taxJurisdiction.toUpperCase() : "";
                    var itemNumberTax = "";
                    if (params.TaxLineByLine) {
                        itemNumberTax = Sys.Helpers.SAP.BuildItemNumber(itemNumberTaxIdx, 6, 1);
                        itemNumberTaxIdx++;
                    }
                    // Accumulate tax amounts for later
                    Lib.AP.SAP.Invoice.AddTaxAmount(params, taxCode, taxJurisdiction, itemNumberTax, amount, taxAmount, computeTaxAmount);
                    // ACCOUNTGL
                    var acc = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTGL").AddNew();
                    acc.SetValue("ITEMNO_ACC", itemNumber);
                    acc.SetValue("ITEMNO_TAX", itemNumberTax);
                    acc.SetValue("COMP_CODE", compCode);
                    if (postingPeriod) {
                        acc.SetValue("FIS_PERIOD", postingPeriod.Fiscal_Period);
                        acc.SetValue("FISC_YEAR", postingPeriod.Fiscal_Year);
                    }
                    acc.SetValue("GL_ACCOUNT", accountNumber);
                    acc.SetValue("TAX_CODE", taxCode);
                    acc.SetValue("COSTCENTER", costCenter);
                    acc.SetValue("ITEM_TEXT", line.GetValue("Description__"));
                    acc.SetValue("TAXJURCODE", taxJurisdiction);
                    acc.SetValue("BUS_AREA", line.GetValue("BusinessArea__"));
                    acc.SetValue("ORDERID", Sys.Helpers.String.SAP.NormalizeID(line.GetValue("InternalOrder__"), 12));
                    acc.SetValue("WBS_ELEMENT", line.GetValue("WBSElement__"));
                    acc.SetValue("ALLOC_NMBR", line.GetValue("Assignment__"));
                    acc.SetValue("TRADE_ID", Sys.Helpers.String.SAP.NormalizeID(line.GetValue("TradingPartner__"), 6));
                    // CURRENCYAMOUNT
                    var curAmount = params.GetTable("BAPI_ACC_DOCUMENT", "CURRENCYAMOUNT").AddNew();
                    curAmount.SetValue("CURRENCY", currency);
                    curAmount.SetValue("ITEMNO_ACC", itemNumber);
                    curAmount.SetValue("AMT_DOCCUR", amount);
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnFIAddGLLine", params, line, acc, curAmount);
                    return itemNumberTaxIdx;
                }
                Invoice.FIAddGLLine = FIAddGLLine;
                function FIAddTaxLine(params, itemNumber, aTaxAccount, invoiceCurrency, computedTaxAmount, itemNumberTax) {
                    // CURRENCYAMOUNT
                    var CURRENCYAMOUNTTAX = params.GetTable("BAPI_ACC_DOCUMENT", "CURRENCYAMOUNT").AddNew();
                    CURRENCYAMOUNTTAX.SetValue("CURRENCY", invoiceCurrency);
                    CURRENCYAMOUNTTAX.SetValue("ITEMNO_ACC", itemNumber);
                    CURRENCYAMOUNTTAX.SetValue("AMT_DOCCUR", computedTaxAmount);
                    var amounts = Lib.AP.SAP.Invoice.GetAmountForTaxAccount(params, aTaxAccount, itemNumberTax);
                    if (params.grossPosting) {
                        CURRENCYAMOUNTTAX.SetValue("AMT_BASE", aTaxAccount.Tax_Base_Amount);
                    }
                    else if (amounts) {
                        CURRENCYAMOUNTTAX.SetValue("AMT_BASE", amounts.amount);
                    }
                    // ACCOUNTTAX
                    var ACCOUNTAX1 = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTTAX").AddNew();
                    ACCOUNTAX1.SetValue("ITEMNO_ACC", itemNumber);
                    ACCOUNTAX1.SetValue("ITEMNO_TAX", itemNumberTax);
                    ACCOUNTAX1.SetValue("GL_ACCOUNT", aTaxAccount.Gl_Account);
                    ACCOUNTAX1.SetValue("TAX_CODE", aTaxAccount.Tax_Code);
                    ACCOUNTAX1.SetValue("TAXJURCODE", aTaxAccount.Taxjurcode);
                    ACCOUNTAX1.SetValue("ACCT_KEY", aTaxAccount.Acct_Key);
                    ACCOUNTAX1.SetValue("COND_KEY", aTaxAccount.Cond_Key);
                    ACCOUNTAX1.SetValue("TAX_RATE", aTaxAccount.Tax_Rate);
                    ACCOUNTAX1.SetValue("TAXJURCODE_DEEP", aTaxAccount.Taxjurcode_Deep);
                    ACCOUNTAX1.SetValue("TAXJURCODE_LEVEL", aTaxAccount.Taxjurcode_Level);
                    if (params.InvoiceSpecialType === "settlement") {
                        params.InvoiceSpecialTypeAmount += computedTaxAmount;
                    }
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnFIAddTaxLine", params, aTaxAccount, ACCOUNTAX1, CURRENCYAMOUNTTAX);
                }
                Invoice.FIAddTaxLine = FIAddTaxLine;
                function FIAddTaxLines(params, itemNumberIdx, manualTax, simulationReport) {
                    var invoiceCurrency = Data.GetValue("InvoiceCurrency__");
                    var companyCode = Data.GetValue("CompanyCode__");
                    var errorMessage;
                    // We have to create all tax lines from the tax codes set on GL lines
                    // Loop through each tax account for each tax code in the invoice
                    var amountsByTaxCode = Lib.AP.SAP.Invoice.GetAmountsByTaxAccount(params);
                    for (var taxKey in amountsByTaxCode) {
                        if (Object.prototype.hasOwnProperty.call(amountsByTaxCode, taxKey)) {
                            var taxCodeAmounts = Lib.AP.SAP.Invoice.GetAmountForTaxKey(params, taxKey);
                            // Tax code may be concatenated with the jurisdiction code
                            var currentTaxCode = taxCodeAmounts.taxCode;
                            var currentTaxJurisdiction = taxCodeAmounts.taxJurisdiction;
                            var currentItemNumberTax = taxCodeAmounts.itemNumberTax;
                            // Check tax amount not greater than base amount
                            if (manualTax && Math.abs(taxCodeAmounts.taxAmount) > Math.abs(taxCodeAmounts.amount)) {
                                errorMessage = params.BapiController.sapi18n("_The tax amount must not be greater than the tax base.");
                                Lib.AP.SAP.Invoice.FISetManualTaxError(simulationReport, errorMessage, "747");
                                return itemNumberIdx;
                            }
                            var getTaxAccounts = Lib.AP.SAP.GetTaxFromNetServer;
                            if (params.grossPosting) {
                                getTaxAccounts = Lib.AP.SAP.GetTaxFromGrossServer;
                            }
                            var taxAccountsList = getTaxAccounts(params.BapiController.GetBapiManager(), companyCode, currentTaxCode, currentTaxJurisdiction, currentItemNumberTax, invoiceCurrency, taxCodeAmounts.amount);
                            if (!taxAccountsList) {
                                continue;
                            }
                            var theoricTaxAmount = 0;
                            var taxAccIdx = void 0, aTaxAccount = void 0;
                            if (manualTax) {
                                // compute theoric tax amount for this tax code
                                // (The sum on taxAccountsList should only be useful if TaxJurisdictionLength > 0)
                                for (var i = 0; i < taxAccountsList.length; i++) {
                                    theoricTaxAmount += Lib.AP.RoundWithAmountPrecision(taxAccountsList[i].Tax_Amount);
                                }
                                // If theoric amount is 0, then tax amount impossible in this item (E 724 FF)
                                if (theoricTaxAmount === 0 && taxCodeAmounts.taxAmount !== 0) {
                                    errorMessage = params.BapiController.sapi18n("_Tax entry not possible in this item.");
                                    Lib.AP.SAP.Invoice.FISetManualTaxError(simulationReport, errorMessage, "724");
                                    return itemNumberIdx;
                                }
                                var sum = 0;
                                for (taxAccIdx = taxAccountsList.length - 1; taxAccIdx >= 0; taxAccIdx--) {
                                    aTaxAccount = taxAccountsList[taxAccIdx];
                                    taxAccountsList[taxAccIdx].computedTaxAmount = Lib.AP.RoundWithAmountPrecision(taxCodeAmounts.taxAmount * (aTaxAccount.Tax_Amount / theoricTaxAmount));
                                    sum += taxAccountsList[taxAccIdx].computedTaxAmount;
                                }
                                if (taxAccountsList.length > 0) {
                                    // dispatch the leftover on first line (do not round to avoid balance issues)
                                    taxAccountsList[0].computedTaxAmount += taxCodeAmounts.taxAmount - sum;
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
                                Lib.AP.SAP.Invoice.FIAddTaxLine(params, itemNumber, aTaxAccount, invoiceCurrency, computedTaxAmount, currentItemNumberTax);
                                itemNumberIdx++;
                                // Ignore useless tax lines
                                if (aTaxAccount.Tax_Rate === 0) {
                                    continue;
                                }
                                if (manualTax && simulationReport && theoricTaxAmount !== taxCodeAmounts.taxAmount) {
                                    // Warning: Amounts should be equal, may have balance errors...
                                    errorMessage = params.BapiController.sapi18n("_Tax entered incorrect (code %1, amount %2), correct %3 %4.", [currentTaxCode, Sys.Helpers.SAP.ConvertToDecimalFormat(params.BapiController.sapControl, taxCodeAmounts.taxAmount), Sys.Helpers.SAP.ConvertToDecimalFormat(params.BapiController.sapControl, theoricTaxAmount), invoiceCurrency]);
                                    Sys.Helpers.SAP.AddMessage(simulationReport, "messages", itemNumber, "ESKAP", "W", "707", errorMessage, currentTaxCode, taxCodeAmounts.taxAmount.toString(), theoricTaxAmount.toString(), invoiceCurrency);
                                }
                                if (params.grossPosting || !aTaxAccount.Gl_Account) {
                                    // if Empty Tax G/L Account, tax amount should be dispatched within the items
                                    // or if gross posting, tax amount should be deducted from the items (to calculate net amounts)
                                    Lib.AP.SAP.Invoice.FIDispatchTaxAmount(params, aTaxAccount, computedTaxAmount, taxCodeAmounts.amount, currentItemNumberTax);
                                }
                            }
                        }
                    }
                    return itemNumberIdx;
                }
                Invoice.FIAddTaxLines = FIAddTaxLines;
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
                    var accountGL = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTGL");
                    for (ACCOUNTGLIdx = 0; ACCOUNTGLIdx < accountGL.Count; ACCOUNTGLIdx++) {
                        ACCOUNTGL_Item = accountGL.Get(ACCOUNTGLIdx);
                        if (Lib.AP.SAP.Invoice.FIAccountGLMatch(ACCOUNTGL_Item, aTaxAccount, itemNumberTax)) {
                            nMatchingGLLines++;
                        }
                    }
                    // 2nd pass: dispatch the tax amount
                    var grossPostingFactor = params.grossPosting ? -1 : 1;
                    var amountToBeDispatched = totalAmountToDispatch;
                    for (ACCOUNTGLIdx = 0; ACCOUNTGLIdx < accountGL.Count; ACCOUNTGLIdx++) {
                        ACCOUNTGL_Item = accountGL.Get(ACCOUNTGLIdx);
                        if (Lib.AP.SAP.Invoice.FIAccountGLMatch(ACCOUNTGL_Item, aTaxAccount, itemNumberTax)) {
                            var currencyAmount = params.GetTable("BAPI_ACC_DOCUMENT", "CURRENCYAMOUNT");
                            var CURRENCYAMOUNT_Item_Idx = Sys.Helpers.SAP.FindByInTable(currencyAmount, "ITEMNO_ACC", ACCOUNTGL_Item.GetValue("ITEMNO_ACC"));
                            if (CURRENCYAMOUNT_Item_Idx >= 0) {
                                var sum = void 0;
                                var CURRENCYAMOUNT_Item = currencyAmount.Get(CURRENCYAMOUNT_Item_Idx);
                                // Avoid balance rounding errors
                                if (nMatchingGLLines === 1) {
                                    sum = CURRENCYAMOUNT_Item.GetValue("AMT_DOCCUR") + (amountToBeDispatched * grossPostingFactor);
                                }
                                else {
                                    sum = CURRENCYAMOUNT_Item.GetValue("AMT_DOCCUR");
                                    var manualTaxRatio = sum / baseAmount;
                                    var manualTaxAmount = totalAmountToDispatch * manualTaxRatio;
                                    sum += Sys.Helpers.SAP.Round(manualTaxAmount * grossPostingFactor);
                                    amountToBeDispatched = amountToBeDispatched - Sys.Helpers.SAP.Round(manualTaxAmount);
                                }
                                CURRENCYAMOUNT_Item.SetValue("AMT_DOCCUR", Sys.Helpers.SAP.Round(sum));
                                nMatchingGLLines--;
                            }
                        }
                    }
                }
                Invoice.FIDispatchTaxAmount = FIDispatchTaxAmount;
                function FIPrepareForLines(caller, params, simulationReport, blockPayment) {
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    if (Data.GetValue("BaselineDate__") && Data.GetValue("BaselineDate__") !== "") {
                        params.Baseline_Date = Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("BaselineDate__"));
                    }
                    if (blockPayment) {
                        params.Invoice_Payment_Block = Variable.GetValueAsString("InvoicePaymentBlock");
                    }
                    params.Invoice_Payment_Terms = Lib.AP.SAP.Invoice.GetPaymentTerm(params, vendorNumber, Data.GetValue("CompanyCode__"));
                    var jurStruct = Lib.AP.SAP.Invoice.GetTaxJurisdictionStructure(params.GetBapi("RFC_READ_TABLE"), Data.GetValue("CompanyCode__"));
                    if (jurStruct) {
                        params.TaxJurisdictionLength = jurStruct.jurLength;
                        params.TaxLineByLine = jurStruct.lineByLine;
                    }
                    else {
                        params.TaxJurisdictionLength = 0;
                        params.TaxLineByLine = false;
                    }
                    var invoiceRefNumber = Lib.AP.ParseInvoiceDocumentNumber(Data.GetValue("InvoiceReferenceNumber__"), true);
                    if (invoiceRefNumber) {
                        caller.FIComputePaymentTerms(params, invoiceRefNumber, simulationReport);
                    }
                    else if (Data.GetValue("InvoiceReferenceNumber__")) {
                        //Invalid invoice reference number
                        if (simulationReport) {
                            Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "E", "007", params.BapiController.sapi18n("_Invalid invoice document number \"%1\"", [Data.GetValue("InvoiceReferenceNumber__")]), "", "", "", "");
                        }
                        else {
                            Log.Warn("Ignoring invalid value for InvoiceReferenceNumber__");
                        }
                    }
                    return true;
                }
                Invoice.FIPrepareForLines = FIPrepareForLines;
                function FIUnblockPayment(parsedDocNumber) {
                    // Initialize BAPI
                    var invoiceType = Variable.GetValueAsString("SAPObjectType");
                    if (!invoiceType) {
                        invoiceType = "BKPFF";
                    }
                    var params = Lib.AP.SAP.Invoice.GetNewParameters();
                    try {
                        var bapiManagerInitiated = false;
                        var bapiManager = null;
                        if (Lib.AP.SAP.UsesWebServices()) {
                            bapiManagerInitiated = params.BapiController.InitBapiWSManager();
                            bapiManager = params.BapiController.bapiWSManager;
                        }
                        else {
                            var sapControl = Sys.Helpers.SAP.GetSAPControl();
                            bapiManagerInitiated = params.BapiController.InitBapiManager(sapControl);
                            bapiManager = params.BapiController.GetBapiManager();
                        }
                        if (!bapiManagerInitiated ||
                            !params.InitBAPI_ACC_PYMNTBLK_UPDATE_POST()) {
                            Sys.Helpers.SAP.SetLastError("UnblockPayment failed to initialize BAPI.");
                            return false;
                        }
                        // Unblock invoice payment
                        var invRef = params.GetExport("BAPI_ACC_PYMNTBLK_UPDATE_POST", "REFERENCEINV");
                        var paddedCompanyCode = parsedDocNumber.companyCode ? Sys.Helpers.String.PadRight(parsedDocNumber.companyCode, " ", 4) : "    ";
                        invRef.SetValue("OBJ_KEY", parsedDocNumber.documentNumber + paddedCompanyCode + parsedDocNumber.fiscalYear);
                        invRef.SetValue("OBJ_TYPE", invoiceType);
                        invRef.SetValue("COMP_CODE", parsedDocNumber.companyCode);
                        params.Exception = params.GetBapi("BAPI_ACC_PYMNTBLK_UPDATE_POST").Call();
                        if (params.Exception) {
                            Sys.Helpers.SAP.SetLastError(params.Exception);
                        }
                        else {
                            var commitResult = bapiManager.CommitWork();
                            if (commitResult) {
                                var RETURN0 = params.GetTable("BAPI_ACC_PYMNTBLK_UPDATE_POST", "RETURN");
                                if (!Sys.Helpers.SAP.ExtractErrors(RETURN0)) {
                                    return true;
                                }
                            }
                            else {
                                Sys.Helpers.SAP.SetLastError("Commit failed: " + bapiManager.GetLastError());
                            }
                        }
                    }
                    finally {
                        params.Finalize();
                    }
                    return false;
                }
                Invoice.FIUnblockPayment = FIUnblockPayment;
                function FIAddWHT(params) {
                    if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("TaxesWithholdingTax", "") !== "Extended") {
                        return false;
                    }
                    var itemNumber = "0000000001";
                    var lines = Data.GetTable("ExtendedWithholdingTax__");
                    for (var idx = 0; idx < lines.GetItemCount(); idx++) {
                        var whtLine = lines.GetItem(idx);
                        // Ignore invalid lines
                        if (!whtLine.GetValue("WHTCode__") || !whtLine.GetValue("WHTType__")) {
                            continue;
                        }
                        var wht = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTWT").AddNew();
                        wht.SetValue("ITEMNO_ACC", itemNumber);
                        wht.SetValue("WT_CODE", whtLine.GetValue("WHTCode__").toUpperCase());
                        wht.SetValue("WT_TYPE", whtLine.GetValue("WHTType__").toUpperCase());
                        wht.SetValue("BAS_AMT_TC", whtLine.GetValue("WHTBaseAmount__"));
                        wht.SetValue("MAN_AMT_TC", whtLine.GetValue("WHTTaxAmount__"));
                        wht.SetValue("BAS_AMT_IND", "X");
                        wht.SetValue("MAN_AMT_IND", whtLine.GetValue("WHTTaxAmountAuto__") ? " " : "X");
                    }
                    return true;
                }
                Invoice.FIAddWHT = FIAddWHT;
                function MMAddWHT(params) {
                    if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("TaxesWithholdingTax", "") !== "Extended") {
                        return false;
                    }
                    var lines = Data.GetTable("ExtendedWithholdingTax__");
                    for (var idx = 0; idx < lines.GetItemCount(); idx++) {
                        var whtLine = lines.GetItem(idx);
                        var wht = params.GetTable("BAPI_INCOMINGINVOICE", "WITHTAXDATA").AddNew();
                        wht.SetValue("SPLIT_KEY", "1");
                        wht.SetValue("WI_TAX_CODE", whtLine.GetValue("WHTCode__").toUpperCase());
                        wht.SetValue("WI_TAX_TYPE", whtLine.GetValue("WHTType__").toUpperCase());
                        wht.SetValue("WI_TAX_BASE", whtLine.GetValue("WHTBaseAmount__"));
                        wht.SetValue("WI_TAX_AMT", whtLine.GetValue("WHTTaxAmount__"));
                    }
                    return true;
                }
                Invoice.MMAddWHT = MMAddWHT;
                // #endregion public
            })(Invoice = SAP.Invoice || (SAP.Invoice = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
