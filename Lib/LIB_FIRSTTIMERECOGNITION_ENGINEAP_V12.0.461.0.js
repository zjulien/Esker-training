///#GLOBALS Lib
/* LIB_DEFINITION{
  "name": "Lib_FirstTimeRecognition_EngineAP_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_FirstTimeRecognition_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var FirstTimeRecognition;
    (function (FirstTimeRecognition) {
        var EngineAP;
        (function (EngineAP) {
            // Constants
            var SINGLE_TAX_RATE_EXTRACTION_MODE = 1;
            var MULTIPLE_TAX_RATE_EXTRACTION_MODE = 2;
            var NO_EXPLICIT_NET_AMOUNT_EXTRACTION_MODE = 4;
            var NO_EXPLICIT_RELATIONSHIP_EXTRACTION_MODE = 8;
            var NULL_TAX_RATE_EXTRACTION_MODE = 16;
            var DEFAULT_EXTRACTION_MODE = SINGLE_TAX_RATE_EXTRACTION_MODE | MULTIPLE_TAX_RATE_EXTRACTION_MODE | NO_EXPLICIT_RELATIONSHIP_EXTRACTION_MODE;
            var COMPLETE_MATCH_DEC = 1;
            var COMPLETE_MATCH_INT = 2;
            var NO_TR_DEC = 3;
            var NO_TR_INT = 4;
            var NO_NA_DEC = 5;
            var NO_NA_INT = 6;
            var NO_NA_NO_TR_DEC = 7;
            var NO_NA_NO_TR_INT = 8;
            var NULL_TR_DEC = 9;
            var NULL_TR_INT = 10;
            var UNALIGNED_NULL_TR_DEC = 11;
            var UNALIGNED_NULL_TR_INT = 12;
            var NONE = 13;
            var InvoiceDocumentAP = /** @class */ (function (_super) {
                __extends(InvoiceDocumentAP, _super);
                function InvoiceDocumentAP() {
                    var _this = _super.call(this) || this;
                    _this.twot = null;
                    _this.tr = null;
                    _this.ta = null;
                    _this.twt = null;
                    _this.uc = null;
                    _this.docd = null;
                    _this.docn = null;
                    _this.headerFields = {};
                    _this.currency = null;
                    _this.documentType = null;
                    _this.lineItems = [];
                    _this.theoreticalMissingValue = null;
                    _this.foundAmountsPrio = NONE;
                    _this.rawCandidates = [];
                    _this.trCandidates = [];
                    _this.taCandidates = [];
                    _this.twtCandidates = [];
                    _this.ucCandidates = [];
                    _this.twotCandidates = [];
                    _this.pagesToBeIgnored = {};
                    _this.headerPage = null;
                    _this.headerFirstPageArea = null;
                    _this.vatNumber = null;
                    _this.enableFuzzySearch = false;
                    _this.pageIgnoreThreshold = 0;
                    _this.spaceTolerance = 1.0;
                    _this.headerFieldsAlignmentTolerance = 0;
                    _this.currentAnchorArea = null;
                    _this.amountScopeTolerance = 0;
                    _this.amountAlternateScopeWidthTolerance = 0;
                    _this.amountAlternateScopeHeightTolerance = 0;
                    _this.amountAlternateScopeEnableSubsequentPagesSearch = false;
                    _this.amountHeaderMargin = 0;
                    _this.amountFooterMargin = 0;
                    _this.amountAlignmentTolerance = 0;
                    _this.amountConstraintGrossAmountLocation = true;
                    _this.amountPreventGrossAboveTax = false;
                    _this.amountCurrencyTolerance = 0;
                    _this.amountAnchorKeywords = [];
                    _this.amountExpectedTaxRates = [];
                    _this.amountExpectedCultures = [];
                    _this.amountEnableIntegerExtraction = false;
                    _this.amountIntegerValidityThreshold = 0;
                    _this.amountMaximumValue = 1000000000000000000000;
                    _this.amountMaximumNumberOfDecimals = 2;
                    // MF20140623_1 - Changing ALL_EXTRACTION_MODE to DEFAULT_EXTRACTION_MODE
                    _this.amountExtractionMode = DEFAULT_EXTRACTION_MODE;
                    _this.amountSearchOnCoverPageFirst = false;
                    _this.amountGetLastCandidatesFirst = true;
                    _this.amountAllowUnplannedCostsDetection = false;
                    // MFL20140918_1 - Prevent the search to look for amounts around a currency and focus on specified keyords instead)
                    _this.amountPreventCurrencyDrivenSearch = false;
                    // CR20141024 - Sort twt amounts by amount before position if true, only by position if false
                    _this.amountSortTWTByAmountFirst = false;
                    _this.expectedCurrencies = [];
                    // MFL20140917_1 Fallback: If no currency was found, we switch to the default currency
                    _this.defaultCurrency = "";
                    //20140618-2 a table with the different authorised document types
                    _this.otherDocumentTypes = {};
                    _this.defaultDocumentType = "";
                    _this.documentDateHeaderMargin = 0;
                    // MFL20140916_1 - Deploying Mandatory/Exclusion/Preferred Keywords as well as IgnoreAreas concept
                    _this.documentDatePreferredKeywords = [];
                    _this.documentDateExclusionKeywords = [];
                    _this.documentDateMandatoryKeywords = [];
                    _this.documentDateIgnoredAreas = [];
                    _this.documentDateExpectedCultures = [];
                    _this.documentDateExpectMonthBeforeDate = false;
                    _this.documentDateValidityRangeLowerBound = null;
                    _this.documentDateValidityRangeUpperBound = null;
                    // MFL20141016_2 Allow a date to be offsetted (for Thai buddhist calendar)
                    _this.documentDateAllowedYearOffset = 0;
                    // MFL20140819_3 Added ability to filter out candidates based on a list of mandatoryKeywords
                    _this.documentNumberMandatoryKeywords = {};
                    _this.documentNumberExclusionKeywords = {};
                    _this.documentNumberPreferredKeywords = {};
                    // MFL20140916_1 - Deploying Mandatory/Exclusion/Preferred Keywords as well as IgnoreAreas concept
                    _this.documentNumberIgnoredAreas = [];
                    _this.documentNumberPreventSpaceExtraction = false;
                    _this.enableLineItemsRecognition = false;
                    // MF20140901_1
                    _this.integerCurrencies = [];
                    return _this;
                }
                InvoiceDocumentAP.prototype.InitParameters = function (params) {
                    for (var name in params) {
                        if (Object.prototype.hasOwnProperty.call(params, name)) {
                            this[name] = params[name];
                        }
                    }
                };
                InvoiceDocumentAP.prototype.Run = function () {
                    if (this.computedCurrency) {
                        this.bypassCurrency = true;
                        if (this.computedCurrency.area) {
                            this.currency = this.computedCurrency;
                        }
                    }
                    if (this.computedDocumentDate) {
                        this.bypassDocumentDate = true;
                        if (this.computedDocumentDate.area) {
                            this.docd = this.computedDocumentDate;
                        }
                    }
                    if (this.computedDocumentNumber) {
                        this.bypassDocumentNumber = true;
                        if (this.computedDocumentNumber.area) {
                            this.docn = this.computedDocumentNumber;
                        }
                    }
                    if (this.computedGrossAmount && this.computedGrossAmount.area) {
                        this.twt = this.computedGrossAmount;
                    }
                    if (this.computedNetAmount && this.computedNetAmount.area) {
                        this.twot = this.computedNetAmount;
                    }
                    if (!this.bypassAmounts) {
                        var nbPages = Document.GetPageCount();
                        this.bypassAmounts = Boolean(this.computedGrossAmount) && Boolean(this.computedNetAmount) || nbPages > 50;
                    }
                    return this.ParseAll();
                };
                InvoiceDocumentAP.prototype.GetField = function (name) {
                    if (name === "OrderNumber") {
                        return this.GetHeaderField("OrderNumber");
                    }
                    if (name === "GoodIssueNumber") {
                        return this.GetHeaderField("GoodIssueNumber");
                    }
                    else if (Object.prototype.hasOwnProperty.call(this, name)) {
                        return this[name];
                    }
                    return Object.prototype.hasOwnProperty.call(this, "Get" + name) ? this["Get" + name]() : null;
                };
                InvoiceDocumentAP.prototype.GetFieldCandidates = function (name) {
                    return this.GetField(name);
                };
                InvoiceDocumentAP.prototype.GetLineItemField = function (index, name) {
                    if (index >= 0 && index < this.lineItems.length) {
                        var lineItem = this.lineItems[index];
                        return Object.prototype.hasOwnProperty.call(lineItem, name) ? lineItem[name] : null;
                    }
                    return null;
                };
                InvoiceDocumentAP.prototype.GetLineItemFieldCandidates = function (index, name) {
                    if (index >= 0 && index < this.lineItems.length) {
                        var lineItemCandidates = this.lineItemsCandidates[index];
                        return Object.prototype.hasOwnProperty.call(lineItemCandidates, name) ? lineItemCandidates[name] : null;
                    }
                    return null;
                };
                // Methods
                InvoiceDocumentAP.prototype.SetEnableFuzzySearch = function (v) {
                    this.enableFuzzySearch = v;
                };
                InvoiceDocumentAP.prototype.SetPageIgnoreThreshold = function (v) {
                    this.pageIgnoreThreshold = v;
                };
                InvoiceDocumentAP.prototype.SetSpaceTolerance = function (v) {
                    this.spaceTolerance = v;
                };
                InvoiceDocumentAP.prototype.SetHeaderFieldsAlignmentTolerance = function (v) {
                    this.headerFieldsAlignmentTolerance = v;
                };
                InvoiceDocumentAP.prototype.SetAmountScopeTolerance = function (v) {
                    this.amountScopeTolerance = v;
                };
                InvoiceDocumentAP.prototype.SetAmountAlternateScopeWidthTolerance = function (v) {
                    this.amountAlternateScopeWidthTolerance = v;
                };
                InvoiceDocumentAP.prototype.SetAmountAlternateScopeHeightTolerance = function (v) {
                    this.amountAlternateScopeHeightTolerance = v;
                };
                InvoiceDocumentAP.prototype.SetAmountAlternateScopeEnableSubsequentPagesSearch = function (v) {
                    this.amountAlternateScopeEnableSubsequentPagesSearch = v;
                };
                InvoiceDocumentAP.prototype.SetAmountHeaderMargin = function (v) {
                    this.amountHeaderMargin = v;
                };
                InvoiceDocumentAP.prototype.SetAmountFooterMargin = function (v) {
                    this.amountFooterMargin = v;
                };
                InvoiceDocumentAP.prototype.SetAmountAlignmentTolerance = function (v) {
                    this.amountAlignmentTolerance = v;
                };
                InvoiceDocumentAP.prototype.SetAmountConstraintGrossAmountLocation = function (v) {
                    this.amountConstraintGrossAmountLocation = v;
                };
                InvoiceDocumentAP.prototype.SetAmountPreventGrossAboveTax = function (v) {
                    this.amountPreventGrossAboveTax = v;
                };
                InvoiceDocumentAP.prototype.SetAmountCurrencyTolerance = function (v) {
                    this.amountCurrencyTolerance = v;
                };
                InvoiceDocumentAP.prototype.SetAmountTaxRates = function (v) {
                    this.amountExpectedTaxRates = v;
                };
                InvoiceDocumentAP.prototype.SetAmountAnchors = function (v) {
                    this.amountAnchorKeywords = v;
                };
                InvoiceDocumentAP.prototype.SetAmountCultures = function (v) {
                    this.amountExpectedCultures = v;
                };
                InvoiceDocumentAP.prototype.SetAmountEnableIntegerExtraction = function (v) {
                    this.amountEnableIntegerExtraction = v;
                };
                InvoiceDocumentAP.prototype.SetAmountIntegerValidityThreshold = function (v) {
                    this.amountIntegerValidityThreshold = v;
                };
                InvoiceDocumentAP.prototype.SetAmountMaxValue = function (v) {
                    this.amountMaximumValue = v;
                };
                InvoiceDocumentAP.prototype.SetAmountMaxNumberOfDecimalPlaces = function (v) {
                    this.amountMaximumNumberOfDecimals = v;
                };
                InvoiceDocumentAP.prototype.SetAmountExtractionMode = function (v) {
                    this.amountExtractionMode = v;
                };
                InvoiceDocumentAP.prototype.SetAmountSearchOnCoverPageFirst = function (v) {
                    this.amountSearchOnCoverPageFirst = v;
                };
                InvoiceDocumentAP.prototype.SetAmountGetLastCandidatesFirst = function (v) {
                    this.amountGetLastCandidatesFirst = v;
                };
                InvoiceDocumentAP.prototype.SetAmountAllowUnplannedCostsDetection = function (v) {
                    this.amountAllowUnplannedCostsDetection = v;
                };
                // MFL20140918_1 - Prevent the search to look for amounts around a currency and focus on specified keyords instead)
                InvoiceDocumentAP.prototype.SetAmountPreventCurrencyDrivenSearch = function (v) {
                    this.amountPreventCurrencyDrivenSearch = v;
                };
                InvoiceDocumentAP.prototype.AddCurrency = function (v, w) {
                    // MFL20140901_3 Array contains a sequence of objects "key=>value"
                    if (this.expectedCurrencies === null) {
                        this.expectedCurrencies = [];
                    }
                    var obj = {};
                    obj[v] = w;
                    this.expectedCurrencies.push(obj);
                };
                // MFL20140917_1 Fallback: If no currency was found, we switch to the default currency
                InvoiceDocumentAP.prototype.SetDefaultCurrency = function (v) {
                    this.defaultCurrency = v;
                };
                // MFL20140819_4 Refactoring document type search
                InvoiceDocumentAP.prototype.SetDefaultDocumentType = function (v) {
                    // MFL20140916_2 - Removing default Document type keywords
                    this.defaultDocumentType = v;
                    this.documentNumberMandatoryKeywords[v] = [];
                    this.documentNumberExclusionKeywords[v] = [];
                    this.documentNumberPreferredKeywords[v] = [];
                };
                InvoiceDocumentAP.prototype.AddAlternateDocumentType = function (v, w) {
                    this.otherDocumentTypes[v] = w;
                    this.documentNumberMandatoryKeywords[v] = [];
                    this.documentNumberExclusionKeywords[v] = [];
                    this.documentNumberPreferredKeywords[v] = [];
                };
                InvoiceDocumentAP.prototype.SetDocumentDateHeaderMargin = function (v) {
                    this.documentDateHeaderMargin = v;
                };
                // MFL20140916_1 - Deploying Mandatory/Exclusion/Preferred Keywords as well as IgnoreAreas concept
                InvoiceDocumentAP.prototype.SetDocumentDateIgnoredAreas = function (v) {
                    this.documentDateIgnoredAreas = v;
                };
                InvoiceDocumentAP.prototype.SetDocumentDatePreferredKeywords = function (v) {
                    this.documentDatePreferredKeywords = v;
                };
                InvoiceDocumentAP.prototype.SetDocumentDateMandatoryKeywords = function (v) {
                    this.documentDateMandatoryKeywords = v;
                };
                InvoiceDocumentAP.prototype.SetDocumentDateExclusionKeywords = function (v) {
                    this.documentDateExclusionKeywords = v;
                };
                InvoiceDocumentAP.prototype.SetDocumentDateCultures = function (v) {
                    this.documentDateExpectedCultures = v;
                };
                InvoiceDocumentAP.prototype.SetDocumentDateExpectMonthBeforeDate = function (v) {
                    this.documentDateExpectMonthBeforeDate = v;
                };
                InvoiceDocumentAP.prototype.SetDocumentDateValidityRangeLowerBound = function (v) {
                    this.documentDateValidityRangeLowerBound = v;
                };
                InvoiceDocumentAP.prototype.SetDocumentDateValidityRangeUpperBound = function (v) {
                    this.documentDateValidityRangeUpperBound = v;
                };
                // MFL20141016_2 Allow a date to be offsetted (for Thai buddhist calendar)
                InvoiceDocumentAP.prototype.SetDocumentDateAllowedYearOffset = function (v) {
                    this.documentDateAllowedYearOffset = v;
                };
                // MFL20140916_1 - Deploying Mandatory/Exclusion/Preferred Keywords as well as IgnoreAreas concept
                InvoiceDocumentAP.prototype.SetDocumentNumberIgnoredAreas = function (v) {
                    this.documentNumberIgnoredAreas = v;
                };
                // MFL20140819_3 Added ability to filter out candidates based on a list of mandatoryKeywords
                InvoiceDocumentAP.prototype.SetDocumentNumberMandatoryKeywords = function (v, w) {
                    if (v === null) {
                        for (var x in this.documentNumberMandatoryKeywords) {
                            if (Object.prototype.hasOwnProperty.call(this.documentNumberMandatoryKeywords, x)) {
                                this.documentNumberMandatoryKeywords[x] = w;
                            }
                        }
                    }
                    else {
                        this.documentNumberMandatoryKeywords[v] = w;
                    }
                };
                // MFL20140819_3 Added ability to filter out candidates based on a list of mandatoryKeywords
                InvoiceDocumentAP.prototype.SetDocumentNumberExclusionKeywords = function (v, w) {
                    if (v === null) {
                        for (var x in this.documentNumberExclusionKeywords) {
                            if (Object.prototype.hasOwnProperty.call(this.documentNumberExclusionKeywords, x)) {
                                this.documentNumberExclusionKeywords[x] = w;
                            }
                        }
                    }
                    else {
                        this.documentNumberExclusionKeywords[v] = w;
                    }
                };
                //20140618-2 add a new dimension to the keyword table to store the associated document type
                InvoiceDocumentAP.prototype.SetDocumentNumberPreferredKeywords = function (v, w) {
                    if (v === null) {
                        for (var x in this.documentNumberPreferredKeywords) {
                            if (Object.prototype.hasOwnProperty.call(this.documentNumberPreferredKeywords, x)) {
                                this.documentNumberPreferredKeywords[x] = w;
                            }
                        }
                    }
                    else {
                        this.documentNumberPreferredKeywords[v] = w;
                    }
                };
                InvoiceDocumentAP.prototype.SetDocumentNumberPreventSpaceExtraction = function (v) {
                    this.documentNumberPreventSpaceExtraction = v;
                };
                InvoiceDocumentAP.prototype.AddHeaderFieldDefinition = function (u, v, w, x, y, z) {
                    this.headerFields[u] = {
                        ranges: v,
                        exclusionRanges: w,
                        mandatoryKeywords: x,
                        exclusionKeywords: y,
                        preferredKeywords: z,
                        value: null,
                        values: []
                    };
                };
                InvoiceDocumentAP.prototype.SetEnableLineItemsRecognition = function (v) {
                    this.enableLineItemsRecognition = v;
                };
                // MF20140901_1
                InvoiceDocumentAP.prototype.SetIntegerCurrencies = function (v) {
                    this.integerCurrencies = v;
                };
                InvoiceDocumentAP.prototype.GetTaxRate = function () {
                    return this.tr;
                };
                InvoiceDocumentAP.prototype.GetTaxAmount = function () {
                    return this.ta;
                };
                InvoiceDocumentAP.prototype.GetNetAmount = function () {
                    return this.twot;
                };
                InvoiceDocumentAP.prototype.GetGrossAmount = function () {
                    return this.twt;
                };
                InvoiceDocumentAP.prototype.GetUnplannedCosts = function () {
                    return this.uc;
                };
                InvoiceDocumentAP.prototype.GetCurrency = function () {
                    return this.currency;
                };
                InvoiceDocumentAP.prototype.GetDocumentType = function () {
                    return this.documentType;
                };
                //20140618-2
                InvoiceDocumentAP.prototype.GetDocumentDate = function () {
                    return this.docd;
                };
                InvoiceDocumentAP.prototype.GetDocumentNumber = function () {
                    return this.docn;
                };
                InvoiceDocumentAP.prototype.GetHeaderField = function (name) {
                    return this.headerFields !== null && Object.prototype.hasOwnProperty.call(this.headerFields, name) ? this.headerFields[name].value : null;
                };
                // MFL20141016_1 - returning the whole set of candidates to allow check of candidates against database
                InvoiceDocumentAP.prototype.GetHeaderFieldCandidates = function (name) {
                    return this.headerFields !== null && Object.prototype.hasOwnProperty.call(this.headerFields, name) ? this.headerFields[name].values : null;
                };
                InvoiceDocumentAP.prototype.GetLineItems = function () {
                    return this.lineItems;
                };
                InvoiceDocumentAP.prototype.GetVATNumber = function () {
                    return this.vatNumber;
                };
                InvoiceDocumentAP.prototype.ParseAll = function () {
                    if (!this.bypassDocumentType) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLog("\n\n### DOCUMENT TYPE DETECTION ###\n");
                        this.findDocumentType();
                    }
                    //20140618-2
                    if (!this.bypassAmounts) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLog("### AMOUNTS DETECTION ###\n");
                        this.findAmounts();
                    }
                    if (!this.bypassCurrency) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLog("\n\n### CURRENCY DETECTION ###\n");
                        this.findCurrency();
                    }
                    if (!this.bypassDocumentDate) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLog("\n\n### DOCUMENT DATE DETECTION ###\n");
                        this.findDocumentDate();
                    }
                    if (!this.bypassDocumentNumber) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLog("\n\n### DOCUMENT NUMBER DETECTION ###\n");
                        this.findDocumentNumber();
                    }
                    if (!this.bypassVATNumber) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLog("\n\n### VAT NUMBER DETECTION ###\n");
                        this.findVATNumber();
                    }
                    for (var headerFieldName in this.headerFields) {
                        if (Object.prototype.hasOwnProperty.call(this.headerFields, headerFieldName)) {
                            Lib.FirstTimeRecognition.EngineBase.DebugLog("\n\n### HEADER FIELD " + headerFieldName + " DETECTION ###\n");
                            // MFL20141016_1 - returning the whole set of candidates to allow check of candidates against database
                            this.headerFields[headerFieldName].values = this.findNonDocumentNumber(this.headerFields[headerFieldName].ranges, this.headerFields[headerFieldName].exclusionRanges, this.headerFields[headerFieldName].mandatoryKeywords, this.headerFields[headerFieldName].exclusionKeywords, this.headerFields[headerFieldName].preferredKeywords, this.headerFields[headerFieldName].allPages);
                            this.headerFields[headerFieldName].value = this.headerFields[headerFieldName].values !== null ? this.headerFields[headerFieldName].values[0] : null;
                        }
                    }
                    if (this.enableLineItemsRecognition) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLog("\n\n### LINE ITEMS DETECTION ###\n");
                        this.findLineItems();
                    }
                };
                InvoiceDocumentAP.prototype.getHeaderFirstPageArea = function () {
                    if (this.headerPage !== null && this.headerFirstPageArea !== null) {
                        return true;
                    }
                    for (var i = 0; i < Document.GetPageCount(); ++i) {
                        if (!this.shouldIgnorePage(i)) {
                            this.headerPage = i;
                            break;
                        }
                    }
                    if (this.headerPage === null) {
                        return false;
                    }
                    this.headerFirstPageArea = Document.GetArea(this.headerPage, 0, 0, Document.GetPageWidth(this.headerPage), 2 * Document.GetPageHeight(this.headerPage) / 3);
                    return this.headerFirstPageArea != null;
                };
                // MFL20140919_1 - shouldIgnorePage: hasOwnProperty( xx ) instead of [xx] === null
                InvoiceDocumentAP.prototype.shouldIgnorePage = function (page) {
                    var pageAsStr = "" + page;
                    if (!Object.prototype.hasOwnProperty.call(this.pagesToBeIgnored, pageAsStr)) {
                        this.pagesToBeIgnored[pageAsStr] = this.pageIgnoreThreshold > 0 && Document.GetArea(page).toString().length > this.pageIgnoreThreshold;
                    }
                    return this.pagesToBeIgnored[pageAsStr];
                };
                InvoiceDocumentAP.prototype.collectTaxRateCandidates = function (forbiddenList) {
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("TR collect - BEGIN\n");
                    this.trCandidates = [];
                    if (this.amountExpectedTaxRates !== null && this.amountExpectedTaxRates.length > 0) {
                        for (var i = 0; i < this.rawCandidates.length; ++i) {
                            if (this.rawCandidates[i].decimalValue !== 0) {
                                var decimalTaxRateIndex = this.amountExpectedTaxRates.indexOf(Math.abs(Math.floor(this.rawCandidates[i].decimalValue * 100) / 100));
                                if (-1 !== decimalTaxRateIndex && (forbiddenList === null || -1 != forbiddenList.indexOf(this.amountExpectedTaxRates[decimalTaxRateIndex]))) {
                                    var am = this.rawCandidates[i];
                                    am.decimalValue = this.amountExpectedTaxRates[decimalTaxRateIndex];
                                    this.trCandidates.push(am);
                                    Lib.FirstTimeRecognition.EngineBase.DebugLog(am.decimalValue + " / ");
                                }
                            }
                        }
                        this.trCandidates.sort(function (a, b) {
                            return b.decimalValue - a.decimalValue;
                        });
                    }
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("\n");
                };
                InvoiceDocumentAP.prototype.collectTaxAmountCandidates = function (forbiddenList) {
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("TA collect - BEGIN\n");
                    this.taCandidates = [];
                    for (var i = 0; i < this.rawCandidates.length; ++i) {
                        if (forbiddenList !== null && -1 !== forbiddenList.indexOf(this.rawCandidates[i].decimalValue)) {
                            continue;
                        }
                        if (!this.amountEnableIntegerExtraction && !this.rawCandidates[i].decimal) {
                            continue;
                        }
                        //MFL20141001 - Removing constraing on TA <> 1 ( absolute value of rawCandidates[i]
                        this.taCandidates.push(this.rawCandidates[i]);
                        Lib.FirstTimeRecognition.EngineBase.DebugLog(this.rawCandidates[i].decimalValue + " / ");
                    }
                    this.taCandidates.sort(function (a, b) {
                        return b.decimalValue - a.decimalValue;
                    });
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("\n");
                };
                InvoiceDocumentAP.prototype.collectNetAmountCandidates = function (forbiddenList) {
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("TWOT collect - BEGIN\n");
                    this.twotCandidates = [];
                    for (var i = 0; i < this.rawCandidates.length; ++i) {
                        if (forbiddenList !== null && -1 != forbiddenList.indexOf(this.rawCandidates[i].decimalValue)) {
                            continue;
                        }
                        if (!this.rawCandidates[i].decimal && (!this.amountEnableIntegerExtraction || this.rawCandidates[i].decimalValue < this.amountIntegerValidityThreshold)) {
                            continue;
                        }
                        if (Math.abs(this.rawCandidates[i].decimalValue) > 1) {
                            for (var j = 0; j < this.rawCandidates.length; ++j) {
                                if (i != j && Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.rawCandidates[i].area, this.rawCandidates[j].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance) > 0) {
                                    this.twotCandidates.push(this.rawCandidates[i]);
                                    Lib.FirstTimeRecognition.EngineBase.DebugLog(this.rawCandidates[i].decimalValue + " / ");
                                    break;
                                }
                            }
                        }
                    }
                    // MFL20141006 - SortAlongReadingDirection instead of SortAlongGrossAmountRelevancy in order to better detect single line items
                    this.twotCandidates = Lib.FirstTimeRecognition.EngineBase.SortAreas(this.twotCandidates, Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, this.amountAlignmentTolerance, true, true);
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("\n");
                };
                InvoiceDocumentAP.prototype.collectUnplannedCostCandidates = function (forbiddenList) {
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("UC collect - BEGIN\n");
                    this.ucCandidates = [];
                    for (var i = 0; i < this.rawCandidates.length; ++i) {
                        if (forbiddenList !== null && -1 != forbiddenList.indexOf(this.rawCandidates[i].decimalValue)) {
                            continue;
                        }
                        if (!this.rawCandidates[i].decimal && (!this.amountEnableIntegerExtraction || this.rawCandidates[i].decimalValue < this.amountIntegerValidityThreshold)) {
                            continue;
                        }
                        if (Math.abs(this.rawCandidates[i].decimalValue) > 1) {
                            for (var j = 0; j < this.rawCandidates.length; ++j) {
                                if (i != j && Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.rawCandidates[i].area, this.rawCandidates[j].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance) > 0) {
                                    this.ucCandidates.push(this.rawCandidates[i]);
                                    Lib.FirstTimeRecognition.EngineBase.DebugLog(this.rawCandidates[i].decimalValue + " / ");
                                    break;
                                }
                            }
                        }
                    }
                    this.ucCandidates = Lib.FirstTimeRecognition.EngineBase.SortAreas(this.ucCandidates, Lib.FirstTimeRecognition.EngineBase.SortAlongGrossAmountRelevancy, this.amountAlignmentTolerance, true, true);
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("\n");
                };
                InvoiceDocumentAP.prototype.collectGrossAmountCandidates = function (forbiddenList) {
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("TWT collect - BEGIN\n");
                    this.twtCandidates = [];
                    for (var i = 0; i < this.rawCandidates.length; ++i) {
                        if (forbiddenList !== null && -1 != forbiddenList.indexOf(this.rawCandidates[i].decimalValue)) {
                            continue;
                        }
                        if (!this.rawCandidates[i].decimal && (!this.amountEnableIntegerExtraction || this.rawCandidates[i].decimalValue < this.amountIntegerValidityThreshold)) {
                            continue;
                        }
                        if (Math.abs(this.rawCandidates[i].decimalValue) > 1 && (!this.amountConstraintGrossAmountLocation || this.rawCandidates[i].area.x > Document.GetPageWidth(this.rawCandidates[i].area.page) / 2)) {
                            if (Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.rawCandidates[i].area, this.currentAnchorArea, false, this.amountAlignmentTolerance) > 0) {
                                this.twtCandidates.push(this.rawCandidates[i]);
                                Lib.FirstTimeRecognition.EngineBase.DebugLog(this.rawCandidates[i].decimalValue + " / ");
                                continue;
                            }
                            for (var j = 0; j < this.rawCandidates.length; ++j) {
                                if (i != j && Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.rawCandidates[i].area, this.rawCandidates[j].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance) > 0) {
                                    this.twtCandidates.push(this.rawCandidates[i]);
                                    Lib.FirstTimeRecognition.EngineBase.DebugLog(this.rawCandidates[i].decimalValue + " / ");
                                    break;
                                }
                            }
                        }
                    }
                    // CR20141024 - Sort twt amounts by amount before position if true, only by position if false
                    function sortAmount(a, b) {
                        if (a.decimalValue > b.decimalValue) {
                            return -1;
                        }
                        if (a.decimalValue < b.decimalValue) {
                            return 1;
                        }
                        // Lib.FirstTimeRecognition.EngineBase.SortAlongGrossAmountRelevancy(b, a, this.amountAlignmentTolerance);
                        // always return -1 as a and b are not Areas
                        return -1;
                    }
                    if (this.amountSortTWTByAmountFirst) {
                        this.twtCandidates.sort(sortAmount);
                    }
                    else {
                        this.twtCandidates = Lib.FirstTimeRecognition.EngineBase.SortAreas(this.twtCandidates, Lib.FirstTimeRecognition.EngineBase.SortAlongGrossAmountRelevancy, this.amountAlignmentTolerance, true, true);
                    }
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("\n");
                };
                InvoiceDocumentAP.prototype.findAmountsInArea = function (forbiddenTRList, forbiddenTAList, forbiddenUCList, forbiddenTWOTList, forbiddenTWTList, foundAmountsPrio) {
                    //Avoid multiple declaration
                    var j, k, l, m, n, o, p, uCostsAlignment, taxAmountAlignment;
                    if (!this.currentAnchorArea) {
                        return foundAmountsPrio;
                    }
                    Lib.FirstTimeRecognition.EngineBase.DebugLog("Considering Anchor " + this.currentAnchorArea.toString() + "  (" + this.currentAnchorArea.page + ": " + this.currentAnchorArea.x + ", " + this.currentAnchorArea.y + ")\n");
                    var YTolerance = Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(this.currentAnchorArea.page, this.amountScopeTolerance);
                    this.rawCandidates = Lib.FirstTimeRecognition.EngineBase.CollectAmountsInArea(Document.GetArea(this.currentAnchorArea.page, 0, this.currentAnchorArea.y - YTolerance, Document.GetPageWidth(this.currentAnchorArea.page), this.currentAnchorArea.height + YTolerance * 2), this.amountExpectedCultures, this.amountEnableIntegerExtraction, this.amountMaximumValue, this.amountMaximumNumberOfDecimals, this.spaceTolerance, this.amountAlignmentTolerance, this.enableFuzzySearch);
                    this.collectTaxRateCandidates(forbiddenTRList);
                    this.collectTaxAmountCandidates(forbiddenTAList);
                    if (this.amountAllowUnplannedCostsDetection) {
                        this.collectUnplannedCostCandidates(forbiddenUCList);
                    }
                    // Allow alternate areas to find more candidates for TWOT and TWT
                    var rightMostArea = null;
                    for (j = 0; j < this.rawCandidates.length; ++j) {
                        if (!this.rawCandidates[j].decimal && (!this.amountEnableIntegerExtraction || this.rawCandidates[j].decimalValue < this.amountIntegerValidityThreshold)) {
                            continue;
                        }
                        if (rightMostArea === null) {
                            rightMostArea = this.rawCandidates[j].area;
                        }
                        else {
                            var vertLineTolerance = this.amountAlignmentTolerance * (this.rawCandidates[j].area.height + rightMostArea.height) / 2;
                            if (Math.abs(rightMostArea.x + rightMostArea.width - (this.rawCandidates[j].area.x - this.rawCandidates[j].area.width)) < vertLineTolerance) {
                                if (rightMostArea.width < this.rawCandidates[j].area.width && rightMostArea.height < this.rawCandidates[j].area.height) {
                                    rightMostArea = this.rawCandidates[j].area;
                                }
                            }
                            else if (rightMostArea.x + rightMostArea.width < this.rawCandidates[j].area.x + this.rawCandidates[j].area.width) {
                                rightMostArea = this.rawCandidates[j].area;
                            }
                        }
                    }
                    if (null !== rightMostArea) {
                        YTolerance = Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(rightMostArea.page, this.amountAlternateScopeHeightTolerance);
                        var XTolerance = Lib.FirstTimeRecognition.EngineBase.XCM2DOTS(rightMostArea.page, this.amountAlternateScopeWidthTolerance);
                        var upperBound = rightMostArea.y + rightMostArea.height / 2 - YTolerance;
                        if (this.amountAlternateScopeEnableSubsequentPagesSearch && upperBound < 0) {
                            upperBound = 0;
                            for (j = rightMostArea.page; j-- > 0;) {
                                if (!this.shouldIgnorePage(j)) {
                                    this.rawCandidates = this.rawCandidates.concat(Lib.FirstTimeRecognition.EngineBase.CollectAmountsInArea(Document.GetArea(j, rightMostArea.x - XTolerance, Document.GetPageHeight(j) - YTolerance / 2, rightMostArea.width + 2 * XTolerance, YTolerance / 2), this.amountExpectedCultures, this.amountEnableIntegerExtraction, this.amountMaximumValue, this.amountMaximumNumberOfDecimals, this.spaceTolerance, this.amountAlignmentTolerance, this.enableFuzzySearch));
                                    break;
                                }
                            }
                        }
                        var lowerBound = rightMostArea.y + rightMostArea.height / 2 + YTolerance;
                        if (this.amountAlternateScopeEnableSubsequentPagesSearch && lowerBound > Document.GetPageHeight(rightMostArea.page)) {
                            lowerBound = Document.GetPageHeight(rightMostArea.page);
                            for (j = rightMostArea.page + 1; j < Document.GetPageCount(); ++j) {
                                if (!this.shouldIgnorePage(j)) {
                                    this.rawCandidates = this.rawCandidates.concat(Lib.FirstTimeRecognition.EngineBase.CollectAmountsInArea(Document.GetArea(j, rightMostArea.x - XTolerance, 0, rightMostArea.width + 2 * XTolerance, YTolerance / 2), this.amountExpectedCultures, this.amountEnableIntegerExtraction, this.amountMaximumValue, this.amountMaximumNumberOfDecimals, this.spaceTolerance, this.amountAlignmentTolerance, this.enableFuzzySearch));
                                    break;
                                }
                            }
                        }
                        this.rawCandidates = this.rawCandidates.concat(Lib.FirstTimeRecognition.EngineBase.CollectAmountsInArea(Document.GetArea(rightMostArea.page, rightMostArea.x - XTolerance, upperBound, rightMostArea.width + 2 * XTolerance, lowerBound - upperBound), this.amountExpectedCultures, this.amountEnableIntegerExtraction, this.amountMaximumValue, this.amountMaximumNumberOfDecimals, this.spaceTolerance, this.amountAlignmentTolerance, this.enableFuzzySearch));
                    }
                    this.collectNetAmountCandidates(forbiddenTWOTList);
                    this.collectGrossAmountCandidates(forbiddenTWTList);
                    var tr, ta, twt, twot, uc, totalsAlignment;
                    // #####################
                    // Looking for a complete match with a non-null tax rate
                    // #####################
                    if (this.amountExtractionMode & SINGLE_TAX_RATE_EXTRACTION_MODE) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Searching in SINGLE_TAX_RATE_EXTRACTION_MODE - Looking for a complete match with a non-null tax rate");
                        for (j = 0; foundAmountsPrio > COMPLETE_MATCH_DEC && j < this.trCandidates.length; ++j) {
                            tr = Math.abs(this.trCandidates[j].decimalValue);
                            for (k = 0; foundAmountsPrio > COMPLETE_MATCH_DEC && k < this.twtCandidates.length; ++k) {
                                twt = Math.abs(this.twtCandidates[k].decimalValue);
                                for (l = 0; foundAmountsPrio > COMPLETE_MATCH_DEC && l < this.twotCandidates.length; ++l) {
                                    twot = Math.abs(this.twotCandidates[l].decimalValue);
                                    if (twot >= twt || foundAmountsPrio == NO_TR_DEC && twt < Math.abs(this.twt.decimalValue) && tr == this.theoreticalMissingValue || !this.twtCandidates[k].decimal && !this.twotCandidates[l].decimal && foundAmountsPrio <= COMPLETE_MATCH_INT) {
                                        continue;
                                    }
                                    totalsAlignment = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twtCandidates[k].area, this.twotCandidates[l].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance);
                                    if (totalsAlignment > 0 || Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.trCandidates[j].area, this.twotCandidates[l].area, false, this.amountAlignmentTolerance) > 0) {
                                        if ((totalsAlignment & Lib.FirstTimeRecognition.EngineBase.ALIGNED_VERTICALLY) > 0 && this.twtCandidates[k].area.page == this.twotCandidates[l].area.page && this.twtCandidates[k].area.y < this.twotCandidates[l].area.y) {
                                            continue;
                                        }
                                        for (m = 0; foundAmountsPrio > COMPLETE_MATCH_DEC && m < this.taCandidates.length; ++m) {
                                            ta = Math.abs(this.taCandidates[m].decimalValue);
                                            if (this.taCandidates[m].area.y > this.twtCandidates[k].area.y + this.twtCandidates[k].area.height) {
                                                continue;
                                            }
                                            for (p = 0; foundAmountsPrio > COMPLETE_MATCH_DEC && p < this.ucCandidates.length + 1; ++p) {
                                                uc = p == this.ucCandidates.length ? 0 : Math.abs(this.ucCandidates[p].decimalValue);
                                                if (uc > twot) {
                                                    continue;
                                                }
                                                uCostsAlignment = 0;
                                                if (p < this.ucCandidates.length) {
                                                    uCostsAlignment = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twotCandidates[l].area, this.ucCandidates[p].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance);
                                                }
                                                if (p == this.ucCandidates.length || uCostsAlignment != Lib.FirstTimeRecognition.EngineBase.ALIGNED_OVERLAPPED && (uCostsAlignment & Lib.FirstTimeRecognition.EngineBase.ALIGNED_VERTICALLY) > 0) {
                                                    if (Math.abs(ta - (twot + uc) * tr / 100.0) <= this.amountCurrencyTolerance && Math.abs(twt - (twot + uc + ta)) <= this.amountCurrencyTolerance) {
                                                        this.tr = this.trCandidates[j];
                                                        this.twt = this.twtCandidates[k];
                                                        this.twot = this.twotCandidates[l];
                                                        this.ta = this.taCandidates[m];
                                                        this.uc = p == this.ucCandidates.length ? null : this.ucCandidates[p];
                                                        if (this.twtCandidates[k].decimal || this.twotCandidates[l].decimal) {
                                                            foundAmountsPrio = COMPLETE_MATCH_DEC;
                                                        }
                                                        else {
                                                            foundAmountsPrio = COMPLETE_MATCH_INT;
                                                        }
                                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found " + twot + " + " + uc + " + " + ta + " = " + twt + "; with prio=" + foundAmountsPrio);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // #####################
                    // Looking for a partial match with missing non-null tax rate. If found; the missing tax rate is sought on the whole page afterward
                    // #####################
                    if (this.amountExtractionMode & (SINGLE_TAX_RATE_EXTRACTION_MODE | MULTIPLE_TAX_RATE_EXTRACTION_MODE)) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Searching in SINGLE_TAX_RATE_EXTRACTION_MODE | MULTIPLE_TAX_RATE_EXTRACTION_MODE - Looking for a partial match with missing non-null tax rate. If found; the missing tax rate is sought on the whole page afterward");
                        for (k = 0; foundAmountsPrio > NO_TR_DEC && k < this.twtCandidates.length; ++k) {
                            twt = Math.abs(this.twtCandidates[k].decimalValue);
                            for (l = 0; foundAmountsPrio > NO_TR_DEC && l < this.twotCandidates.length; ++l) {
                                twot = Math.abs(this.twotCandidates[l].decimalValue);
                                if (twot >= twt || !this.twtCandidates[k].decimal && !this.twotCandidates[l].decimal && foundAmountsPrio <= NO_TR_INT) {
                                    continue;
                                }
                                totalsAlignment = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twtCandidates[k].area, this.twotCandidates[l].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance);
                                if ((totalsAlignment & Lib.FirstTimeRecognition.EngineBase.ALIGNED_VERTICALLY) > 0 && this.twtCandidates[k].area.page == this.twotCandidates[l].area.page && this.twtCandidates[k].area.y < this.twotCandidates[l].area.y) {
                                    continue;
                                }
                                for (m = 0; foundAmountsPrio > NO_TR_DEC && m < this.taCandidates.length; ++m) {
                                    ta = Math.abs(this.taCandidates[m].decimalValue);
                                    taxAmountAlignment = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.taCandidates[m].area, this.twotCandidates[l].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance);
                                    if (twot <= ta || this.amountPreventGrossAboveTax && this.taCandidates[m].area.y > this.twtCandidates[k].area.y + this.twtCandidates[k].area.height || totalsAlignment == 0 && taxAmountAlignment == 0) {
                                        continue;
                                    }
                                    for (p = 0; foundAmountsPrio > COMPLETE_MATCH_DEC && p < this.ucCandidates.length + 1; ++p) {
                                        uc = p == this.ucCandidates.length ? 0 : Math.abs(this.ucCandidates[p].decimalValue);
                                        if (uc > twot) {
                                            continue;
                                        }
                                        uCostsAlignment = 0;
                                        if (p < this.ucCandidates.length) {
                                            uCostsAlignment = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twotCandidates[l].area, this.ucCandidates[p].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance);
                                        }
                                        if (p == this.ucCandidates.length || uCostsAlignment != Lib.FirstTimeRecognition.EngineBase.ALIGNED_OVERLAPPED && (uCostsAlignment & Lib.FirstTimeRecognition.EngineBase.ALIGNED_VERTICALLY) > 0) {
                                            if (Math.abs(twt - (twot + uc + ta)) <= this.amountCurrencyTolerance) {
                                                if (this.amountExtractionMode & SINGLE_TAX_RATE_EXTRACTION_MODE) {
                                                    for (n = 0; n < this.amountExpectedTaxRates.length; ++n) {
                                                        if (Math.abs(ta - (twot + uc) * this.amountExpectedTaxRates[n] / 100) <= this.amountCurrencyTolerance) {
                                                            this.theoreticalMissingValue = this.amountExpectedTaxRates[n];
                                                            this.tr = null;
                                                            this.twt = this.twtCandidates[k];
                                                            this.twot = this.twotCandidates[l];
                                                            this.ta = this.taCandidates[m];
                                                            this.uc = p == this.ucCandidates.length ? null : this.ucCandidates[p];
                                                            if (this.twtCandidates[k].decimal || this.twotCandidates[l].decimal) {
                                                                foundAmountsPrio = NO_TR_DEC;
                                                            }
                                                            else {
                                                                foundAmountsPrio = NO_TR_INT;
                                                            }
                                                            Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found " + twot + " + " + uc + " + " + ta + " = " + twt + "; with prio=" + foundAmountsPrio);
                                                            // TODO
                                                            // Refactor using regexp-based search
                                                            var soughtPattern = [];
                                                            var base = void 0;
                                                            base = this.theoreticalMissingValue.toString();
                                                            if (this.theoreticalMissingValue == Math.round(this.theoreticalMissingValue)) {
                                                                soughtPattern.push(base + ",000%");
                                                                soughtPattern.push(base + ".000%");
                                                                soughtPattern.push(base + ",00%");
                                                                soughtPattern.push(base + ".00%");
                                                                soughtPattern.push(base + ",0%");
                                                                soughtPattern.push(base + ".0%");
                                                                soughtPattern.push(base + "%");
                                                                soughtPattern.push(base + ",000 %");
                                                                soughtPattern.push(base + ".000 %");
                                                                soughtPattern.push(base + ",00 %");
                                                                soughtPattern.push(base + ".00 %");
                                                                soughtPattern.push(base + ",0 %");
                                                                soughtPattern.push(base + ".0 %");
                                                                soughtPattern.push(base + " %");
                                                            }
                                                            else {
                                                                soughtPattern.push(base + "00%");
                                                                soughtPattern.push(base.replace(".", ",") + "00%");
                                                                soughtPattern.push(base + "0%");
                                                                soughtPattern.push(base.replace(".", ",") + "0%");
                                                                soughtPattern.push(base + "%");
                                                                soughtPattern.push(base.replace(".", ",") + "%");
                                                                soughtPattern.push(base + "00 %");
                                                                soughtPattern.push(base.replace(".", ",") + "00 %");
                                                                soughtPattern.push(base + "0 %");
                                                                soughtPattern.push(base.replace(".", ",") + "0 %");
                                                                soughtPattern.push(base + " %");
                                                                soughtPattern.push(base.replace(".", ",") + " %");
                                                            }
                                                            var currentPage = Document.GetArea(this.currentAnchorArea.page);
                                                            for (j = 0; this.tr == null && j < soughtPattern.length; ++j) {
                                                                var missingTRAreas = Document.SearchString(soughtPattern[j], currentPage, true, false);
                                                                for (o = 0; this.tr == null && o < missingTRAreas.length; ++o) {
                                                                    if (missingTRAreas[o].toString().length == soughtPattern[j].length) {
                                                                        // Recalculate in case the value has been modified while seeking space chars in amount
                                                                        // MF20140623_1 MF - Adding the fuzzy parameter (true)
                                                                        var standardStringValues = Lib.FirstTimeRecognition.EngineBase.AmountUnknownCultureToAmountStandardStringFormat(missingTRAreas[o].toString(), this.amountEnableIntegerExtraction, this.amountMaximumNumberOfDecimals, true);
                                                                        if (standardStringValues.length > 0) {
                                                                            var actualAmountValue = Lib.FirstTimeRecognition.EngineBase.AmountStandardStringFormatToDecimal(standardStringValues[0]);
                                                                            if (actualAmountValue !== null) {
                                                                                this.tr = new Lib.FirstTimeRecognition.EngineBase.AmountCandidate();
                                                                                this.tr.area = missingTRAreas[o];
                                                                                this.tr.standardStringValue = standardStringValues[0];
                                                                                this.tr.decimalValue = actualAmountValue;
                                                                                this.tr.decimal = -1 != this.tr.standardStringValue.indexOf(".");
                                                                                // Let us turn it to a complete match
                                                                                if (this.twtCandidates[k].decimal || this.twotCandidates[l].decimal) {
                                                                                    foundAmountsPrio = COMPLETE_MATCH_DEC;
                                                                                }
                                                                                else {
                                                                                    foundAmountsPrio = COMPLETE_MATCH_INT;
                                                                                }
                                                                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found " + twot + " + " + uc + " + " + ta + " = " + twt + "; with prio=" + foundAmountsPrio);
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            break;
                                                        }
                                                    }
                                                }
                                                else if ((totalsAlignment & taxAmountAlignment) > 0) {
                                                    this.theoreticalMissingValue = null;
                                                    this.tr = null;
                                                    this.twt = this.twtCandidates[k];
                                                    this.twot = this.twotCandidates[l];
                                                    this.ta = this.taCandidates[m];
                                                    this.uc = p == this.ucCandidates.length ? null : this.ucCandidates[p];
                                                    if (this.twtCandidates[k].decimal || this.twotCandidates[l].decimal) {
                                                        foundAmountsPrio = NO_TR_DEC;
                                                    }
                                                    else {
                                                        foundAmountsPrio = NO_TR_INT;
                                                    }
                                                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found " + twot + " + " + uc + " + " + ta + " = " + twt + "; with prio=" + foundAmountsPrio);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // #####################
                    // Looking for a partial match with missing net amount
                    // #####################
                    if (this.amountExtractionMode & NO_EXPLICIT_NET_AMOUNT_EXTRACTION_MODE) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Searching in NO_EXPLICIT_NET_AMOUNT_EXTRACTION_MODE - Looking for a partial match with missing net amount");
                        for (j = 0; foundAmountsPrio > NO_NA_DEC && j < this.trCandidates.length; ++j) {
                            tr = Math.abs(this.trCandidates[j].decimalValue);
                            for (k = 0; foundAmountsPrio > NO_NA_DEC && k < this.twtCandidates.length; ++k) {
                                twt = Math.abs(this.twtCandidates[k].decimalValue);
                                if (!this.twtCandidates[k].decimal && foundAmountsPrio <= NO_NA_DEC) {
                                    continue;
                                }
                                for (m = 0; foundAmountsPrio > NO_NA_DEC && m < this.taCandidates.length; ++m) {
                                    ta = Math.abs(this.taCandidates[m].decimalValue);
                                    taxAmountAlignment = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twtCandidates[k].area, this.taCandidates[m].area, false, this.amountAlignmentTolerance);
                                    if ((taxAmountAlignment & Lib.FirstTimeRecognition.EngineBase.ALIGNED_VERTICALLY) > 0 && this.twtCandidates[k].area.y < this.taCandidates[m].area.y) {
                                        continue;
                                    }
                                    if (Math.abs(ta - (twt - ta) * tr / 100.0) <= this.amountCurrencyTolerance) {
                                        this.twot = null;
                                        this.uc = null;
                                        this.tr = this.trCandidates[j];
                                        this.twt = this.twtCandidates[k];
                                        this.ta = this.taCandidates[m];
                                        // MF20140623_1 MF - Discarding the check on this.twotCandidates[l].decimal
                                        if (this.twtCandidates[k].decimal) {
                                            foundAmountsPrio = NO_NA_DEC;
                                        }
                                        else {
                                            foundAmountsPrio = NO_NA_INT;
                                        }
                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found (" + twt + " - " + ta + ") * " + tr + " + " + ta + " = " + twt + "; with prio=" + foundAmountsPrio);
                                    }
                                }
                            }
                        }
                    }
                    // #####################
                    // Looking for a partial match with missing net amount and missing tax rate
                    // #####################
                    if (this.amountExtractionMode & NO_EXPLICIT_NET_AMOUNT_EXTRACTION_MODE) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Searching in NO_EXPLICIT_NET_AMOUNT_EXTRACTION_MODE - Looking for a partial match with missing net amount and missing tax rate");
                        for (k = 0; foundAmountsPrio > NO_NA_NO_TR_DEC && k < this.twtCandidates.length; ++k) {
                            twt = Math.abs(this.twtCandidates[k].decimalValue);
                            if (!this.twtCandidates[k].decimal && foundAmountsPrio <= NO_NA_NO_TR_DEC) {
                                continue;
                            }
                            for (m = 0; foundAmountsPrio > NO_NA_NO_TR_DEC && m < this.taCandidates.length; ++m) {
                                ta = Math.abs(this.taCandidates[m].decimalValue);
                                taxAmountAlignment = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twtCandidates[k].area, this.taCandidates[m].area, false, this.amountAlignmentTolerance);
                                if ((taxAmountAlignment & Lib.FirstTimeRecognition.EngineBase.ALIGNED_VERTICALLY) > 0 && this.twtCandidates[k].area.y < this.taCandidates[m].area.y) {
                                    continue;
                                }
                                for (n = 0; foundAmountsPrio > NO_NA_NO_TR_DEC && n < this.amountExpectedTaxRates.length; ++n) {
                                    if (Math.abs(ta - (twt - ta) * this.amountExpectedTaxRates[n] / 100) <= this.amountCurrencyTolerance) {
                                        this.tr = null;
                                        this.twot = null;
                                        this.uc = null;
                                        this.twt = this.twtCandidates[k];
                                        this.ta = this.taCandidates[m];
                                        // MF20140623_1 MF - Discarding the check on this.twotCandidates[l].decimal
                                        if (this.twtCandidates[k].decimal) {
                                            foundAmountsPrio = NO_NA_NO_TR_DEC;
                                        }
                                        else {
                                            foundAmountsPrio = NO_NA_NO_TR_INT;
                                        }
                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found (" + twt + " - " + ta + ") * " + tr + " + " + ta + " = " + twt + "; with prio=" + foundAmountsPrio);
                                    }
                                }
                            }
                        }
                    }
                    // #####################
                    // Looking for a complete match with a null tax rate
                    // #####################
                    if (this.amountExtractionMode & NULL_TAX_RATE_EXTRACTION_MODE) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Searching in NULL_TAX_RATE_EXTRACTION_MODE - Looking for a complete match with a null tax rate");
                        for (k = 0; foundAmountsPrio > NULL_TR_DEC && k < this.twtCandidates.length; ++k) {
                            twt = Math.abs(this.twtCandidates[k].decimalValue);
                            for (l = 0; foundAmountsPrio > NULL_TR_DEC && l < this.twotCandidates.length; ++l) {
                                twot = Math.abs(this.twotCandidates[l].decimalValue);
                                if (!this.twtCandidates[k].decimal && !this.twotCandidates[l].decimal && foundAmountsPrio <= NULL_TR_INT) {
                                    continue;
                                }
                                //Lib.FirstTimeRecognition.EngineBase.DebugLogln( "twt: " + twt + "; twot: " + twot);
                                totalsAlignment = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twotCandidates[l].area, this.twtCandidates[k].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance);
                                if (totalsAlignment > 0 && totalsAlignment != Lib.FirstTimeRecognition.EngineBase.ALIGNED_OVERLAPPED) {
                                    for (p = 0; foundAmountsPrio > NULL_TR_DEC && p < this.ucCandidates.length + 1; ++p) {
                                        uc = p == this.ucCandidates.length ? 0 : Math.abs(this.ucCandidates[p].decimalValue);
                                        if (uc > twot) {
                                            continue;
                                        }
                                        uCostsAlignment = 0;
                                        if (p < this.ucCandidates.length) {
                                            uCostsAlignment = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twotCandidates[l].area, this.ucCandidates[p].area, this.amountAlternateScopeEnableSubsequentPagesSearch, this.amountAlignmentTolerance);
                                        }
                                        if (p == this.ucCandidates.length || uCostsAlignment != Lib.FirstTimeRecognition.EngineBase.ALIGNED_OVERLAPPED && (uCostsAlignment & Lib.FirstTimeRecognition.EngineBase.ALIGNED_VERTICALLY) > 0) {
                                            if (uc > 0 && Math.abs(twt - (twot + uc)) <= this.amountCurrencyTolerance || uc == 0 && twot == twt) {
                                                this.tr = null;
                                                this.ta = null;
                                                this.twt = this.twtCandidates[k];
                                                this.twot = this.twotCandidates[l];
                                                this.uc = p == this.ucCandidates.length ? null : this.ucCandidates[p];
                                                if (this.twtCandidates[k].decimal || this.twotCandidates[l].decimal) {
                                                    foundAmountsPrio = NULL_TR_DEC;
                                                }
                                                else {
                                                    foundAmountsPrio = NULL_TR_INT;
                                                }
                                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found " + twot + " + " + uc + " = " + twt + "; with prio=" + foundAmountsPrio);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // #####################
                    // Looking for a single appearance of TWT
                    // #####################
                    if (this.amountExtractionMode & NO_EXPLICIT_RELATIONSHIP_EXTRACTION_MODE) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Searching in NO_EXPLICIT_RELATIONSHIP_EXTRACTION_MODE - Looking for a single appearance of TWT");
                        for (k = 0; foundAmountsPrio > UNALIGNED_NULL_TR_DEC && k < this.twtCandidates.length; ++k) {
                            if (this.twtCandidates[k].decimal || foundAmountsPrio > UNALIGNED_NULL_TR_INT) {
                                this.twt = this.twtCandidates[k];
                                this.twot = null;
                                this.tr = null;
                                this.ta = null;
                                this.uc = null;
                            }
                            if (this.twtCandidates[k].decimal) {
                                foundAmountsPrio = UNALIGNED_NULL_TR_DEC;
                            }
                            else {
                                foundAmountsPrio = UNALIGNED_NULL_TR_INT;
                            }
                            Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found " + Math.abs(this.twtCandidates[k].decimalValue) + "; with prio=" + foundAmountsPrio);
                        }
                    }
                    return foundAmountsPrio;
                };
                InvoiceDocumentAP.prototype.findAmounts = function () {
                    if (!this.bypassAmounts) {
                        var i = void 0;
                        // MFL20140918_1 - Prevent the search to look for amounts around a currency and focus on specified keyords instead)
                        if (!this.amountPreventCurrencyDrivenSearch) {
                            if (this.amountAnchorKeywords == null || this.amountAnchorKeywords.length == 0) {
                                this.amountAnchorKeywords = ["%"];
                            }
                            else if (-1 == this.amountAnchorKeywords.indexOf("%")) {
                                this.amountAnchorKeywords.push("%");
                            }
                        }
                        // MFL20140901_1
                        if (this.integerCurrencies !== null && this.integerCurrencies.length > 0) {
                            this.findCurrency();
                            if (this.currency !== null && -1 != this.integerCurrencies.indexOf(this.currency.standardStringValue)) {
                                this.SetAmountEnableIntegerExtraction(true);
                            }
                        }
                        var tempAreas = void 0, anchorsAreas = [];
                        for (i = 0; i < this.amountAnchorKeywords.length; ++i) {
                            tempAreas = Document.SearchString(this.amountAnchorKeywords[i], false, false);
                            if (tempAreas !== null) {
                                for (var j = 0; j < tempAreas.length; ++j) {
                                    if (!this.shouldIgnorePage(tempAreas[j].page)) {
                                        if (tempAreas[j].y > Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(tempAreas[j].page, this.amountHeaderMargin) && tempAreas[j].y < Document.GetPageHeight(tempAreas[j].page) - Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(tempAreas[j].page, this.amountFooterMargin)) {
                                            anchorsAreas.push(tempAreas[j]);
                                        }
                                    }
                                }
                            }
                        }
                        if (this.amountSearchOnCoverPageFirst) {
                            anchorsAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(anchorsAreas, Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirectionCoverPagePrio, this.amountAlignmentTolerance, false, this.amountGetLastCandidatesFirst);
                        }
                        else {
                            anchorsAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(anchorsAreas, Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, this.amountAlignmentTolerance, false, this.amountGetLastCandidatesFirst);
                        }
                        for (i = 0; this.foundAmountsPrio > COMPLETE_MATCH_DEC && i < anchorsAreas.length; ++i) {
                            this.currentAnchorArea = anchorsAreas[i];
                            this.foundAmountsPrio = this.findAmountsInArea(null, null, null, null, null, this.foundAmountsPrio);
                        }
                        Lib.FirstTimeRecognition.EngineBase.DebugLog("\n1st run. Result: " + this.foundAmountsPrio + "\n");
                        if (this.foundAmountsPrio == NONE) {
                            this.SetAmountConstraintGrossAmountLocation(false);
                            for (i = 0; this.foundAmountsPrio > COMPLETE_MATCH_DEC && i < anchorsAreas.length; ++i) {
                                this.currentAnchorArea = anchorsAreas[i];
                                this.foundAmountsPrio = this.findAmountsInArea(null, null, null, null, null, this.foundAmountsPrio);
                            }
                            Lib.FirstTimeRecognition.EngineBase.DebugLog("\n2nd run (No detection); Trying without location constraint. Result: " + this.foundAmountsPrio + "\n");
                            // MFL201409´19_2 - PreventCurrencyDrivenSearch
                            if (!this.amountPreventCurrencyDrivenSearch && this.foundAmountsPrio == NONE) {
                                // MFL20140901_1
                                if (this.currency === null) {
                                    this.findCurrency();
                                }
                                if (this.currency !== null) {
                                    this.currentAnchorArea = this.currency.area;
                                    this.foundAmountsPrio = this.findAmountsInArea(null, null, null, null, null, this.foundAmountsPrio);
                                }
                                Lib.FirstTimeRecognition.EngineBase.DebugLog("\n3rd run (No detection); Trying with Currency as anchor. Result: " + this.foundAmountsPrio + "\n");
                            }
                        }
                        if (this.foundAmountsPrio <= COMPLETE_MATCH_INT && (this.amountExtractionMode & MULTIPLE_TAX_RATE_EXTRACTION_MODE) > 0) {
                            var fallback = false;
                            if (Lib.FirstTimeRecognition.EngineBase.AreAreasAligned([this.twt.area, this.twot.area, this.ta.area], false, this.amountAlignmentTolerance)) {
                                var previousTWT = this.twt;
                                var previousTWOT = this.twot;
                                var previousUC = this.uc;
                                var previousTA = this.ta;
                                var previousTR = this.tr;
                                var previousAmountConstraintLocationSetting = this.amountConstraintGrossAmountLocation;
                                var previousFoundAmountsPrio = this.foundAmountsPrio;
                                this.SetAmountConstraintGrossAmountLocation(false);
                                this.currentAnchorArea = this.twt.area;
                                this.SetAmountExtractionMode(SINGLE_TAX_RATE_EXTRACTION_MODE);
                                var previousExpectedTaxRates = [], tempExpectedTaxRates = [];
                                for (i = 0; i < this.amountExpectedTaxRates.length; ++i) {
                                    previousExpectedTaxRates.push(this.amountExpectedTaxRates[i]);
                                    if (this.amountExpectedTaxRates[i] != previousTR.decimalValue) {
                                        tempExpectedTaxRates.push(this.amountExpectedTaxRates[i]);
                                    }
                                }
                                this.SetAmountTaxRates(tempExpectedTaxRates);
                                var newPrio = this.findAmountsInArea([previousTR.decimalValue], null, null, null, null, NONE);
                                this.SetAmountTaxRates(previousExpectedTaxRates);
                                Lib.FirstTimeRecognition.EngineBase.DebugLog("\n4th run without tax rate = " + previousTR.decimalValue + " (Complete match found and amounts are aligned); Result: " + newPrio + "\n");
                                if (newPrio <= COMPLETE_MATCH_INT && Lib.FirstTimeRecognition.EngineBase.AreAreasAligned([this.twt.area, this.twot.area, this.ta.area], false, this.amountAlignmentTolerance) && Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twt.area, previousTWT.area, false, this.amountAlignmentTolerance) > 0 && Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.ta.area, previousTA.area, false, this.amountAlignmentTolerance) > 0 && Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(this.twot.area, previousTWOT.area, false, this.amountAlignmentTolerance) > 0) {
                                    this.SetAmountExtractionMode(MULTIPLE_TAX_RATE_EXTRACTION_MODE);
                                    this.foundAmountsPrio = NONE;
                                    var valuesToIgnore = [previousTWT.decimalValue, this.twt.decimalValue];
                                    for (i = 0; this.foundAmountsPrio > NO_TR_DEC && i < anchorsAreas.length; ++i) {
                                        this.currentAnchorArea = anchorsAreas[i];
                                        this.foundAmountsPrio = this.findAmountsInArea(null, valuesToIgnore, null, valuesToIgnore, valuesToIgnore, this.foundAmountsPrio);
                                    }
                                    Lib.FirstTimeRecognition.EngineBase.DebugLog("\n5th run with detection mode = " + MULTIPLE_TAX_RATE_EXTRACTION_MODE + "; Result: " + this.foundAmountsPrio + "\n");
                                    if (this.foundAmountsPrio > NO_TR_INT) {
                                        fallback = true;
                                    }
                                }
                                else {
                                    fallback = true;
                                }
                                if (fallback) {
                                    this.SetAmountConstraintGrossAmountLocation(previousAmountConstraintLocationSetting);
                                    this.twt = previousTWT;
                                    this.twot = previousTWOT;
                                    this.uc = previousUC;
                                    this.ta = previousTA;
                                    this.tr = previousTR;
                                    this.foundAmountsPrio = previousFoundAmountsPrio;
                                }
                            }
                        }
                    }
                };
                InvoiceDocumentAP.prototype.findLineItemsInArea = function (lineItemsAreaTop, lineItemsAreaTopPage, lineItemsAreaBottom, lineItemsAreaBottomPage, allowNoUnitPrice) {
                    var lineItemsCandidates = [];
                    var i, j, k;
                    for (k = lineItemsAreaTopPage; k <= lineItemsAreaBottomPage; ++k) {
                        var currentLineItemsAreaWidth = Document.GetPageWidth(k) / 2;
                        var currentLineItemsAreaTop = k == lineItemsAreaTopPage ? lineItemsAreaTop : 0;
                        var currentLineItemsAreaBottom = k == lineItemsAreaBottomPage ? lineItemsAreaBottom : Document.GetPageHeight(k);
                        var lineItemsArea = Document.GetArea(k, currentLineItemsAreaWidth, currentLineItemsAreaTop, currentLineItemsAreaWidth, currentLineItemsAreaBottom - currentLineItemsAreaTop);
                        var lineItemsAmounts = Lib.FirstTimeRecognition.EngineBase.CollectAmountsInArea(lineItemsArea, this.amountExpectedCultures, this.amountEnableIntegerExtraction, this.amountMaximumValue, this.amountMaximumNumberOfDecimals, this.spaceTolerance, this.amountAlignmentTolerance, this.enableFuzzySearch);
                        for (i = 0; i < lineItemsAmounts.length; ++i) {
                            var skipThisOne = false;
                            for (j = 0; !skipThisOne && j < lineItemsCandidates.length; ++j) {
                                if (Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(lineItemsAmounts[i].area, lineItemsCandidates[j][0], false, this.amountAlignmentTolerance) & Lib.FirstTimeRecognition.EngineBase.ALIGNED_HORIZONTALLY) {
                                    skipThisOne = true;
                                }
                            }
                            if (!skipThisOne) {
                                lineItemsCandidates.push(Lib.FirstTimeRecognition.EngineBase.ScanLineItem(lineItemsAmounts[i].area, Lib.FirstTimeRecognition.EngineBase.SEEK_BOTH, this.spaceTolerance, this.amountAlignmentTolerance));
                            }
                        }
                    }
                    lineItemsCandidates.sort(function (a, b) {
                        return a[0].page == b[0].page ? a[0].y - b[0].y : a[0].page - b[0].page;
                    });
                    this.lineItems = [];
                    var amountsAreas = [];
                    var subTotalAmount = 0;
                    for (i = 0; i < lineItemsCandidates.length; ++i) {
                        var lineItemAmounts = [];
                        var desc = null, maxNumberOfChars = 0;
                        for (j = 0; j < lineItemsCandidates[i].length; ++j) {
                            lineItemAmounts = lineItemAmounts.concat(Lib.FirstTimeRecognition.EngineBase.CollectAmountsInArea(lineItemsCandidates[i][j], this.amountExpectedCultures, this.amountEnableIntegerExtraction, this.amountMaximumValue, 4, this.spaceTolerance, this.amountAlignmentTolerance, this.enableFuzzySearch));
                            var currentNumberOfChars = Math.max(maxNumberOfChars, lineItemsCandidates[i][j].toString().replace(/[^A-Z]/ig, "").length);
                            if (currentNumberOfChars > maxNumberOfChars) {
                                maxNumberOfChars = currentNumberOfChars;
                                desc = lineItemsCandidates[i][j];
                            }
                        }
                        lineItemAmounts = Lib.FirstTimeRecognition.EngineBase.SortAreas(lineItemAmounts, Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, this.amountAlignmentTolerance, true, true);
                        var li = null;
                        for (j = 0; li === null && j < lineItemAmounts.length; ++j) {
                            for (k = j + 1; li === null && k < lineItemAmounts.length; ++k) {
                                for (var l = k + 1; li === null && l < lineItemAmounts.length; ++l) {
                                    if (lineItemAmounts[l].decimalValue > 0 && lineItemAmounts[j].decimalValue != 0 && Math.abs(lineItemAmounts[j].decimalValue - lineItemAmounts[k].decimalValue * lineItemAmounts[l].decimalValue) < this.amountCurrencyTolerance) {
                                        li = new Lib.FirstTimeRecognition.EngineBase.LineItem();
                                        li.quantity = lineItemAmounts[l];
                                        li.unitPrice = lineItemAmounts[k];
                                        li.amount = lineItemAmounts[j];
                                        li.description = desc;
                                        amountsAreas.push(li.amount.area);
                                        subTotalAmount += li.amount.decimalValue;
                                        this.lineItems.push(li);
                                    }
                                }
                            }
                        }
                        for (j = 0; allowNoUnitPrice && li === null && j < lineItemAmounts.length; ++j) {
                            if (Lib.FirstTimeRecognition.EngineBase.AreAreasAlignedWithArea(amountsAreas, lineItemAmounts[j].area, false, this.amountAlignmentTolerance)) {
                                if (lineItemAmounts[j].decimalValue > 0) {
                                    if (subTotalAmount != lineItemAmounts[j].decimalValue || lineItemsAreaTopPage == lineItemsAreaBottomPage) {
                                        li = new Lib.FirstTimeRecognition.EngineBase.LineItem();
                                        li.amount = lineItemAmounts[j];
                                        li.description = desc;
                                        amountsAreas.push(li.amount.area);
                                        subTotalAmount += li.amount.decimalValue;
                                        this.lineItems.push(li);
                                    }
                                }
                                break;
                            }
                        }
                    }
                    return subTotalAmount;
                };
                InvoiceDocumentAP.prototype.findLineItems = function () {
                    var lineItemsAreaTop, lineItemsAreaTopPage, lineItemsAreaBottom, lineItemsAreaBottomPage;
                    if (this.docn !== null || this.docd !== null) {
                        if (this.docn !== null && this.docd !== null) {
                            var invnBeforeInvd = Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection(this.docn.area, this.docd.area, this.headerFieldsAlignmentTolerance) == -1;
                            lineItemsAreaTop = invnBeforeInvd ? this.docd.area.y + this.docd.area.height : this.docn.area.y + this.docn.area.height;
                            lineItemsAreaTopPage = invnBeforeInvd ? this.docd.area.page : this.docn.area.page;
                        }
                        else if (this.docn !== null) {
                            lineItemsAreaTop = this.docn.area.y + this.docn.area.height;
                            lineItemsAreaTopPage = this.docn.area.page;
                        }
                        else {
                            lineItemsAreaTop = this.docd.area.y + this.docd.area.height;
                            lineItemsAreaTopPage = this.docd.area.page;
                        }
                    }
                    else {
                        lineItemsAreaTop = 0;
                        lineItemsAreaTopPage = 0;
                    }
                    if (this.twot !== null || this.twt !== null) {
                        if (this.twot !== null && this.twt !== null) {
                            var twotBeforeTwt = Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection(this.twot.area, this.twt.area, this.headerFieldsAlignmentTolerance) == -1;
                            lineItemsAreaBottom = twotBeforeTwt ? this.twot.area.y : this.twt.area.y;
                            lineItemsAreaBottomPage = twotBeforeTwt ? this.twot.area.page : this.twt.area.page;
                        }
                        else if (this.twot !== null) {
                            lineItemsAreaBottom = this.twot.area.y;
                            lineItemsAreaBottomPage = this.twot.area.page;
                        }
                        else {
                            lineItemsAreaBottom = this.twt.area.y;
                            lineItemsAreaBottomPage = this.twt.area.page;
                        }
                    }
                    else {
                        lineItemsAreaBottom = Document.GetPageHeight(0);
                        lineItemsAreaBottomPage = 0;
                    }
                    if (lineItemsAreaTopPage > lineItemsAreaBottomPage || lineItemsAreaTopPage == lineItemsAreaBottomPage && lineItemsAreaTop > lineItemsAreaBottom) {
                        lineItemsAreaTop = 0;
                        lineItemsAreaTopPage = 0;
                        lineItemsAreaBottom = Document.GetPageHeight(0);
                        lineItemsAreaBottomPage = 0;
                    }
                    var lineItemsTotal = this.findLineItemsInArea(lineItemsAreaTop, lineItemsAreaTopPage, lineItemsAreaBottom, lineItemsAreaBottomPage, false);
                    if (this.twot !== null && this.twt !== null && lineItemsTotal != this.twot.decimalValue && lineItemsTotal != this.twt.decimalValue) {
                        if (this.lineItems.length < 3 && (this.foundAmountsPrio == NULL_TR_DEC || this.foundAmountsPrio == NULL_TR_INT)) {
                            this.findLineItemsInArea(this.twot.area.y, this.twot.area.page, this.twot.area.y + this.twot.area.height, this.twot.area.page, false);
                        }
                        else {
                            this.findLineItemsInArea(lineItemsAreaTop, lineItemsAreaTopPage, lineItemsAreaBottom, lineItemsAreaBottomPage, true);
                        }
                    }
                    /*for (let i = 0; i < this.lineItems.length; ++i) {
                        if (this.lineItems[i].quantity !== null) {
                            this.lineItems[i].quantity.area.Highlight(true, 0xff00ff, 0xff0000);
                        }

                        if (this.lineItems[i].unitPrice !== null) {
                            this.lineItems[i].unitPrice.area.Highlight(true, 0x00ffff, 0xff0000);
                        }

                        if (this.lineItems[i].amount !== null) {
                            this.lineItems[i].amount.area.Highlight(true, 0x0000ff, 0xff0000);
                        }

                        if (this.lineItems[i].description !== null) {
                            this.lineItems[i].description.Highlight(true, 0xffff00, 0xff0000);
                        }
                    }*/
                };
                InvoiceDocumentAP.prototype.findCurrency = function () {
                    if (!this.bypassCurrency) {
                        var i = void 0;
                        var currencyPage = null, referenceArea = null;
                        if (this.twt !== null) {
                            currencyPage = this.twt.area.page;
                            referenceArea = this.twt.area;
                        }
                        else if (this.twot !== null) {
                            currencyPage = this.twot.area.page;
                            referenceArea = this.twot.area;
                        }
                        else if (this.getHeaderFirstPageArea()) {
                            currencyPage = this.headerFirstPageArea.page;
                        }
                        //20140618-1 Correction: extend total area and find the currency in the same area in the page
                        if (referenceArea !== null) {
                            referenceArea = Document.GetArea(referenceArea.page, 0, referenceArea.y - Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(referenceArea.page, 1), Document.GetPageWidth(referenceArea.page), referenceArea.height + Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(referenceArea.page, 2));
                        }
                        // MFL20140917_1 - Allow fallback even if currencyPage is null
                        var results = void 0;
                        if (currencyPage !== null) {
                            //if we have an area delimited by the amount we first try to find the currency in the corresponding extended area
                            if (referenceArea !== null) {
                                results = Lib.FirstTimeRecognition.EngineBase.CollectCurrenciesInArea(referenceArea, this.expectedCurrencies);
                                //20140618-1 Call tool function
                                if (results != null && results.length > 0) {
                                    for (i = 0; i < results.length; ++i) {
                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("currency candidate: " + results[i].standardStringValue);
                                    }
                                    if (this.twt !== null) {
                                        Lib.FirstTimeRecognition.EngineBase.SetReferenceAreaForSorting(this.twt.area);
                                        results = Lib.FirstTimeRecognition.EngineBase.SortAreas(results, Lib.FirstTimeRecognition.EngineBase.SortAlongReferenceAreaProximity, this.headerFieldsAlignmentTolerance, true, false);
                                    }
                                    this.currency = new Lib.FirstTimeRecognition.EngineBase.TextCandidate();
                                    this.currency.area = results[0].area;
                                    this.currency.standardStringValue = results[0].standardStringValue;
                                    return;
                                }
                            }
                            //if no currency has been found before, we look for it globally in the whole page
                            results = Lib.FirstTimeRecognition.EngineBase.CollectCurrenciesInArea(currencyPage, this.expectedCurrencies);
                            if (results !== null && results.length > 0) {
                                for (i = 0; i < results.length; ++i) {
                                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("currency candidate: " + results[i].standardStringValue);
                                }
                                if (this.twt !== null) {
                                    Lib.FirstTimeRecognition.EngineBase.SetReferenceAreaForSorting(this.twt.area);
                                    results = Lib.FirstTimeRecognition.EngineBase.SortAreas(results, Lib.FirstTimeRecognition.EngineBase.SortAlongReferenceAreaProximity, this.headerFieldsAlignmentTolerance, true, false);
                                }
                                this.currency = new Lib.FirstTimeRecognition.EngineBase.TextCandidate();
                                this.currency.area = results[0].area;
                                this.currency.standardStringValue = results[0].standardStringValue;
                                return;
                            }
                        }
                        // MFL20140821_2 Fallback: If no currency was found onto currency page, then we look back onto Header Page
                        if (this.getHeaderFirstPageArea()) {
                            results = Lib.FirstTimeRecognition.EngineBase.CollectCurrenciesInArea(this.headerPage, this.expectedCurrencies);
                            if (results !== null && results.length > 0) {
                                this.currency = new Lib.FirstTimeRecognition.EngineBase.TextCandidate();
                                this.currency.area = results[0].area;
                                this.currency.standardStringValue = results[0].standardStringValue;
                                return;
                            }
                        }
                        // MFL20140917_1 Fallback: If no currency was found, we switch to the default currency
                        if (this.defaultCurrency !== null) {
                            this.currency = new Lib.FirstTimeRecognition.EngineBase.TextCandidate();
                            this.currency.area = null;
                            this.currency.standardStringValue = this.defaultCurrency;
                        }
                    }
                };
                InvoiceDocumentAP.prototype.findDocumentDate = function () {
                    if (!this.bypassDocumentDate) {
                        // MF20140623_1 MF - Set this.docd to null so that the first return does not let the default value in case of successive calls
                        this.docd = null;
                        if (!this.getHeaderFirstPageArea()) {
                            return;
                        }
                        //Avoid multiple definition
                        var cndCnt = void 0;
                        var documentDateAreas = Lib.FirstTimeRecognition.EngineBase.CollectDatesInArea(this.headerFirstPageArea, this.documentDateExpectedCultures, this.documentDateExpectMonthBeforeDate, this.documentDateValidityRangeLowerBound, this.documentDateValidityRangeUpperBound, this.enableFuzzySearch);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentDateAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Collection " + documentDateAreas[cndCnt].standardStringValue);
                            }
                        }
                        // MFL20141016_2 Allow a date to be offsetted (for Thai buddhist calendar)
                        if (this.documentDateAllowedYearOffset != 0) {
                            Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Collection (with Offset: " + this.documentDateAllowedYearOffset + ") ");
                            this.documentDateValidityRangeLowerBound.setFullYear(this.documentDateValidityRangeLowerBound.getFullYear() + this.documentDateAllowedYearOffset);
                            this.documentDateValidityRangeUpperBound.setFullYear(this.documentDateValidityRangeUpperBound.getFullYear() + this.documentDateAllowedYearOffset);
                            var offsettedDocumentDateAreas = Lib.FirstTimeRecognition.EngineBase.CollectDatesInArea(this.headerFirstPageArea, this.documentDateExpectedCultures, this.documentDateExpectMonthBeforeDate, this.documentDateValidityRangeLowerBound, this.documentDateValidityRangeUpperBound, this.enableFuzzySearch);
                            for (var i = 0; i < offsettedDocumentDateAreas.length; ++i) {
                                offsettedDocumentDateAreas[i].dateValue.setFullYear(offsettedDocumentDateAreas[i].dateValue.getFullYear() - this.documentDateAllowedYearOffset);
                                offsettedDocumentDateAreas[i].standardStringValue = Lib.FirstTimeRecognition.EngineBase.DateJSToDateStandardStringFormat(offsettedDocumentDateAreas[i].dateValue);
                            }
                            if (offsettedDocumentDateAreas.length > 0) {
                                documentDateAreas = documentDateAreas.concat(offsettedDocumentDateAreas);
                                if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                                    for (cndCnt = 0; cndCnt < documentDateAreas.length; ++cndCnt) {
                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Collection (with Offset: " + this.documentDateAllowedYearOffset + ") " + documentDateAreas[cndCnt].standardStringValue);
                                    }
                                }
                            }
                        }
                        /*let superarea = Document.GetArea(this.headerFirstPageArea.page, 0, 0, Document.GetPageWidth(this.headerFirstPageArea.page), Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(this.headerFirstPageArea.page, this.documentDateHeaderMargin));
                        superarea.Highlight(true, 0xff5555, 0xff0000);*/
                        // MFL20140916_1 - Deploying Mandatory/Exclusion/Preferred Keywords as well as IgnoreAreas concept
                        if (this.documentDateIgnoredAreas === null) {
                            this.documentDateIgnoredAreas = [Document.GetArea(this.headerFirstPageArea.page, 0, 0, Document.GetPageWidth(this.headerFirstPageArea.page), Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(this.headerFirstPageArea.page, this.documentDateHeaderMargin))];
                        }
                        else {
                            this.documentDateIgnoredAreas.push(Document.GetArea(this.headerFirstPageArea.page, 0, 0, Document.GetPageWidth(this.headerFirstPageArea.page), Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(this.headerFirstPageArea.page, this.documentDateHeaderMargin)));
                        }
                        documentDateAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidatesAreasBased(documentDateAreas, this.documentDateIgnoredAreas, true);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentDateAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Exclusion (area) " + documentDateAreas[cndCnt].standardStringValue);
                            }
                        }
                        // MFL20140916_1 - Deploying Mandatory/Exclusion/Preferred Keywords as well as IgnoreAreas concept
                        documentDateAreas = Lib.FirstTimeRecognition.EngineBase.KeepCandidates(documentDateAreas, this.documentDateMandatoryKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentDateAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Selection (mandatory) " + documentDateAreas[cndCnt].standardStringValue);
                            }
                        }
                        documentDateAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidates(documentDateAreas, this.documentDateExclusionKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentDateAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Exclusion " + documentDateAreas[cndCnt].standardStringValue);
                            }
                        }
                        documentDateAreas = Lib.FirstTimeRecognition.EngineBase.PreferCandidates(documentDateAreas, this.documentDatePreferredKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentDateAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Selection (preference) " + documentDateAreas[cndCnt].standardStringValue);
                            }
                        }
                        // MFL20140916_1 - Deploying Mandatory/Exclusion/Preferred Keywords as well as IgnoreAreas concept
                        documentDateAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(documentDateAreas, Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, this.headerFieldsAlignmentTolerance, true, false);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentDateAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Sorting " + documentDateAreas[cndCnt].standardStringValue);
                            }
                        }
                        this.docd = documentDateAreas.length > 0 ? documentDateAreas[0] : null;
                    }
                };
                InvoiceDocumentAP.prototype.findDocumentNumber = function () {
                    if (!this.bypassDocumentNumber) {
                        var cndCnt = void 0;
                        // MF20140623_1 - Set this.docn to null so that the first return does not let the default value in case of successive calls
                        this.docn = null;
                        if (!this.getHeaderFirstPageArea()) {
                            return;
                        }
                        var documentNumberAreas = Lib.FirstTimeRecognition.EngineBase.CollectDocumentReferenceNumbersInArea(this.headerFirstPageArea, this.documentNumberPreventSpaceExtraction, this.docd !== null ? this.docd.area : null, this.spaceTolerance, this.headerFieldsAlignmentTolerance);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentNumberAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Collection " + documentNumberAreas[cndCnt].standardStringValue);
                            }
                        }
                        // MFL20140916_1 - Deploying Mandatory/Exclusion/Preferred Keywords as well as IgnoreAreas concept
                        if (this.docd !== null) {
                            if (this.documentNumberIgnoredAreas === null) {
                                this.documentNumberIgnoredAreas = [this.docd.area];
                            }
                            else {
                                this.documentNumberIgnoredAreas.push(this.docd.area);
                            }
                        }
                        documentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidatesAreasBased(documentNumberAreas, this.documentNumberIgnoredAreas, true);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentNumberAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Area Exclusion " + documentNumberAreas[cndCnt].standardStringValue);
                            }
                        }
                        // MFL20140819_3 Added ability to filter out candidates based on a list of mandatoryKeywords
                        // MFL20140819_6 Removing the "standardStringValue" since this.documentType is a string
                        var docTypeMandatoryKeywords = this.documentNumberMandatoryKeywords[this.documentType];
                        documentNumberAreas = Lib.FirstTimeRecognition.EngineBase.KeepCandidates(documentNumberAreas, docTypeMandatoryKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentNumberAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Selection (mandatory) " + documentNumberAreas[cndCnt].standardStringValue);
                            }
                        }
                        // MFL20140819_6 Removing the "standardStringValue" since this.documentType is a string
                        var docTypeExclusionKeywords = this.documentNumberExclusionKeywords[this.documentType];
                        documentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidates(documentNumberAreas, docTypeExclusionKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentNumberAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Exclusion " + documentNumberAreas[cndCnt].standardStringValue);
                            }
                        }
                        // MFL20140819_6 Removing the "standardStringValue" since this.documentType is a string
                        var docTypePreferredKeywords = this.documentNumberPreferredKeywords[this.documentType];
                        documentNumberAreas = Lib.FirstTimeRecognition.EngineBase.PreferCandidates(documentNumberAreas, docTypePreferredKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentNumberAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Selection (preference) " + documentNumberAreas[cndCnt].standardStringValue);
                            }
                        }
                        if (this.docd === null) {
                            documentNumberAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(documentNumberAreas, Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, this.headerFieldsAlignmentTolerance, true, false);
                        }
                        else {
                            Lib.FirstTimeRecognition.EngineBase.SetReferenceAreaForSorting(this.docd.area);
                            documentNumberAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(documentNumberAreas, Lib.FirstTimeRecognition.EngineBase.SortAlongReferenceAreaProximity, this.headerFieldsAlignmentTolerance, true, false);
                        }
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (cndCnt = 0; cndCnt < documentNumberAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: Sorting " + documentNumberAreas[cndCnt].standardStringValue);
                            }
                        }
                        this.docn = documentNumberAreas.length > 0 ? documentNumberAreas[0] : null;
                    }
                };
                // MFL20140819_2 Fixed typo prferredKeywords -> preferredKeywords
                // MFL20140819_3 Added ability to filter out candidates based on a list of mandatoryKeywords
                InvoiceDocumentAP.prototype.findNonDocumentNumber = function (validityRanges, exclusionRanges, mandatoryKeywords, exclusionKeywords, preferredKeywords, allPages) {
                    var nonDocumentNumberAreas = [];
                    function logNonDocumentNumberAreas(step) {
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (var cndCnt = 0; cndCnt < nonDocumentNumberAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: " + step + " " + nonDocumentNumberAreas[cndCnt].standardStringValue);
                            }
                        }
                    }
                    if (allPages) {
                        for (var page = 0; page < Document.GetPageCount(); page++) {
                            if (!this.shouldIgnorePage(page)) {
                                nonDocumentNumberAreas = nonDocumentNumberAreas.concat(Lib.FirstTimeRecognition.EngineBase.CollectNonDocumentReferenceNumbersInArea(Document.GetArea(page), validityRanges));
                            }
                        }
                    }
                    else {
                        if (!this.getHeaderFirstPageArea()) {
                            return null;
                        }
                        nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.CollectNonDocumentReferenceNumbersInArea(this.headerFirstPageArea, validityRanges);
                    }
                    logNonDocumentNumberAreas("Collection");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidatesPatternBased(nonDocumentNumberAreas, exclusionRanges, true);
                    logNonDocumentNumberAreas("ExcludePattern");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidatesAreasBased(nonDocumentNumberAreas, this.docn !== null && this.docn.area !== null ? [this.docn.area] : null, true);
                    logNonDocumentNumberAreas("ExcludeArea");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidatesContentBased(nonDocumentNumberAreas, this.docn !== null && this.docn.standardStringValue !== null ? [this.docn.standardStringValue] : null, true);
                    logNonDocumentNumberAreas("ExcludeContent");
                    // MFL20140819_3 Added ability to filter out candidates based on a list of mandatoryKeywords
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.KeepCandidates(nonDocumentNumberAreas, mandatoryKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                    logNonDocumentNumberAreas("Selection (mandatory)");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidates(nonDocumentNumberAreas, exclusionKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                    logNonDocumentNumberAreas("Exclusion");
                    // MFL20140819_2 Fixed typo prferredKeywords -> preferredKeywords
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.PreferCandidates(nonDocumentNumberAreas, preferredKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                    logNonDocumentNumberAreas("Selection (prefer)");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(nonDocumentNumberAreas, Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, this.headerFieldsAlignmentTolerance, true, false);
                    logNonDocumentNumberAreas("Sorting");
                    // MFL20141016_1 - returning the whole set of candidates to allow check of candidates against database
                    return nonDocumentNumberAreas.length > 0 ? nonDocumentNumberAreas : null;
                };
                InvoiceDocumentAP.prototype.findDocumentType = function () {
                    if (!this.getHeaderFirstPageArea() || this.bypassDocumentType) {
                        return;
                    }
                    var otherDocTypes = Lib.FirstTimeRecognition.EngineBase.CollectOtherDocumentTypesInArea(this.headerFirstPageArea, this.otherDocumentTypes);
                    this.documentType = otherDocTypes.length > 0 ? otherDocTypes[0].standardStringValue : this.defaultDocumentType;
                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("Document type = " + this.documentType);
                };
                InvoiceDocumentAP.prototype.findVATNumber = function () {
                    if (!this.getHeaderFirstPageArea() || this.bypassVATNumber) {
                        return;
                    }
                    var vatNumbers = Lib.FirstTimeRecognition.EngineBase.CollectVATNumberInArea(this.headerFirstPageArea);
                    this.vatNumber = vatNumbers.length > 0 ? vatNumbers[0] : null;
                };
                return InvoiceDocumentAP;
            }(FirstTimeRecognition.InvoiceDocument));
            EngineAP.InvoiceDocumentAP = InvoiceDocumentAP;
            EngineAP.ExtractionMode = {
                "SINGLE_TAX_RATE": SINGLE_TAX_RATE_EXTRACTION_MODE,
                "MULTIPLE_TAX_RATE": MULTIPLE_TAX_RATE_EXTRACTION_MODE,
                "NO_EXPLICIT_NET_AMOUNT": NO_EXPLICIT_NET_AMOUNT_EXTRACTION_MODE,
                "NO_EXPLICIT_RELATIONSHIP": NO_EXPLICIT_RELATIONSHIP_EXTRACTION_MODE,
                "NULL_TAX_RATE": NULL_TAX_RATE_EXTRACTION_MODE,
                "DEFAULT_EXTRACTION_MODE": DEFAULT_EXTRACTION_MODE
            };
            function ActivateLog(activateFlag) {
                return Lib.FirstTimeRecognition.EngineBase.ActivateLog(activateFlag);
            }
            EngineAP.ActivateLog = ActivateLog;
            function GetNewDocument() {
                return new InvoiceDocumentAP();
            }
            EngineAP.GetNewDocument = GetNewDocument;
        })(EngineAP = FirstTimeRecognition.EngineAP || (FirstTimeRecognition.EngineAP = {}));
    })(FirstTimeRecognition = Lib.FirstTimeRecognition || (Lib.FirstTimeRecognition = {}));
})(Lib || (Lib = {}));
