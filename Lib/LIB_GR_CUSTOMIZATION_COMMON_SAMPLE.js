/**
 * @file Lib.GR.Customization.Common library: common script Good Receipt customization callbacks
 */

/**
 * Package Good Receipt common script customization callbacks
 * @namespace Lib.GR.Customization.Common
 */

/* LIB_DEFINITION
{
	"name": "Lib_GR_Customization_Common",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"comment": "Custom library extending Goods Receipt scripts on common side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "GR.Customization.Common", function ()
{
	/**
	 * @lends Lib.GR.Customization.Common
	 */
	var customization = {

		/**
		 * @description Allows you to customize the reception of an item in case of an overdelivery. This user exit is called from the HTML Page script of the Goods Receipt process.
		 * By default, the Goods Receipt process does not accept the overdelivery of items. Use this user exit to allow and customize the overdelivery of items. This user exit is called for each overdelivered item in the Goods Receipt process.
		 * @version 5.152 and higher
		 * @memberof Lib.GR.Customization.Common
		 * @function AllowOverdelivery
		 * @param {object} Item An Item object representing an item in the Goods Receipt process.
		 * @returns {boolean} Boolean value specifying whether overdelivery is enabled for the item.
		 * @example
		 * <pre><code>
		 * AllowOverdelivery: function(item)
		 *	{
		 *		// For office supplies (OS), allow up to 10% of overdelivery
		 *		return item.GetValue("Group__") === "OS" && (item.GetValue("ReceivedQuantity__") <= Math.ceil(1.1 * item.GetValue("OpenQuantity__")));
		 *	}
		 *	</code></pre>
		 */
		AllowOverdelivery: function (item)
		{
			return false;
		}
	};

	return customization;
});
