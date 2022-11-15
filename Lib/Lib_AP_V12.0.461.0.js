///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "AP library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_LdapUtil",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "[Lib_AP_Customization_Common]"
  ]
}*/
var Lib;
(function (Lib) {
    /**
    * base class for Account Payable module.
    * @namespace Lib.AP
    * @see {@link Lib.AP}
    **/
    var AP;
    (function (AP) {
        var DEFAULT_PRECISIONS = {
            JPY: 0,
            DEFAULT: 2
        };
        // Expose standard AddLib & ExtendLib functions
        AP.AddLib = Lib.AddLib;
        AP.ExtendLib = Lib.ExtendLib;
        // #region SimpleMap Class definition
        var SimpleMap = /** @class */ (function () {
            function SimpleMap() {
                this.map = {};
                this.pendingQueries = [];
            }
            return SimpleMap;
        }());
        AP.SimpleMap = SimpleMap;
        SimpleMap.prototype.Add = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            // the arguments are the path in the map, except the last one which is the value to store
            var obj = this.map;
            var arg = args.shift();
            while (args.length > 1) {
                obj[arg] = obj[arg] || {};
                obj = obj[arg];
                arg = args.shift();
            }
            if (arg) {
                // the last element is the value to store
                obj[arg] = args.pop();
            }
        };
        SimpleMap.prototype.Get = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            // arguments are the path in the map
            var obj = this.map;
            while (obj && args.length) {
                obj = obj[args.shift()];
            }
            return obj;
        };
        SimpleMap.prototype.IsParamsEquals = function (params, queryParams) {
            if (params && params.tableFields) {
                return this.IsOldParamsEquals(params, queryParams);
            }
            return params.value === queryParams.value && params.formCodeField === queryParams.formCodeField && params.formDescriptionField === queryParams.formDescriptionField
                && params.companyCode === queryParams.companyCode;
        };
        SimpleMap.prototype.IsOldParamsEquals = function (params, queryParams) {
            if (params.table === queryParams.table && params.filter === queryParams.filter) {
                // check that all asked fields are aked by the current query
                var nbFound = 0;
                for (var i = 0; i < params.tableFields.length; i++) {
                    for (var j = 0; j < queryParams.tableFields.length; j++) {
                        if (params.tableFields[i] === queryParams.tableFields[j]) {
                            nbFound++;
                            break;
                        }
                    }
                }
                return nbFound === params.tableFields.length;
            }
            return false;
        };
        SimpleMap.prototype.GetPendingQuery = function (params) {
            var pendingQuery = null;
            for (var i = 0; i < this.pendingQueries.length; i++) {
                var query = this.pendingQueries[i];
                if (this.IsParamsEquals(params, query.params)) {
                    pendingQuery = query;
                    break;
                }
            }
            return pendingQuery;
        };
        SimpleMap.prototype.SetPendingQuery = function (params, callback, item) {
            var o = {
                params: params,
                callbacks: [],
                addCallback: function (cb, it) {
                    this.callbacks.push({
                        callback: cb,
                        item: it
                    });
                }
            };
            o.addCallback(callback, item);
            this.pendingQueries.push(o);
        };
        SimpleMap.prototype.Clear = function () {
            this.pendingQueries = [];
        };
        // #endregion
        // #region ERPmanager helpers
        function initERPManager() {
            currentERPManager = Lib.ERP.CreateManager(Lib.ERP.GetERPName("AP") || "generic");
            if (currentERPManager === null) {
                currentERPManager = Lib.ERP.CreateManager("generic");
            }
            currentERPManager.Init("AP");
            return currentERPManager;
        }
        function getDocument(documentType) {
            currentDocuments[documentType] = currentDocuments[documentType] || Lib.AP.GetERPManager().GetDocument(documentType);
            return currentDocuments[documentType];
        }
        // #endregion
        function SyncCallBack(callback) {
            var _this = this;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return function (token) {
                args.push(token);
                callback.apply(_this, args);
            };
        }
        var currentERPManager = null;
        var currentDocuments = {};
        var lineItemsCache = null;
        var g_descriptionsCache = new SimpleMap();
        var g_paymentTermsCache = new SimpleMap();
        var g_multiValuesSeparator = ",";
        // #endregion
        var InvoiceStatus;
        (function (InvoiceStatus) {
            InvoiceStatus["Received"] = "Received";
            InvoiceStatus["ToVerify"] = "To verify";
            InvoiceStatus["ToApprove"] = "To approve";
            InvoiceStatus["ToPost"] = "To post";
            InvoiceStatus["OnHold"] = "On hold";
            InvoiceStatus["ToPay"] = "To pay";
            InvoiceStatus["Rejected"] = "Rejected";
            InvoiceStatus["SetAside"] = "Set aside";
            InvoiceStatus["Paid"] = "Paid";
            InvoiceStatus["Reversed"] = "Reversed";
            InvoiceStatus["Expired"] = "Expired";
            InvoiceStatus["ToApproveBeforeClearing"] = "To approve before clearing";
            InvoiceStatus["WaitForClearing"] = "Wait for clearing";
            InvoiceStatus["InPaymentProposal"] = "In Payment Proposal";
            InvoiceStatus["BeingPaidByProvider"] = "Being paid by provider";
            InvoiceStatus["BeingPaid"] = "Being paid";
        })(InvoiceStatus = AP.InvoiceStatus || (AP.InvoiceStatus = {}));
        var CIStatus;
        (function (CIStatus) {
            CIStatus["ToSend"] = "To send";
            CIStatus["Draft"] = "Draft";
            CIStatus["AwaitingReception"] = "Awaiting reception";
            CIStatus["AwaitingPaymentApproval"] = "Awaiting payment approval";
            CIStatus["AwaitingPayment"] = "Awaiting payment transaction";
            CIStatus["Paid"] = "Paid";
            CIStatus["Rejected"] = "Rejected";
        })(CIStatus = AP.CIStatus || (AP.CIStatus = {}));
        var CIDiscountState;
        (function (CIDiscountState) {
            CIDiscountState["Accepted"] = "Accepted";
            // For Payment term static and automatically accepted
            CIDiscountState["Static"] = "Static";
            // None proposal early payment is requested yet
            // For CI with Payment term with dynamic discount enabled (mode 2) and (mode 3)
            CIDiscountState["NotRequested"] = "Not requested";
            CIDiscountState["PendingReview"] = "Pending review";
            CIDiscountState["Refused"] = "Refused";
        })(CIDiscountState = AP.CIDiscountState || (AP.CIDiscountState = {}));
        var PaymentMethod;
        (function (PaymentMethod) {
            PaymentMethod["Cash"] = "Cash";
            PaymentMethod["Check"] = "Check";
            PaymentMethod["CreditCard"] = "Credit card";
            PaymentMethod["EFT"] = "EFT";
            PaymentMethod["Other"] = "Other";
        })(PaymentMethod = AP.PaymentMethod || (AP.PaymentMethod = {}));
        var PaymentRunStatus;
        (function (PaymentRunStatus) {
            PaymentRunStatus["New"] = "New";
            PaymentRunStatus["ToVerify"] = "To verify";
            PaymentRunStatus["ToApprove"] = "To approve";
            PaymentRunStatus["ApprovedToPay"] = "Approved to pay";
            PaymentRunStatus["ApprovedPendingStatus"] = "Approved pending status";
            PaymentRunStatus["Approved"] = "Approved";
            PaymentRunStatus["Paid"] = "Paid";
            PaymentRunStatus["Rejected"] = "Rejected";
            PaymentRunStatus["Cancelled"] = "Cancelled";
            PaymentRunStatus["Failed"] = "Failed";
        })(PaymentRunStatus = AP.PaymentRunStatus || (AP.PaymentRunStatus = {}));
        // statuses used in payment run 'Invoice Status' column
        var PaymentRunInvoicePaymentStatus;
        (function (PaymentRunInvoicePaymentStatus) {
            PaymentRunInvoicePaymentStatus["ToPay"] = "To pay";
            PaymentRunInvoicePaymentStatus["BeingPaidByProvider"] = "Payment being processed by provider";
            PaymentRunInvoicePaymentStatus["Paid"] = "Paid";
            PaymentRunInvoicePaymentStatus["RejectedByProvider"] = "RejectedByProvider"; // payment of this invoice has been definitively rejected on provider side
        })(PaymentRunInvoicePaymentStatus = AP.PaymentRunInvoicePaymentStatus || (AP.PaymentRunInvoicePaymentStatus = {}));
        var PaymentProviderName;
        (function (PaymentProviderName) {
            PaymentProviderName["Corpay"] = "NvoicePay";
        })(PaymentProviderName = AP.PaymentProviderName || (AP.PaymentProviderName = {}));
        var TouchlessException;
        (function (TouchlessException) {
            TouchlessException["CompanyIdentificationException"] = "CompanyIdentificationException";
            TouchlessException["DataToConfirm"] = "DataToConfirm";
            TouchlessException["DuplicateInvoice"] = "DuplicateInvoice";
            TouchlessException["InvalidValue"] = "InvalidValue";
            TouchlessException["InvoiceNotBalanced"] = "InvoiceNotBalanced";
            TouchlessException["MissingHeader"] = "MissingHeader";
            TouchlessException["MissingLineField"] = "MissingLineField";
            TouchlessException["NotCompliant"] = "NotCompliant";
            TouchlessException["Other"] = "Other";
            TouchlessException["PriceMismatch"] = "PriceMismatch";
            TouchlessException["QuantityMismatch"] = "QuantityMismatch";
            TouchlessException["UDCException"] = "UDCException";
            TouchlessException["VendorIdentificationException"] = "VendorIdentificationException";
            TouchlessException["WorkflowError"] = "WorkflowError";
        })(TouchlessException = AP.TouchlessException || (AP.TouchlessException = {}));
        AP.InvoiceType = {
            NON_PO_INVOICE: "Non-PO Invoice",
            PO_INVOICE: "PO Invoice",
            PO_INVOICE_AS_FI: "PO Invoice (as FI)",
            CONSIGNMENT: "Consignment",
            CLEARING: "Clearing",
            isGLInvoice: function () {
                return Data.GetValue("InvoiceType__") === this.NON_PO_INVOICE;
            },
            isPOInvoice: function () {
                return Data.GetValue("InvoiceType__") === this.PO_INVOICE;
            },
            isPOGLInvoice: function () {
                return Data.GetValue("InvoiceType__") === this.PO_INVOICE_AS_FI;
            },
            isConsignmentInvoice: function () {
                return Data.GetValue("InvoiceType__") === this.CONSIGNMENT;
            },
            isClearingDocument: function () {
                return Variable.GetValueAsString("InvoiceType__") === this.CLEARING;
            }
        };
        AP.CustomerInvoiceType = {
            Default: "",
            FlipPO: "FlipPO",
            isFlipPO: function () {
                return Variable.GetValueAsString("Mode") === this.FlipPO;
            }
        };
        /**
         * ERPAcknowledgment list the common parts beetween the VIP and the ERP Ack process
         */
        AP.ERPAcknowledgment = {
            /**
             * List of action handle by the ERP Acknowledgment process
             */
            Actions: {
                /**
                 * VendorRegistrationToUpdateWithErpAck indicates that the Vendor Registration process needs to be updated with
                 * the acknowledgment
                 */
                VendorRegistrationToUpdateWithErpAck: "VendorRegistrationToUpdateWithErpAck",
                /**
                 * ErpAcknowledgmentProcessed indicates that the target process finished to process
                 * the acknowledgment
                 */
                ErpAcknowledgmentProcessed: "ErpAcknowledgmentProcessed"
            },
            /**
             * @returns {boolean} true if the posting to the erp has been done and we're waiting for an acknowledgement but none has yet been received, else false
             */
            IsWaitingForERPAcknowledgment: function () {
                // True if the option is activated, we have an ERP Posting Date, but no ERP Invoice Number yet
                return Variable.GetValueAsString("WaitForERPAck") === "true"
                    && Data.GetValue("ERPPostingDate__")
                    && !Data.GetValue("ERPInvoiceNumber__");
            },
            /**
             * @param {string} erpArckRuidEx RuidEx of the ERP Acknowledgement process to update
             * @param {string} action The action name to execute
             * @returns {boolean} true if the xTransport was found and ResumeWithAction or ResumeWithActionAsync were called, else false
             */
            SendActionToErpAcknowledgmentProcess: function (erpArckRuidEx, action) {
                var result = false;
                if (!erpArckRuidEx) {
                    return result;
                }
                var query = Process.CreateQueryAsProcessAdmin();
                query.SetSpecificTable("CDNAME#Update invoice with ERP ID");
                query.SetFilter(Sys.Helpers.LdapUtil.FilterEqual("RuidEx", erpArckRuidEx).toString());
                if (query.MoveFirst()) {
                    var transport = query.MoveNext();
                    if (transport) {
                        if (!transport.ResumeWithAction(action, false)) {
                            transport.ResumeWithActionAsync(action);
                        }
                        result = true;
                    }
                }
                return result;
            }
        };
        function IsSupportNonERPOrder() {
            return Lib.ERP.GetERPName() === "SAP" ||
                (Sys.Parameters.GetInstance("P2P_" + Lib.ERP.GetERPName()).GetParameter("SupportNonERPOrder", false) &&
                    Sys.Parameters.GetInstance("P2P").GetParameter("EnablePurchasingGlobalSetting") === "1");
        }
        AP.IsSupportNonERPOrder = IsSupportNonERPOrder;
        function NewSimpleMap() {
            return new SimpleMap();
        }
        AP.NewSimpleMap = NewSimpleMap;
        function InitArchiveDuration() {
            //Force the current process to archive only the data (in this case, the documents are archived for 2 months).
            var archiveDataSettings = Sys.Parameters.GetInstance("AP").GetParameter("ArchiveDataSettings", null);
            if (archiveDataSettings === "_ArchiveDataOnly") {
                Process.ArchiveDataOnly();
            }
            // Override the form archive duration of the process when a value is defined (may differ according to the environments)
            var archiveDuration = Sys.Parameters.GetInstance("AP").GetParameter("ArchiveDurationInMonths", null);
            if (archiveDuration !== null) {
                Data.SetValue("ArchiveDuration", archiveDuration);
            }
        }
        AP.InitArchiveDuration = InitArchiveDuration;
        function FormatInvoiceDocumentNumber(documentNumber, fiscalYear, companyCode) {
            return companyCode ? "".concat(documentNumber, "-").concat(companyCode, "-").concat(fiscalYear) : "".concat(documentNumber, "-").concat(fiscalYear);
        }
        AP.FormatInvoiceDocumentNumber = FormatInvoiceDocumentNumber;
        function CreateInvoiceDocumentObject(normalize, documentNumber, fiscalYear, companyCode) {
            var obj = {
                documentNumber: documentNumber,
                fiscalYear: fiscalYear,
                companyCode: companyCode
            };
            if (normalize) {
                obj.documentNumber = Sys.Helpers.String.SAP.NormalizeID(Sys.Helpers.String.SAP.Trim(obj.documentNumber), 10);
                obj.fiscalYear = Sys.Helpers.String.SAP.Trim(obj.fiscalYear);
                if (obj.companyCode) {
                    obj.companyCode = Sys.Helpers.String.SAP.Trim(obj.companyCode);
                }
            }
            if (obj.companyCode) {
                obj.stringValue = obj.companyCode + obj.documentNumber + obj.fiscalYear;
                obj.isFI = true;
            }
            else {
                obj.stringValue = obj.documentNumber + obj.fiscalYear;
                obj.isMM = true;
            }
            return obj;
        }
        AP.CreateInvoiceDocumentObject = CreateInvoiceDocumentObject;
        function ParseInvoiceDocumentNumber(docNumber, normalize) {
            if (!docNumber || typeof docNumber !== "string") {
                return null;
            }
            // docNumber should be in the format "documentNumber-CompanyCode-fiscalYear" (FI) or "documentNumber-fiscalYear" (MM)
            var docNumberSplitted = docNumber.split("-");
            if (docNumberSplitted.length < 2 || docNumberSplitted.length > 3) {
                return null;
            }
            var mmType = docNumberSplitted.length === 2;
            var fiscalYear = mmType ? docNumberSplitted[1] : docNumberSplitted[2];
            var companyCode;
            if (!mmType) {
                companyCode = docNumberSplitted[1];
            }
            return CreateInvoiceDocumentObject(normalize, docNumberSplitted[0], fiscalYear, companyCode);
        }
        AP.ParseInvoiceDocumentNumber = ParseInvoiceDocumentNumber;
        // Depends on Sys.GenericAPI and Lib.P2P
        function GetAndFillDescriptionFromCode(item, formCodeField, formDescriptionField, tableKeyField, table, companyCode, token) {
            var formFields = [formDescriptionField];
            Lib.AP.GetAndFillDescriptionFromCodeEx(item, formCodeField, formFields, ["Description__"], tableKeyField, table, companyCode, token);
        }
        AP.GetAndFillDescriptionFromCode = GetAndFillDescriptionFromCode;
        function GetAndFillDescriptionFromCodeEx(item, formCodeField, formFields, tableFields, tableKeyField, table, companyCode, token) {
            function escapeKeyValue(value) {
                return value.replace(/\\/g, "\\\\");
            }
            if (!item) {
                if (token) {
                    token.Use();
                }
                return;
            }
            var params = {
                "table": table,
                "tableFields": tableFields,
                "filter": null
            };
            var keyValue = item.GetValue(formCodeField);
            if (keyValue) {
                // Search cache first
                var cachedValue_1 = g_descriptionsCache.Get(companyCode, formCodeField, keyValue);
                if (cachedValue_1) {
                    Sys.Helpers.Array.ForEach(formFields, function (field) {
                        item.SetValue(field, cachedValue_1[field]);
                    });
                    if (token) {
                        token.Use();
                    }
                }
                else {
                    params.filter = Sys.Helpers.LdapUtil.FilterEqual(tableKeyField, escapeKeyValue(keyValue)).toString();
                    params.filter = params.filter.AddCompanyCodeFilter(companyCode);
                    var pendingQuery = g_descriptionsCache.GetPendingQuery(params);
                    if (pendingQuery && pendingQuery.callbacks.length > 0) {
                        pendingQuery.addCallback(updateItem, item);
                    }
                    else {
                        if (pendingQuery) {
                            pendingQuery.addCallback(updateItem, item);
                        }
                        else {
                            g_descriptionsCache.SetPendingQuery(params, updateItem, item);
                        }
                        Sys.GenericAPI.Query(params.table, params.filter, params.tableFields, callback, null, 1);
                    }
                }
            }
            else {
                Sys.Helpers.Array.ForEach(formFields, function (field) {
                    item.SetValue(field, "");
                });
                if (token) {
                    token.Use();
                }
            }
            function loopOnPendingCallbacks() {
                var queries = g_descriptionsCache.GetPendingQuery(params);
                if (queries) {
                    var pendingCallback = queries.callbacks.pop();
                    while (pendingCallback) {
                        pendingCallback.callback(pendingCallback.item);
                        pendingCallback = queries.callbacks.pop();
                    }
                }
                else {
                    Log.Error("Unable to get description");
                    g_descriptionsCache.Clear();
                }
            }
            function updateItem(curItem) {
                Sys.Helpers.Array.ForEach(formFields, function (field) {
                    var value = g_descriptionsCache.Get(companyCode, formCodeField, keyValue, field);
                    if (value || value === "") {
                        curItem.SetValue(field, value);
                    }
                    else {
                        curItem.SetCategorizedError(formCodeField, Lib.AP.TouchlessException.InvalidValue, "Field value does not belong to table!");
                    }
                });
                if (token) {
                    token.Use();
                }
            }
            function callback(result, error) {
                if (error) {
                    Sys.GenericAPI.LogWarning("Error in getAndFillDescriptionFromCode: ".concat(error));
                }
                else if (result.length === 0) {
                    Sys.GenericAPI.LogInfo("No record found for ".concat(formCodeField, "=").concat(keyValue));
                }
                else {
                    Sys.Helpers.Array.ForEach(tableFields, function (field, i) {
                        // Fill cache
                        g_descriptionsCache.Add(companyCode, formCodeField, keyValue, formFields[i], result[0][field]);
                    });
                }
                loopOnPendingCallbacks();
            }
        }
        AP.GetAndFillDescriptionFromCodeEx = GetAndFillDescriptionFromCodeEx;
        function AddPOLine(obj, async) {
            function cleanFirstEmptyLine(tbl) {
                var firstItem = table.GetItem(0);
                if (Lib.P2P.InvoiceLineItem.IsEmpty(firstItem)) {
                    tbl.SetItemCount(0);
                    lineItemsCache = [];
                }
            }
            function setTaxRate() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    baseLib.TaxHelper.getTaxRate(obj.taxCode, obj.jurisdictionCode || "", Data.GetValue("CompanyCode__"), Data.GetValue("InvoiceCurrency__"), function (item, taxRates, nonDeductibleTaxRates, roundingModes) {
                        baseLib.TaxHelper.setTaxRate(item, taxRates, nonDeductibleTaxRates, roundingModes);
                        resolve(item);
                    }, newItem, !isSAP && obj.getTaxRateParameters);
                });
            }
            function setValueIfNotEmpty(field, value) {
                if (value) {
                    newItem.SetValue(field, value);
                }
            }
            function setOrCleanValue(field, value) {
                newItem.SetValue(field, value || "");
            }
            function setUnitPrice() {
                var unitPrice = obj.unitPrice;
                if (!unitPrice) {
                    newItem.SetValue("UnitPrice__", Lib.P2P.ComputeUnitPrice(obj.orderedAmount, obj.orderedQuantity));
                }
                else {
                    newItem.SetValue("UnitPrice__", unitPrice);
                }
            }
            function setCustomDimensions() {
                if (obj.customDimensions) {
                    for (var field in obj.customDimensions) {
                        if (Object.prototype.hasOwnProperty.call(obj.customDimensions, field)) {
                            newItem.SetValue(field, obj.customDimensions[field]);
                        }
                    }
                }
            }
            var isSAP = Lib.ERP.IsSAP();
            var baseLib = isSAP ? Lib.AP.SAP : Lib.AP;
            var table = Data.GetTable("LineItems__");
            // Clean the empty table line if present
            if (table.GetItemCount() === 1) {
                cleanFirstEmptyLine(table);
            }
            table.AddItem(false);
            table.SetItemCount(table.GetItemCount());
            var newItem = table.GetItem(table.GetItemCount() - 1);
            // Set data
            var defaultLineType = Data.GetValue("InvoiceType__") === Lib.AP.InvoiceType.PO_INVOICE_AS_FI ? Lib.P2P.LineType.POGL : Lib.P2P.LineType.PO;
            newItem.SetValue("LineType__", obj.type ? obj.type : defaultLineType);
            newItem.SetValue("Buyer__", obj.buyer ? obj.buyer : "");
            newItem.SetValue("Receiver__", obj.receiver ? obj.receiver : "");
            setValueIfNotEmpty("OrderNumber__", obj.orderNumber);
            setValueIfNotEmpty("GoodIssue__", obj.goodIssue);
            setValueIfNotEmpty("Assignment__", obj.assignment);
            setValueIfNotEmpty("ItemNumber__", obj.itemNumber);
            setValueIfNotEmpty("Description__", obj.description);
            setValueIfNotEmpty("TaxCode__", obj.taxCode);
            setValueIfNotEmpty("NonDeductibleTaxRate__", obj.nonDeductibleTaxRate);
            newItem.SetValue("VendorNumber__", obj.vendorNumber);
            setValueIfNotEmpty("DifferentInvoicingParty__", obj.diffInv);
            setValueIfNotEmpty("OpenAmount__", obj.openAmount);
            setValueIfNotEmpty("OpenQuantity__", obj.openQuantity);
            setValueIfNotEmpty("ExpectedAmount__", obj.expectedAmount);
            setValueIfNotEmpty("ExpectedQuantity__", obj.expectedQuantity);
            setValueIfNotEmpty("Amount__", obj.amount);
            setValueIfNotEmpty("Quantity__", obj.quantity);
            setValueIfNotEmpty("PartNumber__", obj.partNumber);
            setValueIfNotEmpty("GLAccount__", obj.glAccount);
            setValueIfNotEmpty("CostCenter__", obj.costCenter);
            newItem.SetValue("TaxAmount__", 0.0);
            setOrCleanValue("DeliveryNote__", obj.deliveryNote);
            setOrCleanValue("GoodsReceipt__", obj.goodReceipt);
            setOrCleanValue("PreviousBudgetID__", obj.previousBudgetID);
            newItem.SetValue("IsLocalPO__", obj.isLocalPO || false);
            newItem.SetValue("NoGoodsReceipt__", obj.noGoodsReceipt || false);
            setOrCleanValue("UnitOfMeasureCode__", obj.unitOfMeasureCode);
            newItem.SetValue("CostType__", obj.costType);
            newItem.SetValue("ItemType__", obj.itemType);
            setOrCleanValue("ProjectCode__", obj.projectCode);
            setOrCleanValue("FreeDimension1__", obj.freeDimension1);
            setOrCleanValue("FreeDimension1ID__", obj.freeDimension1ID);
            // SAP specifics
            if (isSAP) {
                setOrCleanValue("BusinessArea__", obj.businessArea);
                setOrCleanValue("InternalOrder__", obj.internalOrder);
                setOrCleanValue("WBSElement__", obj.wbsElement);
                setOrCleanValue("WBSElementID__", obj.wbsElementID);
                setOrCleanValue("TaxJurisdiction__", obj.jurisdictionCode);
                setOrCleanValue("AcctAssCat__", obj.AcctAssCat + obj.Distribution);
            }
            // Don't use the dot-notation because the UpdateGLCCDescriptions is both declared in Common and Server libraries
            // eslint-disable-next-line dot-notation
            if (typeof baseLib["UpdateGLCCDescriptions"] === "function") {
                // eslint-disable-next-line dot-notation
                baseLib["UpdateGLCCDescriptions"](newItem);
            }
            setUnitPrice();
            // Optional custom dimensions
            setCustomDimensions();
            var itemNumber = table.GetItemCount() - 1;
            function queryProjectCodeCallback(result, error) {
                if (error) {
                    Sys.GenericAPI.LogWarning("Error in ComputeDiscountAmount: " + error);
                }
                else if (result.length === 1) {
                    var item = table.GetItem(itemNumber);
                    item.SetValue("ProjectCodeDescription__", result[0].Description__);
                }
            }
            // Fill projectcode description	(synchro issue on client side)
            var filter = Sys.Helpers.LdapUtil.FilterEqual("ProjectCode__", obj.projectCode).toString();
            Sys.GenericAPI.Query("P2P - Project codes__", filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__")), ["Description__"], queryProjectCodeCallback, null, 1);
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.PurchaseOrder.OnAddPOLine", newItem, obj);
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.FillCostType", newItem);
            var promise = setTaxRate();
            if (async) {
                return promise;
            }
            return newItem;
        }
        AP.AddPOLine = AddPOLine;
        function ResetLineItemsCache() {
            lineItemsCache = null;
        }
        AP.ResetLineItemsCache = ResetLineItemsCache;
        function AddLineToCache(line) {
            if (line) {
                lineItemsCache.push({
                    lineNumber: lineItemsCache.length,
                    orderNumber: line.GetValue("OrderNumber__"),
                    itemNumber: line.GetValue("ItemNumber__"),
                    grNumber: line.GetValue("GoodsReceipt__"),
                    giNumber: line.GetValue("GoodIssue__")
                });
            }
        }
        AP.AddLineToCache = AddLineToCache;
        function LoadLineItemsCache() {
            if (lineItemsCache) {
                return;
            }
            lineItemsCache = [];
            var lineItems = Data.GetTable("LineItems__");
            for (var i = 0; i < lineItems.GetItemCount(); i++) {
                Lib.AP.AddLineToCache(lineItems.GetItem(i));
            }
        }
        AP.LoadLineItemsCache = LoadLineItemsCache;
        function UpdateOrAddPOLine(obj, async) {
            var res = {
                added: false,
                updated: false,
                item: null
            };
            Lib.AP.LoadLineItemsCache();
            for (var i = 0; i < lineItemsCache.length; i++) {
                var itemCache = lineItemsCache[i];
                if (Lib.AP.CachedLineMatch(itemCache, obj.orderNumber, obj.itemNumber, obj.goodReceipt, obj.goodIssue)) {
                    var lineItems = Data.GetTable("LineItems__");
                    var item = lineItems.GetItem(itemCache.lineNumber);
                    res.item = item;
                    var expectedAmoundCondition = obj.expectedAmount > item.GetValue("ExpectedAmount__") && obj.expectedAmount > 0;
                    var expectedQuantityCondition = obj.expectedQuantity > item.GetValue("ExpectedQuantity__") && obj.expectedQuantity > 0;
                    if (expectedAmoundCondition || expectedQuantityCondition) {
                        res.updated = true;
                        item.SetValue("ExpectedAmount__", obj.expectedAmount);
                        item.SetValue("ExpectedQuantity__", obj.expectedQuantity);
                    }
                    item.SetValue("OpenAmount__", obj.openAmount);
                    item.SetValue("OpenQuantity__", obj.openQuantity);
                    item.SetValue("Buyer__", obj.buyer);
                    item.SetValue("Receiver__", obj.receiver);
                    break;
                }
            }
            if (!res.item) {
                res.added = true;
                if (async) {
                    return Lib.AP.AddPOLine(obj, true)
                        .Then(function (newItem) {
                        res.item = newItem;
                        Lib.AP.AddLineToCache(res.item);
                        return Sys.Helpers.Promise.Resolve(res);
                    });
                }
                res.item = Lib.AP.AddPOLine(obj);
                Lib.AP.AddLineToCache(res.item);
            }
            return async ? Sys.Helpers.Promise.Resolve(res) : res;
        }
        AP.UpdateOrAddPOLine = UpdateOrAddPOLine;
        function CachedLineMatch(cachedLine, orderNumber, itemNumber, goodReceipt, goodIssue) {
            if (!cachedLine) {
                return false;
            }
            var match = cachedLine.orderNumber === orderNumber;
            if (goodIssue) {
                match = cachedLine.giNumber === goodIssue;
            }
            match = match && cachedLine.itemNumber === itemNumber;
            if (goodReceipt) {
                match = match && cachedLine.grNumber === goodReceipt;
            }
            return match;
        }
        AP.CachedLineMatch = CachedLineMatch;
        function LineMatch(line, orderNumber, itemNumber, goodReceipt, goodIssue, pricingCondition) {
            if (!line) {
                return false;
            }
            var match = line.GetValue("OrderNumber__") === orderNumber;
            if (goodIssue) {
                match = line.GetValue("GoodIssue__") === goodIssue;
            }
            match = match && line.GetValue("ItemNumber__") === itemNumber;
            if (goodReceipt) {
                match = match && line.GetValue("GoodsReceipt__") === goodReceipt;
            }
            if (pricingCondition) {
                match = match && line.GetValue("PriceCondition__") === pricingCondition;
            }
            return match;
        }
        AP.LineMatch = LineMatch;
        function MatchingLineFound(line, linesProcessed) {
            var found = false;
            for (var j = 0; j < linesProcessed.length; ++j) {
                var lineProcessed = linesProcessed[j];
                var processedOrderNumber = lineProcessed.GetValue("OrderNumber__");
                var processedItemNumber = lineProcessed.GetValue("ItemNumber__");
                var processedGoodReceipt = lineProcessed.GetValue("GoodsReceipt__");
                var processedGoodIssue = lineProcessed.GetValue("GoodIssue__");
                if (Lib.AP.LineMatch(line, processedOrderNumber, processedItemNumber, processedGoodReceipt, processedGoodIssue, lineProcessed.GetValue("PriceCondition__"))) {
                    found = true;
                    break;
                }
            }
            return found;
        }
        AP.MatchingLineFound = MatchingLineFound;
        function ClearUnprocessedLineItems(orderNumber, linesProcessed) {
            // Clear lines that are no longer found
            var lineItems = Data.GetTable("LineItems__");
            var itemCount = lineItems.GetItemCount();
            var lineIdx = 0;
            while (lineIdx < itemCount) {
                var lineItem = lineItems.GetItem(lineIdx);
                if (Lib.P2P.InvoiceLineItem.IsPOLineItem(lineItem) && lineItem.GetValue("OrderNumber__") === orderNumber && !Lib.AP.MatchingLineFound(lineItem, linesProcessed)) {
                    itemCount = lineItem.RemoveItem();
                }
                else {
                    lineIdx++;
                }
            }
            // Clear cache
            lineItemsCache = null;
        }
        AP.ClearUnprocessedLineItems = ClearUnprocessedLineItems;
        function GetAndFillDescriptionFromCodeSync(item, formCodeField, formDescriptionField, tableKeyField, table, companyCode, disableCB, doneCB) {
            if (disableCB) {
                disableCB(true, "GetAndFillDescriptionFromCodeSync");
            }
            var sync = Sys.Helpers.Synchronizer.Create(function () {
                if (disableCB) {
                    disableCB(false, "GetAndFillDescriptionFromCodeSync");
                }
                if (doneCB) {
                    doneCB();
                }
            });
            sync.Register(SyncCallBack(Lib.AP.GetAndFillDescriptionFromCode, item, formCodeField, formDescriptionField, tableKeyField, table, companyCode));
            sync.Start();
        }
        AP.GetAndFillDescriptionFromCodeSync = GetAndFillDescriptionFromCodeSync;
        function UpdateGLCCDescriptions(item) {
            Lib.AP.GetAndFillDescriptionFromCodeExSync(item, "GLAccount__", ["GLDescription__", "Group__"], ["Description__", "Group__"], "Account__", "AP - G/L accounts__", Data.GetValue("CompanyCode__"));
            Lib.AP.GetAndFillDescriptionFromCodeSync(item, "CostCenter__", "CCDescription__", "CostCenter__", "AP - Cost centers__", Data.GetValue("CompanyCode__"));
            Lib.AP.GetAndFillDescriptionFromCodeSync(item, "ProjectCode__", "ProjectCodeDescription__", "ProjectCode__", "P2P - Project codes__", Data.GetValue("CompanyCode__"));
        }
        AP.UpdateGLCCDescriptions = UpdateGLCCDescriptions;
        function GetAndFillDescriptionFromCodeExSync(item, formCodeField, formFields, tableFields, tableKeyField, table, companyCode, disableCB, doneCB) {
            if (disableCB) {
                disableCB(true, "GetAndFillDescriptionFromCodeExSync");
            }
            var sync = Sys.Helpers.Synchronizer.Create(function () {
                if (disableCB) {
                    disableCB(false, "GetAndFillDescriptionFromCodeExSync");
                }
                if (doneCB) {
                    doneCB();
                }
            });
            sync.Register(SyncCallBack(Lib.AP.GetAndFillDescriptionFromCodeEx, item, formCodeField, formFields, tableFields, tableKeyField, table, companyCode));
            sync.Start();
        }
        AP.GetAndFillDescriptionFromCodeExSync = GetAndFillDescriptionFromCodeExSync;
        function GetPaymentTerms(companyCode, paymentTerms, queryCallback) {
            var cachedValue = g_paymentTermsCache.Get(companyCode, paymentTerms);
            if (typeof cachedValue !== "undefined") {
                return cachedValue;
            }
            // Read entry in payment terms table
            var filter = Sys.Helpers.LdapUtil.FilterEqual("PaymentTermCode__", paymentTerms).toString();
            Sys.GenericAPI.Query("AP - Payment terms__", filter.AddCompanyCodeFilter(companyCode), ["ReferenceDate__", "DayLimit__", "EndOfMonth__", "DiscountPeriod__", "DiscountRate__", "DiscountRate30Days__", "LatePaymentFeeRate__", "PaymentDay__", "EnableDynamicDiscounting__", "Description__"], queryCallback, null, 1);
            return null;
        }
        AP.GetPaymentTerms = GetPaymentTerms;
        function ComputePaymentTermsDate(companyCode, paymentTerms, invoiceDate, postingDate, setPaymentTermsDateCallback) {
            var isCreditNote = Lib.AP.IsCreditNote();
            if (!isCreditNote && paymentTerms) {
                var cachedValue = Lib.AP.GetPaymentTerms(companyCode, paymentTerms, queryCallback);
                if (cachedValue === "noResult") {
                    setPaymentTermsDateCallback("", "");
                }
                else if (cachedValue) {
                    compute(cachedValue);
                }
            }
            else {
                setPaymentTermsDateCallback("", "");
            }
            function lastDayOfMonth(date) {
                var result = null;
                if (date) {
                    result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                }
                return result;
            }
            function queryCallback(result, error) {
                if (error) {
                    Sys.GenericAPI.LogWarning("Error in ComputePaymentTermsDate: " + error);
                }
                else if (result.length === 0) {
                    Sys.GenericAPI.LogWarning("No payment terms '" + paymentTerms + "' found for company code " + companyCode);
                    g_paymentTermsCache.Add(companyCode, paymentTerms, "noResult");
                    setPaymentTermsDateCallback("", "");
                }
                else {
                    // Add payment terms to cache
                    g_paymentTermsCache.Add(companyCode, paymentTerms, result[0]);
                    compute(result[0]);
                }
            }
            function compute(paymentTermsRecord) {
                var dueDate = null, discountDate = null;
                var referenceDate = paymentTermsRecord.ReferenceDate__;
                //Due Date
                if (!paymentTermsRecord.DayLimit__ || isNaN(parseInt(paymentTermsRecord.DayLimit__, 10))) {
                    Sys.GenericAPI.LogWarning("Do not compute due date from payment terms because dayLimit is not a number");
                }
                else if (!Sys.Helpers.IsEmpty(paymentTermsRecord.PaymentDay__) && isNaN(parseInt(paymentTermsRecord.PaymentDay__, 10))) {
                    Sys.GenericAPI.LogWarning("Do not compute due date from payment terms because paymentDay is not a number");
                }
                else {
                    var dayLimit = parseInt(paymentTermsRecord.DayLimit__, 10);
                    var endOfMonth = Boolean(parseInt(paymentTermsRecord.EndOfMonth__, 10));
                    var paymentDay = Sys.Helpers.IsEmpty(paymentTermsRecord.PaymentDay__) ? 0 : parseInt(paymentTermsRecord.PaymentDay__, 10);
                    // Compute due date
                    dueDate = computeDueDate(referenceDate, dayLimit, endOfMonth, paymentDay);
                }
                //Discount Date
                if (!paymentTermsRecord.DiscountPeriod__ || isNaN(parseInt(paymentTermsRecord.DiscountPeriod__, 10))) {
                    Sys.GenericAPI.LogWarning("Do not compute discount date from payment terms because discountPeriod is not a number");
                }
                else {
                    var discountPeriod = parseInt(paymentTermsRecord.DiscountPeriod__, 10);
                    // Compute discount date
                    discountDate = computeDiscountDate(referenceDate, discountPeriod);
                }
                setPaymentTermsDateCallback(dueDate || "", discountDate || "");
            }
            function getReferenceDate(referenceDate) {
                var d = null;
                if (referenceDate && referenceDate.toLowerCase() === "invoice date") {
                    if (invoiceDate) {
                        d = new Date(invoiceDate);
                    }
                }
                else if (referenceDate && referenceDate.toLowerCase() === "posting date") {
                    if (postingDate) {
                        d = new Date(postingDate);
                    }
                }
                return d;
            }
            function computeDueDate(referenceDate, dayLimit, endOfMonth, paymentDay) {
                var dueDate = getReferenceDate(referenceDate);
                if (dueDate) {
                    dueDate.setDate(dueDate.getDate() + dayLimit);
                    if (endOfMonth) {
                        dueDate = lastDayOfMonth(dueDate);
                    }
                    if (!Sys.Helpers.IsEmpty(paymentDay) && paymentDay > 0) {
                        if (endOfMonth || dueDate.getDate() > paymentDay) {
                            dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, paymentDay);
                        }
                        else {
                            dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), paymentDay);
                        }
                    }
                }
                return dueDate;
            }
            function computeDiscountDate(referenceDate, discountPeriod) {
                var discountDate = getReferenceDate(referenceDate);
                if (discountDate) {
                    discountDate.setDate(discountDate.getDate() + discountPeriod);
                }
                return discountDate;
            }
        }
        AP.ComputePaymentTermsDate = ComputePaymentTermsDate;
        /**
         * Reset the Due date and/or the Discount limit date if they were
         * computed and not set by an user
         */
        function RestoreComputedPaymentTermsDate() {
            if (Data.IsComputed("DueDate__")) {
                Data.SetValue("DueDate__", null);
            }
            if (Data.IsComputed("DiscountLimitDate__")) {
                Data.SetValue("DiscountLimitDate__", null);
            }
        }
        AP.RestoreComputedPaymentTermsDate = RestoreComputedPaymentTermsDate;
        function ComputeDiscountAmount(companyCode, paymentTerms, netAmount, exchangeRate, setDiscountAmountCallback) {
            var isCreditNote = Lib.AP.IsCreditNote();
            if (!isCreditNote && paymentTerms) {
                var cachedValue = Lib.AP.GetPaymentTerms(companyCode, paymentTerms, queryCallback);
                if (cachedValue === "noResult") {
                    setDiscountAmountCallback("", "", "", "");
                }
                else if (cachedValue) {
                    compute(cachedValue);
                }
            }
            else {
                setDiscountAmountCallback("", "", "", "");
            }
            function queryCallback(result, error) {
                if (error) {
                    Sys.GenericAPI.LogWarning("Error in ComputeDiscountAmount: " + error);
                }
                else if (result.length === 0) {
                    Sys.GenericAPI.LogWarning("No payment terms '" + paymentTerms + "' found for company code " + companyCode);
                    g_paymentTermsCache.Add(companyCode, paymentTerms, "noResult");
                    setDiscountAmountCallback("", "", "", "");
                }
                else {
                    // Add payment terms to cache
                    g_paymentTermsCache.Add(companyCode, paymentTerms, result[0]);
                    compute(result[0]);
                }
            }
            function computeAmounts(record, rateField) {
                var amts = {
                    Amount: "",
                    LocalAmount: ""
                };
                var rate = record[rateField];
                var enableDynamicDiscounting = record.EnableDynamicDiscounting__ === "1";
                if (!rate || isNaN(parseInt(rate, 10))) {
                    Sys.GenericAPI.LogWarning("Could not compute discount or fee amount from payment terms because " + rateField + " is not a number");
                }
                else if (rateField === "DiscountRate__" && enableDynamicDiscounting) {
                    Sys.GenericAPI.LogInfo("'Dynamic discounting' is enabled - don't compute discount amount");
                }
                else {
                    amts.Amount = netAmount * (rate / 100);
                    amts.LocalAmount = amts.Amount * exchangeRate;
                }
                return amts;
            }
            function compute(paymentTermsRecord) {
                var enableDynamicDiscounting = paymentTermsRecord.EnableDynamicDiscounting__ || "0";
                Variable.SetValueAsString("EnableDynamicDiscounting", enableDynamicDiscounting);
                Variable.SetValueAsString("PaymentTermDescription", paymentTermsRecord.Description__);
                Variable.SetValueAsString("PaymentTermDayLimit", paymentTermsRecord.DayLimit__);
                Variable.SetValueAsString("PaymentTermDiscountRate", enableDynamicDiscounting === "1" ? paymentTermsRecord.DiscountRate30Days__ : paymentTermsRecord.DiscountRate__);
                var discounts = computeAmounts(paymentTermsRecord, "DiscountRate__");
                var fees = computeAmounts(paymentTermsRecord, "LatePaymentFeeRate__");
                setDiscountAmountCallback(discounts.Amount, discounts.LocalAmount, fees.Amount, fees.LocalAmount);
            }
        }
        AP.ComputeDiscountAmount = ComputeDiscountAmount;
        function ComputeAndSetBackdatingTargetDate(_processInstance) {
            Lib.AP.ComputeBackdatingTargetDate().Then(function (backdatedDate) {
                var currentSilentChange = _processInstance && _processInstance.GetSilentChange();
                if (_processInstance) {
                    _processInstance.SetSilentChange(true);
                }
                Data.SetValue("PostingDate__", backdatedDate);
                if (_processInstance) {
                    _processInstance.SetSilentChange(currentSilentChange);
                }
            });
        }
        AP.ComputeAndSetBackdatingTargetDate = ComputeAndSetBackdatingTargetDate;
        function ComputeBackdatingTargetDate(_processInstance) {
            return Sys.Helpers.Promise.Create(function (resolve) {
                // The invoice is already posted or the posting date is modified by user --> keep the posting date
                if (!Data.IsNullOrEmpty("ERPInvoiceNumber__") || (!Data.IsComputed("PostingDate__") && !Data.IsNullOrEmpty("PostingDate__"))) {
                    return resolve(Data.GetValue("PostingDate__"), _processInstance);
                }
                var currentSilentChange = _processInstance && _processInstance.GetSilentChange();
                if (_processInstance) {
                    _processInstance.SetSilentChange(true);
                }
                var postingDateReference = Lib.AP.GetPostingDateReference();
                Data.SetInfo("PostingDate__", "");
                if (_processInstance) {
                    _processInstance.SetSilentChange(currentSilentChange);
                }
                if (Sys.Parameters.GetInstance("AP").GetParameter("EnableBackdatingPeriods") === "1") {
                    Lib.AP.GetBackdatingTargetDates(postingDateReference)
                        .Then(function (queryResults) {
                        var customDate = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnComputeBackdatingTargetDate", queryResults);
                        if (customDate !== null) {
                            return resolve(customDate, _processInstance);
                        }
                        if (queryResults.length > 0) {
                            var currentSilentChange_1 = _processInstance && _processInstance.GetSilentChange();
                            if (_processInstance) {
                                _processInstance.SetSilentChange(true);
                            }
                            // First result is selected because results are sorted by priority order
                            Data.SetInfo("PostingDate__", "_PostingDateInfo {0}", Sys.Helpers.Date.Date2DBDate(postingDateReference));
                            if (_processInstance) {
                                _processInstance.SetSilentChange(currentSilentChange_1);
                            }
                            return resolve(new Date(queryResults[0].BackdatingTargetDate__), _processInstance);
                        }
                        return resolve(postingDateReference, _processInstance);
                    })
                        .Catch(function (error) {
                        Log.Error("Error querying the \"AP - BackdatingPeriods__\" table: " + error);
                        return resolve(postingDateReference, _processInstance);
                    });
                }
                else {
                    return resolve(postingDateReference, _processInstance);
                }
            });
        }
        AP.ComputeBackdatingTargetDate = ComputeBackdatingTargetDate;
        function GetBackdatingTargetDates(postingDateReference) {
            var companyCode = Data.GetValue("CompanyCode__");
            var invoiceType = Data.GetValue("InvoiceType__");
            var actualPostingDate = Sys.Helpers.Date.Date2DBDateTime(postingDateReference);
            var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterLesserOrEqual("BackdatingStartDate__", actualPostingDate), Sys.Helpers.LdapUtil.FilterGreaterOrEqual("BackdatingEndDate__", actualPostingDate), Sys.Helpers.LdapUtil.FilterEqualOrEmpty("InvoiceType__", invoiceType), Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode));
            var options = {
                table: "AP - BackdatingPeriods__",
                filter: filter.toString(),
                attributes: ["CompanyCode__", "InvoiceType__", "BackdatingTargetDate__"],
                // Priorize results with Company code filled, then with Invoice type filled
                sortOrder: "CompanyCode__ DESC, InvoiceType__ DESC",
                maxRecords: 10
            };
            return Sys.GenericAPI.PromisedQuery(options);
        }
        AP.GetBackdatingTargetDates = GetBackdatingTargetDates;
        function GetPostingDateReference() {
            if (Sys.Parameters.GetInstance("AP").GetParameter("DefaultPostingDate") === "Invoice date") {
                return Data.GetValue("InvoiceDate__");
            }
            return new Date();
        }
        AP.GetPostingDateReference = GetPostingDateReference;
        function GetFirstOrderOrGoodIssue(fieldname) {
            var value = "";
            var values = GetOrderOrGoodIssueAsArray(fieldname);
            if (values.length > 0) {
                value = values[0];
            }
            return value;
        }
        function TrimOrderOrGoodIssue(fieldname) {
            var values = GetOrderOrGoodIssueAsArray(fieldname);
            var trimValues = [];
            for (var i = 0; i < values.length; i++) {
                values[i] = values[i].trim();
                if (values[i]) {
                    trimValues.push(values[i]);
                }
            }
            Data.SetValue(fieldname, trimValues.join(g_multiValuesSeparator));
        }
        function GetOrderOrGoodIssueAsArray(fieldname, values) {
            if (!values) {
                values = Data.GetValue(fieldname);
            }
            if (values) {
                return values.split(g_multiValuesSeparator);
            }
            return [];
        }
        AP.GetOrderOrGoodIssueAsArray = GetOrderOrGoodIssueAsArray;
        function AddOrderOrGoodIssue(fieldname, value, area) {
            if (typeof value !== "string") {
                area = value;
                value = area.toString();
            }
            var values = GetOrderOrGoodIssueAsArray(fieldname);
            if (values.indexOf(value) === -1) {
                values.push(value);
                var lastArea = Data.GetArea(fieldname);
                // No area management in custom script
                if (Sys.ScriptInfo.IsServer() && lastArea) {
                    Data.SetValue(fieldname, lastArea, values.join(g_multiValuesSeparator));
                    if (area) {
                        area.Highlight(true, fieldname);
                    }
                }
                else if (Sys.ScriptInfo.IsServer() && area) {
                    Data.SetValue(fieldname, area, values.join(g_multiValuesSeparator));
                }
                else {
                    Data.SetValue(fieldname, values.join(g_multiValuesSeparator));
                }
            }
        }
        function GetFirstOrderNumber() {
            return GetFirstOrderOrGoodIssue("OrderNumber__");
        }
        AP.GetFirstOrderNumber = GetFirstOrderNumber;
        function TrimOrderNumbers() {
            TrimOrderOrGoodIssue("OrderNumber__");
        }
        AP.TrimOrderNumbers = TrimOrderNumbers;
        function GetOrderNumbersAsArray(orders) {
            return GetOrderOrGoodIssueAsArray("OrderNumber__", orders);
        }
        AP.GetOrderNumbersAsArray = GetOrderNumbersAsArray;
        function AddOrderNumber(orderNumber, area) {
            AddOrderOrGoodIssue("OrderNumber__", orderNumber, area);
        }
        AP.AddOrderNumber = AddOrderNumber;
        function AddGoodIssue(goodIssue, area) {
            AddOrderOrGoodIssue("GoodIssue__", goodIssue, area);
        }
        AP.AddGoodIssue = AddGoodIssue;
        function IsCreditNote() {
            return Data.GetValue("InvoiceAmount__") < 0;
        }
        AP.IsCreditNote = IsCreditNote;
        function IsSubsequentDebit() {
            var invoiceAmount = Data.GetValue("InvoiceAmount__") || 0;
            return Lib.AP.IsSubsequentDebitCredit() && invoiceAmount >= 0;
        }
        AP.IsSubsequentDebit = IsSubsequentDebit;
        function IsSubsequentCredit() {
            var invoiceAmount = Data.GetValue("InvoiceAmount__") || 0;
            return Lib.AP.IsSubsequentDebitCredit() && invoiceAmount < 0;
        }
        AP.IsSubsequentCredit = IsSubsequentCredit;
        function IsSubsequentDebitCredit() {
            return Data.GetValue("InvoiceType__") === Lib.AP.InvoiceType.PO_INVOICE && Data.GetValue("SubsequentDocument__");
        }
        AP.IsSubsequentDebitCredit = IsSubsequentDebitCredit;
        function GetDefaultAPAmountsPrecision() {
            var currency = Data.GetValue("InvoiceCurrency__");
            if (currency in DEFAULT_PRECISIONS) {
                return DEFAULT_PRECISIONS[currency];
            }
            return DEFAULT_PRECISIONS.DEFAULT;
        }
        AP.GetDefaultAPAmountsPrecision = GetDefaultAPAmountsPrecision;
        function GetAmountPrecision() {
            var amountPrecision = Lib.AP.GetDefaultAPAmountsPrecision();
            var roundingParameters = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetTaxRoundingParameters");
            if (roundingParameters && !isNaN(roundingParameters.precision)) {
                amountPrecision = roundingParameters.precision;
            }
            return amountPrecision;
        }
        AP.GetAmountPrecision = GetAmountPrecision;
        function RoundWithAmountPrecision(amount) {
            var roundingFunc = Sys.Helpers.Round;
            var amountPrecision = Lib.AP.GetDefaultAPAmountsPrecision();
            var roundingParameters = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetTaxRoundingParameters");
            if (roundingParameters) {
                if (typeof roundingParameters.roundingFct === "function") {
                    roundingFunc = roundingParameters.roundingFct;
                }
                if (!isNaN(roundingParameters.precision)) {
                    amountPrecision = roundingParameters.precision;
                }
            }
            return roundingFunc(amount, amountPrecision);
        }
        AP.RoundWithAmountPrecision = RoundWithAmountPrecision;
        function ApplyExchangeRate(amount, exchangeRate, keepPrecision) {
            var currentAmount = amount;
            if (typeof currentAmount === 'string') {
                currentAmount = Number(amount);
            }
            var newAmount = currentAmount * exchangeRate;
            if (keepPrecision) {
                if (newAmount && !isNaN(newAmount)) {
                    return newAmount;
                }
            }
            else {
                return RoundWithDefaultPrecision(newAmount);
            }
            return 0;
        }
        AP.ApplyExchangeRate = ApplyExchangeRate;
        function RoundWithDefaultPrecision(amount) {
            if (typeof amount === 'string') {
                return Sys.Helpers.Round(Number(amount), Lib.AP.GetAmountPrecision());
            }
            return Sys.Helpers.Round(amount, Lib.AP.GetAmountPrecision());
        }
        AP.RoundWithDefaultPrecision = RoundWithDefaultPrecision;
        function ApplyTaxRate(amount, taxRate, multiTaxRates, noRounding) {
            if (noRounding === void 0) { noRounding = false; }
            var taxAmount = 0;
            var taxRates;
            var taxRoundingMode = "";
            if (multiTaxRates) {
                var objJSON = void 0;
                try {
                    objJSON = JSON.parse(multiTaxRates);
                }
                catch (e) {
                    Log.Error("Could not parse the multiTaxRates JSON: ".concat(multiTaxRates));
                }
                if (objJSON.taxRates && objJSON.taxRoundingModes) {
                    taxRates = Array.isArray(objJSON.taxRates) ? objJSON.taxRates : [objJSON.taxRates];
                    taxRoundingMode = objJSON.taxRoundingModes.length ? objJSON.taxRoundingModes[0] : "";
                    if (taxRoundingMode === "Round_Before_Sum") {
                        var taxAdded = 0;
                        for (var _i = 0, taxRates_1 = taxRates; _i < taxRates_1.length; _i++) {
                            var rate = taxRates_1[_i];
                            var roundingNumber = 0;
                            roundingNumber = Sys.Helpers.Round(amount * rate / 100, Math.max(Lib.AP.GetDefaultAPAmountsPrecision(), Lib.AP.GetAmountPrecision()));
                            taxAdded += roundingNumber;
                        }
                        taxAmount = taxAdded;
                    }
                    else {
                        var taxAdded = 0;
                        for (var _a = 0, taxRates_2 = taxRates; _a < taxRates_2.length; _a++) {
                            var rate = taxRates_2[_a];
                            taxAdded += amount * rate / 100;
                        }
                        taxAmount = noRounding ? taxAdded : Sys.Helpers.Round(taxAdded, Math.max(Lib.AP.GetDefaultAPAmountsPrecision(), Lib.AP.GetAmountPrecision()));
                    }
                }
            }
            if (taxRoundingMode === "" && !isNaN(amount)) {
                // Rounding allows for more precision than truncating
                var roundedAmount = noRounding ? amount : Sys.Helpers.Round(amount, Math.max(Lib.AP.GetDefaultAPAmountsPrecision(), Lib.AP.GetAmountPrecision()));
                taxAmount = roundedAmount * taxRate / 100;
            }
            return taxAmount;
        }
        AP.ApplyTaxRate = ApplyTaxRate;
        function GetLineItemCompanyCode(item) {
            var companyCode = item.GetValue("CompanyCode__");
            if (companyCode) {
                return companyCode;
            }
            return Data.GetValue("CompanyCode__");
        }
        AP.GetLineItemCompanyCode = GetLineItemCompanyCode;
        function GetCustomFilterFromCrossCompanyCode(item) {
            return "(|(CompanyCode__=" + Lib.AP.GetLineItemCompanyCode(item) + ")(CompanyCode__=)(!(CompanyCode__=*)))";
        }
        AP.GetCustomFilterFromCrossCompanyCode = GetCustomFilterFromCrossCompanyCode;
        function PostedWithError() {
            return Boolean(Data.GetValue("ERPInvoiceNumber__") && Data.GetValue("ERPPostingError__"));
        }
        AP.PostedWithError = PostedWithError;
        function DraftInERP() {
            return Boolean(Variable.GetValueAsString("DraftInERP") || Lib.AP.PostedWithError());
        }
        AP.DraftInERP = DraftInERP;
        function GetERPManager() {
            return currentERPManager || initERPManager();
        }
        AP.GetERPManager = GetERPManager;
        function GetInvoiceDocument() {
            return getDocument("INVOICE");
        }
        AP.GetInvoiceDocument = GetInvoiceDocument;
        function GetInvoiceExporter() {
            return getDocument("INVOICEEXPORTER");
        }
        AP.GetInvoiceExporter = GetInvoiceExporter;
        function ResetERPManager() {
            if (currentERPManager) {
                currentERPManager.Finalize();
                currentERPManager = null;
                currentDocuments = {};
            }
        }
        AP.ResetERPManager = ResetERPManager;
        function GetInvoiceDocumentLayout() {
            return Lib.AP.GetInvoiceDocument().layout;
        }
        AP.GetInvoiceDocumentLayout = GetInvoiceDocumentLayout;
        function GetVariableAsBoolean(variableName, defaultValue) {
            var variableValue = Variable.GetValueAsString(variableName);
            if (variableValue) {
                return variableValue.toUpperCase() === "TRUE";
            }
            return defaultValue;
        }
        AP.GetVariableAsBoolean = GetVariableAsBoolean;
        function UpdateBalance(computeHeaderFunc, debug) {
            // Compute net amount and tax amount
            var netAmount = 0;
            var taxAmount = computeHeaderFunc();
            var lineItems = Data.GetTable("LineItems__");
            for (var i = 0; i < lineItems.GetItemCount(); i++) {
                netAmount += lineItems.GetItem(i).GetValue("Amount__");
            }
            Data.SetValue("NetAmount__", netAmount);
            Data.SetValue("TaxAmount__", taxAmount);
            GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
            if (debug) {
                Log.Info("TaxAmount__ - updateBalance (header) = " + Data.GetValue("TaxAmount__"));
            }
            // Since we are only extracting or teaching the InvoiceAmount__ field for now set the balance with the invoice amount
            var invoiceAmount = Data.GetValue("InvoiceAmount__");
            if (Sys.Helpers.IsNumeric(invoiceAmount)) {
                Data.SetValue("Balance__", invoiceAmount - netAmount - taxAmount);
            }
        }
        AP.UpdateBalance = UpdateBalance;
        function GetInvoiceTypeList() {
            var invoiceTypes = [Lib.AP.InvoiceType.NON_PO_INVOICE, Lib.AP.InvoiceType.PO_INVOICE];
            if (Lib.AP.IsSupportNonERPOrder()) {
                invoiceTypes.push(Lib.AP.InvoiceType.PO_INVOICE_AS_FI);
            }
            if (Lib.ERP.GetERPName() === "SAP" && Sys.Parameters.GetInstance("AP").GetParameter("enableconsignmentstock") === "1") {
                invoiceTypes.push(Lib.AP.InvoiceType.CONSIGNMENT);
            }
            return invoiceTypes.reduce(function (acc, invoiceType) {
                return acc + invoiceType + "=" + invoiceType + "\r\n";
            }, "").trim();
        }
        AP.GetInvoiceTypeList = GetInvoiceTypeList;
        function GetAvailableDocumentCultures() {
            var cultures = null;
            var availableDocumentCultures = Sys.Parameters.GetInstance("AP").GetParameter("AvailableDocumentCultures");
            if (availableDocumentCultures) {
                cultures = availableDocumentCultures.replace(/ /g, "").split(",");
            }
            if (!cultures || cultures.length === 0) {
                cultures = ["en-US", "en-GB", "fr-FR"];
            }
            return cultures;
        }
        AP.GetAvailableDocumentCultures = GetAvailableDocumentCultures;
        function GetPatterns(fieldPatterns) {
            var patterns = Sys.Parameters.GetInstance("AP").GetParameter(fieldPatterns, "");
            if (patterns) {
                return patterns.split(";");
            }
            return [];
        }
        AP.GetPatterns = GetPatterns;
        function JSONtoXMLasString(rootElement, jsonElement, autoCloseTag) {
            function addAttributes(element) {
                var attributesString = "";
                if (element) {
                    for (var attribute in element.attributes) {
                        if (Object.prototype.hasOwnProperty.call(element.attributes, attribute)) {
                            var attValue = element.attributes[attribute];
                            attributesString += " " + attribute + "=\"" + attValue + "\"";
                        }
                    }
                }
                return attributesString;
            }
            if (typeof autoCloseTag === "undefined") {
                autoCloseTag = true;
            }
            var xmlNode = "";
            if (rootElement) {
                var rootBegin = "";
                var rootEnd = "";
                // construct root tag
                if (typeof rootElement === "object") {
                    if (!rootElement.value) {
                        return xmlNode;
                    }
                    rootBegin = rootEnd = rootElement.value;
                    rootBegin += addAttributes(rootElement);
                }
                else {
                    rootBegin = rootEnd = rootElement;
                }
                // get node value
                var nodeValue = "";
                if (typeof jsonElement === "undefined" || jsonElement === null) {
                    nodeValue = "";
                }
                else if (typeof jsonElement === "object") {
                    if (jsonElement.constructor === Array) {
                        for (var idx = 0; idx < jsonElement.length; idx++) {
                            xmlNode += JSONtoXMLasString(rootElement, jsonElement[idx], autoCloseTag);
                        }
                        return xmlNode;
                    }
                    if (typeof jsonElement.value !== "undefined") {
                        nodeValue += jsonElement.value;
                    }
                    else {
                        for (var key in jsonElement) {
                            // eslint-disable-next-line max-depth
                            if (Object.prototype.hasOwnProperty.call(jsonElement, key)) {
                                // eslint-disable-next-line max-depth
                                if (key !== "attributes") {
                                    var element = jsonElement[key];
                                    nodeValue += JSONtoXMLasString(key, element, autoCloseTag);
                                }
                            }
                        }
                    }
                }
                else {
                    nodeValue = jsonElement.toString();
                }
                // construct xml node
                xmlNode = "<" + rootBegin;
                xmlNode += addAttributes(jsonElement);
                if (!nodeValue && autoCloseTag) {
                    xmlNode += "/>";
                }
                else {
                    xmlNode += ">";
                    xmlNode += nodeValue;
                    xmlNode += "</" + rootEnd + ">";
                }
            }
            return xmlNode;
        }
        AP.JSONtoXMLasString = JSONtoXMLasString;
        function fillCostTypeFromGLAccount(item) {
            var options = {
                table: "P2P - G/L account to Cost type__",
                filter: "(|(CompanyCode__=".concat(Data.GetValue("CompanyCode__"), ")(!(CompanyCode__=*))(CompanyCode__=))"),
                attributes: ["FromGLAccount__", "ToGLAccount__", "CostType__"],
                maxRecords: "FULL_RESULT"
            };
            return Sys.GenericAPI.PromisedQuery(options)
                .Then(function (results) {
                var find = false;
                if (results && results.length > 0) {
                    var glAccount = item.GetValue("GLAccount__");
                    for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                        var result = results_1[_i];
                        if (glAccount <= result.ToGLAccount__ && glAccount >= result.FromGLAccount__) {
                            item.SetValue("CostType__", result.CostType__);
                            find = true;
                            break;
                        }
                    }
                }
                if (!find) {
                    item.SetValue("CostType__", "OpEx");
                }
                return Sys.Helpers.Promise.Resolve(item);
            });
        }
        AP.fillCostTypeFromGLAccount = fillCostTypeFromGLAccount;
        function NotifySDA() {
            var SDARuidex = Variable.GetValueAsString("SDAIdentifier");
            if (SDARuidex && !(Transaction.Read("SDANotified") === "1")) {
                Query.Reset();
                Query.SetFilter("&(RUIDEX=".concat(SDARuidex, ")(State=90)"));
                Query.MoveFirst();
                var eddTransport = Query.MoveNext();
                if (eddTransport) {
                    var vars = eddTransport.GetExternalVars();
                    if (Data.GetActionName() === "Reject" && Data.GetValue("RejectReason__") === "Document is not an invoice") {
                        Log.Info("Notify SDA of routing failure");
                        var SDARejectParams = {
                            "UserName": Data.GetValue("OwnerID"),
                            "Comment": Data.GetValue("Comment__")
                        };
                        vars.AddValue_String("SDARejectParams", JSON.stringify(SDARejectParams), true);
                        eddTransport.ResumeWithAction("RoutingFailed", true);
                        Transaction.Write("SDANotified", "1");
                    }
                    else {
                        // We can go in this code when document is rejected for another reason than 'Document is not an invoice'
                        // When it is a split child/ dispatch chile, then whatever the reject reason,
                        // we consider it a routing success (as if it weren't the split wouldn't've happened)
                        Log.Info("Notify SDA of routing success");
                        eddTransport.ResumeWithAction("RoutingSuccess", true);
                        Transaction.Write("SDANotified", "1");
                    }
                }
            }
        }
        AP.NotifySDA = NotifySDA;
        function getRecognitionStatisticsFromFieldsList(fieldsList, source) {
            if (source === void 0) { source = Data; }
            var statistics = {
                AutomaticallyModifiedFields: 0,
                ManuallyModifiedFields: 0
            };
            if (fieldsList && fieldsList.length > 0) {
                for (var _i = 0, fieldsList_1 = fieldsList; _i < fieldsList_1.length; _i++) {
                    var fieldName = fieldsList_1[_i];
                    var changeType = source.GetChangeType(fieldName);
                    if (changeType === "manualFix" || changeType === "manualFill") {
                        statistics.ManuallyModifiedFields += 1;
                    }
                    else {
                        statistics.AutomaticallyModifiedFields += 1;
                    }
                }
            }
            return statistics;
        }
        AP.getRecognitionStatisticsFromFieldsList = getRecognitionStatisticsFromFieldsList;
        function getRecognitionStatisticsFromFieldsListInTable(tableName, fieldsList) {
            var statistics = {
                AutomaticallyModifiedFields: 0,
                ManuallyModifiedFields: 0
            };
            var table = Data.GetTable(tableName);
            if (table) {
                for (var i = 0; i < table.GetItemCount(); i++) {
                    var currentLine = table.GetItem(i);
                    var statisticsForOneLine = getRecognitionStatisticsFromFieldsList(fieldsList, currentLine);
                    statistics.AutomaticallyModifiedFields += statisticsForOneLine.AutomaticallyModifiedFields;
                    statistics.ManuallyModifiedFields += statisticsForOneLine.ManuallyModifiedFields;
                }
            }
            return statistics;
        }
        AP.getRecognitionStatisticsFromFieldsListInTable = getRecognitionStatisticsFromFieldsListInTable;
        //#region List of readonly database comboxes while in workflow (used to disable checks for approvers)
        AP.UncheckedHeaderFieldsDuringApproval = [
            "CompanyCode__",
            "VendorName__",
            "VendorNumber__",
            "ContractNumber__",
            "ContractNumberDetails__",
            "InvoiceCurrency__",
            "SAPPaymentMethod__",
            "PaymentTerms__",
            "AlternativePayee__",
            "CurrentException__",
            "BusinessArea__"
        ];
        AP.UncheckedLineItemsFieldsDuringApproval = [
            "CompanyCode__",
            "CostCenter__",
            "GLAccount__",
            "TaxCode__",
            "InternalOrder__",
            "WBSElement__",
            "TradingPartner__",
            "BusinessArea__",
            "ProjectCode__",
            "FreeDimension1__",
            "FreeDimension1ID__"
        ];
        //#endregion
        function isProviderCorpayEnabled() {
            return Sys.Parameters.GetInstance("AP").GetParameter("PaymentProvider", "") === Lib.AP.PaymentProviderName.Corpay;
        }
        AP.isProviderCorpayEnabled = isProviderCorpayEnabled;
        function isActionAutoComplete() {
            return Sys.ScriptInfo.IsServer() && Data.GetActionType() === "autocomplete";
        }
        AP.isActionAutoComplete = isActionAutoComplete;
        function GetExtendedVendorAttributes() {
            var customFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetVendorCustomFields");
            if (customFields) {
                var customAttributes_1 = [];
                Sys.Helpers.Array.ForEach(customFields, function (field) {
                    if (!Sys.Helpers.IsEmpty(field.nameInTable)) {
                        customAttributes_1.push(field.nameInTable);
                    }
                });
                return Sys.Helpers.Array.Union(Lib.P2P.TableAttributes.Vendors, customAttributes_1);
            }
            return Lib.P2P.TableAttributes.Vendors;
        }
        AP.GetExtendedVendorAttributes = GetExtendedVendorAttributes;
        function GetBusinessUnitFromCompanyCode(companyCode, managingUsersWithBU) {
            Data.SetValue("BusinessUnit__", "");
            if (managingUsersWithBU) {
                var filter_1 = Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__"));
                Sys.GenericAPI.Query("PurchasingCompanycodes__", filter_1.toString(), ["CompanyCode__"], function (ccRrecords) {
                    if (ccRrecords && ccRrecords.length > 0) {
                        filter_1 = Sys.Helpers.LdapUtil.FilterEqual("FilterValue", companyCode);
                        Sys.GenericAPI.Query("ODBusinessUnitFilters", filter_1.toString(), ["BusinessUnit"], function (records) {
                            if (records && records.length > 0) {
                                Data.SetValue("BusinessUnit__", records[0].BusinessUnit);
                            }
                        }, null, 1, { asAdmin: true, useConstantQueryCache: true });
                    }
                    else {
                        Data.SetError("CompanyCode__", "Field value does not belong to table!");
                    }
                }, null, 1);
            }
        }
        AP.GetBusinessUnitFromCompanyCode = GetBusinessUnitFromCompanyCode;
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
