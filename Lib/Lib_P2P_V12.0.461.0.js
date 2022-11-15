///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_P2P_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "COMMON",
  "comment": "P2P library",
  "require": [
    "Lib_V12.0.461.0",
    "Lib_ERP_V12.0.461.0",
    "Lib_CommonDialog_V12.0.461.0",
    "LIB_P2P.Base_V12.0.461.0",
    "LIB_P2P.Workflow_V12.0.461.0",
    "Lib_P2P_CompanyCodesValue_V12.0.461.0",
    "Sys/Sys_WorkflowController",
    "Sys/Sys_OnDemand_Users",
    "Sys/Sys_Parameters",
    "Sys/Sys_AppVersion",
    "[Sys/Sys_GenericAPI_Server]",
    "[Sys/Sys_GenericAPI_Client]"
  ]
}*/
/**
 * Common P2P functions
 * @namespace Lib.P2P
 */
var Lib;
(function (Lib) {
    Sys.AppVersion.SerializeAppSprintVersion("P2P");
    var P2P;
    (function (P2P) {
        P2P.AddLib = Lib.AddLib;
        P2P.ExtendLib = Lib.ExtendLib;
        var g = Sys.Helpers.Globals;
        /**
         * @exports P2P
         * @memberof Lib.P2P
         */
        function InitItemTypeControl(ctrl) {
            if (Sys.ScriptInfo.IsClient() && Sys.Parameters.GetInstance("P2P").GetParameter("EnableServiceBasedItem") === "1") {
                if (!ctrl) {
                    ctrl = g.Controls.LineItems__.ItemType__;
                }
                var options = ctrl.GetAvailableValues();
                options.push(P2P.ItemType.SERVICE_BASED + "=_ServiceBased");
                ctrl.SetAvailableValues(options);
            }
        }
        P2P.InitItemTypeControl = InitItemTypeControl;
        /**
         * Invoice Line Item Helper
         */
        P2P.InvoiceLineItem = {
            /**
             * Check if the line is a PO line item
             * @param {Data} item The data of the line to test
             * @return boolean True if the LineType of the line is equal to PO
             */
            IsPOLineItem: function (item) {
                return item && item.GetValue("LineType__") === P2P.LineType.PO;
            },
            /**
             * Check if the line is a GL line item
             * @param {Data} item The data of the line to test
             * @return boolean True if the LineType of the line is equal to GL
             */
            IsGLLineItem: function (item) {
                return item && item.GetValue("LineType__") === P2P.LineType.GL;
            },
            /**
             * Check if the line is a POGL line item
             * @param {Data} item The data of the line to test
             * @return boolean True if the LineType of the line is equal to POGL
             */
            IsPOGLLineItem: function (item) {
                return item && item.GetValue("LineType__") === P2P.LineType.POGL;
            },
            /**
             * Check if the line is a UDC line item
             * @param {Data} item The data of the line to test
             * @return boolean True if the LineType of the line is equal to GL and associated keyword is defined
             */
            IsUDCLineItem: function (item) {
                return item && this.IsGLLineItem(item) && item.GetValue("Keyword__");
            },
            /**
             * Check if the line is a PO or POGL line item
             * @param {Data} item The data of the line to test
             * @return boolean True if the LineType of the line is equal to Consignment
             */
            IsPOLikeLineItem: function (item) {
                return item && (item.GetValue("LineType__") === P2P.LineType.PO || item.GetValue("LineType__") === P2P.LineType.POGL);
            },
            /**
             * Check if the line is a Consignment line item
             * @param {Data} item The data of the line to test
             * @return boolean True if the LineType of the line is equal to Consignment
             */
            IsConsignmentLineItem: function (item) {
                return item && item.GetValue("LineType__") === P2P.LineType.CONSIGNMENT;
            },
            /**
             * Check if the line is a GL, POGL or Consignment line item
             * @param {Data} item The data of the line to test
             * @return boolean True if the LineType of the line is equal to Consignment
             */
            IsGLLikeLineItem: function (item) {
                return item && (item.GetValue("LineType__") === P2P.LineType.GL || item.GetValue("LineType__") === P2P.LineType.POGL || item.GetValue("LineType__") === P2P.LineType.CONSIGNMENT);
            },
            /**
             * Checks if the item is amount based
             * @param {Data} item The line to test
             * @return boolean True if the ItemType of the line is equal to AmountBased
             */
            IsAmountBasedRow: function (row) {
                return row && row.ItemType__.GetValue() === P2P.ItemType.AMOUNT_BASED;
            },
            IsAmountBasedItem: function (item) {
                return item && item.GetValue("ItemType__") === P2P.ItemType.AMOUNT_BASED;
            },
            /**
             * Checks if the item is quantity based
             * @param item The line to test
             * @return boolean True if the ItemType of the line is equal to QuantityBased
             */
            IsQuantityBasedItem: function (item) {
                return item && item.ItemType__.GetValue() !== P2P.ItemType.AMOUNT_BASED;
            },
            /**
             * Determine if a line item is ready to post or not
             * @param item The data of the line to test
             * @return boolean True if the line is not correctly filled
             */
            IsPostable: function (item) {
                if (!P2P.InvoiceLineItem.IsGLLineItem(item) && item.GetValue("OrderNumber__")) {
                    // postable only if both are set
                    return item.GetValue("Amount__") !== null && (item.GetValue("Quantity__") !== null || Data.GetValue("SubsequentDocument__"));
                }
                return true;
            },
            /**
             * Determine if a line item can be removed
             * @param {Data} item The data of the line to test
             * @return boolean True if the line can be safely removed
             */
            IsRemovable: function (item) {
                if (!P2P.InvoiceLineItem.IsGLLineItem(item) && item.GetValue("OrderNumber__")) {
                    // removable only if both are empty
                    return item.GetValue("Amount__") === null && item.GetValue("Quantity__") === null;
                }
                return false;
            },
            /**
             * Commons check for all kind of line type
             * @param {Data} item The data of the line to test
             * @return boolean True if the line is empty
             */
            IsGenericLineEmpty: function (item) {
                return !item.GetValue("Description__") && !item.GetValue("Amount__") && !item.GetValue("TaxCode__");
            },
            /**
             * Check if a GL line item is empty
             * @param {Data} item The data of the line to test
             * @return boolean True if the line is empty
             */
            IsGLLineItemEmpty: function (item) {
                return P2P.InvoiceLineItem.IsGenericLineEmpty(item) && !item.GetValue("GLAccount__") && !item.GetValue("CostCenter__");
            },
            /**
             * Check if a PO line item is empty
             * @param {Data} item The data of the line to test
             * @return boolean True if the line is empty
             */
            IsPOLineItemEmpty: function (item) {
                return P2P.InvoiceLineItem.IsGenericLineEmpty(item) && !item.GetValue("OrderNumber__") && !item.GetValue("ItemNumber__") && !item.GetValue("Quantity__");
            },
            /**
             * Check if a PO line item is empty
             * @param {Data} item The data of the line to test
             * @return boolean True if the line is empty
             */
            IsConsignmentLineItemEmpty: function (item) {
                return P2P.InvoiceLineItem.IsGenericLineEmpty(item) && !item.GetValue("Quantity__");
            },
            /**
             * Check if the line is a GL line item
             * @param {Data} item The data of the line to test
             * @return boolean True if the LineType of the line is equal to GL
             */
            IsEmpty: function (item) {
                if (P2P.InvoiceLineItem.IsGLLineItem(item)) {
                    return P2P.InvoiceLineItem.IsGLLineItemEmpty(item);
                }
                else if (P2P.InvoiceLineItem.IsPOLineItem(item) || P2P.InvoiceLineItem.IsPOGLLineItem(item)) {
                    return P2P.InvoiceLineItem.IsPOLineItemEmpty(item);
                }
                // Non-PO Line item are managed like GL line item
                return P2P.InvoiceLineItem.IsGLLineItemEmpty(item);
            }
        };
        /*
         * COME FROM EskFSDK_String
         * Function: removeAccents
         * Purpose:  Remove accents, to lower case, keep char
         * Returns:  string
         * Inputs:   string
         */
        String.prototype.RemoveAccents = function () {
            // https://github.com/yui/yui3/blob/master/src/text/js/text-data-accentfold.js
            var AccentFold = {
                0: /[\u2070\u2080\u24EA\uFF10]/gi,
                1: /[\u00B9\u2081\u2460\uFF11]/gi,
                2: /[\u00B2\u2082\u2461\uFF12]/gi,
                3: /[\u00B3\u2083\u2462\uFF13]/gi,
                4: /[\u2074\u2084\u2463\uFF14]/gi,
                5: /[\u2075\u2085\u2464\uFF15]/gi,
                6: /[\u2076\u2086\u2465\uFF16]/gi,
                7: /[\u2077\u2087\u2466\uFF17]/gi,
                8: /[\u2078\u2088\u2467\uFF18]/gi,
                9: /[\u2079\u2089\u2468\uFF19]/gi,
                a: /[\u00AA\u00E0-\u00E5\u0101\u0103\u0105\u01CE\u01DF\u01E1\u01FB\u0201\u0203\u0227\u1D43\u1E01\u1E9A\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u24D0\uFF41]/gi,
                b: /[\u1D47\u1E03\u1E05\u1E07\u24D1\uFF42]/gi,
                c: /[\u00E7\u0107\u0109\u010B\u010D\u1D9C\u1E09\u24D2\uFF43]/gi,
                d: /[\u010F\u1D48\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u217E\u24D3\uFF44]/gi,
                e: /[\u00E8-\u00EB\u0113\u0115\u0117\u0119\u011B\u0205\u0207\u0229\u1D49\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u2091\u212F\u24D4\uFF45]/gi,
                f: /[\u1DA0\u1E1F\u24D5\uFF46]/gi,
                g: /[\u011D\u011F\u0121\u0123\u01E7\u01F5\u1D4D\u1E21\u210A\u24D6\uFF47]/gi,
                h: /[\u0125\u021F\u02B0\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E96\u210E\u24D7\uFF48]/gi,
                i: /[\u00EC-\u00EF\u0129\u012B\u012D\u012F\u0133\u01D0\u0209\u020B\u1D62\u1E2D\u1E2F\u1EC9\u1ECB\u2071\u2139\u2170\u24D8\uFF49]/gi,
                j: /[\u0135\u01F0\u02B2\u24D9\u2C7C\uFF4A]/gi,
                k: /[\u0137\u01E9\u1D4F\u1E31\u1E33\u1E35\u24DA\uFF4B]/gi,
                l: /[\u013A\u013C\u013E\u0140\u01C9\u02E1\u1E37\u1E39\u1E3B\u1E3D\u2113\u217C\u24DB\uFF4C]/gi,
                m: /[\u1D50\u1E3F\u1E41\u1E43\u217F\u24DC\uFF4D]/gi,
                n: /[\u00F1\u0144\u0146\u0148\u01F9\u1E45\u1E47\u1E49\u1E4B\u207F\u24DD\uFF4E]/gi,
                o: /[\u00BA\u00F2-\u00F6\u014D\u014F\u0151\u01A1\u01D2\u01EB\u01ED\u020D\u020F\u022B\u022D\u022F\u0231\u1D52\u1E4D\u1E4F\u1E51\u1E53\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u2092\u2134\u24DE\uFF4F]/gi,
                p: /[\u1D56\u1E55\u1E57\u24DF\uFF50]/gi,
                q: /[\u02A0\u24E0\uFF51]/gi,
                r: /[\u0155\u0157\u0159\u0211\u0213\u02B3\u1D63\u1E59\u1E5B\u1E5D\u1E5F\u24E1\uFF52]/gi,
                s: /[\u015B\u015D\u015F\u0161\u017F\u0219\u02E2\u1E61\u1E63\u1E65\u1E67\u1E69\u1E9B\u24E2\uFF53]/gi,
                t: /[\u0163\u0165\u021B\u1D57\u1E6B\u1E6D\u1E6F\u1E71\u1E97\u24E3\uFF54]/gi,
                u: /[\u00F9-\u00FC\u0169\u016B\u016D\u016F\u0171\u0173\u01B0\u01D4\u01D6\u01D8\u01DA\u01DC\u0215\u0217\u1D58\u1D64\u1E73\u1E75\u1E77\u1E79\u1E7B\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u24E4\uFF55]/gi,
                v: /[\u1D5B\u1D65\u1E7D\u1E7F\u2174\u24E5\uFF56]/gi,
                w: /[\u0175\u02B7\u1E81\u1E83\u1E85\u1E87\u1E89\u1E98\u24E6\uFF57]/gi,
                x: /[\u02E3\u1E8B\u1E8D\u2093\u2179\u24E7\uFF58]/gi,
                y: /[\u00FD\u00FF\u0177\u0233\u02B8\u1E8F\u1E99\u1EF3\u1EF5\u1EF7\u1EF9\u24E8\uFF59]/gi,
                z: /[\u017A\u017C\u017E\u1DBB\u1E91\u1E93\u1E95\u24E9\uFF5A]/gi
            };
            var text = this.toLowerCase();
            for (var letter in AccentFold) {
                if (Object.prototype.hasOwnProperty.call(AccentFold, letter)) {
                    var regex = AccentFold[letter];
                    text = text.replace(regex, letter);
                }
            }
            return text;
        };
        function QueryTransportVersioned(packageName, processName, filter, attributes, asAdmin) {
            var versionedProcessName = P2P.GetVersionedProcessName(packageName, processName);
            var query = asAdmin ? Process.CreateQueryAsProcessAdmin() : Query;
            query.Reset();
            query.SetSpecificTable("CDNAME#" + versionedProcessName);
            query.SetFilter(filter);
            query.SetAttributesList(attributes);
            var transport = query.MoveFirst() ? query.MoveNext() : null;
            if (!transport && versionedProcessName !== processName) {
                query.SetSpecificTable("CDNAME#" + processName);
                transport = query.MoveFirst() ? query.MoveNext() : null;
            }
            return transport;
        }
        function QueryPurchasingTransport(processName, filter, attributes, asAdmin) {
            return QueryTransportVersioned("PAC", processName, filter, attributes, asAdmin);
        }
        P2P.QueryPurchasingTransport = QueryPurchasingTransport;
        function QueryPOFormData(orderNumber) {
            var transport = QueryTransportVersioned("PAC", "Purchase order", "OrderNumber__=" + orderNumber, "DataFile", false);
            return transport && transport.GetFormData();
        }
        P2P.QueryPOFormData = QueryPOFormData;
        function InitValidityDateTime(paramInstance, paramName, defaultParamValue) {
            if (paramName === void 0) { paramName = "ValidityDurationInMonths"; }
            return Sys.Parameters.GetInstance(paramInstance).PromisedIsReady()
                .Then(function () {
                // Set form validity date (to prevent expiration errors)
                var numberOfMonthToAdd = parseInt(Sys.Parameters.GetInstance(paramInstance).GetParameter(paramName, defaultParamValue), 10);
                var submitDT = Data.GetValue("SubmitDateTime");
                if (submitDT) {
                    submitDT.setMonth(submitDT.getMonth() + numberOfMonthToAdd);
                    var validityDateTime = Data.GetValue("ValidityDateTime");
                    var validityDT = Sys.Helpers.IsString(validityDateTime) ? new Date(validityDateTime) : validityDateTime;
                    if (validityDT) {
                        submitDT = Sys.Helpers.Date.CompareDate(submitDT, validityDT) > 0 ? submitDT : validityDT;
                    }
                    Data.SetValue("ValidityDateTime", submitDT);
                }
            });
        }
        P2P.InitValidityDateTime = InitValidityDateTime;
        function InitArchiveDuration(paramInstance, paramName) {
            if (paramName === void 0) { paramName = "ArchiveDurationInMonths"; }
            return Sys.Parameters.GetInstance(paramInstance).PromisedIsReady()
                .Then(function () {
                // Override the form archive duration of the process when a value is defined (may differ according to the environments)
                var archiveDuration = Sys.Parameters.GetInstance(paramInstance).GetParameter(paramName, null);
                if (archiveDuration !== null) {
                    Data.SetValue("ArchiveDuration", archiveDuration);
                    Log.Info("ArchiveDuration is set to ".concat(archiveDuration, " months"));
                }
            });
        }
        P2P.InitArchiveDuration = InitArchiveDuration;
        function InitSAPConfiguration(erpName, parameterInstance) {
            if (parameterInstance) {
                Variable.SetValueAsString("SAPConfiguration", Sys.Parameters.GetInstance(parameterInstance).GetParameter("SAPConfiguration"));
            }
            else if (!Variable.GetValueAsString("SAPConfiguration")) {
                Variable.SetValueAsString("SAPConfiguration", Sys.Parameters.GetInstance("P2P_" + (erpName ? erpName : Lib.ERP.GetERPName())).GetParameter("Configuration"));
            }
        }
        P2P.InitSAPConfiguration = InitSAPConfiguration;
        function IsInvestmentEnabled() {
            var erp = Lib.ERP.GetERPName();
            if (erp) {
                return Sys.Parameters.GetInstance("P2P_" + erp).GetParameter("EnableInvestment", false);
            }
            return false;
        }
        P2P.IsInvestmentEnabled = IsInvestmentEnabled;
        function GetPOMatchingMode() {
            return Sys.Parameters.GetInstance("AP").GetParameter("VerificationPOMatchingMode");
        }
        P2P.GetPOMatchingMode = GetPOMatchingMode;
        function IsGRIVEnabledGlobally() {
            return Lib.P2P.GetPOMatchingMode() === "GR";
        }
        P2P.IsGRIVEnabledGlobally = IsGRIVEnabledGlobally;
        function IsGRIVEnabledByLine() {
            return Lib.P2P.GetPOMatchingMode() === "LineItem";
        }
        P2P.IsGRIVEnabledByLine = IsGRIVEnabledByLine;
        function IsGRIVEnabled() {
            return Lib.P2P.IsGRIVEnabledGlobally() || Lib.P2P.IsGRIVEnabledByLine();
        }
        P2P.IsGRIVEnabled = IsGRIVEnabled;
        /**
         * Build a LDAP filter to ensure that the company code equals a given value or is empty, but not null
         * @memberof Lib.P2P
         * @param {string} companyCode The value of the company code
         */
        function GetCompanyCodeFilter(companyCode) {
            return "|(CompanyCode__=" + companyCode + ")(CompanyCode__=)(!(CompanyCode__=*))";
        }
        P2P.GetCompanyCodeFilter = GetCompanyCodeFilter;
        /**
         * Build a LDAP filter to ensure that the vendor number equals a given value or is empty, but not null
         * @memberof Lib.P2P
         * @param {string} vendorNumber The value of the vendorNumber
         */
        function GetVendorNumberFilter(vendorNumber) {
            return "|(VendorNumber__=" + vendorNumber + ")(VendorNumber__=)(!(VendorNumber__=*))";
        }
        P2P.GetVendorNumberFilter = GetVendorNumberFilter;
        function GetBudgetKeyColumns() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("BudgetKeyColumns", "CompanyCode__;PeriodCode__;CostCenter__;Group__").split(";");
        }
        P2P.GetBudgetKeyColumns = GetBudgetKeyColumns;
        function GetBudgetValidationKeyColumns() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("BudgetValidationKeyColumns", "CompanyCode__;CostCenter__").split(";");
        }
        P2P.GetBudgetValidationKeyColumns = GetBudgetValidationKeyColumns;
        function IsCrossSectionalBudgetLineDisabled() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("DisableCrossSectionalBudgetLine", null, { traceLevel: "Warn" });
        }
        P2P.IsCrossSectionalBudgetLineDisabled = IsCrossSectionalBudgetLineDisabled;
        function ChangeConfiguration(newConfiguration, configNames) {
            if (configNames === void 0) { configNames = ["PAC", "AP"]; }
            return Sys.Helpers.Promise.Create(function (resolve) {
                var loadInstance = function (configNameInstances) {
                    var instance = configNameInstances.shift();
                    if (!instance) {
                        resolve();
                    }
                    else {
                        Sys.Parameters.GetInstance(instance).IsReady(function () {
                            loadInstance(configNameInstances);
                        });
                    }
                };
                configNames.forEach(function (configName) {
                    Sys.Parameters.GetInstance(configName).Reload(newConfiguration);
                });
                loadInstance(configNames);
            });
        }
        P2P.ChangeConfiguration = ChangeConfiguration;
        /**
         * Compute unit price from amount and quantity. The value is returned as a String, so that 0 is set as ""
         * @memberof Lib.P2P
         * @param {(string|float)} amount
         * @param {(string|float)} quantity
         *
         */
        function ComputeUnitPrice(amount, quantity) {
            var unitPrice = parseFloat(amount) / parseFloat(quantity);
            var result = null;
            if (!isNaN(unitPrice) && unitPrice !== Infinity && unitPrice !== 0) {
                result = unitPrice;
            }
            return result;
        }
        P2P.ComputeUnitPrice = ComputeUnitPrice;
        /**
         * Warn user when no archive duration is defined (or default one (2 months)) and this feature is enabled according to his account/environment type.
         * Cases matrix:
         *	- feat. enabled(undefined)/disabled:	YES/NO
         *	- warning disabled:						NO
         *	- demo account:							NO
         *	- DEV env:								NO
         *	- QA env:								NO
         *	- PROD env:								YES
         *	- Unknown env:							YES
         * @memberof Lib.P2P
         * @param {string} paramInstance where the ArchiveDurationInMonths parameter is defined
         * @param {function} warnCallback in order to customize warning
         * @param {string} paramName name of the param in the AP Configuration Settings
         * @param {function} getArchiveDuration alternative function to get archive duration by an other way
         */
        function DisplayArchiveDurationWarning(paramInstance, warnCallback, paramName, getArchiveDuration) {
            if (paramName === void 0) { paramName = "ArchiveDurationInMonths"; }
            if (getArchiveDuration === void 0) { getArchiveDuration = null; }
            return Sys.Parameters.GetInstance(paramInstance).PromisedIsReady()
                .Then(function () { return Sys.Parameters.GetInstance("P2P").PromisedIsReady(); })
                .Then(function () {
                var enabled = Sys.Parameters.GetInstance(paramInstance).GetParameter("ArchiveDurationWarning", null);
                // Is defined on the user parameter instance ?
                if (enabled === null) {
                    enabled = Sys.Parameters.GetInstance("P2P").GetParameter("ArchiveDurationWarning", true);
                }
                if (enabled) {
                    var archiveDuration = (getArchiveDuration === null || getArchiveDuration === void 0 ? void 0 : getArchiveDuration()) || Sys.Parameters.GetInstance(paramInstance).GetParameter(paramName) || parseFloat(Data.GetValue("ArchiveDuration")) || parseFloat(Data.GetValue("ArchiveDurationInMonths__")) || parseFloat(Process.GetDefaultArchiveDuration());
                    if (!Sys.Helpers.IsNumeric(archiveDuration) || parseFloat(archiveDuration) < 12) {
                        if (Sys.ScriptInfo.IsServer() || !g.User.isInDemoAccount) {
                            if (Sys.Helpers.IsFunction(warnCallback)) {
                                warnCallback();
                            }
                            Log.Warn("No archive duration defined.");
                        }
                    }
                }
            });
        }
        P2P.DisplayArchiveDurationWarning = DisplayArchiveDurationWarning;
        function DisplayArchiveDurationWarningAsTopMessageWarning(topMessageWarning) {
            var completionDateTime = Data.GetValue("CompletionDateTime");
            if (completionDateTime && typeof completionDateTime.getMonth === "function") {
                completionDateTime.setMonth(completionDateTime.getMonth() + 2);
                topMessageWarning.Add(Language.Translate("_Archive duration warning with completion {0}", false, Sys.Helpers.Date.ToLocaleDateEx(completionDateTime, "")));
            }
            else {
                topMessageWarning.Add(Language.Translate("_Archive duration warning"));
            }
        }
        P2P.DisplayArchiveDurationWarningAsTopMessageWarning = DisplayArchiveDurationWarningAsTopMessageWarning;
        /**
         * Tells if the current user is the owner of the document
         *
         * @memberof Lib.P2P
         * @returns is the current user the owner of the current document
         */
        function IsOwnerOrBackup() {
            return IsOwner() || IsOwnerBackup();
        }
        P2P.IsOwnerOrBackup = IsOwnerOrBackup;
        function IsOwner() {
            return Sys.ScriptInfo.IsClient()
                && (!Data.GetValue("OwnerId")
                    || g.User.loginId === Data.GetValue("OwnerId")
                    || g.User.IsMemberOf(Data.GetValue("OwnerId")));
        }
        P2P.IsOwner = IsOwner;
        function IsOwnerBackup() {
            return Sys.ScriptInfo.IsClient()
                && (!Data.GetValue("OwnerId")
                    || g.User.IsBackupUserOf(Data.GetValue("OwnerId")));
        }
        P2P.IsOwnerBackup = IsOwnerBackup;
        /**
         * Tells if the current user has the fullAdmin role
         * @memberof Lib.P2P
         * @returns A boolean that tells us if the current user is an Admin
         */
        function IsAdmin() {
            return Sys.ScriptInfo.IsClient() && (g.User.profileRole === "accountManagement");
        }
        P2P.IsAdmin = IsAdmin;
        /**
         * Tells if the current user has opened somebody else's document as Admin (he's the admin but not the owner of the document)
         * @memberof Lib.P2P
         * @returns A boolean that tells us if the current user opened somebody else's document as Admin (he's the admin but not the owner of the document)
         */
        function IsAdminNotOwner() {
            return Sys.ScriptInfo.IsClient() && !IsOwner() && !g.User.IsBackupUserOf(Data.GetValue("OwnerId")) && IsAdmin();
        }
        P2P.IsAdminNotOwner = IsAdminNotOwner;
        /**
         * Warn the admin that he has access to a document that doesn't belong to him, in read/write mode, because he's an admin
         * Cases matrix:
         *	- feat. enabled(undefined)/disabled:	YES/NO
         *	- warning disabled:						NO
         *	- demo account:							YES
         *	- DEV env:								YES
         *	- QA env:								YES
         *	- PROD env:								YES
         *	- Unknown env:							YES
         * @memberof Lib.P2P
         * @param {string} paramInstance where the AdminWarning parameter is defined
         * @param {function} warnCallback in order to customize warning
         * @param {additionalDisplayCondition} additionalDisplayCondition the condition to be met, other than the document state, to display the warning
         * @param {number[]} states the liste of document states the warning is displayed in
         */
        function DisplayAdminWarning(paramInstance, warnCallback, additionalDisplayCondition, states) {
            if (additionalDisplayCondition === void 0) { additionalDisplayCondition = true; }
            if (states === void 0) { states = [70, 90]; }
            return Sys.Parameters.GetInstance(paramInstance).PromisedIsReady()
                .Then(function () {
                var enabled = Sys.Parameters.GetInstance(paramInstance).GetParameter("AdminWarning", null);
                // Is defined on the user parameter instance ?
                if (enabled === null) {
                    enabled = Sys.Parameters.GetInstance("P2P").GetParameter("AdminWarning", true);
                }
                if (enabled) {
                    var login_1 = Data.GetValue("OwnerID");
                    var isDocumentStateVerified = states.indexOf(+Data.GetValue("State")) > -1;
                    if (login_1 && Sys.ScriptInfo.IsClient() && IsAdminNotOwner() && isDocumentStateVerified && additionalDisplayCondition) {
                        Sys.OnDemand.Users.CacheByLogin.Get(login_1, Lib.P2P.attributesForUserCache).Then(function (result) {
                            var user = result[login_1];
                            if (!user.$error && Sys.Helpers.IsFunction(warnCallback)) {
                                warnCallback(user.displayname);
                            }
                        });
                    }
                }
            });
        }
        P2P.DisplayAdminWarning = DisplayAdminWarning;
        /**
         * Warn the admin that he has access to a document that doesn't belong to him, in read/write mode, because he's an admin Even if he is ooto
         * Cases matrix:
         *	- feat. enabled(undefined)/disabled:	YES/NO
         *	- warning disabled:						NO
         *	- demo account:							YES
         *	- DEV env:								YES
         *	- QA env:								YES
         *	- PROD env:								YES
         *	- Unknown env:							YES
         * @memberof Lib.P2P
         * @param {string} paramInstance where the AdminWarning parameter is defined
         * @param {function} warnCallback in order to customize warning
         * @param {additionalDisplayCondition} additionalDisplayCondition the condition to be met, other than the document state, to display the warning
         * @param {number[]} states the liste of document states the warning is displayed in
         */
        function DisplayAdminAndOOTOWarning(paramInstance, warnCallback, additionalDisplayCondition, states) {
            if (additionalDisplayCondition === void 0) { additionalDisplayCondition = true; }
            if (states === void 0) { states = [70, 90]; }
            Sys.Parameters.GetInstance(paramInstance).IsReady(function () {
                var enabled = Sys.Parameters.GetInstance(paramInstance).GetParameter("AdminWarning", null);
                // Is defined on the user parameter instance ?
                if (enabled === null) {
                    enabled = Sys.Parameters.GetInstance("P2P").GetParameter("AdminWarning", true);
                }
                if (enabled) {
                    var login_2 = Data.GetValue("OwnerID");
                    var isDocumentStateVerified = states.indexOf(+Data.GetValue("State")) > -1;
                    if (login_2 && Sys.ScriptInfo.IsClient() && IsAdmin() && isDocumentStateVerified && additionalDisplayCondition) {
                        Sys.OnDemand.Users.CacheByLogin.Get(login_2, Lib.P2P.attributesForUserCache).Then(function (result) {
                            var user = result[login_2];
                            if (!user.$error && Sys.Helpers.IsFunction(warnCallback)) {
                                warnCallback(user.displayname);
                            }
                        });
                    }
                }
            });
        }
        P2P.DisplayAdminAndOOTOWarning = DisplayAdminAndOOTOWarning;
        /**
         * Warn user if he see a document because he is the backup of the current owner of this document.
         * Cases matrix:
         *	- feat. enabled(undefined)/disabled:	YES/NO
         *	- warning disabled:						NO
         *	- demo account:							YES
         *	- DEV env:								YES
         *	- QA env:								YES
         *	- PROD env:								YES
         *	- Unknown env:							YES
         * @memberof Lib.P2P
         * @param {string} paramInstance where the BackupUserWarning parameter is defined
         * @param {function} warnCallback in order to customize warning
         */
        function DisplayBackupUserWarning(paramInstance, warnCallback, ootoUserCallback) {
            function query_CB() {
                var err = this.GetQueryError();
                if (err || this.GetRecordsCount() === 0) {
                    return Sys.Helpers.Promise.Resolve();
                }
                var login = Sys.Helpers.String.ExtractLoginFromDN(this.GetQueryValue("UserOwnerID", 0));
                return Sys.OnDemand.Users.CacheByLogin.Get(login, Lib.P2P.attributesForUserCache)
                    .Then(function (result) {
                    var user = result[login];
                    if (!user.$error && Sys.Helpers.IsFunction(warnCallback)) {
                        warnCallback(user.displayname);
                    }
                });
            }
            return Sys.Parameters.GetInstance(paramInstance).PromisedIsReady()
                .Then(function () {
                var enabled = Sys.Parameters.GetInstance(paramInstance).GetParameter("BackupUserWarning", null);
                // Is defined on the user parameter instance ?
                if (enabled === null) {
                    enabled = Sys.Parameters.GetInstance("P2P").GetParameter("BackupUserWarning", true);
                }
                if (enabled) {
                    var login_3 = null;
                    if (ootoUserCallback) {
                        login_3 = ootoUserCallback();
                    }
                    else {
                        var ownerId = Data.GetValue("OwnerID");
                        if (Sys.ScriptInfo.IsClient() && Data.GetValue("State") === "70" && g.User.loginId !== ownerId && g.User.IsBackupUserOf(ownerId)) {
                            login_3 = Data.GetValue("OwnerID");
                        }
                    }
                    if (login_3) {
                        return Sys.OnDemand.Users.CacheByLogin.Get(login_3, Lib.P2P.attributesForUserCache)
                            .Then(function (result) {
                            var user = result[login_3];
                            if (!user.$error && Sys.Helpers.IsFunction(warnCallback)) {
                                if (user.isgroup == "1") {
                                    var realUser = Sys.ScriptInfo.IsClient() ? g.User : Lib.P2P.GetValidatorOrOwner();
                                    var users = realUser.GetBackedUpUsers();
                                    var filter_1 = "(&(GROUPOWNERID=cn=" + login_3 + ",*)(UserOwnerID[=](";
                                    Sys.Helpers.Array.ForEach(users, function (key) {
                                        filter_1 += Sys.Helpers.String.EscapeValueForLdapFilterForINClause(key);
                                        filter_1 += ",";
                                    });
                                    filter_1 += ")))";
                                    // cepalle Should be promised ='(
                                    Query.DBQuery(query_CB, "ODUSERGROUP", "UserOwnerID", filter_1, "", 1);
                                }
                                else {
                                    warnCallback(user.displayname);
                                }
                            }
                        });
                    }
                }
            });
        }
        P2P.DisplayBackupUserWarning = DisplayBackupUserWarning;
        /**
         * Warn user if he see a document because he is creating the document on behalf ofanother user.
         * Cases matrix:
         *	- feat. enabled(undefined)/disabled:	YES/NO
         *	- warning disabled:						NO
         *	- demo account:							YES
         *	- DEV env:								YES
         *	- QA env:								YES
         *	- PROD env:								YES
         *	- Unknown env:							YES
         * @memberof Lib.P2P
         * @param {string} paramInstance where the OnBehalfWarning parameter is defined
         * @param {function} onBehalfCallback in order to customize warning
         */
        function DisplayOnBehalfWarning(userLoginId, onBehalfCallback) {
            var enabled = Sys.Helpers.String.ToBoolean(Data.GetValue("CreatedOnBehalf"));
            if (enabled) {
                var nameToDisplay_1 = "";
                var isCreatedBy_1;
                var CreatorOwnerLogin_1 = Data.GetValue("CreatorOwnerID") ? Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("CreatorOwnerID")) : null;
                var OriginalOwnerLogin_1 = Data.GetValue("OriginalOwnerID") ? Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OriginalOwnerID")) : null;
                var IsCreatedByYou = CreatorOwnerLogin_1 === userLoginId || CreatorOwnerLogin_1 === null;
                var IsCreatedForYou = OriginalOwnerLogin_1 === userLoginId || OriginalOwnerLogin_1 === null;
                if ((!IsCreatedByYou && IsCreatedForYou) || (IsCreatedByYou && !IsCreatedForYou)) {
                    if (!IsCreatedByYou && CreatorOwnerLogin_1 !== null) {
                        Sys.OnDemand.Users.CacheByLogin.Get(CreatorOwnerLogin_1, Lib.P2P.attributesForUserCache).Then(function (result) {
                            var user = result[CreatorOwnerLogin_1];
                            if (!user.$error) {
                                nameToDisplay_1 = user.displayname;
                                isCreatedBy_1 = true;
                                if (onBehalfCallback) {
                                    onBehalfCallback(nameToDisplay_1, isCreatedBy_1);
                                }
                            }
                        });
                    }
                    if (!IsCreatedForYou && OriginalOwnerLogin_1 !== null) {
                        Sys.OnDemand.Users.CacheByLogin.Get(OriginalOwnerLogin_1, Lib.P2P.attributesForUserCache).Then(function (result) {
                            var user = result[OriginalOwnerLogin_1];
                            if (!user.$error) {
                                nameToDisplay_1 = user.displayname;
                                isCreatedBy_1 = false;
                                if (onBehalfCallback) {
                                    onBehalfCallback(nameToDisplay_1, isCreatedBy_1);
                                }
                            }
                        });
                    }
                }
            }
        }
        P2P.DisplayOnBehalfWarning = DisplayOnBehalfWarning;
        var TopMessageWarningClass = /** @class */ (function () {
            function TopMessageWarningClass(panelControl, messageControl) {
                this.panelControl = null;
                this.messages = [];
                this.panelControl = panelControl;
                this.messageControl = messageControl;
                this.Display();
            }
            TopMessageWarningClass.prototype.Display = function () {
                if (this.messages.length > 0) {
                    if (this.messageControl.GetType() === "HTML") {
                        this.messageControl.SetCSS("div { font-size: 16px; color: white; font-weight: bold; text-align: center }");
                        this.messageControl.SetHTML("<div>" + Sys.Helpers.Array.Map(this.messages, function (v) {
                            return v.replace("\n", "<br/>");
                        }).join("<br/>") + "</div>");
                    }
                    else {
                        this.messageControl.SetLabel(this.messages.join(" \n "));
                    }
                    this.panelControl.Hide(false);
                }
                else {
                    this.panelControl.Hide(true);
                }
            };
            TopMessageWarningClass.prototype.Add = function (msg, position) {
                var i = this.Find(msg);
                if (i >= 0) {
                    return i;
                }
                if (Sys.Helpers.IsUndefined(position)) {
                    position = this.messages.length;
                }
                this.messages.splice(position, 0, msg);
                this.Display();
                return this.messages.length ? this.messages.length - 1 : 0;
            };
            TopMessageWarningClass.prototype.Remove = function (idx) {
                if (Sys.Helpers.IsString(idx)) {
                    idx = this.Find(idx);
                }
                if (idx >= 0 && idx < this.messages.length) {
                    this.messages.splice(idx, 1);
                    this.Display();
                }
            };
            TopMessageWarningClass.prototype.Find = function (msg) {
                for (var i = 0; i < this.messages.length; ++i) {
                    if (msg === this.messages[i]) {
                        return i;
                    }
                }
                return -1;
            };
            TopMessageWarningClass.prototype.Clear = function () {
                this.messages = [];
                this.panelControl.Hide(true);
            };
            return TopMessageWarningClass;
        }());
        P2P.TopMessageWarningClass = TopMessageWarningClass;
        /**
         * Object to manage the TopPaneWarning
         * @memberof Lib.P2P
         * @param {object} TopPaneWarning control object of the panel that contain the warning message
         * @param {object} TopMessageWarning__ control object of the field that contain the warning message
         */
        function TopMessageWarning(panelControl, messageControl) {
            return new TopMessageWarningClass(panelControl, messageControl);
        }
        P2P.TopMessageWarning = TopMessageWarning;
        var OnSynchronizerProgressClass = /** @class */ (function () {
            function OnSynchronizerProgressClass(_, sync) {
                this.progressPopup = (function () {
                    var currentDialog = null, dialogTitle = null, dialogMessage = null, synchronizer = null, 
                    // properties to create dialog
                    fillPopup = function (dialog) {
                        currentDialog = dialog;
                        var control = dialog.AddDescription("Message__");
                        control.SetText(dialogMessage);
                        dialog.HideDefaultButtons();
                        control = dialog.AddButton("Yes__", "_Continue");
                        control.SetSubmitStyle();
                        dialog.AddButton("Cancel__", "_Close");
                    }, commitPopup = function () {
                        onDialogAction("Yes");
                    }, handlePopup = function (dialog, tabId, event, control) {
                        if (event === "OnClick") {
                            if (control.GetName() === "Yes__") {
                                dialog.Commit();
                            }
                            else {
                                dialog.Cancel();
                            }
                            currentDialog = null;
                        }
                    }, cancelPopup = function () {
                        onDialogAction("Cancel");
                    }, 
                    // properties to display dialog
                    displaying = false, lastProgressTime = null, offsetFromLastProgressTime = 0, delayedDisplayTimeoutId = null, showDialog = function () {
                        delayedDisplayTimeoutId = null;
                        if (synchronizer.IsPending()) {
                            displaying = true;
                            Sys.Helpers.Globals.Popup.Dialog(dialogTitle, null, fillPopup, commitPopup, null, handlePopup, cancelPopup);
                        }
                    }, hideDialog = function () {
                        if (currentDialog) {
                            currentDialog.Commit();
                        }
                    }, 
                    // Action on dialog
                    onDialogAction = function (action) {
                        if (synchronizer.IsPending()) {
                            // Don't wait and quit form
                            if (action !== "Yes") {
                                synchronizer.Stop();
                                if (!g.ProcessInstance.Next("next")) {
                                    g.ProcessInstance.Quit("quit");
                                }
                            }
                            else if (waitScreenControl) {
                                setTimeout(function () {
                                    if (synchronizer.IsPending()) {
                                        waitScreenControl.Wait(true);
                                    }
                                });
                            }
                            displaying = false;
                            offsetFromLastProgressTime = new Date().getTime() - lastProgressTime;
                        }
                    }, 
                    // waitscreen
                    waitScreenControl = (function () {
                        for (var key in g.Controls) {
                            if (Object.prototype.hasOwnProperty.call(g.Controls, key) && key.endsWith("__")) {
                                return g.Controls[key];
                            }
                        }
                        return null;
                    })();
                    return {
                        Show: function (sync) {
                            if (Sys.ScriptInfo.IsClient()) {
                                if (!synchronizer) {
                                    synchronizer = sync;
                                    synchronizer.Synchronize(function () {
                                        hideDialog();
                                    });
                                }
                                dialogTitle = (synchronizer.userData && synchronizer.userData.dialogTitle) || "_Form awaiting external data loading";
                                dialogMessage = (synchronizer.userData && synchronizer.userData.dialogMessage) || "_Do you want to wait for the end of external data loading?";
                                lastProgressTime = new Date().getTime();
                                if (!displaying && delayedDisplayTimeoutId === null) {
                                    delayedDisplayTimeoutId = setTimeout(showDialog, offsetFromLastProgressTime, synchronizer);
                                }
                            }
                        }
                    };
                })();
                if (this.progressPopup) {
                    this.progressPopup.Show(sync);
                }
            }
            return OnSynchronizerProgressClass;
        }());
        P2P.OnSynchronizerProgressClass = OnSynchronizerProgressClass;
        function OnSynchronizerProgress(_, sync) {
            return new OnSynchronizerProgressClass(_, sync);
        }
        P2P.OnSynchronizerProgress = OnSynchronizerProgress;
        // isGroup can be xxx.GetValue(). Ex. Controls.workflow__.GetRow(0).ISGROUP__.GetValue()
        function GetP2PUserImage(isGroup) {
            var image = Sys.Helpers.String.ToBoolean(isGroup) ? "P2P_Workflow_group_user.png" : "P2P_Workflow_single_user.png";
            var url = Process.GetImageURL(image, true);
            return url ? url : image;
        }
        P2P.GetP2PUserImage = GetP2PUserImage;
        function SetBillingInfo(processingLabel) {
            if (processingLabel) {
                Log.Info("Set processing label: " + processingLabel);
                g.Data.SetValue("ProcessingLabel", processingLabel);
            }
            var ownerId = g.Data.GetValue("OwnerId");
            var lastSavedOwnerId = g.Data.GetValue("LastSavedOwnerId");
            // is group
            if (ownerId !== lastSavedOwnerId) {
                var info = {
                    userId: Sys.Helpers.String.ExtractLoginFromDN(lastSavedOwnerId)
                };
                Log.Info("Set billing info: " + info.userId);
                if (!Process.SetBillingInfo(info)) {
                    Log.Error("Error setting billing info: " + info.userId);
                    return false;
                }
            }
            return true;
        }
        P2P.SetBillingInfo = SetBillingInfo;
        function SetTablesToIndex(tables) {
            Variable.SetValueAsString("InternalDataTablesToIndex", tables.map(function (table) {
                return table + "," + Data.GetTable(table).GetLocalUniqueId();
            }).join(";"));
        }
        P2P.SetTablesToIndex = SetTablesToIndex;
        var UserObject = /** @class */ (function () {
            function UserObject(loginfield) {
                this.user = null;
                this.loginField = loginfield;
            }
            UserObject.prototype.GetUser = function () {
                return this.user || (this.user = g.Users.GetUser(g.Data.GetValue(this.loginField)));
            };
            UserObject.prototype.Reset = function () {
                this.user = null;
            };
            return UserObject;
        }());
        var OwnerObject = new UserObject("OwnerId");
        P2P.GetOwner = function () {
            return OwnerObject.GetUser();
        };
        // Particular case on server. We need to reset cached OwnerObject when the owner changes
        if (Sys.ScriptInfo.IsServer()) {
            Process.ChangeOwner = Sys.Helpers.Wrap(Process.ChangeOwner, function (originalFn) {
                var params = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    params[_i - 1] = arguments[_i];
                }
                originalFn.apply(Process, params);
                OwnerObject.Reset();
            });
        }
        var ValidatorObject = new UserObject("LastSavedOwnerID");
        P2P.GetValidator = function () {
            return ValidatorObject.GetUser();
        };
        function GetValidatorOrOwner() {
            return Lib.P2P.GetValidator() || Lib.P2P.GetOwner();
        }
        P2P.GetValidatorOrOwner = GetValidatorOrOwner;
        function GetValidatorOrOwnerLogin() {
            return g.Data.GetValue("LastSavedOwnerID") || g.Data.GetValue("OwnerId");
        }
        P2P.GetValidatorOrOwnerLogin = GetValidatorOrOwnerLogin;
        function AddOnBehalfOf(currentContributor, comment) {
            if (Sys.ScriptInfo.IsClient()) {
                throw new Error("AddOnBehalfOf is not supported on client side");
            }
            var validator = Lib.P2P.GetValidator();
            if (!validator) {
                return comment;
            }
            var owner;
            if (currentContributor) {
                owner = g.Users.GetUser(currentContributor.login);
            }
            else {
                owner = Lib.P2P.GetOwner();
            }
            if (currentContributor && currentContributor.login !== validator.GetValue("Login")
                && validator.GetValue("Login") !== owner.GetValue("Login")
                && comment !== Language.Translate("_Automatically created")) {
                var prefix = "";
                if (validator.IsMemberOf(owner.GetValue("Login"))) {
                    prefix = Language.Translate("_Action performed by {0}", false, validator.GetValue("DisplayName"));
                }
                else {
                    prefix = Language.Translate("_On behalf of", false, validator.GetValue("DisplayName"), currentContributor ? currentContributor.name : owner.GetValue("DisplayName"));
                    if (owner.GetValue("IsGroup") === "1") {
                        var query = Process.CreateQuery();
                        query.SetSpecificTable("ODUSERGROUP");
                        var users = validator.GetBackedUpUsers();
                        var filter_2 = "(&(GROUPOWNERID=" + owner.GetValue("FullDN") + ")(UserOwnerID[=](";
                        Sys.Helpers.Array.ForEach(users, function (key) {
                            filter_2 += Sys.Helpers.String.EscapeValueForLdapFilterForINClause(key);
                            filter_2 += ",";
                        });
                        filter_2 += ")))";
                        query.SetFilter(filter_2);
                        query.SetAttributesList("UserOwnerID");
                        query.SetOptionEx("Limit=1");
                        var record = query.MoveFirst() ? query.MoveNextRecord() : null;
                        if (record) {
                            var onwerid = record.GetVars().GetValue_String("UserOwnerID", 0);
                            var realUser = g.Users.GetUser(onwerid);
                            if (realUser) {
                                prefix = Language.Translate("_On behalf of", false, validator.GetValue("DisplayName"), realUser.GetValue("DisplayName"));
                            }
                        }
                    }
                }
                if (comment) {
                    return prefix + "\n" + comment;
                }
                return prefix;
            }
            return comment;
        }
        P2P.AddOnBehalfOf = AddOnBehalfOf;
        function HighlightCurrentWorkflowStep(WKFController, workflowTableName, index, notMergeableRoles, withoutGroupBug) {
            // for description of parameter withoutGroupBug see CheckPreviousRows
            notMergeableRoles = notMergeableRoles || ["_Role buyer"];
            function CheckPreviousRows(table, i) {
                // This function recurses from the specified row to the current row of the worflow in order to check
                // that all the users are the same as current user in the workflow or backup or the group to which
                // the current user belongs
                // So: Carole / Carole => returns true
                // Carole / Kate => return false
                // Buyers / Carole => returns true
                // But Carole / Buyers returns false (buggy behaviour)
                // As it should not be fixed and because the right behaviour is needed for ASN (Carole / Buyers => true),
                // a version 2 has been developped
                var row = table.GetRow(i);
                var rowContributor = WKFController.GetContributorAt(row);
                var prevRow = i > 0 ? table.GetRow(--i) : null;
                var prevRowContributor = prevRow ? WKFController.GetContributorAt(prevRow) : null;
                var stillTheSame = rowContributor ? rowContributor.login == Sys.Helpers.Globals.User.loginId : false;
                var sameAsCurrentContributorRow = false;
                while (prevRow && stillTheSame && !sameAsCurrentContributorRow) {
                    if (WKFController.IsCurrentContributorAt(prevRow)) {
                        var currentContributor = prevRowContributor;
                        if (rowContributor
                            && currentContributor
                            && notMergeableRoles.indexOf(rowContributor.role) === -1
                            && rowContributor.login == g.User.loginId
                            && (rowContributor.login == currentContributor.login
                                || g.User.IsBackupUserOf(currentContributor.login)
                                || g.User.IsMemberOf(currentContributor.login))) {
                            sameAsCurrentContributorRow = true;
                        }
                        else {
                            stillTheSame = false;
                        }
                    }
                    else if (rowContributor
                        && prevRowContributor
                        && notMergeableRoles.indexOf(rowContributor.role) === -1
                        && rowContributor.login == g.User.loginId
                        && rowContributor.login == prevRowContributor.login) {
                        prevRow = i > 0 ? table.GetRow(--i) : null;
                        prevRowContributor = prevRow ? WKFController.GetContributorAt(prevRow) : null;
                    }
                    else {
                        stillTheSame = false;
                    }
                }
                return sameAsCurrentContributorRow;
            }
            function CheckPreviousRowsVersion2(table, i) {
                // Version 2 without the bug of original version (and simpler)
                // (Original version kept for retro compatibility)
                var row = table.GetRow(i);
                var rowContributor = WKFController.GetContributorAt(row);
                var stillTheSame = rowContributor ? Lib.P2P.CurrentUserMatchesLogin(rowContributor.login) : false;
                while (rowContributor && stillTheSame) {
                    if (WKFController.IsCurrentContributorAt(row) && notMergeableRoles.indexOf(rowContributor.role) === -1) {
                        // We have finished recursion, return;
                        return stillTheSame;
                    }
                    else if (rowContributor
                        && notMergeableRoles.indexOf(rowContributor.role) === -1
                        && Lib.P2P.CurrentUserMatchesLogin(rowContributor.login)) {
                        row = i > 0 ? table.GetRow(--i) : null;
                        rowContributor = row ? WKFController.GetContributorAt(row) : null;
                    }
                    else {
                        stillTheSame = false;
                    }
                }
                // We have not reached current step, we are before, don't highlight past steps
                return false;
            }
            function CheckRow(table, i, version2WithoutGroupBug) {
                // for description of parameter withoutGroupBug see CheckPreviousRows
                var row = table.GetRow(i);
                var CheckPreviousRowsFn = version2WithoutGroupBug ? CheckPreviousRowsVersion2 : CheckPreviousRows;
                if (WKFController.IsCurrentContributorAt(row) || CheckPreviousRowsFn(table, i)) {
                    row.AddStyle("highlight");
                    // Add an image to the left of the user name
                    row.WRKFMarker__.SetImageURL("arrow.png", false);
                }
                else {
                    row.RemoveStyle("highlight");
                    // Remove previous image
                    row.WRKFMarker__.SetImageURL();
                }
            }
            if (Sys.ScriptInfo.IsClient()) {
                if (!WKFController.IsEnded()) {
                    var table = g.Controls[workflowTableName];
                    if (index || index === 0) {
                        // Index specified, check only this step
                        CheckRow(table, index, withoutGroupBug);
                    }
                    else {
                        // No index specified (index is null or undefined), check all steps
                        for (var i = 0; i < table.GetLineCount(true); i++) {
                            CheckRow(table, i, withoutGroupBug);
                        }
                    }
                }
            }
        }
        P2P.HighlightCurrentWorkflowStep = HighlightCurrentWorkflowStep;
        /**
         * Add a company code filter to any LDAP filter
         * @memberof string
         * @param {string} companyCode The value of the company code
         */
        String.prototype.AddCompanyCodeFilter = function (companyCode) {
            // Don't add parenthesis if the current string already have them
            if ((this.indexOf("(") === 0 && this.lastIndexOf(")") === this.length - 1) || this == "") // Warning: !this ne fonctionne pas cf RD00011552
             {
                return "(&(" + Lib.P2P.GetCompanyCodeFilter(companyCode) + ")" + this + ")";
            }
            return "(&(" + Lib.P2P.GetCompanyCodeFilter(companyCode) + ")(" + this + "))";
        };
        /**
         * Add a vendor number filter to any LDAP filter
         * @memberof string
         * @param {string} vendorNumber The value of the vendor number
         */
        String.prototype.AddVendorNumberFilter = function (vendorNumber) {
            // Don't add parenthesis if the current string already have them
            if ((this.indexOf("(") === 0 && this.lastIndexOf(")") === this.length - 1) || this == "") // Warning: !this ne fonctionne pas cf RD00011552
             {
                return "(&(" + Lib.P2P.GetVendorNumberFilter(vendorNumber) + ")" + this + ")";
            }
            return "(&(" + Lib.P2P.GetVendorNumberFilter(vendorNumber) + ")(" + this + "))";
        };
        /**
         * Add a IsLocalPO filter to any LDAP filter
         * @memberof string
         */
        String.prototype.AddNotCreatedInERPFilter = function () {
            // Don't add parenthesis if the current string already have them
            if ((this.indexOf("(") === 0 && this.lastIndexOf(")") === this.length - 1) || this == "") // Warning: !this ne fonctionne pas cf RD00011552
             {
                return "(&(|(IsCreatedInERP__=false)(IsCreatedInERP__!=*))" + this + ")";
            }
            return "(&(|(IsCreatedInERP__=false)(IsCreatedInERP__!=*))(" + this + "))";
        };
        /**
         * Formats a number with a template.
         * In the template, the string "$seq$" is replaced by the given number with 5 figures, padded with zeroes
         * Exemple: FormatSequenceNumber("1234$seq$", 56) => "123400056"
         */
        function FormatSequenceNumber(sequenceNumber, formatTemplate, prefix) {
            return formatTemplate.replace("$seq$", Sys.Helpers.String.PadLeft(sequenceNumber, "0", 5))
                .replace("$prefix$", prefix)
                .replace("$YYYY$", new Date().getFullYear());
        }
        P2P.FormatSequenceNumber = FormatSequenceNumber;
        var DynamicDiscounting;
        (function (DynamicDiscounting) {
            function ComputeDynamicDiscountAmount(infos) {
                var dynamicDiscountRate = 0;
                var dynamicDiscountAmount = 0;
                var invoiceAmountWithDiscount = infos.invoiceAmount;
                var deltaFromRequestedPaymentDateToDueDate = Sys.Helpers.Date.ComputeDeltaDays(infos.expirationDiscountDate, infos.dueDate);
                if (deltaFromRequestedPaymentDateToDueDate > 0) {
                    dynamicDiscountRate = (infos.discountRate * deltaFromRequestedPaymentDateToDueDate) / 30;
                    dynamicDiscountAmount = infos.invoiceAmount * dynamicDiscountRate;
                    invoiceAmountWithDiscount = infos.invoiceAmount - dynamicDiscountAmount;
                }
                return {
                    discountRate: Sys.Helpers.Round(dynamicDiscountRate * 100, 3),
                    estimatedDiscountAmount: dynamicDiscountAmount,
                    invoiceAmountWithDiscount: invoiceAmountWithDiscount
                };
            }
            DynamicDiscounting.ComputeDynamicDiscountAmount = ComputeDynamicDiscountAmount;
        })(DynamicDiscounting = P2P.DynamicDiscounting || (P2P.DynamicDiscounting = {}));
        /**
         * Redirect vendor email according to the configuration type in P2P global configuration settings
         * @memberof string
         * @param {string} vendorEmail vendor email
         * @return email address changed if conditions met
         */
        function computeVendorEmailRedirection(vendorEmail) {
            var mode = Sys.Parameters.GetInstance("P2P").GetParameter("ConfigurationType", "");
            var vendorEmailOverriden = Sys.Parameters.GetInstance("P2P").GetParameter("VendorEmailRedirection", "");
            if (mode === P2P.ConfigurationType.Test && !!vendorEmailOverriden) {
                Log.Info("Redirect vendor's email to a test email address: ".concat(vendorEmailOverriden));
                return vendorEmailOverriden;
            }
            return vendorEmail;
        }
        P2P.computeVendorEmailRedirection = computeVendorEmailRedirection;
        function GetShortLoginFromUser(usr) {
            var vendorLogin = usr.GetValue("login");
            if (vendorLogin && vendorLogin.indexOf("$") !== -1) {
                vendorLogin = vendorLogin.substring(1 + vendorLogin.indexOf("$"));
            }
            return vendorLogin;
        }
        P2P.GetShortLoginFromUser = GetShortLoginFromUser;
        var FreeDimension;
        (function (FreeDimension) {
            function DefineOnSelectItem(FieldName, AttributName) {
                return function (item) {
                    var currentItem = this.GetItem();
                    if (item) {
                        currentItem.SetValue(FieldName, item.GetValue(AttributName));
                    }
                    else {
                        currentItem.SetValue(FieldName, "");
                        currentItem.SetError(FieldName, "The value could not be resolved");
                    }
                };
            }
            FreeDimension.DefineOnSelectItem = DefineOnSelectItem;
            function DefineOnUnknownOrEmptyValue(FieldName) {
                return function () {
                    var currentItem = this.GetItem();
                    currentItem.SetValue(FieldName, null);
                };
            }
            FreeDimension.DefineOnUnknownOrEmptyValue = DefineOnUnknownOrEmptyValue;
        })(FreeDimension = P2P.FreeDimension || (P2P.FreeDimension = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
