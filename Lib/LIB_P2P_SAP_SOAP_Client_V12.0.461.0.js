///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_P2P_SAP_SOAP_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "require": [
    "LIB_P2P_SAP_SOAP_V12.0.461.0",
    "Sys/Sys_Helpers_SAP_Client"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var SAP;
        (function (SAP) {
            var Soap;
            (function (Soap) {
                var Client;
                (function (Client) {
                    /**
                     * Convert a web service result to a QueryResult object
                     */
                    function FormatSAPQueryResult(receivedURLParameters, wsQueryResults, errorMessage) {
                        var queryResults = /** @class */ (function () {
                            function queryResults(receivedURLParametersObject, records, error) {
                                this.Records = [];
                                this.RecordsDefinition = {};
                                this.errorMessage = error;
                                this.ReceivedURLParameters = receivedURLParametersObject;
                                if (records) {
                                    this.computeRecords(records);
                                }
                            }
                            queryResults.prototype.computeRecordDefinition = function (record) {
                                // Compute the RecordDefinition from the first record
                                var recordDefinitionCount = 0;
                                for (var p in record) {
                                    if (record.hasOwnProperty(p)) {
                                        this.RecordsDefinition[p.toUpperCase()] = recordDefinitionCount;
                                        recordDefinitionCount++;
                                    }
                                }
                                return recordDefinitionCount;
                            };
                            queryResults.prototype.computeRecords = function (records) {
                                if (records && records.length > 0) {
                                    var recordDefinitionCount = this.computeRecordDefinition(records[0]);
                                    for (var i = 0; i < records.length; i++) {
                                        var wsResult = records[i];
                                        var queryRecord = new Array(recordDefinitionCount);
                                        for (var p in wsResult) {
                                            var upperCaseProperty = p.toUpperCase();
                                            if (this.RecordsDefinition.hasOwnProperty(upperCaseProperty)) {
                                                queryRecord[this.RecordsDefinition[upperCaseProperty]] = wsResult[p];
                                            }
                                        }
                                        this.Records.push(queryRecord);
                                    }
                                }
                            };
                            queryResults.prototype.GetQueryDescription = function () {
                                return null;
                            };
                            queryResults.prototype.GetQueryError = function () {
                                return this.errorMessage;
                            };
                            queryResults.prototype.GetQueryValue = function (field, index) {
                                if (typeof field == "undefined") {
                                    return this;
                                }
                                if (typeof index == "undefined") {
                                    index = 0;
                                }
                                if (typeof this.Records != "undefined" && index < this.Records.length) {
                                    var attributeIndex = this.RecordsDefinition[field.toUpperCase()];
                                    return this.Records[index][attributeIndex];
                                }
                                return null;
                            };
                            queryResults.prototype.GetRecordsCount = function () {
                                if (this.Records) {
                                    return this.Records.length;
                                }
                                return 0;
                            };
                            queryResults.prototype.GetQueryTable = function () {
                                return this.ReceivedURLParameters.TABLE;
                            };
                            return queryResults;
                        }());
                        return new queryResults(receivedURLParameters, wsQueryResults, errorMessage);
                    }
                    Client.FormatSAPQueryResult = FormatSAPQueryResult;
                    function GetWSQueryHandler(method) {
                        var func = null;
                        if (method === "Query") {
                            func = SAPQueryWS;
                        }
                        else if (method === "BAPI") {
                            func = SAPCallBapiWS;
                        }
                        return func;
                    }
                    Client.GetWSQueryHandler = GetWSQueryHandler;
                    function SAPQueryWS(queryCallback, sapConf, // for hybrid WS/RFC purpose
                    table, fields, options, rowCount, rowSkip, noData, useCache) {
                        if (noData === void 0) { noData = false; }
                        if (useCache === void 0) { useCache = null; }
                        var parametersForFormatting = {
                            FIELDS: fields,
                            NODATA: noData,
                            OPTIONS: options,
                            ROWCOUNT: rowCount,
                            ROWSKIP: rowSkip,
                            SAPCONF: "",
                            TABLE: table,
                            USECACHE: useCache,
                            DEBUG: "False",
                            WITHATTRIBUTES: "False"
                        };
                        Lib.P2P.SAP.Soap.Call_RFC_READ_TABLE_WS(table, fields, options, rowCount, rowSkip, noData, { useCache: useCache })
                            .Then(function (result) {
                            var formattedResult = Lib.P2P.SAP.Soap.Client.FormatSAPQueryResult(parametersForFormatting, result, null);
                            queryCallback.call(formattedResult);
                        })
                            .Catch(function (error) {
                            var formattedResult = Lib.P2P.SAP.Soap.Client.FormatSAPQueryResult(parametersForFormatting, null, error);
                            queryCallback.call(formattedResult);
                        });
                    }
                    Client.SAPQueryWS = SAPQueryWS;
                    function SAPCallBapiWS(sapCallBapiCallback, SAPConfiguration, bapiName, bapiParams) {
                        var bapiAlias = Lib.P2P.SAP.Soap.GetBAPIName(bapiName);
                        Lib.P2P.SAP.Soap.IsBapiConfiguredWS(bapiName, bapiAlias)
                            .Then(function (isConfiguredWS) {
                            if (isConfiguredWS) {
                                // Web service call needs bapiParams to define response structure or webservice will end in Error 500.
                                // Merge the Empty definition with parameters set in scripts
                                var resolvedBapiParams = Lib.P2P.SAP.Soap.MergeBapiParams(Lib.P2P.SAP.Soap.InitBapiParams(bapiName, bapiAlias)[bapiName], bapiParams);
                                Lib.P2P.SAP.Soap.CallSAPSOAPWS(bapiName, resolvedBapiParams, false)
                                    .Then(function (result) {
                                    sapCallBapiCallback(result ? result.response : null);
                                })
                                    .Catch(function (error) {
                                    sapCallBapiCallback(error ? error.response : null);
                                });
                            }
                            else {
                                Sys.Helpers.SAP.SetLastError("Bapis WS not configured : ".concat(bapiName, "/").concat(bapiAlias || "no alias"));
                            }
                        });
                    }
                    Client.SAPCallBapiWS = SAPCallBapiWS;
                })(Client = Soap.Client || (Soap.Client = {}));
            })(Soap = SAP.Soap || (SAP.Soap = {}));
        })(SAP = P2P.SAP || (P2P.SAP = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
