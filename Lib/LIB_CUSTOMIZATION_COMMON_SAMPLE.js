/* LIB_DEFINITION{
  "name": "LIB_CUSTOMIZATION_COMMON",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Custom library extending common script",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.Customization.Common library: common scripts customization callbacks
 */

/**
 * Package common scripts customization callbacks
 * @namespace Lib.Customization.Common
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.Customization = Lib.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.Customization.Common
	 */
	parentLib.Common =
	{
		/**
		 * Specifics customization for bank account check
		 * @namespace Lib.Customization.Common.BankAccount
		 * @memberof Lib.Customization.Common
		 */
		BankAccount:
		{
			/**
			 * Use this function to add or override specific iban format(s).
			 * An iban specification is represented by:
			 * - country is the country code for which the specification applies.
			 * - length is the total length of the IBAN for the specified country.
			 * - validationRegExp is a regular expression used to validate the IBAN format for the specified country.
			 *   The first four caracters of the IBAN (ex: FR76) are ignored during validation, so they must not be part of the regular expression.
			 * - idxBankIdentifiers is an array of indices to specify which element of the resulting array generated by validationRegExp corresponds to this list:
			 *   [ 'bank code', 'branch code', 'account number', 'national check digits' ]
			 *   Use index=-1 when an element of the list has not to be specified. The parameter idxBankIdentifiers is optional and the default value is [-1, -1, -1, -1].
			 * Note that the IBAN integrity is also checked as described in ISO 13616 and ISO 7064
			 * @return {array} list of iban custom specification
			 * @example
			 * <pre><code>
			 * CustomIbanFormat: function()
			 * {
			 *	 var customSpecificationList = [];
			 *   var customSpecification = {
			 * 		country: "FR",
			 * 		length: 27,
			 * 		validationRegExp: "([0-9]{5})([0-9]{5})([0-9A-Za-z]{11})([0-9]{2})",
			 * 		idxBankIdentifiers: [1, 2, 3, 4]
			 * 	 };
			 * 	 customSpecificationList.push(customSpecification);
			 * 	 return customSpecificationList;
			 * }
			 * </code></pre>
			 */
			CustomIbanFormat: function ()
			{

			}
		}
	};
})(Lib.Customization);
