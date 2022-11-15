///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ShipTo_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_OnDemand_Users",
    "Lib_Purchasing_V12.0.461.0",
    "Sys/Sys_TechnicalData",
    "Lib_P2P_V12.0.461.0",
    "Lib_P2P_Inventory_V12.0.461.0",
    "Lib_Purchasing_ShipTo.Base_V12.0.461.0",
    "[Lib_Purchasing_ShipTo_Client_V12.0.461.0]"
  ]
}*/
// Common interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ShipTo;
        (function (ShipTo) {
            function GetContactAttributes() {
                return Object.keys(ShipTo.shipToFieldsMapping).join("|");
            }
            ShipTo.GetContactAttributes = GetContactAttributes;
            function GetToCountry() {
                if (!Lib.Purchasing.IsMultiShipTo()) {
                    var ShipToAddress = Sys.TechnicalData.GetValue("ShipToAddress");
                    if (ShipToAddress) {
                        return Sys.Helpers.Promise.Resolve(ShipToAddress.ToCountry);
                    }
                    return Sys.Helpers.Promise.Resolve();
                }
                var promises = [];
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    promises.push(ShipTo.QueryShipToById(item.GetValue("ItemDeliveryAddressID__"), Data.GetValue("CompanyCode__"))
                        .Then(function (result) { return result.GetValue("ShipToCountry__"); })
                        .Catch(function () {
                        return Sys.Helpers.Promise.Resolve();
                    }));
                });
                return Sys.Helpers.Promise.All(promises)
                    .Then(function (shipToCountries) {
                    var same = true;
                    var lastCountry;
                    shipToCountries.forEach(function (shipToCountry) {
                        same = same && (!lastCountry || lastCountry == shipToCountry);
                        lastCountry = shipToCountry;
                    });
                    return same ? lastCountry : null;
                });
            }
            ShipTo.GetToCountry = GetToCountry;
            function UpdateForceCountry(sameCountry) {
                if (!Lib.Purchasing.IsMultiShipTo()) {
                    var shipToVars = Sys.TechnicalData.GetValue("ShipToAddress");
                    if (shipToVars) {
                        shipToVars.ForceCountry = sameCountry ? "false" : "true";
                        return ShipTo.FillFormattedPostalAddress(shipToVars);
                    }
                    return Sys.Helpers.Promise.Resolve();
                }
                var promises = [];
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    promises.push(ShipTo.QueryShipToById(item.GetValue("ItemDeliveryAddressID__"), Data.GetValue("CompanyCode__"))
                        .Then(function (result) {
                        return Lib.Purchasing.ShipTo.FillAddressesWithCountry(function (field) { return result.GetValue(field); }, item, Lib.Purchasing.ShipTo.IsShipToCompanyInAddressBlock(), sameCountry);
                    }));
                });
                return Sys.Helpers.Promise.All(promises);
            }
            ShipTo.UpdateForceCountry = UpdateForceCountry;
            /**
             * Reset all field and error related to ShipTo
             */
            function Reset(shouldResetItem) {
                // Multishipto
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    if (!shouldResetItem || shouldResetItem(item)) {
                        resetFields(item);
                        item.SetValue("ItemShipToAddress__", null);
                        item.SetError("ItemShipToAddress__", "");
                    }
                });
                // Monoshipto
                resetFields();
                Variable.SetValueAsString("ShipToAddress", "");
                Sys.TechnicalData.SetValue("ShipToAddress", "");
                Data.SetValue("ShipToAddress__", null);
                Data.SetError("ShipToAddress__", "");
            }
            ShipTo.Reset = Reset;
            function resetFields(item) {
                var itemOrData = item || Data;
                Sys.Helpers.Object.ForEach(item ? ShipTo.itemShipToFieldsMapping : ShipTo.shipToFieldsMapping, function (field) {
                    itemOrData.SetValue(field, null);
                    itemOrData.SetError(field, "");
                });
            }
            function QueryShipToByShipToCompany(shipToCompany, companyCode) {
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("ShipToCompany__", shipToCompany));
                return ShipTo.QueryShipToPromise(filter);
            }
            ShipTo.QueryShipToByShipToCompany = QueryShipToByShipToCompany;
            function CheckDeliveryAddress(currentRole) {
                var isOk = true;
                var isRoleRequesterOrUndefined = !currentRole || (currentRole && Lib.Purchasing.IsRequester(currentRole));
                if (Lib.Purchasing.IsMultiShipTo() && isRoleRequesterOrUndefined) {
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        if (!Lib.Purchasing.IsLineItemEmpty(line)) {
                            if (Sys.Helpers.IsEmpty(line.GetValue("ItemShipToCompany__"))) {
                                isOk = false;
                                line.SetError("ItemShipToCompany__", "This field is required!");
                            }
                            if (Sys.Helpers.IsEmpty(line.GetValue("ItemShipToAddress__"))) {
                                isOk = false;
                                line.SetError("ItemShipToAddress__", "This field is required!");
                            }
                        }
                    });
                }
                return isOk;
            }
            ShipTo.CheckDeliveryAddress = CheckDeliveryAddress;
            function CheckAllSameDeliveryAddress() {
                var table = Data.GetTable("LineItems__");
                var res = true;
                if (table.GetItemCount() > 1) {
                    var deliveryAddressID_1 = table.GetItem(0).GetValue("ItemDeliveryAddressID__");
                    Sys.Helpers.Data.ForEachTableItem(table, function (item) {
                        if (item.GetValue("ItemDeliveryAddressID__") !== deliveryAddressID_1) {
                            item.SetError("ItemDescription__", "_Error delivery adress is not the same as the first item");
                            res = false;
                        }
                        else if (item.GetError("ItemDescription__") === Language.Translate("_Error delivery adress is not the same as the first item", false)) {
                            item.SetError("ItemDescription__", "");
                        }
                    });
                }
                return res;
            }
            ShipTo.CheckAllSameDeliveryAddress = CheckAllSameDeliveryAddress;
            function SetHeaderToFirstReplenishmentAdress() {
                var table = Data.GetTable("LineItems__");
                var deliveryAddressID = "";
                var hasError = false;
                var hasReplenishmentItems = Lib.P2P.Inventory.HasReplenishmentItems(table);
                Sys.Helpers.Data.ForEachTableItem(table, function (item) {
                    var errorMsg = "";
                    if (deliveryAddressID == "" && (Lib.P2P.Inventory.IsReplenishmentItem(item) || !hasReplenishmentItems)) {
                        deliveryAddressID = item.GetValue("ItemDeliveryAddressID__");
                    }
                    else if (hasReplenishmentItems && !Lib.P2P.Inventory.IsReplenishmentItem(item)) {
                        errorMsg = "_Error delivery adress not to warehouse";
                    }
                    else if (hasReplenishmentItems && deliveryAddressID != item.GetValue("ItemDeliveryAddressID__")) {
                        errorMsg = "_Error delivery adress not for same warehouse";
                    }
                    if (errorMsg) {
                        hasError = true;
                        item.SetError("ItemDescription__", errorMsg);
                    }
                    else if (item.GetError("ItemDescription__") === Language.Translate("_Error delivery adress not to warehouse", false)
                        || item.GetError("ItemDescription__") === Language.Translate("_Error delivery adress not for same warehouse", false)) {
                        item.SetError("ItemDescription__", "");
                    }
                });
                if (hasError) {
                    return Sys.Helpers.Promise.Resolve();
                }
                Data.SetValue("DeliveryAddressID__", deliveryAddressID);
                return ShipTo.QueryShipToById(Data.GetValue("DeliveryAddressID__"), Data.GetValue("CompanyCode__"))
                    .Then(function (result) {
                    return Lib.Purchasing.ShipTo.Fill(function (field) { return result.GetValue(field); });
                })
                    .Catch(function () { return Lib.Purchasing.ShipTo.Reset(); });
            }
            ShipTo.SetHeaderToFirstReplenishmentAdress = SetHeaderToFirstReplenishmentAdress;
            function Init() {
                Log.Time("ShipTo.Init");
                Lib.Purchasing.ShipTo.MigrateOldShipToCompanyBehavior();
                var shipToVars = Sys.TechnicalData.GetValue("ShipToAddress");
                if (shipToVars) {
                    var vendorAddress = JSON.parse(Variable.GetValueAsString("VendorAddress") || null);
                    var sameCountry = vendorAddress && (vendorAddress.ToCountry == shipToVars.ToCountry__);
                    shipToVars.ForceCountry = sameCountry ? "false" : "true";
                    var promises = [];
                    promises.push(ShipTo.FillFormattedPostalAddress(shipToVars));
                    if (vendorAddress) {
                        Log.Info("Filling vendor from shipto");
                        vendorAddress.ForceCountry = shipToVars.ForceCountry;
                        Variable.SetValueAsString("VendorAddress", JSON.stringify(vendorAddress));
                        promises.push(Lib.Purchasing.Vendor.FillPostalAddress(vendorAddress));
                    }
                    return Sys.Helpers.Promise.All(promises)
                        .Finally(function () { return Log.TimeEnd("ShipTo.Init"); });
                }
                else if (Data.GetValue("DeliveryAddressID__") && Data.GetValue("CompanyCode__")) {
                    return ShipTo.QueryShipToById(Data.GetValue("DeliveryAddressID__"), Data.GetValue("CompanyCode__"))
                        .Then(function (result) {
                        return Lib.Purchasing.ShipTo.FillAddressesWithCountry(function (field) { return result.GetValue(field); }, null, true);
                    })
                        .Catch(function (error) {
                        if (Sys.ScriptInfo.IsClient()) {
                            Sys.Helpers.Globals.Popup.Alert(error, true, null, "_error");
                        }
                        else {
                            Lib.CommonDialog.NextAlert.Define("_error", error, { isError: false }, error);
                        }
                    })
                        .Finally(function () { return Log.TimeEnd("ShipTo.Init"); });
                }
                return Sys.Helpers.Promise.Resolve()
                    .Finally(function () { return Log.TimeEnd("ShipTo.Init"); });
            }
            ShipTo.Init = Init;
            function IsEmpty() {
                return Sys.Helpers.IsEmpty(Data.GetValue("DeliveryAddressID__"))
                    && Sys.Helpers.IsEmpty(Data.GetValue("ShipToCompany__"))
                    && Sys.Helpers.IsEmpty(Data.GetValue("ShipToContact__"))
                    && Sys.Helpers.IsEmpty(Data.GetValue("ShipToPhone__"))
                    && Sys.Helpers.IsEmpty(Data.GetValue("ShipToEmail__"))
                    && Sys.Helpers.IsEmpty(Data.GetValue("ShipToAddress__"));
            }
            ShipTo.IsEmpty = IsEmpty;
            function IsEmptyItem(item) {
                return Sys.Helpers.IsEmpty(item.GetValue("ItemShipToCompany__"))
                    && Sys.Helpers.IsEmpty(item.GetValue("ItemDeliveryAddressID__"))
                    && Sys.Helpers.IsEmpty(item.GetValue("ItemShipToAddress__"));
            }
            ShipTo.IsEmptyItem = IsEmptyItem;
            function IsSetByUser() {
                return Variable.GetValueAsString("ShipTo_SetByUser__") === "true";
            }
            ShipTo.IsSetByUser = IsSetByUser;
            function SetByUser() {
                Variable.SetValueAsString("ShipTo_SetByUser__", "true");
                Variable.SetValueAsString("ShipToAddress", "");
            }
            ShipTo.SetByUser = SetByUser;
            function OnCustomShipToAddress() {
                // clean manually set address
                var addressLines = (this.GetValue() || "")
                    .replace(/\r?\n/, "\n")
                    .split("\n")
                    .map(function (line) { return line.trim(); })
                    .filter(function (line) { return !!line; });
                Data.SetValue("ShipToAddress__", addressLines.join("\n"));
                // custom address = no ID
                Data.SetValue("DeliveryAddressID__", "");
                // RETRO-COMPAT' - extract first line of the set address and consider it like the shipToCompany
                Data.SetValue("ShipToCompany__", addressLines[0] || "");
                SetByUser();
            }
            ShipTo.OnCustomShipToAddress = OnCustomShipToAddress;
            /**
             * RETRO-COMPAT: ShipToCompany is now included in the ShipToAddress (from S229).
             * For old documents, we always display the ShipToCompany field.
             */
            function IsShipToCompanyInAddressBlock() {
                var docVer = Sys.AppVersion.GetSerializedAppSprintVersion("P2P") || "0";
                return Sys.Helpers.String.CompareVersion(docVer, "5.229.0") >= 0;
            }
            ShipTo.IsShipToCompanyInAddressBlock = IsShipToCompanyInAddressBlock;
            /**
             * The following code may be necessary if the "from" item is in the old system (company not in address)
             */
            function MigrateOldShipToCompanyBehavior(item) {
                if (Lib.Purchasing.ShipTo.IsShipToCompanyInAddressBlock()) {
                    var multiShipToEnabled = Lib.Purchasing.IsMultiShipTo();
                    var itemFieldNamePrefix = multiShipToEnabled ? "Item" : "";
                    var companyFieldName_1 = itemFieldNamePrefix + "ShipToCompany__";
                    var addressFieldName_1 = itemFieldNamePrefix + "ShipToAddress__";
                    var migrateAddress = function (data) {
                        var shipToCompany = data.GetValue(companyFieldName_1) || "";
                        var shipToAddress = data.GetValue(addressFieldName_1) || "";
                        if (shipToAddress.indexOf(shipToCompany) === -1) {
                            data.SetValue(addressFieldName_1, "".concat(shipToCompany, "\r\n").concat(shipToAddress));
                        }
                    };
                    if (multiShipToEnabled) {
                        if (item) { // particular item ?
                            migrateAddress(item);
                        }
                        else {
                            Sys.Helpers.Data.ForEachTableItem("LineItems__", migrateAddress);
                        }
                    }
                    else {
                        migrateAddress(Data);
                    }
                }
            }
            ShipTo.MigrateOldShipToCompanyBehavior = MigrateOldShipToCompanyBehavior;
        })(ShipTo = Purchasing.ShipTo || (Purchasing.ShipTo = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
