/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_WIZARD",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) AP wizard customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.Wizard library: HTML (custom script) AP customization callbacks
 */

/**
 * Package AP HTML page script customization callbacks for all processes
 * @namespace Lib.AP.Customization.Wizard
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.Wizard
	 */
	parentLib.Wizard =
	{
		/**
		 * Allows you to define custom user exists added for this customer
		 * Functions defined in this scope will be accessible from outside this library
		 * They can be called the following way Lib.AP.Customization.CustomUserExits.OnCompanyCodeChange(queryResult)
		 *  @example
		 * <pre><code>
		 * CustomUserExits:
		 * {
		 *		OnCompanyCodeChange: function (queryResult)
		 *		{
		 *			//Call a business function to handle the custom behavior to be applied
		 *			//See CustomHelpers object definition below
		 *			CustomHelpers.HandleVendorWarning();
		 *		}
		 * },
		 * </code></pre>
		 */
		CustomUserExits:
		{
		},

		/**
		 * Specifics customization for the SAP and Generic AP Wizard
		 * @namespace Lib.AP.Customization.Wizard.Common
		 * @memberof Lib.AP.Customization.Wizard
		 */
		Common:
		{
			/**
			 * OCRLanguageDefinition
			 * @memberof Lib.AP.Customization.Wizard.Common
			 * @typedef {Object} OCRLanguageDefinition
			 * @property {number} value - OCRLanguage language code
			 * @property {string} key - OCRLanguage translation key
			 */

			/**
			* Allows you to customize OCR languages list show in the comboBox of the OCR parameters.
			* @memberOf Lib.AP.Customization.Wizard.Common
			* @param {OCRLanguageDefinition[]} defaultOCRLanguagesList default OCR languages supported.
			* @return {OCRLanguageDefinition[]} customized list to be shown in the OCR languages comboBox.
			* @example
			* <pre><code>
			* CustomizeOCRLanguagesList: function (defaultOCRLanguagesList)
			* {
			*	defaultOCRLanguagesList.push({ value: "_Danish", key: 7 });
			*	return defaultOCRLanguagesList;
			* }
			* </code></pre>
			*/
			CustomizeOCRLanguagesList: function (defaultOCRLanguagesList)
			{
			},

			/**
			 * Allow you to customize and personalize the Customization step pane in the wizard
			 *  @param step The configurator's Customization step
			 *  @see https://doc.esker.com/EskerOnDemand/cv_ly/en/Manager/StartPage.htm#cshid=2547
			 *  @example
			 * <pre><code>
			 * CustomizeStep: function(step)
			 * {
			 *		// Use isVisible to determin if Customizations pane should be shown
			 *		step.isVisible = function() {
			 *			 return true;
			 *		};
			 *
			 *		// Use onStart to initialize the pane, declare OnChanges, ...
			 *		step.onStart = function () {
			 *			var customizationPanel = step.panels[0];
			 *			customizationPanel.SetText("My custom title");
			 *			var myTextField_defaultValue = "This is the default";
			 *			if(Data.IsNullOrEmpty("myTextField__"))
			 *			{
			 *				Data.SetValue("myTextField__", myTextField_defaultValue);
			 *			}
			 *		};
			 *
			 *		// Use onQuit to validate the data entered by the user
			 *		// - returning true allows saving or moving to the previous wizard steps
			 *		// - returning false silently prevents leaving the page (via Previous or Save buttons)
			 *		// In that case, be sure to explicit the reason with a message/warning for the user to know about it
			 *		step.onQuit = function () {
			 *			var allIsOk = true;
			 *			return allIsOk;
			 *		};
			 * }
			 * </code></pre>
			 */
			CustomizeStep: function (step)
			{
			},

			/**
			 * Allow you to customize and personalize the Customization step pane in the global wizard
			 *  @param step The configurator's Customization step
			 *  @see https://doc.esker.com/EskerOnDemand/cv_ly/en/Manager/StartPage.htm#cshid=2547
			 *  @example
			 * <pre><code>
			 * CustomizeGlobalStep: function(step)
			 * {
			 *		// Use isVisible to determin if Customizations pane should be shown
			 *		step.isVisible = function() {
			 *			 return true;
			 *		};
			 *
			 *		// Use onStart to initialize the pane, declare OnChanges, ...
			 *		step.onStart = function () {
			 *			var customizationPanel = step.panels[0];
			 *			customizationPanel.SetText("My custom title");
			 *			var myTextField_defaultValue = "This is the default";
			 *			if(Data.IsNullOrEmpty("myTextField__"))
			 *			{
			 *				Data.SetValue("myTextField__", myTextField_defaultValue);
			 *			}
			 *		};
			 *
			 *		// Use onQuit to validate the data entered by the user
			 *		// - returning true allows saving or moving to the previous wizard steps
			 *		// - returning false silently prevents leaving the page (via Previous or Save buttons)
			 *		// In that case, be sure to explicit the reason with a message/warning for the user to know about it
			 *		step.onQuit = function () {
			 *			var allIsOk = true;
			 *			return allIsOk;
			 *		};
			 * }
			 * </code></pre>
			 */
			CustomizeGlobalStep: function (step)
			{
			}
		}
	};


	/**
	 * To define custom functions corresponding to business behaviors:
	 * Create a object in which Functions defined in this scope will only be accessible within this library
	 * They can be called the following way CustomHelpers.MyCustomHelper()
	 * New objects can be defined to isolate several functions linked to a feature (i.e. : VendorHelpers)
	 *  @example
	 * <pre><code>
	 * var CustomHelpers =
	 * {
	 *		HandleVendorWarning: function ()
	 *		{
	 *			if (Sys.Helpers.IsEmpty(Data.GetValue("VendorNumber__"))
	 *			{
	 *				Popup.Snackbar({message: "Please select a vendor", status: "warning", timeout: "6000"});
	 *			}
	 *		}
	 * };
	 * </code></pre>
	 */
	// Uncomment here
	// var CustomHelpers =
	// {
	// };


})(Lib.AP.Customization);
