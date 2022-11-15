/* LIB_DEFINITION{
  "name": "Lib_VendorRegistration_DocumentsTable_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "VendorRegistration library",
  "require": [
    "[Lib_AP_Customization_VendorRegistration]",
    "[Lib_VendorRegistration_Customization_Common]"
  ]
}*/
///#GLOBALS Lib Sys
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var DocumentsTable;
        (function (DocumentsTable) {
            var documentsToAttach = [];
            var serializedDocuments = {
                documents: []
            };
            DocumentsTable.documentTypes = {
                kbis: "KBIS=_KBIS",
                rib: "RIB=_RIB",
                certificateOfFiscalRegularity: "Certificate of fiscal regularity=_CertificateOfFiscalRegularity",
                w9Form: "W-9 form=_W9Form",
                diversityClassification: "Diversity Classification=_DiversityCertification",
                other: "Other=_Other",
                getValue: function (type) {
                    var equalPosition = type.indexOf("=");
                    if (equalPosition > -1) {
                        return type.substring(0, equalPosition);
                    }
                    return null;
                },
                getLabel: function (type) {
                    var equalPosition = type.indexOf("=");
                    if (equalPosition > -1) {
                        return type.substring(equalPosition + 1);
                    }
                    return null;
                }
            };
            function Init() {
                documentsToAttach = [];
                Controls.DocumentsTable__.SetAtLeastOneLine(!ProcessInstance.isReadOnly);
                fillDocumentsTable();
                Controls.DocumentsTable__.DocumentFile__.OnFileUploadEnd = onFileUploadEnd;
                Controls.DocumentsTable__.DocumentFile__.OnClickOnFile = onClickOnFile;
                Controls.DocumentsTable__.DocumentFile__.OnDeleteFile = onDeleteFile;
                Controls.DocumentsTable__.DocumentType__.OnChange = onDocumentTypeChange;
            }
            DocumentsTable.Init = Init;
            function getSerializedDocument(docid) {
                for (var i = 0; i < serializedDocuments.documents.length; i++) {
                    var doc = serializedDocuments.documents[i];
                    if (doc.file._docId === docid) {
                        return doc;
                    }
                }
                return null;
            }
            function onDocumentTypeChange() {
                var control = this;
                var documentType = control.GetValue();
                var uploadedFiles = control.GetRow().DocumentFile__.GetUploadedFiles();
                if (uploadedFiles) {
                    uploadedFiles.forEach(function (uploadedFile) {
                        var doc = getSerializedDocument(uploadedFile._docId);
                        if (doc) {
                            doc.type = documentType;
                        }
                    });
                }
            }
            function onFileUploadEnd(success, file) {
                if (success) {
                    var row = this.GetRow();
                    var document = {
                        file: file,
                        type: row.DocumentType__.GetValue(),
                        status: "_Document inprogress",
                        attachmentIndex: -1,
                        endOfValidity: null
                    };
                    serializedDocuments.documents.push(document);
                    documentsToAttach.push(document);
                    if (!row.DocumentStatus__.GetValue()) {
                        // File was uploaded on an empty line (not on a deleted file line), add a new empty line
                        addNewLine();
                    }
                    row.DocumentStatus__.SetValue(Language.Translate(document.status));
                    Controls.DocumentsTable__.Wait(false);
                }
            }
            function onClickOnFile(event) {
                for (var i = 0; i < Attach.GetNbAttach(); i++) {
                    var attach = Attach.GetAttach(i);
                    if (attach.GetId() === event.file.id) {
                        Attach.Open(i);
                    }
                }
            }
            function onDeleteFile(event) {
                if (event.file.id) {
                    for (var i = 0; i < serializedDocuments.documents.length; i++) {
                        var file = serializedDocuments.documents[i].file;
                        if (file._docId === event.file.id) {
                            serializedDocuments.documents.splice(i, 1);
                        }
                    }
                    for (var i = 0; i < documentsToAttach.length; i++) {
                        var file = documentsToAttach[i].file;
                        if (file.GetId() === event.file.id) {
                            documentsToAttach.splice(i, 1);
                        }
                    }
                    var row = this.GetRow();
                    row.DocumentStatus__.SetValue(Language.Translate("_Pending deletion"));
                }
            }
            function fillDocumentsTable() {
                var serializedDocumentsJSON = Variable.GetValueAsString("DocumentsSummaryJSON");
                if (serializedDocumentsJSON) {
                    try {
                        serializedDocuments = JSON.parse(serializedDocumentsJSON);
                        var documentsCount = serializedDocuments.documents.length;
                        Controls.DocumentsTable__.SetItemCount(documentsCount);
                        for (var i = 0; i < documentsCount; i++) {
                            var doc = serializedDocuments.documents[i];
                            var row = Controls.DocumentsTable__.GetRow(i);
                            var attachment = Attach.GetAttach(doc.attachmentIndex);
                            if (attachment) {
                                var attachmentParams = {
                                    name: attachment.GetNiceName(doc.attachmentIndex),
                                    undeletable: ProcessInstance.isReadOnly
                                };
                                row.DocumentFile__.AddFile(attachment, attachmentParams);
                                row.DocumentStatus__.SetValue(Language.Translate(doc.status));
                                row.DocumentType__.SetValue(doc.type);
                                row.EndOfValidity__.SetValue(doc.endOfValidity);
                            }
                        }
                        addNewLine();
                    }
                    catch (ex) {
                        Log.Warn("JSON parsing exception - Unable to parse DocumentsSummary - " + ex);
                    }
                }
            }
            function addNewLine() {
                // Add a new line if we did not reach the table max lines count
                if (Data.GetTable("DocumentsTable__").GetItemCount() < (Controls.DocumentsTable__.GetLineCount() - 1) && !ProcessInstance.isReadOnly) {
                    Controls.DocumentsTable__.AddItem(false);
                }
            }
            function AttachDocumentsToRecord() {
                Controls.DocumentsTable__.Wait(true);
                var attachmentIndex = Attach.GetNbAttach();
                for (var i = 0; i < documentsToAttach.length; i++) {
                    var document = documentsToAttach[i];
                    var serializedDoc = getSerializedDocument(document.file._docId);
                    serializedDoc.attachmentIndex = attachmentIndex;
                    serializedDoc.status = "_Document uploaded";
                    serializedDoc.endOfValidity = document.endOfValidity;
                    Attach.AddAttach(document.file);
                    attachmentIndex++;
                }
                var documentsCount = serializedDocuments.documents.length;
                for (var i = 0; i < documentsCount; i++) {
                    var doc = serializedDocuments.documents[i];
                    var row = Controls.DocumentsTable__.GetRow(i);
                    doc.endOfValidity = row.EndOfValidity__.GetValue() || null;
                }
                Controls.DocumentsTable__.Wait(false);
                Variable.SetValueAsString("DocumentsSummaryJSON", JSON.stringify(serializedDocuments));
            }
            DocumentsTable.AttachDocumentsToRecord = AttachDocumentsToRecord;
            function UpdateDocumentTypeAvailableValues() {
                // Before updating document types, we need to force back the mandatory lines to optional
                for (var i = 0; i < Controls.DocumentsTable__.GetItemCount(); i++) {
                    SetRowOptional(Controls.DocumentsTable__.GetRow(i));
                }
                var docTypeValues = null;
                if (Sys.Helpers.TryGetFunction("Lib.AP.Customization.VendorRegistration.DocumentTypeAvailableValues")) {
                    // deprecated
                    docTypeValues = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorRegistration.DocumentTypeAvailableValues");
                }
                else {
                    docTypeValues = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Common.DocumentTypeAvailableValues");
                }
                if (!docTypeValues || docTypeValues.length === 0) {
                    var country = Data.GetValue("Country__");
                    var docTypeDefaultValues = [DocumentsTable.documentTypes.kbis, DocumentsTable.documentTypes.rib];
                    var docTypeUSValues = [DocumentsTable.documentTypes.rib, DocumentsTable.documentTypes.w9Form];
                    var docTypeFRValues = [DocumentsTable.documentTypes.kbis, DocumentsTable.documentTypes.rib, DocumentsTable.documentTypes.certificateOfFiscalRegularity];
                    switch (country) {
                        case "US":
                            docTypeValues = docTypeUSValues;
                            break;
                        case "FR":
                            docTypeValues = docTypeFRValues;
                            break;
                        default:
                            docTypeValues = docTypeDefaultValues;
                    }
                    if (country) {
                        // Add Diversity classification certificate if needed
                        if (Controls.DiversityClassification__.GetAvailableValues().length > 0) {
                            docTypeValues.push(DocumentsTable.documentTypes.diversityClassification);
                        }
                        docTypeValues.push(DocumentsTable.documentTypes.other);
                    }
                }
                UpdateDocumentTypesInTable(docTypeValues);
            }
            DocumentsTable.UpdateDocumentTypeAvailableValues = UpdateDocumentTypeAvailableValues;
            function UpdateDocumentTypesInTable(docTypeValues) {
                Controls.DocumentsTable__.GetColumnControl(1).SetAvailableValues(docTypeValues);
                for (var i = 0; i < Data.GetTable("DocumentsTable__").GetItemCount(); i++) {
                    Controls.DocumentsTable__.GetRow(i).DocumentType__.SetAvailableValues(docTypeValues);
                }
            }
            function GetLinesIdByDocumentType(documentType) {
                var linesId = [];
                for (var i = 0; i < Controls.DocumentsTable__.GetItemCount(); i++) {
                    var row = Controls.DocumentsTable__.GetRow(i);
                    var lineType = row.DocumentType__.GetValue();
                    if (lineType === documentType) {
                        linesId.push(i);
                    }
                }
                return linesId;
            }
            function GetLinesIdWithoutDocument() {
                var linesId = [];
                for (var i = 0; i < Controls.DocumentsTable__.GetItemCount(); i++) {
                    var row = Controls.DocumentsTable__.GetRow(i);
                    var uploadedFiles = row.DocumentFile__.GetUploadedFiles();
                    if (!(uploadedFiles && uploadedFiles.length > 0)) {
                        linesId.push(i);
                    }
                }
                return linesId;
            }
            function SetMandatoryDocumentType(documentType) {
                var linesWithMatchingDocumentType = GetLinesIdByDocumentType(documentType);
                if (Array.isArray(linesWithMatchingDocumentType) && linesWithMatchingDocumentType.length > 0) {
                    var row = Controls.DocumentsTable__.GetRow(linesWithMatchingDocumentType[0]);
                    row.DocumentType__.SetReadOnly(true);
                }
                else {
                    var emptyDocumentLines = GetLinesIdWithoutDocument();
                    if (emptyDocumentLines && emptyDocumentLines.length > 0) {
                        var row = Controls.DocumentsTable__.GetRow(emptyDocumentLines[0]);
                        row.DocumentType__.SetValue(documentType);
                        row.DocumentType__.SetReadOnly(true);
                    }
                    else {
                        Controls.DocumentsTable__.AddItem(false);
                        // The new item is the last of the table, so we set the last item document type and set it read only
                        var newDiversityDocument = Controls.DocumentsTable__.GetRow(Controls.DocumentsTable__.GetItemCount() - 1);
                        newDiversityDocument.DocumentType__.SetValue(documentType);
                        newDiversityDocument.DocumentType__.SetReadOnly(true);
                    }
                }
            }
            DocumentsTable.SetMandatoryDocumentType = SetMandatoryDocumentType;
            function SetRowOptional(row) {
                row.DocumentType__.SetReadOnly(false);
                row.DocumentType__.SetError();
            }
            function RemoveMandatoryDocumentType(documentType) {
                var linesWithMatchingDocumentType = GetLinesIdByDocumentType(documentType);
                if (Array.isArray(linesWithMatchingDocumentType) && linesWithMatchingDocumentType.length > 0) {
                    for (var _i = 0, linesWithMatchingDocumentType_1 = linesWithMatchingDocumentType; _i < linesWithMatchingDocumentType_1.length; _i++) {
                        var rowId = linesWithMatchingDocumentType_1[_i];
                        SetRowOptional(Controls.DocumentsTable__.GetRow(rowId));
                    }
                }
            }
            DocumentsTable.RemoveMandatoryDocumentType = RemoveMandatoryDocumentType;
            function CheckMandatoryDocumentTypes() {
                var withError = false;
                for (var i = 0; i < Controls.DocumentsTable__.GetItemCount(); i++) {
                    var row = Controls.DocumentsTable__.GetRow(i);
                    if (row.DocumentType__.IsReadOnly()) {
                        var uploadedFiles = row.DocumentFile__.GetUploadedFiles();
                        if (!(uploadedFiles && uploadedFiles.length > 0)) {
                            var documentError = Language.Translate("_Document of type {0} needed", true, row.DocumentType__.GetValue());
                            row.DocumentType__.SetError(documentError);
                            withError = true;
                        }
                        else {
                            row.DocumentType__.SetError();
                        }
                    }
                }
                return withError;
            }
            DocumentsTable.CheckMandatoryDocumentTypes = CheckMandatoryDocumentTypes;
        })(DocumentsTable = VendorRegistration.DocumentsTable || (VendorRegistration.DocumentsTable = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
