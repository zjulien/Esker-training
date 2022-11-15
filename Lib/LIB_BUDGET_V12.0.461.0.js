///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Budget_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Budget library",
  "require": [
    "Lib_V12.0.461.0",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Parameters",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "[Lib_Budget_Customization_Common]"
  ]
}*/
/**
 * Budget columns:
 *  ## Budget identification ##
 *        - BudgetID__: unique ID of the budget.
 *
 *      > following columns compose the unique budget key
 *        - CompanyCode__: company code.
 *        - PeriodCode__: fiscal period of the budget. This field is joined with the 'P2P - Accounting period'.
 *        - [...]: every assignment specific to the customer
 *
 *  ## Budget amount columns ##
 *    - Budget__: total allocated budget amount.
 *
 *      > following columns reflects every steps of the budget (see Steps enumeration and Impact object)
 *    - ToApprove__: budget amount of the items being approved
 *    - Committed__: budget amount of the items approved
 *    - Ordered__: budget amount of the items ordered
 *    - Received__: budget amount of the items received
 *    - InvoicedPO__: budget amount of the items invoiced (with order)
 *    - InvoicedNonPO__: budget amount of the items invoiced (without order)
 */
var Lib;
(function (Lib) {
    var Budget;
    (function (Budget) {
        // STD Globals Object
        var g = Sys.Helpers.Globals;
        /**
         * Every budget intrisic columns.
         * see description above.
         */
        var IntrinsicBudgetColumns = [
            "BudgetID__",
            "CompanyCode__",
            "PeriodCode__",
            "PeriodCode__.PeriodStart__",
            "PeriodCode__.PeriodEnd__",
            "Budget__",
            "ToApprove__",
            "Committed__",
            "Ordered__",
            "Received__",
            "InvoicedPO__",
            "InvoicedNonPO__",
            "Closed__"
        ];
        /**
         * Every budget operation details intrisic columns.
         * see description above.
         */
        var IntrinsicBudgetOperationDetailsColumns = [
            "OperationRuidex__",
            "OperationID__",
            "SourceType__",
            "SourceTypeName__",
            "BudgetID__",
            "CompanyCode__",
            "PeriodCode__",
            "ToApprove__",
            "Committed__",
            "Ordered__",
            "Received__",
            "InvoicedPO__",
            "InvoicedNonPO__"
        ];
        /**
         * Every step of budget.
         * see description above.
         */
        Budget.Steps = [
            "ToApprove__",
            "Committed__",
            "Ordered__",
            "Received__",
            "InvoicedPO__",
            "InvoicedNonPO__"
        ];
        function OnConfigurationChange() {
            Variable.SetValueAsString("IsBudgetEnable", "");
        }
        Budget.OnConfigurationChange = OnConfigurationChange;
        /**
         * Indicates if the budget is supported or not.
         * Serialize the value on record.
         * @returns {boolean} true if enabled, false otherwise.
         */
        function IsEnabled() {
            var enabled = Variable.GetValueAsString("IsBudgetEnable");
            if ((!enabled && enabled !== "false") || enabled.length === 0) {
                enabled = !Sys.Parameters.GetInstance("PAC").GetParameter("DisableBudget");
                if (enabled && g.Process.GetProcessID) {
                    var processID = g.Process.GetProcessID("PurchasingBudget__");
                    enabled = true === (processID && processID.length > 0);
                }
                Variable.SetValueAsString("IsBudgetEnable", enabled.toString());
            }
            enabled = (enabled === "true") || (enabled === true);
            return enabled;
        }
        Budget.IsEnabled = IsEnabled;
        function IsDisabled() {
            return !IsEnabled();
        }
        Budget.IsDisabled = IsDisabled;
        function ComputeBudgetRemaining(budget) {
            var remaining = 0;
            // This value may be undefined if the budget has been deleted
            if (!Sys.Helpers.IsEmpty(budget.Budget__)) {
                // Compute remaining amount
                remaining = budget.Budget__;
                // subtracts budget amount retrieved from database
                Budget.Steps.forEach(function (step) {
                    remaining = new Sys.Decimal(remaining).minus(budget[step] || 0).toNumber();
                });
                // subtracts the impact on step (according to previous one if any)
                var impact_1 = new Impact(budget.Impact);
                if (budget.PreviousImpact) {
                    impact_1.Sub(budget.PreviousImpact);
                }
                Budget.Steps.forEach(function (step) {
                    remaining = new Sys.Decimal(remaining).minus(impact_1[step] || 0).toNumber();
                });
            }
            return remaining;
        }
        Budget.ComputeBudgetRemaining = ComputeBudgetRemaining;
        /**
         * Computed object impacting budget columns according to the items states.
         * We dynamically add every step as member of instance of Impact.
         */
        var Impact = /** @class */ (function () {
            function Impact(initObject) {
                initObject = initObject || {};
                Budget.Steps.forEach(function (v) {
                    this[v] = parseFloat(initObject[v] || "0");
                }, this);
            }
            /**
             * Indicates if the instance impacts a budget.
             * @returns {boolean} true if at least one step of budget is impacted
             */
            Impact.prototype.HasImpact = function () {
                for (var i = 0; i < Budget.Steps.length; i++) {
                    if (this[Budget.Steps[i]] !== 0) {
                        return true;
                    }
                }
                return false;
            };
            /**
             * @callback forEachCallback
             * @param {string} name of step
             * @param {number} amount of step
             */
            /**
             * Iterates on each step amount.
             * @param {forEachCallback} callback
             */
            Impact.prototype.ForEachStep = function (callback) {
                Budget.Steps.forEach(function (step) {
                    callback(step, this[step]);
                }, this);
            };
            /**
             * Adds every amounts of this instance to the specified impact amounts
             * @param {object} impact to add
             * @returns {object} returns instance of impact
             */
            Impact.prototype.Add = function (impact) {
                Budget.Steps.forEach(function (step) {
                    this[step] = new Sys.Decimal(impact[step]).add(this[step]).toNumber();
                }, this);
                return this;
            };
            /**
             * Subtracts every amounts of this instance from the specified impact amounts
             * @param {object} impact to add
             * @returns {object} returns instance of impact
             */
            Impact.prototype.Sub = function (impact) {
                Budget.Steps.forEach(function (step) {
                    this[step] = new Sys.Decimal(this[step]).minus(impact[step]).toNumber();
                }, this);
                return this;
            };
            /**
             * Overrides the default toString method.
             * @returns {string} content dump of the instance
             */
            Impact.prototype.toString = function () {
                var self = this;
                return Budget.Steps.reduce(function (r, v) {
                    return r + v + "=" + self[v] + " ";
                }, "");
            };
            /**
             * Determine if the combination of the both impacts has impact or not.
             * @param {object} impact current impact on budget
             * @param {object} previousImpact previous impact on budget
             * @returns {boolean}
             */
            Impact.HasFinalImpact = function (impact, previousImpact) {
                var ret = Impact.GetFinalImpact(impact, previousImpact).HasImpact();
                Log.Info("HasFinalImpact: " + ret);
                return ret;
            };
            /**
             * Returns the final impact resulting of the combination of the both impacts.
             * @param {object} impact current impact on budget
             * @param {object} previousImpact previous impact on budget
             * @returns {object} final impact
             */
            Impact.GetFinalImpact = function (impact, previousImpact) {
                // impact && !previousImpact -> first impact on this budget
                // !impact && previousImpact -> already impacted this budget (budgetId changed --> should remove the previous impact)
                // !impact && !previousImpact -> no impact
                impact = impact || new Impact();
                previousImpact = previousImpact || new Impact();
                Log.Info("GetFinalImpact: impact:" + impact.toString());
                Log.Info("GetFinalImpact: previousImpact:" + previousImpact.toString());
                return (new Impact(impact)).Sub(previousImpact); // Create new instance of impact to avoid to modify the original
            };
            return Impact;
        }());
        Budget.Impact = Impact;
        /**
         * Object storing Impacts for different budgets:
         * Impacts: {
         * 		budgetID: <string>,
         *		impact: <Impact>
         * }
         */
        var MultiImpact = /** @class */ (function () {
            function MultiImpact(initArray) {
                this.Impacts = [];
                initArray = initArray || [];
                this.Impacts = initArray;
            }
            return MultiImpact;
        }());
        Budget.MultiImpact = MultiImpact;
        /**
         * Global configuration object:
         *    {
         * 		// function returning the array of budget columns composing the unique budget key ([ <string>, ... ])
         * 		// mandatory columns: CompanyCode__, PeriodCode__
         * 		GetBudgetKeyColumns: <function>,
         *
         * 		// specific configuration for each document (called sourceType config) impacting budget
         * 		sourceTypes: {
         * 			// id of sourceType (ex. 10, 20, ...)
         * 			<string>: {
         * 				// function used to check the source type of the specified document
         * 				// @param {object} [document] document on which we get budget. By default the current document.
         * 				// @returns {boolean} true if current or specified document is supported by this source type config.
         * 				CheckSourceType: <function>,
         *
         * 				// function used to check if the line item is empty or not
         * 				// @param {object} item iterable item of the form table
         * 				// @returns {boolean} true if the item is considered empty by the source type config.
         * 				IsEmptyItem: <function>,
         *
         * 				// function called when computing Budget impact according to the document on each item
         * 				// Must returns :
         * 				// 	- an instance of Impact object
         * 				//  - null when the item musn't impact budget
         * 				//  - undefined when the
         * 				PrepareImpact: <function>,
         *
         * 				// name of form table containing items
         * 				formTable: "LineItems__",
         *
         * 				// mapping between budget columns and form fields (header and table)
         * 				// mandatory mappings with columns: BudgetID__, CompanyCode__, PeriodCode__, OperationID__ (only on the header)
         * 				mappings: {
         * 					common: {
         *	 					<string>: <string>,
         * 						...
         * 					},
         * 					byLine: {
         *	 					<string>: <string>,
         * 						...
         * 					}
         * 				}
         * 			},
         * 			...
         * 		}
         * 	}
         */
        var configuration = {
            sourceTypes: {}
        };
        Budget.Configuration = configuration;
        /**
         * Configure the budget library. Can be called several times.
         * The final configuration object is extended at each call.
         * @param {object} partialConfig part of configuration to extend to the general configuration.
         * @returns {object} the current configuration after extending it
         */
        function ExtendConfiguration(partialConfig) {
            return Sys.Helpers.Extend(true, configuration, partialConfig);
        }
        Budget.ExtendConfiguration = ExtendConfiguration;
        /**
         * Retrieve the value of any builtin field on the current or specified document.
         * @param {object} document transport record. By default we check the current document.
         * @param {string} name name of field
         * @returns {string} value
         */
        function GetBuiltinDocumentValue(document, name) {
            var value;
            // current document
            if (Sys.Helpers.IsUndefined(document)) {
                value = Data.GetValue(name);
            }
            // other document
            else {
                var vars = document.GetUninheritedVars();
                value = vars.GetValue_String(name, 0);
            }
            return value;
        }
        Budget.GetBuiltinDocumentValue = GetBuiltinDocumentValue;
        /**
         * Determine the source type configuration of the current or specified document.
         * This method is based on the general configuration by calling CheckSourceType for each sourceType.
         * @param {object} document transport record on which we determine source type. By default we check
         *    the current document.
         * @param {boolean} [useCache] indicates if we use cache or not. By default we use the previous determined
         * sourcetype configuration.
         * @returns {object} the sourcetype config found
         * @throws {Error} any error
         */
        Budget.GetSourceTypeConfiguration = (function () {
            var sourceTypeConfigCache = {};
            return function (document, useCache) {
                var ruidEx = GetBuiltinDocumentValue(document, "RuidEx");
                var config = useCache !== false && sourceTypeConfigCache[ruidEx];
                if (config) {
                    return config;
                }
                var trcPart = Sys.Helpers.IsUndefined(document) ? "current" : "other";
                Log.Info("Get source type configuration of " + trcPart + " document with ruidEx: " + ruidEx);
                for (var sourceType in configuration.sourceTypes) {
                    if (Object.prototype.hasOwnProperty.call(configuration.sourceTypes, sourceType)) {
                        config = configuration.sourceTypes[sourceType];
                        if (config.CheckSourceType(document)) {
                            Log.Info("SourceType is " + sourceType);
                            config.sourceType = sourceType;
                            return sourceTypeConfigCache[ruidEx] = config;
                        }
                    }
                }
                throw new Error("No registered sourceType config found");
            };
        })();
        /**
         * Returns value of the budget column.
         * @param {string} budgetColumn budget column name
         * @param {object} documentData header document data
         * @param {object} itemData data of the item
         * @param {object} sourceTypeConfig the sourcetype config
         * @param {object} refValueOptions reference to return the optional value
         * @returns {string} value of the budget column in document (header or item)
         * @throws {Error} any error
         */
        function GetBudgetColumnValue(budgetColumn, documentData, itemData, sourceTypeConfig, refValueOptions) {
            var found = false, val;
            val = Sys.Helpers.TryCallFunction("Lib.Budget.Customization.Common.GetCustomBudgetColumnValue", budgetColumn, documentData, itemData, sourceTypeConfig);
            if (val !== null && typeof val !== "undefined") {
                if (Sys.Helpers.IsPlainObject(val)) {
                    if (!Sys.Helpers.IsUndefined(refValueOptions)) {
                        refValueOptions.optional = !!val.optional;
                    }
                    val = val.value;
                }
                return val;
            }
            if (!sourceTypeConfig.mappings) {
                throw new Error("No mappings defined on sourceType configuration");
            }
            // Look in form header
            if (documentData &&
                sourceTypeConfig.mappings.common &&
                sourceTypeConfig.mappings.common[budgetColumn]) {
                found = true;
                val = Sys.Helpers.IsFunction(sourceTypeConfig.mappings.common[budgetColumn]) ?
                    sourceTypeConfig.mappings.common[budgetColumn](documentData) :
                    documentData.GetValue(sourceTypeConfig.mappings.common[budgetColumn]);
            }
            // Look in form table
            if (itemData &&
                sourceTypeConfig.mappings.byLine &&
                sourceTypeConfig.mappings.byLine[budgetColumn]) {
                found = true;
                val = Sys.Helpers.IsFunction(sourceTypeConfig.mappings.byLine[budgetColumn]) ?
                    sourceTypeConfig.mappings.byLine[budgetColumn](itemData, documentData) :
                    itemData.GetValue(sourceTypeConfig.mappings.byLine[budgetColumn]);
                // Quick fix in order to convert PeriodCode to date format
                if (budgetColumn === "PeriodCode__" && Sys.Helpers.IsString(val)) {
                    // we only keep this part YYYY-MM-SS
                    val = val.substr(0, 10);
                }
            }
            // if the column is not defined in the mapping, try to search on the form by the same name
            if (!found && documentData && Sys.Helpers.Data.FieldExist(budgetColumn, documentData)) {
                found = true;
                val = documentData.GetValue(budgetColumn);
            }
            if (!found && itemData && Sys.Helpers.Data.FieldExistInTable(sourceTypeConfig.formTable, budgetColumn, documentData)) {
                found = true;
                val = itemData.GetValue(budgetColumn);
            }
            if (!found) {
                throw new Error("Cannot get value on document of the budget column " + budgetColumn);
            }
            if (val instanceof Date) {
                val = Sys.Helpers.Date.Date2DBDate(val);
            }
            else if (!Sys.Helpers.IsEmpty(val) && !Sys.Helpers.IsString(val)) {
                val = "" + val; // force to string conversion
            }
            return val;
        }
        Budget.GetBudgetColumnValue = GetBudgetColumnValue;
        /**
         * Returns the filter selecting specified budgets.
         * @param {array} budgets map of budget by budgetID
         * @returns {string} built filter
         */
        function BuildFilterFromBudgets(budgets) {
            var _a;
            var budgetIDFilterArray = [];
            Sys.Helpers.Object.ForEach(budgets, function (_, budgetID) {
                budgetIDFilterArray.push(Sys.Helpers.LdapUtil.FilterStrictEqual("BudgetID__", budgetID));
            });
            return (_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, budgetIDFilterArray).toString();
        }
        Budget.BuildFilterFromBudgets = BuildFilterFromBudgets;
        function BuildFilter(budgetIDs, budgetKeyColumns, crossSectionalBudgetLineIsDisabled) {
            var _a;
            var orFilterArray = [];
            Sys.Helpers.Object.ForEach(budgetIDs, function (budget) {
                var _a;
                var andFilterArray = [];
                Sys.Helpers.Object.ForEach(budgetKeyColumns, function (budgetColumn) {
                    var val = budget[budgetColumn];
                    // special behaviour for PeriodCode
                    if (budgetColumn === "PeriodCode__") {
                        andFilterArray.push(Sys.Helpers.LdapUtil.FilterLesserOrEqual("PeriodCode__.PeriodStart__", val));
                        andFilterArray.push(Sys.Helpers.LdapUtil.FilterGreaterOrEqual("PeriodCode__.PeriodEnd__", val));
                    }
                    else if (crossSectionalBudgetLineIsDisabled) {
                        andFilterArray.push(Sys.Helpers.LdapUtil.FilterStrictEqual(budgetColumn, val));
                    }
                    else {
                        andFilterArray.push(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterStrictEqual(budgetColumn, val), Sys.Helpers.LdapUtil.FilterNotExist(budgetColumn), Sys.Helpers.LdapUtil.FilterStrictEqual(budgetColumn, "")));
                    }
                });
                orFilterArray.push((_a = Sys.Helpers.LdapUtil).FilterAnd.apply(_a, andFilterArray));
            });
            return (_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, orFilterArray).toString();
        }
        Budget.BuildFilter = BuildFilter;
        /**
         * Special errors
         */
        var MissingBudgetIDError = /** @class */ (function (_super) {
            __extends(MissingBudgetIDError, _super);
            function MissingBudgetIDError(budgetKeyColumns, budgetID) {
                var _this = _super.call(this) || this;
                _this.budgetKeyColumns = budgetKeyColumns;
                _this.budgetID = budgetID;
                // Fix 'this instanceof MissingBudgetIDError'
                // See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
                Sys.Helpers.Object.SetPrototypeOf(_this, MissingBudgetIDError.prototype);
                return _this;
            }
            return MissingBudgetIDError;
        }(Error));
        Budget.MissingBudgetIDError = MissingBudgetIDError;
        var MultipleBudgetError = /** @class */ (function (_super) {
            __extends(MultipleBudgetError, _super);
            function MultipleBudgetError(budgetKeyColumns, budgetIDs) {
                var _this = _super.call(this) || this;
                _this.budgetKeyColumns = budgetKeyColumns;
                _this.budgetIDs = budgetIDs;
                // Fix 'this instanceof MultipleBudgetError'
                // See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
                Sys.Helpers.Object.SetPrototypeOf(_this, MultipleBudgetError.prototype);
                return _this;
            }
            return MultipleBudgetError;
        }(Error));
        Budget.MultipleBudgetError = MultipleBudgetError;
        /**
         * Retrieves budget according to the specified options.
         *
         * Cette méthode permet de retourner toutes les informations sur les budgets que le document
         * va impacter.
         *
         * En priorité le budgetID sera déterminé afin de pouvoir retourner les informations pour
         * chacuns d'entre eux.
         * Pour les items n'impactant aucun budget et si l'application l'autorise, l'option
         * ignoreItemsWithoutBudgetID à true évite de (re)déterminer à chaque appel le budget à impacter.
         *
         * Les résultats retournés par la méthode resolve du Promise sont donnés par budgetID et par itemID (# de l'item dans le tableau FormData)
         *    {
         * 		byBudgetID: {
         * 			<string>: {
         * 				// every budgetKey columns value
         * 				CompanyCode__: <string>,
         * 				PeriodCode__: <string>,
         * 				PeriodStart__: <string>,
         * 				PeriodEnd__: <string>,
         * 				// other assignment values
         * 				<string>: <string,
         * 				...
         *
         * 				// Amount columns value
         * 				Budget__: <number>,
         * 				ToApprove__: <number>,
         *  			Committed__: <number>,
         *  			Ordered__: <number>,
         *  			Received__: <number>,
         *  			InvoicedPO__: <number>,
         *  			InvoicedNonPO__: <number>,
         *
         * 				// Computed remaining amount
         * 				Remaining__: <number>,
         *
         * 				// Details of the current impact on this budget
         * 				Impact: <instance of Impact class>,
         * 				// Details of the previous impact on this budget
         *				PreviousImpact: <instance of Impact class>,
         *
         * 				// List of items impacting this budget (# of item)
         * 				Items: [<number>, ...]
         * 			},
         * 			...
         * 		},
         * 		byItemIndex: [
         * 			// For each item :
         * 			// budgetID is the ID of the impacted budget by this item
         * 			// null if this item doesn't impact at this time
         * 			// error is an instance any Error thrown
         * 			<budgetID|null|error>,
         * 			...
         * 		],
         *
         * 		// Determined the configuration of sourceType (document)
         * 		sourceTypeConfig: <object>,
         *
         * 		// GetBudgets call options
         * 		options: <object>
         * 	}
         *
         * Les erreurs globales sont renvoyées par la méthode reject du Promise.
         *
         * @param {object} options
         * @param {string} [options.impactAction] indicates the action to do when calling PrepareImpacts of the sourceType config.
         *    If this option is ommited, the DeduceImpactAction function is called to determine from data the impactAction to apply.
         * @param {object} [options.document] document on which we get budget. By default the current document.
         * @param {boolean} [options.ignoreItemsWithoutBudgetID=false] avoid to determine (again) the budgetID of items don't impact any budget.
         * @param {object} [options.visibility] object defining the visibility on budgets. By default every budget is visible.
         * @returns {promise}
         */
        Budget.GetBudgets = (function () {
            var budgetIDCache = {};
            function GetBudgetIDFromCache(budget) {
                var budgetID, cachedBudget, found = false;
                for (budgetID in budgetIDCache) {
                    if (Object.prototype.hasOwnProperty.call(budgetIDCache, budgetID)) {
                        cachedBudget = budgetIDCache[budgetID];
                        found = configuration.GetBudgetKeyColumns().every(function (budgetColumn) {
                            var val = budget[budgetColumn];
                            // special behaviour for PeriodCode
                            if (budgetColumn === "PeriodCode__") {
                                var periodStartDate = cachedBudget["PeriodStart__"];
                                var periodEndDate = cachedBudget["PeriodEnd__"];
                                return periodStartDate <= val && periodEndDate >= val;
                            }
                            else {
                                return val === cachedBudget[budgetColumn];
                            }
                        });
                        if (found) {
                            return budgetID;
                        }
                    }
                }
                return null;
            }
            function AddBudgetIDToCache(budgetID, budget) {
                if (!(budgetID in budgetIDCache)) {
                    var cachedBudget_1 = {};
                    configuration.GetBudgetKeyColumns().concat(["PeriodStart__", "PeriodEnd__"]).forEach(function (budgetColumn) {
                        cachedBudget_1[budgetColumn] = budget[budgetColumn];
                    });
                    budgetIDCache[budgetID] = cachedBudget_1;
                }
            }
            function FillBudgetMap(result, budgetID, item, i) {
                var budget = null;
                var missing = false;
                if (!budgetID) {
                    if (result.options.ignoreItemsWithoutBudgetID) {
                        result.byItemIndex[i] = null; // no impact
                    }
                    else {
                        var missingBudgetID_1 = [];
                        var okPartOfBudgetKey_1 = true;
                        budget = {
                            Items: []
                        };
                        configuration.GetBudgetKeyColumns().forEach(function (budgetColumn) {
                            var refValueOptions = {};
                            var val = GetBudgetColumnValue(budgetColumn, result.documentData, item, result.sourceTypeConfig, refValueOptions);
                            okPartOfBudgetKey_1 = okPartOfBudgetKey_1 && (refValueOptions.optional || !Sys.Helpers.IsEmpty(val));
                            missingBudgetID_1.push(val);
                            budget[budgetColumn] = val;
                        });
                        // for instance, we don't allow empty budget key columns
                        // and user must have the visibility on this budget
                        if (okPartOfBudgetKey_1 && (!result.options.visibility || result.options.visibility.Check(budget))) {
                            // look in cache in order to avoid a complex query
                            budgetID = GetBudgetIDFromCache(budget);
                            if (!budgetID) {
                                missing = true;
                                budgetID = missingBudgetID_1.join("|");
                                if (!(budgetID in result.byMissingBudgetID)) {
                                    result.byMissingBudgetID[budgetID] = budget;
                                }
                                else {
                                    budget = result.byMissingBudgetID[budgetID];
                                }
                            }
                        }
                        else {
                            budget = null;
                        }
                    }
                }
                if (budgetID && !missing) {
                    if (!(budgetID in result.byBudgetID)) {
                        // may non null if we use the budgetID cache
                        // budget computed and visibility checked
                        if (!budget) {
                            budget = {
                                Items: []
                            };
                            configuration.GetBudgetKeyColumns().forEach(function (budgetColumn) {
                                try {
                                    budget[budgetColumn] = GetBudgetColumnValue(budgetColumn, result.documentData, item, result.sourceTypeConfig);
                                }
                                catch (e) {
                                    //column is not set, but we don't need the value because we already know the BudgetID
                                    budget[budgetColumn] = null;
                                }
                            });
                            // user must have the visibility on this budget
                            if (result.options.visibility && !result.options.visibility.Check(budget)) {
                                budget = null;
                            }
                        }
                        if (budget) {
                            result.byBudgetID[budgetID] = budget;
                        }
                    }
                    else {
                        budget = result.byBudgetID[budgetID];
                    }
                }
                if (budget) {
                    budget.Items.push(i);
                    result.byItemIndex[i] = budgetID;
                }
            }
            function DeduceImpactAction(result) {
                if (Sys.Helpers.IsFunction(result.sourceTypeConfig.DeduceImpactAction)) {
                    result.options.impactAction = result.sourceTypeConfig.DeduceImpactAction(result.documentData, result.options);
                    Log.Info("ImpactAction deduced from data: " + result.options.impactAction);
                }
                else {
                    Log.Warn("No function DeduceImpactAction declared in the sourceTypeConfig in order to deduce the impactAction");
                }
            }
            function GetBudgetOnItems(result) {
                var formTable = result.documentData.GetTable(result.sourceTypeConfig.formTable);
                Sys.Helpers.Data.ForEachTableItem(formTable, function (item, i) {
                    if (!result.sourceTypeConfig.IsEmptyItem(item)) {
                        var budgetID = GetBudgetColumnValue("BudgetID__", result.documentData, item, result.sourceTypeConfig);
                        FillBudgetMap(result, budgetID, item, i);
                        if (result.sourceTypeConfig.recomputeBudgetID || result.options.recomputeBudgetID) {
                            FillBudgetMap(result, null, item, i);
                        }
                    }
                });
            }
            function PrepareBudgetImpacts(result) {
                var formTable = result.documentData.GetTable(result.sourceTypeConfig.formTable);
                Sys.Helpers.Data.ForEachTableItem(formTable, function (item, i) {
                    var budgetID = result.byItemIndex[i];
                    if (budgetID) {
                        var budget_1 = result.byBudgetID[budgetID] || result.byMissingBudgetID[budgetID];
                        var impact = result.sourceTypeConfig.PrepareImpact(result.documentData, result.options.impactAction, item, i, result.options);
                        if (impact instanceof Impact) {
                            if (!budget_1.Impact) {
                                budget_1.Impact = impact;
                            }
                            else {
                                budget_1.Impact.Add(impact);
                            }
                        }
                        else if (impact instanceof MultiImpact) {
                            impact.Impacts.forEach(function (subimpact) {
                                var currentBudgetID = subimpact.budgetID !== "" ? subimpact.budgetID : budgetID;
                                budget_1 = result.byBudgetID[currentBudgetID] || result.byMissingBudgetID[currentBudgetID];
                                if (!budget_1) {
                                    result.byBudgetID[currentBudgetID] = budget_1 = {
                                        Items: []
                                    };
                                }
                                if (!budget_1.Impact) {
                                    budget_1.Impact = subimpact.impact;
                                }
                                else {
                                    budget_1.Impact.Add(subimpact.impact);
                                }
                            });
                        }
                        // no impact for this item
                        else if (impact === null) {
                            // remove budgetID and # of item references
                            Sys.Helpers.Array.Remove(budget_1.Items, function (j) { return i === j; });
                            result.byItemIndex[i] = null;
                        }
                        // not supported result
                        else {
                            throw new Error("Invalid impact returned on impactAction: " + result.options.impactAction);
                        }
                    }
                });
            }
            function CompleteBudgetInformation(budget, record) {
                // budget key columns
                configuration.GetBudgetKeyColumns().forEach(function (budgetColumn) {
                    budget[budgetColumn] = record[budgetColumn];
                });
                // complete PeriodCode information
                budget.PeriodCode__ = record.PeriodCode__;
                budget.PeriodStart__ = record["PeriodCode__.PeriodStart__"];
                budget.PeriodEnd__ = record["PeriodCode__.PeriodEnd__"];
                // and amounts...
                budget.Budget__ = parseFloat(record.Budget__ || "0");
                Budget.Steps.forEach(function (step) {
                    budget[step] = parseFloat(record[step] || "0");
                });
                budget.Closed__ = record.Closed__ === "1";
            }
            function HandleMissingBudgetIDItems(budgetMap, result) {
                Sys.Helpers.Object.ForEach(budgetMap, function (budget, budgetID) {
                    // keep only interesting columns for error
                    var budgetKeyColumns = {};
                    configuration.GetBudgetKeyColumns().forEach(function (budgetColumn) {
                        budgetKeyColumns[budgetColumn] = budget[budgetColumn];
                    });
                    budget.Items.forEach(function (itemIndex) {
                        result.byItemIndex[itemIndex] = new MissingBudgetIDError(budgetKeyColumns, budgetID);
                    });
                });
            }
            function QueryMissingBudgetIDs(result) {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var crossSectionalBudgetLineIsDisabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisableCrossSectionalBudgetLine", null, { traceLevel: "Warn" });
                    var byMissingBudgetID = result.byMissingBudgetID;
                    delete result.byMissingBudgetID;
                    var filter = BuildFilter(byMissingBudgetID, configuration.GetBudgetKeyColumns(), crossSectionalBudgetLineIsDisabled);
                    // empty filter
                    if (!filter) {
                        resolve();
                    }
                    else {
                        Sys.GenericAPI.Query("PurchasingBudget__", filter, IntrinsicBudgetColumns.concat(configuration.GetBudgetKeyColumns()), function (records, error) {
                            if (error) {
                                reject("Query missing budget IDs failed. Details: " + error);
                            }
                            else {
                                // associate missingBudget with record
                                // A record can correspond to several missing budgets
                                var missingBudgetID = void 0, budget_2, r_1;
                                var multipleBudgetError_1 = false;
                                var _loop_1 = function () {
                                    if (Object.prototype.hasOwnProperty.call(byMissingBudgetID, missingBudgetID)) {
                                        var recordOpenedBudget = null;
                                        var recordClosedBudget = null;
                                        budget_2 = byMissingBudgetID[missingBudgetID];
                                        var multipleBudgetIDs_1 = null;
                                        for (var i = 0; i < records.length; ++i) {
                                            r_1 = records[i];
                                            if (configuration.GetBudgetKeyColumns().every(function (budgetColumn) {
                                                var val = budget_2[budgetColumn];
                                                // special behaviour for PeriodCode
                                                if (budgetColumn === "PeriodCode__") {
                                                    var periodStartDate = r_1["PeriodCode__.PeriodStart__"];
                                                    var periodEndDate = r_1["PeriodCode__.PeriodEnd__"];
                                                    return periodStartDate <= val && periodEndDate >= val;
                                                }
                                                else {
                                                    if (crossSectionalBudgetLineIsDisabled) {
                                                        return (val === r_1[budgetColumn]);
                                                    }
                                                    else {
                                                        return (val === r_1[budgetColumn] || r_1[budgetColumn] === "");
                                                    }
                                                }
                                            })) {
                                                if (r_1.Closed__ === "1") {
                                                    recordClosedBudget = r_1;
                                                }
                                                else {
                                                    // Multiple budget detected !
                                                    if (recordOpenedBudget) {
                                                        multipleBudgetError_1 = true;
                                                        multipleBudgetIDs_1 = [recordOpenedBudget, r_1].map(function (record) {
                                                            return record.BudgetID__;
                                                        });
                                                        Log.Error("MultipleBudgetError: at least two conflicting budgets have been detected with budgetIDs: " + multipleBudgetIDs_1.join(", "));
                                                        recordOpenedBudget = null;
                                                        break;
                                                    }
                                                    recordOpenedBudget = r_1;
                                                    if (crossSectionalBudgetLineIsDisabled) {
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        // Returns opened budget if any or if no error returns closed budget if any...
                                        r_1 = recordOpenedBudget || (!multipleBudgetError_1 && recordClosedBudget);
                                        if (r_1) {
                                            var budgetID_1 = r_1.BudgetID__;
                                            // budgetID cannot be null or empty
                                            if (budgetID_1) {
                                                var budgetWithMissingBudgetID = budget_2;
                                                if (!(budgetID_1 in result.byBudgetID)) {
                                                    result.byBudgetID[budgetID_1] = budget_2;
                                                }
                                                else {
                                                    budget_2 = result.byBudgetID[budgetID_1];
                                                    // add impacts and items to other
                                                    budget_2.Impact = (budget_2.Impact || new Impact()).Add(budgetWithMissingBudgetID.Impact);
                                                    budget_2.Items = (budget_2.Items || []).concat(budgetWithMissingBudgetID.Items);
                                                }
                                                // replace missingbudgetID with the found budgetID on the items
                                                budgetWithMissingBudgetID.Items.forEach(function (itemIndex) {
                                                    result.byItemIndex[itemIndex] = budgetID_1;
                                                });
                                                CompleteBudgetInformation(budget_2, r_1);
                                                AddBudgetIDToCache(budgetID_1, budget_2);
                                                // remove this budget
                                                delete byMissingBudgetID[missingBudgetID];
                                            }
                                        }
                                        // Missing or multiple budget error
                                        else {
                                            var budgetKeyColumns_1 = {};
                                            configuration.GetBudgetKeyColumns().forEach(function (budgetColumn) {
                                                budgetKeyColumns_1[budgetColumn] = budget_2[budgetColumn];
                                            });
                                            budget_2.Items.forEach(function (itemIndex) {
                                                if (multipleBudgetError_1) {
                                                    result.byItemIndex[itemIndex] = new MultipleBudgetError(budgetKeyColumns_1, multipleBudgetIDs_1);
                                                }
                                                else {
                                                    result.byItemIndex[itemIndex] = new MissingBudgetIDError(budgetKeyColumns_1);
                                                }
                                            });
                                            delete byMissingBudgetID[missingBudgetID];
                                        }
                                    }
                                };
                                for (missingBudgetID in byMissingBudgetID) {
                                    _loop_1();
                                }
                                resolve();
                            }
                        }, "", 100, "EnableJoin=1");
                    }
                });
            }
            function QueryBudgetAmounts(result) {
                var filter = BuildFilterFromBudgets(result.byBudgetID);
                // empty filter
                if (!filter) {
                    return Sys.Helpers.Promise.Resolve();
                }
                return Sys.GenericAPI.PromisedQuery({
                    table: "PurchasingBudget__",
                    filter: filter,
                    attributes: IntrinsicBudgetColumns.concat(configuration.GetBudgetKeyColumns()),
                    maxRecords: 100,
                    additionalOptions: "EnableJoin=1"
                })
                    .Then(function (records) {
                    // shallow copy of the list in order to optimize loops
                    // and handle items without budgetID
                    var byBudgetID = Sys.Helpers.Extend({}, result.byBudgetID);
                    for (var i = 0; i < records.length; ++i) {
                        var record = records[i];
                        // associate budget with record
                        var budgetID = record.BudgetID__;
                        if (budgetID in byBudgetID) {
                            var budget = result.byBudgetID[budgetID];
                            CompleteBudgetInformation(budget, record);
                            // remove this budget in order to increase next loops speed
                            delete byBudgetID[budgetID];
                        }
                    }
                    // Not found budget...
                    HandleMissingBudgetIDItems(byBudgetID, result);
                })
                    .Catch(function (error) {
                    throw "Query budget amounts failed. Details: " + error;
                });
            }
            function QueryPreviousBudgetImpacts(result) {
                var ruidEx = GetBuiltinDocumentValue(result.options.document, "RuidEx");
                if (!ruidEx) {
                    return Sys.Helpers.Promise.Resolve();
                }
                var filter = "(OperationRuidex__=" + ruidEx + ")";
                return Sys.GenericAPI.PromisedQuery({
                    table: "PurchasingBudgetOperationDetails__",
                    filter: filter,
                    attributes: IntrinsicBudgetOperationDetailsColumns.concat(configuration.GetBudgetKeyColumns()),
                    maxRecords: 100
                })
                    .Then(function (records) {
                    // add previous impacts to budget
                    for (var i = 0; i < records.length; ++i) {
                        var record = records[i];
                        var budgetID = record.BudgetID__, budget = void 0;
                        // budget no more impacted or user don't have visibility on this budget
                        if (!(budgetID in result.byBudgetID)) {
                            budget = {
                                Items: []
                            };
                            CompleteBudgetInformation(budget, record);
                            // user must have the visibility on this budget
                            if (!result.options.visibility || result.options.visibility.Check(budget)) {
                                result.byBudgetID[budgetID] = budget;
                            }
                        }
                        else {
                            budget = result.byBudgetID[budgetID];
                        }
                        budget.PreviousImpact = new Impact(record);
                    }
                })
                    .Catch(function (error) {
                    throw "Query previous budget impacts failed. Details: " + error;
                });
            }
            function ComputeBudgetRemainings(result) {
                Sys.Helpers.Object.ForEach(result.byBudgetID, function (budget, _budgetID) {
                    budget.Remaining__ = ComputeBudgetRemaining(budget);
                });
            }
            return function (options) {
                Log.Info("Get budget starting...");
                try {
                    var documentData = !options.document ? Data : options.document.GetFormData();
                    if (!documentData) {
                        throw new Error("Cannot get form data on document");
                    }
                    var result_1 = {
                        byBudgetID: {},
                        byMissingBudgetID: {},
                        byItemIndex: [],
                        sourceTypeConfig: Budget.GetSourceTypeConfiguration(options.document),
                        documentData: documentData,
                        options: options
                    };
                    if (!options.impactAction) {
                        DeduceImpactAction(result_1);
                    }
                    // synchronous operations
                    GetBudgetOnItems(result_1);
                    PrepareBudgetImpacts(result_1);
                    // asynchronous operations
                    // Query missing budget ids first as we use them in QueryBudgetAmounts and QueryPreviousBudgetImpacts
                    return QueryMissingBudgetIDs(result_1)
                        .Then(function () { return Sys.Helpers.Promise.All([
                        QueryBudgetAmounts(result_1),
                        QueryPreviousBudgetImpacts(result_1)
                    ]); })
                        .Then(function () {
                        ComputeBudgetRemainings(result_1);
                        return result_1;
                    })
                        .Catch(function (error) {
                        Log.Error(error.toString());
                        throw error;
                    });
                }
                catch (e) {
                    Log.Error(e.toString());
                    return Sys.Helpers.Promise.Reject(e);
                }
            };
        })();
        /**
         * Returns a critical section array allowing to prevent concurrent access on these budgets.
         * @param {object} budgets map of budget by budgetID
         * @returns {array} critical section array
         */
        function GetCriticalSection(budgets) {
            return Object.keys(budgets).map(function (v) {
                return "budgetlck" + v;
            });
        }
        Budget.GetCriticalSection = GetCriticalSection;
    })(Budget = Lib.Budget || (Lib.Budget = {}));
})(Lib || (Lib = {}));
