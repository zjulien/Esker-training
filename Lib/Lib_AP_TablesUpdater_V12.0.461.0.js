///#GLOBALS DatabaseHelpers Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_TablesUpdater_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: helpers for updating AP tables.",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_WorkflowCtrl_V12.0.461.0",
    "Sys/Sys_Helpers_Database",
    "Sys/Sys_Helpers_CDL"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var TablesUpdater;
        (function (TablesUpdater) {
            /**
             * Perform the update of Items and Headers table
             * @memberof Lib.AP.TablesUpdater
             * @param {boolean} bRevert a flag to indicate if data is added or subtracted to the tables
             * @param {boolean} shouldUpdateVendor a flag to indicate if the vendor needs to be updated
             * @param {string} msnex  msnex of the reversed invoice, to retrieve the LineItems table
             */
            function Update(bRevert, shouldUpdateVendor, msnex) {
                var headers = [];
                var lineItems = Data.GetTable("LineItems__");
                var companyCode = Data.GetValue("CompanyCode__");
                var lineItemsInvoice;
                var baseGRFilter = "";
                var basePOFilter = "";
                var sign = bRevert ? -1 : 1;
                // If msnex exists, we get the LineItems table from the invoice
                if (msnex) {
                    companyCode = Variable.GetValueAsString("CompanyCode");
                    var parameters = {
                        processName: "Vendor invoice",
                        tableName: "LineItems__",
                        sourceMSNEXs: [msnex],
                        fields: ["LineNum", "Line_OrderNumber__", "Line_LineType__", "Line_Amount__", "Line_Quantity__", "Line_ItemNumber__", "Line_GoodsReceipt__"]
                    };
                    lineItemsInvoice = Sys.Helpers.CDL.getCDLRecords(parameters);
                }
                function addToHeaders(orderNumber, invoicedAmount) {
                    for (var i = 0; i < headers.length; i++) {
                        if (headers[i].orderNumber === orderNumber) {
                            headers[i].fieldsToUpdate[0].value += invoicedAmount;
                            return;
                        }
                    }
                    var headerInfos = {
                        orderNumber: orderNumber,
                        fieldsToUpdate: [
                            { name: "InvoicedAmount__", value: invoicedAmount, behavior: "incrementNumber" }
                        ]
                    };
                    if (shouldUpdateVendor) {
                        headerInfos.fieldsToUpdate.push({ name: "VendorNumber__", value: Data.GetValue("VendorNumber__") });
                    }
                    headers[headers.length] = headerInfos;
                }
                function updateGRItemTable(orderNumber, GRNumber, itemNumber, amount, quantity) {
                    var addOrModifyFilter = baseGRFilter + "(OrderNumber__=" + orderNumber + ")(GRNumber__=" + GRNumber + ")(LineNumber__=" + itemNumber + ")";
                    var itemFieldsToUpdate = [{ name: "InvoicedAmount__", value: amount, behavior: "incrementNumber" },
                        { name: "InvoicedQuantity__", value: quantity, behavior: "incrementNumber" }];
                    Sys.Helpers.Database.AddOrModifyTableRecord("P2P - Goods receipt - Items__", addOrModifyFilter, itemFieldsToUpdate);
                }
                function updatePOItemTable(orderNumber, itemNumber, amount, quantity) {
                    var addOrModifyFilter = basePOFilter + "(OrderNumber__=" + orderNumber + ")(ItemNumber__=" + itemNumber + ")";
                    var itemFieldsToUpdate = [
                        { name: "InvoicedAmount__", value: amount, behavior: "incrementNumber" },
                        { name: "InvoicedQuantity__", value: quantity, behavior: "incrementNumber" }
                    ];
                    if (shouldUpdateVendor) {
                        itemFieldsToUpdate.push({ name: "VendorNumber__", value: Data.GetValue("VendorNumber__") });
                    }
                    Sys.Helpers.Database.AddOrModifyTableRecord("AP - Purchase order - Items__", addOrModifyFilter, itemFieldsToUpdate);
                    addToHeaders(orderNumber, amount);
                }
                function updateItemsTables() {
                    if (lineItems) {
                        for (var i = 0; i < lineItems.GetItemCount(); i++) {
                            var lineItem = lineItems.GetItem(i);
                            var orderNumber = lineItem.GetValue("OrderNumber__");
                            var lineType = lineItem.GetValue("LineType__");
                            if (orderNumber !== "" && lineType !== Lib.P2P.LineType.GL) {
                                var amount = lineItem.GetValue("Amount__") * sign;
                                var quantity = lineItem.GetValue("Quantity__") * sign;
                                var itemNumber = lineItem.GetValue("ItemNumber__");
                                var isGRIV = !lineItem.IsNullOrEmpty("GoodsReceipt__");
                                if (isGRIV) {
                                    var GRNumber = lineItem.GetValue("GoodsReceipt__");
                                    updateGRItemTable(orderNumber, GRNumber, itemNumber, amount, quantity);
                                }
                                updatePOItemTable(orderNumber, itemNumber, amount, quantity);
                            }
                        }
                    }
                    else {
                        for (var i = 0; i < lineItemsInvoice[msnex].length; i++) {
                            var lineItem = lineItemsInvoice[msnex][i];
                            var orderNumber = lineItem.Line_OrderNumber__;
                            var lineType = lineItem.Line_LineType__;
                            if (orderNumber !== "" && lineType !== Lib.P2P.LineType.GL) {
                                var amount = lineItem.Line_Amount__ * sign;
                                var quantity = lineItem.Line_Quantity__ * sign;
                                var itemNumber = lineItem.Line_ItemNumber__;
                                var isGRIV = Boolean(lineItem.Line_GoodsReceipt__);
                                if (isGRIV) {
                                    var GRNumber = lineItem.Line_GoodsReceipt__;
                                    updateGRItemTable(orderNumber, GRNumber, itemNumber, amount, quantity);
                                }
                                updatePOItemTable(orderNumber, itemNumber, amount, quantity);
                            }
                        }
                    }
                }
                function updatePOHeadersTable() {
                    for (var i = 0; i < headers.length; i++) {
                        var addOrModifyFilter = basePOFilter + "(OrderNumber__=" + headers[i].orderNumber + ")";
                        Sys.Helpers.Database.AddOrModifyTableRecord("AP - Purchase order - Headers__", addOrModifyFilter, headers[i].fieldsToUpdate);
                    }
                }
                function updatePOFormsForInvoicePost() {
                    var queryPOForms = {
                        table: "CDNAME#Purchase order V2",
                        attributes: ["RuidEx"],
                        filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterIn("OrderNumber__", headers.map(function (header) { return header.orderNumber; })))
                    };
                    return Sys.GenericAPI.PromisedQuery(queryPOForms).Then(function (queryPOFormsResult) {
                        queryPOFormsResult.forEach(function (POForm) { return Process.GetUpdatableTransportAsProcessAdmin(POForm.RuidEx).ResumeWithActionAsync("OnInvoicePost"); });
                    });
                }
                if (lineItems || lineItemsInvoice) {
                    baseGRFilter = "&(CompanyCode__=" + companyCode + ")";
                    basePOFilter = baseGRFilter;
                    updateItemsTables();
                    updatePOHeadersTable();
                    updatePOFormsForInvoicePost();
                }
            }
            TablesUpdater.Update = Update;
            /**
             * Perform the update of data tables based on the Payment Approval Mode
             * @memberof Lib.AP.TablesUpdater
             * @param {boolean} workflowFinished a flag to indicate if the approval workflow is finished
             * @param {boolean} xmlExportDone a flag to indicate if the invoice was posted
             * @param {string} currentRole the currentRole in the approval workflow
             */
            function UpdateIfNeeded(workflowFinished, xmlExportDone, currentRole) {
                if (Lib.AP.InvoiceType.isPOInvoice()) {
                    var update = false;
                    if ((currentRole === Lib.AP.WorkflowCtrl.roles.apStart && Lib.AP.WorkflowCtrl.GetNbRemainingControllers()) === 0 || workflowFinished) {
                        update = !Data.GetValue("ERPPostingDate__") || xmlExportDone;
                    }
                    if (update) {
                        Lib.AP.TablesUpdater.Update();
                    }
                }
            }
            TablesUpdater.UpdateIfNeeded = UpdateIfNeeded;
        })(TablesUpdater = AP.TablesUpdater || (AP.TablesUpdater = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
