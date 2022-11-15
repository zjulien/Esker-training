///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_AP_CONTRACT_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "AP library",
  "require": [
    "Sys/Sys_Helpers_Data",
    "Lib_AP_WorkflowCtrl_V12.0.461.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        /**
         * @namespace Contract
         * @memberof Lib.AP
         */
        var Contract;
        (function (Contract) {
            var contractNumbersCache = {};
            function HandleContractValidity() {
                var cacheKey = getContractNumberCacheKey();
                if (Object.prototype.hasOwnProperty.call(contractNumbersCache, cacheKey)) {
                    Data.SetWarning("ContractNumber__", contractNumbersCache[cacheKey]);
                }
                else {
                    var filter = getContractFilter();
                    if (filter) {
                        Sys.GenericAPI.Query("CDNAME#P2P - Contract", filter, ["ContractStatus__", "StartDate__", "EndDate__"], handleContractValidityCallBack, "ReferenceNumber__ ASC", 1);
                    }
                    else {
                        Data.SetWarning("ContractNumber__", null);
                    }
                }
            }
            Contract.HandleContractValidity = HandleContractValidity;
            function handleContractValidityCallBack(results, error) {
                var warningLabel = null;
                if (!error && results && results.length > 0) {
                    var contract = results[0];
                    var dataInvoiceDate = Data.GetValue("InvoiceDate__");
                    if (dataInvoiceDate) {
                        var invoiceDate = new Date(dataInvoiceDate);
                        var isTooEarly = invoiceDate < new Date(contract.StartDate__);
                        var isTooLate = invoiceDate > new Date(contract.EndDate__);
                        if (contract.ContractStatus__ !== "Active" &&
                            contract.ContractStatus__ !== "Expired" &&
                            contract.ContractStatus__ !== "Revoked" &&
                            !isTooEarly && !isTooLate) {
                            warningLabel = "_InactiveContract";
                        }
                        else if (isTooLate) {
                            warningLabel = "_ExpiredContract";
                        }
                        else if (isTooEarly) {
                            warningLabel = "_UnstartedContract";
                        }
                    }
                }
                else if (Lib.AP.WorkflowCtrl.CurrentStepIsApStart()) {
                    warningLabel = "_InvalidContractNumber";
                }
                Data.SetWarning("ContractNumber__", warningLabel);
                contractNumbersCache[getContractNumberCacheKey()] = warningLabel;
            }
            function getContractFilter() {
                var companyCode = Data.GetValue("CompanyCode__");
                var vendorNumber = Data.GetValue("VendorNumber__");
                var contractNumber = Data.GetValue("ContractNumber__");
                var filter = "";
                if (companyCode && vendorNumber && contractNumber) {
                    filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqual("ReferenceNumber__", contractNumber)).toString();
                }
                return filter;
            }
            function getContractNumberCacheKey() {
                var companyCode = Data.GetValue("CompanyCode__");
                var vendorNumber = Data.GetValue("VendorNumber__");
                var contractNumber = Data.GetValue("ContractNumber__");
                var invoiceDate = Data.GetValue("InvoiceDate__");
                return "".concat(contractNumber, "_").concat(companyCode, "_").concat(vendorNumber, "_").concat(invoiceDate);
            }
        })(Contract = AP.Contract || (AP.Contract = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
