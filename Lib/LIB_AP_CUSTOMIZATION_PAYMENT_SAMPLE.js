/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_PAYMENT",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "AP payment customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.Payment library: AP payment customization callbacks
 */

/**
 * Package AP payment customization callbacks.
 * Used in the 'Vendor invoice payment' and 'Vendor Invoice Payment (SAP)' processes.
 * @namespace Lib.AP.Customization.Payment
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.Payment
	 */
	parentLib.Payment =
	{

		/**
		* Use this function to specify the mapping between the ERP payment method and the possible values of the invoice payment method control.
		* Values are case sensitive and have to match the possible values of the Payment Method combo boxes of the Vendor invoice and
		* Customer invoice processes. By default the possible values are "Cash", "Check", "Credit card", "EFT" and "Other". You can customize and
		* add your own in the processes (additional values will be kept on update).
		* If an ERP code is not found in the mapping, the invoice payment method will be set to "Other".
		* @memberOf Lib.AP.Customization.Payment
		* @param {string} ERPName Name of the ERP.
		* @param {Object} paymentMethodMap Default payment method mapping for ERP <ERPName>.
		* @returns {Object} The modified paymentMethodMap
		* @example
		* <pre><code>
		* GetPaymentMethodMapping: function (ERPName, paymentMethodMap)
		* {
		*	if (ERPName === "SAP")
		*	{
		*		// Override the default mapping
		*		paymentMethodMap = {
		*			// All company codes section
		*			"*": {
		*				"C": "Check",
		*				"O": "Check",
		*				"S": "Check",
		*				"1": "Credit card",
		*				"4": "Credit card",
		*				"Y": "EFT"
		*			},
		*			// Company code specific mapping (overrides the * section)
		*			"2200": {
		*				"1": "Other"
		*			}
		*		};
		*	}
		*	return paymentMethodMap;
		* }
		* </code></pre>
		*/
		GetPaymentMethodMapping: function (ERPName, paymentMethodMap)
		{

		}
	};
})(Lib.AP.Customization);
