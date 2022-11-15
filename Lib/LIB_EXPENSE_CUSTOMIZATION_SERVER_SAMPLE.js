/**
 * @file Lib.Expense.Customization.Server library: server script Expense customization callbacks
 */

/**
 * Package Expense Server script customization callbacks
 * @namespace Lib.Expense.Customization.Server
 */

/* LIB_DEFINITION
{
	"name": "Lib_Expense_Customization_Server",
	"libraryType": "LIB",
	"scriptType": "SERVER",
	"comment": "Custom library extending Expense scripts on server side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Expense.Customization.Server", function ()
{
	/**
	 * @lends Lib.Expense.Customization.Server
	 */
	var customization = {
		/**
		* This function is called when the validation script executes an unknown action.
		* User can simply add any custom action treatment here.
		* @param {string} currentAction name of the executed action
		* @param {string} currentName sub-name of the executed action
		* @returns {boolean} returns true if this action has been treated otherwise false.
		* @example
		* <pre><code>
		* OnUnknownAction: function (currentAction, currentName)
		* {
		* 	Log.Error(currentAction + "-" + currentName);
		* }
		* </code></pre>
		*/
		OnUnknownAction: function (currentAction, currentName)
		{
			return false;
		},

		/**
		* Allows you to customize the value of the fields available in the Expense process.
		* This function will be called at the end of Expense extraction script.
		* @example
		* <pre><code>
		* OnExtractionScriptEnd: function ()
		* {
		* 	Log.Error(currentAction + "-" + currentName);
		* }
		* </code></pre>
		*/
		OnExtractionScriptEnd: function ()
		{

		},

		/**
		 * @description Allows you to retrieve the next document number based on a customized numbering sequence. This user exit is called in the validation script.
		 * @version 5.164 and higher
		 * @memberof Lib.Expense.Customization.Server
		 * @function GetNumber
		 * @param {string} defaultSequenceName String value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
		 * @param {string} prefix prefix added by default
		 * @returns {string} String value containing the next number from your customized sequence.
		 * @example
		 * For example, when using the US01 and FR01 company codes with the above script, you could get the following numbering: US01-0001, US01-0002, US01-0003, FR01-0001, US01-0004, FR01-0002, etc.
		 * <pre><code>
		 *	GetNumber: function (defaultSequenceName, prefix)
		 *	{
		 *		var number = "";
		 *		var companyCode = Data.GetValue("CompanyCode__");
		 *		var ReqNumberSequence = Process.GetSequence(defaultSequenceName);
		 *		number = ReqNumberSequence.GetNextValue();
		 *		if (number === "")
		 *		{
		 *			Log.Info("Error while retrieving a number");
		 *		}
		 *		else
		 *		{
		 *			number = companyCode + "-" + Sys.Helpers.String.PadLeft(number, "0", 4);
		 *			Log.Info("Number: " + number);
		 *		}
		 *		return number;
		 *	}
		 * </code></pre>
		 * 
		*/

		/*
		GetNumber: function (defaultSequenceName, prefix)
		{
			// Must return something
		},
		*/

		/**
		 * Allows you to modify the email notifications in the Expense process.
		 * This user exit is called before sending the notification.
		 * You can choose to not send the notification by returning false for some notification.
		 * @param { json } emailOptions
		 * emailOptions structure: {
		 * 	userId: ,
		 *  emailAddress: ,
		 * 	subject: ,
		 * 	template: ,
		 * 	customTags: ,
		 * 	escapeCustomTags: true,
		 * 	fromName: "Esker Expense management"
		 * };
		 * @returns { boolean } false to indicate that the notification should not be sent or true to indicate that the notification should be sent.
		 * 
		 * This user exit sets the sender name.
		 * @example
		 * <pre><code>
		 * OnSendEmailNotification: function (emailOptions)
		 * {
		 *	 emailOptions.fromName = "Expense Management Notifier";
		 *	 return true;
		 * }
		 * </code></pre>
		 */
		OnSendEmailNotification: function (emailOptions)
		{
		}
	};

	return customization;
});
