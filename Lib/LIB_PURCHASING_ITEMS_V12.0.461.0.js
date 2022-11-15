///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Items_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Lib_P2P_V12.0.461.0",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Controls",
    "Sys/Sys_Helpers_Promise",
    "[Sys/Sys_Helpers_Database]",
    "Lib_CommonDialog_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_Items.Base_V12.0.461.0",
    "Lib_Purchasing_Items.Config_V12.0.461.0",
    "Lib_Purchasing_Items.PR_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0",
    "[Lib_GR_Customization_Common]",
    "Sys/Sys_TechnicalData"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Items;
        (function (Items) {
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            Items.AddLib = Lib.AddLib;
            Items.ExtendLib = Lib.ExtendLib;
            // Members declaration and implementation
            var g = Sys.Helpers.Globals;
            Items.MAXRECORDS = 100;
            /**
             * Compare 2 objects
             *
             * If both are plain objects, compare their stringified version
             * Otherwise do standard `!=` comparison
             */
            function isDifferent(item1, item2) {
                if (Sys.Helpers.IsPlainObject(item1) || Sys.Helpers.IsPlainObject(item2)) {
                    return JSON.stringify(item1) != JSON.stringify(item2);
                }
                return item1 != item2;
            }
            /**
             * Fill the document items form according to the selected database items.
             * @param {array} dbItems selected DB items used to fill form items.
             * @param {object} config declaring some information used to fill data (table, fields mapping, ...).
             * @param {object} options
             * @throws {Error} any error
             */
            function FillFormItems(dbItems, config, options) {
                options = options || {};
                var table = Data.GetTable(config.formTable);
                var commonValues = {};
                var offset;
                // only use when updating items
                var itemsByLineKey;
                if (options.updateItems) {
                    offset = 0;
                    itemsByLineKey = {};
                    Sys.Helpers.Data.ForEachTableItem(table, function (item /*, i*/) {
                        var lineKey = config.dbInfo.lineKey.map(function (field) {
                            return item.GetValue(config.mappings.byLine[field]);
                        }).join("|");
                        itemsByLineKey[lineKey] = item;
                    });
                }
                else {
                    if (options.resetItems) {
                        table.SetItemCount(0);
                        offset = 0;
                    }
                    else {
                        offset = table.GetItemCount();
                        // If only one item is returned, we check if it's an empty line
                        if (offset === 1 && Lib.Purchasing.IsLineItemEmpty(table.GetItem(0))) {
                            offset = 0;
                        }
                    }
                    table.SetItemCount(offset + dbItems.length);
                }
                // use map in order to keep uniqueness
                var fieldsInError = {};
                dbItems.forEach(function (dbItem, index) {
                    var item;
                    if (options.updateItems) {
                        var lineKey = config.dbInfo.lineKey.map(function (field) {
                            return dbItem.GetValue(field);
                        }).join("|");
                        item = itemsByLineKey[lineKey];
                        if (!item) {
                            Log.Info("Item not present for line key: " + lineKey);
                            return;
                        }
                    }
                    else {
                        item = table.GetItem(offset + index);
                        if (config.formLineNumber) {
                            item.SetValue(config.formLineNumber, (offset + 1 + index) * 10);
                        }
                    }
                    // Set values on each line
                    config.dbInfo.fields.forEach(function (field) {
                        var fieldName = Sys.Helpers.IsString(field) ? field : field.name;
                        var fieldValue = InternalGetDBFieldValue(dbItem, field, config, options);
                        if (fieldName in config.mappings.byLine) {
                            item.SetValue(config.mappings.byLine[fieldName], fieldValue);
                        }
                        if (config.mappings.common[fieldName]) {
                            if (commonValues[fieldName]) {
                                if (!commonValues[fieldName].hasMultipleValues && isDifferent(commonValues[fieldName].value, fieldValue)) {
                                    commonValues[fieldName].hasMultipleValues = true;
                                }
                            }
                            else if (!options.doNotFillCommonFields) {
                                commonValues[fieldName] = { "value": fieldValue }; // Save first value found
                            }
                            // If value at line level is different from first found => set field in error
                            // By default, don't ignore having different multiple values at line item level. Excepted if 'ignoreMultipleValuesAtItemLevel' is set to 'true' on mapping settings.
                            if (fieldName in config.mappings.byLine && commonValues[fieldName] && commonValues[fieldName].hasMultipleValues && commonValues[fieldName].value != fieldValue && !config.mappings.common[fieldName].ignoreMultipleValuesAtItemLevel) {
                                item.SetError(config.mappings.byLine[fieldName], config.errorMessages[fieldName]);
                            }
                        }
                    });
                    if (!options.updateItems && Sys.Helpers.IsFunction(options.fillItem)) {
                        var lineStillRelevant = options.fillItem(dbItem, item, options);
                        if (!lineStillRelevant) {
                            offset -= 1;
                            table.SetItemCount(offset + dbItems.length);
                        }
                    }
                });
                // Set header data
                if (!options.doNotFillCommonFields) {
                    // Check presence of multiple values, clean fields when needed
                    var sectionsToClean_1 = {};
                    Sys.Helpers.Object.ForEach(commonValues, function (commonValue, key) {
                        var fieldName = config.mappings.common[key].name || config.mappings.common[key];
                        if (!commonValue.hasMultipleValues) // unique value found
                         {
                            if (config.mappings.common[key].TechnicalData) {
                                Sys.TechnicalData.SetValue(fieldName, commonValue.value);
                            }
                            else {
                                Data.SetValue(fieldName, commonValue.value);
                            }
                        }
                        else if (config.mappings.common[key].sectionName) // multiple values found, all fields of the same section will be cleared
                         {
                            Log.Warn("Multiple values found for attribute '" + key + "', section '" + config.mappings.common[key].sectionName + "' will be cleared");
                            sectionsToClean_1[config.mappings.common[key].sectionName] = true;
                        }
                        else // multiple values found, set first found value on header
                         {
                            Log.Warn("Multiple values found for attribute '" + fieldName + "', setting first found value");
                            Data.SetValue(fieldName, commonValue.value);
                            fieldsInError[fieldName] = true;
                        }
                    });
                    // Clean sections
                    Sys.Helpers.Object.ForEach(sectionsToClean_1, function (value, key) {
                        Sys.Helpers.Object.ForEach(config.mappings.common, function (value2 /*, key2*/) {
                            if (value2.name && value2.sectionName == key) {
                                if (value2.TechnicalData) {
                                    Sys.TechnicalData.SetValue(value2.name, "");
                                }
                                else {
                                    Data.SetValue(value2.name, "");
                                }
                            }
                        });
                    });
                }
                // transform this map to array
                fieldsInError = Object.keys(fieldsInError);
                return fieldsInError;
            }
            Items.FillFormItems = FillFormItems;
            function GetDBFieldValue(dbItem, fieldName, config, options) {
                var field = Sys.Helpers.Array.Find(config.dbInfo.fields, function (f) {
                    var name = Sys.Helpers.IsString(f) ? f : f.name;
                    return name === fieldName;
                });
                return field ? InternalGetDBFieldValue(dbItem, field, config, options) : null;
            }
            Items.GetDBFieldValue = GetDBFieldValue;
            function InternalGetDBFieldValue(dbItem, field, config, options) {
                var fieldName = Sys.Helpers.IsString(field) ? field : field.name;
                var fieldValue = null;
                if (field.foreign) {
                    if (options.foreignData) {
                        fieldValue = options.foreignData[AdaptativeGetValue(dbItem, config.dbInfo.localKey)][fieldName];
                    }
                }
                else if (field.TechnicalData) {
                    var technicalData = AdaptativeGetValue(dbItem, "TechnicalData__");
                    if (technicalData) {
                        fieldValue = JSON.parse(technicalData)[fieldName];
                    }
                }
                else {
                    fieldValue = AdaptativeGetValue(dbItem, fieldName);
                }
                // normalize multiline string values
                if (Sys.Helpers.IsString(fieldValue)) {
                    fieldValue = fieldValue.replace(/\r\n/g, "\n");
                }
                if (fieldValue === null && field.type === "date") {
                    fieldValue = "";
                }
                return fieldValue;
            }
            /**
             * Returns value for fieldName in dbItems.
             * This method stems from the need of querying CDL GR Items to fill Return Order Form.
             * We needed to use FillFormItem with a different type of query.
             * @param dbItem an dbItem
             * @param fieldName the field name of the requested value
             * @returns {any} value of dbItem for fieldName
             */
            function AdaptativeGetValue(dbItem, fieldName) {
                return dbItem.GetValue ? dbItem.GetValue(fieldName) : dbItem[fieldName];
            }
            function IsAsnLineItemsInError() {
                var error = false;
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item /*, i*/) {
                    for (var itemName in Items.POItemsToASN.errorMessages) {
                        if (item.GetError(Items.POItemsToASN.mappings.byLine[itemName])) {
                            error = true;
                            break;
                        }
                    }
                    return error;
                });
                return error;
            }
            Items.IsAsnLineItemsInError = IsAsnLineItemsInError;
            function ComputeTotalAmount() {
                // Used only in PO form
                var totNet = new Sys.Decimal(0), locTotNet = new Sys.Decimal(0), net, d_net = new Sys.Decimal(0), rate = 1;
                var openOrderLocalCurrency = new Sys.Decimal(0);
                var localCurrency = CurrencyFactory.Get(Data.GetValue("LocalCurrency__"));
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item /*, i*/) {
                    var itemCurrency = item.GetValue("ItemCurrency__");
                    var currency = CurrencyFactory.Get(itemCurrency);
                    net = item.GetValue("ItemNetAmount__");
                    if (Sys.Helpers.IsEmpty(net)) {
                        d_net = new Sys.Decimal(item.GetValue("ItemUndeliveredQuantity__") || 0).mul(item.GetValue("ItemUnitPrice__") || 0);
                        net = Sys.Helpers.Round(d_net, currency.amountPrecision).toNumber();
                        item.SetValue("ItemNetAmount__", net);
                    }
                    totNet = totNet.add(net);
                    rate = item.GetValue("ItemExchangeRate__") || Data.GetValue("ExchangeRate__") || rate;
                    locTotNet = locTotNet
                        .add(net)
                        .mul(rate);
                    var openOrderAmount = Sys.Helpers.Round(new Sys.Decimal(item.GetValue("ItemUndeliveredQuantity__") || 0)
                        .mul(item.GetValue("ItemUnitPrice__") || 0), currency.amountPrecision);
                    openOrderLocalCurrency = openOrderLocalCurrency
                        .add(openOrderAmount)
                        .mul(rate || 0);
                });
                Sys.Helpers.Data.ForEachTableItem("AdditionalFees__", function (item /*, i*/) {
                    net = item.GetValue("Price__");
                    if (!Sys.Helpers.IsEmpty(net)) {
                        totNet = totNet.add(net);
                        locTotNet = locTotNet.add(new Sys.Decimal(net).mul(rate));
                    }
                });
                // Missing header fields
                Data.SetValue("TotalNetAmount__", totNet.toNumber());
                Data.SetValue("TotalNetLocalCurrency__", Sys.Helpers.Round(locTotNet, localCurrency.amountPrecision).toNumber());
                Data.SetValue("OpenOrderLocalCurrency__", Sys.Helpers.Round(openOrderLocalCurrency, localCurrency.amountPrecision).toNumber());
            }
            Items.ComputeTotalAmount = ComputeTotalAmount;
            /**
             * Load data from foreign table
             * @param {array} dbItems selected DB items used to fill form items.
             * @param {object} config declaring some information used to fill data (table, fields mapping, ...).
             * @returns {promise}
             */
            function LoadForeignData(dbItems, config) {
                if (!config.foreignTable) {
                    return Sys.Helpers.Promise.Resolve({});
                }
                Log.Info(">> LoadForeignData");
                // Get all involved ForeignData
                var foreignKey = [];
                dbItems.forEach(function (dbItem /*, index*/) {
                    foreignKey.push(dbItem.GetValue(config.foreignKeyValue));
                });
                // select items from all foreignData
                var foreignFilter = "(|" + Sys.Helpers.Array.Map(foreignKey, function (v) { return "(" + config.foreignKey + "=" + v + ")"; }).join("") + ")";
                Log.Info("Fetching information from Purchase requisitions: " + foreignFilter);
                // Build list of fields to retrieve from foreign table. Add foreignKey
                var foreignFields = Sys.Helpers.Array.Map(Sys.Helpers.Array.Filter(config.fields, function (field) { return field.foreign; }), function (field) { return field.name; });
                foreignFields.push(config.foreignKey);
                return Sys.GenericAPI.PromisedQuery({
                    table: config.foreignTable,
                    filter: foreignFilter,
                    attributes: foreignFields
                })
                    .Then(function (queryResult) {
                    if (queryResult.length === 0) {
                        throw "LoadForeignData: cannot find any result";
                    }
                    var foreignData = {}; // Map of RUIDEX to Map of foreign fields
                    var _loop_1 = function (idx) {
                        var dbDoc = queryResult[idx];
                        foreignData[dbDoc[config.foreignKey]] = {};
                        foreignFields.forEach(function (field) {
                            var fieldValue = dbDoc[field];
                            // normalize multiline string values
                            if (Sys.Helpers.IsString(fieldValue)) {
                                fieldValue = fieldValue.replace(/\r\n/g, "\n");
                            }
                            foreignData[dbDoc[config.foreignKey]][field] = fieldValue;
                        });
                    };
                    for (var idx in queryResult) {
                        _loop_1(idx);
                    }
                    Log.Info("<< foreignData: " + JSON.stringify(foreignData));
                    return foreignData;
                })
                    .Catch(function (error) {
                    throw "LoadForeignData: error querying " + config.foreignTable + " with filter: " + foreignFilter + ".Details: " + error;
                });
            }
            Items.LoadForeignData = LoadForeignData;
            /**
             * Retrieves items for document. Returns a map a item array by itemKey.
             * @param {object} itemsDBInfo information about items in database
             * @param {string} filter allowing to select items
             * @param {string} itemKey item field used to feed the key map
             * @returns {IPromise} returns items in a promise
             */
            function GetItemsForDocument(itemsDBInfo, filter, itemKey) {
                !itemsDBInfo.fieldsMap && Items.InitDBFieldsMap(itemsDBInfo);
                Log.Info("Retrieve all items with filter " + filter);
                return Sys.GenericAPI.PromisedQuery({
                    table: itemsDBInfo.table,
                    filter: filter,
                    attributes: ["*"],
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: itemsDBInfo.fieldsMap,
                        bigQuery: true,
                        queryOptions: "ReturnNullAttributes=1"
                    }
                })
                    .Then(function (dbItems) {
                    var items = {};
                    dbItems.forEach(function (dbItem) {
                        var itemKeyValue = dbItem.GetValue(itemKey);
                        items[itemKeyValue] = items[itemKeyValue] || [];
                        items[itemKeyValue].push(dbItem);
                    });
                    Log.Info(dbItems.length + " items retrieved");
                    return items;
                })
                    .Catch(function (error) {
                    throw "GetItemsForDocument: cannot get items. Details: " + error;
                });
            }
            Items.GetItemsForDocument = GetItemsForDocument;
            var SyncFieldManipulator = /** @class */ (function () {
                function SyncFieldManipulator(dbField, byLine, config) {
                    this.dbField = dbField;
                    this.byLine = byLine;
                    this.config = config;
                    this.formField = config.mappings[byLine ? "byLine" : "common"][dbField];
                    this.dbType = config.dbInfo.fieldsMap[dbField] || "string";
                }
                SyncFieldManipulator.prototype.GetFormValue = function (data) {
                    if (this.formField.computed === true) {
                        var formFieldName = this.formField.name || this.dbField;
                        if (this.byLine) {
                            if (this.dbField !== this.config.lineKey) {
                                var formLineKey = GetSyncFieldManipulator(this.config.lineKey, true, this.config);
                                var formLineValue = formLineKey.GetFormValue(data);
                                return formLineValue && this.config.computedData.byLine[formLineValue] ? this.config.computedData.byLine[formLineValue][formFieldName] : undefined;
                            }
                        }
                        else {
                            return this.config.computedData.common[formFieldName];
                        }
                    }
                    return data.GetValue(this.formField.name || this.formField);
                };
                SyncFieldManipulator.prototype.SetDBValue = function (record, value) {
                    value = value === "" && this.dbType === "date" ? null : value;
                    Sys.Helpers.Database.SetRecordValue(record, this.dbField, value, this.dbType);
                };
                SyncFieldManipulator.prototype.GetDBValue = function (record) {
                    return Sys.Helpers.Database.GetRecordValue(record, this.dbField, this.dbType);
                };
                return SyncFieldManipulator;
            }());
            var syncFieldManipulatorsCache = {};
            function GetSyncFieldManipulator(dbField, byLine, config) {
                var manipulator = syncFieldManipulatorsCache[dbField];
                if (!manipulator) {
                    manipulator = syncFieldManipulatorsCache[dbField] = new SyncFieldManipulator(dbField, byLine, config);
                }
                return manipulator;
            }
            function FillRecord(formLine, dbLine, config) {
                if (config.mappings.common) {
                    Object.keys(config.mappings.common).forEach(function (dbField) {
                        var formField = GetSyncFieldManipulator(dbField, false, config);
                        var formValue = formField.GetFormValue(Data);
                        if (Sys.Helpers.IsDefined(formValue)) {
                            formField.SetDBValue(dbLine, formValue);
                        }
                    });
                }
                if (config.mappings.byLine) {
                    Object.keys(config.mappings.byLine).forEach(function (dbField) {
                        var formField = GetSyncFieldManipulator(dbField, true, config);
                        var formValue = formField.GetFormValue(formLine);
                        if (Sys.Helpers.IsDefined(formValue)) {
                            formField.SetDBValue(dbLine, formValue);
                        }
                    });
                }
            }
            /**
             * Synchronizes the items based on the parent document's items so that there are the same number of items and the items data match :
             *   - deletes items that are no longer in the parent document
             *   - inserts new items that were not present in the items table
             *   - updates items that are different
             * @param {object} config The configuration allowing to access to the form & DB table, the fields mapping, etc.
             * see PRItemsSynchronizeConfig or POItemsSynchronizeConfig
             * @throws {Error} any error
             */
            function Synchronize(config, impactedItemKeys) {
                if (Sys.ScriptInfo.IsServer()) {
                    !config.dbInfo.fieldsMap && Items.InitDBFieldsMap(config.dbInfo);
                    syncFieldManipulatorsCache = {}; // reset cache
                    var formTableKey_1 = GetSyncFieldManipulator(config.tableKey, false, config);
                    var filter = config.tableKey + "=" + formTableKey_1.GetFormValue(Data);
                    var formLineKey_1 = GetSyncFieldManipulator(config.lineKey, true, config);
                    var dbTable_1 = [];
                    Log.Info("Requesting items from " + config.dbInfo.table + " with filter " + filter);
                    g.Query.Reset();
                    g.Query.SetSpecificTable(config.dbInfo.table);
                    g.Query.SetFilter(filter);
                    if (g.Query.MoveFirst()) {
                        var record = g.Query.MoveNextRecord();
                        while (record) {
                            dbTable_1.push({
                                "record": record,
                                "key": formLineKey_1.GetDBValue(record)
                            });
                            record = g.Query.MoveNextRecord();
                        }
                    }
                    else if (g.Query.GetLastError()) {
                        throw new Error("Synchronize: cannot get items. Details: " + g.Query.GetLastErrorMessage());
                    }
                    var title_1;
                    var message_1;
                    var behaviorName_1 = null;
                    Sys.Helpers.Data.ForEachTableItem(config.formTable, function (formLine) {
                        // No insertion on PAC "PAC - PO - Items__" if PONumber__ is empty
                        if (config.dbInfo.table === "PAC - PO - Items__" && formTableKey_1.GetFormValue(Data) === "") {
                            return;
                        }
                        var key = formLineKey_1.GetFormValue(formLine);
                        var dbLine = Sys.Helpers.Array.Remove(dbTable_1, function (dbLine) {
                            return dbLine.key === key;
                        });
                        // only update impacted line items
                        if (!impactedItemKeys || Sys.Helpers.Array.IndexOf(impactedItemKeys, key) >= 0) {
                            if (!dbLine) {
                                Log.Info("Creating new record in " + config.dbInfo.table + " with key " + key);
                                dbLine = { record: Process.CreateTableRecord(config.dbInfo.table), key: key };
                            }
                            else {
                                // Check the sequence is duplicated
                                if (Sys.Helpers.IsUndefined(config.ParentRuidKey) == false && dbLine.record.GetVars().GetValue(config.ParentRuidKey, 0) != Data.GetValue("RUIDEX")) {
                                    title_1 = "_DuplicateSequenceTitle" + config.dbInfo.docType;
                                    message_1 = "_DuplicateSequenceMessage" + config.dbInfo.docType;
                                    behaviorName_1 = "ClearSequence";
                                    Lib.CommonDialog.NextAlert.Define(title_1, message_1, {
                                        isError: true,
                                        behaviorName: behaviorName_1
                                    });
                                    return true; // stop the loop
                                }
                                Log.Info("Updating record in " + config.dbInfo.table + " with key " + key);
                            }
                            FillRecord(formLine, dbLine.record, config);
                            dbLine.record.Commit();
                            if (dbLine.record.GetLastError()) {
                                throw new Error("Synchronize: commit item failed. Details: " + dbLine.record.GetLastErrorMessage());
                            }
                        }
                    });
                    if (typeof message_1 == "string") {
                        return false;
                    }
                    // delete remaining dbTable lines
                    dbTable_1.forEach(function (dbLine) {
                        Log.Info("Deleting record from " + config.dbInfo.table + " with key " + dbLine.key);
                        dbLine.record.Delete();
                        if (dbLine.record.GetLastError()) {
                            throw new Error("Synchronize: cannot delete item from table. Details: " + dbLine.record.GetLastErrorMessage());
                        }
                    });
                    return true;
                }
                throw "Not implemented on client side";
            }
            Items.Synchronize = Synchronize;
            function GetUpdatableTransport(ruidEx, resumeWithActionData) {
                var transport = Process.GetUpdatableTransport(ruidEx);
                var externalVars = transport.GetExternalVars();
                externalVars.AddValue_String("resumeWithActionData", resumeWithActionData, true);
                return transport;
            }
            /**
             * Resume the document identified by its ProcessName and RuidEx with an action.
             * We try first to resume synchronously and asynchronously if the previous attempt fails.
             * @param {string} processName The name of document process. (ex. Purchase Order)
             * @param {string} ruidEx The unique long ID of document.
             * @param {string} action The executed action once document is resumed.
             * @throws {Error} any error
             */
            function ResumeDocumentToSynchronizeItems(processName, ruidEx, action, resumeWithActionData) {
                if (Sys.ScriptInfo.IsServer()) {
                    Log.Time("ResumeDocumentToSynchronizeItems");
                    Log.Info("Resume document " + processName + " with ID: " + ruidEx + " and action: " + action);
                    // Try to resume synchronously
                    var transport = GetUpdatableTransport(ruidEx, resumeWithActionData);
                    var ok = transport.ResumeWithAction(action, false);
                    // If the sync attempt fails, we try an asynchronous one
                    if (!ok) {
                        Log.Info("Try a ResumeWithActionAsync because the synchronous attempt failed, error: " + transport.GetLastErrorMessage());
                        // Here we need to recreate a new updatable transport. Some updated data may be lost...
                        transport = GetUpdatableTransport(ruidEx, resumeWithActionData);
                        ok = transport.ResumeWithActionAsync(action);
                    }
                    Log.TimeEnd("ResumeDocumentToSynchronizeItems");
                    if (!ok) {
                        throw new Error("ResumeDocumentToSynchronizeItems: cannot resume document. Details: " + transport.GetLastErrorMessage());
                    }
                }
                else {
                    throw "Not implemented on client side";
                }
            }
            Items.ResumeDocumentToSynchronizeItems = ResumeDocumentToSynchronizeItems;
            /**
             * Synchronous version used for server based on the common version.
             * Retrieves items for document. Returns a map a item array by itemKey.
             * @param {object} itemsDBInfo information about items in database
             * @param {string} filter allowing to select items
             * @param {string} itemKey item field used to feed the key map
             * @returns {object} items for document.
             * @throws {Error} any error
             */
            function GetItemsForDocumentSync(itemsDBInfo, filter, itemKey) {
                var retItems = null;
                var lastError = null;
                Lib.Purchasing.Items.GetItemsForDocument(itemsDBInfo, filter, itemKey)
                    .Then(function (items) {
                    retItems = items;
                })
                    .Catch(function (err) {
                    lastError = err;
                });
                if (lastError) {
                    throw new Error(lastError);
                }
                return retItems;
            }
            Items.GetItemsForDocumentSync = GetItemsForDocumentSync;
            /**
             * Converts a TableRow control to a database record (query result object) in order to use the same APIs .
             * @param {object} tableRow a row of the specified Table control
             * @returns {object} a database record object
             */
            function ConvertTableRowToDBRecord(tableRow) {
                if (Sys.ScriptInfo.IsClient()) {
                    return {
                        GetValue: function (fieldName) {
                            if (fieldName in tableRow) {
                                return tableRow[fieldName].GetValue();
                            }
                            return null;
                        }
                    };
                }
                Log.Error("Not implemented on server side");
            }
            Items.ConvertTableRowToDBRecord = ConvertTableRowToDBRecord;
            function FillPRFromAncestor(dbItems, ancestorItemsToPR) {
                try {
                    Lib.Purchasing.Items.FillFormItems(dbItems, ancestorItemsToPR);
                }
                catch (e) {
                    Log.Error("FillPRFromAncestor error: " + e);
                }
            }
            Items.FillPRFromAncestor = FillPRFromAncestor;
            function PrepareFillPRFromAncestor(srcRuid, originalProcess) {
                if (!srcRuid) {
                    return Sys.Helpers.Promise.Reject("Ancestor RUID " + srcRuid + " was not found.");
                }
                var ItemsDBInfo = originalProcess === "PO" ? Lib.Purchasing.Items.POItemsDBInfo : Lib.Purchasing.Items.PRItemsDBInfo;
                // Lib.Purchasing.AncestorItemsToPR = originalProcess === "PO" ? Lib.Purchasing.Items.POItemsToPR : Lib.Purchasing.Items.PRItemsToPR;
                var filter = originalProcess + "RUIDEX__=" + srcRuid;
                var options = {
                    table: ItemsDBInfo.table,
                    filter: filter,
                    attributes: ["*"],
                    maxRecords: Items.MAXRECORDS,
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: ItemsDBInfo.fieldsMap,
                        bigQuery: true,
                        queryOptions: "ReturnNullAttributes=1"
                    }
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Catch(function (error) {
                    throw "PrepareFillPRFromAncestor: error querying ancestor items with filter. Details: " + error;
                });
            }
            Items.PrepareFillPRFromAncestor = PrepareFillPRFromAncestor;
            function QueryUNSPSCSupplyType(unspsc) {
                if (unspsc) {
                    var allUNSPSC = ["(UNSPSC__=" + unspsc + ")"];
                    for (var i = unspsc.length - 2; i > 1; i -= 2) {
                        allUNSPSC.push("(UNSPSC__=" + Sys.Helpers.String.PadRight(unspsc.slice(0, i), "0", unspsc.length) + ")");
                    }
                    var companyCode = Data.GetValue("CompanyCode__") || Data.GetValue("ItemCompanyCode__");
                    var filter = "(&(|(CompanyCode__=" + companyCode + ")(CompanyCode__=)(CompanyCode__!=*))(|" + allUNSPSC.join("") + "))";
                    var options = {
                        table: "P2P - Mapping UNSPSC to SupplyType__",
                        filter: filter,
                        sortOrder: "UNSPSC__ DESC",
                        attributes: ["SupplyTypeId__"],
                        maxRecords: 1
                    };
                    return Sys.GenericAPI.PromisedQuery(options);
                }
                return Sys.Helpers.Promise.Resolve();
            }
            Items.QueryUNSPSCSupplyType = QueryUNSPSCSupplyType;
            function IsQuantityBasedItem(item) {
                return Lib.P2P.IsQuantityBasedItem(item);
            }
            Items.IsQuantityBasedItem = IsQuantityBasedItem;
            function IsAmountBasedItem(item) {
                return Lib.P2P.IsAmountBasedItem(item);
            }
            Items.IsAmountBasedItem = IsAmountBasedItem;
            function IsServiceBasedItem(item) {
                return Lib.P2P.IsServiceBasedItem(item);
            }
            Items.IsServiceBasedItem = IsServiceBasedItem;
            function GetLineItemsTypes() {
                var types = {};
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    var itemType = item.GetValue("ItemType__");
                    if (itemType) {
                        types[itemType] = true;
                    }
                });
                return Object.keys(types);
            }
            Items.GetLineItemsTypes = GetLineItemsTypes;
            function ShouldDisplayColumn(itemTypes, visibility, status) {
                var visible = false;
                if (!Sys.Helpers.IsFunction(visibility.VisibleCondition) || visibility.VisibleCondition(status)) {
                    visible = !!Sys.Helpers.Array.Find(itemTypes, function (type) {
                        return visibility[type];
                    });
                }
                return visible;
            }
            Items.ShouldDisplayColumn = ShouldDisplayColumn;
            function UpdateItemTypeDependencies(visibilities, status) {
                var types = Lib.Purchasing.Items.GetLineItemsTypes();
                Sys.Helpers.Object.ForEach(visibilities, function (visibility, columnName) {
                    var visible = ShouldDisplayColumn(types, visibility, status);
                    var ctrl = g.Controls.LineItems__[columnName];
                    if (visible != ctrl.IsVisible()) {
                        ctrl.Hide(!visible);
                        if (visible && visibility) {
                            // !!! all cells in this column become visible => hide no visible cells
                            Sys.Helpers.Controls.ForEachTableRow(g.Controls.LineItems__, function (row) {
                                row[columnName].Hide(!visibility[row["ItemType__"].GetValue()] && !visibility.ShowAllColumnCellsWhenOneCellIsVisible);
                            });
                        }
                    }
                });
            }
            Items.UpdateItemTypeDependencies = UpdateItemTypeDependencies;
            /**
             * Call to check if a line in LineItems__ table as been over received.
             * @returns {boolean} true if succeeds, false if over received
             */
            function CheckOverReceivedItems(allPOItems, grNumberToIgnore, type) {
                try {
                    var isASN_1 = type === "ASN" /* ItemType.ASN */;
                    //Check if no item is over ordered
                    //Get the GR Items already created for each PO Items present in this GR to retrieve alreadyReceivedQuantity quantity
                    var grItemsFilter_1 = "(&(!(Status__=Canceled))(|";
                    Sys.Helpers.Object.ForEach(allPOItems, function (poItems, poNumber) {
                        poItems.forEach(function (poItem) {
                            grItemsFilter_1 += "(&(OrderNumber__=" + poNumber + ")(LineNumber__=" + poItem.GetValue(isASN_1 ? "ItemPOLineNumber__" : "LineNumber__") + "))";
                        });
                    });
                    grItemsFilter_1 += "))";
                    var grItems_1 = Lib.Purchasing.Items.GetItemsForDocumentSync(Lib.Purchasing.Items.GRItemsDBInfo, grItemsFilter_1, "OrderNumber__");
                    var overReceived_1 = false;
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        var poNumber = line.GetValue(isASN_1 ? "ItemPONumber__" : "OrderNumber__");
                        var poLineNumber = line.GetValue(isASN_1 ? "ItemPOLineNumber__" : "LineNumber__");
                        // ASN
                        var fieldOrdered = "ItemPOLineQuantity__";
                        var fieldReceived = "ItemQuantityReceived__";
                        var fieldReceivedInGRItems = "Quantity__";
                        var fieldReturned = "ReturnedQuantity__";
                        var fieldOpen = "ItemOpenAmount__";
                        if (!isASN_1) {
                            fieldOpen = "OpenQuantity__";
                            fieldReturned = null;
                            var isAmountBased = IsAmountBasedItem(line);
                            if (isAmountBased) {
                                fieldOrdered = "ItemOrderedAmount__";
                                fieldReceived = "NetAmount__";
                                fieldReceivedInGRItems = "Amount__";
                            }
                            else if (type === "PICKUP" /* ItemType.PICKUP */) {
                                fieldOrdered = "OrderedQuantity__";
                                fieldReceived = "PickedUpQuantity__";
                                fieldReceivedInGRItems = "Quantity__";
                            }
                            else {
                                fieldOrdered = "OrderedQuantity__";
                                fieldReceived = "ReceivedQuantity__";
                                fieldReceivedInGRItems = "Quantity__";
                                fieldReturned = "ReturnedQuantity__";
                            }
                        }
                        var valueOrdered = line.GetValue(fieldOrdered);
                        var valueReceived = line.GetValue(fieldReceived);
                        line.SetWarning(fieldReceived, "");
                        var valueAlreadyReceived = new Sys.Decimal(0);
                        var valueReturned = new Sys.Decimal(0);
                        if (grItems_1 && grItems_1[poNumber] && grItems_1[poNumber].length > 0) {
                            grItems_1[poNumber].forEach(function (grLine) {
                                // Ignore items from grNumberToIgnore
                                if (grLine.GetValue("LineNumber__") == poLineNumber
                                    && (Sys.Helpers.IsEmpty(grNumberToIgnore) || grLine.GetValue("GRNumber__") !== grNumberToIgnore)) {
                                    valueAlreadyReceived = valueAlreadyReceived.add(grLine.GetValue(fieldReceivedInGRItems));
                                    // if item is qty based
                                    if (fieldReturned) {
                                        valueReturned = valueReturned.add(grLine.GetValue(fieldReturned) || 0);
                                    }
                                }
                            });
                        }
                        var openQty = new Sys.Decimal(valueOrdered || 0).minus(valueAlreadyReceived).add(valueReturned).toNumber();
                        line.SetValue(fieldOpen, Math.max(0, openQty));
                        var totalReceived = valueAlreadyReceived.add(valueReceived);
                        //it is tolerated to received (orderedqty+returnedqty) items
                        var valueOverReceived = totalReceived.minus(valueOrdered).minus(valueReturned);
                        if (valueOverReceived.greaterThan(0) && !Sys.Helpers.TryCallFunction("Lib.GR.Customization.Common.AllowOverdelivery", line)) {
                            Log.Info("OverReception on line " + line);
                            if (!isASN_1) {
                                line.SetError(fieldReceived, "_Received qty outmatch ordered qty");
                            }
                            else {
                                // Already received quantity is not visible in ASN form so indicate it in error message
                                line.SetError(fieldReceived, Language.Translate("_Received qty ({0}) outmatch ordered qty ({1})", false, totalReceived.toNumber(), valueOrdered));
                            }
                            overReceived_1 = true;
                        }
                    });
                    return !overReceived_1;
                }
                catch (e) {
                    Lib.Purchasing.OnUnexpectedError(e.toString());
                    return false;
                }
            }
            Items.CheckOverReceivedItems = CheckOverReceivedItems;
        })(Items = Purchasing.Items || (Purchasing.Items = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
