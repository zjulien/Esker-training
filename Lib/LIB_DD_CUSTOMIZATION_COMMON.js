/* LIB_DEFINITION{
  "name": "LIB_DD_CUSTOMIZATION_COMMON",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "PS configurations that can be used in all scripts",
  "require": [
    "[Lib_DD_Common_V12.0.461.0]"
  ]
}*/

/**
 * Package DD common user exits
 * @namespace Lib.DD.Customization.Common
 */

///#GLOBALS Lib
var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.Common = (function ()
{
	/**
	 * @lends Lib.DD.Customization.Common
	 */
	var Common =
	{
		/**
		 * This function is called to set unique client ID for AI model.
		 * This function can be used to separate AI model for DEV/QA/PROD environment in the same account, or any other criteria.
		 * Be aware to only use lowercase alphanumeric character for unique ID except if using ACS classifier.
		 * Main account ID is concatenated to the client ID returned by this function.
		 * If it returns an empty string, only one model will exist for this client because we will only use the main account id.
		 * The exception for this is with the Azure Cognitive Services. We always use the main account id and sub account id to isolate models, to whom we concatenate the client Id.
		 * @return {string} Unique client ID
		 * @example
		 * <pre><code>
		 *	SetClientId: function () {
		 *		return "dev";
		 * }
		 * </code></pre>
		 */
		SetClientId: function ()
		{
			return "";
		}
	};
	return Common;
})();
