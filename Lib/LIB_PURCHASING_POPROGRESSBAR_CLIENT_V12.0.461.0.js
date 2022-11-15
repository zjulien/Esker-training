///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_POProgressBar_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Client",
  "comment": "Purchasing library to progress bar chart in PO",
  "require": [
    "Lib_P2P_Currency_V12.0.461.0",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_LdapUtil",
    "[Lib_CommonDialog_V12.0.461.0]",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "Lib_Purchasing_POItems_client_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var POProgressBar;
        (function (POProgressBar) {
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            var RECEIVED_COLOR_INDEX = 1;
            var PENDING_COLOR_INDEX = 11;
            var CANCELLED_COLOR_INDEX = 2;
            /**
             * Class used to store amount and display information
             * when the PO has to update his progress bar
             */
            var POProgressBarData = /** @class */ (function () {
                function POProgressBarData() {
                    this.AmountData = {
                        amountOrdered: new Sys.Decimal(0),
                        amountActuallyReceived: new Sys.Decimal(0),
                        amountCancelled: new Sys.Decimal(0),
                        amountStillOpen: new Sys.Decimal(0),
                        itemCurrency: Data.GetValue("Currency__"),
                        currency: CurrencyFactory.Get(Data.GetValue("Currency__"))
                    };
                }
                Object.defineProperty(POProgressBarData.prototype, "AmountData", {
                    get: function () { return this._amountData; },
                    set: function (amountData) { this._amountData = amountData; },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(POProgressBarData.prototype, "DisplayData", {
                    get: function () { return this._displayData; },
                    set: function (displayData) { this._displayData = displayData; },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(POProgressBarData.prototype, "AmountOrdered", {
                    get: function () { return this._amountData.amountOrdered; },
                    set: function (amount) { this._amountData.amountOrdered = amount; },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(POProgressBarData.prototype, "AmountActuallyReceived", {
                    get: function () { return this._amountData.amountActuallyReceived; },
                    set: function (amount) { this._amountData.amountActuallyReceived = amount; },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(POProgressBarData.prototype, "AmountCancelled", {
                    get: function () { return this._amountData.amountCancelled; },
                    set: function (amount) { this._amountData.amountCancelled = amount; },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(POProgressBarData.prototype, "AmountStillOpen", {
                    get: function () { return this._amountData.amountStillOpen; },
                    set: function (amount) { this._amountData.amountStillOpen = amount; },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(POProgressBarData.prototype, "ItemCurrency", {
                    get: function () { return this._amountData.itemCurrency; },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(POProgressBarData.prototype, "Currency", {
                    get: function () { return this._amountData.currency; },
                    enumerable: false,
                    configurable: true
                });
                POProgressBarData.prototype.GetProgressChart = function () {
                    var _this = this;
                    var chartDescription = {
                        "type": "progressBar",
                        "title": this.DisplayData.title,
                        "xAxis": {
                            "values": [
                                "percentage"
                            ]
                        },
                        "yAxis": { "min": 0, "max": 100 },
                        series: [],
                        "legend": {
                            "enabled": true,
                            "reversed": true
                        }
                    };
                    var percAccumulator = 0;
                    this._displayData.items.forEach(function (item, index) {
                        var itemPerc = Sys.Decimal.trunc(item.value.div(_this._displayData.total).toNumber() * 100).toNumber();
                        //to avoid rounding issue
                        if (index == (_this._displayData.items.length - 1)) {
                            itemPerc = 100 - percAccumulator;
                        }
                        else {
                            percAccumulator = percAccumulator + itemPerc;
                        }
                        //to avoid the dipslay of useless label
                        var lab = itemPerc + "%";
                        if (item.name === Language.Translate("_Pending") && item.value.equals(_this._displayData.total)) {
                            lab = "";
                        }
                        var serie = {
                            "name": item.name,
                            "type": "progressBar",
                            "colorIndex": item.colorIndex,
                            "values": {
                                "percentage": itemPerc
                            },
                            "dataLabelsColorIndex": 5,
                            "dataLabelsAlignment": "right",
                            "dataLabelsFormatter": function () {
                                return lab;
                            },
                            "tooltip": item.value.toString() + (item.currency ? " " + item.currency : "")
                        };
                        chartDescription.series.push(serie);
                    });
                    return chartDescription;
                };
                POProgressBarData.prototype.UpdateProgressBarTitle = function () {
                    var title = Language.Translate("_Amount received out of {0}{1}{2}", false, this.AmountActuallyReceived.toString(), this.AmountOrdered.toString(), this.ItemCurrency);
                    if (this.AmountCancelled.gt(0)) {
                        var title_complement = Language.Translate("_Cancelled{0}{1}", false, this.AmountCancelled.toString(), this.ItemCurrency);
                        title = title + " " + title_complement;
                    }
                    return title;
                };
                POProgressBarData.prototype.UpdateReceivedData = function () {
                    this.UpdateProgressBarData(this.AmountActuallyReceived, "_Received", RECEIVED_COLOR_INDEX);
                };
                POProgressBarData.prototype.UpdatePendingData = function () {
                    if (this.AmountStillOpen.gt(0)) {
                        this.UpdateProgressBarData(this.AmountStillOpen, "_Pending", PENDING_COLOR_INDEX);
                    }
                };
                POProgressBarData.prototype.UpdateCancelData = function () {
                    if (this.AmountCancelled.gt(0)) {
                        this.UpdateProgressBarData(this.AmountCancelled, "_Cancelled", CANCELLED_COLOR_INDEX);
                    }
                };
                POProgressBarData.prototype.UpdateProgressBarData = function (amountToUpDate, amountType, colorIndex) {
                    this._displayData.items.push({
                        name: Language.Translate(amountType),
                        value: amountToUpDate,
                        currency: this.ItemCurrency,
                        colorIndex: colorIndex
                    });
                };
                POProgressBarData.prototype.UpdateAmountFromItem = function (itemIndex) {
                    var table = Data.GetTable("LineItems__");
                    var item = table.GetItem(itemIndex);
                    var itemUnitPrice = new Sys.Decimal(item.GetValue("ItemNetAmount__") || 0)
                        .div(item.GetValue("ItemQuantity__"));
                    var itemDeliveredAmount = new Sys.Decimal(item.GetValue("ItemTotalDeliveredQuantity__")).mul(itemUnitPrice);
                    var itemReturnedAmount = new Sys.Decimal(item.GetValue("ItemReturnQuantity__") || 0).mul(itemUnitPrice);
                    var itemNetAmount = new Sys.Decimal(item.GetValue("ItemNetAmount__") || 0);
                    var itemOpenAmount = new Sys.Decimal(item.GetValue("ItemOpenAmount__") || 0);
                    var itemActuallyReceivedAmount = itemDeliveredAmount.sub(itemReturnedAmount);
                    //overdelivery is not displayed
                    var amountToAdd = Sys.Decimal.min(itemActuallyReceivedAmount, itemNetAmount);
                    //negative amounts (like credit note or discounts) are not considered as received/pending/ordered
                    this.AmountOrdered = itemNetAmount.gt(0) ? this.AmountOrdered.add(itemNetAmount) : this.AmountOrdered;
                    this.AmountActuallyReceived = amountToAdd.gt(0) ? this.AmountActuallyReceived.add(amountToAdd) : this.AmountActuallyReceived;
                    if (itemOpenAmount.gt(0)) {
                        this.AmountStillOpen = this.AmountStillOpen.add(itemOpenAmount);
                    }
                    else if (itemOpenAmount.equals(0)) {
                        var itemCancelledAmount = new Sys.Decimal(itemNetAmount).sub(Sys.Decimal.max(itemDeliveredAmount, 0));
                        this.AmountCancelled = this.AmountCancelled.add(Sys.Decimal.max(itemCancelledAmount, 0));
                    }
                };
                POProgressBarData.prototype.ApplyCurrencyToAmount = function () {
                    this.AmountOrdered = new Sys.Decimal(this.AmountOrdered.toFixed(this.Currency.amountPrecision));
                    this.AmountActuallyReceived = new Sys.Decimal(this.AmountActuallyReceived.toFixed(this.Currency.amountPrecision));
                    this.AmountCancelled = new Sys.Decimal(this.AmountCancelled.toFixed(this.Currency.amountPrecision));
                    this.AmountStillOpen = new Sys.Decimal(this.AmountStillOpen.toFixed(this.Currency.amountPrecision));
                };
                POProgressBarData.prototype.InitDisplayData = function (title) {
                    this.DisplayData =
                        {
                            title: title,
                            total: this.AmountOrdered,
                            items: []
                        };
                };
                return POProgressBarData;
            }());
            POProgressBar.POProgressBarData = POProgressBarData;
            function UpdateProgressBar() {
                var poProgressBar = new POProgressBarData();
                var table = Data.GetTable("LineItems__");
                for (var i = 0; i < table.GetItemCount(); i++) {
                    poProgressBar.UpdateAmountFromItem(i);
                }
                poProgressBar.ApplyCurrencyToAmount();
                var updatedTitle = poProgressBar.UpdateProgressBarTitle();
                poProgressBar.InitDisplayData(updatedTitle);
                poProgressBar.UpdateReceivedData();
                poProgressBar.UpdatePendingData();
                poProgressBar.UpdateCancelData();
                var chartData = poProgressBar.GetProgressChart();
                Controls.ProgressChart__.SetValue(chartData);
            }
            POProgressBar.UpdateProgressBar = UpdateProgressBar;
            function IsProgressBarVisible(isIternal) {
                var isFeatureEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("EnableOrderProgress", false);
                return isFeatureEnabled
                    && IsOrderStatusOk()
                    && !isIternal
                    && !Lib.Purchasing.POItems.HasNoGoodsReceipt()
                    && !Lib.Purchasing.POItems.HasSomeEmptyOpenAmount();
            }
            POProgressBar.IsProgressBarVisible = IsProgressBarVisible;
            function UpdateProgressBarIfVisible(isIternal) {
                if (IsProgressBarVisible(isIternal)) {
                    Lib.Purchasing.POProgressBar.UpdateProgressBar();
                }
            }
            POProgressBar.UpdateProgressBarIfVisible = UpdateProgressBarIfVisible;
            function IsOrderStatusOk() {
                var status = Data.GetValue("OrderStatus__");
                return status === "To receive"
                    || status === "Auto receive"
                    || status === "Received"
                    || status === "Canceled"
                    || status === "Rejected";
            }
        })(POProgressBar = Purchasing.POProgressBar || (Purchasing.POProgressBar = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
