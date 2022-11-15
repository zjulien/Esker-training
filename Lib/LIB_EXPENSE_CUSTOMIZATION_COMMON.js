/**
 * @file Lib.Expense.Customization.Common library: common script Expense customization callbacks
 */

/**
 * Package Expense Common script customization callbacks
 * @namespace Lib.Expense.Customization.Common
 */

/* LIB_DEFINITION
{
	"name": "Lib_Expense_Customization_Common",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"comment": "Custom library extending Expense scripts on client or server side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Expense.Customization.Common", function ()
{
	/**
	 * @lends Lib.Expense.Customization.Common
	 */
	var customization = {
		/**
		* Allows you to customize the expense status when saving the Expense process.
		* This function is called from the HTML Page script and the validation script of the Expense process, when saving the Expense.
		* @returns {boolean} returns true if the expense could be set to ToSubmit status otherwise false and status is set to Draft.
		*
		* @example
		* For this example the library : Lib.Expense.LayoutManager must be included to perform the initial "to submit" check of the expense form.
		* This user exit prevents the submission of business meal expenses if the custom field Z_NumberOfGuest__ is empty or 
		* if the initial checking function (see initialExpenseFormCheck variable) return false.
		* <pre><code>
		* IsToSubmitExpense: function ()
		* {
		*	var initialExpenseFormCheck = Lib.Expense.LayoutManager.CheckAllLayoutRequiredFields() && Lib.Expense.LayoutManager.CheckFieldsValidity();
		*	if (Data.GetValue("ExpenseType__") === "Business Meals") // For the US01 Company Code
		*	{
		*		if(!Data.GetValue("Z_NumberOfGuest__"))
		*		{
		*			Data.SetError("Z_NumberOfGuest__", "The number of guest must be completed.");
		*			return (false);
		*		}
		*	}
		*	return (initialExpenseFormCheck);
		* }
		* </code></pre>
		*/
		IsToSubmitExpense: function ()
		{
		},

		/**
		* Allows you to determine who is allowed to create expenses on behalf of another user.
		* This function is called when you click the + button on the mobile "Expenses" screen.
		* In addition to this user exit, you have to declare this library in the "customLibs" parameter of
		* the mobile app customization JSON file.
		*
		* CLIENT_WEB|CLIENT_MOBILE|SERVER
		*
		* @returns {boolean|Promise} returns true (or a promise resolved to true) if the current user is
		* allowed to create an expense on behalf of another user.
		*
		* @example
		* In this example, a user is allowed to create expenses on behalf of another user
		* if the ODUSER field "AdditionalField1" contains the flag "ExpenseOnBehalfOfEnabled".
		* <pre><code>
		*  IsAllowedToCreateExpenseOnBehalfOf: function()
		*  {
		*  	return Sys.Helpers.Promise.Create(function(resolve, reject)
		*  	{
		*  		var filter = "Login=" + Sys.Helpers.Globals.User.loginId;
		*  		Sys.GenericAPI.Query("ODUser", filter, ["AdditionalField1"], function (records, error)
		*  		{
		*  			if (error || records.length === 0)
		*  			{
		*  				Log.Error("Cannot retrieve user info, login: " + Sys.Helpers.Globals.User.loginId);
		*  				reject(false);
		*  			}
		*  			else
		*  			{
		*  				resolve(/\bExpenseOnBehalfOfEnabled\b/i.test(records[0].AdditionalField1));
		*  			}
		*  		});
		*  	});
		*  }
		* </code></pre>
		*/
		IsAllowedToCreateExpenseOnBehalfOf: function ()
		{
			return Sys.Helpers.Globals.User.loginId.toUpperCase().startsWith("PAPROCESS.");
		},

		/**
		* Implement this function to provide an user-specific exchange rate whenever the process 
		* needs to calculate an amount from a currency (TotalAmountCurrency__) to the currency 
		* defined for the company (CompanyCode__).
		*
		* CLIENT_WEB|CLIENT_MOBILE|SERVER
		*
		* @returns {number|Promise} returns a number (or a promise resolved to number) representing
		* the user-specific exchange rate.
		*
		* @example
		* In the following example, the exchange rate of a currency depends on the date. A start 
		* date (StartDate__) has been added in the "P2P - Exchange rate__" table to indicate the
		* date from which the exchange rate is applied.
		* <pre><code>
		* GetCustomExchangeRate: function()
		* {
		*	var options =
		*	{
		*		table: "P2P - Exchange rate__",
		*		filter: "&(CompanyCode__=" + Data.GetValue("CompanyCode__") + ")" +
		*			"(CurrencyFrom__=" + Data.GetValue("TotalAmountCurrency__") + ")",
		*		attributes: [ "RatioFrom__", "RatioTo__", "Rate__" ],
		*		maxRecords: 1,
		*		sortOrder: "StartDate__ DESC"
		*	};
		*
		*	// !!! In mobile, for the moment, the value type of the control Date can be objet Date or
		*	// string of format 2019-11-26 after datePicker selection.
		*	var expenseDate = Data.GetValue("Date__");
		*	if (expenseDate)
		*	{
		*		if (expenseDate instanceof Date)
		*		{
		*			expenseDate = Sys.Helpers.Date.Date2DBDate(expenseDate);
		*		}
		*		options.filter += "(|(StartDate__!=*)(StartDate__<=" + expenseDate + "))";
		*	}
		*	return Sys.GenericAPI.PromisedQuery(options)
		*		.Then(function (results)
		*	  	{
		*			if (results && results.length > 0)
		*			{
		*				var r = results[0];
		*				return parseFloat(r["Rate__"]) * parseFloat(r["RatioTo__"]) / parseFloat(r["RatioFrom__"]);
		*			}
		*			return null;
		*		});
		* }
		* </code></pre>
		*/
		GetCustomExchangeRate: function ()
		{
			return null;
		},

		/**
		* Implement this function to provide an user-specific reimbursable amount
		* This function is called each time the fields TotalAmount__, ExchangeRate__, LocalAmount__, Refundable__ and ExpenseType__ are modified
		* (when the Refundable__ (Reimbursable) checkbox is checked).
		* This function is also called server-side when the user saves his expense to enforce the reimbursable amount.
		*
		* CLIENT_WEB|CLIENT_MOBILE|SERVER
		*
		* @returns {number|Promise} returns a number (or a promise resolved to number) representing
		* the user-specific reimbursable amount.
		*
		* @example
		* In the following example, the reimbursable amount is limited to 80 for hotels and full amount is used for other categories.
		* <pre><code>
		* GetCustomReimbursableAmount: function()
		* {
		*	// in Customize layout: fields ReimbursableLocalAmount__ and NonReimbursableLocalAmount__ are displayed
		*	var localAmount = Data.GetValue("LocalAmount__");
		*	var warningMsg = null, reimbursableAmount = localAmount;
		*	var expenseType = Data.GetValue("ExpenseType__");
		*	if (expenseType === "Hotel" || expenseType === "Hôtel") // US01 and FR01 demo data value for hotel
		*	{
		*		var nbNight = 1; // Retrieve it from a custom field
		*		if (localAmount/nbNight > 80)
		*		{
		*			warningMsg = "Refund is limited to 80$ per night";
		*			reimbursableAmount = 80 * nbNight;
		*		}
		*	}
		*
		*	if (Sys.ScriptInfo.IsClient())
		*	{
		*		Sys.Helpers.Globals.Controls.ReimbursableLocalAmount__.SetWarning(warningMsg);// used to set/reset warning message
		*	}
		*	return reimbursableAmount;
		* }
		* </code></pre>
		*/
		GetCustomReimbursableAmount: function ()
		{
			return null;
		}
	};

	return customization;
});
