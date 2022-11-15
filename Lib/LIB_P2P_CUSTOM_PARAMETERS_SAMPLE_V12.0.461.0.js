/* LIB_DEFINITION
{
	"name": "LIB_P2P_CUSTOM_PARAMETERS",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"comment": "My custom parameters definition for P2P applications.",
	"versionable": false,
	"require": ["Sys/Sys_Parameters"]
}
*/
///#GLOBALS Lib Sys
var Lib;
(function ()
{
	/**
	 * @description This module allows you to set the parameters of the P2P solutions
	 * depending on the current execution environment (Development/QA/Production).
	 * The environment is detected based on the sub-account identifier.
	 */

	// If the environment detection fails, the parameters are set based on the default environment (PROD by default).

	// All parameters are described in the following documentation page:
	// https://doc.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#Processes/PAC/Customizing_purchasing.html

	// My custom parameters for Purchasing processes only (PAC instance).
	Sys.Parameters.GetInstance("PAC").Extend(
		// Each object associates one environment to a list of parameters and their values.
		{
			"PROD": // Environment name: must exactly match the sub-account identifier.
			{
				"DemoEnableInvoiceCreation": "3",
				"ItemPriceVarianceToleranceLimit": "5%",
				"TotalPriceVarianceToleranceLimit": "5%",
				"DefaultCatalogLayout": "Cards"
			},
			"QA":
			{
				"DemoEnableInvoiceCreation": "3",
				"ItemPriceVarianceToleranceLimit": "5%",
				"TotalPriceVarianceToleranceLimit": "5%",
				"DefaultCatalogLayout": "Cards"
			},
			"DEV":
			{
				"DemoEnableInvoiceCreation": "3",
				"ItemPriceVarianceToleranceLimit": "5%",
				"TotalPriceVarianceToleranceLimit": "5%",
				"DefaultCatalogLayout": "Cards"
			}
		});

})();