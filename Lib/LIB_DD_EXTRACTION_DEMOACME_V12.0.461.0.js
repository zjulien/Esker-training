/* LIB_DEFINITION{
  "name": "LIB_DD_EXTRACTION_DEMOACME_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Extraction of acme documents",
  "require": [
    "LIB_DD_EXTRACTION"
  ]
}*/
///#GLOBALS Lib Sys
/**
 * @namespace Lib.DD.Extraction.DemoAcme
 */
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        var Extraction;
        (function (Extraction) {
            var DemoAcme;
            (function (DemoAcme) {
                /**
                 * Determine whether the current document is a demo document or a client document
                 * @return {boolean} true if the current document is a demo document, false otherwise
                 * @memberof Lib.DD.Extraction.DemoAcme
                 */
                function IsDemoDocument() {
                    // A4
                    var keyword = Lib.DD.Extraction.Extract(0, 154, 95, 360, 75);
                    if (keyword === "ACME FRANCE" || keyword === "ACME") {
                        return true;
                    }
                    // Letter
                    keyword = Lib.DD.Extraction.Extract(0, 167, 159, 264, 69);
                    if (keyword === "ACME US") {
                        return true;
                    }
                    return false;
                }
                DemoAcme.IsDemoDocument = IsDemoDocument;
                /**
                 * Retrieve the document culture from a demo document
                 * @return {string} documentCulture The document culture
                 * @memberof Lib.DD.Extraction.DemoAcme
                 */
                function ExtractDocumentCultureFromDocument() {
                    var documentCulture = "en-GB";
                    // check US first
                    var keyword = Lib.DD.Extraction.Extract(0, 167, 159, 264, 69);
                    if (keyword === "ACME US") {
                        documentCulture = "en-US";
                    }
                    else {
                        // then check FR/UK
                        keyword = Lib.DD.Extraction.Extract(0, 597, 542, 301, 75);
                        if (keyword === "N° Client") {
                            documentCulture = "fr-FR";
                        }
                    }
                    Variable.SetValueAsString("DocumentCulture", documentCulture);
                    return documentCulture;
                }
                DemoAcme.ExtractDocumentCultureFromDocument = ExtractDocumentCultureFromDocument;
                /**
                 * The extraction logic for the demo documents
                 * @memberof Lib.DD.Extraction.DemoAcme
                 */
                function ExtractDataFromDocument() {
                    Variable.SetValueAsString("IsDemoAcme", "1");
                    var documentCulture = Lib.DD.Extraction.DemoAcme.ExtractDocumentCultureFromDocument();
                    Lib.DD.Extraction.Init(documentCulture);
                    var documentType = extractDocumentTypeFromDocument();
                    if (documentType === "POD") {
                        if (documentCulture === "fr-FR" || documentCulture === "en-GB") {
                            Lib.DD.Extraction.Extract(0, 645, 688, 210, 95, "Document_ID__");
                            Lib.DD.Extraction.Extract(0, 629, 593, 241, 87, "Recipient_ID__");
                        }
                        else {
                            // en-US
                            Lib.DD.Extraction.Extract(0, 1981, 724, 228, 94, "Document_ID__");
                            Lib.DD.Extraction.Extract(0, 2009, 651, 236, 65, "Recipient_ID__");
                        }
                    }
                    else {
                        Log.Error("Unsupported demo document type: " + documentType);
                    }
                }
                DemoAcme.ExtractDataFromDocument = ExtractDataFromDocument;
                // Extract document type on demo document
                function extractDocumentTypeFromDocument() {
                    var documentType;
                    var keyword;
                    if (Lib.DD.Extraction.DocumentCulture === "en-US") {
                        keyword = Lib.DD.Extraction.Extract(0, 1484, 720, 411, 90);
                    }
                    else {
                        // en-GB and fr-FR for demo
                        keyword = Lib.DD.Extraction.Extract(0, 111, 696, 467, 83);
                    }
                    if (keyword === "DELIVERY RECEIPT" || keyword === "BON DE LIVRAISON") {
                        documentType = "POD";
                    }
                    return documentType;
                }
            })(DemoAcme = Extraction.DemoAcme || (Extraction.DemoAcme = {}));
        })(Extraction = DD.Extraction || (DD.Extraction = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
