///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SynergyNeuralNetwork_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_AP_V12.0.461.0",
    "Lib_CrossCultural_V12.0.461.0",
    "Lib_CrossCultural_Date_V12.0.461.0",
    "Sys/Sys_Helpers_Date"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SynergyNeuralNetwork;
        (function (SynergyNeuralNetwork) {
            var apiResult = {};
            var thresholdConfidence = 0.1;
            var bestExtractedNetAmount;
            var currency;
            var options;
            function ExecuteAPI(opts) {
                var modelName = "SynergyForInvoiceHeader";
                if (opts.synergyNeuralNetworkLineItem) {
                    if (opts.synergyNeuralNetworkHeader) {
                        modelName = "SynergyForInvoice";
                    }
                    else {
                        modelName = "SynergyForInvoiceLineItem";
                    }
                }
                var jsonString;
                try {
                    jsonString = Process.GetSynergyExtraction(modelName);
                    apiResult = JSON.parse(jsonString);
                    return true;
                }
                catch (e) {
                    Log.Warn("Call to SynergyNeuralNetwork failed with the model ".concat(modelName, ". Process.GetSynergyExtraction() return is: ").concat(jsonString));
                    apiResult = {};
                    var nPages = Document.GetPageCount();
                    if (nPages > 10) {
                        Log.Warn("Too many pages to call the model ".concat(modelName));
                    }
                }
                return false;
            }
            function GetSynergyAreas(candidate) {
                var boxes = [];
                var boxesToHighlight = candidate.box_per_page;
                if (boxesToHighlight) {
                    for (var _i = 0, _a = Object.keys(boxesToHighlight); _i < _a.length; _i++) {
                        var boxPerPage = _a[_i];
                        var box = boxesToHighlight[boxPerPage];
                        var boxArea = Document.GetArea(parseInt(boxPerPage, 10) - 1, box.left, box.top, box.right - box.left, box.bottom - box.top);
                        boxes.push(boxArea);
                    }
                }
                return boxes;
            }
            function SetSynergyValue(bestCandidate, areas, fieldToUpdate) {
                if (areas && areas.length > 0) {
                    Data.SetValue(fieldToUpdate, areas[0], bestCandidate.parsed_value);
                }
                else {
                    Data.SetValue(fieldToUpdate, bestCandidate.parsed_value);
                }
                Data.SetComputedValueSource(fieldToUpdate, "SynergyForInvoiceHeader");
                Data.SetComputed(fieldToUpdate, true);
            }
            //Story AP-FT-018357 - Stop to display the other candidates
            /*
            function HighlightSynergyAreas(areas: Area[], fieldToUpdate: string, idx: number): void
            {
                const highlightColorBorder = 0x000000;
                const highlightColorBackground = 0xFFCC00;
                for (const boxArea of areas)
                {
                    boxArea.Highlight(true, highlightColorBackground, highlightColorBorder, fieldToUpdate);
                }
            }*/
            var PostProcessing;
            (function (PostProcessing) {
                /**
                 * Function application order runs top-to-bottom.
                 */
                var pipe = function () {
                    var fns = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        fns[_i] = arguments[_i];
                    }
                    return function (x) { return fns.reduce(function (y, f) { return f(y); }, x); };
                };
                function getCandidateBox(c) {
                    var boxesToHighlight = c.box_per_page;
                    if (boxesToHighlight) {
                        for (var _i = 0, _a = Object.keys(boxesToHighlight); _i < _a.length; _i++) {
                            var boxPerPage = _a[_i];
                            return {
                                left: boxesToHighlight[boxPerPage].left,
                                right: boxesToHighlight[boxPerPage].right,
                                top: boxesToHighlight[boxPerPage].top,
                                bottom: boxesToHighlight[boxPerPage].bottom,
                                page: boxPerPage
                            };
                        }
                    }
                    return null;
                }
                function IsBoxIncludedIn(a, b) {
                    // Tolerances in pixels
                    var heightTolerance = 5;
                    var widthTolerance = 5;
                    var boxA = getCandidateBox(a);
                    var boxB = getCandidateBox(b);
                    if (!boxA) {
                        return true;
                    }
                    if (!boxB) {
                        return false;
                    }
                    return boxA.page === boxB.page
                        && boxA.top <= (boxB.top + heightTolerance)
                        && boxA.bottom >= (boxB.bottom - heightTolerance)
                        && boxA.left >= (boxB.left - widthTolerance)
                        && boxA.right <= (boxB.right + widthTolerance);
                }
                function IsFontSizeBigger(a, b) {
                    var boxA = getCandidateBox(a);
                    var boxB = getCandidateBox(b);
                    return (boxA.bottom - boxA.top) < (boxB.bottom - boxB.top);
                }
                /**
                 * Comparison function called on the sort functions
                 */
                function CompareBoxCandidates(a, b) {
                    var delta = Math.abs(b.mean_confidence - a.mean_confidence);
                    if (delta < 0.15) {
                        // Small drop in confidence
                        if (IsBoxIncludedIn(a, b)) {
                            // a is included in b
                            // b is better
                            return 1;
                        }
                        else if (IsBoxIncludedIn(b, a)) {
                            // b is included in a
                            // a is better
                            return -1;
                        }
                    }
                    // best confidence is better
                    return b.mean_confidence > a.mean_confidence ? 1 : -1;
                }
                function CompareFontSize(a, b) {
                    var delta = Math.abs(b.mean_confidence - a.mean_confidence);
                    if (delta < 0.15) {
                        if (IsFontSizeBigger(a, b)) {
                            return 1;
                        }
                        return -1;
                    }
                    return b.mean_confidence > a.mean_confidence ? 1 : -1;
                }
                function CompareCandidatesValue(a, b) {
                    var delta = Math.abs(b.mean_confidence - a.mean_confidence);
                    if (delta < 0.25 && a.parsed_value && b.parsed_value) {
                        var aString = a.parsed_value.toString();
                        var bString = b.parsed_value.toString();
                        if (bString !== aString) {
                            if (bString.indexOf(aString) > -1) {
                                return 1;
                            }
                            else if (aString.indexOf(bString) > -1) {
                                return -1;
                            }
                        }
                    }
                    return 0;
                }
                /**
                 * Post-processing functions applied on each field to update
                 */
                // Sort by box inclusion
                function TryGetLargerBox(candidates) {
                    return candidates.sort(CompareBoxCandidates);
                }
                // handle currency without decimal
                function TryNoDecimalCurrency(candidates) {
                    // check if currency has decimal
                    var hasDecimal = true;
                    if (currency && options.CurrencyHasDecimal && typeof options.CurrencyHasDecimal === "function") {
                        hasDecimal = options.CurrencyHasDecimal(currency);
                    }
                    if (!hasDecimal) {
                        for (var i = 0; i < candidates.length; i++) {
                            // clean raw value from known amount separators
                            var rawValue = candidates[i].raw_text;
                            var rawValues = rawValue.match(/-*[0-9]{1,3}([., "']{0,1}[0-9]{3})*/g);
                            // keep the bigger (as absolute) number
                            var parsedValue = rawValues[0] ? parseInt(rawValues[0].replace(/[., "']/g, ""), 10) : 0;
                            for (var j = 0; j < rawValues.length; j++) {
                                var value = rawValues[j] ? parseInt(rawValues[j].replace(/[., "']/g, ""), 10) : 0;
                                if (Math.abs(value) > Math.abs(parsedValue)) {
                                    parsedValue = value;
                                }
                            }
                            candidates[i].parsed_value = parsedValue;
                        }
                    }
                    return candidates;
                }
                // handle number starting with a dot
                function HandleNumberStartingWithPoint(candidates) {
                    for (var i = 0; i < candidates.length; i++) {
                        // clean raw value from known amount separators
                        var rawValue = candidates[i].raw_text;
                        if (rawValue.startsWith(".") || rawValue.startsWith(",")) {
                            var slicedValue = rawValue.slice(1);
                            if (slicedValue.indexOf(".") === -1 && slicedValue.indexOf(",")) {
                                candidates[i].parsed_value = rawValue;
                            }
                        }
                    }
                    return candidates;
                }
                // Sort by value inclusion
                function TryGetLargerFloat(candidates) {
                    if (candidates.length > 1) {
                        var candidateBiggerMeanConfidence = candidates[0];
                        candidates.sort(CompareCandidatesValue);
                        var bestIdxCandidate = 0;
                        var idx = 1;
                        while (idx < candidates.length && !IsBoxIncludedIn(candidateBiggerMeanConfidence, candidates[bestIdxCandidate])) {
                            if (candidates[bestIdxCandidate].parsed_value
                                && candidates[idx].parsed_value
                                && candidates[bestIdxCandidate].parsed_value === candidates[idx].parsed_value
                                && IsBoxIncludedIn(candidateBiggerMeanConfidence, candidates[idx])) {
                                bestIdxCandidate = idx;
                            }
                            idx++;
                        }
                        if (bestIdxCandidate > 0) {
                            var temp = candidates[bestIdxCandidate];
                            candidates[bestIdxCandidate] = candidates[0];
                            candidates[0] = temp;
                        }
                    }
                    return candidates;
                }
                // Return the extracted amount when the amount candidates are smaller than the extracted amount and the confidence is small too
                function TryBiggerThanNetAmount(candidates) {
                    if (bestExtractedNetAmount && bestExtractedNetAmount.parsed_value) {
                        var extractedNetAmount = bestExtractedNetAmount.parsed_value;
                        var i = candidates.length - 1;
                        while (i >= 0 && candidates[i].parsed_value <= extractedNetAmount && candidates[i].mean_confidence < 0.33) {
                            i--;
                        }
                        if (i < 0) {
                            candidates = [bestExtractedNetAmount];
                        }
                    }
                    return candidates;
                }
                // Sort by font size
                function TrySortByFontSize(candidates) {
                    return candidates.sort(CompareFontSize);
                }
                // Remove candidates with a font size too large
                function TryRemoveResultsWithBigFontSize(candidates) {
                    if (candidates.length > 0) {
                        var averageFontSize = 0;
                        for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
                            var candidate = candidates_1[_i];
                            var boxA = getCandidateBox(candidate);
                            averageFontSize = averageFontSize + boxA.bottom - boxA.top;
                        }
                        averageFontSize = averageFontSize / candidates.length;
                        for (var idx = candidates.length - 1; idx >= 0; idx--) {
                            var boxA = getCandidateBox(candidates[idx]);
                            if ((boxA.bottom - boxA.top) > 2 * averageFontSize) {
                                candidates.splice(idx, 1);
                            }
                        }
                    }
                    return candidates.sort(CompareFontSize);
                }
                // Modify date according to the culture and remove dates too far in the past and the future
                function TryFormatDate(candidates) {
                    var i = 0;
                    var formattedDate;
                    var isVendorCountryUS = Data.GetValue("VendorCountry__") === "US";
                    var tenYearsAgo = new Date();
                    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
                    for (i = 0; i < candidates.length; i++) {
                        formattedDate = Lib.CrossCultural.Date.ConvertToDateOrFormattedString(candidates[i].raw_text, "yyyy-MM-dd", isVendorCountryUS, true);
                        if (formattedDate.length > 0) {
                            var isoDate = Sys.Helpers.Date.ISOSTringToDate(formattedDate[0]);
                            if (Sys.Helpers.Date.CompareDate(isoDate, new Date()) > 0
                                || Sys.Helpers.Date.CompareDate(isoDate, tenYearsAgo) < 0) {
                                candidates[i].parsed_value = "";
                            }
                            else {
                                candidates[i].parsed_value = formattedDate[0];
                            }
                        }
                        else {
                            candidates[i].parsed_value = "";
                        }
                    }
                    return candidates;
                }
                // Remove N° at the begining of the invoice number
                function TryTrimNo(candidates) {
                    var i;
                    for (i = 0; i < candidates.length; i++) {
                        var parsedValue = candidates[i].parsed_value.toString();
                        candidates[i].parsed_value = parsedValue.replace(/^n°/i, "");
                    }
                    return candidates;
                }
                /**
                * Global post-processing functions
                */
                function TryGetCandidateAndHighlight(fieldToUpdate, candidates) {
                    var bestCandidateIdx = -1;
                    for (var idx = 0; idx < candidates.length; idx++) {
                        var candidate = candidates[idx];
                        if (bestCandidateIdx === -1 && candidate.parsed_value) {
                            bestCandidateIdx = idx;
                        }
                        //Story AP-FT-018357 - Stop to display the other candidates
                        /*else
                        {
                            HighlightSynergyAreas(GetSynergyAreas(candidate), fieldToUpdate, idx);
                        }*/
                    }
                    return bestCandidateIdx >= 0 ? candidates[bestCandidateIdx] : null;
                }
                function TryGetBestCandidate(fieldToUpdate, candidates) {
                    var processedCandidates = candidates;
                    if (fieldToUpdate !== "InvoiceCurrency__") {
                        var idx = processedCandidates.length - 1;
                        while (idx >= 0 && processedCandidates[idx].mean_confidence < thresholdConfidence) {
                            processedCandidates.pop();
                            idx--;
                        }
                    }
                    switch (fieldToUpdate) {
                        case "InvoiceAmount__":
                            processedCandidates = pipe(TryNoDecimalCurrency, TryBiggerThanNetAmount, TryGetLargerFloat, HandleNumberStartingWithPoint)(processedCandidates);
                            break;
                        case "ExtractedNetAmount__":
                            processedCandidates = pipe(TryNoDecimalCurrency, TryGetLargerFloat, HandleNumberStartingWithPoint)(processedCandidates);
                            break;
                        case "InvoiceNumber__":
                            processedCandidates = pipe(TryGetLargerBox, TryTrimNo)(processedCandidates);
                            break;
                        case "InvoiceDate__":
                            processedCandidates = pipe(TryFormatDate)(processedCandidates);
                            break;
                        case "InvoiceCurrency__":
                            processedCandidates = pipe(TryRemoveResultsWithBigFontSize, TrySortByFontSize)(processedCandidates);
                            break;
                        default:
                            break;
                    }
                    return TryGetCandidateAndHighlight(fieldToUpdate, processedCandidates);
                }
                PostProcessing.TryGetBestCandidate = TryGetBestCandidate;
                function AmountOutOfTolerance(isNegative, tolerance, amount) {
                    return (!isNegative && tolerance < amount) || (isNegative && tolerance > amount);
                }
                PostProcessing.AmountOutOfTolerance = AmountOutOfTolerance;
                function TryRemoveExtraLine(items) {
                    var tolerence = 0.5;
                    if (items && items.length > 0) {
                        var i = void 0;
                        var removed = [];
                        for (i = 0; i < items.length; i++) {
                            if (Object.keys(items[i]).length == 0 || !items[i].Amount || items[i].Amount.length === 0) {
                                removed.push(i);
                            }
                        }
                        var netAmount = Data.GetValue("ExtractedNetAmount__");
                        var totalAmount = netAmount ? netAmount : Data.GetValue("InvoiceAmount__");
                        if (totalAmount) {
                            var isNegative = totalAmount < 0;
                            var sum = 0;
                            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                                var line = items_1[_i];
                                if (line.Amount && line.Amount.length > 0) {
                                    sum += line.Amount[0].parsed_value;
                                }
                            }
                            var amountTolerance = isNegative ? totalAmount - (tolerence * items.length) : totalAmount + (tolerence * items.length);
                            var continu = true;
                            while (AmountOutOfTolerance(isNegative, amountTolerance, sum) && continu) {
                                var index = items.length - 1;
                                while (index > -1 && removed.indexOf(index) > -1) {
                                    index--;
                                }
                                if (index === -1) {
                                    continu = false;
                                }
                                else {
                                    var line = items[index];
                                    var lineAmount = line.Amount[0].parsed_value;
                                    var newSum = sum - lineAmount;
                                    if (AmountOutOfTolerance(isNegative, 1.2 * newSum, totalAmount)) {
                                        continu = false;
                                    }
                                    else {
                                        sum = newSum;
                                        removed.push(index);
                                    }
                                }
                            }
                        }
                        if (removed.length > 0) {
                            var lines = [];
                            for (i = 0; i < items.length; i++) {
                                if (removed.indexOf(i) === -1) {
                                    lines.push(items[i]);
                                }
                            }
                            return lines;
                        }
                    }
                    return items;
                }
                PostProcessing.TryRemoveExtraLine = TryRemoveExtraLine;
                function IsValidSynergyItem(item) {
                    var originalWord = item.raw_text.toUpperCase();
                    if (originalWord.indexOf("%") === -1 && originalWord.indexOf("VAT") === -1 && originalWord.indexOf("TVA") === -1) {
                        return true;
                    }
                    return false;
                }
                PostProcessing.IsValidSynergyItem = IsValidSynergyItem;
                function SelectColumnAtPosition(columns, cellLeft, cellRight) {
                    var column = 0;
                    while (column < columns.length && (columns[column].left > cellRight || columns[column].right < cellLeft)) {
                        column++;
                    }
                    return column;
                }
                PostProcessing.SelectColumnAtPosition = SelectColumnAtPosition;
                function TrySelectColumnUnitPrice(items) {
                    if (items && items.length > 0) {
                        var columns = [];
                        for (var i = 0; i < items.length; i++) {
                            var line = items[i];
                            if (line.UnitPrice) {
                                var totalItem = line.Amount && line.Amount[0] && line.Amount[0].parsed_value ? Math.abs(line.Amount[0].parsed_value) : 0;
                                for (var unitPriceIndex = 0; unitPriceIndex < line.UnitPrice.length; unitPriceIndex++) {
                                    var candidate = line.UnitPrice[unitPriceIndex];
                                    if (!PostProcessing.IsValidSynergyItem(candidate)) {
                                        continue;
                                    }
                                    var cellLeft = candidate.left;
                                    var cellRight = candidate.right;
                                    var distWithInteger = 0;
                                    if (candidate.parsed_value && candidate.parsed_value !== 0) {
                                        var unitPriceParsedValue = Math.abs(candidate.parsed_value);
                                        var supposedQuantity = totalItem / unitPriceParsedValue;
                                        distWithInteger = Math.min(Math.abs(supposedQuantity - Math.floor(supposedQuantity)), Math.abs(Math.floor(supposedQuantity) + 1 - supposedQuantity));
                                    }
                                    var column = PostProcessing.SelectColumnAtPosition(columns, cellLeft, cellRight);
                                    if (column === columns.length) {
                                        columns.push({
                                            left: cellLeft,
                                            right: cellRight,
                                            count: 1,
                                            mean_confidence: candidate.mean_confidence,
                                            integerDist: distWithInteger
                                        });
                                        columns[column].candidates = new Array(items.length);
                                    }
                                    else {
                                        columns[column].left = Math.min(cellLeft, columns[column].left);
                                        columns[column].right = Math.max(cellRight, columns[column].right);
                                        columns[column].count++;
                                        columns[column].mean_confidence += candidate.mean_confidence;
                                        columns[column].integerDist += distWithInteger;
                                    }
                                    if (!columns[column].candidates[i]) {
                                        columns[column].candidates[i] = unitPriceIndex;
                                    }
                                }
                            }
                        }
                        // Determine best columnm
                        var bestColumn = 0;
                        if (columns.length > 1) {
                            var bestScore = -1;
                            var bestDistToInteger = 2;
                            for (var c = 0; c < columns.length; c++) {
                                var score = columns[c].mean_confidence / columns[c].count;
                                var distToInteger = columns[c].integerDist / columns[c].count;
                                if ((score - 0.25) > bestScore || ((score + 0.25) > bestScore && distToInteger < bestDistToInteger)) {
                                    bestColumn = c;
                                    bestDistToInteger = distToInteger;
                                    bestScore = score;
                                }
                            }
                        }
                        // Update UnitPrice objects
                        for (var i = 0; i < items.length; i++) {
                            var itm = items[i];
                            if (itm.UnitPrice) {
                                var unitPriceCandidate = columns.length > 0 ? columns[bestColumn].candidates[i] : null;
                                if (isNaN(unitPriceCandidate)) {
                                    itm.UnitPrice = [];
                                }
                                else {
                                    itm.UnitPrice = [itm.UnitPrice[unitPriceCandidate]];
                                }
                            }
                        }
                    }
                    return items;
                }
                PostProcessing.TrySelectColumnUnitPrice = TrySelectColumnUnitPrice;
                function TrySelectColumnQuantity(items) {
                    var minRatio = 0.51, maxSTD = 1, minConfidence = 0.05, minScore = 0.45;
                    if (items && items.length > 0) {
                        var lines = [];
                        var columns = [];
                        for (var i = 0; i < items.length; i++) {
                            var line = items[i];
                            if (line.Amount && line.Amount.length > 0) {
                                lines.push([]);
                                if (!line.Quantity) {
                                    continue;
                                }
                                var columnOfPreviousCandidate = -1;
                                for (var _i = 0, _a = line.Quantity; _i < _a.length; _i++) {
                                    var candidate = _a[_i];
                                    var amount = Math.abs(line.Amount[0].parsed_value);
                                    var unitPriceXQuantity = line.UnitPrice === undefined || line.UnitPrice[0] === undefined ? amount : Math.abs(candidate.parsed_value * line.UnitPrice[0].parsed_value);
                                    var ratio = unitPriceXQuantity === amount ? 1 : Math.min(unitPriceXQuantity, amount) / Math.max(unitPriceXQuantity, amount);
                                    var cellLeft = candidate.left;
                                    var cellRight = candidate.right;
                                    var column = PostProcessing.SelectColumnAtPosition(columns, cellLeft, cellRight);
                                    if (column !== columnOfPreviousCandidate) {
                                        if (column === columns.length) {
                                            columns.push({
                                                left: cellLeft,
                                                right: cellRight,
                                                ratio: ratio,
                                                count: 1,
                                                mean_confidence: candidate.mean_confidence
                                            });
                                        }
                                        else {
                                            columns[column].left = Math.min(cellLeft, columns[column].left);
                                            columns[column].right = Math.max(cellRight, columns[column].right);
                                            columns[column].ratio += ratio;
                                            columns[column].count++;
                                            columns[column].mean_confidence = Math.max(candidate.mean_confidence, columns[column].mean_confidence);
                                        }
                                        lines[i].push({ "ratio": ratio, "column": column });
                                        columnOfPreviousCandidate = column;
                                    }
                                }
                            }
                        }
                        if (columns.length > 0) {
                            var bestColumnCandidate = -1;
                            var bestScore = -1;
                            var _loop_1 = function (column) {
                                var maxConfidence = columns[column].mean_confidence;
                                var meanRatio = columns[column].ratio / columns[column].count;
                                if (meanRatio >= minRatio && maxConfidence >= minConfidence) {
                                    var varianceRatio_1 = 0;
                                    lines.forEach(function (l) { return l.forEach(function (l2) {
                                        if (l2.column === column) {
                                            varianceRatio_1 += Math.pow(l2.ratio - meanRatio, 2);
                                        }
                                    }); });
                                    var score = varianceRatio_1 === 0 ? 999999 : maxConfidence / varianceRatio_1;
                                    if (score > minScore && varianceRatio_1 <= maxSTD && score > bestScore) {
                                        bestScore = score;
                                        bestColumnCandidate = column;
                                    }
                                }
                            };
                            // Determine best column
                            for (var column = 0; column < columns.length; column++) {
                                _loop_1(column);
                            }
                            // Update quantity objects
                            for (var i = 0; i < items.length; i++) {
                                var itm = items[i];
                                if (!itm.Quantity || bestScore === -1) {
                                    itm.Quantity = [];
                                }
                                else {
                                    var qtyCandidate = 0;
                                    while (qtyCandidate < itm.Quantity.length && qtyCandidate < lines[i].length && lines[i][qtyCandidate].column !== bestColumnCandidate) {
                                        qtyCandidate++;
                                    }
                                    itm.Quantity = qtyCandidate >= lines[i].length || itm.Quantity[qtyCandidate] === null ? [] : [itm.Quantity[qtyCandidate]];
                                }
                            }
                        }
                    }
                    return items;
                }
                PostProcessing.TrySelectColumnQuantity = TrySelectColumnQuantity;
                //Handle number starting with point
                function checkNumberStartingWithPoint(item) {
                    if (item && item.length > 0) {
                        var predictedValue = item[0];
                        if (predictedValue && (predictedValue.raw_text.startsWith(".") || predictedValue.raw_text.startsWith(","))) {
                            var value = predictedValue.raw_text.slice(1);
                            if (value.indexOf(".") === -1 && value.indexOf(",") === -1) {
                                predictedValue.parsed_value = predictedValue.raw_text;
                            }
                        }
                    }
                    return item;
                }
                function HandleNumberStartingWithPointInLine(items) {
                    if (items && items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            var line = items[i];
                            line.Amount = checkNumberStartingWithPoint(line.Amount);
                            line.Quantity = checkNumberStartingWithPoint(line.Quantity);
                            line.UnitPrice = checkNumberStartingWithPoint(line.UnitPrice);
                        }
                    }
                    return items;
                }
                PostProcessing.HandleNumberStartingWithPointInLine = HandleNumberStartingWithPointInLine;
                function SearchAndFillMissingColumns(table, returnedLines) {
                    var searchValue = "";
                    var regexpOrderNumber = Lib.AP.GetPatterns("OrderNumberPatterns");
                    if (regexpOrderNumber && regexpOrderNumber.length > 0) {
                        searchValue = "(".concat(regexpOrderNumber.join(")|("), ")");
                    }
                    var missingColumns = {
                        "OrderNumberExtracted__": searchValue,
                        "DeliveryNoteExtracted__": "(BL|DN|DO)[0-9]+"
                    };
                    var item;
                    for (var columnName in missingColumns) {
                        if (missingColumns[columnName].length > 0) {
                            var objectToExtractData = {
                                "keepCase": false,
                                "valueToSearch": missingColumns[columnName],
                                "type": "regexp"
                            };
                            var areasFound = Document.SearchString(objectToExtractData);
                            if (areasFound.length > 0) {
                                var columns = [];
                                for (var areaIdx = 0; areaIdx < areasFound.length; areaIdx++) {
                                    var cellLeft = areasFound[areaIdx].x;
                                    var cellRight = areasFound[areaIdx].x + areasFound[areaIdx].width;
                                    var column = PostProcessing.SelectColumnAtPosition(columns, cellLeft, cellRight);
                                    if (column === columns.length) {
                                        columns.push({
                                            left: cellLeft,
                                            right: cellRight,
                                            candidates: [areaIdx]
                                        });
                                    }
                                    else {
                                        columns[column].left = Math.min(cellLeft, columns[column].left);
                                        columns[column].right = Math.max(cellRight, columns[column].right);
                                        columns[column].candidates.push(areaIdx);
                                    }
                                }
                                var selectedColumn = 0;
                                // We choose the column with more elements
                                for (var c = 1; c < columns.length; c++) {
                                    if (columns[c].candidates.length > columns[selectedColumn].candidates.length) {
                                        selectedColumn = c;
                                    }
                                }
                                // We associate the token found on document and the table row
                                var selectedToken = -1;
                                for (var line = 0; line < returnedLines.length; line++) {
                                    var cIdx = selectedToken === -1 ? 0 : selectedToken;
                                    var candidates = columns[selectedColumn].candidates;
                                    var cLine = returnedLines[line];
                                    while (cIdx < candidates.length
                                        && (areasFound[candidates[cIdx]].page < cLine.ind_page.top
                                            || (areasFound[candidates[cIdx]].page === cLine.ind_page.top
                                                && cLine.top > (areasFound[candidates[cIdx]].y + (1.5 * areasFound[candidates[cIdx]].height))))) {
                                        cIdx++;
                                    }
                                    if (cIdx < candidates.length
                                        && ((areasFound[candidates[cIdx]].page < cLine.ind_page.bottom)
                                            || (areasFound[candidates[cIdx]].page === cLine.ind_page.bottom
                                                && (areasFound[candidates[cIdx]].y - (0.5 * areasFound[candidates[cIdx]].height)) < cLine.bottom))) {
                                        //Firstly, we choose the token on the line item
                                        selectedToken = cIdx;
                                    }
                                    else if (selectedToken !== cIdx - 1) {
                                        //Else, we choose the token just before the line item
                                        selectedToken = cIdx - 1;
                                    }
                                    if (-1 < selectedToken) {
                                        item = table.GetItem(line);
                                        item.SetValue(columnName, areasFound[columns[selectedColumn].candidates[selectedToken]]);
                                        item.SetComputedValueSource(columnName, "SynergyForInvoiceLineItem");
                                        selectedToken++;
                                    }
                                }
                            }
                        }
                    }
                }
                PostProcessing.SearchAndFillMissingColumns = SearchAndFillMissingColumns;
                function TryToFillReference(table, returnedLines) {
                    for (var line = 0; line < returnedLines.length; line++) {
                        if (returnedLines[line].Reference && returnedLines[line].Reference.length > 0) {
                            var predictedBox = returnedLines[line].Reference[0];
                            var reference = predictedBox.parsed_value;
                            var item = table.GetItem(line);
                            var orderNumber = item.GetValue("OrderNumberExtracted__");
                            if (reference !== orderNumber) {
                                var boxArea = Document.GetArea(parseInt(predictedBox.ind_page, 10), predictedBox.left, predictedBox.top, predictedBox.right - predictedBox.left, predictedBox.bottom - predictedBox.top);
                                item.SetValue("PartNumberExtracted__", boxArea, predictedBox.parsed_value);
                                item.SetComputedValueSource("PartNumberExtracted__", "SynergyForInvoiceLineItem");
                            }
                        }
                    }
                }
                PostProcessing.TryToFillReference = TryToFillReference;
            })(PostProcessing || (PostProcessing = {}));
            function SetValueAndArea(field, replaceCurrentValue) {
                var fieldToUpdate = "".concat(field, "__");
                if (replaceCurrentValue || Data.IsNullOrEmpty(fieldToUpdate)) {
                    var candidates = apiResult[field];
                    var bestCandidate = void 0;
                    if (candidates) {
                        bestCandidate = PostProcessing.TryGetBestCandidate(fieldToUpdate, candidates);
                        if (bestCandidate) {
                            var boxAreas = GetSynergyAreas(bestCandidate);
                            SetSynergyValue(bestCandidate, boxAreas, fieldToUpdate);
                        }
                    }
                    if (field === "InvoiceCurrency") {
                        if (bestCandidate) {
                            currency = bestCandidate.parsed_value;
                        }
                        else if (options.GetDefaultCurrency && typeof options.GetDefaultCurrency === "function") {
                            currency = options.GetDefaultCurrency();
                        }
                    }
                    if (field === "ExtractedNetAmount") {
                        bestExtractedNetAmount = bestCandidate;
                    }
                }
            }
            function TableIsEmpty(tableName) {
                var table = Data.GetTable(tableName);
                var nbLines = table.GetItemCount();
                var item;
                for (var i = 0; i < nbLines; i++) {
                    item = table.GetItem(i);
                    if (!item.IsNullOrEmpty("OrderNumberExtracted__")
                        || !item.IsNullOrEmpty("DeliveryNoteExtracted__")
                        || !item.IsNullOrEmpty("PartNumberExtracted__")
                        || !item.IsNullOrEmpty("UnitPriceExtracted__")
                        || !item.IsNullOrEmpty("QuantityExtracted__")
                        || !item.IsNullOrEmpty("AmountExtracted__")) {
                        return false;
                    }
                }
                return true;
            }
            function HighLightLine(tableLine, returnedLine) {
                var topArea = returnedLine.top;
                var bottomArea = returnedLine.bottom;
                var page = returnedLine.ind_page.top;
                if (returnedLine.Amount && returnedLine.Amount[0]) {
                    topArea = returnedLine.Amount[0].top;
                    bottomArea = returnedLine.Amount[0].bottom;
                    page = Number(returnedLine.Amount[0].ind_page);
                }
                var width = Document.GetPageResolutionX(returnedLine.ind_page.top);
                var height = bottomArea - topArea;
                var area = Document.GetArea(page, 0, topArea, width, height);
                tableLine.SetArea(area);
            }
            function FillCell(tableLine, columnName, returnedField) {
                if (returnedField) {
                    var predictedBox = returnedField[0];
                    if (predictedBox) {
                        var boxArea = Document.GetArea(parseInt(predictedBox.ind_page, 10), predictedBox.left, predictedBox.top, predictedBox.right - predictedBox.left, predictedBox.bottom - predictedBox.top);
                        tableLine.SetValue(columnName, boxArea, predictedBox.parsed_value);
                        tableLine.SetComputedValueSource(columnName, "SynergyForInvoiceLineItem");
                    }
                }
            }
            function SetValueAndAreaOnTable(tableName, replaceTable) {
                var tableToUpdate = "".concat(tableName, "__");
                if (replaceTable || TableIsEmpty(tableToUpdate)) {
                    if (apiResult.items) {
                        var returnedLines = apiResult.items;
                        returnedLines = PostProcessing.TryRemoveExtraLine(returnedLines);
                        returnedLines = PostProcessing.TrySelectColumnUnitPrice(returnedLines);
                        returnedLines = PostProcessing.TrySelectColumnQuantity(returnedLines);
                        returnedLines = PostProcessing.HandleNumberStartingWithPointInLine(returnedLines);
                        var tableItems = Data.GetTable(tableToUpdate);
                        tableItems.SetItemCount(0);
                        for (var _i = 0, returnedLines_1 = returnedLines; _i < returnedLines_1.length; _i++) {
                            var returnedLine = returnedLines_1[_i];
                            var newLine = tableItems.AddItem();
                            FillCell(newLine, "AmountExtracted__", returnedLine.Amount);
                            FillCell(newLine, "UnitPriceExtracted__", returnedLine.UnitPrice);
                            FillCell(newLine, "QuantityExtracted__", returnedLine.Quantity);
                            HighLightLine(newLine, returnedLine);
                        }
                        PostProcessing.SearchAndFillMissingColumns(tableItems, returnedLines);
                        PostProcessing.TryToFillReference(tableItems, returnedLines);
                    }
                    else {
                        Log.Warn("WebService did not return any data related to the line tems");
                    }
                }
                else {
                    Log.Info("The extracted line items table is not modified by SNN because the table is not empty");
                }
            }
            function SetRecognitionMethod() {
                var recognitionMethod = Data.GetValue("RecognitionMethod");
                if (recognitionMethod === "" || recognitionMethod === "FTR") {
                    Data.SetValue("RecognitionMethod", "SynergyNeuralNetwork");
                }
            }
            /**
            * FillHeaderFields
            * @param options Object
            * @param options.defaultCurrency string|function
            */
            function FillFormFields(opts) {
                options = opts || {};
                if (ExecuteAPI(options)) {
                    if (options.synergyNeuralNetworkHeader || !options.synergyNeuralNetworkLineItem) {
                        SetValueAndArea("InvoiceCurrency", false);
                        SetValueAndArea("ExtractedNetAmount", false);
                        SetValueAndArea("InvoiceAmount", false);
                        SetValueAndArea("InvoiceDate", false);
                        SetValueAndArea("InvoiceNumber", false);
                        SetRecognitionMethod();
                    }
                    if (options.synergyNeuralNetworkLineItem) {
                        SetValueAndAreaOnTable("ExtractedLineItems", false);
                    }
                    return true;
                }
                return false;
            }
            SynergyNeuralNetwork.FillFormFields = FillFormFields;
        })(SynergyNeuralNetwork = AP.SynergyNeuralNetwork || (AP.SynergyNeuralNetwork = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
