/* LIB_DEFINITION{
  "name": "Lib_Purchasing_WorkflowDefinition",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "versionable": false,
  "require": [
    "Sys/Sys_P2P_WorkflowDefinition",
    "Sys/Sys_PAC_WorkflowDefinition",
    "Sys/Sys_Helpers",
    "Lib_Purchasing_Items.Config_V12.0.461.0"
  ]
}*/
///#GLOBALS Lib Sys
var Lib;
Sys.ExtendLib(Lib, "Purchasing.WorkflowDefinition", function ()
{
	return {
		AddJSONTo: function (definitions)
		{
			definitions.push(Sys.P2P.WorkflowDefinition.GetJSON(4));
			var pacWf = Sys.PAC.WorkflowDefinition.GetJSON(2);

			Sys.Helpers.Extend(pacWf.fields, Lib.Purchasing.WorkflowDefinition.GetLineItemFieldsForWorkflow());

			definitions.push(pacWf);
		},

		GetLineItemFieldsForWorkflow: function ()
		{
			function getTypeFromMapping(itemId)
			{
				var itemType = Lib.Purchasing.Items.PRItemsDBInfo.fieldsMap[itemId] || "generic";
				switch (itemType)
				{
					case "int": /* Fall through to double */
					case "double": return "decimal";
					case "date": return "generic";
					case "bool": return "boolean";
					default: return "generic";// Or string?
				}
			}

			var fields = {};
			for (var f in Lib.Purchasing.Items.PRItemsSynchronizeConfig.mappings.byLine)
			{
				if (typeof Lib.Purchasing.Items.PRItemsSynchronizeConfig.mappings.byLine[f] === "object" && Lib.Purchasing.Items.PRItemsSynchronizeConfig.mappings.byLine[f].availableOnWorkflowRule)
				{
					var newField = {
						"availableFromVersion": 3,
						"filter": [{ "field": "WorkflowType__", "operator": "===", "value": ["\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\""] }],
						"type": getTypeFromMapping(f)
					};
					var workflowNiceName = Lib.Purchasing.Items.PRItemsSynchronizeConfig.mappings.byLine[f].workflowNiceName;
					if (!Sys.Helpers.IsEmpty(workflowNiceName))
					{
						newField.niceName = workflowNiceName;
					}
					fields["PRV2-" + Lib.Purchasing.Items.PRItemsSynchronizeConfig.formTable + "-" + Lib.Purchasing.Items.PRItemsSynchronizeConfig.mappings.byLine[f].name] = newField;
				}
			}
			return fields;
		}
	};
});
