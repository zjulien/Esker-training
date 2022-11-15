///#GLOBALS Lib Sys
/// <reference path="../../../P2P/Tables/table - PurchasingCompanycodes/typings/Controls_table___PurchasingCompanycodes/index.d.ts"/>
/* LIB_DEFINITION{
  "name": "Lib_P2P_Address_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "P2P Adress library",
  "require": [
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Address;
        (function (Address) {
            var g = Sys.Helpers.Globals;
            var FormattedAddressControl = null;
            function SetFormattedAddressControl(c) {
                FormattedAddressControl = c;
            }
            Address.SetFormattedAddressControl = SetFormattedAddressControl;
            function ComputeFormattedAddress(param) {
                ComputeFormattedAddressWithOptions(null);
            }
            Address.ComputeFormattedAddress = ComputeFormattedAddress;
            function ComputeFormattedAddressWithOptions(options) {
                options = options || {
                    "isVariablesAddress": true,
                    "address": {
                        "ToName": "ToRemove",
                        "ToSub": g.Controls.Sub__.GetValue(),
                        "ToMail": g.Controls.Street__.GetValue(),
                        "ToPostal": g.Controls.PostalCode__.GetValue(),
                        "ToCountry": g.Controls.Country__.GetValue(),
                        "ToCountryCode": g.Controls.Country__.GetValue(),
                        "ToState": g.Controls.Region__.GetValue(),
                        "ToCity": g.Controls.City__.GetValue(),
                        "ToPOBox": g.Controls.PostOfficeBox__.GetValue(),
                        "ForceCountry": true
                    },
                    "countryCode": g.Controls.Country__.GetValue()
                };
                var addressParts = [
                    options.address.ToMail,
                    options.address.ToPostal,
                    options.address.ToCountry,
                    options.address.ToCountryCode,
                    options.address.ToState,
                    options.address.ToCity,
                    options.address.ToPOBox
                ];
                if (Sys.Helpers.Array.Every(addressParts, function (x) { return Sys.Helpers.IsEmpty(x); })) {
                    // Don't try to format address if not filled
                    FormattedAddressControl.SetWarning("");
                    FormattedAddressControl.SetValue("");
                    return Sys.Helpers.Promise.Resolve();
                }
                return Sys.GenericAPI.PromisedCheckPostalAddress(options)
                    .Then(function (address) {
                    Sys.Helpers.SilentChange(function () {
                        // Display error message OR address without first line
                        if (address.LastErrorMessage) {
                            var decodedLastErrorMessage = decodeHtmlEntities(address.LastErrorMessage);
                            FormattedAddressControl.SetValue(decodedLastErrorMessage);
                            FormattedAddressControl.SetWarning(decodedLastErrorMessage);
                        }
                        else {
                            var formattedAddress = !options.keepCompanyInBlock
                                ? address.FormattedBlockAddress.replace(/^[^\r\n]+(\r|\n)+/, "")
                                : address.FormattedBlockAddress;
                            FormattedAddressControl.SetValue(formattedAddress);
                            FormattedAddressControl.SetWarning("");
                        }
                    });
                });
            }
            Address.ComputeFormattedAddressWithOptions = ComputeFormattedAddressWithOptions;
            function decodeHtmlEntities(encodedString) {
                var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
                var translate = {
                    "nbsp": " ",
                    "amp": "&",
                    "quot": "\"",
                    "lt": "<",
                    "gt": ">"
                };
                return encodedString.replace(translate_re, function (match, entity) {
                    return translate[entity];
                }).replace(/&#(\d+);/gi, function (match, numStr) {
                    var num = parseInt(numStr, 10);
                    return String.fromCharCode(num);
                });
            }
        })(Address = P2P.Address || (P2P.Address = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
