///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAPS4Cloud_Invoice_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: SAPS4Cloud AP routines",
  "require": [
    "Lib_AP_SAP_Invoice_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAPS4Cloud;
        (function (SAPS4Cloud) {
            var Invoice;
            (function (Invoice) {
                function formatDateTimeForOData(dateTime) {
                    if (!dateTime) {
                        return "";
                    }
                    var dateTimeFormat = "/Date(";
                    dateTimeFormat += dateTime.getTime();
                    dateTimeFormat += ")/";
                    return dateTimeFormat;
                }
                function GetCurrency(amount, currency) {
                    return {
                        attributes: {
                            currencyCode: currency ? currency : Data.GetValue("invoiceCurrency__")
                        },
                        value: amount
                    };
                }
                // #region Integrate MM invoice
                function MMHeaderSet() {
                    var invoiceAmount = Math.abs(Data.GetValue("InvoiceAmount__"));
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    var companyCode = Data.GetValue("CompanyCode__");
                    var baselineDate = Data.GetValue("BaselineDate__");
                    var postingDate = Data.GetValue("PostingDate__");
                    var params = {
                        WSParams: {
                            FiscalYear: postingDate ? postingDate.getUTCFullYear().toString() : "",
                            AccountingDocumentType: Sys.Parameters.GetInstance("AP").GetParameter("SAPDocumentTypeMMInvoice"),
                            InvoicingParty: vendorNumber,
                            CompanyCode: companyCode,
                            DocumentCurrency: Data.GetValue("InvoiceCurrency__"),
                            SupplierInvoiceIDByInvcgParty: Data.GetValue("InvoiceNumber__"),
                            DocumentDate: formatDateTimeForOData(Data.GetValue("InvoiceDate__")),
                            InvoiceGrossAmount: invoiceAmount.toString(),
                            SupplierInvoiceIsCreditMemo: Data.GetValue("InvoiceAmount__") < 0 ? "1" : null,
                            //PaymentTerms: Lib.AP.SAP.Invoice.GetPaymentTerm(params, vendorNumber, companyCode),
                            PostingDate: formatDateTimeForOData(postingDate),
                            PaymentBlockingReason: "",
                            //???: params.Baseline_Date;
                            //???: Data.GetValue("InvoiceDescription__"),
                            PaymentMethod: Data.GetValue("SAPPaymentMethod__").toUpperCase(),
                            AssignmentReference: Data.GetValue("Assignment__"),
                            DocumentHeaderText: Data.GetValue("HeaderText__"),
                            BusinessArea: Data.GetValue("BusinessArea__").toUpperCase(),
                            //UnplannedDeliveryCost: Data.GetValue<string>("UnplannedDeliveryCosts__"),
                            TaxIsCalculatedAutomatically: false,
                            to_SuplrInvcItemPurOrdRef: {
                                results: []
                            },
                            to_SupplierInvoiceItemGLAcct: {
                                results: []
                            },
                            to_SupplierInvoiceTax: {
                                results: []
                            },
                            to_SupplierInvoiceWhldgTax: {
                                results: []
                            }
                        }
                    };
                    /*if (Data.GetValue("Investment__"))
                    {
                        headerData.SetValue("GOODS_AFFECTED", "X");
                    }*/
                    if (baselineDate && baselineDate.toString() !== "") {
                        params.WSParams.DueCalculationBaseDate = formatDateTimeForOData(baselineDate);
                    }
                    var selectedBankDetailsType = Lib.AP.SAP.GetSelectedBankDetailsType();
                    if (selectedBankDetailsType) {
                        params.WSParams.BPBankAccountInternalID = selectedBankDetailsType;
                    }
                    // Invoice reference number
                    var invoiceRefNumber = Lib.AP.ParseInvoiceDocumentNumber(Data.GetValue("InvoiceReferenceNumber__"), true);
                    if (invoiceRefNumber) {
                        params.WSParams.InvoiceReference = invoiceRefNumber.documentNumber;
                        params.WSParams.InvoiceReferenceFiscalYear = invoiceRefNumber.fiscalYear;
                    }
                    params.GetData = function () {
                        return JSON.stringify(this.WSParams);
                    };
                    //Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnMMHeaderSet", params, headerData);
                    return params;
                }
                Invoice.MMHeaderSet = MMHeaderSet;
                function MMAddInvoiceTax(params, taxCode, taxAmount) {
                    var found = false;
                    for (var i = 0; i < params.WSParams.to_SupplierInvoiceTax.results.length; i++) {
                        var invoiceTaxItem = params.WSParams.to_SupplierInvoiceTax.results[i];
                        if (invoiceTaxItem.TaxCode === taxCode) {
                            var amount = (parseFloat(invoiceTaxItem.TaxAmount) + taxAmount).toFixed(Lib.AP.GetAmountPrecision());
                            params.WSParams.to_SupplierInvoiceTax.results[i].TaxAmount = amount;
                            found = true;
                        }
                    }
                    if (!found) {
                        var newInvoiceTaxItem = {
                            TaxCode: taxCode,
                            TaxAmount: taxAmount.toFixed(Lib.AP.GetAmountPrecision()),
                            DocumentCurrency: params.WSParams.DocumentCurrency
                        };
                        params.WSParams.to_SupplierInvoiceTax.results.push(newInvoiceTaxItem);
                    }
                }
                function MMAddPOLine(params, line) {
                    function findDuplicate(table, poNum, poItemNum, Gr_Base) {
                        for (var i = 0; i < table.length; i++) {
                            var e = table[i];
                            if (poNum === e.PurchaseOrder && poItemNum === e.SupplierInvoiceItem) {
                                if (Gr_Base) {
                                    if (line.GetValue("GoodsReceipt__") === [e.ReferenceDocument, e.ReferenceDocumentItem, e.ReferenceDocumentFiscalYear].join("-")) {
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
                    var poNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("OrderNumber__"), 10);
                    var poItemNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("ItemNumber__"), 5);
                    /*const poResult = GetDetailsFromMasterData(poNumber, true, itemByPo);
                    const poItemData = poResult.PO_ITEMS[poItemNumber];
                    if (!poItemData)
                    {
                        Log.Error("Lib.AP.SAP.PurchaseOrderDetails.GetDetails: item " + line.GetValue("ItemNumber__") + " not found");
                        return false;
                    }*/
                    var GR_based = true;
                    var GoodsReceiptValue = line.GetValue("GoodsReceipt__");
                    if (!GoodsReceiptValue || GoodsReceiptValue === "") {
                        GR_based = false;
                    }
                    var duplicate = findDuplicate(params.WSParams.to_SuplrInvcItemPurOrdRef.results, poNumber, poItemNumber, GR_based);
                    /*// Add account assignment
                    const invoiceDocItem = duplicate ? duplicate["SupplierInvoiceItem"] : poItemNumber;
                    let accountAssignmentFromPO = null;
                    if (poResult.AccountAssignments[poItemNumber])
                    {
                        let alreadyAdded = 0;
                        for (let i = 1; i <= accountingDataTable.Count; i++)
                        {
                            if (accountingDataTable.GetValue(i, "INVOICE_DOC_ITEM") === invoiceDocItem)
                            {
                                alreadyAdded++;
                            }
                        }
                        accountAssignmentFromPO = poResult.AccountAssignments[poItemNumber][alreadyAdded];
                    }

                    Lib.AP.SAP.AddAccountAssignmentLine(
                        invoiceDocItem,
                        accountAssignmentFromPO,
                        poItemData,
                        line,
                        params.Subsequent_Doc,
                        function (accountingLine: AccountingLine): void
                        {
                            const accountAssignment = accountingDataTable.AddNew();
                            for (const f in accountingLine)
                            {
                                if (accountingLine.hasOwnProperty(f))
                                {
                                    accountAssignment.SetValue(f, accountingLine[f]);
                                }
                            }
                        });*/
                    if (duplicate) {
                        duplicate.SupplierInvoiceItemAmount = duplicate.SupplierInvoiceItemAmount + line.GetValue("Amount__");
                        /*if (!poItemData.IsServiceItem() && !poItemData.IsLimitItem())
                        {*/
                        duplicate.QuantityInPurchaseOrderUnit = duplicate.QuantityInPurchaseOrderUnit + line.GetValue("Quantity__");
                        //}
                        return true;
                    }
                    var taxJurisdiction = line.GetValue("TaxJurisdiction__").toString();
                    // Set the PO number & the PO Item number
                    var item = {
                        PurchaseOrder: poNumber,
                        SupplierInvoiceItem: (params.WSParams.to_SuplrInvcItemPurOrdRef.results.length + 1).toString(),
                        PurchaseOrderItem: poItemNumber,
                        TaxCode: line.GetValue("TaxCode__").toUpperCase(),
                        TaxJurisdiction: taxJurisdiction ? taxJurisdiction : "",
                        SupplierInvoiceItemAmount: Math.abs(line.GetValue("Amount__")).toString(),
                        SupplierInvoiceItemText: line.GetValue("Description__"),
                        DocumentCurrency: Data.GetValue("InvoiceCurrency__")
                    };
                    /*if (!poItemData.IsServiceItem() && !poItemData.IsLimitItem())
                    {*/
                    item.QtyInPurchaseOrderPriceUnit = line.GetValue("UnitPrice__").toFixed(3);
                    var PurchaseOrderQuantityUnit = line.GetValue("UnitOfMeasureCode__");
                    item.PurchaseOrderQuantityUnit = PurchaseOrderQuantityUnit ? PurchaseOrderQuantityUnit : "EA";
                    item.QuantityInPurchaseOrderUnit = line.GetValue("Quantity__").toFixed(3);
                    //}
                    // Subsequent Debit/Credit indicator
                    /*if (params.Subsequent_Doc)
                    {
                        item.SetValue("DE_CRE_IND", "X");
                    }*/
                    // GR/IV lines
                    if (GoodsReceiptValue) {
                        var splittedRef = GoodsReceiptValue.split("-");
                        if (splittedRef && splittedRef.length === 3) {
                            var docNumber = splittedRef[0];
                            var docLine = splittedRef[1];
                            var docYear = splittedRef[2];
                            item.ReferenceDocumentItem = docLine;
                            item.ReferenceDocumentFiscalYear = docYear;
                            item.ReferenceDocument = docNumber;
                            /*// Complete poItemData with GR related content
                            poItemData.Ref_Doc = docNumber;
                            const itemDetailedHistories = Lib.AP.SAP.PurchaseOrder.GetHistoricsPerPurchasingDocument(params, poNumber, poItemNumber, docNumber, docLine, docYear);
                            if (itemDetailedHistories && itemDetailedHistories.length > 0)
                            {
                                const totals = Lib.AP.SAP.PurchaseOrder.ComputeTotalsForGR(itemDetailedHistories[0], itemDetailedHistories, poItemData);
                                Lib.AP.SAP.PurchaseOrder.UpdateValuesOfGRItem(poItemData, totals);
                            }*/
                        }
                    }
                    /*// Always update lineItems with latest value from SAP
                    line.SetValue("OpenAmount__", poItemData.OpenInvoiceValue);
                    line.SetValue("OpenQuantity__", poItemData.OpenInvoiceQuantity);
                    line.SetValue("ExpectedAmount__", poItemData.ExpectedAmount);
                    line.SetValue("ExpectedQuantity__", poItemData.ExpectedQuantity);*/
                    //	Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.OnMMAddPOLine", params, line, poItemData, item);
                    MMAddInvoiceTax(params, item.TaxCode, line.GetValue("TaxAmount__"));
                    params.WSParams.to_SuplrInvcItemPurOrdRef.results.push(item);
                    return true;
                }
                function MMAddPOLines(params) {
                    // Process line items
                    var itemNumberIdx = 0;
                    var lineItems = Data.GetTable("LineItems__");
                    // Parse line items and pre-check required fields.
                    //let itemNumberTaxIdx = 1;
                    for (var idx = 0; idx < lineItems.GetItemCount(); idx++) {
                        var poLine = lineItems.GetItem(idx);
                        if (Lib.P2P.InvoiceLineItem.IsPOLikeLineItem(poLine)) {
                            if (MMAddPOLine(params, poLine)) {
                                itemNumberIdx++;
                            }
                        }
                    }
                    return itemNumberIdx;
                }
                Invoice.MMAddPOLines = MMAddPOLines;
                // #endregion Integrate MM invoice
                // #region Integrate FI invoice
                function FIHeaderSet() {
                    var ownerId = Data.GetValue("LastSavedOwnerID");
                    var user = Users.GetUserAsProcessAdmin(ownerId);
                    if (!user) {
                        ownerId = Data.GetValue("OwnerID");
                        user = Users.GetUserAsProcessAdmin(ownerId);
                        if (!user) {
                            Log.Error("Could not retrieve user name");
                            return null;
                        }
                        Log.Info("LastSavedOwnerID is empty get ownerId instead for the webservice call");
                    }
                    var userName = user.GetVars().GetValue_String("DisplayName", 0);
                    var params = {
                        WSParams: {
                            OriginalReferenceDocumentType: "BKPFF",
                            OriginalReferenceDocument: "",
                            OriginalReferenceDocumentLogicalSystem: "",
                            OriginalPredecessorRefDocument: "",
                            BusinessTransactionType: "RFBU",
                            AccountingDocumentType: Sys.Parameters.GetInstance("AP").GetParameter("SAPDocumentTypeFIInvoice"),
                            CreatedByUser: userName,
                            CompanyCode: Data.GetValue("CompanyCode__"),
                            DocumentDate: Sys.Helpers.SAP.FormatToSAPS4CloudDateTimeFormat(Data.GetValue("InvoiceDate__")),
                            PostingDate: Sys.Helpers.SAP.FormatToSAPS4CloudDateTimeFormat(Data.GetValue("PostingDate__")),
                            DocumentReferenceID: Data.GetValue("InvoiceNumber__"),
                            DocumentHeaderText: Data.GetValue("InvoiceDescription__")
                        }
                    };
                    params.GetData = function () {
                        return JSON.stringify(this.WSParams);
                    };
                    return params;
                }
                Invoice.FIHeaderSet = FIHeaderSet;
                function FIAddVendorLine(params, blockPayment) {
                    var vendorNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10);
                    var itemNumber = "0000000001";
                    // ACCOUNTPAYABLE
                    var altPayeeNumber = Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("AlternativePayee__"), 10);
                    var paymentBlockingReason = blockPayment ? Variable.GetValueAsString("InvoicePaymentBlock") : "";
                    var paymentMethod = Data.GetValue("SAPPaymentMethod__");
                    var invoiceAmount = Data.GetValue("InvoiceAmount__");
                    var newCreditorItem = {
                        ReferenceDocumentItem: itemNumber,
                        Creditor: vendorNumber,
                        AssignmentReference: Data.GetValue("Assignment__"),
                        DocumentItemText: Data.GetValue("InvoiceDescription__"),
                        BusinessPlace: Data.GetValue("BusinessArea__"),
                        AmountInTransactionCurrency: GetCurrency(-1 * invoiceAmount),
                        DebitCreditCode: invoiceAmount > 0 ? "H" : "S"
                    };
                    if (paymentMethod || paymentBlockingReason || altPayeeNumber) {
                        newCreditorItem.PaymentDetails = {
                            PaymentMethod: paymentMethod,
                            PaymentBlockingReason: paymentBlockingReason,
                            AlternativePayee: altPayeeNumber
                        };
                    }
                    params.WSParams.CreditorItem = [newCreditorItem];
                }
                Invoice.FIAddVendorLine = FIAddVendorLine;
                function FIAddWHT(params) {
                    if (Sys.Parameters.GetInstance("AP").GetParameter("TaxesWithholdingTax", "") !== "Extended") {
                        return;
                    }
                    var itemNumber = "0000000001";
                    var lines = Data.GetTable("ExtendedWithholdingTax__");
                    if (lines.GetItemCount() > 0) {
                        params.WSParams.WithholdingTaxItem = [];
                        for (var idx = 0; idx < lines.GetItemCount(); idx++) {
                            var whtLine = lines.GetItem(idx);
                            params.WSParams.WithholdingTaxItem.push({
                                ReferenceDocumentItem: itemNumber,
                                WithholdingTaxType: whtLine.GetValue("WHTType__").toUpperCase(),
                                WithholdingTaxCode: whtLine.GetValue("WHTCode__").toUpperCase(),
                                AmountInTransactionCurrency: GetCurrency(whtLine.GetValue("WHTTaxAmount__")),
                                TaxBaseAmountInTransCrcy: GetCurrency(whtLine.GetValue("WHTBaseAmount__")),
                                TaxIsToBeCalculated: whtLine.GetValue("WHTTaxAmountAuto__")
                            });
                        }
                    }
                }
                Invoice.FIAddWHT = FIAddWHT;
                function FIAddGLLines(params, itemNumberIdx) {
                    // Process line items
                    var lineItems = Data.GetTable("LineItems__");
                    // Parse line items and pre-check required fields.
                    var itemNumberTaxIdx = 1;
                    for (var idx = 0; idx < lineItems.GetItemCount(); idx++) {
                        var glLine = lineItems.GetItem(idx);
                        if (Lib.P2P.InvoiceLineItem.IsGLLikeLineItem(glLine)) {
                            if (Lib.AP.SAPS4Cloud.Invoice.FIGLLineIsValid(params, glLine)) {
                                // Process this item
                                var itemNumber = Sys.Helpers.SAP.BuildItemNumber(itemNumberIdx);
                                itemNumberTaxIdx = Lib.AP.SAPS4Cloud.Invoice.FIAddGLLine(params, glLine, itemNumber, itemNumberTaxIdx);
                                itemNumberIdx++;
                            }
                            else {
                                return -1;
                            }
                        }
                    }
                    return itemNumberIdx;
                }
                Invoice.FIAddGLLines = FIAddGLLines;
                function FIGLLineIsValid(params, line) {
                    var accountNumber = line.GetValue("GLAccount__");
                    var taxJurisdiction = line.GetValue("TaxJurisdiction__");
                    var taxCode = line.GetValue("TaxCode__");
                    // Format values for SAP
                    if (accountNumber) {
                        accountNumber = Sys.Helpers.String.SAP.NormalizeID(accountNumber, 10);
                    }
                    if (taxJurisdiction) {
                        taxJurisdiction = Sys.Helpers.String.SAP.Trim(taxJurisdiction).toUpperCase();
                    }
                    if (taxCode) {
                        taxCode = Sys.Helpers.SAP.FormatTaxCode(taxCode);
                    }
                    // Check required fields
                    var errMessage = "";
                    if (!accountNumber) {
                        errMessage = Language.Translate("_Line item '{0}' is invalid. Specify account number.", false, line.GetValue("Description__"));
                    }
                    if (errMessage.length > 0) {
                        Sys.Helpers.SAP.SetLastError(errMessage);
                        return false;
                    }
                    return true;
                }
                Invoice.FIGLLineIsValid = FIGLLineIsValid;
                function FIAddGLLine(params, line, itemNumber, itemNumberTaxIdx) {
                    // Process an account line
                    var lineCurrency = line.GetValue("InvoiceCurrency__");
                    var currency = lineCurrency ? lineCurrency : Data.GetValue("InvoiceCurrency__");
                    var accountNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("GLAccount__"), 10);
                    var costCenter = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("CostCenter__"), 10);
                    var compCode = line.GetValue("CompanyCode__");
                    if (!compCode) {
                        compCode = Data.GetValue("CompanyCode__");
                    }
                    var taxCode = Sys.Helpers.SAP.FormatTaxCode(line.GetValue("TaxCode__"));
                    var taxJurisdiction = line.GetValue("TaxJurisdiction__");
                    var wbsElement = line.GetValue("WBSElement__");
                    var businessArea = line.GetValue("BusinessArea__");
                    var amount = line.GetValue("Amount__");
                    taxJurisdiction = taxJurisdiction ? taxJurisdiction.toUpperCase() : "";
                    var itemNumberTax = "";
                    //if (params.TaxLineByLine)
                    if (taxJurisdiction) {
                        itemNumberTax = Sys.Helpers.SAP.BuildItemNumber(itemNumberTaxIdx, 6, 1);
                        itemNumberTaxIdx++;
                    }
                    // Accumulate tax amounts for later
                    var taxAmount = line.GetValue("TaxAmount__");
                    Lib.AP.SAP.Invoice.AddTaxAmount(params, taxCode, taxJurisdiction, itemNumberTax, amount, taxAmount);
                    // ACCOUNTGL
                    if (!params.WSParams.Item) {
                        params.WSParams.Item = [];
                    }
                    var newItem = {
                        ReferenceDocumentItem: itemNumber,
                        CompanyCode: compCode,
                        GLAccount: accountNumber,
                        DocumentItemText: line.GetValue("Description__"),
                        AssignmentReference: line.GetValue("Assignment__"),
                        TradingPartner: Sys.Helpers.String.SAP.NormalizeID(line.GetValue("TradingPartner__"), 6),
                        AmountInTransactionCurrency: GetCurrency(amount, currency),
                        DebitCreditCode: amount >= 0 ? "S" : "H"
                    };
                    if (itemNumberTax || taxCode || taxJurisdiction) {
                        newItem.Tax = {
                            TaxItemGroup: itemNumberTax,
                            TaxCode: taxCode,
                            TaxJurisdiction: taxJurisdiction
                        };
                    }
                    if (costCenter || wbsElement || businessArea) {
                        newItem.AccountAssignment = {
                            CostCenter: costCenter,
                            WBSElement: wbsElement,
                            FunctionalArea: businessArea
                        };
                    }
                    params.WSParams.Item.push(newItem);
                    return itemNumberTaxIdx;
                }
                Invoice.FIAddGLLine = FIAddGLLine;
                function FIAddTaxLines(erpInvoiceDocument, params, itemNumberIdx) {
                    var manualTax = !Data.GetValue("CalculateTax__");
                    var invoiceCurrency = Data.GetValue("InvoiceCurrency__");
                    var companyCode = Data.GetValue("CompanyCode__");
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
                                params.LastErrorMessage = Language.Translate("_The tax amount must not be greater than the tax base.");
                                return itemNumberIdx;
                            }
                            var getTaxAccounts = Lib.AP.SAPS4Cloud.Invoice.GetTaxFromNet;
                            if (params.grossPosting) {
                                getTaxAccounts = Lib.AP.SAPS4Cloud.Invoice.GetTaxFromGross;
                            }
                            var taxAccountsList = getTaxAccounts(erpInvoiceDocument, params, companyCode, currentTaxCode, currentTaxJurisdiction, invoiceCurrency, taxCodeAmounts.amount, taxCodeAmounts.taxAmount);
                            if (!taxAccountsList) {
                                continue;
                            }
                            var theoricTaxAmount = 0;
                            var taxAccIdx = void 0, aTaxAccount = void 0;
                            if (manualTax) {
                                // compute theoric tax amount for this tax code
                                // (The sum on taxAccountsList should only be useful if TaxJurisdictionLength > 0)
                                for (var i = 0; i < taxAccountsList.length; i++) {
                                    theoricTaxAmount += taxAccountsList[i].Tax_Amount;
                                }
                                // If theoric amount is 0, then tax amount impossible in this item (E 724 FF)
                                if (theoricTaxAmount === 0 && taxCodeAmounts.taxAmount !== 0) {
                                    params.LastErrorMessage = Language.Translate("_Tax entry not possible in this item.");
                                    return itemNumberIdx;
                                }
                                var sum = 0;
                                for (taxAccIdx = taxAccountsList.length - 1; taxAccIdx >= 0; taxAccIdx--) {
                                    aTaxAccount = taxAccountsList[taxAccIdx];
                                    taxAccountsList[taxAccIdx].computedTaxAmount = Sys.Helpers.SAP.Round(taxCodeAmounts.taxAmount * (aTaxAccount.Tax_Amount / theoricTaxAmount));
                                    sum += taxAccountsList[taxAccIdx].computedTaxAmount;
                                    if (taxAccIdx === 0) {
                                        // dispatch the leftover on first line (do not round to avoid balance issues)
                                        taxAccountsList[taxAccIdx].computedTaxAmount += taxCodeAmounts.taxAmount - sum;
                                    }
                                }
                            }
                            for (taxAccIdx = 0; taxAccIdx < taxAccountsList.length; taxAccIdx++) {
                                aTaxAccount = taxAccountsList[taxAccIdx];
                                var itemNumber = Sys.Helpers.SAP.BuildItemNumber(itemNumberIdx);
                                var computedTaxAmount = aTaxAccount.Tax_Amount;
                                if (manualTax && aTaxAccount.Tax_Rate !== 0) {
                                    // compute the tax amount for the current tax account
                                    computedTaxAmount = taxAccountsList[taxAccIdx].computedTaxAmount;
                                }
                                // Always add the tax lines (for correct dispatch in all tax levels)
                                Lib.AP.SAPS4Cloud.Invoice.FIAddTaxLine(params, itemNumber, aTaxAccount, invoiceCurrency, computedTaxAmount, currentItemNumberTax, manualTax);
                                itemNumberIdx++;
                                // Ignore useless tax lines
                                if (aTaxAccount.Tax_Rate === 0) {
                                    continue;
                                }
                                if (params.grossPosting || !aTaxAccount.Gl_Account) {
                                    // if Empty Tax G/L Account, tax amount should be dispatched within the items
                                    // or if gross posting, tax amount should be deducted from the items (to calculate net amounts)
                                    Lib.AP.SAPS4Cloud.Invoice.FIDispatchTaxAmount(params, aTaxAccount, computedTaxAmount, taxCodeAmounts.amount, currentItemNumberTax);
                                }
                            }
                        }
                    }
                    return itemNumberIdx;
                }
                Invoice.FIAddTaxLines = FIAddTaxLines;
                function FIAddTaxLine(params, itemNumber, aTaxAccount, invoiceCurrency, computedTaxAmount, itemNumberTax, manualTax) {
                    if (!params.WSParams.ProductTaxItem) {
                        params.WSParams.ProductTaxItem = [];
                    }
                    params.WSParams.ProductTaxItem.push({
                        TaxCode: aTaxAccount.Tax_Code,
                        TaxItemClassification: aTaxAccount.Acct_Key,
                        TaxJurisdiction: aTaxAccount.Taxjurcode,
                        TaxJurisdictionLevel: aTaxAccount.Taxjurcode_Level,
                        TaxItemGroup: itemNumberTax,
                        TaxRate: aTaxAccount.Tax_Rate,
                        AmountInTransactionCurrency: GetCurrency(computedTaxAmount, invoiceCurrency),
                        TaxBaseAmountInTransCrcy: GetCurrency(aTaxAccount.Base_Amount, invoiceCurrency),
                        IsDirectTaxPosting: manualTax
                    });
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
                    for (var i = 0; i < params.WSParams.Item.length; i++) {
                        var glItem = params.WSParams.Item[i];
                        var glMatch = glItem && aTaxAccount && glItem.Tax && glItem.Tax.TaxCode
                            && glItem.Tax.TaxCode === aTaxAccount.Tax_Code
                            && glItem.Tax.TaxJurisdiction === aTaxAccount.Taxjurcode_Deep
                            && glItem.Tax.TaxItemGroup === itemNumberTax;
                        if (glMatch) {
                            nMatchingGLLines++;
                        }
                    }
                    // 2nd pass: dispatch the tax amount
                    var grossPostingFactor = params.grossPosting ? -1 : 1;
                    var amountToBeDispatched = totalAmountToDispatch;
                    for (var i = 0; i < params.WSParams.Item.length; i++) {
                        var glItem = params.WSParams.Item[i];
                        var glMatch = glItem && aTaxAccount && glItem.Tax && glItem.Tax.TaxCode
                            && glItem.Tax.TaxCode === aTaxAccount.Tax_Code
                            && glItem.Tax.TaxJurisdiction === aTaxAccount.Taxjurcode_Deep
                            && glItem.Tax.TaxItemGroup === itemNumberTax;
                        if (glMatch) {
                            var taxItem = null;
                            for (var j = 0; j < params.WSParams.ProductTaxItem.length; j++) {
                                taxItem = params.WSParams.ProductTaxItem[j];
                                if (glItem.Tax.TaxItemGroup === taxItem.TaxItemGroup) {
                                    break;
                                }
                                else {
                                    taxItem = null;
                                }
                            }
                            if (taxItem) {
                                var sum = void 0;
                                // Avoid balance rounding errors
                                if (nMatchingGLLines === 1) {
                                    sum = taxItem.AmountInTransactionCurrency.value + (amountToBeDispatched * grossPostingFactor);
                                }
                                else {
                                    sum = taxItem.AmountInTransactionCurrency.value;
                                    var manualTaxRatio = sum / baseAmount;
                                    var manualTaxAmount = totalAmountToDispatch * manualTaxRatio;
                                    sum += Sys.Helpers.SAP.Round(manualTaxAmount * grossPostingFactor);
                                    amountToBeDispatched = amountToBeDispatched - Sys.Helpers.SAP.Round(manualTaxAmount);
                                }
                                taxItem.AmountInTransactionCurrency.value = Sys.Helpers.SAP.Round(sum);
                                nMatchingGLLines--;
                            }
                        }
                    }
                }
                Invoice.FIDispatchTaxAmount = FIDispatchTaxAmount;
                function GetTaxFromNet(erpInvoiceDocument, params, companyCode, taxCode, taxJurisdiction, currency, baseAmount, taxAmount) {
                    if (taxCode && Sys.Helpers.String.SAP.Trim(taxCode).length > 0) {
                        var filter = "(TaxCode__=" + taxCode + ")";
                        filter = "|" + filter + "";
                        filter = filter.AddCompanyCodeFilter(companyCode);
                        var options = {
                            table: "AP - Tax codes__",
                            filter: filter,
                            attributes: ["TaxCode__", "TaxRate__", "TaxClassification__"],
                            maxRecords: 1
                        };
                        var taxAccounts_1 = [];
                        Sys.GenericAPI.PromisedQuery(options)
                            .Then(function (queryResults) {
                            if (queryResults.length > 0) {
                                taxAccounts_1.push({
                                    TaxItemGroup: "",
                                    Acct_Key: queryResults[0].TaxClassification__.toUpperCase(),
                                    Cond_Key: null,
                                    Gl_Account: null,
                                    Tax_Amount: taxAmount,
                                    Tax_Code: taxCode,
                                    Tax_Rate: queryResults[0].TaxRate__,
                                    Taxjurcode: taxJurisdiction,
                                    Taxjurcode_Deep: null,
                                    Taxjurcode_Level: null,
                                    Base_Amount: baseAmount
                                });
                            }
                        });
                        return taxAccounts_1;
                    }
                    params.LastErrorMessage = "'taxCode' is a required parameter";
                    return null;
                }
                Invoice.GetTaxFromNet = GetTaxFromNet;
                function GetTaxFromGross() {
                    // Not implemented yet
                    return null;
                }
                Invoice.GetTaxFromGross = GetTaxFromGross;
                // #endregion public
            })(Invoice = SAPS4Cloud.Invoice || (SAPS4Cloud.Invoice = {}));
        })(SAPS4Cloud = AP.SAPS4Cloud || (AP.SAPS4Cloud = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
