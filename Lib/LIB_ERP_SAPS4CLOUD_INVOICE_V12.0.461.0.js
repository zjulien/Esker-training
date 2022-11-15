/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAPS4CLOUD_Invoice_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Invoice document for SAPS4CLOUD ERP - system library",
  "require": [
    "Lib_ERP_Invoice_V12.0.461.0",
    "Lib_ERP_SAPS4CLOUD_Manager_V12.0.461.0",
    "Lib_AP_WorkflowCtrl_V12.0.461.0",
    "Sys/Sys_Helpers_Promise",
    "[Sys/Sys_Helpers_Base64]"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAPS4CLOUD;
        (function (SAPS4CLOUD) {
            var Invoice = /** @class */ (function (_super) {
                __extends(Invoice, _super);
                /**
                         * @namespace Lib
                 * @memberof Lib.ERP
                 */
                function Invoice(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.analyticAxis = Lib.ERP.Invoice.commonAnalyticAxis.concat([
                        "Assignment__",
                        "BusinessArea__",
                        "InternalOrder__",
                        "TaxJurisdiction__",
                        "TradingPartner__",
                        "WBSElement__"
                    ]);
                    _this.lastWebServiceCallError = "";
                    _this.analyticAxis = Lib.ERP.Invoice.commonAnalyticAxis.concat([
                        "Assignment__",
                        "BusinessArea__",
                        "InternalOrder__",
                        "TaxJurisdiction__",
                        "TradingPartner__",
                        "WBSElement__"
                    ]);
                    return _this;
                }
                //////////////////////////////////////////
                // Overrides Lib.ERP.Invoice interface
                //////////////////////////////////////////
                /**
                    * Return the list of the fields whom validity should be checked against the local tables
                    * @returns {StoredInLocalTableFieldResolvers} required An object containing all the required fields in the local tables
                    */
                Invoice.prototype.GetStoredInLocalTableFields = function () {
                    // Get default required fields
                    var storedInLocalTableFields = _super.prototype.GetStoredInLocalTableFields.call(this);
                    storedInLocalTableFields.Header.InvoiceCurrency__ = true;
                    storedInLocalTableFields.Header.VendorNumber__ = true;
                    storedInLocalTableFields.Header.VendorName__ = true;
                    storedInLocalTableFields.Header.PaymentTerms__ = true;
                    storedInLocalTableFields.Header.SAPPaymentMethod__ = true;
                    storedInLocalTableFields.Header.AlternativePayee__ = true;
                    storedInLocalTableFields.LineItems__.GLAccount__ = true;
                    storedInLocalTableFields.LineItems__.TaxCode__ = !Lib.AP.TaxHelper.useMultipleTaxes();
                    storedInLocalTableFields.LineItems__.CostCenter__ = true;
                    storedInLocalTableFields.LineItems__.InternalOrder__ = true;
                    storedInLocalTableFields.LineItems__.WBSElement__ = true;
                    return storedInLocalTableFields;
                };
                Invoice.prototype.GetTaxRate = function (item, successCallback, errorCallback, finalCallback) {
                    var taxCode = item.GetValue("TaxCode__");
                    var filter = "TaxCode__=" + taxCode;
                    filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    Sys.GenericAPI.Query("AP - Tax codes__", filter, ["TaxCode__", "TaxRate__", "NonDeductibleTaxRate__"], function (result, err) {
                        if (err) {
                            errorCallback(item, err);
                        }
                        else {
                            var nonDeductibleTaxRate = result.length ? parseFloat(result[0].NonDeductibleTaxRate__) || 0 : 0;
                            successCallback(item, result.length ? parseFloat(result[0].TaxRate__) : 0, [nonDeductibleTaxRate]);
                        }
                        if (finalCallback) {
                            finalCallback();
                        }
                    }, null, 1, { useConstantQueryCache: true });
                };
                Invoice.prototype.GetTaxRateForTable = function (taxCodes, successCallback, errorCallback, finalCallback) {
                    function queryCallback(result) {
                        if (result) {
                            for (var taxCode in taxCodes) {
                                if (Object.prototype.hasOwnProperty.call(taxCodes, taxCode)) {
                                    var found = false;
                                    var taxRate = null;
                                    for (var j = 0; j < result.length && !found; j++) {
                                        taxRate = result[j].TaxRate__;
                                        found = taxRate && result[j].TaxCode__ === taxCode;
                                    }
                                    if (found) {
                                        successCallback(taxCodes[taxCode], parseFloat(taxRate));
                                    }
                                    else {
                                        errorCallback(taxCodes[taxCode], "Field value does not belong to table!");
                                    }
                                }
                            }
                        }
                        if (finalCallback) {
                            finalCallback();
                        }
                    }
                    var filter = "";
                    //Create filter for taxCode
                    for (var taxCodeFilter in taxCodes) {
                        if (Object.prototype.hasOwnProperty.call(taxCodes, taxCodeFilter)) {
                            filter += "(TaxCode__=" + taxCodeFilter + ")";
                        }
                    }
                    filter = "|" + filter + "";
                    filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                    Sys.GenericAPI.Query("AP - Tax codes__", filter, ["TaxCode__", "TaxRate__"], queryCallback, null, 100, { useConstantQueryCache: true });
                };
                Invoice.prototype.GetTaxRateForTableAsync = function (taxCodes) {
                    var queryPromise = Sys.Helpers.Promise.Create(function (resolve) {
                        var filter = "";
                        //Create filter for taxCode
                        for (var taxCodeFilter in taxCodes) {
                            if (Object.prototype.hasOwnProperty.call(taxCodes, taxCodeFilter)) {
                                filter += "(TaxCode__=" + taxCodeFilter + ")";
                            }
                        }
                        filter = "|" + filter + "";
                        filter = filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__"));
                        Sys.GenericAPI.Query("AP - Tax codes__", filter, ["TaxCode__", "TaxRate__"], resolve, null, 100, { useConstantQueryCache: true });
                    });
                    var resultPromise = queryPromise.then(function (result) {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            var taxCodeResults = [];
                            if (result) {
                                for (var taxCode in taxCodes) {
                                    if (Object.prototype.hasOwnProperty.call(taxCodes, taxCode)) {
                                        var found = false;
                                        var taxRate = null;
                                        for (var j = 0; j < result.length && !found; j++) {
                                            taxRate = result[j].TaxRate__;
                                            found = taxRate && result[j].TaxCode__ === taxCode;
                                        }
                                        var newTax = {
                                            items: taxCodes[taxCode],
                                            exists: found,
                                            taxRate: 0.0
                                        };
                                        if (newTax.exists) {
                                            newTax.taxRate = parseFloat(taxRate);
                                        }
                                        taxCodeResults.push(newTax);
                                    }
                                }
                            }
                            resolve(taxCodeResults);
                        });
                    });
                    return resultPromise;
                };
                /**
                 * Allow to select a bank details from an IBAN number
                 * @memberof Lib.ERP.SAPS4CLOUD.Invoice
                 * @param {Object} parameters Informations about the vendor
                 * @param {string} parameters.companyCode
                 * @param {string} parameters.vendorNumber
                 * @param {string} parameters.iban
                 */
                Invoice.prototype.SelectBankDetailsFromIBAN = function (parameters, resultCallback) {
                    var _this = this;
                    var selectBankDetails = function (vendorsBankAccounts) {
                        if (vendorsBankAccounts.length > 0) {
                            Data.SetValue("SelectedBankAccountID__", vendorsBankAccounts[0].ID);
                            resultCallback(vendorsBankAccounts[0], { hasBankAccount: true });
                        }
                        else {
                            resultCallback(null, { hasBankAccount: true });
                        }
                    };
                    var hasBankDetails = function (result) {
                        if (result) {
                            _this.GetVendorBankDetails(parameters, selectBankDetails);
                        }
                        else {
                            resultCallback(null, { hasBankAccount: false });
                        }
                    };
                    var hasBDParameters = {
                        companyCode: parameters.companyCode,
                        vendorNumber: parameters.vendorNumber
                    };
                    this.VendorHasBankDetails(hasBDParameters, hasBankDetails);
                };
                /**
                 * Retrieve the bank details based on the vendor informations
                 * @param {Object} parameters Informations about the vendor
                 * @param {string} parameters.companyCode
                 * @param {string} parameters.vendorNumber
                 * @param {string} parameters.iban
                 * @param {number} recordCount The number max of record to retrieve.
                 * @param {function} resultCallback Callback to call to fill the result table
                 */
                Invoice.prototype.InnerGetVendorBankDetails = function (parameters, recordCount, resultCallback) {
                    var bankAccountArray = [];
                    // Resets any previously set properties on the query.
                    function vendorBankDetailsCallBack(results /*, error: string*/) {
                        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                            var result = results_1[_i];
                            var bankAccountDetails = {
                                Country: result.BankCountry__,
                                Key: result.BankKey__,
                                Name: result.BankName__,
                                Account: result.BankAccount__,
                                Holder: result.AccountHolder__,
                                IBAN: result.IBAN__,
                                ID: result.BankAccountID__
                            };
                            bankAccountArray.push(bankAccountDetails);
                        }
                        resultCallback(bankAccountArray, { isSilentChange: parameters.isSilentChange });
                    }
                    var table = "AP - Bank details__";
                    var attributesList = ["BankCountry__", "BankKey__", "BankName__", "BankAccount__", "AccountHolder__", "IBAN__", "BankAccountID__"];
                    var sortOrder = "CompanyCode__ DESC,BankCountry__ ASC,BankName__ ASC,";
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", parameters.vendorNumber), parameters.iban ? Sys.Helpers.LdapUtil.FilterEqual("IBAN__", parameters.iban) : "", Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", parameters.companyCode)).toString();
                    Sys.GenericAPI.Query(table, filter, attributesList, vendorBankDetailsCallBack, sortOrder, recordCount);
                };
                /**
                 * Retrieve the bank details based on the vendor informations
                 * @param {Object} parameters Informations about the vendor
                 * @param {string} parameters.companyCode
                 * @param {string} parameters.vendorNumber
                 * @param {string} parameters.iban
                 * @param {boolean} parameters.isSilentChange Optionnal. if true apply silent change to action.
                 * @param {function} resultCallback Callback to call to fill the result table
                 */
                Invoice.prototype.GetVendorBankDetails = function (parameters, resultCallback) {
                    this.InnerGetVendorBankDetails(parameters, 10, resultCallback);
                };
                /**
                 * Retrieve if some bank details based on the vendor informations exists
                 * @memberof Lib.ERP.Invoice
                 * @param {Object} parameters Informations about the vendor
                 * @param {string} parameters.companyCode
                 * @param {string} parameters.vendorNumber
                 * @param {function} resultCallback Callback to call to fill the result table
                 */
                Invoice.prototype.VendorHasBankDetails = function (parameters, resultCallback) {
                    function getBankDetailsCallBack(vendorsBankAccounts) {
                        resultCallback(vendorsBankAccounts.length > 0);
                    }
                    this.InnerGetVendorBankDetails(parameters, 1, getBankDetailsCallBack);
                };
                /**
                * Found vendor number based on IBANS informations
                * @param {Object} parameters Informations about the vendor
                * @param {string} parameters.companyCode
                * @param {string[]} parameters.ibans
                * @param {function} resultCallback Callback to call to fill the result table
                */
                Invoice.prototype.GetFirstVendorNumberFromIBANS = function (parameters, resultCallback) {
                    var _a;
                    function bankDetailsCallBack(results, error) {
                        if (error) {
                            Log.Error(error);
                        }
                        else if (results && results.length > 0) {
                            resultCallback(results[0].VendorNumber__, results[0].IBAN__);
                            return;
                        }
                        resultCallback();
                    }
                    if (parameters.ibans && parameters.ibans.length >= 1) {
                        var table = "AP - Bank details__";
                        var attributesList = ["VendorNumber__", "IBAN__"];
                        var sortOrder = "CompanyCode__ DESC,BankCountry__ ASC,BankName__ ASC,";
                        var filter = Sys.Helpers.LdapUtil.FilterAnd((_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, parameters.ibans.map(function (iban) { return Sys.Helpers.LdapUtil.FilterEqual("IBAN__", iban); })), Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", parameters.companyCode)).toString();
                        Sys.GenericAPI.Query(table, filter, attributesList, bankDetailsCallBack, sortOrder, 1);
                    }
                    else {
                        resultCallback();
                    }
                };
                Invoice.prototype.ComputePaymentAmountsAndDates = function (computeAmounts, computeDates, keepUserEnteredDates) {
                    if (keepUserEnteredDates === void 0) { keepUserEnteredDates = false; }
                    if (computeAmounts) {
                        Lib.AP.ComputeDiscountAmount(Data.GetValue("CompanyCode__"), Data.GetValue("PaymentTerms__"), Data.GetValue("NetAmount__"), Data.GetValue("ExchangeRate__"), function (discountAmount, localDiscountAmount, feeAmount, localFeeAmount) {
                            Data.SetValue("EstimatedDiscountAmount__", discountAmount);
                            Data.SetValue("LocalEstimatedDiscountAmount__", localDiscountAmount);
                            Data.SetValue("EstimatedLatePaymentFee__", feeAmount);
                            Data.SetValue("LocalEstimatedLatePaymentFee__", localFeeAmount);
                        });
                    }
                    if (computeDates) {
                        Lib.AP.ComputePaymentTermsDate(Data.GetValue("CompanyCode__"), Data.GetValue("PaymentTerms__"), Data.GetValue("InvoiceDate__"), Data.GetValue("PostingDate__"), function (dueDate, discountDate) {
                            if (!keepUserEnteredDates || Data.IsEmpty("DueDate__")) {
                                Data.SetValue("DueDate__", dueDate);
                            }
                            if (!keepUserEnteredDates || Data.IsEmpty("DiscountLimitDate__")) {
                                Data.SetValue("DiscountLimitDate__", discountDate);
                            }
                        });
                    }
                };
                /**
                 * Add the coding to set required
                 * @memberof Lib.ERP.Lib.ERP.SAPS4CLOUD.Invoice
                 * @private
                 * @param {object} required List of the required fields to complete
                 * @returns {object} '' The list of the required fields completed
                 */
                Invoice.prototype.addCodingToRequiredFields = function (required) {
                    var apParameters = Sys.Parameters.GetInstance("AP");
                    function checkParameters(item, parameter) {
                        var lineType = item ? item.GetValue("LineType__") : null;
                        if (!lineType) {
                            lineType = Data.GetValue("InvoiceType__") === "Non-PO Invoice" ? "GL" : "Other";
                        }
                        return lineType === "GL" && apParameters.GetParameter(parameter) === "1";
                    }
                    function getCheckParametersFunctionforCoding(coding) {
                        return function (item) {
                            return checkParameters(item, coding);
                        };
                    }
                    required.LineItems__.GLAccount__ = getCheckParametersFunctionforCoding("CodingEnableGLAccount");
                    required.LineItems__.CostCenter__ = getCheckParametersFunctionforCoding("CodingEnableCostCenter");
                    required.LineItems__.BusinessArea__ = getCheckParametersFunctionforCoding("CodingEnableBusinessArea");
                    required.LineItems__.InternalOrder__ = getCheckParametersFunctionforCoding("CodingEnableInternalOrder");
                    required.LineItems__.WBSElement__ = getCheckParametersFunctionforCoding("CodingEnableWBSElement");
                    required.LineItems__.Assignment__ = getCheckParametersFunctionforCoding("CodingEnableAssignments");
                    required.LineItems__.CompanyCode__ = getCheckParametersFunctionforCoding("CodingEnableCompanyCode");
                    return required;
                };
                /**
                 * Return the list of the required fields based on the current invoice state.
                 * Add the tax code and coding values if invoice will be posted
                 * @memberof Lib.ERP.Lib.ERP.SAPS4CLOUD.Invoice
                 * @param {Lib.ERP.Invoice.GetRequiredFieldsCallback} [callback] An optional callback to customize the required fields
                 * @returns {ERP.RequiredFields} requiredFields The updated list of all required fields definition
                 */
                Invoice.prototype.GetRequiredFields = function (callback) {
                    // Get default required fields
                    var required = _super.prototype.GetRequiredFields.call(this);
                    required.Header.InvoiceNumber__ = true;
                    if (Lib.AP.WorkflowCtrl.CurrentStepIsApEnd()) {
                        required = this.addCodingToRequiredFields(required);
                    }
                    required.LineItems__.TaxCode__ = true;
                    if (callback) {
                        required = callback(required) || required;
                    }
                    return required;
                };
                Invoice.prototype.GetWebServiceCallParameters = function (api, method, queryParams, headers, data) {
                    // Get Base URL and credentials in configuration
                    var apParameters = Sys.Parameters.GetInstance("AP");
                    var baseURL = apParameters.GetParameter("WebserviceURL", "");
                    var user = apParameters.GetParameter("WebserviceUser", "");
                    var password = apParameters.GetParameter("WebservicePassword", "");
                    var endPoints = apParameters.GetParameter("WebserviceURLDetails", "");
                    // Build JSON from endPoints
                    endPoints = "{" + (endPoints ? endPoints.split("\n").join(",") : "") + "}";
                    try {
                        endPoints = JSON.parse(endPoints);
                    }
                    catch (e) {
                        var error = "Invalid endPoints syntax in configuration";
                        Log.Error(error);
                        return error;
                    }
                    if (endPoints[api]) {
                        api = endPoints[api];
                    }
                    // Build Full URL
                    if (!baseURL.endsWith("/") && api.indexOf("/") !== 0) {
                        baseURL = baseURL + "/";
                    }
                    var url = baseURL + api;
                    var separator = "?";
                    for (var p in queryParams) {
                        if (Object.prototype.hasOwnProperty.call(queryParams, p)) {
                            var value = encodeURIComponent(queryParams[p]);
                            if (method.toLowerCase() === "post") {
                                value = "'" + value + "'";
                            }
                            url += separator + p + "=" + value;
                            separator = "&";
                        }
                    }
                    return {
                        "url": url,
                        "authenticationMode": "BASIC",
                        "user": user,
                        "password": password,
                        "data": data,
                        "method": method,
                        "headers": headers
                    };
                };
                Invoice.prototype.GetLastWebServiceCallError = function () {
                    return this.lastWebServiceCallError;
                };
                Invoice.prototype.WebServiceCall = function () {
                    Log.Error("To implement in Client and/or Server libs");
                    return null;
                };
                Invoice.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    return true;
                };
                /**
                    * Indicate if the local PO table should be updated
                    * @returns {boolean} true when it should update the local PO Table (always true)
                    */
                Invoice.prototype.ShouldUpdateLocalPOTable = function () {
                    return true;
                };
                /**
                 * S4 HANA is connected for the POST part. Master data queries are disconnected.
                 * @returns {boolean} Always true
                 */
                Invoice.prototype.IsPostConnected = function () {
                    return true;
                };
                /**
                 * Fill and return the list of WHT tax available for a given company code and vendor.
                 *
                 * @memberof Lib.ERP.Generic.Invoice
                 * @param {string} vendorNumber vendor number to query
                 * @returns {any[]} List of WHT and associated descriptions
                 */
                Invoice.prototype.GetExtendedWithholdingTax = function (vendorNumber) {
                    var WHTTable = Data.GetTable("ExtendedWithholdingTax__");
                    WHTTable.SetItemCount(0);
                    var LDAPUTIL = Sys.Helpers.LdapUtil;
                    var companyCode = Data.GetValue("CompanyCode__");
                    var filter = LDAPUTIL.FilterAnd(LDAPUTIL.FilterEqual("CompanyCode__", companyCode), LDAPUTIL.FilterEqual("VendorNumber__", vendorNumber)).toString();
                    var genericWHTParams = {
                        table: "AP - Extended Withholding Tax__",
                        filter: filter,
                        attributes: ["CompanyCode__", "VendorNumber__", "WHTCode__", "WHTDescription__", "WHTType__"],
                        maxRecords: 5,
                        useConstantQueryCache: true
                    };
                    return Sys.GenericAPI.PromisedQuery(genericWHTParams).Then(function (result) {
                        if (!result || result.length <= 0) {
                            return [];
                        }
                        WHTTable.SetItemCount(result.length);
                        result.forEach(function (resultLine, index) {
                            var WHTItem = WHTTable.GetItem(index);
                            WHTItem.SetValue("WHTType__", resultLine.WHTType__);
                            WHTItem.SetValue("WHTCode__", resultLine.WHTCode__);
                            WHTItem.SetValue("WHTDescription__", resultLine.WHTDescription__);
                        });
                        return result;
                    });
                };
                /**
                 * Prohibit dynamic discounting for ERP SAPS4CLOUD
                 * @returns {boolean} Always false
                 */
                Invoice.prototype.IsDynamicDiscountingAllowed = function () {
                    return false;
                };
                return Invoice;
            }(Lib.ERP.Invoice.Instance));
            SAPS4CLOUD.Invoice = Invoice;
        })(SAPS4CLOUD = ERP.SAPS4CLOUD || (ERP.SAPS4CLOUD = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
