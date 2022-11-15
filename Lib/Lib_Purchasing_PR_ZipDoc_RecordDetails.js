/**
 * @file Lib.PurchaseRequisition.ZipDoc.RecordDetails library
 */
/**
 * Specific PR ZipDoc function to generate audit files
 * For the Download document feature
 * @class Lib.PurchaseRequisition.ZipDoc.RecordDetails
*/
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_PR_ZipDoc_RecordDetails",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Pruchase requisition serializers for the record details generation",
  "require": [
    "Sys/Sys_Helpers_CDL",
    "Lib_P2P_V12.0.461.0"
  ]
}*/
///#GLOBALS Lib Sys
var Lib;
(function (Lib) {
    var PurchaseRequisition;
    (function (PurchaseRequisition) {
        var ZipDoc;
        (function (ZipDoc) {
            var RecordDetails;
            (function (RecordDetails) {
                RecordDetails.Context = {
                    items: {},
                    workflow: {},
                };
                /**
                 *
                 * @param date type Date or DateTime to get as a string
                 * @param isDateTime keep default value (false) for a Date / use true for DateTime
                 * @param timeFormat keep default value ("None") for a Date / use "ShortTime" or "None" for DateTime depending on whether we want to display the time or not
                 */
                function getDateAsString(date, isDateTime, timeFormat) {
                    if (isDateTime === void 0) { isDateTime = false; }
                    if (timeFormat === void 0) { timeFormat = "None"; }
                    if (!date) {
                        Log.Warn("Some dates are not yet filled on the contract. Regrenerating the zip later should solve the problem.");
                        return "";
                    }
                    var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    return currentUser ? currentUser.GetFormattedDate(date, {
                        dateFormat: "ShortDate",
                        timeFormat: timeFormat,
                        timeZone: isDateTime ? "User" : "Local"
                    }) : date.toLocaleString();
                }
                function formatMultilineText(text) {
                    return text.replace(/(\r\n)|\n/g, "<br>");
                }
                function getPRDataToJSON(processID, msnEXs) {
                    var itemsData = {};
                    var isMultiShipTo = Lib.Purchasing.IsMultiShipTo();
                    var fields = ["Line_ItemDescription__", "Line_ItemQuantity__", "Line_ItemRequestedDeliveryDate__", "Line_ItemUnitPrice__", "Line_ItemCurrency__", "Line_ItemType__", "Line_ItemNetAmount__"];
                    if (isMultiShipTo) {
                        fields = fields.concat(["Line_ItemShipToCompany__", "Line_ItemShipToAddress__"]);
                    }
                    var records = Sys.Helpers.CDL.getCDLRecords({
                        processID: processID,
                        tableName: "LineItems__",
                        sourceMSNEXs: msnEXs,
                        fields: fields
                    });
                    if (records) {
                        var isAmountBased_1;
                        var _loop_1 = function (recordForMsnex) {
                            if (records[recordForMsnex]) {
                                var lines_1 = [];
                                records[recordForMsnex].forEach(function (record) {
                                    var line = [];
                                    var dateStr = getDateAsString(record.Line_ItemRequestedDeliveryDate__);
                                    isAmountBased_1 = record.Line_ItemType__ == Lib.P2P.ItemType.AMOUNT_BASED;
                                    line.push(record.Line_ItemDescription__);
                                    line.push(dateStr);
                                    line.push(isAmountBased_1 ? "&nbsp;" : record.Line_ItemQuantity__);
                                    line.push(isAmountBased_1 ? "&nbsp;" : record.Line_ItemUnitPrice__);
                                    line.push(record.Line_ItemNetAmount__);
                                    line.push(record.Line_ItemCurrency__);
                                    if (isMultiShipTo) {
                                        line.push(record.Line_ItemShipToCompany__);
                                        line.push(record.Line_ItemShipToAddress__);
                                    }
                                    lines_1.push(line);
                                });
                                itemsData[recordForMsnex] = lines_1;
                            }
                        };
                        for (var recordForMsnex in records) {
                            _loop_1(recordForMsnex);
                        }
                    }
                    return itemsData;
                }
                function getWorkflowDataToJSON(processID, msnEXs) {
                    var workflowData = {};
                    var records = Sys.Helpers.CDL.getCDLRecords({
                        processID: processID,
                        tableName: "ApproversList__",
                        sourceMSNEXs: msnEXs,
                        fields: ["Line_WRKFUserName__", "Line_WRKFRole__", "Line_WRKFDate__", "Line_WRKFComment__"]
                    });
                    if (records) {
                        var _loop_2 = function (recordForMsnex) {
                            if (records[recordForMsnex]) {
                                var lines_2 = [];
                                records[recordForMsnex].forEach(function (record) {
                                    var line = [];
                                    if (!record.Line_WRKFDate__) {
                                        line.push("<font color=\"darkgrey\">".concat(record.Line_WRKFUserName__, "</font>"));
                                        line.push("<font color=\"darkgrey\">".concat(record.Line_WRKFRole__, "</font>"));
                                        line.push("&nbsp;");
                                        line.push("&nbsp;");
                                    }
                                    else {
                                        var dateStr = getDateAsString(record.Line_WRKFDate__, true, "ShortTime");
                                        line.push(record.Line_WRKFUserName__);
                                        line.push(record.Line_WRKFRole__);
                                        line.push(dateStr.replace(/ /g, "&nbsp;"));
                                        line.push(record.Line_WRKFComment__ ? formatMultilineText(record.Line_WRKFComment__) : "&nbsp");
                                    }
                                    lines_2.push(line);
                                });
                                workflowData[recordForMsnex] = lines_2;
                            }
                        };
                        for (var recordForMsnex in records) {
                            _loop_2(recordForMsnex);
                        }
                    }
                    return workflowData;
                }
                /**
                 * Create the json object for generate "PurchaseRequisition" process audit file.
                 * @param {string} processID current processID delt
                 * @param {string[]} msnEXs list of msnEXs for the current processID
                 * @param {ESKMap<string>} translations Object that contains all the translations of the process
                 * @memberOf  Lib.PurchaseRequisition.ZipDoc.RecordDetails
                 */
                function InitForPurchaseRequisition(processID, msnEXs, translations) {
                    RecordDetails.Context.items = getPRDataToJSON(processID, msnEXs);
                    RecordDetails.Context.workflow = getWorkflowDataToJSON(processID, msnEXs);
                }
                RecordDetails.InitForPurchaseRequisition = InitForPurchaseRequisition;
                /**
                 * Create the json object for generate "PurchaseRequisition" process audit file.
                 * @param {xVars} transportVars [xVars]{@link https://doc.esker.com/eskerondemand/cv_ly/en/manager/Content/ProcessingScripts/xEDDAPI/xVars/xVars_Object.html} object representing the variables of the current transport
                 * @param {ESKMap<string>} translations Object that contains all the translations of the process
                 * @param {string[]} filenames list of current transport attachment filenames
                 * @param {string} md5Hash hash of the current transport
                 * @param {string[]} md5FileHashes list of hashes for each attachment of the transport
                 * @param {Sys.ZipDoc.RecordDetails.IConverterOptions} options
                 * @return {Sys.ZipDoc.RecordDetails.Details} The JSON view of the current flexible form
                 * @memberOf  Lib.PurchaseRequisition.ZipDoc.RecordDetails
                 */
                function PurchaseRequisitionToJson(transportVars, translations, filenames, md5Hash, md5FileHashes, options) {
                    var contextForCurrentPurchaseRequisition = {
                        items: null,
                        workflow: null
                    };
                    //const currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    var msnex = transportVars.GetValue_String("MSNEX", 0);
                    var isMultiShipTo = Lib.Purchasing.IsMultiShipTo();
                    var GetProcessTranslation = function (key) {
                        return Sys.ZipDoc.RecordDetails.GetProcessTranslation(translations, key);
                    };
                    if (Lib.PurchaseRequisition.ZipDoc.RecordDetails.Context.workflow[msnex]) {
                        contextForCurrentPurchaseRequisition.workflow = Lib.PurchaseRequisition.ZipDoc.RecordDetails.Context.workflow[msnex];
                    }
                    if (Lib.PurchaseRequisition.ZipDoc.RecordDetails.Context.items[msnex]) {
                        contextForCurrentPurchaseRequisition.items = Lib.PurchaseRequisition.ZipDoc.RecordDetails.Context.items[msnex];
                    }
                    var resultJson = {
                        title: "".concat(Language.Translate("_Record details"), " ").concat(GetProcessTranslation("Purchase requisition"), " id: ").concat(transportVars.GetValue_String("MSNEX", 0)),
                        categories: []
                    };
                    var companyCurrency = options.externalVars.GetValue_String("companyCurrency", 0);
                    var prCurrency = transportVars.GetValue_String("Currency__", 0);
                    var currencyDiff = companyCurrency != prCurrency;
                    resultJson.categories.push({
                        title: GetProcessTranslation("_Requisition information"),
                        fields: [
                            [
                                {
                                    t: GetProcessTranslation("_Requisition number"),
                                    v: transportVars.GetValue_String("RequisitionNumber__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_Requester name"),
                                    v: transportVars.GetValue_String("RequesterName__", 0)
                                },
                                {
                                    t: GetProcessTranslation("_TotalNetLocalCurrency") + " (" + companyCurrency + ")",
                                    v: transportVars.GetValue_String("TotalNetLocalCurrency__", 0),
                                    s: "white-space:nowrap"
                                },
                                {
                                    t: currencyDiff ? GetProcessTranslation("_Total net amount report") + " (" + prCurrency + ")" : "",
                                    v: currencyDiff ? transportVars.GetValue_String("TotalNetAmount__", 0) : ""
                                },
                                {
                                    t: GetProcessTranslation("_Reason"),
                                    v: formatMultilineText(transportVars.GetValue_String("Reason__", 0))
                                }
                            ],
                            [
                                {
                                    t: GetProcessTranslation("_Company code"),
                                    v: transportVars.GetValue_String("CompanyCode__", 0)
                                }
                            ]
                        ]
                    });
                    var shipToFields = [
                        {
                            t: GetProcessTranslation("_Ship to company"),
                            v: transportVars.GetValue_String("ShipToCompany__", 0),
                            hideInMultishipTo: true
                        },
                        {
                            t: GetProcessTranslation("_Ship to contact"),
                            v: transportVars.GetValue_String("ShipToContact__", 0)
                        },
                        {
                            t: GetProcessTranslation("_Ship to phone"),
                            v: transportVars.GetValue_String("ShipToPhone__", 0)
                        },
                        {
                            t: GetProcessTranslation("_Ship to email"),
                            v: transportVars.GetValue_String("ShipToEmail__", 0)
                        },
                        {
                            t: GetProcessTranslation("_Ship to address"),
                            v: formatMultilineText(transportVars.GetValue_String("ShipToAddress__", 0)),
                            hideInMultishipTo: true
                        }
                    ];
                    shipToFields = shipToFields
                        .filter(function (field) { return isMultiShipTo && (typeof field.hideInMultishipTo === "undefined" || !field.hideInMultishipTo) || !isMultiShipTo; })
                        .map(function (field) { return ({ t: field.t, v: field.v }); });
                    resultJson.categories.push({
                        title: GetProcessTranslation("_Ship to"),
                        fields: [shipToFields]
                    });
                    if (filenames && filenames.length > 0) {
                        resultJson.categories.push({
                            title: Language.Translate("_Record attachments"),
                            filenames: filenames,
                            hashes: md5FileHashes ? md5FileHashes.map(function (h) {
                                return {
                                    t: GetProcessTranslation("_Digital fingerprint"),
                                    v: h || ""
                                };
                            }) : null
                        });
                    }
                    if (contextForCurrentPurchaseRequisition.items && contextForCurrentPurchaseRequisition.items.length > 0) {
                        var lineItemsHeaders = [
                            GetProcessTranslation("_ItemDescription"),
                            GetProcessTranslation("_ItemRequestedDeliveryDate"),
                            GetProcessTranslation("_Item quantity"),
                            GetProcessTranslation("_Item unit price"),
                            GetProcessTranslation("_Item net amount"),
                            GetProcessTranslation("_ItemCurrency")
                        ];
                        if (isMultiShipTo) {
                            lineItemsHeaders = lineItemsHeaders.concat([
                                GetProcessTranslation("_ItemShipToCompany"),
                                GetProcessTranslation("_ItemShipToAddress")
                            ]);
                        }
                        resultJson.categories.push({
                            title: GetProcessTranslation("_Line items"),
                            tables: [
                                {
                                    headers: lineItemsHeaders,
                                    lines: contextForCurrentPurchaseRequisition.items
                                }
                            ]
                        });
                    }
                    if (contextForCurrentPurchaseRequisition.workflow && contextForCurrentPurchaseRequisition.workflow.length > 0) {
                        resultJson.categories.push({
                            title: GetProcessTranslation("_ApprovalWorkflow"),
                            tables: [
                                {
                                    headers: [
                                        GetProcessTranslation("_WRKFUserName"),
                                        GetProcessTranslation("_WRKFRole"),
                                        GetProcessTranslation("_WRKFDate"),
                                        GetProcessTranslation("_WRKFComment")
                                    ],
                                    lines: contextForCurrentPurchaseRequisition.workflow
                                }
                            ]
                        });
                    }
                    return resultJson;
                }
                RecordDetails.PurchaseRequisitionToJson = PurchaseRequisitionToJson;
            })(RecordDetails = ZipDoc.RecordDetails || (ZipDoc.RecordDetails = {}));
        })(ZipDoc = PurchaseRequisition.ZipDoc || (PurchaseRequisition.ZipDoc = {}));
    })(PurchaseRequisition = Lib.PurchaseRequisition || (Lib.PurchaseRequisition = {}));
})(Lib || (Lib = {}));
/**
 * Declaration of a specific converter to json for the process "Purchase Requisition".
 * To declare your own converter/template, in your library Lib.Custom.ZipDoc.RecordDetails, you can set another converter for process as follow:
 * Sys.ZipDoc.RecordDetails.ConvertToJson["My process name"] = myMethodReference;
 * Your converter will be run by the finalizationscript.js of the sysprocess "Zip Documents".
 * @type Sys.ZipDoc.RecordDetails.ConverterToJson
 * @memberOf Lib.PurchaseRequisition.ZipDoc.RecordDetails
 */
Sys.ZipDoc.RecordDetails.ConvertToJson["Purchase requisition V2"] = Lib.PurchaseRequisition.ZipDoc.RecordDetails.PurchaseRequisitionToJson;
Sys.ZipDoc.RecordDetails.InitFunctionsMap["Purchase requisition V2"] = Lib.PurchaseRequisition.ZipDoc.RecordDetails.InitForPurchaseRequisition;
