/* LIB_DEFINITION{
  "name": "Lib_AP_Parameters_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "AP Library",
  "require": [
    "Lib_AP_V12.0.461.0",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Parameters;
        (function (Parameters) {
            Parameters.LineItemsPatternTable = {
                LastUsedValues: "AP - Last used values__",
                CodingTemplate: "AP - Templates__"
            };
            Parameters.limitLinesItems = 500;
            /**
            * Define the invoice parameters
            * Read the parameters in the table 'AP - Parameters'
            */
            function GetParameters(companyCode, vendorNumber, setParametersCallback) {
                var defaultValues = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.getDefaultParametersValues");
                var defaultDuplicateLevel = (defaultValues && defaultValues.defaultDuplicateLevel) || Sys.Parameters.GetInstance("AP").GetParameter("DefaultDuplicateCheckLevel") || "1";
                var defaultTouchlessValue = (defaultValues && defaultValues.defaultTouchlessValue) || "0";
                function queryParametersCallback(result) {
                    if (result && result.length > 0) {
                        var queryResult = result[0];
                        var lastAlertLevel = queryResult.DuplicateCheckAlertLevel__ || defaultDuplicateLevel;
                        var lastTouchlessEnabled = queryResult.TouchlessEnabled__ || defaultTouchlessValue;
                        var templateName = queryResult.Template__;
                        var lineItemsimporterMapping = queryResult.LineItemsImporterMapping__;
                        setParametersCallback(lastAlertLevel, lastTouchlessEnabled, templateName, lineItemsimporterMapping);
                    }
                    else {
                        setParametersCallback(defaultDuplicateLevel, defaultTouchlessValue, "", "");
                    }
                }
                var filter = "VendorNumber__=" + vendorNumber;
                filter = filter.AddCompanyCodeFilter(companyCode);
                Sys.GenericAPI.Query("AP - Parameters__", filter, ["DuplicateCheckAlertLevel__", "Template__", "TouchlessEnabled__", "LineItemsImporterMapping__"], queryParametersCallback, null, 1);
            }
            Parameters.GetParameters = GetParameters;
            /**
            * Non-PO mode only:
            * If a coding template is defined on the form, the coding values will be loaded from "AP - templates"
            * If no coding template is defined, the coding values will be loaded from "AP - Last used values"
            */
            function LoadTemplate(extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, TaxHelper, computeCallback, updateGLCCDescriptions, noResultsCallback, callbackForEachLine, callbackFinal, waitScreenDuringLoadTemplateAction) {
                if (waitScreenDuringLoadTemplateAction) {
                    waitScreenDuringLoadTemplateAction(true);
                }
                function queryCodingValuesCallback(result) {
                    if (result.length <= 0) {
                        if (noResultsCallback) {
                            noResultsCallback();
                        }
                        if (waitScreenDuringLoadTemplateAction) {
                            waitScreenDuringLoadTemplateAction(false);
                        }
                    }
                    else {
                        lineItemsTable.SetItemCount(0);
                        var curItem = lineItemsTable.AddItem();
                        curItem.SetValue("LineType__", Lib.P2P.LineType.GL);
                        var amountLeft = extractedNetAmount;
                        var setTaxRateAndTaxAmount = function (item, taxRates, nonDeductibleTaxRates, roundingModes) {
                            var taxRate = TaxHelper.setTaxRate(item, taxRates, nonDeductibleTaxRates, roundingModes);
                            var setTaxAmount = function (it, taxAmount) {
                                it.SetValue("TaxAmount__", taxAmount);
                                computeCallback("TaxAmount__");
                                updateGLCCDescriptions(it);
                            };
                            TaxHelper.computeTaxAmount(item.GetValue("Amount__"), taxRate, setTaxAmount, item);
                        };
                        for (var i = 0; i < result.length; i++) {
                            var r = result[i];
                            if (i > 0) {
                                curItem = curItem.AddItem();
                                curItem.SetValue("LineType__", Lib.P2P.LineType.GL);
                            }
                            curItem.SetValue("LineType__", Lib.P2P.LineType.GL);
                            curItem.SetValue("GLAccount__", r.GLAccount__);
                            curItem.SetValue("CostCenter__", r.CostCenter__);
                            curItem.SetValue("TaxCode__", r.TaxCode__);
                            Lib.P2P.fillCostTypeFromGLAccount(curItem);
                            // Custom dimensions
                            if (customDimensions && customDimensions.codingTemplates) {
                                for (var j in customDimensions.codingTemplates) {
                                    if (Object.prototype.hasOwnProperty.call(customDimensions.codingTemplates, j)) {
                                        curItem.SetValue(customDimensions.codingTemplates[j].nameInForm, r[customDimensions.codingTemplates[j].nameInTable]);
                                    }
                                }
                            }
                            if (templateName) {
                                curItem.SetValue("Description__", r.Description__);
                            }
                            if (r.AmountPercent__) {
                                var amountPercent = parseFloat(r.AmountPercent__);
                                var amount = extractedNetAmount * amountPercent / 100;
                                var fixedAmount = amount.toFixed(2);
                                curItem.SetValue("Amount__", fixedAmount);
                                amountLeft -= amount;
                            }
                            if (callbackForEachLine) {
                                callbackForEachLine(curItem);
                            }
                            else {
                                TaxHelper.getTaxRate(r.TaxCode__, "", companyCode, null, setTaxRateAndTaxAmount, curItem);
                            }
                        }
                        // Set the remaining amount on the first line, except for "template" mode where lines can be left without amount
                        if (!templateName && amountLeft !== 0) {
                            var firstItem = lineItemsTable.GetItem(0);
                            amountLeft += firstItem.GetValue("Amount__");
                            firstItem.SetValue("Amount__", amountLeft.toFixed(2));
                        }
                        if (callbackFinal) {
                            callbackFinal();
                        }
                        if (waitScreenDuringLoadTemplateAction) {
                            waitScreenDuringLoadTemplateAction(false);
                        }
                    }
                }
                var table = Parameters.LineItemsPatternTable.LastUsedValues;
                var filter = "VendorNumber__=" + vendorNumber;
                var attributes = [
                    "CompanyCode__",
                    "LineNumber__",
                    "GLAccount__",
                    "CostCenter__",
                    "TaxCode__",
                    "AmountPercent__"
                ];
                // Custom dimensions
                var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                if (customDimensions && customDimensions.codingTemplates) {
                    for (var i in customDimensions.codingTemplates) {
                        if (Object.prototype.hasOwnProperty.call(customDimensions.codingTemplates, i)) {
                            attributes.push(customDimensions.codingTemplates[i].nameInTable);
                        }
                    }
                }
                if (templateName) {
                    filter = "Template__=" + templateName;
                    table = Parameters.LineItemsPatternTable.CodingTemplate;
                    attributes.push("Description__");
                }
                filter = filter.AddCompanyCodeFilter(companyCode);
                Sys.GenericAPI.Query(table, filter, attributes, queryCodingValuesCallback, "LineNumber__ ASC", "no_limit");
            }
            Parameters.LoadTemplate = LoadTemplate;
            function SaveTemplate(table, invoice, dataBaseHelper) {
                //Save current line items pattern for Non PO Invoices, either as a "coding template" or as "last used values"
                if (invoice.GetValue("InvoiceType__") !== "Non-PO Invoice") {
                    return;
                }
                var lineItems = invoice.GetTable("LineItems__");
                if (lineItems && lineItems.GetItemCount() <= Lib.AP.Parameters.limitLinesItems) {
                    var vendorNumber = invoice.GetValue("VendorNumber__");
                    var companyCode = invoice.GetValue("CompanyCode__");
                    var templateName = invoice.GetValue("CodingTemplate__");
                    var netAmount = invoice.GetValue("NetAmount__");
                    var addOrModifyFilter = void 0;
                    // Specific
                    if (table === Parameters.LineItemsPatternTable.LastUsedValues) {
                        addOrModifyFilter = "&(VendorNumber__=" + vendorNumber;
                    }
                    else {
                        addOrModifyFilter = "&(Template__=" + templateName;
                    }
                    addOrModifyFilter += ")(CompanyCode__=" + companyCode + ")";
                    // Delete previous version
                    dataBaseHelper.RemoveTableRecord(table, addOrModifyFilter);
                    // Do not save MRU if a coding template is set
                    if (table === Parameters.LineItemsPatternTable.CodingTemplate || !invoice.GetValue("CodingTemplate__")) {
                        var nbItems = lineItems.GetItemCount();
                        var percentLeft = 100;
                        for (var i = nbItems - 1; i >= 0; i--) {
                            var item = lineItems.GetItem(i);
                            var GLAccount = item.GetValue("GLAccount__");
                            var costCenter = item.GetValue("CostCenter__");
                            var taxCode = item.GetValue("TaxCode__");
                            var amountPercent = 0;
                            // In MRU only, the remaining % is set on the first line
                            if (i === 0 && table === Parameters.LineItemsPatternTable.LastUsedValues) {
                                amountPercent = percentLeft;
                            }
                            else if (item.GetValue("Amount__") !== 0) {
                                if (netAmount) {
                                    amountPercent = item.GetValue("Amount__") * 100 / netAmount;
                                }
                                else {
                                    amountPercent = 0;
                                }
                            }
                            percentLeft -= amountPercent;
                            var fields = [
                                { name: "CompanyCode__", value: companyCode },
                                { name: "LineNumber__", value: i + 1 },
                                { name: "GLAccount__", value: GLAccount },
                                { name: "CostCenter__", value: costCenter },
                                { name: "TaxCode__", value: taxCode },
                                { name: "AmountPercent__", value: amountPercent.toFixed(5) }
                            ];
                            // Custom dimensions
                            var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                            if (customDimensions && customDimensions.codingTemplates) {
                                for (var j in customDimensions.codingTemplates) {
                                    if (Object.prototype.hasOwnProperty.call(customDimensions.codingTemplates, j)) {
                                        fields.push({ name: customDimensions.codingTemplates[j].nameInTable, value: item.GetValue(customDimensions.codingTemplates[j].nameInForm) });
                                    }
                                }
                            }
                            // Specific fields
                            if (table === Parameters.LineItemsPatternTable.CodingTemplate) {
                                fields.push({ name: "Template__", value: templateName });
                                fields.push({ name: "Description__", value: item.GetValue("Description__") });
                            }
                            else {
                                fields.push({ name: "VendorNumber__", value: vendorNumber });
                            }
                            dataBaseHelper.AddOrModifyTableRecord(table, addOrModifyFilter + "(LineNumber__=" + (i + 1) + ")", fields);
                        }
                    }
                }
            }
            Parameters.SaveTemplate = SaveTemplate;
            function SaveParameters(invoice, dataBaseHelper) {
                var vendorNumber = invoice.GetValue("VendorNumber__");
                var companyCode = invoice.GetValue("CompanyCode__");
                var addOrModifyFilter = "&(VendorNumber__=" + vendorNumber + ")(CompanyCode__=" + companyCode + ")";
                var fieldsToUpdate = [
                    { name: "VendorNumber__", value: vendorNumber },
                    { name: "CompanyCode__", value: companyCode },
                    { name: "LineItemsImporterMapping__", value: Variable.GetValueAsString("LineItemsImporterMapping") }
                ];
                if (Variable.GetValueAsString("ParametersChanged") === "true" || !dataBaseHelper.GetFirstRecordResult("AP - Parameters__", addOrModifyFilter, "VendorNumber__")) {
                    fieldsToUpdate.push({ name: "DuplicateCheckAlertLevel__", value: invoice.GetValue("DuplicateCheckAlertLevel__") });
                    if (invoice.GetValue("InvoiceType__") === "PO Invoice"
                        || invoice.GetValue("InvoiceType__") === "PO Invoice (as FI)"
                        || (invoice.GetValue("InvoiceType__") === "Non-PO Invoice" && Sys.Parameters.GetInstance("AP").GetParameter("EnableTouchlessForNonPoInvoice") === "1")) {
                        fieldsToUpdate.push({ name: "TouchlessEnabled__", value: invoice.GetValue("TouchlessEnabled__") });
                    }
                }
                if (invoice.GetValue("InvoiceType__") === "Non-PO Invoice") {
                    fieldsToUpdate.push({ name: "Template__", value: invoice.GetValue("CodingTemplate__") });
                }
                dataBaseHelper.AddOrModifyTableRecord("AP - Parameters__", addOrModifyFilter, fieldsToUpdate);
            }
            Parameters.SaveParameters = SaveParameters;
        })(Parameters = AP.Parameters || (AP.Parameters = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
