/* LIB_DEFINITION{
  "name": "Lib_FlexibleFormToJSON_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Lib_FlexibleFormToJSON",
  "require": [
    "Lib_V12.0.461.0",
    "Sys/Sys_Helpers_Date"
  ]
}*/
/**
 * Flexible form - JSON serializer, deserializer and checker
 * @namespace Lib.FlexibleFormToJSON
 */
var Lib;
(function (Lib) {
    var FlexibleFormToJSON;
    (function (FlexibleFormToJSON) {
        /**
         * Flexible form - JSON serializer
         * @namespace Lib.FlexibleFormToJSON.Serializer
         */
        var Serializer;
        (function (Serializer) {
            var _fieldsMapping = {};
            var _tableColumnsMapping = {};
            var _json;
            function GetMappingsTableName(tableName, restrictResultToMappingOnly) {
                if (_tableColumnsMapping[tableName]) {
                    var mappings = _tableColumnsMapping[tableName].Name;
                    if (typeof mappings !== "undefined") {
                        return mappings;
                    }
                }
                if (restrictResultToMappingOnly) {
                    return null;
                }
                // By default, return same table name
                return tableName;
            }
            function GetMappingsTableColumnNameList(tableName, columnName, restrictResultToMappingOnly) {
                var mappingsTableName = _tableColumnsMapping[tableName];
                if (typeof mappingsTableName === "undefined") { // By default, return same columnName name if restrictResultToMappingOnly is false
                    if (restrictResultToMappingOnly) {
                        return null;
                    }
                    return [columnName];
                }
                var mappingsColumnName = _tableColumnsMapping[tableName].Columns[columnName];
                if (typeof mappingsColumnName === "undefined") {
                    if (restrictResultToMappingOnly) {
                        return null;
                    }
                    return [columnName];
                }
                return mappingsColumnName;
            }
            function InitJSON() {
                _json = { "flexible": { "fields": {}, "tables": {} } };
            }
            Serializer.InitJSON = InitJSON;
            function ComputeFields(restrictResultToMappingOnly) {
                _json.flexible.fields = GetFields(restrictResultToMappingOnly);
            }
            Serializer.ComputeFields = ComputeFields;
            function ComputeTables(restrictResultToMappingOnly) {
                _json.flexible.tables = GetTables(restrictResultToMappingOnly);
            }
            Serializer.ComputeTables = ComputeTables;
            function GetMappingsFieldsList(fieldName, restrictResultToMappingOnly) {
                var mappings = _fieldsMapping[fieldName];
                if (typeof mappings === "undefined") { // By default, return same field name if restrictResultToMappingOnly is false
                    if (restrictResultToMappingOnly) {
                        return null;
                    }
                    return [fieldName];
                }
                return mappings;
            }
            Serializer.GetMappingsFieldsList = GetMappingsFieldsList;
            function GetFields(restrictResultToMappingOnly) {
                var fieldObj = {};
                for (var i = 0; i < Data.GetNbFields(); i++) {
                    var fieldName = Data.GetFieldName(i);
                    var value = Data.GetValue(fieldName);
                    if (value) {
                        var mappings = GetMappingsFieldsList(fieldName, restrictResultToMappingOnly);
                        if (mappings) {
                            for (var _i = 0, mappings_1 = mappings; _i < mappings_1.length; _i++) {
                                var mapping = mappings_1[_i];
                                fieldObj[mapping] = value;
                            }
                        }
                    }
                }
                return fieldObj;
            }
            Serializer.GetFields = GetFields;
            function GetTables(restrictResultToMappingOnly) {
                var tablesObj = {};
                for (var i = 0; i < Data.GetNbTables(); i++) {
                    var tableName = Data.GetTableName(i);
                    var mappingsTableName = GetMappingsTableName(tableName, restrictResultToMappingOnly);
                    if (mappingsTableName) {
                        tablesObj[mappingsTableName] = GetTable(tableName, restrictResultToMappingOnly);
                    }
                }
                return tablesObj;
            }
            Serializer.GetTables = GetTables;
            function GetTable(tableName, restrictResultToMappingOnly) {
                var table = Data.GetTable(tableName);
                var tableObj = Array();
                // Adds each item
                for (var itemIdx = 0; itemIdx < table.GetItemCount(); itemIdx++) {
                    var item = table.GetItem(itemIdx);
                    var itemObj = {};
                    for (var colIdx = 0; colIdx < Data.GetNbColumns(tableName); colIdx++) {
                        var columnName = Data.GetColumnName(tableName, colIdx);
                        var mappedColumnNames = GetMappingsTableColumnNameList(tableName, columnName, restrictResultToMappingOnly);
                        if (mappedColumnNames) {
                            for (var _i = 0, mappedColumnNames_1 = mappedColumnNames; _i < mappedColumnNames_1.length; _i++) {
                                var MappedcolumnName = mappedColumnNames_1[_i];
                                itemObj[MappedcolumnName] = item.GetValue(columnName);
                            }
                        }
                    }
                    tableObj.push(itemObj);
                }
                return tableObj;
            }
            Serializer.GetTable = GetTable;
            function AddField(fieldName, fieldValue) {
                if (fieldName && fieldValue) {
                    _json.flexible.fields[fieldName] = fieldValue;
                }
            }
            Serializer.AddField = AddField;
            function SetMapping(fieldsMapping, tablesMapping) {
                _fieldsMapping = typeof fieldsMapping === "object" ? fieldsMapping : {};
                _tableColumnsMapping = typeof tablesMapping === "object" ? tablesMapping : {};
            }
            Serializer.SetMapping = SetMapping;
            /**
             * Get stringified JSON version of the flexible form.
             * @memberof Lib.FlexibleFormToJSON.Serializer
             * @param {boolean} prettyPrint - Pretty JSON with "\t" spacing, false by default.
             * @param {boolean} tablesOnly - Compute only tables (not header fields), false by default.
             * @returns {string} Stringified JSON. See the example for the JSON's structure.
             * @example
             * {
             * 	flexible:
             * 	{
             * 		fields:
             * 		{
             *				D__: 123456,
             *				E__: "toto"
             * 		},
             * 		tables:
             * 		{
             * 			Product_List__: [
             * 				{A__: "1A", B__: "1B", C__: "1C"},
             * 				{A__: "2A", B__: "2B", C__: "2C"}
             * 			]
             * 		}
             * 	}
             * }
             */
            function GetJSON(prettyPrint, tablesOnly, restrictResultToMappingOnly) {
                if (prettyPrint === void 0) { prettyPrint = false; }
                if (tablesOnly === void 0) { tablesOnly = false; }
                if (restrictResultToMappingOnly === void 0) { restrictResultToMappingOnly = false; }
                InitJSON();
                if (!tablesOnly) {
                    ComputeFields(restrictResultToMappingOnly);
                }
                ComputeTables(restrictResultToMappingOnly);
                return JSON.stringify(_json, null, prettyPrint ? "\t" : null);
            }
            Serializer.GetJSON = GetJSON;
        })(Serializer = FlexibleFormToJSON.Serializer || (FlexibleFormToJSON.Serializer = {}));
        /**
         * Flexible form - JSON Deserializer
         * @namespace Lib.FlexibleFormToJSON.Deserializer
         */
        var Deserializer;
        (function (Deserializer) {
            function SetTables(tablesObj) {
                for (var _i = 0, _a = Object.keys(tablesObj); _i < _a.length; _i++) {
                    var tableName = _a[_i];
                    SetTable(tableName, tablesObj[tableName]);
                }
            }
            Deserializer.SetTables = SetTables;
            function SetTable(tableName, tableObj) {
                Log.Info("Setting table " + tableName);
                var table = Data.GetTable(tableName);
                if (table) {
                    for (var _i = 0, _a = Object.keys(tableObj); _i < _a.length; _i++) {
                        var itemsObj = _a[_i];
                        var item = table.AddItem();
                        var itemObj = tableObj[itemsObj];
                        for (var _b = 0, _c = Object.keys(itemObj); _b < _c.length; _b++) {
                            var fieldObj = _c[_b];
                            Log.Info("".concat(fieldObj, " = ").concat(itemObj[fieldObj]));
                            item.SetValue(fieldObj, itemObj[fieldObj]);
                        }
                    }
                    if (typeof this.CustomTableFill === "function") {
                        this.CustomTableFill();
                    }
                }
            }
            Deserializer.SetTable = SetTable;
            function SetField(fieldName, value) {
                if (fieldName) {
                    Data.SetValue(fieldName, value);
                }
            }
            Deserializer.SetField = SetField;
            function SetFields(fieldsObj) {
                for (var _i = 0, _a = Object.keys(fieldsObj); _i < _a.length; _i++) {
                    var fieldName = _a[_i];
                    SetField(fieldName, fieldsObj[fieldName]);
                }
            }
            Deserializer.SetFields = SetFields;
            /**
             * Fill the flexible form from a stringified JSON.
             * @memberof Lib.FlexibleFormToJSON.Deserializer
             * @param jsonString - Stringified JSON. See the example for the JSON's structure.
             * @param setHeaderFields - Fill the header fields, default to true.
             * @param setTableFields - Fill the tables, default to true.
             * @example
             * {
             * 	flexible:
             * 	{
             * 		fields:
             * 		{
             *				D__: 123456,
             *				E__: "toto"
             * 		},
             * 		tables:
             * 		{
             * 			Product_List__: [
             * 				{A__: "1A", B__: "1B", C__: "1C"},
             * 				{A__: "2A", B__: "2B", C__: "2C"}
             * 			]
             * 		}
             * 	}
             * }
             */
            function SetJSON(jsonString, setHeaderFields, setTableFields) {
                if (setHeaderFields === void 0) { setHeaderFields = true; }
                if (setTableFields === void 0) { setTableFields = true; }
                var obj = JSON.parse(jsonString);
                var isFlexibleObj = obj && obj.flexible;
                if (isFlexibleObj && obj.flexible.fields && obj.flexible.tables) {
                    if (setHeaderFields !== false) { //need to be explicitly removed
                        SetFields(obj.flexible.fields);
                    }
                    if (setTableFields !== false) { //need to be explicitly removed
                        SetTables(obj.flexible.tables);
                    }
                }
                else {
                    Log.Error("Given JSON in portal information is not in desired format");
                }
            }
            Deserializer.SetJSON = SetJSON;
        })(Deserializer = FlexibleFormToJSON.Deserializer || (FlexibleFormToJSON.Deserializer = {}));
        /**
         * Flexible form - JSON Checker
         * @namespace Lib.FlexibleFormToJSON.Checker
         */
        var Checker;
        (function (Checker) {
            var debug = false;
            function logDebug(message) {
                if (debug) {
                    Log.Info.apply(Log, message);
                }
            }
            function isValidDate(date) {
                if (Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date.getTime())) {
                    return date;
                }
                if (Object.prototype.toString.call(date) === "[object String]") {
                    var tempDate = Sys.Helpers.Date.ISO8601StringToDate(date);
                    if (tempDate) {
                        return isValidDate(tempDate);
                    }
                }
                return null;
            }
            function isSameDay(date1, date2) {
                logDebug("".concat(date1.getDate(), " == ").concat(date2.getDate()));
                logDebug("".concat(date1.getMonth(), " == ").concat(date2.getMonth()));
                logDebug("".concat(date1.getFullYear(), " == ").concat(date2.getFullYear()));
                return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
            }
            function checkNullValues(val1, val2) {
                if ((typeof val1 === "undefined" && typeof val2 === "undefined") || (val1 === null && val2 === null)) {
                    return true;
                }
                return false;
            }
            function compareValueAndJSON(fieldValue, jsonValue) {
                var isSameNullValues = checkNullValues(jsonValue, fieldValue);
                if (isSameNullValues) {
                    return true;
                }
                var fieldDate = isValidDate(fieldValue);
                var jsonDate = isValidDate(jsonValue);
                if (fieldDate) {
                    if (jsonDate) {
                        return isSameDay(fieldDate, jsonDate);
                    }
                    return false;
                }
                else {
                    return jsonValue === fieldValue;
                }
            }
            function SetDebugging(enabled) {
                debug = enabled;
            }
            Checker.SetDebugging = SetDebugging;
            function CheckTables(tablesObj, tablesColumnNames) {
                var ok = true;
                for (var _i = 0, _a = Object.keys(tablesObj); _i < _a.length; _i++) {
                    var tableName = _a[_i];
                    var currentOK = CheckTable(tableName, tablesObj[tableName], tablesColumnNames[tableName]);
                    ok = ok && currentOK;
                }
                return ok;
            }
            Checker.CheckTables = CheckTables;
            function CheckTable(tableName, tableObj, tableColumnNames) {
                Log.Info("Checking table " + tableName);
                var table = Data.GetTable(tableName);
                var tableOK = true;
                if (table) {
                    var lineIdx = 0;
                    for (var _i = 0, tableObj_1 = tableObj; _i < tableObj_1.length; _i++) {
                        var itemObj = tableObj_1[_i];
                        var item = table.GetItem(lineIdx);
                        for (var _a = 0, _b = Object.keys(itemObj); _a < _b.length; _a++) {
                            var fieldObj = _b[_a];
                            logDebug("Require to check table field ".concat(fieldObj, " in table ").concat(tableName));
                            if (tableColumnNames.indexOf(fieldObj) !== -1) {
                                logDebug("Yes");
                                var ok = compareValueAndJSON(item.GetValue(fieldObj), itemObj[fieldObj]);
                                if (!ok) {
                                    tableOK = false;
                                    item.SetError(fieldObj, "".concat(item.GetValue(fieldObj), " !== ").concat(itemObj[fieldObj]));
                                    Log.Error("Field ".concat(fieldObj, " on line ").concat(lineIdx, " was not set correctly"));
                                }
                            }
                        }
                        lineIdx++;
                    }
                }
                return tableOK;
            }
            Checker.CheckTable = CheckTable;
            function CheckField(fieldName, fieldObj) {
                var ok = false;
                if (fieldName) {
                    logDebug("Checking field ".concat(fieldName, ": ").concat(Data.GetValue(fieldName), "/").concat(fieldObj));
                    ok = compareValueAndJSON(Data.GetValue(fieldName), fieldObj);
                    if (!ok) {
                        Data.SetError(fieldName, "".concat(Data.GetValue(fieldName), " !== ").concat(fieldObj));
                        Log.Error("Field ".concat(fieldName, " was not set correctly"));
                    }
                }
                return ok;
            }
            Checker.CheckField = CheckField;
            function CheckFields(fieldsObj, fieldsNameList) {
                var ok = true;
                for (var _i = 0, _a = Object.keys(fieldsObj); _i < _a.length; _i++) {
                    var fieldObj = _a[_i];
                    logDebug("Require to check field: ".concat(fieldObj, " ?"));
                    if (fieldsNameList.indexOf(fieldObj) !== -1) {
                        logDebug("Yes");
                        var currentOK = CheckField(fieldObj, fieldsObj[fieldObj]);
                        ok = ok && currentOK;
                    }
                }
                return ok;
            }
            Checker.CheckFields = CheckFields;
            function GetFieldsNameList() {
                var fieldsList = Array();
                var nbFields = Data.GetNbFields();
                for (var i = 0; i < nbFields; i++) {
                    fieldsList.push(Data.GetFieldName(i));
                }
                return fieldsList;
            }
            Checker.GetFieldsNameList = GetFieldsNameList;
            function GetTablesFieldsNameList() {
                var tablesColumnNames = {};
                for (var i = 0; i < Data.GetNbTables(); i++) {
                    var tableName = Data.GetTableName(i);
                    var fieldsList = Array();
                    var nbTableFields = Data.GetNbColumns(tableName);
                    for (var f = 0; f < nbTableFields; f++) {
                        fieldsList.push(Data.GetColumnName(tableName, f));
                    }
                    tablesColumnNames[tableName] = fieldsList;
                }
                return tablesColumnNames;
            }
            Checker.GetTablesFieldsNameList = GetTablesFieldsNameList;
            /**
             * Compare the flexible form and its stringified JSON version.
             * Set Error on fields that do not match.
             * @memberof Lib.FlexibleFormToJSON.Checker
             * @param jsonString - Stringified JSON. See the example for the JSON's structure.
             * @example
             * {
                * 	flexible:
                * 	{
                * 		fields:
                * 		{
                *				D__: 123456,
                *				E__: "toto"
                * 		},
                * 		tables:
                * 		{
                * 			Product_List__: [
                * 				{A__: "1A", B__: "1B", C__: "1C"},
                * 				{A__: "2A", B__: "2B", C__: "2C"}
                * 			]
                * 		}
                * 	}
                * }
                */
            function CheckJSON(jsonString) {
                var obj = JSON.parse(jsonString);
                var isFlexibleObj = obj && obj.flexible;
                var ok = true;
                if (isFlexibleObj && obj.flexible.fields && obj.flexible.tables) {
                    var fieldsNameList = GetFieldsNameList();
                    var checkFields = CheckFields(obj.flexible.fields, fieldsNameList);
                    var tablesColumnNames = GetTablesFieldsNameList();
                    var checkTables = CheckTables(obj.flexible.tables, tablesColumnNames);
                    ok = ok && checkFields && checkTables;
                }
                else {
                    Log.Error("Given JSON in portal information is not in desired format");
                    ok = false;
                }
                return ok;
            }
            Checker.CheckJSON = CheckJSON;
        })(Checker = FlexibleFormToJSON.Checker || (FlexibleFormToJSON.Checker = {}));
    })(FlexibleFormToJSON = Lib.FlexibleFormToJSON || (Lib.FlexibleFormToJSON = {}));
})(Lib || (Lib = {}));
