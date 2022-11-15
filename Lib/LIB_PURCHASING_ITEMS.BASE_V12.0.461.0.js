///#GLOBALS Lib Sys
// PURE COMMON > CLIENT, SERVER, MOBILE_CLIENT
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_Items.Base_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Base library for Lib_Purchasing_Items.",
  "require": [
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Data"
  ]
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var Items;
        (function (Items) {
            function AddLeadTime(leadTime) {
                var date = null;
                if (!Sys.Helpers.IsEmpty(leadTime)) {
                    date = new Date();
                    date.setHours(0, 0, 0, 0);
                    date.setDate(date.getDate() + parseInt(leadTime, 10));
                }
                return date;
            }
            Items.AddLeadTime = AddLeadTime;
            /**
             * Fill the LineItemNumber field of line items (by steps of 10)
             */
            function NumberLineItems() {
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
                    var lineItemNumber = parseInt(item.GetValue("LineItemNumber__"), 10);
                    var currentLineNumber = (i + 1) * 10;
                    if (lineItemNumber !== currentLineNumber) {
                        item.SetValue("LineItemNumber__", currentLineNumber);
                    }
                });
            }
            Items.NumberLineItems = NumberLineItems;
        })(Items = Purchasing.Items || (Purchasing.Items = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
