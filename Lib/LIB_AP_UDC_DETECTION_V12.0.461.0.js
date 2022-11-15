///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_AP_UDC_DETECTION_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server library containing helper to determine Unplanned Delivery Costs from keywords",
  "require": [
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_GenericAPI_Server",
    "Lib_AP_V12.0.461.0",
    "Lib_CrossCultural_V12.0.461.0",
    "Lib_CrossCultural_Amount_V12.0.461.0",
    "[Lib_AP_Customization_Extraction]"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var UnplannedDeliveryCosts;
        (function (UnplannedDeliveryCosts) {
            UnplannedDeliveryCosts.udcAreaCache = {};
            function getDimensions() {
                var erpManager = Lib.AP.GetInvoiceDocument();
                var dimensions = erpManager.GetAnalyticAxis();
                // call to user exit to extend dimension
                var customDimensions = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.UDCDetection.GetCustomDimensions") || [];
                if (customDimensions.length) {
                    dimensions = dimensions.concat(customDimensions);
                }
                return dimensions;
            }
            function queryAndSearchKeywords() {
                var dimensions = ["Description__", "Keyword__"].concat(getDimensions());
                var matchingUDCs = [];
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", ""), Sys.Helpers.LdapUtil.FilterNotExist("VendorNumber__"))).toString();
                var attributes = ["CompanyCode__", "VendorNumber__", "MaximumAmount__", "MaximumInvoicePercentage__"].concat(dimensions);
                Sys.GenericAPI.Query("P2P - UDC detection__", filter, attributes, function (results, error) {
                    if (!error && results && results.length) {
                        // Clean UDCList to search
                        var finalUDCList = [];
                        var nextItemToAdd = null;
                        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                            var result = results_1[_i];
                            if (!result.Keyword__) {
                                continue;
                            }
                            if (!nextItemToAdd || nextItemToAdd.Keyword__ !== result.Keyword__) {
                                if (nextItemToAdd) {
                                    finalUDCList.push(nextItemToAdd);
                                }
                                nextItemToAdd = result;
                            }
                            else if (!nextItemToAdd.VendorNumber__ && result.VendorNumber__) {
                                nextItemToAdd = result;
                            }
                        }
                        finalUDCList.push(nextItemToAdd);
                        var _loop_1 = function (result) {
                            var areaFound = Document.SearchString({
                                "valueToSearch": result.Keyword__,
                                "type": "regexp"
                            });
                            if (areaFound && areaFound.length) {
                                for (var _b = 0, areaFound_1 = areaFound; _b < areaFound_1.length; _b++) {
                                    var area = areaFound_1[_b];
                                    matchingUDCs.push({
                                        keyword: result.Keyword__,
                                        area: area,
                                        toleranceAmount: result.MaximumAmount__ ? parseFloat(result.MaximumAmount__) : null,
                                        tolerancePercentage: result.MaximumInvoicePercentage__ ? parseFloat(result.MaximumInvoicePercentage__) : null,
                                        dimensions: dimensions.reduce(function (acc, dim) {
                                            acc[dim] = result[dim];
                                            return acc;
                                        }, {})
                                    });
                                }
                            }
                        };
                        for (var _a = 0, finalUDCList_1 = finalUDCList; _a < finalUDCList_1.length; _a++) {
                            var result = finalUDCList_1[_a];
                            _loop_1(result);
                        }
                    }
                    else if (error) {
                        Log.Warn("Could not query table 'P2P - UDC detection__' : ".concat(error));
                    }
                }, "Keyword__ ASC");
                return matchingUDCs;
            }
            function copyValueFromFirstLine(lineItemsTable, item, dimension) {
                if (dimension === "TaxCode__" || dimension === "TaxJurisdiction__" || dimension === "CostCenter__" || dimension === "Buyer__") {
                    var refItem = lineItemsTable.GetItem(0);
                    if (refItem) {
                        item.SetValue(dimension, refItem.GetValue(dimension));
                        item.SetComputedValueSource(dimension, "unplanned delivery costs detection");
                        if (dimension === "CostCenter__") {
                            item.SetValue("CCDescription__", refItem.GetValue("CCDescription__"));
                            item.SetComputedValueSource("CCDescription__", "unplanned delivery costs detection");
                        }
                        if (dimension === "TaxCode__") {
                            item.SetValue("TaxRate__", refItem.GetValue("TaxRate__"));
                            item.SetComputedValueSource("TaxRate__", "unplanned delivery costs detection");
                        }
                    }
                }
            }
            function handleLineTolerance(lineAmount, toleranceAmount, tolerancePercentage, item) {
                var isInTolerance = true;
                var tolerance = null;
                if ((toleranceAmount || toleranceAmount === 0.0) && lineAmount >= toleranceAmount) {
                    isInTolerance = false;
                    tolerance = toleranceAmount.toString();
                }
                if (isInTolerance && (tolerancePercentage || tolerancePercentage === 0.0)) {
                    var totalInvoiceAmount = Data.GetValue("InvoiceAmount__");
                    toleranceAmount = totalInvoiceAmount * tolerancePercentage / 100;
                    if (lineAmount >= toleranceAmount) {
                        isInTolerance = false;
                        tolerance = tolerancePercentage.toString() + "%";
                    }
                }
                if (!isInTolerance) {
                    var warning = Language.Translate("_The value exceed the allowed tolerance ({0}) for this unplanned charge", false, tolerance);
                    item.SetWarning("Amount__", warning);
                    item.SetValue("TechnicalDetails__", "{\"ExtractedUDCOverTolerance\":{\"IsInTolerance\":false}}");
                }
            }
            function addUDCLines(UDCs) {
                var lineItemsTable = Data.GetTable("LineItems__");
                for (var _i = 0, UDCs_1 = UDCs; _i < UDCs_1.length; _i++) {
                    var UDC = UDCs_1[_i];
                    lineItemsTable.AddItem(false);
                    var item = lineItemsTable.GetItem(lineItemsTable.GetItemCount() - 1);
                    // fixed properties
                    UDC.dimensions.CostType__ = "OpEx";
                    UDC.dimensions.LineType__ = Lib.P2P.LineType.GL;
                    UDC.dimensions.ItemType__ = Lib.P2P.ItemType.AMOUNT_BASED;
                    UDC.dimensions.Keyword__ = UDC.keyword;
                    UDC.dimensions.Description__ = UDC.dimensions.Description__ || UDC.keyword;
                    UDC.dimensions.Amount__ = getAmountFromUDCArea(UDC.keyword, UDC.area);
                    // Set dimensions from matching UDC
                    for (var dimension in UDC.dimensions) {
                        if (Object.prototype.hasOwnProperty.call(UDC.dimensions, dimension)) {
                            var dimensionValue = UDC.dimensions[dimension];
                            if (dimensionValue) {
                                switch (dimension) {
                                    case "Keyword__":
                                        item.SetValue(dimension, UDC.area, dimensionValue);
                                        break;
                                    case "Description__":
                                        item.SetValue(dimension, UDC.area, dimensionValue);
                                        break;
                                    case "Amount__":
                                        item.SetValue(dimension, getUdcArea(UDC.keyword, UDC.area), dimensionValue);
                                        break;
                                    default:
                                        item.SetValue(dimension, dimensionValue);
                                        break;
                                }
                                dimensionAdditionalInformationHandler(item, dimension, dimensionValue);
                                item.SetComputedValueSource(dimension, "unplanned delivery costs detection");
                            }
                            else {
                                copyValueFromFirstLine(lineItemsTable, item, dimension);
                            }
                        }
                    }
                    copyValueFromFirstLine(lineItemsTable, item, "Buyer__");
                    var lineAmount = parseFloat(UDC.dimensions.Amount__);
                    if (UDC.dimensions.Amount__ && !isNaN(lineAmount)) {
                        // Handle line tolerance if one tolerance is defined
                        if (UDC.toleranceAmount || UDC.toleranceAmount === 0.0 || UDC.tolerancePercentage || UDC.tolerancePercentage === 0.0) {
                            handleLineTolerance(lineAmount, UDC.toleranceAmount, UDC.tolerancePercentage, item);
                        }
                    }
                }
            }
            function dimensionAdditionalInformationHandler(item, dimension, dimensionValue) {
                switch (dimension) {
                    case "CostCenter__":
                        setCCDescription(item, dimensionValue);
                        break;
                    case "GLAccount__":
                        setGLDescription(item, dimensionValue);
                        break;
                    case "ProjectCode__":
                        setProjetCodeDescription(item, dimensionValue);
                        break;
                    case "TaxCode__":
                        setTaxRate(item, dimensionValue);
                        break;
                    default:
                        break;
                }
            }
            function setCCDescription(item, costCenter) {
                if (!Lib.ERP.IsSAP()) {
                    setGenericAdditionalInformation(item, "CCDescription__", "AP - Cost centers__", "CostCenter__", costCenter, "Description__");
                }
                else {
                    var CCDescription = void 0;
                    if (Lib.AP.SAP.PurchaseOrder) {
                        var bapiParams = Lib.AP.SAP.PurchaseOrder.GetBapiParameters();
                        if (bapiParams) {
                            var companyCode = Lib.AP.GetLineItemCompanyCode(item);
                            CCDescription = Lib.AP.SAP.GetCostCenterDescription(bapiParams.GetBapi("RFC_READ_TABLE"), companyCode, costCenter);
                        }
                        else {
                            CCDescription = "";
                        }
                    }
                    else {
                        CCDescription = "";
                    }
                    item.SetValue("CCDescription__", CCDescription);
                }
                item.SetComputedValueSource("CCDescription__", "unplanned delivery costs detection");
            }
            function setGLDescription(item, GLAccount) {
                if (!Lib.ERP.IsSAP()) {
                    setGenericAdditionalInformation(item, "GLDescription__", "AP - G/L accounts__", "Account__", GLAccount, "Description__");
                }
                else {
                    var GLDescription = "";
                    if (Lib.AP.SAP.PurchaseOrder) {
                        var bapiParams = Lib.AP.SAP.PurchaseOrder.GetBapiParameters();
                        if (bapiParams) {
                            var companyCode = Lib.AP.GetLineItemCompanyCode(item);
                            GLDescription = Lib.AP.SAP.GetGLAccountDescriptionServer(bapiParams.GetBapi("BAPI_GL_ACC_GETDETAIL"), companyCode, GLAccount);
                        }
                    }
                    item.SetValue("GLDescription__", GLDescription);
                }
                item.SetComputedValueSource("GLDescription__", "unplanned delivery costs detection");
            }
            function setProjetCodeDescription(item, projectCode) {
                if (!Lib.ERP.IsSAP()) {
                    setGenericAdditionalInformation(item, "ProjectCodeDescription__", "P2P - Project codes__", "ProjectCode__", projectCode, "Description__");
                }
            }
            function setTaxRate(item, taxCode) {
                if (!Lib.ERP.IsSAP()) {
                    setGenericAdditionalInformation(item, "TaxRate__", "AP - Tax codes__", "TaxCode__", taxCode, "TaxRate__");
                }
                else {
                    item.SetValue("TaxRate__", Lib.AP.SAP.TaxHelper.getTaxRate(taxCode, item.GetValue("TaxJurisdiction__"), Data.GetValue("CompanyCode__"), Data.GetValue("InvoiceCurrency__"), function (_item, taxRates) { return taxRates.toString(); }, item));
                }
                item.SetComputedValueSource("TaxRate__", "unplanned delivery costs detection");
            }
            function setGenericAdditionalInformation(item, dimensionToFill, table, key, keyValue, column) {
                var filter = Sys.Helpers.LdapUtil.FilterEqual(key, keyValue).toString();
                Sys.GenericAPI.Query(table, filter.AddCompanyCodeFilter(Data.GetValue("CompanyCode__")), [column], function (result, error) {
                    if (error) {
                        Sys.GenericAPI.LogWarning("Error getting ".concat(table, " column ").concat(column, ": ").concat(error));
                    }
                    else if (result.length === 1) {
                        item.SetValue(dimensionToFill, result[0][column]);
                    }
                }, null, 1);
            }
            function getAmountFromUDCArea(keyword, keyWordArea) {
                var area = getUdcArea(keyword, keyWordArea), culture = getCulture();
                var extractedValue = null;
                if (area && culture) {
                    //  Extract candidates from area and culture
                    var areas = Document.ExtractSignedNumber(culture, area.page, area.x, area.y, area.width, area.height, true);
                    if (areas && areas.length === 1) //  If no or more than one candidate don't return an amount
                     {
                        //  Ensure extracted number will be not out of bounds
                        var cleanAmount = Lib.CrossCultural.Amount.ConvertToAmountOrFormattedString(areas[0].toString(), true, true, 2, false);
                        extractedValue = cleanAmount[0];
                        var extractedValueNumber = parseFloat(extractedValue);
                        if (isNaN(extractedValue) || extractedValueNumber > 99999999999999.98 || extractedValueNumber < -99999999999999.98) {
                            extractedValue = null;
                        }
                    }
                }
                return extractedValue;
            }
            function getUdcArea(keyWord, keyWordArea) {
                var companyCode = Data.GetValue("CompanyCode__"), vendorNumber = Data.GetValue("VendorNumber__");
                var areaJson;
                if (!Lib.AP.UnplannedDeliveryCosts.udcAreaCache[keyWord]) {
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqual("Keyword__", keyWord)).toString();
                    Sys.GenericAPI.Query("P2P - UDC area__", filter, ["Area__"], function (result, error) {
                        if (error) {
                            Sys.GenericAPI.LogWarning("Error getting P2P - UDC area__ colmun Area__: ".concat(error));
                        }
                        else if (result.length === 1) {
                            areaJson = JSON.parse(result[0].Area__);
                            Lib.AP.UnplannedDeliveryCosts.udcAreaCache[keyWord] = areaJson;
                        }
                    }, null, 1);
                }
                areaJson = Lib.AP.UnplannedDeliveryCosts.udcAreaCache[keyWord];
                if (!areaJson) {
                    return null;
                }
                return Document.GetArea(keyWordArea.page, keyWordArea.x + areaJson.xDiff, keyWordArea.y + areaJson.yDiff, areaJson.width, areaJson.height);
            }
            function getCulture() {
                var culture = null;
                if (Sys.ScriptInfo.IsClient()) {
                    culture = Sys.Helpers.Globals.User.culture;
                }
                else {
                    culture = Lib.P2P.GetValidatorOrOwner() ? Lib.P2P.GetValidatorOrOwner().GetValue("Culture") : null;
                }
                return culture;
            }
            function ExtractFromKeywords() {
                var matchingUDCs = queryAndSearchKeywords(); //  Query keywords from CT and search for them through the document
                if (matchingUDCs.length > 0) {
                    Log.Info("UnplannedDeliveryCosts Extraction - found ".concat(matchingUDCs.length, " matching UDC(s) from keywords"));
                    addUDCLines(matchingUDCs); //  Add a line item for every UDC found
                }
            }
            UnplannedDeliveryCosts.ExtractFromKeywords = ExtractFromKeywords;
        })(UnplannedDeliveryCosts = AP.UnplannedDeliveryCosts || (AP.UnplannedDeliveryCosts = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
