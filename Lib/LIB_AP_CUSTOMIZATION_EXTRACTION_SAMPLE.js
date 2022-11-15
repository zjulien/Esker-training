/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_EXTRACTION",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Extraction script AP customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.Extraction library: extraction script AP customization callbacks
 */

/**
 * Package AP extraction script customization callbacks
 * @namespace Lib.AP.Customization.Extraction
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.Extraction
	 */
	parentLib.Extraction =
	{
		/**
		 * Allows you to define custom user exists added for this customer
		 * Functions defined in this scope will be accessible from outside this library
		 * They can be called the following way Lib.AP.Customization.Extraction.CustomUserExits.OnValidateOrdersAndFillPOBegin(orderNumbersCandidates)
		 *  @example
		 * <pre><code>
		 * CustomUserExits:
		 * {
		 *		OnValidateOrdersAndFillPOBegin: function(orderNumbersCandidates)
		 *		{
		 *			//Fill Company code and vendor number when order number is extracted from FTR
		 *
		 *			if (!Sys.Helpers.IsEmpty(Data.GetValue("OrderNumber__")))
		 *			{
		 *				ExtractionHelper.FillCompanyCodeAndVendorNumberfromPO();
		 *			}
		 *		}
		 * },
		 * </code></pre>
		 */
		CustomUserExits:
		{
		},
		/**
		 * Allows you to customize extraction settings. This user exit is called at the beginning of the extraction script of the Vendor invoice process.
		 * @example
		 * <pre><code>
		 * OnExtractionScriptBegin: function ()
		 * {
		 * 	// Run custom code to determine the company code,
		 *  // so the rest of the processing can use the proper settings
		 * 	var firstRecordRuidEx = Data.GetValue("SourceRUID");
		 *	if (firstRecordRuidEx.indexOf("ISM") === 0)
		 *	{
		 *		// Fetch email record and retrieve sender address and recipient address
		 *		var senderAddress = "myCompany@us.acme.com"; // ...
		 *
		 *		if (senderAddress.indexOf("@us") > 0)
		 *		{
		 *			Data.SetValue("CompanyCode__", "US01");
		 *		}
		 *		else if (senderAddress.indexOf("@fr") > 0)
		 *		{
		 *			Data.SetValue("CompanyCode__", "FR01");
		 *		}
		 *		else
		 *		{
		 *			// Keep default company code, set via Configurator
		 *		}
		 *	 }
		 * }
		 * </code></pre>
		 */
		OnExtractionScriptBegin: function ()
		{

		},

		/**
		 * Allows you to customize extraction settings. This user exit is called at the end of the extraction script of the Vendor invoice process.
		 * ATTENTION: During the execution of the extraction script, some fields are set or inferred based on reference fields (for example, Company code). It is recommended not to modify these reference fields in this user exit as this could result in inconsistencies in the Vendor invoice process
		 * @example
		 * <pre><code>
		 * OnExtractionScriptEnd: function ()
		 * {
		 * 	// Initialize posting date with invoice date
		 * 	var invoiceDate = Data.GetValue("InvoiceDate__");
		 * 	Data.SetValue("PostingDate__", invoiceDate);
		 * }
		 * </code></pre>
		 */
		OnExtractionScriptEnd: function ()
		{

		},

		/**
		 * For Vendor Invoice Batch process
		 * --------------------------------
		 * Allows you to customize extraction settings. This user exit is called at the beginning of the extraction script of the Vendor invoice batch process.
		 */
		OnBatchExtractionScriptBegin: function ()
		{

		},

		/**
		 * For Vendor Invoice Batch process
		 * --------------------------------
		 * Allows you to customize extraction settings. This user exit is called at the end of the extraction script of the Vendor invoice batch process.
		 */
		OnBatchExtractionScriptEnd: function ()
		{

		},

		/**
		 * Allows you to customize the owner of the Vendor invoice process. This user exit is called at the end of the extraction script of the process.
		 * This user exit is only called when the invoice is manually entered in Document Manager, or when the invoice is submitted in the Vendor Portal.
		 * @example
		 * <pre><code>
		 * DetermineVendorInvoiceOwner: function ()
		 * {
		 *     if (Data.GetValue("CompanyCode__") === "FR01")
		 *     {
		 *         return "apspecialists-FR@example.com";
		 *     }
		 *     else
		 *     {
		 *         return "apspecialists-US@example.com";
		 *     }
		 * }
		 * </code></pre>
		 */
		DetermineVendorInvoiceOwner: function ()
		{

		},

		/**
		 * This function type is used to define `GetDefaultCurrency` option for Synergy post-processing
		 *
		 * @callback getDefaultCurrency
		 * @memberof Lib.AP.Customization.Extraction
		 * @returns {string} the default currency
		 */

		/**
		 * This function type is used to define `CurrencyHasDecimal` option for Synergy post-processing
		 *
		 * @callback currencyHasDecimal
		 * @memberof Lib.AP.Customization.Extraction
			 * @param {string} currency the currency to evaluate
		 * @returns {boolean} True if the currency has decimal (should be the default)
		 */

		/**
		 * Allows you to customize the algorithm used for synergy post processing.
		 * This user exit is called by the extraction script of the Vendor invoice process.
		 * @param {object} options A JSON describing specific callback use in synergy post-processing
		 * @param {Lib.AP.Customization.Extraction.getDefaultCurrency} options.GetDefaultCurrency a function returning the currency to use if not retrieved by synergy (should return an ISO code)
		 * @param {Lib.AP.Customization.Extraction.currencyHasDecimal} options.CurrencyHasDecimal a function that determine if a currency has decimals or not (should return a boolean)
		 *
		 * @returns {object} The updated JSON of all options used for synergy post-processing
		 * @example
		 * <pre><code>
		 * SetSynergyPostProcessingOptions: function (options)
		 * {
		 *     	// set dong as default currency
		 *     	function GetDefaultCurrency ()
		 *     	{
		 *     	    return "VND";
		 *     	}
		 *
		 *     	// specify that yens and dongs haven't decimals
		 *     	function CurrencyHasDecimal (currency)
		 *     	{
		 *     	    if (currency === "JPY" || currency === "VND")
		 *     	    {
		 *     	        return false;
		 *     	    }
		 *     	    return true;
		 *     	}
		 *
		 *     	options.GetDefaultCurrency = GetDefaultCurrency;
		 *     	options.CurrencyHasDecimal = CurrencyHasDecimal;
		 *
		 *     	return options;
		 * }
		 * </code></pre>
		 */
		SetSynergyPostProcessingOptions: function (options)
		{

		},

		/**
		 * Allows you to customize the algorithm used for the vendor determination with new keywords, heuristics, etc.
		 * This user exit is called by the extraction script of the Vendor invoice process.
		 * @param {object} parameters A JSON describing the default parameters used for first time recognition module
		 * @returns {object} The updated JSON of all parameters used for first time recognition module
		 * @example
		 * <pre><code>
		 * GetInvoiceFTRParameters: function (parameters)
		 * {
		 *     // append italian total keyword to amount recognition list of keywords
		 *     parameters.amountAnchorKeywords.push("totale");
		 *     return parameters;
		 * }
		 * </code></pre>
		 */
		GetInvoiceFTRParameters: function (parameters)
		{

		},

		/**
		 * Allows you to customize the order number candidates from the FTR before the look up in database.
		 * This user exit is called by the extraction script of the Vendor invoice process.
		 * @param {object} orderNumbersCandidates An array of Order Numbers condidates extracted by the FTR
		 * @returns {object} The updated array of candidates
		 * @example
		 * <pre><code>
		 * FormatOrderNumberCandidates: function (orderNumbersCandidates)
		 * {
		 *
		 *
		 *     return orderNumbersCandidates;
		 * }
		 * </code></pre>
		 */
		FormatOrderNumberCandidates: function (orderNumbersCandidates)
		{
			return orderNumbersCandidates;
		},

		/**
		 * Allows to override the CompanyCodeDetermination function and you can define the method to determine the company code candidates.
		 * By default, we call the function CompanyCodeDetermination defined on the library Lib_AP_CompanyCodeDetermination,
		 * and returned the company codes where the associated keyword matched with the content of the document.
		 * The company code determination must be activated on the AP wizard to call this user-exit.
		 * The first result of this function will be set on the CompanyCode__ field and the other results will be displayed on the CompanyCode__ warning message
		 * @returns {matchingCompanyCodes[]} The function returns an empty or a list of json and each json contains two fields:
		 * "companyCode": it is a string and it is equal to a company code value
		 * "area": the type is Area, can be null, and contains the area of the matching area on the document
		 * @example
		 * <pre><code>
		 * CompanyCodeDetermination: function ()
		 * {
		 *    // In this example, the company code is present in the document after the field 'Customer company'
		 *    // We return the value of this field and the corresponding area
		 * 		var tabCodes= [];
		 *		var zoneArray = Document.SearchString("customer company", 0, false, false);
		 *		for (var cc=0; cc < zoneArray.length; cc++)
		 *		{
		 *			var companyCodeExtracted = zoneArray[cc].GetNextWord();
		 *			var companyCodeCandidate = {
		 *				"companyCode": companyCodeExtracted,
		 *				"area": companyCodeExtracted
		 *			};
		 *			tabCodes.push(companyCodeCandidate);
		 *		}
		 *		return tabCodes;
		 * }
		 * </code></pre>
		 */
		CompanyCodeDetermination: function ()
		{
		},


		/**
		 * Allows to search and extract informations from the QR code on a FAPIAO invoice
		 * You can alternatively customize the QR code extraction using the {@link Lib.AP.Customization.Extraction.ExtractQRCode} user exit.
		 * Be sure to have the following settings in your process recognition parameters
		 * Advanced paramaters: ?allowed-bar-code=26
		 * @returns {boolean} true to activate the QRCode extraction
		 */
		AllowFapiaoQRCodeExtraction: function ()
		{
		},

		/**
		 * Allows to customize the QR code extraction. Only the extraction of the QR code
		 * is given, you will have to add the code to parse the result.
		 * This user exit will not be called if {@link Lib.AP.Customization.Extraction.AllowFapiaoQRCodeExtraction} is defined and returns true.
		 * The example code searches for the QR code on the bottom half of the last page.
		 * Be sure to have the following settings in your process recognition parameters:
		 * Advanced parameters: ?allowed-bar-code=26
		 * @example
		 * <pre><code>
		 * ExtractQRCode: function ()
		 * {
		 *    var p = Document.GetPageCount() - 1;
		 *    var x = 0;
		 *    var y = Document.GetPageHeight(0) / 2;
		 *    var w = Document.GetPageWidth(0);
		 *    var h = Document.GetPageHeight(0) / 2;
		 *    var qrCode = Document.GetArea(p, x, y, w, h, { "area-filling-method": "2d-barcode-2" }, "Nuance190");
		 *    if (qrCode)
		 *    {
		 *        // TODO - parse data and fill the corresponding fields
		 *        Data.SetValue("InvoiceDescription__", qrCode);
		 *    }
		 * },
		 * </code></pre>
		 */
		ExtractQRCode: function ()
		{
		},

		/**
		 * Specifics customization for UBL mapping
		* @namespace Lib.AP.Customization.Extraction.MappingUBL
		* @memberof Lib.AP.Customization.Extraction
		 */
		MappingUBL:
		{

			/**
			 * Allows you to override the Crystal Reports template used for creating PDF files from XML data.
			 * This user exit is called at the end of the extraction script of the process.
			 * This user exit is only called when invoices in XML format are received by EDI.
			 * @memberOf Lib.AP.Customization.Extraction.MappingUBL
			 * @param {String} defaultValue The default template used for conversion
			 * @returns {String} The template to used for conversion
			 * @example
			 * <pre><code>
			 * GetConversionTemplatePath: function (defaultValue)
			 * {
			 *      // choose a specific template for London Postmaster  in companyCode UK01
			 *  	if (Data.GetValue("CompanyCode__") === "UK01" && Data.GetValue("VendorNumber__") === "10000")
			 *  	{
			 * 			return "%Templates%\\VendorInvoiceUBL_UK01_10000.rpt";
			 * 		}
			 * }
			 * </code></pre>
			 */
			GetConversionTemplatePath: function (defaultValue)
			{
				return null;
			}
		},

		/**
		 * Specifics customization for UBL mapping
		* @namespace Lib.AP.Customization.Extraction.Reconciliation
		* @memberof Lib.AP.Customization.Extraction
		 */
		Reconciliation:
		{
			/**
			 * Allows to override the computation of the threshold used on Header/Footer reconciliation mode.
			 * By default, we used the value from Sys.Parameters.GetInstance("AP").GetParameter("HeaderFooterThreshold")
			 * and the value returned is used to determine if the difference between the expected invoiced amount and the
			 * invoice amount is within the threshold.
			 * @param {number} totalExpectedAmount The sum of the PO lines amount.
			 * @param {number} extractedInvoiceAmount The invoice amount extracted from the document (Data.GetValue("InvoiceAmount__"))
			 * @returns {number} The maximum amount allowed to concidered that the Header/Footer reconciliation is valid
			 * @example
			 * <pre><code>
			 * GetHeaderFooterThreshold: function (totalExpectedAmount, extractedInvoiceAmount)
			 * {
			 *    // In this example, the threshold is based on a fixed amount from the wizard and a % of the expected invoiced amount
			 *    // We return the lower of those two values to have an AND condition between the fixed amount and the percentage
			 *    var thresholdByValue = parseFloat(Sys.Parameters.GetInstance("AP").GetParameter("HeaderFooterThreshold"));
			 *    var thresholdByPercentage = totalExpectedAmount * 0.1;
			 *    return Math.min(thresholdByValue, thresholdByPercentage);
			 * }
			 * </code></pre>
			 */
			GetHeaderFooterThreshold: function (totalExpectedAmount, extractedInvoiceAmount)
			{
			},

			/**
			 * Allows custom reconciliation passes. This function is called after the normal four passes. See the function "reconcile" in LIB_AP_RECONCILIATION.
			 * To create additional passes, return an array of objects. Each object should have these properties: key, field, and comparer.
			 * Lines will be reconciled if the extracted value for key strictly equals the master data value for key, and comparer returns 0.
			 * Comparer should return 0 if the extracted value for field matches the master data value for field.
			 * @returns {object[]} List of objects containing key, field, and comparer parameters.
			 *      object.key is a string containing the name of the key field in the LineItems table, without
			 *          underscores. It will be compared with its ExtractedLineItems equivalent using "===".
			 *          If "Amount" or "Quantity" is given, the LineItems table will be searched using the expected amount.
			 *          Ex: "Amount" would compare ExpectedAmount__ in the line items table and AmountExtracted__ in the
			 *          ExtractedLineItems table using ===.
			 *      object.field is a string containing the name of the field in the LineItems table. It is used like
			 *          the object.key but is instead compared using the comparer function after the keys are verified.
			 *      object.comparer is a function taking in two values to compare. It should return 0 if equal, and -1 otherwise.
			 *          Used to compare the values for object.field.
			 * @example
			 * <pre><code>
			 * GetAdditionalReconciliationChecks: function()
			 * {
			 *     // Add the amount to the reconciliation checks
			 *     let compareAmount = function(amount1, amount2)
			 *     {
			 *          return amount1 && amount2 && amount1 === amount2 ? 0 : -1;
			 *     };
			 *     return [{key: "UnitPrice", field: "Amount", comparer: compareAmount}];
			 * }
			 * </code></pre>
			 */
			GetAdditionalReconciliationChecks: function ()
			{
			},

			/**
			 * Allows to refine the reconciliation process, by adjusting the filter used to retrieve line items.
			 * This function is called before performing the reconciliation, when the line items are added on the form.
			 * @param {String} filter The standard filter used to retrieve PO items
			 * @param {String} orderNumber The order number of the current PO
			 * @param {String} type The PO type of the current PO
			 * @param {String} buyer The buyer of the current PO
			 * @param {String} receiver The receiver of the current PO
			 * @param {String} diffInv The different invoicing party of the current PO
			 * @returns {String} The filter used to find and fill the line items before the reconciliation
			 * @example
			 * <pre><code>
			 * GetExtendedFillLinesFromPOCriteria: function (filter, orderNumber, type, buyer, receiver, diffInv)
			 * {
			 * 		// Refine the filter to only add lines for which the Reference has been extracted by Teaching / Auto-learning
			 * 		var extractedItemTable = Data.GetTable("ExtractedLineItems__");
			 * 		var extractedItemCount = extractedItemTable.GetItemCount();
			 * 		var extractedReferencesForPO = [];
			 * 		for (var index = 0; index < extractedItemCount; index++)
			 * 		{
			 * 			var extractedItem = extractedItemTable.GetItem(index);
			 * 			var itemOrderNumber = extractedItem.GetValue("OrderNumberExtracted__");
			 * 			if (itemOrderNumber === orderNumber)
			 * 			{
			 * 				extractedReferencesForPO.push(extractedItem.GetValue("PartNumberExtracted__"));
			 * 			}
			 * 		}
			 * 		// Limit the References to 200 according to R&D recommendations for the API FilterIn
			 * 		if (extractedReferencesForPO.length < 200)
			 * 		{
			 * 			filter = Sys.Helpers.LdapUtil.FilterAnd(
			 * 				filter,
			 * 				Sys.Helpers.LdapUtil.FilterIn("PartNumber__", extractedReferencesForPO)
			 * 			);
			 * 		}
			 * 		else
			 * 		{
			 * 			Log.Warn("GetFillLinesFromPOFilter : " + extractedReferencesForPO.length + " candidates for PO " + orderNumber);
			 * 		}
			 * 		return filter;
			 * }
			 * </code></pre>
			 */
			GetExtendedFillLinesFromPOCriteria: function (filter, orderNumber, type, buyer, receiver, diffInv)
			{
			},

			/**
			 * Allows to refine or extend the selection of PO candidates for reconciliation.
			 * This function is called before filling the line items from the PO candidates, before the reconciliation occurs.
			 * @param {Candidates[]}} Standard list of PO Candidates used for PO Reconciliation
			 * @returns {Candidates[]} Custom list of PO Candidates used for PO Reconciliation
			 * @example
			 * <pre><code>
			 * GetCustomOrderNumberCandidates:function(orderNumbersCandidates)
			 *	{
			 *		// Add taught PO from lines to the PO candidates, in case taught PO numbers at line level have been transformed by a Teaching rule
			 *		var extractedItemTable = Data.GetTable("ExtractedLineItems__");
			 *		var extractedItemCount = extractedItemTable.GetItemCount();
			 *		orderNumbersCandidates = orderNumbersCandidates || [];
			 *		for (var i = 0; i < extractedItemCount; i++)
			 *		{
			 *			var POnumber = extractedItemTable.GetItem(i).GetValue("OrderNumberExtracted__");
			 *			// Do not consider PO numbers that were already checked
			 *			var isAlreadyCandidate = orderNumbersCandidates.some(function (candidate)
			 *			{
			 *				return candidate.standardStringValue === POnumber;
			 *			});
			 *			if (isAlreadyCandidate)
			 *			{
			 *				Log.Verbose("PO # " + POnumber + " is already a candidate");
			 *			}
			 *			else
			 *			{
			 *				var orderNumber = {};
			 *				orderNumber.standardStringValue = POnumber;
			 *				orderNumbersCandidates.push(orderNumber);
			 *				Log.Verbose("New candidate PO # " + POnumber);
			 *			}
			 *		}
			 *		return orderNumbersCandidates;
			 *	}
			 * </code></pre>
			 */
			GetCustomOrderNumberCandidates: function (orderNumbersCandidates)
			{
			}
		},

		UDCDetection:
		{
			/**
			 * @description Allows you to add custom dimensions at Unplanned Delivery Cost (UDC) detection step.
			 * You have to add the custom field:
			 * - In the vendor invoice process (new column in the table LineItems__)
			 * - To the CT "P2P - Unplanned Delivery Cost Detection"
			 * (the fields must have the same name)
			 * @returns {object[]} List of custom dimensions fields to retrieve along UDC detection.
			 * @example
			 * <pre><code>
			 * GetCustomDimensions: function()
			 * {
			 *     return ["Z_ProjectCode"];
			 * }
			 * </code></pre>
			 */
			GetCustomDimensions: function ()
			{
				return null;
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
	 *		InitValues: function()
	 *		{
	 *			Data.SetValue("CalculateTax__", false);
	 *		}
	 * };
	 * </code></pre>
	 */
	// Uncomment here
	// var CustomHelpers =
	// {
	// };

})(Lib.AP.Customization);
