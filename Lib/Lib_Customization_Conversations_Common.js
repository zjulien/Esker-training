/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION
{
	"name": "Lib_Customization_Conversations_Common",
	"libraryType": "LIB",
	"scriptType": "Common",
	"comment": "Common customization for external conversations (conversations with the customer)",
	"require": []
}
*/

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.Customization = Lib.Customization || {};
Lib.Customization.Conversations = Lib.Customization.Conversations || {};

/**
 * @namespace Lib.Customization.Conversations.Common
*/
Lib.Customization.Conversations.Common = (function ()
{
	/**
	 * @lends Lib.Customization.Conversations.Common
	 */
	var customization = {
		/**
		 * @namespace
		 */
		/**
		 * @description This function will be called when sending an message in an external conversation (conversations with the customer).
		 * It allows you to change the email address that will be used when the customer tries to reply to the conversation from his emails.
		 * The "Reply to" will be the email address returned by this function instead of the technical Esker one.
		 * BE CAREFUL: if you use this user exit, you will have to add a routing between the new email address and the default Esker one, either a redirection or alias. Forwading the email will not work.
		 * @returns {string} The wanted "Reply to" email address
		 *
		 * @example
		 * <pre><code>function ChangeReplyToEmailAddress()
		 * {
		 *		return "myEmailAddress@email.com";
		 * }</code></pre>
		 **/
		ChangeReplyToEmailAddress: function ()
		{
			return "";
		}
	};

	return customization;
})();
