///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_PRValidation_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing library managing PR items",
  "require": [
    "Sys/Sys_Helpers_Array",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_WorkflowController"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var PRValidation;
        (function (PRValidation) {
            /**
             * Call when the Purchase requisition is saved.
             */
            function OnSave() {
                // more to come...
            }
            PRValidation.OnSave = OnSave;
            /**
             * Create a next alert to advise user when we try to execute an unknown action.
             * Process will be in validation state and wait for an action of user.
             * @param {string} currentAction name of the executed action
             * @param {string} currentName sub-name of the executed action
             */
            function OnUnknownAction(currentAction, currentName) {
                var knownAction = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.OnUnknownAction", currentAction, currentName);
                if (knownAction !== true) {
                    Lib.Purchasing.OnUnknownAction(currentAction, currentName);
                }
            }
            PRValidation.OnUnknownAction = OnUnknownAction;
            function GetGlobalStatus(tabPRItems) {
                var ToOrder = 0;
                var ToReceive = 0;
                var Received = 0;
                var Canceled = 0;
                tabPRItems.forEach(function (prItem) {
                    switch (prItem.GetValue("ItemStatus__")) {
                        case "To order":
                            ToOrder++;
                            break;
                        case "To receive":
                            ToReceive++;
                            break;
                        case "Received":
                            Received++;
                            break;
                        case "Canceled":
                            Canceled++;
                            break;
                        default:
                            break;
                    }
                });
                Log.Info("GetGlobalStatus, nbr of Items : Total=" + tabPRItems.length + "; ToOrder=" + ToOrder + "; ToReceive=" + ToReceive + "; Received=" + Received + "; Canceled=" + Canceled);
                if (ToOrder != 0) {
                    return "To order";
                }
                if (ToReceive != 0) {
                    return "To receive";
                }
                if (Received != 0) {
                    return "Received";
                }
                if (tabPRItems.length != 0 && Canceled == tabPRItems.length) {
                    return "Canceled";
                }
                return "To order";
            }
            PRValidation.GetGlobalStatus = GetGlobalStatus;
            function InitComputedDataForPRItemsSynchronizeConfig() {
                var requesterDn = GetFullDNFromLogin(Data.GetValue("RequisitionInitiator__"));
                var computedData = {
                    common: {
                        "RequesterDN": requesterDn
                    },
                    byLine: {}
                };
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                    var lineNumber = line.GetValue("LineItemNumber__");
                    var buyerDn = GetFullDNFromLogin(line.GetValue("BuyerLogin__"));
                    var recipientDn = GetFullDNFromLogin(line.GetValue("RecipientLogin__"));
                    computedData.byLine[lineNumber] = {
                        "CompletelyOrdered": 0,
                        "BuyerDN": buyerDn,
                        "RecipientDN": recipientDn,
                        "ExchangeRate": line.GetValue("ItemExchangeRate__") || Data.GetValue("ExchangeRate__")
                    };
                });
                Lib.Purchasing.Items.PRItemsSynchronizeConfig.computedData = computedData;
                return computedData;
            }
            PRValidation.InitComputedDataForPRItemsSynchronizeConfig = InitComputedDataForPRItemsSynchronizeConfig;
            /**
             * Get the full DN of the user identified by his login.
             * @param {string} login of the user
             * @returns {string} returns the full DN of user or blank if not found.
             */
            function GetFullDNFromLogin(login) {
                var user = login && Users.GetUser(login);
                var userDn = user && user.GetVars().GetValue_String("FullDn", 0);
                return userDn || "";
            }
            PRValidation.GetFullDNFromLogin = GetFullDNFromLogin;
            /**
             * Synchronize PR items.
             * When the PR is pending the PR items are updated according to the form table. After order is created, the PR items
             * are updated according to the PO items.
             * @returns {boolean} true if succeeds, false otherwise
             */
            PRValidation.SynchronizeItems = (function () {
                function DependsOnPOItems() {
                    var status = Data.GetValue("RequisitionStatus__");
                    return Lib.Purchasing.PRStatus.ForPOWorkflow.indexOf(status) !== -1 || Lib.Purchasing.PRStatus.ForDelivery.indexOf(status) !== -1;
                }
                function GetStatus(ordered, receptionCompleted, orderCompleted, canceled) {
                    if (ordered > 0) {
                        if (!orderCompleted) {
                            return "To order";
                        }
                        else if (!receptionCompleted) {
                            return "To receive";
                        }
                        return "Received";
                    }
                    else if (canceled) {
                        return "Canceled";
                    }
                    else if (orderCompleted) {
                        return "Received";
                    }
                    return "To order";
                }
                function Synchronize(options) {
                    try {
                        options = options || {};
                        var prNumber = Data.GetValue("RequisitionNumber__");
                        var computedData_1 = InitComputedDataForPRItemsSynchronizeConfig();
                        // Update (or create) document items when PR is pending (not yet order created).
                        if (!DependsOnPOItems()) {
                            Log.Info("Update PR items with number '" + prNumber + "'");
                            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                                line.SetValue("ItemStatus__", Data.GetValue("RequisitionStatus__"));
                            });
                        }
                        // Update document items when PR is waiting for update (order created).
                        // Feed computed data according to the PO items.
                        else {
                            Log.Info("Update PR according to the PO items with number '" + prNumber + "'");
                            // 1 - retrieve PO items for this purchase request (This call is synchronous at server side)
                            var poItems_1 = Lib.Purchasing.Items.GetItemsForDocumentSync(Lib.Purchasing.Items.POItemsDBInfo, "(&(Status__!=Canceled)(Status__!=Rejected)(PRNumber__=" + prNumber + "))", "PRLineNumber__");
                            // 2 - update global status and compute some data for lines (use in synchronization) of the PR
                            var tabPRItems_1 = [];
                            var buyerWithOpenItem_1 = {};
                            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                                var lineNumber = line.GetValue("LineItemNumber__");
                                var SplitPRParam = Sys.Parameters.GetInstance("PAC").GetParameter("AllowSplitPRIntoMultiplePO", false);
                                var lineRequestedQuantity = new Sys.Decimal(line.GetValue("ItemQuantity__")).minus(line.GetValue("CanceledQuantity__") || 0);
                                //Keep it for upgradability, for PR canceled before the CanceledQuantity__ field was added
                                if (line.GetValue("ItemStatus__") === "Canceled") {
                                    lineRequestedQuantity = new Sys.Decimal(0);
                                }
                                var lineOrderedQuantity = new Sys.Decimal(0);
                                var lineReceivedQuantity = new Sys.Decimal(0);
                                var lineReturnedQuantity = new Sys.Decimal(0);
                                var PONumber = "";
                                var lineOrderedAmount = new Sys.Decimal(0);
                                var lineReceivedAmount = new Sys.Decimal(0);
                                var lineCanceled = false;
                                var lineReceptionCompleted = true;
                                var lineOrderCompleted = false;
                                var poItemsForLine = poItems_1[lineNumber];
                                if (poItemsForLine) {
                                    poItemsForLine.forEach(function (poItem) {
                                        lineOrderedAmount = lineOrderedAmount.add(poItem.GetValue("NetAmount__"));
                                        lineReceivedAmount = lineReceivedAmount.add(poItem.GetValue("ItemReceivedAmount__"));
                                        lineOrderedQuantity = lineOrderedQuantity.add(poItem.GetValue("OrderedQuantity__"));
                                        lineReceivedQuantity = lineReceivedQuantity.add(poItem.GetValue("ReceivedQuantity__"));
                                        lineReturnedQuantity = lineReturnedQuantity.add(poItem.GetValue("ReturnedQuantity__"));
                                        if (PONumber) {
                                            PONumber += "\n";
                                        }
                                        PONumber += poItem.GetValue("PONumber__");
                                        lineReceptionCompleted = lineReceptionCompleted && poItem.GetValue("Status__") === "Received";
                                        if (!SplitPRParam) {
                                            lineOrderCompleted = true;
                                        }
                                    });
                                }
                                else {
                                    Log.Info("PR line number '" + lineNumber + "' not yet ordered");
                                }
                                lineOrderCompleted = lineOrderCompleted || lineOrderedQuantity.greaterThanOrEqualTo(lineRequestedQuantity);
                                lineCanceled = lineOrderCompleted && (lineOrderedQuantity.lessThan(lineRequestedQuantity) || lineRequestedQuantity.equals(0));
                                lineReceptionCompleted = lineReceptionCompleted && lineOrderCompleted;
                                // byline computed data
                                line.SetValue("ItemOrderedAmount__", lineOrderedAmount.toNumber());
                                line.SetValue("ItemReceivedAmount__", lineReceivedAmount.toNumber());
                                line.SetValue("ItemOrderedQuantity__", lineOrderedQuantity.toNumber());
                                line.SetValue("ItemDeliveredQuantity__", lineReceivedQuantity.toNumber());
                                line.SetValue("ItemReturnedQuantity__", lineReturnedQuantity.toNumber());
                                line.SetValue("ItemStatus__", GetStatus(lineOrderedQuantity.toNumber(), lineReceptionCompleted, lineOrderCompleted, lineCanceled));
                                Sys.Helpers.Extend(computedData_1.byLine[lineNumber], {
                                    "CompletelyOrdered": lineOrderCompleted ? 1 : 0
                                });
                                var buyerLogin = line.GetValue("BuyerLogin__");
                                buyerWithOpenItem_1[buyerLogin] = buyerWithOpenItem_1[buyerLogin] || line.GetValue("ItemStatus__") === "To order";
                                line.SetValue("PONumber__", PONumber);
                                tabPRItems_1.push(line);
                            });
                            Sys.Helpers.Object.ForEach(buyerWithOpenItem_1, function (hasOpenItem, buyerLogin) {
                                Process.SetRight(buyerLogin, hasOpenItem ? "validate" : "write");
                            });
                            // global status
                            Data.SetValue("RequisitionStatus__", GetGlobalStatus(tabPRItems_1));
                        }
                        return Lib.Purchasing.Items.Synchronize(Lib.Purchasing.Items.PRItemsSynchronizeConfig);
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
             * Synchronize PR items. Must be call from an action. Determine the next state of document.
             */
            function SynchronizeItemsFromAction() {
                var status = Data.GetValue("RequisitionStatus__");
                if (Lib.Purchasing.PRStatus.ForPRWorkflow.indexOf(status) !== -1) {
                    PRValidation.SynchronizeItems({ fromAction: true });
                    Process.PreventApproval();
                }
                else if (Lib.Purchasing.PRStatus.ForDelivery.indexOf(status) !== -1) {
                    // DoAction for reception
                    Process.RecallScript("PostValidation_Receive");
                }
                else {
                    // DoAction for purchase
                    Process.RecallScript("PostValidation_Submit");
                }
            }
            PRValidation.SynchronizeItemsFromAction = SynchronizeItemsFromAction;
            /**
             * Generic method to create an order. Implements the `prepareOrderFn` function in order to specialize the order.
             * Serialize one variable on the PO instance:
             * 	- PR_RuidEx__, the RuidEx of the PR instance.
             * @param {Function} prepareOrderFn function used to prepare the new instance of PO.
             * @returns {boolean} true if succeeds, false otherwise.
             */
            function CreateOrder(buyerLogin, prepareOrderFn) {
                Log.Info("[CreateOrder] Generating Purchase order for buyer: ".concat(buyerLogin));
                var poInstance = Process.CreateProcessInstanceForUser(Lib.P2P.GetPOProcessName(), buyerLogin, 0, true);
                var extPOVars = poInstance.GetExternalVars();
                extPOVars.AddValue_String("PR_RuidEx__", Data.GetValue("RUIDEX"), true);
                // transmit all attachments of PR to PO as attachments (ref document becomes an attachment)
                var nbAttach = Attach.GetNbAttach();
                for (var i = 0; i < nbAttach; i++) {
                    var attach = Attach.GetAttach(i);
                    var attachPath = Attach.GetAttachConvertedPath(i) || attach.GetAttachFile();
                    var attachName = Attach.GetName(i);
                    Log.Info("[CreateOrder] Attaching attachment " + i + " to PO: " + attachName);
                    var poAttach = void 0;
                    if (Sys.Helpers.IsFile(attachPath)) {
                        poAttach = poInstance.AddAttachEx(attachPath);
                    }
                    else {
                        poAttach = poInstance.AddAttach();
                        poAttach.SetAttachFile(attachPath);
                    }
                    poAttach.GetVars().AddValue_String("AttachOutputName", attachName, true);
                }
                prepareOrderFn && prepareOrderFn(poInstance);
                poInstance.Process();
                var ret = poInstance.GetLastError();
                if (ret === 0) {
                    Log.Info("[CreateOrder] PO process call OK");
                }
                else {
                    Log.Info("[CreateOrder] PO process call returns with error message : " + poInstance.GetLastErrorMessage());
                }
                return ret === 0;
            }
            PRValidation.CreateOrder = CreateOrder;
            function CanBeAutoOrdered(item, itemTakenFromStockOnly) {
                if (itemTakenFromStockOnly) {
                    return Lib.P2P.Inventory.IsItemTakenFromStock(item);
                }
                var vendorNumber = item.GetValue("VendorNumber__");
                var orderableQuantity = new Sys.Decimal(item.GetValue("ItemQuantity__") || 0);
                return Lib.P2P.Inventory.IsItemTakenFromStock(item) || (!Sys.Helpers.IsEmpty(vendorNumber) && orderableQuantity.greaterThan(0));
            }
            /**
             * Create the purchase order process instance. This method is called when the user exit
             * IsAutoCreateOrderEnabled returns true.
             * Serialize two variables on PR & PO instances:
             * 	- PR_RuidEx__, the RuidEx of the PR instance.
             *  - AutoCreateOrderEnabled, flag to true indicating the PO instance has been automatically created.
             * @returns {boolean} true if succeeds, false otherwise.
             */
            function AutoCreateOrder(itemTakenFromStockOnly) {
                Log.Info("[AutoCreateOrder] Generating Purchase order for auto order");
                var ok = true;
                var buyerLogin = Variable.GetValueAsString("BuyerLogin__");
                var itemsGroupedByKey = {};
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    if (Sys.Helpers.IsEmpty(buyerLogin)) {
                        buyerLogin = item.GetValue("BuyerLogin__");
                    }
                    if (CanBeAutoOrdered(item, itemTakenFromStockOnly)) {
                        var isItemTakenFromStock = Lib.P2P.Inventory.IsItemTakenFromStock(item);
                        var key = "".concat(item.GetValue("WarehouseID__") || "", " - ").concat(item.GetValue("VendorNumber__") || "");
                        if (Lib.Purchasing.IsPunchoutItem(item)) {
                            // Punchout item: group by shipto address too
                            key += "-" + (item.GetValue("ItemShipToCompany__") || "");
                        }
                        itemsGroupedByKey[key] = itemsGroupedByKey[key] || [];
                        itemsGroupedByKey[key].push({
                            lineNumber: item.GetValue("LineItemNumber__"),
                            isItemTakenFromStock: isItemTakenFromStock,
                            warehouseID: item.GetValue("WarehouseID__")
                        });
                    }
                });
                Sys.Helpers.Object.ForEach(itemsGroupedByKey, function (items, key) {
                    var buyer = buyerLogin;
                    if (items[0].isItemTakenFromStock) {
                        Lib.P2P.Inventory.Warehouse.GetWarehouse(Data.GetValue("CompanyCode__"), items[0].warehouseID)
                            .Then(function (warehouse) {
                            buyer = warehouse.warehouseManagerLogin;
                        });
                    }
                    Log.Info("[AutoCreateOrder] creating order for key: [".concat(key, "] with buyer [").concat(buyer, "] and items: [").concat(items.join(","), "]"));
                    // even if a previous creation failed we continue the loop
                    ok = PRValidation.CreateOrder(buyer, function (poInstance) {
                        var extPOVars = poInstance.GetExternalVars();
                        var itemsSubFilter = "(|".concat(items.map(function (item) { return "(LineNumber__=".concat(item.lineNumber, ")"); }).join(""), ")");
                        //TODO change externalVars to field a new field on PO
                        extPOVars.AddValue_String("IsInternal", items[0].isItemTakenFromStock, true);
                        extPOVars.AddValue_String("PR_OrderedItemsSubFilter", itemsSubFilter, true);
                        extPOVars.AddValue_String("AutoCreateOrderEnabled", "true", true);
                        Variable.SetValueAsString("AutoCreateOrderEnabled", true);
                    }) && ok;
                });
                return ok;
            }
            PRValidation.AutoCreateOrder = AutoCreateOrder;
            /**
             * Check asynchronous resume with actions (Reject or BackToRequester) triggered by buyer from the "To order" layout
             * are still possible.
             * In other words, we check no items have been ordered.
             * @param {string} action action which we resume with.
             * @returns {boolean} true if succeeds, false otherwise.
             */
            function CanResumeWithAction(action) {
                if (action === "Reject" || action === "BackToAP") {
                    var orderedOrCanceled_1 = false;
                    // local check (when action fieldsnotif comes after the order sync or cancel remaining items fieldsnotifs)
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        if (line.GetValue("ItemOrderedQuantity__") > 0 || line.GetValue("ItemStatus__") === "Canceled") {
                            orderedOrCanceled_1 = true;
                        }
                        return orderedOrCanceled_1; // true -> break loop
                    });
                    // database check (when action fieldsnotif comes before order sync fieldsnotif - rare !)
                    if (!orderedOrCanceled_1) {
                        try {
                            // Select any PO items with this document RuidEx
                            var poItemsFilter = "(&(Status__!=Canceled)(PRRUIDEX__=" + Data.GetValue("RuidEx") + "))";
                            var poItems = Lib.Purchasing.Items.GetItemsForDocumentSync(Lib.Purchasing.Items.POItemsDBInfo, poItemsFilter, "PRNumber__");
                            orderedOrCanceled_1 = !Sys.Helpers.Object.IsEmptyPlainObject(poItems);
                        }
                        catch (e) {
                            Lib.Purchasing.OnUnexpectedError(e.toString());
                            return false;
                        }
                    }
                    if (orderedOrCanceled_1) {
                        var actionInMsg = action === "Reject" ? "reject" : "back to requester";
                        Log.Warn("Cannot " + actionInMsg + " a purchase requisition already ordered or partially canceled.");
                        // Do nothing go back to state 90
                        Process.WaitForUpdate();
                        Process.LeaveForm();
                        return false;
                    }
                }
                else if (action === "Cancel_remaining_items") {
                    return Lib.Purchasing.PRStatus.ForPOWorkflow.indexOf(Data.GetValue("RequisitionStatus__")) !== -1;
                }
                return true;
            }
            PRValidation.CanResumeWithAction = CanResumeWithAction;
            function GiveReadRightToTopManagers(workflow, parameters) {
                var rolesToBuild = Sys.Helpers.Array.Filter(workflow.GetRolesSequence() || [], function (role) {
                    return role === Lib.Purchasing.sequenceRoleApprover || role === Lib.Purchasing.sequenceRoleReviewer;
                });
                if (!rolesToBuild.length) {
                    return;
                }
                var params = {
                    workflowParams: parameters,
                    rolesToBuild: rolesToBuild,
                    libVersion: workflow.libVersion,
                    rejectOnlyWorkflowEngineErrors: true,
                    // user parameters
                    infiniteAmount: true
                };
                Sys.WorkflowController
                    .DryRunBuild(params)
                    .Then(function (topContributorsByRole) {
                    var topManagers = {};
                    Sys.Helpers.Object.ForEach(topContributorsByRole, function (topContributors, role) {
                        var contributors = workflow.GetContributorsByRole(role);
                        if (contributors) {
                            // we keep only contributor that we don't find in the current contributors
                            Sys.Helpers.Array.Filter(topContributors.contributors, function (topContributor) {
                                var foundContributor = Sys.Helpers.Array.Find(contributors, function (contributor) { return contributor.login === topContributor.login; });
                                return !foundContributor;
                            })
                                // we just keep the login in order to store in an external variable
                                .forEach(function (topContributor) {
                                topManagers[topContributor.login] = 0; // no matter what value
                            });
                        }
                    });
                    Object
                        .keys(topManagers)
                        // we never remove rights. It's done by a global call to ResetRights in the validation script
                        .forEach(function (login) { return Process.AddRight(login, "read"); });
                })
                    .Catch(function (reason) {
                    Log.Error("Cannot add read right to the top managers. Reason: ".concat(reason.message || reason));
                });
            }
            PRValidation.GiveReadRightToTopManagers = GiveReadRightToTopManagers;
        })(PRValidation = Purchasing.PRValidation || (Purchasing.PRValidation = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
