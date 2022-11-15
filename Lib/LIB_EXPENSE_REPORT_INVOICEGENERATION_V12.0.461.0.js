///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Expense_Report_InvoiceGeneration_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Expense Report Invoice generation library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_Expense_V12.0.461.0",
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Array",
    "Lib_P2P_Export_V12.0.461.0",
    "Lib_P2P_CompanyCodesValue_V12.0.461.0",
    "Lib_P2P_UserProperties_V12.0.461.0",
    "[Lib_Expense_Report_Customization_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Report;
        (function (Report) {
            Report.GenerateInvoiceError = function () { };
            var NbSupportedTaxFields = 5;
            function GetInvoiceLineItemsData(context) {
                var lineItemsData = {
                    lineItems: [],
                    netAmount: 0,
                    totalAmount: 0
                };
                var description = Data.GetValue("ExpenseReportNumber__") + " - " + Data.GetValue("UserName__");
                context.expenses.forEach(function (expense) {
                    var vars = expense.GetUninheritedVars();
                    var reimbursableLocalAmount = vars.GetValue_Double("ReimbursableLocalAmount__", 0);
                    if (reimbursableLocalAmount != 0) {
                        // If no ExchangeRate__, fallback to company code currency rate for compatibility with older packages
                        var currencyRate_1 = vars.GetValue_Double("ExchangeRate__", 0) || context.companyCodeValues.currencies.GetRate(vars.GetValue_String("TotalAmountCurrency__", 0));
                        var taxLines_1 = [];
                        Array.apply(null, Array(NbSupportedTaxFields)).forEach(function (_, idx) {
                            var taxCode = vars.GetValue_String("TaxCode" + (idx + 1) + "__", 0);
                            if (!Sys.Helpers.IsEmpty(taxCode)) {
                                taxLines_1.push({
                                    taxCode: taxCode,
                                    taxRate: vars.GetValue_Double("TaxRate" + (idx + 1) + "__", 0) || 0,
                                    taxAmount: new Sys.Decimal(vars.GetValue_Double("TaxAmount" + (idx + 1) + "__", 0) || 0).mul(currencyRate_1).toNumber()
                                });
                            }
                        });
                        // no tax line -> add a line with a tax rate to 0
                        if (taxLines_1.length === 0) {
                            taxLines_1.push({
                                taxCode: "",
                                taxRate: 0,
                                taxAmount: 0
                            });
                        }
                        lineItemsData.totalAmount += reimbursableLocalAmount;
                        Lib.Expense.Report.TaxesComputations.ComputeNetAmounts(taxLines_1, reimbursableLocalAmount);
                        taxLines_1.forEach(function (taxLine) {
                            lineItemsData.netAmount += taxLine.amount;
                            lineItemsData.lineItems.push({
                                "Description": description,
                                "Amount": taxLine.amount,
                                "GLAccount": vars.GetValue_String("GLAccount__", 0) || "",
                                "CostCenter": vars.GetValue_String("CostCenterId__", 0) || context.userProperties.CostCenter__ || "",
                                "TaxCode": taxLine.taxCode,
                                "TaxRate": taxLine.taxRate,
                                "TaxAmount": taxLine.taxAmount,
                                "ExpenseNumber": vars.GetValue_String("ExpenseNumber__", 0),
                                "ProjectCode": vars.GetValue_String("ProjectCode__", 0) || ""
                            });
                        });
                    }
                });
                return lineItemsData;
            }
            function GetInvoiceData(invoiceNumber, context, CCValues) {
                Log.Info("[ExpenseReport-InvoiceGeneration.GetInvoiceData] invoiceNumber: ".concat(invoiceNumber));
                return Lib.P2P.UserProperties.QueryValues(Data.GetValue("User__"))
                    .Catch(function (reason) {
                    Log.Error("[ExpenseReport-InvoiceGeneration.GetInvoiceData] query on user properties error: ".concat(reason));
                    throw new Report.GenerateInvoiceError();
                })
                    .Then(function (UserPropertiesValues) {
                    var invoiceData = {
                        "IsFromExpense": true,
                        "header": {
                            "InvoiceNumber": invoiceNumber,
                            "InvoiceDate": Data.GetValue("SubmissionDate__"),
                            "InvoiceAmount": Data.GetValue("TotalAmount__"),
                            "NetAmount": Data.GetValue("TotalAmount__"),
                            "TaxAmount": 0,
                            "InvoiceCurrency": Data.GetValue("CC_Currency__"),
                            "VendorName": Data.GetValue("UserName__"),
                            "VendorNumber": Data.GetValue("UserNumber__"),
                            "VendorVATNumber": Data.GetValue("UserNumber__"),
                            "ReceptionMethod": "Claims",
                            "CalculateTax": false,
                            "SourceDocument": Data.GetValue("ExpenseReportNumber__") || ""
                        },
                        "logo": {},
                        "companyInfo": {},
                        "tables": {
                            "LineItems": [],
                            "TaxInformations": [],
                            "PaymentInformations": []
                        },
                        "Attachment": []
                    };
                    context.companyCodeValues = CCValues;
                    context.userProperties = UserPropertiesValues;
                    var lineItemsData = GetInvoiceLineItemsData(context);
                    invoiceData.tables.LineItems = lineItemsData.lineItems;
                    invoiceData.header.NetAmount = lineItemsData.netAmount;
                    invoiceData.header.InvoiceAmount = lineItemsData.totalAmount;
                    return invoiceData;
                })
                    .Catch(function (reason) {
                    if (reason instanceof Report.GenerateInvoiceError) {
                        throw reason;
                    }
                    else {
                        Log.Error("[ExpenseReport-InvoiceGeneration.GetInvoiceData] unexpected error: ".concat(reason));
                        throw new Report.GenerateInvoiceError();
                    }
                });
            }
            function GenerateInvoice(context) {
                Log.Info("[ExpenseReport-InvoiceGeneration.GenerateInvoice] starting generation");
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    if (Sys.Helpers.IsEmpty(Data.GetValue("VIRuidEx__"))) {
                        var invoiceNumber_1 = Lib.Expense.NextNumber("Invoice", null, Data.GetValue("ExpenseReportNumber__"));
                        var expenseCompanyCode_1 = Lib.Expense.Report.GetExpenseItemsCompanyCode();
                        Lib.P2P.CompanyCodesValue.QueryValues(expenseCompanyCode_1, true)
                            .Catch(function (reason) {
                            Log.Error("[ExpenseReport-InvoiceGeneration.GenerateInvoice] query on companycodes/exchange rates error: ".concat(reason));
                            throw new Report.GenerateInvoiceError();
                        })
                            .Then(function (CCValues) {
                            if (Object.keys(CCValues).length > 0) {
                                return Sys.Helpers.Promise
                                    .Create(function (loadResolve) {
                                    Log.Info("[ExpenseReport-InvoiceGeneration.GenerateInvoice] reload configuration of AP instance: ".concat(CCValues.DefaultConfiguration__));
                                    Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__).Then(loadResolve);
                                })
                                    .Then(function () {
                                    var configuration = Sys.Parameters.GetInstance("AP");
                                    Log.Info("[ExpenseReport-InvoiceGeneration.GenerateInvoice] configuration reloaded");
                                    var apUserLogin = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Server.DetermineVendorInvoiceOwner");
                                    apUserLogin = apUserLogin || Lib.P2P.ResolveDemoLogin(configuration.GetParameter("DefaultAPClerk", ""));
                                    var VIPTransport = Process.CreateProcessInstanceForUser("Vendor invoice", apUserLogin, 2, false);
                                    if (VIPTransport) {
                                        Log.Info("[ExpenseReport-InvoiceGeneration.GenerateInvoice] get invoice data");
                                        return GetInvoiceData(invoiceNumber_1, context, CCValues)
                                            .Then(function (invoiceData) {
                                            invoiceData = Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Server.CustomizeInvoiceData", invoiceData, context) || invoiceData;
                                            Log.Info("[ExpenseReport-InvoiceGeneration.GenerateInvoice] build invoice");
                                            var expenseReportAttach = VIPTransport.AddAttach();
                                            expenseReportAttach.SetAttachFile(Attach.GetAttach(0).GetConvertedAttachFile(0));
                                            var expenseReportAttachVars = expenseReportAttach.GetVars();
                                            expenseReportAttachVars.AddValue_String("AttachOutputName", Lib.P2P.Export.GetName("Expense.Report", "ExpenseReportNumber__"), true);
                                            // AP Invoice's extraction script looks for the json file starting from the end of the attachments list
                                            // So, to be more efficient, keep this file the last one to be attached
                                            var jsonAttach = VIPTransport.AddAttach();
                                            var jsonAttachVars = jsonAttach.GetVars();
                                            jsonAttachVars.AddValue_String("AttachContent", JSON.stringify(invoiceData), true);
                                            jsonAttachVars.AddValue_String("AttachToProcess", 1, true);
                                            jsonAttachVars.AddValue_String("AttachType", "inline", true);
                                            jsonAttachVars.AddValue_String("AttachOutputName", invoiceNumber_1 + ".json", true);
                                            jsonAttachVars.AddValue_String("AttachEncoding", "UTF-8", true);
                                            var vars = VIPTransport.GetUninheritedVars();
                                            vars.AddValue_String("ReceptionMethod__", "Claims", true);
                                            vars.AddValue_String("BillingOptions", "DoNotBill:Archive", true);
                                            var extVars = VIPTransport.GetExternalVars();
                                            extVars.AddValue_String("customerInvoiceCompanyCode", expenseCompanyCode_1, true);
                                            extVars.AddValue_String("Configuration", CCValues.DefaultConfiguration__, true);
                                            var isInvoiceEnabledForTouchless = configuration.GetParameter("EnableTouchlessForExpenseInvoice", false);
                                            if (isInvoiceEnabledForTouchless) {
                                                Log.Info("Enable touchless processing on generated invoice");
                                                vars.AddValue_String("NeedValidation", "0", true);
                                                extVars.AddValue_String("EnableTouchlessForNonPoInvoice", "1", true);
                                            }
                                            else {
                                                Log.Info("Do not enable touchless processing on generated invoice");
                                            }
                                            VIPTransport.Process();
                                            Data.SetValue("VIRuidEx__", vars.GetValue_String("RuidEx", 0));
                                            Log.Info("Vendor invoice has been generated");
                                            if (VIPTransport.GetLastError() !== 0) {
                                                Log.Error("[ExpenseReport-InvoiceGeneration.GetInvoiceData] invoice process error: ".concat(VIPTransport.GetLastErrorMessage()));
                                                throw new Report.GenerateInvoiceError();
                                            }
                                            return context;
                                        });
                                    }
                                    Log.Error("[ExpenseReport-InvoiceGeneration.GenerateInvoice] Cannot create an invoice as user: ".concat(apUserLogin));
                                    throw new Report.GenerateInvoiceError();
                                });
                            }
                            Log.Error("[ExpenseReport-InvoiceGeneration.GenerateInvoice] The requested company code is not in the company code table.");
                            throw new Report.GenerateInvoiceError();
                        })
                            .Then(resolve)
                            .Catch(function (reason) {
                            if (reason instanceof Report.GenerateInvoiceError) {
                                reject(reason);
                            }
                            else {
                                Log.Error("[ExpenseReport-InvoiceGeneration.GenerateInvoice] unexpected error: ".concat(reason));
                                reject(new Report.GenerateInvoiceError());
                            }
                        });
                    }
                    else {
                        Log.Info("[ExpenseReport-InvoiceGeneration.GenerateInvoice] invoice already created, ".concat(Data.GetValue("VIRuidEx__")));
                        resolve(context);
                    }
                });
            }
            Report.GenerateInvoice = GenerateInvoice;
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
