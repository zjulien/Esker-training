///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_P2P_SAP_SOAP_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Sys/Sys",
    "Sys/Sys_Helpers_Soap",
    "Sys/Sys_Parameters",
    "[Sys/Sys_ScriptInfo_Server]",
    "[Sys/Sys_ScriptInfo_Client]",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "[Sys/Sys_Helpers_Sap]",
    "[Sys/Sys_Helpers_Sap_Client]",
    "Lib_AP_SAP_V12.0.461.0"
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
                Soap.GET_BAPINAME_USER_EXIT = "Lib.AP.Customization.Common.GetBAPIName";
                // #region Private Parameters
                var configurationParameters = null;
                // #endregion
                // #region Private Enums
                var AuthMode;
                (function (AuthMode) {
                    AuthMode[AuthMode["Basic"] = 0] = "Basic";
                    AuthMode[AuthMode["OAuth"] = 1] = "OAuth";
                    AuthMode[AuthMode["Certificate"] = 2] = "Certificate";
                })(AuthMode = Soap.AuthMode || (Soap.AuthMode = {}));
                // #endregion
                // #region Public classes
                var BapiWSFunctions = /** @class */ (function () {
                    function BapiWSFunctions(bapiName, aliasBapiName) {
                        var _a;
                        this.bapiName = bapiName;
                        this.alias = aliasBapiName;
                        this.data = InitBapiParams(this.bapiName, this.alias);
                        _a = SetPoolFunctions(this.data, this.bapiName), this.ExportsPool = _a[0], this.ImportsPool = _a[1], this.TablesPool = _a[2];
                        this.UseCache = false;
                    }
                    BapiWSFunctions.prototype.Call = function () {
                        var params = JSON.parse(this.GetJsonParameters(false));
                        var dumpBAPICalls = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("DumpBAPICalls", false);
                        var response = Lib.P2P.SAP.Soap.CallSAPSOAPWSSync(this.bapiName, params, dumpBAPICalls);
                        this.SetJsonParameters(JSON.stringify(response.response));
                        if (response.status >= 200 && response.status < 400) {
                            Sys.Helpers.SAP.SetLastError("");
                            return "";
                        }
                        else {
                            Log.Verbose("WS Call Error ".concat(this.bapiName, " - ").concat(this.alias, " - ").concat(JSON.stringify(response)));
                            // Process custom error
                            if (response.response && response.response.ERRORS && response.response.ERRORS.length > 0 && response.response.ERRORS[0].err) {
                                Sys.Helpers.SAP.SetLastError(response.response.ERRORS[0].err);
                                return "HttpRequest status code: ".concat(response.status, ". Error: ").concat(response.response.ERRORS[0].err);
                            }
                            var genericError = "HttpRequest status code: ".concat(response.status, ". Error: Web service call fails.");
                            Sys.Helpers.SAP.SetLastError(genericError);
                            return genericError;
                        }
                    };
                    BapiWSFunctions.prototype.GetJsonParameters = function (indent) {
                        var data = this.data[this.bapiName];
                        if (!indent) {
                            return JSON.stringify(data);
                        }
                        else {
                            return JSON.stringify(data, null, 2);
                        }
                    };
                    BapiWSFunctions.prototype.SetJsonParameters = function (value) {
                        var _a;
                        try {
                            this.data[this.bapiName] = JSON.parse(value);
                            _a = SetPoolFunctions(this.data, this.bapiName), this.ExportsPool = _a[0], this.ImportsPool = _a[1], this.TablesPool = _a[2];
                            return true;
                        }
                        catch (error) {
                            return false;
                        }
                    };
                    BapiWSFunctions.prototype.Reset = function () {
                        var _a;
                        this.data = InitBapiParams(this.bapiName, this.alias);
                        _a = SetPoolFunctions(this.data, this.bapiName), this.ExportsPool = _a[0], this.ImportsPool = _a[1], this.TablesPool = _a[2];
                    };
                    return BapiWSFunctions;
                }());
                Soap.BapiWSFunctions = BapiWSFunctions;
                var BapiWSManager = /** @class */ (function () {
                    function BapiWSManager() {
                        this.Connected = true;
                        this.Id = null;
                    }
                    BapiWSManager.prototype.Add = function (bapiName) {
                        var overridenBAPIName = Lib.P2P.SAP.Soap.GetBAPIName(bapiName);
                        return new BapiWSFunctions(overridenBAPIName, bapiName);
                    };
                    BapiWSManager.prototype.CleanupConnection = function () {
                        throw new Error("Not Implemented");
                    };
                    BapiWSManager.prototype.CommitWork = function () {
                        return true;
                    };
                    BapiWSManager.prototype.GetLastError = function () {
                        return Sys.Helpers.SAP.GetLastError();
                    };
                    BapiWSManager.prototype.GetLastLogonError = function () {
                        return "";
                    };
                    BapiWSManager.prototype.RollbackWork = function () {
                        return true;
                    };
                    return BapiWSManager;
                }());
                Soap.BapiWSManager = BapiWSManager;
                // #endregion
                // #region Private functions
                function formatJsonFromSAP(bapiParams) {
                    /*
                        Makes a flat json where you have EXPORTS + TABLES in alphabetical order
                        Then you will have the IMPORTS fields in alphabetical order
                    */
                    var reorderData = function (data) {
                        var orderedData = {};
                        var keys = Object.keys(data);
                        keys.sort();
                        keys.forEach(function (key) {
                            orderedData[key] = data[key];
                        });
                        return orderedData;
                    };
                    var formattedBapiParams = {};
                    for (var exportObj in bapiParams.EXPORTS) {
                        formattedBapiParams[exportObj] = bapiParams.EXPORTS[exportObj];
                    }
                    for (var tableObj in bapiParams.TABLES) {
                        formattedBapiParams[tableObj] = [];
                        for (var item in bapiParams.TABLES[tableObj]) {
                            var ItemTo = {
                                item: {}
                            };
                            ItemTo.item = bapiParams.TABLES[tableObj][item];
                            formattedBapiParams[tableObj].push(ItemTo);
                        }
                    }
                    formattedBapiParams = reorderData(formattedBapiParams);
                    // IMPORTS are ignored here because they are not in WSDL envelop specification for request
                    return formattedBapiParams;
                }
                function getSOAPPrefix(json) {
                    var keys = getFirstObjectKey(json).split(":");
                    if (keys[0] === "xmlns") {
                        return keys[1];
                    }
                    else {
                        return keys[0];
                    }
                }
                function getFirstObjectKey(json) {
                    return Object.keys(json)[0];
                }
                function getBAPIResultFromJson(json) {
                    var bapiResult = {};
                    var soapPrefix = getSOAPPrefix(json);
                    /*On client side, there is a first key to cross*/
                    var commonJson = json;
                    if (json[soapPrefix + ":Envelope"]) {
                        commonJson = json[soapPrefix + ":Envelope"];
                    }
                    bapiResult = commonJson[soapPrefix + ":Body"];
                    bapiResult = bapiResult[getFirstObjectKey(bapiResult)];
                    return bapiResult;
                }
                function reformatEntryJson(json, depth) {
                    if (depth === void 0) { depth = 0; }
                    var reformattedJson = {};
                    for (var key in json) {
                        if (Object.prototype.hasOwnProperty.call(json, key)) {
                            if (typeof json[key] === "object" && json[key].hasOwnProperty("item")) {
                                if (Array.isArray(json[key]["item"])) {
                                    reformattedJson[key] = json[key]["item"];
                                }
                                else {
                                    reformattedJson[key] = [json[key]["item"]];
                                }
                            }
                            else if (typeof json[key] === "object" && json[key].hasOwnProperty("#text")) {
                                var numberWithoutZeroDecimals = json[key]["#text"].replace(/(\.[0-9]*[1-9])0+$/g, '$1').replace(/\.[0]*$/, "");
                                if (!key.match(/^MESSAGE/i) && !isNaN(Number(json[key]["#text"])) &&
                                    Number(json[key]["#text"]).toString() === numberWithoutZeroDecimals) {
                                    reformattedJson[key] = Number(json[key]["#text"]);
                                }
                                else {
                                    reformattedJson[key] = json[key]["#text"];
                                }
                            }
                            else if (depth > 0 && typeof json[key] === "object" && (Object.keys(json[key]).length === 0)) {
                                reformattedJson[key] = "";
                            }
                            else {
                                reformattedJson[key] = json[key];
                            }
                            if (typeof reformattedJson[key] === "object") {
                                if (Array.isArray(reformattedJson[key])) {
                                    reformattedJson[key] = reformattedJson[key].map(function (item) {
                                        return reformatEntryJson(item, depth + 1);
                                    });
                                }
                                else {
                                    reformattedJson[key] = reformatEntryJson(reformattedJson[key], depth + 1);
                                }
                            }
                        }
                    }
                    return reformattedJson;
                }
                function formatSoapResponseJson(json, initialBapiParams) {
                    var copiedParams = JSON.parse(JSON.stringify(initialBapiParams));
                    if (copiedParams) {
                        for (var section in copiedParams) {
                            for (var key in copiedParams[section]) {
                                copiedParams[section][key] = json.hasOwnProperty(key) ? json[key] : copiedParams[section][key];
                            }
                        }
                    }
                    else {
                        copiedParams = json;
                    }
                    return copiedParams;
                }
                function fillBapiParamsWithXmlResult(xmlResult, initialBapiParam) {
                    if (!xmlResult) {
                        return forceTablesToBeAnArray(formatSoapResponseJson({}, initialBapiParam));
                    }
                    var jsonFromXml = Sys.Helpers.Soap.GetObjectFromSoapXML(xmlResult);
                    var jsonToParse = getBAPIResultFromJson(jsonFromXml);
                    var reformattedJson = reformatEntryJson(jsonToParse);
                    var queryResult = formatSoapResponseJson(reformattedJson, initialBapiParam);
                    return forceTablesToBeAnArray(queryResult);
                }
                function forceTablesToBeAnArray(queryResult) {
                    for (var key in queryResult.TABLES) {
                        if (!Array.isArray(queryResult.TABLES[key])) {
                            queryResult.TABLES[key] = [];
                        }
                    }
                    return queryResult;
                }
                function getWSErrorMessage(responseText) {
                    // Response is empty or does not contain the faultstring tag.
                    // return a generic message
                    if (!responseText || responseText.indexOf("<faultstring") === -1) {
                        return Sys.Helpers.Promise.Create(function (resolve, error) {
                            resolve("Web Service call failed");
                        });
                    }
                    var indexOpenFault = responseText.indexOf("<faultstring");
                    var indexBeginFault = responseText.indexOf(">", indexOpenFault);
                    var indexEndFault = responseText.indexOf("</faultstring>");
                    if (indexBeginFault !== -1 &&
                        indexEndFault !== -1 &&
                        indexBeginFault + 1 < indexEndFault) {
                        var message_1 = responseText.substring(indexBeginFault + 1, indexEndFault);
                        // When Bapi raises a functional error, SAP Http modules is not handling well the response
                        // We have an error 500, and we get only the error type, error class and error code wrapped in a callstack
                        // We have to try to extract the information and we should query T100/T100C tables to retrieve associated messages.
                        var messageIdentifier = /([-ISAWE] [A-Z0-9]{1,20} [A-Z0-9]{3})/.exec(message_1);
                        if (messageIdentifier &&
                            messageIdentifier.length > 0 &&
                            messageIdentifier[0]) {
                            var _a = messageIdentifier[0].split(" "), errorLevel_1 = _a[0], errorClass_1 = _a[1], errorCode_1 = _a[2];
                            var sapQueryLanguage = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP").GetParameter("SAPWSConnectionLanguage", "0");
                            var getLangPromise_1 = Lib.P2P.SAP.Soap.Call_RFC_READ_TABLE_WS("T002", "SPRAS|LAISO", "LAISO = '".concat(Lib.AP.SAP.GetBaseLanguage(sapQueryLanguage), "'"), 1);
                            return Sys.Helpers.Promise.Create(function (resolve, error) {
                                getLangPromise_1.Then(function (result) {
                                    var bapiParams = InitBapiParams("BAPI_MESSAGE_GETDETAIL", null)['BAPI_MESSAGE_GETDETAIL'];
                                    var exports = bapiParams.EXPORTS;
                                    exports["LANGUAGE"] = result && result.length > 0 ? result[0].SPRAS : "E";
                                    exports["ID"] = errorClass_1;
                                    exports["NUMBER"] = errorCode_1;
                                    exports["TEXTFORMAT"] = errorLevel_1;
                                    Lib.P2P.SAP.Soap.CallSAPSOAPWS("BAPI_MESSAGE_GETDETAIL", bapiParams, true)
                                        .Then(function (messageDetailResult) {
                                        var _a, _b;
                                        resolve(((_b = (_a = messageDetailResult === null || messageDetailResult === void 0 ? void 0 : messageDetailResult.response) === null || _a === void 0 ? void 0 : _a.IMPORTS) === null || _b === void 0 ? void 0 : _b.MESSAGE) || "".concat(errorLevel_1, " ").concat(errorClass_1, " ").concat(errorCode_1));
                                    });
                                });
                            });
                        }
                        else {
                            return Sys.Helpers.Promise.Create(function (resolve, error) {
                                resolve(message_1);
                            });
                        }
                    }
                    return Sys.Helpers.Promise.Create(function (resolve, error) {
                        resolve("Web Service call failed");
                    });
                }
                function commonFillBapiParams(response, bapiParams) {
                    if (!Sys.ScriptInfo.IsServer()) {
                        // Client side
                        return fillBapiParamsWithXmlResult(response.responseXML, bapiParams);
                    }
                    else if (response.data) {
                        // On server side parse XML from data attribute thanks to serverside API Process.CreateXMLDOMElement
                        try {
                            var xml = Process.CreateXMLDOMElement(response.data);
                            return fillBapiParamsWithXmlResult(xml, bapiParams);
                        }
                        catch (exception) {
                            // For the webservice SOAP, the response is HTML, we can not parse to XML
                            return fillBapiParamsWithXmlResult("", bapiParams);
                        }
                    }
                    else {
                        return fillBapiParamsWithXmlResult("", bapiParams);
                    }
                }
                function isResponseEmpty(response) {
                    return (!Sys.ScriptInfo.IsServer() && !response.responseXML && !response.data) ||
                        (Sys.ScriptInfo.IsServer() && !response.data);
                }
                function getOverridenErrorBAPIResponse(status, message, initialBapiResponse) {
                    var bapiParamsResponse = initialBapiResponse;
                    bapiParamsResponse.ERRORS = [
                        {
                            code: status,
                            err: message
                        }
                    ];
                    return bapiParamsResponse;
                }
                function getErrorBAPIResponse(response, initialBapiResponse) {
                    return Sys.Helpers.Promise.Create(function (resolve, error) {
                        getWSErrorMessage(response.data).Then(function (errorMessage) {
                            var bapiParamsResponse = initialBapiResponse;
                            Log.Error(errorMessage);
                            bapiParamsResponse.ERRORS = [
                                {
                                    code: response.status,
                                    err: errorMessage
                                }
                            ];
                            resolve(bapiParamsResponse);
                        });
                    });
                }
                function getCustomErrorBAPIResponse(bapiname, reason) {
                    var bapiParamsResponse = {
                        ERRORS: [{
                                code: 500,
                                err: reason
                            }],
                        EXPORTS: {},
                        statusText: reason,
                        GetQueryError: function () {
                            return reason;
                        }
                    };
                    Log.Error(reason);
                    bapiParamsResponse.ERRORS = [
                        {
                            code: 500,
                            err: reason
                        }
                    ];
                    return bapiParamsResponse;
                }
                function resetOAuthTokenCacheIfNeeded(response) {
                    if (response.status === 401 &&
                        configurationParameters.authMode === Lib.P2P.SAP.Soap.AuthMode.OAuth &&
                        configurationParameters.authData) {
                        configurationParameters.authData.authenticationTokenCache = null;
                        configurationParameters.authData.tokenExpirationDateCache = null;
                    }
                }
                function getWrappedCallback(resolve, error, bapiParams, wsParams, debug) {
                    var normalizeToBAPIResponse = function (response, originalParams) {
                        if (debug) {
                            Log.Verbose("SOAP BAPI Response : " + JSON.stringify(response));
                        }
                        var bapiParamsResponse = commonFillBapiParams(response, bapiParams);
                        if (response.status === -12) {
                            resetOAuthTokenCacheIfNeeded(response);
                            error({
                                status: response.status,
                                response: getOverridenErrorBAPIResponse(response.status, "URL is not whitelisted.", bapiParamsResponse),
                                originalParams: originalParams
                            });
                        }
                        else if (response.status === -10) {
                            resetOAuthTokenCacheIfNeeded(response);
                            error({
                                status: response.status,
                                response: getOverridenErrorBAPIResponse(response.status, "Internal error.", bapiParamsResponse),
                                originalParams: originalParams
                            });
                        }
                        else if (isResponseEmpty(response)) {
                            resetOAuthTokenCacheIfNeeded(response);
                            error({
                                status: 500,
                                response: getOverridenErrorBAPIResponse(response.status, "Empty server response.", bapiParamsResponse),
                                originalParams: originalParams
                            });
                        }
                        else if (response.status < 200 || response.status >= 400) {
                            if (response.status === 401 && response.data.indexOf("HTTP 401") !== -1) {
                                resetOAuthTokenCacheIfNeeded(response);
                                error({
                                    status: response.status,
                                    response: getOverridenErrorBAPIResponse(response.status, "Web service call unauthorized.", bapiParamsResponse),
                                    originalParams: originalParams
                                });
                            }
                            else {
                                resetOAuthTokenCacheIfNeeded(response);
                                getErrorBAPIResponse(response, bapiParamsResponse)
                                    .Then(function (bapiParamsResponseResult) {
                                    error({
                                        status: 500,
                                        response: bapiParamsResponseResult,
                                        originalParams: originalParams
                                    });
                                });
                            }
                        }
                        else if (!Sys.ScriptInfo.IsServer() && !response.responseXML && response.data) {
                            resetOAuthTokenCacheIfNeeded(response);
                            Log.Verbose("Could not parse response as XML: ".concat(response.data));
                            error({
                                status: 500,
                                response: getOverridenErrorBAPIResponse(response.status, "Could not parse XML response.", bapiParamsResponse),
                                originalParams: originalParams
                            });
                        }
                        else {
                            resolve({
                                status: response.status,
                                response: bapiParamsResponse,
                                originalParams: originalParams
                            });
                        }
                    };
                    return function (response) {
                        normalizeToBAPIResponse(response, wsParams);
                    };
                }
                function isOAuthTokenEmptyOrExpired() {
                    if (!configurationParameters.authData ||
                        !configurationParameters.authData.authenticationTokenCache ||
                        (configurationParameters.authData.tokenExpirationDateCache &&
                            new Date() > configurationParameters.authData.tokenExpirationDateCache)) {
                        return true;
                    }
                    return false;
                }
                function doHTTPRequest(wsParams) {
                    Sys.GenericAPI.HTTPRequest(wsParams);
                }
                function doCertificateHTTPRequest(bapiName, wsParams) {
                    wsParams.targetURL = configurationParameters.authData.alias;
                    wsParams.urlName = bapiName;
                    doHTTPRequest(wsParams);
                }
                function doBasicHTTPRequest(bapiName, wsParams) {
                    wsParams.targetURL = configurationParameters.bapiURLMapping[bapiName];
                    wsParams.user = configurationParameters.authData["user"];
                    wsParams.password = configurationParameters.authData["password"];
                    wsParams.authentType = "basicaccess";
                    wsParams.noClientCertificate = true;
                    doHTTPRequest(wsParams);
                }
                function doOAuthHTTPRequest(bapiName, wsParams) {
                    wsParams.targetURL = configurationParameters.bapiURLMapping[bapiName];
                    if (isOAuthTokenEmptyOrExpired()) {
                        var getOAuthParams = {
                            method: "POST",
                            targetURL: configurationParameters.authData.endpoint,
                            callback: function (response) {
                                if (response.status !== 200) {
                                    Log.Error("OAuth Error ".concat(response.status, ". Unable to get authentication token.\n ").concat(response.data));
                                }
                                else {
                                    var tokenResponseObject = JSON.parse(response.data);
                                    configurationParameters.authData.authenticationTokenCache = tokenResponseObject.access_token;
                                    if (tokenResponseObject.expires_in) {
                                        configurationParameters.authData.tokenExpirationDateCache = new Date();
                                        configurationParameters.authData.tokenExpirationDateCache.setSeconds(configurationParameters.authData.getSeconds() + tokenResponseObject.expires_in);
                                    }
                                    // Token is now valid
                                    wsParams.headers["authorization"] = "Bearer " + configurationParameters.authData.authenticationTokenCache;
                                    wsParams["authentType"] = "bearer";
                                    doHTTPRequest(wsParams);
                                }
                            },
                            authentType: "basicaccess",
                            user: configurationParameters.authData["user"],
                            password: configurationParameters.authData["password"],
                            useUserERPCredentialsIfDefined: true,
                            headers: {
                                "Content-type": "application/x-www-form-urlencoded"
                            },
                            data: "grant_type=client_credentials",
                        };
                        Sys.GenericAPI.HTTPRequest(getOAuthParams);
                    }
                    else {
                        wsParams.headers["authorization"] = "Bearer " + configurationParameters.authData.authenticationTokenCache;
                        wsParams["authentType"] = "bearer";
                        doHTTPRequest(wsParams);
                    }
                }
                function doHTTPRequestDependingOnAuthMode(error, bapiName, wsParams) {
                    if (configurationParameters.authMode === AuthMode.Certificate) {
                        doCertificateHTTPRequest(bapiName, wsParams);
                    }
                    else if (!configurationParameters.bapiURLMapping[bapiName]) {
                        error({
                            status: 401,
                            response: getCustomErrorBAPIResponse(bapiName, "Could not find ".concat(bapiName, " in the configuration mapping, abort query")),
                            originalParams: wsParams
                        });
                    }
                    else if (configurationParameters.authMode === AuthMode.Basic) {
                        doBasicHTTPRequest(bapiName, wsParams);
                    }
                    else if (configurationParameters.authMode === AuthMode.OAuth) {
                        doOAuthHTTPRequest(bapiName, wsParams);
                    }
                    else {
                        error({
                            status: 401,
                            response: getCustomErrorBAPIResponse(bapiName, "Invalid auth mode, abort query"),
                            originalParams: wsParams
                        });
                    }
                }
                function getWSParamsInternal(resolve, bapiName, bapiParams) {
                    var data = formatJsonFromSAP(bapiParams);
                    var envelope = Sys.Helpers.Soap.GetSoapString(Sys.Helpers.Soap.GetSoapObject({
                        type: "json",
                        method: "".concat(configurationParameters === null || configurationParameters === void 0 ? void 0 : configurationParameters.namespaceQualifier, ":").concat(bapiName),
                        namespaceQualifier: configurationParameters === null || configurationParameters === void 0 ? void 0 : configurationParameters.namespaceQualifier,
                        namespaceURL: configurationParameters === null || configurationParameters === void 0 ? void 0 : configurationParameters.namespaceURL,
                        prefix: "",
                        data: data
                    }));
                    var wsParams = {
                        method: configurationParameters === null || configurationParameters === void 0 ? void 0 : configurationParameters.method,
                        useUserERPCredentialsIfDefined: configurationParameters === null || configurationParameters === void 0 ? void 0 : configurationParameters.useUserERPCredentialsIfDefined,
                        data: envelope,
                        headers: configurationParameters === null || configurationParameters === void 0 ? void 0 : configurationParameters.headers
                    };
                    resolve(wsParams);
                }
                function getWSParams(bapiName, bapiParams) {
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        if (!configurationParameters) {
                            Lib.P2P.SAP.Soap.InitInternalParametersFromConfigurator()
                                .Then(function () {
                                getWSParamsInternal(resolve, bapiName, bapiParams);
                            });
                        }
                        else {
                            getWSParamsInternal(resolve, bapiName, bapiParams);
                        }
                    });
                }
                function generateWSRfcReadTableJsonParams(tableName, fieldNames, filters, rowcount, rowSkip, noData, jsonOptions) {
                    if (rowSkip === void 0) { rowSkip = 0; }
                    if (noData === void 0) { noData = false; }
                    if (jsonOptions === void 0) { jsonOptions = null; }
                    var splitFilters = function (filtersParam) {
                        var keywords = [" AND ", " OR "];
                        var arrayFilters = [];
                        var stringFilters = filtersParam.replace(/\|/g, '\n');
                        for (var _i = 0, keywords_1 = keywords; _i < keywords_1.length; _i++) {
                            var keyword = keywords_1[_i];
                            arrayFilters = stringFilters.split(keyword);
                            stringFilters = arrayFilters.join("\n".concat(keyword));
                        }
                        // Splits in groups of 70 characters or less. Systematically splits at new lines.
                        var regexp = new RegExp('.{1,70}', 'g');
                        var regexpMatch = regexp.exec(stringFilters);
                        arrayFilters = [];
                        while (regexpMatch !== null) {
                            arrayFilters.push(regexpMatch[0]);
                            regexpMatch = regexp.exec(stringFilters);
                        }
                        return arrayFilters.map(function (filter) {
                            return { 'TEXT': filter.trim() };
                        });
                    };
                    var data = {};
                    data.TABLES = {};
                    data.EXPORTS = {};
                    if (rowcount && rowcount >= 0) {
                        data.EXPORTS.ROWCOUNT = rowcount;
                    }
                    if (rowSkip && rowSkip >= 0) {
                        data.EXPORTS.ROWSKIPS = rowSkip;
                    }
                    if (noData) {
                        data.EXPORTS.NO_DATA = noData[0];
                    }
                    data.EXPORTS.QUERY_TABLE = tableName;
                    data.TABLES.DATA = {};
                    data.TABLES.FIELDS = [];
                    data.TABLES.OPTIONS = {};
                    data.USECACHE = jsonOptions && jsonOptions.useCache;
                    if (fieldNames) {
                        var aFieldsName = fieldNames.split("|");
                        for (var _i = 0, aFieldsName_1 = aFieldsName; _i < aFieldsName_1.length; _i++) {
                            var fieldName = aFieldsName_1[_i];
                            // Special case for SPRAS, in the P2P package sometime we ask the SPRAS1 field
                            // The SAPQuery.ashx page catches this field to ask the SAPProxy to resolve lang code before doing the RFC call
                            // In webservice, to ease code migration, we handle this in javascript instead
                            // SPRAS1 does not exist in SAP, asking SPRAS1 will result to a 500 response,
                            // so must must ensure we unapply this specific field and ask to SAP field SPRAS instead
                            if (fieldName.toLowerCase() === "spras1") {
                                data.TABLES.FIELDS.push({ "FIELDNAME": "SPRAS" });
                            }
                            else {
                                data.TABLES.FIELDS.push({ "FIELDNAME": fieldName });
                            }
                        }
                    }
                    return Sys.Helpers.Promise.Create(function (resolve, reject) {
                        Lib.P2P.SAP.Soap.RfcReadTableResolveFilter(filters)
                            .Then(function (resolvedFilter) {
                            if (resolvedFilter) {
                                data.TABLES.OPTIONS = splitFilters(resolvedFilter);
                            }
                            resolve(data);
                        });
                    });
                }
                function parseRFCReadTableResult(jsonResult) {
                    if (!jsonResult.ERRORS || jsonResult.ERRORS.length === 0) {
                        var result = [];
                        for (var _i = 0, _a = jsonResult.TABLES.DATA; _i < _a.length; _i++) {
                            var dataStruct = _a[_i];
                            var idx = 0;
                            var data = dataStruct.WA;
                            // data could be already cast as number, but here we want to work on fields as string
                            if (data &&
                                typeof data === "number") {
                                data = data.toString();
                            }
                            var item = {};
                            for (var _b = 0, _c = jsonResult.TABLES.FIELDS; _b < _c.length; _b++) {
                                var field = _c[_b];
                                var len = parseInt(field.LENGTH, 10);
                                var fieldValue = data.substr(idx, len);
                                idx += len;
                                item[field.FIELDNAME] = trimField(fieldValue);
                            }
                            result.push(item);
                        }
                        return result;
                    }
                    Sys.Helpers.SAP.SetLastError(jsonResult.ERRORS[0].err);
                    return null;
                }
                function trimField(fieldValue) {
                    return fieldValue && /\S/.test(fieldValue) ?
                        Sys.Helpers.String.Trim(fieldValue, " ", Sys.Helpers.String.TRIM_BOTH) : "";
                }
                function addTableFunctions(data, bapiName) {
                    var params = data[bapiName].TABLES;
                    params.Get = function (name) {
                        if (!params[name]) {
                            params[name] = [];
                            var currentTable_1 = params[name];
                            currentTable_1.AddNew = function () {
                                var index = params[name].length;
                                params[name].push({
                                    SetValue: function (key, value) {
                                        params[name][index][key] = value;
                                    },
                                    GetValue: function (key) {
                                        return currentTable_1[index][key];
                                    }
                                });
                                return params[name][index];
                            };
                        }
                        return params[name];
                    };
                    addInnerTableFunctions();
                    function addInnerTableFunctions() {
                        var _loop_1 = function (tableKey) {
                            var currentTable = params[tableKey];
                            // eslint-disable-next-line no-loop-func
                            currentTable.AddNew = function () {
                                var index = currentTable.length;
                                currentTable.push({
                                    SetValue: function (key, value) {
                                        currentTable[index][key] = value;
                                    },
                                    GetValue: function (key) {
                                        return currentTable[index][key];
                                    }
                                });
                                return currentTable[index];
                            };
                            Object.defineProperty(currentTable, "Count", {
                                // eslint-disable-next-line no-loop-func
                                get: function () {
                                    return currentTable.length;
                                }
                            });
                            // eslint-disable-next-line no-loop-func
                            currentTable.GetValue = function (idx, key) {
                                // Idx is 1-based
                                if (idx >= 1 && idx <= currentTable.length) {
                                    return currentTable[idx - 1][key];
                                }
                                return null;
                            };
                            // eslint-disable-next-line no-loop-func
                            currentTable.Get = function (idx) {
                                // Idx is 1-based
                                if (idx >= 0 && idx < currentTable.length) {
                                    var currentItem_1 = currentTable[idx];
                                    currentItem_1.GetValue = function (key) { return currentItem_1[key]; };
                                    return currentItem_1;
                                }
                                return null;
                            };
                        };
                        // eslint-disable-next-line guard-for-in
                        for (var tableKey in params) {
                            _loop_1(tableKey);
                        }
                    }
                    return params;
                }
                function addImportFunctions(data, bapiName) {
                    var params = data[bapiName].IMPORTS;
                    params.Get = function (name) {
                        return params[name];
                    };
                    params.GetValue = function (name) {
                        return params[name];
                    };
                    params.SetValue = function (key, value) {
                        params[key] = value;
                    };
                    var _loop_2 = function (importKey) {
                        var curParams = params[importKey];
                        curParams.Get = function (name) {
                            return curParams[name];
                        };
                        curParams.GetValue = function (name) {
                            return curParams[name];
                        };
                        curParams.SetValue = function (key, value) {
                            curParams[key] = value;
                        };
                    };
                    for (var importKey in params) {
                        _loop_2(importKey);
                    }
                    return params;
                }
                function addExportFunctions(data, bapiName) {
                    var params = data[bapiName].EXPORTS;
                    params["Get"] = function (name) {
                        return params[name];
                    };
                    params.Set = function (key, value) {
                        params[key] = value;
                    };
                    params.SetValue = function (key, value) {
                        params[key] = value;
                    };
                    var _loop_3 = function (exportKey) {
                        var curParams = params[exportKey];
                        if (!curParams) {
                            return "continue";
                        }
                        curParams["Get"] = function (name) {
                            return curParams[name];
                        };
                        curParams.Set = function (key, value) {
                            curParams[key] = value;
                        };
                        curParams.SetValue = function (key, value) {
                            curParams[key] = value;
                        };
                    };
                    for (var exportKey in params) {
                        _loop_3(exportKey);
                    }
                    return params;
                }
                function initInternalParametersFromConfiguratorInternal() {
                    function initInternalParametersFromConfiguratorInternalResolveFunc(resolve, p2pParameters, parameters, toParse) {
                        try {
                            parameters.bapiURLMapping = JSON.parse(toParse);
                        }
                        catch (err) {
                            Log.Error("Could not init SAP SOAP parameters, ".concat(err.message, ". ").concat(toParse));
                            resolve(null);
                            return;
                        }
                        parameters.authData = {};
                        parameters.authData.user = p2pParameters.GetParameter("SAPWSUser", "");
                        parameters.authData.password = p2pParameters.GetParameter("SAPWSPwd", "");
                        // Mode certificate
                        if (p2pParameters.GetParameter("SAPWSUseAlias", "0") === "1") {
                            parameters.authMode = Lib.P2P.SAP.Soap.AuthMode.Certificate;
                            parameters.authData.alias = p2pParameters.GetParameter("SAPWSAlias", "0");
                        }
                        // Mode OAuth
                        else if (p2pParameters.GetParameter("SAPWSTokenRequestURL", "")) {
                            parameters.authMode = Lib.P2P.SAP.Soap.AuthMode.OAuth;
                            parameters.authData.endpoint = p2pParameters.GetParameter("SAPWSTokenRequestURL", "");
                            parameters.authData.authenticationTokenCache = null;
                            parameters.authData.tokenExpirationDateCache = null;
                        }
                        // Mode Basic Auth
                        else {
                            parameters.authMode = Lib.P2P.SAP.Soap.AuthMode.Basic;
                        }
                        resolve(parameters);
                    }
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        if (!Lib.AP.SAP.UsesWebServices()) {
                            resolve(null);
                            return;
                        }
                        var parameters = {
                            bapiURLMapping: {},
                            namespaceQualifier: "urn",
                            namespaceURL: "urn:sap-com:document:sap:rfc:functions",
                            method: "POST",
                            useUserERPCredentialsIfDefined: true,
                            headers: {
                                "Content-Type": "text/xml; charset=utf-8",
                                "SOAPAction": "http://sap.com/xi/WebService/soap1.1"
                            },
                            authMode: Lib.P2P.SAP.Soap.AuthMode.Basic,
                            authData: null
                        };
                        var p2pParameters = Sys.Parameters.GetInstanceFromProcessVariable("CurrentConfigurationInstance", "AP");
                        var SAPWSMapping = p2pParameters.GetParameter("SAPWSMapping", "");
                        var toParse = "{".concat(SAPWSMapping, "}");
                        // special case when we read the maximum value returned by Elastic search
                        // http://webdoc:8080/eskerondemand/nv/en/manager/StartPage.htm#htmlpagescript/query/dbquery.html?Highlight=4096
                        if ((SAPWSMapping === null || SAPWSMapping === void 0 ? void 0 : SAPWSMapping.length) === 4096) {
                            var configurationName = p2pParameters.GetParameter("ConfigurationName", null) || Variable.GetValueAsString("Configuration");
                            Sys.GenericAPI.PromisedQuery({
                                table: Variable.GetValueAsString("ConfigurationTableName") || 'AP - Application Settings__',
                                filter: "ConfigurationName__=".concat(configurationName),
                                attributes: ["SAPWSMapping__"],
                                maxRecords: 1,
                                additionalOptions: "FastSearch=-1"
                            }).Then(function (result) {
                                if (result.length === 1) {
                                    try {
                                        var originalTableParameters = Variable.GetValueAsString("tableParameters");
                                        var parsedTableParameters = JSON.parse(originalTableParameters);
                                        parsedTableParameters.sapwsmapping = result[0].SAPWSMapping__;
                                        Variable.SetValueAsString("tableParameters", JSON.stringify(parsedTableParameters));
                                        toParse = "{".concat(result[0].SAPWSMapping__, "}");
                                        initInternalParametersFromConfiguratorInternalResolveFunc(resolve, p2pParameters, parameters, toParse);
                                    }
                                    catch (e) {
                                        Log.Error("Could not init SAP SOAP parameters, ".concat(e.message, ". Found a SAPWSMapping__ with postgres to bypass the 4096 limit. But could not parse original tableParameters."));
                                        resolve(null);
                                        return;
                                    }
                                }
                            })
                                .Catch(function (err) {
                                Log.Error("Could not init SAP SOAP parameters from postgres, ".concat(err, "."));
                                resolve(null);
                            });
                        }
                        else {
                            initInternalParametersFromConfiguratorInternalResolveFunc(resolve, p2pParameters, parameters, toParse);
                        }
                    });
                }
                // #endregion
                // #region Public Functions
                function InitInternalParametersFromConfigurator() {
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        initInternalParametersFromConfiguratorInternal()
                            .Then(function (result) {
                            configurationParameters = result;
                            resolve();
                        });
                    });
                }
                Soap.InitInternalParametersFromConfigurator = InitInternalParametersFromConfigurator;
                function ResetInternalParameters() {
                    configurationParameters = null;
                }
                Soap.ResetInternalParameters = ResetInternalParameters;
                function OverrideInternalParameters(newConfigurationParameters) {
                    configurationParameters = newConfigurationParameters;
                }
                Soap.OverrideInternalParameters = OverrideInternalParameters;
                function CallSAPSOAPWS(bapiName, bapiParams, debug) {
                    if (debug === void 0) { debug = false; }
                    var that = this;
                    return Sys.Helpers.Promise.Create(function (resolve, error) {
                        getWSParams(bapiName, bapiParams)
                            .Then(function (wsParams) {
                            wsParams["callback"] = getWrappedCallback.call(that, resolve, error, bapiParams, wsParams, debug);
                            wsParams.logRequestParams = debug;
                            doHTTPRequestDependingOnAuthMode(error, bapiName, wsParams);
                        });
                    });
                }
                Soap.CallSAPSOAPWS = CallSAPSOAPWS;
                function IsBapiConfiguredWS(bapiName, bapialias) {
                    function IsBapiConfiguredWSInternal(resolve) {
                        if (!configurationParameters || !configurationParameters.bapiURLMapping) {
                            resolve(false);
                            return;
                        }
                        resolve(Object.keys(configurationParameters.bapiURLMapping).indexOf(bapiName) !== -1 ||
                            (bapialias &&
                                Object.keys(configurationParameters.bapiURLMapping).indexOf(bapialias) !== -1));
                    }
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        if (!configurationParameters) {
                            Lib.P2P.SAP.Soap.InitInternalParametersFromConfigurator()
                                .Then(function () {
                                IsBapiConfiguredWSInternal(resolve);
                            });
                        }
                        else {
                            IsBapiConfiguredWSInternal(resolve);
                        }
                    });
                }
                Soap.IsBapiConfiguredWS = IsBapiConfiguredWS;
                function Call_RFC_READ_TABLE_WS(tableName, fieldNames, filters, rowcount, rowSkip, noData, jsonOptions, debug) {
                    if (rowSkip === void 0) { rowSkip = 0; }
                    if (noData === void 0) { noData = false; }
                    if (jsonOptions === void 0) { jsonOptions = null; }
                    if (debug === void 0) { debug = false; }
                    return generateWSRfcReadTableJsonParams(tableName, fieldNames, filters, rowcount, rowSkip, noData, jsonOptions).Then(function (jsonBapiParams) {
                        return Lib.P2P.SAP.Soap.CallSAPSOAPWS(Lib.P2P.SAP.Soap.GetBAPIName("RFC_READ_TABLE"), jsonBapiParams, debug).Then(function (result) {
                            return parseRFCReadTableResult(result.response);
                        }).Catch(function (result) {
                            return parseRFCReadTableResult(result.response);
                        });
                    });
                }
                Soap.Call_RFC_READ_TABLE_WS = Call_RFC_READ_TABLE_WS;
                function SetPoolFunctions(data, bapiName) {
                    return [addExportFunctions(data, bapiName),
                        addImportFunctions(data, bapiName),
                        addTableFunctions(data, bapiName)];
                }
                Soap.SetPoolFunctions = SetPoolFunctions;
                function GetBAPIName(originalBapiName) {
                    var customBapiName = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetBAPIName", originalBapiName);
                    if (customBapiName) {
                        return customBapiName;
                    }
                    if (!Lib.AP.SAP.UsesWebServices()) {
                        return originalBapiName;
                    }
                    switch (originalBapiName) {
                        case "BAPI_ACC_DOCUMENT_POST":
                            customBapiName = "Z_BAPI_ACC_DOCUMENT_POST_COM";
                            break;
                        case "BAPI_ACC_PYMNTBLK_UPDATE_POST":
                            customBapiName = "Z_ACC_PYMNTBLK_UPDATE_POST_COM";
                            break;
                        case "BAPI_INCOMINGINVOICE_CREATE":
                            customBapiName = "Z_BAPI_IN_INVOICE_CREATE_COM";
                            break;
                        case "BAPI_INCOMINGINVOICE_RELEASE":
                            customBapiName = "Z_BAPI_IN_INVOICE_RELEASE_COM";
                            break;
                        case "BAPI_GOODSMVT_CANCEL":
                            customBapiName = "Z_BAPI_GOODSMVT_CANCEL_COM";
                            break;
                        case "BAPI_GOODSMVT_CREATE":
                            customBapiName = "Z_BAPI_GOODSMVT_CREATE_COM";
                            break;
                        case "BAPI_PO_CHANGE":
                            customBapiName = "Z_BAPI_PO_CHANGE_COM";
                            break;
                        case "BAPI_PO_CREATE1":
                            customBapiName = "Z_BAPI_PO_CREATE1_COM";
                            break;
                        case "BAPI_REL_CREATERELATION":
                            customBapiName = "Z_BAPI_REL_CREATERELATION_COM";
                            break;
                        case "RFC_READ_TABLE":
                            customBapiName = "Z_ESK_RFC_READ_TABLE";
                            break;
                        case "SO_FOLDER_ROOT_ID_GET":
                            customBapiName = "SO_FOLDER_ROOT_ID_GET";
                            break;
                        case "SO_OBJECT_INSERT":
                            customBapiName = "Z_SO_OBJECT_INSERT_COM";
                            break;
                        default:
                            customBapiName = originalBapiName;
                            break;
                    }
                    return customBapiName;
                }
                Soap.GetBAPIName = GetBAPIName;
                function InitBapiParams(bapiName, alias) {
                    var data = {};
                    var bapiConstParameters;
                    // We init bapi params thanks to alias
                    // But alias is not mandatory so we must init params from bapiname if alias is not set
                    // Example :
                    // bapiname = Z_BAPI_ACC_DOCUMENT_DO_COMMIT
                    // alias = BAPI_ACC_DOCUMENT <= This is the name expected in the packages.
                    //
                    // Another example without alias
                    // bapiName = RFC_READ_TABLE <= We want to init parameters from the bapiName
                    // alias = undefined
                    var strBapiName = alias || bapiName;
                    switch (strBapiName) {
                        case "BAPI_ACC_DOCUMENT_CHECK":
                            bapiConstParameters = {
                                EXPORTS: {
                                    DOCUMENTHEADER: {
                                        OBJ_TYPE: "",
                                        OBJ_KEY: "",
                                        OBJ_SYS: "",
                                        BUS_ACT: "",
                                        USERNAME: "",
                                        HEADER_TXT: "",
                                        COMP_CODE: "",
                                        DOC_DATE: "",
                                        PSTNG_DATE: "",
                                        TRANS_DATE: "",
                                        FISC_YEAR: "",
                                        FIS_PERIOD: "",
                                        DOC_TYPE: "",
                                        REF_DOC_NO: "",
                                        AC_DOC_NO: "",
                                        OBJ_KEY_R: "",
                                        REASON_REV: "",
                                        COMPO_ACC: "",
                                        REF_DOC_NO_LONG: "",
                                        ACC_PRINCIPLE: "",
                                        NEG_POSTNG: "",
                                        OBJ_KEY_INV: "",
                                        BILL_CATEGORY: "",
                                        VATDATE: "",
                                        INVOICE_REC_DATE: "",
                                        ECS_ENV: "",
                                    },
                                    CUSTOMERCPD: {},
                                    CONTRACTHEADER: {},
                                },
                                IMPORTS: {},
                                TABLES: {
                                    ACCOUNTGL: [],
                                    ACCOUNTRECEIVABLE: [],
                                    ACCOUNTPAYABLE: [],
                                    ACCOUNTTAX: [],
                                    CURRENCYAMOUNT: [],
                                    CRITERIA: [],
                                    VALUEFIELD: [],
                                    EXTENSION1: [],
                                    RETURN: [],
                                    PAYMENTCARD: [],
                                    CONTRACTITEM: [],
                                    EXTENSION2: [],
                                    REALESTATE: [],
                                    ACCOUNTWT: []
                                }
                            };
                            break;
                        case "BAPI_ACC_DOCUMENT_POST":
                        case "BAPI_ACC_DOCUMENT":
                            bapiConstParameters = {
                                EXPORTS: {
                                    CONTRACTHEADER: {},
                                    CUSTOMERCPD: {},
                                    DOCUMENTHEADER: {}
                                },
                                IMPORTS: {
                                    OBJ_TYPE: "",
                                    OBJ_KEY: "",
                                    OBJ_SYS: ""
                                },
                                TABLES: {
                                    ACCOUNTGL: [],
                                    ACCOUNTRECEIVABLE: [],
                                    ACCOUNTPAYABLE: [],
                                    ACCOUNTTAX: [],
                                    CURRENCYAMOUNT: [],
                                    CRITERIA: [],
                                    VALUEFIELD: [],
                                    EXTENSION1: [],
                                    RETURN: [],
                                    PAYMENTCARD: [],
                                    CONTRACTITEM: [],
                                    EXTENSION2: [],
                                    REALESTATE: [],
                                    ACCOUNTWT: [],
                                }
                            };
                            break;
                        case "BAPI_ACC_PYMNTBLK_UPDATE_POST":
                            bapiConstParameters = {
                                EXPORTS: {
                                    REFERENCEINV: {}
                                },
                                IMPORTS: {},
                                TABLES: {
                                    RETURN: []
                                }
                            };
                            break;
                        case "BAPI_BUSINESSAREA_GETLIST":
                            bapiConstParameters = {
                                EXPORTS: {
                                    LANGUAGE: "",
                                    LANGUAGE_ISO: ""
                                },
                                IMPORTS: {},
                                TABLES: {
                                    BUSINESSAREA_LIST: {}
                                }
                            };
                            break;
                        case "BAPI_COMPANYCODE_GET_PERIOD":
                            bapiConstParameters = {
                                EXPORTS: {
                                    COMPANYCODEID: "",
                                    POSTING_DATE: ""
                                },
                                IMPORTS: {
                                    FISCAL_PERIOD: "",
                                    FISCAL_YEAR: "",
                                    RETURN: {}
                                },
                                TABLES: {}
                            };
                            break;
                        case "BAPI_GL_ACC_GETDETAIL":
                            bapiConstParameters = {
                                EXPORTS: {
                                    COMPANYCODE: "",
                                    GLACCT: "",
                                    LANGUAGE: "",
                                    TEXT_ONLY: ""
                                },
                                IMPORTS: {
                                    RETURN: {},
                                    ACCOUNT_DETAIL: {
                                        COMP_CODE: "",
                                        GL_ACCOUNT: "",
                                        SHORT_TEXT: "",
                                        LONG_TEXT: "",
                                        CHRT_ACCTS: "",
                                        BS_ACCOUNT: "",
                                        PL_ACCOUNT: "",
                                        ACCT_CURR: "",
                                        ACCT_CURR_ISO: "",
                                        TAX_CODE: "",
                                        NO_TAX_REQUIRED: ""
                                    }
                                },
                                TABLES: {},
                                USECACHE: null
                            };
                            break;
                        case "BAPI_GL_ACC_GETLIST":
                            bapiConstParameters = {
                                EXPORTS: {
                                    COMPANYCODE: "",
                                    LANGUAGE: "",
                                    LANGUAGE_ISO: ""
                                },
                                IMPORTS: {
                                    RETURN: {}
                                },
                                TABLES: {
                                    ACCOUNT_LIST: {
                                        COMP_CODE: "",
                                        GL_ACCOUNT: "",
                                        SHORT_TEXT: "",
                                        LONG_TEXT: ""
                                    }
                                },
                                USECACHE: null
                            };
                            break;
                        case "BAPI_INCOMINGINVOICE_CREATE":
                        case "BAPI_INCOMINGINVOICE":
                            bapiConstParameters = {
                                EXPORTS: {
                                    HEADERDATA: {},
                                    ADDRESSDATA: {},
                                    OILDATA: {}
                                },
                                IMPORTS: {
                                    INVOICEDOCNUMBER: {},
                                    FISCALYEAR: {}
                                },
                                TABLES: {
                                    ITEMDATA: [],
                                    ACCOUNTINGDATA: [],
                                    GLACCOUNTDATA: [],
                                    MATERIALDATA: [],
                                    TAXDATA: [],
                                    WITHTAXDATA: [],
                                    VENDORITEMSPLITDATA: [],
                                    RETURN: [],
                                    EXTENSIONIN: [],
                                    NFMETALLITMS: []
                                }
                            };
                            break;
                        case "BAPI_INCOMINGINVOICE_RELEASE":
                            bapiConstParameters = {
                                EXPORTS: {
                                    INVOICEDOCNUMBER: {},
                                    FISCALYEAR: {},
                                    DISCOUNT_SHIFT: {},
                                },
                                IMPORTS: {},
                                TABLES: {
                                    RETURN: []
                                }
                            };
                            break;
                        case "BAPI_INCOMINGINVOICE_GETDETAIL":
                            bapiConstParameters = {
                                EXPORTS: {
                                    INVOICEDOCNUMBER: {},
                                    FISCALYEAR: {},
                                },
                                IMPORTS: {
                                    HEADERDATA: {},
                                    ADDRESSDATA: {},
                                },
                                TABLES: {
                                    ACCOUNTINGDATA: [],
                                    EXTENSIONOUT: [],
                                    GLACCOUNTDATA: [],
                                    ITEMDATA: [],
                                    RETURN: [],
                                    TAXDATA: [],
                                    TMDATA: [],
                                    VENDORITEMSPLITDATA: [],
                                    WITHTAXDATA: [],
                                }
                            };
                            break;
                        case "BAPI_MESSAGE_GETDETAIL":
                            bapiConstParameters = {
                                EXPORTS: {
                                    ID: "",
                                    NUMBER: "",
                                    LANGUAGE: "",
                                    TEXTFORMAT: "",
                                    LINKPATTERN: "",
                                    MESSAGE_V1: "",
                                    MESSAGE_V2: "",
                                    MESSAGE_V3: "",
                                    MESSAGE_V4: ""
                                },
                                IMPORTS: {
                                    MESSAGE: {},
                                    RETURN: {}
                                },
                                TABLES: {
                                    TEXT: {}
                                }
                            };
                            break;
                        case "BAPI_PO_GETDETAIL":
                            bapiConstParameters = {
                                EXPORTS: {
                                    PURCHASEORDER: "",
                                    ACCOUNT_ASSIGNMENT: "",
                                    CONFIRMATIONS: "",
                                    EXTENSIONS: "",
                                    HEADER_TEXTS: "",
                                    HISTORY: "",
                                    ITEMS: "",
                                    ITEM_TEXTS: "",
                                    SCHEDULES: "",
                                    SERVICES: "",
                                    SERVICE_TEXTS: ""
                                },
                                IMPORTS: {
                                    PO_ADDRESS: {
                                        ADDRNUMBER: "",
                                        ADDRHANDLE: "",
                                        NATION: "",
                                        DATE: "",
                                        DATE_FROM: "",
                                        DATE_TO: "",
                                        TITLE: "",
                                        NAME1: "",
                                        NAME2: "",
                                        NAME3: "",
                                        NAME4: "",
                                        NAME_TXT: "",
                                        NAME_CO: "",
                                        CITY1: "",
                                        CITY2: "",
                                        CITY_CODE: "",
                                        CITYP_CODE: "",
                                        CHCKSTATUS: "",
                                        POST_CODE1: "",
                                        POST_CODE2: "",
                                        POST_CODE3: "",
                                        PO_BOX: "",
                                        PO_BOX_NUM: "",
                                        PO_BOX_LOC: "",
                                        CITY_CODE2: "",
                                        PO_BOX_REG: "",
                                        PO_BOX_CTY: "",
                                        POSTALAREA: "",
                                        TRANSPZONE: "",
                                        STREET: "",
                                        STREETCODE: "",
                                        STREETABBR: "",
                                        HOUSE_NUM1: "",
                                        HOUSE_NUM2: "",
                                        HOUSE_NUM3: "",
                                        STR_SUPPL1: "",
                                        STR_SUPPL2: "",
                                        LOCATION: "",
                                        BUILDING: "",
                                        FLOOR: "",
                                        ROOMNUMBER: "",
                                        COUNTRY: "",
                                        LANGU: "",
                                        REGION: "",
                                        SORT1: "",
                                        SORT2: "",
                                        SORT_PHN: "",
                                        ADDRORIGIN: "",
                                        EXTENSION1: "",
                                        EXTENSION2: "",
                                        TIME_ZONE: "",
                                        TAXJURCODE: "",
                                        ADDRESS_ID: "",
                                        REMARK: "",
                                        DEFLT_COMM: "",
                                        TEL_NUMBER: "",
                                        TEL_EXTENS: "",
                                        FAX_NUMBER: "",
                                        FAX_EXTENS: "",
                                        BUILD_LONG: "",
                                    },
                                    PO_HEADER: {
                                        PO_NUMBER: "",
                                        CO_CODE: "",
                                        DOC_CAT: "",
                                        DOC_TYPE: "",
                                        CNTRL_IND: "",
                                        DELETE_IND: "",
                                        STATUS: "",
                                        CREATED_ON: "",
                                        CREATED_BY: "",
                                        ITEM_INTVL: "",
                                        LAST_ITEM: "",
                                        VENDOR: "",
                                        LANGUAGE: "",
                                        PMNTTRMS: "",
                                        DSCNT1_TO: 0,
                                        DSCNT2_TO: 0,
                                        DSCNT3_TO: 0,
                                        CASH_DISC1: 0,
                                        CASH_DISC2: 0,
                                        PURCH_ORG: "",
                                        PUR_GROUP: "",
                                        CURRENCY: "",
                                        EXCH_RATE: 0,
                                        EX_RATE_FX: "",
                                        DOC_DATE: "",
                                        VPER_START: "",
                                        VPER_END: "",
                                        APPLIC_BY: "",
                                        QUOT_DEAD: "",
                                        BINDG_PER: "",
                                        WARRANTY: "",
                                        BIDINV_NO: "",
                                        QUOTATION: "",
                                        QUOT_DATE: "",
                                        REF_1: "",
                                        SALES_PERS: "",
                                        TELEPHONE: "",
                                        SUPPL_VEND: "",
                                        CUSTOMER: "",
                                        AGREEMENT: "",
                                        REJ_REASON: "",
                                        COMPL_DLV: "",
                                        GR_MESSAGE: "",
                                        SUPPL_PLNT: "",
                                        RCVG_VEND: "",
                                        INCOTERMS1: "",
                                        INCOTERMS2: "",
                                        TARGET_VAL: 0,
                                        COLL_NO: "",
                                        DOC_COND: "",
                                        PROCEDURE: "",
                                        UPDATE_GRP: "",
                                        DIFF_INV: "",
                                        EXPORT_NO: "",
                                        OUR_REF: "",
                                        LOGSYSTEM: "",
                                        SUBITEMINT: "",
                                        MAST_COND: "",
                                        REL_GROUP: "",
                                        REL_STRAT: "",
                                        REL_IND: "",
                                        REL_STATUS: "",
                                        SUBJ_TO_R: "",
                                        TAXR_CNTRY: "",
                                        SCHED_IND: "",
                                        VEND_NAME: "",
                                        CURRENCY_ISO: "",
                                        EXCH_RATE_CM: 0,
                                        HOLD: ""
                                    }
                                },
                                TABLES: {
                                    EXTENSIONOUT: [],
                                    PO_HEADER_TEXTS: [],
                                    PO_ITEMS: [],
                                    PO_ITEM_ACCOUNT_ASSIGNMENT: [],
                                    PO_ITEM_CONFIRMATIONS: [],
                                    PO_ITEM_CONTRACT_LIMITS: [],
                                    PO_ITEM_HISTORY: [],
                                    PO_ITEM_HISTORY_TOTALS: [],
                                    PO_ITEM_LIMITS: [],
                                    PO_ITEM_SCHEDULES: [],
                                    PO_ITEM_SERVICES: [],
                                    PO_ITEM_SRV_ACCASS_VALUES: [],
                                    PO_ITEM_TEXTS: [],
                                    PO_SERVICES_TEXTS: [],
                                    RETURN: []
                                }
                            };
                            break;
                        case "BAPI_PO_CHANGE":
                            bapiConstParameters = {
                                EXPORTS: {
                                    PURCHASEORDER: "",
                                    POHEADER: {
                                        PO_NUMBER: "",
                                        COMP_CODE: "",
                                        DOC_TYPE: "",
                                        DELETE_IND: "",
                                        STATUS: "",
                                        CREAT_DATE: "",
                                        CREATED_BY: "",
                                        ITEM_INTVL: "",
                                        VENDOR: "",
                                        LANGU: "",
                                        LANGU_ISO: "",
                                        PMNTTRMS: "",
                                        DSCNT1_TO: 0,
                                        DSCNT2_TO: 0,
                                        DSCNT3_TO: 0,
                                        DSCT_PCT1: 0,
                                        DSCT_PCT2: 0,
                                        PURCH_ORG: "",
                                        PUR_GROUP: "",
                                        CURRENCY: "",
                                        CURRENCY_ISO: "",
                                        EXCH_RATE: 0,
                                        EX_RATE_FX: "",
                                        DOC_DATE: "",
                                        VPER_START: "",
                                        VPER_END: "",
                                        WARRANTY: "",
                                        QUOTATION: "",
                                        QUOT_DATE: "",
                                        REF_1: "",
                                        SALES_PERS: "",
                                        TELEPHONE: "",
                                        SUPPL_VEND: "",
                                        CUSTOMER: "",
                                        AGREEMENT: "",
                                        GR_MESSAGE: "",
                                        SUPPL_PLNT: "",
                                        INCOTERMS1: "",
                                        INCOTERMS2: "",
                                        COLLECT_NO: "",
                                        DIFF_INV: "",
                                        OUR_REF: "",
                                        LOGSYSTEM: "",
                                        SUBITEMINT: "",
                                        PO_REL_IND: "",
                                        REL_STATUS: "",
                                        VAT_CNTRY: "",
                                        VAT_CNTRY_ISO: "",
                                        REASON_CANCEL: "",
                                        REASON_CODE: "",
                                        RETENTION_TYPE: "",
                                        RETENTION_PERCENTAGE: 0,
                                        DOWNPAY_TYPE: "",
                                        DOWNPAY_AMOUNT: 0,
                                        DOWNPAY_PERCENT: 0,
                                        DOWNPAY_DUEDATE: "",
                                        MEMORY: "",
                                        MEMORYTYPE: ""
                                    },
                                    POHEADERX: {
                                        PO_NUMBER: "",
                                        COMP_CODE: "",
                                        DOC_TYPE: "",
                                        DELETE_IND: "",
                                        STATUS: "",
                                        CREAT_DATE: "",
                                        CREATED_BY: "",
                                        ITEM_INTVL: "",
                                        VENDOR: "",
                                        LANGU: "",
                                        LANGU_ISO: "",
                                        PMNTTRMS: "",
                                        DSCNT1_TO: "",
                                        DSCNT2_TO: "",
                                        DSCNT3_TO: "",
                                        DSCT_PCT1: "",
                                        DSCT_PCT2: "",
                                        PURCH_ORG: "",
                                        PUR_GROUP: "",
                                        CURRENCY: "",
                                        CURRENCY_ISO: "",
                                        EXCH_RATE: "",
                                        EX_RATE_FX: "",
                                        DOC_DATE: "",
                                        VPER_START: "",
                                        VPER_END: "",
                                        WARRANTY: "",
                                        QUOTATION: "",
                                        QUOT_DATE: "",
                                        REF_1: "",
                                        SALES_PERS: "",
                                        TELEPHONE: "",
                                        SUPPL_VEND: "",
                                        CUSTOMER: "",
                                        AGREEMENT: "",
                                        GR_MESSAGE: "",
                                        SUPPL_PLNT: "",
                                        INCOTERMS1: "",
                                        INCOTERMS2: "",
                                        COLLECT_NO: "",
                                        DIFF_INV: "",
                                        OUR_REF: "",
                                        LOGSYSTEM: "",
                                        SUBITEMINT: "",
                                        PO_REL_IND: "",
                                        REL_STATUS: "",
                                        VAT_CNTRY: "",
                                        VAT_CNTRY_ISO: "",
                                        REASON_CANCEL: "",
                                        REASON_CODE: "",
                                        RETENTION_TYPE: "",
                                        RETENTION_PERCENTAGE: "",
                                        DOWNPAY_TYPE: "",
                                        DOWNPAY_AMOUNT: "",
                                        DOWNPAY_PERCENT: "",
                                        DOWNPAY_DUEDATE: "",
                                        MEMORY: "",
                                        MEMORYTYPE: ""
                                    },
                                    POADDRVENDOR: "",
                                    TESTRUN: "",
                                    MEMORY_UNCOMPLETE: "",
                                    MEMORY_COMPLETE: "",
                                    POEXPIMPHEADER: "",
                                    POEXPIMPHEADERX: "",
                                    VERSIONS: "",
                                    NO_MESSAGING: "",
                                    NO_MESSAGE_REQ: "",
                                    NO_AUTHORITY: "",
                                    NO_PRICE_FROM_PO: "",
                                    PARK_UNCOMPLETE: "",
                                    PARK_COMPLETE: ""
                                },
                                IMPORTS: {
                                    EXPHEADER: "",
                                    EXPPOEXPIMPHEADER: ""
                                },
                                TABLES: {
                                    RETURN: [],
                                    POITEM: [],
                                    POITEMX: [],
                                    POADDRDELIVERY: [],
                                    POSCHEDULE: [],
                                    POSCHEDULEX: [],
                                    POACCOUNT: [],
                                    POACCOUNTPROFITSEGMENT: [],
                                    POACCOUNTX: [],
                                    POCONDHEADER: [],
                                    POCONDHEADERX: [],
                                    POCOND: [],
                                    POCONDX: [],
                                    POLIMITS: [],
                                    POCONTRACTLIMITS: [],
                                    POSERVICES: [],
                                    POSRVACCESSVALUES: [],
                                    POSERVICESTEXT: [],
                                    EXTENSIONIN: [],
                                    EXTENSIONOUT: [],
                                    POEXPIMPITEM: [],
                                    POEXPIMPITEMX: [],
                                    POTEXTHEADER: [],
                                    POTEXTITEM: [],
                                    ALLVERSIONS: [],
                                    POPARTNER: [],
                                    POCOMPONENTS: [],
                                    POCOMPONENTSX: [],
                                    POSHIPPING: [],
                                    POSHIPPINGX: [],
                                    POSHIPPINGEXP: [],
                                    POCONFIRMATION: [],
                                    SERIALNUMBER: [],
                                    SERIALNUMBERX: [],
                                    INVPLANHEADER: [],
                                    INVPLANHEADERX: [],
                                    INVPLANITEM: [],
                                    INVPLANITEMX: [],
                                    POHISTORY_MA: []
                                }
                            };
                            break;
                        case "BAPI_PO_CREATE1":
                            bapiConstParameters = {
                                EXPORTS: {
                                    PURCHASEORDER: "",
                                    POHEADER: {
                                        PO_NUMBER: "",
                                        COMP_CODE: "",
                                        DOC_TYPE: "",
                                        DELETE_IND: "",
                                        STATUS: "",
                                        CREAT_DATE: "",
                                        CREATED_BY: "",
                                        ITEM_INTVL: "",
                                        VENDOR: "",
                                        LANGU: "",
                                        LANGU_ISO: "",
                                        PMNTTRMS: "",
                                        DSCNT1_TO: 0,
                                        DSCNT2_TO: 0,
                                        DSCNT3_TO: 0,
                                        DSCT_PCT1: 0,
                                        DSCT_PCT2: 0,
                                        PURCH_ORG: "",
                                        PUR_GROUP: "",
                                        CURRENCY: "",
                                        CURRENCY_ISO: "",
                                        EXCH_RATE: 0,
                                        EX_RATE_FX: "",
                                        DOC_DATE: "",
                                        VPER_START: "",
                                        VPER_END: "",
                                        WARRANTY: "",
                                        QUOTATION: "",
                                        QUOT_DATE: "",
                                        REF_1: "",
                                        SALES_PERS: "",
                                        TELEPHONE: "",
                                        SUPPL_VEND: "",
                                        CUSTOMER: "",
                                        AGREEMENT: "",
                                        GR_MESSAGE: "",
                                        SUPPL_PLNT: "",
                                        INCOTERMS1: "",
                                        INCOTERMS2: "",
                                        COLLECT_NO: "",
                                        DIFF_INV: "",
                                        OUR_REF: "",
                                        LOGSYSTEM: "",
                                        SUBITEMINT: "",
                                        PO_REL_IND: "",
                                        REL_STATUS: "",
                                        VAT_CNTRY: "",
                                        VAT_CNTRY_ISO: "",
                                        REASON_CANCEL: "",
                                        REASON_CODE: "",
                                        RETENTION_TYPE: "",
                                        RETENTION_PERCENTAGE: 0,
                                        DOWNPAY_TYPE: "",
                                        DOWNPAY_AMOUNT: 0,
                                        DOWNPAY_PERCENT: 0,
                                        DOWNPAY_DUEDATE: "",
                                        MEMORY: "",
                                        MEMORYTYPE: ""
                                    },
                                    POHEADERX: {
                                        PO_NUMBER: "",
                                        COMP_CODE: "",
                                        DOC_TYPE: "",
                                        DELETE_IND: "",
                                        STATUS: "",
                                        CREAT_DATE: "",
                                        CREATED_BY: "",
                                        ITEM_INTVL: "",
                                        VENDOR: "",
                                        LANGU: "",
                                        LANGU_ISO: "",
                                        PMNTTRMS: "",
                                        DSCNT1_TO: "",
                                        DSCNT2_TO: "",
                                        DSCNT3_TO: "",
                                        DSCT_PCT1: "",
                                        DSCT_PCT2: "",
                                        PURCH_ORG: "",
                                        PUR_GROUP: "",
                                        CURRENCY: "",
                                        CURRENCY_ISO: "",
                                        EXCH_RATE: "",
                                        EX_RATE_FX: "",
                                        DOC_DATE: "",
                                        VPER_START: "",
                                        VPER_END: "",
                                        WARRANTY: "",
                                        QUOTATION: "",
                                        QUOT_DATE: "",
                                        REF_1: "",
                                        SALES_PERS: "",
                                        TELEPHONE: "",
                                        SUPPL_VEND: "",
                                        CUSTOMER: "",
                                        AGREEMENT: "",
                                        GR_MESSAGE: "",
                                        SUPPL_PLNT: "",
                                        INCOTERMS1: "",
                                        INCOTERMS2: "",
                                        COLLECT_NO: "",
                                        DIFF_INV: "",
                                        OUR_REF: "",
                                        LOGSYSTEM: "",
                                        SUBITEMINT: "",
                                        PO_REL_IND: "",
                                        REL_STATUS: "",
                                        VAT_CNTRY: "",
                                        VAT_CNTRY_ISO: "",
                                        REASON_CANCEL: "",
                                        REASON_CODE: "",
                                        RETENTION_TYPE: "",
                                        RETENTION_PERCENTAGE: "",
                                        DOWNPAY_TYPE: "",
                                        DOWNPAY_AMOUNT: "",
                                        DOWNPAY_PERCENT: "",
                                        DOWNPAY_DUEDATE: "",
                                        MEMORY: "",
                                        MEMORYTYPE: ""
                                    },
                                    POADDRVENDOR: "",
                                    TESTRUN: "",
                                    MEMORY_UNCOMPLETE: "",
                                    MEMORY_COMPLETE: "",
                                    POEXPIMPHEADER: "",
                                    POEXPIMPHEADERX: "",
                                    VERSIONS: "",
                                    NO_MESSAGING: "",
                                    NO_MESSAGE_REQ: "",
                                    NO_AUTHORITY: "",
                                    NO_PRICE_FROM_PO: "",
                                    PARK_UNCOMPLETE: "",
                                    PARK_COMPLETE: ""
                                },
                                IMPORTS: {
                                    EXPPURCHASEORDER: "",
                                    EXPHEADER: "",
                                    EXPPOEXPIMPHEADER: ""
                                },
                                TABLES: {
                                    RETURN: [],
                                    POITEM: [],
                                    POITEMX: [],
                                    POADDRDELIVERY: [],
                                    POSCHEDULE: [],
                                    POSCHEDULEX: [],
                                    POACCOUNT: [],
                                    POACCOUNTPROFITSEGMENT: [],
                                    POACCOUNTX: [],
                                    POCONDHEADER: [],
                                    POCONDHEADERX: [],
                                    POCOND: [],
                                    POCONDX: [],
                                    POLIMITS: [],
                                    POCONTRACTLIMITS: [],
                                    POSERVICES: [],
                                    POSRVACCESSVALUES: [],
                                    POSERVICESTEXT: [],
                                    EXTENSIONIN: [],
                                    EXTENSIONOUT: [],
                                    POEXPIMPITEM: [],
                                    POEXPIMPITEMX: [],
                                    POTEXTHEADER: [],
                                    POTEXTITEM: [],
                                    ALLVERSIONS: [],
                                    POPARTNER: [],
                                    POCOMPONENTS: [],
                                    POCOMPONENTSX: [],
                                    POSHIPPING: [],
                                    POSHIPPINGX: [],
                                    POSHIPPINGEXP: [],
                                    SERIALNUMBER: [],
                                    SERIALNUMBERX: [],
                                    INVPLANHEADER: [],
                                    INVPLANHEADERX: [],
                                    INVPLANITEM: [],
                                    INVPLANITEMX: []
                                }
                            };
                            break;
                        case "BAPI_GOODSMVT_CREATE":
                            bapiConstParameters = {
                                EXPORTS: {
                                    GOODSMVT_HEADER: {
                                        PSTNG_DATE: "",
                                        DOC_DATE: "",
                                        REF_DOC_NO: "",
                                        BILL_OF_LADING: "",
                                        GR_GI_SLIP_NO: "",
                                        PR_UNAME: "",
                                        HEADER_TXT: "",
                                        VER_GR_GI_SLIP: "",
                                        VER_GR_GI_SLIPX: "",
                                        EXT_WMS: "",
                                        REF_DOC_NO_LONG: "",
                                        BILL_OF_LADING_LONG: "",
                                        BAR_CODE: ""
                                    },
                                    GOODSMVT_CODE: {
                                        GM_CODE: ""
                                    },
                                    TESTRUN: "",
                                    GOODSMVT_REF_EWM: {}
                                },
                                IMPORTS: {
                                    GOODSMVT_HEADRET: {},
                                    MATERIALDOCUMENT: "",
                                    MATDOCUMENTYEAR: ""
                                },
                                TABLES: {
                                    GOODSMVT_ITEM: [],
                                    GOODSMVT_SERIALNUMBER: [],
                                    RETURN: [],
                                    GOODSMVT_SERV_PART_DATA: [],
                                    EXTENSIONIN: [],
                                    GOODSMVT_ITEM_CWM: []
                                }
                            };
                            break;
                        case "BAPI_GOODSMVT_CANCEL":
                            bapiConstParameters = {
                                EXPORTS: {
                                    MATERIALDOCUMENT: "",
                                    MATDOCUMENTYEAR: "",
                                    GOODSMVT_PSTNG_DATE: "",
                                    GOODSMVT_PR_UNAME: ""
                                },
                                IMPORTS: {
                                    GOODSMVT_HEADRET: {}
                                },
                                TABLES: {
                                    GOODSMVT_MATDOCITEM: [],
                                    RETURN: []
                                }
                            };
                            break;
                        case "BAPI_REL_CREATERELATION":
                            bapiConstParameters = {
                                EXPORTS: {
                                    OBJECTS: {},
                                },
                                IMPORTS: {
                                    RETURN: {},
                                },
                                TABLES: {
                                    RELATIONATTRIBUTES: [],
                                }
                            };
                            break;
                        case "SO_FOLDER_ROOT_ID_GET":
                            bapiConstParameters = {
                                EXPORTS: {
                                    OWNER: "",
                                    REGION: ""
                                },
                                IMPORTS: {
                                    FOLDER_ID: {}
                                },
                                TABLES: {}
                            };
                            break;
                        case "SO_OBJECT_INSERT":
                            bapiConstParameters = {
                                EXPORTS: {
                                    FOLDER_ID: {},
                                    OBJECT_FL_CHANGE: {},
                                    OBJECT_HD_CHANGE: {},
                                    OBJECT_TYPE: {},
                                    ORIGINATOR_ID: {},
                                    OWNER: ""
                                },
                                IMPORTS: {
                                    OBJECT_FL_DISPLAY: {},
                                    OBJECT_HD_DISPLAY: {},
                                    OBJECT_ID: {}
                                },
                                TABLES: {
                                    OBJCONT: [],
                                    OBJHEAD: [],
                                    OBJPARA: [],
                                    OBJPARB: []
                                }
                            };
                            break;
                        case "Z_ESK_CALCULATE_TAX_FRM_NET":
                            bapiConstParameters = {
                                EXPORTS: {
                                    I_ACCDATA: {
                                        "DMBTR": 0,
                                        "WRBTR": 0,
                                        "KZBTR": 0,
                                        "PSWBT": 0,
                                        "TXBHW": 0,
                                        "TXBFW": 0,
                                        "MWSTS": 0,
                                        "WMWST": 0,
                                        "HWBAS": 0,
                                        "FWBAS": 0,
                                        "HWZUZ": 0,
                                        "FWZUZ": 0,
                                        "QSSHB": 0,
                                        "KURSR": 0,
                                        "GBETR": 0,
                                        "BDIFF": 0,
                                        "BDIF2": 0,
                                        "FDWBT": 0,
                                        "ZBD1T": 0,
                                        "ZBD2T": 0,
                                        "ZBD3T": 0,
                                        "ZBD1P": 0,
                                        "ZBD2P": 0,
                                        "SKFBT": 0,
                                        "SKNTO": 0,
                                        "WSKTO": 0,
                                        "NEBTR": 0,
                                        "DMBT1": 0,
                                        "WRBT1": 0,
                                        "DMBT2": 0,
                                        "WRBT2": 0,
                                        "DMBT3": 0,
                                        "WRBT3": 0,
                                        "BLNBT": 0,
                                        "BLNPZ": 0,
                                        "KLIBT": 0,
                                        "QBSHB": 0,
                                        "QSFBT": 0,
                                        "NAVHW": 0,
                                        "NAVFW": 0,
                                        "MENGE": 0,
                                        "ERFMG": 0,
                                        "BPMNG": 0,
                                        "PEINH": 0,
                                        "REWRT": 0,
                                        "REWWR": 0,
                                        "BONFB": 0,
                                        "BUALT": 0,
                                        "NPREI": 0,
                                        "RDIFF": 0,
                                        "RDIF2": 0,
                                        "POPTS": 0,
                                        "DMBE2": 0,
                                        "DMBE3": 0,
                                        "DMB21": 0,
                                        "DMB22": 0,
                                        "DMB23": 0,
                                        "DMB31": 0,
                                        "DMB32": 0,
                                        "DMB33": 0,
                                        "MWST2": 0,
                                        "MWST3": 0,
                                        "NAVH2": 0,
                                        "NAVH3": 0,
                                        "SKNT2": 0,
                                        "SKNT3": 0,
                                        "BDIF3": 0,
                                        "RDIF3": 0,
                                        "TXBH2": 0,
                                        "TXBH3": 0,
                                        "STTAX": 0,
                                        "ABSBT": 0,
                                        "AGZEI": 0,
                                        "PYAMT": 0,
                                        "PPDIFF": 0,
                                        "PPDIF2": 0,
                                        "PPDIF3": 0,
                                        "PENLC1": 0,
                                        "PENLC2": 0,
                                        "PENLC3": 0,
                                        "PENFC": 0,
                                        "PENDAYS": 0,
                                        "SCTAX": 0
                                    },
                                    I_BUKRS: "",
                                    I_MWSKZ: "",
                                    I_PROTOKOLL: "",
                                    I_PRSDT: "",
                                    I_TXJCD: "",
                                    I_WAERS: "",
                                    I_WRBTR: null,
                                    I_ZBD1P: null
                                },
                                IMPORTS: {
                                    E_FWNAV: 0,
                                    E_FWNVV: 0,
                                    E_FWSTE: 0,
                                    E_FWAST: 0
                                },
                                TABLES: {
                                    T_MWDAT: []
                                }
                            };
                            break;
                        case "Z_ESK_CONV_TO_FOREIGN_CURRENCY":
                            bapiConstParameters = {
                                EXPORTS: {
                                    CLIENT: "",
                                    DATE: "",
                                    FOREIGN_CURRENCY: "",
                                    LOCAL_AMOUNT: null,
                                    LOCAL_CURRENCY: "",
                                    RATE: null,
                                    READ_TCURR: "",
                                    TYPE_OF_RATE: ""
                                },
                                IMPORTS: {
                                    EXCHANGE_RATE: 1,
                                    FOREIGN_AMOUNT: 0,
                                    FOREIGN_FACTOR: "",
                                    LOCAL_FACTOR: "",
                                    DERIVED_RATE_TYPE: "",
                                    FIXED_RATE: 1
                                },
                                TABLES: {}
                            };
                            break;
                        case "Z_ESK_INCOMINGINVOICE_SIMULATE":
                            bapiConstParameters = {
                                EXPORTS: {
                                    HEADERDATA: {}
                                },
                                IMPORTS: {},
                                TABLES: {
                                    ITEMDATA: [],
                                    ACCOUNTINGDATA: [],
                                    GLACCOUNTDATA: [],
                                    MATERIALDATA: [],
                                    TAXDATA: [],
                                    WITHTAXDATA: [],
                                    VENDORITEMSPLITDATA: [],
                                    RETURN: [],
                                    ACCOUNTINGINFO: [],
                                    CURRENCYINFO: []
                                }
                            };
                            break;
                        case "Z_ESK_DETERMINE_DUE_DATE":
                            bapiConstParameters = {
                                EXPORTS: {
                                    I_BLDAT: "",
                                    I_CPUDT: "",
                                    I_ZFBDT: "",
                                    I_ZTERM: "",
                                    I_LIFNR: "",
                                    I_BUKRS: "",
                                    I_KOART: "",
                                    I_SHKZG: ""
                                },
                                IMPORTS: {
                                    DATEDETAILS: {
                                        SHKZG: "",
                                        KOART: "",
                                        ZFBDT: "",
                                        ZBD1T: 0,
                                        ZBD2T: 0,
                                        ZBD3T: 0,
                                        REBZG: "",
                                        REBZT: "",
                                        BLDAT: "",
                                        NETDT: "",
                                        SK1DT: "",
                                        SK2DT: ""
                                    },
                                    DISCOUNT1: 0,
                                    DISCOUNT2: 0,
                                    E_FAEDE: "",
                                    E_T052: {
                                        MANDT: "",
                                        ZTERM: "",
                                        ZTAGG: 0,
                                        ZDART: "",
                                        ZFAEL: 0,
                                        ZMONA: 0,
                                        ZTAG1: 0,
                                        ZPRZ1: 0,
                                        ZTAG2: 0,
                                        ZPRZ2: 0,
                                        ZTAG3: 0,
                                        ZSTG1: 0,
                                        ZSMN1: 0,
                                        ZSTG2: 0,
                                        ZSMN2: 0,
                                        ZSTG3: 0,
                                        ZSMN3: 0,
                                        XZBRV: "",
                                        ZSCHF: "",
                                        XCHPB: "",
                                        TXN08: "",
                                        ZLSCH: "",
                                        XCHPM: "",
                                        KOART: "",
                                        XSPLT: "",
                                        XSCRC: ""
                                    }
                                },
                                TABLES: {}
                            };
                            break;
                        case "Z_ESK_DETERMINE_JURISDICTION":
                            bapiConstParameters = {
                                EXPORTS: {
                                    LOCATION_DATA: {
                                        COUNTRY: "",
                                        STATE: "",
                                        COUNTY: "",
                                        CITY: "",
                                        ZIPCODE: "",
                                        TXJCD_L1: "",
                                        TXJCD_L2: "",
                                        TXJCD_L3: "",
                                        TXJCD_L4: "",
                                        TXJCD: "",
                                        OUTOF_CITY: "",
                                    },
                                    DEST: "",
                                },
                                IMPORTS: {
                                    LOCATION_ERR: {
                                        RETCODE: "",
                                        ERRCODE: "",
                                        ERRMSG: "",
                                    },
                                },
                                TABLES: {
                                    LOCATION_RESULTS: [],
                                }
                            };
                            break;
                        case "SVRS_GET_REPS_FROM_OBJECT":
                            bapiConstParameters = {
                                EXPORTS: {
                                    DESTINATION: "",
                                    IV_NO_RELEASE_TRANSFORMATION: "",
                                    OBJECT_NAME: "",
                                    OBJECT_TYPE: "",
                                    VERSNO: ""
                                },
                                IMPORTS: {},
                                TABLES: {
                                    REPOS_TAB: [],
                                    TRDIR_TAB: [],
                                    VSMODISRC: [],
                                    VSMODILOG: []
                                }
                            };
                            break;
                        default:
                            bapiConstParameters = {
                                EXPORTS: {},
                                IMPORTS: {},
                                TABLES: {}
                            };
                            //  Warn if we're in this default case with another BAPI than RFC_READ_TABLE which could necessitate a proper configuration
                            if (alias !== "RFC_READ_TABLE" && alias !== "Z_ESK_RFC_READ_TABLE") {
                                Log.Warn("initBapiParams with default values for ".concat(bapiName, ", ").concat(alias));
                            }
                            break;
                    }
                    var overridedDefaultBapiParams = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetDefaultBAPIParams", bapiName, alias, bapiConstParameters);
                    data[bapiName] = overridedDefaultBapiParams || bapiConstParameters;
                    return data;
                }
                Soap.InitBapiParams = InitBapiParams;
                function MergeBapiParams(originalBapiParamsDefinition, bapiParamsValuesToCopy) {
                    for (var key in bapiParamsValuesToCopy) {
                        if (Object.prototype.hasOwnProperty.call(bapiParamsValuesToCopy, key)) {
                            if (!(key in originalBapiParamsDefinition) ||
                                typeof originalBapiParamsDefinition[key] !== typeof bapiParamsValuesToCopy[key]) {
                                originalBapiParamsDefinition[key] = bapiParamsValuesToCopy[key];
                                continue;
                            }
                            if (Array.isArray(originalBapiParamsDefinition[key])) {
                                originalBapiParamsDefinition[key] = bapiParamsValuesToCopy[key];
                                continue;
                            }
                            if (typeof originalBapiParamsDefinition[key] === 'object') {
                                originalBapiParamsDefinition[key] = MergeBapiParams(originalBapiParamsDefinition[key], bapiParamsValuesToCopy[key]);
                                continue;
                            }
                            if (bapiParamsValuesToCopy[key]) {
                                var bapiParamsValue = bapiParamsValuesToCopy[key];
                                if (typeof bapiParamsValue === "number") {
                                    bapiParamsValue = bapiParamsValue.toString();
                                }
                                var numberWithoutZeroDecimals = bapiParamsValue.replace(/(\.[0-9]*[1-9])0+$/g, '$1').replace(/\.[0]*$/, "");
                                if (!isNaN(Number(bapiParamsValue)) &&
                                    Number(bapiParamsValue).toString() === numberWithoutZeroDecimals) {
                                    originalBapiParamsDefinition[key] = Number(bapiParamsValue);
                                    continue;
                                }
                            }
                            originalBapiParamsDefinition[key] = bapiParamsValuesToCopy[key];
                        }
                    }
                    return originalBapiParamsDefinition;
                }
                Soap.MergeBapiParams = MergeBapiParams;
                function SAPValuesAreEqual(a, b) {
                    return a === b || (!!a && !!b && a.toString && b.toString && a.toString() === b.toString());
                }
                Soap.SAPValuesAreEqual = SAPValuesAreEqual;
                // This function only unwraps the promise server side to ease the refactor server side.
                function CallSAPSOAPWSSync(bapiName, bapiParams, debug) {
                    if (debug === void 0) { debug = false; }
                    var callSAPSOAPWSResult;
                    Lib.P2P.SAP.Soap.CallSAPSOAPWS(bapiName, bapiParams, debug)
                        .Then(function (result) {
                        callSAPSOAPWSResult = result;
                    })
                        .Catch(function (error) {
                        callSAPSOAPWSResult = error;
                    });
                    return callSAPSOAPWSResult;
                }
                Soap.CallSAPSOAPWSSync = CallSAPSOAPWSSync;
                function ExtractSPRASFilters(filter) {
                    var regex = /\s*SPRAS\s+=\s+['"]([^'"]*)['"]\s*/gi;
                    // Handle langs dynamically if we found any SPRAS filter in it.
                    var result = regex.exec(filter);
                    var toReplaceMap = {};
                    // Find all SPRAS filters in filter
                    // Group by value and keep the filter in the toReplaceMap
                    while (result) {
                        var subSprasFilter = result[0];
                        var subSprasValue = result[1];
                        // We only keep track of filters with invalid SAP values that we can convert in SAP Lang
                        if (subSprasValue &&
                            (subSprasValue.length === 2 ||
                                subSprasValue === "%SAPCONNECTIONLANGUAGE%" ||
                                subSprasValue === "%EDWLANGUAGE%" ||
                                (subSprasValue.indexOf("%ISO-") === 0 && subSprasValue.length === 8))) {
                            if (!toReplaceMap[subSprasValue]) {
                                toReplaceMap[subSprasValue] = [];
                            }
                            toReplaceMap[subSprasValue.toUpperCase()].push(subSprasFilter);
                        }
                        result = regex.exec(filter);
                    }
                    return toReplaceMap;
                }
                Soap.ExtractSPRASFilters = ExtractSPRASFilters;
                /**
                 * Get a sap filter as argument, parse the filter to find any SPRAS = 'XXX' sub_filters
                 * if "XXX" is a recognized value to convert (%SAPCONNECTIONLANGUAGE%, %EDWLANGUAGE%, %ISO-XX%, XX)
                 * Resolve and retrieve the associated SAP language code and returned the resolve filter with each sub_filter replaced by SPRAS = 'X'.
                 * @param {string} filter input sap filter to resolve
                 * @returns {string} the resolved sap filter with one character language code for SPRAS sub filters..
                 */
                function RfcReadTableResolveFilter(filter) {
                    // Return directly all filters not containing the word 'SPRAS'
                    if (!filter || filter.toLowerCase().indexOf("spras") === -1) {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            resolve(filter);
                        });
                    }
                    var toReplaceMap = Lib.P2P.SAP.Soap.ExtractSPRASFilters(filter);
                    if (toReplaceMap === {}) {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            resolve(filter);
                        });
                    }
                    var promisedQueries = [];
                    var _loop_4 = function (originalValue) {
                        promisedQueries.push(Sys.Helpers.Promise.Create(function (resolve) {
                            Lib.AP.SAP.SAPGetSAPLanguage(originalValue).Then(function (sapLang) {
                                resolve({
                                    originalValue: originalValue,
                                    sub_filters: toReplaceMap[originalValue],
                                    sapLang: sapLang
                                });
                            });
                        }));
                    };
                    for (var originalValue in toReplaceMap) {
                        _loop_4(originalValue);
                    }
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        Sys.Helpers.Promise.All(promisedQueries).Then(function (cumulatedResults) {
                            for (var _i = 0, cumulatedResults_1 = cumulatedResults; _i < cumulatedResults_1.length; _i++) {
                                var cumulatedResult = cumulatedResults_1[_i];
                                for (var _a = 0, _b = cumulatedResult.sub_filters; _a < _b.length; _a++) {
                                    var subfilter = _b[_a];
                                    var newSubFilter = subfilter.replace(cumulatedResult.originalValue, cumulatedResult.sapLang);
                                    filter = filter.replace(subfilter, newSubFilter);
                                }
                            }
                            resolve(filter);
                        });
                    });
                }
                Soap.RfcReadTableResolveFilter = RfcReadTableResolveFilter;
                // #endregion
            })(Soap = SAP.Soap || (SAP.Soap = {}));
        })(SAP = P2P.SAP || (P2P.SAP = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
