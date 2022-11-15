///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ReturnManagement_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Server side lib for Return Management",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_P2P_Conversation_Server_V12.0.461.0",
    "Sys/Sys_Helpers_LdapUtil",
    "Lib_Purchasing_POItems_V12.0.461.0",
    "Sys/Sys_Parameters",
    "Sys/Sys_Helpers",
    "Sys/Sys_EmailNotification",
    "LIB_AP_VendorPortal_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ReturnManagement;
        (function (ReturnManagement) {
            function FillFormFromGrItems(orderNumber) {
                Log.Verbose("[FillFormFromGrItems] PO:".concat(orderNumber));
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Line_OrderNumber__", orderNumber), Sys.Helpers.LdapUtil.FilterEqual("Line_ItemType__", Lib.P2P.ItemType.QUANTITY_BASED), Sys.Helpers.LdapUtil.FilterStrictlyGreater("Line_ReceivedQuantity__", "0"), Sys.Helpers.LdapUtil.FilterNotEqual("GRStatus__", "Canceled")).toString();
                Log.Verbose("[FillFormFromGrItems] filter:".concat(filter));
                var table = "CDLNAME#Goods receipt V2.LineItems__";
                var GRQueryOptions = {
                    table: table,
                    filter: filter,
                    attributes: [
                        "Line_LineNumber__",
                        "GRNumber__",
                        "DeliveryNote__",
                        "Line_RecipientDN__",
                        "Line_RecipientName__",
                        "Line_Description__",
                        "Line_UnitPrice__",
                        "Line_Currency__",
                        "Line_ReceivedQuantity__",
                        "Line_ItemUnit__",
                        "Line_ReturnedQuantity__",
                        "Line_SupplierPartID__"
                    ]
                };
                return Sys.GenericAPI.PromisedQuery(GRQueryOptions)
                    .Then(function (queryResults) {
                    var _a;
                    Log.Verbose("[FillFormFromGrItems] queryResults length:".concat(queryResults.length));
                    Log.Verbose("[FillFormFromGrItems] queryResults content:".concat(JSON.stringify(queryResults)));
                    Log.Verbose("[FillFormFromGrItems] queryResults:".concat((_a = queryResults[0]) === null || _a === void 0 ? void 0 : _a.GRNumber__));
                    queryResults = queryResults.filter(function (element) { return IsItemNotFullyReturned(element); });
                    Lib.Purchasing.Items.FillFormItems(queryResults, Lib.Purchasing.Items.GRItemsToReturnOrder);
                });
            }
            ReturnManagement.FillFormFromGrItems = FillFormFromGrItems;
            function IsItemNotFullyReturned(element) {
                return element.Line_ReturnedQuantity__ < element.Line_ReceivedQuantity__;
            }
            //#region Communicate data with Vendor Return Order
            ReturnManagement.mappingROClientToVendor = {
                "vendorFormTable": "LineItems__",
                "clientFormTable": "LineItems__",
                "mappings": {
                    "header": {
                        "Status__": "Status__",
                        "OrderNumber__": "OrderNumber__",
                        "CompanyCode__": "CompanyCode__",
                        "VendorNumber__": "VendorNumber__",
                        "VendorName__": "VendorName__",
                        "VendorEmail__": "VendorEmail__",
                        "VendorRMA__": "VendorRMA__",
                        "VendorReturnAddressID__": "VendorReturnAddressID__",
                        "VendorReturnAddress__": "VendorReturnAddress__",
                        "RequesterName__": "RequesterName__",
                        "ROClientRUIDEX__": "RUIDEX",
                        "RONumber__": "RONumber__",
                        "ReturnDate__": "ReturnDate__",
                        "CarrierCombo__": "CarrierCombo__",
                        "Carrier__": "Carrier__",
                        "TrackingNumber__": "TrackingNumber__",
                        "TrackingLink__": "TrackingLink__"
                    },
                    "byLine": {
                        "POLineNumber__": "POLineNumber__",
                        "Description__": "Description__",
                        "ItemNumber__": "ItemNumber__",
                        "ItemQuantity__": "ItemQuantity__",
                        "UOM__": "UOM__",
                        "UnitPrice__": "UnitPrice__",
                        "ReturnedQuantity__": "ReturnedQuantity__",
                        "ReturnReason__": "ReturnReason__",
                        "Comment__": "Comment__",
                        "Currency__": "Currency__",
                        "GoodsReceiptNumber__": "GoodsReceiptNumber__",
                        "DeliveryNote__": "DeliveryNote__"
                    }
                }
            };
            function CreateVendorRO(Vendor) {
                Log.Info("[Lib.Purchasing.ReturnManagement.CreateVendorRO]");
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var vendorLogin = Vendor.GetValue("Login");
                    Log.Info("[Lib.Purchasing.ReturnManagement.CreateVendorRO] vendorLogin = " + vendorLogin);
                    var childCD = Process.CreateProcessInstanceForUser(Lib.P2P.GetReturnOrderVendorProcessName(), vendorLogin, 1 /* ChildProcessType.Child */, true);
                    if (!childCD) {
                        reject("Unable to create Return order vendor process");
                    }
                    else {
                        resolve(childCD);
                    }
                });
            }
            ReturnManagement.CreateVendorRO = CreateVendorRO;
            function GetTechnicalData() {
                var _a, _b;
                Log.Info("[Lib.Purchasing.ReturnManagement.GetTechnicalData]");
                var technicalData = {
                    header: {},
                    byLine: []
                };
                var headerMapping = (_a = ReturnManagement.mappingROClientToVendor === null || ReturnManagement.mappingROClientToVendor === void 0 ? void 0 : ReturnManagement.mappingROClientToVendor.mappings) === null || _a === void 0 ? void 0 : _a.header;
                var linesMapping = (_b = ReturnManagement.mappingROClientToVendor === null || ReturnManagement.mappingROClientToVendor === void 0 ? void 0 : ReturnManagement.mappingROClientToVendor.mappings) === null || _b === void 0 ? void 0 : _b.byLine;
                var formTableName = ReturnManagement.mappingROClientToVendor === null || ReturnManagement.mappingROClientToVendor === void 0 ? void 0 : ReturnManagement.mappingROClientToVendor.vendorFormTable;
                if (headerMapping) {
                    Sys.Helpers.Object.ForEach(headerMapping, function (clientField, vendorField) {
                        technicalData.header[vendorField] = Data.GetValue(clientField);
                    });
                }
                if (linesMapping && formTableName) {
                    var table = Data.GetTable(formTableName);
                    var nItems = table.GetItemCount();
                    var _loop_1 = function (itemIdx) {
                        var item = table.GetItem(itemIdx);
                        var dataItem = {};
                        Sys.Helpers.Object.ForEach(linesMapping, function (clientField, vendorField) {
                            dataItem[vendorField] = item.GetValue(clientField);
                        });
                        technicalData.byLine.push(dataItem);
                    };
                    for (var itemIdx = 0; itemIdx < nItems; itemIdx++) {
                        _loop_1(itemIdx);
                    }
                }
                return technicalData;
            }
            ReturnManagement.GetTechnicalData = GetTechnicalData;
            function FillTechnicalData(vars, autoCompleteFromClientROData) {
                vars.AddValue_String("TechnicalData__", JSON.stringify({ autoCompleteFromClientROData: autoCompleteFromClientROData }), true);
            }
            ReturnManagement.FillTechnicalData = FillTechnicalData;
            function FillFromTechnicalData() {
                var _a, _b;
                Log.Info("[Lib.Purchasing.ReturnManagement.FillFromTechnicalData]");
                var dataFromClientRO = Sys.TechnicalData.GetValue("autoCompleteFromClientROData");
                var headerMapping = (_a = ReturnManagement.mappingROClientToVendor === null || ReturnManagement.mappingROClientToVendor === void 0 ? void 0 : ReturnManagement.mappingROClientToVendor.mappings) === null || _a === void 0 ? void 0 : _a.header;
                var linesMapping = (_b = ReturnManagement.mappingROClientToVendor === null || ReturnManagement.mappingROClientToVendor === void 0 ? void 0 : ReturnManagement.mappingROClientToVendor.mappings) === null || _b === void 0 ? void 0 : _b.byLine;
                var formTableName = ReturnManagement.mappingROClientToVendor === null || ReturnManagement.mappingROClientToVendor === void 0 ? void 0 : ReturnManagement.mappingROClientToVendor.clientFormTable;
                if (dataFromClientRO) {
                    if (headerMapping && dataFromClientRO.header) {
                        Sys.Helpers.Object.ForEach(headerMapping, function (clientField, vendorField) {
                            if (dataFromClientRO.header[vendorField]) {
                                Data.SetValue(vendorField, dataFromClientRO.header[vendorField]);
                            }
                        });
                    }
                    if (linesMapping && (dataFromClientRO === null || dataFromClientRO === void 0 ? void 0 : dataFromClientRO.byLine.length)) {
                        var table = Data.GetTable(formTableName);
                        table.SetItemCount(dataFromClientRO.byLine.length);
                        var _loop_2 = function (itemIdx) {
                            var newItem = table.GetItem(itemIdx);
                            Sys.Helpers.Object.ForEach(linesMapping, function (clientField, vendorField) {
                                if (dataFromClientRO.byLine[itemIdx][vendorField]) {
                                    newItem.SetValue(vendorField, dataFromClientRO.byLine[itemIdx][vendorField]);
                                }
                            });
                        };
                        for (var itemIdx = 0; itemIdx < dataFromClientRO.byLine.length; itemIdx++) {
                            _loop_2(itemIdx);
                        }
                    }
                }
            }
            ReturnManagement.FillFromTechnicalData = FillFromTechnicalData;
            //#endregion
            //#region Email notifications
            function SendNotifToReviewer(recipient) {
                var sender = Users.GetUserAsProcessAdmin(Data.GetValue("OwnerId"));
                Log.Info("[SendNotifToReviewer] Sending email to ".concat(recipient.GetValue("EmailAddress")));
                var customTags = {
                    DisplayName: recipient.GetValue("DisplayName"),
                    FromName: sender.GetValue("DisplayName"),
                    OrderNumber__: Data.GetValue("OrderNumber__")
                };
                var emailOptions = {
                    user: recipient,
                    template: "Purchasing_Email_NotifROReviewer.htm",
                    customTags: customTags,
                    escapeCustomTags: false,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                };
                var email = Sys.EmailNotification.CreateEmailWithUser(emailOptions);
                Sys.EmailNotification.SendEmail(email);
            }
            ReturnManagement.SendNotifToReviewer = SendNotifToReviewer;
            function SendNotifForROCreation(useVendorPortal) {
                if (useVendorPortal === void 0) { useVendorPortal = true; }
                var mailOptions = useVendorPortal ? VendorEmailOptionsWithPortal() : VendorEmailOptionsWithoutPortal();
                var emailOptions = {
                    userId: mailOptions.userId,
                    emailAddress: mailOptions.vendorAddress,
                    template: mailOptions.template,
                    customTags: mailOptions.customTags,
                    escapeCustomTags: false,
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                };
                var doSendNotif = Sys.Helpers.TryCallFunction("Lib.VendorPortal.Customization.OnSendVendorNotification", emailOptions);
                if (doSendNotif !== false) {
                    var email = Sys.EmailNotification.CreateEmail(emailOptions);
                    Sys.EmailNotification.SendEmail(email);
                }
            }
            ReturnManagement.SendNotifForROCreation = SendNotifForROCreation;
            function VendorEmailOptionsWithPortal() {
                var currentUserID = Data.GetValue("OwnerId");
                var currentUser = Users.GetUser(currentUserID);
                var currentProcessRuid = Data.GetValue("RuidEx");
                var redirectionAddress = Lib.P2P.computeVendorEmailRedirection(currentUser.EmailAddress);
                var RMANumber = Data.GetValue("VendorRMA__");
                var hasRMANumber = !!RMANumber;
                var mailOptions = {
                    userId: currentUserID,
                    vendorAddress: redirectionAddress,
                    template: "Purchasing_Email_NotifROVendorPortal.htm",
                    customTags: {
                        PortalUrl: currentUser.GetProcessURL(currentProcessRuid, true),
                        OrderNumber: Data.GetValue("OrderNumber__"),
                        RMANumber: RMANumber,
                        HasRMANumber: hasRMANumber
                    }
                };
                return mailOptions;
            }
            function VendorEmailOptionsWithoutPortal() {
                var redirectionAddress = Lib.P2P.computeVendorEmailRedirection(Variable.GetValueAsString("VendorEmail__"));
                var RMANumber = Data.GetValue("VendorRMA__");
                var hasRMANumber = !!RMANumber;
                var mailOptions = {
                    userId: Data.GetValue("OwnerId"),
                    vendorAddress: redirectionAddress,
                    template: "Purchasing_Email_NotifROVendor.htm",
                    customTags: {
                        OrderNumber: Data.GetValue("OrderNumber__"),
                        RMANumber: RMANumber,
                        HasRMANumber: hasRMANumber
                    }
                };
                return mailOptions;
            }
            //#endregion
        })(ReturnManagement = Purchasing.ReturnManagement || (Purchasing.ReturnManagement = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
