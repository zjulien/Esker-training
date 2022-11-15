/**
 * @file Lib.Expense.Report.Customization.Common library: common script Expense Report customization callbacks
 */

/**
 * Package Expense Report Common script customization callbacks
 * @namespace Lib.Expense.Report.Customization.Common
 */

/* LIB_DEFINITION
{
	"name": "Lib_Expense_Report_Customization_Common",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"comment": "Custom library extending Expense Report scripts on client and server side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Expense.Report.Customization.Common", function ()
{
	/**
	 * @lends Lib.Expense.Report.Customization.Common
	 */
	var customization = {
		/**
		 * Allows you to customize the data available in the PDF report of the Expense Report process.
		 * This user exit is called from the HTML Page script of the Expense Report process when the PDF report is generated.
		 * 
		 * @param {object} ExpenseReportData JavaScript object containing the data available in the PDF report.
		 * @returns {object} The modified ExpenseReportData object.
		 * 
		 * This user exit merges the expense details lines having the same expense type.
		 * @example
		 * <pre><code>
		 * CustomizeExpenseReportData: function (ExpenseReportData)
		 * {
		 *	var expensesTable = Sys.Helpers.Array.Reduce(ExpenseReportData.tables.ExpensesTable__, function (accumulator, current)
		 *	{
		 *		var key = current.ExpenseType__;
		 *
		 *		if (accumulator[key] == null)
		 *		{
		 *			accumulator[key] = current;
		 *		}
		 *		else
		 *		{
		 *			accumulator[key].Amount__ += current.Amount__;
		 *		}
		 *
		 *		return accumulator;
		 *
		 *	}, {});
		 *
		 *	ExpenseReportData.tables.ExpensesTable__ = Sys.Helpers.Object.Values(expensesTable);
		 *
		 *	return ExpenseReportData;
		 * },
		 * </code></pre>
		 */
		CustomizeExpenseReportData: function (ExpenseReportData)
		{

		},

		/**
		 * Allows you to customize the fields mapping used in the Crystal template of the Expense Report process to generate the PDF report.
		 * This user exit is called from the HTML Page script of the Expense Report process when loading the Crystal template.
		 *
		 * @returns {object} mapping of merge fields used in the rpt template to the values of the Expense Report process
		 * 
		 * This user exit customizes the fields mapping.
		 * @example
		 * <pre><code>
		 * GetExtraExpenseReportRPTFields: function ()
		 * {
		 *	 var ExtraExpenseReportRPTFields = {
		 *		 "header":
		 *		 {
		 *			 "ExpenseReportDate__": function (info)
		 *			 {
		 *				 return Date.UTC(Date.now());
		 *			 },
		 *			 "Currency": "CC_Currency__", // Duplicate with another name
		 *			 "InexistentField": "InexistentField__", // This field do not exist in the Data object
		 *		 },
		 *		 "tables":
		 *		 {
		 *			 "ExpensesTable__":
		 *			 {
		 *				 "fields":
		 *				 {
		 *					 "Amount__": function (info)
		 *					 {
		 *						 return 1 + info.item.GetValue("Amount__");
		 *					 },
		 *					 "ExpenseNumber__": "ExpenseNumber__" // Duplicate with another name
		 *				 }
		 *			 }
		 *		 }
		 *	 }
		 *	 return ExtraExpenseReportRPTFields;
		 * } 
		 * </code></pre>
		 */
		GetExtraExpenseReportRPTFields: function () 
		{

		},

		/**
		 * Allows you to specify the name of the Crystal template used to generate the PDF report in the Expense Report process.
		 * This user exit is called from the HTML Page script of the Expense Report process before loading the Crystal template.
		 *
		 * @returns {string} String value containing the name of the Crystal template.
		 * 
		 * This user exit specifies a Crystal template for each company code.
		 * @example
		 * <pre>
		 * <code>
		 * GetExpenseReportTemplateName: function ()
		 * {
		 * 	 return "My_Template_By_CompanyCode_" + Data.GetValue("CompanyCode__") + ".rpt";
		 * }
		 * </code>
		 * </pre>
		 */
		GetExpenseReportTemplateName: function ()
		{
		},

		/**
		 * Should return a possibly modified ExpenseFields
		 *
		 * @example
		 * <pre><code>
		 * CustomizeExpenseFieldsMapping: function (ExpenseFields)
		 * {
		 *	// Format of ExpenseFields: ExpenseFields.expenseReportFieldName = "expenseFieldName"
		 * 	// Add Z_Billable__ field in ExpenseFields
		 * 	ExpenseFields.Z_Billable__ = "Z_Billable__";
		 * 	// Delete Billable__ field in ExpenseFields
		 * 	delete ExpenseFields.Billable__;
		 *	return ExpenseFields;
		 * }
		 * </code></pre>
		 * 
		 * @returns {object} new ExpenseFields
		 */
		CustomizeExpenseFieldsMapping: function (ExpenseFields)
		{
			// return ExpenseFields;
		}
	};

	return customization;
});