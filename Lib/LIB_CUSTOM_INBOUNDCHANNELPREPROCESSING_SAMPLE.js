/* LIB_DEFINITION{
  "name": "LIB_CUSTOM_INBOUNDCHANNELPREPROCESSING",
  "libraryType": "Lib",
  "scriptType": "COMMON"
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.Custom.InboundChannelPreprocessing library: Inbound Channel customizations
 */

/**
 * Package P2P Custom inbound channel preprocessing rules list
 * @namespace Lib.Custom.InboundChannelPreprocessing
 * @see [Managing email preprocessing rules]{@link https://doc.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#configuration/inbound_channels/email_preprocessing.html}
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.Custom = Lib.Custom || {};

Lib.Custom.InboundChannelPreprocessing = (function ()
{
	/**
	 * List of functions that will be added to the list of custom processings of a email preprocessing rule.
	 * @memberof Lib.Custom.InboundChannelPreprocessing
	 * @example
	 * <pre><code>
	 * "My rule name": function (inputJSON)
	 * {
	 * 	Log.Warn("Custom Rule - My rule name");
	 * 	// add custom processing here
	 * 	return inputJSON;
	 * },
	 * </code></pre>
	 */
	var functions = {

	};

	return {
		functions: functions
	};
})();
