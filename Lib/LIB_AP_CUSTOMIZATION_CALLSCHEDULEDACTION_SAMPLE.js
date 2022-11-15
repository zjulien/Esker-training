/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_CALLSCHEDULEDACTION",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Call scheduled action customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.CallScheduledAction
 */

/**
 * CallScheduledAction customization callbacks
 * @namespace Lib.AP.Customization.CallScheduledAction
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.CallScheduledAction
	 * @namespace Lib.AP.Customization.CallScheduledAction
	 * @memberof Lib.AP.Customization
	 */
	parentLib.CallScheduledAction =
	{
		/**
		* @memberof Lib.AP.Customization.CallScheduledAction
		* @param {Map<actionName,function(Lib.CallScheduledAction.ScheduledAction):boolean>} defaultMapping (default) the default pre-steps mapping from actionName key and validation callback.
		* if the callback returns true, the action will be called, else if the action returns false the actions is not called.
		* @return {Map<actionName,function(Lib.CallScheduledAction.ScheduledAction):boolean>}  the overriden mapping object
		* @example
		* <pre><code>
		* GetIsActionCallableMapping: function (defaultMapping)
		* {
		*		defaultMapping["MyCustomAction"] = function (scheduledAction)
		*		{
		*			if(!scheduledAction.parameters["InvoiceStatus__"] || scheduledAction.parameters["InvoiceStatus__"].length === 0)
		*			{
		*				return true;
		*			}
		*
		*			var query = Process.CreateQueryAsProcessAdmin();
		*			query.SetFilter("MsnEx=" + scheduledAction.msnEx);
		*			if (query.MoveFirst())
		*			{
		*				var trn = query.MoveNext();
		*				if (trn)
		*				{
		*					var vars = trn.GetVars(false);
		*					var statusFound = false;
		*
		*					for(var i = 0; i < scheduledAction.parameters["InvoiceStatus__"].length;++i)
		*					{
		*						if(scheduledAction.parameters["InvoiceStatus__"][i] === vars.GetValueAsString("InvoiceStatus__"))
		*						{
		*							// Inhibit the action call because the invoice is already in the expected status
		*							return false;
		*						}
		*					}
		*				}
		*			}
		*			return true;
		*		};
		*		return defaultMapping;
		* }
		* </code></pre>
		*/
		GetIsActionCallableMapping: function (defaultMapping)
		{
			return null;
		}
	};
})(Lib.AP.Customization);
