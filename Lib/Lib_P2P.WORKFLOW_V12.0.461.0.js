/* eslint-disable max-depth */
///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "LIB_P2P.Workflow_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_P2P",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Decimal",
    "Sys/Sys_WorkflowEngine",
    "Sys/Sys_WorkflowDefinition",
    "Lib_P2P.Base_V12.0.461.0"
  ]
}*/
/**
 * Common P2P functions
 * @namespace Lib.P2P
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        // Workflow definition cache
        var wfDefinition;
        /**
         * Build a multiple fields mapping according to the line items grouped by CostCenter
         * @memberof Lib.P2P
         * @param {Lib.P2P.MappingOptions} options The list of options
         *  exchangeRate: exchange rate (default is 1)
         *  lineItems: table object of line items
         *  costCenterColumnName: name of the Item CostCenter column
         *  amountColumnName: {string} name of the Item Amount column
         *  baseFieldsMapping: {object} common fields to extend with the generated mapping
         *  keepEmpty: {boolean} indicate if you want to keep the empty cost center line or not (default is false)
         *  emptyCheckFunction: {function} optional to check if a line should looked at or not
         */
        function BuildFieldsMapping(options) {
            // copy values on new object to keep original object free from added properties
            var optionsEx = {
                lineItems: options.lineItems,
                groupingName: options.groupingName,
                exchangeRate: options.exchangeRate || 1,
                amountColumnName: options.amountColumnName,
                baseFieldsMapping: options.baseFieldsMapping,
                keepEmpty: options.keepEmpty || false,
                emptyCheckFunction: options.emptyCheckFunction,
                fieldsDefinition: {
                    keyFieldName: "DimensionValue__",
                    computationFieldName: "WorkflowAmount__"
                },
                lineItemFieldsForWorkflow: options.lineItemFieldsForWorkflow
            };
            optionsEx.keyColumnName = options.costCenterKeyName;
            optionsEx.tableColumnName = options.costCenterColumnName;
            var fieldsCC = Lib.P2P.BuildFieldsMappingGeneric(optionsEx);
            optionsEx.keyColumnName = options.glKeyName;
            optionsEx.tableColumnName = options.glAccountColumnName;
            var fieldsGL = Lib.P2P.BuildFieldsMappingGeneric(optionsEx);
            return fieldsCC.concat(fieldsGL);
        }
        P2P.BuildFieldsMapping = BuildFieldsMapping;
        /**
         * Create a mapping on the keyColumnName and create a sum based on the amountColumnName
         * @memberof Lib.P2P
         * @param {Lib.P2P.MappingOptions} options The list of options for the mapping generation
         */
        function BuildFieldsMappingGeneric(options) {
            var amountForKey = {}, lineValuesForKey = {}, uniqueKeys = [], fieldsMapping = [];
            var i, line, amount;
            if (options.lineItems) {
                for (i = 0; i < options.lineItems.GetItemCount(); i++) {
                    var keyValue = {};
                    line = options.lineItems.GetItem(i);
                    if (line && (typeof options.emptyCheckFunction !== "function" || !options.emptyCheckFunction(line))) {
                        keyValue.value = line.GetValue(options.keyColumnName) || "";
                        amount = new Sys.Decimal(line.GetValue(options.amountColumnName) || 0).mul(line.GetValue(options.exchangeRate) || (Sys.Helpers.IsNumeric(options.exchangeRate) ? options.exchangeRate : 1)).toNumber();
                        if (line.GetValue("CompanyCode__")) {
                            keyValue.companyCode = line.GetValue("CompanyCode__");
                        }
                        else {
                            keyValue.companyCode = Data.GetValue("CompanyCode__");
                        }
                        keyValue.hashkey = keyValue.value + keyValue.companyCode;
                        if (options.keepEmpty || keyValue.value) {
                            if (!(keyValue.hashkey in amountForKey)) {
                                amountForKey[keyValue.hashkey] = amount;
                                uniqueKeys.push(keyValue);
                            }
                            else {
                                amountForKey[keyValue.hashkey] = new Sys.Decimal(amountForKey[keyValue.hashkey]).add(amount).toNumber();
                            }
                        }
                        var extraLineItemFieldsForWorkflow = options.lineItemFieldsForWorkflow || {};
                        // Add line values but as array as we are grouped
                        for (var f in extraLineItemFieldsForWorkflow) {
                            // Check this is an flx field not any standard object property
                            if (f.lastIndexOf("__", f.length) === (f.length - 2)) {
                                var fieldName = f.substr(f.lastIndexOf("-", f.length) + 1);
                                if (!lineValuesForKey[keyValue.hashkey]) {
                                    lineValuesForKey[keyValue.hashkey] = {};
                                }
                                if (!lineValuesForKey[keyValue.hashkey][f]) {
                                    lineValuesForKey[keyValue.hashkey][f] = [];
                                }
                                lineValuesForKey[keyValue.hashkey][f].push(line.GetValue(fieldName));
                            }
                        }
                    }
                }
            }
            // Here we iterate on uniqueKeys array because the order of keys isn't garanteed in a js obect with numerical keys.
            Sys.Helpers.Array.ForEach(uniqueKeys, function (key) {
                var result = {
                    "values": {
                        CompanyCode__: null,
                        DimensionColumnInCT__: null,
                        DimensionValue__: null
                    }
                };
                Sys.Helpers.Extend(result.values, lineValuesForKey[key.hashkey]);
                if (key.companyCode) {
                    result.values.CompanyCode__ = key.companyCode;
                }
                else {
                    delete result.values.CompanyCode__;
                }
                result.values.DimensionColumnInCT__ = options.tableColumnName;
                result.values.DimensionValue__ = key.value;
                result.values[options.fieldsDefinition.computationFieldName] = amountForKey[key.hashkey];
                fieldsMapping.push(Sys.Helpers.Extend(true, result, options.baseFieldsMapping));
            });
            return fieldsMapping;
        }
        P2P.BuildFieldsMappingGeneric = BuildFieldsMappingGeneric;
        /**
         * Build a multiple fields mapping according to the line items grouped by PO number
         * @memberof Lib.P2P
         * @param {object} options The list of options
         *  lineItems: table object of line items
         *  poNumberColumnName: name of the Item CostCenter column
         *  baseFieldsMapping: {object} common fields to extend with the generated mapping
         *  emptyCheckFunction: {function} optional to check if a line should looked at or not
         */
        function BuildFieldsMappingByPONumber(options) {
            var poNumbers = [], fieldsMapping = [];
            var i, line;
            for (i = 0; i < options.lineItems.GetItemCount(); i++) {
                line = options.lineItems.GetItem(i);
                if (typeof options.emptyCheckFunction !== "function" || !options.emptyCheckFunction(line)) {
                    var poNumber = line.GetValue(options.poNumberColumnName) || "";
                    if (poNumbers.indexOf(poNumber) === -1) {
                        poNumbers.push(poNumber);
                    }
                }
            }
            // Here we iterate on poNumbers array because the order of po number isn't garanteed in a js obect with numerical keys.
            Sys.Helpers.Array.ForEach(poNumbers, function (poNumber) {
                fieldsMapping.push(Sys.Helpers.Extend(true, {
                    "values": {
                        "PONumber__": poNumber
                    }
                }, options.baseFieldsMapping));
            });
            return fieldsMapping;
        }
        P2P.BuildFieldsMappingByPONumber = BuildFieldsMappingByPONumber;
        /**
         * Build a multiple fields mapping according to the lines of a table
         * @memberof Lib.P2P
         * @param {object} options The list of options
         *  table {object} table object containing the data
         *  columns {Array} name of the columns to map on the field mapping
         *  baseFieldsMapping: {object} common fields to extend with the generated mapping
         *  emptyCheckFunction: {function} optional to check if a line should looked at or not
         */
        function BuildFieldsMappingFromLineItems(_options) {
            var options = {
                lineItems: _options.lineItems,
                columns: _options.columns,
                baseFieldsMapping: _options.baseFieldsMapping,
                emptyCheckFunction: _options.emptyCheckFunction
            };
            var fieldsMapping = [];
            var tableIndex, columnIndex, line;
            for (tableIndex = 0; tableIndex < options.lineItems.GetItemCount(); tableIndex++) {
                line = options.lineItems.GetItem(tableIndex);
                if (typeof options.emptyCheckFunction !== "function" || !options.emptyCheckFunction(line)) {
                    // Add specified columns to mapping object
                    var values = {};
                    for (columnIndex = 0; columnIndex < options.columns.length; columnIndex++) {
                        var columnName = void 0, valuePropertyName = void 0;
                        if (typeof options.columns[columnIndex] === "string") {
                            columnName = options.columns[columnIndex];
                            valuePropertyName = options.columns[columnIndex];
                        }
                        else {
                            columnName = options.columns[columnIndex][0];
                            valuePropertyName = options.columns[columnIndex][1];
                        }
                        if (typeof line.IsNullOrEmpty === "undefined" || !line.IsNullOrEmpty(columnName)) {
                            values[valuePropertyName] = line.GetValue(columnName);
                        }
                        else {
                            values[valuePropertyName] = null;
                        }
                    }
                    fieldsMapping.push(Sys.Helpers.Extend(true, {
                        "values": values
                    }, options.baseFieldsMapping));
                }
            }
            return fieldsMapping;
        }
        P2P.BuildFieldsMappingFromLineItems = BuildFieldsMappingFromLineItems;
        /**
         * Get the approval workflow using the workflow engine
         * @memberof Lib.P2P
         * @param {object} options The list of options
         *  fields: object passed to workflow engine
         *  allowNoCCOwner: tells if the absence of ccowner do not raises an error
         *  success: success callback. The parameter of the callback is an array of approvers:
         *	[
         *		{login,displayName,emailAddress},
         *		{login,displayName,emailAddress},
         *		...
         *	]
         * error: error callback. The parameter of the callback is a string containing an error message
         */
        function GetApprovalWorkflow(options, layoutHelper) {
            if (layoutHelper) {
                layoutHelper.DisableButtons(true, "GetApprovalWorkflow");
            }
            var getStepsOptions = {
                "debug": false,
                "definition": wfDefinition,
                "noRuleAppliedAction": options.noRuleAppliedAction,
                "fields": options.fields,
                "disableErrorIfNoRuleApplied": options.disableErrorIfNoRuleApplied,
                "nbRulesToApply": options.nbRulesToApply,
                success: function (approvers, ruleApplied, noMergedApprovers) {
                    Log.Info("Approval Workflow, rule applied: " + ruleApplied);
                    Lib.P2P.CompleteUsersInformations(approvers, ["displayname", "emailaddress"], function (users) {
                        if (layoutHelper) {
                            layoutHelper.DisableButtons(false, "GetApprovalWorkflow");
                        }
                        options.success(users, ruleApplied, noMergedApprovers);
                    });
                },
                error: function (errorMessage, ruleApplied) {
                    if (layoutHelper) {
                        layoutHelper.DisableButtons(false, "GetApprovalWorkflow");
                    }
                    options.error(errorMessage, ruleApplied);
                },
                "merger": null,
                forceMerger: !!options.forceMerger
            };
            if (options.merger) {
                getStepsOptions.merger = options.merger;
            }
            if (!wfDefinition) {
                Sys.WorkflowDefinition.Extend({
                    customs: options.allowNoCCOwner ? [
                        {
                            "stepTypes": {
                                "costCenterOwner": {
                                    "noResult": "stop",
                                    "allowEmptyCostCenter": true,
                                    "companyCodeIsOptional": options.companyCodeIsOptional
                                },
                                "dimensionManager": {
                                    "noResult": "stop",
                                    "allowEmptyDimension": true,
                                    "companyCodeIsOptional": options.companyCodeIsOptional
                                }
                            }
                        }
                    ] : [],
                    success: function (definition) {
                        Log.Info("WorkflowDefinition loaded");
                        wfDefinition = definition;
                        getStepsOptions.definition = wfDefinition;
                        Sys.WorkflowEngine.GetStepsResult(getStepsOptions);
                    },
                    error: function (errorMessage) {
                        Log.Error("failed to load WorkflowDefinition: " + errorMessage);
                        options.error("Failed to load workflow definition: " + errorMessage);
                    }
                });
            }
            else {
                Sys.WorkflowEngine.GetStepsResult(getStepsOptions);
            }
        }
        P2P.GetApprovalWorkflow = GetApprovalWorkflow;
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
