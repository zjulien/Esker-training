/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_FTRVENDOR",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Customizable vendor first time recognition",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.P2P.Customization.FTRVendor library: Vendor first time recognition script P2P customization callbacks
 */

/**
 * Package P2P Vendor first time recognition script customization callbacks
 * @namespace Lib.P2P.Customization.FTRVendor
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.P2P = Lib.P2P || {};
Lib.P2P.Customization = Lib.P2P.Customization || {};

(function (lib)
{
	lib.FTRVendor =
	{
		/**
		*  @typedef FTRMethod
		*  @memberof Lib.P2P.Customization.FTRVendor
		*  @property {function} func - the function to call
		*  @property {string} desc - short description of the method
		*  @property {boolean} [cultureIndependant=false] - the function is executed one time (not for each available culture for the current document)
		*/

		/**
		 * @description Allows you to customize the type and the order of the checks that are carried out to determine the vendor from vendor data. By default, the following checks are carried out:
		 * - The process first checks whether the vendor can be determined from the VAT information.
		 * - If the vendor could not be determined, the process then checks the phone or fax number information.
		 * - If the vendor failed to be determined using the previous data, the process checks the address block information.
		 * - This user exit is called by the extraction script of the Vendor invoice and Purchase Requisition processes.
		 * Note : You can further customize the vendor determination algorithm using the GetInvoiceFTRParameters and GetCultureInfos user exits.This function permit to override default parameters used to drive first time recognition extraction module
		 * @version 5.128 and higher
		 * @memberof Lib.P2P.Customization.FTRVendor
		 * @function GetVendorFTRMethods
		 * @param {Lib.P2P.Customization.FTRVendor.FTRMethod[]} FTRMethods A sorted array of methods to apply to search for vendor ("by VAT", "by Phone number or fax", "by address block")
		 * @param {Object} cultureManager Object the allows management of available cultures, mostly it permits to retrieve culture property using the method GetProperty(propertyName)
		 * @returns {Lib.P2P.Customization.FTRVendor.FTRMethod[]} The updated array of methods to apply to search for vendor
		 * @example This user exit adds a check in the email information and carries out the check in the address block before the check in the phone and fax number:
		 * <pre><code>
		 * GetVendorFTRMethods: function (FTRMethods, cultureManager)
		 * {
		 *     // search by address block before by phone/fax number and add default recognition
		 *     function vendorLookupFTSEmail(companyCode)
		 *     {
		 *         // adapt the regular expression and the list of available characters to your needs
		 *         var emailRegExp = cultureManager.GetProperty("emailRegExp");
		 *         var availableCharacters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@-_'.";
		 *         var documentWordsList = [];
		 *         var result = { dbresult: null, areas: [] };
		 *
		 *         if (!emailRegExp)
		 *         {
		 *             return result;
		 *         }
		 *
		 *         for (var iPage = 0; iPage < Document.GetPageCount(); iPage++)
		 *         {
		 *             // Look for email
		 *             var sPageText = Document.GetArea(iPage).toString();
		 *             var arrayEmail = emailRegExp.exec(sPageText);
		 *             while (arrayEmail)
		 *             {
		 *                 var sWord = Lib.P2P.FirstTimeRecognition_Vendor.spanIncluding(arrayEmail[0], availableCharacters);
		 *                 documentWordsList.push(sWord);
		 *                 var objMatchingInfo = {};
		 *                 objMatchingInfo.zone = Document.SearchString(arrayEmail[0], iPage, true, false)[0];
		 *                 objMatchingInfo.columns = ["Email__"];
		 *                 objMatchingInfo.value = sWord;
		 *                 result.areas.push(objMatchingInfo);
		 *
		 *                 arrayEmail = emailRegExp.exec(sPageText);
		 *             }
		 *         }
		 *
		 *         if (documentWordsList.length === 0) {
		 *             return result;
		 *         }
		 *
		 *         var searchCriteria = [];
		 *         for (var i = 0; i < documentWordsList.length; i++) {
		 *             var word = documentWordsList[i];
		 *             if (word.length > 0) {
		 *                 searchCriteria.push(Sys.Helpers.LdapUtil.FilterEqual("Email__", word));
		 *             }
		 *         }
		 *         if (searchCriteria.length === 0) {
		 *             Log.Warn("Filter to query vendors with Email is built with wrong arguments");
		 *         }
		 *         var filter = Sys.Helpers.LdapUtil.FilterOr(searchCriteria).toString().AddCompanyCodeFilter(companyCode);
		 *         traceDebug("Filter to query vendors with Email = " + filter);
		 *         var attributes = Lib.AP.GetExtendedVendorAttributes();
		 *         Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filter, attributes, function (records, error) {
		 *             if (error) {
		 *                 Log.Error(error);
		 *             }
		 *             else if (!records || records.length === 0) {
		 *                 return;
		 *             }
		 *             for (var i = 0; i < records.length; i++) {
		 *                 var record = records[i];
		 *                 // Validate this matching record with your own function
		 *                 if (Lib.P2P.FirstTimeRecognition_Vendor.validateVendorRecordForVATPhoneOrFax(record, result.areas)) {
		 *                     result.dbresult = record;
		 *                     break;
		 *                 }
		 *                 else {
		 *                     traceDebug("Discarding invalid value");
		 *                 }
		 *             }
		 *         });
		 *         return result;
		 *     }
		 *
		 *     // search by VAT (standard), Email (custom), Address (standard), phone/fax (standard)
		 *     FTRMethods = [
		 *         {"func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSVAT, "desc":"by VAT"},
		 *         {"func": vendorLookupFTSEmail, "desc":"by email"},
		 *         {"func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSPostal, "desc":"by address bloc"},
		 *         {"func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSPhoneOrFax, "desc":"by Phone number or fax"}
		 *     ];
		 *
		 *     return FTRMethods;
		 * }
		 * </code></pre>
		 */
		GetVendorFTRMethods: function (FTRMethods, cultureManager)
		{
		},

		/**
		 * @description Allows you to customize the list of the cultures that are supported in the application and the culture information, such as the phone or fax number format, the postal code, etc. Culture information is used by the process for the vendor determination. This user exit is called by the extraction script of the Vendor invoice and Purchase Requisition processes.
		 *
		 * !! The new culture(s) added through the GetCultureInfos user exit must also be added:
		 * - To the list of the expected document cultures in the configuration tool for the Accounts Payable module of the Purchase to Pay application.
		 * - To the Lib_P2P_Custom_Parameters library for the Purchasing module of the Purchase to Pay application.
		 * version 5.128 and higher
		 * @memberof Lib.P2P.Customization.FTRVendor
		 * @function GetCultureInfos
		 * @param {Lib.P2P.FirstTimeRecognition_Vendor.CultureInfo[]} standardCultureInfos An array of the cultures supported by the standard package
		 * @returns {Lib.P2P.FirstTimeRecognition_Vendor.CultureInfo[]} The updated list of CultureInfo
		 * @example This user exit adds the new Portuguese culture pt-PT and some culture information such as the Portuguese fax and number format, postal code, etc. to the application culture list:
		 * <pre><code>
		 * GetCultureInfos: function(standardCultureInfos)
		 * {
		 * 		// Add a new culture
		 *		standardCultureInfos.push(
		 *		{
		 *			name: "pt-PT",
		 *			emailRegExp: /([a-zA-Z0-9-'_]+(\.[a-zA-Z0-9-'_]+)*)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9-]+\.)+))([a-zA-Z]{2,}|[0-9]{1,3})(\]?)/mg,
		 *			VATRegExp: /(PT)?[ ]?([0-9][ ]?){9}/mg,
		 *			faxOrPhoneRegExp: /(T|F)?(\(?(\+?(351))|0)\)?[ ]?([0-9][ ]?){9}/mg,
		 *			postalCodeRegExp: /[0-9]{4}[ ]?\-[ ]?[0-9]{3}/mg,
		 *			defaultCurrency: "EUR"
		 *		});
		 *		return standardCultureInfos;
		 * }
		 * </code></pre>
		 */
		GetCultureInfos: function (standardCultureInfos)
		{

		}
	};
})(Lib.P2P.Customization);