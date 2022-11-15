///#GLOBALS Lib Sys
/// <reference path="../../PAC/Purchasing V2/Purchase Order process V2/typings_withDeleted/Controls_Purchase_Order_process_V2/index.d.ts"/>
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Punchout_PO_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Punchout Library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Locale_Country"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Punchout;
        (function (Punchout) {
            var PO;
            (function (PO) {
                /**
                 * @exports Punchout
                 * @memberof Lib.Purchasing
                 */
                var g = Sys.Helpers.Globals;
                function UpdatePane(vendorNumber) {
                    var nbLineItems = g.Controls.LineItems__.GetItemCount();
                    var row = null;
                    Log.Info("[Punchout-UpdatePane()] Vendor ID: " + vendorNumber);
                    // Iterate starting from the first line item in error
                    for (var i = 0; i < nbLineItems; i++) {
                        row = g.Controls.LineItems__.GetRow(i);
                        if (row.GetItem()) {
                            this.CheckPunchoutRowValidity(row, vendorNumber);
                        }
                    }
                    g.Controls.ShipToAddress__.SetReadOnly(true);
                }
                PO.UpdatePane = UpdatePane;
                function GetFirstPunchoutLineItemIndex() {
                    var nbLineItems = g.Controls.LineItems__.GetItemCount();
                    for (var i = 0; i < nbLineItems; i++) {
                        var row = g.Controls.LineItems__.GetRow(i);
                        if (Lib.Purchasing.IsPunchoutRow(row)) {
                            // Check if this line was previously set in error
                            if (this.CheckRowHasPunchoutError(row)) {
                                row.ItemDescription__.SetError("");
                            }
                            return i;
                        }
                        if (!row.ItemDescription__.GetError()) {
                            row.ItemDescription__.SetError("_Only items coming from a punchout catalog can be selected.");
                        }
                    }
                    return null;
                }
                PO.GetFirstPunchoutLineItemIndex = GetFirstPunchoutLineItemIndex;
                // NOTE: 'vendorNumber' is an optional parameter.
                function CheckPunchoutRowValidity(row, vendorNumber) {
                    if (!vendorNumber) {
                        vendorNumber = Data.GetValue("VendorNumber__");
                    }
                    // Check if this line come from punchout or not ONLY if a valid vendor exist (Errors are already set if no valid vendor)
                    if (!Lib.Purchasing.IsPunchoutRow(row)) {
                        if (!row.ItemDescription__.GetError()) {
                            row.ItemDescription__.SetError("_Only items coming from a punchout catalog can be selected.");
                        }
                    }
                    else if (row.RequestedVendor__.GetValue() != vendorNumber) {
                        if (!row.ItemDescription__.GetError()) {
                            row.ItemDescription__.SetError("_Only items with the same punchout vendor can be selected.");
                        }
                    }
                    else {
                        row.ItemDescription__.SetError("");
                    }
                }
                PO.CheckPunchoutRowValidity = CheckPunchoutRowValidity;
                // NOTE: 'vendorNumber' is an optional paramater.
                function CheckPunchoutItemValidity(item) {
                    var vendorNumber = Data.GetValue("VendorNumber__");
                    // Check if this line come from punchout or not ONLY if a valid vendor exist (Errors are already set if no valid vendor)
                    if (!this.IsPunchoutLineItem(item)) {
                        if (!item.GetError("ItemDescription__")) {
                            item.SetError("ItemDescription__", "_Only items coming from a punchout catalog can be selected.");
                        }
                    }
                    else if (item.GetValue("RequestedVendor__") != vendorNumber) {
                        if (!item.GetError("ItemDescription__")) {
                            item.SetError("ItemDescription__", "_Only items with the same punchout vendor can be selected.");
                        }
                    }
                    else {
                        item.SetError("ItemDescription__", "");
                    }
                }
                PO.CheckPunchoutItemValidity = CheckPunchoutItemValidity;
                function CheckDeliveryAddressID(row, id) {
                    if (row.ItemDeliveryAddressID__.GetValue() !== id) {
                        if (!row.ItemDescription__.GetError()) {
                            row.ItemDescription__.SetError("_Error delivery adress is not the same as the first item");
                        }
                        return false;
                    }
                    else if (row.ItemDescription__.GetError() === Language.Translate("_Error delivery adress is not the same as the first item", false)) {
                        row.ItemDescription__.SetError("");
                        return true;
                    }
                    return true;
                }
                PO.CheckDeliveryAddressID = CheckDeliveryAddressID;
                function ResetPane() {
                    var nbLineItems = g.Controls.LineItems__.GetItemCount();
                    for (var i = 0; i < nbLineItems; i++) {
                        var row = g.Controls.LineItems__.GetRow(i);
                        if (row.ItemDescription__.GetError() != null && this.CheckRowHasPunchoutError(row)) {
                            row.ItemDescription__.SetError("");
                        }
                    }
                    var isShipToEditable = Data.GetValue("OrderStatus__") === "To order";
                    g.Controls.ShipToAddress__.SetReadOnly(!isShipToEditable);
                }
                PO.ResetPane = ResetPane;
                function CheckRowHasPunchoutError(row) {
                    if (row.ItemDescription__.GetError() === Language.Translate("_Only items with the same punchout vendor can be selected.", false)) {
                        return true;
                    }
                    else if (row.ItemDescription__.GetError() === Language.Translate("_Only items coming from a punchout catalog can be selected.", false)) {
                        return true;
                    }
                    else if (row.ItemDescription__.GetError() === Language.Translate("_Error delivery adress is not the same as the first item", false)) {
                        return true;
                    }
                    return false;
                }
                PO.CheckRowHasPunchoutError = CheckRowHasPunchoutError;
                function IsEnabled() {
                    return g.Controls.EmailNotificationOptions__.GetValue() == "PunchoutMode";
                }
                PO.IsEnabled = IsEnabled;
            })(PO = Punchout.PO || (Punchout.PO = {}));
        })(Punchout = Purchasing.Punchout || (Purchasing.Punchout = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
