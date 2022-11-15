/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAP_GoodReceipt_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Good receipt document for SAP - system library",
  "require": [
    "Lib_AP_SAP_V12.0.461.0",
    "Lib_ERP_GoodReceipt_V12.0.461.0",
    "Lib_ERP_SAP_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAP;
        (function (SAP) {
            var GoodReceipt = /** @class */ (function (_super) {
                __extends(GoodReceipt, _super);
                function GoodReceipt(manager) {
                    var _this = _super.call(this, manager) || this;
                    _this.cancelID = "";
                    return _this;
                }
                GoodReceipt.prototype.Create = function () {
                    var erpManager = this.manager;
                    return this.manager.SimpleDocCreation("GR", function () {
                        var grData = {};
                        if (Transaction.Read("SafePAC_SAPCOMMIT") === "AFTER_COMMIT") { // Fetch previous GR number if it already exists
                            grData.number = Transaction.Read("SafePAC_GRNUMBER");
                        }
                        else { // Really buid GR in SAP
                            // http://www.se80.co.uk/sapfms/b/bapi/bapi_goodsmvt_create.htm
                            var BAPI_GOODSMVT_CREATE = erpManager.bapiMgr.Add("BAPI_GOODSMVT_CREATE");
                            BAPI_GOODSMVT_CREATE.Reset();
                            var exports = BAPI_GOODSMVT_CREATE.ExportsPool;
                            // http://www.se80.co.uk/saptabfields/b/bapi/bapi2017_gm_code-gm_code.htm
                            var GOODSMVT_CODE = exports.Get("GOODSMVT_CODE");
                            GOODSMVT_CODE.SetValue("GM_CODE", "01");
                            // http://www.se80.co.uk/saptables/b/bapi/bapi2017_gm_head_01.htm
                            var GOODSMVT_HEADER = exports.Get("GOODSMVT_HEADER");
                            GOODSMVT_HEADER.SetValue("PSTNG_DATE", Lib.AP.SAP.FormatToSAPDateTimeFormat(erpManager.GetValue("PSTNG_DATE")));
                            GOODSMVT_HEADER.SetValue("DOC_DATE", Lib.AP.SAP.FormatToSAPDateTimeFormat(erpManager.GetValue("DOC_DATE")));
                            GOODSMVT_HEADER.SetValue("REF_DOC_NO", erpManager.GetValue("REF_DOC_NO"));
                            GOODSMVT_HEADER.SetValue("HEADER_TXT", erpManager.GetValue("HEADER_TXT"));
                            // http://www.se80.co.uk/saptables/b/bapi/bapi2017_gm_item_create.htm
                            var GOODSMVT_ITEM = BAPI_GOODSMVT_CREATE.TablesPool.Get("GOODSMVT_ITEM");
                            var nItems = erpManager.definition.managerToProcessTables.ItemsTable.GetItemCount();
                            for (var idx = 0; idx < nItems; idx++) {
                                var itemLine = erpManager.definition.managerToProcessTables.ItemsTable.GetItem(idx);
                                var qnt = erpManager.GetValue("ENTRY_QNT", itemLine) || 0;
                                var noMore = erpManager.GetValue("NO_MORE_GR", itemLine);
                                if (qnt || noMore) {
                                    var item = GOODSMVT_ITEM.AddNew();
                                    item.SetValue("MOVE_TYPE", "101");
                                    item.SetValue("ENTRY_QNT", qnt);
                                    item.SetValue("ENTRY_UOM", erpManager.ISOToSAPUOM(erpManager.GetValue("ENTRY_UOM", itemLine)));
                                    item.SetValue("PO_NUMBER", erpManager.GetValue("PO_NUMBER"));
                                    item.SetValue("PO_ITEM", erpManager.GetValue("PO_ITEM", itemLine));
                                    item.SetValue("MVT_IND", "B");
                                    if (noMore) {
                                        item.SetValue("NO_MORE_GR", "X");
                                    }
                                    Sys.Helpers.TryCallFunction("Lib.GR.Customization.Server.OnAddLine", erpManager, BAPI_GOODSMVT_CREATE, itemLine, item);
                                }
                            }
                            Sys.Helpers.TryCallFunction("Lib.GR.Customization.Server.OnBeforeCallBapi", erpManager, "CREATE", BAPI_GOODSMVT_CREATE);
                            grData = erpManager.CallBAPI(BAPI_GOODSMVT_CREATE, "BAPI_GOODSMVT_CREATE");
                            Sys.Helpers.TryCallFunction("Lib.GR.Customization.Server.OnAfterCallBapi", erpManager, "CREATE", BAPI_GOODSMVT_CREATE, grData);
                            if (Sys.Parameters.GetInstance("PAC").GetParameter("DumpBAPICalls", false)) {
                                Variable.SetValueAsString("BAPI_GOODSMVT_CREATE_Parameters", BAPI_GOODSMVT_CREATE.GetJsonParameters(false));
                            }
                            if (grData.locked) {
                                // notify object locked
                                erpManager.NotifyWarning("SAP object locked - cleanup connection");
                                try {
                                    erpManager.bapiMgr.CleanupConnection();
                                    erpManager.Sleep(erpManager.sapControl, 3);
                                }
                                catch (e) {
                                    erpManager.NotifyWarning("Exception during CleanupConnection: " + e);
                                }
                            }
                            if (!grData.err) {
                                grData.number = BAPI_GOODSMVT_CREATE.ImportsPool.Get("MATERIALDOCUMENT");
                                if (grData.number == null || Sys.Helpers.IsEmpty(grData.number)) {
                                    erpManager.NotifyError("No GRNumber returned");
                                    grData.number = "";
                                }
                                else {
                                    grData.number += "-" + BAPI_GOODSMVT_CREATE.ImportsPool.Get("MATDOCUMENTYEAR"); // Concat document year, since the GR is referenced like that in SAP
                                    Transaction.Write("SafePAC_GRNUMBER", grData.number);
                                    Log.Info("Created GR Number: " + grData.number);
                                    Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_BeforeWriteSAPCOMMIT");
                                    Transaction.Write("SafePAC_SAPCOMMIT", "BEFORE_COMMIT");
                                    Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_BeforeSAPCOMMIT");
                                    erpManager.bapiMgr.CommitWork();
                                    Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_AfterSAPCOMMIT");
                                    Transaction.Write("SafePAC_SAPCOMMIT", "AFTER_COMMIT");
                                    Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_AfterWriteSAPCOMMIT");
                                }
                                try {
                                    erpManager.bapiMgr.CleanupConnection();
                                }
                                catch (e) {
                                    erpManager.NotifyWarning("Exception during CleanupConnection: " + e);
                                }
                            }
                        }
                        return grData;
                    });
                };
                GoodReceipt.prototype.AttachURL = function () {
                    // This function is defined in Lib.Purchasing.URL, maybe one day it will be moved into a sys lib...
                    function AddParameter(baseUrl, name, value) {
                        return baseUrl + (baseUrl.indexOf("?") < 0 ? "?" : "&") + encodeURIComponent(name) + "=" + encodeURIComponent(value);
                    }
                    if (this.manager.definition.createDocInERP) {
                        var objectType = "BUS2017";
                        var documentId = this.manager.GetValue("GR_NUMBER");
                        Log.Info("document ID : " + documentId);
                        var url = Data.GetValue("ValidationUrl");
                        url = AddParameter(url, "OnQuit", "Close");
                        var attachResult = void 0;
                        if (Lib.AP.SAP.UsesWebServices()) {
                            attachResult = Sys.Helpers.TryCallFunction("Lib.P2P.SAP.Soap.Server.AttachUrlWS", objectType, documentId, url, Sys.Helpers.TryCallFunction("Lib.AP.SAP.PurchaseOrder.InitParameters"), "Goods Receipt on Esker Platform");
                        }
                        else {
                            attachResult = Sys.Helpers.SAP.AttachUrl(this.manager.sapControl, this.manager.sapConfigName, objectType, documentId, url, "Goods Receipt on Esker Platform");
                        }
                        if (attachResult) {
                            this.manager.NotifyError("Attach URL Error: " + attachResult);
                        }
                    }
                };
                GoodReceipt.prototype.CheckError = function () {
                    Log.Info("CheckErrorGR");
                    if (Transaction.Read("SafePAC_SAPCOMMIT") === "BEFORE_COMMIT") {
                        Lib.CommonDialog.NextAlert.Define("_GR creation in ERP error", "_GR creation in ERP error message", { isError: true, behaviorName: "GRCreationError" }, Transaction.Read("SafePAC_GRNUMBER"), this.manager.ERPName);
                        return true;
                    }
                    return false;
                };
                GoodReceipt.prototype.Retry = function (continueMode) {
                    Log.Info("RetryGR continueMode:" + continueMode);
                    if (continueMode === true) {
                        Transaction.Write("SafePAC_SAPCOMMIT", "AFTER_COMMIT");
                    }
                    else {
                        Transaction.Delete("SafePAC_GRNUMBER");
                        Transaction.Delete("SafePAC_SAPCOMMIT");
                    }
                    return false;
                };
                GoodReceipt.prototype.Cancel = function (GRNumber) {
                    var erpManager = this.manager;
                    return this.manager.SimpleDocCreation("GR", function () {
                        var grData = {
                            cancelID: null,
                            err: "",
                            locked: false
                        };
                        var array = GRNumber.split("-");
                        var MATDOC = array[0];
                        var MATDOCYEAR = array[1];
                        // http://www.se80.co.uk/sapfms/b/bapi/bapi_goodsmvt_cancel.htm
                        var BAPI_GOODSMVT_CANCEL = erpManager.bapiMgr.Add("BAPI_GOODSMVT_CANCEL");
                        BAPI_GOODSMVT_CANCEL.Reset();
                        var exports = BAPI_GOODSMVT_CANCEL.ExportsPool;
                        exports.SetValue("MATERIALDOCUMENT", MATDOC);
                        exports.SetValue("MATDOCUMENTYEAR", MATDOCYEAR);
                        BAPI_GOODSMVT_CANCEL.Call();
                        if (Sys.Parameters.GetInstance("PAC").GetParameter("DumpBAPICalls", false)) {
                            Variable.SetValueAsString("BAPI_GOODSMVT_CANCEL_Parameters", BAPI_GOODSMVT_CANCEL.GetJsonParameters(false));
                        }
                        var locked = false;
                        var errors = "";
                        var RETURN = BAPI_GOODSMVT_CANCEL.TablesPool.Get("RETURN");
                        var errCount = RETURN.Count;
                        for (var erridx = 0; erridx < RETURN.Count; erridx++) {
                            var ret = RETURN.Get(erridx);
                            var type = ret.GetValue("TYPE");
                            var ID = ret.GetValue("ID");
                            var NB = ret.GetValue("NUMBER");
                            // The GR is already cancelled in SAP, so we just skip this one
                            if (ID == "M7" && NB == "067") {
                                errCount--;
                                continue;
                            }
                            var msg = "Message #" + erridx + ": [" + type + "/" + ret.GetValue("ID") + "/" + ret.GetValue("NUMBER") + "] " + ret.GetValue("MESSAGE") + "\n";
                            erpManager.NotifyWarning(msg);
                            if (type === "E" || type === "A") {
                                if (Sys.Helpers.SAP.IsObjectLocked(ret)) {
                                    locked = true;
                                    errors += msg;
                                }
                                else {
                                    errors += msg;
                                }
                            }
                        }
                        if (!errors && locked) {
                            // notify object locked
                            erpManager.NotifyWarning("SAP object locked - cleanup connection");
                            try {
                                erpManager.bapiMgr.CleanupConnection();
                                erpManager.Sleep(erpManager.sapControl, 3);
                            }
                            catch (e) {
                                errors = "Exception during CleanupConnection: " + e;
                            }
                        }
                        if (errors || locked) {
                            erpManager.NotifyError(errors);
                        }
                        grData.err = errors;
                        grData.locked = locked;
                        if (errCount > 0) {
                            try {
                                erpManager.bapiMgr.CleanupConnection();
                            }
                            catch (e) {
                                erpManager.NotifyWarning("Exception during CleanupConnection: " + e);
                            }
                        }
                        else {
                            var imports = BAPI_GOODSMVT_CANCEL.ImportsPool;
                            var GOODSMVT_HEADRET = imports.Get("GOODSMVT_HEADRET");
                            grData.cancelID = GOODSMVT_HEADRET.GetValue("MAT_DOC");
                            if (grData.cancelID != "") {
                                grData.cancelID += "-" + GOODSMVT_HEADRET.GetValue("DOC_YEAR");
                            }
                            else {
                                erpManager.NotifyError("Could not retrieve cancel ID");
                            }
                            erpManager.bapiMgr.CommitWork();
                            try {
                                erpManager.bapiMgr.CleanupConnection();
                            }
                            catch (e) {
                                erpManager.NotifyWarning("Exception during CleanupConnection: " + e);
                            }
                        }
                        return grData;
                    });
                };
                return GoodReceipt;
            }(Lib.ERP.GoodReceipt.Instance));
            SAP.GoodReceipt = GoodReceipt;
        })(SAP = ERP.SAP || (ERP.SAP = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAP.Manager.documentFactories[Lib.ERP.GoodReceipt.docType] = function (manager) {
    return new Lib.ERP.SAP.GoodReceipt(manager);
};
