/* LIB_DEFINITION{
  "name": "LIB_SHIPPING_CXML_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "versionable": true,
  "require": [
    "LIB_SHIPPING_CXML_MAPPING_V12.0.461.0",
    "Sys/Sys_Helpers_XMLExtraction",
    "Sys/Sys_GenericAPI_Server"
  ]
}*/
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var CXML;
        (function (CXML) {
            function ExtractInformation(indexOfcXMLFile) {
                var xmlFile = Attach.GetConvertedFile(indexOfcXMLFile);
                Sys.Helpers.XMLExtraction.SetXMLFileToProcess(xmlFile);
                var mapping = Lib.Shipping.CXML.mapping;
                mapping.headersField.forEach(function (headerField) {
                    Sys.Helpers.XMLExtraction.Extract(headerField.XPath, headerField.Field, headerField.Transform, headerField.AggregateFunction);
                });
                mapping.tables.forEach(function (table) {
                    Sys.Helpers.XMLExtraction.ExtractTable(table.XPath, table.Field, function (extractCell) {
                        table.XPathCells.forEach(function (cell) {
                            extractCell(cell.XPath, cell.Field, cell.Transform, cell.AggregateFunction);
                        });
                    });
                });
                mapping.headerAdresses.forEach(function (address) {
                    ExtractAddress(address);
                });
            }
            CXML.ExtractInformation = ExtractInformation;
            //#region Address
            //<!ELEMENT PostalAddress (DeliverTo*, Street+, City, State?, PostalCode?, Country)>
            //In case of Address or Contact, Name is a sibling of PostalAddress
            function AggregateAsConcatTextAndLF(value, nextValue) {
                return value + "\n" + nextValue;
            }
            function ExtractAddress(addressXPathMapping) {
                var addressToConvert = ExtractAddressFromcXML(addressXPathMapping.XPath);
                var options = {
                    isVariablesAddress: true,
                    address: addressToConvert,
                    countryCode: addressToConvert.ToCountryCode
                };
                var address = Sys.GenericAPI.CheckPostalAddress(options);
                if (address.LastErrorMessage) {
                    Log.Warn("Invalid postal address: ".concat(address.LastErrorMessage, ", error obtain after try to convert ").concat(JSON.stringify(addressToConvert)));
                    Data.SetValue(addressXPathMapping.Field, "".concat(addressToConvert.ToName, "\n\t").concat(addressToConvert.ToMail, "\n\t").concat(addressToConvert.ToCity, "\n\t").concat(addressToConvert.ToPostal, "\n\t").concat(addressToConvert.ToCountry));
                }
                else {
                    Data.SetValue(addressXPathMapping.Field, address.FormattedBlockAddress.replace(/^[^\r\n]+(\r|\n)+/, ""));
                }
            }
            function ExtractAddressFromcXML(nodePath) {
                var name = Sys.Helpers.XMLExtraction.Extract(nodePath + "/Name") || "";
                var deliverTo = Sys.Helpers.XMLExtraction.Extract(nodePath + "/PostalAddress/DeliverTo", null, null, AggregateAsConcatTextAndLF) || "";
                var street = Sys.Helpers.XMLExtraction.Extract(nodePath + "/PostalAddress/Street", null, null, AggregateAsConcatTextAndLF) || "";
                var postalCode = Sys.Helpers.XMLExtraction.Extract(nodePath + "/PostalAddress/PostalCode") || "";
                var city = Sys.Helpers.XMLExtraction.Extract(nodePath + "/PostalAddress/City") || "";
                var state = Sys.Helpers.XMLExtraction.Extract(nodePath + "/PostalAddress/State") || "";
                var country = Sys.Helpers.XMLExtraction.Extract(nodePath + "/PostalAddress/Country") || "";
                var isoCountryCode = Sys.Helpers.XMLExtraction.Extract(nodePath + "/PostalAddress/Country/@isoCountryCode") || "";
                var address = {
                    ToName: name + "\n" + deliverTo,
                    ToMail: street,
                    ToPostal: postalCode,
                    ToCity: city,
                    ToState: state,
                    ToCountry: country,
                    ToCountryCode: isoCountryCode,
                    ForceCountry: true
                };
                return address;
            }
            //#endregion
        })(CXML = Shipping.CXML || (Shipping.CXML = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
