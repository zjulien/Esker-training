/**
 * @file Lib.Contract.Customization.Client library: client script Contract customization callbacks
 */

/**
 * Package Contract client script customization callbacks
 *
 * Timeline of user exit calls
 * ------------------
 * @namespace Lib.Contract.Customization.Client
 */

/* LIB_DEFINITION
{
	"name": "Lib_Contract_Customization_Client",
	"libraryType": "LIB",
	"scriptType": "CLIENT",
	"comment": "Custom library extending Contract scripts on client side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Contract.Customization.Client", function ()
{
	/**
	 * @lends Lib.Contract.Customization.Client
	 */
	var customization = {
		/**
		 * @description Allows you to customize the Contract process form. This user exit is called from the HTML page script of the Contract process, before loading the form and determining the workflow.
		 * 		This user exit is typically used to customize:
		 * 			Objects from the included script libraries.
		 * 			Objects from the HTML page script.
		 * @version 5.117 and higher
		 * @memberof Lib.Contract.Customization.Client
		 * @example
		 *  <pre><code>
		 * OnLoad: function ()
		 * {
		 *
		 * }
		 * </code></pre>
		 */
		OnLoad: function ()
		{
		},

		/**
		 * @description Allows you to customize the Contract process form. This user exit is called from the HTML page script of the Contract process, after loading the form and determining the workflow.
		 *		This user exit is typically used to customize:
		 *		Objects from the included script libraries.
		 *		Objects from the HTML page script.
		 * @version 5.125 and higher
		 * @memberof Lib.Contract.Customization.Client
		 * @function CustomizeLayout
		 * @example
		 * <pre><code>
		 * </code></pre>
		 *
		*/
		CustomizeLayout: function ()
		{
		},

		/**
		 * @description Allows you to customize the Contract process form. This user exit is called from the HTML page script of the Contract process, when the form layout is updated upon user modifications.
		 *		This user exit is typically used to customize:
		 *		Objects from the included script libraries.
		 *		Objects from the HTML page script.
		 * 		Note:
		 * 			We recommend that you use the CustomizeLayout user exit instead of the OnUpdateLayout user exit when possible.
		 * @see {@link Lib.Contract.Customization.Client.CustomizeLayout}
		 * @version 5.125 and higher
		 * @memberof Lib.Contract.Customization.Client
		 * @function OnUpdateLayout
		*/
		OnUpdateLayout: function ()
		{
		},

		GetContractType: function (contractNumber, vendorNumber)
		{
			switch (vendorNumber)
			{
				case "AdamMat60102":
					return "maintenance";
				default:
					return null;
			}
		}
	};

	return customization;
});
