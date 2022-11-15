/* LIB_DEFINITION{
  "name": "LIB_CUSTOM_WORKFLOWDEFINITION",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Custom library extending workflow definition",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.Custom.WorkflowDefinition library: Workflow rules customizations
 */

/**
 * Workflow rules customizations
 * @namespace Lib.Custom.WorkflowDefinition
 * @see {@link Lib.Workflow.Customization.Common} to customize the data sent to the workflow engine from the P2P application.
*/

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.Custom = Lib.Custom || {};
Lib.Custom.WorkflowDefinition = (function ()
{
	/**
	 * WorkflowDefinition custom extension
	 * @typedef {object} Lib.Custom.WorkflowDefinition.definition
	 * @property {object} fields - List of custom fields to add in the workflow rules designer and to use in the workflow engine.
	 * @property {object} properties - List of custom objects allowing to browse table to browse fields values.
	 * @property {object} stepTypes - List of custom step types to add in the workflow rules designer and to use in the workflow engine.
	 * @see {@link Lib.Workflow.Customization.Common} to customize the data sent to the workflow engine from the P2P application.
	 */
	var definition =
	{
		"fields":
			{},
		"properties":
			{},
		"stepTypes":
			{}
	};
	return {
		/**
		 * Called by the Workflow rules designer and Workflow Engine to extend the default WorkflowDefinition
		 * @memberof Lib.Custom.WorkflowDefinition
		 * @return {Lib.Custom.WorkflowDefinition.definition} The custom WorkflowDefinition extension for the Workflow rules designer and Workflow engine.
		 */
		GetJSON: function ()
		{
			return definition;
		}
	};
})();
