///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_WorkflowDefinition",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Workflow Definition for AP Application",
  "require": [
    "Sys/Sys_P2P_WorkflowDefinition",
    "Sys/Sys_AP_WorkflowDefinition",
    "Lib_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var WorkflowDefinition;
        (function (WorkflowDefinition) {
            var definition = {
                "fields": {
                    // FT-022747 - Support for parallel workflow for invoice approval
                    // Extend WorkflowType__ to allow parallel workflow for paymentApproval and invoiceReview
                    "WorkflowType__": {
                        "values": {
                            "paymentApproval": {
                                "allowParallel": true
                            },
                            "invoiceReview": {
                                "allowParallel": true
                            }
                        }
                    },
                    "InvoiceType__": {
                        "type": "string",
                        "filter": [{ "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\""] }],
                        "values": {
                            "Non-PO Invoice": {
                                "niceName": {
                                    "languageKey": "Non-PO Invoice"
                                }
                            },
                            "PO Invoice": {
                                "niceName": {
                                    "languageKey": "PO Invoice"
                                }
                            },
                            "PO Invoice (as FI)": {
                                "niceName": {
                                    "languageKey": "PO Invoice (as FI)"
                                }
                            }
                        }
                    },
                    "PricePercentageVariance__": {
                        "type": "decimal",
                        "filter": [{ "field": "GroupByDimension__", "operator": "===", "value": ["null", "\"\""] }, { "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\""] }],
                        "hiddenInTester": true,
                        "computedValue": function (settings) {
                            var pricePercentageVariance = 0;
                            var invoiceLineAmount = settings.GetField("Amount__").value;
                            var expectedLineAmount = settings.GetField("ExpectedAmount__").value;
                            if (expectedLineAmount) {
                                pricePercentageVariance = (invoiceLineAmount / expectedLineAmount * 100) - 100;
                            }
                            return pricePercentageVariance;
                        },
                        "niceName": {
                            "languageKey": "PricePercentageVariance__"
                        }
                    },
                    "ManualLink__": {
                        "type": "boolean",
                        "filter": [{ "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\""] }]
                    },
                    "SubsequentDocument__": {
                        "type": "boolean",
                        "filter": [{ "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\""] }],
                        "allowManualEdit": true,
                        "hiddenInEditor": false,
                        "mandatory": false,
                        "niceName": {
                            "languageKey": "SubsequentDocument__"
                        }
                    },
                    "UnplannedDeliveryCosts__": {
                        "type": "decimal",
                        "filter": [{ "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\""] }],
                        "allowManualEdit": true,
                        "hiddenInTester": false,
                        "mandatory": false,
                        "computedValue": function ( /*settings*/) {
                            var exchangeRate = Data.GetValue("ExchangeRate__") || 1;
                            var freight = Data.GetValue("UnplannedDeliveryCosts__") || 0;
                            return freight * exchangeRate;
                        },
                        "niceName": {
                            "languageKey": "UnplannedDeliveryCosts__"
                        }
                    },
                    "UDCOverTolerance__": {
                        "type": "boolean",
                        "filter": [{ "field": "GroupByDimension__", "operator": "===", "value": ["null", "\"\""] }, { "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\""] }],
                        "hiddenInTester": true,
                        "computedValue": function (settings) {
                            var technicalDetailsJson = settings.GetField("TechnicalDetails__").value;
                            var result = false;
                            try {
                                var json = JSON.parse(technicalDetailsJson);
                                // eslint-disable-next-line dot-notation
                                if (json && json["ExtractedUDCOverTolerance"] && json["ExtractedUDCOverTolerance"]["IsInTolerance"] === false) {
                                    result = true;
                                }
                            }
                            catch (e) {
                                Log.Error("UDCOverTolerance: TechnicalDetails value could not be parsed to json: " + e);
                            }
                            return result;
                        },
                        "niceName": {
                            "languageKey": "UDCOverTolerance__"
                        }
                    }
                }
            };
            function AddJSONTo(definitions) {
                definitions.push(Sys.P2P.WorkflowDefinition.GetJSON(4));
                definitions.push(Sys.AP.WorkflowDefinition.GetJSON(1));
                definitions.push(definition);
            }
            WorkflowDefinition.AddJSONTo = AddJSONTo;
        })(WorkflowDefinition = AP.WorkflowDefinition || (AP.WorkflowDefinition = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
