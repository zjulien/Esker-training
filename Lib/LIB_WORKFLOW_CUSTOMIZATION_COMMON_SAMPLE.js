/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.Workflow.Customization.Common library: P2P Workflow engine calls customization callbacks
 */

/**
 * P2P Workflow engine calls customization callbacks
 * @namespace Lib.Workflow.Customization.Common
 */

/* LIB_DEFINITION
{
	"name": "LIB_WORKFLOW_CUSTOMIZATION_COMMON",
	"libraryType": "LIB",
	"scriptType": "COMMON",
	"comment": "Custom library extending workflow",
	"versionable": false,
	"require": [ "Sys/Sys" ]
}
*/

// eslint-disable-next-line no-redeclare
var Lib;
Sys.ExtendLib(Lib, "Workflow.Customization.Common", function ()
{
	/**
	 * @lends Lib.Workflow.Customization.Common
	 */
	var customization = {

		/**
		* @description Allows you to customize the default procedure that is used in the Purchase to Pay application for computing the sequence of users in the workflows.
		* By default, a list of users is built for each cost center or G/L account, depending on the amount of the items related to this cost center or G/L account. In case of multiple cost centers or G/L accounts, the multiple lists of users are finally merged into one single workflow of users. Refer to Using tables to set up the validation workflow for an example.
		* Instead of the cost center or G/L account, you can implement this user exit to build your lists of users based on another field or combination of fields of your choice.
		*
		* 	 For example, you can build your workflow based on the combination of a cost center and a geographic location.
		*
		* This user exit is called both from the processing scripts and from the HTML page script, each time the list of users of the workflow is retrieved or updated. Refer to WorkflowEngine.GetStepsResult for more information.
		* @memberof Lib.Workflow.Customization.Common.AP
		* @param {string} type
		* String value identifying the workflow that is being retrieved. Possible values are:
		* - PR-approvers: The purchasing workflow in the Purchase Requisition process is being retrieved or updated in the HTML page script.
		* - PR-reviewers: The review purchasing workflow in the Purchase Requisition process is being retrieved or updated in the HTML page script.
		* - AP-controllers: The invoice review workflow (before the AP specialist posts the invoice) in the Vendor invoice process is being retrieved or updated in the HTML page script or in the extraction script.
		* - AP-approvers: The invoice payment approval workflow (after the AP specialist has posted the invoice) in the Vendor invoice process is being retrieved or updated in the HTML page script or in the extraction script.
		* @param {object} baseFieldsMapping
		* JavaScript object containing all the workflow fields that are common to the multiple lists of users, regardless of the procedure you implement.

		* For example, the WorkflowType__ field is always needed to compute a list of users. In case of multiple lists of users to be merged, the WorkflowType__ field value is the same for each list of users you want to compute.
		* <pre><code>
		*
		* var baseFieldsMapping =
		* {
		*	"values":
		*	{
		*		"WorkflowType__": "purchaseRequisitionApproval"
		*	}
		* };
		* </pre><code>
		* @param {object} mapping The whole mapping computed by the application.
		* You can modify this object and return it to implement customizations.
		* @return {object} The modified fieldsMapping. Return null to keep standard behavior.
		* @see {@link Lib.Custom.WorkflowDefinition} to customize the Workflow rules designer and workflow engine with new fields and stepTypes.
		*/
		OnBuildFieldsMapping: function (type, baseFieldsMapping, mapping)
		{
			return null;
		},

		/**
		* This function is called by the Purchase requisition validation script when an impact on the workflow taken place.
		* @return {boolean} result.
		*/
		OnWorkflowImpacted: function ()
		{
			Log.Info("OnWorkflowImpacted");
			return true;
		},

		/**
		* This function is called before building the workflow to allow you to override the merger used.
		*
		* @param {string} type
		* String value identifying the workflow for which to override the merger. Possible values are:
		* - PR-reviewers: The reviewer workflow in the Purchase Requisition process.
		* - PR-approvers: The purchasing workflow in the Purchase Requisition proces.
		*
		* @return {string}
		* - Name of the merger to use;
		* - null if you want to use the default merger defined for this workflow type (same as commenting this function);
		* @see {@link Lib.Custom.WorkflowDefinition} to customize the workflow engine with new mergers.
		*/
		OverrideMerger: function (type)
		{
			return null;
		},

		/**
		* Use this function to post the invoice and move forward in the workflow even if the ERP ack returned an error.
		* For example, if the ERP ack contains both an error and an invoice number, it could mean that the invoice should continue in EOD while
		* the error will be manually fixed in the ERP system.
		* The parameter erpError can be used to choose which errors should be blocking.
		* @memberof Lib.AP.Customization.Common
		* @param {string} erpError Error set by the ERP system.
		* @param {string} erpInvoiceNumber Invoice number set by the ERP system.
		* @returns {booelan} BypassERPError True if the invoice workflow should continue despite the error set by the ERP system.
		* @example
		* <pre><code>
		* BypassERPError: function(erpError, erpInvoiceNumber)
		* {
		* 	// If the ERP ack contains both an error and an invoice number, continue in the workflow.
		* 	return Boolean(erpError && erpInvoiceNumber);
		* },
		* </code></pre>
		*/
		BypassERPError: function (erpError, erpInvoiceNumber)
		{
			return false;
		},

		/**
		* Use this function to modify workflow parameters.
		* For instance, it can be used to map a new information in the workflow table
		* @memberof Lib.AP.Customization.Common
		* @param {any} WorkflowParameters Workflow parameters.
		* @param {function} getContributionData function to retrieve the current action contribution data.
		* @returns {any} WorkflowParameters: a new workflow parameters object (or part of it) to extend the default parameters.
		* @example
		* <pre><code>
		* ExtendWorkflowParameters: function(WorkflowParameters, getContributionData)
		* {
		*	WorkflowParameters.mappingTable.columns.Z_Exception__ =
		*	{
		*		data: "exception"
		*	};
		*	WorkflowParameters.actions.setasideautomatically = {
		*		OnDone: function (sequenceStep) {
		*					Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.SetAside);
		*					var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
		*					var contributionData = getContributionData(sequenceStep, this.actions.setAside.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
		*						action: "Set aside automatically",
		*						reason: Data.GetValue("AsideReason__"),
		*						onBehalfOf: true
		*					});
		*					Lib.AP.CommentHelper.UpdateHistory(Language.Translate("_Set aside history"), true);
		*					if (contributionData.role === Lib.AP.WorkflowCtrl.roles.apStart) {
		*						Lib.AP.WorkflowCtrl.workflowUI.Restart(contributionData);
		*					}
		*					else {
		*						Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep, contributionData);
		*					}
		*					Lib.AP.WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
		*					Process.PreventApproval();
		*				},
		*	return WorkflowParameters;
		* },
		* </code></pre>
		*/
		ExtendWorkflowParameters: function (WorkflowParameters, getContributionData)
		{

		},

		/**
		* Use this function to modify/add contributor data. Data are used to build and add the contributor to the Workflow table then.
		* Old role and action parameters can be retrieved from the contributor object (i.e.: contributor.role or contributor.action).
		* @memberof Lib.AP.Customization.Common
		* @param {any} contributor contributor data.
		* @param {any} user user data.
		* @returns {any} contributor contributor data extended with custom data.
		* @example
		* <pre><code>
		* ExtendContributor: function(contributor, user)
		* {
		*  // In case a new column has been added to track the exception the contributor has been added for
		*  var exception = Data.GetValue("CurrentException__") || '';
		*  contributor.exception = exception;
		*  return contributor;
		* },
		* </code></pre>
		*/
		ExtendContributor: function (contributor, user)
		{

		}
	};

	return customization;
});
