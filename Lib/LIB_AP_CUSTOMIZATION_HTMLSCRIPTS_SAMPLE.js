/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_HTMLSCRIPTS",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) AP customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.HTMLScripts library: HTML (custom script) AP customization callbacks
 */

/**
 * Package AP HTML page script customization callbacks for all processes
 * @namespace Lib.AP.Customization.HTMLScripts
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.HTMLScripts
	 */
	parentLib.HTMLScripts =
	{
		/**
		 * Allows you to define custom user exists added for this customer
		 * Functions defined in this scope will be accessible from outside this library
		 * They can be called the following way Lib.AP.Customization.HTMLScripts.CustomUserExits.OnCompanyCodeChange(queryResult)
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
		 * This user exit is called at the end of the HTML page script of the Vendor invoice process.
		 * Allows you to customize layout settings of the Vendor invoice process.
		 * If you need to customize callback functions associated with control events, refer to HTML page script API: Control events.
		 *
		 * @memberof Lib.AP.Customization.HTMLScripts
		 * @example
		 * <pre><code>
		 * OnHTMLScriptEnd: function ()
		 * {
		 * 	 if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart)
		 * 	 {
		 *		// When the AP specialist changes the buyer or receiver, the workflow is refreshed
		 *		Controls.LineItems__.Buyer__.OnChange = refreshWorkflow;
		 *		Controls.LineItems__.Receiver__.OnChange = refreshWorkflow;
		 * 	 }
		 * }
		 * </code></pre>
		 *
		 * This example allows you to customize different options in conversations, for example :
		 *  - the list of recipient for the conversation with the option "recipientList"
		 *  - the email template to use with the option "emailTemplate"
		 *  - custom tags with the option "emailCustomTags"
		 * @memberof Lib.AP.Customization.HTMLScripts
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
		 *			DocumentNumber: Data.GetValue("InvoiceNumber__")
		 *		},
		 *		externalContributors: [
		 *	 	{
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
			//Handle displayed header fields
			LayoutHelpers.InitHeaderLayout();

			//Init header event handlers
			LayoutHelpers.SetCustomHeaderEvents();

			//Init line items event handlers
			LayoutHelpers.SetCustomLineItemsEvents();
		},

		/**
		 * Allows you to customize layout settings for the line items table in the Vendor invoice process.
		 * You can use it to hide or show columns.
		 * This user exit is called from the HTML page script of the Vendor invoice process, when updating the line items table layout.
		 * @param {Table} lineItemsTable The line items table
		 * @example
		 * <pre><code>
		 * OnRefreshLineItemsTableEnd: function (lineItemsTable)
		 * {
		 *		// Always show vendor number on line items
		 *		lineItemsTable.VendorNumber__.Hide(false);
		 * }
		 * </code></pre>
		 */
		OnRefreshLineItemsTableEnd: function (lineItemsTable)
		{
			//Update line items layout
			LayoutHelpers.InitLineItemsLayout(lineItemsTable);
		},

		/**
		 * Allows you to customize layout settings of each line item in the Vendor invoice process.
		 * You can use it to set a field as read-only or required. You can customize rows according to the type of line item to which they correspond (PO or non-PO).
		 * This user exit is called from the HTML page script of the Vendor invoice process, when updating each line item.
		 * @param {TableRow} lineItemRow The line item
		 * @example
		 * <pre><code>
		 * OnRefreshLineItemRowEnd: function (lineItemRow)
		 * {
		 *		// Tax code readonly for PO lines
		 *		lineItemRow.TaxCode__.SetReadOnly(lineItemRow.LineType__.GetValue() === Lib.P2P.LineType.PO);
		 * }
		 * </code></pre>
		 */
		OnRefreshLineItemRowEnd: function (lineItemRow)
		{
		},

		/**
		 * Allows you to customize layout settings of each Workflow line in the Vendor invoice process.
		 * For instance, you could override rows parameters according to the customer needs such as blocking the possibility to manually add approvers.
		 * This user exit is called from the HTML page script of the Vendor invoice process, when updating each Workflow line.
		 * @param {any} workflowUIParameters The Worflow parameters
		 * @param {Table} table The Workflow table
		 * @param {TableRow} row The Workflow table row
		 * @param {number} index The row index in the Workflow table
		 * @example
		 * <pre><code>
		 *	OnRefreshApproversListRowEnd: function (workflowUIParameters, table, row, index)
		 *	{
		 *		// Prevent users to change the workflow that has been computed by the system
		 *		const contributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(row);
		 *		if (contributor.role === 'approver')
		 *		{
		 *			table.HideTableRowDeleteForItem(index, true);
		 *			table.HideTableRowAddForItem(index, true);
		 *			row.Approver__.SetBrowsable(false);
		 *		}
		 *	},
		 * </code></pre>
		 */
		OnRefreshApproversListRowEnd: function (workflowUIParameters, table, row, index)
		{
		},

		/**
		* Allows you to customize the filter used when browsing for users in the workflow pane of the Vendor invoice process.
		* This user exit is called from the HTML Page script of the Vendor invoice process, when browsing for users.
		* @param {string} role Role of the contributor to select.
		* @return {array} result An array of LDAP filters that will be used to filter the contributors.
		* @example
		* <pre><code>
		* GetContributorsExtraFilter: function(role)
		* {
		* 	// exclude ap specialists
		* 	var extraFilters = [ "(!(LOGIN=ap*))" ];
		* 	if (role === Lib.AP.WorkflowCtrl.roles.controller)
		* 	{
		* 		// Include CFOs only
		* 		extraFilters.push("LOGIN=cfo*");
		* 	}
		* 	else if (role === Lib.AP.WorkflowCtrl.roles.approver)
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
		* Allows you to customize the order of the columns of the line items table in the Vendor invoice process.
		* This user exit is called from the HTML Page script of the Vendor invoice process, when initializing the process form.
		* This user exit is disabled when the Vendor invoice process is in design mode. If you enable the design mode after calling this user exit, the columns of the items table are reordered as they were before the user exit was called.
		* @param {string} inputColumnsOrdered Array that contains the name of the columns of the line items table. The order of the columns in the array represents the order in which the columns are arranged in the line items table before calling the user exit.
		* @return {array} result Array containing the name of the columns of the table, in the order in which they are to be arranged.
		* @example
		* <pre><code>
		* GetColumnsOrder: function(inputColumnsOrdered)
		* {
		*	// example 1 explicit list
		*	// Put GLAccount__ and GLDescription__ at the begining of the lineItems__ table
		* 	return ["GLAccount__","GLDescription__"];
		* }
		* </code></pre>
		* @example
		* <pre><code>
		* GetColumnsOrder: function(inputColumnsOrdered)
		* {
		*   // example 2 : Manipulate the initial LineItems__ array
		* 	// Move the PartNumber__ Column at the begining of the table if defined
		*	var idx = inputColumnsOrdered.indexOf("PartNumber__"); // find the index of the column PartNumber__
		* 	if (idx !== -1 )
		* 	{
		*		// Pop the ParNumber__ item
		*       var partNumber = inputColumnsOrdered.splice(idx, 1)[0];
		*		// Add the PartNumber at the begining of the table
		*		inputColumnsOrdered.unshift(partNumber);
		* 	}
		* 	return inputColumnsOrdered;
		* }
		* </code></pre>
		*/
		GetColumnsOrder: function (inputColumnsOrdered)
		{
		},

		/**
		 * Allows you to choose the layout displayed for each users or profiles of the Vendor invoice process.
		 * This user exit is called from the HTML Page script of the Vendor invoice process, when selecting the layout to display.
		 * @return {int} value The layout to apply:
		 * - 0: Full layout
		 * - 1: Light layout
		 * @example
		 * <pre><code>
		 * OnDetermineLayout: function ()
		 * {
		 *		// Grant full layout for approvers
		 *		if (User.profileName === "P2P Approver Profile")
		 *		{
		 *			return 0;
		 *		}
		 * }
		 * </code></pre>
		 */
		OnDetermineLayout: function ()
		{
		},

		/**
		 * Allows you to customize layout settings in the Vendor invoice form when the invoice type or the ERP type changes.
		 * This user exit is called from the HTML page script of the Vendor invoice process, when changing the invoice type or ERP type.
		 * @example
		 * <pre><code>
		 * OnUpdateLayoutEnd: function ()
		 * {
		 *		// Fill Automatically the Description field according to the Invoice Type
		 *		var isPOInvoice = Lib.AP.InvoiceType.isPOInvoice();
		 *		var vendorName = Data.GetValue("VendorName__") || "";
		 *		var invoiceDescription = "";
		 *		if (isPOInvoice)
		 *		{
		 *			invoiceDescription = vendorName + " PO Invoice";
		 *		}
		 *		else
		 * 		{
		 *			invoiceDescription = vendorName + " FI Invoice";
		 *		}
		 *		Data.SetValue("InvoiceDescription__", invoiceDescription);
		 * 	}
		 * </code></pre>
		 */
		OnUpdateLayoutEnd: function ()
		{
		},
		/**
		* Allows you to perform customizations in the Vendor invoice form when the toolbar at the bottom of the form is updated.
		* This user exit is called from the HTML page script of the Vendor invoice process after the button bar is updated by a workflow calculation.
		* @example
		* <pre><code>
		* OnUpdateButtonBarEnd: function ()
		* {
		*		// Hide resubmit button for users
		*		Controls.Reprocess.Hide(User.profileRole !== "accountManagement");
		* }
		* </code></pre>
		*/
		OnUpdateButtonBarEnd: function ()
		{
		},
		/**
		* Allows you to customize the mapping used when loading line items from the clipboard in the Vendor invoice process.
		* This user exit is called from the HTML Page script of the Vendor invoice process, when clicking on Show preview in the Load line items from clipboard dialog.
		* @return {object} mapping The mapping to use
		* @example
		* <pre><code>
		* GetLineItemsImporterMapping: function()
		* {
		*	// Mapping example for vendor MJ when pasting data like this
		*	// Account	Amount	Text	Business Area	Cost Center	Tax Code
		*	// 906010	16.13$	supplies	0999	001300	V0
		*	// 906010	14.59$	misc	0999	001300	V9
		*
		*	if (Data.GetValue("VendorNumber__") === "MJ1186")
		*	{
		*		return {
		*			hasHeader: true,
		*			separator: "\t",
		*			columns: [
		*				{ "header": "Account", "lineItemsColumn": "GLAccount__", "type": "Text" },
		*				{ "header": "Amount", "lineItemsColumn": "Amount__", "type": "Decimal", "convert": function(v) { return parseFloat(v); } },
		*				{ "header": "Text", "lineItemsColumn": null },	// ignore this column
		*				{ "header": "Business Area", "lineItemsColumn": "BusinessArea__", "type": "Text" },
		*				{ "header": "Cost Center", "lineItemsColumn": "CostCenter__", "type": "Text" },
		*				{ "header": "Tax Code", "lineItemsColumn": "TaxCode__", "type": "Text" }
		*			],
		*			customMap: [
		*				"GLAccount__",
		*				"Amount__",
		*				"BusinessArea__",
		*				"CostCenter__",
		*				"TaxCode__"
		*			]
		*		};
		*	}
		*	return null;
		* }
		* </code></pre>
		*/
		GetLineItemsImporterMapping: function ()
		{
		},

		/**
		* Returns an array of strings containing a list of fields to add to the query.
		* Those fields won't be displayed on the browse page but could be used later on other user exits based on the query result.
		* ATTENTION: Fields added with the GetBrowseQueryExtraFields user exit are not displayed in the browse dialog
		* @param {string} tableName The table name the query is related to
		* @returns {string[]} An array containing each field to add to the query
		* @example
		* <pre><code>
		* GetBrowseQueryExtraFields: function(tableName)
		* {
		*	// Supposing a specific field IsOpened__ has been added to "AP - Purchase order - Headers__"
		*	// and a specific field IsItemOpened__ has been added to "AP - Purchase order - Items__"/"P2P - Goods receipt - Items__"
		* 	var extraFields = [];
		* 	if (tableName === "AP - Purchase order - Headers__")
		*	{
		*		extraFields.push("IsOpened__");
		*	}
		* 	if (tableName === "AP - Purchase order - Items__")
		*	{
		*		extraFields.push("IsItemOpened__");
		*	}
		* 	if (tableName === "P2P - Goods receipt - Items__")
		*	{
		*		extraFields.push("IsItemOpened__");
		*	}
		*	return extraFields;
		* }
		* </code></pre>
		*/
		GetBrowseQueryExtraFields: function (tableName)
		{
			return null;
		},

		/**
		* Use this function to customize the opened filter in the purchase order browse.
		* To add specific field to recordDefinition use the User Exit GetBrowseQueryExtraFields.
		* @param {boolean} defaultValue is the purchase order considered as opened by default
		* @param {object} queryResult object containing the result of the query
		* @param {integer} recordIndex index of the current record in the queryResult
		* @return {boolean} is the Purchase order is openned
		* @example
		* <pre><code>
		* IsPurchaseOrderOpened: function(defaultValue, queryResult, recordIndex)
		* {
		*	// deal only with PO tagged as opened (see GetBrowseQueryExtraFields customisation)
		*   // fields name are uppercased in recordDefinition
		*   if (queryResult)
		* 	{
		*       var value = queryResult.GetQueryValue("ISOPENED__", recordIndex);
		*		if (value)
		*		{
		*			return  value === "1";
		*		}
		*       else
		*		{
		*			Log.Warn("IsPurchaseOrderOpened user exit uses field ISOPENED__ not retrieved by query!");
		*		}
		*	}
		* }
		* </code></pre>
		*/
		IsPurchaseOrderOpened: function (defaultValue, queryResult, recordIndex)
		{
		},

		/**
		* Use this function to customize the opened item filter in the purchase order browse
		* To add specific field to recordDefinition use the User Exit GetBrowseQueryExtraFields.
		* @param {boolean} defaultValue is the item considered as opened by default
		* @param {object} queryResult object containing the result of the query
		* @param {integer} recordIndex index of the current record in the queryResult
		* @return {boolean} is the Purchase order item is openned
		* @example
		* <pre><code>
		* IsPurchaseOrderItemOpened: function(defaultValue, queryResult, recordIndex)
		* {
		*	// deal only with PO tagged as opened (see GetBrowseQueryExtraFields customisation)
		*   // fields name are uppercased in recordDefinition
		*   if (queryResult)
		* 	{
		*       var value = queryResult.GetQueryValue("ISITEMOPENED__", recordIndex);
		*		if (value)
		*		{
		*			return  value === "1";
		*		}
		*       else
		*		{
		*			Log.Warn("IsPurchaseOrderOpened user exit uses field ISITEMOPENED__ not retrieved by query!");
		*		}
		*	}
		* }
		* </code></pre>
		*/
		IsPurchaseOrderItemOpened: function (defaultValue, queryResult, recordIndex)
		{
		},

		/**
		* Allows you to specify whether a line item in the Vendor invoice process can be duplicated or not.
		* This user exit is called from the HTML Page script of the Vendor invoice process, when clicking on Duplicate line in the ☰ menu on the line.
		* @param {object} item the line item the user is trying to duplicate
		* @return {boolean} is the line item duplicable. You can also return null to work with the default behavior.
		* @example
		* <pre><code>
		* IsItemDuplicable: function(item)
		* {
		*	// avoid PO items to be duplicated
		*	if (item && item.GetValue("LineType__") === Lib.P2P.LineType.PO)
		*	{
		*		return false;
		*	}
		*	return true;
		* }
		* </code></pre>
		*/
		IsItemDuplicable: function (item)
		{
		},

		/**
		 * Allows you to run logic after a user changes the vendor name or vendor number.
		 * @example
		 * <pre><code>
		 * OnVendorChange: function()
		 * {
		 *   //Call a business function to handle the custom behavior to be applied
		 *	 //See CustomHelpers object definition below
		 *	 CustomHelpers.HandleVendorWarning();
		 * }
		 * </code></pre>
		 */
		OnVendorChange: function ()
		{
		},

		/**
		 * Allows modifying what types of users are given AP Specialist level access to the vendor invoice form.
		 * @param {boolean} currentProfileIncluded Whether the current user's profile is considered an AP specialist
		 * @return {boolean} If the current user should be given AP Specialist access to the form.
		 * @example
		 * <pre><code>
		 * IncludeCustomAPProfiles: function(currentProfileIncluded)
		 * {
		 *     // Include any profiles that start with the string "AP Specialist"
		 *     return /^AP Specialist/.test(User.profileName);
		 * }
		 * </code></pre>
		 */
		IncludeCustomAPProfiles: function (currentProfileIncluded)
		{
		},

		/**
		 * Specifics customization for the workflow
		 * @namespace Lib.AP.Customization.HTMLScripts.SAP
		 * @memberof Lib.AP.Customization.HTMLScripts
		 */
		SAP:
		{
			/**
			* Allows you to customize the SAP header information transmitted through the BAPI parameters of the FIHeaderSet function in the Lib_AP_SAP_Invoice_Client script library.
			* This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
			* @memberOf Lib.AP.Customization.HTMLScripts.SAP
			* @param {Object} params The BAPI structure that will be send to SAP
			* @param {Object} documentHeader The DOCUMENTHEADER structure that will be send to SAP
			* @example
			* <pre><code>
			* OnFIHeaderSet: function (params, documentHeader)
			* {
			* 	documentHeader.SAPFIELD = Data.GetValue("MyNewField__");
			* }
			* </code></pre>
			*/
			OnFIHeaderSet: function (params, documentHeader)
			{
			},

			/**
			* Allows you to customize the SAP vendor information transmitted through the BAPI parameters of the FIAddVendorLine function in the Lib_AP_SAP_Invoice_Client script library.
			* This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
			* @memberOf Lib.AP.Customization.HTMLScripts.SAP
			* @param {Object} params The BAPI structure that will be send to SAP
			* @param {Object} accountPayableItem The ACCOUNTPAYABLE structure that will be send to SAP
			* @param {Object} currencyAmountItem The CURRENCYAMOUNT structure that will be send to SAP
			* @example
			* <pre><code>
			* OnFIAddVendorLine: function (params, accountPayableItem, currencyAmountItem)
			* {
			* 	accountGLItem.CS_TRANS_T = line.GetValue("Z_Transaction_type__");
			* }
			* </code></pre>
			*/
			OnFIAddVendorLine: function (params, accountPayableItem, currencyAmountItem)
			{
			},

			/**
			* Allows you to customize the SAP non-PO line information transmitted through the BAPI parameters of the FIAddGLLine function in the Lib_AP_SAP_Invoice_Client script library.
			* This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
			* @memberOf Lib.AP.Customization.HTMLScripts.SAP
			* @param {Object} params The BAPI structure that will be send to SAP
			* @param {Object} line The line item used to fill the SAP structures
			* @param {Object} accountGLItem The ACCOUNTGL structure that will be send to SAP
			* @param {Object} currencyAmountItem The CURRENCYAMOUNT structure that will be send to SAP
			*/
			OnFIAddGLLine: function (params, line, accountGLItem, currencyAmountItem)
			{
			},

			/**
			* Allows you to customize the SAP tax line information transmitted through the BAPI parameters of the FIAddTaxLine function in the Lib_AP_SAP_Invoice_Client script library.
			* This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
			* @memberOf Lib.AP.Customization.HTMLScripts.SAP
			* @param {Object} params The BAPI structure that will be send to SAP
			* @param {Object} sapTaxAccount The tax account retrieved from SAP
			* @param {Object} accountTaxItem The ACCOUNTTAX structure that will be send to SAP
			* @param {Object} currencyAmmountTax The CURRENCYAMOUNT structure that will be send to SAP
			*/
			OnFIAddTaxLine: function (params, sapTaxAccount, accountTaxItem, currencyAmmountTax)
			{
			},

			/**
			* Allows you to customize the SAP header information transmitted through the BAPI parameters of the MMHeaderSet function in the Lib_AP_SAP_Invoice_Client script library.
			* This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
			* @memberOf Lib.AP.Customization.HTMLScripts.SAP
			* @param {Object} params The BAPI structure that will be send to SAP
			* @param {Object} headerData The HEADERDATA structure that will be send to SAP
			*/
			OnMMHeaderSet: function (params, headerData)
			{
			},

			/**
			* Allows you to customize the SAP PO line information transmitted through the BAPI parameters of the MMAddPOLine function in the Lib_AP_SAP_Invoice_Client script library.
			* This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
			* @memberOf Lib.AP.Customization.HTMLScripts.SAP
			* @param {Object} params The BAPI structure that will be send to SAP
			* @param {Object} line The line item used to fill the SAP structures
			* @param {Object} poItemData The current PO item information
			* @param {Object} itemData The ITEMDATA structure that will be send to SAP
			*/
			OnMMAddPOLine: function (params, line, poItemData, itemData)
			{
			},

			/**
			* Allows you to customize the SAP non-PO line information transmitted through the BAPI parameters of the MMAddGLLine function in the Lib_AP_SAP_Invoice_Client script library.
			* This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
			* @memberOf Lib.AP.Customization.HTMLScripts.SAP
			* @param {Object} params The BAPI structure that will be send to SAP
			* @param {Object} line The line item used to fill the SAP structures
			* @param {Object} accountGLItem The ACCOUNTGL structure that will be send to SAP
			* @example
			* <pre><code>
			* OnMMAddGLLine: function (params, line, accountGLItem)
			* {
			* 	accountGLItem.CS_TRANS_T = line.GetValue("Z_Transaction_type__");
			* }
			* </code></pre>
			*/
			OnMMAddGLLine: function (params, line, accountGLItem)
			{
			},

			/**
			* Allows you to customize the SAP tax data transmitted through the BAPI parameters of the MMAddTaxData function in the Lib_AP_SAP_Invoice_Client script library.
			* This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
			* @memberOf Lib.AP.Customization.HTMLScripts.SAP
			* @param {Object} params The BAPI structure that will be send to SAP
			* @param {Object} taxCodeValues Tax information
			* @param {Object} taxDataItem The TAXDATA structure that will be send to SAP
			*/
			OnMMAddTaxData: function (params, taxCodeValues, taxDataItem)
			{
			}
		},

		/**
		 * Specifics customization for generic solutions
		 * @namespace Lib.AP.Customization.HTMLScripts.Generic
		 * @memberof Lib.AP.Customization.HTMLScripts
		 */
		Generic:
		{
			/**
			 * Allow to enable bank detail selection for generic invoices
			 * @example
			 * <pre><code>
			 * AllowBankDetailSelection: function()
			 * {
			 * 	 //allow AP users to select items in the bank details table
			 *   return true;
			 * }
			 * </code></pre>
			 */
			AllowBankDetailSelection: function ()
			{
				return false;
			}
		},

		/**
		 * Specifics customization for the PO Browse
		 * @namespace Lib.AP.Customization.HTMLScripts.BrowsePO
		 * @memberof Lib.AP.Customization.HTMLScripts
		 */
		BrowsePO:
		{
			/**
			 * Specifics customization for the SAP and Generic PO Browse
			 * @namespace Lib.AP.Customization.HTMLScripts.BrowsePO.Common
			 * @memberof Lib.AP.Customization.HTMLScripts.BrowsePO
			 */
			Common:
			{
				/**
				 * Use this function to enable or disable the search for POs as soon as the browse dialog opens
				 * The default behaviour is as follows:
				 *	- When connecting to SAP, we do not run this search when the page opens. Return true to modify this behaviour.
				 *	- When running search in local Esker table, we do run this search so long as Vendor number field is not empty. Return false to modify this behaviour.
				 * @return {boolean} whether or not to run the search for POs as soon as the browse page opens
				 * @example
				 * <pre><code>
				 * RunPOSearchOnLoad: function ()
				 * {
				 *		var isSAP = Data.GetValue("ERP__") === "SAP";
				 *		if (isSAP && Data.GetValue("OrderNumber__"))
				 *		{
				 *			return true;
				 *		}
				 * }
				 * </code></pre>
				 */
				RunPOSearchOnLoad: function ()
				{
				},

				/**
				* Allows you to customize the Vendor invoice process when a purchase order number is added to the form.
				* This user exit is called from the HTML Page script of the Vendor invoice process when adding a purchase order number.
				* @memberOf Lib.AP.Customization.HTMLScripts.BrowsePO.Common
				* @param {string} orderNumber The number of the added order
				* @param {string} itemNumber The number of the added item (defined only if single POLine added)
				* @param {Popup.Dialog} dialog The PO search page dialog object that can be further manipulated, in order to close the dialog for instance
				* @example
				* <pre><code>
				* OnFinalizeAddPoEnd: function (orderNumber, itemNumber, dialog)
				* {
				*	// Automatically fill the Description field with the Vendor Name and the PO Numbers added from the PO Browse
				*	var vendorName = Data.GetValue("VendorName__") || "";
				*	var invoiceDescription = vendorName + " " + orderNumber;
				*	Data.SetValue("InvoiceDescription__", invoiceDescription);
				*
				*	// Close popup if user clicked the "Add" link from the PO header tab
				*	// This allows saving one click in scenarios where invoice can only reference 1 Purchase order
				*	if(dialog && !itemNumber)
				*	{
				*		dialog.Cancel();
				*	}
				* }
				* </code></pre>
				*/
				OnFinalizeAddPoEnd: function (orderNumber, itemNumber, dialog)
				{
				},

				/**
				* Allows you to customize options used to create the PO [SAP] Browse popup dialog.
				* @memberOf Lib.AP.Customization.HTMLScripts.BrowsePO.Common
				* @param {object} defaultPopupOptions default options used to create the PO Browse popup dialog.
				* @param {boolean} defaultPopupOptions.windowed defined if the PO Browse should be displayed in a dedicated window (true) or not (false).
				* @param {boolean} defaultPopupOptions.top defined the top position of the PO Browse popup dialog (windowed enabled mode only).
				* @param {boolean} defaultPopupOptions.left defined the left position of the PO Browse popup dialog (windowed enabled mode only).
				* @param {boolean} defaultPopupOptions.innerWidth defined the inner width of the PO Browse popup dialog (windowed enabled mode only).
				* @param {boolean} defaultPopupOptions.innerHeight defined the inner height of the PO Browse popup dialog (windowed enabled mode only).
				* @return {object} customized options for PO Browse popup dialog creation. You can also return null to work with default options.
				* @example
				* <pre><code>
				* CustomizeBrowseParameters: function (defaultPopupOptions)
				* {
				* 	// don't use the windowed mode on IE and Edge
				* 	if (navigator.appVersion.indexOf('Trident/') > -1  || navigator.appVersion.indexOf('Edge') > -1)
				* 	{
				* 		return {
				* 			windowed: false
				* 		};
				* 	}
				* 	// set a specific size for SAP
				* 	else if (Lib.ERP.IsSAP())
				* 	{
				* 		return {
				* 			windowed: true,
				* 			top: 100,
				* 			left: 100,
				* 			innerWidth: 1550,
				* 			innerHeight: 800
				* 		};
				* 	}
				* 	// default behavior
				* 	return {
				* 		windowed: true,
				* 		top: 100,
				* 		left: 100,
				* 		innerWidth: 1400,
				* 		innerHeight: 800
				* 	};
				* }
				* </code></pre>
				*/
				CustomizeBrowseParameters: function (defaultPopupOptions)
				{
				}
			},

			/**
			 * Specifics customization for the SAP PO Browse
			 * @namespace Lib.AP.Customization.HTMLScripts.BrowsePO.SAP
			 * @memberof Lib.AP.Customization.HTMLScripts.BrowsePO
			 */
			SAP:
			{
				/**
				 * Use this function to allow the PO search page to add or ignore certain Goods receipt lines if the Goods receipt line has since been fully invoiced.
				 * This function runs after the user has added all the lines from one PO via the "Add" link and the PO has the GR-based IV tick on.
				 * The default behaviour is to not ignore any GR lines when adding one PO, in order to allow the user to manually delete any lines afterwards.
				 * Return false instead of true to modify this behaviour, especially in cases whereby fully invoiced GR lines should no longer be considered in any PO searches
				 * @return {boolean} whether or not to add all GR lines to the Invoice form, including the fully invoiced ones, when the user adds one entire PO via the "Add" link
				 * @example
				 * <pre><code>
				 * AddInvoicedGRIVLines: function ()
				 * {
				 *		// Return 'true' to close the PO search as soon as user has added all the open lines from one single PO by clicking the "Add" link
				 *		// Return 'false' (default) to keep the PO search page open after adding one PO, in order to be able to add additional POs
				 *		return true;
				 * }
				 * </code></pre>
				 */
				AddInvoicedGRIVLines: function ()
				{
					// Return 'true' (default) to add all GR lines, including the fully invoiced ones, when the user has clicked the "Add" link on a PO that has the "GR-based IV" tick on
					// Return 'false' to ignore all GR lines which have been fully invoiced when the user clicks the "Add" link on a PO that has the "GR-based IV" tick on
					return false;
				}
			},
			/**
			 * Specifics customization for the Generic PO Browse
			 * @namespace Lib.AP.Customization.HTMLScripts.BrowsePO.Generic
			 * @memberof Lib.AP.Customization.HTMLScripts.BrowsePO
			 */
			Generic:
			{
				/**
				* Allows you to customize the browse of the purchase order and define the elements on the second tab.
				* This user exit is called during the opening of the purchase order browse and determine if the second tab will list only the PO items or the goods receipts if the GR mode is enabled.
				* @memberOf Lib.AP.Customization.HTMLScripts.BrowsePO.Generic
				* @return {boolean} is the second tab contains the goods receipts. You can also return null to work with the default behavior.
				* @example
				* <pre><code>
				* BrowseAtGoodReceiptLevel: function ()
				* {
				*	// The purchase order browse is modified only with de company code FR01
				*	if (Controls.CompanyCode__.GetValue() === "FR01")
				*	{
				*		return true;
				*	}
				*	return false;
				* }
				* </code></pre>
				*/
				BrowseAtGoodReceiptLevel: function ()
				{
				}
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

	/**
	 * New object to handle standard layout customizations
	 */
	var LayoutHelpers =
	{
		/**
		 * Handle header fields display
		 *  @example
		 * <pre><code>
		 * InitHeaderLayout: function()
		 * {
		 *		Controls.InvoiceType__.Hide(true);
		 * },
		 * </code></pre>
		 */
		InitHeaderLayout: function ()
		{
		},
		/**
		 * Handle line items display
		 *  @example
		 * <pre><code>
		 * InitLineItemsLayout: function(lineItemsTable)
		 * {
		 *		lineItemsTable.Buyer__.Hide(true);
		 *		lineItemsTable.Receiver__.Hide(true);
		 * },
		 * </code></pre>
		 */
		InitLineItemsLayout: function (lineItemsTable)
		{
		},
		/**
		 * Init header event handlers
		 *  @example
		 * <pre><code>
		 * SetCustomHeaderEvents: function()
		 * {
		 *		Controls.Z_BAPPrixPartiel__.OnChange = function()
		 *		{
		 *			Controls.Z_BAP.Hide(Controls.Z_BAPPrixPartiel__.IsChecked());
		 *		};
		 * },
		 * </code></pre>
		 */
		SetCustomHeaderEvents: function ()
		{
		},
		/**
		 * Init line items event handlers
		 *  @example
		 * <pre><code>
		 * SetCustomLineItemsEvents: function()
		 * {
		 *		Controls.LineItems__.Z_BAPPrix__.OnChange = function()
		 *		{
		 *	 		var item = this.GetItem();
		 *			Controls.Z_BAP.Hide(item.GetValue("Z_BAPPrix__"));
		 *		};
		 * },
		 * </code></pre>
		 */
		SetCustomLineItemsEvents: function ()
		{
		}
	};

})(Lib.AP.Customization);
