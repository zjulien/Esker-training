///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_POEditionManager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing library managing PO items",
  "require": [
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_Database",
    "Sys/Sys_Parameters",
    "Sys/Sys_Decimal",
    "Lib_ERP_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_GRItems_V12.0.461.0",
    "Lib_Purchasing_POBudget_V12.0.461.0",
    "Lib_Purchasing_POEdition_V12.0.461.0",
    "Lib_Purchasing_POItems_V12.0.461.0",
    "Lib_Purchasing_POValidation_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "[Lib_Purchasing_Demo_V12.0.461.0]",
    "[Lib_PO_Customization_Server]",
    "Lib_Purchasing_VendorNotifications_V12.0.461.0",
    "Lib_Purchasing_OrderNotifications_V12.0.461.0",
    "Lib_P2P_Export_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var POEditionManager;
        (function (POEditionManager) {
            var impactedPOItemIndexes;
            var impactedGRItemIndexes;
            var addedItemIndexes;
            var additionalFeesHasChanged;
            var removedItemIndexes;
            var onEditOrderUEReturn;
            var rollbackingUpTo;
            function CheckAnyChanges() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var changedFields = Lib.Purchasing.POEdition.ChangesManager.GetChangedFieldsList();
                    if (Object.keys(changedFields).length === 0) {
                        throw new Lib.Purchasing.POEdition.SkipProcessingException("No modification detected. Nothing to do.");
                    }
                    resolve();
                });
            }
            function CallOnEditOrderUE() {
                Log.Info("Call user exit OnEditOrder if exists");
                var changedFields = Lib.Purchasing.POEdition.ChangesManager.GetChangedFieldsList();
                var changedFieldsList = [];
                Sys.Helpers.Object.ForEach(changedFields, function (list) {
                    changedFieldsList = changedFieldsList.concat(list);
                });
                var options = {
                    changedFields: changedFieldsList.slice()
                };
                onEditOrderUEReturn = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnEditOrder", options);
                Log.Info(onEditOrderUEReturn ? "OnEditOrder called successfully" : "No return on OnEditOrder call");
                onEditOrderUEReturn = onEditOrderUEReturn || {}; // create an empty by default
            }
            function CheckOrderableOrOverOrderedItems() {
                return Lib.Purchasing.POItems.UpdatePOFromPRAndPO(true)
                    .Then(function () {
                    if (!Lib.Purchasing.POValidation.CheckOrderableItems() || !Lib.Purchasing.POValidation.CheckOverOrderedItems()) {
                        throw "Error: Some items are overordered";
                    }
                })
                    .Catch(function (e) {
                    Lib.Purchasing.OnUnexpectedError(e.toString());
                    throw new Error(e);
                });
            }
            function ChangeInERP() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Change in ERP...");
                    if (rollbackingUpTo === "ChangeInERP") {
                        Lib.Purchasing.POEdition.Rollback.StopRollback();
                    }
                    else {
                        var res = Lib.ERP.ExecuteERPFunc("Change", "PO", Lib.Purchasing.POEdition.ChangesManager.Get(), Lib.Purchasing.POEdition.ChangesManager.Get(null, "LineItems__"));
                        if (res.error) {
                            if (!rollbackingUpTo) {
                                Lib.CommonDialog.NextAlert.Define("_Change PO in ERP error", res.error, { isError: true });
                                Lib.Purchasing.POEdition.Rollback.NeedRollbackUpTo("ChangeInERP");
                            }
                            throw new Error("Error during change PO in ERP");
                        }
                    }
                    resolve();
                });
            }
            function UpdateBudget() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Updating budget...");
                    if (!Lib.Purchasing.POBudget.AsOrderedAfterEditing()) {
                        // detecting first time functional errors in order to advise user and prepare rollback
                        if (!rollbackingUpTo) {
                            var nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                            if (nextAlert && nextAlert.title === "_Budget update error" &&
                                (nextAlert.message === "_Missing Accounting period" ||
                                    nextAlert.message === "_Closed budgets for accounting period" ||
                                    nextAlert.message === "_Multiple budget error")) {
                                Lib.Purchasing.POEdition.Rollback.NeedRollbackUpTo("UpdateBudget");
                            }
                        }
                        throw new Error("Error during updating budget");
                    }
                    else if (rollbackingUpTo === "UpdateBudget") {
                        Lib.Purchasing.POEdition.Rollback.StopRollback();
                    }
                    resolve();
                })
                    .Then(SynchronizeImpactedItems);
            }
            function SynchronizeImpactedItems() {
                Log.Info("Synchronizing items...");
                if (!Lib.Purchasing.POValidation.SynchronizeItems({
                    impactedPOItemIndexes: impactedPOItemIndexes,
                    resumeDocumentAction: "EditOrder"
                })) {
                    throw new Error("Error during synchronizing items");
                }
            }
            function GetImpactedItemIndexes() {
                Log.Info("Get index of the edited and (partially) received line items");
                impactedPOItemIndexes = [];
                impactedGRItemIndexes = [];
                addedItemIndexes = [];
                removedItemIndexes = [];
                additionalFeesHasChanged = false;
                var realChanges = Lib.Purchasing.POEdition.ChangesManager.GetChangedItems();
                var changedFields = Lib.Purchasing.POEdition.ChangesManager.GetChangedFieldsList();
                if (realChanges.LineItems__) {
                    Sys.Helpers.Object.ForEach(realChanges.LineItems__.Changed, function (item) {
                        var itemNumber = item.GetValue("LineItemNumber__");
                        impactedPOItemIndexes.push(itemNumber);
                        var quantity = item.GetValue("ItemQuantity__");
                        var openQuantity = item.GetValue("ItemUndeliveredQuantity__");
                        if (quantity !== openQuantity && !item.GetValue("NoGoodsReceipt__")) {
                            impactedGRItemIndexes.push(itemNumber);
                        }
                    });
                    Sys.Helpers.Object.ForEach(realChanges.LineItems__.Added, function (item) {
                        var itemNumber = item.GetValue("LineItemNumber__");
                        impactedPOItemIndexes.push(itemNumber);
                        addedItemIndexes.push(itemNumber);
                    });
                    Sys.Helpers.Object.ForEach(realChanges.LineItems__.Deleted, function (key) {
                        removedItemIndexes.push(key);
                    });
                }
                if (realChanges.AdditionalFees__ && realChanges.AdditionalFees__.Added.length > 0 && realChanges.AdditionalFees__.Changed.length > 0 && realChanges.AdditionalFees__.Deleted.length > 0) {
                    additionalFeesHasChanged = true;
                }
                if (impactedGRItemIndexes.length === 0 && impactedPOItemIndexes.length === 0 && !additionalFeesHasChanged && removedItemIndexes.length === 0
                    && (!changedFields.AdditionalFees__ || (changedFields.AdditionalFees__.indexOf("Deleted") === -1 && changedFields.AdditionalFees__.indexOf("Added") === -1))) {
                    throw new Lib.Purchasing.POEdition.SkipProcessingException("No impacted item detected. Nothing to do.");
                }
                Log.Info("Impacted PO item numbers: " + impactedPOItemIndexes.join(","));
                Log.Info("Impacted GR item numbers: " + impactedGRItemIndexes.join(","));
            }
            function GetGRNumbers() {
                Log.Info("Get GR numbers we have to re-open in order to report modifications");
                if (impactedGRItemIndexes.length === 0) {
                    return Sys.Helpers.Promise.Reject(new Lib.Purchasing.POEdition.SkipProcessingException("No impacted GR item detected."));
                }
                var additionnalFilters = [
                    Sys.Helpers.LdapUtil.FilterNotEqual("Status__", "Canceled"),
                    Sys.Helpers.LdapUtil.FilterIn("LineNumber__", impactedGRItemIndexes)
                ];
                return Lib.Purchasing.GRItems.GetGRNumbers(additionnalFilters).Then(function (grNumbers) {
                    if (!grNumbers.length) {
                        throw new Error("Unable to find any GR items.");
                    }
                    return grNumbers;
                });
            }
            function ReOpenGR(grNumbers) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Re-opening impacted GR in order to report changes and update budget...");
                    var filter = "(|";
                    grNumbers.forEach(function (grNumber) {
                        filter += "(GRNumber__=" + grNumber + ")";
                    });
                    filter += ")";
                    Log.Info("Selecting GR with filter: " + filter);
                    var query = Process.CreateQueryAsProcessAdmin();
                    query.Reset();
                    query.SetSearchInArchive(true);
                    query.SetSpecificTable("CDNAME#Goods receipt V2");
                    query.SetFilter(filter);
                    query.MoveFirst();
                    var transport;
                    while ((transport = query.MoveNext())) {
                        var vars = transport.GetUninheritedVars();
                        var ruidEx = vars.GetValue_String("RuidEx", 0);
                        var state = vars.GetValue_Long("State", 0);
                        var transportToUpdate = Process.GetUpdatableTransportAsProcessAdmin(ruidEx);
                        var varsOfTransportToUpdate = transportToUpdate.GetUninheritedVars();
                        Log.Info("Re-opening GR with ruidEx: " + ruidEx);
                        // Supported states :
                        if (state === 90) {
                            Log.Info("Document is being processed and ready to be resumed.");
                        }
                        else if (state === 100) {
                            Log.Info("Document is in terminal state. Re-open it.");
                            varsOfTransportToUpdate.AddValue_Long("State", 90, true);
                        }
                        else {
                            throw new Error("Unexpected state of document, state: " + state);
                        }
                        if (!transportToUpdate.ResumeWithAction("OnEditOrder", false)) {
                            var transportAsync = Process.GetUpdatableTransportAsProcessAdmin(ruidEx);
                            transportAsync.ResumeWithActionAsync("OnEditOrder");
                            Log.Info("ResumeWithAction delayed");
                        }
                    }
                    resolve();
                });
            }
            function UpdateGR() {
                return GetGRNumbers()
                    .Then(ReOpenGR)
                    .Catch(function (reason) {
                    if (reason instanceof Lib.Purchasing.POEdition.SkipProcessingException) {
                        Log.Warn("UpdateGR processing stopped. Details: " + reason);
                        return;
                    }
                    throw reason;
                });
            }
            function UpdateCustomerOrderAfterRevision() {
                Log.Info("Update Customer order");
                var coRUIDEX = Variable.GetValueAsString("CustomerOrderNumber");
                if (!coRUIDEX) {
                    Log.Warn("No customer order to update");
                    return;
                }
                var customerOrder = Process.GetUpdatableTransportAsProcessAdmin(coRUIDEX);
                var vars = customerOrder.GetUninheritedVars();
                vars.AddValue_Double("Total__", Data.GetValue("TotalNetAmount__"), true);
                vars.AddValue_Double("TotalNetAmount__", Data.GetValue("TotalNetAmount__"), true);
                vars.AddValue_Date("RevisionDateTime__", Data.GetValue("RevisionDateTime__"), true);
                //vars.DeleteAttribute("ConfirmationDatetime__");
                //vars.AddValue_Long("State", 70, true);
                var type = Attach.GetValue(0, "Purchasing_DocumentType");
                var attachFile = Attach.GetConvertedFile(0) || Attach.GetInputFile(0);
                if (attachFile != null) {
                    var name = Attach.GetName(0);
                    Log.Info("Attach name: " + name);
                    var newAttach = customerOrder.AddAttachEx(attachFile);
                    var newAttachVars = newAttach.GetVars();
                    newAttachVars.AddValue_Long("AttachAsFirst", 1, true);
                    newAttachVars.AddValue_String("AttachOutputName", name, true);
                    newAttachVars.AddValue_String("Purchasing_IsPO", type === "PO", true);
                }
                // Process it
                customerOrder.Process();
                if (customerOrder.GetLastError()) {
                    Log.Info("Cannot update Customer order. Details: " + customerOrder.GetLastErrorMessage() + "(" + customerOrder.GetLastError() + ")");
                    throw new Error("Cannot update Customer order. Details: " + customerOrder.GetLastErrorMessage() + "(" + customerOrder.GetLastError() + ")");
                }
            }
            function ReviseAttachedPO() {
                var needToReAttachPO = Lib.Purchasing.POEdition.ChangesManager.NeedToRegeneratePO();
                needToReAttachPO = needToReAttachPO && Variable.GetValueAsString("regeneratePO") === "1";
                if (needToReAttachPO) {
                    var revisionVersion = parseInt(Variable.GetValueAsString("revisionVersion") || "0", 10) + 1;
                    Data.SetValue("RevisionDateTime__", new Date());
                    Data.SetValue("OrderRevised__", true);
                    Data.SetValue("ConfirmationDatetime__", "");
                    if (!Lib.Purchasing.POValidation.AttachPO(Data.GetValue("OrderNumber__"), revisionVersion)) {
                        throw new Error("Error while revising po.pdf");
                    }
                    Variable.SetValueAsString("regeneratePO", "0");
                    Variable.SetValueAsString("revisionVersion", revisionVersion);
                    UpdateCustomerOrderAfterRevision();
                }
            }
            function Notify(notifyVendor) {
                if (notifyVendor === void 0) { notifyVendor = true; }
                return AddConversationMessage(notifyVendor)
                    .Then(function () {
                    SendEmailNotifications(notifyVendor);
                });
            }
            function AddConversationMessage(notifyVendor) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Log.Info("Add conversation message");
                    var conversationMessage;
                    if (onEditOrderUEReturn.conversationMessage) {
                        conversationMessage = onEditOrderUEReturn.conversationMessage;
                    }
                    // build conversation message if needed
                    else {
                        var table_1 = Data.GetTable("LineItems__");
                        var translatedFields_1 = [];
                        var userChangedFields = Lib.Purchasing.POEdition.ChangesManager.GetChangedFieldsList(true);
                        Sys.Helpers.Object.ForEach(userChangedFields.LineItems__, function (fieldName) {
                            if (Lib.Purchasing.POItems.customerInterestedItems.indexOf(fieldName) >= 0) {
                                if (fieldName === "Deleted") {
                                    translatedFields_1.push(Language.Translate("_Item(s) removed"));
                                }
                                else if (fieldName === "Added") {
                                    translatedFields_1.push(Language.Translate("_Item(s) added"));
                                }
                                else {
                                    translatedFields_1.push(Language.Translate(table_1.GetItem(0).GetProperties(fieldName).label));
                                }
                            }
                        });
                        if (userChangedFields.AdditionalFees__ && userChangedFields.AdditionalFees__.length > 0) {
                            translatedFields_1.push(Language.Translate("_AdditionalFees_pane"));
                        }
                        if (translatedFields_1.length > 0) {
                            conversationMessage = Language.Translate("_Fields modified {0}", false, translatedFields_1.join(", "));
                        }
                    }
                    if (conversationMessage) {
                        if (notifyVendor) {
                            Lib.Purchasing.VendorNotifications.AddConversationItem(conversationMessage);
                        }
                        else {
                            Lib.Purchasing.AddConversationItem(conversationMessage);
                        }
                    }
                    resolve();
                });
            }
            function UpdateAPPOItems() {
                var poItemsTableName = "AP - Purchase order - Items__";
                if (!Sys.Helpers.IsEmpty(Process.GetProcessID(poItemsTableName))) {
                    Log.Info(">> Update '".concat(poItemsTableName, "' table"));
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (lineItem) {
                        var itemNumber = lineItem.GetValue("LineItemNumber__");
                        if (addedItemIndexes.indexOf(itemNumber) >= 0) {
                            Lib.Purchasing.POValidation.UpdateAPPOItem("INSERT", lineItem);
                        }
                        else {
                            Lib.Purchasing.POValidation.UpdateAPPOItem("UPDATE", lineItem);
                        }
                    });
                    removedItemIndexes.forEach(function (removedItemIndex) {
                        var key = removedItemIndex.split("###");
                        var filter = "(&(OrderNumber__=" + Data.GetValue("OrderNumber__") + ")(PRNumber__=" + key[1] + ")(PRLineNumber__=" + key[2] + "))";
                        Sys.Helpers.Database.RemoveTableRecord(poItemsTableName, filter);
                        Log.Info("Record removed to DB : ", JSON.stringify(filter));
                    });
                    Log.Info("<< Update '".concat(poItemsTableName, "' table"));
                }
                var poHeaderTableName = "AP - Purchase order - Headers__";
                if (!Sys.Helpers.IsEmpty(Process.GetProcessID(poHeaderTableName))) {
                    Log.Info(">> Update '".concat(poHeaderTableName, "' table"));
                    var filter = "(OrderNumber__=" + Data.GetValue("OrderNumber__") + ")";
                    var attributes = [{ name: "OrderedAmount__", value: Data.GetValue("TotalNetAmount__") }];
                    Sys.Helpers.Database.AddOrModifyTableRecord(poHeaderTableName, filter, attributes);
                    Log.Info("<< Update '".concat(poHeaderTableName, "' table"));
                }
            }
            function SendEmailNotifications(notifyVendor) {
                // Refresh the form's stored fields
                Log.Info("Lib.Purchasing.Validation.EditOrder.SendEmailNotifications()");
                var itemsIndex = [];
                var table = Data.GetTable("LineItems__");
                var count = table.GetItemCount();
                for (var i = 0; i < count; i++) {
                    var lineItem = table.GetItem(i);
                    var itemNumber = lineItem.GetValue("LineItemNumber__");
                    if (addedItemIndexes.indexOf(itemNumber) >= 0) {
                        itemsIndex.push(i);
                    }
                }
                Lib.Purchasing.POValidation.SendEmailToRequesters(itemsIndex);
                if (notifyVendor) {
                    var sendOptions = JSON.parse(Variable.GetValueAsString("SendOption"));
                    if (sendOptions && sendOptions.sendOption && (sendOptions.sendOption === "POEdit_EmailToVendor" || sendOptions.sendOption === "POEdit_DoNotSend")) {
                        Process.RecallScript("SendEmailNotifications");
                    }
                }
            }
            function CatchEditOrderReject(reason) {
                if (reason instanceof Lib.Purchasing.POEdition.SkipProcessingException) {
                    Log.Warn("EditOrder processing stopped. Details: " + reason);
                    return Sys.Helpers.Promise.Resolve(true);
                }
                Log.Error("Edit order in error. Details: " + reason);
                var newAlertArguments = [
                    "_PO edition error",
                    "_PO edition error message",
                    { isError: true, behaviorName: "POEditionError" }
                ];
                var nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                if (nextAlert && nextAlert.isError) {
                    newAlertArguments[0] = nextAlert.title;
                    newAlertArguments[1] = nextAlert.message;
                    if (Sys.Helpers.IsArray(nextAlert.params)) {
                        newAlertArguments = newAlertArguments.concat(nextAlert.params);
                    }
                }
                Lib.CommonDialog.NextAlert.Define.apply(Lib.CommonDialog.NextAlert, newAlertArguments);
                return Sys.Helpers.Promise.Reject(reason);
            }
            function LockImpactedPRItemsAndSynchronizeChanges() {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    // Get list of PR Numbers
                    var allPRItems = Lib.Purchasing.POItems.GetPRItemsInForm();
                    var lockByPRNames = Object.keys(allPRItems);
                    var lockOk = Process.PreventConcurrentAccess(lockByPRNames, function () {
                        CheckAnyChanges()
                            .Then(CallOnEditOrderUE)
                            .Then(GetImpactedItemIndexes)
                            .Then(CheckOrderableOrOverOrderedItems)
                            .Then(SynchronizeImpactedItems)
                            .Then(function () {
                            resolve();
                        })
                            .Catch(function (reason) {
                            reject(reason);
                        });
                    });
                    if (!lockOk) {
                        reject("Lock failed");
                    }
                });
            }
            function ResetEditionChanges() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Lib.Purchasing.POEdition.ChangesManager.Reset();
                    resolve();
                });
            }
            function UpdateFromEditPORequest(data) {
                Lib.Purchasing.POEdition.ChangesManager.Init();
                var _a = data.changes, header = _a.header, lineItems__ = _a.lineItems__;
                var itemToRemove = [];
                if (!Sys.Helpers.Object.IsEmptyPlainObject(header)) {
                    Sys.Helpers.Object.ForEach(header, function (newValue, fieldName) {
                        Lib.Purchasing.POEdition.ChangesManager.Watch(fieldName);
                        Data.SetValue(fieldName, newValue);
                    });
                }
                var items = [];
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (lineItem) {
                    items.push(lineItem);
                });
                if (!Sys.Helpers.Object.IsEmptyPlainObject(lineItems__)) {
                    Sys.Helpers.Object.ForEach(lineItems__, function (lineChanges, key) {
                        var item = Sys.Helpers.Array.Find(items, function (currentItem) {
                            return currentItem.GetValue("LineItemNumber__") == key;
                        });
                        if (item) {
                            if (lineChanges === "Deleted") {
                                Lib.Purchasing.POEdition.ChangesManager.Watch("LineItemNumber__", "LineItems__");
                                itemToRemove.push(item);
                            }
                            else {
                                Sys.Helpers.Object.ForEach(lineChanges, function (fieldChange, fieldName) {
                                    Lib.Purchasing.POEdition.ChangesManager.Watch(fieldName, "LineItems__");
                                    item.SetValue(fieldName, fieldChange);
                                });
                            }
                        }
                    });
                }
                Sys.Helpers.Array.ForEach(itemToRemove, function (item) {
                    item.RemoveItem();
                });
                Lib.Purchasing.POEdition.ChangesManager.Serialize();
                Variable.SetValueAsString("regeneratePO", "1");
                return EditOrder(true);
            }
            POEditionManager.UpdateFromEditPORequest = UpdateFromEditPORequest;
            function EditOrder(fromEditPoRequest) {
                if (fromEditPoRequest === void 0) { fromEditPoRequest = false; }
                //TODO: need to update Pickup if edit on internal order UpdatePickUP
                return LockImpactedPRItemsAndSynchronizeChanges()
                    .Then(UpdateBudget)
                    .Then(ChangeInERP)
                    .Then(UpdateGR)
                    .Then(ReviseAttachedPO)
                    .Then(UpdateAPPOItems)
                    .Then(function () {
                    return Notify(!fromEditPoRequest);
                })
                    .Then(ResetEditionChanges)
                    .Catch(CatchEditOrderReject);
            }
            POEditionManager.EditOrder = EditOrder;
            function DoRollback() {
                rollbackingUpTo = Lib.Purchasing.POEdition.Rollback.GetRollbackUpTo();
                Log.Info("EditOrder rollback starting...");
                Lib.Purchasing.ResetAllFieldsInError();
                return Lib.Purchasing.POEdition.ChangesManager.Revert()
                    .Then(EditOrder);
            }
            POEditionManager.DoRollback = DoRollback;
        })(POEditionManager = Purchasing.POEditionManager || (Purchasing.POEditionManager = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
