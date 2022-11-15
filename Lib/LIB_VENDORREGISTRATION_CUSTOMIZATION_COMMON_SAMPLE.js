/* LIB_DEFINITION{
  "name": "LIB_VENDORREGISTRATION_CUSTOMIZATION_COMMON",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Library containing helper to choose document type",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.VendorRegistration.Customization library
 * @namespace Lib.VendorRegistration.Customization
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.VendorRegistration = Lib.VendorRegistration || {};
Lib.VendorRegistration.Customization = Lib.VendorRegistration.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.VendorRegistration.Customization.Common
	 */
	parentLib.Common =
	{
		/**
		* Function called in Vendor registration to customize available values
		* in DocumentType Combobox
		*
		* @memberof Lib.VendorRegistration.Customization.Common
		* @returns {array} result an Array of strings which represents availables values for document type,
		*                  in the value=label format.
		* @example
		* <pre><code>
		* DocumentTypeAvailableValues: function()
		* {
		*	return ["KBIS=_KBIS", "RIB=_RIB", "Other=_Other"];
		* }
		* </code></pre>
		*/
		DocumentTypeAvailableValues: function ()
		{
			return [];
		},

		/**
		* Function called in Vendor registration when OFAC verification is enabled
		* This specify the minimum scoring for alerting user
		* A message will be displayed in the form if a match is found with a score greater than minScore
		*
		* The score is a percentage of match between research and individual / entity found by OFAC
		* The score must be between 50 and 100 (default value is 80)
		* 100 : perfect match
		* 50 : approximate match
		*
		* @memberof Lib.VendorRegistration.Customization.Common
		* @returns {number} The minimum scoring for alerting user of match in OFAC list
		* @example
		* <pre><code>
		* GetOFACMinScore: function()
		* {
		*	return 80;
		* }
		* </code></pre>
		*/
		GetOFACMinScore: function ()
		{
			// Customization not implemented in sample package library
		},

		/**
		* Function called in Vendor registration to personnalize the URL of the validation SIs-ID
		*
		* @memberof Lib.VendorRegistration.Customization.Common
		* @returns {String} The URL of the validation of SisID
		* @example
		* <pre><code>
		* GetSisIDUrl: function()
		* {
		*	return "https://api.eu.apiconnect.ibmcloud.com/sis-id-com/my-sis-id-staging/sis-id/";
		* }
		* </code></pre>
		*/
		GetSisIDUrl: function ()
		{
			return "";
		}
	};
})(Lib.VendorRegistration.Customization);
