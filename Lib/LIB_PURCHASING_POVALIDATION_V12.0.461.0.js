///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_POValidation_V12.0.461.0",
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
    "Sys/Sys_Helpers_Date",
    "Lib_ERP_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_POItems_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "[Lib_Purchasing_Demo_V12.0.461.0]",
    "[Lib_PO_Customization_Server]",
    "Lib_Purchasing_VendorNotifications_V12.0.461.0",
    "Lib_Purchasing_OrderNotifications_V12.0.461.0",
    "Lib_P2P_Managers_V12.0.461.0",
    "Lib_P2P_Export_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var POValidation;
        (function (POValidation) {
            /**
             * Call when the Purchase order is saved.
             */
            function OnSave() {
                // more to come...
            }
            POValidation.OnSave = OnSave;
            /**
             * Create a next alert to advise user when we try to execute an unknown action.
             * Process will be in validation state and wait for an action of user.
             * @param {string} currentAction name of the executed action
             * @param {string} currentName sub-name of the executed action
             */
            function OnUnknownAction(currentAction, currentName) {
                var knownAction = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnUnknownAction", currentAction, currentName);
                if (knownAction !== true) {
                    Lib.Purchasing.OnUnknownAction(currentAction, currentName);
                }
            }
            POValidation.OnUnknownAction = OnUnknownAction;
            /**
             * Call to check if a line in LineItems__ table as been over ordered.
             * @returns {boolean} true if succeeds, false if over ordered
             */
            function CheckOverOrderedItems() {
                var overOrdered = false;
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                    if (Lib.Purchasing.Items.IsQuantityBasedItem(line)) {
                        if (line.GetError("PRNumber__")) {
                            overOrdered = true;
                        }
                    }
                    else if (line.GetError("ItemNetAmount__")) {
                        overOrdered = true;
                    }
                });
                return !overOrdered;
            }
            POValidation.CheckOverOrderedItems = CheckOverOrderedItems;
            /**
             * Call to check if lines in LineItems__ table are still oderable.
             * We just need to check PR items status is still 'To order'
             * @returns {boolean} true if succeeds, false if over ordered
             */
            function CheckOrderableItems() {
                var orderable = true;
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                    if (line.GetError("PRNumber__")) {
                        orderable = false;
                    }
                });
                return orderable;
            }
            POValidation.CheckOrderableItems = CheckOrderableItems;
            function SendEmailToRequesters(ItemsIndexArray) {
                var table = Data.GetTable("LineItems__");
                var Requesters = [];
                var ItemsPerRequester = [];
                Sys.Helpers.Array.ForEach(ItemsIndexArray, function (itemIndex) {
                    var currentItem = table.GetItem(itemIndex);
                    var currentRequesterLogin = Sys.Helpers.String.ExtractLoginFromDN(currentItem.GetValue("RequesterDN__"));
                    if (Requesters.indexOf(currentRequesterLogin) === -1) {
                        Requesters.push(currentRequesterLogin);
                        ItemsPerRequester[Requesters.indexOf(currentRequesterLogin)] = [];
                    }
                    ItemsPerRequester[Requesters.indexOf(currentRequesterLogin)].push(currentItem);
                });
                var buyerLogin = Data.GetValue("BuyerLogin__");
                for (var i = 0; i < ItemsPerRequester.length; i++) {
                    if (Requesters[i] != buyerLogin) {
                        var element = ItemsPerRequester[i];
                        var options = BuildEmailToRequester(Requesters[i], element);
                        var doSendNotif = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.OnSendEmailNotification", options);
                        if (doSendNotif !== false) {
                            Sys.EmailNotification.SendEmailNotification(options);
                        }
                    }
                }
            }
            POValidation.SendEmailToRequesters = SendEmailToRequesters;
            function BuildEmailToRequester(requester, items) {
                var template, subject, WarehouseName;
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    template = "Purchasing_Email_NotifInternalRequester.htm";
                    subject = "_Item ready for pickup";
                    WarehouseName = Data.GetValue("WarehouseName__");
                }
                else {
                    template = "Purchasing_Email_NotifRequester.htm";
                    subject = "_Purchase order sent";
                }
                var tempCustomTags = {
                    Items__: "",
                    putLink: false,
                    WarehouseName: WarehouseName
                };
                var itemsCount = items.length > 10 ? 10 : items.length;
                for (var i = 0; i < itemsCount; i++) {
                    var description = String(items[i].GetValue("ItemDescription__"));
                    var htmlRow = "<li>" + description.replace(/\n/g, "<br />") + "</li>";
                    tempCustomTags.Items__ += htmlRow;
                    var buyerLogin = items[i].GetValue("BuyerDN__");
                    if (Users.GetUser(requester).IsMemberOf(buyerLogin)) {
                        tempCustomTags.putLink = true;
                    }
                }
                if (items.length > itemsCount) {
                    tempCustomTags.Items__ += "<li>...</li>";
                }
                var options = {
                    userId: requester,
                    subject: subject,
                    template: template,
                    fromName: "_EskerPurchaseOrder",
                    backupUserAsCC: false,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1",
                    customTags: tempCustomTags,
                    escapeCustomTags: false
                };
                return options;
            }
            function SendNotifToVendor(vendor, template, editMode) {
                var email = Lib.Purchasing.VendorNotifications.CreateNotifToVendor(vendor, template, editMode);
                if (email) {
                    // The vendor was not created (AlwaysCreateVendor == "0") --> always attach in email (ignore AlwaysAttachPurchaseOrder)
                    Lib.Purchasing.OrderNotifications.AddAttachments(email, editMode);
                    try {
                        Sys.EmailNotification.SendEmail(email);
                    }
                    catch (e) {
                        Log.Info("SendNotifToVendor error: " + e);
                        Lib.CommonDialog.NextAlert.Define("_Send PO to vendor error", "_Send PO to vendor error message", {
                            isError: true,
                            behaviorName: editMode ? "SendEmailNotifications" : "SendToVendorError"
                        }, e.toString());
                        return false;
                    }
                }
                return true;
            }
            POValidation.SendNotifToVendor = SendNotifToVendor;
            function SendNotifToMe(template, editMode) {
                var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                var currentUserLogin = currentUser.GetValue("Login");
                var customTag = null;
                if (!editMode) {
                    var buyerComment = Data.GetValue("BuyerComment__");
                    customTag = Lib.Purchasing.OrderNotifications.InitCustomTag(buyerComment);
                }
                var email = Sys.EmailNotification.CreateEmail({
                    userId: currentUserLogin,
                    template: template,
                    customTags: customTag,
                    backupUserAsCC: true,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                });
                Lib.Purchasing.OrderNotifications.SetCcEmailAddress(email, Data.GetValue("EmailCarbonCopy__"));
                Sys.EmailNotification.AddSender(email, "notification@eskerondemand.com", "Esker Purchasing");
                Lib.Purchasing.OrderNotifications.AddAttachments(email, editMode);
                Sys.EmailNotification.SendEmail(email);
            }
            POValidation.SendNotifToMe = SendNotifToMe;
            function NotifyVendorByEmail() {
                var sendOptions = JSON.parse(Variable.GetValueAsString("SendOption"));
                switch (sendOptions.sendOption) {
                    case "POEdit_EmailToVendor":
                        var ok = Lib.Purchasing.POValidation.SendNotifToVendor(sendOptions.email, "Purchasing_Email_NotifSupplier_PORevision.htm", true);
                        if (!ok) {
                            Process.PreventApproval();
                        }
                        break;
                    case "POEdit_DoNotSend":
                        Lib.Purchasing.POValidation.SendNotifToMe("Purchasing_Email_NotifBuyer_PORevisionDoNotSend.htm", true);
                        break;
                    default:
                        break;
                }
            }
            POValidation.NotifyVendorByEmail = NotifyVendorByEmail;
            /**
             * Synchronize PO items.
             * When the PO isn't yet ordered the PO items are updated according to the form table. After sent, the PO items
             * are updated according to the goods.
             * Trigger PR in order to synchronize PR items.
             * @returns {boolean} true if succeeds, false otherwise
             */
            POValidation.SynchronizeItems = (function () {
                function InitComputedDataForPOItemsSynchronizeConfig(options) {
                    var buyerVars = Users.GetUser(Data.GetValue("BuyerLogin__")).GetVars();
                    var buyerDn = buyerVars.GetValue_String("FullDn", 0);
                    var computedData = {
                        common: {
                            "BuyerDN": buyerDn
                        },
                        byLine: {}
                    };
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        var lineNumber = line.GetValue("LineItemNumber__");
                        var recipientDn = line.GetValue("RecipientDN__");
                        var recipientLogin = recipientDn ? Sys.Helpers.String.ExtractLoginFromDN(recipientDn) : null;
                        // Do not update DeliveryDate and Status when (justUpdateItems == true)
                        computedData.byLine[lineNumber] = {
                            "DeliveryDate": options.justUpdateItems ? undefined : null,
                            "Status": options.justUpdateItems ? undefined : options.futureOrderStatus,
                            "RecipientLogin": recipientLogin
                        };
                    });
                    Lib.Purchasing.Items.POItemsSynchronizeConfig.computedData = computedData;
                    return computedData;
                }
                function DependsOnGRItems(options) {
                    return Lib.Purchasing.POStatus.ForDelivery.indexOf(options.currentOrderStatus) !== -1;
                }
                function Synchronize(options) {
                    options = options || {};
                    if (!options.futureOrderStatus) {
                        options.futureOrderStatus = Data.GetValue("OrderStatus__");
                    }
                    if (!options.currentOrderStatus) {
                        options.currentOrderStatus = Data.GetValue("OrderStatus__");
                    }
                    try {
                        var poNumber = Data.GetValue("OrderNumber__");
                        var computedData = InitComputedDataForPOItemsSynchronizeConfig(options);
                        // Update (or create) document items when PO is pending (not yet ordered)
                        if (options.justUpdateItems || !DependsOnGRItems(options)) {
                            Log.Info("Update PO items with number '" + poNumber + "'");
                        }
                        // Update document items when PO will be canceled (no GR yet)
                        else if (options.futureOrderStatus === "Canceled" || options.futureOrderStatus === "Rejected") {
                            Log.Info("Update 'PO items' & 'AP - PO items' with number '" + poNumber + "' to cancel status");
                            UpdatePOItemsAfterCancel();
                            UpdatePOHeaderAfterCancel();
                        }
                        // Update document items when PO is waiting for update (Sent).
                        // Feed computed data according to the GR items.
                        else {
                            //synchronus call server side, no need of callback
                            Lib.Purchasing.POItems.UpdatePOFromGR(null, computedData)
                                .Then(function (_a) {
                                var noGoodsReceiptItems = _a.noGoodsReceiptItems;
                                // Update PO header/items
                                var deliveredAmountTotal = UpdatePOItemsAfterReception();
                                UpdatePOHeaderAfterReception(deliveredAmountTotal);
                                if (noGoodsReceiptItems && noGoodsReceiptItems.length && Sys.Parameters.GetInstance("PAC").GetParameter("DemoEnableInvoiceCreation") == "3") {
                                    Lib.Purchasing.Demo.GenerateVendorInvoice(Data.GetValue("OrderNumber__"), false, noGoodsReceiptItems);
                                }
                            })
                                .Catch(function (error) {
                                Log.Error("Error updating AP PO Items and Headers tables");
                                Log.Error(error);
                            });
                        }
                        if (Lib.Purchasing.Items.Synchronize(Lib.Purchasing.Items.POItemsSynchronizeConfig, options.impactedPOItemIndexes)) {
                            if (!options.justUpdateItems) {
                                //Notify all PR
                                var allPRItems = options.allPRItems || Lib.Purchasing.POItems.GetPRItemsInForm();
                                Sys.Helpers.Object.ForEach(allPRItems, function (prItems /*, prNumber: string*/) {
                                    Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("Purchase requisition", prItems[0].GetValue("PRRUIDEX__"), options.resumeDocumentAction || "SynchronizeItems");
                                });
                            }
                            else {
                                Log.Info("Don't resume PR(s) to synchronize items (justUpdateItems option enabled).");
                            }
                            return true;
                        }
                        Transaction.Delete("SafePAC_PONUMBER");
                        return false;
                    }
                    catch (e) {
                        Log.Error(e.toString());
                        var title = void 0, message = void 0, behaviorName = void 0;
                        if (options.fromAction) {
                            title = "_Items synchronization from action error";
                            message = "_Items synchronization from action error message";
                            behaviorName = null;
                        }
                        else {
                            title = "_Items synchronization error";
                            message = "_Items synchronization error message";
                            behaviorName = "syncItemsFromActionError";
                        }
                        Lib.CommonDialog.NextAlert.Define(title, message, {
                            isError: true,
                            behaviorName: behaviorName
                        });
                        return false;
                    }
                }
                return function (options) {
                    return Sys.Helpers.Data.RollbackableSection(function (rollbackFn) {
                        return Synchronize(options) || rollbackFn();
                    });
                };
            })();
            /**
             * Synchronize PO items. Must be call from an action. Determine the next state of document.
             */
            function SynchronizeItemsFromAction() {
                var status = Data.GetValue("OrderStatus__");
                if (Lib.Purchasing.POStatus.ForPOWorkflow.indexOf(status) !== -1) {
                    POValidation.SynchronizeItems({ fromAction: true });
                    Process.PreventApproval();
                }
                else if (Lib.Purchasing.POStatus.ForDelivery.indexOf(status) !== -1) {
                    // DoAction for doReceipt
                    Process.RecallScript("PostValidation_DoReceipt");
                }
            }
            POValidation.SynchronizeItemsFromAction = SynchronizeItemsFromAction;
            function UpdateChildrenExchangeRate() {
                var query = Process.CreateQueryAsProcessAdmin();
                query.Reset();
                var processName;
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    processName = "Inventory Pickup__";
                    query.SetSpecificTable("CDLNAME#Inventory Pickup__.LineItems__");
                }
                else {
                    processName = "Goods receipt V2";
                    query.SetSpecificTable("CDLNAME#Goods receipt V2.LineItems__");
                }
                var processID = Process.GetProcessID(processName);
                query.SetAttributesList("SourceMSNEX");
                query.SetFilter("(Line_OrderNumber__=" + Data.GetValue("OrderNumber__") + ")");
                query.SetSearchInArchive(true);
                query.MoveFirst();
                var record = query.MoveNextRecord();
                var msnexs = new Set();
                while (record) {
                    var msnEx = record.GetVars().GetValue_String("SourceMSNEX", 0);
                    var ruidex = "CD#".concat(processID, ".").concat(msnEx);
                    if (!msnexs.has(ruidex)) {
                        msnexs.add(ruidex);
                        Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems(processName, ruidex, "UpdateExchangeRate");
                    }
                    record = query.MoveNextRecord();
                }
            }
            /**
             * Update Po Liens Exchange Rate from PR items.
             */
            function UpdateExchangeRate() {
                return Lib.Purchasing.POItems.UpdatePOExchangeRateFromPR().Then(function () {
                    POValidation.SynchronizeItems({ justUpdateItems: true });
                    Lib.Purchasing.Items.ComputeTotalAmount();
                    UpdateChildrenExchangeRate();
                });
            }
            POValidation.UpdateExchangeRate = UpdateExchangeRate;
            /**
             * Give read right to actual recipient (information sent from Good Receipt) if it is not in the list of recipients already
             * @param {*} actualRecipientDN full DN of actual recipient
             */
            function GiveReadRightToActualRecipientIfNeeded(actualRecipientDN, usersWithRight) {
                if (usersWithRight === void 0) { usersWithRight = null; }
                var recipientsDNs = {};
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                    var recipientDN = line.GetValue("RecipientDN__");
                    if (recipientDN && !recipientsDNs[recipientDN]) {
                        recipientsDNs[recipientDN] = true;
                    }
                });
                if (!recipientsDNs[actualRecipientDN]) {
                    Log.Info("Grant read right to actual recipient: " + actualRecipientDN);
                    Process.AddRight(actualRecipientDN, "read");
                    if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(actualRecipientDN) === -1) {
                        usersWithRight.push(actualRecipientDN);
                    }
                }
            }
            POValidation.GiveReadRightToActualRecipientIfNeeded = GiveReadRightToActualRecipientIfNeeded;
            function GiveReadRightsToCostCenterManagers(usersWithRight) {
                if (usersWithRight === void 0) { usersWithRight = null; }
                // By default, get the list of cost centers from the line items
                var filter = Lib.P2P.Managers.GetCostCentersFilter("ItemCostCenterId__");
                Log.Info("Cost Centers filter: ".concat(filter));
                if (filter) {
                    return Lib.P2P.Managers.GetCostCentersManagers(filter)
                        .Then(function (ccOwners) {
                        for (var _i = 0, ccOwners_1 = ccOwners; _i < ccOwners_1.length; _i++) {
                            var ccOwner = ccOwners_1[_i];
                            Log.Info("Grant read right to cost center owner: " + ccOwner);
                            Process.AddRight(ccOwner, "read");
                            if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(ccOwner) === -1) {
                                usersWithRight.push(ccOwner);
                            }
                        }
                        return Lib.P2P.Managers.GetManagersRecursively(ccOwners);
                    })
                        .Then(function (managers) {
                        for (var _i = 0, managers_1 = managers; _i < managers_1.length; _i++) {
                            var manager = managers_1[_i];
                            Log.Info("Grant read right to cost center manager: " + manager);
                            Process.AddRight(manager, "read");
                            if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(manager) === -1) {
                                usersWithRight.push(manager);
                            }
                        }
                    });
                }
                return Sys.Helpers.Promise.Resolve();
            }
            POValidation.GiveReadRightsToCostCenterManagers = GiveReadRightsToCostCenterManagers;
            function GiveReadRightToBuyers(actualBuyerDN, usersWithRight) {
                if (usersWithRight === void 0) { usersWithRight = null; }
                var buyersDNs = {};
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                    var buyerDN = line.GetValue("BuyerDN__");
                    if (buyerDN && !buyersDNs[buyerDN]) {
                        buyersDNs[buyerDN] = true;
                    }
                });
                if (!buyersDNs[actualBuyerDN]) {
                    Log.Info("Grant read right to actual buyer: " + actualBuyerDN);
                    Process.AddRight(actualBuyerDN, "read");
                    if (actualBuyerDN && usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(actualBuyerDN) === -1) {
                        usersWithRight.push(actualBuyerDN);
                    }
                }
                for (var buyerDN in buyersDNs) {
                    if (Object.prototype.hasOwnProperty.call(buyersDNs, buyerDN)) {
                        Log.Info("Grant validate right to buyer: " + buyerDN);
                        Process.AddRight(buyerDN, "validate");
                        if (usersWithRight && Array.isArray(usersWithRight) && usersWithRight.indexOf(buyerDN) === -1) {
                            usersWithRight.push(buyerDN);
                        }
                    }
                }
            }
            POValidation.GiveReadRightToBuyers = GiveReadRightToBuyers;
            function InsertPOHeader(orderNumber, createDocInERP) {
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    Log.Info("Do not update AP POItems for internal order");
                    return;
                }
                if (!Sys.Helpers.IsEmpty(Process.GetProcessID(Lib.P2P.TableNames.POHeaders))) {
                    var newRecord = Process.CreateTableRecord(Lib.P2P.TableNames.POHeaders);
                    if (newRecord) {
                        var newVars = newRecord.GetVars();
                        newVars.AddValue_String("CompanyCode__", Data.GetValue("CompanyCode__"), true);
                        newVars.AddValue_String("VendorNumber__", Data.GetValue("VendorNumber__"), true);
                        newVars.AddValue_String("OrderNumber__", orderNumber, true);
                        newVars.AddValue_String("OrderedAmount__", Data.GetValue("TotalNetAmount__"), true);
                        newVars.AddValue_String("InvoicedAmount__", "0", true);
                        newVars.AddValue_String("DeliveredAmount__", "0", true);
                        newVars.AddValue_String("Buyer__", Data.GetValue("BuyerLogin__"), true);
                        newVars.AddValue_Long("IsLocalPO__", 1, true);
                        newVars.AddValue_Long("IsCreatedInERP__", createDocInERP ? 1 : 0, true);
                        newVars.AddValue_Date("OrderDate__", Data.GetValue("OrderDate__"), true);
                        newVars.AddValue_String("Currency__", Data.GetValue("Currency__"), true);
                        newRecord.Commit();
                        if (newRecord.GetLastError() !== 0) {
                            Log.Error("Commit failed: " + newRecord.GetLastErrorMessage());
                        }
                    }
                }
            }
            function UpdatePOHeaderAfterReception(deliveredAmountTotal) {
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    Log.Info("Do not update AP POItems for internal order");
                    return;
                }
                if (!Sys.Helpers.IsEmpty(Process.GetProcessID(Lib.P2P.TableNames.POHeaders))) {
                    var filter = Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", Data.GetValue("OrderNumber__")).toString();
                    var attributes = [{ name: "DeliveredAmount__", value: deliveredAmountTotal }];
                    Sys.Helpers.Database.AddOrModifyTableRecord(Lib.P2P.TableNames.POHeaders, filter, attributes);
                }
            }
            function UpdatePOHeaderAfterCancel() {
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    Log.Info("Do not update AP POItems for internal order");
                    return;
                }
                if (!Sys.Helpers.IsEmpty(Process.GetProcessID(Lib.P2P.TableNames.POHeaders))) {
                    var filter = Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", Data.GetValue("OrderNumber__")).toString();
                    var attributes = [{ name: "OrderedAmount__", value: 0 }];
                    Sys.Helpers.Database.AddOrModifyTableRecord(Lib.P2P.TableNames.POHeaders, filter, attributes);
                }
            }
            var POToAP_POItems = {
                common: {
                    "CompanyCode__": { name: "CompanyCode__" },
                    "VendorNumber__": { name: "VendorNumber__" },
                    "OrderDate__": { name: "OrderDate__" },
                    "OrderNumber__": { name: "OrderNumber__" }
                },
                lineItems: {
                    "LineItemNumber__": { name: "ItemNumber__" },
                    "ItemNumber__": { name: "PartNumber__" },
                    "ItemUnitPrice__": { name: "UnitPrice__" },
                    "ItemDescription__": {
                        name: "Description__",
                        preTreatment: function (description) {
                            return description.split(/(\r\n)+|\r+|\n+|\t+/)[0];
                        }
                    },
                    "ItemNetAmount__": { name: "OrderedAmount__" },
                    "ItemQuantity__": { name: "OrderedQuantity__" },
                    "ItemGLAccount__": { name: "GLAccount__" },
                    "ItemGroup__": { name: "Group__" },
                    "ItemCostCenterId__": { name: "CostCenter__" },
                    "BudgetID__": { name: "BudgetID__" },
                    "RecipientDN__": {
                        name: "Receiver__",
                        preTreatment: function (recipientDN) {
                            return Sys.Helpers.String.ExtractLoginFromDN(recipientDN);
                        }
                    },
                    "ItemTaxCode__": { name: "TaxCode__" },
                    "NonDeductibleTaxRate__": { name: "NonDeductibleTaxRate__" },
                    "NoGoodsReceipt__": { name: "NoGoodsReceipt__" },
                    "NotifyRequesterOnReceipt__": { name: "NotifyRequesterOnReceipt__" },
                    "ItemCurrency__": { name: "Currency__" },
                    "ItemType__": {
                        name: "ItemType__",
                        preTreatment: function (type) {
                            return type === Lib.P2P.ItemType.SERVICE_BASED ? Lib.P2P.ItemType.QUANTITY_BASED : type;
                        }
                    },
                    "CostType__": { name: "CostType__" },
                    "ProjectCode__": { name: "ProjectCode__" },
                    "ProjectCodeDescription__": { name: "ProjectCodeDescription__" },
                    "WBSElement__": { name: "WBSElement__" },
                    "WBSElementID__": { name: "WBSElementID__" },
                    "InternalOrder__": { name: "InternalOrder__" },
                    "FreeDimension1__": { name: "FreeDimension1__" },
                    "FreeDimension1ID__": { name: "FreeDimension1ID__" },
                    "ItemUnit__": { name: "UnitOfMeasureCode__" },
                    "CheckBillingCompleted__": { name: "NoMoreInvoiceExpected__" }
                },
                notMapped: {
                    // attribute : Initial value
                    "IsLocalPO__": 1,
                    "IsCreatedInERP__": function () {
                        return Sys.Parameters.GetInstance("P2P_" + Lib.ERP.GetERPName()).GetParameter("CreateDocInERP") ? 1 : 0;
                    },
                    "InvoicedAmount__": "0",
                    "InvoicedQuantity__": "0",
                    "DeliveredAmount__": "0",
                    "DeliveredQuantity__": "0"
                }
            };
            function UpdateAPPOItemsTable(operation /* "INSERT" | "UPDATE" */) {
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    Log.Info("Do not update AP POItems for internal order");
                    return;
                }
                var tableName = "AP - Purchase order - Items__";
                if (!Sys.Helpers.IsEmpty(Process.GetProcessID(tableName))) {
                    var table = Data.GetTable("LineItems__");
                    var count = table.GetItemCount();
                    for (var i = 0; i < count; i++) {
                        var lineItem = table.GetItem(i);
                        UpdateAPPOItem(operation, lineItem);
                    }
                }
            }
            POValidation.UpdateAPPOItemsTable = UpdateAPPOItemsTable;
            function UpdateAPPOItem(operation /* "INSERT" | "UPDATE" */, lineItem) {
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    Log.Info("Do not update AP POItems for internal order");
                    return;
                }
                var filter = "(&(OrderNumber__=" + Data.GetValue("OrderNumber__") + ")(ItemNumber__=" + lineItem.GetValue("LineItemNumber__") + "))";
                var attributes = [];
                if (operation === "INSERT") {
                    var commonAttributes = POToAP_POItems.common;
                    for (var nameInForm in commonAttributes) {
                        if (Object.prototype.hasOwnProperty.call(commonAttributes, nameInForm)) {
                            var poAttribute = commonAttributes[nameInForm];
                            var poAttributeValue = Data.GetValue(nameInForm);
                            attributes.push({
                                name: poAttribute.name,
                                value: poAttribute.preTreatment ? poAttribute.preTreatment(poAttributeValue) : poAttributeValue
                            });
                        }
                    }
                    var notMappedAttributes = POToAP_POItems.notMapped;
                    for (var nameInForm in notMappedAttributes) {
                        if (Object.prototype.hasOwnProperty.call(notMappedAttributes, nameInForm)) {
                            attributes.push({
                                name: nameInForm,
                                value: typeof notMappedAttributes[nameInForm] === "function" ? notMappedAttributes[nameInForm]() : notMappedAttributes[nameInForm]
                            });
                        }
                    }
                }
                // Add line items
                var lineItemsAttributes = POToAP_POItems.lineItems;
                for (var nameInForm in lineItemsAttributes) {
                    if (Object.prototype.hasOwnProperty.call(lineItemsAttributes, nameInForm)) {
                        var poAttribute = lineItemsAttributes[nameInForm];
                        var poAttributeValue = lineItem.GetValue(nameInForm);
                        attributes.push({
                            name: poAttribute.name,
                            value: poAttribute.preTreatment ? poAttribute.preTreatment(poAttributeValue) : poAttributeValue
                        });
                    }
                }
                var customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                if (customDimensions && customDimensions.poItems) {
                    var poItem = void 0;
                    for (var indexCustomPoItem = 0; indexCustomPoItem < customDimensions.poItems.length; indexCustomPoItem++) {
                        poItem = customDimensions.poItems[indexCustomPoItem];
                        attributes.push({
                            name: poItem.nameInTable,
                            value: lineItem.GetValue(poItem.nameInForm)
                        });
                    }
                }
                Sys.Helpers.Database.AddOrModifyTableRecord("AP - Purchase order - Items__", filter, attributes);
                Log.Info("Record written to DB : ", JSON.stringify(attributes));
            }
            POValidation.UpdateAPPOItem = UpdateAPPOItem;
            function UpdatePOItemsAfterReception() {
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    Log.Info("Do not update AP POItems for internal order");
                }
                else {
                    var deliveredAmountTotal = new Sys.Decimal(0);
                    if (!Sys.Helpers.IsEmpty(Process.GetProcessID("AP - Purchase order - Items__"))) {
                        var table = Data.GetTable("LineItems__");
                        var count = table.GetItemCount();
                        var todayDate = new Date();
                        todayDate.setUTCHours(12, 0, 0, 0);
                        for (var i = 0; i < count; i++) {
                            var lineItem = table.GetItem(i);
                            var deliveredQuantity = void 0;
                            // In case the item is not receptionable, the delivered amount and quantity are updated after the requested delivery date to be equal to the ordered amount and quantity
                            var noReceptionableItemUpdate = lineItem.GetValue("NoGoodsReceipt__") && Sys.Helpers.Date.CompareDate(todayDate, lineItem.GetValue("ItemRequestedDeliveryDate__")) > 0;
                            if (noReceptionableItemUpdate) {
                                deliveredQuantity = lineItem.GetValue("ItemQuantity__");
                            }
                            else {
                                deliveredQuantity = new Sys.Decimal(lineItem.GetValue("ItemTotalDeliveredQuantity__") || 0).sub(new Sys.Decimal(lineItem.GetValue("ItemReturnQuantity__") || 0));
                            }
                            var deliveredAmount = new Sys.Decimal(deliveredQuantity).mul(lineItem.GetValue("ItemUnitPrice__"));
                            deliveredAmountTotal = deliveredAmountTotal.add(deliveredAmount);
                            var tableName = "AP - Purchase order - Items__";
                            var filter = "(&(OrderNumber__=" + Data.GetValue("OrderNumber__") + ")(ItemNumber__=" + lineItem.GetValue("LineItemNumber__") + "))";
                            var attributes = [
                                { name: "DeliveredAmount__", value: deliveredAmount.toNumber() },
                                { name: "DeliveredQuantity__", value: deliveredQuantity },
                                { name: "NoGoodsReceipt__", value: lineItem.GetValue("NoGoodsReceipt__") }
                            ];
                            Sys.Helpers.Database.AddOrModifyTableRecord(tableName, filter, attributes);
                        }
                    }
                    return deliveredAmountTotal.toNumber();
                }
            }
            POValidation.UpdatePOItemsAfterReception = UpdatePOItemsAfterReception;
            function UpdatePOItemsAfterCancel() {
                if (Lib.P2P.Inventory.IsInternalOrder()) {
                    Log.Info("Do not update AP POItems for internal order");
                    return;
                }
                if (!Sys.Helpers.IsEmpty(Process.GetProcessID("AP - Purchase order - Items__"))) {
                    var table = Data.GetTable("LineItems__");
                    var count = table.GetItemCount();
                    for (var i = 0; i < count; i++) {
                        var lineItem = table.GetItem(i);
                        var tableName = "AP - Purchase order - Items__";
                        var filter = "(&(OrderNumber__=" + Data.GetValue("OrderNumber__") + ")(ItemNumber__=" + lineItem.GetValue("LineItemNumber__") + "))";
                        var attributes = [
                            { name: "OrderedAmount__", value: 0 },
                            { name: "OrderedQuantity__", value: 0 }
                        ];
                        Sys.Helpers.Database.AddOrModifyTableRecord(tableName, filter, attributes);
                    }
                }
            }
            function OnCreatePOInERP(createDocInERP, docData) {
                // Here we have to get a number.
                if (!Sys.Helpers.IsEmpty(docData.number)) {
                    InsertPOHeader(docData.number, createDocInERP);
                    UpdateAPPOItemsTable("INSERT");
                }
                return true;
            }
            POValidation.OnCreatePOInERP = OnCreatePOInERP;
            function AttachPO(PO_Number, PO_Version) {
                if (PO_Version === void 0) { PO_Version = 0; }
                var poAttached = false;
                var csvAttached = false;
                // Check if PO is already attached
                for (var i = Attach.GetNbAttach() - 1; i >= 0; i--) {
                    var type = Attach.GetValue(i, "Purchasing_DocumentType");
                    if (type === "PO") {
                        Log.Info("PO already attached: " + i);
                        poAttached = true;
                    }
                    else if (type === "CSV") {
                        Log.Info("CSV already attached: " + i);
                        csvAttached = true;
                    }
                }
                if (!poAttached || !csvAttached || PO_Version > 0) {
                    // First step - Get template file
                    var poTemplateInfos = Lib.Purchasing.POExport.GetPOTemplateInfos();
                    var isOldDocxTemplateExist = false;
                    var user = Lib.P2P.GetValidatorOrOwner();
                    isOldDocxTemplateExist = user.IsAvailableTemplate({
                        templateName: "PO_template_V2.docx",
                        language: poTemplateInfos.escapedCompanyCode
                    }) && poTemplateInfos.template == "PurchaseOrder.rpt";
                    if (isOldDocxTemplateExist) {
                        Log.Info("Old .docx purchase order template detected.");
                        poTemplateInfos.fileFormat = "DOCX";
                        poTemplateInfos.template = "PO_template_V2.docx";
                    }
                    var PO_TemplateFile = user.GetTemplateFile(poTemplateInfos.template, poTemplateInfos.escapedCompanyCode);
                    Log.Info("PO_TemplateFile used: " + PO_TemplateFile.GetFileName());
                    if (PO_TemplateFile == null) {
                        Log.Error("Failed to find template file: " + poTemplateInfos.template);
                        return false;
                    }
                    // Second step - Call correct converter according template file format
                    if (poTemplateInfos.fileFormat === "DOCX") // Microsoft Word mode
                     {
                        Log.Info("PO template detected as .DOCX format");
                        var csvFile = TemporaryFile.CreateFile("PO.csv", "utf16");
                        if (!csvFile) {
                            Log.Error("Temporaty file creating failed: PO.csv");
                            return false;
                        }
                        Lib.Purchasing.POExport.CreatePOCsv(PO_Number)
                            .Then(function (csvString) {
                            TemporaryFile.Append(csvFile, csvString);
                        });
                    }
                    else if (poTemplateInfos.fileFormat === "RPT") // Crystal mode
                     {
                        Log.Info("PO template detected as .RPT format");
                        // Generate JSON
                        var jsonFile = TemporaryFile.CreateFile("PO.JSON", "utf16");
                        if (!jsonFile) {
                            Log.Error("Temporaty file creating failed: PO.json");
                            return false;
                        }
                        Lib.Purchasing.POExport.CreatePOJsonString(poTemplateInfos)
                            .Then(function (jsonString) {
                            return TemporaryFile.Append(jsonFile, jsonString);
                        });
                    }
                    else {
                        Log.Error("Error PO template file format is not recognized or compatible");
                        return false;
                    }
                    var iAttachPO = void 0, iAttachCSV = void 0;
                    if (!poAttached || PO_Version > 0) {
                        Log.Time("ConvertFile");
                        var pdfFile = null;
                        if (poTemplateInfos.fileFormat === "DOCX") // Microsoft Word mode
                         {
                            pdfFile = PO_TemplateFile.ConvertFile({
                                conversionType: "mailMerge",
                                outputFormat: "pdf",
                                csv: csvFile
                            });
                        }
                        else if (poTemplateInfos.fileFormat === "RPT") // Crystal mode
                         {
                            pdfFile = jsonFile.ConvertFile({ conversionType: "crystal", report: PO_TemplateFile });
                        }
                        Log.TimeEnd("ConvertFile");
                        // Third step - Check if error(s) happened with PDF generation
                        if (!pdfFile) {
                            Log.Error("Error converting template to pdf");
                            return false;
                        }
                        var name = Lib.P2P.Export.GetName("PO", "OrderNumber__", PO_Version);
                        if (!Attach.AttachTemporaryFile(pdfFile, {
                            name: name,
                            attachAsConverted: true,
                            attachAsFirst: true
                        })) {
                            Log.Error("Error creating PO attachment");
                            return false;
                        }
                        iAttachPO = 0;
                        Attach.SetValue(iAttachPO, "Purchasing_DocumentType", "PO");
                        Attach.SetValue(iAttachPO, "Purchasing_DocumentRevisionVersion", PO_Version);
                    }
                    if (!csvAttached && poTemplateInfos.fileFormat === "DOCX") {
                        if (!Attach.AttachTemporaryFile(csvFile, { name: "PO.csv", attachAsConverted: true })) {
                            Log.Error("Error creating CSV attachment");
                            return false;
                        }
                        iAttachCSV = Attach.GetNbAttach() - 1;
                        Attach.SetValue(iAttachCSV, "Purchasing_DocumentType", "CSV");
                    }
                    var PO_TermsConditionsFile = void 0;
                    if (!Sys.Helpers.IsEmpty(poTemplateInfos.termsConditions)) {
                        var lastIndex = poTemplateInfos.termsConditions.lastIndexOf(".");
                        var partBefore = poTemplateInfos.termsConditions.substring(0, lastIndex);
                        var partAfter = poTemplateInfos.termsConditions.substring(lastIndex + 1);
                        PO_TermsConditionsFile = Process.GetResourceFile(partBefore + "_" + poTemplateInfos.escapedCompanyCode + "." + partAfter);
                        if (!PO_TermsConditionsFile) {
                            PO_TermsConditionsFile = Process.GetResourceFile(poTemplateInfos.termsConditions);
                        }
                        if (PO_TermsConditionsFile) {
                            // Merge PDF terms conditions
                            Log.Info("PO_TermsConditionsFile used: " + PO_TermsConditionsFile.GetFileName());
                            // ExecutePDFCommand will skip command if the command has already been executed, so add spaces inside it to force its execution
                            var dontSkipPdfCommand = "";
                            if (PO_Version > 0) {
                                dontSkipPdfCommand = Array(PO_Version + 1).join(" ");
                            }
                            var pdfCommands = ["-merge " + dontSkipPdfCommand + " %infile[" + (iAttachPO + 1) + "]% "];
                            pdfCommands.push(PO_TermsConditionsFile);
                            if (!Attach.PDFCommands(pdfCommands)) {
                                Log.Error("Error in PDF command: " + pdfCommands);
                                return false;
                            }
                        }
                        else {
                            Log.Error("File terms and conditions not found: " + poTemplateInfos.termsConditions);
                            return false;
                        }
                    }
                    Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnAttachPO", iAttachPO, iAttachCSV);
                }
                return true;
            }
            POValidation.AttachPO = AttachPO;
            function OnCanceledReception() {
                Log.Info("On canceled reception");
                // Allowing to know if delivery was completed before canceling GR
                var previousOpenOrderLocalCurrency = Data.GetValue("OpenOrderLocalCurrency__");
                var deliveryCompleted = previousOpenOrderLocalCurrency == 0;
                Log.Info("Re-synchronize items");
                var bok = POValidation.SynchronizeItems({ fromAction: false });
                if (bok) {
                    if (deliveryCompleted) {
                        Log.Info("Notify cancellation via the conversation");
                        var data = Variable.GetValueAsString("LastCanceledReceptionData");
                        data = JSON.parse(data);
                        // From the story "PAC - FT-018950 - Fix - issue when advanced payment request and auto reception enabled",
                        // it is decided that the user displayed in the conversation and the From of the notification email is
                        // the owner of the PO (Buyer). Otherwise, in case of Advanced payment, the user in the conversation
                        // would be the last validator (Treasurer).
                        var user = Lib.P2P.GetOwner();
                        var userDisplayName = user.GetValue("DisplayName");
                        var msg = Language.Translate("_Item OnCanceledReception", false, data.grNumber, userDisplayName, data.comment);
                        Lib.Purchasing.VendorNotifications.AddConversationItem(msg, Lib.Purchasing.ConversationTypes.ItemReception, null, user);
                    }
                    else {
                        Log.Info("No need to notify cancellation via the conversation because the delivery wasn't completed");
                    }
                    Process.WaitForUpdate();
                    Process.LeaveForm();
                }
                else {
                    Process.PreventApproval();
                }
            }
            POValidation.OnCanceledReception = OnCanceledReception;
            //#region Billing completed
            function UpdateBillingCompleted(isBillingCompleted) {
                if (Lib.Purchasing.POItems.IsBillingCompleted() != isBillingCompleted) {
                    Lib.Purchasing.POItems.FillItemsInvoicedAmountAndQuantityFromAPPOItems(isBillingCompleted)
                        .Then(function () {
                        Lib.Purchasing.POItems.UpdateBillingCompletedOnPOItems(isBillingCompleted);
                        Lib.Purchasing.POValidation.UpdateBillingCompletedOnAPTables(isBillingCompleted);
                        Lib.Purchasing.POBudget.AsOrdered(); //update budget
                    });
                }
                else {
                    Log.Warn("BillingCompleted already in state ".concat(isBillingCompleted, " => nothing to do"));
                }
            }
            POValidation.UpdateBillingCompleted = UpdateBillingCompleted;
            function UpdateBillingCompletedOnAPTables(isBillingCompleted) {
                Log.Info("UpdateBillingCompletedOnAPTables");
                Lib.Purchasing.POValidation.UpdateAPPOHeaderBillingCompleted(isBillingCompleted);
                Lib.Purchasing.POValidation.UpdateAPPOItemsTable("UPDATE");
            }
            POValidation.UpdateBillingCompletedOnAPTables = UpdateBillingCompletedOnAPTables;
            function UpdateAPPOHeaderBillingCompleted(IsBillingCompleted) {
                Log.Info("UpdateAPPOHeaderBillingCompleted");
                var filter = Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", Data.GetValue("OrderNumber__")).toString();
                var attributes = [{ name: "NoMoreInvoiceExpected__", value: Number(IsBillingCompleted) }];
                Sys.Helpers.Database.AddOrModifyTableRecord(Lib.P2P.TableNames.POHeaders, filter, attributes);
            }
            POValidation.UpdateAPPOHeaderBillingCompleted = UpdateAPPOHeaderBillingCompleted;
            //#endregion
            //#region OnInvoicePost
            function OnInvoicePost() {
                return Lib.Purchasing.POValidation.UpdateQuantityAndAmountFromCDLVIP()
                    .Then(function () {
                    Lib.Purchasing.POBudget.AsOrdered(); //update budget
                })
                    .Finally(function () {
                    if (Data.GetValue("OrderStatus__") != "Received") {
                        Process.WaitForUpdate();
                    }
                    // else return to state 100
                });
            }
            POValidation.OnInvoicePost = OnInvoicePost;
            //#endregion
            function UpdateQuantityAndAmountFromCDLVIP() {
                Log.Info("UpdateQuantityAndAmountFromCDLVIP");
                var queryParamCDLVIP = {
                    table: "CDLNAME#Vendor invoice.LineItems__",
                    attributes: ["Line_ItemNumber__", "Line_BudgetID__", "Line_Quantity__"],
                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Line_OrderNumber__", Data.GetValue("OrderNumber__")), Sys.Helpers.LdapUtil.FilterEqual("BudgetExportStatus__", "success"), Sys.Helpers.LdapUtil.FilterNotEqual("InvoiceStatus__", "Reversed")),
                    additionalOptions: {
                        asAdmin: true,
                        queryOptions: "FastSearch=1"
                    }
                };
                return Sys.GenericAPI.PromisedQuery(queryParamCDLVIP)
                    .Then(function (queryResult) {
                    var INVResultsByLine = {};
                    queryResult.forEach(function (INV) {
                        var lineNumber = INV.Line_ItemNumber__;
                        var invoicedQuantity = new Sys.Decimal(INV.Line_Quantity__ || 0);
                        if (!INVResultsByLine[lineNumber]) {
                            INVResultsByLine[lineNumber] = { invoicedQuantity: new Sys.Decimal(0) };
                        }
                        INVResultsByLine[lineNumber].invoicedQuantity = INVResultsByLine[lineNumber].invoicedQuantity.add(invoicedQuantity);
                    });
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                        var INVResultByLine = INVResultsByLine[item.GetValue("LineItemNumber__")];
                        if (INVResultByLine) {
                            item.SetValue("ItemInvoicedQuantity__", INVResultByLine.invoicedQuantity);
                        }
                    });
                });
            }
            POValidation.UpdateQuantityAndAmountFromCDLVIP = UpdateQuantityAndAmountFromCDLVIP;
            /**
             * Uncheck No good receipt required (for items without any invoice post),
             * and SynchronizeItems to report check in "AP - Purchase order - Items__" table
             */
            function ReverseItemToManualReceiption() {
                var reverseableItemInThisPOQueryParam = {
                    table: "AP - Purchase order - Items__",
                    attributes: ["ItemNumber__", "OrderNumber__", "NoGoodsReceipt__", "InvoicedAmount__"],
                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", Data.GetValue("OrderNumber__")), Sys.Helpers.LdapUtil.FilterEqual("NoGoodsReceipt__", "1"), Sys.Helpers.LdapUtil.FilterLesserOrEqual("InvoicedAmount__", "0"))
                };
                return Sys.GenericAPI.PromisedQuery(reverseableItemInThisPOQueryParam).Then(function (reverseableItemInThisPOQueryResult) {
                    if (reverseableItemInThisPOQueryResult.length > 0) {
                        var needSynchroniseItem_1 = false;
                        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                            for (var i = 0; i < reverseableItemInThisPOQueryResult.length; i++) {
                                if (reverseableItemInThisPOQueryResult[i].ItemNumber__ == item.GetValue("LineItemNumber__").toString()) {
                                    //Reverse only item with requested delivery date in past
                                    if (Sys.Helpers.Date.CompareDateToToday(item.GetValue("ItemRequestedDeliveryDate__")) <= 0) {
                                        needSynchroniseItem_1 = true;
                                        item.SetValue("NoGoodsReceipt__", false);
                                        Log.Info("ReverseItemToManualReceiption for item : " + item.GetValue("LineItemNumber__"));
                                    }
                                    else {
                                        Log.Verbose("Do not reverse item due to requested delivery date not in past : " + item.GetValue("LineItemNumber__"));
                                    }
                                    break;
                                }
                            }
                        });
                        if (needSynchroniseItem_1) {
                            POValidation.SynchronizeItems({ fromAction: true });
                        }
                    }
                    else {
                        Log.Info("No item to reverse to manual reception");
                    }
                });
            }
            POValidation.ReverseItemToManualReceiption = ReverseItemToManualReceiption;
        })(POValidation = Purchasing.POValidation || (Purchasing.POValidation = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
