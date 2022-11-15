///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_FirstTimeRecognition_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Shipping library used to extract minimal data from the attached document",
  "require": [
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_LdapUtil",
    "Lib_Shipping_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_CrossCultural_V12.0.461.0",
    "Lib_CrossCultural_Amount_V12.0.461.0",
    "Lib_CrossCultural_Date_V12.0.461.0",
    "Lib_FirstTimeRecognition_EngineBase_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var FirstTimeRecognition;
        (function (FirstTimeRecognition) {
            var FTRDocument = /** @class */ (function () {
                function FTRDocument() {
                    this.docn = null;
                    this.headerFields = {};
                    this.pagesToBeIgnored = {};
                    this.pageIgnoreThreshold = 0;
                    this.spaceTolerance = 1.0;
                    this.headerFieldsAlignmentTolerance = 0;
                }
                FTRDocument.prototype.InitParameters = function (params) {
                    for (var name in params) {
                        if (Object.prototype.hasOwnProperty.call(params, name)) {
                            this[name] = params[name];
                        }
                    }
                };
                FTRDocument.prototype.Run = function () {
                    this.ParseAll();
                };
                // MFL20141016_1 - returning the whole set of candidates to allow check of candidates against database
                FTRDocument.prototype.GetHeaderFieldCandidates = function (name) {
                    return this.headerFields !== null && Object.prototype.hasOwnProperty.call(this.headerFields, name) ? this.headerFields[name].values : null;
                };
                FTRDocument.prototype.ParseAll = function () {
                    for (var headerFieldName in this.headerFields) {
                        if (Object.prototype.hasOwnProperty.call(this.headerFields, headerFieldName)) {
                            Lib.FirstTimeRecognition.EngineBase.DebugLog("\n\n### HEADER FIELD " + headerFieldName + " DETECTION ###\n");
                            // MFL20141016_1 - returning the whole set of candidates to allow check of candidates against database
                            this.headerFields[headerFieldName].values = this.FindNonDocumentNumber(this.headerFields[headerFieldName].ranges, this.headerFields[headerFieldName].exclusionRanges, this.headerFields[headerFieldName].mandatoryKeywords, this.headerFields[headerFieldName].exclusionKeywords, this.headerFields[headerFieldName].preferredKeywords, this.headerFields[headerFieldName].allPages);
                            this.headerFields[headerFieldName].value = this.headerFields[headerFieldName].values !== null ? this.headerFields[headerFieldName].values[0] : null;
                        }
                    }
                };
                // MFL20140819_2 Fixed typo prferredKeywords -> preferredKeywords
                // MFL20140819_3 Added ability to filter out candidates based on a list of mandatoryKeywords
                FTRDocument.prototype.FindNonDocumentNumber = function (validityRanges, exclusionRanges, mandatoryKeywords, exclusionKeywords, preferredKeywords, allPages) {
                    var nonDocumentNumberAreas = [];
                    function LogNonDocumentNumberAreas(step) {
                        if (Lib.FirstTimeRecognition.EngineBase._DEBUG_activated) {
                            for (var cndCnt = 0; cndCnt < nonDocumentNumberAreas.length; ++cndCnt) {
                                Lib.FirstTimeRecognition.EngineBase.DebugLogln("step: " + step + " " + nonDocumentNumberAreas[cndCnt].standardStringValue);
                            }
                        }
                    }
                    if (allPages) {
                        for (var page = 0; page < Document.GetPageCount(); page++) {
                            if (!this.ShouldIgnorePage(page)) {
                                nonDocumentNumberAreas = nonDocumentNumberAreas.concat(Lib.FirstTimeRecognition.EngineBase.CollectNonDocumentReferenceNumbersInArea(Document.GetArea(page), validityRanges));
                            }
                        }
                    }
                    else {
                        throw new Error("Not yet supported");
                    }
                    LogNonDocumentNumberAreas("Collection");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidatesPatternBased(nonDocumentNumberAreas, exclusionRanges, true);
                    LogNonDocumentNumberAreas("ExcludePattern");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidatesAreasBased(nonDocumentNumberAreas, this.docn !== null && this.docn.area !== null ? [this.docn.area] : null, true);
                    LogNonDocumentNumberAreas("ExcludeArea");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidatesContentBased(nonDocumentNumberAreas, this.docn !== null && this.docn.standardStringValue !== null ? [this.docn.standardStringValue] : null, true);
                    LogNonDocumentNumberAreas("ExcludeContent");
                    // MFL20140819_3 Added ability to filter out candidates based on a list of mandatoryKeywords
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.KeepCandidates(nonDocumentNumberAreas, mandatoryKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                    LogNonDocumentNumberAreas("Selection (mandatory)");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.ExcludeCandidates(nonDocumentNumberAreas, exclusionKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                    LogNonDocumentNumberAreas("Exclusion");
                    // MFL20140819_2 Fixed typo prferredKeywords -> preferredKeywords
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.PreferCandidates(nonDocumentNumberAreas, preferredKeywords, this.spaceTolerance, this.headerFieldsAlignmentTolerance, true);
                    LogNonDocumentNumberAreas("Selection (prefer)");
                    nonDocumentNumberAreas = Lib.FirstTimeRecognition.EngineBase.SortAreas(nonDocumentNumberAreas, Lib.FirstTimeRecognition.EngineBase.SortAlongReadingDirection, this.headerFieldsAlignmentTolerance, true, false);
                    LogNonDocumentNumberAreas("Sorting");
                    // MFL20141016_1 - returning the whole set of candidates to allow check of candidates against database
                    return nonDocumentNumberAreas.length > 0 ? nonDocumentNumberAreas : null;
                };
                // MFL20140919_1 - shouldIgnorePage: hasOwnProperty( xx ) instead of [xx] === null
                FTRDocument.prototype.ShouldIgnorePage = function (page) {
                    var pageAsStr = "" + page;
                    if (!Object.prototype.hasOwnProperty.call(this.pagesToBeIgnored, pageAsStr)) {
                        this.pagesToBeIgnored[pageAsStr] = this.pageIgnoreThreshold > 0 && Document.GetArea(page).toString().length > this.pageIgnoreThreshold;
                    }
                    return this.pagesToBeIgnored[pageAsStr];
                };
                return FTRDocument;
            }());
            function GetPatterns(fieldPatterns) {
                var patterns = Sys.Parameters.GetInstance("AP").GetParameter(fieldPatterns, "");
                if (patterns) {
                    return patterns.split(";");
                }
                return [];
            }
            function GetPagesToIgnore() {
                var pagesToIgnore = {};
                // Hack to ignore email covers (can happen in some implementations)
                var emailArea = Document.SearchString("Message Body (text):", 0, false, false);
                if (emailArea && emailArea.length > 0) {
                    pagesToIgnore["0"] = true;
                }
                return pagesToIgnore;
            }
            function GetOrderNumberExtractionSettings() {
                return {
                    ranges: GetPatterns("OrderNumberPatterns"),
                    allPages: true,
                    exclusionRanges: null,
                    mandatoryKeywords: null,
                    exclusionKeywords: ["fax", "phone", "^(?!best)tel"],
                    preferredKeywords: null,
                    value: null,
                    values: []
                };
            }
            function GetAvailableDocumentCultures() {
                var cultures = null;
                var availableDocumentCultures = Sys.Parameters.GetInstance("AP").GetParameter("AvailableDocumentCultures");
                if (availableDocumentCultures) {
                    cultures = availableDocumentCultures.replace(/ /g, "").split(",");
                }
                if (!cultures || cultures.length === 0) {
                    cultures = ["en-US", "en-GB", "fr-FR"];
                }
                return cultures;
            }
            function CleanOrderNumberCandidates(orderNumbersCandidates) {
                var candidateIdx = 0;
                // remove duplicates
                var orderNumbers = [];
                while (candidateIdx < orderNumbersCandidates.length) {
                    var orderNumberCandidate = orderNumbersCandidates[candidateIdx].standardStringValue;
                    if (orderNumberCandidate && orderNumbers.indexOf(orderNumberCandidate) === -1) {
                        orderNumbers.push(orderNumberCandidate);
                        var availableDocumentCultures = GetAvailableDocumentCultures();
                        for (var _i = 0, availableDocumentCultures_1 = availableDocumentCultures; _i < availableDocumentCultures_1.length; _i++) {
                            var culture = availableDocumentCultures_1[_i];
                            if (Sys.Helpers.String.ContainsFullWidthCharacters(orderNumberCandidate, culture)) {
                                var halfwidthCandidate = {
                                    area: orderNumbersCandidates[candidateIdx].area,
                                    standardStringValue: Sys.Helpers.String.ConvertFullWidthToHalfWidthCharacters(orderNumberCandidate, culture)
                                };
                                orderNumbersCandidates.splice(candidateIdx + 1, 0, halfwidthCandidate);
                                break;
                            }
                        }
                        candidateIdx++;
                    }
                    else {
                        orderNumbersCandidates.splice(candidateIdx, 1);
                    }
                }
                return orderNumbers;
            }
            function ReloadAPSettings() {
                Log.Info("[FirstTimeRecognition.ReloadAPSettings]");
                // the next line is executed if needed - we retrieve the parameters (order number patterns) from the AP settings table
                Sys.Parameters.GetInstance("AP").Reload("Default");
            }
            function ExtractOrderNumberCandidates() {
                Log.Info("[FirstTimeRecognition.ExtractOrderNumberCandidates]");
                var doc = new FTRDocument();
                doc.InitParameters({
                    pagesToBeIgnored: GetPagesToIgnore(),
                    pageIgnoreThreshold: 6500,
                    spaceTolerance: 0.9,
                    headerFieldsAlignmentTolerance: 0.3,
                    headerFields: { "OrderNumber": GetOrderNumberExtractionSettings() }
                });
                doc.Run();
                return doc.GetHeaderFieldCandidates("OrderNumber");
            }
            function ValidateOrderNumberCandidates(orderNumberCandidates) {
                Log.Info("[FirstTimeRecognition.ValidateOrderNumberCandidates]");
                var orderNumbers = [];
                if (orderNumberCandidates && orderNumberCandidates.length > 0) {
                    var orderNumbersToQuery = CleanOrderNumberCandidates(orderNumberCandidates);
                    // TODO: Add some filter (ignore canceled) ?
                    var filter = Sys.Helpers.LdapUtil.FilterOr(orderNumbersToQuery.map(function (orderNumber) { return Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber); })).toString();
                    Log.Info("[FirstTimeRecognition.ValidateOrderNumberCandidates] query purchase orders with filter: ".concat(filter));
                    var query = Process.CreateQuery();
                    query.SetSpecificTable("CDNAME#Purchase order V2");
                    query.SetFilter(filter);
                    query.AddAttribute("OrderNumber__");
                    if (query.MoveFirst()) {
                        for (var po = query.MoveNext(); po !== null; po = query.MoveNext()) {
                            var vars = po.GetUninheritedVars();
                            var orderNumber = vars.GetValue_String("OrderNumber__", 0);
                            // TODO: refilter ??
                            orderNumbers.push(orderNumber);
                        }
                    }
                    else if (query.GetLastError()) {
                        Log.Error("[FirstTimeRecognition.ValidateOrderNumberCandidates] error while requesting purchase orders, details: ".concat(query.GetLastErrorMessage()));
                        throw new ExtractionError();
                    }
                }
                if (orderNumbers.length === 0) {
                    Log.Warn("[FirstTimeRecognition.ValidateOrderNumberCandidates] No orderNumber found...");
                }
                return orderNumbers;
            }
            /// EXPORTS
            var ExtractionError = /** @class */ (function (_super) {
                __extends(ExtractionError, _super);
                function ExtractionError() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return ExtractionError;
            }(Sys.Helpers.Promise.HandledError));
            FirstTimeRecognition.ExtractionError = ExtractionError;
            function ExtractOrderNumbers() {
                Log.Info("[FirstTimeRecognition.ExtractOrderNumbers]");
                return Sys.Helpers.Promise.Resolve()
                    .Then(ReloadAPSettings)
                    .Then(ExtractOrderNumberCandidates)
                    .Then(ValidateOrderNumberCandidates)
                    .Catch(Sys.Helpers.Promise.HandledError.Catcher("FirstTimeRecognition.ExtractOrderNumbers", ExtractionError));
            }
            FirstTimeRecognition.ExtractOrderNumbers = ExtractOrderNumbers;
        })(FirstTimeRecognition = Shipping.FirstTimeRecognition || (Shipping.FirstTimeRecognition = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
