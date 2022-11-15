/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_POEdition_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Manages post-edition of PO (common library)",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Sys/Sys_Helpers_Object"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var POEdition;
        (function (POEdition) {
            var ChangesManager;
            (function (ChangesManager) {
                var editionChanges = null;
                function Init() {
                    var editionChangesRet;
                    editionChangesRet = Variable.GetValueAsString("EditionChanges");
                    editionChangesRet = editionChangesRet ? JSON.parse(editionChangesRet) : { header: {} };
                    editionChanges = editionChangesRet;
                }
                ChangesManager.Init = Init;
                function Reset() {
                    Log.Info("Lib.Purchasing.POEdition.ChangesManager.Reset()");
                    editionChanges = { header: {} };
                    Variable.SetValueAsString("EditionChanges", JSON.stringify(editionChanges));
                    return editionChanges;
                }
                ChangesManager.Reset = Reset;
                function HasChanged(fieldName, tableName, index) {
                    var changes = Get(fieldName, tableName, index);
                    return !!(changes && !Sys.Helpers.Object.IsEmptyPlainObject(changes));
                }
                ChangesManager.HasChanged = HasChanged;
                function HasChangeInForm() {
                    var changes = GetRealChanges();
                    for (var prop in changes) {
                        if (Object.prototype.hasOwnProperty.call(changes, prop) && !Sys.Helpers.Object.IsEmptyPlainObject(changes[prop])) {
                            return true;
                        }
                    }
                    return false;
                }
                ChangesManager.HasChangeInForm = HasChangeInForm;
                function IsNew(tableName, index) {
                    var changes = Get(null, tableName, index);
                    return !!changes && !Sys.Helpers.Object.IsEmptyPlainObject(changes) && changes.Added;
                }
                ChangesManager.IsNew = IsNew;
                function Get(fieldName, tableName, key, excludeTechnicalChanges) {
                    if (excludeTechnicalChanges === void 0) { excludeTechnicalChanges = false; }
                    var realChanges = editionChanges;
                    // in header
                    if (!tableName) {
                        // returns field changes
                        if (fieldName) {
                            return realChanges.header[fieldName] || null;
                        }
                        // returns header changes
                        return realChanges.header;
                    }
                    // in table
                    var tableChanges = realChanges[tableName];
                    if (tableChanges) {
                        var onItem = !Sys.Helpers.IsEmpty(key);
                        if (excludeTechnicalChanges) {
                            Sys.Helpers.Object.ForEach(tableChanges, function (lineChanges, currentkey) {
                                var newLineChanges = {};
                                Sys.Helpers.Object.ForEach(lineChanges, function (fieldChange, currentfieldName) {
                                    if (!fieldChange.isTechnicalChange) {
                                        newLineChanges[currentfieldName] = {
                                            from: fieldChange.from,
                                            to: fieldChange.to,
                                            isTechnicalChange: !!fieldChange.isTechnicalChange
                                        };
                                    }
                                });
                                tableChanges[currentkey] = newLineChanges;
                            });
                        }
                        // field in item
                        if (fieldName && onItem) {
                            return tableChanges[key] ? tableChanges[key][fieldName] : null;
                        }
                        // column in table
                        if (fieldName && !onItem) {
                            var columnChanges_1 = {};
                            Sys.Helpers.Object.ForEach(tableChanges, function (itemChanges, index) {
                                columnChanges_1[index] = itemChanges[fieldName] || null;
                            });
                            return columnChanges_1;
                        }
                        // item in table
                        if (!fieldName && onItem) {
                            return tableChanges[key] || null;
                        }
                        // table
                        return tableChanges;
                    }
                    return null;
                }
                ChangesManager.Get = Get;
                function Watch(fieldName, tableName, isTechnicalChange) {
                    // watch field in header
                    if (!tableName) {
                        if (!editionChanges.header[fieldName] || (editionChanges.header[fieldName] && !editionChanges.header[fieldName].from)) {
                            editionChanges.header[fieldName] = {
                                from: GetValue(Data, fieldName)
                            };
                        }
                    }
                    // watch column in table
                    else {
                        var table = Data.GetTable(tableName);
                        if (table) {
                            var tableChanges = editionChanges[tableName] = editionChanges[tableName] || {};
                            for (var i = table.GetItemCount() - 1; i >= 0; i--) {
                                var item = table.GetItem(i);
                                var index = tableName === "LineItems__" ? GetKey(item) : i;
                                var itemChanges = tableChanges[index] = tableChanges[index] || {};
                                if (!itemChanges[fieldName] || (itemChanges[fieldName] && !itemChanges[fieldName].from)) {
                                    itemChanges[fieldName] = {
                                        from: GetValue(item, fieldName)
                                    };
                                }
                                itemChanges[fieldName].isTechnicalChange = !!isTechnicalChange && isTechnicalChange(item);
                            }
                        }
                    }
                }
                ChangesManager.Watch = Watch;
                function GetValue(obj, field) {
                    var val = obj.GetValue(field);
                    if (val instanceof Date) {
                        val = Sys.Helpers.Date.Date2DBDate(val);
                    }
                    else if (!Sys.Helpers.IsEmpty(val) && !Sys.Helpers.IsString(val)) {
                        val = "" + val; // force to string conversion
                    }
                    return val;
                }
                function GetRealChanges(excludeTechnicalChanges) {
                    if (excludeTechnicalChanges === void 0) { excludeTechnicalChanges = false; }
                    var changesToSerialize = { header: {} };
                    Sys.Helpers.Object.ForEach(editionChanges, function (subChanges, where) {
                        // in header
                        if (where === "header") {
                            Sys.Helpers.Object.ForEach(subChanges, function (fieldChange, fieldName) {
                                var value = GetValue(Data, fieldName);
                                if (fieldChange.from !== value) {
                                    changesToSerialize.header = {
                                        from: fieldChange.from,
                                        to: value
                                    };
                                }
                            });
                        }
                        // in table
                        else {
                            var table_1 = Data.GetTable(where);
                            var serializedTableChanges_1 = changesToSerialize[where] = changesToSerialize[where] || {};
                            var numberOfDeleted_1 = 0;
                            Sys.Helpers.Object.ForEach(subChanges, function (lineChanges, key) {
                                var item = where === "LineItems__" ? GetItem(table_1, key) : table_1.GetItem(parseInt(key, 10));
                                if (!item) {
                                    // stock the previous information for the revert
                                    serializedTableChanges_1[key] = lineChanges;
                                    serializedTableChanges_1[key]["Deleted"] = true;
                                    numberOfDeleted_1++;
                                }
                                else {
                                    Sys.Helpers.Object.ForEach(lineChanges, function (fieldChange, fieldName) {
                                        var value = GetValue(item, fieldName);
                                        if ((fieldChange.from !== value) && (!excludeTechnicalChanges || !fieldChange.isTechnicalChange)) {
                                            var serializedLineChanges = serializedTableChanges_1[key] = serializedTableChanges_1[key] || {};
                                            serializedLineChanges[fieldName] = {
                                                from: fieldChange.from,
                                                to: value,
                                                isTechnicalChange: !!fieldChange.isTechnicalChange
                                            };
                                        }
                                    });
                                }
                            });
                            var count = table_1.GetItemCount();
                            var subChangesLength = Sys.Helpers.Object.Values(subChanges).length;
                            if (where === "LineItems__") {
                                if (subChangesLength - numberOfDeleted_1 !== count) {
                                    for (var i = 0; i < count; i++) {
                                        var key = GetKey(table_1.GetItem(i));
                                        if (!subChanges[key]) {
                                            serializedTableChanges_1[key] = { "Added": true };
                                        }
                                    }
                                }
                            }
                            else if (subChangesLength < count) {
                                for (var i = subChangesLength; i < count; i++) {
                                    serializedTableChanges_1[i] = { "Added": true };
                                }
                            }
                        }
                    });
                    return changesToSerialize;
                }
                function RevertDeletedItem(filter, itemsDeletedChanges, checkQtyWith) {
                    var _a;
                    if (filter.length === 0) {
                        return Sys.Helpers.Promise.Resolve();
                    }
                    var orFilterArray = [];
                    orFilterArray.push((_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, filter));
                    var attributes = [];
                    Sys.Helpers.Object.ForEach(Lib.Purchasing.Items.PRItemsDBInfo.fields, function (field) {
                        attributes.push(Sys.Helpers.IsPlainObject(field) ? field.name : field);
                    });
                    var options = {
                        table: Lib.Purchasing.Items.PRItemsDBInfo.table,
                        filter: orFilterArray.toString(),
                        attributes: attributes,
                        additionalOptions: {
                            recordBuilder: Sys.GenericAPI.BuildQueryResult,
                            fieldToTypeMap: Lib.Purchasing.Items.PRItemsDBInfo.fieldsMap
                        }
                    };
                    return Sys.GenericAPI.PromisedQuery(options)
                        .Then(function (results) {
                        if (results && results.length > 0) {
                            var PRItemsToPO = Lib.Purchasing.Items.PRItemsToPO;
                            var optionsFillFormItems = {
                                // no foreign data needed (ignore vendor information)
                                foreignData: null,
                                // quantity to order is probably obsolete when user selects item.
                                // the check of quantity in validation script will detect over-ordered items.
                                checkQtyWith: checkQtyWith,
                                // common API used to fill an item
                                fillItem: Lib.Purchasing.POItems.CompleteFormItem,
                                // we keep all items in table
                                resetItems: false,
                                // fill only item fields not common ones
                                doNotFillCommonFields: true
                            };
                            var fieldsInError = Lib.Purchasing.Items.FillFormItems(results, PRItemsToPO, optionsFillFormItems);
                            if (fieldsInError.length > 0) {
                                Log.Warn("Some items have different values on the following fields: " + fieldsInError.join(", "));
                            }
                            var table = Data.GetTable("LineItems__");
                            var index = table.GetItemCount() - 1;
                            var tableItem_1 = table.GetItem(index);
                            var lineChanges = itemsDeletedChanges[GetValue(tableItem_1, "PRNumber__") + "###" + GetValue(tableItem_1, "PRLineNumber__")];
                            Sys.Helpers.Object.ForEach(lineChanges, function (fieldChange, fieldName) {
                                if (fieldName !== "Deleted") {
                                    tableItem_1.SetValue(fieldName, fieldChange.from);
                                }
                            });
                        }
                    })
                        .Catch(function (error) {
                        Log.Error(error);
                        throw error;
                    });
                }
                function GetChangedItems(excludeTechnicalChanges) {
                    if (excludeTechnicalChanges === void 0) { excludeTechnicalChanges = false; }
                    var changes = {};
                    Sys.Helpers.Object.ForEach(editionChanges, function (subChanges, where) {
                        if (where !== "header") {
                            var table_2 = Data.GetTable(where);
                            var serializedTableChanges = changes[where] = changes[where] || {};
                            var serializedDeletedItems_1 = serializedTableChanges["Deleted"] = [];
                            var serializedchangedItems_1 = serializedTableChanges["Changed"] = [];
                            var serializedAddedItems_1 = serializedTableChanges["Added"] = [];
                            Sys.Helpers.Object.ForEach(subChanges, function (lineChanges, key) {
                                var item = where === "LineItems__" ? GetItem(table_2, key) : table_2.GetItem(key);
                                if (!item && serializedDeletedItems_1.indexOf(key) < 0) {
                                    serializedDeletedItems_1.push(key);
                                }
                                else {
                                    Sys.Helpers.Object.ForEach(lineChanges, function (fieldChange, fieldName) {
                                        if (fieldName === "Added" && serializedAddedItems_1.indexOf(item) < 0) {
                                            serializedAddedItems_1.push(item);
                                        }
                                        else if ((fieldChange.from !== fieldChange.to) && (!excludeTechnicalChanges || !fieldChange.isTechnicalChange) && serializedchangedItems_1.indexOf(item) < 0) {
                                            serializedchangedItems_1.push(item);
                                        }
                                    });
                                }
                            });
                        }
                    });
                    return changes;
                }
                ChangesManager.GetChangedItems = GetChangedItems;
                function GetKey(item) {
                    return GetValue(item, "LineItemNumber__") + "###" + GetValue(item, "PRNumber__") + "###" + GetValue(item, "PRLineNumber__");
                }
                ChangesManager.GetKey = GetKey;
                function GetItem(table, key) {
                    var LineItemNumber_PRNumber_LineNumber = key.split("###");
                    for (var index = 0; index < table.GetItemCount(); index++) {
                        var item = table.GetItem(index);
                        if (GetValue(item, "PRLineNumber__") === LineItemNumber_PRNumber_LineNumber[2] && GetValue(item, "PRNumber__") === LineItemNumber_PRNumber_LineNumber[1]) {
                            return item;
                        }
                    }
                    return null;
                }
                ChangesManager.GetItem = GetItem;
                function Serialize() {
                    editionChanges = GetRealChanges();
                    Variable.SetValueAsString("EditionChanges", JSON.stringify(editionChanges));
                }
                ChangesManager.Serialize = Serialize;
                function Revert() {
                    var DeletedItemsFilter = [];
                    var itemsDeletedChanges = {};
                    var checkQtyWith = null;
                    Sys.Helpers.Object.ForEach(editionChanges, function (subChanges, where) {
                        // in header
                        if (where === "header") {
                            Sys.Helpers.Object.ForEach(subChanges, function (fieldChange, fieldName) {
                                Data.SetValue(fieldName, fieldChange.from);
                            });
                        }
                        // in table
                        else {
                            var table_3 = Data.GetTable(where);
                            var poOrderedQty_1 = {};
                            Sys.Helpers.Object.ForEach(subChanges, function (lineChanges, key) {
                                var item = where === "LineItems__" ? GetItem(table_3, key) : table_3.GetItem(parseInt(key, 10));
                                if (lineChanges.Added) {
                                    item.Remove();
                                }
                                else if (lineChanges.Deleted) {
                                    var LineItemNumber_PRNumber_LineNumber = key.split("###");
                                    DeletedItemsFilter.push(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("PRNumber__", LineItemNumber_PRNumber_LineNumber[1]), Sys.Helpers.LdapUtil.FilterEqual("LINENUMBER__", LineItemNumber_PRNumber_LineNumber[2])));
                                    itemsDeletedChanges[LineItemNumber_PRNumber_LineNumber[1] + "###" + LineItemNumber_PRNumber_LineNumber[2]] = lineChanges;
                                    if (!poOrderedQty_1[LineItemNumber_PRNumber_LineNumber[1]]) {
                                        poOrderedQty_1[LineItemNumber_PRNumber_LineNumber[1]] = {};
                                    }
                                    poOrderedQty_1[LineItemNumber_PRNumber_LineNumber[1]][LineItemNumber_PRNumber_LineNumber[2]] = 0;
                                }
                                else {
                                    Sys.Helpers.Object.ForEach(lineChanges, function (fieldChange, fieldName) {
                                        item.SetValue(fieldName, fieldChange.from);
                                    });
                                }
                            });
                            if (!Sys.Helpers.Object.IsEmptyPlainObject(poOrderedQty_1)) {
                                checkQtyWith = poOrderedQty_1;
                            }
                        }
                    });
                    // Update total amount
                    return RevertDeletedItem(DeletedItemsFilter, itemsDeletedChanges, checkQtyWith)
                        .Then(Lib.Purchasing.CheckPO.CheckAdditionalFeesAmounts)
                        .Then(Lib.Purchasing.Items.ComputeTotalAmount)
                        .Then(Lib.Purchasing.POItems.FillTaxSummary);
                }
                ChangesManager.Revert = Revert;
                function GetChangedFieldsList(excludeTechnicalChanges) {
                    if (excludeTechnicalChanges === void 0) { excludeTechnicalChanges = false; }
                    Log.Info("Order has changed ? Check only changes on line items.");
                    var changes = Get(null, "LineItems__", undefined, excludeTechnicalChanges);
                    var additionalFeesChanges = Get(null, "AdditionalFees__", undefined, excludeTechnicalChanges);
                    if ((!changes || Sys.Helpers.Object.IsEmptyPlainObject(changes)) && (!additionalFeesChanges || Sys.Helpers.Object.IsEmptyPlainObject(additionalFeesChanges))) {
                        return {};
                    }
                    var changedFields = { LineItems__: {}, AdditionalFees__: {} };
                    var changedFieldsLists = {};
                    Sys.Helpers.Object.ForEach(changes, function (lineChanges) {
                        if (lineChanges.Deleted) {
                            changedFields.LineItems__["Deleted"] = true;
                        }
                        else {
                            Sys.Helpers.Object.ForEach(lineChanges, function (fieldChange, fieldName) {
                                changedFields.LineItems__[fieldName] = true;
                            });
                        }
                    });
                    Sys.Helpers.Object.ForEach(additionalFeesChanges, function (lineChanges) {
                        Sys.Helpers.Object.ForEach(lineChanges, function (fieldChange, fieldName) {
                            changedFields.AdditionalFees__[fieldName] = true;
                        });
                    });
                    var changedFieldsListsLineItems = Object.keys(changedFields.LineItems__);
                    var changedFieldsListsAdditionalFees = Object.keys(changedFields.AdditionalFees__);
                    if (changedFieldsListsLineItems.length > 0) {
                        changedFieldsLists["LineItems__"] = changedFieldsListsLineItems;
                        Log.Info("Some items fields have changed: " + changedFieldsListsLineItems.join(","));
                    }
                    if (changedFieldsListsAdditionalFees.length > 0) {
                        changedFieldsLists["AdditionalFees__"] = changedFieldsListsAdditionalFees;
                        Log.Info("Some additionnal fees fields have changed: " + changedFieldsListsAdditionalFees.join(","));
                    }
                    return changedFieldsLists;
                }
                ChangesManager.GetChangedFieldsList = GetChangedFieldsList;
                function NeedToRegeneratePO() {
                    var changedFields = GetChangedFieldsList();
                    var needToRegeneratePO = false;
                    Sys.Helpers.Object.ForEach(changedFields.LineItems__, function (fieldName) {
                        if (Lib.Purchasing.POItems.customerInterestedItems.indexOf(fieldName) >= 0) {
                            needToRegeneratePO = true;
                        }
                        return needToRegeneratePO;
                    });
                    Sys.Helpers.Object.ForEach(changedFields.AdditionalFees__, function (fieldName) {
                        if (Lib.Purchasing.POItems.customerInterestedAdditionalFeesFields.indexOf(fieldName) >= 0) {
                            needToRegeneratePO = true;
                        }
                        return needToRegeneratePO;
                    });
                    return needToRegeneratePO;
                }
                ChangesManager.NeedToRegeneratePO = NeedToRegeneratePO;
                Init();
            })(ChangesManager = POEdition.ChangesManager || (POEdition.ChangesManager = {}));
            var SkipProcessingException = /** @class */ (function () {
                function SkipProcessingException(message) {
                    this.message = message;
                }
                SkipProcessingException.prototype.toString = function () {
                    return this.message;
                };
                return SkipProcessingException;
            }());
            POEdition.SkipProcessingException = SkipProcessingException;
            var Rollback;
            (function (Rollback) {
                function NeedRollbackUpTo(functionName) {
                    Variable.SetValueAsString("EditionChangesRollbackNeededUpTo", functionName);
                }
                Rollback.NeedRollbackUpTo = NeedRollbackUpTo;
                function IsRollbackNeeded() {
                    return !!Variable.GetValueAsString("EditionChangesRollbackNeededUpTo");
                }
                Rollback.IsRollbackNeeded = IsRollbackNeeded;
                function IsRollbackProcessing() {
                    return !!Variable.GetValueAsString("EditionChangesRollbackProcessingUpTo");
                }
                Rollback.IsRollbackProcessing = IsRollbackProcessing;
                function GetRollbackUpTo() {
                    // Two variables are used in order to differenciate asking and processing of edition rollback
                    var rollbackingUpTo = Variable.GetValueAsString("EditionChangesRollbackProcessingUpTo");
                    if (!rollbackingUpTo) {
                        rollbackingUpTo = Variable.GetValueAsString("EditionChangesRollbackNeededUpTo");
                        if (rollbackingUpTo) {
                            Variable.SetValueAsString("EditionChangesRollbackProcessingUpTo", rollbackingUpTo);
                            Variable.SetValueAsString("EditionChangesRollbackNeededUpTo", "");
                        }
                    }
                    return rollbackingUpTo;
                }
                Rollback.GetRollbackUpTo = GetRollbackUpTo;
                function StopRollback() {
                    Variable.SetValueAsString("EditionChangesRollbackProcessingUpTo", "");
                    throw new SkipProcessingException("PO edition has been completely reverted.");
                }
                Rollback.StopRollback = StopRollback;
            })(Rollback = POEdition.Rollback || (POEdition.Rollback = {}));
        })(POEdition = Purchasing.POEdition || (Purchasing.POEdition = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
