///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_Shipping_InboundEmailProcessing_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "SERVER",
  "comment": "Shipping library used to process the inbound email used to submit ASN",
  "require": [
    "Sys/Sys_Helpers_Promise",
    "Lib_Shipping_V12.0.461.0",
    "Lib_Shipping_Validation_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var InboundEmailProcessing;
        (function (InboundEmailProcessing) {
            /// EXPORTS
            function IsCreatedFromInboundEmail() {
                return Data.GetValue("SourceRUID").toUpperCase().indexOf("ISM.") === 0;
            }
            InboundEmailProcessing.IsCreatedFromInboundEmail = IsCreatedFromInboundEmail;
            function DoExtraction() {
                Log.Info("[InboundEmailProcessing.DoExtraction] this document has been created from an inbound email");
                // Lib_Shipping_FirstTimeRecognition could be used to extract data from the attachment (as fallback of the autolearning)
            }
            InboundEmailProcessing.DoExtraction = DoExtraction;
        })(InboundEmailProcessing = Shipping.InboundEmailProcessing || (Shipping.InboundEmailProcessing = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
