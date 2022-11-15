/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_JDE_Invoice_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Client Invoice document for JDE ERP - system library",
  "require": [
    "Lib_ERP_JDE_Manager_V12.0.461.0",
    "Lib_ERP_Generic_Invoice_Client_V12.0.461.0",
    "LIB_AP_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Controls"
  ]
}*/
// Class JDEERPInvoiceLayout : Layout
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var JDE;
        (function (JDE) {
            var InvoiceLayout = /** @class */ (function (_super) {
                __extends(InvoiceLayout, _super);
                function InvoiceLayout(parentContainer) {
                    return _super.call(this, parentContainer) || this;
                }
                InvoiceLayout.prototype.Init = function () {
                    // Hide unmanaged fields
                    Lib.ERP.Generic.InvoiceLayout.prototype.Init.call(this);
                    Sys.Helpers.Controls.AddEventHandler(Controls.LineItems__.CostCenter__, "OnChange", function () {
                        var firstCostCenter = "";
                        var count = Controls.LineItems__.GetItemCount();
                        if (count > 0) {
                            var row = Controls.LineItems__.GetItem(0);
                            firstCostCenter = row.GetValue("CostCenter__");
                            row.SetWarning("CostCenter__", "");
                        }
                        for (var i = 1; i < count; i++) {
                            var row = Controls.LineItems__.GetItem(i);
                            var currentCostCenter = row.GetValue("CostCenter__");
                            if (!currentCostCenter || currentCostCenter === firstCostCenter) {
                                row.SetWarning("CostCenter__", "");
                            }
                            else {
                                row.SetWarning("CostCenter__", Language.Translate("_the value {0} will be integrated as cost center", false, firstCostCenter));
                            }
                        }
                    });
                };
                InvoiceLayout.prototype.Reset = function () {
                    // Restore unmanaged fields
                    Lib.ERP.Generic.InvoiceLayout.prototype.Reset.call(this);
                    Controls.LineItems__.CostCenter__.OnChange = null;
                };
                InvoiceLayout.prototype.checkPOInvoiceLineItemQuantity = function (item, InvoiceLineItem, dispatchMap) {
                    if (InvoiceLineItem.IsPOLineItem(item) || InvoiceLineItem.IsPOGLLineItem(item)) {
                        var error = "";
                        if (item.GetValue("OrderNumber__")) {
                            if (!dispatchMap) {
                                dispatchMap = InvoiceLineItem.GetDispatchedLinesAmountQuantity();
                            }
                            var key = InvoiceLineItem.GetDispatchKey(item);
                            var quantity = dispatchMap[key] ? dispatchMap[key].quantity : item.GetValue("Quantity__");
                            var openQuantity = item.GetValue("OpenQuantity__");
                            var expectedQuantity = item.GetValue("ExpectedQuantity__");
                            if (quantity > expectedQuantity) {
                                error = Language.Translate("_This value exceeds the expected quantity ({0})", false, Lib.ERP.Layout.prototype.decimalToString.call(expectedQuantity));
                            }
                            else if (quantity > openQuantity) {
                                error = Language.Translate("_This value exceeds the quantity still to be invoiced ({0})", false, Lib.ERP.Layout.prototype.decimalToString.call(openQuantity));
                            }
                        }
                        item.SetError("Quantity__", error);
                    }
                };
                return InvoiceLayout;
            }(Lib.ERP.Generic.InvoiceLayout));
            JDE.InvoiceLayout = InvoiceLayout;
            var InvoiceClient = /** @class */ (function (_super) {
                __extends(InvoiceClient, _super);
                function InvoiceClient(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.layout = new Lib.ERP.JDE.InvoiceLayout(_this);
                    // avoid heriting analytics axis from generic connector, should be done both server and client side
                    _this.analyticAxis = Lib.ERP.Invoice.commonAnalyticAxis;
                    return _this;
                }
                InvoiceClient.prototype.GetRequiredFields = function (callback) {
                    // Get default required fields
                    var required = Lib.ERP.Generic.InvoiceClient.prototype.GetRequiredFields.call(this);
                    required.Header.InvoiceNumber__ = true;
                    if (callback) {
                        required = callback(required) || required;
                    }
                    return required;
                };
                InvoiceClient.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    return false;
                };
                InvoiceClient.prototype.OnRefreshLineItemsTableEnd = function () {
                    if (Controls.InvoiceType__.GetValue() === Lib.AP.InvoiceType.PO_INVOICE && Controls.GRIV__.IsChecked()) {
                        Controls.LineItems__.DeliveryNote__.Hide(true);
                        Controls.LineItems__.GoodsReceipt__.Hide(false);
                    }
                };
                return InvoiceClient;
            }(Lib.ERP.Generic.InvoiceClient));
            JDE.InvoiceClient = InvoiceClient;
        })(JDE = ERP.JDE || (ERP.JDE = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.JDE.Manager.documentFactories[Lib.ERP.Invoice.docType] = function (manager) {
    return new Lib.ERP.JDE.InvoiceClient(manager);
};
