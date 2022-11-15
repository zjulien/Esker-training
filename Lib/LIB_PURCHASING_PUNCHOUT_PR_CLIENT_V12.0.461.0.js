///#GLOBALS Lib Sys
/// <reference path="../../PAC/Purchasing V2/Purchase Requisition process V2/typings_withDeleted/Controls_Purchase_Requisition_process_V2/index.d.ts"/>
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Punchout_PR_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "Client",
  "comment": "Punchout Library",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Helpers_TmpData",
    "Lib_P2P_V12.0.461.0",
    "Lib_Purchasing_Punchout_PR_Errors_V12.0.461.0",
    "Lib_P2P_Currency_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Punchout;
        (function (Punchout) {
            var CurrencyFactory = Lib.P2P.Currency.Factory;
            var PR = /** @class */ (function () {
                function PR() {
                }
                PR.GetPunchoutItemCount = function () {
                    return this.itemCount;
                };
                PR.Init = function () {
                    Data.OnStorageChange(function (e) {
                        Log.Info("Storage changed: " + JSON.stringify({
                            "type": e.type,
                            "key": e.key,
                            "oldValue": e.oldValue,
                            "newValue": e.newValue
                        }));
                        if (e.newValue && e.newValue.substr(0, 13) == "cXmlReceived=") {
                            Log.Info("End of punchout session");
                            var punchoutOrderMessageResult = JSON.parse(e.newValue.substr(13));
                            var buyerCookie = punchoutOrderMessageResult.buyerCookie;
                            Log.Info("Back from session " + buyerCookie);
                            var punchoutSession = Lib.Purchasing.Punchout.PR.externalCatalogSession[buyerCookie];
                            if (punchoutSession) {
                                punchoutSession.window.close();
                                Lib.Purchasing.Punchout.PR.AddItems(punchoutOrderMessageResult.items, punchoutSession.providerInfo);
                                delete Lib.Purchasing.Punchout.PR.externalCatalogSession[buyerCookie];
                            }
                            else {
                                Log.Warn("Punchout session not found: " + buyerCookie);
                            }
                        }
                    });
                };
                PR.AddItem = function (punchOutItem, unitPriceWarning, providerInfo) {
                    Lib.Purchasing.PRLineItems.fromUserChange = true;
                    var index = Data.GetTable("LineItems__").GetItemCount() - 1;
                    // fill	 item line
                    var item = Data.GetTable("LineItems__").GetItem(index);
                    // fill Reference and Description. We don't add supplierPartAuxiliaryId which could be quite long and is already present in ItemInCxml__ field
                    item.SetValue("SupplierPartID__", punchOutItem.supplierPartId);
                    item.SetValue("ItemDescription__", punchOutItem.description);
                    // fill Amounts
                    item.SetValue("ItemQuantity__", punchOutItem.quantity);
                    item.SetValue("ItemCurrency__", punchOutItem.currency);
                    // fill	leadTime and requestedDeliveryDate
                    var leadTime = Sys.Helpers.IsEmpty(punchOutItem.leadTime) ? providerInfo.DefaultLeadTime__ : punchOutItem.leadTime;
                    item.SetValue("LeadTime__", leadTime);
                    item.SetValue("ItemOrigin__", "ExternalCatalog");
                    //Fix FT - 026729 => All punchout items should be Quantity Based, not based on last row
                    item.SetValue("ItemType__", Lib.P2P.ItemType.QUANTITY_BASED);
                    // when leadTime is empty, do not set ItemRequestedDeliveryDate__ as in Purchasing.PRLineItems.RequestedDeliveryDate.Set(item);
                    if (!Sys.Helpers.IsEmpty(leadTime)) {
                        item.SetValue("ItemRequestedDeliveryDate__", Purchasing.PRLineItems.RequestedDeliveryDate.AddLeadTime(leadTime));
                    }
                    // Unit of Measure description lookup
                    // We mays be doing here what the framework should be doing by itself:
                    //   1. ItemUnit__ lookup in database to fetch ItemUnitDescription__
                    //   2. Set an error if the ItemUnit__ does not exists
                    // TODO: QUERY CACHE
                    if (Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure") && punchOutItem.unitOfMeasure) {
                        item.SetValue("ItemUnit__", punchOutItem.unitOfMeasure);
                        Sys.GenericAPI.PromisedQuery({
                            table: "P2P - UnitOfMeasure__",
                            filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("UnitOfMeasure__", punchOutItem.unitOfMeasure), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__"))).toString(),
                            attributes: Controls.LineItems__.ItemUnit__.GetDisplayedColumns().split("|"),
                            maxRecords: 1
                        })
                            .Then(function (result) {
                            if (result && result.length > 0) {
                                item.SetValue("ItemUnitDescription__", result[0].Description__);
                            }
                            else {
                                item.SetCategorizedError("ItemUnit__", Lib.AP.TouchlessException.InvalidValue, "Field value does not belong to table!");
                            }
                        })
                            .Catch(function (error) { return Log.Error("[Punchout] fetch UOM error: " + error); });
                    }
                    // Set unit price and warning
                    item.SetValue("ItemUnitPrice__", parseFloat(punchOutItem.unitPrice));
                    if (unitPriceWarning) {
                        item.SetWarning("ItemUnitPrice__", unitPriceWarning);
                    }
                    //Fake supplytype id to prevent OnAddItem (triggered by LeaveEmptyLine) to add a default supplyType that can change the one returned by QueryUNSPSCSupplyType
                    item.SetValue("SupplyTypeID__", "####");
                    // fill Supply type information
                    Lib.Purchasing.Items.QueryUNSPSCSupplyType(punchOutItem.unspsc)
                        .Then(function (result) {
                        var supplyTypeId = result && result.length ? result[0].SupplyTypeId__ : providerInfo.SupplyTypeId__;
                        var customSupplyTypeId = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetSupplyTypeIdFromUNSPSC", punchOutItem.unspsc, supplyTypeId);
                        supplyTypeId = customSupplyTypeId || supplyTypeId;
                        item.SetValue("SupplyTypeID__", supplyTypeId);
                        Lib.Purchasing.PRLineItems.SupplyType.FillInducedFields(item);
                        // Fill buyer and recipient with current user
                        Lib.Purchasing.PRLineItems.SupplyType.FillBuyerAndRecipient(item, index);
                    });
                    item.SetValue("ItemInCxml__", punchOutItem.rawXmlIn);
                    // Fill vendor information
                    item.SetValue("VendorNumber__", providerInfo.SupplierID__);
                    var filter = "(&(Number__=" + providerInfo.SupplierID__ + ")(|(CompanyCode__=" + Data.GetValue("CompanyCode__") + ")(CompanyCode__=)))";
                    var fields = Controls.LineItems__.VendorNumber__.GetDisplayedColumns().split("|");
                    Sys.GenericAPI.PromisedQuery({
                        table: "AP - Vendors__",
                        filter: filter,
                        attributes: fields,
                        maxRecords: 1
                    })
                        .Then(function (result) {
                        if (result.length == 0) {
                            throw "No vendor found, result are empty";
                        }
                        item.SetValue("VendorName__", result[0].Name__);
                    })
                        .Catch(function (error) {
                        Log.Error("[Punchout] fetch vendor error: " + error);
                    });
                    Lib.Purchasing.PRLineItems.ExchangeRate.Set(item);
                    Lib.Purchasing.PRLineItems.ComputeItemAmount(index);
                    //Will trigger OnAddItem because it's a new line
                    Lib.Purchasing.PRLineItems.LeaveEmptyLine();
                };
                PR.AddItems = function (punchOutItems, providerInfo) {
                    // Add items to PR, filter items we can't process
                    var itemsWithErrors = [];
                    for (var _i = 0, punchOutItems_1 = punchOutItems; _i < punchOutItems_1.length; _i++) {
                        var punchOutItem = punchOutItems_1[_i];
                        var result = this.CheckPunchoutItem(punchOutItem);
                        if (!result.error) {
                            Lib.Purchasing.Punchout.PR.AddItem(punchOutItem, result.warn, providerInfo);
                        }
                        else {
                            itemsWithErrors.push({ item: punchOutItem, error: result.error });
                        }
                    }
                    // Display error popup containing items we can't process
                    if (itemsWithErrors.length > 0) {
                        Lib.Purchasing.Punchout.Errors.PopupPunchoutErrors(itemsWithErrors);
                    }
                };
                PR.CheckPunchoutItem = function (punchOutItem) {
                    if ((punchOutItem.unitOfMeasure && punchOutItem.priceBasisUnitOfMeasure && punchOutItem.priceBasisUnitOfMeasure != punchOutItem.unitOfMeasure) ||
                        (punchOutItem.priceBasisConversionFactor && parseFloat(punchOutItem.priceBasisConversionFactor) != 1)) {
                        // not implemented - different UOM and/or conversionFactor != 1
                        Log.Error("Conversion scenario not yet implemented: item ".concat(punchOutItem.rawXmlIn));
                        return {
                            error: Language.Translate("_supplier unit price involves unit conversions between order and pricing, which is not a handled scenario")
                        };
                        // A more detailed but probably less harder to understand message would be:
                        // item.SetError("ItemUnitPrice__", Language.Translate("_supplier unit price is {3} {0} for {1} {4} and 1 {4} is {5} {2}",
                        // 		true,
                        // 		punchOutItem.unitPrice,
                        // 		punchOutItem.priceBasisQuantity,
                        // 		punchOutItem.unitOfMeasure,
                        // 		punchOutItem.currency,
                        // 		punchOutItem.priceBasisUnitOfMeasure,
                        // 		1 / parseFloat(punchOutItem.priceBasisConversionFactor)));
                    }
                    else if (punchOutItem.priceBasisQuantity && parseFloat(punchOutItem.priceBasisQuantity) != 1) {
                        // PriceBasisQuantity@quantity case: compute unit price again if it is given for more than one unit
                        Log.Warn("Item ".concat(punchOutItem.supplierPartId, " unit price is reeavaluated since it has a price basis quantity of ").concat(punchOutItem.priceBasisQuantity));
                        var newUnitPrice = Sys.Helpers.Round(new Sys.Decimal(punchOutItem.unitPrice)
                            .div(new Sys.Decimal(punchOutItem.priceBasisQuantity)), CurrencyFactory.Get(punchOutItem.currency).unitPricePrecision);
                        // if the re-computed unit price has lost too much precision so it's now zero => show an error to the user
                        if (newUnitPrice.isZero()) {
                            return {
                                error: Language.Translate("_unit price has been recomputed from supplier informations and has lost precision {3} {0} / {1} {2}", true, Language.FormatNumber(punchOutItem.unitPrice), Language.FormatNumber(punchOutItem.priceBasisQuantity, true), punchOutItem.unitOfMeasure, punchOutItem.currency)
                            };
                        }
                        var ret = {
                            warn: Language.Translate("_unit price has been recomputed from supplier informations: {3} {0} / {1} {2}", true, Language.FormatNumber(punchOutItem.unitPrice), Language.FormatNumber(punchOutItem.priceBasisQuantity, true), punchOutItem.unitOfMeasure, punchOutItem.currency)
                        };
                        punchOutItem.unitPrice = newUnitPrice.toNumber().toString();
                        return ret;
                    }
                    return {};
                };
                PR.SetControl = function (control, providerInfo) {
                    control.SetIconURL(providerInfo.LogoURL__);
                    control.OnClick = function () {
                        if (Lib.Purchasing.PRLineItems.Count() >= Controls.LineItems__.GetLineCount()) {
                            var Options = {
                                message: Language.Translate("You can not add more than {0} items", false, Controls.LineItems__.GetLineCount()),
                                status: "warning"
                            };
                            Popup.Snackbar(Options);
                        }
                        else {
                            Lib.Purchasing.Punchout.PR.OpenPunchoutSite(providerInfo);
                        }
                    };
                };
                PR.OpenPunchoutSite = function (providerInfo, selectedItem) {
                    Log.Info("Starting punchout");
                    localStorage.removeItem("cXML");
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Enabled__", "1"), Sys.Helpers.LdapUtil.FilterEqual("ConfigurationName__", providerInfo.ConfigurationName__), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""))).toString();
                    var onPunchoutOpenResult = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.OnPunchoutOpen", providerInfo);
                    var punchoutParams = {
                        filter: filter
                    };
                    if (onPunchoutOpenResult) {
                        Sys.Helpers.Extend(true, punchoutParams, { "extrinsic": onPunchoutOpenResult.extrinsic });
                    }
                    if (selectedItem) {
                        Sys.Helpers.Extend(true, punchoutParams, {
                            "selectedItem": {
                                "supplierPartID": selectedItem["ITEMNUMBER__.SUPPLIERPARTID__"] || selectedItem.ITEMNUMBER__,
                                "supplierPartAuxiliaryID": selectedItem["ITEMNUMBER__.SUPPLIERPARTAUXID__"] || selectedItem.ITEMSUPPLIERPARTAUXID__
                            }
                        });
                    }
                    Lib.Purchasing.Punchout.PR.lastPunchoutWindow = Sys.Helpers.Globals.Punchout.Open(punchoutParams, function (data) {
                        if (!data.error) {
                            Log.Info("Punchout open ok " + JSON.stringify(data));
                            Lib.Purchasing.Punchout.PR.externalCatalogSession[data.buyerCookie] = {
                                window: Lib.Purchasing.Punchout.PR.lastPunchoutWindow,
                                providerInfo: providerInfo
                            };
                        }
                    });
                };
                PR.GetPunchoutSites = function (sites) {
                    var func = Sys.Helpers.TryGetFunction("Lib.PR.Customization.Client.GetPunchoutSites");
                    if (func) {
                        sites = func(sites);
                        if (sites === void 0) {
                            sites = [];
                        }
                    }
                    return sites;
                };
                PR.ForEachPunchoutButton = function (callback) {
                    for (var buttonIdx = 1; buttonIdx <= 10; buttonIdx++) {
                        var control = Controls["PunchoutButton" + buttonIdx + "__"];
                        callback(control, buttonIdx);
                    }
                };
                PR.InitPane = function () {
                    ProcessInstance.SetSilentChange(true);
                    var hidePunchoutButtons = Data.GetValue("RequisitionStatus__").toUpperCase() !== "TO COMPLETE" || !Lib.Purchasing.LayoutPR.IsRequesterStep();
                    if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                        Controls.PunchoutButtons.Hide(false);
                        Controls.Button__.Hide(hidePunchoutButtons);
                        Controls.AddFromCatalog2__.Hide(hidePunchoutButtons);
                        Controls.UploadQuote2__.Hide(hidePunchoutButtons);
                        Controls.LoadFromClipboard__.Hide(hidePunchoutButtons);
                    }
                    var punchoutButtonConfigs = [];
                    // reset configs => FormTemplate will be applied
                    Sys.Helpers.TmpData.SetValue("PunchoutButtonConfigs", punchoutButtonConfigs);
                    var promiseResult = Sys.Helpers.Promise.Resolve();
                    if (!hidePunchoutButtons) {
                        promiseResult = Lib.Purchasing.Punchout.LoadConfigs()
                            .Then(function (result) {
                            Lib.Purchasing.Punchout.PR.ForEachPunchoutButton(function (button, idx) {
                                if (idx <= result.length) {
                                    var config = result[idx - 1];
                                    punchoutButtonConfigs[idx - 1] = config;
                                    Lib.Purchasing.Punchout.PR.SetControl(button, config);
                                    if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                                        button.Hide(false);
                                    }
                                }
                                else if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                                    button.Hide(true);
                                }
                            });
                        })
                            .Catch()
                            .Finally(function () {
                            Sys.Helpers.TmpData.SetValue("PunchoutButtonConfigs", punchoutButtonConfigs);
                        });
                    }
                    else if (!Lib.Purchasing.LayoutPR.FormTemplateManager) {
                        Lib.Purchasing.Punchout.PR.ForEachPunchoutButton(function (button /*, idx*/) {
                            button.Hide(true);
                        });
                    }
                    return promiseResult.Finally(function () {
                        Lib.Purchasing.Punchout.PR.deferredLoadingPane.resolve();
                        ProcessInstance.SetSilentChange(false);
                    });
                };
                PR.WaitForLoadingPane = function () {
                    return Lib.Purchasing.Punchout.PR.deferredLoadingPane.promise;
                };
                PR.externalCatalogSession = {}; // Windows by BuyerCookie
                PR.lastPunchoutWindow = null; // Last window opened
                PR.itemCount = 0;
                PR.deferredLoadingPane = Sys.Helpers.Promise.Defer();
                return PR;
            }());
            Punchout.PR = PR;
            var punchoutSites = {};
            function LoadConfigs() {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    var CompanyCode = Data.GetValue("CompanyCode__");
                    if (Sys.Helpers.IsUndefined(punchoutSites[CompanyCode])) {
                        var filter = "(&(Enabled__=1)(|(CompanyCode__=" + CompanyCode + ")(CompanyCode__=)))";
                        Sys.Helpers.Globals.Punchout.GetConfigs({ filter: filter }, function (queryResult, error) {
                            if (error) {
                                Log.Error("Error querying punchout config " + error);
                                reject(error);
                            }
                            else {
                                punchoutSites[CompanyCode] = Lib.Purchasing.Punchout.PR.GetPunchoutSites(queryResult);
                                resolve(punchoutSites[CompanyCode]);
                            }
                        });
                    }
                    else {
                        resolve(punchoutSites[CompanyCode]);
                    }
                });
            }
            Punchout.LoadConfigs = LoadConfigs;
            function GetConfigs() {
                var CompanyCode = Data.GetValue("CompanyCode__");
                return punchoutSites[CompanyCode];
            }
            Punchout.GetConfigs = GetConfigs;
        })(Punchout = Purchasing.Punchout || (Purchasing.Punchout = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
