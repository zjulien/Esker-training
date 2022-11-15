/* LIB_DEFINITION
{
	"name": "LIB_DD_CUSTOMIZATION_EXTRACTION",
	"libraryType": "LIB",
	"scriptType": "SERVER",
	"comment": "all extraction customization function",
	"require": [ "Lib_DD_Extraction" ]
}
*/

/**
 * Package DD extraction customization callbacks for all processes
 * @namespace Lib.DD.Customization.Extraction
 */

///#GLOBALS Lib
var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.Extraction = (function ()
{
	/**
	 * @lends Lib.DD.Customization.Extraction
	 */
	var Extraction =
	{
		/**
		 * This function is used to customize the SenderForm extraction type. For now the supported values are:
		 * - "demoacme": extraction from PDF ACME demo document
		 * - "bprocess": XML extraction from BProcess XML format document
		 * - "ubl": XML extraction from UBL XML format document
		 * - "default": no "built-in" extraction selected, the extraction can be done in the DD Configurator or in the `ExtractDataFromDocument` user exit
		 *
		 * If `null` is returned the extraction type will be automatically detected based on process attachments
		 * @returns string|null
		 * @example
		 * // disable the extraction type automatic detection
		 * return "default";
		 * @example
		 * // if the node "/Invoice/InvoiceID" contains a value then force "customxml1" as extraction type
		 * if(!Lib.DD.XMLExtraction.HasXMLToProcessAttach())
		 * {
		 * 	return false;
		 * }
		 * var invoiceNumber = Lib.DD.XMLExtraction.Extract("/Invoice/InvoiceID");
		 * return (invoiceNumber && invoiceNumber.length) > 0 ? "customxml1" : null;
		 */
		GetExtractionType: function ()
		{
			return null;
		},

		/**
		 * This function is used to setup the invoices extraction
		 * It can be used to customize both the PDF or the XML extraction
		 * It has one input parameter 'extractionType' allowing to run specific extraction depending of
		 * the selected extraction type (returned by the GetExtractionType user exit or specified by the configurator)
		 * @example <caption>PDF Extraction</caption>
		 * // For PDF extraction use the Lib.DD.Extraction lib
		 * // You MUST call the following method with the current document culture as a parameter.
		 * // Otherwise the extraction of dates and numbers will not work.
		 * Lib.DD.Extraction.Init('fr-FR');
		 *
		 * // You can now add there your extraction logic.
		 * // There is below some examples to extract data from the document :
		 * Lib.DD.Extraction.Extract(0, 139,  437, 727,   75, "Recipient_name__");
		 * Lib.DD.Extraction.Extract(0,  1497,  564,  357,   56, "Invoice_date__", Lib.DD.Extraction.StringToDate);
		 * Lib.DD.Extraction.Extract(nbPages-1, 1879, 2486, 441, 52, "Invoice_total_amount__", Lib.DD.Extraction.StringToDecimal);
		 *
		 * @example <caption>XML Extraction</caption>
		 * // Extract invoice total amount
		 * Lib.DD.XMLExtraction.Extract("/Invoice/Summary/GrossAmount", "Invoice_total_amount__", Lib.DD.XMLExtraction.StringToDecimal);
		 *
		 * // Extract the invoice date in french format
		 * function parseFrenchDate(str) { TO BE IMPLEMENTED }
		 * Lib.DD.XMLExtraction.Extract("/Invoice/Head/InvoiceDate", "Invoice_date__", parseFrenchDate);
		 *
		 * // For each invoice line add or overwrite cell values
		 * Lib.DD.XMLExtraction.ExtractTable("/Invoice/Line[LineType='L']", "Table_Line_Items__", function (extractCell, tableItem)
		 * {
		 * 	// extract the date in french format
		 * 	extractCell("PONumDate", "Col_Purchase_order_date__", parseFrenchDate);
		 * 	// set a constant value for the tax
		 * 	tableItem.SetValue("Col_Tax__", 20.0);
		 * });
		 */
		ExtractDataFromDocument: function (extractionType)
		{
		},
		/**
		 * This function is used to initialize the SenderForm extraction
		 * It could be useful to forward the process to someone else for instance (so sender and recipient request in DB are right)
		 */
		InitializeSenderFormExtraction: function ()
		{
		},

		/**
		 * This function is used to customize the SenderForm process based on extracted data
		 */
		FinalizeSenderFormExtraction: function ()
		{
		},

		/**
		 * This function is used to customize the Splitting process based on extracted data
		 */
		FinalizeSplittingExtraction: function ()
		{
		},

		/**
		 * Function called by the SenderForm process
		 * @example
		 * // Force validation for all documents which are not orders
		 * return documentType !== "Order";
		 * @param {string} documentType - document type of the attached document.
		 * @returns {boolean} If implemented, the process will be forced or not in validation
		 */
		ForceValidation: function (documentType)
		{
		}
	};

	return Extraction;

})();
