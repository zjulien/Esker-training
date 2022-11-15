/**
 * @file Lib.Shipping.Customization.Common library: common script Shipping libraries callback scripts
 */

/**
 * Package Expense Report Common script customization callbacks
 * @namespace Lib.Shipping.Customization.Common
 */

/* LIB_DEFINITION{
  "name": "Lib_Shipping_Customization_Common",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "",
  "versionable": false,
  "require": []
}*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Shipping.Customization.Common", function ()
{
	/**
	 * @lends Lib.Shipping.Customization.Common
	 */
	var customization = {
		/**
		* Allows you to update the list of available carriers in the ASN process. You can modify or delete existing carriers as well as adding new carriers.
		* This user exit is called at the carriers loading step in Lib_Shipping.
		* @param {Record<string,Carrier>} defaultCarriers The list of carriers provided by default
		* @returns {Record<string,Carrier>} A record with name as key and link as a property. Link properties use \<parcelNumber\> as a placeholder for the tracking number of the parcel. The actual tracking number will be substituted for the placeholder in the Lib.Shipping.Carrier.GetLink method.
		* @example
		* <pre><code>
		* UpdateCarriers: function (defaultCarriers)
		* {
		*	var carriers = defaultCarriers;
		*
		*	carriers["GLS"] = {link : "https://gls-group.eu/FR/fr/suivi-colis.html?match=<parcelNumber>"};
		*
		*	return carriers;
		* },
		* </code></pre>
		*/
		UpdateCarriers: function (defaultCarriers)
		{
			return defaultCarriers;
		}
	};

	return customization;
});