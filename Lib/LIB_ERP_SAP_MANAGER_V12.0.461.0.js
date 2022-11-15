/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAP_Manager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "ERP Manager for SAP - system library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_String_SAP",
    "Lib_ERP_Manager_V12.0.461.0",
    "Lib_ERP_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_AP_SAP_V12.0.461.0",
    "[Sys/Sys_Helpers_SAP]",
    "[Sys/Sys_Helpers_SAP_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAP;
        (function (SAP) {
            var Manager = /** @class */ (function (_super) {
                __extends(Manager, _super);
                function Manager() {
                    var _this = _super.call(this, "SAP") || this;
                    _this.ExtendDefinition({
                        // user exits
                        ERPToManagerNames: {
                            DOC_TYPE: "DocumentType__",
                            CO_CODE: "CompanyCode__",
                            PURCH_ORG: "PurchasingOrganization__",
                            PUR_GROUP: "PurchasingGroup__",
                            DELIV_DATE: "RequestedDeliveryDate__",
                            VPER_START: "ValidityStart__",
                            VPER_END: "ValidityEnd__",
                            CURRENCY: "Currency__",
                            VENDOR: "VendorNumber__",
                            PUR_MAT: "PurchasingMaterial__",
                            SHORT_TEXT: "ItemDescription__",
                            QUANTITY: "ItemQuantity__",
                            NET_PRICE: "ItemUnitPrice__",
                            UNIT: "ItemUnit__",
                            TAX_CODE: "ItemTaxCode__",
                            G_L_ACCT: "ItemGlAccount__",
                            ASSET_NO: "ItemAssetNumber__",
                            PLANT: "ItemPlant__",
                            MAT_GRP: "ItemMaterialGroup__",
                            COST_CTR: "ItemCostCenterId__",
                            BUS_AREA: "ItemBusinessArea__",
                            ORDER_NO: "ItemInternalOrder__",
                            WBS_ELEM_E: "ItemWBSElement__",
                            ACCTASSCAT: "ItemAccountAssignmentCategory__",
                            PO_NUMBER: "PONumber__",
                            GR_NUMBER: "GRNumber__",
                            PSTNG_DATE: "PostingDate__",
                            DOC_DATE: "DocumentDate__",
                            REF_DOC_NO: "referenceDocument",
                            HEADER_TXT: "headerText",
                            ENTRY_QNT: "ItemQuantityReceived__",
                            ENTRY_UOM: "ItemUnit__",
                            PO_ITEM: "ItemNumber__",
                            NO_MORE_GR: "ItemDeliveryCompleted__",
                            GR_IND: "GoodsReceipt__",
                            POADDRDELIVERY_NAME: "ShipToContact__",
                            POADDRDELIVERY_NAME_2: "ShipToCompany__",
                            POADDRDELIVERY_TEL1_NUMBR: "ShipToPhone__",
                            POADDRDELIVERY_E_MAIL: "ShipToEmail__",
                            POADDRDELIVERY: "ShipToAddress"
                        },
                        SAP: {
                            //PS can do stuff here on the BAPI_PO_CREATE Structure
                            BeforeCallingBapi: null
                        }
                    });
                    _this.nowDate = null;
                    _this.bapiMgr = null;
                    _this.UOMMappingCache = {};
                    _this.DateTools = {
                        FormatDateParamsToString: function (date, dateParams) {
                            var hh = date.getHours(), mm = date.getMinutes(), ss = date.getSeconds(), ms = date.getMilliseconds(), MM = date.getMonth() + 1, DD = date.getDate();
                            dateParams.hours = hh < 10 ? "0" + hh : hh.toString();
                            dateParams.minutes = mm < 10 ? "0" + mm : mm.toString();
                            dateParams.seconds = ss < 10 ? "0" + ss : ss.toString();
                            if (ms < 10) {
                                dateParams.milliseconds = "00" + ms;
                            }
                            else if (ms < 100) {
                                dateParams.milliseconds = "0" + ms;
                            }
                            else {
                                dateParams.milliseconds = ms.toString();
                            }
                            dateParams.day = DD < 10 ? "0" + DD : DD.toString();
                            dateParams.month = MM < 10 ? "0" + MM : MM.toString();
                            dateParams.year = date.getFullYear().toString();
                        },
                        DateToEddString: function (date) {
                            var obj = {};
                            this.FormatDateParamsToString(date, obj);
                            var ret = obj.year + "-" + obj.month + "-" + obj.day + " " + obj.hours + ":" + obj.minutes + ":" + obj.seconds;
                            return ret;
                        },
                        DateToTimeStamp: function (date) {
                            var obj = {};
                            this.FormatDateParamsToString(date, obj);
                            var ret = obj.hours + ":" + obj.minutes + ":" + obj.seconds + "." + obj.milliseconds;
                            return ret;
                        }
                    };
                    return _this;
                }
                Object.defineProperty(Manager.prototype, "documentFactories", {
                    get: function () {
                        return Manager.documentFactories;
                    },
                    enumerable: false,
                    configurable: true
                });
                //////////////////////////////////////////
                // Overrides Lib.ERP.Manager interface
                //////////////////////////////////////////
                Manager.prototype.Init = function (parameterInstance) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    _super.prototype.Init.apply(this, args);
                    Lib.P2P.InitSAPConfiguration("SAP", parameterInstance);
                    // this.definition.configuration is often defined by calling erpMgr.ExtendDefinition({ configuration: "SapConfiguration" });
                    if (!this.definition.configuration) {
                        this.definition.configuration = Variable.GetValueAsString("SAPConfiguration");
                    }
                    if (Sys.ScriptInfo.IsServer()) {
                        this.bapiController = Lib.AP.SAP.GetNewBapiController();
                        this.sapControl = null;
                        this.sapConfigName = Variable.GetValueAsString("SAPConfiguration");
                        var bapiManagerInitiated = false;
                        if (Lib.AP.SAP.UsesWebServices()) {
                            bapiManagerInitiated = this.bapiController.InitBapiWSManager();
                            this.bapiMgr = this.bapiController.bapiWSManager;
                        }
                        else {
                            this.sapControl = Sys.Helpers.SAP.GetSAPControl();
                            if (this.sapControl) {
                                bapiManagerInitiated = this.bapiController.InitBapiManager(this.sapControl);
                                this.bapiMgr = this.bapiController.bapiManager;
                                if (!this.bapiMgr) {
                                    this.NotifyError("Failed to initiate SAP BapiMgr: " + this.sapControl.GetLastError());
                                    return false;
                                }
                                if (!this.bapiMgr.Connected) {
                                    this.NotifyError("Failed to initiate SAP BapiMgr: " + this.bapiMgr.GetLastError());
                                    return false;
                                }
                            }
                            else {
                                this.NotifyError("Failed to initiate SAP BapiMgr: No SAPConfiguration specified");
                                return false;
                            }
                        }
                        if (!bapiManagerInitiated) {
                            this.NotifyError("Failed to initiate SAP BapiMgr");
                            Sys.Helpers.SAP.SetLastError("Failed to initiate SAP BapiMgr.");
                            return false;
                        }
                    }
                    return true;
                };
                Manager.prototype.Finalize = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    if (!Sys.Helpers.IsEmpty(this.sapConfigName) && this.sapControl && this.bapiMgr && this.bapiMgr.Id) {
                        try {
                            this.sapControl.FinalizeBapiManagerByID(this.bapiMgr.Id);
                        }
                        finally {
                            this.bapiMgr = null;
                        }
                    }
                    this.bapiMgr = null;
                    Lib.AP.SAP.BapiControllerSingleton = null;
                    Sys.Helpers.SAP.SapControlSingleton = null;
                    _super.prototype.Finalize.apply(this, args);
                };
                //////////////////////////////////////////
                // Protected Lib.ERP.Manager variables
                //////////////////////////////////////////
                //////////////////////////////////////////
                // Lib.ERP.SAP.Manager methods
                //////////////////////////////////////////
                Manager.prototype.Sleep = function (sapControl, seconds) {
                    sapControl.Sleep(seconds * 1000);
                };
                Manager.prototype.FormatDate = function (value, options) {
                    this.nowDate = new Date();
                    if (value === "#PODATE#") {
                        value = this.nowDate;
                    }
                    return Lib.AP.SAP.FormatToSAPDateTimeFormat(value, options);
                };
                Manager.prototype.CallBAPI = function (BAPI, BAPIName) {
                    BAPIName = BAPIName || "BAPI";
                    var result = {
                        locked: false,
                        err: null
                    };
                    var err = BAPI.Call();
                    if (err) {
                        this.NotifyError("  " + BAPIName + " error: " + err);
                        // For debug
                        Variable.SetValueAsString(BAPIName + "_parameters", BAPI.GetJsonParameters(false));
                    }
                    var RETURN = BAPI.TablesPool.Get("RETURN");
                    if (RETURN) {
                        for (var erridx = 0; erridx < RETURN.Count; erridx++) {
                            var ret = RETURN.Get(erridx);
                            var type = ret.GetValue("TYPE");
                            var msg = "  Message #" + erridx + ": [" + type + "/" + ret.GetValue("ID") + "/" + ret.GetValue("NUMBER") + "] " + ret.GetValue("MESSAGE");
                            if (type === "E" || type === "A") {
                                if (Sys.Helpers.SAP.IsObjectLocked(ret)) {
                                    result.locked = true;
                                }
                                this.NotifyError(msg);
                                err += msg + "\n";
                            }
                            else if (type === "W") {
                                this.NotifyWarning(msg);
                            }
                            else {
                                Log.Info("SAP return info: " + msg);
                            }
                        }
                    }
                    result.err = err;
                    return result;
                };
                Manager.prototype.QueryInternalUOMCode = function (isoCode, bapiMgr) {
                    var code = this.UOMMappingCache[isoCode];
                    if (!code) {
                        Log.Info("QueryInternalUOMCode isoCode=" + isoCode);
                        // Query firstly local UOM table to find ERP specific UOM
                        var table = "P2P - UnitOfMeasure__";
                        var filter = "&(|(CompanyCode__=" + Data.GetValue("CompanyCode__") + ")(CompanyCode__=))(UnitOfMeasure__=" + isoCode + ")";
                        var attributes = ["IdentifierInERP__"];
                        Sys.GenericAPI.Query(table, filter, attributes, function (result, error) {
                            if (!error && result && result.length > 0) {
                                code = result[0].IdentifierInERP__;
                                Log.Info("Local UOM=" + code);
                            }
                        }, null, 1);
                        if (!code) {
                            // Query SAP internal unit measurement code from ISO code
                            // https://www.se80.co.uk/saptables/t/t006/t006.htm
                            table = "T006";
                            filter = "ISOCODE = '" + isoCode + "'";
                            attributes = ["MSEHI", "PRIMARY"];
                            var sapQueryOptions = Lib.AP.SAP.UsesWebServices() ? { handler: Lib.AP.SAP.SAPQueryClientServerHandler() } : {};
                            Sys.GenericAPI.SAPQuery(bapiMgr, table, filter, attributes, function (result, error) {
                                if (!error && result && result.length > 0) {
                                    var primaryUOM = Sys.Helpers.Array.Find(result, function (record) {
                                        return record.PRIMARY === "X";
                                    });
                                    code = primaryUOM ? primaryUOM.MSEHI : result[0].MSEHI;
                                    Log.Info("SAP UOM=" + code);
                                }
                            }, 100, sapQueryOptions);
                            // no SAP internal code found, use the one set by user
                            code = code || isoCode;
                        }
                        this.UOMMappingCache[isoCode] = code;
                    }
                    return code;
                };
                Manager.prototype.ISOToSAPUOM = function (isoUOM) {
                    return Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure") ? this.QueryInternalUOMCode(isoUOM, this.bapiMgr) : isoUOM;
                };
                Manager.documentFactories = {};
                return Manager;
            }(Lib.ERP.Manager.Instance));
            SAP.Manager = Manager;
        })(SAP = ERP.SAP || (ERP.SAP = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.Manager.factories.SAP = function () {
    return new Lib.ERP.SAP.Manager();
};
