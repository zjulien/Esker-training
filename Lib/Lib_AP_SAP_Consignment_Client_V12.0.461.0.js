///#GLOBALS Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_Consignment_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "library: SAP consignment routines.",
  "require": [
    "Lib_AP_SAP_Client_V12.0.461.0",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_Helpers_SAP_Client"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var Consignment;
            (function (Consignment) {
                function OnChange(materialDoc, fillGLAndCCDescriptions, GetTaxRateForItemList, layoutHelper) {
                    /** @this addPOLines */
                    function addPOLines() {
                        if (!this.GetQueryError()) {
                            var queryValue = this.GetQueryValue();
                            if (queryValue && queryValue.RecordsDefinition) {
                                var STATUSIdx_1 = queryValue.RecordsDefinition.STATUS;
                                var BELNRIdx_1 = queryValue.RecordsDefinition.BELNR;
                                var GJAHRIdx_1 = queryValue.RecordsDefinition.GJAHR;
                                var WRBTRIdx_1 = queryValue.RecordsDefinition.WRBTR;
                                var NAVNWIdx_1 = queryValue.RecordsDefinition.NAVNW;
                                var LIFNRIdx_1 = queryValue.RecordsDefinition.LIFNR;
                                var MBLNRIdx_1 = queryValue.RecordsDefinition.MBLNR;
                                var MJAHRIdx_1 = queryValue.RecordsDefinition.MJAHR;
                                var ZEILEIdx_1 = queryValue.RecordsDefinition.ZEILE;
                                var MATNRIdx_1 = queryValue.RecordsDefinition.MATNR;
                                var MWSKZIdx_1 = queryValue.RecordsDefinition.MWSKZ;
                                var GSBERIdx_1 = queryValue.RecordsDefinition.GSBER;
                                var HKONTIdx_1 = queryValue.RecordsDefinition.HKONT;
                                var BSTMGIdx_1 = queryValue.RecordsDefinition.BSTMG;
                                var BUKRSIdx_1 = queryValue.RecordsDefinition.BUKRS;
                                queryValue.Records.sort(function (a, b) {
                                    return parseInt(b[STATUSIdx_1], 10) - parseInt(a[STATUSIdx_1], 10);
                                })
                                    .reduce(function (p, record) {
                                    var currentSettlement = Data.GetValue("ERPInvoiceNumber__");
                                    var addLine = true;
                                    var status = record[STATUSIdx_1];
                                    var settlement = Lib.AP.FormatInvoiceDocumentNumber(record[BELNRIdx_1], record[GJAHRIdx_1], record[BUKRSIdx_1]);
                                    if (currentSettlement) {
                                        addLine = settlement === currentSettlement && status === "01";
                                    }
                                    else if (status === "01" && settlement) {
                                        addLine = Data.GetTable("LineItems__").GetItemCount() === 0 || (Data.GetTable("LineItems__").GetItemCount() === 1 &&
                                            !Data.GetTable("LineItems__").GetItem(0).GetValue("GoodIssue__"));
                                        if (addLine) {
                                            Data.SetValue("ERPInvoiceNumber__", settlement);
                                            layoutHelper.UpdateLayout(false);
                                        }
                                    }
                                    if (addLine) {
                                        return p.Then(function () {
                                            return Sys.Helpers.Promise.Create(function (resolve) {
                                                var netAmount = parseFloat(record[WRBTRIdx_1]) - parseFloat(record[NAVNWIdx_1]);
                                                var vendorNumber = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(record[LIFNRIdx_1]);
                                                Lib.AP.SAP.CheckVendorNumber(vendorNumber);
                                                Lib.AP.UpdateOrAddPOLine({
                                                    type: "Consignment",
                                                    goodIssue: record[MBLNRIdx_1],
                                                    assignment: record[MBLNRIdx_1] + record[MJAHRIdx_1],
                                                    itemNumber: record[ZEILEIdx_1],
                                                    vendorNumber: vendorNumber,
                                                    partNumber: record[MATNRIdx_1],
                                                    taxCode: record[MWSKZIdx_1],
                                                    businessArea: record[GSBERIdx_1],
                                                    glAccount: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(record[HKONTIdx_1]),
                                                    amount: netAmount,
                                                    quantity: parseFloat(record[BSTMGIdx_1]),
                                                    openAmount: netAmount,
                                                    openQuantity: parseFloat(record[BSTMGIdx_1]),
                                                    expectedAmount: netAmount,
                                                    expectedQuantity: parseFloat(record[BSTMGIdx_1])
                                                }, true)
                                                    .Then(function (line) {
                                                    fillGLAndCCDescriptions(line.item, resolve);
                                                });
                                            });
                                        });
                                    }
                                    return p;
                                }, Sys.Helpers.Promise.Resolve())
                                    .Then(function () {
                                    layoutHelper.DisableButtons(false, "AddGoodIssuePromises");
                                    GetTaxRateForItemList();
                                });
                            }
                        }
                        else {
                            layoutHelper.DisableButtons(false, "AddGoodIssuePromises");
                        }
                    }
                    Lib.AP.ResetLineItemsCache();
                    if (!materialDoc) {
                        return;
                    }
                    layoutHelper.DisableButtons(true, "AddGoodIssuePromises");
                    QueryRKWA(materialDoc, addPOLines);
                }
                Consignment.OnChange = OnChange;
                function CheckRKWA(materialDoc, checkSettlement) {
                    /** @this updateSettlementNumber */
                    function updateSettlementNumber() {
                        if (!this.GetQueryError()) {
                            var queryValue = this.GetQueryValue();
                            var FIDocumentNumber_1 = "";
                            if (queryValue && queryValue.RecordsDefinition) {
                                var STATUSIdx_2 = queryValue.RecordsDefinition.STATUS;
                                var belnrIndex_1 = queryValue.RecordsDefinition.BELNR;
                                var gjahrIndex_1 = queryValue.RecordsDefinition.GJAHR;
                                var bukrsIndex_1 = queryValue.RecordsDefinition.BUKRS;
                                Sys.Helpers.Array.ForEach(queryValue.Records, function (record) {
                                    var status = record[STATUSIdx_2];
                                    var belnr = record[belnrIndex_1];
                                    var gjahr = record[gjahrIndex_1];
                                    var bukrs = record[bukrsIndex_1];
                                    var currentSettlement = Data.GetValue("ERPInvoiceNumber__");
                                    if (status === "01" && !currentSettlement) {
                                        var settlement = Lib.AP.FormatInvoiceDocumentNumber(belnr, gjahr, bukrs);
                                        FIDocumentNumber_1 = settlement;
                                    }
                                });
                                checkSettlement(FIDocumentNumber_1);
                            }
                        }
                    }
                    QueryRKWA(materialDoc, updateSettlementNumber);
                }
                Consignment.CheckRKWA = CheckRKWA;
                function QueryRKWA(materialDoc, callback) {
                    var currentYear = new Date().getFullYear();
                    var previousYear = new Date().getFullYear() - 1;
                    var fields = "MBLNR|MJAHR|ZEILE|STATUS|BLDAT|BUDAT|BUKRS|SOBKZ|LIFNR|WERKS|MATNR|SHKZG|GSBER|BWAER|WRBTR|BSTME|BSTMG|HKONT|MWSKZ|BELNR|GJAHR|BUZEI|NAVNW";
                    var filter = "MBLNR = '" + materialDoc + "' | AND ( MJAHR = '" + currentYear + "' OR MJAHR = '" + previousYear + "' ) | AND BUKRS = '" + Data.GetValue("CompanyCode__") + "'";
                    Query.SAPQuery(callback, Variable.GetValueAsString("SAPConfiguration"), "RKWA", fields, filter, 100, 0, false);
                }
                Consignment.QueryRKWA = QueryRKWA;
            })(Consignment = SAP.Consignment || (SAP.Consignment = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
