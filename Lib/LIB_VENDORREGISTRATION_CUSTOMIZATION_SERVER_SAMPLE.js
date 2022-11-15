/* LIB_DEFINITION{
  "name": "LIB_VENDORREGISTRATION_CUSTOMIZATION_SERVER",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Vendor registration validation process",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.VendorRegistration.Customization.Server library
 * @namespace Lib.VendorRegistration.Customization.Server
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.VendorRegistration = Lib.VendorRegistration || {};
Lib.VendorRegistration.Customization = Lib.VendorRegistration.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.VendorRegistration.Customization.Server
	 */
	parentLib.Server =
	{
		/**
		* Function called in Vendor registration when the process is sent by the user
		*
		* @memberof Lib.VendorRegistration.Customization.Server
		* @returns {boolean} If the process is valid and can be sent
		* @example
		* <pre><code>
		* IsProcessValid: function()
		* {
		*	//We require a value for this field
		*	var value = Data.GetValue("CompanyStructure__");
		*	return (value !== null && value !== "");
		* }
		* </code></pre>
		*/
		IsProcessValid: function ()
		{
			// Customization not implemented in sample package library
		},

		/**
		* Allows you to customize the value of variables and fields of the process to which vendor registration files
		* are submitted when vendor registration are sent the ERP via Esker Loader.
		* This user exit is called from the validation script of the Vendor registration process,
		* when the vendor registration is approved by the last approver
		* @memberof Lib.VendorRegistration.Customization.Server
		* @param {xTransport} erpNotifierVendorProcess The xTransport object of the ERPNotiferVendor that will be created
		* @example
		* <pre><code>
		* CustomizeERPNotifierVendor: function (erpNotifierVendorProcess)
		* {
		*	var vars = erpNotifierVendorProcess.GetUninheritedVars();
		*	vars.AddValue_String("TaxID__", Data.GetValue("TaxID__"), true);
		* }
		* </code></pre>
		*/
		CustomizeERPNotifierVendor: function (erpNotifierVendorProcess)
		{
			// Customization not implemented in sample package library
		},

		/**
		* Allows you to customize the xml file encoding output by returning the new encoding
		* Available values are 'UTF-8' (default value) or 'UTF-16'
		* @memberof Lib.VendorRegistration.Customization.Server
		* @param {string} previousEncoding the default encoding
		* @returns {string} the new encoding (should be "UTF-16" if you want another encoding than UTF-8)
		* @example
		* <pre><code>
		* GetEncoding: function (previousEncoding)
		* {
		*	return "UTF-16"
		* }
		* </code></pre>
		*/
		GetEncoding: function (previousEncoding)
		{
			// Customization not implemented in sample package library
		},

		/**
		* Allows you to customize the XML export mode used when applying GetFieldsRules,
		* GetTablesRules and GetModifiedNodeMapping
		* @memberof Lib.VendorRegistration.Customization.Server
		* @param {Lib.FlexibleFormToXML.ExportMode} previousExportMode The default exportMode used in the standard package.
		*                                    Default value is 1 meaning exports every fields except those in exclusion rules
		* @returns {Lib.FlexibleFormToXML.ExportMode} 0 (allExcept) or 1 (onlyIncluded)
		* @example
		* <pre><code>
		* GetExportMode: function (previousExportMode)
		* {
		*	return 1;
		* }
		* </code></pre>
		*/
		GetExportMode: function (previousExportMode)
		{
			// Customization not implemented in sample package library
		},

		/**
		* Allows you to customize the fields rules used for XML Export
		* @memberof Lib.VendorRegistration.Customization.Server
		* @param {Lib.FlexibleFormToXML.ExportMode} exportMode The current export mode used during the XML generation
		* @param {Lib.FlexibleFormToXML.FieldsRules} defaultFieldsRule default package XML Export fields rules
		* @example
		* <pre><code>
		* CustomizeERPNotifierVendor: function (exportMode, defaultFieldsRule)
		* {
		*	if (exportMode === 1)
		*   {
		*		defaultFieldsRule.excludedFields.push("Z_CustomFieldToExcludeWhenExportModeIsExcludeOnly");
		*	}
		*   else
		*   {
		*		includedFields.excludedFields.push("Z_CustomFieldToIncludeWhenExportModeIsIncludeOnly");
		*   }
		*	return defaultFieldsRule;
		* }
		* </code></pre>
		*/
		GetFieldsRules: function (exportMode, defaultFieldsRule)
		{
			// Customization not implemented in sample package library
		},

		/**
		* Allows you to customize the tables rules used for XML Export
		* @memberof Lib.VendorRegistration.Customization.Server
		* @param {Lib.FlexibleFormToXML.ExportMode} exportMode The current export mode used during the XML generation
		* @param {Lib.FlexibleFormToXML.TablesRules} defaultTablesRule default package XML Export table rules
		* @example
		* <pre><code>
		* GetTablesRules: function (exportMode, defaultTablesRule)
		* {
		*   return [
		*			{ name: "OfficersTable__" },
		*			{ name: "CompanyBankAccountsTable__" }
		*		];
		* }
		* </code></pre>
		*/
		GetTablesRules: function (exportMode, defaultTablesRule)
		{
			// Customization not implemented in sample package library
		},

		/**
		* Allows you to specify names for the XML nodes corresponding to custom fields of the Vendor Registration process.
		* This user exit is called from the validation script of the Vendor Registration process,
		* when the registration is sent to the ERP.
		* @memberof Lib.VendorRegistration.Customization.Server
		* @param {Lib.FlexibleFormToXML.ExportMode} exportMode The current exportMode integer value 0 (allExcept) or 1 (onlyIncluded)
		* @param {Lib.FlexibleFormToXML.ModifiedNodeNameMappings} modifiedNodeNameMappings The current fields mapping
		* @returns {Lib.FlexibleFormToXML.ModifiedNodeNameMappings} The updated fields mapping to include or exclude
		* @example
		* <pre><code>
		* GetModifiedNodeMapping: function (defaultModifiedNodeMapping)
		* {
		*   return { "Z_CustomField__" : "CustomField" };
		* }
		* </code></pre>
		*/
		GetModifiedNodeMapping: function (exportMode, defaultModifiedNodeMapping)
		{
			// Customization not implemented in sample package library
		},

		/**
		* Allows you to override some fields values in the resulting XML.
		* This user exit is called from the validation script of the Vendor Registration process,
		* when the registration is sent to the ERP.
		* @memberof Lib.VendorRegistration.Customization.Server
		* @param {Lib.FlexibleFormToXML.ModifiedFieldValuesMapping} modifiedFieldValuesMapping The current fields values mapping
		* @returns {Lib.FlexibleFormToXML.ModifiedFieldValuesMapping} The updated fields values
		* @example
		* <pre><code>
		* // Add a mapping to set the due date empty for NON-PO invoices
		* GetFieldValuesMapping: function (modifiedFieldValuesMapping)
		* {
		*	var invoiceType = Data.GetValue("RegistrationType__");
		*	if (invoiceType === "Creation")
		*	{
		*		modifiedFieldValuesMapping.VendorNumber__ = "New vendor"
		*	}
		*	return modifiedFieldValuesMapping;
		* }
		* </code></pre>
		*/
		GetFieldValuesMapping: function (modifiedFieldValuesMapping)
		{
			// Customization not implemented in sample package library
		},

		/**
		* Use this function to override the standard validity date, for the waiting state of ERP integration (default 24 hours timeout)
		* @memberof Lib.VendorRegistration.Customization.Server
		* @param {string} validityDate the default computed validityDateTime (Now + 24 hours)
		* @returns {string|null} Return the new Date to override the validityDateTime, if returns null does not override the default validityDateTime
		* @example
		* <pre><code>
		* SetERPWaitingValidityDate: function (validityDate)
		* {
		*  // Increase the timeout from 24 to 48 hours
		*  validityDate.setHours(validityDate.getHours() + 24);
		*  return validityDate;
		*}
		* </code></pre>
		*/
		SetERPWaitingValidityDate: function (validityDate)
		{
			return null;
		},

		/**
		* Use this function to enable touchless processing of vendor registration process.
		* When enabled, after a vendor submits a "vendor update", the form is processed automatically if no forms are in warning or error.
		* SIS-ID verification must pass too (if not a warning will be triggered)
		* @memberof Lib.VendorRegistration.Customization.Server
		* @returns {boolean} true if enabled, false if not
		* @example
		* <pre><code>
		* EnableTouchlessForUpdateOnVendorRegistration: function ()
		* {
		*  return true;
		*}
		* </code></pre>
		*/
		EnableTouchlessForUpdateOnVendorRegistration: function ()
		{
			return false;
		},

		/**
		 * Use this function to override the default roles sequence of the workflow
		 * @param {string[]} defaultRolesSequence The default roles sequence
		 * @returns {null | string[]} null if not enabled, an array of strings (the roles sequence) if enabled
		 * @example
		 * <pre><code>
		 * // Exemple: you want to add an AddressApprover and a BankDetailsApprover in the sequence, before the final approver
		 * // defaultRolesSequence is ["requester", "SisIdChecker", "OFACChecker", "legalReviewer", "approver"] here
		 * SetRolesSequence: function (defaultRolesSequence)
		 * {
		 * 		var approver = defaultRolesSequence.pop();
		 * 		defaultRolesSequence.push("AddressApprover");
		 * 		defaultRolesSequence.push("BankDetailsApprover");
		 * 		defaultRolesSequence.push(approver);
		 *		return defaultRolesSequence;
		 * }
		 * </code></pre>
		 */
		SetRolesSequence: function (defaultRolesSequence)
		{
			return null;
		},

		/**
		 * Use this function to override the defaultworkflow parameters
		 * @param {object} defaultWorkflowParameters The default workflow parameters
		 * @param {function} buildGenericContributors A function that makes the creation of OnBuild actions easier
		 * @returns {null | object} null if not enabled, an object representing the workflow parameters if enabled
		 * @example
		 * <pre><code>
		 * // Exemple: you want to add an AddressApprover and a BankDetailsApprover in the workflow parameters
		 * // Note: anything you pass to buildGenericContributors will overwrite the defaults values in objects
		 * SetWorkflowParameters: function (defaultWorkflowParameters, buildGenericContributors)
		 * {
		 * 		var addressApprover = {};
		 * 		addressApprover["OnBuild"] = buildGenericContributors({ role: "AddressApprover"});
		 * 		addressApprover["contributorKey"] = "AddressApprover";
		 * 		defaultWorkflowParameters.roles["AddressApprover"] = addressApprover;
		 * 		var bankDetailsApprover = {};
		 * 		bankDetailsApprover["OnBuild"] = buildGenericContributors({ role: "BankDetailsApprover"});
		 * 		bankDetailsApprover["contributorKey"] = "BankDetailsApprover";
		 * 		defaultWorkflowParameters.roles["BankDetailsApprover"] = bankDetailsApprover;
		 * 		return defaultWorkflowParameters;
		 * }
		 * </code></pre>
		 */
		SetWorkflowParameters: function (defaultWorkflowParameters, buildGenericContributors)
		{
			return null;
		}
	};
})(Lib.VendorRegistration.Customization);
