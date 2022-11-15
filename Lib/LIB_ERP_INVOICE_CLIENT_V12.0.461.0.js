/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_Invoice_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Base Invoice document for ERP - system library",
  "require": [
    "Lib_ERP_V12.0.461.0",
    "LIB_AP_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Layout = /** @class */ (function () {
            function Layout(parentContainer) {
                this.parentContainer = parentContainer;
                this.unmanagedfields = [];
                this.currentRequiredFields = null;
                this.currentStoredInLocalTableFields = null;
            }
            Layout.prototype.Init = function (isIgnoringManagedFields) {
                if (!isIgnoringManagedFields) {
                    var count = this.unmanagedfields.length;
                    for (var i = 0; i < count; i++) {
                        this.InternalHide(i, true);
                    }
                    this.ManageRequiredFields();
                    this.ManageStoredInLocalTableFields();
                }
                Controls.PaymentTerms__.OnChange = this.parentContainer.OnPaymentTermsChange();
                Controls.PostingDate__.OnChange = this.parentContainer.OnPostingDateChange();
                Controls.InvoiceDate__.OnChange = this.parentContainer.OnInvoiceDateChange();
                Controls.BaselineDate__.OnChange = this.parentContainer.OnBaselineDateChange();
            };
            Layout.prototype.SetPostingDatePlaceholder = function () {
                Lib.AP.ComputeBackdatingTargetDate().Then(function (backDatedDate) {
                    Controls.PostingDate__.SetPlaceholder(Sys.Helpers.Date.ToLocaleDateEx(backDatedDate, User.culture));
                });
            };
            Layout.prototype.InvoiceDateChange = function () {
                if (Sys.Parameters.GetInstance("AP").GetParameter("DefaultPostingDate") === "Invoice date") {
                    if (Data.IsNullOrEmpty("InvoiceDate__")) {
                        Controls.PostingDate__.SetInfo("");
                        Data.SetValue("PostingDate__", "");
                    }
                    else {
                        this.SetPostingDatePlaceholder();
                    }
                }
            };
            Layout.prototype.Reset = function () {
                var count = this.unmanagedfields.length;
                for (var i = 0; i < count; i++) {
                    this.InternalHide(i, false);
                }
                this.ManageRequiredFields();
                this.ManageStoredInLocalTableFields();
            };
            Layout.prototype.UpdateLayoutForManualLink = function () {
                // do nothing
            };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Layout.prototype.ManualLinkERPInvoiceNumber = function (ctrl, layoutHelper, invoiceLineItem) {
                // do nothing
            };
            Layout.prototype.Hide = function (field, bHide) {
                if (this.IndexOf(field.GetName()) >= 0) {
                    field.Hide(true);
                }
                else {
                    field.Hide(bHide);
                }
            };
            Layout.prototype.SetReadOnly = function (field, bIsReadOnly) {
                if (this.IndexOf(field.GetName()) >= 0) {
                    field.SetReadOnly(true);
                }
                else {
                    field.SetReadOnly(bIsReadOnly);
                }
            };
            Layout.prototype.computeHeaderAmount = function () {
                var netamount = 0;
                var tablineitems = Data.GetTable("LineItems__");
                var nLines = tablineitems.GetItemCount();
                for (var i = 0; i < nLines; i++) {
                    var currentItem = tablineitems.GetItem(i);
                    netamount += currentItem.GetValue("Amount__");
                }
                return netamount;
            };
            Layout.prototype.GetUnmanagedFieldindex = function (tableName, fieldName) {
                function plainNameMatch(f) {
                    return fieldName === f;
                }
                function fieldMatch(f) {
                    return !f.table && plainNameMatch(f.name);
                }
                function tableFieldMatch(f) {
                    return f.table === tableName && plainNameMatch(f.name);
                }
                return Sys.Helpers.Array.FindIndex(this.unmanagedfields, function (e) {
                    return plainNameMatch(e) || fieldMatch(e) || tableFieldMatch(e);
                });
            };
            Layout.prototype.InternalHide = function (index, bHide) {
                if (Sys.Helpers.IsString(this.unmanagedfields[index])) {
                    Sys.Helpers.Globals.Controls[this.unmanagedfields[index]].Hide(bHide);
                    if (bHide) {
                        Data.SetValue(this.unmanagedfields[index], "");
                    }
                }
                else {
                    var curr = this.unmanagedfields[index];
                    if (curr.table) {
                        Sys.Helpers.Globals.Controls[curr.table][curr.name].Hide(curr.initialState ? curr.initialState : bHide);
                        Sys.Helpers.Globals.Controls[curr.table][curr.name].SetReadOnly(curr.readonly ? curr.readonly : false);
                        if (bHide) {
                            var tablineitems = Data.GetTable(curr.table);
                            var nLines = tablineitems.GetItemCount();
                            for (var i = 0; i < nLines; i++) {
                                var currentItem = tablineitems.GetItem(i);
                                currentItem.SetValue(curr.name, "");
                            }
                        }
                    }
                    else {
                        Sys.Helpers.Globals.Controls[curr.name].Hide(curr.initialState ? curr.initialState : bHide);
                        Sys.Helpers.Globals.Controls[curr.name].SetReadOnly(curr.readonly ? curr.readonly : false);
                        if (bHide) {
                            Data.SetValue(curr.name, "");
                        }
                    }
                }
            };
            Layout.prototype.IndexOf = function (name) {
                return Sys.Helpers.Array.FindIndex(this.unmanagedfields, function (field) {
                    var fieldName = Sys.Helpers.IsString(field) ? field : field.name;
                    return fieldName === name;
                });
            };
            Layout.prototype.EnableManualLink = function () {
                Controls.ERPInvoiceNumber__.SetReadOnly(false);
            };
            Layout.prototype.DisableManualLink = function () {
                Controls.ERPInvoiceNumber__.SetReadOnly(true);
            };
            // eslint-disable-next-line class-methods-use-this
            Layout.prototype.GetPostManualLinkLabel = function () {
                return "_Link";
            };
            Layout.prototype.GetPostAndRequestApprovalManualLinkLabel = function () {
                return "_Link and Request Approval";
            };
            Layout.prototype.decimalToString = function (decimalValue) {
                // Convert a decimal value to a string formatted in the culture of the current user
                // Use a decimal control to do this
                var oldValue = Controls.NetAmount__.GetValue();
                Controls.NetAmount__.SetValue(decimalValue);
                var str = Controls.NetAmount__.GetText();
                Controls.NetAmount__.SetValue(oldValue);
                return str;
            };
            Layout.prototype.checkPOInvoiceLineItemQuantity = function (item, InvoiceLineItem, dispatchMap) {
                if (InvoiceLineItem.IsPOLineItem(item) || InvoiceLineItem.IsPOGLLineItem(item)) {
                    var warning = "";
                    if (item.GetValue("OrderNumber__") || item.GetValue("GoodIssue__")) {
                        if (!dispatchMap) {
                            dispatchMap = InvoiceLineItem.GetDispatchedLinesAmountQuantity();
                        }
                        var key = InvoiceLineItem.GetDispatchKey(item);
                        var quantity = dispatchMap[key] ? dispatchMap[key].quantity : item.GetValue("Quantity__");
                        var openQuantity = item.GetValue("OpenQuantity__");
                        var expectedQuantity = item.GetValue("ExpectedQuantity__");
                        if (quantity > expectedQuantity) {
                            warning = Language.Translate("_This value exceeds the expected quantity ({0})", false, this.decimalToString(expectedQuantity));
                        }
                        else if (quantity > openQuantity) {
                            warning = Language.Translate("_This value exceeds the quantity still to be invoiced ({0})", false, this.decimalToString(openQuantity));
                        }
                    }
                    item.SetWarning("Quantity__", warning);
                }
            };
            Layout.prototype.GetAndFillDescriptionFromCode = function (item, params, doneCallback) {
                if (params.formFields && params.tableFields && params.tableKeyField) {
                    Lib.AP.GetAndFillDescriptionFromCodeExSync(item, params.formCodeField, params.formFields, params.tableFields, params.tableKeyField, params.table, params.companyCode, params.disableButtons, doneCallback);
                }
                else {
                    Lib.AP.GetAndFillDescriptionFromCodeSync(item, params.formCodeField, params.formField, params.tableField, params.table, params.companyCode, params.disableButtons, doneCallback);
                }
            };
            Layout.prototype.CallControlFunction = function (tableName, fieldName, functionName) {
                var args = [];
                for (var _i = 3; _i < arguments.length; _i++) {
                    args[_i - 3] = arguments[_i];
                }
                var ctrl = null;
                if (!fieldName) {
                    return null;
                }
                if (tableName) {
                    if (Controls[tableName] &&
                        Controls[tableName][fieldName]) {
                        ctrl = Controls[tableName][fieldName];
                    }
                }
                else if (Controls[fieldName]) {
                    ctrl = Controls[fieldName];
                }
                if (ctrl &&
                    ctrl[functionName] &&
                    typeof ctrl[functionName] === "function") {
                    return ctrl[functionName].apply(ctrl, args);
                }
                return null;
            };
            Layout.prototype.UpdateLayout = function () {
                this.ManageRequiredFields();
            };
            Layout.prototype.ManageRequiredFields = function () {
                var _this = this;
                var updateRequiredStatus = function (requiredFields, setRequiredValue) {
                    requiredFields.foreach(function (tableName, fieldName, isRequired) {
                        if (isRequired || !setRequiredValue) {
                            _this.parentContainer.layout.CallControlFunction.call(_this.parentContainer, tableName, fieldName, "SetRequired", setRequiredValue);
                            var idx = _this.GetUnmanagedFieldindex(tableName, fieldName);
                            if (setRequiredValue && idx !== -1) {
                                _this.InternalHide(idx, false);
                            }
                        }
                    });
                };
                if (this.currentRequiredFields) {
                    updateRequiredStatus(this.currentRequiredFields, false);
                }
                this.currentRequiredFields = this.parentContainer.GetRequiredFields(Sys.Helpers.TryGetFunction("Lib.AP.Customization.Common.GetRequiredFields"));
                updateRequiredStatus(this.currentRequiredFields, true);
            };
            Layout.prototype.ManageStoredInLocalTableFields = function () {
                var _this = this;
                var updateStoredInLocalTableStatus = function (storedInLocalTableFields, setStoredInLocalTableValue) {
                    storedInLocalTableFields.foreach(function (tableName, fieldName, isStoredInLocalTable) {
                        if (isStoredInLocalTable || !setStoredInLocalTableValue) {
                            _this.parentContainer.layout.CallControlFunction.call(_this.parentContainer, tableName, fieldName, "SetAllowTableValuesOnly", setStoredInLocalTableValue);
                        }
                    });
                };
                if (this.currentStoredInLocalTableFields) {
                    updateStoredInLocalTableStatus(this.currentStoredInLocalTableFields, false);
                }
                this.currentStoredInLocalTableFields = this.parentContainer.GetStoredInLocalTableFields();
                updateStoredInLocalTableStatus(this.currentStoredInLocalTableFields, true);
            };
            return Layout;
        }());
        ERP.Layout = Layout;
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
