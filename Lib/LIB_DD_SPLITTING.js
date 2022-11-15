/**
 * @file Lib.DD.Splitting library: helpers for splitting capabilities
 */
var Lib;
(function (Lib) {
    var DD;
    (function (DD) {
        /**
         * @exports Splitting
         * @memberof Lib.DD
         */
        var Splitting;
        (function (Splitting) {
            /** @lends Helpers.prototype */
            Splitting.nDocs = 0;
            Splitting.enableHighlight = true;
            Splitting.enableStoreArea = false;
            Splitting.nbHighlightedZone = 0;
            Splitting.nMaxHighlightedZone = 50;
            Splitting.splitParameters = [];
            Splitting.splitAreas = [];
            Splitting.details = "";
            Splitting.error = "";
            Splitting.chunkSize = 1000;
            Splitting.translations = {
                applyOffset: Language.Translate("_Apply offset"),
                offset: Language.Translate("_Offset"),
                pagesNumber: Language.Translate("_Number of pages"),
                splitOnString: Language.Translate("_Split when finding a string"),
                stringToSearch: Language.Translate("_String to search"),
                caseSensitive: Language.Translate("_Case sensitive"),
                stringOnFirstPage: Language.Translate("_String on first page"),
                searchArea: Language.Translate("_Search area"),
                useRegex: Language.Translate("_Use reg expression"),
                splitOnAreaChange: Language.Translate("_Split when the content of an area change"),
                regex: Language.Translate("_Reg expression"),
                pageWithEmptySplittingArea: Language.Translate("_Page with empty splitting area"),
                errors: {
                    offsetGreaterError: Language.Translate("_Offset is greater than number of pages"),
                    noStringSpecified: Language.Translate("_Regexp is disabled but no string is specified"),
                    noMatchInArea: Language.Translate("_No match in the document or in the specified area"),
                    stringNotFound: Language.Translate("_String not found"),
                    noAreaSpecified: Language.Translate("_No area specified"),
                    invalidArea: Language.Translate("_Invalid area"),
                    firstPageNotMatchRegex: Language.Translate("_1st page of document to handle does not match regexp"),
                    splittingAreaEmpty: Language.Translate("_Splitting area is empty on one (or more) page(s)")
                }
            };
            /**
            * Reset splitting lib static variable
            */
            function Reset() {
                Lib.DD.Splitting.nDocs = 0;
                Lib.DD.Splitting.enableHighlight = true;
                Lib.DD.Splitting.enableStoreArea = false;
                Lib.DD.Splitting.nbHighlightedZone = 0;
                Lib.DD.Splitting.nMaxHighlightedZone = 50;
                Lib.DD.Splitting.splitParameters = [];
                Lib.DD.Splitting.splitAreas = [];
                Lib.DD.Splitting.details = "";
                Lib.DD.Splitting.error = "";
                Lib.DD.Splitting.chunkSize = 1000;
            }
            Splitting.Reset = Reset;
            /**
            * @param {object} options object to configure splitting
            * @param {string} options.mode How the split is done. Required, possible value fixedPageNumber, stringSplit, areaSplit, noDivision
            * @param {number} options.offset Where the split begin in 0base. Optional, default: 0
            * @param {number} options.totalPages Where the split end i 0base. Optional, default: The document total page
            * @param {number} options.numberOfPages The number of page of splitted documents. Required for fixedPageNumber mode, not use for other mode
            * @param {string} options.searchString The string to search to determine if we begin a new document
            * @param {bool} options.caseSensitive the search string or the regx is case sensitive
            * @param {bool} options.searchStringOnFirstPage If true, When we found the seacrh strig or the regex match it's begin a new doc. If false it's end a new doc
            * @param {string} options.area The area to search
            * @param {bool} options.useRegex Activate the regexp mode, in this case options.searchString is the regexp
            * @return {object} object representing split parameter, null if not in success
            */
            function Split(options) {
                var getTotalPages = function () {
                    return options.totalPages || Document.GetPageCount();
                };
                if (options.mode) {
                    Lib.DD.Splitting.Reset();
                    Lib.DD.Splitting.enableHighlight = typeof (options.enableHighlight) === 'boolean' ? options.enableHighlight : true;
                    Lib.DD.Splitting.enableStoreArea = typeof (options.enableStoreArea) === 'boolean' ? options.enableStoreArea : false;
                    if (options.mode === 'fixedPageNumber') {
                        return Lib.DD.Splitting.SplitEveryNPages(options.offset, getTotalPages(), options.numberOfPages);
                    }
                    else if (options.mode === 'stringSplit') {
                        return Lib.DD.Splitting.SplitStringPage(options.offset, getTotalPages(), options.searchString, options.caseSensitive, options.searchStringOnFirstPage, options.area, options.useRegex);
                    }
                    else if (options.mode === 'areaSplit') {
                        return Lib.DD.Splitting.SplitAreaChange(options.offset, getTotalPages(), options.area, options.caseSensitive, options.useRegex, options.searchString);
                    }
                    else if (options.mode === 'noDivision') {
                        return Lib.DD.Splitting.ApplyOffset(options.offset, getTotalPages());
                    }
                }
                return null;
            }
            Splitting.Split = Split;
            /**
            * Parse string containing X,Y,W,H
            *
            * @param {string} myCoordinates value to parse
            * @return {Area} structure containing rect values {x, y ,width, height}
            */
            function GetAreaFromCoordinates(myCoordinates) {
                if (!myCoordinates) {
                    return null;
                }
                var array = myCoordinates.split(",");
                if (array.length !== 4) {
                    return null;
                }
                var area = {
                    x: parseInt(array[0], 10),
                    y: parseInt(array[1], 10),
                    width: parseInt(array[2], 10),
                    height: parseInt(array[3], 10)
                };
                var isWidthNegativeOrZero = area.width == null || area.width <= 0;
                var isHeightNegativeOrZero = area.height == null || area.height <= 0;
                var isSizeError = isWidthNegativeOrZero || isHeightNegativeOrZero;
                if (isSizeError) {
                    return null;
                }
                return area;
            }
            Splitting.GetAreaFromCoordinates = GetAreaFromCoordinates;
            function HandleArea(area, store, highlight) {
                if (store) {
                    Lib.DD.Splitting.splitAreas.push(area);
                }
                if (highlight) {
                    Lib.DD.Splitting.Highlight(area);
                }
            }
            Splitting.HandleArea = HandleArea;
            function Highlight(area) {
                if (!Lib.DD.Splitting.enableHighlight) {
                    return;
                }
                if (Lib.DD.Splitting.nbHighlightedZone < Lib.DD.Splitting.nMaxHighlightedZone) {
                    area.Highlight(true, 0xFF0000, 0x000000);
                    Lib.DD.Splitting.nbHighlightedZone++;
                }
            }
            Splitting.Highlight = Highlight;
            /**
            * Parse string containing X,Y,W,H
            *
            * @param {string} myCoordinates value to parse
            * @return {object} structure containing rect values {x:,y:,width,height:}
            */
            function TrimString(s) {
                return s == null ? "" : s.replace(/^\s+|\s+$/, '');
            }
            Splitting.TrimString = TrimString;
            function AddSplitParameter(startPage, endPage) {
                Lib.DD.Splitting.splitParameters.push({ startPage: startPage, endPage: endPage });
                Lib.DD.Splitting.nDocs++;
            }
            Splitting.AddSplitParameter = AddSplitParameter;
            function GetSplitParameters() {
                return Lib.DD.Splitting.splitParameters;
            }
            Splitting.GetSplitParameters = GetSplitParameters;
            function SerializeSplitParameters(splitParameters, start, size) {
                splitParameters = splitParameters || Lib.DD.Splitting.splitParameters;
                start = start ? Math.min(start, splitParameters.length) : 0;
                size = size ? Math.min(size, splitParameters.length) : splitParameters.length;
                if (start + size > splitParameters.length) {
                    size = splitParameters.length - start;
                }
                var result = "";
                var count = start + size;
                for (var i = start; i < count; i++) {
                    if (i != start) {
                        result += ';';
                    }
                    result += splitParameters[i].startPage + '-' + splitParameters[i].endPage;
                }
                return result;
            }
            Splitting.SerializeSplitParameters = SerializeSplitParameters;
            function SerializeSplitParametersByChunk(splitParameters, chunkSize) {
                splitParameters = splitParameters || Lib.DD.Splitting.splitParameters;
                chunkSize = chunkSize || Lib.DD.Splitting.chunkSize;
                var chunks = [];
                var i = 0;
                while (i < splitParameters.length) {
                    chunks.push(Lib.DD.Splitting.SerializeSplitParameters(splitParameters, i, chunkSize));
                    i = i + chunkSize;
                }
                return chunks;
            }
            Splitting.SerializeSplitParametersByChunk = SerializeSplitParametersByChunk;
            function DeserializeSplitParameters(stringSplitParameters) {
                var params = stringSplitParameters.split(';');
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].split('-');
                    if (param.length === 2) {
                        Lib.DD.Splitting.AddSplitParameter(param[0], param[1]);
                    }
                }
                return Lib.DD.Splitting.splitParameters;
            }
            Splitting.DeserializeSplitParameters = DeserializeSplitParameters;
            function NormalizePositiveNumber(n) {
                if (isNaN(n) || n < 0) {
                    return 0;
                }
                return n;
            }
            Splitting.NormalizePositiveNumber = NormalizePositiveNumber;
            /**
            * Truncate the document after an offset of pages
            *
            * @param {number} offset index of page to take the document from
            * @param {number} totalPages total number of pages
            * @return {object} object representing split parameter, null if not in succeess
            */
            function ApplyOffset(offset, totalPages) {
                offset = Lib.DD.Splitting.NormalizePositiveNumber(offset);
                // write settings in details
                Lib.DD.Splitting.details = Lib.DD.Splitting.translations.applyOffset;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.offset + " : " + offset;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.pagesNumber + " : " + totalPages;
                // handle invalid params
                if (totalPages <= offset) {
                    Lib.DD.Splitting.error = Lib.DD.Splitting.translations.errors.offsetGreaterError;
                    return false;
                }
                Lib.DD.Splitting.AddSplitParameter(offset + 1, totalPages);
                return Lib.DD.Splitting.splitParameters;
            }
            Splitting.ApplyOffset = ApplyOffset;
            /**
            * Split document each page number defined by a documentlength
            *
            * @param {number} offset index of page to take the document from
            * @param {number} totalPages total number of pages
            * @param {number} documentlength each splitted documents will have this length (in pages) or less for last one
            * @return {object} object representing split parameter, null if not in succeess
            */
            function SplitEveryNPages(offset, totalPages, singleDocumentlength) {
                if (isNaN(singleDocumentlength)) {
                    return null;
                }
                offset = Lib.DD.Splitting.NormalizePositiveNumber(offset);
                // write settings in details
                Lib.DD.Splitting.details = Language.Translate("_Split every {0} pages", true, singleDocumentlength);
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.offset + " : " + offset;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.pagesNumber + " : " + totalPages;
                // handle invalid params
                if (totalPages <= offset) {
                    Lib.DD.Splitting.error = Lib.DD.Splitting.translations.errors.offsetGreaterError;
                    return false;
                }
                if ((totalPages < (offset + singleDocumentlength)) || ((totalPages - offset) % singleDocumentlength !== 0) || (singleDocumentlength === 0)) {
                    Lib.DD.Splitting.error = Language.Translate("_The document's number of page has to be a multiple of {0} (after offset).", true, singleDocumentlength);
                    return false;
                }
                // effective split
                for (var i = offset + 1; i < totalPages + 1; i = i + singleDocumentlength) {
                    Lib.DD.Splitting.AddSplitParameter(i, i + singleDocumentlength - 1);
                }
                return Lib.DD.Splitting.splitParameters;
            }
            Splitting.SplitEveryNPages = SplitEveryNPages;
            /**
            * Split according a string in the whole page or in an area of the page
            *
            * @param {number} offset index of page to take the document from
            * @param {number} totalPages total number of pages
            * @param {string} searchString string to search in page or in area. Can be null if use regex
            * @param {bool} bCaseSensitive search for string or regex is case sensitive or not
            * @param {bool} bSearchStringOnFirstPage determine where split when qe found the specified string or the regex match
            * @param {bool} bWholePage search o the whole doc
            * @param {string} sArea string containing X,Y,W,H
            * @param {bool} bRegExpUse use regex mod if true
            * @param {string} regExp in regex mode the regx string to match
            * * @return {object} object representing split parameter, null if not in succeess
            */
            function SplitStringPage(offset, totalPages, searchString, bCaseSensitive, bSearchStringOnFirstPage, sArea, bRegExpUse) {
                var that = this;
                var bNewDoc = true;
                var area = Lib.DD.Splitting.GetAreaFromCoordinates(sArea);
                var startPage = 1;
                function _SplitStringPage(i) {
                    var areaSplit = area ? Document.GetArea(i, area.x, area.y, area.width, area.height) : null;
                    var paramSplit = {
                        "area": areaSplit,
                        "page": i,
                        "keepCase": bCaseSensitive,
                        "valueToSearch": searchString,
                        "type": bRegExpUse ? "regexp" : "string",
                        "matchingTextOnly": "true"
                    };
                    var zones = Document.SearchString(paramSplit);
                    if (zones != null && zones.length > 0) {
                        // String found on the page
                        that.HandleArea(zones[0], that.enableStoreArea, that.enableHighlight);
                        if (bSearchStringOnFirstPage) {
                            if (bNewDoc) {
                                // 1st page of 1st doc - take into account if offset is badly set
                                startPage = i + 1;
                                bNewDoc = false;
                                if (totalPages === 1) {
                                    that.AddSplitParameter(startPage, startPage);
                                }
                            }
                            else {
                                that.AddSplitParameter(startPage, i);
                                startPage = i + 1;
                                if (i === totalPages - 1) {
                                    that.AddSplitParameter(startPage, i + 1);
                                }
                            }
                        }
                        else {
                            that.AddSplitParameter(startPage, i + 1);
                            startPage = i + 2;
                        }
                    }
                    else if (bSearchStringOnFirstPage && i === totalPages - 1) {
                        that.AddSplitParameter(startPage, i + 1);
                    }
                }
                offset = Lib.DD.Splitting.NormalizePositiveNumber(offset);
                Lib.DD.Splitting.details = Lib.DD.Splitting.translations.splitOnString;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.offset + " : " + offset;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.pagesNumber + " : " + totalPages;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.stringToSearch + " : " + searchString;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.caseSensitive + " : " + Language.Translate(bCaseSensitive);
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.stringOnFirstPage + " : " + Language.Translate(bSearchStringOnFirstPage);
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.searchArea + " : " + sArea;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.useRegex + " : " + Language.Translate(bRegExpUse);
                if (totalPages <= offset) {
                    Lib.DD.Splitting.error = Lib.DD.Splitting.translations.errors.offsetGreaterError;
                    return null;
                }
                if (searchString === "" && !bRegExpUse) {
                    Lib.DD.Splitting.error = Lib.DD.Splitting.translations.errors.noStringSpecified;
                    return null;
                }
                startPage = offset + 1;
                for (var i = offset; i < totalPages; i++) {
                    _SplitStringPage(i);
                }
                if (Lib.DD.Splitting.splitParameters.length === 0) {
                    Lib.DD.Splitting.error = bRegExpUse ?
                        Lib.DD.Splitting.translations.errors.noMatchInArea :
                        Lib.DD.Splitting.translations.errors.stringNotFound;
                    return null;
                }
                return Lib.DD.Splitting.splitParameters;
            }
            Splitting.SplitStringPage = SplitStringPage;
            /**
            * Split according a the content of an area changed
            *
            * @param {number} offset index of page to take the document from
            * @param {number} totalPages total number of pages
            * @param {string} sArea string containing X,Y,W,H
            * @param {bool} bRegExpUse use regex mod if true
            * @param {string} regExp in regex mode the regx string to match
            * @param {bool} bSplitAreaMustBeFilled specify that splitting area must be filled
            * @return {object} object representing split parameter, null if not in succeess
            */
            function SplitAreaChange(offset, totalPages, sArea, bCaseSensitive, bRegExpUse, regExp, bSplitAreaMustBeFilled) {
                var that = this;
                var area = Lib.DD.Splitting.GetAreaFromCoordinates(sArea);
                var RegExpression = null;
                var bFound = true;
                var cachedString = "";
                var startPage = 1;
                var SplittingConditionNotFound = [];
                function _SplitAreaChange(i) {
                    var highlightArea = Document.GetArea(i, area.x, area.y, area.width, area.height);
                    var newString = highlightArea.toString();
                    if (bRegExpUse) {
                        bFound = RegExpression.exec(newString);
                        //see http://stackoverflow.com/questions/4724701/regexp-exec-returns-null-sporadically
                        RegExpression.lastIndex = 0;
                        if (i === offset && !bFound) {
                            that.error = that.translations.errors.firstPageNotMatchRegex;
                            return false;
                        }
                        if (bFound && bFound.length > 0 && bFound[1]) {
                            newString = bFound[1];
                        }
                    }
                    if (i === offset && totalPages === 1) {
                        that.AddSplitParameter(totalPages, totalPages);
                    }
                    var stringHasChanged = that.TrimString(newString) !== cachedString;
                    var isLastPage = i === (totalPages - 1);
                    if (i === offset && bFound) {
                        //1st page of 1st doc
                        startPage = i + 1;
                        cachedString = that.TrimString(newString);
                        that.HandleArea(highlightArea, that.enableStoreArea, that.enableHighlight);
                    }
                    else if (stringHasChanged && !isLastPage && bFound) {
                        that.AddSplitParameter(startPage, i);
                        startPage = i + 1;
                        cachedString = that.TrimString(newString);
                        that.HandleArea(highlightArea, that.enableStoreArea, that.enableHighlight);
                    }
                    else if (!stringHasChanged && isLastPage && bFound) {
                        that.AddSplitParameter(startPage, totalPages);
                    }
                    else if (stringHasChanged && isLastPage && bFound) {
                        that.AddSplitParameter(startPage, i);
                        that.AddSplitParameter(totalPages, totalPages);
                        that.HandleArea(highlightArea, that.enableStoreArea, that.enableHighlight);
                    }
                    else if (isLastPage && !bFound) {
                        that.AddSplitParameter(startPage, i + 1);
                    }
                    if (!bFound || (!bRegExpUse && !that.TrimString(newString))) {
                        SplittingConditionNotFound.push((i + 1).toString());
                    }
                    return true;
                }
                offset = Lib.DD.Splitting.NormalizePositiveNumber(offset);
                // write settings in details
                Lib.DD.Splitting.details = Lib.DD.Splitting.translations.splitOnAreaChange;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.offset + " : " + offset;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.pagesNumber + " : " + totalPages;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.searchArea + " : " + sArea;
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.caseSensitive + " : " + Language.Translate(bCaseSensitive);
                Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.useRegex + " : " + Language.Translate(bRegExpUse);
                if (regExp) {
                    Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.regex + " : " + regExp;
                }
                // handle invalid params
                if (totalPages <= offset) {
                    Lib.DD.Splitting.error = Lib.DD.Splitting.translations.errors.offsetGreaterError;
                    return null;
                }
                if (!area) {
                    Lib.DD.Splitting.error = sArea === "" ? Lib.DD.Splitting.translations.errors.noAreaSpecified : Lib.DD.Splitting.translations.errors.invalidArea;
                    return null;
                }
                // we will try to match the content of the area to a regular expression, if it match then it means the start of a new doc
                bRegExpUse = bRegExpUse && regExp;
                if (bRegExpUse) {
                    var regExpFlags = (bCaseSensitive) ? "g" : "gi";
                    RegExpression = new RegExp(regExp, regExpFlags);
                }
                // effective search
                startPage = offset;
                for (var i = offset; i < totalPages; i++) {
                    var splitSuccess = _SplitAreaChange(i);
                    if (!splitSuccess) {
                        return null;
                    }
                }
                if (bSplitAreaMustBeFilled && SplittingConditionNotFound.length > 0) {
                    Lib.DD.Splitting.details += "\n" + Lib.DD.Splitting.translations.pageWithEmptySplittingArea + " : " + SplittingConditionNotFound.join(", ");
                    that.error = that.translations.errors.splittingAreaEmpty;
                    return null;
                }
                return Lib.DD.Splitting.splitParameters;
            }
            Splitting.SplitAreaChange = SplitAreaChange;
            /**
            * Retrieve the first page that correspond of criteria pase in parameters to offset value
            *
            * @param {number} totalPages total number of pages
            * @param {string} sArea string containing X,Y,W,H
            * @param {bool} bCaseSensitive use case sensitivity if true
            * @param {bool} bRegExpUse use regex mod if true
            * @param {string} searchString in regex mode the regex string to match
            * @return {number} the first page that corresponding, 0 if not found corresponding string
            */
            function GetOffsetOnArea(totalPages, sArea, bCaseSensitive, bRegExpUse, searchString) {
                var area = Lib.DD.Splitting.GetAreaFromCoordinates(sArea);
                var RegExpression = null;
                var bFound = true;
                var lowerSearchString = searchString ? searchString.toLowerCase() : "";
                function _IsAreaMatch(pageNum) {
                    var highlightArea = Document.GetArea(pageNum, area.x, area.y, area.width, area.height);
                    var areaText = highlightArea.toString();
                    if (areaText) {
                        var lowerAreaText = areaText.toLowerCase();
                        if (bRegExpUse) {
                            bFound = RegExpression.exec(areaText);
                            //see http://stackoverflow.com/questions/4724701/regexp-exec-returns-null-sporadically
                            RegExpression.lastIndex = 0;
                            if (bFound && bFound.length > 0 && bFound[0]) {
                                return pageNum;
                            }
                        }
                        else if ((bCaseSensitive && areaText.indexOf(searchString) !== -1)
                            || (!bCaseSensitive && lowerAreaText.indexOf(lowerSearchString) !== -1)) {
                            return pageNum;
                        }
                    }
                    return -1;
                }
                bRegExpUse = bRegExpUse && !!searchString;
                if (bRegExpUse) {
                    var regExpFlags = bCaseSensitive ? "g" : "gi";
                    RegExpression = new RegExp(searchString, regExpFlags);
                }
                if (!area) {
                    Log.Error(sArea === "" ? Lib.DD.Splitting.translations.errors.noAreaSpecified : Lib.DD.Splitting.translations.errors.invalidArea);
                    return 0;
                }
                for (var i = 0; i < totalPages; i++) {
                    var splitSuccess = _IsAreaMatch(i);
                    if (splitSuccess !== -1) {
                        return splitSuccess;
                    }
                }
                return 0;
            }
            Splitting.GetOffsetOnArea = GetOffsetOnArea;
            /**
            * Retrieve offset value according selected options
            *
            * @param {string} skipMethod type of skip selected
            * @param {number} fixedOffset value of offset if no area selected
            * @param {number} totalPages total number of pages
            * @param {string} sArea string containing X,Y,W,H
            * @param {bool} bCaseSensitive use case sensitivity if true
            * @param {bool} bRegExpUse use regex mod if true
            * @param {string} regExp in regex mode the regex string to match
            * @return {number} offset page number
            */
            function GetOffset(skipMethod, fixedOffset, totalPages, sArea, bCaseSensitive, bRegExpUse, regExp) {
                if (skipMethod === "SKIP_AREA") {
                    return Lib.DD.Splitting.GetOffsetOnArea(totalPages, sArea, bCaseSensitive, bRegExpUse, regExp);
                }
                return fixedOffset;
            }
            Splitting.GetOffset = GetOffset;
        })(Splitting = DD.Splitting || (DD.Splitting = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
