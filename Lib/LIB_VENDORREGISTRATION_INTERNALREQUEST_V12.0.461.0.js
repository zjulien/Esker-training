///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_VendorRegistration_InternalRequest_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "VendorRegistration library",
  "require": []
}*/
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var InternalRequest;
        (function (InternalRequest) {
            var InternalRequestType;
            (function (InternalRequestType) {
                InternalRequestType["New"] = "New";
                InternalRequestType["Update"] = "Update";
            })(InternalRequestType = InternalRequest.InternalRequestType || (InternalRequest.InternalRequestType = {}));
            function IsInternalRequest() {
                var internalRequestType = Variable.GetValueAsString("internalRequest");
                return internalRequestType === InternalRequestType.New || internalRequestType === InternalRequestType.Update;
            }
            InternalRequest.IsInternalRequest = IsInternalRequest;
            function IsInternalNewRequest() {
                var internalRequestType = Variable.GetValueAsString("internalRequest");
                return internalRequestType === InternalRequestType.New;
            }
            InternalRequest.IsInternalNewRequest = IsInternalNewRequest;
            function IsInternalUpdateRequest() {
                var internalRequestType = Variable.GetValueAsString("internalRequest");
                return internalRequestType === InternalRequestType.Update;
            }
            InternalRequest.IsInternalUpdateRequest = IsInternalUpdateRequest;
        })(InternalRequest = VendorRegistration.InternalRequest || (VendorRegistration.InternalRequest = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
