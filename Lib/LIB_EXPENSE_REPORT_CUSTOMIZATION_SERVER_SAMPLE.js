/**
 * @file Lib.Expense.Report.Customization.Server library: server script Purchase Order customization callbacks
 */

/**
* Package Expense Report Server script customization callbacks
* @namespace Lib.Expense.Report.Customization.Server
*/

/* LIB_DEFINITION
{
	"name": "Lib_Expense_Report_Customization_Server",
	"libraryType": "LIB",
	"scriptType": "SERVER",
	"comment": "Custom library extending Expense Report scripts on server side",
	"versionable" : false,
	"require": [ "Sys/Sys" ]
}
*/

///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Expense.Report.Customization.Server", function ()
{
	/**
	 * @lends Lib.Expense.Report.Customization.Server
	 */
	var customization = {
		/**
		 * Allows you to customize the PDF report attached to the Expense Report process.
		 * This user exit is called from the Expense Report process, when the PDF report is generated and attached to the Expense Report process.
		 * 
		 * @param {integer} iAttachExpenseReport Zero-based index of the attachment corresponding to the PDF Expense Report
		 * 
		 * This user exit adds terms and conditions to the PDF report.
		 * @example
		 * <pre><code>
		 * OnAttachExpenseReportPDF: function (iAttachExpenseReport)
		 * {
		 *	 var tcFile = "%Misc%\\ExpenseReport_term_condition.pdf";
		 *	 var pdfCommands = "-merge %infile[" + (iAttachExpenseReport + 1) + "]% \"" + tcFile + "\"";
		 *	 Attach.PDFCommands(pdfCommands);
		 * }
		 * </code></pre>
		 */
		OnAttachExpenseReportPDF: function (iAttachExpenseReport)
		{
		},

		/**
		 * Allows you to modify the email notifications in the Expense Report process.
		 * This user exit is called before sending the notification.
		 * You can choose to not send the notification by returning false for some notification.
		 * @param { json } emailOptions
		 * emailOptions structure: {
		 * 	userId: ,
		 * 	subject: ,
		 * 	template: ,
		 * 	customTags: ,
		 * 	escapeCustomTags: true,
		 * 	fromName: "Esker Expense management",
		 * 	backupUserAsCC:
		 * 	sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
		 * };
		 * @returns { boolean } false to indicate that a notification should not be sent or true to indicate the notification is sent.
		 * 
		 * This user exit sets the sender name.
		 * @example
		 * <pre><code>
		 * OnSendEmailNotification: function (emailOptions)
		 * {
		 *	 emailOptions.fromName = "Expense Management Notifier";
		 *	 return true;
		 * }
		 * </code></pre>
		 */
		OnSendEmailNotification: function (emailOptions)
		{
		},

		/**
		 * Allows you to customize the account to use as the owner of the invoice generated from the expense report.
		 * This user exit is called when the invoice is generated.
		 * 
		 * @returns {string} String value specifying the account to use. If nothing is returned, the account specified in the DefaultAPClerk parameter is used.
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
		 * 
		 * In Order to see the structure of invoiceData, please refer to Lib.Expense.Report.GetInvoiceData function
		 * @param {Object} invoiceData contains :
		 * {
		 * 	"IsFromExpense":            Boolean,
		 * 	"header":
		 * 	{
		 * 	    "InvoiceNumber":        number,
		 * 	    "InvoiceDate":          date,
		 * 	    "InvoiceAmount":        decimal number,
		 * 	    "NetAmount":            decimal number,
		 * 	    "TaxAmount":            decimal number,
		 * 	    "InvoiceCurrency":      string,
		 * 	    "VendorName":           string,
		 * 	    "VendorVATNumber":      number
		 * 	},
		 * 	"logo":
		 * 	{},
		 * 	"companyInfo":
		 * 	{},
		 * 	"tables":
		 * 	{
		 * 	    "LineItems":            [],
		 * 	    "PaymentInformations":  [],
		 * 	    "TaxInformations":      []
		 * 	},
		 * 	"Attachment":
		 * 	{
		 * 	    "Filename":             string,
		 * 	    "Content":              string,
		 * 	    "MimeType":             string
		 * 	}
		 *}
		 * @param {Object} additionalData contains :
		 * expenses: Array containing the expenses used to build the invoice data
		 * expenseNumbers: Array containing the expense numbers of the expenses used to build the invoice data
		 * companyCodeValues: CompanyCodeValues object containing the company code values
		 * userProperties: UserProperties object containing the user properties (cost center ...)
		 * @returns { Object } The modified invoiceData object.
		 *
		 * This user exit groups the invoice line items by tax code.
		 * @example
		 * <pre><code>
		 * CustomizeInvoiceData: function (invoiceData, additionalData)
		 * {
		 * 	 if (invoiceData.tables && invoiceData.tables.LineItems)
		 * 	 {
		 * 	 var groupedLineItems = {};
		 * 	 invoiceData.tables.LineItems.forEach(function (line)
		 * 	 {
		 * 		 if (!groupedLineItems[line.TaxCode])
		 * 		 {
		 * 			 groupedLineItems[line.TaxCode] = {
		 * 				 Amount: 0,
		 * 				 TaxAmount: 0
		 * 			 };
		 * 		 }
		 *
		 * 		 groupedLineItems[line.TaxCode].Description = Data.GetValue("ExpenseReportNumber__") + " - " + Data.GetValue("UserName__") + " - " + line.TaxCode;
		 * 		 groupedLineItems[line.TaxCode].Amount += line.Amount;
		 * 		 groupedLineItems[line.TaxCode].GLAccount = line.GLAccount;
		 * 		 groupedLineItems[line.TaxCode].CostCenter = line.CostCenter;
		 * 		 groupedLineItems[line.TaxCode].TaxCode = line.TaxCode;
		 * 		 groupedLineItems[line.TaxCode].TaxeRate = line.TaxRate;
		 * 		 groupedLineItems[line.TaxCode].TaxAmount += line.TaxAmount;
		 * 		 groupedLineItems[line.TaxCode].ProjectCode = line.ProjectCode;
		 * 	 });
		 *
		 * 	 invoiceData.tables.LineItems = [];
		 * 	 Sys.Helpers.Object.ForEach(groupedLineItems, function (groupedLineItem)
		 * 	 {
		 * 		 invoiceData.tables.LineItems.push(groupedLineItem);
		 * 	 });
		 * 	 }
		 * 	 return invoiceData;
		 * }
		 * </code></pre>
		 */
		CustomizeInvoiceData: function (invoiceData, additionalData)
		{
		},


		/**
		 * @description Allows you to retrieve the next document number based on a customized numbering sequence. This user exit is called in the validation script.
		 * @version 5.164 and higher
		 * @memberof Lib.Expense.Report.Customization.Server
		 * @function GetNumber
		 * @param {string} defaultSequenceName String value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
		 * @param {string} prefix prefix added by default
		 * @returns {string} String value containing the next number from your customized sequence.
		 * @example
		 * For example, when using the US01 and FR01 company codes with the above script, you could get the following numbering: US01-0001, US01-0002, US01-0003, FR01-0001, US01-0004, FR01-0002, etc.
		 * <pre><code>
		 *	GetNumber: function (defaultSequenceName, prefix)
		 *	{
		 *		var number = "";
		 *		var companyCode = Data.GetValue("CompanyCode__");
		 *		var ReqNumberSequence = Process.GetSequence(defaultSequenceName + companyCode);
		 *		number = ReqNumberSequence.GetNextValue();
		 *		if (number === "")
		 *		{
		 *			Log.Info("Error while retrieving a number");
		 *		}
		 *		else
		 *		{
		 *			number = companyCode + "-" + Sys.Helpers.String.PadLeft(number, "0", 4);
		 *			Log.Info("Number: " + number);
		 *		}
		 *		return number;
		 *	}
		 * </code></pre>
		 * 
		*/

		/*
		GetNumber: function (defaultSequenceName, prefix)
		{
			// Must return something
		},
		*/


		/**
		 * @description Allows you to retrieve the next document number based on a customized numbering sequence. This user exit is called in the validation script.
		 * @version 5.164 and higher
		 * @memberof Lib.Expense.Report.Customization.Server
		 * @function GetInvoiceNumber
		 * @param {string} defaultSequenceName String value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
		 * @param {string} prefix prefix added by default
		 * @returns {string} String value containing the next number from your customized sequence.
		 * @example
		 * For example, when using the US01 and FR01 company codes with the above script, you could get the following numbering: US01-0001, US01-0002, US01-0003, FR01-0001, US01-0004, FR01-0002, etc.
		 * <pre><code>
		 *	GetInvoiceNumber: function (defaultSequenceName, prefix)
		 *	{
		 *		var number = "";
		 *		var companyCode = Data.GetValue("CompanyCode__");
		 *		var ReqNumberSequence = Process.GetSequence(defaultSequenceName + companyCode);
		 *		number = ReqNumberSequence.GetNextValue();
		 *		if (number === "")
		 *		{
		 *			Log.Info("Error while retrieving a number");
		 *		}
		 *		else
		 *		{
		 *			number = companyCode + "-" + Sys.Helpers.String.PadLeft(number, "0", 4);
		 *			Log.Info("Number: " + number);
		 *		}
		 *		return number;
		 *	}
		 * </code></pre>
		 * 
		*/

		/*
		GetInvoiceNumber: function (defaultSequenceName, prefix)
		{
			// Must return something
		},
		*/


		/**
		 * @typedef {Object} OnExpenseReportSubmissionReturn Use the following object if you want to add a custom error message when preventing submission of the expense report:
		 * @property {bool} allowValidation: true to allow / false to refuse validation (mandatory)
		 * @property {string} title: Title of the popup dialog if validation refused (mandatory)
		 * @property {string} message: Message of the popup dialog if validation refused (mandatory)
		 * @property {boolean} isError: True if the dialog is an error dialog; false if it is a standard dialog (default is true)
		 * @memberof Lib.Expense.Report.Customization.Server
		 */
		/**
		 * @description Allows you to do additional checks when the user submits an expense report
		 * @version 5.195 and higher
		 * @memberof Lib.Expense.Report.Customization.Server
		 * @function OnExpenseReportSubmission
		 * @return {Lib.Expense.Report.Customization.Server.OnExpenseReportSubmissionReturn} json object to allow or prevent the submission of the expense report with a custom error message
		 * @example
		 * 
		 * <pre><code>
		 *	OnExpenseReportSubmission: function ()
		 *	{
		 *		var remainingUserBudget = getRemainingUserBudget();
		 *		var totalExpenseAmount = Data.GetValue("TotalAmount__");
		 *		if (totalExpenseAmount > remainingUserBudget)
		 *		{
		 *			Log.Error("Not enough budget: remaining budget is:" + remainingUserBudget);
		 *			// Prevent submission of the expense report
		 *			return {
		 *	 			"allowValidation": false,
		 *	 			"title": "Not enough budget",
		 *				"message": "Your remaining bugdet (" + remainingUserBudget +") is not enough for this expense report.",
		 *				"isError": false
		 *			};
		 *		}
		 *
		 *		// Allow validation
		 *		return {
		 *			"allowValidation": true
		 *		};
		 *	}
		 * </code></pre>
		 * 
		*/
		OnExpenseReportSubmission: function ()
		{
			return {
				"allowValidation": true
			};
		}
	};

	return customization;
});
