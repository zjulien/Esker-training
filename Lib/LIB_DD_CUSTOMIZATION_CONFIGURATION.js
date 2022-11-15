/* LIB_DEFINITION
{
	"name": "LIB_DD_CUSTOMIZATION_CONFIGURATION",
	"libraryType": "LIB",
	"scriptType": "SERVER",
	"comment": "PS configurations made with wizard customization functions",
	"require": [ ]
}
*/

/**
 * Package DD configuration sellection callbacks
 * @namespace Lib.DD.Customization.Configuration
 */

///#GLOBALS Lib
var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.Configuration = (function ()
{
	/**
	 * @lends Lib.DD.Customization.Configuration
	 */
	var Configuration =
	{
		/**
		 * This function will be called at the end of the validation script of the SUPI
		 * when your input file is a XML and you try to generate the corresponding PDF.
		 * It's expected to return a file path corresponding to your formatting template
		 * @param {object} context with the following 2 getters  GetSenderUser() and GetRecipientUser()
		 */
		GetFormattingTemplate: function (context)
		{
			return null;
		},

		/**
		 * This function will be called when extraction script of the sender copy is finished.
		 * It's expected to return files used to format document and according PDFCommand options to resize or change position of backgrounds images choose in wizard.
		 * @param {object} contains the backgrounds parameters:
		 * {
		 * 		enabled : true/false,
		 * 		first: {
		 * 			enabled: true/false,
		 * 			file: "%Images%\\firstpage.jpg",
		 * 			options: "-jpegres"
		 * 		},
		 * 		front: {
		 * 			file: "%Images%\\frontpage.jpg",
		 * 			options: "-jpegres"
		 * 		},
		 * 		back: {
		 * 			enabled: true/false,
		 * 			file: "%Images%\\backpage.jpg",
		 * 			options: "-jpegres"
		 * 		}
		 * 	}
		 * file is the virtual path to resource (only JPG are supported) and options are PDFCommands options.
		 */
		GetBackgrounds: function (backgrounds)
		{
			return null;
		},
		/**
		 * This function will be called when extraction script of the sender copy is finished.
		 * It's expected to return recipient terms and conditions document and/or change position of terms and conditions file choose in wizard.
		 * @param {object} contains the terms parameters:
		 * 	{
		 * 		enabled : true/false,
		 * 		file: "%Misc%\\terms.pdf",
		 * 		position: "FIRST"/"LAST"/"EACH"
		 * 	}
		 * file is the virtual path to resource. Only PDF are supported.
		 * @example
		 * <pre><code>
		 * 	GetTermsAndConditions: function (terms)
		 * 	{
		 * 		// set the terms and condition template depending on the current date
		 * 		var currentYear = new Date().getFullYear().toString();
		 * 		terms.file = "%Misc%\\terms_" + currentYear + ".pdf";
		 * 		terms.position = "FIRST";
		 * 	}
		 * </code></pre>
		 */
		GetTermsAndConditions: function (terms)
		{
			return null;
		},

		/**
		 * This function is called the first time a parameter is queried, in order to know which configuration should be addressed
		 * @return {string} the name of the configuration to use
		 * @example
		 * <pre><code>
		 *	CustomizeConfiguration: function () {
		 *		return "My configuration";
		 * }
		 * </code></pre>
		 */
		/*CustomizeConfiguration: function ()
		{
			return null;
		},*/

		/**
		 * This function is called to modify the conversation settings of the current configuration.
		 * @param {object} conversation settings (member 'conversations' of the additional settings object )
		 * {
		 * 	"relatedFormName": "CDNAME#Customer Order Processing",
		 * 	"relatedFormIdentifierName": "Sales_Order_Number__",
		 * 	"conversationTableName": "ConversationCOP__",
		 * 	"emailTemplateName": "Notify_Order_Conversation_NewMessage_Alternate.htm"
		 * }
		 * @return nothing
		 * @example
		 * <pre><code>
		 *	ModifyConversationSettings: function (settings) {
		 *		settings.emailTemplateName = "MyEmailTemplate.htm"
		 * }
		 * </code></pre>
		 */
		ModifyConversationSettings: function (settings)
		{
		}
	};
	return Configuration;
})();
