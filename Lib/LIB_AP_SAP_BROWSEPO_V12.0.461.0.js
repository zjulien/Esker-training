/* LIB_DEFINITION{
  "name": "LIB_AP_SAP_BrowsePO_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "SAP purchase orders browser",
  "require": [
    "Sys/Sys_Helpers_Browse",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_Date",
    "Lib_P2P_V12.0.461.0",
    "Lib_AP_SAP_V12.0.461.0",
    "Lib_AP_SAP_PurchaseOrder_Client_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var BrowsePO;
            (function (BrowsePO) {
                function BrowsePurchaseOrders(control, AddLineItem, CleanUpLineItems, GetTaxRateForItemList, FormLayoutHelper) {
                    control.Wait(true);
                    var isIE = navigator.appVersion.indexOf("Trident/") > -1 || navigator.appVersion.indexOf("Edge") > -1;
                    var defaultPopupDialogOptions = {
                        windowed: !isIE,
                        top: 100,
                        left: 100,
                        innerWidth: 1550,
                        innerHeight: 710
                    };
                    // To perform a search when the browse dialog is opening
                    var searchAtOpening = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowsePO.Common.RunPOSearchOnLoad") || false;
                    var browseTitle = "_Purchase orders";
                    var orderItemsTabLabel = "_Purchase order items";
                    var invoiceCurrency = Controls.InvoiceCurrency__.GetValue();
                    var searchControlFocused = false;
                    var dialog = null;
                    var dialogResults = null;
                    var dialogItems = null;
                    // Number of records per Page
                    var rowcountperpage = 10;
                    // Maximum of records retrieved by the query
                    var rowcount = 20;
                    var sapQueryChunkSize = rowcount;
                    var requestEnabled = true;
                    var isGRLimitReached = false;
                    // Switch to false if you do not want completely invoiced GR lines to be added on the form
                    var addInvoicedGRIVLines = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.AddInvoicedGRIVLines") !== false;
                    var currentSearchParameters = {
                        purchaseOrders: null,
                        deliveryNotes: null,
                        allPORetrieved: false,
                        currentChunk: 0,
                        searchByDN: false,
                        queryTable: "",
                        queryFields: "",
                        queryFilter: ""
                    };
                    // Column configuration
                    var columns = [
                        {
                            id: "ViewPOHeaderDetail__",
                            label: " ",
                            type: "LINK",
                            width: 80,
                            initControlCallback: function () {
                                this.SetText("_ViewItems");
                                this.SetURL("");
                            }
                        },
                        {
                            id: "AddPOHeader__",
                            label: " ",
                            type: "LINK",
                            width: 60,
                            initControlCallback: function () {
                                this.SetText("_Add");
                                this.SetURL("");
                            }
                        },
                        { id: "VendorNumber__", label: "_Vendor number", type: "STR", width: 190, orderBy: "DESC" },
                        { id: "OrderNumber__", label: "_Order number", type: "STR", width: 80, orderBy: "DESC" },
                        { id: "OrderedAmount__", label: "_Ordered amount", type: "DECIMAL", width: 200 },
                        { id: "DeliveredAmount__", label: "_Delivered amount", type: "DECIMAL", width: 200 },
                        { id: "InvoicedAmount__", label: "_Invoiced amount", type: "DECIMAL", width: 200 },
                        { id: "PlannedDeliveryCostsAmount__", label: "_PlannedDeliveryCostsAmount", type: "DECIMAL", width: 90 },
                        { id: "OrderDate__", label: "_Order date", type: "DATE", width: 130 }
                    ];
                    // Search criterion configuration
                    var searchCriterias = [
                        { id: "CompCodeFilter__", label: "_CompanyCode", type: "STR", required: true, toUpper: false, visible: false, filterId: "BUKRS", filterType: "EQUALSOREMPTY", defaultValue: Controls.CompanyCode__.GetValue() },
                        { id: "VendorNumberFilter__", label: "_Vendor number", type: "STR", required: false, toUpper: false, visible: true, filterId: "LIFNR", filterType: "EQUALS", defaultValue: Controls.VendorNumber__.GetValue(), defaultValueFormat: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10), width: 264 },
                        { id: "OrderNumberFilter__", label: "_Order number filter", type: "STR", required: false, toUpper: false, visible: true, filterId: "EBELN", filterType: "IN", defaultValue: "", defaultValueFormat: defaultPOSearchValueFormat, width: 264 },
                        { id: "DeliveryNoteFilter__", label: "_Delivery note", type: "STR", required: false, toUpper: false, visible: true, filterId: "XBLNR", filterType: "IN", defaultValue: "", width: 264 },
                        { id: "OrderDateFromFilter__", label: "_From", type: "DATE", required: false, toUpper: false, visible: true, filterId: "BEDAT", filterType: "GREATEROREQUAL" },
                        { id: "OrderDateToFilter__", label: "_To", type: "DATE", required: false, toUpper: false, visible: true, filterId: "BEDAT", filterType: "LOWEROREQUAL" }
                    ];
                    if (!Controls.CompanyCode__.GetValue()) {
                        Log.Error("No Company code please select a company code first");
                        Popup.Snackbar({
                            message: Language.Translate("_Please choose a company code first.", false),
                            status: "warning",
                            inDialog: browseTitle
                        });
                        control.Wait(false);
                    }
                    else {
                        var dialogOptions = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeBrowseParameters", defaultPopupDialogOptions) || defaultPopupDialogOptions;
                        dialogOptions.beforeOpening = function () {
                            FormLayoutHelper.MakePanelsReadOnlyForBrowsePOOpening();
                        };
                        dialogOptions.beforeClosing = function () {
                            FormLayoutHelper.RestorePanelsReadOnlyForBrowsePOClosing();
                        };
                        Popup.Dialog(browseTitle, control, fillSearchDialog, null, null, handleSearchDialog, CleanUpLineItems, null, dialogOptions);
                        if (dialogOptions.windowed) {
                            control.Wait(false);
                        }
                    }
                    function disableSearch() {
                        requestEnabled = false;
                        var waitingIcon = dialog.GetControl("waitingIcon");
                        if (waitingIcon) {
                            waitingIcon.Hide(false);
                        }
                        var searchButton = dialog.GetControl("searchButton");
                        if (searchButton) {
                            searchButton.Hide(true);
                        }
                    }
                    function enableSearch() {
                        if (dialog) {
                            var waitingIcon = dialog.GetControl("waitingIcon");
                            if (waitingIcon) {
                                waitingIcon.Hide(true);
                            }
                            var searchButton = dialog.GetControl("searchButton");
                            if (searchButton) {
                                searchButton.Hide(false);
                            }
                            if (dialogResults &&
                                dialogResults.GetControl("maxRecords_resultTable") &&
                                dialogResults.GetControl("resultTable")) {
                                dialogResults.GetControl("maxRecords_resultTable").Hide(dialogResults.GetControl("resultTable").GetItemCount() < rowcount);
                            }
                        }
                        requestEnabled = true;
                    }
                    function onlyShowOpenOrders() {
                        var ctrl = dialog.GetControl("searchCriteria_onlyShowOpenOrders__");
                        return ctrl && ctrl.IsChecked();
                    }
                    function defaultPOSearchValueFormat(id) {
                        var arr = id.split(',');
                        for (var i = 0; i < arr.length; i++) {
                            arr[i] = Sys.Helpers.String.SAP.NormalizeID(arr[i], 10);
                        }
                        return arr.join(',');
                    }
                    function refreshPOListTab() {
                        Sys.Helpers.Browse.ResetTable(dialogResults);
                        if (currentSearchParameters.purchaseOrders) {
                            var onlyOpenItem = onlyShowOpenOrders();
                            var popupTable = dialogResults.GetControl("resultTable");
                            if (popupTable) {
                                for (var i = 0; i < currentSearchParameters.purchaseOrders.length && popupTable.GetItemCount() < rowcount; i++) {
                                    var poNumber = currentSearchParameters.purchaseOrders[i];
                                    var po = Lib.AP.SAP.PurchaseOrder.cachePODetails[Lib.AP.SAP.PurchaseOrder.GetPODetailsCacheKey(poNumber, invoiceCurrency)].po;
                                    if (po && (!onlyOpenItem || Lib.AP.SAP.PurchaseOrder.IsOpenInvoice(po))) {
                                        var lineItem = popupTable.AddItem();
                                        lineItem.SetValue("VendorNumber__", po.PO_HEADER.VENDOR);
                                        lineItem.SetValue("OrderNumber__", poNumber);
                                        lineItem.SetValue("OrderedAmount__", Lib.AP.RoundWithDefaultPrecision(po.refOrderedAmount));
                                        lineItem.SetValue("DeliveredAmount__", Lib.AP.RoundWithDefaultPrecision(po.refDeliveredAmount));
                                        lineItem.SetValue("InvoicedAmount__", Lib.AP.RoundWithDefaultPrecision(po.refInvoicedAmount));
                                        lineItem.SetValue("PlannedDeliveryCostsAmount__", Lib.AP.RoundWithDefaultPrecision(po.refPlannedDeliveryCostsAmount));
                                        lineItem.SetValue("OrderDate__", Sys.Helpers.Date.SapDate2DBDate(po.OrderDate));
                                        addCustomDimensions(po, lineItem, null);
                                    }
                                }
                                if (!currentSearchParameters.allPORetrieved && onlyOpenItem && popupTable.GetItemCount() < rowcount) {
                                    currentSearchParameters.currentChunk++;
                                    getNextPOChunk();
                                }
                            }
                        }
                    }
                    /** @this getVendorPOListCallback */
                    function getVendorPOListCallback() {
                        var results = this.GetQueryValue();
                        if (results.ERRORS && results.ERRORS.length > 0) {
                            Popup.Snackbar({
                                message: Language.Translate(results.ERRORS[0].err, false),
                                status: "error",
                                inDialog: browseTitle
                            });
                            enableSearch();
                        }
                        else if (results.Records && results.Records.length > 0 && dialog) {
                            // predefinition of GetNextPo - implemented later in the code
                            var GetNextPo_1;
                            var idx_1 = 0;
                            var invoiceCurrency_1 = Data.GetValue("InvoiceCurrency__");
                            results.Records.sort(function (a, b) {
                                // First record value is the PO number
                                return Number(a[0]) - Number(b[0]);
                            });
                            var DisplayPo_1 = function (po, poNumber) {
                                if (dialog && dialogResults) {
                                    var resultMessageCtrl = dialogResults.GetControl("resultMessage");
                                    if (resultMessageCtrl) {
                                        resultMessageCtrl.SetText("");
                                    }
                                    if (po && (!onlyShowOpenOrders() || Lib.AP.SAP.PurchaseOrder.IsOpenInvoice(po))) {
                                        var popupTable = dialogResults.GetControl("resultTable");
                                        if (popupTable) {
                                            var itemCount = popupTable.GetItemCount();
                                            popupTable.SetItemCount(itemCount + 1);
                                            var lineItem = popupTable.GetItem(itemCount);
                                            if (lineItem) {
                                                lineItem.SetValue("VendorNumber__", po.PO_HEADER.VENDOR);
                                                lineItem.SetValue("OrderNumber__", poNumber);
                                                lineItem.SetValue("OrderedAmount__", Lib.AP.RoundWithDefaultPrecision(po.refOrderedAmount));
                                                lineItem.SetValue("DeliveredAmount__", Lib.AP.RoundWithDefaultPrecision(po.refDeliveredAmount));
                                                lineItem.SetValue("InvoicedAmount__", Lib.AP.RoundWithDefaultPrecision(po.refInvoicedAmount));
                                                lineItem.SetValue("PlannedDeliveryCostsAmount__", Lib.AP.RoundWithDefaultPrecision(po.refPlannedDeliveryCostsAmount));
                                                lineItem.SetValue("OrderDate__", Sys.Helpers.Date.SapDate2DBDate(po.OrderDate));
                                                addCustomDimensions(po, lineItem, null);
                                            }
                                            popupTable.Hide(false);
                                        }
                                    }
                                    GetNextPo_1();
                                }
                            };
                            GetNextPo_1 = function () {
                                if (dialog) {
                                    currentSearchParameters.allPORetrieved = results.Records.length < sapQueryChunkSize;
                                    var popupTable = dialogResults.GetControl("resultTable");
                                    if (idx_1 < results.Records.length && popupTable && popupTable.GetItemCount() < rowcount) {
                                        // get detail for retrieved po
                                        var poNumber = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(results.GetQueryValue("EBELN", idx_1));
                                        // If we try to retrieve PO through delivery notes, we store the retrieved delivery notes numbers.
                                        if (currentSearchParameters.searchByDN) {
                                            var deliveryNote = results.GetQueryValue("XBLNR", idx_1);
                                            if (deliveryNote && currentSearchParameters.deliveryNotes.indexOf(deliveryNote) === -1) {
                                                currentSearchParameters.deliveryNotes.push(deliveryNote);
                                            }
                                        }
                                        idx_1++;
                                        // Do not add a PO if it had already been added (in case of a search by delivery note)
                                        if (poNumber && currentSearchParameters.purchaseOrders.indexOf(poNumber) === -1) {
                                            currentSearchParameters.purchaseOrders.push(poNumber);
                                            Lib.AP.SAP.PurchaseOrder.SetLastError(null);
                                            Lib.AP.SAP.PurchaseOrder.GetDetails(DisplayPo_1, poNumber, invoiceCurrency_1);
                                        }
                                        else {
                                            GetNextPo_1();
                                        }
                                    }
                                    // get another PO chunk ?
                                    else if (!currentSearchParameters.allPORetrieved && idx_1 >= sapQueryChunkSize) {
                                        currentSearchParameters.currentChunk++;
                                        getNextPOChunk();
                                    }
                                    else {
                                        // ending
                                        enableSearch();
                                    }
                                }
                            };
                            GetNextPo_1();
                        }
                        else {
                            // Nothing found in new chunk: ending
                            enableSearch();
                        }
                    }
                    function getNextPOChunk() {
                        if (dialog) {
                            Lib.AP.SAP.SAPQuery(getVendorPOListCallback, Variable.GetValueAsString("SAPConfiguration"), currentSearchParameters.queryTable, currentSearchParameters.queryFields, currentSearchParameters.queryFilter, sapQueryChunkSize, currentSearchParameters.currentChunk * sapQueryChunkSize);
                        }
                    }
                    function fillSearchDialogBase(newDialog) {
                        // callback from base dialog
                        dialog = newDialog;
                        dialog.HideDefaultButtons(true);
                        // Hide Vendor and Company code filters (2 first search criteria)
                        var hiddenFields = searchCriterias.slice(0, 1);
                        Sys.Helpers.Browse.AddSearchCriteriaFields(newDialog, hiddenFields);
                        var controlsGrid = [
                            [
                                { type: "Text", label: "_Vendor number", id: "VendorNumberFilter__", width: 132 },
                                { type: "Date", label: "_From", id: "OrderDateFromFilter__" },
                                { type: "Button", label: "_Search", id: "searchButton", addHiddenWaitingIcon: "waitingIcon", rowSpan: 2 }
                            ],
                            [
                                { type: "Text", label: "_Delivery note", id: "DeliveryNoteFilter__", width: 132 },
                                { type: "Date", label: "_To", id: "OrderDateToFilter__" }
                            ],
                            [
                                { type: "Text", label: "_Order number filter", id: "OrderNumberFilter__", width: 132 },
                                { type: "CheckBox", label: "_Only show open orders/items", id: "onlyShowOpenOrders__" }
                            ]
                        ];
                        Sys.Helpers.Browse.AddGridCriterias(newDialog, controlsGrid);
                        var ctrlOnlyShow = dialog.GetControl("searchCriteria_onlyShowOpenOrders__");
                        ctrlOnlyShow.Check();
                        Sys.Helpers.Browse.AddMessageController(newDialog);
                        dialog.AddTab("ResultsListTab", Language.Translate("_Purchase order headers"), control, fillSearchDialog, null, null, handleSearchDialog, CleanUpLineItems);
                        dialog.AddTab("POItemsTab", orderItemsTabLabel, control, fillSearchDialog, null, null, handleSearchDialogPOItem, CleanUpLineItems);
                        // Specific behaviour
                        Sys.Helpers.Browse.AddCustomEventHandle("OnClick", "Close__", closeDialog);
                        // Copy Order number if already set in field
                        var orderNumber = Controls.OrderNumber__.GetValue();
                        var searchOrderNumber = newDialog.GetControl("searchCriteria_OrderNumberFilter__");
                        if (orderNumber && searchOrderNumber && !searchOrderNumber.GetValue()) {
                            searchOrderNumber.SetText(orderNumber);
                        }
                        // Copy Vendor number if already set in field
                        var vendorNumber = Controls.VendorNumber__.GetValue();
                        var searchVendorNumber = newDialog.GetControl("searchCriteria_VendorNumberFilter__");
                        if (vendorNumber && searchVendorNumber && !searchVendorNumber.GetValue()) {
                            searchVendorNumber.SetText(vendorNumber);
                        }
                        if (vendorNumber && searchAtOpening) {
                            request();
                        }
                    }
                    function fillSearchDialogResults(newDialog) {
                        dialogResults = newDialog;
                        var customDimensionsRL = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                        if (customDimensionsRL && customDimensionsRL.poSAPItems) {
                            var POItemCustomDimensions = [];
                            for (var key in customDimensionsRL.poSAPItems) {
                                if (key.match(/PO_HEADER|PO_ADDRESS/) && customDimensionsRL.poSAPItems[key] && customDimensionsRL.poSAPItems[key].length) {
                                    Array.prototype.push.apply(POItemCustomDimensions, customDimensionsRL.poSAPItems[key]);
                                }
                            }
                            for (var indexCustomPoItem = 0; indexCustomPoItem < POItemCustomDimensions.length; indexCustomPoItem++) {
                                var poItem = POItemCustomDimensions[indexCustomPoItem];
                                var label = poItem.nameInForm;
                                var type = "STR";
                                var hidden = true;
                                var width = 130;
                                if (Controls.LineItems__[poItem.nameInForm]) {
                                    label = Controls.LineItems__[poItem.nameInForm].GetLabel();
                                    type = Controls.LineItems__[poItem.nameInForm].GetType();
                                }
                                if (poItem.fieldPropertiesInBrowsePage) {
                                    hidden = !poItem.fieldPropertiesInBrowsePage.isVisible;
                                    width = poItem.fieldPropertiesInBrowsePage.width || width;
                                }
                                columns.push({ id: poItem.nameInSAP, label: label, type: type, width: width, hidden: hidden });
                            }
                        }
                        Sys.Helpers.Browse.AddResults(dialogResults, columns, rowcount, rowcountperpage, "", false);
                        dialogResults.GetControl("maxRecords_resultTable").Hide(true);
                        // Specific behaviour
                        Sys.Helpers.Browse.AddCustomEventHandle("OnClick", "ViewPOHeaderDetail__", viewHeaderDetail);
                        Sys.Helpers.Browse.AddCustomEventHandle("OnClick", "AddPOHeader__", addPOHeader);
                    }
                    function fillSearchDialogPOItems(newDialog) {
                        dialogItems = newDialog;
                        // Additional table for PO items
                        var itemColumns = [
                            { id: "AddPOItem__", label: " ", type: "LINK", width: 42 },
                            { id: "ItemNumber__", label: "_Item number", type: "STR", width: 80 },
                            { id: "Description__", label: "_Description", type: "STR", width: 300 },
                            { id: "OrderedAmount__", label: "_Ordered amount", type: "DECIMAL", width: 90 },
                            { id: "OrderedQuantity__", label: "_Ordered quantity", type: "DECIMAL", width: 90 },
                            { id: "DeliveredAmount__", label: "_Delivered amount", type: "DECIMAL", width: 90 },
                            { id: "DeliveredQuantity__", label: "_Delivered quantity", type: "DECIMAL", width: 90 },
                            { id: "InvoicedAmount__", label: "_Invoiced amount", type: "DECIMAL", width: 90 },
                            { id: "InvoicedQuantity__", label: "_Invoiced quantity", type: "DECIMAL", width: 90 },
                            { id: "GRIV__", label: "_GRIV", type: "BOOLEAN", width: 40 },
                            { id: "TaxCode__", label: "_Tax code", type: "STR", width: 50 },
                            { id: "VendorNumber__", label: "_Vendor number", type: "STR", hidden: true },
                            { id: "OrderNumber__", label: "_Order number", type: "STR", hidden: true },
                            { id: "UnitPrice__", label: "_Unit price", type: "DECIMAL", hidden: true },
                            { id: "PartNumber__", label: "_Part number", type: "STR", hidden: true },
                            { id: "PriceCondition__", label: "_PriceCondition", type: "STR", width: 90 }
                        ];
                        var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                        if (customDimensions && customDimensions.poSAPItems) {
                            var POItemCustomDimensions = [];
                            for (var key in customDimensions.poSAPItems) {
                                if (!key.match(/PO_HEADER|PO_ADDRESS/) && customDimensions.poSAPItems[key] && customDimensions.poSAPItems[key].length) {
                                    Array.prototype.push.apply(POItemCustomDimensions, customDimensions.poSAPItems[key]);
                                }
                            }
                            for (var indexCustomPoItem = 0; indexCustomPoItem < POItemCustomDimensions.length; indexCustomPoItem++) {
                                var poItem = POItemCustomDimensions[indexCustomPoItem];
                                var label = poItem.nameInForm;
                                var type = "STR";
                                var hidden = true;
                                var width = 130;
                                if (Controls.LineItems__[poItem.nameInForm]) {
                                    label = Controls.LineItems__[poItem.nameInForm].GetLabel();
                                    type = Controls.LineItems__[poItem.nameInForm].GetType();
                                }
                                if (poItem.fieldPropertiesInBrowsePage) {
                                    hidden = !poItem.fieldPropertiesInBrowsePage.isVisible;
                                    width = poItem.fieldPropertiesInBrowsePage.width || width;
                                }
                                itemColumns.push({ id: poItem.nameInSAP, label: label, type: type, width: width, hidden: hidden });
                            }
                        }
                        Sys.Helpers.Browse.AddTable(dialogItems, "POItems__", itemColumns, rowcountperpage);
                        // Hide tab
                        dialog.HideTab(orderItemsTabLabel, true);
                        // Specific behaviour
                        Sys.Helpers.Browse.AddCustomEventHandle("OnClick", "AddPOItem__", addPOItem);
                    }
                    /* Draw and display the customer browse page */
                    function fillSearchDialog(newDialog, tabId) {
                        switch (tabId) {
                            case null:
                                fillSearchDialogBase(newDialog);
                                break;
                            case "ResultsListTab":
                                fillSearchDialogResults(newDialog);
                                break;
                            case "POItemsTab":
                                fillSearchDialogPOItems(newDialog);
                                break;
                            default:
                                Log.Error("Unknown tab: " + tabId);
                                break;
                        }
                    }
                    function getPOFilter(searchByDN) {
                        var extraFilters;
                        if (searchByDN) {
                            extraFilters = "( ( VGABE = 1 ) OR ( VGABE = 2 ) OR ( VGABE = 3 ) ) AND ( XBLNR NE ' ' )";
                        }
                        else {
                            extraFilters = "LOEKZ = ' ' AND ( BSTYP = 'F' OR BSTYP = 'L' )";
                        }
                        return Sys.Helpers.Browse.FiltersFromSearchCriterias(dialog, searchCriterias, extraFilters, true).join(" AND ");
                    }
                    function initCurrentSearchParameters() {
                        var searchByDN = Boolean(dialog.GetControl("searchCriteria_DeliveryNoteFilter__").GetText());
                        currentSearchParameters = {
                            searchByDN: searchByDN,
                            queryFilter: getPOFilter(searchByDN),
                            /* If a delivery note if specified the PO will be retrieved from the custom view ZESK_DELIV_NOTES.
                            ZESK_DELIV_NOTES is a join between EKKO and EKBE. It contains the delivery notes with some PO information (company code, vendor number...) */
                            queryTable: searchByDN ? "ZESK_DELIV_NOTES" : "EKKO",
                            queryFields: searchByDN ? "EBELN|BEDAT|BUKRS|WAERS|LIFNR|XBLNR" : "EBELN|BEDAT|BUKRS|WAERS|LIFNR",
                            currentChunk: 0,
                            allPORetrieved: false,
                            purchaseOrders: [],
                            deliveryNotes: []
                        };
                    }
                    /* Perform request */
                    function request() {
                        if (requestEnabled) {
                            // set focus on first tab and Hide items tab
                            dialogResults.FocusControl(dialogResults.GetControl("resultTable"));
                            dialog.HideTab(orderItemsTabLabel, true);
                            disableSearch();
                            Sys.Helpers.Browse.ResetTable(dialogResults);
                            var table = dialogItems.GetControl("POItems__");
                            if (table) {
                                table.SetItemCount(0);
                            }
                            initCurrentSearchParameters();
                            getNextPOChunk();
                        }
                    }
                    /* Handle event in customer browse page */
                    function handleSearchDialog(handleDialog, action, event, ctrl, tableItem) {
                        if (event === "OnChange" && ctrl.GetName() === "searchCriteria_onlyShowOpenOrders__") {
                            refreshPOListTab();
                            viewHeaderDetail();
                            return;
                        }
                        // Return selection is an empty function since we want to disable common browse helper behaviour
                        searchControlFocused = Sys.Helpers.Browse.HandleSearchDialog(handleDialog, action, event, ctrl, tableItem, searchControlFocused, request);
                    }
                    function handleSearchDialogPOItem(handleDialog, action, event, ctrl, tableItem) {
                        if (event === "OnRefreshRow" && ctrl.GetName() === "POItems__") {
                            var styleToAdd = "highlight-info";
                            var table = ctrl;
                            var row = table.GetRow(tableItem);
                            if (row) {
                                if (row.PriceCondition__.GetValue()) {
                                    row.AddPOItem__.SetText("");
                                    row.AddStyle(styleToAdd);
                                }
                                else {
                                    row.AddPOItem__.SetText("_Add");
                                    row.RemoveStyle(styleToAdd);
                                }
                            }
                        }
                        searchControlFocused = Sys.Helpers.Browse.HandleSearchDialog(handleDialog, action, event, ctrl, tableItem, searchControlFocused, request);
                    }
                    function itemShouldBeAdded(po, itemNumber) {
                        if (onlyShowOpenOrders() && !Lib.AP.SAP.PurchaseOrder.IsOpenInvoiceItem(po.PO_ITEMS[itemNumber])) {
                            return false;
                        }
                        return !currentSearchParameters.searchByDN || itemIsInRetrievedDeliveryNotes(po, itemNumber);
                    }
                    function itemIsInRetrievedDeliveryNotes(po, itemNumber) {
                        // return true if the item is referenced in one of the retrieved delivery notes
                        var poItemHistory = po.PO_ITEM_HISTORY;
                        for (var i = 0; i < poItemHistory.length; i++) {
                            if (Lib.P2P.SAP.Soap.SAPValuesAreEqual(poItemHistory[i].PO_ITEM, itemNumber) &&
                                currentSearchParameters.deliveryNotes.indexOf(poItemHistory[i].REF_DOC_NO) !== -1) {
                                return true;
                            }
                        }
                        return false;
                    }
                    function addedItemList(po) {
                        var itemLists = [];
                        Object.keys(po.PO_ITEMS).forEach(function (key) {
                            if (itemShouldBeAdded(po, key)) {
                                itemLists.push(key);
                            }
                        });
                        return itemLists;
                    }
                    function addPOHeader(ctrl) {
                        var orderNumber = ctrl.GetRow().OrderNumber__.GetValue();
                        var cachePODetailsKey = Lib.AP.SAP.PurchaseOrder.GetPODetailsCacheKey(orderNumber, invoiceCurrency);
                        var bLineAdded = false;
                        if (Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePODetailsKey]) {
                            var po_1 = Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePODetailsKey].po;
                            var itemNumbers_1 = Object.keys(po_1.PO_ITEMS);
                            var AddPOItems = function () {
                                Controls.OrderNumber__.Wait(true);
                                Lib.AP.SAP.PurchaseOrder.GetHistoricsPerPurchasingDocumentForBrowse(orderNumber, null, po_1, currentSearchParameters.deliveryNotes, function (itemDetails, isLimitReached) {
                                    //Init vars
                                    isGRLimitReached = isLimitReached;
                                    itemNumbers_1.reduce(function (p, itemNumber) {
                                        return p.Then(function () {
                                            return Sys.Helpers.Promise.Create(function (resolve) {
                                                var item = po_1.PO_ITEMS[itemNumber];
                                                // If search is by delivery note, add an item only if it is referenced in one of the retrieved delivery notes
                                                if (item && itemShouldBeAdded(po_1, itemNumber)) {
                                                    addPOItemToLineItems(orderNumber, item.Po_Item, function (lineAdded) {
                                                        if (lineAdded) {
                                                            bLineAdded = lineAdded;
                                                        }
                                                        resolve();
                                                    }, false);
                                                }
                                                else {
                                                    resolve();
                                                }
                                            });
                                        });
                                    }, Sys.Helpers.Promise.Resolve())
                                        .Then(function () {
                                        if (isGRLimitReached) {
                                            var maxGR = Lib.AP.SAP.PurchaseOrder.maxGRLineLoop * Lib.AP.SAP.PurchaseOrder.maxQueryRecords;
                                            Popup.Snackbar({
                                                message: Language.Translate("_You reached GR limits of {0} lines", false, maxGR),
                                                status: "warning",
                                                inDialog: browseTitle
                                            });
                                        }
                                        finalizeAddPO(bLineAdded, orderNumber);
                                    });
                                }, false, addedItemList(po_1));
                            };
                            if (po_1.PoItemCount < 1000) {
                                AddPOItems();
                            }
                            else {
                                var options = {
                                    inDialog: browseTitle
                                };
                                Popup.Confirm(Language.Translate("_You are about to add a complete purchase order containing {0} lines", false, po_1.PoItemCount), false, AddPOItems, null, "_Warning", options);
                            }
                        }
                    }
                    function addCustomDimension(item, poItem, dimensionsArray) {
                        for (var indexCustomPoItem = 0; indexCustomPoItem < dimensionsArray.length; indexCustomPoItem++) {
                            var sapItem = dimensionsArray[indexCustomPoItem];
                            if (sapItem && !Sys.Helpers.IsEmpty(sapItem.nameInForm) && !Sys.Helpers.IsEmpty(sapItem.nameInSAP)) {
                                var itemValue = poItem[sapItem.nameInSAP] || "";
                                var formatter = sapItem.fieldFormatter;
                                if (itemValue && typeof formatter === "function") {
                                    itemValue = formatter(itemValue);
                                }
                                item.SetValue(sapItem.nameInSAP, itemValue);
                            }
                        }
                    }
                    function addCustomDimensions(po, item, poItem) {
                        var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                        if (customDimensions && customDimensions.poSAPItems) {
                            for (var _i = 0, _a = Object.keys(customDimensions.poSAPItems); _i < _a.length; _i++) {
                                var key = _a[_i];
                                var poDetailsElement = void 0;
                                switch (key) {
                                    case "PO_ITEMS":
                                        poDetailsElement = poItem;
                                        break;
                                    case "PO_HEADER":
                                    case "PO_ADDRESS":
                                        poDetailsElement = po[key];
                                        break;
                                    case "PO_ITEM_ACCOUNT_ASSIGNMENT":
                                        poDetailsElement = poItem ? Lib.AP.SAP.PurchaseOrder.GetAccountAssignmentInfo(po[key], poItem) : null;
                                        break;
                                    default:
                                        Log.Error("customDimensions.poSAPItems." + key + " not supported yet in GetCustomDimensions");
                                }
                                if (poDetailsElement && customDimensions.poSAPItems[key] && customDimensions.poSAPItems[key].length) {
                                    addCustomDimension(item, poDetailsElement, customDimensions.poSAPItems[key]);
                                }
                            }
                        }
                    }
                    // Remove style for delivery costs lines
                    function RemovePlannedDeliveryCostsStyle(table) {
                        if (table.GetItemCount() > 0) {
                            for (var i = 0; i < table.GetItemCount(); i++) {
                                if (table.GetRow(i)) {
                                    table.GetRow(i).RemoveStyle("highlight-info");
                                }
                            }
                        }
                    }
                    function FillTableWithPOItems(table, po) {
                        function addItem(poDetails, poTable, poItem, isPdc) {
                            var item = poTable.AddItem();
                            item.SetValue("ItemNumber__", poItem.Po_Item);
                            item.SetValue("Description__", poItem.Short_Text);
                            item.SetValue("OrderedAmount__", isPdc ? "" : Lib.AP.RoundWithDefaultPrecision(poItem.refOrderedAmount));
                            item.SetValue("OrderedQuantity__", poItem.Quantity);
                            item.SetValue("DeliveredAmount__", Lib.AP.RoundWithDefaultPrecision(poItem.refDeliveredAmount));
                            item.SetValue("DeliveredQuantity__", poItem.Deliv_Qty);
                            item.SetValue("InvoicedAmount__", Lib.AP.RoundWithDefaultPrecision(poItem.refInvoicedAmount));
                            item.SetValue("InvoicedQuantity__", poItem.Iv_Qty);
                            item.SetValue("GRIV__", poItem.Gr_Basediv);
                            item.SetValue("TaxCode__", poItem.Tax_Code);
                            item.SetValue("VendorNumber__", poItem.Vendor);
                            item.SetValue("OrderNumber__", poItem.Po_Number);
                            item.SetValue("UnitPrice__", Lib.AP.RoundWithDefaultPrecision(poItem.refPriceUnit));
                            item.SetValue("PartNumber__", poItem.Material);
                            item.SetValue("PriceCondition__", isPdc ? poItem.Cond_Type : "");
                            addCustomDimensions(poDetails, item, poItem);
                        }
                        function addPdcItems(poDetails, poTable, poItem) {
                            if (poItem.Po_Number && poItem.Po_Item) {
                                for (var _i = 0, _a = poDetails.PlannedDeliveryCosts; _i < _a.length; _i++) {
                                    var pdc = _a[_i];
                                    if (Lib.P2P.SAP.Soap.SAPValuesAreEqual(pdc.Po_Number, poItem.Po_Number) &&
                                        Lib.P2P.SAP.Soap.SAPValuesAreEqual(pdc.Po_Item, poItem.Po_Item)) {
                                        addItem(poDetails, poTable, pdc, true);
                                    }
                                }
                            }
                        }
                        for (var itemNumber in po.PO_ITEMS) {
                            // If search is by delivery note, add an item only if it is referenced in one of the retrieved delivery notes
                            if (itemShouldBeAdded(po, itemNumber)) {
                                var poItem = po.PO_ITEMS[itemNumber];
                                addItem(po, table, poItem, false);
                                if (po.PlannedDeliveryCosts && po.PlannedDeliveryCosts.length) {
                                    addPdcItems(po, table, poItem);
                                }
                            }
                        }
                    }
                    function viewHeaderDetail(ctrl) {
                        var orderNumber = currentSearchParameters.selectedOrderNumber;
                        if (ctrl) {
                            orderNumber = ctrl.GetRow().OrderNumber__.GetValue();
                            currentSearchParameters.selectedOrderNumber = orderNumber;
                        }
                        if (orderNumber) {
                            var cachePODetailsKey = Lib.AP.SAP.PurchaseOrder.GetPODetailsCacheKey(orderNumber, invoiceCurrency);
                            var po = Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePODetailsKey].po;
                            var table = dialogItems.GetControl("POItems__");
                            var tabLabel = Language.Translate("_Purchase order items for {0}", false, orderNumber);
                            if (dialog.ChangeTabLabel(orderItemsTabLabel, tabLabel)) {
                                orderItemsTabLabel = tabLabel;
                            }
                            if (ctrl) {
                                // show and set focus on second tab
                                dialog.HideTab(orderItemsTabLabel, false);
                                dialogItems.FocusControl(dialogItems.GetControl("POItems__"));
                            }
                            RemovePlannedDeliveryCostsStyle(table);
                            table.SetItemCount(0);
                            FillTableWithPOItems(table, po);
                            table.GetColumnControl(1).SetURL("");
                        }
                    }
                    function addPOItemToLineItems(orderNumber, itemNumber, callback, addPOItemAction) {
                        var bLineAdded = false;
                        var cachePODetailsKey = Lib.AP.SAP.PurchaseOrder.GetPODetailsCacheKey(orderNumber, invoiceCurrency);
                        var poDetails = Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePODetailsKey];
                        if (poDetails) {
                            var po = poDetails.po;
                            var poItem = po.PO_ITEMS[itemNumber];
                            if (poItem.Gr_Basediv) {
                                if (!Controls.GRIV__.IsChecked()) {
                                    Controls.GRIV__.Check();
                                    Controls.LineItems__.DeliveryNote__.Hide(false);
                                }
                                // Get items for each goods receipts
                                Controls.OrderNumber__.Wait(true);
                                addGRItemsToLineItems(orderNumber, itemNumber, po, poItem, callback, addPOItemAction);
                            }
                            else {
                                if (!isItemAlreadySet(orderNumber, itemNumber)) {
                                    parseAccountAssignement(poItem, po);
                                    bLineAdded = true;
                                }
                                if (callback) {
                                    callback(bLineAdded, orderNumber, itemNumber);
                                }
                            }
                            Lib.AP.SAP.SetPaymentTermsFromPO(po);
                        }
                    }
                    function addGRItemsToLineItems(orderNumber, itemNumber, po, poItem, callback, addPOItemAction) {
                        Lib.AP.SAP.PurchaseOrder.GetHistoricsPerPurchasingDocumentForBrowse(orderNumber, po.ORIGINALS_PO_ITEM[poItem.Po_Item], po, currentSearchParameters.deliveryNotes, function (items) {
                            var bLineAdded = false;
                            var maxLines = 300;
                            var nbLinesAdded = 0;
                            for (var grItemsIdx = 0; grItemsIdx < items.length; grItemsIdx++) {
                                var item = items[grItemsIdx];
                                // If search is by delivery note, add an item only if it is referenced in one of the retrieved delivery notes
                                if (!isItemAlreadySet(orderNumber, itemNumber, item.Ref_Doc) && (addInvoicedGRIVLines || item.refExpectedQuantity > 0 || !onlyShowOpenOrders())) {
                                    parseAccountAssignement(item, po);
                                    bLineAdded = true;
                                    if (++nbLinesAdded >= maxLines) {
                                        break;
                                    }
                                }
                            }
                            callback(bLineAdded, orderNumber, itemNumber);
                        }, addPOItemAction, addedItemList(po));
                    }
                    function parseAccountAssignement(item, po) {
                        var isItemAdded = false;
                        Sys.Helpers.Array.ForEach(po.PO_ITEM_ACCOUNT_ASSIGNMENT, function (poAcctAss) {
                            if (Lib.P2P.SAP.Soap.SAPValuesAreEqual(poAcctAss.PO_ITEM, item.Po_Item)) {
                                isItemAdded = true;
                                var tempPo = Sys.Helpers.Clone(po);
                                tempPo.PO_ITEM_ACCOUNT_ASSIGNMENT = [];
                                tempPo.PO_ITEM_ACCOUNT_ASSIGNMENT[0] = poAcctAss;
                                AddLineItem(item, tempPo);
                            }
                        });
                        if (!isItemAdded) {
                            AddLineItem(item, po);
                        }
                    }
                    function addDeliveryCostsLines(orderNumber, itemNumber) {
                        var cachePODetailsKey = Lib.AP.SAP.PurchaseOrder.GetPODetailsCacheKey(orderNumber, invoiceCurrency);
                        var po = Lib.AP.SAP.PurchaseOrder.cachePODetails[cachePODetailsKey].po;
                        if (po.PlannedDeliveryCosts && po.PlannedDeliveryCosts.length > 0) {
                            for (var _i = 0, _a = po.PlannedDeliveryCosts; _i < _a.length; _i++) {
                                var dc = _a[_i];
                                if ((!itemNumber ||
                                    Lib.P2P.SAP.Soap.SAPValuesAreEqual(itemNumber, dc.Po_Item)) &&
                                    !isItemAlreadySet(dc.Po_Number, dc.Po_Item, "", dc.Cond_Type)) {
                                    AddLineItem(dc, po);
                                }
                            }
                        }
                    }
                    function addPOItem(ctrl) {
                        var orderNumber = ctrl.GetRow().OrderNumber__.GetValue();
                        var itemNumber = ctrl.GetRow().ItemNumber__.GetValue();
                        addPOItemToLineItems(orderNumber, itemNumber, finalizeAddPO, true);
                    }
                    function finalizeAddPO(lineAdded, orderNumber, itemNumber) {
                        var currentOrderNumber = orderNumber;
                        var currentItemNumber = itemNumber;
                        addDeliveryCostsLines(orderNumber, itemNumber);
                        if (lineAdded) {
                            Lib.AP.AddOrderNumber(orderNumber);
                        }
                        GetTaxRateForItemList().then(function () {
                            CleanUpLineItems();
                            itemsCache = null;
                            var objNumber = currentOrderNumber;
                            var message = "";
                            if (currentItemNumber) {
                                objNumber = currentItemNumber;
                                message = lineAdded ? "_The line item #{0} has been added." : "_The line item #{0} has not been added.";
                            }
                            else {
                                message = lineAdded ? "_The line items have been updated with purchase order #{0}." : "_No items have been added for the purchase order #{0}.";
                            }
                            Popup.Snackbar({
                                message: Language.Translate(message, false, objNumber),
                                status: lineAdded ? "success" : "info",
                                inDialog: browseTitle
                            });
                            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowsePO.Common.OnFinalizeAddPoEnd", currentOrderNumber, currentItemNumber, dialog);
                            Controls.OrderNumber__.Wait(false);
                        });
                    }
                    function IsPOLineItem(item) {
                        return item.GetValue("LineType__") ? Lib.P2P.InvoiceLineItem.IsPOLineItem(item) : true;
                    }
                    function loadLinesCache() {
                        itemsCache = {};
                        // load lines
                        var cnt = Controls.LineItems__.GetItemCount();
                        for (var i = 0; i < cnt; i++) {
                            var item = Controls.LineItems__.GetItem(i);
                            if (IsPOLineItem(item)) {
                                var gr = item.GetValue("GoodsReceipt__");
                                var pc = item.GetValue("PriceCondition__");
                                var lineKey = item.GetValue("OrderNumber__") + item.GetValue("ItemNumber__") + (gr ? gr : "") + (pc ? pc : "");
                                itemsCache[lineKey] = true;
                            }
                        }
                    }
                    var itemsCache = {};
                    function isItemAlreadySet(orderNumber, itemNumber, goodReceipt, conditionType) {
                        if (!itemsCache || Sys.Helpers.Object.IsEmptyPlainObject(itemsCache)) {
                            loadLinesCache();
                        }
                        var key = "".concat(orderNumber).concat(itemNumber).concat(goodReceipt ? goodReceipt : "").concat(conditionType ? conditionType : "");
                        if (itemsCache[key]) {
                            return true;
                        }
                        return false;
                    }
                    function closeDialog() {
                        CleanUpLineItems();
                        dialog.Cancel();
                        dialog = null;
                    }
                }
                BrowsePO.BrowsePurchaseOrders = BrowsePurchaseOrders;
            })(BrowsePO = SAP.BrowsePO || (SAP.BrowsePO = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
