///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Budget_Visibility_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Visibility on budget library",
  "require": [
    "Lib_Budget_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Budget;
    (function (Budget) {
        /**
         * Query ODUser table. Retrieve the validation keys on budget stored in the AdditionalField4.
         * @param {object} options options on query (see Visibility constructor doc.)
         * @returns {promise}
         */
        function QueryUserBudgetRights(options) {
            var customValidationsKeys = Sys.Helpers.TryCallFunction("Lib.Budget.Customization.Common.GetCustomUserBudgetRights", options);
            // Synchronous result -> custom validationKeys
            if (Sys.Helpers.IsArray(customValidationsKeys)) {
                return Sys.Helpers.Promise.Resolve(customValidationsKeys);
            }
            // Asynchronous result -> promise -> custom validationKeys
            else if (Sys.Helpers.Promise.IsPromise(customValidationsKeys)) {
                return customValidationsKeys;
            }
            Log.Info("Get users info for " + options.login);
            if (Sys.Helpers.Globals.User && Sys.Helpers.IsDefined(Sys.Helpers.Globals.User.additionalField4) && Sys.Helpers.Globals.User.loginId == options.login) { // User.additionalField4 is not defined on mobile app
                if (Sys.Helpers.Globals.User.additionalField4) {
                    var validationKeys = Sys.Helpers.Globals.User.additionalField4.split(";");
                    return Sys.Helpers.Promise.Resolve(validationKeys);
                }
                return Sys.Helpers.Promise.Resolve([]);
            }
            else {
                // Find available keys for the user
                // Until we have the result of the query, nothing is allowed
                return Sys.GenericAPI.PromisedQuery({
                    table: "ODUSER",
                    filter: "login=" + options.login,
                    attributes: ["ADDITIONALFIELD4"]
                })
                    .Catch(function (error) {
                    throw "Failed to get user validation keys on budget. Details: " + error;
                })
                    .Then(function (records) {
                    if (records.length === 0) {
                        throw "No user found.";
                    }
                    if (records[0].ADDITIONALFIELD4) {
                        return records[0].ADDITIONALFIELD4.split(";");
                    }
                    return [];
                });
            }
        }
        function QueryUserPropertiesBudgetRights(options, validationKeys) {
            Log.Info("Get users info for " + options.login);
            // Find available keys for the user
            // Until we have the result of the query, nothing is allowed
            return Sys.GenericAPI.PromisedQuery({
                table: "P2P - User properties__",
                filter: "UserLogin__=" + options.login,
                attributes: ["AllowedBudgetKeys__"]
            })
                .Then(function (records) {
                if (records.length > 0) {
                    return validationKeys.concat(records[0].AllowedBudgetKeys__.split("\n"));
                }
                else if (validationKeys.length) {
                    return validationKeys;
                }
                else {
                    return [""];
                }
            })
                .Catch(function (error) {
                throw "Failed to get user validation keys on budget. Details: " + error;
            });
        }
        var Visibility = /** @class */ (function () {
            function Visibility(options) {
                if (!options.validationKeys) {
                    var self_1 = this;
                    this.readyPromise = QueryUserBudgetRights(options)
                        .Then(function (validationKeys) {
                        return QueryUserPropertiesBudgetRights(options, validationKeys);
                    })
                        .Then(function (validationKeys) {
                        self_1.validationKeys = validationKeys;
                        return self_1.validationKeys;
                    });
                }
                else {
                    this.validationKeys = options.validationKeys;
                    this.readyPromise = Sys.Helpers.Promise.Resolve(options.validationKeys);
                }
                this.validationKeyColumns = options.validationKeyColumns || ["CompanyCode__", "CostCenter__"];
            }
            Visibility.BuildRegex = function (validationKey) {
                // regex: escape all regex-special chars, except '*', which is transformed in '.*'.
                return new RegExp("^" + validationKey.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&").replace(/\*/g, '.*') + "$", "i");
            };
            /**
             * Indicates when the visibility object is ready to use.
             * @returns {promise}
             */
            Visibility.prototype.Ready = function () {
                return this.readyPromise;
            };
            /**
             * Returns true if the user has read access to current budget.
             * @param {object} budget computed information about budget. Contains every value of budget key columns.
             * @returns {boolean}
             */
            Visibility.prototype.Check = function (budget) {
                if (this.CheckAll()) {
                    return true;
                }
                if (this.validationKeys) {
                    for (var i = 0; i < this.validationKeys.length; i++) {
                        var validationKeyMap = this.validationKeyColumns.map(function (column) {
                            return budget[column];
                        });
                        var validationKey = validationKeyMap.join("_");
                        if (validationKey === "all" || validationKey.match(Visibility.BuildRegex(this.validationKeys[i]))) {
                            return true;
                        }
                    }
                }
                return false;
            };
            /**
             * Returns true if user has read access to "all" budget with special keyword.
             * @returns {boolean}
             */
            Visibility.prototype.CheckAll = function () {
                return this.validationKeys &&
                    this.validationKeys.length > 0 &&
                    this.validationKeys[0].toLowerCase() === "all";
            };
            Visibility.prototype.CheckLineItem = function (item) {
                if (this.CheckAll()) {
                    return true;
                }
                if (this.validationKeys) {
                    for (var i = 0; i < this.validationKeys.length; i++) {
                        var validationKeyMap = this.validationKeyColumns.map(function (column) {
                            return Lib.Budget.GetBudgetColumnValue(column, Data, item, Lib.Budget.GetSourceTypeConfiguration());
                        });
                        var validationKey = validationKeyMap.join("_");
                        if (validationKey === "all" || validationKey.match(Visibility.BuildRegex(this.validationKeys[i]))) {
                            return true;
                        }
                    }
                }
                return false;
            };
            return Visibility;
        }());
        Budget.Visibility = Visibility;
    })(Budget = Lib.Budget || (Lib.Budget = {}));
})(Lib || (Lib = {}));
