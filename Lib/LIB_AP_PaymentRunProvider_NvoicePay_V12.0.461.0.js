/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_AP_PaymentRunProvider_NvoicePay_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Payment runs - NvoicePay implementation",
  "require": [
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_Database",
    "Sys/Sys_Parameters",
    "Lib_AP_PaymentRunProvider_V12.0.461.0",
    "Lib_AP_PaymentRunProvider_NvoicePay_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var PaymentRunProvider;
        (function (PaymentRunProvider) {
            var NvoicePay;
            (function (NvoicePay) {
                var PaymentRun = /** @class */ (function (_super) {
                    __extends(PaymentRun, _super);
                    function PaymentRun(manager) {
                        return _super.call(this, manager) || this;
                    }
                    PaymentRun.prototype.Post = function () {
                        return this.manager.Post();
                    };
                    PaymentRun.prototype.GetData = function () {
                        var payload = {
                            invoices: []
                        };
                        var vendorsCache = {};
                        var lineItemsTable = Data.GetTable("LineItems__");
                        for (var i = 0; i < lineItemsTable.GetItemCount(); i++) {
                            var lineItem = lineItemsTable.GetItem(i);
                            if (lineItem.GetValue("Rejected__")) {
                                continue;
                            }
                            var invoiceLine = {
                                invoiceID: "",
                                invoiceAmountToPay: "",
                                customerVendorName: "",
                                customerVendorID: "",
                                address_street1: "",
                                address_street2: "",
                                address_street3: "",
                                address_city: "",
                                address_zipOrPostalCode: "",
                                address_stateOrProvince: "",
                                address_country: "",
                                invoiceCurrency: "",
                                paymentCurrency: "",
                                settlementCurrency: "",
                                dueDate: "",
                                vendorCustomerAccount: "",
                                customerAccountIdentifier: "",
                                locationID: "",
                                referenceNumber: "",
                                grossInvoiceAmount: "",
                                invoiceDate: "",
                                invoiceRef: "",
                                PONumber: "",
                                scheduledDate: "",
                                discountAmount: 0,
                                applyDiscount: "N"
                            };
                            invoiceLine.invoiceRef = lineItem.GetValue("RuidEx__");
                            invoiceLine.invoiceID = lineItem.GetValue("InvoiceNumber__");
                            invoiceLine.grossInvoiceAmount = lineItem.GetValue("InvoiceAmount__");
                            invoiceLine.invoiceAmountToPay = lineItem.GetValue("InvoiceAmount__");
                            invoiceLine.customerVendorName = lineItem.GetValue("VendorName__");
                            invoiceLine.customerVendorID = lineItem.GetValue("CompanyCode__") + "-" + lineItem.GetValue("VendorNumber__");
                            invoiceLine.dueDate = lineItem.GetValue("DueDate__");
                            invoiceLine.invoiceCurrency = lineItem.GetValue("InvoiceCurrency__");
                            invoiceLine.paymentCurrency = lineItem.GetValue("InvoiceCurrency__");
                            invoiceLine.customerAccountIdentifier = this.manager.GetBankAccountId();
                            invoiceLine.locationID = this.manager.GetLocationId();
                            invoiceLine.settlementCurrency = "USD";
                            invoiceLine.PONumber = lineItem.GetValue("OrderNumber__");
                            // Get vendor additional informations
                            var companyCode = lineItem.GetValue("CompanyCode__");
                            var vendorNumber = lineItem.GetValue("VendorNumber__");
                            // Applying discount if there are any and it's still valid. The try/catch is for new Date() that can throw
                            try {
                                var lineDiscountLimitDate = lineItem.GetValue("DiscountLimitDate__");
                                var discountLimitDate = new Date(lineDiscountLimitDate);
                                var currentDate = new Date();
                                currentDate.setHours(0, 0, 0, 0);
                                if (lineDiscountLimitDate && discountLimitDate > currentDate) {
                                    var discountAmount = Number(lineItem.GetValue("EstimatedDiscountAmount__"));
                                    var invoiceAmount = Number(lineItem.GetValue("InvoiceAmount__"));
                                    if (Number.isNaN(discountAmount)) {
                                        Log.Error("EstimatedDiscountAmount__ is NaN. Value: ".concat(lineItem.GetValue("EstimatedDiscountAmount__")));
                                    }
                                    else if (Number.isNaN(invoiceAmount)) {
                                        Log.Error("InvoiceAmount__ is NaN. Value: ".concat(lineItem.GetValue("InvoiceAmount__")));
                                    }
                                    else {
                                        invoiceLine.applyDiscount = "Y";
                                        invoiceLine.discountAmount = discountAmount;
                                        invoiceLine.invoiceAmountToPay = (invoiceAmount - discountAmount).toString();
                                    }
                                }
                            }
                            catch (e) {
                                Log.Error("Error trying to apply the discount.");
                            }
                            vendorsCache[companyCode] = vendorsCache[companyCode] || {};
                            vendorsCache[companyCode][vendorNumber] = vendorsCache[companyCode][vendorNumber] || this.GetVendorInfo(companyCode, vendorNumber);
                            for (var _i = 0, _a = Object.keys(vendorsCache[companyCode][vendorNumber]); _i < _a.length; _i++) {
                                var param = _a[_i];
                                invoiceLine[param] = vendorsCache[companyCode][vendorNumber][param];
                            }
                            payload.invoices.push(invoiceLine);
                        }
                        return {
                            "payload": payload,
                            "companyID": this.manager.GetCompanyId()
                        };
                    };
                    PaymentRun.prototype.GetVendorInfo = function (companyCode, vendorNumber) {
                        var vendorInfos = {};
                        var vendorAttributesMap = {
                            address_street1: "Street__",
                            address_city: "City__",
                            address_zipOrPostalCode: "PostalCode__",
                            address_stateOrProvince: "Region__",
                            address_country: "Country__"
                        };
                        var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("Number__", vendorNumber)).toString();
                        var queryResult = Sys.Helpers.Database.GetFirstRecordResult("AP - Vendors__", filter);
                        if (queryResult) {
                            for (var _i = 0, _a = Object.keys(vendorAttributesMap); _i < _a.length; _i++) {
                                var param = _a[_i];
                                vendorInfos[param] = queryResult.GetValue_String(vendorAttributesMap[param], 0);
                            }
                        }
                        else {
                            Log.Error("Unable to retrieve vendor informations : " + Query.GetLastErrorMessage());
                        }
                        return vendorInfos;
                    };
                    return PaymentRun;
                }(Lib.AP.PaymentRunProvider.PaymentRun.Instance));
                NvoicePay.PaymentRun = PaymentRun;
            })(NvoicePay = PaymentRunProvider.NvoicePay || (PaymentRunProvider.NvoicePay = {}));
        })(PaymentRunProvider = AP.PaymentRunProvider || (AP.PaymentRunProvider = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
Lib.AP.PaymentRunProvider.NvoicePay.Manager.prototype.paymentRunFactory = function (manager) {
    return new Lib.AP.PaymentRunProvider.NvoicePay.PaymentRun(manager);
};
