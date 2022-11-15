/*eslint class-methods-use-this: ["warn", { "exceptMethods": ["CheckError", "Retry"] }] */
/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAP_Invoice_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Client Invoice document for SAP ERP - system library",
  "require": [
    "LIB_AP_V12.0.461.0",
    "Lib_AP_TaxHelper_V12.0.461.0",
    "LIB_AP_SAP_BrowsePO_V12.0.461.0",
    "Lib_ERP_SAP_Manager_V12.0.461.0",
    "Lib_ERP_SAP_Invoice_V12.0.461.0",
    "Lib_ERP_Invoice_Client_V12.0.461.0",
    "Sys/Sys_Helpers_SAP_Client"
  ]
}*/
// Class Lib.ERP.SAP.SAPERPInvoiceClientLayout : Layout
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAP;
        (function (SAP) {
            var InvoiceLayout = /** @class */ (function (_super) {
                __extends(InvoiceLayout, _super);
                function InvoiceLayout(parentContainer) {
                    var _this = _super.call(this, parentContainer) || this;
                    _this.unmanagedfields.push("UpdatePayment");
                    _this.unmanagedfields.push({ name: "UnitOfMeasureCode__", table: "LineItems__" });
                    return _this;
                }
                InvoiceLayout.prototype.Init = function () {
                    //  call without managing the fields to avoid unintended regression
                    _super.prototype.Init.call(this, true);
                    Controls.InvoiceType__.SetText(Lib.AP.GetInvoiceTypeList());
                    //Controls.BaselineDate__.OnChange = (this.parentContainer as Lib.ERP.SAP.InvoiceClient).OnPaymentRelatedDateChange();
                    Controls.LineItems__.TaxCode__.SetDisplayedColumns("TaxCode__|Description__");
                    Lib.AP.Browse.Init(this.parentContainer);
                };
                InvoiceLayout.prototype.UpdateLayout = function () {
                    _super.prototype.UpdateLayout.call(this);
                    var isPoInvoice = Lib.AP.InvoiceType.isPOInvoice();
                    var isAP = Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart;
                    Controls.SubsequentDocument__.Hide(!isPoInvoice);
                    Controls.SubsequentDocument__.SetReadOnly(!isAP);
                    var withholdingTaxParameter = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("TaxesWithholdingTax", "");
                    Controls.WithholdingTax__.Hide(!withholdingTaxParameter || withholdingTaxParameter !== "Basic");
                    Controls.WithholdingTax__.SetReadOnly(isPoInvoice);
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
                    Controls.Line_items.SetReadOnly(bEnable);
                    Controls.Line_Items_Options.SetReadOnly(bEnable);
                    Controls.Line_Items_Options.Hide(bEnable);
                    Controls.Line_Items_Actions.SetReadOnly(bEnable);
                    Controls.Line_Items_Actions.Hide(bEnable);
                    Controls.LineItems__.SetAtLeastOneLine(!bEnable);
                    // remove the requirement on TaxCode__ if we are in Manual Link mode
                    Controls.InvoiceType__.SetReadOnly(bEnable);
                    Controls.ManualLinkExplanation__.Hide(!bEnable);
                    if (!ProcessInstance.isReadOnly) {
                        Controls.LineItems__.TaxJurisdiction__.SetBrowsable(!bEnable && !Controls.LineItems__.IsReadOnly());
                        if (bEnable) {
                            Controls.CalculateTax__.Check(true);
                        }
                    }
                    Controls.CalculateTax__.Hide(bEnable);
                    Controls.CalculateTax__.SetReadOnly(bEnable);
                };
                InvoiceLayout.prototype.Reset = function () {
                    Controls.PaymentTerms__.SetCustomQuery(null, null, null, null);
                    Controls.LineItems__.InternalOrder__.SetCustomQuery(null, null, null, null);
                    Controls.LineItems__.WBSElement__.SetCustomQuery(null, null, null, null);
                    Controls.SAPPaymentMethod__.SetCustomQuery(null, null, null, null);
                    Controls.AlternativePayee__.SetCustomQuery(null, null, null, null);
                    Controls.LineItems__.CostCenter__.SetCustomQuery(null, null, null, null);
                    Controls.LineItems__.TradingPartner__.SetCustomQuery(null, null, null, null);
                    Controls.VendorName__.SetCustomQuery(null, null, null, null);
                    Controls.VendorNumber__.SetCustomQuery(null, null, null, null);
                    Controls.LineItems__.TaxCode__.SetCustomQuery(null, null, null, null);
                    Controls.LineItems__.GLAccount__.SetCustomQuery(null, null, null, null);
                    Controls.BusinessArea__.SetCustomQuery(null, null, null, null);
                    Controls.LineItems__.BusinessArea__.SetCustomQuery(null, null, null, null);
                    Controls.PaymentTerms__.Hide(false);
                    Controls.SubsequentDocument__.Hide(true);
                };
                InvoiceLayout.prototype.EnableManualLink = function () {
                    _super.prototype.EnableManualLink.call(this);
                    Controls.ERPInvoiceNumber__.SetBrowsable(true);
                    Controls.ERPMMInvoiceNumber__.SetBrowsable(true);
                    Controls.ERPMMInvoiceNumber__.SetReadOnly(false);
                };
                InvoiceLayout.prototype.DisableManualLink = function () {
                    _super.prototype.DisableManualLink.call(this);
                    Controls.ERPInvoiceNumber__.SetBrowsable(false);
                    Controls.ERPMMInvoiceNumber__.SetBrowsable(false);
                    Controls.ERPMMInvoiceNumber__.SetReadOnly(true);
                };
                InvoiceLayout.prototype.ManualLinkERPInvoiceNumber = function (ctrl, layoutHelper, invoiceLineItem) {
                    _super.prototype.ManualLinkERPInvoiceNumber.call(this, ctrl, layoutHelper, invoiceLineItem);
                    var currentCtrl = ctrl;
                    var LayoutHelper = layoutHelper;
                    var InvoiceLineItem = invoiceLineItem;
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    var that = this;
                    /*
                        https://www.se80.co.uk/saptables/r/rseg/rseg.htm
                        Invoice				RBKP.XRECH = 'X' + RSEG.TBTKZ ''
                        Credit				RBKP.XRECH = ''  + RSEG.TBTKZ ''
                        Subsequent debit	RBKP.XRECH = 'X' + RSEG.TBTKZ 'X'
                        Subsequent credit	RBKP.XRECH = ''  + RSEG.TBTKZ 'X'
                    */
                    function querySubsequentCallBack() {
                        currentCtrl.Wait(false);
                        // eslint-disable-next-line no-invalid-this
                        var error = this.GetQueryError();
                        if (error) {
                            currentCtrl.SetError(error);
                            return;
                        }
                        var subsequentDoc = false;
                        // eslint-disable-next-line no-invalid-this
                        var queryValue = this.GetQueryValue();
                        if (queryValue.Records && queryValue.Records.length > 0) {
                            var subsequentIndicator = queryValue.GetQueryValue("TBTKZ", 0);
                            subsequentDoc = Boolean(subsequentIndicator);
                        }
                        Data.SetValue("SubsequentDocument__", subsequentDoc);
                        Log.Info("Subsequent document: '" + subsequentDoc + "'");
                        Lib.AP.WorkflowCtrl.Rebuild(true, true, "manualLink");
                        LayoutHelper.DisableButtons(false, "ManualLinkERPInvoiceNumber");
                    }
                    function queryInvoiceItemsCallBack(queryResult, isFI) {
                        currentCtrl.Wait(false);
                        var error = queryResult.GetQueryError();
                        if (error) {
                            currentCtrl.SetError(error);
                            return;
                        }
                        var queryValue = queryResult.GetQueryValue();
                        if (queryValue.Records && queryValue.Records.length > 0) {
                            var amount = void 0;
                            var totalAmount = 0;
                            for (var i = 0; i < queryValue.Records.length; i++) {
                                var quantity = queryValue.GetQueryValue("Quantity__", i);
                                amount = queryValue.GetQueryValue("Amount__", i);
                                var item = void 0;
                                if (isFI || queryValue.GetQueryValue("ESK_BAPI_TABLE_LINK_NAME", i) === "GL_LINE_ITEM") {
                                    item = InvoiceLineItem.AddGLLineItem(Controls.LineItems__);
                                }
                                else {
                                    item = InvoiceLineItem.AddPOLineItem(Controls.LineItems__);
                                }
                                item.SetValue("OrderNumber__", queryValue.GetQueryValue("OrderNumber__", i));
                                item.SetValue("ItemNumber__", queryValue.GetQueryValue("ItemNumber__", i));
                                item.SetValue("Description__", queryValue.GetQueryValue("Description__", i));
                                item.SetValue("Quantity__", quantity);
                                item.SetValue("GLAccount__", queryValue.GetQueryValue("GLAccount__", i));
                                item.SetValue("GLDescription__", queryValue.GetQueryValue("GLDescription__", i));
                                item.SetValue("CostCenter__", queryValue.GetQueryValue("CostCenter__", i));
                                item.SetValue("CCDescription__", queryValue.GetQueryValue("CCDescription__", i));
                                item.SetValue("Assignment__", queryValue.GetQueryValue("Assignment__", i));
                                item.SetValue("TradingPartner__", queryValue.GetQueryValue("TradingPartner__", i));
                                item.SetValue("InternalOrder__", queryValue.GetQueryValue("InternalOrder__", i));
                                item.SetValue("WBSElement__", queryValue.GetQueryValue("WBSElement__", i));
                                item.SetValue("TaxCode__", queryValue.GetQueryValue("TaxCode__", i));
                                item.SetValue("TaxJurisdiction__", queryValue.GetQueryValue("TaxJurisdiction__", i));
                                item.SetValue("BusinessArea__", queryValue.GetQueryValue("BusinessArea__", i));
                                item.SetValue("TaxAmount__", queryValue.GetQueryValue("TaxAmount__", i));
                                item.SetValue("Amount__", amount);
                                item.SetValue("ExpectedQuantity__", quantity);
                                item.SetValue("ExpectedAmount__", amount);
                                item.SetValue("VendorNumber__", Controls.VendorNumber__.GetValue());
                                Lib.P2P.fillCostTypeFromGLAccount(item);
                                totalAmount += amount;
                            }
                            amount = Controls.InvoiceAmount__.GetValue();
                            if (totalAmount * amount < 0) {
                                var taxAmount = -Controls.TaxAmount__.GetValue();
                                amount = -amount;
                                Controls.InvoiceAmount__.SetValue(amount);
                                Controls.NetAmount__.SetValue(amount - taxAmount);
                                Controls.TaxAmount__.SetValue(taxAmount);
                            }
                            // When FI, "Calculate taxes", BSIK.WMWST is 0 --> Use item taxes
                            if (!Controls.TaxAmount__.GetValue()) {
                                var netAmount = that.computeHeaderAmount();
                                var taxAmount = Lib.AP.TaxHelper.computeHeaderTaxAmount();
                                Controls.NetAmount__.SetValue(netAmount);
                                Controls.TaxAmount__.SetValue(taxAmount);
                                Controls.InvoiceAmount__.SetValue(netAmount + taxAmount);
                                that.parentContainer.UpdateLocalAndCorporateAmounts();
                            }
                            var mmDocumentId = Data.GetValue("ERPMMInvoiceNumber__");
                            if (isFI || !mmDocumentId) {
                                Lib.AP.WorkflowCtrl.Rebuild(true, true, "manualLink");
                            }
                            else {
                                var obj = Lib.AP.ParseInvoiceDocumentNumber(mmDocumentId, true);
                                Log.Info("Get MM subsequent document indicator from table RSEG");
                                var filter = "BELNR = '" + obj.documentNumber + "' AND GJAHR = '" + obj.fiscalYear + "'";
                                Lib.AP.SAP.SAPQuery(querySubsequentCallBack, Variable.GetValueAsString("SAPConfiguration"), "RSEG", "TBTKZ", filter, 1);
                            }
                        }
                        LayoutHelper.DisableButtons(false, "ManualLinkERPInvoiceNumber");
                    }
                    function queryInvoiceCallBack(queryResult, isFI) {
                        currentCtrl.Wait(false);
                        if (queryResult.GetQueryError()) {
                            currentCtrl.SetError(queryResult.GetQueryError());
                            LayoutHelper.DisableButtons(false, "ManualLinkERPInvoiceNumber");
                            return;
                        }
                        var queryValue = queryResult.GetQueryValue();
                        if (queryValue.Records && queryValue.Records.length > 0) {
                            var companyCode = queryValue.GetQueryValue("CompanyCode__", 0);
                            var vendorNumber = queryValue.GetQueryValue("VendorNumber__", 0);
                            var refInvoiceNumber = queryValue.GetQueryValue("InvoiceReferenceNumber__", 0);
                            currentCtrl.Wait(true);
                            Controls.ERPPaymentBlocked__.SetValue(false);
                            Controls.CompanyCode__.SetValue(companyCode);
                            Controls.InvoiceCurrency__.SetValue(queryValue.GetQueryValue("InvoiceCurrency__", 0));
                            if (isFI) {
                                //Set ERPPostingDate as variable to get correct CCDescription
                                Variable.SetValueAsString("ERPPostingDate", queryValue.GetQueryValue("ERPPostingDate__", 0));
                                Controls.InvoiceType__.SetValue(Lib.AP.InvoiceType.NON_PO_INVOICE);
                                var fiInvoiceNumber_1 = Lib.AP.FormatInvoiceDocumentNumber(queryValue.GetQueryValue("ERPInvoiceNumber__", 0), queryValue.GetQueryValue("FiscalYear__", 0), companyCode);
                                Controls.ERPInvoiceNumber__.SetValue(fiInvoiceNumber_1);
                                Controls.ERPMMInvoiceNumber__.SetValue(null);
                                Lib.AP.SAP.GetMMDocumentIdFromFIDocumentId(function (mmInvoiceNb) {
                                    if (mmInvoiceNb) {
                                        Lib.AP.Browse.GetInvoiceDocument(queryInvoiceCallBack, mmInvoiceNb);
                                    }
                                    else {
                                        Lib.AP.Browse.GetInvoiceItems(queryInvoiceItemsCallBack, fiInvoiceNumber_1);
                                    }
                                }, fiInvoiceNumber_1);
                                if (queryValue.GetQueryValue("ERPPaymentBlocked__", 0)) {
                                    Controls.ERPPaymentBlocked__.SetValue(true);
                                }
                                if (refInvoiceNumber) {
                                    refInvoiceNumber = Lib.AP.FormatInvoiceDocumentNumber(refInvoiceNumber, queryValue.GetQueryValue("InvoiceReferenceFiscalYear__", 0), companyCode);
                                }
                            }
                            else {
                                Controls.InvoiceType__.SetValue(Lib.AP.InvoiceType.PO_INVOICE);
                                var mmInvoiceNumber = Lib.AP.FormatInvoiceDocumentNumber(queryValue.GetQueryValue("ERPMMInvoiceNumber__", 0), queryValue.GetQueryValue("FiscalYear__", 0));
                                Controls.ERPMMInvoiceNumber__.SetValue(mmInvoiceNumber);
                                Lib.AP.SAP.GetFIDocumentIdFromMMDocumentId(function (invoiceNumber) {
                                    Controls.ERPInvoiceNumber__.SetValue(invoiceNumber);
                                    queryUnblockPaymentPO(invoiceNumber);
                                }, mmInvoiceNumber, companyCode);
                                Lib.AP.Browse.GetInvoiceItems(queryInvoiceItemsCallBack, mmInvoiceNumber);
                                Controls.UnplannedDeliveryCosts__.SetValue(queryValue.GetQueryValue("UnplannedDeliveryCosts__", 0));
                                Controls.Investment__.Check(queryValue.GetQueryValue("Investment__", 0) === "X");
                                if (refInvoiceNumber) {
                                    refInvoiceNumber = Lib.AP.FormatInvoiceDocumentNumber(refInvoiceNumber, queryValue.GetQueryValue("InvoiceReferenceFiscalYear__", 0));
                                }
                            }
                            var objectType = queryValue.GetQueryValue("AWTYP", 0);
                            if (objectType) {
                                Variable.SetValueAsString("SAPObjectType", objectType);
                            }
                            Controls.InvoiceNumber__.SetValue(queryValue.GetQueryValue("InvoiceNumber__", 0));
                            Controls.OrderNumber__.SetValue("");
                            Controls.InvoiceDate__.SetValue(queryValue.GetQueryValue("InvoiceDate__", 0));
                            Controls.InvoiceDate__.SetError();
                            Controls.PostingDate__.SetValue(queryValue.GetQueryValue("ERPPostingDate__", 0));
                            Controls.ERPPostingDate__.SetValue(queryValue.GetQueryValue("ERPPostingDate__", 0));
                            Controls.VendorNumber__.SetValue(vendorNumber);
                            var amount = queryValue.GetQueryValue("InvoiceAmount__", 0);
                            Controls.InvoiceAmount__.SetValue(amount);
                            Controls.InvoiceDescription__.SetValue(queryValue.GetQueryValue("InvoiceDescription__", 0));
                            Controls.BaselineDate__.SetValue(queryValue.GetQueryValue("BaselineDate__", 0));
                            var paymentTerms = queryValue.GetQueryValue("PaymentTerms__", 0);
                            Controls.PaymentTerms__.SetValue(paymentTerms);
                            Controls.PaymentTerms__.Hide(!paymentTerms);
                            Controls.SAPPaymentMethod__.SetValue(queryValue.GetQueryValue("SAPPaymentMethod__", 0));
                            Controls.InvoiceReferenceNumber__.SetValue(refInvoiceNumber);
                            Controls.Assignment__.SetValue(queryValue.GetQueryValue("Assignment__", 0));
                            Controls.BusinessArea__.SetValue(queryValue.GetQueryValue("BusinessArea__", 0));
                            Controls.HeaderText__.SetValue(queryValue.GetQueryValue("HeaderText__", 0));
                            Controls.AlternativePayee__.SetValue(queryValue.GetQueryValue("AlternativePayee__", 0));
                            Controls.WithholdingTax__.SetValue(queryValue.GetQueryValue("WithholdingTax__", 0));
                            Controls.ManualLink__.Check(true);
                            var vendorNumberOnChangeParams = {
                                manualLink: true,
                                GetExtendedWithholdingTax: null,
                                GetExtendedWithholdingTaxParams: null
                            };
                            var withholdingTaxParameter = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("TaxesWithholdingTax", "");
                            if (withholdingTaxParameter === "Extended") {
                                vendorNumberOnChangeParams.GetExtendedWithholdingTax = Lib.AP.Browse.GetExtendedWithholdingTax;
                                vendorNumberOnChangeParams.GetExtendedWithholdingTaxParams = [extendedWithholdingTaxCallback, Controls.ERPInvoiceNumber__.GetValue()];
                            }
                            Controls.VendorNumber__.OnChange.call(Controls.VendorNumber__, vendorNumberOnChangeParams);
                            LayoutHelper.UpdateLayout(false);
                            var taxAmount = queryValue.GetQueryValue("TaxAmount__", 0);
                            Controls.NetAmount__.SetValue(amount - taxAmount);
                            Controls.TaxAmount__.SetValue(taxAmount);
                            Lib.AP.GetInvoiceDocument().UpdateLocalCurrency()
                                .Then(function () {
                                that.parentContainer.UpdateLocalAndCorporateAmounts();
                                Controls.Balance__.SetValue(0);
                                Controls.Balance__.SetError();
                                that.parentContainer.ComputePaymentAmountsAndDates(true, true);
                            });
                        }
                        else {
                            currentCtrl.SetError("_ERP Invoice number no found");
                            LayoutHelper.DisableButtons(false, "ManualLinkERPInvoiceNumber");
                        }
                    }
                    function extendedWithholdingTaxCallback(queryResult) {
                        var table = Data.GetTable("ExtendedWithholdingTax__");
                        table.SetItemCount(0);
                        if (queryResult) {
                            var queryValue = queryResult.GetQueryValue();
                            if (queryValue.Records && queryValue.Records.length > 0) {
                                var count = queryValue.Records.length;
                                for (var i = 0; i < count; i++) {
                                    var item = table.AddItem();
                                    for (var j in queryValue.RecordsDefinition.attributes) {
                                        if (Object.prototype.hasOwnProperty.call(queryValue.RecordsDefinition.attributes, j)) {
                                            var attr = queryValue.RecordsDefinition.attributes[j];
                                            item.SetValue(attr, queryValue.GetQueryValue(attr, i));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    function queryUnblockPaymentPO(fiInvoiceNumber) {
                        var queryCallBackBSEG = function () {
                            // eslint-disable-next-line no-invalid-this
                            var queryValue = this.GetQueryValue();
                            if (queryValue.Records && queryValue.Records.length > 0 && queryValue.GetQueryValue("ZLSPR", 0)) {
                                Controls.ERPPaymentBlocked__.SetValue(true);
                            }
                        };
                        var fi = Lib.AP.ParseInvoiceDocumentNumber(fiInvoiceNumber, true);
                        if (fi) {
                            var options = "BUKRS = '".concat(fi.companyCode, "' AND BELNR = '").concat(fi.documentNumber, "' AND GJAHR = '").concat(fi.fiscalYear, "'");
                            Lib.AP.SAP.SAPQuery(queryCallBackBSEG, Variable.GetValueAsString("SAPConfiguration"), "BSEG", "ZLSPR", options, 1, 0);
                        }
                    }
                    LayoutHelper.DisableButtons(true, "ManualLinkERPInvoiceNumber");
                    // Reset potential posting error
                    Controls.ERPPostingError__.SetValue("");
                    var erpInvoiceNumber = currentCtrl.GetValue();
                    if (erpInvoiceNumber) {
                        currentCtrl.Wait(true);
                        if (!Lib.AP.Browse.GetInvoiceDocument(queryInvoiceCallBack, erpInvoiceNumber)) {
                            currentCtrl.SetError("_ERP Invoice number no found");
                            currentCtrl.Wait(false);
                            LayoutHelper.DisableButtons(false, "ManualLinkERPInvoiceNumber");
                        }
                    }
                    else {
                        Controls.InvoiceType__.SetValue(Lib.AP.InvoiceType.NON_PO_INVOICE);
                        Controls.CompanyCode__.SetValue(null);
                        Controls.ERPInvoiceNumber__.SetValue("");
                        Controls.ERPMMInvoiceNumber__.SetValue("");
                        Controls.InvoiceNumber__.SetValue("");
                        Controls.OrderNumber__.SetValue("");
                        Controls.InvoiceDate__.SetValue("");
                        Controls.PostingDate__.SetValue("");
                        Controls.ERPPostingDate__.SetValue("");
                        Controls.InvoiceCurrency__.SetValue("");
                        Controls.VendorNumber__.SetValue("");
                        Controls.InvoiceAmount__.SetValue(null);
                        Controls.Investment__.Check(false);
                        Controls.InvoiceDescription__.SetValue(null);
                        Controls.BaselineDate__.SetValue(null);
                        Controls.PaymentTerms__.SetValue(null);
                        Controls.PaymentTerms__.Hide(true);
                        Controls.SAPPaymentMethod__.SetValue(null);
                        Controls.InvoiceReferenceNumber__.SetValue(null);
                        Controls.Assignment__.SetValue(null);
                        Controls.BusinessArea__.SetValue(null);
                        Controls.HeaderText__.SetValue(null);
                        Controls.AlternativePayee__.SetValue(null);
                        Controls.WithholdingTax__.SetValue(null);
                        Controls.ManualLink__.Check(false);
                        Controls.VendorNumber__.OnChange();
                        LayoutHelper.UpdateLayout(false);
                        Controls.NetAmount__.SetValue(0);
                        Controls.TaxAmount__.SetValue(0);
                        that.parentContainer.UpdateLocalAndCorporateAmounts();
                        Controls.Balance__.SetValue(0);
                        Controls.Balance__.SetError();
                        LayoutHelper.DisableButtons(false, "ManualLinkERPInvoiceNumber");
                    }
                };
                InvoiceLayout.prototype.GetAndFillDescriptionFromCode = function (item, params, doneCallBack) {
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    var that = this;
                    if (!item || !params) {
                        if (doneCallBack) {
                            doneCallBack();
                        }
                        return;
                    }
                    if (!that.g_descriptionsCache) {
                        that.g_descriptionsCache = Lib.AP.NewSimpleMap();
                    }
                    if (!params.value) {
                        item.SetValue(params.formDescriptionField, "");
                        if (doneCallBack) {
                            doneCallBack();
                        }
                        return;
                    }
                    // Force uppercase for SAP
                    params.value = params.value.toUpperCase();
                    item.SetValue(params.formCodeField, params.value);
                    // Check if query already in cache
                    var cachedValue = that.g_descriptionsCache.Get(params.companyCode, params.formCodeField, params.value);
                    if (cachedValue) {
                        updateItem(item);
                    }
                    else {
                        var pendingQuery = that.g_descriptionsCache.GetPendingQuery(params);
                        if (pendingQuery && pendingQuery.callbacks.length > 0) {
                            pendingQuery.addCallback(updateItem, item);
                        }
                        else {
                            if (pendingQuery) {
                                pendingQuery.addCallback(updateItem, item);
                            }
                            else {
                                that.g_descriptionsCache.SetPendingQuery(params, updateItem, item);
                            }
                            if (params.disableButtons) {
                                params.disableButtons(true, "GetAndFillDescriptionFromCode");
                            }
                            params.getFunction(params.value, callback, params.companyCode);
                        }
                    }
                    function updateItem(curItem) {
                        var value = that.g_descriptionsCache.Get(params.companyCode, params.formCodeField, params.value, params.formDescriptionField);
                        if (value || value === "") {
                            curItem.SetValue(params.formDescriptionField, value);
                            curItem.SetCategorizedError(params.formCodeField, "", "");
                        }
                        else {
                            curItem.SetValue(params.formDescriptionField, "");
                            curItem.SetCategorizedError(params.formCodeField, Lib.AP.TouchlessException.InvalidValue, "Field value does not belong to table!");
                        }
                        if (doneCallBack) {
                            doneCallBack();
                        }
                    }
                    function loopOnPendingCallbacks() {
                        var query = that.g_descriptionsCache.GetPendingQuery(params);
                        if (query) {
                            var pendingCallback = query.callbacks.pop();
                            while (pendingCallback) {
                                pendingCallback.callback(pendingCallback.item);
                                pendingCallback = query.callbacks.pop();
                            }
                        }
                        else {
                            Log.Error("Unable to get description");
                            that.g_descriptionsCache.Clear();
                        }
                    }
                    function callback(description) {
                        if (params.disableButtons) {
                            params.disableButtons(false, "GetAndFillDescriptionFromCode");
                        }
                        // Fill cache
                        that.g_descriptionsCache.Add(params.companyCode, params.formCodeField, params.value, params.formDescriptionField, description);
                        loopOnPendingCallbacks();
                    }
                };
                return InvoiceLayout;
            }(Lib.ERP.Layout));
            SAP.InvoiceLayout = InvoiceLayout;
            var InvoiceClient = /** @class */ (function (_super) {
                __extends(InvoiceClient, _super);
                function InvoiceClient(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.OnBrowsePurchaseOrders = function (mainControl, AddLineItem, CleanUpLineItems, GetTaxRateForItemList, FormLayoutHelper) {
                        return function () {
                            var browsseFunc = Lib.AP.SAP.BrowsePO.BrowsePurchaseOrders;
                            if (Lib.AP.InvoiceType.isPOGLInvoice()) {
                                browsseFunc = Lib.AP.BrowsePO.BrowsePurchaseOrders;
                            }
                            browsseFunc(mainControl, AddLineItem, CleanUpLineItems, GetTaxRateForItemList, FormLayoutHelper);
                        };
                    };
                    _this.LoadTemplate = function (extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, noResultsCallback, callbackForEachLine, callbackFinal, waitScreenDuringLoadTemplateAction) {
                        Lib.AP.Parameters.LoadTemplate(extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, null, null, null, noResultsCallback, callbackForEachLine, callbackFinal, waitScreenDuringLoadTemplateAction);
                    };
                    _this.layout = new Lib.ERP.SAP.InvoiceLayout(_this);
                    return _this;
                }
                //////////////////////////////////////////
                // Overrides Lib.ERP.Invoice interface
                //////////////////////////////////////////
                InvoiceClient.prototype.ComputePaymentAmountsAndDates = function (computeAmounts, computeDates) {
                    if (!this.layout.g_SAPPaymentAmountsAndDatesCache) {
                        this.layout.g_SAPPaymentAmountsAndDatesCache = Lib.AP.NewSimpleMap();
                        this.layout.g_SAPPaymentAmountsAndDatesCache.IsParamsEquals = function (params, queryParams) {
                            return JSON.stringify(params) === JSON.stringify(queryParams);
                        };
                    }
                    var cache = this.layout.g_SAPPaymentAmountsAndDatesCache;
                    var companyCode = Data.GetValue("CompanyCode__");
                    var vendorNumber = Data.GetValue("VendorNumber__");
                    var paymentTerms = Data.GetValue("PaymentTerms__");
                    var invoiceDate = Data.GetValue("InvoiceDate__");
                    var isCreditNote = Lib.AP.IsCreditNote();
                    function ComputeDueDateCallBack(jsonResult) {
                        if (jsonResult.ERRORS && jsonResult.ERRORS.length > 0) {
                            if (jsonResult.ERRORS[0].code === 3) {
                                if (jsonResult.ERRORS[0].err === "EXCEPTION FU_NOT_FOUND RAISED") {
                                    Log.Warn("The function module Z_ESK_DETERMINE_DUE_DATE is missing on SAP server.");
                                }
                                else if (jsonResult.ERRORS[0].err === "EXCEPTION ACCOUNT_TYPE_NOT_SUPPORTED RAISED") {
                                    Log.Warn("The account type specified is not supported.");
                                }
                                else {
                                    Log.Warn(jsonResult.ERRORS[0].err);
                                }
                            }
                            if (computeDates) {
                                Data.SetValue("DueDate__", "");
                                Data.SetValue("DiscountLimitDate__", "");
                            }
                            if (computeAmounts) {
                                Data.SetValue("EstimatedDiscountAmount__", "");
                                Data.SetValue("LocalEstimatedDiscountAmount__", "");
                                Data.SetValue("EstimatedLatePaymentFee__", "");
                                Data.SetValue("LocalEstimatedLatePaymentFee__", "");
                            }
                        }
                        else if (jsonResult.IMPORTS) {
                            var duedate = jsonResult.IMPORTS.E_FAEDE;
                            var details = jsonResult.IMPORTS.DATEDETAILS;
                            if (duedate && computeDates) {
                                Data.SetValue("DueDate__", Sys.Helpers.SAP.FormatFromSAPDateTimeFormat(duedate));
                            }
                            if (details) {
                                // Support only for first discount period for now
                                var discountRate = jsonResult.IMPORTS.DISCOUNT1;
                                if (discountRate > 0) {
                                    if (computeDates) {
                                        var discountDate = jsonResult.IMPORTS.DATEDETAILS.SK1DT;
                                        Data.SetValue("DiscountLimitDate__", Sys.Helpers.SAP.FormatFromSAPDateTimeFormat(discountDate));
                                    }
                                    if (computeAmounts) {
                                        var estimatedDiscountAmount = Data.GetValue("NetAmount__") * (discountRate / 100);
                                        Data.SetValue("EstimatedDiscountAmount__", estimatedDiscountAmount);
                                        Data.SetValue("LocalEstimatedDiscountAmount__", estimatedDiscountAmount * Data.GetValue("ExchangeRate__"));
                                    }
                                }
                                else {
                                    Data.SetValue("DiscountLimitDate__", "");
                                    Data.SetValue("EstimatedDiscountAmount__", "");
                                    Data.SetValue("LocalEstimatedDiscountAmount__", "");
                                }
                            }
                            else {
                                Log.Warn("The function module Z_ESK_DETERMINE_DUE_DATE is not up to date on SAP server.");
                            }
                            Lib.ERP.SAP.InvoiceClient.prototype.ComputeLatePaymentFee();
                        }
                    }
                    if (!isCreditNote && companyCode && vendorNumber && paymentTerms && invoiceDate) {
                        var postingDate_1 = Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("PostingDate__"));
                        var baselineDate_1 = Lib.AP.SAP.FormatToSAPDateTimeFormat(Data.GetValue("BaselineDate__"));
                        var invoiceDateAsStr_1 = Lib.AP.SAP.FormatToSAPDateTimeFormat(invoiceDate);
                        vendorNumber = Sys.Helpers.String.SAP.NormalizeID(vendorNumber, 10);
                        var invoiceAmount = Data.GetValue("InvoiceAmount__");
                        var bapiParams_1 = {
                            "EXPORTS": {
                                "I_BLDAT": invoiceDateAsStr_1,
                                "I_BUDAT": postingDate_1,
                                "I_ZFBDT": baselineDate_1,
                                "I_ZTERM": paymentTerms,
                                "I_LIFNR": vendorNumber,
                                "I_BUKRS": companyCode,
                                "I_KOART": "D",
                                "I_SHKZG": invoiceAmount && invoiceAmount < 0 ? "H" : "S"
                            }
                        };
                        var loopOnPendingCallbacks_1 = function (jsonResult) {
                            var pendingQueryInLoop = cache.GetPendingQuery(bapiParams_1);
                            if (pendingQueryInLoop) {
                                var pendingCallback = pendingQueryInLoop.callbacks.pop();
                                while (pendingCallback) {
                                    pendingCallback.callback(jsonResult);
                                    pendingCallback = pendingQueryInLoop.callbacks.pop();
                                }
                            }
                            else {
                                Log.Error("Failed to compute payments dates and amounts");
                                cache.Clear();
                            }
                        };
                        var callback = function (jsonResult) {
                            // Fill cache
                            if (Lib.AP.SAP.UsesWebServices()) {
                                // Reformat dates in standard SAP Format to have an agnostic cache handling
                                jsonResult.IMPORTS.E_FAEDE = Sys.Helpers.Date.Format(new Date(jsonResult.IMPORTS.E_FAEDE), "yyyymmdd");
                                jsonResult.IMPORTS.DATEDETAILS.BLDAT = Sys.Helpers.Date.Format(new Date(jsonResult.IMPORTS.DATEDETAILS.BLDAT), "yyyymmdd");
                                jsonResult.IMPORTS.DATEDETAILS.NETDT = Sys.Helpers.Date.Format(new Date(jsonResult.IMPORTS.DATEDETAILS.NETDT), "yyyymmdd");
                                jsonResult.IMPORTS.DATEDETAILS.SK1DT = Sys.Helpers.Date.Format(new Date(jsonResult.IMPORTS.DATEDETAILS.SK1DT), "yyyymmdd");
                                jsonResult.IMPORTS.DATEDETAILS.SK2DT = Sys.Helpers.Date.Format(new Date(jsonResult.IMPORTS.DATEDETAILS.SK2DT), "yyyymmdd");
                                jsonResult.IMPORTS.DATEDETAILS.ZFBDT = Sys.Helpers.Date.Format(new Date(jsonResult.IMPORTS.DATEDETAILS.ZFBDT), "yyyymmdd");
                            }
                            cache.Add(companyCode, vendorNumber, paymentTerms, invoiceDateAsStr_1, postingDate_1, baselineDate_1, bapiParams_1.EXPORTS.I_SHKZG, jsonResult);
                            loopOnPendingCallbacks_1(jsonResult);
                        };
                        var cachedValue = cache.Get(companyCode, vendorNumber, paymentTerms, invoiceDateAsStr_1, postingDate_1, baselineDate_1, bapiParams_1.EXPORTS.I_SHKZG);
                        if (cachedValue) {
                            ComputeDueDateCallBack(cachedValue);
                        }
                        else {
                            var pendingQuery = cache.GetPendingQuery(bapiParams_1);
                            if (!pendingQuery || pendingQuery.callbacks.length === 0) {
                                cache.SetPendingQuery(bapiParams_1, ComputeDueDateCallBack);
                                Lib.AP.SAP.SAPCallBapi(callback, Variable.GetValueAsString("SAPConfiguration"), "Z_ESK_DETERMINE_DUE_DATE", bapiParams_1);
                            }
                            else {
                                pendingQuery.addCallback(ComputeDueDateCallBack);
                            }
                        }
                    }
                    else {
                        if (computeDates) {
                            Data.SetValue("DueDate__", "");
                            Data.SetValue("DiscountLimitDate__", "");
                        }
                        if (computeAmounts) {
                            Data.SetValue("EstimatedDiscountAmount__", "");
                            Data.SetValue("LocalEstimatedDiscountAmount__", "");
                            Data.SetValue("EstimatedLatePaymentFee__", "");
                            Data.SetValue("LocalEstimatedLatePaymentFee__", "");
                        }
                    }
                };
                InvoiceClient.prototype.StoreSelectedBankDetails = function (row) {
                    if (row.BankDetails_Select__.GetValue() === true) {
                        Variable.SetValueAsString("BankDetails_TypeSelected", row.BankDetails_Type__.GetValue());
                    }
                    else {
                        Variable.SetValueAsString("BankDetails_TypeSelected", "");
                    }
                };
                InvoiceClient.prototype.IsBankDetailsSelectionDisabled = function () {
                    return Boolean(Variable.GetValueAsString("DefaultAlternativePayee") || Data.GetValue("AlternativePayee__"));
                };
                InvoiceClient.prototype.ResetBankDetailsSelection = function () {
                    Variable.SetValueAsString("BankDetails_TypeSelected", "");
                };
                InvoiceClient.prototype.IsBankDetailsRowSelectable = function (row) {
                    if (row.BankDetails_Type__.GetText() === "") {
                        return false;
                    }
                    return true;
                };
                InvoiceClient.prototype.IsBankDetailsItemSelected = function (item) {
                    var selectedType = Variable.GetValueAsString("BankDetails_TypeSelected");
                    return selectedType && item.GetValue("BankDetails_Type__") === selectedType;
                };
                InvoiceClient.prototype.ValidateField = function () {
                    // Let SAP validate fields on simulation or post
                    return true;
                };
                InvoiceClient.prototype.OnPaymentTermsChangeCallback = function () {
                    _super.prototype.OnPaymentTermsChangeCallback.call(this);
                    this.OnPaymentRelatedDateChange();
                };
                InvoiceClient.prototype.OnPostingDateChangeCallback = function () {
                    _super.prototype.OnPostingDateChangeCallback.call(this);
                    this.OnPaymentRelatedDateChange();
                };
                InvoiceClient.prototype.OnInvoiceDateChangeCallback = function () {
                    _super.prototype.OnInvoiceDateChangeCallback.call(this);
                    this.OnPaymentRelatedDateChange();
                };
                InvoiceClient.prototype.OnBaselineDateChangeCallback = function () {
                    _super.prototype.OnBaselineDateChangeCallback.call(this);
                    this.OnPaymentRelatedDateChange();
                };
                InvoiceClient.prototype.OnPaymentRelatedDateChange = function () {
                    Lib.ERP.SAP.InvoiceClient.prototype.ComputePaymentAmountsAndDates.call(this, true, true);
                };
                InvoiceClient.prototype.ValidateData = function () {
                    var valid = true;
                    if (Lib.AP.InvoiceType.isConsignmentInvoice() && Lib.AP.IsCreditNote() && !Data.GetValue("ERPInvoiceNumber__")) {
                        Data.SetError("GoodIssue__", "_Credit note without settlement error");
                        valid = false;
                    }
                    else {
                        Data.SetError("GoodIssue__", "");
                    }
                    return valid;
                };
                InvoiceClient.prototype.OnRefreshLineItemsTableEnd = function () {
                    // do nothing
                };
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                InvoiceClient.prototype.CustomizeButtonsBehavior = function (ButtonsBehavior) {
                    // do nothing
                };
                InvoiceClient.prototype.GetExtendedWithholdingTax = function (vendorNumber) {
                    var _a;
                    var languageISO = "";
                    var userLangISO = ((_a = Sys.Helpers.Globals.User.language) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || "EN";
                    var userLangSAP = "";
                    return Sys.Helpers.Promise.Create(function (resolve, _reject) {
                        /**
                         * Query.SAPQuery callback
                         * @this QueryResult
                         */
                        function getWHTTypeCallback() {
                            var WHTTable = Data.GetTable("ExtendedWithholdingTax__");
                            WHTTable.SetItemCount(0);
                            var count = this.GetRecordsCount();
                            if (!this.GetQueryError() && count > 0) {
                                WHTTable.SetItemCount(count);
                                var _loop_1 = function (i) {
                                    var type = this_1.GetQueryValue("WITHT", i);
                                    var code = this_1.GetQueryValue("WT_WITHCD", i);
                                    var WHTItem = WHTTable.GetItem(i);
                                    WHTItem.SetValue("WHTType__", type);
                                    WHTItem.SetValue("WHTCode__", code);
                                    var descriptionFilter = code ? "(WITHT = '".concat(type, "' AND WT_WITHCD = '").concat(code, "')") : "(WITHT = '".concat(type, "')");
                                    var languageFilter = "";
                                    if (languageISO !== userLangISO) {
                                        languageFilter = "( SPRAS = '".concat(languageISO, "' OR SPRAS = '").concat(userLangISO, "')");
                                    }
                                    else {
                                        languageFilter = "SPRAS = '".concat(languageISO, "'");
                                    }
                                    descriptionFilter = "( ".concat(languageFilter, " AND LAND1 = '").concat(Data.GetValue("VendorCountry__"), "' AND ").concat(descriptionFilter, ")");
                                    Lib.AP.SAP.SAPQuery(function () {
                                        var descriptionCount = this.GetRecordsCount();
                                        if (!this.GetQueryError() && descriptionCount > 0) {
                                            var idDescription = 0;
                                            if (descriptionCount > 1 && this.GetQueryValue("SPRAS", 1) === userLangSAP) {
                                                idDescription = 1;
                                            }
                                            WHTItem.SetValue("WHTDescription__", this.GetQueryValue("TEXT40", idDescription));
                                        }
                                    }, Variable.GetValueAsString("SAPConfiguration"), "T059ZT", Lib.AP.SAP.UsesWebServices() ? "TEXT40|SPRAS" : "TEXT40|SPRAS1", descriptionFilter, 2, 0);
                                };
                                var this_1 = this;
                                for (var i = 0; i < count; i++) {
                                    _loop_1(i);
                                }
                            }
                            resolve();
                        }
                        function getLanguageCallback(lang) {
                            languageISO = lang;
                            var filter = "( BUKRS = '".concat(Data.GetValue("CompanyCode__"), "' AND LIFNR = '").concat(Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10), "' )");
                            Lib.AP.SAP.SAPQuery(getWHTTypeCallback, Variable.GetValueAsString("SAPConfiguration"), "LFBW", "WITHT|WT_WITHCD", filter, 20, 0);
                        }
                        function getUserSAPLanguageCallback(userLangSAPResponse) {
                            userLangSAP = userLangSAPResponse;
                            Lib.AP.SAP.SAPGetISOLanguage(getLanguageCallback, null);
                        }
                        Lib.AP.SAP.SAPGetSAPLanguageSync(getUserSAPLanguageCallback, userLangISO);
                    });
                };
                return InvoiceClient;
            }(Lib.ERP.SAP.Invoice));
            SAP.InvoiceClient = InvoiceClient;
        })(SAP = ERP.SAP || (ERP.SAP = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAP.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.SAP.InvoiceClient(manager);
};
