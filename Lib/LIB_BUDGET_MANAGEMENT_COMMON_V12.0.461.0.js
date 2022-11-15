///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Budget_Management_Common_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Budget management library",
  "require": [
    "Lib_V12.0.461.0",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_String"
  ]
}*/
var Lib;
(function (Lib) {
    var Budget;
    (function (Budget) {
        var Management;
        (function (Management) {
            var Common;
            (function (Common) {
                var _a;
                var gBudgetFields = {
                    "Delete": // Action
                    {
                        "Delete_ByCriteria__": // Action field (Radio button)
                        {
                            // budget table field: this form field
                            "Closed__": 1,
                            "CompanyCode__": "Delete_CompanyCode__",
                            "PeriodCode__": "Delete_PeriodCode__"
                        },
                        "Delete_ByBudgetID__": {
                            "Closed__": 1,
                            "BudgetID__": "Delete_BudgetID__"
                        }
                    },
                    "Export": {
                        "*": {
                            "CompanyCode__": "Export_CompanyCode__",
                            "PeriodCode__": "Export_PeriodCode__"
                        }
                    },
                    "Revise": {
                        "*": {
                            "Closed__": 0,
                            "BudgetID__": "Revise_BudgetID__"
                        }
                    },
                    "Close": {
                        "Close_ByCriteria__": // Action field (Radio button)
                        {
                            // budget table field: this form field
                            "Closed__": 0,
                            "CompanyCode__": "Close_CompanyCode__",
                            "PeriodCode__": "Close_PeriodCode__"
                        },
                        "Close_ByBudgetID__": {
                            "Closed__": 0,
                            "BudgetID__": "Close_BudgetID__"
                        }
                    }
                };
                function AddBudgetFields(action, actionField, fields) {
                    var budgetFields = gBudgetFields[action] && gBudgetFields[action][actionField];
                    if (budgetFields) {
                        Sys.Helpers.Extend(true, budgetFields, fields);
                        return true;
                    }
                    return false;
                }
                Common.AddBudgetFields = AddBudgetFields;
                function ForEachActionField(action, callback) {
                    Sys.Helpers.Object.ForEach(gBudgetFields[action], function (budgetFields, actionField) {
                        callback(actionField, budgetFields);
                    });
                }
                Common.ForEachActionField = ForEachActionField;
                function ForEachBudgetField(budgetFields, callback) {
                    Sys.Helpers.Object.ForEach(budgetFields, function (field, budgetTableField) {
                        if (Sys.Helpers.IsString(field) && field.endsWith("__")) {
                            callback(field, budgetTableField);
                        }
                    });
                }
                Common.ForEachBudgetField = ForEachBudgetField;
                function FindField(budgetFields, callback) {
                    return Sys.Helpers.Object.Find(budgetFields, function (field, budgetTableField) {
                        if (Sys.Helpers.IsString(field) && field.endsWith("__")) {
                            return callback(field, budgetTableField);
                        }
                        return false;
                    });
                }
                Common.FindField = FindField;
                function GetBudgetFields(action) {
                    for (var actionField in gBudgetFields[action]) {
                        if (actionField === "*" || Data.GetValue(actionField)) {
                            return gBudgetFields[action][actionField];
                        }
                    }
                    return null;
                }
                Common.GetBudgetFields = GetBudgetFields;
                function MakeFilter(budgetFields) {
                    var filter = "";
                    var nAttrs = 0;
                    Sys.Helpers.Object.ForEach(budgetFields, function (field, budgetTableField) {
                        var value = Sys.Helpers.IsString(field) && field.endsWith("__") ? Data.GetValue(field) : field;
                        if (value === 0 && budgetTableField === "Closed__") {
                            // Closed__ can be NULL in some cases, so check for either 0 or NULL
                            filter += "(|(" + budgetTableField + "=" + value + ")(" + budgetTableField + "!=*))";
                        }
                        else {
                            filter += "(" + budgetTableField + "=" + value + ")";
                        }
                        nAttrs++;
                    });
                    return nAttrs > 1 ? "&" + filter : filter;
                }
                Common.MakeFilter = MakeFilter;
                var StandardDBFields;
                (function (StandardDBFields) {
                    StandardDBFields["CompanyCode"] = "CompanyCode__";
                    StandardDBFields["BudgetID"] = "BudgetID__";
                    StandardDBFields["Description"] = "Description__";
                    StandardDBFields["PeriodCode"] = "PeriodCode__";
                    StandardDBFields["Budget"] = "Budget__";
                    StandardDBFields["Closed"] = "Closed__";
                })(StandardDBFields = Common.StandardDBFields || (Common.StandardDBFields = {}));
                // TODO: EnableLowBudgetNotification
                // Once the feature is released in standard package
                // Place the following fields in StandardDBFields
                var LowBudgetExperimentalDBFields;
                (function (LowBudgetExperimentalDBFields) {
                    LowBudgetExperimentalDBFields["NotifyOwner"] = "NotifyOwner__";
                    LowBudgetExperimentalDBFields["WarningThreshold"] = "WarningThreshold__";
                    LowBudgetExperimentalDBFields["OwnerLogin"] = "OwnerLogin__";
                })(LowBudgetExperimentalDBFields = Common.LowBudgetExperimentalDBFields || (Common.LowBudgetExperimentalDBFields = {}));
                Common.MandatoryStdFields = [
                    Lib.Budget.Management.Common.StandardDBFields.CompanyCode,
                    Lib.Budget.Management.Common.StandardDBFields.BudgetID,
                    Lib.Budget.Management.Common.StandardDBFields.PeriodCode,
                    Lib.Budget.Management.Common.StandardDBFields.Budget
                ];
                var StepDBFields;
                (function (StepDBFields) {
                    StepDBFields["ToApprove"] = "ToApprove__";
                    StepDBFields["Committed"] = "Committed__";
                    StepDBFields["Ordered"] = "Ordered__";
                    StepDBFields["Received"] = "Received__";
                    StepDBFields["InvoicedPO"] = "InvoicedPO__";
                    StepDBFields["InvoicedNonPO"] = "InvoicedNonPO__";
                })(StepDBFields = Common.StepDBFields || (Common.StepDBFields = {}));
                // TODO: EnableLowBudgetNotification
                // Use value from StandardDBFields instead of LowBudgetExperimentalDBFields
                Common.DefaultValues = (_a = {},
                    _a[Lib.Budget.Management.Common.LowBudgetExperimentalDBFields.WarningThreshold] = 90,
                    _a);
            })(Common = Management.Common || (Management.Common = {}));
        })(Management = Budget.Management || (Budget.Management = {}));
    })(Budget = Lib.Budget || (Lib.Budget = {}));
})(Lib || (Lib = {}));
