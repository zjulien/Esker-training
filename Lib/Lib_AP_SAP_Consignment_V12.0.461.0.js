///#GLOBALS Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_Consignment_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: SAP consignment routines.",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_SAP_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var Consignment;
            (function (Consignment) {
                // #region private
                var AreDocumentsReadyForClearing_NbRetries = 10;
                var AreDocumentsReadyForClearing_RetryDelay = 1;
                function AreDocumentsReadyForClearing(params, clearing, documents) {
                    var found = false;
                    var expectedResult = 0;
                    if (clearing && clearing.isFI) {
                        // filter on last line added to clearing document
                        var buzei = (Data.GetTable("LineItems__").GetItemCount() + 1).toString();
                        buzei = Sys.Helpers.String.PadLeft(buzei, "0", 3);
                        var filter = "( BUKRS = '" + clearing.companyCode + "' AND GJAHR = '" + clearing.fiscalYear + "'\n";
                        filter += " AND BELNR = '" + clearing.documentNumber + "' AND BUZEI = '" + buzei + "' )\n";
                        expectedResult++;
                        // loop on different settlement document to clear
                        for (var doc in documents) {
                            if (Object.prototype.hasOwnProperty.call(documents, doc)) {
                                if (documents[doc].isFI) {
                                    filter += " OR ( BUKRS = '" + documents[doc].companyCode + "' AND GJAHR = '" + documents[doc].fiscalYear + "'\n";
                                    filter += " AND BELNR = '" + documents[doc].documentNumber + "' AND BUZEI = '001' )\n";
                                    expectedResult++;
                                }
                            }
                        }
                        for (var nbRetries = 0; !found && nbRetries < AreDocumentsReadyForClearing_NbRetries; nbRetries++) {
                            var results = Sys.Helpers.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "BSIK", "BELNR|GJAHR", filter, 100, 0, false, { "useCache": false });
                            found = results && results.length === expectedResult;
                            if (!found) {
                                Log.Info("AreDocumentsReadyForClearing: retry needed (" + (nbRetries + 1) + "/" + AreDocumentsReadyForClearing_NbRetries + "). Sleep " + AreDocumentsReadyForClearing_RetryDelay + " second(s).");
                                Process.Sleep(AreDocumentsReadyForClearing_RetryDelay);
                            }
                        }
                    }
                    return found;
                }
                function AddGoodIssueLine(params, docNumber, companyCode, fiscalYear, line) {
                    if (params && docNumber && companyCode && fiscalYear && line && Lib.P2P.InvoiceLineItem.IsConsignmentLineItem(line)) {
                        var goodIssue = line.GetValue("GoodIssue__");
                        var assignment = line.GetValue("Assignment__");
                        var goodIssueFiscalYear = void 0;
                        if (assignment && assignment.length >= 4) {
                            goodIssueFiscalYear = assignment.substr(assignment.length - 4, 4);
                        }
                        var itemNumber = line.GetValue("ItemNumber__");
                        // T_RKWA
                        var trkwa = params.GetTable("Z_ESK_UPDATE_RKWA", "T_RKWA").AddNew();
                        //fill in key elements
                        trkwa.SetValue("BUKRS", companyCode);
                        trkwa.SetValue("MBLNR", goodIssue);
                        trkwa.SetValue("MJAHR", goodIssueFiscalYear);
                        trkwa.SetValue("ZEILE", itemNumber);
                        //fill in values to set during settlement
                        trkwa.SetValue("BELNR", docNumber);
                        trkwa.SetValue("GJAHR", fiscalYear);
                        trkwa.SetValue("BUZEI", itemNumber);
                        return true;
                    }
                    return false;
                }
                // #endregion
                // #region extraction
                function FillLinesFromGI(details) {
                    var result = { newLines: 0, updatedLines: 0, linesProcessed: [] };
                    if (details) {
                        for (var i = 0; i < details.length; i++) {
                            var currentSettlement = Data.GetValue("ERPInvoiceNumber__");
                            var addLine = true;
                            var status = details[i].STATUS;
                            var settlement = Lib.AP.FormatInvoiceDocumentNumber(details[i].BELNR, details[i].GJAHR, details[i].BUKRS);
                            if (currentSettlement) {
                                addLine = settlement === currentSettlement && status === "01";
                            }
                            else if (status === "01" && settlement) {
                                addLine = Data.GetTable("LineItems__").GetItemCount() === 0 || (Data.GetTable("LineItems__").GetItemCount() === 1 &&
                                    !Data.GetTable("LineItems__").GetItem(0).GetValue("GoodIssue__"));
                                if (addLine) {
                                    Data.SetValue("ERPInvoiceNumber__", settlement);
                                }
                            }
                            if (addLine) {
                                var netAmount = parseFloat(details[i].WRBTR) - parseFloat(details[i].NAVNW);
                                var newItem = Lib.AP.UpdateOrAddPOLine({
                                    type: "Consignment",
                                    goodIssue: details[i].MBLNR,
                                    assignment: details[i].MBLNR + details[i].MJAHR,
                                    itemNumber: details[i].ZEILE,
                                    vendorNumber: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(details[i].LIFNR),
                                    partNumber: details[i].MATNR,
                                    taxCode: details[i].MWSKZ,
                                    businessArea: details[i].GSBER,
                                    glAccount: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(details[i].HKONT),
                                    amount: netAmount,
                                    quantity: parseFloat(details[i].BSTMG),
                                    openAmount: netAmount,
                                    openQuantity: parseFloat(details[i].BSTMG),
                                    expectedAmount: netAmount,
                                    expectedQuantity: parseFloat(details[i].BSTMG)
                                }, false);
                                if (newItem.updated === true) {
                                    result.updatedLines++;
                                }
                                else if (newItem.added === true) {
                                    result.newLines++;
                                }
                                result.linesProcessed.push(newItem.item);
                            }
                        }
                    }
                    return result;
                }
                function ValidateExtractedGoodIssues(goodIssuesCandidates, searchVendorNumber) {
                    if (!goodIssuesCandidates) {
                        return false;
                    }
                    var found = false;
                    var params = Lib.AP.SAP.PurchaseOrder.GetBapiParameters();
                    var goodIssues = [];
                    var candidateIdx = 0;
                    // loop through candidates remove duplicates
                    while (candidateIdx < goodIssuesCandidates.length) {
                        found = false;
                        var goodIssuesCandidate = goodIssuesCandidates[candidateIdx];
                        var goodIssue = goodIssuesCandidate.standardStringValue;
                        if (goodIssues.indexOf(goodIssue) === -1) {
                            goodIssues.push(goodIssue);
                            var currentYear = new Date().getFullYear();
                            var previousYear = new Date().getFullYear() - 1;
                            var fields = "MBLNR|MJAHR|ZEILE|STATUS|BLDAT|BUDAT|BUKRS|SOBKZ|LIFNR|WERKS|MATNR|SHKZG|GSBER|BWAER|WRBTR|BSTME|BSTMG|HKONT|MWSKZ|BELNR|GJAHR|BUZEI|NAVNW";
                            var filter = "MBLNR = '" + goodIssue + "' \n AND ( MJAHR = '" + currentYear + "' OR MJAHR = '" + previousYear + "' ) \n AND BUKRS = '" + Data.GetValue("CompanyCode__") + "'";
                            var results = Sys.Helpers.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "RKWA", fields, filter, 100, 0, false, { "useCache": false });
                            if (results && results.length > 0) {
                                found = true;
                                goodIssuesCandidate.giDetails = results;
                            }
                            else {
                                Log.Info("- discarded GI#" + goodIssue + " (not found in SAP).");
                            }
                        }
                        if (found) {
                            candidateIdx++;
                        }
                        else {
                            goodIssuesCandidates.splice(candidateIdx, 1);
                        }
                    }
                    if (goodIssuesCandidates.length > 0) {
                        found = true;
                        for (var i = 0; i < goodIssuesCandidates.length; i++) {
                            var highlightColor_Border = 0xFFFFFF;
                            var highlightColor_Background = 0xFFCC00;
                            // Set order number
                            Lib.AP.AddGoodIssue(goodIssuesCandidates[i].standardStringValue, goodIssuesCandidates[i].area);
                            var vendorFoundOnThisGI = false;
                            var poVendorNumber = goodIssuesCandidates[i].giDetails[0].LIFNR;
                            if (!Data.GetValue("VendorNumber__") && poVendorNumber) {
                                Log.Info("Set vendor according to PO number: " + poVendorNumber);
                                Data.SetValue("VendorNumber__", Sys.Helpers.String.SAP.TrimLeadingZeroFromID(poVendorNumber));
                                // Call searchVendorNumber to fill vendor fields from number
                                searchVendorNumber();
                                vendorFoundOnThisGI = true;
                            }
                            // Add corresponding line items
                            FillLinesFromGI(goodIssuesCandidates[i].giDetails);
                            // Highlight order numbers on the document
                            if (goodIssuesCandidates[i].area && vendorFoundOnThisGI) {
                                goodIssuesCandidates[i].area.Highlight(true, highlightColor_Background, highlightColor_Border, "VendorNumber__");
                                goodIssuesCandidates[i].area.Highlight(true, highlightColor_Background, highlightColor_Border, "VendorName__");
                            }
                        }
                    }
                    else {
                        Log.Info("No valid good issue found in ESK.SAP...");
                    }
                    return found;
                }
                Consignment.ValidateExtractedGoodIssues = ValidateExtractedGoodIssues;
                // #endregion extraction
                function CheckDocumentId(documentIds, forClearing) {
                    var res = Boolean(documentIds.FI);
                    if (forClearing) {
                        res = res && documentIds.Cleared;
                    }
                    return res;
                }
                Consignment.CheckDocumentId = CheckDocumentId;
                function SettleAssignment(params, documentId) {
                    var doc = Lib.AP.ParseInvoiceDocumentNumber(documentId, true);
                    if (doc && doc.isFI) {
                        var lineItems = Data.GetTable("LineItems__");
                        var goodIssueAdded = 0;
                        for (var idx = 0; idx < lineItems.GetItemCount(); idx++) {
                            var glLine = lineItems.GetItem(idx);
                            if (AddGoodIssueLine(params, doc.documentNumber, doc.companyCode, doc.fiscalYear, glLine)) {
                                goodIssueAdded++;
                            }
                        }
                        if (goodIssueAdded > 0) {
                            params.Exception = params.GetBapi("Z_ESK_UPDATE_RKWA").Call();
                            var RETURNS = params.GetTable("Z_ESK_UPDATE_RKWA", "RETURN");
                            // Check errors returned by BAPI
                            return !Sys.Helpers.SAP.ExtractErrors(RETURNS);
                        }
                        Log.Error("No line item have good issue to be settled");
                    }
                    return false;
                }
                Consignment.SettleAssignment = SettleAssignment;
                function ClearDocuments(params, clearingDoc, docsToClear) {
                    if (clearingDoc && docsToClear) {
                        var clearing = Lib.AP.ParseInvoiceDocumentNumber(clearingDoc, true);
                        var toClear = {};
                        for (var docToClear in docsToClear) {
                            if (Object.prototype.hasOwnProperty.call(docsToClear, docToClear)) {
                                toClear[docToClear] = Lib.AP.ParseInvoiceDocumentNumber(docToClear, true);
                            }
                        }
                        if (AreDocumentsReadyForClearing(params, clearing, toClear)) {
                            var clearingInfos = params.GetTable("Z_ESK_CLEAR_DOCUMENTS", "T_AUSZ2").AddNew();
                            clearingInfos.SetValue("BUKRS", clearing.companyCode);
                            clearingInfos.SetValue("AKTIO", "A");
                            clearingInfos.SetValue("AUGBL", clearing.documentNumber);
                            clearingInfos.SetValue("AUGDT", Sys.Helpers.SAP.FormatToSAPDateTimeFormat(Data.GetValue("PostingDate__")));
                            clearingInfos.SetValue("AUGGJ", clearing.fiscalYear);
                            var clearingInfoLinesTable = params.GetTable("Z_ESK_CLEAR_DOCUMENTS", "T_AUSZ1");
                            for (var doc in toClear) {
                                if (Object.prototype.hasOwnProperty.call(toClear, doc)) {
                                    var clearSettlement = clearingInfoLinesTable.AddNew();
                                    clearSettlement.SetValue("BELNR", toClear[doc].documentNumber);
                                    clearSettlement.SetValue("BUKRS", toClear[doc].companyCode);
                                    clearSettlement.SetValue("GJAHR", toClear[doc].fiscalYear);
                                    clearSettlement.SetValue("BUZEI", "001");
                                }
                            }
                            var clearClearing = clearingInfoLinesTable.AddNew();
                            clearClearing.SetValue("BELNR", clearing.documentNumber);
                            clearClearing.SetValue("BUKRS", clearing.companyCode);
                            clearClearing.SetValue("GJAHR", clearing.fiscalYear);
                            var buzei = (Data.GetTable("LineItems__").GetItemCount() + 1).toString();
                            clearClearing.SetValue("BUZEI", Sys.Helpers.String.PadLeft(buzei, "0", 3));
                            params.Exception = params.GetBapi("Z_ESK_CLEAR_DOCUMENTS").Call();
                            Variable.SetValueAsString("Z_ESK_CLEAR_DOCUMENTS_parameters", params.GetBapi("Z_ESK_CLEAR_DOCUMENTS").GetJsonParameters(false));
                            var RETURNS = params.GetTable("Z_ESK_CLEAR_DOCUMENTS", "RETURN");
                            // Check errors returned by BAPI
                            var res = !Sys.Helpers.SAP.ExtractErrors(RETURNS);
                            if (res) {
                                Log.Info("Clearing complete");
                            }
                            else {
                                Log.Error("error while getting info for clearing from: " + Sys.Helpers.SAP.GetLastError());
                            }
                            return res;
                        }
                    }
                    Log.Error("error while getting info for clearing with '" + clearingDoc + "' following documents: " + JSON.stringify(docsToClear));
                    return false;
                }
                Consignment.ClearDocuments = ClearDocuments;
                function FICreateSettlement(params, docType, blockPayment) {
                    var documentIds = params.previousDocumentIds || {};
                    var settlementNumberOnForm = Data.GetValue("ERPInvoiceNumber__");
                    if (settlementNumberOnForm && !documentIds.FI) {
                        documentIds.FI = settlementNumberOnForm;
                    }
                    if (!documentIds.FI) {
                        if (settlementNumberOnForm) {
                            documentIds.FI = settlementNumberOnForm;
                        }
                        else if (!Lib.AP.IsCreditNote()) {
                            // settle assignment
                            params.InvoiceSpecialType = "settlement";
                            documentIds.FI = Lib.AP.SAP.Invoice.Post.FICreateInvoiceDocument(params, docType, blockPayment);
                        }
                        else {
                            Sys.Helpers.SAP.SetLastError("_Credit note without settlement error");
                        }
                    }
                    if (documentIds.FI) {
                        Transaction.Write(Lib.ERP.Invoice.transaction.keys.documentId, JSON.stringify(documentIds));
                        return documentIds;
                    }
                    return null;
                }
                Consignment.FICreateSettlement = FICreateSettlement;
                function FICreateClearing(params, docType, blockPayment) {
                    var documentIds = params.previousDocumentIds || {};
                    var docsToClear = {};
                    params.InvoiceSpecialType = "clearing";
                    params.GlLinesTableNameOverride = "BalancingLineItems__";
                    params.GlLinesIgnoreZeroAmounts = true;
                    var lineItems = Data.GetTable("LineItems__");
                    for (var i = 0; i < lineItems.GetItemCount(); i++) {
                        var item = lineItems.GetItem(i);
                        if (item.GetValue("LineType__") === "Vendor") {
                            if (!params.refId) {
                                var invoiceDocument = Lib.AP.ParseInvoiceDocumentNumber(item.GetValue("DocumentNumber__"), true);
                                if (invoiceDocument) {
                                    params.refId = invoiceDocument.documentNumber;
                                }
                            }
                            docsToClear[item.GetValue("DocumentNumber__")] = true;
                        }
                    }
                    if (!documentIds.FI) {
                        documentIds.FI = Lib.AP.SAP.Invoice.Post.FICreateInvoiceDocument(params, docType, blockPayment);
                    }
                    if (documentIds.FI && !documentIds.Cleared) {
                        documentIds.Cleared = Lib.AP.SAP.Consignment.ClearDocuments(params, documentIds.FI, docsToClear);
                        if (!documentIds.Cleared) {
                            Sys.Helpers.SAP.SetLastError("_SAP Error when clearing documents");
                        }
                        Transaction.Write(Lib.ERP.Invoice.transaction.keys.documentId, JSON.stringify(documentIds));
                        return documentIds;
                    }
                    return null;
                }
                Consignment.FICreateClearing = FICreateClearing;
            })(Consignment = SAP.Consignment || (SAP.Consignment = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
