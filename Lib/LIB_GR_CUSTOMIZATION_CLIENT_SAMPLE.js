/**
 * @file Lib.GR.Customization.Client library: client script Good Receipt customization callbacks
 */

/**
 * Package Good Receipt client script customization callbacks
 * @namespace Lib.GR.Customization.Client
 */

/* LIB_DEFINITION
{
	"name": "Lib_GR_Customization_Client",
	"libraryType": "LIB",
	"scriptType": "CLIENT",
	"comment": "Custom library extending Goods Receipt scripts on client side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "GR.Customization.Client", function ()
{
	/**
	 * @lends Lib.GR.Customization.Client
	 */
	var customization = {

		/**
		 * @description Allows you to customize the Goods Receipt process form. This user exit is called from the HTML page script of the Goods Receipt process, after loading the form.
		 * 		This user exit is typically used to customize:
		 * 	
		 * 			Objects from the included script libraries.
		 * 			Objects from the HTML page script.
		 * @version 5.127 and higher
		 * @memberof Lib.GR.Customization.Client
		 * @function CustomizeLayout
		 * @example
		 * The following user exit hides the z_ProjectCode__ field.
		 * <pre><code>
		 *	CustomiseLayout: function ()
		 *	{
		 *		Controls.LineItems__.z_ProjectCode__.Hide(true);
		 *		Controls.LineItems__.z_ProjectCode__.SetReadOnly(true);
		 *	}
		 * </code></pre>
		 *
		 */
		CustomizeLayout: function ()
		{
		}
	};

	return customization;
});
