///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_AIForExpenses_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Expense common library used for AI",
  "require": [
    "Lib_Expense_V12.0.461.0",
    "Lib_Expense_LayoutManager_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_TechnicalData",
    "[Lib_Expense_Customization_Common]"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var AIForExpenses;
        (function (AIForExpenses) {
            var fillingExpense = false;
            var lastPredictions = null;
            var lastPredictionsInitialized = false;
            var lastFilledFields = [];
            var lastFilledFieldsInitialized = false;
            var lastSuggestedExpenseTypes = [];
            var lastSuggestedExpenseTypesInitialized = false;
            var lastPredictableDataMap = {};
            var lastPredictableDataMapInitialized = false;
            var confidenceThreshold = 0.9;
            var NO_FILLED_FIELDS = [];
            function HasDatePrediction(v) {
                return Sys.Helpers.IsPlainObject(v.date);
            }
            AIForExpenses.HasDatePrediction = HasDatePrediction;
            function HasVendorPrediction(v) {
                return Sys.Helpers.IsPlainObject(v.supplier);
            }
            AIForExpenses.HasVendorPrediction = HasVendorPrediction;
            function HasTotalPrediction(v) {
                return Sys.Helpers.IsPlainObject(v.total);
            }
            AIForExpenses.HasTotalPrediction = HasTotalPrediction;
            function HasMetaTypePrediction(v) {
                return Sys.Helpers.IsArray(v.type) && v.type.length > 0;
            }
            AIForExpenses.HasMetaTypePrediction = HasMetaTypePrediction;
            function HasTaxesPrediction(v) {
                return Sys.Helpers.IsArray(v.tax_perc) && Sys.Helpers.IsArray(v.tax_val) &&
                    v.tax_perc.length > 0 && v.tax_perc.length === v.tax_val.length;
            }
            AIForExpenses.HasTaxesPrediction = HasTaxesPrediction;
            function HasTotalAmountCurrencyPrediction(v) {
                return Sys.Helpers.IsArray(v.currency) && v.currency.length > 0;
            }
            AIForExpenses.HasTotalAmountCurrencyPrediction = HasTotalAmountCurrencyPrediction;
            // MetaType (ExpenseType) is a particular data and isn't considered as a standard predictable data.
            AIForExpenses.allPredictableData = ["TotalAmount", "Date", "Vendor", "Taxes", "TotalAmountCurrency"];
            /**
             * ENTRY POINTS TO FILL EXPENSE
             */
            function FillExpenseWithPredictions(predictionsJson) {
                Log.Info("[AIForExpenses] >> FillExpenseWithPredictions");
                if (fillingExpense) {
                    Log.Info("[AIForExpenses] << FillExpenseWithPredictions. Already filling.");
                    return Sys.Helpers.Promise.Resolve([]);
                }
                ForgetAll();
                fillingExpense = true;
                var filledFields = [];
                return ParsePredictionsJson(predictionsJson)
                    .Then(function () { return FillExpenseTypeWithPredictionsImpl(); })
                    .Then(function (fields) {
                    filledFields.push.apply(filledFields, fields);
                    filledFields.push.apply(filledFields, FillTotalAmountWithPredictionsImpl());
                })
                    .Then(function () {
                    filledFields.push.apply(filledFields, FillTotalAmountCurrencyWithPredictionsImpl());
                })
                    .Then(function () {
                    filledFields.push.apply(filledFields, FillDateWithPredictionsImpl());
                })
                    .Then(function () {
                    filledFields.push.apply(filledFields, FillVendorWithPredictionsImpl());
                })
                    .Then(function () {
                    filledFields.push.apply(filledFields, FillTaxesWithPredictionsImpl());
                })
                    .Catch(function (error) {
                    if (!(error instanceof Sys.Helpers.Promise.HandledError)) {
                        Log.Error("unexpected error: ".concat(error));
                    }
                })
                    .Then(function () {
                    SetLastFilledFields(filledFields);
                    fillingExpense = false;
                    Log.Info("[AIForExpenses] << FillExpenseWithPredictions: " + filledFields.join(","));
                    return filledFields;
                });
            }
            AIForExpenses.FillExpenseWithPredictions = FillExpenseWithPredictions;
            function FillExpenseWithLastPredictions() {
                Log.Info("[AIForExpenses] >> FillExpenseWithLastPredictions");
                if (fillingExpense) {
                    Log.Info("[AIForExpenses] << FillExpenseWithLastPredictions. Already filling.");
                    return NO_FILLED_FIELDS;
                }
                var filledFields = [];
                AIForExpenses.allPredictableData.forEach(function (dataName) {
                    if (IsPredictableDataWithLastPredictions(dataName)) {
                        var filler = predictableDataFillers[dataName];
                        filledFields.push.apply(filledFields, filler());
                    }
                });
                SetLastFilledFields(GetLastFilledFields().concat(filledFields));
                return filledFields;
            }
            AIForExpenses.FillExpenseWithLastPredictions = FillExpenseWithLastPredictions;
            /**
             * LAST PREDICTIONS
             */
            function GetLastPredictions() {
                if (!lastPredictionsInitialized) {
                    lastPredictionsInitialized = true;
                    try {
                        Log.Verbose("[AIForExpenses.GetLastPredictions] unserializing AIResult external var");
                        var predictionJson = Variable.GetValueAsString("AIResult");
                        var predictions = predictionJson ? JSON.parse(predictionJson) : null;
                        // ignore predictions if error - we serialized it to keep the last error result
                        lastPredictions = !(predictions === null || predictions === void 0 ? void 0 : predictions.error) ? predictions : null;
                    }
                    catch (e) {
                        Log.Error("[AIForExpenses.GetLastPredictions] Could not parse the AIResult predictions JSON: " + e);
                        lastPredictions = null;
                    }
                }
                return lastPredictions;
            }
            AIForExpenses.GetLastPredictions = GetLastPredictions;
            function ForgetAll() {
                lastPredictions = null;
                lastFilledFields = [];
                lastSuggestedExpenseTypes = [];
                lastPredictableDataMap = {};
                // serializing + Callbacks...
                SetLastPredictions(lastPredictions);
                SetLastFilledFields(lastFilledFields);
                SetLastSuggestedExpenseTypes(lastSuggestedExpenseTypes);
                SetLastPredictableDataMap(lastPredictableDataMap);
            }
            AIForExpenses.ForgetAll = ForgetAll;
            /**
             * LAST PREDICTABLE DATA
             */
            function IsPredictableDataWithLastPredictions(dataName) {
                return !!GetLastPredictableDataMap()[dataName];
            }
            AIForExpenses.IsPredictableDataWithLastPredictions = IsPredictableDataWithLastPredictions;
            function ForgetLastPredictionsForData(dataName) {
                SetPredictableDataWithLastPredictions(dataName, false);
            }
            AIForExpenses.ForgetLastPredictionsForData = ForgetLastPredictionsForData;
            /**
             * LAST FILLED FIELDS
             */
            function HasBeenFilledWithLastPredictions(fieldName) {
                fieldName = fieldName.toLowerCase();
                return !!Sys.Helpers.Array.Find(GetLastFilledFields(), function (filledFieldName) { return filledFieldName.toLowerCase() === fieldName; });
            }
            AIForExpenses.HasBeenFilledWithLastPredictions = HasBeenFilledWithLastPredictions;
            function GetLastFilledFields() {
                if (!lastFilledFieldsInitialized) {
                    lastFilledFieldsInitialized = true;
                    lastFilledFields = Sys.TechnicalData.GetValue("AIForExpenses.lastFilledFields") || [];
                }
                return lastFilledFields;
            }
            AIForExpenses.GetLastFilledFields = GetLastFilledFields;
            function NotifyFieldHasChanged(fieldName) {
                fieldName = fieldName.toLowerCase();
                var filledFields = GetLastFilledFields().filter(function (filledFieldName) { return filledFieldName.toLowerCase() !== fieldName; });
                SetLastFilledFields(filledFields);
            }
            AIForExpenses.NotifyFieldHasChanged = NotifyFieldHasChanged;
            AIForExpenses.OnLastFilledFieldsChanged = null;
            /**
             * LAST SUGGESTED EXPENSE TYPES
             */
            function GetLastSuggestedExpenseTypes() {
                if (!lastSuggestedExpenseTypesInitialized) {
                    lastSuggestedExpenseTypesInitialized = true;
                    lastSuggestedExpenseTypes = Sys.TechnicalData.GetValue("AIForExpenses.lastSuggestedExpenseTypes") || [];
                }
                return lastSuggestedExpenseTypes;
            }
            AIForExpenses.GetLastSuggestedExpenseTypes = GetLastSuggestedExpenseTypes;
            function ForgetLastSuggestedExpenseTypes() {
                SetLastSuggestedExpenseTypes([]);
            }
            AIForExpenses.ForgetLastSuggestedExpenseTypes = ForgetLastSuggestedExpenseTypes;
            AIForExpenses.OnLastSuggestedExpenseTypesChanged = null;
            /**
             * INTERNAL USE ONLY
             */
            function ResetLib() {
                fillingExpense = false;
                lastPredictions = null;
                lastPredictionsInitialized = false;
                lastFilledFields = [];
                lastFilledFieldsInitialized = false;
                lastSuggestedExpenseTypes = [];
                lastSuggestedExpenseTypesInitialized = false;
                lastPredictableDataMap = {};
                lastPredictableDataMapInitialized = false;
            }
            AIForExpenses.ResetLib = ResetLib;
            ///////////////////////////////////////////////////////////////////////////////////////////////////
            /// INTERNAL API
            ///////////////////////////////////////////////////////////////////////////////////////////////////
            function ParsePredictionsJson(predictionsJson) {
                Log.Info("[AIForExpenses] >> ParsePredictionsJson");
                var predictions = null;
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () {
                    if (predictionsJson) {
                        if (Sys.Helpers.IsString(predictionsJson)) {
                            try {
                                predictions = JSON.parse(predictionsJson);
                            }
                            catch (_a) {
                                Log.Error("Could not parse the prediction JSON: ".concat(predictionsJson));
                                throw new Sys.Helpers.Promise.HandledError();
                            }
                        }
                        else {
                            predictions = predictionsJson;
                        }
                        if (predictions.error) {
                            Log.Error("Error accessing AI server: ".concat(predictions.error));
                            throw new Sys.Helpers.Promise.HandledError();
                        }
                    }
                    else {
                        Log.Error("Empty AI predictions JSON");
                        throw new Sys.Helpers.Promise.HandledError();
                    }
                })
                    .Finally(function () { return SetLastPredictions(predictions); });
            }
            function SetLastPredictions(predictions) {
                // ignore predictions if error - we just need to serialize it
                lastPredictions = !(predictions === null || predictions === void 0 ? void 0 : predictions.error) ? predictions : null;
                lastPredictionsInitialized = true;
                var aiResult = "";
                if (predictions) {
                    try {
                        aiResult = JSON.stringify(predictions);
                    }
                    catch (_a) {
                        aiResult = predictions.toString();
                    }
                }
                Variable.SetValueAsString("AIResult", aiResult);
            }
            function SetLastFilledFields(fields) {
                lastFilledFields = Sys.Helpers.Array.GetDistinctArray(fields);
                lastFilledFieldsInitialized = true;
                Sys.TechnicalData.SetValue("AIForExpenses.lastFilledFields", lastFilledFields);
                try {
                    AIForExpenses.OnLastFilledFieldsChanged === null || AIForExpenses.OnLastFilledFieldsChanged === void 0 ? void 0 : AIForExpenses.OnLastFilledFieldsChanged();
                }
                catch (e) {
                    Log.Error("Unexpected error occured while calling OnLastFilledFieldsChanged: ".concat(e));
                }
            }
            function SetLastSuggestedExpenseTypes(expenseTypes) {
                lastSuggestedExpenseTypes = expenseTypes;
                lastSuggestedExpenseTypesInitialized = true;
                Sys.TechnicalData.SetValue("AIForExpenses.lastSuggestedExpenseTypes", expenseTypes);
                try {
                    AIForExpenses.OnLastSuggestedExpenseTypesChanged === null || AIForExpenses.OnLastSuggestedExpenseTypesChanged === void 0 ? void 0 : AIForExpenses.OnLastSuggestedExpenseTypesChanged();
                }
                catch (e) {
                    Log.Error("Unexpected error occured while calling OnLastSuggestedExpenseTypesChanged: ".concat(e));
                }
            }
            AIForExpenses.SetLastSuggestedExpenseTypes = SetLastSuggestedExpenseTypes;
            function SetPredictableDataWithLastPredictions(dataName, value) {
                var map = GetLastPredictableDataMap();
                map[dataName] = value;
                SetLastPredictableDataMap(map);
            }
            function GetLastPredictableDataMap() {
                if (!lastPredictableDataMapInitialized) {
                    lastPredictableDataMapInitialized = true;
                    lastPredictableDataMap = Sys.TechnicalData.GetValue("AIForExpenses.lastPredictableDataMap") || {};
                }
                return lastPredictableDataMap;
            }
            function SetLastPredictableDataMap(map) {
                lastPredictableDataMap = map;
                lastPredictableDataMapInitialized = true;
                Sys.TechnicalData.SetValue("AIForExpenses.lastPredictableDataMap", lastPredictableDataMap);
            }
            function FillExpenseTypeWithPredictionsImpl() {
                Log.Info("[AIForExpenses] >> FillExpenseTypeWithPredictionsImpl");
                var template = Lib.Expense.LayoutManager.GetTemplate();
                if (!template.fields.ExpenseType__ || template.fields.ExpenseType__.readonly) {
                    Log.Verbose("[AIForExpenses.FillExpenseTypeWithPredictionsImpl] ExpenseType__ field isn't editable");
                    return Sys.Helpers.Promise.Resolve(NO_FILLED_FIELDS);
                }
                var predictions = GetLastPredictions();
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () { return Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Common.GetExpenseTypeFromAIPredictions", predictions); })
                    .Then(function (expenseType) {
                    // eslint-disable-next-line no-nested-ternary
                    var expenseTypes = (expenseType ? Sys.Helpers.IsArray(expenseType) ? expenseType : [expenseType] : []);
                    // remove empty strings from list
                    expenseTypes = expenseTypes.filter(function (type) { return !Sys.Helpers.IsEmpty(type); });
                    if (expenseTypes.length > 0) {
                        if (expenseTypes.length === 1) {
                            Log.Verbose("[AIForExpenses.FillExpenseTypeWithPredictionsImpl] one expense type returned by the use exit");
                            return Lib.Expense.FindExpenseType({ name: expenseTypes[0] }).Then(SelectExpenseType);
                        }
                        Log.Verbose("[AIForExpenses.FillExpenseTypeWithPredictionsImpl] several expense types returned by the use exit");
                        SetLastSuggestedExpenseTypes(expenseTypes);
                        return NO_FILLED_FIELDS;
                    }
                    Log.Verbose("[AIForExpenses.FillExpenseTypeWithPredictionsImpl] no expense type returned by the user exit");
                    if (!HasMetaTypePrediction(predictions)) {
                        Log.Info("[AIForExpenses.FillExpenseTypeWithPredictionsImpl] no metatype prediction returned by AI");
                        return NO_FILLED_FIELDS;
                    }
                    var bestMetaTypePrediction = predictions.type[0];
                    var nextMetaTypePrediction = predictions.type[1];
                    if (bestMetaTypePrediction.confidence <= confidenceThreshold || nextMetaTypePrediction.confidence >= 0.1) {
                        Log.Info("[AIForExpenses.FillExpenseTypeWithPredictionsImpl] prediction does not reach the confidence level sufficient to be taken into account");
                        return NO_FILLED_FIELDS;
                    }
                    return Lib.Expense.FindExpenseType({ metaType: bestMetaTypePrediction.prediction }).Then(SelectExpenseType);
                });
            }
            function SelectExpenseType(expenseTypeItems) {
                Log.Info("[AIForExpenses] >> SelectExpenseType, expense type items found: ".concat(expenseTypeItems.length));
                if (expenseTypeItems.length === 0) {
                    Log.Verbose("[AIForExpenses.SelectExpenseType] no expense type matching the predicted metatype");
                    return NO_FILLED_FIELDS;
                }
                if (expenseTypeItems.length === 1) {
                    Log.Verbose("[AIForExpenses.SelectExpenseType] one expense type returned by our query");
                    Data.SetValue("ExpenseType__", expenseTypeItems[0].Name__);
                    Lib.Expense.OnSelectExpenseTypeItem(expenseTypeItems[0]);
                    return ["ExpenseType__"];
                }
                Log.Verbose("[AIForExpenses.SelectExpenseType] several expense types returned by our query");
                var expenseTypes = expenseTypeItems.map(function (item) { return item.Name__; });
                SetLastSuggestedExpenseTypes(expenseTypes);
                return NO_FILLED_FIELDS;
            }
            function FillTotalAmountWithPredictionsImpl() {
                Log.Info("[AIForExpenses] >> FillTotalAmountWithPredictionsImpl");
                var predictions = GetLastPredictions();
                if (HasTotalPrediction(predictions) && !Sys.Helpers.IsEmpty(predictions.total.prediction)) {
                    SetPredictableDataWithLastPredictions("TotalAmount", true);
                    var template = Lib.Expense.LayoutManager.GetTemplate();
                    if (template.fields.TotalAmount__ && !template.fields.TotalAmount__.readonly) {
                        Data.SetValue("TotalAmount__", predictions.total.prediction);
                        return ["TotalAmount__"];
                    }
                }
                return NO_FILLED_FIELDS;
            }
            function FillTotalAmountCurrencyWithPredictionsImpl() {
                Log.Info("[AIForExpenses] >> FillTotalAmountCurrencyWithPredictionsImpl");
                var predictions = GetLastPredictions();
                if (HasTotalAmountCurrencyPrediction(predictions)) {
                    SetPredictableDataWithLastPredictions("TotalAmountCurrency", true);
                    var template = Lib.Expense.LayoutManager.GetTemplate();
                    var currPrediction = predictions.currency[0];
                    if (template.fields.TotalAmountCurrency__ && !template.fields.TotalAmountCurrency__.readonly &&
                        currPrediction.prediction != "Unknown" && currPrediction.confidence >= confidenceThreshold) {
                        Lib.Expense.SetTotalAmountCurrency(true, null, currPrediction.prediction);
                        return ["TotalAmountCurrency__"];
                    }
                }
                return NO_FILLED_FIELDS;
            }
            function FillDateWithPredictionsImpl() {
                Log.Info("[AIForExpenses] >> FillDateWithPredictionsImpl");
                var predictions = GetLastPredictions();
                if (HasDatePrediction(predictions) && !Sys.Helpers.IsEmpty(predictions.date.prediction)) {
                    SetPredictableDataWithLastPredictions("Date", true);
                    var template = Lib.Expense.LayoutManager.GetTemplate();
                    if (template.fields.Date__ && !template.fields.Date__.readonly) {
                        Data.SetValue("Date__", predictions.date.prediction);
                        // For date-dependent custom exchange rate
                        if (Data.GetValue("Date__") && Data.GetValue("LocalCurrency__") !== Data.GetValue("TotalAmountCurrency__")) {
                            Lib.Expense.CheckCustomExchangeRate();
                        }
                        return ["Date__"];
                    }
                }
                return NO_FILLED_FIELDS;
            }
            function FillVendorWithPredictionsImpl() {
                Log.Info("[AIForExpenses] >> FillVendorWithPredictionsImpl");
                var predictions = GetLastPredictions();
                if (HasVendorPrediction(predictions) && !Sys.Helpers.IsEmpty(predictions.supplier.prediction)) {
                    SetPredictableDataWithLastPredictions("Vendor", true);
                    var template = Lib.Expense.LayoutManager.GetTemplate();
                    if (template.fields.Vendor__ && !template.fields.Vendor__.readonly) {
                        Data.SetValue("Vendor__", predictions.supplier.prediction);
                        return ["Vendor__"];
                    }
                }
                return NO_FILLED_FIELDS;
            }
            function FillTaxesWithPredictionsImpl() {
                Log.Info("[AIForExpenses] >> FillTaxesWithPredictionsImpl");
                var predictions = GetLastPredictions();
                if (HasTaxesPrediction(predictions)) {
                    SetPredictableDataWithLastPredictions("Taxes", true);
                    var taxRateToFieldIndex_1 = {};
                    for (var i = 1; i <= 5; i++) {
                        if (!Sys.Helpers.IsEmpty(Data.GetValue("TaxCode".concat(i, "__")))) {
                            var taxRate = parseFloat(Data.GetValue("TaxRate".concat(i, "__")));
                            taxRateToFieldIndex_1[taxRate] = i;
                        }
                        else {
                            break;
                        }
                    }
                    var modifiedTaxes_1 = [];
                    predictions.tax_perc.forEach(function (_a, idx) {
                        var taxPercPrediction = _a.prediction;
                        var fieldIdx = taxRateToFieldIndex_1[taxPercPrediction];
                        if (fieldIdx) {
                            var taxValPrediction = predictions.tax_val[idx].prediction;
                            var fieldName = "TaxAmount".concat(fieldIdx, "__");
                            Data.SetValue(fieldName, taxValPrediction);
                            modifiedTaxes_1.push(fieldName);
                        }
                    });
                    return modifiedTaxes_1;
                }
                return NO_FILLED_FIELDS;
            }
            var predictableDataFillers = {
                TotalAmount: FillTotalAmountWithPredictionsImpl,
                Date: FillDateWithPredictionsImpl,
                Vendor: FillVendorWithPredictionsImpl,
                Taxes: FillTaxesWithPredictionsImpl,
                TotalAmountCurrency: FillTotalAmountCurrencyWithPredictionsImpl
            };
        })(AIForExpenses = Expense.AIForExpenses || (Expense.AIForExpenses = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
