/**
 * @file Lib.PO.Customization.Common library: common script Purchase Order customization callbacks
 */

/**
 * Package Purchase Order Common script customization callbacks
 * @namespace Lib.PO.Customization.Common
 */

/* LIB_DEFINITION
{
	"name": "Lib_PO_Customization_Common",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"comment": "Custom library extending Purchase Order scripts on client and server side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "PO.Customization.Common", function ()
{
	/**
	 * In order to extend/reduce the list of fields that require, if modified during PO edition, the regeneration of the PO
	 * you need to add your fields to the "Lib.Purchasing.POItems.customerInterestedItems" list or remove them from it.
	 */
	/*
	if (Lib.Purchasing && Lib.Purchasing.POItems)
	{
		// Add a field to the list
		Lib.Purchasing.POItems.customerInterestedItems.push("fieldName");

		// Remove a field from the list
		var fieldIndex = Lib.Purchasing.POItems.customerInterestedItems.indexOf("fieldName");
		if (fieldIndex > -1) {
			Lib.Purchasing.POItems.customerInterestedItems.splice(fieldIndex, 1);
		}
	}
	*/

	/**
	 * @lends Lib.PO.Customization.Common
	 */
	var customization = {
		/**
		 * @description The merge fields that are used in the Microsoft Word template of the purchase order must be mapped to the values from the Purchase Order process.
		 * 	This user exit allows you to create or override the mapping for the new fields.
		 * 	Refer to Choosing and customizing the purchase order template for more information.
		 * @version 5.116 and higher
		 * @memberof Lib.PO.Customization.Common
		 * @function GetExtraPOCSVFields
		 * @returns {Object} A JavaScript object with the following structure:
		 * 	header: Mapping for the header fields in the template.
		 * 	items: Mapping for the line item fields in the template.
		 * The mapping associates the merge field name with:
		 * 	Either the corresponding process field name.
		 * 	Or the return value of a function. View the information that you can retrieve with the functionClosed
		 * In the header and items objects, create the mapping for the new merge fields.
		 * @example This user exit:
		 * 		Adds a new ContactName merge field.
		 * 		Overrides the existing PO_number merge field to insert a prefix.
		 * 		Overrides the existing ItemNumber merge field to insert a prefix.
		 *
		 GetExtraPOCSVFields: function ()
		 {
			 var ExtraPOCSVFields = {
				 header:
				 {
					 "ContactName": "BuyerName__",
					 "PO_number": function (info)
					 {
						 return "PO#" + info.poNumber;
					 }
				 },
				 items:
				 {
					 fields:
					 {
						 "ItemNumber": function (info)
						 {
							 return "ID#" + Lib.Purchasing.GetValueAsString(info.item, "ItemNumber__", info.culture);
						 }
					 }
				 }
			 };
			 return ExtraPOCSVFields;
		 }
		 */
		GetExtraPOCSVFields: function ()
		{
			/*var ExtraPOCSVFields =
			{
				header:
				{
					// Create or override the mapping for the new header fields.
					// Refer to the following documentation link for more information about the mapping:
					// https://doc.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#Processes/PAC/Customizing/PO_template.html#Mapping

					// Exemple:
					// "RequesterName": "RequesterName__"
				},
				items:
				{
					fields:
					{
						// Create or override the mapping for the new line item fields.
						"ItemNumber": function (info)
						   {
							   return "ID#" + Lib.Purchasing.GetValueAsString(info.item, "ItemNumber__", info.culture);
						   }
					}
				}
			};
			return ExtraPOCSVFields;
			*/
			return null;
		},

		/**
		 * Return an object describing the mapping to override for the Purchase Order generation
		 * WARNING: This user exit is called only when PO template file format is .rpt
		 *
		 * @returns {object} mapping of merge fields used in the rpt template to the values of the Purchase Order process
		 */
		GetExtraPORPTFields: function ()
		{
			/*
			var ExtraPORPTFields =
			{
				"header":
				{
					"OrderDate__": function(info)
					{
						return Date.UTC(Date.now());
					},
					"Currency": "Currency__", // Duplicate with another name
					"UnexistentField": "UnexistentField__", // This field doesn't exits in Data
				},
				"tables":
				{
					"LineItems__":
					{
						"fields":
						{
							"ItemNetAmount__": function(info)
							{
								return 1 + info.item.GetValue("ItemUnitPrice__") * info.item.GetValue("ItemQuantity__");
							},
							"ItemUnexistentField": "ItemUnexistentField__",
							"ItemNumber": "ItemNumber__" // Dulpicate with another name
						}
					},
					"TaxSummary__":
					{
						"fields":
						{
							"TaxCode": "TaxCode__",
							"TaxTest__": function(info)
							{
								return info.tableName + "." + info.itemIdx;
							}
						}
					}
				}
			}
			return ExtraPORPTFields;
			*/
			return null;
		},

		/**
		 * Allows you to specify the name of the template used to generate the purchase order file. The template is a resource file in the Microsoft Word (.docx) or Crystal Report (.rpt) format.
		 *
		 * @returns {string|object}
		 *
		 * String value containing the name of the template with its extension (.docx or .rpt).
		 * Or
		 * JavaScript object containing, in addition to the template name, the language and the culture to be used to generate the purchase order file.
		 *
		 * @example Structure of the object that could be returned by the User Exit:
		 *
		{
			template: "CustomTemplateName.rpt",
			language: "fr",
			culture: "fr-FR"
		}
		 *
		 * @example The following sample allows you to specify a different template when the tax code is available:
		 *
		GetPOTemplateName: function ()
		{
			// Get PO template set by default on LIB_P2P_CUSTOM_PARAMETERS.js
			var POTemplateName = Sys.Parameters.GetInstance("PAC").GetParameter("POTemplateName");
			// Get value of attribute 'DisplayTaxCode'
			var isDisplayTaxCodeEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayTaxCode");
			if (isDisplayTaxCodeEnabled)
			{
				POTemplateName = "My_Template_with_tax.docx";
			}
			return POTemplateName;
		}
		 *
		 */
		GetPOTemplateName: function ()
		{
			return null;
		},
		/**
		 * Allows you to specify the name of the terms and conditions file merged at the end of the purchase order file.
		 * The terms and conditions file is a resource file in the PDF format.
		 *
		 * @returns {string}
		 *
		 * String value containing the name of the terms and conditions file with its extension (.pdf).
		 *
		 * @example The following sample allows you to specify a different terms and conditions file when the tax code is available:
		 *
		GetPOTermsConditionsName: function ()
		{
			// Get PO template set by default on LIB_P2P_CUSTOM_PARAMETERS.js
			var POTermsConditionsTemplateName = Sys.Parameters.GetInstance("PAC").GetParameter("POTermsConditionsTemplateName");
			// Get value of attribute 'DisplayTaxCode'
			var isDisplayTaxCodeEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayTaxCode");
			if (isDisplayTaxCodeEnabled)
			{
				POTermsConditionsTemplateName = "My_TermsConditions_with_tax.pdf";
			}
			return POTermsConditionsTemplateName;
		}
		 *
		 */
		GetPOTermsConditionsName: function ()
		{
			return null;
		},
		/**
		 * @description Allows you to override the values used to fill in the fields of the Crystal Reports template.
		 * 		The CustomizePOData user exit is called after the localization of the template. The localization is performed according to the culture of the vendor contact. If there is no contact for the vendor, it is performed according to the culture of the buyer.
		 * 		Refer to Customizing the purchase order Crystal template for more information.
		 * @version 5.136 and higher
		 * @memberof Lib.PO.Customization.Common
		 * @function CustomizePOData
		 * @param {*} POData A JavaScript object that contains the fields to use in the Crystal Reports template.
		 *
		 *		The POData object contains the following properties:
		 *
		 *			header:			Header fields on the template. You should add the new fields that are not in the line items in this object.
		 *			logo:			Logo displayed on the template. Refer to Customizing the logo for more information.
		 *			companyInfo:	Information displayed in the footer of the template and formatting for the dates and numbers displayed on the template. Refer to Customizing the purchase order Crystal template for more information.
		 *			tables:
		 *				LineItems: 		Line item fields on the template. You should add the new fields that are in the line items in this array.
		 *				AdditionalFees: Additional charges such as delivery costs.
		 *				TaxSummary: 	Taxes.
		 *				Language: 		Labels to use in the template.
		 *
		 *		 var POData = {
		 *		    "header":
		 *		    {
		 *		        "OrderDate__": "2018-01-11",
		 *		        "VendorNumber__": "ACME1234",
		 *		        "VendorName__": "ACME Supply Company",
		 *		        "VendorAddress__": "1500 N. Broadway\nWALNUT CREEK CA 94598\nETATS-UNIS",
		 *		        "ShipToCompany__": "TMC Truck Leasing",
		 *		        "ShipToContact__": "Brian Buyer",
		 *		        "ShipToAddress__": "1300 Westin Road\nPhiladelphia PA 19113\nETATS-UNIS",
		 *		        "OrderNumber__": null,
		 *		        "Currency__": "USD",
		 *		        "TotalNetAmount__": 4000,
		 *		        "TotalTaxAmount__": 760,
		 *		        "TotalAmountIncludingVAT__": 4760,
		 *		        "PaymentAmount__": 0,
		 *		        "BuyerComment__": null,
		 *		        "PaymentTermCode__": "T30",
		 *		        "PaymentTermDescription__": "30 days (invoice date)",
		 *		        "PaymentMethodCode__": null,
		 *		        "PaymentMethodDescription__": null
		 *		    },
		 *		    "logo":
		 *		    {
		 *		        "template": "%images%\\PO_logo.png", // Base name of the PNG file located in the image resources.
		 *		        "suffix": "US01", // The base name can be completed with the suffix (for example, PO_logo_US01.png).
		 *		        "default": "%AccountLogo%" // Logo used by default if the previous logo is not available in the image resources.
		 *		    },
		 *		    "companyInfo":
		 *		    {
		 *		        "FormattedAddress__": "1300 Westin Road\nPHILADELPHIA PA 19113\nETATS-UNIS",
		 *		        "CompanyName__": "TMC Truck Leasing",
		 *		        "Street__": "1300 Westin Road",
		 *		        "PostOfficeBox__": "",
		 *		        "City__": "PHILADELPHIA",
		 *		        "PostalCode__": "19113",
		 *		        "Region__": "PA",
		 *		        "Country__": "US",
		 *		        "PhoneNumber__": "+61 782783937",
		 *		        "FaxNumber__": "(866) 593-7619",
		 *		        "VATNumber__": "49145218272",
		 *		        "ContactEmail__": "company@tmctruckleasing.com",
		 *		        "SIRET__": "16-048-3982",
		 *		        "DecimalCount": 2,
		 *		        "FormatDate": "M/d/yyyy",
		 *		        "SeparatorThousand": "%2C",
		 *		        "SeparatorDecimal": ".",
		 *		        "SeparatorInfos": "%20-%20", // Separator used in the footer to separate data.
		 *		        "SupplierAddressRightWindow": "0" // Switches the location of the vendor address and the ship to address on the template.
		 *		    },
		 *		    "tables":
		 *		    {
		 *		        "LineItems__": [
		 *		        {
		 *		            "ItemNumber__": "1-0004",
		 *		            "ItemDescription__": "Screen 24\", Full HD, Black",
		 *		            "ItemQuantity__": 2,
		 *		            "ItemUnit__": "EA",
		 *		            "ItemRequestedDeliveryDate__": "2018-01-31",
		 *		            "ItemUnitPrice__": 200,
		 *		            "ItemNetAmount__": 400,
		 *		            "ItemTaxCode__": "VA",
		 *		            "ItemTaxRate__": 19,
		 *		            "ItemTaxAmount__": 76
		 *		        },
		 *		        {
		 *		            "ItemNumber__": "1-0001",
		 *		            "ItemDescription__": "Laptop 14\", 4Go RAM, HDD 320Gb",
		 *		            "ItemQuantity__": 3,
		 *		            "ItemUnit__": "EA",
		 *		            "ItemRequestedDeliveryDate__": "2018-01-31",
		 *		            "ItemUnitPrice__": 1200,
		 *		            "ItemNetAmount__": 3600,
		 *		            "ItemTaxCode__": "VA",
		 *		            "ItemTaxRate__": 19,
		 *		            "ItemTaxAmount__": 684
		 *		        }],
		 *		        "AdditionalFees__": [
		 *		        {
		 *		            "AdditionalFeeDescription__": "Delivery Cost",
		 *		            "Price__": "15.00",
		 *		        }],
		 *		        "TaxSummary__": [
		 *		        {
		 *		            "TaxCode__": "VA",
		 *		            "TaxDescription__": "19% domestic input tax",
		 *		            "TaxRate__": 19,
		 *		            "NetAmount__": 4000,
		 *		            "TaxAmount__": 760
		 *		        }]
		 *		    },
		 *		    "language":
		 *		    {
		 *		        "PurchaseOrder": "PURCHASE ORDER",
		 *		        "NoteHeader1": "Please quote order number in all correspondence",
		 *		        "Page": "Page",
		 *		        "BillToAddress": "Bill to",
		 *		        "OrderNumber": "Order number:",
		 *		        "OrderDate": "Date:",
		 *		        "Currency": "Currency:",
		 *		        "ShipToContact": "Contact:",
		 *		        "PaymentTerms": "Payment terms:",
		 *		        "PaymentMethod": "Payment method:",
		 *		        "ShipToAddress": "Ship to",
		 *		        "Supplier": "Vendor",
		 *		        "ItemNumber": "Reference",
		 *		        "ItemDescription": "Description",
		 *		        "ItemRequestedDeliveryDate": "Delivery",
		 *		        "ItemQuantity": "Quantity",
		 *		        "ItemUnitPrice": "Unit price",
		 *		        "ItemNetAmount": "Net amount",
		 *		        "BuyerComment": "Comment:",
		 *		        "TotalNetAmount": "Net total",
		 *		        "DownpaymentAmount": "Advance payment",
		 *		        "TotalNetAmountRemaining": "Outstanding",
		 *		        "Email": "Email:",
		 *		        "Phone": "Phone:",
		 *		        "Fax": "Fax:",
		 *		        "SiretNumber": "SIRET number:",
		 *		        "VatNumber": "VAT number:"
		 *		    }
		 *		};
		 * @returns {*} The modified POData object.
		 * @example
		 * Exemple 1:
		 * This user exit allows you to merge the lines of the order for which the ordered item is identical (same description and number) and the requested delivery date is identical.
		 * <pre><code>
		 *	CustomizePOData: function (POData)
		 *	{
		 *		var lineItems = Sys.Helpers.Array.Reduce(POData.tables.LineItems__, function (accumulator, current)
		 *			{
		 *				var key = current.ItemDescription__ + "|" + current.ItemNumber__ + "|" + current.ItemRequestedDeliveryDate__;
		 *
		 *				if (accumulator[key] == null)
		 *				{
		 *					accumulator[key] = current;
		 *				}
		 *				else
		 *				{
		 *					accumulator[key].ItemQuantity__ += current.ItemQuantity__;
		 *					accumulator[key].ItemNetAmount__ += current.ItemNetAmount__;
		 *					accumulator[key].ItemTaxAmount__ += current.ItemTaxAmount__;
		 *				}
		 *				return accumulator;
		 *			},
		 *			{});
		 *		POData.tables.LineItems__ = Sys.Helpers.Object.Values(lineItems);
		 *		return POData;
		 *	}
		 * </pre></code>
		 * Example 2:
		 * This user exit allows you to switch the position of the Vendor address and the Ship to address on the template:
		 * <pre><code>
		 * 	CustomizePOData: function (POData)
		 * 	{
		 * 		return Sys.Helpers.Extend(true, {}, POData, {
		 * 			"companyInfo":
		 * 			{
		 *				"SupplierAddressRightWindow" : "1" // The vendor address is on the right.
		 * 			}
		 * 		});
		 * 	}
		 * </pre></code>
		 * Example 3:
		 * This user exit allows you to set the value of the new z_ShippingMethod field in the Crystal Reports template from the new Shipping_Method__ field in the Purchase Order that is added outside of the line items.
		 * <pre><code>
		 * 	CustomizePOData: function (POData)
		 * 	{
		 * 		return Sys.Helpers.Extend(true, {}, POData, {
		 * 			"header":
		 * 			{
		 * 				"z_ShippingMethod" : Data.GetValue("Shipping_Method__")
		 * 			}
		 * 		});
		 * 	}
		 * </pre></code>
		 */
		CustomizePOData: function (POData)
		{
			return null;
		},

		/**
		 *
		AllowServiceEntrySheet: function (contractNumber, itemNumber, itemType)
		{
			return false;
		},
		 */

		/**
		 * @description Allows you to check the item quantity when the item has been modified on a submitted purchase order.
		 * 		This user exit is called when validating the edition of the Purchase Order process.
		 * @version 5.169 and higher
		 * @memberof Lib.PO.Customization.Common
		 * @function IsItemQuantityChangeAllowed
		 * @param {*} item Data.Item object representing the item to check.
		 * @returns {boolean} Boolean value specifying if the new item quantity is validated.
		 * @example
		 * This user exit validates an item quantity if it has not increased by more than 5.
		 * <pre><code>
		 * IsItemQuantityChangeAllowed: function (item)
		 *	{
		 *		if (!!item)
		 *		{
		 *			return item.GetValue("ItemQuantity__") <= item.GetValue("ItemRequestedQuantity__") + 5;
		 *		}
		 *		return false;
		 *	}
		 * </code></pre>
		 */
		IsItemQuantityChangeAllowed: function (item)
		{
			return null;
		},
		/**
		 * @description Allows you to check the item unit price when the item has been modified on a submitted purchase order.
		 * 		This user exit is called when validating the edition of the Purchase Order process.
		 * @version 5.169 and higher
		 * @memberof Lib.PO.Customization.Common
		 * @function IsItemUnitPriceChangeAllowed
		 * @param {*} item Data.Item object representing the item to check.
		 * @returns {boolean} Boolean value specifying if the new item unit price is validated.
		 * @example
		 * This user exit validates an item unit price if it less than twice the original unit price.
		 * <pre><code>
		 * IsItemUnitPriceChangeAllowed: function (item)
		 *	{
		 *		if (!!item)
		 *		{
		 *			return item.GetValue("ItemUnitPrice__") <= item.GetValue("ItemRequestedUnitPrice__") * 2;
		 *		}
		 *		return false;
		 *	}
		 * </code></pre>
		 */
		IsItemUnitPriceChangeAllowed: function (item)
		{
			return null;
		}
	};

	return customization;
});
