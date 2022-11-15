/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
/// <reference path="../../PAC/Purchasing V2/Purchase Order process V2/typings_withDeleted/Controls_Purchase_Order_process_V2/index.d.ts"/>
/* LIB_DEFINITION{
  "scriptType": "COMMON",
  "require": [
    "Sys/Sys_Helpers_String",
    "Lib_P2P_CompanyCodesValue_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_POEdition_V12.0.461.0",
    "Lib_Purchasing_Vendor_V12.0.461.0",
    "Lib_Purchasing_ShipTo_V12.0.461.0",
    "Lib_P2P_Export_V12.0.461.0",
    "[Lib_PO_Customization_Common]"
  ],
  "name": "Lib_Purchasing_POExport_V12.0.461.0"
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var GetVendorCultureAndLanguage = Lib.Purchasing.Vendor.GetVendorCultureAndLanguage;
        var TRIM_ZEROS_OPTIONS;
        (function (TRIM_ZEROS_OPTIONS) {
            TRIM_ZEROS_OPTIONS[TRIM_ZEROS_OPTIONS["NO"] = 0] = "NO";
            TRIM_ZEROS_OPTIONS[TRIM_ZEROS_OPTIONS["ALL"] = 1] = "ALL";
            TRIM_ZEROS_OPTIONS[TRIM_ZEROS_OPTIONS["ALIGN"] = 2] = "ALIGN";
        })(TRIM_ZEROS_OPTIONS = Purchasing.TRIM_ZEROS_OPTIONS || (Purchasing.TRIM_ZEROS_OPTIONS = {}));
        var PORPTMapping = {
            header: {
                "OrderDate__": function () {
                    var now = Sys.ScriptInfo.IsServer() ? Sys.Helpers.Globals.Helpers.Date.InDocumentTimezone(new Date()) : new Date();
                    return Sys.Helpers.Date.Date2DBDate(now);
                },
                "IsInternal__": "IsInternal__",
                "WarehouseName__": "WarehouseName__",
                "WarehouseAddress__": function () {
                    if (!Sys.Helpers.IsEmpty(Data.GetValue("ShipToCompany__"))
                        && !Sys.Helpers.IsEmpty(Data.GetValue("ShipToAddress__"))) {
                        // Remove ShipToCompany if present to avoid to have it twice in address block
                        return Data.GetValue("ShipToAddress__").replace(new RegExp("^" + Sys.Helpers.String.EscapeValueForRegEx(Data.GetValue("ShipToCompany__")) + "(\r|\n)*", "g"), "");
                    }
                    return Data.GetValue("ShipToAddress__");
                },
                "RevisionDateTime__": "RevisionDateTime__",
                "VendorNumber__": "VendorNumber__",
                "VendorName__": "VendorName__",
                "VendorAddress__": "VendorAddress__",
                "ShipToCompany__": "ShipToCompany__",
                "ShipToContact__": "ShipToContact__",
                "ShipToPhone__": "ShipToPhone__",
                "ShipToEmail__": "ShipToEmail__",
                "ShipToAddress__": function () {
                    if (!Sys.Helpers.IsEmpty(Data.GetValue("ShipToCompany__"))
                        && !Sys.Helpers.IsEmpty(Data.GetValue("ShipToAddress__"))) {
                        // Remove ShipToCompany if present to avoid to have it twice in address block
                        return Data.GetValue("ShipToAddress__").replace(new RegExp("^" + Sys.Helpers.String.EscapeValueForRegEx(Data.GetValue("ShipToCompany__")) + "(\r|\n)*", "g"), "");
                    }
                    return Data.GetValue("ShipToAddress__");
                },
                "OrderNumber__": function (info) {
                    return info.poNumber;
                },
                "Currency__": "Currency__",
                "TotalNetAmount__": "TotalNetAmount__",
                "TotalTaxAmount__": "TotalTaxAmount__",
                "TotalAmountIncludingVAT__": "TotalAmountIncludingVAT__",
                "PaymentAmount__": "PaymentAmount__",
                "BuyerComment__": "BuyerComment__",
                "PaymentTermCode__": "PaymentTermCode__",
                "PaymentTermDescription__": function (info) {
                    if (Lib.ERP.IsSAP()) {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            var config = Variable.GetValueAsString("SAPConfiguration");
                            var language = info.language || "%SAPCONNECTIONLANGUAGE%";
                            var filter = "ZTERM = '" + Data.GetValue("PaymentTermCode__") + "' AND SPRAS = '%ISO-" + language + "%'";
                            Sys.GenericAPI.SAPQuery(config, "T052U", filter, ["TEXT1"], function (r, error) {
                                resolve(!error && r && r.length > 0 ? r[0].TEXT1 : "");
                            }, 1, Lib.AP.SAP.UsesWebServices() ? { handler: Lib.AP.SAP.SAPQueryClientServerHandler() } : {});
                        });
                    }
                    return Data.GetValue("PaymentTermDescription__");
                },
                "PaymentMethodCode__": "PaymentMethodCode__",
                "PaymentMethodDescription__": "PaymentMethodDescription__",
                "ValidityStart__": "ValidityStart__",
                "ValidityEnd__": "ValidityEnd__",
                "DisplayTaxCode__": function () {
                    return !!Sys.Parameters.GetInstance("PAC").GetParameter("DisplayTaxCode");
                },
                "DisplayUnitOfMeasure__": function () {
                    return !!Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure");
                },
                "ContractNumber__": function () {
                    return "";
                }
                /* Also available before S137:
                ,"logo": function() {
                    return "%AccountLogo%";
                }*/
            },
            logo: {
                "template": function () {
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
                // The default number of degits for the fractional part of a decimal number
                "DecimalCount": function () {
                    return Language.GetCurrencyPrecision(Data.GetValue("Currency__"));
                },
                "PrecisionAmounts": function () {
                    return Data.GetValue("Currency__").toLowerCase() === "jpy" ? 0 : 2;
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
                "SeparatorInfos": function () {
                    return encodeURIComponent(" - ");
                },
                "SupplierAddressRightWindow": function () {
                    return "0";
                },
                "MultiShipTo": function () {
                    return Lib.Purchasing.IsMultiShipTo();
                }
            },
            DecimalParamsByField: {
                "ItemUnitPrice__": {
                    precision: function ( /*info: POInfo, values*/) {
                        return 2;
                    },
                    trimZeros: function ( /*info: POInfo, values*/) {
                        return Data.GetValue("Currency__").toLowerCase() === "jpy" ? TRIM_ZEROS_OPTIONS.ALIGN : TRIM_ZEROS_OPTIONS.NO;
                    }
                },
                "ItemQuantity__": {
                    precision: function ( /*info: POInfo, values*/) {
                        return 2;
                    },
                    trimZeros: TRIM_ZEROS_OPTIONS.NO
                }
            },
            tables: {
                "LineItems__": {
                    table: "LineItems__",
                    fields: {
                        "LineItemNumber__": "LineItemNumber__",
                        "ItemNumber__": function (info) {
                            return info.item.GetValue("SupplierPartID__") || info.item.GetValue("ItemNumber__");
                        },
                        "ItemDescription__": "ItemDescription__",
                        "ItemQuantity__": function (info) {
                            var qty = 0;
                            if (info.item.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED) {
                                qty = info.item.GetValue("ItemQuantity__");
                            }
                            return qty;
                        },
                        "ItemRequestedDeliveryDate__": "ItemRequestedDeliveryDate__",
                        "ItemUnitPrice__": function (info) {
                            var pu = 0;
                            if (info.item.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED) {
                                pu = info.item.GetValue("ItemUnitPrice__");
                            }
                            return pu;
                        },
                        "ItemNetAmount__": "ItemNetAmount__",
                        "ItemTaxCode__": "ItemTaxCode__",
                        "ItemTaxRate__": "ItemTaxRate__",
                        "ItemTaxAmount__": "ItemTaxAmount__",
                        "ItemUnitDescription__": "ItemUnitDescription__",
                        "ItemUnit__": "ItemUnit__",
                        "ItemShipToAddress__": function (info) {
                            if (!Sys.Helpers.IsEmpty(info.item.GetValue("ItemShipToCompany__"))
                                && !Sys.Helpers.IsEmpty(info.item.GetValue("ItemShipToAddress__"))) {
                                // Remove ShipToCompany if present
                                return info.item.GetValue("ItemShipToAddress__").replace(new RegExp("^" + Sys.Helpers.String.EscapeValueForRegEx(info.item.GetValue("ItemShipToCompany__")) + "(\r|\n)*", "g"), "");
                            }
                            return info.item.GetValue("ItemShipToAddress__");
                        },
                        "ItemShipToCompany__": "ItemShipToCompany__",
                        "ItemType__": "ItemType__",
                        "ItemStartDate__": "ItemStartDate__",
                        "ItemEndDate__": "ItemEndDate__",
                        "ItemContractNumber__": "ContractNumber__",
                        "ItemRecipient__": "ItemRecipient__"
                    }
                },
                "POWorkflow__": {
                    table: "POWorkflow__",
                    fields: {
                        "WRKFRole__": "WRKFRole__",
                        "WRKFUserName__": "WRKFUserName__"
                    }
                },
                "TaxSummary__": {
                    table: "TaxSummary__",
                    fields: {
                        "TaxCode__": "TaxCode__",
                        "TaxDescription__": "TaxDescription__",
                        "TaxRate__": "TaxRate__",
                        "NetAmount__": "NetAmount__",
                        "TaxAmount__": "TaxAmount__"
                    }
                },
                "AdditionalFees__": {
                    table: "AdditionalFees__",
                    fields: {
                        "ItemDescription__": "AdditionalFeeDescription__",
                        "ItemUnitPrice__": function (info) {
                            var ret = info.item.GetValue("Price__");
                            if (!ret) {
                                ret = 0;
                            }
                            return ret;
                        },
                        "ItemNetAmount__": function (info) {
                            var ret = info.item.GetValue("Price__");
                            if (!ret) {
                                ret = 0;
                            }
                            return ret;
                        },
                        "ItemTaxCode__": "ItemTaxCode__",
                        "ItemTaxRate__": "ItemTaxRate__",
                        "ItemTaxAmount__": "ItemTaxAmount__"
                    }
                }
            }
        };
        var POExport;
        (function (POExport) {
            var POCSVMapping = {
                header: {
                    "PODate": function (info) {
                        return Sys.Helpers.Date.ToLocaleDate(new Date(), info.culture);
                    },
                    "VendorNumber": "VendorNumber__",
                    "VendorName": "VendorName__",
                    "VendorAddress": "VendorAddress__",
                    "ShipToCompany": "ShipToCompany__",
                    "ShipToContact": "ShipToContact__",
                    "ShipToAddress": function (info) {
                        if (!Sys.Helpers.IsEmpty(Data.GetValue("ShipToCompany__"))
                            && !Sys.Helpers.IsEmpty(Data.GetValue("ShipToAddress__"))) {
                            // Remove ShipToCompany if present to avoid to have it twice in address block
                            return Data.GetValue("ShipToAddress__").replace(new RegExp("^" + Sys.Helpers.String.EscapeValueForRegEx(Data.GetValue("ShipToCompany__")) + "(\r|\n)*", "g"), "");
                        }
                        return Data.GetValue("ShipToAddress__");
                    },
                    "PO_number": function (info) {
                        return info.poNumber;
                    },
                    "Currency": "Currency__",
                    "TotalNetAmount": "TotalNetAmount__",
                    "TotalTaxAmount": "TotalTaxAmount__",
                    "Total": "TotalAmountIncludingVAT__",
                    "PaymentAmount": "PaymentAmount__",
                    "BuyerComment": "BuyerComment__",
                    "PaymentTerm": "PaymentTermCode__",
                    "PaymentTermDescription": "PaymentTermDescription__",
                    "PaymentMethod": "PaymentMethodCode__",
                    "PaymentMethodDescription": "PaymentMethodDescription__",
                    "ValidityStart__": "ValidityStart__",
                    "ValidityEnd__": "ValidityEnd__"
                },
                items: {
                    table: "LineItems__",
                    fields: {
                        "ItemNumber": "ItemNumber__",
                        "Description": "ItemDescription__",
                        "Quantity": "ItemQuantity__",
                        "RequestedDeliveryDate": "ItemRequestedDeliveryDate__",
                        "UnitPrice": "ItemUnitPrice__",
                        "NetAmount": "ItemNetAmount__",
                        "TaxCode": "ItemTaxCode__",
                        "TaxRate": "ItemTaxRate__",
                        "TaxAmount": "ItemTaxAmount__",
                        "ItemShipToCompany": "ItemShipToCompany__",
                        "ItemShipToAddress": function (info) {
                            if (!Sys.Helpers.IsEmpty(info.item.GetValue("ItemShipToCompany__"))
                                && !Sys.Helpers.IsEmpty(info.item.GetValue("ItemShipToAddress__"))) {
                                // Remove ShipToCompany if present
                                return info.item.GetValue("ItemShipToAddress__").replace(new RegExp("^" + Sys.Helpers.String.EscapeValueForRegEx(info.item.GetValue("ItemShipToCompany__")) + "(\r|\n)*", "g"), "");
                            }
                            return info.item.GetValue("ItemShipToAddress__");
                        }
                    }
                }
            };
            // These fields are emptied in multiship mode because they are added on each item
            Sys.Parameters.GetInstance("PAC").OnLoad(function () {
                if (Lib.Purchasing.IsMultiShipTo()) {
                    POCSVMapping.header.ShipToCompany = "";
                    POCSVMapping.header.ShipToAddress = function (info) { return ""; };
                }
            });
            function FormatAllAddressWithSameCountry(formatCompanyCode) {
                var cc = Data.GetValue("CompanyCode__");
                return Sys.Helpers.Promise.All([Lib.P2P.CompanyCodesValue.QueryValues(cc), Lib.Purchasing.ShipTo.GetToCountry()])
                    .Then(function (_a) {
                    var CCValues = _a[0], shipToCountry = _a[1];
                    if (Object.keys(CCValues).length === 0) {
                        throw "Empty Object";
                    }
                    var companyInfos = CCValues;
                    var vendorAddress = JSON.parse(Variable.GetValueAsString("VendorAddress") || null);
                    var sameCountry = shipToCountry && vendorAddress && shipToCountry == vendorAddress.ToCountry && shipToCountry == companyInfos.Country__;
                    var CompanyAddress = {
                        "ToName": "ToRemove",
                        "ToSub": companyInfos.Sub__,
                        "ToMail": companyInfos.Street__,
                        "ToPostal": companyInfos.PostalCode__,
                        "ToCountry": companyInfos.Country__,
                        "ToCountryCode": companyInfos.Country__,
                        "ToState": companyInfos.Region__,
                        "ToCity": companyInfos.City__,
                        "ToPOBox": companyInfos.PostOfficeBox__,
                        "ForceCountry": sameCountry ? "false" : "true"
                    };
                    var fromCountry = sameCountry ? companyInfos.Country__ : "US";
                    var options = {
                        "isVariablesAddress": true,
                        "address": CompanyAddress,
                        "countryCode": fromCountry // Get country code from contract ModProvider
                    };
                    var promises = [];
                    promises.push(Sys.GenericAPI.PromisedCheckPostalAddress(options)
                        .Then(function (address) {
                        Log.Info("CheckPostalAddress input:  " + JSON.stringify(CompanyAddress));
                        Log.Info("CheckPostalAddress output: " + JSON.stringify(address));
                        if (!Sys.Helpers.IsEmpty(address.LastErrorMessage)) {
                            if (formatCompanyCode) {
                                Log.Error("Error while processing CheckPostalAddress during PO Json string creation.");
                                var message = Language.Translate("InvalidCompanyAddress", false, Data.GetValue("CompanyCode__"), address.LastErrorMessage);
                                Lib.CommonDialog.NextAlert.Define("_Purchase order attaching error", message, { isError: true });
                                throw message;
                            }
                            else {
                                return "";
                            }
                        }
                        return address.FormattedBlockAddress.replace(/^[^\r\n]+(\r|\n)+/, "");
                    }));
                    // those promise are conditionals and we don't care of the return
                    promises.push(Lib.Purchasing.ShipTo.UpdateForceCountry(sameCountry));
                    if (vendorAddress) {
                        vendorAddress.ForceCountry = CompanyAddress.ForceCountry;
                        promises.push(Lib.Purchasing.Vendor.FillPostalAddress(vendorAddress));
                    }
                    return Sys.Helpers.Promise.All(promises);
                })
                    .Then(function (res) { return res[0]; });
            }
            function CreatePOCsv(poNumber) {
                return FormatAllAddressWithSameCountry(false)
                    .Then(function () {
                    // Creating dynamically the PO csv.
                    // Takes into account, user's culture and an user exit.
                    var extraFields = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.GetExtraPOCSVFields");
                    if (extraFields) {
                        Sys.Helpers.Extend(true, POCSVMapping, extraFields);
                    }
                    var val = Lib.Purchasing.GetValueAsString;
                    var culture = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User.culture : Lib.P2P.GetValidatorOrOwner().GetValue("Culture");
                    var info = {
                        culture: culture,
                        poNumber: poNumber
                    };
                    var csvHeader = [];
                    var csvDataForHeaderFields = [];
                    var csvDataForItemsFields = [];
                    if (POCSVMapping.header) {
                        Sys.Helpers.Object.ForEach(POCSVMapping.header, function (data, field) {
                            csvHeader.push(field);
                            var dataValue = Sys.Helpers.IsFunction(data) ? data(info) : val(Sys.Helpers.Globals.Data, data, culture);
                            csvDataForHeaderFields.push(dataValue);
                        });
                    }
                    if (POCSVMapping.items) {
                        // feed csvHeader
                        Sys.Helpers.Object.ForEach(POCSVMapping.items.fields || {}, function (_, field) {
                            csvHeader.push(field);
                        });
                        // feed csvData
                        var tableName = POCSVMapping.items.table || "LineItems__";
                        var table = Data.GetTable(tableName);
                        Lib.Purchasing.RemoveEmptyLineItem(table);
                        var nItems = table.GetItemCount();
                        var _loop_1 = function (itemIdx) {
                            var item = table.GetItem(itemIdx);
                            var itemInfo = Sys.Helpers.Extend(true, {}, info, {
                                tableName: tableName,
                                table: table,
                                itemIdx: itemIdx,
                                item: item
                            });
                            var csvDataForItemIdxFields = [];
                            csvDataForItemsFields.push(csvDataForItemIdxFields);
                            Sys.Helpers.Object.ForEach(POCSVMapping.items.fields || {}, function (data) {
                                var dataValue = Sys.Helpers.IsFunction(data) ? data(itemInfo) : val(item, data, culture);
                                csvDataForItemIdxFields.push(dataValue);
                            });
                            // feed intrinsic csv columns in data
                            csvDataForItemIdxFields.push(itemIdx === nItems - 1 ? "1" : "");
                        };
                        for (var itemIdx = 0; itemIdx < nItems; itemIdx++) {
                            _loop_1(itemIdx);
                        }
                    }
                    // intrinsic csv columns in header
                    csvHeader.push("LastRecord");
                    var csv = Lib.Purchasing.BuildCSVHeader(csvHeader);
                    var csvFixed = Lib.Purchasing.BuildCSVLine(csvDataForHeaderFields);
                    csvDataForItemsFields.forEach(function (fields) {
                        csv += csvFixed + ";" + Lib.Purchasing.BuildCSVLine(fields) + "\n";
                    });
                    return csv;
                });
            }
            POExport.CreatePOCsv = CreatePOCsv;
            function AddDecimalParamsByField(POData, info) {
                var _loop_2 = function (field) {
                    var precisionOptionName = "Precision".concat(field);
                    var TrimZerosOptionName = "TrimZeros".concat(field);
                    var fieldValues = POData.tables["LineItems__"].map(function (item) { return item[field]; });
                    POData.companyInfo[precisionOptionName] = Sys.Helpers.IsFunction(PORPTMapping.DecimalParamsByField[field].precision) ?
                        PORPTMapping.DecimalParamsByField[field].precision(info, fieldValues) : PORPTMapping.DecimalParamsByField[field].precision;
                    var trimZeros = Sys.Helpers.IsFunction(PORPTMapping.DecimalParamsByField[field].trimZeros) ?
                        PORPTMapping.DecimalParamsByField[field].trimZeros(info, fieldValues) : PORPTMapping.DecimalParamsByField[field].trimZeros;
                    if (trimZeros === TRIM_ZEROS_OPTIONS.ALIGN) {
                        var maxObservedPrecision = GetMaxObservedPrecision(POData, field);
                        POData.companyInfo[precisionOptionName] = Math.min(POData.companyInfo[precisionOptionName], maxObservedPrecision);
                    }
                    POData.companyInfo[TrimZerosOptionName] = trimZeros;
                };
                // eslint-disable-next-line guard-for-in
                for (var field in PORPTMapping.DecimalParamsByField) {
                    _loop_2(field);
                }
            }
            function GetMaxObservedPrecision(POData, field) {
                return POData.tables["LineItems__"].reduce(function (precision, item) {
                    var result = precision;
                    if (item[field]) {
                        var fractionalPart = item[field].toString().split(".")[1];
                        if (fractionalPart) {
                            result = Math.max(result, fractionalPart.length);
                        }
                    }
                    return result;
                }, 0);
            }
            function GetPOTemplateInfos() {
                // Base infos
                var poInfos = {
                    escapedCompanyCode: Sys.Helpers.String.NormalizeFileSuffix(Sys.Helpers.String.RemoveIllegalCharactersFromFilename(Data.GetValue("CompanyCode__"))),
                    template: null,
                    poNumber: Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.Controls.OrderNumber__.GetValue() : Data.GetValue("OrderNumber__"),
                    fileFormat: null,
                    language: null,
                    culture: null,
                    termsConditions: null
                };
                // Overloads with user exit
                var templateFromUserExit = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.GetPOTemplateName");
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
                    poInfos.template = Sys.Parameters.GetInstance("PAC").GetParameter("POTemplateName");
                    Log.Info("Template name comes from parameters");
                }
                Log.Info("Template name is: '" + poInfos.template + "'");
                var termsConditionsFromUserExit = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.GetPOTermsConditionsName");
                if (termsConditionsFromUserExit != null) {
                    if (Sys.Helpers.IsString(termsConditionsFromUserExit)) {
                        poInfos.termsConditions = "%Misc%\\" + termsConditionsFromUserExit;
                    }
                }
                if (poInfos.termsConditions == null && Sys.Parameters.GetInstance("PAC").GetParameter("POTermsConditionsTemplateName")) {
                    poInfos.termsConditions = "%Misc%\\" + Sys.Parameters.GetInstance("PAC").GetParameter("POTermsConditionsTemplateName");
                    Log.Info("Terms conditions name comes from parameters");
                }
                Log.Info("Terms conditions name is: '" + poInfos.termsConditions + "'");
                poInfos.fileFormat = poInfos.template.substr(poInfos.template.length - 3).toLowerCase() === "rpt" ? "RPT" : "DOCX";
                return poInfos;
            }
            POExport.GetPOTemplateInfos = GetPOTemplateInfos;
            function CreatePOJsonString(poTemplateInfos) {
                var promises = [GetVendorCultureAndLanguage(poTemplateInfos), FormatAllAddressWithSameCountry(true)];
                return Sys.Helpers.Promise.All(promises)
                    .Then(function (_a) {
                    var vendorInfos = _a[0], companyCodeAddress = _a[1];
                    var POData = {};
                    // Language and culture
                    var culture = vendorInfos.culture;
                    var language = vendorInfos.language;
                    if (!culture || !language) {
                        Log.Info("Using language and culture of current user (Buyer)");
                        culture = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User.culture : Lib.P2P.GetValidatorOrOwner().GetValue("Culture");
                        language = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User.language : Lib.P2P.GetValidatorOrOwner().GetValue("Language");
                    }
                    if (companyCodeAddress) {
                        POData = POExport.CreatePODataForRPT(poTemplateInfos.poNumber, language, culture, companyCodeAddress);
                    }
                    var buyer = Sys.ScriptInfo.IsClient() ? Sys.Helpers.Globals.User : Lib.P2P.GetValidatorOrOwner();
                    // Add language data and return
                    var poTemplateName = poTemplateInfos.template.substr(0, poTemplateInfos.template.lastIndexOf('.')) || poTemplateInfos.template;
                    Log.Time("GetTemplateContent");
                    return POExport.GetTemplateContent(buyer, poTemplateName + ".json", language)
                        .Then(function (languageTemplate) {
                        // Add language
                        Sys.Helpers.Extend(true, POData, JSON.parse(languageTemplate.content));
                        // Final User callback
                        var updatedPOData = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.CustomizePOData", POData);
                        if (updatedPOData) {
                            POData = updatedPOData;
                        }
                        return JSON.stringify(POData);
                    })
                        .Catch(function (e) {
                        Log.Error("Failed to GetTemplateContent: " + e);
                        return JSON.stringify(POData);
                    })
                        .Finally(function () { return Log.TimeEnd("GetTemplateContent"); });
                })
                    .Catch(function (error) {
                    var errorMessage = error.toString();
                    Log.Error(errorMessage);
                    return JSON.stringify({ error: errorMessage });
                });
            }
            POExport.CreatePOJsonString = CreatePOJsonString;
            function CreatePODataForRPT(poNumber, language, culture, formattedBlockAddress) {
                // Takes into account an user exit.
                var extraFields = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.GetExtraPORPTFields");
                if (extraFields) {
                    Sys.Helpers.Extend(true, PORPTMapping, extraFields);
                }
                var info = {
                    language: language,
                    culture: culture,
                    poNumber: poNumber,
                    formattedBlockAddress: formattedBlockAddress
                };
                var POData = {
                    header: {},
                    logo: {},
                    companyInfo: {},
                    tables: {}
                };
                function FillValues(element, defaultGetValue) {
                    var poData = POData[element];
                    Sys.Helpers.Object.ForEach(PORPTMapping[element], function (data, field) {
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
                            dataValue
                                .Then(function (value) {
                                poData[field] = value instanceof Date ? Sys.Helpers.Date.ToUTCDate(value) : value;
                            });
                        }
                        else {
                            poData[field] = dataValue instanceof Date ? Sys.Helpers.Date.ToUTCDate(dataValue) : dataValue;
                        }
                    });
                }
                if (PORPTMapping.header) {
                    FillValues("header");
                    if (Lib.Purchasing.POEdition.ChangesManager.HasChangeInForm() && Data.GetValue("RevisionDateTime__") == null) {
                        POData.header["RevisionDateTime__"] = Sys.Helpers.Date.ToUTCDate(new Date());
                    }
                }
                if (PORPTMapping.logo) {
                    FillValues("logo");
                }
                if (PORPTMapping.companyInfo) {
                    var cc = Data.GetValue("CompanyCode__");
                    var companyInfos_1 = Lib.P2P.CompanyCodesValue.GetValues(cc);
                    if (Object.keys(companyInfos_1).length > 0) {
                        FillValues("companyInfo", function (data) {
                            return companyInfos_1[data];
                        });
                    }
                    else {
                        Log.Info("Error: No record found for company code '" + cc + "'");
                    }
                }
                if (PORPTMapping.tables) {
                    for (var key in PORPTMapping.tables) {
                        if (key) {
                            var tableMapping = PORPTMapping.tables[key];
                            var tableName = tableMapping.table || key;
                            if (tableMapping.fields) {
                                POData.tables[tableName] = Lib.P2P.Export.SerializeTable(tableName, tableMapping, info);
                            }
                            else {
                                Log.Info("Error: table '" + key + "' is missing 'fields' attribute");
                            }
                        }
                    }
                }
                if (POData.tables["LineItems__"].length > 0) {
                    var contractNumbers = POData.tables["LineItems__"].reduce(function (acc, item) {
                        return acc.indexOf(item.ItemContractNumber__) >= 0 ? acc : acc.concat([item.ItemContractNumber__]);
                    }, []);
                    var firstItem_1 = POData.tables["LineItems__"][0];
                    if (contractNumbers.length === 1) {
                        POData.header["ContractNumber__"] = firstItem_1.ItemContractNumber__ || "";
                    }
                    if (Lib.Purchasing.IsMultiShipTo()) {
                        var isFirstLineAddressEmpty = Sys.Helpers.IsEmpty(firstItem_1.ItemShipToCompany__) && Sys.Helpers.IsEmpty(firstItem_1.ItemShipToAddress__);
                        var isAllSameAddress = Sys.Helpers.Array.Every(POData.tables["LineItems__"], function (item) {
                            return item.ItemShipToCompany__ === firstItem_1.ItemShipToCompany__ &&
                                item.ItemShipToAddress__ === firstItem_1.ItemShipToAddress__;
                        });
                        POData.companyInfo["MultiShipTo"] = !isAllSameAddress;
                        if (isAllSameAddress && !isFirstLineAddressEmpty) {
                            POData.header["ShipToCompany__"] = firstItem_1.ItemShipToCompany__;
                            POData.header["ShipToAddress__"] = firstItem_1.ItemShipToAddress__;
                        }
                    }
                }
                // Group taxCode
                var taxes = POData.tables["TaxSummary__"];
                var length = taxes.length;
                if (taxes.length > 0) {
                    for (var i = length - 1; i >= 0; --i) {
                        for (var j = 0; j < i; ++j) {
                            if (taxes[j].TaxRate__ == taxes[i].TaxRate__) {
                                taxes[j].TaxCode__ += "," + taxes[i].TaxCode__;
                                taxes[j].TaxDescription__ = "";
                                taxes[j].NetAmount__ += taxes[i].NetAmount__;
                                var taxAmount = new Sys.Decimal(taxes[j].NetAmount__ || 0).mul(taxes[j].TaxRate__ || 0).div(100);
                                taxes[j].TaxAmount__ = taxAmount.toNumber();
                                POData.tables["TaxSummary__"].splice(i, 1);
                            }
                        }
                    }
                }
                if (POData.tables["AdditionalFees__"].length > 0) {
                    POData.tables["LineItems__"].push({});
                    var additionnalFeesSummary = {};
                    var rowToRemove = [];
                    for (var i = 0; i < POData.tables["AdditionalFees__"].length; i++) {
                        var row = POData.tables["AdditionalFees__"][i];
                        if (additionnalFeesSummary[row.ItemDescription__ + row.ItemTaxCode__]) {
                            var additionnalFee = additionnalFeesSummary[row.ItemDescription__ + row.ItemTaxCode__];
                            rowToRemove.push(additionnalFee.Index);
                            additionnalFee.Index = i;
                            additionnalFee.NetAmount = new Sys.Decimal(additionnalFee.NetAmount || 0).add(row.ItemNetAmount__).toNumber();
                            row.ItemNetAmount__ = additionnalFee.NetAmount;
                            row.ItemUnitPrice__ = additionnalFee.NetAmount;
                        }
                        else {
                            additionnalFeesSummary[row.ItemDescription__ + row.ItemTaxCode__] = {
                                Index: i,
                                NetAmount: row.ItemNetAmount__
                            };
                        }
                    }
                    rowToRemove = rowToRemove.reverse();
                    for (var _i = 0, rowToRemove_1 = rowToRemove; _i < rowToRemove_1.length; _i++) {
                        var index = rowToRemove_1[_i];
                        POData.tables["AdditionalFees__"].splice(index, 1);
                    }
                    POData.tables["LineItems__"] = POData.tables["LineItems__"].concat(POData.tables["AdditionalFees__"]);
                }
                POData.tables["AdditionalFees__"] = [{ AdditionalFeeDescription__: "", Price__: 0 }];
                AddDecimalParamsByField(POData, info);
                return POData;
            }
            POExport.CreatePODataForRPT = CreatePODataForRPT;
            function GetTemplateContent(user, jsonFileName, culture) {
                return Sys.Helpers.Promise.Create(function (resolve) {
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
            POExport.GetTemplateContent = GetTemplateContent;
        })(POExport = Purchasing.POExport || (Purchasing.POExport = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
