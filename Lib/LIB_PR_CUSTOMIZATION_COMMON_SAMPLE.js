/**
 * @file Lib.PR.Customization.Common library: Common script Purchase Requisition customization callbacks
 */

/**
 * Package Purchase Requisition Common script customization callbacks
 *
 * Timeline of user exit calls
 * ------------------
 * <img src="img/PAC/Lib_PR_Customization_Common_TimeLine.png">
 * @namespace Lib.PR.Customization.Common
 */

/* LIB_DEFINITION
{
	"name": "Lib_PR_Customization_Common",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"comment": "Custom library extending Purchase Requisition scripts on Common side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "PR.Customization.Common", function()
{
	/**
	 * @lends Lib.PR.Customization.Common
	 */
	var customization = {


		/**
		 * Allows you to customize the validation settings for the Purchase requisition process.
		 * This user exit is called at the end of the validation script of the process.
		 * @memberof Lib.PR.Customization.Common
		 * @param {boolean} isFormValid The actual validation status of the form
		 * @returns {boolean|IPromise<boolean>} isFormValid The updated validation status of the form
		 * @example
		 * <pre><code>
		 * OnValidateForm: function(isFormValid)
		 * {
		 * 		if (Lib.Purchasing.LayoutPR.WorkflowControllerInstance.GetContributorsByRole("approver").length == 0)
		 *		{
		 *			Data.SetError("Reason__", "At least one approver is required before submit");
		 *			return false;
		 *		}
		 *		return isFormValid;
		 * }
		 * </code></pre>
		 */
		OnValidateForm: function(isFormValid)
		{
			return isFormValid;
		},

		/**
		 * User Exit used for Single Vendor Mode
		 * Allows you to define the vendor number of the single vendor.
		 *
		 * This function is called on the enabling of the single vendor mode and will set the vendor return
		 * by this function as single vendor on the PR.
		 *
		 * @returns {string} vendorNumber The vendor number of the vendor that you want use as single vendor.
		 * * <pre><code>
		 * GetSingleVendorNumber: function()
		 * {
		 *		return Process.GetURLParameter("vendor");
		 * }
		 * </code></pre>
		 */
		GetSingleVendorNumber: function()
		{
		}
	};

	return customization;
});
