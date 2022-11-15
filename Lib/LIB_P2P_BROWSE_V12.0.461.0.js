///#GLOBALS Lib Sys
/* LIB_DEFINITION{
  "name": "LIB_P2P_Browse_V12.0.461.0",
  "libraryType": "LIB",
  "scriptType": "CLIENT",
  "comment": "P2P library",
  "require": [
    "Lib_ERP_V12.0.461.0",
    "Lib_P2P_V12.0.461.0",
    "Lib_Parameters_P2P_V12.0.461.0",
    "Lib_AP_TaxHelper_V12.0.461.0",
    "Lib_Purchasing_Vendor_V12.0.461.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_Browse",
    "Sys/Sys_Parameters",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_Helpers_String_SAP",
    "Sys/Sys_ERP_SAP_Browse",
    "Sys/Sys_GenericAPI_Client",
    "Sys/Sys_Helpers_Promise",
    "Lib_AP_SAP_V12.0.461.0",
    "Lib_AP_SAP_Client_V12.0.461.0",
    "Lib_P2P_SAP_SOAP_Client_V12.0.461.0"
  ]
}*/
/**
 * Helpers for P2P browsing
 * @namespace Lib.P2P.Browse
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Browse;
        (function (Browse) {
            var sapConfigForVendor, sapConfigForCostCenter, sapConfigForWBSElement, sapConfigForInternalOrder, sapConfigForTaxCodeDescription, sapConfigForTaxCode, sapConfigForChartOfAccounts, sapConfigForGlAccountDescription, bapiConfigForGlAccountDescription, sapConfigForGlAccountList, bapiConfigForGlAccountList, sapConfigForPaymentTerms, sapConfigForGoodIssueHeaders;
            var sapQueryLanguage;
            function IsBrowseControl(ctrlToTest) {
                return ctrlToTest !== undefined && Sys.Helpers.IsFunction(ctrlToTest.ClearSearchFields);
            }
            function QueryGlAccountWithGroup(callback, table, attributes, ldapFilter, sortOrder, maxRecords, config, option, ctrl) {
                var attrs = attributes.split("|");
                if (Sys.Helpers.Array.IndexOf(attrs, "Group__") === -1) {
                    Sys.ERP.SAP.Browse.SapQuery(callback, table, attributes, ldapFilter, sortOrder, maxRecords, config, option, ctrl);
                }
                else {
                    var filter = "CompanyCode__=" + Sys.ERP.SAP.Browse.ExtractFieldValue(ldapFilter, "CompanyCode__");
                    Sys.GenericAPI.Query("AP - G/L accounts__", filter, ["Account__", "Group__"], function (glAccountRecords, error) {
                        function callbackMerge(records) {
                            var recordsDefinition = records.RecordsDefinition;
                            var iAccount = recordsDefinition["ACCOUNT__"];
                            var iGroup = recordsDefinition["GROUP__"];
                            Sys.Helpers.Array.ForEach(records.Records, function (record) {
                                var account = record[iAccount];
                                var accountRecord = Sys.Helpers.Array.Find(glAccountRecords, function (glAccountRecord) {
                                    return glAccountRecord.Account__ === account;
                                });
                                record[iGroup] = accountRecord ? accountRecord.Group__ : "";
                            });
                            callback(records);
                        }
                        Sys.ERP.SAP.Browse.SapQuery(error ? callback : callbackMerge, table, attributes, ldapFilter, sortOrder, maxRecords, config, option, ctrl);
                    }, null, "NO_LIMIT", { useConstantQueryCache: true });
                }
            }
            /**
             * @lends Lib.P2P.Browse
             */
            function InitSAPVariable(parameterInstance) {
                Lib.P2P.InitSAPConfiguration(Lib.ERP.GetERPName(), parameterInstance);
                sapQueryLanguage = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.CustomQueryLanguage");
                /**
                 * Config used by Sys.ERP.SAP.Browse.SapQuery for browsing vendor in SAP
                 */
                sapConfigForVendor =
                    {
                        /**
                            * Name of SAP configuration
                         * @type string
                            */
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                            * Name of SAP Table to query
                            */
                        sapTableName: "ZESK_VENDORS",
                        /**
                         * Mapping between SAP and Esker, in a key-value format. It should include all columns that are displayed in the database combo box control.
                         * The key represents the SAP field.
                         * The value represents the corresponding form field.
                            */
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            NAME1: "Name__",
                            LIFNR: "Number__",
                            STRAS: "Street__",
                            PFACH: "PostOfficeBox__",
                            ORT01: "City__",
                            PSTLZ: "PostalCode__",
                            REGIO: "Region__",
                            LAND1: "Country__",
                            TELFX: "FaxNumber__",
                            STCEG: "VATNumber__",
                            ZTERM: "PaymentTermCode__",
                            QSSKZ: "WithholdingTax__"
                        },
                        /**
                         * Description of the SAP fields to search. It should match all search fields added to the database combo box control by the AddSearchField function.
                         * The list is in a key-value format.
                         * The key represents the SAP field that is initially requested and returned, as defined in the above mapping.
                         * The value represents the SAP field where the search is really performed.
                            */
                        sapSearchFields: {
                            /**
                             * The SAP field to search. It can directly design a field, ex. NAME1: "MCOD1", or use a complex struct as shown below
                             */
                            NAME1: {
                                /**
                                 * The SAP field where the search is really performed. See [MCOD1 Name SAP Table field attributes inc. MCDK1 Data Element]{@link http://www.se80.co.uk/saptabfields/l/lfa1/lfa1-mcod1.htm} for details
                                 * @type string
                                 */
                                sapField: "MCOD1",
                                /**
                                 * The maximum length of this field value
                                 * @type integer
                                 */
                                maxValueLength: 25
                            },
                            LIFNR: {
                                sapField: "LIFNR",
                                maxValueLength: 10,
                                /**
                                 * Padding description. See [CONVERSION_EXIT_ALPHA_INPUT SAP Function module]{@link http://www.se80.co.uk/sapfms/c/conv/conversion_exit_alpha_input.htm} for details
                                 */
                                pad: {
                                    /**
                                     * Padding condition:
                                     * undefined: Pad without condition
                                     * "Numeric": Pad if the value is numeric
                                     */
                                    condition: "Numeric",
                                    /**
                                     * Padding position:
                                     * "Left": Left padding
                                     * "Right": Right padding
                                     */
                                    position: "Left",
                                    /**
                                     * Padding character.
                                     */
                                    char: "0"
                                }
                            },
                            STRAS: {
                                sapField: "STRAS",
                                maxValueLength: 35
                            },
                            PFACH: {
                                sapField: "PFACH",
                                maxValueLength: 10,
                                textCase: "Upper"
                            },
                            ORT01: {
                                sapField: "ORT01",
                                maxValueLength: 35
                            },
                            PSTLZ: {
                                sapField: "PSTLZ",
                                maxValueLength: 10,
                                textCase: "Upper"
                            },
                            REGIO: {
                                sapField: "REGIO",
                                maxValueLength: 3,
                                textCase: "Upper"
                            },
                            LAND1: {
                                sapField: "LAND1",
                                maxValueLength: 3,
                                textCase: "Upper"
                            }
                        },
                        /**
                         * List of form fields participated to form the query filter.
                         * It should include all fields that are used in the "Customer filter" property of the database combo box control.
                         * It should also include all search fields added into database combo box control by AddSearchField function.
                         * @type string[]
                         */
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "Name__",
                            "Number__"
                        ],
                        /**
                         * List of field formatters applied on the query result
                         * The list is in a key-value format.
                         * The key is the name of the form field to format.
                         * The value is the formatting function called for each query result value. The function receives as argument the field value to format.
                            */
                        fieldFormatters: {
                            /**
                             * Trim vendor number leading zero. See [CONVERSION_EXIT_ALPHA_OUTPUT SAP Function module]
                             * {@link http://www.se80.co.uk/sapfms/c/conv/conversion_exit_alpha_output.htm} for details
                             */
                            Number__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        /**
                         * For auto-completion, indicates the form field to auto-complete.
                         * @type string
                            */
                        autoCompletionFFField: "Name__",
                        attName: "Number__=",
                        attSize: 10,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                var customFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetVendorCustomFields");
                if (customFields) {
                    Sys.Helpers.Array.ForEach(customFields, function (field) {
                        if (field.nameInSAP) {
                            sapConfigForVendor.sapField2FFFieldMapping[field.nameInSAP] = field.nameInTable;
                        }
                    });
                }
                /**
                 * Config used by Sys.ERP.SAP.Browse.SapQuery for cost center browsing in SAP
                 */
                sapConfigForCostCenter =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "M_KOSTN",
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            KOST1: "CostCenter__",
                            MCTXT: "Description__",
                            SPRAS: "SPRAS"
                        },
                        sapSearchFields: {
                            KOST1: {
                                sapField: "KOST1",
                                maxValueLength: 10,
                                pad: {
                                    condition: "Numeric",
                                    position: "Left",
                                    char: "0"
                                }
                            },
                            MCTXT: {
                                sapField: "MCTXT",
                                maxValueLength: 20,
                                textCase: "Upper"
                            }
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "CostCenter__",
                            "Description__"
                        ],
                        fieldFormatters: {
                            CostCenter__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        /**
                         * Callback function called before query. It is useful for customize specific search.
                         * Here, queryResult is the query result returned by sapConfigForTaxCode and we should use it (Tax codes and Procedure) to form search filter.
                         */
                        sapFilterBuilder: function (queryResult) {
                            var filterDate;
                            var erpPostingDate = Variable.GetValueAsString("ERPPostingDate");
                            if (!erpPostingDate) {
                                filterDate = new Date();
                            }
                            else {
                                filterDate = new Date(erpPostingDate);
                            }
                            filterDate = Sys.Helpers.Date.Date2RfcReadTableDate(filterDate);
                            Variable.SetValueAsString("ERPPostingDate", "");
                            var additionalFilter = null;
                            if (queryResult && queryResult.Records && queryResult.Records.length > 0) {
                                additionalFilter = "(";
                                var indexOfFieldKey_1 = queryResult.RecordsDefinition[this.ffFieldKey.toUpperCase()];
                                Sys.Helpers.Array.ForEach(queryResult.Records, function (record) {
                                    if (additionalFilter !== "(") {
                                        additionalFilter += " OR ";
                                    }
                                    additionalFilter += " KOST1 = '" + record[indexOfFieldKey_1] + "'";
                                });
                                additionalFilter += ")";
                            }
                            return "DATAB <= '" + filterDate + "' AND DATBI >= '" + filterDate + "'" +
                                (additionalFilter ? " AND " + additionalFilter : "");
                        },
                        ffFieldKey: "CostCenter__",
                        languageDependent: true,
                        isAOneTableQuery: true,
                        languageToUse: sapQueryLanguage,
                        autoCompletionFFField: "Description__",
                        attName: "CostCenter__=",
                        attSize: 10,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null,
                    };
                /**
                 * Config used by Sys.ERP.SAP.Browse.SapQuery for WBSElement browsing in SAP
                 */
                sapConfigForWBSElement =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "PRPS",
                        sapField2FFFieldMapping: {
                            PBUKR: "CompanyCode__",
                            POSID: "WBSElement__",
                            POST1: "Description__",
                            PSPNR: "WBSElementID__"
                        },
                        sapSearchFields: {
                            PBUKR: "PBUKR",
                            POSID: "POSID",
                            POST1: "POST1",
                            PSPNR: "PSPNR"
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "WBSElement__",
                            "Description__",
                            "WBSElementID__"
                        ],
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                /**
                 * Config used by Sys.ERP.SAP.Browse.SapQuery for InternalOrder browsing in SAP
                 */
                sapConfigForInternalOrder =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "COAS",
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            AUFNR: "InternalOrder__",
                            KTEXT: "Description__"
                        },
                        sapSearchFields: {
                            BUKRS: "BUKRS",
                            AUFNR: {
                                sapField: "AUFNR",
                                maxValueLength: 12,
                                pad: {
                                    condition: "Numeric",
                                    position: "Left",
                                    char: "0"
                                }
                            },
                            KTEXT: "KTEXT"
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "InternalOrder__",
                            "Description__"
                        ],
                        fieldFormatters: {
                            InternalOrder__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        sapSearchValueFormatters: {
                            AUFNR: Sys.Helpers.String.SAP.GetNumberIDNormalizer(12)
                        },
                        attName: "InternalOrder__=",
                        attSize: 12
                    };
                sapConfigForTaxCodeDescription =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "T007S",
                        sapField2FFFieldMapping: {
                            MWSKZ: "TaxCode__",
                            TEXT1: "Description__",
                            SPRAS: "SPRAS"
                        },
                        sapSearchFields: {
                            TEXT1: "TEXT1"
                        },
                        /**
                         * Fields listed in ffFieldsInCustomFilter will be added, in addition to the filter returned by sapFilterBuilder, in the final search filter.
                         */
                        ffFieldsInCustomFilter: [
                            "Description__"
                        ],
                        /**
                         * Callback function called before query. It is useful for customize specific search.
                         * Here, queryResult is the query result returned by sapConfigForTaxCode and we should use it (Tax codes and Procedure) to form search filter.
                         */
                        sapFilterBuilder: function (queryResult) {
                            var filter = "";
                            if (queryResult && queryResult.Records) {
                                for (var i = 0; i < queryResult.Records.length; i++) {
                                    filter += "| OR MWSKZ = '" + queryResult.GetQueryValue("TAXCODE__", i) + "'";
                                }
                                if (filter) {
                                    filter = "( " + filter.substr(5) + " )| AND ";
                                }
                                filter = "( " + filter + "KALSM = '" + queryResult.GetQueryValue("Description__", 0) + "' )";
                            }
                            return filter;
                        },
                        /**
                         * Only used in sub config, it is the field allowing to identify the same record returned by sapConfigForTaxCode and this sub config for merging.
                         */
                        ffFieldKey: "TaxCode__",
                        /**
                         * This query should only return result in user connected language.
                         */
                        languageDependent: true,
                        languageToUse: sapQueryLanguage,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null,
                    };
                /**
                 * Config used by Sys.ERP.SAP.Browse.SapQuery for tax code browsing in SAP
                 */
                sapConfigForTaxCode =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "ZESK_TAXCODES",
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            MWSKZ: "TaxCode__",
                            /**
                             * Tax description is not in this SAP table; we should join another SAP table to get it.
                             * To do this, select any unused SAP field in this table (here KALSM) and associate it with an appropriate sub config (sapConfigForTaxCodeDescription).
                             * Here, we chose KALSM for 2 purposes, firstly to get from SAP it's value then use it in sub config to form the correct filter
                             *  (see sapConfigForTaxCodeDescription.sapFilterBuilder).
                             */
                            KALSM: {
                                ffField: "Description__",
                                sapConfig: sapConfigForTaxCodeDescription
                            }
                        },
                        sapSearchFields: {
                            /**
                             * Here, only Tax code search definition is necessary.
                             * Tax description is obtained from sapConfigForTaxCodeDescription, so instead of define it here, it will be described in sapConfigForTaxCodeDescription.
                             */
                            MWSKZ: {
                                sapField: "MWSKZ",
                                maxValueLength: 2,
                                /**
                                 * Search text can be converted to "Upper", "Lower" or let case "Sensitive" before searching.
                                 * Tax code is always upper case.
                                 * @type string
                                 */
                                textCase: "Upper"
                            }
                        },
                        ffFieldsInCustomFilter: [
                            /**
                             * Here, only Company code and Tax code are necessary.
                             * Tax description is obtained from sapConfigForTaxCodeDescription, so instead of list
                             * it here, it will be described in sapConfigForTaxCodeDescription.
                             */
                            "CompanyCode__",
                            "TaxCode__"
                        ],
                        autoCompletionFFField: "TaxCode__",
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null,
                    };
                sapConfigForChartOfAccounts =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "T001",
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            KTOPL: "KTOPL"
                        },
                        sapFilterBuilder: function (queryResult) {
                            var companyCode = queryResult ? queryResult.GetQueryValue("CompanyCode__", 0) : null;
                            return companyCode ? "BUKRS = '" + companyCode + "'" : null;
                        },
                        ldapFilterBuilder: function (queryResult, ldapFilter) {
                            var companyCode = queryResult ? queryResult.GetQueryValue("CompanyCode__", 0) : null;
                            return companyCode ? "(CompanyCode__=" + companyCode + ")" : ldapFilter;
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__"
                        ],
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                /**
                 * Config used by Sys.ERP.SAP.Browse.SapQuery for browsing glaccount description
                 */
                sapConfigForGlAccountDescription =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "SKAT",
                        sapField2FFFieldMapping: {
                            SAKNR: "Account__",
                            TXT50: "Description__"
                        },
                        sapSearchFields: {
                            SAKNR: "SAKNR",
                            TXT50: {
                                sapField: "MCOD1",
                                maxValueLength: 25
                            }
                        },
                        ffFieldsInCustomFilter: [
                            "Account__",
                            "Description__"
                        ],
                        sapSearchValueFormatters: {
                            SAKNR: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10)
                        },
                        sapExtraFields: {
                            KTOPL: sapConfigForChartOfAccounts
                        },
                        ffFieldKey: "Account__",
                        languageDependent: true,
                        languageToUse: sapQueryLanguage,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null
                    };
                /**
                 * Using BAPI, it is the config used by Sys.ERP.SAP.Browse.SapQuery for getting glaccount description
                 * This is the prefered config for getting 1 description
                 */
                bapiConfigForGlAccountDescription =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapQueryMethod: {
                            type: "BAPI",
                            name: "BAPI_GL_ACC_GETDETAIL"
                        },
                        sapSearchFields: {
                            COMPANYCODE: "CompanyCode__",
                            GLACCT: "Account__"
                        },
                        sapSearchValueFormatters: {
                            GLACCT: Sys.Helpers.String.SAP.GetNumberIDNormalizer(10)
                        },
                        bapiResultDefinition: {
                            Headers: {
                                ACCOUNT_DETAIL: {
                                    GL_ACCOUNT: "Account__",
                                    LONG_TEXT: "Description__",
                                    SHORT_TEXT: "ShortDescription__"
                                }
                            }
                        },
                        ffFieldKey: "Account__",
                        languageDependent: true,
                        languageToUse: sapQueryLanguage,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null,
                        querySAPWSLanguageHandler: Lib.AP.SAP.UsesWebServices() ? Lib.AP.SAP.SAPGetISOLanguage : null
                    };
                /**
                 * Using BAPI, it is the config used by Sys.ERP.SAP.Browse.SapQuery for glaccount list browsing in SAP
                 */
                bapiConfigForGlAccountList =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                         * Enable/disable BAPI result local cache
                         * @type boolean
                         */
                        useSAPBapiLocalCache: true,
                        /**
                         * Indicates SAP query method.
                         */
                        sapQueryMethod: {
                            /**
                             * This config uses BAPI method
                             */
                            type: "BAPI",
                            /**
                             * BAPI method name. See http://www.se80.co.uk/sapfms/b/bapi/bapi_gl_acc_getlist.htm
                             */
                            name: "BAPI_GL_ACC_GETLIST"
                        },
                        /**
                         * Description of the SAP fields to search. It should match all search fields added to the database combo box control by the AddSearchField function.
                         * The list, often BAPI EXPORTING members, is in a key-value format.
                         * The key represents the BAPI EXPORTING member.
                         * The value represents the corresponding form field. It can directly designate a field such as COMPANYCODE: "CompanyCode__", or use a complex struct to describe the field.
                         */
                        sapSearchFields: {
                            /**
                             * BAPI_GL_ACC_GETLIST EXPORTING member
                             */
                            COMPANYCODE: "CompanyCode__",
                            /**
                             * GL_ACCOUNT is not BAPI_GL_ACC_GETLIST EXPORTING member, it is in fact a BAPI IMPORTING member,
                             *  and will constitute a filter applied on the result returned by the BAPI calling to return only matched result.
                             * Here, the corresponding field is bapiResultDefinition.Tables.ACCOUNT_LIST.GL_ACCOUNT.
                             */
                            GL_ACCOUNT: {
                                ffField: "Account__",
                                /**
                                 * Indicates that this is not a BAPI EXPORTING member. It will constitute a filter applied on the result returned by the BAPI calling to return only matched result.
                                 */
                                notBapiParam: true,
                                maxValueLength: 10,
                                pad: {
                                    condition: "Numeric",
                                    position: "Left",
                                    char: "0"
                                }
                            },
                            LONG_TEXT: {
                                ffField: "Description__",
                                notBapiParam: true
                            }
                        },
                        /**
                         * Result struct returned by this BAPI calling
                         */
                        bapiResultDefinition: {
                            /**
                             * The description of the interested members in TABLES of the BAPI function, in a key-value format.
                             * The key represents the interested BAPI TABLES member.
                             * The value contains the mapping between this BAPI TABLES and form fields.
                             */
                            Tables: {
                                /**
                                 * The fields we are interested in are in ACCOUNT_LIST
                                 */
                                ACCOUNT_LIST: {
                                    GL_ACCOUNT: "Account__",
                                    LONG_TEXT: "Description__",
                                    GROUP__: "Group__" // completed by querying in local Expense category table
                                }
                            }
                        },
                        fieldFormatters: {
                            /**
                             * Trim account number leading zero.
                             */
                            Account__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        languageDependent: true,
                        languageToUse: sapQueryLanguage,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null,
                        querySAPWSLanguageHandler: Lib.AP.SAP.UsesWebServices() ? Lib.AP.SAP.SAPGetISOLanguage : null
                    };
                /**
                 * Config used by Sys.ERP.SAP.Browse.SapQuery for glaccount list browsing in SAP
                 */
                sapConfigForGlAccountList =
                    {
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        sapTableName: "SKB1",
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            SAKNR: "Account__",
                            WAERS: {
                                ffField: "Description__",
                                sapConfig: sapConfigForGlAccountDescription
                            }
                        },
                        sapSearchFields: {
                            SAKNR: "SAKNR"
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "Account__"
                        ],
                        fieldFormatters: {
                            Account__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                        },
                        ffFieldKey: "Account__",
                        autoCompletionFFField: "Account__",
                        attName: "Account__=",
                        attSize: 10
                    };
                /**
                 * Config used by Sys.ERP.SAP.Browse.SapQuery for payment terms browsing in SAP
                 */
                sapConfigForPaymentTerms =
                    {
                        /**
                         * Name of SAP configuration
                         */
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                         * Name of SAP Table to query
                         */
                        sapTableName: "T052U",
                        /**
                         * Mapping between SAP fields and this form fields
                         */
                        sapField2FFFieldMapping: {
                            ZTERM: "PaymentTermCode__",
                            TEXT1: "Description__",
                            SPRAS: "SPRAS"
                        },
                        /**
                         * List of SAP fields to search
                         */
                        sapSearchFields: {
                            ZTERM: {
                                sapField: "ZTERM",
                                maxValueLength: 4,
                                textCase: "Upper"
                            },
                            TEXT1: "TEXT1"
                        },
                        ffFieldsInCustomFilter: [
                            //"CompanyCode__",
                            "PaymentTermCode__",
                            "Description__"
                        ],
                        /**
                         * Field to search for autocompletion
                         */
                        autoCompletionFFField: "PaymentTermCode__",
                        ffFieldKey: "PaymentTermCode__",
                        languageDependent: true,
                        isAOneTableQuery: true,
                        languageToUse: sapQueryLanguage,
                        querySAPWSHandler: Lib.AP.SAP.UsesWebServices() ? Lib.P2P.SAP.Soap.Client.GetWSQueryHandler : null,
                    };
                sapConfigForGoodIssueHeaders =
                    {
                        /**
                         * Name of SAP configuration
                         */
                        sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                        /**
                         * Name of SAP Table to query
                         */
                        sapTableName: "RKWA",
                        /**
                         * Mapping between SAP fields and this form fields
                         */
                        sapField2FFFieldMapping: {
                            BUKRS: "CompanyCode__",
                            MBLNR: "GoodIssueNumber__",
                            LIFNR: "VendorNumber__",
                            BELNR: "SettlementNumber__",
                            BLDAT: "GoodIssueDate__",
                            WRBTR: "GoodIssueAmount__"
                        },
                        sapAdditionalFields: {
                            BUKRS: "CompanyCode__"
                        },
                        /**
                         * List of SAP fields to search
                         */
                        sapSearchFields: {
                            MBLNR: "MBLNR",
                            LIFNR: {
                                sapField: "LIFNR",
                                maxValueLength: 10,
                                /**
                                 * Padding description. See [CONVERSION_EXIT_ALPHA_INPUT SAP Function module]{@link http://www.se80.co.uk/sapfms/c/conv/conversion_exit_alpha_input.htm} for details
                                 */
                                pad: {
                                    /**
                                     * Padding condition:
                                     * undefined: Pad without condition
                                     * "Numeric": Pad if the value is numeric
                                     */
                                    condition: "Numeric",
                                    /**
                                     * Padding position:
                                     * "Left": Left padding
                                     * "Right": Right padding
                                     */
                                    position: "Left",
                                    /**
                                     * Padding character.
                                     */
                                    char: "0"
                                }
                            },
                            BELNR: "BELNR"
                        },
                        resultFormatter: function (records /*, recordsDefinition: ESKMap<string>*/) {
                            var newRecords = [];
                            records.sort(function (a, b) {
                                return a[0].localeCompare(b[0]);
                            });
                            var amount = 0.00;
                            var currentGI = "", currentSN = "";
                            var index = -1;
                            Sys.Helpers.Array.ForEach(records, function (current) {
                                if (currentGI && currentGI === current[0]) {
                                    amount += parseFloat(current[4]);
                                    if (currentSN === "") {
                                        currentSN = current[2];
                                    }
                                }
                                else if (currentGI && currentGI !== current[0]) {
                                    newRecords[index][4] = amount.toFixed(2);
                                    newRecords[index][2] = currentSN;
                                    currentGI = "";
                                }
                                if (currentGI === "") {
                                    newRecords.push(current);
                                    index++;
                                    currentGI = current[0];
                                    currentSN = current[2];
                                    amount = parseFloat(current[4]);
                                }
                            });
                            if (newRecords[index]) {
                                newRecords[index][4] = amount.toFixed(2);
                                newRecords[index][2] = currentSN;
                            }
                            return newRecords;
                        },
                        sapFilterBuilder: function (queryResult, ldapFilter) {
                            var filter = null;
                            var beginDate = (Sys.ERP.SAP.Browse.ExtractFieldValue(ldapFilter, "BeginDate__") || "").replace(/-/g, "");
                            var endDate = (Sys.ERP.SAP.Browse.ExtractFieldValue(ldapFilter, "EndDate__") || "").replace(/-/g, "");
                            if (beginDate && endDate) {
                                filter = "BLDAT >= '" + beginDate + "' AND BLDAT <= '" + endDate + "'";
                            }
                            else if (beginDate) {
                                filter = "BLDAT >= '" + beginDate + "'";
                            }
                            else if (endDate) {
                                filter = "BLDAT <= '" + endDate + "'";
                            }
                            return filter;
                        },
                        /**
                         * List of field formatters applied on the query result
                         * The list is in a key-value format.
                         * The key is the name of the form field to format.
                         * The value is the formatting function called for each query result value. The function receives as argument the field value to format.
                            */
                        fieldFormatters: {
                            GoodIssueDate__: Sys.Helpers.SAP.ConvertSapDate,
                            VendorNumber__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                            GoodIssueAmount__: Language.FormatNumber
                        },
                        ffFieldsInCustomFilter: [
                            "CompanyCode__",
                            "GoodIssueNumber__",
                            "VendorNumber__",
                            "SettlementNumber__",
                            "GoodIssueDate__"
                        ],
                        ffFieldKey: "GoodIssueNumber__",
                        languageDependent: false
                    };
            }
            Browse.selectedUser = null;
            /**
            * This function will open a popup to choose an user.
            *
            * @param {string} title browse dialog title, default is "_Approver Information".
            * @param {Array} specificButtons array of objects of specific user buttons to add as an. The userButton object is object{id, label, user{displayName, login, emailAddress}}
            * @param {Array} extraFilter filter for the ODUSER query. Ex : if you want to only have the account user, use ["Vendor=0","Customer=0"]
            * @param {boolean} autoAddAsterisk
            * @param {string} [businessUnit] optional parameteres to filter user according to a defined business unit
            */
            function BrowseUsers(title, specificButtons, extraFilter, autoAddAsterisk, businessUnit) {
                var browseTitle = title ? title : "_Approver Information";
                var tableName = "ODUSER";
                var searchControlFocused = false;
                var dialog = null;
                var rowcountperpage = 10; // Number of records per Page
                var rowcount = 20; // Maximum of records retrieved by the query
                var searchAtOpening = true; // To perform a search when the browse dialog is opening
                var localSelectedUser = null;
                // Column configuration
                var columns = [];
                columns.push({ id: "DISPLAYNAME", label: "_Name", type: "STR", width: 300 });
                columns.push({ id: "LOGIN", label: "_Login", type: "STR", width: 300 });
                columns.push({ id: "EMAILADDRESS", label: "_Email", type: "STR", width: 300 });
                columns.push({ id: "ISGROUP", type: "STR", hidden: true });
                function ModifyExtraFilterToExcludeLockedUsers() {
                    if (!extraFilter) {
                        extraFilter = [];
                    }
                    else if (!Sys.Helpers.IsArray(extraFilter)) {
                        // extraFilter is truthy, but not an array, so we wrap the current filter in an array so that we can add the AccountLocked filter
                        extraFilter = [extraFilter];
                    }
                    extraFilter.push("(|(ACCOUNTLOCKED=0)(!(ACCOUNTLOCKED=*)))");
                }
                // Search criterion configuration
                var searchCriterias = [];
                searchCriterias.push({ id: "NameFilter__", label: "_Name", required: false, toUpper: false, visible: true, filterId: "DISPLAYNAME", defaultValue: "", defaultValueFormat: autoAddAsterisk ? Sys.Helpers.Browse.AutoAddAsterisk : undefined });
                searchCriterias.push({ id: "LoginFilter__", label: "_Login", required: false, toUpper: false, visible: true, filterId: "LOGIN", defaultValue: "", defaultValueFormat: autoAddAsterisk ? Sys.Helpers.Browse.AutoAddAsterisk : undefined });
                /* CALLBACKS */
                // Perform request
                function Request() {
                    Sys.Helpers.Browse.DBRequest(QuerySuccessCallBack, dialog, columns, searchCriterias, tableName, rowcount, extraFilter, false, businessUnit);
                }
                // Called when the query is completed
                function QuerySuccessCallBack() {
                    var callbackResult = this;
                    Sys.Helpers.Browse.CompletedCallBack(dialog, callbackResult);
                    if (Sys.Helpers.Browse.FillTableFromQueryResult(dialog, "resultTable", callbackResult)) {
                        Sys.Helpers.Browse.HideResults(dialog, false);
                    }
                }
                /* Draw and display the browse page */
                function FillSearchDialog(newDialog) {
                    var iSpecificButton, specificButton;
                    dialog = newDialog;
                    var extendedButtons;
                    if (specificButtons) {
                        extendedButtons = [];
                        for (iSpecificButton = 0; iSpecificButton < specificButtons.length; iSpecificButton++) {
                            specificButton = specificButtons[iSpecificButton];
                            extendedButtons.push({ id: specificButton.id, label: specificButton.label });
                        }
                    }
                    Sys.Helpers.Browse.FillSearchDialog(newDialog, columns, searchCriterias, rowcount, rowcountperpage, "", false, false, undefined, extendedButtons);
                    if (specificButtons) {
                        for (iSpecificButton = 0; iSpecificButton < specificButtons.length; iSpecificButton++) {
                            specificButton = specificButtons[iSpecificButton];
                            Sys.Helpers.Browse.AddCustomEventHandle("OnClick", specificButton.id, CreateCustomCB(specificButton));
                        }
                    }
                    if (searchAtOpening) {
                        Request();
                    }
                }
                function CreateCustomCB(specificButton) {
                    return function () {
                        Log.Info("OnClick " + specificButton.id);
                        localSelectedUser = specificButton.user;
                        dialog.Cancel();
                    };
                }
                /* Handle event in browse page */
                function HandleSearchDialog(handleDialog, action, event, control, tableItem) {
                    if (event === "OnRefreshRow") {
                        var table = control;
                        var row = table.GetRow(tableItem);
                        if (row) {
                            row.DISPLAYNAME.SetImageURL(Lib.P2P.GetP2PUserImage(row.ISGROUP.GetValue()), true);
                        }
                    }
                    searchControlFocused = Sys.Helpers.Browse.HandleSearchDialog(handleDialog, action, event, control, tableItem, searchControlFocused, Request, ReturnSelection);
                }
                /* Update the main form with the user selection */
                function ReturnSelection(control, tableItem) {
                    if (tableItem.LOGIN.GetValue()) {
                        localSelectedUser = {
                            displayName: tableItem.DISPLAYNAME.GetValue(),
                            login: tableItem.LOGIN.GetValue(),
                            emailAddress: tableItem.EMAILADDRESS.GetValue()
                        };
                        dialog.Cancel();
                    }
                }
                ModifyExtraFilterToExcludeLockedUsers();
                return Sys.Helpers.Promise.Create(function (resolve) {
                    Popup.Dialog(browseTitle, null, FillSearchDialog, null, null, HandleSearchDialog, function () {
                        resolve(localSelectedUser);
                    });
                });
            }
            Browse.BrowseUsers = BrowseUsers;
            /**
            * This function will open a popup to select an approver with an associated comment.
            *
            * @param {string} initial comment to display in the popup
            * @param {function} onCommitCallback called when an approver is selected and confirmed.
                    Parameter of the callback: the selected approver as an object{displayName, login, emailAddress} and the new comment.
            * @param {boolean} the selection begins with a popup to choose an approver
            * @param {boolean} the comment in dialog is required
            * @param {object} the texts in dialog , object{title, role, description, confirmation, browseTitle}
            */
            function AddApprover(comment, onCommitCallback, commentRequired, dialogTexts) {
                var localSelectedUser = Lib.P2P.Browse.selectedUser;
                var defaultDialogTexts = {
                    title: "_Add approver",
                    role: "_Approver",
                    description: "_Add approver description",
                    confirmation: "_Add approver confirm message",
                    browseTitle: "_Approver Information"
                };
                if (!dialogTexts) {
                    dialogTexts = defaultDialogTexts;
                }
                else {
                    for (var att in defaultDialogTexts) {
                        if (!(att in dialogTexts)) {
                            dialogTexts[att] = defaultDialogTexts[att];
                        }
                    }
                }
                Popup.Dialog(dialogTexts.title, null, fillInsertApproverDialog, commitInsertApproverDialog, null, handleInsertApproverDialog);
                function fillInsertApproverDialog(dialog /*, tabId, event, control*/) {
                    var descCtrl = dialog.AddDescription("desc", dialogTexts.description_label, dialogTexts.description_size);
                    descCtrl.SetText(dialogTexts.description);
                    var fieldData = {
                        "TableName": "ODUSER",
                        "SortOrder": "ASC",
                        "DisplayedColumns": "DisplayName|Login|EmailAddress",
                        "SavedColumn": "DisplayName",
                        "CustomFilter": "(&(|(ACCOUNTLOCKED=0)(!(ACCOUNTLOCKED=*)))(Customer=0)(Vendor=0))",
                        "BrowseTitle": dialogTexts.browseTitle
                    };
                    var approverCtrl = dialog.AddDatabaseComboBox("approver", dialogTexts.role, 378, fieldData);
                    approverCtrl.AddSearchField({ type: "Text", label: "_Name", id: "DisplayName" });
                    approverCtrl.AddSearchField({ type: "Text", label: "_Login", id: "Login" });
                    approverCtrl.SetSearchMode("contains");
                    approverCtrl.SetPrefillResult(true);
                    approverCtrl.SetImageColumn("DisplayName", {
                        "IsGroup": [{ value: "1", imageUrl: Lib.P2P.GetP2PUserImage(true) }], "defaultImageUrl": Lib.P2P.GetP2PUserImage(false)
                    }, 18);
                    dialog.RequireControl(approverCtrl);
                    var commentCtrl = dialog.AddMultilineText("comment", "_Comment", 400);
                    if (commentRequired) {
                        dialog.RequireControl(commentCtrl);
                    }
                    commentCtrl.SetValue(comment);
                    var confCtrl = dialog.AddDescription("conf", dialogTexts.confirmation_label, dialogTexts.confirmation_size);
                    if (localSelectedUser) {
                        approverCtrl.SetValue(localSelectedUser.displayName);
                        confCtrl.SetText(dialogTexts.confirmation, localSelectedUser.displayName);
                    }
                    else {
                        confCtrl.Hide();
                    }
                }
                function handleInsertApproverDialog(dialog, tabId, event, control, item) {
                    if (event === "OnSelectItem" && control.GetName() === "approver" && item) {
                        localSelectedUser =
                            {
                                login: item.GetValue("login"),
                                displayName: item.GetValue("displayName"),
                                emailAddress: item.GetValue("emailAddress")
                            };
                        var confCtrl = dialog.GetControl("conf");
                        confCtrl.SetText(dialogTexts.confirmation, localSelectedUser.displayName);
                        confCtrl.Hide(false);
                    }
                }
                function commitInsertApproverDialog(dialog /*, tabId, event, control*/) {
                    Lib.P2P.Browse.selectedUser = localSelectedUser;
                    onCommitCallback(localSelectedUser, dialog.GetControl("comment").GetValue());
                }
            }
            Browse.AddApprover = AddApprover;
            function GetBrowseERPName() {
                var erp = Lib.ERP.GetERPName();
                if (erp) {
                    return Sys.Parameters.GetInstance("P2P_" + erp).GetParameter("BrowseMasterDataFromERP") ? Lib.ERP.GetERPName() : null;
                }
                return null;
            }
            Browse.GetBrowseERPName = GetBrowseERPName;
            function Init(parameterInstance, tableName, erpInvoiceInstance) {
                if (tableName === void 0) { tableName = "LineItems__"; }
                var isPAC = parameterInstance === "PAC";
                var isSAP = this.GetBrowseERPName() === "SAP";
                var parentControl = Controls[tableName];
                var costCenterControl = parentControl.ItemCostCenterName__ || parentControl.CostCenter__;
                var WBSElement = parentControl.WBSElement__ || parentControl.WBSElementID__;
                var InternalOrder = parentControl.InternalOrder__;
                var taxCodeCtrl = parentControl.TaxCode__ === undefined ? parentControl.ItemTaxCode__ : parentControl.TaxCode__;
                var glAccountCtrl = parentControl.GLAccount__ === undefined ? parentControl.ItemGLAccount__ : parentControl.GLAccount__;
                var vendorNameCtrl = Controls.VendorName__ === undefined || (Lib.P2P.IsPR() && !Lib.Purchasing.Vendor.IsSingleVendorMode()) ? parentControl.VendorName__ : Controls.VendorName__;
                var vendorNumberCtrl = Controls.VendorNumber__ === undefined || (Lib.P2P.IsPR() && !Lib.Purchasing.Vendor.IsSingleVendorMode()) ? parentControl.VendorNumber__ : Controls.VendorNumber__;
                var storedInLocalTableFields = erpInvoiceInstance ? erpInvoiceInstance.GetStoredInLocalTableFields() : null;
                if (IsBrowseControl(costCenterControl)) {
                    costCenterControl.ClearSearchFields();
                    costCenterControl.SetAllowTableValuesOnly(isPAC || (storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.LineItems__.CostCenter__)));
                }
                if (IsBrowseControl(vendorNameCtrl)) {
                    vendorNameCtrl.ClearSearchFields();
                    vendorNameCtrl.SetAllowTableValuesOnly(isPAC || (storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.Header.VendorName__)));
                }
                if (IsBrowseControl(vendorNumberCtrl)) {
                    vendorNumberCtrl.ClearSearchFields();
                    vendorNumberCtrl.SetAllowTableValuesOnly(isPAC || (storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.Header.VendorNumber__)));
                }
                if (IsBrowseControl(taxCodeCtrl)) {
                    taxCodeCtrl.ClearSearchFields();
                    if (!Lib.AP.TaxHelper.useMultipleTaxes()) {
                        taxCodeCtrl.SetAllowTableValuesOnly(isPAC || (storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.LineItems__.TaxCode__)));
                    }
                    else {
                        taxCodeCtrl.SetAllowTableValuesOnly(false);
                    }
                }
                if (IsBrowseControl(glAccountCtrl)) {
                    glAccountCtrl.ClearSearchFields();
                    glAccountCtrl.SetAllowTableValuesOnly(isPAC || (storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.LineItems__.GLAccount__)));
                }
                if (IsBrowseControl(Controls.PaymentTermCode__)) {
                    Controls.PaymentTermCode__.ClearSearchFields();
                    Controls.PaymentTermCode__.SetAllowTableValuesOnly(isPAC || (storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.Header.PaymentTermCode__)));
                    Controls.PaymentTermCode__.SetSearchMode("contains");
                }
                if (IsBrowseControl(Controls.GoodIssue__)) {
                    Controls.GoodIssue__.ClearSearchFields();
                    Controls.GoodIssue__.SetAllowTableValuesOnly(storedInLocalTableFields && storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.Header.GoodIssue__));
                }
                if (isSAP) {
                    InitSAPVariable(parameterInstance);
                    var queryForCheck = isPAC ? Sys.ERP.SAP.Browse.SapQuery : null;
                    if (IsBrowseControl(costCenterControl)) {
                        if (!isPAC) {
                            costCenterControl.AddSearchField("CostCenter__");
                            costCenterControl.AddSearchField("Description__");
                        }
                        costCenterControl.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, queryForCheck, queryForCheck, sapConfigForCostCenter);
                    }
                    if (IsBrowseControl(WBSElement)) {
                        WBSElement.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, queryForCheck, queryForCheck, sapConfigForWBSElement);
                        WBSElement.ClearSearchFields();
                        WBSElement.SetAllowTableValuesOnly(!isSAP);
                    }
                    if (IsBrowseControl(InternalOrder)) {
                        InternalOrder.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, queryForCheck, queryForCheck, sapConfigForInternalOrder);
                        InternalOrder.ClearSearchFields();
                        InternalOrder.SetAllowTableValuesOnly(!isSAP);
                    }
                    var configVendor = isPAC ? Lib.P2P.Browse.GetSapConfigForVendor("PaymentTermCode__.Description__") : sapConfigForVendor;
                    if (IsBrowseControl(vendorNameCtrl)) {
                        vendorNameCtrl.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, queryForCheck, queryForCheck, configVendor);
                        vendorNameCtrl.AddSearchField("Name__");
                        vendorNameCtrl.AddSearchField("Number__");
                    }
                    if (IsBrowseControl(vendorNumberCtrl)) {
                        vendorNumberCtrl.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, queryForCheck, queryForCheck, configVendor);
                        vendorNumberCtrl.AddSearchField("Number__");
                        vendorNumberCtrl.AddSearchField("Name__");
                    }
                    if (IsBrowseControl(taxCodeCtrl) && !isPAC) {
                        taxCodeCtrl.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigForTaxCode);
                        taxCodeCtrl.AddSearchField("TaxCode__");
                        taxCodeCtrl.AddSearchField("Description__");
                    }
                    if (IsBrowseControl(glAccountCtrl)) {
                        var queryGlAccountForCheck = isPAC ? QueryGlAccountWithGroup : null;
                        glAccountCtrl.SetCustomQuery(QueryGlAccountWithGroup, queryGlAccountForCheck, queryGlAccountForCheck, bapiConfigForGlAccountList);
                        glAccountCtrl.AddSearchField("Account__");
                        glAccountCtrl.AddSearchField("Description__");
                    }
                    if (IsBrowseControl(Controls.PaymentTermCode__)) {
                        Controls.PaymentTermCode__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, queryForCheck, queryForCheck, sapConfigForPaymentTerms);
                        Controls.PaymentTermCode__.AddSearchField("PaymentTermCode__");
                    }
                    if (IsBrowseControl(Controls.GoodIssue__)) {
                        Controls.GoodIssue__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, sapConfigForGoodIssueHeaders);
                        var vendorFunction = function (newField) {
                            newField.SetValue(Controls.VendorNumber__.GetValue());
                            newField.SetReadOnly(true);
                        };
                        Controls.GoodIssue__.AddSearchField({ type: "Text", label: "VendorNumber__", id: "VendorNumber__", customize: vendorFunction });
                        var settlementFunction = function (newField) {
                            var settlementNumber = Controls.ERPInvoiceNumber__.GetValue();
                            if (settlementNumber) {
                                var invoiceDocument = Lib.AP.ParseInvoiceDocumentNumber(settlementNumber, true);
                                var documentNumber = invoiceDocument.documentNumber;
                                newField.SetValue(documentNumber);
                            }
                            newField.SetReadOnly(true);
                        };
                        Controls.GoodIssue__.AddSearchField({ type: "Text", label: "SettlementNumber__", id: "SettlementNumber__", customize: settlementFunction });
                        Controls.GoodIssue__.AddSearchField("GoodIssueNumber__");
                        Controls.GoodIssue__.AddSearchField({ type: "Date", label: "GoodIssueBeginDate__", id: "BeginDate__" });
                        Controls.GoodIssue__.AddSearchField({ type: "Date", label: "GoodIssueEndDate__", id: "EndDate__" });
                        Controls.GoodIssue__.SetPrefillResult(false);
                    }
                }
                else {
                    if (IsBrowseControl(costCenterControl)) {
                        costCenterControl.SetCustomQuery();
                    }
                    if (IsBrowseControl(vendorNameCtrl)) {
                        vendorNameCtrl.SetCustomQuery();
                    }
                    if (IsBrowseControl(vendorNumberCtrl)) {
                        vendorNumberCtrl.SetCustomQuery();
                    }
                    if (IsBrowseControl(taxCodeCtrl)) {
                        taxCodeCtrl.SetCustomQuery();
                    }
                    if (IsBrowseControl(glAccountCtrl)) {
                        glAccountCtrl.SetCustomQuery();
                    }
                    if (IsBrowseControl(Controls.PaymentTermCode__)) {
                        Controls.PaymentTermCode__.SetCustomQuery();
                    }
                }
            }
            Browse.Init = Init;
            function GetSapConfigForCostCenterDescription(ffDescription) {
                var sapField2FFFieldMapping = Sys.Helpers.Extend({}, sapConfigForCostCenter.sapField2FFFieldMapping, {
                    MCTXT: ffDescription
                });
                return Sys.Helpers.Extend({}, sapConfigForCostCenter, { sapField2FFFieldMapping: sapField2FFFieldMapping });
            }
            Browse.GetSapConfigForCostCenterDescription = GetSapConfigForCostCenterDescription;
            function GetSapConfigForGlAccountDescription(ffAccount, ffDescription) {
                return Sys.Helpers.Extend({}, sapConfigForGlAccountDescription, {
                    sapField2FFFieldMapping: {
                        SAKNR: ffAccount,
                        TXT50: ffDescription,
                        SPRAS: "SPRAS"
                    },
                    ffFieldsInCustomFilter: [
                        ffAccount,
                        ffDescription
                    ],
                    ffFieldKey: ffAccount
                });
            }
            Browse.GetSapConfigForGlAccountDescription = GetSapConfigForGlAccountDescription;
            function GetSapConfigForVendor(ffPaymentTermDescription) {
                if (ffPaymentTermDescription) {
                    var paymentTermsField2FFFieldMapping = Sys.Helpers.Extend({}, sapConfigForPaymentTerms.sapField2FFFieldMapping, {
                        TEXT1: ffPaymentTermDescription
                    });
                    var paymentTermsConfig = Sys.Helpers.Extend({}, sapConfigForPaymentTerms, { sapField2FFFieldMapping: paymentTermsField2FFFieldMapping });
                    var vendorField2FFFieldMapping = Sys.Helpers.Extend({}, sapConfigForVendor.sapField2FFFieldMapping, {
                        NAME4: {
                            ffField: ffPaymentTermDescription,
                            sapConfig: paymentTermsConfig
                        }
                    });
                    return Sys.Helpers.Extend({}, sapConfigForVendor, { sapField2FFFieldMapping: vendorField2FFFieldMapping });
                }
                return sapConfigForVendor;
            }
            Browse.GetSapConfigForVendor = GetSapConfigForVendor;
            function GetSapConfigForPaymentTerms() {
                return sapConfigForPaymentTerms;
            }
            Browse.GetSapConfigForPaymentTerms = GetSapConfigForPaymentTerms;
            function GetSapConfigForGoodIssueHeaders() {
                return sapConfigForGoodIssueHeaders;
            }
            Browse.GetSapConfigForGoodIssueHeaders = GetSapConfigForGoodIssueHeaders;
            function GetSapConfigForTaxCode() {
                return sapConfigForTaxCode;
            }
            Browse.GetSapConfigForTaxCode = GetSapConfigForTaxCode;
            function GetCostCenterDescription(callback, companyCode, costCenter) {
                if (!companyCode || !costCenter) {
                    callback("");
                }
                else {
                    var filter_1 = "(&(CompanyCode__=" + companyCode + ")(CostCenter__=" + costCenter + "))";
                    if (this.GetBrowseERPName() === "SAP") {
                        var validityCheckCallBack_1 = function (lgIndepResult) {
                            if (lgIndepResult.GetQueryError() || lgIndepResult.GetQueryValue("Description__", 0) === null) {
                                // Could not find cost center even without language filter
                                callback(null);
                            }
                            else {
                                // Cost center is valid but is not maintained in the connection language
                                callback("");
                            }
                        };
                        var descriptionCallBack = function (queryResult) {
                            if (queryResult.GetQueryError()) {
                                callback(null);
                            }
                            else {
                                var desc = queryResult.GetQueryValue("Description__", 0);
                                if (desc === null) {
                                    // No record found
                                    // Retry with languageIndependant query to validate that the cost center exists
                                    var langIndep = Sys.Helpers.Extend({}, sapConfigForCostCenter, { languageDependent: false });
                                    Sys.ERP.SAP.Browse.SapQuery(validityCheckCallBack_1, "CostCenter", "Description__", filter_1, null, 1, langIndep);
                                }
                                else {
                                    callback(desc);
                                }
                            }
                        };
                        Sys.ERP.SAP.Browse.SapQuery(descriptionCallBack, "CostCenter", "CostCenter__|Description__", filter_1, null, 1, sapConfigForCostCenter);
                    }
                    else {
                        Query.DBQuery(function () {
                            callback(this.GetQueryError() ? null : this.GetQueryValue("Description__", 0));
                        }, "AP - Cost centers__", "Description__", filter_1);
                    }
                }
            }
            Browse.GetCostCenterDescription = GetCostCenterDescription;
            function GetGlAccountDescription(callback, companyCode, glAccount) {
                if (!companyCode || !glAccount) {
                    callback("");
                }
                else {
                    var filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("Account__", glAccount)).toString();
                    if (this.GetBrowseERPName() === "SAP") {
                        Sys.ERP.SAP.Browse.SapQuery(function (queryResult) {
                            callback(queryResult.GetQueryError() ? null : queryResult.GetQueryValue("Description__", 0));
                        }, "GLAccount", "Description__", filter, null, 1, bapiConfigForGlAccountDescription);
                    }
                    else {
                        Query.DBQuery(function () {
                            callback(this.GetQueryError() ? null : this.GetQueryValue("Description__", 0));
                        }, "AP - G/L accounts__", "Description__", filter);
                    }
                }
            }
            Browse.GetGlAccountDescription = GetGlAccountDescription;
            function GetVendor(callback, companyCode, vendorFilter) {
                if (!companyCode || !vendorFilter) {
                    callback("");
                }
                else {
                    var filter = "(&(|(CompanyCode__=" + companyCode + ")(CompanyCode__=)(!(CompanyCode__=*)))(" + vendorFilter + "))"; // Vendor can have no company code
                    var attributes_1 = "Name__|Number__|Street__|PostOfficeBox__|City__|PostalCode__|Region__|Country__|PaymentTermCode__|WithholdingTax__";
                    var customFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetVendorCustomFields");
                    if (customFields) {
                        Sys.Helpers.Array.ForEach(customFields, function (field) {
                            attributes_1 += "|" + field.nameInTable;
                        });
                    }
                    if (this.GetBrowseERPName() === "SAP") {
                        Sys.ERP.SAP.Browse.SapQuery(callback, "Vendor", attributes_1, filter, null, 20, sapConfigForVendor);
                    }
                    else {
                        Query.DBQuery(function () { callback(this.GetQueryValue()); }, "AP - Vendors__", attributes_1, filter, null, 20);
                    }
                }
            }
            Browse.GetVendor = GetVendor;
            function GetVendorByName(callback, companyCode, vendorName) {
                vendorName = Sys.ERP.SAP.Browse.EscapeFilterValueForQuery(vendorName);
                this.GetVendor(callback, companyCode, "Name__=" + vendorName);
            }
            Browse.GetVendorByName = GetVendorByName;
            function GetVendorByNumber(callback, companyCode, vendorNumber) {
                this.GetVendor(callback, companyCode, "Number__=" + vendorNumber);
            }
            Browse.GetVendorByNumber = GetVendorByNumber;
        })(Browse = P2P.Browse || (P2P.Browse = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
