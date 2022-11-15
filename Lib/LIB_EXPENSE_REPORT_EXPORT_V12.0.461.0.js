///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Report_Export_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Expense Report library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_Poexport_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "[Lib_Custom_Parameters]",
    "[Lib_P2P_Custom_Parameters]",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Synchronizer",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Report;
        (function (Report) {
            var ExpenseReportRPTMapping = {
                header: {
                    "ExpenseReportDate__": function (info) {
                        return Sys.Helpers.Date.ToUTCDate(new Date());
                    },
                    "ExpenseReportNumber__": function (info) {
                        return info.expRNumber;
                    },
                    "Currency__": "CC_Currency__",
                    "TotalNetAmount__": "TotalAmount__",
                    "RefundableAmount__": "RefundableAmount__",
                    "NonRefundableAmount__": "NonRefundableAmount__",
                    "Description__": "Description__",
                    "UserName__": "UserName__",
                    "UserNumber__": "UserNumber__",
                    "User__": "User__",
                    "ExpenseReportTypeName__": "ExpenseReportTypeName__"
                },
                logo: {
                    "template": function (info) {
                        return "%images%\\PO_logo.png";
                    },
                    "suffix": function () {
                        return Sys.Helpers.String.NormalizeFileSuffix(Sys.Helpers.String.RemoveIllegalCharactersFromFilename(Data.GetValue("CompanyCode__")));
                    },
                    "default": function () {
                        return "%AccountLogo%";
                    }
                },
                companyInfo: {
                    "FormattedAddress__": function (info) {
                        return info.formattedBlockAddress;
                    },
                    "CompanyName__": "CompanyName__",
                    "Sub__": "Sub__",
                    "Street__": "Street__",
                    "PostOfficeBox__": "PostOfficeBox__",
                    "City__": "City__",
                    "PostalCode__": "PostalCode__",
                    "Region__": "Region__",
                    "Country__": "Country__",
                    "PhoneNumber__": "PhoneNumber__",
                    "FaxNumber__": "FaxNumber__",
                    "VATNumber__": "VATNumber__",
                    "ContactEmail__": "ContactEmail__",
                    "SIRET__": "SIRET__",
                    "DecimalCount": function (info) {
                        return 2;
                    },
                    "FormatDate": function (info) {
                        return (Sys.Helpers.Date.dateFormatLocales[info.culture] || Sys.Helpers.Date.dateFormatLocales["default"])
                            .replace(/\bmm\b/, "MM")
                            .replace(/\bm\b/, "M");
                    },
                    "SeparatorThousand": function (info) {
                        return encodeURIComponent(Lib.Purchasing.delimitersThousandsLocales[info.culture] || Lib.Purchasing.delimitersThousandsLocales["default"]);
                    },
                    "SeparatorDecimal": function (info) {
                        return Lib.Purchasing.delimitersDecimalLocales[info.culture] || Lib.Purchasing.delimitersDecimalLocales["default"];
                    },
                    "SeparatorInfos": function (info) {
                        return encodeURIComponent(" - ");
                    },
                    "SupplierAddressRightWindow": function (info) {
                        return "0";
                    }
                },
                tables: {
                    "LineItems__": {
                        table: "ExpensesTable__",
                        fields: {
                            "ExpenseNumber__": "ExpenseNumber__",
                            "Date__": "Date__",
                            "ExpenseDescription__": "ExpenseDescription__",
                            "ExpenseType__": "ExpenseType__",
                            "VendorName__": "VendorName__",
                            "LocalAmount__": "LocalAmount__",
                            "Amount__": "Amount__",
                            "LocalCurrency__": "LocalCurrency__",
                            "Currency__": "Currency__",
                            "CurrencyRate__": "CurrencyRate__",
                            "CompanyCode__": "CompanyCode__",
                            "Refundable__": "Refundable__",
                            "CostCenterId__": "CostCenterId__",
                            "ProjectCode__": "ProjectCode__",
                            "VehicleTypeName__": "VehicleTypeName__",
                            "Distance__": "Distance__",
                            "From__": "From__",
                            "To__": "To__",
                            "Billable__": "Billable__",
                            "CreatedFromBankStatement__": "CreatedFromBankStatement__"
                        }
                    },
                    "ReportWorkflow__": {
                        table: "ReportWorkflow__",
                        fields: {
                            "WRKFRole__": "WRKFRole__",
                            "WRKFUserName__": "WRKFUserName__"
                        }
                    }
                }
            };
            Report.Export = {
                GetExpenseReportTemplateInfos: function () {
                    var expenseReportInfos = {
                        escapedCompanyCode: Sys.Helpers.String.RemoveIllegalCharactersFromFilename(Data.GetValue("CompanyCode__")),
                        template: null,
                        expenseReportNumber: Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.Controls.ExpenseReportNumber__.GetValue() : Data.GetValue("ExpenseReportNumber__"),
                        fileFormat: "RPT",
                        language: null,
                        culture: null
                    };
                    var templateFromUserExit = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Common.GetExpenseReportTemplateName");
                    if (templateFromUserExit != null) {
                        if (Sys.Helpers.IsString(templateFromUserExit)) {
                            expenseReportInfos.template = templateFromUserExit;
                        }
                        else {
                            expenseReportInfos.template = templateFromUserExit.template;
                            expenseReportInfos.language = templateFromUserExit.language;
                            expenseReportInfos.culture = templateFromUserExit.culture;
                        }
                    }
                    if (expenseReportInfos.template == null) {
                        expenseReportInfos.template = Sys.Parameters.GetInstance("Expense").GetParameter("ExpenseReportTemplateName");
                        Log.Info("Template name comes from parameters");
                    }
                    Log.Info("Template name is: '" + expenseReportInfos.template + "'");
                    expenseReportInfos.fileFormat = expenseReportInfos.template.substr(expenseReportInfos.template.length - 3).toLowerCase() === "rpt" ? "RPT" : "";
                    return expenseReportInfos;
                },
                CreateExpenseReportJsonString: function (context, expenseReportTemplateInfos, callback) {
                    var cc = Data.GetValue("CompanyCode__");
                    Lib.P2P.CompanyCodesValue.QueryValues(cc).Then(function (CCValues) {
                        if (Object.keys(CCValues).length > 0) {
                            var promises = [];
                            promises.push(Sys.Helpers.Promise.Create(function (resolve, reject) {
                                resolve({
                                    culture: expenseReportTemplateInfos.culture,
                                    language: expenseReportTemplateInfos.language
                                });
                            }));
                            Sys.Helpers.Promise.All(promises)
                                .Then(function (res) {
                                var ExpenseReportData = {};
                                // Language and culture
                                var culture = res[0].culture;
                                var language = res[0].language;
                                if (!culture || !language) {
                                    Log.Info("Using language and culture of current user");
                                    culture = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User.culture : Lib.P2P.GetValidatorOrOwner().GetValue("Culture");
                                    language = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User.language : Lib.P2P.GetValidatorOrOwner().GetValue("Language");
                                }
                                var ExpenseReportExport = Report.Export;
                                ExpenseReportData = ExpenseReportExport.CreateExpenseReportDataForRPT(context, expenseReportTemplateInfos.expenseReportNumber, culture);
                                var currentUser = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User : Lib.P2P.GetValidatorOrOwner();
                                // Add language data and return
                                var expenseReportTemplateName = expenseReportTemplateInfos.template.substr(0, expenseReportTemplateInfos.template.lastIndexOf('.')) || expenseReportTemplateInfos.template;
                                ExpenseReportExport.GetTemplateContent(currentUser, expenseReportTemplateName + ".json", language)
                                    .Then(function (languageTemplate) {
                                    // Add language
                                    Sys.Helpers.Extend(true, ExpenseReportData, JSON.parse(languageTemplate.content));
                                    // Final User callback
                                    var updatedExpenseReportData = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Common.CustomizeExpenseReportData", ExpenseReportData);
                                    if (updatedExpenseReportData) {
                                        ExpenseReportData = updatedExpenseReportData;
                                    }
                                    callback(JSON.stringify(ExpenseReportData));
                                })
                                    .Catch(function (e) {
                                    Log.Error("Failed to GetTemplateContent: " + e);
                                    callback(JSON.stringify(ExpenseReportData));
                                });
                            })
                                .Catch(function (error) {
                                var errorMessage = error.toString();
                                Log.Error(errorMessage);
                                callback(JSON.stringify({ error: errorMessage }));
                            });
                        }
                    });
                },
                GetDataExpensesTable: function (context, tableName, tableMapping, info) {
                    var expenseGetValueMap = {};
                    context.expenses.forEach(function (expense) {
                        var expenseNumber;
                        if (Sys.ScriptInfo.IsClient()) {
                            expenseNumber = expense.EXPENSENUMBER__;
                            expenseGetValueMap[expenseNumber] = function (fieldName) {
                                var value = expense[fieldName.toUpperCase()];
                                return Sys.Helpers.IsDefined(value) ? value : null;
                            };
                        }
                        else {
                            var expenseVars_1 = expense.GetUninheritedVars();
                            expenseNumber = expenseVars_1.GetValue_String("ExpenseNumber__", 0);
                            expenseGetValueMap[expenseNumber] = function (fieldName) {
                                var value = expenseVars_1.GetValue_String(fieldName, 0);
                                return Sys.Helpers.IsDefined(value) ? value : null;
                            };
                        }
                    });
                    var infoForExpenses = Sys.Helpers.Extend(false, {}, info);
                    infoForExpenses.GetValueOnRecord = function (item, fieldName) {
                        var expenseNumber = item.GetValue("ExpenseNumber__");
                        var expenseGetValue = expenseGetValueMap[expenseNumber];
                        return expenseGetValue ? expenseGetValue(fieldName) : null;
                    };
                    return Lib.P2P.Export.SerializeTable(tableName, tableMapping, infoForExpenses);
                },
                CreateExpenseReportDataForRPT: function (context, expenseReportNumber, culture) {
                    // Takes into account an user exit.
                    var extraFields = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Common.GetExtraExpenseReportRPTFields");
                    if (extraFields) {
                        Sys.Helpers.Extend(true, ExpenseReportRPTMapping, extraFields);
                    }
                    var info = {
                        culture: culture,
                        expRNumber: expenseReportNumber,
                    };
                    var expenseReportData = {
                        header: {},
                        logo: {},
                        companyInfo: {},
                        tables: {}
                    };
                    if (ExpenseReportRPTMapping.header) {
                        Sys.Helpers.Object.ForEach(ExpenseReportRPTMapping.header, function (data, field) {
                            var dataValue = Sys.Helpers.IsFunction(data) ? data(info) : Data.GetValue(data);
                            // except for Date type where we always set as a string with "YYYY-MM-DD" format
                            if (dataValue instanceof Date) {
                                dataValue = Sys.Helpers.Date.ToUTCDate(dataValue);
                            }
                            expenseReportData.header[field] = dataValue;
                        });
                    }
                    if (ExpenseReportRPTMapping.logo) {
                        Sys.Helpers.Object.ForEach(ExpenseReportRPTMapping.logo, function (data, field) {
                            var dataValue = Sys.Helpers.IsFunction(data) ? data(info) : Data.GetValue(data);
                            // except for Date type where we always set as a string with "YYYY-MM-DD" format
                            if (dataValue instanceof Date) {
                                dataValue = Sys.Helpers.Date.ToUTCDate(dataValue);
                            }
                            expenseReportData.logo[field] = dataValue;
                        });
                    }
                    if (ExpenseReportRPTMapping.companyInfo) {
                        var cc = Data.GetValue("CompanyCode__");
                        var companyInfos_1 = Lib.P2P.CompanyCodesValue.GetValues(cc);
                        if (Object.keys(companyInfos_1).length > 0) {
                            Sys.Helpers.Object.ForEach(ExpenseReportRPTMapping.companyInfo, function (data, field) {
                                var dataValue = Sys.Helpers.IsFunction(data) ? data(info) : companyInfos_1[data];
                                // except for Date type where we always set as a string with "YYYY-MM-DD" format
                                if (dataValue instanceof Date) {
                                    dataValue = Sys.Helpers.Date.ToUTCDate(dataValue);
                                }
                                expenseReportData.companyInfo[field] = dataValue;
                            });
                        }
                        else {
                            Log.Info("Error: No record found for company code '" + cc + "'");
                        }
                    }
                    if (ExpenseReportRPTMapping.tables) {
                        for (var key in ExpenseReportRPTMapping.tables) {
                            var tableMapping = ExpenseReportRPTMapping.tables[key];
                            var tableName = tableMapping.table || key;
                            if (tableMapping.fields) {
                                if (tableName !== "ExpensesTable__") {
                                    expenseReportData.tables[tableName] = Lib.P2P.Export.SerializeTable(tableName, tableMapping, info);
                                }
                                else {
                                    expenseReportData.tables[tableName] = this.GetDataExpensesTable(context, tableName, tableMapping, info);
                                }
                            }
                            else {
                                Log.Info("Error: table '" + key + "' is missing 'fields' attribute");
                            }
                        }
                    }
                    return expenseReportData;
                },
                GetTemplateContent: function (user, jsonFileName, culture) {
                    return Sys.Helpers.Promise.Create(function (resolve, reject) {
                        if (Sys.ScriptInfo.IsClient()) {
                            user.GetTemplateContent(function (templateContent) { resolve(templateContent); }, jsonFileName, culture);
                        }
                        else {
                            var templateContent = user.GetTemplateContent({
                                templateName: jsonFileName,
                                language: culture
                            });
                            resolve(templateContent);
                        }
                    });
                }
            };
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
