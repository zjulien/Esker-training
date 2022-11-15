///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CheckPO_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_Object",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_AdditionalFees_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_ShipTo_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "[Lib_PO_Customization_Common]"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var CheckPO;
        (function (CheckPO) {
            CheckPO.requiredFields = [];
            if (Lib.P2P.Inventory.IsInternalOrder()) {
                CheckPO.requiredFields.push("WarehouseName__");
            }
            else {
                CheckPO.requiredFields.push("VendorName__");
            }
            Sys.Parameters.GetInstance("PAC").OnLoad(function () {
                if (!Lib.Purchasing.IsMultiShipTo()) {
                    CheckPO.requiredFields.push("ShipToCompany__");
                }
            });
            CheckPO.IsRequestedDeliveryDateInPastAllowed = Sys.Helpers.Object.ConstantGetter(function () {
                return Sys.Parameters.GetInstance("PAC").GetParameter("AllowRequestedDeliveryDateInPast", false);
            });
            function RemoveAllDownPaymentInputError() {
                Data.SetError("PaymentPercent__", "");
                Data.SetError("PaymentAmount__", "");
            }
            CheckPO.RemoveAllDownPaymentInputError = RemoveAllDownPaymentInputError;
            function CheckDownPaymentAmount() {
                var val = Data.GetValue("PaymentAmount__");
                if (val !== null && val !== 0 && (val < 0 || Data.GetValue("TotalNetAmount__") < val)) {
                    Data.SetError("PaymentAmount__", "_Payment amount must be between 0 and total net amout");
                    return false;
                }
                return true;
            }
            CheckPO.CheckDownPaymentAmount = CheckDownPaymentAmount;
            function CheckDownPaymentPercent() {
                var val = Data.GetValue("PaymentPercent__");
                if (val !== null && val !== 0 && (val < 0 || 100 < val)) {
                    Data.SetError("PaymentPercent__", "_Payment percent must be between 0 and 100");
                    return false;
                }
                return true;
            }
            CheckPO.CheckDownPaymentPercent = CheckDownPaymentPercent;
            function CheckDownPaymentExtraInfo() {
                var status = Data.GetValue("OrderStatus__");
                if (status === "To order") {
                    // no mandatory fields
                }
                else if (status === "To pay") {
                    return CheckRequiredFields([
                        "PaymentType__",
                        "PaymentDate__"
                    ]);
                }
                return true;
            }
            CheckPO.CheckDownPaymentExtraInfo = CheckDownPaymentExtraInfo;
            function CheckRequiredFields(controls2Check) {
                var ok = true;
                for (var i = 0; i < controls2Check.length; i++) {
                    if (Sys.Helpers.IsEmpty(Data.GetValue(controls2Check[i]))) {
                        Data.SetError(controls2Check[i], "This field is required!");
                        ok = false;
                    }
                }
                return ok;
            }
            CheckPO.CheckRequiredFields = CheckRequiredFields;
            function CheckItemsDeliveryDates(options) {
                options = options || {};
                var ok = true;
                var status = Data.GetValue("OrderStatus__");
                if (status === "To order") {
                    var atLeastOneDeliveryDateInPast = false;
                    var table = Data.GetTable("LineItems__");
                    var count = table.GetItemCount();
                    var today = new Date();
                    today.setHours(0, 0, 0, 0);
                    for (var i = 0; i < count; i++) {
                        var row = table.GetItem(i);
                        var isSpecificRow = !Sys.Helpers.IsNumeric(options.specificItemIndex) || options.specificItemIndex === i;
                        var selectedDateTime = row.GetValue("ItemRequestedDeliveryDate__");
                        if (selectedDateTime) {
                            selectedDateTime.setHours(0, 0, 0, 0);
                            var deliveryDateInPast = selectedDateTime < today;
                            if (deliveryDateInPast && isSpecificRow && !Lib.Purchasing.Items.IsServiceBasedItem(row)) {
                                if (CheckPO.IsRequestedDeliveryDateInPastAllowed()) {
                                    row.SetWarning("ItemRequestedDeliveryDate__", "_Warning date in the past");
                                }
                                else {
                                    row.SetError("ItemRequestedDeliveryDate__", "_Error date in the past");
                                    ok = false;
                                }
                            }
                            row.SetValue("RequestedDeliveryDateInPast__", deliveryDateInPast);
                            atLeastOneDeliveryDateInPast = atLeastOneDeliveryDateInPast || deliveryDateInPast;
                        }
                    }
                    Data.SetValue("AtLeastOneRequestedDeliveryDateInPast__", atLeastOneDeliveryDateInPast);
                }
                return ok;
            }
            CheckPO.CheckItemsDeliveryDates = CheckItemsDeliveryDates;
            function CheckItemsQuantities() {
                var ok = true;
                var table = Data.GetTable("LineItems__");
                var count = table.GetItemCount();
                for (var i = 0; i < count; i++) {
                    var item = table.GetItem(i);
                    ok = ok && CheckItemQuantity(item);
                }
                return ok;
            }
            CheckPO.CheckItemsQuantities = CheckItemsQuantities;
            function CheckAdditionalFeesAmounts() {
                var companyCode = Data.GetValue("CompanyCode__");
                var requiredIds = [];
                Sys.Helpers.Data.ForEachTableItem("AdditionalFees__", function (item /*, i*/) {
                    var additionalFeeID = item.GetValue("AdditionalFeeID__");
                    if (!Lib.Purchasing.AdditionalFees.GetValues(companyCode, additionalFeeID)) {
                        requiredIds.push(additionalFeeID);
                    }
                });
                var table = Data.GetTable("LineItems__");
                var exchangeRate = 1;
                var currency = "";
                if (table.GetItemCount() >= 1) {
                    exchangeRate = table.GetItem(0).GetValue("ItemExchangeRate__");
                    currency = table.GetItem(0).GetValue("ItemCurrency__");
                }
                function checklines() {
                    var additionalFeesSummary = {};
                    Sys.Helpers.Data.ForEachTableItem("AdditionalFees__", function (item /*, i*/) {
                        var additionalFeeID = item.GetValue("AdditionalFeeID__");
                        var amount = item.GetValue("Price__");
                        if (additionalFeesSummary[additionalFeeID]) {
                            additionalFeesSummary[additionalFeeID].amount = new Sys.Decimal(additionalFeesSummary[additionalFeeID].amount || 0).add(amount || 0).toNumber();
                        }
                        else {
                            var maxAmount = Sys.Helpers.Round(new Sys.Decimal(Lib.Purchasing.AdditionalFees.GetValues(companyCode, additionalFeeID).MaxAmount__).div(exchangeRate), 2).toNumber();
                            additionalFeesSummary[additionalFeeID] = {
                                amount: amount,
                                maxAmount: maxAmount
                            };
                        }
                    });
                    Sys.Helpers.Data.ForEachTableItem("AdditionalFees__", function (item /*, i*/) {
                        var additionalFeeID = item.GetValue("AdditionalFeeID__");
                        if (additionalFeesSummary[additionalFeeID].amount > additionalFeesSummary[additionalFeeID].maxAmount) {
                            item.SetError("Price__", Language.Translate("_Price exceeds max amount of {0} {1}", false, additionalFeesSummary[additionalFeeID].maxAmount, currency));
                        }
                        else if (item.GetValue("Price__")) {
                            item.SetError("Price__", "");
                        }
                    });
                }
                // Synchronous because server side
                return Lib.Purchasing.AdditionalFees.QueryValues(companyCode, requiredIds)
                    .Then(checklines);
            }
            CheckPO.CheckAdditionalFeesAmounts = CheckAdditionalFeesAmounts;
            function CheckValidityPeriod(ctrlName) {
                Data.SetError("ValidityStart__", "");
                Data.SetError("ValidityEnd__", "");
                var start = Data.GetValue("ValidityStart__");
                var end = Data.GetValue("ValidityEnd__");
                if (Sys.Helpers.Date.CompareDate(start, end) > 0) {
                    Data.SetError(ctrlName || "ValidityStart__", "_Validity period start date is later than end date");
                    return false;
                }
                return true;
            }
            CheckPO.CheckValidityPeriod = CheckValidityPeriod;
            function CheckAll() {
                // Checks everything, even if one fails
                var ok = true;
                ok = CheckDownPaymentPercent() && ok;
                ok = CheckDownPaymentAmount() && ok;
                ok = CheckDownPaymentExtraInfo() && ok;
                ok = CheckItemsDeliveryDates() && ok;
                ok = CheckItemsQuantities() && ok;
                ok = CheckRequiredFields(Lib.Purchasing.CheckPO.requiredFields) && ok;
                ok = CheckValidityPeriod() && ok;
                ok = Lib.Purchasing.ShipTo.CheckDeliveryAddress() && ok;
                if (Lib.Purchasing.IsMultiShipTo() && Data.GetValue("EmailNotificationOptions__") === "PunchoutMode") {
                    ok = Lib.Purchasing.ShipTo.CheckAllSameDeliveryAddress() && ok;
                }
                if (Sys.ScriptInfo.IsServer()) {
                    ok = CheckAdditionalFeesAmounts() && ok;
                }
                return ok;
            }
            CheckPO.CheckAll = CheckAll;
            function IsToleratedPrice(requisitionPrice, orderablePrice, orderPrice, toleranceLimit) {
                var toleratedPrice = new Sys.Decimal(orderablePrice);
                var d_orderPrice = new Sys.Decimal(orderPrice);
                if (toleranceLimit) {
                    var v = parseInt(toleranceLimit, 10);
                    if (toleranceLimit[toleranceLimit.length - 1] === "%") {
                        var requestedPrice = new Sys.Decimal(requisitionPrice);
                        toleratedPrice = toleratedPrice.add(requestedPrice.mul(v).div(100));
                    }
                    else {
                        toleratedPrice = toleratedPrice.add(v);
                    }
                }
                return d_orderPrice.lessThanOrEqualTo(toleratedPrice);
            }
            function IsItemPriceTolerated(requisitionPrice, orderablePrice, orderPrice) {
                return IsToleratedPrice(requisitionPrice, orderablePrice, orderPrice, Sys.Parameters.GetInstance("PAC").GetParameter("ItemPriceVarianceToleranceLimit"));
            }
            CheckPO.IsItemPriceTolerated = IsItemPriceTolerated;
            function IsTotalPriceTolerated(requisitionPrice, orderablePrice, orderPrice) {
                return IsToleratedPrice(requisitionPrice, orderablePrice, orderPrice, Sys.Parameters.GetInstance("PAC").GetParameter("TotalPriceVarianceToleranceLimit"));
            }
            CheckPO.IsTotalPriceTolerated = IsTotalPriceTolerated;
            function CheckItemQuantity(item) {
                var ok = true;
                if (Lib.Purchasing.Items.IsAmountBasedItem(item)) {
                    item.SetError("ItemQuantity__", "");
                }
                else {
                    if (Sys.Helpers.IsEmpty(item.GetValue("ItemQuantity__"))) {
                        item.SetError("ItemQuantity__", "This field is required!");
                        ok = false;
                    }
                    if (item.GetValue("ItemQuantity__") <= 0) {
                        //if there is already an error msg, do not replace it (overerdered error msg)
                        if (Sys.Helpers.IsEmpty(item.GetError("PRNumber__"))) {
                            item.SetValue("ItemQuantity__", null);
                            item.SetError("ItemQuantity__", "Value is not allowed!");
                        }
                        ok = false;
                    }
                    var customChangeAllowed = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.IsItemQuantityChangeAllowed", item);
                    var changeAllowed = customChangeAllowed || (customChangeAllowed === null &&
                        item.GetValue("ItemQuantity__") <= (item.IsNullOrEmpty("OrderableQuantity__") ? item.GetValue("ItemRequestedQuantity__") : item.GetValue("OrderableQuantity__")));
                    if (ok && !changeAllowed) {
                        item.SetError("ItemQuantity__", "_Quantity cannot exceed orderable quantity");
                        ok = false;
                    }
                }
                return ok;
            }
            CheckPO.CheckItemQuantity = CheckItemQuantity;
            function CheckLeadTime(item) {
                var leadTime = item.GetValue("LeadTime__");
                if (!Sys.Helpers.IsEmpty(leadTime)) {
                    var defaultDeliveryDate = new Date();
                    defaultDeliveryDate.setHours(0, 0, 0, 0);
                    defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + leadTime);
                    var deliveryDate = item.GetValue("ItemRequestedDeliveryDate__");
                    if (deliveryDate) {
                        deliveryDate.setHours(0, 0, 0, 0);
                    }
                    if (deliveryDate < defaultDeliveryDate) {
                        item.SetWarning("ItemRequestedDeliveryDate__", "_Warning the requested delivery date is too soon (expected {0} or later)", Language.FormatDate(defaultDeliveryDate));
                    }
                    else {
                        item.SetWarning("ItemRequestedDeliveryDate__", "");
                    }
                }
            }
            CheckPO.CheckLeadTime = CheckLeadTime;
            function CheckAllLeadTimes() {
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item /*, i*/) {
                    CheckLeadTime(item);
                });
            }
            CheckPO.CheckAllLeadTimes = CheckAllLeadTimes;
        })(CheckPO = Purchasing.CheckPO || (Purchasing.CheckPO = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
