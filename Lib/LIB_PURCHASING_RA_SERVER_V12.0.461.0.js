///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_RA_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Purchasing library managing RA",
  "require": [
    "Lib_Purchasing_RA_Export_V12.0.461.0",
    "Lib_AP_VendorPortal_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var RA;
        (function (RA) {
            var Server;
            (function (Server) {
                function AttachRA() {
                    var raAttached = false;
                    // Check if RA is already attached
                    for (var i = Attach.GetNbAttach() - 1; i >= 0; i--) {
                        var type = Attach.GetValue(i, "Purchasing_DocumentType");
                        if (type === "RA") {
                            Log.Info("RA already attached: " + i);
                            raAttached = true;
                        }
                    }
                    if (!raAttached) {
                        // First step - Get template file
                        var raTemplateInfos = Lib.Purchasing.RA.Export.GetTemplateInfos();
                        var user = Lib.P2P.GetValidatorOrOwner();
                        var RA_TemplateFile = user.GetTemplateFile(raTemplateInfos.template, raTemplateInfos.escapedCompanyCode);
                        Log.Info("RA_TemplateFile used: " + RA_TemplateFile.GetFileName());
                        if (RA_TemplateFile == null) {
                            Log.Error("Failed to find template file: " + raTemplateInfos.template);
                            return false;
                        }
                        // Second step - Call correct converter according template file format
                        if (raTemplateInfos.fileFormat === "RPT") // Crystal mode
                         {
                            Log.Info("RA template detected as .RPT format");
                            // Generate JSON
                            var jsonFile = TemporaryFile.CreateFile("RA.JSON", "utf16");
                            if (!jsonFile) {
                                Log.Error("Temporaty file creating failed: RA.json");
                                return false;
                            }
                            var PaymentData = JSON.parse(Sys.Helpers.Globals.Variable.GetValueAsString("ExtractedData"));
                            var customTags = {
                                PaymentReference__: PaymentData.ExtractedData.PaymentId,
                                Currency__: PaymentData.ExtractedData.Currency,
                                VendorNumber__: PaymentData.ExtractedData.VendorId,
                                CompanyCode__: PaymentData.ExtractedData.VendorCompanyCode
                            };
                            var vendor = Lib.AP.VendorPortal.GetVendorUser(customTags);
                            Log.Info("Vendor value is ".concat(vendor));
                            if (vendor) {
                                raTemplateInfos.culture = vendor.GetVars().GetValue_String("Culture", 0);
                                raTemplateInfos.language = vendor.GetVars().GetValue_String("Language", 0);
                            }
                            Lib.Purchasing.RA.Export.CreateJsonString(raTemplateInfos, function (jsonString) {
                                TemporaryFile.Append(jsonFile, jsonString);
                            });
                        }
                        else {
                            Log.Error("Error RA template file format is not recognized or compatible");
                            return false;
                        }
                        var iAttachRA = void 0;
                        if (!raAttached) {
                            Log.Time("ConvertFile");
                            var pdfFile = null;
                            if (raTemplateInfos.fileFormat === "RPT") // Crystal mode
                             {
                                pdfFile = jsonFile.ConvertFile({ conversionType: "crystal", report: RA_TemplateFile });
                            }
                            Log.TimeEnd("ConvertFile");
                            // Third step - Check if error(s) happened with PDF generation
                            if (!pdfFile) {
                                Log.Error("Error converting template to pdf");
                                return false;
                            }
                            if (!Attach.AttachTemporaryFile(pdfFile, { name: "RA_Attach_File", attachAsConverted: true, attachAsFirst: true })) {
                                Log.Error("Error creating RA attachment");
                                return false;
                            }
                            iAttachRA = 0;
                            Attach.SetValue(iAttachRA, "Purchasing_DocumentType", "RA");
                        }
                        // Sys.Helpers.TryCallFunction("Lib.RA.Customization.Server.OnAttachRA", iAttachRA, iAttachCSV);
                    }
                    return true;
                }
                Server.AttachRA = AttachRA;
            })(Server = RA.Server || (RA.Server = {}));
        })(RA = Purchasing.RA || (Purchasing.RA = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
