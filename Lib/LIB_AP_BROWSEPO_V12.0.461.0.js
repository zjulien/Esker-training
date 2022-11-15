/* LIB_DEFINITION{
  "name": "LIB_AP_BrowsePO_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Local purchase orders browser",
  "require": [
    "Sys/Sys_Helpers_Browse",
    "Sys/Sys_Helpers_Promise",
    "Lib_AP_V12.0.461.0",
    "Lib_ERP_Invoice_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var BrowsePO;
        (function (BrowsePO) {
            function BrowsePurchaseOrders(mainControl, AddLineItem, CleanUpLineItems, GetTaxRateForItemList, FormLayoutHelper) {
                mainControl.Wait(true);
                var displayGRFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowsePO.Generic.BrowseAtGoodReceiptLevel");
                if (typeof displayGRFields === "boolean") {
                    displayGRFields = displayGRFields && Lib.P2P.IsGRIVEnabled();
                }
                else {
                    displayGRFields = false;
                }
                var isIE = navigator.appVersion.indexOf("Trident/") > -1 || navigator.appVersion.indexOf("Edge") > -1;
                var defaultDialogOptions = {
                    windowed: !isIE,
                    top: 100,
                    left: 100,
                    innerWidth: 1400,
                    innerHeight: 710
                };
                var dialogOptions = null;
                var browseTitle = "_Purchase orders";
                var orderItemsTabLabel = "_Purchase order items";
                var curOrderItemsTabLabel = orderItemsTabLabel;
                var headersTableName = "AP - Purchase order - Headers__";
                var itemsTableName = "AP - Purchase order - Items__";
                var goodsReceiptTableName = "P2P - Goods receipt - Items__";
                var searchControlFocused = false;
                var dialog = null;
                var dialogResults = null;
                var dialogItems = null;
                // Number of records per Page
                var rowcountperpage = 10;
                // Maximum of records retrieved by the query
                var rowcount = 100;
                // To perform a search when the browse dialog is opening
                var searchAtOpening = true;
                if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowsePO.Common.RunPOSearchOnLoad") === false) {
                    searchAtOpening = false;
                }
                // To avoid redundant queries at opening
                var callbackResult;
                var addedItems = null;
                var selectedOrderHeaderData;
                var recordAdded = 0;
                // Columns and fields configuration
                // poHeadersLineLevelFields: header fields that will not be put at line item level because the data is carried also by the po item table
                var poHeadersDisplayedFields = [];
                // poHeadersLineLevelFields is the headers fields that will be put at line item level
                var poHeadersLineLevelFields = [];
                var poItemsFields = [];
                var grItemsFields = [];
                var poDetailsColumns = [];
                var poHeadersColumns = [];
                initPOHeadersColumns();
                initPOHeadersDisplayedFields();
                initPOHeadersLineLevelFields();
                // concat custom fields to line level fields to be added to the po items
                concatCustomDimensions("poHeader", poHeadersColumns, poHeadersLineLevelFields);
                initPODetailsColumns();
                initPOItemsFields();
                concatBrowseExtraFields(headersTableName, poHeadersColumns, poHeadersLineLevelFields);
                concatCustomDimensions("poItems", poDetailsColumns, poItemsFields);
                concatBrowseExtraFields(itemsTableName, poDetailsColumns, poItemsFields);
                if (Lib.P2P.IsGRIVEnabled()) {
                    initGRItemsFields();
                    concatCustomDimensions("grItems", poDetailsColumns, grItemsFields);
                    concatBrowseExtraFields(goodsReceiptTableName, poDetailsColumns, grItemsFields);
                }
                // Search criterion configuration
                var CompCodeFilter = { id: "CompCodeFilter__", label: "_CompanyCode", type: "STR", required: true, toUpper: false, visible: false, filterId: "CompanyCode__", filterType: "EQUALSOREMPTY", defaultValue: Controls.CompanyCode__.GetValue() };
                var searchCriterias = [];
                var defaultVendorNumber = Lib.AP.GetInvoiceDocument().GetDefaultVendorNumberForPOBrowse();
                searchCriterias.push({ id: "VendorNumberFilter__", label: "_Vendor number", type: "STR", required: false, toUpper: false, visible: true, filterId: "VendorNumber__", filterType: "EQUALS", defaultValue: defaultVendorNumber, width: 264 });
                searchCriterias.push(CompCodeFilter);
                searchCriterias.push({ id: "OrderNumberFilter__", label: "_Order number", type: "STR", required: false, formatter: orderNumberFormatter, toUpper: false, visible: true, filterId: "OrderNumber__", filterType: "IN", defaultValue: Controls.OrderNumber__.GetValue(), width: 264 });
                searchCriterias.push({ id: "OrderDateFromFilter__", label: "_From", type: "DATE", required: false, toUpper: false, visible: true, filterId: "OrderDate__", filterType: "GREATER", defaultValue: "" });
                searchCriterias.push({ id: "OrderDateToFilter__", label: "_To", type: "DATE", required: false, toUpper: false, visible: true, filterId: "OrderDate__", filterType: "LOWER", defaultValue: "" });
                var searchByDNcriteria = [];
                searchByDNcriteria.push({ id: "DeliveryNoteFilter__", label: "_Delivery note", type: "STR", required: false, toUpper: false, visible: true, filterId: "DeliveryNote__", filterType: "IN", defaultValue: "", width: 264 });
                // last results for a search with a deliveryNote filter
                var orderNumbersForDNFilter = {};
                buildMainDialog();
                /***
                 * getItemMap fills the argument itemMap with the header data stored in currentOrderHeaderData,
                 * then with the result of a query on PO Items table.
                 * If a field is defined both in headers and items, items version will prevail.
                 * @param{SelectedOrderHeaderData} currentOrderHeaderData - po header data
                 * @param{IQueryValue} queryValue - query from PO Items table containing PO Items data
                 * @param{number} iRecord - index of the item we want to use
                 * @param{ItemMap} itemMap - object to be filled
                 */
                function getItemMap(currentOrderHeaderData, queryValue, iRecord, itemMap) {
                    // add header data to be displayed and added to the line item
                    for (var headerField in currentOrderHeaderData) {
                        if (Object.prototype.hasOwnProperty.call(currentOrderHeaderData, headerField)) {
                            itemMap[headerField] = currentOrderHeaderData[headerField];
                        }
                    }
                    // add item data, override header data with item data in case of duplicates
                    for (var iDef in queryValue.RecordsDefinition) {
                        if (Object.prototype.hasOwnProperty.call(queryValue.RecordsDefinition, iDef)) {
                            var propertyValue = queryValue.GetQueryValue(iDef, iRecord);
                            if (iDef === "RECEIVER__" && !propertyValue) { // We want to keep the receiver from the PO headers in case it's not filled at line item level
                                continue;
                            }
                            itemMap[iDef] = propertyValue;
                        }
                    }
                }
                function orderNumberFormatter(orderNumber) {
                    var allOrderNumbers = orderNumber;
                    // Handle half-width/full-width characters if needed
                    var availableDocumentCultures = Lib.AP.GetAvailableDocumentCultures();
                    for (var _i = 0, availableDocumentCultures_1 = availableDocumentCultures; _i < availableDocumentCultures_1.length; _i++) {
                        var culture = availableDocumentCultures_1[_i];
                        if (Sys.Helpers.String.ContainsFullWidthCharacters(orderNumber, culture)) {
                            var halfWidthPoNumber = Sys.Helpers.String.ConvertFullWidthToHalfWidthCharacters(orderNumber, culture);
                            allOrderNumbers += "," + halfWidthPoNumber;
                            break;
                        }
                    }
                    return allOrderNumbers;
                }
                function concatCustomDimensions(level, columns, fields) {
                    var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                    if (customDimensions && customDimensions[level]) {
                        customDimensions[level].forEach(function (dimension) {
                            var label = dimension.nameInForm;
                            var type = "STR";
                            var hidden = true;
                            var width = 130;
                            if (Controls.LineItems__[dimension.nameInForm]) {
                                label = Controls.LineItems__[dimension.nameInForm].GetLabel();
                                type = Controls.LineItems__[dimension.nameInForm].GetType();
                            }
                            if (dimension.fieldPropertiesInBrowsePage) {
                                if (dimension.fieldPropertiesInBrowsePage.isVisible) {
                                    hidden = !dimension.fieldPropertiesInBrowsePage.isVisible;
                                }
                                if (dimension.fieldPropertiesInBrowsePage.width) {
                                    width = dimension.fieldPropertiesInBrowsePage.width;
                                }
                            }
                            columns.push({ id: dimension.nameInTable, label: label, type: type, width: width, hidden: hidden });
                        });
                        customDimensions[level].forEach(function (dimension) {
                            fields.push(dimension.nameInTable);
                        });
                    }
                }
                function concatBrowseExtraFields(tableName, columns, fields) {
                    var extraQueryFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.GetBrowseQueryExtraFields", tableName);
                    if (extraQueryFields && extraQueryFields.length > 0) {
                        extraQueryFields.forEach(function (field) {
                            columns.push({ id: field, hidden: true });
                        });
                        Array.prototype.push.apply(fields, extraQueryFields);
                    }
                }
                function initPOHeadersColumns() {
                    poHeadersColumns.push({
                        id: "ViewPOHeaderDetail__", label: " ", type: "LINK", width: 80, initControlCallback: function () {
                            this.SetText("_ViewItems");
                            this.SetURL("");
                        }
                    });
                    poHeadersColumns.push({
                        id: "AddPOHeader__", label: " ", type: "LINK", width: 60, initControlCallback: function () {
                            this.SetText("_Add");
                            this.SetURL("");
                        }
                    });
                    poHeadersColumns.push({ id: "VendorNumber__", label: "_Vendor number", type: "STR", width: 190, orderBy: "DESC" });
                    poHeadersColumns.push({ id: "OrderNumber__", label: "_Order number", type: "STR", width: 80, orderBy: "DESC" });
                    poHeadersColumns.push({ id: "OrderedAmount__", label: "_Ordered amount", type: "DECIMAL", width: 200 });
                    poHeadersColumns.push({ id: "DeliveredAmount__", label: "_Delivered amount", type: "DECIMAL", width: 200 });
                    poHeadersColumns.push({ id: "InvoicedAmount__", label: "_Invoiced amount", type: "DECIMAL", width: 200 });
                    poHeadersColumns.push({ id: "OrderDate__", label: "_Order date", type: "DATE", width: 130 });
                    poHeadersColumns.push({ id: "Buyer__", type: "STR", hidden: true });
                    poHeadersColumns.push({ id: "Receiver__", type: "STR", hidden: true });
                    poHeadersColumns.push({ id: "DifferentInvoicingParty__", type: "STR", hidden: true });
                    poHeadersColumns.push({ id: "NoMoreInvoiceExpected__", type: "BOOLEAN", hidden: true });
                }
                function initPODetailsColumns() {
                    poDetailsColumns.push({ id: "AddPOItem__", label: " ", type: "LINK", width: 50 });
                    if (!displayGRFields) {
                        poDetailsColumns.push({ id: "ItemNumber__", label: "_Item number", type: "STR", width: 80 });
                        poDetailsColumns.push({ id: "Description__", label: "_Description", type: "STR", width: 342 });
                        poDetailsColumns.push({ id: "OrderedAmount__", label: "_Ordered amount", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "OrderedQuantity__", label: "_Ordered quantity", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "DeliveredAmount__", label: "_Delivered amount", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "DeliveredQuantity__", label: "_Delivered quantity", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "InvoicedAmount__", label: "_Invoiced amount", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "InvoicedQuantity__", label: "_Invoiced quantity", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "ExpectedAmount__", label: "_Expected amount", type: "DECIMAL", width: 90 });
                        if (Lib.P2P.IsGRIVEnabled()) {
                            poDetailsColumns.push({ id: "GRIV__", label: "_GRIV", type: "BOOLEAN", width: 40 });
                        }
                        poDetailsColumns.push({ id: "PartNumber__", label: "_Part number", type: "STR", hidden: true });
                    }
                    else {
                        poDetailsColumns.push({ id: "GRIV__", label: "_GRIV", type: "BOOLEAN", width: 40 });
                        poDetailsColumns.push({ id: "DeliveryNote__", label: "_Delivery note", type: "STR", width: 90 });
                        poDetailsColumns.push({ id: "DeliveryDate__", label: "_Delivery date", type: "DATE", width: 80 });
                        poDetailsColumns.push({ id: "GoodReceipt__", label: "_Goods receipt", type: "STR", width: 90 });
                        poDetailsColumns.push({ id: "ItemNumber__", label: "_Item number", type: "STR", width: 80 });
                        poDetailsColumns.push({ id: "PartNumber__", label: "_Part number", type: "STR", width: 80 });
                        poDetailsColumns.push({ id: "Description__", label: "_Description", type: "STR", width: 120 });
                        poDetailsColumns.push({ id: "ExpectedAmount__", label: "_Expected amount", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "OrderedAmount__", label: "_Ordered amount", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "OrderedQuantity__", label: "_Ordered quantity", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "DeliveredAmount__", label: "_Delivered amount", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "DeliveredQuantity__", label: "_Delivered quantity", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "InvoicedAmount__", label: "_Invoiced amount", type: "DECIMAL", width: 90 });
                        poDetailsColumns.push({ id: "InvoicedQuantity__", label: "_Invoiced quantity", type: "DECIMAL", width: 90 });
                    }
                    poDetailsColumns.push({ id: "TaxCode__", label: "_Tax code", type: "STR", width: 50 });
                    poDetailsColumns.push({ id: "TaxRate__", label: "_Tax rate", type: "STR", hidden: true, options: { precision: 3 } });
                    poDetailsColumns.push({ id: "NonDeductibleTaxRate__", label: "_NonDeductibleTaxRate", type: "STR", hidden: true, options: { precision: 3 } });
                    poDetailsColumns.push({ id: "UnitPrice__", label: "_Unit price", type: "DECIMAL", hidden: true, options: { precision: 4 } });
                    poDetailsColumns.push({ id: "CostCenter__", label: "_Cost center", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "ProjectCode__", label: "_Project code", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "ProjectCodeDescription__", label: "_Project code description", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "WBSElement__", label: "_WBSElement", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "WBSElementID__", label: "_WBSElementID", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "InternalOrder__", label: "_InternalOrder", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "GLAccount__", label: "_GL account", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "Group__", label: "_Group", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "BudgetID__", label: "_BudgetID", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "FreeDimension1__", label: "_FreeDimension1", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "FreeDimension1ID__", label: "_FreeDimension1ID", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "IsLocalPO__", type: "BOOLEAN", hidden: true });
                    poDetailsColumns.push({ id: "NoGoodsReceipt__", type: "BOOLEAN", hidden: true });
                    poDetailsColumns.push({ id: "UnitOfMeasureCode__", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "CostType__", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "ItemType__", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "WBSElementID__", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "WBSElement__", type: "STR", hidden: true });
                    poDetailsColumns.push({ id: "InternalOrder__", type: "STR", hidden: true });
                    // Adding all po headers columns to PO items columns
                    // This is so that when adding a PO line (instead of whole PO), po header data will still be filled
                    poHeadersColumns.forEach(function (headerColumn) {
                        // OrderedAmount__, DeliveredAmount__ and InvoicedAmount__ are displayed both in the header and items.
                        // We already added them at the right place in the object poDetailsColumns a few lines above this
                        if (headerColumn.id != "OrderedAmount__" && headerColumn.id != "DeliveredAmount__" && headerColumn.id != "InvoicedAmount__") {
                            poDetailsColumns.push({ id: headerColumn.id, type: headerColumn.id, hidden: true });
                        }
                    });
                }
                function initPOHeadersDisplayedFields() {
                    poHeadersDisplayedFields.push("VendorNumber__");
                    poHeadersDisplayedFields.push("OrderDate__");
                    poHeadersDisplayedFields.push("OrderedAmount__");
                    poHeadersDisplayedFields.push("DeliveredAmount__");
                    poHeadersDisplayedFields.push("InvoicedAmount__");
                    poHeadersDisplayedFields.push("NoMoreInvoiceExpected__");
                }
                function initPOHeadersLineLevelFields() {
                    poHeadersLineLevelFields.push("OrderNumber__");
                    poHeadersLineLevelFields.push("Buyer__");
                    poHeadersLineLevelFields.push("Receiver__");
                    poHeadersLineLevelFields.push("DifferentInvoicingParty__");
                }
                function initPOItemsFields() {
                    poItemsFields.push("OrderNumber__");
                    poItemsFields.push("VendorNumber__");
                    poItemsFields.push("ItemNumber__");
                    poItemsFields.push("Description__");
                    poItemsFields.push("OrderedAmount__");
                    poItemsFields.push("OrderedQuantity__");
                    poItemsFields.push("DeliveredAmount__");
                    poItemsFields.push("DeliveredQuantity__");
                    poItemsFields.push("InvoicedAmount__");
                    poItemsFields.push("InvoicedQuantity__");
                    poItemsFields.push("TaxCode__");
                    poItemsFields.push("TaxRate__");
                    poItemsFields.push("NonDeductibleTaxRate__");
                    poItemsFields.push("PartNumber__");
                    poItemsFields.push("UnitPrice__");
                    poItemsFields.push("GLAccount__");
                    poItemsFields.push("Group__");
                    poItemsFields.push("CostCenter__");
                    poItemsFields.push("ProjectCode__");
                    poItemsFields.push("ProjectCodeDescription__");
                    poItemsFields.push("WBSElement__");
                    poItemsFields.push("WBSElementID__");
                    poItemsFields.push("InternalOrder__");
                    poItemsFields.push("BudgetID__");
                    poItemsFields.push("GRIV__");
                    poItemsFields.push("Receiver__");
                    poItemsFields.push("IsLocalPO__");
                    poItemsFields.push("NoGoodsReceipt__");
                    poItemsFields.push("UnitOfMeasureCode__");
                    poItemsFields.push("CostType__");
                    poItemsFields.push("ItemType__");
                    poItemsFields.push("WBSElementID__");
                    poItemsFields.push("WBSElement__");
                    poItemsFields.push("InternalOrder__");
                    poItemsFields.push("FreeDimension1__");
                    poItemsFields.push("FreeDimension1ID__");
                }
                function initGRItemsFields() {
                    grItemsFields.push("DeliveryNote__");
                    grItemsFields.push("DeliveryDate__");
                    grItemsFields.push("GRNumber__");
                    grItemsFields.push("Quantity__");
                    grItemsFields.push("Amount__");
                    grItemsFields.push("InvoicedAmount__");
                    grItemsFields.push("InvoicedQuantity__");
                }
                function buildMainDialogWithoutQuery() {
                    if (!dialogOptions) {
                        dialogOptions = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeBrowseParameters", defaultDialogOptions) || defaultDialogOptions;
                        dialogOptions.beforeOpening = function () {
                            FormLayoutHelper.MakePanelsReadOnlyForBrowsePOOpening();
                        };
                        dialogOptions.beforeClosing = function () {
                            FormLayoutHelper.RestorePanelsReadOnlyForBrowsePOClosing();
                        };
                    }
                    Popup.Dialog(browseTitle, null, fillSearchDialog, null, null, handleSearchDialog, handleCancelDialog, null, dialogOptions);
                    if (dialogOptions.windowed) {
                        mainControl.Wait(false);
                    }
                }
                function buildMainDialog() {
                    if (Controls.VendorNumber__.GetValue() && searchAtOpening) {
                        var filter = "";
                        var orderNumber = Controls.OrderNumber__.GetValue();
                        if (orderNumber) {
                            orderNumber = orderNumberFormatter(orderNumber);
                            filter = Sys.Helpers.Browse.LDAPINFilter(orderNumber, "OrderNumber__");
                        }
                        filter = filter.AddVendorNumberFilter(defaultVendorNumber);
                        filter = filter.AddCompanyCodeFilter(Controls.CompanyCode__.GetValue());
                        var queryFields = poHeadersDisplayedFields.concat(poHeadersLineLevelFields).join("|");
                        Query.DBQuery(fillPOHeader, headersTableName, queryFields, filter, "OrderNumber__ DESC", rowcount);
                    }
                    else {
                        buildMainDialogWithoutQuery();
                    }
                }
                function fillMainSearchDialog(newDialog) {
                    // callback from base dialog
                    dialog = newDialog;
                    dialog.HideDefaultButtons();
                    // Hidden fields
                    var hiddenFields = [
                        CompCodeFilter
                    ];
                    Sys.Helpers.Browse.AddSearchCriteriaFields(newDialog, hiddenFields);
                    var controlsGrid = [
                        [
                            { type: "Text", label: "_Vendor number", id: "VendorNumberFilter__", width: 264 },
                            { type: "Date", label: "_From", id: "OrderDateFromFilter__" },
                            { type: "Button", label: "_Search", id: "searchButton", addHiddenWaitingIcon: "waitingIcon", rowSpan: 2 }
                        ],
                        [
                            { type: "Text", label: "_Delivery note", id: "DeliveryNoteFilter__", width: 264 },
                            { type: "Date", label: "_To", id: "OrderDateToFilter__" }
                        ],
                        [
                            { type: "Text", label: "_Order number", id: "OrderNumberFilter__", width: 264 },
                            { type: "CheckBox", label: "_Only show open orders/items", id: "onlyShowOpenOrders__" }
                        ]
                    ];
                    Sys.Helpers.Browse.AddGridCriterias(newDialog, controlsGrid);
                    // Add Order numbers in search
                    var orderNumber = Controls.OrderNumber__.GetValue();
                    var searchOrderNumber = newDialog.GetControl("searchCriteria_OrderNumberFilter__");
                    if (orderNumber && searchOrderNumber && !searchOrderNumber.GetValue()) {
                        searchOrderNumber.SetText(orderNumber);
                    }
                    // Add vendor number in search
                    var searchVendorNumber = newDialog.GetControl("searchCriteria_VendorNumberFilter__");
                    if (defaultVendorNumber && searchVendorNumber && !searchVendorNumber.GetValue()) {
                        searchVendorNumber.SetText(defaultVendorNumber);
                    }
                    var ctrlOnlyShow = dialog.GetControl("searchCriteria_onlyShowOpenOrders__");
                    ctrlOnlyShow.SetValue(true);
                    Sys.Helpers.Browse.AddMessageController(newDialog);
                    dialog.AddTab("ResultsListTab", Language.Translate("_Purchase order headers"), null, fillSearchDialog, null, null, handleSearchDialog, handleCancelDialog);
                    dialog.AddTab("POItemsTab", orderItemsTabLabel, null, fillSearchDialog, null, null, handleSearchDialog, handleCancelDialog);
                    // Specific behaviour
                    Sys.Helpers.Browse.AddCustomEventHandle("OnClick", "Close__", closeDialog);
                }
                function fillPOItemsTab(newDialog) {
                    dialogItems = newDialog;
                    Sys.Helpers.Browse.AddTable(dialogItems, "POItems__", poDetailsColumns, null, rowcountperpage);
                    dialogItems.GetControl("maxRecords_POItems__").Hide(true);
                    // Hide tab - will be displayed only when displaying PO header details
                    dialog.HideTab(curOrderItemsTabLabel);
                    // Specific behaviour
                    Sys.Helpers.Browse.AddCustomEventHandle("OnClick", "AddPOItem__", addPOItem);
                }
                function fillResultsListTab(newDialog) {
                    dialogResults = newDialog;
                    Sys.Helpers.Browse.AddResults(newDialog, poHeadersColumns, rowcount, rowcountperpage, "", false);
                    // Specific behaviour
                    Sys.Helpers.Browse.AddCustomEventHandle("OnClick", "ViewPOHeaderDetail__", viewHeaderDetail);
                    Sys.Helpers.Browse.AddCustomEventHandle("OnClick", "AddPOHeader__", addPOHeader);
                    // Fill results table with query results fetched on browse
                    if (Controls.VendorNumber__.GetValue() && searchAtOpening && Sys.Helpers.Browse.FillTableFromQueryResult(dialogResults, "resultTable", callbackResult)) {
                        Sys.Helpers.Browse.HideResults(dialogResults, false);
                        dialogResults.GetControl("maxRecords_resultTable").Hide(dialogResults.GetControl("resultTable").GetItemCount() < rowcount);
                    }
                }
                /* Draw and display the customer browse page */
                function fillSearchDialog(newDialog, tabId) {
                    switch (tabId) {
                        case null:
                            fillMainSearchDialog(newDialog);
                            break;
                        case "ResultsListTab":
                            fillResultsListTab(newDialog);
                            break;
                        case "POItemsTab":
                            fillPOItemsTab(newDialog);
                            break;
                        default:
                            Log.Error("Unknown tab: " + tabId);
                            break;
                    }
                }
                /* Perform request on Purchase order headers */
                function requestPO(extraFilter) {
                    Sys.Helpers.Browse.DBRequest(fillPOHeader, dialog, poHeadersColumns, searchCriterias, headersTableName, rowcount, extraFilter);
                }
                /* Perform request on Goods receipts */
                function requestDN() {
                    var DNcolumns = [];
                    DNcolumns.push({ id: "OrderNumber__", orderBy: "DESC" });
                    DNcolumns.push({ id: "LineNumber__" });
                    Sys.Helpers.Browse.DBRequest(searchByDNResult, dialog, DNcolumns, searchByDNcriteria, goodsReceiptTableName, rowcount, "!(Status__=Canceled)");
                }
                /* Perform request */
                function request(clean) {
                    // Reset result tables
                    Sys.Helpers.Browse.ResetTable(dialogResults);
                    if (clean !== false) {
                        cleanUpPOItemsTable();
                        // set focus on first tab
                        dialogResults.FocusControl(dialogResults.GetControl("resultTable"));
                    }
                    orderNumbersForDNFilter = {};
                    var searchByDN = Boolean(dialog.GetControl("searchCriteria_DeliveryNoteFilter__").GetText());
                    if (searchByDN) {
                        requestDN();
                    }
                    else {
                        requestPO();
                    }
                }
                function buildOrderNumbersFilter(DNrecords) {
                    if (!DNrecords || DNrecords.length <= 0) {
                        return "";
                    }
                    var orderNumbers = [];
                    for (var dnIdx = 0; dnIdx < DNrecords.length; dnIdx++) {
                        var orderNum = DNrecords[dnIdx][0];
                        if (orderNumbers.indexOf(orderNum) < 0) {
                            orderNumbers.push(orderNum);
                            orderNumbersForDNFilter[orderNum] = [];
                        }
                        orderNumbersForDNFilter[orderNum].push(DNrecords[dnIdx][1]);
                    }
                    return "|(OrderNumber__=" + orderNumbers.join(")(OrderNumber__=") + ")";
                }
                /** Called when the query requestDN is completed
                 * @this searchByDNResult
                 */
                function searchByDNResult() {
                    callbackResult = this;
                    var queryValue = callbackResult.GetQueryValue();
                    var orderNumbersFilter = buildOrderNumbersFilter(queryValue.Records);
                    if (orderNumbersFilter) {
                        requestPO(orderNumbersFilter);
                    }
                    else if (dialog && dialogResults) {
                        Sys.Helpers.Browse.CompletedCallBack(dialog, callbackResult);
                    }
                }
                function onlyShowOpenOrders() {
                    if (dialog) {
                        var ctrl = dialog.GetControl("searchCriteria_onlyShowOpenOrders__");
                        return ctrl && ctrl.IsChecked();
                    }
                    // dialog not built yet, return default value of onlyShowOpenOrders checkbox
                    return true;
                }
                /** Called when the query requestPO is completed
                 * @this fillPOHeader
                 */
                function fillPOHeader() {
                    callbackResult = this;
                    var queryValue = callbackResult.GetQueryValue();
                    var length = queryValue.Records ? queryValue.Records.length : 0;
                    if (onlyShowOpenOrders() && length > 0) {
                        // Remove result from array
                        for (var i = length - 1; i >= 0; --i) {
                            var AmountIndexToCompareValue = parseFloat(queryValue.GetQueryValue("ORDEREDAMOUNT__", i) || "0");
                            var InvoicedAmountIndexValue = parseFloat(queryValue.GetQueryValue("INVOICEDAMOUNT__", i) || "0");
                            var billingComplete = queryValue.GetQueryValue("NOMOREINVOICEEXPECTED__", i) === "1" || false;
                            var opened = (AmountIndexToCompareValue > InvoicedAmountIndexValue) && !billingComplete;
                            var customOpened = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.IsPurchaseOrderOpened", opened, queryValue, i);
                            if (typeof customOpened === "boolean") {
                                opened = customOpened;
                            }
                            if (!opened) {
                                queryValue.Records.splice(i, 1);
                            }
                        }
                    }
                    // First query
                    if (dialog && dialogResults) {
                        Sys.Helpers.Browse.CompletedCallBack(dialog, callbackResult);
                        if (Sys.Helpers.Browse.FillTableFromQueryResult(dialogResults, "resultTable", callbackResult)) {
                            Sys.Helpers.Browse.HideResults(dialogResults, false);
                            dialogResults.GetControl("maxRecords_resultTable").Hide(dialogResults.GetControl("resultTable").GetItemCount() < rowcount);
                        }
                    }
                    else {
                        buildMainDialogWithoutQuery();
                    }
                }
                /* Handle event in customer browse page */
                function handleSearchDialog(handleDialog, action, event, control, tableItem) {
                    if (event === "OnChange" && control.GetName() === "searchCriteria_onlyShowOpenOrders__") {
                        if (selectedOrderHeaderData) {
                            var checkBoxOnlyShowOpenOrders = dialog.GetControl("searchCriteria_onlyShowOpenOrders__");
                            if (checkBoxOnlyShowOpenOrders) {
                                checkBoxOnlyShowOpenOrders.SetReadOnly(true);
                            }
                            request(false);
                            viewHeaderDetail(null, false);
                        }
                        else {
                            request();
                        }
                        return;
                    }
                    if (event === "OnChange" && control.GetName() === "searchCriteria_DeliveryNoteFilter__") {
                        if (selectedOrderHeaderData) {
                            request(false);
                            viewHeaderDetail(null, false);
                        }
                        else {
                            request();
                        }
                        return;
                    }
                    // Return selection is an empty function since we want to disable common browse helper behaviour
                    searchControlFocused = Sys.Helpers.Browse.HandleSearchDialog(handleDialog, action, event, control, tableItem, searchControlFocused, request);
                }
                function addPOHeader(control) {
                    var row = control.GetRow();
                    var callbackInstance = {
                        ORDERNUMBER__: ""
                    };
                    // build the callback instance so that it contains the po header info
                    poHeadersLineLevelFields.forEach(function (headerField) {
                        var fieldName = headerField.toUpperCase();
                        if (row[headerField]) {
                            callbackInstance[fieldName] = row[headerField].GetValue();
                        }
                    });
                    recordAdded = 0;
                    var filter = "OrderNumber__=" + row.OrderNumber__.GetValue();
                    filter = filter.AddCompanyCodeFilter(Controls.CompanyCode__.GetValue());
                    var queryFields = poItemsFields.join("|");
                    Query.DBQuery(fillLineItemsQueryCallBack, itemsTableName, queryFields, filter, "ItemNumber__ ASC", "full_result", callbackInstance);
                }
                function handleCancelDialog() {
                    CleanUpLineItems();
                }
                /** @this fillLineItemsQueryCallBack */
                function fillLineItemsQueryCallBack(queryResult) {
                    var currentOrderHeaderData = this;
                    var currentOrderNumber = currentOrderHeaderData.ORDERNUMBER__;
                    var queryValue = queryResult.GetQueryValue();
                    if (queryValue.Records && queryValue.Records.length > 0) {
                        var poItems = [];
                        var isOpenPOCheckBoxEnabled = onlyShowOpenOrders();
                        for (var iRecord = 0; iRecord < queryValue.Records.length; iRecord++) {
                            if (isOpenPOCheckBoxEnabled) {
                                var AmountIndexToCompareValue = parseFloat(queryValue.GetQueryValue("ORDEREDAMOUNT__", iRecord) || "0");
                                var InvoicedAmountIndexValue = parseFloat(queryValue.GetQueryValue("INVOICEDAMOUNT__", iRecord) || "0");
                                var opened = AmountIndexToCompareValue > InvoicedAmountIndexValue;
                                var customOpened = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.IsPurchaseOrderItemOpened", opened, queryValue, iRecord);
                                if (typeof customOpened === "boolean") {
                                    opened = customOpened;
                                }
                                if (!opened) {
                                    continue;
                                }
                            }
                            var itemMap = {};
                            itemMap.TAXAMOUNT__ = "0";
                            getItemMap(currentOrderHeaderData, queryValue, iRecord, itemMap);
                            var grivByLineAvailable = Lib.P2P.IsGRIVEnabledByLine() && itemMap.GRIV__ === "1";
                            var bGRLine = Lib.P2P.IsGRIVEnabledGlobally() || grivByLineAvailable;
                            if (bGRLine) {
                                poItems.push({ item: itemMap, isGriv: true });
                            }
                            else {
                                var itemNumber = queryResult.GetQueryValue("ItemNumber__", iRecord);
                                if (!isItemAlreadySet(currentOrderNumber, itemNumber)) {
                                    poItems.push({ item: itemMap });
                                }
                            }
                        }
                        // Process all Non GRIV items
                        // The goal of the reduce with a promise as an argument is to compute each item sequentially as a string of promises
                        // What we actually do is process(poItems[0]).then(process(poItems[1])).then(process(poItems[2]))... and so on
                        poItems.reduce(function (p, oneItem) {
                            return p.then(function () {
                                return Sys.Helpers.Promise.Create(function (resolve) {
                                    if (oneItem.isGriv) {
                                        completeLineItemsWithGRInformations(oneItem.item, resolve);
                                    }
                                    else {
                                        var callback = function () {
                                            addItem(oneItem.item, oneItem.item.ORDERNUMBER__, oneItem.item.ITEMNUMBER__);
                                            resolve(true);
                                        };
                                        setTimeout(callback, 0);
                                    }
                                });
                            });
                        }, Sys.Helpers.Promise.Resolve()).then(function (lineAdded) {
                            GetTaxRateForItemList().then(function () {
                                CleanUpLineItems();
                                var message = lineAdded ? "_The line items have been updated with purchase order #{0}." : "_No items have been added for the purchase order #{0}.";
                                // Confirmation
                                Popup.Snackbar({
                                    message: Language.Translate(message, false, currentOrderNumber),
                                    status: lineAdded ? "success" : "info",
                                    inDialog: browseTitle
                                });
                                Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowsePO.Common.OnFinalizeAddPoEnd", currentOrderNumber, null, dialog);
                                waitCounter(false);
                            });
                        });
                    }
                    else {
                        Popup.Snackbar({
                            message: Language.Translate("_No items have been found for the purchase order #{0}.", false, currentOrderNumber),
                            status: "warning",
                            inDialog: browseTitle
                        });
                    }
                }
                function completeLineItemsWithGRInformations(itemMap, callback) {
                    /** @this queryCallback */
                    function queryCallback() {
                        // this is the item to add;MMAddLineItem
                        var queryValue = this.GetQueryValue();
                        var lineAdded = false;
                        if (queryValue.Records && queryValue.Records.length > 0) {
                            for (var iRecord = 0; iRecord < queryValue.Records.length; iRecord++) {
                                var lineItemMap = Sys.Helpers.Clone(itemMap);
                                lineItemMap.DELIVERYNOTE__ = queryValue.GetQueryValue("DELIVERYNOTE__", iRecord);
                                lineItemMap.GOODRECEIPT__ = queryValue.GetQueryValue("GRNUMBER__", iRecord);
                                lineItemMap.ORDEREDQUANTITY__ = queryValue.GetQueryValue("QUANTITY__", iRecord);
                                lineItemMap.ORDEREDAMOUNT__ = queryValue.GetQueryValue("AMOUNT__", iRecord);
                                lineItemMap.DELIVEREDQUANTITY__ = queryValue.GetQueryValue("QUANTITY__", iRecord);
                                lineItemMap.DELIVEREDAMOUNT__ = queryValue.GetQueryValue("AMOUNT__", iRecord);
                                lineItemMap.INVOICEDQUANTITY__ = queryValue.GetQueryValue("INVOICEDQUANTITY__", iRecord);
                                lineItemMap.INVOICEDAMOUNT__ = queryValue.GetQueryValue("INVOICEDAMOUNT__", iRecord);
                                fillCustomizedGRItems(lineItemMap, queryValue, iRecord);
                                if (!isItemAlreadySet(itemMap.ORDERNUMBER__, itemMap.ITEMNUMBER__, lineItemMap.GOODRECEIPT__)) {
                                    addItem(lineItemMap, itemMap.ORDERNUMBER__, itemMap.ITEMNUMBER__, lineItemMap.GOODRECEIPT__);
                                    lineAdded = true;
                                }
                            }
                        }
                        else {
                            AddOrderNumber(itemMap.ORDERNUMBER__);
                        }
                        if (callback) {
                            callback(lineAdded);
                        }
                    }
                    var filter = "(&(!(Status__=Canceled))(OrderNumber__=" + itemMap.ORDERNUMBER__ + ")(LineNumber__=" + itemMap.ITEMNUMBER__ + ")";
                    var dnCriteria = dialog.GetControl("searchCriteria_DeliveryNoteFilter__").GetText();
                    if (dnCriteria) {
                        filter += "(DeliveryNote__=" + dnCriteria + ")";
                    }
                    filter += ")";
                    filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    var queryFields = grItemsFields.join("|");
                    Query.DBQuery(queryCallback, goodsReceiptTableName, queryFields, filter, "GRNumber__ ASC", 100);
                }
                function viewHeaderDetail(control, focus) {
                    // set focus on second tab
                    dialog.HideTab(curOrderItemsTabLabel, false);
                    if (focus !== false) {
                        dialogItems.FocusControl(dialogItems.GetControl("POItems__"));
                    }
                    if (control) {
                        var row_1 = control.GetRow();
                        selectedOrderHeaderData = {
                            ORDERNUMBER__: ""
                        };
                        poHeadersLineLevelFields.forEach(function (headerField) {
                            var fieldName = headerField.toUpperCase();
                            if (row_1[headerField]) {
                                selectedOrderHeaderData[fieldName] = row_1[headerField].GetValue();
                            }
                        });
                    }
                    var orderNumer = selectedOrderHeaderData.ORDERNUMBER__;
                    var filter = "OrderNumber__=" + orderNumer;
                    if (control && control.GetRow().VendorNumber__.GetValue()) {
                        filter = filter.AddVendorNumberFilter(control.GetRow().VendorNumber__.GetValue());
                    }
                    if (orderNumbersForDNFilter[orderNumer] && orderNumbersForDNFilter[orderNumer].length > 0) {
                        var filters = [];
                        // Filter on results for delivery note filter
                        for (var _i = 0, _a = orderNumbersForDNFilter[orderNumer]; _i < _a.length; _i++) {
                            var l = _a[_i];
                            filters.push(Sys.Helpers.LdapUtil.FilterEqual("ItemNumber__", orderNumbersForDNFilter[orderNumer][l]));
                        }
                        var filterLDAP = Sys.Helpers.LdapUtil.FilterOr(filters);
                        filter += filterLDAP.toString();
                    }
                    filter = filter.AddCompanyCodeFilter(Controls.CompanyCode__.GetValue());
                    var tabLabel = Language.Translate(orderItemsTabLabel + " for {0}", false, orderNumer);
                    if (dialog.ChangeTabLabel(curOrderItemsTabLabel, tabLabel)) {
                        curOrderItemsTabLabel = tabLabel;
                    }
                    var table = dialogItems.GetControl("POItems__");
                    table.SetItemCount(0);
                    var waitingIcon = dialog.GetControl("waitingIcon");
                    if (waitingIcon) {
                        waitingIcon.Hide(false);
                    }
                    var queryFields = poItemsFields.join("|");
                    Query.DBQuery(fillPOItemsQueryCallBack, itemsTableName, queryFields, filter, "ItemNumber__ ASC", "full_result", selectedOrderHeaderData);
                }
                function fillPOItem(itemMap, table) {
                    var lineDetail = table.AddItem(false);
                    poDetailsColumns.forEach(function (column) {
                        var columnName = column.id.toUpperCase();
                        if (itemMap[columnName]) {
                            lineDetail.SetValue(columnName, itemMap[columnName]);
                        }
                    });
                    lineDetail.SetValue("ExpectedAmount__", lineDetail.GetValue("DeliveredAmount__") - lineDetail.GetValue("INVOICEDAMOUNT__"));
                }
                function completePOItemsWithGRInformations(itemMap, table, callback) {
                    /** @this queryCallback */
                    function queryCallback() {
                        var queryValue = this.GetQueryValue();
                        if (queryValue.Records && queryValue.Records.length > 0) {
                            for (var iRecord = 0; iRecord < queryValue.Records.length; iRecord++) {
                                var lineItemMap = Sys.Helpers.Clone(itemMap);
                                lineItemMap.DELIVERYNOTE__ = queryValue.GetQueryValue("DELIVERYNOTE__", iRecord);
                                lineItemMap.DELIVERYDATE__ = queryValue.GetQueryValue("DELIVERYDATE__", iRecord);
                                lineItemMap.GOODRECEIPT__ = queryValue.GetQueryValue("GRNUMBER__", iRecord);
                                lineItemMap.ORDEREDQUANTITY__ = queryValue.GetQueryValue("QUANTITY__", iRecord);
                                lineItemMap.ORDEREDAMOUNT__ = queryValue.GetQueryValue("AMOUNT__", iRecord);
                                lineItemMap.DELIVEREDQUANTITY__ = queryValue.GetQueryValue("QUANTITY__", iRecord);
                                lineItemMap.DELIVEREDAMOUNT__ = queryValue.GetQueryValue("AMOUNT__", iRecord);
                                lineItemMap.INVOICEDQUANTITY__ = queryValue.GetQueryValue("INVOICEDQUANTITY__", iRecord);
                                lineItemMap.INVOICEDAMOUNT__ = queryValue.GetQueryValue("INVOICEDAMOUNT__", iRecord);
                                fillCustomizedGRItems(lineItemMap, queryValue, iRecord);
                                fillPOItem(lineItemMap, table);
                            }
                        }
                        if (callback) {
                            callback();
                        }
                    }
                    var filter = "(&(!(Status__=Canceled))(OrderNumber__=" + itemMap.ORDERNUMBER__ + ")(LineNumber__=" + itemMap.ITEMNUMBER__ + ")";
                    var dnCriteria = dialog.GetControl("searchCriteria_DeliveryNoteFilter__").GetText();
                    if (dnCriteria) {
                        filter += "(DeliveryNote__=" + dnCriteria + ")";
                    }
                    filter += ")";
                    filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    var queryFields = grItemsFields.join("|");
                    Query.DBQuery(queryCallback, goodsReceiptTableName, queryFields, filter, "GRNumber__ ASC", 100);
                }
                /** @this  fillPOItemsQueryCallBack */
                function fillPOItemsQueryCallBack(queryResult) {
                    if (dialog) {
                        var table_1 = dialogItems.GetControl("POItems__");
                        var currentOrderHeaderData = this;
                        var currentOrderNumber = currentOrderHeaderData.ORDERNUMBER__;
                        var poItems = [];
                        var isOpenPOCheckBoxEnabled = onlyShowOpenOrders();
                        var hideGrivColumns = displayGRFields;
                        var queryValue = queryResult.GetQueryValue();
                        var length = queryResult.GetRecordsCount();
                        for (var iRecord = 0; iRecord < length; iRecord++) {
                            if (isOpenPOCheckBoxEnabled) {
                                var AmountIndexToCompareValue = parseFloat(queryValue.GetQueryValue("ORDEREDAMOUNT__", iRecord) || "0");
                                var InvoicedAmountIndexValue = parseFloat(queryValue.GetQueryValue("INVOICEDAMOUNT__", iRecord) || "0");
                                var opened = AmountIndexToCompareValue > InvoicedAmountIndexValue;
                                var customOpened = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.IsPurchaseOrderItemOpened", opened, queryValue, iRecord);
                                if (typeof customOpened === "boolean") {
                                    opened = customOpened;
                                }
                                if (!opened) {
                                    continue;
                                }
                            }
                            var itemMap = {};
                            itemMap.TAXAMOUNT__ = "0";
                            getItemMap(currentOrderHeaderData, queryValue, iRecord, itemMap);
                            var grivByLineAvailable = Lib.P2P.IsGRIVEnabledByLine() && itemMap.GRIV__ === "1";
                            var bGRLine = Lib.P2P.IsGRIVEnabledGlobally() || grivByLineAvailable;
                            if (bGRLine) {
                                itemMap.GRIV__ = "1";
                                poItems.push({ item: itemMap, isGriv: true });
                                hideGrivColumns = false;
                            }
                            else {
                                poItems.push({ item: itemMap });
                            }
                        }
                        if (poItems.length > 0) {
                            var tabLabel = Language.Translate(orderItemsTabLabel + " for {0}", false, currentOrderNumber);
                            if (dialog.ChangeTabLabel(curOrderItemsTabLabel, tabLabel)) {
                                curOrderItemsTabLabel = tabLabel;
                            }
                            table_1.GetColumnControl(1).SetText("_Add");
                            table_1.GetColumnControl(1).SetURL("");
                            table_1.GetColumnControl(2).Hide(hideGrivColumns);
                            table_1.GetColumnControl(3).Hide(hideGrivColumns);
                            table_1.GetColumnControl(4).Hide(hideGrivColumns);
                            table_1.GetColumnControl(5).Hide(hideGrivColumns);
                            table_1.SetItemCount(0);
                            poItems.reduce(function (p, oneItem) {
                                return p.then(function () {
                                    return Sys.Helpers.Promise.Create(function (resolve) {
                                        if (oneItem.isGriv) {
                                            completePOItemsWithGRInformations(oneItem.item, table_1, resolve);
                                        }
                                        else {
                                            var callback = function () {
                                                fillPOItem(oneItem.item, table_1);
                                                resolve();
                                            };
                                            setTimeout(callback, 0);
                                        }
                                    });
                                });
                            }, Sys.Helpers.Promise.Resolve()).then(function () {
                                var checkBoxOnlyShowOpenOrders = dialog.GetControl("searchCriteria_onlyShowOpenOrders__");
                                if (checkBoxOnlyShowOpenOrders) {
                                    checkBoxOnlyShowOpenOrders.SetReadOnly(false);
                                }
                            });
                        }
                        else {
                            Popup.Snackbar({
                                message: Language.Translate("_No items have been found for the purchase order #{0}.", false, currentOrderNumber),
                                status: "warning",
                                inDialog: browseTitle
                            });
                            cleanUpPOItemsTable();
                        }
                        var waitingIcon = dialog.GetControl("waitingIcon");
                        if (waitingIcon) {
                            waitingIcon.Hide(true);
                        }
                    }
                }
                function addPOItem(control) {
                    var currentRow = control.GetRow();
                    var orderNumber = currentRow.OrderNumber__.GetValue();
                    var itemNumber = currentRow.ItemNumber__.GetValue();
                    var table = dialogItems.GetControl("POItems__");
                    var griv = currentRow.GRIV__ ? currentRow.GRIV__.GetValue() : false;
                    function finalizefillLineItems(lineAdded) {
                        if (lineAdded) {
                            GetTaxRateForItemList().then(function () {
                                CleanUpLineItems();
                                // Confirmation
                                Popup.Snackbar({
                                    message: Language.Translate("_The line item #{0} has been added.", false, itemNumber),
                                    status: "success",
                                    inDialog: browseTitle
                                });
                                Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowsePO.Common.OnFinalizeAddPoEnd", orderNumber, itemNumber, dialog);
                                waitCounter(false);
                            });
                        }
                        else {
                            Popup.Snackbar({
                                message: Language.Translate("_The line item #{0} has not been added.", false, itemNumber),
                                status: "info",
                                inDialog: browseTitle
                            });
                            waitCounter(false);
                        }
                    }
                    var itemMap = {};
                    itemMap.TAXAMOUNT__ = "0";
                    itemMap.GRIV__ = griv === true ? "1" : "0";
                    // add item data, header data is added as well as it is stored in table
                    // (table definition also contains header columns)
                    for (var iColumn = 1; iColumn < table.GetColumnCount() + 1; iColumn++) {
                        var columnName = table.GetColumnControl(iColumn).GetName();
                        itemMap[columnName.toUpperCase()] = currentRow[columnName].GetValue();
                    }
                    var grivByLineAvailable = Lib.P2P.IsGRIVEnabledByLine() && itemMap.GRIV__ === "1";
                    var bCompleteLineWithGR = Lib.P2P.IsGRIVEnabledGlobally() || grivByLineAvailable;
                    var grInformationsLoaded = displayGRFields && bCompleteLineWithGR;
                    if (grInformationsLoaded) {
                        var grNumber = currentRow.GoodReceipt__.GetValue();
                        var lineAdded = false;
                        if (!isItemAlreadySet(orderNumber, itemNumber, grNumber)) {
                            addItem(itemMap, orderNumber, itemNumber, grNumber);
                            lineAdded = true;
                        }
                        finalizefillLineItems(lineAdded);
                    }
                    else if (bCompleteLineWithGR) {
                        completeLineItemsWithGRInformations(itemMap, finalizefillLineItems);
                    }
                    else {
                        var lineAdded = false;
                        if (!isItemAlreadySet(orderNumber, itemNumber)) {
                            addItem(itemMap, orderNumber, itemNumber);
                            lineAdded = true;
                        }
                        finalizefillLineItems(lineAdded);
                    }
                }
                function addItem(itemMap, orderNumber, itemNumber, goodReceipt) {
                    waitCounter(true);
                    recordAdded++;
                    var goodReceiptKey = goodReceipt ? goodReceipt : "";
                    addedItems[orderNumber + "-" + itemNumber + "-" + goodReceiptKey] = true;
                    AddLineItem(itemMap);
                }
                function isItemAlreadySet(orderNumber, itemNumber, goodReceipt) {
                    var itemAlreadySet = false;
                    if (addedItems === null) {
                        addedItems = {};
                        var cnt = Controls.LineItems__.GetItemCount();
                        for (var i = 0; i < cnt; i++) {
                            var item = Controls.LineItems__.GetItem(i);
                            var curOrderNumber = item.GetValue("OrderNumber__");
                            var curItemNumber = item.GetValue("ItemNumber__");
                            var curGoodReceipt = item.GetValue("GoodsReceipt__");
                            var curGoodReceiptKey = curGoodReceipt ? curGoodReceipt : "";
                            addedItems[curOrderNumber + "-" + curItemNumber + "-" + curGoodReceiptKey] = true;
                            if (curOrderNumber === orderNumber && curItemNumber === itemNumber && (!goodReceipt || curGoodReceipt === goodReceipt)) {
                                itemAlreadySet = true;
                            }
                        }
                    }
                    else {
                        var goodReceipttKey = goodReceipt ? goodReceipt : "";
                        var key = orderNumber + "-" + itemNumber + "-" + goodReceipttKey;
                        itemAlreadySet = typeof addedItems[key] !== "undefined";
                    }
                    return itemAlreadySet;
                }
                function cleanUpPOItemsTable() {
                    dialogItems.GetControl("POItems__").SetItemCount(0);
                    dialog.HideTab(curOrderItemsTabLabel, true);
                }
                function waitCounter(bActive) {
                    var waitingCtrl = dialog.GetControl("waitingIcon");
                    if (bActive) {
                        mainControl.Wait(true, Language.Translate("_Number of po line items added: {0}", true, recordAdded));
                        if (dialogOptions.windowed &&
                            waitingCtrl) {
                            waitingCtrl.Wait(true, Language.Translate("_Number of po line items added: {0}", true, recordAdded));
                        }
                    }
                    else {
                        mainControl.Wait(false);
                        if (dialogOptions.windowed &&
                            waitingCtrl) {
                            waitingCtrl.Wait(false);
                        }
                    }
                }
                function closeDialog() {
                    CleanUpLineItems();
                    dialog.Cancel();
                }
            }
            BrowsePO.BrowsePurchaseOrders = BrowsePurchaseOrders;
            function AddOrderNumber(value) {
                var g_multiValuesSeparator = ",";
                var values = Lib.AP.GetOrderOrGoodIssueAsArray("OrderNumber__");
                if (values && values.indexOf(value) === -1) {
                    values.push(value);
                    Controls.OrderNumber__.SetValue(values.join(g_multiValuesSeparator));
                }
            }
            BrowsePO.AddOrderNumber = AddOrderNumber;
            function fillCustomizedGRItems(lineItemMap, queryValue, iRecord) {
                //ajout des champs custom
                var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                if (customDimensions && customDimensions.grItems) {
                    customDimensions.grItems.forEach(function (dimension) {
                        lineItemMap[dimension.nameInTable.toUpperCase()] = queryValue.GetQueryValue(dimension.nameInTable, iRecord);
                    });
                }
            }
        })(BrowsePO = AP.BrowsePO || (AP.BrowsePO = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
