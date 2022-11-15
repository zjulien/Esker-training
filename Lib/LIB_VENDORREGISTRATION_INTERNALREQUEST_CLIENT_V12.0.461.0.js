///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "Lib_VendorRegistration_InternalRequest_Client_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "VendorRegistration library",
  "require": [
    "Sys/Sys_Helpers_LdapUtil",
    "Lib_VendorRegistration_InternalRequest_V12.0.461.0"
  ]
}*/
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var InternalRequest;
        (function (InternalRequest) {
            function CreateInternalUpdateRequest(creatorOwnerId, creatorOwnerEmail, companyCode, vendorNumber) {
                var extVars = {
                    internalRequest: InternalRequest.InternalRequestType.Update,
                    creatorOwnerId: creatorOwnerId,
                    creatorOwnerEmail: creatorOwnerEmail,
                    companyCode: companyCode,
                    vendorNumber: vendorNumber
                };
                return CheckUpdateRequestAlreadyExists(companyCode, vendorNumber)
                    .Then(function () {
                    return CreateInternalRequest(extVars);
                });
            }
            InternalRequest.CreateInternalUpdateRequest = CreateInternalUpdateRequest;
            function CreateInternalNewRequest(creatorOwnerId, creatorOwnerEmail) {
                var extVars = {
                    internalRequest: InternalRequest.InternalRequestType.New,
                    creatorOwnerId: creatorOwnerId,
                    creatorOwnerEmail: creatorOwnerEmail
                };
                return CreateInternalRequest(extVars);
            }
            InternalRequest.CreateInternalNewRequest = CreateInternalNewRequest;
            function CheckUpdateRequestAlreadyExists(companyCode, vendorNumber) {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    companyCode = companyCode || "";
                    Query.DBQuery(function () {
                        if (this.GetRecordsCount() == 0) {
                            resolve();
                        }
                        else {
                            reject(new Error("Vendor Registration request already exists"));
                        }
                    }, "CDNAME#Vendor Registration", "State|Deleted|VendorNumber__|CompanyCode__", "(&(State<100)(Deleted=0)(VendorNumber__=" + vendorNumber + ")(CompanyCode__=" + companyCode + "))");
                });
            }
            function CreateInternalRequest(externalVars) {
                return Sys.Helpers.Promise.Create(function (resolve, reject) {
                    Process.CreateProcessInstance("Vendor Registration", {
                        ProcessStatus__: "ToValidate"
                    }, externalVars, {
                        callback: function (data) {
                            if (data.error) {
                                reject(new Error(data.errorMessage));
                            }
                            else {
                                var filter_1 = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("State", "70"), Sys.Helpers.LdapUtil.FilterEqual("RuidEx", data.ruid)).toString();
                                var retrieveVendorRegistration_1 = function (maxTries) {
                                    setTimeout(function () {
                                        Log.Info("Trying to retrieve VendorRegistration process... (" + maxTries + ")");
                                        Query.DBQuery(function () {
                                            var err = this.GetQueryError();
                                            if (err) {
                                                Log.Warn("Waiting form to be ready");
                                            }
                                            else if (this.GetRecordsCount() > 0) {
                                                // Process found
                                                Process.OpenMessage(data.ruid, false);
                                                resolve();
                                            }
                                            else if (maxTries > 0) {
                                                // Process not created yet
                                                retrieveVendorRegistration_1(maxTries - 1);
                                            }
                                            else {
                                                // Max tries reached
                                                reject(new Error("reached max tries count"));
                                            }
                                        }, "CDNAME#Vendor Registration", "RuidEx", filter_1, "SubmitDateTime DESC");
                                    }, 1000);
                                };
                                retrieveVendorRegistration_1(60);
                            }
                        }
                    });
                });
            }
        })(InternalRequest = VendorRegistration.InternalRequest || (VendorRegistration.InternalRequest = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
