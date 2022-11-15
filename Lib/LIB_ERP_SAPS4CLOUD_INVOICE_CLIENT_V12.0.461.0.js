/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAPS4CLOUD_Invoice_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Client Invoice document for SAPS4CLOUD ERP - system library",
  "require": [
    "Lib_ERP_SAPS4CLOUD_Manager_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Invoice_V12.0.461.0",
    "LIB_AP_V12.0.461.0",
    "LIB_AP_WorkflowCtrl_V12.0.461.0",
    "LIB_AP_BrowsePO_V12.0.461.0",
    "Lib_ERP_Invoice_Client_V12.0.461.0"
  ]
}*/
// Class SAPS4CLOUDERPInvoiceLayout : Layout
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAPS4CLOUD;
        (function (SAPS4CLOUD) {
            var InvoiceLayout = /** @class */ (function (_super) {
                __extends(InvoiceLayout, _super);
                function InvoiceLayout(parentContainer) {
                    return _super.call(this, parentContainer) || this;
                    /*
                    // do not have any unmanaged fields for now...
                    this.unmanagedfields.push("AlternativePayee__");
                    this.unmanagedfields.push("HeaderText__");
                    this.unmanagedfields.push("Investment__");
                    this.unmanagedfields.push("Assignment__");
                    this.unmanagedfields.push("BaselineDate__");
                    this.unmanagedfields.push("BusinessArea__");
                    this.unmanagedfields.push("InvoiceReferenceNumber__");
                    this.unmanagedfields.push("SAPPaymentMethod__");
                    this.unmanagedfields.push({ name: "ERPMMInvoiceNumber__", initialState: true });
                    this.unmanagedfields.push({ name: "UnplannedDeliveryCosts__", initialState: true });
                    this.unmanagedfields.push({ name: "Assignment__", table: "LineItems__" });
                    this.unmanagedfields.push({ name: "TradingPartner__", table: "LineItems__" });
                    this.unmanagedfields.push({ name: "BusinessArea__", table: "LineItems__" });
                    this.unmanagedfields.push({ name: "InternalOrder__", table: "LineItems__" });
                    this.unmanagedfields.push({ name: "TaxJurisdiction__", table: "LineItems__" });
                    this.unmanagedfields.push({ name: "WBSElement__", table: "LineItems__" });
                    this.unmanagedfields.push({ name: "CompanyCode__", table: "LineItems__" });
                    this.unmanagedfields.push("Simulate");
                    this.unmanagedfields.push({ name: "Details", initialState: true });
                    this.unmanagedfields.push("WithholdingTax__");
                    this.unmanagedfields.push("ExtendedWithholdingTaxPane");
                    this.unmanagedfields.push({ name: "BankDetails_Select__", table: "BankDetails__" });
                    */
                }
                InvoiceLayout.prototype.Init = function () {
                    // Hide unmanaged fields
                    _super.prototype.Init.apply(this);
                    Controls.LineItems__.InternalOrder__.SetAllowTableValuesOnly(true);
                    Controls.LineItems__.WBSElement__.SetAllowTableValuesOnly(true);
                    Controls.SAPPaymentMethod__.SetAllowTableValuesOnly(true);
                    Controls.LineItems__.CostCenter__.SetAllowTableValuesOnly(true);
                    Controls.VendorName__.SetAllowTableValuesOnly(true);
                    Controls.VendorNumber__.SetAllowTableValuesOnly(true);
                    Controls.LineItems__.TaxCode__.SetAllowTableValuesOnly(true);
                    Controls.LineItems__.GLAccount__.SetAllowTableValuesOnly(true);
                    Controls.ERPInvoiceNumber__.SetBrowsable(false);
                    Controls.InvoiceType__.SetText(Lib.AP.GetInvoiceTypeList());
                    // TEMP TAXCODE NOT HANDLED
                    Controls.CalculateTax__.SetReadOnly(true);
                    Controls.SubsequentDocument__.SetReadOnly(true);
                    Controls.Simulate.SetDisabled(true);
                    Lib.AP.Browse.Init(this.parentContainer);
                };
                InvoiceLayout.prototype.UpdateLayout = function () {
                    Lib.ERP.Layout.prototype.UpdateLayout.call(this);
                    var withholdingTaxParameter = Sys.Parameters.GetInstance("AP").GetParameter("TaxesWithholdingTax", "");
                    var isAP = Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart;
                    Controls.WithholdingTax__.Hide(!withholdingTaxParameter || withholdingTaxParameter !== "Basic");
                    Controls.WithholdingTax__.SetReadOnly(Lib.AP.InvoiceType.isPOInvoice());
                    var notExtendedWHT = !withholdingTaxParameter || withholdingTaxParameter !== "Extended";
                    var emptyExtendedWHT = Lib.AP.WorkflowCtrl.GetCurrentStepRole() !== Lib.AP.WorkflowCtrl.roles.apStart && Controls.ExtendedWithholdingTax__.GetItemCount() < 1;
                    if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart) {
                        // add the empty line for AP Start
                        Controls.ExtendedWithholdingTax__.SetAtLeastOneLine(true);
                    }
                    Controls.ExtendedWithholdingTax__.SetWidth("100%");
                    Controls.ExtendedWithholdingTax__.SetExtendableColumn("WHTDescription__");
                    Controls.ExtendedWithholdingTaxPane.Hide(notExtendedWHT || emptyExtendedWHT);
                    Controls.ExtendedWithholdingTaxPane.SetReadOnly(notExtendedWHT || emptyExtendedWHT || !isAP);
                    Controls.SubsequentDocument__.SetReadOnly(true);
                    Controls.Simulate.SetDisabled(true);
                };
                InvoiceLayout.prototype.Reset = function () {
                    // Restore unmanaged fields
                    Lib.ERP.Layout.prototype.Reset.call(this);
                    Controls.LineItems__.InternalOrder__.SetAllowTableValuesOnly(false);
                    Controls.LineItems__.WBSElement__.SetAllowTableValuesOnly(false);
                    Controls.SAPPaymentMethod__.SetAllowTableValuesOnly(false);
                    Controls.LineItems__.CostCenter__.SetAllowTableValuesOnly(false);
                    Controls.VendorName__.SetAllowTableValuesOnly(false);
                    Controls.VendorNumber__.SetAllowTableValuesOnly(false);
                    Controls.LineItems__.TaxCode__.SetAllowTableValuesOnly(false);
                    Controls.LineItems__.GLAccount__.SetAllowTableValuesOnly(false);
                    Controls.ERPInvoiceNumber__.SetReadOnly(true);
                    Controls.ERPInvoiceNumber__.SetBrowsable(true);
                    delete Controls.PaymentTerms__.OnChange;
                    delete Controls.PostingDate__.OnChange;
                    delete Controls.InvoiceDate__.OnChange;
                    // TEMP TAXCODE NOT HANDLED
                    Controls.CalculateTax__.SetReadOnly(false);
                    Controls.SubsequentDocument__.SetReadOnly(false);
                    Controls.Simulate.SetDisabled(false);
                };
                InvoiceLayout.prototype.UpdateLayoutForManualLink = function () {
                    _super.prototype.UpdateLayoutForManualLink.call(this);
                    var bEnable = Controls.ManualLink__.IsChecked();
                    Controls.LineItems__.SetAtLeastOneLine(!bEnable);
                    // remove the requirement on TaxCode__ if we are in Manual Link mode
                    Controls.ManualLinkExplanation__.Hide(!bEnable);
                    Controls.Line_items.SetReadOnly(bEnable);
                    Controls.Line_items.Hide(bEnable);
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
                    Controls.Simulate.SetDisabled(true);
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
            SAPS4CLOUD.InvoiceLayout = InvoiceLayout;
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
                    _this.layout = new Lib.ERP.SAPS4CLOUD.InvoiceLayout(_this);
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
                    return true;
                };
                InvoiceClient.prototype.ResetBankDetailsSelection = function () {
                    Controls.SelectedBankAccountID__.SetValue("");
                };
                InvoiceClient.prototype.IsBankDetailsRowSelectable = function (row) {
                    if (row.BankDetails_ID__.GetText() === "") {
                        return false;
                    }
                    return true;
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
                    this.ComputePaymentAmountsAndDates.call(this, true, true);
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
                    this.ComputePaymentAmountsAndDates.call(this, false, true);
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
            }(Lib.ERP.SAPS4CLOUD.Invoice));
            SAPS4CLOUD.InvoiceClient = InvoiceClient;
        })(SAPS4CLOUD = ERP.SAPS4CLOUD || (ERP.SAPS4CLOUD = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAPS4CLOUD.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.SAPS4CLOUD.InvoiceClient(manager);
};
