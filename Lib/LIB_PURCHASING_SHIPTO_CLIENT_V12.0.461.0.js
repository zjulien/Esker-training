///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ShipTo_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "Purchasing library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_OnDemand_Users",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "Lib_P2P_V12.0.461.0",
    "Lib_Purchasing_ShipTo.Base_V12.0.461.0",
    "Sys/Sys_TechnicalData"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ShipTo;
        (function (ShipTo) {
            /**
             * PS can add those line in Lib.P2P.Customization.Common
             * if(Lib.Purchasing && Lib.Purchasing.ShipTo)
             * {
             * 		Lib.Purchasing.ShipTo.defaultCountryCode = "US";
             * }
             */
            var isReadOnly = false;
            function InitControls(readOnly, OnSelectItem) {
                isReadOnly = readOnly;
                Controls.ShipToCompany__.SetAttributes("ID__");
                Controls.ShipToCompany__.OnSelectItem = OnSelectItem;
                Controls.ShipToCompany__.ClearButtons();
                Controls.ShipToCompany__.AddButton("_My Address", "_My Address", { SHIPTOCOMPANY__: "__my address__" });
                Controls.ShipToCompany__.OnChange = ShipTo.SetByUser;
                Controls.ShipToContact__.OnChange = ShipTo.SetByUser;
                Controls.ShipToPhone__.OnChange = ShipTo.SetByUser;
                Controls.ShipToEmail__.OnChange = ShipTo.SetByUser;
                Controls.ShipToAddress__.OnChange = ShipTo.OnCustomShipToAddress;
                Controls.ShipToAddress__.OnBrowse = function () {
                    Controls.ShipToCompany__.DoBrowse();
                };
                Controls.LineItems__.ItemShipToCompany__.SetAttributes(Lib.Purchasing.ShipTo.GetContactAttributes());
                Controls.LineItems__.ItemShipToCompany__.OnSelectItem = OnSelectItem;
                Controls.LineItems__.ItemShipToCompany__.ClearButtons();
                Controls.LineItems__.ItemShipToCompany__.SetAllowTableValuesOnly(true);
                Controls.LineItems__.ItemShipToAddress__.OnBrowse = function () {
                    this.GetRow().ItemShipToCompany__.DoBrowse();
                };
                UpdateLayout(readOnly);
            }
            ShipTo.InitControls = InitControls;
            function UpdateLayout(readOnly) {
                isReadOnly = readOnly;
                var shipToCompanyInAddressBlock = Lib.Purchasing.ShipTo.IsShipToCompanyInAddressBlock();
                var multiShipTo = Lib.Purchasing.IsMultiShipTo();
                Controls.ShipToCompany__.Hide(multiShipTo || shipToCompanyInAddressBlock);
                Controls.ShipToCompany__.SetRequired(!multiShipTo && !shipToCompanyInAddressBlock && !readOnly);
                Controls.ShipToCompany__.SetReadOnly(readOnly);
                Controls.ShipToContact__.SetReadOnly(readOnly);
                Controls.ShipToPhone__.SetReadOnly(readOnly);
                Controls.ShipToEmail__.SetReadOnly(readOnly);
                Controls.ShipToAddress__.Hide(multiShipTo);
                Controls.ShipToAddress__.SetRequired(!multiShipTo && !readOnly);
                Controls.ShipToAddress__.SetReadOnly(true);
                Controls.ShipToAddress__.SetBrowsable(shipToCompanyInAddressBlock && !readOnly);
                Controls.LineItems__.ItemShipToCompany__.Hide(!multiShipTo || shipToCompanyInAddressBlock);
                Controls.LineItems__.ItemShipToCompany__.SetRequired(multiShipTo && !shipToCompanyInAddressBlock);
                Controls.LineItems__.ItemShipToCompany__.SetReadOnly(readOnly);
                Controls.LineItems__.ItemShipToAddress__.Hide(!multiShipTo);
                Controls.LineItems__.ItemShipToAddress__.SetRequired(multiShipTo);
                Controls.LineItems__.ItemShipToAddress__.SetBrowsable(multiShipTo && shipToCompanyInAddressBlock && !readOnly);
            }
            ShipTo.UpdateLayout = UpdateLayout;
            function OnAddItem(item, previousItem) {
                if (Sys.Helpers.IsEmpty(item.GetValue("ItemShipToCompany__")) &&
                    Sys.Helpers.IsEmpty(item.GetValue("ItemShipToAddress__")) &&
                    !Lib.Purchasing.IsLineItemEmpty(item)) {
                    if (previousItem && previousItem.GetValue("ItemShipToCompany__") && previousItem.GetValue("ItemShipToAddress__")) {
                        item.SetValue("ItemShipToCompany__", previousItem.GetValue("ItemShipToCompany__"));
                        item.SetValue("ItemShipToAddress__", previousItem.GetValue("ItemShipToAddress__"));
                        item.SetValue("ItemDeliveryAddressID__", previousItem.GetValue("ItemDeliveryAddressID__"));
                    }
                    else if (Data.GetValue("DeliveryAddressID__") && Data.GetValue("ShipToCompany__") && Data.GetValue("ShipToAddress__")) {
                        ShipTo.FillItemFromHeader(item);
                    }
                    else {
                        ShipTo.FillItemFromDefaultShipTo(item);
                    }
                }
            }
            ShipTo.OnAddItem = OnAddItem;
            function OnRefreshRow(index) {
                var multiShipTo = Lib.Purchasing.IsMultiShipTo();
                var row = Controls.LineItems__.GetRow(index);
                var item = row.GetItem();
                if (item && Lib.Purchasing.IsLineItemEmpty(item)) {
                    row.ItemShipToAddress__.SetError("");
                }
                row.ItemShipToAddress__.SetBrowsable(multiShipTo && !isReadOnly && !Lib.P2P.Inventory.IsReplenishmentItem(item));
            }
            ShipTo.OnRefreshRow = OnRefreshRow;
            /**
             * @returns {promise}
             */
            function FillFromShipToCompany(item, firstItem) {
                var companyCode = Data.GetValue("CompanyCode__");
                var itemShipToCompany = item.GetValue("ItemShipToCompany__");
                ProcessInstance.SetSilentChange(true);
                return Lib.Purchasing.ShipTo.QueryShipToByShipToCompany(itemShipToCompany, companyCode)
                    .Then(function (queryResult) {
                    return Lib.Purchasing.ShipTo.Fill(function (field) { return queryResult[field]; }, item, firstItem);
                })
                    .Catch(function (error) { return Log.Error(error); })
                    .Finally(function () {
                    ProcessInstance.SetSilentChange(false);
                });
            }
            ShipTo.FillFromShipToCompany = FillFromShipToCompany;
            /**
             * @returns {promise}
             */
            function FillFromCompanyCode(updateDefaultShipTo, shouldUpdateItemShipTo) {
                if (updateDefaultShipTo === void 0) { updateDefaultShipTo = false; }
                ProcessInstance.SetSilentChange(true);
                return ShipTo.FillFromDefaultShipTo(updateDefaultShipTo, shouldUpdateItemShipTo)
                    .Catch(function (error) { return Log.Error(error); })
                    .Finally(function () {
                    Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.OnFillFromCompanyCode");
                    ProcessInstance.SetSilentChange(false);
                });
            }
            ShipTo.FillFromCompanyCode = FillFromCompanyCode;
            function FillFromUser(userLogin, row) {
                return Sys.OnDemand.Users.CacheByLogin.Get(userLogin, Lib.P2P.attributesForUserCache.concat(["formattedpostaladdress"]))
                    .Then(function (result) {
                    Log.Info("Get shipto info for " + userLogin);
                    var user = result[userLogin];
                    if (user.$error) {
                        Log.Error(user.$error);
                        Popup.Alert(user.$error, true, null, "_Error");
                    }
                    else {
                        var tableItem_1 = row ? row.GetItem() : null;
                        // Use default delivery address in company code (PurchasingCompanycodes__.DeliveryAddressID__)
                        ShipTo.GetCompanyDeliveryAddressID(Data.GetValue("CompanyCode__"))
                            .Then(function (deliveryAddessId) {
                            var shipToAddress = {
                                "ID__": deliveryAddessId,
                                "ShipToCompany__": user.company,
                                "ShipToContact__": user.displayname,
                                "ShipToPhone__": user.phonenumber,
                                "ShipToEmail__": user.emailaddress,
                                "ShipToSub__": user.mailsub,
                                "ShipToStreet__": user.street,
                                "ShipToCity__": user.city,
                                "ShipToZipCode__": user.zipcode,
                                "ShipToRegion__": user.mailstate,
                                "ShipToCountry__": user.country,
                                "ShipToAddress__": user.formattedpostaladdress,
                                "formattedpostaladdress": user.formattedpostaladdress,
                                "IsCustomShipToAddress": true // indicate that the address is manually entered by the user
                            };
                            Lib.Purchasing.ShipTo.Fill(function (field) { return shipToAddress[field]; }, tableItem_1, row && row.GetLineNumber(true) === 1)
                                .Then(function () {
                                if (!user.formattedpostaladdress) {
                                    shipToAddress.formattedpostaladdress = (tableItem_1 || Data).GetValue(tableItem_1 ? "ItemShipToAddress__" : "ShipToAddress__");
                                    user.formattedpostaladdress = shipToAddress.formattedpostaladdress;
                                    Sys.OnDemand.Users.CacheByLogin.SetUserData(userLogin, "formattedpostaladdress", user.formattedpostaladdress);
                                }
                            });
                        });
                    }
                });
            }
            ShipTo.FillFromUser = FillFromUser;
            // Declare an user data attribute for User cache.
            Sys.OnDemand.Users.CacheByLogin.RegisterUserDataAttribute("formattedpostaladdress");
        })(ShipTo = Purchasing.ShipTo || (Purchasing.ShipTo = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
