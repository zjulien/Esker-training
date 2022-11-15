/**
 * @file Lib.Expense.Report.Customization.Client library: Client script Expense Report customization callbacks
 */

/**
 * Package Expense Report Client script customization callbacks
 * @namespace Lib.Expense.Report.Customization.Client
 */

/* LIB_DEFINITION
{
	"name": "Lib_Expense_Report_Customization_Client",
	"libraryType": "LIB",
	"scriptType": "CLIENT",
	"comment": "Custom library extending Expense Report scripts on Client side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Expense.Report.Customization.Client", function ()
{
	/**
	 * @lends Lib.Expense.Report.Customization.Client
	 */
	var customization = {
		/**
		 * Allows you to customize layout settings of the Expense Report process.
		 * This user exit is called from the HTML Page script of the Expense Report process, before loading the form and determining the workflow.
		 * 
		 * This function will be called at the Expense Report loading; just before calling the Start function.
		 * If you return a promise object, we synchronize on it before calling the Start function.
		 * 
		 * @description CLIENT_WEB
		 * 
		 * This user exit sets the company code.
		 * @example
		 * <pre><code>
		 * OnLoad: function ()
		 * {
		 * 	// Initialize company code
		 * 	Data.SetValue("CompanyCode__", "US01");
		 * }
		 * </code></pre>
		 */
		OnLoad: function ()
		{
		},

		/**
		 * Allows you to customize layout settings of the Expense Report process.
		 * This user exit is called from the HTML Page script of the Expense Report process, after loading the form and determining the workflow.
		 *
		 * This function will be called at the first Expense Report rendering; just after calling the Start function.
		 * Here you declare the OnEvent callbacks and set the initial state (hidden, readonly, etc.) of controls.
		 * 
		 * @description CLIENT_WEB|CLIENT_MOBILE
		 */
		CustomizeLayout: function ()
		{
		}
	};

	return customization;
});
