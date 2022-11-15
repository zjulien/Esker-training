///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_SAP_Invoice_Common_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "library: SAP AP routines",
  "require": [
    "[Lib_AP_SAP_Client_V12.0.461.0]",
    "[Lib_AP_SAP_Server_V12.0.461.0]",
    "Sys/Sys_Helpers_String_SAP",
    "[Sys/Sys_Helpers_SAP]",
    "[Sys/Sys_Helpers_SAP_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var SAP;
        (function (SAP) {
            var Invoice;
            (function (Invoice) {
                function buildTaxKey(taxCode, taxJurisdiction, itemNumberTax) {
                    return taxCode + taxJurisdiction + itemNumberTax;
                }
                Invoice.buildTaxKey = buildTaxKey;
                function AddTaxAmount(params, taxCode, taxJurisdiction, itemNumberTax, amount, taxAmount, computeTaxAmount) {
                    var taxKey = buildTaxKey(taxCode, taxJurisdiction, itemNumberTax);
                    if (!taxAmount) {
                        taxAmount = 0;
                    }
                    // Check if current tax code already exists
                    if (amount) {
                        if (!params.AmountsByTaxCode) {
                            params.AmountsByTaxCode = {};
                        }
                        if (params.AmountsByTaxCode[taxKey]) {
                            params.AmountsByTaxCode[taxKey].amount += amount;
                            if (computeTaxAmount && !isNaN(params.AmountsByTaxCode[taxKey].taxRate) && params.AmountsByTaxCode[taxKey].taxRate !== null) {
                                params.AmountsByTaxCode[taxKey].taxAmount = Sys.Helpers.Round(Lib.AP.ApplyTaxRate(params.AmountsByTaxCode[taxKey].amount, params.AmountsByTaxCode[taxKey].taxRate, params.AmountsByTaxCode[taxKey].multitaxrate, true), Lib.AP.GetAmountPrecision());
                            }
                            else {
                                params.AmountsByTaxCode[taxKey].taxAmount += taxAmount;
                            }
                        }
                        else {
                            params.AmountsByTaxCode[taxKey] = {
                                taxCode: taxCode,
                                taxJurisdiction: taxJurisdiction,
                                itemNumberTax: itemNumberTax,
                                amount: amount,
                                taxAmount: taxAmount
                            };
                        }
                    }
                }
                Invoice.AddTaxAmount = AddTaxAmount;
                function GetAmountsByTaxAccount(params) {
                    return params.AmountsByTaxCode;
                }
                Invoice.GetAmountsByTaxAccount = GetAmountsByTaxAccount;
                function GetAmountForTaxKey(params, key) {
                    if (params.AmountsByTaxCode) {
                        return params.AmountsByTaxCode[key];
                    }
                    return null;
                }
                Invoice.GetAmountForTaxKey = GetAmountForTaxKey;
                function GetAmountForTaxAccount(params, taxAcct, itemNumberTax) {
                    if (params.AmountsByTaxCode) {
                        var key = buildTaxKey(taxAcct.Tax_Code, taxAcct.Taxjurcode_Deep, itemNumberTax);
                        return params.AmountsByTaxCode[key];
                    }
                    return null;
                }
                Invoice.GetAmountForTaxAccount = GetAmountForTaxAccount;
                function HasTaxAmounts(params) {
                    for (var taxCode in params.AmountsByTaxCode) {
                        if (taxCode) {
                            return true;
                        }
                    }
                    return false;
                }
                Invoice.HasTaxAmounts = HasTaxAmounts;
                function FIAddGLLines(params, itemNumberIdx, simulationReport) {
                    // Process line items
                    var lineItemsTableName = params.GlLinesTableNameOverride || "LineItems__";
                    var lineItems = Data.GetTable(lineItemsTableName);
                    // Parse line items and pre-check required fields.
                    var itemNumberTaxIdx = 1;
                    for (var idx = 0; idx < lineItems.GetItemCount(); idx++) {
                        var glLine = lineItems.GetItem(idx);
                        if (Lib.P2P.InvoiceLineItem.IsGLLikeLineItem(glLine)) {
                            var isZeroAmount = !glLine.GetValue("Amount__") || glLine.GetValue("Amount__") === 0;
                            if (params.GlLinesIgnoreZeroAmounts && isZeroAmount) {
                                continue;
                            }
                            if (Lib.AP.SAP.Invoice.FIGLLineIsValid(params, glLine, simulationReport)) {
                                // Process this item
                                var itemNumber = Sys.Helpers.SAP.BuildItemNumber(itemNumberIdx);
                                // eslint-disable-next-line dot-notation
                                itemNumberTaxIdx = Lib.AP.SAP.Invoice["FIAddGLLine"](params, glLine, itemNumber, itemNumberTaxIdx);
                                itemNumberIdx++;
                            }
                            else {
                                return -1;
                            }
                        }
                    }
                    return itemNumberIdx;
                }
                Invoice.FIAddGLLines = FIAddGLLines;
                function FIGLLineIsValid(params, line, simulationReport) {
                    var accountNumber = line.GetValue("GLAccount__");
                    var taxJurisdiction = line.GetValue("TaxJurisdiction__");
                    var taxCode = line.GetValue("TaxCode__");
                    // Format values for SAP
                    if (accountNumber) {
                        accountNumber = Sys.Helpers.String.SAP.NormalizeID(accountNumber, 10);
                    }
                    if (taxJurisdiction) {
                        taxJurisdiction = Sys.Helpers.String.SAP.Trim(taxJurisdiction).toUpperCase();
                    }
                    if (taxCode) {
                        taxCode = Sys.Helpers.SAP.FormatTaxCode(taxCode);
                    }
                    // Check required fields
                    var errMessage = "";
                    var errNum = "";
                    if (!accountNumber) {
                        errMessage = Language.Translate("_Line item '{0}' is invalid. Specify account number.", false, line.GetValue("Description__"));
                        errNum = "012";
                    }
                    if (taxCode && params.TaxJurisdictionLength > 0 && !taxJurisdiction) {
                        errMessage = Language.Translate("_Line item '{0}' is invalid. Specify jurisdiction for tax code '{1}'.", false, line.GetValue("Description__"), taxCode);
                        errNum = "014";
                    }
                    if (errMessage.length > 0) {
                        if (simulationReport) {
                            Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "E", errNum, errMessage, "", "", "", "");
                        }
                        else {
                            Sys.Helpers.SAP.SetLastError(errMessage);
                        }
                        return false;
                    }
                    return true;
                }
                Invoice.FIGLLineIsValid = FIGLLineIsValid;
                function FISetManualTaxError(simulationReport, msg, nb) {
                    if (simulationReport) {
                        Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "FF", "E", nb, msg, "", "", "", "");
                    }
                    else {
                        Sys.Helpers.SAP.SetLastError(msg);
                    }
                }
                Invoice.FISetManualTaxError = FISetManualTaxError;
                function FIAccountGLMatch(accountGLItem, aTaxAccount, itemNumberTax) {
                    Lib.AP.SAP.AddGetValue(accountGLItem);
                    if (accountGLItem && aTaxAccount && accountGLItem.GetValue("TAX_CODE")) {
                        var accountGLItem_ITEMNO_TAX = accountGLItem.GetValue("ITEMNO_TAX") || "";
                        return accountGLItem.GetValue("TAX_CODE") === aTaxAccount.Tax_Code
                            && accountGLItem.GetValue("TAXJURCODE") === aTaxAccount.Taxjurcode_Deep
                            && accountGLItem_ITEMNO_TAX === (itemNumberTax || "");
                    }
                    return false;
                }
                Invoice.FIAccountGLMatch = FIAccountGLMatch;
            })(Invoice = SAP.Invoice || (SAP.Invoice = {}));
        })(SAP = AP.SAP || (AP.SAP = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
