///#GLOBALS Lib Sys
/// <reference path="../../PAC/Purchasing V2/Purchase Order process V2/typings_withDeleted/Controls_Purchase_Order_process_V2/index.d.ts"/>
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_RelatedVIP_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing library to manage XXX",
  "require": [
    "Lib_P2P_V12.0.461.0",
    "Sys/Sys_Helpers_promise_Tools"
  ]
}*/
// Client interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var RelatedVIP;
        (function (RelatedVIP) {
            function GenerateOptions(toReceive) {
                var isPO = Sys.Helpers.Globals.Process.GetName() === Lib.P2P.GetPOProcessName();
                var attributes = ["InvoiceNumber__", "InvoiceDate__", "InvoiceAmount__", "InvoiceCurrency__", "InvoiceStatus__", "ValidationURL", "MSN", "OwnerId"];
                var table = "CDNAME#Vendor invoice";
                var filter;
                var sortOrder;
                if (isPO) {
                    filter = "(OrderNumber__=*" + Data.GetValue("OrderNumber__") + "*)";
                    sortOrder = "InvoiceNumber__ ASC";
                }
                else {
                    var grNumber = Data.GetValue("GRNumber__");
                    if (toReceive || !grNumber) {
                        filter = "(&(Deleted=0)(State=70)(OrderNumber__=*" + Data.GetValue("OrderNumber__") + "*))";
                        sortOrder = "InvoiceStatus__ ASC, InvoiceDate__ DESC";
                    }
                    else {
                        table = "CDLNAME#Vendor invoice.LineItems__";
                        filter = "(LINE_GOODSRECEIPT__=" + grNumber + "*)";
                        sortOrder = "InvoiceDate__ DESC";
                    }
                }
                return {
                    table: table,
                    filter: filter,
                    attributes: attributes,
                    sortOrder: sortOrder,
                    maxRecords: 99,
                    additionalOptions: {
                        queryOptions: "Distinct=InvoiceNumber__"
                    }
                };
            }
            RelatedVIP.GenerateOptions = GenerateOptions;
            function InitRelatedInvoice(toReceive) {
                Controls.DisplayInvoices__.Hide(true);
                Controls.RelatedInvoicesPane.Hide(true);
                Controls.RelatedInvoicesTable__.SetWidth("100%");
                Controls.RelatedInvoicesTable__.SetExtendableColumn("InvoiceDate__");
                var relatedInvoiceShown = false;
                Controls.DisplayInvoices__.SetText("_DisplayInvoices_show");
                Controls.DisplayInvoices__.OnClick = function () {
                    Controls.RelatedInvoicesPane.Hide(relatedInvoiceShown);
                    Controls.DisplayInvoices__.SetText(relatedInvoiceShown ? "_DisplayInvoices_show" : "_DisplayInvoices_hide");
                    relatedInvoiceShown = !relatedInvoiceShown;
                };
                Controls.DisplayInvoices__.OnHide = function (hidden) {
                    relatedInvoiceShown = hidden;
                    Controls.DisplayInvoices__.SetText(hidden ? "_DisplayInvoices_show" : "_DisplayInvoices_hide");
                };
                Controls.RelatedInvoicesPane.OnHide = function (hidden) {
                    relatedInvoiceShown = hidden;
                    Controls.DisplayInvoices__.SetText(hidden ? "_DisplayInvoices_show" : "_DisplayInvoices_hide");
                };
                Controls.RelatedInvoicesTable__.InvoiceNumber__.OnClick = function () {
                    var currentItem = this.GetRow().GetItem();
                    Process.OpenLink({
                        url: currentItem.GetValue("InvoiceValidationURL__"),
                        inCurrentTab: false,
                        onQuit: "Close"
                    });
                };
                Controls.RelatedInvoicesTable__.OnRefreshRow = function (index) {
                    var row = Controls.RelatedInvoicesTable__.GetRow(index);
                    if (row) {
                        row.InvoiceNumber__.DisplayAs({ type: "Link" });
                    }
                };
                return Sys.GenericAPI.PromisedQuery(GenerateOptions(toReceive))
                    .Then(function (queryResults) {
                    if (queryResults.length == 0) {
                        Controls.DisplayInvoices__.Hide(true);
                        return;
                    }
                    Controls.RelatedInvoicesTable__.SetItemCount(0);
                    Controls.RelatedInvoicesTable__.SetLineCount(10);
                    queryResults.forEach(function (r) {
                        var newItem = Controls.RelatedInvoicesTable__.AddItem();
                        newItem.SetValue("InvoiceNumber__", r.InvoiceNumber__);
                        newItem.SetValue("InvoiceDate__", r.InvoiceDate__);
                        newItem.SetValue("InvoiceAmount__", r.InvoiceAmount__);
                        newItem.SetValue("InvoiceCurrency__", r.InvoiceCurrency__);
                        newItem.SetValue("InvoiceStatus__", Language.Translate("_VIPStatus_" + r.InvoiceStatus__));
                        newItem.SetValue("InvoiceValidationURL__", r.ValidationURL);
                    });
                    return Sys.Helpers.Promise.Tools.Sleep(100)
                        .Then(function () {
                        var lineItemsCount = Math.min(Controls.RelatedInvoicesTable__.GetItemCount(), Controls.RelatedInvoicesTable__.GetLineCount());
                        for (var lineIdx = 0; lineIdx < lineItemsCount; lineIdx++) {
                            var row = Controls.RelatedInvoicesTable__.GetRow(lineIdx);
                            if (row) {
                                row.InvoiceNumber__.DisplayAs({ type: "Link" });
                            }
                        }
                        Controls.RelatedInvoicesTable__.Hide(false);
                        Controls.DisplayInvoices__.Hide(false);
                        if (toReceive) {
                            Log.Info("At least one invoice in workflow: Automatically display 'related invoices' panel");
                            Controls.RelatedInvoicesPane.SetLabel("_PossibleRelatedInvoicesPane");
                            Controls.DisplayInvoices__.Click();
                        }
                        else {
                            Controls.RelatedInvoicesPane.SetLabel("_RelatedInvoicesPane");
                        }
                    })
                        .Catch();
                });
            }
            RelatedVIP.InitRelatedInvoice = InitRelatedInvoice;
        })(RelatedVIP = Purchasing.RelatedVIP || (Purchasing.RelatedVIP = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
