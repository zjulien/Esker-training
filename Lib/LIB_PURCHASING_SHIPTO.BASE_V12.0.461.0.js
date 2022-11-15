///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_ShipTo.Base_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base Purchasing library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise",
    "Lib_Purchasing.Base_V12.0.461.0",
    "Sys/Sys_TechnicalData",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
// Common interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var ShipTo;
        (function (ShipTo) {
            ShipTo.shipToFieldsMapping = {
                "ID__": "DeliveryAddressID__",
                "ShipToCompany__": "ShipToCompany__",
                "ShipToContact__": "ShipToContact__",
                "ShipToPhone__": "ShipToPhone__",
                "ShipToEmail__": "ShipToEmail__"
            };
            ShipTo.itemShipToFieldsMapping = {
                "ID__": "ItemDeliveryAddressID__",
                "ShipToCompany__": "ItemShipToCompany__"
            };
            ShipTo.defaultQueryOptions = {
                table: "PurchasingShipTo__",
                attributes: ["ID__", "ShipToCompany__", "ShipToContact__", "ShipToPhone__", "ShipToEmail__", "ShipToSub__", "ShipToStreet__", "ShipToCity__", "ShipToZipCode__", "ShipToRegion__", "ShipToCountry__"],
                maxRecords: 1,
                additionalOptions: {
                    recordBuilder: Sys.GenericAPI.BuildQueryResult
                }
            };
            ShipTo.defaultCountryCode = "";
            function GetCountryCode(ShipToAddress) {
                var fromCountryCode = Lib.Purchasing.ShipTo.defaultCountryCode;
                if (ShipToAddress.ForceCountry === "false") {
                    fromCountryCode = ShipToAddress.ToCountry;
                }
                else if (!fromCountryCode) {
                    fromCountryCode = "US";
                }
                return fromCountryCode;
            }
            ShipTo.GetCountryCode = GetCountryCode;
            function FormatPostalAddress(ShipToAddress) {
                var shipToAddress = {
                    "ToName": ShipToAddress.ToName,
                    "ToSub": ShipToAddress.ToSub,
                    "ToMail": ShipToAddress.ToMail,
                    "ToPostal": ShipToAddress.ToPostal,
                    "ToCountry": ShipToAddress.ToCountry,
                    "ToState": ShipToAddress.ToState,
                    "ToCity": ShipToAddress.ToCity,
                    "ForceCountry": ShipToAddress.ForceCountry
                };
                var options = {
                    isVariablesAddress: true,
                    address: shipToAddress,
                    countryCode: Lib.Purchasing.ShipTo.GetCountryCode(shipToAddress) // Get country code from contract ModProvider
                };
                var OnShipToAddressFormatResult = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.OnShipToAddressFormat", options);
                if (OnShipToAddressFormatResult === false || OnShipToAddressFormatResult === null) {
                    return Sys.GenericAPI.PromisedCheckPostalAddress(options).Then(function (address) {
                        return Sys.Helpers.Promise.Resolve(address.FormattedBlockAddress.replace(/^ToRemove[^\r\n]*(\r|\n)+/, ""));
                    });
                }
                return Sys.Helpers.Promise.Resolve(OnShipToAddressFormatResult);
            }
            ShipTo.FormatPostalAddress = FormatPostalAddress;
            function FillFormattedPostalAddress(ShipToAddress, item) {
                Log.Time("ShipTo.FillFormattedPostalAddress");
                function _fillFieldPostalAddress(formattedPostalAddress, errorMsg) {
                    if (item) {
                        item.SetValue("ItemShipToAddress__", formattedPostalAddress);
                        if (errorMsg) {
                            item.SetWarning("ItemShipToAddress__", errorMsg);
                        }
                    }
                    else {
                        if (ShipToAddress.IsCustomShipToAddress) {
                            ShipToAddress.formattedpostaladdress = formattedPostalAddress;
                        }
                        Sys.TechnicalData.SetValue("ShipToAddress", ShipToAddress);
                        Data.SetValue("ShipToAddress__", formattedPostalAddress);
                        if (errorMsg) {
                            Data.SetWarning("ShipToAddress__", errorMsg);
                        }
                        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (tItem) {
                            if (!Lib.Purchasing.IsLineItemEmpty(tItem)) {
                                tItem.SetValue("ItemShipToAddress__", formattedPostalAddress);
                            }
                        });
                    }
                }
                var _fillPostalAddress = function () {
                    if (ShipToAddress.formattedpostaladdress) {
                        _fillFieldPostalAddress(ShipToAddress.formattedpostaladdress);
                        return Sys.Helpers.Promise.Resolve();
                    }
                    return FormatPostalAddress(ShipToAddress)
                        .Then(function (address) {
                        Log.Info("CheckPostalAddress input:  " + JSON.stringify(ShipToAddress));
                        Log.Info("CheckPostalAddress output: " + JSON.stringify(address));
                        if (address) {
                            Sys.Helpers.SilentChange(function () {
                                if (Sys.Helpers.IsString(address)) // FROM CUSTO
                                 {
                                    _fillFieldPostalAddress(address);
                                }
                                else if (!Sys.Helpers.IsEmpty(address.LastErrorMessage)) {
                                    _fillFieldPostalAddress(null, address.LastErrorMessage);
                                }
                                else {
                                    _fillFieldPostalAddress(address.FormattedBlockAddress.replace(/^ToRemove[^\r\n]*(\r|\n)+/, ""));
                                }
                            });
                        }
                    });
                };
                return _fillPostalAddress()
                    .Finally(function () {
                    Lib.Purchasing.ShipTo.MigrateOldShipToCompanyBehavior(item);
                    Log.TimeEnd("ShipTo.FillFormattedPostalAddress");
                });
            }
            ShipTo.FillFormattedPostalAddress = FillFormattedPostalAddress;
            function FillAddressesWithCountry(getValueFct, tableItem, withCompany, sameCountry) {
                if (sameCountry === void 0) { sameCountry = false; }
                var ShipToAddress = {
                    "ToName": withCompany ? getValueFct("ShipToCompany__") : "ToRemove",
                    "ToSub": getValueFct("ShipToSub__"),
                    "ToMail": getValueFct("ShipToStreet__"),
                    "ToPostal": getValueFct("ShipToZipCode__"),
                    "ToCountry": getValueFct("ShipToCountry__"),
                    "ToState": getValueFct("ShipToRegion__"),
                    "ToCity": getValueFct("ShipToCity__"),
                    "ForceCountry": sameCountry ? "false" : "true",
                    "IsCustomShipToAddress": getValueFct("IsCustomShipToAddress") === true,
                    "formattedpostaladdress": getValueFct("formattedpostaladdress")
                };
                return FillFormattedPostalAddress(ShipToAddress, tableItem);
            }
            ShipTo.FillAddressesWithCountry = FillAddressesWithCountry;
            function Fill(getValueFct, tableItem, firstItem) {
                Log.Time("ShipTo.Fill");
                if (tableItem) {
                    Sys.Helpers.Object.ForEach(ShipTo.itemShipToFieldsMapping, function (field, ctField) {
                        tableItem.SetValue(field, getValueFct(ctField));
                    });
                    if (firstItem) {
                        Data.SetValue("ShipToContact__", getValueFct("ShipToContact__"));
                        Data.SetValue("ShipToPhone__", getValueFct("ShipToPhone__"));
                        Data.SetValue("ShipToEmail__", getValueFct("ShipToEmail__"));
                    }
                }
                else {
                    Sys.Helpers.Object.ForEach(ShipTo.shipToFieldsMapping, function (field, ctField) {
                        Data.SetValue(field, getValueFct(ctField));
                    });
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                        if (!Lib.Purchasing.IsLineItemEmpty(item)) {
                            Sys.Helpers.Object.ForEach(ShipTo.itemShipToFieldsMapping, function (field, ctField) {
                                item.SetValue(field, getValueFct(ctField));
                            });
                        }
                    });
                }
                return FillAddressesWithCountry(getValueFct, tableItem, Lib.Purchasing.ShipTo.IsShipToCompanyInAddressBlock())
                    .Finally(function () {
                    Log.TimeEnd("ShipTo.Fill");
                });
            }
            ShipTo.Fill = Fill;
            function GetCompanyDeliveryAddressID(companyCode) {
                return Lib.P2P.CompanyCodesValue.QueryValues(companyCode).Then(function (CCValues) {
                    return Object.keys(CCValues).length > 0 ? CCValues.DeliveryAddressID__ : null;
                });
            }
            ShipTo.GetCompanyDeliveryAddressID = GetCompanyDeliveryAddressID;
            var queryShipToPromiseCache = {};
            function QueryShipToPromise(filter) {
                var key = filter.toString();
                if (!queryShipToPromiseCache[key]) {
                    var options_1 = __assign(__assign({}, ShipTo.defaultQueryOptions), { filter: filter.toString() });
                    queryShipToPromiseCache[key] = Sys.GenericAPI.PromisedQuery(options_1)
                        .Then(function (results) {
                        if (!results || !results.length) {
                            throw "No Record with filter " + options_1.filter;
                        }
                        return results[0];
                    });
                }
                return queryShipToPromiseCache[key];
            }
            ShipTo.QueryShipToPromise = QueryShipToPromise;
            function QueryShipToById(deliveryAddessId, companyCode) {
                var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("ID__", deliveryAddessId));
                return QueryShipToPromise(filter);
            }
            ShipTo.QueryShipToById = QueryShipToById;
            var defaultShipTo;
            function QueryDefaultShipTo(forceUpdate) {
                if (forceUpdate === void 0) { forceUpdate = false; }
                if (defaultShipTo && !forceUpdate) {
                    return Sys.Helpers.Promise.Resolve(defaultShipTo);
                }
                var companyCode = Data.GetValue("CompanyCode__");
                var companyCountry;
                return Lib.P2P.CompanyCodesValue.QueryValues(companyCode)
                    .Then(function (CCValues) {
                    var deliveryAddressID = null;
                    if (Object.keys(CCValues).length > 0) {
                        companyCountry = CCValues.Country__;
                        deliveryAddressID = CCValues.DeliveryAddressID__;
                    }
                    Log.Info("Get shipto info for " + companyCode);
                    return Lib.Purchasing.ShipTo.QueryShipToById(deliveryAddressID, companyCode);
                })
                    .Then(function (queryResult) {
                    defaultShipTo = queryResult;
                    var country = queryResult.GetValue("ShipToCountry__");
                    var vendorAddress = JSON.parse(Variable.GetValueAsString("VendorAddress") || null);
                    var sameCountry = (Lib.P2P.IsPR() && companyCountry == country) || (vendorAddress && (vendorAddress.ToCountry == country));
                    var shipToAddress = {
                        "ToName": Lib.Purchasing.ShipTo.IsShipToCompanyInAddressBlock() ? queryResult.GetValue("ShipToCompany__") : "ToRemove",
                        "ToSub": queryResult.GetValue("ShipToSub__"),
                        "ToMail": queryResult.GetValue("ShipToStreet__"),
                        "ToPostal": queryResult.GetValue("ShipToZipCode__"),
                        "ToCountry": country,
                        "ToState": queryResult.GetValue("ShipToRegion__"),
                        "ToCity": queryResult.GetValue("ShipToCity__"),
                        "ForceCountry": sameCountry ? "false" : "true"
                    };
                    return FormatPostalAddress(shipToAddress);
                })
                    .Then(function (formattedpostalAddress) {
                    defaultShipTo.formattedpostaladdress = formattedpostalAddress;
                    return defaultShipTo;
                });
            }
            ShipTo.QueryDefaultShipTo = QueryDefaultShipTo;
            function FillItemFromHeader(item) {
                item.SetValue("ItemShipToCompany__", Data.GetValue("ShipToCompany__"));
                item.SetValue("ItemShipToAddress__", Data.GetValue("ShipToAddress__"));
                item.SetValue("ItemDeliveryAddressID__", Data.GetValue("DeliveryAddressID__"));
            }
            ShipTo.FillItemFromHeader = FillItemFromHeader;
            function FillItemFromDefaultShipTo(item) {
                if (!Lib.Purchasing.IsLineItemEmpty(item)) {
                    QueryDefaultShipTo()
                        .Then(function () {
                        item.SetValue("ItemDeliveryAddressID__", defaultShipTo.GetValue("ID__"));
                        item.SetValue("ItemShipToCompany__", defaultShipTo.GetValue("ShipToCompany__"));
                        item.SetValue("ItemShipToAddress__", defaultShipTo.formattedpostaladdress);
                    })
                        .Catch(function (error) { return Log.Error(error); });
                }
            }
            ShipTo.FillItemFromDefaultShipTo = FillItemFromDefaultShipTo;
            function FillFromDefaultShipTo(updateDefaultShipTo, shouldUpdateItemShipTo) {
                if (updateDefaultShipTo === void 0) { updateDefaultShipTo = false; }
                // Use default delivery address in company code (PurchasingCompanycodes__.DeliveryAddressID__)
                return QueryDefaultShipTo(updateDefaultShipTo)
                    .Then(function (queryResult) {
                    return Lib.Purchasing.ShipTo.Fill(function (field) { return queryResult.GetValue(field); })
                        .Then(function () {
                        if (Lib.Purchasing.IsMultiShipTo()) {
                            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                                if (!Lib.Purchasing.IsLineItemEmpty(item) && (!shouldUpdateItemShipTo || shouldUpdateItemShipTo(item))) {
                                    FillItemFromDefaultShipTo(item);
                                }
                            });
                        }
                    });
                });
            }
            ShipTo.FillFromDefaultShipTo = FillFromDefaultShipTo;
        })(ShipTo = Purchasing.ShipTo || (Purchasing.ShipTo = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
