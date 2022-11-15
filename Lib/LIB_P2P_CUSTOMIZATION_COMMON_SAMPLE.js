/**
 * @file Lib.P2P.Customization.Common library: P2P script customization callbacks
 */

/**
 * P2P packages script customization callbacks
 * @namespace Lib.P2P.Customization.Common
 */

/* LIB_DEFINITION
{
	"name": "Lib_P2P_Customization_Common",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"comment": "Custom library extending P2P scripts",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "P2P.Customization.Common", function()
{
	/**
	 * In order to synchronize a custom field between all purchasing processes, you should add the following lines
	 * Details of the structure below can be find in Lib_Purchasing_Items
	 * For more information, refer to 'Adding custom fields in the Purchasing processes' in the documentation
	 */
	/*
	if (Lib.Purchasing && Lib.Purchasing.Items)
	{
		//Describes PR/PO/GR - Items table structure
		Lib.Purchasing.Items.PRItemsDBInfo.fields.push("z_ProjectCode__");
		Lib.Purchasing.Items.POItemsDBInfo.fields.push("z_ProjectCode__");
		Lib.Purchasing.Items.GRItemsDBInfo.fields.push("z_ProjectCode__");

		//Describes how the processes synchronize into their recpective tables
		Lib.Purchasing.Items.PRItemsSynchronizeConfig.mappings.byLine.z_ProjectCode__ = "z_ProjectCode__";
		Lib.Purchasing.Items.POItemsSynchronizeConfig.mappings.byLine.z_ProjectCode__ = "z_ProjectCode__";
		Lib.Purchasing.Items.GRItemsSynchronizeConfig.mappings.byLine.z_ProjectCode__ = "z_ProjectCode__";

		//Describes how the PR - Items table is used to fill the PO
		Lib.Purchasing.Items.PRItemsToPO.mappings.byLine.z_ProjectCode__ = "z_ProjectCode__";

		//Describes how the PO - Items table is used to fill the GR
		Lib.Purchasing.Items.POItemsToGR.mappings.byLine.z_ProjectCode__ = "z_ProjectCode__";

		//Describes how the PO/PR - Items tables are used to fill the PR when clonning
		Lib.Purchasing.Items.POItemsToPR.mappings.byLine.z_ProjectCode__ = "z_ProjectCode__";
		Lib.Purchasing.Items.PRItemsToPR.mappings.byLine.z_ProjectCode__ = "z_ProjectCode__";
	}
	*/

	/**
	 * @lends Lib.P2P.Customization.Common
	 */
	var customization = {
		/**
		* @description Allows you to customize the filter used when browsing for vendors in the Purchase Requisition process. This user exit is typically used to hide some vendors from the browse dialog, under the conditions of your choice. This user exit is called from the HTML Page script of the Purchase Requisition process, when browsing for vendors.
		* @version 5.116 and higher
		* @memberof Lib.P2P.Customization.Common
		* @function GetVendorsExtraFilter
		* @return {array} Array of LDAP filters. The conjunction (AND operation) of all the filters in the array is applied to the list of vendors.
		* @example This user exit excludes from the browse dialog the vendors who have a name starting with HID.
		* <pre><code>
		* GetVendorsExtraFilter: function()
		* {
		* 	return [ "(!(Name__=HID*))" ];
		* }
		* </code></pre>
		*/
		GetVendorsExtraFilter: function()
		{
		},

		/**
		* @description Allows you to add dimensions to associate with the invoice line items in the Line items table.
		* You can also use it to:
		* - Display the added dimensions in the purchase order browse dialog.
		* - Save the added dimensions in the P2P - Assignment templates table.
		* The fields for the added dimensions are filled in with data from the P2P- Purchase order - Items master table during extraction. This user exit is called from the HTML Page script and from the extraction script in the Vendor invoice process.
		* @version 5.132 and higher. // 5.260 for attribute poHeader
		* @memberof Lib.P2P.Customization.Common
		* @function GetCustomDimensions
		* @returns {CustomDimensions}
		* The customDimensions JavaScript object that contains:
		* - The list of the dimensions to add.
		* - The names of the fields for the dimensions to add in the P2P- Purchase order - Items master data table.
		* - The names of the fields for the dimensions to add in the Line items table of the Vendor invoice and Purchase Order processes (the fields must have the same name in both processes).
		* - The parameters to display the added dimensions in the purchase order browse dialog.
		* - The parameters to save the added dimensions in the P2P - Assignment templates table.
		*
		* This JavaScript object has the following format:
		* <pre><code>
		* {
		*	poItems:
		*	[
		*		{
		*			nameInTable: "FieldNameInTheMasterDataTable",
		*			nameInForm: "FieldNameInTheLineItemTable",
		*			fieldPropertiesInBrowsePage:
		*			{
		*				isVisible: < isVisible >
		*				width: < width >
		*			}
		*		}
		* 	],
		*	poHeader:
		*	[
		*		{
		*			nameInTable: "FieldNameInTheMasterDataTable",
		*			nameInForm: "FieldNameInTheLineItemTable",
		*			fieldPropertiesInBrowsePage:
		*			{
		*				isVisible: < isVisible >
		*				width: < width >
		*			}
		*		}
		* 	],
		* 	grItems:
		*	[
		*		{
		*			nameInTable: "FieldNameInTheMasterDataTable",
		*			nameInForm: "FieldNameInTheLineItemTable",
		*			fieldPropertiesInBrowsePage:
		*			{
		*				isVisible: < isVisible >
		*				width: < width >
		*			}
		*		}
		* 	],
		*	codingTemplates:
		*	[
		*		{
		*			nameInTable: "FieldNameInTheMasterDataTable",
		*			nameInForm: "FieldNameInTheLineItemTable"
		*		}
		* 	],
		*	poSAPItems:
		*	{
		*		< TableNameInSAP >:
		*		[
		*			{
		*				nameInSAP: "FieldNameInTheSAPTable",
		*				nameInForm: "FieldNameInTheLineItemTable",
		*				fieldPropertiesInBrowserPage:
		*				{
		*					isVisible: < isVisible >
		*					width: < width >
		*				}
		*			},
		*			{
		*				nameInSAP: "FieldNameInTheSAPTable",
		*				nameInForm: "FieldNameInLineItemTable",
		*				fieldFormatter: < fieldFormatter >
		*			}
		*		]
		*	}
		* }
		* </code></pre>
		* @example
		* For an application integrated with SAP, this user exit adds the following dimensions to the Line items table:
		* - The asset information dimension.
		* - Plant dimension.
		* - Store location dimension.
		* - Account assignment dimension.
		* <pre><code>
		* GetCustomDimensions: function()
		* {
		* 	return
		* 	{
		*		poItems:
		*		[
		*			{
		*				nameInTable: "AssetId__",
		*				nameInForm: "POAssetId__",
		*				fieldPropertiesInBrowsePage:
		*				{
		*					isVisible: true,
		*					width: 90
		*				}
		*			},
		*			{
		*				nameInTable: "AssetDescription__",
		*				nameInForm: "POAssetDescription__"
		*			}
		*		],
		*		grItems:
		*		[
		*			{
		*				nameInTable: "AssetId__",
		*				nameInForm: "GRAssetId__",
		*				fieldPropertiesInBrowsePage:
		*				{
		*					isVisible: true,
		*					width: 90
		*				}
		*			},
		*			{
		*				nameInTable: "AssetDescription__",
		*				nameInForm: "GRAssetDescription__"
		*			}
		*		],
		*		codingTemplates:
		*		[
		*			{
		*				nameInTable: "TplAssetId__",
		*				nameInForm: "POAssetId__"
		*			},
		*			{
		*				nameInTable: "TplAssetDescription__",
		*				nameInForm: "POAssetDescription__"
		*			}
		*		],
		*		poSAPItems:
		*		{
		*			PO_ITEMS:
		*			[
		*				{
		*					nameInSAP: "PLANT",
		*					nameInForm: "Z_Plant__",
		*					fieldPropertiesInBrowsePage:
		*					{
		*						isVisible: true,
		*						width: 90
		*					}
		*				},
		*				{
		*					nameInSAP: "STORE_LOC",
		*					nameInForm: "Z_StoreLoc__",
		*					fieldFormatter: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
		*				}
		*			],
		*			PO_HEADER:
		*			[
		*				{
		*					nameInSAP: "DOC_TYPE",
		*					nameInForm: "Z_PO_DocType__",
		*					fieldPropertiesInBrowsePage:
		*					{
		*						isVisible: true,
		*						width: 60
		*					}
		*				}
		*			],
		*			PO_ITEM_ACCOUNT_ASSIGNMENT:
		*			[
		*				{
		*					nameInSAP: "ASSET_NO",
		*					nameInForm: "Z_AssetNumber__",
		*					fieldFormatter: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
		*					fieldPropertiesInBrowsePage:
		*					{
		*						isVisible: true,
		*						width: 90
		*					}
		*				}
		*			]
		*		}
		*	};
		* }
		* </code></pre>
		*/
		GetCustomDimensions: function()
		{
			return null;
		},

		/**
		 * @description Return an object describing the P2P Catalog customizations.
		 *	This user exit allows you to declare the custom fields on both of the Catalog tables :
		 *	'P2P - Items' and 'P2P - Item properties'
		 * @version 5.257 and higher
		 * @memberof Lib.P2P.Customization.Common
		 * @function GetExtraCatalogProperties
		 * @returns {Object} A JavaScript object that describes the customization table
		 *
		 * It associates the fields name with
		 * 	- the corresponding Catalog table and add it in queries
		 * 	- and may allows it be exported to or imported from a CSV file
		 * @example This user exit:
		 * 		Declare a new field 'CatalogPrivateField' in the item header (P2P - Items) that cannot be exported or imported.
		 *		Declare a new field 'CatalogPublicField' in the item header (P2P - Items) that can be exported and imported.
		 * 		Declare a new field 'VendorPrivateField' in the item details (P2P - Item properties) that cannot be exported or imported.
		 * 		Declare a new field 'VendorPublicField' in the item details (P2P - Item properties) that can be exported and imported.
		 * 		Declare a new field 'WarehousePrivateField' in the item details (P2P - Item properties) that cannot be exported or imported.
		 * 		Declare a new field 'WarehousePublicField' in the item details (P2P - Item properties) that can be exported and imported.
		 *
		 * This JavaScript object has the following format:
		 * <pre><code>
		 * {
		 * 	catalogFields: ["CatalogPrivateField__"],
		 * 	catalogCSVFields: ["CatalogPublicField__"],
		 * 	vendorFields: ["VendorPrivateField__"],
		 * 	vendorCSVFields: ["VendorPublicField__"],
		 * 	warehouseFields: ["WarehousePrivateField__"],
		 * 	warehouseCSVFields: ["WarehousePublicField__"]
		 * };
		 * </code></pre>
		 */
		GetExtraCatalogProperties: function ()
		{
			return null;
		},

		/**
		 * @description Allows you to customize the delivery address format and to disable the usual checks on the postal address format.
		 * This user exit is called from the HTML Page script and from the extraction script in the Purchase Requisition process.
		 * @version 5.161 and higher
		 * CLIENT_WEB|CLIENT_MOBILE|SERVER
		 * @memberof Lib.P2P.Customization.Common
		 * @function OnShipToAddressFormat
		 * @param {object} options
		 * JavaScript object specifying the options for checking if the postal address is valid, in the following format:
		 * <pre><code>
		 * {
		 *		"isVariablesAddress": {boolean},
		 *		"address":
		 *		{
		 *			"ToName": {string},
		 *			"ToSub": {string},
		 *			"ToMail": {string},
		 *			"ToPostal": {string},
		 *			"ToCountry": {string},
		 *			"ToState":{string},
		 *			"ToCity": {string},
		 *			"ForceCountry": {boolean}
		 *		}
		 *	"countryCode": {string}
		 * }
		 * </code/></pre>
		 * @returns {(string|boolean)} a string containing the customized address. This disables the usual checks on the postal address format. The customized address can be an empty string.
		 * or false to perform the usual checks on the postal address format.
		 * @example For the MY01 company code, you have long postal addresses that often exceed the allowed address size limit. In such a case, the usual checks of the address format return an error.
		 * The following user exit allows you to disable the usual checks for addresses that are specific to this company code.
		 * <pre><code>
		 * OnShipToAddressFormat: function (options)
		 * {
		 *	 var companyCode = Data.GetValue("CompanyCode__");
		 *	 if (companyCode === "MY01" && options.address.ToCountry === "US" && options.address.ToSub)
		 *	 {
		 *		 Log.Info("MY01 address detected: skipping the postal address check");
		 *		 return options.address.ToSub + "\n" +
		 *				options.address.ToMail + "\n" +
		 *				options.address.ToPostal + " " + options.address.ToCity + "\n" +
		 *				"USA";
		 *	 }
		 *	 else
		 *	 {
		 *		 // Performs the usual postal address check.
		 *		 return null;
		 *	 }
		 * }
		 * </code></pre>
		 */
		OnShipToAddressFormat: function(/*options*/)
		{
			return false;
		},

		/**
		 * @description Allows you to customize the vendor address format and to disable the usual checks on the postal address format.
		 * This user exit is called from the HTML Page script and from the extraction script in the Purchase Requisition and Purchase Order processes.
		 * @version 5.161 and higher
		 * @memberof Lib.P2P.Customization.Common
		 * @function OnVendorAddressFormat
		 * @param {object} options
		 * JavaScript object specifying the options for checking if the postal address is valid, in the following format:
		 * <pre><code>
		 * {
		 *		"isVariablesAddress": {boolean},
		 *		"address":
		 *		{
		 *			"ToName": {string},
		 *			"ToSub": {string},
		 *			"ToMail": {string},
		 *			"ToPostal": {string},
		 *			"ToCountry": {string},
		 *			"ToState":{string},
		 *			"ToCity": {string},
		 *			"ForceCountry": {boolean}
		 *		}
		 *	"countryCode": {string}
		 * }
		 * </code/></pre>
		 * @returns {(string|boolean)} a string containing the customized address. This disables the usual checks on the postal address format. The customized address can be an empty string.
		 * or false to perform the usual checks on the postal address format.
		 * @example For the MY01 company code, you have long postal addresses that often exceed the allowed address size limit. In such a case, the usual checks of the address format return an error.
		 * The following user exit allows you to disable the usual checks for addresses that are specific to this company code.
		 * <pre><code>
		 * OnVendorAddressFormat: function (options)
		 * {
		 *	 var companyCode = Data.GetValue("CompanyCode__");
		 *	 if (companyCode === "MY01" && options.address.ToCountry === "US" && options.address.ToSub)
		 *	 {
		 *		 Log.Info("MY01 address detected: skipping the postal address check");
		 *		 return options.address.ToName + options.address.ToMail + options.address.ToPostal + options.address.ToCity;
		 *	 }
		 *	 else
		 *	 {
		 *		 // Performs the usual postal address check.
		 *		 return null;
		 *	 }
		 * }
		 * </code></pre>
		 */
		OnVendorAddressFormat: function(/*options*/)
		{
			return false;
		},

		/**
		 * @description When an item is added to the purchase requisition from a punchout catalog that provides an UNSPSC code, the Purchasing application computes the corresponding item category based on the mappings stored in the `P2P - UNSPSC codes/item categories mapping` table. The following algorithm is used :
		 *
		 *  * If the UNSPSC code is 45111616 we start by looking for it in the mapping table,
		 *  * If it doesn't exist we look for its UNSPSC parent that is 45111600 (a UNSPSC category is encoded with two digits),
		 *  * If it still doesn't exist we look for the parent of the parent and so on, so we would be looking for a mapping item category for the following UNSPSC codes 45111616, 45111600, 45110000, 45000000 in that order.
		 *
		 * This user exit allows you to map a UNSPSC code to a different item category than the one computed using the above algorithm.
		 *
		 * @version 5.181 and higher
		 * @memberof Lib.PR.Customization.Client
		 * @function GetSupplyTypeIdFromUNSPSC
		 * @param {string} UNSPSCCode The UNSPSC code returned by the punchout catalog.
		 * @param {string} determinedSupplyTypeId The item category computed using the algorithm described above.
		 * @returns {string} A different item category you want to map the UNSPSC code to, or null if you want to keep `determinedSupplyTypeId`.
		 */
		GetSupplyTypeIdFromUNSPSC: function(UNSPSCCode, determinedSupplyTypeId)
		{
			return null;
		}
	};
	return customization;
});
