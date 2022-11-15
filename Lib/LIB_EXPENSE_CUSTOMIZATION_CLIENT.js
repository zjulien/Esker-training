/**
 * @file Lib.Expense.Customization.Client library: Client script Expense customization callbacks
 */

/**
 * Package Expense Client script customization callbacks
 * @namespace Lib.Expense.Customization.Client
 */

/* LIB_DEFINITION
{
	"name": "Lib_Expense_Customization_Client",
	"libraryType": "LIB",
	"scriptType": "CLIENT",
	"comment": "Custom library extending Expense scripts on Client side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Expense.Customization.Client", function ()
{
	/**
	 * @lends Lib.Expense.Customization.Client
	 */
	var customization = {
		/**
		 * Allows you to customize layout settings of the Expense process.
		 * This user exit is called from the HTML Page script of the Expense process, before loading the form and determining the workflow.
		 * 
		 * This function will be called at the Expense loading; just before calling the Start function.
		 * If you return a promise object, we synchronize on it before calling the Start function.
		 * 
		 * @description CLIENT_WEB|CLIENT_MOBILE
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
		 * Allows you to customize layout settings of the Expense process.
		 * This user exit is called from the HTML Page script of the Expense process, after loading the form and determining the workflow.
		 *
		 * This function will be called at the first Expense rendering; just after calling the Start function.
		 * Here you declare the OnEvent callbacks and set the initial state (hidden, readonly, etc.) of controls.
		 * 
		 * @description CLIENT_WEB|CLIENT_MOBILE
		 * 
		 * This user exit displays the custom field Z_NumberOfGuest__ only when the expense type is set to Business Meals.
		 * @example
		 * <pre><code>
		 * CustomiseLayout: function ()
		 * {
		 *	 if (Controls.ExpenseType__.GetValue() === "Business Meals") // For the US01 Company Code
		 *	 {
		 *		 Controls.Z_NumberOfGuest__.Hide(false);
		 *	 }
		 *	 else
		 *	 {
		 *		 Controls.Z_NumberOfGuest__.Hide(true);  
		 *	 }
		 *	 Controls.ExpenseType__.OnChange = Sys.Helpers.Wrap(Controls.ExpenseType__.OnChange, function(originalFn)
		 *	 {
		 *		 if (Controls.ExpenseType__.GetValue() === "Business Meals") // For the US01 Company Code
		 *		 {
		 *			 Controls.Z_NumberOfGuest__.Hide(false);
		 *		 }
		 *		 else
		 *		 {
		 *			 Controls.Z_NumberOfGuest__.Hide(true);
		 *		 }
		 *		 originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
		 *	 });
		 * }
		 * </code></pre>
		 */
		CustomizeLayout: function ()
		{
			var creator = Lib.P2P.ResolveDemoLogin("paprocess.%[reference:login:demosubstring]");
			var onBehalfOf = ["cfoprocess.%[reference:login:demosubstring]", "ceoprocess.%[reference:login:demosubstring]"];
			if (Sys.Helpers.Globals.User.loginId === creator)
			{
				var filterArray = [Sys.Helpers.LdapUtil.FilterEqual("login", creator)];
				Sys.Helpers.Object.ForEach(onBehalfOf, function (owner)
				{
					owner = Lib.P2P.ResolveDemoLogin(owner);
					if (owner)
					{
						filterArray.push(Sys.Helpers.LdapUtil.FilterStrictEqual("login", owner));
					}
				});
				Controls.OwnerName__.SetFilter(Sys.Helpers.LdapUtil.FilterOr.apply(this, filterArray).toString());
			}

			/*
						// For date-dependent custom exchange rate
						function distinctQuery(callback, Table, Attributes, LdapFilter, SortOrder, MaxRecords, option)
						{
							Query.DBQuery(function () { callback(this.GetQueryValue()); },
								Table, Attributes, LdapFilter, SortOrder, MaxRecords, null,
								option ? option + ",distinct=1" : "distinct=1");
						}
						Controls.TotalAmountCurrency__.SetCustomQuery(distinctQuery, distinctQuery, distinctQuery, null);
						Controls.TotalAmountCurrency__.SetDisplayedColumns("CurrencyFrom__");
			*/
		}
	};

	return customization;
});
