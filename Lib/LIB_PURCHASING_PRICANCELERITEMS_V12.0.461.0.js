///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_PRICancelerItems_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library to manage items in PR Items Canceler",
  "require": [
    "Sys/Sys_Helpers_String",
    "Lib_Purchasing_Items_V12.0.461.0"
  ]
}*/
// Common interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var PRICancelerItems;
        (function (PRICancelerItems) {
            // Members declaration and implementation
            var MAXRECORDS = Lib.Purchasing.Items.MAXRECORDS;
            var PRItemsDBInfo = Lib.Purchasing.Items.PRItemsDBInfo;
            var PRItemsToPRICanceler = Lib.Purchasing.Items.PRItemsToPRICanceler;
            /**
             * Fill extra fields on PO items. This function is set as option when calling FillFormItems function.
             * @param {object} dbItem current pr item in database
             * @param {object} item current po item in form
             * @param {object} options options used to fill items
             */
            function CompleteFormItem(dbItem, item, options) {
                var requesterLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("RequesterDN__"));
                var CancelableQuantity = new Sys.Decimal(dbItem.GetValue("Quantity__")).minus(dbItem.GetValue("CanceledQuantity__") || 0).minus(dbItem.GetValue("OrderedQuantity__") || 0).toNumber();
                var CancelableAmount = new Sys.Decimal(dbItem.GetValue("NetAmount__")).minus(dbItem.GetValue("CanceledAmount__") || 0).minus(dbItem.GetValue("ItemOrderedAmount__") || 0).toNumber();
                item.SetValue("CancelableQuantity__", CancelableQuantity);
                item.SetValue("CancelableAmount__", CancelableAmount);
                Sys.OnDemand.Users.CacheByLogin.Get(requesterLogin, Lib.P2P.attributesForUserCache).Then(function (result) {
                    var user = result[requesterLogin];
                    if (!user.$error) {
                        item.SetValue("RequesterName__", user.displayname ? user.displayname : user.login);
                    }
                });
                return true;
            }
            PRICancelerItems.CompleteFormItem = CompleteFormItem;
            /**
             * Fill the PRICanceler form according to the selected PR items by the specified filter.
             * @param {object} options
             * @returns {promise}
             */
            function FillForm(filter, options) {
                options = options || {};
                options.fillItem = options.fillItem || CompleteFormItem;
                return Sys.GenericAPI.PromisedQuery({
                    table: PRItemsDBInfo.table,
                    filter: filter,
                    attributes: ["*"],
                    sortOrder: options.orderByClause || "",
                    maxRecords: MAXRECORDS,
                    additionalOptions: {
                        recordBuilder: Sys.GenericAPI.BuildQueryResult,
                        fieldToTypeMap: PRItemsDBInfo.fieldsMap
                    }
                })
                    .Then(function (dbItems) {
                    if (dbItems.length === 0) {
                        throw "FillForm: cannot find any PR items with filter: " + filter;
                    }
                    if (Sys.Helpers.IsArray(options.orderByMsn)) {
                        // by default we look for based on MsnEx
                        // If we don't find item based on this field the first time, we base on Msn
                        var searchOnMsnEx_1 = true;
                        dbItems = options.orderByMsn.map(function (msn) {
                            var foundItem;
                            if (searchOnMsnEx_1) {
                                foundItem = Sys.Helpers.Array.Find(dbItems, function (item) {
                                    return item.GetValue("MsnEx") === msn;
                                });
                            }
                            if (!foundItem) {
                                searchOnMsnEx_1 = false;
                                foundItem = Sys.Helpers.Array.Find(dbItems, function (item) {
                                    return item.GetValue("Msn") === msn;
                                });
                            }
                            return foundItem;
                        });
                    }
                    return Lib.Purchasing.Items.LoadForeignData(dbItems, PRItemsDBInfo)
                        .Then(function (foreignData) {
                        options.foreignData = foreignData;
                        var fieldsInError = Lib.Purchasing.Items.FillFormItems(dbItems, PRItemsToPRICanceler, options);
                        if (fieldsInError.length > 0) {
                            // Reject with error message of the first field
                            throw PRItemsToPRICanceler.errorMessages[fieldsInError[0]] ||
                                "Some items have different values on the following fields: " + fieldsInError.join(", ");
                        }
                    });
                })
                    .Catch(function (error) {
                    throw "FillForm: error querying PR items with filter. Details: " + error;
                });
            }
            PRICancelerItems.FillForm = FillForm;
        })(PRICancelerItems = Purchasing.PRICancelerItems || (Purchasing.PRICancelerItems = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
