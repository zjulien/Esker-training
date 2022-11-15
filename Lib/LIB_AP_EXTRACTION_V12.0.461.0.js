/* LIB_DEFINITION{
  "name": "Lib_AP_Extraction_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: helpers for getting PO header and PO lines from CT",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_PurchaseOrder_V12.0.461.0",
    "Lib_FlexibleFormToXML_V12.0.461.0",
    "Sys/Sys_Parameters",
    "Sys/Sys_Helpers_Database"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
        * @namespace Lib.AP.Extraction
        */
        var Extraction;
        (function (Extraction) {
            /**
             * @lends Lib.AP.Extraction
             */
            var DEFAULT_TYPE = "PO";
            function IsComputedOrNotEmpty(fieldName) {
                if (Data.IsComputed(fieldName) || !Data.IsNullOrEmpty(fieldName)) {
                    return true;
                }
                return false;
            }
            function GetComputedDateValue(fieldName) {
                if (IsComputedOrNotEmpty(fieldName)) {
                    return {
                        area: Data.GetArea(fieldName),
                        standardStringValue: Lib.FirstTimeRecognition.EngineBase.DateJSToDateStandardStringFormat(Data.GetValue(fieldName)),
                        dateValue: Data.GetValue(fieldName)
                    };
                }
                return null;
            }
            Extraction.GetComputedDateValue = GetComputedDateValue;
            function GetComputedAmountValue(fieldName) {
                if (IsComputedOrNotEmpty(fieldName)) {
                    return {
                        area: Data.GetArea(fieldName),
                        standardStringValue: Data.GetValue(fieldName).toString(),
                        decimalValue: Data.GetValue(fieldName),
                        decimal: true
                    };
                }
                return null;
            }
            Extraction.GetComputedAmountValue = GetComputedAmountValue;
            function GetComputedTextValue(fieldName) {
                if (IsComputedOrNotEmpty(fieldName)) {
                    return {
                        area: Data.GetArea(fieldName),
                        standardStringValue: Data.GetValue(fieldName)
                    };
                }
                return null;
            }
            Extraction.GetComputedTextValue = GetComputedTextValue;
            function SetFirstRecoValue(fieldName, value, defaultValue) {
                // Keep taught value
                if (IsComputedOrNotEmpty(fieldName)) {
                    return;
                }
                value = value ? value : defaultValue;
                if (value) {
                    if (value.area && value.standardStringValue) {
                        Data.SetValue(fieldName, value.area, value.standardStringValue);
                    }
                    else if (value.area) {
                        Data.SetValue(fieldName, value.area);
                    }
                    else if (value.standardStringValue) {
                        Data.SetValue(fieldName, value.standardStringValue);
                    }
                    else {
                        Data.SetValue(fieldName, value);
                    }
                    Data.SetComputedValueSource(fieldName, "FTR");
                }
            }
            Extraction.SetFirstRecoValue = SetFirstRecoValue;
            /* Helper for validatePORecord
                * validatePORecord checks that the data have been found in the Order Number column
                * It must be an array of objects containing:
                *	- zone: the zone where the text was found
                *	- orderNumber: the value of the order number found in the document
                */
            function ValidatePORecord(record) {
                var _a;
                // Check if record is not older than 16 months
                var recordOrderNumber = record.OrderNumber__;
                var recordDate = ((_a = record.OrderDate__) !== null && _a !== void 0 ? _a : "").split("-").map(function (x) { return parseInt(x, 10); });
                var currentDate = new Date();
                var orderDate = new Date();
                orderDate.setFullYear(recordDate[0]);
                // Month range is from 0 to 11
                orderDate.setMonth(recordDate[1] - 1);
                orderDate.setDate(recordDate[2]);
                // Add 16 months to the order date (automatic year and date adjustments)
                orderDate.setMonth(orderDate.getMonth() + 16);
                if (orderDate < currentDate) {
                    Log.Info("- Discarding PO#" + recordOrderNumber + " (older than 16 months)");
                    return false;
                }
                return true;
            }
            Extraction.ValidatePORecord = ValidatePORecord;
            function GetOrderNumbers(orderNumbersCandidates) {
                var candidateIdx = 0;
                // remove duplicates
                var orderNumbers = [];
                while (candidateIdx < orderNumbersCandidates.length) {
                    var orderNumberCandidate = orderNumbersCandidates[candidateIdx].standardStringValue;
                    if (orderNumberCandidate && orderNumbers.indexOf(orderNumberCandidate) === -1) {
                        orderNumbers.push(orderNumberCandidate);
                        var extendedOrderNumber = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.PurchaseOrder.GetExtendedPOSearchCriteria", orderNumberCandidate);
                        if (Array.isArray(extendedOrderNumber)) {
                            for (var _i = 0, extendedOrderNumber_1 = extendedOrderNumber; _i < extendedOrderNumber_1.length; _i++) {
                                var extNum = extendedOrderNumber_1[_i];
                                orderNumbers.push(extNum);
                            }
                        }
                        else if (extendedOrderNumber) {
                            orderNumbers.push(extendedOrderNumber);
                        }
                        var availableDocumentCultures = Lib.AP.GetAvailableDocumentCultures();
                        for (var _a = 0, availableDocumentCultures_1 = availableDocumentCultures; _a < availableDocumentCultures_1.length; _a++) {
                            var culture = availableDocumentCultures_1[_a];
                            if (Sys.Helpers.String.ContainsFullWidthCharacters(orderNumberCandidate, culture)) {
                                var halfwidthCandidate = {
                                    area: orderNumbersCandidates[candidateIdx].area,
                                    standardStringValue: Sys.Helpers.String.ConvertFullWidthToHalfWidthCharacters(orderNumberCandidate, culture)
                                };
                                orderNumbersCandidates.splice(candidateIdx + 1, 0, halfwidthCandidate);
                                break;
                            }
                        }
                        candidateIdx++;
                    }
                    else {
                        orderNumbersCandidates.splice(candidateIdx, 1);
                    }
                }
                return orderNumbers;
            }
            Extraction.GetOrderNumbers = GetOrderNumbers;
            function FillLinesFromGRItems(poItemRecord, orderNumber, type, buyer, receiver, diffInv, customPOHeaderValues) {
                var poItemVars = poItemRecord.GetVars();
                var lineNumber = poItemVars.GetValue_String("ItemNumber__", 0);
                var query = Process.CreateQuery();
                query.Reset();
                query.SetAttributesList("*");
                query.SetSpecificTable("P2P - Goods receipt - Items__");
                var filter = "&(!(Status__=Canceled))(OrderNumber__=".concat(orderNumber, ")(LineNumber__=").concat(lineNumber, ")");
                filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                query.SetFilter(filter);
                query.SetSortOrder("GRNumber__ ASC");
                if (query.MoveFirst()) {
                    var bLineAdded = false;
                    var record = query.MoveNextRecord();
                    while (record) {
                        var grItemVars = record.GetVars();
                        if (Lib.AP.PurchaseOrder.FillLine(poItemVars, grItemVars, orderNumber, null, type, buyer, receiver, diffInv, customPOHeaderValues)) {
                            bLineAdded = true;
                        }
                        record = query.MoveNextRecord();
                    }
                    return bLineAdded;
                }
                return false;
            }
            Extraction.FillLinesFromGRItems = FillLinesFromGRItems;
            /**
            * Adds PO Lines from the reference PO Item (in GRIV mode, drills down to GR Items)
            */
            function FillLinesFromPOItem(record, orderNumber, type, buyer, receiver, diffInv, customPOHeaderVars) {
                var poItemVars = record.GetVars();
                if (Lib.P2P.IsGRIVEnabledGlobally()) {
                    Lib.AP.Extraction.FillLinesFromGRItems(record, orderNumber, type, buyer, receiver, diffInv, customPOHeaderVars);
                }
                else if (Lib.P2P.IsGRIVEnabledByLine()) {
                    var isLineGRIV = poItemVars.GetValue_String("GRIV__", 0);
                    if (isLineGRIV === "1") {
                        Lib.AP.Extraction.FillLinesFromGRItems(record, orderNumber, type, buyer, receiver, diffInv, customPOHeaderVars);
                    }
                    else {
                        Lib.AP.PurchaseOrder.FillLine(poItemVars, null, orderNumber, null, type, buyer, receiver, diffInv, customPOHeaderVars);
                    }
                }
                else {
                    Lib.AP.PurchaseOrder.FillLine(poItemVars, null, orderNumber, null, type, buyer, receiver, diffInv, customPOHeaderVars);
                }
            }
            Extraction.FillLinesFromPOItem = FillLinesFromPOItem;
            /**
            * Query the CT AP - Purchase order - Items__ to find line items and fill lineitems
            */
            function FillLinesFromPO(orderNumber, type, buyer, receiver, diffInv) {
                if (!type) {
                    type = DEFAULT_TYPE;
                }
                var query = Process.CreateQuery();
                query.Reset();
                query.SetAttributesList("*");
                query.SetSpecificTable("AP - Purchase order - Items__");
                var filter = "OrderNumber__=" + orderNumber;
                filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                filter = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.Reconciliation.GetExtendedFillLinesFromPOCriteria", filter, orderNumber, type, buyer, receiver, diffInv) || filter;
                query.SetFilter(filter);
                query.SetSortOrder("ItemNumber__ ASC");
                if (query.MoveFirst()) {
                    var customPOHeaderVars = fetchCustomPOHeaderVars();
                    var bRecordsFound = false;
                    var record = query.MoveNextRecord();
                    while (record) {
                        bRecordsFound = true;
                        Lib.AP.Extraction.FillLinesFromPOItem(record, orderNumber, type, buyer, receiver, diffInv, customPOHeaderVars);
                        record = query.MoveNextRecord();
                    }
                    return bRecordsFound;
                }
                return false;
            }
            Extraction.FillLinesFromPO = FillLinesFromPO;
            function fetchCustomPOHeaderVars() {
                var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                if (customDimensions && customDimensions.poHeader) {
                    var attributes = "";
                    for (var _i = 0, _a = customDimensions.poHeader; _i < _a.length; _i++) {
                        var header = _a[_i];
                        attributes += "".concat(attributes).concat(header.nameInTable, ",");
                    }
                    attributes = attributes.slice(0, -1);
                    var query = Process.CreateQuery();
                    query.Reset();
                    query.SetAttributesList(attributes);
                    query.SetSpecificTable("AP - Purchase order - Headers__");
                    var filter = "OrderNumber__=".concat(Data.GetValue("OrderNumber__"));
                    filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    filter = filter.AddVendorNumberFilter(Data.GetValue("VendorNumber__"));
                    query.SetFilter(filter);
                    if (query.MoveFirst()) {
                        var record = query.MoveNextRecord();
                        if (!record) {
                            Log.Warn("No PO header fetched with custom values");
                        }
                        else if (query.MoveNextRecord()) {
                            Log.Warn("More than one PO Header fetched with custom values");
                        }
                        else {
                            return record.GetVars();
                        }
                    }
                }
                return null;
            }
            var FillLinesInfo = /** @class */ (function () {
                function FillLinesInfo() {
                    this.buyer = "";
                    this.receiver = "";
                    this.vendorNumber = "";
                }
                return FillLinesInfo;
            }());
            function FillLinesAndHighlightFromCandidate(orderNumber, orderNumberCandidate, type, info, searchVendorNumber) {
                var HIGHLIGHTCOLOR_BORDER = 0xFFFFFF;
                var HIGHLIGHTCOLOR_BACKGROUND = 0xFFCC00;
                if (info.invoiceType) {
                    Data.SetValue("InvoiceType__", info.invoiceType);
                    type = info.invoiceType === Lib.AP.InvoiceType.PO_INVOICE_AS_FI ? Lib.P2P.LineType.POGL : Lib.P2P.LineType.PO;
                }
                // Add order number
                Lib.AP.AddOrderNumber(orderNumber, orderNumberCandidate.area);
                // Add corresponding line items
                Lib.AP.Extraction.FillLinesFromPO(orderNumber, type, info.buyer, info.receiver, info.diffInv);
                // Highlight order numbers on the document
                if (orderNumberCandidate.area && !Data.GetValue("VendorNumber__") && info.vendorNumber) {
                    //Vendor found with this PO
                    Log.Info("Set vendor (" + info.vendorNumber + ") according to PO number: " + orderNumber);
                    Data.SetValue("VendorNumber__", info.vendorNumber);
                    searchVendorNumber();
                    orderNumberCandidate.area.Highlight(true, HIGHLIGHTCOLOR_BACKGROUND, HIGHLIGHTCOLOR_BORDER, "VendorNumber__");
                    orderNumberCandidate.area.Highlight(true, HIGHLIGHTCOLOR_BACKGROUND, HIGHLIGHTCOLOR_BORDER, "VendorName__");
                }
            }
            Extraction.FillLinesAndHighlightFromCandidate = FillLinesAndHighlightFromCandidate;
            function GetPOInvoiceType(IsLocalPO) {
                if (!Lib.AP.IsSupportNonERPOrder()) {
                    return Lib.AP.InvoiceType.PO_INVOICE;
                }
                if (IsLocalPO && Sys.Helpers.String.ToBoolean(IsLocalPO)) {
                    return Lib.AP.InvoiceType.PO_INVOICE_AS_FI;
                }
                return Lib.AP.InvoiceType.PO_INVOICE;
            }
            Extraction.GetPOInvoiceType = GetPOInvoiceType;
            /**
            * Go through all order found in the document to fill table
            * return true if a PO have been found and matches an existing po
            */
            function FillPOFromCandidates(records, orderNumbersCandidates, searchVendorNumber, type) {
                if (!records) {
                    Log.Info("No valid purchase order found in AP - Purchase order - Headers...");
                    return false;
                }
                var findPO = false;
                var candidateIdx = 0;
                // Compare PO extracted from the document to the ones from the database
                while (candidateIdx < orderNumbersCandidates.length) {
                    var orderNumberCandidate = orderNumbersCandidates[candidateIdx];
                    var orderNumber = orderNumberCandidate.standardStringValue;
                    var foundDocumentPO = false;
                    var info = new FillLinesInfo();
                    for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
                        var record = records_1[_i];
                        var queryOrderNumber = record.OrderNumber__;
                        info.vendorNumber = record.VendorNumber__;
                        info.buyer = record.Buyer__;
                        info.receiver = record.Receiver__;
                        info.diffInv = record.DifferentInvoicingParty__;
                        info.invoiceType = GetPOInvoiceType(record.IsLocalPO__);
                        if (orderNumber === queryOrderNumber) {
                            foundDocumentPO = true;
                            Lib.AP.Extraction.FillLinesAndHighlightFromCandidate(orderNumber, orderNumberCandidate, type, info, searchVendorNumber);
                            break;
                        }
                        var extendedOrderNumber = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.PurchaseOrder.GetExtendedPOSearchCriteria", orderNumber);
                        if (Array.isArray(extendedOrderNumber)) {
                            extendedOrderNumber = extendedOrderNumber.join("|");
                        }
                        if (extendedOrderNumber && queryOrderNumber.match(new RegExp(extendedOrderNumber.replace("*", ".*")))) {
                            foundDocumentPO = true;
                            Lib.AP.Extraction.FillLinesAndHighlightFromCandidate(queryOrderNumber, orderNumberCandidate, type, info, searchVendorNumber);
                        }
                    }
                    // Discard incorrect document PO block or highlight correct ones
                    if (foundDocumentPO) {
                        findPO = true;
                        candidateIdx++;
                    }
                    else {
                        Log.Info("Discarding PO#" + orderNumberCandidate.standardStringValue + " (found on document, but not found or not valid in reference data)");
                        orderNumbersCandidates.splice(candidateIdx, 1);
                    }
                }
                if (!findPO) {
                    Log.Info("All PO found in AP - Purchase order - Headers were discarded...");
                }
                return findPO;
            }
            Extraction.FillPOFromCandidates = FillPOFromCandidates;
            function BuildPOHeaderFilter(orderNumbers, ERPConnected) {
                var _a;
                if (!orderNumbers || orderNumbers.length === 0) {
                    Log.Warn("POHeaderBuildFilter function call with wrong order number list: ".concat(JSON.stringify(orderNumbers)));
                    return "invalid filter";
                }
                var hasInvalidOrdernumber = false;
                var criteria = [];
                for (var _i = 0, orderNumbers_1 = orderNumbers; _i < orderNumbers_1.length; _i++) {
                    var orderNumber = orderNumbers_1[_i];
                    if (orderNumber.length === 0) {
                        hasInvalidOrdernumber = true;
                        break;
                    }
                    criteria.push("(OrderNumber__=".concat(orderNumber, ")"));
                }
                if (criteria.length === 0 || hasInvalidOrdernumber) {
                    Log.Warn("POHeaderBuildFilter function call with wrong order number list: ".concat(JSON.stringify(orderNumbers)));
                    return "invalid filter";
                }
                var filter = "";
                if (criteria.length > 1) {
                    filter = (_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, criteria).toString();
                }
                else {
                    filter += criteria;
                }
                if (ERPConnected) {
                    filter = filter.AddNotCreatedInERPFilter();
                }
                var companyCode = Data.GetValue("CompanyCode__");
                if (companyCode && companyCode.length > 0) {
                    filter = filter.AddCompanyCodeFilter(companyCode);
                }
                return filter;
            }
            Extraction.BuildPOHeaderFilter = BuildPOHeaderFilter;
            function ValidateOrdersAndFillPO(orderNumbersCandidates, searchVendorNumber, type, ERPConnected) {
                if (Data.IsComputed("OrderNumber__")) {
                    Log.Info("Order number was taught, fill in line items from reference table...");
                    var orderNumbersSearch = [];
                    var orderNumber = Lib.AP.GetFirstOrderNumber();
                    orderNumbersSearch.push(orderNumber);
                    var availableDocumentCultures = Lib.AP.GetAvailableDocumentCultures();
                    for (var _i = 0, availableDocumentCultures_2 = availableDocumentCultures; _i < availableDocumentCultures_2.length; _i++) {
                        var culture = availableDocumentCultures_2[_i];
                        if (Sys.Helpers.String.ContainsFullWidthCharacters(orderNumber, culture)) {
                            var halfWidthPoNumber = Sys.Helpers.String.ConvertFullWidthToHalfWidthCharacters(orderNumber, culture);
                            orderNumbersSearch.push(halfWidthPoNumber);
                            break;
                        }
                    }
                    var extendedPOSearch = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.PurchaseOrder.GetExtendedPOSearchCriteria", orderNumber);
                    if (Array.isArray(extendedPOSearch)) {
                        orderNumbersSearch.push.apply(orderNumbersSearch, extendedPOSearch);
                    }
                    else if (extendedPOSearch) {
                        orderNumbersSearch.push(extendedPOSearch);
                    }
                    var filter = Lib.AP.Extraction.BuildPOHeaderFilter(orderNumbersSearch, true);
                    if (filter === "invalid filter") {
                        return false;
                    }
                    var recordList_2 = [];
                    Sys.GenericAPI.Query(Lib.P2P.TableNames.POHeaders, filter, ["OrderNumber__", "Buyer__", "Receiver__", "DifferentInvoicingParty__", "IsLocalPO__"], function (result, error) {
                        if (!error && result && result.length > 0) {
                            recordList_2 = result;
                        }
                    }, "OrderNumber__ ASC");
                    var matchingPONumber = [];
                    var invoiceType = null;
                    var findPO = false;
                    for (var _a = 0, recordList_1 = recordList_2; _a < recordList_1.length; _a++) {
                        var record = recordList_1[_a];
                        var masterDataPONumber = record.OrderNumber__;
                        var buyer = record.Buyer__;
                        var receiver = record.Receiver__;
                        var diffInv = record.DifferentInvoicingParty__;
                        invoiceType = GetPOInvoiceType(record.IsLocalPO__);
                        type = type || invoiceType === Lib.AP.InvoiceType.PO_INVOICE_AS_FI ? Lib.P2P.LineType.POGL : Lib.P2P.LineType.PO;
                        findPO = Lib.AP.Extraction.FillLinesFromPO(masterDataPONumber, type, buyer, receiver, diffInv) || findPO;
                        if (masterDataPONumber === orderNumber) {
                            // strict matching, only add the matching PO
                            matchingPONumber.length = 0;
                            break;
                        }
                        else {
                            // extended matching, continue adding POs
                            matchingPONumber.push(masterDataPONumber);
                        }
                    }
                    if (matchingPONumber.length > 0) {
                        var orderNumberArea = Data.GetArea("OrderNumber__");
                        Data.SetValue("OrderNumber__", orderNumberArea, matchingPONumber.join(","));
                    }
                    if (findPO) {
                        Data.SetValue("InvoiceType__", invoiceType);
                    }
                    return findPO;
                }
                orderNumbersCandidates = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.Reconciliation.GetCustomOrderNumberCandidates", orderNumbersCandidates) || orderNumbersCandidates;
                if (orderNumbersCandidates && orderNumbersCandidates.length > 0) {
                    var orderNumbers = Lib.AP.Extraction.GetOrderNumbers(orderNumbersCandidates);
                    if (!orderNumbers || orderNumbers.length === 0) {
                        Log.Info("No valid purchase order found in AP - Purchase order - Headers");
                        return false;
                    }
                    var orderNumbersToSearch = [];
                    for (var _b = 0, orderNumbers_2 = orderNumbers; _b < orderNumbers_2.length; _b++) {
                        var orderNumber = orderNumbers_2[_b];
                        if (orderNumber.length >= 2 && orderNumbersToSearch.indexOf(orderNumber) === -1) {
                            orderNumbersToSearch.push(orderNumber);
                        }
                    }
                    if (orderNumbersToSearch.length === 0) {
                        Log.Warn("No order number to search");
                        return false;
                    }
                    var filter = Lib.AP.Extraction.BuildPOHeaderFilter(orderNumbers, ERPConnected);
                    if (filter === "invalid filter") {
                        return false;
                    }
                    var orderNumberList_2 = [];
                    Sys.GenericAPI.Query(Lib.P2P.TableNames.POHeaders, filter, ["*"], function (result, error) {
                        if (!error && result && result.length > 0) {
                            orderNumberList_2 = result;
                        }
                    });
                    var validatedOrderNumberList = [];
                    for (var _c = 0, orderNumberList_1 = orderNumberList_2; _c < orderNumberList_1.length; _c++) {
                        var record = orderNumberList_1[_c];
                        if (Lib.AP.Extraction.ValidatePORecord(record)) {
                            validatedOrderNumberList.push(record);
                        }
                    }
                    if (validatedOrderNumberList.length === 0) {
                        return false;
                    }
                    return Lib.AP.Extraction.FillPOFromCandidates(validatedOrderNumberList, orderNumbersCandidates, searchVendorNumber, type);
                }
                Log.Info("No orderNumber found on document...");
                return false;
            }
            Extraction.ValidateOrdersAndFillPO = ValidateOrdersAndFillPO;
            // update amount of first line item for NON-PO invoice
            function FillGLLines() {
                var table = Data.GetTable("LineItems__");
                table.AddItem(false);
                var newItem = table.GetItem(table.GetItemCount() - 1);
                // Amount__
                if (Data.GetArea("ExtractedNetAmount__")) {
                    newItem.SetValue("Amount__", Data.GetArea("ExtractedNetAmount__"), Data.GetValue("ExtractedNetAmount__"));
                }
                else {
                    newItem.SetValue("Amount__", Data.GetValue("ExtractedNetAmount__"));
                }
                // LineType__
                newItem.SetValue("LineType__", Lib.P2P.LineType.GL);
                return true;
            }
            Extraction.FillGLLines = FillGLLines;
            function UpdateLinesWithTaxCodeLookup() {
                var lineItems = Data.GetTable("LineItems__");
                var nbLines = lineItems.GetItemCount();
                if (Data.IsNullOrEmpty("InvoiceAmount__") && nbLines <= 0) {
                    return false;
                }
                // Sum lines amounts and check if there is no tax code set
                var netAmount = 0;
                for (var i = 0; i < nbLines; i++) {
                    var lineItem = lineItems.GetItem(i);
                    netAmount += lineItem.GetValue("Amount__");
                    if (lineItem.GetValue("TaxCode__")) {
                        // At least one line with a tax code set --> do not lookup
                        return false;
                    }
                }
                var invoiceAmount = Data.GetValue("InvoiceAmount__");
                if (invoiceAmount && netAmount) {
                    Log.Info("Trying to predict tax code");
                    var taxCode = null;
                    var taxRate = null;
                    var taxRateLookup = Sys.Decimal.div(Sys.Decimal.sub(invoiceAmount, netAmount), netAmount);
                    // Tax rate precision is 3 digits in database
                    // Lookup to 2 digits precision to avoid rounding issues
                    var taxRateUpperBound = Sys.Decimal.div(Sys.Decimal.ceil(Sys.Decimal.mul(taxRateLookup, 10000)), 100);
                    var taxRateLowerBound = Sys.Decimal.div(Sys.Decimal.floor(Sys.Decimal.mul(taxRateLookup, 10000)), 100);
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.SetAttributesList("TaxCode__,TaxRate__");
                    query.SetSpecificTable("AP - Tax codes__");
                    var filter = "&(TaxRate__>=".concat(taxRateLowerBound.toNumber(), ")(TaxRate__<=").concat(taxRateUpperBound.toNumber(), ")");
                    filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    query.SetFilter(filter);
                    query.SetSortOrder("TaxRate__ ASC");
                    if (query.MoveFirst()) {
                        var record = query.MoveNextRecord();
                        if (record) {
                            taxCode = record.GetVars().GetValue_String("TaxCode__", 0);
                            taxRate = record.GetVars().GetValue_Double("TaxRate__", 0);
                        }
                    }
                    if (taxCode) {
                        Log.Info("Found corresponding tax code in master data : ".concat(taxCode));
                        // Set tax code on all line items with
                        for (var i = 0; i < nbLines; i++) {
                            var lineItem = lineItems.GetItem(i);
                            lineItem.SetValue("TaxCode__", taxCode);
                            lineItem.SetValue("TaxRate__", taxRate);
                            lineItem.SetComputedValueSource("TaxCode__", "FTR");
                            lineItem.SetWarning("TaxCode__", "_Confirm this is the correct tax code");
                        }
                        return true;
                    }
                    Log.Info("No tax code in master data matches tax rate ".concat(taxRateLookup));
                }
                return false;
            }
            Extraction.UpdateLinesWithTaxCodeLookup = UpdateLinesWithTaxCodeLookup;
            function DetermineSourceTypeFromRecord(rec) {
                if (rec) {
                    var vars = rec.GetUninheritedVars();
                    var sendType = vars.GetValue_String("SendType", 0);
                    if (sendType && sendType.indexOf("ISM") !== -1) {
                        Data.SetValue("ReceptionMethod__", "Email");
                        return true;
                    }
                }
                return false;
            }
            Extraction.DetermineSourceTypeFromRecord = DetermineSourceTypeFromRecord;
            // Determine Reception method
            // When submitted from the vendor portal, the value is already set by the customer invoice process
            // When submitted by email we have to set the value
            // Otherwise, the default value for the combo box is already set to Other/Scan
            function DetermineSourceTypeFromOriginalJobID() {
                // ReceptionMethod__ already inherited from Customer invoice
                if (Data.GetValue("ReceptionMethod__") === "Vendor portal" && Data.GetValue("PortalRuidEx__")) {
                    return;
                }
                // Query the Job corresponding to the record OriginalJobId
                var OriginalJobID = Data.GetValue("OriginalJobID");
                if (OriginalJobID) {
                    var filter = "(&(JobID=".concat(OriginalJobID, "))");
                    var attributes = "SendType";
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.SetSpecificTable("ISM");
                    query.SetFilter(filter);
                    query.SetAttributesList(attributes);
                    if (query.MoveFirst()) {
                        Lib.AP.Extraction.DetermineSourceTypeFromRecord(query.MoveNext());
                    }
                }
            }
            Extraction.DetermineSourceTypeFromOriginalJobID = DetermineSourceTypeFromOriginalJobID;
            function DetermineOwner() {
                // Query the Job corresponding to the record SourceRUID
                var SourceRUID = Data.GetValue("SourceRUID");
                var fromPortalOrUserMade = false;
                if (SourceRUID) {
                    var filter = "(&(RUIDEX=".concat(SourceRUID, "))");
                    var attributes = "msn";
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.SetSpecificTable("CDNAME#Customer invoice");
                    query.SetFilter(filter);
                    query.SetAttributesList(attributes);
                    if (query.MoveFirst() && query.MoveNext()) {
                        //From Portal => Customer Invoice
                        fromPortalOrUserMade = true;
                    }
                }
                else {
                    //No SourceRUID : CreatedFromWeb
                    fromPortalOrUserMade = true;
                }
                var forwardAutoToReviewerEnabled = Sys.Parameters.GetInstance("AP").GetParameter("AutomaticallyForwardNonPoInvoiceToReviewer") === "1";
                var forwardToCorrectAP = Variable.GetValueAsString("forwardToCorrectAP");
                if (fromPortalOrUserMade || forwardAutoToReviewerEnabled || forwardToCorrectAP === "1") {
                    var userExitDeterminedOwner = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.DetermineVendorInvoiceOwner");
                    var DefaultAPClerk = Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("AP").GetParameter("DefaultAPClerk", ""));
                    var forwardTo = userExitDeterminedOwner ? userExitDeterminedOwner : DefaultAPClerk;
                    if (forwardTo) {
                        Log.Info("Forwarding message to '".concat(forwardTo, "' (reason: ").concat(userExitDeterminedOwner ? "DetermineVendorInvoiceOwner user exit" : "DefaultAPClerk parameter", ")"));
                    }
                    else {
                        forwardTo = Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("AP").GetParameter("VendorInvoiceOwner"));
                        Log.Info("Forwarding message to '".concat(forwardTo, "' (reason: VendorInvoiceOwner parameter)"));
                    }
                    var currentOwnerId = Data.GetValue("OwnerId");
                    // Only forward if forwardTo != current ownerid
                    if ((!currentOwnerId && forwardTo) ||
                        (forwardTo && currentOwnerId && currentOwnerId.toLowerCase().indexOf(forwardTo.toLowerCase()) === -1)) {
                        Process.Forward(forwardTo);
                    }
                    Process.SetRight(forwardTo, "read");
                }
                else {
                    // Always create the right for the current user in case of touchless posting
                    Process.SetRight(Data.GetValue("OwnerId"), "read");
                }
            }
            Extraction.DetermineOwner = DetermineOwner;
            function FillVendorContactEmail() {
                var json = Lib.AP.VendorPortal.GetParametersFromDataInvoice(Data);
                var vendorContact = Lib.AP.VendorPortal.GetVendorUser(json);
                if (vendorContact) {
                    Data.SetValue("VendorContactEmail__", vendorContact.GetValue("EmailAddress"));
                }
            }
            Extraction.FillVendorContactEmail = FillVendorContactEmail;
            /**
             * Entry point for the extraction of data from a QRCode before the FTR applied
             */
            function ExtractQRCode() {
                if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.AllowFapiaoQRCodeExtraction")) {
                    ExtractFapiaoQRCode();
                }
                else {
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.ExtractQRCode");
                }
            }
            Extraction.ExtractQRCode = ExtractQRCode;
            /**
             * This function will try to find a QR Code at top left by using OCR
             * If this match a QRCode, try to extract the following informations:
             *   - Invoice Number
             *   - Invoice Date
             *   - Net amount
             * Be sure to have the following settings in your process recognition parameters
             * Advanced paramaters: ?allowed-bar-code=26
             */
            function ExtractFapiaoQRCode() {
                var qrCodeArea = Document.GetArea(0, 0, 0, Document.GetPageWidth(0) / 2, Document.GetPageHeight(0) / 2, { "area-filling-method": "2d-barcode-2" }, "Nuance190");
                if (qrCodeArea && qrCodeArea.page !== -1) {
                    var qrCodeRawData = qrCodeArea.toString();
                    Log.Info("Fapiao QR Code found : " + qrCodeRawData);
                    var qrCodeDataArray = qrCodeRawData ? qrCodeRawData.split(",") : [];
                    if (qrCodeDataArray && qrCodeDataArray.length === 9) {
                        // Data example
                        // dummy dummy fapiaoID    invocie number  Net amount Invoice date dummy
                        // 01    01    3300202130  23153060        271.20     20201120     2497
                        var invoiceNumber = qrCodeDataArray[3], netAmount = qrCodeDataArray[4], invoiceDate = qrCodeDataArray[5];
                        if (invoiceNumber) {
                            Data.SetValue("InvoiceNumber__", invoiceNumber);
                            Data.SetComputedValueSource("InvoiceNumber__", "QRCode");
                        }
                        if (netAmount) {
                            Data.SetValue("ExtractedNetAmount__", netAmount);
                            Data.SetComputedValueSource("ExtractedNetAmount__", "QRCode");
                        }
                        if (invoiceDate) {
                            Data.SetValue("InvoiceDate__", Sys.Helpers.Date.ShortDateStringToDate(invoiceDate));
                            Data.SetComputedValueSource("InvoiceDate__", "QRCode");
                        }
                    }
                }
            }
            Extraction.ExtractFapiaoQRCode = ExtractFapiaoQRCode;
            /**
            * Regroup the methods used to manage the mapping between an extracted value and the business value
            * @namespace Lib.AP.Extraction.CrossReference
            */
            var CrossReference;
            (function (CrossReference) {
                CrossReference.externalVariableName = "OriginalExtractedValues";
                CrossReference.customTableName = "AP - Extraction mapping__";
                /**
                * The description of the mapping between an extracted value and the business value
                * @typedef {object} Lib.AP.Extraction.CrossReference.ExtractionMapping
                * @property {string} companyCode
                * @property {string} formField
                * @property {object} extractedValue
                * @property {object} businessValue
                */
                var ExtractionMapping = /** @class */ (function () {
                    function ExtractionMapping(companyCode, formField, extractedValue, businessValue) {
                        this.companyCode = companyCode;
                        this.formField = formField;
                        this.extractedValue = extractedValue;
                        this.businessValue = businessValue;
                    }
                    return ExtractionMapping;
                }());
                CrossReference.ExtractionMapping = ExtractionMapping;
                /**
                * Field mapped during the extraction
                * @type {Lib.AP.Extraction.CrossReference.ExtractionMapping[]}
                */
                CrossReference.map = [];
                /**
                * Load the map from the external variable
                */
                function Load() {
                    var originalExtractedValues = Variable.GetValueAsString(CrossReference.externalVariableName);
                    if (originalExtractedValues) {
                        CrossReference.map = JSON.parse(originalExtractedValues);
                    }
                }
                CrossReference.Load = Load;
                /**
                * Search in the MRU if a functionnal value exists based on the extracted value
                */
                function GetERPValue(companyCode, formField, ediValue) {
                    var businessValue = null;
                    var existantMap;
                    var query = Process.CreateQueryAsProcessAdmin();
                    var filter = "(&".concat(companyCode ? "(CompanyCode__=".concat(companyCode, ")") : "", "(FormField__=").concat(formField, ")(ExtractedValue__=").concat(ediValue, "))");
                    var businessValueAttribute = "BusinessValue__";
                    query.Reset();
                    query.SetSpecificTable(CrossReference.customTableName);
                    query.SetFilter(filter);
                    query.SetAttributesList(businessValueAttribute);
                    if (query.MoveFirst()) {
                        var record = query.MoveNext();
                        if (record) {
                            var vars = record.GetUninheritedVars();
                            businessValue = vars.GetValue_String(businessValueAttribute, 0);
                        }
                    }
                    if (CrossReference.map && CrossReference.map.length > 0) {
                        existantMap = Sys.Helpers.Array.Reduce(CrossReference.map, function (accumulator, oneMap) {
                            if (!accumulator
                                && oneMap.companyCode === companyCode
                                && oneMap.formField === formField
                                && oneMap.extractedValue === ediValue) {
                                return oneMap;
                            }
                            return accumulator;
                        }, null);
                    }
                    if (existantMap) {
                        existantMap.businessValue = businessValue;
                    }
                    else {
                        CrossReference.map.push(new ExtractionMapping(companyCode, formField, ediValue, businessValue));
                    }
                    return businessValue;
                }
                CrossReference.GetERPValue = GetERPValue;
                /**
                * Save on the record the current state of the extraction mapping
                */
                function SaveEDIValues() {
                    Variable.SetValueAsString(CrossReference.externalVariableName, JSON.stringify(CrossReference.map));
                }
                CrossReference.SaveEDIValues = SaveEDIValues;
                /**
                * Save the link betweek extracted and business values
                */
                function SaveERPValues() {
                    Lib.AP.Extraction.CrossReference.Load();
                    if (CrossReference.map && CrossReference.map.length > 0) {
                        var currentCompanyCode = Data.GetValue("CompanyCode__");
                        for (var i = 0; i < CrossReference.map.length; i++) {
                            var mappedValue = CrossReference.map[i];
                            //Update the companyCode if it was changed
                            if (mappedValue.formField.toLowerCase() !== "companycode__") {
                                mappedValue.companyCode = currentCompanyCode;
                            }
                            // Update the business value if one was set or updated
                            if (Data.GetValue(mappedValue.formField) && mappedValue.businessValue !== Data.GetValue(mappedValue.formField)) {
                                mappedValue.businessValue = Data.GetValue(mappedValue.formField);
                                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", mappedValue.companyCode || ""), Sys.Helpers.LdapUtil.FilterEqual("FormField__", mappedValue.formField), Sys.Helpers.LdapUtil.FilterEqual("ExtractedValue__", mappedValue.extractedValue)).toString();
                                var attributes = [
                                    { "name": "CompanyCode__", "value": mappedValue.companyCode },
                                    { "name": "FormField__", "value": mappedValue.formField },
                                    { "name": "ExtractedValue__", "value": mappedValue.extractedValue },
                                    { "name": "BusinessValue__", "value": mappedValue.businessValue }
                                ];
                                Sys.Helpers.Database.AddOrModifyTableRecord(CrossReference.customTableName, filter, attributes);
                            }
                        }
                    }
                }
                CrossReference.SaveERPValues = SaveERPValues;
            })(CrossReference = Extraction.CrossReference || (Extraction.CrossReference = {}));
        })(Extraction = AP.Extraction || (AP.Extraction = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
