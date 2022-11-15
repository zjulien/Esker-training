/**
 * @file Lib.Budget.Customization.Common library: common script Budget customization callbacks
 */

/**
 * Package Budget common script customization callbacks
 * @namespace Lib.Budget.Customization.Common
 */

/* LIB_DEFINITION
{
	"name": "Lib_Budget_Customization_Common",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"comment": "Custom library extending Budget scripts on common side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Budget.Customization.Common", function ()
{
	/**
	 * @lends Lib.Budget.Customization.Common
	 */
	var customization = {

		/**
		 * @typedef budgetColumnValue
		 * @type {object}
		 * @property {any} value the value to return 
		 * @property {boolean} optional if the value can be empty you must set optional to true
		 */

		/**
		 * Allows you to override a budget column value
		 * Can be used to change budget column value corresponding to some conditions.
		 * @param {string} budgetColumn budget column name
		 * @param {object} documentData header document data
		 * @param {object} itemData data of the item
		 * @param {object} sourceTypeConfig the sourcetype config
		 * @returns {budgetColumnValue|any} can be an object to define some options or directly the value to return
		 * 
		 * @description CLIENT_WEB|CLIENT_MOBILE|SERVER
		 * 
		 * @example This sample function allows you to replace the Cost Center budget column value by the value of the custom field Z_Customfield where Z_Customfield can be empty.
		 * <pre><code>
		 * GetCustomBudgetColumnValue: function(budgetColumn, documentData, itemData, sourceTypeConfig)
		 * {
		 * 	if (budgetColumn === "CostCenter__")
		 * 	{
		 * 		return
		 * 		{
		 * 			value: documentData.GetValue("Z_Customfield"),
		 *			optional: "true"
		 *		};
		 * 	}
		 * 	return null;
		 * }
		 * </code></pre>
		 */
		GetCustomBudgetColumnValue: function (budgetColumn, documentData, itemData, sourceTypeConfig)
		{
			return null;
		},

		/**
		 * @typedef BudgetVisibilityOptions
		 * @type {object}
		 * @property {string} login login of user on which we retrieve validation keys on budget
		 * @property {string[]} validationKeys precomputed validation keys on budget. Skip query.
		 * @property {string[]} validationKeyColumns array of budget columns composing the validation
		 * key on budget (joined with '_'). By default ["CompanyCode__", "CostCenter__"].
		 */

		/**
		 * Allows you to override the validation keys (user rights) for the user identified by options.login.
		 * Can be used to customize the storage/computation of the validation keys. By default stored in User.additionalField4.
		 * This method can be synchronous or asynchronous according to the returned value.
		 * @param {BudgetVisibilityOptions} options 
		 * @returns {string[]|Promise} custom validation keys are returned directly (synchronous mode) or by the resolved promise (asynchronous mode)
		 * 
		 * @description CLIENT_WEB|CLIENT_MOBILE|SERVER
		 * 
		 * @example This sample function allows you to retrieve the budget validation keys in several fields of User table.
		 * <pre><code>
		 * GetCustomUserBudgetRights: function(options)
		 * {
		 * 	var queryOptions = {
		 * 		table: "ODUSER",
		 * 		filter: "Login=" + options.login,
		 * 		attributes: ["AdditionalField1", "AdditionalField4"]
		 * 	};
		 * 	return Sys.GenericAPI.PromisedQuery(queryOptions)
		 * 		.Then(function(records)
		 * 		{
		 * 			if (records.length > 0)
		 * 			{
		 * 				var validationKeys = [];
		 * 				queryOptions.attributes.forEach(function(field) {
		 * 					var fieldValue = records[0][field];
		 * 					if (fieldValue)
		 * 					{
		 * 						Array.prototype.push.apply(validationKeys, fieldValue.split(";"));
		 * 					}
		 * 				});
		 * 				return validationKeys;
		 * 			}
		 * 			else
		 * 			{
		 * 				throw ("Unable to find any user with the specified login, table: ODUSER, login: " + options.login);
		 * 			}
		 * 		})
		 * 		.Catch(function(error)
		 * 		{
		 * 			Log.Error("An error occured while get custom budget rights. Details: " + error);
		 * 			return []; // no rights
		 * 		});
		 * }
		 * </code></pre>
		 */
		GetCustomUserBudgetRights: function (options)
		{
			return null;
		}
	};

	return customization;
});
