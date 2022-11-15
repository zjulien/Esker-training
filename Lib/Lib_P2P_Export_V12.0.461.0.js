///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "scriptType": "COMMON",
  "require": [
    "Lib_P2P_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0"
  ],
  "name": "Lib_P2P_Export_V12.0.461.0"
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Export;
        (function (Export) {
            function SerializeTable(tableName, tableMapping, info) {
                var result = [];
                var table = Data.GetTable(tableName);
                if (tableName === "LineItems__") {
                    Lib.Purchasing.RemoveEmptyLineItem(table);
                }
                var nItems = table.GetItemCount();
                if (tableName === "TaxSummary__" && nItems == 0) {
                    result = [{ NetAmount__: 0, TaxAmount__: 0, TaxCode__: "null", TaxDescription__: "", TaxRate__: 0 }];
                }
                var _loop_1 = function (itemIdx) {
                    var item = table.GetItem(itemIdx);
                    var itemInfo = Sys.Helpers.Extend(true, {}, info, {
                        tableName: tableName,
                        table: table,
                        itemIdx: itemIdx,
                        item: item
                    });
                    // build a json for the current line
                    var jsonDataForItemIdxFields = {};
                    // loop on all columns of the line
                    Sys.Helpers.Object.ForEach(tableMapping.fields || {}, function (data, key) {
                        // keep original variable type
                        var dataValue = null;
                        if (Sys.Helpers.IsFunction(data)) {
                            dataValue = data(itemInfo);
                        }
                        else if (Sys.Helpers.Data.FieldExistInTable(tableName, data)) {
                            dataValue = item.GetValue(data);
                        }
                        else if (Sys.Helpers.IsFunction(info.GetValueOnRecord)) {
                            dataValue = info.GetValueOnRecord(item, data);
                        }
                        // except for Date type where we always set as a string with "YYYY-MM-DD" format
                        // TODO - Datetime in string to parse in order to transform it in UTC
                        if (dataValue instanceof Date) {
                            dataValue = Sys.Helpers.Date.ToUTCDate(dataValue);
                        }
                        jsonDataForItemIdxFields[key] = dataValue;
                    });
                    result.push(jsonDataForItemIdxFields);
                };
                for (var itemIdx = 0; itemIdx < nItems; itemIdx++) {
                    _loop_1(itemIdx);
                }
                return result;
            }
            Export.SerializeTable = SerializeTable;
            function GetName(processShortName, defaultIdField, revisionVersion) {
                var name = "";
                var GetNameFunc = Sys.Helpers.TryGetFunction("Lib." + processShortName + ".Customization.Server.GetName");
                if (GetNameFunc) {
                    name = GetNameFunc();
                }
                if (Sys.Helpers.IsEmpty(name)) {
                    name = processShortName + "_" + Data.GetValue(defaultIdField);
                }
                if (revisionVersion && revisionVersion > 0) {
                    name += "_" + Language.Translate("_Revision for pdf name") + "_" + revisionVersion;
                }
                return name + ".pdf";
            }
            Export.GetName = GetName;
            function IsAvailableTemplate(user, templateFileName, culture) {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    if (Sys.ScriptInfo.IsClient()) {
                        // Calling IsAvailableTemplate from EOD\DocMgr2\WebAccess\FlexibleForm\SDK\Helpers\EskFSDK_Template.js
                        user.IsAvailableTemplate(function (existResult) { resolve(existResult); }, templateFileName, culture);
                    }
                    else {
                        // Calling IsAvailableTemplate defined in EOD\Delivery\Packages\typings\EskJScript.d.ts
                        resolve(user.IsAvailableTemplate({
                            templateName: templateFileName,
                            language: culture
                        }));
                    }
                });
            }
            Export.IsAvailableTemplate = IsAvailableTemplate;
        })(Export = P2P.Export || (P2P.Export = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
