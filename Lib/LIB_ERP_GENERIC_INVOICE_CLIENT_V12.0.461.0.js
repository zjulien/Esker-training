/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_Generic_Invoice_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Client Invoice document for generic ERP - system library",
  "require": [
    "Lib_ERP_Generic_Manager_V12.0.461.0",
    "Lib_ERP_Generic_Invoice_V12.0.461.0",
    "LIB_AP_V12.0.461.0",
    "LIB_AP_WorkflowCtrl_V12.0.461.0",
    "LIB_AP_BrowsePO_V12.0.461.0",
    "Lib_ERP_Invoice_Client_V12.0.461.0",
    "[Lib_AP_Customization_HTMLScripts]"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Generic;
        (function (Generic) {
            var InvoiceLayout = /** @class */ (function (_super) {
                __extends(InvoiceLayout, _super);
                function InvoiceLayout(parentContainer) {
                    var _this = _super.call(this, parentContainer) || this;
                    _this.unmanagedfields.push("AlternativePayee__");
                    _this.unmanagedfields.push("HeaderText__");
                    _this.unmanagedfields.push("Investment__");
                    _this.unmanagedfields.push("Assignment__");
                    _this.unmanagedfields.push("BaselineDate__");
                    _this.unmanagedfields.push("BusinessArea__");
                    _this.unmanagedfields.push("InvoiceReferenceNumber__");
                    _this.unmanagedfields.push("SAPPaymentMethod__");
                    _this.unmanagedfields.push({ name: "ERPMMInvoiceNumber__", initialState: true });
                    _this.unmanagedfields.push({ name: "ERPClearingDocumentNumber__", initialState: true });
                    _this.unmanagedfields.push({ name: "UnplannedDeliveryCosts__", initialState: true });
                    _this.unmanagedfields.push({ name: "Assignment__", table: "LineItems__" });
                    _this.unmanagedfields.push({ name: "TradingPartner__", table: "LineItems__" });
                    _this.unmanagedfields.push({ name: "BusinessArea__", table: "LineItems__" });
                    _this.unmanagedfields.push({ name: "InternalOrder__", table: "LineItems__" });
                    _this.unmanagedfields.push({ name: "TaxJurisdiction__", table: "LineItems__" });
                    _this.unmanagedfields.push({ name: "WBSElement__", table: "LineItems__" });
                    _this.unmanagedfields.push({ name: "CompanyCode__", table: "LineItems__" });
                    _this.unmanagedfields.push("Simulate");
                    _this.unmanagedfields.push({ name: "Details", initialState: true });
                    _this.unmanagedfields.push("WithholdingTax__");
                    _this.unmanagedfields.push("ExtendedWithholdingTaxPane");
                    _this.unmanagedfields.push({ name: "BankDetails_Select__", table: "BankDetails__" });
                    _this.unmanagedfields.push({ name: "UnitOfMeasureCode__", table: "LineItems__" });
                    _this.unmanagedfields.push("SubsequentDocument__");
                    return _this;
                }
                InvoiceLayout.prototype.Init = function () {
                    // Hide unmanaged fields
                    _super.prototype.Init.call(this);
                    Controls.LineItems__.InternalOrder__.SetAllowTableValuesOnly(true);
                    Controls.LineItems__.WBSElement__.SetAllowTableValuesOnly(true);
                    Controls.SAPPaymentMethod__.SetAllowTableValuesOnly(true);
                    Controls.LineItems__.CostCenter__.SetAllowTableValuesOnly(true);
                    Controls.VendorName__.SetAllowTableValuesOnly(true);
                    Controls.VendorNumber__.SetAllowTableValuesOnly(true);
                    Controls.LineItems__.TaxCode__.SetAllowTableValuesOnly(true);
                    Controls.LineItems__.TaxCode__.SetNbDisplayedResultsPerPage(15);
                    Controls.LineItems__.GLAccount__.SetAllowTableValuesOnly(true);
                    Controls.ERPInvoiceNumber__.SetBrowsable(false);
                    Controls.LineItems__.TaxRate__.Hide(false);
                    this.initTaxCodeDisplayedColumns = Controls.LineItems__.TaxCode__.GetDisplayedColumns();
                    if (this.initTaxCodeDisplayedColumns.indexOf("TaxRate__") === -1) {
                        Controls.LineItems__.TaxCode__.SetDisplayedColumns(this.initTaxCodeDisplayedColumns + "|TaxRate__");
                    }
                    Controls.InvoiceType__.SetText(Lib.AP.GetInvoiceTypeList());
                    Lib.AP.Browse.Init(this.parentContainer);
                };
                InvoiceLayout.prototype.Reset = function () {
                    // Restore unmanaged fields
                    _super.prototype.Reset.call(this);
                    Controls.LineItems__.InternalOrder__.SetAllowTableValuesOnly(false);
                    Controls.LineItems__.WBSElement__.SetAllowTableValuesOnly(false);
                    Controls.SAPPaymentMethod__.SetAllowTableValuesOnly(false);
                    Controls.LineItems__.CostCenter__.SetAllowTableValuesOnly(false);
                    Controls.VendorName__.SetAllowTableValuesOnly(false);
                    Controls.VendorNumber__.SetAllowTableValuesOnly(false);
                    Controls.LineItems__.TaxCode__.SetAllowTableValuesOnly(false);
                    Controls.LineItems__.TaxCode__.SetNbDisplayedResultsPerPage(15);
                    Controls.LineItems__.TaxCode__.SetDisplayedColumns(this.initTaxCodeDisplayedColumns);
                    Controls.LineItems__.GLAccount__.SetAllowTableValuesOnly(false);
                    Controls.ERPInvoiceNumber__.SetReadOnly(true);
                    Controls.ERPInvoiceNumber__.SetBrowsable(true);
                    Controls.LineItems__.TaxRate__.Hide(true);
                    delete Controls.PaymentTerms__.OnChange;
                    delete Controls.PostingDate__.OnChange;
                    delete Controls.InvoiceDate__.OnChange;
                };
                InvoiceLayout.prototype.UpdateLayout = function () {
                    _super.prototype.UpdateLayout.call(this);
                    var isAP = Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart;
                    var withholdingTaxParameter = Sys.Parameters.GetInstance("AP").GetParameter("TaxesWithholdingTax", "");
                    Controls.WithholdingTax__.Hide(!withholdingTaxParameter || withholdingTaxParameter !== "Basic");
                    var notExtendedWHT = !withholdingTaxParameter || withholdingTaxParameter !== "Extended";
                    var emptyExtendedWHT = !isAP && Controls.ExtendedWithholdingTax__.GetItemCount() < 1;
                    // add the empty line for AP Start
                    Controls.ExtendedWithholdingTax__.SetAtLeastOneLine(isAP);
                    Controls.ExtendedWithholdingTax__.SetWidth("100%");
                    Controls.ExtendedWithholdingTax__.SetExtendableColumn("WHTDescription__");
                    Controls.ExtendedWithholdingTaxPane.Hide(notExtendedWHT || emptyExtendedWHT);
                    Controls.ExtendedWithholdingTaxPane.SetReadOnly(notExtendedWHT || emptyExtendedWHT || !isAP);
                };
                InvoiceLayout.prototype.UpdateLayoutForManualLink = function () {
                    _super.prototype.UpdateLayoutForManualLink.call(this);
                    var bEnable = Controls.ManualLink__.IsChecked();
                    Controls.LineItems__.SetAtLeastOneLine(!bEnable);
                    // remove the requirement on TaxCode__ if we are in Manual Link mode
                    Controls.ManualLinkExplanation__.Hide(!bEnable);
                    Controls.Line_items.SetReadOnly(bEnable);
                    Controls.Line_items.Hide(bEnable);
                    Controls.Line_Items_Options.SetReadOnly(bEnable);
                    Controls.Line_Items_Options.Hide(bEnable);
                    Controls.Line_Items_Actions.SetReadOnly(bEnable);
                    Controls.Line_Items_Actions.Hide(bEnable);
                    Controls.Balance__.Hide(bEnable);
                    if (bEnable) {
                        var lineItems = Data.GetTable("LineItems__");
                        lineItems.SetItemCount(0);
                        Lib.AP.WorkflowCtrl.workflowUI.SetSerializedValue("ControllersList", null);
                        Lib.AP.WorkflowCtrl.Rebuild(true, false, "manualLink");
                        Data.SetValue("CurrentException__", "");
                    }
                    Controls.NetAmount__.SetReadOnly(!bEnable);
                    Controls.TaxAmount__.SetReadOnly(!bEnable);
                };
                InvoiceLayout.prototype.EnableManualLink = function () {
                    _super.prototype.EnableManualLink.call(this);
                    this.ManualLinkERPInvoiceNumber();
                    this.UpdateLayoutForManualLink();
                };
                InvoiceLayout.prototype.GetPostManualLinkLabel = function () {
                    return "_Archive";
                };
                InvoiceLayout.prototype.GetPostAndRequestApprovalManualLinkLabel = function () {
                    return "_Archive and Request Approval";
                };
                InvoiceLayout.prototype.ManualLinkERPInvoiceNumber = function (ctrl, layoutHelper) {
                    _super.prototype.ManualLinkERPInvoiceNumber.call(this, ctrl, layoutHelper);
                    if (Controls.ERPInvoiceNumber__.GetValue()) {
                        Controls.ManualLink__.Check(true);
                    }
                    else {
                        Controls.ManualLink__.Check(false);
                    }
                    if (layoutHelper) {
                        Controls.Balance__.SetValue(0);
                        Controls.Balance__.SetError();
                        layoutHelper.UpdateLayout(false);
                        // Reset potential posting error
                        Controls.ERPPostingError__.SetValue("");
                    }
                };
                return InvoiceLayout;
            }(Lib.ERP.Layout));
            Generic.InvoiceLayout = InvoiceLayout;
            var InvoiceClient = /** @class */ (function (_super) {
                __extends(InvoiceClient, _super);
                function InvoiceClient(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.OnBrowsePurchaseOrders = function (mainControl, AddLineItem, CleanUpLineItems, GetTaxRateForItemList, FormLayoutHelper) {
                        return function () {
                            Lib.AP.BrowsePO.BrowsePurchaseOrders(mainControl, AddLineItem, CleanUpLineItems, GetTaxRateForItemList, FormLayoutHelper);
                        };
                    };
                    _this.LoadTemplate = function (extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, noResultsCallback, callbackForEachLine, callbackFinal, waitScreenDuringLoadTemplateAction) {
                        Lib.AP.Parameters.LoadTemplate(extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, null, null, null, noResultsCallback, callbackForEachLine, callbackFinal, waitScreenDuringLoadTemplateAction);
                    };
                    _this.layout = new Lib.ERP.Generic.InvoiceLayout(_this);
                    return _this;
                }
                InvoiceClient.prototype.StoreSelectedBankDetails = function (row) {
                    if (row.BankDetails_Select__.GetValue() === true) {
                        Controls.SelectedBankAccountID__.SetValue(row.BankDetails_ID__.GetValue());
                    }
                    else {
                        Controls.SelectedBankAccountID__.SetValue("");
                    }
                };
                InvoiceClient.prototype.IsBankDetailsSelectionDisabled = function () {
                    var customAllowBankDetailSelection = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.Generic.AllowBankDetailSelection");
                    return customAllowBankDetailSelection !== true;
                };
                InvoiceClient.prototype.ResetBankDetailsSelection = function () {
                    Controls.SelectedBankAccountID__.SetValue("");
                };
                InvoiceClient.prototype.IsBankDetailsRowSelectable = function (row) {
                    return row.BankDetails_ID__.GetText() !== "";
                };
                InvoiceClient.prototype.IsBankDetailsItemSelected = function (item) {
                    var selectedId = Controls.SelectedBankAccountID__.GetValue();
                    return selectedId && item.GetValue("BankDetails_ID__") === selectedId;
                };
                InvoiceClient.prototype.ValidateField = function (item, field) {
                    if (!item.GetValue(field)) {
                        item.SetCategorizedError(field, Lib.AP.TouchlessException.MissingLineField, "This field is required!");
                        return false;
                    }
                    return true;
                };
                InvoiceClient.prototype.OnPaymentTermsChangeCallback = function () {
                    _super.prototype.OnPaymentTermsChangeCallback.call(this);
                    Lib.ERP.Generic.InvoiceClient.prototype.ComputePaymentAmountsAndDates(true, true);
                };
                InvoiceClient.prototype.OnPostingDateChangeCallback = function () {
                    _super.prototype.OnPostingDateChangeCallback.call(this);
                    this.OnPaymentRelatedDateChange();
                };
                InvoiceClient.prototype.OnInvoiceDateChangeCallback = function () {
                    _super.prototype.OnInvoiceDateChangeCallback.call(this);
                    this.OnPaymentRelatedDateChange();
                };
                InvoiceClient.prototype.OnPaymentRelatedDateChange = function () {
                    Lib.ERP.Generic.InvoiceClient.prototype.ComputePaymentAmountsAndDates(false, true);
                };
                InvoiceClient.prototype.ValidateData = function () {
                    return true;
                };
                InvoiceClient.prototype.OnRefreshLineItemsTableEnd = function () {
                    // do nothing
                };
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                InvoiceClient.prototype.CustomizeButtonsBehavior = function (ButtonsBehavior) {
                    // do nothing
                };
                return InvoiceClient;
            }(Lib.ERP.Generic.Invoice));
            Generic.InvoiceClient = InvoiceClient;
        })(Generic = ERP.Generic || (ERP.Generic = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.Generic.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.Generic.InvoiceClient(manager);
};
