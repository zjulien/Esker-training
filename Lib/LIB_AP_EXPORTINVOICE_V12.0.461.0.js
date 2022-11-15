/* LIB_DEFINITION{
  "name": "Lib_AP_ExportInvoice_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "library: helpers for updating AP tables.",
  "require": [
    "Sys/Sys_Helpers_String",
    "Lib_AP_V12.0.461.0",
    "Lib_ERP_V12.0.461.0",
    "Lib_ERP_Invoice_V12.0.461.0",
    "Lib_FlexibleFormToXML_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_AP_WorkflowCtrl_V12.0.461.0",
    "Sys/Sys_Parameters",
    "LIB_AP_ERPIncludes_InvoiceExporter_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
         * @namespace InvoiceExporter
         * @memberof Lib.AP
         */
        var InvoiceExporter;
        (function (InvoiceExporter) {
            // XML file name prefix (the process id is appended)
            InvoiceExporter.invoiceXmlFilePrefix = "Invoice";
            // XML file name prefix (the process id is appended)
            InvoiceExporter.invoiceImagePrefix = "InvoiceImage";
            InvoiceExporter.ftpAccountName = Variable.GetValueAsString("FTPAccountName");
            InvoiceExporter.ftpFolderName = Variable.GetValueAsString("FTPFolderName");
            InvoiceExporter.xmlEncoding = "UTF-8";
            InvoiceExporter.exportMethod = Sys.Parameters.GetInstance("AP").GetParameter("ERPExportMethod");
            InvoiceExporter.exportName = {
                SFTP: Variable.GetValueAsString("SFTPConfigurationName"),
                PROCESS: Sys.Parameters.GetInstance("AP").GetParameter("ERPNotifierProcessName")
            };
            InvoiceExporter.fieldsRules = null;
            InvoiceExporter.tablesRules = null;
            InvoiceExporter.exportMode = 0;
            var modifiedNodeNameMappings;
            var fieldValuesMapping;
            // Role of contributor doing the action
            InvoiceExporter.roleCurrentContributor = null;
            /**
             * Return true if a SFTP configuration is settled
             * @memberof Lib.AP.InvoiceExporter
             * @returns {boolean}
             */
            function IsEnable() {
                return Boolean(InvoiceExporter.exportMethod && InvoiceExporter.exportName[InvoiceExporter.exportMethod]);
            }
            InvoiceExporter.IsEnable = IsEnable;
            /**
             * Construct output path for the current SFTP configuration
             * @memberof Lib.AP.InvoiceExporter
             * @returns {string}
             */
            function GetOutputPath() {
                var path = "";
                if (InvoiceExporter.ftpAccountName && InvoiceExporter.ftpAccountName !== "") {
                    path += InvoiceExporter.ftpAccountName;
                    path += "\\";
                }
                if (InvoiceExporter.ftpFolderName && InvoiceExporter.ftpFolderName !== "") {
                    path += InvoiceExporter.ftpFolderName;
                    path += "\\";
                }
                return path;
            }
            InvoiceExporter.GetOutputPath = GetOutputPath;
            /**
            * Compute the full name of the xml file
            **/
            function GetInvoiceXmlFilename() {
                var filename = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.InvoiceExporter.GetXmlFilename");
                filename = filename || Lib.AP.GetInvoiceExporter().GetFilename();
                if (!filename) {
                    // FT-025653 - Dynamic discounting with generic ERP
                    if (Lib.ERP.InvoiceExporter.isDynamicDiscountingUpdated()) {
                        filename = "Invoice".concat(Data.GetValue("MSN"), "Update");
                    }
                    else {
                        var invoiceXmlFileSuffix = Data.GetValue("PaymentApprovalStatus__") === "Pending" ? "ApprovalPending" : "";
                        filename = InvoiceExporter.invoiceXmlFilePrefix + Data.GetValue("MSN") + invoiceXmlFileSuffix;
                    }
                }
                return filename;
            }
            InvoiceExporter.GetInvoiceXmlFilename = GetInvoiceXmlFilename;
            /**
            * Initialize variables used to set the option in Lib.FlexibleFormToXML
            */
            function InitExportRules() {
                var invoiceExporter = Lib.AP.GetInvoiceExporter();
                InvoiceExporter.fieldsRules = invoiceExporter.GetFieldsRules(Data.GetValue("InvoiceType__"));
                InvoiceExporter.tablesRules = invoiceExporter.GetTablesRules();
                InvoiceExporter.exportMode = invoiceExporter.GetExportMode();
                modifiedNodeNameMappings = invoiceExporter.GetModifiedNodeNameMappings();
                fieldValuesMapping = invoiceExporter.GetFieldValuesMapping();
                InvoiceExporter.fieldsRules = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.InvoiceExporter.GetFieldsRules", InvoiceExporter.exportMode, InvoiceExporter.fieldsRules) || InvoiceExporter.fieldsRules;
                InvoiceExporter.tablesRules = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.InvoiceExporter.GetTablesRules", InvoiceExporter.exportMode, InvoiceExporter.tablesRules) || InvoiceExporter.tablesRules;
                modifiedNodeNameMappings = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.InvoiceExporter.GetModifiedNodeNameMappings", InvoiceExporter.exportMode, modifiedNodeNameMappings) || modifiedNodeNameMappings;
                fieldValuesMapping = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.InvoiceExporter.GetFieldValuesMapping", fieldValuesMapping) || fieldValuesMapping;
            }
            InvoiceExporter.InitExportRules = InitExportRules;
            /**
             * Attach the invoice XML file to a CopyFile transport.
             * @memberof Lib.AP.InvoiceExporter
             * @param {object} transport A xTransport on which the file will be attached
             * @param {string} attachName The name of the attachment
             */
            function AttachInvoiceXmlFile(transport, attachName) {
                //FT-009975 - Create tempFile to avoid memory consumption issue
                var tempInvoiceXml = TemporaryFile.CreateFile("xml", InvoiceExporter.xmlEncoding === "UTF-16" ? "utf16" : "utf8");
                Lib.AP.InvoiceExporter.InitExportRules();
                Lib.FlexibleFormToXML.setOptions(InvoiceExporter.xmlEncoding, "Invoice", InvoiceExporter.fieldsRules, InvoiceExporter.tablesRules, Data, ["OrderNumber__"], InvoiceExporter.exportMode, modifiedNodeNameMappings, null, fieldValuesMapping);
                Lib.FlexibleFormToXML.GetXMLFile(tempInvoiceXml, Lib.AP.InvoiceExporter.CustomiseInvoiceXmlFile);
                //FT-009975 - Attach temporary file instead of using string
                // Attaches the temporary File to the transport.
                var attachVars = transport.AddAttachEx(tempInvoiceXml).GetVars();
                if (InvoiceExporter.xmlEncoding === "UTF-16") {
                    attachVars.AddValue_String("AttachEncoding", "UNICODE", true);
                }
                else {
                    attachVars.AddValue_String("AttachEncoding", "UTF-8", true);
                }
                attachVars.AddValue_String("AttachOutputName", attachName, true);
                attachVars.AddValue_String("AttachToDisplay", "converted", true);
            }
            InvoiceExporter.AttachInvoiceXmlFile = AttachInvoiceXmlFile;
            /**
             * Return the GDRTiffFile of the current processedDocument
             * @memberof Lib.AP.InvoiceExporter
             * @return {string} image file
             */
            function GetDocumentImage() {
                var documentImageFile = null;
                var attach = Attach.GetProcessedDocument();
                if (attach) {
                    var attachVars = attach.GetVars();
                    documentImageFile = attachVars.GetValue_FileRef("GDRTiffFile", 0);
                    if (!documentImageFile) {
                        Log.Info("GetDocumentImage - GDRTiffFile not found, trying with converted file");
                        documentImageFile = attachVars.GetValue_FileRef("ConvertedFiles", 0);
                    }
                    if (!documentImageFile) {
                        Log.Info("GetDocumentImage - ConvertedFiles not found, using submitted file");
                        documentImageFile = attachVars.GetValue_FileRef("FileContent", 0);
                    }
                }
                return documentImageFile;
            }
            InvoiceExporter.GetDocumentImage = GetDocumentImage;
            /**
            * Get the filename without extension of the image to attach to the transport
            * @returns {string} A string representing the filename without extension
            */
            function GetInvoiceImageFilename() {
                var filename = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.InvoiceExporter.GetImageFilename");
                if (!filename) {
                    filename = InvoiceExporter.invoiceImagePrefix + Data.GetValue("MSN");
                }
                return filename;
            }
            InvoiceExporter.GetInvoiceImageFilename = GetInvoiceImageFilename;
            /**
             * Attach the invoice image file to a CopyFile transport.
             * @param {object} transport A xTransport on which the file will be attached
             * @param {string} exportImageFormat the expected format (TIF or PDF)
             * @param {string} attachName The name of the attachment
             */
            function AttachInvoiceImageFile(transport, exportImageFormat, attachName) {
                var invoiceExporter = Lib.AP.GetInvoiceExporter();
                invoiceExporter.AttachInvoiceImageFile(transport, exportImageFormat, attachName);
            }
            InvoiceExporter.AttachInvoiceImageFile = AttachInvoiceImageFile;
            /**
             * Create a CopyFile transport to copy invoice data in a SFTP folder
             * @memberof Lib.AP.InvoiceExporter
             * @param {boolean} exportImage a flag to indicate if we want to copy the invoice image file
             * @param {string} exportImageFormat the format of image expected (empty, tif or pdf)
             */
            function ToSFTP(exportImage, exportImageFormat) {
                try {
                    var copyFileTransport = Process.CreateTransport("Copy");
                    if (copyFileTransport) {
                        var vars = copyFileTransport.GetUninheritedVars();
                        vars.AddValue_String("CopyPath", InvoiceExporter.exportName.SFTP, true);
                        vars.AddValue_String("CreateIfNotExist", 1, true);
                        // Update posting date
                        Lib.AP.InvoiceExporter.UpdatePostingDate();
                        // Attach the XML file to the Copy transport
                        Lib.AP.InvoiceExporter.AttachInvoiceXmlFile(copyFileTransport, Lib.AP.InvoiceExporter.GetOutputPath() + Lib.AP.InvoiceExporter.GetInvoiceXmlFilename());
                        // Attach the invoice image file to the Copy transport
                        if (exportImage) {
                            Lib.AP.InvoiceExporter.AttachInvoiceImageFile(copyFileTransport, exportImageFormat, Lib.AP.InvoiceExporter.GetOutputPath() + Lib.AP.InvoiceExporter.GetInvoiceImageFilename());
                        }
                    }
                    else {
                        Log.Error("Unable to create transport");
                    }
                    Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.beforePost);
                    copyFileTransport.Process();
                    Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.afterPost);
                    if (copyFileTransport) {
                        Log.Info("CopyFile RuidEx : " + copyFileTransport.GetUninheritedVars().GetValue_String("RuidEx", 0));
                    }
                }
                catch (err) {
                    Log.Error(err);
                    throw Language.Translate("_Unable to send the invoice XML data file to the specified SFTP configuration, please check your configuration.");
                }
            }
            InvoiceExporter.ToSFTP = ToSFTP;
            function ToProcess(exportImage, exportImageFormat) {
                var userLogin = Sys.Parameters.GetInstance("AP").GetParameter("ERPNotifierOwnerLogin");
                var process = userLogin ? Process.CreateProcessInstanceForUser(InvoiceExporter.exportName.PROCESS, userLogin) : Process.CreateProcessInstance(InvoiceExporter.exportName.PROCESS);
                if (process) {
                    var vars = process.GetUninheritedVars();
                    vars.AddValue_String("CompanyCode__", Data.GetValue("CompanyCode__"), true);
                    vars.AddValue_String("InvoiceNumber__", Data.GetValue("InvoiceNumber__"), true);
                    vars.AddValue_String("VendorNumber__", Data.GetValue("VendorNumber__"), true);
                    vars.AddValue_Double("InvoiceAmount__", Data.GetValue("InvoiceAmount__"), true);
                    vars.AddValue_Double("NetAmount__", Data.GetValue("NetAmount__"), true);
                    vars.AddValue_String("InvoiceCurrency__", Data.GetValue("InvoiceCurrency__"), true);
                    // Update posting date
                    Lib.AP.InvoiceExporter.UpdatePostingDate();
                    // Attach the XML file to process
                    Lib.AP.InvoiceExporter.AttachInvoiceXmlFile(process, Lib.AP.InvoiceExporter.GetInvoiceXmlFilename());
                    // Attach the invoice image file to process
                    if (exportImage) {
                        Lib.AP.InvoiceExporter.AttachInvoiceImageFile(process, exportImageFormat, Lib.AP.InvoiceExporter.GetInvoiceImageFilename());
                    }
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.InvoiceExporter.CustomizeERPNotifier", process);
                    Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.beforePost);
                    process.Process();
                    Transaction.Write(Lib.ERP.Invoice.transaction.keys.post, Lib.ERP.Invoice.transaction.values.afterPost);
                    Log.Info("New Process RuidEx : " + vars.GetValue_String("RuidEx", 0));
                }
                else {
                    Log.Error("Unable to create process " + InvoiceExporter.exportName.PROCESS);
                    throw Language.Translate("_Unable to send the invoice XML data file to the specified process, please check your configuration.");
                }
            }
            InvoiceExporter.ToProcess = ToProcess;
            var InvoiceExportConfig = /** @class */ (function () {
                function InvoiceExportConfig() {
                    this.exportInvoice = false;
                    this.exportImage = false;
                    this.exportImageFormat = "";
                }
                return InvoiceExportConfig;
            }());
            /**
             * Determine if the invoice has to be exported
             * @memberof Lib.AP.InvoiceExporter
             * @return {boolean} flag to indicate that the invoice has to be exported
             */
            function ShouldExportXML(currentRole, workflowFinished) {
                var ret = new InvoiceExportConfig();
                // Check no open transaction exists for this invoice
                if (Transaction.Read(Lib.ERP.Invoice.transaction.keys.post) === Lib.ERP.Invoice.transaction.values.beforePost) {
                    return ret;
                }
                var postCondition = currentRole === Lib.AP.WorkflowCtrl.roles.apStart && Lib.AP.WorkflowCtrl.GetNbRemainingControllers() === 0;
                // Do not create the xml file twice if the transaction afterPost has been found
                if (postCondition && Transaction.Read(Lib.ERP.Invoice.transaction.keys.post) === Lib.ERP.Invoice.transaction.values.afterPost) {
                    return ret;
                }
                // FT-025653 - Dynamic discounting with generic ERP: Can update if vendor submit a dynamic discount
                var updateCondition = currentRole === Lib.AP.WorkflowCtrl.roles.vendor;
                var endCondition = workflowFinished;
                var invoiceExporter = Lib.AP.GetInvoiceExporter();
                var allowExport = invoiceExporter.ShouldExportXML(postCondition, endCondition, updateCondition);
                var allowExportWhenArchiving = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.InvoiceExporter.ShouldExportXMLWhenArchiving") || false;
                if (postCondition || endCondition || updateCondition) {
                    if (Data.GetValue("ManualLink__")) {
                        ret.exportInvoice = allowExport && endCondition;
                        if (postCondition) {
                            ret.exportInvoice = allowExportWhenArchiving && !Data.GetValue("ERPPostingDate__");
                        }
                        ret.exportImage = false;
                    }
                    else if (allowExport) {
                        ret.exportInvoice = true;
                        ret.exportImage = !Data.GetValue("ERPPostingDate__");
                    }
                }
                ret.exportImageFormat = Sys.Parameters.GetInstance("AP").GetParameter("ExportInvoiceImageFormat");
                ret.exportImage = ret.exportImage && !Lib.ERP.IsSAP() && ret.exportImageFormat !== "";
                // Check ERP-specific value
                if (ret.exportImage) {
                    ret.exportImage = ret.exportImage && Lib.AP.GetInvoiceExporter().GetExportInvoiceImage();
                }
                return ret;
            }
            InvoiceExporter.ShouldExportXML = ShouldExportXML;
            /**
             * Perform the export of invoice data based on the Payment Approval Mode
             * @memberof Lib.AP.InvoiceExporter
             * @param {string} currentRole the actual action in the workflow
             * @param {boolean} workflowFinished a flag to indicate if the approval workflow is finished
             * @return {boolean} flag to indicate that the invoice and its image have been exported
             */
            function ExportIfNeeded(currentRole, workflowFinished) {
                InvoiceExporter.roleCurrentContributor = currentRole;
                var ret = Lib.AP.InvoiceExporter.ShouldExportXML(currentRole, workflowFinished);
                if (ret.exportInvoice) {
                    if (Lib.AP.InvoiceExporter.IsEnable()) {
                        switch (InvoiceExporter.exportMethod) {
                            case "SFTP":
                                Lib.AP.InvoiceExporter.ToSFTP(ret.exportImage, ret.exportImageFormat);
                                break;
                            case "PROCESS":
                                Lib.AP.InvoiceExporter.ToProcess(ret.exportImage, ret.exportImageFormat);
                                break;
                            default:
                                Lib.AP.InvoiceExporter.UpdatePostingDate();
                                break;
                        }
                    }
                    else {
                        Lib.AP.InvoiceExporter.UpdatePostingDate();
                    }
                    Variable.SetValueAsString("ExportInvoiceToXML", false);
                }
                // AP - FT-024740 - Invoice should be processed even after a conncont crash
                // Handle customdataConn crash when the execution of validation script is completed and invoice is already exported but the record is not saved
                // So consider the export is already done and use the same behavior
                else if (Data.GetValue("RecordAbortedCount") > 0 &&
                    currentRole === Lib.AP.WorkflowCtrl.roles.apStart && Lib.AP.WorkflowCtrl.GetNbRemainingControllers() === 0 &&
                    Transaction.Read(Lib.ERP.Invoice.transaction.keys.post) === Lib.ERP.Invoice.transaction.values.afterPost) {
                    Log.Warn("Result of a probably customDataConn crash - Apply same behavior has the export invoice XML has been doned");
                    Lib.AP.InvoiceExporter.UpdatePostingDate();
                    Variable.SetValueAsString("ExportInvoiceToXML", false);
                    ret.exportInvoice = true;
                }
                return ret.exportInvoice;
            }
            InvoiceExporter.ExportIfNeeded = ExportIfNeeded;
            /**
             * Customize the invoice xml file
             * @memberof Lib.AP.InvoiceExporter
             * @param {ConversionLib} flexibleFormToXMLConverter the converter used to generate XML from flexible form
             * @param {File} xmlTempFile the xml file
             */
            function CustomiseInvoiceXmlFile(flexibleFormToXMLConverter, xmlTempFile) {
                var xmlDoc = this.Helpers.XML.CreateXmlDocument();
                // Add link URLs
                var validationURL = Data.GetValue("ValidationUrl");
                flexibleFormToXMLConverter.AddNode(xmlDoc, "InvoiceDocumentURL", validationURL);
                var imageURL = null;
                if (Attach.GetNbAttach() > 0) {
                    imageURL = validationURL.replace("ManageDocumentsCheck.link", "attach.file");
                    imageURL = imageURL.replace("ruid=", "id=");
                    imageURL = Sys.Helpers.String.AddURLParameter(imageURL, "attachment", Lib.AP.InvoiceExporter.GetProcessedDocumentIndex());
                }
                flexibleFormToXMLConverter.AddNode(xmlDoc, "InvoiceImageURL", imageURL);
                var invoiceExporter = Lib.AP.GetInvoiceExporter();
                invoiceExporter.CustomiseInvoiceXmlDoc(Lib.FlexibleFormToXML, xmlDoc);
                TemporaryFile.Append(xmlTempFile, xmlDoc.toString());
                invoiceExporter.CustomiseInvoiceXmlFile(flexibleFormToXMLConverter, xmlTempFile);
            }
            InvoiceExporter.CustomiseInvoiceXmlFile = CustomiseInvoiceXmlFile;
            function GetProcessedDocumentIndex() {
                var nbAttach = Attach.GetNbAttach();
                for (var i = 0; i < nbAttach; i++) {
                    if (Attach.IsProcessedDocument(i)) {
                        return i;
                    }
                }
                return 0;
            }
            InvoiceExporter.GetProcessedDocumentIndex = GetProcessedDocumentIndex;
            function UpdatePostingDate() {
                if (!Data.GetValue("ERPPostingDate__")) {
                    var today = new Date();
                    Data.SetValue("ERPPostingDate__", today);
                    Data.SetValue("ERPLinkingDate__", today);
                }
            }
            InvoiceExporter.UpdatePostingDate = UpdatePostingDate;
        })(InvoiceExporter = AP.InvoiceExporter || (AP.InvoiceExporter = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
