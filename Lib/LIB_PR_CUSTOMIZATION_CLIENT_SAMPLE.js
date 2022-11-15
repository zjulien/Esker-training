/**
 * @file Lib.PR.Customization.Client library: client script Purchase Requisition customization callbacks
 */

/**
 * Package Purchase Requisition client script customization callbacks
 * 
 * Timeline of user exit calls
 * ------------------
 * <img src="img/PAC/Lib_PR_Customization_Client_TimeLine.png">
 * @namespace Lib.PR.Customization.Client
 */

/* LIB_DEFINITION
{
	"name": "Lib_PR_Customization_Client",
	"libraryType": "LIB",
	"scriptType": "CLIENT",
	"comment": "Custom library extending Purchase Requisition scripts on client side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "PR.Customization.Client", function ()
{
	/**
	 * @lends Lib.PR.Customization.Client
	 */
	var customization = {
		/**
		 * @description Allows you to customize the Purchase Requisition process form. This user exit is called from the HTML page script of the Purchase Requisition process, before loading the form and determining the workflow.
		 * 		This user exit is typically used to customize:
		 * 			Objects from the included script libraries.
		 * 			Objects from the HTML page script.
		 * @version 5.117 and higher
		 * @memberof Lib.PR.Customization.Client
		 * @example
		 * This user exit customizes the workflow determination. When the item category is Training, the user exit confers the Buyer (quotation) role to the following contributor: Sam CCOwner4.
		 * <pre><code>
		 * OnLoad: function ()
		 * {
		 *	 var wkfRoles = Lib.Purchasing.WorkflowPR.roles;
		 *	 wkfRoles.buyerQuote.OnBuild = Sys.Helpers.Wrap(wkfRoles.buyerQuote.OnBuild, function (originalFn, callback)
		 *	 {
		 *		 if (Data.GetValue("SupplyTypeName__") === "Training")
		 *		 {
		 *			 callback([
		 *			 {
		 *				 contributorId: "CCOwner4" + Lib.Purchasing.roleBuyerQuote,
		 *				 role: Lib.Purchasing.roleBuyerQuote,
		 *				 login: "ccowner4@example.com",
		 *				 email: "ccowner4@example.com",
		 *				 name: "Sam CCOwner4",
		 *				 action: Lib.Purchasing.WorkflowPR.actions.doQuote.GetName()
		 *			 }]);
		 *			 return true;
		 *		 }
		 *		 else
		 *		 {
		 *			 return originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
		 *		 }
		 *	 });
		 * }
		 * </code></pre>
		 */
		OnLoad: function ()
		{
		},

		/**
		 * @description Allows you to customize the Purchase Requisition process form. This user exit is called from the HTML page script of the Purchase Requisition process, after loading the form and determining the workflow.
		 *		This user exit is typically used to customize:
		 *		Objects from the included script libraries.
		 *		Objects from the HTML page script.
		 * @version 5.125 and higher
		 * @memberof Lib.PR.Customization.Client
		 * @function CustomizeLayout
		 * @example
		 * In this sample, some reviewers check the purchase requisitions before they are approved by approvers. They are grouped in a group. They are the only users to be able to modify the cost center (approvers cannot modify cost centers). Reviewers can only approve the purchase requisition and send the purchase requisition back to the requester. Reviewers are not allowed to choose the Sales cost center.
		 * The following user exits hide or shows the cost center depending on the user, sets the fields to read-only, disables buttons when necessary and displays an error message when the Sales cost center is selected.
		 * <pre><code>
		 * &#47;* LIB_DEFINITION
		 * {
		 * 		"require": [ "Sys/Sys_Helpers_Controls" ]
		 * }*&#47;
		 *  
		 * ///#GLOBALS Lib Sys
		 * var Lib;
		 * Sys.ExtendLib(Lib, "PR.Customization.Client", function ()
		 * {
		 *	 var isReviewer= false;
		 *  
		 *	 var customization = {
		 *  
		 *		 CustomizeLayout: function ()
		 *		 {
		 *			 // Variable initialized with the WorkflowController instance used in the HTML page script.
		 *			 var workflow = Lib.Purchasing.LayoutPR.WorkflowControllerInstance;
		 *  
		 *			 // Retrieves the first workflow step that corresponds to the reviewer step.
		 *			 var controllerContributor = null;
		 *			 {
		 *				 var approvers = workflow.GetContributorsByRole("approver");
		 *				 if (approvers && approvers.length > 0)
		 *				 {
		 *					 controllerContributor = approvers[0];
		 *				 }
		 *			 }
		 *  
		 *			 // True if the current user is a reviewer
		 *			 isReviewer = controllerContributor && User.IsMemberOf(controllerContributor.login);
		 *  
		 *			 // Modifies the layout for owners only. The fields are read-only for non-owners 
		 *			 // (managed by the framework and not by script).
		 *  
		 *			 // Shows the cost center if the user is a reviewer, hides it otherwise.
		 *			 Sys.Helpers.Controls.HideForever(Controls.LineItems__.ItemCostCenterName__, !isReviewer);
		 *  
		 *			 // Modifies the layout for reviewers.
		 *			 if (isReviewer)
		 *			 {
		 *				 // Reviewers can modify the cost center.
		 *				 Sys.Helpers.Controls.SetReadOnlyForever(Controls.LineItems__.ItemCostCenterName__, false);
		 *  
		 *				 // Reviewers can only access the Approve and Back to requester buttons.
		 *				 Sys.Helpers.Controls.HideForever(Controls.Reject, true);
		 *				 Sys.Helpers.Controls.HideForever(Controls.Approve_Forward, true);
		 *				 Sys.Helpers.Controls.HideForever(Controls.Request_for_information, true);
		 *  
		 *				 // Enables the workflow update. It has normally been disabled after the requester step.
		 *				 workflow.AllowRebuild(true);
		 *			 }
		 *		 },
		 *  
		 *		 OnUpdateLayout: (function ()
		 *		 {
		 *			 var submitButtonDisabled = false;
		 *			 var errorMsg = "Forbidden cost center";
		 *  
		 *			 return function ()
		 *			 {
		 *				 if (isReviewer)
		 *				 {
		 *					 // Searches for the cost center for each line item. 
		 *					 // If the cost center is "Sales" (1450), sets an error on the cost center field
		 *					 // If there was an error but the cost center Sales has been removed, then removes the error.
		 *					 var forbiddenCCDetected = false;
		 *					 Lib.Purchasing.Items.ForEach("LineItems__", function(line)
		 *					 {
		 *						 var currentError = line.GetError("ItemCostCenterName__");
		 *						 if (line.GetValue("ItemCostCenterID__") === "1450")
		 *						 {
		 *							 forbiddenCCDetected = true;
		 *							 if (!currentError)
		 *							 {
		 *								 line.SetError("ItemCostCenterName__", errorMsg);
		 *							 }
		 *						 }
		 *						 else if (currentError === errorMsg)
		 *						 {
		 *							 line.SetError("ItemCostCenterName__", "");
		 *						 }
		 *					 });
		 *  
		 *					 // If not already disabled, disables the submit button if at least one line item has the Sales cost center
		 *					 if (forbiddenCCDetected && !submitButtonDisabled)
		 *					 {
		 *						 Lib.Purchasing.LayoutPR.SubmitButton.SetDisabled(submitButtonDisabled = true);
		 *  
		 *					 }
		 *					 // If disabled, enables the submit button if none of the line items has the "Sales" cost center.
		 *					 else if (!forbiddenCCDetected && submitButtonDisabled)
		 *					 {
		 *						 Lib.Purchasing.LayoutPR.SubmitButton.SetDisabled(submitButtonDisabled = false);
		 *					 }
		 *				 }
		 *			 };
		 *		 })()
		 *	 };
		 *  
		 *	 return customization;
		 * });
		 * </code></pre>
		 * 
		*/
		CustomizeLayout: function ()
		{
		},

		/**
		 * @description Allows you to customize the Purchase Requisition process form. This user exit is called from the HTML page script of the Purchase Requisition process, when the form layout is updated upon user modifications.
		 *		This user exit is typically used to customize:
		 *		Objects from the included script libraries.
		 *		Objects from the HTML page script.
		 * 		Note:
		 * 			We recommend that you use the CustomizeLayout user exit instead of the OnUpdateLayout user exit when possible.
		 * @see {@link Lib.PR.Customization.Client.CustomizeLayout}
		 * @version 5.125 and higher
		 * @memberof Lib.PR.Customization.Client
		 * @function OnUpdateLayout
		*/
		OnUpdateLayout: function ()
		{
		},

		/**
		 * @description Allows you to customize the Purchase Requisition process form. This user exit is called from the HTML page script of the Purchase Requisition process. Called after Shipto Information has been retreived
		 * @see {@link Lib.PR.Customization.Client.OnFillFromCompanyCode}
		 * @version 5.184 and higher
		 * @memberof Lib.PR.Customization.Client
		 * @function OnFillFromCompanyCode
		*/
		OnFillFromCompanyCode: function ()
		{
		},

		/**
		 * @typedef {Object} DialogAutoOrderCustomizationReturn
		 * @memberof Lib.PR.Customization.Client
		 * @property {function} FillAutoOrderPopup See {@link Lib.PR.Customization.Client.FillAutoOrderPopup} [Optional]
		 * @property {function} CommitAutoOrderPopup See {@link Lib.PR.Customization.Client.CommitAutoOrderPopup} [Optional]
		 * @property {function} HandleAutoOrderPopup See {@link Lib.PR.Customization.Client.HandleAutoOrderPopup} [Optional]
		 * @property {function} CancelAutoOrderPopup See {@link Lib.PR.Customization.Client.CancelAutoOrderPopup} [Optional]
		 * @property {function} IsEligibleToAutoOrder See {@link Lib.PR.Customization.Client.IsEligibleToAutoOrder} [Optional]
		 */
		/**
		 * @description Allows you to customize the dialog that is displayed at the submission of the purchase requisition when the requester is also the buyer:
			 * <img src="img/PAC/Lib_PR_Customization_Client_autoorder.png">
		 * @version 5.143 and higher
		 * @memberof Lib.PR.Customization.Client
		 * @function DialogAutoOrderCustomization
		 * @return {Lib.PR.Customization.Client.DialogAutoOrderCustomizationReturn} - The returned object
		 * @example 
		 * In this example, you add a text field in the dialog to allow the buyer to type the vendor email address. First, define a process variable in the purchase requisition named z_VendorEmailAddress.
		 * <pre><code>
		   * DialogAutoOrderCustomization: function ()
		 * {
		 *	 return {
		 *		 FillAutoOrderPopup: function (dialog)
		 *		 {
		 *			dialog.AddText("ctrl_VendorEmailAddress", "Vendor email address");
		 *		 },
		 *		 CommitAutoOrderPopup: function (dialog, autoSendOrderParam)
		 *		 {
		 *		   if (autoSendOrderParam == "SendToVendor")
		 *		   {
		 *			 Variable.SetValueAsString("z_VendorEmailAddress", dialog.GetControl("ctrl_VendorEmailAddress").GetValue());
		 *		   }
		 *		 }
		 *	 };
		 * }
		 * </code></pre>
		 * 
		 * Next, retrieve the email address in the IsAutoSendOrderEnabled user exit:
		 * <pre><code>
		 * IsAutoSendOrderEnabled: function ()
		 * {
		 *	 var parametersObject =
		 *	 {
		 *		 VendorEmail: Variable.GetValueAsString("z_VendorEmailAddress")
		 *	 };
		 *	 return parametersObject;
		 * }
		 * </code></pre>
		 */
		DialogAutoOrderCustomization: function ()
		{
			return {
				/**
				 * @description A function called as soon as the dialog has been instantiated. This function should create and initialize the controls to be displayed inside the dialog.
				 * @version 5.143 and higher
				 * @function FillAutoOrderPopup
				 * @memberof Lib.PR.Customization.Client
				 * @param {Dialog} dialog The Dialog object that was instantiated. Use this object to add controls to the dialog.
				 */
				FillAutoOrderPopup: function (dialog)
				{
				},

				/**
				 * @description A function that is called when the user clicks OK in the dialog. 
				 * 		Use this function to update the parameters that should be transmitted to the purchase order. 
				 * 		To keep the application upgradable, update some process variables instead of modifying the purchase requisition controls.
				 * @memberof Lib.PR.Customization.Client
				 * @function CommitAutoOrderPopup
				 * @version 5.143 and higher
				 * @param {Dialog} dialog The Dialog object from which the OK button was clicked.
				 * @param {json} autoSendOrderParam
				 * @param {boolean} autoSendOrderParam.autoOrder
				 * @param {string} autoSendOrderParam.EmailNotificationOptions Possible values are:
				 * 		- SendToVendor
				 * 		- DontSend
				 */
				CommitAutoOrderPopup: function (dialog, autoSendOrderParam)
				{
				},

				/**
				 * @description A function that is called to handle all the events that are not handled by default by the other callback functions. 
				 * 		Use this function to handle the click or OnChange events, allowing you to interact with the dialog content as the user is entering data.
				 * @memberof Lib.PR.Customization.Client
				 * @function HandleAutoOrderPopup
				 * @version 5.143 and higher
				 * @param {Dialog} dialog The Dialog object from which the OK button was clicked.
				 * @param {string} tabId is always null since the auto order popup dialog has no tabs (could change in the future)
				 * @param {string} event A string representing the event that lead to the execution of this callback. 
				 * 		The possible events that can be received are all the events that are available on the controls contained in the dialog and the event related to the dialog object itself. 
				 * 		For more information about available event names refer to [Handling events]{@link http://webdoc:8080/eskerondemand/nv/en/manager/startpage.htm#HTMLPageScript/Control/Control_Object_Event.html}.
				 * 		For example, if your dialog has a combo box defined in it, then, when the combo box value is changed by the user, this callback is triggered with the event parameter set to OnChange, as the combo box handles this event itself.
				 * @param {Control} control Control object from which the event originates. Typically, if the user selects a new value in a combo box control, this callback is called with the combo box control as a parameter.
				 * @param {null} param1 If the original event callback function provides parameters, they are transmitted here.
				 * 		For example, an OnClick event triggered from a Table control has the following callback prototype:
				 *			Controls.Table_.OnClick = function (row) { }
				 *		When such an event is handled by a dialog, the row parameter is provided as the last argument of the HandleAutoOrderPopup function, that becomes:
				 *			function HandleAutoOrderPopup(dialog, event, control, row)
				 * @param {null} param2 If the original event callback function provides parameters, they are transmitted here.
				 */
				HandleAutoOrderPopup: function (dialog, tabId, event, control, param1, param2)
				{
				},

				/**
				 * @description A function that is called when the user clicks Cancel in the dialog. Use this function to rollback the modifications performed by the user in the dialog.
				 * @memberof Lib.PR.Customization.Client
				 * @function CancelAutoOrderPopup
				 * @version 5.143 and higher
				 * @param {Dialog} dialog The Dialog object from which the Cancel button was clicked.
				 * @param {string} event A string representing the event that lead to the execution of this callback. Currently, it is always OnDialogCancel.
				 * @param {Control} control The Control object that triggered the event, that is the dialog itself.
				 */
				CancelAutoOrderPopup: function (dialog, event, control)
				{
				},

				/**
				 * @description A function that is called before the creation of the dialog. Use it to modify the display conditions of the dialog.
				 * @memberof Lib.PR.Customization.Client
				 * @function IsEligibleToAutoOrder
				 * @version 5.143 and higher
				 * @returns {boolean} 
				 * 		- true (or false) to display (or not display) the dialog depending on the conditions defined in the function.
				 * 			For example, you can display the dialog only for a specific vendor.
				 * 		- null (Default) to display the dialog in the default conditions, that is, when:
				 * 			The requester is also the buyer.
				 * 			The vendor is identical for all the items.
				 */
				IsEligibleToAutoOrder: function ()
				{
					return null;
				}
			};
		},

		/**
		 * @description Allows you to customize the list of external catalogs available in the Purchase Requisition process.
		 * 		This user exit is called from the HTML Page script of the Purchase Requisition process, when loading the list of external catalogs.
		 * @version 5.149 and higher
		 * @memberof Lib.PR.Customization.Client
		 * @function GetPunchoutSites
		 * @param {json} punchoutSites JavaScript object specifying the email options
		 * @param {string} punchoutSites.ConfigurationName__	Name of the catalog configuration
		 * @param {string} punchoutSites.Currency__ Currency associated with the catalog.
		 * @param {string} punchoutSites.LogoURL__ URL of the catalog logo.
		 * @param {string} punchoutSites.PunchoutURL__ URL of the vendor catalog.
		 * @param {string} punchoutSites.SupplierID__ Identifier of the vendor.
		 * @param {string} punchoutSites.SupplyTypeID__ Identifier of the item category.
		 * @returns {json} JavaScript object specifying the customized list of external catalogs to display, in the same format as the punchoutSites parameter.
		 * @example
		 * <pre><code>
		 * GetPunchoutSites: function (punchoutSites)
		 * {
		 * 	var customPunchoutSites = [];
		 * 	punchoutSites.forEach(function(site)
		 * 	{
		 * 		if(User.fullName == "Eric Requester" && site.ConfigurationName__ == "AmazonUS")
		 * 		{
		 * 			customPunchoutSites.push(site);
		 * 		}
		 * 		else if(User.fullName == "Kate CCOwner2" && site.ConfigurationName__ == "Lyreco")
		 * 		{
		 * 			customPunchoutSites.push(site);
		 * 		}
		 * 		else if (User.fullName != "Kate CCOwner2" && User.fullName != "Eric Requester")
		 * 		{
		 * 			// All other users have access to all punchout sites
		 * 			customPunchoutSites.push(site);
		 * 		}
		 * 
		 * 	});
		 *
		 * 	// If exists, order first Amazon punchout
		 * 	var amazonIdx = Sys.Helpers.Array.FindIndex(customPunchoutSites, function (v) { return v.ConfigurationName__.startsWith('Amazon'); });
		 * 	if (amazonIdx && amazonIdx >= 0)
		 * 	{
		 * 		var amazonItem = customPunchoutSites.splice(amazonIdx, 1)[0];
		 * 		customPunchoutSites.splice(0, 0, amazonItem);
		 * 	}
		 * 	return customPunchoutSites;
		 * }
		 * </code></pre>
		 */
		GetPunchoutSites: function (punchoutSites)
		{
			var customPunchoutSites = [];
			punchoutSites.forEach(function (site)
			{
				if (User.fullName == "Eric Requester" && site.ConfigurationName__ == "AmazonUS")
				{
					customPunchoutSites.push(site);
				}
				else if (User.fullName == "Kate CCOwner2" && site.ConfigurationName__ == "Lyreco")
				{
					customPunchoutSites.push(site);
				}
				else if (User.fullName != "Kate CCOwner2" && User.fullName != "Eric Requester")
				{
					// All other users have access to all punchout sites
					customPunchoutSites.push(site);
				}
			});
			// If exists, order first Amazon punchout
			var amazonIdx = Sys.Helpers.Array.FindIndex(customPunchoutSites, function (v) { return v.ConfigurationName__.startsWith('Amazon'); });
			if (amazonIdx && amazonIdx >= 0)
			{
				var amazonItem = customPunchoutSites.splice(amazonIdx, 1)[0];
				customPunchoutSites.splice(0, 0, amazonItem);
			}
			return customPunchoutSites;
		},

		/**
		 * @description Allows you to send additional fields in the PunchoutSetupRequest
		 * 		This user exit is called from the HTML Page script of the Purchase Requisition process, just before opening a punchout catalog
		 * @version 5.209 and higher
		 * @memberof Lib.PR.Customization.Client
		 * @function OnPunchoutOpen
		 * @param {json} punchoutSite JavaScript object specifying the punchout site informations (see {@link https://webdoc/eskerondemand/nv/en/manager/startpage.htm#htmlpagescript/punchout/getconfigs.html Punchout.GetConfigs})
		 * @returns {json} JavaScript object specifying the list of extrinsic variables to send into the PunchoutSetupRequest.
		 * @example
		 * <pre><code>
		 * OnPunchoutOpen: function (punchoutSite)
		 * {
		 *   if (punchoutSite.SupplierID__ == "AMAZON")
		 *   {
		 *     return {
		 *       "extrinsic": {
		 *         "UniqueName": User.loginId
		 *       }
		 *     }
		 *   }
		 * };
		 * </code></pre>
		 */
		OnPunchoutOpen: function (punchoutSite)
		{

		},

		/**
		 * @description Allows to forbid punchout for the item selected from the catalog or to modify its generated cXML
		 * This function is called when an item eligible to transparent punchout has been selected in the catalog
		 * (i.e. with TransparentPunchout__ field checked in table Punchout Sites for the corresponding vendor).
		 *
		 * @param {*} cxmlItemInNode cXML root node for punchout ItemIn, to modify if needed
		 * @param {*} catalogData Data retrieved from catalog for the item
		 * @returns {boolean} Return false to disallow punchout for this item; otherwise, punchout is allowed
		 *
		 * @example
		 * <pre><code>
		 * CustomizeTransparentPunchoutXml: function (cxmlItemInNode, catalogData)
		 * {
		 * 	if (catalogData.GetValue("VENDORNUMBER__") === "AMAZON")
		 * 	{
		 * 		// For Amazon, let's add &lt;Extrinsic name="itemCondition"&gt;New&lt;/Extrinsic&gt;
		 *		var newNode = cxmlItemInNode.createElement('Extrinsic');
		 * 		newNode.setAttribute('name', 'itemCondition');
		 * 		newNode.textContent = 'New';
		 * 		cxmlItemInNode.getElementsByTagName("ItemDetail")[0].appendChild(newNode);
		 * 	}
		 * }
		 * </code></pre>
		 */
		CustomizeTransparentPunchoutXml: function (cxmlItemInNode, catalogData)
		{
		},

		GetCatalogs: function (companyCode, defaultCatalog)
		{
			return null;
		},

		/**
		* Allows you to customize the mapping used when loading line items from the clipboard in the Purchase requisition process.
		* This user exit is called from the HTML Page script of the Purchase requisition process, when clicking on Show preview in the Load line items from clipboard dialog.
		* @return {object} mapping The mapping to use
		* @memberof Lib.PR.Customization.Client
		* @example
		* <pre><code>
		* GetLineItemsImporterMapping: function()
		* {
		*	// Mapping example when pasting data like this
		*	// name	description	quantity	req delivery date	 unit price	currency	item category
		*	// laptop	laptop for developper	1	05.12.3000	1200	USD	Computers
		*	// pen	1	blue pen	05.12.3000	10	USD	Other
		*
		*		return {
		*			hasHeader: true,
		*			separator: "\t",
		*			columns: [
		*				{ "header": "name", "lineItemsColumn": "ItemDescription__", "type": "Text" },
		*				{ "header": "description", "noMapping":true},	// ignore this column
		*				{ "header": "quantity", "lineItemsColumn": "ItemQuantity__", "type": "Decimal", "convert": function (v) { return parseFloat(v); } },
		*				{ "header": "req delivery date", "lineItemsColumn": "ItemRequestedDeliveryDate__", "type": "Text" },
		*				{ "header": "unit price", "lineItemsColumn": "ItemUnitPrice__", "type": "Text" },
		*				{ "header": "currency", "lineItemsColumn": "ItemCurrency__", "type": "Text" },
		*				{ "header": "item category", "lineItemsColumn": "SupplyTypeName__", "type": "Text" }
		*			]
		*		};
		* }
		* </code></pre>
		*/
		GetLineItemsImporterMapping: function ()
		{
		},

		/**
		* Allows you to add event used when loading line items from the clipboard in the Purchase requisition process.
		* This user exit is called when event to fill line items are trigger
		* @memberof Lib.PR.Customization.Client
		*/
		UpdateLineItemCopyFromClipboard: function ()
		{
		}
	};

	return customization;
});
