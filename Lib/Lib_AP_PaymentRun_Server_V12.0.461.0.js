///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_PaymentRun_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library extending PaymentRun server side scripts",
  "require": [
    "Sys/Sys",
    "Sys/Sys_Parameters",
    "Sys/Sys_Helpers_CSVReader",
    "Sys/Sys_Helpers_Date",
    "Lib_AP_PaymentRunProvider_Manager_V12.0.461.0",
    "[Lib_Custom_Parameters]",
    "[Lib_P2P_Custom_Parameters]",
    "Lib_CallScheduledAction_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var PaymentRun;
        (function (PaymentRun) {
            function LineItemIndexing() {
                if (!Variable.GetValueAsString("InternalDataTablesToIndex")) {
                    var workflowTable = Data.GetTable("Workflow__");
                    var groupedLineItemTable = Data.GetTable("GroupedLineItems__");
                    var groupedTableUId = groupedLineItemTable ? groupedLineItemTable.GetLocalUniqueId() : null;
                    var workflowTableUId = workflowTable ? workflowTable.GetLocalUniqueId() : null;
                    var indexes = [];
                    if (groupedTableUId) {
                        indexes.push("GroupedLineItems__," + groupedTableUId);
                    }
                    if (workflowTableUId) {
                        indexes.push("Workflow__," + workflowTableUId);
                    }
                    if (indexes.length > 0) {
                        Log.Info("Indexing line items in ES");
                        Variable.SetValueAsString("InternalDataTablesToIndex", indexes.join(";"));
                    }
                }
            }
            PaymentRun.LineItemIndexing = LineItemIndexing;
            /**
             * Wrapper around @see Process.UpdateProcessInstanceDataAsync with logging and static typing
             */
            function UpdateInvoice(ruidEx, fieldsToUpdate) {
                var error = !Process.UpdateProcessInstanceDataAsync(ruidEx, JSON.stringify(fieldsToUpdate));
                if (error) {
                    Log.Error("Failed to update '".concat(ruidEx, "' with ").concat(JSON.stringify(fieldsToUpdate)));
                }
                else {
                    Log.Info("Updated '".concat(ruidEx, "' with ").concat(JSON.stringify(fieldsToUpdate)));
                }
            }
            PaymentRun.UpdateInvoice = UpdateInvoice;
            /**
             * Update the invoices depending on if they are rejected or not.
             * If you want to update invoices that correspond to a list of line items, @see Lib.AP.PaymentRun.UpdateListOfInvoices
             * Both call @see Lib.AP.PaymentRun.UpdateInvoice under the hood
             * @param fieldsToUpdate An object with a property "fields". For the expected shape, @see Process.UpdateProcessInstanceDataAsync
             * @param updateNonRejected If this is set to true, the function will update the invoices that don't have their "Rejected__" field set to truthy
             * @param updateRejected If this is set to true, the function will update the invoices that have their "Rejected__" field set to truthy
             * @param isCustomerInvoice If true, will search for the PortalRuidEx matching the RuidEx, and use that to update customer invoices instead of the vendor invoices
             * @example
             * <pre><code>
             * const fieldsToUpdate = { fields: { InvoiceStatus__: Lib.AP.InvoiceStatus.Paid } };
             * Lib.AP.PaymentRun.UpdateInvoices(fieldsToUpdate, true, false);
             * </code></pre>
             */
            // tslint:disable-next-line:typedef Bug of TSLint that will never be fixed https://github.com/palantir/tslint/issues/2194
            function UpdateInvoices(fieldsToUpdate, updateNonRejected, updateRejected, isCustomerInvoice) {
                if (isCustomerInvoice === void 0) { isCustomerInvoice = false; }
                var lineItemsTable = Data.GetTable("LineItems__");
                for (var i = 0; i < lineItemsTable.GetItemCount(); ++i) {
                    var item = lineItemsTable.GetItem(i);
                    var rejected = item && item.GetValue("Rejected__");
                    if ((rejected && updateRejected) || (!rejected && updateNonRejected)) {
                        var sourceRuidEx = isCustomerInvoice ? "PortalRuidEx__" : "RuidEx__";
                        var ruidEx = item && item.GetValue(sourceRuidEx);
                        if (ruidEx) {
                            UpdateInvoice(ruidEx, fieldsToUpdate);
                        }
                        var fields = fieldsToUpdate.fields;
                        var portalRuidEx = item.GetValue("PortalRuidEx__");
                        if (fields.InvoiceStatus__ === Lib.AP.InvoiceStatus.InPaymentProposal && portalRuidEx) {
                            UpdateCIState(portalRuidEx);
                        }
                    }
                }
            }
            PaymentRun.UpdateInvoices = UpdateInvoices;
            function UpdateCIState(portalRuidEx) {
                if (!portalRuidEx) {
                    Log.Error("UpdateCIState: no PortalRuidEx__ field set");
                }
                var scheduledAction = {
                    msnEx: portalRuidEx,
                    actionName: "invoicependingpayment",
                    parameters: {
                        invoiceStatus: Lib.AP.InvoiceStatus.InPaymentProposal
                    },
                    reopened: false,
                    tries: 1
                };
                var processQuery = Process.CreateQueryAsProcessAdmin();
                processQuery.Reset();
                processQuery.SetSearchInArchive(true);
                processQuery.SetSpecificTable("CDNAME#Customer invoice");
                processQuery.SetFilter("RuidEx=" + scheduledAction.msnEx);
                if (processQuery.MoveFirst()) {
                    var trn = processQuery.MoveNext();
                    if (trn) {
                        var isSuccess = true;
                        var vars = trn.GetUninheritedVars();
                        if (vars.GetValue_Long("State", 0) === 70) {
                            // Call action
                            isSuccess = Lib.CallScheduledAction.executeAction(vars, scheduledAction, trn, true);
                        }
                        return isSuccess;
                    }
                    Log.Error("The CI with identifier ".concat(scheduledAction.msnEx, " was not found"));
                    return false;
                }
                Log.Error("The record with identifier ".concat(scheduledAction.msnEx, " was not found"));
                return false;
            }
        })(PaymentRun = AP.PaymentRun || (AP.PaymentRun = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
