/* LIB_DEFINITION{
  "name": "LIB_SHIPPING_CXML_MAPPING_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "versionable": true,
  "require": [
    "SYS/SYS_HELPERS_DATE",
    "Lib_Shipping_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var CXML;
        (function (CXML) {
            //#endregion
            //#region Custom Trasnforms
            function ISO8601StringToDate(dateString) {
                return dateString ?
                    Sys.Helpers.Date.ISO8601StringToDate(dateString) :
                    null;
            }
            function verifyCarrierExist(companyName) {
                var companyNameLower = companyName.toLowerCase();
                Data.SetValue("Carrier__", companyName);
                var carrierNames = Lib.Shipping.GetCarrierNames();
                var isFound = false;
                for (var i = 0; i < carrierNames.length; i++) {
                    if (carrierNames[i].toLowerCase() === companyNameLower) {
                        isFound = true;
                        break;
                    }
                }
                if (isFound) {
                    return companyName;
                }
                return "Other";
            }
            //#endregion
            //#region Custom Aggregate
            function TakeFirstValue(value) {
                return value;
            }
            //#endregion
            //#region Header Value
            var ASNNumber = { XPath: "/cXML/Request/ShipNoticeRequest/ShipNoticeHeader/@shipmentID", Field: "ASNNumber__" };
            var ShippingDate = { XPath: "/cXML/Request/ShipNoticeRequest/ShipNoticeHeader/@shipmentDate", Field: "ShippingDate__", Transform: ISO8601StringToDate };
            var expectedDeliveryDate = { XPath: "/cXML/Request/ShipNoticeRequest/ShipNoticeHeader/@deliveryDate", Field: "ExpectedDeliveryDate__", Transform: ISO8601StringToDate };
            var CarrierName = { XPath: "//CarrierIdentifier[@domain=\"companyName\"]", Field: "CarrierCombo__", Transform: verifyCarrierExist, AggregateFunction: TakeFirstValue };
            var TrackingNumber = { XPath: "//ShipControl/ShipmentIdentifier", Field: "TrackingNumber__", Transform: null, AggregateFunction: TakeFirstValue };
            var ShippingNote = { XPath: "//ShipNoticeRequest/ShipNoticeHeader/Comments", Field: "ShippingNote__" };
            //#endregion
            //#region Header Addresses
            var ContactShipTo = { XPath: "//ShipNoticePortion/Contact[@role=\"shipTo\"][1]", Field: "ShipToAddress__" };
            //#endregion
            //#region LineItem table
            var columnOrderNumber = { XPath: "../OrderReference/@orderID", Field: "ItemPONumber__" };
            var itemDescription = { XPath: "./ShipNoticeItemDetail/Description", Field: "ItemDescription__" };
            var itemQuantity = { XPath: "./@quantity", Field: "ItemQuantity__" };
            var itemUOM = { XPath: "./ShipNoticeItemDetail/UnitOfMeasure", Field: "ItemUOM__" };
            var lineItemNumber = { XPath: "./@lineNumber", Field: "ItemPOLineNumber__" };
            var lineItem = {
                XPath: "//ShipNoticeItem", Field: "LineItems__",
                XPathCells: [columnOrderNumber, itemDescription, itemQuantity, itemUOM, lineItemNumber]
            };
            //#endregion
            //#region export mapping
            CXML.mapping = {
                headersField: [ASNNumber, ShippingDate, expectedDeliveryDate, CarrierName, TrackingNumber, ShippingNote],
                tables: [lineItem],
                headerAdresses: [ContactShipTo]
            };
            //#endregion
        })(CXML = Shipping.CXML || (Shipping.CXML = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
