///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Shipping management",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Controls",
    "Lib_Shipping_V12.0.461.0",
    "Lib_Purchasing_POItems_V12.0.461.0",
    "Lib_Shipping_Workflow_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var Client;
        (function (Client) {
            var g_users; // Cache of users for DN => nicename resolution. TODO: we should load users dynamically instead of attempting to load all of them
            function InitControl(readOnly) {
                if (readOnly === void 0) { readOnly = false; }
                Controls.CarrierCombo__.Hide(false);
                //Carrier will be print when CarrierCombo__ is set to Other
                Controls.Carrier__.Hide(true);
                //Link stay hide because button is used to click on it.
                Controls.TrackingLink__.Hide(true);
                //fill options from lib shpping and lib shipping customization
                var carriersOptions = Controls.CarrierCombo__.GetAvailableValues();
                Lib.Shipping.GetCarrierNames().forEach(function (name) {
                    carriersOptions.push(name + "=" + name);
                });
                carriersOptions.push("Other=_Other");
                //Set all values from Lib and customization values
                Controls.CarrierCombo__.SetAvailableValues(carriersOptions);
                Lib.Shipping.Client.SetTrackingLink();
                Controls.Carrier__.Hide(Controls.CarrierCombo__.GetValue() != "Other");
                if (Controls.CarrierCombo__.GetValue() != "Other") {
                    Controls.Carrier__.SetValue(Controls.CarrierCombo__.GetValue());
                }
                Controls.CarrierCombo__.OnChange = function () {
                    if (Controls.CarrierCombo__.GetValue() == "Other") {
                        Controls.Carrier__.Hide(false);
                        Controls.Carrier__.SetValue("");
                    }
                    else {
                        Controls.Carrier__.SetValue(Controls.CarrierCombo__.GetValue());
                        Controls.Carrier__.Hide(true);
                    }
                    SetTrackingLink();
                };
                Controls.TrackingNumber__.OnChange = SetTrackingLink;
                Controls.TrackingNumber__.OnBrowse = function () {
                    Controls.TrackingLink__.Click();
                };
                Controls.ASNDeliveryDate__.OnChange = OnASNDeliveryDateChange;
                Lib.Shipping.Client.SetReadOnly(readOnly);
            }
            Client.InitControl = InitControl;
            function OnASNDeliveryDateChange() {
                var deliveryDate = Data.GetValue("ASNDeliveryDate__");
                var shippingDate = Data.GetValue("ShippingDate__");
                if (Sys.Helpers.Date.CompareDate(deliveryDate, shippingDate) < 0) {
                    Controls.ASNDeliveryDate__.SetError("_Invalid date");
                }
                else {
                    Controls.ASNDeliveryDate__.SetError("");
                }
            }
            Client.OnASNDeliveryDateChange = OnASNDeliveryDateChange;
            function SetTrackingLink() {
                var trackingNumber = Controls.TrackingNumber__.GetValue();
                var carrier = Controls.CarrierCombo__.GetValue();
                if (trackingNumber && carrier && carrier !== "Other") {
                    Controls.TrackingNumber__.SetBrowsable(true, { font: "esk-ifont-search", label: "_Track", style: "Button_Post" });
                    Controls.TrackingLink__.SetURL(Lib.Shipping.GetCarrierLink(carrier, trackingNumber));
                    Controls.TrackingLink__.SetText(Lib.Shipping.GetCarrierLink(carrier, trackingNumber));
                }
                else {
                    Controls.TrackingNumber__.SetBrowsable(false);
                    Controls.TrackingLink__.SetURL("");
                    Controls.TrackingLink__.SetText("");
                }
            }
            Client.SetTrackingLink = SetTrackingLink;
            function SetReadOnly(readOnly) {
                if (readOnly === void 0) { readOnly = true; }
                Controls.CarrierCombo__.SetReadOnly(readOnly);
                Controls.Carrier__.SetReadOnly(readOnly);
                if (!readOnly) {
                    Controls.Carrier__.SetPlaceholder(Language.Translate("_Please enter the carrier name"));
                }
            }
            Client.SetReadOnly = SetReadOnly;
            function InitBrowsePOItemControls(readOnly) {
                Controls.LineItems__.ItemPONumber__.SetReadOnly(readOnly);
                Controls.LineItems__.ItemPONumber__.SetRequired(!readOnly);
                Controls.LineItems__.ItemPOLineNumber__.SetReadOnly(readOnly);
                Controls.LineItems__.ItemPOLineNumber__.SetRequired(!readOnly);
                Controls.LineItems__.ItemDescription__.SetRequired(false);
                if (!readOnly) {
                    LoadUsers();
                    InitBrowsePOItemControl(Controls.LineItems__.ItemPONumber__);
                    InitBrowsePOItemControl(Controls.LineItems__.ItemPOLineNumber__);
                    InitBrowsePOItemControl(Controls.LineItems__.ItemDescription__);
                }
            }
            Client.InitBrowsePOItemControls = InitBrowsePOItemControls;
            function InitVendorNameControl(sourceType, readOnly) {
                Controls.VendorName__.Hide(sourceType === "Portal");
                Controls.VendorName__.SetReadOnly(readOnly);
                var onSelectItem = function (item) {
                    var companyCode = Controls.CompanyCode__.GetValue();
                    Lib.Shipping.ComputeVendorAddress(companyCode, item.GetValue("Number__"))
                        .Then(function (address) {
                        Controls.VendorAddress__.SetValue(address);
                    });
                };
                var onUnknownOrEmptyValue = function () {
                    Controls.VendorAddress__.SetValue("");
                };
                Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.VendorName__, onSelectItem, onUnknownOrEmptyValue, onUnknownOrEmptyValue);
            }
            Client.InitVendorNameControl = InitVendorNameControl;
            function LoadUsers() {
                if (!g_users) {
                    var options = {
                        table: "ODUSER",
                        filter: "(&(|(ACCOUNTLOCKED=0)(!(ACCOUNTLOCKED=*)))(Customer=0)(Vendor=0))",
                        attributes: ["login", "displayname"],
                        maxRecords: 100
                    };
                    Sys.GenericAPI.PromisedQuery(options)
                        .Then(function (results) { g_users = results; });
                }
            }
            function InitBrowsePOItemControl(ctrl) {
                var attrs = "RecipientDN__|ShipToAddress__|ShipToCompany__|CompanyCode__";
                if (!Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure")) {
                    var columns = ctrl.GetDisplayedColumns();
                    columns = columns.replace("|ItemUnit__", "");
                    ctrl.SetDisplayedColumns(columns);
                    attrs += "|ItemUnit__";
                }
                ctrl.SetAttributes(attrs);
                ctrl.HideSavedColumn();
                ctrl.AddSearchField({
                    type: "Text", id: "PONumber__", value: function () {
                        var item = g_currentBrowseCtrl.GetItem();
                        return !item.GetError("ItemPONumber__") && !item.GetWarning("ItemPONumber__") && g_currentBrowseCtrl.GetName() != "ItemPONumber__" ?
                            item.GetValue("ItemPONumber__") : null;
                    }
                });
                ctrl.AddSearchField({ type: "Text", id: "LineNumber__" });
                ctrl.AddSearchField({ type: "Text", id: "Description__" });
                ctrl.OnColumnFormating = FormatUserName;
                ctrl.OnSelectItem = OnSelectPOItem;
                ctrl.OnChange = OnPOItemChange;
                ctrl.OnBrowse = OnBrowsePOItem;
            }
            var g_currentBrowseCtrl;
            function OnBrowsePOItem() {
                g_currentBrowseCtrl = this;
            }
            function FormatUserName(attrName, value) {
                if (attrName.toUpperCase() == "REQUESTERDN__") {
                    value = Sys.Helpers.String.ExtractLoginFromDN(value);
                    if (g_users) {
                        var user = Sys.Helpers.Array.Find(g_users, function (u) {
                            return u.login == value;
                        });
                        if (user) {
                            value = user.displayname;
                        }
                    }
                }
                return value;
            }
            function CompleteLineItem(ctrl, item) {
                // Lines are already completed by extraction script
                if (User.isVendor) {
                    return;
                }
                var index = ctrl.GetRow().GetLineNumber(true);
                Lib.Shipping.CompleteFormItem(ctrl.GetItem(), item).Then(function (poItems) {
                    if (index == 1) {
                        Lib.Shipping.CompleteHeaderWithOrderData(poItems);
                    }
                    Lib.Shipping.Workflow.Rebuild();
                });
            }
            function OnSelectPOItem(item) {
                CompleteLineItem(this, item);
                var itemInError = Lib.Purchasing.Items.IsAsnLineItemsInError();
                // Show ItemCompanyCode__ only when in error
                Controls.LineItems__.ItemCompanyCode__.Hide(!itemInError);
            }
            function OnPOItemChange() {
                CompleteLineItem(this);
                var itemInError = Lib.Purchasing.Items.IsAsnLineItemsInError();
                // Show ItemCompanyCode__ only when in error
                Controls.LineItems__.ItemCompanyCode__.Hide(!itemInError);
            }
        })(Client = Shipping.Client || (Shipping.Client = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
