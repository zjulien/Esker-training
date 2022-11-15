/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_VENDORPORTAL_HTMLSCRIPTS",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "Client Script Vendor Portal AP customization",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.VendorPortal.HTMLScripts library
 * @namespace Lib.AP.Customization.VendorPortal.HTMLScripts
 */


// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};
Lib.AP.Customization.VendorPortal = Lib.AP.Customization.VendorPortal || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.VendorPortal.HTMLScripts
	 */
	parentLib.VendorPortal.HTMLScripts =
	{
		/**
		* This user exit is called at the end of the HTML page script of the Vendor Portal Customer Invoice.
		* Allows you to customize layout settings of the Vendor invoice process.
		* If you need to customize callback functions associated with control events, refer to HTML page script API: Control events.
		*
		* This example allows you to customize different options in conversations, for example :
		*  - the list of recipient for the conversation with the option "recipientList"
		*  - the email template to use with the option "emailTemplate"
		*  - custom tags with the option "emailCustomTags"
		* @memberof Lib.AP.Customization.VendorPortal.HTMLScripts
		* @example
		* <pre><code>
		* OnHTMLScriptEnd: function ()
		* {
		*	 var options =
		*	 {
		*		ignoreIfExists: false,
		*		notifyByEmail: true,
		*		notifyAllUsersInGroup: false,
		*		recipientList: ["cfoprocess.wegeneren@esker.com","buyerprocess.wegeneren@esker.com"],
		*		emailTemplate: "Conversation_MissedItem_Custom.htm",
		*		emailCustomTags: {
		*			DocumentNumber: Data.GetValue("Invoice_number__")
		*		},
		*		externalContributors: [
		*		{
		*			emailAddress: "prunelle@example.com",
		*			emailSubject: "email to Prunelle",
		*			emailTemplate: "notifPrunelle.htm"
		*		},
		*		{
		*			emailAddress: "test2@example.com"
		*		}]
		*	};
		*	Controls.ConversationUI__.SetOptions(options);
		* }
		*/
		OnHTMLScriptEnd: function ()
		{
		},

		/**
		 * This user exit is called at the end of the HTML page script of the Vendor Portal Customer Order.
		* @memberof Lib.AP.Customization.VendorPortal.HTMLScripts
		* @example
		* <pre><code>
		* OnHTMLScriptEnd: function ()
		* {
		*	// Display a button that creates a new process
		*	Controls.ServiceEntrySheet__.Hide(false);
		*	Controls.ServiceEntrySheet__.SetDisabled(false);
		*	Controls.ServiceEntrySheet__.OnClick = function ()
		*	{
		*		Process.CreateProcessInstance("Service entry sheet");
		*	}
		* }
		* </code></pre>
		 */
		OnCustomerOrderHTMLScriptEnd: function ()
		{
		}
	};
})(Lib.AP.Customization);
