/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION
{
	"name": "Lib_O2C_Customization_CIM",
	"libraryType": "LIB",
	"scriptType": "CLIENT",
	"comment": "Client side customization for the CIM",
	"require": []
}
*/

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.O2C = Lib.O2C || {};
Lib.O2C.Customization = Lib.O2C.Customization || {};

/**
 * @namespace Lib_O2C_Customization_CIM
*/
Lib.O2C.Customization.CIM = (function ()
{
	/**
	 * @lends Lib_O2C_Customization_CIM
	 */
	var customization = {
		/**
		 * @namespace
		 */
		/**
		 * @description This function will be called when loading the CIM.
		 * It allows you to change the default tab that loads.
		 * @returns {string} The ID of the tab you want to open.
		 *
		 * @example
		 * <pre><code>function GetStartMenuTabID()
		 * {
		 *		return User.profileName === "Credit Analyst" ? "creditScore" : "invoices";
		 * }</code></pre>
		 **/
		GetStartMenuTabID: function ()
		{
			return null;
		}
	};

	return customization;
})();
