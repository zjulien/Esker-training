///#GLOBALS Lib
/* LIB_DEFINITION{
  "name": "Lib_FirstTimeRecognition_EngineAPv1_V12.0.461.0",
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
        var EngineAPv1;
        (function (EngineAPv1) {
            /** area helper **/
            var g_areaHelper = {
                GetAreaOnTheRight: function (area, newXTolerance, newYTolerance) {
                    var offsetX = 10;
                    if (newXTolerance) {
                        offsetX = newXTolerance;
                    }
                    var offsetY = 0.1;
                    if (newYTolerance) {
                        offsetY = newYTolerance;
                    }
                    // XTolerance ~10cm
                    var XTolerance = Document.GetPageResolutionX(area.page) * offsetX / 2.54;
                    // YTolerance ~0.1cm
                    var YTolerance = Document.GetPageResolutionY(area.page) * offsetY / 2.54;
                    return Document.GetArea(area.page, area.x + area.width + 1, area.y - YTolerance, area.width + 1 + XTolerance, area.height + YTolerance * 2);
                },
                GetAreaBelow: function (area, newXTolerance, newYTolerance) {
                    var offsetX = 0.5;
                    if (newXTolerance) {
                        offsetX = newXTolerance;
                    }
                    var offsetY = 3;
                    if (newYTolerance) {
                        offsetY = newYTolerance;
                    }
                    // XTolerance ~0.5cm
                    var XTolerance = Document.GetPageResolutionX(area.page) * offsetX / 2.54;
                    // YTolerance ~3cm
                    var YTolerance = Document.GetPageResolutionY(area.page) * offsetY / 2.54;
                    return Document.GetArea(area.page, area.x - XTolerance, area.y + area.height + 1, area.width + XTolerance * 2, area.height + YTolerance);
                },
                IsInPageHeader: function (area, newYTolerance) {
                    var offsetY = 10;
                    if (newYTolerance) {
                        offsetY = newYTolerance;
                    }
                    // YTolerance ~10cm
                    var YTolerance = Document.GetPageResolutionY(area.page) * offsetY / 2.54;
                    if (area.y < YTolerance) {
                        return true;
                    }
                    return false;
                },
                GetAreaOnTheLeftAbove: function (area, newXTolerance, newYTolerance, newYTolerance2) {
                    var offsetX = 10;
                    if (newXTolerance) {
                        offsetX = newXTolerance;
                    }
                    var offsetY1 = 0.8;
                    if (newYTolerance) {
                        offsetY1 = newYTolerance;
                    }
                    var offsetY2 = 0.8;
                    if (newYTolerance2) {
                        offsetY2 = newYTolerance2;
                    }
                    // XTolerance ~10cm
                    var XTolerance = Document.GetPageResolutionX(area.page) * offsetX / 2.54;
                    // YTolerance ~0.8cm
                    var YTolerance = Document.GetPageResolutionY(area.page) * offsetY1 / 2.54;
                    // YTolerance2 ~0.8cm
                    var YTolerance2 = Document.GetPageResolutionY(area.page) * offsetY2 / 2.54;
                    return Document.GetArea(area.page, area.x - XTolerance - 1, area.y - YTolerance, XTolerance, area.height + YTolerance + YTolerance2);
                },
                GetAreaAbove: function (area, newXTolerance, newYTolerance) {
                    var offsetX = 0.5;
                    if (newXTolerance) {
                        offsetX = newXTolerance;
                    }
                    var offsetY = 3;
                    if (newYTolerance) {
                        offsetY = newYTolerance;
                    }
                    // XTolerance ~0.5cm
                    var XTolerance = Document.GetPageResolutionX(area.page) * offsetX / 2.54;
                    // YTolerance ~3cm
                    var YTolerance = Document.GetPageResolutionY(area.page) * offsetY / 2.54;
                    return Document.GetArea(area.page, area.x - XTolerance, area.y - YTolerance - 1, area.width + XTolerance * 2, YTolerance);
                },
                IsInArea: function (area, areaToCheck, newXTolerance, newYTolerance) {
                    var offsetX = 0;
                    if (newXTolerance) {
                        offsetX = newXTolerance;
                    }
                    var offsetY = 0;
                    if (newYTolerance) {
                        offsetY = newYTolerance;
                    }
                    // XTolerance ~0cm
                    var XTolerance = Document.GetPageResolutionX(area.page) * offsetX / 2.54;
                    // YTolerance ~0cm
                    var YTolerance = Document.GetPageResolutionY(area.page) * offsetY / 2.54;
                    return areaToCheck.page === area.page &&
                        areaToCheck.x + XTolerance >= area.x &&
                        areaToCheck.x + areaToCheck.width - XTolerance <= area.x + area.width &&
                        areaToCheck.y + YTolerance >= area.y &&
                        areaToCheck.y + areaToCheck.height - YTolerance <= area.y + area.height;
                },
                areaIsBeforeAreaInDocument: function (area, refArea) {
                    return refArea == null ||
                        area.page < refArea.page ||
                        area.page === refArea.page && area.y < refArea.y ||
                        area.page === refArea.page && area.y === refArea.y && area.x < refArea.x;
                }
            };
            /** First reco legacy engine **/
            var InvoiceDocumentAPv1 = /** @class */ (function (_super) {
                __extends(InvoiceDocumentAPv1, _super);
                function InvoiceDocumentAPv1() {
                    var _this = _super.call(this) || this;
                    _this.searchForAboluteMaxInNumberArray = function (fieldArray, bSearchForMaxValue, bReverseSearch) {
                        var iMax = bReverseSearch ? fieldArray.length - 1 : 0;
                        if (bSearchForMaxValue) {
                            var increment = bReverseSearch ? -1 : 1;
                            var end = bReverseSearch ? -1 : fieldArray.length;
                            var candidate = Math.abs(fieldArray[iMax].toNumber());
                            var idx = iMax + increment;
                            while (idx !== end) {
                                var cur = Math.abs(fieldArray[idx].toNumber());
                                if (cur > candidate) {
                                    iMax = idx;
                                    candidate = cur;
                                }
                                idx += increment;
                            }
                        }
                        return iMax;
                    };
                    _this.spanIncluding = function (sString, sSpan) {
                        var sRes = "";
                        for (var i = 0; i < sString.length; i++) {
                            if (sSpan.indexOf(sString[i]) !== -1) {
                                sRes += sString[i];
                            }
                        }
                        return sRes;
                    };
                    _this.params = {
                        "currentDocumentCulture": "fr-FR",
                        "defaultCurrency": "EUR",
                        "expectedCurrencies": {},
                        "totalKeywordsFirstTry": [],
                        "totalKeywordsSecondTry": [],
                        "invoiceNumberKeywordsFirstTry": [],
                        "invoiceNumberKeywordsSecondTry": [],
                        "invoiceNumberRegExp": null,
                        "invoicePORegExp": null
                    };
                    _this.totalAmount = null;
                    _this.netAmount = null;
                    _this.invoiceDate = null;
                    _this.invoiceNumber = null;
                    _this.orderNumbers = [];
                    _this.invoiceCurrency = null;
                    return _this;
                }
                /** Interface **/
                InvoiceDocumentAPv1.prototype.InitParameters = function (params) {
                    this.params = params;
                };
                InvoiceDocumentAPv1.prototype.Run = function () {
                    this.searchInvoiceAmount();
                    this.searchInvoiceNetAmount();
                    this.searchInvoiceCurrency();
                    this.searchInvoiceDate();
                    this.searchInvoiceNumber();
                    this.searchInvoicePO();
                };
                // eslint-disable-next-line class-methods-use-this
                InvoiceDocumentAPv1.prototype.GetTaxRate = function () {
                    return null;
                };
                // eslint-disable-next-line class-methods-use-this
                InvoiceDocumentAPv1.prototype.GetTaxAmount = function () {
                    return null;
                };
                InvoiceDocumentAPv1.prototype.GetNetAmount = function () {
                    return this.netAmount;
                };
                InvoiceDocumentAPv1.prototype.GetGrossAmount = function () {
                    return this.totalAmount;
                };
                // eslint-disable-next-line class-methods-use-this
                InvoiceDocumentAPv1.prototype.GetUnplannedCosts = function () {
                    return null;
                };
                InvoiceDocumentAPv1.prototype.GetCurrency = function () {
                    return this.invoiceCurrency;
                };
                InvoiceDocumentAPv1.prototype.GetDocumentType = function () {
                    return this.params.defaultDocumentType;
                };
                InvoiceDocumentAPv1.prototype.GetDocumentDate = function () {
                    return this.invoiceDate;
                };
                InvoiceDocumentAPv1.prototype.GetDocumentNumber = function () {
                    return this.invoiceNumber;
                };
                InvoiceDocumentAPv1.prototype.GetField = function (name) {
                    if (name === "OrderNumber") {
                        return this.orderNumbers;
                    }
                    else if (Object.prototype.hasOwnProperty.call(this, name)) {
                        return this[name];
                    }
                    return Object.prototype.hasOwnProperty.call(this, "Get" + name) ? this["Get" + name]() : null;
                };
                InvoiceDocumentAPv1.prototype.GetFieldCandidates = function (name) {
                    return this.GetField(name);
                };
                InvoiceDocumentAPv1.prototype.GetHeaderFieldCandidates = function (name) {
                    return this.GetField(name);
                };
                InvoiceDocumentAPv1.prototype.SetValue = function (fieldName, area, value) {
                    this[fieldName] = {};
                    this[fieldName].area = area;
                    if (value) {
                        this[fieldName].standardStringValue = value;
                    }
                };
                /** keyword search **/
                InvoiceDocumentAPv1.prototype.keyWordSearchStringInArea = function (area, regExp, fieldName, msg, keyword, numArea, numPage) {
                    var data = regExp.exec(area.toString());
                    if (data) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found:" + fieldName + " " + msg + " keyword: " + keyword + " /match:" + numArea + " /value:" + area.toString());
                        var hl = Document.SearchString(data[0], numPage, area.x, area.y, area.width, area.height, true, false);
                        if (hl && hl.length > 0) {
                            this.SetValue(fieldName, hl[0], data[0]);
                        }
                        else {
                            this.SetValue(fieldName, area, data[0]);
                        }
                        return data[0];
                    }
                    return null;
                };
                InvoiceDocumentAPv1.prototype.keywordSearch = function (keywordsArray, culture, searchType, fieldName, searchParams) {
                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("Search " + fieldName + "(" + searchType + ") for culture " + culture + " with this keyword " + keywordsArray);
                    var regExp;
                    var bReverseSearch = false;
                    var bSearchForMaxValue = false;
                    var bSearchForSignedValue = false;
                    var bSearchFarBelow = false;
                    var bSearchStrict = false;
                    if (searchParams) {
                        if (searchParams.bReverseSearch) {
                            bReverseSearch = true;
                        }
                        if (searchParams.bSearchForMaxValue) {
                            bSearchForMaxValue = true;
                        }
                        if (searchParams.bSearchForSignedValue) {
                            bSearchForSignedValue = true;
                        }
                        if (searchParams.bSearchFarBelow) {
                            bSearchFarBelow = true;
                        }
                        if (searchParams.bSearchStrict) {
                            bSearchStrict = true;
                        }
                    }
                    if (searchType !== "date") {
                        regExp = searchType;
                    }
                    var fieldsFound = [];
                    var fieldsFormattedFound = [];
                    var nbFieldsFound = 0;
                    var increment = bReverseSearch ? -1 : 1;
                    for (var iWord = 0; iWord < keywordsArray.length; iWord++) {
                        var nbPages = Document.GetPageCount();
                        // When bReverseSearch is true we must start search from last page
                        var startPage = void 0;
                        var endPage = void 0;
                        if (bReverseSearch) {
                            startPage = nbPages - 1;
                            endPage = -1;
                        }
                        else {
                            endPage = nbPages;
                            startPage = 0;
                        }
                        var numPage = startPage;
                        while (numPage !== endPage) {
                            var zoneArray = Document.SearchString(keywordsArray[iWord], numPage, false, !bSearchStrict);
                            for (var numArea = 0; numArea < zoneArray.length; numArea++) {
                                var z = zoneArray[bReverseSearch ? zoneArray.length - numArea - 1 : numArea];
                                // Look on the right of the keyword
                                var dataAfter = void 0, dataBelow = void 0, nextReference = void 0;
                                if (searchType === "date") {
                                    nextReference = g_areaHelper.GetAreaOnTheRight(z);
                                    dataAfter = Document.ExtractDate(culture, numPage, nextReference.x, nextReference.y, nextReference.width, nextReference.height);
                                    if (dataAfter && dataAfter.length > 0) {
                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found:" + fieldName + " on the right of keyword: " + keywordsArray[iWord] + " /match:" + numArea);
                                        fieldsFormattedFound[nbFieldsFound] = dataAfter[0].toDate();
                                        fieldsFound[nbFieldsFound] = dataAfter[0];
                                        nbFieldsFound++;
                                    }
                                }
                                else if (searchType === "number") {
                                    nextReference = g_areaHelper.GetAreaOnTheRight(z, 20, 0.8);
                                    if (bSearchForSignedValue) {
                                        dataAfter = Document.ExtractSignedNumber(culture, numPage, nextReference.x, nextReference.y, nextReference.width, nextReference.height);
                                    }
                                    else {
                                        dataAfter = Document.ExtractNumber(culture, numPage, nextReference.x, nextReference.y, nextReference.width, nextReference.height);
                                    }
                                    if (dataAfter && dataAfter.length > 0) {
                                        var afterMax = this.searchForAboluteMaxInNumberArray(dataAfter, bSearchForMaxValue, bReverseSearch);
                                        fieldsFormattedFound[nbFieldsFound] = dataAfter[afterMax].toNumber();
                                        fieldsFound[nbFieldsFound] = dataAfter[afterMax];
                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found:" + fieldName + " on the right of keyword: " + keywordsArray[iWord] + " /match:" + afterMax + " /value:" + fieldsFormattedFound[nbFieldsFound]);
                                        nbFieldsFound++;
                                    }
                                }
                                else if (g_areaHelper.IsInPageHeader(z) && z.ocrConfidenceLevel > 10) {
                                    var stringAfter = this.keyWordSearchStringInArea(g_areaHelper.GetAreaOnTheRight(z, 3, 0.1), regExp, fieldName, "on the right of", keywordsArray[iWord], numArea, numPage);
                                    if (stringAfter) {
                                        return stringAfter;
                                    }
                                }
                                else {
                                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("Skipping keyword " + keywordsArray[iWord] + " (not in page header or confidence level too low).");
                                    // No need to test below
                                    continue;
                                }
                                // Look under the keyword
                                var belowReference = void 0;
                                if (searchType === "date") {
                                    belowReference = g_areaHelper.GetAreaBelow(z);
                                    dataBelow = Document.ExtractDate(culture, numPage, belowReference.x, belowReference.y, belowReference.width, belowReference.height);
                                    if (dataBelow && dataBelow.length > 0) {
                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found:" + fieldName + " below keyword: " + keywordsArray[iWord] + " /match:" + numArea);
                                        fieldsFormattedFound[nbFieldsFound] = dataBelow[0].toDate();
                                        fieldsFound[nbFieldsFound] = dataBelow[0];
                                        nbFieldsFound++;
                                    }
                                }
                                else if (searchType === "number") {
                                    if (bSearchFarBelow) {
                                        belowReference = g_areaHelper.GetAreaBelow(z);
                                    }
                                    else {
                                        belowReference = g_areaHelper.GetAreaBelow(z, 0.4, 0.8);
                                    }
                                    var dataBelowForTest = void 0;
                                    if (bSearchForSignedValue) {
                                        dataBelowForTest = Document.ExtractSignedNumber(culture, numPage, belowReference.x, belowReference.y, belowReference.width * 2, belowReference.height);
                                    }
                                    else {
                                        dataBelowForTest = Document.ExtractNumber(culture, numPage, belowReference.x, belowReference.y, belowReference.width * 2, belowReference.height);
                                    }
                                    var oldX = belowReference.x;
                                    var newY = belowReference.y;
                                    var oldWidth = belowReference.width;
                                    var oldHeight = belowReference.height;
                                    dataBelow = dataBelowForTest;
                                    if (bSearchFarBelow) {
                                        // If data are found under a keyword, we might search on lines below.
                                        // This is done in case of a keyword found in a table header
                                        while (dataBelowForTest && dataBelowForTest.length > 0) {
                                            dataBelow = dataBelowForTest;
                                            newY += oldHeight;
                                            if (bSearchForSignedValue) {
                                                dataBelowForTest = Document.ExtractSignedNumber(culture, numPage, oldX, newY, oldWidth * 2, oldHeight);
                                            }
                                            else {
                                                dataBelowForTest = Document.ExtractNumber(culture, numPage, oldX, newY, oldWidth * 2, oldHeight);
                                            }
                                        }
                                    }
                                    if (dataBelow && dataBelow.length > 0) {
                                        var belowMax = this.searchForAboluteMaxInNumberArray(dataBelow, bSearchForMaxValue, bReverseSearch);
                                        fieldsFormattedFound[nbFieldsFound] = dataBelow[belowMax].toNumber();
                                        fieldsFound[nbFieldsFound] = dataBelow[belowMax];
                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found:" + fieldName + " below keyword: " + keywordsArray[iWord] + " /match:" + belowMax + " /value:" + fieldsFormattedFound[nbFieldsFound]);
                                        nbFieldsFound++;
                                    }
                                }
                                else {
                                    var stringBelow = this.keyWordSearchStringInArea(g_areaHelper.GetAreaBelow(z, 0.4, 0.8), regExp, fieldName, "below", keywordsArray[iWord], numArea, numPage);
                                    if (stringBelow) {
                                        return stringBelow;
                                    }
                                }
                            }
                            numPage += increment;
                        }
                    }
                    if (nbFieldsFound !== 0) {
                        var iMax = this.searchForAboluteMaxInNumberArray(fieldsFound, bSearchForMaxValue, bReverseSearch);
                        this.SetValue(fieldName, fieldsFound[iMax]);
                        return fieldsFormattedFound[iMax];
                    }
                    return null;
                };
                // Search for the first date in the past on the document
                InvoiceDocumentAPv1.prototype.searchInvoiceDate = function () {
                    if (this.invoiceDate === null) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("-- searchInvoiceDate");
                        // The "Invoice date" is the first date identified on the document (top to bottom) that is not in the future (after the submission date)
                        var areas = Document.ExtractDate(this.params.currentDocumentCulture);
                        var submitDate = Data.GetValue("SubmitDateTime");
                        var invoiceDateArea = null;
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("SubmitDateTime:" + submitDate);
                        for (var i in areas) {
                            if (Object.prototype.hasOwnProperty.call(areas, i)) {
                                var area = areas[i];
                                // Check date is not int the future
                                if (Data.ExtractDate(area.toString(), this.params.currentDocumentCulture) <= submitDate) {
                                    Lib.FirstTimeRecognition.EngineBase.DebugLogln(area + " is in the past: OK");
                                    invoiceDateArea = area;
                                    break;
                                }
                                else {
                                    Lib.FirstTimeRecognition.EngineBase.DebugLogln(area + " is in the future, skipping");
                                }
                            }
                        }
                        if (invoiceDateArea) {
                            Lib.FirstTimeRecognition.EngineBase.DebugLogln("Invoice date found: " + invoiceDateArea.toString() + ", page " + (invoiceDateArea.page + 1) + " (" + invoiceDateArea.x + "," + invoiceDateArea.y + ")");
                            this.SetValue("invoiceDate", invoiceDateArea);
                        }
                        else {
                            Lib.FirstTimeRecognition.EngineBase.DebugLogln("Invoice date not found");
                        }
                    }
                };
                // Search around keywords and keep the maximum number found
                InvoiceDocumentAPv1.prototype.searchInvoiceAmount = function () {
                    if (this.totalAmount === null) {
                        var searchParams = { bReverseSearch: true, bSearchForMaxValue: true, bSearchForSignedValue: true, bSearchFarBelow: false };
                        // First try with complex keywords
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("-- Search for invoice amount");
                        if (!this.keywordSearch(this.params.totalKeywordsFirstTry, this.params.currentDocumentCulture, "number", "totalAmount", searchParams)) {
                            // Second try with generic keywords
                            Lib.FirstTimeRecognition.EngineBase.DebugLogln("Second try for invoice amount");
                            this.keywordSearch(this.params.totalKeywordsSecondTry, this.params.currentDocumentCulture, "number", "totalAmount", searchParams);
                        }
                    }
                };
                // Search around the total amount found
                InvoiceDocumentAPv1.prototype.searchInvoiceNetAmount = function () {
                    if (this.netAmount === null && this.totalAmount !== null) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("-- Search for invoice NET amount");
                        var absInvoiceAmount = Math.abs(this.totalAmount.area.toNumber());
                        var amountArea = this.totalAmount.area;
                        // start looking above the invoice amount
                        var lookupArea = g_areaHelper.GetAreaAbove(amountArea, 2, 3);
                        var data = Document.ExtractSignedNumber(this.params.currentDocumentCulture, lookupArea.page, lookupArea.x, lookupArea.y, lookupArea.width, lookupArea.height);
                        var idx = void 0;
                        var iMax = -1;
                        // net amount couldn't be 0 if amount is not 0
                        var absMax = absInvoiceAmount !== 0 ? 0 : -1;
                        for (idx = data.length - 1; idx >= 0; idx--) {
                            if (!g_areaHelper.IsInArea(lookupArea, data[idx], 1, 0)) {
                                break;
                            }
                            var absValAbove = Math.abs(data[idx].toNumber());
                            if (absValAbove < absInvoiceAmount && absValAbove > absMax) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found:netAmount above totalAmount /match:" + idx);
                                absMax = absValAbove;
                                iMax = idx;
                            }
                        }
                        if (iMax === -1) {
                            // if no candidate found above, look left above
                            lookupArea = g_areaHelper.GetAreaOnTheLeftAbove(amountArea, 20, 3, 0.8);
                            data = Document.ExtractSignedNumber(this.params.currentDocumentCulture, lookupArea.page, lookupArea.x, lookupArea.y, lookupArea.width, lookupArea.height);
                            for (idx = data.length - 1; idx >= 0; idx--) {
                                if (!g_areaHelper.IsInArea(lookupArea, data[idx], 1, 0)) {
                                    break;
                                }
                                var absValLeft = Math.abs(data[idx].toNumber());
                                if (absValLeft < absInvoiceAmount && absValLeft > absMax) {
                                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found:netAmount left of totalAmount /match:" + idx);
                                    absMax = absValLeft;
                                    iMax = idx;
                                }
                            }
                        }
                        if (iMax !== -1) {
                            this.SetValue("netAmount", data[iMax]);
                        }
                    }
                };
                // Currency is identified on the invoice using the first occurence of a currency name or a currency symbol on the document.
                InvoiceDocumentAPv1.prototype.searchInvoiceCurrency = function () {
                    if (this.invoiceCurrency === null) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("-- searchInvoiceCurrency");
                        var areaFound = null;
                        var invoiceCurrency = null;
                        for (var currency in this.params.expectedCurrencies) {
                            if (Object.prototype.hasOwnProperty.call(this.params.expectedCurrencies, currency)) {
                                var keywordList = this.params.expectedCurrencies[currency];
                                for (var i in keywordList) {
                                    if (Object.prototype.hasOwnProperty.call(keywordList, i)) {
                                        var keyword = keywordList[i];
                                        var isSymbol = !/^[a-zA-Z]+$/.test(keyword);
                                        var areas = Document.SearchString(keyword, true, false);
                                        for (var idx in areas) {
                                            if (Object.prototype.hasOwnProperty.call(areas, idx)) {
                                                var area = areas[idx];
                                                // Perfect match only for letters, contains otherwise
                                                // Check if the keyword is met higher in the document than the previous candidate
                                                if ((area.toString() === keyword || isSymbol) &&
                                                    g_areaHelper.areaIsBeforeAreaInDocument(area, areaFound)) {
                                                    invoiceCurrency = currency;
                                                    areaFound = area;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (areaFound) {
                            Lib.FirstTimeRecognition.EngineBase.DebugLogln("Invoice currency keyword found: " + areaFound.toString() + ", page " + (areaFound.page + 1) + " (" + areaFound.x + "," + areaFound.y + ")");
                            this.SetValue("invoiceCurrency", areaFound, invoiceCurrency);
                        }
                        else {
                            Lib.FirstTimeRecognition.EngineBase.DebugLogln("Invoice currency keyword not found, currency set to default value.");
                            invoiceCurrency = this.params.defaultCurrency;
                            this.SetValue("invoiceCurrency", invoiceCurrency);
                        }
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("invoiceCurrency set to " + invoiceCurrency);
                    }
                };
                // search on the right or below keywords for a string matching a regular expression
                InvoiceDocumentAPv1.prototype.searchInvoiceNumber = function () {
                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("Starting invoice number search");
                    if (this.invoiceNumber === null) {
                        // First try with complex keywords
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("Search for invoice number");
                        if (!this.keywordSearch(this.params.invoiceNumberKeywordsFirstTry, this.params.currentDocumentCulture, this.params.invoiceNumberRegExp, "invoiceNumber")) {
                            // Second try with generic keywords
                            Lib.FirstTimeRecognition.EngineBase.DebugLogln("Second try for invoice number");
                            this.keywordSearch(this.params.invoiceNumberKeywordsSecondTry, this.params.currentDocumentCulture, this.params.invoiceNumberRegExp, "invoiceNumber");
                        }
                    }
                };
                // search for a string matching a regular expression
                InvoiceDocumentAPv1.prototype.searchInvoicePO = function () {
                    var InvoicePORegExp = this.params.invoicePORegExp;
                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("Starting invoice PO search with regular expression " + InvoicePORegExp);
                    var documentWordsList = [];
                    for (var iPage = 0; iPage < Document.GetPageCount(); iPage++) {
                        var sPageText = Document.GetArea(iPage).toString();
                        var arrayPOCode = InvoicePORegExp.exec(sPageText);
                        while (arrayPOCode) {
                            var orderNumber = this.spanIncluding(arrayPOCode[0], "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
                            // No duplicate
                            if (documentWordsList.indexOf(orderNumber) === -1) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("Found PO#" + orderNumber + " in document.");
                                documentWordsList.push(orderNumber);
                                var objMatchingInfo = new FirstTimeRecognition.EngineBase.Candidate();
                                var docAreas = Document.SearchString(arrayPOCode[0], iPage, true, false);
                                objMatchingInfo.area = docAreas.length > 0 ? docAreas[0] : null;
                                objMatchingInfo.standardStringValue = orderNumber;
                                this.orderNumbers.push(objMatchingInfo);
                            }
                            arrayPOCode = InvoicePORegExp.exec(sPageText);
                        }
                    }
                };
                return InvoiceDocumentAPv1;
            }(FirstTimeRecognition.InvoiceDocument));
            EngineAPv1.InvoiceDocumentAPv1 = InvoiceDocumentAPv1;
            function ActivateLog(activateFlag) {
                Lib.FirstTimeRecognition.EngineBase.ActivateLog(activateFlag);
            }
            EngineAPv1.ActivateLog = ActivateLog;
            function GetNewDocument() {
                return new InvoiceDocumentAPv1();
            }
            EngineAPv1.GetNewDocument = GetNewDocument;
        })(EngineAPv1 = FirstTimeRecognition.EngineAPv1 || (FirstTimeRecognition.EngineAPv1 = {}));
    })(FirstTimeRecognition = Lib.FirstTimeRecognition || (Lib.FirstTimeRecognition = {}));
})(Lib || (Lib = {}));
