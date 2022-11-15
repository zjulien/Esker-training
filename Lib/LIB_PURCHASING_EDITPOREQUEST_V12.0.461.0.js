///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_EditPORequest_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Purchasing library to manage items in Edit PO Request process",
  "require": [
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_String",
    "Lib_Purchasing_Items_V12.0.461.0",
    "Lib_Purchasing_V12.0.461.0"
  ]
}*/
// Common interface
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var EditPORequest;
        (function (EditPORequest) {
            /**
             * Fill extra fields on PO items. This function is set as option when calling FillFormItems function.
             * @param {object} dbItem current po item in database
             * @param {object} item current gr item in form
             * @param {object} options options used to fill items
             */
            function CompleteFormItem(dbItem, item, options) {
                var lineOpenQuantity = new Sys.Decimal(parseFloat(dbItem.GetValue("OrderedQuantity__")));
                var lineOpenAmount = new Sys.Decimal(dbItem.GetValue("NetAmount__"));
                if (lineOpenQuantity.equals(0) && lineOpenAmount.equals(0)) {
                    return false;
                }
                item.SetValue("OpenQuantity__", Math.max(0, lineOpenQuantity.toNumber())); // Avoid negative values for OpenQuantity
                item.SetValue("ItemOpenAmount__", Math.max(0, lineOpenAmount.toNumber())); // Avoid negative values for OpenAmount
                item.SetValue("POBudgetID__", dbItem.GetValue("BudgetID__"));
                if (options.autoReceiveOrderData) // only two possible case : equal to 'null' -> return false or equal to 'json object' -> return true
                 {
                    item.SetValue("ReceivedQuantity__", item.GetValue("OpenQuantity__"));
                    item.SetValue("NetAmount__", item.GetValue("ItemOpenAmount__"));
                    item.SetValue("DeliveryCompleted__", true);
                }
                var requesterLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("RequesterDN__"));
                Sys.OnDemand.Users.CacheByLogin.Get(requesterLogin, Lib.P2P.attributesForUserCache).Then(function (result) {
                    var user = result[requesterLogin];
                    if (!user.$error) {
                        Sys.Helpers.SilentChange(function () {
                            item.SetValue("RequesterName__", user.displayname ? user.displayname : user.login);
                        });
                    }
                });
                var recipientLogin = Sys.Helpers.String.ExtractLoginFromDN(dbItem.GetValue("RecipientDN__"));
                Sys.OnDemand.Users.CacheByLogin.Get(recipientLogin, Lib.P2P.attributesForUserCache).Then(function (result) {
                    var user = result[recipientLogin];
                    if (!user.$error) {
                        Sys.Helpers.SilentChange(function () {
                            item.SetValue("RecipientName__", user.displayname ? user.displayname : user.login);
                        });
                    }
                });
                return true;
            }
            EditPORequest.CompleteFormItem = CompleteFormItem;
            function FillEditPORequest(dbItems, options) {
                var fieldsInError = Lib.Purchasing.Items.FillFormItems(dbItems, Lib.Purchasing.Items.POItemsToEditPORequest, options);
                Lib.Purchasing.Items.ComputeTotalAmount();
                var table = Data.GetTable(Lib.Purchasing.Items.POItemsToEditPORequest.formTable);
                var item = table.GetItem(0);
                var buyerLogin = Sys.Helpers.String.ExtractLoginFromDN(item.GetValue("BuyerDN__"));
                var buyerUser = Sys.Helpers.Globals.Users.GetUserAsProcessAdmin(buyerLogin);
                Data.SetValue("BuyerLogin__", buyerLogin);
                Data.SetValue("BuyerName__", buyerUser.GetValue("DisplayName"));
                return Lib.Purchasing.SetERPByCompanyCode(Data.GetValue("CompanyCode__"))
                    .Then(function () {
                    Lib.P2P.InitSAPConfiguration(Lib.ERP.GetERPName(), "PAC");
                    return fieldsInError;
                });
            }
            function CheckError(fieldsInError) {
                if (fieldsInError.length > 0) {
                    // Reject with error message of the first field
                    return Sys.Helpers.Promise.Reject(Lib.Purchasing.Items.POItemsToGR.errorMessages[fieldsInError[0]] ||
                        "Some items have different values on the following fields: " + fieldsInError.join(", "));
                }
                return Sys.Helpers.Promise.Resolve();
            }
            /**
             * Fill the process with PO infos.
             * @param {object} options
             * @returns {promise}
             */
            function FillForm(options) {
                Log.Time("Lib.Purchasing.EditPORequest.FillForm");
                var fillOptions = {
                    fillItem: options.fillItem || CompleteFormItem
                };
                var queryOptions = {
                    orderByClause: options.orderByClause
                };
                options.fillItem = options.fillItem || CompleteFormItem;
                return Lib.Purchasing.POItems.QueryPOItems(queryOptions)
                    .Then(function (dbItems) { return FillEditPORequest(dbItems, fillOptions); })
                    .Then(CheckError)
                    .Finally(function () { return Log.TimeEnd("Lib.Purchasing.EditPORequest.FillForm"); });
            }
            EditPORequest.FillForm = FillForm;
        })(EditPORequest = Purchasing.EditPORequest || (Purchasing.EditPORequest = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
