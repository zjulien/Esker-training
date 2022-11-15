/**
 * @file Lib.DD.Customization.HTMLScripts library: HTML (custom script) DD customization callbacks
 */

/**
 * Package DD HTML page script customization callbacks for all processes
 * @namespace Lib.DD.Customization.HTMLScripts
 */

///#GLOBALS Lib
var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.HTMLScripts = (function ()
{
	/**
	 * @lends Lib.DD.Customization.HTMLScripts
	 */
	var customization = {
		/**
		 * This function will be called at the end of SenderForm HTML page script.
		 * If needed, use it to customize the SenderForm user interface.
		 */
		CustomizeSenderForm: function ()
		{
		},

		/**
		 * This function will be called at the end of Splitting HTML page script.
		 * If needed, use it to customize the Splitting user interface.
		 */
		CustomizeSplitting: function ()
		{
		},

		/**
		 * This function is used to hide the checkbox 'Enable touchless'.
		 * @example
		 * // Hide the checkbox for orders
		 * return documentType === "Order";
		 * @param {string} documentType - document type of the attached document.
		 * @returns {boolean} If true the checkbox will be hidden
		 */
		HideTouchLessCheckbox: function (documentType)
		{
			//For now, the feature is not activated by default
			return true;
		},

		/**
		 * This function is used to customize controls depending on the document type.
		 * @example
		 * // Hide the Customer Number field (custom field) for nor Order document type
			var documentType = Controls.Document_type__.GetValue();
			Controls.CF_1715a24459c_Customer_Number__.Hide(documentType !== "Order");
		 */
		OnDocumentTypeChanged: function ()
		{
		}

	};

	return customization;
})();
