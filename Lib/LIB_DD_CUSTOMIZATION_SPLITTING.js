/* LIB_DEFINITION
{
	"name": "LIB_DD_CUSTOMIZATION_SPLITTING",
	"libraryType": "LIB",
	"scriptType": "SERVER",
	"comment": "all splitting customization functions",
	"require": [ "Lib_DD_Splitting" ]
}
*/

/**
 * SenderForm splitting customization functions
 * @namespace Lib.DD.Customization.Splitting
 */

///#GLOBALS Lib
var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.Splitting = (function ()
{
	/**
	 * @lends Lib.DD.Customization.Splitting
	 */
	var Splitting =
	{
		/**
		 * @documented
		 * Uncomment this function to replace the splitting workflow by your own that you write below
		 * @example
		 * <pre><code>
		 * ComputeSplittingRanges: function () {
		 *		// Add a document on the pages 1, 2 and 3 of the batch
		 *		Lib.DD.Splitting.AddSplitParameter(1, 3);
		 *		// Add another document on the pages 5 and 6 of the batch
		 *		Lib.DD.Splitting.AddSplitParameter(5, 6);
		 * }
		 * </code></pre>
		 */
		/*ComputeSplittingRanges: function () {
			// Add a document on the pages 1, 2 and 3 of the batch
			Lib.DD.Splitting.AddSplitParameter(1, 3);
			// Add another document on the pages 5 and 6 of the batch
			Lib.DD.Splitting.AddSplitParameter(5, 6);
		},*/

		/**
		 * This function is called for each SenderForm process created
		 * @param {string} supiProcess The SenderForm xTransport object
		 * @param {object} context The context that contains 2 properties:
		 * - splits: array of splits objects, each one contains 2 properties: startPage and endPage.
		 * - currentSplitIndex: the index of the current split in the spliuts array.
		 */
		FinalizeSenderFormProcess: function (supiProcess, context)
		{

		}

	};

	return Splitting;

})();
