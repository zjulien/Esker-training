///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Clipboard_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_OnDemand_Users",
    "Lib_P2P_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_PRLineItems_V12.0.461.0",
    "Lib_Purchasing_ShipTo_V12.0.461.0",
    "Lib_Purchasing_LayoutPR_V12.0.461.0",
    "[Lib_PR_Customization_Client]",
    "Sys/Sys_TechnicalData"
  ]
}*/
// Common interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Clipboard;
        (function (Clipboard) {
            /**
            * @class An help class to manage layout
            */
            var LayoutHelper = {
                currentLayout: null,
                disableGroup: {},
                buttonsDisabled: 0,
                AreBoutonsDisabled: function () {
                    return LayoutHelper.buttonsDisabled > 0;
                },
                DisableButtons: function (disable, group) {
                    //const currentState = LayoutHelper.AreBoutonsDisabled();
                    var groupName = group || "*";
                    if (disable) {
                        LayoutHelper.buttonsDisabled++;
                        if (LayoutHelper.disableGroup[groupName] && LayoutHelper.disableGroup[groupName].count) {
                            LayoutHelper.disableGroup[groupName].count++;
                        }
                        else {
                            LayoutHelper.disableGroup[groupName] = {
                                count: 1
                            };
                        }
                    }
                    else {
                        LayoutHelper.buttonsDisabled--;
                        if (!LayoutHelper.disableGroup[groupName]) {
                            Log.Error("Enabling of buttons on a unitialized group '".concat(groupName, "'"));
                        }
                        else if (LayoutHelper.disableGroup[groupName].count === 0) {
                            Log.Warn("Enabling of buttons from group '".concat(groupName, "' is call too often."));
                        }
                        else {
                            LayoutHelper.disableGroup[groupName].count--;
                        }
                    }
                }
            };
            Clipboard.LoadClipboard = {
                // By default, the mapping will be built based on the header line
                mapping: null,
                noMapping: [],
                noMappingKey: "_Load clipboard no mapping",
                rawData: "",
                showPaste: true,
                showPreview: false,
                data: null,
                itemTypes: null,
                comboMap: {},
                reversedComboMap: {},
                mappingComboValues: [],
                availableColumns: null,
                mappingCtrls: null,
                init: function () {
                    // Try to get mapping from user exit
                    // Else use the one from the parameters
                    // Else autodetermine mapping from header line
                    var loadClipboardMapping = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.GetLineItemsImporterMapping");
                    if (Clipboard.LoadClipboard.checkMapping(loadClipboardMapping)) {
                        Clipboard.LoadClipboard.mapping = loadClipboardMapping;
                        Log.Info("LoadClipboard - Using mapping from users exit");
                    }
                    else {
                        Clipboard.LoadClipboard.mapping = { columns: [] };
                        // Try to load mapping from vendor parameters
                        var lineItemsImporterMapping = Variable.GetValueAsString("LineItemsImporterMapping");
                        if (lineItemsImporterMapping) {
                            try {
                                Clipboard.LoadClipboard.mapping = Sys.Helpers.ParseObject(lineItemsImporterMapping);
                                Log.Info("LoadClipboard - Using mapping from parameters table");
                            }
                            catch (err) {
                                Log.Warn("LoadClipboard - Line items importer mapping, wrong JSON format");
                            }
                        }
                    }
                    Clipboard.LoadClipboard.noMapping = [];
                    Clipboard.LoadClipboard.rawData = "";
                    Clipboard.LoadClipboard.showPaste = true;
                    Clipboard.LoadClipboard.showPreview = false;
                    Clipboard.LoadClipboard.data = null;
                    Clipboard.LoadClipboard.comboMap = {};
                    Clipboard.LoadClipboard.reversedComboMap = {};
                    Clipboard.LoadClipboard.mappingComboValues = [Clipboard.LoadClipboard.noMappingKey];
                },
                addColumnInMap: function (c) {
                    if (!Clipboard.LoadClipboard.reversedComboMap[c]) {
                        Clipboard.LoadClipboard.comboMap[Language.Translate(Controls.LineItems__[c].GetLabel())] = c;
                        Clipboard.LoadClipboard.reversedComboMap[c] = Language.Translate(Controls.LineItems__[c].GetLabel());
                        Clipboard.LoadClipboard.mappingComboValues.push(Controls.LineItems__[c].GetLabel());
                    }
                },
                checkMapping: function (mapping) {
                    // Check that mapping loaded is valid
                    return mapping && mapping.columns && Sys.Helpers.IsArray(mapping.columns);
                },
                getSeparator: function (mapping) {
                    return mapping && mapping.separator ? mapping.separator : "\t";
                },
                hasHeader: function (mapping) {
                    return mapping && Sys.Helpers.IsBoolean(mapping.hasHeader) ? mapping.hasHeader : true;
                },
                isColumnAvailable: function (column) {
                    if (column.IsVisible()) {
                        return !column.IsReadOnly();
                    }
                    if (column.GetName() === "ItemShipToCompany__" && Lib.Purchasing.IsMultiShipTo()) {
                        return true;
                    }
                    if (Clipboard.LoadClipboard.itemTypes) {
                        var visibility = Lib.Purchasing.PRLineItems.ItemTypeDependenciesVisibilities[column.GetName()];
                        return visibility && Lib.Purchasing.Items.ShouldDisplayColumn(Clipboard.LoadClipboard.itemTypes, visibility, Controls.RequisitionStatus__.GetValue());
                    }
                    return false;
                },
                getAvailableColumns: function () {
                    if (Clipboard.LoadClipboard.availableColumns) {
                        for (var column in Clipboard.LoadClipboard.availableColumns) {
                            if (Object.prototype.hasOwnProperty.call(Clipboard.LoadClipboard.availableColumns, column)) {
                                Clipboard.LoadClipboard.addColumnInMap(Clipboard.LoadClipboard.availableColumns[column].name);
                            }
                        }
                        return Clipboard.LoadClipboard.availableColumns;
                    }
                    var columns = Controls.LineItems__.GetColumnsOrder();
                    Clipboard.LoadClipboard.availableColumns = {};
                    for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
                        var columnName = columns_1[_i];
                        var column = Controls.LineItems__[columnName];
                        if (Clipboard.LoadClipboard.isColumnAvailable(column)) {
                            var obj = {
                                name: columnName,
                                type: column.GetType()
                            };
                            Clipboard.LoadClipboard.availableColumns[columnName.toLowerCase()] = obj;
                            Clipboard.LoadClipboard.availableColumns[Language.Translate(column.GetLabel()).toLowerCase()] = obj;
                            Clipboard.LoadClipboard.addColumnInMap(columnName);
                        }
                    }
                    return Clipboard.LoadClipboard.availableColumns;
                },
                nameify: function (name) {
                    return name.replace(/\s|\W/g, "_").replace(/\b_*/g, "");
                },
                guessColumn: function (headerName) {
                    var map = Clipboard.LoadClipboard.getAvailableColumns();
                    var candidate = map[headerName.toLowerCase()];
                    if (candidate) {
                        return { columnName: candidate.name, type: candidate.type, found: true };
                    }
                    return { columnName: Clipboard.LoadClipboard.nameify(headerName), type: "Text", found: false };
                },
                addOrModifyMapping: function (mapping, m) {
                    if (mapping && m && m.lineItemsColumn) {
                        for (var _i = 0, _a = mapping.columns; _i < _a.length; _i++) {
                            var column = _a[_i];
                            if (m.lineItemsColumn === column.lineItemsColumn) {
                                column.header = m.header;
                                column.type = m.type;
                                return column;
                            }
                            if (m.header === column.header) {
                                column.lineItemsColumn = m.lineItemsColumn;
                                column.type = m.type;
                                return column;
                            }
                        }
                        mapping.columns.push(m);
                    }
                    return null;
                },
                parseHeader: function (header, mapping) {
                    Clipboard.LoadClipboard.showPreview = false;
                    if (!header) {
                        return null;
                    }
                    Clipboard.LoadClipboard.noMapping = [];
                    var lineFormat = [];
                    var fields = header.split(Clipboard.LoadClipboard.getSeparator(mapping));
                    for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
                        var field = fields_1[_i];
                        var mappingFound = false;
                        var headerColumnName = field.trim();
                        if (mapping) {
                            for (var c = 0; c < mapping.columns.length && !mappingFound; c++) {
                                if (headerColumnName === mapping.columns[c].header) {
                                    lineFormat.push(mapping.columns[c]);
                                    mappingFound = true;
                                }
                            }
                        }
                        if (!mappingFound) {
                            // Add new column to mapping
                            var guess = Clipboard.LoadClipboard.guessColumn(headerColumnName);
                            var m = { lineItemsColumn: guess.columnName, header: headerColumnName, type: guess.type, noMapping: false };
                            if (!guess.found) {
                                m.noMapping = true;
                                Clipboard.LoadClipboard.noMapping.push(headerColumnName);
                                Log.Warn("LoadClipboard - no line items mapping found for column " + headerColumnName);
                            }
                            else {
                                // We have at least one column mapped, show the preview
                                Clipboard.LoadClipboard.showPreview = true;
                            }
                            Clipboard.LoadClipboard.addOrModifyMapping(mapping, m);
                            lineFormat.push(m);
                        }
                        else {
                            // We have at least one column mapped, show the preview
                            Clipboard.LoadClipboard.showPreview = true;
                        }
                    }
                    if (Clipboard.LoadClipboard.shouldDisplayMappingDialog()) {
                        Clipboard.LoadClipboard.showMappingDialog();
                    }
                    return lineFormat;
                },
                convertValue: function (value, convertFunc) {
                    if (Sys.Helpers.IsFunction(convertFunc)) {
                        return convertFunc(value);
                    }
                    else if (Sys.Helpers.IsString(convertFunc)) {
                        return Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client." + convertFunc, value);
                    }
                    return value;
                },
                parseLine: function (line, mapping, lineFormat) {
                    var l = {};
                    var fields = line.split(Clipboard.LoadClipboard.getSeparator(mapping));
                    for (var f = 0; f < fields.length && f < lineFormat.length; f++) {
                        if (lineFormat[f].lineItemsColumn) {
                            l[lineFormat[f].lineItemsColumn] = Clipboard.LoadClipboard.convertValue(fields[f], lineFormat[f].convert);
                        }
                    }
                    return l;
                },
                parseItemTypes: function (lines, mapping) {
                    if (lines.length > 1) {
                        var line = lines[0].trim();
                        var fields = line.split(Clipboard.LoadClipboard.getSeparator(mapping));
                        // Note: LineItems__ always has at least 1 row
                        var itemTypeColumnLabel_1 = Language.Translate(Controls.LineItems__.GetRow(0).ItemType__.GetLabel()).toLowerCase();
                        var index = Sys.Helpers.Array.FindIndex(fields, function (field) {
                            var headerColumnName = field.trim().toLowerCase();
                            if (mapping) {
                                var mappedColumn = Sys.Helpers.Array.Find(mapping.columns, function (column) {
                                    return headerColumnName === column.header;
                                });
                                if (mappedColumn) {
                                    return mappedColumn.lineItemsColumn && mappedColumn.lineItemsColumn.toLowerCase() === "itemtype__";
                                }
                            }
                            return headerColumnName === "itemtype__" || headerColumnName === itemTypeColumnLabel_1;
                        });
                        if (index >= 0) {
                            var types = {};
                            for (var i = 1; i < lines.length; i++) {
                                line = lines[i];
                                if (line) {
                                    fields = line.split(Clipboard.LoadClipboard.getSeparator(mapping));
                                    var itemType = Clipboard.LoadClipboard.findComboBoxValue(Controls.LineItems__.ItemType__, fields[index]);
                                    if (itemType) {
                                        types[itemType] = true;
                                    }
                                }
                            }
                            return Object.keys(types);
                        }
                    }
                    return null;
                },
                itemTypesEqual: function (it1, it2) {
                    return it1 === it2 || (it1 && it2 && it1.length === it2.length &&
                        !Sys.Helpers.Array.Find(it1, function (it) {
                            return Sys.Helpers.Array.IndexOf(it2, it) == -1;
                        }));
                },
                parseData: function (text, mapping) {
                    var data = null;
                    if (text) {
                        data = [];
                        // Handle cells that have multiline content
                        var lines = Sys.Helpers.ExcelParser.Parse(text);
                        if (lines.length <= 0) {
                            return null;
                        }
                        var n = 0;
                        var hasHeader = Clipboard.LoadClipboard.hasHeader(mapping);
                        var lineFormat = [];
                        if (hasHeader) {
                            var oldItemTypes = Clipboard.LoadClipboard.itemTypes;
                            Clipboard.LoadClipboard.itemTypes = Clipboard.LoadClipboard.parseItemTypes(lines, mapping);
                            if (!Clipboard.LoadClipboard.itemTypesEqual(Clipboard.LoadClipboard.itemTypes, oldItemTypes)) {
                                Clipboard.LoadClipboard.availableColumns = null;
                            }
                            // parse header and build the expected line format from mapping
                            lineFormat = Clipboard.LoadClipboard.parseHeader(lines[0].trim(), mapping);
                            // Skip header
                            n = 1;
                            if (!Clipboard.LoadClipboard.showPreview) {
                                // No need to go further, the preview will not be displayed
                                return data;
                            }
                        }
                        else if (mapping) {
                            lineFormat = mapping.columns;
                        }
                        for (; n < lines.length; n++) {
                            var line = lines[n];
                            if (line) {
                                data.push(Clipboard.LoadClipboard.parseLine(line, mapping, lineFormat));
                            }
                        }
                    }
                    return data;
                },
                fillPreview: function (dialog, data) {
                    if (data) {
                        // Show the first lines in preview results
                        var previewTable = dialog.GetControl("preview_table");
                        previewTable.SetItemCount(0);
                        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                            var dataItem = data_1[_i];
                            var line = previewTable.AddItem(false);
                            for (var fld in dataItem) {
                                if (Object.prototype.hasOwnProperty.call(dataItem, fld)) {
                                    line.SetValue(fld, dataItem[fld]);
                                }
                            }
                        }
                    }
                },
                showPreviewDialog: function () {
                    Clipboard.LoadClipboard.data = Clipboard.LoadClipboard.parseData(Clipboard.LoadClipboard.rawData, Clipboard.LoadClipboard.mapping);
                    if (Clipboard.LoadClipboard.showPreview && !Clipboard.LoadClipboard.shouldDisplayMappingDialog()) {
                        Popup.Dialog("_Load clipboard preview dialog title", null, Clipboard.LoadClipboard.fillPreviewDialog, Clipboard.LoadClipboard.commitPreviewDialog, null, Clipboard.LoadClipboard.handlePreviewDialog, Clipboard.LoadClipboard.cancelPreviewDialog);
                    }
                    else if (!Clipboard.LoadClipboard.shouldDisplayMappingDialog()) {
                        // Keep this dialog open when no other dialog is already opened
                        Clipboard.LoadClipboard.ShowDialog();
                    }
                },
                showMappingDialog: function () {
                    Popup.Dialog("_Load clipboard mapping incomplete", null, Clipboard.LoadClipboard.fillMappingPopup, Clipboard.LoadClipboard.commitMappingPopup, null, Clipboard.LoadClipboard.handleMappingPopup, Clipboard.LoadClipboard.cancelMappingPopup);
                },
                // --------------------
                // Mapping dialog
                fillMappingPopup: function (dialog) {
                    Clipboard.LoadClipboard.showPaste = true;
                    if (Clipboard.LoadClipboard.noMapping.length > 0) {
                        var errorMsg = dialog.AddDescription("errorMsg");
                        errorMsg.SetText(Language.Translate("_Load clipboard No mapping found for columns '{0}'", true, Clipboard.LoadClipboard.noMapping.join("', '")));
                    }
                    // design mapping
                    if (Clipboard.LoadClipboard.mapping && Clipboard.LoadClipboard.mapping.columns && Clipboard.LoadClipboard.mapping.columns.length > 0) {
                        Clipboard.LoadClipboard.mappingCtrls = {};
                        for (var _i = 0, _a = Clipboard.LoadClipboard.mapping.columns; _i < _a.length; _i++) {
                            var col = _a[_i];
                            var mCtrl = dialog.AddComboBox(col.lineItemsColumn, col.header);
                            if (mCtrl) {
                                mCtrl.SetText(Clipboard.LoadClipboard.mappingComboValues.join("\n"));
                                if (!col.noMapping) {
                                    mCtrl.SetValue(Clipboard.LoadClipboard.reversedComboMap[col.lineItemsColumn]);
                                }
                            }
                            Clipboard.LoadClipboard.mappingCtrls[col.header] = mCtrl;
                        }
                    }
                    var link = dialog.AddLink("LinkToDoc__");
                    link.SetText("_Load clipboard dialog help link");
                    link.SetOpenInCurrentWindow(true);
                    link.SetURL("#");
                },
                commitMappingPopup: function () {
                    // Save new mapping
                    if (Clipboard.LoadClipboard.mappingCtrls) {
                        Clipboard.LoadClipboard.mapping.columns = [];
                        for (var c in Clipboard.LoadClipboard.mappingCtrls) {
                            if (Object.prototype.hasOwnProperty.call(Clipboard.LoadClipboard.mappingCtrls, c)) {
                                var ctrl = Clipboard.LoadClipboard.mappingCtrls[c];
                                if (ctrl && ctrl.GetValue() && ctrl.GetValue() !== Language.Translate(Clipboard.LoadClipboard.noMappingKey)) {
                                    var guess = Clipboard.LoadClipboard.guessColumn(ctrl.GetValue());
                                    var m = { lineItemsColumn: guess.columnName, header: c, type: guess.type };
                                    var column = Clipboard.LoadClipboard.addOrModifyMapping(Clipboard.LoadClipboard.mapping, m);
                                    if (column) {
                                        delete column.noMapping;
                                    }
                                }
                            }
                        }
                    }
                    // Show preview with new mapping
                    Clipboard.LoadClipboard.showPreviewDialog();
                },
                cancelMappingPopup: function () {
                    // Show preview
                    Clipboard.LoadClipboard.showPreviewDialog();
                },
                handleMappingPopup: function (dialog, tabId, event, control) {
                    if (event === "OnClick" && control.GetName() === "LinkToDoc__") {
                        Process.ShowHelp(5025);
                    }
                },
                shouldDisplayMappingDialog: function () {
                    return !Clipboard.LoadClipboard.showPreview && Clipboard.LoadClipboard.noMapping.length > 0;
                },
                // --------------------
                // Paste dialog
                fillPasteDialog: function (dialog) {
                    if (!Clipboard.LoadClipboard.checkMapping(Clipboard.LoadClipboard.mapping)) {
                        var errorCtrl = dialog.AddDescription("errorMsg", "");
                        errorCtrl.SetText("_Load clipboard mapping undefined or invalid");
                        errorCtrl.SetErrorStyle();
                        return;
                    }
                    var pasteArea = dialog.AddMultilineText("pasteZone");
                    pasteArea.SetLineCount(10);
                    pasteArea.SetWidth(450);
                    pasteArea.SetPlaceholder(Language.Translate("_Paste your data here"));
                    var okButton = dialog.GetControl("buttonok");
                    okButton.SetText(Language.Translate("_Load clipboard Show preview"));
                },
                commitPasteDialog: function (dialog) {
                    // Show preview dialog
                    var control = dialog.GetControl("pasteZone");
                    if (control) {
                        Clipboard.LoadClipboard.rawData = control.GetValue();
                        Clipboard.LoadClipboard.showPreviewDialog();
                    }
                },
                // --------------------
                // Preview dialog
                fillPreviewDialog: function (dialog) {
                    // Hold dialog until table is filled to make sure it is centered on screen
                    dialog.Hold(true);
                    var okButton = dialog.GetControl("buttonok");
                    okButton.SetText(Language.Translate("_Load clipboard append lines"));
                    var previewTable = dialog.AddTable("preview_table");
                    previewTable.SetReadOnly(true);
                    previewTable.SetRowToolsHidden(true);
                    previewTable.SetLineCount(5);
                    for (var _i = 0, _a = Clipboard.LoadClipboard.mapping.columns; _i < _a.length; _i++) {
                        var fldprops = _a[_i];
                        var addColumn = void 0;
                        if (fldprops.type === "Decimal") {
                            addColumn = previewTable.AddDecimalColumn;
                        }
                        else {
                            addColumn = previewTable.AddTextColumn;
                        }
                        if (!fldprops.noMapping) {
                            addColumn.call(previewTable, fldprops.lineItemsColumn, Controls.LineItems__[fldprops.lineItemsColumn].GetLabel(), fldprops.width ? fldprops.width : 100);
                        }
                    }
                    Clipboard.LoadClipboard.fillPreview(dialog, Clipboard.LoadClipboard.data);
                    if (previewTable.GetItemCount() === 0) {
                        okButton.SetDisabled(true);
                        // Apparently set disabled puts the text back to OK
                        okButton.SetText(Language.Translate("_Load clipboard append lines"));
                    }
                    dialog.AddButton("editMapping", "_Load clipboard Edit mapping");
                    dialog.Hold(false);
                },
                handlePreviewDialog: function (dialog, tabId, event, control) {
                    if (event === "OnClick" && control.GetName() === "editMapping") {
                        Clipboard.LoadClipboard.showPaste = false;
                        dialog.Cancel();
                        Clipboard.LoadClipboard.showMappingDialog();
                    }
                },
                cancelPreviewDialog: function () {
                    if (Clipboard.LoadClipboard.showPaste) {
                        // Return to paste dialog
                        Clipboard.LoadClipboard.ShowDialog();
                    }
                },
                findComboBoxValue: function (combo, value) {
                    value = value.toLocaleLowerCase();
                    var returnValue = null;
                    combo.GetAvailableValues().forEach(function (opt) {
                        var option = opt.split("=");
                        if (!returnValue) {
                            returnValue = option[0];
                        }
                        if (option[0].toLocaleLowerCase() === value || option[1].toLocaleLowerCase() === value || Language.Translate(option[1]).toLocaleLowerCase() === value) {
                            returnValue = option[0];
                        }
                    });
                    return returnValue;
                },
                addLines: function () {
                    function addLine(dataId, line) {
                        var rowData = Clipboard.LoadClipboard.data[dataId];
                        var currentItem = Controls.LineItems__.AddItem();
                        for (var field in rowData) {
                            if (Object.prototype.hasOwnProperty.call(rowData, field) && rowData[field] != "" && Controls.LineItems__[field]) {
                                if (Controls.LineItems__[field].GetType() === "ComboBox") {
                                    currentItem.SetValue(field, Clipboard.LoadClipboard.findComboBoxValue(Controls.LineItems__[field], rowData[field]));
                                }
                                else {
                                    currentItem.SetValue(field, rowData[field]);
                                }
                            }
                        }
                        return Lib.Purchasing.PRLineItems.UpdateLineItemCopyFromClipboard(currentItem, line, rowData);
                    }
                    // preview accepted
                    var data = Clipboard.LoadClipboard.data;
                    if (data) {
                        var maxNbreLines = Controls.LineItems__.GetLineCount();
                        // Add a line before the last empty line
                        var lineItems = Data.GetTable("LineItems__");
                        var lineItemsCount = lineItems.GetItemCount() - 1;
                        lineItems.GetItem(lineItemsCount).Remove();
                        var nbItemToAdd = Math.min(data.length, maxNbreLines - lineItemsCount);
                        var promises = [];
                        for (var i = 0; i < nbItemToAdd; i++) {
                            promises.push(addLine(i, lineItemsCount + i));
                        }
                        Sys.Helpers.Promise.All(promises)
                            .Finally(function () {
                            Lib.Purchasing.PRLineItems.leaveEmptyLine = true;
                            Lib.Purchasing.PRLineItems.LeaveEmptyLine();
                            Lib.Purchasing.LayoutPR.GlobalLayout.HideWaitScreen(true);
                        });
                        var notAddedItems = data.length - nbItemToAdd;
                        if (notAddedItems > 0) {
                            var errorMessage = Language.Translate(notAddedItems === 1 ? "_item has been ignored {0} {1}" : "_items have been ignored {0} {1}", false, notAddedItems, maxNbreLines);
                            var Options_1 = {
                                message: errorMessage,
                                status: "error",
                                timeout: 10000
                            };
                            var displayWarningInterval_1 = setInterval(function () {
                                if (!Lib.Purchasing.LayoutPR.GlobalLayout.waitScreenDisplayed) {
                                    Popup.Snackbar(Options_1);
                                    clearInterval(displayWarningInterval_1);
                                }
                            }, 1000);
                        }
                    }
                    else {
                        Clipboard.LoadClipboard.endAddLines();
                    }
                },
                /***
                 * Backup the mapping and reactivate the buttons
                 */
                endAddLines: function () {
                    // Will save mapping into P2P - Parameters table (with LineItemsImporterMapping process variable)
                    if (!Variable.GetValueAsString("LineItemsImporterMapping") && Clipboard.LoadClipboard.mapping) {
                        Variable.SetValueAsString("LineItemsImporterMapping", Sys.Helpers.SerializeObject(Clipboard.LoadClipboard.mapping));
                    }
                    LayoutHelper.DisableButtons(false, "Addlines");
                },
                commitPreviewDialog: function () {
                    LayoutHelper.DisableButtons(true, "Addlines");
                    Lib.Purchasing.PRLineItems.leaveEmptyLine = false;
                    Lib.Purchasing.LayoutPR.GlobalLayout.HideWaitScreen(false);
                    // asynchronous call for dialog to be closed right away and for wait screen to be visible
                    setTimeout(Clipboard.LoadClipboard.addLines, 20);
                },
                // Entry point
                ShowDialog: function () {
                    Clipboard.LoadClipboard.init();
                    Popup.Dialog("_Load clipboard paste dialog title", null, Clipboard.LoadClipboard.fillPasteDialog, Clipboard.LoadClipboard.commitPasteDialog);
                }
            };
        })(Clipboard = Purchasing.Clipboard || (Purchasing.Clipboard = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
