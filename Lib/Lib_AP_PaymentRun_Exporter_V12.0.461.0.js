///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_AP_PaymentRun_Exporter_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library managing the export of paid invoices in payment proposals",
  "require": [
    "Sys/Sys",
    "Sys/Sys_Parameters",
    "Lib_AP_PaymentRunProvider_Manager_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var PaymentRunExporter;
        (function (PaymentRunExporter) {
            var PaymentRunXMLNamePrefix = "InvoicesPayment_";
            PaymentRunExporter.exportMethod = Sys.Parameters.GetInstance("AP").GetParameter("ERPExportMethod");
            PaymentRunExporter.exportName = {
                SFTP: Variable.GetValueAsString("SFTPConfigurationName"),
                PROCESS: Sys.Parameters.GetInstance("AP").GetParameter("ERPNotifierPaymentRunProcessName", "ERP Notifier Payment Run")
            };
            /**
             * Perform the export of invoice data based on the Payment Approval Mode
             * @memberof Lib.AP.PaymentRunExporter
             * @param {File} fileXML xml file representing the payment run
             * @return {boolean} flag to indicate that the invoice and its image have been exported
             */
            function ExportInvoiceForERP(fileXML) {
                switch (PaymentRunExporter.exportMethod) {
                    case "SFTP":
                        ToFTP(fileXML);
                        break;
                    case "PROCESS":
                        ToProcess(fileXML);
                        break;
                    default:
                        break;
                }
                return true;
            }
            PaymentRunExporter.ExportInvoiceForERP = ExportInvoiceForERP;
            function ToProcess(fileXML) {
                var userLogin = Sys.Parameters.GetInstance("AP").GetParameter("ERPNotifierPaymentRunLogin");
                var transport = userLogin ? Process.CreateProcessInstanceForUser(PaymentRunExporter.exportName.PROCESS, userLogin) : Process.CreateProcessInstance(PaymentRunExporter.exportName.PROCESS);
                if (transport) {
                    try {
                        Lib.AP.PaymentRunExporter.AttachXmlFile(transport, fileXML);
                        transport.Process();
                        return true;
                    }
                    catch (e) {
                        Log.Error(e);
                        return false;
                    }
                }
                else {
                    Log.Info("Could not create process instance '".concat(PaymentRunExporter.exportName.PROCESS, "'"));
                    return false;
                }
            }
            function ToFTP(fileXML) {
                try {
                    var copyFileTransport = Process.CreateTransport("Copy");
                    if (copyFileTransport) {
                        var vars = copyFileTransport.GetUninheritedVars();
                        vars.AddValue_String("CopyPath", PaymentRunExporter.exportName.SFTP, true);
                        vars.AddValue_String("CreateIfNotExist", 1, true);
                        Lib.AP.PaymentRunExporter.AttachXmlFile(copyFileTransport, fileXML);
                    }
                    else {
                        Log.Error("Unable to create transport");
                    }
                    copyFileTransport.Process();
                    if (copyFileTransport) {
                        Log.Info("CopyFile RuidEx : " + copyFileTransport.GetUninheritedVars().GetValue_String("RuidEx", 0));
                    }
                }
                catch (err) {
                    Log.Error(err);
                    throw Language.Translate("_Unable to send the invoice XML data file to the specified SFTP configuration, please check your configuration.");
                }
            }
            /**
             * Construct output path for the current SFTP configuration
             * @memberof Lib.AP.PaymentRunExporter
             * @returns {string}
             */
            function GetOutputPath() {
                var ftpAccountName = Variable.GetValueAsString("FTPAccountName");
                var ftpFolderName = Variable.GetValueAsString("FTPFolderName");
                var path = "";
                if (ftpAccountName && ftpAccountName !== "") {
                    path += ftpAccountName;
                    path += "\\";
                }
                if (ftpFolderName && ftpFolderName !== "") {
                    path += ftpFolderName;
                    path += "\\";
                }
                return path;
            }
            PaymentRunExporter.GetOutputPath = GetOutputPath;
            function AttachXmlFile(transport, fileXML) {
                // Attach the XML file to the Copy transport
                //Lib.AP.InvoiceExporter.AttachInvoiceXmlFile(copyFileTransport, Lib.AP.InvoiceExporter.GetOutputPath() + fileXMLName);
                var attachVars = transport.AddAttachEx(fileXML).GetVars();
                attachVars.AddValue_String("AttachEncoding", "UTF-8", true);
                attachVars.AddValue_String("AttachOutputName", Lib.AP.PaymentRunExporter.GetOutputPath() + PaymentRunXMLNamePrefix + Data.GetValue("MSN"), true);
                attachVars.AddValue_String("AttachToDisplay", "converted", true);
            }
            PaymentRunExporter.AttachXmlFile = AttachXmlFile;
            function BeginExportXML() {
                if (IsExportDisabled()) {
                    return;
                }
                PaymentRunExporter.tempFile = TemporaryFile.CreateFile("xml", "utf8");
                if (PaymentRunExporter.tempFile) {
                    TemporaryFile.Append(PaymentRunExporter.tempFile, "<?xml version=\"1.0\" encoding=\"UTF-8\"?><InvoicesPayment  RuidEx=\"".concat(Data.GetValue("RuidEx"), "\">"));
                }
                else {
                    Log.Error("No export file created for this payment proposal");
                }
            }
            PaymentRunExporter.BeginExportXML = BeginExportXML;
            function InvoiceExportXML(ruidEx, item, paymentInfos) {
                if (IsExportDisabled()) {
                    return;
                }
                if (PaymentRunExporter.tempFile) {
                    TemporaryFile.Append(PaymentRunExporter.tempFile, "<InvoicePayment  RuidEx=\"".concat(ruidEx, "\"><CompanyCode>").concat(item.GetValue("CompanyCode__"), "</CompanyCode><VendorNumber>").concat(item.GetValue("VendorNumber__"), "</VendorNumber><InvoiceNumber>").concat(item.GetValue("InvoiceNumber__"), "</InvoiceNumber><InvoiceAmount>").concat(item.GetValue("InvoiceAmount__"), "</InvoiceAmount><Status>").concat(paymentInfos.Status, "</Status><PaymentDate>").concat(paymentInfos.PaymentDate, "</PaymentDate><PaymentReference>").concat(paymentInfos.PaymentReference, "</PaymentReference><PaymentMethod>").concat(paymentInfos.PaymentMethod, "</PaymentMethod>").concat(Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRunProvider.AddInvoiceInformation", item, paymentInfos) || "", "</InvoicePayment>"));
                }
                else {
                    Log.Error("No export file created for this payment proposal");
                }
            }
            PaymentRunExporter.InvoiceExportXML = InvoiceExportXML;
            function FinalizeExportXML() {
                if (IsExportDisabled()) {
                    return;
                }
                if (PaymentRunExporter.tempFile) {
                    TemporaryFile.Append(PaymentRunExporter.tempFile, "</InvoicesPayment>");
                    ExportInvoiceForERP(PaymentRunExporter.tempFile);
                }
                else {
                    Log.Error("No export file created for this payment proposal");
                }
            }
            PaymentRunExporter.FinalizeExportXML = FinalizeExportXML;
            function IsExportDisabled() {
                return Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRunProvider.IsPaymentRunXMLExportDisabled") === true;
            }
            PaymentRunExporter.IsExportDisabled = IsExportDisabled;
        })(PaymentRunExporter = AP.PaymentRunExporter || (AP.PaymentRunExporter = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
