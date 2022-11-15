///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_StatementMatching_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "require": [
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_Promise",
    "[Sys/Sys_GenericAPI_Client]",
    "[Sys/Sys_GenericAPI_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var StatementMatching;
        (function (StatementMatching) {
            StatementMatching.Status = {
                unknown: "unknown",
                matched: "matched",
                mismatched: "mismatched",
                unmatched: "unmatched"
            };
            StatementMatching.Returns = {
                ok: "ok",
                missingHeader: "missingHeader",
                missingReferences: "missingReferences"
            };
            StatementMatching.MatchingStatus = {
                fullyMatched: "fullyMatched",
                fullyMatchedDataMismatches: "fullyMatchedDataMismatches",
                unpaidItemsMissingStatement: "unpaidItemsMissingStatement",
                incompleteMatching: "incompleteMatching"
            };
            var lineStatusToHeaderStatus = {
                unknown: StatementMatching.MatchingStatus.incompleteMatching,
                matched: StatementMatching.MatchingStatus.fullyMatched,
                mismatched: StatementMatching.MatchingStatus.fullyMatchedDataMismatches,
                unmatched: StatementMatching.MatchingStatus.incompleteMatching,
                extra: StatementMatching.MatchingStatus.unpaidItemsMissingStatement
            };
            var MatchingStatusPriority = [
                StatementMatching.MatchingStatus.fullyMatched,
                StatementMatching.MatchingStatus.fullyMatchedDataMismatches,
                StatementMatching.MatchingStatus.unpaidItemsMissingStatement,
                StatementMatching.MatchingStatus.incompleteMatching
            ];
            var MatchingStatusExplanation = [
                "_ExplanationFullyMatchedStatus",
                "_ExplanationFullyMatchedwithDataMismatchesStatus",
                "_ExplanationUn-paidItemsMissingonStatementStatus",
                "_ExplanationIncompleteMatchingStatus"
            ];
            var vipFieldsToRetrieve = ["ValidationURL", "InvoiceNumber__", "InvoiceStatus__", "InvoiceDate__", "DueDate__", "PaymentDate__", "InvoiceAmount__", "InvoiceCurrency__", "ERPInvoiceNumber__"];
            var vipToLineMapping = {
                ValidationURL: "InvoiceURL__",
                InvoiceNumber__: "InvoiceNumber__",
                InvoiceStatus__: "InvoiceStatus__",
                InvoiceDate__: "InvoiceDate__",
                DueDate__: "InvoiceDueDate__",
                PaymentDate__: "InvoicePaymentDate__",
                InvoiceAmount__: "InvoiceAmount__",
                InvoiceCurrency__: "InvoiceCurrency__",
                ERPInvoiceNumber__: "ERPInvoiceNumber__"
            };
            var vipStatesToRetrieve = [
                "Received",
                "To verify",
                "To approve",
                "To post",
                "On hold",
                "To pay",
                "Set aside"
            ];
            var vipStatesExcluded = [
                "Rejected",
                "Reversed",
                "Expired"
            ];
            var invoiceFieldsInTable = [
                "ERPInvoiceNumber__",
                "InvoiceAmount__",
                "InvoiceCurrency__",
                "InvoiceDate__",
                "InvoiceDueDate__",
                "InvoiceURL__",
                "InvoiceNumber__",
                "InvoicePaymentDate__"
            ];
            var invoiceFieldsType = {
                ERPInvoiceNumber__: "string",
                InvoiceAmount__: "double",
                InvoiceCurrency__: "string",
                InvoiceDate__: "date",
                InvoiceDueDate__: "date",
                InvoiceURL__: "string",
                InvoiceNumber__: "string",
                InvoicePaymentDate__: "date",
                InvoiceStatus__: "string"
            };
            function CleanInvoicesTable() {
                var invoicesTable = Data.GetTable("InvoicesTable__");
                var nbItems = invoicesTable.GetItemCount();
                for (var i = 0; i < nbItems; i++) {
                    var item = invoicesTable.GetItem(i);
                    if (!item.GetValue("ReferenceNumber__")) {
                        // Delete line not comming from the document
                        if (Sys.ScriptInfo.IsClient()) {
                            item.Remove();
                        }
                        else {
                            item.RemoveItem();
                        }
                        nbItems--;
                        i--;
                    }
                    else {
                        for (var j = 0; j < invoiceFieldsInTable.length; j++) {
                            item.SetValue(invoiceFieldsInTable[j], "");
                        }
                        item.SetValue("MatchingStatus__", Lib.AP.StatementMatching.Status.unknown);
                        item.SetValue("InvoiceStatus__", "EMPTY");
                    }
                }
                invoicesTable.SetItemCount(nbItems);
                return nbItems;
            }
            StatementMatching.CleanInvoicesTable = CleanInvoicesTable;
            function IsMatchingReference(reference, invoice) {
                return reference.ReferenceDate__ === invoice.InvoiceDate__
                    && reference.ReferenceAmount__ === parseFloat(invoice.InvoiceAmount__);
            }
            function RetrieveInvoices() {
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("InvoiceDate__", Sys.Helpers.Date.Date2DBDate(Data.GetValue("StatementDate__"))), Sys.Helpers.LdapUtil.FilterIn("InvoiceStatus__", vipStatesToRetrieve));
                var options = {
                    table: "CDNAME#Vendor invoice",
                    filter: filter.toString(),
                    attributes: vipFieldsToRetrieve,
                    maxRecords: -1,
                    additionalOptions: {
                        useConstantQueryCache: false,
                        asAdmin: true,
                        searchInArchive: true,
                        bigQuery: null,
                        fieldToTypeMap: invoiceFieldsType
                    }
                };
                if (Sys.ScriptInfo.IsClient()) {
                    options.additionalOptions.bigQuery = {
                        uniqueKeyName: "RuidEx"
                    };
                }
                return Sys.GenericAPI.PromisedQuery(options);
            }
            function MatchInvoices(invoices) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var matchingInfo = {
                        result: {
                            status: StatementMatching.Returns.ok,
                            counts: {
                                matched: 0,
                                mismatched: 0,
                                missing: 0,
                                extra: 0,
                                unexpectedInvoiceStatus: 0
                            }
                        },
                        references: []
                    };
                    var invoicesTable = Data.GetTable("InvoicesTable__");
                    var nbInvoices = invoicesTable.GetItemCount();
                    // construct map to ease lookup
                    for (var i = 0; i < nbInvoices; i++) {
                        var item = invoicesTable.GetItem(i);
                        matchingInfo.references.push({
                            ReferenceAmount__: item.GetValue("ReferenceAmount__"),
                            ReferenceDate__: Sys.Helpers.Date.Date2DBDate(item.GetValue("ReferenceDate__")),
                            ReferenceNumber__: item.GetValue("ReferenceNumber__"),
                            Matched: false
                        });
                    }
                    if (invoices.length > 0) {
                        // match invoices
                        Sys.Helpers.Array.ForEach(invoices, function (invoice) {
                            var item = null;
                            var matchingStatus = StatementMatching.Status.mismatched;
                            var refIndex = Sys.Helpers.Array.FindIndex(matchingInfo.references, function (reference) {
                                return reference.ReferenceNumber__ === invoice.InvoiceNumber__;
                            });
                            if (refIndex >= 0) {
                                item = invoicesTable.GetItem(refIndex);
                                if (IsMatchingReference(matchingInfo.references[refIndex], invoice)) {
                                    matchingStatus = StatementMatching.Status.matched;
                                }
                                matchingInfo.references[refIndex].Matched = true;
                            }
                            else {
                                nbInvoices++;
                                invoicesTable.SetItemCount(nbInvoices);
                                item = invoicesTable.GetItem(nbInvoices - 1);
                                matchingStatus = StatementMatching.Status.unmatched;
                            }
                            if (item) {
                                Sys.Helpers.Array.ForEach(vipFieldsToRetrieve, function (fieldName) {
                                    item.SetValue(vipToLineMapping[fieldName], invoice[fieldName]);
                                });
                                item.SetValue("MatchingStatus__", matchingStatus);
                                if (matchingStatus === StatementMatching.Status.unmatched) {
                                    matchingInfo.result.counts.extra++;
                                }
                                else {
                                    matchingInfo.result.counts[matchingStatus]++;
                                }
                            }
                        });
                    }
                    resolve(matchingInfo);
                });
            }
            function CheckMissingReferences(matchingInfo) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    // identify statement references that are missing
                    var nbQueries = 0;
                    var noQuery = true;
                    var invoicesTable = Data.GetTable("InvoicesTable__");
                    Sys.Helpers.Array.ForEach(matchingInfo.references, function (reference, index) {
                        if (!reference.Matched) {
                            noQuery = false;
                            var item_1 = invoicesTable.GetItem(index);
                            if (item_1) {
                                item_1.SetValue("MatchingStatus__", StatementMatching.Status.unmatched);
                                matchingInfo.result.counts.missing++;
                                // check if it's possibly already paid
                                nbQueries++;
                                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterStrictlyLesser("InvoiceDate__", Sys.Helpers.Date.Date2DBDate(Data.GetValue("StatementDate__"))), Sys.Helpers.LdapUtil.FilterEqual("InvoiceNumber__", reference.ReferenceNumber__), Sys.Helpers.LdapUtil.FilterNotIn("InvoiceStatus__", vipStatesExcluded));
                                var options = {
                                    table: "CDNAME#Vendor invoice",
                                    filter: filter.toString(),
                                    attributes: vipFieldsToRetrieve,
                                    maxRecords: 1,
                                    additionalOptions: {
                                        useConstantQueryCache: false,
                                        asAdmin: true,
                                        searchInArchive: true,
                                        fieldToTypeMap: invoiceFieldsType
                                    }
                                };
                                Sys.GenericAPI.PromisedQuery(options)
                                    .Then(function (invoices) {
                                    if (invoices.length === 1) {
                                        var matchingStatus = StatementMatching.Status.mismatched;
                                        if (IsMatchingReference(reference, invoices[0])) {
                                            matchingStatus = StatementMatching.Status.matched;
                                        }
                                        Sys.Helpers.Array.ForEach(vipFieldsToRetrieve, function (fieldName) {
                                            item_1.SetValue(vipToLineMapping[fieldName], invoices[0][fieldName]);
                                        });
                                        item_1.SetValue("MatchingStatus__", matchingStatus);
                                        matchingInfo.result.counts.missing--;
                                        matchingInfo.result.counts[matchingStatus]++;
                                        matchingInfo.result.counts.unexpectedInvoiceStatus++;
                                    }
                                    nbQueries--;
                                    if (nbQueries === 0) {
                                        resolve(matchingInfo.result);
                                    }
                                });
                            }
                        }
                    });
                    if (noQuery) {
                        resolve(matchingInfo.result);
                    }
                });
            }
            function UpdateStatementMatchingStatus() {
                var invoicesTable = Data.GetTable("InvoicesTable__");
                var nbItems = invoicesTable.GetItemCount();
                var higherPriority = MatchingStatusPriority.length - 1;
                var matchingStatusPriority = 0;
                for (var i = 0; i < nbItems; i++) {
                    var item = invoicesTable.GetItem(i);
                    // if no ReferenceNumber__ then force extra status
                    var status = item.GetValue("ReferenceNumber__") ? item.GetValue("MatchingStatus__") : "extra";
                    var newStatus = lineStatusToHeaderStatus[status];
                    var newPriority = MatchingStatusPriority.indexOf(newStatus);
                    if (newPriority > matchingStatusPriority) {
                        matchingStatusPriority = newPriority;
                    }
                    if (matchingStatusPriority === higherPriority) {
                        // worst status
                        break;
                    }
                }
                Data.SetValue("StatementMatchingStatus__", MatchingStatusPriority[matchingStatusPriority]);
                Data.SetValue("StatementMatchingStatusExplanation__", Language.Translate(MatchingStatusExplanation[matchingStatusPriority]));
            }
            StatementMatching.UpdateStatementMatchingStatus = UpdateStatementMatchingStatus;
            function Run() {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var headerOk = Boolean(Data.GetValue("CompanyCode__")) && Boolean(Data.GetValue("StatementDate__")) && Boolean(Data.GetValue("VendorNumber__"));
                    if (headerOk) {
                        if (CleanInvoicesTable() > 0) {
                            RetrieveInvoices()
                                .Then(MatchInvoices)
                                .Then(CheckMissingReferences)
                                .Then(function (result) {
                                resolve(result);
                            });
                        }
                        else {
                            resolve({ status: StatementMatching.Returns.missingReferences });
                        }
                    }
                    else {
                        resolve({ status: StatementMatching.Returns.missingHeader });
                    }
                });
            }
            StatementMatching.Run = Run;
        })(StatementMatching = AP.StatementMatching || (AP.StatementMatching = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
