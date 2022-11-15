///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_PackingSlipGen_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Shipping library used to generate the packing slip pdf",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_GenericAPI_Server",
    "Lib_Purchasing_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_P2P_CompanyCodesValue_V12.0.461.0",
    "Lib_Shipping_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "[Lib_Shipping_Customization_Common]"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var PackingSlipGen;
        (function (PackingSlipGen) {
            var outputName = "PackingSlip";
            function GetFormatDate(context) {
                // eslint-disable-next-line dot-notation
                return (Sys.Helpers.Date.dateFormatLocales[context.culture] || Sys.Helpers.Date.dateFormatLocales["default"])
                    .replace(/\bmm\b/, "MM")
                    .replace(/\bm\b/, "M");
            }
            function GetSeparatorThousand(context) {
                // eslint-disable-next-line dot-notation
                return encodeURIComponent(Lib.Purchasing.delimitersThousandsLocales[context.culture] || Lib.Purchasing.delimitersThousandsLocales["default"]);
            }
            function GetSeparatorDecimal(context) {
                // eslint-disable-next-line dot-notation
                return Lib.Purchasing.delimitersDecimalLocales[context.culture] || Lib.Purchasing.delimitersDecimalLocales["default"];
            }
            function GetSeparatorInfos() {
                return encodeURIComponent(" - ");
            }
            function FillDataRPT(dataSource, dataRPT, mapping, context) {
                var promises = [];
                Sys.Helpers.Object.ForEach(mapping, function (data, field) {
                    var dataValue;
                    if (Sys.Helpers.IsFunction(data)) {
                        dataValue = data(context, dataSource);
                    }
                    else if (Sys.Helpers.IsFunction(dataSource.GetValue)) {
                        dataValue = dataSource.GetValue(data);
                    }
                    else if (data in dataSource) {
                        dataValue = dataSource[data];
                    }
                    if (!Sys.Helpers.Promise.IsPromise(dataValue)) {
                        dataValue = Sys.Helpers.Promise.Resolve(dataValue);
                    }
                    var promise = dataValue.Then(function (value) {
                        // except for Date type where we always set as a string with "YYYY-MM-DD" format
                        dataRPT[field] = value instanceof Date ? Sys.Helpers.Date.ToUTCDate(value) : value;
                    });
                    promises.push(promise);
                });
                return Sys.Helpers.Promise.All(promises);
            }
            function GetTemplateContent(user, jsonFileName, language) {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    var templateContent = user.GetTemplateContent({
                        templateName: jsonFileName,
                        language: language
                    });
                    resolve(templateContent);
                });
            }
            // function AddQRCode(attachIdx: number): void
            // {
            // 	Log.Info("[PackingSlipGen.AddQRCode]");
            // 	const msnEx = Data.GetValue("MsnEx");
            // 	var pdfCommands = [
            // 		`-insqrcode %infile[${attachIdx + 1}]% -trqr "${msnEx}" 15 155 1 -size 100 1`
            // 	];
            // 	if (!Attach.PDFCommands(pdfCommands))
            // 	{
            // 		Log.Error(`[PackingSlipGen.AddQRCode] PDF commands failed: ${pdfCommands.join("\n")}`);
            // 		throw new PackingSlipGenError();
            // 	}
            // }
            /// EXPORTS
            var PackingSlipGenError = /** @class */ (function (_super) {
                __extends(PackingSlipGenError, _super);
                function PackingSlipGenError() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return PackingSlipGenError;
            }(Sys.Helpers.Promise.HandledError));
            PackingSlipGen.PackingSlipGenError = PackingSlipGenError;
            PackingSlipGen.PackingSlipRPTDataMapping = {
                header: {
                    MsnEx: "MsnEx",
                    Status: "Status__",
                    ASNNumber: "ASNNumber__",
                    ShippingDate: "ShippingDate__",
                    ExpectedDeliveryDate: "ExpectedDeliveryDate__",
                    VendorAddress: "VendorAddress__",
                    ShipToAddress: "ShipToAddress__",
                    Carrier: "Carrier__",
                    TrackingNumber: "TrackingNumber__",
                    ShippingNote: "ShippingNote__"
                },
                tables: {
                    LineItems: {
                        table: "LineItems__",
                        fields: {
                            ItemNumber: function (context) { return context.tableItemInfo.itemIdx + 1; },
                            ItemPONumber: "ItemPONumber__",
                            ItemPOLineNumber: "ItemPOLineNumber__",
                            ItemDescription: "ItemDescription__",
                            ItemPOLineQuantity: "ItemPOLineQuantity__",
                            ItemQuantity: "ItemQuantity__",
                            ItemUOM: "ItemUOM__",
                            ItemNote: "ItemNote__"
                        }
                    }
                },
                companyInfo: {
                    DecimalCount: function () { return 2; },
                    FormatDate: GetFormatDate,
                    SeparatorThousand: GetSeparatorThousand,
                    SeparatorDecimal: GetSeparatorDecimal,
                    SeparatorInfos: GetSeparatorInfos
                }
            };
            function GetPackingSlipGenContext(context) {
                context = context || {};
                context.vendorUser = context.vendorUser || Lib.P2P.GetValidatorOrOwner();
                context.templateInfo = context.templateInfo || Lib.Shipping.PackingSlipGen.GetPackingSlipTemplateInfo();
                return context;
            }
            PackingSlipGen.GetPackingSlipGenContext = GetPackingSlipGenContext;
            function GetPackingSlipTemplateInfo() {
                Log.Info("[PackingSlipGen.GetPackingSlipTemplateInfo]");
                var info = {
                    escapedCompanyCode: Sys.Helpers.String.NormalizeFileSuffix(Sys.Helpers.String.RemoveIllegalCharactersFromFilename(Data.GetValue("CompanyCode__"))),
                    fileFormat: "RPT"
                };
                // Overloads with user exit
                var templateFromUserExit = Sys.Helpers.TryCallFunction("Lib.Shipping.Customization.Common.GetPackingSlipTemplateName");
                if (templateFromUserExit != null) {
                    if (Sys.Helpers.IsString(templateFromUserExit)) {
                        info.template = templateFromUserExit;
                    }
                    else {
                        info.template = templateFromUserExit.template;
                        info.language = templateFromUserExit.language;
                        info.culture = templateFromUserExit.culture;
                    }
                }
                if (info.template == null) {
                    info.template = Sys.Parameters.GetInstance("PAC").GetParameter("PackingSlipTemplateName");
                    Log.Info("[PackingSlipGen.GetPackingSlipTemplateInfo] Template name comes from parameters");
                }
                Log.Info("[PackingSlipGen.GetPackingSlipTemplateInfo] Template name is: ".concat(info.template));
                return info;
            }
            PackingSlipGen.GetPackingSlipTemplateInfo = GetPackingSlipTemplateInfo;
            function GetPackingSlipRPTData(context) {
                Log.Info("[PackingSlipGen.GetPackingSlipRPTData]");
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () {
                    // Takes into account an user exit.
                    var extraMapping = Sys.Helpers.TryCallFunction("Lib.Shipping.Customization.Common.GetExtraPackingSlipRPTDataMapping") || {};
                    var mapping = PackingSlipGen.PackingSlipRPTDataMapping;
                    mapping = Sys.Helpers.Extend(true, {}, mapping, extraMapping);
                    context.language = context.language || context.templateInfo.language || context.vendorUser.GetValue("Language");
                    context.culture = context.culture || context.templateInfo.culture || context.vendorUser.GetValue("Culture");
                    var dataRPT = {};
                    var promises = [];
                    if (mapping.header) {
                        dataRPT.header = {};
                        var promise = FillDataRPT(Data, dataRPT.header, mapping.header, context);
                        promises.push(promise);
                    }
                    if (mapping.companyInfo) {
                        dataRPT.companyInfo = {};
                        var companyCode_1 = Data.GetValue("CompanyCode__");
                        var promise = Lib.P2P.CompanyCodesValue.QueryValues(companyCode_1, false, { asAdmin: true })
                            .Then(function (companyInfos) {
                            if (Object.keys(companyInfos).length > 0) {
                                return FillDataRPT(companyInfos, dataRPT.companyInfo, mapping.companyInfo, context);
                            }
                            Log.Warn("[PackingSlipGen.GetPackingSlipRPTData] No record found for company code '".concat(companyCode_1, "'"));
                        });
                        promises.push(promise);
                    }
                    if (mapping.tables) {
                        dataRPT.tables = {};
                        Sys.Helpers.Object.ForEach(mapping.tables, function (tableMapping, key) {
                            var tableDataRPT = [];
                            dataRPT.tables[key] = tableDataRPT;
                            var tableName = tableMapping.table || key;
                            var table = Data.GetTable(tableName);
                            var count = table.GetItemCount();
                            for (var itemIdx = 0; itemIdx < count; itemIdx++) {
                                var item = table.GetItem(itemIdx);
                                var itemContext = Sys.Helpers.Extend(true, {}, context, {
                                    tableItemInfo: {
                                        tableName: tableName,
                                        table: table,
                                        itemIdx: itemIdx,
                                        item: item
                                    }
                                });
                                var itemDataRPT = {};
                                tableDataRPT.push(itemDataRPT);
                                var promise = FillDataRPT(item, itemDataRPT, tableMapping.fields, itemContext);
                                promises.push(promise);
                            }
                        });
                    }
                    // language file
                    (function () {
                        var lgTemplateName = context.templateInfo.template.substr(0, context.templateInfo.template.lastIndexOf(".")) || context.templateInfo.template;
                        var promise = GetTemplateContent(context.vendorUser, lgTemplateName + ".json", context.language)
                            .Then(function (lgTemplate) {
                            // Add language
                            Sys.Helpers.Extend(true, dataRPT, JSON.parse(lgTemplate.content));
                        });
                        promises.push(promise);
                    })();
                    return Sys.Helpers.Promise.All(promises)
                        .Then(function () {
                        var updatedDataRPT = Sys.Helpers.TryCallFunction("Lib.Shipping.Customization.Common.CustomizePackingSlipRPTData", dataRPT);
                        return updatedDataRPT || dataRPT;
                    });
                })
                    .Catch(Sys.Helpers.Promise.HandledError.Catcher("PackingSlipGen.GetPackingSlipRPTData", PackingSlipGenError));
            }
            PackingSlipGen.GetPackingSlipRPTData = GetPackingSlipRPTData;
            function GeneratePackingSlipJson(context) {
                Log.Info("[PackingSlipGen.GeneratePackingSlipJson]");
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () { context = Lib.Shipping.PackingSlipGen.GetPackingSlipGenContext(); })
                    .Then(function () { return Lib.Shipping.PackingSlipGen.GetPackingSlipRPTData(context); })
                    .Then(function (data) { return JSON.stringify(data); })
                    .Catch(Sys.Helpers.Promise.HandledError.Catcher("PackingSlipGen.GeneratePackingSlipJson", PackingSlipGenError));
            }
            PackingSlipGen.GeneratePackingSlipJson = GeneratePackingSlipJson;
            function AttachPackingSlip(filename, indexToUpdate) {
                filename = filename || outputName;
                Log.Info("[PackingSlipGen.AttachPackingSlip] with filename:".concat(filename, ", indexToUpdate?: ").concat(indexToUpdate));
                var context = null;
                var templateFile = null;
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () { context = Lib.Shipping.PackingSlipGen.GetPackingSlipGenContext(); })
                    .Then(function () {
                    templateFile = context.vendorUser.GetTemplateFile(context.templateInfo.template, context.templateInfo.escapedCompanyCode);
                    if (!templateFile) {
                        Log.Error("[PackingSlipGen.AttachPackingSlip] Failed to find template file: ".concat(context.templateInfo.template));
                        throw new PackingSlipGenError();
                    }
                    Log.Info("[PackingSlipGen.AttachPackingSlip] template file: ".concat(templateFile.GetFileName()));
                    if (context.templateInfo.fileFormat !== "RPT") {
                        Log.Error("[PackingSlipGen.AttachPackingSlip] Template file format is not recognized or compatible: ".concat(context.templateInfo.fileFormat));
                        throw new PackingSlipGenError();
                    }
                })
                    .Then(function () { return Lib.Shipping.PackingSlipGen.GeneratePackingSlipJson(context); })
                    .Then(function (dataJSON) {
                    // Generate JSON
                    var jsonFile = TemporaryFile.CreateFile("PackingSlip.JSON", "utf16");
                    if (!jsonFile) {
                        Log.Error("[PackingSlipGen.AttachPackingSlip] Temporaty file creating failed: PackingSlip.json");
                        throw new PackingSlipGenError();
                    }
                    TemporaryFile.Append(jsonFile, dataJSON);
                    var cvtFile = jsonFile.ConvertFile({ conversionType: "crystal", report: templateFile });
                    if (!cvtFile) {
                        Log.Error("[PackingSlipGen.AttachPackingSlip] Error converting template to pdf");
                        throw new PackingSlipGenError();
                    }
                    var attached = false;
                    var attachIdx = indexToUpdate;
                    if (isNaN(attachIdx)) {
                        attachIdx = 0;
                        attached = Attach.AttachTemporaryFile(cvtFile, {
                            name: filename,
                            attachAsConverted: true,
                            attachAsFirst: true
                        });
                    }
                    else {
                        attached = Attach.AttachTemporaryFile(cvtFile, {
                            name: filename,
                            attachAsConverted: true,
                            attachIndex: attachIdx
                        });
                    }
                    if (!attached) {
                        Log.Error("[PackingSlipGen.AttachPackingSlip] Couldn't attach the generated file");
                        throw new PackingSlipGenError();
                    }
                    //AddQRCode(attachIdx);
                    return Sys.Helpers.TryCallFunction("Lib.Shipping.Customization.Server.OnAttachPackingSlip", attachIdx);
                })
                    .Catch(Sys.Helpers.Promise.HandledError.Catcher("PackingSlipGen.AttachPackingSlip", PackingSlipGenError));
            }
            PackingSlipGen.AttachPackingSlip = AttachPackingSlip;
            function ReAttachPackingSlip(filename) {
                filename = filename || outputName;
                Log.Info("[PackingSlipGen.ReAttachPackingSlip] with filename:".concat(filename));
                return Sys.Helpers.Promise.Resolve()
                    .Then(function () {
                    var nbAttach = Attach.GetNbAttach();
                    if (nbAttach > 0) {
                        for (var i = 0; i < nbAttach; i++) {
                            var attachName = Attach.GetName(i);
                            if (attachName === filename) {
                                return Lib.Shipping.PackingSlipGen.AttachPackingSlip(filename, i);
                            }
                        }
                    }
                    Log.Error("[PackingSlipGen.ReAttachPackingSlip] cannot find the packing slip attachment");
                    throw new PackingSlipGenError();
                })
                    .Catch(Sys.Helpers.Promise.HandledError.Catcher("PackingSlipGen.ReAttachPackingSlip", PackingSlipGenError));
            }
            PackingSlipGen.ReAttachPackingSlip = ReAttachPackingSlip;
        })(PackingSlipGen = Shipping.PackingSlipGen || (Shipping.PackingSlipGen = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
