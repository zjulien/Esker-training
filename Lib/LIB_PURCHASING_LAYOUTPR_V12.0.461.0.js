///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_LayoutPR_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing library",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_ShipTo_Client_V12.0.461.0",
    "Lib_Purchasing_Punchout_PR_Client_V12.0.461.0",
    "Lib_Purchasing_Vendor_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Banner",
    "Sys/Sys_WorkflowEngine",
    "Sys/Sys_Parameters",
    "Sys/Sys_WorkflowController",
    "Sys/Sys_Helpers_Controls",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var LayoutPR;
        (function (LayoutPR) {
            /**
             * Our instance of the workflow controller used in the purchase requisition.
             * Exposed as WorkflowControllerInstance.
             */
            var workflow = Sys.WorkflowController.Create({ version: 2 });
            LayoutPR.hideSynchronizeItemsButton = true;
            var g_allowedWarehouses = [];
            var hideUpdateExchangeRateButton = true;
            // Display synchronizeItems when
            //  admin on state = 90
            //  state = 70 and RequisitionStatus__ == To receive
            if (Lib.P2P.IsAdmin()) {
                var state = Data.GetValue("State");
                if (state == 90 || (state == 70 && Data.GetValue("RequisitionStatus__") == "To receive") || state == 100) {
                    if (state != 100) {
                        LayoutPR.hideSynchronizeItemsButton = false;
                    }
                    hideUpdateExchangeRateButton = false;
                }
            }
            LayoutPR.WorkflowControllerInstance = workflow;
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // EXPERIMENTAL - DO NOT USE
            LayoutPR.FormTemplateManager = null;
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            var currentLayout;
            /**
             * @param {*} layout use lib.Purchasing.roleRequester/roleBuyer/roleApprover/roleReceiver/roleAdvisor/roleTreasurer
             */
            function SetCurrentLayout(layout) {
                currentLayout = layout;
            }
            LayoutPR.SetCurrentLayout = SetCurrentLayout;
            function GetCurrentLayout() {
                return currentLayout;
            }
            LayoutPR.GetCurrentLayout = GetCurrentLayout;
            /**
             * IsOwner or IsMemberOf Owner
             */
            function IsOwner() {
                return Lib.P2P.IsOwner();
            }
            LayoutPR.IsOwner = IsOwner;
            /**
             * Is owner, member of owner or backup of owner.
             */
            function IsOwnerOrBackup() {
                return IsOwner() || IsBackupOfOwner();
            }
            LayoutPR.IsOwnerOrBackup = IsOwnerOrBackup;
            /**
             * Is owner, member of owner or backup of owner.
             */
            function IsOwnerOrBackupOrAdmin() {
                return IsOwnerOrBackup() || Lib.P2P.IsAdminNotOwner();
            }
            LayoutPR.IsOwnerOrBackupOrAdmin = IsOwnerOrBackupOrAdmin;
            /**
             * Is backup of owner.
             */
            function IsBackupOfOwner() {
                return User.IsBackupUserOf(Data.GetValue("OwnerId"));
            }
            LayoutPR.IsBackupOfOwner = IsBackupOfOwner;
            /**
             * Return true if the user is the current Contributor or if no workflow is build yet (requester)
             */
            function IsCurrentContributor() {
                var currentContributor = workflow.GetNbContributors() > 0 && workflow.GetContributorAt(workflow.GetContributorIndex());
                if (!currentContributor) {
                    //No Workflow yet, you should be the Requester, so you are the Current Contributor
                    return true;
                }
                return Lib.P2P.CurrentUserMatchesLogin(currentContributor.login)
                    // If the current user is the admin and he's not the owner of the document,
                    // he can do the next contributor's actions (no matter who's the next contributor)
                    || Lib.P2P.IsAdminNotOwner();
            }
            LayoutPR.IsCurrentContributor = IsCurrentContributor;
            /**
             * Return true if the current user is in advisor list
             */
            function IsInAdvisorList() {
                var list = Variable.GetValueAsString("AdvisorLoginList");
                if (list) {
                    var logins = list.split("\n");
                    for (var i = 0; i < logins.length; i++) {
                        if (logins && (User.loginId.toUpperCase() === logins[i].toUpperCase() || User.IsMemberOf(logins[i]))) {
                            return true;
                        }
                    }
                }
                return false;
            }
            LayoutPR.IsInAdvisorList = IsInAdvisorList;
            /**
             * Return true if the current contributor as the Advisor role.
             */
            function IsAdvisor() {
                return !IsCurrentContributor() && IsInAdvisorList();
            }
            LayoutPR.IsAdvisor = IsAdvisor;
            /**
             * return true if the process is ReadOnly, or if the user is an Advisor, or if the user has nothing to do on the form (not his step, not owner)
             * or when the user is an admin but the PR is sent back to requester (Status = "To complete" => Draft)
             */
            function IsReadOnly() {
                return !!(ProcessInstance.isReadOnly
                    || (!Lib.Purchasing.LayoutPR.IsCurrentContributor() && !IsOwnerOrBackupOrAdmin())
                    || (Lib.P2P.IsAdminNotOwner() && Controls.RequisitionStatus__.GetValue() === "To complete")
                    || IsAdvisor());
            }
            LayoutPR.IsReadOnly = IsReadOnly;
            /**
             * Return true if the current layout is the Requester
             */
            function IsRequesterStep() {
                return Lib.Purchasing.IsRequester(currentLayout);
            }
            LayoutPR.IsRequesterStep = IsRequesterStep;
            /**
             * Return true if the current layout is the Approver
             */
            function IsApproverStep() {
                return Lib.Purchasing.IsApprover(currentLayout);
            }
            LayoutPR.IsApproverStep = IsApproverStep;
            /**
             * Return true if the current user is the Requester
             */
            function IsRequester() {
                return User.loginId.toUpperCase() === Data.GetValue("RequisitionInitiator__").toUpperCase();
            }
            LayoutPR.IsRequester = IsRequester;
            /**
             * Return true if the current user is in the reviewal(controller) workflow
             */
            function IsReviewerInWorkflow() {
                return Lib.Purchasing.IsReviewerInWorkflow(workflow);
            }
            LayoutPR.IsReviewerInWorkflow = IsReviewerInWorkflow;
            /**
             * Return true if the current user is a reviewer
             */
            function IsReviewer() {
                return !IsAdvisor() && IsReviewerInWorkflow();
            }
            LayoutPR.IsReviewer = IsReviewer;
            /**
             * Return true if the current user is in the approval workflow
             */
            function IsApproverInWorkflow() {
                return Lib.Purchasing.IsApproverInWorkflow(workflow);
            }
            LayoutPR.IsApproverInWorkflow = IsApproverInWorkflow;
            /**
             * Return true if the current user is an approver
             */
            function IsApprover() {
                return !IsAdvisor() && ((Lib.Budget.IsEnabled() && Lib.Purchasing.PRLineItems.Budget.HasVisibilityOnCurrentBudget()) || IsApproverInWorkflow());
            }
            LayoutPR.IsApprover = IsApprover;
            /**
             * Return the buyer from the fist line item
             */
            function GetFirstLineBuyerLogin() {
                var firstRow = Controls.LineItems__.GetRow(0);
                if (firstRow) {
                    return firstRow.BuyerLogin__.GetValue();
                }
                return null;
            }
            LayoutPR.GetFirstLineBuyerLogin = GetFirstLineBuyerLogin;
            /**
             * Return true if the current user is in the buyers workflow
             */
            function IsBuyerInWorkflow() {
                return Lib.Purchasing.IsBuyerInWorkflow(workflow);
            }
            LayoutPR.IsBuyerInWorkflow = IsBuyerInWorkflow;
            /**
             * Return true if the user is a buyer of this PR
             */
            function IsBuyer() {
                return !IsAdvisor() && IsBuyerInWorkflow();
            }
            LayoutPR.IsBuyer = IsBuyer;
            /**
             * Ask for workflow rebuild after 500ms. Meanwhile, disable submit button
             */
            LayoutPR.DelayRebuildWorkflow = (function () {
                var timer = 0;
                var currentPromise = null;
                var currentPromiseResolve = null;
                var RebuildWorkflow = function () {
                    ProcessInstance.SetSilentChange(true);
                    Log.Info("[DelayRebuildWorkflow] trigger");
                    timer = 0;
                    currentPromise = null;
                    SetButtonsDisabled(false, "DelayRebuild workflow -> trigger");
                    Lib.Purchasing.WorkflowPR.RemoveAllAdditionalContributors();
                    var rolesSequenceToBuild = GetRebuildRolesSequence();
                    workflow.Rebuild(rolesSequenceToBuild);
                    ProcessInstance.SetSilentChange(false);
                    currentPromiseResolve();
                };
                return function () {
                    if (timer === 0) {
                        // Cannot submit when workflow update pending
                        Log.Info("[DelayRebuildWorkflow] start");
                        SetButtonsDisabled(true, "DelayRebuild workflow -> start");
                    }
                    else {
                        // cancel previous call
                        Log.Info("[DelayRebuildWorkflow] start and cancel previous");
                        clearTimeout(timer);
                    }
                    // Delay workflow rebuild
                    timer = setTimeout(RebuildWorkflow, 500);
                    if (currentPromise === null) {
                        currentPromise = Sys.Helpers.Promise.Create(function (resolve) {
                            currentPromiseResolve = resolve;
                        });
                    }
                    return currentPromise;
                };
            })();
            function GetRebuildRolesSequence() {
                var sequenceIndex = workflow.GetContributorIndex();
                var currentContributor = workflow.GetNbContributors() > sequenceIndex ? workflow.GetContributorAt(sequenceIndex) : null;
                var fullRolesSequence = workflow.GetRolesSequence();
                //default, rebuild all roles
                var roleToBuild = null;
                if (currentContributor && currentContributor.sequenceRole) {
                    var roleIndexInSequence = fullRolesSequence.indexOf(currentContributor.sequenceRole);
                    if (roleIndexInSequence === -1) {
                        Log.Error("Contributor ", currentContributor.displayName, " has an invalid sequence role, rebuild all roles sequence");
                    }
                    else {
                        //get all roles after the currentContributor's one
                        roleToBuild = fullRolesSequence.slice(roleIndexInSequence + 1);
                    }
                }
                return roleToBuild;
            }
            var SubmitButtonDisabler = Sys.Helpers.Controls.ControlDisabler(Controls.Submit_, true);
            function SetButtonsDisabled(disabled, callee) {
                SubmitButtonDisabler.SetDisabled(disabled, callee);
            }
            LayoutPR.SetButtonsDisabled = SetButtonsDisabled;
            function AllowModifyWorkflow() {
                return IsCurrentContributor() && (IsApprover() || IsRequester() || IsReviewer());
            }
            LayoutPR.AllowModifyWorkflow = AllowModifyWorkflow;
            function InitBanner() {
                var banner = Sys.Helpers.Banner;
                var requisitionStatus = Controls.RequisitionStatus__.GetValue();
                var toOrder = Lib.Purchasing.PRStatus.ForPOWorkflow.indexOf(requisitionStatus) !== -1;
                /*Set banner based oncurrent status*/
                banner.SetStatusCombo(Controls.RequisitionStatus__);
                banner.SetHTMLBanner(Controls.HTMLBanner__);
                banner.SetMainTitle("Purchase requisition");
                if (IsAdvisor()) {
                    banner.SetSubTitle("_Banner purchase requisition to comment");
                    return;
                }
                if (requisitionStatus === "To review") {
                    banner.SetSubTitle("_Banner purchase requisition reviewal");
                }
                else if (requisitionStatus === "To approve") {
                    banner.SetSubTitle("_Banner purchase requisition approbation");
                }
                else if (toOrder) {
                    banner.SetSubTitle("_Banner order creation");
                }
                else if (requisitionStatus === "To receive") {
                    banner.SetSubTitle("_Banner waiting for delivery");
                }
                else if (requisitionStatus === "Received") {
                    banner.SetSubTitle("_Banner delivered");
                }
                else if (requisitionStatus === "Canceled") {
                    banner.SetSubTitle("_Banner requisition canceled");
                }
                else if (requisitionStatus === "Rejected") {
                    banner.SetSubTitle("_Banner requisition rejected");
                }
                else if (requisitionStatus === "To complete") {
                    banner.SetSubTitle("_Banner requisition resubmitted");
                }
                else {
                    banner.SetSubTitle("_Banner purchase requisition submission");
                }
            }
            LayoutPR.InitBanner = InitBanner;
            function InitDeprecatedFields() {
                // [Fix after upgrade from sprint older than punchout features] Hide old panel "add item from catalog" + "quotation"
                if (typeof Controls.Items_actions !== "undefined") {
                    Controls.Items_actions.Hide(true);
                }
                // [Fix after upgrade from sprint older than punchout features] Make sure column ItemNumber__ do not check value in DB
                Controls.LineItems__.ItemNumber__.SetAllowTableValuesOnly(false);
                //Keep this line for older package (<153) which have a NewPO button that need to be hidden now
                if (Controls.NewPO) {
                    Controls.NewPO.Hide(true);
                }
                //Keep this line for older package (<165) which have a Approve_Forward button that need to be hidden now
                if (Controls.Approve_Forward) {
                    Controls.Approve_Forward.Hide(true);
                }
                if (Controls.InventoryMovements) {
                    Controls.InventoryMovements.Hide(true);
                }
                if (Controls.LineItems__.QuantityTakenFromStock__) {
                    Controls.LineItems__.QuantityTakenFromStock__.Hide(true);
                }
                if (Controls.LineItems__.AmountTakenFromStock__) {
                    Controls.LineItems__.AmountTakenFromStock__.Hide(true);
                }
            }
            LayoutPR.InitDeprecatedFields = InitDeprecatedFields;
            function UpdateLineItemsFilter() {
                var _a, _b;
                var isUnitOfMeasureEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure");
                var addionnalFilter;
                if (Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled()) {
                    var dataSource = "P2P - CatalogItems__";
                    Controls.LineItems__.ItemNumber__.SetDataSource(dataSource);
                    Controls.LineItems__.SupplierPartID__.SetDataSource(dataSource);
                    Controls.LineItems__.ItemDescription__.SetDataSource(dataSource);
                    var filters = [
                        "(&(|(CompanyCode__=%[CompanyCode__])(CompanyCode__=))(|(ItemNumber__.ValidityDate__<=DATE(NOW()))(ItemNumber__.ValidityDate__!=*)(ItemNumber__.ValidityDate__=))(|(ItemNumber__.ExpirationDate__>=DATE(NOW()))(ItemNumber__.ExpirationDate__!=*)(ItemNumber__.ExpirationDate__=)))"
                    ];
                    var inventoryFilter = [
                        Sys.Helpers.LdapUtil.FilterNotExist("ITEMNUMBER__.WAREHOUSENUMBER__"),
                        Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", "")
                    ];
                    if (Lib.P2P.Inventory.IsEnabled()) {
                        inventoryFilter.push(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterIn("ITEMNUMBER__.WAREHOUSENUMBER__", g_allowedWarehouses), Sys.Helpers.LdapUtil.FilterStrictlyGreater("ITEMNUMBER__.AVAILABLESTOCK__", "0")));
                    }
                    filters.push((_a = Sys.Helpers.LdapUtil).FilterOr.apply(_a, inventoryFilter));
                    if (Lib.P2P.Inventory.IsReplenishmentRequest()) {
                        filters.push(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterNotExist("ITEMNUMBER__.WAREHOUSENUMBER__"), Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", "")));
                    }
                    addionnalFilter = (_b = Sys.Helpers.LdapUtil).FilterAnd.apply(_b, filters).toString();
                    var displayColumns = "Description__|ITEMNUMBER__.VENDORNUMBER__.NAME__" + (Lib.P2P.Inventory.IsEnabled() && !Lib.P2P.Inventory.IsReplenishmentRequest() ? "|ITEMNUMBER__.WAREHOUSENUMBER__.NAME__" : "") + "|SupplyTypeID__.Name__" + (isUnitOfMeasureEnabled ? "|UnitOfMeasure__" : "") + "|ITEMNUMBER__.UNITPRICE__|ITEMNUMBER__.CURRENCY__";
                    Controls.LineItems__.ItemNumber__.SetDisplayedColumns("ItemNumber__|" + displayColumns);
                    Controls.LineItems__.SupplierPartID__.SetDisplayedColumns("ItemNumber__.SupplierPartID__|" + displayColumns);
                    Controls.LineItems__.ItemDescription__.SetDisplayedColumns(displayColumns + "|ItemNumber__.SupplierPartID__");
                    var attrs = Lib.Purchasing.CatalogHelper.ProcurementItem.AttributesV2.join("|");
                    Controls.LineItems__.ItemNumber__.SetAttributes(attrs);
                    Controls.LineItems__.SupplierPartID__.SetAttributes(attrs);
                    Controls.LineItems__.ItemDescription__.SetAttributes(attrs);
                    Controls.LineItems__.SupplierPartID__.SetSavedColumn("ItemNumber__.SupplierPartID__");
                    Controls.LineItems__.ItemDescription__.SetSavedColumn("Description__");
                }
                else {
                    var dataSource = "PurchasingOrderedItems__";
                    Controls.LineItems__.ItemNumber__.SetDataSource(dataSource);
                    Controls.LineItems__.SupplierPartID__.SetDataSource(dataSource);
                    Controls.LineItems__.ItemDescription__.SetDataSource(dataSource);
                    addionnalFilter = "(&(|(ItemCompanyCode__=%[CompanyCode__])(ItemCompanyCode__=))(|(ValidityDate__<=DATE(NOW()))(ValidityDate__!=*)(ValidityDate__=))(|(ExpirationDate__>=DATE(NOW()))(ExpirationDate__!=*)(ExpirationDate__=)))";
                    var displayColumns = "ItemDescription__|VendorNumber__.Name__|SupplyTypeID__.Name__" + (isUnitOfMeasureEnabled ? "|UnitOfMeasure__" : "") + "|ItemUnitPrice__|ItemCurrency__";
                    Controls.LineItems__.ItemNumber__.SetDisplayedColumns("ItemNumber__|" + displayColumns);
                    Controls.LineItems__.SupplierPartID__.SetDisplayedColumns("ItemNumber__|" + displayColumns);
                    Controls.LineItems__.ItemDescription__.SetDisplayedColumns(displayColumns + "|ItemNumber__");
                    var attrs = Lib.Purchasing.CatalogHelper.ProcurementItem.Attributes.join("|");
                    Controls.LineItems__.ItemNumber__.SetAttributes(attrs);
                    Controls.LineItems__.SupplierPartID__.SetAttributes(attrs);
                    Controls.LineItems__.ItemDescription__.SetAttributes(attrs);
                    Controls.LineItems__.ItemDescription__.SetSavedColumn("ItemDescription__");
                    Controls.LineItems__.SupplierPartID__.SetSavedColumn("ItemNumber__");
                }
                if (Lib.Purchasing.Vendor.IsSingleVendorMode()) {
                    var vendorNumber = Lib.Purchasing.Vendor.GetSingleVendorNumber();
                    var vendorFilter = Sys.Helpers.LdapUtil.FilterEqual(Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled() ? "ITEMNUMBER__.VENDORNUMBER__" : "VendorNumber__", vendorNumber);
                    addionnalFilter = Sys.Helpers.LdapUtil.FilterAnd(addionnalFilter, vendorFilter).toString();
                }
                Controls.LineItems__.ItemNumber__.SetFilter(addionnalFilter);
                Controls.LineItems__.SupplierPartID__.SetFilter(addionnalFilter);
                Controls.LineItems__.ItemDescription__.SetFilter(addionnalFilter);
            }
            LayoutPR.UpdateLineItemsFilter = UpdateLineItemsFilter;
            function InitLineItemsPane(allowedWarehouses) {
                Log.Time("LayoutPR.InitLineItemsPane");
                //hide Line_Items pane before Init in order to limit reflow
                Controls.Line_items.Hide(true);
                //the pane will be shown after the first call to UpdateLineItemsPane()
                var status = Controls.RequisitionStatus__.GetValue();
                var toOrder = Lib.Purchasing.PRStatus.ForPOWorkflow.indexOf(status) !== -1; // or partially ordered
                var totallyOrdered = Lib.Purchasing.PRStatus.ForDelivery.indexOf(status) !== -1;
                var nbrItemsQuantityBased = 0;
                var nbrItemsAmountBased = 0;
                var nothingOrdered = true;
                var nothingCanceled = true;
                var nothingTakenFromStock = true;
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item /*, i: number*/) {
                    if (item.GetValue("ItemOrderedQuantity__") > 0) {
                        nothingOrdered = false;
                    }
                    if (item.GetValue("CanceledQuantity__") > 0) {
                        nothingCanceled = false;
                    }
                    if (!Sys.Helpers.IsEmpty(item.GetValue("WarehouseID__"))) {
                        nothingTakenFromStock = false;
                    }
                    Lib.Purchasing.Items.IsAmountBasedItem(item) ? ++nbrItemsAmountBased : ++nbrItemsQuantityBased;
                });
                Controls.LineItems__.SetWidth("100%");
                Controls.LineItems__.SetExtendableColumn("ItemDescription__");
                Controls.LineItems__.SetAtLeastOneLine(false);
                Controls.LineItems__.ContractName__.DisableExposedColumnImplicitRequest();
                Controls.LineItems__.ContractNumber__.DisableExposedColumnImplicitRequest();
                Controls.LineItems__.ItemStatus__.Hide(!toOrder && !totallyOrdered);
                Controls.LineItems__.ItemCurrency__.SetLabel("_Currency");
                Controls.LineItems__.ItemCurrency__.SetBrowsable(true);
                Controls.LineItems__.ItemNumber__.SetBrowsable(false);
                Controls.LineItems__.ItemNumber__.SetAutocompletable(true);
                Controls.LineItems__.ItemNumber__.Hide(true);
                Controls.LineItems__.SupplierPartID__.SetBrowsable(false);
                Controls.LineItems__.SupplierPartID__.SetAutocompletable(true);
                Controls.LineItems__.SupplierPartID__.SetAllowTableValuesOnly(false);
                Controls.LineItems__.SupplierPartID__.Hide(false);
                Controls.LineItems__.ItemDescription__.SetBrowsable(false);
                Controls.LineItems__.ItemDescription__.SetAutocompletable(true);
                Controls.LineItems__.RecipientName__.SetReadOnly(true);
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.ItemUnitPrice__.SetRequired(true);
                }
                Controls.LineItems__.ItemNetAmount__.SetRequired(true);
                Controls.LineItems__.SupplyTypeName__.SetRequired(true);
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.ItemRequestedDeliveryDate__.SetRequired(Lib.Purchasing.RequestedDeliveryDate.IsRequired(GetCurrentLayout()));
                }
                var isUnitOfMeasureEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure");
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.ItemUnit__.Hide(!isUnitOfMeasureEnabled);
                    Controls.LineItems__.ItemUnit__.SetRequired(isUnitOfMeasureEnabled);
                }
                Controls.LineItems__.ItemUnit__.SetAllowTableValuesOnly(isUnitOfMeasureEnabled);
                Controls.LineItems__.ItemType__.Hide(!IsRequesterStep() || !Sys.Parameters.GetInstance("PAC").GetParameter("DisplayItemType"));
                Lib.P2P.InitItemTypeControl();
                g_allowedWarehouses = allowedWarehouses;
                UpdateLineItemsFilter();
                Controls.LineItems__.PONumber__.Hide(nothingOrdered);
                Controls.LineItems__.ItemOrderedAmount__.Hide(nbrItemsAmountBased == 0 || nothingOrdered);
                Controls.LineItems__.ItemOrderedQuantity__.Hide(nbrItemsQuantityBased == 0 || nothingOrdered);
                Controls.LineItems__.CanceledAmount__.Hide(nbrItemsAmountBased == 0 || nothingCanceled);
                Controls.LineItems__.CanceledQuantity__.Hide(nbrItemsQuantityBased == 0 || nothingCanceled);
                Controls.LineItems__.WarehouseName__.Hide(nothingTakenFromStock);
                if (!IsRequesterStep() && nbrItemsQuantityBased === 0) {
                    if (!LayoutPR.FormTemplateManager) {
                        Controls.LineItems__.ItemQuantity__.Hide(true);
                        Controls.LineItems__.ItemUnitPrice__.Hide(true);
                        Controls.LineItems__.ItemUnit__.Hide(true);
                    }
                    Controls.LineItems__.ItemUnitDescription__.Hide(true);
                }
                Log.TimeEnd("LayoutPR.InitLineItemsPane");
            }
            LayoutPR.InitLineItemsPane = InitLineItemsPane;
            function UpdateLineItemsPane() {
                var isReadOnly = IsReadOnly();
                var isRequesterStep = IsRequesterStep();
                var isBuyer = IsBuyer();
                var isApprover = Lib.Purchasing.LayoutPR.IsApprover();
                var isReviewer = Lib.Purchasing.LayoutPR.IsReviewer();
                var hasVisibilityOnCurrentBudget = Lib.Purchasing.PRLineItems.Budget.HasVisibilityOnCurrentBudget();
                var hasItemsTakenFromStock = false;
                var everythingTakenFromStock = true;
                if (!LayoutPR.FormTemplateManager) {
                    Controls.UploadQuote2__.Hide(!isRequesterStep);
                    Controls.AddFromCatalog2__.Hide(!isRequesterStep);
                }
                Controls.Reason__.SetReadOnly(!isRequesterStep);
                //sets line item contents to readOnly
                Controls.LineItems__.SetRowToolsHidden(!isRequesterStep);
                //sets line item visibility
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item /*, i: number*/) {
                    if (Lib.Purchasing.IsLineItemEmpty(item) || !Lib.P2P.Inventory.IsItemTakenFromStock(item)) {
                        everythingTakenFromStock = false;
                    }
                    else if (Lib.P2P.Inventory.IsItemTakenFromStock(item)) {
                        hasItemsTakenFromStock = true;
                    }
                });
                Sys.Helpers.TmpData.SetValue("EverythingTakenFromStock", everythingTakenFromStock);
                // ItemTaxCode__
                if (Sys.Parameters.GetInstance("PAC").GetParameter("DisplayTaxCode")) {
                    Controls.LineItems__.ItemTaxCode__.Hide(!isRequesterStep && !isBuyer && !isReviewer);
                }
                Controls.LineItems__.ItemTaxCode__.SetReadOnly(isReadOnly || (!isRequesterStep && !isBuyer && !isReviewer));
                // ItemGLAccount__
                Controls.LineItems__.ItemGLAccount__.Hide(!Sys.Parameters.GetInstance("PAC").GetParameter("DisplayGlAccount") || (!isReviewer && !hasVisibilityOnCurrentBudget));
                Controls.LineItems__.ItemGLAccount__.SetReadOnly(isReadOnly || (!isReviewer && (!isApprover || !hasVisibilityOnCurrentBudget)));
                // BudgetID__
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.BudgetID__.Hide(Lib.Budget.IsDisabled() || !isApprover || isReadOnly || !hasVisibilityOnCurrentBudget);
                }
                // ItemCostCenterName__
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.ItemCostCenterName__.Hide(!isRequesterStep && !isApprover && !isReviewer);
                }
                Controls.LineItems__.ItemCostCenterName__.SetReadOnly(!isRequesterStep && !isReviewer);
                // ProjectCode__
                if (!LayoutPR.FormTemplateManager) {
                    var hideProjectCode = Sys.Parameters.GetInstance("AP").GetParameter("CodingEnableProjectCode") !== "1" || (!isRequesterStep && !isApprover && !isReviewer);
                    Controls.LineItems__.ProjectCodeDescription__.Hide(hideProjectCode);
                }
                Controls.LineItems__.ProjectCodeDescription__.SetReadOnly(!isRequesterStep && !isReviewer);
                // ItemGroupDescription__
                // FT-012944: The Expense category field should be visible and writable for the budget owner (not mandatory)
                Controls.LineItems__.ItemGroupDescription__.Hide(!Sys.Parameters.GetInstance("PAC").GetParameter("DisplayExpenseCategory") || !hasVisibilityOnCurrentBudget);
                Controls.LineItems__.ItemGroupDescription__.SetReadOnly(isReadOnly || !isApprover || !hasVisibilityOnCurrentBudget);
                // CostType__
                var isCostTypeEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayCostType");
                var isCostTypeRequired = isCostTypeEnabled && isReviewer;
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.CostType__.Hide(!isCostTypeEnabled || (!hasVisibilityOnCurrentBudget && isApprover));
                }
                Controls.LineItems__.CostType__.SetRequired(isCostTypeRequired);
                Lib.Purchasing.CheckPR.SetRequiredItem("CostType__", isCostTypeRequired);
                Controls.LineItems__.CostType__.SetReadOnly(!isReviewer);
                // WBSElement
                var hideWBSElement = Sys.Parameters.GetInstance("AP").GetParameter("CodingEnableWBSElement") !== "1" || (!isRequesterStep && !isApprover && !isReviewer);
                Controls.LineItems__.WBSElement__.Hide(hideWBSElement);
                Controls.LineItems__.WBSElement__.SetReadOnly(!isRequesterStep && !isReviewer);
                // InternalOrder
                var hideInternalOrder = Sys.Parameters.GetInstance("AP").GetParameter("CodingEnableInternalOrder") !== "1" || (!isRequesterStep && !isApprover && !isReviewer);
                Controls.LineItems__.InternalOrder__.Hide(hideInternalOrder);
                Controls.LineItems__.InternalOrder__.SetReadOnly(!isRequesterStep && !isReviewer);
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.BuyerName__.Hide(isApprover && !isRequesterStep);
                    Controls.LineItems__.ItemBudgetCurrency__.Hide(Lib.Budget.IsDisabled() || !isApprover || isReadOnly || !hasVisibilityOnCurrentBudget);
                    Controls.LineItems__.ItemBudgetInitial__.Hide(Lib.Budget.IsDisabled() || !isApprover || isReadOnly || !hasVisibilityOnCurrentBudget);
                    Controls.LineItems__.ItemBudgetRemaining__.Hide(Lib.Budget.IsDisabled() || !isApprover || isReadOnly || !hasVisibilityOnCurrentBudget);
                }
                Controls.LineItems__.ItemCostCenterId__.SetReadOnly(!isRequesterStep && !isReviewer);
                Controls.LineItems__.ItemCurrency__.SetReadOnly(!isRequesterStep);
                Controls.LineItems__.ItemDescription__.SetReadOnly(!isRequesterStep);
                Controls.LineItems__.ItemNetAmount__.SetReadOnly(!isRequesterStep);
                Controls.LineItems__.ItemNumber__.SetReadOnly(!isRequesterStep);
                Controls.LineItems__.ItemPeriodCode__.Hide(Lib.Budget.IsDisabled() || !isApprover || isReadOnly || !hasVisibilityOnCurrentBudget);
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.ItemQuantity__.SetReadOnly(!isRequesterStep);
                }
                Controls.LineItems__.ItemType__.SetReadOnly(!isRequesterStep);
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.ItemUnit__.SetReadOnly(!isRequesterStep);
                }
                Controls.LineItems__.ItemUnitDescription__.SetReadOnly(!isRequesterStep);
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.ItemUnitPrice__.SetReadOnly(!isRequesterStep);
                }
                if (!LayoutPR.FormTemplateManager) {
                    var requestedDeliveryDateInReadOnly = Lib.Purchasing.RequestedDeliveryDate.IsReadOnly(GetCurrentLayout());
                    Controls.LineItems__.ItemRequestedDeliveryDate__.SetReadOnly(requestedDeliveryDateInReadOnly);
                    Controls.LineItems__.ItemStartDate__.SetReadOnly(!isRequesterStep);
                    Controls.LineItems__.ItemEndDate__.SetReadOnly(!isRequesterStep);
                }
                //sets _Vendor ReadOnly for advisors & approvers & order created
                var isVendorReadonly = !isRequesterStep && !isBuyer;
                var isSingleVendorMode = Lib.Purchasing.Vendor.IsSingleVendorMode();
                var isReplenishmentRequest = Lib.P2P.Inventory.IsReplenishmentRequest();
                Controls.LineItems__.VendorNumber__.SetReadOnly(isSingleVendorMode || isReadOnly || isVendorReadonly);
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.VendorName__.Hide(isSingleVendorMode || isVendorReadonly || everythingTakenFromStock);
                }
                Controls.LineItems__.VendorName__.SetReadOnly(isSingleVendorMode || isReadOnly || isVendorReadonly);
                Controls.LineItems__.WarehouseName__.Hide(isVendorReadonly || !hasItemsTakenFromStock || isReplenishmentRequest);
                Controls.LineItems__.SupplyTypeName__.SetReadOnly(!isRequesterStep);
                if (!LayoutPR.FormTemplateManager) {
                    Controls.LineItems__.RecipientName__.Hide(isApprover && !isRequesterStep);
                }
                if (Lib.Purchasing.IsMultiShipTo()) {
                    var approverStep = IsApproverStep();
                    var shipToCompanyInAddressBlock = Lib.Purchasing.ShipTo.IsShipToCompanyInAddressBlock();
                    Controls.LineItems__.ItemShipToAddress__.Hide(approverStep);
                    Controls.LineItems__.ItemShipToCompany__.Hide(shipToCompanyInAddressBlock || approverStep);
                }
                if (!Controls.Line_items.IsVisible()) {
                    Controls.Line_items.Hide(false);
                }
                UpdateLineItemsFilter();
            }
            LayoutPR.UpdateLineItemsPane = UpdateLineItemsPane;
            function InitGeneralInformationPane() {
                if (!Controls.ExchangeRate__.GetValue()) {
                    Controls.ExchangeRate__.SetValue(1);
                }
            }
            LayoutPR.InitGeneralInformationPane = InitGeneralInformationPane;
            function UpdateGeneralInformationPane() {
                var isRequesterStep = IsRequesterStep();
                var status = Controls.RequisitionStatus__.GetValue();
                var upStatus = status.toUpperCase();
                Controls.RequisitionNumber__.Hide(!Controls.RequisitionNumber__.GetValue());
                //sets total visibility
                Controls.Currency__.SetReadOnly(!isRequesterStep || Lib.Purchasing.HasPunchoutItems());
                // Shows the workflow initiator when the request has been submitted
                Controls.RequesterName__.Hide(isRequesterStep || upStatus === "TO COMPLETE");
                //sets requisition information to ReadOnly
                Controls.CompanyCode__.Hide(!Controls.CompanyCode__.GetError() && ((!isRequesterStep && (upStatus === "TO COMPLETE" || Controls.CompanyCode__.GetValue() === Lib.P2P.UserProperties.GetValues(User.loginId).CompanyCode__)) || (isRequesterStep && !IsReadOnly() && Lib.P2P.UserProperties.GetValues(User.loginId).GetAllowedCompanyCodes().indexOf("\n") < 0)));
                // When PR has been already submitted, the PRSubmissionDatetime variable is set.
                Controls.CompanyCode__.SetReadOnly(IsReadOnly() || !!Variable.GetValueAsString("PRSubmissionDatetime"));
            }
            LayoutPR.UpdateGeneralInformationPane = UpdateGeneralInformationPane;
            function InitSingleVendorModeLayout() {
                if (!LayoutPR.FormTemplateManager) {
                    var isSingleVendorMode = Lib.Purchasing.Vendor.IsSingleVendorMode();
                    Controls.Vendor_panel.Hide(!isSingleVendorMode);
                    if (isSingleVendorMode) {
                        return Lib.Purchasing.Punchout.PR.WaitForLoadingPane().Then(function () {
                            UpdatePunchoutButtonsLayoutForSingleVendorMode();
                        });
                    }
                }
                return Sys.Helpers.Promise.Resolve();
            }
            LayoutPR.InitSingleVendorModeLayout = InitSingleVendorModeLayout;
            function UpdatePunchoutButtonsLayoutForSingleVendorMode() {
                var punchoutConfigs = Lib.Purchasing.Punchout.GetConfigs();
                if (punchoutConfigs) {
                    var vendorNumber_1 = Lib.Purchasing.Vendor.GetSingleVendorNumber();
                    Lib.Purchasing.Punchout.PR.ForEachPunchoutButton(function (button, idx) {
                        if (idx <= punchoutConfigs.length) {
                            var buttonConfig = punchoutConfigs[idx - 1];
                            if (buttonConfig.SupplierID__ !== vendorNumber_1) {
                                button.Hide(true);
                            }
                        }
                        else {
                            button.Hide(true);
                        }
                    });
                }
            }
            LayoutPR.topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
            function InitTopPaneWarning() {
                var promisesToWait = [];
                Controls.TopPaneWarning.Hide(true);
                promisesToWait.push(Lib.P2P.DisplayArchiveDurationWarning("PAC", function () { return Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(LayoutPR.topMessageWarning); }));
                // When status == To order, if Admin is in the buyers list => do not warn
                var status = Controls.RequisitionStatus__.GetValue();
                var adminWarningDisplayCondition = (status !== "To receive") &&
                    !(status === "To order" && Lib.Purchasing.LayoutPR.IsBuyer());
                promisesToWait.push(Lib.P2P.DisplayAdminWarning("PAC", function (displayName) {
                    LayoutPR.topMessageWarning.Add(Language.Translate("_View as admin on bealf of {0}", false, displayName));
                }, adminWarningDisplayCondition));
                promisesToWait.push(Lib.P2P.DisplayBackupUserWarning("PAC", function (displayName) {
                    LayoutPR.topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName));
                }, function () {
                    var currentContributor = GetCurrentContributor();
                    if ((Data.GetValue("State") == 70 || Data.GetValue("State") == 90) && currentContributor && User.loginId !== currentContributor.loginId && User.IsBackupUserOf(currentContributor.login)) {
                        return currentContributor.login;
                    }
                    return null;
                }));
                if (IsAdvisor()) {
                    LayoutPR.topMessageWarning.Add(Language.Translate("_You are viewing this purchase requisition as an advisor"));
                }
                return Sys.Helpers.Promise.All(promisesToWait);
            }
            LayoutPR.InitTopPaneWarning = InitTopPaneWarning;
            function UpdateCompanyCodeBasedlayout() {
                var companyCurrency = Variable.GetValueAsString("companyCurrency");
                function $UpdateCompanyCodeBasedlayout() {
                    var budgetCurrency = companyCurrency;
                    Controls.TotalNetLocalCurrency__.SetLabel(budgetCurrency ? Language.Translate("_TotalNetLocalCurrency") + " (" + budgetCurrency + ")" : Language.Translate("_TotalNetLocalCurrency"));
                    var table = Data.GetTable("LineItems__");
                    var count = table.GetItemCount(), i, row, net;
                    var isMonoCurrency = true, hasForeignCurrency = false;
                    var previousCurrency;
                    for (i = 0; i < count; i++) {
                        row = table.GetItem(i);
                        if (!Lib.Purchasing.IsLineItemEmpty(row)) {
                            var itemCurrency = row.GetValue("ItemCurrency__");
                            net = row.GetValue("ItemNetAmount__");
                            if (!Sys.Helpers.IsEmpty(net)) {
                                row.SetValue("ItemBudgetCurrency__", budgetCurrency);
                            }
                            else {
                                row.SetValue("ItemBudgetCurrency__", null);
                            }
                            if (!hasForeignCurrency && itemCurrency != companyCurrency) {
                                hasForeignCurrency = true;
                            }
                            isMonoCurrency = (i == 0) || (isMonoCurrency && (previousCurrency == itemCurrency));
                            previousCurrency = itemCurrency;
                        }
                    }
                    // Shows foreign currency if needed
                    Controls.TotalNetAmount__.Hide(!isMonoCurrency || !hasForeignCurrency);
                    if (isMonoCurrency && hasForeignCurrency) {
                        Controls.TotalNetAmount__.SetLabel(Language.Translate("_Total net amount", false, previousCurrency));
                        Data.SetValue("Currency__", previousCurrency);
                    }
                    else {
                        Controls.TotalNetAmount__.SetLabel(Language.Translate("_Total net amount", false, budgetCurrency));
                        Data.SetValue("Currency__", budgetCurrency);
                    }
                }
                if (Sys.Helpers.IsEmpty(companyCurrency)) {
                    return Lib.P2P.CompanyCodesValue.QueryValues(Controls.CompanyCode__.GetValue()).Then(function (CCValues) {
                        if (Object.keys(CCValues).length > 0) {
                            companyCurrency = CCValues.Currency__;
                            $UpdateCompanyCodeBasedlayout();
                        }
                    });
                }
                else {
                    $UpdateCompanyCodeBasedlayout();
                    return Sys.Helpers.Promise.Resolve();
                }
            }
            LayoutPR.UpdateCompanyCodeBasedlayout = UpdateCompanyCodeBasedlayout;
            function GetCurrentContributor() {
                return workflow.GetNbContributors() > 0 && workflow.GetContributorAt(workflow.GetContributorIndex());
            }
            LayoutPR.GetCurrentContributor = GetCurrentContributor;
            function UpdateButtonBar() {
                Log.Info("UpdateButtonBar");
                var isRequester = Lib.Purchasing.LayoutPR.IsRequester();
                var isCurrentContributor = Lib.Purchasing.LayoutPR.IsCurrentContributor();
                var CurrentContributor = Lib.Purchasing.LayoutPR.GetCurrentContributor();
                var isOwnerOrBackupOrAdmin = IsOwnerOrBackupOrAdmin();
                Controls.Save.Hide(true);
                var isAdmin = Lib.P2P.IsAdminNotOwner();
                var lineItems = Data.GetTable("LineItems__");
                Controls.CreatePO.Hide(true);
                Controls.BackToAP.Hide(true);
                Controls.Reject.Hide(true);
                Controls.Request_for_information.Hide(true);
                Controls.Comment_Answer.Hide(true);
                Controls.Cancel_remaining_items.Hide(true);
                Controls.ModifyPR.Hide(!isRequester || ProcessInstance.isReadOnly);
                Controls.Cancel_purchase_requisition.Hide(!isRequester || ProcessInstance.isReadOnly);
                // Hides test buttons in normal mode
                Controls.Generate_P_O_.Hide(true);
                Controls.SynchronizeItems.Hide(LayoutPR.hideSynchronizeItemsButton);
                Controls.UpdateExchangeRate.Hide(hideUpdateExchangeRateButton);
                var requisitionStatus = Controls.RequisitionStatus__.GetValue();
                // "To complete" = "Draft"
                if (requisitionStatus === "To complete" && (isRequester || isOwnerOrBackupOrAdmin)) {
                    Controls.ModifyPR.Hide(true);
                    Controls.Cancel_purchase_requisition.Hide(true);
                    Controls.Request_for_information.Hide(Lib.P2P.IsAdminNotOwner());
                    if (ProcessInstance.state) {
                        Controls.Cancel_purchase_requisition.Hide(false);
                        Controls.Cancel_purchase_requisition.SetLabel("_Cancel purchase requisition");
                    }
                }
                Controls.LineItems__.SupplyTypeName__.SetFilter("(|(CompanyCode__=%[CompanyCode__])(CompanyCode__=)(CompanyCode__!=*))");
                var toOrder = Lib.Purchasing.PRStatus.ForPOWorkflow.indexOf(requisitionStatus) !== -1; // or partially ordered
                var totallyOrdered = Lib.Purchasing.PRStatus.ForDelivery.indexOf(requisitionStatus) !== -1;
                var hideClonePR = Lib.Purchasing.HasPunchoutItems() || (!isRequester && !Lib.Purchasing.LayoutPR.IsBuyer());
                if (Lib.Purchasing.LayoutPR.IsAdvisor()) {
                    Controls.Submit_.Hide(true);
                    Controls.Save_.Hide(true);
                    Controls.Comment_Answer.Hide(false);
                    Controls.ClonePR.Hide(hideClonePR);
                    return;
                }
                if (requisitionStatus === "To review") {
                    if (CurrentContributor && (isCurrentContributor || isOwnerOrBackupOrAdmin) && CurrentContributor.role === Lib.Purchasing.roleReviewer) {
                        Process.SetHelpId(5034);
                        Controls.BackToAP.Hide(false);
                        Controls.Request_for_information.Hide(isAdmin);
                        if (!Lib.Purchasing.WorkflowPR.HasAdditionalContributors()) {
                            Controls.Submit_.SetLabel("_Submit reviewed purchase requisition");
                        }
                        else {
                            Controls.Submit_.SetLabel("_Submit reviewed purchase requisition and forward");
                        }
                    }
                }
                else if (requisitionStatus === "To approve") {
                    if (CurrentContributor && (isCurrentContributor || isOwnerOrBackupOrAdmin) && CurrentContributor.role === Lib.Purchasing.roleApprover) {
                        Process.SetHelpId(5033);
                        Controls.Request_for_information.Hide(isAdmin);
                        Controls.BackToAP.Hide(false);
                        Controls.Reject.Hide(false);
                        if (!Lib.Purchasing.WorkflowPR.HasAdditionalContributors()) {
                            Controls.Submit_.SetLabel("_Approve");
                        }
                        else {
                            Controls.Submit_.SetLabel("_Approve & Forward");
                        }
                    }
                }
                else if (toOrder) {
                    Controls.Submit_.Hide(true);
                    Controls.ModifyPR.Hide(true);
                    Controls.ModifyPR.SetDisabled(true);
                    Controls.Cancel_purchase_requisition.Hide(true);
                    Controls.Cancel_purchase_requisition.SetDisabled(true);
                    if (!Variable.GetValueAsString("AutoCreateOrderEnabled") && (isCurrentContributor || isOwnerOrBackupOrAdmin)) {
                        // When the current user verifies "isBuyer", we display all buttons according to the items and its status.
                        // /!\ Be ceraful ! The variable 'isCurrentContributor' includes the administrator. It's why we need to the
                        // "isBuyer" condition.
                        // In the other cases "admin", "owner" and "backupOfOwner", we disallow the ordering action of the remaining
                        // items. We just display the buttons that can unlock the document (always according items and its status).
                        // Note. In this case, the cancellation of remaining items cancels all the items.
                        // We hide "BackToAP" and "Reject" buttons if we have any lines ordered or canceled.
                        var count = lineItems.GetItemCount();
                        var isBuyer = Lib.Purchasing.LayoutPR.IsBuyer();
                        if (isBuyer) {
                            var myRemainingItemsToOrder = false;
                            for (var i = 0; i < count; i++) {
                                var item = lineItems.GetItem(i);
                                if (Lib.P2P.CurrentUserMatchesLogin(item.GetValue("BuyerLogin__")) &&
                                    item.GetValue("ItemStatus__") === "To order") {
                                    if (Sys.Parameters.GetInstance("PAC").GetParameter("AllowSplitPRIntoMultiplePO", false)) {
                                        myRemainingItemsToOrder = true;
                                        break;
                                    }
                                    else {
                                        if (item.GetValue("ItemOrderedQuantity__") == 0) {
                                            myRemainingItemsToOrder = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (myRemainingItemsToOrder) {
                                Controls.Cancel_remaining_items.Hide(false);
                                Controls.CreatePO.Hide(false);
                            }
                        }
                        else {
                            Controls.Cancel_remaining_items.Hide(false);
                        }
                        var nothingOrderedOrCanceled = true;
                        for (var i = 0; i < count; i++) {
                            var item = lineItems.GetItem(i);
                            if (item.GetValue("ItemOrderedQuantity__") > 0 || item.GetValue("ItemStatus__") === "Canceled") {
                                nothingOrderedOrCanceled = false;
                                break;
                            }
                        }
                        if (nothingOrderedOrCanceled) {
                            Controls.BackToAP.SetDisabled(false);
                            Controls.Reject.SetDisabled(false);
                            Controls.BackToAP.Hide(false);
                            Controls.Reject.Hide(false);
                        }
                    }
                }
                else if (["To receive", "Received", "Canceled", "Rejected"].indexOf(requisitionStatus) === -1) {
                    hideClonePR = true;
                }
                else {
                    Controls.ModifyPR.Hide(true);
                    Controls.Cancel_purchase_requisition.Hide(true);
                }
                Controls.ClonePR.Hide(hideClonePR);
                if (Lib.Purchasing.LayoutPR.IsReadOnly() || totallyOrdered || isAdmin) {
                    Controls.Submit_.Hide(true);
                    Controls.Save_.Hide(true);
                }
            }
            LayoutPR.UpdateButtonBar = UpdateButtonBar;
            LayoutPR.GlobalLayout = {
                isHidden: null,
                isReady: false,
                readyPromises: [],
                panes: ["TopPaneWarning", "Banner", "Requisition_information", "Line_items", "PunchoutButtons", "DocumentsPanel", "ApprovalWorkflow", "Ship_to"].map(function (name) {
                    return Controls[name];
                }),
                actionButtons: ["Save", "Save_", "Close", "Reject", "BackToAP", "Request_for_information", "Cancel_purchase_requisition", "Submit_", "Comment_Answer", "Generate_P_O_", "SynchronizeItems", "CreatePO", "Cancel_remaining_items", "ClonePR", "ModifyPR", "UpdateExchangeRate"].map(function (name) {
                    return Controls[name];
                }),
                waitScreenDisplayed: false,
                HideWaitScreen: function (hide) {
                    this.waitScreenDisplayed = !hide;
                    // async call just after boot
                    setTimeout(function () {
                        //The wait function freeze the entire process so only one is neccessary cf Controls.wait() documentation
                        Controls.TotalNetAmount__.Wait(!hide);
                    });
                },
                HideDocument: function (hide) {
                    if (hide === true && (this.isHidden === null || this.isHidden === false)) {
                        Log.Info("Document hidden");
                        // Workaround boot/customscript race condition to display and hide panels
                        Controls.PreviewPanel.Hide(false);
                        Controls.form_content_right.Hide(false);
                        // End of workaround
                        ProcessInstance.SetFormWidth("default");
                        Controls.PreviewPanel.Hide(true);
                        Controls.form_content_right.Hide(true);
                        this.isHidden = true;
                    }
                    else if (hide === false && (this.isHidden === null || this.isHidden === true)) {
                        Log.Info("Document shown");
                        // Workaround boot/customscript race condition to display and hide panels
                        Controls.PreviewPanel.Hide(true);
                        Controls.form_content_right.Hide(true);
                        // End of workaround
                        ProcessInstance.SetFormWidth();
                        // Controls.form_content_right.Hide(false); // to be called when workaround no more needed
                        // Workaround boot/customscript race condition to display and hide panels
                        setTimeout(function () {
                            Controls.PreviewPanel.Hide(false);
                            Controls.form_content_right.Hide(false);
                            Controls.form_content_right.SetSize(45);
                        }, 1000);
                        // End of workaround
                        this.isHidden = false;
                    }
                },
                Update: function () {
                    var requisitionStatus = Controls.RequisitionStatus__.GetValue();
                    var isAdmin = Lib.P2P.IsAdminNotOwner();
                    var isCurrentContributor = Lib.Purchasing.LayoutPR.IsCurrentContributor();
                    if ((!isCurrentContributor || isAdmin) && (requisitionStatus === "To review" || requisitionStatus === "To approve" || requisitionStatus === "To complete")) {
                        Controls.DocumentsPanel.SetReadOnly(true);
                    }
                    // Show/Hide preview if document present
                    if (Controls.DocumentsPanel.IsDocumentLoaded()) {
                        Log.Info("Form has a document");
                        LayoutPR.GlobalLayout.HideDocument(false);
                    }
                    else {
                        Log.Info("Form has NO document");
                        LayoutPR.GlobalLayout.HideDocument(true);
                    }
                },
                Hide: function (hide) {
                    Log.Time("LayoutPR.GlobalLayout.Hide");
                    LayoutPR.GlobalLayout.panes.forEach(function (pane) {
                        pane.Hide(hide);
                    });
                    LayoutPR.GlobalLayout.actionButtons.forEach(function (button) {
                        button.Hide(hide);
                    });
                    LayoutPR.GlobalLayout.HideWaitScreen(!hide);
                    Log.TimeEnd("LayoutPR.GlobalLayout.Hide");
                },
                IsReady: function () {
                    var _this = this;
                    return Sys.Helpers.Promise.Create(function (resolve) {
                        if (!_this.isReady) {
                            _this.readyPromises.push(resolve);
                        }
                        else {
                            resolve();
                        }
                    });
                },
                Ready: function () {
                    this.isReady = true;
                    while (this.readyPromises.length) {
                        this.readyPromises.pop()();
                    }
                }
            };
            function DelayedUpdateLayout() {
                var promisesToWait = [];
                Log.Info("LayoutPR.UpdateLayout");
                Log.Time("LayoutPR.UpdateLayout");
                Lib.Purchasing.ShipTo.UpdateLayout(!IsRequesterStep() || Lib.P2P.Inventory.IsReplenishmentRequest());
                promisesToWait.push(UpdateCompanyCodeBasedlayout());
                LayoutPR.GlobalLayout.Update();
                UpdateGeneralInformationPane();
                UpdateLineItemsPane();
                promisesToWait.push(Lib.Purchasing.PRLineItems.UpdateLayout());
                Lib.Purchasing.WorkflowPR.UpdateWorkflowPanel();
                UpdateButtonBar();
                promisesToWait.push(Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.OnUpdateLayout"));
                return Sys.Helpers.Promise.All(promisesToWait)
                    .Finally(function () { return Log.TimeEnd("LayoutPR.UpdateLayout"); });
            }
            var updateLayoutPromise = null;
            function UpdateLayout() {
                updateLayoutPromise = updateLayoutPromise || LayoutPR.GlobalLayout.IsReady()
                    .Then(function () {
                    updateLayoutPromise = null;
                    return DelayedUpdateLayout();
                });
                if (LayoutPR.GlobalLayout.isReady) {
                    return updateLayoutPromise;
                }
                return Sys.Helpers.Promise.Resolve();
            }
            LayoutPR.UpdateLayout = UpdateLayout;
        })(LayoutPR = Purchasing.LayoutPR || (Purchasing.LayoutPR = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
