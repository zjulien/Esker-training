///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAPS4Cloud_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: SAP S4 Cloud routines.",
  "require": [
    "Lib_ERP_Invoice_V12.0.461.0",
    "Lib_AP_SAPS4Cloud_Invoice_V12.0.461.0",
    "Sys/Sys_Helpers"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
        * @namespace Lib.AP.SAPS4Cloud
        */
        var SAPS4Cloud;
        (function (SAPS4Cloud) {
            /**
             * @lends Lib.AP.SAPS4Cloud
             */
            SAPS4Cloud.lastError = "";
            SAPS4Cloud.lastHttpError = "";
            function ResetLastError() {
                SAPS4Cloud.lastError = "";
                SAPS4Cloud.lastHttpError = "";
            }
            SAPS4Cloud.ResetLastError = ResetLastError;
            function GetLastError() {
                return SAPS4Cloud.lastError ? SAPS4Cloud.lastError : SAPS4Cloud.lastHttpError;
            }
            SAPS4Cloud.GetLastError = GetLastError;
            // #region MM
            // in seconds
            var GetFIDocumentIdFromMMDocumentId_RetryDelay = 0.5;
            // 10 times max
            var GetFIDocumentIdFromMMDocumentId_MaxNbRetries = 10;
            function GetFIDocumentIdFromMMDocumentId(erpInvoiceDocument, MMDocumentId, companyCode) {
                var FIDocumentId = "";
                var mm = Lib.AP.ParseInvoiceDocumentNumber(MMDocumentId, true);
                if (mm) {
                    var params = {
                        "$top": "10",
                        "$select": "CompanyCode,FiscalYear,AccountingDocument,OriginalReferenceDocument,FinancialAccountType",
                        "$filter": "OriginalReferenceDocument eq '" + mm.documentNumber + mm.fiscalYear + "' and FinancialAccountType eq 'K'"
                    };
                    for (var nbRetries = 0; !FIDocumentId && nbRetries < GetFIDocumentIdFromMMDocumentId_MaxNbRetries; nbRetries++) {
                        // TODO
                        var result = erpInvoiceDocument.WebServiceCall("API_OPLACCTGDOCITEMCUBE_SRV/A_OperationalAcctgDocItemCube", "GET", params, getRequiredHeadersForOData(), "{}");
                        if (result) {
                            var dataJSON = extractDataFromResult(result);
                            if (dataJSON.d.results.length === 1) {
                                FIDocumentId = Lib.AP.FormatInvoiceDocumentNumber(dataJSON.d.results[0].AccountingDocument, dataJSON.d.results[0].FiscalYear, companyCode);
                            }
                        }
                        else {
                            Log.Info("GetFIDocumentIdFromMMDocumentId: retry needed (" + (nbRetries + 1) + "/" + GetFIDocumentIdFromMMDocumentId_MaxNbRetries + "). Sleep " + GetFIDocumentIdFromMMDocumentId_RetryDelay + " seconds.");
                            Process.Sleep(GetFIDocumentIdFromMMDocumentId_RetryDelay);
                        }
                    }
                }
                return FIDocumentId;
            }
            SAPS4Cloud.GetFIDocumentIdFromMMDocumentId = GetFIDocumentIdFromMMDocumentId;
            function parseHttpRequestResponseHeaders(result) {
                var headers = {};
                if (result && result.headers) {
                    result.headers.split("\r\n").reduce(function (previousValues, currentHeader) {
                        var keyValue = currentHeader.split(":");
                        if (keyValue && keyValue.length === 2) {
                            previousValues[keyValue[0].toLowerCase()] = keyValue[1].trim();
                        }
                        return previousValues;
                    }, headers);
                }
                return headers;
            }
            function extractDataFromJSONResult(data) {
                try {
                    return JSON.parse(data);
                }
                catch (e) {
                    Lib.AP.SAPS4Cloud.lastError = "Failed to parse JSON webservice call results: " + e;
                    Log.Error("CreateInvoice - Invalid response: " + data);
                }
                return null;
            }
            function noErrorInSOAPResponse(data) {
                if (data && data.MaximumLogItemSeverityCode > 1) {
                    var errors = data.Logs.reduce(function (errorMessages, currentError) {
                        if (currentError.TypeID) {
                            errorMessages.push("SAP error ".concat(currentError.TypeID, " : ").concat(currentError.Note));
                        }
                        return errorMessages;
                    }, []);
                    Lib.AP.SAPS4Cloud.lastError = errors.join("\r\n");
                }
                else if (!data) {
                    Lib.AP.SAPS4Cloud.lastError = "SAP error : no data in web service call response";
                }
                else {
                    return true;
                }
                return false;
            }
            function noErrorInODATAResponse(data) {
                if (data && data.error) {
                    Lib.AP.SAPS4Cloud.lastError = "SAP error (" + data.error.code + ") : " + data.error.message.value;
                }
                else if (!data || !data.d) {
                    if (!Lib.AP.SAPS4Cloud.lastHttpError) {
                        Lib.AP.SAPS4Cloud.lastError = "SAP error : no data in web service call response";
                    }
                }
                else {
                    return true;
                }
                return false;
            }
            function extractDataFromSOAPResult(data) {
                try {
                    var resultData = {};
                    var confirmation = Process.CreateXMLDOMElement(data);
                    resultData.AccountingDocument = confirmation.selectSingleNode("//JournalEntryCreateConfirmation/AccountingDocument").text;
                    resultData.CompanyCode = confirmation.selectSingleNode("//JournalEntryCreateConfirmation/CompanyCode").text;
                    resultData.FiscalYear = Number(confirmation.selectSingleNode("//JournalEntryCreateConfirmation/FiscalYear").text);
                    var logItemNodes = confirmation.selectNodes("//Log/Item");
                    if (logItemNodes && logItemNodes.length > 0) {
                        resultData.MaximumLogItemSeverityCode = Number(confirmation.selectSingleNode("//JournalEntryCreateConfirmation/Log/MaximumLogItemSeverityCode").text);
                        resultData.Logs = new Array();
                        var _loop_1 = function (i) {
                            var logItemNode = logItemNodes.item(i);
                            var logId = logItemNode.selectSingleNode("TypeID").text;
                            if (!resultData.Logs.some(function (item) {
                                if (item.TypeID === logId) {
                                    return true;
                                }
                                return false;
                            })) {
                                var logItem = {};
                                logItem.TypeID = logId;
                                logItem.SeverityCode = Number(logItemNode.selectSingleNode("SeverityCode").text);
                                logItem.Note = logItemNode.selectSingleNode("Note").text;
                                resultData.Logs.push(logItem);
                            }
                        };
                        for (var i = 0; i < logItemNodes.length; i++) {
                            _loop_1(i);
                        }
                    }
                    return resultData;
                }
                catch (e) {
                    Lib.AP.SAPS4Cloud.lastError = "Failed to load SOAP XML webservice call results: " + e;
                    Log.Error("CreateInvoice - Invalid response: " + data);
                }
                return null;
            }
            function extractDataFromResult(result) {
                if (result && result.data) {
                    var headers = parseHttpRequestResponseHeaders(result);
                    var contentType = "";
                    if (headers["content-type"]) {
                        contentType = headers["content-type"].toLowerCase();
                        if (contentType.indexOf(";") !== -1) {
                            contentType = contentType.split(";")[0];
                        }
                    }
                    switch (contentType.trim()) {
                        case "text/xml":
                            return extractDataFromSOAPResult(result.data);
                        case "application/json":
                            return extractDataFromJSONResult(result.data);
                        default:
                            Lib.AP.SAPS4Cloud.lastError = "Invalid content-type in response header : " + headers["content-type"];
                            break;
                    }
                }
                return null;
            }
            function MMCreateInvoice(erpInvoiceDocument /*, blockPayment: boolean*/) {
                var documentIds = null;
                var params = Lib.AP.SAPS4Cloud.Invoice.MMHeaderSet();
                Lib.AP.SAPS4Cloud.Invoice.MMAddPOLines(params);
                Log.Warn("TODO - Implement WS call and retrieve Invoice number created (or errors) in response");
                Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.beforePost);
                var result = erpInvoiceDocument.WebServiceCall("API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice", "POST", {}, getRequiredHeadersForOData(), params.GetData());
                Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.afterPost);
                Lib.AP.SAPS4Cloud.lastHttpError = erpInvoiceDocument.GetLastWebServiceCallError();
                var dataJSON = extractDataFromResult(result);
                if (!Lib.AP.SAPS4Cloud.lastError && noErrorInODATAResponse(dataJSON)) {
                    documentIds = {
                        FI: null,
                        MM: dataJSON.d.SupplierInvoice + "-" + dataJSON.d.FiscalYear
                    };
                    if (documentIds.MM) {
                        Transaction.Write(Lib.ERP.Invoice.transaction.keys.documentId, JSON.stringify(documentIds));
                        Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                        Log.Info("Successfully created vendor Invoice #" + documentIds.MM);
                        documentIds.FI = Lib.AP.SAPS4Cloud.GetFIDocumentIdFromMMDocumentId(erpInvoiceDocument, documentIds.MM, Data.GetValue("CompanyCode__"));
                        Transaction.Write(Lib.ERP.Invoice.transaction.keys.documentId, JSON.stringify(documentIds));
                        Data.SetValue("ERPInvoiceNumber__", documentIds.FI);
                        Data.SetValue("ERPMMInvoiceNumber__", documentIds.MM);
                        Log.Info("Successfully created vendor Invoice #" + documentIds.MM);
                    }
                }
                return documentIds;
            }
            SAPS4Cloud.MMCreateInvoice = MMCreateInvoice;
            // #endregion MM
            // #region FI
            function FIProcessLines(erpInvoiceDocument, params, blockPayment) {
                var itemNumberIdx = 1;
                Lib.AP.SAPS4Cloud.Invoice.FIAddVendorLine(params, blockPayment);
                Lib.AP.SAPS4Cloud.Invoice.FIAddWHT(params);
                itemNumberIdx = Lib.AP.SAPS4Cloud.Invoice.FIAddGLLines(params, itemNumberIdx);
                if (itemNumberIdx > 0) {
                    itemNumberIdx = Lib.AP.SAPS4Cloud.Invoice.FIAddTaxLines(erpInvoiceDocument, params, itemNumberIdx);
                }
                return itemNumberIdx > 0;
            }
            SAPS4Cloud.FIProcessLines = FIProcessLines;
            function FICreateInvoiceCall(erpInvoiceDocument, params) {
                Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.beforePost);
                var nowAsISOString = new Date().toISOString();
                var SOAPRoot = {
                    attributes: {
                        "xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
                        "xmlns:sfin": "http://sap.com/xi/SAPSCORE/SFIN"
                    },
                    value: "soapenv:Envelope"
                };
                var SOAPEnvelope = {
                    "soapenv:Header": {},
                    "soapenv:Body": {
                        "sfin:JournalEntryBulkCreateRequest": {
                            "MessageHeader": {
                                "CreationDateTime": nowAsISOString
                            },
                            "JournalEntryCreateRequest": {
                                "MessageHeader": {
                                    "CreationDateTime": nowAsISOString
                                },
                                "JournalEntry": params.WSParams
                            }
                        }
                    }
                };
                var xmlBody = Lib.AP.JSONtoXMLasString(SOAPRoot, SOAPEnvelope);
                var result = erpInvoiceDocument.WebServiceCall("journalentrycreaterequestconfi", "POST", {
                //"sap-client": 100
                }, {
                    "Content-Type": "text/xml"
                }, xmlBody);
                Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.afterPost);
                return result;
            }
            SAPS4Cloud.FICreateInvoiceCall = FICreateInvoiceCall;
            function FIGetDocumentId(soapData) {
                var docId = null;
                if (soapData.AccountingDocument &&
                    soapData.FiscalYear &&
                    soapData.CompanyCode) {
                    docId = soapData.AccountingDocument + "-" +
                        soapData.CompanyCode + "-" +
                        soapData.FiscalYear;
                }
                return docId;
            }
            function FIValidateWSParams_recursive(wsParam, reference, prefix, result) {
                // For each key in current sop data json object
                for (var key in wsParam) {
                    // If and only if the object to validate is also defined in the reference object
                    if (Object.prototype.hasOwnProperty.call(wsParam, key) &&
                        Object.prototype.hasOwnProperty.call(reference, key)) {
                        var key_prefixed = prefix ? prefix + "/" + key : key;
                        // If the current type is an array
                        // Do a recursive call to validate the structure deeper
                        if (reference[key].type &&
                            reference[key].type === "array" &&
                            reference[key].innerObject &&
                            Array.isArray(wsParam[key])) {
                            for (var i = 0; i < wsParam[key].length; ++i) {
                                Lib.AP.SAPS4Cloud.FIValidateWSParams_recursive(wsParam[key][i], reference[key].innerObject, key_prefixed + "[" + i + "]", result);
                            }
                            continue;
                        }
                        if (reference[key].type &&
                            reference[key].type === "object" &&
                            reference[key].innerObject) {
                            Lib.AP.SAPS4Cloud.FIValidateWSParams_recursive(wsParam[key], reference[key].innerObject, key_prefixed, result);
                            continue;
                        }
                        // If the current key is limited in size and the value is greater than the limit
                        if (wsParam[key] &&
                            reference[key].maxSize &&
                            wsParam[key].length > reference[key].maxSize) {
                            if (reference[key].errorCallback) {
                                reference[key].errorCallback(key_prefixed, key, wsParam, reference, result);
                            }
                            else {
                                result.push("Field '" + key_prefixed + "' with associated value : '" + wsParam[key] + "', size (" + wsParam[key].length + ") is greater than limit " + reference[key].maxSize);
                            }
                        }
                        if (wsParam[key] &&
                            wsParam[key].match &&
                            reference[key].format) {
                            var regexResult = wsParam[key].match(reference[key].format);
                            if (!regexResult || regexResult.length < 1) {
                                if (reference[key].errorCallback) {
                                    reference[key].errorCallback(key_prefixed, key, wsParam, reference, result);
                                }
                                else {
                                    result.push("Field '" + key_prefixed + "' with associated value : '" + wsParam[key] + "', does not match format " + reference[key].format);
                                }
                            }
                        }
                    }
                }
                return result;
            }
            SAPS4Cloud.FIValidateWSParams_recursive = FIValidateWSParams_recursive;
            SAPS4Cloud.FIValidateWSParamsReference = {
                OriginalReferenceDocumentType: { maxSize: 5 },
                OriginalReferenceDocument: { maxSize: 20 },
                OriginalReferenceDocumentLogicalSystem: { maxSize: 10 },
                OriginalPredecessorRefDocument: { maxSize: 20 },
                BusinessTransactionType: { maxSize: 4 },
                AccountingDocumentType: { maxSize: 5 },
                CreatedByUser: {
                    maxSize: 12,
                    errorCallback: function (key_prefixed, key, wsParam, reference /*, result: Array<string>*/) {
                        var shortenedUserName = wsParam[key].substr(0, reference[key].maxSize);
                        Log.Error("CreatedByUser " + wsParam[key] + " is too long for the webservice call, shortened to " + shortenedUserName);
                        wsParam[key] = shortenedUserName;
                    }
                },
                CompanyCode: { maxSize: 4 },
                DocumentDate: { maxSize: 10, format: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
                PostingDate: { maxSize: 10, format: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
                DocumentReferenceID: { maxSize: 16 },
                DocumentHeaderText: { maxSize: 25 },
                CreditorItem: {
                    type: "array",
                    innerObject: {
                        ReferenceDocumentItem: { maxSize: 10 },
                        Creditor: { maxSize: 10 },
                        AssignmentReference: { maxSize: 18 },
                        DocumentItemText: { maxSize: 50 },
                        BusinessPlace: { maxSize: 4 },
                        AmountInTransactionCurrency: {
                            type: "object",
                            innerObject: {
                                attribute: { maxSize: 3 },
                                value: {
                                    maxSize: 29,
                                    format: "^[-]?[0-9]{1,22}[.]?[0-9]{0,6}$"
                                }
                            }
                        },
                        DebitCreditCode: { maxSize: 1 },
                        PaymentMethod: { maxSize: 1 },
                        PaymentBlockingReason: { maxSize: 2 },
                        AlternativePayee: { maxSize: 10 }
                    }
                },
                Item: {
                    type: "array",
                    innerObject: {
                        ReferenceDocumentItem: { maxSize: 10 },
                        CompanyCode: { maxSize: 4 },
                        GLAccount: { maxSize: 10 },
                        DocumentItemText: { maxSize: 50 },
                        AssignmentReference: { maxSize: 18 },
                        TradingPartner: { maxSize: 6 },
                        AmountInTransactionCurrency: {
                            type: "object",
                            innerObject: {
                                attribute: { maxSize: 3 },
                                value: {
                                    maxSize: 29,
                                    format: "^[-]?[0-9]{1,22}[.]?[0-9]{0,6}$"
                                }
                            }
                        },
                        DebitCreditCode: { maxSize: 1 },
                        AccountAssignment: {
                            type: "array",
                            innerObject: {
                                CostCenter: { maxSize: 10 },
                                WBSElement: { maxSize: 2 },
                                FunctionalArea: { maxSize: 16 }
                            }
                        }
                    }
                }
            };
            function FIValidateWSParams(wsParam) {
                var errors = Lib.AP.SAPS4Cloud.FIValidateWSParams_recursive(wsParam, Lib.AP.SAPS4Cloud.FIValidateWSParamsReference, null, []);
                if (errors && errors.length > 0) {
                    return errors.join("\n");
                }
                return null;
            }
            SAPS4Cloud.FIValidateWSParams = FIValidateWSParams;
            function FICreateInvoiceDocument(erpInvoiceDocument, blockPayment) {
                var FIDocNumber = null;
                var params = Lib.AP.SAPS4Cloud.Invoice.FIHeaderSet();
                // if (!Lib.AP.SAP.Invoice.FIPrepareForLines(Lib.AP.SAP.Invoice.Post, params, null, blockPayment))
                // Process invoice lines
                if (!Lib.AP.SAPS4Cloud.FIProcessLines(erpInvoiceDocument, params, blockPayment)) {
                    Log.Error("FIProcessLines failed");
                    return null;
                }
                var errors = Lib.AP.SAPS4Cloud.FIValidateWSParams(params.WSParams);
                if (errors) {
                    Log.Error("FIValidateWSParams failed");
                    Lib.AP.SAPS4Cloud.lastError = errors;
                    return null;
                }
                // Call the WebService
                var result = Lib.AP.SAPS4Cloud.FICreateInvoiceCall(erpInvoiceDocument, params);
                Lib.AP.SAPS4Cloud.lastHttpError = erpInvoiceDocument.GetLastWebServiceCallError();
                var dataJSON = extractDataFromResult(result);
                if (!Lib.AP.SAPS4Cloud.lastError && noErrorInSOAPResponse(dataJSON)) {
                    FIDocNumber = FIGetDocumentId(dataJSON);
                }
                Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                return FIDocNumber;
            }
            SAPS4Cloud.FICreateInvoiceDocument = FICreateInvoiceDocument;
            function FICreateInvoice(erpInvoiceDocument, blockPayment) {
                var documentIds = {
                    FI: Lib.AP.SAPS4Cloud.FICreateInvoiceDocument(erpInvoiceDocument, blockPayment)
                };
                if (documentIds.FI) {
                    Transaction.Write(Lib.ERP.Invoice.transaction.keys.documentId, JSON.stringify(documentIds));
                    Data.SetValue("ERPInvoiceNumber__", documentIds.FI);
                    return documentIds;
                }
                return null;
            }
            SAPS4Cloud.FICreateInvoice = FICreateInvoice;
            // #endregion FI
            // #region Post invoice
            function CheckDocumentId(documentIds) {
                if (documentIds) {
                    if (Lib.AP.InvoiceType.isPOInvoice()) {
                        return Boolean(documentIds.MM);
                    }
                    return Boolean(documentIds.FI);
                }
                return false;
            }
            SAPS4Cloud.CheckDocumentId = CheckDocumentId;
            function SAPCreateInvoice(erpInvoiceDocument, blockPayment) {
                var documentIdsFromTransaction = Transaction.Read(Lib.ERP.Invoice.transaction.keys.documentId);
                var documentIds = {};
                try {
                    documentIds = JSON.parse(documentIdsFromTransaction);
                }
                catch (e) {
                    // legacy mode;
                    if (Lib.AP.InvoiceType.isPOInvoice()) {
                        documentIds.MM = documentIdsFromTransaction;
                    }
                    else {
                        documentIds.FI = documentIdsFromTransaction;
                    }
                }
                if (Lib.AP.SAPS4Cloud.CheckDocumentId(documentIds)) {
                    Log.Info("Document already exist in SAP");
                    return documentIds;
                }
                var createInvoiceFunc = Lib.AP.SAPS4Cloud.FICreateInvoice;
                if (Lib.AP.InvoiceType.isPOInvoice()) {
                    createInvoiceFunc = Lib.AP.SAPS4Cloud.MMCreateInvoice;
                }
                documentIds = createInvoiceFunc(erpInvoiceDocument, blockPayment);
                if (!Lib.AP.SAPS4Cloud.CheckDocumentId(documentIds)) {
                    // Always set an error if the posting failed
                }
                return documentIds;
            }
            SAPS4Cloud.SAPCreateInvoice = SAPCreateInvoice;
            function ERPPost(erpInvoiceDocument, blockPayment) {
                Lib.AP.SAPS4Cloud.ResetLastError();
                // FI post for invoice types Non-PO Invoice and PO Invoice (as FI)
                // MM post for invoice type Po Invoice
                var documentIds = Lib.AP.SAPS4Cloud.SAPCreateInvoice(erpInvoiceDocument, blockPayment);
                if (Lib.AP.SAPS4Cloud.GetLastError()) {
                    // Set field in error on form if any error occured
                    Data.SetValue("ERPPostingError__", Lib.AP.SAPS4Cloud.GetLastError());
                }
                if (documentIds) {
                    Data.SetValue("ERPPostingError__", "");
                    // populate numbers field
                    if (documentIds.FI) {
                        Data.SetValue("ERPInvoiceNumber__", documentIds.FI);
                    }
                    if (documentIds.MM) {
                        Data.SetValue("ERPMMInvoiceNumber__", documentIds.MM);
                    }
                    if (Lib.AP.SAPS4Cloud.CheckDocumentId(documentIds)) {
                        // if posting is all ok
                        if (blockPayment) {
                            Data.SetValue("ERPPaymentBlocked__", true);
                        }
                        //if not touchless, show document in read only and show popup with document id
                        //these variables are not used when in generation code
                        Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
                        Data.SetValue("MaxRetry", 1);
                    }
                }
                return Lib.AP.SAPS4Cloud.GetLastError();
            }
            SAPS4Cloud.ERPPost = ERPPost;
            // #endregion Post invoice
            // #region Get payments
            function GetPayments(erpInvoiceDocument, params) {
                var result = erpInvoiceDocument.WebServiceCall("API_OPLACCTGDOCITEMCUBE_SRV/A_OperationalAcctgDocItemCube", "GET", params, getRequiredHeadersForOData(), "{}");
                if (result) {
                    var dataJSON = extractDataFromResult(result);
                    return dataJSON ? dataJSON.d.results : null;
                }
                return null;
            }
            SAPS4Cloud.GetPayments = GetPayments;
            // #endregion Get payments
            function ERPAttachURLs(erpInvoiceDocument, objectType, documentID, url, attachName) {
                var ATTACHURL_API = "API_CV_ATTACHMENT_SRV/CreateUrlAsAttachment";
                var ATTACHURL_METHOD = "POST";
                var ATTACHURL_PARAMETERS = {
                    SemanticObject: "",
                    LinkedSAPObjectKey: documentID,
                    BusinessObjectTypeName: objectType,
                    Url: url,
                    UrlDescription: attachName,
                    MIMEType: "text/url"
                };
                var response = erpInvoiceDocument.WebServiceCall(ATTACHURL_API, ATTACHURL_METHOD, ATTACHURL_PARAMETERS, getRequiredHeadersForOData(), null);
                if (response.status !== 200) {
                    return response.lastErrorMessage || "unexpected error";
                }
                return "";
            }
            SAPS4Cloud.ERPAttachURLs = ERPAttachURLs;
            function getRequiredHeadersForOData() {
                var headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                };
                if (SAPS4Cloud.CSRFToken) {
                    headers[CSRFTokenLabel] = SAPS4Cloud.CSRFToken;
                }
                return headers;
            }
            var CSRFTokenLabel = "X-CSRF-Token";
            function extractCSRFToken(wsResult) {
                var headers = wsResult.headers ? wsResult.headers.split("\r\n") : [];
                for (var i = 0; i < headers.length; i++) {
                    var elt = headers[i].split(":");
                    if (elt.shift().toLowerCase() === CSRFTokenLabel.toLowerCase()) {
                        return elt.shift();
                    }
                }
                return "";
            }
            /**
             * Return the value for X-CSRF-Token in headers parameters.
             * Manage the case insensitve search
             * @memberof Lib.AP.SAPS4Cloud
             * @param {{ Array.<string>: string }} headers
             * @returns {string}
             */
            function getHeaderValue(headers, searchValue) {
                if (!headers || !searchValue) {
                    return "";
                }
                if (searchValue.toLowerCase) {
                    searchValue = searchValue.toLowerCase();
                }
                for (var p in headers) {
                    if (p && p.toLowerCase() === searchValue) {
                        return headers[p];
                    }
                }
                return "";
            }
            /**
             * For OData call (header contains Content-Type application/json), add the
             * X-CSRF-Token to the headers if none is provided
             * @memberof Lib.AP.SAPS4Cloud
             * @export
             * @param {HttpRequestParam} parameters
             * @returns {void}
             */
            function addCSRFToken(parameters, erpInvoice) {
                // A token was already assign to the header
                if (getHeaderValue(parameters.headers, CSRFTokenLabel)) {
                    return;
                }
                // This is not a OData call
                if (getHeaderValue(parameters.headers, "Content-Type") !== "application/json") {
                    return;
                }
                // Only call a Fetch if the CSRF token is undefined
                if (!SAPS4Cloud.CSRFToken) {
                    var tokenParameters = Sys.Helpers.Clone(parameters);
                    tokenParameters.headers[CSRFTokenLabel] = "Fetch";
                    tokenParameters.method = "GET";
                    if (tokenParameters.url) {
                        if (tokenParameters.url.indexOf("?") > 0) {
                            tokenParameters.url += "&$top=0";
                        }
                        else {
                            tokenParameters.url += "?$top=0";
                        }
                    }
                    tokenParameters.data = "";
                    var ws = Process.CreateHttpRequest();
                    var result = ws.Call(tokenParameters);
                    var retrievedToken = extractCSRFToken(result);
                    if (!retrievedToken) {
                        erpInvoice.SetLastError(result);
                        return;
                    }
                    SAPS4Cloud.CSRFToken = retrievedToken;
                }
                parameters.headers[CSRFTokenLabel] = SAPS4Cloud.CSRFToken;
            }
            SAPS4Cloud.addCSRFToken = addCSRFToken;
        })(SAPS4Cloud = AP.SAPS4Cloud || (AP.SAPS4Cloud = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
