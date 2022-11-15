///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Budget_Management_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Budget management library",
  "require": [
    "Lib_Budget_Management_Common_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Sys/Sys_Helpers_CSVExport",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_CSVReader",
    "Sys/Sys_Helpers_Database",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_QueryIterator",
    "Sys/Sys_Helpers_TimeoutHelper"
  ]
}*/
var Lib;
(function (Lib) {
    var Budget;
    (function (Budget) {
        var Management;
        (function (Management) {
            var ERR_RIGHTDENIED = 84;
            var timeoutHelper = new Sys.Helpers.TimeoutHelper(400, 100);
            var budgetTable = "CT#" + Process.GetProcessID("PurchasingBudget__");
            function GenerateBackup(filters) {
                Log.Info("Generating the budget backup csv");
                return Sys.Helpers.Promise.Create(function (resolve) { return resolve(GetQueryIterator(filters)); })
                    .Then(BuildOutputCSV)
                    .Then(function (backupCSV) { return AttachCSVFile(backupCSV, "Budget_Backup", false, true); });
            }
            Management.GenerateBackup = GenerateBackup;
            function ImportCSV() {
                Log.Info("Importing the budget csv");
                // backup part
                return Sys.Helpers.Promise.Create(function (resolve) { return resolve(GetInputCSVReader()); })
                    .Then(GetBudgetsToBackup)
                    .Then(MakeFiltersFromBudgets)
                    .Then(GenerateBackup)
                    // import part
                    .Then(GetInputCSVReader)
                    .Then(GetImportIterator)
                    .Then(ImportBudgets)
                    .Then(AttachErrorCSVFileIfNeeded)
                    .Then(function (result) {
                    return {
                        msg: Language.Translate("_{0} budget line(s) successfully imported. Nb created: {1}, nb updated: {2}, nb upToDate: {3}, nb error: {4}", true, result.total, result.nbCreated, result.nbUpdated, result.nbUpToDate, result.nbError)
                    };
                })
                    .Catch(function (e) {
                    var error;
                    if (e instanceof BudgetManagementError) {
                        error = e;
                    }
                    else {
                        var errorDetails = e.message || e.toString();
                        error = new BudgetManagementError("Unexpected error when importing CSV. Details: ".concat(errorDetails), "_Unexpected error when importing CSV. Details: {0}", [errorDetails]);
                    }
                    Log.Error(error.internalMsg);
                    throw {
                        msg: Language.Translate("_Failed importing budget line(s)", true, error.clientMsg)
                    };
                });
            }
            Management.ImportCSV = ImportCSV;
            function Delete() {
                var fields = Lib.Budget.Management.Common.GetBudgetFields("Delete");
                var filter = Lib.Budget.Management.Common.MakeFilter(fields);
                // backup part
                return GenerateBackup([filter])
                    // deletion part
                    .Then(function () { return GetQueryIterator([filter]); })
                    .Then(function (queryIterator) {
                    Log.Info("Delete budget filter: " + filter);
                    var result = Sys.Helpers.Database.RemoveTableRecordByItr(queryIterator);
                    var msg;
                    if (result.nSuccess) {
                        msg = Language.Translate("_{0} budget line(s) successfully deleted.", true, result.nSuccess);
                        if (result.nError) {
                            msg += "\n" + Language.Translate("_Failed deleting {0} budget line(s):", true, result.nError);
                        }
                        result.msg = result.msg ? msg + "\n" + result.msg : msg;
                        return result;
                    }
                    msg = Language.Translate("_Failed deleting budget line(s):");
                    result.msg = result.msg ? msg + "\n" + result.msg : msg;
                    throw result;
                });
            }
            Management.Delete = Delete;
            function ExportCSV() {
                var fields = Lib.Budget.Management.Common.GetBudgetFields("Export");
                var filter = Lib.Budget.Management.Common.MakeFilter(fields);
                Log.Info("Export budget filter: " + filter);
                var nbExportedLines = 0;
                return Sys.Helpers.Promise.Create(function (resolve) { return resolve(GetQueryIterator([filter])); })
                    .Then(BuildOutputCSV)
                    .Then(function (exportCSV) {
                    nbExportedLines = exportCSV.GetNbLines();
                    return AttachCSVFile(exportCSV, "Budget_Export");
                })
                    .Then(function () {
                    var result = {};
                    result.msg = Language.Translate("_{0} budget line(s) successfully exported", true, nbExportedLines);
                    return Sys.Helpers.Promise.Resolve(result);
                })
                    .Catch(function (e) {
                    Log.Error(e);
                    throw {
                        msg: Language.Translate("_Failed exporting budget line(s)", true)
                    };
                });
            }
            Management.ExportCSV = ExportCSV;
            function Revise() {
                var fields = Lib.Budget.Management.Common.GetBudgetFields("Revise");
                var filter = Lib.Budget.Management.Common.MakeFilter(fields);
                // backup part
                return GenerateBackup([filter])
                    // revise part
                    .Then(function () {
                    Log.Info("Revise budget filter: " + filter);
                    var result = Sys.Helpers.Database.AddOrModifyTableRecord(budgetTable, filter, [{
                            name: "Budget__",
                            value: Data.GetValue("NewBudget__")
                        }]);
                    var msg;
                    if (result.nSuccess) {
                        msg = Language.Translate("_The budget line successfully revised.", true);
                        result.msg = result.msg ? msg + "\n" + result.msg : msg;
                        return Sys.Helpers.Promise.Resolve(result);
                    }
                    msg = Language.Translate("_Failed revising budget line:");
                    result.msg = result.msg ? msg + "\n" + result.msg : msg;
                    throw result;
                });
            }
            Management.Revise = Revise;
            function Close() {
                var fields = Lib.Budget.Management.Common.GetBudgetFields("Close");
                var filter = Lib.Budget.Management.Common.MakeFilter(fields);
                // backup part
                return GenerateBackup([filter])
                    // closing part
                    .Then(function () { return GetQueryIterator([filter]); })
                    .Then(function (queryIterator) {
                    Log.Info("Close budget filter: " + filter);
                    var result = Sys.Helpers.Database.AddOrModifyTableRecordByItr(queryIterator, budgetTable, [{
                            name: "Closed__",
                            value: 1
                        }]);
                    var msg;
                    if (result.nSuccess) {
                        msg = Language.Translate("_{0} budget line(s) successfully closed.", true, result.nSuccess);
                        if (result.nError) {
                            msg += "\n" + Language.Translate("_Failed closing {0} budget line(s):", true, result.nError);
                        }
                        result.msg = result.msg ? msg + "\n" + result.msg : msg;
                        return Sys.Helpers.Promise.Resolve(result);
                    }
                    msg = Language.Translate("_Failed closing budget lines:");
                    result.msg = result.msg ? msg + "\n" + result.msg : msg;
                    throw result;
                });
            }
            Management.Close = Close;
            /////////////
            var BudgetManagementError = /** @class */ (function (_super) {
                __extends(BudgetManagementError, _super);
                function BudgetManagementError(internalMsg, clientMsgKey, clientMsgParams) {
                    if (clientMsgParams === void 0) { clientMsgParams = null; }
                    var _this = _super.call(this) || this;
                    _this.internalMsg = internalMsg;
                    _this.clientMsgKey = clientMsgKey;
                    _this.clientMsgParams = clientMsgParams;
                    // Fix 'this instanceof BudgetManagementError'
                    // See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
                    Sys.Helpers.Object.SetPrototypeOf(_this, BudgetManagementError.prototype);
                    return _this;
                }
                Object.defineProperty(BudgetManagementError.prototype, "clientMsg", {
                    get: function () {
                        var translateArgs = [this.clientMsgKey, true].concat(this.clientMsgParams || []);
                        return Language.Translate.apply(Language, translateArgs);
                    },
                    enumerable: false,
                    configurable: true
                });
                return BudgetManagementError;
            }(Error));
            Management.BudgetManagementError = BudgetManagementError;
            var OwnerInfo = /** @class */ (function () {
                function OwnerInfo() {
                    this._userObj = null;
                }
                Object.defineProperty(OwnerInfo.prototype, "userObject", {
                    get: function () {
                        if (!this._userObj) {
                            this._userObj = Users.GetUser(Data.GetValue("OwnerId"));
                        }
                        return this._userObj;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(OwnerInfo.prototype, "culture", {
                    get: function () {
                        return this.userObject.GetValue("Culture") || "en-US";
                    },
                    enumerable: false,
                    configurable: true
                });
                return OwnerInfo;
            }());
            var ownerInfo = new OwnerInfo();
            function GetInputCSVReader() {
                Log.Info("Get the input CSV reader");
                // Read the first attachment "0" with the reader V2
                var csvReader = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                csvReader.ReturnSeparator = "\n";
                // read first line (Header line) and guess the separator
                csvReader.GuessSeparator();
                csvReader.headers = csvReader.GetHeadersObject();
                csvReader.headerIdxByName = {};
                csvReader.headers.forEach(function (name, idx) {
                    var normName = name
                        .toLowerCase()
                        .replace(/__$/, "");
                    csvReader.headerIdxByName[normName] = idx;
                });
                // wrap to be case insensitive
                csvReader.GetHeaderIndex = Sys.Helpers.Wrap(csvReader.GetHeaderIndex, function (originalFn, name) {
                    var normName = name
                        .toLowerCase()
                        .replace(/__$/, "");
                    var idx = csvReader.headerIdxByName[normName];
                    return Sys.Helpers.IsDefined(idx) ? idx : -1;
                });
                csvReader.GetFieldName = function (index) {
                    var fieldName = csvReader.headers[index];
                    if (!fieldName.endsWith("__")) {
                        fieldName += "__";
                    }
                    return fieldName;
                };
                csvReader.budgetIDHeaderIdx = csvReader.GetHeaderIndex("BudgetID__");
                if (csvReader.budgetIDHeaderIdx < 0) {
                    throw new BudgetManagementError("Column BudgetID__ must be defined in the CSV header", "_Column BudgetID__ must be defined in the CSV header");
                }
                return csvReader;
            }
            Management.GetInputCSVReader = GetInputCSVReader;
            function GetImportCSVLineCount(limit) {
                try {
                    var count_1 = 0;
                    var csvReader = GetInputCSVReader();
                    csvReader.ForEach(function () {
                        count_1++;
                    }, null, limit);
                    return count_1;
                }
                catch (e) {
                    return -1;
                }
            }
            Management.GetImportCSVLineCount = GetImportCSVLineCount;
            function GetBudgetsToBackup(csvReader) {
                Log.Info("Get budgets to backup");
                var budgetIDs = {};
                csvReader.ForEach(function () {
                    var lineArray = csvReader.GetCurrentLineArray();
                    var budgetID = lineArray[csvReader.budgetIDHeaderIdx];
                    if (budgetID) {
                        if (budgetID in budgetIDs) {
                            throw new BudgetManagementError("Several lines with the same BudgetID ".concat(budgetID), "_Several lines with the same BudgetID {0}", [budgetID]);
                        }
                        budgetIDs[budgetID] = true;
                    }
                    else {
                        var lineNumber = csvReader.GetCurrentLineNumber();
                        throw new BudgetManagementError("No budgetID found at line ".concat(lineNumber, " of the CSV"), "_No budgetID found at line {0} of the CSV", [lineNumber]);
                    }
                });
                return Object.keys(budgetIDs);
            }
            var nbIDPerFilter = 50;
            function MakeFiltersFromBudgets(budgetIDs) {
                Log.Info("Make filters from budgets, budgetID: from ".concat(budgetIDs[0], " to ").concat(budgetIDs[budgetIDs.length - 1]));
                var filters = []; // filter with max nbIDPerFilter IDs
                var filterParts = [];
                budgetIDs.forEach(function (budgetID) {
                    filterParts.push("(BudgetID__=" + budgetID + ")");
                    if (filterParts.length === nbIDPerFilter) {
                        filters.push("(|" + filterParts.join("") + ")");
                        filterParts = [];
                    }
                });
                if (filterParts.length > 0) {
                    filters.push("(|" + filterParts.join("") + ")");
                }
                return filters;
            }
            function GetQueryIterator(filters) {
                Log.Info("Getting the budget query iterator");
                var ctorQueryParams = new Sys.Helpers.QueryParams();
                ctorQueryParams.onTransport = false;
                ctorQueryParams.table = budgetTable;
                ctorQueryParams.attributes = ["*"];
                var idxFilter = 0;
                var nextQueryParamsFn = function () {
                    if (idxFilter < filters.length) {
                        var queryParams = new Sys.Helpers.QueryParams();
                        queryParams.filter = filters[idxFilter++];
                        return queryParams;
                    }
                    return null; // no more query
                };
                var queryIterator = new Sys.Helpers.BigQueryIterator(ctorQueryParams, nextQueryParamsFn, "Msn");
                queryIterator.timeoutHelper = timeoutHelper;
                return queryIterator;
            }
            function BuildOutputCSVHeader(vars) {
                // The order of the columns in the csv file is important
                Log.Info("Build CSV header");
                var header = [];
                header.push(Lib.Budget.Management.Common.StandardDBFields.CompanyCode, Lib.Budget.Management.Common.StandardDBFields.BudgetID, Lib.Budget.Management.Common.StandardDBFields.Description, Lib.Budget.Management.Common.StandardDBFields.PeriodCode);
                // Search assignment fields
                var count = vars.GetNbAttributes();
                for (var i = 0; i < count; i++) {
                    var name = vars.GetAttribute(i);
                    // only custom fields
                    if (name.endsWith("__")) {
                        // ignore built-in fields
                        if (!SmartContains(Lib.Budget.Management.Common.StandardDBFields, name) &&
                            !SmartContains(Lib.Budget.Management.Common.StepDBFields, name) &&
                            !SmartContains(Lib.Budget.Management.Common.LowBudgetExperimentalDBFields, name)) {
                            header.push(name);
                        }
                    }
                }
                header.push(Lib.Budget.Management.Common.StandardDBFields.Budget);
                Sys.Helpers.Object.ForEach(Lib.Budget.Management.Common.StepDBFields, function (fieldname) { return header.push(fieldname); });
                header.push(Lib.Budget.Management.Common.StandardDBFields.Closed);
                Log.Info("EnableLowBudgetNotification = ".concat(Sys.Parameters.GetInstance("P2P").GetParameter("EnableLowBudgetNotification")));
                if (Sys.Parameters.GetInstance("P2P").GetParameter("EnableLowBudgetNotification") === "1") {
                    Sys.Helpers.Object.ForEach(Lib.Budget.Management.Common.LowBudgetExperimentalDBFields, function (fieldname) { return header.push(fieldname); });
                }
                return header;
            }
            function BuildOutputCSV(queryIterator) {
                Log.Info("Build CSV from filtered budgets");
                var buildHeader = true;
                var outputCSV = new Sys.Helpers.CSVExport.OutputCSV();
                queryIterator.ForEach(function (record) {
                    var vars = record.GetVars();
                    if (buildHeader) {
                        buildHeader = false;
                        outputCSV.SetHeader(BuildOutputCSVHeader(vars));
                    }
                    var dataLine = outputCSV.GetHeader().map(function (name) {
                        var type = typedBudgetTable.GetFieldType(name);
                        if (type === "DECIMAL") {
                            var value = vars.GetValue_Double(name, 0);
                            var formattedValue = Sys.Helpers.String.FormatNumber(value, ownerInfo.culture, 2);
                            // standard spaces -> no-break spaces (0xA0, 0x202F, ...)
                            formattedValue = formattedValue.replace(/\s/g, " ");
                            return formattedValue;
                        }
                        return vars.GetValue_String(name, 0);
                    });
                    outputCSV.AddLine(dataLine);
                });
                if (queryIterator.query && queryIterator.query.GetLastError()) {
                    throw new Error("Error in database during the build of csv. Details: ".concat(queryIterator.query.GetLastErrorMessage()));
                }
                return outputCSV;
            }
            var csvFileTimestamp = new Date();
            function AttachCSVFile(outputCSV, filename, attachEmptyFile, actionNameInFilename) {
                if (attachEmptyFile === void 0) { attachEmptyFile = true; }
                if (actionNameInFilename === void 0) { actionNameInFilename = false; }
                if (actionNameInFilename) {
                    filename += "_".concat(Data.GetActionName());
                }
                filename += Sys.Helpers.Date.Format(csvFileTimestamp, "_yyyy-mm-dd_HH-MM-ss");
                outputCSV.AttachCSVFile(filename, attachEmptyFile);
            }
            function GetNextBudgetsToImportFromCSV(csvReader) {
                var budgets = {};
                for (var i = 0; i < nbIDPerFilter; i++) {
                    var line = csvReader.GetNextLine();
                    if (!line) {
                        break;
                    }
                    var lineArray = csvReader.GetCurrentLineArray();
                    var budgetID = lineArray[csvReader.budgetIDHeaderIdx];
                    budgets[budgetID] = lineArray;
                }
                return Sys.Helpers.Object.IsEmptyPlainObject(budgets) ? null : budgets;
            }
            var ImportIterator = /** @class */ (function () {
                function ImportIterator(_queryIterator, csvReader) {
                    this._queryIterator = _queryIterator;
                    this.csvReader = csvReader;
                    this._budgetsToImport = null;
                    this._currentForEachCallback = null;
                }
                ImportIterator.prototype.OnNewBudgetsToImport = function (budgetsToImport) {
                    var _this = this;
                    // create all remaining budgets
                    if (this._budgetsToImport && this._currentForEachCallback) {
                        Sys.Helpers.Object.ForEach(this._budgetsToImport, function (budgetCSVData, budgetID) { return _this._currentForEachCallback(budgetID, budgetCSVData, null); });
                    }
                    this._budgetsToImport = budgetsToImport;
                };
                ImportIterator.prototype.ForEach = function (callback) {
                    var _this = this;
                    this._currentForEachCallback = callback;
                    this._queryIterator.ForEach(function (budgetRecord) {
                        var vars = budgetRecord.GetVars();
                        var budgetID = vars.GetValue_String("BudgetID__", 0);
                        // get info to update and remove it from map
                        var budgetCSVData = _this._budgetsToImport[budgetID];
                        delete _this._budgetsToImport[budgetID];
                        _this._currentForEachCallback(budgetID, budgetCSVData, budgetRecord);
                    });
                    if (this._queryIterator.query && this._queryIterator.query.GetLastError()) {
                        throw new Error("Error in database during the budgets import. Details: ".concat(this._queryIterator.query.GetLastErrorMessage()));
                    }
                };
                return ImportIterator;
            }());
            function GetImportIterator(csvReader) {
                Log.Info("Getting the budget import iterator");
                var ctorQueryParams = new Sys.Helpers.QueryParams();
                ctorQueryParams.onTransport = false;
                ctorQueryParams.table = budgetTable;
                ctorQueryParams.attributes = ["*"];
                var nextQueryParamsFn = function () {
                    var budgetsToImport = GetNextBudgetsToImportFromCSV(csvReader);
                    importIterator.OnNewBudgetsToImport(budgetsToImport);
                    if (budgetsToImport !== null) {
                        var queryParams = new Sys.Helpers.QueryParams();
                        var budgetIDs = Object.keys(budgetsToImport);
                        // only one filter returned
                        queryParams.filter = MakeFiltersFromBudgets(budgetIDs)[0];
                        return queryParams;
                    }
                    return null; // no more query
                };
                var queryIterator = new Sys.Helpers.ParametrizedQueryIterator(ctorQueryParams, nextQueryParamsFn);
                var importIterator = new ImportIterator(queryIterator, csvReader);
                return importIterator;
            }
            Management.GetImportIterator = GetImportIterator;
            var ImportBudgetsResult = /** @class */ (function () {
                function ImportBudgetsResult() {
                    this.total = 0;
                    this.nbUpdated = 0;
                    this.nbCreated = 0;
                    this.nbUpToDate = 0;
                    this.nbError = 0;
                    this.errorCSV = null;
                }
                ImportBudgetsResult.prototype.InitErrorCSV = function (inputCSVHeader) {
                    this.errorCSV = new Sys.Helpers.CSVExport.OutputCSV();
                    this.errorCSV.SetHeader(inputCSVHeader.slice().concat(["##ERROR##"]));
                };
                ImportBudgetsResult.prototype.AddError = function (budgetCSVData, error) {
                    var lineInError = budgetCSVData.slice();
                    lineInError.push(error);
                    this.errorCSV.AddLine(lineInError);
                    this.nbError++;
                };
                return ImportBudgetsResult;
            }());
            var FastTypedProcess = /** @class */ (function () {
                function FastTypedProcess(processName) {
                    this._process = null;
                    this._processInitialized = false;
                    this._fieldTypeCache = {};
                    this.processName = processName;
                }
                FastTypedProcess.prototype.GetFieldType = function (fieldName) {
                    var fieldType = "UNKNOWN"; // default
                    var process = this.GetProcess();
                    if (process) {
                        var cachedFieldType = this._fieldTypeCache[fieldName];
                        if (!cachedFieldType) {
                            var field = process.GetFieldByName(fieldName);
                            if (field) {
                                fieldType = field.type;
                            }
                            else {
                                Log.Warn("Cannot find the field properties of ".concat(fieldName));
                            }
                            this._fieldTypeCache[fieldName] = fieldType;
                        }
                        else {
                            fieldType = cachedFieldType;
                        }
                    }
                    return fieldType;
                };
                FastTypedProcess.prototype.GetProcess = function () {
                    if (!this._processInitialized) {
                        this._processInitialized = true;
                        this._process = Process.GetProcessDefinition(this.processName);
                        if (!this._process) {
                            Log.Warn("Cannot find the process definition of ".concat(this.processName));
                        }
                    }
                    return this._process;
                };
                return FastTypedProcess;
            }());
            var typedBudgetTable = new FastTypedProcess("PurchasingBudget__");
            function ImportBudgets(importIterator) {
                Log.Info("Iterating budgets to import");
                var result = new ImportBudgetsResult();
                result.InitErrorCSV(importIterator.csvReader.headers);
                var lastCompanyCode;
                var lastConfiguration;
                var companyCodeColumnIdx = importIterator.csvReader.GetHeaderIndex(Lib.Budget.Management.Common.StandardDBFields.CompanyCode);
                importIterator.ForEach(function (budgetID, budgetCSVData, budgetRecord) {
                    try {
                        var newRecord_1 = !budgetRecord;
                        result.total++;
                        // Load the correct configuration for budgetKeyColumn and crossSectionalBudgetLine param
                        // Server side : promises are synchrone
                        var currentCompanyCode = budgetCSVData[companyCodeColumnIdx];
                        if (currentCompanyCode !== lastCompanyCode) {
                            lastCompanyCode = currentCompanyCode;
                            Lib.P2P.CompanyCodesValue.QueryValues(currentCompanyCode, false)
                                .Then(function (CCValues) {
                                if (CCValues && CCValues.DefaultConfiguration__ !== lastConfiguration) {
                                    lastConfiguration = CCValues.DefaultConfiguration__;
                                    Sys.Parameters.GetInstance("PAC").Reload(CCValues.DefaultConfiguration__);
                                }
                            });
                        }
                        // Create new record if needed
                        if (newRecord_1) {
                            CheckBudgetIDLength(importIterator, budgetCSVData);
                            // check if any record with the same key column values exists
                            CheckBudgetKeyUnicity(importIterator, budgetCSVData);
                            budgetRecord = Process.CreateTableRecord(budgetTable);
                            if (!budgetRecord) {
                                throw new BudgetManagementError("Failed to create budget with ID: ".concat(budgetID, ". Details: CreateTableRecord returns null"), "_CSV_Cannot create new record in table PurchasingBudget__");
                            }
                        }
                        else {
                            CheckBudgetKeyIntegrity(importIterator, budgetCSVData, budgetRecord);
                        }
                        var vars_1 = budgetRecord.GetVars();
                        var mandatoryStdFieldCount_1 = 0;
                        var upToDate_1 = true;
                        budgetCSVData.forEach(function (value, idx) {
                            var name = importIterator.csvReader.GetFieldName(idx);
                            var mandatoryStdField = SmartContains(Lib.Budget.Management.Common.MandatoryStdFields, name);
                            if (mandatoryStdField && !Sys.Helpers.IsEmpty(value)) {
                                mandatoryStdFieldCount_1++;
                            }
                            // ignore step fields
                            var fieldToAdd = mandatoryStdField || !SmartContains(Lib.Budget.Management.Common.StepDBFields, name);
                            if (fieldToAdd) {
                                var type = typedBudgetTable.GetFieldType(name);
                                if (type !== "UNKNOWN") {
                                    var valueToAdd = value;
                                    var addValueFnName = "AddValue_String";
                                    if ((Sys.Helpers.IsEmpty(valueToAdd) || valueToAdd == "0") && name in Lib.Budget.Management.Common.DefaultValues) {
                                        valueToAdd = Lib.Budget.Management.Common.DefaultValues[name];
                                    }
                                    if (type === "DECIMAL") {
                                        // standard spaces -> no-break spaces (0xA0, 0x202F, ...)
                                        value = value.replace(/\s/g, " ");
                                        var parseNumberResult = Sys.Helpers.String.ParseNumber(value, ownerInfo.culture);
                                        if (parseNumberResult === null) {
                                            throw new BudgetManagementError("Unexpected formatted number for budget with ID: ".concat(budgetID, ", number: ").concat(value, ", with culture: ").concat(ownerInfo.culture), "_CSV_Cannot parse number '{0}' with culture '{1}'", [value, ownerInfo.culture]);
                                        }
                                        valueToAdd = parseNumberResult.value;
                                        addValueFnName = "AddValue_Double";
                                    }
                                    else if (type == "BOOL") {
                                        if (Sys.Helpers.IsEmpty(valueToAdd)) {
                                            valueToAdd = "0"; // False by default, avoid NULL values in booleans
                                        }
                                    }
                                    // check UpToDate if needed
                                    if (!newRecord_1 && upToDate_1) {
                                        if (type === "DECIMAL") {
                                            upToDate_1 = vars_1.GetValue_Double(name, 0) == valueToAdd;
                                        }
                                        else {
                                            upToDate_1 = vars_1.GetValue_String(name, 0) == valueToAdd;
                                        }
                                    }
                                    vars_1[addValueFnName](name, valueToAdd, true);
                                }
                            }
                        });
                        if (newRecord_1) {
                            if (mandatoryStdFieldCount_1 !== Lib.Budget.Management.Common.MandatoryStdFields.length) {
                                var strMandatoryFields = Lib.Budget.Management.Common.MandatoryStdFields.join(",");
                                throw new BudgetManagementError("Some standard fields are missing to create budget with ID: ".concat(budgetID, ", mandatory fields: ").concat(strMandatoryFields), "_CSV_Missing mandatory fields to create new budget");
                            }
                        }
                        if (newRecord_1 || !upToDate_1) {
                            budgetRecord.Commit();
                            var lastErrorCode = budgetRecord.GetLastError();
                            if (lastErrorCode) {
                                var lastErrorMsg = budgetRecord.GetLastErrorMessage();
                                if (lastErrorCode === ERR_RIGHTDENIED) {
                                    throw new BudgetManagementError("Failed to save budget with ID: ".concat(budgetID, ". Details: ").concat(lastErrorMsg), "_CSV_Insufficient rights on budget");
                                }
                                else {
                                    throw new BudgetManagementError("Failed to ".concat(newRecord_1 ? "create" : "update", " budget with ID: ").concat(budgetID, ". Details: ").concat(lastErrorMsg), "_CSV_Cannot ".concat(newRecord_1 ? "create" : "update", " record. Details: {0}"), [lastErrorMsg]);
                                }
                            }
                        }
                        if (newRecord_1) {
                            result.nbCreated++;
                        }
                        else if (upToDate_1) {
                            result.nbUpToDate++;
                        }
                        else {
                            result.nbUpdated++;
                        }
                    }
                    catch (e) {
                        var error = void 0;
                        if (e instanceof BudgetManagementError) {
                            error = e;
                        }
                        else {
                            var errorDetails = e.message || e.toString();
                            error = new BudgetManagementError("Unexpected error on budget with ID: ".concat(budgetID, ". Details: ").concat(errorDetails), "_CSV_Unexpected error on budget. Details: {0}", [errorDetails]);
                        }
                        Log.Error(error.internalMsg);
                        result.AddError(budgetCSVData, error.clientMsg);
                    }
                    timeoutHelper.NotifyIteration();
                });
                return result;
            }
            function CheckBudgetIDLength(importIterator, budgetCSVData) {
                var budgetID = budgetCSVData[importIterator.csvReader.budgetIDHeaderIdx];
                if (budgetID.length > 128) {
                    throw new BudgetManagementError("The BudgetID ".concat(budgetID, " is too long"), "_CSV_The BudgetID {0} is too long", [budgetID]);
                }
            }
            Management.CheckBudgetIDLength = CheckBudgetIDLength;
            function CheckBudgetKeyUnicity(importIterator, budgetCSVData) {
                var _a;
                var crossSectionalBudgetLineIsDisabled = Lib.P2P.IsCrossSectionalBudgetLineDisabled();
                var andFilterArray = [];
                var budgetKeyColumns = Lib.P2P.GetBudgetKeyColumns();
                budgetKeyColumns.forEach(function (column) {
                    var val = "";
                    var columnIdx = importIterator.csvReader.GetHeaderIndex(column);
                    if (columnIdx !== -1) {
                        val = budgetCSVData[columnIdx] || "";
                    }
                    if (crossSectionalBudgetLineIsDisabled) {
                        if (val) {
                            andFilterArray.push(Sys.Helpers.LdapUtil.FilterStrictEqual(column, val));
                        }
                        else {
                            andFilterArray.push(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterNotExist(column), Sys.Helpers.LdapUtil.FilterStrictEqual(column, "")));
                        }
                    }
                    else if (val) {
                        andFilterArray.push(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterStrictEqual(column, val), Sys.Helpers.LdapUtil.FilterNotExist(column), Sys.Helpers.LdapUtil.FilterStrictEqual(column, "")));
                    }
                    // else -> column as wildcard -> check any value -> no filter this column
                });
                var filter = (_a = Sys.Helpers.LdapUtil).FilterAnd.apply(_a, andFilterArray).toString();
                Sys.GenericAPI.Query(budgetTable, filter, ["BudgetID__"], function (records, error) {
                    if (error) {
                        throw new Error("Error occurred while checking the budget key unicity. Details: ".concat(error));
                    }
                    if (records.length > 0) {
                        var newBudgetID = budgetCSVData[importIterator.csvReader.budgetIDHeaderIdx];
                        var budgetList = records.map(function (record) { return record.BudgetID__; }).join(", ");
                        throw new BudgetManagementError("Budget key conflict detected, new budget: ".concat(newBudgetID, ", existing budget(s): ").concat(budgetList), "_CSV_Budget key conflict detected, new budget: {0}, existing budget(s): {1}", [newBudgetID, budgetList]);
                    }
                }, "", 100);
            }
            Management.CheckBudgetKeyUnicity = CheckBudgetKeyUnicity;
            function CheckBudgetKeyIntegrity(importIterator, budgetCSVData, budgetRecord) {
                var modifiedColumns = [];
                var vars = budgetRecord.GetVars();
                var budgetKeysColumns = Lib.P2P.GetBudgetKeyColumns();
                budgetKeysColumns.forEach(function (column) {
                    // On update these fields are not mandatory...
                    var columnIdx = importIterator.csvReader.GetHeaderIndex(column);
                    if (columnIdx !== -1) {
                        // we consider any columns composing the budget keys are invariant culture and can be compared as string
                        var fieldName = importIterator.csvReader.GetFieldName(columnIdx);
                        var recordVal = vars.GetValue_String(fieldName, 0) || "";
                        var csvDataVal = budgetCSVData[columnIdx] || "";
                        if (recordVal !== csvDataVal) {
                            modifiedColumns.push({
                                column: column,
                                recordVal: recordVal,
                                csvDataVal: csvDataVal
                            });
                        }
                    }
                });
                if (modifiedColumns.length > 0) {
                    var msgDetails = modifiedColumns
                        .map(function (info) { return "".concat(info.column, ": ").concat(info.recordVal, " != ").concat(info.csvDataVal); })
                        .join("; ");
                    throw new BudgetManagementError("Some columns composing the budget keys '".concat(vars.GetValue_String("BudgetID__", 0), "' have been modified. Details: ").concat(msgDetails), "_CSV_Cannot modify a budget key column when updating budget. Details: {0}", [msgDetails]);
                }
            }
            function AttachErrorCSVFileIfNeeded(result) {
                if (result.nbError > 0) {
                    AttachCSVFile(result.errorCSV, "Budget_Errors");
                }
                return result;
            }
            function SmartContains(list, key) {
                list = Sys.Helpers.IsArray(list) ? list : Object.keys(list);
                key = key
                    .toLowerCase()
                    .replace(/__$/, "");
                return list.some(function (listKey) {
                    listKey = listKey
                        .toLowerCase()
                        .replace(/__$/, "");
                    return listKey === key;
                });
            }
        })(Management = Budget.Management || (Budget.Management = {}));
    })(Budget = Lib.Budget || (Lib.Budget = {}));
})(Lib || (Lib = {}));
