/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.VM.Customization.Server library
 * @namespace Lib.VM.Customization.Server
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.VM = Lib.VM || {};
Lib.VM.Customization = Lib.VM.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.VM.Customization.Server
	 */
	parentLib.Server =
	{
		/**
		* Function called in scheduled task "VM - Score polling"
		* This function allows to customize the filter applied on the AP - Vendors table
		* This filter is used to select which vendors will have their failure score updated
			*
		* @memberof Lib.VM.Customization.Server
		* @returns {string} the customized filter
		* @example
		* <pre><code>
		* GetExtraFilterForVendorFailureRiskSynchronization: function()
		* {
		*	return Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", "US01");
		*
		* }
		* </code></pre>
		*/
		GetExtraFilterForVendorFailureRiskSynchronization: function ()
		{
			// Customization not implemented in sample package library
		},
		/**
		 * Alerting function customize alerts displayed in gauge
		 * @memberof Lib.VM.Customization.Server
		 * @property {object} args - object with all data needed
		 * @property {object} args.storedScore - Previous score from a customer
		 * @property {object} args.updatedScore - New score from a customer
		 * @property {object} args.alerts - Default alerts
		 * @returns {any} Object representing the alerts to display below gauges.
		 * @example
		 * <pre><code>
		 * Alerting: function (args)
		 * {
		 *		args.alerts.list.push([{
		 *				key: "credit limit change"
		 *			},
		 *			{
		 *				key: "_score change from {0} to {1}",
		 *				parameters: [10, 3]
		 *			}]);
		 *		args.alerts.indicator = "favourable";
		 *		return args.alerts;
		 * }
		 * </code></pre>
		 */
		Alerting: function (/*args*/)
		{ }
	};
})(Lib.VM.Customization);
