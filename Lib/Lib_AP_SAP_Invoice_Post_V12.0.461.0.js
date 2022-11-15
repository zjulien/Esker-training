///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_Invoice_Post_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: SAP FI post routines.",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_SAP",
    "Lib_ERP_Invoice_V12.0.461.0",
    "Lib_AP_SAP_Invoice_V12.0.461.0",
    "Lib_AP_SAP_Consignment_V12.0.461.0",
    "Lib_P2P_SAP_Soap_Server_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var Invoice;
            (function (Invoice) {
                var Post;
                (function (Post) {
                    var overInvoicing;
                    function MMAddLine(params, idx, lineItem, itemNumber, itemByPo) {
                        var newItem = null;
                        if (Lib.P2P.InvoiceLineItem.IsPOLineItem(lineItem)) {
                            // Check over invoicing
                            var bLineQuantityOk = lineItem.GetValue("ExpectedQuantity__") >= lineItem.GetValue("Quantity__");
                            var bLineAmountOk = lineItem.GetValue("ExpectedAmount__") >= lineItem.GetValue("Amount__");
                            newItem = Lib.AP.SAP.Invoice.MMAddPOLine(params, lineItem, itemNumber, itemByPo);
                            // If expected quantity or amount changed resulting in an over invoicing => Prevent post and warn the AP clerk
                            if ((bLineQuantityOk && lineItem.GetValue("ExpectedQuantity__") < lineItem.GetValue("Quantity__"))
                                || (bLineAmountOk && lineItem.GetValue("ExpectedAmount__") < lineItem.GetValue("Amount__"))) {
                                Log.Error("PO or GR over invoicing for line #" + (idx + 1));
                                overInvoicing = true;
                            }
                        }
                        else if (Lib.P2P.InvoiceLineItem.IsGLLineItem(lineItem)) {
                            newItem = Lib.AP.SAP.Invoice.MMAddGLLine(params, lineItem, itemNumber);
                        }
                        return newItem;
                    }
                    function InitParameters(sapControl) {
                        var param = Lib.AP.SAP.Invoice.GetNewParameters(false);
                        if (!param.Init(sapControl)) {
                            Lib.AP.SAP.Invoice.FinalizeParameters(param);
                            param = null;
                        }
                        return param;
                    }
                    Post.InitParameters = InitParameters;
                    function CheckCallError(params, RETURN0) {
                        // Check errors returned by BAPI
                        if (Sys.Helpers.SAP.ExtractErrors(RETURN0)) {
                            params.Exception = Sys.Helpers.SAP.GetLastError();
                            params.BapiController.GetBapiManager().RollbackWork();
                            return false;
                        }
                        // Check call exceptions
                        if (params.Exception) {
                            if (!Sys.Helpers.SAP.GetLastError()) {
                                Sys.Helpers.SAP.SetLastError(params.Exception);
                            }
                            params.BapiController.GetBapiManager().RollbackWork();
                            return false;
                        }
                        // Commit transaction
                        return Lib.AP.SAP.Invoice.Post.CommitInvoiceCreation(params);
                    }
                    Post.CheckCallError = CheckCallError;
                    function CommitInvoiceCreation(params) {
                        // Commit transaction
                        Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.beforePost);
                        var commitResult = params.BapiController.GetBapiManager().CommitWork();
                        Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.afterPost);
                        if (!commitResult) {
                            Sys.Helpers.SAP.SetLastError("Commit failed: " + params.BapiController.GetBapiManager().GetLastError());
                            return false;
                        }
                        return true;
                    }
                    Post.CommitInvoiceCreation = CommitInvoiceCreation;
                    // ----------------
                    // MM
                    function MMCreateInvoice(params, docType, blockPayment, returnFI) {
                        if (!docType) {
                            Sys.Helpers.SAP.SetLastError("Accounting document type is missing");
                            return null;
                        }
                        params.Doc_Type = docType;
                        if (blockPayment) {
                            params.Invoice_Payment_Block = Variable.GetValueAsString("InvoicePaymentBlock");
                        }
                        // Process the Document Header
                        if (!Lib.AP.SAP.Invoice.MMHeaderSet(params)) {
                            Log.Error("MMHeaderSet failed");
                            return null;
                        }
                        Lib.AP.SAP.Invoice.MMAddWHT(params);
                        var itemNumberIdx = 1;
                        overInvoicing = false;
                        // Parse line items
                        var lineItems = Data.GetTable("LineItems__");
                        //group itemNumber by Po
                        var itemByPo = {};
                        var idx;
                        for (idx = 0; idx < lineItems.GetItemCount(); idx++) {
                            var line = lineItems.GetItem(idx);
                            var poNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("OrderNumber__"), 10);
                            var poItemNumber = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("ItemNumber__"), 5);
                            var isPresent = false;
                            if (poNumber in itemByPo) {
                                isPresent = true;
                            }
                            if (!isPresent) {
                                itemByPo[poNumber] = [];
                            }
                            if (itemByPo[poNumber].indexOf(poItemNumber) === -1) {
                                itemByPo[poNumber].push(poItemNumber);
                            }
                        }
                        //get the items in the table
                        for (idx = 0; idx < lineItems.GetItemCount(); idx++) {
                            var lineItem = lineItems.GetItem(idx);
                            if (lineItem) {
                                var itemNumber = Sys.Helpers.SAP.BuildItemNumber(itemNumberIdx, 6, 1);
                                // Process the line Items
                                var newItem = MMAddLine(params, idx, lineItem, itemNumber, itemByPo);
                                if (newItem) {
                                    itemNumberIdx++;
                                }
                                else {
                                    Log.Error("Error during line item " + itemNumberIdx + " processing...");
                                    return null;
                                }
                            }
                        }
                        if (overInvoicing) {
                            Sys.Helpers.SAP.SetLastError(Language.Translate("_Error over invoicing detected"));
                        }
                        if (Sys.Helpers.SAP.GetLastError()) {
                            return null;
                        }
                        if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("DumpBAPICalls", false)) {
                            Variable.SetValueAsString("BAPI_INCOMINGINVOICE_Parameters", params.GetBapi("BAPI_INCOMINGINVOICE").GetJsonParameters(false));
                        }
                        // Call the BAPI and retrieve the document Id created
                        Lib.AP.SAP.Invoice.Post.MMCreateInvoiceCallAndCommit(params);
                        var documentIds = {
                            MM: Lib.AP.SAP.Invoice.Post.MMGetDocumentId(params),
                            FI: null
                        };
                        if (documentIds.MM) {
                            Transaction.Write(Lib.ERP.Invoice.transaction.keys.documentId, JSON.stringify(documentIds));
                            Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                            Log.Info("Successfully created vendor Invoice #" + documentIds.MM);
                            if (returnFI) {
                                documentIds.FI = Lib.AP.SAP.Invoice.GetFIDocumentIdFromMMDocumentId(params.GetBapi("RFC_READ_TABLE"), documentIds.MM, Data.GetValue("CompanyCode__"));
                                Transaction.Write(Lib.ERP.Invoice.transaction.keys.documentId, JSON.stringify(documentIds));
                            }
                            return documentIds;
                        }
                        return null;
                    }
                    Post.MMCreateInvoice = MMCreateInvoice;
                    function MMCreateInvoiceCallAndCommit(params) {
                        Sys.Helpers.SAP.SetLastError("");
                        params.Exception = params.GetBapi("BAPI_INCOMINGINVOICE").Call();
                        var RETURN0 = params.GetTable("BAPI_INCOMINGINVOICE", "RETURN");
                        return Lib.AP.SAP.Invoice.Post.CheckCallError(params, RETURN0);
                    }
                    Post.MMCreateInvoiceCallAndCommit = MMCreateInvoiceCallAndCommit;
                    function MMGetDocumentId(params) {
                        if (params.Exception) {
                            Sys.Helpers.SAP.SetLastError(params.Exception);
                            return "";
                        }
                        return params.GetImport("BAPI_INCOMINGINVOICE", "INVOICEDOCNUMBER") + "-" + params.GetImport("BAPI_INCOMINGINVOICE", "FISCALYEAR");
                    }
                    Post.MMGetDocumentId = MMGetDocumentId;
                    // ----------------
                    // FI
                    function FIComputePaymentTerms(params, invoiceRefNumber) {
                        var invPaymentTerms = Lib.AP.SAP.GetInvoicePaymentTerms(params.GetBapi("RFC_READ_TABLE"), invoiceRefNumber, "1");
                        if (invPaymentTerms) {
                            params.Baseline_Date = invPaymentTerms.baseLineDate;
                            params.Invoice_Payment_Terms = invPaymentTerms.paymentTerms;
                            params.Invoice_Payment_Block = invPaymentTerms.paymentBlock;
                            return true;
                        }
                        return false;
                    }
                    Post.FIComputePaymentTerms = FIComputePaymentTerms;
                    function FIProcessLines(params) {
                        var itemNumberIdx = 1;
                        if (params.InvoiceSpecialType === "clearing") {
                            // several vendor lines in clearing
                            itemNumberIdx = Lib.AP.SAP.Invoice.FIAddVendorLinesForClearing(params, itemNumberIdx);
                        }
                        else if (params.InvoiceSpecialType !== "settlement") {
                            // Process the vendor account line item
                            Lib.AP.SAP.Invoice.FIAddVendorLine(params);
                        }
                        Lib.AP.SAP.Invoice.FIAddWHT(params);
                        itemNumberIdx = Lib.AP.SAP.Invoice.FIAddGLLines(params, itemNumberIdx);
                        if (itemNumberIdx > 0) {
                            itemNumberIdx = Lib.AP.SAP.Invoice.Post.FIAddTaxLines(params, itemNumberIdx);
                            if (params.InvoiceSpecialType === "settlement") {
                                // Process the vendor account line item
                                Lib.AP.SAP.Invoice.FIAddVendorLine(params);
                            }
                        }
                        return itemNumberIdx > 0;
                    }
                    Post.FIProcessLines = FIProcessLines;
                    function FIAddTaxLines(params, itemNumberIdx) {
                        /* Manual tax entry	should be handled here */
                        return Lib.AP.SAP.Invoice.FIAddTaxLines(params, itemNumberIdx, !Data.GetValue("CalculateTax__"));
                    }
                    Post.FIAddTaxLines = FIAddTaxLines;
                    function FICreateInvoiceCall(params) {
                        Sys.Helpers.SAP.SetLastError("");
                        params.Exception = params.GetBapi("BAPI_ACC_DOCUMENT").Call();
                        var RETURN0 = params.GetTable("BAPI_ACC_DOCUMENT", "RETURN");
                        return Lib.AP.SAP.Invoice.Post.CheckCallError(params, RETURN0);
                    }
                    Post.FICreateInvoiceCall = FICreateInvoiceCall;
                    function FIGetDocumentType(params) {
                        var Obj_Type = params.GetBapi("BAPI_ACC_DOCUMENT").ImportsPool.Get("OBJ_TYPE");
                        if (!params.Exception && Obj_Type && Obj_Type.length > 0) {
                            return Obj_Type;
                        }
                        return null;
                    }
                    Post.FIGetDocumentType = FIGetDocumentType;
                    function FIGetDocumentId(params) {
                        var docId = null;
                        if (!params.Exception) {
                            var Obj_Key = params.GetBapi("BAPI_ACC_DOCUMENT").ImportsPool.Get("OBJ_KEY");
                            if (Obj_Key && Obj_Key.length > 0) {
                                docId = Obj_Key.substr(0, 10) + "-" + Sys.Helpers.String.SAP.Trim(Obj_Key.substr(10, 4)) + "-" + Obj_Key.substr(14, 4);
                            }
                            else {
                                Sys.Helpers.SAP.SetLastError("No result from BAPI call");
                            }
                        }
                        return docId;
                    }
                    Post.FIGetDocumentId = FIGetDocumentId;
                    function FICreateInvoiceDocument(params, docType, blockPayment) {
                        // Check params
                        if (!docType) {
                            Sys.Helpers.SAP.SetLastError("Accounting document type is missing");
                            return null;
                        }
                        params.Doc_Type = docType;
                        // Process the Document Header
                        if (!Lib.AP.SAP.Invoice.FIHeaderSet(params)) {
                            Log.Error("FIHeaderSet failed");
                            return null;
                        }
                        // Initialize params required to set line items
                        if (!Lib.AP.SAP.Invoice.FIPrepareForLines(Lib.AP.SAP.Invoice.Post, params, null, blockPayment)) {
                            Log.Error("FIPrepareForLines failed");
                            return null;
                        }
                        // Process invoice lines
                        if (!Lib.AP.SAP.Invoice.Post.FIProcessLines(params)) {
                            Log.Error("FIProcessLines failed");
                            return null;
                        }
                        if (Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("DumpBAPICalls", false)) {
                            Variable.SetValueAsString("BAPI_ACC_DOCUMENT_Parameters", params.GetBapi("BAPI_ACC_DOCUMENT").GetJsonParameters(false));
                        }
                        // Call the BAPI and retrieve the document Id created
                        Lib.AP.SAP.Invoice.Post.FICreateInvoiceCall(params);
                        // Save SAP Object type (to reuse it in Lib.AP.SAP.Invoice.UnblockPayment)
                        Variable.SetValueAsString("SAPObjectType", Lib.AP.SAP.Invoice.Post.FIGetDocumentType(params));
                        var documentId = Lib.AP.SAP.Invoice.Post.FIGetDocumentId(params);
                        if (documentId) {
                            if (params.InvoiceSpecialType === "settlement") {
                                if (Lib.AP.SAP.Consignment.SettleAssignment(params, documentId)) {
                                    Lib.AP.SAP.Invoice.Post.CommitInvoiceCreation(params);
                                    Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                                    Log.Info("Successfully posted vendor invoice settlement#" + documentId);
                                }
                                else {
                                    documentId = null;
                                }
                            }
                            else {
                                Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
                                Log.Info("Successfully posted vendor invoice#" + documentId);
                            }
                        }
                        return documentId;
                    }
                    Post.FICreateInvoiceDocument = FICreateInvoiceDocument;
                    function FICreateInvoice(params, docType, blockPayment) {
                        var documentIds = {
                            FI: Lib.AP.SAP.Invoice.Post.FICreateInvoiceDocument(params, docType, blockPayment)
                        };
                        if (documentIds.FI) {
                            Transaction.Write(Lib.ERP.Invoice.transaction.keys.documentId, JSON.stringify(documentIds));
                            return documentIds;
                        }
                        return null;
                    }
                    Post.FICreateInvoice = FICreateInvoice;
                    function CheckDocumentId(documentIds) {
                        if (documentIds) {
                            if (Lib.AP.InvoiceType.isClearingDocument()) {
                                return Lib.AP.SAP.Consignment.CheckDocumentId(documentIds, true);
                            }
                            if (Lib.AP.InvoiceType.isConsignmentInvoice()) {
                                return Lib.AP.SAP.Consignment.CheckDocumentId(documentIds, false);
                            }
                            if (Lib.AP.InvoiceType.isPOInvoice()) {
                                return Boolean(documentIds.MM) && Boolean(documentIds.FI);
                            }
                            return Boolean(documentIds.FI);
                        }
                        return false;
                    }
                    Post.CheckDocumentId = CheckDocumentId;
                    function SAPCreateInvoice(docType, blockPayment) {
                        Sys.Helpers.SAP.SetLastError("");
                        var sapControl = null;
                        if (!Lib.AP.SAP.UsesWebServices()) {
                            sapControl = Sys.Helpers.SAP.GetSAPControl();
                            if (!sapControl) {
                                return null;
                            }
                        }
                        var documentIdsFromTransaction = Transaction.Read(Lib.ERP.Invoice.transaction.keys.documentId);
                        var documentIds = {};
                        try {
                            documentIds = JSON.parse(documentIdsFromTransaction);
                        }
                        catch (e) {
                            // legacy mode;
                            if (Lib.AP.InvoiceType.isPOInvoice()) {
                                documentIds.MM = documentIdsFromTransaction;
                                documentIds.FI = documentIdsFromTransaction;
                            }
                            else {
                                documentIds.FI = documentIdsFromTransaction;
                            }
                        }
                        if (Lib.AP.SAP.Invoice.Post.CheckDocumentId(documentIds)) {
                            Log.Info("Document already exist in SAP");
                            return documentIds;
                        }
                        var params = Lib.AP.SAP.Invoice.Post.InitParameters(sapControl);
                        try {
                            if (documentIds.MM && !documentIds.FI) {
                                //FI invoice number has been entered by the user
                                var ERPInvoiceNumber = Data.GetValue("ERPInvoiceNumber__");
                                if (!ERPInvoiceNumber) {
                                    documentIds = TryGetFIFromMM(documentIds, params);
                                }
                                else {
                                    documentIds.FI = ERPInvoiceNumber;
                                }
                            }
                            else {
                                documentIds = CreateDocumentInSAP(params, documentIds, docType, blockPayment);
                            }
                        }
                        finally {
                            Lib.AP.SAP.Invoice.FinalizeParameters(params);
                        }
                        return documentIds;
                    }
                    Post.SAPCreateInvoice = SAPCreateInvoice;
                    function TryGetFIFromMM(documentIds, params) {
                        documentIds.FI = Lib.AP.SAP.Invoice.GetFIDocumentIdFromMMDocumentId(params.GetBapi("RFC_READ_TABLE"), documentIds.MM, Data.GetValue("CompanyCode__"));
                        Transaction.Write(Lib.ERP.Invoice.transaction.keys.documentId, JSON.stringify(documentIds));
                        return documentIds;
                    }
                    function CreateDocumentInSAP(params, documentIds, docType, blockPayment) {
                        var createInvoiceFunc = Lib.AP.SAP.Invoice.Post.FICreateInvoice;
                        if (Lib.AP.InvoiceType.isClearingDocument()) {
                            createInvoiceFunc = Lib.AP.SAP.Consignment.FICreateClearing;
                        }
                        else if (Lib.AP.InvoiceType.isConsignmentInvoice()) {
                            createInvoiceFunc = Lib.AP.SAP.Consignment.FICreateSettlement;
                        }
                        if (Lib.AP.InvoiceType.isPOInvoice()) {
                            createInvoiceFunc = Lib.AP.SAP.Invoice.Post.MMCreateInvoice;
                        }
                        // Initialize BAPI Parameters
                        if (params) {
                            params.previousDocumentIds = documentIds;
                            documentIds = createInvoiceFunc(params, docType, blockPayment, true);
                            if (!Lib.AP.SAP.Invoice.Post.CheckDocumentId(documentIds)) {
                                // Always set an error if the posting failed
                                var error = Sys.Helpers.SAP.GetLastError();
                                if (!error) {
                                    error = params.BapiController.sapi18n("Error when posting document");
                                    Sys.Helpers.SAP.SetLastError(error);
                                }
                            }
                        }
                        return documentIds;
                    }
                    function TriggerRetryGetFIDocId() {
                        if (Process.GetScriptRetryCount() < Process.GetScriptMaxRetryCount() - 1) {
                            throw new Error("Could not get FI document ID from MM document ID - Script retry count=" + Process.GetScriptRetryCount());
                        }
                        return Language.Translate("Could not get FI document ID from MM document ID");
                    }
                    function CheckDocumentIdsAfterERPPost(documentIds, blockPayment) {
                        if (documentIds) {
                            // populate numbers field
                            if (documentIds.FI) {
                                Data.SetValue("ERPInvoiceNumber__", documentIds.FI);
                            }
                            if (documentIds.MM) {
                                Data.SetValue("ERPMMInvoiceNumber__", documentIds.MM);
                            }
                            if (Lib.AP.SAP.Invoice.Post.CheckDocumentId(documentIds)) {
                                // Posting is all ok
                                if (blockPayment) {
                                    Data.SetValue("ERPPaymentBlocked__", true);
                                }
                                // If not touchless, show document in read only and show popup with document id
                                // these variables are not used when in generation code
                                Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
                                Data.SetValue("MaxRetry", 1);
                            }
                            else if (documentIds.MM && !documentIds.FI) {
                                return TriggerRetryGetFIDocId();
                            }
                        }
                        return Sys.Helpers.SAP.GetLastError();
                    }
                    function ERPPost(blockPayment) {
                        Data.SetValue("ERPPostingError__", "");
                        Sys.Helpers.SAP.SetLastError("");
                        var documentType = Lib.AP.SAP.GetDocumentType();
                        var hasMMButNoFI = Data.GetValue("ERPMMInvoiceNumber__") && !Data.GetValue("ERPInvoiceNumber__");
                        var lastError, documentIds;
                        var rawDocumentIdsFromTransaction = Transaction.Read(Lib.ERP.Invoice.transaction.keys.documentId);
                        var documentIdsFromTransaction = {};
                        try {
                            documentIdsFromTransaction = JSON.parse(rawDocumentIdsFromTransaction);
                        }
                        catch (e) {
                            // legacy mode;
                            if (Lib.AP.InvoiceType.isPOInvoice()) {
                                documentIdsFromTransaction.MM = rawDocumentIdsFromTransaction;
                                documentIdsFromTransaction.FI = rawDocumentIdsFromTransaction;
                            }
                            else {
                                documentIdsFromTransaction.FI = rawDocumentIdsFromTransaction;
                            }
                        }
                        var hasMMButNoFIFromTransaction = documentIdsFromTransaction.MM && !documentIdsFromTransaction.FI;
                        var sapDuplicateCheckActivated = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPDuplicateCheck") === "1";
                        if (!hasMMButNoFI &&
                            !hasMMButNoFIFromTransaction &&
                            sapDuplicateCheckActivated) {
                            // Check duplicate in SAP before posting
                            var sapDuplicate = Lib.AP.SAP.GetDuplicateInvoiceServer(Data.GetValue("CompanyCode__"), Data.GetValue("InvoiceType__"), Data.GetValue("InvoiceNumber__"), Data.GetValue("VendorNumber__"), Data.GetValue("InvoiceDate__"), Data.GetValue("InvoiceAmount__"), Data.GetValue("InvoiceCurrency__"));
                            if (sapDuplicate.length > 0) {
                                lastError = Language.Translate("_SAP Duplicate found", false, sapDuplicate.join(", "));
                            }
                        }
                        if (!lastError) {
                            // FI post for invoice types Non-PO Invoice and PO Invoice (as FI)
                            // MM post for invoice type Po Invoice
                            documentIds = Lib.AP.SAP.Invoice.Post.SAPCreateInvoice(documentType, blockPayment);
                            lastError = CheckDocumentIdsAfterERPPost(documentIds, blockPayment);
                        }
                        if (lastError) {
                            // Set field in error on form if any error occured
                            Data.SetValue("ERPPostingError__", lastError);
                        }
                        return lastError;
                    }
                    Post.ERPPost = ERPPost;
                    function GetProcessedDocumentIndex() {
                        var nbAttach = Attach.GetNbAttach();
                        for (var i = 0; i < nbAttach; i++) {
                            if (Attach.IsProcessedDocument(i)) {
                                return i;
                            }
                        }
                        return 0;
                    }
                    Post.GetProcessedDocumentIndex = GetProcessedDocumentIndex;
                    function AttachURLsOnSAPDoc(sapControl, sapConfigName, objectType, documentId, validationURL) {
                        var attachResult;
                        var useWebServiceMode = Lib.AP.SAP.UsesWebServices();
                        // Attach image URL to the SAP document
                        if (Attach.GetNbAttach() > 0) {
                            var imageURL = validationURL.replace("ManageDocumentsCheck.link", "attach.file");
                            imageURL = imageURL.replace("ruid=", "id=");
                            imageURL = Sys.Helpers.String.AddURLParameter(imageURL, "attachment", Lib.AP.SAP.Invoice.Post.GetProcessedDocumentIndex());
                            var imageURLFromTransaction = Transaction.Read(Lib.ERP.Invoice.transaction.keys.imageUrl);
                            if (imageURLFromTransaction !== imageURL) {
                                if (useWebServiceMode) {
                                    attachResult = Lib.P2P.SAP.Soap.Server.AttachUrlWS(objectType, documentId, imageURL, Lib.AP.SAP.Invoice.GetNewParameters(), "Invoice image");
                                }
                                else {
                                    attachResult = Sys.Helpers.SAP.AttachUrl(sapControl, sapConfigName, objectType, documentId, imageURL, "Invoice image");
                                }
                                if (attachResult) {
                                    Log.Error("Attach image URL Error: " + attachResult);
                                }
                                else {
                                    Transaction.Write(Lib.ERP.Invoice.transaction.keys.imageUrl, imageURL);
                                }
                            }
                            else {
                                Log.Info("Image URL " + imageURL + " has been already attached");
                            }
                        }
                        // Attach form URL to the SAP document
                        var validationURLFromTransaction = Transaction.Read(Lib.ERP.Invoice.transaction.keys.validationUrl);
                        if (validationURLFromTransaction !== validationURL) {
                            if (useWebServiceMode) {
                                attachResult = Lib.P2P.SAP.Soap.Server.AttachUrlWS(objectType, documentId, validationURL, Lib.AP.SAP.Invoice.GetNewParameters(), "Invoice form");
                            }
                            else {
                                attachResult = Sys.Helpers.SAP.AttachUrl(sapControl, sapConfigName, objectType, documentId, validationURL, "Invoice form");
                            }
                            if (attachResult) {
                                Log.Error("Attach form URL Error: " + attachResult);
                            }
                            else {
                                Transaction.Write(Lib.ERP.Invoice.transaction.keys.validationUrl, validationURL);
                            }
                        }
                        else {
                            Log.Info("Validation URL " + validationURL + " has been already attached");
                        }
                    }
                    Post.AttachURLsOnSAPDoc = AttachURLsOnSAPDoc;
                    function ERPAttachURLs() {
                        var objectType = "BKPF";
                        var documentId = Data.GetValue("ERPInvoiceNumber__");
                        var objectTypeMM = "BUS2081";
                        var documentMMId = Data.GetValue("ERPMMInvoiceNumber__");
                        var validationURL = Data.GetValue("ValidationUrl");
                        var sapConfigName = Variable.GetValueAsString("SAPConfiguration");
                        var sapControl = Lib.AP.SAP.UsesWebServices() ? null : Sys.Helpers.SAP.GetSAPControl();
                        if (validationURL) {
                            if (documentMMId && !Sys.Helpers.IsEmpty(documentMMId)) {
                                // Attach on MM document
                                objectType = objectTypeMM;
                                documentId = documentMMId;
                            }
                            Lib.AP.SAP.Invoice.Post.AttachURLsOnSAPDoc(sapControl, sapConfigName, objectType, documentId, validationURL);
                        }
                        else {
                            Log.Error("Validation URL invalid");
                        }
                    }
                    Post.ERPAttachURLs = ERPAttachURLs;
                })(Post = Invoice.Post || (Invoice.Post = {}));
            })(Invoice = SAP.Invoice || (SAP.Invoice = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
