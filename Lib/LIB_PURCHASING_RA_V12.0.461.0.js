///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_RA_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "Remittance Advice library",
  "require": []
}*/
var Lib;
(function (Lib) {
    var Purchasing;
    (function (Purchasing) {
        var RA;
        (function (RA) {
            function ComputeInvoicesTable() {
                var table = Data.GetTable("Table__");
                var ExtractedDataString = Variable.GetValueAsString("ExtractedData");
                var ExtractedData = JSON.parse(ExtractedDataString).ExtractedData;
                var InvoicesCount = ExtractedData.Invoices.length;
                for (var i = 0; i < InvoicesCount; i++) {
                    var element = ExtractedData.Invoices[i];
                    table.AddItem();
                    var item = table.GetItem(table.GetItemCount() - 1);
                    item.SetValue("DocumentNumber__", element.DocumentNumber);
                    item.SetValue("InvoiceNumber__", element.InvoiceNumber);
                    item.SetValue("InvoiceDate__", element.InvoiceDate);
                    item.SetValue("NetAmount__", element.NetAmount);
                }
                if (!table.GetItem(0)) {
                    table.GetItem(0).RemoveItem(); // Remove the first empty line
                }
            }
            RA.ComputeInvoicesTable = ComputeInvoicesTable;
        })(RA = Purchasing.RA || (Purchasing.RA = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
