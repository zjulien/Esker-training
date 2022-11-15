/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_CatalogHelper.SupplyTypesManager_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_Purchasing_CatalogHelper",
  "require": [
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]",
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Promise"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var CatalogHelper;
        (function (CatalogHelper) {
            CatalogHelper.SupplyTypesManager = (function () {
                var purchasingSupplyPromiseCache = {};
                var supplyTypesCache = [];
                var Query = function () {
                    var currentCompanyCode = Data.GetValue("CompanyCode__");
                    Log.Info("LoadPurchasingSupplyType for CompanyCode : " + currentCompanyCode);
                    supplyTypesCache = [];
                    var options = {
                        table: "PurchasingSupply__",
                        filter: "(|(CompanyCode__=" + currentCompanyCode + ")(!(CompanyCode__=*))(CompanyCode__=))",
                        attributes: ["SupplyID__", "Name__", "CompanyCode__", "RecipientLogin__", "BuyerLogin__", "DefaultCostType__", "DefaultGLAccount__", "DefaultGLAccount__.Group__", "NoGoodsReceipt__", "NotifyRequesterOnReceipt__", "ParentSupplyID__", "FullName__"],
                        sortOrder: "Name__ ASC",
                        maxRecords: "FULL_RESULT",
                        additionalOptions: "EnableJoin=1"
                    };
                    return Sys.GenericAPI.PromisedQuery(options)
                        .Then(function (queryResult) {
                        if (queryResult.length > 0) {
                            Sys.Helpers.Array.ForEach(queryResult, function (result) {
                                supplyTypesCache.push({
                                    companyCode: result.CompanyCode__,
                                    name: result.Name__,
                                    fullName: result.FullName__,
                                    defaultCostType: result.DefaultCostType__,
                                    defaultGLAccount: result.DefaultGLAccount__,
                                    defaultGLAccountGroup: result["DefaultGLAccount__.Group__"],
                                    id: result.SupplyID__,
                                    recipientLogin: result.RecipientLogin__,
                                    buyerLogin: result.BuyerLogin__,
                                    isRecipientBrowsable: Sys.Helpers.IsEmpty(result.RecipientLogin__),
                                    noGoodsReceipt: result.NoGoodsReceipt__,
                                    notifyRequesterOnReceipt: result.NotifyRequesterOnReceipt__,
                                    parentId: result.ParentSupplyID__,
                                    childrenIds: [],
                                    GetPath: function () {
                                        var _this = this;
                                        if (this.fullName) {
                                            return this.fullName;
                                        }
                                        if (this.parentId) {
                                            var parent = Sys.Helpers.Array.Find(supplyTypesCache, function (item) {
                                                return item.id == _this.parentId && (item.companyCode == currentCompanyCode || Sys.Helpers.IsEmpty(item.companyCode));
                                            });
                                            return parent.GetPath() + "/" + this.id;
                                        }
                                        return this.id;
                                    }
                                });
                            });
                        }
                    })
                        .Then(function () {
                        Sys.Helpers.Array.ForEach(supplyTypesCache, function (supplyType) {
                            if (supplyType.parentId) {
                                var parent = Sys.Helpers.Array.Find(supplyTypesCache, function (parentSupply) {
                                    return parentSupply.id === supplyType.parentId;
                                });
                                parent.childrenIds.push(supplyType.id);
                            }
                        });
                    })
                        .Catch(function (error) {
                        Log.Error(error);
                    });
                };
                var ToString = function () {
                    var currentCompanyCode = Data.GetValue("CompanyCode__");
                    var str = "";
                    str += "*=_AllPurchasingSupply";
                    Sys.Helpers.Array.ForEach(supplyTypesCache, function (obj) {
                        if (obj.companyCode === currentCompanyCode || Sys.Helpers.IsEmpty(obj.companyCode)) {
                            str += "\n" + obj.name + "=" + obj.name;
                        }
                    });
                    return str;
                };
                var Get = function (supplyTypeId) {
                    var currentCompanyCode = Data.GetValue("CompanyCode__");
                    var promiseCacheKey = currentCompanyCode + "_" + supplyTypeId;
                    var getSupplyType = function () {
                        var supplyType = Sys.Helpers.Array.Find(supplyTypesCache, function (item) {
                            return item.id == supplyTypeId && (item.companyCode == currentCompanyCode || Sys.Helpers.IsEmpty(item.companyCode));
                        });
                        if (supplyType) {
                            return Sys.Helpers.Promise.Resolve(supplyType);
                        }
                        var options = {
                            table: "PurchasingSupply__",
                            filter: "(&(SupplyID__=" + supplyTypeId + ")(|(CompanyCode__=" + currentCompanyCode + ")(!(CompanyCode__=*))))",
                            attributes: ["SupplyID__", "Name__", "CompanyCode__", "RecipientLogin__", "BuyerLogin__", "DefaultCostType__", "DefaultGLAccount__", "DefaultGLAccount__.Group__", "NoGoodsReceipt__", "NotifyRequesterOnReceipt__", "ParentSupplyID__", "FullName__"],
                            sortOrder: "Name__ ASC",
                            maxRecords: 1,
                            additionalOptions: "EnableJoin=1"
                        };
                        return Sys.GenericAPI.PromisedQuery(options)
                            .Then(function (queryResult) {
                            if (queryResult.length > 0) {
                                return {
                                    companyCode: queryResult[0].CompanyCode__,
                                    name: queryResult[0].Name__,
                                    fullName: queryResult[0].FullName__,
                                    defaultCostType: queryResult[0].DefaultCostType__,
                                    defaultGLAccount: queryResult[0].DefaultGLAccount__,
                                    defaultGLAccountGroup: queryResult[0]["DefaultGLAccount__.Group__"],
                                    id: queryResult[0].SupplyID__,
                                    recipientLogin: queryResult[0].RecipientLogin__,
                                    buyerLogin: queryResult[0].BuyerLogin__,
                                    isRecipientBrowsable: Sys.Helpers.IsEmpty(queryResult[0].RecipientLogin__),
                                    noGoodsReceipt: queryResult[0].NoGoodsReceipt__,
                                    notifyRequesterOnReceipt: queryResult[0].NotifyRequesterOnReceipt__,
                                    parentId: queryResult[0].ParentSupplyID__
                                };
                            }
                            return supplyType;
                        })
                            .Catch(function (error) {
                            Log.Error(error);
                            return supplyType;
                        });
                    };
                    return purchasingSupplyPromiseCache[promiseCacheKey] || (purchasingSupplyPromiseCache[promiseCacheKey] = getSupplyType());
                };
                var GetChildren = function (supplyTypeId) {
                    var currentCompanyCode = Data.GetValue("CompanyCode__");
                    var children = [];
                    if (supplyTypeId) {
                        var supplyType = Sys.Helpers.Array.Find(supplyTypesCache, function (item) {
                            return item.id == supplyTypeId && (item.companyCode == currentCompanyCode || Sys.Helpers.IsEmpty(item.companyCode));
                        });
                        if (supplyType) {
                            Sys.Helpers.Array.ForEach(supplyType.childrenIds, function (childID) {
                                var childObj = Sys.Helpers.Array.Find(supplyTypesCache, function (item) {
                                    return item.id == childID && (item.companyCode == currentCompanyCode || Sys.Helpers.IsEmpty(item.companyCode));
                                });
                                children.push({
                                    id: childObj.id,
                                    value: childObj.name
                                });
                            });
                        }
                    }
                    else {
                        // Sends all items without parents
                        Sys.Helpers.Array.ForEach(supplyTypesCache, function (item) {
                            if (Sys.Helpers.IsEmpty(item.parentId)) {
                                children.push({
                                    id: item.id,
                                    value: item.name
                                });
                            }
                        });
                    }
                    return children;
                };
                var GetChildrenTree = function (supplyTypeId) {
                    var allChildren = GetChildren(supplyTypeId);
                    Sys.Helpers.Array.ForEach(allChildren, function (child) {
                        allChildren = allChildren.concat(GetChildren(child.id));
                    });
                    return allChildren;
                };
                var GetFullPath = function (supplyTypeId) {
                    var currentCompanyCode = Data.GetValue("CompanyCode__");
                    var supplyType = Sys.Helpers.Array.Find(supplyTypesCache, function (item) {
                        return item.id == supplyTypeId && (item.companyCode == currentCompanyCode || Sys.Helpers.IsEmpty(item.companyCode));
                    });
                    if (supplyType != null) {
                        return supplyType.GetPath();
                    }
                    return "";
                };
                return {
                    Query: Query,
                    Get: Get,
                    ToString: ToString,
                    GetChildren: GetChildren,
                    GetChildrenTree: GetChildrenTree,
                    GetFullPath: GetFullPath
                };
            })();
        })(CatalogHelper = Purchasing.CatalogHelper || (Purchasing.CatalogHelper = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
