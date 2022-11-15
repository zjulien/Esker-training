///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Transaction_Customization_Server",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Expense Transaction customization Server",
  "versionable": false,
  "require": [
    "Lib_Expense_Transaction_Parser_V12.0.461.0"
  ]
}*/

/**
 * Transaction parser objects
 * @namespace Lib.Expense.Transaction.Parser
 */

/**
 * Check is current parser can parse bank transaction file
 * @name IsCompatible
 * @function
 * @param {number} indexOfFile Index of file to parse
 * @return {boolean} True if parser can parse this file, false otherwhise
*/

/**
 * Should add lines to table "LineTransaction__"
 * Available fields are :
 *  - "TransactionID__"
 *  - "BilledAmount__"
 *  - "ISOBilledCurrencyCode__"
 *  - "LocalAmount__"
 *  - "CurrencyExchangeRate__"
 *  - "ISOLocalCurrencyCode__"
 *  - "ExpenseDescription__"
 *  - "MerchantCategory__"
 * @name RunParsing
 * @function
 * @param {number} indexOfFile Index of file to parse
 * @return {boolean} true if parsing succeeded
*/

/**
 * Parameter description for the function Lib.Expense.Transaction.Customization.Server
 * @typedef {Type} Lib.Expense.Transaction.Parser.IParser
 * @type {object}
 * @property {IsCompatible} IsCompatible Checks that file can be parsed (i.e. header line, line length, etc.)
 * @property {RunParsing} RunParsing Parse and extract transaction lines only
 * @memberof Lib.Expense.Transaction.Parser
*/

/**
 * Expense transaction server script customization callbacks
 * @namespace Lib.Expense.Transaction.Customization.Server
 */

var Lib;
Sys.ExtendLib(Lib, "Expense.Transaction.Customization.Server", function ()
{
	/**
	 * @lends Lib.Expense.Transaction.Customization.Server
	 */
	var customization =
	{
		/**
		 * Allows to add custom parsers (GL1025 ASCII is already supported) for bank transaction files.
		 * @returns customParsers {Lib.Expense.Transaction.Parser.IParser[]} Array of custom parsers for bank transaction files
		 * @example
		 * <pre><code>
		 * var customization =
		 * {
		* 	GetParsers: function ()
		 * 	{
		 * 		return [
		 * 			{
		 * 				IsCompatible: function(indexOfFileToParse)
		 * 				{
		 *					let content = Attach.GetContentByLine(indexOfFile);
		 *					let compatible = content.length >= 34 && content.substr(27, 6) === "GL1025";
		 *					Attach.ResetGetContentByBlock(0);
		 *					return compatible;
		 * 				},
		 * 				RunParsing: function(indexOfFileToParse)
		 * 				{
		 * 					let contentLine = Attach.GetContentByLine(indexOfFile);
		 *					while (contentLine !== "")
		*					{
		 *						itemOrData = Data.GetTable("LineTransaction__").AddItem();
		 *						itemOrData.SetValue("TransactionDate__","value to extract from line");
		 *						itemOrData.SetValue("TransactionID__","value to extract from line");
		 *						itemOrData.SetValue("BilledAmount__","value to extract from line");
		 *						itemOrData.SetValue("ISOBilledCurrencyCode__","value to extract from line");
		 *						itemOrData.SetValue("LocalAmount__","value to extract from line");
		 *						itemOrData.SetValue("CurrencyExchangeRate__","value to extract from line");
		 *						itemOrData.SetValue("ISOLocalCurrencyCode__","value to extract from line");
		 *						itemOrData.SetValue("ExpenseDescription__","value to extract from line");
		 *						itemOrData.SetValue("MerchantCategory__","value to extract from line");
		*						contentLine = Attach.GetContentByLine(indexOfFile);
		 *					}
		 * 					return true;
		 * 				}
		 * 			}
		 * 		];
		 * 	}
		 * }
		 * </code></pre>
		*/
		GetParsers: function ()
		{
			var customParsers;

			return customParsers;
		},
		/**
		 * Allows to customize whether expense are automatically created when a bank transaction is parsed.
		 * @returns {boolean} If true, new expenses will be automatically created when transaction parser is approved
		 * @example
		 * <pre><code>
		 * var customization =
		 * {
		 * 	getAutoCreateExpenses: function ()
		 * 	{
		 * 		return true;
		 * 	}
		 * }
		 * </code></pre>
		*/
		getAutoCreateExpenses: function ()
		{
			return false;
		}
	};
	return customization;
});
