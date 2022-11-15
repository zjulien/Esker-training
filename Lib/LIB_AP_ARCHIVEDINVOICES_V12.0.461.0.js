/* LIB_DEFINITION{
  "name": "Lib_AP_ArchivedInvoices_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "AP library",
  "require": [
    "Lib_AP_V12.0.461.0",
    "Lib_AP_WorkflowCtrl_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var ArchivedInvoices;
        (function (ArchivedInvoices) {
            function updateLastArchiveInformations(login) {
                Controls.LastArchiveEditionDate__.SetValue(new Date());
                Controls.LastArchiveEditor__.SetValue(login);
            }
            function IsPostedAndToVerify() {
                var isPosted = Data.GetValue("ERPInvoiceNumber__");
                var status = Data.GetValue("InvoiceStatus__");
                var state = Data.GetValue("State");
                if (!isPosted || state !== "70") {
                    return false;
                }
                return status === Lib.AP.InvoiceStatus.ToVerify || status === Lib.AP.InvoiceStatus.SetAside;
            }
            ArchivedInvoices.IsPostedAndToVerify = IsPostedAndToVerify;
            function SetEditingLayoutIfNeeded() {
                if (ProcessInstance.isEditing) {
                    Controls.VendorInformation.SetReadOnly(false);
                    Controls.HeaderDataPanel.SetReadOnly(false);
                    Controls.LineItems__.Amount__.SetReadOnly(false);
                    Controls.LineItems__.Quantity__.SetReadOnly(false);
                    Controls.UpdatePayment.Hide(true);
                    Controls.ApproversList__.HideTableRowDelete(true);
                    Controls.ApproversList__.HideTableRowAdd(true);
                }
                if (Controls.InvoiceStatus__.GetValue() === Lib.AP.InvoiceStatus.Reversed) {
                    Controls.ReverseInvoice.Hide(true);
                }
                else if (!ProcessInstance.isEditing && !IsPostedAndToVerify()) {
                    Controls.ReverseInvoice.Hide(true);
                }
                else {
                    Controls.ReverseInvoice.Hide(false);
                }
            }
            ArchivedInvoices.SetEditingLayoutIfNeeded = SetEditingLayoutIfNeeded;
            function OnSave() {
                updateLastArchiveInformations(User.loginId);
                var editor = {
                    login: User.loginId,
                    emailAddress: User.emailAddress,
                    displayName: User.fullName
                };
                if (Data.GetActionName() !== "ReverseInvoice") {
                    Lib.AP.WorkflowCtrl.UpdateAndAddPostWorkflowContributor(editor, Lib.AP.WorkflowCtrl.roles.apEnd, "edit", Language.CreateLazyTranslation("_Edit invoice"));
                }
                else {
                    Lib.AP.WorkflowCtrl.UpdateAndAddPostWorkflowContributor(editor, Lib.AP.WorkflowCtrl.roles.apEnd, "reverseInvoice", Language.CreateLazyTranslation("_Reverse invoice history"));
                }
            }
            ArchivedInvoices.OnSave = OnSave;
            /**
             * Update the status and save the archive
             */
            function ReverseInvoice() {
                Data.SetValue("InvoiceStatus__", Lib.AP.InvoiceStatus.Reversed);
                var vendorPortalRuidEx = Data.GetValue("PortalRuidEx__");
                var vendorInvoiceRuidEx = Data.GetValue("RuidEx");
                var companyCode = Data.GetValue("CompanyCode__");
                Process.CreateProcessInstance("Reverse Customer Invoice", null, { "CustomerInvoiceRuidEx": vendorPortalRuidEx, "VendorInvoiceRuidEx": vendorInvoiceRuidEx, "CompanyCode": companyCode });
                Controls.SaveEditing_.Click();
            }
            ArchivedInvoices.ReverseInvoice = ReverseInvoice;
        })(ArchivedInvoices = AP.ArchivedInvoices || (AP.ArchivedInvoices = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
