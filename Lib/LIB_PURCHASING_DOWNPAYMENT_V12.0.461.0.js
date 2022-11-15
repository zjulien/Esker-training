///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_DownPayment_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Client",
  "comment": "Purchasing library to manage items in PO",
  "require": [
    "Lib_Purchasing_V12.0.461.0",
    "Lib_Purchasing_POItems_V12.0.461.0",
    "Lib_Purchasing_CheckPO_V12.0.461.0",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_Vendor_V12.0.461.0",
    "Lib_Purchasing_CatalogHelper_V12.0.461.0",
    "Lib_Purchasing_WorkflowPO_V12.0.461.0",
    "[Lib_CommonDialog_V12.0.461.0]"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var DownPayment;
        (function (DownPayment) {
            function UpdateDownpaymentLabels(currency) {
                Controls.TotalNetAmount__.SetLabel(Language.Translate("_Total net amount", false, currency));
                Controls.InfoTotalNetAmount__.SetLabel(Language.Translate("_Info total net amount", false, currency));
                Controls.PaymentAmount__.SetLabel(Language.Translate("_Payment amount") + " (" + currency + ")");
                Controls.TotalAmountIncludingVAT__.SetLabel(Language.Translate("_TotalAmountIncludingVAT") + " (" + currency + ")");
                Controls.TotalAmountIncludingVAT__.Hide(true);
            }
            DownPayment.UpdateDownpaymentLabels = UpdateDownpaymentLabels;
            DownPayment.CurrentMasterControlName = Variable.GetValueAsString("PaymentCurrentMasterControlName"); // Three options : '%' or 'amount' or 'null'
            function UpdateGui(status, bDisplayError) {
                var isAdmin = Lib.P2P.IsAdminNotOwner();
                Controls.PaymentPercent__.SetReadOnly(isAdmin || status !== "To order" || this.IsDone());
                Controls.PaymentAmount__.SetReadOnly(isAdmin || status !== "To order" || this.IsDone());
                Controls.PaymentType__.SetRequired(status === "To pay");
                Controls.PaymentDate__.SetRequired(status === "To pay");
                if (!this.IsAsked() && status !== "To pay") // If no down payment
                 {
                    // Init values on first access (if they are null)
                    ProcessInstance.SetSilentChange(true);
                    Data.SetValue("PaymentPercent__", 0);
                    Data.SetValue("PaymentAmount__", 0);
                    ProcessInstance.SetSilentChange(false);
                    Controls.Submit_.Hide(isAdmin || status === "To receive" || status === "Auto receive" || status === "Received" || status === "Canceled" || status === "Rejected" || ProcessInstance.state === 50);
                    Controls.RequestPayment.Hide(true);
                    Controls.ConfirmPayment.Hide(true);
                    // down payment fields
                    Controls.PaymentType__.Hide(true);
                    Controls.PaymentType__.SetReadOnly(true);
                    Controls.PaymentDate__.Hide(true);
                    Controls.PaymentReference__.Hide(true);
                }
                else {
                    // down payment fields
                    Controls.PaymentAmount__.Hide(false);
                    if (status === "To order" && !this.IsDone()) {
                        if (bDisplayError) {
                            var treasurer = Lib.Purchasing.WorkflowPO.workflow.GetContributorsByRole("treasurer");
                            if (!(treasurer && treasurer.length && treasurer[0].login)) {
                                Controls.PaymentPercent__.SetError("_undefined treasurer");
                                Controls.PaymentAmount__.SetError("_undefined treasurer");
                            }
                            else {
                                Controls.PaymentPercent__.SetError("");
                                Controls.PaymentAmount__.SetError("");
                            }
                        }
                        Controls.RequestPayment.Hide(false);
                        Controls.Submit_.Hide(true);
                        Controls.ConfirmPayment.Hide(true);
                        Controls.PaymentType__.Hide(true);
                        Controls.PaymentDate__.Hide(true);
                        Controls.PaymentReference__.Hide(true);
                    }
                    else if (!isAdmin && status === "To pay") {
                        Controls.Submit_.Hide(true);
                        Controls.RequestPayment.Hide(true);
                        var OwnerID = Data.GetValue("OwnerID");
                        var isTreasuer = User.loginId.toUpperCase() === OwnerID.toUpperCase() || User.IsMemberOf(OwnerID) || User.IsBackupUserOf(OwnerID);
                        Controls.ConfirmPayment.Hide(!isTreasuer);
                        Controls.PaymentType__.SetReadOnly(false);
                        Controls.PaymentDate__.Hide(false);
                        Controls.PaymentDate__.SetReadOnly(false);
                        Controls.PaymentReference__.Hide(false);
                        Controls.PaymentReference__.SetReadOnly(false);
                        Controls.PaymentType__.Hide(false);
                    }
                    else {
                        Controls.Submit_.Hide(isAdmin || status === "To receive" || status === "Auto receive" || status === "Received" || status === "Canceled" || status === "Rejected" || ProcessInstance.state === 50);
                        Controls.RequestPayment.Hide(true);
                        Controls.ConfirmPayment.Hide(true);
                        Controls.PaymentType__.SetReadOnly(true);
                        Controls.PaymentDate__.Hide(false);
                        Controls.PaymentDate__.SetReadOnly(true);
                        Controls.PaymentReference__.Hide(false);
                        Controls.PaymentReference__.SetReadOnly(true);
                    }
                }
            }
            DownPayment.UpdateGui = UpdateGui;
            function IsAsked() {
                var val = Controls.PaymentAmount__.GetValue();
                var percent = Controls.PaymentPercent__.GetValue();
                return (val !== null && val !== 0) || (percent !== null && percent !== 0);
            }
            DownPayment.IsAsked = IsAsked;
            function IsValid() {
                var okAmount = Lib.Purchasing.CheckPO.CheckDownPaymentAmount();
                var okPercent = Lib.Purchasing.CheckPO.CheckDownPaymentPercent();
                var ok = okAmount && okPercent;
                if (ok || Lib.Purchasing.IsLineItemsEmpty()) {
                    Lib.Purchasing.CheckPO.RemoveAllDownPaymentInputError();
                }
                return ok;
            }
            DownPayment.IsValid = IsValid;
            function IsDone() {
                return Variable.GetValueAsString("DownPaymentDone__") === "true";
            }
            DownPayment.IsDone = IsDone;
            function Calculate() {
                DownPayment.CurrentMasterControlName = Variable.GetValueAsString("PaymentCurrentMasterControlName");
                // Do something only if user has set 'amount' or '%' downpayment
                if (DownPayment.CurrentMasterControlName) {
                    var res = void 0;
                    // Set correct input value according the value of Down Payment Master Input
                    if (DownPayment.CurrentMasterControlName == "PaymentAmount__") {
                        res = Lib.Purchasing.CalculateDownPayment(Controls.TotalNetAmount__.GetValue(), Controls.PaymentAmount__.GetValue(), null);
                        Controls.PaymentPercent__.SetValue(isFinite(res.PaymentPercent) ? res.PaymentPercent : 0);
                    }
                    else if (DownPayment.CurrentMasterControlName == "PaymentPercent__") {
                        res = Lib.Purchasing.CalculateDownPayment(Controls.TotalNetAmount__.GetValue(), null, Controls.PaymentPercent__.GetValue());
                        Controls.PaymentAmount__.SetValue(res.PaymentAmount);
                    }
                }
                if (DownPayment.IsValid()) {
                    DownPayment.UpdateGui(Data.GetValue("OrderStatus__"));
                    Lib.Purchasing.WorkflowPO.UpdateRolesSequence(DownPayment.IsAsked());
                }
            }
            DownPayment.Calculate = Calculate;
            function OnChange() {
                Variable.SetValueAsString("PaymentCurrentMasterControlName", this.GetName());
                DownPayment.Calculate();
            }
            DownPayment.OnChange = OnChange;
            function Request() {
                Lib.Purchasing.CheckPO.CheckAll();
                if (Process.ShowFirstError() === null) {
                    // We need to wait the result of PO creation when buyer requests payment
                    ProcessInstance.Approve("RequestPayment");
                }
                return false;
            }
            DownPayment.Request = Request;
            function Confirm() {
                Lib.Purchasing.CheckPO.CheckAll();
                if (Process.ShowFirstError() === null) {
                    ProcessInstance.ApproveAsynchronous("ConfirmPayment");
                }
                return false;
            }
            DownPayment.Confirm = Confirm;
        })(DownPayment = Purchasing.DownPayment || (Purchasing.DownPayment = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
