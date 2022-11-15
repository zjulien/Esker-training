/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_Generic_Invoice_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Invoice document for generic ERP - system library",
  "require": [
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_String",
    "Lib_ERP_Invoice_V12.0.461.0",
    "Lib_ERP_Generic_Manager_V12.0.461.0",
    "Lib_AP_WorkflowCtrl_V12.0.461.0",
    "Lib_AP_Parameters_V12.0.461.0",
    "Lib_AP_Comment_Helper_V12.0.461.0",
    "Sys/Sys_Helpers_Promise"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Generic;
        (function (Generic) {
            var Invoice = /** @class */ (function (_super) {
                __extends(Invoice, _super);
                function Invoice(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.GetTaxRate = function (item, successCallback, errorCallback, finalCallback) {
                        var _a;
                        var splittedTaxCode = Lib.AP.TaxHelper.splitTaxCode(item.GetValue("TaxCode__"));
                        var filter;
                        var filterArr = [];
                        for (var _i = 0, splittedTaxCode_1 = splittedTaxCode; _i < splittedTaxCode_1.length; _i++) {
                            var tc = splittedTaxCode_1[_i];
                            filterArr.push(Sys.Helpers.LdapUtil.FilterEqual("TaxCode__", tc));
                        }
                        filter = (_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, filterArr);
                        filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", Data.GetValue("CompanyCode__")), filter);
                        Sys.GenericAPI.Query(Lib.P2P.TableNames.TaxCodes, filter.toString(), ["TaxCode__", "TaxRate__", "TaxRoundingPriority__", "NonDeductibleTaxRate__"], function (results, error) {
                            if (error) {
                                errorCallback(item, error);
                            }
                            else if (!results.length) {
                                successCallback(item, 0, []);
                            }
                            else if (results.length === 1) {
                                successCallback(item, parseFloat(results[0].TaxRate__), [parseFloat(results[0].NonDeductibleTaxRate__) || 0], [results[0].TaxRoundingPriority__]);
                            }
                            else {
                                var taxRates = [];
                                var taxRoundingModes = [];
                                var nonDeductibleTaxRates = [];
                                for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                                    var result = results_1[_i];
                                    taxRates.push(parseFloat(result.TaxRate__));
                                    taxRoundingModes.push(result.TaxRoundingPriority__);
                                    nonDeductibleTaxRates.push(parseFloat(result.NonDeductibleTaxRate__) || 0);
                                }
                                successCallback(item, taxRates, nonDeductibleTaxRates, taxRoundingModes);
                            }
                            if (finalCallback) {
                                finalCallback();
                            }
                        }, null, 5, { useConstantQueryCache: true });
                    };
                    _this.GetTaxRateForTable = function (taxCodes, successCallback, errorCallback, finalCallback) {
                        var _a;
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
                        var filter;
                        var filterArr = [];
                        //Create filter for taxCode
                        for (var taxCodeFilter in taxCodes) {
                            if (Object.prototype.hasOwnProperty.call(taxCodes, taxCodeFilter)) {
                                filterArr.push(Sys.Helpers.LdapUtil.FilterEqual("TaxCode__", taxCodeFilter));
                            }
                        }
                        filter = (_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, filterArr);
                        filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", Data.GetValue("CompanyCode__")), filter);
                        Sys.GenericAPI.Query(Lib.P2P.TableNames.TaxCodes, filter.toString(), ["TaxCode__", "TaxRate__"], queryCallback, null, 100, { useConstantQueryCache: true });
                    };
                    /**
                     * Add the coding to set required
                     * @memberof Lib.ERP.Generic.Invoice
                     * @private
                     * @param {object} required List of the required fields to complete
                     * @returns {object} '' The list of the required fields completed
                     */
                    _this.addCodingToRequiredFields = function (required) {
                        var apParameters = Sys.Parameters.GetInstance("AP");
                        function checkParameters(item, parameter) {
                            var lineType = item ? item.GetValue("LineType__") : null;
                            if (!lineType) {
                                lineType = Data.GetValue("InvoiceType__") === "Non-PO Invoice" ? "GL" : "Other";
                            }
                            return lineType === Lib.P2P.LineType.GL && apParameters.GetParameter(parameter) === "1";
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
                    _this.analyticAxis = Lib.ERP.Invoice.commonAnalyticAxis.concat([
                        "ProjectCode__"
                    ]);
                    return _this;
                }
                Invoice.prototype.Create = function (touchless) {
                    this.actionPostHelper.Perform(this, touchless);
                };
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
                Invoice.prototype.GetTaxRateForTableAsync = function (taxCodes) {
                    var queryPromise = Sys.Helpers.Promise.Create(function (resolve) {
                        var _a;
                        var filter;
                        var filterArr = [];
                        //Create filter for taxCode
                        for (var taxCodeFilter in taxCodes) {
                            if (Object.prototype.hasOwnProperty.call(taxCodes, taxCodeFilter)) {
                                var splittedTaxCode = Lib.AP.TaxHelper.splitTaxCode(taxCodeFilter);
                                for (var _i = 0, splittedTaxCode_2 = splittedTaxCode; _i < splittedTaxCode_2.length; _i++) {
                                    var tc = splittedTaxCode_2[_i];
                                    filterArr.push(Sys.Helpers.LdapUtil.FilterEqual("TaxCode__", tc));
                                }
                            }
                        }
                        filter = (_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, filterArr);
                        filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", Data.GetValue("CompanyCode__")), filter);
                        Sys.GenericAPI.Query(Lib.P2P.TableNames.TaxCodes, filter.toString(), ["TaxCode__", "TaxRate__", "TaxRoundingPriority__", "NonDeductibleTaxRate__"], resolve, null, 100, { useConstantQueryCache: true });
                    });
                    return queryPromise.then(function (results) {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            var taxCodeResults = [];
                            if (results) {
                                var mappingTaxCodeTaxRate = {};
                                for (var _i = 0, results_2 = results; _i < results_2.length; _i++) {
                                    var result = results_2[_i];
                                    mappingTaxCodeTaxRate[result.TaxCode__] = {
                                        taxRate: result.TaxRate__,
                                        taxRoundingPriority: result.TaxRoundingPriority__,
                                        NonDeductibleTaxRate__: result.NonDeductibleTaxRate__
                                    };
                                }
                                for (var _a = 0, _b = Object.keys(taxCodes); _a < _b.length; _a++) {
                                    var taxCode = _b[_a];
                                    var found = true;
                                    var taxRates = [];
                                    var taxRoundingPriorities = [];
                                    var nonDeductibleTaxRates = [];
                                    var splittedTaxCode = Lib.AP.TaxHelper.splitTaxCode(taxCode);
                                    for (var _c = 0, splittedTaxCode_3 = splittedTaxCode; _c < splittedTaxCode_3.length; _c++) {
                                        var tax = splittedTaxCode_3[_c];
                                        if (!mappingTaxCodeTaxRate[tax]) {
                                            found = false;
                                        }
                                        else {
                                            taxRates.push(parseFloat(mappingTaxCodeTaxRate[tax].taxRate));
                                            taxRoundingPriorities.push(mappingTaxCodeTaxRate[tax].taxRoundingPriority);
                                            nonDeductibleTaxRates.push(mappingTaxCodeTaxRate[tax].NonDeductibleTaxRate__);
                                        }
                                    }
                                    var newTax = {
                                        items: taxCodes[taxCode],
                                        exists: found,
                                        taxRates: [0.0],
                                        taxRoundingPriorities: [],
                                        nonDeductibleTaxRates: []
                                    };
                                    if (newTax.exists) {
                                        newTax.taxRates = taxRates;
                                        newTax.taxRoundingPriorities = taxRoundingPriorities;
                                        newTax.nonDeductibleTaxRates = nonDeductibleTaxRates;
                                    }
                                    taxCodeResults.push(newTax);
                                }
                            }
                            resolve(taxCodeResults);
                        });
                    });
                };
                /**
                 * Allow to select a bank details from an IBAN number
                 * @memberof Lib.ERP.Invoice
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
                 * @param {string} parameters.iban Optionnal. Only bank account with matching iban will be returned.
                 * @param {boolean} parameters.isSilentChange Optionnal. if true apply silent change to action.
                 * @param {function} resultCallback Callback to call to fill the result table
                 */
                Invoice.prototype.InnerGetVendorBankDetails = function (parameters, recordCount, resultCallback) {
                    var bankAccountArray = [];
                    // Resets any previously set properties on the query.
                    function vendorBankDetailsCallBack(results /*, error: string*/) {
                        for (var _i = 0, results_3 = results; _i < results_3.length; _i++) {
                            var result = results_3[_i];
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
                 * @param {string} parameters.iban Optionnal. Only bank account with matching iban will be returned.
                 * @param {boolean} parameters.isSilentChange Optionnal. if true apply silent change to action.
                 * @param {number} recordCount The number max of record to retrieve.
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
                 * Return the list of the required fields based on the current invoice state.
                 * Add the tax code and coding values if invoice will be posted
                 * @memberof Lib.ERP.Generic.Invoice
                 * @param {Lib.ERP.Invoice.GetRequiredFieldsCallback} [callback] An optional callback to customize the required fields
                 * @returns {ERP.RequiredFields} requiredFields The updated list of all required fields definition
                 */
                Invoice.prototype.GetRequiredFields = function (callback) {
                    // Get default required fields
                    var required = _super.prototype.GetRequiredFields.call(this);
                    if (Lib.AP.WorkflowCtrl.CurrentStepIsApEnd()) {
                        required = this.addCodingToRequiredFields(required);
                    }
                    required.LineItems__.TaxCode__ = true;
                    if (callback) {
                        required = callback(required) || required;
                    }
                    return required;
                };
                Invoice.prototype.ShouldUpdateVendorNumberOnPOHeaderAndItems = function () {
                    var isPurchasingEnabled = Sys.Parameters.GetInstance("P2P").GetParameter("enablepurchasingglobalsetting", "0");
                    return Sys.Helpers.String.ToBoolean(isPurchasingEnabled);
                };
                /**
                    * Indicate if the local PO table should be updated
                    * @returns {boolean} true when it should update the local PO Table (always true)
                    */
                Invoice.prototype.ShouldUpdateLocalPOTable = function () {
                    return true;
                };
                /**
                 * Generics ERP are disconnected, they wait for an ERP acknowledgment
                 * @returns {boolean} Always false
                 */
                Invoice.prototype.IsPostConnected = function () {
                    return false;
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
                 * Allowed dynamic discounting for ERP Generic
                 * @returns {boolean} Always true
                 */
                Invoice.prototype.IsDynamicDiscountingAllowed = function () {
                    return true;
                };
                return Invoice;
            }(Lib.ERP.Invoice.Instance));
            Generic.Invoice = Invoice;
        })(Generic = ERP.Generic || (ERP.Generic = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
