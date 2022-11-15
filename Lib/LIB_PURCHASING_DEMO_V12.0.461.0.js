///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Demo_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing library",
  "require": [
    "Lib_ERP_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_Vendor_V12.0.461.0",
    "Lib_Purchasing_ShipTo_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Date",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Demo;
        (function (Demo) {
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            var CCurrency = Lib.P2P.Currency.CCurrency;
            function RetrievePO(poNumber) {
                if (!Data.GetValue("/process/name").startsWith("Purchase order")) {
                    return Lib.P2P.QueryPOFormData(poNumber);
                }
                return Data;
            }
            Demo.RetrievePO = RetrievePO;
            // generated filename: PO_INVOICE_<CompanyCode>_<ERP>_<InvoiceNumber>.pdf
            function GenerateVendorInvoiceName(invoicenumber) {
                var invoicename = "PO_INVOICE_" + Data.GetValue("CompanyCode__") + "_" + Lib.ERP.GetERPName() + "_" + invoicenumber + ".pdf";
                Log.Info(invoicename + " generated");
                return invoicename;
            }
            function AttachVendorInvoice_DOC(childCF, csvFilename) {
                // attaches the word template as the current document
                var language = Lib.P2P.GetValidatorOrOwner().GetVars().GetValue_String("Language", 0);
                var templateParameter = Lib.P2P.IsGRIVEnabledGlobally() ? "DemoInvoiceGRIVTemplateName" : "DemoInvoiceTemplateName";
                var Invoice_Template = Sys.Parameters.GetInstance("PAC").GetParameter(templateParameter);
                Invoice_Template = Lib.P2P.GetValidatorOrOwner().GetTemplateFile(Invoice_Template, language);
                var attach = childCF.AddAttachEx(Invoice_Template);
                var attachVars = attach.GetVars();
                attachVars.AddValue_Long("AttachToProcess", 1, true);
                attachVars.AddValue_String("AttachOutputFormat", "pdf", true);
                attachVars.AddValue_String("AttachConvertOptions", "?mailmergedatasource=%[Resources(AttachOutputName=" + csvFilename + ")]", true);
            }
            function AttachVendorInvoice_CSV(poData, childCF, csvFilename, invoiceNumber, onlyDelivered, generateInvoiceFromReturnOrder) {
                if (generateInvoiceFromReturnOrder === void 0) { generateInvoiceFromReturnOrder = false; }
                var isMultiShipTo = Lib.Purchasing.IsMultiShipTo();
                Log.Info("[Lib.Purchasing.Demo] during AttachVendorInvoice_CSV => isMultiShipTo : " + isMultiShipTo);
                var csv = Lib.Purchasing.BuildCSVHeader(["VendorNumber", "VendorName", "VendorVATNumber", "VendorFaxNumber", "VendorAddress", "DocumentTitle",
                    "ShipToCompany", "ShipToContact", "ShipToAddress",
                    "DocumentNo", "DocumentDate", "Invoice_number", "PO_number", "Contract_number",
                    "Currency", "TotalNetAmount", "TotalTaxAmount", "Total",
                    "InvoiceDate", "DeliveryNote", "ItemNumber", "Description", "Quantity", "UnitPrice", "NetAmount", "TaxAmount", "LastRecord"]);
                // tax codes for SAP and generic demo
                var taxRatesForDemoInvoice = {
                    "AU01": 10.0,
                    "FR01": 20.0,
                    "2200": 20.0,
                    "1000": 19.0,
                    "US01": 19.0,
                    "3000": 8.0,
                    "00001": 5.0,
                    "00070": 20.0,
                    "204": 15.0,
                    "888": 19.6,
                    "CRONUS International Ltd.": 10,
                    "CRONUS France S.A.": 19.6 // for NAV FR
                };
                var taxRate = 19.6; // Default value if no specific value found (good for JDE demo environment)
                var companyCode = poData.GetValue("CompanyCode__");
                if (companyCode in taxRatesForDemoInvoice) {
                    taxRate = taxRatesForDemoInvoice[companyCode];
                    Log.Info("[Lib.Purchasing.Demo] Tax rate used to generate demo invoice:" + taxRate);
                }
                else {
                    Log.Warn("[Lib.Purchasing.Demo] No default tax rate found for company code:" + companyCode + ", using:" + taxRate);
                }
                var val = Lib.Purchasing.GetValueAsString;
                var table, deliveryDate, deliveryNote;
                var noGoodsReceiptItems = onlyDelivered;
                if (Sys.Helpers.IsArray(noGoodsReceiptItems)) {
                    var noGoodsReceiptItemsAsItems_1 = noGoodsReceiptItems;
                    // here, onlyDelivered contains PO line items having requested delivery date reached and no goods receipt needed
                    Log.Info("[Lib.Purchasing.Demo] " + noGoodsReceiptItemsAsItems_1.length + " PO line items having requested delivery date reached and no goods receipt needed");
                    table = {
                        GetItemCount: function () {
                            return noGoodsReceiptItemsAsItems_1.length;
                        },
                        GetItem: function (index) {
                            var PO2GRItemName = {
                                "Number__": "ItemNumber__",
                                "Description__": "ItemDescription__",
                                "OrderedQuantity__": "ItemQuantity__",
                                "ReceivedQuantity__": "ItemQuantity__",
                                "UnitPrice__": "ItemUnitPrice__"
                            };
                            return {
                                GetProperties: function (name) {
                                    return index < noGoodsReceiptItemsAsItems_1.length ? noGoodsReceiptItems[index].GetProperties(PO2GRItemName[name]) : null;
                                },
                                GetValue: function (name) {
                                    return index < noGoodsReceiptItemsAsItems_1.length ? noGoodsReceiptItems[index].GetValue(PO2GRItemName[name]) : null;
                                }
                            };
                        }
                    };
                    deliveryDate = table.GetItemCount() > 0 ? noGoodsReceiptItems[0].GetValue("ItemRequestedDeliveryDate__") : new Date();
                    deliveryNote = "No goods receipt items";
                    onlyDelivered = false;
                }
                else if (generateInvoiceFromReturnOrder) {
                    Log.Info("[Lib.Purchasing.Demo] from Return Order process");
                    deliveryDate = Data.GetValue("ReturnDate__");
                }
                else {
                    // from GoodReceipt process
                    Log.Info("[Lib.Purchasing.Demo] from GoodReceipt process");
                    table = Data.GetTable("LineItems__");
                    deliveryDate = Data.GetValue("DeliveryDate__");
                    deliveryNote = Data.GetValue("DeliveryNote__");
                }
                var itemIdx;
                var invoice = {
                    totalNetAmount: new Sys.Decimal(0),
                    invoiceItems: []
                };
                if (table) {
                    var nItems = table.GetItemCount();
                    // Add items
                    for (itemIdx = 0; itemIdx < nItems; itemIdx++) {
                        var currentItem = table.GetItem(itemIdx);
                        var itemCurrency = CurrencyFactory.Get(currentItem.GetValue("ItemCurrency__") || currentItem.GetValue("Currency__"));
                        var qt = currentItem.GetValue("ReceivedQuantity__");
                        if ((onlyDelivered && qt != null && qt !== 0) || (!onlyDelivered)) {
                            var invoiceItem = {
                                deliveryNote: deliveryNote,
                                number: currentItem.GetValue("SupplierPartID__"),
                                description: currentItem.GetValue("Description__"),
                                quantity: new Sys.Decimal(onlyDelivered ? qt : currentItem.GetValue("OrderedQuantity__") || 0),
                                unitPrice: new Sys.Decimal(currentItem.GetValue("UnitPrice__") || 0),
                                netAmount: new Sys.Decimal(0),
                                taxAmount: new Sys.Decimal(0),
                                deliveredDate: deliveryDate,
                                lineNumber: currentItem.GetValue("LineNumber__"),
                                currency: itemCurrency
                            };
                            //apply a 15% difference if the GR description mentions one of the expected keywords
                            //difference applies to the first line only
                            var comment = Data.GetValue("Comment__");
                            if (itemIdx === 0 && comment && comment.match(/.*(mismatch|difference|ecart|écart|différence).*/gi)) {
                                invoiceItem.unitPrice = Sys.Helpers.Round(invoiceItem.unitPrice.mul(1.15), itemCurrency.unitPricePrecision);
                            }
                            invoiceItem.netAmount = Sys.Helpers.Round(invoiceItem.unitPrice.mul(invoiceItem.quantity), itemCurrency.amountPrecision);
                            if (Lib.Purchasing.Items.IsAmountBasedItem(currentItem)) {
                                invoiceItem.quantity = null;
                                invoiceItem.unitPrice = null;
                            }
                            var taxAmount = new Sys.Decimal(invoiceItem.netAmount || 0)
                                .mul(taxRate)
                                .div(100);
                            invoiceItem.taxAmount = Sys.Helpers.Round(taxAmount, itemCurrency.amountPrecision);
                            invoice.invoiceItems.push(invoiceItem);
                            invoice.totalNetAmount = invoice.totalNetAmount.add(invoiceItem.netAmount);
                        }
                        Log.Info(invoice.invoiceItems.length + " line(s) were inserted");
                    }
                }
                // Is this the first non-canceled reception for the related PO ?
                // !!! This function is called before PO Items sync
                var poItemsFilter = "(&(!(Status__=Canceled))(DeliveryDate__=*)(PONumber__=" + poData.GetValue("OrderNumber__") + "))";
                var poItems = Lib.Purchasing.Items.GetItemsForDocumentSync(Lib.Purchasing.Items.POItemsDBInfo, poItemsFilter, "LineNumber__");
                poItems = Object.keys(poItems);
                if (!poItems || !poItems.length) {
                    // This means it's the first time a GR is generated for the PO
                    // Additional fees of the PO are all included in the invoice generated for the first GR
                    // Add additional fees
                    var feesTable = poData.GetTable("AdditionalFees__");
                    for (itemIdx = 0; itemIdx < feesTable.GetItemCount(); itemIdx++) {
                        var currentItem = feesTable.GetItem(itemIdx);
                        var itemCurrency = CurrencyFactory.Get(currentItem.GetValue("ItemCurrency__") || currentItem.GetValue("Currency__"));
                        var amount = Sys.Helpers.Round(new Sys.Decimal(parseFloat(currentItem.GetValue("Price__")) || 0), itemCurrency.amountPrecision);
                        var taxAmount = Sys.Helpers.Round(amount.mul(taxRate).div(100), itemCurrency.amountPrecision);
                        var invoiceItem = {
                            deliveryNote: deliveryNote,
                            number: "",
                            description: currentItem.GetValue("AdditionalFeeDescription__"),
                            quantity: null,
                            unitPrice: null,
                            netAmount: amount,
                            taxAmount: taxAmount,
                            deliveredDate: deliveryDate,
                            lineNumber: "",
                            currency: itemCurrency
                        };
                        invoice.totalNetAmount = invoice.totalNetAmount.add(invoiceItem.netAmount);
                        invoice.invoiceItems.push(invoiceItem);
                    }
                }
                // The vendor sends invoices in its own culture ==> generate invoice accordingly
                // If no vendor returned (ex. AlwaysCreateVendor = 0) we take the culture of the current owner of document
                var user = Lib.Purchasing.GetVendor(poData, poData.GetValue("VendorEmail__")) || Lib.P2P.GetValidatorOrOwner();
                var culture = user.GetVars().GetValue_String("Culture", 0);
                var csvShipToCompany = val(poData, "ShipToCompany__", culture);
                var csvShipToAddress = val(poData, "ShipToAddress__", culture);
                var documentNo = "Invoice No.";
                var documentDate = "Invoice Date";
                var documentTitle = "Purchase - Invoice";
                if (culture.indexOf("fr-") !== -1) {
                    documentNo = "Facture N°";
                    documentDate = "Date de facture";
                    documentTitle = "Facture";
                }
                if (generateInvoiceFromReturnOrder) {
                    documentTitle = "Credit Memo";
                    documentNo = "Credit Memo No.";
                    documentDate = "Credit Memo date";
                    if (culture.indexOf("fr-") !== -1) {
                        documentNo = "Note de crédit N°";
                        documentDate = "Date de Note de crédit";
                        documentTitle = "Note de crédit";
                    }
                    var lineItems = Sys.Helpers.Data.GetTableAsArray("LineItems__");
                    for (var i = 0; i < lineItems.length; i++) {
                        var returnedItem = lineItems[i];
                        var unitPrice = new Sys.Decimal(returnedItem.GetValue("UnitPrice__") || 0);
                        var itemCurrency = CurrencyFactory.Get(returnedItem.GetValue("ItemCurrency__") || returnedItem.GetValue("Currency__"));
                        // To generate a credit memo, received quantities should be negative
                        var quantity = new Sys.Decimal(-returnedItem.GetValue("ReturnedQuantity__") || 0);
                        var netAmount = Sys.Helpers.Round(unitPrice.mul(quantity), itemCurrency.amountPrecision);
                        var taxAmount = Sys.Helpers.Round(netAmount.mul(taxRate).div(100), itemCurrency.amountPrecision);
                        var invoiceItem = {
                            deliveryNote: returnedItem.GetValue("DeliveryNote__"),
                            number: returnedItem.GetValue("ItemNumber__"),
                            description: returnedItem.GetValue("Description__"),
                            quantity: quantity,
                            unitPrice: unitPrice,
                            netAmount: netAmount,
                            taxAmount: taxAmount,
                            deliveredDate: Data.GetValue("ReturnDate__"),
                            lineNumber: Data.GetValue("POLineNumber__"),
                            currency: itemCurrency
                        };
                        invoice.invoiceItems.push(invoiceItem);
                        invoice.totalNetAmount = invoice.totalNetAmount.add(invoiceItem.netAmount);
                    }
                }
                var nval = function (number, culture, currency) {
                    return number == null ? "" : Lib.Purchasing.GetNumberAsString(number.toNumber(), culture, currency.unitPricePrecision, currency.amountPrecision);
                };
                var csvFixed = Lib.Purchasing.BuildCSVLine([
                    val(poData, "VendorNumber__", culture),
                    val(poData, "VendorName__", culture),
                    val(poData, "VendorVatNumber__", culture),
                    val(poData, "VendorFaxNumber__", culture),
                    val(poData, "VendorAddress__", culture),
                    documentTitle
                ]);
                var csvShipToContact = val(poData, "ShipToContact__", culture);
                var csvShipTo;
                // Demo invoice from RO is mono shipTo, so please correct ship to address
                if (!isMultiShipTo || generateInvoiceFromReturnOrder) {
                    if (!Sys.Helpers.IsEmpty(csvShipToCompany) && !Sys.Helpers.IsEmpty(csvShipToAddress)) {
                        // Remove ShipToCompany if present to avoid to have it twice in address block
                        csvShipToAddress = csvShipToAddress.replace(new RegExp("^" + Sys.Helpers.String.EscapeValueForRegEx(csvShipToCompany) + "(\r|\n)*", "g"), "");
                    }
                    csvShipTo = Lib.Purchasing.BuildCSVLine([csvShipToCompany, csvShipToContact, csvShipToAddress]);
                }
                var contractNumber = "";
                var tablePoData = poData.GetTable("LineItems__");
                var currencyInvoice = CurrencyFactory.Get(poData.GetValue("Currency__"));
                for (var lineItemIdx = 0; lineItemIdx < tablePoData.GetItemCount(); ++lineItemIdx) {
                    var lineItem = tablePoData.GetItem(lineItemIdx);
                    contractNumber = lineItem.GetValue("ContractNumber__");
                    if (contractNumber) {
                        break;
                    }
                }
                var totalNetAmount = Sys.Helpers.Round(invoice.totalNetAmount, currencyInvoice.amountPrecision);
                var totalTaxeAmount = Sys.Helpers.Round(totalNetAmount.mul(taxRate).div(100), currencyInvoice.amountPrecision);
                var currency = CurrencyFactory.Get(poData.GetValue("Currency__"));
                var csvFixed2 = Lib.Purchasing.BuildCSVLine([
                    documentNo,
                    documentDate,
                    invoiceNumber,
                    val(poData, "OrderNumber__", culture),
                    contractNumber,
                    val(poData, "Currency__", culture),
                    nval(totalNetAmount, culture, currency),
                    nval(totalTaxeAmount, culture, currency),
                    nval(totalNetAmount.add(totalTaxeAmount), culture, currency)
                ]);
                for (var itemIdx_1 in invoice.invoiceItems) {
                    var invoiceItem = invoice.invoiceItems[itemIdx_1];
                    if (isMultiShipTo) {
                        for (var lineIdx = 0; lineIdx < tablePoData.GetItemCount(); ++lineIdx) {
                            var item = tablePoData.GetItem(lineIdx);
                            // eslint-disable-next-line radix
                            if (parseInt(item.GetValue("LineItemNumber__")) === invoiceItem.lineNumber) {
                                csvShipToCompany = item.GetValue("ItemShipToCompany__");
                                csvShipToAddress = item.GetValue("ItemShipToAddress__");
                                if (!Sys.Helpers.IsEmpty(csvShipToCompany) && !Sys.Helpers.IsEmpty(csvShipToAddress)) {
                                    // Remove ShipToCompany if present to avoid to have it twice in address block
                                    csvShipToAddress = csvShipToAddress.replace(new RegExp("^" + Sys.Helpers.String.EscapeValueForRegEx(csvShipToCompany) + "(\r|\n)*", "g"), "");
                                }
                                break;
                            }
                        }
                        csvShipTo = Lib.Purchasing.BuildCSVLine([csvShipToCompany, csvShipToContact, csvShipToAddress]);
                    }
                    csv += csvFixed + ";" + csvShipTo + ";" + csvFixed2 + ";" +
                        Lib.Purchasing.BuildCSVLine([
                            Sys.Helpers.Date.ToLocaleDate(invoiceItem.deliveredDate, culture),
                            invoiceItem.deliveryNote,
                            invoiceItem.number,
                            invoiceItem.description,
                            nval(invoiceItem.quantity, culture, new CCurrency("", 2) /* need 2 precision*/),
                            nval(invoiceItem.unitPrice, culture, invoiceItem.currency),
                            nval(invoiceItem.netAmount, culture, invoiceItem.currency),
                            nval(invoiceItem.taxAmount, culture, invoiceItem.currency),
                            (itemIdx_1 == invoice.invoiceItems.length - 1) ? "1" : ""
                        ]) + "\n";
                }
                // attaches .csv as a resource
                var attach = childCF.AddAttach();
                var attachVars = attach.GetVars();
                attachVars.AddValue_String("AttachEncoding", "UNICODE", true);
                attachVars.AddValue_String("AttachContent", csv, true);
                attachVars.AddValue_String("AttachType", "inline", true);
                attachVars.AddValue_String("AttachIsResource", "1", true);
                attachVars.AddValue_String("AttachOutputName", csvFilename, true);
            }
            Demo.AttachVendorInvoice_CSV = AttachVendorInvoice_CSV;
            function GenerateVendorInvoice(poNumber, bDeferred, onlyDelivered, generateInvoiceFromReturnOrder) {
                if (onlyDelivered === void 0) { onlyDelivered = false; }
                if (generateInvoiceFromReturnOrder === void 0) { generateInvoiceFromReturnOrder = false; }
                Log.Time("GenerateVendorInvoice");
                Log.Info("Generating vendor invoice for po number: " + poNumber);
                Log.Time("RetrievePO");
                var poData = RetrievePO(poNumber);
                Log.TimeEnd("RetrievePO");
                if (poData) {
                    Log.Time("CreateTransport");
                    var childCF = Process.CreateTransport("Copy");
                    Log.TimeEnd("CreateTransport");
                    if (childCF) {
                        Log.Time("Sequence");
                        var invoiceNumberSequence = void 0;
                        try {
                            var sequenceTable = "Vendor invoice";
                            invoiceNumberSequence = Process.GetSequence("DemoInvNum", sequenceTable);
                        }
                        catch (e) {
                            Log.Warn("Failed to get sequence, AP probably not enabled, will not generate vendor invoice");
                            return;
                        }
                        var invoiceNumberSeqValue = invoiceNumberSequence.GetNextValue();
                        var numberFormat = generateInvoiceFromReturnOrder ? "DemoCreditMemoNumberFormat" : "DemoInvoiceNumberFormat";
                        var invoiceNumber = Lib.Purchasing.FormatSequenceNumber(invoiceNumberSeqValue, numberFormat);
                        Log.TimeEnd("Sequence");
                        // Creates the child process
                        Log.Time("Attach DOC");
                        AttachVendorInvoice_DOC(childCF, "PO.csv");
                        Log.TimeEnd("Attach DOC");
                        Log.Time("Attach CSV");
                        AttachVendorInvoice_CSV(poData, childCF, "PO.csv", invoiceNumber, onlyDelivered, generateInvoiceFromReturnOrder);
                        Log.TimeEnd("Attach CSV");
                        Log.Time("Set vars");
                        var vars = childCF.GetUninheritedVars();
                        vars.AddValue_String("CopyPath", "SFTP2", true);
                        var ftpFolderPathIn = "In";
                        vars.AddValue_String("CopyFileName", "invoices\\" + ftpFolderPathIn + "\\" + GenerateVendorInvoiceName(invoiceNumber), true);
                        if (bDeferred) {
                            vars.AddValue_String("Deferred", "1", true);
                            var def = new Date();
                            def.setMinutes(def.getMinutes() + 1);
                            vars.AddValue_String("DeferredDateTime", Sys.Helpers.Date.Date2DBDateTime(def), true);
                        }
                        Log.TimeEnd("Set vars");
                        Log.Time("Process");
                        childCF.Process();
                        Log.TimeEnd("Process");
                        Log.Info("vendor invoice has been generated");
                    }
                    else {
                        Log.Info("copy file connector is not installed");
                    }
                }
                else {
                    Log.Info("No po data found with number: " + poNumber);
                }
                Log.TimeEnd("GenerateVendorInvoice");
            }
            Demo.GenerateVendorInvoice = GenerateVendorInvoice;
        })(Demo = Purchasing.Demo || (Purchasing.Demo = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
