/* LIB_DEFINITION
{
	"name": "Lib_O2C_Customization_User",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"versionable": false,
	"comment": "all User customization function"
}
*/

/**
 * Package O2C User customization callbacks
 * @namespace Lib.O2C.Customization.User
 */

///#GLOBALS Lib
var Lib = Lib || {};
Lib.O2C = Lib.O2C || {};
Lib.O2C.Customization = Lib.O2C.Customization || {};

Lib.O2C.Customization.User = (function ()
{
	/**
	* @lends Lib.O2C.Customization.User
	*/
	var customization = {
		/**
		 * Function called before automatically creating a non-existing customer using data extracted from the invoice, credit application or document
		 * Used to override the login user
		 * @param {Object} userProperty Object representing the default customer properties to access.
		 * @example Compute login with customer number and company code 
		 * <pre><code>CustomizePortailUserLogin: function(userProperty)
		 * {
		 *	return userProperty.companyCode + userProperty.portailId;
		 * }
		 * </code></pre>
		 */
		CustomizePortailUserLogin: null,

		/**
		* Function called for retrieve customer login when we are customized login
		* @param {Function} callback A callback function with login in paramter
		* @example Retrieve customer login when uniqueness is company code and customerId
		* <pre><code>GetCustomerWhenLoginIsCustomized: function(callback)
		* {
		*	var customerNumber= "";
		*	if (Data.GetValue("Customer_ID__"))
		*	{
		*		customerNumber = Data.GetValue("Customer_ID__");
		*	}
		*	else if (Data.GetTable("Table_invoice_lines__"))
		*	{
		*		customerNumber = Data.GetTable("Table_invoice_lines__").GetItem(0).GetValue("Col_invoice_customer_id__");
		*	}
		*	else if (Data.GetValue("Recipient_ID__"))
		*	{
		*		customerNumber = Data.GetValue("Recipient_ID__");
		*	}
		*	var filter = "(&(IsCompany__=1)(BusinessPartnerId__="+customerNumber.toLowerCase()+"))";
		*	Sys.GenericAPI.Query("Customer_Extended_Delivery_Properties__", filter, ["CustomerID__"], function (records, error)
		*	{
		*		var login = "";
		*		if (!error && records.length !== 0)
		*		{
		*			login = records[0]["CustomerID__"];
		*		}
		*		callback(login);
		* });
		* </code></pre>
		*/
		GetCustomerWhenLoginIsCustomized: null

	};
	return customization;
})();

