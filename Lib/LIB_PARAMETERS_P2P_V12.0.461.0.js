/* LIB_DEFINITION{
  "name": "LIB_PARAMETERS_P2P_V12.0.461.0",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Parameters library for P2P application",
  "require": [
    "Sys/Sys_Parameters"
  ]
}*/
///#GLOBALS Lib Sys
var Lib;
(function ()
{
	/**
	* @description This module allows you to view the parameters of the P2P solutions
	* depending on the current execution environment (Development/QA/Production).
	* The environment is detected based on the sub-account identifier.
	*
	* @exports P2P
	* @memberof Lib.Parameters
	*/

	// If the environment detection fails, the parameters are set based on the following default environment.
	var defaultEnvironment = "PROD";

	var ERPMapping =
	{
		PO:
		{
			managerToProcessFields:
			{
				"DocumentType__": { value: "NB" },
				"CompanyCode__": {},
				"PurchasingOrganization__": {},
				"PurchasingGroup__": {},
				"RequestedDeliveryDate__": { realName: "ItemRequestedDeliveryDate__" },
				"ValidityStart__": {},
				"ValidityEnd__": {},
				"Currency__": {},
				"VendorNumber__": {},
				"PurchasingMaterial__": { value: "" },
				"ItemDescription__": {},
				"ItemQuantity__": {},
				"ItemUnitPrice__": {},
				"ItemUnit__": function (DataObject)
				{
					if (Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure"))
					{
						return DataObject.GetValue("ItemUnit__") || Sys.Parameters.GetInstance("PAC").GetParameter("DefaultUnitOfMeasure");
					}

					// Old behavior, compatibility with SAP
					return "ST";
				},
				"ItemTaxCode__": {},
				"ItemGlAccount__": {},
				"ItemNetAmount__": {},
				"ItemGroup__": {},
				//usless for ItemAccountAssignmentCategory K
				"ItemAssetNumber__": {},
				"ItemPlant__": function ()
				{
					return Data.GetValue("DeliveryAddressID__");
				},
				"ItemMaterialGroup__": function ()
				{
					return Sys.Parameters.GetInstance("PAC").GetParameter("SAPItemMaterialGroup");
				},
				"ItemCostCenterId__": {},
				"ItemBusinessArea__": { value: "" },
				//ItemAccountAssignmentCategory need to be F to use this field
				"ItemInternalOrder__": { realName: "InternalOrder__" },
				//ItemAccountAssignmentCategory need to be P to use this field
				"ItemWBSElement__": { realName: "WBSElement__" },
				"ItemAccountAssignmentCategory__": { value: "K" },
				"PONumber__": { realName: "OrderNumber__" },
				"ItemNumber__": { realName: "LineItemNumber__" },
				"GoodsReceipt__": function (DataObject)
				{
					return !DataObject.GetValue("NoGoodsReceipt__");
				},
				"ShipToContact__": {},
				"ShipToCompany__": {},
				"ShipToPhone__": {},
				"ShipToEmail__": {},
				"ShipToAddress": function ()
				{
					return Sys.TechnicalData.GetValue("ShipToAddress") || Variable.GetValueAsString("ShipToAddress");
				}
			},
			managerToProcessTables:
			{
				"ItemsTable": Data.GetTable("LineItems__")
			}
		},

		GR:
		{
			managerToProcessFields:
			{
				"GRNumber__": {},
				"ItemUnit__": {},
				"PONumber__": { realName: "OrderNumber__" },
				"PostingDate__": function ()
				{
					return Sys.ScriptInfo.IsServer() ? Sys.Helpers.Globals.Helpers.Date.InDocumentTimezone(new Date()) : new Date();
				},
				"DocumentDate__": function ()
				{
					return Sys.ScriptInfo.IsServer() ? Sys.Helpers.Globals.Helpers.Date.InDocumentTimezone(new Date()) : new Date();
				},
				"referenceDocument": { realName: "DeliveryNote__" },
				"headerText": { value: "" },
				"ItemQuantityReceived__": { realName: "ReceivedQuantity__" },
				"ItemNumber__": { realName: "LineNumber__" },
				"ItemDeliveryCompleted__": { realName: "DeliveryCompleted__" }
			},
			managerToProcessTables:
			{
				"ItemsTable": Data.GetTable("LineItems__")
			}
		}
	};

	// List of parameters for Purchasing processes only.
	Sys.Parameters.GetInstance("PAC").Init(
		{
			// Each object associates one environment to a list of parameters and their values.

			// Environment name: must exactly match the sub-account identifier.
			"DEV":
			{
				// Process archive duration. This value, when defined, overrides the archive duration set on the processes.
				// The archive duration must be a multiple of 12 months, lower or equal to 132 months.

				//"ArchiveDurationInMonths": 120,

				// All following parameters are described in the following documentation page:
				// https://doc.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#Processes/PAC/Customizing_purchasing.html

				"APClerkLogin": "apspecialistsprocess.%[reference:login:demosubstring]",
				"P2PSupervisorLogin": "adminfinanceprocess.%[reference:login:demosubstring]",
				"TreasurerLogin": "adminfinanceprocess.%[reference:login:demosubstring]",
				"DefaultQuoteByEmailRequester": "requesterprocess.%[reference:login:demosubstring]",
				"DumpBAPICalls": false,
				"NumberFormat": "10000$seq$",
				"NumberFormatPO": "45000$seq$",
				"NumberFormatGR": "50000$seq$",
				"NumberFormatRO": "55000$seq$",
				"NumberFormatEPOR": "51000$seq$",
				"DisplayGlAccount": true,
				"DisplayExpenseCategory": false,
				"SAPItemMaterialGroup": "00701",
				"DemoCreditMemoNumberFormat": "CM$seq$",
				"DemoInvoiceNumberFormat": "INV$seq$",
				"DemoInvoiceTemplateName": "INVOICE_demo.docx",
				"DemoInvoiceGRIVTemplateName": "INVOICE_GRIV_demo.docx",
				"ERP": "generic",
				"AvailableDocumentCultures": ["en-US", "en-GB", "fr-FR"],
				"POTemplateName": "PurchaseOrder.rpt",
				"MaxEnterBudgetUpdateDelayInSeconds": "30",
				"ValidityDurationInMonths": "16",
				"RemoveRequesterFromApprovalWorkflow": "0",
				"DemoEnableInvoiceCreation": "0",
				"AlwaysCreateVendor": "1",
				"AlwaysAttachPurchaseOrder": "0",
				"SendPOAttachments": false,
				"ItemPriceVarianceToleranceLimit": "0",
				"TotalPriceVarianceToleranceLimit": "0",
				"SavePunchoutOrderXmlOnDocument": true,
				"DefaultCatalogLayout": "Lines",
				"POTermsConditionsTemplateName": null,
				"DisplayItemType": true,
				"AllowSplitPRIntoMultiplePO": true,
				"MultiShipTo": false,
				"PackingSlipTemplateName": "PackingSlip.rpt",
				"EnableOrderProgress": true
			},
			"QA":
			{
				//"ArchiveDurationInMonths": 120,
				"APClerkLogin": "apspecialistsprocess.%[reference:login:demosubstring]",
				"P2PSupervisorLogin": "adminfinanceprocess.%[reference:login:demosubstring]",
				"TreasurerLogin": "adminfinanceprocess.%[reference:login:demosubstring]",
				"DefaultQuoteByEmailRequester": "requesterprocess.%[reference:login:demosubstring]",
				"DumpBAPICalls": false,
				"NumberFormat": "10000$seq$",
				"NumberFormatPO": "45000$seq$",
				"NumberFormatGR": "50000$seq$",
				"NumberFormatRO": "55000$seq$",
				"NumberFormatEPOR": "51000$seq$",
				"DisplayGlAccount": true,
				"DisplayExpenseCategory": false,
				"SAPItemMaterialGroup": "00701",
				"DemoCreditMemoNumberFormat": "CM$seq$",
				"DemoInvoiceNumberFormat": "INV$seq$",
				"DemoInvoiceTemplateName": "INVOICE_demo.docx",
				"DemoInvoiceGRIVTemplateName": "INVOICE_GRIV_demo.docx",
				"ERP": "generic",
				"AvailableDocumentCultures": ["en-US", "en-GB", "fr-FR"],
				"POTemplateName": "PurchaseOrder.rpt",
				"MaxEnterBudgetUpdateDelayInSeconds": "30",
				"ValidityDurationInMonths": "16",
				"RemoveRequesterFromApprovalWorkflow": "0",
				"DemoEnableInvoiceCreation": "0",
				"AlwaysCreateVendor": "1",
				"AlwaysAttachPurchaseOrder": "0",
				"SendPOAttachments": false,
				"ItemPriceVarianceToleranceLimit": "0",
				"TotalPriceVarianceToleranceLimit": "0",
				"SavePunchoutOrderXmlOnDocument": true,
				"DefaultCatalogLayout": "Lines",
				"POTermsConditionsTemplateName": null,
				"DisplayItemType": true,
				"AllowSplitPRIntoMultiplePO": true,
				"MultiShipTo": false,
				"PackingSlipTemplateName": "PackingSlip.rpt",
				"EnableOrderProgress": true
			},
			"PROD":
			{
				//"ArchiveDurationInMonths": 120,
				"APClerkLogin": "apspecialistsprocess.%[reference:login:demosubstring]",
				"P2PSupervisorLogin": "adminfinanceprocess.%[reference:login:demosubstring]",
				"TreasurerLogin": "adminfinanceprocess.%[reference:login:demosubstring]",
				"DefaultQuoteByEmailRequester": "requesterprocess.%[reference:login:demosubstring]",
				"DumpBAPICalls": false,
				"NumberFormat": "10000$seq$",
				"NumberFormatPO": "45000$seq$",
				"NumberFormatGR": "50000$seq$",
				"NumberFormatRO": "55000$seq$",
				"NumberFormatEPOR": "51000$seq$",
				"DisplayGlAccount": true,
				"DisplayExpenseCategory": false,
				"SAPItemMaterialGroup": "00701",
				"DemoCreditMemoNumberFormat": "CM$seq$",
				"DemoInvoiceNumberFormat": "INV$seq$",
				"DemoInvoiceTemplateName": "INVOICE_demo.docx",
				"DemoInvoiceGRIVTemplateName": "INVOICE_GRIV_demo.docx",
				"ERP": "generic",
				"AvailableDocumentCultures": ["en-US", "en-GB", "fr-FR"],
				"POTemplateName": "PurchaseOrder.rpt",
				"MaxEnterBudgetUpdateDelayInSeconds": "30",
				"ValidityDurationInMonths": "16",
				"RemoveRequesterFromApprovalWorkflow": "0",
				"DemoEnableInvoiceCreation": "0",
				"AlwaysCreateVendor": "1",
				"AlwaysAttachPurchaseOrder": "0",
				"SendPOAttachments": false,
				"ItemPriceVarianceToleranceLimit": "0",
				"TotalPriceVarianceToleranceLimit": "0",
				"SavePunchoutOrderXmlOnDocument": true,
				"DefaultCatalogLayout": "Lines",
				"POTermsConditionsTemplateName": null,
				"DisplayItemType": true,
				"AllowSplitPRIntoMultiplePO": true,
				"MultiShipTo": false,
				"PackingSlipTemplateName": "PackingSlip.rpt",
				"EnableOrderProgress": true
			}
		},
		{
			defaultEnvironment: defaultEnvironment,
			tableParameters: {
				tableName: "AP - Application Settings__",
				configuration: Variable.GetValueAsString("Configuration"),
				// One record by configuration (settings as columns)
				mode: Sys.Parameters.Mode.SettingsAsColumns,
				serializable: true,
				saveName: "tableParameters"
			}
		},
		{
			// Specifies whether the parameter values set in this module are overridden or not by the values of the process variables.
			"APClerkLogin": { overriddenByVariable: true },
			"P2PSupervisorLogin": { overriddenByVariable: true },
			"TreasurerLogin": { overriddenByVariable: true },
			"DefaultQuoteByEmailRequester": { overriddenByVariable: true },
			"DumpBAPICalls": { overriddenByVariable: true, type: "boolean" },
			"NumberFormat": { overriddenByVariable: true },
			"NumberFormatPO": { overriddenByVariable: true },
			"NumberFormatGR": { overriddenByVariable: true },
			"NumberFormatRO": { overriddenByVariable: true },
			"NumberFormatEPOR": { overriddenByVariable: true },
			"DisplayGlAccount": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"DisplayExpenseCategory": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"DisplayTaxCode": { overriddenByVariable: true, type: "boolean" },
			"SAPPurchasingOrganization": { overriddenByVariable: true },
			"SAPItemMaterialGroup": { overriddenByVariable: true },
			"DemoInvoiceNumberFormat": { overriddenByVariable: true },
			"DemoInvoiceTemplateName": { overriddenByVariable: true },
			"ArchiveDurationInMonths": { overriddenByVariable: true, overriddenByTableParameters: "ProcurementArchiveDurationInMonths__" },
			"UndefinedBudgetBehavior": { serializable: { prefixed: false } },
			"OutOfBudgetBehavior": { serializable: { prefixed: false } },
			"DisableBudget": { type: "boolean" },
			"BudgetKeyColumns": { overriddenByVariable: true, serializable: { prefixed: false } },
			"BudgetValidationKeyColumns": { overriddenByVariable: true, serializable: { prefixed: false } },
			"DisableCrossSectionalBudgetLine": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"BackupUserWarning": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"AdminWarning": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"AllowRequestedDeliveryDateInPast": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false }, overriddenByTableParameters: "AllowRequestedDeliveryDateInPast__" },
			"SavePunchoutOrderXmlOnDocument": { overriddenByVariable: true, type: "boolean" },
			"DisplayUnitOfMeasure": { overriddenByVariable: true, type: "boolean" },
			"DisplayCostType": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"DisplayItemType": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"AllowSplitPRIntoMultiplePO": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"ContractViewer": { overriddenByVariable: true },
			"EnableItemRating": { overriddenByVariable: true, type: "boolean" },
			"DisplayContractInProcurement": { overriddenByVariable: false, type: "boolean", alwaysUseCurrentValue: true },
			"MultiShipTo": { overridable: { by: "variable", resetOnReload: true }, type: "boolean", serializable: { legacyValue: false } },
			"EnableVendorModifyPO": { overriddenByVariable: true, type: "boolean" },
			"EnablePublicPrice": { overriddenByVariable: true, type: "boolean" },
			"InvoicedProcessCancellationBehavior": { overriddenByVariable: true }
		});

	// List of parameters for Expense processes only.
	Sys.Parameters.GetInstance("Expense").Init(
		{
			// Each object associates one environment to a list of parameters and their values.

			// Environment name: must exactly match the sub-account identifier.
			"DEV":
				{},
			"QA":
				{},
			"PROD":
				{}
		},
		{
			defaultEnvironment: defaultEnvironment,
			tableParameters: {
				tableName: "AP - Application Settings__",
				configuration: Variable.GetValueAsString("Configuration"),
				// One record by configuration (settings as columns)
				mode: Sys.Parameters.Mode.SettingsAsColumns,
				serializable: true,
				saveName: "tableParameters"
			}
		},
		{
			"ExpenseReportTemplateName": { overriddenByVariable: true },
			"SendApprovalNotificationToRequester": { overriddenByVariable: true }, // Possible valeurs : none, always (lastApprobation not implement)
			"ReportCreationGroupingKey": { overriddenByVariable: true }
		});

	// List of parameters for Contract process only
	Sys.Parameters.GetInstance("Contract").Init(
		{
			// Each object associates one environment to a list of parameters and their values.

			// Environment name: must exactly match the sub-account identifier.
			"DEV":
				{},
			"QA":
				{},
			"PROD":
				{}
		},
		{
			defaultEnvironment: defaultEnvironment,
			tableParameters: {
				tableName: "AP - Application Settings__",
				configuration: Variable.GetValueAsString("Configuration"),
				// One record by configuration (settings as columns)
				mode: Sys.Parameters.Mode.SettingsAsColumns,
				serializable: true,
				saveName: "tableParameters"
			}
		},
		{
			"DisplayUnitOfMeasure": { overriddenByVariable: true, type: "boolean", alwaysUseCurrentValue: true }
		});

	// List of parameters for Remittance Advice processes only.
	Sys.Parameters.GetInstance("RemittanceAdvice").Init(
		{
			// Each object associates one environment to a list of parameters and their values.

			// Environment name: must exactly match the sub-account identifier.
			"DEV":
			{
				"TemplateName": "RemittanceAdvice.rpt"
			},
			"QA":
			{
				"TemplateName": "RemittanceAdvice.rpt"
			},
			"PROD":
			{
				"TemplateName": "RemittanceAdvice.rpt"
			}
		},
		{
			defaultEnvironment: defaultEnvironment
		});

	// List of parameters for Accounts Payable processes only.
	Sys.Parameters.GetInstance("AP").Init(
		{
			// Environment name: must exactly match the sub-account identifier.
			"DEV":
			{
				// ExportSAPInvoiceToXML define if we export the SAP invoice process for another ERP or not.
				"ExportSAPInvoiceToXML": false,
				"SFTPConfigurationName": "SFTP2",
				//"ERPNotifierOwnerLogin":
				//"ERPNotifierVendorOwnerLogin":
				"VendorInvoiceOwner": "apspecialistsprocess.%[reference:login:demosubstring]",
				"DumpBAPICalls": false,
				// "isArkhineoConf": true,
				// "userArkhineo": "",
				// "passwordArkhineo": "",
				// "cfeId": "",
				// "sectionId": ""
				"ShowApproverOption": true,
				"matchPOLineToMultipleGRs": false
			},
			"QA":
			{
				"ExportSAPInvoiceToXML": false,
				"SFTPConfigurationName": "SFTP2",
				//"ERPNotifierOwnerLogin":
				//"ERPNotifierVendorOwnerLogin":
				"VendorInvoiceOwner": "apspecialistsprocess.%[reference:login:demosubstring]",
				"DumpBAPICalls": false,
				// "isArkhineoConf": true,
				// "userArkhineo": "",
				// "passwordArkhineo": "",
				// "cfeId": "",
				// "sectionId": ""
				"ShowApproverOption": true,
				"matchPOLineToMultipleGRs": false
			},
			"PROD":
			{
				"ExportSAPInvoiceToXML": false,
				"SFTPConfigurationName": "SFTP2",
				//"ERPNotifierOwnerLogin":
				//"ERPNotifierVendorOwnerLogin":
				"VendorInvoiceOwner": "apspecialistsprocess.%[reference:login:demosubstring]",
				"DumpBAPICalls": false,
				// "isArkhineoConf": true,
				// "userArkhineo": "",
				// "passwordArkhineo": "",
				// "cfeId": "",
				// "sectionId": ""
				"ShowApproverOption": true,
				"matchPOLineToMultipleGRs": false
			}
		},
		{
			defaultEnvironment: defaultEnvironment,
			tableParameters: {
				tableName: "AP - Application Settings__",
				configuration: Variable.GetValueAsString("Configuration"),
				// One record by configuration (settings as columns)
				mode: Sys.Parameters.Mode.SettingsAsColumns,
				serializable: true,
				saveName: "tableParameters"
			}
		},
		{
			"CompanyCode": { overriddenByVariable: true },
			"OrderNumberPatterns": { overriddenByVariable: true },
			"ERP": { overriddenByVariable: true },
			"ArchiveDurationInMonths": { overriddenByVariable: true },
			"AvailableDocumentCultures": { overriddenByVariable: true },
			// ERPExportMethod define the Export method of the SAP invoice process to another ERP. It can be set to SFTP or PROCESS.
			"ERPExportMethod": { overriddenByVariable: true },
			"ERPNotifierOwnerLogin": { overriddenByVariable: true },
			"ERPNotifierProcessName": { overriddenByVariable: true },
			"ERPNotifierVendorOwnerLogin": { overriddenByVariable: true },
			"ERPNotifierVendorProcessName": { overriddenByVariable: true },
			"ERPNotifierPaymentRunOwnerLogin": { overriddenByVariable: true },
			"ERPNotifierPaymentRunProcessName": { overriddenByVariable: true },
			"ExportInvoiceImageFormat": { overriddenByVariable: true },
			"SFTPConfigurationName": { overriddenByVariable: true },
			"VendorInvoiceOwner": { overriddenByVariable: true },
			"VerificationPOMatchingMode": { overriddenByVariable: true },
			"SAPConfiguration": { overriddenByVariable: true, serializable: true },
			"SAPDocumentTypeFIInvoice": { overriddenByVariable: true },
			"SAPDocumentTypeFICreditNote": { overriddenByVariable: true },
			"SAPDocumentTypeMMInvoice": { overriddenByVariable: true },
			"SAPDocumentTypeMMCreditNote": { overriddenByVariable: true },
			"userArkhineo": { overriddenByVariable: true },
			"passwordArkhineo": { overriddenByVariable: true },
			"isArkhineoConf": { overriddenByVariable: true },
			"cfeId": { overriddenByVariable: true },
			"sectionId": { overriddenByVariable: true },
			"BackupUserWarning": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"AdminWarning": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"EnableVendorERPConnection": { overriddenByVariable: true, serializable: true },
			"EnableTouchlessForNonPoInvoice": { overriddenByVariable: true },
			"EnableTouchlessForExpenseInvoice": { type: "boolean" },
			"DumpBAPICalls": { overriddenByVariable: true, type: "boolean" }
		});

	// List of parameters for Purchasing and Accounts Payable processes whatever the ERP integration.
	Sys.Parameters.GetInstance("P2P").Init(
		{
			// Each object associates one environment to a list of parameters and their values.
			// Environment name: must exactly match the sub-account identifier.
			"DEV":
			{
				"ArchiveDurationWarning": false,
				"BackupUserWarning": true,
				"AdminWarning": true,
				"EnableERPSelection": true,
				"PushNotificationType": "full"
			},
			"QA":
			{
				"ArchiveDurationWarning": false,
				"BackupUserWarning": true,
				"AdminWarning": true,
				"EnableERPSelection": false,
				"PushNotificationType": "full"
			},
			"PROD":
			{
				"ArchiveDurationWarning": true,
				"BackupUserWarning": true,
				"AdminWarning": true,
				"EnableERPSelection": false,
				"PushNotificationType": "full"
			}
		},
		{
			defaultEnvironment: defaultEnvironment,
			tableParameters:
			{
				tableName: "P2P - Global Application Settings__",
				mode: Sys.Parameters.Mode.SettingsAsColumns,
				unique: true
			}
		},
		{
			// Specifies whether the parameter values set in this module are overridden or not by the values of the process variables.
			"ArchiveDurationWarning": { overriddenByVariable: true, type: "boolean" },
			"BackupUserWarning": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			"AdminWarning": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } },
			// Display or not the combobox "ERP__" which allows to select the type of ERP to use (only enabled in DEV env. by default)
			"EnableERPSelection": { overriddenByVariable: true, type: "boolean" },
			"EnableInventoryManagement": { overriddenByVariable: true, type: "boolean" },
			"EnableMultiSupplierItem": { overriddenByVariable: true, type: "boolean" },
			"EnableAdvancedShippingNotice": { overriddenByVariable: true, type: "boolean" },
			"EnableReturnManagement": { overriddenByVariable: true, type: "boolean", serializable: { prefixed: false } }
		});

	// List of parameters for Purchasing and Accounts Payable processes with generic ERP integration.
	Sys.Parameters.GetInstance("P2P_generic").Init(
		{
			// Environment name: must exactly match the sub-account identifier.
			"DEV":
			{
				// ERP configuration name. When the record is initialized, this value is stored on the record.
				// If the ERP configuration name is undefined, the value of the SAPConfiguration variable is used instead.
				"Configuration": "",

				// Use to allow user to browse master data from his ERP
				"BrowseMasterDataFromERP": false,

				// Enabling creation of PO in ERP
				"CreateDocInERP": false,

				// Defining mapping between ERPManager and process fields in order to get value
				"ERPMapping": ERPMapping
			},
			"QA":
			{
				"Configuration": "",
				"BrowseMasterDataFromERP": false,
				"CreateDocInERP": false,
				"ERPMapping": ERPMapping
			},
			"PROD":
			{
				"Configuration": "",
				"BrowseMasterDataFromERP": false,
				"CreateDocInERP": false,
				"ERPMapping": ERPMapping
			}
		},
		defaultEnvironment,
		{
			"BrowseMasterDataFromERP": { overriddenByVariable: true, type: "boolean" },
			"CreateDocInERP": { overriddenByVariable: true, type: "boolean" }
		});

	// List of parameters for Purchasing and Accounts Payable processes with SAP integration.
	Sys.Parameters.GetInstance("P2P_SAP").Init(
		{
			// Environment name: must exactly match the sub-account identifier.
			"DEV":
			{
				// SAP configuration name.
				"Configuration": "CUSTOMER_ESKERDEMO",
				"BrowseMasterDataFromERP": true,
				"CreateDocInERP": true,
				"ERPMapping": ERPMapping,
				"WaitForPostResult": false,
				"EnableInvestment": false,
				"SupportNonERPOrder": true
			},
			"QA":
			{
				"Configuration": "CUSTOMER_ESKERDEMO",
				"BrowseMasterDataFromERP": true,
				"CreateDocInERP": true,
				"ERPMapping": ERPMapping,
				"WaitForPostResult": false,
				"EnableInvestment": false,
				"SupportNonERPOrder": true
			},
			"PROD":
			{
				"Configuration": "CUSTOMER_ESKERDEMO",
				"BrowseMasterDataFromERP": true,
				"CreateDocInERP": true,
				"ERPMapping": ERPMapping,
				"WaitForPostResult": false,
				"EnableInvestment": false,
				"SupportNonERPOrder": true
			}
		},
		defaultEnvironment,
		{
			"BrowseMasterDataFromERP": { overriddenByVariable: true, type: "boolean" },
			"CreateDocInERP": { overriddenByVariable: true, type: "boolean" },
			"WaitForPostResult": { overriddenByVariable: true, type: "boolean" },
			"EnableInvestment": { overriddenByVariable: true, type: "boolean" }
		});

	// List of parameters for Purchasing and Accounts Payable processes with generic ERP integration.
	Sys.Parameters.GetInstance("P2P_JDE").Init(
		{
			// Environment name: must exactly match the sub-account identifier.
			"DEV":
			{
				// ERP configuration name. When the record is initialized, this value is stored on the record.
				// If the ERP configuration name is undefined, the value of the SAPConfiguration variable is used instead.
				"Configuration": "",

				// Use to allow user to browse master data from his ERP
				"BrowseMasterDataFromERP": false,

				// Enabling creation of PO in ERP
				"CreateDocInERP": false,

				// Defining mapping between ERPManager and process fields in order to get value
				"ERPMapping": ERPMapping,

				"SupportNonERPOrder": true
			},
			"QA":
			{
				"Configuration": "",
				"BrowseMasterDataFromERP": false,
				"CreateDocInERP": false,
				"ERPMapping": ERPMapping,
				"SupportNonERPOrder": true
			},
			"PROD":
			{
				"Configuration": "",
				"BrowseMasterDataFromERP": false,
				"CreateDocInERP": false,
				"ERPMapping": ERPMapping,
				"SupportNonERPOrder": true
			}
		},
		defaultEnvironment,
		{
			"BrowseMasterDataFromERP": { overriddenByVariable: true, type: "boolean" },
			"CreateDocInERP": { overriddenByVariable: true, type: "boolean" }
		});

	// List of parameters for Purchasing and Accounts Payable processes with generic ERP integration.
	Sys.Parameters.GetInstance("P2P_EBS").Init(
		{
			// Environment name: must exactly match the sub-account identifier.
			"DEV":
			{
				// ERP configuration name. When the record is initialized, this value is stored on the record.
				// If the ERP configuration name is undefined, the value of the SAPConfiguration variable is used instead.
				"Configuration": "",

				// Use to allow user to browse master data from his ERP
				"BrowseMasterDataFromERP": false,

				// Enabling creation of PO in ERP
				"CreateDocInERP": false,

				// Defining mapping between ERPManager and process fields in order to get value
				"ERPMapping": ERPMapping,

				"SupportNonERPOrder": true
			},
			"QA":
			{
				"Configuration": "",
				"BrowseMasterDataFromERP": false,
				"CreateDocInERP": false,
				"ERPMapping": ERPMapping,
				"SupportNonERPOrder": true
			},
			"PROD":
			{
				"Configuration": "",
				"BrowseMasterDataFromERP": false,
				"CreateDocInERP": false,
				"ERPMapping": ERPMapping,
				"SupportNonERPOrder": true
			}
		},
		defaultEnvironment,
		{
			"BrowseMasterDataFromERP": { overriddenByVariable: true, type: "boolean" },
			"CreateDocInERP": { overriddenByVariable: true, type: "boolean" }
		});

	// List of parameters for Purchasing and Accounts Payable processes with NAV ERP integration.
	Sys.Parameters.GetInstance("P2P_NAV").Init(
		{
			// Environment name: must exactly match the sub-account identifier.
			"DEV":
			{
				// ERP configuration name. When the record is initialized, this value is stored on the record.
				// If the ERP configuration name is undefined, the value of the SAPConfiguration variable is used instead.
				"Configuration": "",

				// Use to allow user to browse master data from his ERP
				"BrowseMasterDataFromERP": false,

				// Enabling creation of PO in ERP
				"CreateDocInERP": false,

				// Defining mapping between ERPManager and process fields in order to get value
				"ERPMapping": ERPMapping,

				"SupportNonERPOrder": true
			},
			"QA":
			{
				"Configuration": "",
				"BrowseMasterDataFromERP": false,
				"CreateDocInERP": false,
				"ERPMapping": ERPMapping,
				"SupportNonERPOrder": true
			},
			"PROD":
			{
				"Configuration": "",
				"BrowseMasterDataFromERP": false,
				"CreateDocInERP": false,
				"ERPMapping": ERPMapping,
				"SupportNonERPOrder": true
			}
		},
		defaultEnvironment,
		{
			"BrowseMasterDataFromERP": { overriddenByVariable: true, type: "boolean" },
			"CreateDocInERP": { overriddenByVariable: true, type: "boolean" }
		});

	Sys.Parameters.GetInstance("PaymentRun").Init({
		"PROD": {
			"ArchiveDurationInMonths": 12,
			"ValidityDateTimeInMonths": 12
		},
		"QA": {
			"ArchiveDurationInMonths": 0,
			"ValidityDateTimeInMonths": 0
		}
	}, defaultEnvironment);
})();
