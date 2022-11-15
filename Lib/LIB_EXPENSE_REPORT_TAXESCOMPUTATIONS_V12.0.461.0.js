///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Report_TaxesComputations_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Expense Report Taxes computations library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_Expense_V12.0.461.0",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Array"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Report;
        (function (Report) {
            var TaxesComputations;
            (function (TaxesComputations) {
                TaxesComputations.BalanceNetAmountsErrorCode = {
                    Success: 0,
                    TaxAmountTooBig: 1,
                    TotalAmountTooBig: 2
                };
                function BalanceNetAmounts(taxLines, remainsTotalAmount, strictMode) {
                    /**
                     * Where 100 cts = 1 currency unit:
                     *
                     * 		                TaxAmount - 0.5 cts <=       Real TaxAmount     < TaxAmount + 0.5 cts
                     * <=>	                TaxAmount - 0.5 cts <= Real Amount HT * TaxRate < TaxAmount + 0.5 cts
                     * <=>	1 / TaxRate * (TaxAmount - 0.5 cts) <=       Real Amount HT     < 1/TaxRate * (TaxAmount + 0.5 cts)
                     *  =>	                - 0.5 cts / TaxRate <=  Lost decimal Precision  < 0.5 cts / TaxRate
                     *
                     * If strictMode is true, no rounding error are allowed.
                     * If strictMode is false, a little rounding error is allowed as some receipts have rounding issue
                     * (for example, Yann' chipsters tax amount where 0.124 is rounded to 0.13 instead of 0.12)
                     */
                    var totalNbLostCts = Sys.Helpers.Round((new Sys.Decimal(remainsTotalAmount)).abs(), 2);
                    var addOrRemoveFactor = remainsTotalAmount < 0 ? -1 : 1;
                    var netAmounts = [];
                    var balanced = !!Sys.Helpers.Array.Find(taxLines, function (taxLine) {
                        var maxNbLostCts = Number.POSITIVE_INFINITY;
                        if (taxLine.taxRate > 0) {
                            var boundTaxAmount = Sys.Decimal.mul(addOrRemoveFactor, (strictMode) ? 0.005 : 0.01).plus(taxLine.taxAmount);
                            var boundNetAmount = boundTaxAmount.mul(100).div(taxLine.taxRate);
                            var floorBoundNetAmount = boundNetAmount.mul(100).floor().div(100);
                            Sys.Helpers.Round(boundNetAmount, 2);
                            if (remainsTotalAmount < 0) {
                                boundNetAmount = floorBoundNetAmount.eq(boundNetAmount) ? floorBoundNetAmount : floorBoundNetAmount.plus(0.01);
                            }
                            else {
                                boundNetAmount = floorBoundNetAmount.eq(boundNetAmount) ? floorBoundNetAmount.minus(0.01) : floorBoundNetAmount;
                            }
                            maxNbLostCts = boundNetAmount.minus(taxLine.amount).abs();
                        }
                        var addOrRemoveCts = Sys.Decimal.min(totalNbLostCts, maxNbLostCts);
                        var origTotalNbLostCts = totalNbLostCts;
                        totalNbLostCts = totalNbLostCts.minus(addOrRemoveCts);
                        var netAmount = (new Sys.Decimal(taxLine.amount)).plus(addOrRemoveCts.mul(addOrRemoveFactor));
                        if (netAmount.lessThan(0)) {
                            totalNbLostCts = origTotalNbLostCts;
                            netAmount = new Sys.Decimal(taxLine.amount);
                        }
                        netAmount = Sys.Helpers.Round(netAmount, 2);
                        netAmounts.push(netAmount.toNumber());
                        return totalNbLostCts.eq(0);
                    });
                    if (balanced) {
                        netAmounts.forEach(function (netAmount, i) { return taxLines[i].amount = netAmount; });
                    }
                    return balanced ? TaxesComputations.BalanceNetAmountsErrorCode.Success : (remainsTotalAmount < 0 ? TaxesComputations.BalanceNetAmountsErrorCode.TaxAmountTooBig : TaxesComputations.BalanceNetAmountsErrorCode.TotalAmountTooBig);
                }
                function ComputeNetAmounts(taxLines, totalAmount) {
                    var remainsTotalAmount = new Sys.Decimal(totalAmount);
                    var computingTaxLines = taxLines
                        // clone tax fields data
                        // compute first approx. of net amount
                        // keep initial position in table (before sorting)
                        .map(function (taxLine, idx) {
                        var netAmount = new Sys.Decimal(0);
                        // != instead of !== as taxAmount and taxRate may be string if expense has been submitted on mobile
                        if (taxLine.taxAmount != 0 && taxLine.taxRate != 0) {
                            netAmount = new Sys.Decimal(taxLine.taxAmount).mul(100).div(taxLine.taxRate);
                            remainsTotalAmount = remainsTotalAmount.minus(netAmount).minus(taxLine.taxAmount);
                        }
                        return Sys.Helpers.Extend(false, {
                            idx: idx,
                            amount: Sys.Helpers.Round(netAmount.toNumber(), 2)
                        }, taxLine);
                    })
                        // sort line items by amount desc and then by tax rate asc
                        .sort(function (line1, line2) { return (line2.amount == line1.amount) ? line1.taxRate - line2.taxRate : line2.amount - line1.amount; });
                    var balanceError = BalanceNetAmounts(computingTaxLines, remainsTotalAmount.toNumber(), true);
                    if (balanceError !== TaxesComputations.BalanceNetAmountsErrorCode.Success) {
                        // Retry without strict mode
                        balanceError = BalanceNetAmounts(computingTaxLines, remainsTotalAmount.toNumber(), false);
                    }
                    if (balanceError === TaxesComputations.BalanceNetAmountsErrorCode.Success || balanceError === TaxesComputations.BalanceNetAmountsErrorCode.TotalAmountTooBig) {
                        var taxLinesIdxToRemove_1 = [];
                        computingTaxLines.forEach(function (computingTaxLine) {
                            // remove tax lines with amounts to zero
                            if (computingTaxLine.amount !== 0) {
                                var taxLine = taxLines[computingTaxLine.idx];
                                taxLine.amount = computingTaxLine.amount;
                            }
                            else {
                                taxLinesIdxToRemove_1.push(computingTaxLine.idx);
                            }
                        });
                        // Remove by index descendant to avoid problems
                        taxLinesIdxToRemove_1.sort().reverse();
                        taxLinesIdxToRemove_1.forEach(function (idx) { taxLines.splice(idx, 1); });
                        if (balanceError === TaxesComputations.BalanceNetAmountsErrorCode.TotalAmountTooBig) {
                            // add a new line in order to reach the total amount
                            taxLines.push({
                                amount: Sys.Helpers.Round(remainsTotalAmount, 2).toNumber(),
                                taxCode: "",
                                taxRate: "",
                                taxAmount: ""
                            });
                        }
                    }
                    else if (balanceError === TaxesComputations.BalanceNetAmountsErrorCode.TaxAmountTooBig) {
                        // remove all tax lines and keep only one
                        taxLines.splice(0, taxLines.length, {
                            amount: totalAmount,
                            taxCode: "",
                            taxRate: "",
                            taxAmount: ""
                        });
                    }
                    return balanceError;
                }
                TaxesComputations.ComputeNetAmounts = ComputeNetAmounts;
            })(TaxesComputations = Report.TaxesComputations || (Report.TaxesComputations = {}));
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
