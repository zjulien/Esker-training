///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_GRCanceler_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing library",
  "require": [
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_Synchronizer",
    "Sys/Sys_Parameters",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_P2P_Inventory_Server_V12.0.461.0",
    "[Lib_Custom_Parameters]",
    "[Lib_P2P_Custom_Parameters]",
    "Lib_Purchasing_GRBudget_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var GRCanceler;
        (function (GRCanceler) {
            var cancelLockPrefix = "CancelGRlck_";
            var grCancelDelay = 10;
            var grRuidEx = null;
            var grCancelComment = null;
            var grTransport = null;
            GRCanceler.grVars = null;
            var impactedDocNumbers = null;
            function Cancel(ruidEx, comment) {
                Log.Info("Cancel, ruidEx: " + ruidEx + ", comment: " + comment);
                grRuidEx = ruidEx;
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var lockOk = Process.PreventConcurrentAccess(cancelLockPrefix + grRuidEx, function () {
                        FindGR()
                            .Then(function () {
                            var GROwnerUser = Users.GetUser(GRCanceler.grVars.GetValue_String("OwnerId", 0));
                            var GROwner = GROwnerUser.GetValue("DisplayName");
                            var validator = Users.GetUser(Data.GetValue("OwnerID"));
                            var validatorName = validator.GetValue("DisplayName");
                            if (validatorName !== GROwner) {
                                grCancelComment = Language.Translate("_On behalf of", false, validatorName, GROwner) + ":\n" + comment;
                                if (GROwnerUser.IsGroup) {
                                    var query = Process.CreateQuery();
                                    query.SetSpecificTable("ODUSERGROUP");
                                    var users = validator.GetBackedUpUsers();
                                    var filter_1 = "(&(GROUPOWNERID=" + GROwnerUser.GetValue("FullDN") + ")(UserOwnerID[=](";
                                    Sys.Helpers.Array.ForEach(users, function (key) {
                                        filter_1 += Sys.Helpers.String.EscapeValueForLdapFilterForINClause(key);
                                        filter_1 += ",";
                                    });
                                    filter_1 += ")))";
                                    query.SetFilter(filter_1);
                                    query.SetAttributesList("UserOwnerID");
                                    query.SetOptionEx("Limit=1");
                                    var record = query.MoveFirst() ? query.MoveNextRecord() : null;
                                    if (record) {
                                        var onwerid = record.GetVars().GetValue_String("UserOwnerID", 0);
                                        var realUser = Users.GetUser(onwerid);
                                        if (realUser) {
                                            grCancelComment = Language.Translate("_On behalf of", false, validatorName, realUser.GetVars().GetValue_String("DisplayName", 0));
                                        }
                                    }
                                }
                            }
                            else {
                                grCancelComment = comment;
                            }
                        })
                            .Then(CheckCancelable)
                            .Then(CheckCancelableWithoutReturnOrder)
                            .Then(CancelBudgetImpacts)
                            .Then(CancelInERP)
                            .Then(MarkGRItemsAsCanceled)
                            .Then(CancelStockMovement)
                            .Then(ReOpenPR)
                            .Then(ReOpenAndResumePO)
                            .Then(MarkGRAsCanceled)
                            .Then(resolve)
                            .Catch(reject);
                    }, null, grCancelDelay);
                    if (!lockOk) {
                        throw new Error("Cannot prevent concurrent access on GR");
                    }
                });
            }
            GRCanceler.Cancel = Cancel;
            function FindGR() {
                Log.Info("FindGR");
                return FindTransportByID({ id: grRuidEx, needDataFile: true })
                    .Then(function (transport) {
                    grTransport = transport;
                    GRCanceler.grVars = transport.GetUninheritedVars();
                });
            }
            function CheckCancelable() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("CheckCancelable");
                    var state = GRCanceler.grVars.GetValue_Long("State", 0);
                    var status = GRCanceler.grVars.GetValue_String("GRStatus__", 0);
                    if (state !== 100 || status === "Canceled") {
                        throw new NoLongerCancelable("This GR cannot be canceled. Unexpected State: " + state + ", GRStatus__: " + status);
                    }
                    resolve();
                });
            }
            GRCanceler.CheckCancelable = CheckCancelable;
            function CheckCancelableWithoutReturnOrder() {
                var grNumber = GRCanceler.grVars.GetValue_String("GRNumber__", 0);
                var queryOptions = {
                    table: "CDLNAME#Goods receipt V2.LineItems__",
                    filter: (Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("GRNumber__", grNumber), Sys.Helpers.LdapUtil.FilterStrictlyGreater("Line_ReturnedQuantity__", "0")).toString()),
                    attributes: ["Line_Number__"]
                };
                return Sys.GenericAPI.PromisedQuery(queryOptions).Then(function (queryResult) {
                    if (queryResult.length > 0) {
                        throw new NoLongerCancelable("This GR cannot be canceled. At least one item has been returned");
                    }
                });
            }
            GRCanceler.CheckCancelableWithoutReturnOrder = CheckCancelableWithoutReturnOrder;
            function CancelInERP() {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    Log.Info("CancelInERP");
                    var GRNumber = GRCanceler.grVars.GetValue_String("GRNumber__", 0);
                    var ret = Lib.ERP.ExecuteERPFunc("Cancel", "GR", GRNumber);
                    if (!ret || ret.error) {
                        reject("Error during cancel in ERP");
                    }
                    else {
                        var grData = ret.ret;
                        if (grData.cancelID) {
                            Data.SetValue("Cancellation_ID_in_ERP__", grData.cancelID);
                        }
                        resolve();
                    }
                });
            }
            function CancelBudgetImpacts() {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    Log.Info("CancelBudgetImpacts");
                    var ok = Lib.Purchasing.GRBudget.AsCanceled({
                        document: grTransport
                    });
                    if (ok) {
                        resolve();
                    }
                    else {
                        reject("Error during budget update");
                    }
                });
            }
            function MarkGRItemsAsCanceled() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var grNumber = GRCanceler.grVars.GetValue_String("GRNumber__", 0);
                    Log.Info("MarkGRItemsAsCanceled, grNumber: " + grNumber);
                    var query = Process.CreateQuery();
                    query.Reset();
                    query.SetAttributesList("*");
                    query.SetSpecificTable("P2P - Goods receipt - Items__");
                    query.SetFilter("GRNumber__=" + grNumber);
                    query.MoveFirst();
                    var record = query.MoveNextRecord();
                    if (!record) {
                        throw new Error("Cannot find any GR items");
                    }
                    impactedDocNumbers = { PR: {}, PO: {} };
                    var impactedLineNumbers = [];
                    var poNumber;
                    while (record) {
                        var vars = record.GetVars();
                        var prNumber = vars.GetValue_String("RequisitionNumber__", 0);
                        poNumber = vars.GetValue_String("OrderNumber__", 0);
                        // add unique
                        impactedDocNumbers.PR[prNumber] = true;
                        impactedDocNumbers.PO[poNumber] = true;
                        vars.AddValue_String("Status__", "Canceled", true);
                        record.Commit();
                        if (record.GetLastError() !== 0) {
                            throw new Error("Cannot commit record. Details: " + record.GetLastErrorMessage());
                        }
                        impactedLineNumbers.push(vars.GetValue_String("LineNumber__", 0));
                        record = query.MoveNextRecord();
                    }
                    // For all impacted GR items, remove DeliveryCompleted__
                    if (impactedLineNumbers.length > 0) {
                        var filter = "(LineNumber__=" + impactedLineNumbers.join(")(LineNumber__=") + ")";
                        if (impactedLineNumbers.length > 1) {
                            filter = "(|" + filter + ")";
                        }
                        filter = "(&(!(Status__=Canceled))(OrderNumber__=" + poNumber + ")(DeliveryCompleted__=1)" + filter + ")";
                        query.Reset();
                        query.SetAttributesList("*");
                        query.SetSpecificTable("P2P - Goods receipt - Items__");
                        query.SetFilter(filter);
                        query.MoveFirst();
                        while ((record = query.MoveNextRecord())) {
                            var vars = record.GetVars();
                            vars.AddValue_Long("DeliveryCompleted__", 0, true);
                            record.Commit();
                            if (record.GetLastError() !== 0) {
                                throw new Error("Cannot commit record. Details: " + record.GetLastErrorMessage());
                            }
                        }
                    }
                    // convert into arrays
                    impactedDocNumbers.PR = Object.keys(impactedDocNumbers.PR);
                    impactedDocNumbers.PO = Object.keys(impactedDocNumbers.PO);
                    resolve();
                });
            }
            function CancelStockMovement() {
                if (Lib.P2P.Inventory.IsEnabled()) {
                    return Lib.P2P.Inventory.DeleteInventoryMovements(grRuidEx)
                        .Then(function (deletedInventoryMovement) {
                        var inventoryFilter = [];
                        deletedInventoryMovement.forEach(function (inventoryMovement) {
                            inventoryFilter.push({
                                companyCode: Data.GetValue("CompanyCode__"),
                                itemNumber: inventoryMovement.itemNumber,
                                warehouseNumber: inventoryMovement.warehouseID
                            });
                        });
                        return Lib.P2P.Inventory.UpdateInventoryStock(inventoryFilter, true);
                    });
                }
                return Sys.Helpers.Promise.Resolve();
            }
            function ReOpenPR() {
                return ReOpenDocuments({
                    numbers: impactedDocNumbers.PR,
                    processName: "Purchase requisition V2",
                    shortProcessName: "PR",
                    numberFieldName: "RequisitionNumber__",
                    beforeProcessingDocument: function (transport, transportToUpdate) {
                        var vars = transportToUpdate.GetUninheritedVars();
                        vars.AddValue_String("RequisitionStatus__", "To receive", true);
                        return true;
                    }
                });
            }
            function ReOpenAndResumePO() {
                return ReOpenDocuments({
                    numbers: impactedDocNumbers.PO,
                    processName: "Purchase order V2",
                    shortProcessName: "PO",
                    numberFieldName: "OrderNumber__",
                    beforeProcessingDocument: function (transport, transportToUpdate) {
                        var vars = transportToUpdate.GetUninheritedVars();
                        vars.AddValue_String("OrderStatus__", "To receive", true);
                        var data = {
                            grNumber: GRCanceler.grVars.GetValue_String("GRNumber__", 0),
                            user: Data.GetValue("LastSavedOwnerID"),
                            comment: grCancelComment
                        };
                        var externVars = transportToUpdate.GetExternalVars();
                        externVars.AddValue_String("LastCanceledReceptionData", JSON.stringify(data), true);
                        if (!transportToUpdate.ResumeWithAction("OnCanceledReception", false)) {
                            throw new Error("Cannot synchronize PO items. Details: " + transportToUpdate.GetLastErrorMessage());
                        }
                        return false;
                    }
                });
            }
            function MarkGRAsCanceled() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("MarkGRAsCanceled");
                    GRCanceler.grVars.AddValue_String("GRStatus__", "Canceled", true);
                    GRCanceler.grVars.AddValue_String("CancelComment__", grCancelComment, true);
                    grTransport.Process();
                    if (grTransport.GetLastError() !== 0) {
                        throw new Error("Cannot process GR. Details: " + grTransport.GetLastErrorMessage());
                    }
                    resolve();
                });
            }
            // Utils functions & classes
            function FindTransportByID(options) {
                options.idFieldName = options.idFieldName || "ruidEx";
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("FindTransportByID, " + options.idFieldName + ": " + options.id + (options.specificTable ? " in " + options.specificTable : ""));
                    var query = Process.CreateQuery();
                    query.Reset();
                    if (options.needDataFile) {
                        query.SetAttributesList("*,Datafile");
                    }
                    else {
                        query.SetAttributesList("*");
                    }
                    query.SetSearchInArchive(true);
                    if (options.specificTable) {
                        query.SetSpecificTable(options.specificTable);
                    }
                    query.SetFilter(options.idFieldName + "=" + options.id);
                    query.MoveFirst();
                    var transport = query.MoveNext();
                    if (!transport) {
                        throw new Error("Cannot find any transport with this " + options.idFieldName);
                    }
                    resolve(transport);
                });
            }
            function ReOpenDocuments(options) {
                var promises = options.numbers.map(function (number) {
                    Log.Info("ReOpenDocument (" + options.processName + "), number: " + number);
                    return FindTransportByID({
                        id: number,
                        idFieldName: options.numberFieldName,
                        specificTable: "CDNAME#" + options.processName
                    })
                        .Then(function (transport) {
                        var vars = transport.GetUninheritedVars();
                        var ruidEx = vars.GetValue_String("RuidEx", 0);
                        var state = vars.GetValue_Long("State", 0);
                        var archiveState = vars.GetValue_Long("ArchiveState", 0);
                        var transportToUpdate = Process.GetUpdatableTransport(ruidEx);
                        var varsOfTransportToUpdate = transportToUpdate.GetUninheritedVars();
                        // Supported states :
                        if (state === 90) {
                            Log.Info("Document is being processed. Waiting for reception. " + (options.synchronize ? "Synchronize items." : "Nothing to do."));
                        }
                        else if (state === 100 && archiveState) {
                            Log.Info("Document is in terminal state. Re-open it" + (options.synchronize ? " and synchronize items." : "."));
                            varsOfTransportToUpdate.AddValue_Long("State", 90, true);
                        }
                        else {
                            throw new Error("Unexpected state of document, state: " + state + ", archiveState: " + archiveState
                                + ". Check that document " + number + " (" + options.processName + ") has no error.");
                        }
                        var needProcess = true;
                        if (Sys.Helpers.IsFunction(options.beforeProcessingDocument)) {
                            needProcess = options.beforeProcessingDocument(transport, transportToUpdate);
                        }
                        if (needProcess) {
                            transportToUpdate.Process();
                            if (transportToUpdate.GetLastError() !== 0) {
                                throw new Error("Cannot process " + options.shortProcessName + ". Details: " + transportToUpdate.GetLastErrorMessage());
                            }
                        }
                    });
                });
                return Sys.Helpers.Promise.All(promises);
            }
            function NoLongerCancelable(message) {
                this.message = message;
            }
            GRCanceler.NoLongerCancelable = NoLongerCancelable;
            NoLongerCancelable.prototype.toString = function () {
                return this.message;
            };
        })(GRCanceler = Purchasing.GRCanceler || (Purchasing.GRCanceler = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
