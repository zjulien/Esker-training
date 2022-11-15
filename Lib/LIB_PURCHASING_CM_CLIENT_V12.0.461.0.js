/* eslint-disable class-methods-use-this */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CM_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Client",
  "comment": "Catalog Management library",
  "require": [
    "Lib_Purchasing_CM_V12.0.461.0",
    "Lib_Purchasing_CM_Workflow_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var CM;
        (function (CM) {
            var CClientHelper = /** @class */ (function () {
                function CClientHelper(helper, helperWkf) {
                    var _a;
                    this.typeToControls = (_a = {},
                        _a[CM.ActionToDo.Added] = {
                            label: "_PreviewAddedPane {0}",
                            table: "AddedItems__",
                            panel: "PreviewAddedPane"
                        },
                        _a[CM.ActionToDo.Modified] = {
                            label: "_PreviewModifiedPane {0}",
                            table: "ModifiedItems__",
                            panel: "PreviewModifiedPane"
                        },
                        _a[CM.ActionToDo.Deleted] = {
                            label: "_PreviewDeletedPane {0}",
                            table: "DeletedItems__",
                            panel: "PreviewDeletedPane"
                        },
                        _a);
                    this.helper = helper;
                    this.helperWkf = helperWkf;
                }
                CClientHelper.prototype.GetGroupedActionFromLine = function (actionToGroup, line) {
                    if (actionToGroup === "ActionToDo") {
                        return line.ActionToDo;
                    }
                    switch (line.ActionDone.Supplier) {
                        case Lib.Purchasing.CM.ActionDone.Added:
                            return CM.ActionToDo.Added;
                        case Lib.Purchasing.CM.ActionDone.Modified:
                            return CM.ActionToDo.Modified;
                        case Lib.Purchasing.CM.ActionDone.Deleted:
                        case Lib.Purchasing.CM.ActionDone.Nothing:
                            return CM.ActionToDo.Deleted;
                        default:
                            throw Error("Unknow action: " + line.ActionDone.Supplier);
                    }
                };
                CClientHelper.prototype.FillGroupedExternalData = function (actionToGroup) {
                    var _a;
                    this.groupedExtractedData = (_a = {},
                        _a[CM.ActionToDo.Added] = [],
                        _a[CM.ActionToDo.Modified] = [],
                        _a[CM.ActionToDo.Deleted] = [],
                        _a);
                    var extractedData = this.helper.GetExtractedData();
                    var lines = extractedData.Lines || {};
                    for (var key in lines) {
                        if (Object.prototype.hasOwnProperty.call(lines, key)) {
                            var line = lines[key];
                            var action = this.GetGroupedActionFromLine(actionToGroup, line);
                            this.groupedExtractedData[action].push(line);
                        }
                    }
                };
                CClientHelper.prototype.FillAndDisplayPreview = function (previewType) {
                    var _this = this;
                    var data = this.groupedExtractedData[previewType] || [];
                    var tableControl = Controls[this.typeToControls[previewType].table];
                    tableControl.SetItemCount(0);
                    tableControl.SetWidth("100%");
                    tableControl.SetExtendableColumn("Description__");
                    data.forEach(function (r) {
                        _this.PreviewAddItem(tableControl, r.ExtractedData);
                    });
                    Controls[this.typeToControls[previewType].panel].Hide(data.length == 0);
                    Controls[this.typeToControls[previewType].panel].SetLabel(this.typeToControls[previewType].label, data.length);
                    return data.length;
                };
                CClientHelper.prototype.DisplayPreviews = function (display, actionToDisplay) {
                    if (actionToDisplay === void 0) { actionToDisplay = "ActionToDo"; }
                    var linesDisplayed = 0;
                    if (display) {
                        this.FillGroupedExternalData(actionToDisplay);
                        linesDisplayed += this.FillAndDisplayPreview(CM.ActionToDo.Added);
                        linesDisplayed += this.FillAndDisplayPreview(CM.ActionToDo.Modified);
                        linesDisplayed += this.FillAndDisplayPreview(CM.ActionToDo.Deleted);
                        return linesDisplayed;
                    }
                    Controls.PreviewAddedPane.Hide(true);
                    Controls.PreviewModifiedPane.Hide(true);
                    Controls.PreviewDeletedPane.Hide(true);
                    return 0;
                };
                return CClientHelper;
            }());
            CM.CClientHelper = CClientHelper;
            var CClientHelperVendorItem = /** @class */ (function (_super) {
                __extends(CClientHelperVendorItem, _super);
                function CClientHelperVendorItem(helper, helperWkf) {
                    var _this = _super.call(this, helper, helperWkf) || this;
                    Log.Info("CClientHelperVendorItem");
                    return _this;
                }
                CClientHelperVendorItem.prototype.PreviewAddItem = function (tableControl, rawData) {
                    var newItem = tableControl.AddItem();
                    newItem.SetValue("Number__", rawData.SupplierPartID);
                    newItem.SetValue("Description__", rawData.Name);
                    newItem.SetValue("ManufacturerName__", rawData.ManufacturerName);
                    newItem.SetValue("UnitPrice__", rawData.UnitPrice);
                    newItem.SetValue("Currency__", rawData.Currency);
                    newItem.SetValue("UnitOfMeasure__", rawData.UOM);
                    newItem.SetValue("UNSPSC__", rawData.UNSPSC);
                    if (this.helperWkf.IsInternalUpdateRequest()) {
                        newItem.SetValue("CompanyCode__", rawData.CompanyCode);
                        newItem.SetValue("VendorNumber__", rawData.VendorNumber);
                    }
                };
                return CClientHelperVendorItem;
            }(CClientHelper));
            CM.CClientHelperVendorItem = CClientHelperVendorItem;
            var CClientHelperWarehouseItem = /** @class */ (function (_super) {
                __extends(CClientHelperWarehouseItem, _super);
                function CClientHelperWarehouseItem(helper, helperWkf) {
                    var _this = _super.call(this, helper, helperWkf) || this;
                    Log.Info("CClientHelperWarehouseItem");
                    return _this;
                }
                CClientHelperWarehouseItem.prototype.PreviewAddItem = function (tableControl, rawData) {
                    var newItem = tableControl.AddItem();
                    newItem.SetValue("Number__", rawData.ItemNumber);
                    newItem.SetValue("CurrentStock__", rawData.CurrentStock);
                    newItem.SetValue("MinimumThreshold__", rawData.MinimumThreshold);
                    newItem.SetValue("ExpectedStockLevel__", rawData.ExpectedStockLevel);
                    newItem.SetValue("LeadTime__", rawData.LeadTime);
                    newItem.SetValue("UnitPrice__", rawData.UnitPrice);
                };
                return CClientHelperWarehouseItem;
            }(CClientHelper));
            CM.CClientHelperWarehouseItem = CClientHelperWarehouseItem;
        })(CM = Purchasing.CM || (Purchasing.CM = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
