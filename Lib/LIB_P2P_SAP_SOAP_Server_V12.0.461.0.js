///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_P2P_SAP_SOAP_SERVER_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "require": [
    "LIB_P2P_SAP_SOAP_V12.0.461.0"
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
                var Server;
                (function (Server) {
                    // #region Public classes
                    var BAPIWS = /** @class */ (function (_super) {
                        __extends(BAPIWS, _super);
                        function BAPIWS(sapName, name) {
                            var _this = this;
                            if (name) {
                                _this = _super.call(this, sapName, name) || this;
                            }
                            else {
                                _this = _super.call(this, sapName) || this;
                            }
                            _this.isWS = true;
                            return _this;
                        }
                        //ISAP.Bapi = interface avec eskjscript , Bapi = classe locale
                        BAPIWS.prototype.Init = function (bapiManager) {
                            if (bapiManager) {
                                this.FunctionModule = new Soap.BapiWSFunctions(this.SapName, this.Name);
                                if (this.FunctionModule) {
                                    Sys.Helpers.SAP.SetLastError("");
                                }
                                else if (bapiManager.GetLastError() === "EXCEPTION FU_NOT_FOUND RAISED") {
                                    Sys.Helpers.SAP.SetLastError("The function module " + this.SapName + " is missing on SAP server.", true);
                                }
                                else {
                                    Sys.Helpers.SAP.SetLastError("Failed to get BAPI definition: " + bapiManager.GetLastError(), true);
                                }
                            }
                            return this.FunctionModule;
                        };
                        BAPIWS.prototype.Reset = function () {
                            this.FunctionModule = null;
                        };
                        return BAPIWS;
                    }(Lib.AP.SAP.BAPI));
                    Server.BAPIWS = BAPIWS;
                    // #region Private functions
                    function parseP2PDocumentNumber(docNumber, normalize) {
                        if (docNumber && typeof docNumber === "string") {
                            // docNumber should be in the format "documentNumber-CompanyCode-fiscalYear" (FI) or "documentNumber-fiscalYear" (MM)
                            var docNumberSplitted = docNumber.split("-");
                            if (docNumberSplitted.length === 2 || docNumberSplitted.length === 3) {
                                var obj = {
                                    documentNumber: docNumberSplitted[0]
                                };
                                if (docNumberSplitted.length === 2) {
                                    obj.fiscalYear = docNumberSplitted[1];
                                }
                                else {
                                    obj.companyCode = docNumberSplitted[1];
                                    obj.fiscalYear = docNumberSplitted[2];
                                }
                                if (normalize) {
                                    obj.documentNumber = Sys.Helpers.String.SAP.NormalizeID(Sys.Helpers.String.SAP.Trim(obj.documentNumber), 10);
                                    obj.fiscalYear = Sys.Helpers.String.SAP.Trim(obj.fiscalYear);
                                    if (obj.companyCode) {
                                        obj.companyCode = Sys.Helpers.String.PadRight(obj.companyCode, " ", 4);
                                    }
                                }
                                if (obj.companyCode) {
                                    obj.stringValue = obj.companyCode + obj.documentNumber + obj.fiscalYear;
                                    obj.isFI = true;
                                }
                                else {
                                    obj.stringValue = obj.documentNumber + obj.fiscalYear;
                                    obj.isMM = true;
                                }
                                return obj;
                            }
                        }
                        return null;
                    }
                    // #endregion
                    function Call_RFC_READ_TABLE_WSSync(tableName, fieldNames, filters, rowcount, rowSkip, noData, jsonOptions, debug) {
                        if (rowSkip === void 0) { rowSkip = 0; }
                        if (noData === void 0) { noData = false; }
                        if (jsonOptions === void 0) { jsonOptions = null; }
                        if (debug === void 0) { debug = false; }
                        var callSAPSOAPWSResult;
                        Lib.P2P.SAP.Soap.Call_RFC_READ_TABLE_WS(tableName, fieldNames, filters, rowcount, rowSkip, noData, jsonOptions, debug).Then(function (result) {
                            callSAPSOAPWSResult = result;
                        }).Catch(function (error) {
                            callSAPSOAPWSResult = error;
                        });
                        return callSAPSOAPWSResult;
                    }
                    Server.Call_RFC_READ_TABLE_WSSync = Call_RFC_READ_TABLE_WSSync;
                    var cachedFolderRootID = null;
                    function AttachUrlWS(objectType, documentID, url, SAPDocParameters, attachName) {
                        // Set document ID in SAP format
                        var realDocumentID = documentID;
                        if (objectType === "BKPF" || objectType === "BUS2081" || objectType === "BUS2017") {
                            var parsedDocNumber = parseP2PDocumentNumber(documentID, true);
                            if (parsedDocNumber) {
                                realDocumentID = parsedDocNumber.stringValue;
                            }
                            else {
                                return "unrecognized documentID";
                            }
                        }
                        var params = SAPDocParameters;
                        try {
                            if (!params.BapiController.InitBapiWSManager()) {
                                var error = "AttachURLWS: failed to initialize BAPI WS Manager.";
                                Sys.Helpers.SAP.SetLastError(error);
                                return error;
                            }
                            // 1. Get folder ID from SAP
                            if (!cachedFolderRootID) {
                                var BAPINAME_SO_FOLDER_ROOT_ID_GET = "SO_FOLDER_ROOT_ID_GET";
                                var BAPI_ALIAS_SO_FOLDER_ROOT_ID_GET = Lib.P2P.SAP.Soap.GetBAPIName(BAPINAME_SO_FOLDER_ROOT_ID_GET);
                                params.AddBapi(BAPI_ALIAS_SO_FOLDER_ROOT_ID_GET, BAPINAME_SO_FOLDER_ROOT_ID_GET);
                                var BAPI_SO_FOLDER_ROOT_ID_GET = params.BapiController.InitBapi(BAPINAME_SO_FOLDER_ROOT_ID_GET);
                                if (BAPI_SO_FOLDER_ROOT_ID_GET) {
                                    cachedFolderRootID = Sys.Helpers.SAP.GetFolderRootID(BAPI_SO_FOLDER_ROOT_ID_GET, "", "B");
                                    if (!cachedFolderRootID) {
                                        return Sys.Helpers.SAP.GetLastError();
                                    }
                                }
                                else {
                                    return Sys.Helpers.SAP.GetLastError();
                                }
                            }
                            // Normalize length of folderNO
                            if (cachedFolderRootID.OBJNO && cachedFolderRootID.OBJNO.length < 12) {
                                for (var i = 0; i < (12 - cachedFolderRootID.OBJNO.length); i++) {
                                    cachedFolderRootID.OBJNO += " ";
                                }
                            }
                            // 2. Create attach in SAP
                            var attachID = null;
                            var BAPINAME_SO_OBJECT_INSERT = "SO_OBJECT_INSERT";
                            var BAPI_ALIAS_SO_OBJECT_INSERT = Lib.P2P.SAP.Soap.GetBAPIName(BAPINAME_SO_OBJECT_INSERT);
                            params.AddBapi(BAPI_ALIAS_SO_OBJECT_INSERT, BAPINAME_SO_OBJECT_INSERT);
                            var BAPI_SO_OBJECT_INSERT = params.BapiController.InitBapi(BAPINAME_SO_OBJECT_INSERT);
                            if (BAPI_SO_OBJECT_INSERT) {
                                attachID = Sys.Helpers.SAP.InsertObject(BAPI_SO_OBJECT_INSERT, attachName, url, cachedFolderRootID, "E");
                            }
                            if (!attachID) {
                                return Sys.Helpers.SAP.GetLastError();
                            }
                            // 3. Link attach to document
                            var BAPINAME_BAPI_REL_CREATERELATION = "BAPI_REL_CREATERELATION";
                            var BAPIALIAS_BAPI_REL_CREATERELATION = Lib.P2P.SAP.Soap.GetBAPIName(BAPINAME_BAPI_REL_CREATERELATION);
                            params.AddBapi(BAPIALIAS_BAPI_REL_CREATERELATION, BAPINAME_BAPI_REL_CREATERELATION);
                            var BAPI_BAPI_REL_CREATERELATION = params.BapiController.InitBapi(BAPINAME_BAPI_REL_CREATERELATION);
                            if (!BAPI_BAPI_REL_CREATERELATION ||
                                !Sys.Helpers.SAP.CreateRelation(BAPI_BAPI_REL_CREATERELATION, realDocumentID, objectType, cachedFolderRootID, attachID)) {
                                return Sys.Helpers.SAP.GetLastError();
                            }
                        }
                        catch (e) {
                            Sys.Helpers.SAP.SetLastError("AttachUrlWS: error ".concat(e.message));
                            return Sys.Helpers.SAP.GetLastError();
                        }
                    }
                    Server.AttachUrlWS = AttachUrlWS;
                })(Server = Soap.Server || (Soap.Server = {}));
            })(Soap = SAP.Soap || (SAP.Soap = {}));
        })(SAP = P2P.SAP || (P2P.SAP = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
