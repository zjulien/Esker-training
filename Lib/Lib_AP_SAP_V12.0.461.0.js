///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_AP_SAP_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "AP Library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_String_SAP",
    "[Sys/Sys_Helpers_SAP]",
    "[Sys/Sys_Helpers_SAP_Client]",
    "Lib_AP_V12.0.461.0",
    "Lib_P2P_SAP_SOAP_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            SAP.langPendingCallbacks = null;
            SAP.SAP_CONNECTION_LANGUAGE = "%SAPCONNECTIONLANGUAGE%";
            SAP.EDW_LANGUAGE = "%EDWLANGUAGE%";
            SAP.SAPISOLangCache = null;
            SAP.SAPLangCache = null;
            SAP.BapiControllerSingleton = null;
            // #endregion
            // #region classes
            var BAPI = /** @class */ (function () {
                function BAPI(sapName, name) {
                    this.Name = name ? name : sapName;
                    this.SapName = sapName;
                    this.FunctionModule = null;
                    this.isWS = false;
                }
                BAPI.prototype.Init = function (bapiManager) {
                    if (bapiManager) {
                        this.FunctionModule = bapiManager.Add(this.SapName);
                        if (this.FunctionModule) {
                            Sys.Helpers.SAP.SetLastError("");
                        }
                        else if (bapiManager.GetLastError() === "EXCEPTION FU_NOT_FOUND RAISED") {
                            Sys.Helpers.SAP.SetLastError("The function module ".concat(this.SapName, " is missing on SAP server."), true);
                        }
                        else {
                            Sys.Helpers.SAP.SetLastError("Failed to get BAPI definition: ".concat(bapiManager.GetLastError()), true);
                        }
                    }
                    return this.FunctionModule;
                };
                BAPI.prototype.Reset = function () {
                    this.FunctionModule = null;
                };
                BAPI.prototype.IsWS = function () {
                    return this.isWS;
                };
                return BAPI;
            }());
            SAP.BAPI = BAPI;
            var SAPTaxFromNetBapi = /** @class */ (function () {
                function SAPTaxFromNetBapi() {
                    this.lastError = "";
                }
                return SAPTaxFromNetBapi;
            }());
            SAP.SAPTaxFromNetBapi = SAPTaxFromNetBapi;
            var SAPTaxAccount = /** @class */ (function () {
                function SAPTaxAccount(tax, taxCode) {
                    // Class providing members for Tax Account management.
                    if (tax) {
                        Lib.AP.SAP.AddGetValue(tax);
                        // Transaction key
                        this.Acct_Key = tax.GetValue("KTOSL");
                        // Condition type
                        this.Cond_Key = tax.GetValue("KSCHL");
                        // General ledger account
                        this.Gl_Account = tax.GetValue("HKONT");
                        // Tax amount in document currency
                        this.Tax_Amount = tax.GetValue("WMWST");
                        // Tax code
                        this.Tax_Code = taxCode;
                        // Tax rate
                        this.Tax_Rate = tax.GetValue("MSATZ");
                        // Jurisdiction for tax calculation - tax jurisdiction code
                        this.Taxjurcode = tax.GetValue("TXJCD");
                        // Jurisdiction for tax calculation - tax jurisdiction code
                        this.Taxjurcode_Deep = tax.GetValue("TXJCD_DEEP");
                        // Tax jurisdiction code level
                        this.Taxjurcode_Level = tax.GetValue("TXJLV");
                    }
                    else {
                        this.Acct_Key = null;
                        this.Cond_Key = null;
                        this.Gl_Account = null;
                        this.Tax_Amount = null;
                        this.Tax_Code = null;
                        this.Tax_Rate = null;
                        this.Taxjurcode = null;
                        this.Taxjurcode_Deep = null;
                        this.Taxjurcode_Level = null;
                    }
                }
                return SAPTaxAccount;
            }());
            SAP.SAPTaxAccount = SAPTaxAccount;
            // #endregion
            function buildOrFilter(queryResult, fields) {
                if (typeof fields === "string") {
                    fields = [fields];
                }
                var filter = [];
                for (var i in queryResult) {
                    if (Object.prototype.hasOwnProperty.call(queryResult, i)) {
                        var element = queryResult[i];
                        var subfilter = [];
                        for (var f in fields) {
                            if (Object.prototype.hasOwnProperty.call(fields, f)) {
                                var field = fields[f];
                                subfilter.push(field + " = '" + Sys.Helpers.String.SAP.Trim(element[field]) + "'");
                            }
                        }
                        var subresult = subfilter.join(" AND ");
                        if (subfilter.length > 1) {
                            subresult = "( " + subresult + " )";
                        }
                        filter.push(subresult);
                    }
                }
                var result = filter.join("\nOR ");
                if (filter.length > 1) {
                    result = "( " + result + " )";
                }
                return result;
            }
            function IsMultiAccountAssignment(acctAssCat) {
                return acctAssCat === "K1" || acctAssCat === "K2" || acctAssCat === "U";
            }
            SAP.IsMultiAccountAssignment = IsMultiAccountAssignment;
            function AddAccountAssignmentLine(invoiceDocItem, accountAssignmentFromPO, poItemData, line, isSubsequentDoc, callback) {
                var isMultipleAccountAssignment = poItemData.AcctAssCat === "K" &&
                    (Lib.P2P.SAP.Soap.SAPValuesAreEqual(poItemData.Distribution, "1") ||
                        Lib.P2P.SAP.Soap.SAPValuesAreEqual(poItemData.Distribution, "2"));
                var isUnknownAccountAssignment = poItemData.AcctAssCat === "U";
                if (isMultipleAccountAssignment || isUnknownAccountAssignment) {
                    var accountingLine = {
                        // Update data with form values
                        INVOICE_DOC_ITEM: invoiceDocItem,
                        ITEM_AMOUNT: Math.abs(line.GetValue("Amount__")),
                        GL_ACCOUNT: Sys.Helpers.String.SAP.NormalizeID(line.GetValue("GLAccount__"), 10),
                        COSTCENTER: Sys.Helpers.String.SAP.NormalizeID(line.GetValue("CostCenter__"), 10),
                        TAX_CODE: line.GetValue("TaxCode__"),
                        QUANTITY: line.GetValue("Quantity__"),
                        TAXJURCODE: line.GetValue("TaxJurisdiction__"),
                        ORDERID: Sys.Helpers.String.SAP.NormalizeID(line.GetValue("InternalOrder__"), 12),
                        WBS_ELEM: line.GetValue("WBSElementID__") || line.GetValue("WBSElement__")
                    };
                    if (accountAssignmentFromPO) {
                        accountingLine.SERIAL_NO = accountAssignmentFromPO.SERIAL_NO;
                        accountingLine.NETWORK = Sys.Helpers.String.SAP.NormalizeID(accountAssignmentFromPO.NETWORK, 12);
                        accountingLine.PROFIT_CTR = Sys.Helpers.String.SAP.NormalizeID(accountAssignmentFromPO.PROFIT_CTR, 10);
                        accountingLine.FUNC_AREA = accountAssignmentFromPO.FUNC_AREA;
                        accountingLine.CO_AREA = accountAssignmentFromPO.CO_AREA;
                    }
                    else {
                        accountingLine.XUNPL = "X";
                    }
                    if (poItemData.IsServiceItem() || poItemData.IsLimitItem()) {
                        delete accountingLine.QUANTITY;
                    }
                    else {
                        accountingLine.PO_UNIT = poItemData.Unit;
                        accountingLine.PO_PR_UOM = poItemData.Orderpr_Un;
                        if (isSubsequentDoc) {
                            // For subsequent document related to goods PO, in our experience we've always needed to force quantity to 1
                            // instead of using the open qty, but we are not 100% confident that this would work for all implementations
                            accountingLine.QUANTITY = 1;
                        }
                    }
                    callback(accountingLine);
                }
            }
            SAP.AddAccountAssignmentLine = AddAccountAssignmentLine;
            function AddGetValue(obj) {
                if (obj && typeof obj.GetValue === "undefined") {
                    // Client side script - redefine GetValue
                    obj.GetValue = function (attr) {
                        return obj[attr];
                    };
                }
            }
            SAP.AddGetValue = AddGetValue;
            function GetNewSAPTaxAccount(tax, taxcode) {
                return new SAPTaxAccount(tax, taxcode);
            }
            SAP.GetNewSAPTaxAccount = GetNewSAPTaxAccount;
            function GetDocumentType() {
                var documentType;
                if (Lib.AP.InvoiceType.isConsignmentInvoice()) {
                    documentType = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPDocumentTypeFIConsignmentStock");
                }
                else if (Lib.AP.InvoiceType.isPOInvoice()) {
                    documentType = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPDocumentTypeMMInvoice");
                    if (parseFloat(Data.GetValue("InvoiceAmount__")) < 0) {
                        documentType = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPDocumentTypeMMCreditNote");
                    }
                }
                else {
                    documentType = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPDocumentTypeFIInvoice");
                    if (parseFloat(Data.GetValue("InvoiceAmount__")) < 0) {
                        documentType = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPDocumentTypeFICreditNote");
                    }
                }
                return documentType;
            }
            SAP.GetDocumentType = GetDocumentType;
            function GetMMInvoiceDocumentTypeFilter() {
                var documentType1 = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPDocumentTypeMMInvoice");
                var documentType2 = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPDocumentTypeMMCreditNote");
                if (documentType1 === documentType2) {
                    documentType2 = null;
                }
                var filter = "";
                if (documentType1 && documentType2) {
                    filter = "(BLART = '" + documentType1 + "' OR BLART = '" + documentType2 + "')";
                }
                else if (documentType1) {
                    filter = "BLART = '" + documentType1 + "'";
                }
                else if (documentType2) {
                    filter = "BLART = '" + documentType2 + "'";
                }
                return filter;
            }
            SAP.GetMMInvoiceDocumentTypeFilter = GetMMInvoiceDocumentTypeFilter;
            function GetSelectedBankDetailsType() {
                var bankDetails = Data.GetTable("BankDetails__");
                if (bankDetails) {
                    for (var i = 0; i < bankDetails.GetItemCount(); i++) {
                        if (bankDetails.GetItem(i).GetValue("BankDetails_Select__")) {
                            return bankDetails.GetItem(i).GetValue("BankDetails_Type__");
                        }
                    }
                }
                return null;
            }
            SAP.GetSelectedBankDetailsType = GetSelectedBankDetailsType;
            function escapeToSQL(filter) {
                if (filter && filter.length > 0) {
                    filter = filter.replace(/\+/g, "_");
                    filter = filter.replace(/\*/g, "%");
                    filter = filter.replace(/'/g, "''");
                }
                return filter;
            }
            SAP.escapeToSQL = escapeToSQL;
            function FilterResultsOnAWKEY(bkpfResult, rbkpResults) {
                var _a, _b;
                for (var _i = 0, rbkpResults_1 = rbkpResults; _i < rbkpResults_1.length; _i++) {
                    var r = rbkpResults_1[_i];
                    var belnrAsString = ((_a = r === null || r === void 0 ? void 0 : r.BELNR) === null || _a === void 0 ? void 0 : _a.toString()) || "";
                    var gjahrAsString = ((_b = r === null || r === void 0 ? void 0 : r.GJAHR) === null || _b === void 0 ? void 0 : _b.toString()) || "";
                    var key = belnrAsString + gjahrAsString;
                    for (var i = 0; i < bkpfResult.length; i++) {
                        if (Lib.P2P.SAP.Soap.SAPValuesAreEqual(bkpfResult[i].AWKEY, key)) {
                            bkpfResult.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            SAP.FilterResultsOnAWKEY = FilterResultsOnAWKEY;
            function AddDuplicateCandidates(result, duplicateCandidates) {
                if (!result) {
                    return duplicateCandidates;
                }
                var duplicateNumber, i, refDocNum, refDocCompCode, refDocFiscYear;
                for (i = 0; i < result.length; ++i) {
                    refDocNum = result[i].BELNR;
                    refDocCompCode = result[i].BUKRS;
                    refDocFiscYear = result[i].GJAHR;
                    duplicateNumber = refDocNum + "-" + refDocCompCode + "-" + refDocFiscYear;
                    if (duplicateCandidates.indexOf(duplicateNumber) < 0) {
                        duplicateCandidates.push(duplicateNumber);
                    }
                }
                return duplicateCandidates;
            }
            SAP.AddDuplicateCandidates = AddDuplicateCandidates;
            function GetDuplicateFIparkedInvoiceFilter(result, companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDate) {
                // Compute filter for VBSEGK query
                var filter = "";
                if (result && result.length > 0) {
                    filter = "BUKRS = '" + companyCode + "'";
                    filter += "\nAND LIFNR = '" + normalizedVendorNumber + "'";
                    filter += "\nAND ZFBDT = '" + normalizedInvoiceDate + "'";
                    filter += "\nAND " + buildOrFilter(result, ["BELNR", "GJAHR"]);
                }
                return filter;
            }
            SAP.GetDuplicateFIparkedInvoiceFilter = GetDuplicateFIparkedInvoiceFilter;
            function AddDuplicateAmountFilter(filter, normalizedInvoiceAmount, bForMM) {
                // Complete filter for BSIP or RBKP query
                var bCreditMemo = false;
                var invAmount = normalizedInvoiceAmount;
                if (normalizedInvoiceAmount.indexOf("-") === 0) {
                    invAmount = normalizedInvoiceAmount.substr(1);
                    bCreditMemo = true;
                }
                if (filter) {
                    filter += "\nAND ";
                }
                if (bForMM) {
                    filter += "RMWWR = '" + invAmount + "'";
                    if (bCreditMemo) {
                        // Credit note or Subsequent credit
                        filter += "\nAND XRECH <> 'X'";
                    }
                }
                else {
                    filter += "WRBTR = '" + invAmount + "'";
                    filter += "\nAND SHKZG = '" + (bCreditMemo ? "S" : "H") + "'";
                }
                return filter;
            }
            SAP.AddDuplicateAmountFilter = AddDuplicateAmountFilter;
            function GetDuplicateMMInvoiceFilter(companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDate, invoiceCurrency, normalizedInvoiceAmount) {
                // Compute filter for RBKP query
                var filter = "BUKRS = '" + companyCode + "'";
                filter += "\nAND RBSTAT <> '2'";
                filter += "\nAND LIFNR = '" + normalizedVendorNumber + "'";
                filter += "\nAND BLDAT = '" + normalizedInvoiceDate + "'";
                filter += "\nAND WAERS = '" + invoiceCurrency + "'";
                // Invoice not reversed
                filter += "\nAND STBLG = ''";
                if (!Lib.AP.InvoiceType.isPOInvoice()) {
                    // use inv # if it exists, otherwise use inv amount
                    if (normalizedInvoiceNumber) {
                        filter += "\nAND XBLNR = '" + normalizedInvoiceNumber + "'";
                    }
                    else {
                        filter = Lib.AP.SAP.AddDuplicateAmountFilter(filter, normalizedInvoiceAmount, true);
                    }
                }
                // built RBKP po filter
                // use inv # if it exists, otherwise use inv amount
                else if (normalizedInvoiceNumber && normalizedInvoiceAmount) {
                    filter += "\nAND XBLNR = '" + normalizedInvoiceNumber + "'";
                    filter = Lib.AP.SAP.AddDuplicateAmountFilter(filter, normalizedInvoiceAmount, true);
                }
                // When InvoiceReferenceNumber__ we want to remove from duplicate check referenced field
                var invoiceRef = Lib.AP.ParseInvoiceDocumentNumber(Data.GetValue("InvoiceReferenceNumber__"), true);
                if (invoiceRef && invoiceRef.documentNumber) {
                    filter += "\nAND REBZG <> '" + invoiceRef.documentNumber + "'";
                }
                return filter;
            }
            SAP.GetDuplicateMMInvoiceFilter = GetDuplicateMMInvoiceFilter;
            function GetDuplicateReversedMMInvoicesFilter(result, companyCode) {
                var fiFromMM = [];
                for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
                    var r = result_1[_i];
                    if (r.AWKEY && r.AWKEY.length === 14) {
                        fiFromMM.push({
                            documentNumber: r.AWKEY.substr(0, 10),
                            fiscalYear: r.AWKEY.substr(10)
                        });
                    }
                }
                var filter = "";
                if (fiFromMM.length > 0) {
                    filter = "BUKRS = '".concat(companyCode, "' AND (\n");
                    var invFilters = [];
                    for (var _a = 0, fiFromMM_1 = fiFromMM; _a < fiFromMM_1.length; _a++) {
                        var inv = fiFromMM_1[_a];
                        invFilters.push(" ( BELNR = '".concat(inv.documentNumber, "' AND GJAHR = '").concat(inv.fiscalYear, "'\n AND STBLG <> '' ) "));
                    }
                    filter += invFilters.join("\nOR ");
                    filter += " ) ";
                }
                return filter;
            }
            SAP.GetDuplicateReversedMMInvoicesFilter = GetDuplicateReversedMMInvoicesFilter;
            function GetDuplicateFIInvoiceNotReversedFilter(result, companyCode, normalizedInvoiceNumber, normalizedInvoiceDate, invoiceCurrency) {
                // Compute filter for BKPF query
                var filter = "";
                if (result && result.length > 0) {
                    filter = "BUKRS = '" + companyCode + "'";
                    filter += "\nAND STBLG = ''";
                    if (normalizedInvoiceNumber) {
                        filter += "\nAND XBLNR = '" + normalizedInvoiceNumber + "'";
                    }
                    filter += "\nAND WAERS = '" + invoiceCurrency + "'";
                    filter += "\nAND BLDAT = '" + normalizedInvoiceDate + "'";
                    filter += "\nAND " + buildOrFilter(result, ["BELNR", "GJAHR"]);
                }
                return filter;
            }
            SAP.GetDuplicateFIInvoiceNotReversedFilter = GetDuplicateFIInvoiceNotReversedFilter;
            function GetDuplicateFIInvoiceFilter(companyCode, normalizedInvoiceNumber, normalizedVendorNumber, normalizedInvoiceDate, invoiceCurrency, normalizedInvoiceAmount) {
                // Compute filter for BSIP query
                var filter = "BUKRS = '" + companyCode + "'";
                if (!Lib.AP.InvoiceType.isPOInvoice()) {
                    // use inv # if it exists, otherwise use inv amount
                    if (normalizedInvoiceNumber) {
                        filter += "\nAND XBLNR = '" + normalizedInvoiceNumber + "'";
                    }
                    else {
                        filter = Lib.AP.SAP.AddDuplicateAmountFilter(filter, normalizedInvoiceAmount);
                    }
                }
                // built BSIP po filter
                // use inv # if it exists, otherwise use inv amount
                else if (normalizedInvoiceNumber && normalizedInvoiceAmount) {
                    filter += "\nAND XBLNR = '" + normalizedInvoiceNumber + "'";
                    filter = Lib.AP.SAP.AddDuplicateAmountFilter(filter, normalizedInvoiceAmount);
                }
                filter += "\nAND LIFNR = '" + normalizedVendorNumber + "'";
                filter += "\nAND BLDAT = '" + normalizedInvoiceDate + "'";
                filter += "\nAND WAERS = '" + invoiceCurrency + "'";
                return filter;
            }
            SAP.GetDuplicateFIInvoiceFilter = GetDuplicateFIInvoiceFilter;
            // This cache is used when generating the FI or MM simulation report
            // There is no need for the language to be a key for this cache since the simulation report is only visible by the AP user.
            SAP.glDescriptionsCache = {};
            function InitGLDescriptionCacheFromLines(companyCode) {
                Lib.AP.SAP.glDescriptionsCache[companyCode] = {};
                // For each line on form with a GLAccount__, store the GLDescription__ in cache
                var lineItems = Data.GetTable("LineItems__");
                for (var idx = 0; idx < lineItems.GetItemCount(); idx++) {
                    var lineItem = lineItems.GetItem(idx);
                    var glAcc = lineItem.GetValue("GLAccount__");
                    var glAccDesc = lineItem.GetValue("GLDescription__");
                    if (glAcc && glAccDesc) {
                        Lib.AP.SAP.glDescriptionsCache[companyCode][glAcc] = glAccDesc;
                    }
                }
            }
            SAP.InitGLDescriptionCacheFromLines = InitGLDescriptionCacheFromLines;
            function GetNewSAPTaxFromNetBapi() {
                return null;
            }
            SAP.GetNewSAPTaxFromNetBapi = GetNewSAPTaxFromNetBapi;
            function CheckVendorNumber(vendorNumber) {
                var res = {
                    isValid: true,
                    vendorNumber: vendorNumber
                };
                var headerVendorNumber = Data.GetValue("VendorNumber__");
                if (Lib.AP.InvoiceType.isConsignmentInvoice() && headerVendorNumber) {
                    if (typeof vendorNumber === "string" && vendorNumber) {
                        res.isValid = headerVendorNumber === vendorNumber;
                    }
                    else {
                        var lineItemsTable = Data.GetTable("LineItems__");
                        var nbItems = lineItemsTable.GetItemCount();
                        for (var i = 0; i < nbItems && res.isValid; i++) {
                            var item = lineItemsTable.GetItem(i);
                            var lineVendor = item.GetValue("VendorNumber__");
                            if (lineVendor) {
                                res.isValid = Lib.P2P.SAP.Soap.SAPValuesAreEqual(headerVendorNumber, lineVendor);
                            }
                        }
                    }
                }
                var customBehavior = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAPCheckVendorNumber", res);
                if (!customBehavior) {
                    if (!res.isValid) {
                        Data.SetWarning("VendorNumber__", "_Vendor don't match lines");
                    }
                    else {
                        Data.SetWarning("VendorNumber__", null);
                    }
                }
                return res.isValid;
            }
            SAP.CheckVendorNumber = CheckVendorNumber;
            function GetDefaultTaxAccDataFromItem(item) {
                return {
                    "AUFNR": Sys.Helpers.String.SAP.NormalizeID(item.GetValue("InternalOrder__"), 12),
                    "EBELP": Sys.Helpers.String.SAP.NormalizeID(item.GetValue("ItemNumber__"), 5),
                    "EBELN": Sys.Helpers.String.SAP.NormalizeID(item.GetValue("OrderNumber__"), 10),
                    "LIFNR": Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10),
                    "SAKNR": Sys.Helpers.String.SAP.NormalizeID(item.GetValue("GLAccount__"), 10),
                    "KOSTL": Sys.Helpers.String.SAP.NormalizeID(item.GetValue("CostCenter__"), 10)
                };
            }
            SAP.GetDefaultTaxAccDataFromItem = GetDefaultTaxAccDataFromItem;
            /**
            * @description Call it to know if Web Services are enabled for SAP
            * @return Returns true is Web Services are used
            */
            function UsesWebServices() {
                return Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPWSEnabled", "0") === "1";
            }
            SAP.UsesWebServices = UsesWebServices;
            /**
             * @description Returns the date format needed to call SAP
             * @param {Date} dateTime the date to be converted
             * @returns {string} formatted date as RFC standard or, if webservices are enabled in configuration, in the date format specified in P2P configuration.
             */
            function FormatToSAPDateTimeFormat(dateTime, options) {
                if (!dateTime) {
                    return "";
                }
                var dateFormat = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPWSDateFormat");
                if (Lib.AP.SAP.UsesWebServices() && dateFormat && (!options || !options.forceRFCDateFormat)) {
                    return Sys.Helpers.Date.Format(dateTime, dateFormat);
                }
                return Sys.Helpers.SAP.FormatToSAPDateTimeFormat(dateTime);
            }
            SAP.FormatToSAPDateTimeFormat = FormatToSAPDateTimeFormat;
            /**
             * @description Returns a date object from a string in SAP Date and Time format
             * @param {string} sapDate the date to be converted.
             *    In webservice mode the associated format is stored in 'AP - Application Settings__' table, field SAPWSDateFormat__
             *    In RFC mode calls the Sys.Helpers.SAP.FormatDateFromSAP function
             * @returns {Date} Date object build from sapDate and optionally sapTime strings
             */
            function FormatDateFromSAP(sapDate, sapTime) {
                if (!sapDate) {
                    return null;
                }
                var dateFormat = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPWSDateFormat");
                if (Lib.AP.SAP.UsesWebServices() && dateFormat) {
                    var formattedDate = Sys.Helpers.Date.ParseSimpleDateFromFormat(sapDate, dateFormat);
                    if (sapTime) {
                        var satTimeHMS = sapTime.split(":");
                        formattedDate.setHours(parseInt(satTimeHMS[0], 10));
                        formattedDate.setMinutes(parseInt(satTimeHMS[1], 10));
                        formattedDate.setSeconds(parseInt(satTimeHMS[2], 10));
                    }
                    return formattedDate;
                }
                return Sys.Helpers.SAP.FormatDateFromSAP(sapDate, sapTime);
            }
            SAP.FormatDateFromSAP = FormatDateFromSAP;
            /**
             * @description Returns the function to handle a bapi call to Z_ESK_RFC_READ_TABLE.
             *  Depending on the SAPMode (Rfc or Webservices SOAP) and script side (client side or server side)
             *   We use this function in Lib.ERPs which are common scripts, to attach this handler to Sys.Helpers.SAP functions
             * @returns {Lib.AP.SAP.SAPQuery|Lib.AP.SAP.ReadSAPTable} agnostic SAP mode functions (can handle both RFC and SOAP Webservices call) but are script side dependant
             */
            function SAPQueryClientServerHandler() {
                return Sys.ScriptInfo.IsClient() ? Lib.AP.SAP.SAPQuery : Lib.AP.SAP.ReadSAPTable;
            }
            SAP.SAPQueryClientServerHandler = SAPQueryClientServerHandler;
            //#region typescript Shenanigans
            /* eslint-disable no-empty-function */
            //  Client side only
            /**
             * @description Empty prototype for SAPQuery, which is a client side function.
             *  We must declare it in this Common lib, because it is used in Lib.ERPs which are also common but implement some client side only functions
             * Typescript could not transpile the package if we did not declare this function
             * /!\ Another option is to refactor all Lib.ERPs to have only Common function
             */
            function SAPQuery(queryCallback, sapConf, table, fields, options, rowCount, rowSkip, noData, useCache) {
                if (noData === void 0) { noData = false; }
                if (useCache === void 0) { useCache = null; }
            }
            SAP.SAPQuery = SAPQuery;
            //  Server side only
            /**
             * @description Empty prototype for ReadSAPTable, which is a server side function.
             *  We must declare it in this Common lib, because it is used in Lib.ERPs which are also common but implement some server side only functions
             * Typescript could not transpile the package if we did not declare this function
             * /!\ Another option is to refactor all Lib.ERPs to have only Common function
             */
            function ReadSAPTable(rfcReadTableBapi, table, fields, options, rowCount, rowSkip, noData, jsonOptions) {
                return null;
            }
            SAP.ReadSAPTable = ReadSAPTable;
            /* eslint-enable no-empty-function */
            //#endregion typescript Shenanigans
            /**
             * @description Call the callback with the SAP ISO lang to use
             * Lang resolution is done with this priority
             * - parameter originalLangToUser
             * - value from user Exit : Lib.AP.Customization.Common.SAP.CustomQueryLanguage
             * - In WS SAPWSConnectionLanguage value from configuration.
             *
             * Then depending on the associated resolved value
             * - %EDWLANGUAGE% returns the current user ISO lang
             * - %SAPCONNECTIONLANGUAGE% in rcf asks the SAPProxy the connection language, in WS SAPWSConnectionLanguage the configuration value
             * @param {function} getLanguageCallback (ISOLang: string) => void, the callback called
             * @param {string} [originalLangToUse] if specified force the expected lang. Value can be :
             *   'XX' (two characters iso lang code),
             *   '%EDWLANGUAGE%' : use the current user language code
             *   '%SAPCONNECTIONLANGUAGE%' : use the lang defined on the sap connection in RFC or in the Wizard for Webservice Mode)
             */
            function SAPGetISOLanguage(getLanguageCallback, originalLangToUse) {
                if (originalLangToUse === void 0) { originalLangToUse = null; }
                function getSAPConnectionLanguageFromSAPProxy(callback) {
                    var that = Lib.AP.SAP;
                    that.langPendingCallbacks = that.langPendingCallbacks || [];
                    function callbackWhenLanguageRetrieved(JSONresult) {
                        var l = "EN"; // default ISO connection language
                        if (!JSONresult.ERRORS) {
                            Log.Error("SAPGetConnectionLanguage - AJAX error.");
                        }
                        else if (JSONresult.ERRORS.length > 0) {
                            for (var i = 0; i < JSONresult.ERRORS.length; i++) {
                                Log.Error("SAPProxy.GetConnectionLanguage failed: ".concat(JSONresult.ERRORS[i].err, " (Error code ").concat(JSONresult.ERRORS[i].code, ")"));
                            }
                        }
                        else {
                            l = JSONresult.RESULT;
                            if (!originalLangToUse) {
                                Lib.AP.SAP.SAPISOLangCache = l;
                            }
                        }
                        var pendingCallback = that.langPendingCallbacks.pop();
                        while (pendingCallback) {
                            pendingCallback(l);
                            pendingCallback = that.langPendingCallbacks.pop();
                        }
                    }
                    that.langPendingCallbacks.push(callback);
                    if (that.langPendingCallbacks.length === 1) {
                        if (Sys.ScriptInfo.IsClient()) {
                            Sys.Helpers.Globals.Query.SAPProxy(callbackWhenLanguageRetrieved, "GetConnectionLanguage", [Variable.GetValueAsString("SAPConfiguration")]);
                        }
                        else {
                            var sapControl = Sys.Helpers.SAP.GetSAPControl();
                            var currentConnectionlanguage = sapControl.GetCurrentConnectionLanguage(Variable.GetValueAsString("SAPConfiguration"));
                            callbackWhenLanguageRetrieved({ ERRORS: [], RESULT: currentConnectionlanguage });
                        }
                    }
                }
                // return cache if defined and no specific lang in parameters
                if (Lib.AP.SAP.SAPISOLangCache && !originalLangToUse) {
                    getLanguageCallback(Lib.AP.SAP.SAPISOLangCache);
                    return;
                }
                var sapQueryLanguage = originalLangToUse;
                if (!sapQueryLanguage) {
                    sapQueryLanguage = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.CustomQueryLanguage");
                }
                if (!sapQueryLanguage) {
                    sapQueryLanguage = Lib.AP.SAP.SAP_CONNECTION_LANGUAGE;
                }
                if (!Lib.AP.SAP.UsesWebServices() && sapQueryLanguage === Lib.AP.SAP.SAP_CONNECTION_LANGUAGE) {
                    getSAPConnectionLanguageFromSAPProxy(getLanguageCallback);
                }
                else {
                    var lang = GetBaseLanguage(sapQueryLanguage);
                    if (!originalLangToUse) {
                        Lib.AP.SAP.SAPISOLangCache = lang;
                    }
                    getLanguageCallback(lang);
                }
            }
            SAP.SAPGetISOLanguage = SAPGetISOLanguage;
            /**
             * @description Convert an ISO Language Code to a one character Language code.
             *  Calls the SAPProxy in RFC mode, do a Z_ESK_RFC_READ_TABLE on table T002 in webservice mode
             *
             * @param {function} getLanguageCallback (ISOLang: string) => void, the callback called with the resolved ISO lang code
             * @param {string} [ISOLang] The ISO lang code to convert in SAP language code. Value can be :
             *   'XX' (two characters iso lang code),
             *   '%EDWLANGUAGE%' : use the current user language code
             *   '%SAPCONNECTIONLANGUAGE%' : use the lang defined on the sap connection in RFC or in the Wizard for Webservice Mode)
             */
            function ConvertISOLangCodeToSAPLangCode(getLanguageCallback, ISOLang) {
                var _a;
                function getSAPLanguageCodeFromSAPProxy(result) {
                    if (result.ERRORS && result.ERRORS.length > 0) {
                        Log.Error("Error when requesting language to SAPProxy : " + JSON.stringify(result.ERRORS));
                        getLanguageCallback('E');
                        return;
                    }
                    if (!Lib.AP.SAP.SAPLangCache) {
                        Lib.AP.SAP.SAPLangCache = {};
                    }
                    Lib.AP.SAP.SAPLangCache[ISOLang] = result.RESULT;
                    getLanguageCallback(Lib.AP.SAP.SAPLangCache[ISOLang]);
                }
                if (SAP.SAPLangCache && SAP.SAPLangCache[ISOLang]) {
                    getLanguageCallback(SAP.SAPLangCache[ISOLang]);
                    return;
                }
                if (Lib.AP.SAP.UsesWebServices()) {
                    var filter = "LAISO = '".concat(ISOLang, "'");
                    Lib.P2P.SAP.Soap.Call_RFC_READ_TABLE_WS("T002", "SPRAS|LAISO", filter, 1)
                        .Then(function (result) {
                        var lang = result && result.length > 0 ? result[0].SPRAS : null;
                        if (!Lib.AP.SAP.SAPLangCache) {
                            Lib.AP.SAP.SAPLangCache = {};
                        }
                        if (lang) {
                            Lib.AP.SAP.SAPLangCache[ISOLang] = lang;
                        }
                        getLanguageCallback(lang);
                    });
                }
                else {
                    if (Sys.ScriptInfo.IsClient()) {
                        Sys.Helpers.Globals.Query.SAPProxy(getSAPLanguageCodeFromSAPProxy, "Convert_ISO_Lang_To_SAP", [
                            Variable.GetValueAsString("SAPConfiguration"),
                            ISOLang
                        ]);
                    }
                    else {
                        // Server Side / RFC mode
                        // We should retrieve the already instanciated bapiManager
                        // to call RFC_READ_TABLE on table T002 to convert the ISO Lang code to SAP lang
                        // GetNewBapiController is a singleton, we should have only one bapi controller instance
                        var sapBapiManager = Lib.AP.SAP.GetNewBapiController();
                        // The bapi manager should be already initiated
                        if (!((_a = sapBapiManager === null || sapBapiManager === void 0 ? void 0 : sapBapiManager.GetBapiManager()) === null || _a === void 0 ? void 0 : _a.Connected)) {
                            getSAPLanguageCodeFromSAPProxy({
                                ERRORS: [{
                                        code: "",
                                        err: "Could not retrieve instance of already created bapi Manager",
                                    }]
                            });
                            return;
                        }
                        // bapi RFC_READ_TABLE should already been added.
                        var rfcReadTable = sapBapiManager.GetBapi("RFC_READ_TABLE");
                        if (!rfcReadTable) {
                            getSAPLanguageCodeFromSAPProxy({
                                ERRORS: [{
                                        code: "",
                                        err: "Could not retrieve RFC_READ_TABLE bapi definition",
                                    }]
                            });
                            return;
                        }
                        // Everything necessary is initiated, we can do now the T002 query
                        var filter = "LAISO = '".concat(ISOLang, "'");
                        var T002Result = Sys.Helpers.SAP.ReadSAPTable(rfcReadTable, "T002", "SPRAS|LAISO", filter, 1, 0, false);
                        if (!T002Result || T002Result.length < 1) {
                            getSAPLanguageCodeFromSAPProxy({
                                ERRORS: [{
                                        code: "",
                                        err: "Could not retrieve SAPLang from ISOLang: ".concat(ISOLang),
                                    }]
                            });
                            return;
                        }
                        getSAPLanguageCodeFromSAPProxy({
                            RESULT: T002Result[0].SPRAS
                        });
                    }
                }
            }
            SAP.ConvertISOLangCodeToSAPLangCode = ConvertISOLangCodeToSAPLangCode;
            /**
             * @description Resolve the language to use and convert it into a SAP language code.
             *  Calls the SAPProxy in RFC mode, do a Z_ESK_RFC_READ_TABLE on table T002 in webservice mode
             *
             * @param {function} getLanguageCallback (SAPLang: string) => void, the callback called with the resolved SAPLang
             * @param {string} [ISOLang] The ISO lang code to convert in SAP language code. Value can be :
             *   'XX' (two characters iso lang code),
             *   '%EDWLANGUAGE%' : use the current user language code
             *   '%SAPCONNECTIONLANGUAGE%' : use the lang defined on the sap connection in RFC or in the Wizard for Webservice Mode)
             */
            function SAPGetSAPLanguageSync(inputCallback, originalISOLangToUse) {
                if (originalISOLangToUse === void 0) { originalISOLangToUse = null; }
                var callback = function (sapLang) {
                    Lib.AP.SAP.ConvertISOLangCodeToSAPLangCode(inputCallback, sapLang);
                };
                Lib.AP.SAP.SAPGetISOLanguage(callback, originalISOLangToUse);
            }
            SAP.SAPGetSAPLanguageSync = SAPGetSAPLanguageSync;
            /**
             * @description Resolve the language to use and convert it into a SAP language code.
             *  Calls the SAPProxy in RFC mode, do a Z_ESK_RFC_READ_TABLE on table T002 in webservice mode
             *
             * @param {function} getLanguageCallback (SAPLang: string) => void, the callback called with the resolved SAPLang
             * @param {string} [ISOLang] The ISO lang code to convert in SAP language code. Value can be :
             *   'XX' (two characters iso lang code),
             *   '%EDWLANGUAGE%' : use the current user language code
             *   '%SAPCONNECTIONLANGUAGE%' : use the lang defined on the sap connection in RFC or in the Wizard for Webservice Mode)
             */
            function SAPGetSAPLanguage(originalISOLangToUse) {
                if (originalISOLangToUse === void 0) { originalISOLangToUse = null; }
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Lib.AP.SAP.SAPGetSAPLanguageSync(resolve, originalISOLangToUse);
                });
            }
            SAP.SAPGetSAPLanguage = SAPGetSAPLanguage;
            /**
             * @description
             */
            function SetPaymentTermsFromPO(po) {
                if (po && po.PO_HEADER) {
                    var poPaymentTerms = po.PO_HEADER["PMNTTRMS"];
                    var poNumber = po.PO_HEADER["PO_NUMBER"];
                    if (poPaymentTerms) {
                        var curPaymentTerms = Data.GetValue("PaymentTerms__");
                        if (poPaymentTerms !== curPaymentTerms) {
                            Data.SetValue("PaymentTerms__", poPaymentTerms);
                            Data.SetWarning("PaymentTerms__", Language.Translate("_Payment terms retrieved from PO #{0}", false, poNumber));
                            Lib.AP.GetInvoiceDocument().ComputePaymentAmountsAndDates(true, true);
                        }
                    }
                }
            }
            SAP.SetPaymentTermsFromPO = SetPaymentTermsFromPO;
            /**
             * @description Get the default ISO Language code to use depending on the current SAP mode (RFC or Webservice)
             * @param {string} lang the default language to use
             *
             */
            function GetBaseLanguage(lang) {
                var _a;
                var defaultISOLang = "EN";
                var languageToUse;
                if (lang === SAP.SAP_CONNECTION_LANGUAGE) {
                    languageToUse = ((_a = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPWSConnectionLanguage", defaultISOLang)) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || defaultISOLang;
                }
                else if (lang === SAP.EDW_LANGUAGE) {
                    if (Sys.ScriptInfo.IsClient()) {
                        var user = Sys.Helpers.Globals.User;
                        languageToUse = user === null || user === void 0 ? void 0 : user.language;
                    }
                    else {
                        var user = Sys.Helpers.Globals.Users.GetUser(Data.GetValue("ValidationOwnerID"));
                        if (!user) {
                            user = Sys.Helpers.Globals.Users.GetUser(Data.GetValue("OwnerID"));
                        }
                        languageToUse = user === null || user === void 0 ? void 0 : user.GetValue("Language");
                    }
                    languageToUse = (languageToUse === null || languageToUse === void 0 ? void 0 : languageToUse.toUpperCase()) || defaultISOLang;
                }
                else if (/%ISO-[A-Z][A-Z]%/.exec(lang)) {
                    languageToUse = lang.substring(5, 7).toUpperCase();
                }
                else {
                    languageToUse = (lang === null || lang === void 0 ? void 0 : lang.toUpperCase()) || defaultISOLang;
                }
                return languageToUse.substring(0, 2);
            }
            SAP.GetBaseLanguage = GetBaseLanguage;
            /**
             * @description This function can clear the Lang cache
             * SAPGetSAPLanguage and SAPGetISOLanguage store in cache langs if not overriden by parameter
             */
            function ResetLanguageCache() {
                SAP.SAPISOLangCache = null;
                SAP.SAPLangCache = null;
            }
            SAP.ResetLanguageCache = ResetLanguageCache;
            /**
             * @description returns the SAPClient Number promise from the connection in RFC or from Application Settings in Webservice
             */
            function GetSAPClient(sapControl) {
                if (Lib.AP.SAP.UsesWebServices()) {
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        resolve(Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPWSClient"));
                    });
                }
                else {
                    if (Sys.ScriptInfo.IsServer()) {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            resolve(Sys.Helpers.SAP.GetSAPClient(sapControl, Variable.GetValueAsString("SAPConfiguration")));
                        });
                    }
                    else {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            var rfcGetSAPClient = function (client) {
                                resolve(client);
                            };
                            Sys.Helpers.SAP.GetSAPClient(rfcGetSAPClient, Variable.GetValueAsString("SAPConfiguration"));
                        });
                    }
                }
            }
            SAP.GetSAPClient = GetSAPClient;
            var BAPIController = /** @class */ (function () {
                function BAPIController() {
                    this.sapControl = null;
                    this.bapiManager = null;
                    this.bapiWSManager = null;
                    this.sapCurrentLanguage = "";
                    this.BapiList = {};
                    Lib.P2P.SAP.Soap.InitInternalParametersFromConfigurator()
                        .Then(function () { });
                }
                BAPIController.prototype.AddBapi = function (bapi) {
                    this.BapiList[bapi.Name] = bapi;
                    return this.BapiList[bapi.Name];
                };
                BAPIController.prototype.GetBapi = function (bapiName) {
                    var bapi = this.BapiList[bapiName];
                    if (bapi) {
                        return bapi.FunctionModule;
                    }
                    return null;
                };
                BAPIController.prototype.GetBapiManager = function () {
                    if (this.bapiManager) {
                        return this.bapiManager;
                    }
                    else if (this.bapiWSManager) {
                        return this.bapiWSManager;
                    }
                    return null;
                };
                BAPIController.prototype.isBapiManagerConnected = function () {
                    return (this.bapiManager && this.bapiManager.Connected);
                };
                BAPIController.prototype.isWSBapiManagerConnected = function () {
                    return (this.bapiWSManager && this.bapiWSManager.Connected);
                };
                BAPIController.prototype.initAndConnectBapiManagersIfNeeded = function (sapControl) {
                    if (this.isBapiManagerConnected()) {
                        return;
                    }
                    if (Lib.AP.SAP.UsesWebServices()) {
                        this.InitBapiWSManager();
                    }
                    else {
                        this.InitBapiManager(sapControl);
                    }
                };
                BAPIController.prototype.InitBapi = function (bapiName) {
                    if (this.isBapiManagerConnected() ||
                        this.isWSBapiManagerConnected()) {
                        var bapi = this.BapiList[bapiName];
                        if (bapi) {
                            return bapi.Init(this.GetBapiManager());
                        }
                    }
                    else {
                        Sys.Helpers.SAP.SetLastError("InitBapi should not be called directly");
                    }
                    return null;
                };
                BAPIController.prototype.InitBapiManager = function (sapControl) {
                    Sys.Helpers.SAP.SetLastError("");
                    if (sapControl) {
                        if (!this.isBapiManagerConnected()) {
                            var sapConfigName = Variable.GetValueAsString("SAPConfiguration");
                            Log.Info("SAP Configuration: " + sapConfigName);
                            this.sapControl = sapControl;
                            this.sapCurrentLanguage = sapControl.GetCurrentConnectionLanguage(sapConfigName);
                            var bapiMgr = sapControl.CreateBapiManager(sapConfigName);
                            if (!bapiMgr) {
                                Sys.Helpers.SAP.SetLastError("Failed to create Bapi Manager: " + sapControl.GetLastError(), true);
                            }
                            else {
                                if (bapiMgr.Connected) {
                                    this.bapiManager = bapiMgr;
                                    return true;
                                }
                                var technicalError = false;
                                var errorMsg = bapiMgr.GetLastLogonError();
                                if (!errorMsg) {
                                    technicalError = true;
                                    errorMsg = bapiMgr.GetLastError();
                                }
                                Sys.Helpers.SAP.SetLastError(errorMsg, technicalError);
                            }
                        }
                        else {
                            return true; //  BapiManager already connected
                        }
                    }
                    else {
                        Sys.Helpers.SAP.SetLastError("BAPIController.InitBapiManager: sapControl is required");
                    }
                    return false;
                };
                BAPIController.prototype.InitBapiWSManager = function () {
                    if (!this.bapiWSManager || !this.bapiWSManager.Connected) {
                        this.bapiWSManager = new Lib.P2P.SAP.Soap.BapiWSManager();
                    }
                    return !!this.bapiWSManager;
                };
                // Initializes and connects the BapiManager and load the definition of all BAPIs
                BAPIController.prototype.Init = function (sapControl) {
                    this.initAndConnectBapiManagersIfNeeded(sapControl);
                    if (!this.isBapiManagerConnected() && !this.isWSBapiManagerConnected()) {
                        return false;
                    }
                    var res = true;
                    var bapiManager;
                    for (var bapiName in this.BapiList) {
                        var bapi = this.BapiList[bapiName];
                        if (Object.prototype.hasOwnProperty.call(this.BapiList, bapiName) &&
                            bapi) {
                            bapiManager = bapi.IsWS() ? this.bapiWSManager : this.bapiManager;
                            res = res && bapi.Init(bapiManager) !== null;
                        }
                    }
                    return res;
                };
                // Reset BAPI parameters to default values
                BAPIController.prototype.ResetBapi = function (bapiName) {
                    var bapi = this.BapiList[bapiName];
                    if (bapi) {
                        bapi.Reset();
                    }
                };
                // Resets all BAPIs parameters to default values
                BAPIController.prototype.ResetAllBapis = function () {
                    for (var bapiName in this.BapiList) {
                        if (Object.prototype.hasOwnProperty.call(this.BapiList, bapiName)) {
                            this.ResetBapi(bapiName);
                        }
                    }
                };
                /** Finalize all member variables.
                *	If you are working on BAPIs parameters in SAP, use the ReleaseBapiManagerByID API instead of FinalizeBapiManagerByID.
                *	This will force the SAPProxy to reload the BAPI definition from SAP with every script execution.
                *	Revert to FinalizeBapiManagerByID once the BAPI development is done to benefit from the cache mechanism and improve performances.
                */
                BAPIController.prototype.Finalize = function () {
                    if (this.sapControl && this.bapiManager && this.bapiManager.Id) {
                        try {
                            this.BapiList = {};
                            this.sapControl.FinalizeBapiManagerByID(this.bapiManager.Id);
                        }
                        finally {
                            this.bapiManager = null;
                            this.bapiWSManager = null;
                            Lib.AP.SAP.BapiControllerSingleton = null;
                            Sys.Helpers.SAP.SapControlSingleton = null;
                        }
                    }
                };
                // Translate key using the SAPProxy language file
                BAPIController.prototype.sapi18n = function (key, aValues) {
                    if (this.sapControl && key) {
                        var res = this.sapControl.i18n(key, this.sapCurrentLanguage);
                        // now replace the %i with the values
                        if (typeof aValues === "object" && aValues instanceof Array) {
                            for (var idx = 0; idx < aValues.length; idx++) {
                                res = res.replace("%" + (idx + 1), aValues[idx]);
                            }
                        }
                        return res;
                    }
                    return key;
                };
                return BAPIController;
            }());
            SAP.BAPIController = BAPIController;
            function GetNewBapiController() {
                if (Lib.AP.SAP.BapiControllerSingleton) {
                    return Lib.AP.SAP.BapiControllerSingleton;
                }
                Lib.AP.SAP.BapiControllerSingleton = new BAPIController();
                return Lib.AP.SAP.BapiControllerSingleton;
            }
            SAP.GetNewBapiController = GetNewBapiController;
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
