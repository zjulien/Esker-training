/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.VendorPortal.Customization library
 * @namespace Lib.VendorPortal.Customization
 */

/* LIB_DEFINITION
{
	"name": "Lib_VendorPortal_Customization_Server",
	"libraryType": "LIB",
	"scriptType": "SERVER",
	"comment": "Custom library extending Purchase Requisition scripts on server side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "VendorPortal.Customization", function ()
{
	/**
	 * @lends Lib.VendorPortal.Customization
	 */
	var customization = {
		/**
		* Allows you to override email options or deactivate vendor notifications sending.
		* @memberof Lib.VendorPortal.Customization.Server
		* @param {object} emailOptions Notification email options which can be modified
		* @returns {boolean} false, to deactivate email sending.
		* @example
		* <pre><code>
		* OnSendVendorNotification: function (emailOptions)
		* {
		* 		if (emailOptions.subject.key == "_Customer invoice received" )
		*		{
		*			// Deactivate vendor notification for new invoices
		*			return false;
		*		}
		* 		else if (emailOptions.subject.key == "_Customer invoice rejected")
		*		{
		*			// Add a custom tag to be used in a custom email template for rejected invoices
		*			emailOptions.template = "Custom_NewInvoice_XX.htm";
		*			emailOptions.customTags.AdditionalNote = Lib.AP.VendorPortal.GetCurrentUser().GetVars().GetValue_String("AdditionalField1", 0);
		*		}
		* }
		* </code></pre>
		*/
		OnSendVendorNotification: function (emailOptions)
		{
		},

		/**
		* Allows you to override email options or deactivate vendor notifications sending for the conversation panel.
		* @memberof Lib.VendorPortal.Customization.Server
		* @param {string} msg The message of the notification.
		* @param {string} type Category of the message, in the form of a number. Establishes a prior convention to use a set of values for this field.
		* @returns {boolean} false, to deactivate email sending.
		* @example
		* <pre><code>
		* OnSendVendorConversationNotification: function (type)
		* {
		* 		if (type == "20" )
		*		{
		*			// Deactivate vendor notification for new receiption
		*			return false;
		*		}
		* }
		* </code></pre>
		*/
		OnSendVendorConversationNotification: function (type)
		{
		}
	};
	return customization;
});
