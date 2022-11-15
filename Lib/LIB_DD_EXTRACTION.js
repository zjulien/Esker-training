/* LIB_DEFINITION
{
    "name": "LIB_DD_EXTRACTION",
    "libraryType": "LIB",
    "scriptType": "SERVER",
    "comment": "Extraction of acme documents",
    "require": [ ]
}
*/
/**
 * @namespace Lib.DD.Extraction
 */
///#GLOBALS Lib
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        var Extraction;
        (function (Extraction) {
            Extraction.DocumentCulture = "en-US";
            Extraction.HighlightZones = {
                Apply: false,
                Background: 0xFFFF00,
                Border: 0x000000 //Border colour used for highlighting
            };
            /**
             * Initialises the extraction logic
             * @memberof Lib.DD.Extraction
             * @param {string} documentCulture The document culture, used by Extract method on date anumber fields
             * @see Lib.DD.Extraction.Extract
             */
            function Init(documentCulture) {
                Lib.DD.Extraction.DocumentCulture = documentCulture;
            }
            Extraction.Init = Init;
            /**
             * Extract a string from a given area in the processed document, and set the <target> process field
             *   - Page [integer]: 0-based index of the page from which the data is to be extracted
             *   - X, Y [integers]: coordinates of the top-left corner of the rectangular area containing the data to be extracted
             *   - Width, Height: size of the rectangular area containing the data to be extracted
             *   - Target [string]: name of the process field where the result should be stored (if null, the result is not stored in any field)
             *   - Transform [function(string)]: if not null, defines the function to be applied to the extracted string before it is stored in the target field
             * @return {object} result data extracted from the specified area (can return null if data conversion - using Transform - fails)
             * @memberof Lib.DD.Extraction
             */
            function Extract(Page, X, Y, Width, Height, Target, Transform) {
                var areaContent = Document.GetArea(Page, X, Y, Width, Height);
                if (Lib.DD.Extraction.HighlightZones.Apply && Target) {
                    areaContent.Highlight(true, Lib.DD.Extraction.HighlightZones.Background, Lib.DD.Extraction.HighlightZones.Border, Target);
                }
                var result = areaContent.toString();
                if (Transform) {
                    result = Transform(result);
                    if (!result) {
                        if (Log.debugEnabled) {
                            var functionName = Transform.toString();
                            functionName = functionName.substring(0, functionName.indexOf("("));
                            Log.Warn("Conversion error : could not interpret value \"" + result + "\" using " + functionName);
                        }
                        return result;
                    }
                }
                if (Target) {
                    Data.SetValue(Target, result);
                }
                return result;
            }
            Extraction.Extract = Extract;
            /**
             * Transform a string into a process-compliant date
             *   - DateStr [string]: date in 'month/day/year' format
             * @return {object} result the JavaScript Date object matching the input string
             * @memberof Lib.DD.Extraction
             */
            function StringToDate(DateStr) {
                var extractedDate = Data.ExtractDate(DateStr, Lib.DD.Extraction.DocumentCulture);
                // make sure to keep date as extracted on the document
                // cf. http://webdoc:8080/eskerondemand/nv/en/manager/Content/Processes/Scripting_API/EDDAPI/xVarsObject_AddValue_Date.html
                var formattedDate = null;
                if (extractedDate != null) {
                    formattedDate = new Date(extractedDate.getUTCFullYear(), extractedDate.getUTCMonth(), extractedDate.getUTCDate(), 12);
                }
                return formattedDate;
            }
            Extraction.StringToDate = StringToDate;
            /**
             * Transform a string into a process-compliant decimal number
             *  - DesimalStr [string]: number in decimal format
             * Warning : this function does not work for numbers having more than 15 digits !
             * @return {object} result the JavaScript numerical object matching the input string.
             * @memberof Lib.DD.Extraction
             */
            function StringToDecimal(DecimalStr) {
                if (DecimalStr.length > 15) {
                    Log.Warn("Decimal number formating does not support inputs having more than 15 digits : " + DecimalStr);
                    return null;
                }
                return Data.ExtractSignedNumber(DecimalStr, Lib.DD.Extraction.DocumentCulture, true);
            }
            Extraction.StringToDecimal = StringToDecimal;
        })(Extraction = DD.Extraction || (DD.Extraction = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
