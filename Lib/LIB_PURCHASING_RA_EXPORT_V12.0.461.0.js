///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "scriptType": "COMMON",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_P2P_CompanyCodesValue_V12.0.461.0",
    "Lib_Purchasing_Vendor_V12.0.461.0",
    "Lib_Purchasing_ShipTo_V12.0.461.0",
    "Lib_P2P_Export_V12.0.461.0",
    "[Lib_PO_Customization_Common]"
  ],
  "name": "Lib_Purchasing_RA_Export_V12.0.461.0"
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var RA;
        (function (RA) {
            var GetVendorCultureAndLanguage = Lib.Purchasing.Vendor.GetVendorCultureAndLanguage;
            var RPTMapping = {
                header: {
                    "NetAmount__": "NetAmount__",
                    "PaymentDate__": "PaymentDate__",
                    "Currency__": "Currency__",
                    "PayerAddress__": "PayerAddress__",
                    "PayerCompany__": "PayerCompany__",
                    "PayerCompanyCode__": "PayerCompanyCode__",
                    "PaymentReference__": "PaymentReference__",
                    "PaymentMethodCode__": "PaymentMethodCode__",
                    "PaymentMethodDescription__": "PaymentMethodDescription__",
                    "TotalNetAmount__": "TotalNetAmount__",
                    "VendorName__": "VendorName__",
                    "VendorAddress__": "VendorAddress__",
                    "VendorNumber__": "VendorNumber__"
                },
                logo: {
                    "template": function (info) {
                        return "%images%\\PO_logo.png";
                    },
                    "suffix": function () {
                        return Sys.Helpers.String.NormalizeFileSuffix(Sys.Helpers.String.RemoveIllegalCharactersFromFilename(Data.GetValue("PayerCompanyCode__")));
                    },
                    "default": function () {
                        return "%AccountLogo%";
                    }
                },
                companyInfo: {
                    "FormattedAddress__": function (info) {
                        return info.formattedBlockAddress;
                    },
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
                    "Table__": {
                        table: "Table__",
                        fields: {
                            "DocumentNumber__": "DocumentNumber__",
                            "InvoiceDate__": "InvoiceDate__",
                            "InvoiceNumber__": "InvoiceNumber__",
                            "ItemQuantity__": "ItemQuantity__",
                            "NetAmount__": "NetAmount__"
                        }
                    }
                }
            };
            RA.Export = {
                GetTemplateInfos: function () {
                    var poInfos = {
                        escapedCompanyCode: Sys.Helpers.String.RemoveIllegalCharactersFromFilename(Data.GetValue("PayerCompanyCode__")),
                        template: null,
                        fileFormat: null,
                        language: null,
                        culture: null
                    };
                    var templateFromUserExit = Sys.Helpers.TryCallFunction("Lib.RA.Customization.Common.GetTemplateName");
                    if (templateFromUserExit != null) {
                        if (Sys.Helpers.IsString(templateFromUserExit)) {
                            poInfos.template = templateFromUserExit;
                        }
                        else {
                            poInfos.template = templateFromUserExit.template;
                            poInfos.language = templateFromUserExit.language;
                            poInfos.culture = templateFromUserExit.culture;
                        }
                    }
                    if (poInfos.template == null) {
                        poInfos.template = Sys.Parameters.GetInstance("RemittanceAdvice").GetParameter("TemplateName");
                        Log.Info("Template name comes from parameters");
                    }
                    Log.Info("Template name is: '" + poInfos.template + "'");
                    poInfos.fileFormat = poInfos.template.substr(poInfos.template.length - 3).toLowerCase() === "rpt" ? "RPT" : "";
                    return poInfos;
                },
                CreateJsonString: function (templateInfos, callback) {
                    var promises = [];
                    promises.push(GetVendorCultureAndLanguage(templateInfos));
                    Sys.Helpers.Promise.All(promises)
                        .Then(function (res) {
                        var POData = {};
                        // Language and culture
                        var culture = res[0].culture;
                        var language = res[0].language;
                        if (!culture || !language) {
                            Log.Info("Using language and culture of current user (Buyer)");
                            culture = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User.culture : Lib.P2P.GetValidatorOrOwner().GetValue("Culture");
                            language = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User.language : Lib.P2P.GetValidatorOrOwner().GetValue("Language");
                        }
                        POData = RA.Export.CreateDataForRPT(language, culture);
                        var buyer = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User : Lib.P2P.GetValidatorOrOwner();
                        // Add language data and return
                        var templateName = templateInfos.template.substr(0, templateInfos.template.lastIndexOf('.')) || templateInfos.template;
                        Log.Time("GetTemplateContent");
                        RA.Export.GetTemplateContent(buyer, templateName + ".json", language)
                            .Then(function (languageTemplate) {
                            Log.TimeEnd("GetTemplateContent");
                            // Add language
                            Sys.Helpers.Extend(true, POData, JSON.parse(languageTemplate.content));
                            // Final User callback
                            var updatedPOData = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.CustomizePOData", POData);
                            if (updatedPOData) {
                                POData = updatedPOData;
                            }
                            callback(JSON.stringify(POData));
                        })
                            .Catch(function (e) {
                            Log.TimeEnd("GetTemplateContent");
                            Log.Error("Failed to GetTemplateContent: " + e);
                            callback(JSON.stringify(POData));
                        });
                    })
                        .Catch(function (error) {
                        var errorMessage = error.toString();
                        Log.Error(errorMessage);
                        callback(JSON.stringify({ error: errorMessage }));
                    });
                },
                CreateDataForRPT: function (language, culture) {
                    // Takes into account an user exit.
                    var extraFields = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.GetExtraPORPTFields");
                    if (extraFields) {
                        Sys.Helpers.Extend(true, RPTMapping, extraFields);
                    }
                    var info = {
                        language: language,
                        culture: culture
                    };
                    var POData = {
                        header: {},
                        logo: {},
                        companyInfo: {},
                        tables: {}
                    };
                    function FillValues(element, defaultGetValue) {
                        var poData = POData[element];
                        Sys.Helpers.Object.ForEach(RPTMapping[element], function (data, field) {
                            var dataValue;
                            if (Sys.Helpers.IsFunction(data)) {
                                dataValue = data(info);
                            }
                            else if (Sys.Helpers.IsFunction(defaultGetValue)) {
                                dataValue = defaultGetValue(data);
                            }
                            else {
                                dataValue = Data.GetValue(data);
                            }
                            // except for Date type where we always set as a string with "YYYY-MM-DD" format
                            if (Sys.Helpers.Promise.IsPromise(dataValue)) {
                                dataValue.Then(function (value) {
                                    poData[field] = value instanceof Date ? Sys.Helpers.Date.ToUTCDate(value) : value;
                                });
                            }
                            else {
                                poData[field] = dataValue instanceof Date ? Sys.Helpers.Date.ToUTCDate(dataValue) : dataValue;
                            }
                        });
                    }
                    if (RPTMapping.header) {
                        FillValues("header");
                    }
                    if (RPTMapping.logo) {
                        FillValues("logo");
                    }
                    if (RPTMapping.companyInfo) {
                        FillValues("companyInfo");
                        /*
                        let cc = Data.GetValue<string>("CompanyCode__");

                        let companyInfos = Lib.P2P.CompanyCodesValue.GetValues(cc);

                        if (Object.keys(companyInfos).length > 0)
                        {
                            Sys.Helpers.Object.ForEach(RPTMapping.companyInfo, (data, field) =>
                            {
                                let dataValue = Sys.Helpers.IsFunction(data) ? data(info) : companyInfos[data];
                                // except for Date type where we always set as a string with "YYYY-MM-DD" format
                                if (dataValue instanceof Date)
                                {
                                    dataValue = Sys.Helpers.Date.ToUTCDate(dataValue);
                                }
                                RPTMapping.companyInfo[field] = dataValue;
                            });
                        }
                        else
                        {
                            Log.Info("Error: No record found for company code '" + cc + "'");
                        }*/
                    }
                    if (RPTMapping.tables) {
                        for (var key in RPTMapping.tables) {
                            var tableMapping = RPTMapping.tables[key];
                            var tableName = tableMapping.table || key;
                            if (tableMapping.fields) {
                                POData.tables[tableName] = Lib.P2P.Export.SerializeTable(tableName, tableMapping, info);
                            }
                            else {
                                Log.Info("Error: table '" + key + "' is missing 'fields' attribute");
                            }
                        }
                    }
                    return POData;
                },
                GetTemplateContent: function (user, jsonFileName, culture) {
                    return Sys.Helpers.Promise.Create(function (resolve, reject) {
                        if (Sys.ScriptInfo.IsClient()) {
                            user.GetTemplateContent(function (templateContent) { return resolve(templateContent); }, jsonFileName, culture);
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
        })(RA = Purchasing.RA || (Purchasing.RA = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
