/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_COMMON",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Script AP customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.Common library: common scripts AP customization callbacks
 */

/**
 * Package AP common scripts customization callbacks
 * @namespace Lib.AP.Customization.Common
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.Common
	 */
	parentLib.Common =
	{
		/**
		 * Allows you to define custom user exists added for this customer
		 * Functions defined in this scope will be accessible from outside this library
		 * They can be called the following way Lib.AP.Customization.Common.CustomUserExits.OnComputeExpectedAndOpenValues(invoiceLine, poItemVars, grItemVars)
		 *  @example
		 * <pre><code>
		 * CustomUserExits:
		 * {
		 *		OnComputeExpectedAndOpenValues: function(invoiceLine, poItemVars, grItemVars)
		 *		{
		 *			if (Sys.Parameters.GetInstance("AP").GetParameter("Z_DisableMMDeliveredAmountsChecks", "0") === "1")
		 *			{
		 *				invoiceLine.expectedAmount = invoiceLine.openAmount;
		 *				invoiceLine.expectedQuantity = invoiceLine.openQuantity;
		 *			}
		 *		}
		 * },
		 * </code></pre>
		 */
		CustomUserExits:
		{
		},
		/**
		 * Allows you to define custom Custom functions which are not user exits
		 * i.e. business functions to be called both in server & client libraries
		 * They can be called the following way Lib.AP.Customization.Common.CustomFunctions.ShouldPerformReconciliation()
		 *  @example
		 * <pre><code>
		 * CustomFunctions:
		 * {
		 *		ShouldPerformReconciliation: function()
		 *		{
		 *			return Sys.Parameters.GetInstance("AP").GetParameter("Z_PerformReconciation", "0") === "1";
		 *		}
		 * },
		 * </code></pre>
		 */
		CustomFunctions:
		{
		},
		/**
		 * Allows you to add vendor custom fields which will be filled and emptied along with standard
		 * vendor properties, on client and server side.
		 * @memberof Lib.AP.Customization.Common
		 * @returns requiredFields The updated list of all required fields definition
		 * @example
		 * <pre><code>
		 * GetVendorCustomFields: function ()
		 * {
		 *		// Set mapping between custom field name in 'AP - Vendors__' table and VIP custom field name
		 *		var customFields = [
		 *			{ nameInForm: "Z_VendorSIRET__", nameInTable: "Z_SIRET__" }
		 *		];
		 *
		 *		// OR Set mapping between SAP field name in 'ZESK_VENDORS' view and VIP custom field name ('AP - Vendors__' table doesn't need to be customized but nameInTable mandatory here)
		 *		var customFields = [
		 *			{ nameInForm: "Z_VendorVATNumber__", nameInTable: "Z_VATNumber__", nameInSAP: "STCEG" },
		 *			{ nameInForm: "Z_VendorSIRET__", nameInTable: "Z_SIRET__", nameInSAP: "STCD1" },
		 *			{ nameInForm: "Z_VendorSIREN__", nameInTable: "Z_SIREN__", nameInSAP: "STCD2" },
		 *			{ nameInForm: "Z_VendorTradingPartner__", nameInTable: "Z_TradingPartner__", nameInSAP: "VBUND" },
		 *			{ nameInForm: "Z_VendorReconciliationAct_GL__", nameInTable: "Z_ReconciliationAct_GL__", nameInSAP: "AKONT" }
		 *		];
		 *
		 *		return customFields;
		 * }
		 * </code></pre>
		 */
		GetVendorCustomFields: function ()
		{

		},

		/**
		 * Return the list of the required fields based on the current invoice state
		 * See {@link Lib.ERP.Invoice.GetRequiredFieldsCallback} for more details
		 * On client side, the item parameter is only set during the validateData process.
		 * On form loading, only the table header can be set as required and in this case the item parameter is empty.
		 * @memberof Lib.AP.Customization.Common
		 * @param {ERPTypes.RequiredFields} requiredFields The list of all required fields definition
		 * @returns {ERPTypes.RequiredFields} requiredFields The updated list of all required fields definition
		 * @example
		 * <pre><code>
		 * GetRequiredFields: function (requiredFields)
		 * {
		 *		// Set invoice number always required
		 *		requiredFields.Header.InvoiceNumber__ = true;
		 *
		 *		// Set LineItems__ GLAccount__ column required if CodingEnableGLAccount is enabled in the configurator depending on the current row lineType__
		 *		// On client side, the item parameter is only set during the validateData process. On form loading,
		 *		// only the table header can be set as required and in this case the item parameter is empty.
		 *		var apParameters = Sys.Parameters.GetInstance("AP");
		 *		requiredFields.LineItems__.GLAccount__ = function(item) {
		 *			var lineType = item ? item.GetValue("LineType__") : Lib.P2P.LineType.GL;
		 *			return lineType === 'GL' && apParameters.GetParameter("CodingEnableGLAccount") === "1";
		 *		};
		 *		return requiredFields;
		 * }
		 * </code></pre>
		 */
		GetRequiredFields: function (requiredFields)
		{

		},

		/**
		* This function is called when an IBAN has been extracted and does not match any of vendor's bank account. By default,
		* Vendor Invoice Extraction Script set a warning on ExtractedIBAN__ field. This function allows you to set a different
		* alert level and message on this field.
		* @param {Text} [extractedIbanControl] the ExtractedIBAN__ field control (only when called from the custom script)
		* @return {boolean} is the alert level has been customized. You can also return null or false to work with the default behavior.
		* <pre><code>
		* SetAlertWhenExtractedIBANDoesNotMatch: function(extractedIbanControl)
		* {
		*	// change alert level to error and keep the same alert message
		*	Data.SetError("ExtractedIBAN__", "_Extracted IBAN does not match");
		*	if (extractedIbanControl)
		*	{
		*		// set a red background to the field
		*		extractedIbanControl.AddStyle("highlight-danger");
		*	}
		*   // return false to keep benefits of default extra behavior such as the top banner
		*	// you may return true if you don't wan't the banner for example.
		*	return false;
		* }
		* </code></pre>
		*/
		SetAlertWhenExtractedIBANDoesNotMatch: function (extractedIbanControl)
		{
		},

		/**
		 * Allows you to customize the validation settings for the Vendor invoice process.
		 * This user exit is called at the end of the validation script of the process.
		 * @memberof Lib.AP.Customization.Common
		 * @param {boolean} isFormValid The actual validation status of the form
		 * @returns {boolean|IPromise<boolean>} isFormValid The updated validation status of the form
		 * @example
		 * <pre><code>
		 * OnValidateForm: function(isFormValid)
		 * {
		 * 		if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart &&
		 * 			Lib.AP.WorkflowCtrl.GetNbRemainingControllers() === 0 &&
		 * 			Lib.AP.WorkflowCtrl.GetNbRemainingApprovers() === 0)
		 * 		{
		 * 			// If the current step role is the AP Clerk
		 * 			// and if not a single validator is set, add an error on the invoice status field (the error will be clean at the next try)
		 * 			Data.SetError("InvoiceStatus__", "At least one approver is required before posting");
		 * 			return false;
		 * 		}
		 * 		return isFormValid;
		 * }
		 * </code></pre>
		 */
		OnValidateForm: function (isFormValid)
		{

		},

		/**
		 * Allows you to retrieve the customized name from the specified default BAPI name.
		 * @memberof Lib.AP.Customization.Common
		 * @param {string} originalBapiName possible values are:
		 * 		"BAPI_INCOMINGINVOICE_CREATE"
		 * 		"Z_ESK_INCOMINGINVOICE_SIMULATE"
		 * 		"BAPI_ACC_DOCUMENT_POST"
		 *		"BAPI_ACC_DOCUMENT_CHECK"
		 * @returns {string} bapiName The custom BAPI name
		 * @example
		 * <pre><code>
		 * GetBAPIName: function(originalBapiName)
		 * {
		 * 	var customBapiName;
		 * 	switch (originalBapiName)
		 * 	{
		 * 		case "BAPI_INCOMINGINVOICE_CREATE":
		 * 			customBapiName = "Z_CUSTOM_BAPI_INVOICE_CREATE";
		 * 			break;
		 * 		default:
		 * 			customBapiName = originalBapiName;
		 * 			break;
		 * 	}
		 * 	return customBapiName;
		 * }
		 * </code></pre>
		 */
		GetBAPIName: function (originalBapiName)
		{

		},

		/**
		 * Allows you to retrieve the customized name from the specified default BAPI name.
		 * @memberof Lib.AP.Customization.Common
		 * @param {string} bapiname The current BAPI to initialize, if overrided by user exit GetBAPIName should be the bapiname returned e.g. Z_BAPI_ACC_DOCUMENT_POST
		 * @param {string} bapialias The usual BAPI name, if overrided by user exit GetBAPIName should be the original bapiname e.g BAPI_ACC_DOCUMENT_POST
		 * @param {json} defaultBapiParams the default bapi params resolved for the bapialias
		 * @return {json} The overrided default bapi params for the bapiname/bapialias
		 * @example
		 * <pre><code>
		 * GetDefaultBAPIParams: function(bapiname, bapialias, defaultBapiParams)
		 * {
		 * 	if (
		 * 			(bapialias === "BAPI_ACC_DOCUMENT" &&	bapiname === "Z_BAPI_ACC_DOC_POST_DOCOMMIT") ||
		 * 			(!bapialias && bapiname === "Z_BAPI_ACC_DOC_POST_DOCOMMIT")
		 * 	)
		 * 	{
		 * 		// Define your needed bapi params structure for this specific bapi
		 * 		return {
		 * 			EXPORTS: {},
		 * 			IMPORTS:{},
		 * 			TABLES:{}
		 * 		};
		 * 	}
		 * 	return defaultBapiParams;
		 * }
		 * </code></pre>
		*/
		GetDefaultBAPIParams: function (bapiname, bapialias, defaultBapiParams)
		{
			return defaultBapiParams;
		},

		/**
		* Allows you to fill the Cost Type according the GLAccount.
		* @param {object} item the line item the user is modifying
		* @example
		* <pre><code>
		* FillCostType: function (item)
		*{
		*	switch(item.GetValue("GLAccount__"))
		*	{
		*		case "8300":
		*			item.SetValue("CostType__","CapEx");
		*				break;
		*		default:
		*			item.SetValue("CostType__","OpEx");
		*			break;
		*	}
		*}
		* </code></pre>
		*/
		FillCostType: function (item)
		{
		},

		/**
		 * low Currencies may be stored in SAP without decimal, but in some SAP system, TCURF.FFACT gives 1 instead of 100 and falses Simulation result amounts,
		 * high Currencies may be stored in SAP with decimal, but in some SAP system, TCURF.FFACT gives 100 instead of 1 and falses Simulation result amounts
		 *
		 * Return all currency external factors to force if SAP returns an unexpected value
		 * @memberof Lib.AP.Customization.Common
		 * @param {string} SAPCurrenciesExternalFactors
		 * @returns {object}
		 * @example
		 * <pre><code>
		 * SAPCurrenciesExternalFactors: function()
		 * {
		 * 	return {
		 * 		JPY: 100
		 *  };
		 * }
		 * </code></pre>
		 */
		SAPCurrenciesExternalFactors: function ()
		{
		},

		/**
		 * low Currencies may be stored in SAP without decimal, but in some SAP system, TCURF.FFACT gives 1 instead of 100 and falses Simulation result amounts,
		 * high Currencies may be stored in SAP with decimal, but in some SAP system, TCURF.FFACT gives 100 instead of 1 and falses Simulation result amounts
		 *
		 * Return all currency foreign factors to force if SAP returns an unexpected value
		 * @memberof Lib.AP.Customization.Common
		 * @deprecated use Lib.AP.Customization.Common.SAPCurrenciesExternalFactors instead
		 * @param {string} SAPForeignCurrenciesFactorForSimulation
		 * @returns {object}
		 * @example
		 * <pre><code>
		 * SAPForeignCurrenciesFactorForSimulation: function()
		 * {
		 * 	return {
		 * 		EUR: {
		 * 			JPY: 1,
		 * 			USD: 100
		 * 		}
		 *  };
		 * }
		 * </code></pre>
		 */
		SAPForeignCurrenciesFactorForSimulation: function ()
		{
		},

		/**
		 * This user exit will be called each time a call to Lib.AP.SAP.CheckVendorNumber is made.
		 * It can be use to override the default behavior or add extra checks.
		 * @param {object} validationData a structure representing the state of validation
		 * @param {boolean} validationData.isValid indicates if the header vendor number is valid
		 * @param {string} validationData.vendorNumber represents the number against which is test the header vendor number,
		 * if not specified, the comparison is made against vendor number on each line items
		 * @returns a boolean to indicates if the user exit should override the default beahavior (true) or apply the default behavior (false)
		 * @example
		 * <pre><code>
		 * SAPCheckVendorNumber: function(validationData)
		 * {
		 * 		// threat as error instead of warning
		 * 		if (!validationData.isValid)
		 * 		{
		 * 			Data.SetError("VendorNumber__", "Vendor should match");
		 * 		}
		 * 		// return true to avoid the default behavior to apply
		 * 		return true;
		 * }
		 * </code></pre>
		 */
		SAPCheckVendorNumber: function (validationData)
		{
		},

		/**
		 * Allows you to customize the way the solution rounds the amounts during tax computation
		 * Returns a JSON object that set the amount precision to consider and the function used to round the amount.
		 * If an attribute is omitted in the return JSON object, default value is used (2 for precision, and "round half-up" function for roundingFct)
		 * and the user exit returns null, the default value is 2 for precision, and "round half-up" function for roundingFct
		 * @memberof Lib.AP.Customization.Common
		 * @returns {object} Json containing {precision: number, roundingFct: (amount: number, precision: number) => roundedAmount: number}
		 * @example
		 * <pre><code>
		 * GetTaxRoundingParameters: function()
		 * {
		 * 		if (Data.GetValue('InvoiceCurrency__') === 'JPY')
		 * 		{
		 * 			return {
		 * 				"precision": 0,
		 * 				"roundingFct": function(amount, precision)
		 * 				{
		 * 					var factor = Math.pow(10, precision);
		 * 					return Math.floor(amount*factor)/factor;
		 *				}
		 * 			};
		 * 		}
		 * 		return null;
		 * }
		 * </code></pre>
		 */
		GetTaxRoundingParameters: function ()
		{
		},

		/**
		 * Allows you to customize the separator used on multiple selection of tax code
		 * Returns a string that set the separator for concatenation of taxes code.
		 * If return null, the default separator is used
		 * @memberof Lib.AP.Customization.Common
		 * @returns {string} the separator for concatenation of taxes code
		 * @example
		 * <pre><code>
		 * CustomizeMultipleTaxesSeparator: function()
		 * {
		 * 		if (Data.GetValue("CompanyCode__") === "CA01")
		 * 		{
		 * 			return "|";
		 * 		}
		 * 		return null;
		 * }
		 * </code></pre>
		 */
		CustomizeMultipleTaxesSeparator: function ()
		{
		},

		/**
		 * Allows you to set tax code browse in multiple selection browse
		 * Returns a boolean if return true the tax code browse allow multiple selection.
		 * else return null or false, the tax code browse allow one selection.
		 * @memberof Lib.AP.Customization.Common
		 * @returns {boolean} A boolean indicating if the tax browse allows multiple selection.
		 * @example
		 * <pre><code>
		 * SetInvoiceUseMultipleTaxes: function()
		 * {
		 * 		if (Data.GetValue("CompanyCode__") === "CA01")
		 * 		{
		 * 			return true;
		 * 		}
		 * 		return false;
		 * }
		 * </code></pre>
		 */
		SetInvoiceUseMultipleTaxes: function ()
		{
		},

		/**
		 * @description allows you to define custom messages to inject in conversations. You can differenciate the messages with the messageDesc parameter.
		 * @param {string} messageDesc description of the message.
		 * @returns {string} The customized message to inject in the conversation.
		 *
		 * @example
		 * <pre><code>function CustomizeAutomaticMessage(messageDesc)
		 * {
		 * 	// we want to add another information to the generated lines of the vendor statement reconciliation conversation
		 * 	// we added a new translation key "_Invoice {0} missing date of {1} for amount {2} and tax amount {3}" on the process and use this user exit to fill the fourth parameter
		 * 	var message = "";
		 * 	if (messageDesc == "missingInvoices")
		 * 	{
		 * 		var statementDate = Language.FormatDate(Data.GetValue("StatementDate__"));
		 * 		var invoicesList = [];
		 * 		var invoicesTableArray = Data.GetTable("InvoicesTable__");
		 * 		for (var i = 0; i < invoicesTableArray.GetItemCount(); i++)
		 * 		{
		 * 			var currentItem = invoicesTableArray.GetItem(i);
		 * 			var status = currentItem.GetValue("MatchingStatus__");
		 * 			if (status === Lib.AP.StatementMatching.Status.missing)
		 * 			{
		 * 				var invoiceDate = currentItem.GetValue("ReferenceDate__");
		 * 				var invoiceNumber = currentItem.GetValue("ReferenceNumber__");
		 * 				var invoiceAmount = currentItem.GetValue("ReferenceAmount__");
		 * 				var invoiceTaxAmount = currentItem.GetValue("ReferenceTaxAmount__");
		 * 				invoicesList.push(Language.Translate(
		 * 					"_Invoice {0} missing date of {1} for amount {2} and tax amount {3}",
		 * 					false,
		 * 					invoiceNumber,
		 * 					Language.FormatDate(invoiceDate),
		 * 					invoiceAmount,
		 * 					invoiceTaxAmount));
		 * 			}
		 * 		}
		 * 		message = Language.Translate("_Conversation invoices missing for the date: {0}, invoice list: {1}", false, statementDate, invoicesList.join("\n"));
		 * 	}
		 * 	return message;
		 * }</code></pre>
		 **/
		CustomizeAutomaticMessage: function (messageDesc)
		{
		},

		/**
		 * Specifics customization for purchase orders
		 * @namespace Lib.AP.Customization.Common.PurchaseOrder
		 * @memberof Lib.AP.Customization.Common
		 */
		PurchaseOrder:
		{
			/**
			* Allows you to choose whether a purchase order or goods receipt item should be added into the Line Items table of the Vendor invoice process when adding a purchase order.
			* @memberof Lib.AP.Customization.Common.PurchaseOrder
			* @param {boolean} isPoLineAdded The original condition result
			* @param {Object} poItemVars Po item object
			* @param {Object} grItemVars GR item object
			* @example
			* <pre><code>
			* AddPoLine: function (isPoLineAdded, poItemVars, grItemVars)
			* {
			* 	if(poItemVars)
			*	{
			*		isPoLineAdded = true;
			*	}
			*	else
			*	{
			*		isPoLineAdded = false;
			*	}
			*	return isPoLineAdded;
			* }
			* </code></pre>
			*/
			AddPoLine: function (isPoLineAdded, poItemVars, grItemVars)
			{
			},

			/**
			 * @description Allows you to customize PO line details when the values are being added to the LineItems__ table
			 * @memberof Lib.AP.Customization.Common.PurchaseOrder
			 * @function OnAddPOLine
			 * @version 5.186 and higher
			 * @param {object} tableItem Data.Item object representing the line item being added in the LineItems__ table
			 * @param {object} poItemDetails JavaScript object representing the PO line details retrieved from the ERP (Line number, Tax code, Ordered quantity, etc.)
			 *		poItemDetails JavaScript Object attributes depend on ERP and client/server side.
			 *		Refer to the "sapMMAddLineItem" and "genericAndSapPOGLAddLineItem" methods in customscript, as well as the "AddPOLine" methods in Lib_AP for further details
			 * @param {object} poDetails Optional: In SAP-connected mode only, SapBAPI object representing all PO details as returned by BAPI_PO_GETDETAIL (Header details, PO history, etc.)
			 * @example
			 *	In the following example, the user exit is implemented to fill the taxCode field with a default value when missing on the PO line in the ERP.
			 *	It can prove useful for the AP Specialist if the Buyer didn't specify a tax code upon creating the PO but the nature of the company's business makes so that the Tax code always follows the same logic.
			 *	<pre><code>
			 *	OnAddPOLine: function (tableItem, poItemDetails, poDetails)
			 *	{
			 *		if (tableItem && !tableItem.GetValue("TaxCode__"))
			 *		{
			 *			var prefix = "[" + tableItem.GetValue("OrderNumber__") + "/" + tableItem.GetValue("ItemNumber__") + "] ";
			 *			if (tableItem.GetValue("GLAccount__") === "123456")
			 *			{
			 *				Log.Info(prefix + "Applying tax code P0 for G/L '12345'");
			 *				tableItem.SetValue("TaxCode__", "P0");
			 *			}
			 *			else
			 *			{
			 *				Log.Info(prefix + "Applying tax code P1");
			 *				tableItem.SetValue("TaxCode__", "P1");
			 *			}
			 *		}
			 *	}
			 *	</code></pre>
			**/
			OnAddPOLine: function (tableItem, poItemDetails, poDetails)
			{
			},

			/**
			* Use this function to add an extra research criteria upon current po number.
			* Basically it is used when only a part on the purchase order is known as
			* it may append when dealing with blanket purchase order,
			* or when reading a contract number to query the ERP or the local P2P - Contract records
			* to return an array of potential po numbers
			* @memberof Lib.AP.Customization.Common.PurchaseOrder
			* @param {string} poNumber The original current purchase order number
			* @returns {string} or {array} of {string} The extended research string(s)
			* @example
			* <pre><code>
			* GetExtendedPOSearchCriteria: function (poNumber)
			* {
			*   // fully qualified blanket poNumber should be [bpoNumber]-[releaseNumber]
			* 	if (poNumber.indexOf('-') < 0)
			*	{
			*       // if poNumber represent only the bpoNumber part, extend search criteria to all ponumber based on the BPO
			*		return  poNumber+"-*";
			*	}
			*
			*	var sapContractx = /^0*[1-9][0-9]{5}$/;
			*	if (poNumber && Lib.ERP.IsSAP() && sapContractx.test(poNumber))
			*	{
			*		// if captured poNumber has a contract syntax (here 6 digits), query the ERP or the local P2P - Contract records to retrieve the related poNumbers
			*		var bapiParams = Lib.AP.SAP.PurchaseOrder.GetBapiParameters();
			*		if (bapiParams)
			*		{
			*			var poFoundByContract = [];
			*			var contractNum = Sys.Helpers.String.SAP.NormalizeID(poNumber, 10);
			*			var filter = "KONNR = '" + contractNum + "'";
			*			Log.Info("potential SAP contract captured on the document, search related POs in SAP: EKPO.EBELN, filter " + filter);
			*			var contractQueryResults = Sys.Helpers.SAP.ReadSAPTable(bapiParams.GetBapi("RFC_READ_TABLE"), "EKPO", "EBELN", filter, 0, 0, false, { "useCache": true });
			*			for (var i=0; contractQueryResults && i<contractQueryResults.length; i++)
			*			{
			*				var poNum = Sys.Helpers.String.SAP.Trim(contractQueryResults[0].EBELN);
			*				if (poFoundByContract.indexOf(poNum) ==-1) {
			*					poFoundByContract.push(poNum);
			*				}
			*			}
			*			if (poFoundByContract.length) {
			*				Log.Info("Found POs " + poFoundByContract.join(","));
			*				return poFoundByContract;
			*			}
			*		}
			*		else {
			*			Log.Warn("Could not load bapiParam to search POs in SAP from read contract number " + poNumber);
			*		}
			*	}
			*   // if the poNumber specified is fully qualified, don't return extended search criteria
			*	return null;
			* }
			* </code></pre>
			*/
			GetExtendedPOSearchCriteria: function (poNumber)
			{
				return null;
			}
		},

		/**
		 * Specifics customization for SAP
		 * @namespace Lib.AP.Customization.SAP
		 * @memberof Lib.AP.Customization
		 */

		SAP:
		{
			/**
			 * Allow to send or not the I_ACCDATA parameter to the Z_ESK_CALCULATE_TAX_FRM_NET BAPI
			 * @returns {boolean} True to send the fill and send the I_ACCDATA, false to avoid this.
			 * @example
			 * <pre><code>
			 * OnBuildOfApprovers: function()
			 * {
			 *		return false;
			 * }
			 * </code></pre>
			 */
			ShouldAddAccDataParameterForTaxComputation: function ()
			{

			},

			/**
			 * Allow to customize the data sent in the I_ACCDATA parameter of the Z_ESK_CALCULATE_TAX_FRM_NET BAPI
			 * @param {KeyValueObject} currentAccData The current values that will be sent to SAP.
			 * @param {Item} lineItem The current line item for which the tax is computed
			 * @returns {KeyValueObject} The key-value object to sent to SAP
			 * @example
			 * <pre><code>
			 * GetAccDataParameterForTaxComputation: function(currentAccData, lineItem)
			 * {
			 *		return { LIFNR: Data.GetValue("VendorNumber__") };
			 * }
			 * </code></pre>
			 */
			GetAccDataParameterForTaxComputation: function (currentAccData, lineItem)
			{

			},

			/**
			 * Enable trimming of PartNumber__ leading zeros for PO items.
			 * @param {any} itemDetails An object containing all of the line item parameters.
			 * @returns {boolean} True if the leading zeros on the material number should be truncated, false otherwise.
			 */
			TrimPartNumberLeadingZeros: function (itemDetails)
			{
				return false;
			},

			/**
			 * @description Allow to customize the language used in SAP queries.
			 * By default, the user's language is used
			 * @memberof Lib.AP.Customization.Common.SAP
			 * @returns {string} Keyword to define the language :
			 * 		"%EDWLANGUAGE%" if you want to use the user's language
			 * 		"%SAPCONNECTIONLANGUAGE%" if you want to use the SAP configuration language
			 * 		"FR" or "IT" if you want you can set a ISO code manually to force it
			 * @example
			 * <pre><code>
			 * CustomQueryLanguage: function()
			 * {
			 * 		var queryLanguage = "";
			 *		switch(Sys.Helpers.Globals.User.language.toUpperCase())
			 *		{
			 *			case "FR":
			 *			case "EN":
			 *				queryLanguage = "%EDWLANGUAGE%";
			 *			break;
			 *			case "IT":
			 *				queryLanguage = "FR";
			 *			break;
			 *			default:
			 *				queryLanguage = "%SAPCONNECTIONLANGUAGE%";
			 *		}
			 * 		return queryLanguage;
			 * }
			 * </code></pre>
			 */
			CustomQueryLanguage: function ()
			{

			}
		},

		/**
		 * Specifics customization for the workflow
		 * @namespace Lib.AP.Customization.Workflow
		 * @memberof Lib.AP.Customization
		 */
		Workflow:
		{
			/**
			 * The current action that cause the rebuild of the workflow
			 * @memberof Lib.AP.Customization.Common.Workflow
			 * @typedef {object} workflowActions
			 * @property {string} name - The name of the action.
			 * Possible values are :
			 *	- balanceUpdated : Happens after the update of the cost center
			 *	- contributorAdded : Happens when a contributor is manually added
			 *	- contributorRemoved : Happens when a contributor is manually removed
			 *	- costCenterUpdated : Happens after the update of the cost center
			 *	- exceptionChanged : Happens after the update on the current workflow exception
			 *	- manualLink : Happens after a manual link
			 *	- mobileAppRebuild : Happens when a reviewer or an approver approve from the mobile application
			 *	- quantityChanged: Happens after the quantity has changed on one invoice line item
			 *	- subsequentDocBoxTicked: Happens after a user has ticked the "Subsequent document" checkbox
			 *	- subsequentDocBoxUnticked: Happens after a user has unticked the "Subsequent document" checkbox
			 *	- updateContributor : Happens when a contributor is replaced
			 *	- workflowReviewEnd : Happens when all the reviewers approved
			 */

			/**
			 * Allows you to enable or disable the update of reviewers in the workflow when the workflow is recomputed.
			 * This user exit is called in the Vendor invoice process, when an action that causes the workflow to recompute is performed.
			 * ATTENTION: For versions 5.165 or lower of the application, this user exit is part of the LIB_AP_CUSTOMIZATION_HTMLSCRIPTS library.
			 * @memberOf Lib.AP.Customization.Common.Workflow
			 * @param {Lib.AP.Customization.Workflow.workflowActions} action The action that cause the rebuild of the workflow
			 * @param {boolean} isAllowed A boolean indicating if the computation is allowed or not
			 * @returns {boolean} A boolean indicating if the computation is allowed or not. If null, the default value is used
			 * @example
			 * <pre><code>
			 * OnBuildOfReviewers: function(action, isAllowed)
			 * {
			 * 	if (action.name === 'costCenterUpdated' || action.name === 'mobileAppRebuild')
			 *	{
			 *		return true;
			 *	}
			 * }
			 * </code></pre>
			 */
			OnBuildOfReviewers: function (action, isAllowed)
			{
			},

			/**
			 * Allows you to enable or disable the update of approvers in the workflow when the workflow is recomputed.
			 * This user exit is called in the Vendor invoice process, when an action that causes the workflow to recompute is performed.
			 * @memberOf Lib.AP.Customization.Workflow
			 * @returns {boolean} A boolean indicating if the computation is allowed or not. If null, the default value is used
			 * @example
			 * <pre><code>
			 * OnBuildOfApprovers: function()
			 * {
			 *		return false;
			 * }
			 * </code></pre>
			 */
			OnBuildOfApprovers: function ()
			{
			},

			/**
			 * Use this function to allow or disable the automatic detection of invoice exceptions (e.g. Quantity mismatch, Price mismatch) on both server and client sides.
			 * This option is automatically enabled when first receiving the invoice and processing it on the server side (extraction script).
			 * However, this is not done on the client side to avoid risking infinite workflow loops, where one exception is cleared and invoice comes back to the AP specialists, only to modify more information which in turn triggers the exception workflow again.
			 * Return true on the client side or false on the server side to modify this behaviour.
			 * @memberOf Lib.AP.Customization.Common.Workflow
			 * @param {Lib.AP.Customization.Common.Workflow.workflowActions} action The action that triggered the rebuild of the workflow
			 * @param {boolean} computeControllers A boolean indicating whether workflow rebuild was triggered with the intention to detect reviewers (workflow before posting in ERP)
			 * @param {boolean} computeApprovers A boolean indicating whether workflow rebuild was triggered with the intention to detect approvers (workflow after posting in ERP)
			 * @returns {boolean} whether or not to allow automatic detection of exceptions on the invoice
			 * @example
			 * <pre><code>
			 * AutoGuessException: function (action, computeControllers, computeApprovers)
			 * {
			 *		// true : Automatically detect invoice exceptions every time workflow is built (default on server side)
			 *		// false: Do not automatically detect invoice exceptions when building workflow; leave manual exception selection to the AP user (default on client side)
			 *		// /!\ this function is very powerful and is called in multiple situations where you would probably not expect any exception to be computed
			 *		//	for instance :
			 *		//		- manual change of the Exception field
			 *		//		- within or after the exception workflow itself workflow
			 *		//		- non PO invoices
			 *
			 *		if (!Lib.AP.InvoiceType.isPOInvoice()
			 *			|| (action && action.name == "workflowReviewEnd")
			 *			|| (action && action.name == "exceptionChanged")
			 *			|| Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.controller
			 *			|| Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.approver
			 *			|| Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apEnd)
			 *		{
			 *			return false;
			 *		}
			 *		else
			 *		{
			 *			return true; // ACTIVE for both server and client side
			 *		}
			 *
			 * }
			 * </code></pre>
			 *
			 */
			AutoGuessException: function (action, computeControllers, computeApprovers)
			{
			}
		},

		/**
		* Choose whether you want to prevent the system from updating the local PO tables (PO Headers, PO items, Goods receipts).
		* The standard configuration (return false value) updates the tables so that extra posting against a PO is prevented in case it ran out of available amount/quantity to invoice.
		* However, it leads to some desynchronization between replicated master data and data available in the local tables.
		* In the case where:
		*  - the master data shall always override local tables data
		*  - Posting acknowledgements are not always sent to the solution on time
		*  One can deactivate local table updates with this user exit.
		* Beware that extra posting between two master data replication is no longer detected when local PO Table update is deactivated
		* @memberof Lib.AP.Customization.Common
		* @returns {boolean} false (default) to indicate that PO tables shall be updated by the system.
		* @example
		* <pre><code>
		* DeactivateLocalPOTableUpdates: function ()
		* {
		*	return true;
		* }
		* </code></pre>
		*/
		DeactivateLocalPOTableUpdates: function ()
		{
			return false;
		},

		/**
		* Use this function to change the default value for duplicate check and touchless functionality.
		*
		* @memberof Lib.AP.Customization.Common
		* @returns {{defaultDuplicateLevel:string, defaultTouchlessValue: string}|null} The set of values
		* @example
		* <pre><code>
		* getDefaultParametersValues: function ()
		* {
		*   // We change the value of duplicate check to 2 as default
		*	return {defaultDuplicateLevel: "2", defaultTouchlessValue: "0"};
		* }
		* </code></pre>
		*/
		getDefaultParametersValues: function ()
		{
			return null;
		},

		/**
		* Use this function to allow dynamic discounting in invoice.
		*
		* @memberof Lib.AP.Customization.Common
		* @returns {boolean} True if dynamic discounting is allowed and False to probihit it
		* @example
		* <pre><code>
		* IsDynamicDiscountingAllowed: function ()
		* {
		*   return true;
		* }
		* </code></pre>
		*/
		IsDynamicDiscountingAllowed: function ()
		{
			return null;
		},

		/**
		* Use this function to allow customizing VI posting date computation.
		*
		* @memberof Lib.AP.Customization.Common
		* @param {ESKMap<string>[]} queryResults The list of results queried in the "AP - BackdatingPeriods__" table from posting date reference, company code and invoice type
		* @returns {Date} return the custom computed posting date
		* @example
		* <pre><code>
		* OnComputeBackdatingTargetDate: function (queryResults)
		* {
		*	// if the invoice is a credit note, then use the result with empty company code
		*	if (Data.GetValue("InvoiceAmount__") < 0)
		*	{
		*		queryResults.forEach((result: ESKMap<string>) =>
		*		{
		*			if ((!Sys.Helpers.IsEmpty(result.CompanyCode__))
		*			{
		*				return new Date(result.BackdatingTargetDate__);
		*			}
		*		});
		*	}
		* 	return null;
		* }
		* </code></pre>
		*/
		OnComputeBackdatingTargetDate: function (queryResults)
		{
			return null;
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
	 * 		SetWarningOnLineItem: function(lineItem, warningMessage)
	 * 		{
	 *			lineItem.SetWarning("Z_CustomField__", "My custom warning: " + warningMessage);
	 *		}
	 * };
	 * </code></pre>
	 */
	// Uncomment here
	// var CustomHelpers =
	// {
	// };

})(Lib.AP.Customization);
