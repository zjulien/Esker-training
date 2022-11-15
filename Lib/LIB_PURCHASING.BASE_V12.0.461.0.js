/* eslint-disable dot-notation */
///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_Purchasing.Base_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_Purchasing",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Data",
    "Sys/Sys_Parameters",
    "Sys/Sys_TechnicalData",
    "LIB_P2P.Base_V12.0.461.0"
  ]
}*/
/**
* helpers for purchasing package
* @namespace Lib.Purchasing
*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        function IsMultiShipTo() {
            var enabledByParams = Sys.Parameters.GetInstance("PAC").GetParameter("MultiShipTo", false);
            var forcedMode = Sys.TechnicalData.GetValue("ShipToModeForcedByFormTemplate");
            var isReplenishment = Data.GetValue("IsReplenishment__"); // Lib.P2P.Inventory.IsReplenishmentRequest()
            return !isReplenishment && ((Sys.Helpers.IsEmpty(forcedMode) && enabledByParams) || forcedMode === "multi");
        }
        Purchasing.IsMultiShipTo = IsMultiShipTo;
        /**
        * Object use to manage parameter UndefinedBudgetBehavior
        */
        Purchasing.UndefinedBudgetBehavior = {
            // Enumeration for retro-compatibility
            Old: {
                Allow: "0",
                Warn: "1",
                Prevent: "2"
            },
            /**
             * Returns the current value of the parameter UndefinedBudgetBehavior (either in Lib_Parameters_P2P for new documents or on record).
             * @return {string} value of UndefinedBudgetBehavior (in lower case)
             */
            Get: function () {
                return (Sys.Parameters.GetInstance("PAC").GetParameter("UndefinedBudgetBehavior") || Behaviour.Prevent).toLowerCase();
            },
            /**
             * Determines if the specified value of UndefinedBudgetBehavior is the current one.
             * Support both new and old enumerations
             * @param {string} expected value of UndefinedBudgetBehavior (case sensitive)
             * @return {boolean}
             */
            Is: function (expectedBehavior) {
                var behavior = this.Get();
                return behavior === expectedBehavior.toLowerCase() || behavior === this.Old[expectedBehavior];
            },
            IsAllowed: function () {
                return this.Is("Allow");
            },
            IsWarned: function () {
                return this.Is("Warn");
            },
            IsPrevented: function () {
                return this.Is("Prevent");
            }
        };
        /**
         * Object use to manage parameter OutOfBudgetBehavior
         */
        Purchasing.OutOfBudgetBehavior = {
            /**
             * Returns the current value of the parameter OutOfBudgetBehavior (either in Lib_Parameters_P2P for new documents or on record).
             * @return {string} value of OutOfBudgetBehavior (in lower case)
             */
            Get: function () {
                return (Sys.Parameters.GetInstance("PAC").GetParameter("OutOfBudgetBehavior") || Behaviour.Warn).toLowerCase();
            },
            /**
             * Determines if the specified value of OutOfBudgetBehavior is the current one.
             * Support both new and old enumerations
             * @param {string} expected value of OutOfBudgetBehavior (case sensitive)
             * @return {boolean}
             */
            Is: function (expectedBehavior) {
                var behavior = this.Get();
                return behavior === expectedBehavior.toLowerCase();
            },
            IsAllowed: function () {
                return this.Is("Allow");
            },
            IsWarned: function () {
                return this.Is("Warn");
            },
            IsPrevented: function () {
                return this.Is("Prevent");
            }
        };
        /**
         * Object use to manage parameter OutOfBudgetBehavior
         */
        Purchasing.InvoicedProcessCancellationBehavior = {
            /**
             * Returns the current value of the parameter InvoicedProcessCancellationBehavior (either in Lib_Parameters_P2P for new documents or on record).
             * @return {string} value of InvoicedProcessCancellationBehavior (in lower case)
             */
            Get: function () {
                return (Sys.Parameters.GetInstance("PAC").GetParameter("InvoicedProcessCancellationBehavior") || Behaviour.Warn).toLowerCase();
            },
            /**
             * Determines if the specified value of InvoicedProcessCancellationBehavior is the current one.
             * Support both new and old enumerations
             * @param {string} expected value of InvoicedProcessCancellationBehavior (case sensitive)
             * @return {boolean}
             */
            Is: function (expectedBehavior) {
                var behavior = this.Get();
                return behavior === expectedBehavior.toLowerCase();
            },
            IsAllowed: function () {
                return this.Is("Allow");
            },
            IsWarned: function () {
                return this.Is("Warn");
            },
            IsPrevented: function () {
                return this.Is("Prevent");
            }
        };
        var Behaviour;
        (function (Behaviour) {
            // Current enumeration
            Behaviour["Allow"] = "allow";
            Behaviour["Warn"] = "warn";
            Behaviour["Prevent"] = "prevent";
        })(Behaviour || (Behaviour = {}));
        function IsLineItemEmpty(item) {
            return Sys.Helpers.IsEmpty(item.GetValue("ItemNumber__")) &&
                Sys.Helpers.IsEmpty(item.GetValue("ItemDescription__")) &&
                Sys.Helpers.IsEmpty(item.GetValue("ItemCostCenterId__")) &&
                Sys.Helpers.IsEmpty(item.GetValue("SupplyTypeID__")) &&
                Sys.Helpers.IsEmpty(item.GetValue("ItemShipToAddress__")) &&
                Sys.Helpers.IsEmpty(item.GetValue("VendorNumber__")) &&
                Sys.Helpers.IsEmpty(item.GetValue("CostType__")) &&
                Sys.Helpers.IsEmpty(item.GetValue("ItemRequestedDeliveryDate__")) &&
                item.GetValue("ItemNetAmount__") <= 0 &&
                Sys.Helpers.IsEmpty(item.GetValue("ItemGLAccount__")) &&
                (item.GetValue("ItemType__") !== Lib.P2P.ItemType.SERVICE_BASED ||
                    (Sys.Helpers.IsEmpty(item.GetValue("ItemStartDate__")) &&
                        Sys.Helpers.IsEmpty(item.GetValue("ItemEndDate__"))));
        }
        Purchasing.IsLineItemEmpty = IsLineItemEmpty;
        function IsLineItemsEmpty() {
            var table = Data.GetTable("LineItems__");
            var count = table.GetItemCount();
            return count == 0 || (count == 1 && Lib.Purchasing.IsLineItemEmpty(table.GetItem(0)));
        }
        Purchasing.IsLineItemsEmpty = IsLineItemsEmpty;
        function IsPunchoutRow(row) {
            return !Sys.Helpers.IsEmpty(row.ItemInCxml__.GetValue());
        }
        Purchasing.IsPunchoutRow = IsPunchoutRow;
        function IsPunchoutItem(item) {
            return item ? !Sys.Helpers.IsEmpty(item.GetValue("ItemInCxml__")) : false;
        }
        Purchasing.IsPunchoutItem = IsPunchoutItem;
        function HasOnlyPunchoutItems() {
            if (Data.GetTable("LineItems__").GetItemCount() === 0) {
                return false;
            }
            return !Sys.Helpers.Data.FindTableItem("LineItems__", function (item) {
                return !Lib.Purchasing.IsPunchoutItem(item) && !Lib.Purchasing.IsLineItemEmpty(item);
            });
        }
        Purchasing.HasOnlyPunchoutItems = HasOnlyPunchoutItems;
        function HasPunchoutItems() {
            return !!Sys.Helpers.Data.FindTableItem("LineItems__", function (item) {
                return Lib.Purchasing.IsPunchoutItem(item);
            });
        }
        Purchasing.HasPunchoutItems = HasPunchoutItems;
        function AllItemsHaveSameDeliveryAddress() {
            return FirstLineWithDifferentDeliveryAddress() === -1;
        }
        Purchasing.AllItemsHaveSameDeliveryAddress = AllItemsHaveSameDeliveryAddress;
        function FirstLineWithDifferentDeliveryAddress() {
            var table = Data.GetTable("LineItems__");
            var count = table.GetItemCount();
            if (count === 0 || count === 1) {
                return -1;
            }
            var deliveryAddressID = table.GetItem(0).GetValue("ItemDeliveryAddressID__");
            for (var i = 1; i < count; i++) {
                var line = table.GetItem(i);
                if (line.GetValue("ItemDeliveryAddressID__") !== deliveryAddressID) {
                    return i;
                }
            }
            return -1;
        }
        Purchasing.FirstLineWithDifferentDeliveryAddress = FirstLineWithDifferentDeliveryAddress;
        function RemoveEmptyLineItem(table) {
            for (var i = 0; i < table.GetItemCount(); i++) {
                var row = table.GetItem(i);
                if (Lib.Purchasing.IsLineItemEmpty(row)) {
                    if (typeof row.Remove === "undefined") {
                        row.RemoveItem();
                    }
                    else {
                        row.Remove();
                    }
                }
            }
        }
        Purchasing.RemoveEmptyLineItem = RemoveEmptyLineItem;
        function GetLanguageFromCompanyCode(companyCode) {
            if (companyCode && companyCode.startsWith("FR")) {
                return "fr";
            }
            return "en";
        }
        Purchasing.GetLanguageFromCompanyCode = GetLanguageFromCompanyCode;
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
