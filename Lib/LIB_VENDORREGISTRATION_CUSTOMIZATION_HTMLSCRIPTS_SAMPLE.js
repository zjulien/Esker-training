/* LIB_DEFINITION{
  "name": "LIB_VENDORREGISTRATION_CUSTOMIZATION_HTMLSCRIPTS",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) Vendor registration process",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.VendorRegistration.Customization.HTMLScripts library
 * @namespace Lib.VendorRegistration.Customization.HTMLScripts
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.VendorRegistration = Lib.VendorRegistration || {};
Lib.VendorRegistration.Customization = Lib.VendorRegistration.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.VendorRegistration.Customization.HTMLScripts
	 */
	parentLib.HTMLScripts =
	{
		/**
		* Allows you to customize the filter used when browsing for users in the workflow pane of the Vendor registration process.
		* This user exit is called from the HTML Page script of the Vendor registration process, when browsing for users.
		* @param {string} role Role of the contributor to select.
		* @return {array} result An array of LDAP filters that will be used to filter the contributors.
		* @example
		* <pre><code>
		* GetContributorsExtraFilter: function(role)
		* {
		* 	// exclude ap specialists
		* 	var extraFilters = [ "(!(LOGIN=ap*))" ];
		* 	if (role === WorkflowParameters.roles.approver)
		* 	{
		* 		// Include cost center owners only
		* 		extraFilters.push("LOGIN=ccowner*");
		* 	}
		* 	return extraFilters;
		* }
		* </code></pre>
		*/
		GetContributorsExtraFilter: function (role)
		{
		},

		/**
		* This user exit is called at the end of the HTML page script of the Vendor Registration.
		* It Allows you to customize layout settings of the Vendor invoice process
		* Caution: this user exit is called asynchronously, if you need to defined Controls events
		* Please implement the OnHTMLScriptEndSync User Exit instead.
		*
		* This example allows you to customize different options in conversations, for example :
		*  - the list of recipient for the conversation with the option "recipientList"
		*  - the email template to use with the option "emailTemplate"
		*  - custom tags with the option "emailCustomTags"
		* @memberof Lib.VendorRegistration.Customization.HTMLScripts
		* @example
		* <pre><code>
		* OnHTMLScriptEnd: function (currentRole)
		* {
		*	if (!User.isVendor)
		*	{
		*		var registrationURL = Variable.GetValueAsString("VendorRegistrationURLInternal");
		*
		*		var options =
		*		{
		*			"addPreviousMessageTags": true,
		*			"gatherMessagesOfGroups": [],
		*			"createConversationIfNotExist": true,
		*			"allowAttachments": true,
		*			"notifyByEmail": true,
		*			"recipientList": ["cfoprocess.wegeneren@esker.com","buyerprocess.wegeneren@esker.com"],
		*			"emailTemplate": "AP-Vendor_RegistrationConversationVendor_Custom.htm",
		*			"emailCustomTags": {
		*				"VendorRegistrationUrl__": registrationURL
		*			},
		*			"fromName": "My Company",
		*			"fromEmailAddress": "contact@example.com"
		*		};
		*		Controls.ConversationUI__.SetOptions(options);
		*	}
		* }
		* </code></pre>
		*
		* This example allows you to show panes depending of the current workflow role
		* <pre><code>
		* OnHTMLScriptEnd: function (currentRole)
		* {
		*	function hideEverything()
		*	{
		*		[
		*		"CompanyProfilePane",
		*		"DiversityPane",
		*		"DocumentsPane",
		*		"ERPPane",
		*		"PaymentPane",
		*		"CompanyOfficers",
		*		"Banks",
		*		"CommentPane"
		*		].forEach(function (control)
		*		{
		*			if (Controls[control])
		*			{
		*				Controls[control].Hide(true);
		*			}
		*			else
		*			{
		*				Log.Info("Could not hide control " + control);
		*			}
		*		});
		*	}
		*	var onChangeBackup = Controls.Country__.OnChange;
		*	Controls.Country__.OnChange = function()
		*		{
		*			switch (currentRole)
		*			{
		*				case "_LegalReviewer":
		*					onChangeBackup();
		*					Controls.DiversityPane.Hide(true);
		*					break;
		*				default:
		*					onChangeBackup();
		*					break;
		*			}
		*		}
		*
		*	switch (currentRole)
		*	{
		*		case "_LegalReviewer":
		*			hideEverything();
		*			Controls.CompanyOfficers.Hide(false);
		*			Controls.CommentPane.Hide(false);
		*			break;
		*		default:
		*			break;
		*	}
		* }
		* </code></pre>
		*/
		OnHTMLScriptEnd: function (currentRole)
		{
		},

		/**
		* This user exit is called at the end of synchronous part of the Vendor Registration process.
		* Usefull to overload Controls Events and avoid asynchronous issue
		* @memberof Lib.VendorRegistration.Customization.HTMLScripts
		* @example
		* <pre><code>
		* OnHTMLScriptEndSync: function ()
		* {
		*			Controls.VendorCategory__.OnChange = function()
		*			{
		*					if (!User.isVendor)
		*					{
		*						Control.Z_Custo__.Hide(false);
		*						Control.Z_Custo__.SetRequired(true);
		*					}
		*			};
		*		}
		* }
		* </code></pre>
		*/
		OnHTMLScriptEndSync: function ()
		{
		},

		/**
		* Function called in Vendor registration when the Next button is clicked by the user (Vendor profile)
		* to add additionnal checks on step validation.
		* Default process checks are done after calling this function.
		*
		* @memberof Lib.VendorRegistration.Customization.HTMLScripts
		* @returns {boolean} If the current step is valid and the user can go to the next step.
		* @example
		* <pre><code>
		* ValidCurrentStep: function()
		* {
		*	//We require a value for this field
		*	const value = Data.GetValue("CompanyStructure__");
		*	const isValid = !Controls.CompanyStructure__.IsVisible() || (value !== null && value !== "");
		*	if(!isValid){
		*		Data.SetError("CompanyStructure__", "This field is required");
		*	}
		*	return isValid;
		* }
		* </code></pre>
		*/
		ValidCurrentStep: function ()
		{
			// Customization not implemented in sample package library
		},

		/**
		* Function called in Vendor registration process during the external conversation initialization
		* to modify the conversation pane visibility.
		* Default process checks are done after calling this function.
		*
		* @memberof Lib.VendorRegistration.Customization.HTMLScripts
		* @param  workflowController the WorkflowController instance used in the HTML page script
		* @param actualState Represent the actual visibility of the pane
		* @returns {boolean} If the conversation pane have to be hidden.
		* @example
		* <pre><code>
		* HideConversationPane: function(workflowController, actualState)
		* {
			//Conversation pane is hidden before vendor validation
			return workflowController.GetTableIndex() <= workflowController.GetRoleSequenceIndex("_Vendor");
		* }
		* </code></pre>
		*/
		HideConversationPane: function (workflowController, actualState)
		{
			// Customization not implemented in sample package library
		},

		/**
		* This user exit is called at the end of the HTML page script of the New Vendor Registration.
		* You can customize popups shown to users before creating a vendor registration
		* @memberof Lib.VendorRegistration.Customization.HTMLScripts
		* @example Change the default value for the category field
		* <pre><code>
		* NewVendorRegistrationPopups: function (choicePopup, sendPopup)
		* {
		* 	sendPopup._defaultValue.category = "";
		* }
		* </code></pre>
		*/
		NewVendorRegistrationPopups: function (choicePopup, sendPopup)
		{
		},
		/**
		* This user exit is called in the Vendor Registration custom script process.
		* When requester approves
		* 	- In function ApproveWithPopupCommentDialog (Role == LegalReviewer)
		* 	- In function Approve (Role != LegalReviewer)
		* You can return our own validation function
		* You are in charge of calling the baseValidateFunction in your returned function if you want to keep
		* The standard validation behavior
		* @memberof Lib.VendorRegistration.Customization.HTMLScripts
		* @param {function():void} baseValidateFunction - function applying standard validation
		* you should call this function in your returned function if you want to keep
		* The standard validation behavior
		* @returns {function():void} - function applying your custom validation.
		* @example Change the default function used to validate fields
		* <pre><code>
		* ValidateRequiredFields: function (baseValidateFunction)
		* {
		* 			return function()
		* 			{
		* 						baseValidateFunction();
		* 						Controls.Z_Custo1__.Focus();
		* 						if (Controls.Z_Custo2__.GetValue() === "")
		* 						{
		* 							Controls.Z_Custo2__.SetError("_This field should not be empty");
		* 						}
		* 			}
		* }
		* </code></pre>
		*/
		ValidateRequiredFields: function (baseValidateFunction)
		{
			return null;
		},

		/**
		 * Use this function to override the defaultworkflow parameters
		 * @param {object} defaultWorkflowParameters The default workflow parameters
		 * @returns {null | object} null if not enabled, an object representing the workflow parameters if enabled
		 * @example
		 * <pre><code>
		 * // Exemple: you want to add an AddressApprover and a BankDetailsApprover in the workflow parameters
		 * SetWorkflowParameters: function (defaultWorkflowParameters)
		 * {
		 * 		defaultWorkflowParameters.roles["AddressApprover"] = "_AddressApprover";
		 * 		defaultWorkflowParameters.roles["BankDetailsApprover"] = "_BankDetailsApprover";
		 * 		return defaultWorkflowParameters;
		 * }
		 * </code></pre>
		 */
		SetWorkflowParameters: function (defaultWorkflowParameters)
		{
			return null;
		}
	};
})(Lib.VendorRegistration.Customization);
