/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_ARCHIVING",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Validation Script AP customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.Archiving library: AP archive customization callbacks
 */

/**
 * Package AP archive customization callbacks.
 * Used in the 'Vendor Invoice Legal Archive' process.
 * @namespace Lib.AP.Customization.Archiving
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.Archiving
	 */
	parentLib.Archiving =
	{
		/**
		* Allows you to send additional applicative meta data to Arkhinéo depending on the customer's contract. This function is called before the Vendor invoice legal archive process.
		* When creating an Arkhinéo account, the customer receives a document called Declaration of Meta Data (Déclaration des Méta Données in French). This document contains the list of required applicative and descriptive meta data. The required meta data may be different depending on customers.
		* ATTENTION: Ensure that you have access to the customer's Declaration of Meta Data before using the GetArkhineoMetaDataApplicative user exit.
		* @memberof Lib.AP.Customization.Archiving
		* @param {object} applicativeMetadata The default metadata that will be send to Arkhineo
		* @return {object} An object containing the applicative metadata to send to Arkhineo
		* @example
		* <pre><code>
		* GetArkhineoMetaDataApplicative: function (applicativeMetadata)
		* {
		*	applicativeMetadata.to = "Arkhineo archive system";
		*	applicativeMetadata.from = "Esker";
		*	applicativeMetadata.ds-metadata.USR = "AP";
		* 	return applicativeMetadata;
		* }
		* </code></pre>
		*/
		GetArkhineoMetaDataApplicative: function (applicativeMetadata)
		{
		},

		/**
		* Allows you to send the required descriptive meta data to Arkhinéo depending on the customer's contract. This function is called before the Vendor invoice legal archive process.
		* When creating an Arkhinéo account, the customer receives a document called Declaration of Meta Data (Déclaration des Méta Données in French). This document contains the list of the required applicative and descriptive meta data. The required meta data is different depending on customers.
		* ATTENTION: Ensure that you have access to the customer's Declaration of Meta Data before using the GetArkhineoMetaDataDescriptive user exit.
		* @memberof Lib.AP.Customization.Archiving
		* @return {object} An object containing the descriptive metadata to send to Arkhineo
		* @example
		* <pre><code>
		* GetArkhineoMetaDataDescriptive: function ()
		* {
		* 	var metadata = {
		*		"title": "Invoice",
		*		"identifier": Data.GetValue("MSNEX")
		*	}
		* 	return metadata;
		* }
		* </code></pre>
		*/
		GetArkhineoMetaDataDescriptive: function ()
		{
		}
	};
})(Lib.AP.Customization);
