/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_VENDORPORTAL",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Validation Script AP customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.VendorPortal library
 * @namespace Lib.AP.Customization.VendorPortal
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.VendorPortal
	 */
	parentLib.VendorPortal =
	{
		/**
		* Function called in FlipPO mode for activate or not the InvoiceNumber auto-generation
		* If activated:
		*  - The field InvoiceNumber is set to read only on the form
		*  - An InvoiceNumber is generated with a customizable pattern (see GetInvoiceNumberPattern)
		* @memberof Lib.AP.Customization.VendorPortal
		* @example
		* <pre><code>
		* GenerateInvoiceNumber: function()
		* {
		*	return true;
		* }
		* </code></pre>
		*/
		GenerateInvoiceNumber: function ()
		{
			return false;
		},

		/**
		* Function called to customize the customer invoice number when the invoice is created from a purchase order.
		* $YYYY$ is replaced by the current year
		* $seq$ is replaced by an auto-incremental ID (independant for every vendor)
		* @memberof Lib.AP.Customization.VendorPortal
		* @param {string} defaultPattern The default invoice number pattern
		* @returns {string} The pattern to use. If you return an empty string (or nothing), the defaultPattern will be used.
		* @example
		* <pre><code>
		* GetInvoiceNumberPattern: function(defaultPattern)
		* {
		*	return "ESK$YYYY$-$seq$";
		* }
		* </code></pre>
		*/
		GetInvoiceNumberPattern: function (defaultPattern)
		{

		},

		/**
		* Allows you to set the new short login. It will be processed normally even if a new one is set
		* @memberof Lib.AP.Customization.VendorPortal
		* @param {string} newLogin The default login, can be empty
		* @returns {string} the customized login
		* @example
		* <pre><code>
		* SetNewShortLogin: function(newLogin)
		* {
		*	return newLogin+"-custom";
		* }
		* </code></pre>
		*/
		SetNewShortLogin: function (newLogin)
		{

		},

		/**
		* Allows you to specify whether an invoice generated by the Convert Order to Invoice process should be signed or not.
		* This user exit is called from the validation script of the Customer invoice process.
		* @memberof Lib.AP.Customization.VendorPortal
		* @returns {boolean} true, to enable the digital signature feature. By default, the invoices will not be signed.
		* @example
		* <pre><code>
		* SignInvoice: function()
		* {
		*	var company = Data.GetValue("Company__");
		*	if (company === "TMC Truck Leasing")
		*	{
		*		return true;
		*	}
		*	return false;
		* }
		* </code></pre>
		*/
		SignInvoice: function ()
		{
			return false;
		},

		/**
		* Allows you to override email options or deactivate vendor notifications sending.
		* @memberof Lib.AP.Customization.VendorPortal
		* @param {object} emailOptions Notification email options which can be modified
		* @returns {boolean} false, to deactivate email sending.
		* @example
		* <pre><code>
		* OnSendVendorNotification: function (emailOptions)
		* {
		* 		if (emailOptions.subject.key == "_Customer invoice received" )
		*		{
		*			// Deactivate vendor notification for new invoices
		*			return false;
		*		}
		* 		else if (emailOptions.subject.key == "_Customer invoice rejected")
		*		{
		*			// Add a custom tag to be used in a custom email template for rejected invoices
		*			emailOptions.template = "Custom_NewInvoice_XX.htm";
		*			emailOptions.customTags.AdditionalNote = Lib.AP.VendorPortal.GetCurrentUser().GetVars().GetValue_String("AdditionalField1", 0);
		*		}
		* }
		* </code></pre>
		*/
		OnSendVendorNotification: function (emailOptions)
		{
		},

		/**
		* Define how to match vendors numbers as a single vendor contact
		* In this exemple, we match by VAT number
		* @memberof Lib.AP.Customization.VendorPortal
		* @param {object} parameters Invoice Data
		* @returns {IUser} Vendor User
		* @example
		* <pre><code>
		* MatchVendorContact: function (parameters)
		* {
		*	if (parameters.VendorNumber__ !== null && parameters.VendorName__ !== null)
		*	{
		*		var query = Process.CreateQueryAsProcessAdmin();
		*
		*		// Search vendor info
		*		query.Reset();
		*		query.SetSpecificTable("AP - Vendors__");
		*		query.SetAttributesList("VATNumber__");
		*		var filter = "(&(Number__=" + parameters.VendorNumber__ + ")(Name__=" + parameters.VendorName__ + "))";
		*		query.SetFilter(filter);
		*		if (query.MoveFirst())
		*		{
		*			var vendorInfoRecord = query.MoveNextRecord();
		*			if (vendorInfoRecord)
		*			{
		*				var vendorInfoVars = vendorInfoRecord.GetVars();
		*				// Search all vendors with the same VAT Number
		*				query.Reset();
		*				query.SetSpecificTable("AP - Vendors__");
		*				query.SetAttributesList("CompanyCode__, VendorNumber__");
		*				filter = "(VATNumber__=" + vendorInfoVars.GetValue_String("VATNumber__", 0) + ")";
		*				query.SetFilter(filter);
		*				return Lib.AP.VendorPortal.LookUpVendorContact(parameters, query);
		*			}
		*		}
		*		Log.Info("MatchVendorContact - Vendor contact not founded");
		*	}
		*	return null;
		* }
		* </code></pre>
		*/
		MatchVendorContact: function (parameters)
		{
			return null;
		}

	};
})(Lib.AP.Customization);
