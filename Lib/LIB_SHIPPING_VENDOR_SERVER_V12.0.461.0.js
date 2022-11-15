///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_Vendor_Server_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Vendor Shipping library",
  "require": [
    "Sys/Sys_Helpers_Object",
    "Sys/Sys_Helpers_Promise",
    "Sys/SYS_HELPERS_DATA",
    "Lib_P2P_V12.0.461.0",
    "Lib_P2P_Conversation_Server_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_Shipping_V12.0.461.0",
    "Lib_Shipping_Validation_V12.0.461.0",
    "Lib_Shipping_PackingSlipGen_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var Vendor;
        (function (Vendor) {
            function RemoveErrors() {
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    item.SetError("ItemPONumber__", "");
                    item.SetError("ItemPOLineNumber__", "");
                });
            }
            function GeneratePreview() {
                Log.Info("[Lib.Shipping.Vendor.GeneratePreview]");
                var promise = Sys.Helpers.Promise.Resolve();
                if (Variable.GetValueAsString("atLeastOneItemIsNotFullyShip") != "false") {
                    promise = promise.Then(RemoveErrors);
                    promise = promise.Then(Lib.Shipping.PackingSlipGen.AttachPackingSlip);
                    promise.Catch(Lib.Shipping.Validation.HandleValidationError);
                }
                else {
                    Log.Info("[Lib.Shipping.Vendor.GeneratePreview] Don't generate preview because no more item are shippable");
                }
                return promise;
            }
            Vendor.GeneratePreview = GeneratePreview;
            function Submit() {
                Log.Info("[Lib.Shipping.Vendor.Submit]");
                Data.SetValue("Status__", "Submitted");
                Lib.Shipping.Validation.RemoveItemsWithoutQuantity();
                Lib.Shipping.PackingSlipGen.ReAttachPackingSlip()
                    .Then(Lib.Shipping.Vendor.CreateClientASN)
                    .Then(function (clientASNProcess) {
                    var vars = clientASNProcess.GetUninheritedVars();
                    var VendorASNRUIDEX__ = Data.GetValue("RuidEx");
                    var technicalData = Lib.Shipping.Vendor.GetTechnicalData();
                    Lib.Shipping.Vendor.FillTechnicalData(vars, technicalData);
                    Lib.Shipping.Vendor.FillHeader(vars, { VendorASNRUIDEX__: VendorASNRUIDEX__ });
                    clientASNProcess.Process();
                    var clientRUIDEX = vars.GetValue_String("RUIDEX", 0);
                    Data.SetValue("ClientASNRUIDEX__", clientRUIDEX);
                    var clientLogin = vars.GetValue_String("OwnerID", 0);
                    CreateConversation(clientRUIDEX, clientLogin);
                })
                    .Catch(Lib.Shipping.Vendor.HandleSubmissionError);
            }
            Vendor.Submit = Submit;
            function HandleSubmissionError(reason) {
                if (!(reason instanceof Sys.Helpers.Promise.HandledError)) {
                    Log.Error("[Validation.ValidateExtraction] unexpected error: " + reason);
                }
                Lib.CommonDialog.NextAlert.Define("_ValidateExtraction_ErrorTitle", "_ValidateExtraction_ErrorMessage", {
                    isError: true
                });
            }
            Vendor.HandleSubmissionError = HandleSubmissionError;
            function Update(RUIDEX) {
                Log.Info("[Lib.Shipping.Vendor.Update]");
                if (RUIDEX) {
                    var rowsToModify_1 = [];
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        var rowToModify = {
                            "filter": {
                                "ItemPONumber__": line.GetValue("ItemPONumber__"),
                                "ItemPOLineNumber__": line.GetValue("ItemPOLineNumber__")
                            },
                            "columns": {
                                "ItemQuantityReceived__": line.GetValue("ItemQuantityReceived__")
                            }
                        };
                        rowsToModify_1.push(rowToModify);
                    });
                    var JSONData = {
                        "fields": {
                            "Status__": Data.GetValue("Status__"),
                            "ASNDeliveryDate__": Data.GetValue("ASNDeliveryDate__")
                        },
                        "tables": {
                            "LineItems__": { rowsToModify: rowsToModify_1 }
                        }
                    };
                    Process.UpdateProcessInstanceDataAsync(RUIDEX, JSON.stringify(JSONData));
                }
            }
            Vendor.Update = Update;
            function CreateConversation(clientRUIDEX, customerLogin) {
                Log.Info("[Lib.Shipping.Vendor.CreateConversation]");
                var vendorUser = Users.GetUserAsProcessAdmin(Data.GetValue("OwnerID"));
                var vendorInfo = Lib.P2P.Conversation.GetBusinessInfoFromVendorUser(vendorUser);
                var internalUser = Users.GetUserAsProcessAdmin(customerLogin);
                if (internalUser) {
                    var internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
                    var conversationId = AddPartyToConversation(vendorInfo, internalUserInfo.Company);
                    AddPartyToConversation(internalUserInfo, vendorInfo.Company, clientRUIDEX, conversationId);
                }
                else {
                    Log.Error("User ".concat(customerLogin, " not found - not added to the conversation"));
                }
            }
            Vendor.CreateConversation = CreateConversation;
            function AddPartyToConversation(fromUser, recipientCompany, ruidEx, conversationId) {
                var conversationInfo = Lib.P2P.Conversation.InitConversationInfo(Lib.P2P.Conversation.Options.GetAdvancedShippingNotice(), ruidEx, conversationId);
                var extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
                    BusinessId: fromUser.BusinessId,
                    BusinessIdFieldName: fromUser.BusinessIdFieldName,
                    OwnerID: fromUser.OwnerID,
                    OwnerPB: fromUser.OwnerPB,
                    RecipientCompany: recipientCompany
                });
                return Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo);
            }
            Vendor.AddPartyToConversation = AddPartyToConversation;
            function CreateClientASN() {
                Log.Info("[Lib.Shipping.Vendor.CreateClientASN]");
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var firstItemPORecipientDN = Data.GetTable("LineItems__").GetItem(0).GetValue("ItemPORecipientDN__");
                    if (Sys.Helpers.IsEmpty(firstItemPORecipientDN)) {
                        reject("Unable to create ASN process, because ItemPORecipientDN__ is empty");
                    }
                    else {
                        var firstRecipientLogin = Sys.Helpers.String.ExtractLoginFromDN(firstItemPORecipientDN);
                        var childCD = Process.CreateProcessInstanceForUser(Lib.P2P.GetClientASNProcessName(), firstRecipientLogin, 1 /* ChildProcessType.Child */, true);
                        if (!childCD) {
                            reject("Unable to create ASN process");
                        }
                        else {
                            resolve(childCD);
                        }
                    }
                });
            }
            Vendor.CreateClientASN = CreateClientASN;
            function GetTechnicalData() {
                var _a, _b, _c, _d, _e;
                Log.Info("[Lib.Shipping.Vendor.GetTechnicalData]");
                var technicalData = {
                    header: {},
                    byLine: []
                };
                var headerMapping = (_b = (_a = Lib.Shipping.Vendor.mappingASNVendorToClient) === null || _a === void 0 ? void 0 : _a.mappings) === null || _b === void 0 ? void 0 : _b.header;
                var linesMapping = (_d = (_c = Lib.Shipping.Vendor.mappingASNVendorToClient) === null || _c === void 0 ? void 0 : _c.mappings) === null || _d === void 0 ? void 0 : _d.byLine;
                var formTableName = (_e = Lib.Shipping.Vendor.mappingASNVendorToClient) === null || _e === void 0 ? void 0 : _e.vendorFormTable;
                if (headerMapping) {
                    Sys.Helpers.Object.ForEach(headerMapping, function (vendorField, clientField) {
                        technicalData.header[clientField] = Data.GetValue(vendorField);
                    });
                }
                if (linesMapping && formTableName) {
                    var table = Data.GetTable(formTableName);
                    var nItems = table.GetItemCount();
                    var _loop_1 = function (itemIdx) {
                        var item = table.GetItem(itemIdx);
                        var dataItem = {};
                        Sys.Helpers.Object.ForEach(linesMapping, function (vendorField, clientField) {
                            dataItem[clientField] = item.GetValue(vendorField);
                        });
                        technicalData.byLine.push(dataItem);
                    };
                    for (var itemIdx = 0; itemIdx < nItems; itemIdx++) {
                        _loop_1(itemIdx);
                    }
                }
                return technicalData;
            }
            Vendor.GetTechnicalData = GetTechnicalData;
            Vendor.mappingASNVendorToClient = {
                "vendorFormTable": "LineItems__",
                "clientFormTable": "LineItems__",
                "mappings": {
                    "header": {
                        "ASNNumber__": "ASNNumber__",
                        "ShippingDate__": "ShippingDate__",
                        "ExpectedDeliveryDate__": "ExpectedDeliveryDate__",
                        "ASNDeliveryDate__": "ASNDeliveryDate__",
                        "Status__": "Status__",
                        "CompanyCode__": "CompanyCode__",
                        "VendorName__": "VendorName__",
                        "VendorAddress__": "VendorAddress__",
                        "ASNSourceType__": "ASNSourceType__",
                        "ShipToAddress__": "ShipToAddress__",
                        "CarrierCombo__": "CarrierCombo__",
                        "Carrier__": "Carrier__",
                        "TrackingNumber__": "TrackingNumber__",
                        "TrackingLink__": "TrackingLink__",
                        "ShippingNote__": "ShippingNote__"
                    },
                    "byLine": {
                        "ItemPONumber__": "ItemPONumber__",
                        "ItemPOLineNumber__": "ItemPOLineNumber__",
                        "ItemDescription__": "ItemDescription__",
                        "ItemPOLineQuantity__": "ItemPOLineQuantity__",
                        "ItemQuantity__": "ItemQuantity__",
                        "ItemUOM__": "ItemUOM__",
                        "ItemNote__": "ItemNote__",
                        "ItemPORecipientDN__": "ItemPORecipientDN__"
                    }
                }
            };
            function FillTechnicalData(vars, autoCompleteFromVendorASNData) {
                vars.AddValue_String("TechnicalData__", JSON.stringify({ autoCompleteFromVendorASNData: autoCompleteFromVendorASNData }), true);
            }
            Vendor.FillTechnicalData = FillTechnicalData;
            function FillHeader(vars, headerFields) {
                Sys.Helpers.Object.ForEach(headerFields, function (fieldValue, fieldName) {
                    vars.AddValue_String(fieldName, fieldValue, true);
                });
            }
            Vendor.FillHeader = FillHeader;
            function FillFromTechnicalData() {
                var _a, _b, _c, _d, _e;
                Log.Info("[Lib.Shipping.Vendor.FillFromTechnicalData]");
                var dataFromVendorASN = Sys.TechnicalData.GetValue("autoCompleteFromVendorASNData");
                var headerMapping = (_b = (_a = Lib.Shipping.Vendor.mappingASNVendorToClient) === null || _a === void 0 ? void 0 : _a.mappings) === null || _b === void 0 ? void 0 : _b.header;
                var linesMapping = (_d = (_c = Lib.Shipping.Vendor.mappingASNVendorToClient) === null || _c === void 0 ? void 0 : _c.mappings) === null || _d === void 0 ? void 0 : _d.byLine;
                var formTableName = (_e = Lib.Shipping.Vendor.mappingASNVendorToClient) === null || _e === void 0 ? void 0 : _e.clientFormTable;
                if (dataFromVendorASN) {
                    if (headerMapping && dataFromVendorASN.header) {
                        Sys.Helpers.Object.ForEach(headerMapping, function (vendorField, clientField) {
                            if (dataFromVendorASN.header[clientField]) {
                                Data.SetValue(clientField, dataFromVendorASN.header[clientField]);
                            }
                        });
                    }
                    if (linesMapping && (dataFromVendorASN === null || dataFromVendorASN === void 0 ? void 0 : dataFromVendorASN.byLine.length)) {
                        var table = Data.GetTable(formTableName);
                        table.SetItemCount(dataFromVendorASN.byLine.length);
                        var _loop_2 = function (itemIdx) {
                            var newItem = table.GetItem(itemIdx);
                            Sys.Helpers.Object.ForEach(linesMapping, function (vendorField, clientField) {
                                if (dataFromVendorASN.byLine[itemIdx][clientField]) {
                                    newItem.SetValue(clientField, dataFromVendorASN.byLine[itemIdx][clientField]);
                                }
                            });
                        };
                        for (var itemIdx = 0; itemIdx < dataFromVendorASN.byLine.length; itemIdx++) {
                            _loop_2(itemIdx);
                        }
                    }
                }
            }
            Vendor.FillFromTechnicalData = FillFromTechnicalData;
        })(Vendor = Shipping.Vendor || (Shipping.Vendor = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
