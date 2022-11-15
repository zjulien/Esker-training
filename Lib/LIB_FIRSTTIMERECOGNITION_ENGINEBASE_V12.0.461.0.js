///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_FirstTimeRecognition_EngineBase_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_FirstTimeRecognition_V12.0.461.0",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Distance"
  ]
}*/
var Lib;
(function (Lib) {
    var FirstTimeRecognition;
    (function (FirstTimeRecognition) {
        var EngineBase;
        (function (EngineBase) {
            EngineBase._DEBUG = "";
            EngineBase._DEBUG_activated = false;
            function ActivateLog(activateFlag) {
                EngineBase._DEBUG_activated = activateFlag;
            }
            EngineBase.ActivateLog = ActivateLog;
            function DebugLogln(message) {
                if (EngineBase._DEBUG_activated) {
                    EngineBase._DEBUG += message + "\n";
                }
            }
            EngineBase.DebugLogln = DebugLogln;
            function DebugLog(message) {
                if (EngineBase._DEBUG_activated) {
                    EngineBase._DEBUG += message;
                }
            }
            EngineBase.DebugLog = DebugLog;
            function GetDebugLog() {
                return EngineBase._DEBUG;
            }
            EngineBase.GetDebugLog = GetDebugLog;
            var LineItem = /** @class */ (function () {
                function LineItem() {
                    this.quantity = null;
                    this.unitPrice = null;
                    this.amount = null;
                    this.description = null;
                }
                return LineItem;
            }());
            EngineBase.LineItem = LineItem;
            var Candidate = /** @class */ (function () {
                function Candidate() {
                    this.area = null;
                    this.standardStringValue = null;
                }
                return Candidate;
            }());
            EngineBase.Candidate = Candidate;
            var TextCandidate = /** @class */ (function (_super) {
                __extends(TextCandidate, _super);
                function TextCandidate() {
                    return _super.call(this) || this;
                }
                return TextCandidate;
            }(Candidate));
            EngineBase.TextCandidate = TextCandidate;
            var DateCandidate = /** @class */ (function (_super) {
                __extends(DateCandidate, _super);
                function DateCandidate() {
                    var _this = _super.call(this) || this;
                    _this.dateValue = null;
                    return _this;
                }
                return DateCandidate;
            }(Candidate));
            EngineBase.DateCandidate = DateCandidate;
            var AmountCandidate = /** @class */ (function (_super) {
                __extends(AmountCandidate, _super);
                function AmountCandidate() {
                    var _this = _super.call(this) || this;
                    // [0-9]+(\.[0-9]+)?
                    _this.decimalValue = null;
                    _this.decimal = false;
                    return _this;
                }
                return AmountCandidate;
            }(Candidate));
            EngineBase.AmountCandidate = AmountCandidate;
            function AmountKnownCultureToAmountStandardStringFormat(amount, culture) {
                return Data.ExtractNumber(amount, culture).toString();
            }
            EngineBase.AmountKnownCultureToAmountStandardStringFormat = AmountKnownCultureToAmountStandardStringFormat;
            function AmountUnknownCultureToAmountStandardStringFormat(amount, allowInteger, maxDecimal, fuzzy) {
                return Lib.CrossCultural.Amount.ConvertToAmountOrFormattedString(amount, true, allowInteger, maxDecimal, fuzzy);
            }
            EngineBase.AmountUnknownCultureToAmountStandardStringFormat = AmountUnknownCultureToAmountStandardStringFormat;
            function AmountStandardStringFormatToDecimal(amount) {
                return amount.length === 0 ? null : parseFloat(amount);
            }
            EngineBase.AmountStandardStringFormatToDecimal = AmountStandardStringFormatToDecimal;
            function DateKnownCultureToDateStandardStringFormat(date, culture) {
                var jsDate = Data.ExtractDate(date, culture);
                var buf = null;
                var dateParts = [];
                buf = jsDate.getFullYear().toString();
                dateParts.push(buf);
                buf = (jsDate.getMonth() + 1).toString();
                if (buf.length == 1) {
                    buf = "0" + buf;
                }
                dateParts.push(buf);
                buf = jsDate.getDate().toString();
                if (buf.length == 1) {
                    buf = "0" + buf;
                }
                dateParts.push(buf);
                return dateParts.join("-");
            }
            EngineBase.DateKnownCultureToDateStandardStringFormat = DateKnownCultureToDateStandardStringFormat;
            function DateUnknownCultureToDateStandardStringFormat(date, expectMonthBeforeDate, fuzzy) {
                return Lib.CrossCultural.Date.ConvertToDateOrFormattedString(date, "yyyy-MM-dd", expectMonthBeforeDate, fuzzy);
            }
            EngineBase.DateUnknownCultureToDateStandardStringFormat = DateUnknownCultureToDateStandardStringFormat;
            // MFL20141016_2 Allow a date to be offsetted (for Thai buddhist calendar)
            function DateJSToDateStandardStringFormat(date) {
                return Lib.CrossCultural.Date.formatDateTime(date, "yyyy-MM-dd");
            }
            EngineBase.DateJSToDateStandardStringFormat = DateJSToDateStandardStringFormat;
            function DateStandardStringFormatToDate(date) {
                // MFL20141007_1 - Adding radix in order to ensure a decimal conversion of numbers preceeded by 0
                return date.length === 0 ? null : new Date(parseInt(date.substr(0, 4), 10), parseInt(date.substr(5, 2), 10) - 1, parseInt(date.substr(8, 2), 10), 0, 0, 0, 0);
            }
            EngineBase.DateStandardStringFormatToDate = DateStandardStringFormatToDate;
            function YCM2DOTS(page, cm) {
                return cm * Document.GetPageResolutionY(page) / 2.54;
            }
            EngineBase.YCM2DOTS = YCM2DOTS;
            function XCM2DOTS(page, cm) {
                return cm * Document.GetPageResolutionX(page) / 2.54;
            }
            EngineBase.XCM2DOTS = XCM2DOTS;
            // Returns values:
            // 0 - areas are not aligned
            // > 0 - areas are aligned. Following flags can be set:
            EngineBase.ALIGNED_HTOP = parseInt("10000000", 2);
            EngineBase.ALIGNED_HBOTTOM = parseInt("01000000", 2);
            EngineBase.ALIGNED_HCENTER = parseInt("00100000", 2);
            EngineBase.ALIGNED_VLEFT = parseInt("00010000", 2);
            EngineBase.ALIGNED_VRIGHT = parseInt("00001000", 2);
            EngineBase.ALIGNED_VCENTER = parseInt("00000100", 2);
            // Those flags sets allow to quickly find out if two areas are aligned one way or another:
            // if (Lib.FirstTimeRecognition.EngineBase.ALIGNED_HORIZONTALLY & Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment( a, b, true, x ))
            EngineBase.ALIGNED_HORIZONTALLY = parseInt("11100000", 2);
            EngineBase.ALIGNED_VERTICALLY = parseInt("00011100", 2);
            EngineBase.ALIGNED_OVERLAPPED = parseInt("11111100", 2);
            function CheckAreasAlignment(a, b, ignorePages, alignmentTolerance) {
                var alignmentFactor = 0;
                if (ignorePages || a.page == b.page) {
                    var verticalAlignmentTolerance = alignmentTolerance * (a.width + b.width) / 2;
                    var horizontalAlignmentTolerance = alignmentTolerance * (a.height + b.height) / 2;
                    if (Math.abs(a.y - b.y) <= horizontalAlignmentTolerance) {
                        alignmentFactor |= Lib.FirstTimeRecognition.EngineBase.ALIGNED_HTOP;
                    }
                    if (Math.abs(a.y + a.height - b.y - b.height) <= horizontalAlignmentTolerance) {
                        alignmentFactor |= Lib.FirstTimeRecognition.EngineBase.ALIGNED_HBOTTOM;
                    }
                    if (Math.abs(a.y + a.height / 2 - b.y - b.height / 2) <= horizontalAlignmentTolerance) {
                        alignmentFactor |= Lib.FirstTimeRecognition.EngineBase.ALIGNED_HCENTER;
                    }
                    if (Math.abs(a.x - b.x) <= verticalAlignmentTolerance) {
                        alignmentFactor |= Lib.FirstTimeRecognition.EngineBase.ALIGNED_VLEFT;
                    }
                    if (Math.abs(a.x + a.width - b.x - b.width) <= verticalAlignmentTolerance) {
                        alignmentFactor |= Lib.FirstTimeRecognition.EngineBase.ALIGNED_VRIGHT;
                    }
                    if (Math.abs(a.x + a.width / 2 - b.x - b.width / 2) <= verticalAlignmentTolerance) {
                        alignmentFactor |= Lib.FirstTimeRecognition.EngineBase.ALIGNED_VCENTER;
                    }
                }
                return alignmentFactor;
            }
            EngineBase.CheckAreasAlignment = CheckAreasAlignment;
            function AreAreasAligned(areas, ignorePages, alignmentTolerance) {
                if (areas.length < 2) {
                    return false;
                }
                var areasAreAligned = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(areas[0], areas[1], ignorePages, alignmentTolerance);
                for (var i = 2; i < areas.length; ++i) {
                    areasAreAligned &= Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(areas[i - 1], areas[i], ignorePages, alignmentTolerance);
                }
                return areasAreAligned > 0;
            }
            EngineBase.AreAreasAligned = AreAreasAligned;
            function AreAreasAlignedWithArea(areas, area, ignorePages, alignmentTolerance) {
                var areasAreAligned;
                if (areas.length < 1) {
                    return false;
                }
                else if (areas.length > 1) {
                    areasAreAligned = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(areas[0], areas[1], ignorePages, alignmentTolerance);
                    var lastElem = areas.length - 1;
                    for (var i = 2; i <= lastElem; ++i) {
                        areasAreAligned &= Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(areas[i - 1], areas[i], ignorePages, alignmentTolerance);
                    }
                    areasAreAligned &= Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(areas[lastElem], area, ignorePages, alignmentTolerance);
                }
                else {
                    areasAreAligned = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(areas[0], area, ignorePages, alignmentTolerance);
                }
                return areasAreAligned > 0;
            }
            EngineBase.AreAreasAlignedWithArea = AreAreasAlignedWithArea;
            EngineBase.SEEK_BEFORE = 1;
            EngineBase.SEEK_AFTER = 2;
            EngineBase.SEEK_BOTH = 3;
            /**
            * 20140811 (MFL)
            * GetBlockAroundArea: Retrieve an area containing the text block around a given area
            * @param referenceArea: the "search starting point" (Anchro within the text block)
            * @param vSeekDirection: the direction the search should follow (Before: on top of the anchor, After: to the bottom of the anchor)
            * @param hSpaceTolerane
            * @param vSpaceTolerance
            * @param alignmentTolerance
            * @param maximumNumberOfLines: indicates the maximum number of line the text should contain. If no limit is required, 0 should be passed
            * @return the area containing the surrounding text block
            **/
            function GetBlockAroundArea(referenceArea, vSeekDirection, hSpaceTolerance, vSpaceTolerance, alignmentTolerance, maximumNumberOfLines) {
                if (referenceArea === null) {
                    return null;
                }
                var referenceHeight, newLineIndex, newAvgHeight, newTolerance, newArea, spaceIndex, lastSeparator;
                Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Ready to extract up to " + maximumNumberOfLines + " around " + referenceArea.toString() + ". Direction: " + vSeekDirection + "vSpaceTolerance: " + vSpaceTolerance);
                referenceArea = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(referenceArea, Lib.FirstTimeRecognition.EngineBase.SEEK_BOTH, /^.+$/, hSpaceTolerance, alignmentTolerance, null);
                var lineCounter = 1;
                var avgCharWidth = referenceArea.toString().length > 0 ? referenceArea.width / referenceArea.toString().length : 1;
                // MFL20140811_1 - Stop looping if maximumNumberOfLines if greater than 0 and equals to the lineCounter
                while (vSeekDirection & Lib.FirstTimeRecognition.EngineBase.SEEK_BEFORE && (maximumNumberOfLines === 0 || lineCounter < maximumNumberOfLines)) {
                    referenceHeight = referenceArea.height / lineCounter;
                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: line " + lineCounter + ": referenceHeight = " + referenceHeight);
                    var previousArea = Document.GetArea(referenceArea.page, referenceArea.x, referenceArea.y - 2 * referenceHeight, referenceArea.width, 2 * referenceHeight);
                    if (typeof previousArea === "undefined" || previousArea === null) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig above after line " + lineCounter + " because no area has been found");
                        break;
                    }
                    var previousAreaContent = previousArea.toString();
                    if (previousAreaContent.length === 0) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig above after line " + lineCounter + " because found area is empty");
                        break;
                    }
                    newLineIndex = previousAreaContent.lastIndexOf("\n");
                    spaceIndex = previousAreaContent.lastIndexOf(" ");
                    if (newLineIndex == -1 && spaceIndex == -1) {
                        lastSeparator = -1;
                    }
                    else if (newLineIndex == -1) {
                        lastSeparator = spaceIndex;
                    }
                    else if (spaceIndex == -1) {
                        lastSeparator = newLineIndex;
                    }
                    else {
                        lastSeparator = Math.max(newLineIndex, spaceIndex);
                    }
                    var previousWord = lastSeparator == -1 ? previousAreaContent : previousAreaContent.substring(lastSeparator + 1);
                    var previousAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(Document.SearchString(previousWord, previousArea, true, false), Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, alignmentTolerance, false, true);
                    previousArea = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(previousAreas[0], Lib.FirstTimeRecognition.EngineBase.SEEK_BOTH, /^.+$/, hSpaceTolerance, alignmentTolerance, null);
                    if (typeof previousArea === "undefined" || previousArea === null || previousArea.y + previousArea.height >= referenceArea.y) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig above after line " + lineCounter + " (word search) because no area has been found or area overlaps current area");
                        break;
                    }
                    previousAreaContent = previousArea.toString();
                    if (previousAreaContent.length === 0) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig above after line " + lineCounter + " (word search) because found area is empty");
                        break;
                    }
                    if (Math.abs(previousArea.x - referenceArea.x) > avgCharWidth && Math.abs(previousArea.x + previousArea.width - (referenceArea.x + referenceArea.width)) > avgCharWidth && Math.abs(previousArea.x + previousArea.width / 2 - (referenceArea.x + referenceArea.width / 2)) > avgCharWidth) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig above after line " + lineCounter + " because found area is not aligned");
                        break;
                    }
                    newAvgHeight = (referenceArea.y + referenceArea.height - previousArea.y) / (lineCounter + 1);
                    newTolerance = referenceHeight / newAvgHeight;
                    if (referenceHeight / ((referenceArea.y + referenceArea.height - previousArea.y) / (lineCounter + 1)) < vSpaceTolerance) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig above after line " + lineCounter + " because found area is too far away (newAvgHeight: " + newAvgHeight + ", newTolerance: " + newTolerance + ")");
                        break;
                    }
                    newArea = Document.GetArea(referenceArea.page, Math.min(previousArea.x, referenceArea.x), previousArea.y, Math.max(previousArea.width, referenceArea.width), referenceArea.y + referenceArea.height - previousArea.y);
                    if (!newArea || newArea.width < 0 || newArea.height < 0 || newArea.toString().length === 0) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig above after line " + lineCounter + " because found area is not consistent");
                        break;
                    }
                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Adding one line above");
                    avgCharWidth = (avgCharWidth + previousArea.width / previousAreaContent.length) / 2;
                    ++lineCounter;
                    referenceArea = newArea;
                }
                // MFL20140811_1 - Stop looping if maximumNumberOfLines if greater than 0 and equals to the lineCounter
                while (vSeekDirection & Lib.FirstTimeRecognition.EngineBase.SEEK_AFTER && (maximumNumberOfLines === 0 || lineCounter < maximumNumberOfLines)) {
                    referenceHeight = referenceArea.height / lineCounter;
                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: line " + lineCounter + ": referenceHeight = " + referenceHeight);
                    var nextArea = Document.GetArea(referenceArea.page, referenceArea.x, referenceArea.y + referenceArea.height, referenceArea.width, 2 * referenceHeight);
                    // MF20140623_1 - Changed previousArea to nextArea
                    if (nextArea === null) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig below after line " + lineCounter + " because no area has been found");
                        break;
                    }
                    var nextAreaContent = nextArea.toString();
                    if (nextAreaContent.length === 0) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig below after line " + lineCounter + " because found area is empty");
                        break;
                    }
                    newLineIndex = nextAreaContent.indexOf("\n");
                    spaceIndex = nextAreaContent.indexOf(" ");
                    var firstSeparator = void 0;
                    if (newLineIndex == -1 && spaceIndex == -1) {
                        firstSeparator = -1;
                    }
                    else if (newLineIndex == -1) {
                        firstSeparator = spaceIndex;
                    }
                    else if (spaceIndex == -1) {
                        firstSeparator = newLineIndex;
                    }
                    else {
                        firstSeparator = Math.min(newLineIndex, spaceIndex);
                    }
                    var nextWord = firstSeparator == -1 ? nextAreaContent : nextAreaContent.substr(0, firstSeparator);
                    var nextAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(Document.SearchString(nextWord, nextArea, true, false), Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, alignmentTolerance, false, false);
                    nextArea = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(nextAreas[0], Lib.FirstTimeRecognition.EngineBase.SEEK_BOTH, /^.+$/, hSpaceTolerance, alignmentTolerance, null);
                    if (nextArea === null || referenceArea.y + referenceArea.height > nextArea.y) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig below after line " + lineCounter + " (word search) because no area has been found or area overlaps current area");
                        break;
                    }
                    nextAreaContent = nextArea.toString();
                    if (nextAreaContent.length === 0) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig below after line " + lineCounter + " (word search) because found area is empty");
                        break;
                    }
                    if (Math.abs(nextArea.x - referenceArea.x) > avgCharWidth && Math.abs(nextArea.x + nextArea.width - (referenceArea.x + referenceArea.width)) > avgCharWidth && Math.abs(nextArea.x + nextArea.width / 2 - (referenceArea.x + referenceArea.width / 2)) > avgCharWidth) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig below after line " + lineCounter + " because found area is not aligned");
                        break;
                    }
                    newAvgHeight = (nextArea.y + nextArea.height - referenceArea.y) / (lineCounter + 1);
                    newTolerance = referenceHeight / newAvgHeight;
                    if (referenceHeight / ((nextArea.y + nextArea.height - referenceArea.y) / (lineCounter + 1)) < vSpaceTolerance) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig below after line " + lineCounter + " because found area is too far away (newAvgHeight: " + newAvgHeight + ", newTolerance: " + newTolerance + ")");
                        break;
                    }
                    newArea = Document.GetArea(referenceArea.page, Math.min(nextArea.x, referenceArea.x), referenceArea.y, Math.max(nextArea.width, referenceArea.width), nextArea.y + nextArea.height - referenceArea.y);
                    if (!newArea || newArea.width < 0 || newArea.height < 0 || newArea.toString().length === 0) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Stopping seekig below after line " + lineCounter + " because found area is not consistent");
                        break;
                    }
                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("GetBlockAroundArea: Adding one line below");
                    // MF20140623_1 - Changed previousArea to nextArea
                    avgCharWidth = (avgCharWidth + nextArea.width / nextArea.toString().length) / 2;
                    ++lineCounter;
                    referenceArea = newArea;
                }
                return referenceArea;
            }
            EngineBase.GetBlockAroundArea = GetBlockAroundArea;
            function GetLineAroundArea(referenceArea, seekDirection, pattern, spaceTolerance, alignmentTolerance, validate) {
                if (!referenceArea) {
                    return null;
                }
                var pageResolutionX = null;
                var newLineIndex, newAreaWidth, referenceAreaContent, refAverage, newArea, spaceIndex;
                while (seekDirection & Lib.FirstTimeRecognition.EngineBase.SEEK_BEFORE) {
                    var leftMostSide = referenceArea.x;
                    var previousArea = Document.GetArea(referenceArea.page, 0, referenceArea.y, leftMostSide, referenceArea.height);
                    if (!previousArea) {
                        break;
                    }
                    var previousAreaContent = previousArea.toString();
                    if (previousAreaContent.length === 0) {
                        break;
                    }
                    newLineIndex = previousAreaContent.lastIndexOf("\n");
                    spaceIndex = previousAreaContent.lastIndexOf(" ");
                    var lastSeparator = void 0;
                    if (newLineIndex === -1 && spaceIndex === -1) {
                        lastSeparator = -1;
                    }
                    else if (newLineIndex === -1) {
                        lastSeparator = spaceIndex;
                    }
                    else if (spaceIndex === -1) {
                        lastSeparator = newLineIndex;
                    }
                    else {
                        lastSeparator = Math.max(newLineIndex, spaceIndex);
                    }
                    var previousWord = lastSeparator == -1 ? previousAreaContent : previousAreaContent.substring(lastSeparator + 1);
                    var previousAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(Document.SearchString(previousWord, previousArea, true, false), Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, alignmentTolerance, false, true);
                    previousArea = previousAreas[0];
                    if (!previousArea || previousArea.x + previousArea.width > referenceArea.x) {
                        break;
                    }
                    previousAreaContent = previousArea.toString();
                    if (previousAreaContent.length === 0) {
                        break;
                    }
                    if (Math.abs(previousArea.y + previousArea.height - (referenceArea.y + referenceArea.height)) > alignmentTolerance * (previousArea.height + referenceArea.height) / 2) {
                        break;
                    }
                    if (previousAreaContent.search(pattern) !== 0 || typeof validate === "function" && !validate(previousAreaContent)) {
                        break;
                    }
                    referenceAreaContent = referenceArea.toString();
                    if (referenceAreaContent.length > 1 && previousAreaContent.length <= 1) {
                        refAverage = referenceArea.width / referenceAreaContent.length;
                    }
                    else if (previousAreaContent.length > 1 && referenceAreaContent.length <= 1) {
                        refAverage = previousArea.width / previousAreaContent.length;
                    }
                    else {
                        refAverage = (referenceArea.width / referenceAreaContent.length + previousArea.width / previousAreaContent.length) / 2;
                    }
                    newAreaWidth = referenceArea.x + referenceArea.width - previousArea.x;
                    /*Log.Info("nac: " + previousAreaContent);
                        Log.Info("refAvg: " + refAverage.toString());
                        Log.Info("newWidth: " + newAreaWidth.toString());
                        Log.Info("new num chars: " + (referenceAreaContent.length + previousAreaContent.length + 1).toString());*/
                    if (refAverage / (newAreaWidth / (referenceAreaContent.length + previousAreaContent.length + 1)) < spaceTolerance) {
                        break;
                    }
                    newArea = Document.GetArea(referenceArea.page, previousArea.x, Math.min(referenceArea.y, previousArea.y), newAreaWidth, Math.max(referenceArea.height, previousArea.height));
                    if (!newArea || newArea.width < 0 || newArea.height < 0 || newArea.toString().length === 0) {
                        break;
                    }
                    referenceArea = newArea;
                }
                while (seekDirection & Lib.FirstTimeRecognition.EngineBase.SEEK_AFTER) {
                    if (pageResolutionX === null) {
                        pageResolutionX = Document.GetPageWidth(referenceArea.page);
                    }
                    var rightMostSide = referenceArea.x + referenceArea.width;
                    var nextArea = Document.GetArea(referenceArea.page, rightMostSide, referenceArea.y, pageResolutionX - rightMostSide, referenceArea.height);
                    if (!nextArea) {
                        break;
                    }
                    var nextAreaContent = nextArea.toString();
                    if (nextAreaContent.length === 0) {
                        break;
                    }
                    newLineIndex = nextAreaContent.indexOf("\n");
                    spaceIndex = nextAreaContent.indexOf(" ");
                    var firstSeparator = void 0;
                    if (newLineIndex === -1 && spaceIndex === -1) {
                        firstSeparator = -1;
                    }
                    else if (newLineIndex === -1) {
                        firstSeparator = spaceIndex;
                    }
                    else if (spaceIndex === -1) {
                        firstSeparator = newLineIndex;
                    }
                    else {
                        firstSeparator = Math.min(newLineIndex, spaceIndex);
                    }
                    var nextWord = firstSeparator == -1 ? nextAreaContent : nextAreaContent.substr(0, firstSeparator);
                    var nextAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(Document.SearchString(nextWord, nextArea, true, false), Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, alignmentTolerance, false, false);
                    nextArea = nextAreas[0];
                    if (typeof nextArea === "undefined" || nextArea === null || referenceArea.x + referenceArea.width > nextArea.x) {
                        break;
                    }
                    nextAreaContent = nextArea.toString();
                    if (nextAreaContent.length === 0) {
                        break;
                    }
                    if (Math.abs(nextArea.y + nextArea.height - (referenceArea.y + referenceArea.height)) > alignmentTolerance * (nextArea.height + referenceArea.height) / 2) {
                        break;
                    }
                    if (nextAreaContent.search(pattern) !== 0 || typeof validate === "function" && !validate(nextAreaContent)) {
                        break;
                    }
                    referenceAreaContent = referenceArea.toString();
                    if (referenceAreaContent.length > 1 && nextAreaContent.length <= 1) {
                        refAverage = referenceArea.width / referenceAreaContent.length;
                    }
                    else if (nextAreaContent.length > 1 && referenceAreaContent.length <= 1) {
                        refAverage = nextArea.width / nextAreaContent.length;
                    }
                    else {
                        refAverage = (referenceArea.width / referenceAreaContent.length + nextArea.width / nextAreaContent.length) / 2;
                    }
                    newAreaWidth = nextArea.x + nextArea.width - referenceArea.x;
                    /* Log.Info("nac: " + nextAreaContent);
                        Log.Info("refAvg: " + refAverage.toString());
                        Log.Info("newWidth: " + newAreaWidth.toString());
                        Log.Info("new num chars: " + (referenceAreaContent.length + nextAreaContent.length + 1).toString());*/
                    if (refAverage / (newAreaWidth / (referenceAreaContent.length + nextAreaContent.length + 1)) < spaceTolerance) {
                        break;
                    }
                    newArea = Document.GetArea(referenceArea.page, referenceArea.x, Math.min(referenceArea.y, nextArea.y), newAreaWidth, Math.max(referenceArea.height, nextArea.height));
                    if (!newArea || newArea.width < 0 || newArea.height < 0 || newArea.toString().length === 0) {
                        break;
                    }
                    referenceArea = newArea;
                }
                return referenceArea;
            }
            EngineBase.GetLineAroundArea = GetLineAroundArea;
            function ScanLineItem(referenceArea, seekDirection, spaceTolerance, alignmentTolerance) {
                var areas = [];
                referenceArea = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(referenceArea, seekDirection, /^.+$/, spaceTolerance, alignmentTolerance, null);
                var areaBefore = referenceArea;
                var areaAfter = referenceArea;
                while (seekDirection & Lib.FirstTimeRecognition.EngineBase.SEEK_BEFORE) {
                    var areaBeforeBackup = areaBefore;
                    areaBefore = areaBefore.GetPreviousWord();
                    // *********************************************************************
                    // fix RD00007511 : Avoid infinite loop if area on the left is the same as root area
                    if (areaBefore !== null &&
                        areaBefore.page === areaBeforeBackup.page &&
                        areaBefore.width === areaBeforeBackup.width &&
                        areaBefore.height === areaBeforeBackup.height &&
                        areaBefore.x === areaBeforeBackup.x &&
                        areaBefore.y === areaBeforeBackup.y) {
                        areaBefore = null;
                    }
                    // end fix
                    if (areaBefore !== null && Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(areaBefore, referenceArea, false, alignmentTolerance) & Lib.FirstTimeRecognition.EngineBase.ALIGNED_HORIZONTALLY) {
                        areaBefore = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(areaBefore, Lib.FirstTimeRecognition.EngineBase.SEEK_BEFORE, /^.+$/, spaceTolerance, alignmentTolerance, null);
                        areas.push(areaBefore);
                    }
                    else {
                        break;
                    }
                }
                areas.push(referenceArea);
                while (seekDirection & Lib.FirstTimeRecognition.EngineBase.SEEK_AFTER) {
                    var areaAfterBackup = areaAfter;
                    areaAfter = areaAfter.GetNextWord();
                    // *********************************************************************
                    // fix RD00007511 : Avoid infinite loop if area on the right is the same as root area
                    if (areaAfter !== null &&
                        areaAfter.page === areaAfterBackup.page &&
                        areaAfter.width === areaAfterBackup.width &&
                        areaAfter.height === areaAfterBackup.height &&
                        areaAfter.x === areaAfterBackup.x &&
                        areaAfter.y === areaAfterBackup.y) {
                        areaAfter = null;
                    }
                    // end fix
                    if (areaAfter !== null && Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(areaAfter, referenceArea, false, alignmentTolerance) & Lib.FirstTimeRecognition.EngineBase.ALIGNED_HORIZONTALLY) {
                        areaAfter = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(areaAfter, Lib.FirstTimeRecognition.EngineBase.SEEK_AFTER, /^.+$/, spaceTolerance, alignmentTolerance, null);
                        areas.push(areaAfter);
                    }
                    else {
                        break;
                    }
                }
                return areas;
            }
            EngineBase.ScanLineItem = ScanLineItem;
            function AreAreasOverlapping(a, b) {
                return a !== null && b !== null && a.page !== null && a.page == b.page && (a.x >= b.x && a.x <= b.x + b.width || b.x >= a.x && b.x <= a.x + a.width) && (a.y >= b.y && a.y <= b.y + b.height || b.y >= a.y && b.y <= a.y + a.height);
            }
            EngineBase.AreAreasOverlapping = AreAreasOverlapping;
            // CR20141021 - Replace GetWordAbove for tolerance in keyword search
            function GetAreaAbove(area, newXTolerance, newYTolerance) {
                var offsetX = 0.5;
                if (newXTolerance) {
                    offsetX = newXTolerance;
                }
                var offsetY = 1;
                if (newYTolerance) {
                    offsetY = newYTolerance;
                }
                // XTolerance ~0.5cm
                var XTolerance = Document.GetPageResolutionX(area.page) * offsetX / 2.54;
                // YTolerance ~1cm
                var YTolerance = Document.GetPageResolutionY(area.page) * offsetY / 2.54;
                return Document.GetArea(area.page, area.x - XTolerance, area.y - YTolerance - 1, area.width + XTolerance * 2, YTolerance);
            }
            EngineBase.GetAreaAbove = GetAreaAbove;
            // CR20141021 - Replace GetPreviousWord for tolerance in keyword search
            function GetAreaOnTheLeft(area, newXTolerance, newYTolerance) {
                var offsetX = 5;
                if (newXTolerance) {
                    offsetX = newXTolerance;
                }
                var offsetY = 0.1;
                if (newYTolerance) {
                    offsetY = newYTolerance;
                }
                // XTolerance ~5cm
                var XTolerance = Document.GetPageResolutionX(area.page) * offsetX / 2.54;
                // YTolerance ~0.1cm
                var YTolerance = Document.GetPageResolutionY(area.page) * offsetY / 2.54;
                return Document.GetArea(area.page, area.x - area.width - XTolerance, area.y - YTolerance, area.width + 1 + XTolerance, area.height + YTolerance * 2);
            }
            EngineBase.GetAreaOnTheLeft = GetAreaOnTheLeft;
            // MFL20140825 - Obsolete - Consider GetKeyword instead
            function GetSurroundingTextBeforeAndAboveArea(area, spaceTolerance, alignmentTolerance) {
                var leftOf = Lib.FirstTimeRecognition.EngineBase.GetAreaOnTheLeft(area);
                var alignmentFactor;
                // Avoid detecting ":"
                if (leftOf !== null && leftOf.toString().length == 1) {
                    leftOf = leftOf.GetPreviousWord();
                }
                if (leftOf !== null && leftOf.toString().length > 0) {
                    alignmentFactor = alignmentTolerance * (area.height + leftOf.height) / 2;
                    if (Math.abs(area.y - leftOf.y) > alignmentFactor && Math.abs(area.y + area.height - (leftOf.y + leftOf.height)) > alignmentFactor && Math.abs(area.y + area.height / 2 - (leftOf.y + leftOf.height / 2)) > alignmentFactor) {
                        leftOf = null;
                    }
                    else {
                        leftOf = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(leftOf, Lib.FirstTimeRecognition.EngineBase.SEEK_BEFORE, /[^ ]+/, spaceTolerance, alignmentTolerance, null);
                    }
                }
                if (leftOf !== null) {
                    if (leftOf.toString().length === 0) {
                        leftOf = null;
                    }
                }
                var above = Lib.FirstTimeRecognition.EngineBase.GetAreaAbove(area);
                if (above !== null && above.toString().length > 0) {
                    //Lib.FirstTimeRecognition.EngineBase.DebugLog(" above : " + above.toString() + "\n");
                    above = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(above, Lib.FirstTimeRecognition.EngineBase.SEEK_BOTH, /[^ ]+/, spaceTolerance, alignmentTolerance, null);
                    var acceptableRatio = (above.height > area.height ? area.height / above.height : above.height / area.height) >= 0.5 && (above.width > area.width ? area.width / above.width : above.width / area.width) >= 0.25;
                    alignmentFactor = alignmentTolerance * (area.width + above.width) / 2;
                    if ((Math.abs(area.x - above.x) > alignmentFactor || !acceptableRatio) && (Math.abs(area.x + area.width - (above.x + above.width)) > alignmentFactor || !acceptableRatio) && Math.abs(area.x + area.width / 2 - (above.x + above.width / 2)) > alignmentFactor) {
                        above = null;
                    }
                }
                if (above && above.toString().length === 0) {
                    above = null;
                }
                var result = "";
                if (above !== null) {
                    var keywordAndFieldPattern = /.+[A-Z].+: [^ ]+/i;
                    if (keywordAndFieldPattern.test(above.toString())) {
                        above = null;
                    }
                }
                if (leftOf !== null && above !== null) {
                    result = leftOf.toString() + "\n" + above.toString();
                }
                else if (leftOf !== null) {
                    result = leftOf.toString();
                }
                else if (above !== null) {
                    result = above.toString();
                }
                return result;
            }
            EngineBase.GetSurroundingTextBeforeAndAboveArea = GetSurroundingTextBeforeAndAboveArea;
            function GetKeywordOnTheLeft(area, spaceTolerance, alignmentTolerance) {
                var leftOf = Lib.FirstTimeRecognition.EngineBase.GetAreaOnTheLeft(area);
                if (leftOf !== null && leftOf.toString().length == 1) {
                    // Avoid detecting ":"
                    leftOf = leftOf.GetPreviousWord();
                    // fix RD00006421 : Avoid infinite loop if area on the left is the same as root area
                    if (leftOf !== null &&
                        leftOf.page === area.page &&
                        leftOf.width === area.width &&
                        leftOf.height === area.height &&
                        leftOf.x === area.x &&
                        leftOf.y === area.y) {
                        leftOf = null;
                    }
                }
                if (leftOf !== null && leftOf.toString().length > 0) {
                    var alignmentFactor = alignmentTolerance * (area.height + leftOf.height) / 2;
                    if (Math.abs(area.y - leftOf.y) > alignmentFactor && Math.abs(area.y + area.height - (leftOf.y + leftOf.height)) > alignmentFactor && Math.abs(area.y + area.height / 2 - (leftOf.y + leftOf.height / 2)) > alignmentFactor) {
                        leftOf = null;
                    }
                    else {
                        leftOf = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(leftOf, Lib.FirstTimeRecognition.EngineBase.SEEK_BEFORE, /[^ ]+/, spaceTolerance, alignmentTolerance, null);
                    }
                    // fix RD00006421 : Avoid infinite loop if area on the left is the same as root area
                    if (leftOf !== null &&
                        leftOf.page === area.page &&
                        leftOf.width === area.width &&
                        leftOf.height === area.height &&
                        leftOf.x === area.x &&
                        leftOf.y === area.y) {
                        leftOf = null;
                    }
                }
                if (leftOf !== null) {
                    if (leftOf.toString().length === 0) {
                        leftOf = null;
                    }
                }
                if (leftOf !== null) {
                    var keywordAndFieldPattern = /.+[A-Z].+: [^ ]+/i;
                    if (keywordAndFieldPattern.test(leftOf.toString())) {
                        leftOf = null;
                    }
                }
                return leftOf;
            }
            EngineBase.GetKeywordOnTheLeft = GetKeywordOnTheLeft;
            function GetKeywordOnTheRight(area, spaceTolerance, alignmentTolerance) {
                var rightOf = area.GetNextWord();
                if (rightOf !== null && rightOf.toString().length > 0) {
                    var alignmentFactor = alignmentTolerance * (area.height + rightOf.height) / 2;
                    if (Math.abs(area.y - rightOf.y) > alignmentFactor && Math.abs(area.y + area.height - (rightOf.y + rightOf.height)) > alignmentFactor && Math.abs(area.y + area.height / 2 - (rightOf.y + rightOf.height / 2)) > alignmentFactor) {
                        rightOf = null;
                    }
                    else {
                        rightOf = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(rightOf, Lib.FirstTimeRecognition.EngineBase.SEEK_AFTER, /[^ ]+/, spaceTolerance, alignmentTolerance, null);
                    }
                }
                if (rightOf !== null) {
                    if (rightOf.toString().length === 0) {
                        rightOf = null;
                    }
                }
                if (rightOf !== null) {
                    var keywordAndFieldPattern = /.+[A-Z].+: [^ ]+/i;
                    if (keywordAndFieldPattern.test(rightOf.toString())) {
                        rightOf = null;
                    }
                }
                return rightOf;
            }
            EngineBase.GetKeywordOnTheRight = GetKeywordOnTheRight;
            function GetKeywordAbove(area, spaceTolerance, alignmentTolerance, ignoreHorizontalRatio) {
                var above = Lib.FirstTimeRecognition.EngineBase.GetAreaAbove(area);
                if (above !== null && above.toString().length > 0) {
                    above = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(above, Lib.FirstTimeRecognition.EngineBase.SEEK_BOTH, /[^ ]+/, spaceTolerance, alignmentTolerance, null);
                    var acceptableRatio = (above.height > area.height ? area.height / above.height : above.height / area.height) >= 0.5 && ((above.width > area.width ? area.width / above.width : above.width / area.width) >= 0.25 || ignoreHorizontalRatio);
                    var alignmentFactor = alignmentTolerance * (area.width + above.width) / 2;
                    if ((Math.abs(area.x - above.x) > alignmentFactor || !acceptableRatio) &&
                        (Math.abs(area.x + area.width - (above.x + above.width)) > alignmentFactor || !acceptableRatio) &&
                        Math.abs(area.x + area.width / 2 - (above.x + above.width / 2)) > alignmentFactor) {
                        above = null;
                    }
                }
                if (above !== null) {
                    if (above.toString().length === 0) {
                        above = null;
                    }
                }
                if (above !== null) {
                    var keywordAndFieldPattern = /.+[A-Z].+: [^ ]+/i;
                    if (keywordAndFieldPattern.test(above.toString())) {
                        above = null;
                    }
                }
                return above;
            }
            EngineBase.GetKeywordAbove = GetKeywordAbove;
            function GetKeywordBelow(area, spaceTolerance, alignmentTolerance) {
                var below = area.GetWordBelow();
                if (below !== null && below.toString().length > 0) {
                    below = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(below, Lib.FirstTimeRecognition.EngineBase.SEEK_BOTH, /[^ ]+/, spaceTolerance, alignmentTolerance, null);
                    var acceptableRatio = (below.height > area.height ? area.height / below.height : below.height / area.height) >= 0.5 && (below.width > area.width ? area.width / below.width : below.width / area.width) >= 0.25;
                    var alignmentFactor = alignmentTolerance * (area.width + below.width) / 2;
                    if ((Math.abs(area.x - below.x) > alignmentFactor || !acceptableRatio) && (Math.abs(area.x + area.width - (below.x + below.width)) > alignmentFactor || !acceptableRatio) && Math.abs(area.x + area.width / 2 - (below.x + below.width / 2)) > alignmentFactor) {
                        below = null;
                    }
                }
                if (below !== null) {
                    if (below.toString().length === 0) {
                        below = null;
                    }
                }
                if (below !== null) {
                    var keywordAndFieldPattern = /.+[A-Z].+: [^ ]+/i;
                    if (keywordAndFieldPattern.test(below.toString())) {
                        below = null;
                    }
                }
                return below;
            }
            EngineBase.GetKeywordBelow = GetKeywordBelow;
            function GetKeyword(area, spaceTolerance, alignmentTolerance) {
                if (area.keyWord) {
                    return area.keyWord;
                }
                var above = Lib.FirstTimeRecognition.EngineBase.GetKeywordAbove(area, spaceTolerance, alignmentTolerance, true);
                // In case the keyword above is larger than the area, we check if it does not actually contain more than one keyword
                if (above !== null && above.width > area.width) {
                    var numSeparatorsAbove = above.toString().replace(/[^/]/g, "").length;
                    if (numSeparatorsAbove > 0) {
                        var extendedAreaBegin = Math.min(above.x, area.x), extendedAreaEnd = Math.max(above.x + above.width, area.x + area.width);
                        var extendedArea = Document.GetArea(area.page, extendedAreaBegin, area.y, extendedAreaEnd - extendedAreaBegin, area.height);
                        var numSeparatorsInExtendedArea = extendedArea.toString().replace(/[^/]/g, "").length;
                        if (numSeparatorsInExtendedArea == numSeparatorsAbove) {
                            var keywordsAbove = above.toString().split("/");
                            var areasBelow = extendedArea.toString().split("/");
                            for (var i = 0; i < areasBelow.length; ++i) {
                                if (areasBelow[i].trim() == area.toString().trim()) {
                                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("Keyword of " + area.toString() + ": " + keywordsAbove[i].trim());
                                    if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                                        area.Highlight(true, 0xff0000, 0xff0000);
                                        above.Highlight(true, 0xff00ff, 0xff00ff);
                                    }
                                    area.keyWord = keywordsAbove[i].trim();
                                    return area.keyWord;
                                }
                            }
                        }
                    }
                }
                above = Lib.FirstTimeRecognition.EngineBase.GetKeywordAbove(area, spaceTolerance, alignmentTolerance, false);
                var leftOf = Lib.FirstTimeRecognition.EngineBase.GetKeywordOnTheLeft(area, spaceTolerance, alignmentTolerance);
                var kwAbove = "", kwLeftOf = "";
                var areaMiddle, distanceLeft, distanceRight, alignmentFactor, aboveLeftOf, alignmentMask, distanceBelow, distanceAbove, leftOfAbove;
                if (leftOf !== null && above !== null) {
                    var rightOf = Lib.FirstTimeRecognition.EngineBase.GetKeywordOnTheRight(area, spaceTolerance, alignmentTolerance);
                    if (rightOf !== null) {
                        areaMiddle = area.x + area.width / 2;
                        distanceLeft = areaMiddle - (leftOf.x + leftOf.width / 2);
                        distanceRight = rightOf.x + rightOf.width / 2 - areaMiddle;
                        alignmentFactor = alignmentTolerance * (leftOf.x + rightOf.x + rightOf.width);
                        if (Math.abs(distanceLeft - distanceRight) < alignmentFactor) {
                            aboveLeftOf = Lib.FirstTimeRecognition.EngineBase.GetKeywordAbove(leftOf, spaceTolerance, alignmentTolerance, false);
                            var aboveRightOf = Lib.FirstTimeRecognition.EngineBase.GetKeywordAbove(rightOf, spaceTolerance, alignmentTolerance, false);
                            if (aboveLeftOf !== null && aboveRightOf !== null) {
                                alignmentMask = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(above, aboveLeftOf, false, alignmentTolerance) & Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(above, aboveRightOf, false, alignmentTolerance);
                                if (alignmentMask > 0) {
                                    kwAbove = above.toString();
                                }
                            }
                        }
                    }
                    else {
                        var farLeftOf = Lib.FirstTimeRecognition.EngineBase.GetKeywordOnTheLeft(leftOf, spaceTolerance, alignmentTolerance);
                        if (farLeftOf !== null) {
                            areaMiddle = leftOf.x + leftOf.width / 2;
                            distanceLeft = areaMiddle - (farLeftOf.x + farLeftOf.width / 2);
                            distanceRight = area.x + area.width / 2 - areaMiddle;
                            alignmentFactor = alignmentTolerance * (farLeftOf.x + area.x + area.width);
                            if (Math.abs(distanceLeft - distanceRight) < alignmentFactor) {
                                // MFL20140917_1 - ignoreHorizontalRatio flag was missing
                                aboveLeftOf = Lib.FirstTimeRecognition.EngineBase.GetKeywordAbove(leftOf, spaceTolerance, alignmentTolerance, false);
                                // MFL20140917_1 - ignoreHorizontalRatio flag was missing
                                var aboveFarLeftOf = Lib.FirstTimeRecognition.EngineBase.GetKeywordAbove(farLeftOf, spaceTolerance, alignmentTolerance, false);
                                if (aboveLeftOf !== null && aboveFarLeftOf !== null) {
                                    alignmentMask = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(above, aboveLeftOf, false, alignmentTolerance) & Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(above, aboveFarLeftOf, false, alignmentTolerance);
                                    if (alignmentMask > 0) {
                                        kwAbove = above.toString();
                                    }
                                }
                            }
                        }
                    }
                    var below = Lib.FirstTimeRecognition.EngineBase.GetKeywordBelow(area, spaceTolerance, alignmentTolerance);
                    if (below !== null) {
                        areaMiddle = area.y + area.height / 2;
                        distanceAbove = areaMiddle - (above.y + above.height / 2);
                        distanceBelow = below.y + below.height / 2 - areaMiddle;
                        alignmentFactor = alignmentTolerance * (above.y + below.y + below.height);
                        if (Math.abs(distanceAbove - distanceBelow) < alignmentFactor) {
                            leftOfAbove = Lib.FirstTimeRecognition.EngineBase.GetKeywordOnTheLeft(above, spaceTolerance, alignmentTolerance);
                            var leftOfBelow = Lib.FirstTimeRecognition.EngineBase.GetKeywordOnTheLeft(below, spaceTolerance, alignmentTolerance);
                            if (leftOfAbove !== null && leftOfBelow !== null) {
                                alignmentMask = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(leftOf, leftOfAbove, false, alignmentTolerance) & Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(leftOf, leftOfBelow, false, alignmentTolerance);
                                if (alignmentMask > 0) {
                                    kwLeftOf = leftOf.toString();
                                }
                            }
                        }
                    }
                    else {
                        // MFL20140917_1 - ignoreHorizontalRatio flag was missing
                        var farAbove = Lib.FirstTimeRecognition.EngineBase.GetKeywordAbove(above, spaceTolerance, alignmentTolerance, false);
                        if (farAbove !== null) {
                            areaMiddle = above.y + above.height / 2;
                            distanceAbove = areaMiddle - (farAbove.y + farAbove.height / 2);
                            distanceBelow = area.y + area.height / 2 - areaMiddle;
                            alignmentFactor = alignmentTolerance * (farAbove.y + area.y + area.height);
                            if (Math.abs(distanceAbove - distanceBelow) < alignmentFactor) {
                                var leftOfFarAbove = Lib.FirstTimeRecognition.EngineBase.GetKeywordOnTheLeft(farAbove, spaceTolerance, alignmentTolerance);
                                leftOfAbove = Lib.FirstTimeRecognition.EngineBase.GetKeywordOnTheLeft(above, spaceTolerance, alignmentTolerance);
                                if (leftOfFarAbove !== null && leftOfAbove !== null) {
                                    alignmentMask = Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(leftOf, leftOfFarAbove, false, alignmentTolerance) & Lib.FirstTimeRecognition.EngineBase.CheckAreasAlignment(leftOf, leftOfAbove, false, alignmentTolerance);
                                    if (alignmentMask > 0) {
                                        kwLeftOf = leftOf.toString();
                                    }
                                }
                            }
                        }
                    }
                    if (kwLeftOf.length === 0 && kwAbove.length === 0) {
                        kwAbove = above.toString();
                        kwLeftOf = leftOf.toString();
                    }
                }
                else if (leftOf !== null) {
                    kwLeftOf = leftOf.toString();
                }
                else if (above !== null) {
                    kwAbove = above.toString();
                }
                // In case only a keyword such as "nr" or "no" is found on the left, redo the keyword search from Lib.FirstTimeRecognition.EngineBase.kw
                if (kwAbove.length === 0 && kwLeftOf.length > 0) {
                    if (kwLeftOf.replace(/[^A-Z]/gi, "").length <= 2) {
                        var alternateKW = Lib.FirstTimeRecognition.EngineBase.GetKeyword(leftOf, spaceTolerance, alignmentTolerance);
                        if (alternateKW.length > 0) {
                            kwLeftOf = alternateKW;
                        }
                    }
                }
                var kw = kwAbove.length > 0 && kwLeftOf.length > 0 ? kwAbove + "\n" + kwLeftOf : kwAbove.length > 0 ? kwAbove : kwLeftOf;
                Lib.FirstTimeRecognition.EngineBase.DebugLogln("Keyword of " + area.toString() + ": " + kw);
                if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                    area.Highlight(true, 0xff0000, 0xff0000);
                    if (kwLeftOf.length > 0) {
                        leftOf.Highlight(true, 0xffff00, 0xffff00);
                    }
                    if (kwAbove.length > 0) {
                        above.Highlight(true, 0xff00ff, 0xff00ff);
                    }
                }
                area.keyWord = kw;
                return kw;
            }
            EngineBase.GetKeyword = GetKeyword;
            function SortAlongReadingDirection(a, b, lineToleranceThreshold) {
                // Same page
                if (a.page === b.page) {
                    var horizLineTolerance = lineToleranceThreshold * (a.width + b.width) / 2;
                    var vertLineTolerance = lineToleranceThreshold * (a.height + b.height) / 2;
                    // Same line
                    if (Math.abs(a.y - b.y) <= vertLineTolerance) {
                        // Identical
                        if (Math.abs(a.x - b.x) <= horizLineTolerance) {
                            return 0;
                        }
                        return a.x > b.x ? 1 : -1;
                    }
                    return a.y > b.y ? 1 : -1;
                }
                return a.page > b.page ? 1 : -1;
            }
            EngineBase.SortAlongReadingDirection = SortAlongReadingDirection;
            function SortAlongReadingDirectionCoverPagePrio(a, b, lineToleranceThreshold) {
                if (a.page == b.page) {
                    var horizLineTolerance = lineToleranceThreshold * (a.width + b.width) / 2;
                    var vertLineTolerance = lineToleranceThreshold * (a.height + b.height) / 2;
                    if (Math.abs(a.y - b.y) < vertLineTolerance && Math.abs(a.x - b.x) < horizLineTolerance) {
                        return 0;
                    }
                    else if (Math.abs(a.y - b.y) >= vertLineTolerance) {
                        if (a.y > b.y) {
                            return 1;
                        }
                        return -1;
                    }
                    else if (a.x > b.x) {
                        return 1;
                    }
                    return -1;
                    // MFL20140918_2 - Protection in case Lib.FirstTimeRecognition.EngineBase.query is made in reverse (though it does not make any sense...)
                }
                else if (a.page === 0) {
                    return 1;
                }
                else if (b.page === 0) {
                    return -1;
                }
                else if (a.page > b.page) {
                    return 1;
                }
                return -1;
            }
            EngineBase.SortAlongReadingDirectionCoverPagePrio = SortAlongReadingDirectionCoverPagePrio;
            // MFL20140821_1 - Adding page criteria to sorting logic
            function SortAlongGrossAmountRelevancy(a, b, lineToleranceThreshold) {
                if (a.page == b.page) {
                    var horizLineTolerance = lineToleranceThreshold * (a.width + b.width) / 2;
                    var vertLineTolerance = lineToleranceThreshold * (a.height + b.height) / 2;
                    if (Math.abs(a.y - b.y) < vertLineTolerance && Math.abs(a.x + a.width - (b.x + b.width)) < horizLineTolerance) {
                        return 0;
                    }
                    else if (Math.abs(a.x + a.width - (b.x + b.width)) >= horizLineTolerance) {
                        if (a.x + a.width > b.x + b.width) {
                            return 1;
                        }
                        return -1;
                    }
                    else if (a.y > b.y) {
                        return 1;
                    }
                    return -1;
                    // MFL20140918_2 - No reason to prioritize page 0 here
                }
                else if (a.page > b.page) {
                    return 1;
                }
                return -1;
            }
            EngineBase.SortAlongGrossAmountRelevancy = SortAlongGrossAmountRelevancy;
            EngineBase.referenceAreaForSorting = null;
            function SetReferenceAreaForSorting(area) {
                EngineBase.referenceAreaForSorting = area;
            }
            EngineBase.SetReferenceAreaForSorting = SetReferenceAreaForSorting;
            function SortAlongReferenceAreaProximity(a, b, lineToleranceThreshold) {
                if (Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting == null) {
                    //Lib.FirstTimeRecognition.EngineBase.DebugLog ( "a: " + a.toString() + " (x:" + a.x + "; y:" + a.y + ")" );
                    //Lib.FirstTimeRecognition.EngineBase.DebugLog ( " EQ b: " + b.toString() + " (x:" + b.x + "; y:" + b.y + ")\n" );
                    return 0;
                }
                var a_HorizLineTolerance = lineToleranceThreshold * (a.width + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.width) / 2;
                var a_VertLineTolerance = lineToleranceThreshold * (a.height + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.height) / 2;
                var b_HorizLineTolerance = lineToleranceThreshold * (b.width + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.width) / 2;
                var b_VertLineTolerance = lineToleranceThreshold * (b.height + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.height) / 2;
                var referenceArea_p1_x = Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.x + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.width / 2;
                var referenceArea_p1_y = Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.y;
                var referenceArea_p2_x = Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.x + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.width;
                var referenceArea_p2_y = Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.y + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.height / 2;
                var referenceArea_p3_x = Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.x + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.width / 2;
                var referenceArea_p3_y = Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.y + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.height;
                var referenceArea_p4_x = Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.x;
                var referenceArea_p4_y = Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.y + Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.height / 2;
                var a_p1_x = a.x + a.width / 2;
                var a_p1_y = a.y;
                var a_p2_x = a.x + a.width;
                var a_p2_y = a.y + a.height / 2;
                var a_p3_x = a.x + a.width / 2;
                var a_p3_y = a.y + a.height;
                var a_p4_x = a.x;
                var a_p4_y = a.y + a.height / 2;
                var b_p1_x = b.x + b.width / 2;
                var b_p1_y = b.y;
                var b_p2_x = b.x + b.width;
                var b_p2_y = b.y + b.height / 2;
                var b_p3_x = b.x + b.width / 2;
                var b_p3_y = b.y + b.height;
                var b_p4_x = b.x;
                var b_p4_y = b.y + b.height / 2;
                var b_dist = Math.min(Math.sqrt((referenceArea_p1_x - b_p3_x) * (referenceArea_p1_x - b_p3_x) + (referenceArea_p1_y - b_p3_y) * (referenceArea_p1_y - b_p3_y)), Math.sqrt((referenceArea_p2_x - b_p4_x) * (referenceArea_p2_x - b_p4_x) + (referenceArea_p2_y - b_p4_y) * (referenceArea_p2_y - b_p4_y)), Math.sqrt((referenceArea_p3_x - b_p1_x) * (referenceArea_p3_x - b_p1_x) + (referenceArea_p3_y - b_p1_y) * (referenceArea_p3_y - b_p1_y)), Math.sqrt((referenceArea_p4_x - b_p2_x) * (referenceArea_p4_x - b_p2_x) + (referenceArea_p4_y - b_p2_y) * (referenceArea_p4_y - b_p2_y)));
                var a_dist = Math.min(Math.sqrt((referenceArea_p1_x - a_p3_x) * (referenceArea_p1_x - a_p3_x) + (referenceArea_p1_y - a_p3_y) * (referenceArea_p1_y - a_p3_y)), Math.sqrt((referenceArea_p2_x - a_p4_x) * (referenceArea_p2_x - a_p4_x) + (referenceArea_p2_y - a_p4_y) * (referenceArea_p2_y - a_p4_y)), Math.sqrt((referenceArea_p3_x - a_p1_x) * (referenceArea_p3_x - a_p1_x) + (referenceArea_p3_y - a_p1_y) * (referenceArea_p3_y - a_p1_y)), Math.sqrt((referenceArea_p4_x - a_p2_x) * (referenceArea_p4_x - a_p2_x) + (referenceArea_p4_y - a_p2_y) * (referenceArea_p4_y - a_p2_y)));
                //let aligned_posi = ((Math.abs(b_p4_x  - referenceArea_p4_x) <= b_HorizLineTolerance && Math.abs((referenceArea_p3_y - referenceArea_p1_y) - (b_p3_y - b_p1_y)) <= b_VertLineTolerance) || Math.abs(b_p1_y   - referenceArea_p1_y) <= b_VertLineTolerance) && b_dist < Lib.FirstTimeRecognition.EngineBase.CM2DOTS(Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.page, 10);
                var aligned_posi = (Math.abs(b_p2_x - referenceArea_p2_x) <= b_HorizLineTolerance || Math.abs(b_p4_x - referenceArea_p4_x) <= b_HorizLineTolerance) && b_dist < Lib.FirstTimeRecognition.EngineBase.XCM2DOTS(Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.page, 5) || Math.abs(b_p1_y - referenceArea_p1_y) <= b_VertLineTolerance && b_dist < Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.page, 10);
                var aligned_posimo = (Math.abs(a_p2_x - referenceArea_p2_x) <= a_HorizLineTolerance || Math.abs(a_p4_x - referenceArea_p4_x) <= a_HorizLineTolerance) && a_dist < Lib.FirstTimeRecognition.EngineBase.XCM2DOTS(Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.page, 5) || Math.abs(a_p1_y - referenceArea_p1_y) <= a_VertLineTolerance && a_dist < Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.page, 10);
                var within_block_posi = b_dist < Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.page, 3);
                var within_block_posimo = a_dist < Lib.FirstTimeRecognition.EngineBase.YCM2DOTS(Lib.FirstTimeRecognition.EngineBase.referenceAreaForSorting.page, 3);
                // MFL120140825 - Better handling of vertical alignment over horizontal alignment
                var posi_closer_to_date_than_posimo = b_dist < a_dist && Math.abs(b_dist - a_dist) > Math.min(b_VertLineTolerance, b_HorizLineTolerance);
                var posimo_closer_to_date_than_posi = a_dist < b_dist && Math.abs(b_dist - a_dist) > Math.min(a_VertLineTolerance, a_HorizLineTolerance);
                var posi_before_posimo = a_p1_y > b_p1_y + a_VertLineTolerance || Math.abs(a_p1_y - b_p1_y) <= a_VertLineTolerance && b_p4_x < a_p4_x;
                var posimo_before_posi = b_p1_y > a_p1_y + b_VertLineTolerance || Math.abs(b_p1_y - a_p1_y) <= b_VertLineTolerance && a_p4_x < b_p4_x;
                var posi_taller_than_posimo = b.height / a.height > 1;
                var posimo_taller_than_posi = a.height / b.height > 1;
                //if ( a.x == 1913 && a.y == 854 && b.x == 1913 && b.y == 709 ) {
                //     Lib.FirstTimeRecognition.EngineBase.DebugLog ( "aligned_posi = " + aligned_posi + "\n" );
                //     Lib.FirstTimeRecognition.EngineBase.DebugLog ( "aligned_posimo = " + aligned_posimo + "\n" );
                //     Lib.FirstTimeRecognition.EngineBase.DebugLog ( "posi_closer_to_date_than_posimo = " + posi_closer_to_date_than_posimo + "\n" );
                //     Lib.FirstTimeRecognition.EngineBase.DebugLog ( "posimo_closer_to_date_than_posi = " + posimo_closer_to_date_than_posi + "\n" );
                //     Lib.FirstTimeRecognition.EngineBase.DebugLog ( "within_block_posi = " + within_block_posi + "\n" );
                //     Lib.FirstTimeRecognition.EngineBase.DebugLog ( "within_block_posimo = " + within_block_posimo + "\n" );
                //     Lib.FirstTimeRecognition.EngineBase.DebugLog ( "posi_before_posimo = " + posi_before_posimo + "\n" );
                //     Lib.FirstTimeRecognition.EngineBase.DebugLog ( "posimo_before_posi = " + posimo_before_posi + "\n" );
                //}
                if (aligned_posimo && aligned_posi && posi_closer_to_date_than_posimo || !aligned_posimo && aligned_posi || !aligned_posimo && !aligned_posi && within_block_posimo && within_block_posi && posi_closer_to_date_than_posimo || !aligned_posimo && !aligned_posi && !within_block_posimo && within_block_posi || !aligned_posimo && !aligned_posi && !within_block_posimo && !within_block_posi && posi_taller_than_posimo || !aligned_posimo && !aligned_posi && !within_block_posimo && !within_block_posi && !posi_taller_than_posimo && !posimo_taller_than_posi && posi_before_posimo) {
                    //Lib.FirstTimeRecognition.EngineBase.DebugLog ( "a: " + a.toString() + " (x:" + a.x + "; y:" + a.y + ")" );
                    //Lib.FirstTimeRecognition.EngineBase.DebugLog ( " GT b: " + b.toString() + " (x:" + b.x + "; y:" + b.y + ")\n" );
                    return 1;
                }
                if (aligned_posimo && aligned_posi && posimo_closer_to_date_than_posi || aligned_posimo && !aligned_posi || !aligned_posimo && !aligned_posi && within_block_posimo && within_block_posi && posimo_closer_to_date_than_posi || !aligned_posimo && !aligned_posi && within_block_posimo && !within_block_posi || !aligned_posimo && !aligned_posi && !within_block_posimo && !within_block_posi && posimo_taller_than_posi || !aligned_posimo && !aligned_posi && !within_block_posimo && !within_block_posi && !posi_taller_than_posimo && !posimo_taller_than_posi && posimo_before_posi) {
                    //Lib.FirstTimeRecognition.EngineBase.DebugLog ( "a: " + a.toString() + " (x:" + a.x + "; y:" + a.y + ")" );
                    //Lib.FirstTimeRecognition.EngineBase.DebugLog ( " LT b: " + b.toString() + " (x:" + b.x + "; y:" + b.y + ")\n" );
                    return -1;
                }
                //Lib.FirstTimeRecognition.EngineBase.DebugLog ( "a: " + a.toString() + " (x:" + a.x + "; y:" + a.y + ")" );
                //Lib.FirstTimeRecognition.EngineBase.DebugLog ( " EQ b: " + b.toString() + " (x:" + b.x + "; y:" + b.y + ")\n" );
                return 0;
            }
            EngineBase.SortAlongReferenceAreaProximity = SortAlongReferenceAreaProximity;
            function SortAreas(areas, sortFunction, lineToleranceThreshold, embeddedArea, reverse) {
                var sortResult;
                if (areas !== null && areas.length > 1) {
                    var swapped = true;
                    //let breaker = 500;
                    while (swapped) {
                        swapped = false;
                        for (var i = 1; i < areas.length; ++i) {
                            var posimo = areas[i - 1];
                            var posi = areas[i];
                            if (!embeddedArea) {
                                sortResult = sortFunction(posimo, posi, lineToleranceThreshold);
                                if (!reverse && sortResult == 1 || reverse && sortResult == -1) {
                                    areas[i] = posimo;
                                    areas[i - 1] = posi;
                                    //Log.Info( "swapping posimo(" + posimo.page + "," + posimo.x + "," + posimo.y + "," + posimo.width + "," + posimo.height + ") and posi(" + posi.page + "," + posi.x + "," + posi.y + "," + posi.width + "," + posi.height + ")");
                                    swapped = true;
                                }
                            }
                            else {
                                sortResult = sortFunction(posimo.area, posi.area, lineToleranceThreshold);
                                if (!reverse && sortResult == 1 || reverse && sortResult == -1) {
                                    areas[i] = posimo;
                                    areas[i - 1] = posi;
                                    swapped = true;
                                }
                            }
                        }
                        /*if(--breaker == 0) {
                            Log.Info("Have to break!");
                            break;
                            }*/
                    }
                }
                return areas;
            }
            EngineBase.SortAreas = SortAreas;
            function ExcludeCandidatesAreasBased(candidates, areas, embedded) {
                // MFL20140819_1 checking against "undefined" value as well
                if (candidates === null || candidates === undefined || candidates.length === 0 || areas === null || areas === undefined || areas.length === 0) {
                    return candidates;
                }
                var sortedCandidates = [];
                for (var i = 0; i < candidates.length; ++i) {
                    var overlap = false;
                    for (var j = 0; !overlap && j < areas.length; ++j) {
                        var area = embedded ? candidates[i].area : candidates[i];
                        overlap = Lib.FirstTimeRecognition.EngineBase.AreAreasOverlapping(area, areas[j]);
                    }
                    if (!overlap) {
                        sortedCandidates.push(candidates[i]);
                    }
                }
                return sortedCandidates;
            }
            EngineBase.ExcludeCandidatesAreasBased = ExcludeCandidatesAreasBased;
            function ExcludeCandidatesContentBased(candidates, content, embedded) {
                // MFL20140819_1 checking against "undefined" value as well
                if (candidates === null || candidates === undefined || candidates.length === 0 || content === null || content === undefined || content.length === 0) {
                    return candidates;
                }
                var sortedCandidates = [];
                for (var i = 0; i < candidates.length; ++i) {
                    var overlap = false;
                    for (var j = 0; !overlap && j < content.length; ++j) {
                        var area = embedded ? candidates[i].area : candidates[i];
                        overlap = content[j] == area.toString();
                    }
                    if (!overlap) {
                        sortedCandidates.push(candidates[i]);
                    }
                }
                return sortedCandidates;
            }
            EngineBase.ExcludeCandidatesContentBased = ExcludeCandidatesContentBased;
            function ExcludeCandidatesPatternBased(candidates, exclusionPatterns, embedded) {
                if (!candidates || candidates.length === 0 || !exclusionPatterns || exclusionPatterns.length === 0) {
                    return candidates;
                }
                var sortedCandidates = [];
                for (var k = 0; k < candidates.length; ++k) {
                    var areaString = embedded ? candidates[k].standardStringValue : candidates[k].toString();
                    var keepIt = true;
                    for (var l = 0; l < exclusionPatterns.length; ++l) {
                        var currRegExp = new RegExp(exclusionPatterns[l], "mi");
                        if (currRegExp.test(areaString)) {
                            keepIt = false;
                            break;
                        }
                    }
                    if (keepIt) {
                        sortedCandidates.push(candidates[k]);
                    }
                }
                return sortedCandidates;
            }
            EngineBase.ExcludeCandidatesPatternBased = ExcludeCandidatesPatternBased;
            function ExcludeCandidates(candidates, exclusionKeywords, spaceTolerance, alignmentTolerance, embedded) {
                // MFL20140819_1 checking against "undefined" value as well
                if (!exclusionKeywords || exclusionKeywords.length === 0 || !candidates || candidates.length === 0) {
                    return candidates;
                }
                var sortedCandidates = [];
                // MF20140623_1 - Refactored the calculation of exclusionKeywordRegexpString: use of "join" method instead of custom for loop
                var exclusionKeywordRegexpString = "(" + exclusionKeywords.join(")|(") + ")";
                var exclusionKeywordRegexp;
                for (var i = 0; i < candidates.length; ++i) {
                    // MF20140623_1 - Tracking if the current candidate has already been inserted, so that it is not inserted twice
                    var candidateAlreadySaved = false;
                    var area = embedded ? candidates[i].area : candidates[i];
                    //let surroundingContent = Lib.FirstTimeRecognition.EngineBase.GetSurroundingTextBeforeAndAboveArea(area, spaceTolerance, alignmentTolerance);
                    var surroundingContent = Lib.FirstTimeRecognition.EngineBase.GetKeyword(area, spaceTolerance, alignmentTolerance);
                    if (surroundingContent.length !== 0) {
                        //Lib.FirstTimeRecognition.EngineBase.DebugLogln(surroundingContent + " surrounds " + area.toString());
                        exclusionKeywordRegexp = new RegExp(exclusionKeywordRegexpString, "mi");
                        if (!exclusionKeywordRegexp.test(surroundingContent)) {
                            sortedCandidates.push(candidates[i]);
                            candidateAlreadySaved = true;
                        }
                    }
                    else {
                        sortedCandidates.push(candidates[i]);
                        candidateAlreadySaved = true;
                    }
                    //MFL20140910_1 - Bugfix when keyword contains within area (: separated)
                    if (candidateAlreadySaved && area.toString().indexOf(":") !== -1) {
                        exclusionKeywordRegexp = new RegExp(exclusionKeywordRegexpString, "mi");
                        if (exclusionKeywordRegexp.test(area.toString())) {
                            sortedCandidates.splice(sortedCandidates.length - 1, 1);
                        }
                    }
                }
                return sortedCandidates;
            }
            EngineBase.ExcludeCandidates = ExcludeCandidates;
            function PreferCandidates(candidates, preferredKeywords, spaceTolerance, alignmentTolerance, embedded) {
                // MFL20140819_1 checking against "undefined" value as well
                if (!preferredKeywords || preferredKeywords.length === 0 || !candidates || candidates.length === 0) {
                    return candidates;
                }
                var sortedCandidates = [];
                // MF20140623_1 - Refactored the calculation of preferredKeywordRegexpString: use of "join" method instead of custom for loop
                var preferredKeywordRegexpString = "(" + preferredKeywords.join(")|(") + ")";
                var preferredKeywordRegexp;
                for (var i = 0; i < candidates.length; ++i) {
                    var alreadyPushed = false;
                    var area = embedded ? candidates[i].area : candidates[i];
                    //let surroundingContent = Lib.FirstTimeRecognition.EngineBase.GetSurroundingTextBeforeAndAboveArea(area, spaceTolerance, alignmentTolerance);
                    var surroundingContent = Lib.FirstTimeRecognition.EngineBase.GetKeyword(area, spaceTolerance, alignmentTolerance);
                    if (surroundingContent.length !== 0) {
                        //Lib.FirstTimeRecognition.EngineBase.DebugLogln(surroundingContent + " surrounds " + area.toString());
                        preferredKeywordRegexp = new RegExp(preferredKeywordRegexpString, "mi");
                        if (preferredKeywordRegexp.test(surroundingContent)) {
                            sortedCandidates.push(candidates[i]);
                            alreadyPushed = true;
                        }
                    }
                    if (!alreadyPushed && area.toString().indexOf(":") != -1) {
                        preferredKeywordRegexp = new RegExp(preferredKeywordRegexpString, "mi");
                        if (preferredKeywordRegexp.test(area.toString())) {
                            sortedCandidates.push(candidates[i]);
                        }
                    }
                }
                return sortedCandidates.length > 0 ? sortedCandidates : candidates;
            }
            EngineBase.PreferCandidates = PreferCandidates;
            function KeepCandidates(candidates, mandatoryKeywords, spaceTolerance, alignmentTolerance, embedded) {
                if (!mandatoryKeywords || mandatoryKeywords.length === 0 || !candidates || candidates.length === 0) {
                    return candidates;
                }
                var sortedCandidates = [];
                var mandatoryKeywordRegexpString = "(" + mandatoryKeywords.join(")|(") + ")";
                var mandatoryKeywordRegexp;
                for (var i = 0; i < candidates.length; ++i) {
                    var alreadyPushed = false;
                    var area = embedded ? candidates[i].area : candidates[i];
                    //let surroundingContent = Lib.FirstTimeRecognition.EngineBase.GetSurroundingTextBeforeAndAboveArea(area, spaceTolerance, alignmentTolerance);
                    var surroundingContent = Lib.FirstTimeRecognition.EngineBase.GetKeyword(area, spaceTolerance, alignmentTolerance);
                    if (surroundingContent.length !== 0) {
                        //Lib.FirstTimeRecognition.EngineBase.DebugLogln(surroundingContent + " surrounds " + area.toString());
                        mandatoryKeywordRegexp = new RegExp(mandatoryKeywordRegexpString, "mi");
                        if (mandatoryKeywordRegexp.test(surroundingContent)) {
                            sortedCandidates.push(candidates[i]);
                            alreadyPushed = true;
                        }
                    }
                    if (!alreadyPushed && area.toString().indexOf(":") != -1) {
                        mandatoryKeywordRegexp = new RegExp(mandatoryKeywordRegexpString, "mi");
                        if (mandatoryKeywordRegexp.test(area.toString())) {
                            sortedCandidates.push(candidates[i]);
                        }
                    }
                }
                return sortedCandidates;
            }
            EngineBase.KeepCandidates = KeepCandidates;
            function CollectDatesInArea(area, expectedCultures, expectMonthBeforeDate, lowerBound, upperBound, fuzzy) {
                var candidates = [], candidatesKey = [];
                var i, j, areas, actualDateValue, areaKey, da;
                if (expectedCultures === null || expectedCultures.length === 0) {
                    var day = "[0-9]{1,2}(st|nd|rd|th)?";
                    var dayJapan = "(([0-9]{1,2})|( ?引 ?))";
                    var month = "(([0-9]{1,2})|([0A-ZÉÛéû]+))";
                    var year = "[0-9]{2,4}";
                    var middleSeparator = "(([-/\\.,1( ]{1,2})|( de ))";
                    var middleSeparatorJapan = "( ?(年|月|⽉) ?)";
                    var leftSideSeparator = "(?![^0-9A-Z/\\.-])";
                    var leftSideSeparatorJapan = "( ?((平 ?成)|(令 ?和)) ?)";
                    var rightSideSeparator = "(?=[^0-9A-Z/\\.-])";
                    var rightSideSeparatorJapan = "( ?日 ?)";
                    var pattern1 = day + middleSeparator + month + middleSeparator + year;
                    var pattern2 = year + middleSeparator + month + middleSeparator + day;
                    var pattern3 = month + middleSeparator + day + middleSeparator + year;
                    var pattern4 = day + "[A-Z]+" + year;
                    var patternImperialJapan = leftSideSeparatorJapan + month + middleSeparatorJapan + month + middleSeparatorJapan + dayJapan + rightSideSeparatorJapan;
                    var patternClassicalJapan = year + middleSeparatorJapan + month + middleSeparatorJapan + dayJapan + rightSideSeparatorJapan;
                    var invoiceDateRegexps = [
                        "^" + pattern1 + rightSideSeparator,
                        "^" + pattern2 + rightSideSeparator,
                        "^" + pattern3 + rightSideSeparator,
                        "^" + pattern4 + rightSideSeparator,
                        leftSideSeparator + pattern1 + rightSideSeparator,
                        leftSideSeparator + pattern2 + rightSideSeparator,
                        leftSideSeparator + pattern3 + rightSideSeparator,
                        leftSideSeparator + pattern4 + rightSideSeparator,
                        leftSideSeparator + pattern1 + "$",
                        leftSideSeparator + pattern2 + "$",
                        leftSideSeparator + pattern3 + "$",
                        leftSideSeparator + pattern4 + "$",
                        patternImperialJapan,
                        patternClassicalJapan
                    ];
                    for (var k = 0; k < invoiceDateRegexps.length; ++k) {
                        var currRegExp = new RegExp(invoiceDateRegexps[k], "mgi");
                        var res = area.toString().match(currRegExp);
                        if (res !== null) {
                            for (i = 0; i < res.length; ++i) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("res[" + i + "]: " + res[i]);
                                areas = Document.SearchString(res[i], area, true, false);
                                for (j = 0; j < areas.length; ++j) {
                                    Lib.FirstTimeRecognition.EngineBase.DebugLogln("areas[" + j + "]: " + areas[j].toString());
                                    var standardStringValues = Lib.FirstTimeRecognition.EngineBase.DateUnknownCultureToDateStandardStringFormat(areas[j].toString(), expectMonthBeforeDate, fuzzy);
                                    for (var l = 0; l < standardStringValues.length; ++l) {
                                        Lib.FirstTimeRecognition.EngineBase.DebugLogln("ssv[" + l + "]: " + standardStringValues[l]);
                                        actualDateValue = Lib.FirstTimeRecognition.EngineBase.DateStandardStringFormatToDate(standardStringValues[l]);
                                        if (actualDateValue === null || lowerBound !== null && lowerBound > actualDateValue || upperBound !== null && upperBound < actualDateValue) {
                                            continue;
                                        }
                                        areaKey = areas[j].page + "." + areas[j].x + "." + areas[j].y + "." + areas[j].width + "." + areas[j].height + "." + l;
                                        if (-1 == candidatesKey.indexOf(areaKey)) {
                                            da = new DateCandidate();
                                            da.area = areas[j];
                                            da.standardStringValue = standardStringValues[l];
                                            da.dateValue = actualDateValue;
                                            candidates.push(da);
                                            candidatesKey.push(areaKey);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    for (i = 0; i < expectedCultures.length; ++i) {
                        areas = Document.ExtractDate(expectedCultures[i], area.page, area.x, area.y, area.width, area.height);
                        for (j = 0; j < areas.length; ++j) {
                            var standardStringValue = Lib.FirstTimeRecognition.EngineBase.DateKnownCultureToDateStandardStringFormat(areas[j].toString(), expectedCultures[i]);
                            actualDateValue = Lib.FirstTimeRecognition.EngineBase.DateStandardStringFormatToDate(standardStringValue);
                            if (actualDateValue === null || lowerBound !== null && lowerBound > actualDateValue || upperBound !== null && upperBound < actualDateValue) {
                                continue;
                            }
                            areaKey = areas[j].page + "." + areas[j].x + "." + areas[j].y + "." + areas[j].width + "." + areas[j].height;
                            if (-1 == candidatesKey.indexOf(areaKey)) {
                                da = new Lib.FirstTimeRecognition.EngineBase.DateCandidate();
                                da.area = areas[j];
                                da.standardStringValue = standardStringValue;
                                da.dateValue = actualDateValue;
                                candidates.push(da);
                                candidatesKey.push(areaKey);
                            }
                        }
                    }
                }
                return candidates;
            }
            EngineBase.CollectDatesInArea = CollectDatesInArea;
            function CollectAmountsInArea(area, expectedCultures, allowInteger, maxValue, maxNumberOfDecimalPlaces, spaceTolerance, alignmentTolerance, fuzzy) {
                var candidates = [], candidatesKey = [];
                var areas, j, k, areaKey, actualAmountValue, am;
                if (!expectedCultures || expectedCultures.length === 0) {
                    // MFL20140901_3 Dots escaping
                    var amountRegexps = ["[^A-Z0-9;\\.,'][0-9\\.,']*[0-9][0-9;\\.,']*(?=[^0-9;\\.,'])", "[A-Z][:\\.][0-9;\\.,']*[0-9][0-9;\\.,']*(?=[^0-9;\\.,'])", " [A-Z][0-9;\\.,']*[0-9][0-9;\\.,']*(?=[^0-9;\\.,'])", "^[0-9;\\.,']*[0-9][0-9;\\.,']*(?=[^0-9;\\.,'])", "[^A-Z0-9;\\.,'][0-9;\\.,']*[0-9][0-9;\\.,']*$", "[A-Z][:\\.][0-9;\\.,']*[0-9][0-9;\\.,']*$", " [A-Z][0-9;\\.,']*[0-9][0-9;\\.,']*$", "^[0-9;\\.,']*[0-9][0-9;\\.,']*$"];
                    for (j = 0; j < amountRegexps.length; ++j) {
                        var currRegExp = new RegExp(amountRegexps[j], "mgi");
                        var res = area.toString().match(currRegExp);
                        if (res !== null) {
                            for (k = 0; k < res.length; ++k) {
                                // In case we allowed to detect Ust.19%; then we need to delete the 2 first chars
                                if (j == 1 || j == 2 || j == 5 || j == 6) {
                                    res[k] = res[k].substring(2, res[k].length);
                                }
                                if (Lib.FirstTimeRecognition.EngineBase.AmountUnknownCultureToAmountStandardStringFormat(res[k], allowInteger, maxNumberOfDecimalPlaces, fuzzy).length > 0) {
                                    areas = Document.SearchString(res[k], area, true, false);
                                    for (var l = 0; l < areas.length; ++l) {
                                        areas[l] = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(areas[l], Lib.FirstTimeRecognition.EngineBase.SEEK_BEFORE, /^[0-9]+$/, spaceTolerance, alignmentTolerance, null);
                                        // Recalculate in case the value has been modified while seeking space chars in amount
                                        var standardStringValues = Lib.FirstTimeRecognition.EngineBase.AmountUnknownCultureToAmountStandardStringFormat(areas[l].toString(), allowInteger, maxNumberOfDecimalPlaces, fuzzy);
                                        for (var m = 0; m < standardStringValues.length; ++m) {
                                            actualAmountValue = Lib.FirstTimeRecognition.EngineBase.AmountStandardStringFormatToDecimal(standardStringValues[m]);
                                            if (actualAmountValue === null || Math.abs(actualAmountValue) > maxValue) {
                                                continue;
                                            }
                                            areaKey = areas[l].page + "." + areas[l].x + "." + areas[l].y + "." + areas[l].width + "." + areas[l].height + "." + m;
                                            if (-1 == candidatesKey.indexOf(areaKey)) {
                                                am = new Lib.FirstTimeRecognition.EngineBase.AmountCandidate();
                                                am.area = areas[l];
                                                am.standardStringValue = standardStringValues[m];
                                                am.decimalValue = actualAmountValue;
                                                am.decimal = -1 != am.standardStringValue.indexOf(".");
                                                candidates.push(am);
                                                candidatesKey.push(areaKey);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    for (j = 0; j < expectedCultures.length; ++j) {
                        areas = Document.ExtractSignedNumber(expectedCultures[j], area.page, area.x, area.y, area.width, area.height);
                        for (k = 0; k < areas.length; ++k) {
                            var standardStringValue = Lib.FirstTimeRecognition.EngineBase.AmountKnownCultureToAmountStandardStringFormat(areas[k].toString(), expectedCultures[j]);
                            actualAmountValue = Lib.FirstTimeRecognition.EngineBase.AmountStandardStringFormatToDecimal(standardStringValue);
                            if (actualAmountValue === null) {
                                continue;
                            }
                            areaKey = areas[k].page + "." + areas[k].x + "." + areas[k].y + "." + areas[k].width + "." + areas[k].height;
                            if (-1 == candidatesKey.indexOf(areaKey)) {
                                am = new Lib.FirstTimeRecognition.EngineBase.AmountCandidate();
                                am.area = areas[k];
                                am.standardStringValue = standardStringValue;
                                am.decimalValue = actualAmountValue;
                                am.decimal = -1 != am.standardStringValue.indexOf(".");
                                candidates.push(am);
                                candidatesKey.push(areaKey);
                            }
                        }
                    }
                }
                return candidates;
            }
            EngineBase.CollectAmountsInArea = CollectAmountsInArea;
            function CollectDocumentReferenceNumbersInArea(area, preventSpaceExtraction, documentReferenceDateArea, spaceTolerance, alignmentTolerance) {
                var candidates = [], candidatesKey = [];
                var leftSideSeparator = "[ :/\\(]?";
                var rightSideSeparator = "[ /\\)]";
                var invnRegexp = "[A-Z0-9][0-9A-Z/\\.-]*[0-9][0-9A-Z/\\.-]*[0-9A-Z]\\*?";
                var invoiceNumberRegexps = ["^" + invnRegexp + rightSideSeparator, leftSideSeparator + invnRegexp + rightSideSeparator, leftSideSeparator + invnRegexp + "$", "^" + invnRegexp + "$"];
                for (var k = 0; k < invoiceNumberRegexps.length; ++k) {
                    var currRegExp = new RegExp(invoiceNumberRegexps[k], "mg");
                    var res = area.toString().match(currRegExp);
                    if (res !== null) {
                        for (var i = 0; i < res.length; ++i) {
                            if (res[i].search(/[0-9]+[\.,](0|[0-9]{2})/) >= 0) {
                                continue;
                            }
                            var leftBracketPos = res[i].indexOf("("), rightBracketPos = res[i].lastIndexOf(")");
                            if (leftBracketPos > -1 && rightBracketPos > leftBracketPos) {
                                res[i] = res[i].substring(leftBracketPos + 1, rightBracketPos);
                            }
                            var areas = Document.SearchString(res[i], area, true, false);
                            for (var j = 0; j < areas.length; ++j) {
                                if (!preventSpaceExtraction && (leftBracketPos === -1 || rightBracketPos === -1)) {
                                    areas[j] = Lib.FirstTimeRecognition.EngineBase.GetLineAroundArea(areas[j], Lib.FirstTimeRecognition.EngineBase.SEEK_BOTH, /^[A-Z0-9][0-9A-Z/\.-]*[0-9A-Z]$/i, spaceTolerance, alignmentTolerance, function (s) {
                                        return s.search(/[^A-Z\.]/i) !== -1 || s.length === 1;
                                    });
                                }
                                var dateInterpretations = Lib.FirstTimeRecognition.EngineBase.DateUnknownCultureToDateStandardStringFormat(areas[j].toString(), false, false);
                                if (dateInterpretations.length > 0 && dateInterpretations[0].substring(0, 4) === new Date().getFullYear().toString()) {
                                    continue;
                                }
                                var areaKey = areas[j].page + "." + areas[j].x + "." + areas[j].y + "." + areas[j].width + "." + areas[j].height;
                                if (-1 == candidatesKey.indexOf(areaKey)) {
                                    var cleanedUpData = new Lib.FirstTimeRecognition.EngineBase.TextCandidate();
                                    cleanedUpData.area = areas[j];
                                    if (leftBracketPos > -1 && rightBracketPos > leftBracketPos) {
                                        cleanedUpData.standardStringValue = res[i];
                                    }
                                    else {
                                        cleanedUpData.standardStringValue = areas[j].toString();
                                    }
                                    candidates.push(cleanedUpData);
                                    candidatesKey.push(areaKey);
                                }
                            }
                        }
                    }
                }
                return candidates;
            }
            EngineBase.CollectDocumentReferenceNumbersInArea = CollectDocumentReferenceNumbersInArea;
            function CollectNonDocumentReferenceNumbersInArea(area, validityRanges) {
                var candidates = [];
                if (validityRanges !== null && validityRanges.length > 0) {
                    for (var k = 0; k < validityRanges.length; ++k) {
                        var currRegExp = new RegExp(validityRanges[k], "mgi");
                        var res = area.toString().match(currRegExp);
                        if (res !== null) {
                            var distinctRes = Sys.Helpers.Array.GetDistinctArray(res);
                            for (var i = 0; i < distinctRes.length; ++i) {
                                var areas = Document.SearchString(distinctRes[i], area, true, false);
                                for (var j = 0; j < areas.length; ++j) {
                                    var areaString = areas[j].toString();
                                    if (areaString.length > distinctRes[i].length) {
                                        var wrongPattern_global = new RegExp("[A-Z0-9]+[-/\\.]" + validityRanges[k] + "[-/\\.][A-Z0-9]+");
                                        var wrongPattern_before = new RegExp("[A-Z0-9]+" + validityRanges[k]);
                                        var wrongPattern_after = new RegExp(validityRanges[k] + "[A-Z0-9]+");
                                        if (wrongPattern_global.test(areaString) || wrongPattern_before.test(areaString) || wrongPattern_after.test(areaString)) {
                                            continue;
                                        }
                                    }
                                    var cleanedUpData = new Lib.FirstTimeRecognition.EngineBase.TextCandidate();
                                    cleanedUpData.area = areas[j];
                                    cleanedUpData.standardStringValue = distinctRes[i];
                                    candidates.push(cleanedUpData);
                                }
                            }
                        }
                    }
                }
                return candidates;
            }
            EngineBase.CollectNonDocumentReferenceNumbersInArea = CollectNonDocumentReferenceNumbersInArea;
            function RegExpEscape(a) {
                return a.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
            }
            EngineBase.RegExpEscape = RegExpEscape;
            /**
            * 20140618-1 (CH)
            * CollectCurrenciesInArea: retrieve all the candidates (area + value) for currencies
            * @param area: the area for searching the currency in
            * @param validityRanges: the table/matrix with the allowed currency values
            * @return the successful candidates for currency
            **/
            function CollectCurrenciesInArea(area, currencyDefinitions) {
                var candidates = [];
                for (var i = 0; i < currencyDefinitions.length; ++i) {
                    for (var currencyName in currencyDefinitions[i]) {
                        if (Object.prototype.hasOwnProperty.call(currencyDefinitions[i], currencyName)) {
                            var isISOCode = currencyName.length == 3;
                            var areas = void 0;
                            if (area !== null) {
                                areas = Document.SearchString(currencyName, area, isISOCode, false);
                                if (areas !== null && areas.length > 0) {
                                    for (var j = 0; j < areas.length; j++) {
                                        var currencyExtracted = areas[j].toString();
                                        // MFL20140819_5 Fixed case-insensitive currency lookup
                                        var patternToCheckCurrency = new RegExp("([^A-Za-z]+|^)" + Lib.FirstTimeRecognition.EngineBase.RegExpEscape(currencyName) + "([^A-Za-z]+|$)", "i");
                                        //20140618-1 Check that the found area contains the exact currency name but not another word (e.g.: EUROPE for EURO)
                                        if (patternToCheckCurrency.test(currencyExtracted)) {
                                            var cleanedUpData = new Lib.FirstTimeRecognition.EngineBase.TextCandidate();
                                            cleanedUpData.area = areas[j];
                                            // MFL20140902_3 - ISO Code is now the value and not the key
                                            cleanedUpData.standardStringValue = currencyDefinitions[i][currencyName];
                                            candidates.push(cleanedUpData);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return candidates;
            }
            EngineBase.CollectCurrenciesInArea = CollectCurrenciesInArea;
            /**
            * 20140618-2 (CH)
            * CollectOtherDocumentTypesInArea: retrieve all the candidates (area + value) for document types
            * @param area: the area for searching the document type in
            * @param validityRanges: the table/matrix with the allowed document type values
            * @return the successful candidates for type
            **/
            function CollectOtherDocumentTypesInArea(area, validityRanges) {
                var candidates = [];
                for (var type in validityRanges) {
                    if (Object.prototype.hasOwnProperty.call(validityRanges, type)) {
                        for (var i = 0; i < validityRanges[type].length; ++i) {
                            var areas = void 0;
                            if (area !== null) {
                                areas = Document.SearchString(validityRanges[type][i], area, false, false);
                                if (areas !== null && areas.length > 0) {
                                    var cleanedUpData = new Lib.FirstTimeRecognition.EngineBase.TextCandidate();
                                    cleanedUpData.area = areas[0];
                                    cleanedUpData.standardStringValue = type;
                                    candidates.push(cleanedUpData);
                                }
                            }
                        }
                    }
                }
                return candidates;
            }
            EngineBase.CollectOtherDocumentTypesInArea = CollectOtherDocumentTypesInArea;
            /**
            * 20140619 (CH)
            * CollectVATNumberInArea: retrieve all the candidates (area + value) for VAT number
            * @param area: the area for searching the VAT number in
            * @return the successful candidates
            **/
            function CollectVATNumberInArea(area) {
                var candidates = [];
                var vatNumberRegExp = [/(AT ?U ?[0-9BSOlI]{3} ?[0-9BSOlI]{3} ?[0-9BSOlI]{2})/g, /(DE ?(([0-9BSOlI]{3} ?[0-9BSOlI]{3} ?[0-9BSOlI]{3})|([0-9BSOlI]{4} [0-9BSOlI]{5})))/g, /(CHE[ -]?[0-9BSOlI]{3}[\. ]?[0-9BSOlI]{3}[\. ]?[0-9BSOlI]{3})/g, /[B8]E[\. -]?[0-9BSOlI]{4}[\. ]?[0-9BSOlI]{3}[\. ]?[0-9BSOlI]{3}/g, /(ES[AB8][ -]?[0-9BSOlI]{8})/g, /(FR ?[0-9BSOlI]{2}[\. ]?[0-9BSOlI]{3}[\. ]?[0-9BSOlI]{3}[\. ]?[0-9BSOlI]{3})/g, /(NL ?(([0-9BSOlI]{4}[\. ]?[0-9BSOlI]{2})|([0-9BSOlI]{3}[\. ]?[0-9BSOlI]{3}))[\. ]?[0-9BSOlI]{3}\.?[B8] ?[0-9BSOlI]{2})/g, /(PT ?[0-9BSOlI]{9})/g, /(DK ?[0-9BSOlI]{2} ?[0-9BSOlI]{2} ?[0-9BSOlI]{2} ?[0-9BSOlI]{2})/g, /(F[I1l] ?[0-9BSOlI]{8})/g, /(G[B8][\. ]?[0-9BSOlI]{3}[\. ]?[0-9BSOlI]{4}[\. ]?[0-9BSOlI]{2})/g, /([I1l]E[\. ]?-?(([0-9BSOlI]{4}[\. ]?[0-9BSOlI]{3}[\. ]?[A-Z]{1,2})|([0-9BSOlI][A-Z\+\*][0-9BSOlI]{5}[A-W])))/g, /([S5]E[0-9BSOlI]{12})/g, /(CZ ?[0-9BSOlI]{8})/g, /(HU ?[0-9BSOlI]{8})/g, /(LT ?[0-9BSOlI]{9}([0-9BSOlI]{3})?)/g, /(PL ?[0-9BSOlI]{10})/g, /([S5]K ?[0-9BSOlI]{10})/g, /([I1l]T ?[0-9BSOlI]{8})/g];
                for (var k = 0; k < vatNumberRegExp.length; k++) {
                    var regExp = vatNumberRegExp[k];
                    var res = area.toString().match(regExp);
                    if (res !== null) {
                        Lib.FirstTimeRecognition.EngineBase.DebugLog("We found one! k = " + k + "\n");
                        for (var i = 0; i < res.length; ++i) {
                            Lib.FirstTimeRecognition.EngineBase.DebugLog("value extracted = " + res[i] + "\n");
                            var areas = Document.SearchString(res[i], area, true, false);
                            for (var j = 0; j < areas.length; ++j) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLog("Area extracted = " + areas[j].toString() + "\n");
                                // MF20140701_1 Cleaning up the OCR-tolerant-extracted string:
                                // Non Alnum characters are discarded and digits and chars are restored (8E4S6 -> BE456)
                                var rawVATCode = areas[j].toString(), prefix = void 0, postfix = void 0;
                                rawVATCode = rawVATCode.replace(/[^A-Z0-9]/gi, "");
                                if (0 === rawVATCode.indexOf("8E")) {
                                    prefix = "BE";
                                }
                                else if (0 === rawVATCode.indexOf("ES8")) {
                                    prefix = "ESB";
                                }
                                else if (0 === rawVATCode.indexOf("1T") || 0 === rawVATCode.indexOf("lT")) {
                                    prefix = "IT";
                                }
                                else if (0 === rawVATCode.indexOf("F1") || 0 === rawVATCode.indexOf("Fl")) {
                                    prefix = "FI";
                                }
                                else if (0 === rawVATCode.indexOf("G8")) {
                                    prefix = "GB";
                                }
                                else if (0 === rawVATCode.indexOf("1E") || 0 === rawVATCode.indexOf("lE")) {
                                    prefix = "IE";
                                }
                                else if (0 === rawVATCode.indexOf("5E")) {
                                    prefix = "SE";
                                }
                                else if (0 === rawVATCode.indexOf("5K")) {
                                    prefix = "SK";
                                }
                                else {
                                    prefix = rawVATCode.substr(0, 2);
                                }
                                if (prefix === "CH" || prefix === "ES") {
                                    prefix = rawVATCode.substr(0, 3);
                                }
                                // MFL20140818_1 - Turning .length() (RLG) into .length (JS)
                                postfix = rawVATCode.substring(prefix.length);
                                postfix = postfix.replace(/B/g, "8");
                                postfix = postfix.replace(/S/g, "5");
                                postfix = postfix.replace(/O/g, "0");
                                postfix = postfix.replace(/[lI]/g, "1");
                                if (prefix == "NL") {
                                    // MFL20140818_1 - Turning .length() (RLG) into .length (JS)
                                    postfix = postfix.substr(0, postfix.length - 3) + "B" + postfix.substr(postfix.length - 2);
                                }
                                var vatValue = prefix + postfix;
                                var cleanedValue = vatValue.match(regExp);
                                if (cleanedValue && cleanedValue.length > 0) {
                                    vatValue = cleanedValue[0];
                                }
                                var cleanedUpData = new Lib.FirstTimeRecognition.EngineBase.TextCandidate();
                                cleanedUpData.area = areas[j];
                                cleanedUpData.standardStringValue = vatValue;
                                candidates.push(cleanedUpData);
                            }
                        }
                    }
                }
                return candidates;
            }
            EngineBase.CollectVATNumberInArea = CollectVATNumberInArea;
            /*
                [0-9]       [0-9iIl!\|\/ODCzZ4AsSbGTB]
                [A-Z]       [A-Z01245678l]
                [a-z]       [a-z01256]
                [A-Za-z]    [A-Za-z01245678]
                \.          [\.,:]
                ,           [,\.;]
                ;           [;,:]
                /           [\/1\(Il!\|]
                0           [0ODC]
                1           [1iIl!\|]
                2           [2zZ]
                4           [4A]
                5           [5sS]
                6           [6bG]
                7           [7T]
                8           [8B]
                A           [A4]
                B           [B8]
                C           [C0OD]
                D           [DC0O]
                G           [G6]
                I           [1iIl!\|]
                O           [ODC0]
                S           [Ss5]
                Z           [Zz2]
                b           [b6G]
                l           [lI1]
                s           [sS5]
                z           [zZ2]
                */
            // FMA20140929_1 - Adding code related to partner determination + generic functions
            // HELPERS
            // IsMonoTextBlockArea: return false if text belongs to at least two consecutive text blocks instead of 1
            function IsMonoTextBlockArea(area, hSpaceTolerance, bDebug) {
                if (area !== null) {
                    var areaWords = area.toString().split(" ");
                    if (hSpaceTolerance === null || typeof hSpaceTolerance === "undefined") {
                        // 1 char space tolerance
                        hSpaceTolerance = 1.1;
                    }
                    if (bDebug) {
                        Log.Info("[IsMonoTextBlockArea] " + hSpaceTolerance + " char(s) tolerance to apply on area (" + areaWords.length + " word(s) found)");
                    }
                    if (areaWords.length > 1) {
                        // Each space counts as 1 char
                        var subArea = void 0, totalCharCount = areaWords.length - 1;
                        var subAreaAverageCharWidth = [];
                        for (var i = 0; i < areaWords.length; i++) {
                            totalCharCount += areaWords[i].length;
                            subArea = Document.SearchString(areaWords[i], area, true, false);
                            if (subArea !== null && subArea.length) {
                                subAreaAverageCharWidth.push((subArea[0].width / areaWords[i].length).toFixed(2));
                                if (bDebug) {
                                    Log.Info("[IsMonoTextBlockArea] Word " + (i + 1) + "/" + areaWords.length + " is " + subArea[0].width + " px wide and contains " + areaWords[i].length + " char (" + (subArea[0].width / areaWords[i].length).toFixed(2) + " px/char)");
                                }
                            }
                        }
                        var averageCharWidth = 0;
                        for (var i = 0; i < subAreaAverageCharWidth.length; i++) {
                            averageCharWidth += parseFloat(subAreaAverageCharWidth[i]);
                        }
                        averageCharWidth = parseFloat((averageCharWidth / subAreaAverageCharWidth.length).toFixed(2));
                        if (bDebug) {
                            Log.Info("[IsMonoTextBlockArea] Area contains " + totalCharCount + " char in total (" + averageCharWidth + " px/char in average)");
                        }
                        if (area.width > averageCharWidth * (totalCharCount + hSpaceTolerance)) {
                            Log.Warn("[IsMonoTextBlockArea] Discard area '" + area.toString() + "' because width (" + area.width + " px) is greater than " + averageCharWidth * (totalCharCount + hSpaceTolerance) + " allowed px");
                            return false;
                        }
                        else if (bDebug) {
                            Log.Info("[IsMonoTextBlockArea] Keep area because width (" + area.width + " px) is lower than " + averageCharWidth * (totalCharCount + hSpaceTolerance) + " allowed px");
                        }
                    }
                }
                return true;
            }
            EngineBase.IsMonoTextBlockArea = IsMonoTextBlockArea;
            // SearchRegExp: return an array of unique values found (cleared from duplicates)
            // Return an empty array if no match found
            function SearchRegExp(searchRegEx, replaceRegEx, area, breakWhenFound, discardNonMonoBlockArea, hSpaceTolerance, restrictSearchResult) {
                var bDebug = Lib.FirstTimeRecognition.EngineBase._DEBUG_activated;
                if (bDebug) {
                    Log.Info("[SearchRegExp] Search with RegEx " + searchRegEx + ", replaceRegEx " + replaceRegEx + ", restrict to " + restrictSearchResult);
                }
                var currentArea, resultArray = [];
                if (area === null) {
                    // search the whole document
                    area = Document.GetArea();
                }
                var StopSearch = false, validCandidate = true;
                var tempArray = searchRegEx.exec(area.toString());
                while (tempArray !== null && !StopSearch) {
                    if (!searchRegEx.global) {
                        // To avoid infinite loop
                        StopSearch = true;
                    }
                    if (tempArray[0].length) {
                        if (restrictSearchResult) {
                            if (bDebug) {
                                Log.Info("[SearchRegExp] Value before replace: " + tempArray[0]);
                            }
                            tempArray[0] = tempArray[0].replace(searchRegEx, restrictSearchResult);
                            if (bDebug) {
                                Log.Info("[SearchRegExp] Value after replace: " + tempArray[0]);
                            }
                        }
                        if (area) {
                            currentArea = Document.SearchString(tempArray[0], area, false, false);
                        }
                        else {
                            currentArea = Document.SearchString(tempArray[0], false, false);
                        }
                        if (discardNonMonoBlockArea) {
                            validCandidate = Lib.FirstTimeRecognition.EngineBase.IsMonoTextBlockArea(currentArea[0], hSpaceTolerance, bDebug);
                        }
                        if (validCandidate) {
                            if (replaceRegEx) {
                                if (bDebug) {
                                    Log.Info("[SearchRegExp] Text cleaning: apply regEx " + replaceRegEx + " to value '" + tempArray[0] + "'");
                                }
                                tempArray[0] = tempArray[0].replace(replaceRegEx, "");
                            }
                            resultArray.push({ area: currentArea[0], value: tempArray[0] });
                            if (breakWhenFound) {
                                StopSearch = true;
                            }
                        }
                    }
                    tempArray = searchRegEx.exec(area.toString());
                }
                if (resultArray.length) {
                    if (bDebug) {
                        Log.Info("[SearchRegExp] Initial count: " + resultArray.length + " result(s)");
                    }
                    // Remove duplicate entries
                    var arr = {};
                    for (var i = 0; i < resultArray.length; i++) {
                        arr[resultArray[i].value] = resultArray[i];
                    }
                    resultArray = [];
                    for (var key in arr) {
                        if (Object.prototype.hasOwnProperty.call(arr, key)) {
                            resultArray.push(arr[key]);
                        }
                    }
                    if (bDebug) {
                        Log.Info("[SearchRegExp] After removing duplicates: " + resultArray.length + " result(s)");
                    }
                }
                return resultArray;
            }
            EngineBase.SearchRegExp = SearchRegExp;
            // SearchWord: return an array of unique values found (cleared from duplicates)
            // Return an empty array if no match found
            function SearchWord(wordArray, sensitive, fuzzy, toTrim, trimDirection, area, breakWhenFound, maxVariance, uniqueMatchPerWord) {
                var bDebug = Lib.FirstTimeRecognition.EngineBase._DEBUG_activated;
                if (bDebug) {
                    Log.Info("[SearchWord] Search area with " + wordArray.length + " keywords (sensitive: " + sensitive + ", fuzzy=" + fuzzy + ", breakWhenFound=" + breakWhenFound + ")");
                }
                var tempArray = [];
                var resultArray = [];
                var i = 0, j = 0, wordFound = false, searchValue, distance, variance = 1;
                while (i < wordArray.length && !wordFound) {
                    if (wordArray[i] !== null && wordArray[i].length) {
                        if (area) {
                            tempArray = Document.SearchString(wordArray[i], area, sensitive, fuzzy);
                        }
                        else {
                            tempArray = Document.SearchString(wordArray[i], sensitive, fuzzy);
                        }
                        if (tempArray.length) {
                            if (bDebug) {
                                Log.Info("[SearchWord] Keyword '" + wordArray[i] + "' found " + tempArray.length + " time(s)");
                            }
                            j = 0;
                            while (j < tempArray.length && !wordFound) {
                                searchValue = tempArray[j].toString();
                                if (toTrim && toTrim.length) {
                                    searchValue = Sys.Helpers.String.Trim(tempArray[j].toString(), toTrim, trimDirection);
                                }
                                if (sensitive) {
                                    distance = Sys.Helpers.Distance.Levenshtein(searchValue, wordArray[i], fuzzy);
                                }
                                else {
                                    distance = Sys.Helpers.Distance.Levenshtein(searchValue.toLowerCase(), wordArray[i].toLowerCase(), fuzzy);
                                }
                                if (fuzzy) {
                                    if (distance < searchValue.length) {
                                        // To get a percentage value
                                        variance = parseFloat((distance / searchValue.length).toFixed(2));
                                    }
                                    if (maxVariance === null || maxVariance === undefined) {
                                        maxVariance = 0;
                                    }
                                    if (variance <= maxVariance) {
                                        if (bDebug) {
                                            Log.Info("[SearchWord] searchValue '" + searchValue + "' (length: " + searchValue.length + ") matches the searched keyword '" + wordArray[i] + "' (length: " + wordArray[i].length + ", distance: " + distance + ", variance: " + variance + ">" + maxVariance + " threshold). Ignore value");
                                        }
                                        resultArray.push({ area: tempArray[j], value: searchValue });
                                        if (breakWhenFound) {
                                            wordFound = true;
                                        }
                                    }
                                    else if (bDebug) {
                                        Log.Info("[SearchWord] searchValue '" + searchValue + "' (length: " + searchValue.length + ") does not match the searched keyword '" + wordArray[i] + "' (length: " + wordArray[i].length + ", distance: " + distance + ", variance: " + variance + ">" + maxVariance + " threshold). Ignore value");
                                    }
                                }
                                // Search is not fuzzy
                                else if (distance === 0) {
                                    resultArray.push({ area: tempArray[j], value: searchValue });
                                    if (breakWhenFound) {
                                        wordFound = true;
                                    }
                                }
                                else if (bDebug) {
                                    Log.Info("[SearchWord] searchValue '" + searchValue + "' is not exactly equal to the searched keyword '" + wordArray[i] + "' (distance = " + distance + "). Ignore value");
                                }
                                j++;
                            }
                        }
                        else if (bDebug) {
                            Log.Info("[SearchWord] Keyword '" + wordArray[i] + "' not found");
                        }
                    }
                    else if (bDebug) {
                        Log.Info("[SearchWord] Keyword '" + wordArray[i] + "' empty or null");
                    }
                    i++;
                }
                if (resultArray.length) {
                    if (bDebug) {
                        Log.Info("[SearchWord] Initial count: " + resultArray.length + " result(s)");
                    }
                    // Remove duplicate entries
                    var arr = {};
                    for (var k = 0; k < resultArray.length; k++) {
                        arr[resultArray[k].value] = resultArray[k];
                    }
                    if (uniqueMatchPerWord) {
                        resultArray = [];
                        for (var key in arr) {
                            if (Object.prototype.hasOwnProperty.call(arr, key)) {
                                resultArray.push(arr[key]);
                            }
                        }
                        if (bDebug) {
                            Log.Info("[SearchWord] After removing duplicates: " + resultArray.length + " result(s)");
                        }
                    }
                }
                return resultArray;
            }
            EngineBase.SearchWord = SearchWord;
            // IsWholeAreaInside: return true if area1 is fully contained in area2. Return false otherwise
            function IsWholeAreaInside(area1, area2, pixelTolerance) {
                var result = null;
                if (area1 !== null && area2 !== null) {
                    if (typeof pixelTolerance === "undefined" || pixelTolerance === null) {
                        pixelTolerance = 4;
                    }
                    if (area1.x < area2.x - pixelTolerance || area1.x > area2.x + area2.width + pixelTolerance ||
                        area1.y < area2.y - pixelTolerance || area1.y > area2.y + area2.height + pixelTolerance ||
                        area1.x + area1.width > area2.x + area2.width + pixelTolerance || area1.y + area1.height > area2.y + area2.height + pixelTolerance) {
                        result = false;
                    }
                    else {
                        result = true;
                    }
                }
                return result;
            }
            EngineBase.IsWholeAreaInside = IsWholeAreaInside;
            // RemoveDuplicateAreas: return an array of areas where all duplicate areas have been removed
            function RemoveIrrelevantAreas(areaArray, minNumberOfWords) {
                var resultArray = [];
                var areaText, areaWords;
                if (areaArray !== null && areaArray.length) {
                    Log.Info("[RemoveIrrelevantAreas] Initial array contains " + areaArray.length + " area(s)");
                    for (var i = 0; i < areaArray.length; i++) {
                        areaText = areaArray[i].toString().split("\n").join(" ");
                        areaWords = areaText.split(" ");
                        if (isNaN(minNumberOfWords)) {
                            minNumberOfWords = 8;
                        }
                        if (areaWords.length >= minNumberOfWords) {
                            resultArray.push(areaArray[i]);
                        }
                        else {
                            Log.Warn("[RemoveIrrelevantAreas] Discard area " + (i + 1) + "/" + areaArray.length + " as it contains " + areaWords.length + " words (" + minNumberOfWords + " minimum)");
                        }
                    }
                    Log.Info("[RemoveIrrelevantAreas] Cleaned array contains " + resultArray.length + " area(s)");
                }
                return resultArray;
            }
            EngineBase.RemoveIrrelevantAreas = RemoveIrrelevantAreas;
            function PrioritiseAreasBasedOnKeywords(areaArray, priorityKeyWordsArray, country) {
                var finalAreas = [];
                if (areaArray !== null && priorityKeyWordsArray !== null && areaArray.length && priorityKeyWordsArray.length) {
                    Log.Info("[PrioritiseAreasBasedOnKeywords] Sort " + areaArray.length + " area(s) based on " + priorityKeyWordsArray.length + " keywords");
                    var lowPriorityAreas = [], highPriorityAreas = [];
                    var highPriority = void 0, postCodes = void 0;
                    for (var i = 0; i < areaArray.length; i++) {
                        highPriority = false;
                        // 1- If search keyword found in the area, increase area priority
                        for (var j = 0; j < priorityKeyWordsArray.length; j++) {
                            if (areaArray[i].toString().toUpperCase().indexOf(priorityKeyWordsArray[j].toUpperCase()) > -1) {
                                Log.Info("[PrioritiseAreasBasedOnKeywords] Area " + (i + 1) + "/" + areaArray.length + " contains keyword '" + priorityKeyWordsArray[j] + "': increase priority");
                                highPriority = true;
                                break;
                            }
                        }
                        // 2- If area contains a postcode, increase priority
                        if (highPriority === false) {
                            postCodes = Lib.FirstTimeRecognition.EngineBase.CollectCountryPostcodes(country, [areaArray[i]], true, true);
                            if (postCodes !== null && postCodes.length) {
                                Log.Info("[PrioritiseAreasBasedOnKeywords] Area " + (i + 1) + "/" + areaArray.length + " contains postcode " + postCodes[0].value + ": increase priority");
                                highPriority = true;
                            }
                        }
                        if (highPriority) {
                            highPriorityAreas.push(areaArray[i]);
                        }
                        else {
                            lowPriorityAreas.push(areaArray[i]);
                        }
                    }
                    if (lowPriorityAreas.length && highPriorityAreas.length) {
                        finalAreas = highPriorityAreas.concat(lowPriorityAreas);
                    }
                    else if (lowPriorityAreas.length) {
                        finalAreas = lowPriorityAreas;
                    }
                    else {
                        finalAreas = highPriorityAreas;
                    }
                    Log.Info("[PrioritiseAreasBasedOnKeywords] Final array contains " + finalAreas.length + " area(s)");
                }
                return finalAreas;
            }
            EngineBase.PrioritiseAreasBasedOnKeywords = PrioritiseAreasBasedOnKeywords;
            // CaptureWholeLineItemArea: capture whole area until next line in table or capture heightTolerance if index is last line on page
            function CaptureWholeLineItemArea(table, index, heightTolerance, bDebug) {
                if (bDebug) {
                    Log.Info("[CaptureWholeLineItemArea] table=" + table + ", index=" + index + ", heightTolerance=" + heightTolerance);
                }
                var itemCount = table.GetItemCount();
                var currentLineArea = table.GetItem(index).GetArea();
                var searchAreaP = currentLineArea.page;
                // 5% right of the left border
                var searchAreaX = 5 / 100 * Document.GetPageResolutionX(searchAreaP);
                var searchAreaY = currentLineArea.y;
                // 90% of the page width
                var searchAreaW = 95 / 100 * Document.GetPageWidth(searchAreaP);
                var searchAreaH = heightTolerance * currentLineArea.height;
                if (index < itemCount - 1) {
                    var nextLineArea = table.GetItem(index + 1).GetArea();
                    if (searchAreaP === nextLineArea.page) {
                        if (bDebug) {
                            Log.Info("[CaptureWholeLineItemArea] Next item " + (index + 2) + "/" + itemCount + " is on the same page (" + (searchAreaP + 1) + "): Capture full row height");
                        }
                        searchAreaH = nextLineArea.y - searchAreaY;
                    }
                    else if (bDebug) {
                        Log.Info("[CaptureWholeLineItemArea] Next item " + (index + 2) + "/" + itemCount + " is on the next page (" + (nextLineArea.page + 1) + "): Capture the height of ~" + heightTolerance + " text lines");
                    }
                }
                else if (bDebug) {
                    Log.Info("[CaptureWholeLineItemArea] Last item " + (index + 1) + "/" + itemCount + ": Capture the height of ~" + heightTolerance + " text lines");
                }
                var searchArea = Document.GetArea(searchAreaP, searchAreaX, searchAreaY, searchAreaW, searchAreaH);
                if (bDebug) {
                    Log.Info("[CaptureWholeLineItemArea] Area: p=" + searchAreaP + ",x=" + searchAreaX + ",y=" + searchAreaY + ",w=" + searchAreaW + ",h=" + searchAreaH);
                    Log.Info("[CaptureWholeLineItemArea] Area: '" + searchArea.toString() + "'");
                    // Blue highlighting
                    searchArea.Highlight(true, 0x00ccff, 0xe00000, "");
                }
                return searchArea;
            }
            EngineBase.CaptureWholeLineItemArea = CaptureWholeLineItemArea;
            // CleanAddressText: cleans the text inside an area by removing keywords
            function CleanAddressText(searchAreaText, lineKeywordsArray, keywordsArray) {
                var i;
                var bDebug = Lib.FirstTimeRecognition.EngineBase._DEBUG_activated;
                // 1 - Remove phone and fax numbers
                searchAreaText = searchAreaText.replace(/(^|\b)(TELEPHONE|PHONE|TEL|PH|P|FACSIMILE|FAX|FX|F) ?[:\.]? ?(([(+]|[+(]|[(])? ?([1-9][ \-]?[0-9]?[0-9]?)?\)?|(\(0\))?)[ \-]?\(?([0-9 \)\.\-\/]{4,15})(\b|$)/mgi, "");
                // 2 - Remove all irrelevant lines
                var bIrrelevantLineFound = false, finalText = "";
                var searchAddress = searchAreaText.split("\n");
                if (searchAddress.length > 1) {
                    if (bDebug) {
                        Log.Info("[CleanAddressText] Search area contains " + searchAddress.length + " lines. Refine.");
                    }
                    var builtRegExText = "";
                    for (i = 0; i < lineKeywordsArray.length; i++) {
                        if (builtRegExText.length > 0) {
                            builtRegExText += "|";
                        }
                        builtRegExText += lineKeywordsArray[i];
                    }
                    var regExpLineToIgnore = new RegExp("^(" + builtRegExText + ")", "im");
                    for (i = searchAddress.length - 1; i >= 0 && !bIrrelevantLineFound; i--) {
                        if (regExpLineToIgnore.test(searchAddress[i]) === false) {
                            if (bDebug) {
                                Log.Info("[CleanAddressText] Keep line: '" + searchAddress[i] + "'");
                            }
                            if (finalText.length) {
                                finalText = searchAddress[i] + "\n" + finalText;
                            }
                            else {
                                finalText = searchAddress[i];
                            }
                        }
                        else {
                            Log.Warn("[CleanAddressText] Discard line " + (i + 1) + "/" + searchAddress.length + ": '" + searchAddress[i] + "'");
                            bIrrelevantLineFound = true;
                        }
                    }
                    if (bDebug) {
                        Log.Info("[CleanAddressText] Refined area contains " + finalText.split("\n").length + " line(s)");
                    }
                }
                else if (bDebug) {
                    Log.Info("[CleanAddressText] Area contains 1 single line");
                }
                if (finalText.length === 0) {
                    finalText = searchAreaText;
                }
                // 3 - Remove individual words
                if (bDebug) {
                    Log.Info("[CleanAddressText] Clean '" + finalText + "' from " + keywordsArray.length + " keywords");
                }
                for (i = 0; i < keywordsArray.length; i++) {
                    if (bDebug) {
                        Log.Info("[CleanAddressText] Remove word " + (i + 1) + "/" + keywordsArray.length + ": '" + keywordsArray[i] + "'");
                    }
                    // Do not remove string within words
                    var regEx = new RegExp("\\b" + keywordsArray[i] + "\\b", "mgi");
                    finalText = finalText.replace(regEx, " ");
                    // Remove multiple spaces
                    finalText = finalText.replace(/ {2}/g, " ");
                }
                if (bDebug) {
                    Log.Info("[CleanAddressText] Cleaned area: '" + finalText + "'");
                }
                // 4 - Further cleanup
                // Email addresses
                finalText = finalText.replace(/(^|\b)(Email ?[:]? ?)?[a-z0-9_\.-]+@[\da-z\.-]+\.[a-z\.]{2,6}(\b|$)/gmi, "");
                // Web URL
                finalText = finalText.replace(/(^|\b)(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\b|$)/gmi, "");
                // Remove carriage returns
                finalText = finalText.toUpperCase().split("\n").join(" ");
                // Remove punctuation marks
                finalText = finalText.replace(/ (\"|\(|\[|\{)([A-Z0-9])/g, " $2");
                // Remove punctuation marks
                finalText = finalText.replace(/([A-Z0-9])(\"|,|:|;|\)|\]|\})/g, "$1 ");
                // Remove punctuation marks
                finalText = finalText.replace(/[:!\?_\+\*\|]/g, "");
                //finalText = finalText.replace(/\b[^0123456789 ]\b/g, "" );	// Remove single isolated characters (except for digits, spaces and carriage returns)
                finalText = finalText.replace(/ {2}/g, " ");
                return finalText;
            }
            EngineBase.CleanAddressText = CleanAddressText;
            // COUNTRY SEARCHES
            function PushAlternateCountryNames(inArray, outArray, srcRegExp, repRegExp) {
                if (inArray !== null && inArray.length && outArray !== null && outArray.length && srcRegExp && repRegExp) {
                    for (var i = 0; i < inArray.length; i++) {
                        if (srcRegExp.test(inArray[i])) {
                            outArray.push(inArray[i].replace(srcRegExp, repRegExp));
                        }
                    }
                }
                return outArray;
            }
            EngineBase.PushAlternateCountryNames = PushAlternateCountryNames;
            function CollectCountryNames(country, languages, areaArray, sensitive, fuzzy, trimChar, trimOrientation, breakAtFirst, maxVariance, uniqueMatchPerWord, AreasToIgnoreArray) {
                var searchResults = [], bufferArray = [], i, j;
                if (languages && country) {
                    var language = void 0, allCandidates = void 0, candidatesBuffer = void 0, nameSplit = void 0, bCountryFound = false;
                    for (i = 0; !bCountryFound && i < languages.length; i++) {
                        language = languages[i].toLowerCase();
                        if (/^(en|fr|it|de|es|cn)$/m.test(language)) {
                            var name = country[language];
                            allCandidates = [];
                            candidatesBuffer = [];
                            // 01- Check if there is an alternate name
                            if (name.indexOf(" (") > -1) {
                                // E.g. CORÉE, RÉPUBLIQUE DE (CORÉE DU SUD)  -  KOREA, REPUBLIC OF  (KOREA, SOUTH)
                                // E.g. CORÉE, RÉPUBLIQUE DE
                                candidatesBuffer.push(name.substring(0, name.indexOf(" (")));
                                // E.g. CORÉE DU SUD
                                candidatesBuffer.push(name.substring(name.indexOf(" (") + 2, name.length - 1));
                                // E.g. COREE, REPUBLIQUE DE
                                candidatesBuffer.push(Sys.Helpers.String.RemoveDiacritics(name.substring(0, name.indexOf(" ("))));
                                // E.g. COREE DU SUD
                                candidatesBuffer.push(Sys.Helpers.String.RemoveDiacritics(name.substring(name.indexOf(" (") + 2, name.length - 1)));
                            }
                            else {
                                // E.g. ÉTHIOPIE
                                candidatesBuffer.push(name);
                                // E.g. ETHIOPIE
                                candidatesBuffer.push(Sys.Helpers.String.RemoveDiacritics(name));
                            }
                            // 02- Check if there is a formal name
                            for (j = 0; j < candidatesBuffer.length; j++) {
                                nameSplit = candidatesBuffer[j].split(", ");
                                if (nameSplit.length > 1) {
                                    // ISO-8859-1:	http://en.wikipedia.org/wiki/ISO/IEC_8859-1
                                    // Reference:	http://www.upu.int/uploads/tx_sbdownloader/manualAddressingKnowledgeCentreFaqEn.pdf
                                    // E.g. CORÉE, RÉPUBLIQUE DE
                                    allCandidates.push(Sys.Helpers.String.Trim(candidatesBuffer[j], " ", Sys.Helpers.String.TRIM_BOTH));
                                    // E.g. RÉPUBLIQUE DE CORÉE
                                    allCandidates.push(nameSplit[1] + nameSplit[0]);
                                    // E.g. CORÉE
                                    allCandidates.push(nameSplit[0]);
                                }
                                else {
                                    allCandidates.push(candidatesBuffer[j]);
                                }
                            }
                            candidatesBuffer = allCandidates;
                            // 03- Generate alternate candidates when country name contains AND
                            // E.g. WALLIS & FUTUNA
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /( )(AND|ET|ED|E|Y|UND)( )/i, " & ");
                            // E.g. WALLIS / FUTUNA
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /( )(AND|ET|ED|E|Y|UND)( )/i, " / ");
                            // E.g. WALLIS/FUTUNA
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /( )(AND|ET|ED|E|Y|UND)( )/i, "/");
                            // E.g. WALLIS - FUTUNA
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /( )(AND|ET|ED|E|Y|UND)( )/i, " - ");
                            // E.g. WALLIS-FUTUNA
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /( )(AND|ET|ED|E|Y|UND)( )/i, "-");
                            // 04- Generate alternate candidates when country name contains SAINT which can be abbreviated
                            // E.g. STE.-HÉLÈNE
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /\b(SAINTE)\b/i, "STE.");
                            // E.g. STE-HÉLÈNE
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /\b(SAINTE)\b/i, "STE");
                            // E.g. ST.-MARTIN
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /\b(SAINT|SINT)\b/i, "ST.");
                            // E.g. ST-MARTIN
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /\b(SAINT|SINT)\b/i, "ST");
                            // E.g. S. MARINO
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /\b(SANTA|SANTO|SAINT)\b/i, "S.");
                            // 05- Generate alternate candidates when country name contains NEW which can be abbreviated
                            // E.g. N. ZÉLANDE
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /\b(NOUVELLE|NUEVA|NUOVA)\b/i, "N.");
                            // E.g. N ZÉLANDE
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /\b(NOUVELLE|NUEVA|NUOVA)\b/i, "N");
                            // 06- Generate alternate candidates when country name contains REPUBLIC which can be abbreviated
                            // E.g. REP. DE CORÉE
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /\b(REPUBLIC|RÉPUBLIQUE|REPUBLIQUE|REPUBBLICA|REPUBLICA|REPUBLIK)\b/i, "REP.");
                            // E.g. REP DE CORÉE
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /\b(REPUBLIC|RÉPUBLIQUE|REPUBLIQUE|REPUBBLICA|REPUBLICA|REPUBLIK)\b/i, "REP");
                            // 07- Generate alternate candidates when country name contains iphens which may be ommitted
                            // E.g. NOUVELLE ZÉLANDE
                            allCandidates = Lib.FirstTimeRecognition.EngineBase.PushAlternateCountryNames(candidatesBuffer, allCandidates, /([A-Z\.])\-([A-Z\.])/gi, "$1 $2");
                            // 08- Remove duplicate entries in array
                            allCandidates = Sys.Helpers.Array.GetDistinctArray(allCandidates);
                            // 09- Sort array by length of elements DESC
                            allCandidates.sort(function (a, b) {
                                return b.length - a.length;
                            });
                            // 10- For BONAIRE / SAINT HELENA
                            for (j = 0; j < allCandidates.length; j++) {
                                allCandidates[j] = allCandidates[j].replace("; ", ", ");
                            }
                            // Run the search for country with all name candidates
                            if (areaArray !== null && areaArray.length) {
                                for (j = 0; j < areaArray.length; j++) {
                                    bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchWord(allCandidates, sensitive, fuzzy, trimChar, trimOrientation, areaArray[j], breakAtFirst, maxVariance, uniqueMatchPerWord);
                                    if (bufferArray !== null && bufferArray.length) {
                                        searchResults = searchResults.concat(bufferArray);
                                    }
                                }
                            }
                            if (searchResults !== null && searchResults.length) {
                                bCountryFound = true;
                            }
                        }
                        else {
                            Log.Warn("[CollectCountryNames] Cannot run search for language '" + language + "' because it is either invalid or not supported");
                        }
                    }
                    if (bCountryFound && AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                        // Additional processing to ignore results that are contained in certain areas
                        var finalResults = [];
                        var discardArea = false;
                        for (i = 0; i < searchResults.length; i++) {
                            discardArea = false;
                            for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                    discardArea = true;
                                    break;
                                }
                            }
                            if (discardArea === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryNames] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                            }
                        }
                        return finalResults;
                    }
                }
                return searchResults;
            }
            EngineBase.CollectCountryNames = CollectCountryNames;
            function CollectCountryEmailAddresses(country, areaArray, breakAtFirst, discardNonMonoBlockArea, hSpaceTolerance, AreasToIgnoreArray, EmailDomainsToIgnoreArray) {
                var i, j, searchResults = [], bufferArray = [], finalResults = [];
                if (country) {
                    var regEx = new RegExp("\\b[A-Z0-9_\.\%\+\-]+@[A-Z0-9\-\.]+[.]" + country.iso2.replace("GB", "UK") + "\\b", "igm");
                    if (areaArray !== null && areaArray.length) {
                        for (i = 0; i < areaArray.length; i++) {
                            bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchRegExp(regEx, null, areaArray[i], breakAtFirst, discardNonMonoBlockArea, hSpaceTolerance, null);
                            if (bufferArray !== null && bufferArray.length) {
                                searchResults = searchResults.concat(bufferArray);
                            }
                        }
                    }
                    // Additional processing to ignore candidates that are found in certain specified areas
                    if (searchResults !== null && searchResults.length && AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                        var discardArea = false;
                        for (i = 0; i < searchResults.length; i++) {
                            discardArea = false;
                            for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                    discardArea = true;
                                    break;
                                }
                            }
                            if (discardArea === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryEmailAddresses] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                            }
                        }
                        searchResults = finalResults;
                    }
                    // Additional processing to ignore candidates that match certain specified patterns
                    if (searchResults !== null && searchResults.length && EmailDomainsToIgnoreArray !== null && EmailDomainsToIgnoreArray.length) {
                        var discardValue = false;
                        finalResults = [];
                        for (i = 0; i < searchResults.length; i++) {
                            discardValue = false;
                            for (j = 0; j < EmailDomainsToIgnoreArray.length; j++) {
                                if (EmailDomainsToIgnoreArray[j].test(searchResults[i].value)) {
                                    discardValue = true;
                                    break;
                                }
                            }
                            if (discardValue === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryEmailAddresses] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it matches a pattern to be ignored");
                            }
                        }
                        searchResults = finalResults;
                    }
                }
                return searchResults;
            }
            EngineBase.CollectCountryEmailAddresses = CollectCountryEmailAddresses;
            function CollectCountryWebUrls(country, areaArray, breakAtFirst, discardNonMonoBlockArea, hSpaceTolerance, AreasToIgnoreArray, WebDomainsToIgnoreArray) {
                var i, j, searchResults = [], bufferArray = [], finalResults = [];
                if (country) {
                    var regEx = new RegExp("(^|[^@]\\b)(http\\:\\/\\/|https\\:\\/\\/|ftp\\:\\/\\/)?(www\\.)?([a-z0-9][a-z0-9\-_]*\\.)+[a-z0-9\\-]*[.]" + country.iso2.replace("GB", "UK") + "\\b($|\\/|[^.])", "igm");
                    if (areaArray !== null && areaArray.length) {
                        for (i = 0; i < areaArray.length; i++) {
                            bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchRegExp(regEx, null, areaArray[i], breakAtFirst, discardNonMonoBlockArea, hSpaceTolerance, null);
                            if (bufferArray !== null && bufferArray.length) {
                                searchResults = searchResults.concat(bufferArray);
                            }
                        }
                    }
                    // Additional processing to ignore candidates that are found in certain specified areas
                    if (searchResults !== null && searchResults.length && AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                        var discardArea = false;
                        for (i = 0; i < searchResults.length; i++) {
                            discardArea = false;
                            for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                    discardArea = true;
                                    break;
                                }
                            }
                            if (discardArea === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryWebUrls] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                            }
                        }
                        searchResults = finalResults;
                    }
                    // Additional processing to ignore candidates that match certain specified patterns
                    if (searchResults !== null && searchResults.length && WebDomainsToIgnoreArray !== null && WebDomainsToIgnoreArray.length) {
                        var discardValue = false;
                        finalResults = [];
                        for (i = 0; i < searchResults.length; i++) {
                            discardValue = false;
                            for (j = 0; j < WebDomainsToIgnoreArray.length; j++) {
                                if (WebDomainsToIgnoreArray[j].test(searchResults[i].value)) {
                                    discardValue = true;
                                    break;
                                }
                            }
                            if (discardValue === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryWebUrls] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it matches a pattern to be ignored");
                            }
                        }
                        searchResults = finalResults;
                    }
                }
                return searchResults;
            }
            EngineBase.CollectCountryWebUrls = CollectCountryWebUrls;
            // NormalisePhoneNumber: format value into international format +<country code> <local number> (e.g. +61 285965108)
            function NormalisePhoneNumber(country, value) {
                if (country && value) {
                    var callcode = country.call;
                    // Remove placeholders such as n
                    var intpr = country.intpr.replace(/[^0-9]/g, "");
                    // Remove placeholders such as n
                    var tkpr = country.tkpr.replace(/[^0-9]/g, "");
                    var minlen = country.minln;
                    var maxlen = country.maxln;
                    if (callcode.length) {
                        // For NANPA: http://en.wikipedia.org/wiki/North_American_Numbering_Plan
                        if (callcode.indexOf(" ") > -1) {
                            callcode = callcode.split(" ")[0];
                        }
                        var normalisedNumberPrefix = "+" + callcode + " ";
                        // Keep +0123456789 only
                        value = value.replace(/[^0-9+]/g, "");
                        // Look for international prefix
                        if (intpr.length && value.indexOf("+" + intpr + callcode) === 0) {
                            value = value.substring(country.intpr.length + callcode.length + 1);
                        }
                        else if (value.indexOf("+" + callcode) === 0) {
                            value = value.substring(callcode.length + 1);
                        }
                        else if (intpr.length && value.indexOf(intpr + callcode) === 0) {
                            value = value.substring(country.intpr.length + callcode.length);
                        }
                        else if (value.indexOf(callcode) === 0 && value.length >= minlen + callcode.length) {
                            value = value.substring(callcode.length);
                        }
                        if (tkpr.length && value.indexOf(tkpr) === 0) {
                            // Look for trunk prefix
                            value = value.substring(country.tkpr.length);
                        }
                        if (value.length > maxlen) {
                            // Truncate to max length
                            value = value.substring(0, maxlen);
                        }
                        // Append international prefix & local number
                        value = normalisedNumberPrefix + value;
                    }
                    else {
                        // To keep one chance at storing the normalised number
                        value = value.replace(/[^0-9 +]/g, "");
                    }
                }
                return value;
            }
            EngineBase.NormalisePhoneNumber = NormalisePhoneNumber;
            // Allow up to 5 separator characters in the phone number (comma, space, iphen, slash, brackets)
            EngineBase.PHONENO_ALLOWED_SEPARATORS = 5;
            function CollectCountryPhoneNumbers(country, areaArray, breakAtFirst, discardNonMonoBlockArea, hSpaceTolerance, AreasToIgnoreArray, PhoneNumbersToIgnoreArray) {
                var i, j, searchResults = [], bufferArray = [], finalResults = [];
                if (country) {
                    var callingCodeLength = country.call.length;
                    var intpr = country.intpr.replace(/[n]/g, "[0-9]");
                    var areacodeln = 0;
                    if (country.call.indexOf(" ") > -1) {
                        callingCodeLength = country.call.split(" ")[0].length;
                        var areaCode = country.call.split(" ")[1];
                        // Between [89] - 1 char
                        areaCode = areaCode.replace(/\[.*\]/, "X");
                        // Between (89| - x char
                        areaCode = areaCode.replace(/\((.*)\|(.*)\)/, "$1");
                        areacodeln = areaCode.length;
                    }
                    // may contain the area code as well
                    var callcode = country.call.replace(" ", "[)]?[ \-]?[(]?");
                    var minlen = country.minln - areacodeln;
                    var maxlen = country.maxln - areacodeln;
                    if (isNaN(minlen) || minlen < 1) {
                        minlen = 3;
                    }
                    if (isNaN(maxlen) || maxlen < 1) {
                        // http://en.wikipedia.org/wiki/E.164
                        maxlen = 15 - callingCodeLength;
                    }
                    maxlen += Lib.FirstTimeRecognition.EngineBase.PHONENO_ALLOWED_SEPARATORS;
                    // Supported formats:
                    //	(0011) 61 2 8596 5108
                    //	(0011)61 2 8596 5108
                    //	001161 2 8596 5108
                    //	+61 2 85965108
                    //	+(61) 2 85965108
                    //	(61) (0)2-8596-5108
                    //	02 8596 5108, 02.8596.5108, 02-8596-5108
                    var search = "(^| |[:])(([(+]|[(]|[+(]|[+])(" + intpr + " ?)?[ \-]?(" + callcode + ") ?[)]?[ \-]?[(]?([0-9 \)\.\-]{" + minlen + "," + maxlen + "}))\\b";
                    var phoneNumberRegEx = new RegExp(search, "gm");
                    if (areaArray !== null && areaArray.length) {
                        for (i = 0; i < areaArray.length; i++) {
                            bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchRegExp(phoneNumberRegEx, null, areaArray[i], breakAtFirst, discardNonMonoBlockArea, hSpaceTolerance, "$2");
                            if (bufferArray !== null && bufferArray.length) {
                                searchResults = searchResults.concat(bufferArray);
                            }
                        }
                    }
                    /*if (searchResults !== null && searchResults.length ) {
                        for( i=0; i<searchResults.length; i++ ) {
                            phoneNumberRegEx = new RegExp( "(.*)?([(+]|[(]|[+(]|[+])(" + intpr  + " ?)?[ \-]?(" + callcode + ") ?[)]?[ \-]?[(]?([0-9 \)\.\-]{" + minlen + "," + maxlen + "})\\b", "igm" );
                            searchResults[i].value = searchResults[i].value.replace( phoneNumberRegEx, "$2$3$4$5" );
                            let newArea = Document.SearchString( searchResults[i].value, searchResults[i].area, true, false );
                            if (newArea !== null && newArea.length ){
                                searchResults[i].area = newArea[0];
                            }
                        }
                    }*/
                    // Additional processing to ignore candidates that are found in certain specified areas
                    if (searchResults !== null && searchResults.length && AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                        var discardArea = false;
                        for (i = 0; i < searchResults.length; i++) {
                            discardArea = false;
                            for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                    discardArea = true;
                                    break;
                                }
                            }
                            if (discardArea === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryPhoneNumbers] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                            }
                        }
                        searchResults = finalResults;
                    }
                    // Additional processing to ignore candidates that match certain specified patterns
                    if (searchResults !== null && searchResults.length && PhoneNumbersToIgnoreArray !== null && PhoneNumbersToIgnoreArray.length) {
                        var discardValue = false, normalisedNumber = void 0;
                        finalResults = [];
                        for (i = 0; i < searchResults.length; i++) {
                            discardValue = false;
                            normalisedNumber = Lib.FirstTimeRecognition.EngineBase.NormalisePhoneNumber(country, searchResults[i].value);
                            for (j = 0; j < PhoneNumbersToIgnoreArray.length; j++) {
                                if (PhoneNumbersToIgnoreArray[j] === normalisedNumber) {
                                    discardValue = true;
                                    break;
                                }
                            }
                            if (discardValue === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryPhoneNumbers] " + country.iso2 + ": Discard '" + normalisedNumber + "' as it is a value to be ignored");
                            }
                        }
                        searchResults = finalResults;
                    }
                }
                return searchResults;
            }
            EngineBase.CollectCountryPhoneNumbers = CollectCountryPhoneNumbers;
            function CollectCountryVATCodes(country, areaArray, breakAtFirst, discardNonMonoBlockArea, hSpaceTolerance, AreasToIgnoreArray, vatCodePatternCountArray, countryVATcodeRank, VATCodesToIgnoreArray) {
                var i, j, searchResults = [], bufferArray = [], vatcodes = [], finalResults = [], vatCodePattern;
                if (country) {
                    var vatCode = country.vat;
                    if (vatCode.length) {
                        // Number	[0-9BSOlI]
                        vatCode = vatCode.replace(/[n]/g, "[0-9]");
                        // Letter
                        vatCode = vatCode.replace(/[a]/g, "[A-Z]");
                        var regEx = new RegExp("(^|[A-Z0-9•/\-][ \.]?[ _:\*;,\-\.]{0,3})\\b(" + vatCode + ")\\b( ?[ '_:\*;,\-\.]{0,3}( ?[A-Z0-9/]|$))", "gmi");
                        if (areaArray !== null && areaArray.length) {
                            for (i = 0; i < areaArray.length; i++) {
                                bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchRegExp(regEx, /[^A-Z0-9]/gi, areaArray[i], false /*do not break at first*/, discardNonMonoBlockArea, hSpaceTolerance, "$2");
                                if (bufferArray !== null && bufferArray.length) {
                                    vatcodes = vatcodes.concat(bufferArray);
                                }
                            }
                        }
                        if (vatcodes !== null && vatcodes.length) {
                            var rawVATCode = void 0, postfix = void 0;
                            for (i = 0; i < vatcodes.length; i++) {
                                // Clean up the OCR-tolerant-extracted strings
                                // Non-alphanumerical characters are discarded and digits and chars are restored (8E4S6 -> BE456)
                                rawVATCode = vatcodes[i].value.toString();
                                postfix = rawVATCode.substr(2);
                                // Belgium
                                if (rawVATCode.indexOf("8E") === 0) {
                                    rawVATCode = "BE" + postfix;
                                }
                                // Spain
                                else if (rawVATCode.indexOf("ES8") === 0) {
                                    rawVATCode = "ESB" + postfix;
                                }
                                // United Kingdom
                                else if (rawVATCode.indexOf("G8") === 0) {
                                    rawVATCode = "GB" + postfix;
                                }
                                // Norway
                                else if (rawVATCode.indexOf("N0") === 0) {
                                    rawVATCode = "NO" + postfix;
                                }
                                // Romania
                                else if (rawVATCode.indexOf("R0") === 0) {
                                    rawVATCode = "RO" + postfix;
                                }
                                // Sweden
                                else if (rawVATCode.indexOf("5E") === 0) {
                                    rawVATCode = "SE" + postfix;
                                }
                                // Slovakia
                                else if (rawVATCode.indexOf("5K") === 0) {
                                    rawVATCode = "SK" + postfix;
                                }
                                // Slovenia
                                else if (rawVATCode.indexOf("5I") === 0) {
                                    rawVATCode = "SI" + postfix;
                                }
                                // Netherlands
                                else if (rawVATCode.indexOf("NL") === 0) {
                                    rawVATCode = rawVATCode.substr(0, rawVATCode.length - 3) + "B" + rawVATCode.substr(rawVATCode.length - 2);
                                }
                                // Italy
                                else if (rawVATCode.indexOf("1T") === 0 || rawVATCode.indexOf("lT") === 0) {
                                    rawVATCode = "IT" + postfix;
                                }
                                // Finland
                                else if (rawVATCode.indexOf("F1") === 0 || rawVATCode.indexOf("Fl") === 0) {
                                    rawVATCode = "FI" + postfix;
                                }
                                // Ireland
                                else if (rawVATCode.indexOf("1E") === 0 || rawVATCode.indexOf("lE") === 0) {
                                    rawVATCode = "IE" + postfix;
                                }
                                if (rawVATCode.indexOf(country.iso2) === 0) {
                                    // Return full rank
                                    searchResults.push({ value: rawVATCode, area: vatcodes[i].area, rank: countryVATcodeRank });
                                }
                                else {
                                    // Use weighed rank only if post code pattern is found more than once in array
                                    vatCodePattern = country.vat;
                                    vatCodePattern = vatCodePattern.replace(/( [?])/g, "");
                                    vatCodePattern = vatCodePattern.replace(/(\[\-\]\?)/g, "");
                                    vatCodePattern = vatCodePattern.replace(/(\[\\. \]\?)/g, "");
                                    vatCodePattern = vatCodePattern.replace(/(\[ \\-\]\?)/g, "");
                                    vatCodePattern = vatCodePattern.replace(/(\[\\. \\-\]\?)/g, "");
                                    if (Object.prototype.hasOwnProperty.call(vatCodePatternCountArray, vatCodePattern)) {
                                        searchResults.push({ value: rawVATCode, area: vatcodes[i].area, rank: parseFloat((countryVATcodeRank / vatCodePatternCountArray[vatCodePattern]).toFixed(2)) });
                                    }
                                    else {
                                        Log.Error("[CollectCountryVATCodes] " + country.iso2 + ": VAT code pattern " + vatCodePattern + " not found");
                                    }
                                }
                            }
                            if (searchResults !== null && searchResults.length) {
                                searchResults.sort(function (a, b) { return b.rank - a.rank; });
                            }
                        }
                        // Additional processing to ignore candidates that are found in certain specified areas
                        if (searchResults !== null && searchResults.length && AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                            var discardArea = false;
                            for (i = 0; i < searchResults.length; i++) {
                                discardArea = false;
                                for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                    if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                        discardArea = true;
                                        break;
                                    }
                                }
                                if (discardArea === false) {
                                    finalResults.push(searchResults[i]);
                                }
                                else {
                                    Log.Warn("[CollectCountryVATCodes] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                                }
                            }
                            searchResults = finalResults;
                        }
                        // Additional processing to ignore candidates that match certain specified patterns
                        if (searchResults !== null && searchResults.length && VATCodesToIgnoreArray !== null && VATCodesToIgnoreArray.length) {
                            var discardValue = false;
                            finalResults = [];
                            for (i = 0; i < searchResults.length; i++) {
                                discardValue = false;
                                for (j = 0; j < VATCodesToIgnoreArray.length; j++) {
                                    if (VATCodesToIgnoreArray[j] === searchResults[i].value) {
                                        discardValue = true;
                                        break;
                                    }
                                }
                                if (discardValue === false) {
                                    finalResults.push(searchResults[i]);
                                }
                                else {
                                    Log.Warn("[CollectCountryVATCodes] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is a value to be ignored");
                                }
                            }
                            searchResults = finalResults;
                        }
                    }
                }
                return searchResults;
            }
            EngineBase.CollectCountryVATCodes = CollectCountryVATCodes;
            function CollectCountryPostcodes(country, areaArray, breakAtFirst, discardNonMonoBlockArea, hSpaceTolerance, ignoreYear, AreasToIgnoreArray, postCodePatternCountArray, countryPostcodeRank) {
                var i, j, searchResults = [], bufferArray = [], discardArea = false, postCodePattern;
                var finalResults = [];
                if (country) {
                    var postCode = country.post;
                    if (postCode.length) {
                        // Number
                        postCode = postCode.replace(/[n]/g, "[0-9]");
                        // Letter
                        postCode = postCode.replace(/[a]/g, "[A-Z]");
                        // Country code
                        postCode = postCode.replace("cc", country.iso2);
                        var regEx = new RegExp("(^|[A-Z•/][ -]?[ _:\*;,\-\.]? )\\b(" + postCode + ")\\b([ _:\*;,\-\.]{0,3}[A-Z]|$)", "gmi");
                        if (areaArray !== null && areaArray.length) {
                            for (i = 0; i < areaArray.length; i++) {
                                bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchRegExp(regEx, /[^0-9A-Z \-]/g, areaArray[i], false /*do not break at first*/, discardNonMonoBlockArea, hSpaceTolerance, "$2");
                                if (bufferArray !== null && bufferArray.length) {
                                    searchResults = searchResults.concat(bufferArray);
                                }
                            }
                        }
                        if (searchResults !== null && searchResults.length) {
                            for (i = 0; i < searchResults.length; i++) {
                                // Additional processing to ignore candidates that are found in certain specified areas
                                if (AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                                    discardArea = false;
                                    for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                        if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                            discardArea = true;
                                            break;
                                        }
                                    }
                                }
                                if (discardArea === false && ignoreYear) {
                                    var date = new Date();
                                    var currentYear = "" + date.getFullYear();
                                    var previousYear = "" + (date.getFullYear() - 1);
                                    if (searchResults[i].value === currentYear || searchResults[i].value === previousYear) {
                                        discardArea = true;
                                    }
                                }
                                if (discardArea === false) {
                                    if (searchResults[i].value.indexOf(country.iso2) === 0 || searchResults[i].value.toUpperCase().indexOf(country.iso2.substr(0, 1)) === 0 || countryPostcodeRank === 0) {
                                        // Return full rank
                                        finalResults.push({ value: searchResults[i].value, area: searchResults[i].area, rank: countryPostcodeRank });
                                    }
                                    else {
                                        // Use weighed rank only if post code pattern is found more than once in array
                                        postCodePattern = country.post;
                                        postCodePattern = postCodePattern.replace(" ?", "");
                                        postCodePattern = postCodePattern.replace("[-]?", "");
                                        postCodePattern = postCodePattern.replace("(cc[ -])?", "");
                                        // Austria
                                        postCodePattern = postCodePattern.replace("(A[ \-])?", "");
                                        // Belgium
                                        postCodePattern = postCodePattern.replace("(B[ \-])?", "");
                                        // Germany
                                        postCodePattern = postCodePattern.replace("(D[ \-])?", "");
                                        // France
                                        postCodePattern = postCodePattern.replace("(F[ \-])?", "");
                                        // Luxembourg
                                        postCodePattern = postCodePattern.replace("(L[ \-])?", "");
                                        postCodePattern = postCodePattern.replace("([-]nnnn)?", "");
                                        postCodePattern = postCodePattern.replace("(n?)", "n");
                                        postCodePattern = postCodePattern.replace("[0-3]", "n");
                                        postCodePattern = postCodePattern.replace("[0-5]", "n");
                                        postCodePattern = postCodePattern.replace("[1-4]", "n");
                                        postCodePattern = postCodePattern.replace("[1-9]", "n");
                                        postCodePattern = postCodePattern.replace("9[0-2]", "nn");
                                        postCodePattern = postCodePattern.replace("(nn)?", "nn");
                                        postCodePattern = postCodePattern.replace("1nnn", "nnnn");
                                        postCodePattern = postCodePattern.replace("(08nn|[2-8]nnn)", "nnnn");
                                        postCodePattern = postCodePattern.replace("nnnn0", "nnnnn");
                                        // Jamaica
                                        postCodePattern = postCodePattern.replace(/^nn$/, "nnnn");
                                        if (Object.prototype.hasOwnProperty.call(postCodePatternCountArray, postCodePattern)) {
                                            finalResults.push({ value: searchResults[i].value, area: searchResults[i].area, rank: parseFloat((countryPostcodeRank / postCodePatternCountArray[postCodePattern]).toFixed(2)) });
                                        }
                                        else {
                                            Log.Error("[CollectCountryPostcodes] " + country.iso2 + ": Post code pattern " + postCodePattern + " not found");
                                        }
                                    }
                                }
                                else {
                                    Log.Warn("[CollectCountryPostcodes] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                                }
                            }
                        }
                    }
                }
                if (finalResults !== null && finalResults.length) {
                    finalResults.sort(function (a, b) {
                        return b.rank - a.rank;
                    });
                }
                return finalResults;
            }
            EngineBase.CollectCountryPostcodes = CollectCountryPostcodes;
            function CollectCountryCurrencyCodes(country, areaArray, sensitive, fuzzy, trimChar, trimOrientation, breakAtFirst, maxVariance, uniqueMatchPerWord, AreasToIgnoreArray, currCodePatternCountArray, countryCurrCodeRank) {
                var i, j, searchResults = [], bufferArray = [], originalValue, dottedValue;
                if (country) {
                    if (areaArray !== null && areaArray.length) {
                        for (i = 0; i < areaArray.length; i++) {
                            // E.g. USD
                            originalValue = country.curr;
                            // E.g. U.S.D.
                            dottedValue = originalValue.replace(/(.{1})/g, "$1.");
                            bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchWord([originalValue, dottedValue.slice(0, -1)], sensitive, fuzzy, trimChar, trimOrientation, areaArray[i], breakAtFirst, maxVariance, uniqueMatchPerWord);
                            if (bufferArray !== null && bufferArray.length) {
                                searchResults = searchResults.concat(bufferArray);
                            }
                        }
                    }
                    if (searchResults !== null && searchResults.length) {
                        var tempResults = [];
                        for (i = 0; i < searchResults.length; i++) {
                            if (searchResults[i].value.indexOf(country.iso2) === 0) {
                                // Return full rank
                                tempResults.push({ value: searchResults[i].value, area: searchResults[i].area, rank: countryCurrCodeRank });
                            }
                            // Use weighed rank only if post code pattern is found more than once in array
                            else if (Object.prototype.hasOwnProperty.call(currCodePatternCountArray, country.curr)) {
                                tempResults.push({ value: searchResults[i].value, area: searchResults[i].area, rank: parseFloat((countryCurrCodeRank / currCodePatternCountArray[country.curr]).toFixed(2)) });
                            }
                            else {
                                Log.Error("[CollectCountryCurrencyCodes] " + country.iso2 + ": Currency code " + country.curr + " not found");
                            }
                        }
                        if (tempResults !== null && tempResults.length) {
                            tempResults.sort(function (a, b) {
                                return b.rank - a.rank;
                            });
                        }
                        searchResults = tempResults;
                    }
                    // Additional processing to ignore candidates that are found in certain specified areas
                    if (searchResults !== null && searchResults.length && AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                        var finalResults = [];
                        var discardArea = false;
                        for (i = 0; i < searchResults.length; i++) {
                            discardArea = false;
                            for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                    discardArea = true;
                                    break;
                                }
                            }
                            if (discardArea === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryCurrencyCodes] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                            }
                        }
                        searchResults = finalResults;
                    }
                }
                return searchResults;
            }
            EngineBase.CollectCountryCurrencyCodes = CollectCountryCurrencyCodes;
            function CollectCountryCurrencySymbols(country, areaArray, sensitive, fuzzy, trimChar, trimOrientation, breakAtFirst, maxVariance, uniqueMatchPerWord, AreasToIgnoreArray, currSymbPatternCountArray, countryCurrSymbRank) {
                var i, j, searchResults = [], bufferArray = [];
                if (country) {
                    if (areaArray !== null && areaArray.length) {
                        for (i = 0; i < areaArray.length; i++) {
                            bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchWord([country.symb], sensitive, fuzzy, trimChar, trimOrientation, areaArray[i], breakAtFirst, maxVariance, uniqueMatchPerWord);
                            if (bufferArray !== null && bufferArray.length) {
                                searchResults = searchResults.concat(bufferArray);
                            }
                        }
                    }
                    if (searchResults !== null && searchResults.length) {
                        var tempResults = [];
                        for (i = 0; i < searchResults.length; i++) {
                            if (searchResults[i].value.indexOf(country.iso2) === 0) {
                                // Return full rank
                                tempResults.push({ value: searchResults[i].value, area: searchResults[i].area, rank: countryCurrSymbRank });
                            }
                            // Use weighed rank only if post code pattern is found more than once in array
                            else if (Object.prototype.hasOwnProperty.call(currSymbPatternCountArray, country.symb)) {
                                tempResults.push({ value: searchResults[i].value, area: searchResults[i].area, rank: parseFloat((countryCurrSymbRank / currSymbPatternCountArray[country.symb]).toFixed(2)) });
                            }
                            else {
                                Log.Error("[CollectCountryCurrencySymbols] " + country.iso2 + ": Currency symbol " + country.symb + " not found");
                            }
                        }
                        if (tempResults !== null && tempResults.length) {
                            tempResults.sort(function (a, b) {
                                return b.rank - a.rank;
                            });
                        }
                        searchResults = tempResults;
                    }
                    // Additional processing to ignore candidates that are found in certain specified areas
                    if (searchResults !== null && searchResults.length && AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                        var finalResults = [];
                        var discardArea = false;
                        for (i = 0; i < searchResults.length; i++) {
                            discardArea = false;
                            for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                    discardArea = true;
                                    break;
                                }
                            }
                            if (discardArea === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryCurrencyCodes] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                            }
                        }
                        searchResults = finalResults;
                    }
                }
                return searchResults;
            }
            EngineBase.CollectCountryCurrencySymbols = CollectCountryCurrencySymbols;
            function CollectCountryKeywords(country, keywordsArray, areaArray, sensitive, fuzzy, trimChar, trimOrientation, breakAtFirst, maxVariance, uniqueMatchPerWord, AreasToIgnoreArray, countryKeywordRank) {
                var i, j, searchResults = [], bufferArray = [];
                if (country) {
                    if (areaArray !== null && areaArray.length) {
                        for (i = 0; i < areaArray.length; i++) {
                            bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchWord(keywordsArray, sensitive, fuzzy, trimChar, trimOrientation, areaArray[i], breakAtFirst, maxVariance, uniqueMatchPerWord);
                            if (bufferArray !== null && bufferArray.length) {
                                searchResults = searchResults.concat(bufferArray);
                            }
                        }
                    }
                    if (searchResults !== null && searchResults.length) {
                        var tempResults = [];
                        for (i = 0; i < searchResults.length; i++) {
                            tempResults.push({ value: searchResults[i].value, area: searchResults[i].area, rank: countryKeywordRank });
                        }
                        searchResults = tempResults;
                    }
                    // Additional processing to ignore candidates that are found in certain specified areas
                    if (searchResults !== null && searchResults.length && AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                        var finalResults = [];
                        var discardArea = false;
                        for (i = 0; i < searchResults.length; i++) {
                            discardArea = false;
                            for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                    discardArea = true;
                                    break;
                                }
                            }
                            if (discardArea === false) {
                                finalResults.push(searchResults[i]);
                            }
                            else {
                                Log.Warn("[CollectCountryKeywords] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                            }
                        }
                        searchResults = finalResults;
                    }
                }
                return searchResults;
            }
            EngineBase.CollectCountryKeywords = CollectCountryKeywords;
            function CollectCountryIBANs(country, areaArray, breakAtFirst, discardNonMonoBlockArea, hSpaceTolerance, AreasToIgnoreArray, countryIBANRank, IBANToIgnoreArray) {
                var i, j, searchResults = [], bufferArray = [], finalResults = [];
                if (country) {
                    var iban = country.iban;
                    if (iban.length) {
                        // Checksum number (with OCR-error tolerance)
                        iban = iban.replace(/[k]/g, " ?[0-9OlIZAS$GbTBg] ?");
                        // Number (without OCR-error tolerance)
                        iban = iban.replace(/[n]/g, " ?[0-9] ?");
                        // Letter
                        iban = iban.replace(/[a]/g, " ?[A-Z] ?");
                        // Number or Letter
                        iban = iban.replace(/[c]/g, " ?[0-9A-Z] ?");
                        iban = iban.replace(/ \? \?/g, " ?");
                        var regEx = new RegExp("\\b(" + iban + ")\\b", "igm");
                        if (areaArray !== null && areaArray.length) {
                            for (i = 0; i < areaArray.length; i++) {
                                bufferArray = Lib.FirstTimeRecognition.EngineBase.SearchRegExp(regEx, /[^A-Z0-9]/gi, areaArray[i], false /*do not break at first*/, discardNonMonoBlockArea, hSpaceTolerance, null);
                                if (bufferArray !== null && bufferArray.length) {
                                    searchResults = searchResults.concat(bufferArray);
                                }
                            }
                        }
                        // Clean up the OCR-error-tolerant extracted values
                        // Non-alphanumerical characters are discarded and digits and chars are restored (8E4S6 -> BE456)
                        if (searchResults !== null && searchResults.length) {
                            var rawIBAN = void 0, prefix2 = void 0, prefix3 = void 0, prefix4 = void 0, suffix1 = void 0, suffix2 = void 0, suffix3 = void 0, suffix4 = void 0;
                            for (i = 0; i < searchResults.length; i++) {
                                rawIBAN = searchResults[i].value;
                                prefix2 = rawIBAN.substr(0, 1);
                                prefix3 = rawIBAN.substr(0, 2);
                                prefix4 = rawIBAN.substr(0, 3);
                                suffix1 = rawIBAN.substr(1);
                                suffix2 = rawIBAN.substr(2);
                                suffix3 = rawIBAN.substr(3);
                                suffix4 = rawIBAN.substr(4);
                                if (rawIBAN.indexOf("0") === 0) {
                                    rawIBAN = "O" + suffix1;
                                }
                                else if (rawIBAN.indexOf("1") === 0) {
                                    rawIBAN = "I" + suffix1;
                                }
                                else if (rawIBAN.indexOf("l") === 0) {
                                    rawIBAN = "I" + suffix1;
                                }
                                else if (rawIBAN.indexOf("2") === 0) {
                                    rawIBAN = "Z" + suffix1;
                                }
                                else if (rawIBAN.indexOf("4") === 0) {
                                    rawIBAN = "A" + suffix1;
                                }
                                else if (rawIBAN.indexOf("5") === 0) {
                                    rawIBAN = "S" + suffix1;
                                }
                                else if (rawIBAN.indexOf("$") === 0) {
                                    rawIBAN = "S" + suffix1;
                                }
                                else if (rawIBAN.indexOf("6") === 0) {
                                    rawIBAN = "G" + suffix1;
                                }
                                else if (rawIBAN.indexOf("7") === 0) {
                                    rawIBAN = "T" + suffix1;
                                }
                                else if (rawIBAN.indexOf("8") === 0) {
                                    rawIBAN = "B" + suffix1;
                                }
                                if (rawIBAN.indexOf("0") === 1) {
                                    rawIBAN = prefix2 + "O" + suffix2;
                                }
                                else if (rawIBAN.indexOf("1") === 1) {
                                    rawIBAN = prefix2 + "I" + suffix2;
                                }
                                else if (rawIBAN.indexOf("l") === 1) {
                                    rawIBAN = prefix2 + "I" + suffix2;
                                }
                                else if (rawIBAN.indexOf("2") === 1) {
                                    rawIBAN = prefix2 + "Z" + suffix2;
                                }
                                else if (rawIBAN.indexOf("4") === 1) {
                                    rawIBAN = prefix2 + "A" + suffix2;
                                }
                                else if (rawIBAN.indexOf("5") === 1) {
                                    rawIBAN = prefix2 + "S" + suffix2;
                                }
                                else if (rawIBAN.indexOf("$") === 1) {
                                    rawIBAN = prefix2 + "S" + suffix2;
                                }
                                else if (rawIBAN.indexOf("6") === 1) {
                                    rawIBAN = prefix2 + "G" + suffix2;
                                }
                                else if (rawIBAN.indexOf("7") === 1) {
                                    rawIBAN = prefix2 + "T" + suffix2;
                                }
                                else if (rawIBAN.indexOf("8") === 1) {
                                    rawIBAN = prefix2 + "B" + suffix2;
                                }
                                if (rawIBAN.indexOf("O") === 2) {
                                    rawIBAN = prefix3 + "0" + suffix3;
                                }
                                else if (rawIBAN.indexOf("l") === 2) {
                                    rawIBAN = prefix3 + "1" + suffix3;
                                }
                                else if (rawIBAN.indexOf("I") === 2) {
                                    rawIBAN = prefix3 + "1" + suffix3;
                                }
                                else if (rawIBAN.indexOf("Z") === 2) {
                                    rawIBAN = prefix3 + "2" + suffix3;
                                }
                                else if (rawIBAN.indexOf("A") === 2) {
                                    rawIBAN = prefix3 + "4" + suffix3;
                                }
                                else if (rawIBAN.indexOf("S") === 2) {
                                    rawIBAN = prefix3 + "5" + suffix3;
                                }
                                else if (rawIBAN.indexOf("$") === 2) {
                                    rawIBAN = prefix3 + "5" + suffix3;
                                }
                                else if (rawIBAN.indexOf("G") === 2) {
                                    rawIBAN = prefix3 + "6" + suffix3;
                                }
                                else if (rawIBAN.indexOf("b") === 2) {
                                    rawIBAN = prefix3 + "6" + suffix3;
                                }
                                else if (rawIBAN.indexOf("T") === 2) {
                                    rawIBAN = prefix3 + "7" + suffix3;
                                }
                                else if (rawIBAN.indexOf("B") === 2) {
                                    rawIBAN = prefix3 + "8" + suffix3;
                                }
                                else if (rawIBAN.indexOf("g") === 2) {
                                    rawIBAN = prefix3 + "9" + suffix3;
                                }
                                if (rawIBAN.indexOf("O") === 3) {
                                    rawIBAN = prefix4 + "0" + suffix4;
                                }
                                else if (rawIBAN.indexOf("l") === 3) {
                                    rawIBAN = prefix4 + "1" + suffix4;
                                }
                                else if (rawIBAN.indexOf("I") === 3) {
                                    rawIBAN = prefix4 + "1" + suffix4;
                                }
                                else if (rawIBAN.indexOf("Z") === 3) {
                                    rawIBAN = prefix4 + "2" + suffix4;
                                }
                                else if (rawIBAN.indexOf("A") === 3) {
                                    rawIBAN = prefix4 + "4" + suffix4;
                                }
                                else if (rawIBAN.indexOf("S") === 3) {
                                    rawIBAN = prefix4 + "5" + suffix4;
                                }
                                else if (rawIBAN.indexOf("$") === 3) {
                                    rawIBAN = prefix4 + "5" + suffix4;
                                }
                                else if (rawIBAN.indexOf("G") === 3) {
                                    rawIBAN = prefix4 + "6" + suffix4;
                                }
                                else if (rawIBAN.indexOf("b") === 3) {
                                    rawIBAN = prefix4 + "6" + suffix4;
                                }
                                else if (rawIBAN.indexOf("T") === 3) {
                                    rawIBAN = prefix4 + "7" + suffix4;
                                }
                                else if (rawIBAN.indexOf("B") === 3) {
                                    rawIBAN = prefix4 + "8" + suffix4;
                                }
                                else if (rawIBAN.indexOf("g") === 3) {
                                    rawIBAN = prefix4 + "9" + suffix4;
                                }
                                finalResults.push({ value: rawIBAN, area: searchResults[i].area, rank: countryIBANRank });
                            }
                            searchResults = finalResults;
                        }
                        // Additional processing to ignore candidates that are found in certain specified areas
                        if (searchResults !== null && searchResults.length && AreasToIgnoreArray !== null && AreasToIgnoreArray.length) {
                            var discardArea = false;
                            finalResults = [];
                            for (i = 0; i < searchResults.length; i++) {
                                discardArea = false;
                                for (j = 0; j < AreasToIgnoreArray.length; j++) {
                                    if (Lib.FirstTimeRecognition.EngineBase.IsWholeAreaInside(searchResults[i].area, AreasToIgnoreArray[j])) {
                                        discardArea = true;
                                        break;
                                    }
                                }
                                if (discardArea === false) {
                                    finalResults.push(searchResults[i]);
                                }
                                else {
                                    Log.Warn("[CollectCountryIBANs] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is in an area to ignore");
                                }
                            }
                            searchResults = finalResults;
                        }
                        // Additional processing to ignore candidates that match certain specified patterns
                        if (searchResults !== null && searchResults.length && IBANToIgnoreArray !== null && IBANToIgnoreArray.length) {
                            var discardValue = false;
                            finalResults = [];
                            for (i = 0; i < searchResults.length; i++) {
                                discardValue = false;
                                for (j = 0; j < IBANToIgnoreArray.length; j++) {
                                    if (IBANToIgnoreArray[j] === searchResults[i].value) {
                                        discardValue = true;
                                        break;
                                    }
                                }
                                if (discardValue === false) {
                                    finalResults.push(searchResults[i]);
                                }
                                else {
                                    Log.Warn("[CollectCountryIBANs] " + country.iso2 + ": Discard '" + searchResults[i].value + "' as it is a value to be ignored");
                                }
                            }
                            searchResults = finalResults;
                        }
                    }
                }
                return searchResults;
            }
            EngineBase.CollectCountryIBANs = CollectCountryIBANs;
        })(EngineBase = FirstTimeRecognition.EngineBase || (FirstTimeRecognition.EngineBase = {}));
    })(FirstTimeRecognition = Lib.FirstTimeRecognition || (Lib.FirstTimeRecognition = {}));
})(Lib || (Lib = {}));
