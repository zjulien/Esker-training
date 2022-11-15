/* eslint-disable class-methods-use-this */
/* LIB_DEFINITION{
  "name": "LIB_ERP_SAP_PurchaseOrder_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchase order document for SAP - system library",
  "require": [
    "Lib_ERP_PurchaseOrder_V12.0.461.0",
    "Lib_ERP_SAP_Manager_V12.0.461.0",
    "LIB_AP_SAP_V12.0.461.0",
    "Lib_P2P_SAP_SOAP_SERVER_V12.0.461.0",
    "Lib_AP_SAP_PurchaseOrder_Server_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var SAP;
        (function (SAP) {
            var SAPPurchaseOrder = /** @class */ (function (_super) {
                __extends(SAPPurchaseOrder, _super);
                function SAPPurchaseOrder(manager) {
                    return _super.call(this, manager) || this;
                }
                SAPPurchaseOrder.prototype.Create = function () {
                    var erpManager = this.manager;
                    var that = this;
                    return this.manager.SimpleDocCreation("PO", function () {
                        var poData = {
                            poLines: [],
                            number: null,
                            err: "",
                            locked: false
                        };
                        // https://www.sapdatasheet.org/abap/func/bapi_po_create1.html
                        var BAPI_PO_CREATE1 = erpManager.bapiMgr.Add("BAPI_PO_CREATE1");
                        BAPI_PO_CREATE1.Reset();
                        // https://www.sapdatasheet.org/abap/tabl/bapimepoheader.html
                        var POHEADER = BAPI_PO_CREATE1.ExportsPool.Get("POHEADER");
                        var POHEADERX = BAPI_PO_CREATE1.ExportsPool.Get("POHEADERX");
                        POHEADER.SetValue("DOC_TYPE", erpManager.GetValue("DOC_TYPE"));
                        POHEADERX.SetValue("DOC_TYPE", "X");
                        POHEADER.SetValue("COMP_CODE", erpManager.GetValue("CO_CODE"));
                        POHEADERX.SetValue("COMP_CODE", "X");
                        POHEADER.SetValue("PURCH_ORG", erpManager.GetValue("PURCH_ORG"));
                        POHEADERX.SetValue("PURCH_ORG", "X");
                        POHEADER.SetValue("PUR_GROUP", erpManager.GetValue("PUR_GROUP"));
                        POHEADERX.SetValue("PUR_GROUP", "X");
                        POHEADER.SetValue("VENDOR", Sys.Helpers.String.SAP.NormalizeID(erpManager.GetValue("VENDOR"), 10));
                        POHEADERX.SetValue("VENDOR", "X");
                        POHEADER.SetValue("CURRENCY", erpManager.GetValue("CURRENCY"));
                        POHEADERX.SetValue("CURRENCY", "X");
                        POHEADER.SetValue("EXCH_RATE", 0);
                        POHEADER.SetValue("EX_RATE_FX", "");
                        var VPER_START = erpManager.GetValue("VPER_START"); // Start of Validity Period
                        if (VPER_START) {
                            POHEADERX.SetValue("VPER_START", "X");
                            POHEADER.SetValue("VPER_START", erpManager.FormatDate(VPER_START));
                        }
                        var VPER_END = erpManager.GetValue("VPER_END"); // End of Validity Period
                        if (VPER_END) {
                            POHEADERX.SetValue("VPER_END", "X");
                            POHEADER.SetValue("VPER_END", erpManager.FormatDate(VPER_END));
                        }
                        poData[erpManager.definition.ERPToManagerNames.CO_CODE] = erpManager.GetValue("CO_CODE");
                        POHEADERX.SetValue("ITEM_INTVL", "X");
                        for (var idx = 0; idx < erpManager.definition.managerToProcessTables.ItemsTable.GetItemCount(); idx++) {
                            var item = erpManager.definition.managerToProcessTables.ItemsTable.GetItem(idx);
                            that.AddPOLine(item, erpManager, poData, POHEADER, BAPI_PO_CREATE1);
                        }
                        if (Transaction.Read("SafePAC_SAPCOMMIT") === "AFTER_COMMIT") {
                            poData.number = Transaction.Read("SafePAC_PONUMBER");
                        }
                        else {
                            if (Sys.Helpers.IsFunction(erpManager.definition.SAP.BeforeCallingBapi)) {
                                erpManager.definition.SAP.BeforeCallingBapi.call(erpManager, BAPI_PO_CREATE1);
                            }
                            Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_BeforeWriteSAPCOMMIT");
                            Transaction.Write("SafePAC_SAPCOMMIT", "BEFORE_COMMIT");
                            Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_BeforeSAPCOMMIT");
                            Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnBeforeCallBapi", erpManager, "CREATE", BAPI_PO_CREATE1);
                            var callBapiResult = erpManager.CallBAPI(BAPI_PO_CREATE1, "BAPI_PO_CREATE1");
                            poData.err = callBapiResult.err;
                            poData.locked = callBapiResult.locked;
                            Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnAfterCallBapi", erpManager, "CREATE", BAPI_PO_CREATE1, poData);
                            if (Sys.Parameters.GetInstance("PAC").GetParameter("DumpBAPICalls", false)) {
                                Variable.SetValueAsString("BAPI_PO_CREATE1_Parameters", BAPI_PO_CREATE1.GetJsonParameters(false));
                            }
                            if (!poData.err) {
                                poData.number = Transaction.Read("SafePAC_PONUMBER");
                                if (!poData.number) {
                                    poData.number = "" + BAPI_PO_CREATE1.ImportsPool.Get("EXPPURCHASEORDER");
                                    Transaction.Write("SafePAC_PONUMBER", poData.number);
                                    Log.Info("Created PO Number: " + poData.number);
                                    if (Sys.Helpers.IsEmpty(poData.number)) {
                                        erpManager.NotifyError("No PONumber returned");
                                    }
                                    erpManager.bapiMgr.CommitWork();
                                    Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_AfterSAPCOMMIT");
                                    Transaction.Write("SafePAC_SAPCOMMIT", "AFTER_COMMIT");
                                    Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_AfterWriteSAPCOMMIT");
                                    try {
                                        erpManager.bapiMgr.CleanupConnection();
                                    }
                                    catch (e) {
                                        erpManager.NotifyWarning("CleanupConnection Exception");
                                    }
                                }
                            }
                        }
                        return poData;
                    });
                };
                // headerChanges: { fieldName: { from: oldValue, to: newValue }, ... }
                // itemsChanges: { index: { fieldName: { from: oldValue, to: newValue } }, ... }
                // For instant, as standard, only item's delivery date change is supported
                // !!! if Lib.PO.Customization.Server.ChangePOInSAP is defined and returns true, it should also assume the change of delivery date
                SAPPurchaseOrder.prototype.Change = function (headerChanges, itemsChanges) {
                    /**
                     * If the changes on the line concern one of the following : ItemQuantity__, ItemUnitPrice__ or ItemGLAccount__
                     * They are updated on SAP side
                     */
                    // itemsChanges: { index: { fieldName: { from: oldValue, to: newValue } }, ... }
                    function onChangeLine(manager, BAPI_PO_CHANGE, changes, item, ItemLineNumber, AddPOLineFunction, DeletePOLineFunction) {
                        var PO_ITEM = ItemLineNumber;
                        var poItem, poItemx;
                        if (changes.Deleted) {
                            DeletePOLineFunction(ItemLineNumber, manager, BAPI_PO_CHANGE);
                        }
                        else {
                            Sys.Helpers.Object.ForEach(changes, function (from_to, fieldName) {
                                var value = item ? item.GetValue(fieldName) : null;
                                if (fieldName == "ItemRequestedDeliveryDate__") {
                                    var POSCHEDULE = BAPI_PO_CHANGE.TablesPool.Get("POSCHEDULE");
                                    var POSCHEDULEX = BAPI_PO_CHANGE.TablesPool.Get("POSCHEDULEX");
                                    var sched = POSCHEDULE.AddNew();
                                    var schedx = POSCHEDULEX.AddNew();
                                    sched.SetValue("PO_ITEM", PO_ITEM);
                                    schedx.SetValue("PO_ITEM", PO_ITEM);
                                    schedx.SetValue("PO_ITEMX", "X");
                                    sched.SetValue("DELIVERY_DATE", manager.FormatDate(value, { forceRFCDateFormat: true }));
                                    schedx.SetValue("DELIVERY_DATE", "X");
                                }
                                else if (fieldName == "ItemQuantity__" ||
                                    fieldName == "ItemUnitPrice__" || fieldName == "ItemDescription__") {
                                    var POITEM = BAPI_PO_CHANGE.TablesPool.Get("POITEM");
                                    var POITEMX = BAPI_PO_CHANGE.TablesPool.Get("POITEMX");
                                    if (!poItem) {
                                        poItem = POITEM.AddNew();
                                        poItemx = POITEMX.AddNew();
                                        poItem.SetValue("PO_ITEM", PO_ITEM);
                                        poItemx.SetValue("PO_ITEM", PO_ITEM);
                                        poItemx.SetValue("PO_ITEMX", "X");
                                    }
                                    if (fieldName == "ItemQuantity__") {
                                        poItem.SetValue("QUANTITY", value);
                                        poItemx.SetValue("QUANTITY", "X");
                                    }
                                    if (fieldName == "ItemUnitPrice__") {
                                        poItem.SetValue("NET_PRICE", value);
                                        poItemx.SetValue("NET_PRICE", "X");
                                    }
                                    if (fieldName == "ItemDescription__") {
                                        if (typeof value === "string") {
                                            value = value.substring(0, 40);
                                        }
                                        poItem.SetValue("SHORT_TEXT", value);
                                        poItemx.SetValue("SHORT_TEXT", "X");
                                    }
                                }
                                else if (fieldName == "ItemGLAccount__") {
                                    var POACCOUNT = BAPI_PO_CHANGE.TablesPool.Get("POACCOUNT");
                                    var POACCOUNTX = BAPI_PO_CHANGE.TablesPool.Get("POACCOUNTX");
                                    var poAccount = POACCOUNT.AddNew();
                                    var poAccountx = POACCOUNTX.AddNew();
                                    poAccount.SetValue("PO_ITEM", PO_ITEM);
                                    poAccountx.SetValue("PO_ITEM", PO_ITEM);
                                    poAccountx.SetValue("PO_ITEMX", "X");
                                    poAccount.SetValue("GL_ACCOUNT", Sys.Helpers.String.SAP.NormalizeID(value, 10));
                                    poAccountx.SetValue("GL_ACCOUNT", "X");
                                }
                                else if (fieldName == "Added") {
                                    var poData = {
                                        poLines: [],
                                        number: null,
                                        err: "",
                                        locked: false
                                    };
                                    var POHEADER = BAPI_PO_CHANGE.ExportsPool.Get("POHEADER");
                                    AddPOLineFunction(item, manager, poData, POHEADER, BAPI_PO_CHANGE);
                                }
                                else {
                                    Log.Info("Change " + fieldName + " in SAP not supported");
                                }
                            });
                        }
                    }
                    var that = this;
                    var erpManager = this.manager;
                    return this.manager.SimpleDocCreation("PO", function () {
                        var BAPI_PO_CHANGE = erpManager.bapiMgr.Add("BAPI_PO_CHANGE");
                        BAPI_PO_CHANGE.Reset();
                        BAPI_PO_CHANGE.ExportsPool.Set("PURCHASEORDER", erpManager.GetValue("PO_NUMBER"));
                        if (headerChanges) {
                            Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.ChangePOInSAP", erpManager, BAPI_PO_CHANGE, headerChanges);
                        }
                        Sys.Helpers.Object.ForEach(itemsChanges, function (itemChanges, idx) {
                            var item;
                            var flag = false;
                            var i = 0;
                            var ItemLineNumber = idx.split("###")[0];
                            var ItemsCount = erpManager.definition.managerToProcessTables.ItemsTable.GetItemCount();
                            while (i < ItemsCount && flag == false) {
                                item = erpManager.definition.managerToProcessTables.ItemsTable.GetItem(Number(i));
                                if (item.GetValue("LineItemNumber__") == ItemLineNumber) {
                                    flag = true;
                                }
                                i++;
                            }
                            //Deprecated : keep the call for backward compatibility
                            var ChangePOInSAPCall = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.ChangePOInSAP", erpManager, BAPI_PO_CHANGE, itemChanges, item);
                            //New UserExist that replace ChangePOInSAP with item param
                            var OnChangeLineCall = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnChangeLine", erpManager, BAPI_PO_CHANGE, itemChanges, item);
                            if (!OnChangeLineCall && !ChangePOInSAPCall) {
                                onChangeLine(erpManager, BAPI_PO_CHANGE, itemChanges, item, ItemLineNumber, that.AddPOLine.bind(that), that.DeletePOLine.bind(that));
                            }
                            // eslint-disable-next-line no-invalid-this
                        }, this);
                        Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnBeforeCallBapi", erpManager, "CHANGE", BAPI_PO_CHANGE);
                        var result = erpManager.CallBAPI(BAPI_PO_CHANGE, "BAPI_PO_CHANGE");
                        Sys.Helpers.TryCallFunction("Lib.PO.Customization.OnAfterCallBapi", erpManager, "CHANGE", BAPI_PO_CHANGE, result);
                        if (Sys.Parameters.GetInstance("PAC").GetParameter("DumpBAPICalls", false)) {
                            Variable.SetValueAsString("BAPI_PO_CHANGE_Parameters", BAPI_PO_CHANGE.GetJsonParameters(false));
                        }
                        if (!result.err) {
                            Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_BeforeSAPCOMMIT");
                            erpManager.bapiMgr.CommitWork();
                            Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_AfterSAPCOMMIT");
                            try {
                                erpManager.bapiMgr.CleanupConnection();
                            }
                            catch (e) {
                                erpManager.NotifyWarning("CleanupConnection Exception");
                            }
                        }
                        return result;
                    });
                };
                SAPPurchaseOrder.prototype.AttachURL = function () {
                    // This function is defined in Lib.Purchasing.URL, maybe one day it will be moved into a sys lib...
                    function AddParameter(url, name, value) {
                        return url + (url.indexOf("?") < 0 ? "?" : "&") + encodeURIComponent(name) + "=" + encodeURIComponent(value);
                    }
                    if (this.manager.definition.createDocInERP) {
                        var objectType = "BUS2012";
                        var documentId = this.manager.GetValue("PO_NUMBER");
                        var url = Data.GetValue("ValidationUrl");
                        url = AddParameter(url, "OnQuit", "Close");
                        var attachResult = void 0;
                        if (Lib.AP.SAP.UsesWebServices()) // useWebServiceMode
                         {
                            attachResult = Sys.Helpers.TryCallFunction("Lib.P2P.SAP.Soap.Server.AttachUrlWS", objectType, documentId, url, Sys.Helpers.TryCallFunction("Lib.AP.SAP.PurchaseOrder.InitParameters"), "Purchase Order on Esker Platform");
                        }
                        else {
                            attachResult = Sys.Helpers.SAP.AttachUrl(this.manager.sapControl, this.manager.sapConfigName, objectType, documentId, url, "Purchase Order on Esker Platform");
                        }
                        if (attachResult) {
                            this.manager.NotifyError("Attach URL Error: " + attachResult);
                        }
                    }
                };
                SAPPurchaseOrder.prototype.CheckError = function () {
                    Log.Info("PO:CheckError");
                    if (Transaction.Read("SafePAC_SAPCOMMIT") === "BEFORE_COMMIT") {
                        Lib.CommonDialog.NextAlert.Define("_PO creation in ERP error", "_PO creation in ERP error message", { isError: true, behaviorName: "POCreationError" }, this.manager.ERPName);
                        return true;
                    }
                    return false;
                };
                SAPPurchaseOrder.prototype.Retry = function (continueMode) {
                    Log.Info("PO:Retry continueMode:" + continueMode);
                    if (continueMode === true) {
                        Transaction.Write("SafePAC_SAPCOMMIT", "AFTER_COMMIT");
                    }
                    else {
                        Transaction.Delete("SafePAC_PONUMBER");
                        Transaction.Delete("SafePAC_SAPCOMMIT");
                    }
                    return false;
                };
                SAPPurchaseOrder.prototype.Cancel = function () {
                    var erpManager = this.manager;
                    var that = this;
                    return this.manager.SimpleDocCreation("PO", function () {
                        var BAPI_PO_CHANGE = erpManager.bapiMgr.Add("BAPI_PO_CHANGE");
                        BAPI_PO_CHANGE.Reset();
                        BAPI_PO_CHANGE.ExportsPool.Set("PURCHASEORDER", erpManager.GetValue("PO_NUMBER"));
                        for (var idx = 0; idx < erpManager.definition.managerToProcessTables.ItemsTable.GetItemCount(); idx++) {
                            var item = erpManager.definition.managerToProcessTables.ItemsTable.GetItem(idx);
                            that.DeletePOLine(item.GetValue("LineItemNumber__"), erpManager, BAPI_PO_CHANGE);
                        }
                        var result = erpManager.CallBAPI(BAPI_PO_CHANGE, "BAPI_PO_CHANGE");
                        if (Sys.Parameters.GetInstance("PAC").GetParameter("DumpBAPICalls", false)) {
                            Variable.SetValueAsString("BAPI_PO_CHANGE_Parameters", BAPI_PO_CHANGE.GetJsonParameters(false));
                        }
                        if (!result.err) {
                            Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_BeforeSAPCOMMIT");
                            erpManager.bapiMgr.CommitWork();
                            Sys.Helpers.TriggerTestingEvent("Lib_ERP_SAP_AfterSAPCOMMIT");
                            try {
                                erpManager.bapiMgr.CleanupConnection();
                            }
                            catch (e) {
                                erpManager.NotifyWarning("CleanupConnection Exception");
                            }
                        }
                        return result;
                    });
                };
                SAPPurchaseOrder.prototype.SetShipToAddress = function (item, erpManager, BAPI_PO_CREATE1) {
                    // shipToAddress is coming from TechnicalData and has form bellow :
                    // {"ToName":"ESKER DEMO - AURÉLIEN COQ - PROCESS","ToSub":"Building A","ToMail":"10 rue des Emeraudes","ToPostal":"69006","ToCountry":"FR","ToState":"Rhone","ToCity":"Lyon","ForceCountry":"true","IsCustomShipToAddress":true}
                    var shipToAddress = erpManager.GetValue("POADDRDELIVERY");
                    if (shipToAddress.IsCustomShipToAddress) {
                        var PO_ITEM = erpManager.GetValue("PO_ITEM", item);
                        var POADDRDELIVERY = BAPI_PO_CREATE1.TablesPool.Get("POADDRDELIVERY");
                        var addrDelivery = POADDRDELIVERY.AddNew();
                        addrDelivery.SetValue("PO_ITEM", PO_ITEM);
                        addrDelivery.SetValue("NAME", erpManager.GetValue("POADDRDELIVERY_NAME"));
                        addrDelivery.SetValue("NAME_2", erpManager.GetValue("POADDRDELIVERY_NAME_2"));
                        addrDelivery.SetValue("TEL1_NUMBR", erpManager.GetValue("POADDRDELIVERY_TEL1_NUMBR"));
                        addrDelivery.SetValue("E_MAIL", erpManager.GetValue("POADDRDELIVERY_E_MAIL"));
                        addrDelivery.SetValue("BUILD_LONG", shipToAddress.ToSub);
                        addrDelivery.SetValue("STREET", shipToAddress.ToMail);
                        addrDelivery.SetValue("POSTL_COD1", shipToAddress.ToPostal);
                        addrDelivery.SetValue("CITY", shipToAddress.ToCity);
                        addrDelivery.SetValue("REGION", shipToAddress.ToState);
                        addrDelivery.SetValue("COUNTRYISO", shipToAddress.ToCountry);
                    }
                };
                SAPPurchaseOrder.prototype.AddPOLine = function (item, erpManager, poData, POHEADER, BAPI_PO_CREATE1) {
                    var POITEM = BAPI_PO_CREATE1.TablesPool.Get("POITEM");
                    var POITEMX = BAPI_PO_CREATE1.TablesPool.Get("POITEMX");
                    var POSCHEDULE = BAPI_PO_CREATE1.TablesPool.Get("POSCHEDULE");
                    var POSCHEDULEX = BAPI_PO_CREATE1.TablesPool.Get("POSCHEDULEX");
                    var POACCOUNT, POACCOUNTX;
                    var POLIMITS;
                    var poAccount, poAccountx;
                    var PO_ITEM = erpManager.GetValue("PO_ITEM", item);
                    var ACCTASSCAT = erpManager.GetValue("ACCTASSCAT", item);
                    var PUR_MAT = erpManager.GetValue("PUR_MAT", item);
                    var SHORT_TEXT = erpManager.GetValue("SHORT_TEXT", item);
                    if (SHORT_TEXT) {
                        SHORT_TEXT = SHORT_TEXT.substring(0, 40);
                    }
                    var QUANTITY = erpManager.GetValue("QUANTITY", item);
                    var NET_PRICE = erpManager.GetValue("NET_PRICE", item);
                    var UNIT = erpManager.ISOToSAPUOM(erpManager.GetValue("UNIT", item));
                    var TAX_CODE = erpManager.GetValue("TAX_CODE", item);
                    var G_L_ACCT = erpManager.GetValue("G_L_ACCT", item);
                    var ASSET_NO = erpManager.GetValue("ASSET_NO", item);
                    var PLANT = erpManager.GetValue("PLANT", item);
                    var MAT_GRP = erpManager.GetValue("MAT_GRP", item);
                    var COST_CTR = erpManager.GetValue("COST_CTR", item);
                    var ORDER_NO = erpManager.GetValue("ORDER_NO", item);
                    var WBS_ELEM_E = erpManager.GetValue("WBS_ELEM_E", item);
                    var DELIV_DATE = erpManager.GetValue("DELIV_DATE", item);
                    var GR_IND = erpManager.GetValue("GR_IND", item);
                    var poItem = POITEM.AddNew();
                    var poItemx = POITEMX.AddNew();
                    poItem.SetValue("PO_ITEM", PO_ITEM);
                    poItemx.SetValue("PO_ITEM", PO_ITEM);
                    poItemx.SetValue("PO_ITEMX", "X");
                    poItem.SetValue("QUANTITY", QUANTITY);
                    poItemx.SetValue("QUANTITY", "X");
                    // Material
                    if (PUR_MAT) {
                        poItem.SetValue("EMATERIAL", PUR_MAT);
                        poItemx.SetValue("EMATERIAL", "X");
                    }
                    // PLANT
                    poItem.SetValue("PLANT", PLANT);
                    poItemx.SetValue("PLANT", "X");
                    // NetPrice
                    poItem.SetValue("NET_PRICE", NET_PRICE);
                    poItemx.SetValue("NET_PRICE", "X");
                    poItem.SetValue("PO_PRICE", "2");
                    poItemx.SetValue("PO_PRICE", "X");
                    // UNIT
                    // PriceUnit
                    if (UNIT) {
                        poItem.SetValue("PO_UNIT", UNIT);
                        poItemx.SetValue("PO_UNIT", "X");
                        poItem.SetValue("PRICE_UNIT", 1);
                        poItemx.SetValue("PRICE_UNIT", "X");
                    }
                    // ShortText
                    poItem.SetValue("SHORT_TEXT", SHORT_TEXT);
                    poItemx.SetValue("SHORT_TEXT", "X");
                    //TAX_CODE
                    if (TAX_CODE) {
                        poItem.SetValue("TAX_CODE", TAX_CODE);
                        poItemx.SetValue("TAX_CODE", "X");
                    }
                    //MAT_GRP
                    if (MAT_GRP) {
                        poItem.SetValue("MATL_GROUP", MAT_GRP);
                        poItemx.SetValue("MATL_GROUP", "X");
                    }
                    //GR_IND
                    poItem.SetValue("GR_IND", GR_IND ? "X" : "");
                    poItemx.SetValue("GR_IND", "X");
                    // http://www.se80.co.uk/saptables/b/bapi/bapiekkn.htm
                    // https://www.sapdatasheet.org/abap/tabl/bapimepoaccount.html
                    if (ACCTASSCAT) {
                        poItem.SetValue("ACCTASSCAT", ACCTASSCAT);
                        poItemx.SetValue("ACCTASSCAT", "X");
                        if (ACCTASSCAT === "F" || ACCTASSCAT === "A" || ACCTASSCAT === "K" || ACCTASSCAT === "P") {
                            if (!POACCOUNT) {
                                POACCOUNT = BAPI_PO_CREATE1.TablesPool.Get("POACCOUNT");
                                POACCOUNTX = BAPI_PO_CREATE1.TablesPool.Get("POACCOUNTX");
                            }
                            poAccount = POACCOUNT.AddNew();
                            poAccountx = POACCOUNTX.AddNew();
                            poAccount.SetValue("PO_ITEM", PO_ITEM);
                            poAccountx.SetValue("PO_ITEM", PO_ITEM);
                            poAccountx.SetValue("PO_ITEMX", "X");
                            if (ACCTASSCAT === "F") {
                                poAccount.SetValue("ORDERID", Sys.Helpers.String.SAP.NormalizeID(ORDER_NO, 12));
                                poAccountx.SetValue("ORDERID", "X");
                            }
                            else if (ACCTASSCAT === "A") {
                                poAccount.SetValue("ASSET_NO", Sys.Helpers.String.SAP.NormalizeID(ASSET_NO, 12));
                                poAccountx.SetValue("ASSET_NO", "X");
                            }
                            else if (ACCTASSCAT === "P") {
                                poAccount.SetValue("WBS_ELEMENT", Sys.Helpers.String.SAP.NormalizeID(WBS_ELEM_E, 24));
                                poAccountx.SetValue("WBS_ELEMENT", "X");
                            }
                            else // if (ACCTASSCAT === "K")
                             {
                                if (COST_CTR) {
                                    poAccount.SetValue("COSTCENTER", Sys.Helpers.String.SAP.NormalizeID(COST_CTR, 10));
                                    poAccountx.SetValue("COSTCENTER", "X");
                                }
                                if (G_L_ACCT) {
                                    poAccount.SetValue("GL_ACCOUNT", Sys.Helpers.String.SAP.NormalizeID(G_L_ACCT, 10));
                                    poAccountx.SetValue("GL_ACCOUNT", "X");
                                }
                            }
                        }
                    }
                    // https://www.sapdatasheet.org/abap/tabl/bapimeposchedule.html
                    var sched = POSCHEDULE.AddNew();
                    var schedx = POSCHEDULEX.AddNew();
                    sched.SetValue("PO_ITEM", PO_ITEM);
                    schedx.SetValue("PO_ITEM", PO_ITEM);
                    schedx.SetValue("PO_ITEMX", "X");
                    sched.SetValue("SCHED_LINE", "0001");
                    schedx.SetValue("SCHED_LINE", "0001");
                    schedx.SetValue("SCHED_LINEX", "X");
                    sched.SetValue("DELIVERY_DATE", erpManager.FormatDate(DELIV_DATE, { forceRFCDateFormat: true }));
                    schedx.SetValue("DELIVERY_DATE", "X");
                    if (poItem.GetValue("ITEM_CAT") !== "1") {
                        sched.SetValue("QUANTITY", QUANTITY);
                    }
                    else {
                        // Limit item: no quantity
                        sched.SetValue("QUANTITY", 1);
                        if (!POLIMITS) {
                            POLIMITS = BAPI_PO_CREATE1.TablesPool.Get("POLIMITS");
                        }
                        var limit = POLIMITS.AddNew();
                        // OverallLimit
                        limit.SetValue("LIMIT", "");
                        // ExpectedValue
                        limit.SetValue("EXP_VALUE", "");
                    }
                    schedx.SetValue("QUANTITY", "X");
                    var poline = {
                        LineType__: Lib.P2P.LineType.PO
                    };
                    poline[erpManager.definition.ERPToManagerNames.VENDOR] = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(erpManager.GetValue("VENDOR"));
                    poline[erpManager.definition.ERPToManagerNames.PO_ITEM] = PO_ITEM;
                    poline[erpManager.definition.ERPToManagerNames.SHORT_TEXT] = SHORT_TEXT;
                    poline[erpManager.definition.ERPToManagerNames.PUR_MAT] = PUR_MAT;
                    poline[erpManager.definition.ERPToManagerNames.TAX_CODE] = TAX_CODE;
                    poline[erpManager.definition.ERPToManagerNames.NET_PRICE] = NET_PRICE;
                    poline[erpManager.definition.ERPToManagerNames.QUANTITY] = QUANTITY;
                    poline[erpManager.definition.ERPToManagerNames.G_L_ACCT] = G_L_ACCT;
                    poline[erpManager.definition.ERPToManagerNames.COST_CTR] = COST_CTR;
                    poline[erpManager.definition.ERPToManagerNames.DELIV_DATE] = DELIV_DATE;
                    poline[erpManager.definition.ERPToManagerNames.PLANT] = PLANT;
                    this.SetShipToAddress(item, erpManager, BAPI_PO_CREATE1);
                    Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnAddLine", erpManager, BAPI_PO_CREATE1, item, poItem, poItemx, poAccount, poAccountx, sched, schedx, poline);
                    poData.poLines.push(poline);
                };
                SAPPurchaseOrder.prototype.DeletePOLine = function (itemLineNumber, erpManager, BAPI_PO_CHANGE) {
                    var PO_ITEM = itemLineNumber; // erpManager.GetValue<string>("PO_ITEM", item);
                    var poItem, poItemx;
                    var POITEM = BAPI_PO_CHANGE.TablesPool.Get("POITEM");
                    var POITEMX = BAPI_PO_CHANGE.TablesPool.Get("POITEMX");
                    poItem = POITEM.AddNew();
                    poItemx = POITEMX.AddNew();
                    poItem.SetValue("PO_ITEM", PO_ITEM);
                    poItem.SetValue("DELETE_IND", "L");
                    poItemx.SetValue("PO_ITEM", PO_ITEM);
                    poItemx.SetValue("PO_ITEMX", "X");
                    poItemx.SetValue("DELETE_IND", "L");
                };
                return SAPPurchaseOrder;
            }(Lib.ERP.PurchaseOrder.Instance));
            SAP.SAPPurchaseOrder = SAPPurchaseOrder;
        })(SAP = ERP.SAP || (ERP.SAP = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
Lib.ERP.SAP.Manager.documentFactories[Lib.ERP.PurchaseOrder.docType] = function (manager) {
    return new Lib.ERP.SAP.SAPPurchaseOrder(manager);
};
