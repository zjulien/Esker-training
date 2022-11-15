/* LIB_DEFINITION{
  "name": "Lib_VendorRegistration_VendorExporter_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Vendor Managment exporter server side library",
  "require": [
    "Sys/Sys_Helpers_String",
    "Lib_FlexibleFormToXML_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_ERP_V12.0.461.0",
    "Sys/Sys_Parameters"
  ]
}*/
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        /**
         * @namespace VendorExporter
         * @memberof Lib.VendorRegistration
         */
        var VendorExporter;
        (function (VendorExporter) {
            var exportRedisKey = "VendorRegistrationExport";
            var xmlRootNode = "VendorRegistration";
            var exportRedisStates = {
                exported: "exported"
            };
            var vendorRegistrationXmlFilePrefix = "VendorRegistration";
            var cacheXMLEncoding = null;
            var cacheFieldsRules = null;
            var cacheTablesRules = null;
            var cacheExportMode = null;
            var cacheModifiedNodeNameMappings = null;
            var cacheFieldValuesMapping = null;
            function CleanCache() {
                cacheXMLEncoding = null;
                cacheFieldsRules = null;
                cacheTablesRules = null;
                cacheExportMode = null;
                cacheModifiedNodeNameMappings = null;
                cacheFieldValuesMapping = null;
            }
            VendorExporter.CleanCache = CleanCache;
            /**
             * Return Vendor management XML file encoding
             * @memberof Lib.VendorRegistration.VendorExporter
             * @returns {string} XML file encoding
             */
            function GetEncoding() {
                if (cacheXMLEncoding !== null) {
                    return cacheXMLEncoding;
                }
                var defaultEncoding = "UTF-8";
                cacheXMLEncoding = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetEncoding", defaultEncoding) || defaultEncoding;
                if (cacheXMLEncoding !== "UTF-16" && cacheXMLEncoding !== "UTF-8") {
                    Log.Warn("XML Encoding ".concat(cacheXMLEncoding, " is invalid, fallback to value ").concat(defaultEncoding));
                    cacheXMLEncoding = defaultEncoding;
                }
                return cacheXMLEncoding;
            }
            VendorExporter.GetEncoding = GetEncoding;
            /**
             * Return Vendor management XML temporary file encoding
             * @memberof Lib.VendorRegistration.VendorExporter
             * @returns {string} Temporary XML file encoding
             */
            function GetTemporaryFileEncoding() {
                var temporaryFileEncoding = "utf8";
                var encoding = GetEncoding();
                if (!encoding) {
                    return temporaryFileEncoding;
                }
                if (encoding.toUpperCase() === "UTF-16") {
                    return "utf16";
                }
                return temporaryFileEncoding;
            }
            VendorExporter.GetTemporaryFileEncoding = GetTemporaryFileEncoding;
            /**
             * Return Vendor management XML attach file encoding
             * @memberof Lib.VendorRegistration.VendorExporter
             * @returns {string} Temporary XML file encoding
             */
            function GetAttachEncoding() {
                var temporaryFileEncoding = "UTF-8";
                var encoding = GetEncoding();
                if (!encoding) {
                    return temporaryFileEncoding;
                }
                if (encoding.toUpperCase() === "UTF-16") {
                    return "UNICODE";
                }
                return temporaryFileEncoding;
            }
            VendorExporter.GetAttachEncoding = GetAttachEncoding;
            /**
             * Return Vendor management export mode
             * @memberof Lib.VendorRegistration.VendorExporter
             * @returns {Lib.FlexibleFormToXML.ExportMode}
             */
            function GetExportMode() {
                if (cacheExportMode !== null) {
                    return cacheExportMode;
                }
                var defaultExportMode = 0; // Lib.FlexibleFormToXML.ExportMode.allExcept
                cacheExportMode = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetExportMode", defaultExportMode) || defaultExportMode;
                return cacheExportMode;
            }
            VendorExporter.GetExportMode = GetExportMode;
            /**
             * Return Vendor management fields rules
             * @memberof Lib.VendorRegistration.VendorExporter
             * @returns {Lib.FlexibleFormToXML.FieldsRules}
             */
            function GetFieldsRules() {
                if (cacheFieldsRules) {
                    return cacheFieldsRules;
                }
                var defaultFieldsRule = {
                    includedFields: [],
                    excludedFields: ["TouchlessDone__"]
                };
                cacheFieldsRules = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetFieldsRules", GetExportMode(), defaultFieldsRule) || defaultFieldsRule;
                return cacheFieldsRules;
            }
            VendorExporter.GetFieldsRules = GetFieldsRules;
            /**
             * Return Vendor management tables rules
             * @memberof Lib.VendorRegistration.VendorExporter
             * @returns {Lib.FlexibleFormToXML.TablesRules}
             */
            function GetTablesRules() {
                if (cacheTablesRules) {
                    return cacheTablesRules;
                }
                var defaultTablesRule = [
                    { name: "OfficersTable__" },
                    { name: "CompanyBankAccountsTable__" }
                ];
                cacheTablesRules = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetTablesRules", GetExportMode(), defaultTablesRule) || defaultTablesRule;
                return cacheTablesRules;
            }
            VendorExporter.GetTablesRules = GetTablesRules;
            /**
             * Return Vendor management fields name mapping
             * @memberof Lib.VendorRegistration.VendorExporter
             * @returns {Lib.FlexibleFormToXML.ModifiedNodeNameMappings}
             */
            function GetModifiedNodeNameMappings() {
                if (cacheModifiedNodeNameMappings) {
                    return cacheModifiedNodeNameMappings;
                }
                var defaultModifiedNodeNameMappings = {};
                cacheModifiedNodeNameMappings = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetModifiedNodeMapping", GetExportMode(), defaultModifiedNodeNameMappings) || defaultModifiedNodeNameMappings;
                return cacheModifiedNodeNameMappings;
            }
            VendorExporter.GetModifiedNodeNameMappings = GetModifiedNodeNameMappings;
            /**
             * Return Vendor management fields Fields value mapping
             * @memberof Lib.VendorRegistration.VendorExporter
             * @returns {Lib.FlexibleFormToXML.ModifiedFieldValuesMapping}
             */
            function GetFieldValuesMapping() {
                if (cacheFieldValuesMapping) {
                    return cacheFieldValuesMapping;
                }
                var defaultFieldValuesMapping = {};
                cacheFieldValuesMapping = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetFieldValuesMapping", defaultFieldValuesMapping) || defaultFieldValuesMapping;
                return cacheFieldValuesMapping;
            }
            VendorExporter.GetFieldValuesMapping = GetFieldValuesMapping;
            /**
            * Returns true if the feature VendorERPConnection is enable in process variable / configurator / lib_parameters_p2p
            */
            function IsERPExportEnabled() {
                return Sys.Parameters.GetInstance("AP").GetParameter("EnableVendorERPConnection", "0") === "1";
            }
            VendorExporter.IsERPExportEnabled = IsERPExportEnabled;
            /**
            * Removes the redis transaction pushed when xml has been exported
            */
            function DeleteExportTransaction() {
                Transaction.Delete(exportRedisKey);
            }
            VendorExporter.DeleteExportTransaction = DeleteExportTransaction;
            /**
            * Returns true if redis transaction xml exported found
            */
            function IsAlreadyExportedXMLRedisTransaction() {
                var exportTransaction = Transaction.Read(exportRedisKey);
                return exportTransaction && exportTransaction === exportRedisStates.exported;
            }
            VendorExporter.IsAlreadyExportedXMLRedisTransaction = IsAlreadyExportedXMLRedisTransaction;
            /**
            * Can we export xml file (test if feature activated and no redis transaction)
            */
            function ShouldExportAndAttachXMLFile() {
                return Lib.VendorRegistration.VendorExporter.IsERPExportEnabled() &&
                    !Lib.VendorRegistration.VendorExporter.IsAlreadyExportedXMLRedisTransaction();
            }
            VendorExporter.ShouldExportAndAttachXMLFile = ShouldExportAndAttachXMLFile;
            function DeleteExportedXMLRedisTransaction() {
                Transaction.Delete(exportRedisKey);
            }
            VendorExporter.DeleteExportedXMLRedisTransaction = DeleteExportedXMLRedisTransaction;
            /**
             * Attach the invoice XML file to a CopyFile transport.
             * @memberof Lib.VendorRegistration.VendorExporter
             * @param {object} transport A xTransport on which the file will be attached
             * @param {string} attachName The name of the attachment
             */
            function AttachXmlFile(transport, attachName) {
                var tempInvoiceXml = TemporaryFile.CreateFile("xml", Lib.VendorRegistration.VendorExporter.GetTemporaryFileEncoding());
                Lib.FlexibleFormToXML.setOptions(Lib.VendorRegistration.VendorExporter.GetEncoding(), xmlRootNode, Lib.VendorRegistration.VendorExporter.GetFieldsRules(), Lib.VendorRegistration.VendorExporter.GetTablesRules(), Data, [], Lib.VendorRegistration.VendorExporter.GetExportMode(), Lib.VendorRegistration.VendorExporter.GetModifiedNodeNameMappings(), true, Lib.VendorRegistration.VendorExporter.GetFieldValuesMapping());
                Lib.FlexibleFormToXML.GetXMLFile(tempInvoiceXml, null);
                var attachVars = transport.AddAttachEx(tempInvoiceXml).GetVars();
                attachVars.AddValue_String("AttachEncoding", Lib.VendorRegistration.VendorExporter.GetAttachEncoding(), true);
                attachVars.AddValue_String("AttachOutputName", attachName, true);
                attachVars.AddValue_String("AttachToDisplay", "converted", true);
                Transaction.Write(exportRedisKey, exportRedisStates.exported);
            }
            VendorExporter.AttachXmlFile = AttachXmlFile;
            /**
             * Construct output path for the current SFTP configuration
             * @memberof Lib.VendorRegistration.VendorExporter
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
            VendorExporter.GetOutputPath = GetOutputPath;
            /**
           * Compute the full name of the xml file
           */
            function GetVendorRegistrationXmlFilename() {
                return vendorRegistrationXmlFilePrefix + Data.GetValue("MSN");
            }
            VendorExporter.GetVendorRegistrationXmlFilename = GetVendorRegistrationXmlFilename;
            /**
             * Create a CopyFile transport to copy xml VendorRegistration file in a SFTP folder
             * @memberof Lib.VendorRegistration.VendorExporter
             */
            function ToSFTP() {
                var sftpConfigurationName = Variable.GetValueAsString("SFTPConfigurationName");
                var copyFileTransport = Process.CreateTransport("Copy");
                if (sftpConfigurationName) {
                    if (copyFileTransport) {
                        try {
                            var vars = copyFileTransport.GetUninheritedVars();
                            vars.AddValue_String("CopyPath", sftpConfigurationName, true);
                            vars.AddValue_String("CreateIfNotExist", 1, true);
                            // Attach the XML file to the Copy transport
                            Lib.VendorRegistration.VendorExporter.AttachXmlFile(copyFileTransport, Lib.VendorRegistration.VendorExporter.GetOutputPath() + Lib.VendorRegistration.VendorExporter.GetVendorRegistrationXmlFilename());
                            copyFileTransport.Process();
                            return true;
                        }
                        catch (e) {
                            Log.Error(e);
                            return false;
                        }
                    }
                    else {
                        Log.Error("Unable to create transport");
                        return false;
                    }
                }
                else {
                    Log.Error("SFTPConfigurationName is not defined");
                    return false;
                }
            }
            VendorExporter.ToSFTP = ToSFTP;
            function ToProcess() {
                var userLogin = Sys.Parameters.GetInstance("AP").GetParameter("ERPNotifierVendorOwnerLogin");
                var notifierProcessParameter = Sys.Parameters.GetInstance("AP").GetParameter("ERPNotifierVendorProcessName");
                var notifierProcessDefault = "ERP Notifier Vendor";
                var notifierProcess = notifierProcessParameter ? notifierProcessParameter : notifierProcessDefault;
                var transport = userLogin ? Process.CreateProcessInstanceForUser(notifierProcess, userLogin) : Process.CreateProcessInstance(notifierProcess);
                if (transport) {
                    try {
                        var vars = transport.GetUninheritedVars();
                        vars.AddValue_String("Company__", Data.GetValue("Company__"), true);
                        Lib.VendorRegistration.VendorExporter.AttachXmlFile(transport, "XML output");
                        Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.CustomizeERPNotifierVendor", transport);
                        transport.Process();
                        return true;
                    }
                    catch (e) {
                        Log.Error(e);
                        return false;
                    }
                }
                else {
                    Log.Info("Could not create process instance '".concat(notifierProcess, "'"));
                    return false;
                }
            }
            VendorExporter.ToProcess = ToProcess;
            /**
             * Perform the export of vendor registration data
             * @memberof Lib.VendorRegistration.VendorExporter
             * @return {boolean} flag to indicate that the vendor registration has been exported
             */
            function ExportIfNeeded() {
                if (Lib.VendorRegistration.VendorExporter.ShouldExportAndAttachXMLFile()) {
                    Log.Info("Should export xml");
                    var exportMethod = Sys.Parameters.GetInstance("AP").GetParameter("ERPExportMethod");
                    if (exportMethod && exportMethod === "SFTP") {
                        return Lib.VendorRegistration.VendorExporter.ToSFTP();
                    }
                    return Lib.VendorRegistration.VendorExporter.ToProcess();
                }
                Log.Info("Should not export xml");
                return false;
            }
            VendorExporter.ExportIfNeeded = ExportIfNeeded;
        })(VendorExporter = VendorRegistration.VendorExporter || (VendorRegistration.VendorExporter = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
